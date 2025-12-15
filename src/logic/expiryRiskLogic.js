// ═══════════════════════════════════════════════════════════════════════════
// توقعات مخاطر انتهاء الصلاحية
// Expiry Risk Forecast
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
 * Calculates expiry risk forecast by predicting quantities at risk of spoilage before sale
 * @param {Array} salesData - Net sales data from netSalesLogic
 * @param {Array} inventoryData - Ending inventory data from endingInventoryLogic
 * @returns {Array} Expiry risk forecast data with risk predictions
 */
export const calculateExpiryRiskForecast = (salesData, inventoryData) => {
    const startTime = performance.now();
    
    if (!salesData || salesData.length === 0 || !inventoryData || inventoryData.length === 0) {
        return [];
    }
    
    // Create a map to store daily sales rates by material code
    const dailySalesRateMap = new Map();
    
    // Calculate daily sales rate for each material
    // Group sales by material code and date to get daily sales
    const materialDailySales = new Map();
    
    salesData.forEach(sale => {
        const materialCode = sale['رمز المادة'];
        const saleDate = sale['تاريخ العملية'];
        const quantity = parseFloat(sale['الكمية']) || 0;
        
        if (!materialCode || !saleDate) return;
        
        const dateKey = `${materialCode}|${saleDate}`;
        if (!materialDailySales.has(dateKey)) {
            materialDailySales.set(dateKey, {
                materialCode: materialCode,
                date: saleDate,
                totalQuantity: 0
            });
        }
        
        const entry = materialDailySales.get(dateKey);
        entry.totalQuantity += quantity;
    });
    
    // Calculate average daily sales rate for each material
    const materialSalesStats = new Map();
    
    // Group by material code
    materialDailySales.forEach(entry => {
        const materialCode = entry.materialCode;
        if (!materialSalesStats.has(materialCode)) {
            materialSalesStats.set(materialCode, {
                totalDays: 0,
                totalQuantity: 0,
                dailyRates: []
            });
        }
        
        const stats = materialSalesStats.get(materialCode);
        stats.totalDays += 1;
        stats.totalQuantity += entry.totalQuantity;
        stats.dailyRates.push(entry.totalQuantity);
    });
    
    // Calculate average daily sales rate
    materialSalesStats.forEach((stats, materialCode) => {
        if (stats.totalDays > 0) {
            const averageDailyRate = stats.totalQuantity / stats.totalDays;
            dailySalesRateMap.set(materialCode, averageDailyRate);
        }
    });
    
    // Process inventory data to calculate expiry risk for each batch
    const riskForecast = [];
    
    inventoryData.forEach(batch => {
        const materialCode = batch['رمز المادة'];
        const batchQuantity = parseFloat(batch['الكمية']) || 0;
        const expiryDateStr = batch['تاريخ الصلاحية'];
        
        if (!materialCode || !expiryDateStr || batchQuantity <= 0) return;
        
        // Parse expiry date
        const expiryDate = new Date(expiryDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate days until expiry
        const timeDiff = expiryDate.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Skip batches that have already expired
        if (daysUntilExpiry < 0) return;
        
        // Get daily sales rate for this material
        const dailyRate = dailySalesRateMap.get(materialCode) || 0;
        
        // Calculate expected quantity to sell before expiry
        const expectedQuantityToSell = dailyRate * daysUntilExpiry;
        
        // Calculate expected risk
        let expectedRisk = 0;
        if (expectedQuantityToSell < batchQuantity) {
            expectedRisk = batchQuantity - expectedQuantityToSell;
        }
        
        // Only include batches with risk > 0
        if (expectedRisk > 0) {
            riskForecast.push({
                'رمز المادة': materialCode,
                'اسم المادة': batch['اسم المادة'],
                'الوحدة': batch['الوحدة'],
                'رقم السجل': batch['رقم السجل'],
                'الكمية الحالية': new Decimal(batchQuantity),
                'تاريخ الصلاحية': expiryDateStr,
                'الأيام المتبقية': daysUntilExpiry,
                'معدل البيع اليومي': new Decimal(dailyRate),
                'الكمية المتوقعة للبيع': new Decimal(expectedQuantityToSell),
                'الخطر المتوقع': new Decimal(expectedRisk),
                'نسبة الخطر %': dailyRate > 0 ? 
                    new Decimal((expectedRisk / batchQuantity) * 100) : new Decimal(0)
            });
        }
    });
    
    // Sort by expected risk descending to show highest risk items first
    riskForecast.sort((a, b) => 
        compare(b['الخطر المتوقع'], a['الخطر المتوقع']));
    
    // Convert Decimal values to numbers and add sequential numbering
    riskForecast.forEach((item, index) => {
        item['م'] = index + 1;
        item['الكمية الحالية'] = item['الكمية الحالية'].toNumber();
        item['معدل البيع اليومي'] = roundToDecimalPlaces(item['معدل البيع اليومي'], 2).toNumber();
        item['الكمية المتوقعة للبيع'] = roundToDecimalPlaces(item['الكمية المتوقعة للبيع'], 2).toNumber();
        item['الخطر المتوقع'] = roundToDecimalPlaces(item['الخطر المتوقع'], 2).toNumber();
        item['نسبة الخطر %'] = roundToInteger(item['نسبة الخطر %']).toNumber();
    });
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [ExpiryRiskForecast] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${riskForecast.length} بند`);
    
    return riskForecast;
};