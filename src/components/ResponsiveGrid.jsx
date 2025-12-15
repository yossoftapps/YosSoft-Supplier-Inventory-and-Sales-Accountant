import React from 'react';
import { Row, Col } from 'antd';

const ResponsiveGrid = ({ 
  children, 
  gutter = [16, 16],
  className = '',
  style = {}
}) => {
  return (
    <Row 
      gutter={gutter} 
      className={className}
      style={style}
    >
      {children}
    </Row>
  );
};

const GridItem = ({ 
  children, 
  xs = 24, 
  sm = 12, 
  md = 8, 
  lg = 6, 
  xl = 4,
  xxl = 4,
  className = '',
  style = {}
}) => {
  return (
    <Col 
      xs={xs} 
      sm={sm} 
      md={md} 
      lg={lg} 
      xl={xl} 
      xxl={xxl}
      className={className}
      style={style}
    >
      {children}
    </Col>
  );
};

export { ResponsiveGrid, GridItem };