// وحدة للحسابات المالية الدقيقة باستخدام Decimal.js
// تنفيذ سياسات التقريب المحددة في مواصفات المشروع

import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20, // High precision for intermediate calculations
  rounding: Decimal.ROUND_HALF_UP, // Standard rounding policy
  toExpNeg: -7,
  toExpPos: 21
});

/**
 * تقريب قيمة عشرية إلى عدد محدد من المنازل العشرية
 * @param {number|string|Decimal} value - القيمة التي سيتم تقريبها
 * @param {number} decimals - عدد المنازل العشرية (الافتراضي: 2 للكميات، 0 للمبالغ المالية)
 * @returns {Decimal} قيمة عشرية مقربة
 */
export const roundToDecimalPlaces = (value, decimals = 2) => {
  // Handle undefined or null values
  if (value === null || value === undefined) {
    value = 0;
  }
  const decimalValue = parseToDecimal(value);
  return decimalValue.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
};

/**
 * تقريب مبلغ مالي إلى أقرب عدد صحيح (بدون منازل عشرية)
 * حسب ما هو محدد في المتطلبات: يجب أن تكون المبالغ المالية أعداد صحيحة
 * @param {number|string|Decimal} value - القيمة المالية التي سيتم تقريبها
 * @returns {Decimal} قيمة عدد صحيح مقرب
 */
export const roundToInteger = (value) => {
  // Handle undefined or null values
  if (value === null || value === undefined) {
    value = 0;
  }
  const decimalValue = parseToDecimal(value);
  return decimalValue.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
};

/**
 * تنسيق قيمة كمية إلى منزلتين عشريتين بالضبط (تنسيق 00.00)
 * حسب ما هو محدد في المتطلبات لعرض الكمية
 * @param {number|string|Decimal} value - قيمة الكمية التي سيتم تنسيقها
 * @returns {string} سلسلة نصية منسقة بمنزلتين عشريتين بالضبط
 */
export const formatQuantity = (value) => {
  // Handle undefined or null values
  if (value === null || value === undefined) {
    return "0.00";
  }
  try {
    const decimalValue = parseToDecimal(value);
    const rounded = decimalValue.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    return rounded.toFixed(2);
  } catch (error) {
    // Fallback to 0 if parsing fails
    return "0.00";
  }
};

/**
 * تنسيق مبلغ مالي كعدد صحيح مع فاصل الآلاف
 * حسب ما هو محدد في المتطلبات لعرض القيمة المالية
 * @param {number|string|Decimal} value - القيمة المالية التي سيتم تنسيقها
 * @returns {string} سلسلة نصية منسقة كعدد صحيح مع فاصل الآلاف
 */
export const formatMoney = (value) => {
  // Handle undefined or null values
  if (value === null || value === undefined) {
    return "0";
  }
  try {
    const decimalValue = parseToDecimal(value);
    const rounded = decimalValue.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    // Add thousands separator for display
    return rounded.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } catch (error) {
    // Fallback to 0 if parsing fails
    return "0";
  }
};

/**
 * تحليل وتحقق من صحة قيمة كمية
 * يجب أن تكون الكميات أرقامًا بحد أقصى منزلتين عشريتين
 * @param {string|number} value - القيمة التي سيتم تحليلها
 * @returns {Decimal|null} قيمة عشرية محللة أو null إذا كانت غير صالحة
 */
export const parseQuantity = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  try {
    const decimalValue = parseToDecimal(value);
    if (!decimalValue.isFinite()) return null;
    return decimalValue;
  } catch (error) {
    return null;
  }
};

/**
 * تحليل وتحقق من صحة قيمة مالية
 * يجب أن تكون المبالغ المالية أعدادًا صحيحة (بدون منازل عشرية)
 * @param {string|number} value - القيمة التي سيتم تحليلها
 * @returns {Decimal|null} قيمة عدد صحيح محللة أو null إذا كانت غير صالحة
 */
export const parseMoney = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  try {
    const decimalValue = parseToDecimal(value);
    if (!decimalValue.isFinite()) return null;
    return roundToInteger(decimalValue);
  } catch (error) {
    return null;
  }
};

/**
 * ضرب قيمتين باستخدام الحساب العشري الدقيق
 * @param {number|string|Decimal} a - المعامل الأول
 * @param {number|string|Decimal} b - المعامل الثاني
 * @returns {Decimal} حاصل ضرب a و b
 */
export const multiply = (a, b) => {
  // Handle undefined or null values
  if (a === null || a === undefined) a = 0;
  if (b === null || b === undefined) b = 0;
  const decimalA = parseToDecimal(a);
  const decimalB = parseToDecimal(b);
  return decimalA.times(decimalB);
};

/**
 * قسمة قيمتين باستخدام الحساب العشري الدقيق
 * @param {number|string|Decimal} a - المقسوم
 * @param {number|string|Decimal} b - المقسوم عليه
 * @returns {Decimal} خارج قسمة a على b
 */
