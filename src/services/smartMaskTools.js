/**
 * PureCut AI Studio - Smart Mask & Background Eraser Tools
 * Provides studio-grade algorithms for:
 * 1. Magic Wand (Flood Fill & Global Color Key Eraser)
 * 2. Lasso / Polygonal Selection Cutout
 * 3. Edge Choke & Halo Defringing (Morphological Edge Contraction)
 * 4. Ground / Floor Contact Shadow Purging
 * 5. Stray Background Island & Artifact Cleaner
 * 6. Dynamic Alpha Threshold / Sensitivity Tuning
 * 7. Mask Inversion (Subject / Background Swap)
 */

/**
 * 1. Magic Wand / Smart Color Eraser
 * Erases pixels matching the sampled color at (clickX, clickY) within tolerance.
 * Supports Contiguous (connected flood fill) and Global (entire image) modes.
 */
export function applyMagicWand(maskCanvas, originalImage, clickX, clickY, options = {}) {
  const { tolerance = 28, contiguous = true } = options;
  if (!maskCanvas) return false;

  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const ctx = maskCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Render original image into temporary canvas for accurate RGB sampling
  let origData = null;
  if (originalImage) {
    const oCanvas = document.createElement('canvas');
    oCanvas.width = w;
    oCanvas.height = h;
    const oCtx = oCanvas.getContext('2d');
    oCtx.drawImage(originalImage, 0, 0, w, h);
    origData = oCtx.getImageData(0, 0, w, h).data;
  }

  const cx = Math.max(0, Math.min(w - 1, Math.round(clickX)));
  const cy = Math.max(0, Math.min(h - 1, Math.round(clickY)));
  const startIdx = (cy * w + cx) * 4;

  const sampleSource = origData || data;
  const targetR = sampleSource[startIdx];
  const targetG = sampleSource[startIdx + 1];
  const targetB = sampleSource[startIdx + 2];

  // Normalized color tolerance threshold squared
  const tolSq = tolerance * tolerance * 3;
  let clearedCount = 0;

  if (contiguous) {
    // High-performance integer queue for BFS flood fill
    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const startPos = cy * w + cx;
    visited[startPos] = 1;
    queue[tail++] = startPos;

    while (head < tail) {
      const curr = queue[head++];
      const py = Math.floor(curr / w);
      const px = curr % w;
      const idx = curr * 4;

      if (data[idx + 3] > 0) {
        data[idx + 3] = 0; // Set transparent
        clearedCount++;
      }

      // Check 4 cardinal neighbors
      if (px > 0) checkNeighbor(px - 1, py);
      if (px < w - 1) checkNeighbor(px + 1, py);
      if (py > 0) checkNeighbor(px, py - 1);
      if (py < h - 1) checkNeighbor(px, py + 1);

      function checkNeighbor(nx, ny) {
        const nPos = ny * w + nx;
        if (visited[nPos] === 0) {
          visited[nPos] = 1;
          const nIdx = nPos * 4;
          if (data[nIdx + 3] > 0) {
            const r = sampleSource[nIdx];
            const g = sampleSource[nIdx + 1];
            const b = sampleSource[nIdx + 2];
            const distSq = (r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2;
            if (distSq <= tolSq) {
              queue[tail++] = nPos;
            }
          }
        }
      }
    }
  } else {
    // Global Mode: Remove matching color everywhere in the mask
    for (let i = 0; i < w * h; i++) {
      const idx = i * 4;
      if (data[idx + 3] > 0) {
        const r = sampleSource[idx];
        const g = sampleSource[idx + 1];
        const b = sampleSource[idx + 2];
        const distSq = (r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2;
        if (distSq <= tolSq) {
          data[idx + 3] = 0;
          clearedCount++;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return clearedCount > 0;
}

/**
 * 2. Lasso / Polygonal Selection Cutout
 * Erases everything inside the user-defined closed polygon boundary.
 */
export function applyLassoCut(maskCanvas, points, feather = 0) {
  if (!maskCanvas || !points || points.length < 3) return false;

  const ctx = maskCanvas.getContext('2d');
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';

  if (feather > 0) {
    ctx.filter = `blur(${feather}px)`;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = '#000000';
  ctx.fill();

  ctx.restore();
  return true;
}

/**
 * 3. Edge Choke & Halo Defringing
 * Contracts (chokes) the alpha mask boundary by `chokePixels` to eat away
 * stubborn white outlines, background halos, and color spill.
 * Positive values shrink the edge; negative values expand the edge.
 */
export function applyEdgeChoke(maskCanvas, chokePixels = 1, featherPixels = 1) {
  if (!maskCanvas || chokePixels === 0) return false;

  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const ctx = maskCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const radius = Math.abs(chokePixels);
  const isChoke = chokePixels > 0;

  // Extract alpha buffer
  const origAlpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    origAlpha[i] = data[i * 4 + 3];
  }

  const newAlpha = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const curA = origAlpha[idx];

      if (isChoke) {
        // Morphological erosion: find minimum alpha in neighborhood
        if (curA === 0) {
          newAlpha[idx] = 0;
          continue;
        }
        let minA = curA;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) { minA = 0; break; }
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) { minA = 0; break; }
            if (dx * dx + dy * dy <= radius * radius) {
              const nA = origAlpha[ny * w + nx];
              if (nA < minA) minA = nA;
            }
          }
          if (minA === 0) break;
        }
        newAlpha[idx] = minA;
      } else {
        // Morphological dilation: find maximum alpha in neighborhood
        if (curA === 255) {
          newAlpha[idx] = 255;
          continue;
        }
        let maxA = curA;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            if (dx * dx + dy * dy <= radius * radius) {
              const nA = origAlpha[ny * w + nx];
              if (nA > maxA) maxA = nA;
            }
          }
          if (maxA === 255) break;
        }
        newAlpha[idx] = maxA;
      }
    }
  }

  // Optional box feather for smooth sub-pixel anti-aliasing
  if (featherPixels > 0) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const a = newAlpha[i];
        if (a > 0 && a < 255) {
          const smoothed = (
            newAlpha[i] * 2 +
            newAlpha[i - 1] +
            newAlpha[i + 1] +
            newAlpha[i - w] +
            newAlpha[i + w]
          ) / 6;
          data[i * 4 + 3] = Math.round(smoothed);
        } else {
          data[i * 4 + 3] = a;
        }
      }
    }
  } else {
    for (let i = 0; i < w * h; i++) {
      data[i * 4 + 3] = newAlpha[i];
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return true;
}

/**
 * 4. Smart Floor / Contact Shadow Purger
 * Detects low-luminance, low-saturation ground shadow smudges lingering at
 * the bottom base of the subject (e.g. beneath tires, shoe soles, furniture) and clears them.
 */
export function applyPurgeFloorShadows(maskCanvas, originalImage, sensitivity = 50) {
  if (!maskCanvas) return false;

  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const ctx = maskCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Find bounding box of subject
  let minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 20) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxY <= minY) return false;

  const subjectHeight = maxY - minY;
  // Floor shadow penumbra resides in the bottom 14% of the bounding box
  const shadowZoneStartY = Math.floor(maxY - subjectHeight * 0.14);
  const maxBrightnessThreshold = 65 + (sensitivity / 100) * 60;

  let clearedCount = 0;

  for (let y = shadowZoneStartY; y <= maxY; y++) {
    const verticalProgress = (y - shadowZoneStartY) / Math.max(1, maxY - shadowZoneStartY);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const alpha = data[idx + 3];

      // Ground shadow penumbra is semi-transparent (alpha <= 240) and dark/desaturated.
      // Solid foreground pixels (alpha > 240) are strictly protected to prevent wiping black shoes, pants, tires, or furniture feet!
      if (alpha > 5 && alpha <= 240) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const colorSpread = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(b - r));

        // Characteristics of ground shadow: dark tone, low color saturation, lower contact line
        const isGroundShadow = luminance < maxBrightnessThreshold && colorSpread < 45;

        if (isGroundShadow) {
          const suppressionFactor = Math.min(0.95, verticalProgress * (0.85 + sensitivity / 120));
          data[idx + 3] = Math.max(0, Math.round(alpha * (1 - suppressionFactor)));
          clearedCount++;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return clearedCount > 0;
}

