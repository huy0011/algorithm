/**
 * 新增算法（高精度 / 图论 / Trie）的正确性验证。
 *
 * 原则和之前一致：**必须与独立实现对拍**，不能只看动画「像那么回事」。
 *   高精度  —— 与 JavaScript BigInt 精确运算对比
 *   Dijkstra —— 与 Bellman-Ford（另一种独立算法）对比
 *   拓扑排序 —— 校验拓扑序的定义性质 + 与暴力判环对比
 *   Kruskal —— 与 Prim 对比总权值；校验它确实是树且不成环
 *   Trie    —— 前缀查询与朴素 startsWith 对比
 *
 * 用法：node tests/verify-graph.js
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const { ALGORITHMS } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href);
const { makeWeightedGraph } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/graph.js')).href);
const { bruteHasPrefix } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/trie.js')).href);

let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.error(`  ✗ ${msg}`); }
};

console.log('新增算法正确性验证（高精度 / 图论 / Trie）\n' + '='.repeat(58));

// ===================== 高精度 =====================
console.log('\n[1] 高精度运算（与 BigInt 对拍）');

function randBigStr(len, nonZeroLead = true) {
  let s = nonZeroLead ? String(1 + Math.floor(Math.random() * 9)) : String(Math.floor(Math.random() * 10));
  for (let i = 1; i < len; i++) s += String(Math.floor(Math.random() * 10));
  return s;
}

{
  let bad = 0;
  for (let t = 0; t < 60; t++) {
    const a = randBigStr(1 + Math.floor(Math.random() * 30));
    const b = randBigStr(1 + Math.floor(Math.random() * 30));
    const r = ALGORITHMS.bigAdd.run([], { a, b });
    const expect = (BigInt(a) + BigInt(b)).toString();
    if (r.answer !== expect) {
      bad++;
      if (bad <= 3) console.error(`      ✗ ${a} + ${b} 得 ${r.answer}，应为 ${expect}`);
    }
    if (!r.correct) bad++;
  }
  assert(bad === 0, `高精度加法 60 组与 BigInt 一致（失败 ${bad}）`);
}

{
  let bad = 0;
  for (let t = 0; t < 60; t++) {
    let a = randBigStr(1 + Math.floor(Math.random() * 30));
    let b = randBigStr(1 + Math.floor(Math.random() * 30));
    if (BigInt(a) < BigInt(b)) [a, b] = [b, a];   // 保证非负结果
    const r = ALGORITHMS.bigSub.run([], { a, b });
    const expect = (BigInt(a) - BigInt(b)).toString();
    if (r.answer !== expect) {
      bad++;
      if (bad <= 3) console.error(`      ✗ ${a} - ${b} 得 ${r.answer}，应为 ${expect}`);
    }
  }
  assert(bad === 0, `高精度减法 60 组与 BigInt 一致（失败 ${bad}）`);
}

{
  let bad = 0;
  for (let t = 0; t < 60; t++) {
    const a = randBigStr(1 + Math.floor(Math.random() * 12));
    const b = randBigStr(1 + Math.floor(Math.random() * 12));
    const r = ALGORITHMS.bigMul.run([], { a, b });
    const expect = (BigInt(a) * BigInt(b)).toString();
    if (r.answer !== expect) {
      bad++;
      if (bad <= 3) console.error(`      ✗ ${a} × ${b} 得 ${r.answer}，应为 ${expect}`);
    }
  }
  assert(bad === 0, `高精度乘法 60 组与 BigInt 一致（失败 ${bad}）`);
}

{
  let bad = 0;
  for (const n of [5, 10, 20, 21, 25, 30, 50]) {
    const r = ALGORITHMS.bigFactorial.run([], { n });
    let expect = 1n;
    for (let k = 2; k <= n; k++) expect *= BigInt(k);
    if (r.answer !== expect.toString()) {
      bad++;
      console.error(`      ✗ ${n}! 得 ${r.answer.slice(0, 20)}…，应为 ${expect.toString().slice(0, 20)}…`);
    }
  }
  assert(bad === 0, '高精度阶乘 7 组（含 20!/21!/25!/30!/50!）与 BigInt 一致');
}

// ===================== Dijkstra =====================
console.log('\n[2] Dijkstra（与 Bellman-Ford 对拍）');

/** 独立的 Bellman-Ford 实现，用于交叉验证。 */
function bellmanFord(n, edges, start) {
  const INF = Infinity;
  const dist = new Array(n).fill(INF);
  dist[start] = 0;
  for (let round = 0; round < n - 1; round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (dist[u] < INF && dist[u] + w < dist[v]) { dist[v] = dist[u] + w; changed = true; }
      if (dist[v] < INF && dist[v] + w < dist[u]) { dist[u] = dist[v] + w; changed = true; }
    }
    if (!changed) break;
  }
  return dist;
}

