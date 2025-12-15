import React from 'react';
import '../assets/styles/unified-styles.css';

const HorizontalScrollbar = ({
  children,
  className = '',
  ...restProps
}) => {
  return (
    <div className={`horizontal-scroll-container ${className}`} {...restProps}>
      <div className="horizontal-scroll-content">
        {children}
      </div>
    </div>
  );
};

export default HorizontalScrollbar;