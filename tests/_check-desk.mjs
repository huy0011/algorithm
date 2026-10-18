/**
 * 检查桌面端「分类 / 数据分布」是否仍是纵向（不应并排）。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9431;
const TMP = path.join(process.env.TEMP || '/tmp', 'algoviz-desk3');
fs.mkdirSync(TMP, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-crash-reporter', '--disable-breakpad', '--no-sandbox',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(TMP, 'p')}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch { /* 等待 */ }
    await sleep(250);
  }
  throw new Error('端口未就绪');
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const p = { id, method, params };
    if (sessionId) p.sessionId = sessionId;
    this.ws.send(JSON.stringify(p));
    return new Promise((res, rej) => this.pending.set(id, { resolve: res, reject: rej }));
  }
}

const ws = new WebSocket(await wsUrl());
await new Promise((res, rej) => {
  ws.addEventListener('open', res);
  ws.addEventListener('error', rej);
});
const cdp = new CDP(ws);
const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
await cdp.send('Page.enable', {}, sessionId);
await cdp.send('Network.enable', {}, sessionId);
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);
await cdp.send('Runtime.enable', {}, sessionId);

const ev = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', {
    expression: expr, returnByValue: true, awaitPromise: true,
  }, sessionId);
  if (r.exceptionDetails) throw new Error('eval failed');
  return r.result.value;
};

for (const vp of [
  { name: '桌面 1440', w: 1440, h: 900 },
  { name: '桌面 1280', w: 1280, h: 900 },
  { name: '平板 768', w: 768, h: 1024 },
  { name: '手机 390', w: 390, h: 844 },
]) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.w < 900,
  }, sessionId);
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' }, sessionId);
  await sleep(2000);

  const r = await ev(`(() => {
    const row = document.querySelector('.group-row');
    const cat = document.getElementById('category-select');
    const shape = document.getElementById('shape-select');
    const sameRow = (cat && shape)
      ? Math.abs(cat.getBoundingClientRect().top - shape.getBoundingClientRect().top) < 4
      : null;
    return {
      rowDisplay: row ? getComputedStyle(row).display : 'none',
      catW: cat ? Math.round(cat.getBoundingClientRect().width) : 0,
      sameRow,
    };
  })()`);

  console.log(`${vp.name}: row=${r.rowDisplay}  分类宽=${r.catW}px  同一行=${r.sameRow}`);
}

ws.close();
chrome.kill();
