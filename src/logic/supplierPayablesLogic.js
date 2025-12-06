// ═══════════════════════════════════════════════════════════════════════════
// استحقاقات الموردين - محسّن للأداء
// Supplier Payables - Performance Optimized
// ═══════════════════════════════════════════════════════════════════════════

import {
  roundToInteger,
  add,
  subtract,
  compare,
  Decimal
} from '../utils/financialCalculations.js';

const convertToObjects = (data) => {
  if (!data || data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
};

export const calculateSupplierPayables = (supplierbalancesRaw, endingInventoryList) => {
  const startTime = performance.now();

  const supplierbalances = convertToObjects(supplierbalancesRaw);

  console.log(`🚀 [SupplierPayables] معالجة: ${supplierbalances.length} مورد، ${endingInventoryList.length} مخزون`);

  const inventoryValueBySupplier = new Map();
  const inventoryBreakdownBySupplier = new Map();

  for (const item of endingInventoryList) {
    const supplier = item['المورد'];
    const totalValue = roundToInteger(item['الاجمالي'] || 0) || new Decimal(0);
    const movementStatus = item['بيان الحركة'];
    const expiryStatus = item['بيان الصلاحية'];
    const age = roundToInteger(item['عمر الصنف'] || 0) || new Decimal(0);
    const status = item['الحالة'];

    if (!supplier) continue;

    const currentValue = inventoryValueBySupplier.get(supplier) || new Decimal(0);
    inventoryValueBySupplier.set(supplier, add(currentValue, totalValue));

    if (!inventoryBreakdownBySupplier.has(supplier)) {
      inventoryBreakdownBySupplier.set(supplier, {
        راكد_تماما: new Decimal(0),
        مخزون_زائد: new Decimal(0),
        احتياج: new Decimal(0),
        مناسب: new Decimal(0),
        منتهي: new Decimal(0),
        قريب_جدا: new Decimal(0),
        معد_للاسترجاع: new Decimal(0),
        اصناف_جديدة: new Decimal(0),
      });
    }
    const breakdown = inventoryBreakdownBySupplier.get(supplier);

    switch (movementStatus) {
      case 'راكد تماما':
        breakdown.راكد_تماما = add(breakdown.راكد_تماما, totalValue);
        break;
      case 'مخزون زائد':
        breakdown.مخزون_زائد = add(breakdown.مخزون_زائد, totalValue);
        break;
      case 'احتياج':
        breakdown.احتياج = add(breakdown.احتياج, totalValue);
        break;
      case 'مناسب':
        breakdown.مناسب = add(breakdown.مناسب, totalValue);
        break;
    }

    switch (expiryStatus) {
      case 'منتهي':
        breakdown.منتهي = add(breakdown.منتهي, totalValue);
        break;
      case 'قريب جدا':
        breakdown.قريب_جدا = add(breakdown.قريب_جدا, totalValue);
        break;
    }

    if (age < 90) {
      breakdown.اصناف_جديدة = add(breakdown.اصناف_جديدة, totalValue);
    }

    if (status === 'معد للارجاع') {
      breakdown.معد_للاسترجاع = add(breakdown.معد_للاسترجاع, totalValue);
    }
  }

  const payablesReport = [];
  for (const balanceRecord of supplierbalances) {
    const supplier = balanceRecord['المورد'];

    const debitRaw = (balanceRecord['مدين'] ?? balanceRecord['المدين']) || 0;
    const creditRaw = (balanceRecord['دائن'] ?? balanceRecord['الدائن']) || 0;

    const balance = subtract(debitRaw, creditRaw);

    const inventoryValue = inventoryValueBySupplier.get(supplier) || new Decimal(0);
    const payable = add(balance, inventoryValue);

    let amountDue = new Decimal(0);
    if (compare(payable, -999) < 0) {
      amountDue = subtract(new Decimal(0), payable);
    }

    const breakdown = inventoryBreakdownBySupplier.get(supplier) || {
      راكد_تماما: new Decimal(0),
      مخزون_زائد: new Decimal(0),
      احتياج: new Decimal(0),
      مناسب: new Decimal(0),
      منتهي: new Decimal(0),
      قريب_جدا: new Decimal(0),
      معد_للاسترجاع: new Decimal(0),
      اصناف_جديدة: new Decimal(0),
    };

    payablesReport.push({
      ...balanceRecord,
      'م': payablesReport.length + 1,
      'الرصيد': roundToInteger(balance).toNumber(),
      'قيمة المخزون': roundToInteger(inventoryValue).toNumber(),
      'الاستحقاق': roundToInteger(payable).toNumber(),
      'المبلغ المستحق': roundToInteger(amountDue).toNumber(),
      'راكد تماما': roundToInteger(breakdown.راكد_تماما).toNumber(),
      'مخزون زائد': roundToInteger(breakdown.مخزون_زائد).toNumber(),
      'الاحتياج': roundToInteger(breakdown.احتياج).toNumber(),
      'اصناف جديدة': roundToInteger(breakdown.اصناف_جديدة).toNumber(),
      'منتهي': roundToInteger(breakdown.منتهي).toNumber(),
      'قريب جدا': roundToInteger(breakdown.قريب_جدا).toNumber(),
      'معد للارجاع': roundToInteger(breakdown.معد_للاسترجاع).toNumber(),
    });
  }

  const totalTime = performance.now() - startTime;
  console.log(`✅ [SupplierPayables] مكتمل:`);
  console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
  console.log(`   📊 ${payablesReport.length} مورد`);

  return payablesReport;
};