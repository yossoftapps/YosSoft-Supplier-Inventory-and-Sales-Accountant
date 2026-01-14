import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

export const ITEM_PROFITABILITY_DEFAULT_COLUMNS = [
    { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
    { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
    { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'right' },
    { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
    { title: 'عدد عمليات البيع', dataIndex: 'عدد عمليات البيع', key: 'عدد عمليات البيع', width: 80, align: 'center' },
    { title: 'إجمالي الكمية المباعة', dataIndex: 'إجمالي الكمية المباعة', key: 'إجمالي الكمية المباعة', width: 100, align: 'center', render: v => formatQuantity(v) },
    { title: 'إجمالي قيمة المبيعات', dataIndex: 'إجمالي قيمة المبيعات', key: 'إجمالي قيمة المبيعات', width: 110, align: 'center', render: v => formatMoney(v) },
    { title: 'إجمالي تكلفة المبيعات', dataIndex: 'إجمالي تكلفة المبيعات', key: 'إجمالي تكلفة المبيعات', width: 110, align: 'center', render: v => formatMoney(v) },
    { title: 'إجمالي الربح', dataIndex: 'إجمالي الربح', key: 'إجمالي الربح', width: 110, align: 'center', render: v => formatMoney(v) },
    { title: 'نسبة هامش الربح %', dataIndex: 'نسبة هامش الربح %', key: 'نسبة هامش الربح %', width: 100, align: 'center', render: v => `${parseFloat(v) || 0}%` },
    {
        title: 'نسبة المساهمة في أرباح الشركة %', 
        dataIndex: 'contributionRatio', 
        key: 'contributionRatio', 
        width: 120, 
        align: 'center', 
        render: (_, record) => {
            const itemProfit = parseFloat(record['إجمالي الربح']) || 0;
            // سيتم حساب إجمالي الربح لجميع الأصناف في منطق البيانات
            return `${record['contributionRatio'] || 0}%`;
        }
    },
    {
        title: 'بيان الربحية', 
        dataIndex: 'profitStatement', 
        key: 'profitStatement', 
        width: 100, 
        align: 'center', 
        render: (_, record) => {
            const profit = parseFloat(record['إجمالي الربح']) || 0;
            const margin = parseFloat(record['نسبة هامش الربح %']) || 0;
            
            if (profit <= 0) {
                return 'خسارة';
            } else if (profit > 0 && margin >= 5) {
                return 'ربح';
            } else if (profit > 0 && margin < 5) {
                return 'ربح ضعيف';
            } else {
                return '-';
            }
        }
    }
];
