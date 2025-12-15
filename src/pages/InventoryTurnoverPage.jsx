import React from 'react';
import { Tag, Table } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import { useTranslation } from 'react-i18next';

const InventoryTurnoverPage = ({ data, allReportsData }) => {
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

    // Function to determine tag color based on turnover classification
    const getClassificationColor = (classification) => {
        switch (classification) {
            case 'سريع': return 'green';
            case 'متوسط': return 'blue';
            case 'بطيء': return 'orange';
            case 'راكد': return 'red';
            default: return 'default';
        }
    };

    // Function to determine risk color
    const getRiskColor = (riskValue) => {
        if (riskValue > 80) return 'red';
        if (riskValue > 60) return 'orange';
        if (riskValue > 40) return 'yellow';
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
            title: 'المورد', 
            dataIndex: 'المورد', 
            width: 150
        },
        { 
            title: 'متوسط المخزون', 
            dataIndex: 'متوسط المخزون', 
            width: 120,
            align: 'right',
            render: val => formatMoney(val)
        },
        { 
            title: 'تكلفة المبيعات السنوية', 
            dataIndex: 'تكلفة المبيعات السنوية', 
            width: 150,
            align: 'right',
            render: val => formatMoney(val)
        },
        { 
            title: 'معدل دوران المخزون', 
            dataIndex: 'معدل دوران المخزون', 
            width: 150,
            align: 'right',
            render: val => (
                <strong style={{ color: val > 12 ? 'green' : val > 6 ? 'blue' : val > 2 ? 'orange' : 'red' }}>
                    {formatQuantity(val)}
                </strong>
            )
        },
        { 
            title: 'فترة التخزين بالأيام', 
            dataIndex: 'فترة التخزين', 
            width: 150,
            align: 'center',
            render: val => (
                <span style={{ color: val > 365 ? 'red' : val > 180 ? 'orange' : val > 90 ? 'blue' : 'green' }}>
                    {val}
                </span>
            )
        },
        { 
            title: 'حركة آخر 90 يوم', 
            dataIndex: 'حركة آخر 90 يوم', 
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'فئة الدوران', 
            dataIndex: 'فئة الدوران', 
            width: 120,
            align: 'center',
            render: text => <Tag color={getClassificationColor(text)}>{text}</Tag>
        },
        { 
            title: 'مؤشر المخاطرة', 
            dataIndex: 'مؤشر الخطورة', 
            width: 120,
            align: 'center',
            render: val => (
                <Tag color={getRiskColor(val)}>
                    {val}
                </Tag>
            )
        }
    ];

    // Calculate summary statistics
    const totalItems = data.length;
    const fastTurnoverItems = data.filter(item => item['فئة الدوران'] === 'سريع').length;
    const mediumTurnoverItems = data.filter(item => item['فئة الدوران'] === 'متوسط').length;
    const slowTurnoverItems = data.filter(item => item['فئة الدوران'] === 'بطيء').length;
    const stagnantItems = data.filter(item => item['فئة الدوران'] === 'راكد').length;
    
    const totalInventoryValue = data.reduce((sum, item) => sum + (parseFloat(item['متوسط المخزون']) || 0), 0);
    const totalAnnualCOGS = data.reduce((sum, item) => sum + (parseFloat(item['تكلفة المبيعات السنوية']) || 0), 0);
    
    // Calculate overall inventory turnover ratio
    const overallTurnoverRatio = totalInventoryValue > 0 ? totalAnnualCOGS / totalInventoryValue : 0;

    const tableSummary = (pageData) => {
        const pageInventoryValue = pageData.reduce((sum, item) => sum + (parseFloat(item['متوسط المخزون']) || 0), 0);
        const pageAnnualCOGS = pageData.reduce((sum, item) => sum + (parseFloat(item['تكلفة المبيعات السنوية']) || 0), 0);
        
        return (
            <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} align="center">
                    <strong>إجمالي الصفحة</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                    <strong>{formatMoney(pageInventoryValue)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                    <strong>{formatMoney(pageAnnualCOGS)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} colSpan={5} align="center">
                    -
                </Table.Summary.Cell>
            </Table.Summary.Row>
        );
    };

    return (
        <UnifiedPageLayout
            title="دوران المخزون"
            description="تحليل دوران المخزون لقياس كفاءة إدارة المخزون"
            data={data}
            columns={columns}
            filename="inventory_turnover"
            allReportsData={allReportsData}
            reportKey="inventoryTurnover"
        >
            <UnifiedTable
                dataSource={data}
                columns={columns}
                rowKey="م"
                title={`تحليل دوران المخزون (${data.length} صنف)`}
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
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{fastTurnoverItems}</div>
                        <div>أصناف سريعة الدوران</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{mediumTurnoverItems}</div>
                        <div>أصناف متوسطة الدوران</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>{slowTurnoverItems}</div>
                        <div>أصناف بطيئة الدوران</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>{stagnantItems}</div>
                        <div>أصناف راكدة</div>
                    </div>
                </div>
                <div style={{ marginTop: 15, textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        معدل الدوران الإجمالي: {overallTurnoverRatio.toFixed(2)} مرة في السنة
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
                    <li><strong>متوسط المخزون:</strong> القيمة المتوسطة للمخزون خلال الفترة</li>
                    <li><strong>تكلفة المبيعات السنوية:</strong> تكلفة البضائع المباعة خلال السنة</li>
                    <li><strong>معدل دوران المخزون:</strong> عدد مرات بيع المخزون كاملاً خلال السنة</li>
                    <li><strong>فترة التخزين بالأيام:</strong> الأيام اللازمة لبيع المخزون الحالي</li>
                    <li><strong>حركة آخر 90 يوم:</strong> الكمية المباعة خلال الثلاثة أشهر الأخيرة</li>
                    <li><strong>فئة الدوران:</strong> تصنيف سرعة دوران المخزون (سريع/متوسط/بطيء/راكد)</li>
                    <li><strong>مؤشر المخاطرة:</strong> درجة الخطورة (0-100) حيث 100 يعني أعلى خطورة</li>
                </ul>
                <p>
                    <strong>التوصيات:</strong>
                    <ul>
                        <li>الأصناف ذات الدوران السريع تحتاج إلى مراقبة مستمرة لتجنب نفادها</li>
                        <li>الأصناف ذات الدوران البطيء قد تحتاج إلى عروض ترويجية</li>
                        <li>الأصناف الراكدة قد تحتاج إلى مراجعة قرار الاستمرار في تخزينها</li>
                    </ul>
                </p>
            </div>
        </UnifiedPageLayout>
    );
};

export default InventoryTurnoverPage;