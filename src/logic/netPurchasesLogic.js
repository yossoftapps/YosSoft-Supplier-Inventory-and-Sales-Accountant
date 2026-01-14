// ═══════════════════════════════════════════════════════════════════════════
// صافي المشتريات - محسّن للأداء
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
 * بناء فهارس سريعة للمشتريات - O(n)
 * يقوم بتخزين الكائنات مع الفرز المسبق لتجنب الفرز داخل الحلقات التكرارية
 */
const buildPurchaseIndexes = (purchases) => {
    const indexes = {
        byMaterialCode: new Map(),
        byMaterialAndSupplier: new Map(),
        byMaterialAndExpiry: new Map()
    };

    const addFn = (map, key, item) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
    };

    purchases.forEach((p, idx) => {
        // Cache date for faster sorting
        const item = {
            record: p,
            index: idx,
            _date: new Date(p['تاريخ العملية'])
        };

        const matCode = p['رمز المادة'];
        const supplier = p['المورد'];
        const expiry = p['تاريخ الصلاحية'];

        addFn(indexes.byMaterialCode, matCode, item);
        addFn(indexes.byMaterialAndSupplier, `${matCode}|${supplier}`, item);
        addFn(indexes.byMaterialAndExpiry, `${matCode}|${expiry}`, item);
    });

    // Sort all lists once (Descending by Date)
    const sortFn = (list) => list.sort((a, b) => (b._date - a._date) || (a.index - b.index));

    indexes.byMaterialCode.forEach(sortFn);
    indexes.byMaterialAndSupplier.forEach(sortFn);
    indexes.byMaterialAndExpiry.forEach(sortFn);

    return indexes;
};

/**
 * حساب صافي المشتريات (غير متزامن)
 */
