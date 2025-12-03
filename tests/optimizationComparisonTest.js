// Performance comparison test between original and optimized implementations
import { Decimal, compare, roundToDecimalPlaces, subtract } from '../src/utils/financialCalculations.js';
import { IndexedMatcher, optimizedMatch } from '../src/utils/optimizedMatcher.js';

console.log('Starting optimization comparison tests...');

// Generate test data
function generateTestData(size) {
  const purchases = [];
  const returns = [];
  
  // Generate purchase records
  for (let i = 0; i < size; i++) {
    purchases.push({
      'م': i + 1,
      'رمز المادة': `MAT-${Math.floor(i / 100) + 1}`,
      'اسم المادة': `Material ${Math.floor(i / 100) + 1}`,
      'الوحدة': 'KG',
      'الكمية': roundToDecimalPlaces(100 + (i % 50), 2),
      'تاريخ الصلاحية': new Date(Date.now() + (i % 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'المورد': `Supplier-${Math.floor(i / 500) + 1}`,
      'الافرادي': Math.floor(100 + Math.random() * 900),
      'تاريخ العملية': new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'نوع العملية': 'مشتريات',
      'ملاحظات': ''
    });
  }
  
  // Generate return records
  for (let i = 0; i < Math.floor(size / 10); i++) {
    returns.push({
      'م': i + 1,
      'رمز المادة': `MAT-${Math.floor(i / 10) + 1}`,
      'اسم المادة': `Material ${Math.floor(i / 10) + 1}`,
      'الوحدة': 'KG',
      'الكمية': roundToDecimalPlaces(10 + (i % 20), 2),
      'تاريخ الصلاحية': new Date(Date.now() + (i % 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'المورد': `Supplier-${Math.floor(i / 50) + 1}`,
      'الافرادي': Math.floor(100 + Math.random() * 900),
      'تاريخ العملية': new Date(Date.now() - (i % 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'نوع العملية': 'مرتجعات',
      'ملاحظات': ''
    });
  }
  
  return { purchases, returns };
}

// Mock matching audit
class MockMatchingAudit {
  recordMatch(source, keyNumber, returnId, purchaseId, quantity, returnRecord, purchaseRecord) {
    // Simple mock implementation
  }
}

// Original matching implementation (simplified version)
function originalMatch(returnRecord, netPurchasesList, matchingKeys, matchingAudit) {
  const returnQuantity = roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2);
  let remainingReturnQty = returnQuantity;
  let matched = false;
  let usedKeyNumber = 0;

  // Try each matching key in order
  for (let keyIndex = 0; keyIndex < matchingKeys.length; keyIndex++) {
    if (compare(remainingReturnQty, 0) <= 0) break;

    const keyFunction = matchingKeys[keyIndex];

    // Linear search through all purchases
    let matchingPurchases = netPurchasesList.filter(
      p => compare(p['الكمية'], 0) > 0 && keyFunction(p)
    );

    // Sort matching purchases: newest first
    matchingPurchases.sort((a, b) => {
      const dateDiff = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
      if (dateDiff !== 0) return dateDiff;
      return a['م'] - b['م'];
    });

    // Process matching purchases
    for (const purchaseRecord of matchingPurchases) {
      if (compare(remainingReturnQty, 0) <= 0) break;

      const purchaseIndex = netPurchasesList.findIndex(p => p['م'] === purchaseRecord['م']);
      if (purchaseIndex === -1) continue;

      const purchaseQty = netPurchasesList[purchaseIndex]['الكمية'];

      if (compare(purchaseQty, remainingReturnQty) >= 0) {
        // Full match
        netPurchasesList[purchaseIndex]['الكمية'] = subtract(purchaseQty, remainingReturnQty);
        netPurchasesList[purchaseIndex]['ملاحظات'] = `مطابق (مفتاح ${keyIndex + 1})`;
        
        matchingAudit.recordMatch(
          'NetPurchases',
          keyIndex + 1,
          returnRecord['م'],
          purchaseRecord['م'],
          remainingReturnQty,
          returnRecord,
          purchaseRecord
        );
        
        remainingReturnQty = new Decimal(0);
        matched = true;
        usedKeyNumber = keyIndex + 1;
        break;
      } else {
        // Partial match
        netPurchasesList[purchaseIndex]['الكمية'] = new Decimal(0);
        netPurchasesList[purchaseIndex]['ملاحظات'] = `مطابق جزئي (مفتاح ${keyIndex + 1})`;
        
        matchingAudit.recordMatch(
          'NetPurchases',
          keyIndex + 1,
          returnRecord['م'],
          purchaseRecord['م'],
          purchaseQty,
          returnRecord,
          purchaseRecord
        );
        
        remainingReturnQty = subtract(remainingReturnQty, purchaseQty);
        matched = true;
        usedKeyNumber = keyIndex + 1;
      }
    }
  }

  return {
    remainingReturnQty,
    matched,
    usedKeyNumber
  };
}

// Define matching keys
const getMatchingKeys = (returnRecord) => [
  // Key 1: (material code, expiry date, quantity) + return date >= purchase date
  (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
    p['رمز المادة'] === returnRecord['رمز المادة'] &&
    p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
    p['الكمية'] == returnRecord['الكمية'],

  // Key 2: (material code, expiry date) + return date >= purchase date
  (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
    p['رمز المادة'] === returnRecord['رمز المادة'] &&
    p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'],

  // Key 3: (material code) + return date >= purchase date
  (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
    p['رمز المادة'] === returnRecord['رمز المادة']
];

// Performance test function
function runPerformanceTest(testName, testFunction, iterations) {
  console.log(`\n=== ${testName} (${iterations} iterations) ===`);
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    testFunction();
  }
  
  const endTime = Date.now();
  console.log(`Time taken: ${endTime - startTime} ms`);
  console.log(`Average time per iteration: ${(endTime - startTime) / iterations} ms`);
  return endTime - startTime;
}

// Run comparison tests
async function runComparisonTests() {
  console.log('Running optimization comparison tests...\n');
  
  // Test with different dataset sizes
  const sizes = [1000, 5000];
  
  for (const size of sizes) {
    console.log(`\n--- Testing with ${size} purchase records ---`);
    
    // Generate test data
    const { purchases, returns } = generateTestData(size);
    const matchingAudit = new MockMatchingAudit();
    
    // Test original implementation
    const originalTime = runPerformanceTest(
      'Original Implementation',
      () => {
        const purchasesCopy = JSON.parse(JSON.stringify(purchases));
        returns.forEach(returnRecord => {
          originalMatch(returnRecord, purchasesCopy, getMatchingKeys(returnRecord), matchingAudit);
        });
      },
      10
    );
    
    // Test optimized implementation
    const optimizedTime = runPerformanceTest(
      'Optimized Implementation',
      () => {
        const purchasesCopy = JSON.parse(JSON.stringify(purchases));
        const matcher = new IndexedMatcher(purchasesCopy);
        returns.forEach(returnRecord => {
          optimizedMatch(matcher, returnRecord, purchasesCopy, getMatchingKeys(returnRecord), matchingAudit);
        });
      },
      10
    );
    
    // Calculate improvement
    const improvement = ((originalTime - optimizedTime) / originalTime * 100).toFixed(2);
    console.log(`\nPerformance Improvement: ${improvement}%`);
    
    if (optimizedTime < originalTime) {
      console.log('✅ Optimized implementation is faster');
    } else {
      console.log('⚠️  Optimized implementation needs further tuning');
    }
  }
  
  console.log('\nOptimization comparison tests completed.');
}

// Run the tests
runComparisonTests().catch(console.error);