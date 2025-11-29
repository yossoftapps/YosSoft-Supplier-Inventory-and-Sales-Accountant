import React from 'react';
import { Typography, Table, Alert, Tag } from 'antd';

const { Title } = Typography;

function ExcessInventoryPage({ data }) {
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
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير فائض المخزون</Title>
            <p>حساب الفارق بين إجمالي الكميات في المخزون والمبيعات خلال آخر 90 يومًا.</p>

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