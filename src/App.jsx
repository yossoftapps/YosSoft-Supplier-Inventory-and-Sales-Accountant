import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { Layout, Menu, Spin, Alert, Button, ConfigProvider } from 'antd';
import {
  FileExcelOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  DollarCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  FundViewOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './App.css';

// استيراد مكون التحميل الاحتياطي
import LoadingFallback from './components/LoadingFallback';

// تحميل الصفحات بشكل خامل لتحسين الأداء
const ImportDataPage = lazy(() => import('./pages/ImportDataPage'));
const NetPurchasesPage = lazy(() => import('./pages/NetPurchasesPage'));
const NetSalesPage = lazy(() => import('./pages/NetSalesPage'));
const PhysicalInventoryPage = lazy(() => import('./pages/PhysicalInventoryPage'));
const EndingInventoryPage = lazy(() => import('./pages/EndingInventoryPage'));
const BookInventoryPage = lazy(() => import('./pages/BookInventoryPage'));
const SalesCostPage = lazy(() => import('./pages/SalesCostPage'));
const ExcessInventoryPage = lazy(() => import('./pages/ExcessInventoryPage'));
const SuppliersPayablesPage = lazy(() => import('./pages/SuppliersPayablesPage'));
const SupplierMovementPage = lazy(() => import('./pages/SupplierMovementPage'));
const AbnormalItemsPage = lazy(() => import('./pages/AbnormalItemsPage'));
const MainAccountsPage = lazy(() => import('./pages/MainAccountsPage'));
const PreparingReturnsPage = lazy(() => import('./pages/PreparingReturnsPage'));
const ItemProfitabilityPage = lazy(() => import('./pages/ItemProfitabilityPage'));
const InventoryABCPage = lazy(() => import('./pages/InventoryABCPage'));
const ExpiryRiskPage = lazy(() => import('./pages/ExpiryRiskPage'));
const SupplierScorecardsPage = lazy(() => import('./pages/SupplierScorecardsPage'));
const StagnationRiskPage = lazy(() => import('./pages/StagnationRiskPage'));
const InventoryTurnoverPage = lazy(() => import('./pages/InventoryTurnoverPage'));
const IdealReplenishmentPage = lazy(() => import('./pages/IdealReplenishmentPage'));
const NewItemsPerformancePage = lazy(() => import('./pages/NewItemsPerformancePage'));
const SupplierComparisonPage = lazy(() => import('./pages/SupplierComparisonPage'));

// استيراد وظائف المساعدة
import { normalizeProcessedData } from './utils/dataNormalizer';
import { calculateItemProfitability } from './logic/itemProfitabilityLogic';
import { calculateInventoryABC } from './logic/inventoryABCLogic';
import { calculateExpiryRiskForecast } from './logic/expiryRiskLogic';
import { calculateSupplierScorecards } from './logic/supplierScorecardsLogic';
import { calculatePreparingReturns } from './logic/preparingReturnsLogic';
import { calculateStagnationRisk } from './logic/stagnationRiskLogic';
import { calculateInventoryTurnover } from './logic/inventoryTurnoverLogic';
import { calculateIdealReplenishmentGap } from './logic/idealReplenishmentLogic';
import { calculateNewItemsPerformance } from './logic/newItemsPerformanceLogic';
import { calculateSupplierBenchmark } from './logic/supplierBenchmarkLogic';

// استيراد لوحة التحكم
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import companyLogo from './assets/images/logo.png';
import BrandingHeader from './components/BrandingHeader';

// استيراد مدير التخزين المؤقت IndexedDB
import { cacheManager } from './utils/indexedDbManager';

const { Header, Sider, Content } = Layout;

function App() {
  const { t } = useTranslation();
  const [processedData, setProcessedData] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState('import');
  const [language, setLanguage] = useState('ar');
  const [cachedReports, setCachedReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // وظيفة تغيير اللغة
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
  };

  // تحميل التقارير المخزنة مؤقتاً من IndexedDB
  useEffect(() => {
    const loadCachedReports = async () => {
      setLoading(true);
      try {
        // Try to load from IndexedDB cache
        const cachedItemProfitability = await cacheManager.get('advancedReports', 'itemProfitability');
        const cachedInventoryABC = await cacheManager.get('advancedReports', 'inventoryABC');
        const cachedExpiryRisk = await cacheManager.get('advancedReports', 'expiryRisk');
        const cachedSupplierScorecards = await cacheManager.get('advancedReports', 'supplierScorecards');
        const cachedStagnationRisk = await cacheManager.get('advancedReports', 'stagnationRisk');
        const cachedInventoryTurnover = await cacheManager.get('advancedReports', 'inventoryTurnover');
        const cachedIdealReplenishment = await cacheManager.get('advancedReports', 'idealReplenishment');
        const cachedNewItemPerformance = await cacheManager.get('advancedReports', 'newItemPerformance');
        const cachedSupplierBenchmark = await cacheManager.get('advancedReports', 'supplierBenchmark');

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

        setCachedReports(cached);
      } catch (err) {
        console.warn('Failed to load cached reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCachedReports();
  }, []);

  // حساب مخزن للتقارير المتقدمة - يُحسب فقط عند الحاجة
  const advancedReports = useMemo(() => {
    if (!processedData) return {};

    // Check if we have cached versions
    const cached = { ...cachedReports };

    // Calculate item profitability if not cached
    if (!cached.itemProfitability) {
      const itemProfitability = calculateItemProfitability(
        processedData.salesCost?.costOfSalesList || [],
        processedData.netSales?.netSalesList || []
      );

      // Cache the result
      cacheManager.set('advancedReports', 'itemProfitability', itemProfitability, 30 * 60 * 1000); // 30 minutes TTL
      setCachedReports(prev => ({ ...prev, itemProfitability }));
      cached.itemProfitability = itemProfitability;
    }

    // Calculate inventory ABC if not cached
    if (!cached.inventoryABC) {
      const inventoryABC = calculateInventoryABC(processedData.salesCost?.costOfSalesList || []);

      // Cache the result
      cacheManager.set('advancedReports', 'inventoryABC', inventoryABC, 30 * 60 * 1000); // 30 minutes TTL
      setCachedReports(prev => ({ ...prev, inventoryABC }));
      cached.inventoryABC = inventoryABC;
    }

    // Calculate expiry risk if not cached
    if (!cached.expiryRisk) {
      const expiryRisk = calculateExpiryRiskForecast(
        processedData.netSales?.netSalesList || [],
        processedData.endingInventory?.endingInventoryList || []
      );

      // Cache the result
      cacheManager.set('advancedReports', 'expiryRisk', expiryRisk, 30 * 60 * 1000); // 30 minutes TTL
      setCachedReports(prev => ({ ...prev, expiryRisk }));
      cached.expiryRisk = expiryRisk;
    }

    // Calculate supplier scorecards if not cached
    if (!cached.supplierScorecards) {
      const supplierScorecards = calculateSupplierScorecards(
        processedData.netPurchases?.netPurchasesList || [],
        processedData.netPurchases?.orphanReturnsList || []
      );

      // Cache the result
      cacheManager.set('advancedReports', 'supplierScorecards', supplierScorecards, 30 * 60 * 1000); // 30 minutes TTL
      setCachedReports(prev => ({ ...prev, supplierScorecards }));
      cached.supplierScorecards = supplierScorecards;
    }

    // Calculate stagnation risk if not cached
    if (!cached.stagnationRisk) {
      const stagnationRisk = calculateStagnationRisk(
        processedData.netSales?.netSalesList || [],
        processedData.endingInventory?.endingInventoryList || []
      );

      cacheManager.set('advancedReports', 'stagnationRisk', stagnationRisk, 30 * 60 * 1000);
      setCachedReports(prev => ({ ...prev, stagnationRisk }));
      cached.stagnationRisk = stagnationRisk;
    }

    // Calculate inventory turnover if not cached
    if (!cached.inventoryTurnover) {
      const inventoryTurnover = calculateInventoryTurnover(
        processedData.netSales?.netSalesList || [],
        processedData.endingInventory?.endingInventoryList || []
      );

      cacheManager.set('advancedReports', 'inventoryTurnover', inventoryTurnover, 30 * 60 * 1000);
      setCachedReports(prev => ({ ...prev, inventoryTurnover }));
      cached.inventoryTurnover = inventoryTurnover;
    }

    // Calculate ideal replenishment gap if not cached
    if (!cached.idealReplenishment) {
      // Ensure inventory ABC is available
      let inventoryABC = cached.inventoryABC;
      if (!inventoryABC) {
        inventoryABC = calculateInventoryABC(processedData.salesCost?.costOfSalesList || []);
        cacheManager.set('advancedReports', 'inventoryABC', inventoryABC, 30 * 60 * 1000);
        setCachedReports(prev => ({ ...prev, inventoryABC }));
        cached.inventoryABC = inventoryABC;
      }

      const idealReplenishment = calculateIdealReplenishmentGap(
        processedData.netSales?.netSalesList || [],
        processedData.endingInventory?.endingInventoryList || [],
        inventoryABC
      );

      cacheManager.set('advancedReports', 'idealReplenishment', idealReplenishment, 30 * 60 * 1000);
      setCachedReports(prev => ({ ...prev, idealReplenishment }));
      cached.idealReplenishment = idealReplenishment;
    }

    // Calculate new items performance if not cached
    if (!cached.newItemPerformance) {
      const newItemPerformance = calculateNewItemsPerformance(
        processedData.netSales?.netSalesList || [],
        processedData.endingInventory?.endingInventoryList || []
      );

      cacheManager.set('advancedReports', 'newItemPerformance', newItemPerformance, 30 * 60 * 1000);
      setCachedReports(prev => ({ ...prev, newItemPerformance }));
      cached.newItemPerformance = newItemPerformance;
    }

    // Calculate supplier benchmark if not cached (dependent on scorecards)
    if (!cached.supplierBenchmark) {
      // Ensure scorecards are available
      let supplierScorecards = cached.supplierScorecards;
      if (!supplierScorecards) {
        supplierScorecards = calculateSupplierScorecards(
          processedData.netPurchases?.netPurchasesList || [],
          processedData.netPurchases?.orphanReturnsList || []
        );
        cacheManager.set('advancedReports', 'supplierScorecards', supplierScorecards, 30 * 60 * 1000);
        setCachedReports(prev => ({ ...prev, supplierScorecards }));
        cached.supplierScorecards = supplierScorecards;
      }

      const supplierBenchmark = calculateSupplierBenchmark(
        processedData.netPurchases?.netPurchasesList || [],
        processedData.netPurchases?.orphanReturnsList || [],
        supplierScorecards
      );

      cacheManager.set('advancedReports', 'supplierBenchmark', supplierBenchmark, 30 * 60 * 1000);
      setCachedReports(prev => ({ ...prev, supplierBenchmark }));
      cached.supplierBenchmark = supplierBenchmark;
    }

    return cached;
  }, [processedData, cachedReports]);

  // حساب تقرير تجهيز المرتجعات
  useEffect(() => {
    if (processedData?.endingInventory?.endingInventoryList && processedData.endingInventory.endingInventoryList.length > 0) {
      const preparingReturns = calculatePreparingReturns(
        processedData.endingInventory.endingInventoryList
      );
      setProcessedData(prev => ({
        ...prev,
        preparingReturns
      }));
    }
  }, [processedData?.endingInventory?.endingInventoryList]);

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
      netPurchases: processedData.netPurchases?.netPurchasesList.length + processedData.netPurchases?.orphanReturnsList.length || 0,
      netSales: processedData.netSales?.netSalesList.length + processedData.netSales?.orphanReturnsList.length || 0,
      physicalInventory: processedData.physicalInventory?.listE.length + processedData.physicalInventory?.listF.length || 0,
      endingInventory: processedData.endingInventory?.endingInventoryList.length + processedData.endingInventory?.listB.length || 0,
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
      preparingReturns: processedData?.preparingReturns?.length || 0
    };
  }, [processedData, advancedReports]);

  // حساب الإجماليات المالية للبطاقات في لوحة القيادة
  const monetaryTotals = useMemo(() => {
    if (!processedData) {
      return {
        netPurchases: 0,
        netSales: 0,
        physicalInventory: 0,
        endingInventory: 0,
        suppliersPayables: 0,
        abnormalItems: 0
      };
    }

    const calculateTotal = (items, priceKey = 'الافرادي', quantityKey = 'الكمية') => {
      return items?.reduce((sum, item) => {
        const price = parseFloat(item[priceKey]) || 0;
        const quantity = parseFloat(item[quantityKey]) || 0;
        return sum + (price * quantity);
      }, 0) || 0;
    };

    return {
      netPurchases: calculateTotal([
        ...(processedData.netPurchases?.netPurchasesList || []),
        ...(processedData.netPurchases?.orphanReturnsList || [])
      ]),
      netSales: calculateTotal([
        ...(processedData.netSales?.netSalesList || []),
        ...(processedData.netSales?.orphanReturnsList || [])
      ]),
      physicalInventory: calculateTotal([
        ...(processedData.physicalInventory?.listE || []),
        ...(processedData.physicalInventory?.listF || [])
      ]),
      endingInventory: calculateTotal([
        ...(processedData.endingInventory?.endingInventoryList || []),
        ...(processedData.endingInventory?.listB || [])
      ], 'الافرادي', 'الكمية'),
      suppliersPayables: processedData.suppliersPayables?.reduce((sum, item) => {
        return sum + (parseFloat(item['قيمة المخزون']) || 0);
      }, 0) || 0,
      abnormalItems: calculateTotal(processedData.abnormalItems || [])
    };
  }, [processedData]);

  // تحضير بيانات جميع التقارير لوظيفة التصدير
  const allReportsData = useMemo(() => {
    if (!processedData) return {};

    return {
      netPurchases: {
        data: [
          ...(processedData.netPurchases?.netPurchasesList || []),
          ...(processedData.netPurchases?.orphanReturnsList || [])
        ],
        sheetName: language === 'ar' ? 'صافي المشتريات' : 'Net Purchases',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية', dataIndex: 'الكمية' },
          { title: 'كمية الجرد', dataIndex: 'كمية الجرد' },
          { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات' },
          { title: 'الافرادي', dataIndex: 'الافرادي' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'المورد', dataIndex: 'المورد' },
          { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية' },
          { title: 'نوع العملية', dataIndex: 'نوع العملية' },
          { title: 'رقم السجل', dataIndex: 'رقم السجل' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
          { title: 'القائمة', dataIndex: 'القائمة' },
        ]
      },
      netSales: {
        data: [
          ...(processedData.netSales?.netSalesList || []),
          ...(processedData.netSales?.orphanReturnsList || [])
        ],
        sheetName: language === 'ar' ? 'صافي المبيعات' : 'Net Sales',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية', dataIndex: 'الكمية' },
          { title: 'الافرادي', dataIndex: 'الافرادي' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية' },
          { title: 'نوع العملية', dataIndex: 'نوع العملية' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
          { title: 'القائمة', dataIndex: 'القائمة' },
        ]
      },
      physicalInventory: {
        data: [
          ...(processedData.physicalInventory?.listE || []),
          ...(processedData.physicalInventory?.listF || [])
        ],
        sheetName: language === 'ar' ? 'الجرد الفعلي' : 'Physical Inventory',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية', dataIndex: 'الكمية' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
          { title: 'القائمة', dataIndex: 'القائمة' },
          { title: 'رقم السجل', dataIndex: 'رقم السجل' },
        ]
      },
      excessInventory: {
        data: processedData.excessInventory || [],
        sheetName: language === 'ar' ? 'فائض المخزون' : 'Excess Inventory',
        columns: [
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية', dataIndex: 'الكمية' },
          { title: 'كمية المشتريات', dataIndex: 'كمية المشتريات' },
          { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات' },
          { title: 'نسبة المبيعات', dataIndex: 'نسبة المبيعات' },
          { title: 'المبيعات', dataIndex: 'المبيعات' },
          { title: 'فائض المخزون', dataIndex: 'فائض المخزون' },
          { title: 'نسبة الفائض', dataIndex: 'نسبة الفائض' },
          { title: 'معد للارجاع', dataIndex: 'معد للارجاع' },
          { title: 'الاحتياج', dataIndex: 'الاحتياج' },
          { title: 'بيان الفائض', dataIndex: 'بيان الفائض' },
        ]
      },
      endingInventory: {
        data: [
          ...(processedData.endingInventory?.endingInventoryList || []),
          ...(processedData.endingInventory?.listB || [])
        ],
        sheetName: language === 'ar' ? 'المخزون النهائي' : 'Ending Inventory',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية', dataIndex: 'الكمية' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'الافرادي', dataIndex: 'الافرادي' },
          { title: 'الاجمالي', dataIndex: 'الاجمالي' },
          { title: 'تاريخ الشراء', dataIndex: 'تاريخ الشراء' },
          { title: 'المورد', dataIndex: 'المورد' },
          { title: 'عمر الصنف', dataIndex: 'عمر الصنف' },
          { title: 'كمية المبيعات', dataIndex: 'كمية المبيعات' },
          { title: 'نسبة الفائض', dataIndex: 'نسبة الفائض' },
          { title: 'فائض المخزون', dataIndex: 'فائض المخزون' },
          { title: 'قيمة فائض المخزون', dataIndex: 'قيمة فائض المخزون' },
          { title: 'معد للارجاع', dataIndex: 'معد للارجاع' },
          { title: 'قيمة معد للارجاع', dataIndex: 'قيمة معد للارجاع' },
          { title: 'مخزون مثالي', dataIndex: 'مخزون مثالي' },
          { title: 'قيمة مخزون مثالي', dataIndex: 'قيمة مخزون مثالي' },
          { title: 'صنف جديد', dataIndex: 'صنف جديد' },
          { title: 'قيمة صنف جديد', dataIndex: 'قيمة صنف جديد' },
          { title: 'الاحتياج', dataIndex: 'الاحتياج' },
          { title: 'قيمة الاحتياج', dataIndex: 'قيمة الاحتياج' },
          { title: 'بيان الصلاحية', dataIndex: 'بيان الصلاحية' },
          { title: 'بيان الحركة', dataIndex: 'بيان الحركة' },
          { title: 'بيان الحالة', dataIndex: 'الحالة' },
          { title: 'البيان', dataIndex: 'البيان' },
          { title: 'القائمة', dataIndex: 'القائمة' },
          { title: 'رقم السجل', dataIndex: 'رقم السجل' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
        ]
      },
      bookInventory: {
        data: processedData.bookInventory || [],
        sheetName: language === 'ar' ? 'الجرد الدفتري' : 'Book Inventory',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية', dataIndex: 'الكمية' },
          { title: 'الافرادي', dataIndex: 'الافرادي' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'المورد', dataIndex: 'المورد' },
          { title: 'رقم السجل', dataIndex: 'رقم السجل' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
          { title: 'القائمة', dataIndex: 'القائمة' },
        ]
      },
      salesCost: {
        data: processedData.salesCost?.costOfSalesList || [],
        sheetName: language === 'ar' ? 'تكلفة المبيعات' : 'Sales Cost',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية', dataIndex: 'الكمية' },
          { title: 'الافرادي', dataIndex: 'الافرادي' },
          { title: 'التكلفة', dataIndex: 'التكلفة' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'رقم السجل', dataIndex: 'رقم السجل' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
        ]
      },
      suppliersPayables: {
        data: processedData.suppliersPayables || [],
        sheetName: language === 'ar' ? 'استحقاق الموردين' : 'Suppliers Payables',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز الحساب', dataIndex: 'رمز الحساب' },
          { title: 'المورد', dataIndex: 'المورد' },
          { title: 'مدين', dataIndex: 'مدين' },
          { title: 'دائن', dataIndex: 'دائن' },
          { title: 'الحساب المساعد', dataIndex: 'الحساب المساعد' },
          { title: 'الرصيد', dataIndex: 'الرصيد' },
          { title: 'قيمة المخزون', dataIndex: 'قيمة المخزون' },
          { title: 'الاستحقاق', dataIndex: 'الاستحقاق' },
          { title: 'المبلغ المستحق', dataIndex: 'المبلغ المستحق' },
          { title: 'فائض المخزون', dataIndex: 'فائض المخزون' },
          { title: 'معد للارجاع', dataIndex: 'معد للارجاع' },
          { title: 'مخزون مثالي', dataIndex: 'مخزون مثالي' },
          { title: 'اصناف جديدة', dataIndex: 'اصناف جديدة' },
          { title: 'الاحتياج', dataIndex: 'الاحتياج' },
          { title: 'منتهي', dataIndex: 'منتهي' },
          { title: 'راكد تماما', dataIndex: 'راكد تماما' },
          { title: 'قريب جدا', dataIndex: 'قريب جدا' },
          { title: 'مخزون زائد', dataIndex: 'مخزون زائد' },
        ]
      },
      abnormalItems: {
        data: processedData.abnormalItems || [],
        sheetName: language === 'ar' ? 'الاصناف الشاذة' : 'Abnormal Items',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية', dataIndex: 'الكمية' },
          { title: 'الافرادي', dataIndex: 'الافرادي' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'تاريخ العملية', dataIndex: 'تاريخ العملية' },
          { title: 'نوع العملية', dataIndex: 'نوع العملية' },
          { title: 'القائمة', dataIndex: 'القائمة' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
          { title: 'رقم السجل', dataIndex: 'رقم السجل' },
          { title: 'المورد', dataIndex: 'المورد' },
        ]
      },
      mainAccounts: {
        data: processedData.mainAccounts || [],
        sheetName: 'ملخص الحسابات الرئيسية', // Arabic-only preferred by user context
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'الحساب الرئيسي', dataIndex: 'الحساب الرئيسي' },
          { title: 'عدد الموردين', dataIndex: 'عدد الموردين' },
          { title: 'إجمالي المديونية', dataIndex: 'إجمالي المديونية' },
          { title: 'إجمالي قيمة المخزون', dataIndex: 'إجمالي قيمة المخزون' },
          { title: 'صافي الفجوة', dataIndex: 'صافي الفجوة' },
          { title: 'إجمالي الاستحقاق', dataIndex: 'إجمالي الاستحقاق' },
          { title: 'فائض المخزون', dataIndex: 'فائض المخزون' },
          { title: 'معد للارجاع', dataIndex: 'معد للارجاع' },
          { title: 'مخزون مثالي', dataIndex: 'مخزون مثالي' },
          { title: 'اصناف جديدة', dataIndex: 'اصناف جديدة' },
          { title: 'الاحتياج', dataIndex: 'الاحتياج' },
        ]
      },
      itemProfitability: {
        data: advancedReports.itemProfitability || [],
        sheetName: language === 'ar' ? 'ربحية الأصناف' : 'Item Profitability',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'عدد عمليات البيع', dataIndex: 'عدد عمليات البيع' },
          { title: 'إجمالي الكمية المباعة', dataIndex: 'إجمالي الكمية المباعة' },
          { title: 'إجمالي قيمة المبيعات', dataIndex: 'إجمالي قيمة المبيعات' },
          { title: 'إجمالي تكلفة المبيعات', dataIndex: 'إجمالي تكلفة المبيعات' },
          { title: 'إجمالي الربح', dataIndex: 'إجمالي الربح' },
          { title: 'نسبة هامش الربح %', dataIndex: 'نسبة هامش الربح %' },
          { title: 'نسبة المساهمة في أرباح الشركة %', dataIndex: 'نسبة المساهمة في أرباح الشركة %' },
        ]
      },
      inventoryABC: {
        data: advancedReports.inventoryABC || [],
        sheetName: language === 'ar' ? 'تحليل ABC للمخزون' : 'Inventory ABC Analysis',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'عدد عمليات البيع', dataIndex: 'عدد عمليات البيع' },
          { title: 'إجمالي الكمية المباعة', dataIndex: 'إجمالي الكمية المباعة' },
          { title: 'إجمالي قيمة الاستهلاك السنوي', dataIndex: 'إجمالي قيمة الاستهلاك السنوي' },
          { title: 'القيمة التراكمية %', dataIndex: 'القيمة التراكمية %' },
          { title: 'التصنيف ABC', dataIndex: 'التصنيف ABC' },
        ]
      },
      expiryRisk: {
        data: advancedReports.expiryRisk || [],
        sheetName: language === 'ar' ? 'توقعات مخاطر انتهاء الصلاحية' : 'Expiry Risk Forecast',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'رقم السجل', dataIndex: 'رقم السجل' },
          { title: 'الكمية الحالية', dataIndex: 'الكمية الحالية' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'الأيام المتبقية', dataIndex: 'الأيام المتبقية' },
          { title: 'معدل البيع اليومي', dataIndex: 'معدل البيع اليومي' },
          { title: 'الكمية المتوقعة للبيع', dataIndex: 'الكمية المتوقعة للبيع' },
          { title: 'الخطر المتوقع', dataIndex: 'الخطر المتوقع' },
          { title: 'نسبة الخطر %', dataIndex: 'نسبة الخطر %' },
        ]
      },
      supplierScorecards: {
        data: advancedReports.supplierScorecards || [],
        sheetName: language === 'ar' ? 'بطاقة تقييم الموردين' : 'Supplier Scorecards',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'المورد', dataIndex: 'المورد' },
          { title: 'عدد الأصناف', dataIndex: 'عدد الأصناف' },
          { title: 'إجمالي الكمية المشتراة', dataIndex: 'إجمالي الكمية المشتراة' },
          { title: 'إجمالي القيمة المشتراة', dataIndex: 'إجمالي القيمة المشتراة' },
          { title: 'إجمالي الكمية المرتجعة', dataIndex: 'إجمالي الكمية المرتجعة' },
          { title: 'إجمالي القيمة المرتجعة', dataIndex: 'إجمالي القيمة المرتجعة' },
          { title: 'نسبة المرتجعات %', dataIndex: 'نسبة المرتجعات %' },
          { title: 'تباين الأسعار', dataIndex: 'تباين الأسعار' },
          { title: 'درجة الجودة', dataIndex: 'درجة الجودة' },
          { title: 'درجة التسعير', dataIndex: 'درجة التسعير' },
          { title: 'الدرجة الإجمالية', dataIndex: 'الدرجة الإجمالية' },
        ]
      },
      stagnationRisk: {
        data: advancedReports.stagnationRisk || [],
        sheetName: language === 'ar' ? 'مخاطر الركود' : 'Stagnation Risk',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية الحالية', dataIndex: 'الكمية الحالية' },
          { title: 'عدد مرات البيع', dataIndex: 'عدد مرات البيع' },
          { title: 'متوسط الكمية المباعة', dataIndex: 'متوسط الكمية المباعة' },
          { title: 'متوسط الفترة بين المبيعات', dataIndex: 'متوسط الفترة بين المبيعات (أيام)' },
          { title: 'معدل دوران المخزون', dataIndex: 'معدل دوران المخزون' },
          { title: 'فترة التخزين المتوقعة', dataIndex: 'فترة التخزين المتوقعة (أيام)' },
          { title: 'مؤشر الخطورة', dataIndex: 'مؤشر الخطورة' },
          { title: 'تصنيف الخطورة', dataIndex: 'تصنيف الخطورة' },
        ]
      },
      inventoryTurnover: {
        data: advancedReports.inventoryTurnover || [],
        sheetName: language === 'ar' ? 'دوران المخزون' : 'Inventory Turnover',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية المباعة', dataIndex: 'الكمية المباعة' },
          { title: 'متوسط المخزون', dataIndex: 'متوسط المخزون' },
          { title: 'معدل الدوران', dataIndex: 'معدل الدوران' },
          { title: 'فترة بقاء المخزون', dataIndex: 'فترة بقاء المخزون (أيام)' },
          { title: 'التصنيف', dataIndex: 'التصنيف' },
        ]
      },
      idealReplenishment: {
        data: advancedReports.idealReplenishment || [],
        sheetName: language === 'ar' ? 'فجوة الشراء المثالية' : 'Ideal Replenishment Gap',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'المورد', dataIndex: 'المورد' },
          { title: 'متوسط الاستهلاك اليومي', dataIndex: 'متوسط الاستهلاك اليومي' },
          { title: 'مخزون الأمان', dataIndex: 'مخزون الأمان' },
          { title: 'نقطة إعادة الطلب', dataIndex: 'نقطة إعادة الطلب' },
          { title: 'الكمية المثالية للشراء', dataIndex: 'الكمية المثالية للشراء' },
          { title: 'الكمية الحالية', dataIndex: 'الكمية الحالية' },
          { title: 'فجوة المخزون', dataIndex: 'فجوة المخزون' },
          { title: 'الحالة', dataIndex: 'الحالة' },
          { title: 'تصنيف ABC', dataIndex: 'تصنيف ABC' },
        ]
      },
      newItemPerformance: {
        data: advancedReports.newItemPerformance || [],
        sheetName: language === 'ar' ? 'أداء الأصناف الجديدة' : 'New Item Performance',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'تاريخ أول شراء', dataIndex: 'تاريخ أول شراء' },
          { title: 'تاريخ أول بيع', dataIndex: 'تاريخ أول بيع' },
          { title: 'فترة الركود الاولى', dataIndex: 'فترة الركود الاولى (أيام)' },
          { title: 'إجمالي الكمية المشتراة', dataIndex: 'إجمالي الكمية المشتراة' },
          { title: 'إجمالي الكمية المباعة', dataIndex: 'إجمالي الكمية المباعة' },
          { title: 'نسبة البيع', dataIndex: 'نسبة البيع %' },
          { title: 'تقييم الأداء', dataIndex: 'تقييم الأداء' },
        ]
      },
      supplierComparison: {
        data: advancedReports.supplierBenchmark || [],
        sheetName: language === 'ar' ? 'مقارنة الموردين' : 'Supplier Comparison',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'المورد', dataIndex: 'المورد' },
          { title: 'درجة المورد', dataIndex: 'درجة المورد' },
          { title: 'ترتيب المورد', dataIndex: 'ترتيب المورد' },
          { title: 'قرار التعامل', dataIndex: 'قرار التعامل الموصى به' },
          { title: 'نسبة المرتجعات %', dataIndex: 'نسبة المرتجعات %' },
          { title: 'عدد الأخطاء', dataIndex: 'عدد الأخطاء في التوريد' },
          { title: 'الالتزام بالكمية %', dataIndex: 'نسبة الالتزام بالكمية' },
          { title: 'الالتزام بالوقت %', dataIndex: 'نسبة الالتزام بالوقت' },
          { title: 'قيمة المخزون الحالي', dataIndex: 'قيمة المخزون الحالي' },
          { title: 'قيمة المخزون الراكد', dataIndex: 'قيمة المخزون الراكد' },
          { title: 'الأصناف المنتهية', dataIndex: 'الأصناف المنتهية' },
          { title: 'متوسط فترة السداد', dataIndex: 'متوسط فترة السداد' },
          { title: 'الالتزام المالي %', dataIndex: 'الالتزام المالي' },
          { title: 'الرصيد', dataIndex: 'الرصيد' },
        ]
      }
    };
  }, [processedData, language, advancedReports]);

  const handleDataProcessed = (data) => {
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
      setProcessedData(normalized);
    } catch (err) {
      console.error('Data normalization failed:', err);
      setProcessedData(data);
    }
  };

  const onMenuItemClick = (item) => {
    // معالج عنصر القائمة - لا توجد تنبيهات مطلوبة حيث تم تنفيذ جميع الصفحات
    setActiveMenuItem(item.key);
  };

  // تحديد عناصر القائمة مجمعة حسب الفئة وفقاً لمواصفات TODO.md
  const dashboardItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('dashboard'),
    },
    {
      key: 'import',
      icon: <FileExcelOutlined />,
      label: `${t('importData')}`,
    }
  ];

  const basicReportItems = [
    {
      key: 'netPurchases',
      icon: <ShoppingOutlined />,
      label: `صافي المشتريات (${reportCounts.netPurchases})`,
    },
    {
      key: 'netSales',
      icon: <DollarCircleOutlined />,
      label: `صافي المبيعات (${reportCounts.netSales})`,
    },
    {
      key: 'physicalInventory',
      icon: <DatabaseOutlined />,
      label: `الجرد الفعلي (${reportCounts.physicalInventory})`,
    },
    {
      key: 'excessInventory',
      icon: <FundViewOutlined />,
      label: `فائض المخزون (${reportCounts.excessInventory})`,
    }
  ];

  const inventoryReportItems = [
    {
      key: 'endingInventory',
      icon: <DatabaseOutlined />,
      label: `المخزون النهائي (${reportCounts.endingInventory})`,
    },
    {
      key: 'bookInventory',
      icon: <FileTextOutlined />,
      label: `الجرد الدفتري (${reportCounts.bookInventory})`,
    },
    {
      key: 'preparingReturns',
      icon: <BarChartOutlined />,
      label: `تجهيز المرتجعات (${reportCounts.preparingReturns})`,
    }
  ];

  const financialReportItems = [
    {
      key: 'suppliersPayables',
      icon: <DollarCircleOutlined />,
      label: `استحقاق الموردين (${reportCounts.suppliersPayables})`,
    },
    {
      key: 'supplierMovement',
      icon: <BarChartOutlined />,
      label: `حركة مورد (${reportCounts.supplierMovement})`,
    },
    {
      key: 'salesCost',
      icon: <DollarCircleOutlined />,
      label: `تكلفة المبيعات (${reportCounts.salesCost})`,
    },
    {
      key: 'itemProfitability',
      icon: <BarChartOutlined />,
      label: `ربحية الأصناف (${reportCounts.itemProfitability})`,
    },
    {
      key: 'mainAccounts',
      icon: <BarChartOutlined />,
      label: `ملخص الحسابات الرئيسية (${reportCounts.mainAccounts})`,
    }
  ];

  const riskReportItems = [
    {
      key: 'expiryRisk',
      icon: <FundViewOutlined />,
      label: `مخاطر انتهاء الصلاحية (${reportCounts.expiryRisk})`,
    },
    {
      key: 'stagnationRisk',
      icon: <FundViewOutlined />,
      label: `مخاطر الركود (${reportCounts.stagnationRisk})`,
    },
    {
      key: 'abnormalItems',
      icon: <FileTextOutlined />,
      label: `الأصناف الشاذة (${reportCounts.abnormalItems})`,
    }
  ];

  const analyticalReportItems = [
    {
      key: 'inventoryABC',
      icon: <FundViewOutlined />,
      label: `تحليل ABC للمخزون (${reportCounts.inventoryABC})`,
    },
    {
      key: 'inventoryTurnover',
      icon: <BarChartOutlined />,
      label: `دوران المخزون (${reportCounts.inventoryTurnover})`,
    },
    {
      key: 'idealPurchaseGap',
      icon: <BarChartOutlined />,
      label: `فجوة الشراء المثالية (${reportCounts.idealReplenishment})`,
    },
    {
      key: 'newItemPerformance',
      icon: <BarChartOutlined />,
      label: `أداء الأصناف الجديدة (${reportCounts.newItemPerformance})`,
    },
    {
      key: 'supplierScorecards',
      icon: <BarChartOutlined />,
      label: `بطاقة تقييم الموردين (${reportCounts.supplierScorecards})`,
    },
    {
      key: 'supplierComparison',
      icon: <BarChartOutlined />,
      label: `مقارنة الموردين (${reportCounts.supplierBenchmark})`,
    }
  ];

  // دالة لعرض محتوى التبويب النشط مع التحميل الخامل
  const renderContent = () => {
    if (activeMenuItem === 'dashboard') {
      return <Dashboard
        monetaryTotals={monetaryTotals}
        reportCounts={reportCounts}
        processedData={processedData}
        advancedReports={advancedReports}
        onDataProcessed={handleDataProcessed}
      />;
    }

    const content = (() => {
      switch (activeMenuItem) {
        case 'import':
          return <ImportDataPage onDataProcessed={handleDataProcessed} />;
        case 'netPurchases':
          return <NetPurchasesPage data={processedData?.netPurchases} allReportsData={allReportsData} />;
        case 'netSales':
          return <NetSalesPage data={processedData?.netSales} allReportsData={allReportsData} />;
        case 'physicalInventory':
          return <PhysicalInventoryPage data={processedData?.physicalInventory} allReportsData={allReportsData} />;
        case 'endingInventory':
          return <EndingInventoryPage data={processedData?.endingInventory} allReportsData={allReportsData} />;
        case 'bookInventory':
          return <BookInventoryPage data={processedData?.bookInventory} allReportsData={allReportsData} />;
        case 'salesCost':
          return <SalesCostPage data={processedData?.salesCost?.costOfSalesList} allReportsData={allReportsData} />;
        case 'excessInventory':
          return <ExcessInventoryPage data={processedData?.excessInventory} allReportsData={allReportsData} />;
        case 'suppliersPayables':
          return <SuppliersPayablesPage data={processedData?.suppliersPayables} allReportsData={allReportsData} />;
        case 'supplierMovement':
          return <SupplierMovementPage
            data={{
              suppliersPayables: processedData?.suppliersPayables,
              endingInventoryList: processedData?.endingInventory?.endingInventoryList,
            }}
            allReportsData={allReportsData}
          />;
        case 'abnormalItems':
          return <AbnormalItemsPage data={processedData?.abnormalItems} allReportsData={allReportsData} />;
        case 'mainAccounts':
          return <MainAccountsPage data={processedData?.mainAccounts} allReportsData={allReportsData} />;
        case 'itemProfitability':
          return <ItemProfitabilityPage data={advancedReports.itemProfitability} allReportsData={allReportsData} />;
        case 'inventoryABC':
          return <InventoryABCPage data={advancedReports.inventoryABC} allReportsData={allReportsData} />;
        case 'expiryRisk':
          return <ExpiryRiskPage data={advancedReports.expiryRisk} allReportsData={allReportsData} />;
        case 'supplierScorecards':
          return <SupplierScorecardsPage data={advancedReports.supplierScorecards} allReportsData={allReportsData} />;
        case 'preparingReturns':
          return <PreparingReturnsPage data={processedData?.preparingReturns} allReportsData={allReportsData} />;
        case 'stagnationRisk':
          return <StagnationRiskPage data={advancedReports.stagnationRisk} allReportsData={allReportsData} />;
        case 'inventoryTurnover':
          return <InventoryTurnoverPage data={advancedReports.inventoryTurnover} allReportsData={allReportsData} />;
        case 'idealPurchaseGap':
          return <IdealReplenishmentPage data={advancedReports.idealReplenishment} allReportsData={allReportsData} />;
        case 'newItemPerformance':
          return <NewItemsPerformancePage data={advancedReports.newItemPerformance} allReportsData={allReportsData} />;
        case 'supplierComparison':
          return <SupplierComparisonPage data={advancedReports.supplierBenchmark} allReportsData={allReportsData} />;
        default:
          return <div>Select a report from the menu</div>;
      }
    })();

    return content;
  };

  return (
    <ConfigProvider direction={language === 'ar' ? 'rtl' : 'ltr'}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="header" style={{ height: 'auto', padding: 0, lineHeight: 0, background: 'transparent' }}>
          <BrandingHeader style={{ borderRadius: 0, marginBottom: 0, border: 'none' }} />
        </Header>
        <Layout>
          <Sider width={250} className="site-layout-background">
            <Menu
              mode="inline"
              defaultSelectedKeys={['import']}
              defaultOpenKeys={['dashboardItems', 'basicReports', 'inventoryReports', 'financialReports', 'riskReports', 'analyticalReports']}
              style={{ height: '100%', borderRight: 0 }}
              onClick={onMenuItemClick}
              items={[
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
              ]}
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
                <Suspense fallback={<LoadingFallback /> }>
                  {renderContent()}
                </Suspense>
              )}
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;