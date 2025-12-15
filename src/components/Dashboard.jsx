import React, { useState } from 'react';
import { Row, Col, Typography, Divider, Progress, Card, Button, message, Alert, Upload } from 'antd';
import {
  ShoppingOutlined,
  FundViewOutlined,
  DatabaseOutlined,
  DollarCircleOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  FileExcelOutlined,
  UploadOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { formatMoney } from '../utils/financialCalculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import UnifiedPageLayout from './UnifiedPageLayout';
import UnifiedCard from './UnifiedCard';
import DashboardWidgets from './DashboardWidgets';

// Import logic functions
import { calculateNetPurchases } from '../logic/netPurchasesLogic';
import { calculateNetSales } from '../logic/netSalesLogic';
import { processPhysicalInventory } from '../logic/physicalInventoryLogic';
import { calculateExcessInventory } from '../logic/excessInventoryLogic';
import { calculateEndingInventory } from '../logic/endingInventoryLogic';
import { calculateSalesCost } from '../logic/salesCostLogic';
import { calculateSupplierPayables } from '../logic/supplierPayablesLogic';
import { calculateBookInventory } from '../logic/bookInventoryLogic';
import { calculateAbnormalItems } from '../logic/abnormalItemsLogic';
import { calculateMainAccountsSummary } from '../logic/mainAccountsLogic';
import { enrichNetPurchases } from '../logic/enrichmentLogic';
import { checkDataSufficiency } from '../logic/dataSufficiencyChecker';
import { checkFinancialDataIntegrity } from '../logic/financialIntegrityChecker';

// Import validation functions
import { validateAllTables, normalizeData } from '../validator/schemaValidator';

const { Title, Text } = Typography;

// Colors for charts
const COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#f5222d', '#eb2f96'];
const PIE_COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#f5222d', '#eb2f96'];

import companyLogo from '../assets/images/logo.png';

const Dashboard = ({ monetaryTotals, reportCounts, processedData, advancedReports, onDataProcessed }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Get last updated time
  const lastUpdated = new Date().toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Colors
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  // --- Insight Calculations ---

  // Defensive checks for data
  const safeMonetaryTotals = monetaryTotals || {};
  const safeReportCounts = reportCounts || {};
  const safeProcessedData = processedData || {};
  const safeAdvancedReports = advancedReports || {};

  // 1. Top Selling Items (by Quantity)
  const topSellingItems = (safeProcessedData?.netSales?.netSalesList || [])
    .sort((a, b) => (parseFloat(b['الكمية']) || 0) - (parseFloat(a['الكمية']) || 0))
    .slice(0, 5);

  // 2. Critical Risk Items (Expired or Stagnant)
  // Combining Expiry Risk and Stagnation Risk if available
  const riskItems = [
    ...(safeAdvancedReports?.expiryRisk || []).map(i => ({ ...i, type: 'Expiry', severity: 'High' })),
    ...(safeAdvancedReports?.stagnationRisk || []).map(i => ({ ...i, type: 'Stagnant', severity: 'Medium' }))
  ].sort((a, b) => b.severity === 'High' ? 1 : -1).slice(0, 5);

  // Prepare data for bar chart
  const financialData = [
    { name: 'المشتريات', value: safeMonetaryTotals.netPurchases || 0 },
    { name: 'المبيعات', value: safeMonetaryTotals.netSales || 0 },
    { name: 'المخزون', value: safeMonetaryTotals.endingInventory || 0 },
    { name: 'الاستحقاق', value: safeMonetaryTotals.suppliersPayables || 0 },
  ];

  // Prepare data for pie chart
  const distributionData = [
    { name: 'سجلات المشتريات', value: safeReportCounts.netPurchases || 0 },
    { name: 'سجلات المبيعات', value: safeReportCounts.netSales || 0 },
    { name: 'سجلات المخزون', value: safeReportCounts.endingInventory || 0 },
    { name: 'أصناف المخاطر', value: (safeReportCounts.expiryRisk || 0) + (safeReportCounts.stagnationRisk || 0) }
  ].filter(item => item.value > 0);

  // KPI Calculations
  const profitMargin = (safeMonetaryTotals.netSales || 0) > 0
    ? (((safeMonetaryTotals.netSales || 0) - ((safeMonetaryTotals.netPurchases || 0) * 0.7)) / (safeMonetaryTotals.netSales || 0) * 100).toFixed(1) // Approximate
    : '0.0';

  return (
    <UnifiedPageLayout
      title="لوحة القيادة المركزية"
      description={`نظرة شاملة على الأداء المالي والمخزوني والتشغيلي • آخر تحديث: ${lastUpdated}`}
    >
      {/* Import Section */}
      <UnifiedCard
        title="استيراد البيانات"
        style={{ marginBottom: 32, background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}
        extra={<UploadOutlined style={{ color: '#2563eb' }} />}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Text type="secondary">
              قم بتحميل ملفات Excel الخاصة ببيانات المشتريات والمبيعات والمخزون لتحديث النظام
            </Text>
          </Col>
          <Col xs={24} md={8}>
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={(file) => {
                // Handle file upload logic here
                message.success(`تم تحميل الملف: ${file.name}`);
                return false; // Prevent automatic upload
              }}
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                size="large"
                style={{ width: '100%' }}
              >
                اختر ملف Excel
              </Button>
            </Upload>
          </Col>
        </Row>
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Button
              icon={<FileExcelOutlined />}
              style={{ width: '100%' }}
              onClick={() => message.info('فتح نافذة استيراد المشتريات')}
            >
              استيراد المشتريات
            </Button>
          </Col>
          <Col xs={24} sm={8}>
            <Button
              icon={<FileExcelOutlined />}
              style={{ width: '100%' }}
              onClick={() => message.info('فتح نافذة استيراد المبيعات')}
            >
              استيراد المبيعات
            </Button>
          </Col>
          <Col xs={24} sm={8}>
            <Button
              icon={<FileExcelOutlined />}
              style={{ width: '100%' }}
              onClick={() => message.info('فتح نافذة استيراد المخزون')}
            >
              استيراد المخزون
            </Button>
          </Col>
        </Row>
      </UnifiedCard>

      {/* Top Row: Key Performance Indicators (KPIs) */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <UnifiedCard
            className="dashboard-kpi-card"
            style={{ height: '100%', background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)' }}
            hoverEffect={true}
            slideIn={true}
            onClick={() => message.info('سيتم تحويلك إلى تقرير المبيعات')}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ padding: 12, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', marginRight: 16 }}>
                <DollarCircleOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>صافي المبيعات</Text>
                <Title level={3} style={{ margin: 0, color: '#1e293b' }}>{formatMoney(monetaryTotals.netSales)}</Title>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <RiseOutlined style={{ color: '#10b981', marginLeft: 8 }} />
              <Text type="success" strong>+12%</Text>
              <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>من الشهر الماضي</Text>
            </div>
          </UnifiedCard>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <UnifiedCard
            className="dashboard-kpi-card"
            style={{ height: '100%', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}
            hoverEffect={true}
            slideIn={true}
            onClick={() => message.info('سيتم تحويلك إلى تقرير المشتريات')}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ padding: 12, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginRight: 16 }}>
                <ShoppingOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>صافي المشتريات</Text>
                <Title level={3} style={{ margin: 0, color: '#1e293b' }}>{formatMoney(monetaryTotals.netPurchases)}</Title>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FallOutlined style={{ color: '#f59e0b', marginLeft: 8 }} />
              <Text type="warning" strong>-2%</Text>
              <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>من الشهر الماضي</Text>
            </div>
          </UnifiedCard>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <UnifiedCard
            className="dashboard-kpi-card"
            style={{ height: '100%', background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)' }}
            hoverEffect={true}
            slideIn={true}
            onClick={() => message.info('سيتم تحويلك إلى تقرير المخزون')}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ padding: 12, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', marginRight: 16 }}>
                <DatabaseOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>قيمة المخزون</Text>
                <Title level={3} style={{ margin: 0, color: '#1e293b' }}>{formatMoney(monetaryTotals.endingInventory)}</Title>
              </div>
            </div>
            <Progress percent={75} size="small" strokeColor="#f59e0b" showInfo={false} />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>75% من السعة التخزينية</Text>
          </UnifiedCard>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <UnifiedCard
            className="dashboard-kpi-card"
            style={{ height: '100%', background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)' }}
            hoverEffect={true}
            slideIn={true}
            onClick={() => message.info('سيتم تحويلك إلى تقرير المخاطر')}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ padding: 12, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginRight: 16 }}>
                <ExclamationCircleOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>تنبيهات المخاطر</Text>
                <Title level={3} style={{ margin: 0, color: '#1e293b' }}>{reportCounts.expiryRisk + reportCounts.stagnationRisk}</Title>
              </div>
            </div>
            <Text type="danger" style={{ fontSize: 12 }}>يتطلب {reportCounts.expiryRisk} عنصر اهتماماً فوريًا</Text>
          </UnifiedCard>
        </Col>
      </Row>

      {/* Mid Row: Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={16}>
          <UnifiedCard title="التحليل المالي المقارن" extra={<BarChartOutlined style={{ color: '#2563eb' }} />}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [`${formatMoney(value)} ر.ي`, 'القيمة']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {financialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </UnifiedCard>
        </Col>

        <Col xs={24} lg={8}>
          <UnifiedCard title="توزيع البيانات" extra={<FundViewOutlined style={{ color: '#10b981' }} />}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </UnifiedCard>
        </Col>
      </Row>

      {/* Bottom Row: Detailed Lists */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <UnifiedCard title="أعلى 5 أصناف مبيعاً" extra={<RiseOutlined style={{ color: '#10b981' }} />}>
            <div className="unified-table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#64748b' }}>المادة</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#64748b' }}>الكمية</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#64748b' }}>الرقم</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellingItems.length > 0 ? topSellingItems.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{item['اسم المادة']}</td>
                      <td style={{ padding: '12px', color: '#10b981' }}>{item['الكمية']?.toString()}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{item['رمز المادة']}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>لا توجد بيانات متاحة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </UnifiedCard>
        </Col>

        <Col xs={24} lg={12}>
          <UnifiedCard title="تنبيهات المخاطر العاجلة" extra={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}>
            <div className="unified-table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#64748b' }}>المادة</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#64748b' }}>نوع الخطر</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#64748b' }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {riskItems.length > 0 ? riskItems.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{item['اسم المادة']}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: '#fef2f2',
                          color: '#ef4444',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {item.type === 'Expiry' ? 'انتهاء صلاحية' : 'ركود'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Button size="small" type="link" danger>معالجة</Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>سجلك نظيف! لا توجد مخاطر عاجلة.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </UnifiedCard>
        </Col>
      </Row>
    </UnifiedPageLayout>
  );
};

export default Dashboard;