// ═══════════════════════════════════════════════════════════════════════════
// صافي المبيعات - إصدار محسّن للأداء ULTRA
// Net Sales - ULTRA Performance Optimized Version
// ═══════════════════════════════════════════════════════════════════════════

const convertToObjects = (data, headersParam) => {
    if (!data || data.length === 0) return [];
    let headers = headersParam;
    let rows = data;

    if (!headers) {
        const firstRow = data[0];
        const isHeaderLike = Array.isArray(firstRow) && firstRow.every(cell => typeof cell === 'string');
        if (isHeaderLike) {
            headers = firstRow;
            rows = data.slice(1);
        } else {
            return rows.map(row => {
                const obj = {};
                if (Array.isArray(row)) {
                    row.forEach((cell, idx) => { obj[idx] = cell; });
                } else if (row && typeof row === 'object') {
                    return row;
                }
                return obj;
            });
        }
    }

    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => { obj[header] = row[index]; });
        return obj;
    });
};

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
 * حساب صافي المبيعات - محسّن ULTRA
 */
export const calculateNetSales = (allSalesRaw, salesReturnsRaw, headers = null) => {
    const startTime = performance.now();
    console.log(`🚀 [NetSales] معالجة: ${allSalesRaw?.length || 0} مبيعات، ${salesReturnsRaw?.length || 0} مرتجعات`);

    const allSales = convertToObjects(allSalesRaw, headers);
    const salesReturns = convertToObjects(salesReturnsRaw, headers);

    if (allSales.length === 0 && salesReturns.length === 0) {
        return { netSalesList: [], orphanReturnsList: [] };
    }

    const sortedSales = sortByDateDesc([...allSales], 'تاريخ العملية');

    let netSalesList = sortedSales.map((s, index) => {
        const rawQty = s['الكمية'];
        const parsed = parseQuantity(rawQty);
        const qty = parsed ? roundToDecimalPlaces(parsed, 2) : roundToDecimalPlaces(0, 2);
        return {
            ...s,
            'م': index + 1,
            'الكمية': qty,
            'ملاحظات': 'لايوجد مرتجع',
            'القائمة': 'C'
        };
    });

    const orphanReturnsList = [];

    // ═══ بناء الفهارس - O(n) ═══
    console.log(`🔨 [NetSales] بناء الفهارس...`);
    const indexes = buildSalesIndexes(netSalesList);
    console.log(`✅ [NetSales] تم بناء ${indexes.byMaterialCode.size} فهرس`);

    // ═══ المطابقة المحسّنة - O(n) ═══
    let matchedCount = 0;

    for (let returnIdx = 0; returnIdx < salesReturns.length; returnIdx++) {
        const returnRecord = salesReturns[returnIdx];
        let remainingReturnQty = roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2);

        if (compare(remainingReturnQty, 0) <= 0) continue;

        let matched = false;
        const retMatCode = returnRecord['رمز المادة'];
        const retExpiry = returnRecord['تاريخ الصلاحية'];
        const retPrice = returnRecord['الافرادي'];
        const retQty = returnRecord['الكمية'];
        const retDate = new Date(returnRecord['تاريخ العملية']);

        // دالة المطابقة الموحدة
        const tryMatch = (keyNum, candidateList, filterFn) => {
            if (matched || compare(remainingReturnQty, 0) <= 0) return;
            if (!candidateList) return;

            // Iterate over PRE-SORTED candidate list
            for (const { record: saleRecord, index: saleIndex } of candidateList) {
                if (compare(remainingReturnQty, 0) <= 0) break;

                // Skip if sale has no quantity left
                if (compare(saleRecord['الكمية'], 0) <= 0) continue;

                // Apply strategy filter
                if (!filterFn(saleRecord)) continue;

                const saleQty = saleRecord['الكمية'];

                if (compare(saleQty, remainingReturnQty) >= 0) {
                    saleRecord['الكمية'] = subtract(saleQty, remainingReturnQty);
                    saleRecord['ملاحظات'] = `مطابق (مفتاح ${keyNum})`;
                    matchingAudit.recordMatch('NetSales', keyNum, returnRecord['م'], saleRecord['م'], remainingReturnQty, returnRecord, saleRecord);
                    remainingReturnQty = new Decimal(0);
                    matched = true;
                    matchedCount++;
                    break;
                } else {
                    saleRecord['الكمية'] = new Decimal(0);
                    saleRecord['ملاحظات'] = `مطابق جزئي (مفتاح ${keyNum})`;
                    matchingAudit.recordMatch('NetSales', keyNum, returnRecord['م'], saleRecord['م'], saleQty, returnRecord, saleRecord);
                    remainingReturnQty = subtract(remainingReturnQty, saleQty);
                    matched = true;
                    matchedCount++;
                }
            }
        };

        // المفاتيح العشرة بالترتيب
        const matExpKey = `${retMatCode}|${retExpiry}`;

        // Retrieve pre-sorted lists
        const candidates = indexes.byMaterialAndExpiry.get(matExpKey);
        const candidatesMat = indexes.byMaterialCode.get(retMatCode);

        // المفتاح 1: (رمز، صلاحية، سعر، كمية)
        tryMatch(1, candidates, s =>
            s['تاريخ الصلاحية'] === retExpiry && s['الافرادي'] === retPrice &&
            compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 2: (رمز، صلاحية، سعر مقرب، كمية) + تاريخ
        tryMatch(2, candidates, s =>
            retDate >= new Date(s['تاريخ العملية']) &&
            s['تاريخ الصلاحية'] === retExpiry &&
            roundToInteger(s['الافرادي']) === roundToInteger(retPrice) &&
            compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 3: (رمز، صلاحية، كمية) + تاريخ
        tryMatch(3, candidates, s =>
            retDate >= new Date(s['تاريخ العملية']) &&
            s['تاريخ الصلاحية'] === retExpiry && compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 4: (رمز، صلاحية، سعر) + تاريخ
        tryMatch(4, candidates, s =>
            retDate >= new Date(s['تاريخ العملية']) &&
            s['تاريخ الصلاحية'] === retExpiry && s['الافرادي'] === retPrice
        );

        // المفتاح 5: (رمز، صلاحية، سعر مقرب) + تاريخ
        tryMatch(5, candidates, s =>
            retDate >= new Date(s['تاريخ العملية']) &&
            s['تاريخ الصلاحية'] === retExpiry &&
            roundToInteger(s['الافرادي']) === roundToInteger(retPrice)
        );

        // المفتاح 6: (رمز، صلاحية) + تاريخ
        tryMatch(6, candidates, s =>
            retDate >= new Date(s['تاريخ العملية']) &&
            s['تاريخ الصلاحية'] === retExpiry
        );

        // المفتاح 7: (رمز، سعر، كمية) + تاريخ
        tryMatch(7, candidatesMat, s =>
            retDate >= new Date(s['تاريخ العملية']) &&
            s['الافرادي'] === retPrice && compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 8: (رمز، سعر) + تاريخ
        tryMatch(8, candidatesMat, s =>
            retDate >= new Date(s['تاريخ العملية']) &&
            s['الافرادي'] === retPrice
        );

        // المفتاح 9: (رمز، كمية) + تاريخ
        tryMatch(9, candidatesMat, s =>
            retDate >= new Date(s['تاريخ العملية']) &&
            compare(s['الكمية'], retQty) === 0
        );

        // المفتاح 10: (رمز) + تاريخ
        tryMatch(10, candidatesMat, s =>
            retDate >= new Date(s['تاريخ العملية'])
        );

        if (!matched) {
            orphanReturnsList.push({
                ...returnRecord,
                'م': orphanReturnsList.length + 1,
                'الكمية': roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2),
                'القائمة': 'D',
                'ملاحظات': 'مرتجع يتيـم'
            });
        }

        // تقرير تقدم كل 10% من السجلات
        const progressInterval = Math.max(1, Math.floor(salesReturns.length * 0.1));
        if ((returnIdx + 1) % progressInterval === 0 || returnIdx === salesReturns.length - 1) {
            const percentage = ((returnIdx + 1) / salesReturns.length * 100).toFixed(0);
            console.log(`⏳ [NetSales] ${returnIdx + 1}/${salesReturns.length} (${percentage}% - ${matchedCount} مطابقة)`);
        }
    }

    // تصفية وترقيم
    const originalLength = netSalesList.length;
    netSalesList = netSalesList.filter(s => compare(s['الكمية'], 0) > 0);
    netSalesList = netSalesList.map((s, index) => ({ ...s, 'م': index + 1 }));

    const totalTime = performance.now() - startTime;
    const throughput = ((allSales.length + salesReturns.length) / totalTime * 1000).toFixed(0);

    console.log(`✅ [NetSales] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms | ⚡ ${throughput} سجل/ث`);
    console.log(`   📊 ${netSalesList.length} صافي | ${orphanReturnsList.length} يتيمة | ${originalLength - netSalesList.length} محذوفة`);
    console.log(`   🎯 ${matchedCount}/${salesReturns.length} (${(matchedCount / salesReturns.length * 100).toFixed(1)}%)`);

    return { netSalesList, orphanReturnsList };
};
