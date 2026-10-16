/**
 * 洛谷练习入口。
 *
 * 两条重要约束：
 *
 * 一、**不写死具体题号。**
 * 项目开发环境没有网络出口，无法联网核对题号是否仍然有效
 * （洛谷的题目可能改名、下架或调整编号）。写死题号的风险是给出死链，
 * 那比不给更糟。所以统一用「搜索入口」。
 *
 * 二、**题单指向「深入浅出」这类入门题单，但不写死题单 ID。**
 * 洛谷的「深入浅出」是官方/社区维护的入门题单系列，很适合本项目面向的读者。
 * 但同样因为无法联网核对，这里不去拼一个可能失效的题单 URL，
 * 而是：
 *   - 给「深入浅出」的站内搜索入口（关键词已填好，点了就能找到最新题单）
 *   - 给官方题单列表页，用户可自行在其中筛选
 *
 * 如果你之后联网确认了「深入浅出」的具体题单 ID，
 * 把它填到 EXACT_LISTS 里即可，界面会自动优先显示。
 */

/** 洛谷站内搜索：关键词会被正确编码。 */
const luoguSearch = (keyword) =>
  `https://www.luogu.com.cn/problem/list?keyword=${encodeURIComponent(keyword)}`;

/** 洛谷题单站内搜索（专门搜题单，而不是搜题目）。 */
const luoguTrainingSearch = (keyword) =>
  `https://www.luogu.com.cn/training/list?keyword=${encodeURIComponent(keyword)}`;

/** 洛谷官方题单列表。 */
export const LUOGU_TRAINING_LIST = 'https://www.luogu.com.cn/training/list';

/** 洛谷题目列表首页（按难度筛选）。 */
export const LUOGU_PROBLEM_LIST = 'https://www.luogu.com.cn/problem/list';

/**
 * 若你已核对过确切题单链接，填在这里，界面会优先展示。
 * 格式：{ label, url }
 *
 * 例如（**下面这条是占位示例，未经核对，默认不启用**）：
 *   { label: '深入浅出 · 程序设计入门', url: 'https://www.luogu.com.cn/training/xxxx' }
 */
export const EXACT_LISTS = [];

/**
 * 面向入门的题单入口。
 *
 * 设计意图：本项目读者是刚开始学算法的人，
 * 直接丢一个「全部题单列表」会让人不知道从哪开始。
 * 所以给出「深入浅出」这个具体系列的搜索入口作为第一推荐，
 * 再给官方列表页作为补充。
 */
export function luoguTrainingLinks() {
  const links = [];

  // 已核对的确切题单优先
  links.push(...EXACT_LISTS);

  // 「深入浅出」系列：用题单搜索入口（关键词已编码），避免写死 ID
  links.push({
    label: '深入浅出题单（在洛谷搜「深入浅出」）',
    url: luoguTrainingSearch('深入浅出'),
  });
  links.push({
    label: '入门题单（搜「入门」）',
    url: luoguTrainingSearch('入门'),
  });

  // 官方入口兜底
  links.push({
    label: '洛谷官方题单列表（自行按难度筛选）',
    url: LUOGU_TRAINING_LIST,
  });

  return links;
}

/**
 * 语法知识点 → 洛谷搜索关键词。
 * 键是语法知识点的 id，值是搜索关键词数组。
 */
