// ═══════════════════════════════════════════════════════════════════════════
// الجرد الفعلي - محسّن للأداء
// Physical Inventory - Performance Optimized
// 
// ⚠️ ملاحظة مهمة: التحسينات لا تؤثر على المنطق المحاسبي نهائياً
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

const sortByDate = (data, dateKey, direction = 'asc') => {
    return data.sort((a, b) => {
        const dateA = new Date(a[dateKey]);
        const dateB = new Date(b[dateKey]);
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
};

export const processPhysicalInventory = async (physicalInventoryRaw, purchasesRaw) => {
    const startTime = performance.now();
    console.log(`🚀 [PhysicalInventory] معالجة: ${physicalInventoryRaw?.length - 1 || 0} سجل`);

    // --- Start of new logic: Create a purchase lookup map ---
    const purchaseLookup = new Map();
    if (purchasesRaw && purchasesRaw.length > 1) {
        const purchases = convertToObjects(purchasesRaw);
        purchases.forEach(p => {
            const key = `${p['رمز المادة']}|${p['تاريخ الصلاحية']}`;
            if (!purchaseLookup.has(key)) {
                purchaseLookup.set(key, p['م']);
            }
            // Fallback by item code only
            const itemCodeKey = p['رمز المادة'];
            if (!purchaseLookup.has(itemCodeKey)) {
                purchaseLookup.set(itemCodeKey, p['م']);
            }
        });
    }
    // --- End of new logic ---

    // 1. التحويل والإعداد الاولي
    let inventory = convertToObjects(physicalInventoryRaw);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. المرحلة الاولى: إضافة الاعمدة المؤقتة (مع تحسين التواريخ)
    const inventoryWithMeta = [];
    for (let i = 0; i < inventory.length; i++) {
        if (i > 0 && i % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        const item = inventory[i];
        const quantity = roundToDecimalPlaces(item['الكمية'] || 0, 2);
        const expiryDateObj = new Date(item['تاريخ الصلاحية']);
        expiryDateObj.setHours(0, 0, 0, 0);
        const expiryVal = expiryDateObj.getTime();

        let notes = '';
        if (compare(quantity, 0) < 0) {
            notes = 'سالب';
        } else if (expiryVal <= today.getTime()) {
            notes = 'منتهي';
        } else {
            notes = 'موجب';
        }

        inventoryWithMeta.push({
            ...item,
            م: i + 1,
            الكمية: quantity,
            ملاحظات: notes,
            _expiryVal: expiryVal // Store numeric timestamp
        });
    }
    inventory = inventoryWithMeta;

    // 3. المرحلة الثانية: تحديد السجلات التي تحتاج معالجة
    const codesToProcess = new Set();
    inventory.forEach(item => {
        if (item['ملاحظات'] === 'سالب' || item['ملاحظات'] === 'منتهي') {
            codesToProcess.add(item['رمز المادة']);
        }
    });

    inventory = inventory.map(item => {
        if (item['ملاحظات'] === 'موجب' && codesToProcess.has(item['رمز المادة'])) {
            return { ...item, ملاحظات: 'معالجة' };
        }
        return item;
    });

    // 4. المرحلة الثالثة: الفرز المخصص
    const sortedForProcessing = [...inventory].sort((a, b) => {
        if (a['ملاحظات'] === 'موجب' && b['ملاحظات'] !== 'موجب') return 1;
        if (b['ملاحظات'] === 'موجب' && a['ملاحظات'] !== 'موجب') return -1;
        if (a['رمز المادة'] !== b['رمز المادة']) return a['رمز المادة'].localeCompare(b['رمز المادة']);
        if (a['ملاحظات'] !== b['ملاحظات']) return a['ملاحظات'].localeCompare(b['ملاحظات']);
        return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
    });

    // 5. المرحلة الرابعة: المعالجة والتصفية
    const processedInventory = [];
    const itemMap = new Map();

    for (const item of sortedForProcessing) {
        if (!itemMap.has(item['رمز المادة'])) {
            itemMap.set(item['رمز المادة'], []);
        }
        itemMap.get(item['رمز المادة']).push(item);
    }

    console.log(`🔄 [PhysicalInventory] معالجة ${itemMap.size} مادة فريدة...`);

    let processedCount = 0;
    for (const [code, items] of itemMap.entries()) {
        const negativeItems = items.filter(i => i['ملاحظات'] === 'سالب');
        const expiredItems = items.filter(i => i['ملاحظات'] === 'منتهي');
        const positiveItems = items.filter(i => i['ملاحظات'] === 'موجب' || i['ملاحظات'] === 'معالجة').sort((a, b) => new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']));

        // معالجة حسب المنطق الأصلي (بدون تغيير)
        if (negativeItems.length === 1 && items.length === 1) {
            processedInventory.push(negativeItems[0]);
            processedCount++;
            if (processedCount % 100 === 0) {
                console.log(`⏳ [PhysicalInventory] ${processedCount}/${itemMap.size}`);
            }
            continue;
        }

        if (negativeItems.length > 0) {
            for (const negItem of negativeItems) {
                let remainingNegQty = subtract(new Decimal(0), negItem['الكمية']);
                let fullyMatched = false;

                for (const posItem of positiveItems) {
                    if (compare(posItem['الكمية'], remainingNegQty) === 0) {
                        posItem['الكمية'] = new Decimal(0);
                        remainingNegQty = new Decimal(0);
                        fullyMatched = true;
                        break;
                    }
                }

                if (!fullyMatched && compare(remainingNegQty, 0) > 0) {
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

                if (compare(remainingNegQty, 0) > 0) {
                    negItem['الكمية'] = subtract(new Decimal(0), remainingNegQty);
                    processedInventory.push(negItem);
                }
            }
        }

        if (expiredItems.length === 1 && items.length === 1) {
            processedInventory.push(expiredItems[0]);
            processedCount++;
            if (processedCount % 100 === 0) {
                console.log(`⏳ [PhysicalInventory] ${processedCount}/${itemMap.size}`);
            }
            continue;
        }

        if (expiredItems.length > 0) {
            for (const expItem of expiredItems) {
                const targetPosItem = positiveItems.find(p => compare(p['الكمية'], 0) > 0);
                if (targetPosItem) {
                    targetPosItem['الكمية'] = add(targetPosItem['الكمية'], roundToDecimalPlaces(Math.abs(expItem['الكمية']), 2));
                    targetPosItem['ملاحظات'] = 'موجب';
                } else {
                    processedInventory.push(expItem);
                }
            }
        }

        positiveItems.forEach(p => {
            if (compare(p['الكمية'], 0) > 0) {
                p['ملاحظات'] = 'موجب';
                processedInventory.push(p);
            }
        });

        processedCount++;
        if (processedCount % 100 === 0) {
            console.log(`⏳ [PhysicalInventory] ${processedCount}/${itemMap.size}`);
        }
    }

    // 6. المرحلة الخامسة: التنظيف النهائي
    const finalInventory = processedInventory.map((item, index) => {
        let list = 'E';
        if (item['ملاحظات'] === 'سالب' || item['ملاحظات'] === 'منتهي') {
            list = 'F';
        }
        // --- Start of new logic: Find matching purchase record ID ---
        const key = `${item['رمز المادة']}|${item['تاريخ الصلاحية']}`;
        const itemCodeKey = item['رمز المادة'];
        let recordId = purchaseLookup.get(key) || purchaseLookup.get(itemCodeKey) || (index + 1).toString();
        // --- End of new logic ---

        return {
            ...item,
            'القائمة': list,
            'رقم السجل': recordId.toString(),
        };
    });

    const sortedFinalInventory = finalInventory.sort((a, b) => {
        if (a['رمز المادة'] !== b['رمز المادة']) {
            return a['رمز المادة'].localeCompare(b['رمز المادة']);
        }
        return new Date(a['تاريخ الصلاحية']) - new Date(b['تاريخ الصلاحية']);
    });

    sortedFinalInventory.forEach((item, index) => {
        item['م'] = index + 1;
        // Re-assign record ID based on the final sorted index if it was a fallback
        if (!purchaseLookup.has(`${item['رمز المادة']}|${item['تاريخ الصلاحية']}`) && !purchaseLookup.has(item['رمز المادة'])) {
           item['رقم السجل'] = (index + 1).toString();
        }
    });

    // 7. المرحلة السادسة: تقسيم البيانات
    const listE = sortedFinalInventory.filter(item => item['القائمة'] === 'E');
    const listF = sortedFinalInventory.filter(item => item['القائمة'] === 'F');

    const totalTime = performance.now() - startTime;
    console.log(`✅ [PhysicalInventory] مكتمل:`);
    console.log(`   ⏱️  ${totalTime.toFixed(0)}ms`);
    console.log(`   📊 ${listE.length} موجب (E) | ${listF.length} سالب/منتهي (F)`);

    return { listE, listF };
};