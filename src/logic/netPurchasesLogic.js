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

// استيراد أداة تتبع المطابقات
import matchingAudit from '../audit/matchingAudit';

/**
 * حساب صافي المشتريات بتطبيق 8 مفاتيح مطابقة حسب الأولوية كما ورد في المواصفات
 * @param {Array} allPurchasesRaw - بيانات المشتريات الخام (مع العناوين)
 * @param {Array} purchaseReturnsRaw - بيانات المرتجعات الخام (مع العناوين)
 * @returns {Object} { netPurchasesList, orphanReturnsList }
 */
export const calculateNetPurchases = (allPurchasesRaw, purchaseReturnsRaw) => {
    console.log('--- بدء معالجة صافي المشتريات ---');
    console.log('Input purchases raw:', allPurchasesRaw);
    console.log('Input returns raw:', purchaseReturnsRaw);

    // 1. تحويل البيانات إلى كائنات
    const allPurchases = convertToObjects(allPurchasesRaw);
    const purchaseReturns = convertToObjects(purchaseReturnsRaw);
    console.log('Converted purchases:', allPurchases);
    console.log('Converted returns:', purchaseReturns);

    // 2. فرز المشتريات من الأحدث إلى الأقدم
    const sortedPurchases = sortByDateDesc([...allPurchases], 'تاريخ العملية');

    // 3. إنشاء نسخة عمل من المشتريات
    let netPurchasesList = sortedPurchases.map((p, index) => ({
        ...p,
        'م': index + 1, // إضافة الرقم التسلسلي مبدئياً
        'الكمية': parseFloat(p['الكمية']),
        'ملاحظات': 'لايوجد مرتجع',
        'القائمة': 'A',
        'كمية الجرد': 0, // إضافة عمود كمية الجرد
        'كمية المبيعات': 0 // إضافة عمود كمية المبيعات
    }));

    const orphanReturnsList = [];

    // 4. تعريف المفاتيح الثمانية حسب الأولوية للمشتريات كما ورد في المواصفات
    // المفتاح 1: (رمز المادة، الكمية، اسم المورد، تاريخ الصلاحية، الافرادي)
    // المفتاح 2: (رمز المادة، اسم المورد، تاريخ الصلاحية، الافرادي بعد التقريب لأقرب رقم عشري للمشتريات والمرتجع) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 3: (رمز المادة، اسم المورد، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 4: (رمز المادة، تاريخ الصلاحية، الافرادي) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 5: (رمز المادة، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 6: (رمز المادة، اسم المورد، الافرادي) مع أخذ تاريخ الصلاحية الأقرب ثم الأبعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 7: (رمز المادة، اسم المورد) مع أخذ تاريخ الصلاحية الأقرب ثم الأبعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    // المفتاح 8: (رمز المادة) مع أخذ تاريخ الصلاحية الأقرب ثم الأبعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
    const getMatchingKeys = (returnRecord) => [
        // المفتاح 1: (رمز المادة، الكمية، اسم المورد، تاريخ الصلاحية، الافرادي)
        (p) => p['رمز المادة'] === returnRecord['رمز المادة'] &&
            parseFloat(p['الكمية']) === parseFloat(returnRecord['الكمية']) &&
            p['المورد'] === returnRecord['المورد'] &&
            p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
            p['الافرادي'] === returnRecord['الافرادي'],

        // المفتاح 2: (رمز المادة، اسم المورد، تاريخ الصلاحية، الافرادي بعد التقريب لأقرب رقم عشري) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === returnRecord['رمز المادة'] &&
            p['المورد'] === returnRecord['المورد'] &&
            p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
            Math.round(parseFloat(p['الافرادي']) * 10) / 10 === Math.round(parseFloat(returnRecord['الافرادي']) * 10) / 10,

        // المفتاح 3: (رمز المادة، اسم المورد، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === returnRecord['رمز المادة'] &&
            p['المورد'] === returnRecord['المورد'] &&
            p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'],

        // المفتاح 4: (رمز المادة، تاريخ الصلاحية، الافرادي) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === returnRecord['رمز المادة'] &&
            p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
            p['الافرادي'] === returnRecord['الافرادي'],

        // المفتاح 5: (رمز المادة، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === returnRecord['رمز المادة'] &&
            p['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'],

        // المفتاح 6: (رمز المادة، اسم المورد، الافرادي) مع أخذ تاريخ الصلاحية الأقرب ثم الأبعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === returnRecord['رمز المادة'] &&
            p['المورد'] === returnRecord['المورد'] &&
            p['الافرادي'] === returnRecord['الافرادي'],

        // المفتاح 7: (رمز المادة، اسم المورد) مع أخذ تاريخ الصلاحية الأقرب ثم الأبعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === returnRecord['رمز المادة'] &&
            p['المورد'] === returnRecord['المورد'],

        // المفتاح 8: (رمز المادة) مع أخذ تاريخ الصلاحية الأقرب ثم الأبعد + تاريخ المرتجع اكبر او يساوي تاريخ الشراء
        (p) => new Date(returnRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === returnRecord['رمز المادة'],
    ];

    // 5. المرور على كل مرتجع ومحاولة استنزاله من المشتريات
    for (const returnRecord of purchaseReturns) {
        let remainingReturnQty = parseFloat(returnRecord['الكمية']);
        if (remainingReturnQty <= 0) continue;

        let matched = false;
        let usedKeyNumber = -1;

        const matchingKeys = getMatchingKeys(returnRecord);

        // جرب كل مفتاح بالترتيب
        for (let keyIndex = 0; keyIndex < matchingKeys.length; keyIndex++) {
            if (remainingReturnQty <= 0) break;

            const keyFunction = matchingKeys[keyIndex];

            // البحث عن جميع السجلات المطابقة مع هذا المفتاح
            let matchingPurchases = netPurchasesList.filter(
                p => p['الكمية'] > 0 && keyFunction(p)
            );

            // ترتيب السجلات المطابقة: الأحدث ثم الأقدم
            matchingPurchases.sort((a, b) => {
                const dateDiff = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
                if (dateDiff !== 0) return dateDiff;
                // إذا كانت التواريخ متساوية، نرتب حسب معرف السجل
                return a['م'] - b['م'];
            });

            // ⭐ الحلقة الداخلية: استنزال من كل السجلات المطابقة بنفس المفتاح وفقاً للترتيب
            for (const purchaseRecord of matchingPurchases) {
                if (remainingReturnQty <= 0) break;

                const purchaseIndex = netPurchasesList.findIndex(p => p['م'] === purchaseRecord['م']);
                if (purchaseIndex === -1) continue;

                const purchaseQty = netPurchasesList[purchaseIndex]['الكمية'];

                if (purchaseQty >= remainingReturnQty) {
                    // التطابق كامل: خصم كمية المرتجع بالكامل
                    netPurchasesList[purchaseIndex]['الكمية'] -= remainingReturnQty;
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
                    
                    remainingReturnQty = 0;
                    matched = true;
                    usedKeyNumber = keyIndex + 1;
                    break; // الانتهاء من هذا المفتاح
                } else {
                    // تطابق جزئي: خصم كمية المشتريات بالكامل واستمر
                    netPurchasesList[purchaseIndex]['الكمية'] = 0;
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
                    
                    remainingReturnQty -= purchaseQty;
                    matched = true;
                    usedKeyNumber = keyIndex + 1;
                }
            }
        }

        // إذا بقيت كمية غير مطابقة، أضفها للمرتجعات اليتيمة
        // كميات المرتجعات اليتيمة المتبقية تبقى في صافي المشتريات بكميات سالبة
        if (!matched || remainingReturnQty > 0) {
            orphanReturnsList.push({
                ...returnRecord,
                'الكمية': remainingReturnQty > 0 ? remainingReturnQty : parseFloat(returnRecord['الكمية']),
                'ملاحظات': 'غير مطابق',
                'القائمة': 'B'
            });
        }
    }

    // 6. تنقية القائمة النهائية (إزالة السجلات التي كميتها صفر)
    const finalNetPurchasesList = netPurchasesList.filter(p => p['الكمية'] > 0);

    // 7. تحديث الرقم التسلسلي ليصبح هو رقم السجل لصافي المشتريات
    finalNetPurchasesList.forEach((item, index) => {
        item['م'] = index + 1;
    });

    orphanReturnsList.forEach((item, index) => {
        item['م'] = index + 1;
    });

    // 8. فرز القوائم النهائية
    finalNetPurchasesList.sort((a, b) => {
        const dateCompare = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
        if (dateCompare !== 0) return dateCompare;
        return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
    });

    console.log('--- انتهت معالجة صافي المشتريات ---');
    console.log('صافي المشتريات (قائمة A):', finalNetPurchasesList.length, 'سجل');
    console.log('المرتجعات اليتيمة (قائمة B):', orphanReturnsList.length, 'سجل');

    return {
        netPurchasesList: finalNetPurchasesList,
        orphanReturnsList: orphanReturnsList,
    };
};