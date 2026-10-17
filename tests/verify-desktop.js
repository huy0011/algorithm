/**
 * 验证桌面端：下拉框应该隐藏，导航列表常驻显示。
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
const PORT = 9338;
const TMP = path.join(process.env.TEMP || '/tmp', 'algoviz-desktop');
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
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
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

  for (const w of [1440, 1280, 1024]) {
    console.log(`\n[桌面 ${w}px]`);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: w, height: 900, deviceScaleFactor: 1, mobile: false,
    }, sessionId);
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' }, sessionId);
    await sleep(1800);
    await ev(`document.querySelectorAll('[data-tab]')[1].click()`);
    await sleep(600);

    const state = await ev(`(() => {
      const t = document.getElementById('nav-toggle');
      const b = document.getElementById('nav-body');
      if (!t || !b) return { error: '元素缺失' };
      return {
        toggleDisplay: getComputedStyle(t).display,
        bodyDisplay: getComputedStyle(b).display,
        navItems: document.querySelectorAll('#syntax-nav [data-topic]').length,
        searchDisplay: getComputedStyle(document.getElementById('syntax-search')).display,
      };
    })()`);

    check(state.toggleDisplay === 'none', '下拉框隐藏', `display=${state.toggleDisplay}`);
    check(state.bodyDisplay !== 'none', '导航列表常驻可见', `display=${state.bodyDisplay}`);
    check(state.navItems > 0, '知识点列表已渲染', `${state.navItems} 项`);
    check(state.searchDisplay !== 'none', '搜索框可见');
  }

  // 截图（1440）
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  }, sessionId);
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' }, sessionId);
  await sleep(1800);
  await ev(`document.querySelectorAll('[data-tab]')[1].click()`);
  await sleep(600);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync(path.join(OUT, 'desktop-syntax.png'), Buffer.from(shot.data, 'base64'));
  console.log('\n截图 → tests/screenshots/desktop-syntax.png');

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
