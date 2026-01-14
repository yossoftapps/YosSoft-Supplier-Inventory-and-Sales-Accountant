import React from 'react';
import '../assets/styles/unified-styles.css';

const CollapsibleSection = ({
  title,
  children,
  defaultCollapsed = false, // Ignored now
  className = '',
  ...restProps
}) => {
  return (
    <div className={`collapsible-section ${className}`} {...restProps}>
      <div className="collapsible-header" style={{ cursor: 'default' }}>
        <span>{title}</span>
      </div>
      <div className="collapsible-content">
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSection;