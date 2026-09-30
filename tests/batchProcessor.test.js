import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, formatEta, createBatchItem } from '../src/services/batchProcessor.js';

describe('Batch Processor Services', () => {
  describe('formatBytes', () => {
    it('handles 0 and empty inputs safely', () => {
      assert.equal(formatBytes(0), '0 B');
      assert.equal(formatBytes(null), '0 B');
      assert.equal(formatBytes(undefined), '0 B');
    });

    it('formats bytes, kilobytes, megabytes, and gigabytes accurately', () => {
      assert.equal(formatBytes(500), '500 B');
      assert.equal(formatBytes(1024), '1 KB');
      assert.equal(formatBytes(1536), '1.5 KB');
      assert.equal(formatBytes(1048576), '1 MB');
      assert.equal(formatBytes(5242880), '5 MB');
      assert.equal(formatBytes(1073741824), '1 GB');
    });
  });

  describe('formatEta', () => {
    it('handles edge cases safely', () => {
      assert.equal(formatEta(0), 'Calculating...');
      assert.equal(formatEta(-5), 'Calculating...');
      assert.equal(formatEta(Infinity), 'Calculating...');
      assert.equal(formatEta(NaN), 'Calculating...');
    });

    it('formats seconds correctly', () => {
      assert.equal(formatEta(45), '45s');
      assert.equal(formatEta(59), '59s');
    });

    it('formats minutes and seconds correctly', () => {
      assert.equal(formatEta(60), '1m');
      assert.equal(formatEta(75), '1m 15s');
      assert.equal(formatEta(185), '3m 5s');
    });

    it('formats hours and minutes correctly', () => {
      assert.equal(formatEta(3600), '1h 0m');
      assert.equal(formatEta(3660), '1h 1m');
      assert.equal(formatEta(7300), '2h 1m');
    });
  });

  describe('createBatchItem', () => {
    it('creates a lightweight descriptor without memory leaks', () => {
      const mockFile = {
        name: 'test_product_1000.jpg',
        size: 2450000,
        type: 'image/jpeg'
      };

      const item = createBatchItem(mockFile, 42);

      assert.ok(item.id.startsWith('batch_'));
      assert.equal(item.name, 'test_product_1000.jpg');
      assert.equal(item.size, 2450000);
      assert.equal(item.type, 'image/jpeg');
      assert.equal(item.status, 'pending');
      assert.equal(item.progress, 0);
      assert.equal(item.resultBlob, null);
      assert.equal(item.resultUrl, null);
    });

    it('can scale to 2,000 items instantly without lag', () => {
      const startTime = performance.now();
      const items = [];
      for (let i = 0; i < 2000; i++) {
        items.push(
          createBatchItem(
            { name: `bulk_img_${i}.png`, size: 1024 * 1024, type: 'image/png' },
            i
          )
        );
      }
      const duration = performance.now() - startTime;

      assert.equal(items.length, 2000);
      // Creating 2000 item descriptors must take less than 50 milliseconds
      assert.ok(duration < 50, `Expected duration < 50ms, got ${duration}ms`);
    });
  });
});
