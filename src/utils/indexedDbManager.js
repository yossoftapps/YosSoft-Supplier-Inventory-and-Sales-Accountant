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
      this.isIndexedDbPermanentlyUnavailable = false;

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
      this.isIndexedDbPermanentlyUnavailable = true;
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

    // If we've already determined that IndexedDB is not usable, skip initialization
    if (this.isIndexedDbPermanentlyUnavailable) {
      return Promise.resolve(null);
    }

    // Ensure single init attempt with a static promise
    if (!this._initPromise) {
      this._initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          // Suppress repeated errors after first failure
          if (!this.isIndexedDbPermanentlyUnavailable) {
            console.error('IndexedDB initialization failed:', request.error);
          }
          // Mark IndexedDB as permanently unavailable to prevent repeated attempts
          this.isIndexedDbPermanentlyUnavailable = true;
          reject(new Error(`Failed to initialize IndexedDB: ${request.error}`));
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.isInitialized = true;
          // Reset the permanently unavailable flag if initialization succeeds
          this.isIndexedDbPermanentlyUnavailable = false;
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

    return this._initPromise;
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

    // Return null if IndexedDB is permanently unavailable
    if (this.isIndexedDbPermanentlyUnavailable) {
      return Promise.resolve(null);
    }

    try {
      if (!this.isInitialized) {
        await this.init();

        // If initialization failed and marked as permanently unavailable, return null
        if (this.isIndexedDbPermanentlyUnavailable) {
          return Promise.resolve(null);
        }
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
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to get item from ${storeName}:`, request.error);
          reject(new Error(`Failed to get item from ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve(null);
    }
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

    // Return early if IndexedDB is permanently unavailable
    if (this.isIndexedDbPermanentlyUnavailable) {
      return Promise.resolve();
    }

    try {
      if (!this.isInitialized) {
        await this.init();

        // If initialization failed and marked as permanently unavailable, return
        if (this.isIndexedDbPermanentlyUnavailable) {
          return Promise.resolve();
        }
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
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to set item in ${storeName}:`, request.error);
          reject(new Error(`Failed to set item in ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve();
    }
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

    // Return early if IndexedDB is permanently unavailable
    if (this.isIndexedDbPermanentlyUnavailable) {
      return Promise.resolve();
    }

    try {
      if (!this.isInitialized) {
        await this.init();

        // If initialization failed and marked as permanently unavailable, return
        if (this.isIndexedDbPermanentlyUnavailable) {
          return Promise.resolve();
        }
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to delete item from ${storeName}:`, request.error);
          reject(new Error(`Failed to delete item from ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve();
    }
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

    // Return early if IndexedDB is permanently unavailable
    if (this.isIndexedDbPermanentlyUnavailable) {
      return Promise.resolve();
    }

    try {
      if (!this.isInitialized) {
        await this.init();

        // If initialization failed and marked as permanently unavailable, return
        if (this.isIndexedDbPermanentlyUnavailable) {
          return Promise.resolve();
        }
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to clear ${storeName}:`, request.error);
          reject(new Error(`Failed to clear ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve();
    }
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

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.isIndexedDbPermanentlyUnavailable) {
        return Promise.resolve([]);
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
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to get all items from ${storeName}:`, request.error);
          reject(new Error(`Failed to get all items from ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve([]);
    }
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

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.isIndexedDbPermanentlyUnavailable) {
        return Promise.resolve(0);
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
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to check expired items in ${storeName}:`, request.error);
          reject(new Error(`Failed to check expired items in ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve(0);
    }
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

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.isIndexedDbPermanentlyUnavailable) {
        return Promise.resolve({});
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
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve({});
    }
  }

  /**
   * البحث باستخدام فهرس معين
   * @param {string} storeName - اسم المخزن
   * @param {string} indexName - اسم الفهرس
   * @param {any} value - القيمة المراد البحث عنها
   * @returns {Promise<Array>} النتائج المطابقة
   */
  async searchByIndex(storeName, indexName, value) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve([]);
    }

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.isIndexedDbPermanentlyUnavailable) {
        return Promise.resolve([]);
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

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
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to search by index in ${storeName}:`, request.error);
          reject(new Error(`Failed to search by index in ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve([]);
    }
  }

  /**
   * البحث بنطاق معين في فهرس
   * @param {string} storeName - اسم المخزن
   * @param {string} indexName - اسم الفهرس
   * @param {any} lowerBound - الحد الأدنى
   * @param {any} upperBound - الحد الأقصى
   * @param {boolean} lowerOpen - هل الحد الأدنى مفتوح
   * @param {boolean} upperOpen - هل الحد الأقصى مفتوح
   * @returns {Promise<Array>} النتائج المطابقة
   */
  async searchByIndexRange(storeName, indexName, lowerBound, upperBound, lowerOpen = false, upperOpen = false) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve([]);
    }

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.isIndexedDbPermanentlyUnavailable) {
        return Promise.resolve([]);
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const range = IDBKeyRange.bound(lowerBound, upperBound, lowerOpen, upperOpen);
        const request = index.getAll(range);

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
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to search by index range in ${storeName}:`, request.error);
          reject(new Error(`Failed to search by index range in ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve([]);
    }
  }

  /**
   * القراءة بالدفعات مع معالجة كل دفعة
   * @param {string} storeName - اسم المخزن
   * @param {number} batchSize - حجم الدفعة
   * @param {Function} callback - دالة معالجة كل دفعة
   * @param {IDBKeyRange} keyRange - نطاق المفاتيح (اختياري)
   * @returns {Promise<number>} عدد العناصر المعالجة
   */
  async getBatchedData(storeName, batchSize = 100, callback, keyRange = null) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve(0);
    }

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.isIndexedDbPermanentlyUnavailable) {
        return Promise.resolve(0);
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.openCursor(keyRange);

        let batch = [];
        let count = 0;
        let totalProcessed = 0;

        request.onsuccess = async (event) => {
          const cursor = event.target.result;

          if (cursor) {
            const item = cursor.value;

            // Check if item is expired
            if (item.expires && item.expires < Date.now()) {
              // Skip expired items
              cursor.continue();
              return;
            }

            batch.push(item.value);
            count++;

            // Process batch when it reaches the batch size
            if (count >= batchSize) {
              try {
                await callback(batch, totalProcessed, totalProcessed + batch.length);
                totalProcessed += batch.length;
                batch = [];
                count = 0;
              } catch (error) {
                console.error('Error processing batch:', error);
                reject(error);
                return;
              }
            }

            cursor.continue();
          } else {
            // Process remaining items in the last batch
            if (batch.length > 0) {
              try {
                await callback(batch, totalProcessed, totalProcessed + batch.length);
                totalProcessed += batch.length;
              } catch (error) {
                console.error('Error processing final batch:', error);
                reject(error);
                return;
              }
            }

            resolve(totalProcessed);
          }
        };

        request.onerror = () => {
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to get batched data from ${storeName}:`, request.error);
          reject(new Error(`Failed to get batched data from ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve(0);
    }
  }

  /**
   * عد العناصر في مخزن معين
   * @param {string} storeName - اسم المخزن
   * @param {IDBKeyRange} keyRange - نطاق المفاتيح (اختياري)
   * @returns {Promise<number>} عدد العناصر
   */
  async count(storeName, keyRange = null) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve(0);
    }

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.isIndexedDbPermanentlyUnavailable) {
        return Promise.resolve(0);
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count(keyRange);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          // Mark unavailable on transaction errors too
          this.isIndexedDbPermanentlyUnavailable = true;
          console.error(`Failed to count items in ${storeName}:`, request.error);
          reject(new Error(`Failed to count items in ${storeName}: ${request.error}`));
        };
      });
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve(0);
    }
  }

  /**
   * الحصول على عدة عناصر بمفاتيح محددة
   * @param {string} storeName - اسم المخزن
   * @param {Array} keys - مصفوفة المفاتيح
   * @returns {Promise<Array>} العناصر المطابقة
   */
  async getMultiple(storeName, keys) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve([]);
    }

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.isIndexedDbPermanentlyUnavailable) {
        return Promise.resolve([]);
      }

      const results = [];

      for (const key of keys) {
        try {
          const value = await this.get(storeName, key);
          if (value !== null) {
            results.push(value);
          }
        } catch (error) {
          console.warn(`Failed to get item with key ${key}:`, error);
        }
      }

      return results;
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve([]);
    }
  }

  /**
   * حفظ عدة عناصر دفعة واحدة
   * @param {string} storeName - اسم المخزن
   * @param {Array} items - مصفوفة العناصر [{key, value, ttl}]
   * @returns {Promise<number>} عدد العناصر المحفوظة
   */
  async setMultiple(storeName, items) {
    // Return early if not in browser environment
    if (!this.isBrowserEnvironment) {
      return Promise.resolve(0);
    }

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.isIndexedDbPermanentlyUnavailable) {
        return Promise.resolve(0);
      }

      let savedCount = 0;

      for (const item of items) {
        try {
          await this.set(storeName, item.key, item.value, item.ttl || null);
          savedCount++;
        } catch (error) {
          console.warn(`Failed to save item with key ${item.key}:`, error);
        }
      }

      return savedCount;
    } catch (error) {
      // Catch init failure and mark unavailable
      this.isIndexedDbPermanentlyUnavailable = true;
      return Promise.resolve(0);
    }
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
    this.isElectron = this.isBrowserEnvironment && window.process && window.process.versions && window.process.versions.electron;
    this.isIndexedDbSupported = this.isBrowserEnvironment && typeof indexedDB !== 'undefined' && !this.isElectron;
    this.isLocalStorageSupported = this.isBrowserEnvironment && typeof localStorage !== 'undefined';
    this.fallbackActive = false;
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
        // Check if IndexedDB is permanently unavailable before attempting to use it
        if (this.indexedDbManager.isIndexedDbPermanentlyUnavailable) {
          // Skip IndexedDB and go directly to localStorage
        } else {
          return await this.indexedDbManager.get(storeName, key);
        }
      } catch (error) {
        if (!this.fallbackActive) {
          console.warn('IndexedDB get failed, falling back to localStorage:', error);
          this.fallbackActive = true;
        }
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
        if (!this.fallbackActive) {
          console.warn('localStorage get failed:', error);
          this.fallbackActive = true;
        }
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
        // Check if IndexedDB is permanently unavailable before attempting to use it
        if (!this.indexedDbManager.isIndexedDbPermanentlyUnavailable) {
          await this.indexedDbManager.set(storeName, key, value, ttl);
          return;
        }
      } catch (error) {
        if (!this.fallbackActive) {
          console.warn('IndexedDB set failed, falling back to localStorage:', error);
          this.fallbackActive = true;
        }
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
        if (!this.fallbackActive) {
          console.warn('localStorage set failed:', error);
          this.fallbackActive = true;
        }
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
        // Check if IndexedDB is permanently unavailable before attempting to use it
        if (!this.indexedDbManager.isIndexedDbPermanentlyUnavailable) {
          await this.indexedDbManager.delete(storeName, key);
          return;
        }
      } catch (error) {
        if (!this.fallbackActive) {
          console.warn('IndexedDB delete failed, falling back to localStorage:', error);
          this.fallbackActive = true;
        }
      }
    }

    // Fallback to localStorage if available
    if (this.isLocalStorageSupported) {
      try {
        localStorage.removeItem(`${storeName}_${key}`);
      } catch (error) {
        if (!this.fallbackActive) {
          console.warn('localStorage delete failed:', error);
          this.fallbackActive = true;
        }
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
        // Check if IndexedDB is permanently unavailable before attempting to use it
        if (!this.indexedDbManager.isIndexedDbPermanentlyUnavailable) {
          await this.indexedDbManager.clear(storeName);
          return;
        }
      } catch (error) {
        if (!this.fallbackActive) {
          console.warn('IndexedDB clear failed, falling back to localStorage:', error);
          this.fallbackActive = true;
        }
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
        if (!this.fallbackActive) {
          console.warn('localStorage clear failed:', error);
          this.fallbackActive = true;
        }
      }
    }
  }
}

/**
 * Default cache manager instance
 */
export const cacheManager = new CacheManager();

export default IndexedDbManager;
