/**
 * 多类可视化的统一契约。
 *
 * 原先只有「排序」一种可视化，操作序列是 compare/swap/overwrite/markSorted。
 * 现在要支持查找、二分答案、网格寻路、非比较排序、栈/队列，
 * 它们的「动作」各不相同，但**设计与排序完全一致**：
 *   算法只产出操作序列 → 渲染层只播放序列 → 两者互不认识。
 *
 * 为了不让操作类型混淆，这里按「可视化类型」划分命名空间：
 *   array  排序 / 计数排序等        —— BarTracer
 *   search 二分查找 / 二分答案      —— SearchTracer
 *   grid   网格寻路                 —— GridTracer
 *   stack  栈 / 队列               —— StructureTracer
 *
 * 每个 tracer 都产出同一个外壳：
 *   { kind, operations, stats, meta }
 * 渲染层根据 kind 选择对应的渲染器。
 */

/** 排序 / 数组类操作 */
export const ArrayOp = {
  COMPARE: 'compare',
  SWAP: 'swap',
  OVERWRITE: 'overwrite',
  MARK_SORTED: 'markSorted',
  /** 高亮一个区间（计数排序的分桶、基数排序的按位处理都会用到） */
  HIGHLIGHT_RANGE: 'highlightRange',
  /** 标记某个桶/组 */
  MARK_BUCKET: 'markBucket',
};

/** 查找类操作（二分查找、二分答案共用） */
export const SearchOp = {
  /** 探测某个位置/取值，附带比较结果 */
  PROBE: 'probe',
  /** 收窄区间到 [lo, hi] */
  NARROW: 'narrow',
  /** 命中目标 */
  FOUND: 'found',
  /** 确定答案（二分答案用） */
  ANSWER: 'answer',
};

/** 网格寻路类操作 */
export const GridOp = {
  /** 把一个格子加入「待访问」（入队/入栈） */
  ENQUEUE: 'enqueue',
  /** 访问一个格子（出队/出栈并考察） */
  VISIT: 'visit',
  /** 记录某个格子是从哪个格子走过来的（用于回溯路径） */
  CAME_FROM: 'cameFrom',
  /** 把某个格子标记为墙/障碍 */
  WALL: 'wall',
  /** 最终路径上的一个格子 */
  PATH: 'path',
  /** 起点 / 终点 */
  START: 'start',
  END: 'end',
  /** 当前正在考察的格子 */
  CURRENT: 'current',
};

/**
 * 指针 / 区间类操作。
 *
 * 用于「双指针、滑动窗口、前缀和、差分」这类算法。
 * 它们的特点不是「搬动数据」，而是**在数组上移动若干指针、维护一个区间**，
 * 所以渲染的重点是：指针在哪、窗口覆盖哪一段、累加值是多少。
 */
export const SpanOp = {
  /** 移动某个命名指针到指定下标 { name, index } */
  POINTER: 'pointer',
  /** 设置当前窗口（区间）{ from, to, label } */
  WINDOW: 'window',
  /** 累加/更新一个聚合值 { name, value, note }（前缀和、窗口和等） */
  ACCUMULATE: 'accumulate',
  /** 把某个下标标为「已确定/已答案」{ index, label } */
  RESOLVE: 'resolve',
  /** 记录一次比较或判断结果 { indices, ok, note } */
  CHECK: 'check',
  /** 阶段性说明文字 { note } */
  NOTE: 'note',
};

/**
 * 位运算类操作。
 *
 * 用于「位运算」可视化：把整数拆成二进制位，逐位展示与/或/异或/移位的效果。
 * 渲染出来就是几行 0/1 方格。
 */
export const BitOp = {
  /** 设置一个操作数（一行二进制）{ slot, value, bits, label } */
  OPERAND: 'operand',
  /** 逐位计算出一位结果 { slot, bitIndex, value } */
  RESULT_BIT: 'resultBit',
  /** 设置结果行 { slot, bits, label } */
  RESULT: 'result',
  /** 高亮某一列（第几位）{ bitIndex, note } */
  FOCUS_COLUMN: 'focusColumn',
  /** 说明文字 { note } */
  NOTE: 'note',
};

