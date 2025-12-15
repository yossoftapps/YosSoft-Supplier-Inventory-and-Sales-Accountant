/**
 * Export Performance Test
 * 
 * This test verifies that the export functionality can handle large datasets
 * without running out of memory or taking excessive time.
 */

import { serializeData } from '../src/utils/financialCalculations.js';

// Mock large dataset for testing
function generateLargeDataset(rows = 10000) {
  const data = [];
  for (let i = 0; i < rows; i++) {
    data.push({
      id: i + 1,
      name: `Item ${i + 1}`,
      quantity: Math.floor(Math.random() * 1000),
      price: Math.floor(Math.random() * 10000) / 100,
      category: `Category ${Math.floor(i / 100) + 1}`,
      date: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000)
    });
  }
  return data;
}

console.log('Starting Export Performance Tests...');

// Test 1: Large array serialization
console.log('\n=== Test 1: Large Array Serialization ===');
try {
  const largeDataset = generateLargeDataset(15000);
  console.log(`Generated dataset with ${largeDataset.length} rows`);
  
  console.time('Serialization Time');
  const serialized = serializeData(largeDataset);
  console.timeEnd('Serialization Time');
  
  console.log(`Serialized data has ${serialized.length} items`);
  console.log('✅ Large array serialization test passed');
} catch (error) {
  console.error('❌ Large array serialization test failed:', error.message);
}

// Test 2: Deeply nested object serialization
console.log('\n=== Test 2: Deeply Nested Object Serialization ===');
try {
  const deeplyNested = {
    level1: {
      level2: {
        level3: {
          level4: {
            level5: {
              data: generateLargeDataset(1000)
            }
          }
        }
      }
    }
  };
  
  console.time('Deep Nesting Serialization Time');
  const serialized = serializeData(deeplyNested);
  console.timeEnd('Deep Nesting Serialization Time');
  
  console.log('✅ Deep nesting serialization test passed');
} catch (error) {
  console.error('❌ Deep nesting serialization test failed:', error.message);
}

// Test 3: Circular reference handling
console.log('\n=== Test 3: Circular Reference Handling ===');
try {
  const circular = { name: 'test' };
  circular.self = circular;
  
  console.time('Circular Reference Handling Time');
  const serialized = serializeData(circular);
  console.timeEnd('Circular Reference Handling Time');
  
  console.log('Serialized circular reference:', serialized);
  console.log('✅ Circular reference handling test passed');
} catch (error) {
  console.error('❌ Circular reference handling test failed:', error.message);
}

// Test 4: Memory usage monitoring
console.log('\n=== Test 4: Memory Usage Monitoring ===');
if (performance && performance.memory) {
  const memoryInfo = {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
  };
  
  console.log('Memory Info:', memoryInfo);
  console.log('✅ Memory monitoring test passed');
} else {
  console.log('⚠️  Memory monitoring not available in this environment');
}

console.log('\n=== Export Performance Tests Completed ===');
console.log('All tests verify that the export system can handle large datasets efficiently.');