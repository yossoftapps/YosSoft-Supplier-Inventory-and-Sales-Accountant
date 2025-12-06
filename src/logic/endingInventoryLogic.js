// استيراد ادوات الحسابات المالية الدقة
import {
  roundToInteger,
  roundToDecimalPlaces,
  formatMoney,
  formatQuantity,
  multiply,
  subtract,
  add,
  compare,
  divide,
  Decimal
} from '../utils/financialCalculations.js';
// Note: `divide` is available in financialCalculations.js; import when needed

// دالة مساعدة للفرز حسب تاريخ الصلاحية من الاقرب إلى الابعد
const sortByExpiryAsc = (data) => {
  return data.sort((a, b) => new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']));
};

// دالة مساعدة لحساب الاعمدة الإضافية في المخزون النهائي (نسخة مصححة وواضحة)
function calculateAdditionalFields(item, excessInventoryMap) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. حساب عمر الصنف
  const purchaseDate = new Date(item['تاريخ الشراء']);
  const ageInDays = item['تاريخ الشراء'] ? Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24)) : 0;
  item['عمر الصنف'] = roundToInteger(ageInDays);

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

  // اولوية لبيان الصلاحية
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
  } else { // إذا كان مناسب او غير محدد
    conditionStatus = (ageInDays <= 90) ? 'صنف جديد' : 'جيد';
  }
  item['الحالة'] = conditionStatus;

  // 5. حساب البيان النهائي (بناءً على الاولوية)
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
    const totalInventory = roundToDecimalPlaces(excessItem['الكمية'] || 0, 2);
    const excess = roundToDecimalPlaces(excessItem['فائض المخزون'] || 0, 2);

    // حساب نسبة ما يمثله كل سجل من المخزون
    if (compare(totalInventory, 0) > 0) {
      const ratio = divide(excess, totalInventory);
      item['فائض المخزون'] = multiply(excess, ratio);
    } else {
      item['فائض المخزون'] = new Decimal(0);
    }
  } else {
    item['فائض المخزون'] = new Decimal(0);
  }
}

// دالة مساعدة آمنة لتعديل الكميات
function safeModifyQuantity(record, fieldName, adjustment) {
  if (!record || typeof record[fieldName] === 'undefined') {
    console.warn('Invalid record or field for quantity modification', record, fieldName);
    return false;
  }

  const oldValue = record[fieldName];
  const newValue = add(oldValue, adjustment);

  // التحقق من ان القيمة الجديدة غير سالبة (إذا كان ذلك مطلوبًا)
  if (compare(newValue, 0) < 0) {
    console.warn(`Attempt to set negative quantity: ${fieldName} from ${oldValue} to ${newValue}`);
    return false;
  }

  record[fieldName] = newValue;
  return true;
}

// دالة لتقسيم السجل إلى سجلين عند الحاجة
function splitRecord(record, splitQuantity) {
  if (compare(splitQuantity, 0) <= 0 || compare(splitQuantity, record['الكمية']) >= 0) {
    console.warn('Invalid split quantity', splitQuantity, record['الكمية']);
    return null;
  }

  // السجل الاول بالكمية المقسمة
  const firstRecord = {
    ...record,
    الكمية: splitQuantity,
    'الاجمالي': multiply(roundToInteger(record['الافرادي'] || 0), splitQuantity),
  };

  // السجل الثاني بالكمية المتبقية
  const secondRecord = {
    ...record,
    الكمية: subtract(record['الكمية'], splitQuantity),
    'الاجمالي': multiply(roundToInteger(record['الافرادي'] || 0), subtract(record['الكمية'], splitQuantity)),
  };

  return { firstRecord, secondRecord };
}

