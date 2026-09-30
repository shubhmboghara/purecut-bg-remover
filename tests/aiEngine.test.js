import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAiConfig, saveAiConfig, DEFAULT_AI_CONFIG } from '../src/services/aiConfig.js';
import { runRemoveBgApiBlob, decontaminateEdgePixels } from '../src/services/backgroundRemoval.js';

describe('AI Configuration & Persistence Engine', () => {
  it('returns default configuration safely when localStorage is empty', () => {
    const config = getAiConfig();
    assert.equal(typeof config, 'object');
    assert.equal(config.engine, 'local');
    assert.equal(DEFAULT_AI_CONFIG.quality, 'medium', 'Default precision must be HD Full Precision (medium)');
    assert.equal(config.quality, 'medium', 'getAiConfig must return medium by default');
    assert.equal(config.edgeDecontaminate, true);
    assert.equal(config.edgeFeather, 1);
  });

  it('updates configuration and preserves keys, allowing users to toggle quality', () => {
    const updated = saveAiConfig({ engine: 'removebg', removeBgApiKey: 'test_key_123' });
    assert.equal(updated.engine, 'removebg');
    assert.equal(updated.removeBgApiKey, 'test_key_123');
    // Default properties should remain intact
    assert.equal(updated.quality, 'medium');
    assert.equal(updated.edgeDecontaminate, true);

    // User can switch quality to small if desired
    const switchedToSmall = saveAiConfig({ quality: 'small' });
    assert.equal(switchedToSmall.quality, 'small');

    // User can switch back to medium
    const switchedToMedium = saveAiConfig({ quality: 'medium' });
    assert.equal(switchedToMedium.quality, 'medium');

    // Reset back
    saveAiConfig({ engine: 'local', removeBgApiKey: '', quality: 'medium' });
  });
});

describe('Remove.bg Official Cloud API Service', () => {
  it('rejects immediately when API key is missing or empty', async () => {
    await assert.rejects(
      async () => {
        await runRemoveBgApiBlob(new Blob(['fake']), '', null);
      },
      /API Key is required/i
    );

    await assert.rejects(
      async () => {
        await runRemoveBgApiBlob(new Blob(['fake']), '   ', null);
      },
      /API Key is required/i
    );
  });
});

describe('Remove.bg-Style Color Decontamination & Anti-Spill Algorithm', () => {
  it('decontaminates boundary edge pixels without throwing', () => {
    const width = 6;
    const height = 6;
    const buffer = new Uint8ClampedArray(width * height * 4);

    // Fill with sample data:
    // Left half: opaque red foreground (255, 0, 0, 255)
    // Middle column: semi-transparent green edge (0, 255, 0, 100) (simulating background spill)
    // Right half: transparent background (0, 0, 0, 0)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (x < 2) {
          buffer[idx] = 255;
          buffer[idx + 1] = 0;
          buffer[idx + 2] = 0;
          buffer[idx + 3] = 255; // solid foreground
        } else if (x === 2) {
          buffer[idx] = 0;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 0;
          buffer[idx + 3] = 100; // semi-transparent edge with green spill
        } else {
          buffer[idx] = 0;
          buffer[idx + 1] = 0;
          buffer[idx + 2] = 0;
          buffer[idx + 3] = 0; // background
        }
      }
    }

    const mockImageData = { data: buffer, width, height };
    const mockCtx = {
      getImageData: () => mockImageData,
      putImageData: (d) => {
        // verify modified
      }
    };

    // Execute edge decontamination
    assert.doesNotThrow(() => {
      decontaminateEdgePixels(mockCtx, width, height, 1);
    });

    // Verify that the green spill at (2, 2) has been blended with solid red foreground
    const edgeIdx = (2 * width + 2) * 4;
    // Red channel should increase towards foreground (originally 0)
    assert.ok(buffer[edgeIdx] > 0, 'Red foreground should bleed into boundary to neutralize spill');
  });
});
