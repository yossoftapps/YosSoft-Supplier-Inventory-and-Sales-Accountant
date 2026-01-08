import React, { useState, useCallback, memo, useMemo } from 'react';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { useTranslation } from 'react-i18next';
import { filterEndingInventoryData } from '../utils/dataFilter.js';
import { Table, Tag } from 'antd';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import NavigationTabs from '../components/NavigationTabs';
import CollapsibleSection from '../components/CollapsibleSection';

// Memoized column definitions to prevent unnecessary re-renders
const getColumnDefinitions = () => [
    { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
    { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
    { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
    { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
    {
        title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'center',
        render: (text) => formatQuantity(text)
    },
    { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120, align: 'center' },
    {
        title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'center',
        render: (text) => formatMoney(text)
    },
    {
        title: 'الاجمالي', dataIndex: 'الاجمالي', key: 'الاجمالي', width: 100, align: 'center',
        render: (text) => formatMoney(text)
    },
    { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 120, align: 'center' },
    { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 150, align: 'right' },
    { title: 'عمر الصنف', dataIndex: 'عمر الصنف', key: 'عمر الصنف', width: 80, align: 'center', render: (text) => text ? `${text} يوم` : '-' },
    {
        title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 100, align: 'center',
        render: (text) => <strong style={{ color: '#096dd9' }}>{formatQuantity(parseFloat(text) || 0)}</strong>
    },
    {
        title: 'نسبة الفائض', dataIndex: 'نسبة الفائض', key: 'نسبة الفائض', width: 80, align: 'center',
        render: (text) => {
            const val = parseInt(text) || 0;
            return <span style={{ color: val < 0 ? 'orange' : (val > 0 ? '#1890ff' : 'green') }}>{text}</span>
        }
    },
    {
        title: 'فائض المخزون', dataIndex: 'فائض المخزون', key: 'فائض المخزون', width: 100, align: 'center',
        render: (text) => {
            const val = parseFloat(text) || 0;
            return <strong style={{ color: val < 0 ? '#cf1322' : (val > 0 ? '#1890ff' : 'green') }}>{formatQuantity(val)}</strong>
        }
    },
    {
        title: 'قيمة فائض المخزون', dataIndex: 'قيمة فائض المخزون', key: 'قيمة فائض المخزون', width: 100, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 100, align: 'center',
        render: (text) => {
            const value = parseFloat(text) || 0;
            return <strong>{formatQuantity(value)}</strong>
        }
    },
    {
        title: 'قيمة معد للارجاع', dataIndex: 'قيمة معد للارجاع', key: 'قيمة معد للارجاع', width: 100, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'مخزون مثالي', dataIndex: 'مخزون مثالي', key: 'مخزون مثالي', width: 100, align: 'center',
        render: (text) => {
            const value = parseFloat(text) || 0;
            return <strong style={{ color: '#1890ff' }}>{formatQuantity(value)}</strong>
        }
    },
    {
        title: 'قيمة مخزون مثالي', dataIndex: 'قيمة مخزون مثالي', key: 'قيمة مخزون مثالي', width: 100, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'صنف جديد', dataIndex: 'صنف جديد', key: 'صنف جديد', width: 100, align: 'center',
        render: (text) => {
            const value = parseFloat(text) || 0;
            return <strong style={{ color: value > 0 ? 'blue' : 'inherit' }}>{formatQuantity(value)}</strong>
        }
    },
    {
        title: 'قيمة صنف جديد', dataIndex: 'قيمة صنف جديد', key: 'قيمة صنف جديد', width: 100, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 100, align: 'center',
        render: (text) => {
            const value = parseFloat(text) || 0;
            return <strong style={{ color: value > 0 ? '#cf1322' : 'inherit' }}>{formatQuantity(value)}</strong>
        }
    },
    {
        title: 'قيمة الاحتياج', dataIndex: 'قيمة الاحتياج', key: 'قيمة الاحتياج', width: 100, align: 'center',
        render: (text) => <span style={{ color: '#531dab' }}>{formatMoney(text)}</span>
    },
    {
        title: 'بيان الصلاحية', dataIndex: 'بيان الصلاحية', key: 'بيان الصلاحية', width: 120, align: 'right',
        render: (text) => {
            let color = 'default';
            if (text === 'منتهي') color = 'red';
            else if (text === 'قريب جدا') color = 'volcano';
            else if (text === 'قريب') color = 'orange';
            else if (text === 'بعيد') color = 'green';
            return <span style={{ color: color, fontWeight: 'bold' }}>{text}</span>;
        }
    },
    { title: 'بيان الحركة', dataIndex: 'بيان الحركة', key: 'بيان الحركة', width: 120, align: 'right' },
    {
        title: 'بيان الحالة', dataIndex: 'الحالة', key: 'الحالة', width: 120, align: 'right',
        render: (text) => (
            <span style={{
                fontWeight: text === 'معد للارجاع' ? 'bold' : 'normal',
                color: text === 'معد للارجاع' ? 'red' : ((text === 'صنف جديد') ? 'blue' : 'inherit')
            }}>
                {text}
            </span>
        )
    },
    {
        title: 'البيان', dataIndex: 'البيان', key: 'البيان', width: 120, align: 'right',
        render: (text) => (
            <span style={{
                color: text && text.includes('منتهي') ? 'red' : 'inherit'
            }}>
                {text}
            </span>
        )
    },
    { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 50, align: 'center' },
    { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 50, align: 'center' },
    { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 150, align: 'right' },
];

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

    // Apply Filters
    const filteredData = useMemo(() => {
        return filterEndingInventoryData(data, filters);
    }, [data, filters]);

    // Sub-tab filtering
    const subFilteredList = useMemo(() => {
        let list = filteredData.endingInventoryList;
        if (subTab !== 'all') {
            list = list.filter(item => item['الحالة'] === subTab);
        }
        return list;
    }, [filteredData, subTab]);

    // Apply Sorting
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
            const comparison = String(aValue).localeCompare(String(bValue));
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

    const allColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        { title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'center', render: val => formatQuantity(val) },
        { title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'center', render: val => formatMoney(val) },
        { title: 'الاجمالي', dataIndex: 'الاجمالي', key: 'الاجمالي', width: 110, align: 'center', render: val => <strong>{formatMoney(val)}</strong> },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 110, align: 'center' },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد', width: 150, align: 'right' },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 110, align: 'center' },
        { title: 'عمر الصنف', dataIndex: 'عمر الصنف', key: 'عمر الصنف', width: 90, align: 'center', render: val => val ? `${val} يوم` : '-' },
        {
            title: 'كمية المبيعات',
            dataIndex: 'salesQty',
            key: 'salesQty',
            width: 100,
            align: 'center',
            render: (_, record) => {
                // Calculate sales quantity based on excess percentage and quantity
                const qty = parseFloat(record['الكمية']) || 0;
                const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
                const salesQty = qty * (excessRatio / 100);
                return formatQuantity(salesQty);
            }
        },
        {
            title: 'مخزون مثالي',
            dataIndex: 'idealStock',
            key: 'idealStock',
            width: 100,
            align: 'center',
            render: (_, record) => {
                // Same as quantity sold
                const qty = parseFloat(record['الكمية']) || 0;
                const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
                const idealStock = qty * (excessRatio / 100);
                return formatQuantity(idealStock);
            }
        },
        {
            title: 'فائض المخزون',
            dataIndex: 'excessInventory',
            key: 'excessInventory',
            width: 110,
            align: 'center',
            render: (_, record) => {
                // Calculate excess inventory as quantity * excess ratio
                const qty = parseFloat(record['الكمية']) || 0;
                const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
                const excessInventory = qty * (excessRatio / 100);
                return formatQuantity(excessInventory);
            }
        },
        {
            title: 'قيمة فائض المخزون',
            dataIndex: 'valueExcessInventory',
            key: 'valueExcessInventory',
            width: 120,
            align: 'center',
            render: (_, record) => {
                // Calculate as excess inventory quantity * unit price
                const qty = parseFloat(record['الكمية']) || 0;
                const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
                const unitPrice = parseFloat(record['الافرادي']) || 0;
                const excessInventory = qty * (excessRatio / 100);
                return formatMoney(excessInventory * unitPrice);
            }
        },
        { title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 110, align: 'center', render: val => formatQuantity(val) },
        {
            title: 'قيمة معد للارجاع',
            dataIndex: 'valueReturns',
            key: 'valueReturns',
            width: 120,
            align: 'center',
            render: (_, record) => {
                const returns = parseFloat(record['معد للارجاع']) || 0;
                const unitPrice = parseFloat(record['الافرادي']) || 0;
                return formatMoney(returns * unitPrice);
            }
        },
        {
            title: 'صنف جديد',
            dataIndex: 'isNewItem',
            key: 'isNewItem',
            width: 100,
            align: 'center',
            render: (_, record) => {
                // Display quantity if item age <= 90 days
                const itemAge = parseFloat(record['عمر الصنف']) || 0;
                const qty = parseFloat(record['الكمية']) || 0;
                if (itemAge <= 90) {
                    return formatQuantity(qty);
                }
                return '-';
            }
        },
        { title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 100, align: 'center', render: val => <span style={{ color: val > 0 ? '#ff4d4f' : 'inherit' }}>{formatQuantity(val)}</span> },
        {
            title: 'قيمة الاحتياج',
            dataIndex: 'valueNeed',
            key: 'valueNeed',
            width: 120,
            align: 'center',
            render: (_, record) => {
                const need = parseFloat(record['الاحتياج']) || 0;
                const unitPrice = parseFloat(record['الافرادي']) || 0;
                return formatMoney(need * unitPrice);
            }
        },
        { title: 'نسبة الفائض', dataIndex: 'نسبة الفائض', key: 'نسبة الفائض', width: 90, align: 'center', render: val => <span style={{ color: val > 0 ? '#ff4d4f' : '#52c41a' }}>{val}%</span> },
        {
            title: 'بيان الصلاحية',
            dataIndex: 'بيان الصلاحية',
            key: 'بيان الصلاحية',
            width: 120,
            align: 'right',
            render: (text) => {
                let color = 'default';
                if (text === 'منتهي') color = 'red';
                else if (text === 'قريب جدا') color = 'volcano';
                else if (text === 'قريب') color = 'orange';
                else if (text === 'بعيد') color = 'green';
                return <span style={{ color: color, fontWeight: 'bold' }}>{text}</span>;
            }
        },
        {
            title: 'بيان الحركة',
            dataIndex: 'بيان الحركة',
            key: 'بيان الحركة',
            width: 120,
            align: 'right'
        },
        {
            title: 'بيان الحالة',
            dataIndex: 'الحالة',
            key: 'الحالة',
            width: 120,
            align: 'right',
            render: (text) => (
                <span style={{
                    fontWeight: text === 'معد للارجاع' ? 'bold' : 'normal',
                    color: text === 'معد للارجاع' ? 'red' : ((text === 'صنف جديد') ? 'blue' : 'inherit')
                }}>
                    {text}
                </span>
            )
        },
        {
            title: 'البيان',
            dataIndex: 'البيان',
            key: 'البيان',
            width: 120,
            align: 'right',
            render: (text) => (
                <span style={{
                    color: text && text.includes('منتهي') ? 'red' : 'inherit'
                }}>
                    {text}
                </span>
            )
        },
        {
            title: 'قيمة مخزون مثالي',
            dataIndex: 'قيمة مخزون مثالي',
            key: 'قيمة مخزون مثالي',
            width: 120,
            align: 'center',
            render: (_, record) => {
                // Calculate as ideal stock quantity * unit price
                const itemAge = parseFloat(record['عمر الصنف']) || 0;
                const qty = parseFloat(record['الكمية']) || 0;
                const unitPrice = parseFloat(record['الافرادي']) || 0;
                
                if (itemAge <= 90) {
                    // For new items, use quantity as ideal stock
                    return formatMoney(qty * unitPrice);
                } else {
                    // Calculate based on excess ratio
                    const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
                    const idealStock = qty * (excessRatio / 100);
                    return formatMoney(idealStock * unitPrice);
                }
            }
        },
        {
            title: 'قيمة فائض المخزون',
            dataIndex: 'valueExcessInventory',
            key: 'valueExcessInventory',
            width: 120,
            align: 'center',
            render: (_, record) => {
                // Calculate as excess inventory quantity * unit price
                const qty = parseFloat(record['الكمية']) || 0;
                const excessRatio = parseFloat(record['نسبة الفائض']) || 0;
                const unitPrice = parseFloat(record['الافرادي']) || 0;
                const excessInventory = qty * (excessRatio / 100);
                return formatMoney(excessInventory * unitPrice);
            }
        },
        {
            title: 'قيمة معد للارجاع',
            dataIndex: 'valueReturns',
            key: 'valueReturns',
            width: 120,
            align: 'center',
            render: (_, record) => {
                const returns = parseFloat(record['معد للارجاع']) || 0;
                const unitPrice = parseFloat(record['الافرادي']) || 0;
                return formatMoney(returns * unitPrice);
            }
        },
        {
            title: 'قيمة صنف جديد',
            dataIndex: 'valueNewItem',
            key: 'valueNewItem',
            width: 120,
            align: 'center',
            render: (_, record) => {
                const itemAge = parseFloat(record['عمر الصنف']) || 0;
                const qty = parseFloat(record['الكمية']) || 0;
                const unitPrice = parseFloat(record['الافرادي']) || 0;
                if (itemAge <= 90) {
                    return formatMoney(qty * unitPrice);
                }
                return formatMoney(0);
            }
        },
        {
            title: 'قيمة الاحتياج',
            dataIndex: 'valueNeed',
            key: 'valueNeed',
            width: 120,
            align: 'center',
            render: (_, record) => {
                const need = parseFloat(record['الاحتياج']) || 0;
                const unitPrice = parseFloat(record['الافرادي']) || 0;
                return formatMoney(need * unitPrice);
            }
        },
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 50, align: 'center' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 50, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 150, align: 'right' }
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
            title={`المخزون النهائي (${sortedData.length} سجل)`}
            description="التقرير الشامل للمخزون المتبقي والمطابق مع الجرد، يوضح الفوائض، النواقص، البضاعة الراكدة والمعدة للإرجاع."
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