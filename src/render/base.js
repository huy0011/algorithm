/**
 * 渲染层公共基类。
 *
 * 无论可视化的是「一排柱子」「一张网格」还是「一个栈」，
 * 播放逻辑都是同一套：
 *   1. 加载操作序列，游标归零
 *   2. step(n) 依次应用操作，每应用一个就重绘
 *   3. seekTo(k) 从 0 重放到 k（因为序列自包含，画面永远一致）
 *
 * 子类只需要实现两件事：
 *   _applyOp(op)  把一条操作作用到自己的可视状态上
 *   draw()        把当前可视状态画出来
 *
 * 这样「新增一种可视化」的成本就是写一个子类，而不是重写一遍播放器。
 */

export class BaseVisualizer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} result 算法产出的结果对象 { kind, operations, stats, ... }
   */
  constructor(canvas, result = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.operations = [];
    this.cursor = 0;
    /** 最近一次操作的统计快照 */
    this.stats = { comparisons: 0, swaps: 0, writes: 0, visits: 0, steps: 0 };
    this.metrics = { width: 0, height: 0, dpr: 1 };

    this._onStats = null;
    this._onFinish = null;

    this._observeResize();
    if (result) this.load(result);
  }

  // ---------- 尺寸自适应 ----------

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
    // getBoundingClientRect 在元素还没布局时可能返回 0，所以用 rAF 兜一次
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(resize);
    else resize();
  }

  onStats(cb) { this._onStats = cb; }
  onFinish(cb) { this._onFinish = cb; }

  // ---------- 载入与重置 ----------

  /** 子类覆盖：从 result 里恢复初始可视状态。 */
  _resetState() {}

  load(result) {
    this.operations = result.operations || [];
    this._result = result;
    this.reset();
  }

  reset() {
    this.cursor = 0;
    this.stats = { comparisons: 0, swaps: 0, writes: 0, visits: 0, steps: 0 };
    this._resetState();
    this._emitStats();
    this.draw();
  }

  // ---------- 播放控制 ----------

  get total() { return this.operations.length; }
  get progress() { return this.total === 0 ? 1 : this.cursor / this.total; }
  get finished() { return this.cursor >= this.total; }

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

  /** 子类覆盖：应用一条操作。 */
  _applyOp(op) {}

  step(stepCount = 1) {
    let applied = 0;
    while (applied < stepCount && this.cursor < this.total) {
      const op = this.operations[this.cursor];
      this._applyOp(op);
      if (op.stats) this.stats = { ...op.stats };
      this.cursor++;
      applied++;
    }
    this._emitStats();
    this.draw();
    if (this.finished && applied > 0 && this._onFinish) this._onFinish();
    return applied;
  }

  /** 跳到指定步数。回退时从头重放，保证画面与顺序播放完全一致。 */
  seekToStep(targetStep) {
    const target = Math.max(0, Math.min(this.total, Math.floor(targetStep)));
    if (target === this.cursor) return;
    if (target < this.cursor) this.reset();
    this.step(target - this.cursor);
  }

  finish() { this.seekToStep(this.total); }

  // ---------- 绘制工具 ----------

  draw() {}

  /** 清空并返回绘图区尺寸。 */
  _clear() {
    const { ctx, metrics } = this;
    ctx.clearRect(0, 0, metrics.width, metrics.height);
    return { W: metrics.width, H: metrics.height };
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    if (radius <= 0) {
      ctx.rect(x, y, w, h);
      return;
    }
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /** 画一条顶部进度条。 */
  _drawProgressBar(plotLeft, plotW) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(110,168,254,0.55)';
    ctx.fillRect(plotLeft, 6, plotW * this.progress, 3);
  }

  /** 在画布中央画一句提示文字。 */
  _drawCenteredText(text, color = '#8a93a6', font = '14px system-ui, sans-serif') {
    const { ctx, metrics } = this;
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, metrics.width / 2, metrics.height / 2);
  }
}

/** 各可视化类型共用的配色。 */
export const COLORS = {
  default: '#4a7fd4',
  compare: '#f2b134',
  swap: '#e8563f',
  sorted: '#3fb27f',
  pivot: '#a06cd5',
  // 网格用
  wall: '#2a3346',
  open: '#1b2333',
  visited: '#3f6ea8',
  frontier: '#f2b134',
  path: '#3fb27f',
  start: '#3fb27f',
  end: '#e8563f',
  // 查找用
  eliminated: '#39445c',
  active: '#f2b134',
  hit: '#3fb27f',
};