export const calculateNetPurchases = async (allPurchasesRaw, purchaseReturnsRaw, headers = null) => {
    const startTime = performance.now();
    console.log(`🚀 [NetPurchases] معالجة: ${allPurchasesRaw?.length || 0} مشتريات، ${purchaseReturnsRaw?.length || 0} مرتجعات`);

    const allPurchases = convertToObjects(allPurchasesRaw, headers);
    const purchaseReturns = convertToObjects(purchaseReturnsRaw, headers);

    if (allPurchases.length === 0 && purchaseReturns.length === 0) {
        return { netPurchasesList: [], orphanReturnsList: [] };
    }

    // 1. فرز المشتريات حسب التاريخ (مرة واحدة فقط)
    const sortedPurchases = [...allPurchases].sort((a, b) => new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']));

    let netPurchasesList = sortedPurchases;
    for (let i = 0; i < netPurchasesList.length; i++) {
        const p = netPurchasesList[i];
        p['م'] = i + 1;
        p['الكمية'] = roundToDecimalPlaces(parseQuantity(p['الكمية']) || 0, 2);
        p['ملاحظات'] = 'لايوجد مرتجع';
        p['القائمة'] = 'A';
        p['كمية الجرد'] = new Decimal(0);
        p['كمية المبيعات'] = new Decimal(0);
        // Ensure رقم السجل is preserved (or fallback to initial sequence)
        p['رقم السجل'] = p['رقم السجل'] || (i + 1);
        // Compute الإجمالي for quick access (may be updated during matching)
        p['الإجمالي'] = multiply(p['الكمية'], p['الافرادي'] || 0);
    }

    const orphanReturnsList = [];

    console.log(`🔨 [NetPurchases] بناء الفهارس...`);
    const indexes = buildPurchaseIndexes(netPurchasesList);
    console.log(`✅ [NetPurchases] تم بناء ${indexes.byMaterialCode.size} فهرس`);

    // ═══ المطابقة المحسّنة - O(n) ═══
    let matchedCount = 0;
    const totalReturns = purchaseReturns.length;

    for (let returnIdx = 0; returnIdx < totalReturns; returnIdx++) {
        // Yield to browser every 500 records to keep UI alive
        if (returnIdx > 0 && returnIdx % 500 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        const returnRecord = purchaseReturns[returnIdx];
        let remainingReturnQty = roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2);

        if (compare(remainingReturnQty, 0) <= 0) continue;

        let matched = false;
        const retMatCode = returnRecord['رمز المادة'];
        const retSupplier = returnRecord['المورد'];
        const retExpiry = returnRecord['تاريخ الصلاحية'];
        const retPrice = returnRecord['الافرادي'];
        const retQty = returnRecord['الكمية'];
        const retDate = new Date(returnRecord['تاريخ العملية']);

        // دالة المطابقة الموحدة - فائقة الأداء
        const tryMatch = (keyNum, candidateList, filterFn) => {
            if (compare(remainingReturnQty, 0) <= 0 || !candidateList) return;

            // قم بتصفية المرشحين أولًا حسب شروط الفلتر والكمية > 0
            let filtered = candidateList.filter(item => {
                const p = item.record;
                return compare(p['الكمية'], 0) > 0 && filterFn(p, item._date.getTime());
            });

            // للمفاتيح 6،7،8 نفضّل السجلات التي تاريخ صلاحيتها الأقرب لتاريخ المرتجع
            if ((keyNum === 6 || keyNum === 7 || keyNum === 8) && returnRecord['تاريخ الصلاحية']) {
                const retExpiryTime = new Date(returnRecord['تاريخ الصلاحية']).getTime();
                filtered.sort((a, b) => {
                    const aExpiry = a.record['تاريخ الصلاحية'] ? new Date(a.record['تاريخ الصلاحية']).getTime() : Number.POSITIVE_INFINITY;
                    const bExpiry = b.record['تاريخ الصلاحية'] ? new Date(b.record['تاريخ الصلاحية']).getTime() : Number.POSITIVE_INFINITY;
                    const diffA = Math.abs(aExpiry - retExpiryTime);
                    const diffB = Math.abs(bExpiry - retExpiryTime);
                    if (diffA !== diffB) return diffA - diffB; // الأقرب أولًا
                    // إذا تساوى الفرق، احتفظ بترتيب التاريخ/المؤشر الأصلي (الأحدث أولاً)
                    const dateDiff = b._date - a._date;
                    if (dateDiff !== 0) return dateDiff;
                    return a.index - b.index;
                });
            }

            for (let i = 0; i < filtered.length; i++) {
                if (compare(remainingReturnQty, 0) <= 0) break;

                const item = filtered[i];
                const purchaseRecord = item.record;
                const purchaseQty = purchaseRecord['الكمية'];
                matched = true;

                if (compare(purchaseQty, remainingReturnQty) >= 0) {
                    purchaseRecord['الكمية'] = subtract(purchaseQty, remainingReturnQty);
                    purchaseRecord['ملاحظات'] = `مطابق (مفتاح ${keyNum})`;
                    // تحديث الإجمالي بعد تعديل الكمية
                    purchaseRecord['الإجمالي'] = multiply(purchaseRecord['الكمية'], purchaseRecord['الافرادي'] || 0);
                    matchingAudit.recordMatch('NetPurchases', keyNum, returnRecord['م'], purchaseRecord['م'], remainingReturnQty, returnRecord, purchaseRecord);
                    remainingReturnQty = new Decimal(0);
                    matchedCount++;
                    break;
                } else {
                    purchaseRecord['الكمية'] = new Decimal(0);
                    purchaseRecord['ملاحظات'] = `مطابق جزئي (مفتاح ${keyNum})`;
                    purchaseRecord['الإجمالي'] = multiply(purchaseRecord['الكمية'], purchaseRecord['الافرادي'] || 0);
                    matchingAudit.recordMatch('NetPurchases', keyNum, returnRecord['م'], purchaseRecord['م'], purchaseQty, returnRecord, purchaseRecord);
                    remainingReturnQty = subtract(remainingReturnQty, purchaseQty);
                    matchedCount++;
                }
            }
        };

        const matExpKey = `${retMatCode}|${retExpiry}`;
        const matSupKey = `${retMatCode}|${retSupplier}`;

        // Retrieve pre-sorted lists
        const candidates = indexes.byMaterialAndExpiry.get(matExpKey);
        const candidatesSup = indexes.byMaterialAndSupplier.get(matSupKey);
        const candidatesMat = indexes.byMaterialCode.get(retMatCode);

        // المقارنة الزمنية المسبقة لتسريع المفاتيح
        const retDateTime = retDate.getTime();

        tryMatch(1, candidates, (p) =>
            compare(p['الكمية'], retQty) === 0 && p['المورد'] === retSupplier &&
            p['تاريخ الصلاحية'] === retExpiry && p['الافرادي'] === retPrice
        );

        tryMatch(2, candidates, (p, pTime) =>
            retDateTime >= pTime &&
            p['المورد'] === retSupplier && p['تاريخ الصلاحية'] === retExpiry &&
            roundToInteger(p['الافرادي']) == roundToInteger(retPrice)
        );

        tryMatch(3, candidates, (p, pTime) =>
            retDateTime >= pTime &&
            p['المورد'] === retSupplier && p['تاريخ الصلاحية'] === retExpiry
        );

        tryMatch(4, candidates, (p, pTime) =>
            retDateTime >= pTime &&
            p['تاريخ الصلاحية'] === retExpiry && p['الافرادي'] === retPrice
        );

        tryMatch(5, candidates, (p, pTime) =>
            retDateTime >= pTime &&
            p['تاريخ الصلاحية'] === retExpiry
        );

        tryMatch(6, candidatesSup, (p, pTime) =>
            retDateTime >= pTime &&
            p['المورد'] === retSupplier && p['الافرادي'] === retPrice
        );

        tryMatch(7, candidatesSup, (p, pTime) =>
            retDateTime >= pTime &&
            p['المورد'] === retSupplier
        );

        tryMatch(8, candidatesMat, (p, pTime) => retDateTime >= pTime);

        if (!matched) {
            // تحويل المرتجع اليتيم إلى سجل في قائمة المشتريات بقيمة سالبة
            const negQty = subtract(new Decimal(0), roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2));
            const negRec = {
                ...returnRecord,
                'م': netPurchasesList.length + 1,
                'الكمية': negQty,
                'القائمة': 'B',
                'ملاحظات': 'مرتجع يتيـم',
                'الإجمالي': multiply(negQty, returnRecord['الافرادي'] || 0),
                'رقم السجل': returnRecord['رقم السجل'] || `R-${orphanReturnsList.length + 1}`
            };

            netPurchasesList.push(negRec);
            // نترك orphanReturnsList فارغة حسب السياسة الجديدة (مضمونة في netPurchasesList)
        }

        const progressInterval = Math.max(1, Math.floor(purchaseReturns.length * 0.1));
        if ((returnIdx + 1) % progressInterval === 0 || returnIdx === purchaseReturns.length - 1) {
            const percentage = ((returnIdx + 1) / purchaseReturns.length * 100).toFixed(0);
            console.log(`⏳ [NetPurchases] ${returnIdx + 1}/${purchaseReturns.length} (${percentage}% - ${matchedCount} مطابقة)`);
        }
    }

    const originalLength = netPurchasesList.length;
    // إزالة السجلات ذات الكمية صفر وإعادة ترتيب وترقيم السجلات المتبقية
    netPurchasesList = netPurchasesList.filter(p => compare(p['الكمية'], 0) !== 0);

    // تطبيق الفرز النهائي متعدد المستويات: تاريخ العملية (تنازلي)، ثم م (تصاعدي)، ثم تاريخ الصلاحية (تصاعدي)
    netPurchasesList.sort((a, b) => {
        const dateDiff = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
        if (dateDiff !== 0) return dateDiff;
        const mDiff = (a['م'] || 0) - (b['م'] || 0);
        if (mDiff !== 0) return mDiff;
        const aExp = a['تاريخ الصلاحية'] ? new Date(a['تاريخ الصلاحية']) : new Date(8640000000000000);
        const bExp = b['تاريخ الصلاحية'] ? new Date(b['تاريخ الصلاحية']) : new Date(8640000000000000);
        return aExp - bExp;
    });

    for (let i = 0; i < netPurchasesList.length; i++) {
        netPurchasesList[i]['م'] = i + 1;
        // Ensure الإجمالي reflects final الكمية
        netPurchasesList[i]['الإجمالي'] = multiply(netPurchasesList[i]['الكمية'], netPurchasesList[i]['الافرادي'] || 0);
    }

    const totalTime = performance.now() - startTime;
    const throughput = ((allPurchases.length + purchaseReturns.length) / totalTime * 1000).toFixed(0);

    console.log(`✅ [NetPurchases] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms | ⚡ ${throughput} سجل/ث`);
    console.log(`   📊 ${netPurchasesList.length} صافي | ${orphanReturnsList.length} يتيمة | ${originalLength - netPurchasesList.length} محذوفة`);
    console.log(`   🎯 ${matchedCount}/${purchaseReturns.length} (${(matchedCount / purchaseReturns.length * 100).toFixed(1)}%)`);

    return { netPurchasesList, orphanReturnsList };
};