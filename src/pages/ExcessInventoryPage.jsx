import React, { useMemo, useState } from 'react';
import { Tag, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { filterGenericData } from '../utils/dataFilter.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';

function ExcessInventoryPage({ data, allReportsData }) {
    const [filters, setFilters] = useState({});

    // Apply filters
    const filteredData = useMemo(() => {
        return filterGenericData(data, filters);
    }, [data, filters]);

    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message="لا توجد بيانات للعرض" description="يرجى استيراد البيانات ومعالجتها أولاً" />
            </div>
        );
    }

    // دالة لتحديد لون "بيان الفائض" لتسهيل القراءة
    const getTagColor = (status) => {
        switch (status) {
            case 'راكد تماما': return 'red';
            case 'احتياج': return 'orange';
            case 'مخزون زائد': return 'blue';
            case 'مناسب': return 'green';
            default: return 'default';
        }
    };

    // تعريف اعمدة الجدول بناءً على مخرجات المنطق
    const columns = [
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => formatQuantity(text)
        },
        {
            title: 'كمية المشتريات', dataIndex: 'كمية المشتريات', key: 'كمية المشتريات', width: 100, align: 'left',
            render: (text) => formatQuantity(text)
        },
        {
            title: 'كمية المبيعات', dataIndex: 'كمية المبيعات', key: 'كمية المبيعات', width: 100, align: 'left',
            render: (text) => formatQuantity(text)
        },
        {
            title: 'نسبة المبيعات', dataIndex: 'نسبة المبيعات', key: 'نسبة المبيعات', width: 90, align: 'center',
            render: (text) => text // Already formatted as string with %
        },
        {
            title: 'المبيعات (90 يوم)', dataIndex: 'المبيعات', key: 'المبيعات', width: 120, align: 'left',
            render: (text) => formatQuantity(text)
        },
        {
            title: 'فائض المخزون', dataIndex: 'فائض المخزون', key: 'فائض المخزون', width: 120, align: 'left',
            render: (text) => {
                const value = parseFloat(text) || 0;
                return <strong style={{ color: value < 0 ? '#cf1322' : (value > 0 ? '#1890ff' : '#52c41a') }}>{formatQuantity(value)}</strong>
            }
        },
        {
            title: 'نسبة الفائض', dataIndex: 'نسبة الفائض', key: 'نسبة الفائض', width: 100, align: 'center',
            render: (text) => {
                const val = parseInt(text) || 0;
                return <span style={{ color: val < 0 ? 'orange' : (val > 0 ? '#1890ff' : 'green') }}>{text}</span>
            }
        },
        {
            title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 110, align: 'left',
            render: (text) => {
                const value = parseFloat(text) || 0;
                return <strong>{formatQuantity(value)}</strong>
            }
        },
        {
            title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 110, align: 'left',
            render: (text) => {
                const value = parseFloat(text) || 0;
                return <strong style={{ color: value > 0 ? '#cf1322' : 'inherit' }}>{formatQuantity(value)}</strong>
            }
        },
        {
            title: 'بيان الفائض', dataIndex: 'بيان الفائض', key: 'بيان الفائض', width: 120, align: 'center',
            render: (text) => <Tag color={getTagColor(text)}>{text}</Tag>
        },
    ];

    // Calculate totals for summary (based on FILTERED data)
    const totalQuantity = filteredData.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0);
    const totalPurchaseQuantity = filteredData.reduce((sum, record) => sum + parseFloat(record['كمية المشتريات'] || 0), 0);
    const totalSalesQuantity = filteredData.reduce((sum, record) => sum + parseFloat(record['كمية المبيعات'] || 0), 0);
    const totalSales = filteredData.reduce((sum, record) => sum + parseFloat(record['المبيعات'] || 0), 0);
    const totalExcess = filteredData.reduce((sum, record) => sum + parseFloat(record['فائض المخزون'] || 0), 0);
    const totalReturns = filteredData.reduce((sum, record) => sum + parseFloat(record['معد للارجاع'] || 0), 0);
    const totalNeed = filteredData.reduce((sum, record) => sum + parseFloat(record['الاحتياج'] || 0), 0);

    return (
        <UnifiedPageLayout
            title="تقرير فائض المخزون"
            description="حساب الفارق بين إجمالي الكميات في المخزون والمبيعات خلال آخر 90 يومًا."
            data={filteredData}
            columns={columns}
            filename="excess-inventory"
            allReportsData={allReportsData}
            filterData={data}
            filterDataType="default"
            onFilterChange={setFilters}
        >
            <UnifiedTable
                dataSource={filteredData}
                columns={columns}
                rowKey="رمز المادة"
                title={`تحليل فائض المخزون (${filteredData.length} صنف)`}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                            <strong className="unified-table-summary">الإجمالي الكلي</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                            <strong className="unified-table-summary">{formatQuantity(totalQuantity)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                            <strong className="unified-table-summary">{formatQuantity(totalPurchaseQuantity)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                            <strong className="unified-table-summary">{formatQuantity(totalSalesQuantity)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6}></Table.Summary.Cell>
                        <Table.Summary.Cell index={7}>
                            <strong className="unified-table-summary">{formatQuantity(totalSales)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8}>
                            <strong className="unified-table-summary">{formatQuantity(totalExcess)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={9}></Table.Summary.Cell>
                        <Table.Summary.Cell index={10}>
                            <strong className="unified-table-summary">{formatQuantity(totalReturns)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={11}>
                            <strong className="unified-table-summary">{formatQuantity(totalNeed)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={12}></Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </UnifiedPageLayout>
    );
}

export default ExcessInventoryPage;