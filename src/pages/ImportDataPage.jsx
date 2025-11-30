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

// استيراد أداة التحقق من الصحة
import { validateAllTables, normalizeData } from '../validator/schemaValidator';

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
                
                // --- التحقق من صحة البيانات ---
                console.log('بدء التحقق من صحة البيانات');
                const validationResults = validateAllTables(rawData);
                
                if (!validationResults.isValid) {
                    console.error('فشل التحقق من صحة البيانات:', validationResults.errors);
                    setStatusMessage(`فشل التحقق من صحة البيانات: ${validationResults.errors.join(', ')}`);
                    setIsLoading(false);
                    return;
                }
                
                console.log('بيانات صالحة، بدء المعالجة');
                
                // --- التحقق من كفاية البيانات لإنشاء التقارير ---
                const dataSufficiencyCheck = checkDataSufficiency(rawData);
                if (!dataSufficiencyCheck.isSufficient) {
                    console.error('بيانات غير كافية لإنشاء التقارير:', dataSufficiencyCheck.errors);
                    setStatusMessage(`بيانات غير كافية لإنشاء التقارير: ${dataSufficiencyCheck.errors.join(', ')}`);
                    setIsLoading(false);
                    return;
                }
                
                // --- تطبيع البيانات ---
                const normalizedData = {
                    purchases: normalizeData(rawData.purchases, 'purchases'),
                    sales: normalizeData(rawData.sales, 'sales'),
                    physicalInventory: normalizeData(rawData.physicalInventory, 'physicalInventory'),
                    supplierbalances: normalizeData(rawData.supplierbalances, 'supplierBalances')
                };
                
                // --- التحقق من وجود الحقول المالية المطلوبة وصحتها ---
                const financialDataCheck = checkFinancialDataIntegrity(normalizedData);
                if (!financialDataCheck.isValid) {
                    console.error('بيانات مالية غير صحيحة:', financialDataCheck.errors);
                    setStatusMessage(`بيانات مالية غير صحيحة: ${financialDataCheck.errors.join(', ')}`);
                    setIsLoading(false);
                    return;
                }
                
                // --- مرحلة المعالجة المتسلسلة ---

                // 1. معالجة المشتريات
                console.log('Raw purchases data:', normalizedData.purchases);
                const allPurchases = normalizedData.purchases.filter(row => row[9] === 'مشتريات');
                const purchaseReturns = normalizedData.purchases.filter(row => row[9] === 'مرتجع');
                console.log('Filtered purchases:', allPurchases.length, 'returns:', purchaseReturns.length);
                const netPurchasesResult = calculateNetPurchases(allPurchases, purchaseReturns);
                console.log('Net purchases result:', netPurchasesResult);

                // 2. معالجة المبيعات
                const allSales = normalizedData.sales.filter(row => row[8] === 'مبيعات');
                const salesReturns = normalizedData.sales.filter(row => row[8] === 'مرتجع');
                const netSalesResult = calculateNetSales(allSales, salesReturns);

                // 3. معالجة الجرد الفعلي
                const physicalInventoryResult = processPhysicalInventory(normalizedData.physicalInventory);

                // 4. معالجة فائض المخزون
                const excessInventoryResult = calculateExcessInventory(normalizedData.physicalInventory, normalizedData.sales);

                // 5. معالجة المخزون النهائي (يعتمد على نتائج سابقة)
                const endingInventoryResult = calculateEndingInventory(netPurchasesResult, physicalInventoryResult, excessInventoryResult);

                // 6. معالجة تكلفة المبيعات (يعتمد على نتائج سابقة)
                const salesCostResult = calculateSalesCost(netPurchasesResult, netSalesResult);

                // 7. معالجة استحقاق الموردين (يعتمد على نتائج سابقة)
                const suppliersPayablesResult = calculateSupplierPayables(normalizedData.supplierbalances, endingInventoryResult.endingInventoryList);

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

                // --- التحقق النهائي من نتائج المعالجة ---
                const processingResultsCheck = checkProcessingResults([
                    netPurchasesResult,
                    netSalesResult,
                    physicalInventoryResult,
                    excessInventoryResult,
                    endingInventoryResult,
                    salesCostResult,
                    suppliersPayablesResult,
                    bookInventoryResult
                ]);
                
                if (!processingResultsCheck.isValid) {
                    console.error('نتائج المعالجة غير صحيحة:', processingResultsCheck.errors);
                    setStatusMessage(`نتائج المعالجة غير صحيحة: ${processingResultsCheck.errors.join(', ')}`);
                    setIsLoading(false);
                    return;
                }

                // إرسال جميع البيانات المعالجة إلى المكون الرئيسي (App.jsx)
                onDataProcessed({
                    raw: normalizedData,
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
    
    // دالة للتحقق من كفاية البيانات لإنشاء التقارير
    const checkDataSufficiency = (rawData) => {
        const errors = [];
        let isSufficient = true;
        
        // التحقق من توفر ملفات الإدخال الأربعة
        const requiredTables = ['purchases', 'sales', 'physicalInventory', 'supplierbalances'];
        for (const table of requiredTables) {
            if (!rawData[table] || rawData[table].length < 2) { // Header + at least 1 row
                errors.push(`بيانات ${table} مفقودة أو فارغة`);
                isSufficient = false;
            }
        }
        
        // التحقق من وجود بيانات كافية في كل جدول
        if (rawData.purchases && rawData.purchases.length < 2) {
            errors.push('بيانات المشتريات غير كافية (يجب أن تحتوي على صفوف بيانات)');
            isSufficient = false;
        }
        
        if (rawData.sales && rawData.sales.length < 2) {
            errors.push('بيانات المبيعات غير كافية (يجب أن تحتوي على صفوف بيانات)');
            isSufficient = false;
        }
        
        if (rawData.physicalInventory && rawData.physicalInventory.length < 2) {
            errors.push('بيانات الجرد الفعلي غير كافية (يجب أن تحتوي على صفوف بيانات)');
            isSufficient = false;
        }
        
        if (rawData.supplierbalances && rawData.supplierbalances.length < 2) {
            errors.push('بيانات أرصدة الموردين غير كافية (يجب أن تحتوي على صفوف بيانات)');
            isSufficient = false;
        }
        
        return { isSufficient, errors };
    };
    
    // دالة للتحقق من سلامة البيانات المالية
    const checkFinancialDataIntegrity = (normalizedData) => {
        const errors = [];
        let isValid = true;
        
        // التحقق من أن الكميات والأفرادي أرقام صحيحة موجبة
        const checkFinancialFields = (data, tableName) => {
            if (!data || data.length < 2) return;
            
            const headers = data[0];
            const quantityIndex = headers.indexOf('الكمية');
            const unitPriceIndex = headers.indexOf('الافرادي');
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                
                // التحقق من الكمية
                if (quantityIndex !== -1 && quantityIndex < row.length) {
                    const quantity = parseFloat(row[quantityIndex]);
                    if (isNaN(quantity) || quantity <= 0) {
                        errors.push(`كمية غير صحيحة في صف ${i} لجدول ${tableName}: ${row[quantityIndex]}`);
                        isValid = false;
                    }
                }
                
                // التحقق من الأفرادي
                if (unitPriceIndex !== -1 && unitPriceIndex < row.length) {
                    const unitPrice = parseFloat(row[unitPriceIndex]);
                    if (isNaN(unitPrice) || unitPrice < 0) {
                        errors.push(`سعر وحدة غير صحيح في صف ${i} لجدول ${tableName}: ${row[unitPriceIndex]}`);
                        isValid = false;
                    }
                }
            }
        };
        
        checkFinancialFields(normalizedData.purchases, 'المشتريات');
        checkFinancialFields(normalizedData.sales, 'المبيعات');
        
        return { isValid, errors };
    };
    
    // دالة للتحقق من نتائج المعالجة
    const checkProcessingResults = (results) => {
        const errors = [];
        let isValid = true;
        
        // التحقق من أن جميع النتائج موجودة وليست فارغة
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result) {
                errors.push(`نتيجة المعالجة ${i+1} فارغة`);
                isValid = false;
            }
        }
        
        return { isValid, errors };
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