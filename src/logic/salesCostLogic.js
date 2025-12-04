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
const sortByDateAsc = (data, dateKey) => {
    return data.sort((a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
};

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
// ensure divide is available

/**
 * حساب تكلفة المبيعات بتطبيق 4 مفاتيح مطابقة حسب الاولوية كما ورد في المواصفات
 * @param {Object} netPurchasesResult - نتيجة صافي المشتريات
 * @param {Object} netSalesResult - نتيجة صافي المبيعات
 * @returns {Array} قائمة بعمليات البيع مع تكلفة الشراء المطابقة
 */
export const calculateSalesCost = (netPurchasesResult, netSalesResult) => {
    console.log('--- بدء حساب تكلفة المبيعات ---');
    
    // الحصول على قوائم البيانات
    const purchases = [...(netPurchasesResult.netPurchasesList || [])];
    const sales = [...(netSalesResult.netSalesList || [])];
    
    // فرز المشتريات حسب التاريخ تصاعدياً (الاقدم اولاً)
    const sortedPurchases = sortByDateAsc(purchases, 'تاريخ العملية');
    
    // إنشاء نسخة عمل من المشتريات لتتبع الكميات المتبقية
    const purchaseStock = sortedPurchases.map(p => ({
        ...p,
        remainingQuantity: roundToDecimalPlaces(p['الكمية'] || 0, 2)
    }));
    
    // معالجة كل عملية بيع لحساب تكلفتها
    // 3-3-04-00 حسب مفاتيح المطابقة بالترتيب التالي:-
    // 3-3-04-01 الشرط الاساسي للمطابقة تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
    // 3-3-04-02 مفتاح مطابقة رقم 1:- (رمز المادة، تاريخ الصلاحية، الكمية) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
    // 3-3-04-03 مفتاح مطابقة رقم 2:- (رمز المادة، تاريخ الصلاحية) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
    // 3-3-04-04 مفتاح مطابقة رقم 3:- (رمز المادة) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
    // 3-3-04-05 مفتاح مطابقة رقم 4:- (رمز المادة) + تاريخ صافي المبيعات اصغر من تاريخ صافي المشتريات بثلاثة ايام كحد اقصى
    
    const getMatchingKeys = (saleRecord) => [
        // المفتاح 1:- (رمز المادة، تاريخ الصلاحية، الكمية) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
        (p) => new Date(saleRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === saleRecord['رمز المادة'] &&
            p['تاريخ الصلاحية'] === saleRecord['تاريخ الصلاحية'] &&
            compare(p['الكمية'], saleRecord['الكمية']) === 0,

        // المفتاح 2:- (رمز المادة، تاريخ الصلاحية) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
        (p) => new Date(saleRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === saleRecord['رمز المادة'] &&
            p['تاريخ الصلاحية'] === saleRecord['تاريخ الصلاحية'],

        // المفتاح 3:- (رمز المادة) + تاريخ صافي المبيعات اكبر او يساوي تاريخ صافي المشتريات
        (p) => new Date(saleRecord['تاريخ العملية']) >= new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === saleRecord['رمز المادة'],

        // المفتاح 4:- (رمز المادة) + تاريخ صافي المبيعات اصغر من تاريخ صافي المشتريات بثلاثة ايام كحد اقصى
        (p) => new Date(p['تاريخ العملية']) - new Date(saleRecord['تاريخ العملية']) <= 3 * 24 * 60 * 60 * 1000 &&
            new Date(saleRecord['تاريخ العملية']) < new Date(p['تاريخ العملية']) &&
            p['رمز المادة'] === saleRecord['رمز المادة'],
    ];
    
    const salesWithCost = sales.map((sale, index) => {
        // استخدام الحسابات المالية الدقيقة
        const saleQuantity = roundToDecimalPlaces(sale['الكمية'] || 0, 2);
        let remainingSaleQty = saleQuantity;
        let totalCost = new Decimal(0);
        let purchaseDetails = [];
        let matched = false;
        let notes = 'لايوجد مشتريات';
        
        const matchingKeys = getMatchingKeys(sale);
        
        // جرب كل مفتاح بالترتيب
        for (let keyIndex = 0; keyIndex < matchingKeys.length; keyIndex++) {
            if (compare(remainingSaleQty, 0) <= 0) break;
            
            const keyFunction = matchingKeys[keyIndex];
            
            // البحث عن جميع السجلات المطابقة مع هذا المفتاح
            let matchingPurchases = purchaseStock.filter(
                p => compare(p.remainingQuantity, 0) > 0 && keyFunction(p)
            );
            
            // ترتيب السجلات المطابقة: الاقدم اولاً
            matchingPurchases.sort((a, b) => new Date(a['تاريخ العملية']) - new Date(b['تاريخ العملية']));
            
            // ⭐ الحلقة الداخلية: استنزال من كل السجلات المطابقة بنفس المفتاح وفقاً للترتيب
            for (const purchase of matchingPurchases) {
                if (compare(remainingSaleQty, 0) <= 0) break;
                
                // حساب الكمية التي يمكن خصمها من هذا السجل
                const quantityToTake = compare(purchase.remainingQuantity, remainingSaleQty) < 0 
                    ? purchase.remainingQuantity 
                    : remainingSaleQty;
                
                // حساب تكلفة هذه الكمية باستخدام الحسابات المالية الدقيقة
                const unitPrice = roundToInteger(purchase['الافرادي'] || 0);
                const costOfTaken = multiply(quantityToTake, unitPrice);
                
                // تحديث الكمية المتبقية في سجل الشراء
                purchase.remainingQuantity = subtract(purchase.remainingQuantity, quantityToTake);
                
                // إضافة التكلفة إلى إجمالي تكلفة البيع
                totalCost = add(totalCost, costOfTaken);
                
                // تخزين تفاصيل الشراء المطابق
                purchaseDetails.push({
                    purchaseDate: purchase['تاريخ العملية'],
                    purchaseUnitPrice: unitPrice,
                    quantityMatched: quantityToTake,
                    purchaseBatch: purchase['رقم السجل']
                });
                
                // تحديث الكمية المتبقية من البيع
                remainingSaleQty = subtract(remainingSaleQty, quantityToTake);
                matched = true;
                notes = 'مطابق';
                
                // إذا تم تغطية كامل كمية البيع، نتوقف
                if (compare(remainingSaleQty, 0) <= 0) break;
            }
            
            // إذا تم العثور على مطابقة، نتوقف عن تجربة المفاتيح الاخرى
            if (matched) break;
        }
        
        // حساب القيم المطلوبة باستخدام الحسابات المالية الدقيقة
        const saleUnitPrice = roundToInteger(sale['الافرادي'] || 0);
        const totalSaleValue = multiply(saleQuantity, saleUnitPrice);
        const totalProfit = subtract(totalSaleValue, totalCost);
        const profitMargin = compare(totalCost, 0) > 0 
            ? multiply(divide(totalProfit, totalCost), 100) 
            : new Decimal(0);
        const saleDate = new Date(sale['تاريخ العملية']);
        const purchaseDate = purchaseDetails.length > 0 ? new Date(purchaseDetails[0].purchaseDate) : null;
        const inventoryAge = purchaseDate ? Math.floor((saleDate - purchaseDate) / (1000 * 60 * 60 * 24)) : 0;
        
        // تحديد حالة الربحية
        let profitabilityStatus = 'مطابق';
        if (compare(totalProfit, 0) > 0) {
            profitabilityStatus = 'ربح';
        } else if (compare(totalProfit, 0) < 0) {
            profitabilityStatus = 'خسارة';
        }
        
        // تحديد الملاحظات
        if (compare(remainingSaleQty, 0) > 0 && matched) {
            notes = 'لا يوجد مشتريات كافية';
        } else if (!matched) {
            notes = 'لايوجد مشتريات';
        }
        
        // حساب افرادي الشراء بأمان
        let purchaseUnitPrice = new Decimal(0);
        if (compare(totalCost, 0) > 0 && compare(saleQuantity, 0) > 0) {
            try {
                purchaseUnitPrice = roundToInteger(divide(totalCost, saleQuantity));
            } catch (e) {
                purchaseUnitPrice = new Decimal(0);
            }
        }
        
        // حساب افرادي الربح بأمان
        let profitUnitPrice = saleUnitPrice;
        if (compare(purchaseUnitPrice, 0) > 0) {
            try {
                profitUnitPrice = roundToInteger(subtract(saleUnitPrice, purchaseUnitPrice));
            } catch (e) {
                profitUnitPrice = saleUnitPrice;
            }
        }
        
        return {
            'م': index + 1,
            'رمز المادة': sale['رمز المادة'],
            'اسم المادة': sale['اسم المادة'],
            'الوحدة': sale['الوحدة'],
            'الكمية': formatQuantity(saleQuantity), // استخدام التنسيق المحدد للمبالغ
            'تاريخ الصلاحية': sale['تاريخ الصلاحية'],
            'تاريخ العملية': sale['تاريخ العملية'],
            'الافرادي': formatMoney(saleUnitPrice), // استخدام التنسيق المحدد للمبالغ
            'افرادي الشراء': formatMoney(purchaseUnitPrice),
            'تاريخ الشراء': purchaseDetails.length > 0 ? purchaseDetails[0].purchaseDate : '',
            'المورد': purchaseDetails.length > 0 ? purchaseDetails[0].purchaseBatch : '',
            'رقم السجل': sale['رقم السجل'],
            'افرادي الربح': formatMoney(profitUnitPrice),
            'نسبة الربح': roundToInteger(profitMargin).toString() + '%',
            'اجمالي الربح': formatMoney(totalProfit),
            'عمر العملية': inventoryAge.toString(),
            'بيان الربحية': profitabilityStatus,
            'ملاحظات': notes
        };
    });
    
    console.log('--- انتهت عملية حساب تكلفة المبيعات ---');
    console.log('عدد عمليات البيع مع التكلفة:', salesWithCost.length, 'عملية');

    // Return an object to be consistent with other logic result shapes
    return {
        costOfSalesList: salesWithCost
    };
};