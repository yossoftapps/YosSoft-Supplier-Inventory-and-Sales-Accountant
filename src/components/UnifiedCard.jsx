import React from 'react';
import { Card } from 'antd';
import '../assets/styles/unified-styles.css';

const UnifiedCard = ({
  title,
  children,
  className = '',
  hoverEffect = true,
  slideIn = false,
  ...restProps
}) => {
  return (
    <Card
      title={title}
      className={`unified-card ${hoverEffect ? 'hover-effect' : ''} ${slideIn ? 'slide-in' : ''} ${className}`}
      {...restProps}
    >
      {children}
    </Card>
  );
};

export default UnifiedCard;