// ═══════════════════════════════════════════════════════════════════════════
// منطق ملخص الحسابات الرئيسية (Main Accounts Summary Logic)
// Main Accounts Summary Logic
// ═══════════════════════════════════════════════════════════════════════════

import { add, subtract, roundToInteger, Decimal } from '../utils/financialCalculations';

/**
 * Calculates the main accounts summary by grouping suppliers payables data by "الحساب المساعد"
 * @param {Array} suppliersPayablesList - List of suppliers payables data
 * @returns {Array} Summary data grouped by main accounts
 */
export const calculateMainAccountsSummary = (suppliersPayablesList) => {
    if (!suppliersPayablesList || suppliersPayablesList.length === 0) return [];

    const summaryMap = new Map();

    suppliersPayablesList.forEach(item => {
        // تنظيف الاسم (إزالة مسافات زائدة) لتجميع دقيق
        // Clean the name (remove extra spaces) for accurate grouping
        const rawName = item['الحساب المساعد'];
        const accountName = rawName ? String(rawName).trim() : 'غير محدد';

        if (!summaryMap.has(accountName)) {
            summaryMap.set(accountName, {
                'الحساب الرئيسي': accountName,
                'عدد الموردين': 0,
                'إجمالي المديونية': new Decimal(0),
                'إجمالي قيمة المخزون': new Decimal(0),
                'إجمالي الاستحقاق': new Decimal(0),
                // New fields for detailed inventory analysis
                'فائض المخزون': new Decimal(0),
                'معد للارجاع': new Decimal(0),
                'مخزون مثالي': new Decimal(0),
                'اصناف جديدة': new Decimal(0),
                'الاحتياج': new Decimal(0)
            });
        }

        const summaryEntry = summaryMap.get(accountName);
        
        // زيادة عدد الموردين
        // Increment supplier count
        summaryEntry['عدد الموردين'] += 1;
        
        // جمع المديونية (الرصيد)
        // Sum debt (balance)
        const debt = item['الرصيد'] || 0;
        summaryEntry['إجمالي المديونية'] = add(summaryEntry['إجمالي المديونية'], new Decimal(debt));
        
        // جمع قيمة المخزون
        // Sum inventory value
        const inventoryValue = item['قيمة المخزون'] || 0;
        summaryEntry['إجمالي قيمة المخزون'] = add(summaryEntry['إجمالي قيمة المخزون'], new Decimal(inventoryValue));
        
        // جمع المبلغ المستحق
        // Sum due amount
        const dueAmount = item['المبلغ المستحق'] || 0;
        summaryEntry['إجمالي الاستحقاق'] = add(summaryEntry['إجمالي الاستحقاق'], new Decimal(dueAmount));
        
        // جمع القيم الجديدة للتقارير التفصيلية
        // Sum new fields for detailed inventory analysis
        const excessValue = item['فائض المخزون'] || 0;
        summaryEntry['فائض المخزون'] = add(summaryEntry['فائض المخزون'], new Decimal(excessValue));
        
        const returnValue = item['معد للارجاع'] || 0;
        summaryEntry['معد للارجاع'] = add(summaryEntry['معد للارجاع'], new Decimal(returnValue));
        
        const idealValue = item['مخزون مثالي'] || 0;
        summaryEntry['مخزون مثالي'] = add(summaryEntry['مخزون مثالي'], new Decimal(idealValue));
        
        const newValue = item['اصناف جديدة'] || 0;
        summaryEntry['اصناف جديدة'] = add(summaryEntry['اصناف جديدة'], new Decimal(newValue));
        
        const needValue = item['الاحتياج'] || 0;
        summaryEntry['الاحتياج'] = add(summaryEntry['الاحتياج'], new Decimal(needValue));
    });

    // تحويل الخريطة إلى مصفوفة وحساب صافي الفجوة
    // Convert map to array and calculate net gap
    const result = Array.from(summaryMap.values()).map(entry => {
        // حساب صافي الفجوة: إجمالي قيمة المخزون + إجمالي المديونية (المديونية سالبة)
        // Calculate net gap: Total inventory value + Total debt (debt is negative)
        const netGap = add(entry['إجمالي قيمة المخزون'], entry['إجمالي المديونية']);
        
        return {
            ...entry,
            'صافي الفجوة': netGap,
            'إجمالي المديونية': entry['إجمالي المديونية'].toNumber(),
            'إجمالي قيمة المخزون': entry['إجمالي قيمة المخزون'].toNumber(),
            'صافي الفجوة': netGap.toNumber(),
            'إجمالي الاستحقاق': entry['إجمالي الاستحقاق'].toNumber(),
            // Convert new fields to numbers
            'فائض المخزون': entry['فائض المخزون'].toNumber(),
            'معد للارجاع': entry['معد للارجاع'].toNumber(),
            'مخزون مثالي': entry['مخزون مثالي'].toNumber(),
            'اصناف جديدة': entry['اصناف جديدة'].toNumber(),
            'الاحتياج': entry['الاحتياج'].toNumber()
        };
    });

    // إعادة ترقيم المدخلات
    // Renumber entries
    result.forEach((item, idx) => item['م'] = idx + 1);

    return result;
};