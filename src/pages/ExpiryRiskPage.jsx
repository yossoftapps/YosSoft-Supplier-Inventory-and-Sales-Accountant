import React from 'react';
import { Table, Alert, Tag } from 'antd';
import { formatMoney, formatQuantity } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';



const ExpiryRiskPage = ({ data, allReportsData }) => {
    if (!data || data.length === 0) {
        return (
            <div className="padding-lg">
                <UnifiedAlert 
                    message="لا توجد بيانات للعرض" 
                    description="يرجى استيراد البيانات ومعالجتها أولاً" 
                />
            </div>
        );
    }

    // Function to determine tag color based on risk percentage
    const getRiskColor = (riskPercent) => {
        if (riskPercent > 50) return 'red';
        if (riskPercent > 30) return 'orange';
        if (riskPercent > 10) return 'yellow';
        return 'green';
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
            title: 'رقم السجل', 
            dataIndex: 'رقم السجل', 
            width: 120,
            align: 'center'
        },
        { 
            title: 'الكمية الحالية', 
            dataIndex: 'الكمية الحالية', 
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'تاريخ الصلاحية', 
            dataIndex: 'تاريخ الصلاحية', 
            width: 120,
            align: 'center'
        },
        { 
            title: 'الأيام المتبقية', 
            dataIndex: 'الأيام المتبقية', 
            width: 120,
            align: 'center',
            render: val => {
                let color = 'green';
                if (val <= 7) color = 'red';
                else if (val <= 30) color = 'orange';
                else if (val <= 90) color = 'yellow';
                
                return <Tag color={color}>{val}</Tag>;
            }
        },
        { 
            title: 'معدل البيع اليومي', 
            dataIndex: 'معدل البيع اليومي', 
            width: 150,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'الكمية المتوقعة للبيع', 
            dataIndex: 'الكمية المتوقعة للبيع', 
            width: 180,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'الخطر المتوقع', 
            dataIndex: 'الخطر المتوقع', 
            width: 150,
            align: 'right',
            render: val => (
                <span style={{ 
                    color: val > 0 ? 'red' : 'inherit',
                    fontWeight: 'bold'
                }}>
                    {formatQuantity(val)}
                </span>
            )
        },
        { 
            title: 'نسبة الخطر %', 
            dataIndex: 'نسبة الخطر %', 
            width: 120,
            align: 'center',
            render: val => (
                <Tag color={getRiskColor(val)}>
                    {val}%
                </Tag>
            )
        }
    ];

    return (
        <UnifiedPageLayout
            title="توقعات مخاطر انتهاء الصلاحية"
            description="تحليل وتوقع المخاطر المرتبطة بانتهاء صلاحية المواد في المخزون"
            data={data}
            columns={columns}
            filename="expiry_risk_forecast"
            allReportsData={allReportsData}
        >
            <UnifiedTable
                dataSource={data}
                columns={columns}
                rowKey="م"
                title={`توقعات مخاطر انتهاء الصلاحية (${data.length} سجل)`}
                pagination={{
                    pageSize: 50,
                    showSizeChanger: true,
                    pageSizeOptions: ['25', '50', '100', '200']
                }}
                scroll={{ x: 1600 }}
                bordered
                size="middle"
                summary={pageData => {
                    // Calculate totals
                    let totalCurrentQuantity = 0;
                    let totalExpectedSales = 0;
                    let totalExpectedRisk = 0;
                    
                    pageData.forEach(item => {
                        totalCurrentQuantity += typeof item['الكمية الحالية'] === 'string' 
                            ? parseFloat(item['الكمية الحالية']) || 0 
                            : item['الكمية الحالية'] || 0;
                        totalExpectedSales += typeof item['الكمية المتوقعة للبيع'] === 'string' 
                            ? parseFloat(item['الكمية المتوقعة للبيع']) || 0 
                            : item['الكمية المتوقعة للبيع'] || 0;
                        totalExpectedRisk += typeof item['الخطر المتوقع'] === 'string' 
                            ? parseFloat(item['الخطر المتوقع']) || 0 
                            : item['الخطر المتوقع'] || 0;
                    });
                    
                    // Ensure all totals are valid numbers before formatting
                    totalCurrentQuantity = typeof totalCurrentQuantity === 'string' 
                        ? parseFloat(totalCurrentQuantity) || 0 
                        : totalCurrentQuantity || 0;
                    totalExpectedSales = typeof totalExpectedSales === 'string' 
                        ? parseFloat(totalExpectedSales) || 0 
                        : totalExpectedSales || 0;
                    totalExpectedRisk = typeof totalExpectedRisk === 'string' 
                        ? parseFloat(totalExpectedRisk) || 0 
                        : totalExpectedRisk || 0;
                    
                    return (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={5} align="center">
                                <strong className="unified-table-summary">الإجمالي</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} align="right">
                                <strong className="unified-table-summary">{formatQuantity(totalCurrentQuantity)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={6} colSpan={3} align="center">
                                -
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={9} align="right">
                                <strong className="unified-table-summary">{formatQuantity(totalExpectedSales)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={10} align="right">
                                <span style={{ 
                                    color: totalExpectedRisk > 0 ? 'red' : 'inherit',
                                    fontWeight: 'bold'
                                }}>
                                    <strong className="unified-table-summary">{formatQuantity(totalExpectedRisk)}</strong>
                                </span>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={11} align="center">
                                -
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    );
                }}
            />
            
            <div className="unified-explanation-box">
                <h5 className="unified-explanation-title">تفسير التقرير</h5>
                <ul>
                    <li><strong>الكمية الحالية:</strong> الكمية الموجودة في المخزون لهذا الباتش</li>
                    <li><strong>تاريخ الصلاحية:</strong> تاريخ انتهاء صلاحية هذا الباتش</li>
                    <li><strong>الأيام المتبقية:</strong> عدد الأيام المتبقية حتى انتهاء الصلاحية</li>
                    <li><strong>معدل البيع اليومي:</strong> متوسط الكمية المباعة يومياً من هذا الصنف</li>
                    <li><strong>الكمية المتوقعة للبيع:</strong> الكمية المتوقعة للبيع قبل انتهاء الصلاحية</li>
                    <li><strong>الخطر المتوقع:</strong> الكمية المتوقعة أن تنتهي صلاحيتها قبل بيعها (أحمر = خطر عالي)</li>
                    <li><strong>نسبة الخطر %:</strong> نسبة الكمية المهددة بالانتهاء مقارنة بالكمية الحالية</li>
                </ul>
            </div>
        </UnifiedPageLayout>
    );
};

export default ExpiryRiskPage;