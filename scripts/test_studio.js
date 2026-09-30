import { spawn } from 'child_process';
import http from 'http';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9444;

async function run() {
  console.log("Starting headless Chrome...");
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--user-data-dir=E:\\BG Remove\\.chrome_test_profile2'
  ]);

  chrome.stderr.on('data', d => {
    // console.log('[Chrome]', d.toString());
  });

  // Wait for remote debugging port to be ready
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const tabs = await res.json();
      if (tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        wsUrl = tabs[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {
      // waiting
    }
  }

  if (!wsUrl) {
    console.error("Failed to connect to Chrome debugging port!");
    chrome.kill();
    process.exit(1);
  }

  console.log("Connected to Chrome via CDP:", wsUrl);
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
      return;
    }

    if (data.method === 'Runtime.consoleAPICalled') {
      const type = data.params.type;
      const args = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[Browser Console ${type.toUpperCase()}]`, args);
    } else if (data.method === 'Runtime.exceptionThrown') {
      console.error(`[Browser Exception]`, data.params.exceptionDetails);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  console.log("Navigating to http://localhost:3000...");
  await send('Page.navigate', { url: 'http://localhost:3000' });

  // Wait 3 seconds for React app to mount
  await new Promise(r => setTimeout(r, 3000));

  // Check if root has content
  const titleResult = await send('Runtime.evaluate', {
    expression: 'document.title + " | " + document.querySelector("h2")?.innerText'
  });
  console.log("Page info:", titleResult.result.value);

  // Click on the first sample image ("Portrait")
  console.log("Triggering sample image click...");
  const clickSample = await send('Runtime.evaluate', {
    expression: `(() => {
      const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Portrait'));
      if (sampleBtn) {
        sampleBtn.click();
        return 'Clicked Portrait Sample button';
      }
      return 'Sample button not found';
    })()`
  });
  console.log("Sample click result:", clickSample.result.value);

  // Monitor for 15 seconds to watch background removal progress or errors
  for (let s = 1; s <= 15; s++) {
    await new Promise(r => setTimeout(r, 1000));
    const statusResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const statusEl = document.querySelector('.animate-pulse');
        const text = statusEl ? statusEl.innerText : '';
        const toast = document.querySelector('.fixed.bottom-6')?.innerText;
        const hasCanvases = !!document.querySelector('canvas');
        return { text, toast, hasCanvases };
      })()`,
      returnByValue: true
    });
    console.log(`[Sec ${s}] Status:`, statusResult.result?.value);
  }

  console.log("Taking screenshot...");
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const fs = await import('fs');
  fs.writeFileSync('scripts/test_screenshot.png', Buffer.from(screenshot.data, 'base64'));
  console.log("Saved scripts/test_screenshot.png!");

  ws.close();
  chrome.kill();
  console.log("Test finished.");
}

run().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
