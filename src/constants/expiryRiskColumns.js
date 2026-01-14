import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

export const EXPIRY_RISK_DEFAULT_COLUMNS = [
    { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
    { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
    { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'right' },
    { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
    { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
    { title: 'الكمية الحالية', dataIndex: 'الكمية الحالية', key: 'الكمية الحالية', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120, align: 'center' },
    { title: 'الأيام المتبقية', dataIndex: 'الأيام المتبقية', key: 'الأيام المتبقية', width: 100, align: 'center' },
    { title: 'معدل البيع اليومي', dataIndex: 'معدل البيع اليومي', key: 'معدل البيع اليومي', width: 90, align: 'center', render: v => formatQuantity(Math.floor(parseFloat(v) || 0)) },
    { title: 'الكمية المتوقعة للبيع', dataIndex: 'الكمية المتوقعة للبيع', key: 'الكمية المتوقعة للبيع', width: 100, align: 'center', render: v => formatQuantity(Math.floor(parseFloat(v) || 0)) },
    { title: 'الخطر المتوقع', dataIndex: 'الخطر المتوقع', key: 'الخطر المتوقع', width: 100, align: 'center', render: (_, record) => {
        const currentQty = parseFloat(record['الكمية الحالية']) || 0;
        const expSales = parseFloat(record['الكمية المتوقعة للبيع']) || 0;
        const risk = currentQty - expSales;
        return formatQuantity(risk);
    }},
    { title: 'نسبة الخطر %', dataIndex: 'نسبة الخطر %', key: 'نسبة الخطر %', width: 100, align: 'center', render: (_, record) => {
        const currentQty = parseFloat(record['الكمية الحالية']) || 0;
        const expSales = parseFloat(record['الكمية المتوقعة للبيع']) || 0;
        const risk = currentQty - expSales;
        
        if (risk === currentQty) {
            return '100%';
        } else {
            return `${Math.floor((expSales / currentQty) * 100)}%`;
        }
    }},
    { title: 'بيان الانتهاء', dataIndex: 'بيان الانتهاء', key: 'بيان الانتهاء', width: 120, align: 'right', render: (_, record) => {
        const riskPercent = parseFloat(record['نسبة الخطر %']) || 0;
        
        if (riskPercent > 80) return 'خطير جدا';
        if (riskPercent > 60) return 'خطير';
        if (riskPercent > 40) return 'متوسط';
        if (riskPercent > 20) return 'قليل';
        return 'قليل جدا';
    }}
];