/** 栈 / 队列等线性结构操作 */
export const StructOp = {
  PUSH: 'push',
  POP: 'pop',
  /** 出队（队列专用，语义上从头部移除） */
  DEQUEUE: 'dequeue',
  PEEK: 'peek',
  /** 高亮某个位置 */
  HIGHLIGHT: 'highlight',
  /** 标记操作成功或失败（例如栈溢出、空栈弹出） */
  RESULT: 'result',
};

/** 统计计数的通用外壳：不同可视化关心的指标不同，但都从这里取。 */
function makeStats() {
  return {
    comparisons: 0, // 比较次数（查找、排序通用）
    swaps: 0,       // 交换次数
    writes: 0,      // 写入次数
    visits: 0,      // 访问过的节点/格子数
    steps: 0,       // 其他操作的计数
  };
}

// =====================================================================
// 数组 / 排序类
// =====================================================================

export class BarTracer {
  constructor(input) {
    this.array = input.slice();
    this.operations = [];
    this.stats = makeStats();
  }

  _push(op) {
    this.operations.push({ ...op, stats: { ...this.stats } });
  }

  compare(i, j) {
    this.stats.comparisons++;
    this._push({ type: ArrayOp.COMPARE, indices: [i, j] });
    return this.array[i] - this.array[j];
  }

  swap(i, j) {
    if (i === j) return;
    const tmp = this.array[i];
    this.array[i] = this.array[j];
    this.array[j] = tmp;
    this.stats.swaps++;
    this.stats.writes += 2;
    this._push({ type: ArrayOp.SWAP, indices: [i, j] });
  }

  overwrite(index, value) {
    this.array[index] = value;
    this.stats.writes++;
    this._push({ type: ArrayOp.OVERWRITE, index, value });
  }

  /** 记录比较但不由 tracer 读取数组（归并排序比较的是 buffer 里的值）。 */
  recordCompare(i, j) {
    this.stats.comparisons++;
    this._push({ type: ArrayOp.COMPARE, indices: [i, j] });
  }

  get(index) {
    return this.array[index];
  }

  markSorted(index) {
    this._push({ type: ArrayOp.MARK_SORTED, index });
  }

  markSortedRange(from, to) {
    for (let i = from; i <= to; i++) this.markSorted(i);
  }

  /** 高亮一段区间，用于计数排序分桶、基数排序按位分组等场景。 */
  highlightRange(from, to, label = '') {
    this._push({ type: ArrayOp.HIGHLIGHT_RANGE, from, to, label });
  }

  /** 标记一个桶（桶排序用），buckets 是桶内元素下标的数组。 */
  markBucket(bucketIndex, value, label = '') {
    this.stats.steps++;
    this._push({ type: ArrayOp.MARK_BUCKET, bucketIndex, value, label });
  }

  less(i, j) { return this.compare(i, j) < 0; }
  lessOrEqual(i, j) { return this.compare(i, j) <= 0; }
  greater(i, j) { return this.compare(i, j) > 0; }
  greaterOrEqual(i, j) { return this.compare(i, j) >= 0; }

  result() {
    return {
      kind: 'array',
      operations: this.operations,
      sorted: this.array.slice(),
      stats: { ...this.stats },
    };
  }
}

// =====================================================================
// 查找类（二分查找 / 二分答案）
// =====================================================================

export class SearchTracer {
  /**
   * @param {number[]} data 有序数组（二分查找）或候选值域（二分答案）
   * @param {object} meta   展示用的元信息 { target, lo, hi, title, ... }
   */
  constructor(data, meta = {}) {
    this.array = data.slice();
    this.operations = [];
    this.stats = makeStats();
    this.meta = { ...meta };
  }

  _push(op) {
    this.operations.push({ ...op, stats: { ...this.stats } });
  }

  /**
   * 探测一个位置：记录「我正在看这个位置，它的值是 x，和目标比是大了还是小了」。
   * @param {number} index 探测的下标
   * @param {number} value 该位置的值
   * @param {number} cmp   与目标的比较结果：<0 偏小，0 命中，>0 偏大
   */
  probe(index, value, cmp) {
    this.stats.comparisons++;
    this.stats.visits++;
    this._push({ type: SearchOp.PROBE, index, value, cmp });
    return cmp;
  }

  /** 收窄搜索区间。 */
  narrow(lo, hi, reason = '') {
    this._push({ type: SearchOp.NARROW, lo, hi, reason });
    return { lo, hi };
  }

  found(index, value) {
    this._push({ type: SearchOp.FOUND, index, value });
  }

