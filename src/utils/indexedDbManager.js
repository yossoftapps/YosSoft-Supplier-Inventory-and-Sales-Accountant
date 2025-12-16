// IndexedDB Manager for Persistent Caching
// Provides a robust caching solution using IndexedDB for large datasets

import { serializeData } from './financialCalculations';

/**
 * IndexedDB Manager Class
 * Provides persistent caching capabilities using IndexedDB
 */
export class IndexedDbManager {
  /**
   * Constructor
   * @param {string} dbName - Database name
   * @param {number} version - Database version
   * @param {Array} stores - Array of store configurations
   */
  constructor(dbName = 'YosSoftCache', version = 1, stores = []) {
    // Check if we're in a browser environment
    this.isBrowserEnvironment = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
    
    if (this.isBrowserEnvironment) {
      this.dbName = dbName;
      this.version = version;
      this.stores = stores;
      this.db = null;
      this.isInitialized = false;
      
      // Bind methods
      this.init = this.init.bind(this);
      this.get = this.get.bind(this);
      this.set = this.set.bind(this);
      this.delete = this.delete.bind(this);
      this.clear = this.clear.bind(this);
      this.getAll = this.getAll.bind(this);
      this.deleteExpired = this.deleteExpired.bind(this);
    } else {
      // In Node.js environment, provide mock methods
      console.warn('IndexedDB is not available in this environment. Using mock implementation.');
      this.isInitialized = true;
    }
  }

  /**
   * Initialize the database
   * @returns {Promise<IDBDatabase>} Database instance
   */
  async init() {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve(null);
    }

    if (this.isInitialized && this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(new Error(`Failed to initialize IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create stores
        this.stores.forEach(storeConfig => {
          const { name, keyPath, indexes = [], autoIncrement = false } = storeConfig;
          
          // Delete store if it exists
          if (db.objectStoreNames.contains(name)) {
            db.deleteObjectStore(name);
          }
          
          // Create new store
          const store = db.createObjectStore(name, { 
            keyPath: keyPath || 'id', 
            autoIncrement: autoIncrement 
          });
          
          // Create indexes
          indexes.forEach(index => {
            const { name, keyPath, options = {} } = index;
            store.createIndex(name, keyPath, options);
          });
        });
        
        console.log('IndexedDB schema upgraded');
      };
    });
  }

  /**
   * Get a value from the cache
   * @param {string} storeName - Store name
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(storeName, key) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve(null);
    }

    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        
        // Check if item exists and hasn't expired
        if (result) {
          if (result.expires && result.expires < Date.now()) {
            // Item expired, delete it
            this.delete(storeName, key);
            resolve(null);
          } else {
            resolve(result.value);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(`Failed to get item from ${storeName}:`, request.error);
        reject(new Error(`Failed to get item from ${storeName}: ${request.error}`));
      };
    });
  }

  /**
   * Set a value in the cache
   * @param {string} storeName - Store name
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @returns {Promise<void>}
   */
  async set(storeName, key, value, ttl = null) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve();
    }

    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Serialize the value to ensure it's compatible with IndexedDB
      const serializedValue = serializeData(value);
      
      const item = {
        id: key,
        value: serializedValue,
        createdAt: Date.now(),
        expires: ttl ? Date.now() + ttl : null
      };

      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to set item in ${storeName}:`, request.error);
        reject(new Error(`Failed to set item in ${storeName}: ${request.error}`));
      };
    });
  }

  /**
   * Delete a value from the cache
   * @param {string} storeName - Store name
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve();
    }

    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to delete item from ${storeName}:`, request.error);
        reject(new Error(`Failed to delete item from ${storeName}: ${request.error}`));
      };
    });
  }

  /**
   * Clear all values from a store
   * @param {string} storeName - Store name
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve();
    }

    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to clear ${storeName}:`, request.error);
        reject(new Error(`Failed to clear ${storeName}: ${request.error}`));
      };
    });
  }

  /**
   * Get all values from a store
   * @param {string} storeName - Store name
   * @returns {Promise<Array>} Array of all values
   */
  async getAll(storeName) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve([]);
    }

    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        const validResults = [];
        
        // Filter out expired items
        results.forEach(item => {
          if (item.expires && item.expires < Date.now()) {
            // Item expired, delete it
            this.delete(storeName, item.id);
          } else {
            validResults.push(item.value);
          }
        });
        
        resolve(validResults);
      };

      request.onerror = () => {
        console.error(`Failed to get all items from ${storeName}:`, request.error);
        reject(new Error(`Failed to get all items from ${storeName}: ${request.error}`));
      };
    });
  }

  /**
   * Delete expired items from a store
   * @param {string} storeName - Store name
   * @returns {Promise<number>} Number of items deleted
   */
  async deleteExpired(storeName) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve(0);
    }

    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      let deletedCount = 0;

      request.onsuccess = () => {
        const results = request.result || [];
        const expiredKeys = [];
        
        // Find expired items
        results.forEach(item => {
          if (item.expires && item.expires < Date.now()) {
            expiredKeys.push(item.id);
          }
        });
        
        // Delete expired items
        if (expiredKeys.length > 0) {
          const deleteTransaction = this.db.transaction([storeName], 'readwrite');
          const deleteStore = deleteTransaction.objectStore(storeName);
          
          expiredKeys.forEach(key => {
            deleteStore.delete(key);
            deletedCount++;
          });
        }
        
        resolve(deletedCount);
      };

      request.onerror = () => {
        console.error(`Failed to check expired items in ${storeName}:`, request.error);
        reject(new Error(`Failed to check expired items in ${storeName}: ${request.error}`));
      };
    });
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve({});
    }

    if (!this.isInitialized) {
      await this.init();
    }

    const stats = {};
    
    for (const storeName of this.db.objectStoreNames) {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const countRequest = store.count();
      
      await new Promise(resolve => {
        countRequest.onsuccess = () => {
          stats[storeName] = {
            count: countRequest.result
          };
          resolve();
        };
      });
    }
    
    return stats;
  }
}

