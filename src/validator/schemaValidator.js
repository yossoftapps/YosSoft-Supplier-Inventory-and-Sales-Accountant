// Schema Validator Module
// Provides strict validation for Excel data according to specifications

/**
 * JSON Schema definitions for all tables
 */
const TABLE_SCHEMAS = {
  // Purchases table schema (ورقة مشتريات)
  purchases: {
    requiredColumns: [
      'م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية',
      'الافرادي', 'تاريخ الصلاحية', 'المورد', 'تاريخ العملية', 'نوع العملية'
    ],
    columnTypes: {
      'م': 'number',
      'رمز المادة': 'string',
      'اسم المادة': 'string',
      'الوحدة': 'string',
      'الكمية': 'number',
      'الافرادي': 'number',
      'تاريخ الصلاحية': 'date',
      'المورد': 'string',
      'تاريخ العملية': 'date',
      'نوع العملية': 'string'
    },
    requiredFields: ['رمز المادة', 'الكمية', 'الافرادي', 'تاريخ الصلاحية', 'المورد', 'تاريخ العملية', 'نوع العملية'],
    allowedValues: {
      'نوع العملية': ['مشتريات', 'مرتجع']
    }
  },

  // Sales table schema (ورقة مبيعات)
  sales: {
    requiredColumns: [
      'م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية',
      'الافرادي', 'تاريخ الصلاحية', 'تاريخ العملية', 'نوع العملية'
    ],
    columnTypes: {
      'م': 'number',
      'رمز المادة': 'string',
      'اسم المادة': 'string',
      'الوحدة': 'string',
      'الكمية': 'number',
      'الافرادي': 'number',
      'تاريخ الصلاحية': 'date',
      'تاريخ العملية': 'date',
      'نوع العملية': 'string'
    },
    requiredFields: ['رمز المادة', 'الكمية', 'الافرادي', 'تاريخ الصلاحية', 'تاريخ العملية', 'نوع العملية'],
    allowedValues: {
      'نوع العملية': ['مبيعات', 'مرتجع']
    }
  },

  // Physical Inventory table schema (ورقة المخزون)
  physicalInventory: {
    requiredColumns: [
      'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية',
      'تاريخ الصلاحية'
    ],
    columnTypes: {
      'رمز المادة': 'string',
      'اسم المادة': 'string',
      'الوحدة': 'string',
      'الكمية': 'number',
      'تاريخ الصلاحية': 'date'
    },
    requiredFields: ['رمز المادة', 'الكمية', 'تاريخ الصلاحية']
  },

  // Supplier Balances table schema (ورقة الارصدة)
  supplierbalances: {
    requiredColumns: [
      'م', 'رمز الحساب', 'المورد', 'مدين', 'دائن'
    ],
    optionalColumns: [
      'الحساب المساعد'
    ],
    columnTypes: {
      'م': 'number',
      'رمز الحساب': 'string',
      'المورد': 'string',
      'مدين': 'number',
      'دائن': 'number',
      'الحساب المساعد': 'string'
    },
    requiredFields: ['رمز الحساب', 'المورد', 'مدين', 'دائن']
  }
};

/**
 * Validate that all required columns exist in the data
 * @param {Array} data - The raw data array
 * @param {Object} schema - The schema to validate against
 * @param {string} tableName - Name of the table for error messages
 * @returns {Array} Array of error messages
 */
function validateColumns(data, schema, tableName) {
  const errors = [];
  if (!data || data.length < 1) {
    errors.push(`بيانات ${tableName} فارغة او غير موجودة`);
    return errors;
  }

  const headers = data[0];
  const missingColumns = schema.requiredColumns.filter(col => !headers.includes(col));

  if (missingColumns.length > 0) {
    errors.push(`الاعمدة المطلوبة مفقودة في ${tableName}: ${missingColumns.join(', ')}`);
  }

  return errors;
}

/**
 * وظيفة تحقق موحدة وفائقة السرعة تقوم بكل الفحوصات في دورة واحدة
 * @param {Array} data - البيانات
 * @param {Object} schema - المخطط
 * @param {string} tableName - اسم الجدول
 * @returns {Array} قائمة الأخطاء (بحد أقصى 100)
 */
