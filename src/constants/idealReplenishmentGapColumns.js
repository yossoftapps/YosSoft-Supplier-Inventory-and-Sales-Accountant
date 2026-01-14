import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

export const IDEAL_REPLENISHMENT_GAP_DEFAULT_COLUMNS = [
    { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
    { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
    { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
    { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
    { title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 110, align: 'center', render: v => formatQuantity(v) },
    { title: 'المبيعات', dataIndex: 'المبيعات', key: 'المبيعات', width: 110, align: 'center', render: v => formatMoney(v) },
    { title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'متوسط الاستهلاك اليومي', dataIndex: 'متوسط الاستهلاك اليومي', key: 'متوسط الاستهلاك اليومي', width: 140, align: 'center' },
    { title: 'الكمية المثالية للشراء', dataIndex: 'الكمية المثالية للشراء', key: 'الكمية المثالية للشراء', width: 150, align: 'center', render: v => formatQuantity(v) },
    { title: 'مدة استهلاك المخزون', dataIndex: 'مدة استهلاك المخزون', key: 'مدة استهلاك المخزون', width: 140, align: 'center' },
    { title: 'بيان الاحتياج', dataIndex: 'بيان الاحتياج', key: 'بيان الاحتياج', width: 140, align: 'right' }
];