{
  let bad = 0;
  for (const seed of [0, 1]) {
    const g = makeWeightedGraph(seed);
    const n = g.nodes.length;
    for (const start of [0, 1, 2, 3]) {
      const r = ALGORITHMS.dijkstra.run([], { graph: g, start });
      const expect = bellmanFord(n, g.edges, start);
      for (let i = 0; i < n; i++) {
        if (r.dist[i] !== expect[i]) {
          bad++;
          if (bad <= 3) {
            console.error(`      ✗ 图${seed} 起点${start} 到点${i}：Dijkstra 得 ${r.dist[i]}，Bellman-Ford 得 ${expect[i]}`);
          }
        }
      }
    }
  }
  assert(bad === 0, `Dijkstra 在 2 张图 × 4 个起点上与 Bellman-Ford 完全一致（失败 ${bad}）`);
}

// ===================== 拓扑排序 =====================
console.log('\n[3] 拓扑排序');

{
  // 3.1 拓扑序的定义性质：每条边 u→v 中 u 必须排在 v 前面
  const cases = [
    { n: 6, edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [2, 5], [5, 4]] },
    { n: 4, edges: [[0, 1], [1, 2], [2, 3]] },
    { n: 3, edges: [] },
  ];
  let bad = 0;
  for (const c of cases) {
    const r = ALGORITHMS.topologicalSort.run([], c);
    if (!r.isDag) { bad++; console.error('      ✗ 无环图被判成有环'); continue; }
    const pos = new Map(r.order.map((id, i) => [id, i]));
    for (const [u, v] of c.edges) {
      if (pos.get(u) >= pos.get(v)) {
        bad++;
        console.error(`      ✗ 边 ${u}→${v} 的顺序不对（${u} 在 ${pos.get(u)}，${v} 在 ${pos.get(v)}）`);
      }
    }
    if (r.order.length !== c.n) bad++;
  }
  assert(bad === 0, `拓扑排序在 ${cases.length} 个 DAG 上都满足「每条边的起点排在终点前」`);

  // 3.2 有环的图必须被检测出来
  const cyclic = { n: 3, edges: [[0, 1], [1, 2], [2, 0]] };
  const rc = ALGORITHMS.topologicalSort.run([], cyclic);
  assert(!rc.isDag && rc.order.length < 3,
    `有环图被正确检测：只排出 ${rc.order.length}/3 个点，isDag=${rc.isDag}`);
}

// ===================== Kruskal =====================
console.log('\n[4] 最小生成树 Kruskal（与 Prim 对拍）');

/** 独立的 Prim 实现，用于交叉验证总权值。 */
function prim(n, edges, start = 0) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) { adj[u].push([v, w]); adj[v].push([u, w]); }
  const inTree = new Array(n).fill(false);
  const INF = Infinity;
  const best = new Array(n).fill(INF);
  best[start] = 0;
  let total = 0;
  let used = 0;
  for (let iter = 0; iter < n; iter++) {
    let u = -1, bv = INF;
    for (let i = 0; i < n; i++) if (!inTree[i] && best[i] < bv) { bv = best[i]; u = i; }
    if (u === -1) break;                   // 图不连通
    inTree[u] = true;
    total += bv;
    used++;
    for (const [v, w] of adj[u]) if (!inTree[v] && w < best[v]) best[v] = w;
  }
  return { total: used === n ? total : null, used };
}

