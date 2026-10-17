/**
 * 图 / 树渲染器。
 *
 * 用于图论算法（图的存储、Dijkstra、拓扑排序、Kruskal）与 Trie。
 *
 * 它同样不认识具体算法，只认识 node / edge / frontier / visit / current /
 * relax / selectEdge / rejectEdge / label / note 这些动作。
 *
 * 坐标由算法以 0~1 归一化值给出，渲染器按画布尺寸缩放并留出内边距 ——
 * 这样算法层完全不需要知道画布多大。
 */

import { BaseVisualizer, COLORS } from './base.js';
import { GraphOp } from '../algorithms/tracer.js';

const NODE_R = 17;          // 节点半径（会在窄屏下缩小）
const PADDING = { top: 62, right: 30, bottom: 58, left: 30 };

/** 边的状态配色 */
const EDGE_COLORS = {
  normal: 'rgba(120, 150, 200, 0.34)',
  relaxOk: '#f2b134',      // 松弛成功
  relaxNo: 'rgba(120, 150, 200, 0.22)', // 松弛失败（淡化）
  selected: '#3fb27f',     // MST 选中
  rejected: 'rgba(232, 86, 63, 0.45)',  // MST 丢弃
};

export class GraphVisualizer extends BaseVisualizer {
  _resetState() {
    const result = this._result;
    this.meta = (result && result.meta) || {};
    /** 节点：id → { id, label, x, y } */
    this.nodes = new Map();
    /** 边列表 */
    this.edges = [];
    /** 已声明过的边（去重用） */
    this._edgeKeys = new Set();
    /** 各类状态集合 */
    this.frontier = new Set();
    this.visited = new Set();
    this.currentNode = null;
    /** 边上的一次性状态：'relaxOk' | 'relaxNo' | 'selected' | 'rejected' */
    this.edgeState = new Map();   // key: `${from}-${to}` （无向边两个方向都记）
    /** 节点上的标签：id → value（距离、入度等） */
    this.labels = new Map();
    this.lastNote = '';
    this.lastDetail = '';
    this.lastOk = null;
  }

  static ek(a, b) { return a < b ? `${a}-${b}` : `${b}-${a}`; }

  _applyOp(op) {
    switch (op.type) {
      case GraphOp.NODE:
        this.nodes.set(op.id, { id: op.id, label: op.label, x: op.x, y: op.y });
        break;

      case GraphOp.EDGE: {
        // 去重：同一条边可能被声明多次（如 Trie 里重复走过的分支），
        // 重复画会叠出粗细不一的线。无向边按无序对去重。
        const key = op.directed
          ? `${op.from}->${op.to}`
          : GraphVisualizer.ek(op.from, op.to);
        if (!this._edgeKeys) this._edgeKeys = new Set();
        if (this._edgeKeys.has(key)) break;
        this._edgeKeys.add(key);
        this.edges.push({ from: op.from, to: op.to, weight: op.weight, directed: op.directed });
        break;
      }

      case GraphOp.FRONTIER:
        this.frontier.add(op.id);
        if (op.note) this.lastNote = op.note;
        break;

      case GraphOp.VISIT:
        this.frontier.delete(op.id);
        this.visited.add(op.id);
        if (op.note) this.lastNote = op.note;
        break;

      case GraphOp.CURRENT:
        this.currentNode = op.id;
        break;

      case GraphOp.RELAX:
        // 只保留最近一次松弛的高亮，避免画面全是黄线
        for (const [k, v] of this.edgeState) {
          if (v === 'relaxOk' || v === 'relaxNo') this.edgeState.delete(k);
        }
        this.edgeState.set(GraphVisualizer.ek(op.from, op.to), op.ok ? 'relaxOk' : 'relaxNo');
        this.lastDetail = op.note || '';
        this.lastOk = op.ok;
        break;

      case GraphOp.SELECT_EDGE:
        this.edgeState.set(GraphVisualizer.ek(op.from, op.to), 'selected');
        if (op.note) this.lastNote = op.note;
        break;

      case GraphOp.REJECT_EDGE:
        this.edgeState.set(GraphVisualizer.ek(op.from, op.to), 'rejected');
        if (op.note) this.lastDetail = op.note;
        break;

      case GraphOp.LABEL:
        this.labels.set(op.id, op.value);
        break;

      case GraphOp.NOTE:
        this.lastNote = op.note || '';
        break;

      default:
        break;
    }
  }

