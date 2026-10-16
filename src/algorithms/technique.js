/**
 * 基础技巧类算法。
 *
 * 这一类和前面的排序/查找有个本质区别：
 * **它们不修改数组**，而是在数组上移动指针、维护区间、累加数值。
 * 所以它们用 SpanTracer，渲染出来是「数组 + 指针 + 窗口 + 累加值」。
 *
 * 这些技巧在竞赛里极其高频（洛谷入门/普及题单里到处都是），
 * 而且用动画理解比看文字推导快得多 —— 尤其是滑动窗口和差分。
 */

import { SpanTracer, BitTracer } from './tracer.js';

/**
 * 双指针：有序数组的两数之和。
 *
 * 左指针指向最小的，右指针指向最大的：
 *   和太小 → 左指针右移（换更大的）
 *   和太大 → 右指针左移（换更小的）
 * 每次移动都排除掉一整列可能性，所以是 O(n) 而不是 O(n²)。
 */
function twoSumSorted(input, options = {}) {
  const arr = input.slice().sort((a, b) => a - b);
  const target = options.target ?? arr[Math.floor(arr.length / 2)] + arr[Math.floor(arr.length / 2) + 1];

  const t = new SpanTracer(arr, {
    title: '双指针 · 两数之和',
    explain: `在有序数组里找两个数，使它们之和等于 ${target}。和太小就右移左指针，太大就左移右指针。`,
    target,
    pointers: [
      { name: 'L', color: '#f2b134', label: '左指针' },
      { name: 'R', color: '#e8563f', label: '右指针' },
    ],
  });

  let left = 0;
  let right = arr.length - 1;
  t.pointers({ L: left, R: right }, '初始：一个指最小，一个指最大');

  let found = null;
  let steps = 0;

  while (left < right) {
    steps++;
    const sum = arr[left] + arr[right];
    const ok = sum === target;
    t.check([left, right], ok, `${arr[left]} + ${arr[right]} = ${sum}，目标 ${target}`);

    if (ok) {
      found = [left, right];
      t.resolve(left, `答案：下标 ${left}`);
      t.resolve(right, `答案：下标 ${right}`);
      break;
    }

    if (sum < target) {
      // 和太小，需要更大 → 左指针右移
      left++;
      t.pointer('L', left, `和偏小 → 左指针右移（排除掉所有以 ${arr[left - 1]} 为左端的组合）`);
    } else {
      // 和太大，需要更小 → 右指针左移
      right--;
      t.pointer('R', right, `和偏大 → 右指针左移（排除掉所有以 ${arr[right + 1]} 为右端的组合）`);
    }

    t.pointers({ L: left, R: right });
  }

  if (found) {
    t.note(`✓ 找到：${arr[found[0]]} + ${arr[found[1]]} = ${target}（共 ${steps} 次比较，O(n) 而非 O(n²)）`);
  } else {
    t.note(`✗ 不存在两数之和等于 ${target}（共 ${steps} 次比较）`);
  }

  return { tracer: t, found, steps };
}

/**
 * 滑动窗口：最长无重复字符的子串长度（这里用数字数组演示，逻辑相同）。
 *
 * 右指针负责「扩张」，左指针负责在出现重复时「收缩」。
 * 窗口内始终保证没有重复元素，所以窗口长度的最大值就是答案。
 */
