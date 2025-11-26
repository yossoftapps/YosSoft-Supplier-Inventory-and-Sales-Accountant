import React, { useState } from 'react';
import { Typography, Table, Alert } from 'antd';

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

    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز_المادة', key: 'رمز_المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم_المادة', key: 'اسم_المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)
        },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ_الصلاحية', key: 'تاريخ_الصلاحية', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'تاريخ العملية', dataIndex: 'تاريخ_العملية', key: 'تاريخ_العملية', width: 120 },
        { title: 'نوع العملية', dataIndex: 'نوع_العملية', key: 'نوع_العملية', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 100, align: 'center' },
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير صافي المشتريات</Title>
            <p>عرض المشتريات بعد خصم المرتجعات المطابقة، والمرتجعات التي لم يتم مطابقتها.</p>

            <div style={{ marginBottom: 16 }}>
                <button onClick={() => setSelectedTab('netPurchases')} style={{ marginLeft: 8, padding: '8px 16px', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer' }}>عرض قائمة أ</button>
                <button onClick={() => setSelectedTab('orphanReturns')} style={{ padding: '8px 16px', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer' }}>عرض قائمة ب</button>
            </div>

            {selectedTab === 'netPurchases' && (
                <Table title={() => <strong>قائمة أ: المشتريات الفعلية ({data.netPurchasesList.length} سجل)</strong>} dataSource={data.netPurchasesList} columns={columns} rowKey="م" scroll={{ x: 1200 }} pagination={{ pageSize: 25 }} />
            )}
            {selectedTab === 'orphanReturns' && (
                <Table title={() => <strong>قائمة ب: المرتجعات اليتيمة ({data.orphanReturnsList.length} سجل)</strong>} dataSource={data.orphanReturnsList} columns={columns} rowKey="م" scroll={{ x: 1200 }} pagination={{ pageSize: 25 }} />
            )}
        </div>
    );
}

export default NetPurchasesPage;