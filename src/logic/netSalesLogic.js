// ═══════════════════════════════════════════════════════════════════════════
// صافي المبيعات - إصدار محسّن للأداء ULTRA
// Net Sales - ULTRA Performance Optimized Version
// ═══════════════════════════════════════════════════════════════════════════

import { convertToObjects } from '../utils/dataUtils.js';

const sortByDateDesc = (data, dateKey) => {
    return data.sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]));
};

import matchingAudit from '../audit/matchingAudit.js';
import {
    roundToInteger, roundToDecimalPlaces, multiply, subtract, add, compare, Decimal, parseQuantity
} from '../utils/financialCalculations.js';

/**
 * بناء فهارس سريعة للمبيعات - O(n)
 */
const buildSalesIndexes = (sales) => {
    const indexes = {
        byMaterialCode: new Map(),
        byMaterialAndExpiry: new Map()
    };

    const addFn = (map, key, item) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
    };

    sales.forEach((s, idx) => {
        // Cache date for faster sorting
        const item = {
            record: s,
            index: idx,
            _date: new Date(s['تاريخ العملية'])
        };

        const matCode = s['رمز المادة'];
        const expiry = s['تاريخ الصلاحية'];

        // فهرس 1: رمز المادة فقط
        addFn(indexes.byMaterialCode, matCode, item);

        // فهرس 2: رمز المادة + تاريخ الصلاحية
        addFn(indexes.byMaterialAndExpiry, `${matCode}|${expiry}`, item);
    });

    // Sort all lists once (Descending by Date)
    const sortFn = (list) => list.sort((a, b) => (b._date - a._date) || (a.index - b.index));

    indexes.byMaterialCode.forEach(sortFn);
    indexes.byMaterialAndExpiry.forEach(sortFn);

    return indexes;
};

/**
 * حساب صافي المبيعات - محسّن ULTRA (غير متزامن)
 */
