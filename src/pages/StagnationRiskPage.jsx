import React, { useMemo } from 'react';
import { Tag, Table } from 'antd';
import { formatQuantity } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import { useTranslation } from 'react-i18next';

const StagnationRiskPage = ({ data, allReportsData }) => {
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

    // Function to determine tag color based on risk level
    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'عالي': return 'red';
            case 'متوسط': return 'orange';
            case 'منخفض': return 'green';
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
            title: 'الكمية الحالية', 
            dataIndex: 'الكمية الحالية', 
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'عدد مرات البيع', 
            dataIndex: 'عدد مرات البيع', 
            width: 120,
            align: 'center'
        },
        { 
            title: 'متوسط الكمية المباعة', 
            dataIndex: 'متوسط الكمية المباعة', 
            width: 150,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'متوسط الفترة بين المبيعات (أيام)', 
            dataIndex: 'متوسط الفترة بين المبيعات (أيام)', 
            width: 200,
            align: 'center'
        },
        { 
            title: 'معدل دوران المخزون', 
            dataIndex: 'معدل دوران المخزون', 
            width: 150,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'فترة التخزين المتوقعة (أيام)', 
            dataIndex: 'فترة التخزين المتوقعة (أيام)', 
            width: 200,
            align: 'center',
            render: val => val === Infinity ? '∞' : val
        },
        { 
            title: 'مؤشر الخطورة', 
            dataIndex: 'مؤشر الخطورة', 
            width: 120,
            align: 'center',
            render: val => (
                <strong style={{ color: val > 70 ? 'red' : val > 40 ? 'orange' : 'green' }}>
                    {val}
                </strong>
            )
        },
        { 
            title: 'تصنيف الخطورة', 
            dataIndex: 'تصنيف الخطورة', 
            width: 120,
            align: 'center',
            render: text => <Tag color={getRiskColor(text)}>{text}</Tag>
        }
    ];

    // Calculate summary statistics
    const totalItems = data.length;
    const highRiskItems = data.filter(item => item['تصنيف الخطورة'] === 'عالي').length;
    const mediumRiskItems = data.filter(item => item['تصنيف الخطورة'] === 'متوسط').length;
    const lowRiskItems = data.filter(item => item['تصنيف الخطورة'] === 'منخفض').length;
    const totalCurrentQuantity = data.reduce((sum, item) => sum + (parseFloat(item['الكمية الحالية']) || 0), 0);

    const tableSummary = (pageData) => {
        return (
            <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4} align="center">
                    <strong>الإجمالي</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                    <strong>{formatQuantity(totalCurrentQuantity)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} colSpan={7} align="center">
                    -
                </Table.Summary.Cell>
            </Table.Summary.Row>
        );
    };

    return (
        <UnifiedPageLayout
            title="مخاطر الركود"
            description="تحليل مخاطر الركود للمواد في المخزون بناءً على أنماط الحركة"
            data={data}
            columns={columns}
            filename="stagnation_risk"
            allReportsData={allReportsData}
            reportKey="stagnationRisk"
        >
            <UnifiedTable
                dataSource={data}
                columns={columns}
                rowKey="م"
                title={`تحليل مخاطر الركود (${data.length} صنف)`}
                summary={tableSummary}
                pagination={{ 
                    pageSize: 50,
                    showSizeChanger: true,
                    pageSizeOptions: ['25', '50', '100', '200']
                }}
                scroll={{ x: 1800, y: 600 }}
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
                        <div>إجمالي الأصناف</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>{highRiskItems}</div>
                        <div>أصناف عالية الخطورة</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>{mediumRiskItems}</div>
                        <div>أصناف متوسطة الخطورة</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{lowRiskItems}</div>
                        <div>أصناف منخفضة الخطورة</div>
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
                    <li><strong>الكمية الحالية:</strong> الكمية الموجودة في المخزون حالياً</li>
                    <li><strong>عدد مرات البيع:</strong> عدد مرات بيع الصنف خلال الفترة المحددة</li>
                    <li><strong>متوسط الكمية المباعة:</strong> متوسط الكمية المباعة في كل عملية بيع</li>
                    <li><strong>متوسط الفترة بين المبيعات:</strong> متوسط الأيام بين عملية بيع وأخرى</li>
                    <li><strong>معدل دوران المخزون:</strong> عدد مرات بيع المخزون كاملاً خلال السنة</li>
                    <li><strong>فترة التخزين المتوقعة:</strong> الأيام المتوقعة لبيع الكمية الحالية</li>
                    <li><strong>مؤشر الخطورة:</strong> درجة الخطورة (0-100) حيث 100 يعني أعلى خطورة</li>
                    <li><strong>تصنيف الخطورة:</strong> تصنيف مبسط للخطورة (عالي/متوسط/منخفض)</li>
                </ul>
            </div>
        </UnifiedPageLayout>
    );
};

export default StagnationRiskPage;