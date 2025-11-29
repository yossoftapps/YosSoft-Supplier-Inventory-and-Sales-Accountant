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

export const calculateSupplierPayables = (supplierBalancesRaw, endingInventoryList) => {
  console.log('--- بدء معالجة استحقاق الموردين ---');

  // 1. إعداد بيانات الأرصدة
  const supplierBalances = convertToObjects(supplierBalancesRaw);

  // 2. تجميع قيمة المخزون لكل مورد
  const inventoryValueBySupplier = new Map();
  const inventoryBreakdownBySupplier = new Map();

  for (const item of endingInventoryList) {
    const supplier = item['المورد'];
    const totalValue = parseInt(item['الاجمالي']) || 0;
    const movementStatus = item['بيان الحركة'];
    const expiryStatus = item['بيان الصلاحية'];
    const age = parseInt(item['عمر الصنف']) || 0;
    const status = item['الحالة'];

    if (!supplier) continue; // تجاهل العناصر بدون مورد

    // تجميع القيمة الإجمالية
    inventoryValueBySupplier.set(supplier, (inventoryValueBySupplier.get(supplier) || 0) + totalValue);

    // تجميع القيم حسب التصنيفات المختلفة
    if (!inventoryBreakdownBySupplier.has(supplier)) {
      inventoryBreakdownBySupplier.set(supplier, {
        راكد_تماما: 0,
        مخزون_زائد: 0,
        احتياج: 0,
        مناسب: 0,
        منتهي: 0,
        قريب_جدا: 0,
        معد_للاسترجاع: 0,
        اصناف_جديدة: 0,
      });
    }
    const breakdown = inventoryBreakdownBySupplier.get(supplier);
    
    // تصنيف حسب بيان الحركة
    switch (movementStatus) {
      case 'راكد تماما':
        breakdown.راكد_تماما += totalValue;
        break;
      case 'مخزون زائد':
        breakdown.مخزون_زائد += totalValue;
        break;
      case 'احتياج':
        breakdown.احتياج += totalValue;
        break;
      case 'مناسب':
        breakdown.مناسب += totalValue;
        break;
    }
    
    // تصنيف حسب بيان الصلاحية
    switch (expiryStatus) {
      case 'منتهي':
        breakdown.منتهي += totalValue;
        break;
      case 'قريب جدا':
        breakdown.قريب_جدا += totalValue;
        break;
    }
    
    // تصنيف حسب العمر
    if (age < 90) {
      breakdown.اصناف_جديدة += totalValue;
    }
    
    // تصنيف المعد للارجاع
    if (status === 'معد للارجاع') {
      breakdown.معد_للاسترجاع += totalValue;
    }
  }

  // 3. إنشاء التقرير النهائي
  const payablesReport = [];
  for (const balanceRecord of supplierBalances) {
    const supplier = balanceRecord['المورد'];
    const debit = parseInt(balanceRecord['المدين']) || 0;
    const credit = parseInt(balanceRecord['الدائن']) || 0;
    const balance = debit - credit;
    
    const inventoryValue = inventoryValueBySupplier.get(supplier) || 0;
    const payable = balance + inventoryValue;

    // 3-4-04-08 المبلغ المستحق (مبلغ مالي بتنسيق 00) صحيح بدون كسور ويتم حسابة كالتالي:-
    // 3-4-04-09 اذا كان الاستحقاق اكبر من او يساوي -999 يكون المبلغ المستحق صفر
    // 3-4-04-10 إذا كان الاستحقاق < -1000 ⇒ القيمة المطلقة للاستحقاق كقيمة صحيحة موجبة
    let amountDue = 0;
    if (payable < -1000) {
      amountDue = Math.abs(payable);
    }

    const breakdown = inventoryBreakdownBySupplier.get(supplier) || {};

    payablesReport.push({
      ...balanceRecord,
      'م': payablesReport.length + 1, // 3-4-03-01 م (رقم بتنسق عام)
      'الرصيد': balance, // 3-4-04-02 الرصيد (مبلغ مالي بتنسيق 00) صحيح بدون كسور (المدين - الدائن)
      'قيمة المخزون': inventoryValue, // 3-4-04-04 قيمة المخزون (مبلغ مالي بتنسيق 00) صحيح بدون كسور
      'الاستحقاق': payable, // 3-4-04-06 الاستحقاق (مبلغ مالي بتنسيق 00) صحيح بدون كسور (وهو حاصل جمع قيمة المخزون + الرصيد)
      'المبلغ المستحق': amountDue, // 3-4-04-08 المبلغ المستحق (مبلغ مالي بتنسيق 00) صحيح بدون كسور
      'راكد تماما': breakdown.راكد_تماما || 0, // 3-4-04-12 قيمة المخزون الراكد (مبلغ مالي بتنسيق 00)
      'مخزون زائد': breakdown.مخزون_زائد || 0, // 3-4-04-14 قيمة المخزون الزائد (مبلغ مالي بتنسيق 00)
      'الاحتياج': breakdown.احتياج || 0, // 3-4-04-16 قيمة الاحتياج (3 أشهر) (مبلغ مالي بتنسيق 00)
      'أصناف جديدة': breakdown.اصناف_جديدة || 0, // 3-4-04-18 قيمة المخزون الجديد (<90 يوم) (مبلغ مالي بتنسيق 00)
      'منتهي': breakdown.منتهي || 0, // 3-4-04-20 قيمة المخزون المنتهي (مبلغ مالي بتنسيق 00)
      'قريب جدا': breakdown.قريب_جدا || 0, // 3-4-04-22 قيمة المخزون القريب جدا (مبلغ مالي بتنسيق 00)
      'معد للارجاع': breakdown.معد_للاسترجاع || 0, // 3-4-04-24 قيمة المخزون المعد للارجاع (مبلغ مالي بتنسيق 00)
    });
  }

  console.log('--- انتهت معالجة استحقاق الموردين ---');
  console.log('تقرير استحقاق الموردين:', payablesReport);

  return payablesReport;
};