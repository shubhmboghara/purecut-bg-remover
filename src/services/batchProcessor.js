/**
 * High-Scale Turbo Batch Image Processing Service
 * Engineered specifically to process 1,000 to 2,000+ images without freezing the browser,
 * crashing WebAssembly/WebGL context, or leaking memory.
 */

import { removeBackgroundAIBlob } from './backgroundRemoval.js';

/**
 * Format bytes into human readable format
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format seconds into human readable time (e.g. "12m 30s", "45s")
 */
export function formatEta(seconds) {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return 'Calculating...';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = Math.floor(seconds % 60);
  if (mins < 60) {
    return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

/**
 * Create a lightweight batch item descriptor from a File object.
 * Does NOT read the file into memory or create heavy base64 strings!
 */
export function createBatchItem(file, index = 0) {
  return {
    id: `batch_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
    file,
    name: file.name,
    size: file.size,
    type: file.type || 'image/png',
    status: 'pending', // 'pending' | 'processing' | 'completed' | 'error'
    progress: 0,
    statusText: 'Queued',
    resultBlob: null,
    resultUrl: null,
    thumbUrl: null,
    error: null,
    durationMs: 0
  };
}

/**
 * Apply batch background compositing (transparent, pure white, or custom solid color)
 * and export format (PNG, JPG, WebP)
 */
export async function compositeCutoutBlob(
  cutoutBlob,
  background = { type: 'transparent', color: '#ffffff' },
  format = 'png',
  quality = 0.92
) {
  // If pure transparent PNG is needed, return cutout directly without canvas re-render
  if ((background.type === 'transparent' || !background.type) && format === 'png') {
    return cutoutBlob;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(cutoutBlob);
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        // Apply background fill if not transparent
        if (background.type === 'white' || background.type === 'color') {
          ctx.fillStyle = background.type === 'white' ? '#ffffff' : (background.color || '#ffffff');
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const mime = format === 'jpeg' || format === 'jpg' 
          ? 'image/jpeg' 
          : format === 'webp' 
            ? 'image/webp' 
            : 'image/png';

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(cutoutBlob);
        }, mime, quality);
      } catch (err) {
        URL.revokeObjectURL(url);
        resolve(cutoutBlob);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * High-Scale Non-Blocking Batch Worker Controller
 * Manages queue execution with controlled concurrency and event loop yielding
 */
export class BatchQueueWorker {
  constructor({
    onItemUpdate,
    onQueueProgress,
    onQueueComplete,
    onQueuePaused,
    background = { type: 'transparent', color: '#ffffff' },
    format = 'png'
  }) {
    this.onItemUpdate = onItemUpdate;
    this.onQueueProgress = onQueueProgress;
    this.onQueueComplete = onQueueComplete;
    this.onQueuePaused = onQueuePaused;
    this.background = background;
    this.format = format;

    this.isRunning = false;
    this.isPaused = false;
    this.durations = []; // Rolling durations for ETA
  }

  updateSettings({ background, format }) {
    if (background) this.background = background;
    if (format) this.format = format;
  }

  pause() {
    this.isPaused = true;
    this.isRunning = false;
    if (this.onQueuePaused) this.onQueuePaused();
  }

  resume(items) {
    this.isPaused = false;
    this.run(items);
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
  }

  async run(items) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;

    // Filter items that need processing
    const pendingItems = items.filter(
      (it) => it.status === 'pending' || it.status === 'error'
    );

    for (let i = 0; i < pendingItems.length; i++) {
      if (!this.isRunning || this.isPaused) {
        break;
      }

      const item = pendingItems[i];
      const startTime = performance.now();

      // Update status to processing
      this.onItemUpdate(item.id, {
        status: 'processing',
        progress: 10,
        statusText: 'AI Segmenting...'
      });

      try {
        // Run AI removal directly on File / Blob
        const cutoutBlob = await removeBackgroundAIBlob(item.file, (status, pct) => {
          if (this.onItemUpdate && this.isRunning) {
            this.onItemUpdate(item.id, {
              status: 'processing',
              progress: Math.min(92, pct),
              statusText: status
            });
          }
        });

        // Apply background composition (e.g. pure white or transparent)
        const finalBlob = await compositeCutoutBlob(
          cutoutBlob,
          this.background,
          this.format
        );

        const durationMs = Math.round(performance.now() - startTime);
        this.durations.push(durationMs);
        if (this.durations.length > 20) this.durations.shift();

        // Create lightweight result URL
        const resultUrl = URL.createObjectURL(finalBlob);

        this.onItemUpdate(item.id, {
          status: 'completed',
          progress: 100,
          statusText: 'Done',
          resultBlob: finalBlob,
          resultUrl,
          durationMs,
          error: null
        });
      } catch (err) {
        console.error(`Error processing batch item ${item.name}:`, err);
        this.onItemUpdate(item.id, {
          status: 'error',
          progress: 0,
          statusText: 'Failed',
          error: err.message || 'Processing failed'
        });
      }

      // Calculate rolling ETA
      const remainingPending = items.filter(
        (it) => it.status === 'pending' && it.id !== item.id
      ).length;
      
      const avgDuration = this.durations.length > 0
        ? this.durations.reduce((a, b) => a + b, 0) / this.durations.length
        : 2000;
      
      const etaSeconds = Math.round((remainingPending * avgDuration) / 1000);
      const speedSec = (avgDuration / 1000).toFixed(1);

      if (this.onQueueProgress) {
        this.onQueueProgress({
          remainingPending,
          etaSeconds,
          speedSec,
          avgDuration
        });
      }

      // CRITICAL: Yield 50ms to the browser event loop between images!
      // This prevents UI freezing, lets React render at 60fps, and triggers garbage collection.
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.isRunning = false;
    if (!this.isPaused && this.onQueueComplete) {
      this.onQueueComplete();
    }
  }
}