  /** 二分答案：标记当前判定为「可行」或「不可行」。 */
  answer(value, feasible, note = '') {
    this.stats.steps++;
    this._push({ type: SearchOp.ANSWER, value, feasible, note });
  }

  result() {
    return {
      kind: 'search',
      operations: this.operations,
      array: this.array.slice(),
      stats: { ...this.stats },
      meta: { ...this.meta },
    };
  }
}

// =====================================================================
// 网格寻路类
// =====================================================================

export class GridTracer {
  /**
   * @param {number[][]} grid 网格，元素含义由算法定义（1=可走 0=墙，或权重）
   * @param {object} meta { start:[r,c], end:[r,c], title }
   */
  constructor(grid, meta = {}) {
    this.grid = grid.map((row) => row.slice());
    this.rows = grid.length;
    this.cols = grid[0]?.length ?? 0;
    this.operations = [];
    this.stats = makeStats();
    this.meta = { start: meta.start, end: meta.end, ...meta };
  }

  _push(op) {
    this.operations.push({ ...op, stats: { ...this.stats } });
  }

  inBounds(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  /** 是否可通行（默认 1 表示可走）。 */
  passable(r, c) {
    return this.inBounds(r, c) && this.grid[r][c] !== 0;
  }

  enqueue(r, c) {
    this._push({ type: GridOp.ENQUEUE, cell: [r, c] });
  }

  visit(r, c) {
    this.stats.visits++;
    this._push({ type: GridOp.VISIT, cell: [r, c] });
  }

  cameFrom(r, c, fromR, fromC) {
    this._push({ type: GridOp.CAME_FROM, cell: [r, c], from: [fromR, fromC] });
  }

  current(r, c) {
    this._push({ type: GridOp.CURRENT, cell: [r, c] });
  }

  path(cells) {
    for (const [r, c] of cells) {
      this._push({ type: GridOp.PATH, cell: [r, c] });
    }
    this.stats.steps += cells.length;
  }

  result() {
    return {
      kind: 'grid',
      operations: this.operations,
      grid: this.grid.map((r) => r.slice()),
      stats: { ...this.stats },
      meta: { ...this.meta },
    };
  }
}

// =====================================================================
// 栈 / 队列等线性结构
// =====================================================================

export class StructureTracer {
  /**
   * @param {string} structureType 'stack' | 'queue'
   */
  constructor(structureType, meta = {}) {
    this.structureType = structureType;
    this.operations = [];
    this.stats = makeStats();
    this.meta = { ...meta };
    /** 影子状态：算法真实操作的结构内容，保证语义正确 */
    this.items = [];
  }

  _push(op) {
    this.operations.push({ ...op, stats: { ...this.stats } });
  }

  push(value, note = '') {
    this.items.push(value);
    this.stats.writes++;
    this._push({ type: StructOp.PUSH, value, note });
  }

  /** 栈：弹出栈顶。 */
  pop(note = '') {
    if (this.items.length === 0) {
      this._push({ type: StructOp.RESULT, ok: false, note: note || '栈为空，无法弹出' });
      return undefined;
    }
    const value = this.items.pop();
    this.stats.writes++;
    this._push({ type: StructOp.POP, value, note });
    return value;
  }

  /** 队列：从头部出队。 */
  dequeue(note = '') {
    if (this.items.length === 0) {
      this._push({ type: StructOp.RESULT, ok: false, note: note || '队列为空，无法出队' });
      return undefined;
    }
    const value = this.items.shift();
    this.stats.writes++;
    this._push({ type: StructOp.DEQUEUE, value, note });
    return value;
  }

  peek(note = '') {
    const value = this.items[this.structureType === 'stack' ? this.items.length - 1 : 0];
    this._push({ type: StructOp.PEEK, value, note });
    return value;
  }

  /**
   * 记录一次判定结果（例如括号匹配成功/失败）。
   *
   * 注意命名：这里不能叫 result()，否则会和下面「产出最终结果」的 result() 冲突 ——
   * 后者会覆盖前者，导致判定记录静默丢失（这个坑真的踩过一次）。
   */
  verdict(ok, note) {
    this._push({ type: StructOp.RESULT, ok, note });
  }

