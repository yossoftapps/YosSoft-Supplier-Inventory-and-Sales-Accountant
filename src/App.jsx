import React, { useState, useMemo, Suspense, lazy } from 'react';
import { ConfigProvider, Layout, Typography, Tabs, Select, Spin } from 'antd';
import ar_EG from 'antd/locale/ar_EG';
import en_US from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

// استيراد صفحة الاستيراد مباشرة (حرجة للبدء)
import ImportDataPage from './pages/ImportDataPage';
import { normalizeProcessedData } from './utils/dataNormalizer';

// استيراد صفحات التقارير بشكل كسول (Lazy Loading)
const NetPurchasesPage = lazy(() => import('./pages/NetPurchasesPage'));
const NetSalesPage = lazy(() => import('./pages/NetSalesPage'));
const PhysicalInventoryPage = lazy(() => import('./pages/PhysicalInventoryPage'));
const EndingInventoryPage = lazy(() => import('./pages/EndingInventoryPage'));
const BookInventoryPage = lazy(() => import('./pages/BookInventoryPage'));
const SalesCostPage = lazy(() => import('./pages/SalesCostPage'));
const ExcessInventoryPage = lazy(() => import('./pages/ExcessInventoryPage'));
const SuppliersPayablesPage = lazy(() => import('./pages/SuppliersPayablesPage'));
const SupplierMovementPage = lazy(() => import('./pages/SupplierMovementPage'));

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

