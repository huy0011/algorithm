/**
 * 诊断：手机端可视化页控制区（分类/算法/规模/分布/速度）的布局。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9420;
const TMP = path.join(process.env.TEMP || '/tmp', 'algoviz-ctrl');
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
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval');
  return r.result.value;
};

await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: 390, height: 844, deviceScaleFactor: 3, mobile: true,
}, sessionId);
await cdp.send('Page.navigate', { url: 'http://localhost:5173/' }, sessionId);
await sleep(2400);

console.log('=== 手机端控制区布局 ===\n');

const info = await ev(`(() => {
  const ctrl = document.querySelector('.controls');
  const out = { controls: null, rows: [] };
  if (ctrl) {
    const r = ctrl.getBoundingClientRect();
    const cs = getComputedStyle(ctrl);
    out.controls = {
      w: Math.round(r.width), h: Math.round(r.height),
      display: cs.display, flexDirection: cs.flexDirection,
      gap: cs.gap, padding: cs.padding,
    };
    [...ctrl.children].forEach((el) => {
      const rr = el.getBoundingClientRect();
      const ccs = getComputedStyle(el);
      out.rows.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 26),
        id: el.id || '',
        w: Math.round(rr.width), h: Math.round(rr.height),
        top: Math.round(rr.top), left: Math.round(rr.left),
        display: ccs.display,
        label: (el.textContent || '').trim().slice(0, 14),
      });
    });
  }
  return out;
})()`);

console.log(JSON.stringify(info, null, 1));

// 滚到控制区截图
await ev(`(() => {
  const el = document.querySelector('.controls');
  if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 60);
})()`);
await sleep(600);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
fs.writeFileSync('tests/screenshots/diag-controls-390.png', Buffer.from(shot.data, 'base64'));
console.log('\n截图 → tests/screenshots/diag-controls-390.png');

ws.close();
chrome.kill();
