import React, { useState, useMemo, useRef } from 'react';
import { Typography, Table, Alert, Radio, Input, Button, Space, message } from 'antd';

const { Title } = Typography;

function NetPurchasesPage({ data }) {
    const [selectedTab, setSelectedTab] = useState('netPurchases');
    const [searchText, setSearchText] = useState('');
    const printRef = useRef();

    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message="لا توجد بيانات" description="يرجى استيراد ملف Excel أولاً لمعالجة البيانات." type="info" showIcon />
            </div>
        );
    }

    const handlePrint = () => {
        const printContent = printRef.current;
        const originalContents = document.body.innerHTML;
        
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    const handleExportCSV = () => {
        try {
            // تحديد البيانات المراد تصديرها حسب التبويب المحدد
            const exportData = selectedTab === 'netPurchases' ? filteredNetPurchases : filteredOrphanReturns;
            
            if (exportData.length === 0) {
                message.warning('لا توجد بيانات للتصدير');
                return;
            }

            // إنشاء محتوى CSV
            const headers = Object.keys(exportData[0]).join(',');
            const rows = exportData.map(row => 
                Object.values(row).map(value => 
                    typeof value === 'string' ? `"${value}"` : value
                ).join(',')
            ).join('\n');
            
            const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
            const encodedUri = encodeURI(csvContent);
            
            // إنشاء رابط التنزيل
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `تقرير_صافي_المشتريات_${selectedTab}_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            
            link.click();
            document.body.removeChild(link);
            
            message.success('تم تصدير البيانات بنجاح');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            message.error('حدث خطأ أثناء تصدير البيانات');
        }
    };

    // تصفية البيانات حسب نص البحث
    const filteredNetPurchases = useMemo(() => {
        if (!searchText) return data.netPurchasesList;
        return data.netPurchasesList.filter(item =>
            Object.values(item).some(value =>
                String(value).toLowerCase().includes(searchText.toLowerCase())
            )
        );
    }, [data.netPurchasesList, searchText]);

    const filteredOrphanReturns = useMemo(() => {
        if (!searchText) return data.orphanReturnsList;
        return data.orphanReturnsList.filter(item =>
            Object.values(item).some(value =>
                String(value).toLowerCase().includes(searchText.toLowerCase())
            )
        );
    }, [data.orphanReturnsList, searchText]);

    // تم تعريف الأعمدة بناءً على هيئة ورقة "المشتريات" مع إضافة الأعمدة المحدثة
    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        { title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)},
        { title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')},
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية', key: 'تاريخ العملية', width: 120 },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 120, align: 'center' },
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
        { title: 'كمية الجرد', dataIndex: 'كمية الجرد', key: 'كمية الجرد', width: 100, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)},
    ];

    return (
        <div style={{ padding: '20px' }} ref={printRef}>
            <Title level={4}>تقرير صافي المشتريات</Title>
            <p>عرض المشتريات بعد خصم المرتجعات المطابقة، والمرتجعات التي لم يتم مطابقتها، مع بيانات المطابقة مع الجرد الفعلي.</p>

            <Space style={{ marginBottom: 16 }}>
                <Input
                    placeholder="ابحث في البيانات..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                />
                <Button type="primary" onClick={handlePrint}>طباعة التقرير</Button>
                <Button onClick={handleExportCSV}>تصدير إلى CSV</Button>
            </Space>

            <Radio.Group value={selectedTab} onChange={(e) => setSelectedTab(e.target.value)} style={{ marginBottom: 16 }}>
                <Radio.Button value="netPurchases">قائمة أ: المشتريات الفعلية ({filteredNetPurchases.length})</Radio.Button>
                <Radio.Button value="orphanReturns">قائمة ب: المرتجعات اليتيمة ({filteredOrphanReturns.length})</Radio.Button>
            </Radio.Group>

            {selectedTab === 'netPurchases' && (
                <Table
                    title={() => <strong>قائمة أ: المشتريات الفعلية ({filteredNetPurchases.length} سجل)</strong>}
                    dataSource={filteredNetPurchases}
                    columns={columns}
                    rowKey="م"
                    scroll={{ x: 1400 }}
                    pagination={{ pageSize: 25 }}
                    summary={(pageData) => {
                        let totalQuantity = 0;
                        let totalInventoryQuantity = 0;

                        pageData.forEach((record) => {
                            totalQuantity += parseFloat(record['الكمية'] || 0);
                            totalInventoryQuantity += parseFloat(record['كمية الجرد'] || 0);
                        });

                        return (
                            <>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong>الإجمالي لهذه الصفحة</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong>{totalQuantity.toFixed(2)}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        <strong>{totalInventoryQuantity.toFixed(2)}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={6} colSpan={8}></Table.Summary.Cell>
                                </Table.Summary.Row>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={4}>
                                        <strong>الإجمالي الكلي</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <strong>
                                            {filteredNetPurchases.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0).toFixed(2)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>
                                        <strong>
                                            {filteredNetPurchases.reduce((sum, record) => sum + parseFloat(record['كمية الجرد'] || 0), 0).toFixed(2)}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={6} colSpan={8}></Table.Summary.Cell>
                                </Table.Summary.Row>
                            </>
                        );
                    }}
                />
            )}
            {selectedTab === 'orphanReturns' && (
                <Table
                    title={() => <strong>قائمة ب: المرتجعات اليتيمة ({filteredOrphanReturns.length} سجل)</strong>}
                    dataSource={filteredOrphanReturns}
                    columns={columns} // يمكن استخدام نفس الأعمدة، ستكون الحقول الإضافية فارغة
                    rowKey="م"
                    scroll={{ x: 1400 }}
                    pagination={{ pageSize: 25 }}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <strong>الإجمالي</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                                <strong>
                                    {filteredOrphanReturns.reduce((sum, record) => sum + parseFloat(record['الكمية'] || 0), 0).toFixed(2)}
                                </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={9}></Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            )}
        </div>
    );
}

export default NetPurchasesPage;