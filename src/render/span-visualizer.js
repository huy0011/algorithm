/**
 * 指针 / 区间渲染器：用于双指针、滑动窗口、前缀和、差分数组、KMP、字符串哈希。
 *
 * 这一类和柱状图渲染器的关注点完全不同：
 *   柱状图关心「数据怎么动」，所以画柱子高度
 *   这里关心「指针在哪、窗口覆盖哪一段、累加值是多少」，所以画：
 *     - 一排格子（显示真实字符或数值）
 *     - 若干彩色指针（带名字，如 L / R / i / j）
 *     - 半透明的窗口覆盖层
 *     - 右侧的累加值面板
 *
 * 它同样不认识具体算法，只认识 pointer / window / accumulate / resolve / check 几种动作。
 */

import { BaseVisualizer, COLORS } from './base.js';
import { SpanOp } from '../algorithms/tracer.js';

/** 指针调色板：按出现顺序分配，保证同名字段颜色稳定。 */
const POINTER_COLORS = ['#f2b134', '#e8563f', '#3fb27f', '#a06cd5', '#4a7fd4', '#e88ab0'];

export class SpanVisualizer extends BaseVisualizer {
  _resetState() {
    const result = this._result;
    this.array = ((result && result.array) || []).slice();
    this.meta = (result && result.meta) || {};

    /** 指针：name -> index */
    this.pointers = {};
    /** 指针的配色和说明（来自 meta.pointers） */
    this.pointerMeta = {};
    (this.meta.pointers || []).forEach((p, i) => {
      this.pointerMeta[p.name] = {
        color: p.color || POINTER_COLORS[i % POINTER_COLORS.length],
        label: p.label || p.name,
      };
    });

    /** 当前窗口 */
    this.window = null;
    this.windowLabel = '';
    /** 累加值：name -> { value, note } */
    this.accumulates = {};
    /** 已确定答案的下标 */
    this.resolved = new Set();
    /** 正在比较高亮的两个下标 */
    this.checkIndices = [];
    this.checkOk = null;
    /** 最近一句说明 */
    this.lastNote = '';
    this.lastCheckNote = '';
    /** 辅助行：slot -> { label, values:[] }（高精度的 B/结果行、KMP 的 next 行） */
    this.extraRows = new Map();
  }

  _applyOp(op) {
    switch (op.type) {
      case SpanOp.POINTER: {
        this.pointers[op.name] = op.index;
        // 首次出现的指针自动分配颜色
        if (!this.pointerMeta[op.name]) {
          const idx = Object.keys(this.pointerMeta).length;
          this.pointerMeta[op.name] = {
            color: POINTER_COLORS[idx % POINTER_COLORS.length],
            label: op.name,
          };
        }
        if (op.note) this.lastNote = op.note;
        break;
      }

      case SpanOp.WINDOW:
        this.window = [op.from, op.to];
        this.windowLabel = op.label || '';
        break;

      case SpanOp.ACCUMULATE:
        this.accumulates[op.name] = { value: op.value, note: op.note || '' };
        break;

      case SpanOp.RESOLVE:
        this.resolved.add(op.index);
        break;

      case SpanOp.CHECK:
        this.checkIndices = op.indices ? op.indices.slice() : [];
        this.checkOk = op.ok;
        this.lastCheckNote = op.note || '';
        break;

      case SpanOp.NOTE:
        this.lastNote = op.note || '';
        break;

      case SpanOp.EXTRA_ROW:
        this.extraRows.set(op.slot, { label: op.label, values: op.values.slice() });
        break;

      default:
        break;
    }
  }

  /** 渲染用的显示文本：字符串算法会把数字还原成字符。 */
  _displayText(i) {
    const value = this.array[i];
    if (this.meta.charOffset) {
      const code = value + this.meta.charOffset;
      if (code >= 32 && code <= 126) return String.fromCharCode(code);
    }
    return String(value);
  }