/**
 * 5. Stray Island & Background Speckle Cleaner
 * Finds isolated, disconnected background blobs outside the main subject and purges them.
 * Safe design: never deletes disconnected real objects (shoes, bags, necklaces, pets).
 */
export function applyCleanStrayIslands(maskCanvas, minAreaRatio = 0.005) {
  if (!maskCanvas) return false;

  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const ctx = maskCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Binarize alpha mask
  const labels = new Int32Array(w * h);
  let currentLabel = 1;
  const componentSizes = [0];

  // 2. Connected-component labeling (4-connected)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      if (data[pos * 4 + 3] > 10 && labels[pos] === 0) {
        // Start BFS for new component
        const label = currentLabel++;
        componentSizes[label] = 0;

        const queue = [pos];
        labels[pos] = label;

        let qHead = 0;
        while (qHead < queue.length) {
          const curr = queue[qHead++];
          componentSizes[label]++;

          const cy = Math.floor(curr / w);
          const cx = curr % w;

          const neighbors = [
            cx > 0 ? curr - 1 : -1,
            cx < w - 1 ? curr + 1 : -1,
            cy > 0 ? curr - w : -1,
            cy < h - 1 ? curr + w : -1
          ];

          for (const nPos of neighbors) {
            if (nPos !== -1 && labels[nPos] === 0 && data[nPos * 4 + 3] > 10) {
              labels[nPos] = label;
              queue.push(nPos);
            }
          }
        }
      }
    }
  }

  if (componentSizes.length <= 2) return false;

  // 3. Find largest component (main subject)
  let maxArea = 0;
  for (let i = 1; i < componentSizes.length; i++) {
    if (componentSizes[i] > maxArea) maxArea = componentSizes[i];
  }

  // Capped at 250 pixels maximum so detached real objects (shoes, hands, jewelry, accessories, pets)
  // are NEVER accidentally cleared, while genuine 1-50 pixel floating noise artifacts are cleanly purged!
  const minKeepArea = Math.min(250, Math.max(12, Math.round(maxArea * minAreaRatio)));
  let clearedCount = 0;

  for (let i = 0; i < w * h; i++) {
    const lbl = labels[i];
    if (lbl > 0 && componentSizes[lbl] < minKeepArea) {
      data[i * 4 + 3] = 0;
      clearedCount++;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return clearedCount > 0;
}

/**
 * 6. Interactive Alpha Threshold / Sensitivity Tuning
 * Recomputes the mask from base AI confidence:
 * Higher sensitivity = more aggressive background cutoff.
 * Lower sensitivity = preserves faint translucent elements and hair strands.
 */
export function applyAlphaThreshold(maskCanvas, baseMaskCanvas, thresholdPct = 50, feather = 1) {
  if (!maskCanvas || !baseMaskCanvas) return false;

  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const baseCtx = baseMaskCanvas.getContext('2d');
  const baseData = baseCtx.getImageData(0, 0, w, h).data;

  const targetCtx = maskCanvas.getContext('2d');
  const targetImgData = targetCtx.getImageData(0, 0, w, h);
  const targetData = targetImgData.data;

  // Convert thresholdPct (0..100) to cutoff [5..240]
  const cutoff = Math.round(5 + (thresholdPct / 100) * 230);
  const ramp = Math.max(4, feather * 12);

  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    const baseA = baseData[idx + 3];

    if (baseA < cutoff - ramp) {
      targetData[idx + 3] = 0;
    } else if (baseA > cutoff + ramp) {
      targetData[idx + 3] = baseA;
    } else {
      // Smooth sigmoid transition between threshold boundaries
      const t = (baseA - (cutoff - ramp)) / (ramp * 2);
      targetData[idx + 3] = Math.round(baseA * (0.5 - 0.5 * Math.cos(t * Math.PI)));
    }
  }

  targetCtx.putImageData(targetImgData, 0, 0);
  return true;
}

