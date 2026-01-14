import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Layout, Menu, Spin, Alert, Button, ConfigProvider, theme as antdTheme, Switch } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useTheme } from './contexts/ThemeContext';
import { lightTheme, darkTheme } from './utils/theme';
import {
  FileExcelOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  DollarCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  FundViewOutlined,
  BarChartOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { Drawer } from 'antd';
import { useTranslation } from 'react-i18next';
import './App.css';

// استيراد مكون التحميل الاحتياطي
import LoadingFallback from './components/LoadingFallback';
import { errorLogger } from './utils/errorLogger';

// Safe lazy loader wrapper to validate module default before React uses it
const safeLazy = (importer, name) => lazy(async () => {
  try {
    const mod = await importer();
    const def = mod && (mod.default || mod);

    // Basic validation: default export must be a function or object (React component)
    const isValidComponent = def && (typeof def === 'function' || typeof def === 'object');
    if (!isValidComponent) {
      const err = new Error(`Invalid default export for lazy module: ${name}`);
      // Avoid logging large module objects — provide only keys
      try {
        errorLogger.log(err, { moduleKeys: Object.keys(mod || {}) });
      } catch (e) {
        console.error('Failed to log invalid lazy module', e);
      }
      throw err;
    }

    return mod;
  } catch (err) {
    // Re-throw so React Suspense can handle via fallback and ErrorBoundary
    throw err;
  }
});

// تحميل الصفحات بشكل خامل لتحسين الأداء باستخدام safeLazy
const ImportDataPage = safeLazy(() => import('./pages/ImportDataPage'), 'ImportDataPage');
const NetPurchasesPage = safeLazy(() => import('./pages/NetPurchasesPage'), 'NetPurchasesPage');
const NetSalesPage = safeLazy(() => import('./pages/NetSalesPage'), 'NetSalesPage');
const PhysicalInventoryPage = safeLazy(() => import('./pages/PhysicalInventoryPage'), 'PhysicalInventoryPage');
const EndingInventoryPage = safeLazy(() => import('./pages/EndingInventoryPage'), 'EndingInventoryPage');
const BookInventoryPage = safeLazy(() => import('./pages/BookInventoryPage'), 'BookInventoryPage');
const SalesCostPage = safeLazy(() => import('./pages/SalesCostPage'), 'SalesCostPage');
const ExcessInventoryPage = safeLazy(() => import('./pages/ExcessInventoryPage'), 'ExcessInventoryPage');
const SuppliersPayablesPage = safeLazy(() => import('./pages/SuppliersPayablesPage'), 'SuppliersPayablesPage');
const SupplierMovementPage = safeLazy(() => import('./pages/SupplierMovementPage'), 'SupplierMovementPage');
const AbnormalItemsPage = safeLazy(() => import('./pages/AbnormalItemsPage'), 'AbnormalItemsPage');
const MainAccountsPage = safeLazy(() => import('./pages/MainAccountsPage'), 'MainAccountsPage');
const PreparingReturnsPage = safeLazy(() => import('./pages/PreparingReturnsPage'), 'PreparingReturnsPage');
const ItemProfitabilityPage = safeLazy(() => import('./pages/ItemProfitabilityPage'), 'ItemProfitabilityPage');
const InventoryABCPage = safeLazy(() => import('./pages/InventoryABCPage'), 'InventoryABCPage');
const ExpiryRiskPage = safeLazy(() => import('./pages/ExpiryRiskPage'), 'ExpiryRiskPage');
const SupplierScorecardsPage = safeLazy(() => import('./pages/SupplierScorecardsPage'), 'SupplierScorecardsPage');
const StagnationRiskPage = safeLazy(() => import('./pages/StagnationRiskPage'), 'StagnationRiskPage');
const InventoryTurnoverPage = safeLazy(() => import('./pages/InventoryTurnoverPage'), 'InventoryTurnoverPage');
const IdealReplenishmentPage = safeLazy(() => import('./pages/IdealReplenishmentPage'), 'IdealReplenishmentPage');
const NewItemsPerformancePage = safeLazy(() => import('./pages/NewItemsPerformancePage'), 'NewItemsPerformancePage');
const SupplierComparisonPage = safeLazy(() => import('./pages/SupplierComparisonPage'), 'SupplierComparisonPage');

// استيراد وظائف المساعدة
import { normalizeProcessedData } from './utils/dataNormalizer';
import { REPORT_COLORS } from './constants/reportColors'; // Import colors
import { calculateItemProfitability } from './logic/itemProfitabilityLogic.js';
import { calculateInventoryABC } from './logic/inventoryABCLogic.js';
import { calculateExpiryRiskForecast } from './logic/expiryRiskLogic.js';
import { calculateSupplierScorecards } from './logic/supplierScorecardsLogic.js';
import { calculateStagnationRisk } from './logic/stagnationRiskLogic.js';
import { calculateInventoryTurnover } from './logic/inventoryTurnoverLogic.js';
import { calculateIdealReplenishmentGap } from './logic/idealReplenishmentLogic.js';
import { calculateNewItemsPerformance } from './logic/newItemsPerformanceLogic.js';
import { calculateSupplierBenchmark } from './logic/supplierBenchmarkLogic.js';

// استيراد لوحة التحكم
import Dashboard from './components/Dashboard.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import companyLogo from './assets/images/logo.png';
import BrandingHeader from './components/BrandingHeader';
import LogViewer from './components/LogViewer';
import PerformanceMonitor from './components/PerformanceMonitor';
import { BugOutlined } from '@ant-design/icons';
import { performAutoBackup } from './utils/autoBackup';

// استيراد مدير التخزين المؤقت IndexedDB
import { cacheManager } from './utils/indexedDbManager';

const { Header, Sider, Content } = Layout;
import {
  AlertOutlined,
  WarningOutlined,
  StopOutlined,
  SyncOutlined,
  RiseOutlined,
  SolutionOutlined,
  TeamOutlined
} from '@ant-design/icons';

function App() {
  const { t, i18n } = useTranslation();
  const [processedData, setProcessedData] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState('import');
  const [language, setLanguage] = useState('ar');
  const [advancedReports, setAdvancedReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLogViewerVisible, setIsLogViewerVisible] = useState(false);
  const [isPerfMonitorVisible, setIsPerfMonitorVisible] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { token } = antdTheme.useToken();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  // وظيفة تغيير اللغة
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
  };


  // تحميل التقارير المخزنة مؤقتاً من IndexedDB
  useEffect(() => {
    let isMounted = true;
    const loadCachedReports = async () => {
      setLoading(true);
      try {
        // Try to load from IndexedDB cache
        const results = await Promise.all([
          cacheManager.get('advancedReports', 'itemProfitability'),
          cacheManager.get('advancedReports', 'inventoryABC'),
          cacheManager.get('advancedReports', 'expiryRisk'),
          cacheManager.get('advancedReports', 'supplierScorecards'),
          cacheManager.get('advancedReports', 'stagnationRisk'),
          cacheManager.get('advancedReports', 'inventoryTurnover'),
          cacheManager.get('advancedReports', 'idealReplenishment'),
          cacheManager.get('advancedReports', 'newItemPerformance'),
          cacheManager.get('advancedReports', 'supplierBenchmark')
        ]);

        if (!isMounted) return;

        const [
          cachedItemProfitability,
          cachedInventoryABC,
          cachedExpiryRisk,
          cachedSupplierScorecards,
          cachedStagnationRisk,
          cachedInventoryTurnover,
          cachedIdealReplenishment,
          cachedNewItemPerformance,
          cachedSupplierBenchmark
        ] = results;

        const cached = {};
        if (cachedItemProfitability) cached.itemProfitability = cachedItemProfitability;
        if (cachedInventoryABC) cached.inventoryABC = cachedInventoryABC;
        if (cachedExpiryRisk) cached.expiryRisk = cachedExpiryRisk;
        if (cachedSupplierScorecards) cached.supplierScorecards = cachedSupplierScorecards;
        if (cachedStagnationRisk) cached.stagnationRisk = cachedStagnationRisk;
        if (cachedInventoryTurnover) cached.inventoryTurnover = cachedInventoryTurnover;
        if (cachedIdealReplenishment) cached.idealReplenishment = cachedIdealReplenishment;
        if (cachedNewItemPerformance) cached.newItemPerformance = cachedNewItemPerformance;
        if (cachedSupplierBenchmark) cached.supplierBenchmark = cachedSupplierBenchmark;

        setAdvancedReports(cached);
      } catch (err) {
        console.warn('Failed to load cached reports:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCachedReports();
    return () => { isMounted = false; };
  }, []);

  // مفاتيح اختصار لفتح سجل الأخطاء Ctrl+Shift+L ومراقب الأداء Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === 'L' || e.key === 'l') {
          setIsLogViewerVisible(prev => !prev);
        } else if (e.key === 'P' || e.key === 'p') {
          setIsPerfMonitorVisible(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const reportsTaskRef = useRef(null);

  // حساب التقارير المتقدمة في الخلفية بشكل غير متزامن
  useEffect(() => {
    if (!processedData) return;

    // إلغاء أي مهمة سابقة لا تزال قيد التشغيل لمنع التداخل
    if (reportsTaskRef.current) {
      reportsTaskRef.current.cancelled = true;
      if (reportsTaskRef.current.timeout) clearTimeout(reportsTaskRef.current.timeout);
    }

    const task = { cancelled: false, timeout: null };
    reportsTaskRef.current = task;

    const calculateReportsAsync = async () => {
      const startTime = performance.now();
      console.log('🚀 بدء مهمة حساب التقارير المتقدمة (Async Task)...');

      // استخدام نسخة محلية لتجميع النتائج - نبدأ بمصفوفة فارغة إذا كانت البيانات جديدة تماماً
      // أو نحتفظ بالنتائج الحالية إذا كان التحديث طفيفاً
      const results = { ...advancedReports };
      let changed = false;

      // دالة مساعدة لتوزيع العمل على الـ Event Loop دون تجميد
      const runDeferred = (fn, ...args) => {
        return new Promise(resolve => {
          // استخدام requestIdleCallback إذا كان متاحاً لضمان عدم التأثير على سلاسة النظام
          const scheduler = window.requestIdleCallback || (cb => setTimeout(cb, 150));

          task.timeout = scheduler(() => {
            if (task.cancelled) { resolve(null); return; }
            try {
              const res = fn(...args);
              resolve(res);
            } catch (err) {
              console.error('Report calculation step failed:', err);
              resolve([]);
            }
          }, { timeout: 2000 });
        });
      };

      // Function to perform memory cleanup during long operations
      const performMemoryCleanup = () => {
        if (task.cancelled) return;
        // Request garbage collection if available
        if (window.gc) {
          window.gc();
        }
      };

      const runStep = async (key, fn, ...args) => {
        if (task.cancelled) return;
        if (!results[key] || results[key].length === 0) {
          results[key] = await runDeferred(fn, ...args);
          changed = true;
          // Yield again after a heavy calculation
          await new Promise(r => setTimeout(r, 100));
          // Perform memory cleanup periodically
          performMemoryCleanup();
        }
      };

      // تنفيذ الحسابات بالترتيب مع فترات راحة أطول للنظام
      await runStep('itemProfitability', calculateItemProfitability, processedData.salesCost?.costOfSalesList || [], processedData.netSales?.netSalesList || [], processedData.netPurchases?.netPurchasesList || []);
      await runStep('inventoryABC', calculateInventoryABC, processedData.salesCost?.costOfSalesList || []);
      await runStep('expiryRisk', calculateExpiryRiskForecast, processedData.netSales?.netSalesList || [], processedData.endingInventory?.endingInventoryList || []);
      await runStep('supplierScorecards', calculateSupplierScorecards, processedData.netPurchases?.netPurchasesList || [], processedData.netPurchases?.orphanReturnsList || []);
      await runStep('stagnationRisk', calculateStagnationRisk, processedData.netSales?.netSalesList || [], processedData.endingInventory?.endingInventoryList || []);
      await runStep('inventoryTurnover', calculateInventoryTurnover, processedData.netSales?.netSalesList || [], processedData.endingInventory?.endingInventoryList || []);
      await runStep('idealReplenishment', calculateIdealReplenishmentGap, processedData.netSales?.netSalesList || [], processedData.endingInventory?.endingInventoryList || [], results.inventoryABC);
      await runStep('newItemPerformance', calculateNewItemsPerformance, processedData.netSales?.netSalesList || [], processedData.endingInventory?.endingInventoryList || [], [ ...(processedData.netPurchases?.netPurchasesList || []), ...(processedData.netPurchases?.orphanReturnsList || []) ]);
      await runStep('supplierBenchmark', calculateSupplierBenchmark, processedData.netPurchases?.netPurchasesList || [], processedData.netPurchases?.orphanReturnsList || [], results.supplierScorecards);

      if (task.cancelled) return;

      if (changed && !task.cancelled) {
        setAdvancedReports(results);

        // حفظ النتائج في IndexedDB في الخلفية تدريجياً
        const saveToCache = async () => {
          for (const [key, data] of Object.entries(results)) {
            if (data && data.length > 0) {
              await cacheManager.set('advancedReports', key, data, 30 * 60 * 1000).catch(() => { });
              await new Promise(r => setTimeout(r, 50)); // Yield between saves
            }
          }
        };
        saveToCache();
      }

      console.log(`✅ انتهت المهمة بنجاح في ${(performance.now() - startTime).toFixed(0)}ms.`);
    };

    calculateReportsAsync();

    return () => {
      task.cancelled = true;
      if (task.timeout) clearTimeout(task.timeout);
    };
  }, [processedData]);


  // استخدام useMemo لحساب عدد السجلات والإجماليات المالية بكفاءة عند تغير البيانات فقط
  const reportCounts = useMemo(() => {
    if (!processedData) {
      return {
        import: 0, netPurchases: 0, netSales: 0, physicalInventory: 0,
        endingInventory: 0, bookInventory: 0, salesCost: 0, excessInventory: 0,
        suppliersPayables: 0, supplierMovement: 0, abnormalItems: 0, mainAccounts: 0,
        itemProfitability: 0, inventoryABC: 0, expiryRisk: 0, supplierScorecards: 0,
        stagnationRisk: 0, inventoryTurnover: 0, idealReplenishment: 0, newItemPerformance: 0,
        preparingReturns: 0
      };
    }

    return {
      import: 0,
      netPurchases: (processedData.netPurchases?.netPurchasesList?.length || 0) + (processedData.netPurchases?.orphanReturnsList?.length || 0),
      netSales: (processedData.netSales?.netSalesList?.length || 0) + (processedData.netSales?.orphanReturnsList?.length || 0),
      physicalInventory: (processedData.physicalInventory?.listE?.length || 0) + (processedData.physicalInventory?.listF?.length || 0),
      endingInventory: (processedData.endingInventory?.endingInventoryList?.length || 0) + (processedData.endingInventory?.listB?.length || 0),
      bookInventory: processedData.bookInventory?.length || 0,
      salesCost: processedData.salesCost?.costOfSalesList?.length || 0,
      excessInventory: processedData.excessInventory?.length || 0,
      suppliersPayables: processedData.suppliersPayables?.length || 0,
      supplierMovement: processedData.suppliersPayables?.length || 0,
      abnormalItems: processedData.abnormalItems?.length || 0,
      mainAccounts: processedData.mainAccounts?.length || 0,
      // Advanced reports counts will be calculated on demand
      itemProfitability: advancedReports.itemProfitability?.length || 0,
      inventoryABC: advancedReports.inventoryABC?.length || 0,
      expiryRisk: advancedReports.expiryRisk?.length || 0,
      supplierScorecards: advancedReports.supplierScorecards?.length || 0,
      stagnationRisk: advancedReports.stagnationRisk?.length || 0,
      inventoryTurnover: advancedReports.inventoryTurnover?.length || 0,
      idealReplenishment: advancedReports.idealReplenishment?.length || 0,
      newItemPerformance: advancedReports.newItemPerformance?.length || 0,
      supplierComparison: advancedReports.supplierBenchmark?.length || 0,
      preparingReturns: processedData?.preparingReturns?.length || 0
    };
  }, [processedData, advancedReports]);

  const dashboardItems = useMemo(() => [
    {
      key: 'dashboard',
      icon: <DashboardOutlined style={{ color: REPORT_COLORS.dashboard }} />,
      label: t('dashboard'),
    },
    {
      key: 'import',
      icon: <FileExcelOutlined style={{ color: REPORT_COLORS.import }} />,
      label: `${t('importData')}`,
    },
    {
      key: 'logs',
      icon: <BugOutlined style={{ color: REPORT_COLORS.logs }} />,
      label: 'سجلات النظام',
    }
  ], [t]);

  const basicReportItems = useMemo(() => [
    {
      key: 'netPurchases',
      icon: <ShoppingOutlined style={{ color: REPORT_COLORS.netPurchases }} />,
      label: `صافي المشتريات (${reportCounts.netPurchases})`,
    },
    {
      key: 'netSales',
      icon: <DollarCircleOutlined style={{ color: REPORT_COLORS.netSales }} />,
      label: `صافي المبيعات (${reportCounts.netSales})`,
    },
    {
      key: 'physicalInventory',
      icon: <DatabaseOutlined style={{ color: REPORT_COLORS.physicalInventory }} />,
      label: `الجرد الفعلي (${reportCounts.physicalInventory})`,
    },
    {
      key: 'excessInventory',
      icon: <FundViewOutlined style={{ color: REPORT_COLORS.excessInventory }} />,
      label: `فائض المخزون (${reportCounts.excessInventory})`,
    }
  ], [reportCounts]);

  const inventoryReportItems = useMemo(() => [
    {
      key: 'endingInventory',
      icon: <DatabaseOutlined style={{ color: REPORT_COLORS.endingInventory }} />,
      label: `المخزون النهائي (${reportCounts.endingInventory})`,
    },
    {
      key: 'bookInventory',
      icon: <FileTextOutlined style={{ color: REPORT_COLORS.bookInventory }} />,
      label: `الجرد الدفتري (${reportCounts.bookInventory})`,
    },
    {
      key: 'preparingReturns',
      icon: <BarChartOutlined style={{ color: REPORT_COLORS.preparingReturns }} />,
      label: `تجهيز المرتجعات (${reportCounts.preparingReturns})`,
    }
  ], [reportCounts]);

  const financialReportItems = useMemo(() => [
    {
      key: 'suppliersPayables',
      icon: <DollarCircleOutlined style={{ color: REPORT_COLORS.suppliersPayables }} />,
      label: `استحقاق الموردين (${reportCounts.suppliersPayables})`,
    },
    {
      key: 'supplierMovement',
      icon: <BarChartOutlined style={{ color: REPORT_COLORS.supplierMovement }} />,
      label: `حركة مورد (${reportCounts.supplierMovement})`,
    },
    {
      key: 'salesCost',
      icon: <DollarCircleOutlined style={{ color: REPORT_COLORS.salesCost }} />,
      label: `تكلفة المبيعات (${reportCounts.salesCost})`,
    },
    {
      key: 'itemProfitability',
      icon: <FundViewOutlined style={{ color: REPORT_COLORS.itemProfitability }} />,
      label: `ربحية الأصناف (${reportCounts.itemProfitability})`,
    },
    {
      key: 'mainAccounts',
      icon: <DatabaseOutlined style={{ color: REPORT_COLORS.mainAccounts }} />,
      label: `الحسابات الرئيسية (${reportCounts.mainAccounts})`,
    }
  ], [reportCounts]);

  const riskReportItems = useMemo(() => [
    {
      key: 'expiryRisk',
      icon: <AlertOutlined style={{ color: REPORT_COLORS.expiryRisk }} />,
      label: `مخاطر انتهاء الصلاحية (${reportCounts.expiryRisk})`,
    },
    {
      key: 'stagnationRisk',
      icon: <WarningOutlined style={{ color: REPORT_COLORS.stagnationRisk }} />,
      label: `مخاطر الركود (${reportCounts.stagnationRisk})`,
    },
    {
      key: 'abnormalItems',
      icon: <StopOutlined style={{ color: REPORT_COLORS.abnormalItems }} />,
      label: `الاصناف الشاذة (${reportCounts.abnormalItems})`,
    }
  ], [reportCounts]);

  const analyticalReportItems = useMemo(() => [
    {
      key: 'inventoryABC',
      icon: <BarChartOutlined style={{ color: REPORT_COLORS.inventoryABC }} />,
      label: `تحليل ABC للمخزون (${reportCounts.inventoryABC})`,
    },
    {
      key: 'inventoryTurnover',
      icon: <SyncOutlined style={{ color: REPORT_COLORS.inventoryTurnover }} />,
      label: `دوران المخزون (${reportCounts.inventoryTurnover})`,
    },
    {
      key: 'idealReplenishment',
      icon: <ShoppingOutlined style={{ color: REPORT_COLORS.idealReplenishment }} />,
      label: `فجوة الشراء المثالية (${reportCounts.idealReplenishment})`,
    },
    {
      key: 'newItemPerformance',
      icon: <RiseOutlined style={{ color: REPORT_COLORS.newItemPerformance }} />,
      label: `أداء الأصناف الجديدة (${reportCounts.newItemPerformance})`,
    },
    {
      key: 'supplierScorecards',
      icon: <SolutionOutlined style={{ color: REPORT_COLORS.supplierScorecards }} />,
      label: `بطاقة تقييم الموردين (${reportCounts.supplierScorecards})`,
    },
    {
      key: 'supplierComparison',
      icon: <TeamOutlined style={{ color: REPORT_COLORS.supplierComparison }} />,
      label: `مقارنة الموردين (${reportCounts.supplierComparison})`,
    }
  ], [reportCounts]);

  // حساب الإجماليات المالية للبطاقات في لوحة القيادة - تم تحسينه لتجنب الـ Spread الضخم
  const monetaryTotals = useMemo(() => {
    if (!processedData) {
      return {
        netPurchases: 0, netSales: 0, physicalInventory: 0,
        endingInventory: 0, suppliersPayables: 0, abnormalItems: 0
      };
    }

    // دالة جمع سريعة لا تقوم بإنشاء مصفوفات جديدة
    const sumList = (list, priceKey = 'الافرادي', qtyKey = 'الكمية') => {
      if (!list) return 0;
      let total = 0;
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const p = parseFloat(item[priceKey]) || 0;
        const q = parseFloat(item[qtyKey]) || 0;
        total += (p * q);
      }
      return total;
    };

    const np = processedData.netPurchases;
    const ns = processedData.netSales;
    const pi = processedData.physicalInventory;
    const ei = processedData.endingInventory;

    return {
      netPurchases: sumList(np?.netPurchasesList) + sumList(np?.orphanReturnsList),
      netSales: sumList(ns?.netSalesList) + sumList(ns?.orphanReturnsList),
      physicalInventory: sumList(pi?.listE) + sumList(pi?.listF),
      endingInventory: sumList(ei?.endingInventoryList) + sumList(ei?.listB),
      suppliersPayables: (processedData.suppliersPayables || []).reduce((s, i) => s + (parseFloat(i['قيمة المخزون']) || 0), 0),
      abnormalItems: sumList(processedData.abnormalItems)
    };
  }, [processedData]);

  // LAZY: تحضير بيانات التقارير فقط عند الطلب لتوفير الذاكرة RAM بشكل كبير
  const getAllReportsData = useCallback(() => {
    const merge = (listA, listB) => {
      const a = listA || [];
      const b = listB || [];
      if (a.length === 0) return b;
      if (b.length === 0) return a;
      // Use spread operator instead of concat for better performance
      return [...a, ...b];
    };

    const reports = {};
    const cache = new Map();

    // Helper to define a lazy property
    const defineLazyReport = (key, sheetName, columns, dataGetter) => {
      Object.defineProperty(reports, key, {
        get: () => {
          if (!cache.has(key)) {
            cache.set(key, {
              data: dataGetter(),
              sheetName,
              columns
            });
          }
          return cache.get(key);
        },
        enumerable: true,
        configurable: true
      });
    };

    // 1. Basic Reports
    defineLazyReport('netPurchases', language === 'ar' ? 'صافي المشتريات' : 'Net Purchases', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'الكمية', dataIndex: 'الكمية' }, { title: 'كمية الجرد', dataIndex: 'كمية الجرد' },
      { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات' }, { title: 'الافرادي', dataIndex: 'الافرادي' }, { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
      { title: 'المورد', dataIndex: 'المورد' }, { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية' }, { title: 'نوع العملية', dataIndex: 'نوع العملية' },
      { title: 'رقم السجل', dataIndex: 'رقم السجل' }, { title: 'ملاحظات', dataIndex: 'ملاحظات' }, { title: 'القائمة', dataIndex: 'القائمة' },
    ], () => merge(processedData.netPurchases?.netPurchasesList, processedData.netPurchases?.orphanReturnsList));

    defineLazyReport('netSales', language === 'ar' ? 'صافي المبيعات' : 'Net Sales', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'الكمية', dataIndex: 'الكمية' }, { title: 'الافرادي', dataIndex: 'الافرادي' },
      { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' }, { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية' },
      { title: 'نوع العملية', dataIndex: 'نوع العملية' }, { title: 'ملاحظات', dataIndex: 'ملاحظات' }, { title: 'القائمة', dataIndex: 'القائمة' },
    ], () => merge(processedData.netSales?.netSalesList, processedData.netSales?.orphanReturnsList));

    defineLazyReport('physicalInventory', language === 'ar' ? 'الجرد الفعلي' : 'Physical Inventory', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'الكمية', dataIndex: 'الكمية' }, { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
      { title: 'ملاحظات', dataIndex: 'ملاحظات' }, { title: 'القائمة', dataIndex: 'القائمة' }, { title: 'رقم السجل', dataIndex: 'رقم السجل' },
    ], () => [...(processedData.physicalInventory?.listE || []), ...(processedData.physicalInventory?.listF || [])]);

    // 2. Inventory Reports
    defineLazyReport('endingInventory', language === 'ar' ? 'المخزون النهائي' : 'Ending Inventory', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'الكمية', dataIndex: 'الكمية' }, { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
      { title: 'الافرادي', dataIndex: 'الافرادي' }, { title: 'الاجمالي', dataIndex: 'الاجمالي' }, { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء' },
      { title: 'المورد', dataIndex: 'المورد' }, { title: 'عمر الصنف', dataIndex: 'عمر الصنف' }, { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات' },
      { title: 'نسبة الفائض', dataIndex: 'نسبة الفائض' }, { title: 'فائض المخزون', dataIndex: 'فائض المخزون' }, { title: 'قيمة فائض المخزون', dataIndex: 'قيمة فائض المخزون' },
      { title: 'معد للارجاع', dataIndex: 'معد للارجاع' }, { title: 'قيمة معد للارجاع', dataIndex: 'قيمة معد للارجاع' }, { title: 'مخزون مثالي', dataIndex: 'مخزون مثالي' },
      { title: 'قيمة مخزون مثالي', dataIndex: 'قيمة مخزون مثالي' }, { title: 'صنف جديد', dataIndex: 'صنف جديد' }, { title: 'قيمة صنف جديد', dataIndex: 'قيمة صنف جديد' },
      { title: 'الاحتياج', dataIndex: 'الاحتياج' }, { title: 'قيمة الاحتياج', dataIndex: 'قيمة الاحتياج' }, { title: 'بيان الصلاحية', dataIndex: 'بيان الصلاحية' },
      { title: 'بيان الحركة', dataIndex: 'بيان الحركة' }, { title: 'بيان الحالة', dataIndex: 'الحالة' }, { title: 'البيان', dataIndex: 'البيان' },
      { title: 'القائمة', dataIndex: 'القائمة' }, { title: 'رقم السجل', dataIndex: 'رقم السجل' }, { title: 'ملاحظات', dataIndex: 'ملاحظات' },
    ], () => [...(processedData.endingInventory?.endingInventoryList || []), ...(processedData.endingInventory?.listB || [])]);

    defineLazyReport('excessInventory', language === 'ar' ? 'فائض المخزون' : 'Excess Inventory', [
      { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' }, { title: 'الوحدة', dataIndex: 'الوحدة' },
      { title: 'الكمية', dataIndex: 'الكمية' }, { title: 'كمية المشتريات', dataIndex: 'كمية المشتريات' }, { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات' },
      { title: 'نسبة المبيعات', dataIndex: 'نسبة المبيعات' }, { title: 'المبيعات', dataIndex: 'المبيعات' }, { title: 'فائض المخزون', dataIndex: 'فائض المخزون' },
      { title: 'نسبة الفائض', dataIndex: 'نسبة الفائض' }, { title: 'معد للارجاع', dataIndex: 'معد للارجاع' }, { title: 'الاحتياج', dataIndex: 'الاحتياج' },
      { title: 'بيان الفائض', dataIndex: 'بيان الفائض' },
    ], () => processedData.excessInventory || []);

    defineLazyReport('bookInventory', language === 'ar' ? 'الجرد الدفتري' : 'Book Inventory', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'الكمية', dataIndex: 'الكمية' }, { title: 'الافرادي', dataIndex: 'الافرادي' },
      { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' }, { title: 'المورد', dataIndex: 'المورد' }, { title: 'رقم السجل', dataIndex: 'رقم السجل' },
      { title: 'ملاحظات', dataIndex: 'ملاحظات' }, { title: 'القائمة', dataIndex: 'القائمة' },
    ], () => processedData.bookInventory || []);

    // 3. Financial Reports
    defineLazyReport('salesCost', language === 'ar' ? 'تكلفة المبيعات' : 'Sales Cost', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'الكمية', dataIndex: 'الكمية' }, { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
      { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية' }, { title: 'الافرادي', dataIndex: 'الافرادي' }, { title: 'افرادي الشراء', dataIndex: 'افرادي الشراء' },
      { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء' }, { title: 'المورد', dataIndex: 'المورد' }, { title: 'افرادي الربح', dataIndex: 'افرادي الربح' },
      { title: 'نسبة الربح', dataIndex: 'نسبة الربح' }, { title: 'اجمالي الربح', dataIndex: 'اجمالي الربح' }, { title: 'عمر العملية', dataIndex: 'عمر العملية' },
      { title: 'بيان الربحية', dataIndex: 'بيان الربحية' }, { title: 'ملاحظات', dataIndex: 'ملاحظات' },
    ], () => processedData.salesCost?.costOfSalesList || []);

    defineLazyReport('suppliersPayables', language === 'ar' ? 'استحقاق الموردين' : 'Suppliers Payables', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز الحساب', dataIndex: 'رمز الحساب' }, { title: 'المورد', dataIndex: 'المورد' },
      { title: 'مدين', dataIndex: 'مدين' }, { title: 'دائن', dataIndex: 'دائن' }, { title: 'الحساب المساعد', dataIndex: 'الحساب المساعد' },
      { title: 'الرصيد', dataIndex: 'الرصيد' }, { title: 'قيمة المخزون', dataIndex: 'قيمة المخزون' }, { title: 'الاستحقاق', dataIndex: 'الاستحقاق' },
      { title: 'المبلغ المستحق', dataIndex: 'المبلغ المستحق' }, { title: 'فائض المخزون', dataIndex: 'فائض المخزون' }, { title: 'معد للارجاع', dataIndex: 'معد للارجاع' },
      { title: 'مخزون مثالي', dataIndex: 'مخزون مثالي' }, { title: 'اصناف جديدة', dataIndex: 'اصناف جديدة' }, { title: 'الاحتياج', dataIndex: 'الاحتياج' },
      { title: 'منتهي', dataIndex: 'منتهي' }, { title: 'راكد تماما', dataIndex: 'راكد تماما' }, { title: 'قريب جدا', dataIndex: 'قريب جدا' }, { title: 'مخزون زائد', dataIndex: 'مخزون زائد' },
    ], () => processedData.suppliersPayables || []);

    defineLazyReport('mainAccounts', language === 'ar' ? 'ملخص الحسابات الرئيسية' : 'Main Accounts', [
      { title: 'م', dataIndex: 'م' }, { title: 'الحساب الرئيسي', dataIndex: 'الحساب الرئيسي' }, { title: 'عدد الموردين', dataIndex: 'عدد الموردين' },
      { title: 'إجمالي المديونية', dataIndex: 'إجمالي المديونية' }, { title: 'إجمالي قيمة المخزون', dataIndex: 'إجمالي قيمة المخزون' },
      { title: 'صافي الفجوة', dataIndex: 'صافي الفجوة' }, { title: 'إجمالي الاستحقاق', dataIndex: 'إجمالي الاستحقاق' },
      { title: 'فائض المخزون', dataIndex: 'فائض المخزون' }, { title: 'معد للارجاع', dataIndex: 'معد للارجاع' }, { title: 'مخزون مثالي', dataIndex: 'مخزون مثالي' },
      { title: 'اصناف جديدة', dataIndex: 'اصناف جديدة' }, { title: 'الاحتياج', dataIndex: 'الاحتياج' },
    ], () => processedData.mainAccounts || []);

    // 4. Analytical & Risk Reports
    defineLazyReport('itemProfitability', language === 'ar' ? 'ربحية الأصناف' : 'Item Profitability', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'عدد عمليات البيع', dataIndex: 'عدد عمليات البيع' },
      { title: 'إجمالي الكمية المباعة', dataIndex: 'إجمالي الكمية المباعة' }, { title: 'إجمالي قيمة المبيعات', dataIndex: 'إجمالي قيمة المبيعات' },
      { title: 'إجمالي تكلفة المبيعات', dataIndex: 'إجمالي تكلفة المبيعات' }, { title: 'إجمالي الربح', dataIndex: 'إجمالي الربح' },
      { title: 'نسبة هامش الربح %', dataIndex: 'نسبة هامش الربح %' }, { title: 'نسبة المساهمة في أرباح الشركة %', dataIndex: 'نسبة المساهمة في أرباح الشركة %' },
    ], () => advancedReports.itemProfitability || []);

    defineLazyReport('inventoryABC', language === 'ar' ? 'تحليل ABC للمخزون' : 'Inventory ABC Analysis', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'عدد عمليات البيع', dataIndex: 'عدد عمليات البيع' },
      { title: 'إجمالي الكمية المباعة', dataIndex: 'إجمالي الكمية المباعة' }, { title: 'إجمالي قيمة الاستهلاك السنوي', dataIndex: 'إجمالي قيمة الاستهلاك السنوي' },
      { title: 'القيمة التراكمية %', dataIndex: 'القيمة التراكمية %' }, { title: 'التصنيف ABC', dataIndex: 'التصنيف ABC' },
    ], () => advancedReports.inventoryABC || []);

    defineLazyReport('expiryRisk', language === 'ar' ? 'توقعات مخاطر انتهاء الصلاحية' : 'Expiry Risk Forecast', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'رقم السجل', dataIndex: 'رقم السجل' }, { title: 'الكمية الحالية', dataIndex: 'الكمية الحالية' },
      { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' }, { title: 'الأيام المتبقية', dataIndex: 'الأيام المتبقية' },
      { title: 'معدل البيع اليومي', dataIndex: 'معدل البيع اليومي' }, { title: 'الكمية المتوقعة للبيع', dataIndex: 'الكمية المتوقعة للبيع' },
      { title: 'الخطر المتوقع', dataIndex: 'الخطر المتوقع' }, { title: 'نسبة الخطر %', dataIndex: 'نسبة الخطر %' },
    ], () => advancedReports.expiryRisk || []);

    defineLazyReport('stagnationRisk', language === 'ar' ? 'مخاطر الركود' : 'Stagnation Risk', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'الكمية الحالية', dataIndex: 'الكمية الحالية' }, { title: 'عدد مرات البيع', dataIndex: 'عدد مرات البيع' },
      { title: 'متوسط الكمية المباعة', dataIndex: 'متوسط الكمية المباعة' }, { title: 'متوسط الفترة بين المبيعات', dataIndex: 'متوسط الفترة بين المبيعات (أيام)' },
      { title: 'معدل دوران المخزون', dataIndex: 'معدل دوران المخزون' }, { title: 'فترة التخزين المتوقعة', dataIndex: 'فترة التخزين المتوقعة (أيام)' },
      { title: 'مؤشر الخطورة', dataIndex: 'مؤشر الخطورة' }, { title: 'تصنيف الخطورة', dataIndex: 'تصنيف الخطورة' },
    ], () => advancedReports.stagnationRisk || []);

    defineLazyReport('inventoryTurnover', language === 'ar' ? 'دوران المخزون' : 'Inventory Turnover', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'الكمية المباعة', dataIndex: 'الكمية المباعة' }, { title: 'متوسط المخزون', dataIndex: 'متوسط المخزون' },
      { title: 'معدل الدوران', dataIndex: 'معدل الدوران' }, { title: 'فترة بقاء المخزون', dataIndex: 'فترة بقاء المخزون (أيام)' }, { title: 'التصنيف', dataIndex: 'التصنيف' },
    ], () => advancedReports.inventoryTurnover || []);

    defineLazyReport('idealReplenishment', language === 'ar' ? 'فجوة الشراء المثالية' : 'Ideal Replenishment Gap', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'المورد', dataIndex: 'المورد' },
      { title: 'متوسط الاستهلاك اليومي', dataIndex: 'متوسط الاستهلاك اليومي' }, { title: 'مخزون الأمان', dataIndex: 'مخزون الأمان' },
      { title: 'نقطة إعادة الطلب', dataIndex: 'نقطة إعادة الطلب' }, { title: 'الكمية المثالية للشراء', dataIndex: 'الكمية المثالية للشراء' },
      { title: 'الكمية الحالية', dataIndex: 'الكمية الحالية' }, { title: 'فجوة المخزون', dataIndex: 'فجوة المخزون' }, { title: 'الحالة', dataIndex: 'الحالة' }, { title: 'تصنيف ABC', dataIndex: 'تصنيف ABC' },
    ], () => advancedReports.idealReplenishment || []);

    defineLazyReport('newItemPerformance', language === 'ar' ? 'أداء الأصناف الجديدة' : 'New Item Performance', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'تاريخ أول شراء', dataIndex: 'تاريخ أول شراء' }, { title: 'تاريخ أول بيع', dataIndex: 'تاريخ أول بيع' },
      { title: 'فترة الركود الاولى', dataIndex: 'فترة الركود الاولى (أيام)' }, { title: 'إجمالي الكمية المشتراة', dataIndex: 'إجمالي الكمية المشتراة' },
      { title: 'إجمالي الكمية المباعة', dataIndex: 'إجمالي الكمية المباعة' }, { title: 'نسبة البيع', dataIndex: 'نسبة البيع %' }, { title: 'تقييم الأداء', dataIndex: 'تقييم الأداء' },
    ], () => advancedReports.newItemPerformance || []);

    defineLazyReport('supplierScorecards', language === 'ar' ? 'بطاقة تقييم الموردين' : 'Supplier Scorecards', [
      { title: 'م', dataIndex: 'م' }, { title: 'المورد', dataIndex: 'المورد' }, { title: 'عدد الأصناف', dataIndex: 'عدد الأصناف' },
      { title: 'إجمالي الكمية المشتراة', dataIndex: 'إجمالي الكمية المشتراة' }, { title: 'إجمالي القيمة المشتراة', dataIndex: 'إجمالي القيمة المشتراة' },
      { title: 'إجمالي الكمية المرتجعة', dataIndex: 'إجمالي الكمية المرتجعة' }, { title: 'إجمالي القيمة المرتجعة', dataIndex: 'إجمالي القيمة المرتجعة' },
      { title: 'نسبة المرتجعات %', dataIndex: 'نسبة المرتجعات %' }, { title: 'تباين الأسعار', dataIndex: 'تباين الأسعار' },
      { title: 'درجة الجودة', dataIndex: 'درجة الجودة' }, { title: 'درجة التسعير', dataIndex: 'درجة التسعير' }, { title: 'الدرجة الإجمالية', dataIndex: 'الدرجة الإجمالية' },
    ], () => advancedReports.supplierScorecards || []);

    defineLazyReport('supplierComparison', language === 'ar' ? 'مقارنة الموردين' : 'Supplier Comparison', [
      { title: 'م', dataIndex: 'م' }, { title: 'المورد', dataIndex: 'المورد' }, { title: 'درجة المورد', dataIndex: 'درجة المورد' },
      { title: 'ترتيب المورد', dataIndex: 'ترتيب المورد' }, { title: 'قرار التعامل', dataIndex: 'قرار التعامل الموصى به' },
      { title: 'نسبة المرتجعات %', dataIndex: 'نسبة المرتجعات %' }, { title: 'عدد الأخطاء', dataIndex: 'عدد الأخطاء في التوريد' },
      { title: 'الالتزام بالكمية %', dataIndex: 'نسبة الالتزام بالكمية' }, { title: 'الالتزام بالوقت %', dataIndex: 'نسبة الالتزام بالوقت' },
      { title: 'قيمة المخزون الحالي', dataIndex: 'قيمة المخزون الحالي' }, { title: 'قيمة المخزون الراكد', dataIndex: 'قيمة المخزون الراكد' },
      { title: 'الأصناف المنتهية', dataIndex: 'الأصناف المنتهية' }, { title: 'متوسط فترة السداد', dataIndex: 'متوسط فترة السداد' },
      { title: 'الالتزام المالي %', dataIndex: 'الالتزام المالي' }, { title: 'الرصيد', dataIndex: 'الرصيد' },
    ], () => advancedReports.supplierBenchmark || []);

    defineLazyReport('abnormalItems', language === 'ar' ? 'الاصناف الشاذة' : 'Abnormal Items', [
      { title: 'م', dataIndex: 'م' }, { title: 'رمز المادة', dataIndex: 'رمز المادة' }, { title: 'اسم المادة', dataIndex: 'اسم المادة' },
      { title: 'الوحدة', dataIndex: 'الوحدة' }, { title: 'الكمية', dataIndex: 'الكمية' }, { title: 'الافرادي', dataIndex: 'الافرادي' },
      { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' }, { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية' },
      { title: 'نوع العملية', dataIndex: 'نوع العملية' }, { title: 'القائمة', dataIndex: 'القائمة' }, { title: 'ملاحظات', dataIndex: 'ملاحظات' },
      { title: 'رقم السجل', dataIndex: 'رقم السجل' }, { title: 'المورد', dataIndex: 'المورد' },
    ], () => processedData.abnormalItems || []);

    // إضافة طريقة للحصول على جميع التقارير مع البيانات المحللة (للتصدير) مع توثيق تاريخ التقرير
    reports.getAllResolved = () => {
      const resolved = {};
      const dateStr = new Date().toISOString().slice(0,10); // YYYY-MM-DD
      Object.keys(reports).forEach(key => {
        if (key !== 'getAllResolved') { // تجاهل الدالة نفسها
          const reportData = reports[key]; // هذا يطلق getter ويخزّن في الكاش
          // أضف حقل `reportDate` بصيغة موحدة لكل تقرير
          resolved[key] = {
            data: reportData.data || [],
            sheetName: reportData.sheetName,
            columns: reportData.columns,
            reportDate: reportData.reportDate || dateStr
          };
        }
      });
      return resolved;
    };

    return reports;
  }, [processedData, language, advancedReports]);

  // LAZY: بيانات وصفية للتقارير فقط (بدون داتا) لاستخدامها في واجهة المستخدم (القوائم والمودالز)
  const allReportsMetadata = useMemo(() => {
    if (!processedData) return {};

    // حساب الأطوال والأسماء مباشرة دون استهلاك الذاكرة في دمج القوائم
    const getLen = (a, b) => (a?.length || 0) + (b?.length || 0);

    return {
      netPurchases: { sheetName: language === 'ar' ? 'صافي المشتريات' : 'Net Purchases', dataLength: getLen(processedData.netPurchases?.netPurchasesList, processedData.netPurchases?.orphanReturnsList) },
      netSales: { sheetName: language === 'ar' ? 'صافي المبيعات' : 'Net Sales', dataLength: getLen(processedData.netSales?.netSalesList, processedData.netSales?.orphanReturnsList) },
      physicalInventory: { sheetName: language === 'ar' ? 'الجرد الفعلي' : 'Physical Inventory', dataLength: getLen(processedData.physicalInventory?.listE, processedData.physicalInventory?.listF) },
      endingInventory: { sheetName: language === 'ar' ? 'المخزون النهائي' : 'Ending Inventory', dataLength: getLen(processedData.endingInventory?.endingInventoryList, processedData.endingInventory?.listB) },
      bookInventory: { sheetName: language === 'ar' ? 'الجرد الدفتري' : 'Book Inventory', dataLength: processedData.bookInventory?.length || 0 },
      salesCost: { sheetName: language === 'ar' ? 'تكلفة المبيعات' : 'Sales Cost', dataLength: processedData.salesCost?.costOfSalesList?.length || 0 },
      suppliersPayables: { sheetName: language === 'ar' ? 'استحقاق الموردين' : 'Suppliers Payables', dataLength: processedData.suppliersPayables?.length || 0 },
      abnormalItems: { sheetName: language === 'ar' ? 'الاصناف الشاذة' : 'Abnormal Items', dataLength: processedData.abnormalItems?.length || 0 },
      mainAccounts: { sheetName: language === 'ar' ? 'ملخص الحسابات الرئيسية' : 'Main Accounts', dataLength: processedData.mainAccounts?.length || 0 },
      itemProfitability: { sheetName: language === 'ar' ? 'ربحية الأصناف' : 'Item Profitability', dataLength: advancedReports.itemProfitability?.length || 0 },
      inventoryABC: { sheetName: language === 'ar' ? 'تحليل ABC للمخزون' : 'Inventory ABC Analysis', dataLength: advancedReports.inventoryABC?.length || 0 },
      expiryRisk: { sheetName: language === 'ar' ? 'مخاطر انتهاء الصلاحية' : 'Expiry Risk', dataLength: advancedReports.expiryRisk?.length || 0 },
      supplierScorecards: { sheetName: language === 'ar' ? 'بطاقة تقييم الموردين' : 'Supplier Scorecards', dataLength: advancedReports.supplierScorecards?.length || 0 },
      preparingReturns: { sheetName: language === 'ar' ? 'تجهيز المرتجعات' : 'Preparing Returns', dataLength: processedData.preparingReturns?.length || 0 },
      stagnationRisk: { sheetName: language === 'ar' ? 'مخاطر الركود' : 'Stagnation Risk', dataLength: advancedReports.stagnationRisk?.length || 0 },
      inventoryTurnover: { sheetName: language === 'ar' ? 'دوران المخزون' : 'Inventory Turnover', dataLength: advancedReports.inventoryTurnover?.length || 0 },
      idealReplenishment: { sheetName: language === 'ar' ? 'فجوة الشراء المثالية' : 'Ideal Replenishment Gap', dataLength: advancedReports.idealReplenishment?.length || 0 },
      newItemPerformance: { sheetName: language === 'ar' ? 'أداء الأصناف الجديدة' : 'New Item Performance', dataLength: advancedReports.newItemPerformance?.length || 0 },
      supplierBenchmark: { sheetName: language === 'ar' ? 'مقارنة الموردين' : 'Supplier Comparison', dataLength: advancedReports.supplierBenchmark?.length || 0 }
    };
  }, [processedData, language, advancedReports]);

  const handleDataProcessed = async (data) => {
    // Normalize incoming processed data to the Arabic keys used in the UI
    try {
      const normalized = normalizeProcessedData(data);
      // Diagnostic logs: print first record of each list if exists
      if (normalized) {
        if (normalized.netPurchasesList && normalized.netPurchasesList.length > 0) {
          console.log('[DIAG] netPurchasesList sample:', normalized.netPurchasesList[0]);
        }
        if (normalized.orphanReturnsList && normalized.orphanReturnsList.length > 0) {
          console.log('[DIAG] orphanReturnsList sample:', normalized.orphanReturnsList[0]);
        }
        if (normalized.netSalesList && normalized.netSalesList.length > 0) {
          console.log('[DIAG] netSalesList sample:', normalized.netSalesList[0]);
        }
        if (normalized.physicalInventoryList && normalized.physicalInventoryList.length > 0) {
          console.log('[DIAG] physicalInventoryList sample:', normalized.physicalInventoryList[0]);
        }
      }

      // Important: clear cached advanced reports and report metadata to avoid reusing stale analysis
      try {
        await cacheManager.clear('advancedReports');
        await cacheManager.clear('reports');
        setAdvancedReports({});
        console.log('✅ Cleared cached advanced reports and reports metadata before applying new processed data');
      } catch (clearErr) {
        console.warn('Failed to clear caches before import:', clearErr);
      }

      // Set the new processed data (this will trigger recomputation of advanced reports)
      setProcessedData(normalized);

      // إطلاق النسخ الاحتياطي التلقائي صامتاً في الخلفية بعد نجاح المعالجة
      performAutoBackup().catch(err => {
        console.error('Backup failed:', err);
        errorLogger.log(err, { context: 'AutoBackup' });
      });
    } catch (err) {
      console.error('Data normalization failed:', err);
      setProcessedData(data);
    }

    // Log memory usage after data processing
    if (performance.memory) {
      console.log(`📊 Memory after data processing: ${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    }
  };

  // DEV: if a processedData fixture exists under /dev/processedData.json, load it automatically
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return; // only in dev
    (async () => {
      try {
        const r = await fetch('/dev/processedData.json', { cache: 'no-store' });
        if (!r.ok) return;
        const devData = await r.json();
        if (devData) {
          console.log('[DEV] Loaded processedData from /dev/processedData.json');
          handleDataProcessed(devData);
        }
      } catch (err) {
        console.log('[DEV] No dev processedData fixture found or failed to load');
      }
    })();
  }, []);

  const onMenuItemClick = useCallback((item) => {
    if (item.key === 'logs') {
      setIsLogViewerVisible(true);
      return;
    }
    setActiveMenuItem(item.key);
    setMobileMenuVisible(false); // Close mobile drawer on selection
  }, []);



  // دالة لعرض محتوى التبويب النشط مع التحميل الخامل
  const renderContent = () => {
    if (activeMenuItem === 'dashboard') {
      return <Dashboard
        monetaryTotals={monetaryTotals}
        reportCounts={reportCounts}
        processedData={processedData}
        advancedReports={advancedReports}
      />;
    }

    const content = (() => {
      switch (activeMenuItem) {
        case 'import':
          return <ImportDataPage onDataProcessed={handleDataProcessed} />;
        case 'netPurchases':
          return <NetPurchasesPage data={processedData?.netPurchases} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'netSales':
          return <NetSalesPage data={processedData?.netSales} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'physicalInventory':
          return <PhysicalInventoryPage data={processedData?.physicalInventory} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'endingInventory':
          return <EndingInventoryPage data={processedData?.endingInventory} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'bookInventory':
          return <BookInventoryPage data={processedData?.bookInventory} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'salesCost':
          return <SalesCostPage data={processedData?.salesCost?.costOfSalesList} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        case 'excessInventory':
          return <ExcessInventoryPage data={processedData?.excessInventory} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'suppliersPayables':
          return <SuppliersPayablesPage data={processedData?.suppliersPayables} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'supplierMovement':
          return <SupplierMovementPage
            data={{
              suppliersPayables: processedData?.suppliersPayables,
              endingInventoryList: processedData?.endingInventory?.endingInventoryList,
              excessInventory: processedData?.excessInventory,
            }}
            allReportsData={getAllReportsData}
            showClearFilters={false}
            showFilterBar={false}
          />;
        case 'abnormalItems':
          return <AbnormalItemsPage data={processedData?.abnormalItems} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        case 'mainAccounts':
          return <MainAccountsPage data={processedData?.mainAccounts} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        case 'itemProfitability':
          return <ItemProfitabilityPage data={advancedReports.itemProfitability} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'inventoryABC':
          return <InventoryABCPage data={advancedReports.inventoryABC} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'expiryRisk':
          return <ExpiryRiskPage data={advancedReports.expiryRisk} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        case 'supplierScorecards':
          return <SupplierScorecardsPage data={advancedReports.supplierScorecards} allReportsData={getAllReportsData} availableReports={allReportsMetadata} />;
        case 'preparingReturns':
          return <PreparingReturnsPage data={processedData?.preparingReturns} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        case 'stagnationRisk':
          return <StagnationRiskPage data={advancedReports.stagnationRisk} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        case 'inventoryTurnover':
          return <InventoryTurnoverPage data={advancedReports.inventoryTurnover} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        case 'idealPurchaseGap':
          return <IdealReplenishmentPage data={advancedReports.idealReplenishment} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        case 'newItemPerformance':
          return <NewItemsPerformancePage data={advancedReports.newItemPerformance} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        case 'supplierComparison':
          return <SupplierComparisonPage data={advancedReports.supplierBenchmark} allReportsData={getAllReportsData} availableReports={allReportsMetadata} showClearFilters={false} showFilterBar={false} />;
        default:
          return <div>Select a report from the menu</div>;
      }
    })();

    return content;
  };

  return (
    <ConfigProvider
      direction={language === 'ar' ? 'rtl' : 'ltr'}
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: theme === 'dark' ? darkTheme.token : lightTheme.token
      }}
    >
      <Layout style={{ minHeight: '100vh', background: theme === 'dark' ? '#141414' : '#f0f2f5' }}>
        <Header className="header" style={{
          height: '64px',
          padding: 0,
          background: theme === 'dark' ? '#1f1f1f' : '#ffffff',
          borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24, paddingLeft: 24, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuVisible(true)}
                style={{
                  fontSize: '18px',
                  marginInlineEnd: '16px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                className="mobile-menu-trigger"
              />
              <BrandingHeader isCompact={true} style={{ borderRadius: 0, marginBottom: 0, border: 'none', background: 'transparent' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Switch
                checked={theme === 'dark'}
                onChange={toggleTheme}
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
                size="small"
              />
              <span style={{ color: theme === 'dark' ? '#cecece' : '#000000', fontSize: '12px', whiteSpace: 'nowrap' }}>
                {theme === 'dark' ? 'داكن' : 'فاتح'}
              </span>
            </div>
          </div>
        </Header>
        <Layout>
          <Sider
            width={250}
            className="site-layout-background sider-desktop"
            theme={theme}
            breakpoint="lg"
            collapsedWidth="0"
            trigger={null}
            style={{
              borderRight: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
              height: 'calc(100vh - 64px)',
              position: 'sticky',
              top: 64,
              overflow: 'auto'
            }}
          >
            <Menu
              mode="inline"
              theme={theme}
              selectedKeys={[activeMenuItem]}
              defaultOpenKeys={['dashboardItems', 'basicReports', 'inventoryReports', 'financialReports', 'riskReports', 'analyticalReports']}
              style={{ height: '100%', borderRight: 0 }}
              onClick={onMenuItemClick}
              items={useMemo(() => [
                {
                  key: 'dashboard',
                  icon: <DashboardOutlined />,
                  label: t('dashboard'),
                },
                {
                  key: 'import',
                  icon: <FileExcelOutlined />,
                  label: t('importData'),
                },
                {
                  key: 'basicReports',
                  label: t('basicReports'),
                  children: basicReportItems,
                },
                {
                  key: 'inventoryReports',
                  label: 'تقارير المخزون',
                  children: inventoryReportItems,
                },
                {
                  key: 'financialReports',
                  label: t('financialReports'),
                  children: financialReportItems,
                },
                {
                  key: 'riskReports',
                  label: 'تقارير المخاطر',
                  children: riskReportItems,
                },
                {
                  key: 'analyticalReports',
                  label: t('analyticalReports'),
                  children: analyticalReportItems,
                },
              ], [t, basicReportItems, inventoryReportItems, financialReportItems, riskReportItems, analyticalReportItems])}
            />
          </Sider>
          <Layout style={{ padding: '0 24px 24px' }}>
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 20, color: '#666' }}>Loading cached reports...</div>
                </div>
              ) : error ? (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                />
              ) : (
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    {renderContent()}
                  </Suspense>
                </ErrorBoundary>
              )}
            </Content>
          </Layout>
        </Layout>
      </Layout>

      {/* القائمة المتجاوبة (Mobile Drawer) */}
      <Drawer
        title="القائمة الرئيسية"
        placement={language === 'ar' ? 'right' : 'left'}
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={280}
        styles={{ body: { padding: 0 } }}
        theme={theme}
      >
        <Menu
          mode="inline"
          theme={theme}
          selectedKeys={[activeMenuItem]}
          onClick={onMenuItemClick}
          items={useMemo(() => [
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: t('dashboard'),
            },
            {
              key: 'import',
              icon: <FileExcelOutlined />,
              label: t('importData'),
            },
            {
              key: 'basicReports',
              label: t('basicReports'),
              children: basicReportItems,
            },
            {
              key: 'inventoryReports',
              label: 'تقارير المخزون',
              children: inventoryReportItems,
            },
            {
              key: 'financialReports',
              label: t('financialReports'),
              children: financialReportItems,
            },
            {
              key: 'riskReports',
              label: 'تقارير المخاطر',
              children: riskReportItems,
            },
            {
              key: 'analyticalReports',
              label: t('analyticalReports'),
              children: analyticalReportItems,
            },
          ], [t, basicReportItems, inventoryReportItems, financialReportItems, riskReportItems, analyticalReportItems])}
        />
      </Drawer>

      <LogViewer
        open={isLogViewerVisible}
        onClose={() => setIsLogViewerVisible(false)}
      />
      {/* Performance Monitor Toggle Header Icon or Shortcut Info could be added here */}
      <PerformanceMonitor visible={isPerfMonitorVisible} />
    </ConfigProvider>
  );
}

export default App;