/**
 * 正确性自检（全部 16 个算法 / 数据结构）。
 *
 * 不是「跑起来看看」，而是对每个算法做穷举式验证。
 * 不同可视化类型的「正确」含义不同，所以按家族分别校验：
 *
 *   排序类   结果有序、元素守恒、重放序列结果一致、下标不越界
 *   非比较排序 同上（额外校验：比较次数确实为 0，这正是它们的卖点）
 *   查找类   命中时下标的值确实等于目标；未命中时目标确实不在数组里；
 *            探测次数不超过 log2(n)+1 的理论上界
 *   二分答案 找到的解确实可行，且再长一点都不行（即确实是最大值）
 *   寻路类   路径连续（相邻格）、起终点正确、不穿墙；
 *            BFS 找到的路径长度必须等于最短路径（这是 BFS 的核心保证）
 *   结构类   操作序列重放后的结构与算法内部状态一致
 *
 * 用法：node tests/verify.js
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const { ALGORITHMS, ALGORITHM_ORDER } = await import(
  pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href
);
const { ArrayOp, SearchOp, GridOp, StructOp } = await import(
  pathToFileURL(path.join(ROOT, 'src/algorithms/tracer.js')).href
);
const { generateGrid } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/path.js')).href);

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    failures++;
    console.error(`  ✗ ${message}`);
  }
}

function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) if (arr[i - 1] > arr[i]) return false;
  return true;
}

/** 从原始数组重放操作序列，得到「渲染层眼中的数组」。 */
function replayArray(baseArray, operations) {
  const view = baseArray.slice();
  for (const op of operations) {
    switch (op.type) {
      case ArrayOp.SWAP: {
        const [i, j] = op.indices;
        const tmp = view[i];
        view[i] = view[j];
        view[j] = tmp;
        break;
      }
      case ArrayOp.OVERWRITE:
        view[op.index] = op.value;
        break;
      default:
        break;
    }
  }
  return view;
}

/** 重放网格操作序列，恢复出「哪些格子已访问 / 路径是什么」。 */
function replayGrid(operations) {
  const visited = new Set();
  const path = [];
  const current = [];
  let currentCell = null;
  for (const op of operations) {
    const k = (c) => `${c[0]},${c[1]}`;
    switch (op.type) {
      case GridOp.VISIT: visited.add(k(op.cell)); break;
      case GridOp.PATH: path.push(op.cell); break;
      case GridOp.CURRENT: currentCell = op.cell; break;
      default: break;
    }
  }
  return { visited, path, currentCell, current };
}

/** 重放结构操作，恢复出栈/队列的内容。 */
function replayStructure(operations, type) {
  const items = [];
  for (const op of operations) {
    switch (op.type) {
      case StructOp.PUSH: items.push(op.value); break;
      case StructOp.POP: items.pop(); break;
      case StructOp.DEQUEUE: items.shift(); break;
      default: break;
    }
  }
  return items;
}

// ===================== 测试数据 =====================

