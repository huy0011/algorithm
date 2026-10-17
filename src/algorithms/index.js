/**
 * 七种排序算法。
 *
 * 每个算法都是纯函数：(input: number[]) => TracerResult
 * 它们只通过 Tracer 产出操作序列，不接触任何 DOM / Canvas。
 * 想加新算法？在下面写一个函数，然后注册到 algorithms/index.js 即可，
 * 渲染层和 UI 层完全不用改 —— 这就是算法与渲染分离的意义。
 */

import { Tracer } from './tracer.js';
import { NONCOMPARE_ALGORITHMS } from './noncompare.js';
import { SEARCH_ALGORITHMS } from './search.js';
import { PATH_ALGORITHMS } from './path.js';
import { STRUCTURE_ALGORITHMS } from './structures.js';
import { TECHNIQUE_ALGORITHMS, BIT_ALGORITHMS } from './technique.js';
import { STRING_ALGORITHMS } from './string.js';
import { GRAPH_ALGORITHMS } from './graph.js';
import { BIGNUM_ALGORITHMS } from './bignum.js';
import { TRIE_ALGORITHMS } from './trie.js';
import { ALGO_CPP_TOPICS } from '../syntax/algo-topics.js';

/** 冒泡排序：相邻两两比较，大的往后冒。 */
function bubbleSort(input) {
  const t = new Tracer(input);
  const n = t.array.length;
  if (n === 0) return t.result(); // 空数组无任何位置可标记
  for (let end = n - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      if (t.greater(i, i + 1)) {
        t.swap(i, i + 1);
        swapped = true;
      }
    }
    // 本轮结束时，位置 end 已经是当前未排序部分的最大值
    t.markSorted(end);
    if (!swapped) {
      // 提前退出：剩下全部有序
      t.markSortedRange(0, end - 1);
      break;
    }
  }
  t.markSorted(0);
  return t.result();
}

/** 选择排序：每轮从未排序区间里选出最小值，放到区间头部。 */
function selectionSort(input) {
  const t = new Tracer(input);
  const n = t.array.length;
  if (n === 0) return t.result();
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      if (t.less(j, min)) min = j;
    }
    if (min !== i) t.swap(i, min);
    t.markSorted(i);
  }
  t.markSorted(n - 1);
  return t.result();
}

/**
 * 插入排序：把当前元素往左插到正确位置。
 * 这里用「相邻交换」实现，因为交换能产生连续的位置变化动画，
 * 比直接搬移更直观（代价是交换次数统计偏高，界面上有说明）。
 */
function insertionSort(input) {
  const t = new Tracer(input);
  const n = t.array.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0 && t.greater(j - 1, j)) {
      t.swap(j - 1, j);
      j--;
    }
  }
  t.markSortedRange(0, n - 1);
  return t.result();
}

/** 希尔排序：带间隔的插入排序，间隔逐步缩小到 1。 */
function shellSort(input) {
  const t = new Tracer(input);
  const n = t.array.length;
  // Knuth 增量序列：1, 4, 13, 40, ... 取不超过 n/3 的最大值
  let gap = 1;
  while (gap < n / 3) gap = gap * 3 + 1;

  for (; gap >= 1; gap = Math.floor(gap / 3)) {
    for (let i = gap; i < n; i++) {
      let j = i;
      // 间隔为 gap 的插入排序
      while (j >= gap && t.greater(j - gap, j)) {
        t.swap(j - gap, j);
        j -= gap;
      }
    }
  }
  t.markSortedRange(0, n - 1);
  return t.result();
}

/**
 * 归并排序（自顶向下递归）。
 * 归并过程不是「交换」而是「把值写回原数组」，所以用 overwrite 表达。
 * 这也是覆盖语义存在的意义：不同算法用不同的动作描述自己。
 */
