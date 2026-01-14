// Print and Export Buttons Component
import React, { useState, useRef, memo, useEffect } from 'react';
import { Button, Space, message, Dropdown, Modal, Checkbox, List, Progress } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { serializeData } from '../utils/financialCalculations';
import safeString from '../utils/safeString.js'; // دالة لمطابقة أسماء الملفات بشكل آمن

const PrintExportButtons = memo(({ data, title, columns, filename, allReportsData, availableReports, columnVisibility: propsColumnVisibility, enableGlobalExport = true }) => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  // Use availableReports for UI if provided, otherwise fallback to allReportsData
  const reportsMetadata = availableReports || (typeof allReportsData === 'object' ? allReportsData : {});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const workerRef = useRef(null);
  const messageApiRef = useRef(null);

  // Update ref when messageApi changes
  useEffect(() => {
    messageApiRef.current = messageApi;
  }, [messageApi]);

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
        messageApiRef.current.warning('لا توجد بيانات للتصدير');
        return;
      }

      // Compute effective columns based on columnVisibility (if provided)
      const effectiveColumns = (typeof columns !== 'undefined' && Array.isArray(columns) ? columns : []).filter(col => {
        const key = col.dataIndex || col.key;
        if (!key) return true; // include if no key
        if (!propsColumnVisibility) return true; // no visibility restrictions provided
        return propsColumnVisibility[key] !== false;
      });

      // If no effective columns (e.g., all hidden), fallback to original columns
      const finalColumns = effectiveColumns.length > 0 ? effectiveColumns : (Array.isArray(columns) ? columns : []);

      // Prepare data structure similar to allReportsData for consistency
      const dateStr = new Date().toISOString().slice(0,10); // YYYY-MM-DD
      const currentReportData = {
        current: {
          data: data,
          columns: finalColumns,
          sheetName: title.substring(0, 31),
          reportDate: dateStr
        }
      };

      // بناء اسم ملف آمن يتضمن التاريخ
      const baseName = filename || title || 'تقرير';
      const safeBase = safeString(baseName).replace(/\s+/g, '-');
      const outFileName = `${safeBase}_${dateStr}.xlsx`;

      // Use background export for consistency and better performance
      exportBackground(currentReportData, outFileName);
    } catch (error) {
      console.error('Export error:', error);
      messageApiRef.current.error('حدث خطأ أثناء التصدير');
    }
  };

  // Export all reports to a single Excel file with multiple sheets
  const handleExportAll = () => {
    // Always use background export for consistency
    exportAllBackground();
  };

  // Check if we should use direct export or background export
  const shouldUseDirectExport = () => {
    // If we have a function for data, we can't easily estimate without calling it
    if (typeof allReportsData === 'function') return false;
    if (!reportsMetadata) return true;

    // Estimate total records
    let totalRecords = 0;
    Object.keys(reportsMetadata).forEach(reportKey => {
      const report = reportsMetadata[reportKey];
      totalRecords += (report.data ? report.data.length : (report.dataLength || 0));
    });

    // Use direct export for smaller datasets (< 10000 records)
    return totalRecords < 10000;
  };

  // REMOVED: Direct export functions since we're now using Web Workers consistently

  // Background export for larger datasets
  const exportAllBackground = (isRetry = false) => {
    try {
      // Lazy load data if provided as a function
      let reportsData = typeof allReportsData === 'function' ? allReportsData() : allReportsData;

      // If reportsData has a getAllResolved method (like our lazy reports object), use it
      if (reportsData && typeof reportsData.getAllResolved === 'function') {
        reportsData = reportsData.getAllResolved();
      }

      if (!reportsData || Object.keys(reportsData).length === 0) {
        messageApiRef.current.warning('لا توجد تقارير للتصدير');
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
        const { type, message: workerMessage, progress, blob, filename, error: workerError } = event.data;

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
              const defaultFilename = `جميع-التقارير_${new Date().toISOString().slice(0,10)}.xlsx`;
              a.download = filename || defaultFilename;
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

              messageApiRef.current.success('تم تصدير جميع التقارير إلى ملف Excel واحد بنجاح');
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
            const workerErrorMessage = workerMessage || workerError || event.data.error || 'Unknown error occurred';
            const errorMsg = `حدث خطأ أثناء التصدير: ${workerErrorMessage}`;
            console.error('Worker error:', workerErrorMessage);
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
            messageApiRef.current.info('تم إلغاء عملية التصدير');
            break;
        }
      };

      // Start export process
      setIsExporting(true);
      setExportProgress(0);
      setExportMessage(isRetry ? 'إعادة المحاولة...' : 'بدء عملية التصدير...');
      setExportError('');

      // Serialize data to convert Decimal objects to plain numbers
      const serializedData = serializeData(reportsData);

      // Send data to worker (no need to send XLSX library anymore)
      console.log('📊 Starting export with data size:', JSON.stringify(serializedData).length, 'characters');
      const dateStrAll = new Date().toISOString().slice(0,10);
      const outFileAll = `جميع-التقارير_${dateStrAll}.xlsx`;
      workerRef.current.postMessage({
        type: 'EXPORT_REPORTS',
        data: serializedData,
        filename: outFileAll
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
        messageApiRef.current.error('فشل في إنشاء عملية التصدير في الخلفية. الرجاء التأكد من دعم المتصفح لهذه الميزة.');
        setIsExporting(false);
        return;
      }

      // Listen for messages from the worker
      workerRef.current.onmessage = (event) => {
        const { type, message: workerMessage, progress, blob, filename, error: workerError } = event.data;

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

              messageApiRef.current.success('تم تصدير البيانات إلى Excel بنجاح');
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
            const workerErrorMessage = workerMessage || workerError || event.data.error || 'Unknown error occurred';
            const errorMsg = `حدث خطأ أثناء التصدير: ${workerErrorMessage}`;
            console.error('Worker error:', workerErrorMessage);
            setExportError(errorMsg);
            setIsExporting(false);
            setExportProgress(0);
            setExportMessage('');
            if (workerRef.current) {
              workerRef.current.terminate();
              workerRef.current = null;
            }
            messageApiRef.current.error(errorMsg);
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
            messageApiRef.current.info('تم إلغاء عملية التصدير');
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
      console.log('📊 Starting export with data size:', JSON.stringify(serializedData).length, 'characters');
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
    const reportKeys = reportsMetadata ? Object.keys(reportsMetadata) : [];
    setSelectedReports(reportKeys);
    setIsModalVisible(true);
  };

  // Handle selective export
  const handleSelectiveExport = () => {
    try {
      if (!allReportsData || Object.keys(allReportsData).length === 0) {
        messageApiRef.current.warning('لا توجد تقارير للتصدير');
        setIsModalVisible(false);
        return;
      }

      if (selectedReports.length === 0) {
        messageApiRef.current.warning('يرجى اختيار تقرير واحد على الأقل للتصدير');
        return;
      }

      // Always use background export for consistency
      exportSelectedBackground();
    } catch (error) {
      console.error('Selective export error:', error);
      messageApiRef.current.error('حدث خطأ أثناء تصدير التقارير المحددة');
    }
  };

  // Check if we should use direct export or background export for selected reports
  const shouldUseDirectSelectiveExport = () => {
    if (typeof allReportsData === 'function') return false;
    if (!reportsMetadata || selectedReports.length === 0) return true;

    // Estimate total records for selected reports
    let totalRecords = 0;
    selectedReports.forEach(reportKey => {
      const report = reportsMetadata[reportKey];
      totalRecords += (report.data ? report.data.length : (report.dataLength || 0));
    });

    // Use direct export for smaller datasets (< 5000 records)
    return totalRecords < 5000;
  };

  // REMOVED: Direct export functions since we're now using Web Workers consistently

  // Background export for selected reports (larger datasets)
  const exportSelectedBackground = () => {
    try {
      // Lazy load data if provided as a function
      let reportsData = typeof allReportsData === 'function' ? allReportsData() : allReportsData;

      // If reportsData has a getAllResolved method (like our lazy reports object), use it
      if (reportsData && typeof reportsData.getAllResolved === 'function') {
        reportsData = reportsData.getAllResolved();
      }

      // Prepare data for selected reports only
      const selectedReportsData = {};
      selectedReports.forEach(reportKey => {
        selectedReportsData[reportKey] = reportsData[reportKey];
      });

      // Serialize data to convert Decimal objects to plain numbers
      const serializedData = serializeData(selectedReportsData);

      // Create Web Worker with module type to support ES6 imports
      try {
        workerRef.current = new Worker(new URL('../workers/exportWorker.js', import.meta.url), { type: 'module' });
      } catch (error) {
        console.error('Failed to create Web Worker:', error);
        messageApiRef.current.error('فشل في إنشاء عملية التصدير في الخلفية. الرجاء التأكد من دعم المتصفح لهذه الميزة.');
        setIsExporting(false);
        setIsModalVisible(false);
        return;
      }

      // Listen for messages from the worker
      workerRef.current.onmessage = (event) => {
        const { type, message: workerMessage, progress, blob, filename, error: workerError } = event.data;

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

              messageApiRef.current.success('تم تصدير التقارير المحددة إلى ملف Excel واحد بنجاح');
            } catch (error) {
              console.error('Error during download:', error);
              messageApiRef.current.error('حدث خطأ أثناء تنزيل الملف. الرجاء المحاولة مرة أخرى.');
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
            const workerErrorMessage = workerMessage || workerError || event.data.error || 'Unknown error occurred';
            setIsExporting(false);
            setExportProgress(0);
            setExportMessage('');
            setIsModalVisible(false);
            workerRef.current.terminate();
            workerRef.current = null;
            messageApiRef.current.error(`حدث خطأ أثناء التصدير: ${workerErrorMessage}`);
            break;
        }
      };

      // Start export process
      setIsExporting(true);
      setExportProgress(0);
      setExportMessage('بدء عملية التصدير...');
      setExportError(''); // Clear any previous errors

      // Send data to worker (no need to send XLSX library anymore)
      console.log('📊 Starting export with data size:', JSON.stringify(serializedData).length, 'characters');
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
      messageApiRef.current.error(`حدث خطأ أثناء بدء التصدير في الخلفية: ${error.message}`);
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
      setSelectedReports(reportsMetadata ? Object.keys(reportsMetadata) : []);
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
    messageApiRef.current.info('تم إلغاء عملية التصدير');
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

  if (enableGlobalExport && reportsMetadata && Object.keys(reportsMetadata).length > 0) {
    menuItems.push({ key: 'all', label: t('exportAllReports'), onClick: handleExportAll });
    menuItems.push({ key: 'selective', label: t('selectiveExport'), onClick: showSelectiveExportModal });
  }

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        icon={<PrinterOutlined />}
        onClick={handlePrint}
        className="unified-primary-button"
      >
        {t('print')}
      </Button>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button
          type="default"
          icon={<DownloadOutlined />}
          loading={isExporting}
          className="unified-secondary-button"
        >
          {t('exportToExcel')}
        </Button>
      </Dropdown>

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
        {reportsMetadata && Object.keys(reportsMetadata).length > 0 ? (
          <div>
            <Checkbox
              onChange={(e) => handleSelectAll(e.target.checked)}
              checked={selectedReports.length === Object.keys(reportsMetadata).length}
              indeterminate={selectedReports.length > 0 && selectedReports.length < Object.keys(reportsMetadata).length}
              style={{ marginBottom: 16 }}
            >
              تحديد الكل / إلغاء تحديد الكل
            </Checkbox>
            <List
              dataSource={Object.entries(reportsMetadata)}
              renderItem={([reportKey, report]) => (
                <List.Item>
                  <Checkbox
                    onChange={() => handleReportSelection(reportKey)}
                    checked={selectedReports.includes(reportKey)}
                  >
                    {report.sheetName} ({report.data ? report.data.length : (report.dataLength || 0)} سجل)
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