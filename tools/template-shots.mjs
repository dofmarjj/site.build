// Скриншоти шаблонів для анімації в hero-блоці головної сторінки.
//
// Запуск (сайт має бути доступний локально, напр. `python3 -m http.server 8765`):
//   node tools/template-shots.mjs lapka budmaster kvity
//
// Для кожного слага знімає demos/<slug>/index.html у ширині 1280px
// і зберігає верхні ~3600px сторінки в assets/img/templates/<slug>.jpg (ширина 960px).
// Потрібні лише Node 22+ і встановлений Google Chrome — без npm-залежностей.

import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765';
const PORT = 9333;
const WIDTH = 1280;
const MAX_HEIGHT = 3600;   // CSS-пікселі: скільки сторінки потрапляє в картинку
const SCALE = 0.75;        // 1280 → 960px
const OUT_DIR = path.resolve('assets/img/templates');

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('Вкажіть слаги шаблонів: node tools/template-shots.mjs lapka budmaster');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = path.join(tmpdir(), `tagwise-shots-${Date.now()}`);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' });

async function cdpTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
      if (res.ok) return res.json();
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome не запустився');
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
      listeners.forEach((fn) => fn(msg));
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const once = (method) => new Promise((resolve) => {
    const fn = (msg) => {
      if (msg.method === method) { listeners.splice(listeners.indexOf(fn), 1); resolve(msg.params); }
    };
    listeners.push(fn);
  });
  return new Promise((resolve) => { ws.onopen = () => resolve({ send, once, close: () => ws.close() }); });
}

try {
  await mkdir(OUT_DIR, { recursive: true });
  const target = await cdpTarget();
  const page = await connect(target.webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false,
  });

  for (const slug of slugs) {
    const url = `${BASE}/demos/${slug}/index.html`;
    const loaded = page.once('Page.loadEventFired');
    await page.send('Page.navigate', { url });
    await loaded;
    // Прокручуємо сторінку, щоб підвантажились lazy-картинки, і повертаємось нагору.
    await page.send('Runtime.evaluate', {
      awaitPromise: true,
      expression: `(async () => {
        for (let y = 0; y < Math.min(document.body.scrollHeight, ${MAX_HEIGHT}); y += 600) {
          window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
        }
        window.scrollTo(0, 0); await document.fonts.ready;
        await new Promise(r => setTimeout(r, 800));
      })()`,
    });
    const { cssContentSize } = await page.send('Page.getLayoutMetrics');
    const height = Math.min(Math.ceil(cssContentSize.height), MAX_HEIGHT);
    const { data } = await page.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 72, captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: WIDTH, height, scale: SCALE },
    });
    const file = path.join(OUT_DIR, `${slug}.jpg`);
    await writeFile(file, Buffer.from(data, 'base64'));
    console.log(`✓ ${slug}: ${Math.round(WIDTH * SCALE)}×${Math.round(height * SCALE)} → ${path.relative(process.cwd(), file)}`);
  }
  page.close();
} finally {
  chrome.kill();
  await sleep(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
