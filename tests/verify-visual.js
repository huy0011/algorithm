/**
 * 真实浏览器移动端布局验证。
 *
 * 之前一直无法验证视觉效果（沙箱限制）。现在无头 Chrome 可以启动了，
 * 用 CDP 模拟真实手机视口，截图 + 检测布局问题。
 *
 * 检查项：
 *   1. 页面是否横向溢出（document.scrollWidth > innerWidth）
 *   2. 画布是否被任何 fixed/sticky 元素遮挡
 *   3. 关键元素的实际盒子尺寸是否合理
 *
 * 用法：node tests/verify-visual.js
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
const PORT = 9334;
const TMP = path.join(process.env.TEMP || '/tmp', 'algoviz-visual');
fs.mkdirSync(TMP, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-crash-reporter',
  '--disable-breakpad',
  '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(TMP, 'profile')}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch { /* 继续等 */ }
    await sleep(250);
  }
  throw new Error('Chrome 调试端口未就绪');
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

let failures = 0;
const assert = (cond, msg, detail) => {
  if (cond) console.log(`  ✓ ${msg}${detail ? '  ' + detail : ''}`);
  else { failures++; console.error(`  ✗ ${msg}${detail ? '  ' + detail : ''}`); }
};

const url = process.argv[2] || 'http://localhost:5173/';

// 模拟 iPhone 12：390 x 844，DPR 3
const DEVICES = [
  { name: 'phone-390', width: 390, height: 844, dpr: 3, mobile: true },
  { name: 'phone-360', width: 360, height: 780, dpr: 3, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, dpr: 2, mobile: true },
];

try {
  const ws = new WebSocket(await wsUrl());
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });
  const cdp = new CDP(ws);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  const evalJs = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true,
    }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
    return r.result.value;
  };

  console.log('真实浏览器移动端验证\n' + '='.repeat(58));

  for (const dev of DEVICES) {
    console.log(`\n[${dev.name}]  ${dev.width}x${dev.height}`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: dev.width,
      height: dev.height,
      deviceScaleFactor: dev.dpr,
      mobile: dev.mobile,
    }, sessionId);

    await cdp.send('Page.navigate', { url }, sessionId);
    await sleep(2200);

    // ---- 1. 横向溢出 ----
    const metrics = await evalJs(`(() => {
      const d = document.documentElement;
      return {
        scrollWidth: d.scrollWidth,
        clientWidth: d.clientWidth,
        innerWidth: window.innerWidth,
        bodyScrollWidth: document.body.scrollWidth,
      };
    })()`);

    assert(metrics.scrollWidth <= metrics.clientWidth + 1,
      '无横向溢出',
      `scrollWidth=${metrics.scrollWidth} clientWidth=${metrics.clientWidth}`);

    // ---- 2. 找出所有撑宽的元素 ----
    const wideEls = await evalJs(`(() => {
      const vw = document.documentElement.clientWidth;
      const out = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > vw + 1 && r.height > 0) {
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 40),
            id: el.id || '',
            w: Math.round(r.width),
          });
        }
      });
      return out.slice(0, 6);
    })()`);
    assert(wideEls.length === 0,
      '没有元素超出视口宽度',
      wideEls.length ? JSON.stringify(wideEls) : '');

    // ---- 3. 画布是否被遮挡 ----
    const canvasInfo = await evalJs(`(() => {
      const c = document.getElementById('canvas');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      // 检查画布中心点上方是否有其他元素覆盖
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const topEl = document.elementFromPoint(cx, cy);
      // 画布顶部 20% 处也检查一次
      const topEl2 = document.elementFromPoint(cx, r.top + r.height * 0.15);
      return {
        rect: { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
        centerIsCanvas: topEl === c,
        topIsCanvas: topEl2 === c,
        topCoveredBy: topEl2 && topEl2 !== c ? (topEl2.id || topEl2.className || topEl2.tagName) : null,
      };
    })()`);

    if (canvasInfo) {
      assert(canvasInfo.centerIsCanvas, '画布中心未被遮挡', canvasInfo.topCoveredBy || '');
      assert(canvasInfo.topIsCanvas, '画布顶部未被遮挡', canvasInfo.topCoveredBy || '');
      assert(canvasInfo.rect.w >= dev.width * 0.82,
        '画布宽度占视口 82% 以上',
        `${canvasInfo.rect.w}/${dev.width}`);
      assert(canvasInfo.rect.h >= 180,
        '画布高度合理（≥180px）',
        `${canvasInfo.rect.h}px`);
    }

    // ---- 4. 顶栏是否吸顶 ----
    const topbarPos = await evalJs(`(() => {
      const t = document.querySelector('.topbar');
      return t ? getComputedStyle(t).position : 'none';
    })()`);
    if (dev.width <= 560) {
      assert(topbarPos === 'static', '手机端顶栏不吸顶（避免遮挡画布）', `position=${topbarPos}`);
    }

    // ---- 截图 ----
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(OUT, `mobile-${dev.name}.png`), Buffer.from(shot.data, 'base64'));
    console.log(`   截图 → tests/screenshots/mobile-${dev.name}.png`);
  }

  // ---- 切到语法页也检查一次 ----
  console.log('\n[语法页 390]');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 3, mobile: true,
  }, sessionId);
  await cdp.send('Page.navigate', { url }, sessionId);
  await sleep(1800);
  await evalJs(`document.querySelectorAll('[data-tab]')[1].click()`);
  await sleep(800);

  const syntaxMetrics = await evalJs(`(() => {
    const d = document.documentElement;
    return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth };
  })()`);
  assert(syntaxMetrics.scrollWidth <= syntaxMetrics.clientWidth + 1,
    '语法页无横向溢出', `scrollWidth=${syntaxMetrics.scrollWidth}`);

  const shot2 = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync(path.join(OUT, 'mobile-syntax.png'), Buffer.from(shot2.data, 'base64'));
  console.log('   截图 → tests/screenshots/mobile-syntax.png');

  ws.close();
  chrome.kill();

  console.log('\n' + '='.repeat(58));
  if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
  console.log(`结果：${failures} 项失败 ✗\n`);
  process.exit(1);
} catch (e) {
  console.error('验证崩溃:', e.message);
  try { chrome.kill(); } catch { /* 忽略 */ }
  process.exit(1);
}
