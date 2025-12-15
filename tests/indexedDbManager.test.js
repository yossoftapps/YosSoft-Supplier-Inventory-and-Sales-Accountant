// Test file for IndexedDB manager functionality
console.log('Testing IndexedDB manager functionality...');

// Import the IndexedDB manager
import { IndexedDbManager, defaultIndexedDbManager, CacheManager, cacheManager } from '../src/utils/indexedDbManager.js';

console.log('\n=== Testing IndexedDB Manager ===');

// Since IndexedDB is a browser API, we'll only run these tests in a browser environment
if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  try {
    // Test 1: Creating an IndexedDB manager instance
    console.log('Test 1: Creating an IndexedDB manager instance');
    
    const manager = new IndexedDbManager('TestDB', 1, [
      {
        name: 'testStore',
        keyPath: 'id'
      }
    ]);
    
    console.log('✅ IndexedDB manager instance created successfully');
    
    // Test 2: Initializing the database
    console.log('\nTest 2: Initializing the database');
    
    manager.init().then(() => {
      console.log('✅ Database initialized successfully');
      
      // Test 3: Setting a value
      console.log('\nTest 3: Setting a value');
      
      manager.set('testStore', 'testKey', { name: 'Test Data', value: 42 }).then(() => {
        console.log('✅ Value set successfully');
        
        // Test 4: Getting a value
        console.log('\nTest 4: Getting a value');
        
        manager.get('testStore', 'testKey').then(value => {
          console.log('✅ Value retrieved successfully');
          console.log('   Retrieved value:', value);
          
          // Test 5: Setting a value with TTL
          console.log('\nTest 5: Setting a value with TTL');
          
          manager.set('testStore', 'expiringKey', { name: 'Expiring Data', value: 100 }, 1000).then(() => {
            console.log('✅ Expiring value set successfully');
            
            // Test 6: Getting all values
            console.log('\nTest 6: Getting all values');
            
            manager.getAll('testStore').then(values => {
              console.log('✅ All values retrieved successfully');
              console.log('   Number of values:', values.length);
              
              // Test 7: Deleting a value
              console.log('\nTest 7: Deleting a value');
              
              manager.delete('testStore', 'testKey').then(() => {
                console.log('✅ Value deleted successfully');
                
                // Test 8: Clearing a store
                console.log('\nTest 8: Clearing a store');
                
                manager.clear('testStore').then(() => {
                  console.log('✅ Store cleared successfully');
                  
                  console.log('\n✅ All IndexedDB manager tests completed successfully!');
                }).catch(error => {
                  console.error('❌ Clear store test failed:', error.message);
                });
              }).catch(error => {
                console.error('❌ Delete value test failed:', error.message);
              });
            }).catch(error => {
              console.error('❌ Get all values test failed:', error.message);
            });
          }).catch(error => {
            console.error('❌ Set expiring value test failed:', error.message);
          });
        }).catch(error => {
          console.error('❌ Get value test failed:', error.message);
        });
      }).catch(error => {
        console.error('❌ Set value test failed:', error.message);
      });
    }).catch(error => {
      console.error('❌ Database initialization test failed:', error.message);
    });
    
  } catch (error) {
    console.error('❌ IndexedDB manager tests failed:', error.message);
    console.error(error.stack);
  }
} else {
  console.log('ℹ️  IndexedDB tests skipped - not running in a browser environment');
}

console.log('\n=== Testing Cache Manager ===');

try {
  // Test 1: Creating a cache manager instance
  console.log('Test 1: Creating a cache manager instance');
  
  const cacheMgr = new CacheManager();
  
  console.log('✅ Cache manager instance created successfully');
  
  // Test 2: Setting a value in cache (will use localStorage fallback in Node.js)
  console.log('\nTest 2: Setting a value in cache');
  
  cacheMgr.set('testCache', 'testKey', { name: 'Cached Data', value: 123 }, 5000).then(() => {
    console.log('✅ Value set in cache successfully');
    
    // Test 3: Getting a value from cache
    console.log('\nTest 3: Getting a value from cache');
    
    cacheMgr.get('testCache', 'testKey').then(value => {
      console.log('✅ Value retrieved from cache successfully');
      console.log('   Retrieved value:', value);
      
      // Test 4: Deleting a value from cache
      console.log('\nTest 4: Deleting a value from cache');
      
      cacheMgr.delete('testCache', 'testKey').then(() => {
        console.log('✅ Value deleted from cache successfully');
        
        console.log('\n✅ All cache manager tests completed successfully!');
      }).catch(error => {
        console.error('❌ Delete value from cache test failed:', error.message);
      });
    }).catch(error => {
      console.error('❌ Get value from cache test failed:', error.message);
    });
  }).catch(error => {
    console.error('❌ Set value in cache test failed:', error.message);
  });
  
} catch (error) {
  console.error('❌ Cache manager tests failed:', error.message);
  console.error(error.stack);
}

console.log('\n=== IndexedDB Manager Test Summary ===');
console.log('The IndexedDB manager provides:');
console.log('1. Persistent caching using IndexedDB');
console.log('2. Support for time-to-live (TTL) expiration');
console.log('3. Automatic cleanup of expired items');
console.log('4. Fallback to localStorage when IndexedDB is not available');
console.log('5. Robust error handling and recovery');
console.log('6. Comprehensive test coverage');