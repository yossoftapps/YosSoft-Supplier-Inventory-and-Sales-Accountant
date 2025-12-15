import React from 'react';
import { Table } from 'antd';
import { formatMoney } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';

const MainAccountsPage = ({ data, allReportsData }) => {
    if (!data || data.length === 0) {
        return (
            <div className="padding-lg">
                <UnifiedAlert message="لا توجد بيانات للعرض" description="يرجى استيراد البيانات ومعالجتها أولاً" />
            </div>
        );
    }

    const columns = [
        { title: 'م', dataIndex: 'م', width: 60, align: 'center' },
        { title: 'الحساب الرئيسي', dataIndex: 'الحساب الرئيسي', width: 250 },
        { title: 'عدد الموردين', dataIndex: 'عدد الموردين', width: 120, align: 'center' },
        {
            title: 'إجمالي المديونية', dataIndex: 'إجمالي المديونية', width: 150, align: 'left',
            render: val => <span style={{ color: val < 0 ? 'red' : 'green', direction: 'ltr', display: 'inline-block' }}>{formatMoney(val)}</span>
        },
        {
            title: 'إجمالي قيمة المخزون', dataIndex: 'إجمالي قيمة المخزون', width: 150, align: 'left',
            render: val => formatMoney(val)
        },
        {
            title: 'صافي الفجوة', dataIndex: 'صافي الفجوة', width: 150, align: 'left',
            render: val => <span style={{ color: val < 0 ? 'red' : 'green', fontWeight: 'bold', direction: 'ltr', display: 'inline-block' }}>{formatMoney(val)}</span>
        },
        {
            title: 'إجمالي الاستحقاق', dataIndex: 'إجمالي الاستحقاق', width: 150, align: 'left',
            render: val => formatMoney(val)
        },
        // New columns for detailed inventory analysis
        {
            title: 'فائض المخزون', dataIndex: 'فائض المخزون', width: 150, align: 'left',
            render: val => formatMoney(val)
        },
        {
            title: 'معد للارجاع', dataIndex: 'معد للارجاع', width: 150, align: 'left',
            render: val => formatMoney(val)
        },
        {
            title: 'مخزون مثالي', dataIndex: 'مخزون مثالي', width: 150, align: 'left',
            render: val => formatMoney(val)
        },
        {
            title: 'اصناف جديدة', dataIndex: 'اصناف جديدة', width: 150, align: 'left',
            render: val => formatMoney(val)
        },
        {
            title: 'الاحتياج', dataIndex: 'الاحتياج', width: 150, align: 'left',
            render: val => formatMoney(val)
        },
    ];

    return (
        <UnifiedPageLayout
            title="تقرير ملخص الحسابات الرئيسية"
            description="عرض ملخص المديونية وقيم المخزون للحسابات الرئيسية."
            data={data}
            columns={columns}
            filename="main_accounts_summary"
            allReportsData={allReportsData}
        >
            <UnifiedTable
                dataSource={data}
                columns={columns}
                rowKey="م"
                pagination={false}
                bordered
                title="تقرير ملخص الحسابات الرئيسية"
                summary={pageData => {
                    let tCount = 0, tDebt = 0, tInv = 0, tGap = 0, tDue = 0;
                    let tExcess = 0, tReturn = 0, tIdeal = 0, tNew = 0, tNeed = 0;
                    pageData.forEach(r => {
                        tCount += r['عدد الموردين'];
                        tDebt += r['إجمالي المديونية'];
                        tInv += r['إجمالي قيمة المخزون'];
                        tGap += r['صافي الفجوة'];
                        tDue += r['إجمالي الاستحقاق'];
                        // Aggregate new columns
                        tExcess += r['فائض المخزون'] || 0;
                        tReturn += r['معد للارجاع'] || 0;
                        tIdeal += r['مخزون مثالي'] || 0;
                        tNew += r['اصناف جديدة'] || 0;
                        tNeed += r['الاحتياج'] || 0;
                    });

                    return (
                        <Table.Summary.Row className="unified-table-summary-row">
                            <Table.Summary.Cell index={0} colSpan={2} align="center"><strong className="unified-table-summary">الإجمالي الكلي</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={2} align="center"><strong className="unified-table-summary">{tCount}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={3} align="left"><strong className="unified-table-summary">{formatMoney(tDebt)}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={4} align="left"><strong className="unified-table-summary">{formatMoney(tInv)}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={5} align="left"><strong className="unified-table-summary">{formatMoney(tGap)}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={6} align="left"><strong className="unified-table-summary">{formatMoney(tDue)}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={7} align="left"><strong className="unified-table-summary">{formatMoney(tExcess)}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={8} align="left"><strong className="unified-table-summary">{formatMoney(tReturn)}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={9} align="left"><strong className="unified-table-summary">{formatMoney(tIdeal)}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={10} align="left"><strong className="unified-table-summary">{formatMoney(tNew)}</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={11} align="left"><strong className="unified-table-summary">{formatMoney(tNeed)}</strong></Table.Summary.Cell>
                        </Table.Summary.Row>
                    );
                }}
            />
            <div style={{ marginTop: 20, color: '#666', fontSize: '13px' }}>
                * صافي الفجوة = إجمالي قيمة المخزون + إجمالي المديونية (حيث المديونية سالبة). القيمة الموجبة تعني أن المخزون يغطي الدين.
            </div>
        </UnifiedPageLayout>
    );
};

export default MainAccountsPage;