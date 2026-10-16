/**
 * 入口层：串联 UI 控件 ↔ 算法层 ↔ 渲染层。
 *
 * 这一层是唯一同时了解三方的胶水代码。
 * 它的职责只有「把用户操作翻译成算法调用」和「把渲染状态翻译成界面文字」，
 * 本身不含任何算法逻辑，也不含任何绘制逻辑。
 */

import { ALGORITHMS, ALGORITHM_ORDER } from './algorithms/index.js';
import { Visualizer } from './render/visualizer.js';
import { Player } from './render/player.js';

// ---------- DOM 引用 ----------
const $ = (id) => document.getElementById(id);

const dom = {
  canvas: $('canvas'),
  algoSelect: $('algo-select'),
  sizeRange: $('size-range'),
  sizeValue: $('size-value'),
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
  algoName: $('algo-name'),
  algoEn: $('algo-en'),
  algoTime: $('algo-time'),
  algoSpace: $('algo-space'),
  algoBlurb: $('algo-blurb'),
  algoStable: $('algo-stable'),
  tableBody: $('compare-table-body'),
  btnCompare: $('btn-compare'),
  shapeSelect: $('shape-select'),
};

// ---------- 状态 ----------
const state = {
  array: [],
  algoId: 'bubble',
  result: null,
  /** 对比模式的结果缓存：algoId -> result */
  compareResults: new Map(),
};

let visualizer;
let player;

// ---------- 数组生成 ----------

/**
 * 生成数据。不同分布能让算法差异更明显：
 * random 随机、nearly 接近有序（插入排序的强项）、reversed 完全逆序（快排/冒泡的最坏情况）、
 * few 只有少量不同取值。
 */
function generateArray(size, shape) {
  const arr = new Array(size);
  switch (shape) {
    case 'nearly': {
      for (let i = 0; i < size; i++) arr[i] = i + 1;
      // 随机交换少量元素
      const swaps = Math.max(1, Math.floor(size * 0.08));
      for (let s = 0; s < swaps; s++) {
        const i = Math.floor(Math.random() * size);
        const j = Math.floor(Math.random() * size);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      break;
    }
    case 'reversed': {
      for (let i = 0; i < size; i++) arr[i] = size - i;
      break;
    }
    case 'few': {
      const palette = [12, 30, 48, 66, 84, 100];
      for (let i = 0; i < size; i++) {
        arr[i] = palette[Math.floor(Math.random() * palette.length)];
      }
      break;
    }
    case 'random':
    default: {
      for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 100) + 1;
      break;
    }
  }
  return arr;
}

// ---------- 运行算法 ----------

function runCurrentAlgorithm() {
  const algo = ALGORITHMS[state.algoId];
  const result = algo.run(state.array);
  state.result = result;
  visualizer.load(state.array, result);
  updateStatsUI();
  updateAlgorithmInfo(algo);
}

function updateAlgorithmInfo(algo) {
  dom.algoName.textContent = algo.name;
  dom.algoEn.textContent = algo.en;
  dom.algoTime.textContent = algo.complexity.time;
  dom.algoSpace.textContent = algo.complexity.space;
  dom.algoBlurb.textContent = algo.blurb;
  dom.algoStable.textContent = algo.stable ? '稳定' : '不稳定';
  dom.algoStable.className = 'badge ' + (algo.stable ? 'badge-ok' : 'badge-warn');
}

function updateStatsUI() {
  const s = visualizer.stats;
  dom.statComparisons.textContent = s.comparisons.toLocaleString();
  dom.statSwaps.textContent = s.swaps.toLocaleString();
  dom.statWrites.textContent = s.writes.toLocaleString();

  const total = visualizer.total;
  const cursor = visualizer.cursor;
  dom.stepLabel.textContent = `${cursor.toLocaleString()} / ${total.toLocaleString()}`;
  dom.progress.style.width = `${(visualizer.progress * 100).toFixed(1)}%`;

  const finished = visualizer.finished;
  dom.playLabel.textContent = player.playing ? '暂停' : finished && total > 0 ? '重播' : '播放';
  dom.playIcon.textContent = player.playing ? '❚❚' : '▶';
}

// ---------- 对比模式 ----------

/**
 * 用同一组数据跑全部算法，输出对比表。
 * 这正是「算法层只产出操作序列」带来的好处：
 * 对比只需要再调用一次 run()，不需要任何额外的可视化代码。
 */
