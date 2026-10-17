/**
 * 入口层：串联 UI 控件 ↔ 算法层 ↔ 渲染层 ↔ 语法教程。
 *
 * 这一层是唯一同时了解各方的胶水代码，职责只有「翻译」：
 *   用户操作 → 算法调用 → 操作序列 → 选对渲染器 → 界面文字与数字
 * 它本身不含算法逻辑，也不含绘制逻辑。
 */

import { ALGORITHMS, ALGORITHM_ORDER, CATEGORIES, algorithmsByCategory } from './algorithms/index.js';
import { createVisualizer, buildInput } from './render/factory.js';
import { Player } from './render/player.js';
import {
  CPP_GROUPS,
  CPP_TOPIC_BY_ID,
  CPP_ALGO_BY_ALGO_ID,
  CPP_BUILD_META,
} from './syntax/content.js';
import { luoguTrainingLinks } from './syntax/luogu.js';
import { LUOGU_TRAINING_SETS } from './syntax/content.js';

const $ = (id) => document.getElementById(id);

const dom = {
  // 页签
  tabButtons: document.querySelectorAll('[data-tab]'),
  panes: document.querySelectorAll('[data-pane]'),

  // 可视化页
  canvas: $('canvas'),
  categorySelect: $('category-select'),
  algoSelect: $('algo-select'),
  sizeRange: $('size-range'),
  sizeValue: $('size-value'),
  sizeGroup: $('size-group'),
  shapeSelect: $('shape-select'),
  shapeGroup: $('shape-group'),
  speedRange: $('speed-range'),
  speedValue: $('speed-value'),
  btnGenerate: $('btn-generate'),
  btnPlay: $('btn-play'),
  btnStep: $('btn-step'),
  btnSkip: $('btn-skip'),
  btnReset: $('btn-reset'),
  playIcon: $('play-icon'),
  playLabel: $('play-label'),
  progress: $('progress'),
  stepLabel: $('step-label'),
  statComparisons: $('stat-comparisons'),
  statSwaps: $('stat-swaps'),
  statWrites: $('stat-writes'),
  statPrimaryLabel: $('stat-primary-label'),
  statSecondaryLabel: $('stat-secondary-label'),
  statTertiaryLabel: $('stat-tertiary-label'),
  algoName: $('algo-name'),
  algoEn: $('algo-en'),
  algoTime: $('algo-time'),
  algoSpace: $('algo-space'),
  algoBlurb: $('algo-blurb'),
  algoStable: $('algo-stable'),
  algoStableWrap: $('algo-stable-wrap'),
  syntaxLinks: $('syntax-links'),
  tableBody: $('compare-table-body'),
  btnCompare: $('btn-compare'),
  compareSection: $('compare-section'),
  comparePlaceholder: $('compare-placeholder'),
  placeholderTitle: $('placeholder-title'),
  placeholderBody: $('placeholder-body'),
  placeholderAlgos: $('placeholder-algos'),
  stepDetailMain: $('step-detail-main'),
  stepDetailSub: $('step-detail-sub'),
  legendBars: $('legend-bars'),
  legendGrid: $('legend-grid'),
  legendSearch: $('legend-search'),
  legendStructure: $('legend-structure'),
  legendSpan: $('legend-span'),
  legendBits: $('legend-bits'),
  legendGraph: $('legend-graph'),

  // 语法页
  syntaxNav: $('syntax-nav'),
  syntaxTitle: $('syntax-title'),
  syntaxSummary: $('syntax-summary'),
  syntaxPoints: $('syntax-points'),
  syntaxCode: $('syntax-code'),
  syntaxRun: $('syntax-run'),
  syntaxOutput: $('syntax-output'),
  syntaxUsedBy: $('syntax-used-by'),
  syntaxSearch: $('syntax-search'),
  syntaxCount: $('syntax-count'),
  syntaxLuogu: $('syntax-luogu'),
  algoLuogu: $('algo-luogu'),
  algoCpp: $('algo-cpp'),
};

// ---------- 状态 ----------
const state = {
  /** 当前可视化结果 */
  result: null,
  /** 生成输入时用的配置，重新生成时复用 */
  config: { size: 40, shape: 'random' },
  activeCategory: 'sort',
  activeAlgo: 'bubble',
  /** 当前选中的语法知识点 id */
  activeTopic: null,
  /** 上一次生成的输入，用于「同一组数据」的对比 */
  lastInput: null,
  lastOptions: null,
};

let visualizer;
let player;
/** 当前渲染器类型，切换类型时需要重建 visualizer */
let currentRendererKind = null;

