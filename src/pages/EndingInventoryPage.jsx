import React, { useState } from 'react';
import { Typography, Table, Alert, Radio } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import PrintExportButtons from '../components/PrintExportButtons';

const { Title } = Typography;

function EndingInventoryPage({ data }) {
    const [selectedTab, setSelectedTab] = useState('endingInventory');

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
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 100, align: 'center' },
        {
            title: 'كمية المشتريات', dataIndex: 'كمية المشتريات', key: 'كمية المشتريات', width: 120, align: 'left',
            render: (text) => formatQuantity(text)
        },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => formatMoney(text)
        },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 100, align: 'center' },
        { title: 'بيان الحركة', dataIndex: 'بيان الحركة', key: 'بيان الحركة', width: 100, align: 'center' },
        {
            title: 'الاجمالي', dataIndex: 'الاجمالي', key: 'الاجمالي', width: 100, align: 'left',
            render: (text) => formatMoney(text)
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير المخزون النهائي</Title>
            <p>عرض نتيجة مطابقة الجرد الفعلي مع صافي المشتريات، مع إضافة المرتجعات اليتيمة.</p>

            {/* Print/Export buttons */}
            <PrintExportButtons 
                data={selectedTab === 'endingInventory' ? data.endingInventoryList : data.listB}
                title={`تقرير المخزون النهائي - ${selectedTab === 'endingInventory' ? 'المخزون النهائي' : 'قائمة ب: مرتجع المشتريات اليتيمة'}`}
                columns={columns}
                filename={selectedTab === 'endingInventory' ? 'ending-inventory' : 'orphan-purchase-returns'}
            />

            <Radio.Group value={selectedTab} onChange={(e) => setSelectedTab(e.target.value)} style={{ marginBottom: 16 }}>
                <Radio.Button value="endingInventory">المخزون النهائي ({data.endingInventoryList.length})</Radio.Button>
                <Radio.Button value="listB">قائمة ب: مرتجع المشتريات اليتيمة ({data.listB.length})</Radio.Button>
            </Radio.Group>

            {selectedTab === 'endingInventory' && (
                <Table
                    title={() => <strong>المخزون النهائي ({data.endingInventoryList.length} سجل)</strong>}
                    dataSource={data.endingInventoryList}
                    columns={columns}
                    rowKey="م"
                    scroll={{ x: 1800 }}
                    pagination={{ pageSize: 25 }}
                />
            )}
            {selectedTab === 'listB' && (
                <Table
                    title={() => <strong>قائمة ب: مرتجع المشتريات اليتيمة ({data.listB.length} سجل)</strong>}
                    dataSource={data.listB}
                    columns={columns} // يمكن استخدام نفس الاعمدة مع إخفاء بعضها إذا لزم الامر
                    rowKey="م"
                    scroll={{ x: 1800 }}
                    pagination={{ pageSize: 25 }}
                />
            )}
        </div>
    );
}

export default EndingInventoryPage;