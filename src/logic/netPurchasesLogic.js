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
const sortByDateDesc = (data, dateKey) => {
    return data.sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]));
};

// استيراد اداة تتبع المطابقات
import matchingAudit from '../audit/matchingAudit';

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

/**
 * حساب صافي المشتريات بتطبيق 8 مفاتيح مطابقة حسب الاولوية كما ورد في المواصفات
 * @param {Array} allPurchasesRaw - بيانات المشتريات الخام (مع العناوين)
 * @param {Array} purchaseReturnsRaw - بيانات المرتجعات الخام (مع العناوين)
 * @returns {Object} { netPurchasesList, orphanReturnsList }
 */
export const calculateNetPurchases = (allPurchasesRaw, purchaseReturnsRaw) => {
    console.log('--- بدء معالجة صافي المشتريات ---');
    console.log('Input purchases raw:', allPurchasesRaw);
    console.log('Input returns raw:', purchaseReturnsRaw);
    console.log('Purchases raw length:', allPurchasesRaw ? allPurchasesRaw.length : 0);
    console.log('Returns raw length:', purchaseReturnsRaw ? purchaseReturnsRaw.length : 0);

    // 1. تحويل البيانات إلى كائنات
    const allPurchases = convertToObjects(allPurchasesRaw);
    const purchaseReturns = convertToObjects(purchaseReturnsRaw);
    console.log('Converted purchases:', allPurchases);
    console.log('Converted returns:', purchaseReturns);
    console.log('Converted purchases length:', allPurchases.length);
    console.log('Converted returns length:', purchaseReturns.length);

    // Early return if no data
    if (allPurchases.length === 0 && purchaseReturns.length === 0) {
        console.log('No purchase data found, returning empty results');
        return {
            netPurchasesList: [],
            orphanReturnsList: []
        };
    }

    // 2. فرز المشتريات من الاحدث إلى الاقدم
    const sortedPurchases = sortByDateDesc([...allPurchases], 'تاريخ العملية');
    console.log('Sorted purchases:', sortedPurchases);

    // 3. إنشاء نسخة عمل من المشتريات باستخدام الحسابات المالية الدقة
    let netPurchasesList = sortedPurchases.map((p, index) => ({
        ...p,
        'م': index + 1, // إضافة الرقم التسلسلي مبدئياً
        'الكمية': roundToDecimalPlaces(p['الكمية'] || 0, 2),
        'ملاحظات': 'لايوجد مرتجع',
        'القائمة': 'A',
        'كمية الجرد': new Decimal(0), // إضافة عمود كمية الجرد
        'كمية المبيعات': new Decimal(0) // إضافة عمود كمية المبيعات
    }));

    console.log('Initial net purchases list:', netPurchasesList);

    const orphanReturnsList = [];

    // 4. تعريف المفاتيح الثمانية حسب الاولوية للمشتريات كما ورد في المواصفات
    // المفتاح 1: (رمز المادة، الكمية، اسم المورد، تاريخ الصلاحية، الافرادي)
    // المفتاح 2: (رمز المادة، اسم المورد، تاريخ الصلاحية، الافرادي بعد التقريب لاقرب رقم عشري للمشتريات والمرتجع) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 3: (رمز المادة، اسم المورد، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 4: (رمز المادة، تاريخ الصلاحية، الافرادي) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 5: (رمز المادة، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 6: (رمز المادة، اسم المورد، الافرادي) مع اخذ تاريخ الصلاحية الاقرب ثم الابعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 7: (رمز المادة، اسم المورد) مع اخذ تاريخ الصلاحية الاقرب ثم الابعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 8: (رمز المادة) مع اخذ تاريخ الصلاحية الاقرب ثم الابعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    const getMatchingKeys = (returnRecord) => [
        // المفتاح 1: (رمز المادة، الكمية، اسم المورد، تاريخ الصلاحية، الافرادي)
        (p) => {
            const result = p['رمز المادة'] === returnRecord['رمز المادة'] &&
                compare(p['الكمية'], returnRecord['الكمية']) === 0 &&
                p['المورد'] === returnRecord['المورد'] &&
                p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
                p['الافرادي'] === returnRecord['الافرادي'];
            console.log(`Key 1 match for return ${returnRecord['م']} with purchase ${p['م']}: ${result}`);
            return result;
        },

        // المفتاح 2: (رمز المادة، اسم المورد، تاريخ الصلاحية، الافرادي بعد التقريب لاقرب رقم عشري) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']);
            const result = dateCheck &&
                p['رمز المادة'] === returnRecord['رمز المادة'] &&
                p['المورد'] === returnRecord['المورد'] &&
                p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
                roundToInteger(p['الافرادي']) === roundToInteger(returnRecord['الافرادي']);
            console.log(`Key 2 match for return ${returnRecord['م']} with purchase ${p['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 3: (رمز المادة، اسم المورد، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']);
            const result = dateCheck &&
                p['رمز المادة'] === returnRecord['رمز المادة'] &&
                p['المورد'] === returnRecord['المورد'] &&
                p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'];
            console.log(`Key 3 match for return ${returnRecord['م']} with purchase ${p['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 4: (رمز المادة، تاريخ الصلاحية، الافرادي) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']);
            const result = dateCheck &&
                p['رمز المادة'] === returnRecord['رمز المادة'] &&
                p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
                p['الافرادي'] === returnRecord['الافرادي'];
            console.log(`Key 4 match for return ${returnRecord['م']} with purchase ${p['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 5: (رمز المادة، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']);
            const result = dateCheck &&
                p['رمز المادة'] === returnRecord['رمز المادة'] &&
                p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'];
            console.log(`Key 5 match for return ${returnRecord['م']} with purchase ${p['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 6: (رمز المادة، اسم المورد، الافرادي) مع اخذ تاريخ الصلاحية الاقرب ثم الابعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']);
            const result = dateCheck &&
                p['رمز المادة'] === returnRecord['رمز المادة'] &&
                p['المورد'] === returnRecord['المورد'] &&
                p['الافرادي'] === returnRecord['الافرادي'];
            console.log(`Key 6 match for return ${returnRecord['م']} with purchase ${p['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 7: (رمز المادة، اسم المورد) مع اخذ تاريخ الصلاحية الاقرب ثم الابعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']);
            const result = dateCheck &&
                p['رمز المادة'] === returnRecord['رمز المادة'] &&
                p['المورد'] === returnRecord['المورد'];
            console.log(`Key 7 match for return ${returnRecord['م']} with purchase ${p['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 8: (رمز المادة) مع اخذ تاريخ الصلاحية الاقرب ثم الابعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']);
            const result = dateCheck &&
                p['رمز المادة'] === returnRecord['رمز المادة'];
            console.log(`Key 8 match for return ${returnRecord['م']} with purchase ${p['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },
    ];

    // 5. المرور على كل مرتجع ومحاولة استنزاله من المشتريات باستخدام الحسابات المالية الدقة
    for (const returnRecord of purchaseReturns) {
        console.log(`Processing return record:`, returnRecord);
        let remainingReturnQty = roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2);
        console.log(`Initial remaining return quantity: ${remainingReturnQty.toString()}`);
        if (compare(remainingReturnQty, 0) <= 0) {
            console.log('Return quantity is zero or negative, skipping');
            continue;
        }

        let matched = false;
        let usedKeyNumber = -1;

        const matchingKeys = getMatchingKeys(returnRecord);

        // جرب كل مفتاح بالترتيب
        for (let keyIndex = 0; keyIndex < matchingKeys.length; keyIndex++) {
            if (compare(remainingReturnQty, 0) <= 0) {
                console.log('Remaining return quantity is zero, breaking');
                break;
            }

            const keyFunction = matchingKeys[keyIndex];

            // البحث عن جميع السجلات المطابقة مع هذا المفتاح
            let matchingPurchases = netPurchasesList.filter(
                p => compare(p['الكمية'], 0) > 0 && keyFunction(p)
            );
            
            console.log(`Key ${keyIndex + 1} found ${matchingPurchases.length} matching purchases`);

            // ترتيب السجلات المطابقة: الاحدث ثم الاقدم
            matchingPurchases.sort((a, b) => {
                const dateDiff = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
                if (dateDiff !== 0) return dateDiff;
                // إذا كانت التواريخ متساوية، نرتب حسب معرف السجل
                return a['م'] - b['م'];
            });

            // ⭐ الحلقة الداخلية: استنزال من كل السجلات المطابقة بنفس المفتاح وفقاً للترتيب
            for (const purchaseRecord of matchingPurchases) {
                if (compare(remainingReturnQty, 0) <= 0) {
                    console.log('Remaining return quantity is zero, breaking inner loop');
                    break;
                }

                const purchaseIndex = netPurchasesList.findIndex(p => p['م'] === purchaseRecord['م']);
                if (purchaseIndex === -1) {
                    console.log('Purchase record not found in netPurchasesList, continuing');
                    continue;
                }

                const purchaseQty = netPurchasesList[purchaseIndex]['الكمية'];
                console.log(`Processing match: Return qty ${remainingReturnQty.toString()}, Purchase qty ${purchaseQty.toString()}`);

                if (compare(purchaseQty, remainingReturnQty) >= 0) {
                    // التطابق كامل: خصم كمية المرتجع بالكامل باستخدام الحسابات المالية الدقة
                    netPurchasesList[purchaseIndex]['الكمية'] = subtract(netPurchasesList[purchaseIndex]['الكمية'], remainingReturnQty);
                    netPurchasesList[purchaseIndex]['ملاحظات'] = `مطابق (مفتاح ${keyIndex + 1})`;
                    
                    // تسجيل عملية المطابقة في سجل التدقيق
                    matchingAudit.recordMatch(
                        'NetPurchases',
                        keyIndex + 1,
                        returnRecord['م'],
                        purchaseRecord['م'],
                        remainingReturnQty,
                        returnRecord,
                        purchaseRecord
                    );
                    
                    console.log(`Full match: Return ${returnRecord['م']} with purchase ${purchaseRecord['م']} using key ${keyIndex + 1}`);
                    remainingReturnQty = new Decimal(0);
                    matched = true;
                    usedKeyNumber = keyIndex + 1;
                    break; // الانتهاء من هذا المفتاح
                } else {
                    // تطابق جزئي: خصم كمية المشتريات بالكامل واستمر باستخدام الحسابات المالية الدقة
                    netPurchasesList[purchaseIndex]['الكمية'] = new Decimal(0);
                    netPurchasesList[purchaseIndex]['ملاحظات'] = `مطابق جزئي (مفتاح ${keyIndex + 1})`;
                    
                    // تسجيل عملية المطابقة في سجل التدقيق
                    matchingAudit.recordMatch(
                        'NetPurchases',
                        keyIndex + 1,
                        returnRecord['م'],
                        purchaseRecord['م'],
                        purchaseQty,
                        returnRecord,
                        purchaseRecord
                    );
                    
                    console.log(`Partial match: Return ${returnRecord['م']} with purchase ${purchaseRecord['م']} using key ${keyIndex + 1}`);
                    remainingReturnQty = subtract(remainingReturnQty, purchaseQty);
                    matched = true;
                    usedKeyNumber = keyIndex + 1;
                }
            }

            if (matched) {
                console.log(`Return ${returnRecord['م']} matched using key ${keyIndex + 1}, breaking to next return`);
                break; // الانتقال إلى المرتجع التالي بعد التطابق
            }
        }

        // إذا لم يتطابق المرتجع مع أي شراء، إضافته إلى قائمة المرتجعات اليتيمة
        if (!matched) {
            console.log(`Return ${returnRecord['م']} did not match any purchase, adding to orphan returns`);
            orphanReturnsList.push({
                ...returnRecord,
                'م': orphanReturnsList.length + 1,
                'الكمية': roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2),
                'القائمة': 'B',
                'ملاحظات': 'مرتجع يتيـم'
            });
        }
    }

    // 6. إزالة السجلات التي أصبحت كميتها صفر بعد المطابقة
    const originalLength = netPurchasesList.length;
    netPurchasesList = netPurchasesList.filter(p => compare(p['الكمية'], 0) > 0);
    console.log(`Filtered out ${originalLength - netPurchasesList.length} records with zero quantity`);

    // 7. تحديث الأرقام التسلسلية بعد الفلترة
    netPurchasesList = netPurchasesList.map((p, index) => ({
        ...p,
        'م': index + 1
    }));

    console.log('Final net purchases list:', netPurchasesList);
    console.log('Final orphan returns list:', orphanReturnsList);

    console.log('--- انتهت معالجة صافي المشتريات ---');
    return {
        netPurchasesList,
        orphanReturnsList
    };
};