export const calculateNetSales = async (allSalesRaw, salesReturnsRaw, headers = null) => {
    const startTime = performance.now();
    console.log(`🚀 [NetSales] معالجة: ${allSalesRaw?.length || 0} مبيعات، ${salesReturnsRaw?.length || 0} مرتجعات`);

    const allSales = convertToObjects(allSalesRaw, headers);
    const salesReturns = convertToObjects(salesReturnsRaw, headers);

    if (allSales.length === 0 && salesReturns.length === 0) {
        return { netSalesList: [], orphanReturnsList: [] };
    }

    // 1. فرز المبيعات حسب التاريخ (مرة واحدة فقط)
    const sortedSales = [...allSales].sort((a, b) => new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']));

    let netSalesList = sortedSales;
    for (let i = 0; i < netSalesList.length; i++) {
        const s = netSalesList[i];
        s['م'] = i + 1;
        s['الكمية'] = roundToDecimalPlaces(parseQuantity(s['الكمية']) || 0, 2);
        s['ملاحظات'] = 'لايوجد مرتجع';
        s['القائمة'] = 'C';
        // Ensure رقم السجل is preserved (or fallback to initial sequence)
        s['رقم السجل'] = s['رقم السجل'] || (i + 1);
        // Compute الإجمالي for quick access
        s['الإجمالي'] = multiply(s['الكمية'], s['الافرادي'] || 0);
    }

    const orphanReturnsList = [];

    // ═══ بناء الفهارس - O(n) ═══
    console.log(`🔨 [NetSales] بناء الفهارس...`);
    const indexes = buildSalesIndexes(netSalesList);
    console.log(`✅ [NetSales] تم بناء ${indexes.byMaterialCode.size} فهرس`);

    // ═══ المطابقة المحسّنة - O(n) ═══
    let matchedCount = 0;
    const totalReturns = salesReturns.length;

    for (let returnIdx = 0; returnIdx < totalReturns; returnIdx++) {
        // Yield to browser every 500 records to keep UI alive
        if (returnIdx > 0 && returnIdx % 500 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        const returnRecord = salesReturns[returnIdx];
        let remainingReturnQty = roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2);

        if (compare(remainingReturnQty, 0) <= 0) continue;

        let matched = false;
        const retMatCode = returnRecord['رمز المادة'];
        const retExpiry = returnRecord['تاريخ الصلاحية'];
        const retPrice = returnRecord['الافرادي'];
        const retQty = returnRecord['الكمية'];
        const retDate = new Date(returnRecord['تاريخ العملية']);

        // دالة المطابقة الموحدة - فائقة الأداء
        const tryMatch = (keyNum, candidateList, filterFn) => {
            if (compare(remainingReturnQty, 0) <= 0 || !candidateList) return;

            // Filter candidates first according to filterFn and positive qty
            let filtered = candidateList.filter(item => {
                const s = item.record;
                return compare(s['الكمية'], 0) > 0 && filterFn(s, item._date.getTime());
            });

            // For keys where candidates are material-only (7-10), prefer records with expiry closest to return expiry (if provided)
            if ((keyNum === 7 || keyNum === 8 || keyNum === 9 || keyNum === 10) && returnRecord['تاريخ الصلاحية']) {
                const retExpiryTime = new Date(returnRecord['تاريخ الصلاحية']).getTime();
                filtered.sort((a, b) => {
                    const aExp = a.record['تاريخ الصلاحية'] ? new Date(a.record['تاريخ الصلاحية']).getTime() : Number.POSITIVE_INFINITY;
                    const bExp = b.record['تاريخ الصلاحية'] ? new Date(b.record['تاريخ الصلاحية']).getTime() : Number.POSITIVE_INFINITY;
                    const diffA = Math.abs(aExp - retExpiryTime);
                    const diffB = Math.abs(bExp - retExpiryTime);
                    if (diffA !== diffB) return diffA - diffB; // closest first
                    // fallback to original ordering: newest first by operation date
                    const dateDiff = b._date - a._date;
                    if (dateDiff !== 0) return dateDiff;
                    return a.index - b.index;
                });
            }

            for (let i = 0; i < filtered.length; i++) {
                if (compare(remainingReturnQty, 0) <= 0) break;

                const item = filtered[i];
                const saleRecord = item.record;
                const saleQty = saleRecord['الكمية'];
                matched = true;

                if (compare(saleQty, remainingReturnQty) >= 0) {
                    saleRecord['الكمية'] = subtract(saleQty, remainingReturnQty);
                    saleRecord['ملاحظات'] = `مطابق (مفتاح ${keyNum})`;
                    // Update الإجمالي after quantity change
                    saleRecord['الإجمالي'] = multiply(saleRecord['الكمية'], saleRecord['الافرادي'] || 0);
                    matchingAudit.recordMatch('NetSales', keyNum, returnRecord['م'], saleRecord['م'], remainingReturnQty, returnRecord, saleRecord);
                    remainingReturnQty = new Decimal(0);
                    matchedCount++;
                    break;
                } else {
                    saleRecord['الكمية'] = new Decimal(0);
                    saleRecord['ملاحظات'] = `مطابق جزئي (مفتاح ${keyNum})`;
                    saleRecord['الإجمالي'] = multiply(saleRecord['الكمية'], saleRecord['الافرادي'] || 0);
                    matchingAudit.recordMatch('NetSales', keyNum, returnRecord['م'], saleRecord['م'], saleQty, returnRecord, saleRecord);
                    remainingReturnQty = subtract(remainingReturnQty, saleQty);
                    matchedCount++;
                }
            }
        };

        // المفاتيح العشرة بالترتيب
        const matExpKey = `${retMatCode}|${retExpiry}`;

        // Retrieve pre-sorted lists
        const candidates = indexes.byMaterialAndExpiry.get(matExpKey);
        const candidatesMat = indexes.byMaterialCode.get(retMatCode);

        // المقارنة الزمنية المسبقة لتسريع المفاتيح
        const retDateTime = retDate.getTime();

        // المفتاح 1: (رمز، صلاحية، سعر، كمية) + تاريخ
        tryMatch(1, candidates, (s, sTime) =>
            retDateTime >= sTime &&
            s['تاريخ الصلاحية'] === retExpiry && s['الافرادي'] === retPrice &&
            compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 2: (رمز، صلاحية، سعر مقرب، كمية) + تاريخ
        tryMatch(2, candidates, (s, sTime) =>
            retDateTime >= sTime &&
            s['تاريخ الصلاحية'] === retExpiry &&
            roundToInteger(s['الافرادي']) == roundToInteger(retPrice) &&
            compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 3: (رمز، صلاحية، كمية) + تاريخ
        tryMatch(3, candidates, (s, sTime) =>
            retDateTime >= sTime &&
            s['تاريخ الصلاحية'] === retExpiry && compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 4: (رمز، صلاحية، سعر) + تاريخ
        tryMatch(4, candidates, (s, sTime) =>
            retDateTime >= sTime &&
            s['تاريخ الصلاحية'] === retExpiry && s['الافرادي'] === retPrice
        );

        // المفتاح 5: (رمز، صلاحية، سعر مقرب) + تاريخ
        tryMatch(5, candidates, (s, sTime) =>
            retDateTime >= sTime &&
            s['تاريخ الصلاحية'] === retExpiry &&
            roundToInteger(s['الافرادي']) == roundToInteger(retPrice)
        );

        // المفتاح 6: (رمز، صلاحية) + تاريخ
        tryMatch(6, candidates, (s, sTime) =>
            retDateTime >= sTime &&
            s['تاريخ الصلاحية'] === retExpiry
        );

        // المفتاح 7: (رمز، سعر، كمية) + تاريخ
        tryMatch(7, candidatesMat, (s, sTime) =>
            retDateTime >= sTime &&
            s['الافرادي'] === retPrice && compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 8: (رمز، سعر) + تاريخ
        tryMatch(8, candidatesMat, (s, sTime) =>
            retDateTime >= sTime &&
            s['الافرادي'] === retPrice
        );

        // المفتاح 9: (رمز، كمية) + تاريخ
        tryMatch(9, candidatesMat, (s, sTime) =>
            retDateTime >= sTime &&
            compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 10: (رمز) + تاريخ
        tryMatch(10, candidatesMat, (s, sTime) => retDateTime >= sTime);

        if (!matched) {
            // Convert orphan return into a negative sale record in the main list
            const negQty = subtract(new Decimal(0), roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2));
            const negRec = {
                ...returnRecord,
                'م': netSalesList.length + 1,
                'الكمية': negQty,
                'القائمة': 'D',
                'ملاحظات': 'مرتجع يتيـم',
                'الإجمالي': multiply(negQty, returnRecord['الافرادي'] || 0),
                'رقم السجل': returnRecord['رقم السجل'] || `R-${orphanReturnsList.length + 1}`
            };

            netSalesList.push(negRec);
            // keep orphanReturnsList empty (policy: represent as negative records)
        }

        // تقرير تقدم كل 10% من السجلات
        const progressInterval = Math.max(1, Math.floor(salesReturns.length * 0.1));
        if ((returnIdx + 1) % progressInterval === 0 || returnIdx === salesReturns.length - 1) {
            const percentage = ((returnIdx + 1) / salesReturns.length * 100).toFixed(0);
            console.log(`⏳ [NetSales] ${returnIdx + 1}/${salesReturns.length} (${percentage}% - ${matchedCount} مطابقة)`);
        }
    }

    // Remove zero-quantity records (keep negative orphan records), then final sort and renumber
    const originalLength = netSalesList.length;
    netSalesList = netSalesList.filter(s => compare(s['الكمية'], 0) !== 0);

    // Final multi-level sort: تاريخ العملية (desc), then م (asc), then تاريخ الصلاحية (asc)
    netSalesList.sort((a, b) => {
        const dateDiff = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
        if (dateDiff !== 0) return dateDiff;
        const mDiff = (a['م'] || 0) - (b['م'] || 0);
        if (mDiff !== 0) return mDiff;
        const aExp = a['تاريخ الصلاحية'] ? new Date(a['تاريخ الصلاحية']) : new Date(8640000000000000);
        const bExp = b['تاريخ الصلاحية'] ? new Date(b['تاريخ الصلاحية']) : new Date(8640000000000000);
        return aExp - bExp;
    });

    for (let i = 0; i < netSalesList.length; i++) {
        netSalesList[i]['م'] = i + 1;
        netSalesList[i]['الإجمالي'] = multiply(netSalesList[i]['الكمية'], netSalesList[i]['الافرادي'] || 0);
    }

    const totalTime = performance.now() - startTime;
    const throughput = ((allSales.length + salesReturns.length) / totalTime * 1000).toFixed(0);

    console.log(`✅ [NetSales] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms | ⚡ ${throughput} سجل/ث`);
    console.log(`   📊 ${netSalesList.length} صافي | ${orphanReturnsList.length} يتيمة | ${originalLength - netSalesList.length} محذوفة`);
    console.log(`   🎯 ${matchedCount}/${salesReturns.length} (${(matchedCount / salesReturns.length * 100).toFixed(1)}%)`);

    return { netSalesList, orphanReturnsList };
};
