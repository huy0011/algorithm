/**
 * 查找类算法：二分查找、二分答案。
 *
 * 它们和排序共用同一套「只产出操作序列」的设计，但动作不同：
 *   排序在「搬动数据」，查找在「收窄区间」。
 * 所以它们用 SearchTracer，渲染层用查找专用渲染器（区间条 + 指针）。
 *
 * 数据规模很小（查找只要 O(log n) 步），所以这里的 demo 数据是精心设计的，
 * 让每一次折半都清晰可见，而不是一眨眼就结束。
 */

import { SearchTracer } from './tracer.js';

/**
 * 标准二分查找：在有序数组中找 target。
 * 用的是「闭区间」写法 [lo, hi]，每一步都记录探测点和区间变化。
 */
function binarySearch(input, options = {}) {
  const target = options.target;
  const t = new SearchTracer(input, {
    target,
    title: '二分查找',
    lo: 0,
    hi: input.length - 1,
  });

  let lo = 0;
  let hi = input.length - 1;
  t.narrow(lo, hi, '初始区间：整个数组');

  while (lo <= hi) {
    // 这么写而不是 (lo+hi)/2，是为了避免 lo+hi 溢出（在大数场景下有意义）
    const mid = lo + Math.floor((hi - lo) / 2);
    const value = input[mid];
    const cmp = value === target ? 0 : value < target ? -1 : 1;
    t.probe(mid, value, cmp);

    if (cmp === 0) {
      t.found(mid, value);
      t.narrow(mid, mid, '命中，区间收缩到这一个位置');
      return t.result();
    }

    if (cmp < 0) {
      lo = mid + 1;
      t.narrow(lo, hi, `${value} < ${target}，目标只可能在右半边`);
    } else {
      hi = mid - 1;
      t.narrow(lo, hi, `${value} > ${target}，目标只可能在左半边`);
    }
  }

  // 区间空了，说明不存在
  t.found(-1, null);
  t.narrow(lo, hi, '区间已空，目标不存在');
  return t.result();
}

/**
 * 二分答案：不搜数组，而是搜「答案的取值空间」。
 *
 * 经典例子：把 n 根绳子切成等长的 k 段，每段最长能有多长？
 * 答案是单调的 —— 如果长度 L 可行，那么比 L 短的一定也可行。
 * 这种单调性正是二分的前提，也是二分答案最容易被忽略的关键。
 */
function binarySearchAnswer(input, options = {}) {
  // 用数组里的最大值作为搜索上界，切成 options.pieces 段
  const pieces = options.pieces ?? 5;
  const maxLen = Math.max(...input, 0);
  const t = new SearchTracer(input, {
    target: null,
    pieces,
    title: '二分答案',
    lo: 1,
    hi: maxLen,
    /** 渲染器要用它来画「需要切出的段数」 */
    unit: '长度',
  });

  /** 判定函数：以长度 L 去切，能否切出至少 pieces 段？ */
  const feasible = (len) => {
    if (len <= 0) return false;
    let count = 0;
    for (const rope of input) count += Math.floor(rope / len);
    return count >= pieces;
  };

  let lo = 1;
  let hi = maxLen;
  let best = 0;
  t.narrow(lo, hi, `初始答案区间：[1, ${maxLen}]`);
  t.answer(best, false, `目标：切出至少 ${pieces} 段等长绳子，求最大长度`);

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const ok = feasible(mid);
    // 把这次判定记为一次「探测」，值空间就是它的数组
    t.probe(Math.min(mid, input.length - 1), mid, ok ? 0 : 1);
    t.answer(mid, ok, ok ? `长度 ${mid} 可行 → 尝试更长` : `长度 ${mid} 不可行 → 必须更短`);

    if (ok) {
      best = mid;
      lo = mid + 1;
      t.narrow(lo, hi, `记录可行解 ${mid}，继续往右找更大的`);
    } else {
      hi = mid - 1;
      t.narrow(lo, hi, `${mid} 不可行，往左找`);
    }
  }

  t.found(-1, best);
  t.answer(best, true, `最终答案：${best}`);
  return t.result();
}

export const SEARCH_ALGORITHMS = {
  binarySearch: {
    id: 'binarySearch',
    name: '二分查找',
    en: 'Binary Search',
    category: 'search',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    blurb: '每次把搜索区间折半。前提是数据必须有序 —— 这是二分唯一但最容易被忽略的要求。',
    /** 这个算法需要什么形态的输入 */
    inputKind: 'sortedArray',
    needsTarget: true,
    run: binarySearch,
    /** 界面上的语法点关联 */
    syntaxTopics: ['while-loop', 'mid-overflow', 'comparison-ops'],
  },

  binarySearchAnswer: {
    id: 'binarySearchAnswer',
    name: '二分答案',
    en: 'Binary Search on Answer',
    category: 'search',
    complexity: { time: 'O(n log C)', space: 'O(1)' },
    blurb: '不搜数组，而是搜「答案的取值范围」。只要判定函数随答案单调，就能二分 —— 这是二分的进阶用法。',
    inputKind: 'ropes',
    needsTarget: false,
    run: binarySearchAnswer,
    syntaxTopics: ['while-loop', 'closures', 'arrow-function'],
  },
};

/**
 * 为二分查找挑一个「好演示」的目标：位置在中段、折半次数适中的那个。
 * 如果随便选，很可能第 1 步就命中，动画就没什么可看。
 */
export function pickSearchTarget(sortedArray) {
  if (sortedArray.length === 0) return 0;
  // 选一个需要 3~4 次折半的位置
  const idealStep = Math.min(3, Math.floor(Math.log2(sortedArray.length)));
  const idx = Math.min(sortedArray.length - 1, Math.pow(2, idealStep) - 1);
  return sortedArray[idx];
}
