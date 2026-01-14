import React, { useState, useMemo } from 'react';
import { Typography, Select, Card, Row, Col, Table, Alert } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations.js';

const { Title } = Typography;
const { Option } = Select;

function SupplierMovementPage({ data }) {
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // 1. إنشاء قائمة فريدة من اسماء الموردين للقائمة المنسدلة
    const supplierOptions = useMemo(() => {
        if (!data?.suppliersPayables) return [];
        const uniqueSuppliers = [...new Set(data.suppliersPayables.map(item => item['المورد']))];
        return uniqueSuppliers.map(supplier => ({ value: supplier, label: supplier }));
    }, [data?.suppliersPayables]);

    // 2. العثور على بيانات المورد المحدد من تقرير استحقاق الموردين
    const selectedSupplierPayable = useMemo(() => {
        if (!selectedSupplier || !data?.suppliersPayables) return null;
        return data.suppliersPayables.find(item => item['المورد'] === selectedSupplier);
    }, [selectedSupplier, data?.suppliersPayables]);

    // 3. تصفية قائمة المخزون النهائي للمورد المحدد
    const supplierInventory = useMemo(() => {
        if (!selectedSupplier || !data?.endingInventoryList) return [];
        return data.endingInventoryList.filter(item => item['المورد'] === selectedSupplier);
    }, [selectedSupplier, data?.endingInventoryList]);

    // 4. إنشاء خريطة لمبيعات كل صنف (للوصول السريع)
    const salesMap = useMemo(() => {
        if (!data?.excessInventory) return new Map();
        return new Map(data.excessInventory.map(item => [item['رمز المادة'], item['المبيعات']]));
    }, [data?.excessInventory]);

    // 5. إعداد البيانات لجداول التفاصيل مع حساب الحقول الإضافية
    const detailedInventoryData = useMemo(() => {
        return supplierInventory.map(item => {
            const purchaseDate = new Date(item['تاريخ الشراء']);
            const today = new Date();
            const ageInDays = item['تاريخ الشراء'] ? Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24)) : 0;
            const salesForItem = salesMap.get(item['رمز المادة']) || 0;

            return {
                ...item,
                'عمر الصنف': ageInDays,
                'مبيعات الصنف': salesForItem,
            };
        });
    }, [supplierInventory, salesMap]);

    // 6. تصفية الاصناف المعدة للارجاع
    const returnableInventoryData = useMemo(() => {
        return detailedInventoryData.filter(item => item['بيان الحركة'] === 'راكد تماما' || item['بيان الحركة'] === 'مخزون زائد' || item['بيان الصلاحية'] === 'منتهي' || item['بيان الصلاحية'] === 'قريب جدا');
    }, [detailedInventoryData]);


    // تعريف اعمدة جداول التفاصيل
    const detailColumns = [
        { title: 'م', dataIndex: 'م', key: 'م', width: 50, align: 'center' },
        { title: 'رمز المادة', dataIndex: 'رمز المادة', key: 'رمز المادة', width: 100, align: 'center' },
        { title: 'اسم المادة', dataIndex: 'اسم المادة', key: 'اسم المادة', width: 180, align: 'left' },
        { title: 'الوحدة', dataIndex: 'الوحدة', key: 'الوحدة', width: 80, align: 'center' },
        {
            title: 'الكمية', dataIndex: 'الكمية', key: 'الكمية', width: 100, align: 'center',
            render: (text) => formatQuantity(text)
        },
        {
            title: 'الافرادي', dataIndex: 'الافرادي', key: 'الافرادي', width: 100, align: 'center',
            render: (text) => formatMoney(text)
        },
        {
            title: 'اجمالي الشراء', dataIndex: 'الاجمالي', key: 'الاجمالي', width: 100, align: 'center',
            render: (text) => formatMoney(text)
        },
        { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية', key: 'تاريخ الصلاحية', width: 120, align: 'center' },
        { title: 'عمر الصنف', dataIndex: 'عمر الصنف', key: 'عمر الصنف', width: 80, align: 'center' },
        {
            title: 'مبيعات الصنف', dataIndex: 'مبيعات الصنف', key: 'مبيعات الصنف', width: 100, align: 'center',
            render: (text) => formatQuantity(text)
        },
        { title: 'بيان الصلاحية', dataIndex: 'بيان الصلاحية', key: 'بيان الصلاحية', width: 120, align: 'right' },
        { title: 'بيان الحركة', dataIndex: 'بيان الحركة', key: 'بيان الحركة', width: 120, align: 'right' },
        { title: 'البيان', dataIndex: 'البيان', key: 'البيان', width: 120, align: 'right' },
    ];

    if (!data) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert message="لا توجد بيانات" description="يرجى استيراد ملف Excel اولاً لمعالجة البيانات." type="info" showIcon />
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>تقرير حركة مورد</Title>
            <p>اختر موردًا لعرض تفاصيل الاصناف والإجماليات الخاصة به.</p>

            <Select
                showSearch
                style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}
                placeholder="ابحث واختر اسم المورد"
                optionFilterProp="children"
                onChange={setSelectedSupplier}
                filterOption={(input, option) => {
                    // option.children may be a React node/object in some environments - coerce safely to string
                    const childText = option && option.children ? (typeof option.children === 'string' ? option.children : String(option.children)) : '';
                    return childText.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                }}
            >
                {supplierOptions.map(supplier => (
                    <Option key={supplier.value} value={supplier.value}>
                        {supplier.label}
                    </Option>
                ))}
            </Select>

            {selectedSupplier && selectedSupplierPayable && (
                <>
                    {/* القسم الاول: الاجماليات */}
                    <Card title="تقرير اجمالي المورد" style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col span={4}><strong>رصيد المورد:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['الرصيد'] || 0))}</Col>

                            <Col span={4}><strong>قيمة المخزون:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['قيمة المخزون'] || 0))}</Col>

                            <Col span={4}><strong>الاستحقاق:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['الاستحقاق'] || 0))}</Col>
                        </Row>
                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={4}><strong>المبلغ المستحق:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['المبلغ المستحق'] || 0))}</Col>

                            <Col span={4}><strong>قيمة المخزون الراكد:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['راكد تماما'] || 0))}</Col>

                            <Col span={4}><strong>قيمة المخزون الزائد:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['مخزون زائد'] || 0))}</Col>
                        </Row>
                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={4}><strong>قيمة الاحتياج:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['الاحتياج'] || 0))}</Col>

                            <Col span={4}><strong>قيمة المعد للارجاع:</strong></Col>
                            <Col span={4}>{formatMoney(parseInt(selectedSupplierPayable['معد للارجاع'] || 0))}</Col>
                        </Row>
                    </Card>

                    {/* القسم الثاني: تفاصيل الاصناف */}
                    <Card title={`تقرير مخزون مورد (${detailedInventoryData.length} صنف)`} style={{ marginBottom: 24 }}>
                        <Table
                            dataSource={detailedInventoryData}
                            columns={detailColumns}
                            rowKey={(record) => String(record['م'] || '')}
                            scroll={{ x: 1800 }}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>

                    {/* القسم الثالث: تفاصيل الاصناف المعدة للارجاع */}
                    <Card title={`تقرير مخزون مورد معد للارجاع (${returnableInventoryData.length} صنف)`}>
                        <Table
                            dataSource={returnableInventoryData}
                            columns={detailColumns}
                            rowKey="م"
                            scroll={{ x: 1800 }}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </>
            )}
        </div>
    );
}

export default SupplierMovementPage;