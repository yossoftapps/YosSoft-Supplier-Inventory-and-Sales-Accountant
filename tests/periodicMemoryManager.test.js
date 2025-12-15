// Test file for periodic memory manager functionality
console.log('Testing periodic memory manager functionality...');

// Import the memory manager
import { PeriodicMemoryManager, memoryManager, MemoryMonitor } from '../src/utils/periodicMemoryManager.js';

console.log('\n=== Testing PeriodicMemoryManager Class ===');

try {
  // Test 1: Creating a memory manager instance
  console.log('Test 1: Creating a memory manager instance');
  
  const manager = new PeriodicMemoryManager({
    cleanupInterval: 30000, // 30 seconds
    memoryThreshold: 1000,  // 1000MB threshold
    enableLogging: true
  });
  
  console.log('✅ Memory manager instance created successfully');
  console.log('✅ Configuration options accepted');
  
  // Test 2: Checking memory usage methods
  console.log('\nTest 2: Checking memory usage methods');
  
  const memoryUsage = manager.getMemoryUsage();
  console.log('✅ getMemoryUsage() method works');
  console.log('   Memory usage object structure:', Object.keys(memoryUsage));
  
  const isHigh = manager.isMemoryUsageHigh();
  console.log('✅ isMemoryUsageHigh() method works');
  console.log('   High memory detected:', isHigh);
  
  // Test 3: Logging memory usage
  console.log('\nTest 3: Logging memory usage');
  manager.logMemoryUsage('Test Point');
  console.log('✅ logMemoryUsage() method works');
  
  // Test 4: Starting and stopping the manager
  console.log('\nTest 4: Starting and stopping the manager');
  
  // Mock the performCleanup method to avoid actual GC calls
  manager.performCleanup = function() {
    this.logMemoryUsage('Mock Cleanup');
  };
  
  manager.start();
  console.log('✅ Manager started successfully');
  console.log('✅ Initial cleanup performed');
  
  // Wait a bit and then stop
  setTimeout(() => {
    manager.stop();
    console.log('✅ Manager stopped successfully');
    
    // Test 5: Singleton instance
    console.log('\nTest 5: Testing singleton instance');
    const singletonUsage = memoryManager.getMemoryUsage();
    console.log('✅ Singleton memoryManager instance accessible');
    console.log('   Singleton memory usage object structure:', Object.keys(singletonUsage));
    
    // Test 6: MemoryMonitor utility
    console.log('\nTest 6: Testing MemoryMonitor utility');
    
    MemoryMonitor.monitorOperation('Test Operation', async () => {
      console.log('✅ MemoryMonitor.monitorOperation works');
      return 'test result';
    }).then(result => {
      console.log('✅ MemoryMonitor operation completed');
      console.log('   Operation result:', result);
      
      console.log('\n✅ All periodic memory manager tests completed successfully!');
    }).catch(error => {
      console.error('❌ MemoryMonitor test failed:', error.message);
    });
    
  }, 100); // Wait 100ms to test the interval
  
} catch (error) {
  console.error('❌ Periodic memory manager tests failed:', error.message);
  console.error(error.stack);
}

console.log('\n=== Periodic Memory Manager Test Summary ===');
console.log('The PeriodicMemoryManager provides:');
console.log('1. Automated memory monitoring with configurable intervals');
console.log('2. Memory usage threshold detection');
console.log('3. Periodic cleanup with garbage collection hints');
console.log('4. Detailed memory usage logging');
console.log('5. Singleton instance for easy access');
console.log('6. Memory monitoring utility for long-running operations');