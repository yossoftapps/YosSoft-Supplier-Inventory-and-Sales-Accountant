import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table, Tag, Progress } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import UnifiedAlert from '../components/UnifiedAlert';

const SupplierScorecardsPage = memo(({ data, allReportsData, availableReports }) => {
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
            purchQty: filteredData.reduce((sum, item) => sum + (parseFloat(item['إجمالي الكمية المشتراة']) || 0), 0),
            purchVal: filteredData.reduce((sum, item) => sum + (parseFloat(item['إجمالي القيمة المشتراة']) || 0), 0),
            retQty: filteredData.reduce((sum, item) => sum + (parseFloat(item['إجمالي الكمية المرتجعة']) || 0), 0),
            retVal: filteredData.reduce((sum, item) => sum + (parseFloat(item['إجمالي القيمة المرتجعة']) || 0), 0)
        };
    }, [filteredData]);

    const getScoreColor = (score) => {
        if (score >= 80) return 'green';
        if (score >= 60) return 'blue';
        if (score >= 40) return 'orange';
        return 'red';
    };

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 180, align: 'right' },
        { title: 'الأصناف', dataIndex: 'عدد الأصناف', key: 'عدد الأصناف', width: 80, align: 'center' },
        { title: 'كمية مشتراة', dataIndex: 'إجمالي الكمية المشتراة', key: 'إجمالي الكمية المشتراة', width: 100, align: 'center', render: val => formatQuantity(val) },
        { title: 'قيمة مشتراة', dataIndex: 'إجمالي القيمة المشتراة', key: 'إجمالي القيمة المشتراة', width: 110, align: 'center', render: val => formatMoney(val) },
        { title: 'كمية مرتجعة', dataIndex: 'إجمالي الكمية المرتجعة', key: 'إجمالي الكمية المرتجعة', width: 100, align: 'center', render: val => formatQuantity(val) },
        { title: 'قيمة مرتجعة', dataIndex: 'إجمالي القيمة المرتجعة', key: 'إجمالي القيمة المرتجعة', width: 110, align: 'center', render: val => formatMoney(val) },
        {
            title: 'مرتجعات %', dataIndex: 'نسبة المرتجعات %', key: 'نسبة المرتجعات %', width: 90, align: 'center',
            render: val => <Tag color={val > 10 ? 'red' : (val > 5 ? 'orange' : 'green')}>{val}%</Tag>
        },
        { title: 'تباين الأسعار', dataIndex: 'تباين الأسعار', key: 'تباين الأسعار', width: 90, align: 'center' },
        {
            title: 'الجودة', dataIndex: 'درجة الجودة', key: 'درجة الجودة', width: 100, align: 'center',
            render: val => <Progress percent={val} strokeColor={getScoreColor(val)} size="small" />
        },
        {
            title: 'التسعير', dataIndex: 'درجة التسعير', key: 'درجة التسعير', width: 100, align: 'center',
            render: val => <Progress percent={val} strokeColor={getScoreColor(val)} size="small" />
        },
        {
            title: 'الإجمالي', dataIndex: 'الدرجة الإجمالية', key: 'الدرجة الإجمالية', width: 90, align: 'center',
            render: val => <Tag color={getScoreColor(val)} style={{ fontWeight: 'bold' }}>{val}</Tag>
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
            title={`بطاقة تقييم الموردين (${sortedData.length} مورد)`}
            description="تقييم تفصيلي لأداء الموردين بناءً على المشتريات، المرتجعات، استقرار الأسعار والجودة العامة."
            interpretation="يقدم هذا التقرير 'درجة ذكاء' لكل مورد. حيث يحلل تاريخ تعاملك معه: هل يرفع الأسعار باستمرار؟ هل بضاعته كثيرة المرتجعات؟ هل يلتزم بالكميات؟ الدرجة الإجمالية (Score) تساعدك في ترتيب أولوياتك وسدادك وتوريداتك المستقبلية."
            data={sortedData}
            columns={visibleColumns}
            filename="supplier_scorecards"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="supplierScorecards"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="purchases"
            onFilterChange={setFilters}
            category="analytical"
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
                title={`بطاقات تقييم الموردين (${filteredData.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        purchQty: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي الكمية المشتراة']) || 0), 0),
                        purchVal: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي القيمة المشتراة']) || 0), 0),
                        retQty: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي الكمية المرتجعة']) || 0), 0),
                        retVal: pageData.reduce((sum, item) => sum + (parseFloat(item['إجمالي القيمة المرتجعة']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}><strong className="unified-table-summary">{formatQuantity(pageTotals.purchQty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatMoney(pageTotals.purchVal)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatQuantity(pageTotals.retQty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(pageTotals.retVal)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}><strong className="unified-table-summary">{formatQuantity(grandTotals.purchQty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatMoney(grandTotals.purchVal)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatQuantity(grandTotals.retQty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(grandTotals.retVal)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default SupplierScorecardsPage;