export const divide = (a, b) => {
  // Handle undefined or null values
  if (a === null || a === undefined) a = 0;
  if (b === null || b === undefined) b = 0;
  const decimalA = parseToDecimal(a);
  const decimalB = parseToDecimal(b);
  if (decimalB.isZero()) {
    throw new Error('Division by zero');
  }
  return decimalA.dividedBy(decimalB);
};

/**
 * جمع قيمتين باستخدام الحساب العشري الدقيق
 * @param {number|string|Decimal} a - المعامل الأول
 * @param {number|string|Decimal} b - المعامل الثاني
 * @returns {Decimal} مجموع a و b
 */
export const add = (a, b) => {
  // Handle undefined or null values
  if (a === null || a === undefined) a = 0;
  if (b === null || b === undefined) b = 0;
  const decimalA = parseToDecimal(a);
  const decimalB = parseToDecimal(b);
  return decimalA.plus(decimalB);
};

/**
 * طرح قيمتين باستخدام الحساب العشري الدقيق
 * @param {number|string|Decimal} a - المطروح منه
 * @param {number|string|Decimal} b - المطروح
 * @returns {Decimal} فرق a ناقص b
 */
export const subtract = (a, b) => {
  // Handle undefined or null values
  if (a === null || a === undefined) a = 0;
  if (b === null || b === undefined) b = 0;
  const decimalA = parseToDecimal(a);
  const decimalB = parseToDecimal(b);
  return decimalA.minus(decimalB);
};

/**
 * مقارنة قيمتين
 * @param {number|string|Decimal} a - القيمة الأولى
 * @param {number|string|Decimal} b - القيمة الثانية
 * @returns {number} -1 إذا كانت a < b، 0 إذا كانت a == b، 1 إذا كانت a > b
 */
export const compare = (a, b) => {
  // Handle undefined or null values
  if (a === null || a === undefined) a = 0;
  if (b === null || b === undefined) b = 0;
  const decimalA = parseToDecimal(a);
  const decimalB = parseToDecimal(b);
  return decimalA.comparedTo(decimalB);
};

/**
 * تنقية وتحليل تنسيقات إدخال الأرقام المختلفة إلى مثيل عشري
 * يقبل الأرقام ومثيلات Decimal والنصوص مع فواصل الآلاف
 * أو الأرقام المترجمة (الرقم العربي). يعيد قيمة عشرية أو يرمي استثناء.
 */
