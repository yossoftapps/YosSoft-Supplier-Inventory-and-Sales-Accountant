// ═══════════════════════════════════════════════════════════════════════════
// منطق ملخص الحسابات الرئيسية (Main Accounts Summary Logic)
// Main Accounts Summary Logic
// ═══════════════════════════════════════════════════════════════════════════

import { add, subtract, Decimal } from '../utils/financialCalculations.js';

/**
 * Calculates the main accounts summary by grouping suppliers payables data by "الحساب المساعد"
 * @param {Array} suppliersPayablesList - List of suppliers payables data
 * @returns {Array} Summary data grouped by main accounts
 */
export const calculateMainAccountsSummary = async (suppliersPayablesList) => {
    if (!suppliersPayablesList || suppliersPayablesList.length === 0) return [];

    const summaryMap = new Map();

    for (let i = 0; i < suppliersPayablesList.length; i++) {
        if (i > 0 && i % 500 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        const item = suppliersPayablesList[i];

        const rawName = item['الحساب المساعد'];
        const accountName = rawName ? String(rawName).trim() : 'غير محدد';

        if (!summaryMap.has(accountName)) {
            summaryMap.set(accountName, {
                'الحساب المساعد': accountName,
                'عدد الموردين': 0,
                'إجمالي المديونية': new Decimal(0),
                'إجمالي قيمة المخزون': new Decimal(0),
                'إجمالي الاستحقاق': new Decimal(0),
                'فائض المخزون': new Decimal(0),
                'معد للارجاع': new Decimal(0),
                'مخزون مثالي': new Decimal(0),
                'اصناف جديدة': new Decimal(0),
                'الاحتياج': new Decimal(0),
                'منتهي': new Decimal(0),
                'راكد تماما': new Decimal(0),
                'قريب جدا': new Decimal(0),
                'مخزون زائد': new Decimal(0),
            });
        }

        const summaryEntry = summaryMap.get(accountName);
        summaryEntry['عدد الموردين'] += 1;

        summaryEntry['إجمالي المديونية'] = add(summaryEntry['إجمالي المديونية'], new Decimal(item['الرصيد'] || 0));
        summaryEntry['إجمالي قيمة المخزون'] = add(summaryEntry['إجمالي قيمة المخزون'], new Decimal(item['قيمة المخزون'] || 0));
        summaryEntry['إجمالي الاستحقاق'] = add(summaryEntry['إجمالي الاستحقاق'], new Decimal(item['المبلغ المستحق'] || 0));
        summaryEntry['فائض المخزون'] = add(summaryEntry['فائض المخزون'], new Decimal(item['فائض المخزون'] || 0));
        summaryEntry['معد للارجاع'] = add(summaryEntry['معد للارجاع'], new Decimal(item['معد للارجاع'] || 0));
        summaryEntry['مخزون مثالي'] = add(summaryEntry['مخزون مثالي'], new Decimal(item['مخزون مثالي'] || 0));
        summaryEntry['اصناف جديدة'] = add(summaryEntry['اصناف جديدة'], new Decimal(item['اصناف جديدة'] || 0));
        summaryEntry['الاحتياج'] = add(summaryEntry['الاحتياج'], new Decimal(item['الاحتياج'] || 0));
        summaryEntry['منتهي'] = add(summaryEntry['منتهي'], new Decimal(item['منتهي'] || 0));
        summaryEntry['راكد تماما'] = add(summaryEntry['راكد تماما'], new Decimal(item['راكد تماما'] || 0));
        summaryEntry['قريب جدا'] = add(summaryEntry['قريب جدا'], new Decimal(item['قريب جدا'] || 0));
        summaryEntry['مخزون زائد'] = add(summaryEntry['مخزون زائد'], new Decimal(item['مخزون زائد'] || 0));
    }

    const result = Array.from(summaryMap.values()).map(entry => {
        const netGap = subtract(entry['إجمالي قيمة المخزون'], entry['إجمالي المديونية']);
        return {
            'الحساب الرئيسي': entry['الحساب الرئيسي'],
            'عدد الموردين': entry['عدد الموردين'],
            'إجمالي المديونية': entry['إجمالي المديونية'].toNumber(),
            'إجمالي قيمة المخزون': entry['إجمالي قيمة المخزون'].toNumber(),
            'صافي الفجوة': netGap.toNumber(),
            'إجمالي الاستحقاق': entry['إجمالي الاستحقاق'].toNumber(),
            'فائض المخزون': entry['فائض المخزون'].toNumber(),
            'معد للارجاع': entry['معد للارجاع'].toNumber(),
            'مخزون مثالي': entry['مخزون مثالي'].toNumber(),
            'اصناف جديدة': entry['اصناف جديدة'].toNumber(),
            'الاحتياج': entry['الاحتياج'].toNumber(),
            'منتهي': entry['منتهي'].toNumber(),
            'راكد تماما': entry['راكد تماما'].toNumber(),
            'قريب جدا': entry['قريب جدا'].toNumber(),
            'مخزون زائد': entry['مخزون زائد'].toNumber(),
        };
    });

    result.forEach((item, idx) => {
        item['م'] = idx + 1;
    });

    return result;
};