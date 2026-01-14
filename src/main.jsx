import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';
import './index.css';
import './i18n';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// استيراد تحسينات بدء التشغيل
import {
  InitialPerformanceOptimizer,
  CriticalResourcesLoader,
  StartupPerformanceMonitor,
  ElectronStartupOptimizer
} from './utils/startupOptimizer';

// استيراد مدير الذاكرة الدوري
import { memoryManager } from './utils/periodicMemoryManager';

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

// تفعيل مدير الذاكرة الدوري
try {
  memoryManager.start();
  console.log('🧠 تم تفعيل مدير الذاكرة الدوري');
} catch (error) {
  console.warn('⚠️ خطأ في تفعيل مدير الذاكرة:', error);
}

import { ThemeProvider } from './contexts/ThemeContext';

// تحميل التطبيق
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </DndProvider>
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