function makeArrayCases() {
  const cases = [
    { name: '空数组', data: [] },
    { name: '单元素', data: [7] },
    { name: '两元素有序', data: [1, 2] },
    { name: '两元素逆序', data: [2, 1] },
    { name: '三元素逆序', data: [3, 2, 1] },
    { name: '全部相等', data: [5, 5, 5, 5, 5, 5] },
    { name: '已有序', data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { name: '完全逆序', data: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
    { name: '含重复值', data: [3, 1, 3, 2, 1, 2, 3, 1] },
    { name: '两个值交替', data: [2, 1, 2, 1, 2, 1, 2, 1] },
    { name: '含大值', data: [100, 1, 50, 50, 2, 99] },
    { name: '8 元素随机', data: [4, 7, 1, 8, 3, 6, 2, 5] },
    { name: '9 元素随机', data: [4, 7, 1, 8, 3, 6, 2, 5, 9] },
  ];
  for (let t = 0; t < 30; t++) {
    const size = 1 + Math.floor(Math.random() * 60);
    cases.push({
      name: `随机 #${t + 1} (n=${size})`,
      data: Array.from({ length: size }, () => Math.floor(Math.random() * 50)),
    });
  }
  return cases;
}

// ===================== 各类家族的校验 =====================

/** 排序类（比较排序 + 非比较排序） */
function verifySortFamily(algo, cases) {
  let failed = 0;
  for (const c of cases) {
    const original = c.data.slice();
    let result;
    try {
      result = algo.run(c.data);
    } catch (e) {
      failed++; assert(false, `${algo.name} / ${c.name}: 抛异常 ${e.message}`); continue;
    }

    // 不修改输入
    if (JSON.stringify(c.data) !== JSON.stringify(original)) {
      failed++; assert(false, `${algo.name} / ${c.name}: 修改了输入数组`); continue;
    }

    // 结果有序且元素守恒
    const expected = original.slice().sort((a, b) => a - b);
    if (JSON.stringify(result.sorted) !== JSON.stringify(expected)) {
      failed++;
      assert(false, `${algo.name} / ${c.name}: 结果不正确\n      得到 [${result.sorted.join(',')}]\n      期望 [${expected.join(',')}]`);
      continue;
    }

    // 重放序列结果一致（渲染层任意跳转的前提）
    const replayed = replayArray(original, result.operations);
    if (JSON.stringify(replayed) !== JSON.stringify(result.sorted)) {
      failed++;
      assert(false, `${algo.name} / ${c.name}: 重放序列与最终结果不一致`);
      continue;
    }

    // 下标合法
    const n = original.length;
    for (const op of result.operations) {
      if (op.type === ArrayOp.OVERWRITE) {
        assert(op.index >= 0 && op.index < n, `${algo.name} / ${c.name}: overwrite 越界 ${op.index}`);
      } else if (op.indices) {
        for (const idx of op.indices) {
          assert(idx >= 0 && idx < n, `${algo.name} / ${c.name}: 下标越界 ${idx}`);
        }
      } else if (op.type === ArrayOp.MARK_SORTED) {
        assert(op.index >= 0 && op.index < n, `${algo.name} / ${c.name}: markSorted 越界 ${op.index}`);
      }
    }
  }
  return failed;
}

/** 非比较排序额外校验：比较次数必须为 0 */
function verifyNonCompare(algo) {
  const data = Array.from({ length: 40 }, () => Math.floor(Math.random() * 61));
  const result = algo.run(data);
  assert(result.stats.comparisons === 0,
    `${algo.name}: 比较次数为 0（实际 ${result.stats.comparisons}）—— 这正是「非比较排序」的含义`);
  assert(isSorted(result.sorted) && result.sorted.length === data.length,
    `${algo.name}: 排序结果正确`);
}

/** 二分查找 */
function verifyBinarySearch() {
  let failed = 0;
  const trials = 200;
  let hits = 0;
  let misses = 0;

  for (let t = 0; t < trials; t++) {
    const n = 1 + Math.floor(Math.random() * 60);
    const arr = [];
    let v = Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) { arr.push(v); v += Math.floor(Math.random() * 5) + 1; }

    // 一半的用例找存在的值，一半找不存在的
    const shouldHit = t % 2 === 0;
    let target;
    if (shouldHit) {
      target = arr[Math.floor(Math.random() * arr.length)];
    } else {
      target = arr[arr.length - 1] + 100 + t; // 一定不在数组里
    }

    const result = ALGORITHMS.binarySearch.run(arr, { target });

    // 找出所有命中位置的集合，用于校验
    const foundOp = result.operations.find((op) => op.type === SearchOp.FOUND);
    if (!foundOp) { failed++; assert(false, `二分查找: 序列里没有 FOUND 操作`); continue; }

    if (shouldHit) {
      hits++;
      if (foundOp.index < 0) {
        failed++;
        assert(false, `二分查找: 目标 ${target} 明明在数组里却报未找到\n      数组 [${arr.join(',')}]`);
      } else if (arr[foundOp.index] !== target) {
        failed++;
        assert(false, `二分查找: 报告的下标 ${foundOp.index} 的值是 ${arr[foundOp.index]}，不是目标 ${target}`);
      }
    } else {
      misses++;
      if (foundOp.index >= 0) {
        failed++;
        assert(false, `二分查找: 目标 ${target} 不在数组里却报命中下标 ${foundOp.index}`);
      }
      if (arr.includes(target)) {
        // 构造失误，跳过（正常不会发生）
        continue;
      }
    }

    // 探测次数不能超过理论上界
    const maxSteps = Math.ceil(Math.log2(n + 1)) + 1;
    if (result.stats.comparisons > maxSteps) {
      failed++;
      assert(false, `二分查找: n=${n} 时比较了 ${result.stats.comparisons} 次，超过上界 ${maxSteps}`);
    }
  }

  assert(failed === 0, `二分查找: ${trials} 组随机用例（命中 ${hits} / 未命中 ${misses}）全部正确`);
  return failed;
}

/** 二分答案：校验找到的确实是「最大可行解」 */
function verifyBinarySearchAnswer() {
  let failed = 0;
  const trials = 120;

  for (let t = 0; t < trials; t++) {
    const n = 1 + Math.floor(Math.random() * 5);
    const ropes = Array.from({ length: n }, () => Math.floor(Math.random() * 80) + 20);
    const pieces = 1 + Math.floor(Math.random() * 8);

    const algResult = ALGORITHMS.binarySearchAnswer.run(ropes, { pieces });

    // 从最后一个 ANSWER 操作里取最终答案
    const answers = algResult.operations.filter((op) => op.type === SearchOp.ANSWER);
    const finalAns = answers[answers.length - 1];
    if (!finalAns) { failed++; assert(false, '二分答案: 没有产生 ANSWER 操作'); continue; }
    const got = finalAns.value;

    // 独立暴力求出真正的最大长度
    const feasible = (len) => {
      if (len <= 0) return false;
      let count = 0;
      for (const r of ropes) count += Math.floor(r / len);
      return count >= pieces;
    };
    let brute = 0;
    const maxLen = Math.max(...ropes);
    for (let len = 1; len <= maxLen; len++) if (feasible(len)) brute = len;

    if (got !== brute) {
      failed++;
      assert(false, `二分答案: 绳子 [${ropes.join(',')}] 切 ${pieces} 段\n      得到 ${got}，暴力求解应为 ${brute}`);
    }
  }

  assert(failed === 0, `二分答案: ${trials} 组随机用例与暴力解完全一致`);
  return failed;
}

/** 寻路：校验路径连续、起终点正确、不穿墙 */
function verifyPathFamily(algoId) {
  const algo = ALGORITHMS[algoId];
  let failed = 0;
  const trials = 60;

  for (let t = 0; t < trials; t++) {
    const rows = 5 + Math.floor(Math.random() * 10);
    const cols = 5 + Math.floor(Math.random() * 14);
    const wallRatio = 0.15 + Math.random() * 0.3;
    const grid = generateGrid(rows, cols, wallRatio);
    const start = [0, 0];
    const end = [rows - 1, cols - 1];

    let result;
    try {
      result = algo.run(grid, { start, end });
    } catch (e) {
      failed++; assert(false, `${algo.name}: 抛异常 ${e.message}`); continue;
    }

    const { path, visited } = replayGrid(result.operations);

    if (path.length === 0) {
      // 没找到路径：必须确实不可达（用独立 BFS 验证）
      const reachable = independentReachable(grid, start, end);
      if (reachable) {
        failed++;
        assert(false, `${algo.name}: 报告不可达，但实际存在通路（${rows}×${cols}）`);
      }
      continue;
    }

    // 路径起点终点正确
    if (path[0][0] !== start[0] || path[0][1] !== start[1]) {
      failed++; assert(false, `${algo.name}: 路径起点错误 ${JSON.stringify(path[0])}`); continue;
    }
    const last = path[path.length - 1];
    if (last[0] !== end[0] || last[1] !== end[1]) {
      failed++; assert(false, `${algo.name}: 路径终点错误 ${JSON.stringify(last)}`); continue;
    }

    // 路径连续（相邻两格必须曼哈顿距离为 1）
    let broken = false;
    for (let i = 1; i < path.length; i++) {
      const d = Math.abs(path[i][0] - path[i - 1][0]) + Math.abs(path[i][1] - path[i - 1][1]);
      if (d !== 1) { broken = true; break; }
    }
    if (broken) {
      failed++; assert(false, `${algo.name}: 路径不连续（有跳跃）`); continue;
    }

    // 路径不能穿墙
    let throughWall = false;
    for (const [r, c] of path) {
      if (grid[r][c] === 0) { throughWall = true; break; }
    }
    if (throughWall) {
      failed++; assert(false, `${algo.name}: 路径穿过了墙`); continue;
    }

    // 起点必须在已访问集合里
    if (!visited.has(`${start[0]},${start[1]}`)) {
      failed++; assert(false, `${algo.name}: 起点没有被访问`); continue;
    }
  }

  assert(failed === 0, `${algo.name}: ${trials} 组随机地图的路径全部合法（连续、不穿墙、首尾正确）`);
  return failed;
}

/** 独立实现的 BFS，用来交叉验证「是否可达」和「最短路径长度」。 */
function independentBFS(grid, start, end) {
  const rows = grid.length, cols = grid[0].length;
  const key = (r, c) => `${r},${c}`;
  const dist = new Map([[key(start[0], start[1]), 0]]);
  const queue = [start];
  let head = 0;
  const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  while (head < queue.length) {
    const [r, c] = queue[head++];
    if (r === end[0] && c === end[1]) return dist.get(key(r, c));
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === 0) continue;
      const nk = key(nr, nc);
      if (dist.has(nk)) continue;
      dist.set(nk, dist.get(key(r, c)) + 1);
      queue.push([nr, nc]);
    }
  }
  return -1;
}

