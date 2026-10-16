/**
 * 正确性自检。
 *
 * 这个文件不是「跑起来看看」，而是对每个算法做穷举式的验证：
 *   1. 随机数据 + 边界数据（空、单元素、全相等、已有序、逆序）
 *   2. 校验最终结果确实有序
 *   3. 校验操作序列自包含 —— 从原始数组重放一遍操作，能得到同样的结果
 *      （这是渲染层「跳到任意进度都不失真」的前提）
 *
 * 用法：node tests/verify.js
 */

import { ALGORITHMS, ALGORITHM_ORDER } from '../src/algorithms/index.js';
import { Op } from '../src/algorithms/tracer.js';

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    failures++;
    console.error(`  ✗ ${message}`);
  }
}

/** 从原始数组重放操作序列，得到「渲染层眼中的数组」。 */
function replay(baseArray, operations) {
  const view = baseArray.slice();
  for (const op of operations) {
    switch (op.type) {
      case Op.SWAP: {
        const [i, j] = op.indices;
        const tmp = view[i];
        view[i] = view[j];
        view[j] = tmp;
        break;
      }
      case Op.OVERWRITE:
        view[op.index] = op.value;
        break;
      default:
        break;
    }
  }
  return view;
}

function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1] > arr[i]) return false;
  }
  return true;
}

/** 生成一批测试用例。 */
function makeCases() {
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
    // 规模覆盖到 2 的幂附近，专门试归并的分界
    { name: '8 元素随机', data: [4, 7, 1, 8, 3, 6, 2, 5] },
    { name: '9 元素随机', data: [4, 7, 1, 8, 3, 6, 2, 5, 9] },
  ];

  // 补一批随机用例
  for (let t = 0; t < 40; t++) {
    const size = 1 + Math.floor(Math.random() * 60);
    const data = Array.from({ length: size }, () => Math.floor(Math.random() * 50));
    cases.push({ name: `随机用例 #${t + 1} (n=${size})`, data });
  }
  return cases;
}

console.log('算法正确性自检\n' + '='.repeat(46));

const cases = makeCases();
let totalRuns = 0;

for (const id of ALGORITHM_ORDER) {
  const algo = ALGORITHMS[id];
  let algoFailed = 0;

  for (const c of cases) {
    totalRuns++;
    const original = c.data.slice();
    const result = algo.run(c.data);

    // 1. 不能修改调用方传入的数组
    assert(
      JSON.stringify(c.data) === JSON.stringify(original),
      `${algo.name} / ${c.name}: 修改了输入数组`
    );

    // 2. 结果必须有序
    if (!isSorted(result.sorted)) {
      algoFailed++;
      assert(false, `${algo.name} / ${c.name}: 结果未排序 → [${result.sorted.join(',')}]`);
      continue;
    }

    // 3. 元素必须守恒（不能丢元素或多出元素）
    const before = original.slice().sort((a, b) => a - b);
    if (JSON.stringify(before) !== JSON.stringify(result.sorted)) {
      algoFailed++;
      assert(false, `${algo.name} / ${c.name}: 元素不守恒`);
      continue;
    }

    // 4. 重放操作序列必须得到同样的结果 —— 渲染层依赖这一点
    const replayed = replay(original, result.operations);
    if (JSON.stringify(replayed) !== JSON.stringify(result.sorted)) {
      algoFailed++;
      assert(
        false,
        `${algo.name} / ${c.name}: 重放操作序列与最终结果不一致\n` +
        `      重放 → [${replayed.join(',')}]\n` +
        `      结果 → [${result.sorted.join(',')}]`
      );
      continue;
    }

    // 5. 每一步操作的下标都必须在合法范围内（否则渲染层会读到 undefined）
    const n = original.length;
    for (const op of result.operations) {
      if (op.type === Op.OVERWRITE) {
        assert(op.index >= 0 && op.index < n, `${algo.name} / ${c.name}: overwrite 下标越界 ${op.index}`);
      } else if (op.indices) {
        for (const idx of op.indices) {
          assert(idx >= 0 && idx < n, `${algo.name} / ${c.name}: 比较/交换下标越界 ${idx}`);
        }
      } else if (op.type === Op.MARK_SORTED) {
        assert(op.index >= 0 && op.index < n, `${algo.name} / ${c.name}: markSorted 下标越界 ${op.index}`);
      }
    }
  }

  if (algoFailed === 0) {
    console.log(`  ✓ ${algo.name.padEnd(6, '　')} ${cases.length} 个用例全部通过`);
  } else {
    console.log(`  ✗ ${algo.name} 有 ${algoFailed} 个用例失败`);
  }
}

console.log('='.repeat(46));
console.log(`共执行 ${totalRuns} 次算法运行`);

if (failures === 0) {
  console.log('结果：全部通过 ✓\n');
  process.exit(0);
} else {
  console.log(`结果：${failures} 项断言失败 ✗\n`);
  process.exit(1);
}
