// ═══════════════════════════════════════════════════════════════════════════
// فجوة الشراء المثالية
// Ideal Replenishment Gap
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
 * Calculates ideal replenishment gap by determining optimal reorder points and quantities
 * @param {Array} salesData - Net sales data from netSalesLogic
 * @param {Array} inventoryData - Ending inventory data from endingInventoryLogic
 * @param {Array} abcAnalysisData - ABC analysis data from inventoryABCLogic
 * @returns {Array} Ideal replenishment gap analysis data
 */
export const calculateIdealReplenishmentGap = (salesData, inventoryData, abcAnalysisData) => {
    const startTime = performance.now();

    if (!salesData || salesData.length === 0 || !inventoryData || inventoryData.length === 0) {
        return [];
    }

    // Create maps to store data by material code
    const salesMap = new Map();
    const inventoryMap = new Map();
    const abcMap = new Map();

    // Process sales data to calculate daily sales rates
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
    const dailySalesRateMap = new Map();

    materialSalesStats.forEach((stats, materialCode) => {
        if (stats.totalDays > 0) {
            const averageDailyRate = stats.totalQuantity / stats.totalDays;
            dailySalesRateMap.set(materialCode, averageDailyRate);
        }
    });

    // Process inventory data
    inventoryData.forEach(inventory => {
        const materialCode = inventory['رمز المادة'];
        if (!materialCode) return;

        const quantity = parseFloat(inventory['الكمية']) || 0;
        const expiryDateStr = inventory['تاريخ الصلاحية'];

        if (!inventoryMap.has(materialCode)) {
            inventoryMap.set(materialCode, {
                currentQuantity: new Decimal(0),
                expiryDates: [],
                supplier: inventory['المورد'] || '',
                itemName: inventory['اسم المادة'] || '',
                unit: inventory['الوحدة'] || ''
            });
        }

        const entry = inventoryMap.get(materialCode);
        entry.currentQuantity = add(entry.currentQuantity, new Decimal(quantity));
        if (expiryDateStr) {
            entry.expiryDates.push(new Date(expiryDateStr));
        }
        if (!entry.supplier && inventory['المورد']) {
            entry.supplier = inventory['المورد'];
        }
        if (!entry.itemName && inventory['اسم المادة']) {
            entry.itemName = inventory['اسم المادة'];
        }
        if (!entry.unit && inventory['الوحدة']) {
            entry.unit = inventory['الوحدة'];
        }
    });

    // Process ABC analysis data if available
    if (abcAnalysisData && abcAnalysisData.length > 0) {
        abcAnalysisData.forEach(item => {
            const materialCode = item['رمز المادة'];
            if (!materialCode) return;

            abcMap.set(materialCode, {
                classification: item['التصنيف ABC'] || 'C',
                annualConsumptionValue: parseFloat(item['إجمالي قيمة الاستهلاك السنوي']) || 0
            });
        });
    }

    // Calculate ideal replenishment gap for each material
    const replenishmentData = [];

    inventoryMap.forEach((inventoryEntry, materialCode) => {
        const dailySalesRate = dailySalesRateMap.get(materialCode) || 0;
        const abcData = abcMap.get(materialCode);

        // Calculate safety stock (based on ABC classification)
        // A items: 14 days, B items: 7 days, C items: 3 days
        const safetyStockDays = abcData ?
            (abcData.classification === 'A' ? 14 : abcData.classification === 'B' ? 7 : 3) : 7;
        const safetyStock = new Decimal(dailySalesRate * safetyStockDays);

        // Calculate reorder point (ROP) = safety stock + (daily sales rate * lead time)
        // Assuming a default lead time of 3 days
        const leadTimeDays = 3;
        const reorderPoint = add(safetyStock, new Decimal(dailySalesRate * leadTimeDays));

        // Calculate ideal order quantity (using a simple formula)
        // For this example, we'll use a fixed period of 30 days
        const orderPeriodDays = 30;
        const idealOrderQuantity = new Decimal(dailySalesRate * orderPeriodDays);

        // Calculate current gap
        const currentQuantity = inventoryEntry.currentQuantity;
        const gap = subtract(idealOrderQuantity, currentQuantity);

        // Determine status based on gap
        let status = 'لا شراء';
        if (compare(gap, new Decimal(0)) > 0) {
            status = gap > idealOrderQuantity.times(0.5) ? 'احتياج عاجل' : 'احتياج قريب';
        } else if (compare(gap, new Decimal(0)) < 0) {
            status = 'فائض كبير';
        }

        // Calculate nearest expiry date
        let nearestExpiryDate = null;
        if (inventoryEntry.expiryDates.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const futureExpiries = inventoryEntry.expiryDates
                .filter(date => date >= today)
                .sort((a, b) => a - b);

            if (futureExpiries.length > 0) {
                nearestExpiryDate = futureExpiries[0];
            }
        }

        replenishmentData.push({
            'رمز المادة': materialCode,
            'اسم المادة': inventoryEntry.itemName,
            'الوحدة': inventoryEntry.unit,
            'المورد': inventoryEntry.supplier,
            'متوسط الاستهلاك اليومي': new Decimal(dailySalesRate),
            'مخزون الأمان': safetyStock,
            'نقطة إعادة الطلب': reorderPoint,
            'الكمية المثالية للشراء': idealOrderQuantity,
            'الكمية الحالية': currentQuantity,
            'فجوة المخزون': gap,
            'الحالة': status,
            'تاريخ أقرب صلاحية': nearestExpiryDate,
            'تصنيف ABC': abcData ? abcData.classification : 'غير محدد'
        });
    });

    // Sort by gap descending to show items needing replenishment first
    replenishmentData.sort((a, b) =>
        compare(b['فجوة المخزون'], a['فجوة المخزون']));

    // Convert Decimal values to numbers and add sequential numbering
    replenishmentData.forEach((item, index) => {
        item['م'] = index + 1;
        item['متوسط الاستهلاك اليومي'] = roundToDecimalPlaces(item['متوسط الاستهلاك اليومي'], 2).toNumber();
        item['مخزون الأمان'] = roundToDecimalPlaces(item['مخزون الأمان'], 2).toNumber();
        item['نقطة إعادة الطلب'] = roundToDecimalPlaces(item['نقطة إعادة الطلب'], 2).toNumber();
        item['الكمية المثالية للشراء'] = roundToDecimalPlaces(item['الكمية المثالية للشراء'], 2).toNumber();
        item['الكمية الحالية'] = item['الكمية الحالية'].toNumber();
        item['فجوة المخزون'] = roundToDecimalPlaces(item['فجوة المخزون'], 2).toNumber();
    });

    const totalTime = performance.now() - startTime;
    console.log(`✅ [IdealReplenishment] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${replenishmentData.length} صنف`);

    return replenishmentData;
};