/**
 * مولد التقارير المحسّن
 * يوفر وظائف لإنشاء وتصدير التقارير بكفاءة عالية
 */

import { globalCache } from './performanceOptimizer';

/**
 * فئة مولد التقارير
 */
class ReportGenerator {
    constructor() {
        this.cache = globalCache;
        // Web Workers تم إزالتها لتحسين التوافق مع كائنات Decimal
        // this.worker = dataProcessorWorker;
        this.reportTemplates = new Map();
    }

    /**
     * تسجيل قالب تقرير
     * @param {string} reportType - نوع التقرير
     * @param {Object} template - قالب التقرير
     */
    registerTemplate(reportType, template) {
        this.reportTemplates.set(reportType, template);
    }

    /**
     * إنشاء تقرير
     * @param {string} reportType - نوع التقرير
     * @param {Array} data - البيانات
     * @param {Object} options - خيارات التقرير
     * @returns {Promise<Object>} التقرير المولد
     */
    async generateReport(reportType, data, options = {}) {
        const cacheKey = `report_${reportType}_${JSON.stringify(options)}`;

        // التحقق من وجود التقرير في الذاكرة المؤقتة
        const cachedReport = this.cache.get(cacheKey);
        if (cachedReport && !options.forceRefresh) {
            console.log(`📋 تم استرجاع التقرير من الذاكرة المؤقتة: ${reportType}`);
            return cachedReport;
        }

        console.log(`📊 جاري إنشاء التقرير: ${reportType}`);
        const startTime = performance.now();

        try {
            // الحصول على قالب التقرير
            const template = this.reportTemplates.get(reportType);
            if (!template) {
                throw new Error(`قالب التقرير غير موجود: ${reportType}`);
            }

            // معالجة البيانات
            let processedData = data;

            // تطبيق التصفية إذا كانت موجودة
            if (options.filters && Object.keys(options.filters).length > 0) {
                processedData = await this.worker.filterData(processedData, options.filters);
            }

            // تطبيق الترتيب إذا كان موجوداً
            if (options.sortBy) {
                processedData = await this.worker.sortData(
                    processedData,
                    options.sortBy,
                    options.sortOrder || 'asc'
                );
            }

            // تطبيق التجميع إذا كان موجوداً
            if (options.groupBy) {
                processedData = await this.worker.aggregateData(
                    processedData,
                    options.groupBy,
                    options.aggregations || {}
                );
            }

            // حساب المجاميع إذا كانت مطلوبة
            let totals = null;
            if (options.calculateTotals && options.totalFields) {
                totals = await this.worker.calculateTotals(
                    Array.isArray(processedData) ? processedData : Object.values(processedData).flat(),
                    options.totalFields
                );
            }

            // إنشاء التقرير النهائي
            const report = {
                type: reportType,
                data: processedData,
                totals,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    recordCount: Array.isArray(processedData)
                        ? processedData.length
                        : Object.keys(processedData).length,
                    options,
                    template: template.name || reportType
                }
            };

            // حفظ التقرير في الذاكرة المؤقتة
            this.cache.set(cacheKey, report);

            const endTime = performance.now();
            console.log(`✅ تم إنشاء التقرير في ${(endTime - startTime).toFixed(2)} ms`);

            return report;

        } catch (error) {
            console.error(`❌ خطأ في إنشاء التقرير ${reportType}:`, error);
            throw error;
        }
    }

    /**
     * تصدير التقرير إلى CSV
     * @param {Object} report - التقرير
     * @param {string} filename - اسم الملف
     */
    exportToCSV(report, filename = 'report.csv') {
        try {
            const data = Array.isArray(report.data)
                ? report.data
                : Object.values(report.data).flat();

            if (data.length === 0) {
                throw new Error('لا توجد بيانات للتصدير');
            }

            // الحصول على رؤوس الأعمدة
            const headers = Object.keys(data[0]);

            // إنشاء محتوى CSV
            let csvContent = '\uFEFF'; // BOM for UTF-8
            csvContent += headers.join(',') + '\n';

            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    // معالجة القيم التي تحتوي على فواصل أو علامات اقتباس
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                });
                csvContent += values.join(',') + '\n';
            });

            // تنزيل الملف
            this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');

            console.log(`✅ تم تصدير التقرير إلى CSV: ${filename}`);

        } catch (error) {
            console.error('❌ خطأ في تصدير التقرير إلى CSV:', error);
            throw error;
        }
    }

    /**
     * تصدير التقرير إلى JSON
     * @param {Object} report - التقرير
     * @param {string} filename - اسم الملف
     */
    exportToJSON(report, filename = 'report.json') {
        try {
            const jsonContent = JSON.stringify(report, null, 2);
            this.downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
            console.log(`✅ تم تصدير التقرير إلى JSON: ${filename}`);
        } catch (error) {
            console.error('❌ خطأ في تصدير التقرير إلى JSON:', error);
            throw error;
        }
    }

    /**
     * تصدير التقرير إلى HTML
     * @param {Object} report - التقرير
     * @param {string} filename - اسم الملف
     */
    exportToHTML(report, filename = 'report.html') {
        try {
            const data = Array.isArray(report.data)
                ? report.data
                : Object.values(report.data).flat();

            if (data.length === 0) {
                throw new Error('لا توجد بيانات للتصدير');
            }

            const headers = Object.keys(data[0]);

            let htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.type}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: rtl;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1890ff;
      border-bottom: 3px solid #1890ff;
      padding-bottom: 10px;
    }
    .metadata {
      background: #f0f2f5;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #d9d9d9;
      padding: 12px;
      text-align: right;
    }
    th {
      background: #1890ff;
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
    tr:hover {
      background: #e6f7ff;
    }
    .totals {
      margin-top: 20px;
      padding: 15px;
      background: #fff7e6;
      border-radius: 4px;
      border-right: 4px solid #faad14;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>تقرير: ${report.type}</h1>
    
    <div class="metadata">
      <p><strong>تاريخ الإنشاء:</strong> ${new Date(report.metadata.generatedAt).toLocaleString('ar-EG')}</p>
      <p><strong>عدد السجلات:</strong> ${report.metadata.recordCount}</p>
    </div>

    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${report.totals ? `
      <div class="totals">
        <h3>المجاميع</h3>
        ${Object.entries(report.totals).map(([key, value]) =>
                `<p><strong>${key}:</strong> ${value.toLocaleString('ar-EG')}</p>`
            ).join('')}
      </div>
    ` : ''}
  </div>
</body>
</html>
      `;

            this.downloadFile(htmlContent, filename, 'text/html;charset=utf-8;');
            console.log(`✅ تم تصدير التقرير إلى HTML: ${filename}`);

        } catch (error) {
            console.error('❌ خطأ في تصدير التقرير إلى HTML:', error);
            throw error;
        }
    }

    /**
     * تنزيل ملف
     * @private
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * مسح الذاكرة المؤقتة للتقارير
     */
    clearCache() {
        this.cache.clear();
        console.log('✅ تم مسح ذاكرة التقارير المؤقتة');
    }

    /**
     * الحصول على إحصائيات الذاكرة المؤقتة
     */
    getCacheStats() {
        return this.cache.getStats();
    }
}

// إنشاء نسخة عامة للاستخدام المباشر
export const reportGenerator = new ReportGenerator();

export default ReportGenerator;
