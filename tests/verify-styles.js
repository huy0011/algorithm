/**
 * 静态检查：HTML 的属性用法与 CSS 规则是否冲突。
 *
 * 为什么需要这个测试：
 * ui-integration.js 用 DOM 桩跑逻辑，**不应用任何 CSS**，
 * 所以「CSS 把 hidden 属性盖掉」这类问题它永远发现不了。
 * 这个 bug 真实发生过：布局用了 display: grid，而浏览器默认的
 * [hidden] { display: none } 优先级更低，导致两个页签同时显示、
 * 页面看起来像是坏的。
 *
 * 这个脚本不跑代码，只做静态分析，专门盯这类「逻辑对但样式错」的问题。
 *
 * 用法：node tests/verify-styles.js
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

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// 现在有两个样式文件：main.css（结构）+ theme.css（视觉升级层）。
// 必须合并起来检查，否则 theme.css 里的规则不会被任何测试覆盖。
const css = [
  fs.readFileSync(path.join(ROOT, 'styles/main.css'), 'utf8'),
  fs.readFileSync(path.join(ROOT, 'styles/theme.css'), 'utf8'),
].join('\n');

console.log('样式与标记的静态一致性检查\n' + '='.repeat(56));

// ---------- 1. hidden 属性必须真的生效 ----------
console.log('\n[1] hidden 属性是否会生效');

/** 取出 HTML 里所有带 hidden 属性的元素，拿到它们的 class。 */
const hiddenEls = [];
for (const m of html.matchAll(/<([a-z]+)([^>]*?)\shidden(\s|>)/g)) {
  const attrs = m[2];
  const cls = /class="([^"]*)"/.exec(attrs);
  hiddenEls.push({ tag: m[1], classes: cls ? cls[1].split(/\s+/) : [] });
}

assert(hiddenEls.length > 0, `HTML 里有 ${hiddenEls.length} 个元素使用了 hidden 属性`);

// CSS 里必须有 [hidden] { display: none } 的强制规则
const hasHiddenRule = /\[hidden\]\s*\{[^}]*display\s*:\s*none/.test(css);
const hasImportant = /\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/.test(css);
assert(hasHiddenRule, 'CSS 里定义了 [hidden] { display: none } 规则');
assert(hasImportant,
  '并且带了 !important —— 否则会被组件自己的 display: grid/flex 盖掉');

// 逐个检查：这些元素所属的 class 是否声明了 display
const displayOwners = [];
for (const m of css.matchAll(/\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/g)) {
  const cls = m[1];
  const body = m[2];
  if (/display\s*:\s*(grid|flex|block|inline-block|table)/.test(body)) {
    displayOwners.push({ cls, display: /display\s*:\s*([a-z-]+)/.exec(body)[1] });
  }
}

const conflicts = [];
for (const h of hiddenEls) {
  for (const c of h.classes) {
    const owner = displayOwners.find((d) => d.cls === c);
    if (owner) conflicts.push(`${h.tag}.${c} (display: ${owner.display})`);
  }
}
if (conflicts.length > 0) {
  console.log(`  · 这些带 hidden 的元素自身声明了 display，正是需要 !important 的原因：`);
  conflicts.forEach((c) => console.log(`      ${c}`));
}
assert(hasImportant || conflicts.length === 0,
  conflicts.length === 0
    ? '没有元素同时有 hidden 和自定义 display'
    : `${conflicts.length} 个元素同时有 hidden 和自定义 display，已由 !important 兜住`);

// ---------- 2. 页签与面板必须一一对应 ----------
console.log('\n[2] 页签与面板的对应关系');

const tabs = [...html.matchAll(/data-tab="([^"]+)"/g)].map((m) => m[1]);
const panes = [...html.matchAll(/data-pane="([^"]+)"/g)].map((m) => m[1]);

assert(tabs.length > 0 && panes.length > 0, `找到 ${tabs.length} 个页签、${panes.length} 个面板`);
assert(
  tabs.length === panes.length && tabs.every((t) => panes.includes(t)),
  `每个页签都有对应的面板（页签 ${tabs.join('/')} ↔ 面板 ${panes.join('/')}）`
);

