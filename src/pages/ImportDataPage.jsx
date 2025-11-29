import React, { useState } from 'react';
import { Button, Typography, Space, Alert, Spin } from 'antd';

// استيراد خدمة معالجة البيانات
import { processData } from '../services/dataProcessingService';

const { Title, Text } = Typography;

function ImportDataPage({ onDataProcessed }) {
    const [fileName, setFileName] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileSelect = async () => {
        setIsLoading(true);
        setStatusMessage('جاري فتح نافذة اختيار الملفات...');

        try {
            const fileResult = await window.electronAPI.openFile();

            if (fileResult.canceled) {
                setStatusMessage('تم إلغاء العملية من قبل المستخدم.');
                setIsLoading(false);
                return;
            }

            const filePath = fileResult.filePaths[0];
            const name = filePath.split('\\').pop();
            setFileName(name);
            setStatusMessage(`تم اختيار الملف: ${name}. جاري قراءة ومعالجة البيانات...`);

            const readResult = await window.electronAPI.readExcelFile(filePath);

            if (readResult.success) {
                const rawData = readResult.data;

                // --- معالجة البيانات باستخدام الخدمة ---
                setStatusMessage('جاري معالجة البيانات...');
                const processedData = await processData(rawData);

                // إرسال جميع البيانات المعالجة إلى المكون الرئيسي (App.jsx)
                onDataProcessed(processedData);

                setStatusMessage(`تم استيراد ومعالجة البيانات بنجاح!`);
            } else {
                setStatusMessage(`فشل في قراءة الملف: ${readResult.error}`);
            }
        } catch (error) {
            console.error("Processing Error:", error);
            setStatusMessage(`حدث خطأ غير متوقع: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>استيراد البيانات من ملف Excel</Title>
            <p>يرجى اختيار ملف Excel الذي يحتوي على بيانات المشتريات، المبيعات، المخزون، وأرصدة الموردين.</p>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button type="primary" size="large" onClick={handleFileSelect} loading={isLoading}>
                    اختر ملف Excel
                </Button>

                {fileName && <Alert message="الملف المختار" description={<Text strong>{fileName}</Text>} type="info" showIcon />}
                {statusMessage && <Alert message="الحالة" description={statusMessage} type={statusMessage.includes('فشل') || statusMessage.includes('خطأ') ? 'error' : 'success'} showIcon />}
            </Space>
        </div>
    );
}

export default ImportDataPage;