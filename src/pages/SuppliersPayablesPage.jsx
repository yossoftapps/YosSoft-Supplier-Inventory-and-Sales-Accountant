import React, { useRef } from 'react';
import { Typography, Table, Alert, Button, Space, message } from 'antd';

const { Title } = Typography;

function SuppliersPayablesPage({ data }) {
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
            link.setAttribute('download', `تقرير_استحقاق_الموردين_${new Date().toISOString().slice(0, 10)}.csv`);
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

    // تعريف أعمدة الجدول بناءً على مخرجات منطق استحقاق الموردين
    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز الحساب', dataIndex: 'رمز الحساب', key: 'رمز الحساب', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'مدين', dataIndex: 'مدين', key: 'مدين', width: 100, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'دائن', dataIndex: 'دائن', key: 'دائن', width: 100, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'الحساب المساعد', dataIndex: 'الحساب المساعد', key: 'الحساب المساعد' },
        
        // أعمدة الجدول المضافة
        { title: 'الرصيد', dataIndex: 'الرصيد', key: 'الرصيد', width: 100, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'قيمة المخزون', dataIndex: 'قيمة المخزون', key: 'قيمة المخزون', width: 120, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'الاستحقاق', dataIndex: 'الاستحقاق', key: 'الاستحقاق', width: 100, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'المبلغ المستحق', dataIndex: 'المبلغ المستحق', key: 'المبلغ المستحق', width: 120, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'راكد تماما', dataIndex: 'راكد تماما', key: 'راكد تماما', width: 110, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'مخزون زائد', dataIndex: 'مخزون زائد', key: 'مخزون زائد', width: 110, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 100, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'أصناف جديدة', dataIndex: 'أصناف جديدة', key: 'أصناف جديدة', width: 110, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'منتهي', dataIndex: 'منتهي', key: 'منتهي', width: 100, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'قريب جدا', dataIndex: 'قريب جدا', key: 'قريب جدا', width: 100, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 110, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
    ];

    return (
        <div style={{ padding: '20px' }} ref={printRef}>
            <Title level={4}>تقرير استحقاق الموردين</Title>
            <p>عرض أرصدة الموردين مضافًا إليها قيمة المخزون الحالي، مع تفصيل قيمة المخزون حسب حالته.</p>

            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={handlePrint}>طباعة التقرير</Button>
                <Button onClick={handleExportCSV}>تصدير إلى CSV</Button>
            </Space>

            <Table
                title={() => <strong>ملخص استحقاق الموردين ({data.length} مورد)</strong>}
                dataSource={data}
                columns={columns}
                rowKey="رمز الحساب"
                scroll={{ x: 2200 }}
                pagination={{ pageSize: 25 }}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                            <strong>الإجمالي الكلي</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['مدين'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['دائن'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}></Table.Summary.Cell>
                        <Table.Summary.Cell index={6}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['الرصيد'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['قيمة المخزون'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['الاستحقاق'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={9}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['المبلغ المستحق'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={10}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['راكد تماما'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={11}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['مخزون زائد'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={12}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['الاحتياج'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={13}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['أصناف جديدة'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={14}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['منتهي'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={15}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['قريب جدا'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={16}>
                            <strong>{data.reduce((sum, record) => sum + parseInt(record['معد للارجاع'] || 0), 0).toLocaleString('ar-EG')}</strong>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </div>
    );
}

export default SuppliersPayablesPage;