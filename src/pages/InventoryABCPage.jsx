import React, { useState, useMemo } from 'react';
import { Typography, Alert, Tag, Progress } from 'antd';
import { formatMoney, formatQuantity } from '../utils/financialCalculations';
import { filterGenericData } from '../utils/dataFilter';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';

const { Title } = Typography;

const InventoryABCPage = ({ data, allReportsData }) => {
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

    // Apply filters to data using centralized utility
    const filteredData = useMemo(() => {
        return filterGenericData(data, filters);
    }, [data, filters]);

    // Function to determine tag color based on ABC classification
    const getClassificationColor = (classification) => {
        switch (classification) {
            case 'A': return 'red';
            case 'B': return 'orange';
            case 'C': return 'green';
            default: return 'default';
        }
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
            title: 'رمز المادة',
            dataIndex: 'رمز المادة',
            width: 120,
            fixed: 'left'
        },
        {
            title: 'اسم المادة',
            dataIndex: 'اسم المادة',
            width: 200
        },
        {
            title: 'الوحدة',
            dataIndex: 'الوحدة',
            width: 80,
            align: 'center'
        },
        {
            title: 'عدد عمليات البيع',
            dataIndex: 'عدد عمليات البيع',
            width: 120,
            align: 'center'
        },
        {
            title: 'الكمية المباعة',
            dataIndex: 'إجمالي الكمية المباعة',
            width: 120,
            align: 'right',
            render: val => {
                // Ensure we're working with a valid number
                const numValue = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
                return formatQuantity(numValue);
            }
        },
        {
            title: 'قيمة الاستهلاك السنوي',
            dataIndex: 'إجمالي قيمة الاستهلاك السنوي',
            width: 150,
            align: 'right',
            render: val => {
                // Ensure we're working with a valid number
                const numValue = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
                return formatMoney(numValue);
            }
        },
        {
            title: 'القيمة التراكمية %',
            dataIndex: 'القيمة التراكمية %',
            width: 150,
            align: 'center',
            render: val => {
                // Ensure we're working with a valid number
                const numValue = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
                return (
                    <Progress
                        percent={numValue}
                        size="small"
                        status={numValue <= 80 ? 'exception' : numValue <= 95 ? 'normal' : 'success'}
                        showInfo={false}
                    />
                );
            }
        },
        {
            title: 'التصنيف ABC',
            dataIndex: 'التصنيف ABC',
            width: 120,
            align: 'center',
            render: val => (
                <Tag color={getClassificationColor(val)}>
                    {val}
                </Tag>
            )
        }
    ];

    // Filter columns based on visibility settings
    const visibleColumns = columns.filter(col =>
        columnVisibility[col.dataIndex || col.key] !== false
    );

    // Calculate summary statistics
    const classACount = filteredData.filter(item => item['التصنيف ABC'] === 'A').length;
    const classBCount = filteredData.filter(item => item['التصنيف ABC'] === 'B').length;
    const classCCount = filteredData.filter(item => item['التصنيف ABC'] === 'C').length;

    const classAValue = filteredData
        .filter(item => item['التصنيف ABC'] === 'A')
        .reduce((sum, item) => {
            const value = typeof item['إجمالي قيمة الاستهلاك السنوي'] === 'string'
                ? parseFloat(item['إجمالي قيمة الاستهلاك السنوي']) || 0
                : item['إجمالي قيمة الاستهلاك السنوي'] || 0;
            return sum + value;
        }, 0);

    const classBValue = filteredData
        .filter(item => item['التصنيف ABC'] === 'B')
        .reduce((sum, item) => {
            const value = typeof item['إجمالي قيمة الاستهلاك السنوي'] === 'string'
                ? parseFloat(item['إجمالي قيمة الاستهلاك السنوي']) || 0
                : item['إجمالي قيمة الاستهلاك السنوي'] || 0;
            return sum + value;
        }, 0);

    const classCValue = filteredData
        .filter(item => item['التصنيف ABC'] === 'C')
        .reduce((sum, item) => {
            const value = typeof item['إجمالي قيمة الاستهلاك السنوي'] === 'string'
                ? parseFloat(item['إجمالي قيمة الاستهلاك السنوي']) || 0
                : item['إجمالي قيمة الاستهلاك السنوي'] || 0;
            return sum + value;
        }, 0);

    // Table summary function
    const tableSummary = (pageData) => {
        // Calculate totals
        let totalSalesCount = 0;
        let totalQuantitySold = 0;
        let totalAnnualConsumptionValue = 0;

        pageData.forEach(item => {
            totalSalesCount += item['عدد عمليات البيع'] || 0;
            totalQuantitySold += typeof item['إجمالي الكمية المباعة'] === 'string'
                ? parseFloat(item['إجمالي الكمية المباعة']) || 0
                : item['إجمالي الكمية المباعة'] || 0;
            totalAnnualConsumptionValue += typeof item['إجمالي قيمة الاستهلاك السنوي'] === 'string'
                ? parseFloat(item['إجمالي قيمة الاستهلاك السنوي']) || 0
                : item['إجمالي قيمة الاستهلاك السنوي'] || 0;
        });

        // Ensure all totals are valid numbers before formatting
        totalQuantitySold = typeof totalQuantitySold === 'string'
            ? parseFloat(totalQuantitySold) || 0
            : totalQuantitySold || 0;
        totalAnnualConsumptionValue = typeof totalAnnualConsumptionValue === 'string'
            ? parseFloat(totalAnnualConsumptionValue) || 0
            : totalAnnualConsumptionValue || 0;

        return (
            <Table.Summary.Row style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0} colSpan={4} align="center">
                    الإجمالي
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="center">
                    {totalSalesCount}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                    {formatQuantity(totalQuantitySold)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                    {formatMoney(totalAnnualConsumptionValue)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} colSpan={2} align="center">
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
            title="تحليل ABC للمخزون"
            description="تحليل توزيع قيمة المخزون حسب تصنيف ABC لتحديد الأصناف الأكثر أهمية استراتيجياً."
            data={filteredData}
            columns={visibleColumns}
            filename="inventory_abc_analysis"
            allReportsData={allReportsData}
            reportKey="inventoryABC"
            onColumnVisibilityChange={setColumnVisibility}
            onPaginationChange={setPagination}
            pagination={pagination}
            filterData={data}
            filterDataType="inventoryABC"
            onFilterChange={handleFilterChange}
        >
            <UnifiedTable
                dataSource={filteredData}
                columns={visibleColumns}
                rowKey="م"
                title={`تحليل ABC للمخزون (${filteredData.length} صنف)`}
                summary={tableSummary}
                pagination={{
                    pageSize: pagination.pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['25', '50', '100', '200']
                }}
                scroll={{ x: 1500, y: 600 }}
            />

            <div style={{
                marginTop: 20,
                padding: 15,
                backgroundColor: '#f9f9f9',
                borderRadius: 5,
                border: '1px solid #eee'
            }}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>إحصائيات التصنيف</Typography.Title>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>A</div>
                        <div>{classACount} صنف</div>
                        <div>{formatMoney(classAValue)} قيمة</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>B</div>
                        <div>{classBCount} صنف</div>
                        <div>{formatMoney(classBValue)} قيمة</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>C</div>
                        <div>{classCCount} صنف</div>
                        <div>{formatMoney(classCValue)} قيمة</div>
                    </div>
                </div>
            </div>

            <div style={{
                marginTop: 20,
                padding: 15,
                backgroundColor: '#f9f9f9',
                borderRadius: 5,
                border: '1px solid #eee'
            }}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>تفسير التقرير</Typography.Title>
                <ul>
                    <li><strong>Class A:</strong> الأصناف التي تشكل 80% من القيمة (حوالي 20% من العدد) - ذات أهمية استراتيجية عالية</li>
                    <li><strong>Class B:</strong> الأصناف التي تشكل 15% من القيمة (حوالي 30% من العدد) - ذات أهمية متوسطة</li>
                    <li><strong>Class C:</strong> الأصناف التي تشكل 5% من القيمة (حوالي 50% من العدد) - ذات أهمية أقل</li>
                    <li><strong>عدد عمليات البيع:</strong> عدد مرات بيع الصنف</li>
                    <li><strong>الكمية المباعة:</strong> إجمالي الكمية المباعة من الصنف</li>
                    <li><strong>قيمة الاستهلاك السنوي:</strong> الكمية المباعة × سعر الشراء</li>
                    <li><strong>القيمة التراكمية %:</strong> النسبة التراكمية لقيمة الاستهلاك</li>
                </ul>
            </div>
        </UnifiedPageLayout>
    );
};

export default InventoryABCPage;