/**
 * 移动端布局的静态检查。
 *
 * 不能真的打开浏览器（沙箱限制），所以这里做「静态解析 + 数值推演」：
 *   1. 断言关键响应式规则存在（画布宽高比、顶栏重排、面板高度归零）
 *   2. 检查是否有固定的像素宽度会超出常见手机视口（360/375/390/414）
 *   3. 检查 main.css 与 theme.css 的断点没有互相冲突的重复声明
 *
 * 用法：node tests/verify-mobile.js
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

const mainCss = fs.readFileSync(path.join(ROOT, 'styles/main.css'), 'utf8');
const themeCss = fs.readFileSync(path.join(ROOT, 'styles/theme.css'), 'utf8');
const allCss = mainCss + '\n' + themeCss;

console.log('移动端布局检查\n' + '='.repeat(58));

// ---------- 1. 断点统一 ----------
console.log('\n[1] 响应式断点');

const breakpoints = (css) => [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map((m) => Number(m[1]));
const mainBps = breakpoints(mainCss);
const themeBps = breakpoints(themeCss);

assert(mainBps.length === 0,
  mainBps.length ? `main.css 仍有断点 ${mainBps.join(', ')} —— 应与 theme.css 冲突` : 'main.css 不再声明宽度断点（统一在 theme.css）');

const required = [1180, 860, 560, 400];
const missing = required.filter((bp) => !themeBps.includes(bp));
assert(missing.length === 0,
  missing.length ? `theme.css 缺少断点：${missing.join(', ')}` : `theme.css 包含全部关键断点：${themeBps.join(' / ')}`);

// ---------- 2. 手机端关键规则 ----------
console.log('\n[2] 手机端关键规则');
const phoneBlock = (() => {
  const s = themeCss.indexOf('@media (max-width: 560px)');
  if (s < 0) return '';
  // 取到下一个顶层 @media 之前
  const next = themeCss.indexOf('@media', s + 10);
  return themeCss.slice(s, next > 0 ? next : themeCss.length);
})();

assert(phoneBlock.includes('aspect-ratio'), '画布在手机上改用 aspect-ratio（横竖屏都不塌）');
assert(phoneBlock.includes('.gh-link span'), 'GitHub 按钮在手机上隐藏文字（只留图标，避免挤行）');
assert(phoneBlock.includes('.tabs'), '页签在手机上独占一行');
assert(phoneBlock.includes('min-height: 40px'), '传输按钮加大触摸区域到 40px');

// ---------- 2b. 吸顶遮挡（用户反馈「遮挡部分可视化」的根因）----------
console.log('\n[2b] 吸顶元素是否遮挡画布');
assert(/\.topbar\s*\{[^}]*position:\s*static/.test(phoneBlock),
  '手机端顶栏取消吸顶（否则折成两行后吸顶会盖住画布上半部）');

// 横屏也应取消
const landscape = (() => {
  const s = themeCss.indexOf('(max-height: 520px) and (orientation: landscape)');
  if (s < 0) return '';
  const next = themeCss.indexOf('@media', s + 10);
  return themeCss.slice(s, next > 0 ? next : themeCss.length);
})();
assert(landscape === '' || /\.topbar\s*\{[^}]*position:\s*static/.test(landscape),
  '横屏顶栏同样不吸顶');

// 画布高度不能超过视口一大半，否则滚动体验差
const canvasRule = /\.canvas-wrap\s*\{[^}]*max-height:\s*(\d+)vh/.exec(phoneBlock);
assert(canvasRule && Number(canvasRule[1]) <= 60,
  `手机上画布高度上限 ${canvasRule ? canvasRule[1] + 'vh' : '未设置'}（应 ≤ 60vh，保证一屏能看到完整画布）`);

// 单栏断点里应移除面板最小高度
const singleCol = (() => {
  const s = themeCss.indexOf('@media (max-width: 860px)');
  const next = themeCss.indexOf('@media', s + 10);
  return themeCss.slice(s, next > 0 ? next : themeCss.length);
})();
assert(/min-height:\s*0/.test(singleCol),
  '单栏时右侧面板 min-height 归零（否则手机底部大片空白）');

// ---------- 2c. 多个 .compare 面板不能共用同一个网格区域 ----------
// 页面里有三个 .compare（C++ 实现 / 效率对比 / 看点卡）。
// 一旦把它们都映射到 grid-template-areas 里的同一个名字，就会完全重叠，
// 表现为「效率对比卡片压住代码块」—— 这个 bug 实际发生过。
console.log('\n[2c] 面板重叠防护');
const usesNamedCompareArea = /grid-template-areas:[\s\S]{0,200}compare/.test(themeCss)
  && /\.compare\s*\{[^}]*grid-area:\s*compare/.test(themeCss);
assert(!usesNamedCompareArea,
  usesNamedCompareArea
    ? '仍有 .compare { grid-area: compare } —— 三个面板会重叠！'
    : '没有把三个 .compare 面板映射到同一个网格区域');

// 窄屏布局改用 flex 纵向排列，从结构上不可能重叠
assert(/@media \(max-width: 860px\)[\s\S]{0,400}flex-direction:\s*column/.test(themeCss),
  '窄屏用 flex 纵向排列（stage 置顶、面板依次向下）');

// ---------- 2d. 控制区：分类与数据分布并排 ----------
// 手机上两个短值下拉框并排，分类因此变窄、控制区更紧凑；
// 桌面侧栏只有 290px，并排会太挤，所以要确认默认仍是纵向。
console.log('\n[2d] 控制区布局');
const groupRowPhone = (() => {
  const i = phoneBlock.indexOf('.group-row');
  return i >= 0 ? phoneBlock.slice(i, i + 120) : '';
})();
assert(/display:\s*flex/.test(groupRowPhone),
  '手机上分类与数据分布并排（分类变窄）');
const groupRowBase = (() => {
  const i = mainCss.indexOf('.group-row {');
  return i >= 0 ? mainCss.slice(i, i + 60) : '';
})();
assert(/display:\s*block/.test(groupRowBase),
  '桌面端分类与数据分布纵向排列（侧栏窄，并排会挤）');

// ---------- 3. 固定宽度是否超出手机视口 ----------
console.log('\n[3] 固定宽度是否会溢出手机视口');
// 找出所有「固定 px 宽度」声明（排除 min/max-width、height、font-size 等）
const fixedWidths = [...allCss.matchAll(/(?:^|[;{\s])width:\s*(\d+)px/g)]
  .map((m) => Number(m[1]))
  .filter((w) => w > 0 && w < 2000);

const PHONE_MAX = 360;   // 最窄的主流手机视口
const wideOnes = fixedWidths.filter((w) => w > PHONE_MAX);
assert(wideOnes.length === 0,
  wideOnes.length
    ? `这些固定宽度超过 ${PHONE_MAX}px，在窄屏会溢出：${[...new Set(wideOnes)].join(', ')}px`
    : `没有超过 ${PHONE_MAX}px 的固定宽度（共检查 ${fixedWidths.length} 处）`);

// ---------- 4. 横向滚动防护 ----------
console.log('\n[4] 横向溢出防护');
assert(/overflow-x:\s*hidden/.test(themeCss) || /max-width:\s*100%/.test(themeCss),
  '存在横向溢出防护（overflow-x 或 max-width）');

// 代码块必须有横向滚动而不是撑破布局
assert(/\.code-block[\s\S]{0,200}overflow/.test(mainCss) || /\.code-block[\s\S]{0,200}overflow/.test(themeCss),
  '代码块有自己的横向滚动（不撑破页面）');

// ---------- 4b. 代码块在手机上不能横滑 ----------
console.log('\n[4b] 代码块移动端可读性');
// 把所有 860px 断点块拼起来检查（规则可能分布在多个同名断点里）
const codeMobile = (() => {
  const out = [];
  let i = -1;
  while ((i = themeCss.indexOf('@media (max-width: 860px)', i + 1)) >= 0) {
    const next = themeCss.indexOf('@media', i + 10);
    out.push(themeCss.slice(i, next > 0 ? next : themeCss.length));
  }
  return out.join('\n');
})();

assert(/\.code-block[\s\S]{0,400}white-space:\s*pre-wrap/.test(codeMobile),
  '手机上代码块改为折行（pre-wrap），不再要求横滑');
assert(/\.code-block[\s\S]{0,400}overflow-x:\s*hidden/.test(codeMobile),
  '手机上代码块横向溢出被隐藏（不留横向滚动条）');
assert(/\.code-block[\s\S]{0,300}font-size:\s*1[01](\.\d)?px/.test(codeMobile),
  '手机上代码块字号收小（保证整行放得下）');

// ---------- 5. viewport meta ----------
console.log('\n[5] viewport 设置');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(/<meta[^>]+name="viewport"[^>]+width=device-width/.test(html),
  '页面包含 width=device-width 的 viewport 声明');

console.log('\n' + '='.repeat(58));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
