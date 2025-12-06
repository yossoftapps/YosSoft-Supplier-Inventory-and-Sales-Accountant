/**
 * مكون مؤشر التقدم المتقدم
 * Advanced Progress Indicator Component
 * 
 * يعرض معلومات تفصيلية عن تقدم معالجة البيانات
 * Shows detailed information about data processing progress
 */

import React from 'react';
import { Progress, Card, Statistic, Row, Col, Space, Typography, Button } from 'antd';
import {
    ClockCircleOutlined,
    ThunderboltOutlined,
    DatabaseOutlined,
    CheckCircleOutlined,
    StopOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * مكون مؤشر التقدم التفصيلي
 * Detailed Progress Indicator
 */
export const DetailedProgressIndicator = ({
    progress,
    stage,
    onCancel,
    showCancel = true
}) => {
    if (!progress) return null;

    // تنسيق الوقت
    const formatTime = (ms) => {
        if (!ms) return '0s';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    };

    // تحديد نوع مؤشر التقدم حسب النسبة
    const getProgressStatus = (percent) => {
        if (percent >= 100) return 'success';
        if (percent >= 75) return 'active';
        if (percent >= 50) return 'active';
        if (percent >= 25) return 'active';
        return 'active';
    };

    // تحديد لون مؤشر التقدم
    const getProgressColor = (percent) => {
        if (percent >= 100) return '#52c41a';  // أخضر
        if (percent >= 75) return '#1890ff';   // أزرق
        if (percent >= 50) return '#faad14';   // برتقالي
        return '#ff4d4f';  // أحمر
    };

    const stageNames = {
        'building_indexes': 'بناء الفهارس',
        'processing_returns': 'معالجة المرتجعات',
        'processing_sales': 'معالجة المبيعات',
        'processing_inventory': 'معالجة المخزون',
        'finalizing': 'الإنهاء',
        'complete': 'مكتمل'
    };

    return (
        <Card
            title={
                <Space>
                    <DatabaseOutlined />
                    <Text strong>{stageNames[stage] || 'جاري المعالجة...'}</Text>
                </Space>
            }
            style={{ marginTop: 16 }}
            extra={
                showCancel && onCancel && parseFloat(progress.percent) < 100 && (
                    <Button
                        danger
                        size="small"
                        icon={<StopOutlined />}
                        onClick={onCancel}
                    >
                        إلغاء
                    </Button>
                )
            }
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* شريط التقدم الرئيسي */}
                <div>
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>التقدم الكلي</Text>
                        <Text strong style={{ color: getProgressColor(parseFloat(progress.percent)) }}>
                            {progress.percent}%
                        </Text>
                    </div>
                    <Progress
                        percent={parseFloat(progress.percent)}
                        status={getProgressStatus(parseFloat(progress.percent))}
                        strokeColor={getProgressColor(parseFloat(progress.percent))}
                        strokeWidth={12}
                        showInfo={false}
                    />
                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {progress.processedRecords?.toLocaleString()} / {progress.totalRecords?.toLocaleString()} سجل
                        </Text>
                        {progress.currentBatch && progress.totalBatches && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                الدفعة {progress.currentBatch} / {progress.totalBatches}
                            </Text>
                        )}
                    </div>
                </div>

                {/* الإحصائيات */}
                <Row gutter={16}>
                    {/* الوقت المستغرق */}
                    <Col span={8}>
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f2f5' }}>
                            <Statistic
                                title={<Text style={{ fontSize: 12 }}>الوقت المستغرق</Text>}
                                value={formatTime(parseInt(progress.elapsedTime))}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ fontSize: 16, color: '#1890ff' }}
                            />
                        </Card>
                    </Col>

                    {/* الوقت المتبقي */}
                    <Col span={8}>
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f2f5' }}>
                            <Statistic
                                title={<Text style={{ fontSize: 12 }}>الوقت المتبقي</Text>}
                                value={formatTime(parseInt(progress.remainingTime))}
                                prefix={<ClockCircleOutlined style={{ transform: 'rotate(180deg)' }} />}
                                valueStyle={{ fontSize: 16, color: '#faad14' }}
                            />
                        </Card>
                    </Col>

                    {/* معدل المعالجة */}
                    <Col span={8}>
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f2f5' }}>
                            <Statistic
                                title={<Text style={{ fontSize: 12 }}>سجل/ثانية</Text>}
                                value={parseInt(progress.throughput)?.toLocaleString()}
                                prefix={<ThunderboltOutlined />}
                                valueStyle={{ fontSize: 16, color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* معلومات إضافية */}
                {progress.errorsCount > 0 && (
                    <div style={{ padding: 8, backgroundColor: '#fff1f0', borderRadius: 4, border: '1px solid #ffa39e' }}>
                        <Text type="danger">
                            ⚠️ عدد الأخطاء: {progress.errorsCount}
                        </Text>
                    </div>
                )}

                {parseFloat(progress.percent) >= 100 && (
                    <div style={{
                        padding: 12,
                        backgroundColor: '#f6ffed',
                        borderRadius: 4,
                        border: '1px solid #b7eb8f',
                        textAlign: 'center'
                    }}>
                        <Space>
                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                            <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                                تمت المعالجة بنجاح!
                            </Text>
                        </Space>
                    </div>
                )}
            </Space>
        </Card>
    );
};

