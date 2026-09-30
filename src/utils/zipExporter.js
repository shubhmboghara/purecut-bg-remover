import JSZip from 'jszip';
import { getBatchBlob } from '../services/batchStorage.js';

/**
 * Fast, memory-safe bulk ZIP packaging for 100 to 10,000+ images.
 * Uses STORE compression mode so CPU does not freeze re-compressing already-compressed PNGs/JPEGs.
 * Reads blobs on-demand from IndexedDB to avoid holding all Blobs in RAM at once!
 */
export async function exportBatchAsZip(
  items,
  options = { format: 'png', suffix: '_purecut', maxItemsPerZip: 500 },
  onProgress
) {
  const completedItems = items.filter((it) => it.status === 'completed');
  if (completedItems.length === 0) {
    throw new Error('No completed images to export.');
  }

  const { format = 'png', suffix = '_purecut', maxItemsPerZip = 500 } = options;
  const ext = format === 'jpeg' || format === 'jpg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';

  // If items count > maxItemsPerZip, export the requested slice or first volume
  const itemsToPack = completedItems.slice(0, maxItemsPerZip);

  const zip = new JSZip();
  const folder = zip.folder('purecut_studio_cutouts') || zip;

  if (onProgress) onProgress(5, `Preparing archive for ${itemsToPack.length} cutouts...`);

  // Add files one by one, fetching from memory or IndexedDB
  for (let index = 0; index < itemsToPack.length; index++) {
    const item = itemsToPack[index];
    let blob = item.resultBlob;

    if (!blob) {
      blob = await getBatchBlob(item.id);
    }

    if (blob) {
      const originalName = item.name || `image_${index + 1}`;
      const dotIdx = originalName.lastIndexOf('.');
      const baseName = dotIdx !== -1 ? originalName.slice(0, dotIdx) : originalName;
      const cleanFileName = `${baseName}${suffix}.${ext}`;
      
      folder.file(cleanFileName, blob);
    }

    if (index % 50 === 0 && onProgress) {
      const pct = Math.round(5 + (index / itemsToPack.length) * 45);
      onProgress(pct, `Staging images (${index + 1}/${itemsToPack.length})...`);
    }
  }

  if (onProgress) onProgress(55, 'Generating ZIP package...');

  // Generate ZIP blob with streaming to minimize memory usage
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'STORE', // STORE compression mode prevents CPU lockup on 1000+ files!
      streamFiles: true
    },
    (metadata) => {
      if (onProgress) {
        const pct = Math.round(55 + (metadata.percent / 100) * 45);
        onProgress(pct, `Compressing package (${pct}%)...`);
      }
    }
  );

  return zipBlob;
}

/**
 * Calculates volume partitions for massive batches (e.g. 5,000 files -> 10 parts of 500)
 */
export function calculateZipVolumes(items, volumeSize = 500) {
  const completed = items.filter((it) => it.status === 'completed');
  const total = completed.length;
  if (total === 0) return [];

  const volumes = [];
  const totalParts = Math.ceil(total / volumeSize);

  for (let i = 0; i < totalParts; i++) {
    const startIdx = i * volumeSize;
    const endIdx = Math.min(startIdx + volumeSize, total);
    volumes.push({
      partNumber: i + 1,
      totalParts,
      startIdx,
      endIdx,
      count: endIdx - startIdx,
      items: completed.slice(startIdx, endIdx),
      label: `Part ${i + 1} (${startIdx + 1} - ${endIdx})`
    });
  }

  return volumes;
}

/**
 * Trigger immediate browser download of any Blob
 */
export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