function fastValidateTable(data, schema, tableName) {
  const errors = [];
  const maxErrors = 100; // تقييد عدد الأخطاء لمنع تجميد الواجهة

  if (!data || data.length < 1) return [`بيانات ${tableName} مفقودة`];

  const headers = data[0];

  // 1. فحص الأعمدة المفقودة (مرة واحدة)
  const missingColumns = schema.requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    errors.push(`الاعمدة المطلوبة مفقودة في ${tableName}: ${missingColumns.join(', ')}`);
    return errors; // توقف إذا كانت الأعمدة مفقودة
  }

  // تحديد فهارس الحقول المطلوبة والمسموح بها مسبقاً
  const requiredFields = schema.requiredFields || [];
  const requiredIndices = requiredFields.map(f => ({ name: f, idx: headers.indexOf(f) }));

  const allowedValues = schema.allowedValues || {};
  const allowedConstraints = Object.entries(allowedValues).map(([col, values]) => ({
    name: col,
    idx: headers.indexOf(col),
    values
  }));

  const typeConstraints = Object.entries(schema.columnTypes).map(([col, type]) => ({
    name: col,
    idx: headers.indexOf(col),
    type
  }));

  // 2. فحص الصفوف (دورة واحدة لكل الصفوف)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (errors.length >= maxErrors) break;

    // أ. فحص الحقول المطلوبة
    for (const req of requiredIndices) {
      const val = row[req.idx];
      if (val === null || val === undefined || val === '' || (typeof val === 'string' && val.trim() === '')) {
        errors.push(`خطأ في صف ${i}: الحقل "${req.name}" مطلوب`);
        if (errors.length >= maxErrors) break;
      }
    }
    if (errors.length >= maxErrors) break;

    // ب. فحص الأنواع
    for (const constraint of typeConstraints) {
      if (constraint.idx === -1) continue;
      const val = row[constraint.idx];
      if (val === null || val === undefined || val === '') continue;

      if (constraint.type === 'number' && isNaN(parseFloat(val))) {
        errors.push(`خطأ في صف ${i}: القيمة في "${constraint.name}" ليست رقماً`);
      } else if (constraint.type === 'date' && !isValidDate(val)) {
        errors.push(`خطأ في صف ${i}: القيمة في "${constraint.name}" ليست تاريخاً صالحاً`);
      }
      if (errors.length >= maxErrors) break;
    }
    if (errors.length >= maxErrors) break;

    // ج. فحص القيم المسموحة
    for (const constraint of allowedConstraints) {
      if (constraint.idx === -1) continue;
      const val = row[constraint.idx];
      if (val !== null && val !== undefined && !constraint.values.includes(val)) {
        errors.push(`خطأ في صف ${i}: القيمة "${val}" في "${constraint.name}" غير مسموحة`);
      }
      if (errors.length >= maxErrors) break;
    }
  }

  return errors;
}

/**
 * Check if a value is a valid date
 * @param {*} value - The value to check
 * @returns {boolean} True if valid date
 */
function isValidDate(value) {
  if (value === null || value === undefined || value === '') return false;

  // If it's already a Date object
  if (value instanceof Date && !isNaN(value)) return true;

  // Try to parse as date
  const date = new Date(value);
  return !isNaN(date) && date.toString() !== 'Invalid Date';
}

/**
 * Normalize data according to schema
 * @param {Array} data - The raw data array
 * @param {Object} schema - The schema to normalize against
 * @returns {Array} Normalized data
 */
import safeString from '../utils/safeString.js';

/**
 * تطبيع البيانات بشكل فعال
 * @param {Array} data - المصفوفة الخام
 * @param {Object} schema - المخطط
 * @returns {Array} البيانات المعدلة
 */
