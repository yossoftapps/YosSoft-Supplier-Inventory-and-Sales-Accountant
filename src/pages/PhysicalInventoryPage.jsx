import React, { useState, useMemo, useCallback } from 'react';
import { Typography, Table, Radio } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { filterInventoryData } from '../utils/dataFilter.js';
import { useTranslation } from 'react-i18next';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';

const { Title } = Typography;

function PhysicalInventoryPage({ data, allReportsData }) {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('listE');
    const [filters, setFilters] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });

    // Apply filters to data using useMemo for performance
    const filteredData = useMemo(() => {
        if (!data) return { listE: [], listF: [] };
        return filterInventoryData(data, filters);
    }, [data, filters]);

    // Apply sorting to data
    const sortedData = useMemo(() => {
        if (!sortOrder.field || !sortOrder.order) {
            return filteredData;
        }

        const sortData = (dataArray) => {
            if (!dataArray || !Array.isArray(dataArray)) return dataArray;
            
            return [...dataArray].sort((a, b) => {
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
        };

        return {
            listE: sortData(filteredData.listE),
            listF: sortData(filteredData.listF)
        };
    }, [filteredData, sortOrder]);

    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} type="info" showIcon />
            </div>
        );
    }

    // تم تعريف الاعمدة بناءً على المخرجات النهائية للمنطق
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
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 100, align: 'center' },
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
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
            title={t('physicalInventory')}
            description="عرض الكميات الموجبة بعد التصفية، والكميات السالبة والمنتهية الصلاحية."
            data={selectedTab === 'listE' ? sortedData.listE : sortedData.listF}
            columns={visibleColumns}
            filename={selectedTab === 'listE' ? 'positive-inventory' : 'negative-expired-inventory'}
            allReportsData={allReportsData}
            reportKey="physicalInventory"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            filterData={data}
            filterDataType="inventory"
            onFilterChange={setFilters}
        >
            <Radio.Group value={selectedTab} onChange={(e) => setSelectedTab(e.target.value)} style={{ marginBottom: 16 }}>
                <Radio.Button value="listE">قائمة E: الكميات الموجبة ({sortedData.listE.length})</Radio.Button>
                <Radio.Button value="listF">قائمة F: الكميات السالبة والمنتهية ({sortedData.listF.length})</Radio.Button>
            </Radio.Group>

            {selectedTab === 'listE' && (
                <UnifiedTable
                    title={`قائمة E: سجلات الكميات الموجبة (الكمية > 0) (${sortedData.listE.length} ${t('records')})`}
                    dataSource={sortedData.listE}
                    columns={visibleColumns}
                    rowKey="م"
                    scroll={{ x: 1200 }}
                    size="small"
                    pagination={{ 
                        position: ['topRight', 'bottomRight'], 
                        pageSize: pagination.pageSize, 
                        showSizeChanger: true, 
                        pageSizeOptions: ['25', '50', '100', '200'] 
                    }}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <strong className="unified-table-summary">الإجمالي</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                                <strong className="unified-table-summary">
                                    {formatQuantity(sortedData.listE.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={4}></Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            )}
            {selectedTab === 'listF' && (
                <UnifiedTable
                    title={`قائمة F: سجلات الكميات السالبة + الصلاحية المنتهية (${sortedData.listF.length} ${t('records')})`}
                    dataSource={sortedData.listF}
                    columns={visibleColumns}
                    rowKey="م"
                    scroll={{ x: 1200 }}
                    size="small"
                    pagination={{ 
                        position: ['topRight', 'bottomRight'], 
                        pageSize: pagination.pageSize, 
                        showSizeChanger: true, 
                        pageSizeOptions: ['25', '50', '100', '200'] 
                    }}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <strong className="unified-table-summary">الإجمالي</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                                <strong className="unified-table-summary">
                                    {formatQuantity(sortedData.listF.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0))}
                                </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={4}></Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            )}
        </UnifiedPageLayout>
    );
}

export default PhysicalInventoryPage;