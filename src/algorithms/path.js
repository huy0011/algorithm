/**
 * 网格寻路：BFS（广度优先）与 DFS（深度优先）。
 *
 * 这是一类与排序完全不同的可视化 —— 数据不再是「一排柱子」，而是「一张网格」。
 * 但设计原则不变：算法只产出操作序列，渲染层只播放序列。
 *
 * BFS 与 DFS 的差别在动画上一目了然：
 *   BFS 一圈一圈向外扩散（队列，先来先服务）
 *   DFS 一路走到底再回头（栈，后来先服务）
 * 这正是「队列 vs 栈」最直观的教学演示。
 */

import { GridTracer } from './tracer.js';

/** 生成网格地图。1 = 可走，0 = 墙。 */
export function generateGrid(rows, cols, wallRatio = 0.28) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(Math.random() < wallRatio ? 0 : 1);
    }
    grid.push(row);
  }

  // 起点左上、终点右下，必须保证可走
  grid[0][0] = 1;
  grid[rows - 1][cols - 1] = 1;

  // 清出一条粗糙的保底通路，避免地图完全不可达导致动画没内容可看。
  // 注意：这只是「保底」，不是最优路径，算法仍然要自己去找路。
  let r = 0;
  let c = 0;
  while (r < rows - 1 || c < cols - 1) {
    grid[r][c] = 1;
    const canRight = c < cols - 1;
    const canDown = r < rows - 1;
    if (canRight && (!canDown || Math.random() < 0.5)) c++;
    else r++;
  }
  grid[rows - 1][cols - 1] = 1;

  return grid;
}

/** 四方向邻接（上右下左）。 */
const DIRS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

/** 从 cameFrom 表回溯出完整路径。 */
function buildPath(cameFrom, start, end) {
  const key = (r, c) => `${r},${c}`;
  const path = [];
  let cur = end;
  const startKey = key(start[0], start[1]);

  // 最多回溯 rows*cols 步，防止环导致死循环
  let guard = cameFrom.size + 2;
  while (cur && guard-- > 0) {
    path.push(cur);
    const k = key(cur[0], cur[1]);
    if (k === startKey) break;
    cur = cameFrom.get(k);
  }
  return path.reverse();
}

/**
 * BFS：用队列一层层扩散，找到的一定是最短路径。
 */
function bfs(grid, options = {}) {
  const rows = grid.length;
  const cols = grid[0].length;
  const start = options.start ?? [0, 0];
  const end = options.end ?? [rows - 1, cols - 1];

  const t = new GridTracer(grid, { start, end, title: '广度优先搜索 BFS' });
  const key = (r, c) => `${r},${c}`;

  const visited = new Set([key(start[0], start[1])]);
  const cameFrom = new Map();
  /** 用数组 + 头指针模拟队列，避免 shift() 的 O(n) 开销 */
  const queue = [start];
  let head = 0;

  t.enqueue(start[0], start[1]);

  while (head < queue.length) {
    const [r, c] = queue[head++];
    t.visit(r, c);
    t.current(r, c);

    if (r === end[0] && c === end[1]) {
      // 找到终点，回溯路径
      const path = buildPath(cameFrom, start, end);
      t.path(path);
      return t.result();
    }

    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!t.passable(nr, nc)) continue;
      const nk = key(nr, nc);
      if (visited.has(nk)) continue;
      visited.add(nk);
      cameFrom.set(nk, [r, c]);
      t.cameFrom(nr, nc, r, c);
      t.enqueue(nr, nc);
      queue.push([nr, nc]);
    }
  }

  // 队列空了还没到终点 → 不可达
  t.current(end[0], end[1]);
  return t.result();
}

/**
 * DFS：用栈一路走到底，撞墙再回头。
 * 注意：DFS 找到的路径不保证最短，这一点在动画上很直观。
 */
function dfs(grid, options = {}) {
  const rows = grid.length;
  const cols = grid[0].length;
  const start = options.start ?? [0, 0];
  const end = options.end ?? [rows - 1, cols - 1];

  const t = new GridTracer(grid, { start, end, title: '深度优先搜索 DFS' });
  const key = (r, c) => `${r},${c}`;

  const visited = new Set();
  const cameFrom = new Map();
  const stack = [start];

  t.enqueue(start[0], start[1]);

  while (stack.length > 0) {
    const [r, c] = stack.pop();
    const k = key(r, c);
    if (visited.has(k)) continue;
    visited.add(k);

    t.visit(r, c);
    t.current(r, c);

    if (r === end[0] && c === end[1]) {
      const path = buildPath(cameFrom, start, end);
      t.path(path);
      return t.result();
    }

    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!t.passable(nr, nc)) continue;
      const nk = key(nr, nc);
      if (visited.has(nk)) continue;
      // 只要还没记录过来源就记下（保留第一次到达的路径）
      if (!cameFrom.has(nk)) {
        cameFrom.set(nk, [r, c]);
        t.cameFrom(nr, nc, r, c);
      }
      t.enqueue(nr, nc);
      stack.push([nr, nc]);
    }
  }

  t.current(end[0], end[1]);
  return t.result();
}

export const PATH_ALGORITHMS = {
  bfs: {
    id: 'bfs',
    name: '广度优先搜索',
    en: 'BFS',
    category: 'path',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    blurb: '用队列一层层向外扩散，像水波一样。因为均匀扩散，找到的一定是最短路径。',
    inputKind: 'grid',
    run: bfs,
    syntaxTopics: ['array-as-queue', 'set-map', 'destructuring'],
  },
  dfs: {
    id: 'dfs',
    name: '深度优先搜索',
    en: 'DFS',
    category: 'path',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    blurb: '用栈一路走到底，撞墙才回头。注意它找到的路径通常不是最短的 —— 这正是与 BFS 的核心差别。',
    inputKind: 'grid',
    run: dfs,
    syntaxTopics: ['array-as-stack', 'set-map', 'recursion-vs-stack'],
  },
};
