/**
 * 教程内容的统一装配层。
 *
 * 把三份数据合成页面直接可用的结构：
 *   1. cpp-topics.js   —— C++ 知识点（含源码）
 *   2. cpp-algos.js    —— 每个算法的 C++ 实现
 *   3. cpp-output.json —— 构建期用 g++ 真实编译运行得到的输出
 *   4. luogu.js        —— 洛谷练习入口
 *
 * 界面对「输出从哪来」这件事必须诚实：
 * 浏览器不能编译 C++，所以显示的是预先编译运行录下来的结果，
 * 这一点通过 outputVerified / outputError 字段暴露给 UI，由 UI 明确标注。
 */

import { CPP_TOPICS } from './cpp-topics.js';
import { CPP_DETAIL_TOPICS } from './cpp-detail-topics.js';
import { CPP_ALGO_SNIPPETS as CPP_ALGO_SNIPPETS_BASE } from './cpp-algos.js';
import { CPP_ALGO_SNIPPETS_2 } from './cpp-algos2.js';
import { SYNTAX_LUOGU, ALGO_LUOGU } from './luogu.js';
import { TOPIC_PROBLEMS, ALGO_PROBLEMS, LUOGU_TRAINING_SETS } from './problems.js';

/**
 * 算法的 C++ 实现分两批文件：
 *   cpp-algos.js   最初 23 个算法
 *   cpp-algos2.js  后来新增的高精度 / 图论 / Trie
 * 这里合并成一份，避免调用方关心文件怎么分。
 */
const CPP_ALGO_SNIPPETS = [...CPP_ALGO_SNIPPETS_BASE, ...CPP_ALGO_SNIPPETS_2];

/**
 * 全部知识点 = 基础层 + 细化层。
 *
 * 细化层是为了让每个类型/运算符都有独立的小节 ——
 * 原来的「变量与基本类型」把 int/long long/double/char/bool 挤在一个知识点里，
 * float 完全没提，对初学者不够。
 */
const ALL_CPP_TOPICS = [...CPP_TOPICS, ...CPP_DETAIL_TOPICS];

/**
 * 构建期生成的输出数据。
 *
 * 注意：这里用的是 .js 模块而不是直接 import JSON ——
 * import JSON 需要 import assertions（`with { type: 'json' }`），
 * 各浏览器支持度不一致，会让「打开就能用」这个前提变得脆弱。
 * 所以构建脚本会同时产出 cpp-output.js（导出普通对象），页面只依赖它。
 */
import { CPP_OUTPUT } from './cpp-output.js';

const OUTPUTS = CPP_OUTPUT.results || {};
const META = CPP_OUTPUT.meta || {};

/** 洛谷搜索链接（与 luogu.js 保持一致）。 */
const luoguSearch = (kw) =>
  `https://www.luogu.com.cn/problem/list?keyword=${encodeURIComponent(kw)}`;

/**
 * C++ 知识点：把知识点本身、真实输出、练习链接装配到一起。
 *
 * 每个条目包含：
 *   id / group / title / summary / points / code
 *   output      —— 真实编译运行的 stdout（可能为空）
 *   outputOk    —— 是否编译运行成功
 *   outputError —— 失败原因（若有）
 *   luogu       —— 推荐练习链接数组
 */
export const CPP_TOPIC_LIST = ALL_CPP_TOPICS.map((topic) => {
  const out = OUTPUTS[topic.id] || {};
  const keywords = SYNTAX_LUOGU[topic.id] || [];
  // 精选真题优先；没有专属真题的退回搜索入口
  const problems = TOPIC_PROBLEMS[topic.id] || [];
  return {
    id: topic.id,
    group: topic.group,
    title: topic.title,
    summary: topic.summary,
    points: topic.points,
    code: topic.code,
    output: out.stdout || '',
    outputOk: Boolean(out.verified),
    outputError: out.error || '',
    problems,
    luogu: keywords.map((kw) => ({ label: `搜索「${kw}」`, url: luoguSearch(kw) })),
  };
});

