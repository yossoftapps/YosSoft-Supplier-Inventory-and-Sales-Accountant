import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table, Tag, Row, Col, Card, Statistic } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import { IDEAL_REPLENISHMENT_GAP_DEFAULT_COLUMNS } from '../constants/idealReplenishmentGapColumns.js';

const IdealReplenishmentPage = memo(({ data, allReportsData, availableReports }) => {
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
        const smartSearch = safeString(filters.smartSearch).toLowerCase();
        if (!smartSearch) return data;
        return data.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(smartSearch))
        );
    }, [data, filters]);

    // Tab Grouping
    const tabData = useMemo(() => {
        const statuses = [...new Set(filteredData.map(item => item['الحالة']).filter(Boolean))];
        const tabs = { all: filteredData };
        statuses.forEach(s => {
            tabs[s] = filteredData.filter(item => item['الحالة'] === s);
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
            current: activeList.reduce((sum, item) => sum + (parseFloat(item['الكمية الحالية']) || 0), 0),
            ideal: activeList.reduce((sum, item) => sum + (parseFloat(item['الكمية المثالية للشراء']) || 0), 0),
            gap: activeList.reduce((sum, item) => sum + (parseFloat(item['فجوة المخزون']) || 0), 0),
            urgent: activeList.filter(item => item['الحالة'] === 'احتياج عاجل').length,
            near: activeList.filter(item => item['الحالة'] === 'احتياج قريب').length
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
            case 'احتياج عاجل': return 'red';
            case 'احتياج قريب': return 'orange';
            case 'لا شراء': return 'green';
            case 'فائض كبير': return 'blue';
            default: return 'default';
        }
    };

    const allColumns = IDEAL_REPLENISHMENT_GAP_DEFAULT_COLUMNS;

    const visibleColumns = useMemo(() =>
        allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false),
        [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    return (
        <UnifiedPageLayout
            title={`فجوة الشراء المثالية (${activeList.length} صنف)`}
            description="تحليل علمي لتحديد مستويات إعادة الطلب وكميات الشراء المثلى بناءً على معدلات الاستهلاك والنمو."
            interpretation="يجاوب هذا التقرير على سؤال 'كم نشتري؟ ومتى؟'. فهو يحسب (نقطة إعادة الطلب) و(مخزون الأمان) لكل صنف. 'فجوة المخزون' الموجبة تعني حاجة للشراء فوراً. يساعدك هذا التقرير في تجنب انقطاع السلع الرابحة (A) مع تقليل التكاليف المرتبطة بالمخزون الزائد."
            data={sortedData}
            columns={visibleColumns}
            filename={`ideal_replenishment_${selectedTab}`}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="idealReplenishment"
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
            <div className="stats-container mb-md">
                <Row gutter={16}>
                    <Col xs={24} sm={8}>
                        <Card variant="borderless" className="unified-stat-card">
                            <Statistic title="احتياج عاجل" value={grandTotals.urgent} valueStyle={{ color: '#ff4d4f' }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card variant="borderless" className="unified-stat-card">
                            <Statistic title="احتياج قريب" value={grandTotals.near} valueStyle={{ color: '#fa8c16' }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card variant="borderless" className="unified-stat-card">
                            <Statistic title="إجمالي فجوة الشراء" value={formatQuantity(grandTotals.gap)} valueStyle={{ color: '#1890ff' }} />
                        </Card>
                    </Col>
                </Row>
            </div>

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
                title={`تحليل فجوة التزود - ${selectedTab === 'all' ? 'الكل' : selectedTab} (${activeList.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        ideal: pageData.reduce((sum, item) => sum + (parseFloat(item['الكمية المثالية للشراء']) || 0), 0),
                        current: pageData.reduce((sum, item) => sum + (parseFloat(item['الكمية الحالية']) || 0), 0),
                        gap: pageData.reduce((sum, item) => sum + (parseFloat(item['فجوة المخزون']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={8}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={8}><strong className="unified-table-summary">{formatQuantity(pageTotals.ideal)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={9}><strong className="unified-table-summary">{formatQuantity(pageTotals.current)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={10}><strong className="unified-table-summary">{formatQuantity(pageTotals.gap)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={11} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={8}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={8}><strong className="unified-table-summary">{formatQuantity(grandTotals.ideal)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={9}><strong className="unified-table-summary">{formatQuantity(grandTotals.current)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={10}><strong className="unified-table-summary">{formatQuantity(grandTotals.gap)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={11} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default IdealReplenishmentPage;