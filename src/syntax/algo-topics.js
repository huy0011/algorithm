/**
 * 算法 → C++ 语法知识点的关联映射。
 *
 * 为什么单独一张表而不是改算法定义：
 *   算法层（src/algorithms/）的职责是「算出操作序列」，不该关心教学内容的组织方式。
 *   把「这个算法涉及哪些 C++ 知识点」放在教程侧，算法层保持纯粹。
 *
 * 键是算法 id，值是 C++ 知识点 id 数组（对应 cpp-topics.js 里的 id）。
 * 测试会校验每个 id 都真实存在，防止写错导致跳转失效。
 */
export const ALGO_CPP_TOPICS = {
  // ---------- 排序 ----------
  bubble: ['cpp-loops', 'cpp-array', 'cpp-branch'],
  selection: ['cpp-loops', 'cpp-array', 'cpp-branch'],
  insertion: ['cpp-loops', 'cpp-array'],
  shell: ['cpp-loops', 'cpp-array'],
  merge: ['cpp-recursion', 'cpp-array', 'cpp-functions'],
  quick: ['cpp-recursion', 'cpp-array', 'cpp-functions'],
  heap: ['cpp-array', 'cpp-loops', 'cpp-complexity'],

  // ---------- 非比较排序 ----------
  counting: ['cpp-array', 'cpp-loops', 'cpp-vector'],
  radix: ['cpp-loops', 'cpp-vector', 'cpp-array'],
  bucket: ['cpp-vector', 'cpp-sort', 'cpp-array'],

  // ---------- 查找 ----------
  binarySearch: ['cpp-loops', 'cpp-binary-search', 'cpp-array'],
  binarySearchAnswer: ['cpp-binary-search', 'cpp-functions', 'cpp-loops'],

  // ---------- 路径查找 ----------
  bfs: ['cpp-stack-queue', 'cpp-vector', 'cpp-loops'],
  dfs: ['cpp-recursion', 'cpp-stack-queue', 'cpp-vector'],

  // ---------- 基础技巧 ----------
  twoPointers: ['cpp-loops', 'cpp-sort', 'cpp-array'],
  slidingWindow: ['cpp-map', 'cpp-loops', 'cpp-vector'],
  prefixSum: ['cpp-vector', 'cpp-loops', 'cpp-array'],
  differenceArray: ['cpp-vector', 'cpp-loops', 'cpp-array'],

  // ---------- 字符串 ----------
  kmp: ['cpp-string', 'cpp-vector', 'cpp-loops'],
  rabinKarp: ['cpp-string', 'cpp-vector', 'cpp-operators'],

  // ---------- 位运算 ----------
  bitwise: ['cpp-bitset', 'cpp-operators', 'cpp-variables'],

  // ---------- 高精度 ----------
  bigAdd: ['cpp-array', 'cpp-loops', 'cpp-char-bool'],
  bigSub: ['cpp-array', 'cpp-loops', 'cpp-branch'],
  bigMul: ['cpp-array', 'cpp-loops', 'cpp-longlong'],
  bigFactorial: ['cpp-array', 'cpp-loops', 'cpp-overflow'],

  // ---------- 图论 ----------
  graphStorage: ['cpp-vector', 'cpp-array', 'cpp-struct'],
  dijkstra: ['cpp-priority-queue', 'cpp-vector', 'cpp-loops'],
  topologicalSort: ['cpp-stack-queue', 'cpp-vector', 'cpp-loops'],
  kruskal: ['cpp-struct', 'cpp-sort', 'cpp-vector'],

  // ---------- Trie ----------
  trie: ['cpp-struct', 'cpp-array', 'cpp-recursion'],

  // ---------- 数据结构 ----------
  stackDemo: ['cpp-stack-queue', 'cpp-string', 'cpp-branch'],
  queueDemo: ['cpp-stack-queue', 'cpp-string', 'cpp-loops'],
};
