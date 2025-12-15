// ═══════════════════════════════════════════════════════════════════════════
// منطق تقرير الاصناف الشاذة
// Abnormal Items Report Logic
// ═══════════════════════════════════════════════════════════════════════════

import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

export const calculateAbnormalItems = (netPurchasesData, netSalesData, physicalInventoryData) => {
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
        // 1. رمز المادة
        const codeA = String(a['رمز المادة'] || '').toLowerCase();
        const codeB = String(b['رمز المادة'] || '').toLowerCase();
        if (codeA < codeB) return -1;
        if (codeA > codeB) return 1;

        // 2. تاريخ العملية (من الاحدث الى الاقدم كما هو معتاد في التقارير الاخرى؟ ام تصاعدي؟ طلب المستخدم "فرزها" ولم يحدد اتجاه. سأفرز تصاعدي (الاقدم للاحدث) منطقيا للتسلسل الزمني، او كما هو متبع في باقي التطبيق)
        // المستخدم طلب "ثم تاريخ العملية".
        const dateA = new Date(a['تاريخ العملية'] || '1900-01-01');
        const dateB = new Date(b['تاريخ العملية'] || '1900-01-01');
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;

        // 3. تاريخ الصلاحية
        const expiryA = new Date(a['تاريخ الصلاحية'] || '1900-01-01');
        const expiryB = new Date(b['تاريخ الصلاحية'] || '1900-01-01');
        if (expiryA < expiryB) return -1;
        if (expiryA > expiryB) return 1;

        return 0;
    });

    // إضافة الرقم التسلسلي (م)
    return combinedList.map((item, index) => ({
        ...item,
        'م': index + 1
    }));
};
