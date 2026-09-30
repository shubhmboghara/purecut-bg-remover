import JSZip from 'jszip';

/**
 * Fast, memory-safe bulk ZIP packaging for 100 to 2,000+ images.
 * Uses STORE compression mode so CPU does not freeze re-compressing already-compressed PNGs/JPEGs.
 */
export async function exportBatchAsZip(
  items,
  options = { format: 'png', suffix: '_purecut' },
  onProgress
) {
  const completedItems = items.filter((it) => it.status === 'completed' && it.resultBlob);
  if (completedItems.length === 0) {
    throw new Error('No completed images to export.');
  }

  const zip = new JSZip();
  const folder = zip.folder('purecut_studio_cutouts') || zip;

  const { format = 'png', suffix = '_purecut' } = options;
  const ext = format === 'jpeg' || format === 'jpg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';

  // Add all files to the ZIP
  completedItems.forEach((item, index) => {
    const originalName = item.name || `image_${index + 1}`;
    const dotIdx = originalName.lastIndexOf('.');
    const baseName = dotIdx !== -1 ? originalName.slice(0, dotIdx) : originalName;
    const cleanFileName = `${baseName}${suffix}.${ext}`;
    
    folder.file(cleanFileName, item.resultBlob);
  });

  if (onProgress) onProgress(10, 'Building ZIP archive structure...');

  // Generate ZIP blob with streaming to minimize memory usage
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'STORE', // STORE compression mode prevents CPU lockup on 1000+ files!
      streamFiles: true
    },
    (metadata) => {
      if (onProgress) {
        const pct = Math.round(metadata.percent);
        onProgress(pct, `Packaging archive (${pct}%)...`);
      }
    }
  );

  return zipBlob;
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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
