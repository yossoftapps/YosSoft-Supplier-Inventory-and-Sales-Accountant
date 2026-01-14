import React, { useState, useMemo, useCallback, memo } from 'react';
import { Typography, Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatMoney, formatQuantity } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import { ITEM_PROFITABILITY_DEFAULT_COLUMNS } from '../constants/itemProfitabilityColumns.js';

const ItemProfitabilityPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});
    const [selectedTab, setSelectedTab] = useState('all');

    if (!data || data.length === 0) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} />
            </div>
        );
    }

    // Apply Filters
    const filteredData = useMemo(() => {
        const smartSearch = safeString(filters.smartSearch).toLowerCase();
        if (!smartSearch) return data;
        return data.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(smartSearch))
        );
    }, [data, filters]);

    // Grouping for tabs
    const tabData = useMemo(() => {
        const grouped = { all: filteredData };
        filteredData.forEach(item => {
            const margin = parseFloat(item['نسبة هامش الربح %']) || 0;
            let cls;
            if (margin > 50) cls = 'هامش مرتفع';
            else if (margin > 20) cls = 'هامش متوسط';
            else if (margin > 0) cls = 'هامش منخفض';
            else if (margin === 0) cls = 'بلا ربح';
            else cls = 'خسارة';

            if (!grouped[cls]) grouped[cls] = [];
            grouped[cls].push(item);
        });
        return grouped;
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
            count: activeList.reduce((sum, item) => sum + (item['عدد عمليات البيع'] || 0), 0),
            qty: activeList.reduce((sum, item) => sum + (parseFloat(item['إجمالي الكمية المباعة']) || 0), 0),
            sales: activeList.reduce((sum, item) => sum + (parseFloat(item['إجمالي قيمة المبيعات']) || 0), 0),
            cost: activeList.reduce((sum, item) => sum + (parseFloat(item['إجمالي تكلفة المبيعات']) || 0), 0),
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

    const getProfitColor = (v) => {
        if (v > 50) return 'green';
        if (v > 20) return 'blue';
        if (v > 0) return 'orange';
        return 'red';
    };

    // Start from canonical column definitions, then add UI-specific renderers where applicable
    const allColumns = ITEM_PROFITABILITY_DEFAULT_COLUMNS.map(col => {
        if (col.dataIndex === 'إجمالي الربح') {
            return { ...col, render: v => <strong style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f' }}>{formatMoney(v)}</strong> };
        }
        if (col.dataIndex === 'نسبة هامش الربح %') {
            return { ...col, render: v => <Tag color={getProfitColor(v)}>{v}%</Tag> };
        }
        if (col.dataIndex === 'نسبة المساهمة في أرباح الشركة %') {
            return { ...col, render: (_, record) => {
                const itemProfit = parseFloat(record['إجمالي الربح']) || 0;
                const totalProfit = activeList.reduce((sum, item) => sum + (parseFloat(item['إجمالي الربح']) || 0), 0);
                if (totalProfit === 0) return '0%';
                const ratio = (itemProfit / totalProfit) * 100;
                return <Tag color={ratio > 10 ? 'green' : 'default'}>{ratio.toFixed(2)}%</Tag>;
            } };
        }
        if (col.dataIndex === 'profitStatement') {
            return { ...col, render: (_, record) => {
                const totalProfit = parseFloat(record['إجمالي الربح']) || 0;
                const margin = parseFloat(record['نسبة هامش الربح %']) || 0;
                if (totalProfit <= 0) return 'خسارة';
                if (totalProfit > 0 && margin >= 5) return 'ربح';
                if (totalProfit > 0 && margin < 5) return 'ربح ضعيف';
                return '-';
            } };
        }
        return col;
    });

    const visibleColumns = useMemo(() =>
        allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false),
        [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    return (
        <UnifiedPageLayout
            title={`تحليل ربحية الأصناف (${activeList.length} صنف)`}
            description="تشريح دقيق لأداء المبيعات على مستوى الصنف الواحد، يكشف محركات الربح ومصادر الخسارة."
            interpretation="يجاوب هذا التقرير على سؤال 'ما هي الأصناف التي تعيل المحل فعلياً؟'. فالمبيعات العالية لا تعني دائماً أرباحاً عالية. 'نسبة المساهمة في الأرباح' هي أهم مؤشر هنا، فهي تخبرك بدور كل صنف في دفع مصاريف المحل الكلية. الأصناف ذات الهامش المنخفض والمساهمة الضعيفة قد تحتاج لمراجعة الأسعار أو قرارات الشراء."
            data={sortedData}
            columns={visibleColumns}
            filename={`item_profitability_${selectedTab}`}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="itemProfitability"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="sales"
            onFilterChange={setFilters}
            category="financial"
            exportColumns={allColumns}
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
                title={`تحليل هوامش ومساهمات الأرباح - ${selectedTab === 'all' ? 'الكل' : selectedTab} (${activeList.length} سجل)`}
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
                                <Table.Summary.Cell index={7}></Table.Summary.Cell>
                                <Table.Summary.Cell index={8}><strong className="unified-table-summary">{formatMoney(pageTotals.profit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={9} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={5}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(grandTotals.sales)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7}></Table.Summary.Cell>
                                <Table.Summary.Cell index={8}><strong className="unified-table-summary">{formatMoney(grandTotals.profit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={9} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});;

export default ItemProfitabilityPage;