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
import { pickSearchTarget } from '../algorithms/search.js';
import { generateGrid } from '../algorithms/path.js';

const RENDERERS = {
  bars: BarVisualizer,
  search: SearchVisualizer,
  grid: GridVisualizer,
  structure: StructureVisualizer,
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
      const n = 4;
      const arr = [];
      for (let i = 0; i < n; i++) arr.push(Math.floor(Math.random() * 60) + 40);
      return { input: arr, options: { pieces: 5 } };
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

    // 字符串：栈/队列演示的场景输入
    case 'text': {
      if (algo.id === 'stackDemo') {
        const samples = ['({[]})', '([)]', '((()))', '{[()]}', '(()'];
        return { input: [], options: { text: samples[Math.floor(Math.random() * samples.length)] } };
      }
      const taskSets = [
        ['渲染画面', '计算坐标', '播放动画', '清理临时值', '更新状态'],
        ['读取数据', '解析格式', '校验字段', '写入缓存', '通知界面'],
      ];
      return { input: [], options: { tasks: taskSets[Math.floor(Math.random() * taskSets.length)] } };
    }

    default:
      return { input: Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1), options: {} };
  }
}
