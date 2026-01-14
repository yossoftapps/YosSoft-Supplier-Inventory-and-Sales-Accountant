/**
 * Error Logger System
 * يوفر نظام تسجيل شامل للأخطاء والتحذيرات والمعلومات
 */

class ErrorLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // الحد الأقصى للسجلات في الذاكرة
        this.isElectron = typeof window !== 'undefined' && window.electron;
    }

    /**
     * تسجيل خطأ
     * @param {Error} error - كائن الخطأ
     * @param {Object} context - معلومات إضافية عن السياق
     */
    log(error, context = {}) {
        const logEntry = this.createLogEntry('ERROR', error.message, {
            ...context,
            stack: error.stack,
            name: error.name
        });

        this.addLog(logEntry);
        console.error('[ERROR]', logEntry);

        // حفظ في ملف إذا كان Electron
        if (this.isElectron) {
            this.saveToFile(logEntry);
        }
    }

    /**
     * تسجيل تحذير
     * @param {string} message - رسالة التحذير
     * @param {Object} context - معلومات إضافية
     */
    logWarning(message, context = {}) {
        const logEntry = this.createLogEntry('WARNING', message, context);
        this.addLog(logEntry);
        console.warn('[WARNING]', logEntry);

        if (this.isElectron) {
            this.saveToFile(logEntry);
        }
    }

    /**
     * تسجيل معلومة
     * @param {string} message - رسالة المعلومة
     * @param {Object} context - معلومات إضافية
     */
    logInfo(message, context = {}) {
        const logEntry = this.createLogEntry('INFO', message, context);
        this.addLog(logEntry);
        console.info('[INFO]', logEntry);
    }

    /**
     * تسجيل نجاح عملية
     * @param {string} message - رسالة النجاح
     * @param {Object} context - معلومات إضافية
     */
    logSuccess(message, context = {}) {
        const logEntry = this.createLogEntry('SUCCESS', message, context);
        this.addLog(logEntry);
        console.log('[SUCCESS]', logEntry);
    }

    /**
     * إنشاء سجل
     * @private
     */
    createLogEntry(level, message, context) {
        // Safely serialize context to avoid throwing when encountering exotic objects
        const safeContext = {};
        try {
            if (context && typeof context === 'object') {
                Object.keys(context).forEach(k => {
                    try {
                        const v = context[k];
                        // Prefer small summaries for large objects
                        if (v === null || typeof v === 'undefined' || typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') {
                            safeContext[k] = v;
                        } else if (Array.isArray(v)) {
                            safeContext[k] = { _type: 'array', length: v.length };
                        } else if (typeof v === 'object') {
                            safeContext[k] = { _type: 'object', keys: Object.keys(v).slice(0, 10) };
                        } else {
                            safeContext[k] = `unserializable:${typeof v}`;
                        }
                    } catch (inner) {
                        safeContext[k] = `error_serializing_key:${k}`;
                    }
                });
            }
        } catch (e) {
            // If something unexpected happens, fall back to minimal context
            safeContext._error = 'failed_to_serialize_context';
        }

        // Safe message conversion
        let safeMessage = '<unknown>';
        try {
            if (typeof message === 'string') {
                safeMessage = message;
            } else if (message && typeof message.message === 'string') {
                safeMessage = message.message;
            } else {
                // Try to JSON.stringify with circular replacer
                const seen = new WeakSet();
                safeMessage = JSON.stringify(message, function (k, v) {
                    if (typeof v === 'object' && v !== null) {
                        if (seen.has(v)) return '[Circular]';
                        seen.add(v);
                    }
                    if (typeof v === 'function') return `[Function:${v.name || 'anonymous'}]`;
                    return v;
                });
                if (safeMessage === undefined) safeMessage = String(message);
            }
        } catch (e) {
            try { safeMessage = String(message); } catch (e2) { safeMessage = '<unserializable message>'; }
        }

        return {
            timestamp: new Date().toISOString(),
            level,
            message: safeMessage,
            context: safeContext,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
            memory: this.getMemoryInfo()
        };
    }

    /**
     * إضافة سجل إلى القائمة
     * @private
     */
    addLog(logEntry) {
        this.logs.push(logEntry);

        // الحفاظ على الحد الأقصى للسجلات
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    /**
     * الحصول على معلومات الذاكرة
     * @private
     */
    getMemoryInfo() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return {
                usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
                totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
                jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
            };
        }
        return null;
    }

    /**
     * حفظ السجل في ملف (Electron فقط)
     * @private
     */
    async saveToFile(logEntry) {
        if (!this.isElectron) return;

        try {
            // استخدام Electron API لحفظ الملف
            const logLine = JSON.stringify(logEntry) + '\n';

            // يمكن تنفيذ هذا لاحقاً عند إضافة Electron APIs
            // await window.electron.appendLog(logLine);
        } catch (err) {
            console.error('Failed to save log to file:', err);
        }
    }

    /**
     * الحصول على جميع السجلات
     */
    getLogs(level = null) {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return this.logs;
    }

    /**
     * الحصول على آخر N سجل
     */
    getRecentLogs(count = 10) {
        return this.logs.slice(-count);
    }

    /**
     * مسح جميع السجلات
     */
    clearLogs() {
        this.logs = [];
        console.log('[INFO] All logs cleared');
    }

    /**
     * تصدير السجلات إلى JSON
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * تصدير السجلات إلى CSV
     */
    exportLogsCSV() {
        if (this.logs.length === 0) return '';

        const headers = ['Timestamp', 'Level', 'Message', 'Context', 'URL'];
        const rows = this.logs.map(log => [
            log.timestamp,
            log.level,
            log.message,
            JSON.stringify(log.context),
            log.url
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return csv;
    }

    /**
     * الحصول على إحصائيات السجلات
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            errors: this.logs.filter(l => l.level === 'ERROR').length,
            warnings: this.logs.filter(l => l.level === 'WARNING').length,
            info: this.logs.filter(l => l.level === 'INFO').length,
            success: this.logs.filter(l => l.level === 'SUCCESS').length
        };

        return stats;
    }
}

// إنشاء instance واحد
export const errorLogger = new ErrorLogger();

// تسجيل الأخطاء العامة
if (typeof window !== 'undefined') {
    // Unhandled errors
    window.addEventListener('error', (event) => {
        errorLogger.log(event.error || new Error(event.message), {
            type: 'unhandledError',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        errorLogger.log(
            new Error(event.reason?.message || event.reason || 'Unhandled Promise Rejection'),
            {
                type: 'unhandledRejection',
                promise: event.promise
            }
        );
    });
}

export default errorLogger;
