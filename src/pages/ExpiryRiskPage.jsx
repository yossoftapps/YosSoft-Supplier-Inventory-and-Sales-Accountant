import React, { useState, useMemo, useCallback, memo } from 'react';
import { Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatMoney, formatQuantity } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import safeString from '../utils/safeString.js';
import { EXPIRY_RISK_DEFAULT_COLUMNS } from '../constants/expiryRiskColumns.js';



const ExpiryRiskPage = memo(({ data, allReportsData, availableReports }) => {
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
            const comparison = String(aValue).localeCompare(String(bValue));
            return sortOrder.order === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortOrder]);

    // Tab filtering based on statement
    const tabData = useMemo(() => {
        const statuses = [...new Set(filteredData.map(item => {
            const riskPercent = parseFloat(item['نسبة الخطر %']) || 0;
            
            if (riskPercent > 80) return 'خطير جدا';
            if (riskPercent > 60) return 'خطير';
            if (riskPercent > 40) return 'متوسط';
            if (riskPercent > 20) return 'قليل';
            return 'قليل جدا';
        }).filter(Boolean))];
        
        const tabs = { all: filteredData };
        statuses.forEach(s => {
            tabs[s] = filteredData.filter(item => {
                const riskPercent = parseFloat(item['نسبة الخطر %']) || 0;
                
                let status;
                if (riskPercent > 80) status = 'خطير جدا';
                else if (riskPercent > 60) status = 'خطير';
                else if (riskPercent > 40) status = 'متوسط';
                else if (riskPercent > 20) status = 'قليل';
                else status = 'قليل جدا';
                
                return status === s;
            });
        });
        return tabs;
    }, [filteredData]);

    const activeList = tabData[selectedTab] || [];

    const grandTotals = useMemo(() => {
        const calculateSum = (list) => ({
            qty: list.reduce((sum, item) => sum + (parseFloat(item['الكمية الحالية']) || 0), 0),
            expSales: list.reduce((sum, item) => sum + (parseFloat(item['الكمية المتوقعة للبيع']) || 0), 0),
            risk: list.reduce((sum, item) => sum + (parseFloat(item['الخطر المتوقع']) || 0), 0)
        });
        
        return {
            all: calculateSum(filteredData),
            'خطير جدا': calculateSum(tabData['خطير جدا'] || []),
            'خطير': calculateSum(tabData['خطير'] || []),
            'متوسط': calculateSum(tabData['متوسط'] || []),
            'قليل': calculateSum(tabData['قليل'] || []),
            'قليل جدا': calculateSum(tabData['قليل جدا'] || [])
        };
    }, [filteredData, tabData]);

    const currentGT = useMemo(() => {
        return grandTotals[selectedTab] || grandTotals.all;
    }, [grandTotals, selectedTab]);

    const tabsArray = useMemo(() => {
        return [
            { value: 'all', label: `الكل (${tabData.all?.length || 0})` },
            { value: 'خطير جدا', label: `خطير جدا (${tabData['خطير جدا']?.length || 0})` },
            { value: 'خطير', label: `خطير (${tabData['خطير']?.length || 0})` },
            { value: 'متوسط', label: `متوسط (${tabData['متوسط']?.length || 0})` },
            { value: 'قليل', label: `قليل (${tabData['قليل']?.length || 0})` },
            { value: 'قليل جدا', label: `قليل جدا (${tabData['قليل جدا']?.length || 0})` }
        ];
    }, [tabData]);

    const getRiskColor = (riskPercent) => {
        if (riskPercent > 50) return 'red';
        if (riskPercent > 30) return 'orange';
        if (riskPercent > 10) return 'yellow';
        return 'green';
    };

    // Use canonical column definitions and attach UI renderers where needed
    const allColumns = EXPIRY_RISK_DEFAULT_COLUMNS.map(col => {
        if (col.dataIndex === 'الكمية الحالية') return { ...col, render: v => formatQuantity(v) };
        if (col.dataIndex === 'الأيام المتبقية') return { ...col, render: val => {
            let color = 'green';
            const v = parseInt(val) || 0;
            if (v <= 7) color = 'red';
            else if (v <= 30) color = 'orange';
            else if (v <= 90) color = 'yellow';
            return <Tag color={color}>{val}</Tag>;
        } };
        if (col.dataIndex === 'معدل البيع اليومي') return { ...col, render: val => formatQuantity(Math.floor(parseFloat(val) || 0)) };
        if (col.dataIndex === 'الكمية المتوقعة للبيع') return { ...col, render: val => formatQuantity(Math.floor(parseFloat(val) || 0)) };
        if (col.dataIndex === 'الخطر المتوقع') return { ...col, render: val => <strong style={{ color: Math.floor(parseFloat(val) || 0) > 0 ? '#ff4d4f' : 'inherit' }}>{formatQuantity(Math.floor(parseFloat(val) || 0))}</strong> };
        if (col.dataIndex === 'نسبة الخطر %') return { ...col, render: val => <Tag color={getRiskColor(parseFloat(val) || 0)}>{val}%</Tag> };
        if (col.dataIndex === 'statement') return { ...col, render: (_, record) => {
            const riskPercent = parseFloat(record['نسبة الخطر %']) || 0;
            if (riskPercent > 80) return 'خطير جدا';
            if (riskPercent > 60) return 'خطير';
            if (riskPercent > 40) return 'متوسط';
            if (riskPercent > 20) return 'قليل';
            return 'قليل جدا';
        } };
        return col;
    });

    const visibleColumns = useMemo(() =>
        allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false),
        [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    return (
        <UnifiedPageLayout
            title={`توقعات مخاطر انتهاء الصلاحية (${activeList.length} سجل)`}
            description="تحليل وتوقع المخاطر المرتبطة بانتهاء صلاحية المواد في المخزون"
            interpretation="يحلل هذا التقرير كميات المخزون الحالية وتاريخ انتهاء صلاحيتها مقابل معدلات استهلاكك اليومية. 'الأيام المتبقية' توضح المهلة الزمنية، بينما يوضح 'الخطر المتوقع' كمية البضاعة التي يُتوقع انتهاء صلاحيتها قبل أن يتم بيعها بناءً على وتيرة مبيعاتك الحالية."
            data={activeList}
            columns={visibleColumns}
            exportColumns={EXPIRY_RISK_DEFAULT_COLUMNS}
            filename="expiry_risk_forecast"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="expiryRisk"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="inventory"
            onFilterChange={setFilters}
            category="risk"
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
                title={`توقعات مخاطر انتهاء الصلاحية (${sortedData.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        qty: pageData.reduce((sum, item) => sum + (parseFloat(item['الكمية الحالية']) || 0), 0),
                        expSales: pageData.reduce((sum, item) => sum + (parseFloat(item['الكمية المتوقعة للبيع']) || 0), 0),
                        risk: pageData.reduce((sum, item) => sum + (parseFloat(item['الخطر المتوقع']) || 0), 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={5}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}>
                                    <strong className="unified-table-summary">{formatQuantity(pageTotals.qty)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={6} colSpan={3}></Table.Summary.Cell>
                                <Table.Summary.Cell index={9}>
                                    <strong className="unified-table-summary">{formatQuantity(pageTotals.expSales)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={10}>
                                    <strong className="unified-table-summary" style={{ color: pageTotals.risk > 0 ? '#ff4d4f' : 'inherit' }}>{formatQuantity(pageTotals.risk)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={11} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={5}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}>
                                    <strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={6} colSpan={3}></Table.Summary.Cell>
                                <Table.Summary.Cell index={9}>
                                    <strong className="unified-table-summary">{formatQuantity(grandTotals.expSales)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={10}>
                                    <strong className="unified-table-summary" style={{ color: grandTotals.risk > 0 ? '#ff4d4f' : 'inherit' }}>{formatQuantity(grandTotals.risk)}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={11} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});;

export default ExpiryRiskPage;