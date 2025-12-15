// ═══════════════════════════════════════════════════════════════════════════
// فائض المخزون - محسّن للأداء
// Excess Inventory - Performance Optimized
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
    Decimal
} from '../utils/financialCalculations.js';

const convertToObjects = (data) => {
    if (!data || data.length < 2) return [];
    const headers = data[0];
    return data.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });
};

export const calculateExcessInventory = (physicalInventoryRaw, salesRaw, netPurchasesList, netSalesList) => {
    const startTime = performance.now();

    const physicalInventory = convertToObjects(physicalInventoryRaw);
    const allSales = convertToObjects(salesRaw);

    console.log(`🚀 [ExcessInventory] معالجة: ${physicalInventory.length} جرد، ${allSales.length} مبيعات`);

    // خارطة لتجميع كميات المشتريات (صافي المشتريات المدمج: A + D)
    const purchasesMap = new Map();
    if (netPurchasesList) {
        netPurchasesList.forEach(item => {
            const code = item['رمز المادة'];
            const qty = roundToDecimalPlaces(item['الكمية'] || 0, 2);
            const current = purchasesMap.get(code) || new Decimal(0);
            purchasesMap.set(code, add(current, qty));
        });
    }

    // خارطة لتجميع كميات المبيعات (صافي المبيعات المدمج: C + B + F)
    const netSalesMap = new Map();
    if (netSalesList) {
        netSalesList.forEach(item => {
            const code = item['رمز المادة'];
            const qty = roundToDecimalPlaces(item['الكمية'] || 0, 2);
            const current = netSalesMap.get(code) || new Decimal(0);
            netSalesMap.set(code, add(current, qty));
        });
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const salesMap = new Map();
    for (const sale of allSales) {
        if (sale['نوع العملية'] === 'مبيعات') {
            const saleDate = new Date(sale['تاريخ العملية']);
            if (saleDate >= ninetyDaysAgo) {
                const code = sale['رمز المادة'];
                const quantity = roundToDecimalPlaces(sale['الكمية'] || 0, 2);
                const currentValue = salesMap.get(code) || new Decimal(0);
                salesMap.set(code, add(currentValue, quantity));
            }
        }
    }

    const inventoryMap = new Map();
    for (const item of physicalInventory) {
        const code = item['رمز المادة'];
        const quantity = roundToDecimalPlaces(item['الكمية'] || 0, 2);
        if (!inventoryMap.has(code)) {
            inventoryMap.set(code, {
                'رمز المادة': code,
                'اسم المادة': item['اسم المادة'],
                'الوحدة': item['الوحدة'],
                'الكمية': new Decimal(0),
            });
        }
        const currentValue = inventoryMap.get(code)['الكمية'];
        inventoryMap.get(code)['الكمية'] = add(currentValue, quantity);
    }

    const excessInventoryReport = [];
    for (const [code, inventoryItem] of inventoryMap.entries()) {
        const totalQuantity = inventoryItem['الكمية'];
        const totalSales = salesMap.get(code) || new Decimal(0); // This is 90-days sales
        const totalPurchases = purchasesMap.get(code) || new Decimal(0);
        const totalNetSales = netSalesMap.get(code) || new Decimal(0);

        const excess = subtract(totalQuantity, totalSales);

        // إذا كانت الكمية صفر والمبيعات صفر، يتم تجاهل السجل
        if (compare(totalQuantity, 0) === 0 && compare(totalSales, 0) === 0) {
            continue;
        }

        let statusText = '';
        if (compare(totalSales, 0) === 0 && compare(totalQuantity, 0) > 0) {
            statusText = 'راكد تماما';
        } else if (compare(excess, 0) < 0) {
            statusText = 'احتياج';
        } else if (compare(excess, 0) > 0) {
            statusText = 'مخزون زائد';
        } else {
            statusText = 'مناسب';
        }

        // حساب نسبة الفائض (Excess Percentage)
        let excessPercentage = -100;
        if (compare(totalQuantity, 0) !== 0) {
            // (Excess / TotalQuantity) * 100
            try {
                const ratio = excess.div(totalQuantity);
                excessPercentage = roundToInteger(multiply(ratio, 100)).toNumber();
            } catch (e) {
                excessPercentage = 0;
            }
        }

        // حساب نسبة المبيعات (Sales Percentage)
        let salesPercentage = 0;
        if (compare(totalPurchases, 0) === 0) {
            salesPercentage = 100;
        } else {
            try {
                const ratio = totalNetSales.div(totalPurchases);
                salesPercentage = roundToInteger(multiply(ratio, 100)).toNumber();
            } catch (e) {
                salesPercentage = 0;
            }
        }

        // حساب معد للارجاع
        let preparedForReturn = new Decimal(0);
        if (compare(excess, 0) > 0) {
            preparedForReturn = roundToInteger(excess);
        }

        // حساب الاحتياج
        let needQuantity = new Decimal(0);
        if (compare(excess, 0) < 0) {
            // Excess is negative (e.g., -5.2). Round to -5. Abs is 5.
            // Or Round(-5.2) -> -5. Abs(-5) -> 5.
            needQuantity = roundToInteger(excess).abs();
        }

        excessInventoryReport.push({
            ...inventoryItem,
            'كمية المشتريات': totalPurchases,
            'كمية المبيعات': totalNetSales,
            'نسبة المبيعات': salesPercentage + '%',
            'المبيعات': totalSales,
            'فائض المخزون': excess,
            'نسبة الفائض': excessPercentage + '%',
            'معد للارجاع': preparedForReturn,
            'الاحتياج': needQuantity,
            'بيان الفائض': statusText,
        });
    }

    const totalTime = performance.now() - startTime;
    console.log(`✅ [ExcessInventory] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${excessInventoryReport.length} مادة`);

    return excessInventoryReport;
};