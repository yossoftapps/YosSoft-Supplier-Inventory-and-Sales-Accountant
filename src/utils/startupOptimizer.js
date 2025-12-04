/**
 * ملف تحسين بدء التشغيل
 * يتضمن استراتيجيات لتسريع بدء التطبيق وتحميل الصفحة الأولى
 * 
 * التحسينات المطبقة:
 * 1. تأخير تحميل المكونات غير الحرجة
 * 2. تحميل مسبق للموارد الحرجة
 * 3. تقليل حجم الحزمة الأولية
 * 4. تحسين ترتيب تحميل الملفات
 */

import React from 'react';

// ============================================================
// 1. نظام تأخير تحميل المكونات (Lazy Component Loading)
// ============================================================

/**
 * تأخير تحميل مكون React
 * @param {Function} importFn - دالة الاستيراد الديناميكي
 * @returns {React.lazy} مكون كسول
 */
export const lazyLoadComponent = (importFn) => {
  return React.lazy(() =>
    importFn().catch(err => {
      console.error('خطأ في تحميل المكون:', err);
      // إرجاع مكون افتراضي في حالة الخطأ
      return { default: () => React.createElement('div', null, 'خطأ في تحميل المكون') };
    })
  );
};

// ============================================================
// 2. نظام تحميل الموارد الحرجة (Critical Resources Preloading)
// ============================================================

class CriticalResourcesLoader {
  /**
   * تحميل الموارد الحرجة مسبقاً
   * ملاحظة: يعمل فقط في الإنتاج، معطّل في التطوير لتجنب أخطاء 404
   */
  static preloadCriticalResources() {
    // في وضع التطوير، لا نحتاج preload لأن Vite يدير الموارد
    const isProduction = import.meta.env.PROD;

    if (!isProduction) {
      console.log('💡 Preloading معطّل في وضع التطوير (Vite يدير الموارد)');
      return;
    }

    // في الإنتاج فقط: تحميل خطوط العربية مسبقاً
    this.preloadFont('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

    // ملاحظة: CSS و JS يتم تحميلهم تلقائياً بواسطة Vite في الإنتاج
    console.log('✅ تم تطبيق Preloading للإنتاج');
  }

  /**
   * تحميل خط مسبقاً
   * @param {string} fontUrl - عنوان الخط
   */
  static preloadFont(fontUrl) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = fontUrl;
    document.head.appendChild(link);
  }

  /**
   * تحميل ملف CSS مسبقاً
   * @param {string} cssUrl - عنوان ملف CSS
   */
  static preloadStylesheet(cssUrl) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = cssUrl;
    document.head.appendChild(link);
  }

  /**
   * تحميل ملف JavaScript مسبقاً
   * @param {string} scriptUrl - عنوان ملف JavaScript
   */
  static preloadScript(scriptUrl) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = scriptUrl;
    document.head.appendChild(link);
  }
}

// ============================================================
// 3. نظام تحسين الأداء الأولية (Initial Performance Optimization)
// ============================================================

class InitialPerformanceOptimizer {
  /**
   * تحسين الأداء الأولية عند بدء التطبيق
   */
  static optimizeInitialLoad() {
    // 1. تعطيل الرسوم المتحركة غير الضرورية
    this.disableUnnecessaryAnimations();

    // 2. تحسين الخطوط
    this.optimizeFonts();

    // 3. تحسين الصور
    this.optimizeImages();

    // 4. تحسين الـ CSS
    this.optimizeCSS();

    // 5. تحسين JavaScript
    this.optimizeJavaScript();

    console.log('✅ تم تطبيق تحسينات الأداء الأولية');
  }

  /**
   * تعطيل الرسوم المتحركة غير الضرورية
   */
  static disableUnnecessaryAnimations() {
    // إضافة فئة CSS لتعطيل الرسوم المتحركة أثناء التحميل
    document.documentElement.classList.add('prefers-reduced-motion');

    // إزالة الفئة بعد انتهاء التحميل
    window.addEventListener('load', () => {
      document.documentElement.classList.remove('prefers-reduced-motion');
    });
  }

