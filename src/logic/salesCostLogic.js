// ═══════════════════════════════════════════════════════════════════════════
// تكلفة المبيعات - محسّن للأداء
// Sales Cost - Performance Optimized
// ═══════════════════════════════════════════════════════════════════════════

import {
    roundToInteger,
    roundToDecimalPlaces,
    formatMoney,
    formatQuantity,
    multiply,
    subtract,
    add,
    compare,
    divide,
    Decimal
} from '../utils/financialCalculations.js';

import { convertToObjects } from '../utils/dataUtils.js';

const sortByDateAsc = (data, dateKey) => {
    return data.sort((a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
};

export const calculateSalesCost = async (netPurchasesList, netSalesList) => {
    const startTime = performance.now();
    const purchases = [...(netPurchasesList || [])];
    const sales = [...(netSalesList || [])];

    console.log(`🚀 [SalesCost] معالجة: ${sales.length} مبيعات مقابل ${purchases.length} مشتريات`);

    // 1. Prepare Purchase Stock with mutable remaining quantity
    const purchaseStock = purchases;
    for (let i = 0; i < purchaseStock.length; i++) {
        const p = purchaseStock[i];
        const d = new Date(p['تاريخ العملية']);
        p.remainingQuantity = roundToDecimalPlaces(p['الكمية'] || 0, 2);
        p._dateVal = d.getTime();
        p._expiryVal = p['تاريخ الصلاحية'];
    }

    // 2. Index purchases by Item Code (optimization)
    // This allows O(1) lookup instead of O(N) filtering
    const purchasesByItem = new Map();
    purchaseStock.forEach(p => {
        const itemCode = p['رمز المادة'];
        if (!purchasesByItem.has(itemCode)) {
            purchasesByItem.set(itemCode, []);
        }
        purchasesByItem.get(itemCode).push(p);
    });

    // 3. Sort purchases within each item group by date (FIFO)
    purchasesByItem.forEach(group => {
        // Sort by date ascending (using cached numeric value)
        group.sort((a, b) => a._dateVal - b._dateVal);
    });

    const getMatchingKeys = (saleRecord, saleDateVal) => [
        // Strategy 1: Exact match on Expiry Date + Same Quantity
        (p) => saleDateVal >= p._dateVal &&
            p._expiryVal === saleRecord['تاريخ الصلاحية'] &&
            compare(p['الكمية'], saleRecord['الكمية']) === 0,

        // Strategy 2: Exact match on Expiry Date
        (p) => saleDateVal >= p._dateVal &&
            p._expiryVal === saleRecord['تاريخ الصلاحية'],

        // Strategy 3: Standard FIFO
        (p) => saleDateVal >= p._dateVal,

        // Strategy 4: Fuzzy date match (Purchased within 3 days after sale)
        (p) => (p._dateVal - saleDateVal) <= (3 * 24 * 60 * 60 * 1000) &&
            saleDateVal < p._dateVal
    ];

    const purchaseUsageMap = new Map();

    const salesCostList = [];
    for (let index = 0; index < sales.length; index++) {
        // Yield to browser every 500 records
        if (index > 0 && index % 500 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        const sale = sales[index];
        const saleQuantity = roundToDecimalPlaces(sale['الكمية'] || 0, 2);
        let remainingSaleQty = saleQuantity;
        let totalCost = new Decimal(0);
        let purchaseDetails = [];
        let matched = false;
        let notes = 'لايوجد مشتريات';

        const dObj = new Date(sale['تاريخ العملية']);
        const saleDateVal = dObj.getTime();
        const itemCode = sale['رمز المادة'];

        // Get only purchases for this item
        const itemPurchases = purchasesByItem.get(itemCode) || [];

        if (itemPurchases.length > 0) {
            const matchingKeys = getMatchingKeys(sale, saleDateVal);

            for (let keyIndex = 0; keyIndex < matchingKeys.length; keyIndex++) {
                if (compare(remainingSaleQty, 0) <= 0) break;

                const keyFunction = matchingKeys[keyIndex];

                // Filter valid purchases for this strategy
                // Note: itemPurchases is ALREADY sorted by date, so we don't need to sort again
                // We just need to filter and pick

                // However, for correct FIFO within a strategy (like Strategy 2), 
                // we iterate through the pre-sorted list and pick what matches.
                // We do NOT need to create a new array with filter() and then iterate.
                // We can just iterate once.

                // But wait, key strategies might prioritize differently.
                // The original code did:
                // 1. FILTER by key strategy
                // 2. SORT filtered results by date
                // 3. CONSUME

                // Since itemPurchases is ALREADY sorted by date, step 2 is redundant IF the filter preserves order (which it does).
                // So checking linearly is correct and efficient.

                for (const purchase of itemPurchases) {
                    if (compare(remainingSaleQty, 0) <= 0) break;

                    // Skip if no remaining quantity
                    if (compare(purchase.remainingQuantity, 0) <= 0) continue;

                    // Check if matches current strategy
                    if (keyFunction(purchase)) {
                        const quantityToTake = compare(purchase.remainingQuantity, remainingSaleQty) < 0
                            ? purchase.remainingQuantity
                            : remainingSaleQty;

                        const unitPrice = roundToInteger(purchase['الافرادي'] || 0);
                        const costOfTaken = multiply(quantityToTake, unitPrice);

                        purchase.remainingQuantity = subtract(purchase.remainingQuantity, quantityToTake);

                        // Update Purchase Usage Map
                        const pId = purchase['_uid'] || purchase['م'];
                        const currentUsage = purchaseUsageMap.get(pId) || new Decimal(0);
                        purchaseUsageMap.set(pId, add(currentUsage, quantityToTake));
                        totalCost = add(totalCost, costOfTaken);

                        purchaseDetails.push({
                            purchaseDate: purchase['تاريخ العملية'],
                            purchaseUnitPrice: unitPrice,
                            quantityMatched: quantityToTake,
                            purchaseBatch: purchase['رقم السجل'],
                            purchaseSupplier: purchase['المورد']
                        });

                        remainingSaleQty = subtract(remainingSaleQty, quantityToTake);
                        matched = true;
                        notes = 'مطابق';
                    }
                }

                if (matched && compare(remainingSaleQty, 0) <= 0) break;
            }
        }

        const saleUnitPrice = roundToInteger(sale['الافرادي'] || 0);
        const totalSaleValue = multiply(saleQuantity, saleUnitPrice);
        const totalProfit = subtract(totalSaleValue, totalCost);
        // قبل: هامش الربح حسب الربح/التكلفة. الآن: نسبة التكلفة من السعر (التكلفة / السعر) وفق الوثيقة
        const costPercent = compare(totalSaleValue, 0) > 0
            ? multiply(divide(totalCost, totalSaleValue), 100)
            : new Decimal(0);

        const purchaseDateVal = purchaseDetails.length > 0 ? new Date(purchaseDetails[0].purchaseDate).getTime() : null;
        const inventoryAge = purchaseDateVal ? Math.floor((saleDateVal - purchaseDateVal) / (1000 * 60 * 60 * 24)) : 0;

        // Calculate profitability status based on total profit
        // Use a small epsilon to handle potential floating point precision issues
        const profitValue = totalProfit.toNumber();
        let profitabilityStatus = 'مطابق';
        if (profitValue > 0.01) {  // Small positive profit
            profitabilityStatus = 'ربح';
        } else if (profitValue < -0.01) {  // Small negative profit (loss)
            profitabilityStatus = 'خسارة';
        } else {  // Profit is essentially zero (break-even)
            profitabilityStatus = 'مطابق';
        }

        if (compare(remainingSaleQty, 0) > 0 && matched) {
            notes = 'لا يوجد مشتريات كافية';
        } else if (!matched) {
            notes = 'لايوجد مشتريات';
        }

        let purchaseUnitPrice = new Decimal(0);
        if (compare(totalCost, 0) > 0 && compare(saleQuantity, 0) > 0) {
            try {
                purchaseUnitPrice = roundToInteger(divide(totalCost, saleQuantity));
            } catch (e) {
                purchaseUnitPrice = new Decimal(0);
            }
        }

        let profitUnitPrice = saleUnitPrice;
        if (compare(purchaseUnitPrice, 0) > 0) {
            try {
                profitUnitPrice = roundToInteger(subtract(saleUnitPrice, purchaseUnitPrice));
            } catch (e) {
                profitUnitPrice = saleUnitPrice;
            }
        }

        const progressInterval = Math.max(1, Math.floor(sales.length * 0.1));
        if ((index + 1) % progressInterval === 0 || index === sales.length - 1) {
            const percentage = ((index + 1) / sales.length * 100).toFixed(0);
            console.log(`⏳ [SalesCost] ${index + 1}/${sales.length} (${percentage}%)`);
        }

        salesCostList.push({
            'م': index + 1,
            'رمز المادة': sale['رمز المادة'],
            'اسم المادة': sale['اسم المادة'],
            'الوحدة': sale['الوحدة'],
            'الكمية': formatQuantity(saleQuantity),
            'تاريخ الصلاحية': sale['تاريخ الصلاحية'],
            'تاريخ العملية': sale['تاريخ العملية'],
            'الافرادي': formatMoney(saleUnitPrice),
            'افرادي الشراء': formatMoney(purchaseUnitPrice),
            'تاريخ الشراء': purchaseDetails.length > 0 ? purchaseDetails[0].purchaseDate : '',
            'المورد': purchaseDetails.length > 0 ? (purchaseDetails[0].purchaseSupplier || purchaseDetails[0].purchaseBatch) : '',
            'رقم السجل': sale['رقم السجل'],
            'افرادي الربح': formatMoney(profitUnitPrice),
            'نسبة الربح': roundToInteger(costPercent).toString() + '%',
            'اجمالي الربح': formatMoney(totalProfit),
            'عمر العملية': inventoryAge.toString(),
            'بيان الربحية': profitabilityStatus,
            'ملاحظات': notes
        });
    }


    const totalTime = performance.now() - startTime;
    console.log(`✅ [SalesCost] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${salesCostList.length} عملية`);

    return {
        costOfSalesList: salesCostList,
        purchaseUsageMap
    };
};