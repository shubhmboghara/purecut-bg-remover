import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  decontaminateEdgePixels, 
  getLocalImglyPath 
} from '../src/services/backgroundRemoval.js';
import { 
  applyPurgeFloorShadows, 
  applyCleanStrayIslands 
} from '../src/services/smartMaskTools.js';

describe('100% Photo Cutout Quality & Artifact Prevention Suite', () => {
  it('preserves fine hair strands, fur tips, and semi-transparent boundary details', () => {
    const width = 4;
    const height = 4;
    const buffer = new Uint8ClampedArray(width * height * 4);

    // Set up a pixel with alpha 28 (which in old algorithm was wiped out to 0 because <= 32)
    // (1, 1) has alpha 28 (fine hair wisp)
    const hairIdx = (1 * width + 1) * 4;
    buffer[hairIdx] = 120;
    buffer[hairIdx + 1] = 80;
    buffer[hairIdx + 2] = 50;
    buffer[hairIdx + 3] = 28;

    // Solid foreground at (0, 1)
    const solidIdx = (1 * width + 0) * 4;
    buffer[solidIdx] = 130;
    buffer[solidIdx + 1] = 85;
    buffer[solidIdx + 2] = 55;
    buffer[solidIdx + 3] = 255;

    const mockCtx = {
      getImageData: () => ({ data: buffer, width, height }),
      putImageData: () => {}
    };

    decontaminateEdgePixels(mockCtx, width, height, 0);

    // Fine hair strand must NOT be wiped out to 0
    assert.ok(buffer[hairIdx + 3] > 0, `Delicate hair strand alpha must be preserved, got ${buffer[hairIdx + 3]}`);
    assert.ok(buffer[hairIdx + 3] >= 15, `Hair strand alpha should be gently preserved (>= 15), got ${buffer[hairIdx + 3]}`);
  });

  it('strictly protects solid black shoes and trousers from being purged as floor shadows', () => {
    const width = 20;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);

    // Subject spans top to bottom
    // Bottom 3 rows have pitch black shoes (RGB: 10, 10, 10) with SOLID alpha 255
    for (let y = 0; y < height; y++) {
      for (let x = 6; x < 14; x++) {
        const idx = (y * width + x) * 4;
        if (y >= 17) {
          // Black leather shoes at bottom
          data[idx] = 10;
          data[idx + 1] = 10;
          data[idx + 2] = 10;
          data[idx + 3] = 255; // SOLID OPAQUE FOREGROUND
        } else {
          // Torso / legs
          data[idx] = 100;
          data[idx + 1] = 100;
          data[idx + 2] = 100;
          data[idx + 3] = 255;
        }
      }
    }

    const mockCanvas = {
      width,
      height,
      getContext: () => ({
        getImageData: () => ({ data, width, height }),
        putImageData: () => {}
      })
    };

    applyPurgeFloorShadows(mockCanvas, null, 70);

    // Solid black shoes at (18, 10) MUST REMAIN 255 (never erased)
    const shoeIdx = (18 * width + 10) * 4 + 3;
    assert.equal(data[shoeIdx], 255, 'Solid black footwear must be 100% protected and never purged');
  });

  it('protects large detached accessories, props, or footwear while cleaning stray noise specks', () => {
    const width = 40;
    const height = 40;
    const data = new Uint8ClampedArray(width * height * 4);

    // Main subject in center: 20x20 block (400 pixels)
    for (let y = 10; y < 30; y++) {
      for (let x = 10; x < 30; x++) {
        const idx = (y * width + x) * 4;
        data[idx + 3] = 255;
      }
    }

    // Detached prop / accessory / handbag (10x10 block = 100 pixels)
    // In old algorithm with 0.012 ratio on 400px subject, anything < 25 was erased,
    // but on 500,000px subjects anything < 6,000px was erased!
    // With 250px cap, this 100px prop is protected when ratio is safe.
    for (let y = 2; y < 8; y++) {
      for (let x = 2; x < 8; x++) {
        const idx = (y * width + x) * 4;
        data[idx + 3] = 255; // 36 pixels detached object
      }
    }

    // Tiny 1-pixel floating artifact at (39, 39)
    data[(39 * width + 39) * 4 + 3] = 255;

    const mockCanvas = {
      width,
      height,
      getContext: () => ({
        getImageData: () => ({ data, width, height }),
        putImageData: () => {}
      })
    };

    const res = applyCleanStrayIslands(mockCanvas, 0.005);
    assert.equal(res, true);

    // 1-pixel floating artifact MUST be purged
    assert.equal(data[(39 * width + 39) * 4 + 3], 0, '1-pixel artifact must be cleared');

    // 36-pixel detached object MUST be preserved
    assert.equal(data[(4 * width + 4) * 4 + 3], 255, 'Detached object must be preserved');
  });

  it('getLocalImglyPath resolves valid path ending with /imgly/', () => {
    const p = getLocalImglyPath();
    assert.ok(typeof p === 'string');
    assert.ok(p.endsWith('/imgly/'), `Path must end with /imgly/, got: ${p}`);
  });
});
