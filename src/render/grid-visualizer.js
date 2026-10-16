/**
 * 网格渲染器：用于 BFS / DFS 寻路。
 *
 * 同样的原则 —— 它不认识「BFS」或「DFS」，
 * 只认识 enqueue / visit / cameFrom / path / current 这几种动作。
 *
 * 动画上，BFS 和 DFS 的差别会非常明显：
 *   BFS 是一圈圈规则地向外扩散（因为用队列）
 *   DFS 是一条线窜到底再回头（因为用栈）
 * 这正是「队列 vs 栈」最直观的教学画面。
 */

import { BaseVisualizer, COLORS } from './base.js';
import { GridOp } from '../algorithms/tracer.js';

export class GridVisualizer extends BaseVisualizer {
  _resetState() {
    const result = this._result;
    // 构造阶段还没 load 数据时 result 是 undefined，全部字段都要有空的兜底值
    this.grid = ((result && result.grid) || []).map((r) => r.slice());
    this.rows = this.grid.length;
    this.cols = this.grid[0] ? this.grid[0].length : 0;
    this.meta = (result && result.meta) || {};
    this.start = this.meta.start || [0, 0];
    this.end = this.meta.end || [this.rows - 1, this.cols - 1];

    /** 已访问的格子 */
    this.visited = new Set();
    /** 在队列/栈里等待访问的格子（frontier） */
    this.frontier = new Set();
    /** 记录来路，用于画「上一格 → 这一格」的搜索树 */
    this.cameFrom = new Map();
    /** 最终路径 */
    this.pathSet = new Set();
    /** 当前正在考察的格子 */
    this.currentCell = null;
  }

  static key(r, c) { return `${r},${c}`; }

  _applyOp(op) {
    const k = (cell) => GridVisualizer.key(cell[0], cell[1]);
    switch (op.type) {
      case GridOp.ENQUEUE:
        this.frontier.add(k(op.cell));
        break;

      case GridOp.VISIT:
        this.frontier.delete(k(op.cell));
        this.visited.add(k(op.cell));
        break;

      case GridOp.CAME_FROM:
        this.cameFrom.set(k(op.cell), op.from);
        break;

      case GridOp.CURRENT:
        this.currentCell = op.cell;
        break;

      case GridOp.PATH:
        this.pathSet.add(k(op.cell));
        break;

      default:
        break;
    }
  }

  draw() {
    const { ctx } = this;
    const { W, H } = this._clear();

    if (this.rows === 0 || this.cols === 0) {
      this._drawCenteredText('没有网格数据');
      return;
    }

    const padding = { top: 52, right: 20, bottom: 34, left: 20 };
    const availW = W - padding.left - padding.right;
    const availH = H - padding.top - padding.bottom;

    // 格子取正方形：用宽高两个约束里更小的那个
    const cellSize = Math.max(4, Math.floor(Math.min(availW / this.cols, availH / this.rows)));
    const gridW = cellSize * this.cols;
    const gridH = cellSize * this.rows;
    const originX = padding.left + Math.floor((availW - gridW) / 2);
    const originY = padding.top + Math.floor((availH - gridH) / 2);

    const gap = cellSize > 8 ? 1 : 0;

    // ---- 标题与说明 ----
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#e6ebf5';
    ctx.fillText(this.meta.title || '路径查找', padding.left, 14);

    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#8a93a6';
    ctx.fillText(
      `已访问 ${this.visited.size} 格 · 待访问 ${this.frontier.size} 格` +
      (this.pathSet.size > 0 ? ` · 路径长度 ${this.pathSet.size}` : ''),
      padding.left, 33
    );

    const startKey = GridVisualizer.key(this.start[0], this.start[1]);
    const endKey = GridVisualizer.key(this.end[0], this.end[1]);

    // ---- 画格子 ----
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const k = GridVisualizer.key(r, c);
        const x = originX + c * cellSize;
        const y = originY + r * cellSize;
        const size = cellSize - gap;

        let fill;
        if (this.grid[r][c] === 0) {
          fill = COLORS.wall; // 墙
        } else if (this.pathSet.has(k)) {
          fill = COLORS.path; // 最终路径
        } else if (k === startKey) {
          fill = COLORS.start;
        } else if (k === endKey) {
          fill = COLORS.end;
        } else if (this.visited.has(k)) {
          fill = COLORS.visited; // 已访问
        } else if (this.frontier.has(k)) {
          fill = COLORS.frontier; // 待访问（frontier）
        } else {
          fill = COLORS.open; // 空地
        }

        // 当前考察点用白框强调
        if (this.currentCell && this.currentCell[0] === r && this.currentCell[1] === c) {
          fill = '#ffffff';
        }

        ctx.fillStyle = fill;
        ctx.fillRect(x, y, size, size);

        // 从 frontier 到已访问的格子之间画一条细线，呈现搜索树
        const from = this.cameFrom.get(k);
        if (from && cellSize >= 8) {
          ctx.strokeStyle = this.pathSet.has(k) ? 'rgba(255,255,255,0.5)' : 'rgba(110,168,254,0.35)';
          ctx.lineWidth = this.pathSet.has(k) ? Math.max(2, cellSize * 0.16) : 1;
          ctx.beginPath();
          ctx.moveTo(originX + from[1] * cellSize + size / 2, originY + from[0] * cellSize + size / 2);
          ctx.lineTo(x + size / 2, y + size / 2);
          ctx.stroke();
        }
      }
    }

    // ---- 起终点标记 ----
    if (cellSize >= 14) {
      ctx.font = `${Math.max(9, Math.floor(cellSize * 0.5))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0f1420';
      const sx = originX + this.start[1] * cellSize + (cellSize - gap) / 2;
      const sy = originY + this.start[0] * cellSize + (cellSize - gap) / 2;
      const ex = originX + this.end[1] * cellSize + (cellSize - gap) / 2;
      const ey = originY + this.end[0] * cellSize + (cellSize - gap) / 2;
      ctx.fillText('S', sx, sy);
      ctx.fillText('E', ex, ey);
    }

    // ---- 图例 ----
    const legendY = originY + gridH + 10;
    const items = [
      ['起点', COLORS.start],
      ['终点', COLORS.end],
      ['已访问', COLORS.visited],
      ['待访问', COLORS.frontier],
      ['路径', COLORS.path],
      ['墙', COLORS.wall],
    ];
    let lx = originX;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (const [label, color] of items) {
      ctx.fillStyle = color;
      ctx.fillRect(lx, legendY, 10, 10);
      ctx.fillStyle = '#8a93a6';
      ctx.fillText(label, lx + 14, legendY + 5);
      lx += 14 + ctx.measureText(label).width + 16;
      if (lx > originX + gridW - 60) break; // 放不下就不画了
    }

    // 结束时给一句结论
    if (this.finished && this.pathSet.size > 0) {
      ctx.fillStyle = '#3fb27f';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`✓ 找到路径，长度 ${this.pathSet.size} 步`, padding.left, H - 8);
    } else if (this.finished) {
      ctx.fillStyle = '#e8563f';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('✗ 起点到终点不可达', padding.left, H - 8);
    }

    this._drawProgressBar(padding.left, availW);
  }
}