function renderComparison() {
  state.compareResults.clear();
  const rows = [];

  for (const id of ALGORITHM_ORDER) {
    const algo = ALGORITHMS[id];
    const t0 = performance.now();
    const result = algo.run(state.array);
    const elapsed = performance.now() - t0;
    state.compareResults.set(id, result);

    // 校验：所有算法必须得到同一个有序结果，否则说明实现有 bug
    const expected = state.array.slice().sort((a, b) => a - b);
    const correct = result.sorted.length === expected.length &&
      result.sorted.every((v, i) => v === expected[i]);

    rows.push({
      id,
      name: algo.name,
      comparisons: result.stats.comparisons,
      swaps: result.stats.swaps,
      writes: result.stats.writes,
      steps: result.operations.length,
      elapsed,
      correct,
    });
  }

  // 按比较次数排序，直接体现效率差异
  const maxComparisons = Math.max(...rows.map((r) => r.comparisons), 1);
  const sortedByComparisons = rows.slice().sort((a, b) => a.comparisons - b.comparisons);

  dom.tableBody.innerHTML = sortedByComparisons
    .map((r) => {
      const barPct = (r.comparisons / maxComparisons) * 100;
      const isCurrent = r.id === state.algoId ? ' class="row-current"' : '';
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
          <td class="bar-cell">
            <span class="bar" style="width:${barPct.toFixed(1)}%"></span>
          </td>
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

// ---------- 事件绑定 ----------

function bindEvents() {
  // 算法切换
  dom.algoSelect.addEventListener('change', (e) => {
    state.algoId = e.target.value;
    player.pause();
    runCurrentAlgorithm();
    highlightTableRow();
  });

  // 数组规模
  dom.sizeRange.addEventListener('input', (e) => {
    dom.sizeValue.textContent = e.target.value;
  });
  dom.sizeRange.addEventListener('change', () => {
    regenerate();
  });

  // 速度
  dom.speedRange.addEventListener('input', (e) => {
    const v = Number(e.target.value);
    player.setSpeed(v);
    dom.speedValue.textContent = `${v} 步/秒`;
  });

  // 数据分布
  dom.shapeSelect.addEventListener('change', () => {
    regenerate();
  });

  // 生成新数组
  dom.btnGenerate.addEventListener('click', () => {
    regenerate();
  });

  // 播放 / 暂停
  dom.btnPlay.addEventListener('click', () => {
    if (visualizer.total === 0) return;
    player.toggle();
    updateStatsUI();
  });
  player.onStateChange = () => updateStatsUI();

  // 单步
  dom.btnStep.addEventListener('click', () => {
    if (visualizer.finished) return;
    player.stepOnce();
  });

  // 直接跳到结果
  dom.btnSkip.addEventListener('click', () => {
    player.pause();
    visualizer.finish();
    updateStatsUI();
  });

  // 重置
  dom.btnReset.addEventListener('click', () => {
    player.pause();
    visualizer.reset();
    updateStatsUI();
  });

  // 对比
  dom.btnCompare.addEventListener('click', () => {
    if (state.array.length === 0) return;
    renderComparison();
  });

  // 键盘快捷键：空格播放/暂停，方向键单步
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
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

function highlightTableRow() {
  const rows = dom.tableBody.querySelectorAll('tr');
  rows.forEach((tr) => tr.classList.remove('row-current'));
  // 表格行没有绑定 id，用按钮重新对比更直观，这里只做轻量提示
}

// ---------- 初始化 ----------

function regenerate() {
  player.pause();
  const size = Number(dom.sizeRange.value);
  const shape = dom.shapeSelect.value;
  state.array = generateArray(size, shape);
  runCurrentAlgorithm();
}

function init() {
  // 填充算法下拉框
  dom.algoSelect.innerHTML = ALGORITHM_ORDER
    .map((id) => `<option value="${id}">${ALGORITHMS[id].name} · ${ALGORITHMS[id].en}</option>`)
    .join('');
  dom.algoSelect.value = state.algoId;

  visualizer = new Visualizer(dom.canvas);
  player = new Player(visualizer);

  // 渲染层每次状态变化都回调这里，界面数字与画面天然同步
  visualizer.onStats((payload) => {
    dom.statComparisons.textContent = payload.stats.comparisons.toLocaleString();
    dom.statSwaps.textContent = payload.stats.swaps.toLocaleString();
    dom.statWrites.textContent = payload.stats.writes.toLocaleString();
    dom.stepLabel.textContent = `${payload.cursor.toLocaleString()} / ${payload.total.toLocaleString()}`;
    dom.progress.style.width = `${(payload.total === 0 ? 1 : payload.cursor / payload.total) * 100}%`;
    updateStatsUI();
  });
  visualizer.onFinish(() => updateStatsUI());

  player.setSpeed(Number(dom.speedRange.value));
  dom.speedValue.textContent = `${dom.speedRange.value} 步/秒`;

  bindEvents();
  regenerate();

  // 首屏自动播放一次，让人一眼看到「它在动」
  setTimeout(() => player.play(), 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