/**
 * Default IndexedDB manager instance
 * Pre-configured with common stores for the application
 */
export const defaultIndexedDbManager = new IndexedDbManager('YosSoftCache', 1, [
  {
    name: 'reports',
    keyPath: 'id',
    indexes: [
      { name: 'createdAt', keyPath: 'createdAt' },
      { name: 'expires', keyPath: 'expires' }
    ]
  },
  {
    name: 'processedData',
    keyPath: 'id',
    indexes: [
      { name: 'createdAt', keyPath: 'createdAt' },
      { name: 'expires', keyPath: 'expires' }
    ]
  },
  {
    name: 'advancedReports',
    keyPath: 'id',
    indexes: [
      { name: 'createdAt', keyPath: 'createdAt' },
      { name: 'expires', keyPath: 'expires' }
    ]
  },
  {
    name: 'viewSettings',
    keyPath: 'id',
    indexes: [
      { name: 'createdAt', keyPath: 'createdAt' }
    ]
  }
]);

/**
 * Cache manager that combines IndexedDB with localStorage fallback
 */
export class CacheManager {
  /**
   * Constructor
   * @param {IndexedDbManager} indexedDbManager - IndexedDB manager instance
   */
  constructor(indexedDbManager = defaultIndexedDbManager) {
    this.indexedDbManager = indexedDbManager;
    this.isBrowserEnvironment = typeof window !== 'undefined';
    this.isIndexedDbSupported = this.isBrowserEnvironment && typeof indexedDB !== 'undefined';
    this.isLocalStorageSupported = this.isBrowserEnvironment && typeof localStorage !== 'undefined';
  }

  /**
   * Get a value from cache
   * @param {string} storeName - Store name
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(storeName, key) {
    if (this.isIndexedDbSupported) {
      try {
        return await this.indexedDbManager.get(storeName, key);
      } catch (error) {
        console.warn('IndexedDB get failed, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage if available
    if (this.isLocalStorageSupported) {
      try {
        const item = localStorage.getItem(`${storeName}_${key}`);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.expires && parsed.expires < Date.now()) {
            localStorage.removeItem(`${storeName}_${key}`);
            return null;
          }
          return parsed.value;
        }
      } catch (error) {
        console.warn('localStorage get failed:', error);
      }
    }
    
    return null;
  }

  /**
   * Set a value in cache
   * @param {string} storeName - Store name
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @returns {Promise<void>}
   */
  async set(storeName, key, value, ttl = null) {
    if (this.isIndexedDbSupported) {
      try {
        await this.indexedDbManager.set(storeName, key, value, ttl);
        return;
      } catch (error) {
        console.warn('IndexedDB set failed, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage if available
    if (this.isLocalStorageSupported) {
      try {
        // Serialize the value to ensure it's compatible with localStorage
        const serializedValue = serializeData(value);
        
        const item = {
          value: serializedValue,
          createdAt: Date.now(),
          expires: ttl ? Date.now() + ttl : null
        };
        localStorage.setItem(`${storeName}_${key}`, JSON.stringify(item));
      } catch (error) {
        console.warn('localStorage set failed:', error);
      }
    }
  }

  /**
   * Delete a value from cache
   * @param {string} storeName - Store name
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    if (this.isIndexedDbSupported) {
      try {
        await this.indexedDbManager.delete(storeName, key);
        return;
      } catch (error) {
        console.warn('IndexedDB delete failed, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage if available
    if (this.isLocalStorageSupported) {
      try {
        localStorage.removeItem(`${storeName}_${key}`);
      } catch (error) {
        console.warn('localStorage delete failed:', error);
      }
    }
  }

  /**
   * Clear all values from a store
   * @param {string} storeName - Store name
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    if (this.isIndexedDbSupported) {
      try {
        await this.indexedDbManager.clear(storeName);
        return;
      } catch (error) {
        console.warn('IndexedDB clear failed, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage if available
    if (this.isLocalStorageSupported) {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`${storeName}_`)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('localStorage clear failed:', error);
      }
    }
  }
}

/**
 * Default cache manager instance
 */
export const cacheManager = new CacheManager();

export default IndexedDbManager;