/**
 * 手机端可视化可读性回归测试。
 *
 * 背景：手机上（画布约 346×346）多个算法的可视化显示不正常：
 *   - KMP：40 个字符挤在 346px 里，每格 6.7px、字号 5px，字符根本不画
 *   - 栈/队列：从 this.W 取值（属性不存在）→ NaN，整个容器画不出来
 *   - BFS/DFS：网格上下留白过大，只占中间一小块
 *   - 尺寸为 0 时各渲染器画出负宽矩形
 *
 * 这个测试在「手机画布」尺寸下逐个渲染全部算法，检查：
 *   1. 不抛异常
 *   2. 不出现越界绘制（坐标远超画布）
 *   3. 不出现 NaN 坐标
 *   4. 字符类算法（span）在画布上真的画出了字符
 *   5. 尺寸为 0 时不绘制任何东西（而不是画错乱图形）
 *
 * 用法：node tests/verify-mobile-viz.js
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const { ALGORITHMS, CATEGORIES } = await import(
  pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href
);
const { buildInput, createVisualizer } = await import(
  pathToFileURL(path.join(ROOT, 'src/render/factory.js')).href
);

let failures = 0;
const assert = (cond, msg, detail) => {
  if (cond) console.log(`  ✓ ${msg}${detail ? '  ' + detail : ''}`);
  else { failures++; console.error(`  ✗ ${msg}${detail ? '  ' + detail : ''}`); }
};

const kindOf = (cat) => (CATEGORIES.find((x) => x.id === cat) || {}).renderer || 'bars';

/** 造一个记录绘制调用的 2D 上下文。 */
function makeCtx(sink) {
  const target = { font: '12px sans-serif' };
  return new Proxy(target, {
    get(t, k) {
      if (k === 'font') return t.font;
      if (k === 'measureText') return (s) => ({ width: String(s).length * 6 });
      if (k === 'fillText' || k === 'strokeText') {
        return (text, x, y) => {
          const m = /(\d+(?:\.\d+)?)px/.exec(t.font);
          sink.texts.push({ text: String(text), x, y, size: m ? Number(m[1]) : 0 });
        };
      }
      if (['fillRect', 'strokeRect', 'rect', 'roundRect'].includes(k)) {
        return (x, y, w, h) => sink.rects.push({ x, y, w, h });
      }
      // 圆角矩形（_roundRect）在半径 > 0 时用 moveTo/lineTo/arcTo + fill 绘制，
      // 不会走 rect()，所以这些路径点也必须记录，否则会误判为「没画东西」
      if (['moveTo', 'lineTo', 'arcTo', 'arc', 'quadraticCurveTo', 'bezierCurveTo'].includes(k)) {
        return (x, y, ...rest) => sink.points.push({ x, y, rest });
      }
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
globalThis.requestAnimationFrame = (f) => { setTimeout(() => f(0), 0); return 0; };

/** 在指定尺寸下渲染一个算法，返回绘制记录。 */
function renderAlgo(algo, W, H) {
  const sink = { texts: [], rects: [], points: [] };
  const ctx = makeCtx(sink);
  const canvas = {
    width: W, height: H,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ width: W, height: H }),
  };
  const { input, options } = buildInput(algo, {
    size: 20, shape: 'random', rows: 12, cols: 20,
  });
  const r0 = algo.run(input, options);
  const result = r0.tracer
    ? (typeof r0.tracer.build === 'function' ? r0.tracer.build() : r0.tracer.result())
    : r0;
  const v = createVisualizer(kindOf(algo.category), canvas);
  // 测试环境不会触发 ResizeObserver，手动把尺寸写进去，
  // 否则 metrics 一直是 0，渲染器会（正确地）跳过绘制
  v.metrics.width = W;
  v.metrics.height = H;
  v.load(result);
  for (const frac of [0, 0.5, 1]) v.seekToStep(Math.floor((v.total - 1) * frac));
  return { sink, visualizer: v };
}

console.log('手机端可视化可读性\n' + '='.repeat(58));

// ---------- 1. 手机画布下全部算法可正常渲染 ----------
console.log('\n[1] 手机画布 346×346 渲染全部算法');
{
  const W = 346, H = 346;
  const problems = [];
  let ok = 0;

  for (const id of Object.keys(ALGORITHMS)) {
    const a = ALGORITHMS[id];
    let sink;
    let v;
    try {
      ({ sink, visualizer: v } = renderAlgo(a, W, H));
      ok++;
    } catch (e) {
      problems.push(`${a.name}: 渲染异常 ${e.message}`);
      continue;
    }

    // NaN / Infinity 坐标
    const badNums = [...sink.rects, ...sink.points].filter(
      (p) => !Number.isFinite(p.x) || !Number.isFinite(p.y)
        || (p.w !== undefined && !Number.isFinite(p.w)),
    );
    if (badNums.length) problems.push(`${a.name}: ${badNums.length} 处 NaN/Infinity 坐标`);

    // 负宽高
    const negatives = sink.rects.filter((r) => r.w < 0 || r.h < 0);
    if (negatives.length) problems.push(`${a.name}: ${negatives.length} 处负宽高矩形`);

    // 越界绘制
    const out = [...sink.rects, ...sink.points].filter(
      (p) => p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20,
    );
    if (out.length) problems.push(`${a.name}: ${out.length} 处越界绘制`);
  }

  assert(ok === Object.keys(ALGORITHMS).length,
    `${Object.keys(ALGORITHMS).length} 个算法全部渲染成功`, `成功 ${ok}`);
  assert(problems.length === 0,
    problems.length ? `渲染问题：\n     ${problems.join('\n     ')}`
      : '没有 NaN 坐标 / 负宽高 / 越界绘制');
}

// ---------- 2. 字符串类算法必须真的画出字符 ----------
console.log('\n[2] 字符串类算法（span 渲染器）必须显示字符');
{
  const spanAlgos = Object.keys(ALGORITHMS)
    .filter((id) => kindOf(ALGORITHMS[id].category) === 'span');
  const noChar = [];

  for (const id of spanAlgos) {
    const a = ALGORITHMS[id];
    const { sink, visualizer } = renderAlgo(a, 346, 346);
    // 单字符文本 = 格子里的字符
    const chars = sink.texts.filter((t) => t.text.length === 1 && t.text.trim());
    // 该算法确实有数据要显示
    const hasData = visualizer.array && visualizer.array.length > 0;
    if (hasData && chars.length === 0) noChar.push(a.name);
  }

  assert(noChar.length === 0,
    noChar.length
      ? `这些算法在手机上没画出任何字符：${noChar.join(', ')}`
      : `${spanAlgos.length} 个 span 算法都画出了字符`);
}

// ---------- 3. 画布尺寸为 0 时不应绘制 ----------
console.log('\n[3] 画布尺寸为 0 时的保护');
{
  const painted = [];
  for (const id of Object.keys(ALGORITHMS)) {
    const a = ALGORITHMS[id];
    const { sink } = renderAlgo(a, 0, 0);
    const total = sink.rects.length + sink.texts.length + sink.points.length;
    // 允许画“没有数据”之类的居中提示，但不允许大量图形
    if (total > 6) painted.push(`${a.name}(${total})`);
  }
  assert(painted.length === 0,
    painted.length
      ? `这些算法在 0×0 画布上仍绘制了图形：${painted.join(', ')}`
      : '尺寸为 0 时各渲染器正确跳过绘制');
}

// ---------- 4. 栈/队列的结构必须画出来（不能只有输入条） ----------
console.log('\n[4] 栈 / 队列必须画出结构本体');
{
  const problems = [];
  for (const id of ['stackDemo', 'queueDemo']) {
    const a = ALGORITHMS[id];
    const { sink } = renderAlgo(a, 346, 346);
    // 结构本体画在画布下半部分（输入条在 y≈56，结构在下面）。
    // 注意本体是用圆角路径绘制的，要连路径点一起统计。
    const lowerRects = sink.rects.filter((r) => r.y > 90);
    const lowerPoints = sink.points.filter((p) => p.y > 90);
    if (lowerRects.length === 0 && lowerPoints.length === 0) problems.push(a.name);
  }
  assert(problems.length === 0,
    problems.length
      ? `这些结构没画出本体：${problems.join(', ')}`
      : '栈与队列都画出了结构本体（不是只有输入条）');
}

// ---------- 5. 网格类算法要尽量填满画布 ----------
console.log('\n[5] 网格类算法填充率');
{
  const problems = [];
  for (const id of ['bfs', 'dfs']) {
    const a = ALGORITHMS[id];
    const { sink } = renderAlgo(a, 346, 346);
    // 格子 = 宽高接近且尺寸 8~40 的矩形
    const cells = sink.rects.filter(
      (r) => r.w > 6 && r.w < 45 && Math.abs(r.w - r.h) < 2,
    );
    if (cells.length === 0) { problems.push(`${a.name}: 没有格子`); continue; }
    const maxY = Math.max(...cells.map((r) => r.y + r.h));
    const minY = Math.min(...cells.map((r) => r.y));
    const fillRatio = (maxY - minY) / 346;
    if (fillRatio < 0.45) {
      problems.push(`${a.name}: 网格只占画布高度的 ${(fillRatio * 100).toFixed(0)}%`);
    }
  }
  assert(problems.length === 0,
    problems.length ? problems.join('；') : 'BFS / DFS 的网格在手机上占满大部分画布高度');
}

console.log('\n' + '='.repeat(58));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