// =====================================================================
// 各分类的「看点」文案：当效率对比表不适用时，右侧面板展示这些内容，
// 避免大片空白。键是分类 id。
// =====================================================================
const CATEGORY_INSIGHTS = {
  sort: {
    title: '比较排序的看点',
    body: '关注「比较次数」：同样是排 10 万个数，O(n²) 要算 100 亿次而 O(n log n) 只要 170 万次 —— 差 6000 倍。把规模拉到 120，点「对比全部算法」看得最直观。',
  },
  noncompare: {
    title: '非比较排序的看点',
    body: '统计区的「比较次数」始终是 0 —— 它们根本不做比较，靠计数、按位分配或分桶完成排序。代价是额外空间和对数据分布的要求。',
  },
  search: {
    title: '查找 / 二分的看点',
    body: '关注「候选区间怎么收窄」：每次折半排除一半，n 翻倍步数只加 1。数据分布选「完全逆序」可以看出二分对数据有序性的依赖。',
  },
  path: {
    title: '路径查找的看点',
    body: '同一张地图分别跑 BFS 和 DFS：BFS 用队列一圈圈规则扩散，找到的必然是最短路径；DFS 用栈一条道窜到底，路径通常不是最短。',
  },
  technique: {
    title: '基础技巧的看点',
    body: '这些技巧的共同点是「不搬数据，只维护指针和区间」。看双指针每一步排除了多少组合，看差分数组只在区间两端各标记一次。',
  },
  string: {
    title: '字符串算法的看点',
    body: 'KMP 看失配那一刻：主串指针 i 从不回退，只有 j 按 next 跳。Trie 看相同前缀如何共用一条路径。',
  },
  bits: {
    title: '位运算的看点',
    body: '切换与/或/异或，看逐位计算时高亮列怎么移动。注意左移一位等于乘 2，右移一位等于除以 2 向下取整。',
  },
  bignum: {
    title: '高精度的看点',
    body: '普通整数类型最多 19 位，高精度用数组存每一位、手工模拟竖式。看进位怎么从个位一路传到最高位。',
  },
  graph: {
    title: '图论算法的看点',
    body: 'Dijkstra 看每轮「确定哪个点」以及松弛怎么更新邻居；Kruskal 看边按权值从小到大试、成环就丢；Trie 看树形结构怎么长出来。',
  },
  structure: {
    title: '数据结构的看点',
    body: '栈是后进先出，队列是先进先出 —— 这正是 DFS 与 BFS 唯一的实现差别。括号匹配看栈顶怎么被逐个配对弹出。',
  },
};

// =====================================================================
// 页签
// =====================================================================

