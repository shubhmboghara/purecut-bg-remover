import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { exportBatchAsZip } from '../src/utils/zipExporter.js';

describe('Zip Exporter', () => {
  it('throws an error if no completed items are present', async () => {
    const items = [
      { status: 'pending', name: 'img1.png' },
      { status: 'error', name: 'img2.png' }
    ];

    await assert.rejects(
      async () => {
        await exportBatchAsZip(items);
      },
      {
        message: 'No completed images to export.'
      }
    );
  });

  it('packages completed items with custom format suffix', async () => {
    const mockBlob = new Blob(['mock-image-bytes'], { type: 'image/png' });
    const items = [
      {
        id: '1',
        name: 'shoe_model_1.png',
        status: 'completed',
        resultBlob: mockBlob
      },
      {
        id: '2',
        name: 'shoe_model_2.jpg',
        status: 'completed',
        resultBlob: mockBlob
      }
    ];

    let progressCalled = false;
    const zipBlob = await exportBatchAsZip(
      items,
      { format: 'png', suffix: '_cutout' },
      (pct) => {
        progressCalled = true;
      }
    );

    assert.ok(zipBlob instanceof Blob);
    assert.ok(zipBlob.size > 0);
    assert.equal(progressCalled, true);
  });
});
