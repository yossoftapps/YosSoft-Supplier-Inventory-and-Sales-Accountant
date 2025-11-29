// دالة مساعدة للفرز حسب تاريخ الصلاحية من الأقرب إلى الأبعد
const sortByExpiryAsc = (data) => {
  return data.sort((a, b) => new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']));
};

// دالة مساعدة لحساب الأعمدة الإضافية في المخزون النهائي (نسخة مصححة وواضحة)
function calculateAdditionalFields(item) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. حساب عمر الصنف
    const purchaseDate = new Date(item['تاريخ الشراء']);
    const ageInDays = item['تاريخ الشراء'] ? Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24)) : 0;
    item['عمر الصنف'] = ageInDays;

    // 2. حساب بيان الصلاحية
    const expiryDate = new Date(item['تاريخ الصلاحية']);
    const daysToExpiry = expiryDate ? Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24)) : null;
    let validityStatus = 'غير معروف';
    if (daysToExpiry !== null) {
        if (daysToExpiry < 0) {
            validityStatus = 'منتهي';
        } else if (daysToExpiry <= 30) { // 31 يومًا
            validityStatus = 'منتهي';
        } else if (daysToExpiry <= 180) { // 181 يومًا
            validityStatus = 'قريب جدا';
        } else if (daysToExpiry <= 360) { // 361 يومًا
            validityStatus = 'قريب';
        } else {
            validityStatus = 'بعيد';
        }
    }
    item['بيان الصلاحية'] = validityStatus;

    // 3. حساب الحالة
    const movementStatus = item['بيان الحركة'] || 'غير محدد';
    let conditionStatus = 'جيد'; // القيمة الافتراضية

    // أولوية لبيان الصلاحية
    if (validityStatus === 'منتهي' || validityStatus === 'قريب جدا') {
        conditionStatus = 'معد للارجاع';
    } 
    // ثم النظر في بيان الحركة
    else if (movementStatus === 'راكد تماما') {
        conditionStatus = (ageInDays <= 90) ? 'صنف جديد' : 'معد للارجاع';
    } else if (movementStatus === 'مخزون زائد') {
        conditionStatus = (ageInDays <= 90) ? 'صنف جديد' : 'معد للارجاع';
    } else if (movementStatus === 'احتياج') {
        conditionStatus = (ageInDays <= 90) ? 'صنف جديد' : 'جيد';
    } else { // إذا كان مناسب أو غير محدد
        conditionStatus = (ageInDays <= 90) ? 'صنف جديد' : 'جيد';
    }
    item['الحالة'] = conditionStatus;

    // 4. حساب البيان النهائي (بناءً على الأولوية)
    let finalStatus = 'مناسب'; // القيمة الافتراضية

    if (validityStatus === 'منتهي') {
        finalStatus = 'منتهي';
    } else if (validityStatus === 'قريب جدا') {
        if (movementStatus === 'راكد تماما') finalStatus = 'قريب جدا راكد تماما';
        else if (movementStatus === 'مخزون زائد') finalStatus = 'قريب جدا مخزون زائد';
        else finalStatus = 'قريب جدا';
    } else if (validityStatus === 'قريب') {
        if (movementStatus === 'راكد تماما') finalStatus = 'قريب راكد تماما';
        else if (movementStatus === 'مخزون زائد') finalStatus = 'قريب مخزون زائد';
        else finalStatus = 'قريب';
    } else { // 'بعيد'
        if (movementStatus === 'راكد تماما') finalStatus = 'راكد تماما';
        else if (movementStatus === 'مخزون زائد') finalStatus = 'مخزون زائد';
        else if (movementStatus === 'احتياج') finalStatus = 'احتياج';
        else finalStatus = 'مناسب';
    }
    item['البيان'] = finalStatus;
}

