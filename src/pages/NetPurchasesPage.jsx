import React, { useState } from 'react';
import { Typography, Table, Alert, Radio } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import PrintExportButtons from '../components/PrintExportButtons';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

function NetPurchasesPage({ data }) {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('netPurchases');

    // Diagnostic logs: print lengths and first records
    if (data) {
        console.log('[DIAG] NetPurchasesPage data.netPurchasesList.length:', data.netPurchasesList && data.netPurchasesList.length);
        if (data.netPurchasesList && data.netPurchasesList.length > 0) {
            console.log('[DIAG] NetPurchasesPage netPurchasesList sample:', data.netPurchasesList[0]);
        }
        console.log('[DIAG] NetPurchasesPage data.orphanReturnsList.length:', data.orphanReturnsList && data.orphanReturnsList.length);
        if (data.orphanReturnsList && data.orphanReturnsList.length > 0) {
            console.log('[DIAG] NetPurchasesPage orphanReturnsList sample:', data.orphanReturnsList[0]);
        }
    }
    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message={t('noData')} description={t('importExcelFirst')} type="info" showIcon />
            </div>
        );
    }

    // تم تعريف الاعمدة بناءً على هيئة ورقة "المشتريات" مع إضافة الاعمدة المحدثة
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
            title: 'كمية الجرد', dataIndex: 'كمية الجرد', key: 'كمية الجرد', width: 100, align: 'left',
            render: (text) => formatQuantity(text)
        },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => formatMoney(text)
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
            <Title level={4}>{t('netPurchases')}</Title>
            <p>عرض المشتريات بعد خصم المرتجعات المطابقة، والمرتجعات التي لم يتم مطابقتها، مع بيانات المطابقة مع الجرد الفعلي.</p>

            {/* Print/Export buttons */}
            <PrintExportButtons 
                data={selectedTab === 'netPurchases' ? data.netPurchasesList : data.orphanReturnsList}
                title={`${t('netPurchases')} - ${selectedTab === 'netPurchases' ? 'قائمة A: المشتريات الفعلية' : 'قائمة B: المرتجعات اليتيمة'}`}
                columns={columns}
                filename={selectedTab === 'netPurchases' ? 'net-purchases' : 'orphan-returns'}
            />

            <Radio.Group value={selectedTab} onChange={(e) => setSelectedTab(e.target.value)} style={{ marginBottom: 16 }}>
                <Radio.Button value="netPurchases">قائمة A: المشتريات الفعلية ({data.netPurchasesList.length})</Radio.Button>
                <Radio.Button value="orphanReturns">قائمة B: المرتجعات اليتيمة ({data.orphanReturnsList.length})</Radio.Button>
            </Radio.Group>

            {selectedTab === 'netPurchases' && (
                <Table
                    title={() => <strong>قائمة A: المشتريات الفعلية ({data.netPurchasesList.length} {t('records')})</strong>}
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
                                        <strong>{formatQuantity(totalQuantity)}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        <strong>{formatQuantity(totalInventoryQuantity)}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={6} colSpan={8}></Table.Summary.Cell>
                                </Table.Summary.Row>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong>الإجمالي الكلي</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong>
                                            {formatQuantity(data.netPurchasesList.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        <strong>
                                            {formatQuantity(data.netPurchasesList.reduce((sum, record) => sum + parseFloat(record['كمية الجرد'] || 0), 0))}
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
                    title={() => <strong>قائمة B: المرتجعات اليتيمة ({data.orphanReturnsList.length} {t('records')})</strong>}
                    dataSource={data.orphanReturnsList}
                    columns={columns} // يمكن استخدام نفس الاعمدة، ستكون الحقول الإضافية فارغة
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
                                    {formatQuantity(data.orphanReturnsList.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
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