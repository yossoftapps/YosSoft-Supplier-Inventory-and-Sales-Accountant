import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

export const NEW_ITEMS_PERFORMANCE_DEFAULT_COLUMNS = [
  { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
  { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
  { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 200, align: 'left' },
  { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
  { title: 'الكمية الحالية', dataIndex: 'الكمية الحالية', key: 'الكمية الحالية', width: 110, align: 'center', render: v => formatQuantity(v) },
  { title: 'تاريخ أول شراء', dataIndex: 'تاريخ أول شراء', key: 'تاريخ أول شراء', width: 120, align: 'center' },
  { title: 'كمية الشراء الأولية', dataIndex: 'كمية الشراء الأولية', key: 'كمية الشراء الأولية', width: 120, align: 'center', render: v => formatQuantity(v) },
  { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 120, align: 'center', render: v => formatQuantity(v) },
  { title: 'نسبة تصريف الكمية (%)', dataIndex: 'نسبة تصريف الكمية (%)', key: 'نسبة تصريف الكمية (%)', width: 120, align: 'center', render: v => `${v}%` },
  { title: 'معدل البيع اليومي', dataIndex: 'معدل البيع اليومي', key: 'معدل البيع اليومي', width: 120, align: 'center', render: v => formatQuantity(v) },
  { title: 'الربح الإجمالي', dataIndex: 'الربح الإجمالي', key: 'الربح الإجمالي', width: 120, align: 'center', render: v => formatMoney(v) },
  { title: 'هامش الربح %', dataIndex: 'هامش الربح %', key: 'هامش الربح %', width: 100, align: 'center', render: v => `${v}%` },
  { title: 'مؤشر المخاطرة', dataIndex: 'مؤشر المخاطرة', key: 'مؤشر المخاطرة', width: 100, align: 'center' },
  { title: 'حالة الصنف', dataIndex: 'حالة الصنف', key: 'حالة الصنف', width: 120, align: 'center' },
  { title: 'خطوة المقترحة التالية', dataIndex: 'خطوة المقترحة التالية', key: 'خطوة المقترحة التالية', width: 160, align: 'left' }
];
