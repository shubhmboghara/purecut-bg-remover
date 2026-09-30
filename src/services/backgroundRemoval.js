/**
 * AI Background Removal Service & Dual-Engine Pipeline
 * 
 * Powered by the exact same neural network architecture families as Remove.bg:
 * - Engine 1: In-Browser Neural AI (IS-Net / U-2-Net family via ONNX WebAssembly & WebGPU)
 * - Engine 2: Official Remove.bg Cloud REST API (Direct parity with remove.bg)
 * - Engine 3: Edge-Adaptive Multi-Modal Boundary Matting (Offline / Low-resource fallback)
 * - Post-Processor: Remove.bg-grade Color Decontamination & Edge Defringing
 */

import { getAiConfig } from './aiConfig.js';
import { applyCleanStrayIslands, applyPurgeFloorShadows, applyColorDespill } from './smartMaskTools.js';

/**
 * Returns raw transparent PNG Blob (used by batch queue & export)
 */
export async function removeBackgroundAIBlob(imageInput, onProgress) {
  const { blob: inputBlob, img: loadedImg } = await normalizeInputImage(imageInput);
  const config = getAiConfig();

  const postProcessOpts = {
    autoCleanIslands: config.autoCleanIslands,
    // Automatic floor shadow purging is kept for manual Retouch panel trigger
    // so dark trousers, shoes, and black clothing are 100% protected
    autoCleanShadows: false,
    originalImg: loadedImg
  };

  // Tier 0: Official Remove.bg Cloud API (if configured by user)
  if (config.engine === 'removebg' && config.removeBgApiKey) {
    try {
      if (onProgress) onProgress('Connecting to Remove.bg Cloud GPU Cluster...', 20);
      const removeBgResult = await runRemoveBgApiBlob(inputBlob, config.removeBgApiKey, onProgress);
      
      // Apply optional post-processing color decontamination
      if (config.edgeDecontaminate) {
        if (onProgress) onProgress('Applying Color Decontamination & Edge Smoothing...', 90);
        return await applyColorDecontaminationBlob(removeBgResult, config.edgeFeather, postProcessOpts);
      }
      return removeBgResult;
    } catch (apiErr) {
      console.warn('Remove.bg Cloud API encountered an issue, falling back to In-Browser Neural AI:', apiErr);
      if (onProgress) onProgress('Remove.bg API failed, switching to local neural network...', 30);
    }
  }

  // Tier 1: In-Browser Neural Network via @imgly/background-removal (IS-Net / U-2-Net architecture)
  try {
    const tier = config.quality === 'small' ? 'small' : 'medium';
    if (onProgress) onProgress(`Loading ${tier === 'medium' ? 'HD' : 'Fast'} Neural Network Weights...`, 20);
    
    let resultBlob = await runImglyRemovalBlob(inputBlob, tier, onProgress);

    // Apply Remove.bg-style Color Decontamination
    if (config.edgeDecontaminate) {
      if (onProgress) onProgress('Applying Edge Defringing & Color Spill Removal...', 92);
      resultBlob = await applyColorDecontaminationBlob(resultBlob, config.edgeFeather, postProcessOpts);
    }

    return resultBlob;
  } catch (tier1Err) {
    console.warn('Tier 1 AI removal encountered an issue, trying Tier 2 lightweight model:', tier1Err);

    // Tier 2: Quantized Small Model
    try {
      if (onProgress) onProgress('Switching to Optimized Quantized Neural Model...', 45);
      let resultBlob = await runImglyRemovalBlob(inputBlob, 'small', onProgress);
      if (config.edgeDecontaminate) {
        resultBlob = await applyColorDecontaminationBlob(resultBlob, config.edgeFeather, postProcessOpts);
      }
      return resultBlob;
    } catch (tier2Err) {
      console.warn('Tier 2 AI removal encountered an issue, running Edge-Adaptive Matting Engine:', tier2Err);

      // Tier 3: Local Saliency & Border-Gradient Matting Engine
      if (onProgress) onProgress('Running Edge-Adaptive Matting Engine...', 70);
      return runAdvancedEdgeAdaptiveMattingBlob(loadedImg, onProgress);
    }
  }
}

/**
 * Returns HTMLImageElement (used by single studio editor)
 */
