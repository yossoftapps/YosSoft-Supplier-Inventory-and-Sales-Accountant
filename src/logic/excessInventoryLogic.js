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

export const calculateExcessInventory = (physicalInventoryRaw, salesRaw) => {
    console.log('--- بدء معالجة فائض المخزون ---');

    // 1. تحويل البيانات
    const physicalInventory = convertToObjects(physicalInventoryRaw);
    const allSales = convertToObjects(salesRaw);

    // 2. حساب تاريخ قبل 90 يومًا من اليوم
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    // 3. تجميع المبيعات لكل مادة خلال آخر 90 يومًا
    const salesMap = new Map();
    for (const sale of allSales) {
        if (sale['نوع العملية'] === 'مبيعات') {
            const saleDate = new Date(sale['تاريخ العملية']);
            if (saleDate >= ninetyDaysAgo) {
                const code = sale['رمز المادة'];
                const quantity = parseFloat(sale['الكمية']) || 0;
                salesMap.set(code, (salesMap.get(code) || 0) + quantity);
            }
        }
    }

    // 4. تجميع الكميات الإجمالية لكل مادة من المخزون الفعلي
    const inventoryMap = new Map();
    for (const item of physicalInventory) {
        const code = item['رمز المادة'];
        const quantity = parseFloat(item['الكمية']) || 0;
        if (!inventoryMap.has(code)) {
            inventoryMap.set(code, {
                'رمز المادة': code,
                'اسم المادة': item['اسم المادة'],
                'الوحدة': item['الوحدة'],
                'الكمية': 0,
            });
        }
        inventoryMap.get(code)['الكمية'] += quantity;
    }

    // 5. إنشاء التقرير النهائي بحساب الفائض وبيانه
    const excessInventoryReport = [];
    for (const [code, inventoryItem] of inventoryMap.entries()) {
        const totalQuantity = inventoryItem['الكمية'];
        const totalSales = salesMap.get(code) || 0;
        const excess = totalQuantity - totalSales;

        let statusText = '';
        if (totalSales === 0 && totalQuantity > 0) {
            statusText = 'راكد تماما';
        } else if (excess < 0) {
            statusText = 'احتياج';
        } else if (excess > 0) {
            statusText = 'مخزون زائد';
        } else {
            statusText = 'مناسب';
        }

        excessInventoryReport.push({
            ...inventoryItem,
            'المبيعات': totalSales,
            'فائض المخزون': excess,
            'بيان الفائض': statusText,
        });
    }

    console.log('--- انتهت معالجة فائض المخزون ---');
    console.log('تقرير فائض المخزون:', excessInventoryReport);

    return excessInventoryReport;
};