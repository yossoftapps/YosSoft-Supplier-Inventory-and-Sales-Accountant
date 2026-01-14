import React, { useState, useMemo, useCallback, memo } from 'react';
import { Typography, Table, Tag, Progress } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatMoney, formatQuantity } from '../utils/financialCalculations';
import { filterGenericData } from '../utils/dataFilter';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import NavigationTabs from '../components/NavigationTabs';
import UnifiedAlert from '../components/UnifiedAlert';

const { Title } = Typography;

const InventoryABCPage = memo(({ data, allReportsData, availableReports }) => {
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
            const classification = item['التصنيف ABC'];
            if (classification) {
                if (!grouped[classification]) grouped[classification] = [];
                grouped[classification].push(item);
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
            const comparison = safeString(aValue).localeCompare(safeString(bValue));
            return sortOrder.order === 'asc' ? comparison : -comparison;
        });
    }, [activeList, sortOrder]);

    const grandTotals = useMemo(() => {
        return {
            salesCount: activeList.reduce((sum, item) => sum + (item['عدد عمليات البيع'] || 0), 0),
            qty: activeList.reduce((sum, item) => sum + (parseFloat(item['إجمالي الكمية المباعة']) || 0), 0),
            consumption: activeList.reduce((sum, item) => sum + (parseFloat(item['إجمالي قيمة الاستهلاك السنوي']) || 0), 0)
        };
    }, [activeList]);

    const tabsArray = useMemo(() => {
        const tabs = [{ value: 'all', label: `الكل (${tabsData.all?.length || 0})` }];
        const classifications = ['A', 'B', 'C'].filter(cls => tabsData[cls]);
        classifications.forEach(cls => {
            tabs.push({ value: cls, label: `${cls} (${tabsData[cls]?.length || 0})` });
        });
        return tabs;
    }, [tabsData]);

    const getClassificationColor = (classification) => {
        switch (classification) {
            case 'A': return 'red';
            case 'B': return 'orange';
            case 'C': return 'green';
            default: return 'default';
        }
    };

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        { title: 'عدد العمليات', dataIndex: 'عدد عمليات البيع', key: 'عدد عمليات البيع', width: 80, align: 'center' },
        {
            title: 'الكمية المباعة', dataIndex: 'إجمالي الكمية المباعة', key: 'إجمالي الكمية المباعة', width: 100, align: 'center',
            render: val => formatQuantity(val)
        },
        {
            title: 'قيمة الاستهلاك', dataIndex: 'إجمالي قيمة الاستهلاك السنوي', key: 'إجمالي قيمة الاستهلاك السنوي', width: 120, align: 'center',
            render: val => formatMoney(val)
        },
        {
            title: 'التراكمي %', dataIndex: 'القيمة التراكمية %', key: 'القيمة التراكمية %', width: 100, align: 'center',
            render: val => {
                const num = parseFloat(val) || 0;
                return <Progress percent={num} size="small" status={num <= 80 ? 'exception' : (num <= 95 ? 'normal' : 'success')} showInfo={false} />
            }
        },
        {
            title: 'التصنيف ABC', dataIndex: 'التصنيف ABC', key: 'التصنيف ABC', width: 100, align: 'center',
            render: val => <Tag color={getClassificationColor(val)}>{val}</Tag>
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
            title={`تحليل ABC للمخزون (${sortedData.length} صنف)`}
            description="تحليل توزيع قيمة المخزون حسب تصنيف ABC لتحديد الأصناف الأكثر أهمية استراتيجياً."
            interpretation="يصنف هذا التقرير بضاعتك إلى ثلاث فئات: الفئة A هي الأهم (80% من قيمة مبيعاتك وتستحق المراقبة اللصيقة)، الفئة B متوسطة الأهمية (15%)، والفئة C هي الأصناف الكثيرة ذات القيمة المنخفضة (5%). يساعدك هذا في تحديد أين تقضي وقتك في إدارة المخزون والمشتريات."
            data={sortedData}
            columns={visibleColumns}
            filename="inventory_abc"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="inventoryABC"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="inventoryABC"
            onFilterChange={setFilters}
            category="analytical"
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
                title={`تحليل ABC - ${selectedTab === 'all' ? 'الكل' : selectedTab} (${activeList.length} صنف)`}
                summary={(pageData) => {
                    const pageTotals = {
                        salesCount: pageData.reduce((sum, item) => sum + (item['عدد عمليات البيع'] || 0), 0),
                        qty: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي الكمية المباعة']) || 0), 0),
                        consumption: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي قيمة الاستهلاك السنوي']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <strong className="unified-table-summary">{pageTotals.salesCount}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}>
                                    <strong className="unified-table-summary">{formatQuantity(pageTotals.qty)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={6}>
                                    <strong className="unified-table-summary">{formatMoney(pageTotals.consumption)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <strong className="unified-table-summary">{grandTotals.salesCount}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}>
                                    <strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={6}>
                                    <strong className="unified-table-summary">{formatMoney(grandTotals.consumption)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default InventoryABCPage;