function switchTab(tabId) {
  dom.tabButtons.forEach((b) => {
    const on = b.dataset.tab === tabId;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  dom.panes.forEach((p) => {
    p.hidden = p.dataset.pane !== tabId;
  });
  // 切回可视化页时，画布尺寸可能变了（之前 hidden 时量不到宽度），让渲染器重算
  if (tabId === 'viz' && visualizer) {
    requestAnimationFrame(() => {
      visualizer.requestResize();
    });
  }
}

// =====================================================================
// 可视化：算法选择与运行
// =====================================================================

/** 根据当前分类填充算法下拉框。 */
function refreshAlgoOptions() {
  const ids = algorithmsByCategory(state.activeCategory);
  dom.algoSelect.innerHTML = ids
    .map((id) => `<option value="${id}">${ALGORITHMS[id].name} · ${ALGORITHMS[id].en}</option>`)
    .join('');
  if (!ids.includes(state.activeAlgo)) state.activeAlgo = ids[0];
  dom.algoSelect.value = state.activeAlgo;
}

/** 不同输入类型需要显示不同的控件。 */
function refreshControlsForAlgo() {
  const algo = ALGORITHMS[state.activeAlgo];
  const kind = algo.inputKind;

  // 数据规模：只有数组类/网格类才有意义
  const sizeRelevant = ['array', 'boundedArray', 'positArray', 'grid'].includes(kind);
  dom.sizeGroup.hidden = !sizeRelevant;

  // 数据分布：只有普通数组排序才有意义
  dom.shapeGroup.hidden = kind !== 'array';

  // 对比表只对可以横向比较的算法有意义（排序/非比较排序）
  // 其余分类显示「这一类的看点」面板，避免右侧大片空白
  const comparable = algo.category === 'sort' || algo.category === 'noncompare';
  dom.compareSection.hidden = !comparable;
  dom.comparePlaceholder.hidden = comparable;
  if (!comparable) renderPlaceholder(algo.category);

  // 规模范围按类型调整
  if (kind === 'grid') {
    dom.sizeRange.min = '8';
    dom.sizeRange.max = '40';
    dom.sizeRange.step = '2';
    if (Number(dom.sizeRange.value) > 40 || Number(dom.sizeRange.value) < 8) {
      dom.sizeRange.value = '18';
    }
    dom.sizeValue.textContent = dom.sizeRange.value;
  } else {
    dom.sizeRange.min = '8';
    dom.sizeRange.max = '120';
    dom.sizeRange.step = '2';
    if (Number(dom.sizeRange.value) < 8) dom.sizeRange.value = '40';
    dom.sizeValue.textContent = dom.sizeRange.value;
  }

  // 图例按渲染器切换
  const renderer = ALGORITHMS[state.activeAlgo].category;
  dom.legendBars.hidden = !(renderer === 'sort' || renderer === 'noncompare');
  dom.legendSearch.hidden = renderer !== 'search';
  dom.legendGrid.hidden = renderer !== 'path';
  dom.legendStructure.hidden = renderer !== 'structure';
  if (dom.legendSpan) dom.legendSpan.hidden = !(renderer === 'technique' || renderer === 'string' || renderer === 'bignum');
  if (dom.legendBits) dom.legendBits.hidden = renderer !== 'bits';
  if (dom.legendGraph) dom.legendGraph.hidden = renderer !== 'graph';
}

/** 统计区的标签随可视化类型变化（网格没有「交换次数」）。 */
function refreshStatLabels() {
  const algo = ALGORITHMS[state.activeAlgo];
  const cat = algo.category;
  if (cat === 'path') {
    dom.statPrimaryLabel.textContent = '访问格数';
    dom.statSecondaryLabel.textContent = '待访问';
    dom.statTertiaryLabel.textContent = '路径长度';
  } else if (cat === 'search') {
    dom.statPrimaryLabel.textContent = '比较次数';
    dom.statSecondaryLabel.textContent = '探测次数';
    dom.statTertiaryLabel.textContent = '剩余候选';
  } else if (cat === 'structure') {
    dom.statPrimaryLabel.textContent = '入栈/入队';
    dom.statSecondaryLabel.textContent = '出栈/出队';
    dom.statTertiaryLabel.textContent = '当前大小';
  } else if (cat === 'technique' || cat === 'string') {
    dom.statPrimaryLabel.textContent = '比较/判断';
    dom.statSecondaryLabel.textContent = '步骤';
    dom.statTertiaryLabel.textContent = '累加值';
  } else if (cat === 'bits') {
    dom.statPrimaryLabel.textContent = '逐位运算';
    dom.statSecondaryLabel.textContent = '操作数';
    dom.statTertiaryLabel.textContent = '结果位';
  } else if (cat === 'graph') {
    dom.statPrimaryLabel.textContent = '访问点数';
    dom.statSecondaryLabel.textContent = '待处理';
    dom.statTertiaryLabel.textContent = '松弛/选边';
  } else if (cat === 'bignum') {
    dom.statPrimaryLabel.textContent = '已处理位数';
    dom.statSecondaryLabel.textContent = '进位/借位';
    dom.statTertiaryLabel.textContent = '结果位数';
  } else {
    dom.statPrimaryLabel.textContent = '比较次数';
    dom.statSecondaryLabel.textContent = '交换次数';
    dom.statTertiaryLabel.textContent = '写入次数';
  }
}

/**
 * 把算法返回值统一成「可渲染的结果对象」。
 *
 * 为什么需要归一化：
 *   排序/查找/寻路类的 run() 直接返回 { kind, operations, ... }；
 *   基础技巧与字符串类的 run() 返回 { tracer, ... }（方便测试直接取用中间数据）。
 * 这里统一收口，避免每个调用点都写一遍判断。
 *
 * 注意出口方法名不统一：BitTracer 用 build()（因为 result() 被占用为「记录结果行」），
 * 其余 Tracer 用 result()。所以两个都要试。
 */
function normalizeResult(raw) {
  if (!raw) return raw;
  if (raw.operations) return raw;           // 已经是结果对象
  if (raw.tracer) {
    const tr = raw.tracer;
    return typeof tr.build === 'function' ? tr.build() : tr.result();
  }
  return raw;
}

/** 运行当前算法，重建渲染器（渲染器类型可能变了）。 */
function runCurrentAlgorithm(reuseInput = false) {
  player.pause();
  const algo = ALGORITHMS[state.activeAlgo];

  // 准备输入
  if (!reuseInput || !state.lastInput) {
    const size = Number(dom.sizeRange.value);
    const shape = dom.shapeSelect.value;
    const config = { size, shape, rows: size, cols: size * 2 };
    const { input, options } = buildInput(algo, config);
    state.lastInput = input;
    state.lastOptions = options;
  }

  const raw = algo.run(state.lastInput, state.lastOptions);
  const result = normalizeResult(raw);

  // 排序类渲染器需要一个「原始数组」作为重置基准
  if (result.kind === 'array') result.baseArray = state.lastInput.slice();
  state.result = result;

  // 渲染器类型变化时重建播放器与可视化器。
  // 注意：重建后不要立刻 requestResize() —— 那时视觉化器还没 load 数据，
  // draw() 会读到 undefined。先 load，再让基类去重算尺寸。
  const kind = rendererKindOf(algo);
  if (kind !== currentRendererKind) {
    visualizer = createVisualizer(kind, dom.canvas);
    player = new Player(visualizer);
    bindVisualizerEvents();
    currentRendererKind = kind;
  }

  visualizer.load(result);
  visualizer.requestResize();   // 尺寸可能在页签隐藏时变成 0，这里补一次
  updateAlgorithmInfo(algo);
  refreshStatLabels();
  updateStatsUI();
}

function rendererKindOf(algo) {
  const cat = CATEGORIES.find((c) => c.id === algo.category);
  return cat ? cat.renderer : 'bars';
}

function updateAlgorithmInfo(algo) {
  dom.algoName.textContent = algo.name;
  dom.algoEn.textContent = algo.en;
  dom.algoTime.textContent = algo.complexity.time;
  dom.algoSpace.textContent = algo.complexity.space;
  dom.algoBlurb.textContent = algo.blurb;

  // 稳定性只对排序有意义
  const isSort = algo.category === 'sort' || algo.category === 'noncompare';
  dom.algoStableWrap.hidden = !isSort || algo.stable === undefined;
  if (isSort && algo.stable !== undefined) {
    dom.algoStable.textContent = algo.stable ? '稳定' : '不稳定';
    dom.algoStable.className = 'badge ' + (algo.stable ? 'badge-ok' : 'badge-warn');
  }

  renderSyntaxLinks(algo);
}

/**
 * 渲染「这一类的看点」面板。
 *
 * 效率对比表只对排序类有意义；图论、高精度、Trie 这些分类没有可比的指标，
 * 之前右侧会整块隐藏，留下大片空白。现在改为展示：
 *   1. 这个分类的看点说明（怎么观察动画、关注什么指标）
 *   2. 本分类全部算法的标签（点击可跳转）
 */
function renderPlaceholder(categoryId) {
  const insight = CATEGORY_INSIGHTS[categoryId];
  if (!insight) { dom.comparePlaceholder.hidden = true; return; }

  dom.placeholderTitle.textContent = insight.title;
  dom.placeholderBody.textContent = insight.body;

  const ids = algorithmsByCategory(categoryId);
  dom.placeholderAlgos.innerHTML = ids
    .map((id) => `<button class="syntax-chip chip-algo" data-algo="${id}">${ALGORITHMS[id].name}</button>`)
    .join('');
  dom.placeholderAlgos.querySelectorAll('[data-algo]').forEach((btn) => {
    btn.addEventListener("click", () => openAlgo(btn.dataset.algo));
  });
}

/** 算法 → C++ 语法点的跳转链接。 */
function renderSyntaxLinks(algo) {
  const topics = algo.cppTopics || [];
  if (topics.length === 0) {
    dom.syntaxLinks.innerHTML = '<span class="muted">（这个算法没有关联语法点）</span>';
  } else {
    dom.syntaxLinks.innerHTML = topics
      .map((id) => {
        const t = CPP_TOPIC_BY_ID[id];
        if (!t) return '';
        return `<button class="syntax-chip" data-topic="${id}" title="查看「${t.title}」">${t.title}</button>`;
      })
      .join('');
    dom.syntaxLinks.querySelectorAll('[data-topic]').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchTab('syntax');
        selectTopic(btn.dataset.topic);
      });
    });
  }

  // 这个算法对应的 C++ 实现（供对照阅读）
  const cppImpl = CPP_ALGO_BY_ALGO_ID[algo.id];
  if (cppImpl && dom.algoCpp) {
    dom.algoCpp.innerHTML =
      `<pre class="code-block code-cpp">${escapeHtml(cppImpl.code)}</pre>` +
      renderCppOutputHtml(cppImpl);
  } else if (dom.algoCpp) {
    dom.algoCpp.innerHTML = '<span class="muted">（暂无这个算法的 C++ 实现）</span>';
  }

  // 洛谷练习入口
  const links = (cppImpl && cppImpl.luogu) || [];
  const problems = (cppImpl && cppImpl.problems) || [];
  renderLuogu(dom.algoLuogu, links, problems);
}

