// Periodic Memory Manager
// Utility for managing memory with periodic cleanup and monitoring

/**
 * Periodic Memory Manager Class
 * Provides automated memory monitoring and cleanup capabilities
 */
export class PeriodicMemoryManager {
  /**
   * Constructor
   * @param {Object} options - Configuration options
   * @param {number} options.cleanupInterval - Interval for periodic cleanup in milliseconds (default: 60000)
   * @param {number} options.memoryThreshold - Memory usage threshold in MB (default: 500)
   * @param {boolean} options.enableLogging - Enable memory usage logging (default: true)
   */
  constructor(options = {}) {
    this.cleanupInterval = Math.max(options.cleanupInterval || 60000, 1000); // Default: every minute, minimum 1 second
    this.memoryThreshold = options.memoryThreshold || 500; // Default: 500MB
    this.enableLogging = options.enableLogging !== false; // Default: true
    this.cleanupTimer = null;
    this.isActive = false;
    this.isPaused = false; // Track if memory management is paused
    this.pauseReasons = new Set(); // Track reasons for pausing
    this.cleanupCallbacks = []; // For registered cleanup functions

    // Bind methods
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.performCleanup = this.performCleanup.bind(this);
    this.getMemoryUsage = this.getMemoryUsage.bind(this);
    this.isMemoryUsageHigh = this.isMemoryUsageHigh.bind(this);
    this.registerCleanup = this.registerCleanup.bind(this);
  }

  /**
   * Register a cleanup callback
   * @param {Function} callback - Function to call during cleanup
   * @returns {Function} Unsubscribe function
   */
  registerCleanup(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Cleanup callback must be a function');
    }
    
