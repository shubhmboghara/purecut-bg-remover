import fs from 'fs';
import path from 'path';

const samplesDir = path.resolve('public/samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

const SAMPLES_TO_DOWNLOAD = [
  {
    name: 'portrait.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'product.jpg',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'car.jpg',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
  }
];

async function download() {
  for (const s of SAMPLES_TO_DOWNLOAD) {
    const dest = path.join(samplesDir, s.name);
    if (!fs.existsSync(dest)) {
      console.log(`Downloading ${s.name} from ${s.url}...`);
      try {
        const res = await fetch(s.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buf);
        console.log(`Saved ${s.name} (${buf.length} bytes)`);
      } catch (err) {
        console.error(`Failed to download ${s.name}:`, err.message);
      }
    } else {
      console.log(`${s.name} already exists.`);
    }
  }
}

download();
