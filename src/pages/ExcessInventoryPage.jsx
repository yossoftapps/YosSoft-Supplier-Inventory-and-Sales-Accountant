import React, { useRef } from 'react';
import { Typography, Table, Alert, Tag, Button, Space, message } from 'antd';

const { Title } = Typography;

function ExcessInventoryPage({ data }) {
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
            link.setAttribute('download', `تقرير_فائض_المخزون_${new Date().toISOString().slice(0, 10)}.csv`);
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

    // دالة لتحديد لون "بيان الفائض" لتسهيل القراءة
    const getTagColor = (status) => {
        switch (status) {
            case 'راكد تماما': return 'red';
            case 'احتياج': return 'orange';
            case 'مخزون زائد': return 'blue';
            case 'مناسب': return 'green';
            default: return 'default';
        }
    };

    // تعريف أعمدة الجدول بناءً على مخرجات المنطق
    const columns = [
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)
        },
        {
            title: 'المبيعات (90 يوم)', dataIndex: 'المبيعات', key: 'المبيعات', width: 120, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)
        },
        {
            title: 'فائض المخزون', dataIndex: 'فائض المخزون', key: 'فائض المخزون', width: 120, align: 'left',
            render: (text) => {
                const value = parseFloat(text) || 0;
                return <strong style={{ color: value < 0 ? '#cf1322' : (value > 0 ? '#1890ff' : '#52c41a') }}>{value.toFixed(2)}</strong>
            }
        },
        {
            title: 'بيان الفائض', dataIndex: 'بيان الفائض', key: 'بيان الفائض', width: 120, align: 'center',
            render: (text) => <Tag color={getTagColor(text)}>{text}</Tag>
        },
    ];

    return (
        <div style={{ padding: '20px' }} ref={printRef}>
            <Title level={4}>تقرير فائض المخزون</Title>
            <p>حساب الفارق بين إجمالي الكميات في المخزون والمبيعات خلال آخر 90 يومًا.</p>

            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={handlePrint}>طباعة التقرير</Button>
                <Button onClick={handleExportCSV}>تصدير إلى CSV</Button>
            </Space>

            <Table
                title={() => <strong>تحليل فائض المخزون ({data.length} صنف)</strong>}
                dataSource={data}
                columns={columns}
                rowKey="رمز المادة"
                scroll={{ x: 900 }}
                pagination={{ pageSize: 25 }}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                            <strong>الإجمالي الكلي</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                            <strong>
                                {data.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0).toFixed(2)}
                            </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                            <strong>
                                {data.reduce((sum, record) => sum + parseFloat(record['المبيعات'] || 0), 0).toFixed(2)}
                            </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                            <strong>
                                {data.reduce((sum, record) => sum + parseFloat(record['فائض المخزون'] || 0), 0).toFixed(2)}
                            </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6}></Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </div>
    );
}

export default ExcessInventoryPage;