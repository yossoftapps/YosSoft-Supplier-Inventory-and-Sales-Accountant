// Standard Column Definitions as per TODO.md
// Defines width, alignment, and formatting type for each column
// Source: TODO.md lines 191-305

export const COLUMN_STANDARDS = {
    'م': { width: 50, align: 'center', type: 'integer' },
    'رمز المادة': { width: 100, align: 'center', type: 'string' },
    'اسم المادة': { width: 180, align: 'left', type: 'string' },
    'الوحدة': { width: 80, align: 'center', type: 'string' },
    'الكمية': { width: 100, align: 'center', type: 'quantity' },
    'كمية الجرد': { width: 100, align: 'center', type: 'quantity' },
    'كمية المبيعات': { width: 100, align: 'center', type: 'quantity' },
    'الافرادي': { width: 100, align: 'center', type: 'currency' },
    'تاريخ الصلاحية': { width: 120, align: 'center', type: 'date' },
    'المورد': { width: 150, align: 'right', type: 'string' },
    'تاريخ العملية': { width: 120, align: 'center', type: 'date' },
    'نوع العملية': { width: 80, align: 'center', type: 'string' },
    'رقم السجل': { width: 50, align: 'center', type: 'integer' },
    'ملاحظات': { width: 150, align: 'right', type: 'string' },
    'القائمة': { width: 50, align: 'center', type: 'string' },
    'الاجمالي': { width: 100, align: 'center', type: 'currency' },
    'تاريخ الشراء': { width: 120, align: 'center', type: 'date' },
    'عمر الصنف': { width: 80, align: 'center', type: 'integer' },
    'نسبة الفائض': { width: 80, align: 'center', type: 'percentage' },
    'فائض المخزون': { width: 100, align: 'center', type: 'quantity' },
    'قيمة فائض المخزون': { width: 100, align: 'center', type: 'currency' },
    'معد للارجاع': { width: 100, align: 'center', type: 'quantity' },
    'قيمة معد للارجاع': { width: 100, align: 'center', type: 'currency' },
    'مخزون مثالي': { width: 100, align: 'center', type: 'quantity' },
    'قيمة مخزون مثالي': { width: 100, align: 'center', type: 'currency' },
    'صنف جديد': { width: 100, align: 'center', type: 'quantity' },
    'قيمة صنف جديد': { width: 100, align: 'center', type: 'currency' },
    'الاحتياج': { width: 100, align: 'center', type: 'quantity' },
    'قيمة الاحتياج': { width: 100, align: 'center', type: 'currency' },
    'بيان الصلاحية': { width: 120, align: 'right', type: 'string' },
    'بيان الحركة': { width: 120, align: 'right', type: 'string' },
    'بيان الحالة': { width: 120, align: 'right', type: 'string' },
    'البيان': { width: 120, align: 'right', type: 'string' },
    'كمية المشتريات': { width: 100, align: 'center', type: 'quantity' },
    'نسبة المبيعات': { width: 80, align: 'center', type: 'percentage' },
    'المبيعات': { width: 100, align: 'center', type: 'quantity' },
    'بيان الفائض': { width: 120, align: 'right', type: 'string' },
    'التكلفة': { width: 100, align: 'center', type: 'currency' },
    'رمز الحساب': { width: 100, align: 'center', type: 'string' },
    'مدين': { width: 100, align: 'center', type: 'currency' },
    'دائن': { width: 100, align: 'center', type: 'currency' },
    'الرصيد': { width: 80, align: 'center', type: 'currency' },
    'قيمة المخزون': { width: 100, align: 'center', type: 'currency' },
    'الاستحقاق': { width: 100, align: 'center', type: 'currency' },
    'المبلغ المستحق': { width: 100, align: 'center', type: 'currency' },
    'اصناف جديدة': { width: 100, align: 'center', type: 'quantity' },
    'منتهي': { width: 100, align: 'center', type: 'quantity' },
    'راكد تماما': { width: 100, align: 'center', type: 'quantity' },
    'قريب جدا': { width: 100, align: 'center', type: 'quantity' },
    'مخزون زائد': { width: 100, align: 'center', type: 'quantity' },
    'عدد الموردين': { width: 80, align: 'center', type: 'integer' },
    'إجمالي المديونية': { width: 100, align: 'center', type: 'currency' },
    'إجمالي قيمة المخزون': { width: 100, align: 'center', type: 'currency' },
    'صافي الفجوة': { width: 80, align: 'center', type: 'currency' },
    'إجمالي الاستحقاق': { width: 100, align: 'center', type: 'currency' },
    'عدد عمليات البيع': { width: 80, align: 'center', type: 'integer' },
    'إجمالي الكمية المباعة': { width: 100, align: 'center', type: 'quantity' },
    'إجمالي قيمة المبيعات': { width: 100, align: 'center', type: 'currency' },
    'إجمالي تكلفة المبيعات': { width: 100, align: 'center', type: 'currency' },
    'إجمالي الربح': { width: 100, align: 'center', type: 'currency' },
    'نسبة هامش الربح %': { width: 80, align: 'center', type: 'percentage' },
    'نسبة المساهمة في أرباح الشركة %': { width: 80, align: 'center', type: 'percentage' },
    'إجمالي قيمة الاستهلاك السنوي': { width: 100, align: 'center', type: 'currency' },
    'القيمة التراكمية %': { width: 80, align: 'center', type: 'percentage' },
    'التصنيف ABC': { width: 80, align: 'center', type: 'string' },
    'الكمية الحالية': { width: 100, align: 'center', type: 'quantity' },
    'الأيام المتبقية': { width: 80, align: 'center', type: 'integer' },
    'معدل البيع اليومي': { width: 80, align: 'center', type: 'quantity' },
    'الكمية المتوقعة للبيع': { width: 100, align: 'center', type: 'quantity' },
    'الخطر المتوقع': { width: 80, align: 'center', type: 'quantity' },
    'نسبة الخطر %': { width: 80, align: 'center', type: 'percentage' },
    'عدد مرات البيع': { width: 80, align: 'center', type: 'integer' },
    'متوسط الكمية المباعة': { width: 80, align: 'center', type: 'quantity' },
    'متوسط الفترة بين المبيعات': { width: 80, align: 'center', type: 'integer' },
    'معدل دوران المخزون': { width: 80, align: 'center', type: 'number' },
    'فترة التخزين المتوقعة': { width: 80, align: 'center', type: 'integer' },
    'مؤشر الخطورة': { width: 80, align: 'center', type: 'number' },
    'الكمية المباعة': { width: 100, align: 'center', type: 'quantity' },
    'متوسط المخزون': { width: 80, align: 'center', type: 'quantity' },
    'معدل الدوران': { width: 80, align: 'center', type: 'number' },
    'فترة بقاء المخزون': { width: 80, align: 'center', type: 'integer' },
    'متوسط الاستهلاك اليومي': { width: 80, align: 'center', type: 'quantity' },
    'مخزون الأمان': { width: 80, align: 'center', type: 'quantity' },
    'نقطة إعادة الطلب': { width: 80, align: 'center', type: 'quantity' },
    'الكمية المثالية للشراء': { width: 100, align: 'center', type: 'quantity' },
    'فجوة المخزون': { width: 80, align: 'center', type: 'quantity' },
    'الحالة': { width: 120, align: 'right', type: 'string' },
    'تصنيف ABC': { width: 80, align: 'center', type: 'string' },
    'عدد الأصناف': { width: 80, align: 'center', type: 'integer' },
    'إجمالي الكمية المشتراة': { width: 100, align: 'center', type: 'quantity' },
    'إجمالي القيمة المشتراة': { width: 100, align: 'center', type: 'currency' },
    'إجمالي الكمية المرتجعة': { width: 100, align: 'center', type: 'quantity' },
    'إجمالي القيمة المرتجعة': { width: 100, align: 'center', type: 'currency' },
    'نسبة المرتجعات %': { width: 80, align: 'center', type: 'percentage' },
    'تباين الأسعار': { width: 80, align: 'center', type: 'percentage' },
    'درجة الجودة': { width: 80, align: 'center', type: 'number' },
    'درجة التسعير': { width: 80, align: 'center', type: 'number' },
    'الدرجة الإجمالية': { width: 80, align: 'center', type: 'number' },
    'درجة المورد': { width: 80, align: 'center', type: 'number' },
    'ترتيب المورد': { width: 80, align: 'center', type: 'integer' },
    'قرار التعامل': { width: 80, align: 'center', type: 'string' },
    'عدد الأخطاء': { width: 80, align: 'center', type: 'integer' },
    'الالتزام بالكمية %': { width: 80, align: 'center', type: 'percentage' },
    'الالتزام بالوقت %': { width: 80, align: 'center', type: 'percentage' },
    'قيمة المخزون الحالي': { width: 100, align: 'center', type: 'currency' },
    'قيمة المخزون الراكد': { width: 100, align: 'center', type: 'currency' },
    'الأصناف المنتهية': { width: 100, align: 'center', type: 'quantity' },
    'متوسط فترة السداد': { width: 80, align: 'center', type: 'integer' },
    'الالتزام المالي %': { width: 80, align: 'center', type: 'percentage' },
    'الحساب المساعد': { width: 120, align: 'right', type: 'string' }
};

/**
 * Applies standard column widths and alignment to a set of columns
 * @param {Array} columns - The columns array
 * @returns {Array} - The standardized columns array
 */
export const standardizeColumns = (columns) => {
    if (!columns) return [];
    return columns.map(col => {
        const standard = COLUMN_STANDARDS[col.title] || COLUMN_STANDARDS[col.dataIndex];
        if (standard) {
            return {
                ...col,
                width: col.width || standard.width, // Prefer existing width if explicitly set? TODO.md says "without exceeding Max defined", so maybe override?
                // Actually the user said "Improve column display so it adjusts automatically... without exceeding the maximum limit".
                // This implies these are MAX limits or recommended widths.
                // We will set them as 'width'.
                width: standard.width,
                align: standard.align || col.align || 'center'
            };
        }
        return col;
    });
};
