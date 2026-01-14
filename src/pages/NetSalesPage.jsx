import React, { useState, useMemo, useCallback, memo } from 'react';
import { Typography, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { filterSalesData } from '../utils/dataFilter.js';
import { useTranslation } from 'react-i18next';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import CollapsibleSection from '../components/CollapsibleSection';
import { NET_SALES_DEFAULT_COLUMNS } from '../constants/netSalesColumns.js';

const { Title } = Typography;

const NetSalesPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('netSales');
    const [filters, setFilters] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 100 });
    const [density, setDensity] = useState('small');

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
                const comparison = safeString(aValue).localeCompare(safeString(bValue));
                return sortOrder.order === 'asc' ? comparison : -comparison;
            });
        };

        return {
            netSalesList: sortData(filteredData.netSalesList),
            orphanReturnsList: sortData(filteredData.orphanReturnsList)
        };
    }, [filteredData, sortOrder]);

    const grandTotals = useMemo(() => {
        const sum = (list, key) => list.reduce((acc, curr) => acc + parseFloat(curr[key] || 0), 0);
        const calculateTotalValue = (list) => {
            return list.reduce((total, record) => {
                const quantity = parseFloat(record['الكمية'] || 0);
                const price = parseFloat(record['الافرادي'] || 0);
                return total + (quantity * price);
            }, 0);
        };
        return {
            netSales: {
                qty: sum(sortedData.netSalesList, 'الكمية'),
                value: calculateTotalValue(sortedData.netSalesList)
            },
            orphanReturns: {
                qty: sum(sortedData.orphanReturnsList, 'الكمية'),
                value: calculateTotalValue(sortedData.orphanReturnsList)
            }
        };
    }, [sortedData]);

    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} />
            </div>
        );
    }

    // Use exported default columns
    const allColumns = NET_SALES_DEFAULT_COLUMNS;

    // Filter columns based on visibility settings - MEMOIZED to prevent unnecessary re-renders
    const visibleColumns = useMemo(() => {
        return NET_SALES_DEFAULT_COLUMNS.filter(col =>
            columnVisibility[col.dataIndex || col.key] !== false
        );
    }, [columnVisibility, t]);

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

    const handleDensityChange = useCallback((newDensity) => {
        setDensity(newDensity);
    }, []);

    return (
        <UnifiedPageLayout
            title={`${t('netSales')} (${selectedTab === 'netSales' ? sortedData.netSalesList.length : sortedData.orphanReturnsList.length} ${t('records')})`}
            description="عرض المبيعات بعد خصم المرتجعات المطابقة، والمرتجعات التي لم يتم مطابقتها."
            interpretation="يعرض هذا التقرير العمليات البيعية الصافية (Sales Minus Returns). يتم استبعاد المرتجعات التي تم العثور على أصل بيع لها، وتوضيح المرتجعات اليتيمة التي لم تُطابق مع عملية بيع في السجلات الحالية."
            data={selectedTab === 'netSales' ? sortedData.netSalesList : sortedData.orphanReturnsList}
            columns={visibleColumns}
            filename={selectedTab === 'netSales' ? 'net-sales' : 'orphan-returns'}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="netSales"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="sales"
            onFilterChange={setFilters}
            category="basic"
            exportColumns={NET_SALES_DEFAULT_COLUMNS}
        >

            {selectedTab === 'netSales' && (
                <UnifiedTable
                    headerExtra={
                        <NavigationTabs
                            value={selectedTab}
                            onChange={(e) => {
                                setSelectedTab(e.target.value);
                                setPagination(prev => ({ ...prev, current: 1 }));
                            }}
                            tabs={[
                                { value: 'netSales', label: `قائمة C: المبيعات الفعلية (${sortedData.netSalesList.length})` },
                                { value: 'orphanReturns', label: `قائمة D: المرتجعات اليتيمة (${sortedData.orphanReturnsList.length})` }
                            ]}
                        />
                    }
                    dataSource={sortedData.netSalesList}
                    pagination={{
                        ...pagination,
                        total: sortedData.netSalesList.length,
                        showSizeChanger: true
                    }}
                    onPaginationChange={handlePaginationChange}
                    size={density}
                    virtualized={false}
                    columns={visibleColumns}
                    rowKey="م"
                    title={`قائمة A: المبيعات الفعلية (${sortedData.netSalesList.length} ${t('records')})`}
                    scroll={{ x: 2500 }}
                    summary={(pageData) => {
                        let totalQty = 0;
                        let totalValue = 0;
                        pageData.forEach((record) => {
                            totalQty += parseFloat(record['الكمية'] || 0);
                            const quantity = parseFloat(record['الكمية'] || 0);
                            const price = parseFloat(record['الافرادي'] || 0);
                            totalValue += quantity * price;
                        });
                        return (
                            <>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong className="unified-table-summary">
                                            {formatQuantity(totalQty)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        <strong className="unified-table-summary">
                                            {formatMoney(totalValue)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={6} colSpan={5}></Table.Summary.Cell>
                                </Table.Summary.Row>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong className="unified-table-summary">
                                            {formatQuantity(grandTotals.netSales.qty)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        <strong className="unified-table-summary">
                                            {formatMoney(grandTotals.netSales.value)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={6} colSpan={5}></Table.Summary.Cell>
                                </Table.Summary.Row>
                            </>
                        );
                    }}
                />
            )}
            {selectedTab === 'orphanReturns' && (
                <UnifiedTable
                    headerExtra={
                        <NavigationTabs
                            value={selectedTab}
                            onChange={(e) => {
                                setSelectedTab(e.target.value);
                                setPagination(prev => ({ ...prev, current: 1 }));
                            }}
                            tabs={[
                                { value: 'netSales', label: `قائمة C: المبيعات الفعلية (${sortedData.netSalesList.length})` },
                                { value: 'orphanReturns', label: `قائمة D: المرتجعات اليتيمة (${sortedData.orphanReturnsList.length})` }
                            ]}
                        />
                    }
                    dataSource={sortedData.orphanReturnsList}
                    pagination={{
                        ...pagination,
                        total: sortedData.orphanReturnsList.length,
                        showSizeChanger: true
                    }}
                    onPaginationChange={handlePaginationChange}
                    size={density}
                    virtualized={false}
                    columns={visibleColumns}
                    rowKey="م"
                    title={`قائمة B: مرتجعات مبيعات يتيمة (${sortedData.orphanReturnsList.length} ${t('records')})`}
                    scroll={{ x: 2500 }}
                    summary={(pageData) => {
                        let totalQty = 0;
                        let totalValue = 0;
                        pageData.forEach((record) => {
                            totalQty += parseFloat(record['الكمية'] || 0);
                            const quantity = parseFloat(record['الكمية'] || 0);
                            const price = parseFloat(record['الافرادي'] || 0);
                            totalValue += quantity * price;
                        });
                        return (
                            <>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong className="unified-table-summary">
                                            {formatQuantity(totalQty)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        <strong className="unified-table-summary">
                                            {formatMoney(totalValue)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={6} colSpan={5}></Table.Summary.Cell>
                                </Table.Summary.Row>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong className="unified-table-summary">
                                            {formatQuantity(grandTotals.orphanReturns.qty)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        <strong className="unified-table-summary">
                                            {formatMoney(grandTotals.orphanReturns.value)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={6} colSpan={5}></Table.Summary.Cell>
                                </Table.Summary.Row>
                            </>
                        );
                    }}
                />
            )}
        </UnifiedPageLayout>
    );
});

export default NetSalesPage;