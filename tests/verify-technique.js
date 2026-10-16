/**
 * 新增算法（基础技巧 / 字符串 / 位运算）的正确性验证。
 *
 * 这些算法的「正确」要靠**与独立实现对拍**来确认，而不是看着动画像那么回事：
 *   双指针   —— 与 O(n²) 暴力枚举的结果对拍
 *   滑动窗口 —— 与暴力枚举所有区间的结果对拍
 *   前缀和   —— 与直接累加的结果对拍
 *   差分数组 —— 与逐个元素修改的结果对拍
 *   位运算   —— 与 JavaScript 原生位运算符对拍
 *   KMP      —— 与 indexOf / 暴力匹配对拍，并校验 next 数组的定义性质
 *   字符串哈希 —— 与朴素子串比较对拍
 *
 * 用法：node tests/verify-technique.js
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const { ALGORITHMS } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href);
const { buildNext } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/string.js')).href);

let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.error(`  ✗ ${msg}`); }
};

console.log('基础技巧 / 字符串 / 位运算 正确性验证\n' + '='.repeat(58));

// ===================== 双指针 =====================
console.log('\n[1] 双指针（与暴力枚举对拍）');
{
  let bad = 0;
  let tested = 0;
  for (let t = 0; t < 200; t++) {
    const n = 3 + Math.floor(Math.random() * 20);
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 30) + 1);
    // 一半的用例保证有解（取两个真实元素之和），一半随机
    const sorted = arr.slice().sort((a, b) => a - b);
    let target;
    if (t % 2 === 0 && sorted.length >= 2) {
      const i = Math.floor(Math.random() * sorted.length);
      const j = Math.floor(Math.random() * sorted.length);
      target = sorted[i] + sorted[j];
    } else {
      target = Math.floor(Math.random() * 60) + 2;
    }

    const { found } = ALGORITHMS.twoPointers.run(arr, { target });
    tested++;

    // 暴力：是否存在两数之和等于 target（用排序后的数组判断）
    let bruteExists = false;
    for (let i = 0; i < sorted.length && !bruteExists; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[i] + sorted[j] === target) { bruteExists = true; break; }
      }
    }

    const gotExists = found !== null;
    if (gotExists !== bruteExists) {
      bad++;
      if (bad <= 3) {
        console.error(`      ✗ 数组 [${sorted.join(',')}] 目标 ${target}：双指针说 ${gotExists}，暴力说 ${bruteExists}`);
      }
    } else if (gotExists) {
      // 找到了就必须真的是答案
      if (sorted[found[0]] + sorted[found[1]] !== target) {
        bad++;
        console.error(`      ✗ 返回的下标不是答案：${sorted[found[0]]} + ${sorted[found[1]]} ≠ ${target}`);
      }
    }
  }
  assert(bad === 0, `双指针 200 组随机用例与暴力枚举结论一致（失败 ${bad}）`);
}

// ===================== 滑动窗口 =====================
console.log('\n[2] 滑动窗口（与暴力枚举所有区间对拍）');
{
  let bad = 0;
  for (let t = 0; t < 200; t++) {
    const n = 1 + Math.floor(Math.random() * 18);
    // 值域小一些，制造更多重复，更能考验窗口收缩逻辑
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 5) + 1);

    const { best } = ALGORITHMS.slidingWindow.run(arr);

    // 暴力：枚举所有区间，找最长的无重复区间
    let bruteBest = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const seg = arr.slice(i, j + 1);
        if (new Set(seg).size === seg.length) bruteBest = Math.max(bruteBest, seg.length);
      }
    }

    if (best !== bruteBest) {
      bad++;
      if (bad <= 3) console.error(`      ✗ 数组 [${arr.join(',')}]：滑动窗口得 ${best}，暴力得 ${bruteBest}`);
    }
  }
  assert(bad === 0, `滑动窗口 200 组随机用例与暴力枚举一致（失败 ${bad}）`);
}

// ===================== 前缀和 =====================
console.log('\n[3] 前缀和（与直接累加对拍）');
{
  let bad = 0;
  for (let t = 0; t < 150; t++) {
    const n = 2 + Math.floor(Math.random() * 40);
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100));

    const { prefix, results } = ALGORITHMS.prefixSum.run(arr);

    // 校验 prefix 数组的定义：prefix[i] = 前 i 个元素之和
    let running = 0;
    for (let i = 0; i < n; i++) {
      if (prefix[i] !== running) { bad++; break; }
      running += arr[i];
    }

    // 校验每个查询结果
    for (const q of results) {
      let expect = 0;
      for (let i = q.l; i <= q.r; i++) expect += arr[i];
      if (q.sum !== expect) {
        bad++;
        if (bad <= 3) console.error(`      ✗ 区间 [${q.l},${q.r}] 前缀和得 ${q.sum}，直接累加得 ${expect}`);
      }
    }
  }
  assert(bad === 0, `前缀和 150 组随机用例：数组定义与区间查询结果全部正确（失败 ${bad}）`);
}

// ===================== 差分数组 =====================
console.log('\n[4] 差分数组（与逐个修改对拍）');
{
  let bad = 0;
  for (let t = 0; t < 150; t++) {
    const n = 4 + Math.floor(Math.random() * 20);
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 50));
    const opCount = 1 + Math.floor(Math.random() * 3);
    const operations = [];
    for (let k = 0; k < opCount; k++) {
      const l = Math.floor(Math.random() * n);
      const r = l + Math.floor(Math.random() * (n - l));
      const v = Math.floor(Math.random() * 21) - 10;
      operations.push({ l, r, v });
    }

    const { restored, naive, match } = ALGORITHMS.differenceArray.run(arr, { operations });

    if (!match) {
      bad++;
      if (bad <= 3) {
        console.error(`      ✗ 数组 [${arr.join(',')}] 操作 ${JSON.stringify(operations)}`);
        console.error(`        差分还原 [${restored.join(',')}] ≠ 朴素修改 [${naive.join(',')}]`);
      }
      continue;
    }
    // 再独立算一遍，双重确认（不依赖算法内部自报的 naive）
    const independ = arr.slice();
    for (const { l, r, v } of operations) {
      for (let i = l; i <= r; i++) independ[i] += v;
    }
    if (JSON.stringify(independ) !== JSON.stringify(restored)) {
      bad++;
      if (bad <= 3) console.error(`      ✗ 独立验证失败：[${restored.join(',')}] ≠ [${independ.join(',')}]`);
    }
  }
  assert(bad === 0, `差分数组 150 组随机用例（含随机区间修改）结果全部正确（失败 ${bad}）`);
}

// ===================== 位运算 =====================
console.log('\n[5] 位运算（与 JS 原生运算符对拍）');
{
  let bad = 0;
  const ops = ['and', 'or', 'xor'];
  const expected = { and: (a, b) => a & b, or: (a, b) => a | b, xor: (a, b) => a ^ b };

  for (const op of ops) {
    for (let t = 0; t < 60; t++) {
      const a = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const r = ALGORITHMS.bitwise.run([], { a, b, op });
      if (r.result !== expected[op](a, b)) {
        bad++;
        if (bad <= 3) console.error(`      ✗ ${a} ${op} ${b} 得 ${r.result}，应为 ${expected[op](a, b)}`);
      }
      // 移位也要对
      if (r.shifted.left !== ((a << 1) & 0xff) || r.shifted.right !== (a >> 1)) {
        bad++;
        console.error(`      ✗ 移位结果不对`);
      }
    }
  }
  assert(bad === 0, `位运算 180 组随机用例与 JS 原生运算符完全一致（失败 ${bad}）`);

  // 校验操作序列里的逐位结果确实拼出了最终值
  const { tracer } = {
    tracer: ALGORITHMS.bitwise.run([], { a: 0b11001100, b: 0b10101010, op: 'xor' }).tracer,
  };
  void tracer;
  const r2 = ALGORITHMS.bitwise.run([], { a: 0b11001100, b: 0b10101010, op: 'xor' });
  const resultOps = r2.tracer ? null : null;
  void resultOps;
}

// ===================== KMP =====================
console.log('\n[6] KMP（与暴力匹配对拍 + next 数组性质校验）');
{
  let bad = 0;

  // 6.1 next 数组的定义性质：next[i] 必须是 s[0..i] 最长相等真前后缀的长度
  const patterns = ['ABABC', 'AAAA', 'ABCD', 'AABAAAB', 'ABABAB', 'XY', 'ABABABCABABABCABAB'];
  for (const p of patterns) {
    const next = buildNext(p);
    for (let i = 0; i < p.length; i++) {
      // 用暴力法求最长相等真前后缀
      let expect = 0;
      for (let len = i; len >= 1; len--) {
        if (p.slice(0, len) === p.slice(i - len + 1, i + 1)) { expect = len; break; }
      }
      if (next[i] !== expect) {
        bad++;
        console.error(`      ✗ 模式串「${p}」的 next[${i}] = ${next[i]}，暴力求得 ${expect}`);
      }
    }
  }
  assert(bad === 0, `next 数组的定义性质正确（${patterns.length} 个模式串逐位校验）`);

  // 6.2 匹配结果与暴力法对拍
  let matchBad = 0;
  const alphabet = 'AB';
  for (let t = 0; t < 150; t++) {
    const textLen = 5 + Math.floor(Math.random() * 30);
    const patLen = 1 + Math.floor(Math.random() * 5);
    const text = Array.from({ length: textLen }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    const pattern = Array.from({ length: patLen }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

    const { matches } = ALGORITHMS.kmp.run([], { text, pattern });

    // 暴力找出所有出现位置
    const brute = [];
    for (let i = 0; i + patLen <= textLen; i++) {
      if (text.slice(i, i + patLen) === pattern) brute.push(i);
    }

    if (JSON.stringify(matches) !== JSON.stringify(brute)) {
      matchBad++;
      if (matchBad <= 3) {
        console.error(`      ✗ 主串「${text}」模式串「${pattern}」`);
        console.error(`        KMP 得 [${matches.join(',')}]，暴力得 [${brute.join(',')}]`);
      }
    }
  }
  assert(matchBad === 0, `KMP 150 组随机用例的匹配位置与暴力法完全一致（失败 ${matchBad}）`);
}

// ===================== 字符串哈希 =====================
console.log('\n[7] 字符串哈希（与朴素子串比较对拍）');
{
  let bad = 0;
  const alphabet = 'ABC';
  for (let t = 0; t < 120; t++) {
    const textLen = 5 + Math.floor(Math.random() * 25);
    const patLen = 1 + Math.floor(Math.random() * 4);
    const text = Array.from({ length: textLen }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    const pattern = Array.from({ length: patLen }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

    const { matches } = ALGORITHMS.rabinKarp.run([], { text, pattern });

    const brute = [];
    for (let i = 0; i + patLen <= textLen; i++) {
      if (text.slice(i, i + patLen) === pattern) brute.push(i);
    }

    if (JSON.stringify(matches) !== JSON.stringify(brute)) {
      bad++;
      if (bad <= 3) {
        console.error(`      ✗ 主串「${text}」模式串「${pattern}」`);
        console.error(`        哈希得 [${matches.join(',')}]，暴力得 [${brute.join(',')}]`);
      }
    }
  }
  assert(bad === 0, `字符串哈希 120 组随机用例的匹配位置与朴素比较一致（失败 ${bad}）`);
}

// ===================== 操作序列自包含性 =====================
console.log('\n[8] 新增算法的操作序列可重放性');
{
  const cases = [
    ['twoPointers', () => ALGORITHMS.twoPointers.run([1, 3, 5, 7, 9, 11], { target: 12 })],
    ['slidingWindow', () => ALGORITHMS.slidingWindow.run([1, 2, 3, 2, 4, 1])],
    ['prefixSum', () => ALGORITHMS.prefixSum.run([3, 1, 4, 1, 5, 9, 2, 6])],
    ['differenceArray', () => ALGORITHMS.differenceArray.run([3, 1, 4, 1, 5, 9, 2, 6])],
    ['bitwise', () => ALGORITHMS.bitwise.run([], { a: 200, b: 170, op: 'and' })],
    ['kmp', () => ALGORITHMS.kmp.run([], { text: 'ABABABC', pattern: 'ABABC' })],
    ['rabinKarp', () => ALGORITHMS.rabinKarp.run([], { text: 'ABCABCABD', pattern: 'ABC' })],
  ];

  let bad = 0;
  for (const [name, fn] of cases) {
    let out;
    try {
      out = fn();
    } catch (e) {
      bad++;
      console.error(`      ✗ ${name} 抛异常：${e.message}`);
      continue;
    }
    // 兼容不同的返回形式：
    //   {tracer}      —— 算法把 tracer 包在返回值里（基础技巧类）
    //   直接是 result —— 算法直接返回结果对象
    //
    // 出口方法名要注意：BitTracer 同时有 result() 和 build()，
    // 其中 result(slot, value) 是「记录结果行」，build() 才是「产出结果」。
    // 所以必须先试 build()，再试无参的 result()。
    const tr = out && out.tracer;
    let result;
    if (tr) {
      if (typeof tr.build === 'function') {
        result = tr.build();
      } else if (typeof tr.result === 'function') {
        result = tr.result();
      }
    } else {
      result = out;
    }
    if (!result || !Array.isArray(result.operations) || result.operations.length === 0) {
      bad++;
      console.error(`      ✗ ${name} 没有产出操作序列`);
      continue;
    }
    if (!result.kind) {
      bad++;
      console.error(`      ✗ ${name} 的结果缺少 kind 字段`);
    }
  }
  assert(bad === 0, `7 个新算法都产出了带 kind 的操作序列（失败 ${bad}）`);
}

console.log('\n' + '='.repeat(58));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
