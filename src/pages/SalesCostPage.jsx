import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';

const SalesCostPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [selectedTab, setSelectedTab] = useState('all');
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});

    // Apply filters
    const filteredData = useMemo(() => {
        const smartSearch = safeString(filters.smartSearch).toLowerCase();
        if (!smartSearch) return data || [];
        return (data || []).filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(smartSearch))
        );
    }, [data, filters]);

    // Apply sorting to active tab data
    const sortedData = useMemo(() => {
        const grouped = { all: filteredData };
        filteredData.forEach(item => {
            const status = item['بيان الربحية'];
            if (status) {
                if (!grouped[status]) grouped[status] = [];
                grouped[status].push(item);
            }
        });

        const activeList = grouped[selectedTab] || [];
        if (!sortOrder.field || !sortOrder.order) return activeList;

        return [...activeList].sort((a, b) => {
            const av = a[sortOrder.field];
            const bv = b[sortOrder.field];
            if (av == null && bv == null) return 0;
            if (av == null) return sortOrder.order === 'asc' ? -1 : 1;
            if (bv == null) return sortOrder.order === 'asc' ? 1 : -1;
            const an = parseFloat(av);
            const bn = parseFloat(bv);
            if (!isNaN(an) && !isNaN(bn)) return sortOrder.order === 'asc' ? an - bn : bn - an;
            const comp = String(av).localeCompare(String(bv));
            return sortOrder.order === 'asc' ? comp : -comp;
        });
    }, [filteredData, sortOrder, selectedTab]);

    const tabsArray = useMemo(() => {
        const tabs = [{ value: 'all', label: `الكل (${filteredData.length})` }];
        const statuses = [...new Set(filteredData.map(i => i['بيان الربحية']).filter(Boolean))];
        statuses.forEach(s => {
            const count = filteredData.filter(i => i['بيان الربحية'] === s).length;
            tabs.push({ value: s, label: `${s} (${count})` });
        });
        return tabs;
    }, [filteredData]);

    const grandTotals = useMemo(() => ({
        qty: sortedData.reduce((sum, i) => sum + (parseFloat(i['الكمية']) || 0), 0),
        val: sortedData.reduce((sum, i) => sum + (parseFloat(i['اجمالي الربح']) || 0), 0)
    }), [sortedData]);

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        { title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'center', render: v => formatQuantity(v) },
        { title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'center', render: v => formatMoney(v) },
        { title: 'افرادي الشراء', dataIndex: 'افرادي الشراء', key: 'افرادي الشراء', width: 100, align: 'center', render: v => formatMoney(v) },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 150, align: 'right' },
        { title: 'افرادي الربح', dataIndex: 'افرادي الربح', key: 'افرادي الربح', width: 100, align: 'center', render: v => <strong style={{ color: v > 0 ? '#52c41a' : (v < 0 ? '#ff4d4f' : '#000') }}>{formatMoney(v)}</strong> },
        { title: 'اجمالي الربح', dataIndex: 'اجمالي الربح', key: 'اجمالي الربح', width: 100, align: 'center', render: v => <strong style={{ color: v > 0 ? '#52c41a' : (v < 0 ? '#ff4d4f' : '#000') }}>{formatMoney(v)}</strong> },
        { title: 'بيان الربحية', dataIndex: 'بيان الربحية', key: 'بيان الربحية', width: 120, align: 'center', render: v => <Tag color={v === 'ربح' ? 'green' : (v === 'خسارة' ? 'red' : 'default')}>{v}</Tag> },
        { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية', key: 'تاريخ العملية', width: 110, align: 'center' }
    ];

    const visibleColumns = useMemo(() => allColumns.filter(c => columnVisibility[c.dataIndex || c.key] !== false), [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((v) => setColumnVisibility(v), []);
    const handleSortOrderChange = useCallback((s) => setSortOrder(s), []);
    const handlePaginationChange = useCallback((p) => setPagination(p), []);
    const handleDensityChange = useCallback((d) => setDensity(d), []);

    if (!data) return <div className="padding-lg"><UnifiedAlert message={t('noData')} description={t('importExcelFirst')} /></div>;

    return (
        <UnifiedPageLayout
            title={`${t('salesCost')} (${sortedData.length} سجل)`}
            description="تحليل دقيق لتكلفة المبيعات وربحية كل عملية ناتجة عن مطابقة المشتريات بالمبيعات."
            interpretation="يقوم النظام بمطابقة كل عملية بيع مع أقرب عملية شراء مقابلة لها لحساب الربح الصافي. يوضح التقرير أين تربح وأين تخسر، مع إظهار المورد الأصلي لكل حبة مباعة."
            data={sortedData}
            columns={visibleColumns}
            filename={`sales_cost_${selectedTab}`}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="salesCost"
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
                headerExtra={<NavigationTabs value={selectedTab} onChange={(e) => { setSelectedTab(e.target.value); setPagination(p => ({ ...p, current: 1 })); }} tabs={tabsArray} />}
                dataSource={sortedData}
                columns={visibleColumns}
                rowKey="م"
                size={density}
                scroll={{ x: 1800 }}
                pagination={{ ...pagination, total: sortedData.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`${t('salesCost')} - ${selectedTab === 'all' ? 'الكل' : selectedTab} (${sortedData.length} سجل)`}
                summary={(pageData) => {
                    const pt = {
                        qty: pageData.reduce((sum, i) => sum + (parseFloat(i['الكمية']) || 0), 0),
                        val: pageData.reduce((sum, i) => sum + (parseFloat(i['اجمالي الربح']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}><strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(pt.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={4}></Table.Summary.Cell>
                                <Table.Summary.Cell index={9}><strong className="unified-table-summary" style={{ color: pt.val >= 0 ? '#52c41a' : '#ff4d4f' }}>{formatMoney(pt.val)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={10} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}><strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={4}></Table.Summary.Cell>
                                <Table.Summary.Cell index={9}><strong className="unified-table-summary" style={{ color: grandTotals.val >= 0 ? '#52c41a' : '#ff4d4f' }}>{formatMoney(grandTotals.val)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={10} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default SalesCostPage;