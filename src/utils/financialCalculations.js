// Utility module for precise financial calculations using Decimal.js
// Implements the rounding policies specified in the project specifications

import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20, // High precision for intermediate calculations
  rounding: Decimal.ROUND_HALF_UP, // Standard rounding policy
  toExpNeg: -7,
  toExpPos: 21
});

/**
 * Round a decimal value to a specified number of decimal places
 * @param {number|string|Decimal} value - The value to round
 * @param {number} decimals - Number of decimal places (default: 2 for quantities, 0 for monetary amounts)
 * @returns {Decimal} Rounded decimal value
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
 * Round a monetary amount to nearest integer (no decimal places)
 * As specified in the requirements: monetary amounts should be integers
 * @param {number|string|Decimal} value - The monetary value to round
 * @returns {Decimal} Rounded integer value
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
 * Format a quantity value to exactly 2 decimal places (00.00 format)
 * As specified in the requirements for quantity display
 * @param {number|string|Decimal} value - The quantity value to format
 * @returns {string} Formatted string with exactly 2 decimal places
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
 * Format a monetary amount as integer with thousands separator
 * As specified in the requirements for monetary display
 * @param {number|string|Decimal} value - The monetary value to format
 * @returns {string} Formatted string as integer with thousands separator
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
 * Parse and validate a quantity value
 * Quantities should be numbers with up to 2 decimal places
 * @param {string|number} value - The value to parse
 * @returns {Decimal|null} Parsed decimal value or null if invalid
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
 * Parse and validate a monetary value
 * Monetary amounts should be integers (no decimal places)
 * @param {string|number} value - The value to parse
 * @returns {Decimal|null} Parsed integer value or null if invalid
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
 * Multiply two values with precise decimal arithmetic
 * @param {number|string|Decimal} a - First operand
 * @param {number|string|Decimal} b - Second operand
 * @returns {Decimal} Product of a and b
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
 * Divide two values with precise decimal arithmetic
 * @param {number|string|Decimal} a - Dividend
 * @param {number|string|Decimal} b - Divisor
 * @returns {Decimal} Quotient of a divided by b
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
 * Add two values with precise decimal arithmetic
 * @param {number|string|Decimal} a - First operand
 * @param {number|string|Decimal} b - Second operand
 * @returns {Decimal} Sum of a and b
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
 * Subtract two values with precise decimal arithmetic
 * @param {number|string|Decimal} a - Minuend
 * @param {number|string|Decimal} b - Subtrahend
 * @returns {Decimal} Difference of a minus b
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
 * Compare two values
 * @param {number|string|Decimal} a - First value
 * @param {number|string|Decimal} b - Second value
 * @returns {number} -1 if a < b, 0 if a == b, 1 if a > b
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
 * Sanitize and parse various number input formats into a Decimal instance
 * Accepts numbers, Decimal instances, and strings with thousand separators
 * or localized digits (Arabic-Indic). Returns a Decimal or throws.
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
    // If the string contains multiple numbers, extract the first valid one
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

  // Convert Arabic-Indic digits (٠-٩) and Eastern Arabic-Indic (۰-۹) to western digits
  s = s.replace(/[\u0660-\u0669]/g, ch => String(ch.charCodeAt(0) - 0x0660));
  s = s.replace(/[\u06F0-\u06F9]/g, ch => String(ch.charCodeAt(0) - 0x06F0));

  // Normalize commas/dots: handle decimal comma vs thousand separators
  const commaCount = (s.match(/,/g) || []).length;
  const dotCount = (s.match(/\./g) || []).length;
  if (commaCount > 0 && dotCount === 0) {
    if (commaCount === 1) {
      s = s.replace(',', '.'); // likely decimal comma
    } else {
      s = s.replace(/,/g, ''); // remove thousand separators
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

// Serialize data by converting Decimal objects to plain numbers
// Enhanced to handle complex data types safely and efficiently
export const serializeData = (data, seen = new WeakSet(), depth = 0) => {
  // Prevent deep nesting which can cause performance issues
  if (depth > 100) {
    return '[Max Depth Reached]';
  }

  // Handle null and undefined
  if (data === null || data === undefined) return data;

  // Handle primitive types
  if (typeof data !== 'object') return data;

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