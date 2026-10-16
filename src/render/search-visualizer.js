/**
 * 查找渲染器：用于二分查找、二分答案。
 *
 * 与柱状图的区别在于，查找的重点不是「数据怎么动」，而是
 * **候选区间怎么一步步收窄**。所以画面上呈现的是：
 *   - 一排格子，被排除的格子变暗
 *   - 一条高亮的区间带，标出当前还在考虑的 [lo, hi]
 *   - 一个指针，指出这一步探测的位置
 *
 * 它也不认识「二分」这个概念，只认识 probe / narrow / found / answer 四种动作。
 */

import { BaseVisualizer, COLORS } from './base.js';
import { SearchOp } from '../algorithms/tracer.js';

export class SearchVisualizer extends BaseVisualizer {
  _resetState() {
    const result = this._result;
    this.array = (result.array || []).slice();
    this.meta = result.meta || {};
    this.lo = 0;
    this.hi = this.array.length - 1;
    this.probeIndex = -1;
    this.probeCmp = null;
    this.foundIndex = -1;
    this.narrowReason = '';
    /** 二分答案专用：记录每一步判定的结果 */
    this.answerValue = null;
    this.answerFeasible = null;
    this.answerNote = '';
    this.bestAnswer = null;
    /** 被明确排除的下标 */
    this.eliminated = new Set();
  }

  _applyOp(op) {
    switch (op.type) {
      case SearchOp.PROBE:
        this.probeIndex = op.index;
        this.probeCmp = op.cmp;
        if (op.cmp === 0) this.foundIndex = op.index;
        break;

      case SearchOp.NARROW: {
        const prevLo = this.lo;
        const prevHi = this.hi;
        this.lo = op.lo;
        this.hi = op.hi;
        this.narrowReason = op.reason || '';
        // 区间之外的位置标记为「已排除」，视觉上变暗
        for (let i = 0; i < this.array.length; i++) {
          if (i < op.lo || i > op.hi) this.eliminated.add(i);
        }
        // 区间收缩回退时（seek 重放）需要重置，由 _resetState 保证
        void prevLo; void prevHi;
        break;
      }

      case SearchOp.FOUND:
        this.foundIndex = op.index;
        break;

      case SearchOp.ANSWER:
        this.answerValue = op.value;
        this.answerFeasible = op.feasible;
        this.answerNote = op.note || '';
        if (op.feasible) this.bestAnswer = op.value;
        break;

      default:
        break;
    }
  }

