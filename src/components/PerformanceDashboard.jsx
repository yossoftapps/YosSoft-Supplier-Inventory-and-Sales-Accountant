import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag } from 'antd';
import { MonitorOutlined, ClockCircleOutlined, DatabaseOutlined, ThunderboltOutlined } from '@ant-design/icons';

const PerformanceDashboard = ({ visible = true }) => {
  const [performanceData, setPerformanceData] = useState({
    memory: { used: 0, total: 0, limit: 0 },
    timing: { loadTime: 0, domInteractive: 0, domContentLoaded: 0 },
    fps: 60,
    renderCount: 0
  });

  const [recentActions, setRecentActions] = useState([
    { id: 1, action: 'تحميل البيانات', duration: '1.2s', status: 'success', timestamp: '10:30:15' },
    { id: 2, action: 'حساب التقارير', duration: '2.4s', status: 'success', timestamp: '10:30:18' },
    { id: 3, action: 'تصدير Excel', duration: '5.1s', status: 'success', timestamp: '10:30:25' },
    { id: 4, action: 'تحديث الجدول', duration: '0.8s', status: 'success', timestamp: '10:30:30' },
  ]);

  useEffect(() => {
    if (!visible) return;

    const updatePerformanceData = () => {
      // Update memory information if available
      if (performance.memory) {
        setPerformanceData(prev => ({
          ...prev,
          memory: {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
          }
        }));
      }

      // Update timing information
      if (performance.timing) {
        setPerformanceData(prev => ({
          ...prev,
          timing: {
            loadTime: Math.round((performance.timing.loadEventEnd - performance.timing.navigationStart) / 1000),
            domInteractive: Math.round((performance.timing.domInteractive - performance.timing.navigationStart) / 10),
            domContentLoaded: Math.round((performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart) / 10)
          }
        }));
      }

      // Update render count
      setPerformanceData(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1
      }));
    };

    // Update performance data periodically
    updatePerformanceData();
    const interval = setInterval(updatePerformanceData, 5000);

    return () => clearInterval(interval);
  }, [visible]);

  // Calculate memory usage percentage
  const memoryUsagePercent = performanceData.memory.limit 
    ? Math.round((performanceData.memory.used / performanceData.memory.limit) * 100) 
    : 0;

  // Performance metrics columns
  const columns = [
    {
      title: 'الإجراء',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'المدة',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : status === 'warning' ? 'orange' : 'red'}>
          {status === 'success' ? 'ناجح' : status === 'warning' ? 'تحذير' : 'خطأ'}
        </Tag>
      ),
    },
    {
      title: 'الوقت',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
  ];

  if (!visible) {
    return null;
  }

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>
        <MonitorOutlined /> لوحة مراقبة الأداء
      </h3>
      
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="استخدام الذاكرة"
              value={performanceData.memory.used}
              suffix="MB"
              prefix={<DatabaseOutlined />}
            />
            <Progress percent={memoryUsagePercent} size="small" status={memoryUsagePercent > 80 ? 'exception' : 'normal'} />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              الحد: {performanceData.memory.limit} MB
            </div>
          </Card>
        </Col>
        
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="وقت التحميل"
              value={performanceData.timing.loadTime}
              suffix="ث"
              prefix={<ClockCircleOutlined />}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              DOM: {performanceData.timing.domContentLoaded} دسم
            </div>
          </Card>
        </Col>
        
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="عدد التصيير"
              value={performanceData.renderCount}
              prefix={<ThunderboltOutlined />}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              التحديث كل 5 ثواني
            </div>
          </Card>
        </Col>
        
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="استجابة النظام"
              value={performanceData.fps}
              suffix="FPS"
              prefix={<ThunderboltOutlined />}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              الهدف: &gt; 30 FPS
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="سجل الأداء الأخير" size="small">
        <Table 
          dataSource={recentActions} 
          columns={columns} 
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default PerformanceDashboard;