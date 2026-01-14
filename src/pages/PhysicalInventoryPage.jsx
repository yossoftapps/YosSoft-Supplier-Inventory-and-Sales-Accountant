import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity } from '../utils/financialCalculations.js';
import { filterInventoryData } from '../utils/dataFilter.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';

const PhysicalInventoryPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('listE');
    const [filters, setFilters] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');

    const filteredData = useMemo(() => {
        if (!data) return { listE: [], listF: [] };
        return filterInventoryData(data, filters);
    }, [data, filters]);

    const sortedData = useMemo(() => {
        const sortArr = (arr) => {
            if (!sortOrder.field || !sortOrder.order || !arr) return arr;
            return [...arr].sort((a, b) => {
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
        };
        return { listE: sortArr(filteredData.listE), listF: sortArr(filteredData.listF) };
    }, [filteredData, sortOrder]);

    const activeList = selectedTab === 'listE' ? sortedData.listE : sortedData.listF;

    const grandTotals = useMemo(() => {
        const calc = (list) => list.reduce((sum, r) => sum + (parseFloat(r['الكمية']) || 0), 0);
        return { listE: calc(sortedData.listE), listF: calc(sortedData.listF) };
    }, [sortedData]);

    const currentGT = selectedTab === 'listE' ? grandTotals.listE : grandTotals.listF;

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        { title: 'الكمية الجردية', dataIndex: 'الكمية', key: 'الكمية', width: 110, align: 'center', render: v => formatQuantity(v) },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 110, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 150, align: 'right' }
    ];

    const visibleColumns = useMemo(() => allColumns.filter(c => columnVisibility[c.dataIndex || c.key] !== false), [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((v) => setColumnVisibility(v), []);
    const handleSortOrderChange = useCallback((s) => setSortOrder(s), []);
    const handlePaginationChange = useCallback((p) => setPagination(p), []);
    const handleDensityChange = useCallback((d) => setDensity(d), []);

    if (!data) return <div className="padding-lg"><UnifiedAlert message={t('noData')} description={t('importExcelFirst')} /></div>;

    return (
        <UnifiedPageLayout
            title={`${t('physicalInventory')} (${activeList.length} سجل)`}
            description="عرض قائمة الجرد الفعلي المرفقة، مفرزة آلياً للتمييز بين الكميات الصالحة والمشاكل."
            interpretation="يقوم النظام بتقسيم الجرد الفعلي المرفوع إلى قائمتين: القائمة E للمواد ذات الكميات الموجبة والصلاحية المقبولة، والقائمة F للمواد ذات الكميات السالبة، الصفرية، أو منتهية الصلاحية، لتسهيل الرقابة المخزنية."
            data={activeList}
            columns={visibleColumns}
            filename={`physical_inventory_${selectedTab}`}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="physicalInventory"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="inventory"
            onFilterChange={setFilters}
            category="basic"
            exportColumns={allColumns}
        >
            <UnifiedTable
                headerExtra={
                    <NavigationTabs
                        value={selectedTab}
                        onChange={(e) => { setSelectedTab(e.target.value); setPagination(prev => ({ ...prev, current: 1 })); }}
                        tabs={[{ value: 'listE', label: `قائمة E: كميات موجبة (${sortedData.listE.length})` }, { value: 'listF', label: `قائمة F: مشاكل جردية (${sortedData.listF.length})` }]}
                    />
                }
                dataSource={activeList}
                columns={visibleColumns}
                rowKey="م"
                scroll={{ x: 1200 }}
                size={density}
                pagination={{ ...pagination, total: activeList.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`كشف الجرد الفعلي - ${selectedTab === 'listE' ? 'القائمة E' : 'القائمة F'} (${activeList.length} سجل)`}
                summary={(pageData) => {
                    const pt = pageData.reduce((sum, r) => sum + (parseFloat(r['الكمية']) || 0), 0);
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}><strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(pt)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}><strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(currentGT)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default PhysicalInventoryPage;