function slidingWindow(input) {
  // 用数字代替字符，逻辑完全一样且便于柱状图展示
  const arr = input.slice();
  const t = new SpanTracer(arr, {
    title: '滑动窗口 · 最长无重复区间',
    explain: '右指针不断扩张；一旦窗口内出现重复，左指针就收缩到重复元素之后。窗口内始终无重复。',
    pointers: [
      { name: 'L', color: '#f2b134', label: '窗口左端' },
      { name: 'R', color: '#e8563f', label: '窗口右端' },
    ],
  });

  let left = 0;
  let best = 0;
  let bestRange = [0, -1];
  /** 记录每个值最后出现的位置 */
  const lastSeen = new Map();

  t.pointers({ L: left, R: 0 }, '初始：窗口为空');
  t.window(0, -1, '空窗口');
  t.accumulate('当前长度', 0, '窗口长度');
  t.accumulate('最长长度', 0, '历史最优');

  for (let right = 0; right < arr.length; right++) {
    const value = arr[right];

    // 如果这个值在窗口内出现过，左指针跳到它后面
    if (lastSeen.has(value) && lastSeen.get(value) >= left) {
      const prev = lastSeen.get(value);
      t.check([prev, right], false, `值 ${value} 重复（上次在 ${prev}）→ 需要收缩左边界`);
      left = prev + 1;
      t.pointer('L', left, `左指针跳到 ${left}，跳过重复的 ${value}`);
    }

    lastSeen.set(value, right);
    t.pointer('R', right, `右指针扩张到 ${right}（值 ${value}）`);

    const len = right - left + 1;
    t.window(left, right, `窗口 [${left}, ${right}]，长度 ${len}`);
    t.accumulate('当前长度', len);

    if (len > best) {
      best = len;
      bestRange = [left, right];
      t.accumulate('最长长度', best, `刷新最优：${best}`);
    }
  }

  // 标出最终答案区间
  for (let i = bestRange[0]; i <= bestRange[1]; i++) t.resolve(i, '最长无重复区间');

  t.note(`✓ 最长无重复区间的长度是 ${best}（下标 ${bestRange[0]}~${bestRange[1]}）`);
  return { tracer: t, best, bestRange };
}

/**
 * 前缀和：预处理出 prefix[i] = 前 i 个元素之和，
 * 之后任意区间和都能 O(1) 算出来。
 *
 * 动画上会看到一条「累加条」逐步长高，然后高亮某个区间、
 * 用两次减法直接得到区间和 —— 这就是它比每次都重新累加快在哪。
 */
function prefixSum(input, options = {}) {
  const arr = input.slice();
  const t = new SpanTracer(arr, {
    title: '前缀和 · 区间求和',
    explain: '先累加出 prefix 数组，之后任意区间和 = prefix[R+1] - prefix[L]，一次减法搞定。',
    pointers: [
      { name: 'L', color: '#f2b134', label: '查询左端' },
      { name: 'R', color: '#e8563f', label: '查询右端' },
    ],
  });

  // ---- 阶段一：构建前缀和 ----
  const prefix = [0];
  t.accumulate('prefix[0]', 0, '前缀和起点定义为 0');
  for (let i = 0; i < arr.length; i++) {
    const next = prefix[i] + arr[i];
    prefix.push(next);
    t.window(0, i, `累加到第 ${i} 个元素`);
    t.accumulate(`prefix[${i + 1}]`, next, `prefix[${i + 1}] = prefix[${i}] + ${arr[i]} = ${next}`);
  }
  t.note('前缀和构建完成。接下来看区间查询有多快 ——');

  // ---- 阶段二：区间查询 ----
  // 选两个有代表性的区间
  const mid = Math.floor(arr.length / 2);
  const queries = [
    [0, mid - 1],
    [Math.max(0, mid - 2), arr.length - 1],
  ].filter(([l, r]) => l >= 0 && r < arr.length && l <= r);

  const results = [];
  for (const [l, r] of queries) {
    t.pointers({ L: l, R: r });
    t.window(l, r, `查询区间 [${l}, ${r}]`);

    // 朴素做法需要累加 r-l+1 次
    let naive = 0;
    for (let i = l; i <= r; i++) naive += arr[i];

    const fast = prefix[r + 1] - prefix[l];
    t.check([l, r], true,
      `区间和 = prefix[${r + 1}] - prefix[${l}] = ${prefix[r + 1]} - ${prefix[l]} = ${fast}`);
    t.accumulate('区间和', fast, `朴素做法要累加 ${r - l + 1} 次，前缀和只要 1 次减法`);

    results.push({ l, r, sum: fast, naiveAdds: r - l + 1 });
  }

  t.note(`✓ 前缀和数组长度 ${prefix.length}，每次查询 O(1)`);
  return { tracer: t, prefix, results };
}

/**
 * 差分数组：把「区间内每个数都加 v」从 O(n) 降到 O(1)。
 *
 * 做法：只在 diff[L] += v、diff[R+1] -= v 做两处标记，
 * 最后做一次前缀和还原出真正的数组。
 * 动画上会看到「只在两端戳两个点」，然后一次性还原 —— 非常直观。
 */
