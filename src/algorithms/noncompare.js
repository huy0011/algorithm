/**
 * 非比较排序：计数排序、基数排序、桶排序。
 *
 * 这三个算法的意义在于展示一个关键结论：
 * **排序不一定非要两两比较**。它们的比较次数都是 0，
 * 代价是需要额外的空间、或者要求数据满足特定条件（范围有限 / 位数有限 / 分布均匀）。
 *
 * 这与前面的 O(n log n) 比较排序形成鲜明对照 ——
 * 动画上你会看到「没有柱子互相比较」的排序，这本身就很有说服力。
 */

import { BarTracer } from './tracer.js';

/**
 * 计数排序：统计每个值出现几次，然后按值顺序写回。
 * 前提：取值范围不能太大（要开一个和值域一样大的数组）。
 */
function countingSort(input) {
  const t = new BarTracer(input);
  const n = t.array.length;
  if (n === 0) return t.result();

  const min = Math.min(...input);
  const max = Math.max(...input);
  const range = max - min + 1;

  // 值域太大时计数排序会浪费巨量空间，这里直接说明并退化为不再演示
  // （教学场景下强调「有前提」比强行跑通更有价值）
  if (range > 200) {
    t.highlightRange(0, n - 1, `值域跨度 ${range} 过大，计数排序需要 ${range} 个计数格，不划算`);
  }

  // 统计每个值出现几次
  const counts = new Array(range).fill(0);
  for (let i = 0; i < n; i++) {
    counts[t.get(i) - min]++;
  }
  t.highlightRange(0, n - 1, `统计完成：值域 [${min}, ${max}]，共 ${range} 种取值`);

  // 按值从小到大写回原数组 —— 注意这里没有发生任何「比较」
  let writeIndex = 0;
  for (let v = 0; v < range; v++) {
    const count = counts[v];
    const actualValue = v + min;
    // 把相同值的所有位置一次性写回
    t.markBucket(v, count, `值 ${actualValue} 出现 ${count} 次`);
    for (let k = 0; k < count; k++) {
      t.overwrite(writeIndex, actualValue);
      t.markSorted(writeIndex);
      writeIndex++;
    }
  }

  return t.result();
}

/**
 * 基数排序（LSD，从低位到高位）。
 * 每一位用一次稳定的计数排序，最终整体有序。
 * 动画上会看到「按个位排好 → 按十位排好 → 按百位排好」的三轮过程。
 */
function radixSort(input) {
  const t = new BarTracer(input);
  const n = t.array.length;
  if (n === 0) return t.result();

  const max = Math.max(...input);
  const maxDigits = String(max).length;

  for (let digit = 0; digit < maxDigits; digit++) {
    const place = Math.pow(10, digit);
    t.highlightRange(0, n - 1, `第 ${digit + 1} 轮：按${['个', '十', '百', '千'][digit] || '更高'}位排序`);

    // 每一位都是一次稳定的计数排序（10 个桶：0~9）
    const buckets = Array.from({ length: 10 }, () => []);
    for (let i = 0; i < n; i++) {
      const v = t.get(i);
      const d = Math.floor(v / place) % 10;
      buckets[d].push(v);
      t.markBucket(d, 1, `值 ${v} 的该位是 ${d}`);
    }

    // 按桶顺序写回
    let writeIndex = 0;
    for (let d = 0; d < 10; d++) {
      for (const value of buckets[d]) {
        t.overwrite(writeIndex, value);
        writeIndex++;
      }
    }
  }

  t.markSortedRange(0, n - 1);
  return t.result();
}

/**
 * 桶排序：把值分到若干个区间桶里，桶内各自排序，再依次倒回。
 * 它的效率高度依赖数据分布是否均匀 —— 全挤在一个桶里就退化成 O(n²)。
 * 界面上提供「少量不同取值 / 随机」分布，正好能演示这个差别。
 */
function bucketSort(input) {
  const t = new BarTracer(input);
  const n = t.array.length;
  if (n === 0) return t.result();

  const min = Math.min(...input);
  const max = Math.max(...input);
  // 桶的数量取 sqrt(n) 左右是个常见经验值
  const bucketCount = Math.max(1, Math.floor(Math.sqrt(n)));
  const span = (max - min + 1) / bucketCount || 1;

  const buckets = Array.from({ length: bucketCount }, () => []);
  for (let i = 0; i < n; i++) {
    const v = t.get(i);
    let bi = Math.floor((v - min) / span);
    if (bi >= bucketCount) bi = bucketCount - 1; // 边界值归入最后一个桶
    buckets[bi].push(v);
  }

  // 每个桶内部排序（用插入排序，桶通常很小），并把桶内排序结果记录为操作
  let writeIndex = 0;
  for (let b = 0; b < bucketCount; b++) {
    const bucket = buckets[b];
    t.markBucket(b, bucket.length, `${bucketCount} 个桶中的第 ${b + 1} 个，装了 ${bucket.length} 个元素`);

    // 桶内插入排序（在本地数组上做，再统一写回）
    for (let i = 1; i < bucket.length; i++) {
      const cur = bucket[i];
      let j = i - 1;
      while (j >= 0 && bucket[j] > cur) {
        bucket[j + 1] = bucket[j];
        j--;
      }
      bucket[j + 1] = cur;
    }

    for (const value of bucket) {
      t.overwrite(writeIndex, value);
      t.markSorted(writeIndex);
      writeIndex++;
    }
  }

  return t.result();
}

export const NONCOMPARE_ALGORITHMS = {
  counting: {
    id: 'counting',
    name: '计数排序',
    en: 'Counting Sort',
    category: 'noncompare',
    complexity: { time: 'O(n + k)', space: 'O(k)' },
    stable: true,
    blurb: '不比较元素，而是统计每个值出现的次数再按序写回。比较次数始终为 0 —— 这是它最反直觉的地方。',
    inputKind: 'boundedArray',
    run: countingSort,
    syntaxTopics: ['array-init', 'math-floor', 'for-loop'],
  },

  radix: {
    id: 'radix',
    name: '基数排序',
    en: 'Radix Sort',
    category: 'noncompare',
    complexity: { time: 'O(d × (n + k))', space: 'O(n + k)' },
    stable: true,
    blurb: '从低位到高位，每一位做一次稳定的分配与收集。多轮之后整体自然有序，全程不比较元素大小。',
    inputKind: 'positArray',
    run: radixSort,
    syntaxTopics: ['math-floor', 'string-length', 'nested-loop'],
  },

  bucket: {
    id: 'bucket',
    name: '桶排序',
    en: 'Bucket Sort',
    category: 'noncompare',
    complexity: { time: 'O(n + k) 平均', space: 'O(n + k)' },
    stable: true,
    blurb: '把值按区间分散到若干桶，桶内各自排序后依次倒回。分布越均匀越快，全挤进一个桶就退化。',
    inputKind: 'boundedArray',
    run: bucketSort,
    syntaxTopics: ['math-sqrt', 'nested-array', 'math-floor'],
  },
};
