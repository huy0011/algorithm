/**
 * 数据结构渲染器：栈 / 队列。
 *
 * 把「后进先出」和「先进先出」画成看得见的样子：
 *   栈  → 竖着摞起来，从顶部进出
 *   队列 → 横着排开，从尾进、从头出
 *
 * 同样不认识具体算法，只认识 push / pop / dequeue / peek / result 几种动作。
 */

import { BaseVisualizer, COLORS } from './base.js';
import { StructOp } from '../algorithms/tracer.js';

export class StructureVisualizer extends BaseVisualizer {
  _resetState() {
    const result = this._result;
    // 构造阶段还没 load 数据时 result 是 undefined，全部字段都要有空的兜底值
    this.meta = (result && result.meta) || {};
    this.structureType = this.meta.structureType || 'stack';
    /** 当前结构里的元素（按逻辑顺序：栈底→栈顶，或队头→队尾） */
    this.items = [];
    /** 刚被操作的元素，用于高亮 */
    this.recent = null;
    this.recentKind = null;
    /** 最近一次结果提示 */
    this.resultNote = '';
    this.resultOk = null;
    this.peekValue = undefined;
    /** 已处理的输入位置（由算法 PROGRESS 指定） */
    this.processedCount = 0;
    this.processedIndex = -1;
  }