function independentReachable(grid, start, end) {
  return independentBFS(grid, start, end) >= 0;
}

/** BFS 的路径长度必须等于最短路径长度 —— 这是 BFS 的核心保证 */
function verifyBFSIsShortest() {
  let failed = 0;
  const trials = 60;
  let compared = 0;

  for (let t = 0; t < trials; t++) {
    const rows = 6 + Math.floor(Math.random() * 8);
    const cols = 6 + Math.floor(Math.random() * 10);
    const grid = generateGrid(rows, cols, 0.2 + Math.random() * 0.25);
    const start = [0, 0];
    const end = [rows - 1, cols - 1];

    const result = ALGORITHMS.bfs.run(grid, { start, end });
    const { path } = replayGrid(result.operations);
    const shortest = independentBFS(grid, start, end);

    if (shortest < 0) continue;       // 不可达，跳过
    compared++;

    // 路径有 k 个格子，则步数是 k-1
    const steps = path.length - 1;
    if (steps !== shortest) {
      failed++;
      assert(false, `BFS 路径长度 ${steps} 不等于最短距离 ${shortest}`);
    }
  }

  assert(failed === 0, `BFS: ${compared} 组可达地图上，找到的路径都是最短的`);
  return failed;
}

/** DFS 找到的路径通常不是最短 —— 验证这个「特性」确实体现出来了 */
function verifyDFSNotAlwaysShortest() {
  let notShortest = 0;
  let total = 0;
  for (let t = 0; t < 60; t++) {
    const rows = 6 + Math.floor(Math.random() * 8);
    const cols = 6 + Math.floor(Math.random() * 10);
    const grid = generateGrid(rows, cols, 0.2 + Math.random() * 0.25);
    const start = [0, 0];
    const end = [rows - 1, cols - 1];

    const result = ALGORITHMS.dfs.run(grid, { start, end });
    const { path } = replayGrid(result.operations);
    const shortest = independentBFS(grid, start, end);
    if (shortest < 0 || path.length === 0) continue;
    total++;
    if (path.length - 1 > shortest) notShortest++;
  }
  console.log(`  · DFS: ${total} 组中 ${notShortest} 组的路径不是最短（这是 DFS 的固有特性，不是 bug）`);
  return 0;
}

