import React, { useState, useMemo } from 'react';
import { Input, Select, Button, Row, Col, Space, Tag } from 'antd';
import { SearchOutlined, ClearOutlined, CloseOutlined } from '@ant-design/icons';

const { Option } = Select;

const UnifiedFilterBar = ({
    data = {},
    onFilterChange,
    dataType = 'default',
    style = { marginBottom: 12, padding: '8px 16px', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }
}) => {
    const [localFilters, setLocalFilters] = useState({});

    // قيم فريدة محفوظه للحقول المحددة لمنع عمليات إعادة الحساب الباهظة الثمن في كل عرض
    const uniqueValuesCache = useMemo(() => {
        const cache = {};
        const getValues = (fieldName) => {
            if (!data) return [];
            let dataList = [];
            if (dataType === 'purchases' && data.netPurchasesList) {
                dataList = [...(data.netPurchasesList || []), ...(data.orphanReturnsList || [])];
            } else if (dataType === 'sales' && data.netSalesList) {
                dataList = [...(data.netSalesList || []), ...(data.orphanReturnsList || [])];
            } else if (data.listE && data.listF) {
                dataList = [...(data.listE || []), ...(data.listF || [])];
            } else if (Array.isArray(data)) {
                dataList = data;
            } else {
                const arrayProps = Object.values(data).filter(Array.isArray);
                if (arrayProps.length > 0) dataList = arrayProps[0];
            }
            if (!dataList.length) return [];
            return [...new Set(dataList.map(item => item[fieldName]).filter(Boolean))].slice(0, 100);
        };

        // حساب الحقول المشتركة مسبقًا بناءً على نوع البيانات
        if (dataType === 'purchases' || dataType === 'inventory' || dataType === 'endingInventory') {
            cache.supplier = getValues('المورد');
        } else if (dataType === 'suppliers') {
            cache.supplier = getValues('المورد');
            cache.subAccount = getValues('الحساب المساعد');
        }
        return cache;
    }, [data, dataType]);

    const handleFilterChange = (field, value) => {
        const newFilters = { ...localFilters, [field]: value };

        setLocalFilters(newFilters);
        onFilterChange && onFilterChange(newFilters);
    };

    const clearFilters = () => {
        setLocalFilters({});
        onFilterChange && onFilterChange({});
    };

    const removeFilter = (field) => {
        const newFilters = { ...localFilters };
        delete newFilters[field];
        setLocalFilters(newFilters);
        onFilterChange && onFilterChange(newFilters);
    };

    const getFieldSpan = (key) => {
        const spans = {
            'materialCode': 3,
            'materialName': 11,
            'supplier': 5,
            'abcClassification': 4,
            'accountCode': 4,
            'subAccount': 4
        };
        return spans[key] || 4;
    };

    // حفظ تكوين حقول التصفية
    const filterFields = useMemo(() => {
        switch (dataType) {
            case 'purchases':
                return [
                    { key: 'materialCode', label: 'رمز المادة', type: 'text' },
                    { key: 'materialName', label: 'اسم المادة', type: 'text' },
                    { key: 'supplier', label: 'المورد', type: 'select', options: uniqueValuesCache.supplier || [] }
                ];
            case 'sales':
                return [
                    { key: 'materialCode', label: 'رمز المادة', type: 'text' },
                    { key: 'materialName', label: 'اسم المادة', type: 'text' }
                ];
            case 'suppliers':
                return [
                    { key: 'supplier', label: 'المورد', type: 'select', options: uniqueValuesCache.supplier || [] },
                    { key: 'accountCode', label: 'رمز الحساب', type: 'text' },
                    { key: 'subAccount', label: 'الحساب المساعد', type: 'select', options: uniqueValuesCache.subAccount || [] }
                ];
            case 'inventoryABC':
                return [
                    { key: 'materialCode', label: 'رمز المادة', type: 'text' },
                    { key: 'materialName', label: 'اسم المادة', type: 'text' },
                    { key: 'abcClassification', label: 'التصنيف ABC', type: 'select', options: ['A', 'B', 'C'] }
                ];
            case 'inventory':
            case 'endingInventory':
                return [
                    { key: 'materialCode', label: 'رمز المادة', type: 'text' },
                    { key: 'materialName', label: 'اسم المادة', type: 'text' },
                    { key: 'supplier', label: 'المورد', type: 'select', options: uniqueValuesCache.supplier || [] }
                ];
            default:
                return [
                    { key: 'materialCode', label: 'رمز المادة', type: 'text' },
                    { key: 'materialName', label: 'اسم المادة', type: 'text' }
                ];
        }
    }, [dataType, uniqueValuesCache]);

    // حفظ علامات المرشحات النشطة
    const activeFilters = useMemo(() => {
        return Object.entries(localFilters)
            .filter(([key, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => {
                const field = filterFields.find(f => f.key === key);
                const label = field ? field.label : key;
                return { key, label, value };
            });
    }, [localFilters, filterFields]);

    return (
        <div style={{ ...style, width: '100%', maxWidth: 'none' }} className="unified-filter-bar">
            <Row gutter={[12, 12]} align="middle" style={{ width: '100%', margin: 0 }}>
                {/* Smart Search Field */}
                <Col xs={24} lg={5}>
                    <Input
                        placeholder="بحث ذكي شامل..."
                        value={localFilters['smartSearch']}
                        onChange={(e) => {
                            // Apply smart search across all text fields
                            handleFilterChange('smartSearch', e.target.value);
                        }}
                        prefix={<SearchOutlined style={{ color: '#2563eb', fontSize: '18px' }} />}
                        className="unified-input"
                        style={{ borderRadius: '24px', width: '100%' }}
                        allowClear
                    />
                </Col>
                {filterFields.map(field => (
                    <Col key={field.key} xs={24} sm={12} lg={getFieldSpan(field.key)}>
                        {field.type === 'select' ? (
                            <Select
                                showSearch
                                placeholder={field.label}
                                value={localFilters[field.key]}
                                onChange={(value) => handleFilterChange(field.key, value)}
                                style={{ width: '100%' }}
                                allowClear
                                className="unified-select"
                                classNames={{ popup: { root: "unified-select-dropdown" } }}
                            >
                                {field.options.map(option => (
                                    <Option key={option} value={option}>{option}</Option>
                                ))}
                            </Select>
                        ) : (
                            <Input
                                placeholder={field.label}
                                value={localFilters[field.key]}
                                onChange={(e) => handleFilterChange(field.key, e.target.value)}
                                prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
                                className="unified-input"
                                style={{ width: '100%' }}
                                allowClear
                            />
                        )}
                    </Col>
                ))}

            </Row>

            {/* Active Filters Tags */}
            {activeFilters.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {activeFilters.map(filter => (
                        <Tag
                            key={filter.key}
                            closable
                            onClose={() => removeFilter(filter.key)}
                            closeIcon={<CloseOutlined />}
                            style={{
                                backgroundColor: '#eef4ff',
                                borderColor: '#d0ddf7',
                                color: '#2563eb',
                                fontWeight: 500,
                                fontSize: '13px',
                                padding: '4px 12px'
                            }}
                        >
                            {filter.label}: {filter.value.toString()}
                        </Tag>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UnifiedFilterBar;