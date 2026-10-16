/**
 * 真题展示验证。
 *
 * 单独写这个测试的原因：data 层（problems.js）和渲染层（app.js 的 renderLuogu）
 * 都对，不代表页面上真的显示了 —— 中间可能漏传参数、class 拼错、
 * 或者被其它分支提前 return 掉。
 *
 * 这里用 DOM 桩加载真实 app.js，检查渲染出来的 HTML 里
 * 确实含题目链接、题号、标题。
 *
 * 用法：node tests/verify-problems-ui.js
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.error(`  ✗ ${msg}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- DOM 桩 ----------
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function makeCtx() {
  return new Proxy({}, {
    get(t, k) { if (k === 'measureText') return () => ({ width: 20 }); return () => {}; },
    set() { return true; },
  });
}

class El {
  constructor(id, tag = 'div') {
    this.id = id; this.tagName = tag.toUpperCase();
    this.value = ''; this.textContent = ''; this._html = '';
    this.style = {}; this.hidden = false; this.dataset = {}; this.className = '';
    this.min = '0'; this.max = '100'; this.step = '1';
    this.classList = { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c, o) { o ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } };
    this._listeners = {}; this._qsa = null;
  }
  set innerHTML(v) {
    this._html = String(v);
    const nodes = [];
    for (const m of this._html.matchAll(/data-(topic|algo|tab)="([^"]+)"/g)) {
      const n = new El('', 'button'); n.dataset[m[1]] = m[2]; nodes.push(n);
    }
    this._qsa = (sel) => {
      if (sel === 'tr') return [];
      const attr = sel.replace(/[[\]]/g, '').replace(/^data-/, '');
      return nodes.filter((n) => Object.prototype.hasOwnProperty.call(n.dataset, attr));
    };
  }
  get innerHTML() { return this._html; }
  addEventListener(t, f) { (this._listeners[t] ||= []).push(f); }
  dispatch(t, e = {}) { (this._listeners[t] || []).forEach((f) => f({ type: t, target: this, preventDefault() {}, ...e })); }
  click() { this.dispatch('click'); }
  setAttribute() {}
  getBoundingClientRect() { return { width: 900, height: 420, top: 0, left: 0 }; }
  getContext() { return (this._ctx ||= makeCtx()); }
  querySelectorAll(s) { return this._qsa ? this._qsa(s) : []; }
  appendChild() {}
}

const els = new Map();
const el = (id) => {
  if (!els.has(id)) {
    const tag = id === 'canvas' ? 'canvas' : id.includes('select') ? 'select' : id.includes('range') ? 'input' : (id.includes('btn') || id.includes('run')) ? 'button' : id.includes('search') ? 'input' : 'div';
    els.set(id, new El(id, tag));
  }
  return els.get(id);
};
for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);

const tabs = [...html.matchAll(/data-tab="([^"]+)"/g)].map((m) => { const b = new El('', 'button'); b.dataset.tab = m[1]; return b; });
const panes = [...html.matchAll(/data-pane="([^"]+)"([^>]*)>/g)].map((m) => { const p = new El('', 'main'); p.dataset.pane = m[1]; p.hidden = m[2].includes('hidden'); return p; });

el('size-range').value = '40';
el('speed-range').value = '25';
el('shape-select').value = 'random';
el('category-select').value = 'sort';
el('algo-select').value = 'bubble';

globalThis.document = {
  readyState: 'complete',
  getElementById: (id) => els.get(id) || null,
  querySelectorAll: (s) => (s === '[data-tab]' ? tabs : s === '[data-pane]' ? panes : []),
  querySelector: (s) => { const m = /\[data-pane="([^"]+)"\]/.exec(s); return m ? panes.find((p) => p.dataset.pane === m[1]) || null : null; },
  addEventListener() {},
  createElement: (t) => new El('', t),
};
globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 0);
globalThis.cancelAnimationFrame = (i) => clearTimeout(i);

// ---------- 加载 app ----------
console.log('真题展示验证（DOM 桩 + 真实 app.js）\n' + '='.repeat(58));

let initError = null;
try {
  await import(pathToFileURL(path.join(ROOT, 'src/app.js')).href);
} catch (e) { initError = e; }

assert(!initError, initError ? `初始化失败：${initError.message}` : 'app.js 加载成功');
if (initError) process.exit(1);
await sleep(120);

// ---------- 检查语法页的真题 ----------
console.log('\n[1] 语法页真题展示');
const syntaxHtml = el('syntax-luogu').innerHTML;
assert(syntaxHtml.includes('problem-list'), '渲染出了真题列表容器');
assert(syntaxHtml.includes('problem-id'), '包含题号元素');
assert(/href="https:\/\/www\.luogu\.com\.cn\/problem\/[A-Z]?\d+"/.test(syntaxHtml), '包含指向具体题目的链接');
assert(syntaxHtml.includes('配套题单') || syntaxHtml.includes('training/'), '包含题单入口');

const syntaxProblemIds = [...syntaxHtml.matchAll(/problem-id">([^<]+)</g)].map((m) => m[1]);
assert(syntaxProblemIds.length > 0, `当前知识点展示了 ${syntaxProblemIds.length} 道真题：${syntaxProblemIds.join(', ')}`);

// ---------- 遍历所有知识点，确认都能显示真题 ----------
console.log('\n[2] 遍历全部知识点');
const { CPP_TOPIC_LIST } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/content.js')).href);

let shown = 0;
const noShow = [];
for (const topic of CPP_TOPIC_LIST) {
  const navNodes = el('syntax-nav')._qsa('[data-topic]');
  const target = navNodes.find((n) => n.dataset.topic === topic.id);
  if (!target) { noShow.push(`${topic.id}(导航缺失)`); continue; }
  target.click();
  await sleep(12);
  const h = el('syntax-luogu').innerHTML;
  const ids = [...h.matchAll(/problem-id">([^<]+)</g)].map((m) => m[1]);
  if (ids.length === 0) { noShow.push(`${topic.title}(无真题)`); continue; }
  shown++;
}
assert(noShow.length === 0,
  noShow.length ? `这些知识点没显示真题：${noShow.slice(0, 6).join(', ')}` : `全部 ${CPP_TOPIC_LIST.length} 个知识点都展示了真题`);

// ---------- 算法页的真题 ----------
console.log('\n[3] 算法页真题展示');
let algoShown = 0;
const algoNoShow = [];
const { ALGORITHM_ORDER, ALGORITHMS, CATEGORIES, algorithmsByCategory } = await import(
  pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href
);

for (const cat of CATEGORIES) {
  for (const algoId of algorithmsByCategory(cat.id)) {
    el('category-select').value = cat.id;
    el('category-select').dispatch('change');
    await sleep(15);
    el('algo-select').value = algoId;
    el('algo-select').dispatch('change');
    await sleep(25);

    const h = el('algo-luogu').innerHTML;
    const ids = [...h.matchAll(/problem-id">([^<]+)</g)].map((m) => m[1]);
    if (ids.length === 0) { algoNoShow.push(ALGORITHMS[algoId].name); continue; }
    algoShown++;
  }
}
assert(algoNoShow.length === 0,
  algoNoShow.length
    ? `这些算法没显示真题：${algoNoShow.join(', ')}`
    : `全部 ${ALGORITHM_ORDER.length} 个算法都展示了真题`);

// ---------- 抽查一道题的内容是否合理 ----------
console.log('\n[4] 抽查');
const { CPP_TOPIC_BY_ID } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/content.js')).href);
const helloTopic = CPP_TOPIC_BY_ID['cpp-hello'];
assert(helloTopic.problems.some((p) => p.id === 'B2002' || p.id === 'P1000'),
  `Hello World 的真题含经典入门题：${helloTopic.problems.map((p) => p.id).join(', ')}`);
assert(helloTopic.problems.every((p) => p.url.startsWith('https://www.luogu.com.cn/problem/')),
  '所有题目链接都指向洛谷题目页');

console.log('\n' + '='.repeat(58));
console.log(`知识点 ${shown}/${CPP_TOPIC_LIST.length} · 算法 ${algoShown}/${ALGORITHM_ORDER.length}`);
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
