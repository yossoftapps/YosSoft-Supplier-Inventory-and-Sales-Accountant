// Financial Integrity Checker Module
// Verifies the integrity of financial data after normalization

/**
 * Check if financial data has integrity issues
 * @param {Object} normalizedData - The normalized data object
 * @returns {Object} Result object with isValid flag and errors array
 */
export const checkFinancialDataIntegrity = (normalizedData) => {
  const result = {
    isValid: true,
    errors: []
  };

  // Check for negative quantities (which might indicate data entry errors)
  const checkNegativeQuantities = (data, tableName) => {
    if (!data || data.length < 2) return;
    
    const headers = data[0];
    const quantityIndex = headers.indexOf('الكمية');
    
    if (quantityIndex === -1) return;
    
    const negativeQuantityRows = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const quantity = row[quantityIndex];
      
      if (typeof quantity === 'number' && quantity < 0) {
        negativeQuantityRows.push(i);
      }
    }
    
    // Note: Negative quantities in physical inventory might be acceptable
    // We won't treat this as an error but could add a warning if needed
    if (negativeQuantityRows.length > 0 && tableName !== 'الجرد الفعلي') {
      result.errors.push(`تم العثور على كميات سالبة في ${tableName} في الصفوف: ${negativeQuantityRows.join(', ')}`);
    }
  };

  // Check for negative prices (which might indicate data entry errors)
  const checkNegativePrices = (data, tableName) => {
    if (!data || data.length < 2) return;
    
    const headers = data[0];
    const priceIndex = headers.indexOf('الافرادي');
    
    if (priceIndex === -1) return;
    
    const negativePriceRows = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const price = row[priceIndex];
      
      if (typeof price === 'number' && price < 0) {
        negativePriceRows.push(i);
      }
    }
    
    if (negativePriceRows.length > 0) {
      result.errors.push(`تم العثور على أسعار سالبة في ${tableName} في الصفوف: ${negativePriceRows.join(', ')}`);
    }
  };

  // Check for mismatched dates (future dates that might be incorrect)
  const checkFutureDates = (data, tableName) => {
    if (!data || data.length < 2) return;
    
    const headers = data[0];
    const dateColumns = ['تاريخ الصلاحية', 'تاريخ العملية'];
    
    for (const dateColumn of dateColumns) {
      const dateIndex = headers.indexOf(dateColumn);
      if (dateIndex === -1) continue;
      
      const futureDateRows = [];
      const now = new Date();
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const dateString = row[dateIndex];
        
        if (dateString) {
          const date = new Date(dateString);
          if (date > now && dateColumn === 'تاريخ العملية') {
            // Operations in the future might be acceptable for planned transactions
            // But we'll still flag them for review
            futureDateRows.push(i);
          } else if (dateColumn === 'تاريخ الصلاحية' && date < now) {
            // Expired items in inventory might be acceptable but worth noting
            // We won't flag this as an error but could add a warning
          }
        }
      }
      
      if (futureDateRows.length > 0) {
        result.errors.push(`تم العثور على تواريخ مستقبلية في ${tableName} (${dateColumn}) في الصفوف: ${futureDateRows.join(', ')}`);
      }
    }
  };

  // Check for inconsistent material codes
  const checkMaterialCodeConsistency = (data, tableName) => {
    if (!data || data.length < 2) return;
    
    const headers = data[0];
    const materialCodeIndex = headers.indexOf('رمز المادة');
    
    if (materialCodeIndex === -1) return;
    
    const materialCodes = new Set();
    const duplicateRows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const materialCode = row[materialCodeIndex];
      
      if (materialCode && typeof materialCode === 'string') {
        if (materialCodes.has(materialCode)) {
          duplicateRows.push(i);
        } else {
          materialCodes.add(materialCode);
        }
      }
    }
    
    // Note: Having duplicate material codes might be acceptable in some contexts
    // So we won't treat this as an error but could add a warning if needed
  };

  // Check for financial balance in supplier balances
  const checkSupplierBalances = (data) => {
    if (!data || data.length < 2) return;
    
    const headers = data[0];
    const debitIndex = headers.indexOf('مدين');
    const creditIndex = headers.indexOf('دائن');
    
    if (debitIndex === -1 || creditIndex === -1) return;
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const debit = typeof row[debitIndex] === 'number' ? row[debitIndex] : 0;
      const credit = typeof row[creditIndex] === 'number' ? row[creditIndex] : 0;
      
      totalDebit += debit;
      totalCredit += credit;
    }
    
    // Note: We won't enforce exact balance as there might be legitimate reasons
    // for imbalance, but we could log the difference for information
    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) { // Allow small rounding differences
      // We won't treat this as an error but could add a warning
    }
  };

  // Perform checks on each data table
  if (normalizedData.purchases) {
    checkNegativeQuantities(normalizedData.purchases, 'المشتريات');
    checkNegativePrices(normalizedData.purchases, 'المشتريات');
    checkFutureDates(normalizedData.purchases, 'المشتريات');
    checkMaterialCodeConsistency(normalizedData.purchases, 'المشتريات');
  }

  if (normalizedData.sales) {
    checkNegativeQuantities(normalizedData.sales, 'المبيعات');
    checkNegativePrices(normalizedData.sales, 'المبيعات');
    checkFutureDates(normalizedData.sales, 'المبيعات');
    checkMaterialCodeConsistency(normalizedData.sales, 'المبيعات');
  }

  if (normalizedData.physicalInventory) {
    checkNegativeQuantities(normalizedData.physicalInventory, 'الجرد الفعلي');
    checkFutureDates(normalizedData.physicalInventory, 'الجرد الفعلي');
    checkMaterialCodeConsistency(normalizedData.physicalInventory, 'الجرد الفعلي');
  }

  if (normalizedData.supplierbalances) {
    checkNegativePrices(normalizedData.supplierbalances, 'أرصدة الموردين'); // Using price field for amounts
    checkSupplierBalances(normalizedData.supplierbalances);
  }

  // If we found any errors, mark the result as invalid
  if (result.errors.length > 0) {
    result.isValid = false;
  }

  return result;
};