/**
 * 柱状图渲染器：用于所有排序类算法（比较排序 + 非比较排序）。
 *
 * 它不认识「冒泡」「快排」「计数排序」这些概念，
 * 只认识操作序列里的 compare / swap / overwrite / markSorted / highlightRange / markBucket。
 * 所以新增一个排序算法，这个文件一行都不用改。
 *
 * 关键设计：维护一个「当前可视数组」view[]，
 * 从头重放操作序列 —— 因为序列自包含，所以跳到任意进度都不会失真。
 */

import { BaseVisualizer, COLORS } from './base.js';
import { ArrayOp } from '../algorithms/tracer.js';

export class BarVisualizer extends BaseVisualizer {
  _resetState() {
    const result = this._result;
    // 构造阶段还没 load 数据时 result 是 undefined，全部字段都要有空的兜底值
    // 排序类算法的原始数组：result 里没有 baseArray 时用最终结果兜底
    const base = (result && (result.baseArray || result.sorted)) || [];
    this.baseArray = base.slice();
    this.view = this.baseArray.slice();
    this.sortedSet = new Set();
    this.highlight = { compare: [], swap: [], range: null };
    this.bucketLabel = '';
  }

  _applyOp(op) {
    switch (op.type) {
      case ArrayOp.COMPARE:
        this.highlight.compare = op.indices.slice();
        break;

      case ArrayOp.SWAP: {
        const [i, j] = op.indices;
        const tmp = this.view[i];
        this.view[i] = this.view[j];
        this.view[j] = tmp;
        this.highlight.swap = op.indices.slice();
        break;
      }

      case ArrayOp.OVERWRITE:
        this.view[op.index] = op.value;
        this.highlight.swap = [op.index];
        break;

      case ArrayOp.MARK_SORTED:
        this.sortedSet.add(op.index);
        break;

      case ArrayOp.HIGHLIGHT_RANGE:
        this.highlight.range = [op.from, op.to];
        this.bucketLabel = op.label || '';
        break;

      case ArrayOp.MARK_BUCKET:
        this.bucketLabel = op.label || `桶 ${op.bucketIndex}`;
        break;

      default:
        break;
    }
  }

  draw() {
    const { ctx } = this;
    const { W, H } = this._clear();

    // 画布尺寸不可用时直接跳过（隐藏/未布局时 W、H 为 0，
    // 按比例算出的坐标会变成负数或 NaN，画出错乱的图形）
    if (this._tooSmall(W, H)) return;
    const n = this.view.length;
    if (n === 0) {
      this._drawCenteredText('没有数据，请先生成数组');
      return;
    }

    const padding = { top: 34, right: 12, bottom: 18, left: 12 };
    const plotW = W - padding.left - padding.right;
    const plotH = H - padding.top - padding.bottom;
    const maxVal = Math.max(...this.view, 1);

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

    // 区间高亮（计数/基数/桶排序用来表示「本轮处理范围」）
    if (this.highlight.range) {
      const [from, to] = this.highlight.range;
      ctx.fillStyle = 'rgba(160,108,213,0.13)';
      const x = padding.left + from * slot;
      const w = (to - from + 1) * slot;
      ctx.fillRect(x, padding.top, w, plotH);
    }

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
      if (swapSet.has(i)) color = COLORS.swap;

      ctx.fillStyle = color;
      this._roundRect(x, y, barW, barH, Math.min(3, barW / 2));
      ctx.fill();

      // 柱子够宽才标数字，否则会糊成一片
      if (barW >= 18 && H > 160) {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = `${Math.min(13, barW * 0.5)}px ui-monospace, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(value), x + barW / 2, y - 3);
      }
    }

    // 非比较排序的阶段说明（例如「第 2 轮：按十位排序」）
    if (this.bucketLabel) {
      ctx.fillStyle = 'rgba(160,108,213,0.95)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(this.bucketLabel, padding.left, 12);
    }

    this._drawProgressBar(padding.left, plotW);
  }
}
