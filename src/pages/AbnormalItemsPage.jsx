import React from 'react';
import { Table, Alert } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';



function AbnormalItemsPage({ data, allReportsData }) {
    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message="لا توجد بيانات" description="يرجى استيراد ملف Excel اولاً لمعالجة البيانات." />
            </div>
        );
    }

    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => {
                const val = parseFloat(text);
                return <span style={{ color: val < 0 ? 'red' : 'inherit', direction: 'ltr' }}>{formatQuantity(text)}</span>;
            }
        },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'left',
            render: (text) => formatMoney(text)
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120, align: 'center' },
        { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية', key: 'تاريخ العملية', width: 120, align: 'center' },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 120 },
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
    ];

    return (
        <UnifiedPageLayout
            title="تقرير الاصناف الشاذة"
            description="يحتوي هذا التقرير على المرتجعات اليتيمة من المشتريات (قائمة B) ومن المبيعات (قائمة D) والكميات السالبة والمنتهية من الجرد الفعلي (قائمة F)."
            data={data}
            columns={columns}
            filename="abnormal-items"
            allReportsData={allReportsData}
        >
            <UnifiedTable
                dataSource={data}
                columns={columns}
                rowKey="م"
                title={`تقرير الاصناف الشاذة (${data.length} سجل)`}
                scroll={{ x: 1500 }}
                pagination={{ 
                    pageSize: 20,
                    showSizeChanger: true, 
                    pageSizeOptions: ['25', '50', '100', '200'] 
                }}
                size="middle"
                summary={pageData => {
                    let totalQty = 0;
                    pageData.forEach(({ الكمية }) => {
                        totalQty += parseFloat(الكمية) || 0;
                    });
                    return (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}><strong className="unified-table-summary">الإجمالي</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={4}><strong className="unified-table-summary">{formatQuantity(totalQty)}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={8}></Table.Summary.Cell>
                        </Table.Summary.Row>
                    );
                }}
            />
        </UnifiedPageLayout>
    );
}

export default AbnormalItemsPage;
