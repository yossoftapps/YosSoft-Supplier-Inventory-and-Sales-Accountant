// دالة مساعدة للفرز حسب تاريخ الصلاحية من الأقرب إلى الأبعد
const sortByExpiryAsc = (data) => {
  return data.sort((a, b) => new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']));
};

// دالة مساعدة لحساب الأعمدة الإضافية في المخزون النهائي (نسخة مصححة وواضحة)
function calculateAdditionalFields(item, excessInventoryMap) {
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

    // 3. حساب بيان الحركة من تقرير فائض المخزون
    let movementStatus = 'غير محدد';
    if (excessInventoryMap && excessInventoryMap.has(item['رمز المادة'])) {
        movementStatus = excessInventoryMap.get(item['رمز المادة'])['بيان الفائض'] || 'غير محدد';
    }
    item['بيان الحركة'] = movementStatus;

    // 4. حساب الحالة
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

    // 5. حساب البيان النهائي (بناءً على الأولوية)
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
    
    // 6. حساب فائض المخزون لكل سجل في المخزون النهائي
    if (excessInventoryMap && excessInventoryMap.has(item['رمز المادة'])) {
        const excessItem = excessInventoryMap.get(item['رمز المادة']);
        const totalInventory = excessItem['الكمية'] || 0;
        const excess = excessItem['فائض المخزون'] || 0;
        
        // حساب نسبة ما يمثله كل سجل من المخزون
        if (totalInventory > 0) {
            const ratio = item['الكمية'] / totalInventory;
            item['فائض المخزون'] = excess * ratio;
        } else {
            item['فائض المخزون'] = 0;
        }
    } else {
        item['فائض المخزون'] = 0;
    }
}

// دالة مساعدة آمنة لتعديل الكميات
function safeModifyQuantity(record, fieldName, adjustment) {
    if (!record || typeof record[fieldName] !== 'number') {
        console.warn('Invalid record or field for quantity modification', record, fieldName);
        return false;
    }
    
    const oldValue = record[fieldName];
    const newValue = oldValue + adjustment;
    
    // التحقق من أن القيمة الجديدة غير سالبة (إذا كان ذلك مطلوبًا)
    if (newValue < 0) {
        console.warn(`Attempt to set negative quantity: ${fieldName} from ${oldValue} to ${newValue}`);
        return false;
    }
    
    record[fieldName] = newValue;
    console.log(`Modified ${fieldName}: ${oldValue} -> ${newValue} (adjustment: ${adjustment})`);
    return true;
}

// دالة لتقسيم السجل إلى سجلين عند الحاجة
function splitRecord(record, splitQuantity) {
    if (splitQuantity <= 0 || splitQuantity >= record['الكمية']) {
        console.warn('Invalid split quantity', splitQuantity, record['الكمية']);
        return null;
    }
    
    // السجل الأول بالكمية المقسمة
    const firstRecord = {
        ...record,
        الكمية: splitQuantity,
        'الاجمالي': record['الافرادي'] * splitQuantity,
    };
    
    // السجل الثاني بالكمية المتبقية
    const secondRecord = {
        ...record,
        الكمية: record['الكمية'] - splitQuantity,
        'الاجمالي': record['الافرادي'] * (record['الكمية'] - splitQuantity),
    };
    
    return { firstRecord, secondRecord };
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

  // 3. إنشاء خريطة من تقرير فائض المخزون للوصول السريع للبيانات
  const excessInventoryMap = new Map();
  if (excessInventoryData) {
      excessInventoryData.forEach(item => {
          excessInventoryMap.set(item['رمز المادة'], item);
      });
  }

  // 4. المرور على كل سجل في الجرد الفعلي ومطابقته
  for (const physicalRecord of physicalInventoryList) {
    let remainingPhysicalQty = physicalRecord['الكمية'];
    let physicalRecordRef = physicalRecord; // مرجع للسجل الأصلي
    
    // نستمر في البحث عن مطابقات حتى تستهلك كمية الجرد الفعلي بالكامل
    while (remainingPhysicalQty > 0) {
      const purchaseRecord = findMatchingPurchase(physicalRecordRef, sortedPurchases);

      if (!purchaseRecord) {
        // لم يتم العثور على أي مشتريات مطابقة للكمية المتبقية
        const finalRecord = {
          ...physicalRecordRef,
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

      // إذا كانت كمية الجرد الفعلي أكبر من كمية صافي المشتريات في أول سجل مطابق
      if (remainingPhysicalQty > availablePurchaseQty) {
          // ينقسم سجل الجرد الفعلي إلى سجلين
          const splitResult = splitRecord(physicalRecordRef, availablePurchaseQty);
          if (splitResult) {
              // السجل الأول مطابق لنفس كمية صافي المشتريات ويحمل جميع بيانات سجل صافي المشتريات
              const { firstRecord, secondRecord } = splitResult;
              
              // تحديث سجل المشتريات
              safeModifyQuantity(purchaseRecord, 'كمية الجرد', availablePurchaseQty);
              purchaseRecord['ملاحظات'] = 'مخزون فعلي';
              purchaseRecord['رقم السجل'] = firstRecord['م']; // رقم سجل الجرد الفعلي المطابق

              // إنشاء سجل في المخزون النهائي
              const endingRecord = {
                // بيانات من الجرد الفعلي
                م: firstRecord['م'],
                'رمز المادة': firstRecord['رمز المادة'],
                'اسم المادة': firstRecord['اسم المادة'],
                'الوحدة': firstRecord['الوحدة'],
                الكمية: availablePurchaseQty,
                'تاريخ الصلاحية': firstRecord['تاريخ الصلاحية'],
                القائمة: firstRecord['القائمة'],
                'رقم السجل': purchaseRecord['م'], // رقم سجل المشتريات المطابق
                
                // بيانات مضافة من المشتريات المطابقة
                المورد: purchaseRecord['المورد'],
                'تاريخ الشراء': purchaseRecord['تاريخ العملية'],
                الافرادي: purchaseRecord['الافرادي'],
                الاجمالي: purchaseRecord['الافرادي'] * availablePurchaseQty,
                'نوع العملية': purchaseRecord['نوع العملية'],
                ملاحظات: 'مطابق',
              };
              endingInventoryList.push(endingRecord);

              // تحديث الكمية المتبقية
              remainingPhysicalQty -= availablePurchaseQty;
              physicalRecordRef = secondRecord; // السجل الثاني بالكمية الزيادة يمر بنفس الخطوات
              continue;
          }
      }
      // إذا كانت كمية الجرد الفعلي أقل من كمية صافي المشتريات في أول سجل مطابق
      else if (remainingPhysicalQty < availablePurchaseQty) {
          // ينقسم سجل صافي المشتريات إلى سجلين
          const splitResult = splitRecord(purchaseRecord, remainingPhysicalQty);
          if (splitResult) {
              const { firstRecord, secondRecord } = splitResult;
              
              // تحديث السجل الأول
              firstRecord['كمية الجرد'] = remainingPhysicalQty;
              firstRecord['ملاحظات'] = 'مخزون فعلي';
              firstRecord['رقم السجل'] = physicalRecordRef['م']; // رقم سجل الجرد الفعلي المطابق

              // إنشاء سجل في المخزون النهائي
              const endingRecord = {
                // بيانات من الجرد الفعلي
                م: physicalRecordRef['م'],
                'رمز المادة': physicalRecordRef['رمز المادة'],
                'اسم المادة': physicalRecordRef['اسم المادة'],
                'الوحدة': physicalRecordRef['الوحدة'],
                الكمية: remainingPhysicalQty,
                'تاريخ الصلاحية': physicalRecordRef['تاريخ الصلاحية'],
                القائمة: physicalRecordRef['القائمة'],
                'رقم السجل': firstRecord['م'], // رقم سجل المشتريات المطابق
                
                // بيانات مضافة من المشتريات المطابقة
                المورد: firstRecord['المورد'],
                'تاريخ الشراء': firstRecord['تاريخ العملية'],
                الافرادي: firstRecord['الافرادي'],
                الاجمالي: firstRecord['الافرادي'] * remainingPhysicalQty,
                'نوع العملية': firstRecord['نوع العملية'],
                ملاحظات: 'مطابق',
              };
              endingInventoryList.push(endingRecord);

              // استبدال السجل الأصلي بالسجل الثاني في القائمة
              const index = sortedPurchases.indexOf(purchaseRecord);
              if (index !== -1) {
                  sortedPurchases[index] = secondRecord;
              }
              
              remainingPhysicalQty = 0;
              break;
          }
      }
      // إذا كانت كمية الجرد الفعلي تساوي تماما كمية صافي المشتريات
      else {
          // تحديث سجل المشتريات
          safeModifyQuantity(purchaseRecord, 'كمية الجرد', matchedQty);
          purchaseRecord['ملاحظات'] = 'مخزون فعلي';
          purchaseRecord['رقم السجل'] = physicalRecordRef['م']; // رقم سجل الجرد الفعلي المطابق

          // إنشاء سجل في المخزون النهائي
          const endingRecord = {
            // بيانات من الجرد الفعلي
            م: physicalRecordRef['م'],
            'رمز المادة': physicalRecordRef['رمز المادة'],
            'اسم المادة': physicalRecordRef['اسم المادة'],
            'الوحدة': physicalRecordRef['الوحدة'],
            الكمية: matchedQty,
            'تاريخ الصلاحية': physicalRecordRef['تاريخ الصلاحية'],
            القائمة: physicalRecordRef['القائمة'],
            'رقم السجل': purchaseRecord['م'], // رقم سجل المشتريات المطابق
            
            // بيانات مضافة من المشتريات المطابقة
            المورد: purchaseRecord['المورد'],
            'تاريخ الشراء': purchaseRecord['تاريخ العملية'],
            الافرادي: purchaseRecord['الافرادي'],
            الاجمالي: purchaseRecord['الافرادي'] * matchedQty,
            'نوع العملية': purchaseRecord['نوع العملية'],
            ملاحظات: 'مطابق',
          };
          endingInventoryList.push(endingRecord);

          remainingPhysicalQty = 0;
      }
    }
  }

  // 5. إضافة قائمة ب (مرتجع المشتريات اليتيمة) إلى التقرير النهائي
  const listB = netPurchasesData.orphanReturnsList.map(item => ({
    ...item,
    القائمة: 'B', // تحديد القائمة
    // إضافة أعمدة فارغة للمطابقة مع هيكل الجدول
    'تاريخ الشراء': item['تاريخ العملية'],
    'المورد': item['المورد'],
    'الافرادي': item['الافرادي'],
    'الاجمالي': item['الافرادي'] * item['الكمية'],
    'بيان الحركة': '',
    'رقم السجل': null,
  }));

  // 6. حساب الأعمدة الإضافية للقائمة النهائية
  endingInventoryList.forEach(item => calculateAdditionalFields(item, excessInventoryMap));
  listB.forEach(item => calculateAdditionalFields(item, excessInventoryMap));

  // 7. فرز القائمة النهائية حسب رمز المادة ثم تاريخ الصلاحية
  const finalList = [...endingInventoryList, ...listB];
  finalList.sort((a, b) => {
    if (a['رمز المادة'] !== b['رمز المادة']) {
      return a['رمز المادة'].localeCompare(b['رمز المادة']);
    }
    return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
  });

  // 8. تحديث الأرقام التسلسلية النهائية
  finalList.forEach((item, index) => {
    item['م'] = index + 1;
    // الحفاظ على رقم السجل كمرجع للمطابقة
    if (!item['رقم السجل']) {
        item['رقم السجل'] = (index + 1).toString();
    }
  });

  // 9. فصل القائمة النهائية مرة أخرى بعد الفرز والتحديث
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