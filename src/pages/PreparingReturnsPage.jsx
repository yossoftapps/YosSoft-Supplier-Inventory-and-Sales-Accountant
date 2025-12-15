import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, Tag } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { formatQuantity, formatMoney } from '../utils/financialCalculations';

const { Title } = Typography;

const PreparingReturnsPage = ({ data, allData, allReportsData }) => {
  const [preparingReturnsData, setPreparingReturnsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create a map from excess inventory data for quick lookup
  const excessInventoryMap = useMemo(() => {
    const excessInventoryData = allData?.excessInventory || [];
    if (!excessInventoryData || excessInventoryData.length === 0) return new Map();
    
    const map = new Map();
    excessInventoryData.forEach(item => {
      map.set(item['رمز المادة'], item);
    });
    return map;
  }, [allData?.excessInventory]);

  useEffect(() => {
    // محاكاة تحميل البيانات
    const timer = setTimeout(() => {
      // Enrich the preparing returns data with sales information from excess inventory
      const enrichedData = (data || []).map(item => {
        const excessItem = excessInventoryMap.get(item['رمز المادة']);
        const salesQuantity = excessItem ? (excessItem['المبيعات'] || 0) : 0;
        
        return {
          ...item,
          'مبيعات الصنف': salesQuantity
        };
      });
      
      setPreparingReturnsData(enrichedData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [data, excessInventoryMap]);

  // تعريف أعمدة الجدول
  const columns = [
    {
      title: 'م',
      dataIndex: 'م',
      key: 'م',
      width: 60,
      align: 'center'
    },
    {
      title: 'رمز المادة',
      dataIndex: 'رمز المادة',
      key: 'رمز المادة',
      width: 120
    },
    {
      title: 'اسم المادة',
      dataIndex: 'اسم المادة',
      key: 'اسم المادة',
      width: 200,
      ellipsis: true
    },
    {
      title: 'الوحدة',
      dataIndex: 'الوحدة',
      key: 'الوحدة',
      width: 80,
      align: 'center'
    },
    {
      title: 'الكمية',
      dataIndex: 'الكمية',
      key: 'الكمية',
      width: 100,
      align: 'right',
      render: (text) => formatQuantity(text)
    },
    {
      title: 'الافرادي',
      dataIndex: 'الافرادي',
      key: 'الافرادي',
      width: 100,
      align: 'right',
      render: (text) => formatMoney(text)
    },
    {
      title: 'اجمالي الشراء',
      dataIndex: 'اجمالي الشراء',
      key: 'اجمالي الشراء',
      width: 120,
      align: 'right',
      render: (text) => formatMoney(text)
    },
    {
      title: 'تاريخ الصلاحية',
      dataIndex: 'تاريخ الصلاحية',
      key: 'تاريخ الصلاحية',
      width: 120,
      align: 'center'
    },
    {
      title: 'المورد',
      dataIndex: 'المورد',
      key: 'المورد',
      width: 150,
      ellipsis: true
    },
    {
      title: 'عمر الصنف',
      dataIndex: 'عمر الصنف',
      key: 'عمر الصنف',
      width: 100,
      align: 'center',
      render: (text) => `${text} يوم`
    },
    {
      title: 'مبيعات الصنف',
      dataIndex: 'مبيعات الصنف',
      key: 'مبيعات الصنف',
      width: 120,
      align: 'right',
      render: (text) => formatQuantity(text)
    },
    {
      title: 'بيان الصلاحية',
      dataIndex: 'بيان الصلاحية',
      key: 'بيان الصلاحية',
      width: 120,
      align: 'center',
      render: (text) => {
        let color = 'default';
        if (text === 'منتهي') color = 'red';
        else if (text === 'قريب جدا') color = 'orange';
        else if (text === 'قريب') color = 'gold';
        else if (text === 'بعيد') color = 'green';

        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'بيان الحركة',
      dataIndex: 'بيان الحركة',
      key: 'بيان الحركة',
      width: 120,
      align: 'center',
      render: (text) => {
        let color = 'default';
        if (text === 'راكد تماما') color = 'red';
        else if (text === 'مخزون زائد') color = 'orange';
        else if (text === 'احتياج') color = 'blue';

        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'البيان',
      dataIndex: 'البيان',
      key: 'البيان',
      width: 150,
      ellipsis: true
    }
  ];

  // حساب الإحصائيات
  const totalItems = preparingReturnsData.length;
  const totalQuantity = preparingReturnsData.reduce((sum, item) => sum + (parseFloat(item['الكمية']) || 0), 0);
  const totalValue = preparingReturnsData.reduce((sum, item) => sum + (parseFloat(item['اجمالي الشراء']) || 0), 0);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <FileTextOutlined style={{ marginRight: '8px' }} />
        تقرير تجهيز المرتجعات
      </Title>

      {/* بطاقات الإحصائيات */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="إجمالي الأصناف"
              value={totalItems}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="إجمالي الكمية"
              value={totalQuantity}
              prefix={<FileTextOutlined />}
              formatter={(value) => formatQuantity(value)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="إجمالي القيمة"
              value={totalValue}
              prefix={<FileTextOutlined />}
              formatter={(value) => formatMoney(value)}
            />
          </Card>
        </Col>
      </Row>

      {/* جدول البيانات */}
      <Card>
        <Table
          columns={columns}
          dataSource={preparingReturnsData}
          rowKey="م"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} من ${total} عنصر`,
            showQuickJumper: true
          }}
          scroll={{ x: 1500 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default PreparingReturnsPage;
