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

// استيراد اداة التحقق من الصحة
import { validateAllTables, normalizeData } from '../validator/schemaValidator';

const { Title, Text } = Typography;

function ImportDataPage({ onDataProcessed }) {
    const [fileName, setFileName] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // دالة مساعدة لتحديد فهرس العمود بناءً على اسم العمود
    const getColumnIndex = (headers, columnName) => {
        return headers.indexOf(columnName);
    };

    // دالة مساعدة لطباعة محتوى البيانات بشكل منظم
    const debugPrintData = (data, title) => {
        console.log(`=== ${title} ===`);
        if (!data || data.length === 0) {
            console.log('No data available');
            return;
        }
        console.log('Headers:', data[0]);
        console.log('Row count:', data.length - 1); // -1 for header row
        if (data.length > 1) {
            console.log('First few rows:');
            for (let i = 1; i < Math.min(4, data.length); i++) {
                console.log(`  Row ${i}:`, data[i]);
            }
        }
    };

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
                
                // Debug print raw data
                debugPrintData(rawData.purchases, 'RAW PURCHASES DATA');
                debugPrintData(rawData.sales, 'RAW SALES DATA');
                debugPrintData(rawData.physicalInventory, 'RAW PHYSICAL INVENTORY DATA');
                debugPrintData(rawData.supplierbalances, 'RAW SUPPLIER BALANCES DATA');
                
                // --- التحقق من صحة البيانات ---
                console.log('بدء التحقق من صحة البيانات');
                const validationResults = validateAllTables(rawData);
                console.log('Validation results:', validationResults);
                
                if (!validationResults.isValid) {
                    console.error('فشل التحقق من صحة البيانات:', validationResults.errors);
                    setStatusMessage(`فشل التحقق من صحة البيانات: ${validationResults.errors.join(', ')}`);
                    setIsLoading(false);
                    return;
                }
                
                console.log('بيانات صالحة، بدء المعالجة');
                
                // --- التحقق من كفاية البيانات لإنشاء التقارير ---
                const dataSufficiencyCheck = checkDataSufficiency(rawData);
                console.log('Data sufficiency check:', dataSufficiencyCheck);
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
                    supplierbalances: normalizeData(rawData.supplierbalances, 'supplierbalances')
                };
                
                // Debug print normalized data
                debugPrintData(normalizedData.purchases, 'NORMALIZED PURCHASES DATA');
                debugPrintData(normalizedData.sales, 'NORMALIZED SALES DATA');
                debugPrintData(normalizedData.physicalInventory, 'NORMALIZED PHYSICAL INVENTORY DATA');
                debugPrintData(normalizedData.supplierbalances, 'NORMALIZED SUPPLIER BALANCES DATA');
                
                // --- التحقق من وجود الحقول المالية المطلوبة وصحتها ---
                const financialDataCheck = checkFinancialDataIntegrity(normalizedData);
                console.log('Financial data check:', financialDataCheck);
                if (!financialDataCheck.isValid) {
                    console.error('بيانات مالية غير صحيحة:', financialDataCheck.errors);
                    setStatusMessage(`بيانات مالية غير صحيحة: ${financialDataCheck.errors.join(', ')}`);
                    setIsLoading(false);
                    return;
                }
                
                // --- مرحلة المعالجة المتسلسلة ---
                
                // 1. معالجة المشتريات
                console.log('Raw purchases data:', normalizedData.purchases);
                console.log('Raw sales data:', normalizedData.sales);
                
                // تحديد فهارس الأعمدة بشكل ديناميكي
                let purchaseOperationTypeIndex = -1;
                let salesOperationTypeIndex = -1;
                
                if (normalizedData.purchases && normalizedData.purchases.length > 0) {
                    const purchaseHeaders = normalizedData.purchases[0];
                    purchaseOperationTypeIndex = getColumnIndex(purchaseHeaders, 'نوع العملية');
                    console.log('Purchase headers:', purchaseHeaders);
                    console.log('Purchase operation type index:', purchaseOperationTypeIndex);
                }
                
                if (normalizedData.sales && normalizedData.sales.length > 0) {
                    const salesHeaders = normalizedData.sales[0];
                    salesOperationTypeIndex = getColumnIndex(salesHeaders, 'نوع العملية');
                    console.log('Sales headers:', salesHeaders);
                    console.log('Sales operation type index:', salesOperationTypeIndex);
                }
                
                // تصفية المشتريات والمرتجعات بشكل ديناميكي
                let allPurchases = [];
                let purchaseReturns = [];
                
                if (normalizedData.purchases && normalizedData.purchases.length > 0 && purchaseOperationTypeIndex !== -1) {
                    console.log('Filtering purchases using dynamic column index...');
                    allPurchases = normalizedData.purchases.filter(row => {
                        const value = row[purchaseOperationTypeIndex];
                        const result = value && value.toString().trim() === 'مشتريات';
                        console.log(`Row operation type: "${value}", Filter result: ${result}`);
                        return result;
                    });
                    purchaseReturns = normalizedData.purchases.filter(row => {
                        const value = row[purchaseOperationTypeIndex];
                        const result = value && value.toString().trim() === 'مرتجع';
                        console.log(`Row operation type: "${value}", Filter result: ${result}`);
                        return result;
                    });
                } else {
                    console.log('Filtering purchases using fallback method...');
                    // إذا لم نتمكن من تحديد الفهرس، نستخدم الطريقة القديمة كاحتياطي
                    allPurchases = normalizedData.purchases.filter(row => row[9] === 'مشتريات');
                    purchaseReturns = normalizedData.purchases.filter(row => row[9] === 'مرتجع');
                }
                
                console.log('Filtered purchases:', allPurchases.length, 'returns:', purchaseReturns.length);
                console.log('Sample purchases:', allPurchases.slice(0, 2));
                console.log('Sample purchase returns:', purchaseReturns.slice(0, 2));
                
                const netPurchasesResult = calculateNetPurchases(allPurchases, purchaseReturns);
                console.log('Net purchases result:', netPurchasesResult);

                // 2. معالجة المبيعات
                let allSales = [];
                let salesReturns = [];
                
                if (normalizedData.sales && normalizedData.sales.length > 0 && salesOperationTypeIndex !== -1) {
                    console.log('Filtering sales using dynamic column index...');
                    allSales = normalizedData.sales.filter(row => {
                        const value = row[salesOperationTypeIndex];
                        const result = value && value.toString().trim() === 'مبيعات';
                        console.log(`Row operation type: "${value}", Filter result: ${result}`);
                        return result;
                    });
                    salesReturns = normalizedData.sales.filter(row => {
                        const value = row[salesOperationTypeIndex];
                        const result = value && value.toString().trim() === 'مرتجع';
                        console.log(`Row operation type: "${value}", Filter result: ${result}`);
                        return result;
                    });
                } else {
                    console.log('Filtering sales using fallback method...');
                    // إذا لم نتمكن من تحديد الفهرس، نستخدم الطريقة القديمة كاحتياطي
                    allSales = normalizedData.sales.filter(row => row[8] === 'مبيعات');
                    salesReturns = normalizedData.sales.filter(row => row[8] === 'مرتجع');
                }
                
                console.log('Filtered sales:', allSales.length, 'returns:', salesReturns.length);
                console.log('Sample sales:', allSales.slice(0, 2));
                console.log('Sample sales returns:', salesReturns.slice(0, 2));
                
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
                
                console.log('=== PROCESSING RESULTS SUMMARY ===');
                console.log('Net Purchases List:', netPurchasesResult.netPurchasesList?.length || 0);
                console.log('Net Purchases Orphan Returns:', netPurchasesResult.orphanReturnsList?.length || 0);
                console.log('Net Sales List:', netSalesResult.netSalesList?.length || 0);
                console.log('Net Sales Orphan Returns:', netSalesResult.orphanReturnsList?.length || 0);
                console.log('Physical Inventory List:', physicalInventoryResult.processedList?.length || 0);
                console.log('Ending Inventory List:', endingInventoryResult.endingInventoryList?.length || 0);
                console.log('Book Inventory List:', bookInventoryResult?.length || 0);
                console.log('Excess Inventory List:', excessInventoryResult?.length || 0);
                console.log('Sales Cost List:', salesCostResult?.costOfSalesList?.length || 0);
                console.log('Suppliers Payables List:', suppliersPayablesResult?.length || 0);
                
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
            setStatusMessage(`حدث خطا غير متوقع: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // دالة للتحقق من كفاية البيانات لإنشاء التقارير
    const checkDataSufficiency = (rawData) => {
        const errors = [];
        let isSufficient = true;
        
        // التحقق من توفر ملفات الإدخال الاربعة
        const requiredTables = ['purchases', 'sales', 'physicalInventory', 'supplierbalances'];
        for (const table of requiredTables) {
            if (!rawData[table] || rawData[table].length < 2) { // Header + at least 1 row
                errors.push(`بيانات ${table} مفقودة او فارغة`);
                isSufficient = false;
            }
        }
        
        // التحقق من وجود بيانات كافية في كل جدول
        if (rawData.purchases && rawData.purchases.length < 2) {
            errors.push('بيانات المشتريات غير كافية (يجب ان تحتوي على صفوف بيانات)');
            isSufficient = false;
        }
        
        if (rawData.sales && rawData.sales.length < 2) {
            errors.push('بيانات المبيعات غير كافية (يجب ان تحتوي على صفوف بيانات)');
            isSufficient = false;
        }
        
        if (rawData.physicalInventory && rawData.physicalInventory.length < 2) {
            errors.push('بيانات الجرد الفعلي غير كافية (يجب ان تحتوي على صفوف بيانات)');
            isSufficient = false;
        }
        
        if (rawData.supplierbalances && rawData.supplierbalances.length < 2) {
            errors.push('بيانات ارصدة الموردين غير كافية (يجب ان تحتوي على صفوف بيانات)');
            isSufficient = false;
        }
        
        return { isSufficient, errors };
    };
    
    // دالة للتحقق من سلامة البيانات المالية
    const checkFinancialDataIntegrity = (normalizedData) => {
        const errors = [];
        let isValid = true;
        
        // التحقق من ان الكميات والافرادي ارقام صحيحة موجبة
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
                
                // التحقق من الافرادي
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
        
        // التحقق من ان جميع النتائج موجودة وليست فارغة
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
            <p>يرجى اختيار ملف Excel الذي يحتوي على بيانات المشتريات، المبيعات، المخزون، وارصدة الموردين.</p>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button type="primary" size="large" onClick={handleFileSelect} loading={isLoading}>
                    اختر ملف Excel
                </Button>

                {fileName && <Alert message="الملف المختار" description={<Text strong>{fileName}</Text>} type="info" showIcon />}
                {statusMessage && <Alert message="الحالة" description={statusMessage} type={statusMessage.includes('فشل') || statusMessage.includes('خطا') ? 'error' : 'success'} showIcon />}
            </Space>
        </div>
    );
}

export default ImportDataPage;