/** 生成 C++ 输出的 HTML（供多个位置复用）。 */
function renderCppOutputHtml(item) {
  const parts = [];
  if (item.outputOk) {
    parts.push(
      '<div class="cpp-output-head">' +
      '<span class="cpp-badge cpp-badge-ok">已编译运行</span>' +
      `<span class="cpp-meta">${escapeHtml(CPP_BUILD_META.compiler)} 的实际输出</span></div>`
    );
    parts.push(`<pre class="cpp-stdout">${escapeHtml(item.output || '（无输出）')}</pre>`);
  } else {
    parts.push(
      '<div class="cpp-output-head">' +
      '<span class="cpp-badge cpp-badge-err">未通过编译</span></div>'
    );
    parts.push(`<pre class="cpp-stdout cpp-stderr">${escapeHtml(item.outputError || '（无错误信息）')}</pre>`);
  }
  return parts.join('');
}

/** 统计数字更新。不同可视化类型显示不同的三项。 */
function updateStatsUI() {
  if (!visualizer) return;
  const s = visualizer.stats;
  const algo = ALGORITHMS[state.activeAlgo];
  const cat = algo.category;

  if (cat === 'path') {
    dom.statComparisons.textContent = (visualizer.visited ? visualizer.visited.size : 0).toLocaleString();
    dom.statSwaps.textContent = (visualizer.frontier ? visualizer.frontier.size : 0).toLocaleString();
    dom.statWrites.textContent = (visualizer.pathSet ? visualizer.pathSet.size : 0).toLocaleString();
  } else if (cat === 'search') {
    const remaining = visualizer.hi >= visualizer.lo ? visualizer.hi - visualizer.lo + 1 : 0;
    dom.statComparisons.textContent = (s.comparisons || 0).toLocaleString();
    dom.statSwaps.textContent = (s.visits || 0).toLocaleString();
    dom.statWrites.textContent = remaining.toLocaleString();
  } else if (cat === 'structure') {
    const size = visualizer.items ? visualizer.items.length : 0;
    dom.statComparisons.textContent = (s.writes || 0).toLocaleString();
    dom.statSwaps.textContent = (s.writes || 0).toLocaleString();
    dom.statWrites.textContent = size.toLocaleString();
  } else if (cat === 'technique' || cat === 'string') {
    // 指针类算法：关心比较次数、累加步骤、以及最近一次的累加值
    const acc = visualizer.accumulates || {};
    const accValues = Object.values(acc);
    const lastAcc = accValues.length > 0 ? accValues[accValues.length - 1].value : 0;
    dom.statComparisons.textContent = (s.comparisons || 0).toLocaleString();
    dom.statSwaps.textContent = (s.steps || 0).toLocaleString();
    dom.statWrites.textContent = typeof lastAcc === 'number' ? lastAcc.toLocaleString() : String(lastAcc);
  } else if (cat === 'bits') {
    // 位运算：逐位计算的次数、结果行已算出的位数
    const resultRow = (visualizer.rows && visualizer.rows[2]) || null;
    const knownBits = resultRow ? resultRow.bits.filter((b) => b !== null).length : 0;
    dom.statComparisons.textContent = (s.steps || 0).toLocaleString();
    dom.statSwaps.textContent = (visualizer.rows ? visualizer.rows.length : 0).toLocaleString();
    dom.statWrites.textContent = knownBits.toLocaleString();
  } else if (cat === 'graph') {
    // 图论：访问的点数、待处理集合大小、松弛/选边计数
    dom.statComparisons.textContent = (visualizer.visited ? visualizer.visited.size : 0).toLocaleString();
    dom.statSwaps.textContent = (visualizer.frontier ? visualizer.frontier.size : 0).toLocaleString();
    dom.statWrites.textContent = (s.writes || 0).toLocaleString();
  } else if (cat === 'bignum') {
    // 高精度：用 stats 里的 writes（逐位写）与 steps（进位次数）近似表示
    dom.statComparisons.textContent = (s.steps || 0).toLocaleString();
    dom.statSwaps.textContent = (s.writes || 0).toLocaleString();
    // 结果位数：从 span 的 accumulates 里取最后的值，或退回 0
    const acc = visualizer.accumulates || {};
    const vals = Object.values(acc);
    const lastVal = vals.length > 0 ? vals[vals.length - 1].value : 0;
    dom.statWrites.textContent = (typeof lastVal === 'number' ? lastVal : 0).toLocaleString();
  } else {
    dom.statComparisons.textContent = (s.comparisons || 0).toLocaleString();
    dom.statSwaps.textContent = (s.swaps || 0).toLocaleString();
    dom.statWrites.textContent = (s.writes || 0).toLocaleString();
  }

  const total = visualizer.total;
  const cursor = visualizer.cursor;
  dom.stepLabel.textContent = `${cursor.toLocaleString()} / ${total.toLocaleString()}`;
  dom.progress.style.width = `${(visualizer.progress * 100).toFixed(1)}%`;

  const finished = visualizer.finished;
  dom.playLabel.textContent = player.playing ? '暂停' : finished && total > 0 ? '重播' : '播放';
  dom.playIcon.textContent = player.playing ? '❚❚' : '▶';

  // ---- 当前步骤详解 ----
  // 各渲染器维护的字段名不同（span 是 lastNote/lastCheckNote，
  // graph 是 lastNote/lastDetail，bars/bits/structure 只有 lastNote）。
  // 这里按优先级聚合，把最有信息量的一句常驻显示。
  const v = visualizer;
  let mainText = "";
  let subText = "";
  if (v.lastCheckNote) { mainText = v.lastCheckNote; }
  else if (v.lastDetail) { mainText = v.lastDetail; }
  else if (v.lastNote) { mainText = v.lastNote; }
  else if (v.bucketLabel) { mainText = v.bucketLabel; }
  else if (v.narrowReason) { mainText = v.narrowReason; }
  else if (v.answerNote) { mainText = v.answerNote; }
  else if (v.windowLabel) { mainText = v.windowLabel; }

  if (v.lastNote && v.lastNote !== mainText) { subText = v.lastNote; }
  else if (v.lastCheckNote && v.lastCheckNote !== mainText) { subText = v.lastCheckNote; }
  else if (v.windowLabel && v.windowLabel !== mainText) { subText = v.windowLabel; }

  dom.stepDetailMain.textContent = mainText || "点击播放或单步，这里会解释当前这一步在做什么";
  dom.stepDetailSub.textContent = subText;
}

