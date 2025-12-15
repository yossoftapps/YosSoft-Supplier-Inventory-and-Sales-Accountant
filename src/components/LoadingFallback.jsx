import React from 'react';
import { Spin, Typography } from 'antd';
import '../assets/styles/unified-styles.css';

const { Title, Text } = Typography;

const LoadingFallback = ({ message = "جاري تحميل الصفحة..." }) => {
  return (
    <div className="loading-fallback">
      <div className="loading-container">
        <Spin size="large" />
        <div className="loading-message">
          <Text type="secondary">{message}</Text>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;