import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

export const NET_SALES_DEFAULT_COLUMNS = [
  { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
  { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
  { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'right' },
  { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
  { title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'center', render: (v) => formatQuantity(v) },
  { title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'center', render: (v) => formatMoney(v) },
  {
    title: 'الاجمالي',
    dataIndex: 'الاجمالي',
    key: 'الاجمالي',
    width: 110,
    align: 'center',
    render: (text, record) => {
      const quantity = parseFloat(record['الكمية']) || 0;
      const price = parseFloat(record['الافرادي']) || 0;
      return formatMoney(quantity * price);
    }
  },
  { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120, align: 'center' },
  { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 150, align: 'right' },
  { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية', key: 'تاريخ العملية', width: 110, align: 'center' },
  { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 90, align: 'center' },
  { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
  { title: 'كمية الجرد', dataIndex: 'كمية الجرد', key: 'كمية الجرد', width: 100, align: 'center', render: (v) => formatQuantity(v) },
  { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 100, align: 'center', render: (v) => formatQuantity(v) },
  { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 150, align: 'right' },
  { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 120, align: 'center' }
];