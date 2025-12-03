// Chunked processor for handling large files efficiently
import fs from 'fs';
import readline from 'readline';

/**
 * Process large files in chunks to reduce memory usage
 */
export class ChunkedProcessor {
  /**
   * Process large file in chunks
   * @param {string} filePath - Path to the file to process
   * @param {number} chunkSize - Number of records per chunk (default: 1000)
   * @param {function} processChunk - Function to process each chunk
   * @returns {Promise<number>} Total number of records processed
   */
  static async processFileInChunks(filePath, chunkSize = 1000, processChunk) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const chunks = [];
    let currentChunk = [];
    let totalRecords = 0;

    try {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      // Process each line
      for await (const line of rl) {
        currentChunk.push(this.parseLine(line));
        totalRecords++;

        // When chunk is full, process it
        if (currentChunk.length >= chunkSize) {
          chunks.push([...currentChunk]); // Create a copy
          
          // Process the chunk if callback is provided
          if (processChunk && typeof processChunk === 'function') {
            await processChunk(currentChunk, chunks.length - 1);
          }
          
          // Reset chunk
          currentChunk = [];
        }
      }

      // Process remaining records in final chunk
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        
        // Process the final chunk if callback is provided
        if (processChunk && typeof processChunk === 'function') {
          await processChunk(currentChunk, chunks.length - 1);
        }
      }

      return totalRecords;
    } catch (error) {
      throw new Error(`Error processing file: ${error.message}`);
    }
  }

  /**
   * Parse a line from the file
   * @param {string} line - Line to parse
   * @returns {any} Parsed data
   */
  static parseLine(line) {
    // Default implementation - can be overridden
    try {
      return JSON.parse(line);
    } catch (e) {
      // If not JSON, return as-is
      return line;
    }
  }

  /**
   * Process Excel data in chunks
   * @param {Array} data - Array of data records
   * @param {number} chunkSize - Number of records per chunk
   * @param {function} processChunk - Function to process each chunk
   * @returns {Promise<number>} Total number of records processed
   */
  static async processExcelDataInChunks(data, chunkSize = 1000, processChunk) {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    let totalProcessed = 0;
    let chunkIndex = 0;

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      totalProcessed += chunk.length;
      
      // Process the chunk if callback is provided
      if (processChunk && typeof processChunk === 'function') {
        await processChunk(chunk, chunkIndex);
      }
      
      chunkIndex++;
    }

    return totalProcessed;
  }

  /**
   * Create a progress tracker for long-running operations
   * @param {number} totalRecords - Total number of records to process
   * @returns {object} Progress tracker object
   */
  static createProgressTracker(totalRecords) {
    let processedRecords = 0;
    const startTime = Date.now();

    return {
      /**
       * Update progress
       * @param {number} count - Number of records processed in this update
       * @param {string} message - Optional message
       */
      update(count, message = '') {
        processedRecords += count;
        const percent = Math.min(100, Math.round((processedRecords / totalRecords) * 100));
        const elapsed = Date.now() - startTime;
        const rate = processedRecords / (elapsed / 1000); // records per second
        
        console.log(`Progress: ${percent}% (${processedRecords}/${totalRecords}) - ${Math.round(rate)} records/sec ${message}`);
        
        return {
          percent,
          processedRecords,
          totalRecords,
          elapsed,
          rate
        };
      },

      /**
       * Get final statistics
       * @returns {object} Final statistics
       */
      getStats() {
        const elapsed = Date.now() - startTime;
        const rate = processedRecords / (elapsed / 1000); // records per second
        
        return {
          processedRecords,
          totalRecords,
          elapsed,
          rate,
          completed: processedRecords >= totalRecords
        };
      }
    };
  }
}

/**
 * Memory monitor for tracking memory usage during processing
 */
export class MemoryMonitor {
  /**
   * Get current memory usage
   * @returns {object} Memory usage information
   */
  static getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  }

  /**
   * Log memory usage
   * @param {string} label - Label for this memory snapshot
   */
  static logMemoryUsage(label) {
    const memory = this.getMemoryUsage();
    console.log(`Memory Usage [${label}]: RSS=${memory.rss}MB, Heap=${memory.heapUsed}/${memory.heapTotal}MB, External=${memory.external}MB`);
  }

  /**
   * Check if memory usage is within acceptable limits
   * @param {number} maxHeapMB - Maximum heap size in MB (default: 500)
   * @returns {boolean} True if within limits
   */
  static isWithinMemoryLimits(maxHeapMB = 500) {
    const memory = this.getMemoryUsage();
    return memory.heapUsed <= maxHeapMB;
  }
}