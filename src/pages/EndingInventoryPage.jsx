import React, { useState, useCallback, memo, useMemo } from 'react';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { useTranslation } from 'react-i18next';
import { filterEndingInventoryData } from '../utils/dataFilter.js';
import { Table } from 'antd';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import CollapsibleSection from '../components/CollapsibleSection';

// Memoized column definitions to prevent unnecessary re-renders
const getColumnDefinitions = () => [
    { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
    { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
    { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 200 }, // Added width to ensure proper display
    { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
    {
        title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
        render: (text) => formatQuantity(text)
    },
    { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120 },
    {
        title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
        render: (text) => formatMoney(text)
    },
    {
        title: 'الاجمالي', dataIndex: 'الاجمالي', key: 'الاجمالي', width: 100, align: 'left',
        render: (text) => formatMoney(text)
    },
    { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 120 },
    { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
    { title: 'عمر الصنف', dataIndex: 'عمر الصنف', key: 'عمر الصنف', width: 80, align: 'center', render: (text) => text ? `${text} يوم` : '-' },
    {
        title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 100, align: 'center',
        render: (text) => <strong style={{ color: '#096dd9' }}>{formatQuantity(parseFloat(text) || 0)}</strong>
    },
    {
        title: 'نسبة الفائض', dataIndex: 'نسبة الفائض', key: 'نسبة الفائض', width: 100, align: 'center',
        render: (text) => {
            const val = parseInt(text) || 0;
            return <span style={{ color: val < 0 ? 'orange' : (val > 0 ? '#1890ff' : 'green') }}>{text}</span>
        }
    },
    {
        title: 'فائض المخزون', dataIndex: 'فائض المخزون', key: 'فائض المخزون', width: 90, align: 'center',
        render: (text) => {
            const val = parseFloat(text) || 0;
            return <strong style={{ color: val < 0 ? '#cf1322' : (val > 0 ? '#1890ff' : 'green') }}>{formatQuantity(val)}</strong>
        }
    },
    {
        title: 'قيمة فائض المخزون', dataIndex: 'قيمة فائض المخزون', key: 'قيمة فائض المخزون', width: 110, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 90, align: 'left',
        render: (text) => {
            const value = parseFloat(text) || 0;
            return <strong>{formatQuantity(value)}</strong>
        }
    },
    {
        title: 'قيمة معد للارجاع', dataIndex: 'قيمة معد للارجاع', key: 'قيمة معد للارجاع', width: 110, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'مخزون مثالي', dataIndex: 'مخزون مثالي', key: 'مخزون مثالي', width: 90, align: 'center',
        render: (text) => {
            const value = parseFloat(text) || 0;
            return <strong style={{ color: '#1890ff' }}>{formatQuantity(value)}</strong>
        }
    },
    {
        title: 'قيمة مخزون مثالي', dataIndex: 'قيمة مخزون مثالي', key: 'قيمة مخزون مثالي', width: 110, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'صنف جديد', dataIndex: 'صنف جديد', key: 'صنف جديد', width: 90, align: 'center',
        render: (text) => {
            const value = parseFloat(text) || 0;
            return <strong style={{ color: value > 0 ? 'blue' : 'inherit' }}>{formatQuantity(value)}</strong>
        }
    },
    {
        title: 'قيمة صنف جديد', dataIndex: 'قيمة صنف جديد', key: 'قيمة صنف جديد', width: 110, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 90, align: 'left',
        render: (text) => {
            const value = parseFloat(text) || 0;
            return <strong style={{ color: value > 0 ? '#cf1322' : 'inherit' }}>{formatQuantity(value)}</strong>
        }
    },
    {
        title: 'قيمة الاحتياج', dataIndex: 'قيمة الاحتياج', key: 'قيمة الاحتياج', width: 110, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'بيان الصلاحية', dataIndex: 'بيان الصلاحية', key: 'بيان الصلاحية', width: 100, align: 'center',
        render: (text) => {
            let color = 'default';
            if (text === 'منتهي') color = 'red';
            else if (text === 'قريب جدا') color = 'volcano';
            else if (text === 'قريب') color = 'orange';
            else if (text === 'بعيد') color = 'green';
            return <span style={{ color: color, fontWeight: 'bold' }}>{text}</span>;
        }
    },
    { title: 'بيان الحركة', dataIndex: 'بيان الحركة', key: 'بيان الحركة', width: 100, align: 'center' },
    {
        title: 'بيان الحالة', dataIndex: 'الحالة', key: 'الحالة', width: 110, align: 'center',
        render: (text) => (
            <span style={{
                fontWeight: text === 'معد للارجاع' ? 'bold' : 'normal',
                color: text === 'معد للارجاع' ? 'red' : ((text === 'صنف جديد') ? 'blue' : 'inherit')
            }}>
                {text}
            </span>
        )
    },
    {
        title: 'البيان', dataIndex: 'البيان', key: 'البيان', width: 150, align: 'left',
        render: (text) => (
            <span style={{
                color: text && text.includes('منتهي') ? 'red' : 'inherit'
            }}>
                {text}
            </span>
        )
    },
    { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
    { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
    { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 100, align: 'center' },
];

const EndingInventoryPage = memo(({ data, allReportsData }) => {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('endingInventory');
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [filters, setFilters] = useState({});

    // Enhanced data validation
    if (!data || !data.endingInventoryList || !data.listB) {
        return (
            <div className="padding-lg">
                <UnifiedAlert
                    message={t('noData')}
                    description={t('importExcelFirst')}
                />
            </div>
        );
    }

    // Apply filters
    const filteredData = useMemo(() => {
        return filterEndingInventoryData(data, filters);
    }, [data, filters]);

    // Validate that lists are arrays
    const endingInventoryList = Array.isArray(filteredData.endingInventoryList) ? filteredData.endingInventoryList : [];
    const listB = Array.isArray(filteredData.listB) ? filteredData.listB : [];

    // Memoized column definitions
    const allColumns = useMemo(() => getColumnDefinitions(), []);

    // Filter columns based on visibility settings
    const visibleColumns = allColumns.filter(col =>
        columnVisibility[col.dataIndex || col.key] !== false
    );

    // Memoized tab change handler
    const handleTabChange = useCallback((e) => {
        setSelectedTab(e.target.value);
    }, []);

    return (
        <UnifiedPageLayout
            title={t('endingInventory')}
            description="عرض نتيجة مطابقة الجرد الفعلي مع صافي المشتريات، مع إضافة المرتجعات اليتيمة."
            data={selectedTab === 'endingInventory' ? endingInventoryList : listB}
            columns={visibleColumns}
            filename={selectedTab === 'endingInventory' ? 'ending-inventory' : 'orphan-purchase-returns'}
            allReportsData={allReportsData}
            reportKey="endingInventory"
            onColumnVisibilityChange={setColumnVisibility}
            onSortOrderChange={setSortOrder}
            onPaginationChange={setPagination}
            pagination={pagination}
            filterData={data}
            filterDataType="endingInventory"
            onFilterChange={setFilters}
        >
            <CollapsibleSection title="أدوات التنقل والتبويب">
                <NavigationTabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    tabs={[
                        { value: 'endingInventory', label: `المخزون النهائي (${endingInventoryList.length})` },
                        { value: 'listB', label: `قائمة B: مرتجع المشتريات اليتيمة (${listB.length})` }
                    ]}
                />
            </CollapsibleSection>

            {selectedTab === 'endingInventory' && (
                <CollapsibleSection title={`المخزون النهائي (${endingInventoryList.length} ${t('records')})`} defaultCollapsed={false}>
                    <UnifiedTable
                        dataSource={endingInventoryList}
                        columns={visibleColumns}
                        rowKey="م"
                        title={`المخزون النهائي (${endingInventoryList.length} ${t('records')})`}
                        scroll={{ x: 1800 }}
                        pagination={{
                            position: ['topRight', 'bottomRight'],
                            pageSize: pagination.pageSize,
                            showSizeChanger: true,
                            pageSizeOptions: ['25', '50', '100', '200']
                        }}
                        virtualized={endingInventoryList.length > 1000}
                        summary={(pageData) => {
                            let totalQuantity = 0;
                            let totalValue = 0;
                            
                            pageData.forEach((record) => {
                                totalQuantity += parseFloat(record['الكمية'] || 0);
                                totalValue += parseFloat(record['الاجمالي'] || 0);
                            });
                            
                            return (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong className="unified-table-summary">الإجمالي لهذه الصفحة</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong className="unified-table-summary">{formatQuantity(totalQuantity)}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5} colSpan={2}></Table.Summary.Cell>
                                    <Table.Summary.Cell index={7}>
                                        <strong className="unified-table-summary">{formatMoney(totalValue)}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={8} colSpan={21}></Table.Summary.Cell>
                                </Table.Summary.Row>
                            );
                        }}
                    />
                </CollapsibleSection>
            )}
            {selectedTab === 'listB' && (
                <CollapsibleSection title={`قائمة B: مرتجع المشتريات اليتيمة (${listB.length} ${t('records')})`} defaultCollapsed={false}>
                    <UnifiedTable
                        dataSource={listB}
                        columns={visibleColumns}
                        rowKey="م"
                        title={`قائمة B: مرتجع المشتريات اليتيمة (${listB.length} ${t('records')})`}
                        scroll={{ x: 1800 }}
                        pagination={{
                            position: ['topRight', 'bottomRight'],
                            pageSize: pagination.pageSize,
                            showSizeChanger: true,
                            pageSizeOptions: ['25', '50', '100', '200']
                        }}
                        virtualized={listB.length > 1000}
                        summary={(pageData) => {
                            let totalQuantity = 0;
                            
                            pageData.forEach((record) => {
                                totalQuantity += parseFloat(record['الكمية'] || 0);
                            });
                            
                            return (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong className="unified-table-summary">الإجمالي لهذه الصفحة</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong className="unified-table-summary">{formatQuantity(totalQuantity)}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5} colSpan={24}></Table.Summary.Cell>
                                </Table.Summary.Row>
                            );
                        }}
                    />
                </CollapsibleSection>
            )}
        </UnifiedPageLayout>
    );
});

export default EndingInventoryPage;