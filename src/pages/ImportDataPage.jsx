import React, { useState } from 'react';
import { Button, Typography, Space, Alert, Spin } from 'antd';

// استيراد جميع دوال المنطق
import { calculateNetPurchases } from '../logic/netPurchasesLogic';
import { calculateNetSales } from '../logic/netSalesLogic';
import { processPhysicalInventory } from '../logic/physicalInventoryLogic';
import { calculateExcessInventory } from '../logic/excessInventoryLogic';
import { calculateEndingInventory } from '../logic/endingInventoryLogic';
import { calculateSalesCost } from '../logic/salesCostLogic';
import { calculateSupplierPayables } from '../logic/supplierPayablesLogic';
import { calculateBookInventory } from '../logic/bookInventoryLogic';

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

                // --- مرحلة المعالجة المتسلسلة ---

                // 1. معالجة المشتريات
                const allPurchases = rawData.purchases.filter(row => row[9] === 'مشتريات');
                const purchaseReturns = rawData.purchases.filter(row => row[9] === 'مرتجع');
                const netPurchasesResult = calculateNetPurchases(allPurchases, purchaseReturns);

                // 2. معالجة المبيعات
                const allSales = rawData.sales.filter(row => row[8] === 'مبيعات');
                const salesReturns = rawData.sales.filter(row => row[8] === 'مرتجع');
                const netSalesResult = calculateNetSales(allSales, salesReturns);

                // 3. معالجة الجرد الفعلي
                const physicalInventoryResult = processPhysicalInventory(rawData.physicalInventory);

                // 4. معالجة فائض المخزون
                const excessInventoryResult = calculateExcessInventory(rawData.physicalInventory, rawData.sales);

                // 5. معالجة المخزون النهائي (يعتمد على نتائج سابقة)
                const endingInventoryResult = calculateEndingInventory(netPurchasesResult, physicalInventoryResult, excessInventoryResult);

                // 6. معالجة تكلفة المبيعات (يعتمد على نتائج سابقة)
                const salesCostResult = calculateSalesCost(netPurchasesResult, netSalesResult);

                // 7. معالجة استحقاق الموردين (يعتمد على نتائج سابقة)
                const suppliersPayablesResult = calculateSupplierPayables(rawData.supplierbalances, endingInventoryResult.endingInventoryList);

                // 8. معالجة الجرد الدفتري (يعتمد على نتائج سابقة)
                // دمج قائمة A و B من صافي المشتريات
                const netPurchasesCombined = [
                    ...(netPurchasesResult.netPurchasesList || []),
                    ...(netPurchasesResult.orphanReturnsList || [])
                ];
                
                // دمج قائمة C و D من صافي المبيعات
                const netSalesCombined = [
                    ...(netSalesResult.netSalesList || []),
                    ...(netSalesResult.orphanReturnsList || [])
                ];
                
                const bookInventoryResult = calculateBookInventory(netPurchasesCombined, netSalesCombined);

                // إرسال جميع البيانات المعالجة إلى المكون الرئيسي (App.jsx)
                onDataProcessed({
                    raw: rawData,
                    netPurchases: netPurchasesResult,
                    netSales: netSalesResult,
                    physicalInventory: physicalInventoryResult,
                    endingInventory: endingInventoryResult,
                    bookInventory: bookInventoryResult,
                    excessInventory: excessInventoryResult,
                    salesCost: salesCostResult,
                    suppliersPayables: suppliersPayablesResult,
                });

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