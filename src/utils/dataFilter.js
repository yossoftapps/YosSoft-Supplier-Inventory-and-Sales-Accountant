// وظائف مساعدة لتصفية البيانات بناءً على معايير متنوعة

/**
 * تصفية البيانات بناءً على المعايير المقدمة
 * @param {Array} data - مصفوفة كائنات البيانات المراد تصفيتها
 * @param {Object} filters - معايير التصفية
 * @returns {Array} البيانات المصفاة
 */
import safeString from './safeString.js';

export const filterData = (data, filters) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  if (!filters || Object.keys(filters).length === 0) {
    return data;
  }

  return data.filter(item => {
    // تصفية نطاق التاريخ
    if (filters.startDate || filters.endDate) {
      const itemDateStr = item['تاريخ العملية'] || item['تاريخ الصلاحية'];
      if (itemDateStr) {
        const itemDate = new Date(itemDateStr);

        if (filters.startDate && itemDate < new Date(filters.startDate)) {
          return false;
        }

        if (filters.endDate && itemDate > new Date(filters.endDate)) {
          return false;
        }
      }
    }

    // تصفية المورد
    if (filters.supplier && item['المورد'] !== filters.supplier) {
      return false;
    }

    // تصفية الفئة (مستخلصة من اسم المادة)
    if (filters.category && item['اسم المادة']) {
      const itemCategory = safeString(item['اسم المادة']).split(/[-\s]/)[0];
      if (itemCategory !== filters.category) {
        return false;
      }
    }

    // تصفية رمز المادة
    if (filters.materialCode && item['رمز المادة']) {
      if (!safeString(item['رمز المادة']).toLowerCase().includes(safeString(filters.materialCode).toLowerCase())) {
        return false;
      }
    }

    // تصفية اسم المادة
    if (filters.materialName && item['اسم المادة']) {
      if (!safeString(item['اسم المادة']).toLowerCase().includes(safeString(filters.materialName).toLowerCase())) {
        return false;
      }
    }

    // تصفية رمز الحساب
    if (filters.accountCode && item['رمز الحساب']) {
      if (!safeString(item['رمز الحساب']).toLowerCase().includes(safeString(filters.accountCode).toLowerCase())) {
        return false;
      }
    }

    // تصفية الحساب الفرعي
    if (filters.subAccount && item['الحساب المساعد']) {
      if (item['الحساب المساعد'] !== filters.subAccount) {
        return false;
      }
    }

    // تصفية تصنيف ABC
    if (filters.abcClassification && item['التصنيف ABC']) {
      if (item['التصنيف ABC'] !== filters.abcClassification) {
        return false;
      }
    }

    // البحث الذكي (Smart Search) - البحث في كل الحقول
    if (filters.smartSearch) {
      const searchStr = safeString(filters.smartSearch).toLowerCase();
      // البحث في القيم النصية والرقمية لكل الحقول في السجل
      const match = Object.values(item).some(val =>
        val !== null && val !== undefined && safeString(val).toLowerCase().includes(searchStr)
      );
      if (!match) return false;
    }

    return true;
  });
};

/**
 * تصفية بيانات المشتريات (يتعامل مع كل من المشتريات الصافية والمرتجعات اليتيمة)
 * @param {Object} data - كائن البيانات الذي يحتوي على netPurchasesList و orphanReturnsList
 * @param {Object} filters - معايير التصفية
 * @returns {Object} كائن البيانات المصفاة
 */
export const filterPurchasesData = (data, filters) => {
  if (!data) return { netPurchasesList: [], orphanReturnsList: [] };

  return {
    netPurchasesList: filterData(data.netPurchasesList || [], filters),
    orphanReturnsList: filterData(data.orphanReturnsList || [], filters)
  };
};

/**
 * تصفية بيانات المبيعات (يتعامل مع كل من المبيعات الصافية والمرتجعات اليتيمة)
 * @param {Object} data - كائن البيانات الذي يحتوي على netSalesList و orphanReturnsList
 * @param {Object} filters - معايير التصفية
 * @returns {Object} كائن البيانات المصفاة
 */
export const filterSalesData = (data, filters) => {
  if (!data) return { netSalesList: [], orphanReturnsList: [] };

  return {
    netSalesList: filterData(data.netSalesList || [], filters),
    orphanReturnsList: filterData(data.orphanReturnsList || [], filters)
  };
};

/**
 * تصفية بيانات المخزون (يتعامل مع كل من listE و listF)
 * @param {Object} data - كائن البيانات الذي يحتوي على listE و listF
 * @param {Object} filters - معايير التصفية
 * @returns {Object} كائن البيانات المصفاة
 */
export const filterInventoryData = (data, filters) => {
  if (!data) return { listE: [], listF: [] };

  return {
    listE: filterData(data.listE || [], filters),
    listF: filterData(data.listF || [], filters)
  };
};

/**
 * تصفية بيانات المخزون النهائي (يتعامل مع endingInventoryList و listB)
 * @param {Object} data - كائن البيانات الذي يحتوي على endingInventoryList و listB
 * @param {Object} filters - معايير التصفية
 * @returns {Object} كائن البيانات المصفاة
 */
export const filterEndingInventoryData = (data, filters) => {
  if (!data) return { endingInventoryList: [], listB: [] };

  return {
    endingInventoryList: filterData(data.endingInventoryList || [], filters),
    listB: filterData(data.listB || [], filters)
  };
};

/**
 * تصفية كائن بيانات عام
 * @param {Object} data - كائن البيانات
 * @param {Object} filters - معايير التصفية
 * @param {string} arrayKey - مفتاح المصفوفة المراد تصفيتها داخل كائن البيانات
 * @returns {Object} كائن البيانات المصفاة
 */
export const filterGenericData = (data, filters, arrayKey) => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return filterData(data, filters);
  }

  if (typeof data === 'object') {
    const result = { ...data };

    if (arrayKey && Array.isArray(data[arrayKey])) {
      result[arrayKey] = filterData(data[arrayKey], filters);
    } else {
      // Try to filter all array properties
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          result[key] = filterData(data[key], filters);
        }
      });
    }

    return result;
  }

  return data;
};

export default {
  filterData,
  filterPurchasesData,
  filterSalesData,
  filterInventoryData,
  filterEndingInventoryData,
  filterGenericData
};