// ═══════════════════════════════════════════════════════════════════════════
// تقرير تجهيز المرتجعات - الأصناف المعدة للإرجاع
// Preparing Returns Report - Items Prepared for Return
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

/**
 * حساب تقرير تجهيز المرتجعات من بيانات المخزون النهائي
 * @param {Array} endingInventoryData - بيانات المخزون النهائي
 * @returns {Array} بيانات تقرير تجهيز المرتجعات
 */
export const calculatePreparingReturns = (endingInventoryData) => {
    const startTime = performance.now();

    if (!endingInventoryData || endingInventoryData.length === 0) {
        return [];
    }

    console.log(`🚀 [PreparingReturns] معالجة: ${endingInventoryData.length} عنصر من المخزون النهائي`);

    // فلترة الأصناف التي كمياتها في عمود "معد للإرجاع" أكبر من الصفر
    const itemsToReturn = endingInventoryData.filter(item => {
        const returnQty = parseFloat(item['معد للارجاع']) || 0;
        return returnQty > 0;
    });

    console.log(`⚙️ [PreparingReturns] تم العثور على ${itemsToReturn.length} عنصر معد للإرجاع`);

    // إنشاء تقرير تجهيز المرتجعات
    const preparingReturnsList = itemsToReturn.map((item, index) => {
        // استخراج البيانات الأساسية
        const materialCode = item['رمز المادة'] || '';
        const materialName = item['اسم المادة'] || '';
        const unit = item['الوحدة'] || '';
        const returnQuantity = parseFloat(item['معد للارجاع']) || 0;
        const unitPrice = parseFloat(item['الافرادي']) || 0;
        const expiryDate = item['تاريخ الصلاحية'] || '';
        const supplier = item['المورد'] || '';
        const itemAge = item['عمر الصنف'] || 0;
        const salesQuantity = item['مبيعات الصنف'] || 0;
        const validityStatus = item['بيان الصلاحية'] || '';
        const movementStatus = item['بيان الحركة'] || '';
        const status = item['البيان'] || '';

        // حساب إجمالي الشراء
        const totalPurchase = multiply(returnQuantity, unitPrice);

        // تنسيق التاريخ إلى yyyy-mm-01
        let formattedExpiryDate = '';
        if (expiryDate) {
            try {
                const date = new Date(expiryDate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                formattedExpiryDate = `${year}-${month}-01`;
            } catch (e) {
                formattedExpiryDate = expiryDate;
            }
        }

        // إرجاع كائن التقرير
        return {
            'م': index + 1, // 3-7-03-01 م (رقم بتنسيق عام)
            'م': index + 1, // 3-7-03-02 م (رقم بتنسيق عام) - مكرر حسب المتطلبات
            'رمز المادة': materialCode, // 3-7-03-03 رمز المادة (نص)
            'اسم المادة': materialName, // 3-7-03-04 اسم المادة (نص)
            'الوحدة': unit, // 3-7-03-05 الوحدة (نص)
            'الكمية': roundToDecimalPlaces(returnQuantity, 2), // 3-7-03-06 الكمية (كمية معد للارجاع) (رقم بتنسيق 00.00)
            'الافرادي': roundToInteger(unitPrice), // 3-7-03-07 الافرادي (رقم بتنسيق 00) رقم صحيح
            'اجمالي الشراء': roundToDecimalPlaces(totalPurchase, 2), // 3-7-03-08 اجمالي الشراء (الافرادي * الكمية)
            'تاريخ الصلاحية': formattedExpiryDate, // 3-7-03-09 تاريخ الصلاحية (تاريخ بتنسيق yyyy-mm-01)
            'المورد': supplier, // 3-7-03-10 المورد
            'عمر الصنف': itemAge, // 3-7-03-11 عمر الصنف
            'مبيعات الصنف': salesQuantity, // 3-7-03-12 مبيعات الصنف
            'بيان الصلاحية': validityStatus, // 3-7-03-13 بيان الصلاحية (منتهي او قريب جدا او قريب او بعيد)
            'بيان الحركة': movementStatus, // 3-7-03-14 بيان الحركة (راكد تماما او مخزون زائد او احتياج)
            'البيان': status // 3-7-03-15 البيان
        };
    });

    const totalTime = performance.now() - startTime;
    const throughput = (endingInventoryData.length / totalTime * 1000).toFixed(0);

    console.log(`✅ [PreparingReturns] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms | ⚡ ${throughput} سجل/ث`);
    console.log(`   📊 ${preparingReturnsList.length} عنصر معد للإرجاع`);

    return preparingReturnsList;
};
