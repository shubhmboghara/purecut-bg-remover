import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--window-size=1440,900',
  '--remote-debugging-port=9922',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_capture',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9922/json/list');
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
      await send('DOM.enable');

      console.log('Waiting for app hydration...');
      await new Promise(r => setTimeout(r, 3000));

      // Get Automobile button position
      const btnPos = await send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.innerText.includes('Automobile'));
          if (btn) {
            const r = btn.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
          return null;
        })()`
      });

      console.log('Automobile button pos:', btnPos.result?.value);
      if (btnPos.result?.value) {
        const { x, y } = btnPos.result.value;
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
        console.log('Dispatched real mouse click at:', x, y);
      }

      // Wait for AI processing
      console.log('Waiting for AI background removal...');
      for (let s = 1; s <= 25; s++) {
        await new Promise(r => setTimeout(r, 1000));
        const status = await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `(() => {
            const processing = document.querySelector('.animate-pulse')?.innerText || '';
            const canvasCount = document.querySelectorAll('canvas').length;
            const sidebarBtns = Array.from(document.querySelectorAll('aside button')).map(b => b.innerText.trim());
            return { s: ${s}, processing, canvasCount, sidebarBtns };
          })()`
        });
        if (s % 4 === 0) console.log(`[${s}s]`, status.result?.value);
        if (status.result?.value?.canvasCount >= 3 && !status.result?.value?.processing) {
          console.log(`Processing complete at ${s}s!`);
          break;
        }
      }

      await new Promise(r => setTimeout(r, 2000));

      // Click "Cutout & Fix" sidebar tab
      console.log('Clicking Cutout & Fix tab...');
      const tabClick = await send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const btns = Array.from(document.querySelectorAll('aside button'));
          const tab = btns.find(b => b.innerText.includes('Cutout'));
          if (tab) {
            tab.click();
            return 'Clicked Cutout tab';
          }
          return 'Tab not found among: ' + btns.map(b => b.innerText).join(', ');
        })()`
      });
      console.log('Tab click result:', tabClick.result?.value);

      await new Promise(r => setTimeout(r, 1500));

      // Capture high-res screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('scripts/cutout_studio_live.png', Buffer.from(shot.data, 'base64'));
      console.log('✅ Saved scripts/cutout_studio_live.png!');

      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
