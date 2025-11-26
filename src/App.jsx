import React, { useState } from 'react';
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

  const [reportCounts, setReportCounts] = useState({
    import: 0, netPurchases: 0, netSales: 0, physicalInventory: 0,
    endingInventory: 0, bookInventory: 0, salesCost: 0, excessInventory: 0,
    suppliersPayables: 0, supplierMovement: 0,
  });

  const handleDataProcessed = (data) => {
    setProcessedData(data);
    const counts = { ...reportCounts };
    counts.netPurchases = data.netPurchases.netPurchasesList.length + data.netPurchases.orphanReturnsList.length;
    counts.netSales = data.netSales.netSalesList.length + data.netSales.orphanReturnsList.length;
    setReportCounts(counts);
  };

  const onTabChange = (key) => {
    setActiveTabKey(key);
  };

  const tabItems = [
    {
      key: 'import',
      label: (<span>استيراد البيانات<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.import})</span></span>),
    },
    {
      key: 'netPurchases',
      label: (<span>صافي المشتريات<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.netPurchases})</span></span>),
    },
    {
      key: 'netSales',
      label: (<span>صافي المبيعات<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.netSales})</span></span>),
    },
    {
      key: 'physicalInventory',
      label: (<span>الجرد الفعلي<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.physicalInventory})</span></span>),
    },
    {
      key: 'endingInventory',
      label: (<span>المخزون النهائي<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.endingInventory})</span></span>),
    },
    {
      key: 'bookInventory',
      label: (<span>الجرد الدفتري<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.bookInventory})</span></span>),
    },
    {
      key: 'salesCost',
      label: (<span>تكلفة المبيعات<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.salesCost})</span></span>),
    },
    {
      key: 'excessInventory',
      label: (<span>فائض المخزون<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.excessInventory})</span></span>),
    },
    {
      key: 'suppliersPayables',
      label: (<span>استحقاق الموردين<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.suppliersPayables})</span></span>),
    },
    {
      key: 'supplierMovement',
      label: (<span>حركة مورد<span style={{ marginRight: 8, color: '#888' }}>({reportCounts.supplierMovement})</span></span>),
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
        return <SupplierMovementPage data={processedData?.supplierMovement} />;
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