export const calculateEndingInventory = (netPurchasesData, physicalInventoryData, excessInventoryData) => {
  console.log('--- بدء معالجة المخزون النهائي (المنطق المحدث) ---');

  // 1. إعداد البيانات المصدر (إنشاء نسخ للتعديل)
  let netPurchasesList = netPurchasesData.netPurchasesList.map(p => ({
    ...p,
    'كمية الجرد': 0,
    'ملاحظات': 'مخزون دفتري', // الافتراضي هو دفتري
    'رقم السجل': null,
  }));
  
  let physicalInventoryList = physicalInventoryData.listE.map(p => ({ ...p }));

  // 2. فرز المشتريات حسب الصلاحية لتسهيل المطابقة (الأقرب أولاً)
  const sortedPurchases = sortByExpiryAsc([...netPurchasesList]);
  const endingInventoryList = [];

  // 3. المرور على كل سجل في الجرد الفعلي ومطابقته
  for (const physicalRecord of physicalInventoryList) {
    let remainingPhysicalQty = physicalRecord['الكمية'];
    
    // نستمر في البحث عن مطابقات حتى تستهلك كمية الجرد الفعلي بالكامل
    while (remainingPhysicalQty > 0) {
      const purchaseRecord = findMatchingPurchase(physicalRecord, sortedPurchases);

      if (!purchaseRecord) {
        // لم يتم العثور على أي مشتريات مطابقة للكمية المتبقية
        const finalRecord = {
          ...physicalRecord,
          الكمية: remainingPhysicalQty,
          ملاحظات: 'لايوجد مشتريات',
          المورد: '', // لا يوجد مورد
          'تاريخ الشراء': '', // لا يوجد تاريخ شراء
          'الافرادي': 0,
          'الاجمالي': 0,
          'رقم السجل': null,
        };
        endingInventoryList.push(finalRecord);
        break; // ننتقل للسجل التالي في الجرد الفعلي
      }

      // تم العثور على سجل مشتريات مطابق
      const availablePurchaseQty = purchaseRecord['الكمية'] - purchaseRecord['كمية الجرد'];
      const matchedQty = Math.min(remainingPhysicalQty, availablePurchaseQty);

      // تحديث سجل المشتريات
      purchaseRecord['كمية الجرد'] += matchedQty;
      purchaseRecord['ملاحظات'] = 'مخزون فعلي';
      purchaseRecord['رقم السجل'] = physicalRecord['م'];

      // إنشاء سجل في المخزون النهائي
      const endingRecord = {
        // بيانات من الجرد الفعلي
        م: physicalRecord['م'],
        'رمز المادة': physicalRecord['رمز المادة'],
        'اسم المادة': physicalRecord['اسم المادة'],
        'الوحدة': physicalRecord['الوحدة'],
        الكمية: matchedQty,
        'تاريخ الصلاحية': physicalRecord['تاريخ الصلاحية'],
        القائمة: physicalRecord['القائمة'],
        'رقم السجل': physicalRecord['رقم السجل'],
        
        // بيانات مضافة من المشتريات المطابقة
        المورد: purchaseRecord['المورد'],
        'تاريخ الشراء': purchaseRecord['تاريخ العملية'],
        الافرادي: purchaseRecord['الافرادي'],
        الاجمالي: purchaseRecord['الافرادي'] * matchedQty,
        'نوع العملية': purchaseRecord['نوع العملية'],
        ملاحظات: 'مطابق',
      };
      endingInventoryList.push(endingRecord);

      remainingPhysicalQty -= matchedQty;
    }
  }

  // 4. إضافة قائمة ب (مرتجع المشتريات اليتيمة) إلى التقرير النهائي
  const listB = netPurchasesData.orphanReturnsList.map(item => ({
    ...item,
    القائمة: 'B', // تحديد القائمة
    // إضافة أعمدة فارغة للمطابقة مع هيكل الجدول
    'تاريخ الشراء': '',
    'المورد': '',
    'الاجمالي': 0,
    'بيان الحركة': '',
  }));

  // 5. حساب الأعمدة الإضافية للقائمة النهائية
  endingInventoryList.forEach(item => calculateAdditionalFields(item));
  listB.forEach(item => calculateAdditionalFields(item));

  // 6. فرز القائمة النهائية حسب رمز المادة ثم تاريخ الصلاحية
  const finalList = [...endingInventoryList, ...listB];
  finalList.sort((a, b) => {
    if (a['رمز المادة'] !== b['رمز المادة']) {
      return a['رمز المادة'].localeCompare(b['رمز المادة']);
    }
    return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
  });

  // 7. تحديث الأرقام التسلسلية النهائية
  finalList.forEach((item, index) => {
    item['م'] = index + 1;
    item['رقم السجل'] = (index + 1).toString();
  });

  // 8. فصل القائمة النهائية مرة أخرى بعد الفرز والتحديث
  const finalEndingInventoryList = finalList.filter(item => item['القائمة'] !== 'B');
  const finalListB = finalList.filter(item => item['القائمة'] === 'B');

  console.log('--- انتهت معالجة المخزون النهائي ---');
  console.log('قائمة المخزون النهائي:', finalEndingInventoryList);
  console.log('قائمة ب المضافة:', finalListB);
  console.log('قائمة المشتريات المحدثة:', netPurchasesList);

  // إرجاع القوائم النهائية
  return {
    endingInventoryList: finalEndingInventoryList,
    listB: finalListB,
    updatedNetPurchasesList: netPurchasesList,
  };
};

// دالة مساعدة للبحث عن أفضل سجل مشتريات مطابق
function findMatchingPurchase(physicalRecord, sortedPurchases) {
  // مفتاح مطابقة رقم 1: (رمز المادة، تاريخ الصلاحية)
  let match = sortedPurchases.find(p =>
    p['رمز المادة'] === physicalRecord['رمز المادة'] &&
    p['تاريخ الصلاحية'] === physicalRecord['تاريخ الصلاحية'] &&
    p['كمية الجرد'] < p['الكمية'] // بحث عن سجل لم يتم استهلاكه بالكامل
  );

  if (match) return match;

  // مفتاح مطابقة رقم 2: (رمز المادة)
  match = sortedPurchases.find(p =>
    p['رمز المادة'] === physicalRecord['رمز المادة'] &&
    p['كمية الجرد'] < p['الكمية']
  );

  return match; // يمكن أن يكون undefined إذا لم يتم العثور على مطابق
}