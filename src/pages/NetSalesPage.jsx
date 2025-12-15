import React, { useState, useMemo, useCallback } from 'react';
import { Typography, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { filterSalesData } from '../utils/dataFilter.js';
import { useTranslation } from 'react-i18next';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import CollapsibleSection from '../components/CollapsibleSection';

const { Title } = Typography;

function NetSalesPage({ data, allReportsData }) {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('netSales');
    const [filters, setFilters] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });

    // Apply filters to data using useMemo for performance
    const filteredData = useMemo(() => {
        if (!data) return { netSalesList: [], orphanReturnsList: [] };
        return filterSalesData(data, filters);
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
            netSalesList: sortData(filteredData.netSalesList),
            orphanReturnsList: sortData(filteredData.orphanReturnsList)
        };
    }, [filteredData, sortOrder]);

    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} />
            </div>
        );
    }

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
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => formatMoney(text)
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120 },
        { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية', key: 'تاريخ العملية', width: 120 },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 150, align: 'center' },
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

    return (
        <UnifiedPageLayout
            title={t('netSales')}
            description="عرض المبيعات بعد خصم المرتجعات المطابقة، والمرتجعات التي لم يتم مطابقتها."
            data={selectedTab === 'netSales' ? sortedData.netSalesList : sortedData.orphanReturnsList}
            columns={visibleColumns}
            filename={selectedTab === 'netSales' ? 'net-sales' : 'orphan-returns'}
            allReportsData={allReportsData}
            reportKey="netSales"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            filterData={data}
            filterDataType="sales"
            onFilterChange={setFilters}
        >
            <CollapsibleSection title="أدوات التنقل والتبويب">
                <NavigationTabs
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                    tabs={[
                        { value: 'netSales', label: `قائمة C: المبيعات الفعلية (${sortedData.netSalesList.length})` },
                        { value: 'orphanReturns', label: `قائمة D: المرتجعات اليتيمة (${sortedData.orphanReturnsList.length})` }
                    ]}
                />
            </CollapsibleSection>

            {selectedTab === 'netSales' && (
                <CollapsibleSection title={`قائمة C: المبيعات الفعلية (${sortedData.netSalesList.length} ${t('records')})`} defaultCollapsed={false}>
                    <UnifiedTable
                        dataSource={sortedData.netSalesList}
                        columns={visibleColumns}
                        rowKey="م"
                        title={`قائمة C: المبيعات الفعلية (${sortedData.netSalesList.length} ${t('records')})`}
                        scroll={{ x: 1200 }}
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
                                        {formatQuantity(sortedData.netSalesList.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                    </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={6}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        )}
                    />
                </CollapsibleSection>
            )}
            {selectedTab === 'orphanReturns' && (
                <CollapsibleSection title={`قائمة D: المرتجعات اليتيمة (${sortedData.orphanReturnsList.length} ${t('records')})`} defaultCollapsed={false}>
                    <UnifiedTable
                        dataSource={sortedData.orphanReturnsList}
                        columns={visibleColumns}
                        rowKey="م"
                        title={`قائمة D: المرتجعات اليتيمة (${sortedData.orphanReturnsList.length} ${t('records')})`}
                        scroll={{ x: 1200 }}
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
                                <Table.Summary.Cell index={5} colSpan={6}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        )}
                    />
                </CollapsibleSection>
            )}
        </UnifiedPageLayout>
    );
}

export default NetSalesPage;