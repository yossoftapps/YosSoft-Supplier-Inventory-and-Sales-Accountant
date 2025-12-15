// ═══════════════════════════════════════════════════════════════════════════
// بطاقة تقييم الموردين
// Supplier Scorecards
// ═══════════════════════════════════════════════════════════════════════════

import { 
    roundToInteger, 
    roundToDecimalPlaces,
    add, 
    subtract, 
    multiply, 
    divide, 
    compare, 
    Decimal 
} from '../utils/financialCalculations';

/**
 * Calculates supplier scorecards by evaluating suppliers based on quality and pricing
 * @param {Array} purchasesData - Net purchases data from netPurchasesLogic
 * @param {Array} returnsData - Returns data from netPurchasesLogic
 * @returns {Array} Supplier scorecards with quality and pricing metrics
 */
export const calculateSupplierScorecards = (purchasesData, returnsData) => {
    const startTime = performance.now();
    
    if (!purchasesData || purchasesData.length === 0) {
        return [];
    }
    
    // Create maps to store supplier data
    const supplierMap = new Map();
    
    // Process purchases data
    purchasesData.forEach(purchase => {
        const supplier = purchase['المورد'];
        const materialCode = purchase['رمز المادة'];
        const quantity = parseFloat(purchase['الكمية']) || 0;
        const unitPrice = parseFloat(purchase['الافرادي']) || 0;
        
        if (!supplier) return;
        
        if (!supplierMap.has(supplier)) {
            supplierMap.set(supplier, {
                'المورد': supplier,
                'عدد الأصناف': new Set(),
                'إجمالي الكمية المشتراة': new Decimal(0),
                'إجمالي القيمة المشتراة': new Decimal(0),
                'إجمالي الكمية المرتجعة': new Decimal(0),
                'إجمالي القيمة المرتجعة': new Decimal(0),
                'أسعار الشراء': [], // Store prices for variance calculation
                'مواد': new Set()
            });
        }
        
        const entry = supplierMap.get(supplier);
        entry['عدد الأصناف'].add(materialCode);
        entry['إجمالي الكمية المشتراة'] = add(entry['إجمالي الكمية المشتراة'], new Decimal(quantity));
        entry['إجمالي القيمة المشتراة'] = add(entry['إجمالي القيمة المشتراة'], new Decimal(quantity * unitPrice));
        entry['مواد'].add(materialCode);
        entry['أسعار الشراء'].push(unitPrice);
    });
    
    // Process returns data
    if (returnsData && returnsData.length > 0) {
        returnsData.forEach(returnItem => {
            const supplier = returnItem['المورد'];
            const quantity = parseFloat(returnItem['الكمية']) || 0;
            const unitPrice = parseFloat(returnItem['الافرادي']) || 0;
            
            if (!supplier || !supplierMap.has(supplier)) return;
            
            const entry = supplierMap.get(supplier);
            entry['إجمالي الكمية المرتجعة'] = add(entry['إجمالي الكمية المرتجعة'], new Decimal(quantity));
            entry['إجمالي القيمة المرتجعة'] = add(entry['إجمالي القيمة المرتجعة'], new Decimal(quantity * unitPrice));
        });
    }
    
    // Calculate metrics for each supplier
    const scorecards = Array.from(supplierMap.values()).map(entry => {
        const totalPurchasedQuantity = entry['إجمالي الكمية المشتراة'];
        const totalReturnedQuantity = entry['إجمالي الكمية المرتجعة'];
        const totalPurchasedValue = entry['إجمالي القيمة المشتراة'];
        const totalReturnedValue = entry['إجمالي القيمة المرتجعة'];
        const numberOfItems = entry['عدد الأصناف'].size;
        
        // Calculate return rate percentage
        let returnRatePercent = new Decimal(0);
        if (compare(totalPurchasedQuantity, new Decimal(0)) > 0) {
            try {
                const ratio = divide(totalReturnedQuantity, totalPurchasedQuantity);
                returnRatePercent = multiply(ratio, new Decimal(100));
            } catch (e) {
                returnRatePercent = new Decimal(0);
            }
        }
        
        // Calculate price variance (standard deviation of purchase prices)
        let priceVariance = new Decimal(0);
        if (entry['أسعار الشراء'].length > 1) {
            try {
                // Calculate mean
                const sum = entry['أسعار الشراء'].reduce((acc, price) => acc + price, 0);
                const mean = sum / entry['أسعار الشراء'].length;
                
                // Calculate variance
                const squaredDiffs = entry['أسعار الشراء'].map(price => {
                    const diff = price - mean;
                    return diff * diff;
                });
                const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / squaredDiffs.length;
                priceVariance = new Decimal(Math.sqrt(avgSquaredDiff));
            } catch (e) {
                priceVariance = new Decimal(0);
            }
        }
        
        // Calculate quality score (inverse of return rate - lower return rate means higher quality)
        const qualityScore = subtract(new Decimal(100), returnRatePercent);
        
        // Calculate pricing score (inverse of price variance - lower variance means more consistent pricing)
        // We'll use a scale where lower variance gets higher score
        let pricingScore = new Decimal(100);
        if (compare(priceVariance, new Decimal(0)) > 0) {
            // Simple scoring: higher variance means lower score
            // Cap the score at 100 and floor at 0
            const varianceImpact = multiply(priceVariance, new Decimal(5)); // Adjust this multiplier as needed
            pricingScore = subtract(new Decimal(100), varianceImpact);
            if (compare(pricingScore, new Decimal(0)) < 0) {
                pricingScore = new Decimal(0);
            }
        }
        
        // Calculate overall score (weighted average)
        const overallScore = divide(add(qualityScore, pricingScore), new Decimal(2));
        
        return {
            'المورد': entry['المورد'],
            'عدد الأصناف': numberOfItems,
            'إجمالي الكمية المشتراة': totalPurchasedQuantity.toNumber(),
            'إجمالي القيمة المشتراة': totalPurchasedValue.toNumber(),
            'إجمالي الكمية المرتجعة': totalReturnedQuantity.toNumber(),
            'إجمالي القيمة المرتجعة': totalReturnedValue.toNumber(),
            'نسبة المرتجعات %': roundToDecimalPlaces(returnRatePercent, 2).toNumber(),
            'تباين الأسعار': roundToDecimalPlaces(priceVariance, 2).toNumber(),
            'درجة الجودة': roundToInteger(qualityScore).toNumber(),
            'درجة التسعير': roundToInteger(pricingScore).toNumber(),
            'الدرجة الإجمالية': roundToInteger(overallScore).toNumber()
        };
    });
    
    // Sort by overall score descending to show best suppliers first
    scorecards.sort((a, b) => 
        compare(new Decimal(b['الدرجة الإجمالية']), new Decimal(a['الدرجة الإجمالية'])));
    
    // Add sequential numbering
    scorecards.forEach((item, index) => {
        item['م'] = index + 1;
    });
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [SupplierScorecards] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${scorecards.length} مورد`);
    
    return scorecards;
};