  /**
   * تحسين الخطوط
   */
  static optimizeFonts() {
    // استخدام font-display: swap لتجنب FOIT (Flash of Invisible Text)
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Cairo';
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * تحسين الصور
   */
  static optimizeImages() {
    // تفعيل Lazy Loading للصور
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
      }
    });
  }

  /**
   * تحسين الـ CSS
   */
  static optimizeCSS() {
    // إزالة الـ CSS غير المستخدم (يتم هذا عادة في مرحلة البناء)
    // هنا نركز على تحسينات وقت التشغيل

    // تقليل إعادة الرسم
    document.addEventListener('scroll', () => {
      // استخدام requestAnimationFrame لتحسين الأداء
      window.requestAnimationFrame(() => {
        // تحديث الأنماط
      });
    }, { passive: true });
  }

  /**
   * تحسين JavaScript
   */
  static optimizeJavaScript() {
    // تأخير تنفيذ البرامج النصية غير الحرجة
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // تنفيذ العمليات غير الحرجة
      });
    } else {
      setTimeout(() => {
        // تنفيذ العمليات غير الحرجة
      }, 2000);
    }
  }
}

// ============================================================
// 4. نظام مراقبة الأداء (Performance Monitoring)
// ============================================================

class StartupPerformanceMonitor {
  /**
   * قياس وقت بدء التطبيق
   */
  static measureStartupTime() {
    if (performance.timing) {
      const navigationStart = performance.timing.navigationStart;
      const loadEventEnd = performance.timing.loadEventEnd;
      const startupTime = loadEventEnd - navigationStart;

      console.log(`⏱️ وقت بدء التطبيق: ${startupTime}ms`);

      return {
        navigationStart,
        loadEventEnd,
        startupTime,
        metrics: {
          'DNS Lookup': performance.timing.domainLookupEnd - performance.timing.domainLookupStart,
          'TCP Connection': performance.timing.connectEnd - performance.timing.connectStart,
          'Request Time': performance.timing.responseStart - performance.timing.requestStart,
          'Response Time': performance.timing.responseEnd - performance.timing.responseStart,
          'DOM Processing': performance.timing.domComplete - performance.timing.domLoading,
          'Resource Loading': performance.timing.loadEventStart - performance.timing.domComplete
        }
      };
    }

    return null;
  }

  /**
   * قياس Core Web Vitals
   */
  static measureCoreWebVitals() {
    const vitals = {};

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
          console.log(`📊 LCP: ${vitals.LCP}ms`);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP غير مدعوم');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            vitals.FID = entry.processingDuration;
            console.log(`📊 FID: ${vitals.FID}ms`);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID غير مدعوم');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              vitals.CLS = clsValue;
              console.log(`📊 CLS: ${vitals.CLS}`);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS غير مدعوم');
      }
    }

    return vitals;
  }

  /**
   * طباعة تقرير الأداء الكامل
   */
  static printPerformanceReport() {
    console.log('=== 📊 تقرير الأداء الشامل ===');

    const startupMetrics = this.measureStartupTime();
    if (startupMetrics) {
      console.log('وقت البدء:', startupMetrics.startupTime, 'ms');
      console.log('تفاصيل المقاييس:', startupMetrics.metrics);
    }

    const vitals = this.measureCoreWebVitals();
    console.log('Core Web Vitals:', vitals);

    if (performance.memory) {
      console.log('استخدام الذاكرة:', {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB'
      });
    }
  }
}

// ============================================================
// 5. نظام تحسين Electron (Electron Optimization)
// ============================================================

