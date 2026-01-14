import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import UnifiedAlert from '../components/UnifiedAlert';

const InventoryTurnoverPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});

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
            const comparison = safeString(aValue).localeCompare(safeString(bValue));
            return sortOrder.order === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortOrder]);

    const grandTotals = useMemo(() => {
        return {
            inventoryValue: filteredData.reduce((sum, item) => sum + (parseFloat(item['متوسط المخزون']) || 0), 0),
            annualCOGS: filteredData.reduce((sum, item) => sum + (parseFloat(item['تكلفة المبيعات السنوية']) || 0), 0)
        };
    }, [filteredData]);

    const getClassificationColor = (c) => {
        switch (c) {
            case 'سريع': return 'green';
            case 'متوسط': return 'blue';
            case 'بطيء': return 'orange';
            case 'راكد': return 'red';
            default: return 'default';
        }
    };

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 150, align: 'right' },
        { title: 'متوسط المخزون', dataIndex: 'متوسط المخزون', key: 'متوسط المخزون', width: 100, align: 'center', render: v => formatMoney(v) },
        { title: 'تكلفة المبيعات', dataIndex: 'تكلفة المبيعات السنوية', key: 'تكلفة المبيعات السنوية', width: 110, align: 'center', render: v => formatMoney(v) },
        {
            title: 'معدل الدوران', dataIndex: 'معدل دوران المخزون', key: 'معدل دوران المخزون', width: 100, align: 'center',
            render: val => <strong style={{ color: val > 12 ? '#52c41a' : (val > 6 ? '#1890ff' : '#fa8c16') }}>{formatQuantity(val)}</strong>
        },
        { title: 'فترة التخزين', dataIndex: 'فترة التخزين', key: 'فترة التخزين', width: 100, align: 'center', render: v => <span>{v} يوم</span> },
        { title: 'حركة 90 يوم', dataIndex: 'حركة آخر 90 يوم', key: 'حركة آخر 90 يوم', width: 100, align: 'center', render: v => formatQuantity(v) },
        { title: 'فئة الدوران', dataIndex: 'فئة الدوران', key: 'فئة الدوران', width: 90, align: 'center', render: v => <Tag color={getClassificationColor(v)}>{v}</Tag> },
        { title: 'مؤشر المخاطرة', dataIndex: 'مؤشر الخطورة', key: 'مؤشر الخطورة', width: 90, align: 'center', render: v => <Tag color={v > 70 ? 'red' : (v > 40 ? 'orange' : 'green')}>{v}</Tag> }
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
            title={`معدل دوران المخزون (${filteredData.length} صنف)`}
            description="قياس كفاءة استهلاك المخزون وسرعة تحوله إلى مبيعات، مع تحديد الأصناف الراكدة ونسب المخاطرة."
            interpretation="يجاوب هذا التقرير على سؤال 'كم مرة تبيع وتشتري بضاعتك في السنة؟'. دوران المخزون العالي يعني أن بضاعتك لا تبقى طويلاً في الرف (كفاءة عالية). بينما الدوران المنخفض يعني أن سيولتك 'نائمة' في المخزن. مؤشر الخطورة هنا ينبهك للأصناف التي قد تسبب لك خسائر في المستقبل نتيجة التلف أو انتهاء الصلاحية."
            data={sortedData}
            columns={visibleColumns}
            filename="inventory_turnover"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="inventoryTurnover"
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
            exportColumns={allColumns}
        >
            <UnifiedTable
                dataSource={sortedData}
                columns={visibleColumns}
                rowKey="م"
                scroll={{ x: 1800 }}
                size={density}
                pagination={{ ...pagination, total: filteredData.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`تحليل كفاءة دوران المخزون (${filteredData.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        inventory: pageData.reduce((sum, item) => sum + (parseFloat(item['متوسط المخزون']) || 0), 0),
                        cogs: pageData.reduce((sum, item) => sum + (parseFloat(item['تكلفة المبيعات السنوية']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={5}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatMoney(pageTotals.inventory)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(pageTotals.cogs)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={5}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatMoney(grandTotals.inventoryValue)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(grandTotals.annualCOGS)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default InventoryTurnoverPage;