/** 栈 / 队列 */
function verifyStructureFamily(algoId) {
  const algo = ALGORITHMS[algoId];
  const isStack = algoId === 'stackDemo';
  let failed = 0;

  // 括号匹配：用独立的实现交叉验证结论
  if (isStack) {
    const samples = ['({[]})', '([)]', '((()))', '{[()]}', '(()', ')', '', '[]{}()', '((('];
    for (const text of samples) {
      const result = algo.run([], { text });
      const replayed = replayStructure(result.operations, 'stack');

      // 独立判断这个括号串是否匹配
      const expected = (() => {
        const pairs = { ')': '(', ']': '[', '}': '{' };
        const st = [];
        for (const ch of text) {
          if ('([{'.includes(ch)) st.push(ch);
          else if (pairs[ch]) {
            if (st.length === 0 || st[st.length - 1] !== pairs[ch]) return false;
            st.pop();
          }
        }
        return st.length === 0;
      })();

      // 最后一条 RESULT 操作给出的结论
      const results = result.operations.filter((op) => op.type === StructOp.RESULT);
      const finalResult = results[results.length - 1];
      if (!finalResult) {
        failed++; assert(false, `栈演示 "${text}": 没有产生结论`); continue;
      }
      if (finalResult.ok !== expected) {
        failed++;
        assert(false, `栈演示 "${text}": 结论 ${finalResult.ok} 与独立判断 ${expected} 不一致`);
      }
      // 重放后栈应该被清空（匹配成功的情况）
      if (expected && replayed.length !== 0) {
        failed++;
        assert(false, `栈演示 "${text}": 匹配成功但栈里还剩 ${replayed.length} 个元素`);
      }
    }
    assert(failed === 0, `栈演示: ${samples.length} 个括号串的判定与独立实现全部一致`);
  } else {
    // 队列：校验先进先出
    const tasks = ['A', 'B', 'C', 'D', 'E'];
    const result = algo.run([], { tasks });
    const pushed = result.operations.filter((op) => op.type === StructOp.PUSH).map((op) => op.value);
    const popped = result.operations.filter((op) => op.type === StructOp.DEQUEUE).map((op) => op.value);

    if (pushed.join(',') !== popped.join(',')) {
      failed++;
      assert(false, `队列演示: 入队顺序 [${pushed}] 与出队顺序 [${popped}] 不一致（应满足先进先出）`);
    }
    const replayed = replayStructure(result.operations, 'queue');
    if (replayed.length !== 0) {
      failed++;
      assert(false, `队列演示: 全部处理完后队列仍剩 ${replayed.length} 个元素`);
    }
    assert(failed === 0, `队列演示: 入队与出队顺序一致，满足先进先出，最终队列清空`);
  }
  return failed;
}