  draw() {
    const { ctx } = this;
    const { W, H } = this._clear();

    const n = this.array.length;
    if (n === 0) {
      this._drawCenteredText('没有数据');
      return;
    }

    // ---- 顶部标题与说明 ----
    const padLeft = 16;
    const padRight = 16;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#e6ebf5';
    ctx.fillText(this.meta.title || '指针 / 区间', padLeft, 12);

    if (this.meta.explain) {
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#8a93a6';
      // 说明文字可能较长，简单截断避免压到别的内容
      const explain = this.meta.explain.length > 62
        ? this.meta.explain.slice(0, 62) + '…'
        : this.meta.explain;
      ctx.fillText(explain, padLeft, 31);
    }

    // 字符串算法的原文（比数值更直观）
    if (this.meta.text) {
      ctx.font = '12px ui-monospace, Consolas, monospace';
      ctx.fillStyle = '#a9c8f5';
      ctx.textAlign = 'right';
      const pat = this.meta.pattern ? `　模式串：${this.meta.pattern}` : '';
      ctx.fillText(`主串：${this.meta.text}${pat}`, W - padRight, 31);
      ctx.textAlign = 'left';
    }

    // ---- 布局 ----
    // 小画布（手机）收紧留白，否则格子被挤出可视区
    const compact = H < 300;
    const cellsTop = compact ? 46 : 62;
    const cellsH = compact
      ? Math.min(38, Math.max(24, H * 0.14))
      : Math.min(64, Math.max(34, H * 0.16));
    const windowBarY = cellsTop - (compact ? 10 : 16);   // 窗口条画在格子上方

    const plotW = W - padLeft - padRight;
    const slot = plotW / n;
    const gap = slot > 4 ? Math.min(5, slot * 0.14) : 1;
    const cellW = Math.max(2, slot - gap);

    // ---- 窗口覆盖层 ----
    if (this.window && this.window[1] >= this.window[0]) {
      const [from, to] = this.window;
      const x1 = padLeft + from * slot;
      const x2 = padLeft + (to + 1) * slot;
      ctx.fillStyle = 'rgba(160,108,213,0.16)';
      ctx.fillRect(x1, windowBarY, x2 - x1, cellsH + 16);
      ctx.strokeStyle = 'rgba(160,108,213,0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x1 + 0.5, windowBarY + 0.5, Math.max(1, x2 - x1 - 1), cellsH + 15);

      if (this.windowLabel && cellW > 12) {
        ctx.fillStyle = '#c9a9e8';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.windowLabel, (x1 + x2) / 2, windowBarY - 3);
        ctx.textAlign = 'left';
      }
    }

