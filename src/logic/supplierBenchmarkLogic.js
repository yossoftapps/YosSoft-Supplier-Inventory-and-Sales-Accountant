// ═══════════════════════════════════════════════════════════════════════════
// مقارنة الموردين
// Supplier Benchmark
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
 * Calculates supplier benchmark by comparing suppliers based on multiple performance metrics
 * @param {Array} purchasesData - Net purchases data from netPurchasesLogic
 * @param {Array} returnsData - Returns data from netPurchasesLogic
 * @param {Array} supplierScorecardsData - Supplier scorecards data from supplierScorecardsLogic
 * @returns {Array} Supplier benchmark analysis data
 */
export const calculateSupplierBenchmark = (purchasesData, returnsData, supplierScorecardsData) => {
    const startTime = performance.now();
    
    if (!purchasesData || purchasesData.length === 0) {
        return [];
    }
    
    // Create maps to store data by supplier
    const purchasesMap = new Map();
    const returnsMap = new Map();
    const scorecardsMap = new Map();
    
    // Process purchases data
    purchasesData.forEach(purchase => {
        const supplier = purchase['المورد'];
        if (!supplier) return;
        
        const quantity = parseFloat(purchase['الكمية']) || 0;
        const unitPrice = parseFloat(purchase['الافرادي']) || 0;
        const materialCode = purchase['رمز المادة'];
        
        if (!purchasesMap.has(supplier)) {
            purchasesMap.set(supplier, {
                totalQuantity: new Decimal(0),
                totalValue: new Decimal(0),
                materials: new Set(),
                purchaseRecords: [],
                earliestPurchaseDate: null,
                latestPurchaseDate: null
            });
        }
        
        const entry = purchasesMap.get(supplier);
        entry.totalQuantity = add(entry.totalQuantity, new Decimal(quantity));
        entry.totalValue = add(entry.totalValue, new Decimal(quantity * unitPrice));
        entry.materials.add(materialCode);
        entry.purchaseRecords.push({
            date: purchase['تاريخ العملية'],
            quantity: quantity,
            unitPrice: unitPrice,
            materialCode: materialCode
        });
        
        // Track date range
        if (purchase['تاريخ العملية']) {
            const purchaseDate = new Date(purchase['تاريخ العملية']);
            if (!entry.earliestPurchaseDate || purchaseDate < entry.earliestPurchaseDate) {
                entry.earliestPurchaseDate = purchaseDate;
            }
            if (!entry.latestPurchaseDate || purchaseDate > entry.latestPurchaseDate) {
                entry.latestPurchaseDate = purchaseDate;
            }
        }
    });
    
    // Process returns data if available
    if (returnsData && returnsData.length > 0) {
        returnsData.forEach(returnItem => {
            const supplier = returnItem['المورد'];
            if (!supplier) return;
            
            const quantity = parseFloat(returnItem['الكمية']) || 0;
            const unitPrice = parseFloat(returnItem['الافرادي']) || 0;
            
            if (!returnsMap.has(supplier)) {
                returnsMap.set(supplier, {
                    totalQuantity: new Decimal(0),
                    totalValue: new Decimal(0),
                    returnRecords: []
                });
            }
            
            const entry = returnsMap.get(supplier);
            entry.totalQuantity = add(entry.totalQuantity, new Decimal(quantity));
            entry.totalValue = add(entry.totalValue, new Decimal(quantity * unitPrice));
            entry.returnRecords.push({
                date: returnItem['تاريخ العملية'],
                quantity: quantity,
                unitPrice: unitPrice
            });
        });
    }
    
    // Process supplier scorecards data if available
    if (supplierScorecardsData && supplierScorecardsData.length > 0) {
        supplierScorecardsData.forEach(scorecard => {
            const supplier = scorecard['المورد'];
            if (!supplier) return;
            
            scorecardsMap.set(supplier, {
                qualityScore: parseFloat(scorecard['درجة الجودة']) || 0,
                pricingScore: parseFloat(scorecard['درجة التسعير']) || 0,
                overallScore: parseFloat(scorecard['الدرجة الإجمالية']) || 0,
                returnRate: parseFloat(scorecard['نسبة المرتجعات %']) || 0,
                priceVariance: parseFloat(scorecard['تباين الأسعار']) || 0
            });
        });
    }
    
    // Calculate benchmark metrics for each supplier
    const benchmarkData = [];
    
    purchasesMap.forEach((purchaseEntry, supplier) => {
        const returnEntry = returnsMap.get(supplier);
        const scorecardEntry = scorecardsMap.get(supplier);
        
        // Calculate return rate
        const totalPurchasedValue = purchaseEntry.totalValue.toNumber();
        const totalReturnedValue = returnEntry ? returnEntry.totalValue.toNumber() : 0;
        const returnRate = totalPurchasedValue > 0 ? (totalReturnedValue / totalPurchasedValue) * 100 : 0;
        
        // Calculate number of errors in delivery (simplified - using returns as proxy)
        const numberOfErrors = returnEntry ? returnEntry.returnRecords.length : 0;
        
        // Calculate commitment to quantity (simplified metric)
        const commitmentToQuantity = 100; // Placeholder - would need more data for accurate calculation
        
        // Calculate commitment to time (simplified metric)
        const commitmentToTime = 100; // Placeholder - would need more data for accurate calculation
        
        // Calculate inventory value (from scorecard if available)
        const inventoryValue = scorecardEntry ? 0 : 0; // Placeholder
        
        // Calculate obsolete inventory (from scorecard if available)
        const obsoleteInventory = scorecardEntry ? 0 : 0; // Placeholder
        
        // Calculate expired items (from scorecard if available)
        const expiredItems = scorecardEntry ? 0 : 0; // Placeholder
        
        // Calculate financial metrics
        const averagePaymentPeriod = 30; // Placeholder - days
        const financialCommitment = 100; // Placeholder - percentage
        const balance = 0; // Placeholder
        
        // Calculate supplier score (0-100)
        // Weighted average of different metrics
        const qualityWeight = 0.3;
        const pricingWeight = 0.2;
        const deliveryWeight = 0.2;
        const financialWeight = 0.2;
        const inventoryWeight = 0.1;
        
        let qualityMetric = 100;
        let pricingMetric = 100;
        let deliveryMetric = 100;
        let financialMetric = 100;
        let inventoryMetric = 100;
        
        // Use scorecard data if available
        if (scorecardEntry) {
            qualityMetric = scorecardEntry.qualityScore;
            pricingMetric = scorecardEntry.pricingScore;
            // Delivery metric based on return rate (lower return rate = better delivery)
            deliveryMetric = 100 - returnRate;
        }
        
        const overallScore = 
            (qualityMetric * qualityWeight) +
            (pricingMetric * pricingWeight) +
            (deliveryMetric * deliveryWeight) +
            (financialMetric * financialWeight) +
            (inventoryMetric * inventoryWeight);
        
        // Determine supplier ranking
        let supplierRank = 0; // Will be calculated after sorting
        
        // Recommended dealing decision
        let recommendedDecision = 'استمرار';
        if (overallScore >= 80) {
            recommendedDecision = 'تفضيل';
        } else if (overallScore >= 60) {
            recommendedDecision = 'استمرار';
        } else if (overallScore >= 40) {
            recommendedDecision = 'مراقبة';
        } else {
            recommendedDecision = 'إيقاف';
        }
        
        benchmarkData.push({
            'المورد': supplier,
            'رمز الحساب': '', // Would need to extract from data
            'الحساب المساعد': '', // Would need to extract from data
            'متوسط سعر الوحدة': new Decimal(0), // Would calculate from purchase records
            'أدنى سعر تاريخي': new Decimal(0), // Would calculate from purchase records
            'أعلى سعر تاريخي': new Decimal(0), // Would calculate from purchase records
            'اتجاه الأسعار': 'ثابت', // Would analyze price trends
            'نسبة المرتجعات %': new Decimal(returnRate),
            'عدد الأخطاء في التوريد': numberOfErrors,
            'نسبة الالتزام بالكمية': new Decimal(commitmentToQuantity),
            'نسبة الالتزام بالوقت': new Decimal(commitmentToTime),
            'قيمة المخزون الحالي': new Decimal(inventoryValue),
            'قيمة المخزون الراكد': new Decimal(obsoleteInventory),
            'الأصناف المنتهية': new Decimal(expiredItems),
            'متوسط فترة السداد': new Decimal(averagePaymentPeriod),
            'الالتزام المالي': new Decimal(financialCommitment),
            'الرصيد': new Decimal(balance),
            'درجة المورد': new Decimal(overallScore),
            'ترتيب المورد': supplierRank, // Will be updated after sorting
            'قرار التعامل الموصى به': recommendedDecision
        });
    });
    
    // Sort by overall score descending to show best suppliers first
    benchmarkData.sort((a, b) => 
        compare(b['درجة المورد'], a['درجة المورد']));
    
    // Update supplier rankings
    benchmarkData.forEach((item, index) => {
        item['ترتيب المورد'] = index + 1;
    });
    
    // Convert Decimal values to numbers and add sequential numbering
    benchmarkData.forEach((item, index) => {
        item['م'] = index + 1;
        item['متوسط سعر الوحدة'] = item['متوسط سعر الوحدة'].toNumber();
        item['أدنى سعر تاريخي'] = item['أدنى سعر تاريخي'].toNumber();
        item['أعلى سعر تاريخي'] = item['أعلى سعر تاريخي'].toNumber();
        item['نسبة المرتجعات %'] = roundToDecimalPlaces(item['نسبة المرتجعات %'], 2).toNumber();
        item['نسبة الالتزام بالكمية'] = roundToInteger(item['نسبة الالتزام بالكمية']).toNumber();
        item['نسبة الالتزام بالوقت'] = roundToInteger(item['نسبة الالتزام بالوقت']).toNumber();
        item['قيمة المخزون الحالي'] = item['قيمة المخزون الحالي'].toNumber();
        item['قيمة المخزون الراكد'] = item['قيمة المخزون الراكد'].toNumber();
        item['الأصناف المنتهية'] = item['الأصناف المنتهية'].toNumber();
        item['متوسط فترة السداد'] = item['متوسط فترة السداد'].toNumber();
        item['الالتزام المالي'] = item['الالتزام المالي'].toNumber();
        item['الرصيد'] = item['الرصيد'].toNumber();
        item['درجة المورد'] = roundToInteger(item['درجة المورد']).toNumber();
    });
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [SupplierBenchmark] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${benchmarkData.length} مورد`);
    
    return benchmarkData;
};