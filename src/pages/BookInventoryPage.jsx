import React, { useState, useMemo, useCallback } from 'react';
import { Alert, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import { useTranslation } from 'react-i18next';



function BookInventoryPage({ data, allReportsData }) {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });

    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} />
            </div>
        );
    }

    // Apply sorting to data
    const sortedData = useMemo(() => {
        if (!sortOrder.field || !sortOrder.order) {
            return data;
        }

        return [...data].sort((a, b) => {
            const aValue = a[sortOrder.field];
            const bValue = b[sortOrder.field];
            
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortOrder.order === 'asc' ? -1 : 1;
            if (bValue == null) return sortOrder.order === 'asc' ? 1 : -1;
            
            // Handle numeric values
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return sortOrder.order === 'asc' ? aNum - bNum : bNum - aNum;
            }
            
            // Handle string values
            const comparison = String(aValue).localeCompare(String(bValue));
            return sortOrder.order === 'asc' ? comparison : -comparison;
        });
    }, [data, sortOrder]);

    // تم تعريف الاعمدة بناءً على المخرجات النهائية للمنطق المحدث
    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => formatQuantity(text)
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120 },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => formatMoney(text)
        },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 120, align: 'center' },
        {
            title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 120, align: 'left',
            render: (text) => formatQuantity(text)
        },
    ];

    // Filter columns based on visibility settings
    const visibleColumns = allColumns.filter(col => 
        columnVisibility[col.dataIndex || col.key] !== false
    );

    // Stable callbacks using useCallback to prevent infinite loops
    const handleColumnVisibilityChange = useCallback((newVisibility) => {
        setColumnVisibility(newVisibility);
    }, []);

    const handleSortOrderChange = useCallback((newSortOrder) => {
        setSortOrder(newSortOrder);
    }, []);

    const handlePaginationChange = useCallback((newPagination) => {
        setPagination(newPagination);
    }, []);

    return (
        <UnifiedPageLayout
            title={t('bookInventory')}
            description="عرض نتيجة مطابقة صافي المبيعات مع صافي المشتريات حسب المفاتيح الاربعة المحددة."
            data={sortedData}
            columns={visibleColumns}
            filename="book-inventory"
            allReportsData={allReportsData}
            reportKey="bookInventory"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
        >
            <UnifiedTable
                dataSource={sortedData}
                columns={visibleColumns}
                rowKey="م"
                title={`${t('bookInventory')} (${sortedData.length} ${t('records')})`}
                scroll={{ x: 1800 }}
                size="middle"
                pagination={{ 
                    position: ['topRight', 'bottomRight'], 
                    pageSize: pagination.pageSize, 
                    showSizeChanger: true, 
                    pageSizeOptions: ['25', '50', '100', '200'] 
                }}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4}>
                            <strong className="unified-table-summary">{t('total')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                            <strong className="unified-table-summary">
                                {formatQuantity(sortedData.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                            </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} colSpan={7}></Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </UnifiedPageLayout>
    );
}

export default BookInventoryPage;