/**
 * Tracer —— 算法层与渲染层之间的唯一契约。
 *
 * 设计要点：
 * 算法函数只负责「算出发生了什么」，不关心任何绘制细节。
 * 所有算法通过 Tracer 记录方法产出统一格式的操作序列（operation sequence），
 * 渲染层只认识这些操作，因此新增算法不需要改动任何渲染代码。
 *
 * 操作类型：
 *   compare  比较两个下标      { type:'compare', indices:[i, j] }
 *   swap     交换两个下标的值    { type:'swap', indices:[i, j] }
 *   overwrite 把 value 写到下标 i { type:'overwrite', index:i, value:v }
 *   markSorted 标记下标已就位    { type:'markSorted', index:i }
 *
 * 每个操作都带 stats 快照，方便播放时实时显示计数。
 */

/** 操作类型常量。用常量而不是裸字符串，避免拼写错误。 */
export const Op = {
  COMPARE: 'compare',
  SWAP: 'swap',
  OVERWRITE: 'overwrite',
  MARK_SORTED: 'markSorted',
};

export class Tracer {
  /**
   * @param {number[]} input 待排序的原始数组。会被复制，不修改调用方的数组。
   */
  constructor(input) {
    /** 工作副本：算法在这个数组上真实地比较和交换。 */
    this.array = input.slice();
    /** 操作序列，渲染层按顺序播放。 */
    this.operations = [];
    /** 实时统计，用于效率对比。 */
    this.stats = { comparisons: 0, swaps: 0, writes: 0 };
  }

  /**
   * 记录一次比较。
   * 注意：tracer 只记录「做过这次比较」这一事实，不判断大小。
   * 大小判断由算法自己用 tracer.array 完成。
   */
  compare(i, j) {
    this.stats.comparisons++;
    this.operations.push({ type: Op.COMPARE, indices: [i, j], stats: { ...this.stats } });
    return this.array[i] - this.array[j];
  }

  /** 记录一次交换。同时真实地交换工作数组，保证后续比较结果正确。 */
  swap(i, j) {
    if (i === j) return; // 同一位置不算一次交换，避免统计虚高
    const tmp = this.array[i];
    this.array[i] = this.array[j];
    this.array[j] = tmp;
    this.stats.swaps++;
    // 交换在渲染层等价于两次写入
    this.stats.writes += 2;
    this.operations.push({ type: Op.SWAP, indices: [i, j], stats: { ...this.stats } });
  }

  /**
   * 记录一次写入（覆盖）。
   * 归并排序、希尔排序的插入等场景不是「交换」而是「把值搬过去」，
   * 用覆盖语义表达更贴近算法真实行为。
   */
  overwrite(index, value) {
    this.array[index] = value;
    this.stats.writes++;
    this.operations.push({
      type: Op.OVERWRITE,
      index,
      value,
      stats: { ...this.stats },
    });
  }

  /**
   * 只记录「发生过一次比较」用于统计和动画高亮，不读取工作数组。
   *
   * 为什么需要它：归并排序在合并时比较的是暂存在 buffer 里的两个值，
   * 而不是工作数组中的值（工作数组正在被覆盖）。
   * 这时仍然想让动画把 i、j 两个位置高亮出来，所以单独提供这个方法。
   */
  recordCompare(i, j) {
    this.stats.comparisons++;
    this.operations.push({ type: Op.COMPARE, indices: [i, j], stats: { ...this.stats } });
  }

  /** 读取某个位置当前的值，供算法内部使用（不产生操作记录）。 */
  get(index) {
    return this.array[index];
  }

  /** 标记某个下标已经处于最终位置，渲染层会用「已排序」颜色高亮。 */
  markSorted(index) {
    this.operations.push({ type: Op.MARK_SORTED, index, stats: { ...this.stats } });
  }

  /** 便捷方法：把 [from, to] 区间全部标记为已排序。 */
  markSortedRange(from, to) {
    for (let i = from; i <= to; i++) this.markSorted(i);
  }

  // ---- 以下方法在算法实现里很常用，集中在这里避免每个算法重复写 ----

  /** 判断 a < b 并记录一次比较（返回值是布尔，便于写 if）。 */
  less(i, j) {
    return this.compare(i, j) < 0;
  }

  /** 判断 a <= b 并记录一次比较。 */
  lessOrEqual(i, j) {
    return this.compare(i, j) <= 0;
  }

  /** 判断 a > b 并记录一次比较。 */
  greater(i, j) {
    return this.compare(i, j) > 0;
  }

  /** 判断 a >= b 并记录一次比较。 */
  greaterOrEqual(i, j) {
    return this.compare(i, j) >= 0;
  }

  /** 返回产物：操作序列 + 最终数组 + 统计。 */
  result() {
    return {
      operations: this.operations,
      sorted: this.array.slice(),
      stats: { ...this.stats },
    };
  }
}
