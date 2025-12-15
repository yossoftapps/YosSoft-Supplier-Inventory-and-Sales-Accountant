// ═══════════════════════════════════════════════════════════════════════════
// أداء الأصناف الجديدة
// New Items Performance
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
 * Calculates new items performance by analyzing the performance of recently introduced products
 * @param {Array} salesData - Net sales data from netSalesLogic
 * @param {Array} inventoryData - Ending inventory data from endingInventoryLogic
 * @param {Array} purchasesData - Net purchases data from netPurchasesLogic
 * @returns {Array} New items performance analysis data
 */
export const calculateNewItemsPerformance = (salesData, inventoryData, purchasesData) => {
    const startTime = performance.now();
    
    if (!salesData || salesData.length === 0 || !purchasesData || purchasesData.length === 0) {
        return [];
    }
    
    // Create maps to store data by material code
    const salesMap = new Map();
    const purchasesMap = new Map();
    const inventoryMap = new Map();
    
    // Process sales data
    salesData.forEach(sale => {
        const materialCode = sale['رمز المادة'];
        if (!materialCode) return;
        
        const quantity = parseFloat(sale['الكمية']) || 0;
        const unitPrice = parseFloat(sale['الافرادي']) || 0;
        const saleDate = sale['تاريخ العملية'];
        
        if (!salesMap.has(materialCode)) {
            salesMap.set(materialCode, {
                totalQuantity: new Decimal(0),
                totalValue: new Decimal(0),
                firstSaleDate: saleDate ? new Date(saleDate) : null,
                lastSaleDate: saleDate ? new Date(saleDate) : null,
                saleDates: saleDate ? [new Date(saleDate)] : [],
                count: 0
            });
        }
        
        const entry = salesMap.get(materialCode);
        entry.totalQuantity = add(entry.totalQuantity, new Decimal(quantity));
        entry.totalValue = add(entry.totalValue, new Decimal(quantity * unitPrice));
        entry.count += 1;
        
        if (saleDate) {
            const date = new Date(saleDate);
            entry.saleDates.push(date);
            
            if (!entry.firstSaleDate || date < entry.firstSaleDate) {
                entry.firstSaleDate = date;
            }
            
            if (!entry.lastSaleDate || date > entry.lastSaleDate) {
                entry.lastSaleDate = date;
            }
        }
    });
    
    // Process purchases data
    purchasesData.forEach(purchase => {
        const materialCode = purchase['رمز المادة'];
        if (!materialCode) return;
        
        const quantity = parseFloat(purchase['الكمية']) || 0;
        const unitPrice = parseFloat(purchase['الافرادي']) || 0;
        const purchaseDate = purchase['تاريخ العملية'];
        
        if (!purchasesMap.has(materialCode)) {
            purchasesMap.set(materialCode, {
                totalQuantity: new Decimal(0),
                totalValue: new Decimal(0),
                firstPurchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                lastPurchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                count: 0
            });
        }
        
        const entry = purchasesMap.get(materialCode);
        entry.totalQuantity = add(entry.totalQuantity, new Decimal(quantity));
        entry.totalValue = add(entry.totalValue, new Decimal(quantity * unitPrice));
        entry.count += 1;
        
        if (purchaseDate) {
            const date = new Date(purchaseDate);
            
            if (!entry.firstPurchaseDate || date < entry.firstPurchaseDate) {
                entry.firstPurchaseDate = date;
            }
            
            if (!entry.lastPurchaseDate || date > entry.lastPurchaseDate) {
                entry.lastPurchaseDate = date;
            }
        }
    });
    
    // Process inventory data if available
    if (inventoryData && inventoryData.length > 0) {
        inventoryData.forEach(inventory => {
            const materialCode = inventory['رمز المادة'];
            if (!materialCode) return;
            
            const quantity = parseFloat(inventory['الكمية']) || 0;
            const unitPrice = parseFloat(inventory['الافرادي']) || 0;
            
            if (!inventoryMap.has(materialCode)) {
                inventoryMap.set(materialCode, {
                    currentQuantity: new Decimal(0),
                    currentValue: new Decimal(0),
                    supplier: inventory['المورد'] || ''
                });
            }
            
            const entry = inventoryMap.get(materialCode);
            entry.currentQuantity = add(entry.currentQuantity, new Decimal(quantity));
            entry.currentValue = add(entry.currentValue, new Decimal(quantity * unitPrice));
            if (!entry.supplier && inventory['المورد']) {
                entry.supplier = inventory['المورد'];
            }
        });
    }
    
    // Calculate performance metrics for new items
    const performanceData = [];
    
    // Consider items as "new" if their first purchase was within the last 180 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 180);
    
    purchasesMap.forEach((purchaseEntry, materialCode) => {
        // Check if this is a new item (first purchase within last 180 days)
        if (!purchaseEntry.firstPurchaseDate || purchaseEntry.firstPurchaseDate < cutoffDate) {
            return; // Skip non-new items
        }
        
        const salesEntry = salesMap.get(materialCode);
        const inventoryEntry = inventoryMap.get(materialCode);
        
        // Calculate days in market
        const firstPurchaseDate = purchaseEntry.firstPurchaseDate;
        const today = new Date();
        const timeDiff = today.getTime() - firstPurchaseDate.getTime();
        const daysInMarket = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Calculate sales performance
        const purchasedQuantity = purchaseEntry.totalQuantity.toNumber();
        const soldQuantity = salesEntry ? salesEntry.totalQuantity.toNumber() : 0;
        const disposalRate = purchasedQuantity > 0 ? (soldQuantity / purchasedQuantity) * 100 : 0;
        
        // Calculate daily sales rate
        const dailySalesRate = daysInMarket > 0 ? soldQuantity / daysInMarket : 0;
        
        // Calculate gross profit
        const salesValue = salesEntry ? salesEntry.totalValue.toNumber() : 0;
        const purchaseValue = purchaseEntry.totalValue.toNumber();
        // For simplicity, we're assuming purchase value represents cost
        const grossProfit = salesValue - purchaseValue;
        
        // Calculate profit margin
        const profitMargin = salesValue > 0 ? (grossProfit / salesValue) * 100 : 0;
        
        // Performance rating
        let performanceRating = 'Poor';
        if (disposalRate >= 80 && profitMargin >= 20) {
            performanceRating = 'Excellent';
        } else if (disposalRate >= 60 && profitMargin >= 10) {
            performanceRating = 'Good';
        } else if (disposalRate >= 40 || profitMargin >= 5) {
            performanceRating = 'Fair';
        }
        
        // Risk indicator
        let riskIndicator = 'Low';
        if (disposalRate < 20 || profitMargin < 0) {
            riskIndicator = 'High';
        } else if (disposalRate < 40 || profitMargin < 5) {
            riskIndicator = 'Medium';
        }
        
        // Item status recommendation
        let statusRecommendation = 'متابعة';
        if (performanceRating === 'Excellent') {
            statusRecommendation = 'استمرار';
        } else if (performanceRating === 'Poor' && riskIndicator === 'High') {
            statusRecommendation = 'إلغاء';
        } else if (performanceRating === 'Poor') {
            statusRecommendation = 'اختبار';
        }
        
        performanceData.push({
            'رمز المادة': materialCode,
            'اسم المادة': '', // Would need to extract from data
            'الوحدة': '', // Would need to extract from data
            'المورد': purchaseEntry.supplier || (inventoryEntry ? inventoryEntry.supplier : ''),
            'تاريخ أول شراء': firstPurchaseDate,
            'مدة التواجد في السوق (أيام)': daysInMarket,
            'كمية الشراء الأولية': purchasedQuantity,
            'كمية المبيعات': soldQuantity,
            'نسبة تصريف الكمية (%)': new Decimal(disposalRate),
            'معدل البيع اليومي': new Decimal(dailySalesRate),
            'الربح الإجمالي': new Decimal(grossProfit),
            'هامش الربح %': new Decimal(profitMargin),
            'تقييم الأداء': performanceRating,
            'مؤشر المخاطرة': riskIndicator,
            'حالة الصنف': statusRecommendation
        });
    });
    
    // Sort by days in market ascending to show newest items first
    performanceData.sort((a, b) => a['مدة التواجد في السوق (أيام)'] - b['مدة التواجد في السوق (أيام)']);
    
    // Convert Decimal values to numbers and add sequential numbering
    performanceData.forEach((item, index) => {
        item['م'] = index + 1;
        item['نسبة تصريف الكمية (%)'] = roundToDecimalPlaces(item['نسبة تصريف الكمية (%)'], 2).toNumber();
        item['معدل البيع اليومي'] = roundToDecimalPlaces(item['معدل البيع اليومي'], 2).toNumber();
        item['الربح الإجمالي'] = roundToDecimalPlaces(item['الربح الإجمالي'], 2).toNumber();
        item['هامش الربح %'] = roundToDecimalPlaces(item['هامش الربح %'], 2).toNumber();
    });
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [NewItemsPerformance] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${performanceData.length} صنف جديد`);
    
    return performanceData;
};