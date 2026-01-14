import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Tag, Tabs, Statistic, Row, Col, Card } from 'antd';
import {
    BugOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    DownloadOutlined,
    DeleteOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { errorLogger } from '../utils/errorLogger';

const { TabPane } = Tabs;

const LogViewer = ({ open, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({});
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (open) {
            refreshLogs();
        }
    }, [open]);

    const refreshLogs = () => {
        setLogs(errorLogger.getLogs());
        setStats(errorLogger.getStats());
    };

    const handleExportJSON = () => {
        const json = errorLogger.exportLogs();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const csv = errorLogger.exportLogsCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClearLogs = () => {
        if (window.confirm('هل أنت متأكد من حذف جميع السجلات؟')) {
            errorLogger.clearLogs();
            refreshLogs();
        }
    };

    const getLevelIcon = (level) => {
        switch (level) {
            case 'ERROR':
                return <BugOutlined style={{ color: '#ff4d4f' }} />;
            case 'WARNING':
                return <WarningOutlined style={{ color: '#faad14' }} />;
            case 'INFO':
                return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
            case 'SUCCESS':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            default:
                return null;
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR':
                return 'error';
            case 'WARNING':
                return 'warning';
            case 'INFO':
                return 'processing';
            case 'SUCCESS':
                return 'success';
            default:
                return 'default';
        }
    };

    const columns = [
        {
            title: 'الوقت',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 180,
            render: (text) => new Date(text).toLocaleString('ar-EG')
        },
        {
            title: 'المستوى',
            dataIndex: 'level',
            key: 'level',
            width: 100,
            render: (level) => (
                <Tag icon={getLevelIcon(level)} color={getLevelColor(level)}>
                    {level}
                </Tag>
            )
        },
        {
            title: 'الرسالة',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true
        },
        {
            title: 'السياق',
            dataIndex: 'context',
            key: 'context',
            width: 150,
            render: (context) => (
                <details>
                    <summary style={{ cursor: 'pointer' }}>عرض</summary>
                    <pre style={{ fontSize: '11px', maxHeight: '200px', overflow: 'auto' }}>
                        {JSON.stringify(context, null, 2)}
                    </pre>
                </details>
            )
        }
    ];

    const getFilteredLogs = () => {
        if (activeTab === 'all') return logs;
        return logs.filter(log => log.level === activeTab);
    };

    return (
        <Modal
            title="سجلات النظام"
            open={open}
            onCancel={onClose}
            width={1200}
            footer={[
                <Button key="refresh" icon={<ReloadOutlined />} onClick={refreshLogs}>
                    تحديث
                </Button>,
                <Button key="clear" icon={<DeleteOutlined />} danger onClick={handleClearLogs}>
                    مسح الكل
                </Button>,
                <Button key="csv" icon={<DownloadOutlined />} onClick={handleExportCSV}>
                    تصدير CSV
                </Button>,
                <Button key="json" icon={<DownloadOutlined />} onClick={handleExportJSON}>
                    تصدير JSON
                </Button>,
                <Button key="close" type="primary" onClick={onClose}>
                    إغلاق
                </Button>
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Statistics */}
                <Row gutter={16}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="إجمالي السجلات"
                                value={stats.total || 0}
                                prefix={<InfoCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="أخطاء"
                                value={stats.errors || 0}
                                valueStyle={{ color: '#cf1322' }}
                                prefix={<BugOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="تحذيرات"
                                value={stats.warnings || 0}
                                valueStyle={{ color: '#faad14' }}
                                prefix={<WarningOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="نجاح"
                                value={stats.success || 0}
                                valueStyle={{ color: '#3f8600' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Tabs */}
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab={`الكل (${logs.length})`} key="all" />
                    <TabPane
                        tab={
                            <span>
                                <BugOutlined /> أخطاء ({stats.errors || 0})
                            </span>
                        }
                        key="ERROR"
                    />
                    <TabPane
                        tab={
                            <span>
                                <WarningOutlined /> تحذيرات ({stats.warnings || 0})
                            </span>
                        }
                        key="WARNING"
                    />
                    <TabPane
                        tab={
                            <span>
                                <InfoCircleOutlined /> معلومات ({stats.info || 0})
                            </span>
                        }
                        key="INFO"
                    />
                    <TabPane
                        tab={
                            <span>
                                <CheckCircleOutlined /> نجاح ({stats.success || 0})
                            </span>
                        }
                        key="SUCCESS"
                    />
                </Tabs>

                {/* Table */}
                <Table
                    columns={columns}
                    dataSource={getFilteredLogs()}
                    rowKey={(record, index) => index}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `إجمالي ${total} سجل`
                    }}
                    scroll={{ y: 400 }}
                    size="small"
                />
            </Space>
        </Modal>
    );
};

export default LogViewer;
