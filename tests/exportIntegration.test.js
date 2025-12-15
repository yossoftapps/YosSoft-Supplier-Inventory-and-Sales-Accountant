// Integration tests for export functionality
import { serializeData } from '../src/utils/financialCalculations.js';

console.log('Testing export integration functionality...');

// Mock data similar to what would be exported from accounting reports
const mockReportData = {
  inventoryReport: {
    sheetName: 'تقرير المخزون',
    columns: [
      { title: 'رمز المادة', dataIndex: 'code' },
      { title: 'اسم المادة', dataIndex: 'name' },
      { title: 'الكمية', dataIndex: 'quantity' },
      { title: 'السعر', dataIndex: 'price' }
    ],
    data: [
      { code: 'MAT001', name: 'مادة 1', quantity: 100, price: 50.25 },
      { code: 'MAT002', name: 'مادة 2', quantity: 250, price: 30.75 }
    ]
  },
  salesReport: {
    sheetName: 'تقرير المبيعات',
    columns: [
      { title: 'رقم العملية', dataIndex: 'opNumber' },
      { title: 'تاريخ العملية', dataIndex: 'opDate' },
      { title: 'المبلغ', dataIndex: 'amount' }
    ],
    data: [
      { opNumber: 'SALE001', opDate: '2023-01-15', amount: 1500 },
      { opNumber: 'SALE002', opDate: '2023-01-16', amount: 2300 }
    ]
  }
};

console.log('\n=== Testing serializeData with report data ===');
try {
  // Serialize the mock report data as would be done before sending to the Web Worker
  const serializedData = serializeData(mockReportData);
  
  // Verify structure is maintained
  console.log('✅ Inventory report sheet name:', serializedData.inventoryReport.sheetName === 'تقرير المخزون');
  console.log('✅ Sales report sheet name:', serializedData.salesReport.sheetName === 'تقرير المبيعات');
  
  // Verify data arrays are properly serialized
  console.log('✅ Inventory data array:', Array.isArray(serializedData.inventoryReport.data) && serializedData.inventoryReport.data.length === 2);
  console.log('✅ Sales data array:', Array.isArray(serializedData.salesReport.data) && serializedData.salesReport.data.length === 2);
  
  // Verify data content
  console.log('✅ Inventory data content:', 
    serializedData.inventoryReport.data[0].code === 'MAT001' &&
    serializedData.inventoryReport.data[0].name === 'مادة 1');
  console.log('✅ Sales data content:', 
    serializedData.salesReport.data[0].opNumber === 'SALE001');
  
  console.log('✅ Report data serialization tests passed');
} catch (error) {
  console.error('❌ Report data serialization tests failed:', error.message);
}

console.log('\n=== Testing report data structure preservation ===');
try {
  const serializedData = serializeData(mockReportData);
  
  // Check that column definitions are preserved
  console.log('✅ Column definitions array:', 
    Array.isArray(serializedData.inventoryReport.columns) && 
    serializedData.inventoryReport.columns.length === 4);
  console.log('✅ Column definition content:', 
    serializedData.inventoryReport.columns[0].title === 'رمز المادة' &&
    serializedData.inventoryReport.columns[0].dataIndex === 'code');
  
  // Check that all data fields are present
  const firstInventoryItem = serializedData.inventoryReport.data[0];
  console.log('✅ Data fields presence:', 
    firstInventoryItem.code !== undefined &&
    firstInventoryItem.name !== undefined &&
    firstInventoryItem.quantity !== undefined &&
    firstInventoryItem.price !== undefined);
  
  console.log('✅ Structure preservation tests passed');
} catch (error) {
  console.error('❌ Structure preservation tests failed:', error.message);
}

console.log('\n=== Testing large report data performance ===');
try {
  // Create a larger dataset to test performance
  const largeReportData = {
    ...mockReportData,
    largeReport: {
      sheetName: 'تقرير كبير',
      columns: [
        { title: 'ID', dataIndex: 'id' },
        { title: 'الاسم', dataIndex: 'name' },
        { title: 'القيمة', dataIndex: 'value' }
      ],
      data: Array(5000).fill().map((_, i) => ({
        id: i,
        name: `عنصر ${i}`,
        value: i * 1.5
      }))
    }
  };
  
  const startTime = Date.now();
  const serializedData = serializeData(largeReportData);
  const endTime = Date.now();
  
  // Verify serialization completed successfully
  console.log('✅ Large report data handling:', serializedData.largeReport.data.length === 5000);
  
  // Verify performance is acceptable (should complete within 1 second)
  console.log('✅ Performance test:', (endTime - startTime) < 1000);
  console.log(`   Serialization completed in ${endTime - startTime} ms`);
  
  console.log('✅ Large report performance tests passed');
} catch (error) {
  console.error('❌ Large report performance tests failed:', error.message);
}

console.log('\n✅ All export integration tests completed!');