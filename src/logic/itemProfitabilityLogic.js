// ═══════════════════════════════════════════════════════════════════════════
// تحليل ربحية الأصناف
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

export const calculateItemProfitability = (salesCostData, netSalesData, netPurchasesData, endingInventoryData) => {
    const startTime = performance.now();

    if (!salesCostData || salesCostData.length === 0) {
        return [];
    }

    // دالة مساعدة لتحويل القيم التي تحتوي على فواصل إلى نقطة قبل إنشاء Decimal
    const parseDecimal = (value) => {
        if (value === null || value === undefined || value === '') return new Decimal(0);
        const strValue = String(value).replace(/,/g, '');
        return new Decimal(strValue);
    };

    const profitabilityMap = new Map();

    // 1. Process Net Purchases to find main supplier and average cost
    const itemPurchaseInfo = new Map();
    if (netPurchasesData) {
        netPurchasesData.forEach(p => {
            const code = p['رمز المادة'];
            if (!code) return;

            if (!itemPurchaseInfo.has(code)) {
                itemPurchaseInfo.set(code, {
                    suppliers: new Map(),
                    totalValue: new Decimal(0),
                    totalQuantity: new Decimal(0)
                });
            }
            const info = itemPurchaseInfo.get(code);
            // استخدام الدالة parseDecimal لتحويل القيم التي تحتوي على فواصل
            const qty = parseDecimal(p['الكمية']);
            const value = multiply(qty, parseDecimal(p['الافرادي']));
            
            info.totalQuantity = add(info.totalQuantity, qty);
            info.totalValue = add(info.totalValue, value);

            const supplier = p['المورد'];
            if (supplier) {
                const currentSupplierQty = info.suppliers.get(supplier) || new Decimal(0);
                info.suppliers.set(supplier, add(currentSupplierQty, qty));
            }
        });
    }

    // 2. Process Ending Inventory to get current stock levels
    const inventoryInfo = new Map();
    if (endingInventoryData) {
        endingInventoryData.forEach(i => {
            const code = i['رمز المادة'];
            if (!code) return;

            if (!inventoryInfo.has(code)) {
                inventoryInfo.set(code, {
                    quantity: new Decimal(0),
                    value: new Decimal(0),
                });
            }
            const info = inventoryInfo.get(code);
            // استخدام الدالة parseDecimal لتحويل القيم التي تحتوي على فواصل
            info.quantity = add(info.quantity, parseDecimal(i['الكمية']));
            info.value = add(info.value, parseDecimal(i['الاجمالي']));
        });
    }


    // 3. Process Sales Cost Data
    salesCostData.forEach(item => {
        const materialCode = item['رمز المادة'];
        if (!materialCode) return;

        if (!profitabilityMap.has(materialCode)) {
            profitabilityMap.set(materialCode, {
                'رمز المادة': materialCode,
                'اسم المادة': item['اسم المادة'],
                'الوحدة': item['الوحدة'],
                'عدد عمليات البيع': 0,
                'إجمالي الكمية المباعة': new Decimal(0),
                'إجمالي قيمة المبيعات': new Decimal(0),
                'إجمالي تكلفة المبيعات': new Decimal(0),
                'إجمالي الربح': new Decimal(0),
                'ربحية آخر 30 يوم': new Decimal(0),
            });
        }

        const entry = profitabilityMap.get(materialCode);
        // استخدام الدالة parseDecimal لتحويل القيم التي تحتوي على فواصل
        const quantity = parseDecimal(item['الكمية']);
        const saleUnitPrice = parseDecimal(item['الافرادي']);
        const purchaseUnitPrice = parseDecimal(item['افرادي الشراء']);

        entry['عدد عمليات البيع'] += 1;
        entry['إجمالي الكمية المباعة'] = add(entry['إجمالي الكمية المباعة'], quantity);
        entry['إجمالي قيمة المبيعات'] = add(entry['إجمالي قيمة المبيعات'], multiply(quantity, saleUnitPrice));
        entry['إجمالي تكلفة المبيعات'] = add(entry['إجمالي تكلفة المبيعات'], multiply(quantity, purchaseUnitPrice));
        entry['إجمالي الربح'] = subtract(entry['إجمالي قيمة المبيعات'], entry['إجمالي تكلفة المبيعات']);
        
        const saleDate = new Date(item['تاريخ العملية']);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (saleDate >= thirtyDaysAgo) {
            const profitLast30Days = subtract(multiply(quantity, saleUnitPrice), multiply(quantity, purchaseUnitPrice));
            entry['ربحية آخر 30 يوم'] = add(entry['ربحية آخر 30 يوم'], profitLast30Days);
        }
    });

    // 4. Final Calculations
    const grandTotalProfit = Array.from(profitabilityMap.values()).reduce((sum, item) => add(sum, item['إجمالي الربح']), new Decimal(0));
    
    let result = Array.from(profitabilityMap.values()).map(entry => {
        const code = entry['رمز المادة'];
        const totalProfit = entry['إجمالي الربح'];
        const totalSalesValue = entry['إجمالي قيمة المبيعات'];
        const totalQuantitySold = entry['إجمالي الكمية المباعة'];
        const numTransactions = entry['عدد عمليات البيع'];

        // --- Formulas ---
        const profitMargin = compare(totalSalesValue, 0) > 0 ? roundToInteger(multiply(divide(totalProfit, totalSalesValue), 100)) : new Decimal(0);
        const profitPerUnit = compare(totalQuantitySold, 0) > 0 ? divide(totalProfit, totalQuantitySold) : new Decimal(0);
        const profitPerTransaction = numTransactions > 0 ? divide(totalProfit, new Decimal(numTransactions)) : new Decimal(0);
        const contribution = compare(grandTotalProfit, 0) > 0 ? roundToInteger(multiply(divide(totalProfit, grandTotalProfit), 100)) : new Decimal(0);

        // --- Get info from other maps ---
        const purchaseInfo = itemPurchaseInfo.get(code) || { suppliers: new Map(), totalValue: new Decimal(0), totalQuantity: new Decimal(0) };
        const avgPurchaseCost = compare(purchaseInfo.totalQuantity, 0) > 0 ? divide(purchaseInfo.totalValue, purchaseInfo.totalQuantity) : new Decimal(0);
        
        let mainSupplier = '';
        if (purchaseInfo.suppliers.size > 0) {
            mainSupplier = [...purchaseInfo.suppliers.entries()].reduce((a, b) => compare(b[1], a[1]) > 0 ? b : a)[0];
        }

        const stockInfo = inventoryInfo.get(code) || { quantity: new Decimal(0), value: new Decimal(0) };

        // --- Classifications ---
        let profitabilityClass = 'C';
        if (compare(totalProfit, 1000) > 0) profitabilityClass = 'A';
        else if (compare(totalProfit, 500) > 0) profitabilityClass = 'B';
        else if (compare(totalProfit, 0) < 0) profitabilityClass = 'D';

        let profitStatement = 'ربح';
        if (compare(totalProfit, 0) <= 0) profitStatement = 'خسارة';
        else if (compare(profitMargin, 5) < 0) profitStatement = 'ربح ضعيف';

        let futureDecision = 'مراقبة';
        if (profitabilityClass === 'A') futureDecision = 'تعزيز';
        else if (profitabilityClass === 'B') futureDecision = 'استمرار';
        else if (profitabilityClass === 'D') futureDecision = 'إيقاف';

        return {
            ...entry,
            'إجمالي قيمة المبيعات': totalSalesValue.toNumber(),
            'إجمالي تكلفة المبيعات': entry['إجمالي تكلفة المبيعات'].toNumber(),
            'إجمالي الربح': totalProfit.toNumber(),
            'إجمالي الكمية المباعة': totalQuantitySold.toNumber(),
            'ربحية آخر 30 يوم': entry['ربحية آخر 30 يوم'].toNumber(),
            
            // Item Info
            'المورد الرئيسي': mainSupplier,
            'المجموعة/الفئة': '', // Placeholder

            // Profitability Metrics
            'نسبة هامش الربح %': profitMargin.toNumber(),
            'متوسط تكلفة الشراء': avgPurchaseCost.toNumber(),
            'معدل الربحية': profitMargin.toNumber(), // Placeholder, using margin
            'الربح لكل وحدة مباعة': profitPerUnit.toNumber(),
            'الربح لكل معاملة': profitPerTransaction.toNumber(),
            'اتجاه الربح': 'مستقر', // Placeholder
            'بيان الربحية': profitStatement,

            // Inventory Metrics
            'كمية المخزون الحالي': stockInfo.quantity.toNumber(),
            'قيمة المخزون المتبقي': stockInfo.value.toNumber(),
            'نسبة المخزون الراكد': 0, // Placeholder
            'خسارة الصلاحية المتوقعة': 0, // Placeholder
            
            // Advanced Analysis
            'نسبة المساهمة في أرباح الشركة %': contribution.toNumber(),
            'تصنيف الربحية': profitabilityClass,

            // Recommendations
            'قرار الشراء المستقبلي': futureDecision
        };
    });

    result.sort((a, b) => b['إجمالي الربح'] - a['إجمالي الربح']);
    
    result.forEach((item, index) => {
        item['م'] = index + 1;
        item['ترتيب الصنف حسب الربحية'] = index + 1;
    });

    const totalTime = performance.now() - startTime;
    console.log(`✅ [ItemProfitability] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${result.length} صنف`);

    return result;
};