  draw() {
    const { ctx } = this;
    const { W, H } = this._clear();

    const n = this.array.length;
    if (n === 0) {
      this._drawCenteredText('没有数据');
      return;
    }

    const isAnswerMode = Boolean(this.meta.pieces);

    // 布局：顶部信息 + 中间格子行 + 底部区间说明
    const infoH = 46;
    const cellAreaTop = infoH + 28;
    const cellAreaH = Math.min(120, H * 0.34);
    const padding = { left: 16, right: 16 };
    const plotW = W - padding.left - padding.right;

    // ---- 顶部信息 ----
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#e6ebf5';
    const title = this.meta.title || '查找';
    ctx.fillText(title, padding.left, 14);

    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillStyle = '#8a93a6';
    if (isAnswerMode) {
      ctx.fillText(
        `目标：切出至少 ${this.meta.pieces} 段  ·  当前候选答案区间 [${this.lo}, ${this.hi}]`,
        padding.left, 34
      );
    } else {
      // 目标值标出来，让「往左还是往右」有依据
      const target = this.meta.target;
      ctx.fillText(`目标值 ${target}  ·  当前候选区间 [${this.lo}, ${this.hi}]`, padding.left, 34);
    }

    // ---- 格子行 ----
    const slot = plotW / n;
    const gap = slot > 4 ? Math.min(6, slot * 0.16) : 1;
    const cellW = Math.max(2, slot - gap);
    const cellH = Math.min(cellAreaH, slot * 2.2);

    for (let i = 0; i < n; i++) {
      const x = padding.left + i * slot + gap / 2;
      const y = cellAreaTop;

      let fill = COLORS.default;
      let border = 'transparent';

      if (this.eliminated.has(i)) {
        fill = COLORS.eliminated; // 已被排除：变暗
      }
      // 当前候选区间内高亮
      if (i >= this.lo && i <= this.hi) {
        fill = '#3f6ea8';
      }
      // 探测点
      if (i === this.probeIndex) {
        fill = this.probeCmp === 0 ? COLORS.hit : COLORS.active;
        border = '#ffffff';
      }
      // 命中点
      if (i === this.foundIndex && this.foundIndex >= 0) {
        fill = COLORS.hit;
      }

      ctx.fillStyle = fill;
      this._roundRect(x, y, cellW, cellH, Math.min(4, cellW / 3));
      ctx.fill();

      if (border !== 'transparent') {
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 格子够宽就写值
      if (cellW >= 20) {
        ctx.fillStyle = i === this.probeIndex ? '#ffffff' : 'rgba(230,235,245,0.9)';
        ctx.font = `${Math.min(14, cellW * 0.42)}px ui-monospace, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(this.array[i]), x + cellW / 2, y + cellH / 2);
      }

      // 下标标注
      if (cellW >= 14) {
        ctx.fillStyle = 'rgba(138,147,166,0.75)';
        ctx.font = `${Math.min(10, cellW * 0.36)}px ui-monospace, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(i), x + cellW / 2, y + cellH + 4);
      }
    }

    // ---- 区间带：直观展示「还在考虑的区间」----
    const bandY = cellAreaTop + cellH + 22;
    if (this.lo <= this.hi && this.hi < n) {
      const x1 = padding.left + this.lo * slot;
      const x2 = padding.left + (this.hi + 1) * slot;
      ctx.fillStyle = 'rgba(242,177,52,0.18)';
      ctx.fillRect(x1, bandY, x2 - x1, 16);
      ctx.strokeStyle = 'rgba(242,177,52,0.75)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x1 + 0.5, bandY + 0.5, Math.max(1, x2 - x1 - 1), 15);

      ctx.fillStyle = '#f2b134';
      ctx.font = '11px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`候选区间 [${this.lo}, ${this.hi}]`, (x1 + x2) / 2, bandY + 8);
    }

    // ---- 底部说明：这一步为什么这么走 ----
    const reasonY = bandY + 34;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (this.answerNote) {
      ctx.fillStyle = this.answerFeasible === false ? '#e8563f' : '#3fb27f';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(this.answerNote, padding.left, reasonY);
    } else if (this.narrowReason) {
      ctx.fillStyle = '#8a93a6';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(this.narrowReason, padding.left, reasonY);
    }

    // ---- 状态徽标：命中 / 未找到 / 当前最优 ----
    const badgeY = reasonY + 24;
    const steps = this.stats.comparisons;
    ctx.font = '12px ui-monospace, Consolas, monospace';

    if (isAnswerMode) {
      if (this.bestAnswer !== null) {
        ctx.fillStyle = '#3fb27f';
        ctx.fillText(`当前最优可行解：${this.bestAnswer}`, padding.left, badgeY);
      }
    } else if (this.finished) {
      if (this.foundIndex >= 0) {
        ctx.fillStyle = '#3fb27f';
        ctx.fillText(`✓ 在下标 ${this.foundIndex} 找到目标值 ${this.array[this.foundIndex]}（共比较 ${steps} 次）`, padding.left, badgeY);
      } else {
        ctx.fillStyle = '#e8563f';
        ctx.fillText(`✗ 目标值不在数组中（共比较 ${steps} 次，区间已空）`, padding.left, badgeY);
      }
    }

    this._drawProgressBar(padding.left, plotW);
  }
}
