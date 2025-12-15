import React, { useState } from 'react';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import '../assets/styles/unified-styles.css';

const CollapsibleSection = ({
  title,
  children,
  defaultCollapsed = false,
  className = '',
  ...restProps
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`collapsible-section ${className}`} {...restProps}>
      <div className="collapsible-header" onClick={toggleCollapse}>
        <span>{title}</span>
        {collapsed ? <RightOutlined /> : <DownOutlined />}
      </div>
      {!collapsed && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;