function mergeSort(input) {
  const t = new Tracer(input);
  const n = t.array.length;
  if (n === 0) return t.result();

  // 辅助数组，用来暂存合并结果
  const buffer = new Array(n);

  function merge(lo, mid, hi) {
    // 把 [lo, hi] 拷贝进 buffer。这一步至关重要：
    // 下面的写回是就地进行（overwrite），如果直接比较 t 里的值，
    // 读到的是「已经被覆盖过」的位置，比较结果就错了。
    // 正确做法是比较 buffer 中暂存的两段（i 属于左段、j 属于右段）。
    for (let k = lo; k <= hi; k++) buffer[k] = t.get(k);

    let i = lo;
    let j = mid + 1;
    for (let k = lo; k <= hi; k++) {
      if (i > mid) {
        // 左半用完，取右边
        t.overwrite(k, buffer[j++]);
      } else if (j > hi) {
        // 右半用完，取左边
        t.overwrite(k, buffer[i++]);
      } else {
        // 记录一次比较（用于统计和动画高亮），比较的是 buffer 里的两段
        t.recordCompare(i, j);
        if (buffer[i] <= buffer[j]) {
          t.overwrite(k, buffer[i++]); // <= 保证稳定性
        } else {
          t.overwrite(k, buffer[j++]);
        }
      }
    }
  }

  function sort(lo, hi) {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi);
  }

  sort(0, n - 1);
  t.markSortedRange(0, n - 1);
  return t.result();
}

/** 快速排序：Lomuto 分区，取最右元素为基准。 */
function quickSort(input) {
  const t = new Tracer(input);
  const n = t.array.length;
  if (n === 0) return t.result();

  function partition(lo, hi) {
    const pivot = t.get(hi);
    let i = lo;
    for (let j = lo; j < hi; j++) {
      // 与基准比较：t.compare 返回差值，< 0 表示 a[j] < pivot
      if (t.compare(j, hi) < 0) {
        if (i !== j) t.swap(i, j);
        i++;
      }
    }
    t.swap(i, hi); // 把基准放到最终位置
    return i;
  }

  // 用显式栈代替递归，避免大数组时爆栈
  const stack = [[0, n - 1]];
  const settled = [];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    if (lo > hi) continue;
    if (lo === hi) {
      settled.push(lo);
      continue;
    }
    const p = partition(lo, hi);
    settled.push(p);
    stack.push([lo, p - 1]);
    stack.push([p + 1, hi]);
  }
  settled.forEach((idx) => t.markSorted(idx));
  return t.result();
}

/** 堆排序：先建大顶堆，再逐个把堆顶换到末尾。 */
function heapSort(input) {
  const t = new Tracer(input);
  const n = t.array.length;

  function siftDown(root, end) {
    let parent = root;
    while (true) {
      const left = 2 * parent + 1;
      if (left > end) break; // 没有子节点，停止
      let larger = left;
      const right = left + 1;
      if (right <= end && t.greater(right, left)) larger = right;
      // 大顶堆要求父节点 >= 子节点。若父节点已经不小于较大的那个子节点，
      // 说明堆序满足，可以停止下沉。
      if (t.greaterOrEqual(parent, larger)) break;
      t.swap(parent, larger);
      parent = larger;
    }
  }

  // 建堆：从最后一个非叶子节点开始下沉
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, n - 1);

  // 依次取出堆顶
  for (let end = n - 1; end > 0; end--) {
    t.swap(0, end);
    t.markSorted(end);
    siftDown(0, end - 1);
  }
  if (n > 0) t.markSorted(0);
  return t.result();
}

/**
 * 全部算法与数据结构的统一注册表。
 *
 * 分类（category）决定界面用哪个渲染器：
 *   sort       排序      → 柱状图
 *   noncompare 非比较排序 → 柱状图
 *   search     查找      → 区间条 + 指针
 *   path       寻路      → 网格
 *   structure  数据结构  → 栈/队列图形
 *
 * syntaxTopics 把算法和「语法基础」里的知识点关联起来，
 * 点一下就能跳到对应的语法讲解 —— 这是本次新增的「学以致用」链路。
 */
