import fs from 'fs';
import path from 'path';

console.log('--- 🧪 STARTING PURECUT STUDIO PIPELINE INTEGRATION TEST ---');

async function testPipeline() {
  // Test 1: Check modules import
  console.log('\n[Test 1] Importing Core Services...');
  const bgService = await import('../src/services/backgroundRemoval.js');
  const batchService = await import('../src/services/batchProcessor.js');
  const canvasRenderer = await import('../src/utils/canvasRenderer.js');

  if (typeof bgService.removeBackgroundAI !== 'function') throw new Error('removeBackgroundAI missing');
  if (typeof bgService.removeBackgroundAIBlob !== 'function') throw new Error('removeBackgroundAIBlob missing');
  if (typeof batchService.createBatchItem !== 'function') throw new Error('createBatchItem missing');
  if (typeof batchService.BatchQueueWorker !== 'function') throw new Error('BatchQueueWorker missing');
  if (typeof canvasRenderer.renderCompositeCanvas !== 'function') throw new Error('renderCompositeCanvas missing');
  if (typeof canvasRenderer.generateExportBlob !== 'function') throw new Error('generateExportBlob missing');
  console.log('✅ All services and utilities exported and loaded successfully.');

  // Test 2: Verify sample and background assets on disk
  console.log('\n[Test 2] Checking Local Bundled Assets...');
  const samples = ['public/samples/portrait.jpg', 'public/samples/product.jpg', 'public/samples/car.jpg'];
  for (const s of samples) {
    if (!fs.existsSync(s)) throw new Error(`Missing sample: ${s}`);
    const size = fs.statSync(s).size;
    console.log(`✅ Sample asset verified: ${s} (${size} bytes)`);
  }

  const bgs = ['public/backgrounds/office.jpg', 'public/backgrounds/interior.jpg', 'public/backgrounds/forest.jpg', 'public/backgrounds/city.jpg'];
  for (const b of bgs) {
    if (!fs.existsSync(b)) throw new Error(`Missing background: ${b}`);
    const size = fs.statSync(b).size;
    console.log(`✅ Stock background verified: ${b} (${size} bytes)`);
  }

  // Test 3: Test Batch Item generation
  console.log('\n[Test 3] Testing Batch Queue Descriptor Creation...');
  const mockFile = { name: 'portrait.jpg', size: 66590, type: 'image/jpeg' };
  const batchItem = batchService.createBatchItem(mockFile, 0);
  if (!batchItem.id || batchItem.status !== 'pending') throw new Error('Batch item initialization failed');
  console.log(`✅ Batch item created: ${batchItem.id} (Status: ${batchItem.status})`);

  // Test 4: Verify formatBytes and formatEta helpers
  console.log('\n[Test 4] Testing Utility Functions...');
  const formattedSize = batchService.formatBytes(1048576);
  if (formattedSize !== '1.0 MB' && formattedSize !== '1 MB') throw new Error(`Unexpected formatBytes output: ${formattedSize}`);
  const eta = batchService.formatEta(125);
  if (!eta.includes('m')) throw new Error(`Unexpected formatEta output: ${eta}`);
  console.log(`✅ formatBytes(1048576) = ${formattedSize}, formatEta(125) = ${eta}`);

  console.log('\n✨ ALL PIPELINE INTEGRATION TESTS PASSED 100%! ✨\n');
}

testPipeline().catch(err => {
  console.error('\n❌ PIPELINE TEST FAILED:', err);
  process.exit(1);
});
