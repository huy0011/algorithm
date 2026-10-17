/**
 * 字符串算法：KMP 匹配、字符串哈希。
 *
 * 这两个算法的价值在于「把 O(n×m) 变成 O(n+m)」和「O(1) 判断子串相等」，
 * 但光看代码很难理解为什么成立。动画的意义就在这里：
 *
 *   KMP  —— 看到「失配时不是回到起点，而是跳到 next 指示的位置」，
 *           从而明白为什么主串指针 i 永远不回退。
 *   哈希 —— 看到滑动窗口每次只需要「去掉首位、加上末位」两次运算，
 *           从而明白预处理之后为什么是 O(1)。
 *
 * 它们用 SpanTracer：主体是字符串（按字符铺开），指针是 i / j。
 */

import { SpanTracer } from './tracer.js';

/**
 * 构造 KMP 的 next 数组（前缀函数）。
 *
 * next[i] 的含义：子串 s[0..i] 中，最长的「相等的真前缀与真后缀」的长度。
 * 这个数组是 KMP 的灵魂 —— 失配时靠它决定退到哪，而不是退回起点。
 */
function buildNext(pattern) {
  const next = new Array(pattern.length).fill(0);
  let k = 0; // 当前已匹配的前缀长度
  for (let i = 1; i < pattern.length; i++) {
    while (k > 0 && pattern[i] !== pattern[k]) {
      k = next[k - 1]; // 回退到次长的候选
    }
    if (pattern[i] === pattern[k]) k++;
    next[i] = k;
  }
  return next;
}

/**
 * KMP 字符串匹配。
 *
 * 为了能在柱状图渲染器里展示，把字符编码成数字（a=1, b=2, ...）。
 * 这样既能复用现有的「数组 + 指针」可视化，又能保留完整的字符语义 ——
 * 画面上标注的仍然是真实字符。
 */
function kmpSearch(input, options = {}) {
  const text = options.text ?? 'ABABABCABABABCABAB';
  const pattern = options.pattern ?? 'ABABC';

  // 把字符转成数值，方便复用数组渲染（A=1, B=2, ...）
  const encode = (s) => [...s].map((ch) => ch.charCodeAt(0) - 64);
  const textArr = encode(text);

  const t = new SpanTracer(textArr, {
    title: 'KMP 字符串匹配',
    explain: `在主串里找模式串「${pattern}」。核心：失配时主串指针 i 不回退，只按 next 数组移动模式串指针 j。`,
    text,
    pattern,
    /** 渲染器据此把数值还原成字符显示 */
    charOffset: 64,
    pointers: [
      { name: 'i', color: '#f2b134', label: '主串指针（只前进，不回退）' },
      { name: 'j', color: '#e8563f', label: '模式串指针（失配时按 next 回退）' },
    ],
  });

  // ---- 阶段一：构建 next 数组 ----
  const next = buildNext(pattern);
  t.note(`第一步：计算模式串「${pattern}」的 next 数组 = [${next.join(', ')}]`);
  // next 数组作为辅助行按位显示（对齐模式串位置）
  const nextRow = pattern.split('').map(() => null);
  t.extraRow(0, 'next', nextRow);
  for (let i = 0; i < pattern.length; i++) {
    nextRow[i] = next[i];
    t.extraRow(0, 'next', nextRow);
    t.accumulate(`next[${i}]`, next[i], `next[${i}] = ${next[i]}（前缀「${pattern.slice(0, next[i])}」= 后缀）`);
  }

  // ---- 阶段二：匹配 ----
  t.note('第二步：开始匹配（注意 i 只前进，从不后退）');

  const patternArr = encode(pattern);
  let j = 0;
  const matches = [];
  let comparisons = 0;

  for (let i = 0; i < textArr.length; i++) {
    t.pointer('i', i, `主串第 ${i} 位是「${text[i]}」`);

    // 失配时按 next 回退 j（这就是 KMP 比暴力快的原因）
    while (j > 0 && textArr[i] !== patternArr[j]) {
      comparisons++;
      t.check([i, j], false,
        `「${text[i]}」≠ 模式串「${pattern[j]}」→ 失配，j 从 ${j} 回退到 next[${j - 1}] = ${next[j - 1]}（i 不动）`);
      j = next[j - 1];
      t.pointer('j', j, `j 回退到 ${j}`);
    }

    comparisons++;
    if (textArr[i] === patternArr[j]) {
      t.check([i, j], true, `「${text[i]}」匹配模式串「${pattern[j]}」→ j 前进`);
      j++;
    }

    t.pointer('j', j, `当前已匹配 ${j} 个字符`);

    if (j === pattern.length) {
      const start = i - pattern.length + 1;
      matches.push(start);
      t.note(`✓ 在下标 ${start} 处找到完整匹配「${pattern}」`);
      for (let k = start; k <= i; k++) t.resolve(k, '匹配到的位置');
      j = next[j - 1]; // 继续找下一个匹配
      t.pointer('j', j, `继续找下一个匹配，j 回到 ${j}`);
    }
  }

  if (matches.length === 0) {
    t.note(`✗ 没有找到「${pattern}」（共比较 ${comparisons} 次）`);
  } else {
    t.note(`✓ 共找到 ${matches.length} 处匹配，起始下标：${matches.join(', ')}（共比较 ${comparisons} 次）`);
  }

  return { tracer: t, next, matches, comparisons, pattern, text };
}

