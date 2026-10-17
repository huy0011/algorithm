/**
 * 基础数据结构演示：栈、队列。
 *
 * 这两个是理解 BFS / DFS 的前置知识：
 *   BFS 用队列（先进先出）→ 一层层扩散
 *   DFS 用栈（后进先出）  → 一路走到底
 * 所以把它们单独做出来，让「队列和栈到底差在哪」先看清楚。
 *
 * 演示内容选了两个经典问题，而不只是机械地 push/pop：
 *   栈 → 括号匹配
 *   队列 → 滑动窗口式的任务依次处理
 */

import { StructureTracer } from './tracer.js';

/**
 * 栈演示：括号匹配。
 * 左括号入栈，右括号时检查栈顶是否为对应的左括号。
 */
function stackDemo(input = [], options = {}) {
  const text = options.text ?? '({[]})';
  const t = new StructureTracer('stack', {
    title: '栈 · 括号匹配',
    text,
    explain: '遇到左括号就入栈；遇到右括号就检查栈顶是否为对应的左括号。',
  });

  const pairs = { ')': '(', ']': '[', '}': '{' };
  const opens = new Set(['(', '[', '{']);

  let charIndex = 0;
  for (const ch of text) {
    t.progress(charIndex++);
    if (opens.has(ch)) {
      t.push(ch, `左括号 ${ch} 入栈`);
    } else if (pairs[ch]) {
      const top = t.peek('先看一眼栈顶是什么');
      if (top === pairs[ch]) {
        t.pop(`栈顶 ${top} 与 ${ch} 匹配，弹出`);
      } else {
        t.verdict(false, `${ch} 需要匹配 ${pairs[ch]}，但栈顶是 ${top === undefined ? '空的' : top} → 不匹配`);
        return t.result();
      }
    }
  }

  if (t.items.length === 0) {
    t.verdict(true, '扫描完毕，栈为空 → 括号完全匹配');
  } else {
    t.verdict(false, `扫描完毕但栈里还剩 ${t.items.length} 个左括号没被匹配 → 不匹配`);
  }
  return t.result();
}

/**
 * 队列演示：任务依次入队、依次处理。
 * 直观展示「先进先出」——先来的任务先被服务。
 */
function queueDemo(input = [], options = {}) {
  const tasks = options.tasks ?? ['渲染画面', '计算坐标', '播放动画', '清理临时值'];
  const t = new StructureTracer('queue', {
    title: '队列 · 任务调度',
    explain: '任务从队尾进入，从队头取出处理。先来的先被服务，这就是「先进先出」。',
  });

  // 先把一部分任务放进队列（模拟积压）
  const half = Math.max(1, Math.floor(tasks.length / 2));
  for (let i = 0; i < half; i++) {
    t.push(tasks[i], `任务「${tasks[i]}」入队尾`);
  }

  let next = half;
  let round = 0;
  while (true) {
    t.progress(next);   // 输入条高亮"下一个要来的任务"
    const done = t.dequeue(`从队头取出任务处理`);
    if (done === undefined) break;
    round++;
    t.verdict(true, `第 ${round} 个完成：${done}`);
    // 处理完一个之后，可能又来了新任务
    if (next < tasks.length) {
      t.push(tasks[next], `新任务「${tasks[next]}」入队尾`);
      next++;
    }
  }

  t.verdict(true, `队列已清空，共处理 ${round} 个任务`);
  return t.result();
}

export const STRUCTURE_ALGORITHMS = {
  stackDemo: {
    id: 'stackDemo',
    name: '栈 · 括号匹配',
    en: 'Stack',
    category: 'structure',
    complexity: { time: 'O(n)', space: 'O(n)' },
    blurb: '后进先出（LIFO）。只允许在栈顶进出，所以最后放进去的最先被取出。DFS 正是靠它实现「一路走到底」。',
    inputKind: 'text',
    run: stackDemo,
    syntaxTopics: ['for-of', 'set-map', 'object-literal'],
  },
  queueDemo: {
    id: 'queueDemo',
    name: '队列 · 任务调度',
    en: 'Queue',
    category: 'structure',
    complexity: { time: 'O(n)', space: 'O(n)' },
    blurb: '先进先出（FIFO）。从队尾进、从队头出，先来的先被服务。BFS 靠它实现「一层层向外扩散」。',
    inputKind: 'text',
    run: queueDemo,
    syntaxTopics: ['array-as-queue', 'while-loop', 'array-shift'],
  },
};
