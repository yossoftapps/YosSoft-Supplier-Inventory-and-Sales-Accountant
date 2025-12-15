import React from 'react';
import { Tag, Table } from 'antd';
import { formatQuantity } from '../utils/financialCalculations';
import UnifiedPageLayout from '../components/UnifiedPageLayout';
import UnifiedTable from '../components/UnifiedTable';
import UnifiedAlert from '../components/UnifiedAlert';
import { useTranslation } from 'react-i18next';

const IdealReplenishmentPage = ({ data, allReportsData }) => {
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

    // Function to determine tag color based on status
    const getStatusColor = (status) => {
        switch (status) {
            case 'احتياج عاجل': return 'red';
            case 'احتياج قريب': return 'orange';
            case 'لا شراء': return 'green';
            case 'فائض كبير': return 'blue';
            default: return 'default';
        }
    };

    // Function to determine ABC classification color
    const getABColor = (classification) => {
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
            title: 'المورد', 
            dataIndex: 'المورد', 
            width: 150
        },
        { 
            title: 'متوسط الاستهلاك اليومي', 
            dataIndex: 'متوسط الاستهلاك اليومي', 
            width: 150,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'مخزون الأمان', 
            dataIndex: 'مخزون الأمان', 
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'نقطة إعادة الطلب', 
            dataIndex: 'نقطة إعادة الطلب', 
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'الكمية المثالية للشراء', 
            dataIndex: 'الكمية المثالية للشراء', 
            width: 150,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'الكمية الحالية', 
            dataIndex: 'الكمية الحالية', 
            width: 120,
            align: 'right',
            render: val => formatQuantity(val)
        },
        { 
            title: 'فجوة المخزون', 
            dataIndex: 'فجوة المخزون', 
            width: 120,
            align: 'right',
            render: val => (
                <strong style={{ color: val > 0 ? 'red' : val < 0 ? 'blue' : 'green' }}>
                    {formatQuantity(val)}
                </strong>
            )
        },
        { 
            title: 'الحالة', 
            dataIndex: 'الحالة', 
            width: 120,
            align: 'center',
            render: text => <Tag color={getStatusColor(text)}>{text}</Tag>
        },
        { 
            title: 'تاريخ أقرب صلاحية', 
            dataIndex: 'تاريخ أقرب صلاحية', 
            width: 150,
            align: 'center',
            render: date => date ? new Date(date).toLocaleDateString('ar-SA') : '-'
        },
        { 
            title: 'تصنيف ABC', 
            dataIndex: 'تصنيف ABC', 
            width: 100,
            align: 'center',
            render: text => <Tag color={getABColor(text)}>{text}</Tag>
        }
    ];

    // Calculate summary statistics
    const totalItems = data.length;
    const urgentNeeds = data.filter(item => item['الحالة'] === 'احتياج عاجل').length;
    const nearTermNeeds = data.filter(item => item['الحالة'] === 'احتياج قريب').length;
    const noActionNeeded = data.filter(item => item['الحالة'] === 'لا شراء').length;
    const excessItems = data.filter(item => item['الحالة'] === 'فائض كبير').length;
    
    const totalCurrentQuantity = data.reduce((sum, item) => sum + (parseFloat(item['الكمية الحالية']) || 0), 0);
    const totalIdealOrderQuantity = data.reduce((sum, item) => sum + (parseFloat(item['الكمية المثالية للشراء']) || 0), 0);
    const totalGap = data.reduce((sum, item) => sum + (parseFloat(item['فجوة المخزون']) || 0), 0);

    const tableSummary = (pageData) => {
        const pageCurrentQuantity = pageData.reduce((sum, item) => sum + (parseFloat(item['الكمية الحالية']) || 0), 0);
        const pageIdealOrderQuantity = pageData.reduce((sum, item) => sum + (parseFloat(item['الكمية المثالية للشراء']) || 0), 0);
        const pageGap = pageData.reduce((sum, item) => sum + (parseFloat(item['فجوة المخزون']) || 0), 0);
        
        return (
            <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={9} align="center">
                    <strong>إجمالي الصفحة</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                    <strong>{formatQuantity(pageCurrentQuantity)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                    <strong>{formatQuantity(pageGap)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} colSpan={3} align="center">
                    -
                </Table.Summary.Cell>
            </Table.Summary.Row>
        );
    };

    return (
        <UnifiedPageLayout
            title="فجوة الشراء المثالية"
            description="تحليل فجوة الشراء المثالية لتحديد متطلبات إعادة التزود"
            data={data}
            columns={columns}
            filename="ideal_replenishment_gap"
            allReportsData={allReportsData}
            reportKey="idealReplenishment"
        >
            <UnifiedTable
                dataSource={data}
                columns={columns}
                rowKey="م"
                title={`تحليل فجوة الشراء المثالية (${data.length} صنف)`}
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
                        <div>إجمالي الأصناف</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>{urgentNeeds}</div>
                        <div>احتياج عاجل</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>{nearTermNeeds}</div>
                        <div>احتياج قريب</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{noActionNeeded}</div>
                        <div>لا حاجة للشراء</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{excessItems}</div>
                        <div>فائض كبير</div>
                    </div>
                </div>
                <div style={{ marginTop: 15, textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        الفجوة الإجمالية: {formatQuantity(totalGap)}
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
                    <li><strong>متوسط الاستهلاك اليومي:</strong> متوسط الكمية المستهلكة يومياً</li>
                    <li><strong>مخزون الأمان:</strong> الكمية المحفوظة لمواجهة الطوارئ</li>
                    <li><strong>نقطة إعادة الطلب:</strong> المستوى الذي عنده يجب تقديم طلب شراء جديد</li>
                    <li><strong>الكمية المثالية للشراء:</strong> الكمية المثلى التي يجب شراؤها في كل طلب</li>
                    <li><strong>الكمية الحالية:</strong> الكمية الموجودة في المخزون حالياً</li>
                    <li><strong>فجوة المخزون:</strong> الفرق بين الكمية المثالية والكمية الحالية</li>
                    <li><strong>الحالة:</strong> تقييم الحالة (احتياج عاجل/احتياج قريب/لا شراء/فائض كبير)</li>
                    <li><strong>تاريخ أقرب صلاحية:</strong> تاريخ انتهاء صلاحية أقرب دفعة في المخزون</li>
                    <li><strong>تصنيف ABC:</strong> تصنيف الصنف حسب أهميته (A/B/C)</li>
                </ul>
                <p>
                    <strong>التوصيات:</strong>
                    <ul>
                        <li>الأصناف ذات الحاجة العاجلة تحتاج إلى طلب شراء فوري</li>
                        <li>الأصناف ذات الحاجة القريبة تحتاج إلى مراقبة أسبوعية</li>
                        <li>الأصناف ذات الفائض الكبير قد تحتاج إلى مراجعة قرار الشراء</li>
                    </ul>
                </p>
            </div>
        </UnifiedPageLayout>
    );
};

export default IdealReplenishmentPage;