/**
 * 字符串哈希（滚动哈希 / Rabin-Karp）。
 *
 * 把字符串看成 B 进制数，用前缀哈希数组让「任意子串的哈希」能 O(1) 算出，
 * 再配合滑动窗口就能 O(n+m) 找子串。
 *
 * 这里不用大质数取模（教学场景下用 32 位溢出模拟），
 * 但会明确说明真实竞赛里必须取模防碰撞。
 */
function rabinKarp(input, options = {}) {
  const text = options.text ?? 'ABCABCABDABC';
  const pattern = options.pattern ?? 'ABC';

  const encode = (s) => [...s].map((ch) => ch.charCodeAt(0) - 64);
  const textArr = encode(text);

  const t = new SpanTracer(textArr, {
    title: '字符串哈希 · Rabin-Karp',
    explain: `把字符串当成进制数。先用一遍预处理求出「前缀哈希」，之后任意子串的哈希都能 O(1) 算出，再滑动窗口比对。`,
    text,
    pattern,
    charOffset: 64,
    pointers: [
      { name: 'L', color: '#f2b134', label: '窗口左端' },
      { name: 'R', color: '#e8563f', label: '窗口右端' },
    ],
  });

  const BASE = 131; // 常用基数（大于字符集，减少碰撞）
  /**
   * 取模的质数。
   *
   * 这里必须真正取模，不能靠 32 位溢出「假装取模」——
   * 因为「去掉首位」时要乘 BASE^(M-1)，这个乘法和溢出截断混在一起后，
   * 前缀哈希的减法关系就不再成立，会出现漏匹配（这是实际踩过的坑：
   * 主串 BBBABBBBABBBB… 模式串 BBBA 时，只报出第 1 个匹配，漏了后两个）。
   */
  const MOD = 1000000007;
  const M = pattern.length;

  /** 模意义下的乘法，避免中间结果超出安全整数范围。 */
  const mulmod = (a, b) => {
    // BASE 和 a 都小于 MOD（约 1e9），乘积约 1e18 会超过 2^53，
    // 所以用 BigInt 保证精确，再转回 Number。
    return Number((BigInt(a) * BigInt(b)) % BigInt(MOD));
  };

  // ---- 阶段一：预处理前缀哈希 ----
  t.note(`第一步：预处理前缀哈希（基数 BASE = ${BASE}，模数 MOD = ${MOD}）`);
  const prefixHash = [0];
  for (let i = 0; i < textArr.length; i++) {
    const h = (mulmod(prefixHash[i], BASE) + textArr[i]) % MOD;
    prefixHash.push(h);
    t.window(0, i, `累加到第 ${i} 个字符「${text[i]}」`);
    t.accumulate(`hash[${i + 1}]`, h % 100000, `hash[${i + 1}] = (hash[${i}] × ${BASE} + ${textArr[i]}) mod ${MOD} —— 这里显示后 5 位`);
  }
  t.note('前缀哈希构建完成。现在滑动窗口比对 ——');

  // 模式串自己的哈希
  let patternHash = 0;
  for (const code of encode(pattern)) {
    patternHash = (mulmod(patternHash, BASE) + code) % MOD;
  }
  t.accumulate('模式串哈希', patternHash % 100000, `模式串「${pattern}」的哈希值`);

  // ---- 阶段二：滑动窗口 ----
  /** BASE^M mod MOD，用于「去掉首位」 */
  let power = 1;
  for (let i = 0; i < M; i++) power = mulmod(power, BASE);

  const matches = [];
  let windowsChecked = 0;
  let hashHits = 0;
  let charComparisons = 0;

  for (let l = 0; l + M <= textArr.length; l++) {
    const r = l + M - 1;
    t.pointers({ L: l, R: r });
    t.window(l, r, `窗口 [${l}, ${r}] = 「${text.slice(l, r + 1)}」`);

    // 用前缀哈希 O(1) 算出这个窗口的哈希
    // 窗口哈希 = hash[r+1] - hash[l] * BASE^M  （模意义下）
    let windowHash = (prefixHash[r + 1] - mulmod(prefixHash[l], power)) % MOD;
    if (windowHash < 0) windowHash += MOD;
    windowsChecked++;

    const same = windowHash === patternHash;
    // 哈希相同只是「可能是答案」，必须再逐字符确认（防碰撞）
    let realMatch = false;
    if (same) {
      hashHits++;
      charComparisons += M;
      realMatch = text.slice(l, r + 1) === pattern;
      t.check([l, r], realMatch,
        `哈希相同（${windowHash % 100000}）→ 逐字符验证：${realMatch ? '确实相同' : '哈希碰撞！实际不同'}`);
    } else {
      t.check([l, r], false, `哈希不同（${windowHash % 100000} ≠ ${patternHash % 100000}）→ 直接跳过，无需逐字符比较`);
    }

    t.accumulate('窗口哈希', windowHash % 100000);

    if (realMatch) {
      matches.push(l);
      for (let k = l; k <= r; k++) t.resolve(k, '匹配位置');
      t.note(`✓ 在下标 ${l} 处匹配成功`);
    }
  }

  t.note(
    `✓ 共检查 ${windowsChecked} 个窗口，哈希命中 ${hashHits} 次，` +
    `逐字符比较 ${charComparisons} 次，找到 ${matches.length} 处匹配` +
    (matches.length ? `（起始下标 ${matches.join(', ')}）` : '') +
    '。哈希的作用：大多数窗口一次比较就能排除，省掉大量逐字符比对。'
  );
  t.note('提醒：真实竞赛中取模要选合适的质数并考虑双哈希，降低碰撞概率。');

  return { tracer: t, prefixHash, patternHash, matches, windowsChecked };
}

export const STRING_ALGORITHMS = {
  kmp: {
    id: 'kmp',
    name: 'KMP 字符串匹配',
    en: 'KMP',
    category: 'string',
    complexity: { time: 'O(n + m)', space: 'O(m)' },
    blurb: '失配时利用 next 数组让模式串「聪明地」回退，主串指针永不后退，因此是线性时间。',
    inputKind: 'stringPair',
    run: kmpSearch,
    syntaxTopics: ['while-loop', 'array-basics', 'nested-loop'],
  },

  rabinKarp: {
    id: 'rabinKarp',
    name: '字符串哈希',
    en: 'Rabin-Karp',
    category: 'string',
    complexity: { time: 'O(n + m) 平均', space: 'O(n)' },
    blurb: '把字符串当成进制数算出哈希，用滑动窗口 O(1) 比对。哈希不同可直接跳过，省掉逐字符比较。',
    inputKind: 'stringPair',
    run: rabinKarp,
    syntaxTopics: ['number-types', 'array-init', 'math-floor'],
  },
};

/** 把字符串算法用到的字符编码/解码暴露出来，供渲染器显示真实字符。 */
export { buildNext };
