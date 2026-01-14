import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

const getTagColor = (status) => {
    switch (status) {
        case 'راكد تماما': return 'red';
        case 'احتياج': return 'orange';
        case 'مخزون زائد': return 'blue';
        case 'مناسب': return 'green';
        default: return 'default';
    }
};

export const EXCESS_INVENTORY_DEFAULT_COLUMNS = [
    { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
    { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'right' },
    { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
    { title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'كمية المشتريات', dataIndex: 'كمية المشتريات', key: 'كمية المشتريات', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'المبيعات', dataIndex: 'المبيعات', key: 'المبيعات', width: 100, align: 'center', render: v => formatQuantity(v) },
    {
        title: 'نسبة المبيعات',
        key: 'salesRatio',
        width: 90,
        align: 'center',
        render: (_, record) => {
            const sales = parseFloat(record['المبيعات']) || 0;
            const qty = parseFloat(record['الكمية']) || 0;
            let ratio = 0;
            if (qty !== 0) {
                ratio = (sales / qty) * 100;
            } else if (sales > 0) {
                ratio = 100;
            }
            return `${ratio.toFixed(1)}%`;
        }
    },
    { title: 'فائض المخزون', dataIndex: 'فائض المخزون', key: 'فائض المخزون', width: 110, align: 'center', render: v => formatQuantity(v) },
    { title: 'نسبة الفائض', dataIndex: 'نسبة الفائض', key: 'نسبة الفائض', width: 90, align: 'center', render: v => {
        const value = parseFloat(v) || 0;
        return `${value}%`;
    } },
    { title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'بيان الفائض', dataIndex: 'بيان الفائض', key: 'بيان الفائض', width: 120, align: 'right', render: v => v }
];
