// Performance test for large dataset processing
import { multiply, add, subtract, compare } from '../src/utils/financialCalculations.js';

console.log('Starting performance tests...');

// Generate large test datasets
function generateLargeDataset(size) {
  const data = [];
  for (let i = 0; i < size; i++) {
    data.push({
      'م': i + 1,
      'رمز المادة': `MAT-${Math.floor(i / 100)}`,
      'اسم المادة': `Material ${i}`,
      'الوحدة': 'KG',
      'الكمية': Math.random() * 100,
      'تاريخ الصلاحية': new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'المورد': `Supplier-${Math.floor(i / 500)}`,
      'الافرادي': Math.random() * 1000,
      'تاريخ العملية': new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'نوع العملية': i % 2 === 0 ? 'مشتريات' : 'مبيعات'
    });
  }
  return data;
}

// Test financial calculations performance
function testFinancialCalculations(iterations) {
  console.log(`\n=== Testing financial calculations performance (${iterations} iterations) ===`);
  const startTime = Date.now();
  
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    const a = Math.random() * 1000;
    const b = Math.random() * 1000;
    const c = Math.random() * 1000;
    
    // Chain multiple operations
    const calc1 = multiply(a, b);
    const calc2 = add(calc1, c);
    const calc3 = subtract(calc2, a);
    const comparison = compare(calc3, b);
    
    result += comparison;
  }
  
  const endTime = Date.now();
  console.log(`Time taken: ${endTime - startTime} ms`);
  console.log(`Operations per second: ${Math.round(iterations / ((endTime - startTime) / 1000))}`);
  return endTime - startTime;
}

// Test dataset generation performance
function testDatasetGeneration(size) {
  console.log(`\n=== Testing dataset generation performance (${size} records) ===`);
  const startTime = Date.now();
  
  const dataset = generateLargeDataset(size);
  
  const endTime = Date.now();
  console.log(`Time taken: ${endTime - startTime} ms`);
  console.log(`Records per second: ${Math.round(size / ((endTime - startTime) / 1000))}`);
  return endTime - startTime;
}

// Test sorting performance
function testSortingPerformance(dataset) {
  console.log('\n=== Testing sorting performance ===');
  const startTime = Date.now();
  
  // Sort by date
  const sortedByDate = [...dataset].sort((a, b) => 
    new Date(a['تاريخ العملية']) - new Date(b['تاريخ العملية'])
  );
  
  // Sort by material code
  const sortedByMaterial = [...dataset].sort((a, b) => 
    a['رمز المادة'].localeCompare(b['رمز المادة'])
  );
  
  const endTime = Date.now();
  console.log(`Time taken: ${endTime - startTime} ms`);
  return endTime - startTime;
}

// Test filtering performance
function testFilteringPerformance(dataset) {
  console.log('\n=== Testing filtering performance ===');
  const startTime = Date.now();
  
  // Filter by supplier
  const filteredBySupplier = dataset.filter(item => 
    item['المورد'] === 'Supplier-5'
  );
  
  // Filter by date range
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const filteredByDate = dataset.filter(item => 
    new Date(item['تاريخ العملية']) > cutoffDate
  );
  
  // Filter by quantity
  const filteredByQuantity = dataset.filter(item => 
    item['الكمية'] > 50
  );
  
  const endTime = Date.now();
  console.log(`Time taken: ${endTime - startTime} ms`);
  console.log(`Filtered results: Supplier-5: ${filteredBySupplier.length}, Recent: ${filteredByDate.length}, High Quantity: ${filteredByQuantity.length}`);
  return endTime - startTime;
}

// Run performance tests
async function runPerformanceTests() {
  console.log('Running comprehensive performance tests...\n');
  
  // Test with different dataset sizes
  const sizes = [1000, 5000, 10000];
  
  for (const size of sizes) {
    console.log(`\n--- Testing with ${size} records ---`);
    
    // Generate dataset
    const generationTime = testDatasetGeneration(size);
    
    // Generate the actual dataset for further tests
    const dataset = generateLargeDataset(size);
    
    // Test financial calculations
    const calcTime = testFinancialCalculations(10000);
    
    // Test sorting
    const sortTime = testSortingPerformance(dataset);
    
    // Test filtering
    const filterTime = testFilteringPerformance(dataset);
    
    console.log(`\nSummary for ${size} records:`);
    console.log(`  Dataset Generation: ${generationTime} ms`);
    console.log(`  Financial Calculations: ${calcTime} ms`);
    console.log(`  Sorting: ${sortTime} ms`);
    console.log(`  Filtering: ${filterTime} ms`);
    console.log(`  Total: ${generationTime + calcTime + sortTime + filterTime} ms`);
  }
  
  console.log('\nPerformance tests completed.');
}

// Run the tests
runPerformanceTests().catch(console.error);