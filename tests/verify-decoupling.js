/**
 * 解耦架构的静态验证。
 *
 * 这个项目最核心的设计承诺是：
 *   算法层只产出操作序列，渲染层只播放序列，两者互不认识。
 *
 * 但「互不认识」无法靠单元测试证明 —— 测试只能验证行为，
 * 不能阻止有人日后在算法里写一句 document.querySelector。
 * 所以这里做静态检查，把承诺变成可执行的约束。
 *
 * 检查两条：
 *   1. src/algorithms/ 下不得出现任何 DOM / Canvas / 浏览器 API
 *   2. src/render/ 下不得出现任何具体算法名（渲染层只该认识「操作类型」）
 *
 * 注意：只检查**真实代码**，注释里提到这些词是允许的（也是在解释设计）。
 *
 * 用法：node tests/verify-decoupling.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.error(`  ✗ ${msg}`); }
};

/**
 * 剥离注释与字符串字面量，只留可执行代码。
 *
 * 为什么必须剥离：算法层的注释里写着「不接触任何 DOM / Canvas」，
 * 渲染层的注释里写着「用于冒泡排序」—— 这些是解释，不是耦合。
 * 不剥离就会产生误报（这个误报我实际踩过一次）。
 */
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let inBlock = false;
  let inLine = false;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  while (i < n) {
    const c = src[i];
    const next = src[i + 1];

    if (inLine) {
      if (c === '\n') { inLine = false; out += c; }
      i++;
      continue;
    }
    if (inBlock) {
      if (c === '*' && next === '/') { inBlock = false; i += 2; continue; }
      i++;
      continue;
    }
    if (inSingle) {
      if (c === '\\') { i += 2; continue; }
      if (c === "'") { inSingle = false; out += "''"; }
      i++;
      continue;
    }
    if (inDouble) {
      if (c === '\\') { i += 2; continue; }
      if (c === '"') { inDouble = false; out += '""'; }
      i++;
      continue;
    }
    if (inTemplate) {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { inTemplate = false; out += '``'; }
      i++;
      continue;
    }

    if (c === '/' && next === '*') { inBlock = true; i += 2; continue; }
    if (c === '/' && next === '/') { inLine = true; i += 2; continue; }
    if (c === "'") { inSingle = true; i++; continue; }
    if (c === '"') { inDouble = true; i++; continue; }
    if (c === '`') { inTemplate = true; i++; continue; }

    out += c;
    i++;
  }
  return out;
}

/** 扫描目录下所有 .js，返回命中 pattern 的文件与行。 */
function scan(dir, pattern) {
  const hits = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      hits.push(...scan(full, pattern));
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;

    const raw = fs.readFileSync(full, 'utf8');
    const code = stripComments(raw);
    const lines = code.split('\n');
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        hits.push({
          file: path.relative(ROOT, full).replace(/\\/g, '/'),
          line: idx + 1,
          text: line.trim().slice(0, 80),
        });
      }
    });
  }
  return hits;
}

console.log('解耦架构静态验证\n' + '='.repeat(56));

// ---------- 1. 算法层不得碰浏览器 API ----------
console.log('\n[1] 算法层是否只产出操作序列（不得碰 DOM / Canvas）');

/**
 * 注意 window 这个词有两种完全不同的用法：
 *   window.devicePixelRatio   —— 浏览器全局对象（算法层不该碰）
 *   t.window(from, to, label) —— SpanTracer 记录「滑动窗口」的方法（完全合法）
 * 所以不能简单匹配 \bwindow\b，必须要求它是「独立标识符」（前面不是点号），
 * 否则会把 t.window(...) 误判成违规 —— 这个误报我实际踩过一次。
 */
const DOM_PATTERNS = new RegExp(
  [
    String.raw`\b(document|getContext|fillRect|fillText|requestAnimationFrame|ResizeObserver|localStorage|canvas)\b`,
    // 只匹配作为全局对象使用的 window / globalThis（前面不是 . 或标识符字符）
    String.raw`(?<![.\w$])(window|globalThis)\s*[.[]`,
    String.raw`(?<![.\w$])(window|globalThis)\s*$`,
  ].join('|'),
  'm'
);
const algoHits = scan(path.join(ROOT, 'src/algorithms'), DOM_PATTERNS);

