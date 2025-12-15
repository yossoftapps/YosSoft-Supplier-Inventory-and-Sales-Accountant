// مكون تقدم معالجة الملف
import React, { useState, useEffect, memo } from 'react';
import { Progress, Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

const FileProcessingProgress = memo(() => {
  const [progress, setProgress] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // الاستماع لتحديثات التقدم من العملية الرئيسية لـ Electron
    const handleProgress = (event, progressData) => {
      setProgress(progressData);
      setIsVisible(true);
    };

    // إضافة مستمع للأحداث
    window.electron.on('processing-progress', handleProgress);

    // تنظيف
    return () => {
      window.electron.removeListener('processing-progress', handleProgress);
    };
  }, []);

  if (!isVisible || !progress) {
    return null;
  }

  const percent = progress.percent || Math.min(100, Math.round((progress.totalProcessed / (progress.totalProcessed + 1000)) * 100));
  const elapsedSeconds = Math.round((progress.elapsed || 0) / 1000);
  const rate = progress.totalProcessed && elapsedSeconds > 0 ? Math.round(progress.totalProcessed / elapsedSeconds) : 0;

  return (
    <div style={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)', 
      zIndex: 1000,
      width: '80%',
      maxWidth: 500
    }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={4}>جاري معالجة الملف</Title>
          
          <Text>الورقة: {progress.sheet}</Text>
          <Text>الجزء: {progress.chunk}/{progress.totalChunks || '...'}</Text>
          
          <Progress 
            percent={percent} 
            status="active" 
            showInfo={true}
          />
          
          <Space>
            <Text>المعالجة: {progress.totalProcessed?.toLocaleString()} سجل</Text>
            {rate > 0 && <Text>المعدل: {rate?.toLocaleString()} سجل/ثانية</Text>}
            {elapsedSeconds > 0 && <Text>الزمن: {elapsedSeconds} ثانية</Text>}
          </Space>
        </Space>
      </Card>
    </div>
  );
});

export default FileProcessingProgress;