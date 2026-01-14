import React, { useState } from 'react';
import { Typography, Space, Collapse, Button } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import PrintExportButtons from './PrintExportButtons';
import ViewSettingsManager from './ViewSettingsManager';
import UnifiedFilterBar from './UnifiedFilterBar';
import { REPORT_COLORS, getLightColor } from '../constants/reportColors';

// ... other imports

import '../assets/styles/unified-styles.css';

const { Title, Text } = Typography;

const UnifiedPageLayout = ({
  title,
  description,
  children,
  data,
  allReportsData,
  columns,
  filename,
  reportKey,
  columnVisibility,
  onColumnVisibilityChange,
  onSortOrderChange,
  onPaginationChange,
  pagination,
  filterData,
  filterDataType,
  onFilterChange,
  density,
  onDensityChange,
  customActionBar,
  headerExtra, // تبويبات التنقل أو ضوابط شريط العنوان
  interpretation, // الشرح/التفسير
  availableReports, // واجهة التصدير الاكسل (Lazy Export UI)
  exportColumns, // أعمدة التصدير (كاملة)
  showClearFilters = true, // Whether to show the clear filters button
  showFilterBar = true, // Whether to show the filter bar
  category, // KEEP for backward compatibility
  ...restProps
}) => {
  // Determine page color
  const pageColor = REPORT_COLORS[reportKey] || (category ? `var(--category-color)` : '#3b82f6');
  const pageBgColor = REPORT_COLORS[reportKey] ? getLightColor(REPORT_COLORS[reportKey]) : (category ? `var(--category-bg)` : '#eff6ff');

  const headerStyle = {
    borderTop: `4px solid ${pageColor}`,
    backgroundColor: pageBgColor,
    borderLeft: `1px solid ${pageColor}`,
    borderRight: `1px solid ${pageColor}`,
    borderBottom: `1px solid ${pageColor}`,
  };

  return (
    <div className="unified-page-layout">
      {/* الصف 1: العنوان والإجراءات */}
      <div className={`unified-page-header`} style={headerStyle}>
        <div className="unified-top-title-section" style={{ borderBottomColor: `rgba(0,0,0,0.06)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <Title level={3} className="unified-page-title" style={{ color: '#1e293b', margin: 0 }}>
              {title}
            </Title>
            <div className="unified-actions-container">
              {headerExtra}
              {customActionBar ? (
                customActionBar
              ) : (
                <>
                  {data && (
                    <PrintExportButtons
                      data={data}
                      title={title}
                      columns={exportColumns || columns}
                      columnVisibility={columnVisibility}
                      filename={filename}
                      allReportsData={allReportsData}
                      availableReports={availableReports}
                      onFilterChange={onFilterChange}
                      enableGlobalExport={![
                        'physicalInventory', 'excessInventory', 'preparingReturns',
                        'suppliersPayables', 'salesCost', 'itemProfitability', 'mainAccounts',
                        'expiryRisk', 'stagnationRisk', 'abnormalItems',
                        'inventoryABC', 'inventoryTurnover', 'idealReplenishment', 'newItemPerformance'
                      ].includes(reportKey)}
                    />
                  )}
                  {onFilterChange && showClearFilters && (
                    <Button
                      icon={<ClearOutlined />}
                      onClick={() => onFilterChange({})}
                      className="unified-secondary-button"
                      style={{ minWidth: '100px' }}
                    >
                      مسح الفلاتر
                    </Button>
                  )}
                  {columns && (
                    <ViewSettingsManager
                      reportKey={reportKey}
                      columns={columns}
                      onColumnVisibilityChange={onColumnVisibilityChange}
                      onSortOrderChange={onSortOrderChange}
                      onPaginationChange={onPaginationChange}
                      pagination={pagination}
                      onDensityChange={onDensityChange}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* الصف 2: الوصف المختصر داخل مربع الرأس */}
        {description && (
          <div className="unified-page-description-row" style={{ marginTop: '16px', padding: '0 4px' }}>
            <Text type="secondary" style={{ fontSize: '15px', display: 'block' }}>
              {description}
            </Text>
          </div>
        )}
      </div>

      {/* الصف 3: شريط التصفية (Filter Bar) */}
      {showFilterBar && (filterData || filterDataType) && (
        <UnifiedFilterBar
          data={filterData}
          onFilterChange={onFilterChange}
          dataType={filterDataType}
          style={{ marginBottom: 12, padding: '10px 16px', background: 'rgba(241, 245, 249, 0.6)', borderRadius: '8px' }}
        />
      )}

      {/* محتوى الصفحة (الصفوف 4-7 موجودة داخل children/UnifiedTable) */}
      <div className="unified-page-content" style={{ overflowX: 'auto', overflowY: 'visible' }}>
        {/* تمرير headerExtra إلى الأطفال إذا كانوا UnifiedTable أو قادرين على التعامل معه */}
        {React.Children.map(children, child => {
          // Only pass headerExtra to UnifiedTable or components that specifically need it
          // Checks if the component name is likely UnifiedTable based on display name or implicit knowledge
          // For now, I'll stop passing headerExtra to children automatically because UnifiedPageLayout renders it in the header already.
          // If a child *needs* it (e.g. to display it internally), we should be specific.
          // However, based on the previous context, UnifiedPageLayout renders headerExtra in the 'actions' area.
          // Passing it to children seems incorrectly implemented or legacy.
          // I will REMOVE the cloneElement prop injection which is causing the error.
          return child;
        })}

        {/* صفوف الصفحة السفلية */}
        {interpretation && (
          <div className="unified-report-interpretation" style={{ marginTop: '24px' }}>
            <Collapse ghost defaultActiveKey={['interpretation']} items={[{
              key: 'interpretation',
              label: 'ملاحظات وشروح (تفسير التقارير)',
              children: (
                <div className="unified-report-interpretation-content">
                  {interpretation}
                </div>
              )
            }]} />
          </div>
        )}
      </div>

      {/* الصف 5 السفلي: حقوق الملكية */}
      <footer className="unified-layout-footer" style={{ textAlign: 'center', padding: '32px 0 16px 0', borderTop: '1px solid rgba(0,0,0,0.03)', marginTop: '24px' }}>
        <Text type="secondary" style={{ fontSize: '13px', opacity: 0.7, letterSpacing: '0.5px' }}>
          حقوق الملكية محفوظة لشركة يوسوفت 2025 © | YosSoft Accountant Platform
        </Text>
      </footer>
    </div>
  );
};

export default UnifiedPageLayout;