    // ---- 格子 ----
    const checkSet = new Set(this.checkIndices);
    for (let i = 0; i < n; i++) {
      const x = padLeft + i * slot + gap / 2;
      const y = cellsTop;

      let fill = COLORS.default;
      if (this.resolved.has(i)) fill = COLORS.sorted;
      if (this.window && i >= this.window[0] && i <= this.window[1]) fill = '#3f6ea8';
      if (checkSet.has(i)) fill = this.checkOk === false ? COLORS.swap : COLORS.compare;
      if (this.resolved.has(i) && !checkSet.has(i)) fill = COLORS.sorted;

      ctx.fillStyle = fill;
      this._roundRect(x, y, cellW, cellsH, Math.min(4, cellW / 3));
      ctx.fill();

      // 值 / 字符
      const text = this._displayText(i);
      if (cellW >= 13) {
        ctx.fillStyle = '#e6ebf5';
        const isChar = Boolean(this.meta.charOffset);
        const size = Math.min(isChar ? 15 : 13, cellW * (isChar ? 0.6 : 0.5));
        ctx.font = `${size}px ${isChar ? 'ui-monospace, Consolas, monospace' : 'system-ui, sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + cellW / 2, y + cellsH / 2);
      }

      // 下标
      if (cellW >= 11) {
        ctx.fillStyle = 'rgba(138,147,166,0.7)';
        ctx.font = `${Math.min(10, cellW * 0.4)}px ui-monospace, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(i), x + cellW / 2, y + cellsH + 3);
      }
    }

    // ---- 辅助行（按位对齐，画在下标行下方）----
    // 例：高精度加法的 B 操作数行 / 结果行；KMP 的 next 数组行。
    let extraBottom = cellsTop + cellsH + 20;   // 辅助行的起始 y（会被逐行推进）
    if (this.extraRows.size > 0) {
      const rowH = Math.min(30, Math.max(20, cellsH * 0.6));
      const sortedSlots = [...this.extraRows.keys()].sort((a, b) => a - b);
      sortedSlots.forEach((slot2, rowIdx) => {
        const row = this.extraRows.get(slot2);
        const ry = extraBottom + 14 + rowIdx * (rowH + 6);

        // 行标签（画在格子左侧）
        ctx.fillStyle = '#8a93a6';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(row.label || '', padLeft - 6, ry + rowH / 2);
        ctx.textAlign = 'left';

        for (let i = 0; i < n; i++) {
          const x = padLeft + i * slot + gap / 2;
          const v = row.values[i];
          if (v === undefined || v === null) continue;
          ctx.fillStyle = 'rgba(30, 40, 60, 0.9)';
          this._roundRect(x, ry, cellW, rowH, Math.min(4, cellW / 3));
          ctx.fill();
          if (cellW >= 13) {
            ctx.fillStyle = slot2 === 0 ? '#f2b134' : '#8fe3c4';
            ctx.font = `${Math.min(12, cellW * 0.5)}px ui-monospace, Consolas, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(v), x + cellW / 2, ry + rowH / 2);
          }
        }
      });
      extraBottom += sortedSlots.length * (rowH + 6) + 14;
    }

    // ---- 指针（画成三角箭头 + 名字）----
    const pointersY = Math.max(cellsTop + cellsH + 30, extraBottom + 6);   // 有辅助行时下移
    for (const [name, index] of Object.entries(this.pointers)) {
      if (index < 0 || index >= n) continue;
      const meta = this.pointerMeta[name] || { color: '#f2b134', label: name };
      const cx = padLeft + index * slot + slot / 2;
      const y = pointersY;

      // 箭头
      ctx.fillStyle = meta.color;
      ctx.beginPath();
      ctx.moveTo(cx, y - 7);
      ctx.lineTo(cx - 5, y - 16);
      ctx.lineTo(cx + 5, y - 16);
      ctx.closePath();
      ctx.fill();

      // 名字
      ctx.font = 'bold 11px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(name, cx, y - 4);

      // 说明文字（只在空间够的时候画，避免重叠）
      if (slot > 26 && meta.label) {
        ctx.font = '9px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(138,147,166,0.85)';
        ctx.fillText(meta.label, cx, y + 10);
      }
    }

    // ---- 累加值面板 ----
    const panelY = pointersY + 30;
    const entries = Object.entries(this.accumulates);
    if (entries.length > 0) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      // 最多显示 4 个，避免溢出
      const shown = entries.slice(-4);
      let px = padLeft;
      const panelW = Math.min(150, (W - padLeft - padRight) / shown.length - 8);
      for (const [key, item] of shown) {
        ctx.fillStyle = '#1e2536';
        ctx.fillRect(px, panelY, panelW, 42);
        ctx.fillStyle = '#8a93a6';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(key, px + 9, panelY + 6);
        ctx.fillStyle = '#6ea8fe';
        ctx.font = 'bold 14px ui-monospace, Consolas, monospace';
        ctx.fillText(String(item.value), px + 9, panelY + 20);
        px += panelW + 8;
      }
    }

    // ---- 底部说明 ----
    const noteY = panelY + 52;
    if (this.lastCheckNote) {
      ctx.fillStyle = this.checkOk === false ? '#f0a89b' : '#a9e3c3';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(this.lastCheckNote.slice(0, 78), padLeft, noteY);
    } else if (this.lastNote) {
      ctx.fillStyle = '#8a93a6';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(this.lastNote.slice(0, 78), padLeft, noteY);
    }

    this._drawProgressBar(padLeft, plotW);
  }
}
