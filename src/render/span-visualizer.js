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

  /**
   * 按可用宽度裁剪文字，超长时加省略号。
   * 画布变窄时用它保证文字不会溢出画布边界。
   */
  _fitText(text, maxWidth) {
    const s = String(text == null ? '' : text);
    if (!s) return '';
    if (this.ctx.measureText(s).width <= maxWidth) return s;
    let lo = 0;
    let hi = s.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (this.ctx.measureText(s.slice(0, mid) + '…').width <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    return lo > 0 ? s.slice(0, lo) + '…' : '';
  }

  draw() {
    const { ctx } = this;
    const { W, H } = this._clear();

    const n = this.array.length;
    if (n === 0) {
      this._drawCenteredText('没有数据');
      return;
    }

    // 画布还没量到尺寸时（隐藏/未布局），直接不画。
    // 否则 plotW 会变成负数，格子和窗口都画出负宽度矩形，
    // 整屏只剩几条莫名其妙的色块 —— 手机上切页签后切回来就会这样。
    if (!(W > 40) || !(H > 40)) return;

    // ---- 顶部标题与说明 ----
    // 画布可能很窄（手机约 320~350px），所有文字都必须按可用宽度截断，
    // 否则会互相重叠或溢出边界 —— 这是之前 KMP 在手机上糊成一团的根因。
    const padLeft = 16;
    const padRight = 16;
    const contentW = W - padLeft - padRight;
    const compact = H < 300 || W < 380;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 第 1 行：标题（紧凑模式字号小一点）
    ctx.font = compact ? '12px system-ui, sans-serif' : '13px system-ui, sans-serif';
    ctx.fillStyle = '#e6ebf5';
    ctx.fillText(this._fitText(this.meta.title || '指针 / 区间', contentW), padLeft, compact ? 8 : 12);

    // 第 2 行：主串 / 模式串（字符串类算法）或说明文字（二者只留一个，避免叠字）
    let line2Top = 0;
    let hasLine2 = false;
    if (this.meta.text) {
      ctx.font = compact ? '10px ui-monospace, Consolas, monospace' : '11px ui-monospace, Consolas, monospace';
      ctx.fillStyle = '#a9c8f5';
      const pat = this.meta.pattern ? ` ｜ 模式 ${this.meta.pattern}` : '';
      line2Top = compact ? 25 : 31;
      ctx.fillText(this._fitText(`主串 ${this.meta.text}${pat}`, contentW), padLeft, line2Top);
      hasLine2 = true;
    } else if (this.meta.explain) {
      ctx.font = compact ? '10px system-ui, sans-serif' : '11px system-ui, sans-serif';
      ctx.fillStyle = '#8a93a6';
      line2Top = compact ? 25 : 31;
      ctx.fillText(this._fitText(this.meta.explain, contentW), padLeft, line2Top);
      hasLine2 = true;
    }

    // ---- 布局 ----
    // 小画布（手机）收紧留白，否则格子被挤出可视区
    const cellsTop = hasLine2
      ? (compact ? 42 : 58)
      : (compact ? 28 : 40);
    const cellsH = compact
      ? Math.min(34, Math.max(22, H * 0.12))
      : Math.min(64, Math.max(34, H * 0.16));
    const windowBarY = cellsTop - (compact ? 8 : 16);   // 窗口条画在格子上方

    const plotW = Math.max(40, W - padLeft - padRight);

    /*
     * 一屏放不下时只画一段「可见窗口」。
     *
     * 手机上画布约 346px，40 个字符挤进去每格只有 6.7px、字号 5px，
     * 根本看不清（之前的做法是干脆不画字，整排成了空条）。
     * 这里按「每格至少 11px 才可读」算出最多能放几个，
     * 不够就围绕当前关注的下标（指针 / 窗口）截一段来画。
     */
    const MIN_SLOT = 11;
    const fitCount = Math.max(4, Math.floor(plotW / MIN_SLOT));
    let viewFrom = 0;
    let viewTo = n - 1;
    if (n > fitCount) {
      // 关注点：优先窗口起点，其次第一个指针，否则 0
      let focus = 0;
      if (this.window && this.window[1] >= this.window[0]) focus = this.window[0];
      else {
        const ptrs = Object.values(this.pointers).filter((v) => Number.isFinite(v));
        if (ptrs.length) focus = Math.min(...ptrs);
      }
      focus = Math.max(0, Math.min(n - 1, focus));
      // 让关注点大致居中
      viewFrom = Math.max(0, Math.min(n - fitCount, focus - Math.floor(fitCount / 2)));
      viewTo = Math.min(n - 1, viewFrom + fitCount - 1);
    }
    const viewN = viewTo - viewFrom + 1;

    const slot = plotW / viewN;
    const gap = slot > 4 ? Math.min(5, slot * 0.14) : 1;
    const cellW = Math.max(2, slot - gap);

    // 截断提示：放到格子区最下方，避免压住下标行和 next 辅助行
    this._viewRange = viewN < n ? [viewFrom, viewTo, n] : null;
    if (this._viewRange) {
      const [vf, vt, total] = this._viewRange;
      ctx.font = compact ? '9px system-ui, sans-serif' : '10px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(150,170,200,0.75)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      // 位置在指针区下方（pointersY 在格子循环之后才算出来，这里先记下待补画）
      this._pendingHint = `只显示第 ${vf + 1}–${vt + 1} 个（共 ${total} 个）`;
    }

    // ---- 窗口覆盖层 ----
    if (this.window && this.window[1] >= this.window[0]) {
      // 只画落在可见范围内的部分
      const from = Math.max(this.window[0], viewFrom);
      const to = Math.min(this.window[1], viewTo);
      if (to >= from) {
        const x1 = padLeft + (from - viewFrom) * slot;
        const x2 = padLeft + (to - viewFrom + 1) * slot;
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
    }

    // ---- 格子（只画可见范围内的）----
    const checkSet = new Set(this.checkIndices);
    for (let i = viewFrom; i <= viewTo; i++) {
      const x = padLeft + (i - viewFrom) * slot + gap / 2;
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
      // 字号跟着格子宽度走：格子窄就缩字，缩到 7px 仍放不下才不画
      // （之前 cellW<13 直接跳过，20 格的字符串在手机上全成了空条）
      const text = this._displayText(i);
      if (cellW >= 5) {
        const isChar = Boolean(this.meta.charOffset);
        // 字符类最多占 0.78 格宽，数值类 0.62（多位数留点余量）
        const ratio = isChar ? 0.78 : 0.62;
        let size = Math.min(isChar ? 15 : 13, cellsH * 0.62, cellW * ratio);
        // 多位数再按字符数缩一次，避免 "123" 挤出格子
        if (!isChar && text.length > 1) size = Math.min(size, (cellW * 0.92) / text.length * 1.5);
        if (size >= 6.5) {
          ctx.fillStyle = '#e6ebf5';
          ctx.font = `${size}px ${isChar ? 'ui-monospace, Consolas, monospace' : 'system-ui, sans-serif'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x + cellW / 2, y + cellsH / 2);
        }
      }

      // 下标：格子太窄就跳过（避免数字糊成一片）
      if (cellW >= 9 && slot >= 11) {
        ctx.fillStyle = 'rgba(138,147,166,0.7)';
        ctx.font = `${Math.min(10, Math.max(7, cellW * 0.42))}px ui-monospace, Consolas, monospace`;
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

        // 行标签：画在辅助行正上方（原来画在格子左侧，右对齐后会溢出画布左边，
        // 屏幕上只剩「xt」这种半截文字）
        if (row.label) {
          ctx.fillStyle = '#8a93a6';
          ctx.font = '9px system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(this._fitText(row.label, plotW), padLeft, ry - 1);
          ctx.textAlign = 'left';
        }

        for (let i = viewFrom; i <= viewTo; i++) {
          const x = padLeft + (i - viewFrom) * slot + gap / 2;
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
      // 指针不在可见范围内就不画（否则会跑到画布外）
      if (index < viewFrom || index > viewTo) continue;
      const meta = this.pointerMeta[name] || { color: '#f2b134', label: name };
      const cx = padLeft + (index - viewFrom) * slot + slot / 2;
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

    // ---- 截断提示（在指针行上方一行，不与下标/辅助行打架）----
    if (this._pendingHint) {
      ctx.font = compact ? '9px system-ui, sans-serif' : '10px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(150,170,200,0.75)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(this._fitText(this._pendingHint, plotW), padLeft, pointersY - 8);
      this._pendingHint = null;
    }

    // ---- 累加值面板 ----
    // 画布矮/窄时缩小面板，保证不压到底部说明
    const panelH = compact ? 32 : 42;
    const panelY = pointersY + (compact ? 22 : 30);
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
        ctx.fillRect(px, panelY, panelW, panelH);
        ctx.fillStyle = '#8a93a6';
        ctx.font = compact ? '9px system-ui, sans-serif' : '10px system-ui, sans-serif';
        ctx.fillText(this._fitText(key, panelW - 12), px + 9, panelY + 4);
        ctx.fillStyle = '#6ea8fe';
        ctx.font = `bold ${compact ? 12 : 14}px ui-monospace, Consolas, monospace`;
        ctx.fillText(this._fitText(String(item.value), panelW - 12), px + 9, panelY + (compact ? 15 : 20));
        px += panelW + 8;
      }
    }

    // ---- 底部说明 ----
    const noteY = panelY + (compact ? 40 : 52);
    // 说明文字按可用宽度截断（原来写死 slice(0,78)，窄画布照样溢出）
    const noteFont = compact ? '10px system-ui, sans-serif' : '12px system-ui, sans-serif';
    if (this.lastCheckNote) {
      ctx.fillStyle = this.checkOk === false ? '#f0a89b' : '#a9e3c3';
      ctx.font = noteFont;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(this._fitText(this.lastCheckNote, contentW), padLeft, noteY);
    } else if (this.lastNote) {
      ctx.fillStyle = '#8a93a6';
      ctx.font = noteFont;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(this._fitText(this.lastNote, contentW), padLeft, noteY);
    }

    this._drawProgressBar(padLeft, plotW);
  }
}
