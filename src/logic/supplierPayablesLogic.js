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
        فائض_مخزون: new Decimal(0),
        مخزون_مثالي: new Decimal(0),
        قيمة_احتياج: new Decimal(0),
        قيمة_معد_للاسترجاع: new Decimal(0),
        قيمة_اصناف_جديدة: new Decimal(0),
      });
    }
    const breakdown = inventoryBreakdownBySupplier.get(supplier);

    // تجميع القيم المحددة (Specific Values)
    breakdown.فائض_مخزون = add(breakdown.فائض_مخزون, item['قيمة فائض المخزون'] || 0);
    breakdown.قيمة_معد_للاسترجاع = add(breakdown.قيمة_معد_للاسترجاع, item['قيمة معد للارجاع'] || 0);
    breakdown.مخزون_مثالي = add(breakdown.مخزون_مثالي, item['قيمة مخزون مثالي'] || 0);
    breakdown.قيمة_اصناف_جديدة = add(breakdown.قيمة_اصناف_جديدة, item['قيمة صنف جديد'] || 0);
    breakdown.قيمة_احتياج = add(breakdown.قيمة_احتياج, item['قيمة الاحتياج'] || 0);

    // تجميع حسب بيان الحركة (للاعمدة: راكد تماما، مخزون زائد) - يعتمد على كامل قيمة الصنف
    switch (movementStatus) {
      case 'راكد تماما':
        breakdown.راكد_تماما = add(breakdown.راكد_تماما, totalValue);
        break;
      case 'مخزون زائد':
        // هذا "مخزون زائد" كحالة (تصنيف)، يختلف عن "فائض المخزون" كقيمة
        breakdown.مخزون_زائد = add(breakdown.مخزون_زائد, totalValue);
        break;
      // 'احتياج' هنا كحالة، لكن المستخدم طلب عمود 'الاحتياج' كقيمة. سنستخدم القيمة المحسوبة أعلاه.
      // لكن للاحتياط، اذا كان المقصود تصنيف الحالة:
      case 'احتياج':
        breakdown.احتياج = add(breakdown.احتياج, totalValue);
        break;
    }

    // تجميع حسب بيان الصلاحية
    switch (expiryStatus) {
      case 'منتهي':
        breakdown.منتهي = add(breakdown.منتهي, totalValue);
        break;
      case 'قريب جدا':
        breakdown.قريب_جدا = add(breakdown.قريب_جدا, totalValue);
        break;
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
      فائض_مخزون: new Decimal(0),
      مخزون_مثالي: new Decimal(0),
      قيمة_احتياج: new Decimal(0),
      قيمة_معد_للاسترجاع: new Decimal(0),
      قيمة_اصناف_جديدة: new Decimal(0),
    };

    payablesReport.push({
      ...balanceRecord,
      'م': payablesReport.length + 1,
      'رمز الحساب': balanceRecord['رمز الحساب'] || '',
      'المورد': supplier,
      'مدين': roundToInteger(debitRaw).toNumber(),
      'دائن': roundToInteger(creditRaw).toNumber(),
      'الحساب المساعد': balanceRecord['الحساب المساعد'] || '',
      'الرصيد': roundToInteger(balance).toNumber(),
      'قيمة المخزون': roundToInteger(inventoryValue).toNumber(),
      'الاستحقاق': roundToInteger(payable).toNumber(),
      'المبلغ المستحق': roundToInteger(amountDue).toNumber(),

      // الاعمدة الجديدة المطلوبة (القيم)
      'فائض المخزون': roundToInteger(breakdown.فائض_مخزون).toNumber(),
      'معد للارجاع': roundToInteger(breakdown.قيمة_معد_للاسترجاع).toNumber(),
      'مخزون مثالي': roundToInteger(breakdown.مخزون_مثالي).toNumber(),
      'اصناف جديدة': roundToInteger(breakdown.قيمة_اصناف_جديدة).toNumber(),
      'الاحتياج': roundToInteger(breakdown.قيمة_احتياج).toNumber(),

      // اعمدة الحالة (Complete Item Value based on Status)
      'منتهي': roundToInteger(breakdown.منتهي).toNumber(),
      'راكد تماما': roundToInteger(breakdown.راكد_تماما).toNumber(),
      'قريب جدا': roundToInteger(breakdown.قريب_جدا).toNumber(),
      'مخزون زائد': roundToInteger(breakdown.مخزون_زائد).toNumber(),
    });
  }

  const totalTime = performance.now() - startTime;
  console.log(`✅ [SupplierPayables] مكتمل:`);
  console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
  console.log(`   📊 ${payablesReport.length} مورد`);

  return payablesReport;
};