// 初始化时，除了第一个，其余面板都应该是 hidden
const paneMarkup = [...html.matchAll(/<main([^>]*data-pane="([^"]+)")([^>]*)>/g)];
const initialHidden = paneMarkup.map((m) => ({
  pane: m[2],
  hidden: (m[1] + m[3]).includes('hidden'),
}));
assert(initialHidden.filter((p) => p.hidden).length === paneMarkup.length - 1,
  `初始只显示一个面板，其余 ${paneMarkup.length - 1} 个都带 hidden`);

// ---------- 3. CSS 选择器引用的 class 必须存在于 HTML ----------
console.log('\n[3] CSS 里的关键 class 是否都在 HTML 中出现');

const criticalClasses = [
  'layout', 'syntax-layout', 'panel', 'stage', 'canvas-wrap',
  'tabs', 'tab', 'syntax-nav', 'syntax-main', 'code-block', 'output-block',
  'syntax-chips', 'legend', 'stats', 'compare-table',
];
const missingClasses = criticalClasses.filter((c) => !new RegExp(`class="[^"]*\\b${c}\\b`).test(html));
assert(missingClasses.length === 0,
  missingClasses.length ? `HTML 里缺少这些 class：${missingClasses.join(', ')}` : `关键 class 全部存在（${criticalClasses.length} 个）`);

// ---------- 4. HTML 里用到的 class 在 CSS 里是否有定义（查漏） ----------
console.log('\n[4] HTML 用到的 class 是否都有样式定义');

const htmlClasses = new Set();
for (const m of html.matchAll(/class="([^"]+)"/g)) {
  for (const c of m[1].split(/\s+/)) if (c) htmlClasses.add(c);
}
const cssClasses = new Set([...css.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]));

/**
 * 允许「没有专属样式」的 class：它们只是标记位，
 * 要么用于 JS 查询，要么用于语义分组 / 后代选择器。
 */
const ALLOWED_UNSTYLED = new Set([
  'controls',   // 左侧控制栏，定位用（.panel 已提供样式）
  'compare',    // 右侧对比栏，同上
  'syntax-chip', // 由 app.js 动态生成，样式定义在 CSS 里但不在 HTML 源码中
  'chip-algo',   // 同上，动态添加
]);

// syntax-chip 虽然不在 HTML 里，但必须在 CSS 里有定义（它是动态生成的）
const dynamicClasses = ['syntax-chip', 'chip-algo'];
const missingDynamic = dynamicClasses.filter((c) => !cssClasses.has(c));
assert(missingDynamic.length === 0,
  missingDynamic.length ? `动态生成的 class 缺少样式：${missingDynamic.join(', ')}` : `动态生成的 class 都有样式（${dynamicClasses.join(', ')}）`);

const undefinedClasses = [...htmlClasses]
  .filter((c) => !cssClasses.has(c))
  .filter((c) => !ALLOWED_UNSTYLED.has(c));
assert(undefinedClasses.length === 0,
  undefinedClasses.length
    ? `这些 class 在 HTML 里用了但没有样式：${undefinedClasses.join(', ')}`
    : `HTML 里的 ${htmlClasses.size} 个 class 都有样式定义或已确认是标记位`);

// ---------- 5. 引用的文件都真实存在 ----------
console.log('\n[5] HTML 引用的本地文件是否存在');

const refs = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1]);
const missingFiles = refs.filter((r) => !fs.existsSync(path.join(ROOT, r.replace('./', ''))));
assert(missingFiles.length === 0,
  missingFiles.length ? `引用了不存在的文件：${missingFiles.join(', ')}` : `${refs.length} 个本地引用全部存在`);

// ---------- 6. JS 里操作的 id 必须存在 ----------
console.log('\n[6] JS 引用的元素 id 是否都在 HTML 里');

const appJs = fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8');
const jsIds = [...appJs.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]);
const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
const badIds = jsIds.filter((id) => !htmlIds.has(id));
assert(badIds.length === 0,
  badIds.length ? `JS 引用了不存在的 id：${badIds.join(', ')}` : `JS 引用的 ${jsIds.length} 个 id 全部存在`);

// ---------- 7. 内联样式里的颜色不应写错 ----------
console.log('\n[7] 内联样式检查');
const inlineColors = [...html.matchAll(/style="([^"]*)"/g)].map((m) => m[1]);
const badColors = inlineColors.filter((s) => {
  const colors = [...s.matchAll(/#([0-9a-fA-F]{3,8})\b/g)];
  return colors.some((c) => ![3, 6, 8].includes(c[1].length));
});
assert(badColors.length === 0,
  badColors.length ? `内联样式里有非法颜色值：${badColors.join(' | ')}` : `${inlineColors.length} 处内联样式颜色格式正确`);

console.log('\n' + '='.repeat(56));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
