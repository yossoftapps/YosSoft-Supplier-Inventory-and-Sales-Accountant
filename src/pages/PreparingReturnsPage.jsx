import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney, compare } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import safeString from '../utils/safeString.js';

const PreparingReturnsPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});
    const [selectedTab, setSelectedTab] = useState('all');

    const returnsData = useMemo(() => {
        // Prefer precomputed preparing returns data (from ImportData pipeline) if available
        if (data && Array.isArray(data) && data.length > 0) return data;

        // Otherwise try to derive from ending inventory: prefer items with non-zero 'معد للارجاع',
        // fallback to items whose الحالة === 'معد للارجاع' (legacy behavior)
        const reports = (typeof allReportsData === 'function') ? allReportsData() : (allReportsData || {});
        const endingList = (reports && reports.endingInventory && reports.endingInventory.data) || [];

        // Use compare() for robust comparison (handles Decimal objects)
        let list = endingList.filter(item => {
            const returnQty = item && item['معد للارجاع'];
            try {
                return compare(returnQty || 0, 0) > 0;
            } catch (e) {
                return (parseFloat(returnQty) || 0) > 0;
            }
        });

        if (list.length === 0) {
            list = endingList.filter(item => item['بيان الحالة'] === 'معد للارجاع');
        }
        return list;
    }, [data, allReportsData]);

    // Apply Filters
    const filteredData = useMemo(() => {
        const smartSearch = safeString(filters.smartSearch).toLowerCase();
        if (!smartSearch) return returnsData;
        return returnsData.filter(item =>
            Object.values(item).some(val => safeString(val).toLowerCase().includes(smartSearch))
        );
    }, [returnsData, filters]);

    // Tab Grouping
    const tabData = useMemo(() => {
        const statuses = [...new Set(filteredData.map(item => item['نوع الارجاع'] || 'غير محدد').filter(Boolean))];
        const tabs = { all: filteredData };
        statuses.forEach(s => {
            tabs[s] = filteredData.filter(item => (item['نوع الارجاع'] || 'غير محدد') === s);
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
            const comparison = safeString(aValue).localeCompare(safeString(bValue));
            return sortOrder.order === 'asc' ? comparison : -comparison;
        });
    }, [activeList, sortOrder]);

    const grandTotals = useMemo(() => {
        return {
            qty: activeList.reduce((sum, item) => sum + (parseFloat(item['معد للارجاع'] || item['الكمية'] || 0)), 0),
            value: activeList.reduce((sum, item) => sum + (parseFloat(item['قيمة معد للارجاع'] || item['الاجمالي'] || 0)), 0)
        };
    }, [activeList]);

    const tabsArray = useMemo(() => {
        const arr = [{ value: 'all', label: `الكل (${tabData.all?.length || 0})` }];
        Object.keys(tabData).filter(k => k !== 'all').forEach(k => {
            arr.push({ value: k, label: `${k} (${tabData[k]?.length || 0})` });
        });
        return arr;
    }, [tabData]);

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        { title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 100, align: 'center', render: v => <strong>{formatQuantity(v)}</strong> },
        { title: 'سعر الوحدة', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'center', render: v => formatMoney(v) },
        { title: 'إجمالي القيمة', dataIndex: 'قيمة معد للارجاع', key: 'قيمة معد للارجاع', width: 110, align: 'center', render: v => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{formatMoney(v)}</span> },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 150, align: 'right' },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 110, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 150, align: 'right' }
    ];

    const visibleColumns = useMemo(() =>
        allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false),
        [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    if (returnsData.length === 0) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message="لا توجد بيانات" description="لا توجد أصناف معدة للارجاع في تقرير المخزون النهائي. اذهب للمخزون النهائي وحدد بعض الأصناف للارجاع أولاً." />
            </div>
        );
    }

    return (
        <UnifiedPageLayout
            title={`تجهيز المرتجعات المخططة (${activeList.length} صنف)`}
            description="حصر وتجميع كافة الأصناف التي تقرر إرجاعها للموردين لتسهيل عملية التواصل والتنفيذ."
            interpretation="هذا التقرير هو 'قائمة المهام' لمسؤول المخازن. فهو يجمع كل الأصناف التي استنتج النظام (في تقرير المخزون النهائي) أنها فائضة أو تالفة أو غير مرغوب فيها. يساعدك في التفاوض مع الموردين بناءً على قيم مالية دقيقة وكميات جاهزة للارجاع."
            data={sortedData}
            columns={visibleColumns}
            columnVisibility={columnVisibility}
            filename={`preparing_returns_${selectedTab}`}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="preparingReturns"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={{ listE: returnsData }}
            filterDataType="inventory"
            onFilterChange={setFilters}
            category="inventory"
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
                title={`كشف المرتجعات المخططة - ${selectedTab === 'all' ? 'الكل' : selectedTab} (${activeList.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        qty: pageData.reduce((sum, item) => sum + (parseFloat(item['معد للارجاع'] || item['الكمية'] || 0)), 0),
                        value: pageData.reduce((sum, item) => sum + (parseFloat(item['قيمة معد للارجاع'] || item['الاجمالي'] || 0)), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(pageTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(pageTotals.value)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={3}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(grandTotals.value)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={3}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});;

export default PreparingReturnsPage;