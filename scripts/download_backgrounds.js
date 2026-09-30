import fs from 'fs';
import path from 'path';

const bgDir = path.resolve('public/backgrounds');
if (!fs.existsSync(bgDir)) {
  fs.mkdirSync(bgDir, { recursive: true });
}

const PHOTOS = [
  {
    name: 'office.jpg',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'interior.jpg',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'forest.jpg',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'city.jpg',
    url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80'
  }
];

async function downloadBgs() {
  for (const p of PHOTOS) {
    const dest = path.join(bgDir, p.name);
    if (!fs.existsSync(dest)) {
      console.log(`Downloading ${p.name}...`);
      try {
        const res = await fetch(p.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buf);
        console.log(`Saved ${p.name} (${buf.length} bytes)`);
      } catch (err) {
        console.error(`Failed ${p.name}:`, err.message);
      }
    }
  }
}

downloadBgs();
