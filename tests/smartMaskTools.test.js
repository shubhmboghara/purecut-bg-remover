import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMagicWand,
  applyLassoCut,
  applyEdgeChoke,
  applyPurgeFloorShadows,
  applyCleanStrayIslands,
  applyAlphaThreshold,
  applyInvertMask
} from '../src/services/smartMaskTools.js';

// Lightweight Canvas & ImageData Mock for headless Node.js testing
function createMockCanvas(width, height, initialAlpha = 255, initialColor = [255, 255, 255]) {
  const pixelCount = width * height;
  const data = new Uint8ClampedArray(pixelCount * 4);
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    data[idx] = initialColor[0];
    data[idx + 1] = initialColor[1];
    data[idx + 2] = initialColor[2];
    data[idx + 3] = initialAlpha;
  }

  const imgData = { data, width, height };

  const context = {
    getImageData: () => ({ data: new Uint8ClampedArray(data), width, height }),
    putImageData: (newData) => {
      data.set(newData.data);
    },
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {
      // Mock simple polygon fill for lasso
      for (let i = 0; i < pixelCount; i++) {
        data[i * 4 + 3] = 0;
      }
    }
  };

  return {
    width,
    height,
    getContext: () => context,
    _data: data
  };
}

describe('Smart Mask Tools & Background Eraser Suite', () => {
  describe('applyMagicWand', () => {
    it('clears contiguous matching pixels from click coordinates', () => {
      const canvas = createMockCanvas(10, 10, 255, [255, 255, 255]); // All white
      // Set a non-matching wall in the center column
      for (let y = 0; y < 10; y++) {
        const idx = (y * 10 + 5) * 4;
        canvas._data[idx] = 0; // Black barrier
        canvas._data[idx + 1] = 0;
        canvas._data[idx + 2] = 0;
      }

      // Click on left side (x=2, y=2)
      const res = applyMagicWand(canvas, null, 2, 2, { tolerance: 30, contiguous: true });
      assert.equal(res, true);

      // Left side should be erased (alpha = 0)
      assert.equal(canvas._data[(2 * 10 + 2) * 4 + 3], 0);
      assert.equal(canvas._data[(0 * 10 + 0) * 4 + 3], 0);

      // Barrier should still be preserved
      assert.equal(canvas._data[(5 * 10 + 5) * 4 + 3], 255);

      // Right side across the barrier should NOT be touched
      assert.equal(canvas._data[(2 * 10 + 8) * 4 + 3], 255);
    });

    it('erases globally across the entire canvas when contiguous is false', () => {
      const canvas = createMockCanvas(10, 10, 255, [255, 0, 0]); // All Red
      // Put green in 4 corners
      const corners = [0, 9, 90, 99];
      corners.forEach(p => {
        canvas._data[p * 4] = 0;
        canvas._data[p * 4 + 1] = 255;
      });

      // Global click on green
      applyMagicWand(canvas, null, 0, 0, { tolerance: 30, contiguous: false });

      // All 4 green corners should now have alpha 0
      corners.forEach(p => {
        assert.equal(canvas._data[p * 4 + 3], 0);
      });

      // Center red should remain intact
      assert.equal(canvas._data[(5 * 10 + 5) * 4 + 3], 255);
    });
  });

  describe('applyEdgeChoke', () => {
    it('contracts (erodes) the border transparency inwards', () => {
      const canvas = createMockCanvas(8, 8, 0, [0, 0, 0]);
      // Draw a 4x4 solid square in center
      for (let y = 2; y <= 5; y++) {
        for (let x = 2; x <= 5; x++) {
          canvas._data[(y * 8 + x) * 4 + 3] = 255;
        }
      }

      // Initial center is solid
      assert.equal(canvas._data[(3 * 8 + 3) * 4 + 3], 255);

      // Apply 1px choke
      const res = applyEdgeChoke(canvas, 1, 0);
      assert.equal(res, true);

      // Outer border of square (e.g. 2, 2) should now be 0 or choked
      assert.equal(canvas._data[(2 * 8 + 2) * 4 + 3], 0);
    });
  });

  describe('applyCleanStrayIslands', () => {
    it('removes tiny floating background islands outside the main subject', () => {
      const canvas = createMockCanvas(20, 20, 0, [255, 255, 255]);

      // Main subject: 8x8 block (64 pixels)
      for (let y = 6; y < 14; y++) {
        for (let x = 6; x < 14; x++) {
          canvas._data[(y * 20 + x) * 4 + 3] = 255;
        }
      }

      // Tiny stray island: 1 pixel at corner (0, 0)
      canvas._data[0 * 4 + 3] = 255;
      // Another tiny island: 2 pixels at (19, 19)
      canvas._data[(19 * 20 + 19) * 4 + 3] = 255;

      const res = applyCleanStrayIslands(canvas, 0.05);
      assert.equal(res, true);

      // Main subject preserved
      assert.equal(canvas._data[(10 * 20 + 10) * 4 + 3], 255);

      // Floating islands cleaned
      assert.equal(canvas._data[0 * 4 + 3], 0);
      assert.equal(canvas._data[(19 * 20 + 19) * 4 + 3], 0);
    });
  });

  describe('applyAlphaThreshold', () => {
    it('adjusts mask transparency based on neural confidence threshold', () => {
      const baseCanvas = createMockCanvas(10, 1, 100, [100, 100, 100]);
      // Gradual alpha gradient from 20 to 200
      for (let x = 0; x < 10; x++) {
        baseCanvas._data[x * 4 + 3] = 20 + x * 20;
      }

      const targetCanvas = createMockCanvas(10, 1, 0, [100, 100, 100]);

      // Low threshold (preserves low alpha)
      applyAlphaThreshold(targetCanvas, baseCanvas, 20, 1);
      // High alpha pixels remain
      assert.ok(targetCanvas._data[8 * 4 + 3] > 0);

      // High threshold (aggressively cuts out faint residue)
      applyAlphaThreshold(targetCanvas, baseCanvas, 90, 1);
      // Pixel with alpha 40 should be cut to 0
      assert.equal(targetCanvas._data[1 * 4 + 3], 0);
    });
  });

  describe('applyPurgeFloorShadows', () => {
    it('detects dark contact shadow pixels in the lower zone and attenuates them', () => {
      const canvas = createMockCanvas(20, 20, 255, [150, 150, 150]); // Medium subject

      // Set bottom 3 rows as dark road shadow (luminance < 40, low saturation)
      for (let y = 17; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          const idx = (y * 20 + x) * 4;
          canvas._data[idx] = 25; // Dark R
          canvas._data[idx + 1] = 25; // Dark G
          canvas._data[idx + 2] = 25; // Dark B
          canvas._data[idx + 3] = 240; // High alpha
        }
      }

      const res = applyPurgeFloorShadows(canvas, null, 70);
      assert.equal(res, true);

      // Bottom shadow row should be significantly attenuated / cleared
      const bottomAlpha = canvas._data[(19 * 20 + 10) * 4 + 3];
      assert.ok(bottomAlpha < 50, `Expected bottom shadow alpha to be attenuated, got ${bottomAlpha}`);

      // Top subject should remain intact
      assert.equal(canvas._data[(5 * 20 + 10) * 4 + 3], 255);
    });
  });
});
