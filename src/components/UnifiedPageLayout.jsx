import React from 'react';
import { Typography, Space } from 'antd';
import PrintExportButtons from './PrintExportButtons';
import ViewSettingsManager from './ViewSettingsManager';
import UnifiedFilterBar from './UnifiedFilterBar';
import FixedNavigationBar from './FixedNavigationBar';
import CollapsibleSection from './CollapsibleSection';
import '../assets/styles/unified-styles.css';

import BrandingHeader from './BrandingHeader';

const { Title } = Typography;

const UnifiedPageLayout = ({
  title,
  description,
  children,
  data,
  allReportsData,
  columns,
  filename,
  reportKey,
  onColumnVisibilityChange,
  onSortOrderChange,
  onPaginationChange,
  pagination,
  filterData,
  filterDataType,
  onFilterChange,
  customActionBar,
  ...restProps
}) => {
  return (
    <div className="unified-page-layout" {...restProps}>
      {/* Collapsible Report Header and Tools */}
      <CollapsibleSection title="عنوان التقرير وأدواته" defaultCollapsed={false}>
        {/* Action Bar */}
        <FixedNavigationBar>
          <div className="unified-action-bar">
            {customActionBar ? (
              customActionBar
            ) : (
              <>
                <div className="unified-action-group">
                  {data && (
                    <PrintExportButtons
                      data={data}
                      title={title}
                      columns={columns}
                      filename={filename}
                      allReportsData={allReportsData}
                    />
                  )}
                </div>
                <div className="unified-action-group">
                  {columns && (
                    <ViewSettingsManager
                      reportKey={reportKey}
                      columns={columns}
                      onColumnVisibilityChange={onColumnVisibilityChange}
                      onSortOrderChange={onSortOrderChange}
                      onPaginationChange={onPaginationChange}
                      pagination={pagination}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </FixedNavigationBar>

        {/* Page Header */}
        <div className="unified-page-header">
          <Title level={4} className="unified-page-title">
            {title}
          </Title>
          {description && (
            <p className="unified-page-description">
              {description}
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* Filter Bar */}
      {(filterData || filterDataType) && (
        <UnifiedFilterBar
          data={filterData}
          onFilterChange={onFilterChange}
          dataType={filterDataType}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Page Content with Horizontal Scroll */}
      <div className="unified-page-content" style={{ overflowX: 'auto', overflowY: 'visible' }}>
        {children}
      </div>
    </div>
  );
};

export default UnifiedPageLayout;