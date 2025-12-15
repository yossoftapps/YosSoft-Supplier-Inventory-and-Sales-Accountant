// ═══════════════════════════════════════════════════════════════════════════
// مخاطر الركود
// Stagnation Risk
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
 * Calculates stagnation risk by analyzing inventory movement patterns to identify items at risk of becoming stagnant
 * @param {Array} salesData - Net sales data from netSalesLogic
 * @param {Array} inventoryData - Ending inventory data from endingInventoryLogic
 * @returns {Array} Stagnation risk analysis data with risk scores
 */
export const calculateStagnationRisk = (salesData, inventoryData) => {
    const startTime = performance.now();
    
    if (!salesData || salesData.length === 0 || !inventoryData || inventoryData.length === 0) {
        return [];
    }
    
    // Create a map to store sales frequency by material code
    const salesFrequencyMap = new Map();
    
    // Calculate sales frequency for each material
    salesData.forEach(sale => {
        const materialCode = sale['رمز المادة'];
        if (!materialCode) return;
        
        if (!salesFrequencyMap.has(materialCode)) {
            salesFrequencyMap.set(materialCode, {
                count: 0,
                totalQuantity: new Decimal(0),
                dates: new Set()
            });
        }
        
        const entry = salesFrequencyMap.get(materialCode);
        entry.count += 1;
        entry.totalQuantity = add(entry.totalQuantity, new Decimal(parseFloat(sale['الكمية']) || 0));
        entry.dates.add(sale['تاريخ العملية']);
    });
    
    // Calculate average days between sales for each material
    const salesIntervalMap = new Map();
    
    salesFrequencyMap.forEach((entry, materialCode) => {
        const dates = Array.from(entry.dates).map(dateStr => new Date(dateStr));
        dates.sort((a, b) => a - b);
        
        if (dates.length > 1) {
            const intervals = [];
            for (let i = 1; i < dates.length; i++) {
                const interval = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 3600 * 24);
                intervals.push(interval);
            }
            
            const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
            salesIntervalMap.set(materialCode, averageInterval);
        } else {
            // If only one sale date, we can't calculate interval, so we'll use a default high value
            salesIntervalMap.set(materialCode, 365); // Assume yearly sales
        }
    });
    
    // Process inventory data to calculate stagnation risk for each item
    const stagnationRisk = [];
    
    inventoryData.forEach(item => {
        const materialCode = item['رمز المادة'];
        const currentQuantity = parseFloat(item['الكمية']) || 0;
        
        if (!materialCode || currentQuantity <= 0) return;
        
        // Get sales data for this material
        const salesData = salesFrequencyMap.get(materialCode);
        const avgSalesInterval = salesIntervalMap.get(materialCode) || 365;
        
        if (!salesData) {
            // No sales data - high stagnation risk
            stagnationRisk.push({
                'رمز المادة': materialCode,
                'اسم المادة': item['اسم المادة'],
                'الوحدة': item['الوحدة'],
                'الكمية الحالية': new Decimal(currentQuantity),
                'عدد مرات البيع': 0,
                'متوسط الكمية المباعة': new Decimal(0),
                'متوسط الفترة بين المبيعات (أيام)': new Decimal(avgSalesInterval),
                'معدل دوران المخزون': new Decimal(0),
                'فترة التخزين المتوقعة (أيام)': new Decimal(Infinity),
                'مؤشر الخطورة': new Decimal(100), // High risk
                'تصنيف الخطورة': 'عالي'
            });
            return;
        }
        
        // Calculate average quantity sold per transaction
        const avgQuantityPerSale = salesData.count > 0 ? 
            divide(salesData.totalQuantity, new Decimal(salesData.count)) : new Decimal(0);
        
        // Calculate inventory turnover rate (times per year)
        // Assuming we're calculating based on the last year of data
        const annualSalesQuantity = multiply(salesData.totalQuantity, new Decimal(12 / salesData.dates.size || 1));
        const inventoryTurnoverRate = currentQuantity > 0 ? 
            divide(annualSalesQuantity, new Decimal(currentQuantity)) : new Decimal(0);
        
        // Calculate expected storage period (days)
        const expectedStoragePeriod = inventoryTurnoverRate > 0 ? 
            divide(new Decimal(365), inventoryTurnoverRate) : new Decimal(Infinity);
        
        // Calculate risk indicator (0-100, higher means higher risk)
        // Factors: long sales intervals, low turnover, high storage period
        let riskIndicator = new Decimal(0);
        
        // Factor 1: Sales interval (longer intervals = higher risk)
        const intervalFactor = Math.min(avgSalesInterval / 365 * 50, 50); // Max 50 points
        
        // Factor 2: Low turnover (lower turnover = higher risk)
        const turnoverFactor = inventoryTurnoverRate > 0 ? 
            Math.min((1 / inventoryTurnoverRate.toNumber()) * 30, 30) : 30; // Max 30 points
        
        // Factor 3: Long storage period (longer periods = higher risk)
        const storageFactor = expectedStoragePeriod < Infinity ? 
            Math.min(expectedStoragePeriod.toNumber() / 365 * 20, 20) : 20; // Max 20 points
        
        riskIndicator = new Decimal(intervalFactor + turnoverFactor + storageFactor);
        
        // Risk classification
        let riskClassification = 'منخفض';
        const riskValue = riskIndicator.toNumber();
        if (riskValue > 70) {
            riskClassification = 'عالي';
        } else if (riskValue > 40) {
            riskClassification = 'متوسط';
        }
        
        stagnationRisk.push({
            'رمز المادة': materialCode,
            'اسم المادة': item['اسم المادة'],
            'الوحدة': item['الوحدة'],
            'الكمية الحالية': new Decimal(currentQuantity),
            'عدد مرات البيع': salesData.count,
            'متوسط الكمية المباعة': avgQuantityPerSale,
            'متوسط الفترة بين المبيعات (أيام)': new Decimal(avgSalesInterval),
            'معدل دوران المخزون': inventoryTurnoverRate,
            'فترة التخزين المتوقعة (أيام)': expectedStoragePeriod,
            'مؤشر الخطورة': riskIndicator,
            'تصنيف الخطورة': riskClassification
        });
    });
    
    // Sort by risk indicator descending to show highest risk items first
    stagnationRisk.sort((a, b) => 
        compare(b['مؤشر الخطورة'], a['مؤشر الخطورة']));
    
    // Convert Decimal values to numbers and add sequential numbering
    stagnationRisk.forEach((item, index) => {
        item['م'] = index + 1;
        item['الكمية الحالية'] = item['الكمية الحالية'].toNumber();
        item['متوسط الكمية المباعة'] = roundToDecimalPlaces(item['متوسط الكمية المباعة'], 2).toNumber();
        item['متوسط الفترة بين المبيعات (أيام)'] = roundToInteger(item['متوسط الفترة بين المبيعات (أيام)']).toNumber();
        item['معدل دوران المخزون'] = roundToDecimalPlaces(item['معدل دوران المخزون'], 2).toNumber();
        item['فترة التخزين المتوقعة (أيام)'] = item['فترة التخزين المتوقعة (أيام)'] < Infinity ? 
            roundToInteger(item['فترة التخزين المتوقعة (أيام)']).toNumber() : Infinity;
        item['مؤشر الخطورة'] = roundToInteger(item['مؤشر الخطورة']).toNumber();
    });
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [StagnationRisk] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${stagnationRisk.length} صنف`);
    
    return stagnationRisk;
};