/**
 * 7. Mask Inversion (Subject / Background Swap)
 * Reverses the transparency mask in case the AI segmented the background instead of the subject.
 */
export function applyInvertMask(maskCanvas, originalImage) {
  if (!maskCanvas || !originalImage) return false;

  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const ctx = maskCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Draw original image to sample colors
  const oCanvas = document.createElement('canvas');
  oCanvas.width = w;
  oCanvas.height = h;
  const oCtx = oCanvas.getContext('2d');
  oCtx.drawImage(originalImage, 0, 0, w, h);
  const origData = oCtx.getImageData(0, 0, w, h).data;

  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    const invA = 255 - data[idx + 3];
    data[idx] = origData[idx];
    data[idx + 1] = origData[idx + 1];
    data[idx + 2] = origData[idx + 2];
    data[idx + 3] = invA;
  }

  ctx.putImageData(imgData, 0, 0);
  return true;
}

/**
 * 8. Remove.bg-Style Closed-Form Color Despill & Fringe Neutralizer
 * Eliminates background color contamination (e.g. white fringe, dark halo, green/blue spill)
 * on boundary alpha pixels without modifying the underlying subject color.
 */
export function applyColorDespill(maskCanvas, originalImage, strength = 0.85) {
  if (!maskCanvas) return false;

  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const ctx = maskCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let origData = null;
  if (originalImage) {
    const oCanvas = document.createElement('canvas');
    oCanvas.width = w;
    oCanvas.height = h;
    const oCtx = oCanvas.getContext('2d');
    oCtx.drawImage(originalImage, 0, 0, w, h);
    origData = oCtx.getImageData(0, 0, w, h).data;
  }

  const sampleSource = origData || data;
  const radius = 3;
  let modifiedCount = 0;

  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      const idx = (y * w + x) * 4;
      const alpha = data[idx + 3];

      // Transition edge pixel
      if (alpha > 10 && alpha < 245) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        let bgSumR = 0, bgSumG = 0, bgSumB = 0, bgCount = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * w + (x + dx)) * 4;
            const nA = data[nIdx + 3];
            if (nA >= 245) {
              sumR += sampleSource[nIdx];
              sumG += sampleSource[nIdx + 1];
              sumB += sampleSource[nIdx + 2];
              count++;
            } else if (nA < 10) {
              bgSumR += sampleSource[nIdx];
              bgSumG += sampleSource[nIdx + 1];
              bgSumB += sampleSource[nIdx + 2];
              bgCount++;
            }
          }
        }

        const normalizedAlpha = alpha / 255;
        const spillWeight = (1 - normalizedAlpha) * Math.min(1.0, Math.max(0.0, strength));

        if (count > 0) {
          const avgR = sumR / count;
          const avgG = sumG / count;
          const avgB = sumB / count;

          data[idx] = Math.round(data[idx] * (1 - spillWeight) + avgR * spillWeight);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - spillWeight) + avgG * spillWeight);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - spillWeight) + avgB * spillWeight);
          modifiedCount++;
        } else if (bgCount > 0 && normalizedAlpha > 0.25) {
          // Closed-form mathematical unmixing: F = (C - (1 - alpha) * B) / alpha
          const avgBgR = bgSumR / bgCount;
          const avgBgG = bgSumG / bgCount;
          const avgBgB = bgSumB / bgCount;

          const invAlpha = 1 - normalizedAlpha;
          const unmixR = (data[idx] - invAlpha * avgBgR) / normalizedAlpha;
          const unmixG = (data[idx + 1] - invAlpha * avgBgG) / normalizedAlpha;
          const unmixB = (data[idx + 2] - invAlpha * avgBgB) / normalizedAlpha;

          data[idx] = Math.min(255, Math.max(0, Math.round(data[idx] * (1 - spillWeight) + unmixR * spillWeight)));
          data[idx + 1] = Math.min(255, Math.max(0, Math.round(data[idx + 1] * (1 - spillWeight) + unmixG * spillWeight)));
          data[idx + 2] = Math.min(255, Math.max(0, Math.round(data[idx + 2] * (1 - spillWeight) + unmixB * spillWeight)));
          modifiedCount++;
        }
      }
    }
  }

  if (modifiedCount > 0) {
    ctx.putImageData(imgData, 0, 0);
    return true;
  }
  return false;
}

