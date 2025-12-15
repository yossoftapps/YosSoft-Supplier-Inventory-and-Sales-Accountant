// ═══════════════════════════════════════════════════════════════════════════
// تحليل ABC للمخزون
// Inventory ABC Analysis
// ═══════════════════════════════════════════════════════════════════════════

import { 
    roundToInteger, 
    add, 
    subtract, 
    multiply, 
    divide, 
    compare, 
    Decimal 
} from '../utils/financialCalculations.js';/**
 * Calculates inventory ABC analysis by categorizing items based on annual consumption value
 * @param {Array} salesCostData - Sales cost data from salesCostLogic
 * @returns {Array} ABC analysis data with classifications
 */
export const calculateInventoryABC = (salesCostData) => {
    const startTime = performance.now();
    
    if (!salesCostData || salesCostData.length === 0) {
        return [];
    }
    
    // Create a map to group data by material code
    const abcMap = new Map();
    
    // Process sales cost data to calculate annual consumption value for each item
    salesCostData.forEach(item => {
        const materialCode = item['رمز المادة'];
        const materialName = item['اسم المادة'];
        const unit = item['الوحدة'];
        
        // Parse numeric values
        const quantity = parseFloat(item['الكمية']) || 0;
        const purchaseUnitPrice = parseFloat(item['افرادي الشراء']) || 0;
        
        if (!materialCode) return;
        
        // Calculate annual consumption value = quantity sold * purchase unit price
        const annualConsumptionValue = quantity * purchaseUnitPrice;
        
        if (!abcMap.has(materialCode)) {
            abcMap.set(materialCode, {
                'رمز المادة': materialCode,
                'اسم المادة': materialName,
                'الوحدة': unit,
                'عدد عمليات البيع': 0,
                'إجمالي الكمية المباعة': new Decimal(0),
                'إجمالي قيمة الاستهلاك السنوي': new Decimal(0)
            });
        }
        
        const entry = abcMap.get(materialCode);
        
        // Increment sale count
        entry['عدد عمليات البيع'] += 1;
        
        // Add quantities and values
        entry['إجمالي الكمية المباعة'] = add(entry['إجمالي الكمية المباعة'], new Decimal(quantity));
        entry['إجمالي قيمة الاستهلاك السنوي'] = add(entry['إجمالي قيمة الاستهلاك السنوي'], new Decimal(annualConsumptionValue));
    });
    
    // Convert map to array
    let result = Array.from(abcMap.values()).map(entry => ({
        ...entry,
        'إجمالي الكمية المباعة': entry['إجمالي الكمية المباعة'].toNumber(),
        'إجمالي قيمة الاستهلاك السنوي': entry['إجمالي قيمة الاستهلاك السنوي'].toNumber()
    }));
    
    // Sort by annual consumption value descending
    result.sort((a, b) => 
        compare(new Decimal(b['إجمالي قيمة الاستهلاك السنوي']), new Decimal(a['إجمالي قيمة الاستهلاك السنوي'])));
    
    // Calculate cumulative percentage for ABC classification
    const grandTotalValue = result.reduce((sum, item) => 
        add(sum, new Decimal(item['إجمالي قيمة الاستهلاك السنوي'])), new Decimal(0));
    
    let cumulativeValue = new Decimal(0);
    
    // Assign ABC classifications
    result = result.map(item => {
        cumulativeValue = add(cumulativeValue, new Decimal(item['إجمالي قيمة الاستهلاك السنوي']));
        
        let cumulativePercent = new Decimal(0);
        if (compare(grandTotalValue, new Decimal(0)) > 0) {
            try {
                const ratio = divide(cumulativeValue, grandTotalValue);
                cumulativePercent = multiply(ratio, new Decimal(100));
            } catch (e) {
                cumulativePercent = new Decimal(0);
            }
        }
        
        // ABC Classification logic:
        // Class A: Top 70-80% of value (usually 20% of items)
        // Class B: Next 15-25% of value
        // Class C: Remaining 5-10% of value
        let classification = 'C';
        const cumulativePercentValue = cumulativePercent.toNumber();
        
        if (cumulativePercentValue <= 80) {
            classification = 'A';
        } else if (cumulativePercentValue <= 95) {
            classification = 'B';
        }
        // Else classification remains 'C'
        
        return {
            ...item,
            'القيمة التراكمية %': roundToInteger(cumulativePercent).toNumber(),
            'التصنيف ABC': classification
        };
    });
    
    // Add sequential numbering
    result.forEach((item, index) => {
        item['م'] = index + 1;
    });
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [InventoryABC] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${result.length} صنف`);
    
    return result;
};