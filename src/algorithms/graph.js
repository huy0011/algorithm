/**
 * 图论算法：图的存储、Dijkstra 最短路、拓扑排序、最小生成树（Kruskal）。
 *
 * 这类算法和排序/查找有个本质区别：
 *   数据不是「一排格子」，而是「点 + 边」的网络。
 * 所以它们用 GraphTracer（记录点、边、访问、松弛），
 * 由 graph 渲染器画成网络图。
 *
 * 所有坐标都用 0~1 归一化值，算法层不知道画布多大 ——
 * 这是「算法不认识渲染」这条约定的具体体现。
 */

import { GraphTracer } from './tracer.js';

/**
 * 生成一张用于演示的有权无向图。
 * 点的位置手工安排（比圆形排布更能看清结构），坐标是归一化的。
 */
export function makeWeightedGraph(seed = 0) {
  // 6 个点的固定布局，故意让边交叉少一点，看着清楚
  const layouts = [
    [
      { id: 0, x: 0.14, y: 0.22 }, { id: 1, x: 0.50, y: 0.10 },
      { id: 2, x: 0.86, y: 0.24 }, { id: 3, x: 0.20, y: 0.78 },
      { id: 4, x: 0.54, y: 0.60 }, { id: 5, x: 0.86, y: 0.80 },
    ],
    [
      { id: 0, x: 0.12, y: 0.50 }, { id: 1, x: 0.36, y: 0.16 },
      { id: 2, x: 0.66, y: 0.16 }, { id: 3, x: 0.88, y: 0.50 },
      { id: 4, x: 0.62, y: 0.84 }, { id: 5, x: 0.30, y: 0.84 },
    ],
  ];
  const pos = layouts[seed % layouts.length];

  // 边：(u, v, 权值)
  const edgeSets = [
    [[0, 1, 4], [0, 3, 2], [1, 2, 5], [1, 4, 3], [2, 5, 6], [3, 4, 1], [4, 5, 7]],
    [[0, 1, 3], [1, 2, 2], [2, 3, 4], [3, 4, 1], [4, 5, 5], [5, 0, 6], [1, 4, 8]],
  ];
  const edges = edgeSets[seed % edgeSets.length];

  return { nodes: pos, edges };
}

/**
 * 图的存储方式：邻接矩阵 vs 邻接表。
 *
 * 这是理解所有图论算法的前提 —— 先看清楚图在内存里长什么样，
 * 后面 Dijkstra、拓扑排序为什么这么写就顺理成章了。
 */
function graphStorage(input, options = {}) {
  const g = options.graph ?? makeWeightedGraph(0);
  const n = g.nodes.length;

  const t = new GraphTracer({
    title: '图的存储 · 邻接矩阵与邻接表',
    explain: '同一个图有两种存法：邻接矩阵用 n×n 表格（查询 O(1)、占 O(n²) 空间）；邻接表只存存在的边（省空间、遍历邻居快）。',
    layout: 'manual',
  });

  // 声明点
  for (const node of g.nodes) t.addNode(node.id, String(node.id), node.x, node.y);

  // ---- 阶段一：邻接矩阵 ----
  t.note(`第一步：建立 ${n}×${n} 的邻接矩阵，初始全为 0（或无穷大表示不通）`);
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));

  for (const [u, v, w] of g.edges) {
    // 无向图：两个方向都要写
    matrix[u][v] = w;
    matrix[v][u] = w;
    t.addEdge(u, v, w, false);
    t.relax(u, v, w, true, `矩阵[${u}][${v}] = 矩阵[${v}][${u}] = ${w}`);
  }
  t.note('邻接矩阵建好了。代价：即使只有 7 条边，也开了 36 个格子');

  // ---- 阶段二：邻接表 ----
  t.note('第二步：建立邻接表 —— 每个点只记录自己真正相连的邻居');
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of g.edges) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  for (let u = 0; u < n; u++) {
    t.visit(u, `点 ${u} 的邻居：${adj[u].map(([v, w]) => `${v}(权${w})`).join('、') || '无'}`);
  }

  const matrixCells = n * n;
  const adjCells = g.edges.length * 2;
  t.note(
    `对比：邻接矩阵 ${matrixCells} 个格子，邻接表 ${adjCells} 条记录。` +
    `点越多差距越大 —— 稀疏图必须用邻接表。`
  );

  return { tracer: t, matrix, adj, matrixCells, adjCells };
}

/**
 * Dijkstra 最短路（贪心 + 松弛）。
 *
 * 核心动作只有两个，动画上一目了然：
 *   1. 从「未确定的点」里挑距离最小的那个，确定它（visit）
 *   2. 用它去松弛所有邻居（relax）—— 距离能变小就更新
 */
