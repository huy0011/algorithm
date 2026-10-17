/**
 * 验证语法页导航抽屉展开后的高度限制。
 * 这是用户反馈的 bug：展开后列表把页面撑满，等于没折叠。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tests', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9337;
const TMP = path.join(process.env.TEMP || '/tmp', 'algoviz-nav');
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
    } catch { /* wait */ }
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

let fails = 0;
const check = (ok, msg, detail) => {
  if (ok) console.log(`  ✓ ${msg}${detail ? '  ' + detail : ''}`);
  else { fails++; console.error(`  ✗ ${msg}${detail ? '  ' + detail : ''}`); }
};

try {
  const ws = new WebSocket(await wsUrl());
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const cdp = new CDP(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  const ev = async (e) => {
    const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
    return r.result.value;
  };

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 408, height: 900, deviceScaleFactor: 3, mobile: true,
  }, sessionId);
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' }, sessionId);
  await sleep(2200);
  await ev(`document.querySelectorAll('[data-tab]')[1].click()`);
  await sleep(600);

  console.log('语法页导航抽屉验证（视口 408x900）\n');

  const closed = await ev(`(() => {
    const b = document.getElementById('nav-body');
    return { display: getComputedStyle(b).display, h: Math.round(b.getBoundingClientRect().height) };
  })()`);
  check(closed.display === 'none', '默认收起（不占空间）', `height=${closed.h}`);

  // 展开
  await ev(`document.getElementById('nav-toggle').click()`);
  await sleep(400);

  const opened = await ev(`(() => {
    const b = document.getElementById('nav-body');
    const r = b.getBoundingClientRect();
    return {
      display: getComputedStyle(b).display,
      height: Math.round(r.height),
      scrollH: b.scrollHeight,
      overflowY: getComputedStyle(b).overflowY,
      vh60: Math.round(window.innerHeight * 0.6),
    };
  })()`);
  console.log('');
  check(opened.display === 'block', '点击后展开');
  check(opened.height <= opened.vh60 + 2,
    '展开高度不超过 60vh（列表内部滚动）',
    `${opened.height}px ≤ ${opened.vh60}px`);
  check(opened.scrollH > opened.height,
    '列表内容可内部滚动', `内容 ${opened.scrollH}px > 可视 ${opened.height}px`);
  check(opened.overflowY === 'auto' || opened.overflowY === 'scroll',
    'overflow-y 已启用', opened.overflowY);

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync(path.join(OUT, 'nav-open-limited.png'), Buffer.from(shot.data, 'base64'));

  // 选中后应自动收起
  await ev(`document.querySelectorAll('#syntax-nav [data-topic]')[3].click()`);
  await sleep(400);
  const after = await ev(`(() => ({
    expanded: document.getElementById('nav-toggle').getAttribute('aria-expanded'),
    current: document.getElementById('nav-toggle-current').textContent.trim(),
    title: document.getElementById('syntax-title').textContent.trim(),
  }))()`);
  console.log('');
  check(after.expanded === 'false', '选中知识点后自动收起');
  check(after.current === after.title, '按钮显示当前知识点', after.current);

  ws.close();
  chrome.kill();

  console.log('');
  if (fails === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
  console.log(`结果：${fails} 项失败 ✗\n`);
  process.exit(1);
} catch (e) {
  console.error('失败:', e.message);
  try { chrome.kill(); } catch { /* ignore */ }
  process.exit(1);
}