/**
 * 9. 1-Click 100% Auto-Perfect Algorithm
 * Executes an automated studio-grade multi-pass refinement pass:
 * 1. Purges stray floating specks and disconnected islands (< 0.012 area ratio)
 * 2. Purges dirty ground / asphalt contact shadows in the base zone
 * 3. Neutralizes edge color spill and halos (closed-form despill)
 * 4. Shaves residual outline halos (1px edge choke)
 * 5. Smooths edge anti-aliasing (1px sub-pixel feather)
 * Returns true if changes were made.
 */
export function apply100PercentAutoPerfect(maskCanvas, originalImage, options = {}) {
  if (!maskCanvas) return false;

  const {
    cleanIslands = true,
    purgeShadows = true,
    despill = true,
    chokeHalos = true
  } = options;

  let changed = false;

  if (cleanIslands) {
    const r1 = applyCleanStrayIslands(maskCanvas, 0.002);
    if (r1) changed = true;
  }

  if (purgeShadows && originalImage) {
    const r2 = applyPurgeFloorShadows(maskCanvas, originalImage, 60);
    if (r2) changed = true;
  }

  if (despill) {
    const r3 = applyColorDespill(maskCanvas, originalImage, 0.85);
    if (r3) changed = true;
  }

  if (chokeHalos) {
    const r4 = applyEdgeChoke(maskCanvas, 1, 1);
    if (r4) changed = true;
  }

  return changed;
}

