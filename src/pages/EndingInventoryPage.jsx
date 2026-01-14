import React, { useState, useCallback, memo, useMemo } from 'react';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { useTranslation } from 'react-i18next';
import { filterEndingInventoryData } from '../utils/dataFilter.js';
import safeString from '../utils/safeString.js';
import { Table, Tag } from 'antd';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import CollapsibleSection from '../components/CollapsibleSection';
import { ENDING_INVENTORY_DEFAULT_COLUMNS } from '../constants/endingInventoryColumns.js';



const EndingInventoryPage = memo(({ data, allReportsData, availableReports }) => {
    const { t } = useTranslation();
    const [subTab, setSubTab] = useState('all');
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sortOrder, setSortOrder] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 50 });
    const [density, setDensity] = useState('small');
    const [filters, setFilters] = useState({});

    if (!data || !data.endingInventoryList) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message={t('noData')} description={t('importExcelFirst')} />
            </div>
        );
    }

    // تطبيق الفلاتر على بيانات التقرير
    const filteredData = useMemo(() => {
        return filterEndingInventoryData(data, filters);
    }, [data, filters]);

    // فلترة القائمة بحسب التبويب الفرعي (بيان الحالة)
    const subFilteredList = useMemo(() => {
        let list = filteredData.endingInventoryList;
        if (subTab !== 'all') {
            list = list.filter(item => item['بيان الحالة'] === subTab);
        }
        return list;
    }, [filteredData, subTab]);

    // تطبيق الفرز (إن وُجد ترتيب فرز محدد)
    const sortedData = useMemo(() => {
        if (!sortOrder.field || !sortOrder.order) return subFilteredList;

        return [...subFilteredList].sort((a, b) => {
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
    }, [subFilteredList, sortOrder]);

    const grandTotals = useMemo(() => {
        return {
            qty: subFilteredList.reduce((sum, item) => sum + (parseFloat(item['الكمية']) || 0), 0),
            val: subFilteredList.reduce((sum, item) => sum + (parseFloat(item['الاجمالي']) || 0), 0),
            excessVal: subFilteredList.reduce((sum, item) => sum + (parseFloat(item['قيمة فائض المخزون']) || 0), 0),
            returnVal: subFilteredList.reduce((sum, item) => sum + (parseFloat(item['قيمة معد للارجاع']) || 0), 0),
            salesQty: subFilteredList.reduce((sum, item) => {
                const qty = parseFloat(item['الكمية']) || 0;
                const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                return sum + (qty * (excessRatio / 100));
            }, 0),
            idealStock: subFilteredList.reduce((sum, item) => {
                const qty = parseFloat(item['الكمية']) || 0;
                const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                return sum + (qty * (excessRatio / 100));
            }, 0),
            excessInventory: subFilteredList.reduce((sum, item) => {
                const qty = parseFloat(item['الكمية']) || 0;
                const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                return sum + (qty * (excessRatio / 100));
            }, 0),
            isNewItem: subFilteredList.reduce((sum, item) => {
                const itemAge = parseFloat(item['عمر الصنف']) || 0;
                const qty = parseFloat(item['الكمية']) || 0;
                return sum + (itemAge <= 90 ? qty : 0);
            }, 0),
            need: subFilteredList.reduce((sum, item) => sum + (parseFloat(item['الاحتياج']) || 0), 0),
            valueIdealStock: subFilteredList.reduce((sum, item) => {
                const itemAge = parseFloat(item['عمر الصنف']) || 0;
                const qty = parseFloat(item['الكمية']) || 0;
                const unitPrice = parseFloat(item['الافرادي']) || 0;
                
                if (itemAge <= 90) {
                    return sum + (qty * unitPrice);
                } else {
                    const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                    const idealStock = qty * (excessRatio / 100);
                    return sum + (idealStock * unitPrice);
                }
            }, 0),
            valueExcessInventory: subFilteredList.reduce((sum, item) => {
                const qty = parseFloat(item['الكمية']) || 0;
                const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                const unitPrice = parseFloat(item['الافرادي']) || 0;
                const excessInventory = qty * (excessRatio / 100);
                return sum + (excessInventory * unitPrice);
            }, 0),
            valueReturns: subFilteredList.reduce((sum, item) => {
                const returns = parseFloat(item['معد للارجاع']) || 0;
                const unitPrice = parseFloat(item['الافرادي']) || 0;
                return sum + (returns * unitPrice);
            }, 0),
            valueNewItem: subFilteredList.reduce((sum, item) => {
                const itemAge = parseFloat(item['عمر الصنف']) || 0;
                const qty = parseFloat(item['الكمية']) || 0;
                const unitPrice = parseFloat(item['الافرادي']) || 0;
                return sum + (itemAge <= 90 ? qty * unitPrice : 0);
            }, 0),
            valueNeed: subFilteredList.reduce((sum, item) => {
                const need = parseFloat(item['الاحتياج']) || 0;
                const unitPrice = parseFloat(item['الافرادي']) || 0;
                return sum + (need * unitPrice);
            }, 0)
        };
    }, [subFilteredList]);

    // دمج الأعمدة الافتراضية مع أي أعمدة محسوبة إضافية، ثم إزالة أي تكرارات اعتمادًا على dataIndex أو key
    const allColumns = (() => {
        const raw = [...ENDING_INVENTORY_DEFAULT_COLUMNS];
        const seen = new Set();
        const unique = [];
        for (const col of raw) {
            const id = col.dataIndex || col.key;
            if (seen.has(id)) continue;
            seen.add(id);
            unique.push(col);
        }
        return unique;
    })();

    // احسب تعداد الحالات لتهيئة تبويبات التنقل (معد للارجاع، صنف جديد، جيد)
    const statusCounts = useMemo(() => {
        const list = (filteredData && filteredData.endingInventoryList) || [];
        const counts = list.reduce((acc, item) => {
            const s = item['بيان الحالة'] || 'غير محدد';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});
        return { total: list.length, counts };
    }, [filteredData]);

    // مصفوفة التبويبات المعروضة في رأس الجدول
    const tabsArray = useMemo(() => {
        return [
            { value: 'all', label: `الكل (${statusCounts.total})` },
            { value: 'معد للارجاع', label: `معد للارجاع (${statusCounts.counts['معد للارجاع'] || 0})` },
            { value: 'صنف جديد', label: `صنف جديد (${statusCounts.counts['صنف جديد'] || 0})` },
            { value: 'جيد', label: `جيد (${statusCounts.counts['جيد'] || 0})` },
            { value: 'راكد', label: `راكد (${statusCounts.counts['راكد'] || 0})` },
            { value: 'منتهي', label: `منتهي (${statusCounts.counts['منتهي'] || 0})` },
            { value: 'قريب جدا', label: `قريب جدا (${statusCounts.counts['قريب جدا'] || 0})` },
            { value: 'مخزون زائد', label: `مخزون زائد (${statusCounts.counts['مخزون زائد'] || 0})` }
        ];
    }, [statusCounts]);

    const visibleColumns = useMemo(() =>
        allColumns.filter(col => columnVisibility[col.dataIndex || col.key] !== false),
        [columnVisibility]);

    const handleColumnVisibilityChange = useCallback((newVisibility) => setColumnVisibility(newVisibility), []);
    const handleSortOrderChange = useCallback((newSortOrder) => setSortOrder(newSortOrder), []);
    const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);
    const handleDensityChange = useCallback((newDensity) => setDensity(newDensity), []);

    return (
        <UnifiedPageLayout
            title={`المخزون النهائي (${sortedData.length} سجل)`}
            description="التقرير الشامل للمخزون المتبقي والمطابق مع الجرد، يوضح الفوائض، النواقص، البضاعة الراكدة والمعدة للارجاع."
            interpretation="يعد هذا التقرير 'ذاكرة المخزن'. فهو يربط كافة عمليات الشراء السابقة والبيع والجرد الفعلي ليخبرك بدقة: ماذا تبقى؟ وما هو وضع هذا المتبقي؟ هل هو عبء (فائض/راكد) أم هو فرصة (مخزون مثالي)؟ كما يساعد في كشف الأصناف التي أرجعت ولم يكن لها سجل شراء سابق (المرتجعات اليتيمة)."
            data={sortedData}
            columns={visibleColumns}
            filename="ending_inventory"
            allReportsData={allReportsData}
            availableReports={availableReports}
            reportKey="endingInventory"
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onSortOrderChange={handleSortOrderChange}
            onPaginationChange={handlePaginationChange}
            pagination={pagination}
            onDensityChange={handleDensityChange}
            density={density}
            filterData={data}
            filterDataType="endingInventory"
            onFilterChange={setFilters}
            category="inventory"
            exportColumns={allColumns}
        >
            <UnifiedTable
                headerExtra={
                    <NavigationTabs
                        value={subTab}
                        onChange={(e) => {
                            setSubTab(e.target.value);
                            setPagination(prev => ({ ...prev, current: 1 }));
                        }}
                        tabs={tabsArray}
                    />
                }
                dataSource={sortedData}
                columns={visibleColumns}
                rowKey="م"
                scroll={{ x: 3500 }}
                size={density}
                pagination={{ ...pagination, total: subFilteredList.length, showSizeChanger: true }}
                onPaginationChange={handlePaginationChange}
                virtualized={false}
                title={`تحليل المخزون النهائي (${subFilteredList.length} سجل)`}
                summary={(pageData) => {
                    const pageTotals = {
                        qty: pageData.reduce((sum, item) => sum + (parseFloat(item['الكمية']) || 0), 0),
                        val: pageData.reduce((sum, item) => sum + (parseFloat(item['الاجمالي']) || 0), 0),
                        salesQty: pageData.reduce((sum, item) => {
                            const qty = parseFloat(item['الكمية']) || 0;
                            const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                            return sum + (qty * (excessRatio / 100));
                        }, 0),
                        idealStock: pageData.reduce((sum, item) => {
                            const qty = parseFloat(item['الكمية']) || 0;
                            const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                            return sum + (qty * (excessRatio / 100));
                        }, 0),
                        excessInventory: pageData.reduce((sum, item) => {
                            const qty = parseFloat(item['الكمية']) || 0;
                            const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                            return sum + (qty * (excessRatio / 100));
                        }, 0),
                        isNewItem: pageData.reduce((sum, item) => {
                            const itemAge = parseFloat(item['عمر الصنف']) || 0;
                            const qty = parseFloat(item['الكمية']) || 0;
                            return sum + (itemAge <= 90 ? qty : 0);
                        }, 0),
                        need: pageData.reduce((sum, item) => sum + (parseFloat(item['الاحتياج']) || 0), 0),
                        valueIdealStock: pageData.reduce((sum, item) => {
                            const itemAge = parseFloat(item['عمر الصنف']) || 0;
                            const qty = parseFloat(item['الكمية']) || 0;
                            const unitPrice = parseFloat(item['الافرادي']) || 0;
                            
                            if (itemAge <= 90) {
                                return sum + (qty * unitPrice);
                            } else {
                                const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                                const idealStock = qty * (excessRatio / 100);
                                return sum + (idealStock * unitPrice);
                            }
                        }, 0),
                        valueExcessInventory: pageData.reduce((sum, item) => {
                            const qty = parseFloat(item['الكمية']) || 0;
                            const excessRatio = parseFloat(item['نسبة الفائض']) || 0;
                            const unitPrice = parseFloat(item['الافرادي']) || 0;
                            const excessInventory = qty * (excessRatio / 100);
                            return sum + (excessInventory * unitPrice);
                        }, 0),
                        valueReturns: pageData.reduce((sum, item) => {
                            const returns = parseFloat(item['معد للارجاع']) || 0;
                            const unitPrice = parseFloat(item['الافرادي']) || 0;
                            return sum + (returns * unitPrice);
                        }, 0),
                        valueNewItem: pageData.reduce((sum, item) => {
                            const itemAge = parseFloat(item['عمر الصنف']) || 0;
                            const qty = parseFloat(item['الكمية']) || 0;
                            const unitPrice = parseFloat(item['الافرادي']) || 0;
                            return sum + (itemAge <= 90 ? qty * unitPrice : 0);
                        }, 0),
                        valueNeed: pageData.reduce((sum, item) => {
                            const need = parseFloat(item['الاحتياج']) || 0;
                            const unitPrice = parseFloat(item['الافرادي']) || 0;
                            return sum + (need * unitPrice);
                        }, 0)
                    };
                    return (
                        <>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">إجمالي أرقام هذه الصفحة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(pageTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={2}></Table.Summary.Cell>
                                <Table.Summary.Cell index={7}><strong className="unified-table-summary">{formatMoney(pageTotals.val)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={8} colSpan={35}></Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong className="unified-table-summary">الإجمالي الكلي للقائمة المختارة</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(grandTotals.qty)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={5} colSpan={2}></Table.Summary.Cell>
                                <Table.Summary.Cell index={7}><strong className="unified-table-summary">{formatMoney(grandTotals.val)}</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={8} colSpan={35}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
});

export default EndingInventoryPage;