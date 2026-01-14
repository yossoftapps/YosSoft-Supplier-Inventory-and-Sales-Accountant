import React, { useState, useMemo, useCallback, memo } from 'react';
import { Tag, Table } from 'antd';
import { formatQuantity } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import { useTranslation } from 'react-i18next';

const StagnationRiskPage = memo(({ data, allReportsData, availableReports }) => {
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
            const risk = item['تصنيف الخطورة'] || 'غير محدد';
            if (!grouped[risk]) grouped[risk] = [];
            grouped[risk].push(item);
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
            qty: activeList.reduce((sum, item) => sum + (parseFloat(item['الكمية الحالية']) || 0), 0)
        };
    }, [activeList]);

    const tabsArray = useMemo(() => {
        const tabs = [{ value: 'all', label: `الكل (${tabsData.all?.length || 0})` }];
        const classifications = Object.keys(tabsData).filter(key => key !== 'all');
        classifications.forEach(cls => {
            tabs.push({ value: cls, label: `${cls} (${tabsData[cls]?.length || 0})` });
        });
        return tabs;
    }, [tabsData]);

    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'عالي': return 'red';
            case 'متوسط': return 'orange';
            case 'منخفض': return 'green';
            default: return 'default';
        }
    };

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية الحالية', dataIndex: 'الكمية الحالية', key: 'الكمية الحالية', width: 100, align: 'center',
            render: val => formatQuantity(val)
        },
        { title: 'مرات البيع', dataIndex: 'عدد مرات البيع', key: 'عدد مرات البيع', width: 80, align: 'center' },
        {
            title: 'متوسط الكمية', dataIndex: 'متوسط الكمية المباعة', key: 'متوسط الكمية المباعة', width: 90, align: 'center',
            render: val => formatQuantity(val)
        },
        { title: 'متوسط الفترة (يوم)', dataIndex: 'متوسط الفترة بين المبيعات (أيام)', key: 'متوسط الفترة بين المبيعات (أيام)', width: 100, align: 'center' },
        {
            title: 'دوران المخزون', dataIndex: 'معدل دوران المخزون', key: 'معدل دوران المخزون', width: 90, align: 'center',
            render: val => formatQuantity(val)
        },
        {
            title: 'التخزين المتوقع', dataIndex: 'فترة التخزين المتوقعة (أيام)', key: 'فترة التخزين المتوقعة (أيام)', width: 100, align: 'center',
            render: val => val === Infinity ? '∞' : val
        },
        {
            title: 'مؤشر الخطورة', dataIndex: 'مؤشر الخطورة', key: 'مؤشر الخطورة', width: 100, align: 'center',
            render: val => {
                const num = parseFloat(val) || 0;
                return <strong style={{ color: num > 70 ? '#ff4d4f' : num > 40 ? '#fa8c16' : '#52c41a' }}>{val}</strong>
            }
        },
        {
            title: 'تصنيف الخطورة', dataIndex: 'تصنيف الخطورة', key: 'تصنيف الخطورة', width: 100, align: 'center',
            render: text => <Tag color={getRiskColor(text)}>{text}</Tag>
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
            title={`تحليل مخاطر الركود (${sortedData.length} سجل)`}
            description="تحليل مخاطر الركود للمواد في المخزون بناءً على أنماط الحركة والمبيعات التاريخية."
            interpretation="يحدد هذا التقرير الأصناف التي تتحرك ببطء في مخزنك. 'مؤشر الخطورة' هو رقم مركب يجمع بين طول فترة التخزين وضعف معدل الدوران. يساعدك هذا في التعرف على البضاعة التي قد 'تموت' في المخزن وتحتاج إلى تصفية أو عروض خاصة قبل فوات الأوان."
            data={sortedData}
            columns={visibleColumns}
            filename="stagnation_risk"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="stagnationRisk"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="inventory"
            onFilterChange={setFilters}
            category="risk"
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
                title={`مخاطر الركود - ${selectedTab === 'all' ? 'الكل' : selectedTab} (${activeList.length} صنف)`}
                summary={(pageData) => {
                    const pageTotals = {
                        qty: pageData.reduce((sum, item) => sum + (parseFloat(item['الكمية الحالية']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <strong className="unified-table-summary">{formatQuantity(pageTotals.qty)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={7}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={7}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});;

export default StagnationRiskPage;