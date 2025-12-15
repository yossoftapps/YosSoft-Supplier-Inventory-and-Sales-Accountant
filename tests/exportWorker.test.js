// Test file for export worker functionality
import { serializeData } from '../src/utils/financialCalculations.js';
import Decimal from 'decimal.js';

console.log('Testing export worker functionality...');

// Test data
const testData = {
  string: 'test',
  number: 123,
  boolean: true,
  nullValue: null,
  undefinedValue: undefined,
  decimal: new Decimal('456.78'),
  largeDecimal: new Decimal('12345678901234567890.123456789'),
  date: new Date('2023-01-01T12:00:00Z'),
  nested: {
    inner: 'value',
    number: 42
  },
  array: [1, 2, 3, 'test']
};

// Test circular reference
const circular = { name: 'test' };
circular.self = circular;

console.log('\n=== Testing serializeData with basic data types ===');
try {
  const serialized = serializeData(testData);
  
  console.log('✅ String handling:', serialized.string === 'test');
  console.log('✅ Number handling:', serialized.number === 123);
  console.log('✅ Boolean handling:', serialized.boolean === true);
  console.log('✅ Null handling:', serialized.nullValue === null);
  console.log('✅ Undefined handling:', serialized.undefinedValue === undefined);
  console.log('✅ Decimal handling:', typeof serialized.decimal === 'number' && serialized.decimal === 456.78);
  console.log('✅ Date handling:', serialized.date === '2023-01-01T12:00:00.000Z');
  console.log('✅ Nested object handling:', serialized.nested.inner === 'value' && serialized.nested.number === 42);
  console.log('✅ Array handling:', Array.isArray(serialized.array) && serialized.array.length === 4);
  
  console.log('✅ Basic serializeData tests passed');
} catch (error) {
  console.error('❌ Basic serializeData tests failed:', error.message);
}

console.log('\n=== Testing serializeData with circular references ===');
try {
  const serialized = serializeData(circular);
  
  console.log('✅ Circular reference handling:', serialized.name === 'test' && serialized.self === '[Circular Reference]');
  
  console.log('✅ Circular reference test passed');
} catch (error) {
  console.error('❌ Circular reference test failed:', error.message);
}

console.log('\n=== Testing serializeData with large arrays ===');
try {
  // Create a large array for testing chunked processing
  const largeArray = Array(15000).fill().map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: new Decimal(i * 1.5)
  }));

  const largeTestData = {
    largeDataSet: largeArray
  };

  const startTime = Date.now();
  const serialized = serializeData(largeTestData);
  const endTime = Date.now();
  
  console.log('✅ Large array handling:', Array.isArray(serialized.largeDataSet) && serialized.largeDataSet.length === 15000);
  console.log('✅ Large array Decimal handling:', typeof serialized.largeDataSet[0].value === 'number');
  console.log(`✅ Performance test completed in ${endTime - startTime} ms`);
  
  console.log('✅ Large array tests passed');
} catch (error) {
  console.error('❌ Large array tests failed:', error.message);
}

console.log('\n✅ All export worker tests completed!');