import React, { useState, useRef, useEffect } from 'react';
import { Button, Upload, message, Typography, Space, Alert } from 'antd';
import { UploadOutlined, FileExcelOutlined } from '@ant-design/icons';

// استيراد منطق المعالجة
import { calculateNetPurchases } from '../logic/netPurchasesLogic';
import { calculateNetSales } from '../logic/netSalesLogic';
import { processPhysicalInventory } from '../logic/physicalInventoryLogic';
import { calculateExcessInventory } from '../logic/excessInventoryLogic';
import { calculateEndingInventory } from '../logic/endingInventoryLogic';
import { calculateSalesCost } from '../logic/salesCostLogic';
import { calculateSupplierPayables } from '../logic/supplierPayablesLogic';
import { calculateBookInventory } from '../logic/bookInventoryLogic';
import { calculateAbnormalItems } from '../logic/abnormalItemsLogic';
import { calculateMainAccountsSummary } from '../logic/mainAccountsLogic';
import { calculatePreparingReturns } from '../logic/preparingReturnsLogic';
import { enrichNetPurchases } from '../logic/enrichmentLogic';
import { checkDataSufficiency } from '../logic/dataSufficiencyChecker';
import { checkFinancialDataIntegrity } from '../logic/financialIntegrityChecker';

// استيراد اداة التحقق من الصحة
import { validateAllTables, normalizeData } from '../validator/schemaValidator';

const { Title, Text } = Typography;