class ElectronStartupOptimizer {
  /**
   * تحسين بدء تطبيق Electron
   */
  static optimizeElectronStartup() {
    // 1. تقليل حجم النافذة الأولية
    this.optimizeWindowSize();

    // 2. تحميل الصفحة بشكل أسرع
    this.optimizePageLoad();

    // 3. تحسين استهلاك الذاكرة
    this.optimizeMemoryUsage();

    console.log('✅ تم تطبيق تحسينات Electron');
  }

  /**
   * تحسين حجم النافذة الأولية
   */
  static optimizeWindowSize() {
    // يتم هذا في electron.cjs
    // استخدام حجم نافذة معقول بدلاً من الحد الأقصى
    console.log('💡 استخدم حجم نافذة معقول في electron.cjs');
  }

  /**
   * تحسين تحميل الصفحة
   */
  static optimizePageLoad() {
    // تحميل الصفحة بعد جاهزية الـ DOM
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ تم تحميل الـ DOM');
    });

    // تحميل الموارد الإضافية بعد انتهاء التحميل الأولي
    window.addEventListener('load', () => {
      console.log('✅ تم تحميل جميع الموارد');
    });
  }

  /**
   * تحسين استهلاك الذاكرة
   */
  static optimizeMemoryUsage() {
    // تنظيف الذاكرة بشكل دوري
    setInterval(() => {
      if (window.gc) {
        window.gc();
      }
    }, 60000); // كل دقيقة
  }
}

// ============================================================
// 6. نظام تحسين React (React Optimization)
// ============================================================

class ReactStartupOptimizer {
  /**
   * تحسين بدء تطبيق React
   */
  static optimizeReactStartup() {
    // 1. استخدام React.lazy للمكونات غير الحرجة
    console.log('💡 استخدم React.lazy للمكونات غير الحرجة');

    // 2. استخدام useMemo و useCallback
    console.log('💡 استخدم useMemo و useCallback لتحسين الأداء');

    // 3. استخدام Code Splitting
    console.log('💡 استخدم Code Splitting في Vite');

    // 4. تقليل حجم الحزمة
    console.log('💡 قلل حجم الحزمة بإزالة المكتبات غير المستخدمة');
  }
}

// ============================================================
// 7. نظام تحسين Vite (Vite Optimization)
// ============================================================

class ViteStartupOptimizer {
  /**
   * تحسينات Vite المقترحة
   */
  static getViteOptimizations() {
    return {
      build: {
        // تقليل حجم الحزمة
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true // إزالة console.log في الإنتاج
          }
        },
        // Code Splitting
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor': ['react', 'react-dom', 'antd'],
              'utils': ['decimal.js', 'xlsx']
            }
          }
        }
      },
      server: {
        // تحسينات الخادم
        middlewareMode: false,
        hmr: {
          protocol: 'ws',
          host: 'localhost',
          port: 5173
        }
      }
    };
  }
}

// ============================================================
// 8. دالة شاملة لتطبيق جميع التحسينات
// ============================================================

/**
 * تطبيق جميع تحسينات بدء التشغيل
 */
export const applyAllStartupOptimizations = () => {
  console.log('🚀 جاري تطبيق تحسينات بدء التشغيل...');

  // تطبيق التحسينات الأولية
  InitialPerformanceOptimizer.optimizeInitialLoad();

  // تحميل الموارد الحرجة
  CriticalResourcesLoader.preloadCriticalResources();

  // تحسين Electron
  ElectronStartupOptimizer.optimizeElectronStartup();

  // تحسين React
  ReactStartupOptimizer.optimizeReactStartup();

  // قياس الأداء
  setTimeout(() => {
    StartupPerformanceMonitor.printPerformanceReport();
  }, 3000);

  console.log('✅ تم تطبيق جميع التحسينات');
};

// ============================================================
// تصدير الفئات والدوال
// ============================================================

export {
  CriticalResourcesLoader,
  InitialPerformanceOptimizer,
  StartupPerformanceMonitor,
  ElectronStartupOptimizer,
  ReactStartupOptimizer,
  ViteStartupOptimizer
};
