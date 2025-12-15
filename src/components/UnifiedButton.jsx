import React from 'react';
import { Button } from 'antd';
import '../assets/styles/unified-styles.css';

const UnifiedButton = ({
  type = 'primary',
  className = '',
  children,
  ...restProps
}) => {
  // Map button types to unified classes
  const getTypeClass = () => {
    switch (type) {
      case 'primary':
        return 'unified-primary-button';
      case 'secondary':
        return 'unified-secondary-button';
      default:
        return '';
    }
  };

  return (
    <Button
      type={type === 'secondary' ? 'default' : type}
      className={`${getTypeClass()} ${className}`}
      {...restProps}
    >
      {children}
    </Button>
  );
};

export default UnifiedButton;