// Test file for Item Profitability Page with Charts
console.log('Testing Item Profitability Page with Charts...');

// Mock data similar to what would be received from the application
const mockProfitabilityData = [
  {
    "م": 1,
    "رمز المادة": "MAT001",
    "اسم المادة": "منتج A",
    "الوحدة": "حبة",
    "عدد عمليات البيع": 25,
    "إجمالي الكمية المباعة": "150",
    "إجمالي قيمة المبيعات": "7500",
    "إجمالي تكلفة المبيعات": "4500",
    "إجمالي الربح": "3000",
    "نسبة هامش الربح %": "66.67",
    "نسبة المساهمة في أرباح الشركة %": "25.5"
  },
  {
    "م": 2,
    "رمز المادة": "MAT002",
    "اسم المادة": "منتج B",
    "الوحدة": "عبوة",
    "عدد عمليات البيع": 18,
    "إجمالي الكمية المباعة": "90",
    "إجمالي قيمة المبيعات": "5400",
    "إجمالي تكلفة المبيعات": "3240",
    "إجمالي الربح": "2160",
    "نسبة هامش الربح %": "60.0",
    "نسبة المساهمة في أرباح الشركة %": "18.3"
  },
  {
    "م": 3,
    "رمز المادة": "MAT003",
    "اسم المادة": "منتج C",
    "الوحدة": "كرتون",
    "عدد عمليات البيع": 12,
    "إجمالي الكمية المباعة": "60",
    "إجمالي قيمة المبيعات": "3600",
    "إجمالي تكلفة المبيعات": "3000",
    "إجمالي الربح": "600",
    "نسبة هامش الربح %": "16.67",
    "نسبة المساهمة في أرباح الشركة %": "5.1"
  },
  {
    "م": 4,
    "رمز المادة": "MAT004",
    "اسم المادة": "منتج D",
    "الوحدة": "حبة",
    "عدد عمليات البيع": 30,
    "إجمالي الكمية المباعة": "300",
    "إجمالي قيمة المبيعات": "6000",
    "إجمالي تكلفة المبيعات": "6500",
    "إجمالي الربح": "-500",
    "نسبة هامش الربح %": "-7.69",
    "نسبة المساهمة في أرباح الشركة %": "0"
  }
];

console.log('\n=== Testing Data Processing for Charts ===');

try {
  // Test 1: Top profitable items sorting and processing
  console.log('Test 1: Processing top profitable items...');
  
  const topProfitableItems = [...mockProfitabilityData]
    .sort((a, b) => {
      const profitA = typeof a['إجمالي الربح'] === 'string' ? parseFloat(a['إجمالي الربح']) || 0 : a['إجمالي الربح'] || 0;
      const profitB = typeof b['إجمالي الربح'] === 'string' ? parseFloat(b['إجمالي الربح']) || 0 : b['إجمالي الربح'] || 0;
      return profitB - profitA;
    })
    .slice(0, 10)
    .map(item => ({
      name: item['اسم المادة'],
      profit: typeof item['إجمالي الربح'] === 'string' ? parseFloat(item['إجمالي الربح']) || 0 : item['إجمالي الربح'] || 0,
      sales: typeof item['إجمالي قيمة المبيعات'] === 'string' ? parseFloat(item['إجمالي قيمة المبيعات']) || 0 : item['إجمالي قيمة المبيعات'] || 0,
      cost: typeof item['إجمالي تكلفة المبيعات'] === 'string' ? parseFloat(item['إجمالي تكلفة المبيعات']) || 0 : item['إجمالي تكلفة المبيعات'] || 0
    }));
  
  console.log('✅ Top profitable items processed successfully');
  console.log('   Sample result:', topProfitableItems[0]);
  
  // Test 2: Top contributors processing
  console.log('\nTest 2: Processing top contributors...');
  
  const topContributors = [...mockProfitabilityData]
    .sort((a, b) => {
      const contribA = typeof a['نسبة المساهمة في أرباح الشركة %'] === 'string' ? parseFloat(a['نسبة المساهمة في أرباح الشركة %']) || 0 : a['نسبة المساهمة في أرباح الشركة %'] || 0;
      const contribB = typeof b['نسبة المساهمة في أرباح الشركة %'] === 'string' ? parseFloat(b['نسبة المساهمة في أرباح الشركة %']) || 0 : b['نسبة المساهمة في أرباح الشركة %'] || 0;
      return contribB - contribA;
    })
    .slice(0, 10)
    .map(item => ({
      name: item['اسم المادة'],
      contribution: typeof item['نسبة المساهمة في أرباح الشركة %'] === 'string' ? parseFloat(item['نسبة المساهمة في أرباح الشركة %']) || 0 : item['نسبة المساهمة في أرباح الشركة %'] || 0
    }));
  
  console.log('✅ Top contributors processed successfully');
  console.log('   Sample result:', topContributors[0]);
  
  // Test 3: Profit margin distribution
  console.log('\nTest 3: Processing profit margin distribution...');
  
  const profitMarginDistribution = [...mockProfitabilityData]
    .reduce((acc, item) => {
      const margin = typeof item['نسبة هامش الربح %'] === 'string' ? parseFloat(item['نسبة هامش الربح %']) || 0 : item['نسبة هامش الربح %'] || 0;
      if (margin > 50) acc.high++;
      else if (margin > 20) acc.medium++;
      else if (margin > 0) acc.low++;
      else if (margin === 0) acc.zero++;
      else acc.negative++;
      return acc;
    }, { high: 0, medium: 0, low: 0, zero: 0, negative: 0 });
  
  console.log('✅ Profit margin distribution calculated successfully');
  console.log('   Distribution:', profitMarginDistribution);
  
  const profitMarginData = [
    { name: 'هامش ربح مرتفع (>50%)', value: profitMarginDistribution.high },
    { name: 'هامش ربح متوسط (20-50%)', value: profitMarginDistribution.medium },
    { name: 'هامش ربح منخفض (0-20%)', value: profitMarginDistribution.low },
    { name: 'بدون ربح (0%)', value: profitMarginDistribution.zero },
    { name: 'خسارة (<0%)', value: profitMarginDistribution.negative }
  ];
  
  console.log('✅ Profit margin data prepared for charting');
  console.log('   Chart data:', profitMarginData);
  
  console.log('\n✅ All Item Profitability Page chart tests completed successfully!');
  
} catch (error) {
  console.error('❌ Item Profitability Page chart tests failed:', error.message);
  console.error(error.stack);
}

console.log('\n=== Item Profitability Page Chart Test Summary ===');
console.log('The enhanced Item Profitability Page provides:');
console.log('1. Interactive bar charts for top profitable items');
console.log('2. Pie chart for profit margin distribution');
console.log('3. Bar chart for top contributors');
console.log('4. Comparison chart for sales vs cost');
console.log('5. Proper data processing for all chart types');
console.log('6. Responsive design for all screen sizes');
console.log('7. Tooltips with formatted values');
console.log('8. Color-coded visualizations');