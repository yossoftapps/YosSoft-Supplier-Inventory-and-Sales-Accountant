import React, { useRef } from 'react';
import { Typography, Table, Alert, Button, Space, message } from 'antd';

const { Title } = Typography;

function BookInventoryPage({ data }) {
    const printRef = useRef();

    const handlePrint = () => {
        const printContent = printRef.current;
        const originalContents = document.body.innerHTML;
        
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    const handleExportCSV = () => {
        try {
            if (!data || data.length === 0) {
                message.warning('لا توجد بيانات للتصدير');
                return;
            }

            // إنشاء محتوى CSV
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => 
                Object.values(row).map(value => {
                    // التعامل مع القيم التي تحتوي على فواصل
                    const stringValue = String(value || '');
                    return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
                }).join(',')
            );
            
            const csvContent = [headers, ...rows].join('\n');
            
            // إنشاء ملف CSV وتنزيله
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `تقرير_الجرد_الدفتري_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            message.success('تم تصدير البيانات بنجاح');
        } catch (error) {
            console.error('خطأ في تصدير CSV:', error);
            message.error('حدث خطأ أثناء تصدير البيانات');
        }
    };

    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message="لا توجد بيانات" description="يرجى استيراد ملف Excel أولاً لمعالجة البيانات." type="info" showIcon />
            </div>
        );
    }

    // تم تعريف الأعمدة بناءً على المخرجات النهائية للمنطق المحدث
    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120 },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 120, align: 'center' },
        {
            title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 120, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)
        },
    ];

    return (
        <div style={{ padding: '20px' }} ref={printRef}>
            <Title level={4}>تقرير الجرد الدفتري</Title>
            <p>عرض نتيجة مطابقة صافي المبيعات مع صافي المشتريات حسب المفاتيح الأربعة المحددة.</p>

            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={handlePrint}>طباعة التقرير</Button>
                <Button onClick={handleExportCSV}>تصدير إلى CSV</Button>
            </Space>

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
                                {data.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0).toFixed(2)}
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