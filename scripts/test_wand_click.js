import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--window-size=1440,900',
  '--remote-debugging-port=9966',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_cutouts',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9966/json/list');
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

    let isDone = false;

    ws.onopen = async () => {
      await send('Runtime.enable');
      await send('Page.enable');

      ws.addEventListener('message', (ev) => {
        const d = JSON.parse(ev.data);
        if (d.method === 'Runtime.consoleAPICalled') {
          const msg = d.params.args.map(a => a.value || a.description).join(' ');
          if (msg.includes('[AI Completed Cutout]')) {
            isDone = true;
          }
        }
      });

      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 300));
        const check = await send('Runtime.evaluate', {
          expression: 'typeof window.__purecutSelectImage'
        });
        if (check.result?.value === 'function') break;
      }

      await send('Runtime.evaluate', {
        expression: 'window.__purecutSelectImage("/samples/car.jpg")'
      });

      for (let s = 1; s <= 30; s++) {
        await new Promise(r => setTimeout(r, 1000));
        if (isDone) break;
      }

      // Switch to Cutout & Fix tab
      await send('Runtime.evaluate', {
        expression: `(() => {
          const tab = Array.from(document.querySelectorAll('aside button')).find(b => b.textContent.includes('Cutout'));
          if (tab) tab.click();
        })()`
      });

      await new Promise(r => setTimeout(r, 1000));

      // Click on canvas using Magic Wand directly on the asphalt under the rear bumper
      console.log('Clicking canvas with Magic Wand on residual road shadow...');
      await send('Runtime.evaluate', {
        expression: `(() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          // The asphalt under the bumper is approximately at 50% X and 68% Y
          const clickX = rect.left + rect.width * 0.50;
          const clickY = rect.top + rect.height * 0.68;

          const evt = new MouseEvent('pointerdown', {
            clientX: clickX,
            clientY: clickY,
            bubbles: true
          });
          canvas.dispatchEvent(evt);
        })()`
      });

      await new Promise(r => setTimeout(r, 1500));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('scripts/cutout_studio_wand_clicked.png', Buffer.from(shot.data, 'base64'));
      console.log('✅ Captured scripts/cutout_studio_wand_clicked.png successfully!');

      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
