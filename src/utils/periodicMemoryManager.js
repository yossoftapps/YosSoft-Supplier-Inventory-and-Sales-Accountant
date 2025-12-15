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
    this.cleanupInterval = options.cleanupInterval || 60000; // Default: every minute
    this.memoryThreshold = options.memoryThreshold || 500; // Default: 500MB
    this.enableLogging = options.enableLogging !== false; // Default: true
    this.cleanupTimer = null;
    this.isActive = false;
    
    // Bind methods
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.performCleanup = this.performCleanup.bind(this);
    this.getMemoryUsage = this.getMemoryUsage.bind(this);
    this.isMemoryUsageHigh = this.isMemoryUsageHigh.bind(this);
  }

  /**
   * Get current memory usage
   * @returns {Object} Memory usage information
   */
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      // Node.js environment
      const usage = process.memoryUsage();
      return {
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024) // MB
      };
    } else if (typeof performance !== 'undefined' && performance.memory) {
      // Browser environment with performance.memory
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
      };
    } else {
      // Fallback
      return {
        used: 0,
        total: 0,
        limit: 0
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
    if (memory.heapUsed !== undefined) {
      // Node.js
      return memory.heapUsed > this.memoryThreshold;
    } else if (memory.used !== undefined) {
      // Browser
      return memory.used > this.memoryThreshold;
    }
    
    return false;
  }

  /**
   * Log memory usage
   * @param {string} label - Label for this memory snapshot
   */
  logMemoryUsage(label) {
    if (!this.enableLogging) return;
    
    const memory = this.getMemoryUsage();
    
    if (memory.heapUsed !== undefined) {
      // Node.js format
      console.log(`Memory Usage [${label}]: RSS=${memory.rss}MB, Heap=${memory.heapUsed}/${memory.heapTotal}MB, External=${memory.external}MB`);
    } else if (memory.used !== undefined) {
      // Browser format
      console.log(`Memory Usage [${label}]: Used=${memory.used}MB, Total=${memory.total}MB, Limit=${memory.limit}MB`);
    }
  }

  /**
   * Perform cleanup operations
   * This method should be overridden by subclasses or customized
   */
  performCleanup() {
    this.logMemoryUsage('Before Cleanup');
    
    // Request garbage collection if available (Node.js)
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
      this.logMemoryUsage('After GC');
    } 
    // Request garbage collection if available (Browser)
    else if (typeof window !== 'undefined' && window.gc) {
      window.gc();
      this.logMemoryUsage('After GC');
    }
    
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
        // Check memory usage
        if (this.isMemoryUsageHigh()) {
          this.logMemoryUsage('High Memory Detected');
        }
        
        // Perform cleanup
        this.performCleanup();
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
}

/**
 * Export a singleton instance for easy use
 */
export const memoryManager = new PeriodicMemoryManager();

/**
 * Hook for React components to register cleanup callbacks
 * @param {Function} cleanupCallback - Function to call during cleanup
 * @returns {Function} Unsubscribe function
 */
export const useMemoryCleanup = (cleanupCallback) => {
  // In a real implementation, this would register the callback
  // For now, we'll just return a noop unsubscribe function
  return () => {};
};

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