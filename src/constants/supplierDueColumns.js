import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

export const SUPPLIER_DUE_DEFAULT_COLUMNS = [
    { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
    { title: 'رمز الحساب', dataIndex: 'رمز الحساب', key: 'رمز الحساب', width: 100, align: 'center' },
    { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 180, align: 'right' },
    { title: 'مدين', dataIndex: 'مدين', key: 'مدين', width: 100, align: 'center', render: val => formatMoney(val) },
    { title: 'دائن', dataIndex: 'دائن', key: 'دائن', width: 100, align: 'center', render: val => formatMoney(val) },
    {
        title: 'الرصيد', dataIndex: 'الرصيد', key: 'الرصيد', width: 120, align: 'center',
        render: val => formatMoney(val)
    },
    { title: 'الحساب المساعد', dataIndex: 'الحساب المساعد', key: 'الحساب المساعد', width: 150, align: 'right' },
    { title: 'قيمة المخزون', dataIndex: 'قيمة المخزون', key: 'قيمة المخزون', width: 110, align: 'center', render: val => formatMoney(val) },
    { title: 'الاستحقاق', dataIndex: 'الاستحقاق', key: 'الاستحقاق', width: 110, align: 'center', render: val => formatMoney(val) },
    { title: 'المبلغ المستحق', dataIndex: 'المبلغ المستحق', key: 'المبلغ المستحق', width: 120, align: 'center', render: val => formatMoney(val) },
    { title: 'مخزون مثالي', dataIndex: 'مخزون مثالي', key: 'مخزون مثالي', width: 110, align: 'center', render: val => formatMoney(val) },
    {
        title: 'الحد الأعلى',
        dataIndex: 'maxLimit',
        key: 'maxLimit',
        width: 120,
        align: 'center',
        render: (_, record) => {
            const dueAmount = parseFloat(record['المبلغ المستحق']) || 0;
            const idealStock = parseFloat(record['مخزون مثالي']) || 0;
            return formatMoney(dueAmount + idealStock);
        }
    },
    {
        title: 'بيان الاستحقاق',
        dataIndex: 'statement',
        key: 'statement',
        width: 120,
        align: 'right',
        render: (_, record) => {
            const dueAmount = parseFloat(record['المبلغ المستحق']) || 0;
            const balance = parseFloat(record['الرصيد']) || 0;
            const idealStock = parseFloat(record['مخزون مثالي']) || 0;
            const maxLimit = dueAmount + idealStock;

            if (dueAmount === 0 || balance >= 0) {
                return 'لا يوجد استحقاق';
            } else if (dueAmount === 0 && maxLimit > 0) {
                return 'حد اعلى';
            } else if (dueAmount > 0) {
                return 'استحقاق';
            } else {
                return '-';
            }
        }
    },
    { title: 'فائض المخزون', dataIndex: 'فائض المخزون', key: 'فائض المخزون', width: 110, align: 'center', render: val => formatMoney(val) },
    { title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 110, align: 'center', render: val => formatMoney(val) },
    { title: 'اصناف جديدة', dataIndex: 'اصناف جديدة', key: 'اصناف جديدة', width: 110, align: 'center', render: val => formatMoney(val) },
    { title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 110, align: 'center', render: val => formatMoney(val) },
    { title: 'منتهي', dataIndex: 'منتهي', key: 'منتهي', width: 110, align: 'center', render: val => formatMoney(val) },
    { title: 'راكد تماما', dataIndex: 'راكد تماما', key: 'راكد تماما', width: 110, align: 'center', render: val => formatMoney(val) },
    { title: 'قريب جدا', dataIndex: 'قريب جدا', key: 'قريب جدا', width: 110, align: 'center', render: val => formatMoney(val) },
    { title: 'مخزون زائد', dataIndex: 'مخزون زائد', key: 'مخزون زائد', width: 110, align: 'center', render: val => formatMoney(val) }
];