export const SYNTAX_LUOGU = {
  // ---------- 零基础入门 ----------
  'cpp-hello': ['输出', '入门'],
  'cpp-comments': ['入门', '模拟'],
  'cpp-variables': ['变量', '入门'],
  'cpp-io': ['输入输出', '入门'],
  'cpp-operators': ['运算', '入门'],
  'cpp-branch': ['分支', '条件'],
  'cpp-loops': ['循环', '入门'],
  'cpp-array': ['数组', '入门'],
  'cpp-functions': ['函数', '入门'],
  'cpp-recursion': ['递归', '入门'],
  'cpp-pointer': ['指针', '引用'],
  'cpp-complexity': ['模拟', '入门'],

  // ---------- 类型与运算符细节（细化层） ----------
  'cpp-int': ['整数', '入门'],
  'cpp-longlong': ['整数', '高精度'],
  'cpp-float': ['浮点数', '实数'],
  'cpp-double': ['浮点数', '实数'],
  'cpp-char-bool': ['字符', 'ASCII'],
  'cpp-type-range': ['数据类型', '整数'],
  'cpp-overflow': ['高精度', '整数'],
  'cpp-arithmetic-detail': ['运算', '入门'],
  'cpp-compare-logic': ['条件', '逻辑'],
  'cpp-operator-priority': ['表达式', '运算'],
  'cpp-cast': ['类型转换', '取整'],
  'cpp-loop-control': ['循环', '跳出'],
  'cpp-2d-array': ['二维数组', '矩阵'],
  'cpp-array-count': ['桶', '统计'],
  'cpp-char-ascii': ['字符', '字符串'],
  'cpp-binary-answer': ['二分答案', '二分'],
  'cpp-priority-queue': ['堆', '优先队列'],

  // ---------- STL 容器 ----------
  'cpp-vector': ['vector', '动态数组'],
  'cpp-string': ['字符串', '入门'],
  'cpp-set': ['集合', 'STL'],
  'cpp-map': ['映射', 'STL'],
  'cpp-stack-queue': ['栈', '队列'],
  'cpp-priority-queue': ['堆', '优先队列'],
  'cpp-pair-iterator': ['STL', '结构体'],
  'cpp-struct': ['结构体', '排序'],

  // ---------- STL 算法 ----------
  'cpp-sort': ['排序', 'STL'],
  'cpp-binary-search': ['二分查找', '二分'],
  'cpp-bitset': ['位运算', '状态压缩'],
};

/**
 * 算法 id → 洛谷搜索关键词。
 * 挑的都是洛谷上确实有大量题目的主题词。
 */
export const ALGO_LUOGU = {
  // 排序
  bubble: ['排序', '模拟'],
  selection: ['排序'],
  insertion: ['排序'],
  shell: ['排序'],
  merge: ['归并排序', '排序'],
  quick: ['快速排序', '排序', '分治'],
  heap: ['堆', '优先队列'],
  counting: ['桶排序', '计数'],
  radix: ['排序', '基数'],
  bucket: ['桶排序'],

  // 查找
  binarySearch: ['二分查找', '二分答案'],
  binarySearchAnswer: ['二分答案', '二分'],

  // 路径
  bfs: ['广度优先搜索', 'BFS'],
  dfs: ['深度优先搜索', 'DFS'],

  // 基础技巧
  twoPointers: ['双指针', '尺取法'],
  slidingWindow: ['滑动窗口', '尺取法'],
  prefixSum: ['前缀和'],
  differenceArray: ['差分'],

  // 字符串
  kmp: ['KMP', '字符串匹配'],
  rabinKarp: ['字符串哈希', '哈希'],

  // 位运算
  bitwise: ['位运算', '状态压缩'],

  // 数据结构
  stackDemo: ['栈', '括号匹配'],
  queueDemo: ['队列', '单调队列'],
};

/** 生成某个语法知识点的洛谷入口列表。 */
export function luoguLinksForSyntax(topicId) {
  const keywords = SYNTAX_LUOGU[topicId] || [];
  return keywords.map((kw) => ({ label: `在洛谷搜索「${kw}」`, url: luoguSearch(kw) }));
}

/** 生成某个算法的洛谷入口列表。 */
export function luoguLinksForAlgo(algoId) {
  const keywords = ALGO_LUOGU[algoId] || [];
  return keywords.map((kw) => ({ label: `在洛谷搜索「${kw}」`, url: luoguSearch(kw) }));
}
