/**
 * وظيفة لحساب صافي المبيعات عن طريق مطابقة مرتجعات المبيعات بالمبيعات
 * @param {Array} salesData - مصفوفة بيانات المبيعات (بدون عناوين الأعمدة)
 * @param {Array} returnsData - مصفوفة بيانات مرتجعات المبيعات (بدون عناوين الأعمدة)
 * @returns {Object} كائن يحتوي على قائمة المبيعات النهائية (قائمة ج) والمرتجعات اليتيمة (قائمة د)
 */
export const calculateNetSales = (salesData, returnsData) => {
    // تحويل البيانات إلى كائنات أسهل للتعامل معها
    const sales = salesData.map(row => ({
        م: row[0],
        رمز_المادة: row[1],
        اسم_المادة: row[2],
        الوحدة: row[3],
        الكمية: parseFloat(row[4]),
        الافرادي: parseInt(row[5], 10),
        تاريخ_الصلاحية: row[6],
        تاريخ_العملية: row[7],
        نوع_العملية: row[8],
        // بيانات إضافية ستُضاف لاحقًا
        ملاحظات: 'لايوجد مرتجع',
        القائمة: 'C',
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
        تاريخ_العملية: row[7],
        نوع_العملية: row[8],
    }));

    // فرز المبيعات والمرتجعات حسب التاريخ (الأحدث أولاً)
    const sortedSales = sales.sort((a, b) => new Date(b.تاريخ_العملية) - new Date(a.تاريخ_العملية));
    const sortedReturns = returns.sort((a, b) => new Date(b.تاريخ_العملية) - new Date(a.تاريخ_العملية));

    const finalSales = [];
    const orphanReturns = [];

    // نسخ من المبيعات لتعديل الكميات
    let workingSales = sortedSales.map(s => ({ ...s, الكمية_المتبقية: s.الكمية }));

    // المرحلة الأولى: استنزال المرتجعات من المبيعات
    for (const returnItem of sortedReturns) {
        let remainingReturnQty = returnItem.الكمية;
        let matched = false;

        // البحث عن مطابقة حسب المفاتيح (سنطبق المفتاح الأول كمثال)
        for (let i = 0; i < workingSales.length && remainingReturnQty > 0; i++) {
            const salesItem = workingSales[i];

            // المفتاح الأول: (رمز المادة، تاريخ الصلاحية، الافرادي، الكمية)
            // مع شرط تاريخ المرتجع أكبر أو يساوي تاريخ البيع
            if (
                new Date(returnItem.تاريخ_العملية) >= new Date(salesItem.تاريخ_العملية) &&
                salesItem.رمز_المادة === returnItem.رمز_المادة &&
                salesItem.تاريخ_الصلاحية === returnItem.تاريخ_الصلاحية &&
                salesItem.الافرادي === returnItem.الافرادي &&
                salesItem.الكمية_المتبقية > 0
            ) {
                matched = true;
                const qtyToDeduct = Math.min(remainingReturnQty, salesItem.الكمية_المتبقية);

                salesItem.الكمية_المتبقية -= qtyToDeduct;
                salesItem.الكمية -= qtyToDeduct;
                salesItem.ملاحظات = 'مطابق';

                remainingReturnQty -= qtyToDeduct;
            }
        }

        // إذا لم يتم استنزال كمية المرتجع بالكامل، أضفه إلى المرتجعات اليتيمة
        if (remainingReturnQty > 0 || !matched) {
            orphanReturns.push({
                ...returnItem,
                الكمية: -Math.abs(returnItem.الكمية), // جعل الكمية سالبة
                ملاحظات: 'غير مطابق',
                القائمة: 'D',
            });
        }
    }

    // المرحلة الثانية: بناء القائمة النهائية
    for (const sale of workingSales) {
        if (sale.الكمية > 0) {
            finalSales.push({
                ...sale,
                // إعادة تعيين الكمية إلى القيمة الأصلية بعد التعديلات
                الكمية: sale.الكمية_المتبقية > 0 ? sale.الكمية_المتبقية : sale.الكمية,
            });
        }
    }

    // إعادة ترتيب القائمة النهائية حسب المواصفات
    finalSales.sort((a, b) => {
        const dateCompare = new Date(b.تاريخ_العملية) - new Date(a.تاريخ_العملية);
        if (dateCompare !== 0) return dateCompare;
        const idCompare = a.م - b.م;
        if (idCompare !== 0) return idCompare;
        return new Date(a.تاريخ_الصلاحية) - new Date(b.تاريخ_الصلاحية);
    });

    // تحديث الرقم التسلسلي
    finalSales.forEach((item, index) => {
        item.م = index + 1;
    });

    return {
        netSalesList: finalSales, // قائمة C
        orphanReturnsList: orphanReturns, // قائمة D
    };
};