/**
 * مكون مؤشر تقدم مبسط
 * Simple Progress Indicator
 */
export const SimpleProgressIndicator = ({ progress, title = 'جاري التحميل...' }) => {
    if (!progress) return null;

    return (
        <div style={{ padding: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {title}
            </Text>
            <Progress
                percent={parseFloat(progress.percent)}
                status={parseFloat(progress.percent) >= 100 ? 'success' : 'active'}
            />
            <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                    {progress.processedRecords?.toLocaleString()} / {progress.totalRecords?.toLocaleString()} سجل
                </Text>
            </div>
        </div>
    );
};

/**
 * مكون مؤشر تقدم متعدد المراحل
 * Multi-Stage Progress Indicator
 */
export const MultiStageProgressIndicator = ({
    stages = [],
    currentStage = 0,
    stageProgress = null
}) => {
    const stageColors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

    return (
        <Card title="مراحل المعالجة">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {stages.map((stage, index) => {
                    const isActive = index === currentStage;
                    const isCompleted = index < currentStage;
                    const percent = isActive && stageProgress ? parseFloat(stageProgress.percent) : (isCompleted ? 100 : 0);

                    return (
                        <div key={index}>
                            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                                <Space>
                                    {isCompleted && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                    <Text strong={isActive} type={isCompleted ? 'success' : isActive ? 'default' : 'secondary'}>
                                        {index + 1}. {stage.name}
                                    </Text>
                                </Space>
                                {isActive && (
                                    <Text strong style={{ color: stageColors[index % stageColors.length] }}>
                                        {percent.toFixed(0)}%
                                    </Text>
                                )}
                            </div>
                            <Progress
                                percent={percent}
                                status={isCompleted ? 'success' : 'active'}
                                strokeColor={stageColors[index % stageColors.length]}
                                showInfo={false}
                                size="small"
                            />
                            {isActive && stageProgress && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {stageProgress.processedRecords?.toLocaleString()} / {stageProgress.totalRecords?.toLocaleString()}
                                    {stageProgress.throughput && ` • ${parseInt(stageProgress.throughput).toLocaleString()} سجل/ثانية`}
                                </Text>
                            )}
                        </div>
                    );
                })}
            </Space>
        </Card>
    );
};

/**
 * مكون إحصائيات الأداء النهائية
 * Final Performance Statistics Component
 */
export const PerformanceStats = ({ stats }) => {
    if (!stats) return null;

    return (
        <Card title="إحصائيات الأداء" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Statistic
                        title="إجمالي الوقت"
                        value={stats.totalTime}
                        suffix="ms"
                        prefix={<ClockCircleOutlined />}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="معدل المعالجة"
                        value={stats.throughput}
                        suffix="سجل/ثانية"
                        prefix={<ThunderboltOutlined />}
                    />
                </Col>

                {stats.inputRecords && (
                    <>
                        <Col span={8}>
                            <Statistic
                                title="المشتريات"
                                value={stats.inputRecords.purchases?.toLocaleString()}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="المرتجعات"
                                value={stats.inputRecords.returns?.toLocaleString()}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="الإجمالي"
                                value={stats.inputRecords.total?.toLocaleString()}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Col>
                    </>
                )}

                {stats.matchingStats && (
                    <>
                        <Col span={12}>
                            <Statistic
                                title="المطابقات"
                                value={stats.matchingStats.matchedReturns?.toLocaleString()}
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Col>
                        <Col span={12}>
                            <Statistic
                                title="معدل المطابقة"
                                value={stats.matchingStats.matchRate}
                                suffix="%"
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Col>
                    </>
                )}
            </Row>
        </Card>
    );
};

export default DetailedProgressIndicator;
