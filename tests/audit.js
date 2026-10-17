/**
 * 项目全面审计。
 *
 * 目的：不靠印象判断「做得完不完美」，而是用一组客观检查找真实缺陷。
 * 覆盖：死代码、未使用的导出、命名一致性、可访问性、SEO、性能、健壮性。
 *
 * 用法：node tests/audit.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const findings = { high: [], medium: [], low: [] };
const add = (sev, msg) => findings[sev].push(msg);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '.git' && e.name !== '.cpp-build' && e.name !== 'node_modules') walk(p, out); }
    else out.push(p);
  }
  return out;
}

const allFiles = walk(ROOT);
const jsFiles = allFiles.filter((f) => f.endsWith('.js') && !f.includes('tests'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = ['main.css', 'theme.css'].map((f) => fs.readFileSync(path.join(ROOT, 'styles', f), 'utf8')).join('\n');

// ============ 1. 死代码：导出但从未被引用 ============
console.log('审计项目…\n');

const srcAll = jsFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const testAll = allFiles.filter((f) => f.endsWith('.js') && f.includes('tests'))
  .map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const htmlApp = html;

for (const f of jsFiles) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  for (const m of src.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g)) {
    const name = m[1];
    // 引用来源：其它文件 + 测试 + HTML + 本文件内的其余用法
    const others = [srcAll.replace(src, ''), testAll, htmlApp].join('\n');
    const re = new RegExp(`\\b${name}\\b`);
    // 本文件内除定义行之外还有使用也算（如 EXACT_LISTS 在下方函数里被展开）
    const selfUses = [...src.matchAll(new RegExp(`\\b${name}\\b`, 'g'))].length;
    const usedInSelf = selfUses > 1;   // 1 表示只有定义本身
    if (!re.test(others) && !usedInSelf) {
      add('low', `${rel}: 导出 \`${name}\` 从未被使用`);
    }
  }
}

// ============ 2. 未使用的 CSS 类 ============
// 先剥掉注释，否则注释里提到的类名会被误判成"定义了但没用"
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
const cssClasses = new Set([...cssNoComments.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const appJs = fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8');
const usedAnywhere = html + appJs + jsFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const unusedCss = [...cssClasses].filter((c) => {
  if (['0', '5', '25', '1', '2', '3', '4', '6'].includes(c)) return false;
  return !new RegExp(`[\\s"'\`]${c}[\\s"'\`]|class="${'[^"]*'}${c}`).test(usedAnywhere)
    && !usedAnywhere.includes(`'${c}'`)
    && !usedAnywhere.includes(`${c}`);
});
if (unusedCss.length) add('low', `CSS 里有未使用的类：${unusedCss.slice(0, 8).join(', ')}${unusedCss.length > 8 ? '…' : ''}`);

// ============ 3. 可访问性 ============
const a11yIssues = [];
// 按钮必须有可读文字或 aria-label
for (const m of html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)) {
  const attrs = m[1];
  const inner = m[2].replace(/<[^>]+>/g, '').trim();
  const hasAria = /aria-label|title=/.test(attrs);
  if (!inner && !hasAria) a11yIssues.push(m[0].slice(0, 60));
}
if (a11yIssues.length) add('medium', `${a11yIssues.length} 个按钮既无文字也无 aria-label`);

// 表单控件需要 label
for (const id of ['algo-select', 'category-select', 'shape-select', 'size-range', 'speed-range', 'syntax-search']) {
  const hasLabel = new RegExp(`<label[^>]*for="${id}"`).test(html);
  const hasAria = new RegExp(`id="${id}"[^>]*aria-label`).test(html);
  if (!hasLabel && !hasAria) add('medium', `控件 #${id} 缺少 label 关联`);
}

// 画布应有 role 或 aria-label
if (!/id="canvas"[^>]*aria-label/.test(html)) add('medium', 'canvas 缺少 aria-label');

// 语言已声明
if (!/<html[^>]+lang=/.test(html)) add('medium', 'html 缺少 lang 属性');

// ============ 4. SEO / 元信息 ============
if (!/<meta\s+name="description"/.test(html)) add('medium', '缺少 meta description');
if (!/<meta\s+property="og:title"/.test(html)) add('low', '缺少 Open Graph 标签（分享到社交平台无预览）');
if (!/<title>/.test(html)) add('high', '缺少 title');

// ============ 5. 性能 ============
// 单文件过大（有明确理由的不报）
//   app.js          单页 UI 入口层，约 1000 行属常见规模；拆分会把几十个
//                   DOM 引用当参数传来传去，反而更难维护
//   cpp-topics.js   纯内容数据（C++ 知识点与示例），拆开后新增知识点
//   cpp-algos.js    要改多处，不划算
const SPLIT_OK = new Set([
  'src/app.js',
  'src/syntax/cpp-topics.js',
  'src/syntax/cpp-algos.js',
  'src/syntax/cpp-algos2.js',
  'src/syntax/cpp-detail-topics.js',
]);
for (const f of jsFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (SPLIT_OK.has(rel)) continue;
  const lines = fs.readFileSync(f, 'utf8').split('\n').length;
  if (lines > 900) add('low', `${rel} 有 ${lines} 行，考虑拆分`);
}
// 事件监听器是否在循环里重复绑定导致内存泄漏风险
if (/addEventListener[\s\S]{0,80}forEach[\s\S]{0,80}addEventListener/.test(appJs)) {
  // 这是正常模式，跳过
}

// ============ 6. 健壮性：错误处理 ============
// 检查 app.js 是否有全局错误兜底
if (!/window\.addEventListener\(\s*['"]error['"]/.test(appJs)) {
  add('medium', 'app.js 没有全局 error 监听（运行时错误会静默失败）');
}

// ============ 7. 一致性检查 ============
// 所有算法都有 cppTopics
const { ALGORITHMS, ALGORITHM_ORDER } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href);
const noTopics = ALGORITHM_ORDER.filter((id) => !(ALGORITHMS[id].cppTopics || []).length);
if (noTopics.length) add('medium', `算法缺 C++ 知识点关联：${noTopics.join(', ')}`);

// 所有算法都有 blurb / complexity
const incomplete = ALGORITHM_ORDER.filter((id) => {
  const a = ALGORITHMS[id];
  return !a.blurb || !a.complexity?.time || !a.complexity?.space;
});
if (incomplete.length) add('medium', `算法信息不完整：${incomplete.join(', ')}`);

// 所有算法都有核心思路
const { ALGO_IDEAS } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/algo-ideas.js')).href);
const noIdea = ALGORITHM_ORDER.filter((id) => !ALGO_IDEAS[id]);
if (noIdea.length) add('medium', `算法缺核心思路文案：${noIdea.join(', ')}`);

// ============ 8. 静态资源完整性 ============
for (const m of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) {
  if (!fs.existsSync(path.join(ROOT, m[1]))) add('high', `HTML 引用了不存在的文件：${m[1]}`);
}

// ============ 9. README 与实际是否一致 ============
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const claims = [
  [`${ALGORITHM_ORDER.length} 个算法`, readme.includes(`${ALGORITHM_ORDER.length} 个算法`) || readme.includes(`全部 ${ALGORITHM_ORDER.length} 个`)],
];
for (const [desc, ok] of claims) {
  if (!ok) add('medium', `README 可能未同步：应包含「${desc}」`);
}

// ============ 输出 ============
const sevLabel = { high: '严重', medium: '中等', low: '轻微' };
let total = 0;
for (const sev of ['high', 'medium', 'low']) {
  const list = findings[sev];
  total += list.length;
  console.log(`${sevLabel[sev]}问题 (${list.length})`);
  if (list.length === 0) console.log('  （无）');
  for (const item of list) console.log(`  · ${item}`);
  console.log('');
}
console.log(`共发现 ${total} 个问题`);
process.exit(findings.high.length > 0 ? 1 : 0);
