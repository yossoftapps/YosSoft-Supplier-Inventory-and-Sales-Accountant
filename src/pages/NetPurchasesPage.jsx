import React, { useState, useMemo, useCallback, memo } from 'react';
import { Typography, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { filterPurchasesData } from '../utils/dataFilter.js';
import { useTranslation } from 'react-i18next';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import { NET_PURCHASES_DEFAULT_COLUMNS } from '../constants/netPurchasesColumns.js';

const { Title } = Typography;

const NetPurchasesPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('netPurchases');
    const [filters, setFilters] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');

    // Apply filters
    const filteredData = useMemo(() => {
        if (!data) return { netPurchasesList: [], orphanReturnsList: [] };
        return filterPurchasesData(data, filters);
    }, [data, filters]);

    // Apply sorting
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

                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sortOrder.order === 'asc' ? aNum - bNum : bNum - aNum;
                }
                const comparison = safeString(aValue).localeCompare(safeString(bValue));
                return sortOrder.order === 'asc' ? comparison : -comparison;
            });
        };

        return {
            netPurchasesList: sortData(filteredData.netPurchasesList),
            orphanReturnsList: sortData(filteredData.orphanReturnsList)
        };
    }, [filteredData, sortOrder]);

    const activeList = useMemo(() => {
        switch (selectedTab) {
            case 'netPurchases':
                return sortedData.netPurchasesList;
            case 'orphanReturns':
                return sortedData.orphanReturnsList;
            case 'returnPending':
                return sortedData.netPurchasesList.filter(item => item['بيان الحالة'] === 'معد للارجاع');
            case 'newItem':
                return sortedData.netPurchasesList.filter(item => item['بيان الحالة'] === 'صنف جديد');
            case 'good':
                return sortedData.netPurchasesList.filter(item => item['بيان الحالة'] === 'جيد');
            default:
                return sortedData.netPurchasesList;
        }
    }, [sortedData, selectedTab]);

    const grandTotals = useMemo(() => {
        const calc = (list) => ({
            qty: list.reduce((sum, r) => sum + (parseFloat(r['الكمية']) || 0), 0),
            val: list.reduce((sum, r) => sum + ((parseFloat(r['الكمية']) || 0) * (parseFloat(r['الافرادي']) || 0)), 0)
        });
        
        const returnPending = calc(sortedData.netPurchasesList.filter(item => item['بيان الحالة'] === 'معد للارجاع'));
        const newItem = calc(sortedData.netPurchasesList.filter(item => item['بيان الحالة'] === 'صنف جديد'));
        const good = calc(sortedData.netPurchasesList.filter(item => item['بيان الحالة'] === 'جيد'));
        
        return { 
            net: calc(sortedData.netPurchasesList), 
            orphan: calc(sortedData.orphanReturnsList),
            returnPending,
            newItem,
            good
        };
    }, [sortedData]);

    const currentGT = useMemo(() => {
        switch (selectedTab) {
            case 'netPurchases':
                return grandTotals.net;
            case 'orphanReturns':
                return grandTotals.orphan;
            case 'returnPending':
                return grandTotals.returnPending;
            case 'newItem':
                return grandTotals.newItem;
            case 'good':
                return grandTotals.good;
            default:
                return grandTotals.net;
        }
    }, [selectedTab, grandTotals]);

    const visibleColumns = useMemo(() => NET_PURCHASES_DEFAULT_COLUMNS.filter(c => columnVisibility[c.dataIndex || c.key] !== false), [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((v) => setColumnVisibility(v), []);
    const handleSortOrderChange = useCallback((s) => setSortOrder(s), []);
    const handlePaginationChange = useCallback((p) => setPagination(p), []);
    const handleDensityChange = useCallback((d) => setDensity(d), []);

    if (!data) return <div className="padding-lg"><UnifiedAlert message={t('noData')} description={t('importExcelFirst')} /></div>;

    return (
        <UnifiedPageLayout
            title={`${
                selectedTab === 'netPurchases' ? 'صافي المشتريات المفلترة' : 
                selectedTab === 'orphanReturns' ? 'المرتجعات غير المطابقة' :
                selectedTab === 'returnPending' ? 'الأصناف المعدة للإرجاع' :
                selectedTab === 'newItem' ? 'الأصناف الجديدة' :
                selectedTab === 'good' ? 'الأصناف الجيدة' :
                'صافي المشتريات المفلترة'
            } (${activeList.length} سجل)`}
            description="عرض المشتريات بعد خصم المرتجعات المطابقة، أو عرض المرتجعات التي لم يتم العثور على مشتريات مقابلة لها."
            interpretation="يقوم المحرك الذكي بربط كل مرتجع بفاتورة الشراء الأصلية الخاصة به. في تبويب 'المشتريات الفعلية'، ترى ما اشتريته فعلياً مخصوماً منه المرتجعات. أما 'المرتجعات اليتيمة' فهي مرتجعات تمت في المحل ولكن النظام لم يجد لها فاتورة شراء مقابلة في الملفات المرفوعة."
            data={activeList}
            columns={visibleColumns}
            filename={`net_purchases_${selectedTab}`}
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="netPurchases"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="purchases"
            onFilterChange={setFilters}
            category="basic"
            exportColumns={NET_PURCHASES_DEFAULT_COLUMNS}
        >
            <UnifiedTable
                headerExtra={
                    <NavigationTabs
                        value={selectedTab}
                        onChange={(e) => { setSelectedTab(e.target.value); setPagination(prev => ({ ...prev, current: 1 })); }}
                        tabs={[
                            { value: 'netPurchases', label: `صافي المشتريات (${sortedData.netPurchasesList.length})` }, 
                            { value: 'orphanReturns', label: `مرتجعات يتيمة (${sortedData.orphanReturnsList.length})` },
                            { value: 'returnPending', label: `معد للارجاع (${sortedData.netPurchasesList.filter(item => item['بيان الحالة'] === 'معد للارجاع').length})` },
                            { value: 'newItem', label: `صنف جديد (${sortedData.netPurchasesList.filter(item => item['بيان الحالة'] === 'صنف جديد').length})` },
                            { value: 'good', label: `جيد (${sortedData.netPurchasesList.filter(item => item['بيان الحالة'] === 'جيد').length})` }
                        ]}
                    />
                }
                dataSource={activeList}
                columns={visibleColumns}
                rowKey="م"
                scroll={{ x: 1800 }}
                size={density}
                pagination={{ ...pagination, total: activeList.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`كشف ${
                    selectedTab === 'netPurchases' ? 'المشتريات المعتمدة' : 
                    selectedTab === 'orphanReturns' ? 'المرتجعات اليتيمة' :
                    selectedTab === 'returnPending' ? 'الأصناف المعدة للإرجاع' :
                    selectedTab === 'newItem' ? 'الأصناف الجديدة' :
                    selectedTab === 'good' ? 'الأصناف الجيدة' :
                    'المشتريات المعتمدة'
                } (${activeList.length} سجل)`}
                summary={(pageData) => {
                    const pt = {
                        qty: pageData.reduce((sum, r) => sum + (parseFloat(r['الكمية']) || 0), 0),
                        val: pageData.reduce((sum, r) => sum + ((parseFloat(r['الكمية']) || 0) * (parseFloat(r['الافرادي']) || 0)), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}><strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(pt.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(pt.val)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={10}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}><strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(currentGT.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(currentGT.val)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7} colSpan={10}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default NetPurchasesPage;