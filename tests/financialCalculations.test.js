// Test file for financial calculations utilities
import { 
  roundToInteger, 
  roundToDecimalPlaces, 
  formatMoney, 
  formatQuantity,
  multiply,
  divide,
  add,
  subtract,
  compare
} from '../src/utils/financialCalculations.js';

console.log('Testing financial calculations utilities...');

// Test rounding to integer
console.log('Testing roundToInteger:');
console.log('12.49 ->', roundToInteger(12.49).toString()); // Should be 12
console.log('12.50 ->', roundToInteger(12.50).toString()); // Should be 13
console.log('-5.7 ->', roundToInteger(-5.7).toString()); // Should be -6

// Test rounding to decimal places
console.log('\nTesting roundToDecimalPlaces:');
console.log('12.456 to 2 places ->', roundToDecimalPlaces(12.456, 2).toString()); // Should be 12.46
console.log('12.454 to 2 places ->', roundToDecimalPlaces(12.454, 2).toString()); // Should be 12.45

// Test formatting
console.log('\nTesting formatting functions:');
console.log('formatMoney(1234567) ->', formatMoney(1234567)); // Should be 1,234,567
console.log('formatQuantity(1234.5) ->', formatQuantity(1234.5)); // Should be 1234.50

// Test arithmetic operations
console.log('\nTesting arithmetic operations:');
console.log('multiply(12.5, 3) ->', multiply(12.5, 3).toString()); // Should be 37.5
console.log('divide(10, 3) ->', divide(10, 3).toString()); // Should be 3.333...
console.log('add(12.5, 7.3) ->', add(12.5, 7.3).toString()); // Should be 19.8
console.log('subtract(15.7, 5.2) ->', subtract(15.7, 5.2).toString()); // Should be 10.5

// Test comparisons
console.log('\nTesting comparisons:');
console.log('compare(5, 3) ->', compare(5, 3)); // Should be 1
console.log('compare(3, 5) ->', compare(3, 5)); // Should be -1
console.log('compare(5, 5) ->', compare(5, 5)); // Should be 0

console.log('\nAll tests completed.');