function dijkstra(input, options = {}) {
  const g = options.graph ?? makeWeightedGraph(0);
  const start = options.start ?? 0;
  const n = g.nodes.length;

  const t = new GraphTracer({
    title: `Dijkstra 最短路 · 从点 ${start} 出发`,
    explain: '每轮从未确定的点里挑距离最小的「定下来」，再用它去更新邻居。每轮至少确定一个点，所以最多 n 轮。',
    layout: 'manual',
    directed: false,
    weighted: true,
  });

  for (const node of g.nodes) t.addNode(node.id, String(node.id), node.x, node.y);
  for (const [u, v, w] of g.edges) t.addEdge(u, v, w, false);

  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of g.edges) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }

  const INF = Infinity;
  const dist = new Array(n).fill(INF);
  const prev = new Array(n).fill(-1);
  const done = new Array(n).fill(false);   // 是否已确定

  dist[start] = 0;
  t.label(start, 0);
  t.note(`起点 ${start} 的距离设为 0，其余为无穷大`);

  for (let round = 0; round < n; round++) {
    // ---- 1. 挑距离最小的未确定点 ----
    let u = -1;
    let best = INF;
    for (let i = 0; i < n; i++) {
      if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    }
    if (u === -1) break;   // 剩下的都不可达

    // 所有「已知非无穷距离、未确定」的点都是候选 —— 用待处理色标出
    for (let i = 0; i < n; i++) {
      if (!done[i] && dist[i] < INF) t.frontier(i);
    }

    done[u] = true;
    t.current(u);
    t.visit(u, `第 ${round + 1} 轮：确定点 ${u}（距离 ${dist[u]}）—— 这是它最终的答案`);
    t.label(u, dist[u]);

    // ---- 2. 松弛邻居 ----
    for (const [v, w] of adj[u]) {
      if (done[v]) continue;              // 已确定的不用再更新
      const nd = dist[u] + w;
      const better = nd < dist[v];
      t.relax(u, v, w, better,
        better
          ? `${dist[u]} + ${w} = ${nd} < ${dist[v] === INF ? '∞' : dist[v]}，更新点 ${v} 的距离`
          : `${dist[u]} + ${w} = ${nd} ≥ ${dist[v]}，不更新`);
      if (better) {
        dist[v] = nd;
        prev[v] = u;
        t.label(v, nd);
        t.frontier(v);                    // 距离被更新的点进入待处理集合
      }
    }
  }

  // 输出结果
  const reachable = [];
  for (let i = 0; i < n; i++) {
    if (dist[i] < INF) reachable.push(`${start}→${i}: ${dist[i]}`);
  }
  t.note(`最终结果：${reachable.join('，')}`);
  t.note('注意：Dijkstra 只适用于边权非负的图 —— 有负权边要用 Bellman-Ford。');

  return { tracer: t, dist, prev, start };
}

/**
 * 拓扑排序（Kahn 算法，基于入度）。
 * 只有有向无环图（DAG）才有拓扑序；若存在环，出队的点会少于总数。
 */
