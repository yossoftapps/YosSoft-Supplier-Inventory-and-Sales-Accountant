import React, { useState, useMemo, useCallback } from 'react';
import { Typography, Table, Tag } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

function SalesCostPage({ data, allReportsData }) {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });

    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} type="info" showIcon />
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

    // دالة لتحديد لون "بيان الربحية" و "الملاحظات"
    const getTagProps = (status, type) => {
        if (type === 'profit') {
            switch (status) {
                case 'ربح': return { color: 'green' };
                case 'خسارة': return { color: 'red' };
                default: return { color: 'default' };
            }
        }
        if (type === 'notes') {
            switch (status) {
                case 'مطابق': return { color: 'green' };
                case 'لا يوجد مشتريات': return { color: 'orange' };
                default: return { color: 'default' };
            }
        }
        return {};
    };

    // تعريف اعمدة الجدول بناءً على مخرجات منطق التكلفة
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
        { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية', key: 'تاريخ العملية', width: 120 },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'افرادي الشراء', dataIndex: 'افرادي الشراء', key: 'افرادي الشراء', width: 90, align: 'left',
            render: (text) => formatMoney(text)
        },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
        {
            title: 'افرادي الربح', dataIndex: 'افرادي الربح', key: 'افرادي الربح', width: 100, align: 'left',
            render: (text) => {
                const value = parseInt(text, 10) || 0;
                return <strong style={{ color: value > 0 ? '#52c41a' : (value < 0 ? '#ff4d4f' : '#000') }}>{formatMoney(value)}</strong>
            }
        },
        {
            title: 'نسبة الربح', dataIndex: 'نسبة الربح', key: 'نسبة الربح', width: 100, align: 'center',
            render: (text) => {
                return <strong>{text}</strong>
            }
        },
        {
            title: 'اجمالي الربح', dataIndex: 'اجمالي الربح', key: 'اجمالي الربح', width: 110, align: 'left',
            render: (text) => {
                const value = parseInt(text, 10) || 0;
                return <strong style={{ color: value > 0 ? '#52c41a' : (value < 0 ? '#ff4d4f' : '#000') }}>{formatMoney(value)}</strong>
            }
        },
        { title: 'عمر العملية', dataIndex: 'عمر العملية', key: 'عمر العملية', width: 100, align: 'center' },
        {
            title: 'بيان الربحية', dataIndex: 'بيان الربحية', key: 'بيان الربحية', width: 100, align: 'center',
            render: (text) => <Tag {...getTagProps(text, 'profit')}>{text}</Tag>
        },
        {
            title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 120, align: 'center',
            render: (text) => <Tag {...getTagProps(text, 'notes')}>{text}</Tag>
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
            title={t('salesCost')}
            description="عرض تكلفة وربحية كل عملية بيع، مع تحديد تكلفة الشراء المطابقة."
            data={sortedData}
            columns={visibleColumns}
            filename="sales-cost"
            allReportsData={allReportsData}
            reportKey="salesCost"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
        >
            <UnifiedTable
                title={`${t('salesCost')} (${sortedData.length} ${t('records')})`}
                dataSource={sortedData}
                columns={visibleColumns}
                rowKey="م"
                size="small"
                scroll={{ x: 2000 }}
                pagination={{ 
                    position: ['topRight', 'bottomRight'], 
                    pageSize: pagination.pageSize, 
                    showSizeChanger: true, 
                    pageSizeOptions: ['25', '50', '100', '200'] 
                }}
                summary={(pageData) => {
                    let totalProfit = 0;
                    let totalQuantity = 0;

                    pageData.forEach((record) => {
                        totalProfit += parseInt(record['اجمالي الربح'] || 0);
                        totalQuantity += parseFloat(record['الكمية'] || 0);
                    });

                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">{t('totalForPage')}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <strong className="unified-table-summary">{formatQuantity(totalQuantity)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={8}></Table.Summary.Cell>
                                <Table.Summary.Cell index={13}>
                                    <strong className="unified-table-summary" style={{ color: totalProfit > 0 ? '#52c41a' : (totalProfit < 0 ? '#ff4d4f' : '#000') }}>
                                        {formatMoney(totalProfit)}
                                    </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={14} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">{t('totalOverall')}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <strong className="unified-table-summary">
                                        {formatQuantity(sortedData.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                    </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={8}></Table.Summary.Cell>
                                <Table.Summary.Cell index={13}>
                                    <strong className="unified-table-summary" style={{ color: sortedData.reduce((sum, record) => sum + parseInt(record['اجمالي الربح'] || 0), 0) > 0 ? '#52c41a' : (sortedData.reduce((sum, record) => sum + parseInt(record['اجمالي الربح'] || 0), 0) < 0 ? '#ff4d4f' : '#000') }}>
                                        {formatMoney(sortedData.reduce((sum, record) => sum + parseInt(record['اجمالي الربح'] || 0), 0))}
                                    </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={14} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
}

export default SalesCostPage;