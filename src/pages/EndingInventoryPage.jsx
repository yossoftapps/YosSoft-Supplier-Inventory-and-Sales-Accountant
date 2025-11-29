import React, { useState, useMemo, useRef } from 'react';
import { Typography, Table, Alert, Radio, Input, Button, Space, message } from 'antd';

const { Title } = Typography;

function EndingInventoryPage({ data }) {
    const [selectedTab, setSelectedTab] = useState('endingInventory');
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
            const exportData = selectedTab === 'endingInventory' ? filteredEndingInventory : filteredListB;
            
            if (exportData.length === 0) {
                message.warning('لا توجد بيانات للتصدير');
                return;
            }

            // إنشاء محتوى CSV
            const headers = Object.keys(exportData[0]).join(',');
            const rows = exportData.map(row => 
                Object.values(row).map(value => {
                    // التعامل مع القيم التي تحتوي على فواصل
                    const stringValue = String(value || '');
                    return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
                }).join(',')
            );
            
            const csvContent = [headers, ...rows].join('\n');
            
            // إنشاء ملف CSV وتنزيله
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `تقرير_الجرد_النهائي_${selectedTab}_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            message.success('تم تصدير البيانات بنجاح');
        } catch (error) {
            console.error('خطأ في تصدير CSV:', error);
            message.error('حدث خطأ أثناء تصدير البيانات');
        }
    };

    // تصفية البيانات حسب نص البحث
    const filteredEndingInventory = useMemo(() => {
        if (!searchText) return data.endingInventoryList;
        return data.endingInventoryList.filter(item =>
            Object.values(item).some(value =>
                String(value).toLowerCase().includes(searchText.toLowerCase())
            )
        );
    }, [data.endingInventoryList, searchText]);

    const filteredListB = useMemo(() => {
        if (!searchText) return data.listB;
        return data.listB.filter(item =>
            Object.values(item).some(value =>
                String(value).toLowerCase().includes(searchText.toLowerCase())
            )
        );
    }, [data.listB, searchText]);

    // تم تعريف الأعمدة بناءً على المخرجات النهائية للمنطق المحدث
    const columns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 60, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 120 },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120 },
        { title: 'القائمة', dataIndex: 'القائمة', key: 'القائمة', width: 80, align: 'center' },
        { title: 'رقم السجل', dataIndex: 'رقم السجل', key: 'رقم السجل', width: 100, align: 'center' },
        { title: 'ملاحظات', dataIndex: 'ملاحظات', key: 'ملاحظات', width: 100, align: 'center' },
        {
            title: 'كمية المشتريات', dataIndex: 'كمية المشتريات', key: 'كمية المشتريات', width: 120, align: 'left',
            render: (text) => (parseFloat(text) || 0).toFixed(2)
        },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 80, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
        { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء', key: 'تاريخ الشراء', width: 120 },
        { title: 'المورد', dataIndex: 'المورد', key: 'المورد' },
        { title: 'نوع العملية', dataIndex: 'نوع العملية', key: 'نوع العملية', width: 100, align: 'center' },
        { title: 'بيان الحركة', dataIndex: 'بيان الحركة', key: 'بيان الحركة', width: 100, align: 'center' },
        {
            title: 'الاجمالي', dataIndex: 'الاجمالي', key: 'الاجمالي', width: 100, align: 'left',
            render: (text) => (parseInt(text, 10) || 0).toLocaleString('ar-EG')
        },
    ];

    return (
        <div style={{ padding: '20px' }} ref={printRef}>
            <Title level={4}>تقرير المخزون النهائي</Title>
            <p>عرض نتيجة مطابقة الجرد الفعلي مع صافي المشتريات، مع إضافة المرتجعات اليتيمة.</p>

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
                <Radio.Button value="endingInventory">المخزون النهائي ({filteredEndingInventory.length})</Radio.Button>
                <Radio.Button value="listB">قائمة ب: مرتجع المشتريات اليتيمة ({filteredListB.length})</Radio.Button>
            </Radio.Group>

            {selectedTab === 'endingInventory' && (
                <Table
                    title={() => <strong>المخزون النهائي ({filteredEndingInventory.length} سجل)</strong>}
                    dataSource={filteredEndingInventory}
                    columns={columns}
                    rowKey="م"
                    scroll={{ x: 1800 }}
                    pagination={{ pageSize: 25 }}
                />
            )}
            {selectedTab === 'listB' && (
                <Table
                    title={() => <strong>قائمة ب: مرتجع المشتريات اليتيمة ({filteredListB.length} سجل)</strong>}
                    dataSource={filteredListB}
                    columns={columns} // يمكن استخدام نفس الأعمدة مع إخفاء بعضها إذا لزم الأمر
                    rowKey="م"
                    scroll={{ x: 1800 }}
                    pagination={{ pageSize: 25 }}
                />
            )}
        </div>
    );
}

export default EndingInventoryPage;