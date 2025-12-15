import React, { useState, useMemo, useCallback } from 'react';
import { Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { filterPurchasesData } from '../utils/dataFilter.js';
import { useTranslation } from 'react-i18next';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import CollapsibleSection from '../components/CollapsibleSection';
import SynchronizedHorizontalScrollbar from '../components/SynchronizedHorizontalScrollbar';

function NetPurchasesPage({ data, allReportsData }) {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('netPurchases');
    const [filters, setFilters] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    
// Refs for synchronized scrollbars (temporarily disabled)
    // const netPurchasesTableRef = useRef(null);
    // const orphanReturnsTableRef = useRef(null);

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
    
    // Apply filters to data using useMemo for performance
    const filteredData = useMemo(() => {
        if (!data) return { netPurchasesList: [], orphanReturnsList: [] };
        return filterPurchasesData(data, filters);
    }, [data, filters]);

    // Apply sorting to data
    const sortedData = useMemo(() => {
        if (!sortOrder.field || !sortOrder.order) {
            return filteredData;
        }

        const sortData = (dataArray) => {
            if (!dataArray || !Array.isArray(dataArray)) return dataArray;
            
            return [...dataArray].sort((a, b) => {
                const aValue = a[sortOrder.field];
                const bValue = b[sortOrder.field];
                
                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return sortOrder.order === 'asc' ? -1 : 1;
                if (bValue == null) return sortOrder.order === 'asc' ? 1 : -1;
                
                // Handle numeric values
                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sortOrder.order === 'asc' ? aNum - bNum : bNum - aNum;
                }
                
                // Handle string values
                const comparison = String(aValue).localeCompare(String(bValue));
                return sortOrder.order === 'asc' ? comparison : -comparison;
            });
        };

        return {
            netPurchasesList: sortData(filteredData.netPurchasesList),
            orphanReturnsList: sortData(filteredData.orphanReturnsList)
        };
    }, [filteredData, sortOrder]);

    // Define all columns
    const allColumns = [
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
            title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 100, align: 'left',
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

    // Filter columns based on visibility settings
    const visibleColumns = allColumns.filter(col => 
        columnVisibility[col.dataIndex || col.key] !== false
    );

    // Stable callbacks using useCallback to prevent infinite loops
    const handleColumnVisibilityChange = useCallback((newVisibility) => {
        setColumnVisibility(newVisibility);
    }, []);

    const handleSortOrderChange = useCallback((newSortOrder) => {
        setSortOrder(newSortOrder);
    }, []);

    const handlePaginationChange = useCallback((newPagination) => {
        setPagination(newPagination);
    }, []);

    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} />
            </div>
        );
    }

    return (
        <UnifiedPageLayout
            title={t('netPurchases')}
            description="عرض المشتريات بعد خصم المرتجعات المطابقة، والمرتجعات التي لم يتم مطابقتها، مع بيانات المطابقة مع الجرد الفعلي."
            data={selectedTab === 'netPurchases' ? sortedData.netPurchasesList : sortedData.orphanReturnsList}
            columns={visibleColumns}
            filename={selectedTab === 'netPurchases' ? 'net-purchases' : 'orphan-returns'}
            allReportsData={allReportsData}
            reportKey="netPurchases"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            filterData={data}
            filterDataType="purchases"
            onFilterChange={setFilters}
        >
            <CollapsibleSection title="أدوات التنقل والتبويب">
                <NavigationTabs
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                    tabs={[
                        { value: 'netPurchases', label: `قائمة A: المشتريات الفعلية (${sortedData.netPurchasesList.length})` },
                        { value: 'orphanReturns', label: `قائمة B: المرتجعات اليتيمة (${sortedData.orphanReturnsList.length})` }
                    ]}
                />
            </CollapsibleSection>

            {selectedTab === 'netPurchases' && (
                <CollapsibleSection title={`قائمة A: المشتريات الفعلية (${sortedData.netPurchasesList.length} ${t('records')})`} defaultCollapsed={false}>
                    <UnifiedTable
                        dataSource={sortedData.netPurchasesList}
                        columns={visibleColumns}
                        rowKey="م"
                        title={`قائمة A: المشتريات الفعلية (${sortedData.netPurchasesList.length} ${t('records')})`}
                        scroll={{ x: 1400 }}
                        pagination={{ 
                            position: ['topRight', 'bottomRight'], 
                            pageSize: pagination.pageSize, 
                            showSizeChanger: true, 
                            pageSizeOptions: ['25', '50', '100', '200'] 
                        }}
                        summary={(pageData) => {
                            let totalQuantity = 0;
                            let totalInventoryQuantity = 0;
                            let totalSalesQuantity = 0;

                            pageData.forEach((record) => {
                                totalQuantity += parseFloat(record['الكمية'] || 0);
                                totalInventoryQuantity += parseFloat(record['كمية الجرد'] || 0);
                                totalSalesQuantity += parseFloat(record['كمية المبيعات'] || 0);
                            });

                            return (
                                <>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={4}>
                                            <strong className="unified-table-summary">الإجمالي لهذه الصفحة</strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={4}>
                                            <strong className="unified-table-summary">{formatQuantity(totalQuantity)}</strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={5}>
                                            <strong className="unified-table-summary">{formatQuantity(totalInventoryQuantity)}</strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={6}>
                                            <strong className="unified-table-summary">{formatQuantity(totalSalesQuantity)}</strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={7} colSpan={8}></Table.Summary.Cell>
                                    </Table.Summary.Row>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={4}>
                                            <strong className="unified-table-summary">الإجمالي الكلي</strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={4}>
                                            <strong className="unified-table-summary">
                                                {formatQuantity(sortedData.netPurchasesList.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                            </strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={5}>
                                            <strong className="unified-table-summary">
                                                {formatQuantity(sortedData.netPurchasesList.reduce((sum, record) => sum + parseFloat(record['كمية الجرد'] || 0), 0))}
                                            </strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={6}>
                                            <strong className="unified-table-summary">
                                                {formatQuantity(sortedData.netPurchasesList.reduce((sum, record) => sum + parseFloat(record['كمية المبيعات'] || 0), 0))}
                                            </strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={7} colSpan={8}></Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </>
                            );
                        }}
                    />
                </CollapsibleSection>
            )}
            {selectedTab === 'orphanReturns' && (
                <CollapsibleSection title={`قائمة B: المرتجعات اليتيمة (${sortedData.orphanReturnsList.length} ${t('records')})`} defaultCollapsed={false}>
                    <UnifiedTable
                        dataSource={sortedData.orphanReturnsList}
                        columns={visibleColumns}
                        rowKey="م"
                        title={`قائمة B: المرتجعات اليتيمة (${sortedData.orphanReturnsList.length} ${t('records')})`}
                        scroll={{ x: 1400 }}
                        pagination={{ 
                            position: ['topRight', 'bottomRight'], 
                            pageSize: pagination.pageSize, 
                            showSizeChanger: true, 
                            pageSizeOptions: ['25', '50', '100', '200'] 
                        }}
                        summary={() => (
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">الإجمالي</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <strong className="unified-table-summary">
                                        {formatQuantity(sortedData.orphanReturnsList.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                    </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={10}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        )}
                    />
                </CollapsibleSection>
            )}
        </UnifiedPageLayout>
    );
}

export default NetPurchasesPage;