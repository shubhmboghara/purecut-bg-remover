import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--window-size=1440,900',
  '--remote-debugging-port=9911',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_verify',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9911/json/list');
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
      console.log('Connected to Chrome. Verifying UI and tools...');

      // Wait 3s for React
      await new Promise(r => setTimeout(r, 3000));

      // 1. Check title and tabs
      const uiCheck = await send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const title = document.title;
          const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
          return { title, buttonsCount: buttons.length };
        })()`
      });
      console.log('UI Check:', uiCheck.result?.value);

      // 2. Open an image in single studio mode by directly calling window or dispatching
      const loadRes = await send('Runtime.evaluate', {
        awaitPromise: true,
        returnByValue: true,
        expression: `(async () => {
          // Find sample button for Car or Portrait
          const btns = Array.from(document.querySelectorAll('button'));
          const carBtn = btns.find(b => b.innerText.includes('Automobile') || b.innerText.includes('Car') || b.innerText.includes('Portrait'));
          if (carBtn) {
            carBtn.click();
            return { clicked: true, text: carBtn.innerText };
          }
          return { clicked: false, available: btns.map(b => b.innerText) };
        })()`
      });
      console.log('Sample button click:', loadRes.result?.value);

      // Wait for AI cutout to process and load into canvas (up to 15s)
      for (let s = 1; s <= 15; s++) {
        await new Promise(r => setTimeout(r, 1000));
        const status = await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `(() => {
            const hasMainCanvas = !!document.querySelector('canvas');
            const processing = document.querySelector('.animate-pulse')?.innerText || '';
            const activeSidebarTab = document.querySelector('aside button.bg-brand-500\\/15')?.innerText || '';
            return { s: ${s}, hasMainCanvas, processing, activeSidebarTab };
          })()`
        });
        if (s % 3 === 0) console.log(`[${s}s]`, status.result?.value);
      }

      // 3. Switch to "Cutout & Fix" sidebar tab
      await send('Runtime.evaluate', {
        expression: `(() => {
          const tab = Array.from(document.querySelectorAll('aside button')).find(b => b.innerText.includes('Cutout'));
          if (tab) tab.click();
        })()`
      });

      await new Promise(r => setTimeout(r, 1000));

      // 4. Capture screenshot of the full Studio UI with the new Cutout & Fix panel open
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('scripts/verified_studio_ui.png', Buffer.from(screenshot.data, 'base64'));
      console.log('✅ Successfully saved studio screenshot to scripts/verified_studio_ui.png!');

      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error('Verification error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