  result() {
    return {
      kind: 'structure',
      operations: this.operations,
      stats: { ...this.stats },
      meta: { structureType: this.structureType, ...this.meta },
    };
  }
}

// =====================================================================
// 指针 / 区间类（双指针、滑动窗口、前缀和、差分）
// =====================================================================

export class SpanTracer {
  /**
   * @param {number[]} data 主体数组
   * @param {object} meta 展示用元信息 { title, explain, pointers:[] }
   */
  constructor(data, meta = {}) {
    this.array = data.slice();
    this.operations = [];
    this.stats = makeStats();
    this.meta = { ...meta };
  }

  _push(op) {
    this.operations.push({ ...op, stats: { ...this.stats } });
  }

  /** 移动一个命名指针（比如 'left'、'right'、'slow'、'fast'）。 */
  pointer(name, index, note = '') {
    this._push({ type: SpanOp.POINTER, name, index, note });
  }

  /** 同时移动多个指针，省得连续 push 多条。 */
  pointers(map, note = '') {
    for (const [name, index] of Object.entries(map)) {
      this.pointer(name, index, note);
    }
  }

  /** 设置当前窗口 [from, to]。 */
  window(from, to, label = '') {
    this._push({ type: SpanOp.WINDOW, from, to, label });
  }

  /** 更新一个聚合值（窗口和、前缀和、当前最优等）。 */
  accumulate(name, value, note = '') {
    this.stats.steps++;
    this._push({ type: SpanOp.ACCUMULATE, name, value, note });
  }

  /** 标记某个下标已经有确定答案。 */
  resolve(index, label = '') {
    this._push({ type: SpanOp.RESOLVE, index, label });
  }

  /** 记录一次判断（比如「两数之和是否等于目标」）。 */
  check(indices, ok, note = '') {
    this.stats.comparisons++;
    this._push({ type: SpanOp.CHECK, indices, ok, note });
  }

  /** 加一句说明。 */
  note(text) {
    this._push({ type: SpanOp.NOTE, note: text });
  }

  result() {
    return {
      kind: 'span',
      operations: this.operations,
      array: this.array.slice(),
      stats: { ...this.stats },
      meta: { ...this.meta },
    };
  }
}

// =====================================================================
// 位运算类
// =====================================================================

export class BitTracer {
  /**
   * @param {number} bitWidth 展示多少位（一般 8 或 16）
   * @param {object} meta { title, explain }
   */
  constructor(bitWidth = 8, meta = {}) {
    this.bitWidth = bitWidth;
    this.operations = [];
    this.stats = makeStats();
    this.meta = { ...meta };
  }

  _push(op) {
    this.operations.push({ ...op, stats: { ...this.stats } });
  }

  /** 把整数按位拆成数组（高位在前，便于阅读）。 */
  toBits(value) {
    const bits = [];
    for (let i = this.bitWidth - 1; i >= 0; i--) {
      bits.push((value >> i) & 1);
    }
    return bits;
  }

  /** 放入一个操作数（第 slot 行）。 */
  operand(slot, value, label = '') {
    this._push({
      type: BitOp.OPERAND,
      slot,
      value,
      bits: this.toBits(value),
      label,
    });
  }

  /** 逐位公布结果的一位。 */
  resultBit(slot, bitIndex, value) {
    this.stats.steps++;
    this._push({ type: BitOp.RESULT_BIT, slot, bitIndex, value });
  }

  /** 一次性给出结果行（或逐位给完之后收尾）。 */
  result(slot, value, label = '') {
    this._push({
      type: BitOp.RESULT,
      slot,
      value,
      bits: this.toBits(value),
      label,
    });
  }

  /** 聚焦到某一列（第几位），用于讲解「正在处理第几位」。 */
  focusColumn(bitIndex, note = '') {
    this._push({ type: BitOp.FOCUS_COLUMN, bitIndex, note });
  }

  note(text) {
    this._push({ type: BitOp.NOTE, note: text });
  }

  /** 产出结果。注意方法名不能和上面的 result(slot,...) 冲突，所以用 build()。 */
  build() {
    return {
      kind: 'bits',
      operations: this.operations,
      stats: { ...this.stats },
      meta: { bitWidth: this.bitWidth, ...this.meta },
    };
  }
}

// 兼容旧名字：原来叫 Tracer，现在按类型拆分了，但排序算法仍用同一个实现。
export const Tracer = BarTracer;
export const Op = ArrayOp;
