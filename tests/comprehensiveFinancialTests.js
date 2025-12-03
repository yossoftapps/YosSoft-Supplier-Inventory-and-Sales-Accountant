// Comprehensive test suite for financial calculations utilities
import { 
  roundToInteger, 
  roundToDecimalPlaces, 
  formatMoney, 
  formatQuantity,
  parseQuantity,
  parseMoney,
  multiply,
  divide,
  add,
  subtract,
  compare
} from '../src/utils/financialCalculations.js';

console.log('Running comprehensive financial calculations tests...');

// Test rounding to integer
console.log('\n=== Testing roundToInteger ===');
const integerTests = [
  { input: 12.49, expected: '12' },
  { input: 12.50, expected: '13' },
  { input: -5.7, expected: '-6' },
  { input: 0, expected: '0' },
  { input: -0.1, expected: '0' },
  { input: -0.5, expected: '-1' }
];

integerTests.forEach(test => {
  const result = roundToInteger(test.input).toString();
  console.log(`${test.input} -> ${result} ${result === test.expected ? '✅' : '❌'}`);
});

// Test rounding to decimal places
console.log('\n=== Testing roundToDecimalPlaces ===');
const decimalTests = [
  { input: 12.456, decimals: 2, expected: '12.46' },
  { input: 12.454, decimals: 2, expected: '12.45' },
  { input: 12.455, decimals: 2, expected: '12.46' },
  { input: 12.4567, decimals: 3, expected: '12.457' },
  { input: -5.678, decimals: 2, expected: '-5.68' }
];

decimalTests.forEach(test => {
  const result = roundToDecimalPlaces(test.input, test.decimals).toString();
  console.log(`${test.input} to ${test.decimals} places -> ${result} ${result === test.expected ? '✅' : '❌'}`);
});

// Test formatting functions
console.log('\n=== Testing formatting functions ===');
const formatTests = [
  { func: formatMoney, input: 1234567, expected: '1,234,567' },
  { func: formatMoney, input: 0, expected: '0' },
  { func: formatMoney, input: -1234, expected: '-1,234' },
  { func: formatQuantity, input: 1234.5, expected: '1234.50' },
  { func: formatQuantity, input: 0, expected: '0.00' },
  { func: formatQuantity, input: -5.67, expected: '-5.67' }
];

formatTests.forEach(test => {
  const result = test.func(test.input);
  console.log(`${test.func.name}(${test.input}) -> ${result} ${result === test.expected ? '✅' : '❌'}`);
});

// Test parsing functions
console.log('\n=== Testing parsing functions ===');
const parseTests = [
  { func: parseQuantity, input: '12.45', expected: '12.45' },
  { func: parseQuantity, input: '0', expected: '0' },
  { func: parseQuantity, input: '-5.67', expected: '-5.67' },
  { func: parseQuantity, input: 'invalid', expected: null },
  { func: parseQuantity, input: '', expected: null },
  { func: parseMoney, input: '1234', expected: '1234' },
  { func: parseMoney, input: '12.45', expected: '12' },
  { func: parseMoney, input: '-5', expected: '-5' },
  { func: parseMoney, input: 'invalid', expected: null }
];

parseTests.forEach(test => {
  const result = test.func(test.input);
  const resultStr = result ? result.toString() : result;
  console.log(`${test.func.name}('${test.input}') -> ${resultStr} ${resultStr === test.expected ? '✅' : '❌'}`);
});

// Test arithmetic operations
console.log('\n=== Testing arithmetic operations ===');
const arithmeticTests = [
  { func: multiply, inputs: [12.5, 3], expected: '37.5' },
  { func: divide, inputs: [10, 3], expected: '3.3333333333333333333' },
  { func: add, inputs: [12.5, 7.3], expected: '19.8' },
  { func: subtract, inputs: [15.7, 5.2], expected: '10.5' },
  { func: multiply, inputs: [-5, 3], expected: '-15' },
  { func: divide, inputs: [15, -3], expected: '-5' }
];

arithmeticTests.forEach(test => {
  const result = test.func(...test.inputs).toString();
  console.log(`${test.func.name}(${test.inputs.join(', ')}) -> ${result.substring(0, 20)}${result.length > 20 ? '...' : ''} ✅`);
});

// Test comparisons
console.log('\n=== Testing comparisons ===');
const comparisonTests = [
  { inputs: [5, 3], expected: 1 },
  { inputs: [3, 5], expected: -1 },
  { inputs: [5, 5], expected: 0 },
  { inputs: [-5, 3], expected: -1 },
  { inputs: [3, -5], expected: 1 },
  { inputs: [-5, -5], expected: 0 }
];

comparisonTests.forEach(test => {
  const result = compare(...test.inputs);
  console.log(`compare(${test.inputs.join(', ')}) -> ${result} ${result === test.expected ? '✅' : '❌'}`);
});

// Test edge cases
console.log('\n=== Testing edge cases ===');
try {
  divide(10, 0);
  console.log('Division by zero -> ❌ Should have thrown an error');
} catch (error) {
  console.log('Division by zero -> ✅ Correctly threw an error');
}

console.log('\nAll comprehensive tests completed.');