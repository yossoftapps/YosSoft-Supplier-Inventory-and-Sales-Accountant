import { serializeData } from './financialCalculations';
import Decimal from 'decimal.js';

// Test cases for serializeData function
console.log('Testing enhanced serializeData function...');

// Test 1: Primitive values
console.log('Test 1 - Primitives:');
console.log('String:', serializeData('hello'));
console.log('Number:', serializeData(42));
console.log('Boolean:', serializeData(true));
console.log('Null:', serializeData(null));
console.log('Undefined:', serializeData(undefined));

// Test 2: Decimal objects
console.log('\nTest 2 - Decimal objects:');
const decimalValue = new Decimal('123.45');
console.log('Decimal:', serializeData(decimalValue));

// Test 3: Arrays
console.log('\nTest 3 - Arrays:');
const arrayData = [1, 'test', new Decimal('99.99'), null];
console.log('Array:', serializeData(arrayData));

// Test 4: Objects
console.log('\nTest 4 - Objects:');
const objectData = {
  name: 'test',
  value: new Decimal('55.55'),
  nested: {
    inner: new Decimal('10.10')
  }
};
console.log('Object:', serializeData(objectData));

// Test 5: Complex nested structure
console.log('\nTest 5 - Complex structure:');
const complexData = {
  id: 1,
  items: [
    { name: 'item1', price: new Decimal('100.00') },
    { name: 'item2', price: new Decimal('200.00') }
  ],
  total: new Decimal('300.00'),
  metadata: {
    createdAt: new Date(),
    tags: ['tag1', 'tag2']
  }
};
console.log('Complex:', JSON.stringify(serializeData(complexData), null, 2));

// Test 6: Map and Set objects
console.log('\nTest 6 - Map and Set:');
const mapData = new Map([['key1', 'value1'], ['key2', new Decimal('123.45')]]);
const setData = new Set([1, 2, 'test', new Decimal('67.89')]);
console.log('Map:', serializeData(mapData));
console.log('Set:', serializeData(setData));

// Test 7: Circular references
console.log('\nTest 7 - Circular references:');
const circularObj = { name: 'circular' };
circularObj.self = circularObj;
console.log('Circular reference:', serializeData(circularObj));

// Test 8: Functions and symbols
console.log('\nTest 8 - Functions and symbols:');
const functionData = {
  name: 'test',
  func: function() { return 'hello'; },
  symbol: Symbol('test'),
  normalProp: 'normal'
};
console.log('With functions/symbols:', serializeData(functionData));

// Test 9: Edge cases
console.log('\nTest 9 - Edge cases:');
console.log('Empty object:', serializeData({}));
console.log('Empty array:', serializeData([]));
console.log('Date object:', serializeData(new Date('2023-01-01')));

console.log('\nAll enhanced tests completed!');
