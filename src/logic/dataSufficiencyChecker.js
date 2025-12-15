// Data Sufficiency Checker Module
// Checks if imported data is sufficient to generate all required reports

/**
 * Check if the imported data is sufficient to generate all required reports
 * @param {Object} rawData - The raw data object containing all sheets
 * @returns {Object} Result object with isSufficient flag and errors array
 */
export const checkDataSufficiency = (rawData) => {
  const result = {
    isSufficient: true,
    errors: []
  };

  // Check if all required sheets exist
  const requiredSheets = ['purchases', 'sales', 'physicalInventory', 'supplierbalances'];
  const missingSheets = requiredSheets.filter(sheet => !rawData[sheet]);
  
  if (missingSheets.length > 0) {
    result.isSufficient = false;
    result.errors.push(`أوراق العمل التالية مفقودة: ${missingSheets.join(', ')}`);
    return result;
  }

  // Check if sheets have data
  const emptySheets = [];
  for (const sheet of requiredSheets) {
    // Check if sheet has at least header row and one data row
    if (!rawData[sheet] || rawData[sheet].length < 2) {
      emptySheets.push(sheet);
    }
  }
  
  if (emptySheets.length > 0) {
    result.isSufficient = false;
    result.errors.push(`أوراق العمل التالية لا تحتوي على بيانات كافية: ${emptySheets.join(', ')}`);
  }

  // Check for critical data in purchases
  if (rawData.purchases && rawData.purchases.length >= 2) {
    const purchaseHeaders = rawData.purchases[0];
    const criticalPurchaseColumns = ['رمز المادة', 'الكمية', 'الافرادي', 'المورد'];
    const missingPurchaseColumns = criticalPurchaseColumns.filter(col => !purchaseHeaders.includes(col));
    
    if (missingPurchaseColumns.length > 0) {
      result.isSufficient = false;
      result.errors.push(`أعمدة حرجة مفقودة في بيانات المشتريات: ${missingPurchaseColumns.join(', ')}`);
    }
  }

  // Check for critical data in sales
  if (rawData.sales && rawData.sales.length >= 2) {
    const salesHeaders = rawData.sales[0];
    const criticalSalesColumns = ['رمز المادة', 'الكمية', 'الافرادي'];
    const missingSalesColumns = criticalSalesColumns.filter(col => !salesHeaders.includes(col));
    
    if (missingSalesColumns.length > 0) {
      result.isSufficient = false;
      result.errors.push(`أعمدة حرجة مفقودة في بيانات المبيعات: ${missingSalesColumns.join(', ')}`);
    }
  }

  // Check for critical data in physical inventory
  if (rawData.physicalInventory && rawData.physicalInventory.length >= 2) {
    const inventoryHeaders = rawData.physicalInventory[0];
    const criticalInventoryColumns = ['رمز المادة', 'الكمية', 'تاريخ الصلاحية'];
    const missingInventoryColumns = criticalInventoryColumns.filter(col => !inventoryHeaders.includes(col));
    
    if (missingInventoryColumns.length > 0) {
      result.isSufficient = false;
      result.errors.push(`أعمدة حرجة مفقودة في بيانات الجرد الفعلي: ${missingInventoryColumns.join(', ')}`);
    }
  }

  // Check for critical data in supplier balances
  if (rawData.supplierbalances && rawData.supplierbalances.length >= 2) {
    const balanceHeaders = rawData.supplierbalances[0];
    const criticalBalanceColumns = ['رمز الحساب', 'المورد', 'مدين', 'دائن'];
    const missingBalanceColumns = criticalBalanceColumns.filter(col => !balanceHeaders.includes(col));
    
    if (missingBalanceColumns.length > 0) {
      result.isSufficient = false;
      result.errors.push(`أعمدة حرجة مفقودة في بيانات أرصدة الموردين: ${missingBalanceColumns.join(', ')}`);
    }
  }

  return result;
};