function bindVisualizerEvents() {
  visualizer.onStats(() => updateStatsUI());
  visualizer.onFinish(() => updateStatsUI());
  // 播放器每次重建都要重新挂上状态回调，否则按钮文字不会跟着变
  player.onStateChange = () => updateStatsUI();
}

// =====================================================================
// 对比表
// =====================================================================

function renderComparison() {
  const rows = [];
  const comparableIds = algorithmsByCategory(state.activeCategory);

  for (const id of comparableIds) {
    const algo = ALGORITHMS[id];
    // 用同一组数据跑一遍 —— 这正是「算法层只产出序列」带来的便利
    const result = algo.run(state.lastInput, state.lastOptions);
    const expected = state.lastInput.slice().sort((a, b) => a - b);
    const correct = JSON.stringify(result.sorted) === JSON.stringify(expected);

    rows.push({
      id,
      name: algo.name,
      comparisons: result.stats.comparisons,
      swaps: result.stats.swaps,
      writes: result.stats.writes,
      steps: result.operations.length,
      correct,
    });
  }

  const maxComparisons = Math.max(...rows.map((r) => r.comparisons), 1);
  const sorted = rows.slice().sort((a, b) => a.comparisons - b.comparisons);

  dom.tableBody.innerHTML = sorted
    .map((r) => {
      const barPct = (r.comparisons / maxComparisons) * 100;
      const isCurrent = r.id === state.activeAlgo ? ' class="row-current"' : '';
      return `
        <tr${isCurrent}>
          <td>
            <span class="cell-name">${r.name}</span>
            ${r.correct ? '' : '<span class="badge badge-err">结果异常</span>'}
          </td>
          <td class="num">${r.comparisons.toLocaleString()}</td>
          <td class="num">${r.swaps.toLocaleString()}</td>
          <td class="num">${r.writes.toLocaleString()}</td>
          <td class="num">${r.steps.toLocaleString()}</td>
          <td class="bar-cell"><span class="bar" style="width:${barPct.toFixed(1)}%"></span></td>
        </tr>`;
    })
    .join('');

  const allCorrect = rows.every((r) => r.correct);
  dom.btnCompare.textContent = allCorrect ? '✓ 已对比（结果全部正确）' : '⚠ 对比完成（有异常）';
  dom.btnCompare.classList.toggle('btn-ok', allCorrect);
  setTimeout(() => {
    dom.btnCompare.textContent = '对比全部算法';
    dom.btnCompare.classList.remove('btn-ok');
  }, 2500);
}

