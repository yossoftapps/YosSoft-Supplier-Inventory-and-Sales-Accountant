// ═══════════════════════════════════════════════════════════════════════════
// تقرير تجهيز المرتجعات - الأصناف المعدة للارجاع
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
 * حساب تقرير تجهيز المرتجعات من بيانات المخزون النهائي (غير متزامن)
 * @param {Array} endingInventoryData - بيانات المخزون النهائي
 * @param {Object} cancellationToken - Optional cancellation token to allow early termination
 * @returns {Promise<Array>} بيانات تقرير تجهيز المرتجعات
 */
export const calculatePreparingReturns = async (endingInventoryData, cancellationToken = null) => {
    const startTime = performance.now();

    if (!endingInventoryData || endingInventoryData.length === 0) {
        return [];
    }

    console.log(`🚀 [PreparingReturns] معالجة: ${endingInventoryData.length} عنصر من المخزون النهائي`);

    // فلترة الأصناف التي كمياتها في عمود "معد للارجاع" أكبر من الصفر
    const itemsToReturn = endingInventoryData.filter(item => {
        const returnQty = item['معد للارجاع'];
        return returnQty && compare(returnQty, 0) > 0;
    });

    console.log(`⚙️ [PreparingReturns] تم العثور على ${itemsToReturn.length} عنصر معد للارجاع`);

    // إنشاء تقرير تجهيز المرتجعات - معالجة بالدفعات لضمان سلاسة الواجهة
    const preparingReturnsList = [];

    // Process items in batches to improve performance and prevent blocking
    const batchSize = 500;
    for (let i = 0; i < itemsToReturn.length; i++) {
        // Check for cancellation signal at regular intervals
        if (cancellationToken && cancellationToken.cancelled) {
            console.log('⚠️ [PreparingReturns] تم إلغاء العملية حسب الطلب');
            return [];
        }

        const item = itemsToReturn[i];

        // استخراج البيانات الأساسية (التعامل مع Decimal)
        const materialCode = item['رمز المادة'] || '';
        const materialName = item['اسم المادة'] || '';
        const unit = item['الوحدة'] || '';
        const returnQuantity = item['معد للارجاع'] || new Decimal(0);
        const unitPrice = item['الافرادي'] || new Decimal(0);
        const expiryDate = item['تاريخ الصلاحية'] || '';
        const supplier = item['المورد'] || '';
        const itemAge = item['عمر الصنف'] || 0;
        const salesQuantity = 0; // مبيعات الصنف يتم إضافتها لاحقاً في المكون
        const validityStatus = item['بيان الصلاحية'] || '';
        const movementStatus = item['بيان الحركة'] || '';
        const status = item['البيان'] || '';

        // حساب إجمالي الشراء
        const totalPurchase = multiply(returnQuantity, unitPrice);

        // تنسيق التاريخ إلى yyyy-mm-01 (تحسين الأداء بتجنب Date إذا كان النص صالحاً)
        let formattedExpiryDate = expiryDate;
        if (expiryDate && typeof expiryDate === 'string' && expiryDate.includes('-')) {
            const parts = expiryDate.split('-');
            if (parts.length >= 2) {
                formattedExpiryDate = `${parts[0]}-${parts[1].padStart(2, '0')}-01`;
            }
        }

        // إضافة للنتائج
        preparingReturnsList.push({
            'م': i + 1,
            'رمز المادة': materialCode,
            'اسم المادة': materialName,
            'الوحدة': unit,
            'الكمية': roundToDecimalPlaces(returnQuantity, 2),
            'الافرادي': roundToInteger(unitPrice),
            'اجمالي الشراء': roundToDecimalPlaces(totalPurchase, 2),
            'تاريخ الصلاحية': formattedExpiryDate,
            'المورد': supplier,
            'عمر الصنف': itemAge,
            'مبيعات الصنف': salesQuantity,
            'بيان الصلاحية': validityStatus,
            'بيان الحركة': movementStatus,
            'البيان': status
        });

        // Yield every 500 records to prevent blocking the UI
        if ((i + 1) % batchSize === 0) {
            // Yield control back to the event loop
            await new Promise(resolve => setTimeout(resolve, 0));

            // Optional: Log progress for large datasets
            if (itemsToReturn.length > 1000) {
                const progress = Math.round(((i + 1) / itemsToReturn.length) * 100);
                console.log(`⏳ [PreparingReturns] تم معالجة ${i + 1}/${itemsToReturn.length} (${progress}%)`);
            }
        }
    }

    const totalTime = performance.now() - startTime;
    const throughput = (endingInventoryData.length / totalTime * 1000).toFixed(0);

    console.log(`✅ [PreparingReturns] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms | ⚡ ${throughput} سجل/ث`);
    console.log(`   📊 ${preparingReturnsList.length} عنصر معد للارجاع`);

    return preparingReturnsList;
};