const parseToDecimal = (input) => {
  // If already a Decimal instance
  if (input instanceof Decimal) return input;

  // Nullish -> zero
  if (input === null || input === undefined || input === '') return new Decimal(0);

  // If it's already a number, pass through
  if (typeof input === 'number') return new Decimal(input);

  // Otherwise assume string-like: sanitize
  let s = String(input).trim();

  // Remove common invisible/control characters (UTF control chars)
  s = s.replace(/[\u0000-\u001F\u007F]/g, '');

  // Handle the special case where we have a very long string with many numbers concatenated
  // This can happen when formatted values are passed back to the parser
  if (s.length > 50) {
    // Extract all valid number patterns and take the first reasonable one
    const numberMatches = s.match(/\d+(\.\d+)?/g);
    if (numberMatches && numberMatches.length > 0) {
      // Take the first match that looks reasonable (not too long)
      for (let i = 0; i < numberMatches.length; i++) {
        const match = numberMatches[i];
        if (match.length <= 20) { // Reasonable length for a number
          s = match;
          break;
        }
      }
      // If all matches are too long, take the first one anyway
      if (s === String(input).trim()) {
        s = numberMatches[0];
      }
    }
  } else {
    // Normal processing for shorter strings
    // For numbers with potential commas (thousands separators or decimal),
    // we need to handle them differently
    // First, apply the thousands/decimal separator logic above
    // This section is only reached if the comma processing above didn't change the string
    // or if there are no commas in the string
    if (s.indexOf(',') === -1) {  // Only if no commas remain
      const numberMatches = s.match(/[\d.]+/g);
      if (numberMatches && numberMatches.length > 0) {
        // Look for the first match that looks like a valid number
        for (let i = 0; i < numberMatches.length; i++) {
          const match = numberMatches[i];
          // Validate that it's a proper number format
          if (/^\d+(\.\d+)?$/.test(match)) {
            s = match;
            break;
          }
        }
        // If no valid format found, use the first match
        if (s === String(input).trim()) {
          s = numberMatches[0];
        }
      }
    }
  }

  // Convert Arabic-Indic digits (٠-٩) and Eastern Arabic-Indic (۰-۹) to western digits
  s = s.replace(/[\u0660-\u0669]/g, ch => String(ch.charCodeAt(0) - 0x0660));
  s = s.replace(/[\u06F0-\u06F9]/g, ch => String(ch.charCodeAt(0) - 0x06F0));

  // Normalize commas/dots: handle decimal comma vs thousand separators
  const commaCount = (s.match(/,/g) || []).length;
  const dotCount = (s.match(/\./g) || []).length;
  if (commaCount > 0 && dotCount === 0) {
    // Check if commas follow thousands separator pattern (every 3 digits from right)
    // For example: 1,000,000 is valid (3 digits after each comma), 1,2345 is not (4 digits after comma)
    const parts = s.split(',');
    let isThousandsSeparator = true;
    
    // Check if all parts except the first have exactly 3 digits (as in proper thousands separator)
    // The first part can have 1-3 digits, subsequent parts should have exactly 3
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].length !== 3) {
        isThousandsSeparator = false;
        break;
      }
    }
    
    if (isThousandsSeparator) {
      s = s.replace(/,/g, ''); // remove thousand separators
    } else {
      s = s.replace(',', '.'); // treat as decimal separator (for first comma)
    }
  } else {
    s = s.replace(/,/g, ''); // remove commas when dots present
  }

  // Remove spaces and apostrophes
  s = s.replace(/[\s']/g, '');

  // Validate that we have a proper number format
  if (!/^\d+(\.\d+)?$/.test(s)) {
    // If not a valid number format, try to extract the first valid part
    const parts = s.split('.');
    if (parts.length > 1) {
      // Take the first part as integer and second as decimal
      const integerPart = parts[0].replace(/\D/g, ''); // Keep only digits
      const decimalPart = parts[1].replace(/\D/g, ''); // Keep only digits
      s = integerPart + (decimalPart ? '.' + decimalPart : '');
    } else {
      // Just keep digits
      s = s.replace(/\D/g, '');
    }
    // If we ended up with an empty string, use 0
    if (s === '') s = '0';
  }

  return new Decimal(s);
};

// تسلسل البيانات عن طريق تحويل الكائنات العشرية إلى أرقام بسيطة
// محسّن للتعامل مع أنواع البيانات المعقدة بشكل آمن وفعال
export const serializeData = (data, seen = new WeakSet(), depth = 0) => {
  // Prevent deep nesting which can cause performance issues
  if (depth > 100) {
    return '[Max Depth Reached]';
  }

  // Handle null and undefined
  if (data === null || data === undefined) return data;

  // Handle primitive types
  if (typeof data !== 'object' && typeof data !== 'function') return data;

  // Handle functions - convert to string representation or null
  if (typeof data === 'function') {
    // For Web Worker compatibility, functions must be removed from data
    return null;
  }

  // Handle Date objects
  if (data instanceof Date) return data.toISOString();

  // Handle Decimal objects specifically
  if (data instanceof Decimal) {
    // For very large or small numbers, use toFixed to prevent scientific notation
    const num = data.toNumber();
    if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return data.toString(); // Keep as string to preserve precision
    }
    return num;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    // For large arrays, process in chunks to avoid blocking
    if (data.length > 10000) {
      const result = [];
      for (let i = 0; i < data.length; i += 1000) {
        const chunk = data.slice(i, i + 1000);
        result.push(...chunk.map(item => serializeData(item, seen, depth + 1)));
      }
      return result;
    }
    return data.map(item => serializeData(item, seen, depth + 1));
  }

  // Handle Map objects
  if (data instanceof Map) {
    const serialized = {};
    for (const [key, value] of data) {
      const keyStr = typeof key === 'string' ? key : String(key);
      serialized[keyStr] = serializeData(value, seen, depth + 1);
    }
    return serialized;
  }

  // Handle Set objects
  if (data instanceof Set) {
    return Array.from(data).map(item => serializeData(item, seen, depth + 1));
  }

  // Handle other object types
  if (typeof data === 'object') {
    // Check for circular references
    if (seen.has(data)) {
      return '[Circular Reference]';
    }
    seen.add(data);

    try {
      const serialized = {};

      // Handle different types of keys and values
      const keys = Object.keys(data);
      
      // For objects with many keys, process in smaller chunks
      if (keys.length > 1000) {
        for (let i = 0; i < keys.length; i += 100) {
          const chunkKeys = keys.slice(i, i + 100);
          for (const key of chunkKeys) {
            try {
              const value = data[key];

              // Skip functions and symbols
              if (typeof value === 'function' || typeof value === 'symbol') {
                continue;
              }

              // Skip prototype properties
              if (!data.hasOwnProperty(key)) {
                continue;
              }

              // Serialize the value
              serialized[key] = serializeData(value, seen, depth + 1);
            } catch (error) {
              console.warn(`Failed to serialize property ${key}:`, error);
              serialized[key] = '[Unserializable]';
            }
          }
        }
      } else {
        for (const key of keys) {
          try {
            const value = data[key];

            // Skip functions and symbols
            if (typeof value === 'function' || typeof value === 'symbol') {
              continue;
            }

            // Skip prototype properties
            if (!data.hasOwnProperty(key)) {
              continue;
            }

            // Serialize the value
            serialized[key] = serializeData(value, seen, depth + 1);
          } catch (error) {
            console.warn(`Failed to serialize property ${key}:`, error);
            serialized[key] = '[Unserializable]';
          }
        }
      }

      seen.delete(data); // Remove from seen set after processing
      return serialized;
    } catch (error) {
      console.warn('Failed to serialize object:', error);
      seen.delete(data);
      return '[Unserializable Object]';
    }
  }

  // Return as-is for any other cases
  return data;
};

// Export the Decimal class for advanced usage if needed
export { Decimal };