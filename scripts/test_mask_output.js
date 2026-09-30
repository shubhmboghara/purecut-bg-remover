import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9876',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_mask',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9876/json/list');
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
      console.log('Testing mask output from @imgly/background-removal...');

      const evalRes = await send('Runtime.evaluate', {
        awaitPromise: true,
        returnByValue: true,
        expression: `(async () => {
          try {
            const { removeBackground } = await import('@imgly/background-removal');
            const res = await fetch('/samples/car.jpg');
            const blob = await res.blob();

            const maskBlob = await removeBackground(blob, {
              model: 'small',
              publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
              output: {
                format: 'image/png',
                type: 'mask'
              }
            });

            const img = new Image();
            await new Promise(r => { img.onload = r; img.src = URL.createObjectURL(maskBlob); });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, img.width, img.height).data;

            // Sample a few pixels to see if mask is grayscale or alpha
            const samples = [];
            for (let i = 0; i < 5; i++) {
              const idx = (Math.floor(img.height / 2) * img.width + Math.floor(img.width * (0.2 + i * 0.15))) * 4;
              samples.push({ r: data[idx], g: data[idx+1], b: data[idx+2], a: data[idx+3] });
            }

            return {
              maskWidth: img.width,
              maskHeight: img.height,
              maskBlobSize: maskBlob.size,
              samplePixels: samples
            };
          } catch(err) {
            return { error: err.message, stack: err.stack };
          }
        })()`
      });

      console.log('Result:', evalRes.result?.value);
      chrome.kill();
      process.exit(0);
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
