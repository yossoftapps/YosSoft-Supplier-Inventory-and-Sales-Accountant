import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Button } from 'antd';
import { 
  ShoppingCartOutlined, 
  DollarCircleOutlined, 
  DatabaseOutlined, 
  WarningOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import UnifiedCard from './UnifiedCard';
import '../assets/styles/unified-styles.css';

const DashboardWidgets = ({ 
  data = {}, 
  onRefresh,
  onConfigure 
}) => {
  const [loading, setLoading] = useState(false);

  // Calculate dashboard metrics
  const calculateMetrics = () => {
    if (!data) return {};
    
    // Net Purchases Summary
    const netPurchasesCount = data.netPurchasesList?.length || 0;
    const orphanReturnsCount = data.orphanReturnsList?.length || 0;
    
    // Inventory Summary
    const positiveInventoryCount = data.listE?.length || 0;
    const negativeOrExpiredCount = data.listF?.length || 0;
    
    // Sales Summary (assuming we have sales data somewhere)
    const salesCount = data.salesList?.length || 0;
    
    // Risk Indicators
    const riskItemsCount = data.riskItems?.length || 0;
    
    return {
      netPurchasesCount,
      orphanReturnsCount,
      positiveInventoryCount,
      negativeOrExpiredCount,
      salesCount,
      riskItemsCount
    };
  };

  const metrics = calculateMetrics();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-widgets">
      {/* Action Bar */}
      <div className="dashboard-action-bar" style={{ marginBottom: 24, textAlign: 'right' }}>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
          className="unified-secondary-button"
          style={{ marginLeft: 8 }}
        >
          تحديث
        </Button>
        <Button 
          icon={<SettingOutlined />} 
          onClick={onConfigure}
          className="unified-secondary-button"
        >
          إعدادات
        </Button>
      </div>

      {/* Metrics Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <UnifiedCard>
            <Statistic
              title="صافي المشتريات"
              value={metrics.netPurchasesCount}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <span>مرتجعات م orphan: {metrics.orphanReturnsCount}</span>
            </div>
          </UnifiedCard>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <UnifiedCard>
            <Statistic
              title="الجرد الفعلي"
              value={metrics.positiveInventoryCount}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <span>سالب أو منتهي: {metrics.negativeOrExpiredCount}</span>
            </div>
          </UnifiedCard>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <UnifiedCard>
            <Statistic
              title="المبيعات"
              value={metrics.salesCount}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={Math.min(100, (metrics.salesCount / Math.max(1, metrics.netPurchasesCount)) * 100)} 
                status="active" 
                strokeColor="#722ed1"
              />
            </div>
          </UnifiedCard>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <UnifiedCard>
            <Statistic
              title="عناصر المخاطر"
              value={metrics.riskItemsCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8 }}>
              <span>تتطلب انتباه فوري</span>
            </div>
          </UnifiedCard>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardWidgets;