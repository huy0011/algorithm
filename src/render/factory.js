/**
 * 渲染器工厂 + 输入数据生成。
 *
 * 工厂的作用：界面只说「我要给二分查找换一组数据」，
 * 由这里决定用哪个渲染器、需要什么样的输入。
 * 界面代码因此不需要写一堆 if/else 去区分算法类型。
 */

import { BarVisualizer } from './bar-visualizer.js';
import { SearchVisualizer } from './search-visualizer.js';
import { GridVisualizer } from './grid-visualizer.js';
import { StructureVisualizer } from './structure-visualizer.js';
import { GraphVisualizer } from './graph-visualizer.js';
import { SpanVisualizer } from './span-visualizer.js';
import { BitVisualizer } from './bit-visualizer.js';
import { pickSearchTarget } from '../algorithms/search.js';
import { generateGrid } from '../algorithms/path.js';
import { makeWeightedGraph } from '../algorithms/graph.js';

const RENDERERS = {
  bars: BarVisualizer,
  search: SearchVisualizer,
  grid: GridVisualizer,
  structure: StructureVisualizer,
  graph: GraphVisualizer,
  span: SpanVisualizer,
  bits: BitVisualizer,
};

/** 根据渲染器类型创建可视化实例。 */
export function createVisualizer(kind, canvas) {
  const Ctor = RENDERERS[kind] || BarVisualizer;
  return new Ctor(canvas, null);
}

/**
 * 生成某个算法需要的输入数据。
 * @param {object} algo 算法描述对象
 * @param {object} config { size, shape, rows, cols }
 * @returns {object} 传给 algo.run(input, options) 的 { input, options }
 */