function App() {
  const { t } = useTranslation();
  const [processedData, setProcessedData] = useState(null);
  const [activeTabKey, setActiveTabKey] = useState('import');
  const [language, setLanguage] = useState('ar');

  // Change language function
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
  };

  // استخدام useMemo لحساب عدد السجلات بكفاءة عند تغير البيانات فقط
  const reportCounts = useMemo(() => {
    if (!processedData) {
      return {
        import: 0, netPurchases: 0, netSales: 0, physicalInventory: 0,
        endingInventory: 0, bookInventory: 0, salesCost: 0, excessInventory: 0,
        suppliersPayables: 0, supplierMovement: 0,
      };
    }

    return {
      import: 0,
      netPurchases: processedData.netPurchases?.netPurchasesList.length + processedData.netPurchases?.orphanReturnsList.length || 0,
      netSales: processedData.netSales?.netSalesList.length + processedData.netSales?.orphanReturnsList.length || 0,
      physicalInventory: processedData.physicalInventory?.listE.length + processedData.physicalInventory?.listF.length || 0,
      endingInventory: processedData.endingInventory?.endingInventoryList.length + processedData.endingInventory?.listB.length || 0,
      bookInventory: processedData.bookInventory?.length || 0,
      salesCost: processedData.salesCost?.length || 0,
      excessInventory: processedData.excessInventory?.length || 0,
      suppliersPayables: processedData.suppliersPayables?.length || 0,
      supplierMovement: processedData.suppliersPayables?.length || 0,
    };
  }, [processedData]);

  // Prepare all reports data for export functionality
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
          { title: 'الافرادي', dataIndex: 'الافرادي' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'المورد', dataIndex: 'المورد' },
          { title: 'رقم السجل', dataIndex: 'رقم السجل' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
          { title: 'القائمة', dataIndex: 'القائمة' },
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
        data: processedData.salesCost || [],
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
      excessInventory: {
        data: processedData.excessInventory || [],
        sheetName: language === 'ar' ? 'فائض المخزون' : 'Excess Inventory',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'رمز المادة', dataIndex: 'رمز المادة' },
          { title: 'اسم المادة', dataIndex: 'اسم المادة' },
          { title: 'الوحدة', dataIndex: 'الوحدة' },
          { title: 'الكمية', dataIndex: 'الكمية' },
          { title: 'تاريخ الصلاحية', dataIndex: 'تاريخ الصلاحية' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
        ]
      },
      suppliersPayables: {
        data: processedData.suppliersPayables || [],
        sheetName: language === 'ar' ? 'استحقاق الموردين' : 'Suppliers Payables',
        columns: [
          { title: 'م', dataIndex: 'م' },
          { title: 'اسم المورد', dataIndex: 'اسم المورد' },
          { title: 'الرصيد', dataIndex: 'الرصيد' },
          { title: 'ملاحظات', dataIndex: 'ملاحظات' },
        ]
      }
    };
  }, [processedData, language]);

  const handleDataProcessed = (data) => {
    // Normalize incoming processed data to the Arabic keys used in the UI
    try {
      const normalized = normalizeProcessedData(data);
      setProcessedData(normalized);
    } catch (err) {
      console.error('Data normalization failed:', err);
      setProcessedData(data);
    }
  };

  const onTabChange = (key) => {
    setActiveTabKey(key);
  };

  const tabItems = [
    {
      key: 'import',
      label: `${t('importData')}`,
    },
    {
      key: 'netPurchases',
      label: `${t('netPurchases')} (${reportCounts.netPurchases})`,
    },
    {
      key: 'netSales',
      label: `${t('netSales')} (${reportCounts.netSales})`,
    },
    {
      key: 'physicalInventory',
      label: `${t('physicalInventory')} (${reportCounts.physicalInventory})`,
    },
    {
      key: 'endingInventory',
      label: `${t('endingInventory')} (${reportCounts.endingInventory})`,
    },
    {
      key: 'bookInventory',
      label: `${t('bookInventory')} (${reportCounts.bookInventory})`,
    },
    {
      key: 'salesCost',
      label: `${t('salesCost')} (${reportCounts.salesCost})`,
    },
    {
      key: 'excessInventory',
      label: `${t('excessInventory')} (${reportCounts.excessInventory})`,
    },
    {
      key: 'suppliersPayables',
      label: `${t('suppliersPayables')} (${reportCounts.suppliersPayables})`,
    },
    {
      key: 'supplierMovement',
      label: `${t('supplierMovement')} (${reportCounts.supplierMovement})`,
    },
  ];

  // دالة لعرض محتوى التبويب النشط مع Lazy Loading
  const renderTabContent = () => {
    const content = (() => {
      switch (activeTabKey) {
        case 'import':
          return <ImportDataPage onDataProcessed={handleDataProcessed} />;
        case 'netPurchases':
          return <NetPurchasesPage data={processedData?.netPurchases} />;
        case 'netSales':
          return <NetSalesPage data={processedData?.netSales} />;
        case 'physicalInventory':
          return <PhysicalInventoryPage data={processedData?.physicalInventory} />;
        case 'endingInventory':
          return <EndingInventoryPage data={processedData?.endingInventory} />;
        case 'bookInventory':
          return <BookInventoryPage data={processedData?.bookInventory} />;
        case 'salesCost':
          return <SalesCostPage data={processedData?.salesCost} />;
        case 'excessInventory':
          return <ExcessInventoryPage data={processedData?.excessInventory} />;
        case 'suppliersPayables':
          return <SuppliersPayablesPage data={processedData?.suppliersPayables} />;
        case 'supplierMovement':
          return <SupplierMovementPage
            data={{
              suppliersPayables: processedData?.suppliersPayables,
              endingInventoryList: processedData?.endingInventory?.endingInventoryList,
              excessInventory: processedData?.excessInventory,
            }}
          />;
        default:
          return null;
      }
    })();

    // إذا كان التبويب النشط ليس "import"، استخدم Suspense
    if (activeTabKey !== 'import') {
      return (
        <Suspense fallback={
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>{t('loading') || 'جاري التحميل...'}</div>
          </div>
        }>
          {content}
        </Suspense>
      );
    }

    return content;
  };

  return (
    <ConfigProvider direction={language === 'ar' ? "rtl" : "ltr"} locale={language === 'ar' ? ar_EG : en_US}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              {t('appTitle')}
            </Title>
            <Select
              defaultValue="ar"
              style={{ width: 120 }}
              onChange={changeLanguage}
              value={language}
            >
              <Option value="ar">العربية</Option>
              <Option value="en">English</Option>
            </Select>
          </div>
        </Header>

        <Tabs
          activeKey={activeTabKey}
          onChange={onTabChange}
          items={tabItems}
          className="sticky-tabs"
          style={{ background: '#fff', padding: '0 24px', margin: 0 }}
        />

        <Content style={{ padding: '24px' }}>
          {renderTabContent()}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;