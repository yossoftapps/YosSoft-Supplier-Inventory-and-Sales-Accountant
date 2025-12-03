// Print and Export Buttons Component
import React from 'react';
import { Button, Space, message, Dropdown } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

const PrintExportButtons = ({ data, title, columns, filename, allReportsData }) => {
  const { t } = useTranslation();

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

      // Prepare data for export
      const exportData = data.map(row => {
        const exportRow = {};
        columns.forEach(col => {
          if (col.title && col.dataIndex) {
            exportRow[col.title] = row[col.dataIndex];
          }
        });
        return exportRow;
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31)); // Excel sheet name max 31 chars

      // Export the file
      XLSX.writeFile(wb, `${filename || 'export'}.xlsx`);

      message.success('تم تصدير البيانات إلى Excel بنجاح');
    } catch (error) {
      console.error('Export error:', error);
      message.error('حدث خطأ أثناء التصدير');
    }
  };

  // Export all reports to a single Excel file with multiple sheets
  const handleExportAll = () => {
    try {
      if (!allReportsData || Object.keys(allReportsData).length === 0) {
        message.warning('لا توجد تقارير للتصدير');
        return;
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add each report as a separate sheet
      Object.keys(allReportsData).forEach(reportKey => {
        const report = allReportsData[reportKey];

        // Skip if no data
        if (!report.data || !Array.isArray(report.data) || report.data.length === 0) {
          return;
        }

        // Prepare data for export
        const exportData = report.data.map(row => {
          const exportRow = {};
          report.columns.forEach(col => {
            if (col.title && col.dataIndex) {
              exportRow[col.title] = row[col.dataIndex];
            }
          });
          return exportRow;
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Add worksheet to workbook with appropriate sheet name
        XLSX.utils.book_append_sheet(wb, ws, report.sheetName.substring(0, 31));
      });

      // Check if we have any sheets to export
      if (wb.SheetNames.length === 0) {
        message.warning('لا توجد بيانات كافية للتصدير');
        return;
      }

      // Export the file
      XLSX.writeFile(wb, 'جميع-التقارير.xlsx');

      message.success('تم تصدير جميع التقارير إلى ملف Excel واحد بنجاح');
    } catch (error) {
      console.error('Export all error:', error);
      message.error('حدث خطأ أثناء تصدير جميع التقارير');
    }
  };

  // Export menu items (AntD v5 "menu" prop)
  const menuItems = [
    { key: 'current', label: t('exportCurrentReport'), onClick: handleExportCurrent },
  ];
  if (allReportsData && Object.keys(allReportsData).length > 0) {
    menuItems.push({ key: 'all', label: t('exportAllReports'), onClick: handleExportAll });
  }

  return (
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
        >
          {t('exportToExcel')}
        </Button>
      </Dropdown>
    </Space>
  );
};

export default PrintExportButtons;