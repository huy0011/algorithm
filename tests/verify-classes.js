/**
 * 静态检查：类的重复方法名。
 *
 * 为什么单独写这个测试：
 * 这个坑踩过两次 —— 而且是**静默**的。
 * 在 JS 里，同一个类里写两个同名方法不会报错，后一个会直接覆盖前一个。
 *
 * 具体案例：StructureTracer 里同时写了
 *   result(ok, note)  —— 记录判定结果
 *   result()          —— 产出最终结果
 * 后者把前者覆盖了，导致栈演示的判定记录永远为空，
 * 括号匹配的结论一直是 undefined，但代码「看起来」完全正常。
 *
 * 这类 bug 语法检查抓不到，只有运行到那条路径才会暴露。
 * 所以这里用静态分析提前拦住。
 *
 * 用法：node tests/verify-classes.js
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

/** 递归收集 src 下所有 .js 文件。 */
function collectFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

console.log('类的重复方法名检查\n' + '='.repeat(56));

const files = collectFiles(path.join(ROOT, 'src'));
const problems = [];
let classCount = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');

  // 找出所有 class 及其起止位置
  const classRe = /(?:export\s+)?class\s+(\w+)[^{]*\{/g;
  const classes = [];
  let m;
  while ((m = classRe.exec(src))) classes.push({ name: m[1], start: m.index, bodyStart: classRe.lastIndex });

  classes.forEach((cls, i) => {
    classCount++;
    const body = src.slice(cls.bodyStart, i + 1 < classes.length ? classes[i + 1].start : src.length);

    // 收集方法名：两个空格缩进 + 标识符 + 左括号（排除 if/for/while 等关键字）
    const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'function']);
    const methods = [];
    for (const mm of body.matchAll(/^ {2}(?:static\s+)?(?:get\s+|set\s+)?(\w+)\s*\(/gm)) {
      const name = mm[1];
      if (KEYWORDS.has(name)) continue;
      methods.push(name);
    }

    const seen = new Map();
    for (const name of methods) {
      seen.set(name, (seen.get(name) || 0) + 1);
    }
    const dups = [...seen.entries()].filter(([, n]) => n > 1).map(([n]) => n);
    if (dups.length) {
      problems.push(`${rel} 的 ${cls.name} 类里重复定义了方法：${dups.join(', ')}`);
    }
  });
}

assert(problems.length === 0,
  problems.length
    ? `发现重复方法名（后者会静默覆盖前者）：\n     ${problems.join('\n     ')}`
    : `检查了 ${classCount} 个类，没有重复方法名`);

// 额外：检查各 Tracer 是否都有产出结果的方法
console.log('\n[2] 各 Tracer 是否都有产出结果的入口');
const tracerSrc = fs.readFileSync(path.join(ROOT, 'src/algorithms/tracer.js'), 'utf8');
const tracerNames = [...tracerSrc.matchAll(/export class (\w+Tracer)\s*\{/g)].map((m) => m[1]);
assert(tracerNames.length >= 6, `找到 ${tracerNames.length} 个 Tracer 类：${tracerNames.join(', ')}`);

const missingBuild = [];
for (const name of tracerNames) {
  const idx = tracerSrc.indexOf(`export class ${name}`);
  const nextIdx = tracerSrc.indexOf('export class', idx + 10);
  const body = tracerSrc.slice(idx, nextIdx === -1 ? tracerSrc.length : nextIdx);
  // 产出结果的方法：result() 或 build()
  if (!/\b(result|build)\s*\(\s*\)\s*\{/.test(body)) {
    missingBuild.push(name);
  }
}
assert(missingBuild.length === 0,
  missingBuild.length ? `这些 Tracer 缺少产出结果的方法：${missingBuild.join(', ')}` : '每个 Tracer 都有 result() 或 build() 作为出口');

console.log('\n' + '='.repeat(56));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
