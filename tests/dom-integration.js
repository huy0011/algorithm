/**
 * 无浏览器环境下的集成测试。
 *
 * 背景：本机的沙箱策略禁止命名管道，Chrome 的多进程 IPC 起不来，
 * 因此无法用无头浏览器验证。作为替代，这里用最小的 DOM / Canvas 打桩，
 * 在 Node 里把「真实的 app.js」跑起来（不是复制一份逻辑），验证：
 *   1. 页面初始化不抛异常
 *   2. 控件事件都能被正确响应（播放、单步、重置、切算法、改规模、对比）
 *   3. 统计数字与步数同步更新
 *   4. 对比模式跑遍 7 种算法且结果全部正确
 *   5. 渲染层真的往 canvas 上画了东西
 *
 * 用法：node tests/integration.js
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

// ============ 1. 从 index.html 提取真实存在的 id，构造 DOM 桩 ============
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const htmlIds = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);

/** 记录所有绘制调用，用来确认「确实画了」。 */
const drawCalls = [];

function makeCtx() {
  return {
    canvas: null,
    setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, closePath() {}, stroke() {},
    rect() {}, fill() { drawCalls.push('fill'); },
    fillRect() { drawCalls.push('fillRect'); },
    fillText(t) { drawCalls.push('fillText:' + t); },
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
  };
}

class StubElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    this.className = '';
    this.classList = {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, on) { on ? this._set.add(c) : this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    };
    this._listeners = {};
    this.children = [];
  }
  addEventListener(type, fn) { (this._listeners[type] ||= []).push(fn); }
  /** 模拟用户交互 */
  dispatch(type, extra = {}) {
    const ev = { type, target: this, preventDefault() {}, stopPropagation() {}, ...extra };
    (this._listeners[type] || []).forEach((fn) => fn(ev));
  }
  click() { this.dispatch('click'); }
  getBoundingClientRect() { return { width: 900, height: 400, top: 0, left: 0 }; }
  getContext() { return (this._ctx ||= makeCtx()); }
  querySelectorAll(sel) { return this._qsa ? this._qsa(sel) : []; }
  appendChild(c) { this.children.push(c); }
}

const elements = new Map();
function el(id, tag) {
  if (!elements.has(id)) elements.set(id, new StubElement(id, tag));
  return elements.get(id);
}

for (const id of htmlIds) {
  const tag = id === 'canvas' ? 'canvas'
    : id.includes('select') ? 'select'
      : id.includes('range') ? 'input'
        : id.includes('btn') ? 'button'
          : 'div';
  el(id, tag);
}

// 应用启动时读取的初始值，与 index.html 里写的一致
el('size-range').value = '40';
el('speed-range').value = '25';
el('shape-select').value = 'random';
el('algo-select').value = 'bubble';

const tableBody = el('compare-table-body');
let tableRows = [];
tableBody._qsa = () => tableRows;

globalThis.document = {
  readyState: 'complete',
  getElementById: (id) => elements.get(id) || null,
  addEventListener() {},
  createElement: (tag) => new StubElement('', tag),
};
globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

// ============ 2. 加载真实的 app.js ============
console.log('集成测试（无浏览器，用 DOM 桩跑真实 app.js）\n' + '='.repeat(54));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let initError = null;
try {
  await import(pathToFileURL(path.join(ROOT, 'src', 'app.js')).href);
} catch (e) {
  initError = e;
}

console.log('\n[1] 初始化');
assert(!initError, initError ? `初始化抛异常：${initError.message}\n${initError.stack}` : 'app.js 加载并初始化成功');
if (initError) { console.error('\n初始化失败，后续测试跳过'); process.exit(1); }

// 界面为了可读性会给步数加千位分隔符（如 "1,241 / 3,006"），解析时要去掉
const parseNum = (s) => Number(String(s).replace(/,/g, '').trim());
const stepCount = () => parseNum(el('step-label').textContent.split('/')[0]);
const stepTotal = () => parseNum(el('step-label').textContent.split('/')[1]);
const stepFormatOk = () => /^[\d,]+ \/ [\d,]+$/.test(el('step-label').textContent);

