/**
 * ملف تحسين الأداء الشامل
 * يتضمن استراتيجيات متعددة لتحسين سرعة بدء التشغيل والاستجابة
 * 
 * التحسينات المطبقة:
 * 1. تأخير تحميل المكونات غير الحرجة (Lazy Loading)
 * 2. تخزين مؤقت للبيانات (Caching)
 * 3. معالجة متوازية للعمليات الثقيلة
 * 4. تقليل حجم الحزم (Bundle Size Reduction)
 */

// ============================================================
// 1. نظام التخزين المؤقت (Caching System)
// ============================================================

class CacheManager {
  constructor(maxSize = 100, ttl = 3600000) { // TTL: 1 ساعة
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Time to live بالميلي ثانية
    this.timestamps = new Map();
  }

  /**
   * حفظ قيمة في الذاكرة المؤقتة
   * @param {string} key - مفتاح التخزين
   * @param {*} value - القيمة المراد تخزينها
   */
  set(key, value) {
    // إذا تجاوزنا الحد الأقصى، احذف أقدم عنصر
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.timestamps.delete(firstKey);
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * استرجاع قيمة من الذاكرة المؤقتة
   * @param {string} key - مفتاح التخزين
   * @returns {*} القيمة المخزنة أو null
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    // تحقق من انتهاء صلاحية البيانات
    const timestamp = this.timestamps.get(key);
    if (Date.now() - timestamp > this.ttl) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * مسح الذاكرة المؤقتة بالكامل
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * الحصول على إحصائيات الذاكرة المؤقتة
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: ((this.cache.size / this.maxSize) * 100).toFixed(2)
    };
  }
}

// ============================================================
// 2. نظام معالجة العمليات الثقيلة (Heavy Operations Handler)
// ============================================================

class HeavyOperationHandler {
  constructor(batchSize = 1000, delayBetweenBatches = 10) {
    this.batchSize = batchSize;
    this.delayBetweenBatches = delayBetweenBatches; // بالميلي ثانية
    this.isProcessing = false;
  }

  /**
   * معالجة مصفوفة كبيرة من البيانات على دفعات
   * @param {Array} data - البيانات المراد معالجتها
   * @param {Function} processor - دالة المعالجة لكل عنصر
   * @param {Function} onProgress - دالة تحديث التقدم
   * @returns {Promise<Array>} النتائج المعالجة
   */
  async processBatch(data, processor, onProgress = null) {
    if (this.isProcessing) {
      console.warn('عملية معالجة أخرى قيد التنفيذ');
      return [];
    }

    this.isProcessing = true;
    const results = [];
    const totalBatches = Math.ceil(data.length / this.batchSize);

    try {
      for (let i = 0; i < data.length; i += this.batchSize) {
        const batch = data.slice(i, i + this.batchSize);
        const batchNumber = Math.floor(i / this.batchSize) + 1;

        // معالجة الدفعة الحالية
        const batchResults = batch.map(item => processor(item));
        results.push(...batchResults);

        // تحديث التقدم
        if (onProgress) {
          const progress = (batchNumber / totalBatches) * 100;
          onProgress({
            current: batchNumber,
            total: totalBatches,
            percent: progress.toFixed(2),
            processedItems: results.length
          });
        }

        // تأخير بين الدفعات لتجنب تجميد الواجهة
        if (i + this.batchSize < data.length) {
          await this.delay(this.delayBetweenBatches);
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  /**
   * تأخير غير متزامن
   * @param {number} ms - المدة بالميلي ثانية
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
// 3. نظام تحسين الذاكرة (Memory Optimization)
// ============================================================

class MemoryOptimizer {
  /**
   * تحرير الذاكرة غير المستخدمة
   */
  static forceGarbageCollection() {
    if (window.gc) {
      window.gc();
      console.log('تم تنفيذ تنظيف الذاكرة');
    } else {
      console.warn('تنظيف الذاكرة غير متاح - قم بتشغيل Chrome مع --js-flags="--expose-gc"');
    }
  }

  /**
   * مراقبة استخدام الذاكرة
   */
  static getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        utilizationPercent: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
      };
    }
    return null;
  }

  /**
   * تنظيف مصفوفة كبيرة من البيانات
   * @param {Array} array - المصفوفة المراد تنظيفها
   */
  static clearLargeArray(array) {
    if (Array.isArray(array)) {
      array.length = 0;
    }
  }
}

// ============================================================
// 4. نظام قياس الأداء (Performance Monitoring)
// ============================================================

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * بدء قياس الأداء
   * @param {string} label - اسم العملية
   */
  startMeasure(label) {
    this.metrics.set(label, {
      startTime: performance.now(),
      startMemory: performance.memory?.usedJSHeapSize || 0
    });
  }

