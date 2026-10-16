/**
 * 渲染层：Canvas 柱状图 + 播放器。
 *
 * 关键约束：这一层不认识「冒泡」「快排」这些概念，只认识操作序列里的
 * compare / swap / overwrite / markSorted 四种动作。
 * 所以新增算法时，这个文件一行都不用改。
 *
 * 播放模型：
 * 维护一个「当前可视数组」view[]，从头到尾重放操作序列。
 *   compare   → 高亮两个下标，数组不变
 *   swap      → 交换 view 中的两个值，柱子高度和位置一起变化
 *   overwrite → 把 view[i] 改成新值
 *   markSorted→ 把下标加入已排序集合，换颜色
 * 因为操作序列本身携带全部信息，所以任意时刻都能「跳到第 k 步」而不失真。
 */

import { Op } from '../algorithms/tracer.js';

const COLORS = {
  default: '#4a7fd4',
  compare: '#f2b134',
  swap: '#e8563f',
  sorted: '#3fb27f',
  pivot: '#a06cd5',
};

export class Visualizer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    /** 原始数组（用来重置） */
    this.baseArray = [];
    /** 当前可视数组 —— 重放操作会就地修改它 */
    this.view = [];
    /** 操作序列 */
    this.operations = [];
    /** 当前播放到第几个操作（已应用的个数） */
    this.cursor = 0;
    /** 已排序下标集合 */
    this.sortedSet = new Set();
    /** 当前需要高亮的比较/交换下标 */
    this.highlight = { compare: [], swap: [] };
    /** 最近一次操作的统计快照 */
    this.stats = { comparisons: 0, swaps: 0, writes: 0 };
    /** 绘制参数，ResizeObserver 会重算 */
    this.metrics = { width: 0, height: 0, dpr: 1 };

    this._onStats = null;
    this._onFinish = null;

    this._observeResize();
  }

  // ---------- 尺寸与自适应 ----------

  _observeResize() {
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.metrics.width = Math.max(1, Math.floor(rect.width));
      this.metrics.height = Math.max(1, Math.floor(rect.height));
      this.metrics.dpr = dpr;
      this.canvas.width = Math.floor(this.metrics.width * dpr);
      this.canvas.height = Math.floor(this.metrics.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.draw();
    };
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(resize);
      this._ro.observe(this.canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    // 首次也要跑一次
    requestAnimationFrame(resize);
  }

  onStats(cb) {
    this._onStats = cb;
  }

  onFinish(cb) {
    this._onFinish = cb;
  }

  // ---------- 加载数据 ----------

  /**
   * 载入一份算法运行结果，重置播放到第 0 步。
   * @param {number[]} baseArray 原始数组
   * @param {{operations: Array}} result 算法产出
   */
  load(baseArray, result) {
    this.baseArray = baseArray.slice();
    this.operations = result.operations;
    this.reset();
  }

  reset() {
    this.cursor = 0;
    this.view = this.baseArray.slice();
    this.sortedSet = new Set();
    this.highlight = { compare: [], swap: [] };
    this.stats = { comparisons: 0, swaps: 0, writes: 0 };
    this._emitStats();
    this.draw();
  }

  /** 总步数 */
  get total() {
    return this.operations.length;
  }

  get progress() {
    return this.total === 0 ? 1 : this.cursor / this.total;
  }

  get finished() {
    return this.cursor >= this.total;
  }

  _emitStats() {
    if (this._onStats) {
      this._onStats({
        stats: { ...this.stats },
        cursor: this.cursor,
        total: this.total,
        finished: this.finished,
      });
    }
  }

  // ---------- 播放控制 ----------

  /** 应用单个操作到可视状态。 */
  _apply(op) {
    const nextHighlight = { compare: [], swap: [] };
    switch (op.type) {
      case Op.COMPARE:
        nextHighlight.compare = op.indices.slice();
        break;
      case Op.SWAP: {
        const [i, j] = op.indices;
        const tmp = this.view[i];
        this.view[i] = this.view[j];
        this.view[j] = tmp;
        nextHighlight.swap = op.indices.slice();
        break;
      }
      case Op.OVERWRITE:
        this.view[op.index] = op.value;
        nextHighlight.swap = [op.index];
        break;
      case Op.MARK_SORTED:
        this.sortedSet.add(op.index);
        break;
      default:
        break;
    }
    // 保留上一帧的交换高亮，避免高亮闪烁过快看不见
    if (nextHighlight.compare.length) this.highlight.compare = nextHighlight.compare;
    if (nextHighlight.swap.length) this.highlight.swap = nextHighlight.swap;
    if (op.stats) this.stats = { ...op.stats };
  }

  /** 前进 step 步。 */
  step(stepCount = 1) {
    let applied = 0;
    while (applied < stepCount && this.cursor < this.total) {
      const op = this.operations[this.cursor];
      this._apply(op);
      this.cursor++;
      applied++;
    }
    this._emitStats();
    this.draw();
    if (this.finished && applied > 0 && this._onFinish) this._onFinish();
    return applied;
  }

  /**
   * 跳到指定进度（0~1）。
   * 因为操作序列是自包含的，这里直接从 0 重放到目标位置，
   * 保证任何时刻画面都和「顺序播放到这里」完全一致。
   */
  seekToStep(targetStep) {
    const target = Math.max(0, Math.min(this.total, Math.floor(targetStep)));
    if (target === this.cursor) return;
    if (target < this.cursor) {
      // 回退：从头重放
      this.reset();
    }
    this.step(target - this.cursor);
  }

  /** 直接跳到末尾（立即显示排序结果）。 */
  finish() {
    this.seekToStep(this.total);
  }

  // ---------- 绘制 ----------

  draw() {
    const { ctx, metrics } = this;
    const W = metrics.width;
    const H = metrics.height;
    ctx.clearRect(0, 0, W, H);

    const n = this.view.length;
    if (n === 0) {
      ctx.fillStyle = '#8a93a6';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('没有数据，请先生成数组', W / 2, H / 2);
      return;
    }

    const padding = { top: 24, right: 12, bottom: 18, left: 12 };
    const plotW = W - padding.left - padding.right;
    const plotH = H - padding.top - padding.bottom;
    const maxVal = Math.max(...this.view, 1);

    // 柱子宽度：留 1px 间隙，柱子太窄时不再留缝
    const slot = plotW / n;
    const gap = slot > 3 ? Math.min(3, slot * 0.18) : 0;
    const barW = Math.max(1, slot - gap);

    // 基线
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + plotH + 0.5);
    ctx.lineTo(padding.left + plotW, padding.top + plotH + 0.5);
    ctx.stroke();

    const compareSet = new Set(this.highlight.compare);
    const swapSet = new Set(this.highlight.swap);

    for (let i = 0; i < n; i++) {
      const value = this.view[i];
      const barH = Math.max(2, (value / maxVal) * plotH);
      const x = padding.left + i * slot + gap / 2;
      const y = padding.top + plotH - barH;

      let color = COLORS.default;
      if (this.sortedSet.has(i)) color = COLORS.sorted;
      if (compareSet.has(i)) color = COLORS.compare;
      if (swapSet.has(i)) color = COLORS.swap; // 交换优先级最高，覆盖上面的颜色

      ctx.fillStyle = color;
      this._roundRect(ctx, x, y, barW, barH, Math.min(3, barW / 2));
      ctx.fill();

      // 数字标注：柱子足够宽才画，避免糊成一团
      if (barW >= 18 && H > 160) {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = `${Math.min(13, barW * 0.5)}px ui-monospace, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(value), x + barW / 2, y - 3);
      }
    }

    // 进度条（画在画布顶部，跟随播放）
    const progressW = plotW * this.progress;
    ctx.fillStyle = 'rgba(110,168,254,0.55)';
    ctx.fillRect(padding.left, 6, progressW, 3);
  }

  _roundRect(ctx, x, y, w, h, r) {
    if (r <= 0) {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      return;
    }
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

export { COLORS };
