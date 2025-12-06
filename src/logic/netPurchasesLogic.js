// ═══════════════════════════════════════════════════════════════════════════
// صافي المشتريات - محسّن للأداء
// Net Purchases - Performance Optimized
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
 * حساب صافي المشتريات
 */
export const calculateNetPurchases = (allPurchasesRaw, purchaseReturnsRaw, headers = null) => {
    const startTime = performance.now();
    console.log(`🚀 [NetPurchases] معالجة: ${allPurchasesRaw?.length || 0} مشتريات، ${purchaseReturnsRaw?.length || 0} مرتجعات`);

    const allPurchases = convertToObjects(allPurchasesRaw, headers);
    const purchaseReturns = convertToObjects(purchaseReturnsRaw, headers);

    if (allPurchases.length === 0 && purchaseReturns.length === 0) {
        return { netPurchasesList: [], orphanReturnsList: [] };
    }

    const sortedPurchases = sortByDateDesc([...allPurchases], 'تاريخ العملية');

    let netPurchasesList = sortedPurchases.map((p, index) => {
        const rawQty = p['الكمية'];
        const parsed = parseQuantity(rawQty);
        const qty = parsed ? roundToDecimalPlaces(parsed, 2) : roundToDecimalPlaces(0, 2);
        return {
            ...p,
            'م': index + 1,
            'الكمية': qty,
            'ملاحظات': 'لايوجد مرتجع',
            'القائمة': 'A',
            'كمية الجرد': new Decimal(0),
            'كمية المبيعات': new Decimal(0)
        };
    });

    const orphanReturnsList = [];

    console.log(`🔨 [NetPurchases] بناء الفهارس...`);
    const indexes = buildPurchaseIndexes(netPurchasesList);
    console.log(`✅ [NetPurchases] تم بناء ${indexes.byMaterialCode.size} فهرس`);

    let matchedCount = 0;

    for (let returnIdx = 0; returnIdx < purchaseReturns.length; returnIdx++) {
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

        const tryMatch = (keyNum, candidateList, filterFn) => {
            if (matched || compare(remainingReturnQty, 0) <= 0) return;
            if (!candidateList) return;

            // Iterate over the PRE-SORTED candidate list
            for (const { record: purchaseRecord, index: purchaseIndex } of candidateList) {
                if (compare(remainingReturnQty, 0) <= 0) break;

                // Skip if purchase has no quantity left
                if (compare(purchaseRecord['الكمية'], 0) <= 0) continue;

                // Apply strategy filter
                if (!filterFn(purchaseRecord)) continue;

                const purchaseQty = purchaseRecord['الكمية'];

                if (compare(purchaseQty, remainingReturnQty) >= 0) {
                    purchaseRecord['الكمية'] = subtract(purchaseQty, remainingReturnQty);
                    purchaseRecord['ملاحظات'] = `مطابق (مفتاح ${keyNum})`;
                    matchingAudit.recordMatch('NetPurchases', keyNum, returnRecord['م'], purchaseRecord['م'], remainingReturnQty, returnRecord, purchaseRecord);
                    remainingReturnQty = new Decimal(0);
                    matched = true;
                    matchedCount++;
                    break;
                } else {
                    purchaseRecord['الكمية'] = new Decimal(0);
                    purchaseRecord['ملاحظات'] = `مطابق جزئي (مفتاح ${keyNum})`;
                    matchingAudit.recordMatch('NetPurchases', keyNum, returnRecord['م'], purchaseRecord['م'], purchaseQty, returnRecord, purchaseRecord);
                    remainingReturnQty = subtract(remainingReturnQty, purchaseQty);
                    matched = true;
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

        tryMatch(1, candidates, p =>
            compare(p['الكمية'], retQty) === 0 && p['المورد'] === retSupplier &&
            p['تاريخ الصلاحية'] === retExpiry && p['الافرادي'] === retPrice
        );

        tryMatch(2, candidates, p =>
            retDate >= new Date(p['تاريخ العملية']) &&
            p['المورد'] === retSupplier && p['تاريخ الصلاحية'] === retExpiry &&
            roundToInteger(p['الافرادي']) === roundToInteger(retPrice)
        );

        tryMatch(3, candidates, p =>
            retDate >= new Date(p['تاريخ العملية']) &&
            p['المورد'] === retSupplier && p['تاريخ الصلاحية'] === retExpiry
        );

        tryMatch(4, candidates, p =>
            retDate >= new Date(p['تاريخ العملية']) &&
            p['تاريخ الصلاحية'] === retExpiry && p['الافرادي'] === retPrice
        );

        tryMatch(5, candidates, p =>
            retDate >= new Date(p['تاريخ العملية']) &&
            p['تاريخ الصلاحية'] === retExpiry
        );

        tryMatch(6, candidatesSup, p =>
            retDate >= new Date(p['تاريخ العملية']) &&
            p['المورد'] === retSupplier && p['الافرادي'] === retPrice
        );

        tryMatch(7, candidatesSup, p =>
            retDate >= new Date(p['تاريخ العملية']) &&
            p['المورد'] === retSupplier
        );

        tryMatch(8, candidatesMat, p =>
            retDate >= new Date(p['تاريخ العملية'])
        );

        if (!matched) {
            orphanReturnsList.push({
                ...returnRecord,
                'م': orphanReturnsList.length + 1,
                'الكمية': roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2),
                'القائمة': 'B',
                'ملاحظات': 'مرتجع يتيـم'
            });
        }

        const progressInterval = Math.max(1, Math.floor(purchaseReturns.length * 0.1));
        if ((returnIdx + 1) % progressInterval === 0 || returnIdx === purchaseReturns.length - 1) {
            const percentage = ((returnIdx + 1) / purchaseReturns.length * 100).toFixed(0);
            console.log(`⏳ [NetPurchases] ${returnIdx + 1}/${purchaseReturns.length} (${percentage}% - ${matchedCount} مطابقة)`);
        }
    }

    const originalLength = netPurchasesList.length;
    netPurchasesList = netPurchasesList.filter(p => compare(p['الكمية'], 0) > 0);
    netPurchasesList = netPurchasesList.map((p, index) => ({ ...p, 'م': index + 1 }));

    const totalTime = performance.now() - startTime;
    const throughput = ((allPurchases.length + purchaseReturns.length) / totalTime * 1000).toFixed(0);

    console.log(`✅ [NetPurchases] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms | ⚡ ${throughput} سجل/ث`);
    console.log(`   📊 ${netPurchasesList.length} صافي | ${orphanReturnsList.length} يتيمة | ${originalLength - netPurchasesList.length} محذوفة`);
    console.log(`   🎯 ${matchedCount}/${purchaseReturns.length} (${(matchedCount / purchaseReturns.length * 100).toFixed(1)}%)`);

    return { netPurchasesList, orphanReturnsList };
};