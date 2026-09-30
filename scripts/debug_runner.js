import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9777',
  '--user-data-dir=E:\\BG Remove\\.chrome_test_profile_debug',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9777/json/list');
    const tabs = await listRes.json();
    const appTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    console.log('Connected to tab:', appTab.url);

    const ws = new WebSocket(appTab.webSocketDebuggerUrl);
    let id = 1;
    const send = (method, params = {}) => ws.send(JSON.stringify({ id: id++, method, params }));

    ws.onopen = () => {
      send('Runtime.enable');
      send('Page.enable');
      send('Log.enable');

      setTimeout(() => {
        console.log('Directly executing removeBackground in browser...');
        send('Runtime.evaluate', {
          awaitPromise: true,
          expression: `(async () => {
            try {
              console.log('Testing SharedArrayBuffer availability:', typeof SharedArrayBuffer);
              console.log('Testing crossOriginIsolated:', window.crossOriginIsolated);
              const { removeBackgroundAI } = await import('/src/services/backgroundRemoval.js');
              console.log('Imported removeBackgroundAI from /src/services/backgroundRemoval.js successfully');
              const res = await fetch('/samples/portrait.jpg');
              const blob = await res.blob();
              console.log('Fetched sample blob, size:', blob.size);
              const outImg = await removeBackgroundAI(blob, (status, pct) => {
                console.log('BG Progress:', status, pct + '%');
              });
              console.log('SUCCESS! Output image loaded:', outImg.width, 'x', outImg.height);
              return 'SUCCESS: ' + outImg.width + 'x' + outImg.height;
            } catch (err) {
              console.error('ERROR in removeBackground:', err.name, err.message, err.stack);
              return 'ERROR: ' + err.message;
            }
          })()`,
          returnByValue: true
        });
      }, 2000);
    };

    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const msg = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        console.log(`[CONSOLE ${data.params.type.toUpperCase()}]`, msg);
      } else if (data.method === 'Runtime.exceptionThrown') {
        console.error('[UNCAUGHT EXCEPTION]', data.params.exceptionDetails.text, data.params.exceptionDetails.exception);
      } else if (data.result?.result?.value) {
        console.log('[EVAL]', data.result.result.value);
      }
    };

    setTimeout(() => {
      console.log('Completed debug session.');
      chrome.kill();
      process.exit(0);
    }, 70000);
  } catch (err) {
    console.error('Fatal error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
