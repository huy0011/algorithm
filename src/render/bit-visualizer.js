/**
 * 位运算渲染器：把整数画成二进制位方格。
 *
 * 用于「位运算」可视化。画面上是几行 0/1：
 *   A     1 1 0 0 1 1 0 0
 *   B     1 0 1 0 1 0 1 0
 *   A^B   0 1 1 0 0 1 1 0
 * 逐位计算时会高亮当前列，可以看到「第几位、两个位运算得到什么」。
 *
 * 它只认识 operand / resultBit / focusColumn / note 这几种动作。
 */

import { BaseVisualizer } from './base.js';
import { BitOp } from '../algorithms/tracer.js';

const BIT_COLORS = {
  zero: '#26304a',
  one: '#3f6ea8',
  focusedZero: '#4a4459',
  focusedOne: '#a06cd5',
  resultZero: '#2b3a2f',
  resultOne: '#3fb27f',
};

export class BitVisualizer extends BaseVisualizer {
  _resetState() {
    const result = this._result;
    this.meta = (result && result.meta) || {};
    this.bitWidth = this.meta.bitWidth || 8;
    /** 每行：{ label, bits: [], value } */
    this.rows = [];
    /** 当前聚焦的列 */
    this.focusColumn = -1;
    this.focusNote = '';
    this.lastNote = '';
  }

  _ensureRow(slot, label) {
    while (this.rows.length <= slot) {
      this.rows.push({ label: '', bits: new Array(this.bitWidth).fill(null), value: null });
    }
    if (label) this.rows[slot].label = label;
    return this.rows[slot];
  }

  _applyOp(op) {
    switch (op.type) {
      case BitOp.OPERAND: {
        const row = this._ensureRow(op.slot, op.label);
        row.bits = op.bits.slice();
        row.value = op.value;
        break;
      }

      case BitOp.RESULT_BIT: {
        const row = this._ensureRow(op.slot, '');
        if (op.bitIndex >= 0 && op.bitIndex < row.bits.length) {
          row.bits[op.bitIndex] = op.value;
        }
        break;
      }

      case BitOp.RESULT: {
        const row = this._ensureRow(op.slot, op.label);
        row.bits = op.bits.slice();
        row.value = op.value;
        break;
      }

      case BitOp.FOCUS_COLUMN:
        this.focusColumn = op.bitIndex;
        this.focusNote = op.note || '';
        break;

      case BitOp.NOTE:
        this.lastNote = op.note || '';
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
    const padLeft = 16;
    const padRight = 16;

    // ---- 标题 ----
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#e6ebf5';
    ctx.fillText(this.meta.title || '位运算', padLeft, 12);

    if (this.meta.explain) {
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#8a93a6';
      ctx.fillText(this.meta.explain, padLeft, 31);
    }

    if (this.rows.length === 0) {
      this._drawCenteredText('等待数据…');
      return;
    }

    // ---- 布局：位方格 ----
    const labelW = 62;          // 左侧 「A =」「B =」标签宽度
    const top = 68;
    const rowH = 52;
    const rowGap = 12;
    const availW = W - padLeft - padRight - labelW - 60;
    const cellW = Math.min(46, Math.max(18, availW / this.bitWidth));
    const cellH = Math.min(40, rowH - 8);
    const gridLeft = padLeft + labelW;

    if (cellW < 14) {
      this._drawCenteredText('宽度不足，请放大窗口');
      return;
    }

    // ---- 位序号表头 ----
    ctx.font = '10px ui-monospace, Consolas, monospace';
    ctx.fillStyle = '#5d6779';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let i = 0; i < this.bitWidth; i++) {
      const x = gridLeft + i * cellW + cellW / 2;
      const bitIndex = this.bitWidth - 1 - i;   // 左边是高位
      ctx.fillText(String(bitIndex), x, top - 4);
    }

    // ---- 逐行绘制 ----
    this.rows.forEach((row, rowIndex) => {
      const y = top + rowIndex * (rowH + rowGap);
      const isResultRow = rowIndex === 2;

      // 行标签
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = isResultRow ? '#3fb27f' : '#b4bdd0';
      const label = row.label || (rowIndex === 0 ? 'A' : rowIndex === 1 ? 'B' : '结果');
      ctx.fillText(label, padLeft, y + cellH / 2);

      if (row.value !== null) {
        ctx.font = '10px ui-monospace, Consolas, monospace';
        ctx.fillStyle = '#5d6779';
        ctx.fillText(`=${row.value}`, padLeft, y + cellH / 2 + 16);
      }

      // 位方格
      for (let i = 0; i < this.bitWidth; i++) {
        const bit = row.bits[i];
        const x = gridLeft + i * cellW;
        const focused = this.focusColumn === i;

        let fill;
        if (bit === null) {
          fill = '#171d2b';   // 还没算出来
        } else if (isResultRow) {
          fill = bit === 1 ? BIT_COLORS.resultOne : BIT_COLORS.resultZero;
        } else if (focused) {
          fill = bit === 1 ? BIT_COLORS.focusedOne : BIT_COLORS.focusedZero;
        } else {
          fill = bit === 1 ? BIT_COLORS.one : BIT_COLORS.zero;
        }

        ctx.fillStyle = fill;
        this._roundRect(x + 2, y, cellW - 4, cellH, 4);
        ctx.fill();

        // 聚焦列加一圈白边
        if (focused) {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 位值
        if (bit !== null && cellW >= 22) {
          ctx.fillStyle = bit === 1 ? '#ffffff' : 'rgba(230,235,245,0.45)';
          ctx.font = `bold ${Math.min(16, cellW * 0.42)}px ui-monospace, Consolas, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(bit), x + cellW / 2, y + cellH / 2);
        }
      }
    });

    // ---- 运算符（画在 A、B 两行之间靠左）----
    if (this.meta.symbol) {
      ctx.fillStyle = '#f2b134';
      ctx.font = 'bold 18px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const opY = top + rowH + rowGap / 2;
      ctx.fillText(this.meta.symbol, padLeft + labelW - 12, opY);
    }

    // ---- 底部说明 ----
    const noteY = top + this.rows.length * (rowH + rowGap) + 6;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (this.focusNote) {
      ctx.fillStyle = '#c9a9e8';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(this.focusNote, padLeft, noteY);
    }
    if (this.lastNote) {
      ctx.fillStyle = '#8a93a6';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(this.lastNote.slice(0, 76), padLeft, noteY + 20);
    }

    // ---- 结果值大字显示 ----
    const resultRow = this.rows[2];
    if (resultRow && resultRow.value !== null && this.finished) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#3fb27f';
      ctx.font = 'bold 15px ui-monospace, Consolas, monospace';
      ctx.fillText(`结果 = ${resultRow.value}`, W - padRight, 12);
    }

    this._drawProgressBar(padLeft, W - padLeft - padRight);
  }
}
