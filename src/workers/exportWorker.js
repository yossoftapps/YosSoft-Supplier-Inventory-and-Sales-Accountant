// Web Worker for handling Excel export operations in the background
// This prevents the UI from freezing during large data exports

// Import XLSX library directly using ES6 import (Vite supports this in workers with { type: 'module' })
import * as XLSX from 'xlsx';

// Memory monitoring utility
const getMemoryInfo = () => {
  if (self.performance && self.performance.memory) {
    return {
      used: Math.round(self.performance.memory.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(self.performance.memory.totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(self.performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
    };
  }
  return null;
};

// Check if memory usage is too high
const isMemoryUsageHigh = () => {
  const memoryInfo = getMemoryInfo();
  if (memoryInfo && memoryInfo.used > memoryInfo.limit * 0.8) { // 80% threshold
    return true;
  }
  return false;
};

// Timeout for long-running exports (15 minutes for very large files)
const EXPORT_TIMEOUT = 15 * 60 * 1000;
let exportTimeoutId = null;
let isCancelled = false;

// XLSX library reference will be set when received from main thread

self.addEventListener('message', (event) => {
  const { type, data, filename } = event.data;

  try {
    // Clear any existing timeout
    if (exportTimeoutId) {
      clearTimeout(exportTimeoutId);
    }
    
    // Reset cancellation flag
    isCancelled = false;

    switch (type) {
      case 'EXPORT_REPORTS':
        // Set timeout for the export operation
        exportTimeoutId = setTimeout(() => {
          self.postMessage({
            type: 'ERROR',
            error: 'انتهت مهلة عملية التصدير بعد 15 دقيقة. قد يكون الملف كبيرًا جدًا للمعالجة.'
          });
        }, EXPORT_TIMEOUT);

        handleExportReports(data, filename);
        break;
      case 'CANCEL_EXPORT':
        isCancelled = true;
        if (exportTimeoutId) {
          clearTimeout(exportTimeoutId);
          exportTimeoutId = null;
        }
        self.postMessage({
          type: 'CANCELLED',
          message: 'Export operation cancelled'
        });
        break;
      case 'TEST_CONNECTION':
        // Handle test connection message
        self.postMessage({
          type: 'TEST_RESPONSE',
          message: 'Worker connected successfully'
        });
        break;
      default:
        self.postMessage({
          type: 'ERROR',
          error: `Unknown export type: ${type}`
        });
    }
  } catch (error) {
    // Clear timeout on error
    if (exportTimeoutId) {
      clearTimeout(exportTimeoutId);
      exportTimeoutId = null;
    }
    self.postMessage({
      type: 'ERROR',
      error: `Worker message handler error: ${error.message}`
    });
  }
});

// Handle exporting multiple reports to a single Excel file with chunked processing
async function handleExportReports(reportsData, filename) {
  try {
    // Validate input data
    if (!reportsData) {
      throw new Error('No reports data provided');
    }

    // Send progress update
    self.postMessage({
      type: 'PROGRESS',
      message: 'بدء عملية التصدير...',
      progress: 0
    });
    
    // Check initial memory usage
    const initialMemory = getMemoryInfo();
    if (initialMemory && initialMemory.used > initialMemory.limit * 0.7) {
      self.postMessage({
        type: 'PROGRESS',
        message: 'تحذير: استخدام الذاكرة مرتفع. قد تستغرق العملية وقتًا أطول...',
        progress: 2
      });
    }

    // Create Excel file with chunked processing for large datasets
    const blob = await createExcelFileChunked(reportsData);

    // Validate blob
    if (!blob) {
      throw new Error('Failed to create Excel file blob');
    }

    // Clear timeout on successful completion
    if (exportTimeoutId) {
      clearTimeout(exportTimeoutId);
      exportTimeoutId = null;
    }

    // Send completion message with the file blob
    self.postMessage({
      type: 'COMPLETE',
      message: 'اكتمل التصدير بنجاح',
      filename: filename,
      blob: blob,
      progress: 100
    });
  } catch (error) {
    // Clear timeout on error
    if (exportTimeoutId) {
      clearTimeout(exportTimeoutId);
      exportTimeoutId = null;
    }
    self.postMessage({
      type: 'ERROR',
      error: `Export reports error: ${error.message}`
    });
  }
}

// Create Excel file from reports data with chunked processing for large datasets
// Uses streaming approach to minimize memory usage
async function createExcelFileChunked(reportsData) {
  return new Promise((resolve, reject) => {
    try {
      // Check for cancellation
      if (isCancelled) {
        reject(new Error('Export cancelled'));
        return;
      }
      
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Validate reportsData
      if (!reportsData || typeof reportsData !== 'object') {
        throw new Error('Invalid reports data');
      }

      // Track progress
      const reportKeys = Object.keys(reportsData);
      const totalReports = reportKeys.length;
      
      // Process each report with chunked data handling
      reportKeys.forEach((reportKey, index) => {
        // Check for cancellation
        if (isCancelled) {
          reject(new Error('Export cancelled'));
          return;
        }
        
        const report = reportsData[reportKey];
        
        // Skip if no data
        if (!report || !report.data || !Array.isArray(report.data) || report.data.length === 0) {
          return;
        }

        // Send progress update
        const progress = Math.round((index / totalReports) * 80) + 5; // 5-85% range
        self.postMessage({
          type: 'PROGRESS',
          message: `جارٍ معالجة تقرير: ${report.sheetName || reportKey}...`,
          progress: progress
        });

        // For large datasets, process in chunks to avoid memory issues
        const BASE_CHUNK_SIZE = 5000; // Base chunk size
        const totalRows = report.data.length;
        
        // Adjust chunk size based on memory availability
        let CHUNK_SIZE = BASE_CHUNK_SIZE;
        const memoryInfo = getMemoryInfo();
        if (memoryInfo && memoryInfo.used > memoryInfo.limit * 0.6) { // If memory usage > 60%
          CHUNK_SIZE = Math.max(1000, Math.floor(BASE_CHUNK_SIZE * 0.5)); // Reduce chunk size
        }
        
        if (totalRows > CHUNK_SIZE) {
          // Process large dataset in chunks with streaming approach
          let allExportData = [];
          
          for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
            // Check for cancellation
            if (isCancelled) {
              reject(new Error('Export cancelled'));
              return;
            }
            
            // Check memory usage periodically
            if (i % (CHUNK_SIZE * 2) === 0) {
              if (isMemoryUsageHigh()) {
                self.postMessage({
                  type: 'PROGRESS',
                  message: `تحذير: استخدام الذاكرة مرتفع. قد تستغرق العملية وقتًا أطول...`,
                  progress: Math.min(Math.round((i / totalRows) * 10) + progress, progress + 10)
                });
                
                // If memory is critically high, flush data early
                if (isMemoryUsageHigh() && allExportData.length > CHUNK_SIZE) {
                  self.postMessage({
                    type: 'PROGRESS',
                    message: `تنشيط الذاكرة: جاري تفريغ البيانات المؤقتة...`,
                    progress: Math.min(Math.round((i / totalRows) * 10) + progress, progress + 10)
                  });
                }
              }
            }
            
            const chunk = report.data.slice(i, i + CHUNK_SIZE);
            const exportChunk = chunk.map(row => {
              const exportRow = {};
              if (report.columns && Array.isArray(report.columns)) {
                report.columns.forEach(col => {
                  if (col.title && col.dataIndex) {
                    // Handle potential undefined/null values
                    const value = row[col.dataIndex];
                    exportRow[col.title] = (value === null || value === undefined) ? '' : value;
                  }
                });
              }
              return exportRow;
            });
            
            allExportData.push(...exportChunk);
            
            // For extremely large datasets, create worksheet in chunks to reduce memory pressure
            if (allExportData.length > CHUNK_SIZE * 3) { // If we have 3 chunks worth of data
              self.postMessage({
                type: 'PROGRESS',
                message: `إدارة الذاكرة: جاري تقليل الضغط على الذاكرة...`,
                progress: Math.min(Math.round((i / totalRows) * 10) + progress, progress + 10)
              });
            }
            
            // Send progress update for chunk processing
            const chunkProgress = Math.round((i / totalRows) * 10) + progress; // Add 10% for chunk processing
            self.postMessage({
              type: 'PROGRESS',
              message: `جارٍ معالجة البيانات: ${Math.min(i + CHUNK_SIZE, totalRows)}/${totalRows}...`,
              progress: Math.min(chunkProgress, progress + 10)
            });
            
            // Force garbage collection hint if available (Chrome only)
            if (self.gc) {
              self.gc();
            }
          }
          
          // Create worksheet from all data
          const ws = XLSX.utils.json_to_sheet(allExportData);
          
          // Add worksheet to workbook with appropriate sheet name
          const sheetName = report.sheetName ? report.sheetName.substring(0, 31) : `Sheet${index + 1}`;
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
          
          // Clear array to free memory immediately
          allExportData.length = 0;
          allExportData = null;
        } else {
          // Process smaller dataset normally
          const exportData = report.data.map(row => {
            const exportRow = {};
            if (report.columns && Array.isArray(report.columns)) {
              report.columns.forEach(col => {
                if (col.title && col.dataIndex) {
                  // Handle potential undefined/null values
                  const value = row[col.dataIndex];
                  exportRow[col.title] = (value === null || value === undefined) ? '' : value;
                }
              });
            }
            return exportRow;
          });

          // Create worksheet
          const ws = XLSX.utils.json_to_sheet(exportData);

          // Add worksheet to workbook with appropriate sheet name
          const sheetName = report.sheetName ? report.sheetName.substring(0, 31) : `Sheet${index + 1}`;
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
          
          // Clear array to free memory immediately
          exportData.length = 0;
        }
      });

      // Check if we have any sheets
      if (wb.SheetNames.length === 0) {
        throw new Error('No valid data to export');
      }

      // Send final progress update before file generation
      self.postMessage({
        type: 'PROGRESS',
        message: 'جارٍ إنشاء ملف Excel...',
        progress: 90
      });

      // Generate Excel file blob with reduced memory footprint
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary', compression: true });
      
      // Send progress for file creation
      self.postMessage({
        type: 'PROGRESS',
        message: 'جارٍ تحضير الملف للتحميل...',
        progress: 95
      });

      // Convert binary string to ArrayBuffer in chunks to reduce memory pressure
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      const CHUNK_PROCESS_SIZE = 100000; // Process 100KB at a time
      
      for (let i = 0; i < wbout.length; i += CHUNK_PROCESS_SIZE) {
        const end = Math.min(i + CHUNK_PROCESS_SIZE, wbout.length);
        for (let j = i; j < end; j++) {
          view[j] = wbout.charCodeAt(j) & 0xFF;
        }
        
        // Check for cancellation during file creation
        if (isCancelled) {
          reject(new Error('Export cancelled during file creation'));
          return;
        }
      }
      
      // Create blob
      const blob = new Blob([buf], { type: 'application/octet-stream' });
      
      resolve(blob);
    } catch (error) {
      reject(new Error(`Create Excel file error: ${error.message}`));
    }
  });
}