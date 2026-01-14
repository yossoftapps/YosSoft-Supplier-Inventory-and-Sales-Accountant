/**
 * وظائف مساعدة لمعالجة البيانات الضخمة بكفاءة
 * Data Utilities for highly efficient processing
 */

/**
 * تحويل المصفوفة ثنائية الأبعاد (Excel) إلى مصفوفة كائنات
 * Optimized to minimize object creation and header lookup overhead
 */
export const convertToObjects = (data, headersParam) => {
    if (!data || data.length === 0) return [];

    // التحقق مما إذا كانت البيانات محولة مسبقاً
    if (data.length > 0 && !Array.isArray(data[0]) && typeof data[0] === 'object') {
        return data;
    }

    let headers = headersParam;
    let rows = data;

    if (!headers) {
        const firstRow = data[0];
        const isHeaderLike = Array.isArray(firstRow) && firstRow.every(cell => typeof cell === 'string');
        if (isHeaderLike) {
            headers = firstRow;
            rows = data.slice(1);
        } else {
            // Fallback if no headers found
            const len = rows.length;
            const result = new Array(len);
            for (let i = 0; i < len; i++) {
                const row = rows[i];
                const obj = {};
                if (Array.isArray(row)) {
                    for (let j = 0; j < row.length; j++) {
                        obj[j] = row[j];
                    }
                } else if (row && typeof row === 'object') {
                    result[i] = row;
                    continue;
                }
                result[i] = obj;
            }
            return result;
        }
    }

    const headersLen = headers.length;
    const rowsLen = rows.length;
    const result = new Array(rowsLen);

    // استخدام حلقة for التقليدية لأقصى أداء مع المصفوفات الضخمة
    for (let i = 0; i < rowsLen; i++) {
        const row = rows[i];
        if (Array.isArray(row)) {
            const obj = {};
            for (let j = 0; j < headersLen; j++) {
                const header = headers[j];
                if (header !== undefined) {
                    let cell = row[j];

                    // تحويل تلقائي لتواريخ Excel الرقمية إذا كان اسم العمود يوحي بذلك
                    if (typeof cell === 'number' && (header.includes('تاريخ') || header.includes('Expiry') || header.includes('Date'))) {
                        if (cell > 20000 && cell < 60000) { // نطاق تواريخ Excel المعقول
                            try {
                                const jsDate = new Date((cell - 25569) * 86400 * 1000);
                                const y = jsDate.getFullYear();
                                const m = String(jsDate.getMonth() + 1).padStart(2, '0');
                                const d = String(jsDate.getDate()).padStart(2, '0');
                                cell = `${y}-${m}-${d}`;
                            } catch (e) { }
                        }
                    }

                    obj[header] = cell;
                }
            }
            result[i] = obj;
        } else {
            result[i] = row;
        }
    }

    return result;
};

/**
 * دالة لفرز البيانات مع الحفاظ على استهلاك الذاكرة
 */
export const sortByDateDesc = (data, dateKey) => {
    if (!data || !Array.isArray(data)) return [];
    return data.sort((a, b) => {
        const dateA = a[dateKey] instanceof Date ? a[dateKey] : new Date(a[dateKey]);
        const dateB = b[dateKey] instanceof Date ? b[dateKey] : new Date(b[dateKey]);
        return dateB - dateA;
    });
};

/**
 * تقسيم المصفوفة إلى أجزاء صغيرة لمعالجتها دون تجميد الواجهة
 */
export const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};
