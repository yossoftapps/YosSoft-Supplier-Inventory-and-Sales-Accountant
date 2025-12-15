import React, { useState } from 'react';
import { Typography, Alert, Tag, Progress, Table } from 'antd';
import { formatMoney, formatQuantity } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';

const { Title } = Typography;

const SupplierScorecardsPage = ({ data, allReportsData }) => {
    const [columnVisibility, setColumnVisibility] = useState({});
    const [pagination, setPagination] = useState({ pageSize: 100 });
    const [filters, setFilters] = useState({});

    if (!data || data.length === 0) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert
                    message="لا توجد بيانات للعرض"
                    description="يرجى استيراد البيانات ومعالجتها أولاً"
                    type="info"
                    showIcon
                />
            </div>
        );
    }

    // Apply filters to data
    const filteredData = data.filter(item => {
        // Supplier filter
        if (filters.supplier && item['المورد']) {
            if (!item['المورد'].toString().toLowerCase().includes(filters.supplier.toLowerCase())) {
                return false;
            }
        }

        return true;
    });

    // Function to determine tag color based on score
    const getScoreColor = (score) => {
        if (score >= 80) return 'green';
        if (score >= 60) return 'blue';
        if (score >= 40) return 'orange';
        return 'red';
    };

    const columns = [
        {
            title: 'م',
            dataIndex: 'م',
            width: 60,
            align: 'center',
            fixed: 'left'
        },
        {
            title: 'المورد',
            dataIndex: 'المورد',
            width: 200,
            fixed: 'left'
        },
        {
            title: 'عدد الأصناف',
            dataIndex: 'عدد الأصناف',
            width: 120,
            align: 'center'
        },
        {
            title: 'إجمالي الكمية المشتراة',
            dataIndex: 'إجمالي الكمية المشتراة',
            width: 180,
            align: 'right',
            render: val => formatQuantity(val)
        },
        {
            title: 'إجمالي القيمة المشتراة',
            dataIndex: 'إجمالي القيمة المشتراة',
            width: 180,
            align: 'right',
            render: val => formatMoney(val)
        },
        {
            title: 'إجمالي الكمية المرتجعة',
            dataIndex: 'إجمالي الكمية المرتجعة',
            width: 180,
            align: 'right',
            render: val => formatQuantity(val)
        },
        {
            title: 'إجمالي القيمة المرتجعة',
            dataIndex: 'إجمالي القيمة المرتجعة',
            width: 180,
            align: 'right',
            render: val => formatMoney(val)
        },
        {
            title: 'نسبة المرتجعات %',
            dataIndex: 'نسبة المرتجعات %',
            width: 150,
            align: 'center',
            render: val => {
                let color = 'green';
                if (val > 10) color = 'red';
                else if (val > 5) color = 'orange';
                else if (val > 2) color = 'yellow';

                return <Tag color={color}>{val}%</Tag>;
            }
        },
        {
            title: 'تباين الأسعار',
            dataIndex: 'تباين الأسعار',
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        {
            title: 'درجة الجودة',
            dataIndex: 'درجة الجودة',
            width: 150,
            align: 'center',
            render: val => (
                <Progress
                    percent={val}
                    strokeColor={getScoreColor(val)}
                    format={() => `${val}`}
                />
            )
        },
        {
            title: 'درجة التسعير',
            dataIndex: 'درجة التسعير',
            width: 150,
            align: 'center',
            render: val => (
                <Progress
                    percent={val}
                    strokeColor={getScoreColor(val)}
                    format={() => `${val}`}
                />
            )
        },
        {
            title: 'الدرجة الإجمالية',
            dataIndex: 'الدرجة الإجمالية',
            width: 150,
            align: 'center',
            fixed: 'right',
            render: val => (
                <Tag color={getScoreColor(val)} style={{ fontSize: '14px', padding: '4px 12px' }}>
                    {val}
                </Tag>
            )
        }
    ];

    // Filter columns based on visibility settings
    const visibleColumns = columns.filter(col =>
        columnVisibility[col.dataIndex || col.key] !== false
    );

    // Table summary function
    const tableSummary = (pageData) => {
        // Calculate totals
        let totalPurchasedQuantity = 0;
        let totalPurchasedValue = 0;
        let totalReturnedQuantity = 0;
        let totalReturnedValue = 0;

        pageData.forEach(item => {
            totalPurchasedQuantity += typeof item['إجمالي الكمية المشتراة'] === 'string'
                ? parseFloat(item['إجمالي الكمية المشتراة']) || 0
                : item['إجمالي الكمية المشتراة'] || 0;
            totalPurchasedValue += typeof item['إجمالي القيمة المشتراة'] === 'string'
                ? parseFloat(item['إجمالي القيمة المشتراة']) || 0
                : item['إجمالي القيمة المشتراة'] || 0;
            totalReturnedQuantity += typeof item['إجمالي الكمية المرتجعة'] === 'string'
                ? parseFloat(item['إجمالي الكمية المرتجعة']) || 0
                : item['إجمالي الكمية المرتجعة'] || 0;
            totalReturnedValue += typeof item['إجمالي القيمة المرتجعة'] === 'string'
                ? parseFloat(item['إجمالي القيمة المرتجعة']) || 0
                : item['إجمالي القيمة المرتجعة'] || 0;
        });

        // Ensure all totals are valid numbers before formatting
        totalPurchasedQuantity = typeof totalPurchasedQuantity === 'string'
            ? parseFloat(totalPurchasedQuantity) || 0
            : totalPurchasedQuantity || 0;
        totalPurchasedValue = typeof totalPurchasedValue === 'string'
            ? parseFloat(totalPurchasedValue) || 0
            : totalPurchasedValue || 0;
        totalReturnedQuantity = typeof totalReturnedQuantity === 'string'
            ? parseFloat(totalReturnedQuantity) || 0
            : totalReturnedQuantity || 0;
        totalReturnedValue = typeof totalReturnedValue === 'string'
            ? parseFloat(totalReturnedValue) || 0
            : totalReturnedValue || 0;

        return (
            <Table.Summary.Row style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0} align="center">
                    الإجمالي
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={2} align="center">
                    {pageData.length} مورد
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                    {formatQuantity(totalPurchasedQuantity)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                    {formatMoney(totalPurchasedValue)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                    {formatQuantity(totalReturnedQuantity)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                    {formatMoney(totalReturnedValue)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} colSpan={5} align="center">
                    -
                </Table.Summary.Cell>
            </Table.Summary.Row>
        );
    };

    // Handle filter changes
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    return (
        <UnifiedPageLayout
            title="بطاقة تقييم الموردين"
            description="تقييم أداء الموردين بناءً على عدة مؤشرات مثل الجودة والتسعير ونسبة المرتجعات."
            data={filteredData}
            columns={visibleColumns}
            filename="supplier_scorecards"
            allReportsData={allReportsData}
            reportKey="supplierScorecards"
            onColumnVisibilityChange={setColumnVisibility}
            onPaginationChange={setPagination}
            pagination={pagination}
            filterData={data}
            filterDataType="purchases"
            onFilterChange={handleFilterChange}
        >
            <UnifiedTable
                dataSource={filteredData}
                columns={visibleColumns}
                rowKey="م"
                title={`بطاقة تقييم الموردين (${filteredData.length} مورد)`}
                summary={tableSummary}
                pagination={{
                    pageSize: pagination.pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['25', '50', '100', '200']
                }}
                scroll={{ x: 1800, y: 600 }}
            />

            <div style={{
                marginTop: 20,
                padding: 15,
                backgroundColor: '#f9f9f9',
                borderRadius: 5,
                border: '1px solid #eee'
            }}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>تفسير التقرير</Typography.Title>
                <ul>
                    <li><strong>عدد الأصناف:</strong> عدد الأصناف المختلفة المشتراة من هذا المورد</li>
                    <li><strong>إجمالي الكمية المشتراة:</strong> الكمية الإجمالية لجميع المشتريات من هذا المورد</li>
                    <li><strong>إجمالي القيمة المشتراة:</strong> القيمة الإجمالية لجميع المشتريات من هذا المورد</li>
                    <li><strong>إجمالي الكمية المرتجعة:</strong> الكمية الإجمالية لجميع المرتجعات من هذا المورد</li>
                    <li><strong>إجمالي القيمة المرتجعة:</strong> القيمة الإجمالية لجميع المرتجعات من هذا المورد</li>
                    <li><strong>نسبة المرتجعات %:</strong> نسبة المرتجعات مقارنة بالمشتريات (أقل نسبة أفضل)</li>
                    <li><strong>تباين الأسعار:</strong> مدى تفاوت أسعار الشراء من هذا المورد (أقل تباين أفضل)</li>
                    <li><strong>درجة الجودة:</strong> تقييم الجودة بناءً على نسبة المرتجعات</li>
                    <li><strong>درجة التسعير:</strong> تقييم التسعير بناءً على استقرار الأسعار</li>
                    <li><strong>الدرجة الإجمالية:</strong> المتوسط المرجح لدرجتي الجودة والتسعير</li>
                </ul>
            </div>
        </UnifiedPageLayout>
    );
};

export default SupplierScorecardsPage;