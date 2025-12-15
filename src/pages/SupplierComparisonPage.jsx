import React, { useState, useMemo, useCallback } from 'react';
import { Table, Tag } from 'antd';
import { formatMoney } from '../utils/financialCalculations.js';
import { useTranslation } from 'react-i18next';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';

function SupplierComparisonPage({ data, allReportsData }) {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });

    // Apply sorting to data
    const sortedData = useMemo(() => {
        if (!data) return [];
        if (!sortOrder.field || !sortOrder.order) {
            return data;
        }

        return [...data].sort((a, b) => {
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
    }, [data, sortOrder]);

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 200, fixed: 'left' },
        {
            title: 'درجة المورد', dataIndex: 'درجة المورد', key: 'درجة المورد', width: 100, align: 'center',
            render: (value) => {
                let color = value >= 80 ? 'green' : value >= 60 ? 'blue' : value >= 40 ? 'orange' : 'red';
                return <Tag color={color}>{value}</Tag>;
            }
        },
        { title: 'ترتيب المورد', dataIndex: 'ترتيب المورد', key: 'ترتيب المورد', width: 100, align: 'center' },
        {
            title: 'قرار التعامل', dataIndex: 'قرار التعامل الموصى به', key: 'قرار التعامل الموصى به', width: 120, align: 'center',
            render: (text) => {
                let color = text === 'تفضيل' ? 'green' : text === 'استمرار' ? 'blue' : text === 'مراقبة' ? 'orange' : 'red';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        { title: 'نسبة المرتجعات %', dataIndex: 'نسبة المرتجعات %', key: 'نسبة المرتجعات %', width: 120, align: 'center', render: (val) => `${val}%` },
        { title: 'عدد الأخطاء', dataIndex: 'عدد الأخطاء في التوريد', key: 'عدد الأخطاء في التوريد', width: 100, align: 'center' },
        { title: 'الالتزام بالكمية %', dataIndex: 'نسبة الالتزام بالكمية', key: 'نسبة الالتزام بالكمية', width: 120, align: 'center', render: (val) => `${val}%` },
        { title: 'الالتزام بالوقت %', dataIndex: 'نسبة الالتزام بالوقت', key: 'نسبة الالتزام بالوقت', width: 120, align: 'center', render: (val) => `${val}%` },
        { title: 'قيمة المخزون الحالي', dataIndex: 'قيمة المخزون الحالي', key: 'قيمة المخزون الحالي', width: 150, align: 'left', render: (val) => formatMoney(val) },
        { title: 'قيمة المخزون الراكد', dataIndex: 'قيمة المخزون الراكد', key: 'قيمة المخزون الراكد', width: 150, align: 'left', render: (val) => formatMoney(val) },
        { title: 'الأصناف المنتهية', dataIndex: 'الأصناف المنتهية', key: 'الأصناف المنتهية', width: 120, align: 'center' },
        { title: 'متوسط فترة السداد', dataIndex: 'متوسط فترة السداد', key: 'متوسط فترة السداد', width: 120, align: 'center' },
        { title: 'الالتزام المالي %', dataIndex: 'الالتزام المالي', key: 'الالتزام المالي', width: 120, align: 'center', render: (val) => `${val}%` },
        { title: 'الرصيد', dataIndex: 'الرصيد', key: 'الرصيد', width: 120, align: 'left', render: (val) => formatMoney(val) },
    ];

    const visibleColumns = allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);

    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} />
            </div>
        );
    }

    return (
        <UnifiedPageLayout
            title="مقارنة الموردين"
            description="تقرير شامل لمقارنة أداء الموردين بناءً على معايير متعددة."
            data={sortedData}
            columns={visibleColumns}
            filename="supplier-comparison"
            allReportsData={allReportsData}
            reportKey="supplierComparison"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
        >
            <UnifiedTable
                dataSource={sortedData}
                columns={visibleColumns}
                rowKey="م"
                title={`مقارنة الموردين (${sortedData.length} مورد)`}
                scroll={{ x: 1800 }}
                pagination={{
                    position: ['topRight', 'bottomRight'],
                    pageSize: pagination.pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['25', '50', '100', '200']
                }}
            />
        </UnifiedPageLayout>
    );
}

export default SupplierComparisonPage;
