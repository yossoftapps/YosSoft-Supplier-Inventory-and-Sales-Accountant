import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table, Tag } from 'antd';
import { formatMoney } from '../utils/financialCalculations.js';
import { useTranslation } from 'react-i18next';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';

const SupplierComparisonPage = memo(({ data, allReportsData, availableReports }) => {
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
        return data.filter(item => {
            const smartSearch = safeString(filters.smartSearch).toLowerCase();
            if (smartSearch) {
                const matchesAnyField = Object.values(item).some(value =>
                    safeString(value).toLowerCase().includes(smartSearch)
                );
                if (!matchesAnyField) return false;
            }
            return true;
        });
    }, [data, filters]);

    // Grouping for tabs
    const tabsData = useMemo(() => {
        const grouped = { all: filteredData };
        filteredData.forEach(item => {
            const status = item['قرار التعامل الموصى به'];
            if (status) {
                if (!grouped[status]) grouped[status] = [];
                grouped[status].push(item);
            }
        });
        return grouped;
    }, [filteredData]);

    const activeList = tabsData[selectedTab] || [];

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
            inv: activeList.reduce((sum, item) => sum + (parseFloat(item['قيمة المخزون الحالي']) || 0), 0),
            balance: activeList.reduce((sum, item) => sum + (parseFloat(item['الرصيد']) || 0), 0)
        };
    }, [activeList]);

    const tabsArray = useMemo(() => {
        const tabs = [{ value: 'all', label: `الكل (${tabsData.all?.length || 0})` }];
        const statuses = Object.keys(tabsData).filter(key => key !== 'all');
        statuses.forEach(status => {
            tabs.push({ value: status, label: `${status} (${tabsData[status]?.length || 0})` });
        });
        return tabs;
    }, [tabsData]);

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 150, align: 'right' },
        {
            title: 'الدرجة', dataIndex: 'درجة المورد', key: 'درجة المورد', width: 80, align: 'center',
            render: val => <Tag color={val >= 80 ? 'green' : val >= 60 ? 'blue' : val >= 40 ? 'orange' : 'red'}>{val}</Tag>
        },
        { title: 'الترتيب', dataIndex: 'ترتيب المورد', key: 'ترتيب المورد', width: 80, align: 'center' },
        {
            title: 'التوصية', dataIndex: 'قرار التعامل الموصى به', key: 'قرار التعامل الموصى به', width: 100, align: 'center',
            render: text => {
                let color = text === 'تفضيل' ? 'green' : text === 'استمرار' ? 'blue' : text === 'مراقبة' ? 'orange' : 'red';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        { title: 'المرتجعات %', dataIndex: 'نسبة المرتجعات %', key: 'نسبة المرتجعات %', width: 90, align: 'center', render: val => `${val}%` },
        { title: 'الأخطاء', dataIndex: 'عدد الأخطاء في التوريد', key: 'عدد الأخطاء في التوريد', width: 80, align: 'center' },
        { title: 'الكمية %', dataIndex: 'نسبة الالتزام بالكمية', key: 'نسبة الالتزام بالكمية', width: 90, align: 'center', render: val => `${val}%` },
        { title: 'الوقت %', dataIndex: 'نسبة الالتزام بالوقت', key: 'نسبة الالتزام بالوقت', width: 90, align: 'center', render: val => `${val}%` },
        {
            title: 'المخزون', dataIndex: 'قيمة المخزون الحالي', key: 'قيمة المخزون الحالي', width: 120, align: 'center',
            render: val => formatMoney(val)
        },
        {
            title: 'الراكد', dataIndex: 'قيمة المخزون الراكد', key: 'قيمة المخزون الراكد', width: 120, align: 'center',
            render: val => formatMoney(val)
        },
        { title: 'المنتهى', dataIndex: 'الأصناف المنتهية', key: 'الأصناف المنتهية', width: 90, align: 'center' },
        { title: 'سداد (يوم)', dataIndex: 'متوسط فترة السداد', key: 'متوسط فترة السداد', width: 90, align: 'center' },
        { title: 'مالي %', dataIndex: 'الالتزام المالي', key: 'الالتزام المالي', width: 90, align: 'center', render: val => `${val}%` },
        {
            title: 'الرصيد', dataIndex: 'الرصيد', key: 'الرصيد', width: 120, align: 'center',
            render: val => <strong style={{ color: val < 0 ? '#ff4d4f' : '#52c41a' }}>{formatMoney(val)}</strong>
        }
    ];

    const visibleColumns = useMemo(() =>
        allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false),
        [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    return (
        <UnifiedPageLayout
            title={`مقارنة الموردين (${sortedData.length} مورد)`}
            description="تحليل ومفاضلة بين الموردين بناءً على الجودة، الالتزام، الربحية والمخاطر."
            interpretation="يضع هذا التقرير كافة الموردين في ميزان واحد. 'درجة المورد' هي تقييم شامل (Score) يجمع بين سرعة التوريد، دقة الكميات، جودة البضاعة (المرتجعات)، واستقرارك المالي معهم. التوصية (تفضيل/استمرار/مراقبة/حذر) هي محرك اتخاذ القرار الذكي الذي يقترحه النظام."
            data={sortedData}
            columns={visibleColumns}
            filename="supplier_comparison"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="supplierComparison"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="suppliers"
            onFilterChange={setFilters}
            category="analytical"
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
                title={`مقارنة الموردين - ${selectedTab === 'all' ? 'الكل' : selectedTab} (${activeList.length} مورد)`}
                summary={(pageData) => {
                    const pageTotals = {
                        inv: pageData.reduce((sum, item) => sum + (parseFloat(item['قيمة المخزون الحالي']) || 0), 0),
                        balance: pageData.reduce((sum, item) => sum + (parseFloat(item['الرصيد']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={9}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={9}>
                                    <strong className="unified-table-summary">{formatMoney(pageTotals.inv)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={10} colSpan={4}></Table.Summary.Cell>
                                <Table.Summary.Cell index={14}>
                                    <strong className="unified-table-summary">{formatMoney(pageTotals.balance)}</strong>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={9}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={9}>
                                    <strong className="unified-table-summary">{formatMoney(grandTotals.inv)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={10} colSpan={4}></Table.Summary.Cell>
                                <Table.Summary.Cell index={14}>
                                    <strong className="unified-table-summary">{formatMoney(grandTotals.balance)}</strong>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default SupplierComparisonPage;
