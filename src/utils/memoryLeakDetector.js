/**
 * نظام كشف تسرب الذاكرة باستخدام FinalizationRegistry
 * Memory Leak Detection System using FinalizationRegistry
 */

class MemoryLeakDetector {
    constructor() {
        this.registry = new FinalizationRegistry((heldValue) => {
            console.warn('🧹 تسرب ذاكرة محتمل:', heldValue);
            this.leaksDetected++;
        });

        this.leaksDetected = 0;
        this.trackedObjects = new Map();
        this.gcInterval = null;
    }

    /**
     * تتبع كائن للكشف عن تسرب الذاكرة
     * Track an object for memory leak detection
     */
    trackObject(obj, description = 'Object') {
        const id = Symbol(description);
        this.registry.register(obj, { id, description, timestamp: Date.now() });
        this.trackedObjects.set(id, { obj, description, timestamp: Date.now() });
        return id;
    }

    /**
     * إلغاء تتبع كائن
     * Untrack an object
     */
    untrackObject(id) {
        if (this.trackedObjects.has(id)) {
            const { obj } = this.trackedObjects.get(id);
            this.registry.unregister(obj);
            this.trackedObjects.delete(id);
        }
    }

    /**
     * بدء مراقبة دورية للذاكرة
     * Start periodic memory monitoring
     */
    startPeriodicMonitoring(intervalMs = 30000) {
        this.gcInterval = setInterval(() => {
            this.performGarbageCollection();
            this.logMemoryStats();
        }, intervalMs);
    }

    /**
     * إيقاف المراقبة الدورية
     * Stop periodic monitoring
     */
    stopPeriodicMonitoring() {
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }
    }

    /**
     * تنفيذ جمع القمامة يدوياً
     * Perform manual garbage collection
     */
    performGarbageCollection() {
        if (global.gc) {
            global.gc();
        }
    }

    /**
     * تسجيل إحصائيات الذاكرة
     * Log memory statistics
     */
    logMemoryStats() {
        if (performance.memory) {
            const mem = performance.memory;
            console.log(`📊 إحصائيات الذاكرة:
                المستخدمة: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
                الكلية: ${(mem.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
                الحد: ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
                التسربات المكتشفة: ${this.leaksDetected}`);
        }
    }

    /**
     * الحصول على تقرير التسربات
     * Get leak report
     */
    getLeakReport() {
        return {
            leaksDetected: this.leaksDetected,
            trackedObjectsCount: this.trackedObjects.size,
            trackedObjects: Array.from(this.trackedObjects.values()).map(({ description, timestamp }) => ({
                description,
                age: Date.now() - timestamp
            }))
        };
    }
}

// إنشاء مثيل واحد
// Create singleton instance
const memoryLeakDetector = new MemoryLeakDetector();

export default memoryLeakDetector;
export { MemoryLeakDetector };