export const calculateEndingInventory = (netPurchasesData, physicalInventoryData, excessInventoryData) => {
  const startTime = performance.now();
  const physicalCount = physicalInventoryData?.listE?.length || 0;
  console.log(`🚀 [EndingInventory] معالجة: ${physicalCount} سجل جرد فعلي`);

  // 1. إعداد البيانات المصدر (إنشاء نسخ للتعديل)
  let netPurchasesList = netPurchasesData.netPurchasesList.map(p => ({
    ...p,
    'كمية الجرد': new Decimal(0),
    'ملاحظات': 'مخزون دفتري', // الافتراضي هو دفتري
    'رقم السجل': null,
  }));

  let physicalInventoryList = physicalInventoryData.listE.map(p => ({ ...p }));

  const endingInventoryList = [];

  // 2. الفهرسة: تجميع المشتريات حسب رمز المادة
  // Optimization: Index purchases by Material Code to avoid O(NxM) search
  const purchasesByItem = new Map();
  netPurchasesList.forEach(p => {
    const code = p['رمز المادة'];
    if (!purchasesByItem.has(code)) {
      purchasesByItem.set(code, []);
    }
    purchasesByItem.get(code).push(p);
  });

  // فرز كل مجموعة حسب تاريخ الصلاحية (الأقرب فالأبعد)
  purchasesByItem.forEach(group => {
    sortByExpiryAsc(group);
  });


  // 3. إنشاء خريطة من تقرير فائض المخزون للوصول السريع للبيانات
  const excessInventoryMap = new Map();
  if (excessInventoryData) {
    excessInventoryData.forEach(item => {
      excessInventoryMap.set(item['رمز المادة'], item);
    });
  }

  // 4. المرور على كل سجل في الجرد الفعلي ومطابقته
  const progressInterval = Math.max(1, Math.floor(physicalInventoryList.length * 0.1));

  for (let idx = 0; idx < physicalInventoryList.length; idx++) {
    const physicalRecord = physicalInventoryList[idx];
    let remainingPhysicalQty = roundToDecimalPlaces(physicalRecord['الكمية'], 2);
    let physicalRecordRef = physicalRecord; // مرجع للسجل الاصلي

    // نستمر في البحث عن مطابقات حتى تستهلك كمية الجرد الفعلي بالكامل
    while (compare(remainingPhysicalQty, 0) > 0) {

      // OPTIMIZED FIND: Use Indexed Map
      const candidates = purchasesByItem.get(physicalRecordRef['رمز المادة']) || [];

      // Strategy 1: Material + Expiry + Available
      let purchaseRecord = candidates.find(p =>
        p['تاريخ الصلاحية'] === physicalRecordRef['تاريخ الصلاحية'] &&
        compare(p['كمية الجرد'], p['الكمية']) < 0
      );

      // Strategy 2: Material + Available (FIFO/Expiry sorted)
      if (!purchaseRecord) {
        purchaseRecord = candidates.find(p =>
          compare(p['كمية الجرد'], p['الكمية']) < 0
        );
      }

      if (!purchaseRecord) {
        // لم يتم العثور على اي مشتريات مطابقة للكمية المتبقية
        const finalRecord = {
          ...physicalRecordRef,
          الكمية: remainingPhysicalQty,
          ملاحظات: 'لايوجد مشتريات',
          المورد: '', // لا يوجد مورد
          'تاريخ الشراء': '', // لا يوجد تاريخ شراء
          'الافرادي': new Decimal(0),
          'الاجمالي': new Decimal(0),
          'رقم السجل': null,
        };
        endingInventoryList.push(finalRecord);
        break; // ننتقل للسجل التالي في الجرد الفعلي
      }

      // تم العثور على سجل مشتريات مطابق
      const availablePurchaseQty = subtract(purchaseRecord['الكمية'], purchaseRecord['كمية الجرد']);
      const matchedQty = compare(remainingPhysicalQty, availablePurchaseQty) < 0
        ? remainingPhysicalQty
        : availablePurchaseQty;

      // إذا كانت كمية الجرد الفعلي اكبر من كمية صافي المشتريات في اول سجل مطابق
      if (compare(remainingPhysicalQty, availablePurchaseQty) > 0) {
        // ينقسم سجل الجرد الفعلي إلى سجلين
        const splitResult = splitRecord(physicalRecordRef, availablePurchaseQty);
        if (splitResult) {
          // السجل الاول مطابق لنفس كمية صافي المشتريات ويحمل جميع بيانات سجل صافي المشتريات
          const { firstRecord, secondRecord } = splitResult;

          // تحديث سجل المشتريات
          safeModifyQuantity(purchaseRecord, 'كمية الجرد', availablePurchaseQty);
          purchaseRecord['ملاحظات'] = 'مخزون فعلي';
          purchaseRecord['رقم السجل'] = firstRecord['م']; // رقم سجل الجرد الفعلي المطابق

          // إنشاء سجل في المخزون النهائي
          const endingRecord = {
            // ... نفس الحقول السابقة ...
            // بيانات من الجرد الفعلي
            م: firstRecord['م'],
            'رمز المادة': firstRecord['رمز المادة'],
            'اسم المادة': firstRecord['اسم المادة'],
            'الوحدة': firstRecord['الوحدة'],
            الكمية: availablePurchaseQty,
            'تاريخ الصلاحية': firstRecord['تاريخ الصلاحية'],
            القائمة: firstRecord['القائمة'],
            'رقم السجل': purchaseRecord['م'],

            // بيانات مضافة
            المورد: purchaseRecord['المورد'],
            'تاريخ الشراء': purchaseRecord['تاريخ العملية'],
            الافرادي: roundToInteger(purchaseRecord['الافرادي']),
            الاجمالي: multiply(roundToInteger(purchaseRecord['الافرادي']), availablePurchaseQty),
            'نوع العملية': purchaseRecord['نوع العملية'],
            ملاحظات: 'مطابق',
          };
          endingInventoryList.push(endingRecord);

          // تحديث الكمية المتبقية
          remainingPhysicalQty = subtract(remainingPhysicalQty, availablePurchaseQty);
          physicalRecordRef = secondRecord; // السجل الثاني بالكمية الزيادة يمر بنفس الخطوات
          continue;
        }
      }
      // إذا كانت كمية الجرد الفعلي اقل من كمية صافي المشتريات في اول سجل مطابق
      else if (compare(remainingPhysicalQty, availablePurchaseQty) < 0) {
        // ينقسم سجل صافي المشتريات إلى سجلين
        const splitResult = splitRecord(purchaseRecord, remainingPhysicalQty);
        if (splitResult) {
          const { firstRecord, secondRecord } = splitResult;

          // تحديث السجل الاول
          firstRecord['كمية الجرد'] = remainingPhysicalQty;
          firstRecord['ملاحظات'] = 'مخزون فعلي';
          firstRecord['رقم السجل'] = physicalRecordRef['م']; // رقم سجل الجرد الفعلي المطابق

          // إنشاء سجل في المخزون النهائي
          const endingRecord = {
            // ... بيانات الجرد ...
            م: physicalRecordRef['م'],
            'رمز المادة': physicalRecordRef['رمز المادة'],
            'اسم المادة': physicalRecordRef['اسم المادة'],
            'الوحدة': physicalRecordRef['الوحدة'],
            الكمية: remainingPhysicalQty,
            'تاريخ الصلاحية': physicalRecordRef['تاريخ الصلاحية'],
            القائمة: physicalRecordRef['القائمة'],
            'رقم السجل': firstRecord['م'],

            // بيانات المشتريات
            المورد: firstRecord['المورد'],
            'تاريخ الشراء': firstRecord['تاريخ العملية'],
            الافرادي: roundToInteger(firstRecord['الافرادي']),
            الاجمالي: multiply(roundToInteger(firstRecord['الافرادي']), remainingPhysicalQty),
            'نوع العملية': firstRecord['نوع العملية'],
            ملاحظات: 'مطابق',
          };
          endingInventoryList.push(endingRecord);

          // استبدال السجل الاصلي بالسجل الثاني في القائمة (UPDATE INDEX)
          // We need to find the index of purchaseRecord in 'candidates' array
          const candidateIndex = candidates.indexOf(purchaseRecord);
          if (candidateIndex !== -1) {
            candidates[candidateIndex] = secondRecord;
          } else {
            // Should not happen
            console.warn("Optimized Logic: Could not find record to split in index");
          }

          remainingPhysicalQty = new Decimal(0);
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
          м: physicalRecordRef['م'], // typo fix: м -> م
          'م': physicalRecordRef['م'],
          'رمز المادة': physicalRecordRef['رمز المادة'],
          'اسم المادة': physicalRecordRef['اسم المادة'],
          'الوحدة': physicalRecordRef['الوحدة'],
          الكمية: matchedQty,
          'تاريخ الصلاحية': physicalRecordRef['تاريخ الصلاحية'],
          القائمة: physicalRecordRef['القائمة'],
          'رقم السجل': purchaseRecord['م'],

          // بيانات مضافة
          المورد: purchaseRecord['المورد'],
          'تاريخ الشراء': purchaseRecord['تاريخ العملية'],
          الافرادي: roundToInteger(purchaseRecord['الافرادي']),
          الاجمالي: multiply(roundToInteger(purchaseRecord['الافرادي']), matchedQty),
          'نوع العملية': purchaseRecord['نوع العملية'],
          ملاحظات: 'مطابق',
        };
        endingInventoryList.push(endingRecord);

        remainingPhysicalQty = new Decimal(0);
      }
    }


    // تقرير تقدم كل 10% من السجلات
    if ((idx + 1) % progressInterval === 0 || idx === physicalInventoryList.length - 1) {
      const percentage = ((idx + 1) / physicalInventoryList.length * 100).toFixed(0);
      console.log(`⏳ [EndingInventory] ${idx + 1}/${physicalInventoryList.length} (${percentage}%)`);
    }
  }

  // 5. إضافة قائمة ب (مرتجع المشتريات اليتيمة) إلى التقرير النهائي
  const listB = netPurchasesData.orphanReturnsList.map(item => ({
    ...item,
    القائمة: 'B', // تحديد القائمة
    // إضافة اعمدة فارغة للمطابقة مع هيكل الجدول
    'تاريخ الشراء': item['تاريخ العملية'],
    'المورد': item['المورد'],
    'الافرادي': roundToInteger(item['الافرادي']),
    'الاجمالي': multiply(roundToInteger(item['الافرادي']), roundToDecimalPlaces(item['الكمية'], 2)),
    'بيان الحركة': '',
    'رقم السجل': null,
  }));

  // 6. حساب الاعمدة الإضافية للقائمة النهائية
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

  // 8. تحديث الارقام التسلسلية النهائية
  finalList.forEach((item, index) => {
    item['م'] = index + 1;
    // الحفاظ على رقم السجل كمرجع للمطابقة
    if (!item['رقم السجل']) {
      item['رقم السجل'] = (index + 1).toString();
    }
  });

  // 9. فصل القائمة النهائية مرة اخرى بعد الفرز والتحديث
  const finalEndingInventoryList = finalList.filter(item => item['القائمة'] !== 'B');
  const finalListB = finalList.filter(item => item['القائمة'] === 'B');

  // Reconstruction of active purchases list from the Map (handling splits)
  // This replaces the stale 'netPurchasesList' with the actual state after matching
  const updatedNetPurchasesList = Array.from(purchasesByItem.values()).flat();

  const totalTime = performance.now() - startTime;
  console.log(`✅ [EndingInventory] مكتمل:`);
  console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
  console.log(`   📊 ${finalEndingInventoryList.length} مخزون نهائي | ${finalListB.length} قائمة B`);

  // إرجاع القوائم النهائية
  return {
    endingInventoryList: finalEndingInventoryList,
    listB: finalListB,
    updatedNetPurchasesList: updatedNetPurchasesList,
  };
};