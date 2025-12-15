import React from 'react';
import { Tag, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import { useTranslation } from 'react-i18next';

const NewItemsPerformancePage = ({ data, allReportsData }) => {
    const { t } = useTranslation();

    if (!data) {
        return (
            <div className="padding-lg">
                <UnifiedAlert 
                    message="لا توجد بيانات للعرض" 
                    description="يرجى استيراد البيانات ومعالجتها أولاً" 
                />
            </div>
        );
    }

    // Function to determine tag color based on performance rating
    const getPerformanceColor = (rating) => {
        switch (rating) {
            case 'Excellent': return 'green';
            case 'Good': return 'blue';
            case 'Fair': return 'orange';
            case 'Poor': return 'red';
            default: return 'default';
        }
    };

    // Function to determine risk color
    const getRiskColor = (risk) => {
        switch (risk) {
            case 'Low': return 'green';
            case 'Medium': return 'orange';
            case 'High': return 'red';
            default: return 'default';
        }
    };

    // Function to determine status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'استمرار': return 'green';
            case 'متابعة': return 'blue';
            case 'اختبار': return 'orange';
            case 'إلغاء': return 'red';
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
            title: 'المورد', 
            dataIndex: 'المورد', 
            width: 150
        },
        { 
            title: 'تاريخ أول شراء', 
            dataIndex: 'تاريخ أول شراء', 
            width: 120,
            align: 'center',
            render: date => date ? new Date(date).toLocaleDateString('ar-SA') : '-'
        },
        { 
            title: 'مدة التواجد في السوق (أيام)', 
            dataIndex: 'مدة التواجد في السوق (أيام)', 
            width: 150,
            align: 'center'
        },
        { 
            title: 'كمية الشراء الأولية', 
            dataIndex: 'كمية الشراء الأولية', 
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'كمية المبيعات', 
            dataIndex: 'كمية المبيعات', 
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'نسبة تصريف الكمية (%)', 
            dataIndex: 'نسبة تصريف الكمية (%)', 
            width: 120,
            align: 'center',
            render: val => (
                <span style={{ color: val >= 80 ? 'green' : val >= 60 ? 'blue' : val >= 40 ? 'orange' : 'red' }}>
                    {val.toFixed(2)}%
                </span>
            )
        },
        { 
            title: 'معدل البيع اليومي', 
            dataIndex: 'معدل البيع اليومي', 
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'الربح الإجمالي', 
            dataIndex: 'الربح الإجمالي', 
            width: 120,
            align: 'right',
            render: val => (
                <strong style={{ color: val >= 0 ? 'green' : 'red' }}>
                    {formatMoney(val)}
                </strong>
            )
        },
        { 
            title: 'هامش الربح %', 
            dataIndex: 'هامش الربح %', 
            width: 120,
            align: 'center',
            render: val => (
                <span style={{ color: val >= 20 ? 'green' : val >= 10 ? 'blue' : val >= 5 ? 'orange' : 'red' }}>
                    {val.toFixed(2)}%
                </span>
            )
        },
        { 
            title: 'تقييم الأداء', 
            dataIndex: 'تقييم الأداء', 
            width: 120,
            align: 'center',
            render: text => <Tag color={getPerformanceColor(text)}>{text}</Tag>
        },
        { 
            title: 'مؤشر المخاطرة', 
            dataIndex: 'مؤشر المخاطرة', 
            width: 120,
            align: 'center',
            render: text => <Tag color={getRiskColor(text)}>{text}</Tag>
        },
        { 
            title: 'حالة الصنف', 
            dataIndex: 'حالة الصنف', 
            width: 120,
            align: 'center',
            render: text => <Tag color={getStatusColor(text)}>{text}</Tag>
        }
    ];

    // Calculate summary statistics
    const totalItems = data.length;
    const excellentItems = data.filter(item => item['تقييم الأداء'] === 'Excellent').length;
    const goodItems = data.filter(item => item['تقييم الأداء'] === 'Good').length;
    const fairItems = data.filter(item => item['تقييم الأداء'] === 'Fair').length;
    const poorItems = data.filter(item => item['تقييم الأداء'] === 'Poor').length;
    
    const totalPurchased = data.reduce((sum, item) => sum + (parseFloat(item['كمية الشراء الأولية']) || 0), 0);
    const totalSold = data.reduce((sum, item) => sum + (parseFloat(item['كمية المبيعات']) || 0), 0);
    const totalProfit = data.reduce((sum, item) => sum + (parseFloat(item['الربح الإجمالي']) || 0), 0);
    
    // Calculate overall disposal rate
    const overallDisposalRate = totalPurchased > 0 ? (totalSold / totalPurchased) * 100 : 0;

    const tableSummary = (pageData) => {
        const pagePurchased = pageData.reduce((sum, item) => sum + (parseFloat(item['كمية الشراء الأولية']) || 0), 0);
        const pageSold = pageData.reduce((sum, item) => sum + (parseFloat(item['كمية المبيعات']) || 0), 0);
        const pageProfit = pageData.reduce((sum, item) => sum + (parseFloat(item['الربح الإجمالي']) || 0), 0);
        
        return (
            <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7} align="center">
                    <strong>إجمالي الصفحة</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                    <strong>{formatQuantity(pagePurchased)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                    <strong>{formatQuantity(pageSold)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} colSpan={7} align="center">
                    -
                </Table.Summary.Cell>
            </Table.Summary.Row>
        );
    };

    return (
        <UnifiedPageLayout
            title="أداء الأصناف الجديدة"
            description="تحليل أداء الأصناف الجديدة لتحديد الأصناف التي تستحق الاستمرار والتي يجب التخلص منها"
            data={data}
            columns={columns}
            filename="new_items_performance"
            allReportsData={allReportsData}
            reportKey="newItemsPerformance"
        >
            <UnifiedTable
                dataSource={data}
                columns={columns}
                rowKey="م"
                title={`تحليل أداء الأصناف الجديدة (${data.length} صنف)`}
                summary={tableSummary}
                pagination={{ 
                    pageSize: 50,
                    showSizeChanger: true,
                    pageSizeOptions: ['25', '50', '100', '200']
                }}
                scroll={{ x: 2000, y: 600 }}
                size="middle"
            />
            
            <div style={{ 
                marginTop: 20, 
                padding: 15, 
                backgroundColor: '#f9f9f9', 
                borderRadius: 5,
                border: '1px solid #eee'
            }}>
                <h3>إحصائيات التقرير</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{totalItems}</div>
                        <div>إجمالي الأصناف الجديدة</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{excellentItems}</div>
                        <div>أداء ممتاز</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{goodItems}</div>
                        <div>أداء جيد</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>{fairItems}</div>
                        <div>أداء مقبول</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>{poorItems}</div>
                        <div>أداء ضعيف</div>
                    </div>
                </div>
                <div style={{ marginTop: 15, textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        معدل التصريف الإجمالي: {overallDisposalRate.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 10 }}>
                        الربح الإجمالي: {formatMoney(totalProfit)}
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
                <h3>تفسير التقرير</h3>
                <ul>
                    <li><strong>تاريخ أول شراء:</strong> التاريخ الذي تم فيه شراء الصنف لأول مرة</li>
                    <li><strong>مدة التواجد في السوق:</strong> عدد الأيام منذ أول شراء</li>
                    <li><strong>كمية الشراء الأولية:</strong> الكمية التي تم شراؤها عند إطلاق الصنف</li>
                    <li><strong>كمية المبيعات:</strong> الكمية المباعة من الصنف حتى الآن</li>
                    <li><strong>نسبة تصريف الكمية:</strong> النسبة المئوية للكمية المباعة من الكمية المشتراة</li>
                    <li><strong>معدل البيع اليومي:</strong> متوسط الكمية المباعة يومياً</li>
                    <li><strong>الربح الإجمالي:</strong> الفرق بين قيمة المبيعات وتكلفة الشراء</li>
                    <li><strong>هامش الربح %:</strong> النسبة المئوية للربح من قيمة المبيعات</li>
                    <li><strong>تقييم الأداء:</strong> تقييم الأداء (ممتاز/جيد/مقبول/ضعيف)</li>
                    <li><strong>مؤشر المخاطرة:</strong> مستوى المخاطرة (منخفض/متوسط/عالي)</li>
                    <li><strong>حالة الصنف:</strong> التوصية بشأن الصنف (استمرار/متابعة/اختبار/إلغاء)</li>
                </ul>
                <p>
                    <strong>التوصيات:</strong>
                    <ul>
                        <li>الأصناف ذات الأداء الممتاز تستحق الاستمرار والترويج</li>
                        <li>الأصناف ذات الأداء الجيد تحتاج إلى مراقبة مستمرة</li>
                        <li>الأصناف ذات الأداء الضعيف قد تحتاج إلى إلغاء أو إعادة تقييم</li>
                    </ul>
                </p>
            </div>
        </UnifiedPageLayout>
    );
};

export default NewItemsPerformancePage;