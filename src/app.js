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
import { SYNTAX_GROUPS, SYNTAX_BY_ID } from './syntax/topics.js';
import { runExample, formatValue } from './syntax/runner.js';

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
  legendBars: $('legend-bars'),
  legendGrid: $('legend-grid'),
  legendSearch: $('legend-search'),
  legendStructure: $('legend-structure'),

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
  // 切回可视化页时，画布尺寸可能变了，让渲染器重绘
  if (tabId === 'viz' && visualizer) {
    requestAnimationFrame(() => {
      resizeCanvas();
      visualizer.draw();
    });
  }
}

function resizeCanvas() {
  if (!visualizer) return;
  const rect = dom.canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  dom.canvas.width = Math.floor(rect.width * dpr);
  dom.canvas.height = Math.floor(rect.height * dpr);
  visualizer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  visualizer.metrics.width = Math.max(1, Math.floor(rect.width));
  visualizer.metrics.height = Math.max(1, Math.floor(rect.height));
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
  const comparable = algo.category === 'sort' || algo.category === 'noncompare';
  dom.compareSection.hidden = !comparable;

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
  } else {
    dom.statPrimaryLabel.textContent = '比较次数';
    dom.statSecondaryLabel.textContent = '交换次数';
    dom.statTertiaryLabel.textContent = '写入次数';
  }
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

  const result = algo.run(state.lastInput, state.lastOptions);
  // 排序类渲染器需要一个「原始数组」作为重置基准
  if (result.kind === 'array') result.baseArray = state.lastInput.slice();
  state.result = result;

  // 渲染器类型变化时重建播放器与可视化器
  const kind = rendererKindOf(algo);
  if (kind !== currentRendererKind) {
    visualizer = createVisualizer(kind, dom.canvas);
    player = new Player(visualizer);
    bindVisualizerEvents();
    currentRendererKind = kind;
    resizeCanvas();
  }

  visualizer.load(result);
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

/** 算法 → 语法点的跳转链接。 */
function renderSyntaxLinks(algo) {
  const topics = algo.syntaxTopics || [];
  if (topics.length === 0) {
    dom.syntaxLinks.innerHTML = '<span class="muted">（这个算法没有关联语法点）</span>';
    return;
  }
  dom.syntaxLinks.innerHTML = topics
    .map((id) => {
      const t = SYNTAX_BY_ID[id];
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

  for (const group of SYNTAX_GROUPS) {
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
  dom.syntaxCount.textContent = `${count} / ${SYNTAX_GROUPS.reduce((a, g) => a + g.topics.length, 0)}`;

  dom.syntaxNav.querySelectorAll('[data-topic]').forEach((btn) => {
    btn.addEventListener('click', () => selectTopic(btn.dataset.topic));
  });
}

function selectTopic(topicId) {
  const topic = SYNTAX_BY_ID[topicId];
  if (!topic) return;
  state.activeTopic = topicId;

  // 左侧高亮
  dom.syntaxNav.querySelectorAll('[data-topic]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.topic === topicId);
  });

  dom.syntaxTitle.textContent = topic.title;
  dom.syntaxSummary.textContent = topic.summary;
  dom.syntaxPoints.innerHTML = topic.points.map((p) => `<li>${p}</li>`).join('');
  dom.syntaxCode.textContent = topic.code;

  // 「哪些算法用到了它」反向关联
  const usedBy = ALGORITHM_ORDER.filter((id) => (ALGORITHMS[id].syntaxTopics || []).includes(topicId));
  if (usedBy.length === 0) {
    dom.syntaxUsedBy.innerHTML = '<span class="muted">（暂无算法关联到这个知识点）</span>';
  } else {
    dom.syntaxUsedBy.innerHTML = usedBy
      .map((id) => `<button class="syntax-chip chip-algo" data-algo="${id}">${ALGORITHMS[id].name}</button>`)
      .join('');
    dom.syntaxUsedBy.querySelectorAll('[data-algo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const algoId = btn.dataset.algo;
        state.activeCategory = ALGORITHMS[algoId].category;
        state.activeAlgo = algoId;
        dom.categorySelect.value = state.activeCategory;
        refreshAlgoOptions();
        refreshControlsForAlgo();
        state.lastInput = null;
        runCurrentAlgorithm();
        switchTab('viz');
        setTimeout(() => player.play(), 300);
      });
    });
  }

  // 自动运行示例，直接显示真实输出
  executeTopicCode();
}

/** 运行当前知识点的示例代码并展示输出。 */
function executeTopicCode() {
  const topic = SYNTAX_BY_ID[state.activeTopic];
  if (!topic) return;

  dom.syntaxOutput.innerHTML = '<div class="out-loading">运行中…</div>';

  // 用 setTimeout 让「运行中」有机会渲染出来（示例都是瞬间完成的同步代码）
  setTimeout(() => {
    const r = runExample(topic.code);
    let html = '';

    if (r.logs && r.logs.length > 0) {
      html += r.logs
        .map((l) => `<div class="out-line out-${l.level}"><span class="out-tag">console.${l.level}</span>${escapeHtml(l.text)}</div>`)
        .join('');
    }

    if (r.ok) {
      html += `<div class="out-line out-return"><span class="out-tag">return</span><pre>${escapeHtml(formatValue(r.value))}</pre></div>`;
    } else {
      html += `<div class="out-line out-error"><span class="out-tag">${escapeHtml(r.errorName || 'Error')}</span>${escapeHtml(r.error)}</div>`;
    }

    dom.syntaxOutput.innerHTML = html || '<div class="out-line">（没有输出）</div>';
  }, 10);
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
  dom.syntaxRun.addEventListener('click', () => executeTopicCode());

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
  selectTopic(SYNTAX_GROUPS[0].topics[0].id);

  runCurrentAlgorithm();

  // 首屏自动播一次，让人一眼看到「它在动」
  setTimeout(() => {
    resizeCanvas();
    if (player) player.play();
  }, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
