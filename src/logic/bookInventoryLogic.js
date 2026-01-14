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

import { convertToObjects } from '../utils/dataUtils.js';

const sortByDateDesc = (data, dateKey) => {
    return data.sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]));
};

/**
 * حساب الجرد الدفتري بتطبيق 4 مفاتيح مطابقة
 * تم التحسين باستخدام الفهارس (Map) لتسريع عملية البحث
 */
export const calculateBookInventory = async (netPurchasesList, netSalesList) => {
    const startTime = performance.now();

    const netPurchases = Array.isArray(netPurchasesList) && netPurchasesList.length > 0 && Array.isArray(netPurchasesList[0])
        ? convertToObjects(netPurchasesList)
        : netPurchasesList;

    const netSales = Array.isArray(netSalesList) && netSalesList.length > 0 && Array.isArray(netSalesList[0])
        ? convertToObjects(netSalesList)
        : netSalesList;

    console.log(`🚀 [BookInventory] معالجة: ${netPurchases.length} مشتريات، ${netSales.length} مبيعات`);

    // 1. فهرسة المشتريات حسب رمز المادة وترتيبها تنازلياً بالتاريخ
    // نستخدم فقط سجلات صافي المشتريات التي كمية الجرد فيها = 0 وفق المتطلبات
    const purchasesByItem = new Map();
    netPurchases.forEach(p => {
        const qtyJard = p['كمية الجرد'] !== undefined ? p['كمية الجرد'] : 0;
        if (compare(qtyJard, 0) !== 0) return; // تجاهل المشتريات ذات كمية جرد غير صفرية

        const d = new Date(p['تاريخ العملية']);
        const item = {
            ...p,
            _dateVal: d.getTime(),
            _orig: p,
            // Ensure record number and total exist
            'رقم السجل': p['رقم السجل'] || p['م'] || null,
            'الإجمالي': multiply(p['الكمية'] || 0, p['الافرادي'] || 0)
        };
        const code = item['رمز المادة'];
        if (!purchasesByItem.has(code)) {
            purchasesByItem.set(code, []);
        }
        purchasesByItem.get(code).push(item);
    });

    // فرز كل قائمة مشتريات مرة واحدة فقط
    purchasesByItem.forEach(list => {
        list.sort((a, b) => {
            const dateDiff = b._dateVal - a._dateVal;
            if (dateDiff !== 0) return dateDiff;
            return a['م'] - b['م'];
        });
    });

    const sortedSales = sortByDateDesc([...netSales], 'تاريخ العملية');
    let bookInventoryList = [];

    // تعريف دوال المطابقة طبقاً للمواصفات (مفاتيح 1..4)
    // المفتاح 1: (رمز المادة، تاريخ الصلاحية، الكمية) + تاريخ صافي المبيعات >= تاريخ صافي المشتريات
    // المفتاح 2: (رمز المادة، تاريخ الصلاحية) + تاريخ صافي المبيعات >= تاريخ صافي المشتريات
    // المفتاح 3: (رمز المادة) + تاريخ صافي المبيعات >= تاريخ صافي المشتريات
    // المفتاح 4: (رمز المادة) + تاريخ صافي المبيعات أصغر من تاريخ صافي المشتريات بثلاثة أيام كحد أقصى
    const strategies = [
        (p, s, pDate, sDate, keyIdx) => (retcond(sDate, pDate) && p['تاريخ الصلاحية'] === s['تاريخ الصلاحية'] && compare(p['الكمية'], s['الكمية']) === 0),
        (p, s, pDate, sDate, keyIdx) => (retcond(sDate, pDate) && p['تاريخ الصلاحية'] === s['تاريخ الصلاحية']),
        (p, s, pDate, sDate, keyIdx) => (retcond(sDate, pDate) && true),
        (p, s, pDate, sDate, keyIdx) => (pDate > sDate && (pDate - sDate) <= 3 * 24 * 60 * 60 * 1000)
    ];

    // small helper to enforce the base date condition used in keys 1..3
    const retcond = (sDate, pDate) => sDate >= pDate;

    for (let saleIdx = 0; saleIdx < sortedSales.length; saleIdx++) {
        // Yield every 500 records
        if (saleIdx > 0 && saleIdx % 500 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        const saleRecord = sortedSales[saleIdx];
        const saleDateVal = new Date(saleRecord['تاريخ العملية']).getTime();

        let remainingSaleQty = roundToDecimalPlaces(saleRecord['الكمية'] || 0, 2);
        let matched = false;

        // الحصول على قائمة المشتريات المرشحة (نفس المادة)
        const candidates = purchasesByItem.get(saleRecord['رمز المادة']);

        if (candidates) {
            // تجربة الاستراتيجيات بالترتيب (تنفيذ مفاتيح 1..4 بدقة)
            for (let strategyIdx = 0; strategyIdx < strategies.length; strategyIdx++) {
                const strategyFn = strategies[strategyIdx];
                let currentStrategyMatched = false;

                // المرور على المشتريات المرشحة (المرتبة من الأحدث إلى الأقدم)
                for (let i = 0; i < candidates.length; i++) {
                    const purchaseRecord = candidates[i];

                    // تجاوز المشتريات المستهلكة
                    if (compare(purchaseRecord['الكمية'], 0) <= 0) continue;

                    // تحقق الاستراتيجية الحالية
                    if (!strategyFn(purchaseRecord, saleRecord, purchaseRecord._dateVal, saleDateVal, strategyIdx + 1)) continue;

                    const purchaseQty = purchaseRecord['الكمية'];

                    // Prepare mutual record ids
                    const saleRecId = saleRecord['رقم السجل'] || saleRecord['م'];
                    const purchaseRecId = purchaseRecord['رقم السجل'] || purchaseRecord['م'];

                    if (compare(purchaseQty, remainingSaleQty) >= 0) {
                        // الشراء يغطي البيع بالكامل (مطابقة كلية)
                        // نُحدث كميات السجل الرئيسي ونُسجل السجل المطابق
                        purchaseRecord['الكمية'] = subtract(purchaseQty, remainingSaleQty);
                        purchaseRecord['ملاحظات'] = `مطابق (مفتاح ${strategyIdx + 1})`;

                        // سجل المطابقة (يمثل الجزء المطابق)
                        const matchedQty = remainingSaleQty;
                        const matchedRow = {
                            ...purchaseRecord,
                            'كمية المبيعات': matchedQty,
                            'ملاحظات': `مطابق (مفتاح ${strategyIdx + 1})`,
                            'نوع العملية': 'مشتريات',
                            'رقم السجل': purchaseRecId
                        };

                        // Update cross-references on original objects
                        saleRecord['رقم السجل'] = purchaseRecId;
                        if (purchaseRecord._orig) purchaseRecord._orig['رقم السجل'] = saleRecId;

                        // Accumulate كمية المبيعات on original purchase
                        if (purchaseRecord._orig) {
                            purchaseRecord._orig['كمية المبيعات'] = (purchaseRecord._orig['كمية المبيعات'] || new Decimal(0));
                            purchaseRecord._orig['كمية المبيعات'] = add(purchaseRecord._orig['كمية المبيعات'], matchedQty);
                        }

                        bookInventoryList.push(matchedRow);

                        remainingSaleQty = new Decimal(0);
                        currentStrategyMatched = true;
                        matched = true;
                        break;
                    } else {
                        // الشراء يغطي جزء من البيع (مطابقة جزئية)
                        // نستهلك كامل الكمية في الشراء ونُسجل جزء المطابقة
                        purchaseRecord['الكمية'] = new Decimal(0);
                        purchaseRecord['ملاحظات'] = `مطابق جزئي (مفتاح ${strategyIdx + 1})`;

                        const matchedQty = purchaseQty;
                        const matchedRow = {
                            ...purchaseRecord,
                            'كمية المبيعات': matchedQty,
                            'ملاحظات': `مطابق جزئي (مفتاح ${strategyIdx + 1})`,
                            'نوع العملية': 'مشتريات',
                            'رقم السجل': purchaseRecId
                        };

                        // Update cross-references on original objects
                        saleRecord['رقم السجل'] = purchaseRecId;
                        if (purchaseRecord._orig) purchaseRecord._orig['رقم السجل'] = saleRecId;

                        // Accumulate كمية المبيعات on original purchase
                        if (purchaseRecord._orig) {
                            purchaseRecord._orig['كمية المبيعات'] = (purchaseRecord._orig['كمية المبيعات'] || new Decimal(0));
                            purchaseRecord._orig['كمية المبيعات'] = add(purchaseRecord._orig['كمية المبيعات'], matchedQty);
                        }

                        bookInventoryList.push(matchedRow);

                        remainingSaleQty = subtract(remainingSaleQty, purchaseQty);
                        currentStrategyMatched = true;
                        matched = true;
                        // نستمر للعثور على مشتريات أخرى تغطي الباقي
                    }
                }

                // إذا حدثت أي مطابقة بهذه الاستراتيجية، نتوقف عن الانتقال للاستراتيجية التالية
                if (currentStrategyMatched) break;
            }

            // بعد تجربة كل المفاتيح، إذا بقي سهم من البيع ولم يتم تغطيته
            if (compare(remainingSaleQty, 0) > 0) {
                // نضيف السجل المتبقي كسجل مبيعات غير مطابق
                bookInventoryList.push({
                    ...saleRecord,
                    'الكمية': remainingSaleQty,
                    'ملاحظات': !matched ? 'لايوجد مشتريات' : 'مطابق جزئي',
                    'نوع العملية': 'مبيعات',
                    'م': null // سيتم اعادة ترقيم لاحقاً
                });
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

    // تحديث ملاحظات المشتريات الأصلية بناءً على كمية المبيعات
    purchasesByItem.forEach(list => {
        list.forEach(item => {
            if (item._orig) {
                const soldQty = item._orig['كمية المبيعات'] || 0;
                item._orig['ملاحظات'] = compare(soldQty, 0) > 0 ? 'مبيعات' : 'لايوجد مبيعات';
            }
        });
    });

    // ترقيم وتنسيق النتائج النهائية
    // الفرز النهائي للتقرير: تاريخ العملية (تنازلي)، ثم م (تصاعدي)، ثم تاريخ الصلاحية (تصاعدي)
    bookInventoryList.sort((a, b) => {
        const dateCompare = new Date(b['تاريخ العملية']) - new Date(a['تاريخ العملية']);
        if (dateCompare !== 0) return dateCompare;
        const mDiff = (a['م'] || 0) - (b['م'] || 0);
        if (mDiff !== 0) return mDiff;
        const aExp = a['تاريخ الصلاحية'] ? new Date(a['تاريخ الصلاحية']) : new Date(8640000000000000);
        const bExp = b['تاريخ الصلاحية'] ? new Date(b['تاريخ الصلاحية']) : new Date(8640000000000000);
        return aExp - bExp;
    });

    bookInventoryList.forEach((item, index) => {
        item['م'] = index + 1;
        // تنظيف الخاصية المؤقتة
        delete item._dateVal;
    });

    const totalTime = performance.now() - startTime;
    console.log(`✅ [BookInventory] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${bookInventoryList.length} سجل`);

    return bookInventoryList;
};