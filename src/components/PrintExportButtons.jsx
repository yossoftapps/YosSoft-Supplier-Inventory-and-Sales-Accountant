// Print and Export Buttons Component
import React, { useState, useRef, memo } from 'react';
import { Button, Space, message, Dropdown, Modal, Checkbox, List, Progress } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { serializeData } from '../utils/financialCalculations';

const PrintExportButtons = memo(({ data, title, columns, filename, allReportsData }) => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const workerRef = useRef(null);

  // Print functionality
  const handlePrint = () => {
    // Create a hidden iframe for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; }
          h1 { text-align: center; }
          @media print {
            body { font-size: 12px; }
            table { font-size: 10px; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${generatePrintTable(data, columns)}
        <script>
          window.onload = function() {
            window.print();
            // Close window after printing (optional)
            // window.close();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generate HTML table for printing
  const generatePrintTable = (data, columns) => {
    if (!data || !Array.isArray(data) || data.length === 0) return '<p>لا توجد بيانات للطباعة</p>';

    let tableHtml = '<table><thead><tr>';

    // Add headers
    columns.forEach(col => {
      if (col.title) {
        tableHtml += `<th>${col.title}</th>`;
      }
    });

    tableHtml += '</tr></thead><tbody>';

    // Add data rows
    data.forEach(row => {
      tableHtml += '<tr>';
      columns.forEach(col => {
        if (col.dataIndex) {
          const value = row[col.dataIndex];
          tableHtml += `<td>${value !== undefined && value !== null ? value : ''}</td>`;
        }
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    return tableHtml;
  };

  // Export current report to Excel functionality
  const handleExportCurrent = () => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        message.warning('لا توجد بيانات للتصدير');
        return;
      }

      // Prepare data structure similar to allReportsData for consistency
      const currentReportData = {
        current: {
          data: data,
          columns: columns,
          sheetName: title.substring(0, 31)
        }
      };

      // Use background export for consistency and better performance
      exportBackground(currentReportData, `${filename || 'export'}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('حدث خطأ أثناء التصدير');
    }
  };

  // Export all reports to a single Excel file with multiple sheets
  const handleExportAll = () => {
    // Always use background export for consistency
    exportAllBackground();
  };

  // Check if we should use direct export or background export
  const shouldUseDirectExport = () => {
    if (!allReportsData) return true;
    
    // Estimate total records
    let totalRecords = 0;
    Object.keys(allReportsData).forEach(reportKey => {
      const report = allReportsData[reportKey];
      if (report.data && Array.isArray(report.data)) {
        totalRecords += report.data.length;
      }
    });
    
    // Use direct export for smaller datasets (< 10000 records)
    return totalRecords < 10000;
  };

  // REMOVED: Direct export functions since we're now using Web Workers consistently

  // Background export for larger datasets
  const exportAllBackground = (isRetry = false) => {
    try {
      if (!allReportsData || Object.keys(allReportsData).length === 0) {
        message.warning('لا توجد تقارير للتصدير');
        return;
      }

      // Create Web Worker with module type to support ES6 imports
      try {
        workerRef.current = new Worker(new URL('../workers/exportWorker.js', import.meta.url), { type: 'module' });
      } catch (error) {
        console.error('Failed to create Web Worker:', error);
        setExportError('فشل في إنشاء عملية التصدير في الخلفية. الرجاء التأكد من دعم المتصفح لهذه الميزة.');
        setIsExporting(false);
        setIsModalVisible(false);
        return;
      }

      // Listen for messages from the worker
      workerRef.current.onmessage = (event) => {
        const { type, message: workerMessage, progress, blob, filename } = event.data;

        switch (type) {
          case 'PROGRESS':
            setExportProgress(progress);
            setExportMessage(workerMessage);
            setExportError(''); // Clear any previous errors
            break;
          case 'COMPLETE':
            try {
              // Create download link
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename || 'جميع-التقارير.xlsx';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);

              // Reset export state
              setIsExporting(false);
              setExportProgress(0);
              setExportMessage('');
              setExportError('');
              setRetryCount(0);
              workerRef.current.terminate();
              workerRef.current = null;

              message.success('تم تصدير جميع التقارير إلى ملف Excel واحد بنجاح');
            } catch (error) {
              console.error('Error during download:', error);
              setExportError('حدث خطأ أثناء تنزيل الملف. الرجاء المحاولة مرة أخرى.');
              setIsExporting(false);
              setExportProgress(0);
              setExportMessage('');
              if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
              }
            }
            break;
          case 'ERROR':
            const errorMsg = `حدث خطأ أثناء التصدير: ${workerMessage}`;
            console.error('Worker error:', workerMessage);
            setExportError(errorMsg);
            setIsExporting(false);
            setExportProgress(0);
            setExportMessage('');
            if (workerRef.current) {
              workerRef.current.terminate();
              workerRef.current = null;
            }
            // Don't show error message here, let user decide to retry
            break;
          case 'CANCELLED':
            setIsExporting(false);
            setExportProgress(0);
            setExportMessage('');
            setExportError('');
            if (workerRef.current) {
              workerRef.current.terminate();
              workerRef.current = null;
            }
            message.info('تم إلغاء عملية التصدير');
            break;
        }
      };

      // Start export process
      setIsExporting(true);
      setExportProgress(0);
      setExportMessage(isRetry ? 'إعادة المحاولة...' : 'بدء عملية التصدير...');
      setExportError('');

      // Serialize data to convert Decimal objects to plain numbers
      const serializedData = serializeData(allReportsData);

      // Send data to worker (no need to send XLSX library anymore)
      workerRef.current.postMessage({
        type: 'EXPORT_REPORTS',
        data: serializedData,
        filename: 'جميع-التقارير.xlsx'
      });
      
      // Set up periodic progress updates for long operations
      const progressInterval = setInterval(() => {
        if (!isExporting) {
          clearInterval(progressInterval);
        }
      }, 1000);
    } catch (error) {
      console.error('Background export error:', error);
      setExportError(`حدث خطأ أثناء بدء التصدير في الخلفية: ${error.message}`);
      setIsExporting(false);
      setExportProgress(0);
      setExportMessage('');
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    }
  };

  // Generic background export function
  const exportBackground = (reportsData, fileName) => {
    try {
      // Create Web Worker with module type to support ES6 imports
      try {
        workerRef.current = new Worker(new URL('../workers/exportWorker.js', import.meta.url), { type: 'module' });
      } catch (error) {
        console.error('Failed to create Web Worker:', error);
        message.error('فشل في إنشاء عملية التصدير في الخلفية. الرجاء التأكد من دعم المتصفح لهذه الميزة.');
        setIsExporting(false);
        return;
      }

      // Listen for messages from the worker
      workerRef.current.onmessage = (event) => {
        const { type, message: workerMessage, progress, blob, filename } = event.data;

        switch (type) {
          case 'PROGRESS':
            setExportProgress(progress);
            setExportMessage(workerMessage);
            setExportError(''); // Clear any previous errors
            break;
          case 'COMPLETE':
            try {
              // Create download link
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename || fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);

              // Reset export state
              setIsExporting(false);
              setExportProgress(0);
              setExportMessage('');
              setExportError('');
              setRetryCount(0);
              workerRef.current.terminate();
              workerRef.current = null;

              message.success('تم تصدير البيانات إلى Excel بنجاح');
            } catch (error) {
              console.error('Error during download:', error);
              setExportError('حدث خطأ أثناء تنزيل الملف. الرجاء المحاولة مرة أخرى.');
              setIsExporting(false);
              setExportProgress(0);
              setExportMessage('');
              if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
              }
            }
            break;
          case 'ERROR':
            const errorMsg = `حدث خطأ أثناء التصدير: ${workerMessage}`;
            console.error('Worker error:', workerMessage);
            setExportError(errorMsg);
            setIsExporting(false);
            setExportProgress(0);
            setExportMessage('');
            if (workerRef.current) {
              workerRef.current.terminate();
              workerRef.current = null;
            }
            message.error(errorMsg);
            break;
          case 'CANCELLED':
            setIsExporting(false);
            setExportProgress(0);
            setExportMessage('');
            setExportError('');
            if (workerRef.current) {
              workerRef.current.terminate();
              workerRef.current = null;
            }
            message.info('تم إلغاء عملية التصدير');
            break;
        }
      };

      // Start export process
      setIsExporting(true);
      setExportProgress(0);
      setExportMessage('بدء عملية التصدير...');
      setExportError('');

      // Serialize data to convert Decimal objects to plain numbers
      const serializedData = serializeData(reportsData);

      // Send data to worker
      workerRef.current.postMessage({
        type: 'EXPORT_REPORTS',
        data: serializedData,
        filename: fileName
      });
      
      // Set up periodic progress updates for long operations
      const progressInterval = setInterval(() => {
        if (!isExporting) {
          clearInterval(progressInterval);
        }
      }, 1000);
    } catch (error) {
      console.error('Background export error:', error);
      setExportError(`حدث خطأ أثناء بدء التصدير في الخلفية: ${error.message}`);
      setIsExporting(false);
      setExportProgress(0);
      setExportMessage('');
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    }
  };

  // Show selective export modal
  const showSelectiveExportModal = () => {
    // Initialize selected reports with all available reports
    const reportKeys = allReportsData ? Object.keys(allReportsData) : [];
    setSelectedReports(reportKeys);
    setIsModalVisible(true);
  };

  // Handle selective export
  const handleSelectiveExport = () => {
    try {
      if (!allReportsData || Object.keys(allReportsData).length === 0) {
        message.warning('لا توجد تقارير للتصدير');
        setIsModalVisible(false);
        return;
      }

      if (selectedReports.length === 0) {
        message.warning('يرجى اختيار تقرير واحد على الأقل للتصدير');
        return;
      }

      // Always use background export for consistency
      exportSelectedBackground();
    } catch (error) {
      console.error('Selective export error:', error);
      message.error('حدث خطأ أثناء تصدير التقارير المحددة');
    }
  };

  // Check if we should use direct export or background export for selected reports
  const shouldUseDirectSelectiveExport = () => {
    if (!allReportsData || selectedReports.length === 0) return true;
    
    // Estimate total records for selected reports
    let totalRecords = 0;
    selectedReports.forEach(reportKey => {
      const report = allReportsData[reportKey];
      if (report && report.data && Array.isArray(report.data)) {
        totalRecords += report.data.length;
      }
    });
    
    // Use direct export for smaller datasets (< 5000 records)
    return totalRecords < 5000;
  };

  // REMOVED: Direct export functions since we're now using Web Workers consistently

  // Background export for selected reports (larger datasets)
  const exportSelectedBackground = () => {
    try {
      // Prepare data for selected reports only
      const selectedReportsData = {};
      selectedReports.forEach(reportKey => {
        selectedReportsData[reportKey] = allReportsData[reportKey];
      });
      
      // Serialize data to convert Decimal objects to plain numbers
      const serializedData = serializeData(selectedReportsData);

      // Create Web Worker with module type to support ES6 imports
      try {
        workerRef.current = new Worker(new URL('../workers/exportWorker.js', import.meta.url), { type: 'module' });
      } catch (error) {
        console.error('Failed to create Web Worker:', error);
        message.error('فشل في إنشاء عملية التصدير في الخلفية. الرجاء التأكد من دعم المتصفح لهذه الميزة.');
        setIsExporting(false);
        setIsModalVisible(false);
        return;
      }

      // Listen for messages from the worker
      workerRef.current.onmessage = (event) => {
        const { type, message: workerMessage, progress, blob, filename } = event.data;

        switch (type) {
          case 'PROGRESS':
            setExportProgress(progress);
            setExportMessage(workerMessage);
            break;
          case 'COMPLETE':
            try {
              // Create download link
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename || 'التقارير-المحددة.xlsx';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);

              // Reset export state
              setIsExporting(false);
              setExportProgress(0);
              setExportMessage('');
              setIsModalVisible(false);
              workerRef.current.terminate();
              workerRef.current = null;

              message.success('تم تصدير التقارير المحددة إلى ملف Excel واحد بنجاح');
            } catch (error) {
              console.error('Error during download:', error);
              message.error('حدث خطأ أثناء تنزيل الملف. الرجاء المحاولة مرة أخرى.');
              setIsExporting(false);
              setExportProgress(0);
              setExportMessage('');
              setIsModalVisible(false);
              if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
              }
            }
            break;
          case 'ERROR':
            setIsExporting(false);
            setExportProgress(0);
            setExportMessage('');
            setIsModalVisible(false);
            workerRef.current.terminate();
            workerRef.current = null;
            message.error(`حدث خطأ أثناء التصدير: ${workerMessage}`);
            break;
        }
      };

      // Start export process
      setIsExporting(true);
      setExportProgress(0);
      setExportMessage('بدء عملية التصدير...');
      setExportError(''); // Clear any previous errors

      // Send data to worker (no need to send XLSX library anymore)
      workerRef.current.postMessage({
        type: 'EXPORT_REPORTS',
        data: serializedData,
        filename: 'التقارير-المحددة.xlsx'
      });
      
      // Set up periodic progress updates for long operations
      const progressInterval = setInterval(() => {
        if (!isExporting) {
          clearInterval(progressInterval);
        }
      }, 1000);
    } catch (error) {
      console.error('Background selective export error:', error);
      setIsExporting(false);
      setExportProgress(0);
      setExportMessage('');
      setIsModalVisible(false);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      message.error(`حدث خطأ أثناء بدء التصدير في الخلفية: ${error.message}`);
    }
  };

  // Handle checkbox selection
  const handleReportSelection = (reportKey) => {
    if (selectedReports.includes(reportKey)) {
      setSelectedReports(selectedReports.filter(key => key !== reportKey));
    } else {
      setSelectedReports([...selectedReports, reportKey]);
    }
  };

  // Handle select all/deselect all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedReports(allReportsData ? Object.keys(allReportsData) : []);
    } else {
      setSelectedReports([]);
    }
  };

  // Handle cancel export
  const handleCancelExport = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CANCEL_EXPORT' });
    }
    setIsExporting(false);
    setExportProgress(0);
    setExportMessage('');
    setExportError('');
    setRetryCount(0);
    if (workerRef.current) {
      // Give worker time to clean up before terminating
      setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      }, 100);
    }
    message.info('تم إلغاء عملية التصدير');
  };

  // Handle retry export
  const handleRetryExport = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      exportAllBackground(true);
    }
  };

  // Export menu items (AntD v5 "menu" prop)
  const menuItems = [
    { key: 'current', label: t('exportCurrentReport'), onClick: handleExportCurrent },
  ];
  
  if (allReportsData && Object.keys(allReportsData).length > 0) {
    menuItems.push({ key: 'all', label: t('exportAllReports'), onClick: handleExportAll });
    menuItems.push({ key: 'selective', label: 'تصدير محدد', onClick: showSelectiveExportModal });
  }

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
        >
          {t('print')}
        </Button>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            loading={isExporting}
          >
            {t('exportToExcel')}
          </Button>
        </Dropdown>
      </Space>

      {/* Selective Export Modal */}
      <Modal
        title="اختر التقارير للتصدير"
        open={isModalVisible}
        onOk={handleSelectiveExport}
        onCancel={() => setIsModalVisible(false)}
        okText="تصدير"
        cancelText="إلغاء"
        width={600}
        confirmLoading={isExporting}
      >
        {allReportsData && Object.keys(allReportsData).length > 0 ? (
          <div>
            <Checkbox
              onChange={(e) => handleSelectAll(e.target.checked)}
              checked={selectedReports.length === Object.keys(allReportsData).length}
              indeterminate={selectedReports.length > 0 && selectedReports.length < Object.keys(allReportsData).length}
              style={{ marginBottom: 16 }}
            >
              تحديد الكل / إلغاء تحديد الكل
            </Checkbox>
            <List
              dataSource={Object.entries(allReportsData)}
              renderItem={([reportKey, report]) => (
                <List.Item>
                  <Checkbox
                    onChange={() => handleReportSelection(reportKey)}
                    checked={selectedReports.includes(reportKey)}
                  >
                    {report.sheetName} ({report.data ? report.data.length : 0} سجل)
                  </Checkbox>
                </List.Item>
              )}
            />
          </div>
        ) : (
          <p>لا توجد تقارير متاحة للتصدير</p>
        )}
      </Modal>

      {/* Export Progress Modal */}
      <Modal
        title="جارٍ التصدير..."
        open={isExporting}
        footer={exportError ? (
          <Space>
            <Button onClick={handleCancelExport}>
              إلغاء
            </Button>
            {retryCount < 3 && (
              <Button type="primary" onClick={handleRetryExport}>
                إعادة المحاولة ({retryCount}/3)
              </Button>
            )}
          </Space>
        ) : (
          <Button onClick={handleCancelExport}>
            إلغاء
          </Button>
        )}
        closable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Progress
            percent={exportProgress}
            status={exportError ? 'exception' : 'active'}
          />
          <p style={{ marginTop: '20px' }}>{exportMessage}</p>
          {exportError && (
            <div style={{ marginTop: '20px', color: 'red', textAlign: 'right' }}>
              <p><strong>خطأ:</strong> {exportError}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
});

export default PrintExportButtons;