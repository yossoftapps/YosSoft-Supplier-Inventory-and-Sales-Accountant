/**
 * أمثلة عملية لاستخدام التحسينات الجديدة
 * يمكن استخدام هذه الأمثلة كمرجع للتكامل مع المشروع
 */

// ============================================================
// 1. استخدام Web Worker لمعالجة البيانات
// ============================================================

// Web Workers تم إزالتها لتحسين التوافق مع كائنات Decimal
// import { dataProcessorWorker } from './utils/dataProcessorWorker';

/**
 * مثال 1: معالجة بيانات كبيرة في الخلفية
 */
async function processLargeDataset() {
    // لا تهيئة Worker بعد الآن
    console.log('جاري معالجة البيانات...');

    // محاكاة تقدم العملية
    for (let i = 0; i <= 100; i += 10) {
        console.log(`التقدم: ${i}%`);
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    try {
        // معالجة البيانات - بدون Web Workers
        const result = processHeavyDataSync(largeDataArray, {
            batchSize: 1000,
            processor: (item) => {
                // معالجة كل عنصر
                return {
                    ...item,
                    processed: true,
                    total: item.price * item.quantity
                };
            }
        });

        console.log('تمت المعالجة بنجاح:', result);
        return result;

    } catch (error) {
        console.error('خطأ في المعالجة:', error);
    }
}

/**
 * مثال 2: تصفية وترتيب البيانات
 */
async function filterAndSortData(data) {
    try {
        // تصفية البيانات - بدون Web Workers
        const filtered = filterDataSync(data, {
            status: 'active',
            category: ['electronics', 'computers']
        });

        // ترتيب النتائج - بدون Web Workers
        const sorted = sortDataSync(
            filtered,
            'price',
            'desc'
        );

        return sorted;

    } catch (error) {
        console.error('خطأ في التصفية والترتيب:', error);
    }
}

/**
 * مثال 3: تجميع البيانات وحساب المجاميع
 */
async function aggregateData(salesData) {
    try {
        // تجميع حسب الفئة - بدون Web Workers
        const grouped = aggregateDataSync(
            salesData,
            'category',
            {
                totalSales: 'sum',
                avgPrice: 'avg',
                itemCount: 'count'
            }
        );

        // حساب المجاميع الإجمالية - بدون Web Workers
        const totals = calculateTotalsSync(
            salesData,
            ['amount', 'quantity', 'profit']
        );

        return { grouped, totals };

    } catch (error) {
        console.error('خطأ في التجميع:', error);
    }
}

// ============================================================
// 2. استخدام نظام توليد التقارير
// ============================================================

import { reportGenerator } from './utils/reportGenerator';

/**
 * مثال 4: إنشاء وتصدير تقرير المبيعات
 */
async function generateSalesReport(salesData) {
    try {
        // تسجيل قالب التقرير
        reportGenerator.registerTemplate('sales', {
            name: 'تقرير المبيعات الشهري',
            description: 'تقرير شامل للمبيعات'
        });

        // إنشاء التقرير
        const report = await reportGenerator.generateReport(
            'sales',
            salesData,
            {
                filters: {
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                },
                sortBy: 'amount',
                sortOrder: 'desc',
                calculateTotals: true,
                totalFields: ['amount', 'quantity', 'profit']
            }
        );

        console.log('التقرير:', report);

        // تصدير بصيغ مختلفة
        reportGenerator.exportToCSV(report, 'sales-report.csv');
        reportGenerator.exportToJSON(report, 'sales-report.json');
        reportGenerator.exportToHTML(report, 'sales-report.html');

        return report;

    } catch (error) {
        console.error('خطأ في إنشاء التقرير:', error);
    }
}

/**
 * مثال 5: تقرير مع تجميع متقدم
 */
async function generateGroupedReport(inventoryData) {
    try {
        const report = await reportGenerator.generateReport(
            'inventory',
            inventoryData,
            {
                groupBy: 'category',
                aggregations: {
                    totalValue: 'sum',
                    avgPrice: 'avg',
                    itemCount: 'count'
                },
                sortBy: 'totalValue',
                sortOrder: 'desc'
            }
        );

        return report;

    } catch (error) {
        console.error('خطأ في التقرير المجمّع:', error);
    }
}

// ============================================================
// 3. استخدام IndexedDB المحسّن
// ============================================================

import { cacheManager } from './utils/indexedDbManager';

/**
 * مثال 6: البحث باستخدام الفهارس
 */
async function searchReportsByDate(startDate, endDate) {
    try {
        // البحث بنطاق تاريخي
        const results = await cacheManager.indexedDbManager.searchByIndexRange(
            'reports',
            'createdAt',
            startDate.getTime(),
            endDate.getTime()
        );

        console.log('التقارير المطابقة:', results);
        return results;

    } catch (error) {
        console.error('خطأ في البحث:', error);
    }
}

/**
 * مثال 7: القراءة بالدفعات
 */
async function processAllReports() {
    try {
        let processedCount = 0;

        const totalProcessed = await cacheManager.indexedDbManager.getBatchedData(
            'reports',
            100, // حجم الدفعة
            async (batch, start, end) => {
                console.log(`معالجة الدفعة من ${start} إلى ${end}`);

                // معالجة كل دفعة
                for (const report of batch) {
                    // معالجة التقرير
                    processedCount++;
                }

                // تحديث واجهة المستخدم
                updateProgressBar((end / totalReports) * 100);
            }
        );

        console.log(`تمت معالجة ${totalProcessed} تقرير`);
        return processedCount;

    } catch (error) {
        console.error('خطأ في المعالجة بالدفعات:', error);
    }
}

/**
 * مثال 8: حفظ واسترجاع عدة عناصر
 */
async function batchSaveAndRetrieve() {
    try {
        // حفظ عدة تقارير دفعة واحدة
        const items = [
            { key: 'report1', value: { name: 'تقرير 1', data: [] }, ttl: 3600000 },
            { key: 'report2', value: { name: 'تقرير 2', data: [] }, ttl: 3600000 },
            { key: 'report3', value: { name: 'تقرير 3', data: [] }, ttl: 3600000 }
        ];


        const savedCount = await cacheManager.indexedDbManager.setMultiple(
            'reports',
            items
        );

        console.log(`تم حفظ ${savedCount} تقرير`);

        // استرجاع عدة تقارير
        const keys = ['report1', 'report2', 'report3'];
        const reports = await cacheManager.indexedDbManager.getMultiple(
            'reports',
            keys
        );

        console.log('التقارير المسترجعة:', reports);
        return reports;

    } catch (error) {
        console.error('خطأ في الحفظ/الاسترجاع:', error);
    }
}

// ============================================================
// 4. استخدام مكونات UI المحسّنة
// ============================================================

import React, { useState, useEffect } from 'react';
import EnhancedCard, { StatCard, CollapsibleCard, ActionCard } from './components/EnhancedCard';
import {
    LoadingScreen,
    CircularProgress,
    CardSkeleton,
    LoadingOverlay
} from './components/LoadingComponents';

/**
 * مثال 9: لوحة تحكم بالبطاقات الإحصائية
 */
function DashboardExample() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);
            const data = await fetchDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('خطأ في تحميل الإحصائيات:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <CardSkeleton count={4} />;
    }

    return (
        <div className="dashboard-grid">
            <StatCard
                title="إجمالي المبيعات"
                value={`${stats.totalSales.toLocaleString('ar-SA')} ر.س`}
                change="+12.5%"
                changeType="positive"
                icon={<SalesIcon />}
                onClick={() => navigateToSales()}
            />

            <StatCard
                title="عدد الطلبات"
                value={stats.orderCount.toLocaleString('ar-SA')}
                change="+8.3%"
                changeType="positive"
                icon={<OrdersIcon />}
            />

            <StatCard
                title="متوسط قيمة الطلب"
                value={`${stats.avgOrderValue.toLocaleString('ar-SA')} ر.س`}
                change="-2.1%"
                changeType="negative"
                icon={<AvgIcon />}
            />

            <StatCard
                title="العملاء الجدد"
                value={stats.newCustomers.toLocaleString('ar-SA')}
                change="0%"
                changeType="neutral"
                icon={<CustomersIcon />}
            />
        </div>
    );
}

