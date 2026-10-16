/**
 * 七种排序算法。
 *
 * 每个算法都是纯函数：(input: number[]) => TracerResult
 * 它们只通过 Tracer 产出操作序列，不接触任何 DOM / Canvas。
 * 想加新算法？在下面写一个函数，然后注册到 algorithms/index.js 即可，
 * 渲染层和 UI 层完全不用改 —— 这就是算法与渲染分离的意义。
 */

import { Tracer } from './tracer.js';

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
 * 算法注册表。
 * complexity 只用于界面展示；关于插入/希尔排序的「交换次数」口径差异，
 * 在 UI 里有专门说明，避免误读成算法优劣的唯一标准。
 */
export const ALGORITHMS = {
  bubble: {
    id: 'bubble',
    name: '冒泡排序',
    en: 'Bubble Sort',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    stable: true,
    blurb: '相邻两两比较，大的往后冒。每轮结束确定一个最大值。',
    run: bubbleSort,
  },
  selection: {
    id: 'selection',
    name: '选择排序',
    en: 'Selection Sort',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    stable: false,
    blurb: '每轮从未排序区间选出最小值，放到区间头部。交换次数最少。',
    run: selectionSort,
  },
  insertion: {
    id: 'insertion',
    name: '插入排序',
    en: 'Insertion Sort',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    stable: true,
    blurb: '把当前元素向左插到正确位置。数据接近有序时非常快。',
    run: insertionSort,
  },
  shell: {
    id: 'shell',
    name: '希尔排序',
    en: 'Shell Sort',
    complexity: { time: 'O(n^1.3) ~ O(n²)', space: 'O(1)' },
    stable: false,
    blurb: '带间隔的插入排序，间隔逐步缩小到 1，先让数组「大致有序」。',
    run: shellSort,
  },
  merge: {
    id: 'merge',
    name: '归并排序',
    en: 'Merge Sort',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    stable: true,
    blurb: '不断二分再合并。分治思想的典型代表，代价是需要额外空间。',
    run: mergeSort,
  },
  quick: {
    id: 'quick',
    name: '快速排序',
    en: 'Quick Sort',
    complexity: { time: 'O(n log n) 平均', space: 'O(log n)' },
    stable: false,
    blurb: '选一个基准，把小的放左边、大的放右边，再对两侧递归。',
    run: quickSort,
  },
  heap: {
    id: 'heap',
    name: '堆排序',
    en: 'Heap Sort',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    stable: false,
    blurb: '先建大顶堆，再反复把堆顶（最大值）换到末尾。',
    run: heapSort,
  },
};

/** 界面上的默认展示顺序，从简单到复杂。 */
export const ALGORITHM_ORDER = [
  'bubble',
  'selection',
  'insertion',
  'shell',
  'merge',
  'quick',
  'heap',
];
