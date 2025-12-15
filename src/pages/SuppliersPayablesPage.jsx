import React, { useState, useCallback, useMemo } from 'react';
import { Typography, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import { filterGenericData } from '../utils/dataFilter.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';

const { Title } = Typography;

function SuppliersPayablesPage({ data, allReportsData }) {
    const [filters, setFilters] = useState({});

    // Apply filters
    const filteredData = useMemo(() => {
        return filterGenericData(data, filters);
    }, [data, filters]);

    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message="لا توجد بيانات" description="يرجى استيراد ملف Excel اولاً لمعالجة البيانات." />
            </div>
        );
    }

    // تعريف اعمدة الجدول بناءً على مخرجات منطق استحقاق الموردين
    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز الحساب', dataIndex: 'رمز الحساب', key: 'رمز الحساب', width: 100 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        {
            title: 'مدين', dataIndex: 'مدين', key: 'مدين', width: 100, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'دائن', dataIndex: 'دائن', key: 'دائن', width: 100, align: 'left',
            render: (text) => formatMoney(text)
        },
        { title: 'الحساب المساعد', dataIndex: 'الحساب المساعد', key: 'الحساب المساعد', width: 120 },
        {
            title: 'الرصيد', dataIndex: 'الرصيد', key: 'الرصيد', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'قيمة المخزون', dataIndex: 'قيمة المخزون', key: 'قيمة المخزون', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'الاستحقاق', dataIndex: 'الاستحقاق', key: 'الاستحقاق', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'المبلغ المستحق', dataIndex: 'المبلغ المستحق', key: 'المبلغ المستحق', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'فائض المخزون', dataIndex: 'فائض المخزون', key: 'فائض المخزون', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'معد للارجاع', dataIndex: 'معد للارجاع', key: 'معد للارجاع', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'مخزون مثالي', dataIndex: 'مخزون مثالي', key: 'مخزون مثالي', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'اصناف جديدة', dataIndex: 'اصناف جديدة', key: 'اصناف جديدة', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'الاحتياج', dataIndex: 'الاحتياج', key: 'الاحتياج', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'منتهي', dataIndex: 'منتهي', key: 'منتهي', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'راكد تماما', dataIndex: 'راكد تماما', key: 'راكد تماما', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'قريب جدا', dataIndex: 'قريب جدا', key: 'قريب جدا', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
        {
            title: 'مخزون زائد', dataIndex: 'مخزون زائد', key: 'مخزون زائد', width: 120, align: 'left',
            render: (text) => formatMoney(text)
        },
    ];

    return (
        <UnifiedPageLayout
            title="تقرير استحقاق الموردين"
            description="عرض ارصدة الموردين مضافًا إليها قيمة المخزون الحالي، مع تفصيل قيمة المخزون حسب حالته."
            data={filteredData}
            columns={columns}
            filename="suppliers-payables"
            allReportsData={allReportsData}
            filterData={data}
            filterDataType="suppliers"
            onFilterChange={setFilters}
        >
            <UnifiedTable
                title={`ملخص استحقاق الموردين (${filteredData.length} مورد)`}
                dataSource={filteredData}
                columns={columns}
                rowKey="رمز الحساب"
                scroll={{ x: 2200 }}
                pagination={{ position: ['topRight', 'bottomRight'], pageSize: 50, showSizeChanger: true, pageSizeOptions: ['25', '50', '100', '200'] }}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                            <strong className="unified-table-summary">الإجمالي الكلي</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['مدين'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['دائن'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}></Table.Summary.Cell>
                        <Table.Summary.Cell index={6}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['الرصيد'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['قيمة المخزون'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['الاستحقاق'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={9}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['المبلغ المستحق'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={10}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['فائض المخزون'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={11}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['معد للارجاع'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={12}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['مخزون مثالي'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={13}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['اصناف جديدة'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={14}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['الاحتياج'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={15}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['منتهي'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={16}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['راكد تماما'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={17}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['قريب جدا'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={18}>
                            <strong className="unified-table-summary">{formatMoney(filteredData.reduce((sum, record) => sum + parseInt(record['مخزون زائد'] || 0), 0))}</strong>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </UnifiedPageLayout>
    );
}

export default SuppliersPayablesPage;