    this.cleanupCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.cleanupCallbacks.indexOf(callback);
      if (index !== -1) {
        this.cleanupCallbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Register XLSX/inventory specific cleanup
   */
  registerInventoryCleanup() {
    const cleanupCallback = () => {
      try {
        // Clear any potential inventory caches
        if (typeof window !== 'undefined' && window.excelCache) {
          window.excelCache.clear && window.excelCache.clear();
        }
        
        // Clear any workbook references if they exist
        if (typeof window !== 'undefined' && window.workbookRefs) {
          for (const ref of window.workbookRefs) {
            if (ref && ref.destroy) {
              ref.destroy();
            }
          }
          window.workbookRefs = [];
        }
      } catch (error) {
        console.warn('Error during inventory cleanup:', error.message);
      }
    };
    
    return this.registerCleanup(cleanupCallback);
  }

  /**
   * Get current memory usage
   * @returns {Object} Memory usage information
   */
  getMemoryUsage() {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        // Node.js environment
        const usage = process.memoryUsage();
        return {
          rss: Math.round(usage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
          external: Math.round(usage.external / 1024 / 1024), // MB
          type: 'nodejs'
        };
      } else if (typeof performance !== 'undefined' && performance.memory) {
        // Browser environment with performance.memory (Chrome-based browsers)
        // Check if all required properties exist
        if (typeof performance.memory.usedJSHeapSize !== 'undefined' &&
            typeof performance.memory.totalJSHeapSize !== 'undefined' &&
            typeof performance.memory.jsHeapSizeLimit !== 'undefined') {
          // Additional check to ensure values are valid numbers
          const used = performance.memory.usedJSHeapSize;
          const total = performance.memory.totalJSHeapSize;
          const limit = performance.memory.jsHeapSizeLimit;
          
          // Validate that values are reasonable (not negative or NaN)
          if (used >= 0 && total >= 0 && limit >= 0 && !isNaN(used) && !isNaN(total) && !isNaN(limit)) {
            return {
              used: Math.round(used / 1024 / 1024), // MB
              total: Math.round(total / 1024 / 1024), // MB
              limit: Math.round(limit / 1024 / 1024), // MB
              type: 'browser'
            };
          } else {
            // Values are not valid, return fallback
            return {
              used: 0,
              total: 0,
              limit: 0,
              type: 'browser-invalid-values'
            };
          }
        } else {
          // performance.memory exists but required properties are not available
          return {
            used: 0,
            total: 0,
            limit: 0,
            type: 'browser-no-memory-api'
          };
        }
      } else {
        // Fallback for environments where memory info is not available
        return {
          used: 0,
          total: 0,
          limit: 0,
          type: 'no-memory-info'
        };
      }
    } catch (error) {
      // Safety fallback in case of any error accessing memory info
      console.warn('Error getting memory usage:', error.message);
      return {
        used: 0,
        total: 0,
        limit: 0,
        type: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check if memory usage is high
   * @returns {boolean} True if memory usage exceeds threshold
   */
  isMemoryUsageHigh() {
    const memory = this.getMemoryUsage();
    
    // Different checks based on environment
    if (memory.type === 'nodejs') {
      return memory.heapUsed > this.memoryThreshold;
    } else if (memory.type === 'browser') {
      return memory.used > this.memoryThreshold;
    }
    
    // If we can't determine memory usage, return false to avoid false alarms
    return false;
  }

  /**
   * Log memory usage
   * @param {string} label - Label for this memory snapshot
   */
  logMemoryUsage(label) {
    if (!this.enableLogging) return;
    
    try {
      const memory = this.getMemoryUsage();
      
      if (memory.type === 'nodejs') {
        // Node.js format
        console.log(`Memory Usage [${label}]: RSS=${memory.rss}MB, Heap=${memory.heapUsed}/${memory.heapTotal}MB, External=${memory.external}MB`);
      } else if (memory.type === 'browser') {
        // Browser format
        console.log(`Memory Usage [${label}]: Used=${memory.used}MB, Total=${memory.total}MB, Limit=${memory.limit}MB`);
      } else if (memory.type === 'browser-no-memory-api') {
        // Browser but memory API not available
        console.log(`Memory Usage [${label}]: Memory API not available in this browser`);
      } else if (memory.type === 'browser-invalid-values') {
        // Browser but memory values are invalid
        console.log(`Memory Usage [${label}]: Memory API returned invalid values in this browser`);
      } else if (memory.type === 'no-memory-info') {
        // No memory info available (e.g., in some Electron environments)
        console.log(`Memory Usage [${label}]: Memory info not available in this environment`);
      } else if (memory.type === 'error') {
        // Error occurred while getting memory info
        console.log(`Memory Usage [${label}]: Error getting memory info - ${memory.error}`);
      }
    } catch (error) {
      // If logging fails, just silently continue to avoid breaking the application
      console.warn('Error logging memory usage:', error.message);
    }
  }

  /**
   * Perform cleanup operations
   */
  performCleanup() {
    // Don't perform cleanup if paused
    if (this.isPaused) {
      return;
    }
    
    try {
      this.logMemoryUsage('Before Cleanup');
      
      // Execute registered cleanup callbacks
      for (const callback of this.cleanupCallbacks) {
        try {
          callback();
        } catch (error) {
          console.error('Error in registered cleanup callback:', error);
        }
      }
      
      // Enhanced garbage collection with WeakRef pattern
      this.requestGarbageCollection();
      
      // Dispatch custom event for application-specific cleanup
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('memoryCleanup', {
          detail: {
            memory: this.getMemoryUsage(),
            timestamp: Date.now()
          }
        }));
      }
      
      this.logMemoryUsage('After Cleanup');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
  
  /**
   * Request garbage collection with fallbacks
   */
  requestGarbageCollection() {
    // Request garbage collection if available (Node.js)
    if (typeof global !== 'undefined' && typeof global.gc === 'function') {
      try {
        global.gc();
        this.logMemoryUsage('After GC');
      } catch (gcError) {
        console.warn('Node.js GC failed:', gcError.message);
      }
    } 
    // Request garbage collection if available (Browser)
    else if (typeof window !== 'undefined' && typeof window.gc === 'function') {
      try {
        window.gc();
        this.logMemoryUsage('After GC');
      } catch (gcError) {
        console.warn('Browser GC failed:', gcError.message);
      }
    }
    
    // Additional cleanup for WeakRef if available
    if (typeof WeakRef !== 'undefined' && typeof FinalizationRegistry !== 'undefined') {
      // Create a registry for cleanup
      const cleanupRegistry = new FinalizationRegistry((cleanupFn) => {
        try {
          cleanupFn();
        } catch (registryError) {
          console.warn('Registry cleanup failed:', registryError.message);
        }
      });
      
      // Register any pending cleanup
      // This is a placeholder for actual registry usage
      // In a real implementation, objects would be registered with their cleanup functions
    }
  }

  /**
   * Start periodic cleanup
   */
  start() {
    if (this.isActive) {
      console.warn('PeriodicMemoryManager is already active');
      return;
    }
    
    this.isActive = true;
    this.logMemoryUsage('Manager Started');
    
    // Perform initial cleanup
    this.performCleanup();
    
    // Set up periodic cleanup
    this.cleanupTimer = setInterval(() => {
      try {
        // Check memory usage and perform cleanup only if high
        if (this.isMemoryUsageHigh()) {
          this.logMemoryUsage('High Memory Detected');
          // Perform cleanup only when memory usage is high
          this.performCleanup();
        }
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, this.cleanupInterval);
  }

  /**
   * Stop periodic cleanup
   */
  stop() {
    if (!this.isActive) {
      console.warn('PeriodicMemoryManager is not active');
      return;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.isActive = false;
    this.logMemoryUsage('Manager Stopped');
  }

  /**
   * Force immediate cleanup
   */
  forceCleanup() {
    this.performCleanup();
  }
  
  /**
   * Pause memory management during intensive operations
   */
  pause(reason = 'unknown') {
    this.pauseReasons.add(reason);
    this.isPaused = true;
    if (this.enableLogging) {
      console.log(`Memory management paused: ${reason}`);
    }
  }

  /**
   * Resume memory management after intensive operations
   */
  resume(reason = 'unknown') {
    this.pauseReasons.delete(reason);
    this.isPaused = this.pauseReasons.size > 0; // Only resume if no other reasons to pause
    if (this.enableLogging && !this.isPaused) {
      console.log(`Memory management resumed. Active pause reasons: ${Array.from(this.pauseReasons).join(', ') || 'none'}`);
    }
  }
}

// Create a default instance for backward compatibility
export const memoryManager = new PeriodicMemoryManager();

// Export the context components
export { MemoryManagerProvider, useMemoryManager, useMemoryCleanup } from '../contexts/MemoryManagerContext';



/**
 * Memory monitoring utility for long-running operations
 */
export class MemoryMonitor {
  /**
   * Monitor memory usage during an operation
   * @param {string} operationName - Name of the operation
   * @param {Function} operation - Async operation to monitor
   * @returns {Promise} Result of the operation
   */
  static async monitorOperation(operationName, operation) {
    const manager = new PeriodicMemoryManager({
      enableLogging: true
    });
    
    manager.logMemoryUsage(`${operationName} - Start`);
    
    try {
      const result = await operation();
      manager.logMemoryUsage(`${operationName} - End`);
      return result;
    } catch (error) {
      manager.logMemoryUsage(`${operationName} - Error`);
      throw error;
    }
  }
}

export default PeriodicMemoryManager;