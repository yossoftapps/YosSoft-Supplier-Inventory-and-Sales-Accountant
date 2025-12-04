import React, { useState } from 'react';
import { Typography, Table, Alert, Radio } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import PrintExportButtons from '../components/PrintExportButtons';

const { Title } = Typography;

function PhysicalInventoryPage({ data }) {
    const [selectedTab, setSelectedTab] = useState('listE');

    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message="لا توجد بيانات" description="يرجى استيراد ملف Excel اولاً لمعالجة البيانات." type="info" showIcon />
            </div>
        );
    }

    // تم تعريف الاعمدة بناءً على المخرجات النهائية للمنطق
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
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 100, align: 'center' },
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير الجرد الفعلي (المخزون الفعلي)</Title>
            <p>عرض الكميات الموجبة بعد التصفية، والكميات السالبة والمنتهية الصلاحية.</p>

            {/* Print/Export buttons */}
            <PrintExportButtons 
                data={selectedTab === 'listE' ? data.listE : data.listF}
                title={`تقرير الجرد الفعلي - ${selectedTab === 'listE' ? 'قائمة E: الكميات الموجبة' : 'قائمة F: الكميات السالبة والمنتهية'}`}
                columns={columns}
                filename={selectedTab === 'listE' ? 'positive-inventory' : 'negative-expired-inventory'}
            />

            <Radio.Group value={selectedTab} onChange={(e) => setSelectedTab(e.target.value)} style={{ marginBottom: 16 }}>
                <Radio.Button value="listE">قائمة E: الكميات الموجبة ({data.listE.length})</Radio.Button>
                <Radio.Button value="listF">قائمة F: الكميات السالبة والمنتهية ({data.listF.length})</Radio.Button>
            </Radio.Group>

            {selectedTab === 'listE' && (
                <Table
                    title={() => <strong>قائمة E: سجلات الكميات الموجبة (الكمية &gt; 0)</strong>}
                    dataSource={data.listE}
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
                                    {formatQuantity(data.listE.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={4}></Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            )}
            {selectedTab === 'listF' && (
                <Table
                    title={() => <strong>قائمة F: سجلات الكميات السالبة + الصلاحية المنتهية</strong>}
                    dataSource={data.listF}
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
                                    {formatQuantity(data.listF.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={4}></Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            )}
        </div>
    );
}

export default PhysicalInventoryPage;