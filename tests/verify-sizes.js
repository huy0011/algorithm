/**
 * 数据规模配置的验证。
 *
 * 覆盖：
 *   1. 每个 inputKind 都有规模配置（bits 除外——固定 8 位演示）
 *   2. 滑块最小值与最大值两个极端下，算法都能正常生成数据并跑完
 *   3. 规模真的生效（例如数组类的元素个数 = 滑块值）
 *
 * 用法：node tests/verify-sizes.js
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.error(`  ✗ ${msg}`); }
};

const { SIZE_CONFIGS, hasSize, getSizeConfig, applySize } = await import(
  pathToFileURL(path.join(ROOT, 'src/render/size-config.js')).href
);
const { ALGORITHMS, ALGORITHM_ORDER, CATEGORIES } = await import(
  pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href
);
const { buildInput } = await import(pathToFileURL(path.join(ROOT, 'src/render/factory.js')).href);

const kindOf = (cat) => (CATEGORIES.find((x) => x.id === cat) || {}).renderer || 'bars';

console.log('数据规模配置验证\n' + '='.repeat(58));

// ---------- 1. 配置覆盖 ----------
console.log('\n[1] 规模配置覆盖');
const kinds = [...new Set(ALGORITHM_ORDER.map((id) => ALGORITHMS[id].inputKind))];
const noConfig = kinds.filter((k) => k !== 'bits' && !hasSize(k));
assert(noConfig.length === 0,
  noConfig.length ? `这些 inputKind 缺规模配置：${noConfig.join(', ')}` : `${kinds.length} 种 inputKind 都有规模配置（bits 固定演示除外）`);

// ---------- 2. 两个极端都能跑 ----------
console.log('\n[2] 滑块最小/最大两个极端');
let extremesOk = 0;
const extremesFail = [];
for (const kind of kinds) {
  const cfg = getSizeConfig(kind);
  if (!cfg) continue;
  // 找一个该 kind 的算法
  const algoId = ALGORITHM_ORDER.find((id) => ALGORITHMS[id].inputKind === kind);
  const algo = ALGORITHMS[algoId];

  for (const size of [cfg.min, cfg.max]) {
    try {
      const config = applySize({ size, shape: 'random' }, kind, size);
      const { input, options } = buildInput(algo, config);
      const r0 = algo.run(input, options);
      const result = r0.tracer
        ? (typeof r0.tracer.build === 'function' ? r0.tracer.build() : r0.tracer.result())
        : r0;
      if (!result.operations || result.operations.length === 0) {
        throw new Error('操作序列为空');
      }
      extremesOk++;
    } catch (e) {
      extremesFail.push(`${algo.name}@${size}: ${e.message}`);
    }
  }
}
assert(extremesFail.length === 0,
  extremesFail.length
    ? `${extremesFail.length} 个规模组合跑不通：\n     ${extremesFail.join('\n     ')}`
    : `全部 ${extremesOk} 个「最小+最大」规模组合都能生成数据并跑通`);

// ---------- 3. 规模真的生效 ----------
console.log('\n[3] 规模确实影响数据量');
{
  // 数组类：元素个数应该等于滑块值
  const cfg = getSizeConfig('array');
  const lo = buildInput(ALGORITHMS.bubble, applySize({ size: cfg.min, shape: 'random' }, 'array', cfg.min));
  const hi = buildInput(ALGORITHMS.bubble, applySize({ size: cfg.max, shape: 'random' }, 'array', cfg.max));
  assert(lo.input.length === cfg.min && hi.input.length === cfg.max,
    `数组类：滑块 ${cfg.min} → ${lo.input.length} 个元素，${cfg.max} → ${hi.input.length} 个元素`);

  // 高精度：位数应该随滑块变
  const bcfg = getSizeConfig('bigNumbers');
  const blo = buildInput(ALGORITHMS.bigAdd, applySize({ size: bcfg.min }, 'bigNumbers', bcfg.min));
  const bhi = buildInput(ALGORITHMS.bigAdd, applySize({ size: bcfg.max }, 'bigNumbers', bcfg.max));
  assert(String(blo.options.a).length >= bcfg.min - 1 && String(bhi.options.a).length <= bcfg.max,
    `高精度：小滑块位数 ${String(blo.options.a).length}，大滑块位数 ${String(bhi.options.a).length}`);

  // 步数应该随规模显著变化（可视化要有"更大规模更慢"的直观感）
  const small = ALGORITHMS.bubble.run(lo.input).operations.length;
  const large = ALGORITHMS.bubble.run(hi.input).operations.length;
  assert(large > small,
    `步数随规模增长：${cfg.min} 元素 ${small} 步 → ${cfg.max} 元素 ${large} 步`);
}

// ---------- 4. 图类点数生效 ----------
console.log('\n[4] 图类点数');
{
  const cfg = getSizeConfig('graph');
  for (const count of [cfg.min, 6, cfg.max]) {
    const config = applySize({ size: count }, 'graph', count);
    const { input, options } = buildInput(ALGORITHMS.dijkstra, config);
    const g = options.graph;
    assert(g.nodes.length === count,
      `滑块 ${count} → 图有 ${g.nodes.length} 个点`);
  }
}

console.log('\n' + '='.repeat(58));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
