import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

export const ENDING_INVENTORY_DEFAULT_COLUMNS = [
    { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
    { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
    { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'right' },
    { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
    { title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'center', render: v => formatMoney(v) },
    { title: 'الاجمالي', dataIndex: 'الاجمالي', key: 'الاجمالي', width: 110, align: 'center', render: v => formatMoney(v) },
    { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 110, align: 'center' },
    { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 150, align: 'right' },
    { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 110, align: 'center' },
    { title: 'عمر الصنف', dataIndex: 'عمر الصنف', key: 'عمر الصنف', width: 90, align: 'center', render: v => v ? `${v} يوم` : '-' },
    { title: 'كمية المبيعات', dataIndex: 'salesQty', key: 'salesQty', width: 100, align: 'center', render: (_, record) => {
        const qty = parseFloat(record['الكمية']) || 0;
        const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
        const salesQty = Math.floor(qty * (excessRatio / 100));
        return formatQuantity(salesQty);
    }},
    { title: 'مخزون مثالي', dataIndex: 'idealStock', key: 'idealStock', width: 100, align: 'center', render: (_, record) => {
        const qty = parseFloat(record['الكمية']) || 0;
        const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
        const idealStock = qty * (excessRatio / 100);
        return formatQuantity(idealStock);
    }},
    { title: 'فائض المخزون', dataIndex: 'excessInventory', key: 'excessInventory', width: 110, align: 'center', render: (_, record) => {
        const qty = parseFloat(record['الكمية']) || 0;
        const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
        const excessInventory = qty * (excessRatio / 100);
        return formatQuantity(excessInventory);
    }},
    { title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 110, align: 'center', render: v => formatQuantity(v) },
    { title: 'صنف جديد', dataIndex: 'isNewItem', key: 'isNewItem', width: 100, align: 'center', render: (_, record) => {
        const itemAge = parseFloat(record['عمر الصنف']) || 0;
        const qty = parseFloat(record['الكمية']) || 0;
        return itemAge <= 90 ? formatQuantity(qty) : '-';
    }},
    { title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'نسبة الفائض', dataIndex: 'نسبة الفائض', key: 'نسبة الفائض', width: 90, align: 'center', render: v => `${parseFloat(v) || 0}%` },
    { title: 'بيان الصلاحية', dataIndex: 'بيان الصلاحية', key: 'بيان الصلاحية', width: 120, align: 'right', render: v => v },
    { title: 'بيان الحركة', dataIndex: 'بيان الحركة', key: 'بيان الحركة', width: 120, align: 'right' },
    { title: 'بيان الحالة', dataIndex: 'الحالة', key: 'الحالة', width: 120, align: 'right', render: v => v },
    { title: 'البيان', dataIndex: 'البيان', key: 'البيان', width: 120, align: 'right', render: v => v },
    { title: 'قيمة مخزون مثالي', dataIndex: 'valueIdealStock', key: 'valueIdealStock', width: 120, align: 'center', render: (_, record) => {
        const itemAge = parseFloat(record['عمر الصنف']) || 0;
        const qty = parseFloat(record['الكمية']) || 0;
        const unitPrice = parseFloat(record['الافرادي']) || 0;
        if (itemAge <= 90) return formatMoney(qty * unitPrice);
        const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
        const idealStock = qty * (excessRatio / 100);
        return formatMoney(idealStock * unitPrice);
    }},
    { title: 'قيمة فائض المخزون', dataIndex: 'valueExcessInventory', key: 'valueExcessInventory', width: 120, align: 'center', render: (_, record) => {
        const qty = parseFloat(record['الكمية']) || 0;
        const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
        const unitPrice = parseFloat(record['الافرادي']) || 0;
        const excessInventory = qty * (excessRatio / 100);
        return formatMoney(excessInventory * unitPrice);
    }},
    { title: 'قيمة معد للارجاع', dataIndex: 'valueReturns', key: 'valueReturns', width: 120, align: 'center', render: (_, record) => {
        const returns = parseFloat(record['معد للارجاع']) || 0;
        const unitPrice = parseFloat(record['الافرادي']) || 0;
        return formatMoney(returns * unitPrice);
    }},
    { title: 'قيمة صنف جديد', dataIndex: 'valueNewItem', key: 'valueNewItem', width: 120, align: 'center', render: (_, record) => {
        const itemAge = parseFloat(record['عمر الصنف']) || 0;
        const qty = parseFloat(record['الكمية']) || 0;
        const unitPrice = parseFloat(record['الافرادي']) || 0;
        return itemAge <= 90 ? formatMoney(qty * unitPrice) : formatMoney(0);
    }},
    { title: 'قيمة الاحتياج', dataIndex: 'valueNeed', key: 'valueNeed', width: 120, align: 'center', render: (_, record) => {
        const need = parseFloat(record['الاحتياج']) || 0;
        const unitPrice = parseFloat(record['الافرادي']) || 0;
        return formatMoney(need * unitPrice);
    }},
    { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 120, align: 'center' },
    { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
    { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 150, align: 'right' }
];
