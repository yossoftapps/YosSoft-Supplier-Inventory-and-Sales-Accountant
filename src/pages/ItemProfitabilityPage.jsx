import React, { useState } from 'react';
import { Typography, Alert, Tag, Card, Row, Col } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatMoney, formatQuantity } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';

const { Title } = Typography;

// Colors for charts
const COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#f5222d', '#eb2f96'];
const PIE_COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#f5222d', '#eb2f96'];

const ItemProfitabilityPage = ({ data, allReportsData }) => {
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
        // Material code filter
        if (filters.materialCode && item['رمز المادة']) {
            if (!item['رمز المادة'].toString().toLowerCase().includes(filters.materialCode.toLowerCase())) {
                return false;
            }
        }
        
        // Material name filter
        if (filters.materialName && item['اسم المادة']) {
            if (!item['اسم المادة'].toString().toLowerCase().includes(filters.materialName.toLowerCase())) {
                return false;
            }
        }
        
        return true;
    });

    // Function to determine tag color based on profit margin
    const getProfitMarginColor = (marginPercent) => {
        if (marginPercent > 50) return 'green';
        if (marginPercent > 20) return 'blue';
        if (marginPercent > 0) return 'orange';
        if (marginPercent === 0) return 'default';
        return 'red';
    };

    // Function to determine tag color based on contribution percentage
    const getContributionColor = (contributionPercent) => {
        if (contributionPercent > 20) return 'green';
        if (contributionPercent > 10) return 'blue';
        if (contributionPercent > 5) return 'orange';
        if (contributionPercent > 0) return 'default';
        return 'red';
    };

    // Prepare data for charts (using filtered data)
    const topProfitableItems = [...filteredData]
        .sort((a, b) => {
            const profitA = typeof a['إجمالي الربح'] === 'string' ? parseFloat(a['إجمالي الربح']) || 0 : a['إجمالي الربح'] || 0;
            const profitB = typeof b['إجمالي الربح'] === 'string' ? parseFloat(b['إجمالي الربح']) || 0 : b['إجمالي الربح'] || 0;
            return profitB - profitA;
        })
        .slice(0, 10)
        .map(item => ({
            name: item['اسم المادة'],
            profit: typeof item['إجمالي الربح'] === 'string' ? parseFloat(item['إجمالي الربح']) || 0 : item['إجمالي الربح'] || 0,
            sales: typeof item['إجمالي قيمة المبيعات'] === 'string' ? parseFloat(item['إجمالي قيمة المبيعات']) || 0 : item['إجمالي قيمة المبيعات'] || 0,
            cost: typeof item['إجمالي تكلفة المبيعات'] === 'string' ? parseFloat(item['إجمالي تكلفة المبيعات']) || 0 : item['إجمالي تكلفة المبيعات'] || 0
        }));

    const topContributors = [...filteredData]
        .sort((a, b) => {
            const contribA = typeof a['نسبة المساهمة في أرباح الشركة %'] === 'string' ? parseFloat(a['نسبة المساهمة في أرباح الشركة %']) || 0 : a['نسبة المساهمة في أرباح الشركة %'] || 0;
            const contribB = typeof b['نسبة المساهمة في أرباح الشركة %'] === 'string' ? parseFloat(b['نسبة المساهمة في أرباح الشركة %']) || 0 : b['نسبة المساهمة في أرباح الشركة %'] || 0;
            return contribB - contribA;
        })
        .slice(0, 10)
        .map(item => ({
            name: item['اسم المادة'],
            contribution: typeof item['نسبة المساهمة في أرباح الشركة %'] === 'string' ? parseFloat(item['نسبة المساهمة في أرباح الشركة %']) || 0 : item['نسبة المساهمة في أرباح الشركة %'] || 0
        }));

    const profitMarginDistribution = [...filteredData]
        .reduce((acc, item) => {
            const margin = typeof item['نسبة هامش الربح %'] === 'string' ? parseFloat(item['نسبة هامش الربح %']) || 0 : item['نسبة هامش الربح %'] || 0;
            if (margin > 50) acc.high++;
            else if (margin > 20) acc.medium++;
            else if (margin > 0) acc.low++;
            else if (margin === 0) acc.zero++;
            else acc.negative++;
            return acc;
        }, { high: 0, medium: 0, low: 0, zero: 0, negative: 0 });

    const profitMarginData = [
        { name: 'هامش ربح مرتفع (>50%)', value: profitMarginDistribution.high },
        { name: 'هامش ربح متوسط (20-50%)', value: profitMarginDistribution.medium },
        { name: 'هامش ربح منخفض (0-20%)', value: profitMarginDistribution.low },
        { name: 'بدون ربح (0%)', value: profitMarginDistribution.zero },
        { name: 'خسارة (<0%)', value: profitMarginDistribution.negative }
    ];

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
            title: 'قيمة المبيعات', 
            dataIndex: 'إجمالي قيمة المبيعات', 
            width: 120,
            align: 'right',
            render: val => {
                // Ensure we're working with a valid number
                const numValue = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
                return formatMoney(numValue);
            }
        },
        { 
            title: 'تكلفة المبيعات', 
            dataIndex: 'إجمالي تكلفة المبيعات', 
            width: 120,
            align: 'right',
            render: val => {
                // Ensure we're working with a valid number
                const numValue = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
                return formatMoney(numValue);
            }
        },
        { 
            title: 'إجمالي الربح', 
            dataIndex: 'إجمالي الربح', 
            width: 120,
            align: 'right',
            render: val => {
                // Ensure we're working with a valid number
                const numValue = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
                return (
                    <span style={{ 
                        color: numValue < 0 ? 'red' : numValue > 0 ? 'green' : 'inherit',
                        fontWeight: 'bold'
                    }}>
                        {formatMoney(numValue)}
                    </span>
                );
            }
        },
        { 
            title: 'نسبة هامش الربح %', 
            dataIndex: 'نسبة هامش الربح %', 
            width: 150,
            align: 'center',
            render: val => {
                // Ensure we're working with a valid number
                const numValue = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
                return (
                    <Tag color={getProfitMarginColor(numValue)}>
                        {numValue}%
                    </Tag>
                );
            }
        },
        { 
            title: 'نسبة المساهمة %', 
            dataIndex: 'نسبة المساهمة في أرباح الشركة %', 
            width: 150,
            align: 'center',
            render: val => {
                // Ensure we're working with a valid number
                const numValue = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
                return (
                    <Tag color={getContributionColor(numValue)}>
                        {numValue}%
                    </Tag>
                );
            }
        }
    ];

    // Filter columns based on visibility settings
    const visibleColumns = columns.filter(col => 
        columnVisibility[col.dataIndex || col.key] !== false
    );

    // Table summary function
    const tableSummary = (pageData) => {
        // Calculate totals
        let totalSalesCount = 0;
        let totalQuantitySold = 0;
        let totalSalesValue = 0;
        let totalCost = 0;
        let totalProfit = 0;
        
        pageData.forEach(item => {
            totalSalesCount += item['عدد عمليات البيع'] || 0;
            totalQuantitySold += typeof item['إجمالي الكمية المباعة'] === 'string' 
                ? parseFloat(item['إجمالي الكمية المباعة']) || 0 
                : item['إجمالي الكمية المباعة'] || 0;
            totalSalesValue += typeof item['إجمالي قيمة المبيعات'] === 'string' 
                ? parseFloat(item['إجمالي قيمة المبيعات']) || 0 
                : item['إجمالي قيمة المبيعات'] || 0;
            totalCost += typeof item['إجمالي تكلفة المبيعات'] === 'string' 
                ? parseFloat(item['إجمالي تكلفة المبيعات']) || 0 
                : item['إجمالي تكلفة المبيعات'] || 0;
            totalProfit += typeof item['إجمالي الربح'] === 'string' 
                ? parseFloat(item['إجمالي الربح']) || 0 
                : item['إجمالي الربح'] || 0;
        });
        
        // Ensure all totals are valid numbers before formatting
        totalQuantitySold = typeof totalQuantitySold === 'string' 
            ? parseFloat(totalQuantitySold) || 0 
            : totalQuantitySold || 0;
        totalSalesValue = typeof totalSalesValue === 'string' 
            ? parseFloat(totalSalesValue) || 0 
            : totalSalesValue || 0;
        totalCost = typeof totalCost === 'string' 
            ? parseFloat(totalCost) || 0 
            : totalCost || 0;
        totalProfit = typeof totalProfit === 'string' 
            ? parseFloat(totalProfit) || 0 
            : totalProfit || 0;
        
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
                    {formatMoney(totalSalesValue)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                    {formatMoney(totalCost)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                    <span style={{ 
                        color: totalProfit < 0 ? 'red' : totalProfit > 0 ? 'green' : 'inherit',
                        fontWeight: 'bold'
                    }}>
                        {formatMoney(totalProfit)}
                    </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} colSpan={2} align="center">
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
            title="تحليل ربحية الأصناف"
            description="تحليل ربحية الأصناف لتحديد الأصناف الأكثر مساهمة في أرباح الشركة وتقييم هامش الربح لكل صنف."
            data={filteredData}
            columns={visibleColumns}
            filename="item_profitability_analysis"
            allReportsData={allReportsData}
            reportKey="itemProfitability"
            onColumnVisibilityChange={setColumnVisibility}
            onPaginationChange={setPagination}
            pagination={pagination}
            filterData={data}
            filterDataType="sales"
            onFilterChange={handleFilterChange}
        >
            {/* Charts Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="أهم الأصناف ربحية" style={{ height: '100%' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={topProfitableItems}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" scale="band" width={80} />
                                <Tooltip 
                                    formatter={(value) => [formatMoney(value), 'الربح']}
                                    labelFormatter={(value) => `الصنف: ${value}`}
                                />
                                <Legend />
                                <Bar dataKey="profit" name="الربح" fill="#52c41a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                
                <Col xs={24} lg={12}>
                    <Card title="توزيع هامش الربح" style={{ height: '100%' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={profitMarginData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {profitMarginData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [value, 'عدد الأصناف']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                
                <Col xs={24} lg={12}>
                    <Card title="أهم المساهمين في الأرباح" style={{ height: '100%' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={topContributors}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip 
                                    formatter={(value) => [`${value}%`, 'المساهمة']}
                                    labelFormatter={(value) => `الصنف: ${value}`}
                                />
                                <Legend />
                                <Bar dataKey="contribution" name="المساهمة %" fill="#1890ff" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                
                <Col xs={24} lg={12}>
                    <Card title="مقارنة المبيعات والتكلفة" style={{ height: '100%' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={topProfitableItems}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatMoney(value)} />
                                <Legend />
                                <Bar dataKey="sales" name="المبيعات" fill="#52c41a" />
                                <Bar dataKey="cost" name="التكلفة" fill="#faad14" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
            
            <UnifiedTable
                dataSource={filteredData}
                columns={visibleColumns}
                rowKey="م"
                title={`تحليل ربحية الأصناف (${filteredData.length} صنف)`}
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
                <Typography.Title level={5} style={{ marginTop: 0 }}>تفسير التقرير</Typography.Title>
                <ul>
                    <li><strong>عدد عمليات البيع:</strong> عدد مرات بيع الصنف</li>
                    <li><strong>الكمية المباعة:</strong> إجمالي الكمية المباعة من الصنف</li>
                    <li><strong>قيمة المبيعات:</strong> إجمالي الإيرادات من بيع الصنف</li>
                    <li><strong>تكلفة المبيعات:</strong> إجمالي التكلفة المرتبطة ببيع الصنف</li>
                    <li><strong>إجمالي الربح:</strong> الفرق بين الإيرادات والتكاليف (أخضر = ربح، أحمر = خسارة)</li>
                    <li><strong>نسبة هامش الربح %:</strong> (الربح ÷ التكلفة) × 100%</li>
                    <li><strong>نسبة المساهمة %:</strong> مساهمة الصنف في إجمالي أرباح الشركة</li>
                </ul>
            </div>
        </UnifiedPageLayout>
    );
};

export default ItemProfitabilityPage;