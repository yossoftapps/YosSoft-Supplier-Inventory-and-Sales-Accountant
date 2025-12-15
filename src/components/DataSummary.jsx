import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { formatQuantity, formatMoney } from '../utils/financialCalculations';

const DataSummary = ({ 
  title, 
  data = [],
  fields = [],
  style = {}
}) => {
  // Calculate totals for each field
  const totals = fields.map(field => {
    const total = data.reduce((sum, record) => {
      const value = parseFloat(record[field.dataIndex] || 0);
      return sum + value;
    }, 0);
    return { ...field, total };
  });

  return (
    <Card 
      title={title} 
      style={{ 
        marginBottom: 24,
        ...style
      }}
      className="standard-card"
    >
      <Row gutter={[16, 16]}>
        {totals.map((field, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title={field.title}
              value={field.total}
              formatter={field.type === 'money' ? formatMoney : formatQuantity}
              precision={field.type === 'money' ? 0 : 2}
            />
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default DataSummary;