export const ALGORITHMS = {
  // ---------------- 排序 ----------------
  bubble: {
    id: 'bubble',
    name: '冒泡排序',
    en: 'Bubble Sort',
    category: 'sort',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    stable: true,
    blurb: '相邻两两比较，大的往后冒。每轮结束确定一个最大值。',
    inputKind: 'array',
    run: bubbleSort,
    syntaxTopics: ['nested-loop', 'for-loop', 'boolean-flag'],
  },
  selection: {
    id: 'selection',
    name: '选择排序',
    en: 'Selection Sort',
    category: 'sort',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    stable: false,
    blurb: '每轮从未排序区间选出最小值，放到区间头部。交换次数最少。',
    inputKind: 'array',
    run: selectionSort,
    syntaxTopics: ['nested-loop', 'variable-swap', 'min-tracking'],
  },
  insertion: {
    id: 'insertion',
    name: '插入排序',
    en: 'Insertion Sort',
    category: 'sort',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    stable: true,
    blurb: '把当前元素向左插到正确位置。数据接近有序时非常快。',
    inputKind: 'array',
    run: insertionSort,
    syntaxTopics: ['while-loop', 'variable-swap', 'short-circuit'],
  },
  shell: {
    id: 'shell',
    name: '希尔排序',
    en: 'Shell Sort',
    category: 'sort',
    complexity: { time: 'O(n^1.3) ~ O(n²)', space: 'O(1)' },
    stable: false,
    blurb: '带间隔的插入排序，间隔逐步缩小到 1，先让数组「大致有序」。',
    inputKind: 'array',
    run: shellSort,
    syntaxTopics: ['while-loop', 'math-floor', 'nested-loop'],
  },
  merge: {
    id: 'merge',
    name: '归并排序',
    en: 'Merge Sort',
    category: 'sort',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    stable: true,
    blurb: '不断二分再合并。分治思想的典型代表，代价是需要额外空间。',
    inputKind: 'array',
    run: mergeSort,
    syntaxTopics: ['recursion', 'array-slice', 'math-floor'],
  },
  quick: {
    id: 'quick',
    name: '快速排序',
    en: 'Quick Sort',
    category: 'sort',
    complexity: { time: 'O(n log n) 平均', space: 'O(log n)' },
    stable: false,
    blurb: '选一个基准，把小的放左边、大的放右边，再对两侧递归。',
    inputKind: 'array',
    run: quickSort,
    syntaxTopics: ['recursion-vs-stack', 'variable-swap', 'while-loop'],
  },
  heap: {
    id: 'heap',
    name: '堆排序',
    en: 'Heap Sort',
    category: 'sort',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    stable: false,
    blurb: '先建大顶堆，再反复把堆顶（最大值）换到末尾。',
    inputKind: 'array',
    run: heapSort,
    syntaxTopics: ['array-index-math', 'while-loop', 'math-floor'],
  },

  // ---------------- 非比较排序 ----------------
  counting: NONCOMPARE_ALGORITHMS.counting,
  radix: NONCOMPARE_ALGORITHMS.radix,
  bucket: NONCOMPARE_ALGORITHMS.bucket,

  // ---------------- 查找 ----------------
  binarySearch: SEARCH_ALGORITHMS.binarySearch,
  binarySearchAnswer: SEARCH_ALGORITHMS.binarySearchAnswer,

  // ---------------- 寻路 ----------------
  bfs: PATH_ALGORITHMS.bfs,
  dfs: PATH_ALGORITHMS.dfs,

  // ---------------- 数据结构 ----------------
  // ---------------- 高精度 ----------------
  bigAdd: BIGNUM_ALGORITHMS.bigAdd,
  bigSub: BIGNUM_ALGORITHMS.bigSub,
  bigMul: BIGNUM_ALGORITHMS.bigMul,
  bigFactorial: BIGNUM_ALGORITHMS.bigFactorial,

  // ---------------- 图论 ----------------
  graphStorage: GRAPH_ALGORITHMS.graphStorage,
  dijkstra: GRAPH_ALGORITHMS.dijkstra,
  topologicalSort: GRAPH_ALGORITHMS.topologicalSort,
  kruskal: GRAPH_ALGORITHMS.kruskal,

  // ---------------- Trie ----------------
  trie: TRIE_ALGORITHMS.trie,

  stackDemo: STRUCTURE_ALGORITHMS.stackDemo,
  queueDemo: STRUCTURE_ALGORITHMS.queueDemo,

  // ---------------- 基础技巧 ----------------
  twoPointers: TECHNIQUE_ALGORITHMS.twoPointers,
  slidingWindow: TECHNIQUE_ALGORITHMS.slidingWindow,
  prefixSum: TECHNIQUE_ALGORITHMS.prefixSum,
  differenceArray: TECHNIQUE_ALGORITHMS.differenceArray,

  // ---------------- 位运算 ----------------
  bitwise: BIT_ALGORITHMS.bitwise,

  // ---------------- 字符串 ----------------
  kmp: STRING_ALGORITHMS.kmp,
  rabinKarp: STRING_ALGORITHMS.rabinKarp,
};

