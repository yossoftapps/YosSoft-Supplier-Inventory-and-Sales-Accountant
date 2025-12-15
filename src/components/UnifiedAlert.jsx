import React from 'react';
import { Alert } from 'antd';
import '../assets/styles/unified-styles.css';

const UnifiedAlert = ({
  className = '',
  ...restProps
}) => {
  return (
    <Alert
      className={`unified-alert ${className}`}
      {...restProps}
    />
  );
};

export default UnifiedAlert;