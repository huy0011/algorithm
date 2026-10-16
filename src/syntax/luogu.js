/**
 * 洛谷练习入口。
 *
 * 重要说明：**这里不写死具体题号。**
 * 项目开发环境没有网络出口，无法联网核对题号是否仍然有效
 * （洛谷的题目可能改名、下架或调整编号）。写死题号的风险是给出死链，
 * 那比不给更糟。
 *
 * 所以这里采用「搜索入口 + 官方题单入口」的方式：
 *   - searchUrl：直接跳到洛谷的搜索页，关键词已经填好，点进去就是相关题目
 *   - 题单列表页：洛谷官方题单的入口，用户可以在里面按难度找
 *
 * 如果你之后联网核对了题号，可以在这里加 exactProblems 字段，
 * 界面会自动把精确题目显示出来。
 */

/** 洛谷站内搜索：关键词会被正确编码。 */
const luoguSearch = (keyword) =>
  `https://www.luogu.com.cn/problem/list?keyword=${encodeURIComponent(keyword)}`;

/** 洛谷官方题单列表。 */
export const LUOGU_TRAINING_LIST = 'https://www.luogu.com.cn/training/list';

/** 洛谷题目列表首页（按难度筛选）。 */
export const LUOGU_PROBLEM_LIST = 'https://www.luogu.com.cn/problem/list';

/**
 * 语法知识点 → 洛谷搜索关键词。
 * 键是语法知识点的 id，值是搜索关键词数组。
 */
export const SYNTAX_LUOGU = {
  // ---------- 入门层 ----------
  'hello-world': ['输出', '入门'],
  'what-is-program': ['入门', '基础知识'],
  comments: ['入门', '模拟'],
  'variables': ['变量', '入门'],
  'input-output': ['输入输出', '入门'],
  'data-types': ['数据类型', '入门'],
  'type-conversion': ['类型转换', '入门'],
  'arithmetic-ops': ['运算', '入门'],
  'operator-precedence': ['表达式', '入门'],
  'number-types': ['整数', '入门'],
  'basic-debugging': ['模拟', '入门', '找错'],
  'math-floor': ['取整', '入门'],
  'math-sqrt': ['数学', '开方'],

  // ---------- 流程控制 ----------
  'if-else': ['分支', '条件'],
  'switch-case': ['分支', '多分支'],
  'for-loop': ['循环', 'for'],
  'while-loop': ['循环', 'while'],
  'do-while': ['循环'],
  'break-continue': ['循环', '跳出'],
  'nested-loop': ['循环', '嵌套'],

  // ---------- 数组与字符串 ----------
  'array-basics': ['数组', '入门'],
  'array-push-pop': ['数组', '栈'],
  'nested-array': ['二维数组', '矩阵'],
  'array-index-math': ['数组', '下标'],
  'array-slice': ['数组', '区间'],
  'array-map-filter': ['数组', '函数式'],
  'array-init': ['数组', '初始化'],
  'for-of': ['遍历'],
  'string-basics': ['字符串', '入门'],
  'string-length': ['字符串'],
  'comparison-ops': ['比较', '判断'],
  'truthiness': ['布尔', '条件'],

  // ---------- 函数 ----------
  'functions': ['函数', '入门'],
  'arrow-function': ['函数'],
  'closures': ['闭包'],
  'recursion': ['递归', '入门'],
  'recursion-vs-stack': ['递归', '栈'],

  // ---------- 对象与集合 ----------
  'object-literal': ['结构体', '映射'],
  'set-map': ['集合', '映射'],
  'destructuring': ['解构'],

  // ---------- 实用技巧 ----------
  'variable-swap': ['交换'],
  'short-circuit': ['逻辑运算'],
  'boolean-flag': ['标记', '判断'],
  'min-tracking': ['最大值', '最小值'],
  'array-as-queue': ['队列', '模拟'],
  'array-as-stack': ['栈', '模拟'],
  'array-shift': ['队列'],
  'mid-overflow': ['二分查找', '二分'],
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

/** 生成洛谷官方题单入口（所有知识点和算法共用）。 */
export function luoguTrainingLinks() {
  return [
    { label: '洛谷官方题单（按难度分层的训练题单）', url: LUOGU_TRAINING_LIST },
    { label: '洛谷题目列表（可按难度/算法标签筛选）', url: LUOGU_PROBLEM_LIST },
  ];
}
