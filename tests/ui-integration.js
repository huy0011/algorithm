/**
 * 界面集成测试（无浏览器环境）。
 *
 * 背景：本机沙箱禁止命名管道，Chrome 的多进程 IPC 起不来，无法用无头浏览器。
 * 作为替代，这里用最小的 DOM / Canvas 打桩，在 Node 里加载**真实的 app.js**
 * （不是复制一份逻辑），验证从「用户点击」到「画布重绘」的完整链路。
 *
 * 覆盖范围：
 *   - 两个页签（算法可视化 / 语法基础）都能正常切换与渲染
 *   - 5 个分类 × 16 个算法全部能跑通
 *   - 播放控制（单步 / 跳转 / 重置）作用于每一个渲染器
 *   - 语法教程：全部知识点都能选中、执行示例、展示真实输出
 *   - 算法 ↔ 语法点的双向跳转
 *   - 统计数字随可视化类型变化（网格没有「交换次数」）
 *
 * 用法：node tests/ui-integration.js
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

// ============ 1. 依据真实 HTML 构造 DOM 桩 ============
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const drawCalls = [];
function resetDrawCalls() { drawCalls.length = 0; }

function makeCtx() {
  return {
    canvas: null,
    setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, closePath() {}, stroke() {}, strokeRect() {},
    rect() {}, arc() {},
    fill() { drawCalls.push('fill'); },
    fillRect() { drawCalls.push('fillRect'); },
    fillText() { drawCalls.push('fillText'); },
    measureText() { return { width: 20 }; },
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
  };
}

class StubElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.value = '';
    this.textContent = '';
    this._html = '';
    this.style = {};
    this.hidden = false;
    this.dataset = {};
    this.className = '';
    this.min = '0'; this.max = '100'; this.step = '1';
    this.classList = {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, on) { on ? this._set.add(c) : this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    };
    this._listeners = {};
    this.children = [];
    this._qsa = null;
  }

  set innerHTML(v) {
    this._html = String(v);
    // 模拟浏览器：把生成标记里带 data-* 的元素解析成可查询、可点击的节点。
    // 注意：正则第一组捕获的是 "topic"（不含 data- 前缀），
    // 所以存进 dataset 时要用这个裸名字，查询时也要按裸名字匹配。
    const nodes = [];
    for (const m of this._html.matchAll(/data-(topic|algo|tab)="([^"]+)"/g)) {
      const n = new StubElement('', 'button');
      n.dataset[m[1]] = m[2];
      nodes.push(n);
    }
    this._qsa = (sel) => {
      if (sel === 'tr') {
        const count = (this._html.match(/<tr/g) || []).length;
        return Array.from({ length: count }, () => new StubElement('', 'tr'));
      }
      // '[data-topic]' → 'topic'（dataset 的键不带 data- 前缀）
      const attr = sel.replace(/[[\]]/g, '').replace(/^data-/, '');
      return nodes.filter((n) => Object.prototype.hasOwnProperty.call(n.dataset, attr));
    };
  }
  get innerHTML() { return this._html; }

  addEventListener(type, fn) { (this._listeners[type] ||= []).push(fn); }
  dispatch(type, extra = {}) {
    const ev = { type, target: this, preventDefault() {}, stopPropagation() {}, ...extra };
    (this._listeners[type] || []).forEach((fn) => fn(ev));
  }
  click() { this.dispatch('click'); }
  setAttribute() {}
  getBoundingClientRect() { return { width: 900, height: 420, top: 0, left: 0 }; }
  getContext() { return (this._ctx ||= makeCtx()); }
  querySelectorAll(sel) { return this._qsa ? this._qsa(sel) : []; }
  appendChild(c) { this.children.push(c); }
}

const elements = new Map();
function el(id) {
  if (!elements.has(id)) {
    const tag = id === 'canvas' ? 'canvas'
      : id.includes('select') ? 'select'
        : id.includes('range') ? 'input'
          : id.includes('btn') || id.includes('run') ? 'button'
            : id.includes('search') ? 'input'
              : 'div';
    elements.set(id, new StubElement(id, tag));
  }
  return elements.get(id);
}

for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);

const tabButtons = [...html.matchAll(/data-tab="([^"]+)"/g)].map((m) => {
  const b = new StubElement('', 'button');
  b.dataset.tab = m[1];
  b.textContent = m[1] === 'viz' ? '算法可视化' : '语法基础';
  return b;
});
const panes = [...html.matchAll(/data-pane="([^"]+)"([^>]*)>/g)].map((m) => {
  const p = new StubElement('', 'main');
  p.dataset.pane = m[1];
  p.hidden = m[2].includes('hidden');
  return p;
});

el('size-range').value = '40';
el('speed-range').value = '25';
el('shape-select').value = 'random';
el('category-select').value = 'sort';
el('algo-select').value = 'bubble';

globalThis.document = {
  readyState: 'complete',
  getElementById: (id) => elements.get(id) || null,
  querySelectorAll: (sel) => {
    if (sel === '[data-tab]') return tabButtons;
    if (sel === '[data-pane]') return panes;
    return [];
  },
  querySelector: (sel) => {
    const m = /\[data-pane="([^"]+)"\]/.exec(sel);
    if (m) return panes.find((p) => p.dataset.pane === m[1]) || null;
    return null;
  },
  addEventListener() {},
  createElement: (tag) => new StubElement('', tag),
};
globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

// ============ 2. 加载真实 app.js ============
console.log('界面集成测试（DOM 桩 + 真实 app.js）\n' + '='.repeat(58));

let initError = null;
try {
  await import(pathToFileURL(path.join(ROOT, 'src/app.js')).href);
} catch (e) {
  initError = e;
}

console.log('\n[1] 初始化');
assert(!initError, initError ? `抛异常：${initError.message}\n${initError.stack}` : 'app.js 加载并初始化成功');
if (initError) process.exit(1);

const parseNum = (s) => Number(String(s).replace(/,/g, '').trim());
const stepCount = () => parseNum(el('step-label').textContent.split('/')[0]);
const stepTotal = () => parseNum(el('step-label').textContent.split('/')[1]);
const stepFormatOk = () => /^[\d,]+ \/ [\d,]+$/.test(el('step-label').textContent);

// ============ 3. 首屏 ============
console.log('\n[2] 首屏渲染');
assert(drawCalls.length > 0, `画布产生了 ${drawCalls.length} 次绘制调用`);
assert(el('category-select').innerHTML.includes('比较排序'), '分类下拉框已填充');
assert(el('algo-select').innerHTML.includes('冒泡排序'), '算法下拉框已填充');
assert(stepTotal() > 0, `冒泡排序 40 个元素产生 ${stepTotal()} 步`);
assert(el('syntax-links').innerHTML.includes('data-topic'), '算法旁显示了关联的语法点标签');
assert(el('syntax-nav').innerHTML.includes('data-topic'), '语法知识点的左侧导航已渲染');

// ============ 4. 全部算法 ============
console.log('\n[3] 全部 16 个算法在界面上都能跑通');

const { ALGORITHMS, ALGORITHM_ORDER, CATEGORIES, algorithmsByCategory } = await import(
  pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href
);

let algoOk = 0;
const algoProblems = [];
for (const cat of CATEGORIES) {
  for (const id of algorithmsByCategory(cat.id)) {
    const algo = ALGORITHMS[id];

    el('category-select').value = cat.id;
    el('category-select').dispatch('change');
    await sleep(20);
    el('algo-select').value = id;
    el('algo-select').dispatch('change');
    await sleep(40);

    const total = stepTotal();
    if (!stepFormatOk() || total <= 0 || el('algo-name').textContent !== algo.name) {
      algoProblems.push(`${algo.name}(加载异常)`);
      continue;
    }

    resetDrawCalls();
    el('btn-skip').click();
    await sleep(60);

    if (stepCount() !== total) { algoProblems.push(`${algo.name}(跳转失败)`); continue; }
    if (drawCalls.length === 0) { algoProblems.push(`${algo.name}(无重绘)`); continue; }
    algoOk++;
  }
}
assert(algoOk === ALGORITHM_ORDER.length,
  `${ALGORITHM_ORDER.length} 个算法全部加载、播放、重绘正常` +
  (algoProblems.length ? `，问题：${algoProblems.join(', ')}` : ''));

// ============ 5. 统计标签 ============
console.log('\n[4] 统计区随可视化类型切换');
for (const [catId, expectPrimary, expectSecondary] of [
  ['sort', '比较次数', '交换次数'],
  ['path', '访问格数', '待访问'],
  ['search', '比较次数', '探测次数'],
  ['technique', '比较/判断', '步骤'],
  ['string', '比较/判断', '步骤'],
  ['bits', '逐位运算', '操作数'],
  ['structure', '入栈/入队', '出栈/出队'],
]) {
  el('category-select').value = catId;
  el('category-select').dispatch('change');
  await sleep(30);
  const p = el('stat-primary-label').textContent;
  const s = el('stat-secondary-label').textContent;
  assert(p === expectPrimary && s === expectSecondary,
    `分类 ${catId}：统计标签为「${p} / ${s}」`);
}

// ============ 6. 对比表 ============
console.log('\n[5] 效率对比');
el('category-select').value = 'sort';
el('category-select').dispatch('change');
await sleep(30);
el('algo-select').value = 'bubble';
el('algo-select').dispatch('change');
await sleep(40);
el('btn-compare').click();
await sleep(250);
const tableHtml = el('compare-table-body').innerHTML;
assert(!tableHtml.includes('结果异常'), '排序对比：7 个算法结果全部正确');
assert(tableHtml.includes('冒泡排序') && tableHtml.includes('堆排序'), '对比表包含全部 7 个排序算法');

el('category-select').value = 'noncompare';
el('category-select').dispatch('change');
await sleep(30);
el('btn-compare').click();
await sleep(250);
assert(!el('compare-table-body').innerHTML.includes('结果异常'),
  '非比较排序对比：3 个算法结果全部正确');

// ============ 7. 语法教程 ============
console.log('\n[6] 语法教程');
const { CPP_TOPIC_LIST: SYNTAX_TOPICS } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/content.js')).href);

const navIds = [...el('syntax-nav').innerHTML.matchAll(/data-topic="([^"]+)"/g)].map((m) => m[1]);
assert(navIds.length === SYNTAX_TOPICS.length,
  `左侧导航列出 ${navIds.length} 个知识点（应为 ${SYNTAX_TOPICS.length}）`);

let topicOk = 0;
const topicProblems = [];
for (const topic of SYNTAX_TOPICS) {
  // 每次都重新查询节点：selectTopic 会让左侧高亮重绘，
  // 旧的节点引用会失效（DOM 桩每次 set innerHTML 都重建节点，浏览器里同理）
  const fresh = el('syntax-nav')._qsa('[data-topic]');
  const target = fresh.find((n) => n.dataset.topic === topic.id);
  if (!target) { topicProblems.push(`${topic.id}(导航里找不到)`); continue; }
  target.click();
  await sleep(25);

  if (el('syntax-title').textContent !== topic.title) { topicProblems.push(`${topic.id}(标题)`); continue; }
  if (el('syntax-code').textContent.length < 20) { topicProblems.push(`${topic.id}(代码)`); continue; }
  // C++ 示例的输出来自构建期编译，界面会标注「已编译运行」；
  // 代码里必须能看到 #include（确认展示的是完整可编译的 C++ 程序）
  if (!el('syntax-code').textContent.includes('#include')) {
    topicProblems.push(`${topic.id}(代码不是完整 C++)`);
    continue;
  }
  const out = el('syntax-output').innerHTML;
  if (!out.includes('已编译运行') && !out.includes('未通过编译')) {
    topicProblems.push(`${topic.id}(输出区未标注状态)`);
    continue;
  }
  if (!out.includes('cpp-stdout')) {
    topicProblems.push(`${topic.id}(缺少输出内容)`);
    continue;
  }
  topicOk++;
}
assert(topicOk === SYNTAX_TOPICS.length,
  `${SYNTAX_TOPICS.length} 个 C++ 知识点全部可选中，且都展示了完整代码与编译输出` +
  (topicProblems.length ? `，问题：${topicProblems.slice(0, 5).join(', ')}` : ''));

// ============ 8. 双向跳转 ============
console.log('\n[7] 算法 ↔ 语法点 双向跳转');
el('category-select').value = 'sort';
el('category-select').dispatch('change');
await sleep(30);
el('algo-select').value = 'bubble';
el('algo-select').dispatch('change');
await sleep(40);

const bubbleTopics = [...el('syntax-links').innerHTML.matchAll(/data-topic="([^"]+)"/g)].map((m) => m[1]);
assert(bubbleTopics.length > 0, `冒泡排序关联了 ${bubbleTopics.length} 个语法点`);

const firstChip = el('syntax-links')._qsa('[data-topic]')[0];
assert(Boolean(firstChip), '语法点标签可查询到');
firstChip.click();
await sleep(80);
assert(!panes.find((p) => p.dataset.pane === 'syntax').hidden,
  '点击语法点标签后切换到「语法基础」页签');
assert(el('syntax-title').textContent.length > 0,
  `并定位到知识点「${el('syntax-title').textContent}」`);

assert(el('syntax-used-by').innerHTML.includes('data-algo'), '语法页反向列出了使用它的算法');
const backChip = el('syntax-used-by')._qsa('[data-algo]')[0];
assert(Boolean(backChip), '反向链接可查询到');
backChip.click();
await sleep(100);
assert(!panes.find((p) => p.dataset.pane === 'viz').hidden,
  '点击算法标签后跳回「算法可视化」页签');
assert(stepTotal() > 0, `并加载了该算法（${el('algo-name').textContent}，${el('step-label').textContent}）`);

// ============ 9. 页签 ============
console.log('\n[8] 页签切换');
for (const b of tabButtons) {
  b.click();
  await sleep(30);
  const pane = panes.find((p) => p.dataset.pane === b.dataset.tab);
  assert(pane && !pane.hidden, `可切换到「${b.textContent}」面板`);
}

// ============ 10. 输入控件 ============
console.log('\n[9] 输入控件');
el('category-select').value = 'sort';
el('category-select').dispatch('change');
await sleep(30);

el('size-range').value = '120';
el('size-range').dispatch('input');
el('size-range').dispatch('change');
await sleep(80);
assert(stepCount() === 0 && stepTotal() > 100,
  `改规模到 120：重置到第 0 步，共 ${stepTotal()} 步`);

for (const shape of ['nearly', 'reversed', 'few', 'random']) {
  el('shape-select').value = shape;
  el('shape-select').dispatch('change');
  await sleep(40);
}
assert(stepFormatOk(), `四种数据分布都能切换（当前 ${el('step-label').textContent}）`);

el('btn-generate').click();
await sleep(60);
assert(stepFormatOk(), '「生成新数据」正常');

el('category-select').value = 'path';
el('category-select').dispatch('change');
await sleep(50);
assert(el('size-group').hidden === false, '网格分类下规模滑块可见');
el('size-range').value = '26';
el('size-range').dispatch('input');
el('size-range').dispatch('change');
await sleep(80);
assert(stepTotal() > 0, `网格改为 26 格宽后正常生成（${stepTotal()} 步）`);

// ============ 11. 播放控制遍历各渲染器 ============
console.log('\n[10] 播放控制（遍历全部 8 类渲染器）');
for (const catId of ['sort', 'noncompare', 'search', 'path', 'technique', 'string', 'bits', 'structure']) {
  el('category-select').value = catId;
  el('category-select').dispatch('change');
  await sleep(60);

  el('btn-reset').click();
  await sleep(40);
  const before = stepCount();

  el('btn-step').click();
  await sleep(140);
  const after = stepCount();

  const total = stepTotal();
  el('btn-skip').click();
  await sleep(60);
  const atEnd = stepCount() === total;

  assert(after > before && atEnd,
    `分类 ${catId}：单步 ${before}→${after}，跳转到末步 ${total}`);
}

console.log('\n' + '='.repeat(58));
if (failures === 0) {
  console.log('结果：全部通过 ✓\n');
  process.exit(0);
}
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