function normalizeDataInternal(data, schema) {
  if (!data || data.length < 2) return data;

  const headers = data[0];
  const normalizedData = [headers];

  // تحسين: تحديد الفهارس والأنواع مسبقاً לתجاوز الـ switch/case أو الـ lookups داخل الحلقة
  const columnConfigs = headers.map((h, idx) => ({
    type: schema.columnTypes[h],
    name: h,
    idx: idx
  })).filter(c => c.type); // فقط الأعمدة التي لها تعريف نوع

  // معالجة كل صف
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const normalizedRow = [...row]; // نسخ الصف لتجنب تعديل الأصل مباشرة

    // تنفيذ التعديلات فقط على الأعمدة المعروفة في المخطط
    for (const config of columnConfigs) {
      if (config.idx >= row.length) continue;

      let value = row[config.idx];
      if (value === null || value === undefined) continue;

      switch (config.type) {
        case 'number':
          if (typeof value === 'string') {
            const parsed = parseFloat(value);
            normalizedRow[config.idx] = isNaN(parsed) ? value : parsed;
          }
          break;

        case 'string':
          if (typeof value !== 'string') {
            normalizedRow[config.idx] = safeString(value).trim();
          } else {
            normalizedRow[config.idx] = value.trim();
          }
          break;

        case 'date':
          let dateObj = value;
          // تحويل تاريخ إكسل الرقمي
          if (typeof value === 'number') {
            dateObj = new Date((value - 25569) * 86400 * 1000);
          } else if (!(value instanceof Date)) {
            dateObj = new Date(value);
          }

          if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            normalizedRow[config.idx] = `${year}-${month}-${day}`;
          }
          break;
      }
    }
    normalizedData.push(normalizedRow);
  }

  return normalizedData;
}

/**
 * Validate all tables
 * @param {Object} rawData - Object containing all raw data tables
 * @returns {Object} Validation results
 */
export const validateAllTables = (rawData) => {
  console.log('بدء التحقق من صحة جميع الجداول');

  // Normalize possible localized sheet names to canonical keys
  const nameAliases = {
    'مشتريات': 'purchases',
    'مبيعات': 'sales',
    'المخزون': 'physicalInventory',
    'الارصدة': 'supplierbalances',
    'supplierbalances': 'supplierbalances',
    'physicalInventory': 'physicalInventory',
    'sales': 'sales',
    'purchases': 'purchases'
  };

  const normalizedRaw = {};
  for (const key of Object.keys(rawData || {})) {
    const mapped = nameAliases[key] || key;
    normalizedRaw[mapped] = rawData[key];
  }

  const results = {};
  let allValid = true;
  const allErrors = [];

  // Validate each table
  for (const [tableName, schema] of Object.entries(TABLE_SCHEMAS)) {
    const tableData = normalizedRaw[tableName] || rawData[tableName];
    const tableResults = {
      isValid: true,
      errors: []
    };

    console.log(`التحقق من صحة جدول ${tableName}`);

    // Skip validation if table data doesn't exist
    if (!tableData) {
      tableResults.isValid = false;
      tableResults.errors.push(`بيانات جدول ${tableName} مفقودة`);
      allValid = false;
      allErrors.push(...tableResults.errors);
      results[tableName] = tableResults;
      continue;
    }

    // Perform fast combined validation
    const tableErrors = fastValidateTable(tableData, schema, tableName);

    if (tableErrors.length > 0) {
      tableResults.isValid = false;
      tableResults.errors = tableErrors;
      allValid = false;
      allErrors.push(...tableErrors.slice(0, 10)); // فقط أضف أول 10 أخطاء من كل جدول للقائمة العامة
    }

    results[tableName] = tableResults;
  }

  console.log('انتهى التحقق من صحة جميع الجداول', { allValid, allErrors });

  return {
    isValid: allValid,
    errors: allErrors,
    details: results
  };
};

/**
 * Normalize all data according to schemas
 * @param {Object} rawData - Object containing all raw data tables
 * @param {string} tableName - Name of the table to normalize
 * @returns {Array} Normalized data
 */
export const normalizeData = (rawData, tableName) => {
  const schema = TABLE_SCHEMAS[tableName];
  if (!schema) {
    console.warn(`مخطط غير معروف لجدول ${tableName}`);
    return rawData;
  }

  return normalizeDataInternal(rawData, schema);
};

// Export schemas for external use
export { TABLE_SCHEMAS };