import React from 'react';
import '../assets/styles/unified-styles.css';

const FixedNavigationBar = ({
  children,
  className = '',
  ...restProps
}) => {
  return (
    <div className={`fixed-navbar ${className}`} {...restProps}>
      <div className="fixed-navbar-content">
        {children}
      </div>
    </div>
  );
};

export default FixedNavigationBar;