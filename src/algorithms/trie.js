/**
 * Trie（字典树 / 前缀树）。
 *
 * 用途：高效地存储和查询一堆字符串的**前缀**。
 * 比如「有没有以 abc 开头的单词」「这堆单词里有没有 abc」。
 *
 * 结构特点：从根出发，每条边是一个字符，从根走到某个点拼出来的就是前缀。
 * 这天然是一棵树 —— 所以复用 graph 渲染器（树是图的一种）。
 */

import { GraphTracer } from './tracer.js';

/**
 * 按层给 Trie 的节点排坐标。
 * 树形布局：深度决定 x（从左到右），同层的兄弟按顺序分 y。
 */
function layoutTree(nodes, children) {
  // 先算每个节点的深度（= 前缀长度）
  // BFS 一遍拿到层序，再按层分配 y
  const byDepth = new Map();
  const queue = [[0, 0]];   // [节点 id, 深度]
  const depthOf = new Map([[0, 0]]);

  while (queue.length) {
    const [id, d] = queue.shift();
    depthOf.set(id, d);
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d).push(id);
    for (const [, childId] of children.get(id) || []) {
      queue.push([childId, d + 1]);
    }
  }

  const maxDepth = Math.max(...depthOf.values(), 1);
  for (const [d, ids] of byDepth) {
    ids.forEach((id, i) => {
      const node = nodes.get(id);
      node.x = 0.08 + (0.84 * d) / maxDepth;
      node.y = ids.length === 1 ? 0.5 : 0.12 + (0.76 * i) / (ids.length - 1);
    });
  }
}

/**
 * 构建 Trie 并逐个插入单词，最后做一次前缀查询演示。
 */
function trieDemo(input, options = {}) {
  const words = options.words ?? ['apple', 'app', 'april', 'banana', 'bat', 'batch'];

  const t = new GraphTracer({
    title: 'Trie 字典树',
    explain: '从根出发，每条边一个字符。插入单词就是沿路建点；查前缀就是从根往下走。相同前缀共用一条路径，所以非常省空间。',
    layout: 'tree',
  });

  /**
   * 节点表：id → { label, isWord, depth, ch }
   * children: id → [[字符, 子节点id]]
   */
  const nodes = new Map();
  const children = new Map();
  let nextId = 1;

  nodes.set(0, { id: 0, label: '根', x: 0, y: 0, isWord: false });
  children.set(0, []);
  t.addNode(0, '根', 0, 0);
  t.note(`准备插入 ${words.length} 个单词：${words.join('、')}`);

  /** 插入一个单词，返回路径上的节点 id。 */
  function insert(word) {
    let cur = 0;
    const path = [0];
    t.current(cur);
    for (const ch of word) {
      const kids = children.get(cur);
      let found = kids.find(([c]) => c === ch);
      if (!found) {
        const id = nextId++;
        nodes.set(id, { id, label: ch, x: 0, y: 0, isWord: false });
        children.set(id, []);
        kids.push([ch, id]);
        // 新节点的坐标先给 0，布局阶段会重算并通过 NODE 操作写回序列
        t.addNode(id, ch, 0, 0);
        t.relax(cur, id, 1, true, `没有字符「${ch}」的分支 → 新建节点`);
        found = [ch, id];
      } else {
        t.relax(cur, found[1], 1, false, `已有字符「${ch}」的分支 → 直接复用（这就是省空间的原因）`);
      }
      cur = found[1];
      path.push(cur);
      t.current(cur);
    }
    // 标记单词结尾
    nodes.get(cur).isWord = true;
    t.visit(cur, `「${word}」插入完毕，把这里标成单词结尾`);
    return path;
  }

  // ---- 插入全部单词 ----
  const inserted = [];
  for (const w of words) {
    t.note(`插入「${w}」`);
    const path = insert(w);
    inserted.push({ word: w, endNode: path[path.length - 1] });
  }

  // ---- 重新布局（树形），并把坐标写进操作序列 ----
  layoutTree(nodes, children);
  for (const node of nodes.values()) {
    t.addNode(node.id, node.label, node.x, node.y);
  }
  t.note('树形布局完成：从左到右是前缀长度，同层是不同分支');

  // ---- 前缀查询演示 ----
  const queries = options.queries ?? ['app', 'ban', 'cat'];
  const queryResults = [];

  for (const q of queries) {
    t.note(`查询前缀「${q}」`);
    let cur = 0;
    let ok = true;
    for (const ch of q) {
      const found = children.get(cur).find(([c]) => c === ch);
      if (!found) { ok = false; break; }
      cur = found[1];
      t.current(cur);
      t.visit(cur, `沿边「${ch}」走到节点`);
    }
    queryResults.push({ query: q, found: ok });
    t.note(ok ? `✓ 存在以「${q}」开头的单词` : `✗ 不存在以「${q}」开头的单词`);
  }

  const totalNodes = nodes.size;
  const totalChars = words.reduce((a, w) => a + w.length, 0);
  t.note(
    `共用前缀省了多少：${words.length} 个单词总共 ${totalChars} 个字符，` +
    `Trie 只用了 ${totalNodes - 1} 个字符节点（根不算）`
  );

  return {
    tracer: t,
    words,
    nodeCount: totalNodes,
    charCount: totalChars,
    queries: queryResults,
    inserted,
  };
}

/**
 * 用独立实现暴力验证「前缀存在性」，用于和 Trie 的查询结果对拍。
 */
export function bruteHasPrefix(words, prefix) {
  return words.some((w) => w.startsWith(prefix));
}

export const TRIE_ALGORITHMS = {
  trie: {
    id: 'trie',
    name: 'Trie 字典树',
    en: 'Trie',
    category: 'string',
    complexity: { time: 'O(总字符数) 建树 / O(前缀长) 查询', space: 'O(总字符数 × 字符集)' },
    blurb: '相同前缀共用一条路径，所以查前缀非常快。是自动补全、敏感词过滤、AC 自动机的基础。',
    inputKind: 'words',
    run: trieDemo,
    cppTopics: ['cpp-struct', 'cpp-array', 'cpp-recursion'],
  },
};
