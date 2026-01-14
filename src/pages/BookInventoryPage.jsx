import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import safeString from '../utils/safeString.js';
import UnifiedAlert from '../components/UnifiedAlert';

const BookInventoryPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [filters, setFilters] = useState({});
    const [density, setDensity] = useState('small');

    const filteredData = useMemo(() => {
        const smartSearch = safeString(filters.smartSearch).toLowerCase();
        if (!smartSearch) return data || [];
        return (data || []).filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(smartSearch))
        );
    }, [data, filters]);

    const sortedData = useMemo(() => {
        if (!sortOrder.field || !sortOrder.order) return filteredData;
        return [...filteredData].sort((a, b) => {
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
    }, [filteredData, sortOrder]);

    const grandTotals = useMemo(() => ({
        qty: (sortedData || []).reduce((sum, r) => sum + (parseFloat(r['الكمية']) || 0), 0)
    }), [sortedData]);

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        { title: 'الكمية الدفترية', dataIndex: 'الكمية', key: 'الكمية', width: 110, align: 'center', render: v => formatQuantity(v) },
        { title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'center', render: v => formatMoney(v) },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 110, align: 'center' },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 150, align: 'right' },
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
            title={`${t('bookInventory')} (${sortedData.length} سجل)`}
            description="عرض نتيجة مطابقة صافي المبيعات مع صافي المشتريات لتحديد الرصيد المتبقي في المخزن دفترياً."
            interpretation="يوضح هذا التقرير الجرد الدفتري المحسوب ذكياً. يتم اشتقاق هذه الكميات من خلال تتبع كل فاتورة شراء وخصم كل فاتورة بيع مرتبطة بها آلياً، مما يعطيك أرصدة دقيقة للفترات المالية المحددة."
            data={sortedData}
            columns={visibleColumns}
            filename="book_inventory"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="bookInventory"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={{ listE: data }}
            filterDataType="inventory"
            onFilterChange={setFilters}
            category="inventory"
        >
            <UnifiedTable
                dataSource={sortedData}
                columns={visibleColumns}
                rowKey="م"
                scroll={{ x: 1600 }}
                size={density}
                pagination={{ ...pagination, total: sortedData.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`كشف الجرد الدفتري للمواد المفلترة (${sortedData.length} سجل)`}
                summary={(pageData) => {
                    const pt = pageData.reduce((sum, r) => sum + (parseFloat(r['الكمية']) || 0), 0);
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}><strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(pt)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}><strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default BookInventoryPage;