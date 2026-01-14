import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import safeString from '../utils/safeString.js';
import NavigationTabs from '../components/NavigationTabs';
import { NEW_ITEMS_PERFORMANCE_DEFAULT_COLUMNS } from '../constants/newItemsPerformanceColumns.js';

const NewItemsPerformancePage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 100 });
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});
    const [selectedTab, setSelectedTab] = useState('all');

    const newItemsData = useMemo(() => {
        if (!allReportsData?.endingInventory?.data) return [];
        return allReportsData.endingInventory.data.filter(item => item['بيان الحالة'] === 'صنف جديد');
    }, [allReportsData]);

    // Apply Filters
    const filteredData = useMemo(() => {
        const smartSearch = safeString(filters.smartSearch).toLowerCase();
        if (!smartSearch) return newItemsData;
        return newItemsData.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(smartSearch))
        );
    }, [newItemsData, filters]);

    // Tab Grouping
    const tabData = useMemo(() => {
        const statuses = [...new Set(filteredData.map(item => item['حالة الأداء']).filter(Boolean))];
        const tabs = { all: filteredData };
        statuses.forEach(s => {
            tabs[s] = filteredData.filter(item => item['حالة الأداء'] === s);
        });
        return tabs;
    }, [filteredData]);

    const activeList = tabData[selectedTab] || [];

    // Apply Sorting
    const sortedData = useMemo(() => {
        if (!sortOrder.field || !sortOrder.order) return activeList;

        return [...activeList].sort((a, b) => {
            const aValue = a[sortOrder.field];
            const bValue = b[sortOrder.field];
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortOrder.order === 'asc' ? -1 : 1;
            if (bValue == null) return sortOrder.order === 'asc' ? 1 : -1;
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return sortOrder.order === 'asc' ? aNum - bNum : bNum - aNum;
            }
            const comparison = String(aValue).localeCompare(String(bValue));
            return sortOrder.order === 'asc' ? comparison : -comparison;
        });
    }, [activeList, sortOrder]);

    const grandTotals = useMemo(() => {
        return {
            qty: activeList.reduce((sum, item) => sum + (parseFloat(item['إجمالي الكمية المباعة']) || 0), 0),
            sales: activeList.reduce((sum, item) => sum + (parseFloat(item['إجمالي قيمة المبيعات']) || 0), 0),
            profit: activeList.reduce((sum, item) => sum + (parseFloat(item['إجمالي الربح']) || 0), 0)
        };
    }, [activeList]);

    const tabsArray = useMemo(() => {
        const arr = [{ value: 'all', label: `الكل (${tabData.all?.length || 0})` }];
        Object.keys(tabData).filter(k => k !== 'all').forEach(k => {
            arr.push({ value: k, label: `${k} (${tabData[k]?.length || 0})` });
        });
        return arr;
    }, [tabData]);

    const getStatusColor = (s) => {
        switch (s) {
            case 'ممتاز': return 'green';
            case 'جيد': return 'blue';
            case 'مقبول': return 'orange';
            case 'ضعيف': return 'red';
            default: return 'default';
        }
    };

    const allColumns = NEW_ITEMS_PERFORMANCE_DEFAULT_COLUMNS;

    const visibleColumns = useMemo(() =>
        allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false),
        [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    if (newItemsData.length === 0) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message="لا توجد بيانات" description="لا توجد أصناف جديدة في تقرير المخزون النهائي حالياً." />
            </div>
        );
    }

    return (
        <UnifiedPageLayout
            title={`أداء الأصناف الجديدة (${activeList.length} صنف)`}
            description="متابعة دقيقة للأصناف التي أضيفت مؤخراً للمخزن لقياس مدى سرعة انتشارها وقبولها لدى العملاء."
            interpretation="يجاوب هذا التقرير على سؤال 'هل كانت إضافة هذه الأصناف قراراً صائباً؟'. فهو يراقب (حالة الأداء) بناءً على سرعة البيع والربحية المحققة في أول فترة دخولها للمحل. يساعدك في اتخاذ قرار الاستمرار في توريد هذه الأصناف أو التوقف عنها واستبدالها."
            data={sortedData}
            columns={visibleColumns}
            filename={`new_items_performance_${selectedTab}`}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="newItemsPerformance"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="sales"
            onFilterChange={setFilters}
            category="analytical"
            exportColumns={NEW_ITEMS_PERFORMANCE_DEFAULT_COLUMNS}
        >
            <UnifiedTable
                headerExtra={
                    <NavigationTabs
                        value={selectedTab}
                        onChange={(e) => {
                            setSelectedTab(e.target.value);
                            setPagination(prev => ({ ...prev, current: 1 }));
                        }}
                        tabs={tabsArray}
                    />
                }
                dataSource={sortedData}
                columns={visibleColumns}
                rowKey="م"
                scroll={{ x: 1500 }}
                size={density}
                pagination={{ ...pagination, total: activeList.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`تحليل نجاح الأصناف الجديدة - ${selectedTab === 'all' ? 'الكل' : selectedTab} (${activeList.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        qty: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي الكمية المباعة']) || 0), 0),
                        sales: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي قيمة المبيعات']) || 0), 0),
                        profit: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي الربح']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={5}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatQuantity(pageTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(pageTotals.sales)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7}><strong className="unified-table-summary">{formatMoney(pageTotals.profit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={8} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={5}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(grandTotals.sales)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7}><strong className="unified-table-summary">{formatMoney(grandTotals.profit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={8} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default NewItemsPerformancePage;