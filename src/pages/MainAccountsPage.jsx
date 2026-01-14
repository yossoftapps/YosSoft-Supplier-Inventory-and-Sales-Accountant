import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import UnifiedAlert from '../components/UnifiedAlert';

const MainAccountsPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});

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

    // Apply Sorting
    const sortedData = useMemo(() => {
        if (!sortOrder.field || !sortOrder.order) return filteredData;

        return [...filteredData].sort((a, b) => {
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
    }, [filteredData, sortOrder]);

    const grandTotals = useMemo(() => {
        return {
            count: filteredData.reduce((sum, item) => sum + (item['عدد الموردين'] || 0), 0),
            debt: filteredData.reduce((sum, item) => sum + (parseFloat(item['إجمالي المديونية']) || 0), 0),
            inv: filteredData.reduce((sum, item) => sum + (parseFloat(item['إجمالي قيمة المخزون']) || 0), 0),
            gap: filteredData.reduce((sum, item) => sum + (parseFloat(item['صافي الفجوة']) || 0), 0),
            due: filteredData.reduce((sum, item) => sum + (parseFloat(item['إجمالي الاستحقاق']) || 0), 0)
        };
    }, [filteredData]);

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'الحساب الرئيسي', dataIndex: 'الحساب الرئيسي', key: 'الحساب الرئيسي', width: 140, align: 'right' },
        { title: 'عدد الموردين', dataIndex: 'عدد الموردين', key: 'عدد الموردين', width: 100, align: 'center' },
        { title: 'إجمالي المديونية', dataIndex: 'إجمالي المديونية', key: 'إجمالي المديونية', width: 120, align: 'center', render: v => <span style={{ color: v < 0 ? '#ff4d4f' : '#1890ff' }}>{formatMoney(v)}</span> },
        { title: 'إجمالي المخزون', dataIndex: 'إجمالي قيمة المخزون', key: 'إجمالي قيمة المخزون', width: 120, align: 'center', render: v => formatMoney(v) },
        { title: 'صافي الفجوة', dataIndex: 'صافي الفجوة', key: 'صافي الفجوة', width: 120, align: 'center', render: v => <strong style={{ color: v < 0 ? '#ff4d4f' : '#52c41a' }}>{formatMoney(v)}</strong> },
        { title: 'إجمالي الاستحقاق', dataIndex: 'إجمالي الاستحقاق', key: 'إجمالي الاستحقاق', width: 120, align: 'center', render: v => formatMoney(v) },
        { title: 'فائض المخزون', dataIndex: 'فائض المخزون', key: 'فائض المخزون', width: 120, align: 'center', render: v => formatMoney(v) },
        { title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 120, align: 'center', render: v => formatMoney(v) },
        { title: 'مخزون مثالي', dataIndex: 'مخزون مثالي', key: 'مخزون مثالي', width: 120, align: 'center', render: v => formatMoney(v) },
        { title: 'اصناف جديدة', dataIndex: 'اصناف جديدة', key: 'اصناف جديدة', width: 120, align: 'center', render: v => formatMoney(v) },
        { title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 120, align: 'center', render: v => formatMoney(v) }
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
            title={`ملخص الحسابات الرئيسية (${sortedData.length} حساب)`}
            description="نظرة رفيعة المستوى على المديونية وقيم المخزون المجمعة حسب تصنيف الحسابات الرئيسية."
            interpretation="يوضح هذا التقرير تجميعاً لموقف الموردين تحت كل حساب مساعد رئيسي. 'صافي الفجوة' هو الفرق بين قيمة البضاعة المتوفرة لهذا النوع من الحسابات والمديونية المستحقة. القيمة الخضراء تعني أن قيمة بضاعة الموردين في مخزنك تغطي ديونهم، بينما تعني الحمراء وجود فجوة تمويلية."
            data={sortedData}
            columns={visibleColumns}
            filename="main_accounts_summary"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="mainAccounts"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="suppliers"
            onFilterChange={setFilters}
            category="financial"
            exportColumns={allColumns}
        >
            <UnifiedTable
                dataSource={sortedData}
                columns={visibleColumns}
                rowKey="م"
                scroll={{ x: 1800 }}
                size={density}
                pagination={{ ...pagination, total: sortedData.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`كشف ملخص الحسابات (${sortedData.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        debt: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي المديونية']) || 0), 0),
                        inv: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي قيمة المخزون']) || 0), 0),
                        gap: pageData.reduce((sum, item) => sum + (parseFloat(item['صافي الفجوة']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}><strong className="unified-table-summary">{formatMoney(pageTotals.debt)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatMoney(pageTotals.inv)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatMoney(pageTotals.gap)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6} colSpan={6}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}><strong className="unified-table-summary">{formatMoney(grandTotals.debt)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatMoney(grandTotals.inv)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatMoney(grandTotals.gap)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6} colSpan={6}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});;

export default MainAccountsPage;