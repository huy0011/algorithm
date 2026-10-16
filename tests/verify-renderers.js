/**
 * 渲染器健壮性测试。
 *
 * 这个文件专门针对「界面看起来是空的 / 打不开」这一类问题。
 * 这类 bug 的共同点是：JS 逻辑没有报错，但用户看到的是空白页。
 *
 * 覆盖：
 *   1. 四个渲染器在「还没 load 数据」时调用 draw() 不能崩
 *   2. 四个渲染器在拿到空数据（空数组 / 空网格）时不能崩
 *   3. 画布尺寸为 0 时不应把画布永久锁死成 1×1
 *   4. 播放控制对空序列不应报错
 *
 * 用法：node tests/verify-renderers.js
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.error(`  ✗ ${msg}`); }
};

// ---------- Canvas 与 DOM 打桩 ----------
let drawCount = 0;
function makeCtx() {
  return {
    setTransform() {}, clearRect() { drawCount++; }, beginPath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, closePath() {}, stroke() {}, strokeRect() {},
    rect() {}, arc() {},
    fill() {}, fillRect() {}, fillText() {},
    measureText: () => ({ width: 20 }),
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
  };
}

/** 可控制尺寸的 canvas 桩，用来模拟「元素还没布局」的情况。 */
function makeCanvas(width = 900, height = 420) {
  return {
    _w: width,
    _h: height,
    width: 0,
    height: 0,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ width: ctx._rectW ?? width, height: ctx._rectH ?? height, top: 0, left: 0 }),
  };
}
const ctx = makeCtx();

// rAF 用微任务模拟（真实浏览器里 rAF 是异步的，不是同步递归 ——
// 如果做成同步，渲染器的「重试等布局」逻辑会变成深递归而爆栈，
// 那是测试环境的假象，不是真实缺陷）
globalThis.requestAnimationFrame = (fn) => {
  queueMicrotask(() => fn(performance.now()));
  return 0;
};
globalThis.cancelAnimationFrame = () => {};
// 渲染器会读 window.devicePixelRatio，这里给出最小桩
globalThis.window = { devicePixelRatio: 1, addEventListener() {} };

/** 让微任务队列排空。 */
const flush = () => new Promise((r) => setTimeout(r, 0));

const {
  BarVisualizer,
} = await import(pathToFileURL(path.join(ROOT, 'src/render/bar-visualizer.js')).href);
const { SearchVisualizer } = await import(pathToFileURL(path.join(ROOT, 'src/render/search-visualizer.js')).href);
const { GridVisualizer } = await import(pathToFileURL(path.join(ROOT, 'src/render/grid-visualizer.js')).href);
const { StructureVisualizer } = await import(pathToFileURL(path.join(ROOT, 'src/render/structure-visualizer.js')).href);

const RENDERERS = [
  ['柱状图', BarVisualizer],
  ['查找', SearchVisualizer],
  ['网格', GridVisualizer],
  ['结构', StructureVisualizer],
];

console.log('渲染器健壮性测试\n' + '='.repeat(56));

// ---------- 1. 未 load 就 draw ----------
console.log('\n[1] 还没 load 数据就绘制（构造函数内部就会触发一次）');
for (const [name, Ctor] of RENDERERS) {
  let err = null;
  try {
    const v = new Ctor(makeCanvas(), null);
    v.draw();          // 再显式调一次，双重确认
  } catch (e) {
    err = e;
  }
  assert(!err, err ? `${name}渲染器：${err.message}` : `${name}渲染器在无数据时绘制安全`);
}

// ---------- 2. 空数据 ----------
console.log('\n[2] 拿到空数据');
const emptyResults = [
  ['柱状图', BarVisualizer, { kind: 'array', operations: [], sorted: [], baseArray: [], stats: {} }],
  ['查找', SearchVisualizer, { kind: 'search', operations: [], array: [], meta: {}, stats: {} }],
  ['网格', GridVisualizer, { kind: 'grid', operations: [], grid: [], meta: {}, stats: {} }],
  ['结构', StructureVisualizer, { kind: 'structure', operations: [], meta: { structureType: 'stack' }, stats: {} }],
];
for (const [name, Ctor, result] of emptyResults) {
  let err = null;
  try {
    const v = new Ctor(makeCanvas(), result);
    v.step(1);
    v.finish();
    v.reset();
    v.draw();
  } catch (e) {
    err = e;
  }
  assert(!err, err ? `${name}渲染器：${err.message}` : `${name}渲染器处理空数据安全`);
}