// =====================================================================
// 语法教程
// =====================================================================

function renderSyntaxNav(filter = '') {
  const kw = filter.trim().toLowerCase();
  let html = '';
  let count = 0;
  let total = 0;

  for (const group of CPP_GROUPS) {
    total += group.topics.length;
    const matched = group.topics.filter((t) => {
      if (!kw) return true;
      return (
        t.title.toLowerCase().includes(kw) ||
        t.summary.toLowerCase().includes(kw) ||
        t.id.toLowerCase().includes(kw)
      );
    });
    if (matched.length === 0) continue;
    count += matched.length;
    html += `<div class="nav-group"><div class="nav-group-title">${group.name}</div>`;
    for (const t of matched) {
      const on = t.id === state.activeTopic ? ' is-active' : '';
      html += `<button class="nav-item${on}" data-topic="${t.id}">${t.title}</button>`;
    }
    html += '</div>';
  }

  dom.syntaxNav.innerHTML = html || '<div class="nav-group"><div class="nav-group-title">没有匹配的知识点</div></div>';
  dom.syntaxCount.textContent = `${count} / ${total}`;

  dom.syntaxNav.querySelectorAll('[data-topic]').forEach((btn) => {
    btn.addEventListener('click', () => selectTopic(btn.dataset.topic));
  });
}

function selectTopic(topicId) {
  const topic = CPP_TOPIC_BY_ID[topicId];
  if (!topic) return;
  state.activeTopic = topicId;

  // 左侧高亮
  dom.syntaxNav.querySelectorAll('[data-topic]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.topic === topicId);
  });

  dom.syntaxTitle.textContent = topic.title;
  dom.syntaxSummary.textContent = topic.summary;
  dom.syntaxPoints.innerHTML = topic.points.map((p) => `<li>${escapeHtml(p)}</li>`).join('');
  dom.syntaxCode.textContent = topic.code;

  // 「哪些算法用到了它」反向关联（用 C++ 知识点 id 去匹配算法的 cppTopics）
  const usedBy = ALGORITHM_ORDER.filter((id) => (ALGORITHMS[id].cppTopics || []).includes(topicId));
  if (usedBy.length === 0) {
    dom.syntaxUsedBy.innerHTML = '<span class="muted">（暂无算法关联到这个知识点）</span>';
  } else {
    dom.syntaxUsedBy.innerHTML = usedBy
      .map((id) => `<button class="syntax-chip chip-algo" data-algo="${id}">${ALGORITHMS[id].name}</button>`)
      .join('');
    dom.syntaxUsedBy.querySelectorAll('[data-algo]').forEach((btn) => {
      btn.addEventListener('click', () => openAlgo(btn.dataset.algo));
    });
  }

  // 展示真实输出（构建期编译得到的）
  renderCppOutput(dom.syntaxOutput, topic);

  // 洛谷练习入口
  renderLuogu(dom.syntaxLuogu, topic.luogu, topic.problems);
}

