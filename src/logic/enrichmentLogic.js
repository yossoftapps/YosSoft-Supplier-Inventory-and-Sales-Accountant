// ═══════════════════════════════════════════════════════════════════════════
// منطق إثراء البيانات (Enrichment Logic)
// يستخدم لاستكمال البيانات الناقصة في التقارير بناءً على نتائج التقارير الأخرى
// ═══════════════════════════════════════════════════════════════════════════

import { add, Decimal, formatQuantity } from '../utils/financialCalculations.js';

export const enrichNetPurchases = (originalNetPurchasesList, purchaseUsageMap, updatedNetPurchasesList) => {
    if (!originalNetPurchasesList) return [];

    // 1. حساب كميات الجرد من القائمة المحدثة (التي تم تقسيمها في المخزون النهائي)
    const physUsageMap = new Map();

    if (updatedNetPurchasesList) {
        updatedNetPurchasesList.forEach(item => {
            const m = item['_uid'] || item['م'];
            const qty = item['كمية الجرد'] || 0;

            const current = physUsageMap.get(m) || new Decimal(0);
            physUsageMap.set(m, add(current, qty));
        });
    }

    // 2. تحديث القائمة الأصلية
    return originalNetPurchasesList.map(item => {
        const m = item['_uid'] || item['م'];

        // كمية المبيعات من Sales Cost Logic
        const salesQty = purchaseUsageMap?.get(m) || new Decimal(0);

        // كمية الجرد من Ending Inventory Logic
        const physQty = physUsageMap.get(m) || new Decimal(0);

        return {
            ...item,
            'كمية المبيعات': salesQty, // formatQuantity(salesQty), // Keep as Decimal/Number for consistency? Or format? Usually Logic returns numbers.
            'كمية الجرد': physQty,
            'رقم السجل': String(item['م']) // إعادة رقم السجل للأصل (رقم السجل المسلسل)
        };
    });
};
