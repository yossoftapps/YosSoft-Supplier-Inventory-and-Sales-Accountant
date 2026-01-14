import React from 'react';
import { Space } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import PrintExportButtons from './PrintExportButtons';
import ViewSettingsManager from './ViewSettingsManager';
import '../assets/styles/unified-styles.css';

const UnifiedActionBar = ({
  data,
  title,
  columns,
  filename,
  allReportsData,
  reportKey,
  onColumnVisibilityChange,
  onSortOrderChange,
  onPaginationChange,
  pagination,
  onDensityChange,
  density,
  availableReports,
  onFilterChange, // This prop will be used to clear filters
  customActionBar
}) => {
  const clearFilters = () => {
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  if (customActionBar) {
    return customActionBar;
  }

  return (
    <Space size="middle" className="unified-action-bar-space">
      {data && (
        <PrintExportButtons
          data={data}
          title={title}
          columns={columns}
          filename={filename}
          allReportsData={allReportsData}
          availableReports={availableReports}
        />
      )}
      
      <button
        onClick={clearFilters}
        className="unified-secondary-button"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '40px',
          padding: '0 24px',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
        type="button"
      >
        <ClearOutlined style={{ marginRight: '8px' }} />
        مسح الفلاتر
      </button>
      
      {columns && (
        <ViewSettingsManager
          reportKey={reportKey}
          columns={columns}
          onColumnVisibilityChange={onColumnVisibilityChange}
          onSortOrderChange={onSortOrderChange}
          onPaginationChange={onPaginationChange}
          pagination={pagination}
          onDensityChange={onDensityChange}
          density={density}
        />
      )}
    </Space>
  );
};

export default UnifiedActionBar;