import React, { useState, useEffect, useRef, memo } from 'react';
import { Button, Popover, Checkbox, Divider, Slider, Space, Typography, Tooltip } from 'antd';
import { SettingOutlined, EyeInvisibleOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  getViewSettings, 
  saveColumnVisibility, 
  saveSortOrder, 
  savePaginationSettings,
  clearViewSettings
} from '../utils/viewSettingsManager.js';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const ViewSettingsManager = memo(({ 
  reportKey, 
  columns = [], 
  onColumnVisibilityChange,
  onSortOrderChange,
  onPaginationChange,
  showColumnVisibility = true,
  showSortOptions = true,
  showPaginationOptions = true
}) => {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] = useState({});
  const [sortOrder, setSortOrder] = useState({});
  const [pagination, setPagination] = useState({ pageSize: 50 });
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const initialLoadRef = useRef(false);

  // Load saved settings on component mount
  useEffect(() => {
    if (!reportKey) return;

    const savedSettings = getViewSettings(reportKey);
    let hasChanges = false;
    let loadedColumnVisibility = null;
    let loadedSortOrder = null;
    let loadedPagination = null;
    
    // Load column visibility
    if (savedSettings.columnVisibility) {
      loadedColumnVisibility = savedSettings.columnVisibility;
      setColumnVisibility(savedSettings.columnVisibility);
    } else {
      // Default: all columns visible
      const defaultVisibility = {};
      columns.forEach(col => {
        defaultVisibility[col.dataIndex || col.key] = true;
      });
      loadedColumnVisibility = defaultVisibility;
      setColumnVisibility(defaultVisibility);
      hasChanges = true;
    }

    // Load sort order
    if (savedSettings.sortOrder) {
      loadedSortOrder = savedSettings.sortOrder;
      setSortOrder(savedSettings.sortOrder);
    } else {
      loadedSortOrder = {};
    }

    // Load pagination settings
    if (savedSettings.pagination) {
      loadedPagination = savedSettings.pagination;
      setPagination(savedSettings.pagination);
    } else {
      loadedPagination = { pageSize: 50 };
    }

    // Only notify parent if there are changes or if this is initial load
    // We use a ref to track if this is the first load
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      
      if (onColumnVisibilityChange && loadedColumnVisibility) {
        onColumnVisibilityChange(loadedColumnVisibility);
      }
      if (onSortOrderChange && loadedSortOrder) {
        onSortOrderChange(loadedSortOrder);
      }
      if (onPaginationChange && loadedPagination) {
        onPaginationChange(loadedPagination);
      }
    }
  }, [reportKey, columns]);

  // Handle column visibility change
  const handleColumnVisibilityChange = (dataIndex, checked) => {
    const newVisibility = { ...columnVisibility, [dataIndex]: checked };
    setColumnVisibility(newVisibility);
    
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(newVisibility);
    }
    
    // Save to localStorage
    if (reportKey) {
      saveColumnVisibility(reportKey, newVisibility);
    }
  };

  // Toggle all columns visibility
  const toggleAllColumns = (visible) => {
    const newVisibility = {};
    columns.forEach(col => {
      newVisibility[col.dataIndex || col.key] = visible;
    });
    setColumnVisibility(newVisibility);
    
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(newVisibility);
    }
    
    // Save to localStorage
    if (reportKey) {
      saveColumnVisibility(reportKey, newVisibility);
    }
  };

  // Handle sort order change
  const handleSortOrderChange = (field, order) => {
    const newSortOrder = { field, order };
    setSortOrder(newSortOrder);
    
    if (onSortOrderChange) {
      onSortOrderChange(newSortOrder);
    }
    
    // Save to localStorage
    if (reportKey) {
      saveSortOrder(reportKey, newSortOrder);
    }
  };

  // Handle pagination change
  const handlePageSizeChange = (value) => {
    const newPagination = { ...pagination, pageSize: value };
    setPagination(newPagination);
    
    if (onPaginationChange) {
      onPaginationChange(newPagination);
    }
    
    // Save to localStorage
    if (reportKey) {
      savePaginationSettings(reportKey, newPagination);
    }
  };

  // Reset to default settings
  const resetToDefault = () => {
    // Clear saved settings
    if (reportKey) {
      clearViewSettings(reportKey);
    }
    
    // Reset state
    const defaultVisibility = {};
    columns.forEach(col => {
      defaultVisibility[col.dataIndex || col.key] = true;
    });
    setColumnVisibility(defaultVisibility);
    setSortOrder({});
    setPagination({ pageSize: 50 });
    
    // Notify parent components
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(defaultVisibility);
    }
    if (onSortOrderChange) {
      onSortOrderChange({});
    }
    if (onPaginationChange) {
      onPaginationChange({ pageSize: 50 });
    }
  };

  // Render column visibility controls
  const renderColumnVisibilityControls = () => {
    if (!showColumnVisibility || columns.length === 0) return null;

    const allVisible = Object.values(columnVisibility).every(v => v);
    const noneVisible = Object.values(columnVisibility).every(v => !v);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong>{t('columnVisibility')}</Text>
          <Space size="small">
            <Button 
              type="link" 
              size="small"
              onClick={() => toggleAllColumns(true)}
              disabled={allVisible}
            >
              {t('showAll')}
            </Button>
            <Button 
              type="link" 
              size="small"
              onClick={() => toggleAllColumns(false)}
              disabled={noneVisible}
            >
              {t('hideAll')}
            </Button>
          </Space>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {columns.map(col => {
            const dataIndex = col.dataIndex || col.key;
            return (
              <div key={dataIndex} style={{ padding: '4px 0' }}>
                <Checkbox
                  checked={columnVisibility[dataIndex] !== false}
                  onChange={e => handleColumnVisibilityChange(dataIndex, e.target.checked)}
                >
                  {col.title}
                </Checkbox>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render sort options
  const renderSortOptions = () => {
    if (!showSortOptions || columns.length === 0) return null;

    return (
      <div>
        <Text strong>{t('sortBy')}</Text>
        <div style={{ marginTop: 8 }}>
          {columns.filter(col => col.dataIndex || col.key).map(col => {
            const dataIndex = col.dataIndex || col.key;
            return (
              <div key={dataIndex} style={{ padding: '4px 0' }}>
                <Space>
                  <Button 
                    type={sortOrder.field === dataIndex && sortOrder.order === 'asc' ? "primary" : "default"}
                    size="small"
                    onClick={() => handleSortOrderChange(dataIndex, 'asc')}
                  >
                    ▲
                  </Button>
                  <span>{col.title}</span>
                  <Button 
                    type={sortOrder.field === dataIndex && sortOrder.order === 'desc' ? "primary" : "default"}
                    size="small"
                    onClick={() => handleSortOrderChange(dataIndex, 'desc')}
                  >
                    ▼
                  </Button>
                </Space>
              </div>
            );
          })}
        </div>
        {sortOrder.field && (
          <div style={{ marginTop: 8 }}>
            <Button 
              icon={<ReloadOutlined />} 
              size="small"
              onClick={() => handleSortOrderChange(null, null)}
            >
              {t('clearSort')}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render pagination options
  const renderPaginationOptions = () => {
    if (!showPaginationOptions) return null;

    return (
      <div>
        <Text strong>{t('pageSize')}</Text>
        <div style={{ marginTop: 8 }}>
          <Slider
            min={10}
            max={200}
            step={10}
            value={pagination.pageSize}
            onChange={handlePageSizeChange}
            marks={{
              10: '10',
              50: '50',
              100: '100',
              200: '200'
            }}
          />
        </div>
      </div>
    );
  };

  const content = (
    <div style={{ width: 300 }}>
      {renderColumnVisibilityControls()}
      
      {(showColumnVisibility && (showSortOptions || showPaginationOptions)) && (
        <Divider style={{ margin: '12px 0' }} />
      )}
      
      {renderSortOptions()}
      
      {showSortOptions && showPaginationOptions && (
        <Divider style={{ margin: '12px 0' }} />
      )}
      
      {renderPaginationOptions()}
      
      <Divider style={{ margin: '12px 0' }} />
      
      <div style={{ textAlign: 'right' }}>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={resetToDefault}
          size="small"
        >
          {t('resetToDefault')}
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      title={t('viewSettings')}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Tooltip title={t('viewSettings')}>
        <Button ref={buttonRef} icon={<SettingOutlined />} />
      </Tooltip>
    </Popover>
  );
});

export default ViewSettingsManager;