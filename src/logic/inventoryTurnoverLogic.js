// ═══════════════════════════════════════════════════════════════════════════
// دوران المخزون
// Inventory Turnover
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
 * Calculates inventory turnover by measuring how many times inventory is sold and replaced over a period
 * @param {Array} salesData - Net sales data from netSalesLogic
 * @param {Array} inventoryData - Ending inventory data from endingInventoryLogic
 * @param {Array} purchasesData - Net purchases data from netPurchasesLogic
 * @returns {Array} Inventory turnover analysis data
 */
export const calculateInventoryTurnover = (salesData, inventoryData, purchasesData) => {
    const startTime = performance.now();
    
    if (!salesData || salesData.length === 0 || !inventoryData || inventoryData.length === 0) {
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
        
        if (!salesMap.has(materialCode)) {
            salesMap.set(materialCode, {
                totalQuantity: new Decimal(0),
                totalValue: new Decimal(0),
                count: 0
            });
        }
        
        const entry = salesMap.get(materialCode);
        entry.totalQuantity = add(entry.totalQuantity, new Decimal(quantity));
        entry.totalValue = add(entry.totalValue, new Decimal(quantity * unitPrice));
        entry.count += 1;
    });
    
    // Process purchases data if available
    if (purchasesData && purchasesData.length > 0) {
        purchasesData.forEach(purchase => {
            const materialCode = purchase['رمز المادة'];
            if (!materialCode) return;
            
            const quantity = parseFloat(purchase['الكمية']) || 0;
            const unitPrice = parseFloat(purchase['الافرادي']) || 0;
            
            if (!purchasesMap.has(materialCode)) {
                purchasesMap.set(materialCode, {
                    totalQuantity: new Decimal(0),
                    totalValue: new Decimal(0),
                    count: 0
                });
            }
            
            const entry = purchasesMap.get(materialCode);
            entry.totalQuantity = add(entry.totalQuantity, new Decimal(quantity));
            entry.totalValue = add(entry.totalValue, new Decimal(quantity * unitPrice));
            entry.count += 1;
        });
    }
    
    // Process inventory data
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
    
    // Calculate inventory turnover for each material
    const turnoverData = [];
    
    inventoryMap.forEach((inventoryEntry, materialCode) => {
        const salesEntry = salesMap.get(materialCode);
        const purchasesEntry = purchasesMap.get(materialCode);
        
        // Calculate COGS (Cost of Goods Sold) - using sales data as proxy
        // In a more sophisticated system, we'd use actual cost data
        const cogs = salesEntry ? salesEntry.totalValue : new Decimal(0);
        
        // Calculate average inventory value
        // For simplicity, we're using current inventory value as average
        // In a more sophisticated system, we'd use (beginning inventory + ending inventory) / 2
        const averageInventoryValue = inventoryEntry.currentValue;
        
        // Calculate inventory turnover ratio
        let turnoverRatio = new Decimal(0);
        if (compare(averageInventoryValue, new Decimal(0)) > 0) {
            try {
                turnoverRatio = divide(cogs, averageInventoryValue);
            } catch (e) {
                turnoverRatio = new Decimal(0);
            }
        }
        
        // Calculate days in inventory (storage period)
        let daysInInventory = new Decimal(0);
        if (compare(turnoverRatio, new Decimal(0)) > 0) {
            try {
                // Days in inventory = 365 / turnover ratio
                daysInInventory = divide(new Decimal(365), turnoverRatio);
            } catch (e) {
                daysInInventory = new Decimal(0);
            }
        }
        
        // Classify turnover speed
        let turnoverClassification = 'راكد';
        const turnoverValue = turnoverRatio.toNumber();
        if (turnoverValue > 12) {
            turnoverClassification = 'سريع';
        } else if (turnoverValue > 6) {
            turnoverClassification = 'متوسط';
        } else if (turnoverValue > 2) {
            turnoverClassification = 'بطيء';
        }
        
        // Risk indicator based on turnover
        let riskIndicator = new Decimal(100); // High risk for slow turnover
        if (turnoverValue > 0) {
            // Scale risk from 0 (fast turnover) to 100 (slow turnover)
            riskIndicator = new Decimal(Math.min(100, 100 / turnoverValue));
        }
        
        turnoverData.push({
            'رمز المادة': materialCode,
            'اسم المادة': inventoryEntry.supplier.split(' - ')[1] || '', // Extract material name if available
            'الوحدة': '', // Would need to extract from data
            'المورد': inventoryEntry.supplier,
            'متوسط المخزون': averageInventoryValue,
            'تكلفة المبيعات السنوية': cogs,
            'معدل دوران المخزون': turnoverRatio,
            'فترة التخزين': daysInInventory,
            'حركة آخر 90 يوم': salesEntry ? salesEntry.totalQuantity : new Decimal(0),
            'فئة الدوران': turnoverClassification,
            'مؤشر الخطورة': riskIndicator
        });
    });
    
    // Sort by inventory turnover ratio descending to show fastest turnover items first
    turnoverData.sort((a, b) => 
        compare(b['معدل دوران المخزون'], a['معدل دوران المخزون']));
    
    // Convert Decimal values to numbers and add sequential numbering
    turnoverData.forEach((item, index) => {
        item['م'] = index + 1;
        item['متوسط المخزون'] = item['متوسط المخزون'].toNumber();
        item['تكلفة المبيعات السنوية'] = item['تكلفة المبيعات السنوية'].toNumber();
        item['معدل دوران المخزون'] = roundToDecimalPlaces(item['معدل دوران المخزون'], 2).toNumber();
        item['فترة التخزين'] = roundToInteger(item['فترة التخزين']).toNumber();
        item['حركة آخر 90 يوم'] = item['حركة آخر 90 يوم'].toNumber();
        item['مؤشر الخطورة'] = roundToInteger(item['مؤشر الخطورة']).toNumber();
    });
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [InventoryTurnover] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${turnoverData.length} صنف`);
    
    return turnoverData;
};