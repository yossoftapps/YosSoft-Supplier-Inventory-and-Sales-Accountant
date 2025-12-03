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
  Decimal
} from '../utils/financialCalculations.js';

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

// دالة مساعدة للفرز حسب التاريخ
const sortByDate = (data, dateKey, direction = 'asc') => {
    return data.sort((a, b) => {
        const dateA = new Date(a[dateKey]);
        const dateB = new Date(b[dateKey]);
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
};

export const processPhysicalInventory = (physicalInventoryRaw) => {
    console.log('--- بدء معالجة الجرد الفعلي ---');

    // 1. التحويل والإعداد الاولي
    let inventory = convertToObjects(physicalInventoryRaw);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // تجاهل الوقت في المقارنة

    // 2. المرحلة الاولى: إضافة الاعمدة المؤقتة (م، ملاحظات)
    inventory = inventory.map((item, index) => {
        const quantity = roundToDecimalPlaces(item['الكمية'] || 0, 2);
        const expiryDate = new Date(item['تاريخ الصلاحية']);
        expiryDate.setHours(0, 0, 0, 0);

        let notes = '';
        if (compare(quantity, 0) < 0) {
            notes = 'سالب';
        } else if (expiryDate <= today) {
            notes = 'منتهي';
        } else {
            notes = 'موجب';
        }

        return {
            ...item,
            م: index + 1,
            الكمية: quantity,
            ملاحظات: notes,
        };
    });

    // 3. المرحلة الثانية: تحديد السجلات التي تحتاج معالجة
    const codesToProcess = new Set();
    inventory.forEach(item => {
        if (item['ملاحظات'] === 'سالب' || item['ملاحظات'] === 'منتهي') {
            codesToProcess.add(item['رمز المادة']);
        }
    });

    // تحديث ملاحظات السجلات الموجبة التي لها رموز مادة في قائمة المعالجة
    inventory = inventory.map(item => {
        if (item['ملاحظات'] === 'موجب' && codesToProcess.has(item['رمز المادة'])) {
            return { ...item, ملاحظات: 'معالجة' };
        }
        return item;
    });

    // 4. المرحلة الثالثة: الفرز المخصص للمعالجة
    const sortedForProcessing = [...inventory].sort((a, b) => {
        // السجلات الموجبة في النهاية
        if (a['ملاحظات'] === 'موجب' && b['ملاحظات'] !== 'موجب') return 1;
        if (b['ملاحظات'] === 'موجب' && a['ملاحظات'] !== 'موجب') return -1;

        // باقي السجلات ترتب حسب الرمز ثم الملاحظات ثم الصلاحية
        if (a['رمز المادة'] !== b['رمز المادة']) return a['رمز المادة'].localeCompare(b['رمز المادة']);
        if (a['ملاحظات'] !== b['ملاحظات']) return a['ملاحظات'].localeCompare(b['ملاحظات']);
        return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
    });

    // 5. المرحلة الرابعة: المعالجة والتصفية (بناء قائمة جديدة)
    const processedInventory = [];
    const itemMap = new Map(); // لتجميع السجلات حسب رمز المادة

    // تجميع السجلات حسب رمز المادة لتسهيل الوصول إليها
    for (const item of sortedForProcessing) {
        if (!itemMap.has(item['رمز المادة'])) {
            itemMap.set(item['رمز المادة'], []);
        }
        itemMap.get(item['رمز المادة']).push(item);
    }

    // معالجة كل مجموعة من السجلات بنفس رمز المادة
    // تنفيذ المطابقة والتصفية:-
    // الانتقال الى اول سجل وتتم المعالجة حسب ملاحظات
    for (const [code, items] of itemMap.entries()) {
        const negativeItems = items.filter(i => i['ملاحظات'] === 'سالب');
        const expiredItems = items.filter(i => i['ملاحظات'] === 'منتهي');
        // ترتيب السجلات الموجبة حسب تاريخ الصلاحية من الاقرب إلى الابعد
        const positiveItems = items.filter(i => i['ملاحظات'] === 'موجب' || i['ملاحظات'] === 'معالجة').sort((a, b) => new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']));

        // اذا كان ملاحظات (سالب) ورمز المادة فريد غير مكرر يتم الانتقال للسجل التالي
        if (negativeItems.length === 1 && items.length === 1) {
            processedInventory.push(negativeItems[0]);
            continue;
        }

        // اذا كان ملاحظات (سالب) ورمز المادة مكرر:
        if (negativeItems.length > 0) {
            for (const negItem of negativeItems) {
                let remainingNegQty = subtract(new Decimal(0), negItem['الكمية']); // القيمة المطلقة
                let fullyMatched = false;
                
                // البحث عن سجلات موجبة مطابقة تمامًا
                for (const posItem of positiveItems) {
                    if (compare(posItem['الكمية'], remainingNegQty) === 0) {
                        // كميات مطابقة تمامًا - حذف السجلات
                        posItem['الكمية'] = new Decimal(0);
                        remainingNegQty = new Decimal(0);
                        fullyMatched = true;
                        break;
                    }
                }
                
                // إذا لم تطابق تمامًا، استنزال من السجل ذو الصلاحية الابعد
                if (!fullyMatched && compare(remainingNegQty, 0) > 0) {
                    // ترتيب السجلات الموجبة من الابعد صلاحية إلى الاقرب
                    const sortedPositiveItems = [...positiveItems].sort((a, b) => new Date(b['تاريخ الصلاحية']) - new Date(a['تاريخ الصلاحية']));
                    
                    for (const posItem of sortedPositiveItems) {
                        if (compare(remainingNegQty, 0) <= 0) break;
                        if (compare(posItem['الكمية'], remainingNegQty) >= 0) {
                            posItem['الكمية'] = subtract(posItem['الكمية'], remainingNegQty);
                            remainingNegQty = new Decimal(0);
                        } else {
                            remainingNegQty = subtract(remainingNegQty, posItem['الكمية']);
                            posItem['الكمية'] = new Decimal(0);
                        }
                    }
                }
                
                // إذا بقيت كمية سالبة، اضف السجل السالب للقائمة النهائية
                if (compare(remainingNegQty, 0) > 0) {
                    negItem['الكمية'] = subtract(new Decimal(0), remainingNegQty);
                    processedInventory.push(negItem);
                }
            }
        }

        // اذا كان ملاحظات (منتهي) ورمز المادة فريد غير مكرر يتم الانتقال للسجل التالي
        if (expiredItems.length === 1 && items.length === 1) {
            processedInventory.push(expiredItems[0]);
            continue;
        }

        // اذا كان ملاحظات (منتهي) ورمز المادة مكرر:
        if (expiredItems.length > 0) {
            for (const expItem of expiredItems) {
                // البحث عن سجل معالجة او موجب باقرب صلاحية
                const targetPosItem = positiveItems.find(p => compare(p['الكمية'], 0) > 0);
                if (targetPosItem) {
                    targetPosItem['الكمية'] = add(targetPosItem['الكمية'], roundToDecimalPlaces(Math.abs(expItem['الكمية']), 2)); // إضافة الكمية المنتهية
                    // تعديل ملاحظات للاصناف = معالجة الى موجب
                    targetPosItem['ملاحظات'] = 'موجب';
                    // لا نضيف المنتهي للقائمة النهائية
                } else {
                    // إذا لم يوجد موجب، يبقى المنتهي كما هو
                    processedInventory.push(expItem);
                }
            }
        }

        // إضافة السجلات الموجبة المتبقية
        positiveItems.forEach(p => {
            if (compare(p['الكمية'], 0) > 0) {
                p['ملاحظات'] = 'موجب'; // إعادة تعيين الحالة
                processedInventory.push(p);
            }
        });
    }

    // 6. المرحلة الخامسة: التنظيف النهائي والفرز
    // إضافة عمود القائمة والسجل
    // إضافة عمود القائمة (نص) اذا كان ملاحظات = موجب (E) اذا كان ملاحظات = سالب (F) اذا كان ملاحظات = منتهي (F)
    const finalInventory = processedInventory.map((item, index) => {
        let list = 'E'; // الافتراضي
        if (item['ملاحظات'] === 'سالب' || item['ملاحظات'] === 'منتهي') {
            list = 'F';
        }
        return {
            ...item,
            'القائمة': list,
            'رقم السجل': (index + 1).toString(),
        };
    });

    // 2-3-05-00 فرز وترتيب حسب
    // 2-3-05-01 رمز المادة (نص)
    // 2-3-05-02 تاريخ الصلاحية (تاريخ بتنسيق yyyy-mm-01) بدون توقيت او وقت
    // 2-3-05-03 من الاقدم الى الاحدث
    const sortedFinalInventory = finalInventory.sort((a, b) => {
        // الفرز حسب رمز المادة اولاً
        if (a['رمز المادة'] !== b['رمز المادة']) {
            return a['رمز المادة'].localeCompare(b['رمز المادة']);
        }
        // ثم حسب تاريخ الصلاحية من الاقدم إلى الاحدث
        return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
    });

    // 2-3-06-00 تحديث الرقم التسلسلي م (رقم بتنسق عام) ليصبح هو رقم السجل
    sortedFinalInventory.forEach((item, index) => {
        item['م'] = index + 1;
        item['رقم السجل'] = (index + 1).toString();
    });

    // 7. المرحلة السادسة: تقسيم البيانات إلى قوائم نهائية
    // 2-3-07-01 قائمة E: سجلات الكميات الموجبة (الكمية > 0).
    // 2-3-07-02 قائمة F: سجلات الكميات السالبة (الكمية < 0) + سجلات تاريخ الصلاحية <= تاريخ اليوم
    const listE = sortedFinalInventory.filter(item => item['القائمة'] === 'E');
    const listF = sortedFinalInventory.filter(item => item['القائمة'] === 'F');

    console.log('--- انتهت معالجة الجرد الفعلي ---');
    console.log('القائمة E (موجب):', listE);
    console.log('القائمة F (سالب ومنتهي):', listF);

    return {
        listE,
        listF,
    };
};