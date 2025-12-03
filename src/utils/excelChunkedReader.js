// Excel chunked reader for processing large Excel files efficiently
import XLSX from 'xlsx';
import { ChunkedProcessor, MemoryMonitor } from './chunkedProcessor.js';

/**
 * Excel chunked reader for processing large Excel files
 */
export class ExcelChunkedReader {
  /**
   * Read and process Excel file in chunks
   * @param {string} filePath - Path to Excel file
   * @param {object} options - Processing options
   * @param {number} options.chunkSize - Number of rows per chunk (default: 1000)
   * @param {function} options.processChunk - Function to process each chunk
   * @param {boolean} options.includeHeaders - Whether to include headers in each chunk (default: true)
   * @returns {Promise<object>} Processing results
   */
  static async readExcelInChunks(filePath, options = {}) {
    const {
      chunkSize = 1000,
      processChunk,
      includeHeaders = true
    } = options;

    // Validate file exists
    if (!filePath) {
      throw new Error('File path is required');
    }

    try {
      // Read workbook
      const workbook = XLSX.readFile(filePath);
      const results = {
        sheets: {},
        totalRecords: 0,
        processingTime: 0
      };

      const startTime = Date.now();

      // Process each sheet
      for (const sheetName of Object.keys(workbook.Sheets)) {
        console.log(`Processing sheet: ${sheetName}`);
        
        // Convert sheet to JSON with headers
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        
        if (sheetData.length === 0) {
          results.sheets[sheetName] = { records: 0, chunks: 0 };
          continue;
        }

        // Extract headers if needed
        let headers = [];
        let dataRows = sheetData;
        
        if (includeHeaders && sheetData.length > 0) {
          headers = sheetData[0];
          dataRows = sheetData.slice(1);
        }

        console.log(`Sheet ${sheetName} contains ${dataRows.length} data rows`);

        // Track memory usage
        MemoryMonitor.logMemoryUsage(`Before processing ${sheetName}`);

        // Process data in chunks
        let totalProcessed = 0;
        let chunksProcessed = 0;

        await ChunkedProcessor.processExcelDataInChunks(
          dataRows,
          chunkSize,
          async (chunk, index) => {
            // Convert chunk to objects with headers if available
            let processedChunk = chunk;
            if (headers.length > 0) {
              processedChunk = chunk.map(row => {
                const obj = {};
                headers.forEach((header, i) => {
                  obj[header] = row[i];
                });
                return obj;
              });
            }

            // Process the chunk
            if (processChunk && typeof processChunk === 'function') {
              await processChunk(processedChunk, {
                sheetName,
                chunkIndex: index,
                headers,
                totalChunks: Math.ceil(dataRows.length / chunkSize)
              });
            }

            totalProcessed += chunk.length;
            chunksProcessed++;

            // Log progress
            if (chunksProcessed % 5 === 0 || chunksProcessed === 1) {
              console.log(`  Processed chunk ${index + 1}/${Math.ceil(dataRows.length / chunkSize)} (${chunk.length} records)`);
            }
          }
        );

        results.sheets[sheetName] = {
          records: totalProcessed,
          chunks: chunksProcessed,
          headers: headers
        };
        results.totalRecords += totalProcessed;

        MemoryMonitor.logMemoryUsage(`After processing ${sheetName}`);
      }

      results.processingTime = Date.now() - startTime;
      
      console.log(`Excel file processing completed:`);
      console.log(`  Total records: ${results.totalRecords}`);
      console.log(`  Processing time: ${results.processingTime} ms`);
      
      return results;
    } catch (error) {
      throw new Error(`Error reading Excel file: ${error.message}`);
    }
  }

  /**
   * Read specific sheet from Excel file in chunks
   * @param {string} filePath - Path to Excel file
   * @param {string} sheetName - Name of sheet to read
   * @param {object} options - Processing options
   * @returns {Promise<object>} Sheet data
   */
  static async readSheetInChunks(filePath, sheetName, options = {}) {
    const {
      chunkSize = 1000,
      processChunk
    } = options;

    try {
      const workbook = XLSX.readFile(filePath);
      
      if (!workbook.Sheets[sheetName]) {
        throw new Error(`Sheet '${sheetName}' not found in Excel file`);
      }

      // Convert sheet to JSON
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      
      if (sheetData.length === 0) {
        return { data: [], headers: [], records: 0 };
      }

      // Extract headers and data
      const headers = sheetData[0];
      const dataRows = sheetData.slice(1);

      const result = {
        headers,
        data: [],
        records: dataRows.length
      };

      // Process in chunks
      await ChunkedProcessor.processExcelDataInChunks(
        dataRows,
        chunkSize,
        async (chunk, index) => {
          // Convert to objects
          const chunkObjects = chunk.map(row => {
            const obj = {};
            headers.forEach((header, i) => {
              obj[header] = row[i];
            });
            return obj;
          });

          // Store data
          result.data.push(...chunkObjects);

          // Process chunk if callback provided
          if (processChunk && typeof processChunk === 'function') {
            await processChunk(chunkObjects, index);
          }
        }
      );

      return result;
    } catch (error) {
      throw new Error(`Error reading sheet '${sheetName}': ${error.message}`);
    }
  }

  /**
   * Create progress-aware Excel processor
   * @param {string} filePath - Path to Excel file
   * @param {object} options - Processing options
   * @returns {Promise<function>} Function to process the file with progress tracking
   */
  static async createProgressAwareProcessor(filePath, options = {}) {
    const workbook = XLSX.readFile(filePath);
    let totalRecords = 0;

    // Count total records
    for (const sheetName of Object.keys(workbook.Sheets)) {
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      totalRecords += Math.max(0, sheetData.length - 1); // Exclude headers
    }

    const tracker = ChunkedProcessor.createProgressTracker(totalRecords);

    return async (processChunk) => {
      return await this.readExcelInChunks(filePath, {
        ...options,
        processChunk: async (chunk, chunkInfo) => {
          // Update progress
          tracker.update(chunk.length, `Sheet: ${chunkInfo.sheetName}, Chunk: ${chunkInfo.chunkIndex + 1}`);
          
          // Process chunk
          if (processChunk && typeof processChunk === 'function') {
            await processChunk(chunk, chunkInfo);
          }
        }
      });
    };
  }
}