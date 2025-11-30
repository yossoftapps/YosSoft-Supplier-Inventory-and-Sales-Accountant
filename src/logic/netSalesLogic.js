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
 * حساب صافي المبيعات بتطبيق 10 مفاتيح مطابقة حسب الأولوية كما ورد في المواصفات
 * @param {Array} allSalesRaw - بيانات المبيعات الخام (مع العناوين)
 * @param {Array} salesReturnsRaw - بيانات المرتجعات الخام (مع العناوين)
 * @returns {Object} { netSalesList, orphanReturnsList }
 */
export const calculateNetSales = (allSalesRaw, salesReturnsRaw) => {
    console.log('--- بدء معالجة صافي المبيعات ---');

    // 1. تحويل البيانات إلى كائنات
    const allSales = convertToObjects(allSalesRaw);
    const salesReturns = convertToObjects(salesReturnsRaw);

    // 2. فرز المبيعات من الأحدث إلى الأقدم
    const sortedSales = sortByDateDesc([...allSales], 'تاريخ العملية');

    // 3. إنشاء نسخة عمل من المبيعات
    let netSalesList = sortedSales.map((s, index) => ({
        ...s,
        'م': index + 1, // إضافة الرقم التسلسلي مبدئياً
        'الكمية': parseFloat(s['الكمية']),
        'ملاحظات': 'لايوجد مرتجع',
        'القائمة': 'C'
    }));

    const orphanReturnsList = [];

    // 4. تعريف المفاتيح العشرة حسب الأولوية للمبيعات كما ورد في المواصفات
    // المفتاح 1:- (رمز المادة، تاريخ الصلاحية، الافرادي، الكمية)
    // المفتاح 2:- (رمز المادة، تاريخ الصلاحية، الافرادي بعد التقريب لأقرب رقم عشري، الكمية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 3:- (رمز المادة، تاريخ الصلاحية، الكمية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 4:- (رمز المادة، تاريخ الصلاحية، الافرادي) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 5:- (رمز المادة، تاريخ الصلاحية، الافرادي بعد التقريب لأقرب رقم عشري) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 6:- (رمز المادة، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 7:- (رمز المادة، الافرادي، الكمية) ويُراعى تاريخ الصلاحية الأقرب فالأبعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 8:- (رمز المادة، الافرادي) ويُراعى تاريخ الصلاحية الأقرب فالأبعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 9:- (رمز المادة، الكمية) ويُراعى تاريخ الصلاحية الأقرب فالأبعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 10:- (رمز المادة) ويُراعى تاريخ الصلاحية الأقرب فالأبعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    const getMatchingKeys = (returnRecord) => [
        // المفتاح 1:- (رمز المادة، تاريخ الصلاحية، الافرادي، الكمية)
        (s) => s['رمز المادة'] === returnRecord['رمز المادة'] &&
            s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
            s['الافرادي'] === returnRecord['الافرادي'] &&
            parseFloat(s['الكمية']) === parseFloat(returnRecord['الكمية']),

        // المفتاح 2:- (رمز المادة، تاريخ الصلاحية، الافرادي بعد التقريب لأقرب رقم عشري، الكمية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']) &&
            s['رمز المادة'] === returnRecord['رمز المادة'] &&
            s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
            Math.round(parseFloat(s['الافرادي']) * 10) / 10 === Math.round(parseFloat(returnRecord['الافرادي']) * 10) / 10 &&
            parseFloat(s['الكمية']) === parseFloat(returnRecord['الكمية']),

        // المفتاح 3:- (رمز المادة، تاريخ الصلاحية، الكمية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']) &&
            s['رمز المادة'] === returnRecord['رمز المادة'] &&
            s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
            parseFloat(s['الكمية']) === parseFloat(returnRecord['الكمية']),

        // المفتاح 4:- (رمز المادة، تاريخ الصلاحية، الافرادي) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']) &&
            s['رمز المادة'] === returnRecord['رمز المادة'] &&
            s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
            s['الافرادي'] === returnRecord['الافرادي'],

        // المفتاح 5:- (رمز المادة، تاريخ الصلاحية، الافرادي بعد التقريب لأقرب رقم عشري) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']) &&
            s['رمز المادة'] === returnRecord['رمز المادة'] &&
            s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
            Math.round(parseFloat(s['الافرادي']) * 10) / 10 === Math.round(parseFloat(returnRecord['الافرادي']) * 10) / 10,

        // المفتاح 6:- (رمز المادة، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']) &&
            s['رمز المادة'] === returnRecord['رمز المادة'] &&
            s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'],

        // المفتاح 7:- (رمز المادة، الافرادي، الكمية) ويُراعى تاريخ الصلاحية الأقرب فالأبعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']) &&
            s['رمز المادة'] === returnRecord['رمز المادة'] &&
            s['الافرادي'] === returnRecord['الافرادي'] &&
            parseFloat(s['الكمية']) === parseFloat(returnRecord['الكمية']),

        // المفتاح 8:- (رمز المادة، الافرادي) ويُراعى تاريخ الصلاحية الأقرب فالأبعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']) &&
            s['رمز المادة'] === returnRecord['رمز المادة'] &&
            s['الافرادي'] === returnRecord['الافرادي'],

        // المفتاح 9:- (رمز المادة، الكمية) ويُراعى تاريخ الصلاحية الأقرب فالأبعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']) &&
            s['رمز المادة'] === returnRecord['رمز المادة'] &&
            parseFloat(s['الكمية']) === parseFloat(returnRecord['الكمية']),

        // المفتاح 10:- (رمز المادة) ويُراعى تاريخ الصلاحية الأقرب فالأبعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']) &&
            s['رمز المادة'] === returnRecord['رمز المادة'],
    ];

    // 5. المرور على كل مرتجع ومحاولة استنزاله من المبيعات
    for (const returnRecord of salesReturns) {
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
            let matchingSales = netSalesList.filter(
                s => s['الكمية'] > 0 && keyFunction(s)
            );

            // ترتيب السجلات المطابقة: الأحدث ثم الأقدم
            matchingSales.sort((a, b) => {
                const dateDiff = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
                if (dateDiff !== 0) return dateDiff;
                // إذا كانت التواريخ متساوية، نرتب حسب معرف السجل
                return a['م'] - b['م'];
            });

            // ⭐ الحلقة الداخلية: استنزال من كل السجلات المطابقة بنفس المفتاح وفقاً للترتيب
            for (const saleRecord of matchingSales) {
                if (remainingReturnQty <= 0) break;

                const saleIndex = netSalesList.findIndex(s => s['م'] === saleRecord['م']);
                if (saleIndex === -1) continue;

                const saleQty = netSalesList[saleIndex]['الكمية'];

                if (saleQty >= remainingReturnQty) {
                    // التطابق كامل: خصم كمية المرتجع بالكامل
                    netSalesList[saleIndex]['الكمية'] -= remainingReturnQty;
                    netSalesList[saleIndex]['ملاحظات'] = `مطابق (مفتاح ${keyIndex + 1})`;
                    
                    // تسجيل عملية المطابقة في سجل التدقيق
                    matchingAudit.recordMatch(
                        'NetSales',
                        keyIndex + 1,
                        returnRecord['م'],
                        saleRecord['م'],
                        remainingReturnQty,
                        returnRecord,
                        saleRecord
                    );
                    
                    remainingReturnQty = 0;
                    matched = true;
                    usedKeyNumber = keyIndex + 1;
                    break; // الانتهاء من هذا المفتاح
                } else {
                    // تطابق جزئي: خصم كمية المبيعات بالكامل واستمر
                    netSalesList[saleIndex]['الكمية'] = 0;
                    netSalesList[saleIndex]['ملاحظات'] = `مطابق جزئي (مفتاح ${keyIndex + 1})`;
                    
                    // تسجيل عملية المطابقة في سجل التدقيق
                    matchingAudit.recordMatch(
                        'NetSales',
                        keyIndex + 1,
                        returnRecord['م'],
                        saleRecord['م'],
                        saleQty,
                        returnRecord,
                        saleRecord
                    );
                    
                    remainingReturnQty -= saleQty;
                    matched = true;
                    usedKeyNumber = keyIndex + 1;
                }
            }
        }

        // إذا بقيت كمية غير مطابقة، أضفها للمرتجعات اليتيمة
        // كميات صافي المبيعات تكون موجبة والمرتجعات اليتيمة المتبقية تكون بكميات سالبة
        if (!matched || remainingReturnQty > 0) {
            orphanReturnsList.push({
                ...returnRecord,
                'الكمية': remainingReturnQty > 0 ? remainingReturnQty : parseFloat(returnRecord['الكمية']),
                'ملاحظات': 'غير مطابق',
                'القائمة': 'D'
            });
        }
    }

    // 6. تنقية القائمة النهائية (إزالة السجلات التي كميتها صفر)
    const finalNetSalesList = netSalesList.filter(s => s['الكمية'] > 0);

    // 7. تحديث الرقم التسلسلي ليصبح هو رقم السجل لصافي المبيعات
    finalNetSalesList.forEach((item, index) => {
        item['م'] = index + 1;
    });

    orphanReturnsList.forEach((item, index) => {
        item['م'] = index + 1;
    });

    // 8. فرز القوائم النهائية
    finalNetSalesList.sort((a, b) => {
        const dateCompare = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
        if (dateCompare !== 0) return dateCompare;
        return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
    });

    console.log('--- انتهت معالجة صافي المبيعات ---');
    console.log('صافي المبيعات (قائمة C):', finalNetSalesList.length, 'سجل');
    console.log('المرتجعات اليتيمة (قائمة D):', orphanReturnsList.length, 'سجل');

    return {
        netSalesList: finalNetSalesList,
        orphanReturnsList: orphanReturnsList,
    };
};