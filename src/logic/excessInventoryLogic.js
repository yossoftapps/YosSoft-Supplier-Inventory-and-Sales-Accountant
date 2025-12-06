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

export const calculateExcessInventory = (physicalInventoryRaw, salesRaw) => {
    const startTime = performance.now();

    const physicalInventory = convertToObjects(physicalInventoryRaw);
    const allSales = convertToObjects(salesRaw);

    console.log(`🚀 [ExcessInventory] معالجة: ${physicalInventory.length} جرد، ${allSales.length} مبيعات`);

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
        const totalSales = salesMap.get(code) || new Decimal(0);
        const excess = subtract(totalQuantity, totalSales);

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

        excessInventoryReport.push({
            ...inventoryItem,
            'المبيعات': totalSales,
            'فائض المخزون': excess,
            'بيان الفائض': statusText,
        });
    }

    const totalTime = performance.now() - startTime;
    console.log(`✅ [ExcessInventory] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${excessInventoryReport.length} مادة`);

    return excessInventoryReport;
};