import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--window-size=1440,900',
  '--remote-debugging-port=9977',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_cutouts',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9977/json/list');
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
          console.log('[BROWSER]', d.params.type, msg);
          if (msg.includes('[AI Completed Cutout]')) {
            isDone = true;
          }
        } else if (d.method === 'Runtime.exceptionThrown') {
          console.error('[UNCAUGHT]', d.params.exceptionDetails.text, d.params.exceptionDetails.exception?.description);
        }
      });

      console.log('Waiting for window.__purecutSelectImage...');
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        const check = await send('Runtime.evaluate', {
          expression: 'typeof window.__purecutSelectImage'
        });
        if (check.result?.value === 'function') break;
      }

      console.log('Calling window.__purecutSelectImage("/samples/car.jpg")...');
      await send('Runtime.evaluate', {
        expression: 'window.__purecutSelectImage("/samples/car.jpg")'
      });

      // Poll until completed or 180s
      for (let s = 1; s <= 180; s++) {
        await new Promise(r => setTimeout(r, 1000));
        if (s % 10 === 0) console.log(`Waiting for AI cutout completion... (${s}s)`);
        if (isDone) {
          console.log(`Processing fully finished at ${s}s!`);
          break;
        }
      }

      // Switch to Cutout & Fix tab
      await send('Runtime.evaluate', {
        expression: `(() => {
          const tab = Array.from(document.querySelectorAll('aside button')).find(b => b.textContent.includes('Cutout'));
          if (tab) tab.click();
        })()`
      });

      await new Promise(r => setTimeout(r, 1500));

      // Click Purge Floor Shadows
      console.log('Triggering Purge Floor Shadows...');
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Purge Lingering Floor Shadows'));
          if (btn) btn.click();
        })()`
      });

      await new Promise(r => setTimeout(r, 1500));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('scripts/cutout_studio_finished.png', Buffer.from(shot.data, 'base64'));
      console.log('✅ Captured scripts/cutout_studio_finished.png successfully!');

      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
