/**
 * وظيفة لحساب صافي المشتريات عن طريق مطابقة المرتجعات بالمشتريات
 * @param {Array} purchasesData - مصفوفة بيانات المشتريات (بدون عناوين الأعمدة)
 * @param {Array} returnsData - مصفوفة بيانات المرتجعات (بدون عناوين الأعمدة)
 * @returns {Object} كائن يحتوي على قائمة المشتريات النهائية (قائمة أ) والمرتجعات اليتيمة (قائمة ب)
 */
export const calculateNetPurchases = (purchasesData, returnsData) => {
    // تحويل البيانات إلى كائنات أسهل للتعامل معها
    const purchases = purchasesData.map(row => ({
        م: row[0],
        رمز_المادة: row[1],
        اسم_المادة: row[2],
        الوحدة: row[3],
        الكمية: parseFloat(row[4]),
        الافرادي: parseInt(row[5], 10),
        تاريخ_الصلاحية: row[6],
        المورد: row[7],
        تاريخ_العملية: row[8],
        نوع_العملية: row[9],
        // بيانات إضافية ستُضاف لاحقًا
        ملاحظات: 'لايوجد مرتجع',
        القائمة: 'A',
        كمية_الجرد: 0,
        كمية_المبيعات: 0,
        رقم_السجل: null,
    }));

    const returns = returnsData.map(row => ({
        م: row[0],
        رمز_المادة: row[1],
        اسم_المادة: row[2],
        الوحدة: row[3],
        الكمية: parseFloat(row[4]),
        الافرادي: parseInt(row[5], 10),
        تاريخ_الصلاحية: row[6],
        المورد: row[7],
        تاريخ_العملية: row[8],
        نوع_العملية: row[9],
    }));

    // فرز المشتريات والمرتجعات حسب التاريخ (الأحدث أولاً) حسب المنطق
    const sortedPurchases = purchases.sort((a, b) => new Date(b.تاريخ_العملية) - new Date(a.تاريخ_العملية));
    const sortedReturns = returns.sort((a, b) => new Date(b.تاريخ_العملية) - new Date(a.تاريخ_العملية));

    const finalPurchases = [];
    const orphanReturns = [];

    // نسخ من المشتريات لتعديل الكميات
    let workingPurchases = sortedPurchases.map(p => ({ ...p, الكمية_المتبقية: p.الكمية }));

    // المرحلة الأولى: استنزال المرتجعات من المشتريات
    for (const returnItem of sortedReturns) {
        let remainingReturnQty = returnItem.الكمية;
        let matched = false;

        // البحث عن مطابقة حسب المفاتيح (سنطبق المفتاح الأول كمثال)
        for (let i = 0; i < workingPurchases.length && remainingReturnQty > 0; i++) {
            const purchaseItem = workingPurchases[i];

            // المفتاح الأول: (رمز المادة، الكمية، اسم المورد، تاريخ الصلاحية، الافرادي)
            if (
                purchaseItem.رمز_المادة === returnItem.رمز_المادة &&
                purchaseItem.المورد === returnItem.المورد &&
                purchaseItem.تاريخ_الصلاحية === returnItem.تاريخ_الصلاحية &&
                purchaseItem.الافرادي === returnItem.الافرادي &&
                purchaseItem.الكمية_المتبقية > 0
            ) {
                matched = true;
                const qtyToDeduct = Math.min(remainingReturnQty, purchaseItem.الكمية_المتبقية);

                purchaseItem.الكمية_المتبقية -= qtyToDeduct;
                purchaseItem.الكمية -= qtyToDeduct;
                purchaseItem.ملاحظات = 'مطابق';

                remainingReturnQty -= qtyToDeduct;
            }
        }

        // إذا لم يتم استنزال كمية المرتجع بالكامل، أضفه إلى المرتجعات اليتيمة
        if (remainingReturnQty > 0 || !matched) {
            orphanReturns.push({
                ...returnItem,
                الكمية: -Math.abs(returnItem.الكمية), // جعل الكمية سالبة
                ملاحظات: 'غير مطابق',
                القائمة: 'B',
            });
        }
    }

    // المرحلة الثانية: بناء القائمة النهائية
    for (const purchase of workingPurchases) {
        if (purchase.الكمية > 0) {
            finalPurchases.push({
                ...purchase,
                // إعادة تعيين الكمية إلى القيمة الأصلية بعد التعديلات
                الكمية: purchase.الكمية_المتبقية > 0 ? purchase.الكمية_المتبقية : purchase.الكمية,
            });
        }
    }

    // إعادة ترتيب القائمة النهائية حسب المواصفات
    finalPurchases.sort((a, b) => {
        const dateCompare = new Date(b.تاريخ_العملية) - new Date(a.تاريخ_العملية);
        if (dateCompare !== 0) return dateCompare;
        const idCompare = a.م - b.م;
        if (idCompare !== 0) return idCompare;
        return new Date(a.تاريخ_الصلاحية) - new Date(b.تاريخ_الصلاحية);
    });

    // تحديث الرقم التسلسلي
    finalPurchases.forEach((item, index) => {
        item.م = index + 1;
    });

    return {
        netPurchasesList: finalPurchases, // قائمة A
        orphanReturnsList: orphanReturns, // قائمة B
    };
};