// خدمات معالجة البيانات
// هذا الملف يوفر واجهة موحدة لمعالجة جميع البيانات باستخدام الوظائف المنطقية

// استيراد جميع دوال المنطق
import { calculateNetPurchases } from '../logic/netPurchasesLogic';
import { calculateNetSales } from '../logic/netSalesLogic';
import { processPhysicalInventory } from '../logic/physicalInventoryLogic';
import { calculateExcessInventory } from '../logic/excessInventoryLogic';
import { calculateEndingInventory } from '../logic/endingInventoryLogic';
import { calculateSalesCost } from '../logic/salesCostLogic';
import { calculateSupplierPayables } from '../logic/supplierPayablesLogic';
import { calculateBookInventory } from '../logic/bookInventoryLogic';

/**
 * معالجة جميع البيانات من ملف Excel
 * @param {Object} rawData - البيانات الخام من ملف Excel
 * @returns {Object} جميع البيانات المعالجة
 */
export const processData = async (rawData) => {
  try {
    console.log('--- بدء معالجة البيانات ---');

    // 1. معالجة المشتريات
    const allPurchases = rawData.purchases.filter(row => row[9] === 'مشتريات');
    const purchaseReturns = rawData.purchases.filter(row => row[9] === 'مرتجع');
    const netPurchasesResult = calculateNetPurchases(allPurchases, purchaseReturns);

    // 2. معالجة المبيعات
    const allSales = rawData.sales.filter(row => row[8] === 'مبيعات');
    const salesReturns = rawData.sales.filter(row => row[8] === 'مرتجع');
    const netSalesResult = calculateNetSales(allSales, salesReturns);

    // 3. معالجة الجرد الفعلي
    const physicalInventoryResult = processPhysicalInventory(rawData.physicalInventory);

    // 4. معالجة فائض المخزون
    const excessInventoryResult = calculateExcessInventory(rawData.physicalInventory, rawData.sales);

    // 5. معالجة المخزون النهائي (يعتمد على نتائج سابقة)
    const endingInventoryResult = calculateEndingInventory(netPurchasesResult, physicalInventoryResult, excessInventoryResult);

    // 6. معالجة تكلفة المبيعات (يعتمد على نتائج سابقة)
    const salesCostResult = calculateSalesCost(netPurchasesResult, netSalesResult);

    // 7. معالجة استحقاق الموردين (يعتمد على نتائج سابقة)
    const suppliersPayablesResult = calculateSupplierPayables(rawData.supplierbalances, endingInventoryResult.endingInventoryList);

    // 8. معالجة الجرد الدفتري (يعتمد على نتائج سابقة)
    // دمج قائمة A و B من صافي المشتريات
    const netPurchasesCombined = [
        ...(netPurchasesResult.netPurchasesList || []),
        ...(netPurchasesResult.orphanReturnsList || [])
    ];
    
    // دمج قائمة C و D من صافي المبيعات
    const netSalesCombined = [
        ...(netSalesResult.netSalesList || []),
        ...(netSalesResult.orphanReturnsList || [])
    ];
    
    const bookInventoryResult = calculateBookInventory(netPurchasesCombined, netSalesCombined);

    // إرجاع جميع البيانات المعالجة
    const processedData = {
        raw: rawData,
        netPurchases: netPurchasesResult,
        netSales: netSalesResult,
        physicalInventory: physicalInventoryResult,
        endingInventory: endingInventoryResult,
        bookInventory: bookInventoryResult,
        excessInventory: excessInventoryResult,
        salesCost: salesCostResult,
        suppliersPayables: suppliersPayablesResult,
    };

    console.log('--- انتهت معالجة البيانات ---');
    return processedData;
  } catch (error) {
    console.error('خطأ في معالجة البيانات:', error);
    throw new Error(`فشل في معالجة البيانات: ${error.message}`);
  }
};