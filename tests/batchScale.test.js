import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  createBatchItem, 
  formatBytes, 
  formatEta, 
  BatchQueueWorker 
} from '../src/services/batchProcessor.js';
import { calculateZipVolumes } from '../src/utils/zipExporter.js';

describe('Massive Scale Batch Processor Engine (1,000 to 10,000+ files)', () => {
  describe('High-Volume In-Memory Scaffolding', () => {
    it('creates 10,000 lightweight item descriptors in under 250ms without heap bloat', () => {
      const startTime = performance.now();
      const items = [];
      const count = 10000;

      for (let i = 0; i < count; i++) {
        items.push(
          createBatchItem(
            { name: `catalog_item_${i.toString().padStart(5, '0')}.jpg`, size: 2500000, type: 'image/jpeg' },
            i
          )
        );
      }

      const elapsed = performance.now() - startTime;
      assert.equal(items.length, 10000);
      assert.ok(elapsed < 250, `Expected 10,000 items created in < 250ms, took ${elapsed}ms`);

      // Verify structure of first and last item
      assert.equal(items[0].name, 'catalog_item_00000.jpg');
      assert.equal(items[9999].name, 'catalog_item_09999.jpg');
      assert.equal(items[0].status, 'pending');
      assert.equal(items[0].hasResult, false);
      assert.equal(items[0].resultBlob, null);
    });

    it('generates unique random IDs for all 10,000 items', () => {
      const idSet = new Set();
      for (let i = 0; i < 10000; i++) {
        const item = createBatchItem({ name: `img_${i}.png`, size: 100 }, i);
        idSet.add(item.id);
      }
      assert.equal(idSet.size, 10000, 'All 10,000 generated item IDs must be strictly unique');
    });
  });

  describe('Multi-Part ZIP Volume Calculator', () => {
    it('partitions 1,000 completed items into 2 volumes of 500', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: `it_${i}`,
        status: 'completed',
        name: `photo_${i}.jpg`
      }));

      const volumes = calculateZipVolumes(items, 500);
      assert.equal(volumes.length, 2);
      assert.equal(volumes[0].partNumber, 1);
      assert.equal(volumes[0].count, 500);
      assert.equal(volumes[0].startIdx, 0);
      assert.equal(volumes[0].endIdx, 500);

      assert.equal(volumes[1].partNumber, 2);
      assert.equal(volumes[1].count, 500);
      assert.equal(volumes[1].startIdx, 500);
      assert.equal(volumes[1].endIdx, 1000);
    });

    it('partitions 5,000 completed items into 10 volumes of 500 without index gaps', () => {
      const items = Array.from({ length: 5000 }, (_, i) => ({
        id: `it_${i}`,
        status: 'completed',
        name: `photo_${i}.jpg`
      }));

      const volumes = calculateZipVolumes(items, 500);
      assert.equal(volumes.length, 10);
      
      let totalCounted = 0;
      volumes.forEach((vol, idx) => {
        assert.equal(vol.partNumber, idx + 1);
        assert.equal(vol.count, 500);
        assert.equal(vol.startIdx, idx * 500);
        assert.equal(vol.endIdx, (idx + 1) * 500);
        totalCounted += vol.count;
      });

      assert.equal(totalCounted, 5000);
    });

    it('partitions 10,000 completed items into 20 safe volumes of 500', () => {
      const items = Array.from({ length: 10000 }, (_, i) => ({
        id: `it_${i}`,
        status: 'completed',
        name: `photo_${i}.jpg`
      }));

      const volumes = calculateZipVolumes(items, 500);
      assert.equal(volumes.length, 20);
      assert.equal(volumes[19].endIdx, 10000);
    });

    it('handles non-exact multiples safely (e.g. 1,234 items)', () => {
      const items = Array.from({ length: 1234 }, (_, i) => ({
        id: `it_${i}`,
        status: 'completed',
        name: `photo_${i}.jpg`
      }));

      const volumes = calculateZipVolumes(items, 500);
      assert.equal(volumes.length, 3);
      assert.equal(volumes[0].count, 500);
      assert.equal(volumes[1].count, 500);
      assert.equal(volumes[2].count, 234);
      assert.equal(volumes[2].startIdx, 1000);
      assert.equal(volumes[2].endIdx, 1234);
    });

    it('ignores non-completed items in volume calculations', () => {
      const items = [
        { id: '1', status: 'completed' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'processing' },
        { id: '4', status: 'completed' },
        { id: '5', status: 'error' }
      ];

      const volumes = calculateZipVolumes(items, 500);
      assert.equal(volumes.length, 1);
      assert.equal(volumes[0].count, 2);
    });
  });

  describe('BatchQueueWorker Concurrency & Configuration', () => {
    it('properly configures and clamps concurrency levels', () => {
      const worker = new BatchQueueWorker({
        onItemUpdate: () => {},
        concurrency: 3,
        maxEdge: 2048
      });

      assert.equal(worker.concurrency, 3);
      assert.equal(worker.maxEdge, 2048);

      // Clamp checks
      worker.updateSettings({ concurrency: 10 });
      assert.equal(worker.concurrency, 4, 'Concurrency should clamp to maximum 4');

      worker.updateSettings({ concurrency: 0 });
      assert.equal(worker.concurrency, 1, 'Concurrency should clamp to minimum 1');
    });

    it('allows updating direct-to-disk directory handle', () => {
      const mockDirHandle = { name: 'CutoutsFolder' };
      const worker = new BatchQueueWorker({
        onItemUpdate: () => {},
        dirHandle: null
      });

      assert.equal(worker.dirHandle, null);
      worker.updateSettings({ dirHandle: mockDirHandle });
      assert.equal(worker.dirHandle, mockDirHandle);
    });
  });

  describe('Extreme Scale Metrics & Formatters', () => {
    it('formats gigabytes and terabytes accurately for massive batches', () => {
      // 10,000 photos * 3MB = 30,000 MB = ~29.3 GB
      assert.equal(formatBytes(30000000000), '27.9 GB');
      assert.equal(formatBytes(10737418240), '10 GB');
    });

    it('formats multi-hour ETAs safely for overnight batch processing', () => {
      assert.equal(formatEta(7200), '2h 0m');
      assert.equal(formatEta(18000), '5h 0m');
      assert.equal(formatEta(36000), '10h 0m');
    });
  });
});
