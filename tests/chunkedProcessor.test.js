// Test for chunked processor functionality
import { ChunkedProcessor, MemoryMonitor } from '../src/utils/chunkedProcessor.js';

console.log('Testing chunked processor functionality...');

// Generate test data
function generateTestData(size) {
  const data = [];
  for (let i = 0; i < size; i++) {
    data.push({
      id: i,
      name: `Record ${i}`,
      value: Math.random() * 1000,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }
  return data;
}

// Test chunked processing
async function testChunkedProcessing() {
  console.log('\n=== Testing Chunked Processing ===');
  
  // Generate test data
  const testData = generateTestData(5000);
  console.log(`Generated ${testData.length} test records`);
  
  // Track memory usage
  MemoryMonitor.logMemoryUsage('Before processing');
  
  // Process data in chunks
  const chunkSize = 500;
  let totalProcessed = 0;
  let chunksProcessed = 0;
  
  const startTime = Date.now();
  
  await ChunkedProcessor.processExcelDataInChunks(
    testData,
    chunkSize,
    async (chunk, index) => {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      totalProcessed += chunk.length;
      chunksProcessed++;
      
      // Log progress every few chunks
      if (chunksProcessed % 5 === 0 || chunksProcessed === 1) {
        console.log(`Processed chunk ${index + 1} (${chunk.length} records) - Total: ${totalProcessed}/${testData.length}`);
      }
    }
  );
  
  const endTime = Date.now();
  
  console.log(`\nProcessing completed:`);
  console.log(`  Total records: ${totalProcessed}`);
  console.log(`  Chunks processed: ${chunksProcessed}`);
  console.log(`  Time taken: ${endTime - startTime} ms`);
  console.log(`  Average time per chunk: ${Math.round((endTime - startTime) / chunksProcessed)} ms`);
  
  MemoryMonitor.logMemoryUsage('After processing');
}

// Test progress tracking
function testProgressTracking() {
  console.log('\n=== Testing Progress Tracking ===');
  
  const totalRecords = 10000;
  const tracker = ChunkedProcessor.createProgressTracker(totalRecords);
  
  // Simulate processing in batches
  let processed = 0;
  const batchSize = 1000;
  
  while (processed < totalRecords) {
    const currentBatch = Math.min(batchSize, totalRecords - processed);
    processed += currentBatch;
    
    const stats = tracker.update(currentBatch, `Batch ${Math.ceil(processed/batchSize)}`);
    
    // Simulate work
    // In a real scenario, this would be actual processing
  }
  
  const finalStats = tracker.getStats();
  console.log(`\nFinal Stats:`);
  console.log(`  Processed: ${finalStats.processedRecords}/${finalStats.totalRecords}`);
  console.log(`  Rate: ${Math.round(finalStats.rate)} records/sec`);
  console.log(`  Time: ${finalStats.elapsed} ms`);
  console.log(`  Completed: ${finalStats.completed}`);
}

// Test memory monitoring
function testMemoryMonitoring() {
  console.log('\n=== Testing Memory Monitoring ===');
  
  MemoryMonitor.logMemoryUsage('Initial');
  
  // Allocate some memory
  const largeArray = new Array(100000).fill(0).map((_, i) => ({
    id: i,
    data: `Some data string ${i}`,
    nested: {
      value: Math.random() * 1000,
      timestamp: Date.now()
    }
  }));
  
  MemoryMonitor.logMemoryUsage('After allocation');
  
  // Check memory limits
  const withinLimits = MemoryMonitor.isWithinMemoryLimits(500); // 500MB limit
  console.log(`Within memory limits (500MB): ${withinLimits}`);
  
  // Clean up
  largeArray.length = 0;
  
  MemoryMonitor.logMemoryUsage('After cleanup');
}

// Run all tests
async function runAllTests() {
  console.log('Running chunked processor tests...\n');
  
  try {
    testMemoryMonitoring();
    testProgressTracking();
    await testChunkedProcessing();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the tests
runAllTests();