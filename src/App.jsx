import React, { useState, useMemo } from 'react';
import { ConfigProvider, Layout, Typography, Tabs } from 'antd';
import ar_EG from 'antd/locale/ar_EG';

// استيراد صفحات العلامات
import ImportDataPage from './pages/ImportDataPage';
import NetPurchasesPage from './pages/NetPurchasesPage';
import NetSalesPage from './pages/NetSalesPage';
import PhysicalInventoryPage from './pages/PhysicalInventoryPage';
import EndingInventoryPage from './pages/EndingInventoryPage';
import BookInventoryPage from './pages/BookInventoryPage';
import SalesCostPage from './pages/SalesCostPage';
import ExcessInventoryPage from './pages/ExcessInventoryPage';
import SuppliersPayablesPage from './pages/SuppliersPayablesPage';
import SupplierMovementPage from './pages/SupplierMovementPage';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const [processedData, setProcessedData] = useState(null);
  const [activeTabKey, setActiveTabKey] = useState('import');

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
      import: 0, // لا يوجد سجلات للاستيراد
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

  const handleDataProcessed = (data) => {
    setProcessedData(data);
  };

  const onTabChange = (key) => {
    setActiveTabKey(key);
  };

  const tabItems = [
    {
      key: 'import',
      label: `استيراد البيانات`,
    },
    {
      key: 'netPurchases',
      label: `صافي المشتريات (${reportCounts.netPurchases})`,
    },
    {
      key: 'netSales',
      label: `صافي المبيعات (${reportCounts.netSales})`,
    },
    {
      key: 'physicalInventory',
      label: `الجرد الفعلي (${reportCounts.physicalInventory})`,
    },
    {
      key: 'endingInventory',
      label: `المخزون النهائي (${reportCounts.endingInventory})`,
    },
    {
      key: 'bookInventory',
      label: `الجرد الدفتري (${reportCounts.bookInventory})`,
    },
    {
      key: 'salesCost',
      label: `تكلفة المبيعات (${reportCounts.salesCost})`,
    },
    {
      key: 'excessInventory',
      label: `فائض المخزون (${reportCounts.excessInventory})`,
    },
    {
      key: 'suppliersPayables',
      label: `استحقاق الموردين (${reportCounts.suppliersPayables})`,
    },
    {
      key: 'supplierMovement',
      label: `حركة مورد (${reportCounts.supplierMovement})`,
    },
  ];

  // دالة لعرض محتوى التبويب النشط
  const renderTabContent = () => {
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
  };

  return (
    <ConfigProvider direction="rtl" locale={ar_EG}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 11 }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            يوسوفت محاسب الموردين والمخزون والمبيعات
          </Title>
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