// ═══════════════════════════════════════════════════════════════════════════
// منطق تقرير الاصناف الشاذة
// Abnormal Items Report Logic
// ═══════════════════════════════════════════════════════════════════════════

import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

export const calculateAbnormalItems = async (netPurchasesData, netSalesData, physicalInventoryData) => {
    // قائمة B: المرتجعات اليتيمة من صافي المشتريات
    const listB = netPurchasesData?.orphanReturnsList || [];

    // قائمة D: المرتجعات اليتيمة من صافي المبيعات
    const listD = netSalesData?.orphanReturnsList || [];

    // قائمة F: الكميات السالبة والمنتهية من الجرد الفعلي
    const listF = physicalInventoryData?.listF || [];

    let combinedList = [];

    // معالجة قائمة B
    listB.forEach(item => {
        combinedList.push({
            ...item,
            'القائمة': 'B',
            'الكمية': item['الكمية'] || 0,
            'المورد': item['المورد'] || '',
            'تاريخ العملية': item['تاريخ العملية'] || '',
            'نوع العملية': item['نوع العملية'] || 'مرتجع مشتريات',
        });
    });

    // معالجة قائمة D
    listD.forEach(item => {
        combinedList.push({
            ...item,
            'القائمة': 'D',
            'الكمية': item['الكمية'] || 0,
            'المورد': '', // عادة غير متوفر في المبيعات
            'تاريخ العملية': item['تاريخ العملية'] || '',
            'نوع العملية': item['نوع العملية'] || 'مرتجع مبيعات',
        });
    });

    // معالجة قائمة F
    listF.forEach(item => {
        combinedList.push({
            ...item,
            'القائمة': 'F',
            'الكمية': item['الكمية'] || 0,
            'المورد': '', // غير متوفر في الجرد الفعلي
            'تاريخ العملية': item['تاريخ العملية'] || '', // قد يكون غير متوفر، نستخدم تاريخ الصلاحية كبديل للفرز اذا لزم الامر او نتركه فارغ
            'نوع العملية': 'جرد فعلي',
            'ملاحظات': item['ملاحظات'] || (item['الكمية'] < 0 ? 'سالب' : 'منتهي'),
        });
    });

    // الفرز: رمز المادة -> تاريخ العملية -> تاريخ الصلاحية
    combinedList.sort((a, b) => {
        const codeA = String(a['رمز المادة'] || '').toLowerCase();
        const codeB = String(b['رمز المادة'] || '').toLowerCase();
        if (codeA !== codeB) return codeA.localeCompare(codeB);

        const dateA = a['تاريخ العملية'] ? new Date(a['تاريخ العملية']).getTime() : 0;
        const dateB = b['تاريخ العملية'] ? new Date(b['تاريخ العملية']).getTime() : 0;
        if (dateA !== dateB) return dateA - dateB;

        const expiryA = a['تاريخ الصلاحية'] ? new Date(a['تاريخ الصلاحية']).getTime() : 0;
        const expiryB = b['تاريخ الصلاحية'] ? new Date(b['تاريخ الصلاحية']).getTime() : 0;
        return expiryA - expiryB;
    });

    // إضافة الرقم التسلسلي (م)
    return combinedList.map((item, index) => ({
        ...item,
        'م': index + 1
    }));
};
