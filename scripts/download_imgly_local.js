import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';
const TARGET_DIR = path.resolve('public/imgly');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function downloadFile(name) {
  const destPath = path.join(TARGET_DIR, name);
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    console.log(`[SKIP] Already exists: ${name}`);
    return;
  }

  const url = `${BASE_URL}${name}`;
  console.log(`[DOWNLOADING] ${name}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`[SAVED] ${name} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function main() {
  console.log('Fetching resources.json...');
  const res = await fetch(`${BASE_URL}resources.json`);
  const jsonText = await res.text();
  fs.writeFileSync(path.join(TARGET_DIR, 'resources.json'), jsonText);
  console.log('Saved resources.json');

  const resourceMap = JSON.parse(jsonText);
  const targetKeys = [
    '/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm',
    '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
    '/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs',
    '/onnxruntime-web/ort-wasm-simd-threaded.mjs',
    '/models/isnet_quint8',
    '/models/isnet_fp16'
  ];

  const chunksToDownload = new Set();
  for (const key of targetKeys) {
    const entry = resourceMap[key];
    if (entry && entry.chunks) {
      entry.chunks.forEach(c => chunksToDownload.add(c.name));
    }
  }

  console.log(`Total files to download: ${chunksToDownload.size}`);
  const list = Array.from(chunksToDownload);
  
  // Download with 6 concurrent workers for high throughput
  const concurrency = 6;
  let index = 0;

  async function worker() {
    while (index < list.length) {
      const current = list[index++];
      try {
        await downloadFile(current);
      } catch (err) {
        console.error(`Retry needed for ${current}:`, err.message);
        await new Promise(r => setTimeout(r, 1000));
        await downloadFile(current);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log('🎉 All neural model assets successfully cached locally in public/imgly!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
