import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9898',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_smart',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9898/json/list');
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
      console.log('Testing Smart Magic Wand and Shadow Cleaner in Chrome...');

      const evalRes = await send('Runtime.evaluate', {
        awaitPromise: true,
        returnByValue: true,
        expression: `(async () => {
          // Load car cutout
          const res = await fetch('/samples/car.jpg');
          const blob = await res.blob();
          const { removeBackgroundAIBlob } = await import('/src/services/backgroundRemoval.js');
          const cutoutBlob = await removeBackgroundAIBlob(blob);

          const img = new Image();
          const imgUrl = URL.createObjectURL(cutoutBlob);
          await new Promise(r => { img.onload = r; img.src = imgUrl; });

          const w = img.width;
          const h = img.height;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          // Let's inspect the shadow under the car:
          // Center-bottom area: x = w/2, y = h - 20
          const sampleY = Math.floor(h * 0.88);
          const sampleX = Math.floor(w * 0.5);
          const idx = (sampleY * w + sampleX) * 4;
          const shadowR = data[idx], shadowG = data[idx+1], shadowB = data[idx+2], shadowA = data[idx+3];

          // Implement Magic Wand BFS Flood Fill from (sampleX, sampleY)
          const targetR = shadowR, targetG = shadowG, targetB = shadowB;
          const tolerance = 40;
          const visited = new Uint8Array(w * h);
          const queue = [sampleY * w + sampleX];
          visited[sampleY * w + sampleX] = 1;

          let clearedCount = 0;
          let head = 0;

          while (head < queue.length) {
            const curr = queue[head++];
            const cy = Math.floor(curr / w);
            const cx = curr % w;
            const cIdx = curr * 4;

            // Clear pixel
            data[cIdx + 3] = 0;
            clearedCount++;

            // Check 4 neighbors
            const neighbors = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1]
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nPos = ny * w + nx;
                if (!visited[nPos]) {
                  visited[nPos] = 1;
                  const nIdx = nPos * 4;
                  const nA = data[nIdx + 3];
                  if (nA > 10) {
                    const nr = data[nIdx], ng = data[nIdx + 1], nb = data[nIdx + 2];
                    const diff = Math.sqrt((nr - targetR)**2 + (ng - targetG)**2 + (nb - targetB)**2);
                    if (diff <= tolerance) {
                      queue.push(nPos);
                    }
                  }
                }
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
          const cleanedBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          const reader = new FileReader();
          const base64 = await new Promise(r => {
            reader.onloadend = () => r(reader.result.split(',')[1]);
            reader.readAsDataURL(cleanedBlob);
          });

          return {
            shadowColor: { r: shadowR, g: shadowG, b: shadowB, a: shadowA },
            clearedPixels: clearedCount,
            base64
          };
        })()`
      });

      const res = evalRes.result?.value;
      console.log('Result:', {
        shadowColor: res?.shadowColor,
        clearedPixels: res?.clearedPixels
      });

      if (res?.base64) {
        fs.writeFileSync('scripts/cutout_car_cleaned.png', Buffer.from(res.base64, 'base64'));
        console.log('Saved scripts/cutout_car_cleaned.png!');
      }

      chrome.kill();
      process.exit(0);
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
