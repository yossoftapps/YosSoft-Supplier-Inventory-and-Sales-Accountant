import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag, Divider, Progress, Button } from 'antd';
import { DashboardOutlined, DatabaseOutlined, RocketOutlined, EyeOutlined } from '@ant-design/icons';
import PerformanceDashboard from './PerformanceDashboard';

const { Title, Text } = Typography;

const PerformanceMonitor = ({ visible }) => {
    const [memory, setMemory] = useState(null);
    const [fps, setFps] = useState(0);
    const [showDetailedDashboard, setShowDetailedDashboard] = useState(false);

    useEffect(() => {
        if (!visible) return;

        let frameCount = 0;
        let lastTime = performance.now();
        let frameId;

        const updateFPS = () => {
            frameCount++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                setFps(frameCount);
                frameCount = 0;
                lastTime = now;
            }
            frameId = requestAnimationFrame(updateFPS);
        };

        updateFPS();

        const memInterval = setInterval(() => {
            if (window.performance && window.performance.memory) {
                setMemory({
                    used: (window.performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1),
                    total: (window.performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1),
                    limit: (window.performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1),
                });
            }
        }, 1000);

        return () => {
            cancelAnimationFrame(frameId);
            clearInterval(memInterval);
        };
    }, [visible]);

    if (!visible) return null;

    const memoryPercent = memory ? (memory.used / memory.total * 100).toFixed(0) : 0;
    const memoryColor = memoryPercent > 80 ? '#f5222d' : (memoryPercent > 50 ? '#faad14' : '#52c41a');

    return (
        <>
            <Card
                style={{
                    position: 'fixed',
                    top: 80,
                    right: 20,
                    zIndex: 9999,
                    width: 300,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid #d9d9d9',
                    background: 'rgba(255, 255, 255, 0.95)'
                }}
                size="small"
                title={
                    <Space>
                        <DashboardOutlined />
                        <span>مراقب الأداء (Performance Monitor)</span>
                    </Space>
                }
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>معدل الإطارات (FPS):</Text>
                        <Tag color={fps > 50 ? 'success' : 'warning'}>{fps} FPS</Tag>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text strong><DatabaseOutlined /> استخدام الذاكرة (Memory):</Text>
                            <Text type="secondary">{memory ? `${memory.used} MB` : 'غير متاح'}</Text>
                        </div>
                        {memory && (
                            <>
                                <Progress
                                    percent={memoryPercent}
                                    strokeColor={memoryColor}
                                    size="small"
                                    status={memoryPercent > 80 ? 'exception' : 'active'}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    <Text style={{ fontSize: '10px' }}>الإجمالي: {memory.total} MB</Text>
                                    <Text style={{ fontSize: '10px' }}>الحد الأقصى: {memory.limit} MB</Text>
                                </div>
                            </>
                        )}
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RocketOutlined style={{ color: '#1890ff' }} />
                        <Text italic style={{ fontSize: '11px' }}>تم تفعيل تحسينات Lazy Loading والـ Async Processing.</Text>
                    </div>
                    
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => setShowDetailedDashboard(!showDetailedDashboard)}
                    >
                        {showDetailedDashboard ? 'إخفاء' : 'عرض'} لوحة الأداء التفصيلية
                    </Button>
                </Space>
            </Card>
            
            {showDetailedDashboard && <PerformanceDashboard visible={true} />}
        </>
    );
};

export default PerformanceMonitor;