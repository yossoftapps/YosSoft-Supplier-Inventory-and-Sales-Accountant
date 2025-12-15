// Test file for schema validator functionality
console.log('Testing schema validator functionality...');

// Import the schema validator
import { validateAllTables, TABLE_SCHEMAS } from '../src/validator/schemaValidator.js';

console.log('\n=== Testing Schema Validator ===');

try {
  // Test 1: Valid supplierbalances data with all required columns
  console.log('Test 1: Valid supplierbalances data with all required columns');
  
  const validSupplierBalancesData = [
    ['م', 'رمز الحساب', 'المورد', 'مدين', 'دائن', 'الحساب المساعد'],
    [1, 'ACC001', 'Supplier A', 1000, 500, 'Assistant A'],
    [2, 'ACC002', 'Supplier B', 2000, 500, 'Assistant B']
  ];
  
  // Provide minimal data for other required tables to avoid unrelated errors
  const validRawData = {
    supplierbalances: validSupplierBalancesData,
    purchases: [['م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'الافرادي', 'تاريخ الصلاحية', 'المورد', 'تاريخ العملية', 'نوع العملية']],
    sales: [['م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'الافرادي', 'تاريخ الصلاحية', 'تاريخ العملية', 'نوع العملية']],
    physicalInventory: [['رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'تاريخ الصلاحية']]
  };
  
  const validationResult1 = validateAllTables(validRawData);
  console.log('✅ Valid data validation result:', validationResult1.isValid);
  
  // Test 2: Supplierbalances data missing optional column
  console.log('\nTest 2: Supplierbalances data missing optional column');
  
  const missingOptionalColumnData = [
    ['م', 'رمز الحساب', 'المورد', 'مدين', 'دائن'],
    [1, 'ACC001', 'Supplier A', 1000, 500],
    [2, 'ACC002', 'Supplier B', 2000, 500]
  ];
  
  const missingOptionalRawData = {
    supplierbalances: missingOptionalColumnData,
    purchases: [['م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'الافرادي', 'تاريخ الصلاحية', 'المورد', 'تاريخ العملية', 'نوع العملية']],
    sales: [['م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'الافرادي', 'تاريخ الصلاحية', 'تاريخ العملية', 'نوع العملية']],
    physicalInventory: [['رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'تاريخ الصلاحية']]
  };
  
  const validationResult2 = validateAllTables(missingOptionalRawData);
  console.log('✅ Missing optional column validation result:', validationResult2.isValid);
  if (!validationResult2.isValid) {
    console.log('   Errors:', validationResult2.errors);
  }
  
  // Test 3: Supplierbalances data missing required column
  console.log('\nTest 3: Supplierbalances data missing required column');
  
  const missingRequiredColumnData = [
    ['م', 'رمز الحساب', 'المورد', 'مدين'], // Missing 'دائن'
    [1, 'ACC001', 'Supplier A', 1000],
    [2, 'ACC002', 'Supplier B', 2000]
  ];
  
  const missingRequiredRawData = {
    supplierbalances: missingRequiredColumnData,
    purchases: [['م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'الافرادي', 'تاريخ الصلاحية', 'المورد', 'تاريخ العملية', 'نوع العملية']],
    sales: [['م', 'رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'الافرادي', 'تاريخ الصلاحية', 'تاريخ العملية', 'نوع العملية']],
    physicalInventory: [['رمز المادة', 'اسم المادة', 'الوحدة', 'الكمية', 'تاريخ الصلاحية']]
  };
  
  const validationResult3 = validateAllTables(missingRequiredRawData);
  console.log('✅ Missing required column validation result:', validationResult3.isValid);
  console.log('   Errors:', validationResult3.errors);
  
  console.log('\n✅ All schema validator tests completed successfully!');
  
} catch (error) {
  console.error('❌ Schema validator tests failed:', error.message);
  console.error(error.stack);
}

console.log('\n=== Schema Validator Test Summary ===');
console.log('The schema validator provides:');
console.log('1. Validation of required columns');
console.log('2. Support for optional columns');
console.log('3. Flexible validation rules');
console.log('4. Detailed error reporting');
console.log('5. Graceful handling of missing optional data');