/**
 * 给每个算法挂上「它涉及的 C++ 知识点」。
 *
 * 映射表放在教程侧（src/syntax/algo-topics.js），算法层本身不需要知道教学组织方式。
 * 这里做一次挂载，让界面能直接读 algo.cppTopics。
 */
for (const [algoId, topicIds] of Object.entries(ALGO_CPP_TOPICS)) {
  if (ALGORITHMS[algoId]) ALGORITHMS[algoId].cppTopics = topicIds;
}

/** 界面上的默认展示顺序。 */
export const ALGORITHM_ORDER = [
  // 排序
  'bubble', 'selection', 'insertion', 'shell', 'merge', 'quick', 'heap',
  // 非比较排序
  'counting', 'radix', 'bucket',
  // 查找
  'binarySearch', 'binarySearchAnswer',
  // 路径查找
  'bfs', 'dfs',
  // 基础技巧
  'twoPointers', 'slidingWindow', 'prefixSum', 'differenceArray',
  // 字符串
  'kmp', 'rabinKarp',
  // 位运算
  'bitwise',
  // 高精度
  'bigAdd', 'bigSub', 'bigMul', 'bigFactorial',
  // 图论
  'graphStorage', 'dijkstra', 'topologicalSort', 'kruskal',
  // Trie
  'trie',
  // 数据结构
  'stackDemo', 'queueDemo',
];

/** 分组信息，界面上用分组下拉框呈现。 */
export const CATEGORIES = [
  { id: 'sort', name: '比较排序', renderer: 'bars' },
  { id: 'noncompare', name: '非比较排序', renderer: 'bars' },
  { id: 'search', name: '查找 / 二分', renderer: 'search' },
  { id: 'path', name: '路径查找', renderer: 'grid' },
  { id: 'technique', name: '基础技巧', renderer: 'span' },
  { id: 'string', name: '字符串', renderer: 'span' },
  { id: 'bits', name: '位运算', renderer: 'bits' },
  { id: 'bignum', name: '高精度', renderer: 'span' },
  { id: 'graph', name: '图论', renderer: 'graph' },
  { id: 'structure', name: '数据结构', renderer: 'structure' },
];

/** 按分类取出算法 id 列表。 */
export function algorithmsByCategory(categoryId) {
  return ALGORITHM_ORDER.filter((id) => ALGORITHMS[id].category === categoryId);
}

/** 取某个算法所属分类的渲染器类型。 */
export function rendererFor(algoId) {
  const algo = ALGORITHMS[algoId];
  if (!algo) return 'bars';
  const cat = CATEGORIES.find((c) => c.id === algo.category);
  return cat ? cat.renderer : 'bars';
}