/**
 * 展示 C++ 示例的输出。
 *
 * 必须诚实：浏览器不能编译 C++，这里显示的是**构建期预先编译运行**录下来的结果。
 * 所以输出区上方会明确标注编译器与「不能在此重新运行」。
 * 如果该示例编译失败，也如实展示错误，而不是假装有输出。
 */
function renderCppOutput(container, topic) {
  if (!container) return;
  const html = [];

  if (topic.outputOk) {
    html.push(
      '<div class="cpp-output-head">' +
      `<span class="cpp-badge cpp-badge-ok">已编译运行</span>` +
      `<span class="cpp-meta">输出由 ${escapeHtml(CPP_BUILD_META.compiler)} 实际运行得到` +
      (CPP_BUILD_META.compilerVersion ? `（${escapeHtml(CPP_BUILD_META.compilerVersion)}）` : '') +
      '</span></div>'
    );
    html.push(`<pre class="cpp-stdout">${escapeHtml(topic.output || '（程序没有输出）')}</pre>`);
  } else {
    html.push(
      '<div class="cpp-output-head">' +
      '<span class="cpp-badge cpp-badge-err">未通过编译</span>' +
      '<span class="cpp-meta">这个示例在构建时没有通过编译，下面是编译器的报错</span></div>'
    );
    html.push(`<pre class="cpp-stdout cpp-stderr">${escapeHtml(topic.outputError || '（无错误信息）')}</pre>`);
  }

  html.push(
    '<p class="cpp-note">浏览器无法编译 C++，因此这里是构建时预先编译运行的结果，' +
    '不能在此页面重新运行。要自己改着试，可以把代码复制到本地或在线编译器中运行。</p>'
  );

  container.innerHTML = html.join('');
}

/** 切到可视化页并加载指定算法。 */
function openAlgo(algoId) {
  state.activeCategory = ALGORITHMS[algoId].category;
  state.activeAlgo = algoId;
  dom.categorySelect.value = state.activeCategory;
  refreshAlgoOptions();
  refreshControlsForAlgo();
  state.lastInput = null;
  runCurrentAlgorithm();
  switchTab('viz');
  setTimeout(() => player.play(), 300);
}

/**
 * 渲染洛谷练习区。
 *
 * 现在展示的是**具体题目**（题号 + 标题 + 直达链接），而不是搜索入口。
 * 数据来自 src/syntax/problems.js，题号与链接都经过 tests/verify-problems-online.js
 * 联网核验（页面可访问 + 标题与题号自洽）。
 *
 * 同时保留题单入口，方便顺着官方题单系统练习。
 */