function ImportDataPage({ onDataProcessed }) {
    const [fileName, setFileName] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [diagnostics, setDiagnostics] = useState(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

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

                    // Provide more user-friendly error messages
                    const userFriendlyErrors = validationResults.errors.map(error => {
                        if (error.includes('الحساب المساعد')) {
                            return 'تحذير: عمود "الحساب المساعد" مفقود في بيانات الموردين. سيتم المتابعة مع تجاهل هذا العمود.';
                        }
                        return error;
                    });

                    // Check if the only error is the missing optional column
                    const isOnlyOptionalColumnMissing = validationResults.errors.length === 1 &&
                        validationResults.errors[0].includes('الحساب المساعد');

                    // If it's only the optional column missing, we can continue
                    if (!isOnlyOptionalColumnMissing) {
                        setStatusMessage(`فشل التحقق من صحة البيانات: ${userFriendlyErrors.join(', ')}`);
                        setDiagnostics({ validationResults });
                        setIsLoading(false);
                        return;
                    } else {
                        // Just show a warning but continue processing
                        setStatusMessage(`تحذير: ${userFriendlyErrors[0]} جاري المتابعة في المعالجة...`);
                    }
                }

                console.log('بيانات صالحة، بدء المعالجة');

                // --- التحقق من كفاية البيانات لإنشاء التقارير ---
                const dataSufficiencyCheck = checkDataSufficiency(rawData);
                console.log('Data sufficiency check:', dataSufficiencyCheck);
                if (!dataSufficiencyCheck.isSufficient) {
                    console.error('بيانات غير كافية لإنشاء التقارير:', dataSufficiencyCheck.errors);
                    setStatusMessage(`بيانات غير كافية لإنشاء التقارير: ${dataSufficiencyCheck.errors.join(', ')}`);
                    setDiagnostics((d) => ({ ...(d || {}), dataSufficiencyCheck }));
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
                // Log financial data issues as warnings but continue processing
                if (!financialDataCheck.isValid && financialDataCheck.errors.length > 0) {
                    console.warn('تحذير بيانات مالية:', financialDataCheck.errors);
                    // Display as warning but continue processing
                    setStatusMessage(`تحذير: ${financialDataCheck.errors.join(', ')}. جاري المتابعة في المعالجة...`);
                    setDiagnostics((d) => ({ ...(d || {}), financialDataCheck }));
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
                // 1. حساب صافي المشتريات (قائمة A + قائمة B)
                setStatusMessage('جاري حساب صافي المشتريات...');
                const netPurchasesResult = await calculateNetPurchases(allPurchases, purchaseReturns, normalizedData.purchases[0]);
                debugPrintData(netPurchasesResult.netPurchasesList, 'Net Purchases Result (A)');
                debugPrintData(netPurchasesResult.orphanReturnsList, 'Orphan Purchase Returns (B)');
                console.log('Sample purchase returns:', purchaseReturns.slice(0, 2));

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

                // Net Sales Combined (List C + List B + List F)
                // قائمة C: صافي المبيعات
                // 3. حساب صافي المبيعات (قائمة C + دمج المرتجعات اليتيمة D)
                setStatusMessage('جاري حساب صافي المبيعات...');
                const netSalesResult = await calculateNetSales(allSales, salesReturns, normalizedData.sales[0]);
                debugPrintData(netSalesResult.netSalesList, 'Net Sales Result (C)');
                debugPrintData(netSalesResult.orphanReturnsList, 'Orphan Sales Returns (D)');

                // 3. معالجة الجرد الفعلي
                // 2. معالجة الجرد الفعلي (قائمة E + قائمة F)
                setStatusMessage('جاري معالجة الجرد الفعلي...');
                const physicalInventoryResult = await processPhysicalInventory(normalizedData.physicalInventory, normalizedData.purchases);
                debugPrintData(physicalInventoryResult.listE, 'Positive Physical Inventory (E)');
                debugPrintData(physicalInventoryResult.listF, 'Negative/Expired Physical Inventory (F)');

                // --- 4. دمج القوائم (Cross Pollination) حسب المنطق المحاسبي ---

                // إضافة معرف فريد (_uid) لتجنب تعارض المعرفات (م) عند الدمج
                if (netPurchasesResult.netPurchasesList) {
                    netPurchasesResult.netPurchasesList.forEach(item => {
                        item._uid = `A_${item['م']}`;
                    });
                }
                if (netSalesResult.netSalesList) {
                    netSalesResult.netSalesList.forEach(item => {
                        item._uid = `C_${item['م']}`;
                    });
                }

                // Net Purchases Combined (List A + List D)
                // قائمة A: صافي المشتريات
                // قائمة D: مرتجعات المبيعات اليتيمة (تعتبر توريد/دخول للمخزون)
                const netPurchasesCombined = [
                    ...(netPurchasesResult.netPurchasesList || []),
                    ...(netSalesResult.orphanReturnsList || []).map(item => ({
                        ...item,
                        القائمة: 'D',
                        ملاحظات: 'مرتجع مبيعات يتيم',
                        _uid: `D_${item['م']}`
                    }))
                ];

                // Net Sales Combined (List C + List B + List F)
                // قائمة C: صافي المبيعات
                // قائمة B: مرتجعات المشتريات اليتيمة (تعتبر خروج من المخزون)
                // قائمة F: الجرد السالب/المنتهي (يعتبر خروج/تالف)
                const netSalesCombined = [
                    ...(netSalesResult.netSalesList || []),
                    ...(netPurchasesResult.orphanReturnsList || []).map(item => ({
                        ...item,
                        القائمة: 'B',
                        ملاحظات: 'مرتجع مشتريات يتيم',
                        _uid: `B_${item['م']}`
                    })),
                    ...(physicalInventoryResult.listF || []).map(item => ({
                        ...item,
                        القائمة: 'F',
                        ملاحظات: item['ملاحظات'] || 'سالب/منتهي',
                        _uid: `F_${item['م']}`
                    }))
                ];

                console.log(`📊 [DataMerging] NetPurchases: ${netPurchasesCombined.length} (A+D), NetSales: ${netSalesCombined.length} (C+B+F)`);

                // 5. معالجة فائض المخزون
                // 4. حساب فائض المخزون
                setStatusMessage('جاري حساب فائض المخزون...');
                const excessInventoryResult = await calculateExcessInventory(
                    normalizedData.physicalInventory,
                    normalizedData.sales,
                    netPurchasesCombined,
                    netSalesCombined
                );

                // 6. معالجة المخزون النهائي
                // يستخدم صافي المشتريات المدمج (A+D) والجرد الفعلي الموجب (E)
                setStatusMessage('جاري حساب المخزون النهائي...');
                const endingInventoryResult = await calculateEndingInventory(
                    netPurchasesCombined,
                    physicalInventoryResult.listE,
                    excessInventoryResult
                );

                // 7. معالجة تكلفة المبيعات
                // يستخدم صافي المشتريات المدمج (A+D) وصافي المبيعات المدمج (C+B+F)
                // 6. حساب تكلفة المبيعات
                setStatusMessage('جاري حساب تكلفة المبيعات...');
                const salesCostResult = await calculateSalesCost(
                    endingInventoryResult.updatedNetPurchasesList,
                    netSalesCombined
                );

                // 7. حساب استحقاقات الموردين
                setStatusMessage('جاري حساب استحقاقات الموردين...');
                const suppliersPayablesResult = await calculateSupplierPayables(
                    normalizedData.supplierbalances,
                    endingInventoryResult.endingInventoryList
                );

                // 9. تقارير تحليلية (تجهيز البيانات فقط)
                // سيتم حسابها عند الطلب في App.jsx لتقليل زمن الانتظار

                // 10. ملخص الحسابات الرئيسية
                // 10. حساب ملخص الحسابات الرئيسية
                setStatusMessage('جاري حساب ملخص الحسابات الرئيسية...');
                const mainAccountsResult = await calculateMainAccountsSummary(suppliersPayablesResult);

                // 11. معالجة الجرد الدفتري
                // يستخدم القيم المدمجة للمقارنة
                setStatusMessage('جاري حساب الجرد الدفتري...');
                const bookInventoryResult = await calculateBookInventory(netPurchasesCombined, netSalesCombined);

                // 9. تجميع الاصناف الشاذة
                setStatusMessage('جاري تجميع الاصناف الشاذة...');
                const abnormalItemsResult = await calculateAbnormalItems(
                    netPurchasesResult,
                    netSalesResult,
                    physicalInventoryResult
                );

                // 12. حساب تجهيز المرتجعات
                setStatusMessage('جاري حساب تجهيز المرتجعات...');
                const preparingReturnsResult = await calculatePreparingReturns(
                    endingInventoryResult.endingInventoryList
                );

                // 13. إثراء تقرير صافي المشتريات (كميات الجرد والمبيعات)
                if (salesCostResult && endingInventoryResult) {
                    const enrichedPurchasesList = enrichNetPurchases(
                        netPurchasesResult.netPurchasesList,
                        salesCostResult.purchaseUsageMap,
                        endingInventoryResult.updatedNetPurchasesList
                    );
                    netPurchasesResult.netPurchasesList = enrichedPurchasesList;
                }

                // تجميع جميع النتائج
                const processedData = {
                    netPurchases: netPurchasesResult,
                    netSales: netSalesResult,
                    physicalInventory: physicalInventoryResult,
                    excessInventory: excessInventoryResult,
                    endingInventory: endingInventoryResult,
                    salesCost: salesCostResult,
                    suppliersPayables: suppliersPayablesResult,
                    bookInventory: bookInventoryResult,
                    abnormalItems: abnormalItemsResult,
                    preparingReturns: preparingReturnsResult,
                    mainAccounts: mainAccountsResult
                };

                console.log('كل البيانات تمت معالجتها بنجاح');
                setStatusMessage('تمت معالجة جميع البيانات بنجاح!');

                // Pass the processed data to the parent component
                onDataProcessed(processedData);

                setIsLoading(false);
            } else {
                console.error('فشل في قراءة الملف:', readResult.error);
                setStatusMessage(`فشل في قراءة الملف: ${readResult.error}`);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('خطأ غير متوقع:', error);
            setStatusMessage(`خطأ غير متوقع: ${error.message}`);
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <Title level={2}>استيراد البيانات</Title>

            {diagnostics && diagnostics.validationResults && (
                <Alert
                    message="نتائج التشخيص"
                    description={
                        <div>
                            {diagnostics.validationResults.errors.map((error, index) => (
                                <div key={index}>{error}</div>
                            ))}
                        </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />
            )}

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Text>اختر ملف Excel يحتوي على البيانات المطلوبة:</Text>

                <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={handleFileSelect}
                    loading={isLoading}
                    size="large"
                >
                    {fileName ? `تغيير الملف: ${fileName}` : 'اختر ملف Excel'}
                </Button>

                {statusMessage && (
                    <Alert
                        message={isLoading ? "جاري المعالجة..." : "الحالة"}
                        description={statusMessage}
                        type={statusMessage.includes('فشل') || statusMessage.includes('خطأ') ? "error" : "info"}
                        showIcon
                    />
                )}

                <div style={{ marginTop: '20px' }}>
                    <Title level={4}>تعليمات الاستيراد:</Title>
                    <ul>
                        <li>يجب أن يحتوي الملف على أوراق باسماء: مشتريات, مبيعات, المخزون, الارصدة</li>
                        <li>تأكد من صحة تنسيق الأعمدة حسب المواصفات المطلوبة</li>
                        <li>الحقول المطلوبة: رمز المادة, الكمية, الافرادي, تاريخ الصلاحية, المورد</li>
                        <li>حجم الملف المدعوم: حتى 50 ميجابايت</li>
                    </ul>
                </div>
            </Space>
        </div>
    );
}

export default ImportDataPage;