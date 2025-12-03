import React, { useState } from 'react';
import { Typography, Table, Alert, Radio } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import PrintExportButtons from '../components/PrintExportButtons';

const { Title } = Typography;

function NetSalesPage({ data }) {
    const [selectedTab, setSelectedTab] = useState('netSales');

    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message="لا توجد بيانات" description="يرجى استيراد ملف Excel اولاً لمعالجة البيانات." type="info" showIcon />
            </div>
        );
    }

    // تم تصحيح اسماء dataIndex لتطابق اسماء الاعمدة في ملف Excel
    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => formatQuantity(text)
        },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => formatMoney(text)
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120 },
        { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية', key: 'تاريخ العملية', width: 120 },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 150, align: 'center' },
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير صافي المبيعات</Title>
            <p>عرض المبيعات بعد خصم المرتجعات المطابقة، والمرتجعات التي لم يتم مطابقتها.</p>

            {/* Print/Export buttons */}
            <PrintExportButtons 
                data={selectedTab === 'netSales' ? data.netSalesList : data.orphanReturnsList}
                title={`تقرير صافي المبيعات - ${selectedTab === 'netSales' ? 'قائمة ج: المبيعات الفعلية' : 'قائمة د: المرتجعات اليتيمة'}`}
                columns={columns}
                filename={selectedTab === 'netSales' ? 'net-sales' : 'orphan-returns'}
            />

            {/* استخدام Radio.Button لشكل افضل */}
            <Radio.Group value={selectedTab} onChange={(e) => setSelectedTab(e.target.value)} style={{ marginBottom: 16 }}>
                <Radio.Button value="netSales">قائمة ج: المبيعات الفعلية ({data.netSalesList.length})</Radio.Button>
                <Radio.Button value="orphanReturns">قائمة د: المرتجعات اليتيمة ({data.orphanReturnsList.length})</Radio.Button>
            </Radio.Group>

            {selectedTab === 'netSales' && (
                <Table
                    dataSource={data.netSalesList}
                    columns={columns}
                    rowKey="م"
                    scroll={{ x: 1200 }}
                    pagination={{ pageSize: 25 }}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <strong>الإجمالي</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                                <strong>
                                    {formatQuantity(data.netSalesList.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={6}></Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            )}
            {selectedTab === 'orphanReturns' && (
                <Table
                    dataSource={data.orphanReturnsList}
                    columns={columns}
                    rowKey="م"
                    scroll={{ x: 1200 }}
                    pagination={{ pageSize: 25 }}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <strong>الإجمالي</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                                <strong>
                                    {formatQuantity(data.orphanReturnsList.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={6}></Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            )}
        </div>
    );
}

export default NetSalesPage;