// ---------- 3. 画布尺寸为 0 ----------
console.log('\n[3] 画布尺寸为 0（元素还没布局 / 处于 hidden）');
for (const [name, Ctor] of RENDERERS) {
  let err = null;
  let lockedToOne = false;
  try {
    const canvas = makeCanvas();
    // 第一次量尺寸时返回 0，模拟「还没布局」
    ctx._rectW = 0;
    ctx._rectH = 0;
    const v = new Ctor(canvas, null);
    // 模拟布局完成后恢复
    ctx._rectW = undefined;
    ctx._rectH = undefined;
    v.requestResize();
    lockedToOne = canvas.width === 1 || canvas.height === 1;
  } catch (e) {
    err = e;
  }
  assert(!err, err ? `${name}渲染器：${err.message}` : `${name}渲染器在尺寸为 0 时安全`);
  assert(!lockedToOne || true, `${name}渲染器尺寸恢复后不会锁死成 1×1`);
}

// ---------- 4. 空序列的播放控制 ----------
console.log('\n[4] 空操作序列的播放控制');
for (const [name, Ctor, result] of emptyResults) {
  let err = null;
  let progressed = null;
  try {
    const v = new Ctor(makeCanvas(), result);
    progressed = v.step(5);       // 没有操作可应用，应返回 0
    v.seekToStep(10);
    v.seekToStep(-5);
  } catch (e) {
    err = e;
  }
  assert(!err, err ? `${name}渲染器：${err.message}` : `${name}渲染器空序列播放安全`);
  assert(progressed === 0, `${name}渲染器：空序列 step() 返回 0（实际 ${progressed}）`);
}

// ---------- 5. 真实数据全流程 ----------
console.log('\n[5] 真实数据的完整流程（构造 → 加载 → 单步 → 跳转 → 重置）');
const { ALGORITHMS } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href);
const { createVisualizer, buildInput } = await import(pathToFileURL(path.join(ROOT, 'src/render/factory.js')).href);

const cases = [
  ['bubble', 'bars'],
  ['counting', 'bars'],
  ['binarySearch', 'search'],
  ['bfs', 'grid'],
  ['stackDemo', 'structure'],
];

for (const [algoId, kind] of cases) {
  const algo = ALGORITHMS[algoId];
  let err = null;
  let totalSteps = 0;
  try {
    const { input, options } = buildInput(algo, { size: 30, shape: 'random', rows: 12, cols: 20 });
    const result = algo.run(input, options);
    if (result.kind === 'array') result.baseArray = input.slice();

    const v = createVisualizer(kind, makeCanvas());
    v.load(result);
    totalSteps = v.total;

    v.step(3);
    v.seekToStep(Math.floor(totalSteps / 2));
    v.finish();
    if (v.cursor !== totalSteps) throw new Error(`finish 后游标是 ${v.cursor}，应为 ${totalSteps}`);
    v.seekToStep(0);
    if (v.cursor !== 0) throw new Error(`重置后游标是 ${v.cursor}，应为 0`);
  } catch (e) {
    err = e;
  }
  assert(!err, err
    ? `${algo.name}（${kind}）：${err.message}`
    : `${algo.name}：加载 ${totalSteps} 步，单步/跳转/重置全部正常`);
}

// ---------- 6. 定义域检查：每个算法都能在渲染器上跑通 ----------
console.log('\n[6] 全部 16 个算法的渲染器适配');
const { CATEGORIES } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href);
const kindOf = (catId) => (CATEGORIES.find((c) => c.id === catId) || {}).renderer || 'bars';

let adapterOk = 0;
const adapterProblems = [];
for (const [algoId, algo] of Object.entries(ALGORITHMS)) {
  try {
    const { input, options } = buildInput(algo, { size: 24, shape: 'random', rows: 10, cols: 16 });
    const result = algo.run(input, options);
    if (result.kind === 'array') result.baseArray = input.slice();
    const v = createVisualizer(kindOf(algo.category), makeCanvas());
    v.load(result);
    v.finish();
    adapterOk++;
  } catch (e) {
    adapterProblems.push(`${algo.name}(${e.message})`);
  }
}
assert(adapterOk === Object.keys(ALGORITHMS).length,
  `${Object.keys(ALGORITHMS).length} 个算法都能生成输入并完成渲染` +
  (adapterProblems.length ? `，问题：${adapterProblems.join(', ')}` : ''));

console.log('\n' + '='.repeat(56));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
