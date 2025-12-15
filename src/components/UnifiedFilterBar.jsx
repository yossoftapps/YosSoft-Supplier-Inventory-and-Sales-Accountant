import React, { useState } from 'react';
import { Input, Select, Button, Row, Col, Space, Tag } from 'antd';
import { SearchOutlined, ClearOutlined, CloseOutlined } from '@ant-design/icons';

const { Option } = Select;

const UnifiedFilterBar = ({
    data = {},
    onFilterChange,
    dataType = 'default',
    style = { marginBottom: 24, padding: '16px', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }
}) => {
    const [localFilters, setLocalFilters] = useState({});

    // Get unique values for select fields based on data type
    const getUniqueValues = (fieldName) => {
        if (!data) return [];

        let dataList = [];
        // Data Structure Handling based on page types
        if (dataType === 'purchases' && data.netPurchasesList) {
            dataList = [...(data.netPurchasesList || []), ...(data.orphanReturnsList || [])];
        } else if (dataType === 'sales' && data.netSalesList) {
            dataList = [...(data.netSalesList || []), ...(data.orphanReturnsList || [])];
        } else if (data.listE && data.listF) { /* Excess or Physical Inventory variations */
            dataList = [...(data.listE || []), ...(data.listF || [])];
        } else if (Array.isArray(data)) {
            dataList = data;
        } else {
            // Try to find any array property
            const arrayProps = Object.values(data).filter(Array.isArray);
            if (arrayProps.length > 0) {
                dataList = arrayProps[0];
            }
        }

        if (!dataList.length) return [];

        const uniqueValues = [...new Set(dataList.map(item => item[fieldName]).filter(Boolean))];
        return uniqueValues.slice(0, 100); // Limit to 100 options for performance
    };

    const handleFilterChange = (field, value) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);
        onFilterChange && onFilterChange(newFilters);
    };

    const clearFilters = () => {
        setLocalFilters({});
        onFilterChange && onFilterChange({});
    };

    // Remove a specific filter
    const removeFilter = (field) => {
        const newFilters = { ...localFilters };
        delete newFilters[field];
        setLocalFilters(newFilters);
        onFilterChange && onFilterChange(newFilters);
    };

    // Get filter fields based on data type
    const getFilterFields = () => {
        switch (dataType) {
            case 'purchases':
                return [
                    { key: 'materialCode', label: 'رمز المادة', type: 'text' },
                    { key: 'materialName', label: 'اسم المادة', type: 'text' },
                    { key: 'supplier', label: 'المورد', type: 'select', options: getUniqueValues('المورد') },
                    { key: 'unit', label: 'الوحدة', type: 'select', options: getUniqueValues('الوحدة') }
                ];
            case 'sales':
                return [
                    { key: 'materialCode', label: 'رمز المادة', type: 'text' },
                    { key: 'materialName', label: 'اسم المادة', type: 'text' },
                    { key: 'unit', label: 'الوحدة', type: 'select', options: getUniqueValues('الوحدة') }
                ];
            case 'suppliers':
                return [
                    { key: 'supplier', label: 'المورد', type: 'select', options: getUniqueValues('المورد') },
                    { key: 'accountCode', label: 'رمز الحساب', type: 'text' },
                    { key: 'subAccount', label: 'الحساب المساعد', type: 'select', options: getUniqueValues('الحساب المساعد') }
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
                    { key: 'supplier', label: 'المورد', type: 'select', options: getUniqueValues('المورد') },
                    { key: 'unit', label: 'الوحدة', type: 'select', options: getUniqueValues('الوحدة') }
                ];
            default:
                return [
                    { key: 'materialCode', label: 'رمز المادة', type: 'text' },
                    { key: 'materialName', label: 'اسم المادة', type: 'text' }
                ];
        }
    };

    const filterFields = getFilterFields();

    // Get active filters as tags
    const getActiveFilters = () => {
        return Object.entries(localFilters)
            .filter(([key, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => {
                const field = filterFields.find(f => f.key === key);
                const label = field ? field.label : key;
                return { key, label, value };
            });
    };

    const activeFilters = getActiveFilters();

    return (
        <div style={style} className="unified-filter-bar">
            <Row gutter={[16, 16]} align="middle">
                {/* Smart Search Field */}
                <Col xs={24} md={8}>
                    <Input
                        placeholder="بحث ذكي في كل الحقول..."
                        value={localFilters['smartSearch']}
                        onChange={(e) => handleFilterChange('smartSearch', e.target.value)}
                        prefix={<SearchOutlined style={{ color: '#2563eb', fontSize: '18px' }} />}
                        className="unified-input"
                        style={{ borderRadius: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                        allowClear
                    />
                </Col>
                {filterFields.map(field => (
                    <Col key={field.key} xs={24} sm={12} md={6}>
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
                                allowClear
                            />
                        )}
                    </Col>
                ))}
                <Col xs={24} sm={12} md={6}>
                    <Space>
                        <Button
                            icon={<ClearOutlined />}
                            onClick={clearFilters}
                            className="unified-button-secondary"
                        >
                            مسح الفلاتر
                        </Button>
                    </Space>
                </Col>
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