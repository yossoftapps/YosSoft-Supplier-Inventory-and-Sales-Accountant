// ═══════════════════════════════════════════════════════════════════════════
// تحليل ربحية الأصناف
// Item Profitability Analysis
// ═══════════════════════════════════════════════════════════════════════════

import { 
    roundToInteger, 
    add, 
    subtract, 
    multiply, 
    divide, 
    compare, 
    Decimal 
} from '../utils/financialCalculations.js';
/**
 * Calculates item profitability analysis by aggregating sales cost data by material code
 * @param {Array} salesCostData - Sales cost data from salesCostLogic
 * @param {Array} netSalesData - Net sales data from netSalesLogic
 * @returns {Array} Profitability analysis data grouped by material code
 */
export const calculateItemProfitability = (salesCostData, netSalesData) => {
    const startTime = performance.now();
    
    if (!salesCostData || salesCostData.length === 0) {
        return [];
    }
    
    // Create a map to group data by material code
    const profitabilityMap = new Map();
    
    // Process sales cost data to calculate profitability metrics
    salesCostData.forEach(item => {
        const materialCode = item['رمز المادة'];
        const materialName = item['اسم المادة'];
        const unit = item['الوحدة'];
        
        // Parse numeric values
        const quantity = parseFloat(item['الكمية']) || 0;
        const saleUnitPrice = parseFloat(item['الافرادي']) || 0;
        const purchaseUnitPrice = parseFloat(item['افرادي الشراء']) || 0;
        const totalProfit = parseFloat(item['اجمالي الربح']) || 0;
        
        if (!materialCode) return;
        
        if (!profitabilityMap.has(materialCode)) {
            profitabilityMap.set(materialCode, {
                'رمز المادة': materialCode,
                'اسم المادة': materialName,
                'الوحدة': unit,
                'عدد عمليات البيع': 0,
                'إجمالي الكمية المباعة': new Decimal(0),
                'إجمالي قيمة المبيعات': new Decimal(0),
                'إجمالي تكلفة المبيعات': new Decimal(0),
                'إجمالي الربح': new Decimal(0),
                'إجمالي هامش الربح': new Decimal(0)
            });
        }
        
        const entry = profitabilityMap.get(materialCode);
        
        // Increment sale count
        entry['عدد عمليات البيع'] += 1;
        
        // Add quantities and values
        entry['إجمالي الكمية المباعة'] = add(entry['إجمالي الكمية المباعة'], new Decimal(quantity));
        entry['إجمالي قيمة المبيعات'] = add(entry['إجمالي قيمة المبيعات'], new Decimal(quantity * saleUnitPrice));
        entry['إجمالي تكلفة المبيعات'] = add(entry['إجمالي تكلفة المبيعات'], new Decimal(quantity * purchaseUnitPrice));
        entry['إجمالي الربح'] = add(entry['إجمالي الربح'], new Decimal(totalProfit));
    });
    
    // Calculate profitability metrics for each item
    const result = Array.from(profitabilityMap.values()).map(entry => {
        const totalSalesValue = entry['إجمالي قيمة المبيعات'];
        const totalCost = entry['إجمالي تكلفة المبيعات'];
        const totalProfit = entry['إجمالي الربح'];
        
        // Calculate profit margin percentage
        let profitMarginPercent = new Decimal(0);
        if (compare(totalCost, new Decimal(0)) > 0) {
            try {
                // Profit Margin % = (Total Profit / Total Cost) * 100
                const ratio = divide(totalProfit, totalCost);
                profitMarginPercent = multiply(ratio, new Decimal(100));
            } catch (e) {
                profitMarginPercent = new Decimal(0);
            }
        }
        
        // Calculate contribution percentage to total company profit
        // This would need to be calculated against the grand total of all profits
        // For now we'll set it to 0 and calculate it later
        
        return {
            ...entry,
            'إجمالي قيمة المبيعات': totalSalesValue.toNumber(),
            'إجمالي تكلفة المبيعات': totalCost.toNumber(),
            'إجمالي الربح': totalProfit.toNumber(),
            'نسبة هامش الربح %': roundToInteger(profitMarginPercent).toNumber(),
            'نسبة المساهمة في أرباح الشركة %': 0 // Will be calculated later
        };
    });
    
    // Calculate contribution percentage to total company profit
    const grandTotalProfit = result.reduce((sum, item) => 
        add(sum, new Decimal(item['إجمالي الربح'])), new Decimal(0));
    
    const resultWithContribution = result.map(item => {
        let contributionPercent = new Decimal(0);
        if (compare(grandTotalProfit, new Decimal(0)) > 0) {
            try {
                // Contribution % = (Item Profit / Grand Total Profit) * 100
                const ratio = divide(new Decimal(item['إجمالي الربح']), grandTotalProfit);
                contributionPercent = multiply(ratio, new Decimal(100));
            } catch (e) {
                contributionPercent = new Decimal(0);
            }
        }
        
        return {
            ...item,
            'نسبة المساهمة في أرباح الشركة %': roundToInteger(contributionPercent).toNumber()
        };
    });
    
    // Sort by total profit descending to show most profitable items first
    resultWithContribution.sort((a, b) => 
        compare(new Decimal(b['إجمالي الربح']), new Decimal(a['إجمالي الربح'])));
    
    // Add sequential numbering
    resultWithContribution.forEach((item, index) => {
        item['م'] = index + 1;
    });
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [ItemProfitability] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${resultWithContribution.length} صنف`);
    
    return resultWithContribution;
};