function differenceArray(input, options = {}) {
  const arr = input.slice();
  const t = new SpanTracer(arr, {
    title: '差分数组 · 区间批量修改',
    explain: '要给 [L, R] 每个数都加 v，只需 diff[L] += v、diff[R+1] -= v。最后做一次前缀和还原。',
    pointers: [
      { name: 'L', color: '#f2b134', label: '修改左端' },
      { name: 'R', color: '#e8563f', label: '修改右端' },
    ],
  });

  const n = arr.length;
  const diff = new Array(n + 1).fill(0);

  // 构造初始差分
  diff[0] = arr[0];
  t.accumulate('diff[0]', diff[0], `差分数组起点 = ${arr[0]}`);
  for (let i = 1; i < n; i++) {
    diff[i] = arr[i] - arr[i - 1];
    t.window(Math.max(0, i - 1), i, '看相邻两数的差');
    t.accumulate(`diff[${i}]`, diff[i], `diff[${i}] = ${arr[i]} - ${arr[i - 1]} = ${diff[i]}`);
  }
  t.note('差分数组构建完成。现在做几次区间修改 ——');

  // ---- 区间修改 ----
  const operations = options.operations ?? [
    { l: 1, r: Math.min(3, n - 1), v: 10 },
    { l: Math.max(0, n - 4), r: n - 2, v: -5 },
  ].filter((op) => op.l <= op.r && op.r < n);

  const applied = [];
  for (const { l, r, v } of operations) {
    t.pointers({ L: l, R: r });
    t.window(l, r, `给区间 [${l}, ${r}] 每个数加 ${v}`);
    t.check([l, r], true, `只需两处标记：diff[${l}] += ${v}，diff[${r + 1}] ${v >= 0 ? '-=' : '+='} ${Math.abs(v)}`);

    diff[l] += v;
    t.accumulate(`diff[${l}]`, diff[l], `左端 +${v}`);
    if (r + 1 <= n) {
      diff[r + 1] -= v;
      t.accumulate(`diff[${r + 1}]`, diff[r + 1], `右端之后 -${v}，把影响「关掉」`);
    } else {
      t.note('R+1 超出数组末尾，不需要标记（影响自然延伸到结尾）');
    }
    applied.push({ l, r, v });
  }

  // ---- 前缀和还原 ----
  t.note('现在做一次前缀和，还出修改后的数组 ——');
  const restored = [];
  let running = 0;
  for (let i = 0; i < n; i++) {
    running += diff[i];
    restored.push(running);
    const origin = arr[i];
    t.pointer('L', i, `还原第 ${i} 位：累加到 ${running}（原值 ${origin}）`);
    t.accumulate('当前累加', running, `加上 diff[${i}] = ${diff[i]}`);
  }

  // 与朴素做法对拍（保证动画展示的确实是正确结果）
  const naive = arr.slice();
  for (const { l, r, v } of applied) {
    for (let i = l; i <= r; i++) naive[i] += v;
  }
  const match = JSON.stringify(naive) === JSON.stringify(restored);
  t.note(match
    ? `✓ 还原结果与「逐个修改」的朴素做法完全一致：${restored.join(', ')}`
    : `✗ 出现偏差！差分结果 ${restored.join(', ')} vs 朴素 ${naive.join(', ')}`);

  return { tracer: t, diff, restored, naive, match, applied };
}

