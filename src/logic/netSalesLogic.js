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
 * حساب صافي المبيعات بتطبيق 10 مفاتيح مطابقة حسب الاولوية كما ورد في المواصفات
 * @param {Array} allSalesRaw - بيانات المبيعات الخام (مع العناوين)
 * @param {Array} salesReturnsRaw - بيانات المرتجعات الخام (مع العناوين)
 * @returns {Object} { netSalesList, orphanReturnsList }
 */
export const calculateNetSales = (allSalesRaw, salesReturnsRaw) => {
    console.log('--- بدء معالجة صافي المبيعات ---');
    console.log('Input sales raw:', allSalesRaw);
    console.log('Input returns raw:', salesReturnsRaw);
    console.log('Sales raw length:', allSalesRaw ? allSalesRaw.length : 0);
    console.log('Returns raw length:', salesReturnsRaw ? salesReturnsRaw.length : 0);

    // 1. تحويل البيانات إلى كائنات
    const allSales = convertToObjects(allSalesRaw);
    const salesReturns = convertToObjects(salesReturnsRaw);
    console.log('Converted sales:', allSales);
    console.log('Converted returns:', salesReturns);
    console.log('Converted sales length:', allSales.length);
    console.log('Converted returns length:', salesReturns.length);

    // Early return if no data
    if (allSales.length === 0 && salesReturns.length === 0) {
        console.log('No sales data found, returning empty results');
        return {
            netSalesList: [],
            orphanReturnsList: []
        };
    }

    // 2. فرز المبيعات من الاحدث إلى الاقدم
    const sortedSales = sortByDateDesc([...allSales], 'تاريخ العملية');
    console.log('Sorted sales:', sortedSales);

    // 3. إنشاء نسخة عمل من المبيعات باستخدام الحسابات المالية الدقة
    let netSalesList = sortedSales.map((s, index) => ({
        ...s,
        'م': index + 1, // إضافة الرقم التسلسلي مبدئياً
        'الكمية': roundToDecimalPlaces(s['الكمية'] || 0, 2),
        'ملاحظات': 'لايوجد مرتجع',
        'القائمة': 'C'
    }));

    console.log('Initial net sales list:', netSalesList);

    const orphanReturnsList = [];

    // 4. تعريف المفاتيح العشرة حسب الاولوية للمبيعات كما ورد في المواصفات
    // المفتاح 1:- (رمز المادة، تاريخ الصلاحية، الافرادي، الكمية)
    // المفتاح 2:- (رمز المادة، تاريخ الصلاحية، الافرادي بعد التقريب لاقرب رقم عشري، الكمية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 3:- (رمز المادة، تاريخ الصلاحية، الكمية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 4:- (رمز المادة، تاريخ الصلاحية، الافرادي) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 5:- (رمز المادة، تاريخ الصلاحية، الافرادي بعد التقريب لاقرب رقم عشري) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 6:- (رمز المادة، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 7:- (رمز المادة، الافرادي، الكمية) ويُراعى تاريخ الصلاحية الاقرب فالابعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 8:- (رمز المادة، الافرادي) ويُراعى تاريخ الصلاحية الاقرب فالابعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 9:- (رمز المادة، الكمية) ويُراعى تاريخ الصلاحية الاقرب فالابعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    // المفتاح 10:- (رمز المادة) ويُراعى تاريخ الصلاحية الاقرب فالابعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
    const getMatchingKeys = (returnRecord) => [
        // المفتاح 1:- (رمز المادة، تاريخ الصلاحية، الافرادي، الكمية)
        (s) => {
            const result = s['رمز المادة'] === returnRecord['رمز المادة'] &&
                s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
                s['الافرادي'] === returnRecord['الافرادي'] &&
                compare(s['الكمية'], returnRecord['الكمية']) === 0;
            console.log(`Key 1 match for return ${returnRecord['م']} with sale ${s['م']}: ${result}`);
            return result;
        },

        // المفتاح 2:- (رمز المادة، تاريخ الصلاحية، الافرادي بعد التقريب لاقرب رقم عشري، الكمية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']);
            const result = dateCheck &&
                s['رمز المادة'] === returnRecord['رمز المادة'] &&
                s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
                roundToInteger(s['الافرادي']) === roundToInteger(returnRecord['الافرادي']) &&
                compare(s['الكمية'], returnRecord['الكمية']) === 0;
            console.log(`Key 2 match for return ${returnRecord['م']} with sale ${s['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 3:- (رمز المادة، تاريخ الصلاحية، الكمية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']);
            const result = dateCheck &&
                s['رمز المادة'] === returnRecord['رمز المادة'] &&
                s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
                compare(s['الكمية'], returnRecord['الكمية']) === 0;
            console.log(`Key 3 match for return ${returnRecord['م']} with sale ${s['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 4:- (رمز المادة، تاريخ الصلاحية، الافرادي) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']);
            const result = dateCheck &&
                s['رمز المادة'] === returnRecord['رمز المادة'] &&
                s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
                s['الافرادي'] === returnRecord['الافرادي'];
            console.log(`Key 4 match for return ${returnRecord['م']} with sale ${s['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 5:- (رمز المادة، تاريخ الصلاحية، الافرادي بعد التقريب لاقرب رقم عشري) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']);
            const result = dateCheck &&
                s['رمز المادة'] === returnRecord['رمز المادة'] &&
                s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'] &&
                roundToInteger(s['الافرادي']) === roundToInteger(returnRecord['الافرادي']);
            console.log(`Key 5 match for return ${returnRecord['م']} with sale ${s['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 6:- (رمز المادة، تاريخ الصلاحية) + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']);
            const result = dateCheck &&
                s['رمز المادة'] === returnRecord['رمز المادة'] &&
                s['تاريخ الصلاحية'] === returnRecord['تاريخ الصلاحية'];
            console.log(`Key 6 match for return ${returnRecord['م']} with sale ${s['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 7:- (رمز المادة، الافرادي، الكمية) ويُراعى تاريخ الصلاحية الاقرب فالابعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']);
            const result = dateCheck &&
                s['رمز المادة'] === returnRecord['رمز المادة'] &&
                s['الافرادي'] === returnRecord['الافرادي'] &&
                compare(s['الكمية'], returnRecord['الكمية']) === 0;
            console.log(`Key 7 match for return ${returnRecord['م']} with sale ${s['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 8:- (رمز المادة، الافرادي) ويُراعى تاريخ الصلاحية الاقرب فالابعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']);
            const result = dateCheck &&
                s['رمز المادة'] === returnRecord['رمز المادة'] &&
                s['الافرادي'] === returnRecord['الافرادي'];
            console.log(`Key 8 match for return ${returnRecord['م']} with sale ${s['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 9:- (رمز المادة، الكمية) ويُراعى تاريخ الصلاحية الاقرب فالابعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']);
            const result = dateCheck &&
                s['رمز المادة'] === returnRecord['رمز المادة'] &&
                compare(s['الكمية'], returnRecord['الكمية']) === 0;
            console.log(`Key 9 match for return ${returnRecord['م']} with sale ${s['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },

        // المفتاح 10:- (رمز المادة) ويُراعى تاريخ الصلاحية الاقرب فالابعد + تاريخ المرتجع اكبر او يساوي تاريخ البيع
        (s) => {
            const dateCheck = new Date(returnRecord['تاريخ العملية']) >= new Date(s['تاريخ العملية']);
            const result = dateCheck &&
                s['رمز المادة'] === returnRecord['رمز المادة'];
            console.log(`Key 10 match for return ${returnRecord['م']} with sale ${s['م']}: ${result} (dateCheck: ${dateCheck})`);
            return result;
        },
    ];

    // 5. المرور على كل مرتجع ومحاولة استنزاله من المبيعات باستخدام الحسابات المالية الدقة
    for (const returnRecord of salesReturns) {
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
            let matchingSales = netSalesList.filter(
                s => compare(s['الكمية'], 0) > 0 && keyFunction(s)
            );
            
            console.log(`Key ${keyIndex + 1} found ${matchingSales.length} matching sales`);

            // ترتيب السجلات المطابقة: الاحدث ثم الاقدم
            matchingSales.sort((a, b) => {
                const dateDiff = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
                if (dateDiff !== 0) return dateDiff;
                // إذا كانت التواريخ متساوية، نرتب حسب معرف السجل
                return a['م'] - b['م'];
            });

            // ⭐ الحلقة الداخلية: استنزال من كل السجلات المطابقة بنفس المفتاح وفقاً للترتيب
            for (const saleRecord of matchingSales) {
                if (compare(remainingReturnQty, 0) <= 0) {
                    console.log('Remaining return quantity is zero, breaking inner loop');
                    break;
                }

                const saleIndex = netSalesList.findIndex(s => s['م'] === saleRecord['م']);
                if (saleIndex === -1) {
                    console.log('Sale record not found in netSalesList, continuing');
                    continue;
                }

                const saleQty = netSalesList[saleIndex]['الكمية'];
                console.log(`Processing match: Return qty ${remainingReturnQty.toString()}, Sale qty ${saleQty.toString()}`);

                if (compare(saleQty, remainingReturnQty) >= 0) {
                    // التطابق كامل: خصم كمية المرتجع بالكامل باستخدام الحسابات المالية الدقة
                    netSalesList[saleIndex]['الكمية'] = subtract(netSalesList[saleIndex]['الكمية'], remainingReturnQty);
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
                    
                    console.log(`Full match: Return ${returnRecord['م']} with sale ${saleRecord['م']} using key ${keyIndex + 1}`);
                    remainingReturnQty = new Decimal(0);
                    matched = true;
                    usedKeyNumber = keyIndex + 1;
                    break; // الانتهاء من هذا المفتاح
                } else {
                    // تطابق جزئي: خصم كمية المبيعات بالكامل واستمر باستخدام الحسابات المالية الدقة
                    netSalesList[saleIndex]['الكمية'] = new Decimal(0);
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
                    
                    console.log(`Partial match: Return ${returnRecord['م']} with sale ${saleRecord['م']} using key ${keyIndex + 1}`);
                    remainingReturnQty = subtract(remainingReturnQty, saleQty);
                    matched = true;
                    usedKeyNumber = keyIndex + 1;
                }
            }

            if (matched) {
                console.log(`Return ${returnRecord['م']} matched using key ${keyIndex + 1}, breaking to next return`);
                break; // الانتقال إلى المرتجع التالي بعد التطابق
            }
        }

        // إذا لم يتطابق المرتجع مع أي بيع، إضافته إلى قائمة المرتجعات اليتيمة
        if (!matched) {
            console.log(`Return ${returnRecord['م']} did not match any sale, adding to orphan returns`);
            orphanReturnsList.push({
                ...returnRecord,
                'م': orphanReturnsList.length + 1,
                'الكمية': roundToDecimalPlaces(returnRecord['الكمية'] || 0, 2),
                'القائمة': 'D',
                'ملاحظات': 'مرتجع يتيـم'
            });
        }
    }

    // 6. إزالة السجلات التي أصبحت كميتها صفر بعد المطابقة
    const originalLength = netSalesList.length;
    netSalesList = netSalesList.filter(s => compare(s['الكمية'], 0) > 0);
    console.log(`Filtered out ${originalLength - netSalesList.length} records with zero quantity`);

    // 7. تحديث الأرقام التسلسلية بعد الفلترة
    netSalesList = netSalesList.map((s, index) => ({
        ...s,
        'م': index + 1
    }));

    console.log('Final net sales list:', netSalesList);
    console.log('Final orphan returns list:', orphanReturnsList);

    console.log('--- انتهت معالجة صافي المبيعات ---');
    return {
        netSalesList,
        orphanReturnsList
    };
};