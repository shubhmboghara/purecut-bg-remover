import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9966',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_cors',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9966/json/list');
    const tabs = await listRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);

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

      ws.addEventListener('message', (ev) => {
        const d = JSON.parse(ev.data);
        if (d.method === 'Runtime.consoleAPICalled') {
          console.log('[LOG]', d.params.type, d.params.args.map(a => a.value || a.description).join(' '));
        } else if (d.method === 'Runtime.exceptionThrown') {
          console.error('[ERR]', d.params.exceptionDetails);
        }
      });

      console.log('Testing image load in browser...');
      const res = await send('Runtime.evaluate', {
        awaitPromise: true,
        returnByValue: true,
        expression: `(async () => {
          return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ loaded: true, w: img.width, h: img.height });
            img.onerror = (e) => resolve({ loaded: false, error: 'onerror fired' });
            img.src = '/samples/car.jpg';
          });
        })()`
      });

      console.log('Image test result:', res.result?.value);

      // Now test calling removeBackgroundAI directly
      console.log('Testing removeBackgroundAI directly...');
      const bgRes = await send('Runtime.evaluate', {
        awaitPromise: true,
        returnByValue: true,
        expression: `(async () => {
          try {
            const { removeBackgroundAI } = await import('/src/services/backgroundRemoval.js');
            console.log('Calling removeBackgroundAI...');
            const cutout = await removeBackgroundAI('/samples/car.jpg', (st, pct) => {
              console.log('Progress:', st, pct);
            });
            return { success: true, w: cutout.width, h: cutout.height };
          } catch(e) {
            return { success: false, err: e.message, stack: e.stack };
          }
        })()`
      });
      console.log('removeBackgroundAI result:', bgRes.result?.value);

      chrome.kill();
      process.exit(0);
    };
  } catch(e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
