import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';
import './index.css';
import './i18n';

// استيراد تحسينات بدء التشغيل
import {
  InitialPerformanceOptimizer,
  CriticalResourcesLoader,
  StartupPerformanceMonitor
} from './utils/startupOptimizer';

// قياس وقت البدء
const startTime = performance.now();
console.log('🚀 بدء تحميل التطبيق...');

// تطبيق التحسينات الأولية
try {
  InitialPerformanceOptimizer.optimizeInitialLoad();
  CriticalResourcesLoader.preloadCriticalResources();
  console.log('✅ تم تطبيق تحسينات البدء');
} catch (error) {
  console.warn('⚠️ خطأ في تطبيق بعض التحسينات:', error);
}

// تحميل التطبيق
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// قياس وطباعة وقت البدء
window.addEventListener('load', () => {
  const endTime = performance.now();
  const loadTime = endTime - startTime;
  console.log(`⏱️ وقت تحميل التطبيق الكلي: ${loadTime.toFixed(2)}ms`);

  // طباعة تقرير الأداء الشامل
  setTimeout(() => {
    StartupPerformanceMonitor.printPerformanceReport();
  }, 1000);
});