import React, { useState, useMemo, useCallback, memo } from 'react';
import { Tag, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { filterGenericData } from '../utils/dataFilter.js';
import { useTranslation } from 'react-i18next';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import { EXCESS_INVENTORY_DEFAULT_COLUMNS } from '../constants/excessInventoryColumns.js';

const ExcessInventoryPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});
    const [selectedTab, setSelectedTab] = useState('all');

    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} />
            </div>
        );
    }

    // Apply Filters
    const filteredData = useMemo(() => {
        return filterGenericData(data, filters);
    }, [data, filters]);

    // Tab Grouping
    const tabData = useMemo(() => {
        const statuses = [...new Set(filteredData.map(item => item['بيان الفائض']).filter(Boolean))];
        const tabs = { all: filteredData };
        statuses.forEach(s => {
            tabs[s] = filteredData.filter(item => item['بيان الفائض'] === s);
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
            qty: activeList.reduce((sum, r) => sum + parseFloat(r['الكمية'] || 0), 0),
            purch: activeList.reduce((sum, r) => sum + parseFloat(r['كمية المشتريات'] || 0), 0),
            sales: activeList.reduce((sum, r) => sum + parseFloat(r['كمية المبيعات'] || 0), 0),
            sales90: activeList.reduce((sum, r) => sum + parseFloat(r['المبيعات'] || 0), 0),
            excess: activeList.reduce((sum, r) => sum + parseFloat(r['فائض المخزون'] || 0), 0),
            returns: activeList.reduce((sum, r) => sum + parseFloat(r['معد للارجاع'] || 0), 0),
            need: activeList.reduce((sum, r) => sum + parseFloat(r['الاحتياج'] || 0), 0)
        };
    }, [activeList]);

    const tabsArray = useMemo(() => {
        const arr = [{ value: 'all', label: `الكل (${tabData.all?.length || 0})` }];
        Object.keys(tabData).filter(k => k !== 'all').forEach(k => {
            arr.push({ value: k, label: `${k} (${tabData[k]?.length || 0})` });
        });
        return arr;
    }, [tabData]);


    const allColumns = EXCESS_INVENTORY_DEFAULT_COLUMNS;

    const visibleColumns = useMemo(() =>
        allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false),
        [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    return (
        <UnifiedPageLayout
            title={`تحليل فوائض ونواقص المخزون (${activeList.length} سجل)`}
            description="دراسة ذكية للتوازن بين الكميات المتاحة ومعدلات البيع الفعلية (آخر 90 يوماً)."
            interpretation="يريد هذا التقرير الإجابة على سؤال: هل تملك بضاعة أكثر مما تبيع؟ أم تبيع أكثر مما تملك؟ هو 'ميزان المخزون' الذي يكشف لك السلع التي جمدت سيولتك (راكدة) والسلع المفترض توفيرها فوراً لتجنب ضياع فرص البيع (احتياج)."
            data={sortedData}
            columns={visibleColumns}
            filename={`excess_inventory_${selectedTab}`}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="excessInventory"
            exportColumns={EXCESS_INVENTORY_DEFAULT_COLUMNS}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="default"
            onFilterChange={setFilters}
            category="basic"
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
                scroll={{ x: 1800 }}
                size={density}
                pagination={{ ...pagination, total: activeList.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`تحليل التدفق المخزني - ${selectedTab === 'all' ? 'الكل' : selectedTab} (${activeList.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        qty: pageData.reduce((sum, r) => sum + parseFloat(r['الكمية'] || 0), 0),
                        sales90: pageData.reduce((sum, r) => sum + parseFloat(r['المبيعات'] || 0), 0),
                        excess: pageData.reduce((sum, r) => sum + parseFloat(r['فائض المخزون'] || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}><strong className="unified-table-summary">{formatQuantity(pageTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4} colSpan={2}></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatQuantity(pageTotals.sales90)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}><strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4} colSpan={2}></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatQuantity(grandTotals.sales90)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default ExcessInventoryPage;