function topologicalSort(input, options = {}) {
  // 用一张有向无环图：任务依赖关系
  const edges = options.edges ?? [
    [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [2, 5], [5, 4],
  ];
  const n = options.n ?? 6;

  // 分层排布，能直观看出「谁依赖谁」
  const layer = new Array(n).fill(0);
  // 简单分层：按边的方向推一层
  for (let pass = 0; pass < n; pass++) {
    for (const [u, v] of edges) {
      if (layer[v] < layer[u] + 1) layer[v] = layer[u] + 1;
    }
  }
  const maxLayer = Math.max(...layer, 1);
  const perLayer = {};
  const nodes = [];
  for (let i = 0; i < n; i++) {
    perLayer[layer[i]] = (perLayer[layer[i]] || 0);
    const idxInLayer = perLayer[layer[i]]++;
    nodes.push({
      id: i,
      x: 0.12 + (0.76 * layer[i]) / Math.max(1, maxLayer),
      y: 0.2 + 0.6 * (idxInLayer / Math.max(1, (perLayer[layer[i]] || 1))),
    });
  }
  // 重新按层均匀分布 y
  const byLayer = {};
  for (const nd of nodes) (byLayer[layer[nd.id]] ||= []).push(nd);
  for (const key of Object.keys(byLayer)) {
    const arr = byLayer[key];
    arr.forEach((nd, i) => {
      nd.y = arr.length === 1 ? 0.5 : 0.18 + (0.64 * i) / (arr.length - 1);
    });
  }

  const t = new GraphTracer({
    title: '拓扑排序 · Kahn 算法',
    explain: '反复取出「入度为 0」的点（没有前置依赖），把它从图里删掉，并让它指向的点入度减 1。',
    layout: 'manual',
    directed: true,
  });

  for (const nd of nodes) t.addNode(nd.id, `任务${nd.id}`, nd.x, nd.y);
  for (const [u, v] of edges) t.addEdge(u, v, 1, true);

  // 算入度
  const indeg = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { indeg[v]++; adj[u].push(v); }

  for (let i = 0; i < n; i++) t.label(i, indeg[i]);
  t.note(`初始入度：${indeg.map((d, i) => `${i}:${d}`).join('，')}`);

  // 入度为 0 的入队
  const queue = [];
  for (let i = 0; i < n; i++) {
    if (indeg[i] === 0) { queue.push(i); t.frontier(i, `点 ${i} 入度为 0，可以开始`); }
  }

  const order = [];
  while (queue.length > 0) {
    const u = queue.shift();
    t.current(u);
    t.visit(u, `取出点 ${u}（当前入度 0），放进拓扑序第 ${order.length + 1} 位`);
    order.push(u);

    for (const v of adj[u]) {
      indeg[v]--;
      t.relax(u, v, 1, true, `点 ${v} 的入度减 1 → ${indeg[v]}`);
      t.label(v, indeg[v]);
      if (indeg[v] === 0) {
        queue.push(v);
        t.frontier(v, `点 ${v} 入度变 0，可以开始了`);
      }
    }
  }

  const isDag = order.length === n;
  t.note(isDag
    ? `✓ 拓扑序：${order.join(' → ')}（所有 ${n} 个点都排上了，说明无环）`
    : `✗ 只排出 ${order.length}/${n} 个点，说明图中存在环，不存在拓扑序`);

  return { tracer: t, order, isDag };
}

/**
 * 最小生成树 · Kruskal 算法。
 *
 * 把边按权值从小到大排序，依次尝试加入；
 * 如果加入后成环就丢掉（用并查集判断），否则选中。
 */
function kruskal(input, options = {}) {
  const g = options.graph ?? makeWeightedGraph(0);
  const n = g.nodes.length;

  const t = new GraphTracer({
    title: '最小生成树 · Kruskal',
    explain: '把边按权值从小到大尝试加入：不成环就选中，成环就丢弃。用并查集判断是否成环。',
    layout: 'manual',
    weighted: true,
  });

  for (const node of g.nodes) t.addNode(node.id, String(node.id), node.x, node.y);
  for (const [u, v, w] of g.edges) t.addEdge(u, v, w, false);

  // 并查集
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    parent[ra] = rb;
    return true;
  };

  // 按权值排序
  const sorted = g.edges.slice().sort((a, b) => a[2] - b[2]);
  t.note(`先把 ${sorted.length} 条边按权值排序：${sorted.map(([, , w]) => w).join(' ≤ ')}`);

  let total = 0;
  let picked = 0;
  const chosen = [];

  for (const [u, v, w] of sorted) {
    t.current(u);
    if (find(u) === find(v)) {
      t.rejectEdge(u, v, `边 ${u}–${v}（权 ${w}）的两端已连通，加入会成环 → 丢弃`);
      continue;
    }
    union(u, v);
    chosen.push([u, v, w]);
    total += w;
    picked++;
    t.selectEdge(u, v, `边 ${u}–${v}（权 ${w}）加入，当前总权值 ${total}`);
    if (picked === n - 1) break;   // 已经 n-1 条边，树建好了
  }

  const okCount = picked === n - 1;
  t.note(okCount
    ? `✓ 最小生成树完成：${picked} 条边，总权值 ${total}`
    : `✗ 只选出 ${picked} 条边（需要 ${n - 1} 条），图不连通`);

  return { tracer: t, chosen, total, edgesNeeded: n - 1, ok: okCount };
}

export const GRAPH_ALGORITHMS = {
  graphStorage: {
    id: 'graphStorage',
    name: '图的存储',
    en: 'Graph Storage',
    category: 'graph',
    complexity: { time: 'O(V²) 矩阵 / O(V+E) 表', space: 'O(V²) / O(V+E)' },
    blurb: '邻接矩阵查询快但费空间；邻接表省空间、遍历邻居快。稀疏图必须用邻接表。',
    inputKind: 'graph',
    run: graphStorage,
    cppTopics: ['cpp-vector', 'cpp-2d-array', 'cpp-struct'],
  },
  dijkstra: {
    id: 'dijkstra',
    name: 'Dijkstra 最短路',
    en: 'Dijkstra',
    category: 'graph',
    complexity: { time: 'O(V²) 朴素 / O(E log V) 堆优化', space: 'O(V)' },
    blurb: '每轮挑最近的未确定点「定下来」，再用它松弛邻居。要求边权非负。',
    inputKind: 'graph',
    run: dijkstra,
    cppTopics: ['cpp-priority-queue', 'cpp-vector', 'cpp-loops'],
  },
  topologicalSort: {
    id: 'topologicalSort',
    name: '拓扑排序',
    en: 'Topological Sort',
    category: 'graph',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    blurb: '反复取出入度为 0 的点。能排完说明无环，排不完说明有环。',
    inputKind: 'dag',
    run: topologicalSort,
    cppTopics: ['cpp-stack-queue', 'cpp-vector', 'cpp-loops'],
  },
  kruskal: {
    id: 'kruskal',
    name: '最小生成树 · Kruskal',
    en: 'Minimum Spanning Tree',
    category: 'graph',
    complexity: { time: 'O(E log E)', space: 'O(V)' },
    blurb: '边按权值从小到大试，不成环就选。用并查集判环，是贪心的经典应用。',
    inputKind: 'graph',
    run: kruskal,
    cppTopics: ['cpp-struct', 'cpp-sort', 'cpp-vector'],
  },
};
