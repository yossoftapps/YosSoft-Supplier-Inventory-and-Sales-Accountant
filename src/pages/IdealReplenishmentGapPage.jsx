import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import safeString from '../utils/safeString.js';
import { IDEAL_REPLENISHMENT_GAP_DEFAULT_COLUMNS } from '../constants/idealReplenishmentGapColumns.js';

const IdealReplenishmentGapPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});
    const [selectedTab, setSelectedTab] = useState('all');

    // Data source: prefer passed-in data (from lazy loader) else take from allReportsData.excessInventory
    const pageDataSource = useMemo(() => {
        if (data && Array.isArray(data)) return data;
        if (!allReportsData?.excessInventory?.data) return [];
        return allReportsData.excessInventory.data.filter(item => item['بيان الفائض'] === 'احتياج');
    }, [data, allReportsData]);

    if (!pageDataSource || pageDataSource.length === 0) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message="لا توجد بيانات" description="لا توجد عناصر مصنفة كـ 'احتياج' في تقرير فائض المخزون." />
            </div>
        );
    }

    // Apply Filters (simple search)
    const filteredData = useMemo(() => {
        const smartSearch = safeString(filters.smartSearch).toLowerCase();
        if (!smartSearch) return pageDataSource;
        return pageDataSource.filter(item => Object.values(item).some(val => safeString(val).toLowerCase().includes(smartSearch)));
    }, [pageDataSource, filters]);

    const tabsArray = useMemo(() => {
        const arr = [{ value: 'all', label: `الكل (${filteredData.length})` }];
        return arr;
    }, [filteredData]);

    const activeList = filteredData;

    const allColumns = IDEAL_REPLENISHMENT_GAP_DEFAULT_COLUMNS;
    const visibleColumns = useMemo(() => allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false), [columnVisibility]);

    const grandTotals = useMemo(() => ({
        qty: activeList.reduce((s, r) => s + (parseFloat(r['الكمية']) || 0), 0),
        need: activeList.reduce((s, r) => s + (parseFloat(r['الاحتياج']) || 0), 0),
        ideal: activeList.reduce((s, r) => s + (parseFloat(r['الكمية المثالية للشراء']) || 0), 0)
    }), [activeList]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    return (
        <UnifiedPageLayout
            title={`فجوة الشراء المثالية (${activeList.length} سجل)`}
            description="تقرير يحدد الكميات المثالية للطلبية بناءً على الاحتياج ومعدلات الاستهلاك والسجل الشرائي." 
            interpretation="يساعدك على معرفة أي الأصناف تحتاج شراءًا عاجلاً أو قريبًا بناءً على مدة استهلاك المخزون وسرعة البيع." 
            data={activeList}
            columns={visibleColumns}
            filename={`ideal_replenishment_gap`}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="idealReplenishmentGap"
            exportColumns={IDEAL_REPLENISHMENT_GAP_DEFAULT_COLUMNS}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="default"
            onFilterChange={setFilters}
            category="analytical"
        >
            <UnifiedTable
                headerExtra={
                    null
                }
                dataSource={activeList}
                columns={visibleColumns}
                rowKey="م"
                scroll={{ x: 1500 }}
                size={density}
                pagination={{ ...pagination, total: activeList.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`فجوة الشراء المثالية (${activeList.length} سجل)`}
                summary={(pageData) => {
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(pageData.reduce((s, r) => s + (parseFloat(r['الكمية']) || 0), 0))}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatQuantity(pageData.reduce((s, r) => s + (parseFloat(r['كمية المبيعات']) || 0), 0))}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(pageData.reduce((s, r) => s + (parseFloat(r['المبيعات']) || 0), 0))}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7}><strong className="unified-table-summary">{formatQuantity(pageData.reduce((s, r) => s + (parseFloat(r['الاحتياج']) || 0), 0))}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={8}><strong className="unified-table-summary">{formatQuantity(pageData.reduce((s, r) => s + (parseFloat(r['الكمية المثالية للشراء']) || 0), 0))}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={9} colSpan={3}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default IdealReplenishmentGapPage;