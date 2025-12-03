// دالة مساعدة لتحويل مصفوفة المصفوفات إلى مصفوفة كائنات
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

// استيراد ادوات الحسابات المالية الدقة
import { 
  roundToInteger, 
  add,
  subtract,
  compare,
  Decimal
} from '../utils/financialCalculations.js';

export const calculateSupplierPayables = (supplierbalancesRaw, endingInventoryList) => {
  console.log('--- بدء معالجة استحقاق الموردين ---');

  // 1. إعداد بيانات الارصدة
  const supplierbalances= convertToObjects(supplierbalancesRaw);

  // 2. تجميع قيمة المخزون لكل مورد
  const inventoryValueBySupplier = new Map();
  const inventoryBreakdownBySupplier = new Map();

  for (const item of endingInventoryList) {
    const supplier = item['المورد'];
    const totalValue = roundToInteger(item['الاجمالي'] || 0) || new Decimal(0);
    const movementStatus = item['بيان الحركة'];
    const expiryStatus = item['بيان الصلاحية'];
    const age = roundToInteger(item['عمر الصنف'] || 0) || new Decimal(0);
    const status = item['الحالة'];

    if (!supplier) continue; // تجاهل العناصر بدون مورد

    // تجميع القيمة الإجمالية باستخدام الحسابات المالية الدقة
    const currentValue = inventoryValueBySupplier.get(supplier) || new Decimal(0);
    inventoryValueBySupplier.set(supplier, add(currentValue, totalValue));

    // تجميع القيم حسب التصنيفات المختلفة
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
    
    // تصنيف حسب بيان الحركة
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
    
    // تصنيف حسب بيان الصلاحية
    switch (expiryStatus) {
      case 'منتهي':
        breakdown.منتهي = add(breakdown.منتهي, totalValue);
        break;
      case 'قريب جدا':
        breakdown.قريب_جدا = add(breakdown.قريب_جدا, totalValue);
        break;
    }
    
    // تصنيف حسب العمر
    if (age < 90) {
      breakdown.اصناف_جديدة = add(breakdown.اصناف_جديدة, totalValue);
    }
    
    // تصنيف المعد للارجاع
    if (status === 'معد للارجاع') {
      breakdown.معد_للاسترجاع = add(breakdown.معد_للاسترجاع, totalValue);
    }
  }

  // 3. إنشاء التقرير النهائي
  const payablesReport = [];
  for (const balanceRecord of supplierbalances) {
    const supplier = balanceRecord['المورد'];
    const debit = roundToInteger(balanceRecord['المدين'] || 0) || new Decimal(0);
    const credit = roundToInteger(balanceRecord['الدائن'] || 0) || new Decimal(0);
    const balance = subtract(debit, credit);
    
    const inventoryValue = inventoryValueBySupplier.get(supplier) || new Decimal(0);
    const payable = add(balance, inventoryValue);

    // 3-4-04-08 المبلغ المستحق (مبلغ مالي بتنسيق 00) صحيح بدون كسور ويتم حسابة كالتالي:-
    // 3-4-04-09 اذا كان الاستحقاق اكبر من او يساوي -999 يكون المبلغ المستحق صفر
    // 3-4-04-10 إذا كان الاستحقاق < -1000 ⇒ القيمة المطلقة للاستحقاق كقيمة صحيحة موجبة
    let amountDue = new Decimal(0);
    if (compare(payable, -1000) < 0) {
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
      'م': payablesReport.length + 1, // 3-4-03-01 م (رقم بتنسق عام)
      'الرصيد': roundToInteger(balance).toNumber(), // 3-4-04-02 الرصيد (مبلغ مالي بتنسيق 00) صحيح بدون كسور (المدين - الدائن)
      'قيمة المخزون': roundToInteger(inventoryValue).toNumber(), // 3-4-04-04 قيمة المخزون (مبلغ مالي بتنسيق 00) صحيح بدون كسور
      'الاستحقاق': roundToInteger(payable).toNumber(), // 3-4-04-06 الاستحقاق (مبلغ مالي بتنسيق 00) صحيح بدون كسور (وهو حاصل جمع قيمة المخزون + الرصيد)
      'المبلغ المستحق': roundToInteger(amountDue).toNumber(), // 3-4-04-08 المبلغ المستحق (مبلغ مالي بتنسيق 00) صحيح بدون كسور
      'راكد تماما': roundToInteger(breakdown.راكد_تماما).toNumber(), // 3-4-04-12 قيمة المخزون الراكد (مبلغ مالي بتنسيق 00)
      'مخزون زائد': roundToInteger(breakdown.مخزون_زائد).toNumber(), // 3-4-04-14 قيمة المخزون الزائد (مبلغ مالي بتنسيق 00)
      'الاحتياج': roundToInteger(breakdown.احتياج).toNumber(), // 3-4-04-16 قيمة الاحتياج (3 اشهر) (مبلغ مالي بتنسيق 00)
      'اصناف جديدة': roundToInteger(breakdown.اصناف_جديدة).toNumber(), // 3-4-04-18 قيمة المخزون الجديد (<90 يوم) (مبلغ مالي بتنسيق 00)
      'منتهي': roundToInteger(breakdown.منتهي).toNumber(), // 3-4-04-20 قيمة المخزون المنتهي (مبلغ مالي بتنسيق 00)
      'قريب جدا': roundToInteger(breakdown.قريب_جدا).toNumber(), // 3-4-04-22 قيمة المخزون القريب جدا (مبلغ مالي بتنسيق 00)
      'معد للارجاع': roundToInteger(breakdown.معد_للاسترجاع).toNumber(), // 3-4-04-24 قيمة المخزون المعد للارجاع (مبلغ مالي بتنسيق 00)
    });
  }

  console.log('--- انتهت معالجة استحقاق الموردين ---');
  console.log('تقرير استحقاق الموردين:', payablesReport);

  return payablesReport;
};