  draw() {
    const { ctx } = this;
    const { W, H } = this._clear();

    if (this.nodes.size === 0) {
      this._drawCenteredText('没有图数据');
      return;
    }

    // ---- 标题与说明 ----
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#e6ebf5';
    ctx.fillText(this.meta.title || '图算法', PADDING.left, 13);

    if (this.meta.explain) {
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#8a93a6';
      const ex = this.meta.explain.length > 74 ? this.meta.explain.slice(0, 74) + '…' : this.meta.explain;
      ctx.fillText(ex, PADDING.left, 32);
    }

    // ---- 坐标换算：归一化 → 像素 ----
    const plotW = W - PADDING.left - PADDING.right;
    const plotH = H - PADDING.top - PADDING.bottom;
    const R = Math.max(11, Math.min(NODE_R, plotW / 14, plotH / 8));

    const px = (x) => PADDING.left + (x ?? 0.5) * plotW;
    const py = (y) => PADDING.top + (y ?? 0.5) * plotH;

    // ---- 先画边（在节点下层）----
    for (const e of this.edges) {
      const a = this.nodes.get(e.from);
      const b = this.nodes.get(e.to);
      if (!a || !b) continue;

      const x1 = px(a.x), y1 = py(a.y);
      const x2 = px(b.x), y2 = py(b.y);
      const state = this.edgeState.get(GraphVisualizer.ek(e.from, e.to)) || 'normal';

      // 无向边只画一次（避免两条线重叠）
      if (!e.directed && e.from > e.to) continue;

      ctx.strokeStyle = EDGE_COLORS[state] || EDGE_COLORS.normal;
      ctx.lineWidth = state === 'selected' ? 3.5
        : state === 'relaxOk' ? 3
          : state === 'rejected' ? 1.5 : 2;

      // 线从圆边开始画，不要盖住圆心
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const sx = x1 + ux * R, sy = y1 + uy * R;
      const ex2 = x2 - ux * (R + (e.directed ? 7 : 0));
      const ey2 = y2 - uy * (R + (e.directed ? 7 : 0));

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex2, ey2);
      ctx.stroke();

      // 有向边画箭头
      if (e.directed) {
        const ah = 8;
        ctx.fillStyle = EDGE_COLORS[state] || EDGE_COLORS.normal;
        ctx.beginPath();
        ctx.moveTo(x2 - ux * R, y2 - uy * R);
        ctx.lineTo(ex2 - uy * ah * 0.6 - ux * ah, ey2 + ux * ah * 0.6 - uy * ah);
        ctx.lineTo(ex2 + uy * ah * 0.6 - ux * ah, ey2 - ux * ah * 0.6 - uy * ah);
        ctx.closePath();
        ctx.fill();
      }

      // 权值标签画在线中点（稍微偏移，避免压线）
      if (e.weight && e.weight !== 1 && state !== 'rejected') {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const label = String(e.weight);
        ctx.font = 'bold 11px ui-monospace, Consolas, monospace';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
        this._roundRect(mx - tw / 2 - 5, my - 9, tw + 10, 18, 5);
        ctx.fill();
        ctx.fillStyle = state === 'relaxOk' ? '#f2b134' : '#9fb0c8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mx, my);
      }
    }

    // ---- 再画节点 ----
    for (const node of this.nodes.values()) {
      const cx = px(node.x);
      const cy = py(node.y);

      const isCurrent = this.currentNode === node.id;
      const isVisited = this.visited.has(node.id);
      const isFrontier = this.frontier.has(node.id);

      // 底色
      let fill = '#233048';
      let stroke = 'rgba(140, 170, 220, 0.4)';
      if (isFrontier) { fill = '#4a3d1c'; stroke = COLORS.compare; }
      if (isVisited) { fill = '#1e3f36'; stroke = COLORS.sorted; }
      if (isCurrent) { fill = '#3a2f52'; stroke = COLORS.pivot; }

      // 当前节点加一圈光晕
      if (isCurrent) {
        ctx.beginPath();
        ctx.arc(cx, cy, R + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(160, 108, 213, 0.18)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = isCurrent ? 3 : 2;
      ctx.stroke();

      // 节点标签（点号或字符）
      ctx.fillStyle = '#e8eef9';
      const size = node.label && node.label.length > 2 ? Math.max(9, R * 0.62) : Math.max(11, R * 0.8);
      ctx.font = `${size}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(node.label ?? node.id), cx, cy);

      // 节点上的附加标签（距离 / 入度），画在圆下方
      if (this.labels.has(node.id)) {
        const val = this.labels.get(node.id);
        const text = val === Infinity ? '∞' : String(val);
        ctx.font = 'bold 11px ui-monospace, Consolas, monospace';
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(10, 15, 26, 0.92)';
        this._roundRect(cx - tw / 2 - 6, cy + R + 3, tw + 12, 19, 5);
        ctx.fill();
        ctx.strokeStyle = isVisited ? COLORS.sorted : 'rgba(140, 170, 220, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = isVisited ? '#8fe3c4' : '#cfd8e8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy + R + 12.5);
      }
    }

    // ---- 底部说明 ----
    const noteY = H - PADDING.bottom + 12;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (this.lastDetail) {
      ctx.fillStyle = this.lastOk === false ? '#f0a89b' : '#f2b134';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(this.lastDetail.slice(0, 82), PADDING.left, noteY);
    }
    if (this.lastNote) {
      ctx.fillStyle = '#8a93a6';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(this.lastNote.slice(0, 90), PADDING.left, noteY + 20);
    }

    this._drawProgressBar(PADDING.left, plotW);
  }
}