  /**
   * إنهاء قياس الأداء
   * @param {string} label - اسم العملية
   * @returns {Object} تفاصيل الأداء
   */
  endMeasure(label) {
    if (!this.metrics.has(label)) {
      console.warn(`لا توجد عملية قياس باسم: ${label}`);
      return null;
    }

    const metric = this.metrics.get(label);
    const endTime = performance.now();
    const endMemory = performance.memory?.usedJSHeapSize || 0;

    const result = {
      label,
      duration: (endTime - metric.startTime).toFixed(2) + ' ms',
      memoryDelta: ((endMemory - metric.startMemory) / 1024).toFixed(2) + ' KB',
      timestamp: new Date().toISOString()
    };

    console.log(`⏱️ ${label}: ${result.duration} (الذاكرة: ${result.memoryDelta})`);

    this.metrics.delete(label);
    return result;
  }

  /**
   * الحصول على جميع المقاييس المسجلة
   */
  getAllMetrics() {
    return Array.from(this.metrics.entries()).map(([label, data]) => ({
      label,
      ...data
    }));
  }
}

// ============================================================
// 5. نظام تحسين تحميل الصور (Image Optimization)
// ============================================================

class ImageOptimizer {
  /**
   * تحميل الصور بشكل كسول (Lazy Loading)
   * @param {string} selector - محدد CSS للصور
   */
  static enableLazyLoading(selector = 'img[data-src]') {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll(selector).forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
}

// ============================================================
// 6. نظام تحسين الشبكة (Network Optimization)
// ============================================================

class NetworkOptimizer {
  /**
   * تحميل المورد بشكل مسبق (Prefetch)
   * @param {string} url - عنوان المورد
   */
  static prefetchResource(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * تحميل المورد مسبقاً (Preload)
   * @param {string} url - عنوان المورد
   * @param {string} as - نوع المورد (script, style, image, etc.)
   */
  static preloadResource(url, as = 'script') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    document.head.appendChild(link);
  }

  /**
   * تقليل حجم الطلب (Request Compression)
   * @param {Object} data - البيانات المراد ضغطها
   * @returns {string} البيانات المضغوطة (JSON)
   */
  static compressData(data) {
    return JSON.stringify(data);
  }
}

// ============================================================
// 7. نظام تحسين الـ DOM (DOM Optimization)
// ============================================================

class DOMOptimizer {
  /**
   * تحديث الـ DOM بكفاءة باستخدام DocumentFragment
   * @param {Element} container - العنصر الأب
   * @param {Array} items - العناصر المراد إضافتها
   * @param {Function} createElement - دالة إنشاء العنصر
   */
  static efficientDOMUpdate(container, items, createElement) {
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      const element = createElement(item);
      fragment.appendChild(element);
    });

    container.appendChild(fragment);
  }

  /**
   * إخفاء العنصر أثناء التحديثات الكبيرة
   * @param {Element} element - العنصر المراد تحديثه
   * @param {Function} updateFn - دالة التحديث
   */
  static batchDOMUpdates(element, updateFn) {
    const display = element.style.display;
    element.style.display = 'none';

    updateFn();

    element.style.display = display;
  }
}

// ============================================================
// 8. نظام تحسين الـ CSS (CSS Optimization)
// ============================================================

class CSSOptimizer {
  /**
   * تحميل ملف CSS بشكل غير متزامن
   * @param {string} href - عنوان ملف CSS
   */
  static loadCSSAsync(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = function() {
      this.media = 'all';
    };
    document.head.appendChild(link);
  }

  /**
   * تقليل إعادة الرسم (Reduce Repaints)
   * @param {Function} fn - الدالة المراد ت��فيذها
   */
  static requestAnimationFrame(fn) {
    window.requestAnimationFrame(fn);
  }
}

// ============================================================
// تصدير الكائنات والفئات
// ============================================================

export {
  CacheManager,
  HeavyOperationHandler,
  MemoryOptimizer,
  PerformanceMonitor,
  ImageOptimizer,
  NetworkOptimizer,
  DOMOptimizer,
  CSSOptimizer
};

// إنشاء نسخ عامة من الكائنات للاستخدام المباشر
export const globalCache = new CacheManager();
export const globalHeavyOperationHandler = new HeavyOperationHandler();
export const globalPerformanceMonitor = new PerformanceMonitor();
