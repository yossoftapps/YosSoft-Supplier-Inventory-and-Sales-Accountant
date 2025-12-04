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
      'م', 'رمز الحساب', 'المورد', 'مدين', 'دائن', 'الحساب المساعد'
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
 * Validate data types for each column
 * @param {Array} data - The raw data array
 * @param {Object} schema - The schema to validate against
 * @param {string} tableName - Name of the table for error messages
 * @returns {Array} Array of error messages
 */
function validateDataTypes(data, schema, tableName) {
  const errors = [];
  if (!data || data.length < 2) return errors;
  
  const headers = data[0];
  
  // Validate each row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    for (let j = 0; j < headers.length && j < row.length; j++) {
      const columnName = headers[j];
      const value = row[j];
      const expectedType = schema.columnTypes[columnName];
      
      if (expectedType && value !== null && value !== undefined && value !== '') {
        let isValid = true;
        let errorMessage = '';
        
        switch (expectedType) {
          case 'number':
            // Check if it's a valid number
            if (typeof value !== 'number' && isNaN(parseFloat(value))) {
              isValid = false;
              errorMessage = `القيمة "${value}" في العمود ${columnName} ليست رقماً صالحاً`;
            }
            break;
            
          case 'string':
            // Check if it's a string or can be converted to string
            if (value === null || value === undefined) {
              isValid = false;
              errorMessage = `القيمة في العمود ${columnName} فارغة`;
            }
            break;
            
          case 'date':
            // Check if it's a valid date
            if (!isValidDate(value)) {
              isValid = false;
              errorMessage = `القيمة "${value}" في العمود ${columnName} ليست تاريخاً صالحاً`;
            }
            break;
        }
        
        if (!isValid) {
          errors.push(`خطا في صف ${i} لجدول ${tableName}: ${errorMessage}`);
        }
      }
    }
  }
  
  return errors;
}

/**
 * Validate required fields are not empty
 * @param {Array} data - The raw data array
 * @param {Object} schema - The schema to validate against
 * @param {string} tableName - Name of the table for error messages
 * @returns {Array} Array of error messages
 */
function validateRequiredFields(data, schema, tableName) {
  const errors = [];
  if (!data || data.length < 2) return errors;
  
  const headers = data[0];
  const requiredFields = schema.requiredFields || [];
  
  // Find indices of required fields
  const requiredIndices = requiredFields.map(field => headers.indexOf(field));
  
  // Validate each row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    for (let j = 0; j < requiredFields.length; j++) {
      const fieldIndex = requiredIndices[j];
      if (fieldIndex !== -1 && fieldIndex < row.length) {
        const value = row[fieldIndex];
        if (value === null || value === undefined || value === '' || 
            (typeof value === 'string' && value.trim() === '')) {
          errors.push(`الحقل المطلوب "${requiredFields[j]}" فارغ في صف ${i} لجدول ${tableName}`);
        }
      }
    }
  }
  
  return errors;
}

/**
 * Validate allowed values for specific columns
 * @param {Array} data - The raw data array
 * @param {Object} schema - The schema to validate against
 * @param {string} tableName - Name of the table for error messages
 * @returns {Array} Array of error messages
 */
function validateAllowedValues(data, schema, tableName) {
  const errors = [];
  if (!data || data.length < 2) return errors;
  
  const headers = data[0];
  const allowedValues = schema.allowedValues || {};
  
  // Process each allowed value constraint
  for (const [columnName, allowed] of Object.entries(allowedValues)) {
    const columnIndex = headers.indexOf(columnName);
    if (columnIndex !== -1) {
      // Validate each row
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (columnIndex < row.length) {
          const value = row[columnIndex];
          if (value !== null && value !== undefined && !allowed.includes(value)) {
            errors.push(`القيمة "${value}" غير مسموحة في العمود ${columnName} لصف ${i} في جدول ${tableName}. القيم المسموحة: ${allowed.join(', ')}`);
          }
        }
      }
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
function normalizeDataInternal(data, schema) {
  if (!data || data.length < 2) return data;
  
  const headers = data[0];
  const normalizedData = [headers];
  
  // Process each row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const normalizedRow = [];
    
    for (let j = 0; j < headers.length && j < row.length; j++) {
      const columnName = headers[j];
      let value = row[j];
      const expectedType = schema.columnTypes[columnName];
      
      if (expectedType && value !== null && value !== undefined) {
        switch (expectedType) {
          case 'number':
            // Convert to number
            if (typeof value === 'string') {
              value = parseFloat(value);
            }
            break;
            
          case 'string':
            // Convert to string and trim
            if (typeof value !== 'string') {
              value = String(value);
            }
            value = value.trim();
            break;
            
          case 'date':
            // Convert to proper date format
            // Handle Excel serial numbers (e.g. 46204) by converting
            // from Excel epoch to JS Date: (serial - 25569) * 86400 * 1000
            if (typeof value === 'number') {
              try {
                const jsDate = new Date((value - 25569) * 86400 * 1000);
                value = jsDate;
              } catch (e) {
                value = new Date(value);
              }
            } else if (!(value instanceof Date)) {
              value = new Date(value);
            }

            // Format as yyyy-mm-dd when we have a valid Date
            if (value instanceof Date && !isNaN(value.getTime())) {
              const year = value.getFullYear();
              const month = String(value.getMonth() + 1).padStart(2, '0');
              const day = String(value.getDate()).padStart(2, '0');
              value = `${year}-${month}-${day}`;
            }
            break;
        }
      }
      
      normalizedRow.push(value);
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
    
    // Perform all validations
    const columnErrors = validateColumns(tableData, schema, tableName);
    const dataTypeErrors = validateDataTypes(tableData, schema, tableName);
    const requiredFieldErrors = validateRequiredFields(tableData, schema, tableName);
    const allowedValueErrors = validateAllowedValues(tableData, schema, tableName);
    
    // Collect all errors
    const tableErrors = [...columnErrors, ...dataTypeErrors, ...requiredFieldErrors, ...allowedValueErrors];
    
    if (tableErrors.length > 0) {
      tableResults.isValid = false;
      tableResults.errors = tableErrors;
      allValid = false;
      allErrors.push(...tableErrors);
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