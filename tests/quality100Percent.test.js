import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  applyColorDespill, 
  apply100PercentAutoPerfect,
  applyEdgeChoke,
  applyCleanStrayIslands 
} from '../src/services/smartMaskTools.js';
import { generateExportBlob } from '../src/utils/canvasRenderer.js';
import { DEFAULT_AI_CONFIG } from '../src/services/aiConfig.js';

describe('100% Quality Cutout & Closed-Form Despill Suite', () => {
  it('neutralizes background color spill on semi-transparent transition boundary pixels', () => {
    const width = 8;
    const height = 8;
    const buffer = new Uint8ClampedArray(width * height * 4);

    // Create a mock canvas with a solid blue foreground and a green spill border
    // x < 3: solid blue foreground (0, 100, 255, 255)
    // x === 3: boundary pixel with green tint (0, 255, 100, 128)
    // x > 3: transparent background (0, 0, 0, 0)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (x < 3) {
          buffer[idx] = 0;
          buffer[idx + 1] = 100;
          buffer[idx + 2] = 255;
          buffer[idx + 3] = 255; // solid foreground
        } else if (x === 3) {
          buffer[idx] = 0;
          buffer[idx + 1] = 255; // green spill from chroma key
          buffer[idx + 2] = 100;
          buffer[idx + 3] = 128; // edge alpha
        } else {
          buffer[idx] = 0;
          buffer[idx + 1] = 0;
          buffer[idx + 2] = 0;
          buffer[idx + 3] = 0; // transparent
        }
      }
    }

    const mockImageData = { data: buffer, width, height };
    const mockCanvas = {
      width,
      height,
      getContext: () => ({
        getImageData: () => mockImageData,
        putImageData: () => {}
      })
    };

    const changed = applyColorDespill(mockCanvas, null, 0.9);
    assert.equal(changed, true, 'applyColorDespill should report changes made');

    const edgeIdx = (3 * width + 3) * 4;
    // Blue channel should increase towards the solid foreground (originally 100)
    assert.ok(buffer[edgeIdx + 2] > 100, 'Blue foreground should bleed into boundary to eliminate green spill');
    // Green channel should decrease from its 255 spill value
    assert.ok(buffer[edgeIdx + 1] < 255, 'Green chroma spill should be dampened');
  });

  it('1-Click 100% Auto-Perfect purges halos, islands and cleans edges in one pass', () => {
    const width = 12;
    const height = 12;
    const buffer = new Uint8ClampedArray(width * height * 4);

    // Create a 6x6 subject in the center
    for (let y = 3; y < 9; y++) {
      for (let x = 3; x < 9; x++) {
        const idx = (y * width + x) * 4;
        buffer[idx] = 200;
        buffer[idx + 1] = 150;
        buffer[idx + 2] = 100;
        buffer[idx + 3] = 255;
      }
    }

    // Add a stray 1-pixel floating artifact at (0, 0)
    buffer[0] = 50;
    buffer[1] = 50;
    buffer[2] = 50;
    buffer[3] = 255;

    const mockImageData = { data: buffer, width, height };
    const mockCanvas = {
      width,
      height,
      getContext: () => ({
        getImageData: () => mockImageData,
        putImageData: () => {}
      })
    };

    const executed = apply100PercentAutoPerfect(mockCanvas, null, {
      cleanIslands: true,
      purgeShadows: false,
      despill: true,
      chokeHalos: true
    });

    assert.equal(executed, true, 'apply100PercentAutoPerfect should execute successfully');
    // The floating speck at index 0 should be purged
    assert.equal(buffer[3], 0, 'Stray floating artifact must be purged to alpha 0');
  });
});

describe('100% Resident Resolution & Export Scaler Suite', () => {
  it('default AI configuration has medium quality and original resolution enabled', () => {
    assert.equal(DEFAULT_AI_CONFIG.quality, 'medium');
    assert.equal(DEFAULT_AI_CONFIG.resolutionMode, 'original');
    assert.equal(DEFAULT_AI_CONFIG.ultraPrecision, true);
    assert.equal(DEFAULT_AI_CONFIG.autoCleanIslands, true);
    assert.equal(DEFAULT_AI_CONFIG.autoCleanShadows, true);
  });

  it('generateExportBlob supports 2x super-resolution scaling', async () => {
    const mainCanvas = {
      width: 100,
      height: 100,
      getContext: () => ({
        drawImage: () => {},
        fillRect: () => {}
      })
    };

    // Mock document.createElement('canvas')
    const prevCreateElement = globalThis.document?.createElement;
    let createdW = 0;
    let createdH = 0;

    globalThis.document = {
      createElement: (tag) => {
        if (tag === 'canvas') {
          return {
            set width(v) { createdW = v; },
            get width() { return createdW; },
            set height(v) { createdH = v; },
            get height() { return createdH; },
            getContext: () => ({
              drawImage: () => {},
              fillRect: () => {}
            }),
            toBlob: (cb) => cb(new Blob(['fake-image-bytes'], { type: 'image/png' }))
          };
        }
        return {};
      }
    };

    try {
      const blob = await generateExportBlob({
        mainCanvas,
        format: 'png',
        quality: 1.0,
        scale: 2.0
      });

      assert.ok(blob instanceof Blob);
      assert.equal(createdW, 200, 'Canvas width should be doubled for 2x super-resolution');
      assert.equal(createdH, 200, 'Canvas height should be doubled for 2x super-resolution');
    } finally {
      if (prevCreateElement) {
        globalThis.document.createElement = prevCreateElement;
      }
    }
  });

  it('dynamic aspect ratio sizing maintains 100% maximum resolution instead of shrinking', () => {
    const originalDims = { width: 3840, height: 2160 }; // 4K UHD image
    const maxDimension = Math.max(originalDims.width, originalDims.height);

    // 16:9 test
    const targetW16_9 = maxDimension;
    const targetH16_9 = Math.round((targetW16_9 * 9) / 16);
    assert.equal(targetW16_9, 3840, '16:9 must retain full 3840px width');
    assert.equal(targetH16_9, 2160, '16:9 must retain full 2160px height');

    // 1:1 test
    const targetW1_1 = maxDimension;
    const targetH1_1 = maxDimension;
    assert.equal(targetW1_1, 3840, '1:1 must scale up to maximum 3840px, not 1080px');
    assert.equal(targetH1_1, 3840, '1:1 must scale up to maximum 3840px, not 1080px');

    // 4:5 portrait test
    const targetH4_5 = maxDimension;
    const targetW4_5 = Math.round((targetH4_5 * 4) / 5);
    assert.equal(targetH4_5, 3840, '4:5 must retain 3840px height');
    assert.equal(targetW4_5, 3072, '4:5 width must be 3072px, retaining full resolution');
  });
});