export const TECHNIQUE_ALGORITHMS = {
  twoPointers: {
    id: 'twoPointers',
    name: '双指针 · 两数之和',
    en: 'Two Pointers',
    category: 'technique',
    complexity: { time: 'O(n)', space: 'O(1)' },
    blurb: '一个指针指向最小、一个指向最大，根据两数之和与目标的大小关系移动指针。每次移动都能排除一整列组合。',
    inputKind: 'sortedArray',
    run: twoSumSorted,
    syntaxTopics: ['while-loop', 'array-index-math', 'comparison-ops'],
  },

  slidingWindow: {
    id: 'slidingWindow',
    name: '滑动窗口',
    en: 'Sliding Window',
    category: 'technique',
    complexity: { time: 'O(n)', space: 'O(k)' },
    blurb: '右指针扩张、左指针收缩，窗口内始终满足条件。用来求「最长/最短的满足某性质的连续区间」。',
    inputKind: 'smallRangeArray',
    run: slidingWindow,
    syntaxTopics: ['set-map', 'while-loop', 'short-circuit'],
  },

  prefixSum: {
    id: 'prefixSum',
    name: '前缀和',
    en: 'Prefix Sum',
    category: 'technique',
    complexity: { time: 'O(n) 预处理, O(1) 查询', space: 'O(n)' },
    blurb: '预先累加出 prefix 数组，之后任意区间和只需一次减法。用空间换时间最经典的例子。',
    inputKind: 'array',
    run: prefixSum,
    syntaxTopics: ['array-init', 'for-loop', 'array-index-math'],
  },

  differenceArray: {
    id: 'differenceArray',
    name: '差分数组',
    en: 'Difference Array',
    category: 'technique',
    complexity: { time: 'O(1) 修改, O(n) 还原', space: 'O(n)' },
    blurb: '区间批量加值只需在两端各标记一次，最后做一次前缀和还原。前缀和的逆运算。',
    inputKind: 'array',
    run: differenceArray,
    syntaxTopics: ['array-init', 'for-loop', 'short-circuit'],
  },
};

// =====================================================================
// 位运算（单独一类，用 BitTracer + 二进制位渲染器）
// =====================================================================

/**
 * 位运算演示：把两个整数拆成二进制，逐位展示各种操作的结果。
 * 这类算法的「数据」不是数组，而是几个 0/1 组成的行。
 */
function bitwiseDemo(input, options = {}) {
  const op = options.op ?? 'and';
  const bitWidth = 8;
  const a = options.a ?? 0b11001100; // 204
  const b = options.b ?? 0b10101010; // 170

  const OP_META = {
    and: { symbol: '&', name: '按位与 AND', calc: (x, y) => x & y, desc: '两位都是 1 才得 1（常用来「取某些位」）' },
    or: { symbol: '|', name: '按位或 OR', calc: (x, y) => x | y, desc: '有一位是 1 就得 1（常用来「置某些位为 1」）' },
    xor: { symbol: '^', name: '按位异或 XOR', calc: (x, y) => x ^ y, desc: '两位不同才得 1（常用来「翻转某些位」）' },
  };
  const meta = OP_META[op] || OP_META.and;

  const t = new BitTracer(bitWidth, {
    title: `位运算 · ${meta.name}`,
    explain: meta.desc,
    symbol: meta.symbol,
    opName: meta.name,
  });

  t.operand(0, a, `A = ${a}`);
  t.operand(1, b, `B = ${b}`);
  t.note(`逐位计算 A ${meta.symbol} B`);

  const bitsA = t.toBits(a);
  const bitsB = t.toBits(b);

  // 逐位算，从低位（最右）到高位，和手算顺序一致
  for (let i = bitWidth - 1; i >= 0; i--) {
    const ba = bitsA[i];
    const bb = bitsB[i];
    const br = meta.calc(ba, bb);
    const colIndex = bitWidth - 1 - i; // 渲染时的列序号（从左到右）
    t.focusColumn(colIndex, `第 ${bitWidth - 1 - i} 位：${ba} ${meta.symbol} ${bb} = ${br}`);
    t.resultBit(2, colIndex, br);
  }

  const resultValue = meta.calc(a, b);
  t.result(2, resultValue, `结果 = ${resultValue}`);

  // 顺便展示移位，帮助理解 << 和 >>
  t.note(`对比：A << 1 = ${(a << 1) & 0xff}（左移一位 = 乘 2），A >> 1 = ${a >> 1}（右移一位 = 除以 2，向下取整）`);

  return {
    tracer: t,
    a,
    b,
    op,
    result: resultValue,
    resultOp: meta.calc,
    shifted: { left: (a << 1) & 0xff, right: a >> 1 },
  };
}

export const BIT_ALGORITHMS = {
  bitwise: {
    id: 'bitwise',
    name: '位运算',
    en: 'Bitwise Ops',
    category: 'bits',
    complexity: { time: 'O(1)', space: 'O(1)' },
    blurb: '把整数看成二进制位逐位操作。与/或/异或各有用途，移位就是乘除 2 —— 状态压缩和位掩码的基础。',
    inputKind: 'bits',
    run: bitwiseDemo,
    syntaxTopics: ['number-types', 'math-floor', 'comparison-ops'],
  },
};
