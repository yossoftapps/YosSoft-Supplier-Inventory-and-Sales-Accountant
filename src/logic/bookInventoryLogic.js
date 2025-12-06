// ═══════════════════════════════════════════════════════════════════════════
// الجرد الدفتري - محسّن للأداء
// Book Inventory - Performance Optimized
// ═══════════════════════════════════════════════════════════════════════════

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

const sortByDateDesc = (data, dateKey) => {
    return data.sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]));
};

/**
 * حساب الجرد الدفتري بتطبيق 4 مفاتيح مطابقة
 * تم التحسين باستخدام الفهارس (Map) لتسريع عملية البحث
 */
export const calculateBookInventory = (netPurchasesList, netSalesList) => {
    const startTime = performance.now();

    const netPurchases = Array.isArray(netPurchasesList) && netPurchasesList.length > 0 && Array.isArray(netPurchasesList[0])
        ? convertToObjects(netPurchasesList)
        : netPurchasesList;

    const netSales = Array.isArray(netSalesList) && netSalesList.length > 0 && Array.isArray(netSalesList[0])
        ? convertToObjects(netSalesList)
        : netSalesList;

    console.log(`🚀 [BookInventory] معالجة: ${netPurchases.length} مشتريات، ${netSales.length} مبيعات`);

    // 1. فهرسة المشتريات حسب رمز المادة وترتيبها تنازلياً بالتاريخ
    const purchasesByItem = new Map();
    netPurchases.forEach(p => {
        // إنشاء نسخة لتجنب تعديل البيانات الأصلية إذا لم يكن مطلوباً (أو استخدامها مباشرة إذا كان مطلوب التعديل التراكمي)
        // هنا نستخدم النسخة لأننا سنعدل الكميات أثناء الحساب
        const item = { ...p, _dateObj: new Date(p['تاريخ العملية']) };
        const code = item['رمز المادة'];
        if (!purchasesByItem.has(code)) {
            purchasesByItem.set(code, []);
        }
        purchasesByItem.get(code).push(item);
    });

    // فرز كل قائمة مشتريات مرة واحدة فقط
    purchasesByItem.forEach(list => {
        list.sort((a, b) => {
            const dateDiff = b._dateObj - a._dateObj;
            if (dateDiff !== 0) return dateDiff;
            return a['م'] - b['م'];
        });
    });

    const sortedSales = sortByDateDesc([...netSales], 'تاريخ العملية');
    let bookInventoryList = [];

    // تعريف دوال المطابقة
    const strategies = [
        // 1. التاريخ صالح، نفس المادة، نفس الصلاحية
        (p, s, pDate, sDate) => sDate >= pDate && p['تاريخ الصلاحية'] === s['تاريخ الصلاحية'],

        // 2. التاريخ صالح، نفس المادة
        (p, s, pDate, sDate) => sDate >= pDate,

        // 3. شراء مستقبلي (خلال 3 أيام)، نفس المادة
        (p, s, pDate, sDate) => pDate > sDate && (pDate - sDate) <= 3 * 24 * 60 * 60 * 1000,

        // 4. نفس المادة فقط
        (p, s, pDate, sDate) => true
    ];

    for (let saleIdx = 0; saleIdx < sortedSales.length; saleIdx++) {
        const saleRecord = sortedSales[saleIdx];
        const saleDate = new Date(saleRecord['تاريخ العملية']);

        let remainingSaleQty = roundToDecimalPlaces(saleRecord['الكمية'] || 0, 2);
        let matched = false;

        // الحصول على قائمة المشتريات المرشحة (نفس المادة)
        const candidates = purchasesByItem.get(saleRecord['رمز المادة']);

        if (candidates) {
            // تجربة الاستراتيجيات بالترتيب
            for (let strategyIdx = 0; strategyIdx < strategies.length; strategyIdx++) {
                const strategyFn = strategies[strategyIdx];
                let currentStrategyMatched = false;

                // المرور على المشتريات المرشحة
                for (let i = 0; i < candidates.length; i++) {
                    const purchaseRecord = candidates[i];

                    // تجاوز المشتريات المستهلكة
                    if (compare(purchaseRecord['الكمية'], 0) <= 0) continue;

                    // التحقق من الاستراتيجية
                    if (strategyFn(purchaseRecord, saleRecord, purchaseRecord._dateObj, saleDate)) {

                        const purchaseQty = purchaseRecord['الكمية'];

                        if (compare(purchaseQty, remainingSaleQty) >= 0) {
                            // الشراء يغطي البيع بالكامل
                            purchaseRecord['الكمية'] = subtract(purchaseQty, remainingSaleQty);
                            purchaseRecord['ملاحظات'] = `مطابق (مفتاح ${strategyIdx + 1})`;

                            bookInventoryList.push({
                                ...purchaseRecord,
                                'كمية المبيعات': remainingSaleQty,
                                'ملاحظات': `مطابق (مفتاح ${strategyIdx + 1})`,
                            });

                            remainingSaleQty = new Decimal(0);
                            currentStrategyMatched = true;
                            matched = true;
                            // تم تلبية الطلب بالكامل
                            break;
                        } else {
                            // الشراء يغطي جزء من البيع
                            purchaseRecord['الكمية'] = new Decimal(0);
                            purchaseRecord['ملاحظات'] = `مطابق جزئي (مفتاح ${strategyIdx + 1})`;

                            bookInventoryList.push({
                                ...purchaseRecord,
                                'كمية المبيعات': purchaseQty,
                                'ملاحظات': `مطابق جزئي (مفتاح ${strategyIdx + 1})`,
                            });

                            remainingSaleQty = subtract(remainingSaleQty, purchaseQty);
                            currentStrategyMatched = true;
                            matched = true;
                            // نستمر في البحث عن مشتريات أخرى بنفس الاستراتيجية
                        }
                    }
                }

                // إذا حدثت أي مطابقة بهذه الاستراتيجية (كلية أو جزئية)، نتوقف ولا ننتقل للاستراتيجية التالية
                // هذا يحاكي سلوك الكود الأصلي: "if (matched) break;"
                if (currentStrategyMatched) break;
            }
        }

        // إذا لم يتم العثور على أي مطابقة، أو بقي جزء غير مطابق
        if (!matched || compare(remainingSaleQty, 0) > 0) {
            // إضافة المتبقي كبند غير مطابق
            // ملاحظة: الكود الأصلي يضيف السجل الأصلي إذا لم يطابق شيء.
            // هنا نضيف المتبقي
            if (!matched) {
                bookInventoryList.push({
                    ...saleRecord,
                    'ملاحظات': 'لايوجد مشتريات',
                });
            } else {
                // إذا كان مطابق جزئي وبقي كمية، هل نضيفها؟ 
                // الكود الأصلي يعدل saleRecord['الكمية'] في الحلقة.
                // إذا خرج من الحلقة وكان matched=true، لا يضيف السجل "لا يوجد مشتريات".
                // لذا نتجاهل المتبقي كما في الكود الأصلي (أو نظرياً يبقى معلقاً)
            }
        }

        // تقرير تقدم كل 10%
        const progressInterval = Math.max(1, Math.floor(sortedSales.length * 0.1));
        if ((saleIdx + 1) % progressInterval === 0 || saleIdx === sortedSales.length - 1) {
            const percentage = ((saleIdx + 1) / sortedSales.length * 100).toFixed(0);
            console.log(`⏳ [BookInventory] ${saleIdx + 1}/${sortedSales.length} (${percentage}%)`);
        }
    }

    // ترقيم وتنسيق النتائج النهائية
    bookInventoryList.forEach((item, index) => {
        item['م'] = index + 1;
        // تنظيف الخاصية المؤقتة
        delete item._dateObj;
    });

    // الفرز النهائي للتقرير
    bookInventoryList.sort((a, b) => {
        const dateCompare = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
        if (dateCompare !== 0) return dateCompare;
        return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
    });

    const totalTime = performance.now() - startTime;
    console.log(`✅ [BookInventory] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${bookInventoryList.length} سجل`);

    return bookInventoryList;
};