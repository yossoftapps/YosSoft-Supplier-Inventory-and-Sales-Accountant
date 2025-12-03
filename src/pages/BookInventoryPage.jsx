import React from 'react';
import { Typography, Table, Alert } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import PrintExportButtons from '../components/PrintExportButtons';

const { Title } = Typography;

function BookInventoryPage({ data }) {
    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message="لا توجد بيانات" description="يرجى استيراد ملف Excel اولاً لمعالجة البيانات." type="info" showIcon />
            </div>
        );
    }

    // تم تعريف الاعمدة بناءً على المخرجات النهائية للمنطق المحدث
    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => formatQuantity(text)
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120 },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => formatMoney(text)
        },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 120, align: 'center' },
        {
            title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 120, align: 'left',
            render: (text) => formatQuantity(text)
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير الجرد الدفتري</Title>
            <p>عرض نتيجة مطابقة صافي المبيعات مع صافي المشتريات حسب المفاتيح الاربعة المحددة.</p>

            {/* Print/Export buttons */}
            <PrintExportButtons 
                data={data}
                title="تقرير الجرد الدفتري"
                columns={columns}
                filename="book-inventory"
            />

            <Table
                title={() => <strong>الجرد الدفتري ({data.length} سجل)</strong>}
                dataSource={data}
                columns={columns}
                rowKey="م"
                scroll={{ x: 1800 }}
                pagination={{ pageSize: 25 }}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4}>
                            <strong>الإجمالي</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                            <strong>
                                {formatQuantity(data.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                            </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} colSpan={7}></Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </div>
    );
}

export default BookInventoryPage;