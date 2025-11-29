import React from 'react';
import { Typography, Table, Alert, Tag } from 'antd';

const { Title } = Typography;

function SalesCostPage({ data }) {
    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message="لا توجد بيانات" description="يرجى استيراد ملف Excel أولاً لمعالجة البيانات." type="info" showIcon />
            </div>
        );
    }

    // دالة لتحديد لون "بيان الربحية" و "الملاحظات"
    const getTagProps = (status, type) => {
        if (type === 'profit') {
            switch (status) {
                case 'ربح': return { color: 'green' };
                case 'خسارة': return { color: 'red' };
                default: return { color: 'default' };
            }
        }
        if (type === 'notes') {
            switch (status) {
                case 'مطابق': return { color: 'green' };
                case 'لا يوجد مشتريات': return { color: 'orange' };
                default: return { color: 'default' };
            }
        }
        return {};
    };

    // تعريف أعمدة الجدول بناءً على مخرجات منطق التكلفة
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
        { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية', key: 'تاريخ العملية', width: 120 },
        { title: 'افرادي', dataIndex: 'افرادي', key: 'افرادي', width: 80, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'افرادي الشراء', dataIndex: 'افرادي الشراء', key: 'افرادي الشراء', width: 90, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
        {
            title: 'افرادي الربح', dataIndex: 'افرادي الربح', key: 'افرادي الربح', width: 100, align: 'left',
            render: (text) => {
                const value = parseInt(text, 10) || 0;
                return <strong style={{ color: value > 0 ? '#52c41a' : (value < 0 ? '#ff4d4f' : '#000') }}>{value.toLocaleString('ar-EG')}</strong>
            }
        },
        {
            title: 'نسبة الربح', dataIndex: 'نسبة الربح', key: 'نسبة الربح', width: 100, align: 'center',
            render: (text) => {
                const value = parseFloat(text) || 0;
                return <strong style={{ color: value > 0 ? '#52c41a' : (value < 0 ? '#ff4d4f' : '#000') }}>{value.toFixed(2)}%</strong>
            }
        },
        {
            title: 'اجمالي الربح', dataIndex: 'اجمالي الربح', key: 'اجمالي الربح', width: 110, align: 'left',
            render: (text) => {
                const value = parseInt(text, 10) || 0;
                return <strong style={{ color: value > 0 ? '#52c41a' : (value < 0 ? '#ff4d4f' : '#000') }}>{value.toLocaleString('ar-EG')}</strong>
            }
        },
        { title: 'عمر العملية', dataIndex: 'عمر العملية', key: 'عمر العملية', width: 100, align: 'center' },
        {
            title: 'بيان الربحية', dataIndex: 'بيان الربحية', key: 'بيان الربحية', width: 100, align: 'center',
            render: (text) => <Tag {...getTagProps(text, 'profit')}>{text}</Tag>
        },
        {
            title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 120, align: 'center',
            render: (text) => <Tag {...getTagProps(text, 'notes')}>{text}</Tag>
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير تكلفة المبيعات</Title>
            <p>عرض تكلفة وربحية كل عملية بيع، مع تحديد تكلفة الشراء المطابقة.</p>

            <Table
                title={() => <strong>تحليل تكلفة المبيعات ({data.length} عملية)</strong>}
                dataSource={data}
                columns={columns}
                rowKey="م"
                scroll={{ x: 2000 }}
                pagination={{ pageSize: 25 }}
                summary={(pageData) => {
                    let totalProfit = 0;
                    let totalQuantity = 0;

                    pageData.forEach((record) => {
                        totalProfit += parseInt(record['اجمالي الربح'] || 0);
                        totalQuantity += parseFloat(record['الكمية'] || 0);
                    });

                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong>الإجمالي لهذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <strong>{totalQuantity.toFixed(2)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={8}></Table.Summary.Cell>
                                <Table.Summary.Cell index={13}>
                                    <strong style={{ color: totalProfit > 0 ? '#52c41a' : (totalProfit < 0 ? '#ff4d4f' : '#000') }}>
                                        {totalProfit.toLocaleString('ar-EG')}
                                    </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={14} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong>الإجمالي الكلي</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <strong>
                                        {data.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0).toFixed(2)}
                                    </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={8}></Table.Summary.Cell>
                                <Table.Summary.Cell index={13}>
                                    <strong style={{ color: data.reduce((sum, record) => sum + parseInt(record['اجمالي الربح'] || 0), 0) > 0 ? '#52c41a' : (data.reduce((sum, record) => sum + parseInt(record['اجمالي الربح'] || 0), 0) < 0 ? '#ff4d4f' : '#000') }}>
                                        {data.reduce((sum, record) => sum + parseInt(record['اجمالي الربح'] || 0), 0).toLocaleString('ar-EG')}
                                    </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={14} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </div>
    );
}

export default SalesCostPage;