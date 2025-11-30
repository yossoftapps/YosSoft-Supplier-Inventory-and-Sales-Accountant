import React, { useState } from 'react';
import { Typography, Table, Alert, Radio } from 'antd';

const { Title } = Typography;

function NetPurchasesPage({ data }) {
    const [selectedTab, setSelectedTab] = useState('netPurchases');

    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message="لا توجد بيانات" description="يرجى استيراد ملف Excel أولاً لمعالجة البيانات." type="info" showIcon />
            </div>
        );
    }

    // تم تعريف الأعمدة بناءً على هيئة ورقة "المشتريات" مع إضافة الأعمدة المحدثة
    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)
        },
        {
            title: 'كمية الجرد', dataIndex: 'كمية الجرد', key: 'كمية الجرد', width: 100, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)
        },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية', key: 'تاريخ العملية', width: 120 },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 100, align: 'center' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 120, align: 'center' },
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير صافي المشتريات</Title>
            <p>عرض المشتريات بعد خصم المرتجعات المطابقة، والمرتجعات التي لم يتم مطابقتها، مع بيانات المطابقة مع الجرد الفعلي.</p>

            <Radio.Group value={selectedTab} onChange={(e) => setSelectedTab(e.target.value)} style={{ marginBottom: 16 }}>
                <Radio.Button value="netPurchases">قائمة أ: المشتريات الفعلية ({data.netPurchasesList.length})</Radio.Button>
                <Radio.Button value="orphanReturns">قائمة ب: المرتجعات اليتيمة ({data.orphanReturnsList.length})</Radio.Button>
            </Radio.Group>

            {selectedTab === 'netPurchases' && (
                <Table
                    title={() => <strong>قائمة أ: المشتريات الفعلية ({data.netPurchasesList.length} سجل)</strong>}
                    dataSource={data.netPurchasesList}
                    columns={columns}
                    rowKey="م"
                    scroll={{ x: 1400 }}
                    pagination={{ pageSize: 25 }}
                    summary={(pageData) => {
                        let totalQuantity = 0;
                        let totalInventoryQuantity = 0;

                        pageData.forEach((record) => {
                            totalQuantity += parseFloat(record['الكمية'] || 0);
                            totalInventoryQuantity += parseFloat(record['كمية الجرد'] || 0);
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
                                    <Table.Summary.Cell index={5}>
                                        <strong>{totalInventoryQuantity.toFixed(2)}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={6} colSpan={8}></Table.Summary.Cell>
                                </Table.Summary.Row>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong>الإجمالي الكلي</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong>
                                            {data.netPurchasesList.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0).toFixed(2)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        <strong>
                                            {data.netPurchasesList.reduce((sum, record) => sum + parseFloat(record['كمية الجرد'] || 0), 0).toFixed(2)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={6} colSpan={8}></Table.Summary.Cell>
                                </Table.Summary.Row>
                            </>
                        );
                    }}
                />
            )}
            {selectedTab === 'orphanReturns' && (
                <Table
                    title={() => <strong>قائمة ب: المرتجعات اليتيمة ({data.orphanReturnsList.length} سجل)</strong>}
                    dataSource={data.orphanReturnsList}
                    columns={columns} // يمكن استخدام نفس الأعمدة، ستكون الحقول الإضافية فارغة
                    rowKey="م"
                    scroll={{ x: 1400 }}
                    pagination={{ pageSize: 25 }}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <strong>الإجمالي</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                                <strong>
                                    {data.orphanReturnsList.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0).toFixed(2)}
                                </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={9}></Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            )}
        </div>
    );
}

export default NetPurchasesPage;