function renderLuogu(container, topicOrLinks, maybeProblems) {
  if (!container) return;

  // 兼容两种调用：renderLuogu(el, links) 与 renderLuogu(el, links, problems)
  const links = Array.isArray(topicOrLinks) ? topicOrLinks : [];
  const problems = maybeProblems || [];

  const html = [];

  // ---- 精选真题 ----
  if (problems.length > 0) {
    html.push('<div class="luogu-group">');
    html.push('<span class="luogu-label">精选真题</span>');
    html.push('<ul class="problem-list">');
    html.push(problems.map((p) => `
      <li class="problem-item">
        <a class="problem-link" href="${p.url}" target="_blank" rel="noopener noreferrer">
          <span class="problem-id">${escapeHtml(p.id)}</span>
          <span class="problem-title">${escapeHtml(p.title)}</span>
        </a>
      </li>`).join(''));
    html.push('</ul>');
    html.push('</div>');
  }

  // ---- 搜索入口（补充） ----
  if (links.length > 0) {
    html.push('<div class="luogu-group"><span class="luogu-label">按关键词搜题</span>');
    html.push('<div class="luogu-links">');
    html.push(links.map((l) =>
      `<a class="luogu-link" href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)} ↗</a>`
    ).join(''));
    html.push('</div></div>');
  }

  // ---- 题单入口 ----
  const training = LUOGU_TRAINING_SETS.length > 0
    ? LUOGU_TRAINING_SETS.map((s) => ({ label: s.name, url: s.url }))
    : luoguTrainingLinks();

  html.push('<div class="luogu-group"><span class="luogu-label">配套题单</span>');
  html.push('<div class="luogu-links">');
  html.push(training.map((l) =>
    `<a class="luogu-link luogu-link-alt" href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)} ↗</a>`
  ).join(''));
  html.push('</div></div>');

  html.push('<p class="luogu-note">题目链接均已核验可访问。' +
    '这些题单是《深入浅出程序设计竞赛》的配套题单（洛谷官方题单 100-105）。</p>');

  container.innerHTML = html.join('');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// =====================================================================
// 事件绑定
// =====================================================================

function bindEvents() {
  // 页签
  dom.tabButtons.forEach((b) => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });

  // 分类切换
  dom.categorySelect.addEventListener('change', (e) => {
    state.activeCategory = e.target.value;
    refreshAlgoOptions();
    refreshControlsForAlgo();
    state.lastInput = null;
    runCurrentAlgorithm();
  });

  // 算法切换
  dom.algoSelect.addEventListener('change', (e) => {
    state.activeAlgo = e.target.value;
    state.lastInput = null;
    refreshControlsForAlgo();
    runCurrentAlgorithm();
  });

  // 数据规模
  dom.sizeRange.addEventListener('input', (e) => {
    dom.sizeValue.textContent = e.target.value;
  });
  dom.sizeRange.addEventListener('change', () => {
    state.lastInput = null;
    runCurrentAlgorithm();
  });

  // 数据分布
  dom.shapeSelect.addEventListener('change', () => {
    state.lastInput = null;
    runCurrentAlgorithm();
  });

  // 速度
  dom.speedRange.addEventListener('input', (e) => {
    const v = Number(e.target.value);
    player.setSpeed(v);
    dom.speedValue.textContent = `${v} 步/秒`;
  });

  dom.btnGenerate.addEventListener('click', () => {
    state.lastInput = null;
    runCurrentAlgorithm();
  });

  dom.btnPlay.addEventListener('click', () => {
    if (!visualizer || visualizer.total === 0) return;
    player.toggle();
    updateStatsUI();
  });

  dom.btnStep.addEventListener('click', () => {
    if (!visualizer || visualizer.finished) return;
    player.stepOnce();
  });

  dom.btnSkip.addEventListener('click', () => {
    if (!visualizer) return;
    player.pause();
    visualizer.finish();
    updateStatsUI();
  });

  dom.btnReset.addEventListener('click', () => {
    if (!visualizer) return;
    player.pause();
    visualizer.reset();
    updateStatsUI();
  });

  dom.btnCompare.addEventListener('click', () => {
    if (!state.lastInput) return;
    renderComparison();
  });

  // 语法搜索
  dom.syntaxSearch.addEventListener('input', (e) => renderSyntaxNav(e.target.value));

  // 重新运行示例
  // 「重新运行」按钮改为提示：浏览器无法编译 C++，输出是构建期录制的
  if (dom.syntaxRun) {
    dom.syntaxRun.addEventListener('click', () => {
      dom.syntaxRun.textContent = '浏览器无法编译 C++';
      dom.syntaxRun.disabled = true;
      setTimeout(() => {
        dom.syntaxRun.textContent = '输出为构建期录制';
        dom.syntaxRun.disabled = false;
      }, 2000);
    });
    dom.syntaxRun.textContent = '输出为构建期录制';
  }

  // 快捷键
  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
    // 语法页里空格不该触发播放
    const onViz = !document.querySelector('[data-pane="viz"]').hidden;
    if (!onViz) return;

    if (e.code === 'Space') {
      e.preventDefault();
      dom.btnPlay.click();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      dom.btnStep.click();
    } else if (e.code === 'Home') {
      e.preventDefault();
      dom.btnReset.click();
    }
  });
}

// =====================================================================
// 初始化
// =====================================================================

function init() {
  // 分类下拉框
  dom.categorySelect.innerHTML = CATEGORIES.map(
    (c) => `<option value="${c.id}">${c.name}</option>`
  ).join('');
  dom.categorySelect.value = state.activeCategory;

  refreshAlgoOptions();
  refreshControlsForAlgo();

  // 先建一个渲染器，之后 runCurrentAlgorithm 会按需重建
  visualizer = createVisualizer(rendererKindOf(ALGORITHMS[state.activeAlgo]), dom.canvas);
  player = new Player(visualizer);
  bindVisualizerEvents();
  currentRendererKind = rendererKindOf(ALGORITHMS[state.activeAlgo]);

  dom.speedValue.textContent = `${dom.speedRange.value} 步/秒`;
  player.setSpeed(Number(dom.speedRange.value));

  bindEvents();

  // 语法教程：默认选第一个知识点
  renderSyntaxNav();
  selectTopic(CPP_GROUPS[0].topics[0].id);

  runCurrentAlgorithm();

  // 首屏自动播一次，让人一眼看到「它在动」。
  // 延迟一点是为了等布局完成，避免画布在尺寸还是 0 的时候就开始画。
  setTimeout(() => {
    if (visualizer) visualizer.requestResize();
    if (player) player.play();
  }, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
