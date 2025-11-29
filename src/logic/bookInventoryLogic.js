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

/**
 * حساب الجرد الدفتري بتطبيق 4 مفاتيح مطابقة حسب الأولوية كما ورد في المواصفات
 * @param {Array} netPurchasesRaw - بيانات صافي المشتريات (قائمة A + قائمة B)
 * @param {Array} netSalesRaw - بيانات صافي المبيعات (قائمة C + قائمة D)
 * @returns {Array} bookInventoryList - قائمة الجرد الدفتري
 */
export const calculateBookInventory = (netPurchasesList, netSalesList) => {
    console.log('--- بدء معالجة الجرد الدفتري ---');

    // 1. تحويل البيانات إلى كائنات (إذا كانت البيانات خام)
    // التحقق مما إذا كانت البيانات خام (مصفوفة مصفوفات) أو كائنات بالفعل
    const netPurchases = Array.isArray(netPurchasesList) && netPurchasesList.length > 0 && Array.isArray(netPurchasesList[0]) 
        ? convertToObjects(netPurchasesList)
        : netPurchasesList;
        
    const netSales = Array.isArray(netSalesList) && netSalesList.length > 0 && Array.isArray(netSalesList[0]) 
        ? convertToObjects(netSalesList)
        : netSalesList;

    // 2. فرز البيانات من الأحدث إلى الأقدم
    const sortedPurchases = sortByDateDesc([...netPurchases], 'تاريخ العملية');
    const sortedSales = sortByDateDesc([...netSales], 'تاريخ العملية');

    // 3. إنشاء نسخة عمل من المشتريات والمبيعات
    let bookInventoryList = [];

    // 4. تعريف المفاتيح الأربعة حسب الأولوية للجرد الدفتري كما ورد في المواصفات
    // الشرط الأساسي للمطابقة تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
    // المفتاح 1:- (رمز المادة، تاريخ الصلاحية) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
    // المفتاح 2:- (رمز المادة) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
    // المفتاح 3:- (رمز المادة) + تاريخ صافي المبيعات اصغر من تاريخ صافي المشتريات بثلاثة أيام كحد اقصى
    // المفتاح 4:- (رمز المادة) بدون شرط التاريخ

    const getMatchingKeys = (saleRecord) => [
        // المفتاح 1:- (رمز المادة، تاريخ الصلاحية) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
        (p) => new Date(saleRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === saleRecord['رمز المادة'] &&
            p['تاريخ الصلاحية'] === saleRecord['تاريخ الصلاحية'],

        // المفتاح 2:- (رمز المادة) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
        (p) => new Date(saleRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === saleRecord['رمز المادة'],

        // المفتاح 3:- (رمز المادة) + تاريخ صافي المبيعات اصغر من تاريخ صافي المشتريات بثلاثة أيام كحد اقصى
        (p) => new Date(saleRecord['تاريخ العملية']) < new Date(p['تاريخ العملية']) &&
            new Date(p['تاريخ العملية']) - new Date(saleRecord['تاريخ العملية']) <= 3 * 24 * 60 * 60 * 1000 &&
            p['رمز المادة'] === saleRecord['رمز المادة'],

        // المفتاح 4:- (رمز المادة) بدون شرط التاريخ
        (p) => p['رمز المادة'] === saleRecord['رمز المادة'],
    ];

    // 5. المرور على كل سجل مبيعات ومحاولة مطابقته مع المشتريات
    for (const saleRecord of sortedSales) {
        let matched = false;
        let usedKeyNumber = -1;

        const matchingKeys = getMatchingKeys(saleRecord);

        // جرب كل مفتاح بالترتيب
        for (let keyIndex = 0; keyIndex < matchingKeys.length; keyIndex++) {
            const keyFunction = matchingKeys[keyIndex];

            // البحث عن جميع السجلات المطابقة مع هذا المفتاح
            let matchingPurchases = sortedPurchases.filter(
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
                const purchaseIndex = sortedPurchases.findIndex(p => p['م'] === purchaseRecord['م']);
                if (purchaseIndex === -1) continue;

                const purchaseQty = sortedPurchases[purchaseIndex]['الكمية'];
                const saleQty = parseFloat(saleRecord['الكمية']);

                if (purchaseQty >= saleQty) {
                    // التطابق كامل: خصم كمية المبيعات بالكامل
                    sortedPurchases[purchaseIndex]['الكمية'] -= saleQty;
                    sortedPurchases[purchaseIndex]['ملاحظات'] = `مطابق (مفتاح ${keyIndex + 1})`;
                    matched = true;
                    usedKeyNumber = keyIndex + 1;

                    // إضافة السجل إلى الجرد الدفتري
                    bookInventoryList.push({
                        ...sortedPurchases[purchaseIndex],
                        'كمية المبيعات': saleQty,
                        'ملاحظات': `مطابق (مفتاح ${keyIndex + 1})`,
                    });

                    break; // الانتهاء من هذا المفتاح
                } else {
                    // تطابق جزئي: خصم كمية المشتريات بالكامل واستمر
                    sortedPurchases[purchaseIndex]['الكمية'] = 0;
                    sortedPurchases[purchaseIndex]['ملاحظات'] = `مطابق جزئي (مفتاح ${keyIndex + 1})`;
                    matched = true;
                    usedKeyNumber = keyIndex + 1;

                    // إضافة السجل إلى الجرد الدفتري
                    bookInventoryList.push({
                        ...sortedPurchases[purchaseIndex],
                        'كمية المبيعات': purchaseQty,
                        'ملاحظات': `مطابق جزئي (مفتاح ${keyIndex + 1})`,
                    });

                    // تحديث كمية المبيعات المتبقية
                    saleRecord['الكمية'] = saleQty - purchaseQty;
                }
            }

            if (matched) break;
        }

        // إذا لم يتم العثور على مطابقة، أضف السجل مع ملاحظة "لايوجد مشتريات"
        if (!matched) {
            bookInventoryList.push({
                ...saleRecord,
                'ملاحظات': 'لايوجد مشتريات',
            });
        }
    }

    // 6. إضافة الرقم التسلسلي
    bookInventoryList.forEach((item, index) => {
        item['م'] = index + 1;
    });

    // 7. فرز القوائم النهائية
    bookInventoryList.sort((a, b) => {
        const dateCompare = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
        if (dateCompare !== 0) return dateCompare;
        return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
    });

    console.log('--- انتهت معالجة الجرد الدفتري ---');
    console.log('الجرد الدفتري:', bookInventoryList.length, 'سجل');

    return bookInventoryList;
};