export function buildInput(algo, config = {}) {
  const size = config.size ?? 40;
  const shape = config.shape ?? 'random';

  switch (algo.inputKind) {
    // 普通数组：随机 / 接近有序 / 逆序 / 少量取值
    case 'array': {
      const arr = new Array(size);
      switch (shape) {
        case 'nearly': {
          for (let i = 0; i < size; i++) arr[i] = i + 1;
          const swaps = Math.max(1, Math.floor(size * 0.08));
          for (let s = 0; s < swaps; s++) {
            const i = Math.floor(Math.random() * size);
            const j = Math.floor(Math.random() * size);
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          break;
        }
        case 'reversed':
          for (let i = 0; i < size; i++) arr[i] = size - i;
          break;
        case 'few': {
          const palette = [12, 30, 48, 66, 84, 100];
          for (let i = 0; i < size; i++) arr[i] = palette[Math.floor(Math.random() * palette.length)];
          break;
        }
        default:
          for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 100) + 1;
      }
      return { input: arr, options: {} };
    }

    // 值域受限的数组：计数排序 / 桶排序需要
    case 'boundedArray': {
      const arr = new Array(size);
      // 值域控制在 0~60，让计数排序的计数格数量合理
      for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 61);
      return { input: arr, options: {} };
    }

    // 正整数数组：基数排序需要（位数不宜太多，否则轮次过长）
    case 'positArray': {
      const arr = new Array(size);
      for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 900) + 100;
      return { input: arr, options: {} };
    }

    // 有序数组 + 一个精心挑选的目标值（让折半过程看得见）
    case 'sortedArray': {
      const n = Math.min(31, Math.max(7, size));
      const arr = [];
      let v = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < n; i++) {
        arr.push(v);
        v += Math.floor(Math.random() * 6) + 2;
      }
      return { input: arr, options: { target: pickSearchTarget(arr) } };
    }

    // 绳子长度：二分答案的经典场景
    case 'ropes': {
      const n = config.ropes ?? 4;
      const arr = [];
      for (let i = 0; i < n; i++) arr.push(Math.floor(Math.random() * 60) + 40);
      // 切的段数随绳数走：绳多段也多，保持演示有意义
      return { input: arr, options: { pieces: Math.max(2, Math.round(n * 1.5)) } };
    }

    // 网格：寻路用
    case 'grid': {
      const rows = config.rows ?? 15;
      const cols = config.cols ?? 25;
      const grid = generateGrid(rows, cols, 0.26);
      return {
        input: grid,
        options: { start: [0, 0], end: [rows - 1, cols - 1] },
      };
    }

    // 小值域数组：滑动窗口需要较多重复值才能体现「收缩」的必要性
    case 'smallRangeArray': {
      const n = Math.min(24, Math.max(8, size));
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 5) + 1);
      return { input: arr, options: {} };
    }

    // 字符串对（主串 + 模式串）：KMP / 字符串哈希用
    case 'stringPair': {
      // 用 A/B/C 三个字符，刻意制造较多重复，才能看出 KMP 回退的价值
      const alphabet = 'AABBC';
      const textLen = config.size ?? 22;
      const patLen = config.patternLen ?? 4;
      const rand = (len) => Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
      const text = rand(textLen);
      const pattern = rand(patLen);
      return { input: [], options: { text, pattern } };
    }

    // 位运算：给两个 0~255 的整数
    case 'bits': {
      const ops = ['and', 'or', 'xor'];
      return {
        input: [],
        options: {
          a: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256),
          op: ops[Math.floor(Math.random() * ops.length)],
        },
      };
    }

    // 高精度：两个大数（字符串形式，位数远超整数类型上限）
    case 'bigNumbers': {
      const randBig = (len) => {
        const first = String(1 + Math.floor(Math.random() * 9));
        let rest = '';
        for (let i = 1; i < len; i++) rest += String(Math.floor(Math.random() * 10));
        return first + rest;
      };
      const lenA = config.digits ?? 20;
      const lenB = Math.max(5, Math.floor(lenA * 0.7));
      let a = randBig(lenA);
      let b = randBig(lenB);
      // 减法要求 a >= b，保证不出负数
      if (BigInt(a) < BigInt(b)) [a, b] = [b, a];
      return { input: [], options: { a, b } };
    }

    case 'bigNumbersSmall': {
      const randBig = (len) => {
        let s = String(1 + Math.floor(Math.random() * 9));
        for (let i = 1; i < len; i++) s += String(Math.floor(Math.random() * 10));
        return s;
      };
      const dl = config.digits ?? 5;
      return { input: [], options: { a: randBig(dl), b: randBig(Math.max(2, dl - 1)) } };
    }

    case 'factorial': {
      return { input: [], options: { n: config.size ?? 25 } };
    }

    // 图论：小规模带权图
    case 'graph': {
      const want = config.nodeCount ?? 6;
      const graph = makeWeightedGraph(Math.floor(Math.random() * 2), want);
      return { input: [], options: { graph, start: 0 } };
    }

    case 'dag': {
      // 有向无环：任务依赖。点数可调，边按「层间连边」生成保证无环
      const n = config.nodeCount ?? 6;
      const edges = [];
      for (let u = 0; u < n; u++) {
        // 每个点连到后面的 1~2 个点（只向后连，天然无环）
        const jumps = 1 + Math.floor(Math.random() * 2);
        for (let k = 0; k < jumps; k++) {
          const v = u + 1 + Math.floor(Math.random() * Math.max(1, (n - u) / 2));
          if (v < n && !edges.some(([a, b]) => a === u && b === v)) edges.push([u, v]);
        }
      }
      return { input: [], options: { n, edges } };
    }

    case 'words': {
      const sets = [
        ['apple', 'app', 'april', 'banana', 'bat', 'batch'],
        ['cat', 'car', 'card', 'care', 'dog', 'do'],
      ];
      const base = sets[Math.floor(Math.random() * sets.length)];
      // 按滑块取前 wordCount 个单词
      const words = base.slice(0, Math.max(1, config.wordCount ?? base.length));
      const queries = ['app', 'car', 'zzz'].filter((q) => q);
      return { input: [], options: { words, queries } };
    }

    // 字符串：栈/队列演示的场景输入
    case 'text': {
      if (algo.id === 'stackDemo') {
                const samples = [
          '({[()]})({[]})',            // 嵌套匹配（更长）
          '([)]{()}',                  // 交叉不匹配
          '((()))()[]{}((()))[]',      // 连续多组
          '{[()()]}{[()()]}{[()()]}',  // 三段嵌套
          '((((((()))))))',            // 深嵌套
          '(()()(((',                  // 少右括号
          '())(()))((',                // 顺序错乱
        ];
        let text = samples[Math.floor(Math.random() * samples.length)];
        const want = config.textLen ?? text.length;
        while (text.length < want) text += text;   // 复制扩展到目标长度
        text = text.slice(0, want);
        return { input: [], options: { text } };
      }
              const taskSets = [
          ['渲染画面', '计算坐标', '播放动画', '清理临时值', '更新状态', '加载资源', '保存进度', '发送通知'],
          ['读取数据', '解析格式', '校验字段', '写入缓存', '通知界面', '记录日志', '压缩备份', '释放内存'],
          ['接收请求', '验证参数', '查询数据库', '组装结果', '渲染模板', '设置响应头', '发送响应', '统计耗时'],
        ];
        const baseTasks = taskSets[Math.floor(Math.random() * taskSets.length)];
        const tasks = baseTasks.slice(0, Math.max(2, config.textLen ?? baseTasks.length));
        return { input: [], options: { tasks } };
    }

    default:
      return { input: Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1), options: {} };
  }
}
