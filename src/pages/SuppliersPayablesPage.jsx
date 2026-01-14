import React, { useState, useCallback, useMemo, memo } from 'react';
import { Typography, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { filterGenericData } from '../utils/dataFilter.js';
import safeString from '../utils/safeString.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import { SUPPLIER_DUE_DEFAULT_COLUMNS } from '../constants/supplierDueColumns.js';

const { Title } = Typography;

const SuppliersPayablesPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});
    const [selectedTab, setSelectedTab] = useState('all');

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
            const comparison = safeString(aValue).localeCompare(safeString(bValue));
            return sortOrder.order === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortOrder]);

    // Tab filtering based on statement
    const tabData = useMemo(() => {
        const statuses = [...new Set(filteredData.map(item => {
            const dueAmount = parseFloat(item['المبلغ المستحق']) || 0;
            const balance = parseFloat(item['الرصيد']) || 0;
            const idealStock = parseFloat(item['مخزون مثالي']) || 0;
            const maxLimit = dueAmount + idealStock;

            if (dueAmount === 0 || balance >= 0) {
                return 'لا يوجد استحقاق';
            } else if (dueAmount === 0 && maxLimit > 0) {
                return 'حد اعلى';
            } else if (dueAmount > 0) {
                return 'استحقاق';
            } else {
                return 'غير محدد';
            }
        }).filter(Boolean))];
        
        const tabs = { all: filteredData };
        statuses.forEach(s => {
            tabs[s] = filteredData.filter(item => {
                const dueAmount = parseFloat(item['المبلغ المستحق']) || 0;
                const balance = parseFloat(item['الرصيد']) || 0;
                const idealStock = parseFloat(item['مخزون مثالي']) || 0;
                const maxLimit = dueAmount + idealStock;

                let status;
                if (dueAmount === 0 || balance >= 0) {
                    status = 'لا يوجد استحقاق';
                } else if (dueAmount === 0 && maxLimit > 0) {
                    status = 'حد اعلى';
                } else if (dueAmount > 0) {
                    status = 'استحقاق';
                } else {
                    status = 'غير محدد';
                }
                
                return status === s;
            });
        });
        return tabs;
    }, [filteredData]);

    const activeList = tabData[selectedTab] || [];

    const grandTotals = useMemo(() => {
        const calc = (list) => ({
            debit: list.reduce((sum, item) => sum + (parseFloat(item['مدين']) || 0), 0),
            credit: list.reduce((sum, item) => sum + (parseFloat(item['دائن']) || 0), 0),
            balance: list.reduce((sum, item) => sum + (parseFloat(item['الرصيد']) || 0), 0),
            subAccount: list.reduce((sum, item) => sum + (parseFloat(item['الحساب المساعد']) || 0), 0),
            inv: list.reduce((sum, item) => sum + (parseFloat(item['قيمة المخزون']) || 0), 0),
            accrual: list.reduce((sum, item) => sum + (parseFloat(item['الاستحقاق']) || 0), 0),
            due: list.reduce((sum, item) => sum + (parseFloat(item['المبلغ المستحق']) || 0), 0),
            idealStock: list.reduce((sum, item) => sum + (parseFloat(item['مخزون مثالي']) || 0), 0),
            maxLimit: list.reduce((sum, item) => {
                const dueAmount = parseFloat(item['المبلغ المستحق']) || 0;
                const idealStock = parseFloat(item['مخزون مثالي']) || 0;
                return sum + (dueAmount + idealStock);
            }, 0),
            excess: list.reduce((sum, item) => sum + (parseFloat(item['فائض المخزون']) || 0), 0),
            returns: list.reduce((sum, item) => sum + (parseFloat(item['معد للارجاع']) || 0), 0),
            newItems: list.reduce((sum, item) => sum + (parseFloat(item['اصناف جديدة']) || 0), 0),
            need: list.reduce((sum, item) => sum + (parseFloat(item['الاحتياج']) || 0), 0),
            expired: list.reduce((sum, item) => sum + (parseFloat(item['منتهي']) || 0), 0),
            stagnant: list.reduce((sum, item) => sum + (parseFloat(item['راكد تماما']) || 0), 0),
            near: list.reduce((sum, item) => sum + (parseFloat(item['قريب جدا']) || 0), 0),
            surplus: list.reduce((sum, item) => sum + (parseFloat(item['مخزون زائد']) || 0), 0)
        });
        
        return {
            all: calc(filteredData),
            'لا يوجد استحقاق': calc(tabData['لا يوجد استحقاق'] || []),
            'حد اعلى': calc(tabData['حد اعلى'] || []),
            'استحقاق': calc(tabData['استحقاق'] || []),
            'غير محدد': calc(tabData['غير محدد'] || [])
        };
    }, [filteredData, tabData]);

    const currentGT = useMemo(() => {
        return grandTotals[selectedTab] || grandTotals.all;
    }, [grandTotals, selectedTab]);

    const tabsArray = useMemo(() => {
        return [
            { value: 'all', label: `الكل (${tabData.all?.length || 0})` },
            { value: 'لا يوجد استحقاق', label: `لا يوجد استحقاق (${tabData['لا يوجد استحقاق']?.length || 0})` },
            { value: 'حد اعلى', label: `حد اعلى (${tabData['حد اعلى']?.length || 0})` },
            { value: 'استحقاق', label: `استحقاق (${tabData['استحقاق']?.length || 0})` }
        ];
    }, [tabData]);

    const allColumns = SUPPLIER_DUE_DEFAULT_COLUMNS;

    const visibleColumns = useMemo(() =>
        allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false),
        [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    return (
        <UnifiedPageLayout
            title={`أرصدة واستحقاقات الموردين (${activeList.length} مورد)`}
            description="عرض تحليل للأرصدة الدفترية للموردين مقارنة بقيمة بضاعتهم المتوفرة فعلياً في مخازنك."
            interpretation="يربط هذا التقرير بين الديون (الأرصدة) والواقع (المخزون). 'الاستحقاق' هو الفرق الصافي. إذا كان المخزون المتبقي يغطي الدين، فإن 'المبلغ المستحق' للسداد يقل. هذا يمنع دفع مبالغ لموردين لديهم بضاعة راكدة أو غير مباعة تتجاوز قيمتها ديونهم."
            data={activeList}
            columns={visibleColumns}
            exportColumns={SUPPLIER_DUE_DEFAULT_COLUMNS}
            filename="suppliers_payables"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="suppliersPayables"
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
        >
            <UnifiedTable
                headerExtra={
                    <NavigationTabs
                        value={selectedTab}
                        onChange={(e) => {
                            setSelectedTab(e.target.value);
                            setPagination(prev => ({ ...prev, current: 1 }));
                        }}
                        tabs={tabsArray}
                    />
                }
                dataSource={activeList}
                columns={visibleColumns}
                rowKey="م"
                scroll={{ x: 2000 }}
                size={density}
                pagination={{ ...pagination, total: activeList.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`استحقاقات الموردين (${activeList.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        debit: pageData.reduce((sum, item) => sum + (parseFloat(item['مدين']) || 0), 0),
                        credit: pageData.reduce((sum, item) => sum + (parseFloat(item['دائن']) || 0), 0),
                        balance: pageData.reduce((sum, item) => sum + (parseFloat(item['الرصيد']) || 0), 0),
                        subAccount: pageData.reduce((sum, item) => sum + (parseFloat(item['الحساب المساعد']) || 0), 0),
                        inv: pageData.reduce((sum, item) => sum + (parseFloat(item['قيمة المخزون']) || 0), 0),
                        accrual: pageData.reduce((sum, item) => sum + (parseFloat(item['الاستحقاق']) || 0), 0),
                        due: pageData.reduce((sum, item) => sum + (parseFloat(item['المبلغ المستحق']) || 0), 0),
                        idealStock: pageData.reduce((sum, item) => sum + (parseFloat(item['مخزون مثالي']) || 0), 0),
                        maxLimit: pageData.reduce((sum, item) => {
                            const dueAmount = parseFloat(item['المبلغ المستحق']) || 0;
                            const idealStock = parseFloat(item['مخزون مثالي']) || 0;
                            return sum + (dueAmount + idealStock);
                        }, 0),
                        excess: pageData.reduce((sum, item) => sum + (parseFloat(item['فائض المخزون']) || 0), 0),
                        returns: pageData.reduce((sum, item) => sum + (parseFloat(item['معد للارجاع']) || 0), 0),
                        newItems: pageData.reduce((sum, item) => sum + (parseFloat(item['اصناف جديدة']) || 0), 0),
                        need: pageData.reduce((sum, item) => sum + (parseFloat(item['الاحتياج']) || 0), 0),
                        expired: pageData.reduce((sum, item) => sum + (parseFloat(item['منتهي']) || 0), 0),
                        stagnant: pageData.reduce((sum, item) => sum + (parseFloat(item['راكد تماما']) || 0), 0),
                        near: pageData.reduce((sum, item) => sum + (parseFloat(item['قريب جدا']) || 0), 0),
                        surplus: pageData.reduce((sum, item) => sum + (parseFloat(item['مخزون زائد']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}><strong className="unified-table-summary">{formatMoney(pageTotals.debit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatMoney(pageTotals.credit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatMoney(pageTotals.balance)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(pageTotals.subAccount)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7}><strong className="unified-table-summary">{formatMoney(pageTotals.inv)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={8}><strong className="unified-table-summary">{formatMoney(pageTotals.accrual)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={9}><strong className="unified-table-summary">{formatMoney(pageTotals.due)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={10}><strong className="unified-table-summary">{formatMoney(pageTotals.idealStock)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={11}><strong className="unified-table-summary">{formatMoney(pageTotals.maxLimit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={12} colSpan={10}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}><strong className="unified-table-summary">{formatMoney(currentGT.debit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatMoney(currentGT.credit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><strong className="unified-table-summary">{formatMoney(currentGT.balance)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={6}><strong className="unified-table-summary">{formatMoney(currentGT.subAccount)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={7}><strong className="unified-table-summary">{formatMoney(currentGT.inv)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={8}><strong className="unified-table-summary">{formatMoney(currentGT.accrual)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={9}><strong className="unified-table-summary">{formatMoney(currentGT.due)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={10}><strong className="unified-table-summary">{formatMoney(currentGT.idealStock)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={11}><strong className="unified-table-summary">{formatMoney(currentGT.maxLimit)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={12} colSpan={10}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default SuppliersPayablesPage;