/**
 * مثال 10: بطاقة تقرير مع إجراءات
 */
function ReportCardExample({ report }) {
    const [exporting, setExporting] = useState(false);

    async function handleExport(format) {
        try {
            setExporting(true);

            if (format === 'csv') {
                reportGenerator.exportToCSV(report, `${report.type}-report.csv`);
            } else if (format === 'html') {
                reportGenerator.exportToHTML(report, `${report.type}-report.html`);
            }

        } catch (error) {
            console.error('خطأ في التصدير:', error);
        } finally {
            setExporting(false);
        }
    }

    return (
        <ActionCard
            title={report.metadata.template}
            subtitle={`تم الإنشاء: ${new Date(report.metadata.generatedAt).toLocaleDateString('ar-SA')}`}
            icon={<ReportIcon />}
            actions={[
                {
                    label: 'تصدير CSV',
                    onClick: () => handleExport('csv'),
                    icon: <ExportIcon />,
                    disabled: exporting
                },
                {
                    label: 'تصدير HTML',
                    onClick: () => handleExport('html'),
                    icon: <ExportIcon />,
                    disabled: exporting
                },
                {
                    label: 'عرض',
                    onClick: () => viewReport(report),
                    primary: true,
                    icon: <ViewIcon />
                }
            ]}
        >
            <div className="report-summary">
                <p>عدد السجلات: {report.metadata.recordCount.toLocaleString('ar-SA')}</p>
                {report.totals && (
                    <div className="totals">
                        {Object.entries(report.totals).map(([key, value]) => (
                            <p key={key}>
                                <strong>{key}:</strong> {value.toLocaleString('ar-SA')}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        </ActionCard>
    );
}

/**
 * مثال 11: معالجة بيانات مع شاشة تحميل
 */
function DataProcessingExample() {
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    async function processData() {
        try {
            setProcessing(true);
            setProgress(0);

            // تهيئة Worker
            dataProcessorWorker.initialize();
            dataProcessorWorker.setProgressCallback((prog) => {
                setProgress(parseFloat(prog.percent));
            });

            // معالجة البيانات
            const result = await dataProcessorWorker.processHeavyData(
                largeDataset,
                { batchSize: 1000 }
            );

            console.log('تمت المعالجة:', result);

        } catch (error) {
            console.error('خطأ:', error);
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    }

    return (
        <div>
            <button onClick={processData} disabled={processing}>
                معالجة البيانات
            </button>

            <LoadingScreen
                visible={processing}
                message="جاري معالجة البيانات..."
                submessage="قد يستغرق هذا بضع دقائق"
                progress={progress}
            />
        </div>
    );
}

/**
 * مثال 12: بطاقة قابلة للطي مع تفاصيل
 */
function DetailsCardExample({ item }) {
    return (
        <CollapsibleCard
            title={item.name}
            icon={<InfoIcon />}
            defaultExpanded={false}
        >
            <div className="item-details">
                <p><strong>الكود:</strong> {item.code}</p>
                <p><strong>الفئة:</strong> {item.category}</p>
                <p><strong>السعر:</strong> {item.price.toLocaleString('ar-SA')} ر.س</p>
                <p><strong>الكمية:</strong> {item.quantity}</p>
                <p><strong>الإجمالي:</strong> {(item.price * item.quantity).toLocaleString('ar-SA')} ر.س</p>
            </div>
        </CollapsibleCard>
    );
}

// ============================================================
// 5. دمج جميع التحسينات معاً
// ============================================================

/**
 * مثال 13: صفحة تقرير متكاملة
 */
function IntegratedReportPage() {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [report, setReport] = useState(null);
    const [rawData, setRawData] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);

            // محاولة تحميل من الذاكرة المؤقتة
            const cached = await cacheManager.get('reports', 'latest-sales');

            if (cached) {
                setReport(cached);
                setLoading(false);
                return;
            }

            // تحميل البيانات الخام
            const data = await fetchRawData();
            setRawData(data);

            // معالجة البيانات
            await processAndGenerateReport(data);

        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
        } finally {
            setLoading(false);
        }
    }

    async function processAndGenerateReport(data) {
        try {
            setProcessing(true);
            setProgress(0);

            // تهيئة Worker
            dataProcessorWorker.initialize();
            dataProcessorWorker.setProgressCallback((prog) => {
                setProgress(parseFloat(prog.percent));
            });

            // معالجة البيانات - بدون Web Workers
            const processed = processHeavyDataSync(data, { batchSize: 1000 });
            
            // محاكاة تقدم العملية
            for (let i = 0; i <= 100; i += 10) {
                setProgress(i);
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // إنشاء التقرير
            const generatedReport = await reportGenerator.generateReport(
                'sales',
                processed,
                {
                    sortBy: 'amount',
                    sortOrder: 'desc',
                    calculateTotals: true,
                    totalFields: ['amount', 'quantity', 'profit']
                }
            );

            setReport(generatedReport);

            // حفظ في الذاكرة المؤقتة
            await cacheManager.set('reports', 'latest-sales', generatedReport, 3600000);

        } catch (error) {
            console.error('خطأ في المعالجة:', error);
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    }

    if (loading) {
        return <LoadingScreen message="جاري تحميل التقرير..." />;
    }

    return (
        <div className="report-page">
            <LoadingOverlay
                visible={processing}
                message="جاري معالجة البيانات..."
            />

            {processing && (
                <div className="progress-section">
                    <CircularProgress progress={progress} size={120} />
                </div>
            )}

            {report && (
                <>
                    <ReportCardExample report={report} />

                    <div className="report-stats">
                        <StatCard
                            title="إجمالي المبلغ"
                            value={`${report.totals?.amount?.toLocaleString('ar-SA')} ر.س`}
                            icon={<MoneyIcon />}
                        />
                        <StatCard
                            title="إجمالي الكمية"
                            value={report.totals?.quantity?.toLocaleString('ar-SA')}
                            icon={<QuantityIcon />}
                        />
                        <StatCard
                            title="الربح"
                            value={`${report.totals?.profit?.toLocaleString('ar-SA')} ر.س`}
                            icon={<ProfitIcon />}
                        />
                    </div>

                    <div className="report-data">
                        {report.data.map((item, index) => (
                            <DetailsCardExample key={index} item={item} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export {
    processLargeDataset,
    filterAndSortData,
    aggregateData,
    generateSalesReport,
    generateGroupedReport,
    searchReportsByDate,
    processAllReports,
    batchSaveAndRetrieve,
    DashboardExample,
    ReportCardExample,
    DataProcessingExample,
    DetailsCardExample,
    IntegratedReportPage
};