  _applyOp(op) {
    // 每消费一个输入（入栈一个左括号、处理一个右括号、一个任务），计数前进
    if (op.type === StructOp.PUSH || op.type === StructOp.POP
      || op.type === StructOp.DEQUEUE || op.type === StructOp.PEEK) {
      this.processedCount++;
    }
    switch (op.type) {
      case StructOp.PUSH:
        this.items.push(op.value);
        this.recent = this.items.length - 1;
        this.recentKind = 'push';
        this.resultNote = op.note || '';
        break;

      case StructOp.POP:
        // 栈顶就是数组末尾
        this.items.pop();
        this.recent = null;
        this.recentKind = 'pop';
        this.resultNote = op.note || '';
        break;

      case StructOp.DEQUEUE:
        // 队头就是数组开头
        this.items.shift();
        this.recent = null;
        this.recentKind = 'dequeue';
        this.resultNote = op.note || '';
        break;

      case StructOp.PEEK:
        this.peekValue = op.value;
        this.recentKind = 'peek';
        this.resultNote = op.note || '';
        break;

      case StructOp.PROGRESS:
        this.processedIndex = op.index;
        break;

      case StructOp.RESULT:
        this.resultNote = op.note || '';
        this.resultOk = op.ok;
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
    const isStack = this.structureType === 'stack';

    // ---- 标题 ----
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#e6ebf5';
    ctx.fillText(this.meta.title || (isStack ? '栈（后进先出）' : '队列（先进先出）'), 16, 14);

    if (this.meta.explain) {
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#8a93a6';
      ctx.fillText(this.meta.explain, 16, 33);
    }

    // ---- 待处理的字符串：画成一排格子，高亮当前字符 ----
    // 格子宽度按可用宽度反算，不再固定 20px 下限 ——
    // 输入较长时（如 14 个括号）20px 会撑出画布右边被裁掉。
    if (this.meta.text) {
      const text = String(this.meta.text);
      const avail = W - 32;                       // 左右各留 16
      const gap = text.length > 12 ? 2 : 4;
      const chW = Math.max(10, Math.min(34, avail / text.length - gap));
      const chH = Math.max(22, Math.min(30, chW * 1.6));
      const startY = 56;
      const totalW = text.length * (chW + gap);
      const cx = Math.max(16, (W - totalW) / 2);

      for (let i = 0; i < text.length; i++) {
        const x = cx + i * (chW + gap);
        const processed = i <= this.processedIndex;
        const isCurrent = i === this.processedIndex;

        ctx.fillStyle = isCurrent ? COLORS.compare
          : processed ? 'rgba(60, 72, 96, 0.6)'
            : '#26304a';
        this._roundRect(x, startY, chW, chH, 4);
        ctx.fill();
        if (isCurrent) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = isCurrent ? '#0f1420' : processed ? 'rgba(230,235,245,0.4)' : '#e6ebf5';
        // 字号跟着格子缩放，太窄就不画（总比糊成一团好）
        const fs = Math.min(14, chW * 0.75);
        if (fs >= 7) {
          ctx.font = `bold ${fs}px ui-monospace, Consolas, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text[i], x + chW / 2, startY + chH / 2);
        }
      }
      void cx;
    }

    const areaTop = 102;
    const areaH = H - areaTop - 70;

    if (isStack) {
      this._drawStack(areaTop, areaH, W);
    } else {
      this._drawQueue(areaTop, areaH, W);
    }

    // ---- 结果提示 ----
    if (this.resultNote) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '12px system-ui, sans-serif';
      if (this.resultOk === true) ctx.fillStyle = '#3fb27f';
      else if (this.resultOk === false) ctx.fillStyle = '#e8563f';
      else ctx.fillStyle = '#8a93a6';
      ctx.fillText(this.resultNote, 16, H - 46);
    }

    // ---- 结论徽标 ----
    if (this.finished && this.resultOk !== null) {
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = this.resultOk ? '#3fb27f' : '#e8563f';
      ctx.fillText(this.resultOk ? '✓ 演示完成：判定通过' : '✗ 演示完成：判定不通过', 16, H - 12);
    }

    this._drawProgressBar(16, W - 32);
  }

  /** 栈：从下往上摞，顶部开口。 */
  _drawStack(areaTop, areaH, W) {
    const { ctx } = this;
    const boxW = Math.min(180, W * 0.3);
    const boxH = 40;
    const gap = 6;
    const cx = W / 2 - boxW / 2;
    const baseY = areaTop + areaH - boxH;

    // 画一个「容器」的底和两侧，暗示只在顶部进出
    ctx.strokeStyle = 'rgba(74,127,212,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const containerH = Math.min(areaH, boxH * 6 + gap * 5 + 20);
    const topY = baseY + boxH - containerH;
    ctx.moveTo(cx - 14, topY);
    ctx.lineTo(cx - 14, baseY + boxH);
    ctx.lineTo(cx + boxW + 14, baseY + boxH);
    ctx.lineTo(cx + boxW + 14, topY);
    ctx.stroke();

    // 从栈底往上画
    this.items.forEach((value, i) => {
      const y = baseY - i * (boxH + gap);
      const isTop = i === this.items.length - 1;
      const isRecent = i === this.recent;

      let fill = isTop ? '#3f6ea8' : '#26304a';
      if (isRecent && this.recentKind === 'push') fill = COLORS.swap;

      ctx.fillStyle = fill;
      this._roundRect(cx, y, boxW, boxH, 6);
      ctx.fill();

      if (isTop) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 值
      ctx.fillStyle = '#e6ebf5';
      ctx.font = '15px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(value), cx + boxW / 2, y + boxH / 2);

      // 标注栈顶：右侧放不下就改画在容器内侧，避免被画布右边缘裁掉
      if (isTop) {
        const label = '← 栈顶';
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = '#f2b134';
        const tw = ctx.measureText(label).width;
        const rightSpace = W - (cx + boxW + 14);
        ctx.textBaseline = 'middle';
        if (rightSpace > tw + 8) {
          ctx.textAlign = 'left';
          ctx.fillText(label, cx + boxW + 20, y + boxH / 2);
        } else {
          // 空间不足：画在容器内部左上方
          ctx.textAlign = 'center';
          ctx.fillText(label, cx + boxW / 2, y - 10);
        }
      }
    });

    // 空栈提示
    if (this.items.length === 0) {
      ctx.fillStyle = '#8a93a6';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('（空栈）', W / 2, areaTop + areaH / 2);
    }

    // 底部标注
    if (this.items.length > 0) {
      ctx.fillStyle = '#8a93a6';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('栈底（最先放入，最后取出）', cx - 14, baseY + boxH + 8);
    }
  }

  /** 队列：横向排列，左边队头，右边队尾。 */
  _drawQueue(areaTop, areaH, W) {
    const { ctx } = this;
    // 队宽按元素个数自适应：原来固定 96px，4 个元素就要 416px，
    // 在 346px 的手机画布上直接溢出到画布外（x 到 428）。
    const n = Math.max(1, this.items.length);
    const avail = W - 40;
    const gap = n > 5 ? 4 : 8;
    const boxW = Math.max(28, Math.min(96, avail / n - gap));
    const boxH = Math.max(34, Math.min(52, boxW * 0.55));
    const totalW = n * (boxW + gap) - gap;
    const startX = Math.max(20, (W - totalW) / 2);
    const y = areaTop + areaH / 2 - boxH / 2;

    // 容器：一条横贯的通道
    ctx.strokeStyle = 'rgba(74,127,212,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, y - 14);
    ctx.lineTo(W - 20, y - 14);
    ctx.moveTo(20, y + boxH + 14);
    ctx.lineTo(W - 20, y + boxH + 14);
    ctx.stroke();

    // 从队头往右画
    this.items.forEach((value, i) => {
      const x = startX + i * (boxW + gap);
      const isHead = i === 0;
      const isRecent = i === this.recent;

      let fill = isHead ? '#3f6ea8' : '#26304a';
      if (isRecent && this.recentKind === 'push') fill = COLORS.swap;

      ctx.fillStyle = fill;
      this._roundRect(x, y, boxW, boxH, 6);
      ctx.fill();

      if (isHead) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 值（可能是中文任务名，按长度调整字号）
      ctx.fillStyle = '#e6ebf5';
      const text = String(value);
      const fontSize = Math.min(14, Math.max(10, Math.floor(boxW / (text.length * 0.75))));
      ctx.font = `${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + boxW / 2, y + boxH / 2);

      // 队头 / 队尾标注
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (isHead && this.items.length > 0) {
        ctx.fillStyle = '#3fb27f';
        ctx.fillText('↑ 队头（从这里取出）', x + boxW / 2, y + boxH + 20);
      }
    });

    if (this.items.length > 0) {
      const tailX = startX + (this.items.length - 1) * (boxW + gap) + boxW / 2;
      ctx.fillStyle = '#f2b134';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('↑ 队尾（新任务从这里进）', tailX, y - 34);
    }

    if (this.items.length === 0) {
      ctx.fillStyle = '#8a93a6';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('（空队列）', W / 2, areaTop + areaH / 2);
    }
  }
}