// ============ 3. 初始状态 ============
console.log('\n[2] 首次渲染');
assert(drawCalls.length > 0, `画布产生了 ${drawCalls.length} 次绘制调用`);
assert(el('algo-select').innerHTML.includes('冒泡排序'), '算法下拉框已填充');
assert(el('stat-comparisons').textContent === '0', `初始比较次数为 0（实际 ${el('stat-comparisons').textContent}）`);
const initialStep = el('step-label').textContent;
assert(stepFormatOk(), `步数显示格式正确：${initialStep}`);
const totalSteps = stepTotal();
assert(totalSteps > 0, `冒泡排序 40 个元素产生 ${totalSteps} 步操作`);

// ============ 4. 播放控制 ============
console.log('\n[3] 播放控制');
el('btn-play').click(); // 首屏有自动播放，先暂停
await sleep(60);

el('btn-step').click();
await sleep(150);
const afterOneStep = stepCount();
assert(afterOneStep >= 1, `单步后步数前进到 ${afterOneStep}`);

el('btn-skip').click();
await sleep(150);
assert(stepCount() === totalSteps, `「直接看结果」跳到末步：${el('step-label').textContent}`);
assert(el('progress').style.width === '100.0%', `进度条到 100%（实际 ${el('progress').style.width}）`);
assert(Number(el('stat-comparisons').textContent.replace(/,/g, '')) > 0, '比较次数已更新为正值');
assert(Number(el('stat-swaps').textContent.replace(/,/g, '')) > 0, '交换次数已更新为正值');

el('btn-reset').click();
await sleep(80);
assert(stepCount() === 0, '重置回到第 0 步');

// ============ 5. 切换算法 ============
console.log('\n[4] 切换算法');
const algoMod = await import(pathToFileURL(path.join(ROOT, 'src', 'algorithms', 'index.js')).href);
for (const id of ['selection', 'insertion', 'shell', 'merge', 'quick', 'heap']) {
  const sel = el('algo-select');
  sel.value = id;
  sel.dispatch('change');
  await sleep(30);
  const name = el('algo-name').textContent;
  assert(Boolean(name) && stepFormatOk(),
    `切换到 ${id} → ${name}，步数 ${el('step-label').textContent}`);
}

// ============ 6. 数据规模与分布 ============
console.log('\n[5] 数据规模与分布');
el('size-range').value = '120';
el('size-range').dispatch('input');
el('size-range').dispatch('change');
await sleep(80);
assert(stepCount() === 0, '改规模后自动重置到第 0 步');
assert(stepTotal() > 100, `120 个元素产生 ${stepTotal()} 步`);

for (const shape of ['nearly', 'reversed', 'few', 'random']) {
  el('shape-select').value = shape;
  el('shape-select').dispatch('change');
  await sleep(40);
  assert(stepFormatOk(), `分布 ${shape} 切换正常`);
}

// ============ 7. 对比模式 ============
console.log('\n[6] 对比全部算法');
Object.defineProperty(tableBody, 'innerHTML', {
  set(v) {
    this._html = v;
    const n = (v.match(/<tr/g) || []).length;
    tableRows = Array.from({ length: n }, () => ({
      classList: { remove() {}, add() {}, toggle() {}, contains: () => false },
      querySelectorAll: () => [],
    }));
  },
  get() { return this._html || ''; },
});

el('btn-compare').click();
await sleep(250);
assert(tableRows.length === 7, `对比表渲染出 7 行（实际 ${tableRows.length}）`);
assert(!tableBody.innerHTML.includes('结果异常'), '对比结果无「结果异常」标记（7 种算法结果全部正确）');
assert(tableBody.innerHTML.includes('冒泡排序') && tableBody.innerHTML.includes('堆排序'), '对比表包含全部算法名称');
assert(el('btn-compare').textContent.includes('全部正确'), `按钮反馈：${el('btn-compare').textContent}`);

// ============ 8. 效率差异确实可见 ============
console.log('\n[7] 效率差异');
for (const n of [20, 50, 100]) {
  const data = Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 1);
  const slowest = algoMod.ALGORITHMS.bubble.run(data).stats.comparisons;
  const fastest = algoMod.ALGORITHMS.quick.run(data).stats.comparisons;
  assert(slowest > fastest, `n=${n}：冒泡比较 ${slowest} 次 > 快排 ${fastest} 次`);
}

console.log('\n' + '='.repeat(54));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