assert(algoHits.length === 0,
  algoHits.length
    ? `算法层出现了浏览器 API：\n     ${algoHits.map((h) => `${h.file}:${h.line}  ${h.text}`).join('\n     ')}`
    : '算法层没有任何 DOM / Canvas / 浏览器 API 引用');

// ---------- 2. 渲染层不得认识具体算法名 ----------
console.log('\n[2] 渲染层是否只认识操作类型（不得出现具体算法名）');

const ALGO_NAMES = /(冒泡|选择排序|插入排序|希尔排序|归并排序|快速排序|堆排序|计数排序|基数排序|桶排序|二分查找|二分答案|广度优先|深度优先|双指针|滑动窗口|前缀和|差分数组|字符串哈希|位运算)/;
const renderHits = scan(path.join(ROOT, 'src/render'), ALGO_NAMES);

assert(renderHits.length === 0,
  renderHits.length
    ? `渲染层出现了具体算法名：\n     ${renderHits.map((h) => `${h.file}:${h.line}  ${h.text}`).join('\n     ')}`
    : '渲染层不包含任何具体算法名（只按操作类型渲染）');

// ---------- 3. 每个渲染器都必须继承基类 ----------
console.log('\n[3] 渲染器是否都继承 BaseVisualizer（复用播放/跳转/自适应）');
const renderDir = path.join(ROOT, 'src/render');
const visualizers = fs.readdirSync(renderDir).filter((f) => f.endsWith('-visualizer.js'));
const notExtending = [];
for (const f of visualizers) {
  const code = stripComments(fs.readFileSync(path.join(renderDir, f), 'utf8'));
  if (!/extends\s+BaseVisualizer/.test(code)) notExtending.push(f);
}
assert(notExtending.length === 0,
  notExtending.length ? `这些渲染器没有继承基类：${notExtending.join(', ')}` : `${visualizers.length} 个渲染器全部继承 BaseVisualizer`);

// ---------- 4. 渲染器必须实现 _applyOp 与 draw ----------
console.log('\n[4] 渲染器是否实现了必需的两个方法');
const missing = [];
for (const f of visualizers) {
  const code = stripComments(fs.readFileSync(path.join(renderDir, f), 'utf8'));
  const hasApply = /_applyOp\s*\(/.test(code);
  const hasDraw = /\bdraw\s*\(\s*\)\s*\{/.test(code);
  if (!hasApply || !hasDraw) {
    missing.push(`${f}(缺少 ${!hasApply ? '_applyOp ' : ''}${!hasDraw ? 'draw' : ''})`);
  }
}
assert(missing.length === 0,
  missing.length ? `实现不完整：${missing.join(', ')}` : `${visualizers.length} 个渲染器都实现了 _applyOp 与 draw`);

// ---------- 5. 工厂是否覆盖所有渲染器类型 ----------
console.log('\n[5] 渲染器工厂是否覆盖全部分类');
const algoIndex = fs.readFileSync(path.join(ROOT, 'src/algorithms/index.js'), 'utf8');
const factory = fs.readFileSync(path.join(renderDir, 'factory.js'), 'utf8');
const usedRenderers = [...algoIndex.matchAll(/renderer:\s*'(\w+)'/g)].map((m) => m[1]);
const registered = [...factory.matchAll(/^\s*(\w+):\s*\w+Visualizer/gm)].map((m) => m[1]);
const notRegistered = [...new Set(usedRenderers)].filter((r) => !registered.includes(r));
assert(notRegistered.length === 0,
  notRegistered.length
    ? `分类用到了未注册的渲染器：${notRegistered.join(', ')}`
    : `分类用到的 ${new Set(usedRenderers).size} 种渲染器都已在工厂注册（${registered.join(', ')}）`);

console.log('\n' + '='.repeat(56));
if (failures === 0) { console.log('结果：解耦架构成立 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