export async function removeBackgroundAI(imageInput, onProgress) {
  const blob = await removeBackgroundAIBlob(imageInput, onProgress);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to create cutout Image element'));
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Direct Integration with Official Remove.bg REST API
 * POST https://api.remove.bg/v1.0/removebg
 */
export async function runRemoveBgApiBlob(blob, apiKey, onProgress) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Remove.bg API Key is required. Please add your key in AI Engine settings.');
  }

  if (onProgress) onProgress('Uploading image to Remove.bg Cloud Servers...', 30);

  const formData = new FormData();
  formData.append('image_file', blob, 'image.png');
  formData.append('size', 'auto');
  formData.append('format', 'png');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey.trim()
    },
    body: formData
  });

  if (!response.ok) {
    let errorDetail = `Status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && Array.isArray(errJson.errors) && errJson.errors.length > 0) {
        errorDetail = errJson.errors.map((e) => e.title || e.detail).join('; ');
      }
    } catch {
      // Non-JSON response
    }
    throw new Error(`Remove.bg Error: ${errorDetail}`);
  }

  if (onProgress) onProgress('Downloading HD Cutout from Remove.bg...', 80);
  const resultBlob = await response.blob();
  return resultBlob;
}

/**
 * Executes @imgly/background-removal with custom configurations
 * Uses IS-Net (Intermediate Supervision Network) running on ONNX WebAssembly & WebGPU
 */
async function runImglyRemovalBlob(blob, modelTier = 'medium', onProgress) {
  console.log('[BG DEBUG] Starting runImglyRemovalBlob with tier:', modelTier);
  const { removeBackground } = await import('@imgly/background-removal');
  console.log('[BG DEBUG] Successfully imported removeBackground from @imgly/background-removal');

  const cdnPublicPath = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';
  const localPublicPath = (typeof window !== 'undefined' && window.location)
    ? `${window.location.origin}/imgly/`
    : cdnPublicPath;

  // For 'small', use localPublicPath (isnet_quint8 is bundled locally for instant 0ms startup)
  // For 'medium' (Studio HD FP16), staticimgly.com CDN delivers weights with zero CORS restrictions
  const chosenPublicPath = (modelTier === 'small') ? localPublicPath : cdnPublicPath;

  const config = {
    model: modelTier,
    publicPath: chosenPublicPath,
    output: {
      format: 'image/png',
      quality: 1.0
    },
    progress: (key, current, total) => {
      console.log('[IMGLY PROGRESS RAW]', key, current, total);
      if (onProgress) {
        const pct = total > 0 ? Math.min(95, Math.round((current / total) * 100)) : 50;
        const stageLabel = key.includes('fetch') 
          ? 'Downloading Neural Weights' 
          : key.includes('compute') 
          ? 'Solving Alpha Matting Equation' 
          : 'Segmenting Foreground';
        onProgress(`${stageLabel} (${pct}%)...`, pct);
      }
    }
  };

  let outputBlob;
  try {
    outputBlob = await removeBackground(blob, config);
  } catch (err) {
    if (modelTier !== 'small') {
      console.warn(`[BG AI] Model tier '${modelTier}' encountered issue (${err.message}), falling back to local IS-Net quantized model.`);
      if (onProgress) onProgress('Loading local neural weights...', 35);
      const fallbackConfig = {
        ...config,
        model: 'small',
        publicPath: localPublicPath
      };
      outputBlob = await removeBackground(blob, fallbackConfig);
    } else {
      throw err;
    }
  }

  if (onProgress) onProgress('Finalizing HD cutout...', 98);
  return outputBlob;
}

/**
 * Remove.bg-Style Color Decontamination & Edge Defringing
 * Neutralizes background color spill on semi-transparent edge pixels and hair strands.
 */
export async function applyColorDecontaminationBlob(inputBlob, featherRadius = 1, options = {}) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(inputBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        decontaminateEdgePixels(ctx, w, h, featherRadius);

        // Auto clean floating artifacts if enabled
        if (options.autoCleanIslands) {
          applyCleanStrayIslands(canvas, 0.012);
        }

        // Auto suppress floor shadows if enabled and original image available
        if (options.autoCleanShadows && options.originalImg) {
          applyPurgeFloorShadows(canvas, options.originalImg, 55);
        }

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob || inputBlob);
        }, 'image/png');
      } catch (err) {
        console.warn('Color decontamination bypassed:', err);
        URL.revokeObjectURL(url);
        resolve(inputBlob);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(inputBlob);
    };

    img.src = url;
  });
}

/**
 * Pixel-level Color Decontamination & Alpha Smoothing
 */
export function decontaminateEdgePixels(ctx, w, h, featherRadius = 1) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 0. Sub-threshold alpha clamp & Hermite contrast enhancement
  // Eliminates background noise floor (alpha <= 32) and solidifies subject (alpha >= 225)
  for (let i = 0; i < w * h; i++) {
    const aIdx = i * 4 + 3;
    const a = data[aIdx];
    if (a <= 32) {
      data[aIdx] = 0;
    } else if (a >= 225) {
      data[aIdx] = 255;
    } else {
      // Smoothstep curve for pristine hair strands and soft edges
      const t = (a - 32) / (225 - 32);
      data[aIdx] = Math.round(255 * (t * t * (3 - 2 * t)));
    }
  }

  // 1. First pass: Detect transition boundary pixels (alpha between 10 and 240)
  // and neutralize background color contamination using adjacent solid foreground
  const windowRadius = 2;

  for (let y = windowRadius; y < h - windowRadius; y++) {
    for (let x = windowRadius; x < w - windowRadius; x++) {
      const idx = (y * w + x) * 4;
      const alpha = data[idx + 3];

      // Edge transition pixel
      if (alpha > 15 && alpha < 240) {
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let solidCount = 0;

        // Sample neighboring pixels in a 5x5 window
        for (let dy = -windowRadius; dy <= windowRadius; dy++) {
          for (let dx = -windowRadius; dx <= windowRadius; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * w + (x + dx)) * 4;
            if (data[nIdx + 3] >= 245) {
              sumR += data[nIdx];
              sumG += data[nIdx + 1];
              sumB += data[nIdx + 2];
              solidCount++;
            }
          }
        }

        if (solidCount > 0) {
          const avgR = sumR / solidCount;
          const avgG = sumG / solidCount;
          const avgB = sumB / solidCount;

          // Blend factor: higher blend for lower alpha (where background spill is highest)
          const spillWeight = (255 - alpha) / 255 * 0.75;
          data[idx] = Math.round(data[idx] * (1 - spillWeight) + avgR * spillWeight);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - spillWeight) + avgG * spillWeight);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - spillWeight) + avgB * spillWeight);
        }
      }
    }
  }

  // 2. Second pass: Gentle edge feathering if requested
  if (featherRadius > 0) {
    const copyAlpha = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      copyAlpha[i] = data[i * 4 + 3];
    }

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const curA = copyAlpha[i];
        if (curA > 5 && curA < 250) {
          // 4-neighborhood box smoothing
          const avgA = (
            copyAlpha[i] * 2 +
            copyAlpha[i - 1] +
            copyAlpha[i + 1] +
            copyAlpha[i - w] +
            copyAlpha[i + w]
          ) / 6;
          data[i * 4 + 3] = Math.round(avgA);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Normalizes input (DataURL, ObjectURL, Remote URL, File, or Blob) into a safe Blob and Image
 */
async function normalizeInputImage(input) {
  if (input instanceof Blob) {
    const url = URL.createObjectURL(input);
    const img = await loadImageElement(url);
    return { blob: input, img };
  }

  if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      const blob = dataURItoBlob(input);
      const url = URL.createObjectURL(blob);
      const img = await loadImageElement(url);
      return { blob, img };
    }

    try {
      const res = await fetch(input, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const img = await loadImageElement(url);
      return { blob, img };
    } catch {
      // Direct element load if fetch blocked
      const img = await loadImageElement(input);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      return { blob, img };
    }
  }

  throw new Error('Unsupported image input format');
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isExternal = typeof src === 'string' &&
      (src.startsWith('http://') || src.startsWith('https://')) &&
      typeof window !== 'undefined' && !src.includes(window.location.host);
    if (isExternal) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (img.crossOrigin) {
        const retry = new Image();
        retry.onload = () => resolve(retry);
        retry.onerror = () => reject(new Error('Failed to load image element'));
        retry.src = src;
        return;
      }
      reject(new Error('Failed to load image element'));
    };
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      resolve(img);
    }
  });
}

function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Tier 3: Advanced Edge-Adaptive Boundary Matting Engine
 * Returns raw Blob
 */
async function runAdvancedEdgeAdaptiveMattingBlob(img, onProgress) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // 1. Gather reference background colors from the 4 outer image borders
      const bgClusters = [];
      const stepX = Math.max(1, Math.floor(w / 40));
      const stepY = Math.max(1, Math.floor(h / 40));

      for (let x = 0; x < w; x += stepX) {
        addClusterSample(bgClusters, getPixel(data, w, x, 0));
        addClusterSample(bgClusters, getPixel(data, w, x, h - 1));
      }

      for (let y = 0; y < h; y += stepY) {
        addClusterSample(bgClusters, getPixel(data, w, 0, y));
        addClusterSample(bgClusters, getPixel(data, w, w - 1, y));
      }

      if (onProgress) onProgress('Tracing foreground contours...', 85);

      // 2. Border-connected Region Growing (BFS flood fill from outer edges)
      // Only pixels contiguous to the image boundaries that match background color are cleared.
      // The interior of the subject is completely protected.
      const isBg = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;

      function colorDistToBg(r, g, b) {
        let minDist = 999;
        for (let k = 0; k < bgClusters.length; k++) {
          const c = bgClusters[k];
          const d = Math.sqrt((r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2);
          if (d < minDist) minDist = d;
        }
        return minDist;
      }

      // Seed all 4 outer borders
      const borderTolerance = 45;
      for (let x = 0; x < w; x++) {
        const topIdx = x;
        if (!isBg[topIdx]) {
          const r = data[topIdx * 4], g = data[topIdx * 4 + 1], b = data[topIdx * 4 + 2];
          if (colorDistToBg(r, g, b) < borderTolerance) {
            isBg[topIdx] = 1;
            queue[tail++] = topIdx;
          }
        }
        const btmIdx = (h - 1) * w + x;
        if (!isBg[btmIdx]) {
          const r = data[btmIdx * 4], g = data[btmIdx * 4 + 1], b = data[btmIdx * 4 + 2];
          if (colorDistToBg(r, g, b) < borderTolerance) {
            isBg[btmIdx] = 1;
            queue[tail++] = btmIdx;
          }
        }
      }

      for (let y = 0; y < h; y++) {
        const leftIdx = y * w;
        if (!isBg[leftIdx]) {
          const r = data[leftIdx * 4], g = data[leftIdx * 4 + 1], b = data[leftIdx * 4 + 2];
          if (colorDistToBg(r, g, b) < borderTolerance) {
            isBg[leftIdx] = 1;
            queue[tail++] = leftIdx;
          }
        }
        const rightIdx = y * w + (w - 1);
        if (!isBg[rightIdx]) {
          const r = data[rightIdx * 4], g = data[rightIdx * 4 + 1], b = data[rightIdx * 4 + 2];
          if (colorDistToBg(r, g, b) < borderTolerance) {
            isBg[rightIdx] = 1;
            queue[tail++] = rightIdx;
          }
        }
      }

      // BFS flood fill inwards
      const floodTolerance = 36;
      while (head < tail) {
        const cur = queue[head++];
        const cx = cur % w;
        const cy = (cur / w) | 0;

        const curR = data[cur * 4];
        const curG = data[cur * 4 + 1];
        const curB = data[cur * 4 + 2];

        const neighbors = [
          cx > 0 ? cur - 1 : -1,
          cx < w - 1 ? cur + 1 : -1,
          cy > 0 ? cur - w : -1,
          cy < h - 1 ? cur + w : -1
        ];

        for (let i = 0; i < 4; i++) {
          const n = neighbors[i];
          if (n !== -1 && !isBg[n]) {
            const nr = data[n * 4];
            const ng = data[n * 4 + 1];
            const nb = data[n * 4 + 2];

            const localDelta = Math.sqrt((curR - nr) ** 2 + (curG - ng) ** 2 + (curB - nb) ** 2);
            const bgDelta = colorDistToBg(nr, ng, nb);

            if (localDelta < 28 && bgDelta < floodTolerance) {
              isBg[n] = 1;
              queue[tail++] = n;
            }
          }
        }
      }

      // Clear only outer background pixels; interior pixels remain 100% solid
      for (let i = 0; i < w * h; i++) {
        if (isBg[i]) {
          data[i * 4 + 3] = 0;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      if (onProgress) onProgress('Finalizing cutout...', 100);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

function addClusterSample(clusters, px) {
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    const dist = Math.sqrt((px.r - c.r) ** 2 + (px.g - c.g) ** 2 + (px.b - c.b) ** 2);
    if (dist < 18) {
      c.r = (c.r + px.r) / 2;
      c.g = (c.g + px.g) / 2;
      c.b = (c.b + px.b) / 2;
      c.count++;
      return;
    }
  }
  if (clusters.length < 12) {
    clusters.push({ r: px.r, g: px.g, b: px.b, count: 1 });
  }
}

function getPixel(data, width, x, y) {
  const idx = (y * width + x) * 4;
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
}