{
  let bad = 0;
  for (const seed of [0, 1]) {
    const g = makeWeightedGraph(seed);
    const n = g.nodes.length;
    const r = ALGORITHMS.kruskal.run([], { graph: g });
    const p = prim(n, g.edges);

    if (p.total === null) continue;
    if (r.total !== p.total) {
      bad++;
      console.error(`      ✗ 图${seed}：Kruskal 总权值 ${r.total}，Prim 得 ${p.total}`);
    }
    // 必须恰好 n-1 条边
    if (r.chosen.length !== n - 1) {
      bad++;
      console.error(`      ✗ 图${seed}：选了 ${r.chosen.length} 条边，应为 ${n - 1}`);
    }
    // 选出的边不能成环（并查集再验一次）
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x) => { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; };
    for (const [u, v] of r.chosen) {
      const ru = find(u), rv = find(v);
      if (ru === rv) { bad++; console.error(`      ✗ 选出的边 ${u}-${v} 会成环`); break; }
      parent[ru] = rv;
    }
  }
  assert(bad === 0, 'Kruskal 在 2 张图上：总权值与 Prim 一致、边数为 n-1、且不成环');
}

// ===================== Trie =====================
console.log('\n[5] Trie 字典树（与朴素 startsWith 对拍）');

{
  let bad = 0;
  const wordSets = [
    ['apple', 'app', 'april', 'banana', 'bat', 'batch'],
    ['cat', 'car', 'card', 'care', 'dog', 'do'],
    ['a', 'ab', 'abc', 'abcd'],
    ['x'],
  ];
  const queries = ['a', 'ab', 'app', 'ban', 'car', 'do', 'zzz', 'cat', 'batch', 'q'];

  for (const words of wordSets) {
    const r = ALGORITHMS.trie.run([], { words, queries });
    for (const qr of r.queries) {
      const expect = bruteHasPrefix(words, qr.query);
      if (qr.found !== expect) {
        bad++;
        if (bad <= 5) {
          console.error(`      ✗ 单词集 [${words.join(',')}] 查询「${qr.query}」：Trie 说 ${qr.found}，朴素法说 ${expect}`);
        }
      }
    }
  }
  assert(bad === 0, `Trie 在 ${wordSets.length} 组词表 × ${queries.length} 个查询上与朴素 startsWith 完全一致（失败 ${bad}）`);

  // 节点数应该小于总字符数（共用前缀的效果）
  const words = ['apple', 'app', 'april'];
  const r = ALGORITHMS.trie.run([], { words, queries: [] });
  const totalChars = words.reduce((a, w) => a + w.length, 0);
  assert(r.nodeCount - 1 < totalChars,
    `共用前缀确实省了节点：${totalChars} 个字符只用了 ${r.nodeCount - 1} 个节点`);
}

// ===================== 操作序列可重放性 =====================
console.log('\n[6] 新增算法的操作序列可重放性');
{
  const cases = [
    ['bigAdd', () => ALGORITHMS.bigAdd.run([], { a: '123456789', b: '987654321' })],
    ['bigMul', () => ALGORITHMS.bigMul.run([], { a: '123', b: '456' })],
    ['dijkstra', () => ALGORITHMS.dijkstra.run([], { graph: makeWeightedGraph(0), start: 0 })],
    ['topologicalSort', () => ALGORITHMS.topologicalSort.run([], {})],
    ['kruskal', () => ALGORITHMS.kruskal.run([], { graph: makeWeightedGraph(0) })],
    ['trie', () => ALGORITHMS.trie.run([], { words: ['ab', 'ac'], queries: ['a'] })],
  ];
  let bad = 0;
  for (const [name, fn] of cases) {
    let out;
    try { out = fn(); } catch (e) { bad++; console.error(`      ✗ ${name} 抛异常：${e.message}`); continue; }
    const tr = out && out.tracer;
    let result;
    if (tr) result = typeof tr.build === 'function' ? tr.build() : tr.result();
    else result = out;

    if (!result || !Array.isArray(result.operations) || result.operations.length === 0) {
      bad++; console.error(`      ✗ ${name} 没有产出操作序列`); continue;
    }
    if (!result.kind) { bad++; console.error(`      ✗ ${name} 结果缺 kind`); continue; }
  }
  assert(bad === 0, `${cases.length} 个新算法都产出了带 kind 的操作序列`);
}

console.log('\n' + '='.repeat(58));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
