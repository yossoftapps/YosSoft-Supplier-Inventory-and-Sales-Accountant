import * as Yup from 'yup';

/**
 * دالة مساعدة لتحويل القيم النصية إلى أرقام بشكل آمن
 */
const parseNumber = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    const num = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
};

/**
 * مخطط التحقق من صحة بيانات المشتريات
 */
export const purchaseSchema = Yup.object().shape({
    'رمز المادة': Yup.string()
        .required('رمز المادة مطلوب')
        .max(100, 'رمز المادة طويل جداً'),
    'اسم المادة': Yup.string()
        .required('اسم المادة مطلوب')
        .max(255, 'اسم المادة طويل جداً'),
    'الكمية': Yup.mixed()
        .test('is-number', 'الكمية يجب أن تكون رقماً صالحاً', (val) => !isNaN(parseFloat(val))),
    'الافرادي': Yup.mixed()
        .test('is-number', 'السعر الافرادي يجب أن يكون رقماً صالحاً', (val) => !isNaN(parseFloat(val))),
    'تاريخ الصلاحية': Yup.string()
        .nullable()
        .test('is-date', 'تاريخ الصلاحية غير صالح', (val) => {
            if (!val) return true;
            const date = new Date(val);
            return !isNaN(date.getTime());
        }),
    'المورد': Yup.string()
        .required('اسم المورد مطلوب')
});

/**
 * مخطط التحقق من صحة بيانات المبيعات
 */
export const salesSchema = Yup.object().shape({
    'رمز المادة': Yup.string().required('رمز المادة مطلوب'),
    'اسم المادة': Yup.string().required('اسم المادة مطلوب'),
    'الكمية': Yup.mixed()
        .test('is-number', 'الكمية يجب أن تكون رقماً صالحاً', (val) => !isNaN(parseFloat(val))),
    'الافرادي': Yup.mixed()
        .test('is-number', 'السعر الافرادي يجب أن يكون رقماً صالحاً', (val) => !isNaN(parseFloat(val))),
});

/**
 * مخطط التحقق من صحة بيانات الجرد
 */
export const inventorySchema = Yup.object().shape({
    'رمز المادة': Yup.string().required('رمز المادة مطلوب'),
    'اسم المادة': Yup.string().required('اسم المادة مطلوب'),
    'الكمية': Yup.mixed()
        .test('is-number', 'الكمية يجب أن تكون رقماً صالحاً', (val) => !isNaN(parseFloat(val))),
});

/**
 * مخطط التحقق من صحة بيانات الموردين
 */
export const supplierSchema = Yup.object().shape({
    'اسم المورد': Yup.string().nullable(),
    'الرصيد': Yup.mixed().nullable()
});

/**
 * وظيفة للتحقق من صحة مصفوفة من البيانات
 * @param {Array} data - المصفوفة المراد التحقق منها
 * @param {Object} schema - مخطط Yup
 * @param {Function} onProgress - دالة لتحديث التقدم (اختياري)
 * @returns {Promise<Object>} - يحتوي على isValid و errors
 */
export const validateDataArray = async (data, schema, onProgress = null) => {
    const results = {
        isValid: true,
        errors: [],
        validData: []
    };

    if (!Array.isArray(data) || data.length === 0) {
        return results;
    }

    const maxErrors = 100;
    const chunkSize = 1000; // زيادة حجم الدفعة لسرعة أكبر

    // التحقق من الصفوف على دفعات لمنع تجميد الـ Main Thread
    for (let i = 0; i < data.length; i += chunkSize) {
        // Yield to browser after each chunk
        await new Promise(resolve => setTimeout(resolve, 0));

        if (onProgress) {
            const percent = Math.min(100, Math.floor((i / data.length) * 100));
            onProgress(percent);
        }

        const currentChunk = data.slice(i, i + chunkSize);

        for (let j = 0; j < currentChunk.length; j++) {
            const rowIdx = i + j;
            try {
                // استخدام validateSync إذا كان المخطط يسمح بذلك لسرعة هائلة، أو استخدام validate العادي
                const validRow = schema.validateSync(currentChunk[j], { abortEarly: true, stripUnknown: true });
                results.validData.push(validRow);
            } catch (err) {
                results.isValid = false;
                if (results.errors.length < maxErrors) {
                    results.errors.push({
                        row: rowIdx + 1,
                        errorMessages: err.errors || [err.message]
                    });
                }
            }
        }
    }

    return results;
};
