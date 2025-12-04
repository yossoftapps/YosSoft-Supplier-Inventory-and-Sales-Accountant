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
  const rounded = roundToDecimalPlaces(value, 2);
  return rounded.toFixed(2);
};

/**
 * Format a monetary amount as integer with thousands separator
 * As specified in the requirements for monetary display
 * @param {number|string|Decimal} value - The monetary value to format
 * @returns {string} Formatted string as integer with thousands separator
 */
export const formatMoney = (value) => {
  const rounded = roundToInteger(value);
  // Add thousands separator for display
  return rounded.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

  return new Decimal(s);
};

// Export the Decimal class for advanced usage if needed
export { Decimal };