/** 按分组归类的知识点，左侧导航用。 */
export const CPP_GROUPS = (() => {
  const groups = [];
  for (const t of CPP_TOPIC_LIST) {
    let g = groups.find((x) => x.name === t.group);
    if (!g) { g = { name: t.group, topics: [] }; groups.push(g); }
    g.topics.push(t);
  }
  return groups;
})();

/** 按 id 快速取用。 */
export const CPP_TOPIC_BY_ID = Object.fromEntries(CPP_TOPIC_LIST.map((t) => [t.id, t]));

/**
 * 算法的 C++ 实现。
 *
 * 算法可视化的动画必须用 JS（浏览器里做不到用 C++ 画动画），
 * 这里提供一份对应的 C++ 实现，让学习者能对照「动画怎么跑」和「C++ 怎么写」。
 */

/**
 * C++ 片段 id → 算法 id 的映射。
 *
 * 不能简单地把 'algo-' 前缀去掉：片段用的是 kebab-case（algo-binary-search），
 * 而算法 id 是 camelCase（binarySearch），直接去掉前缀会得到 'binary-search'，
 * 既匹配不上算法，也匹配不上洛谷关键词表 —— 这个错误实际发生过。
 */
const SNIPPET_TO_ALGO = {
  'algo-bubble': 'bubble',
  'algo-selection': 'selection',
  'algo-insertion': 'insertion',
  'algo-shell': 'shell',
  'algo-merge': 'merge',
  'algo-quick': 'quick',
  'algo-heap': 'heap',
  'algo-counting': 'counting',
  'algo-radix': 'radix',
  'algo-bucket': 'bucket',
  'algo-binary-search': 'binarySearch',
  'algo-binary-answer': 'binarySearchAnswer',
  'algo-bfs': 'bfs',
  'algo-dfs': 'dfs',
  'algo-two-pointers': 'twoPointers',
  'algo-sliding-window': 'slidingWindow',
  'algo-prefix-sum': 'prefixSum',
  'algo-difference-array': 'differenceArray',
  'algo-bitwise': 'bitwise',
  'algo-kmp': 'kmp',
  'algo-rabin-karp': 'rabinKarp',
  'algo-stack': 'stackDemo',
  'algo-queue': 'queueDemo',
  // 第二批：高精度 / 图论 / Trie
  'algo-bigadd': 'bigAdd',
  'algo-bigsub': 'bigSub',
  'algo-bigmul': 'bigMul',
  'algo-bigfactorial': 'bigFactorial',
  'algo-graph-storage': 'graphStorage',
  'algo-dijkstra': 'dijkstra',
  'algo-topological-sort': 'topologicalSort',
  'algo-kruskal': 'kruskal',
  'algo-trie': 'trie',
};

export const CPP_ALGO_LIST = CPP_ALGO_SNIPPETS.map((snippet) => {
  const out = OUTPUTS[snippet.id] || {};
  const algoId = SNIPPET_TO_ALGO[snippet.id] || snippet.id.replace(/^algo-/, '');
  const keywords = ALGO_LUOGU[algoId] || [];
  const problems = ALGO_PROBLEMS[algoId] || [];
  return {
    id: snippet.id,
    algoId,
    title: snippet.title,
    code: snippet.code,
    output: out.stdout || '',
    outputOk: Boolean(out.verified),
    outputError: out.error || '',
    problems,
    luogu: keywords.map((kw) => ({ label: `搜索「${kw}」`, url: luoguSearch(kw) })),
  };
});

export const CPP_ALGO_BY_ALGO_ID = Object.fromEntries(CPP_ALGO_LIST.map((a) => [a.algoId, a]));

/** 洛谷官方题单（真实抓取的题单 ID，含「深入浅出」配套题单）。 */
export { LUOGU_TRAINING_SETS };

/** 构建信息，页面用来如实标注输出来源。 */
export const CPP_BUILD_META = {
  compiler: META.compiler || 'g++ -std=c++17',
  compilerVersion: META.compilerVersion || '',
  generatedAt: META.generatedAt || '',
  total: META.total || 0,
  passed: META.passed || 0,
  failed: META.failed || 0,
  note: META.note || '',
};