// ===================== 主流程 =====================

console.log('算法正确性自检（全部算法）\n' + '='.repeat(58));

const arrayCases = makeArrayCases();
const sortIds = ALGORITHM_ORDER.filter((id) => ALGORITHMS[id].category === 'sort');
const nonCompareIds = ALGORITHM_ORDER.filter((id) => ALGORITHMS[id].category === 'noncompare');

// ---- 排序 ----
console.log(`\n[1] 比较排序（${sortIds.length} 个 × ${arrayCases.length} 用例）`);
for (const id of sortIds) {
  const algo = ALGORITHMS[id];
  const failed = verifySortFamily(algo, arrayCases);
  if (failed === 0) console.log(`  ✓ ${algo.name}  ${arrayCases.length} 个用例全部通过`);
}

// ---- 非比较排序 ----
console.log(`\n[2] 非比较排序（${nonCompareIds.length} 个 × ${arrayCases.length} 用例）`);
for (const id of nonCompareIds) {
  const algo = ALGORITHMS[id];
  const failed = verifySortFamily(algo, arrayCases);
  verifyNonCompare(algo);
  if (failed === 0) console.log(`  ✓ ${algo.name}  ${arrayCases.length} 个用例全部通过`);
}

// ---- 查找 ----
console.log('\n[3] 查找 / 二分');
verifyBinarySearch();
verifyBinarySearchAnswer();

// ---- 寻路 ----
console.log('\n[4] 路径查找');
verifyPathFamily('bfs');
verifyPathFamily('dfs');
verifyBFSIsShortest();
verifyDFSNotAlwaysShortest();

// ---- 数据结构 ----
console.log('\n[5] 数据结构');
verifyStructureFamily('stackDemo');
verifyStructureFamily('queueDemo');

// ---- 汇总 ----
const totalRuns =
  (sortIds.length + nonCompareIds.length) * arrayCases.length + 200 + 120 + 60 * 2 + 9 + 1;

console.log('\n' + '='.repeat(58));
console.log(`共校验 ${ALGORITHM_ORDER.length} 个算法，约 ${totalRuns} 次运行`);
if (failures === 0) {
  console.log('结果：全部通过 ✓\n');
  process.exit(0);
}
console.log(`结果：${failures} 项断言失败 ✗\n`);
process.exit(1);
