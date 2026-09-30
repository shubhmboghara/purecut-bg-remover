import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9888',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_cutouts',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9888/json/list');
    const tabs = await listRes.json();
    const appTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    const ws = new WebSocket(appTab.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const curId = id++;
      const handler = (ev) => {
        const data = JSON.parse(ev.data);
        if (data.id === curId) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

    ws.onopen = async () => {
      await send('Runtime.enable');
      console.log('Connected to Chrome. Testing cutouts...');

      const samples = ['portrait.jpg', 'product.jpg', 'car.jpg'];

      for (const sample of samples) {
        console.log(`\n--- Processing ${sample} ---`);
        const evalRes = await send('Runtime.evaluate', {
          awaitPromise: true,
          returnByValue: true,
          expression: `(async () => {
            try {
              const { removeBackgroundAIBlob } = await import('/src/services/backgroundRemoval.js');
              const res = await fetch('/samples/${sample}');
              const blob = await res.blob();
              const startTime = performance.now();
              const outBlob = await removeBackgroundAIBlob(blob, (st, pct) => {
                // console.log('${sample}:', st, pct);
              });
              const elapsed = Math.round(performance.now() - startTime);

              // Convert blob to base64
              const reader = new FileReader();
              const base64Promise = new Promise(resolve => {
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(outBlob);
              });
              const base64Data = await base64Promise;

              // Inspect image pixel alpha stats
              const img = new Image();
              await new Promise((res, rej) => {
                img.onload = res;
                img.onerror = rej;
                img.src = base64Data;
              });

              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              const imgData = ctx.getImageData(0, 0, img.width, img.height);
              const data = imgData.data;

              let transparent = 0;
              let semi = 0;
              let solid = 0;
              for (let i = 3; i < data.length; i += 4) {
                const a = data[i];
                if (a < 10) transparent++;
                else if (a > 245) solid++;
                else semi++;
              }
              const total = data.length / 4;

              return {
                success: true,
                sample: '${sample}',
                width: img.width,
                height: img.height,
                elapsedMs: elapsed,
                totalPixels: total,
                transparentPct: ((transparent / total) * 100).toFixed(1),
                semiPct: ((semi / total) * 100).toFixed(1),
                solidPct: ((solid / total) * 100).toFixed(1),
                base64: base64Data.split(',')[1]
              };
            } catch (err) {
              return { success: false, sample: '${sample}', error: err.message, stack: err.stack };
            }
          })()`
        });

        const res = evalRes.result?.value;
        if (res?.success) {
          console.log(`✅ ${sample} done in ${res.elapsedMs}ms (${res.width}x${res.height})`);
          console.log(`   Alpha Stats: Transparent: ${res.transparentPct}%, Semi (Edges): ${res.semiPct}%, Solid: ${res.solidPct}%`);
          fs.writeFileSync(`scripts/cutout_${sample.replace('.jpg', '.png')}`, Buffer.from(res.base64, 'base64'));
          console.log(`   Saved cutout to scripts/cutout_${sample.replace('.jpg', '.png')}`);
        } else {
          console.error(`❌ ${sample} failed:`, res?.error || evalRes);
        }
      }

      console.log('\nAll cutout tests finished.');
      chrome.kill();
      process.exit(0);
    };

  } catch (e) {
    console.error('Test error:', e);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
