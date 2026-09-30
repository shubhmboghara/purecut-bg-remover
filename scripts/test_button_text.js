import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--window-size=1440,900',
  '--remote-debugging-port=9955',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_direct2',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9955/json/list');
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
      await send('Page.enable');

      console.log('Waiting for window.__purecutSelectImage...');
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        const check = await send('Runtime.evaluate', {
          expression: 'typeof window.__purecutSelectImage'
        });
        if (check.result?.value === 'function') break;
      }

      console.log('Triggering car.jpg background removal in studio...');
      await send('Runtime.evaluate', {
        expression: 'window.__purecutSelectImage("/samples/car.jpg")'
      });

      // Poll until processing screen disappears
      console.log('Waiting for AI removal to finish...');
      for (let s = 1; s <= 30; s++) {
        await new Promise(r => setTimeout(r, 1000));
        const isDone = await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `(() => {
            const isProcessing = !!document.querySelector('.animate-spin');
            const hasCanvases = document.querySelectorAll('canvas').length;
            const toast = document.querySelector('.fixed.bottom-6')?.innerText || '';
            return { s: ${s}, isProcessing, hasCanvases, toast };
          })()`
        });

        if (s % 3 === 0) console.log(`[${s}s]`, isDone.result?.value);
        if (!isDone.result?.value?.isProcessing && isDone.result?.value?.hasCanvases >= 3) {
          console.log(`Neural processing finished completely at ${s}s!`);
          break;
        }
      }

      // Switch to Cutout & Fix tab
      console.log('Selecting Cutout & Fix tab...');
      await send('Runtime.evaluate', {
        expression: `(() => {
          const tab = Array.from(document.querySelectorAll('aside button')).find(b => b.textContent.includes('Cutout'));
          if (tab) tab.click();
        })()`
      });

      await new Promise(r => setTimeout(r, 1500));

      // Click "Purge Lingering Floor Shadows" button!
      console.log('Testing Purge Lingering Floor Shadows button...');
      await send('Runtime.evaluate', {
        expression: `(() => {
          const shadowBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Purge Lingering Floor Shadows'));
          if (shadowBtn) shadowBtn.click();
        })()`
      });

      await new Promise(r => setTimeout(r, 1500));

      console.log('Capturing final screenshot of completed cutout with smart fix applied...');
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('scripts/cutout_studio_finished.png', Buffer.from(shot.data, 'base64'));
      console.log('✅ Successfully captured scripts/cutout_studio_finished.png!');

      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
