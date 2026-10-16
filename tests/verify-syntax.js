/**
 * 语法教程示例的自检。
 *
 * 教程里每一段代码都是「可以被真实执行」的，那它们就必须真的能跑通。
 * 这个脚本把全部示例跑一遍，检查：
 *   1. 不抛异常
 *   2. 确实 return 出了结果（不是 undefined）
 *   3. 示例里 console.log 的输出不包含报错
 *   4. 算法注册表里引用的 syntaxTopics 都真实存在（防止拼错 id 导致跳转失效）
 *
 * 用法：node tests/verify-syntax.js
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const { SYNTAX_TOPICS } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/topics.js')).href);
const { runExample, formatValue } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/runner.js')).href);
const { ALGORITHMS, ALGORITHM_ORDER } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href);

let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.error(`  ✗ ${msg}`); }
};

console.log('语法教程示例自检\n' + '='.repeat(56));

// ---------- 1. 跑通所有示例 ----------
console.log('\n[1] 示例代码可执行性');
let ran = 0;
for (const topic of SYNTAX_TOPICS) {
  const r = runExample(topic.code);
  if (!r.ok) {
    failures++;
    console.error(`  ✗ ${topic.title} 执行失败：${r.errorName}: ${r.error}`);
    continue;
  }
  if (r.value === undefined) {
    failures++;
    console.error(`  ✗ ${topic.title} 没有 return 出结果`);
    continue;
  }
  ran++;
}
assert(ran === SYNTAX_TOPICS.length, `${SYNTAX_TOPICS.length} 个知识点示例全部可执行并返回结果`);

// ---------- 2. 检查示例里的 console.log 不是错误 ----------
console.log('\n[2] 示例输出健康度');
let errorLogs = 0;
for (const topic of SYNTAX_TOPICS) {
  const r = runExample(topic.code);
  const bad = (r.logs || []).filter((l) => l.level === 'error');
  if (bad.length) {
    errorLogs++;
    console.error(`  ✗ ${topic.title} 示例里有 console.error 输出`);
  }
}
assert(errorLogs === 0, '没有任何示例输出错误日志');

// ---------- 3. 每个知识点结构完整 ----------
console.log('\n[3] 知识点结构完整性');
const missing = [];
for (const t of SYNTAX_TOPICS) {
  if (!t.id || !t.title || !t.summary || !t.code) missing.push(t.title || '(无标题)');
  if (!Array.isArray(t.points) || t.points.length === 0) missing.push(`${t.title} 缺少要点`);
  if (!t.group) missing.push(`${t.title} 缺少分组`);
}
assert(missing.length === 0, missing.length ? `结构不完整：${missing.join(', ')}` : '每个知识点都有 id / 分组 / 标题 / 说明 / 要点 / 代码');

// id 唯一性
const ids = SYNTAX_TOPICS.map((t) => t.id);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
assert(dupIds.length === 0, dupIds.length ? `id 重复：${dupIds.join(', ')}` : `知识点 id 全部唯一（共 ${ids.length} 个）`);

// ---------- 4. 算法与语法点的关联必须有效 ----------
console.log('\n[4] 算法 ↔ 语法点 关联有效性');
const validIds = new Set(ids);
const brokenLinks = [];
let linkedAlgos = 0;
let totalLinks = 0;
for (const algoId of ALGORITHM_ORDER) {
  const algo = ALGORITHMS[algoId];
  const topics = algo.syntaxTopics || [];
  if (topics.length === 0) {
    brokenLinks.push(`${algo.name} 没有关联任何语法点`);
    continue;
  }
  linkedAlgos++;
  for (const t of topics) {
    totalLinks++;
    if (!validIds.has(t)) brokenLinks.push(`${algo.name} 引用了不存在的语法点 "${t}"`);
  }
}
assert(brokenLinks.length === 0, brokenLinks.length ? brokenLinks.join('\n     ') : `全部 ${linkedAlgos} 个算法都关联了有效语法点（共 ${totalLinks} 条关联）`);

// 反过来：找出没有任何算法引用的语法点（不是错误，但值得知道）
const referenced = new Set();
for (const algoId of ALGORITHM_ORDER) {
  for (const t of ALGORITHMS[algoId].syntaxTopics || []) referenced.add(t);
}
const orphanTopics = ids.filter((id) => !referenced.has(id));
console.log(`  · 未被任何算法引用的语法点：${orphanTopics.length} 个${orphanTopics.length ? '（' + orphanTopics.join(', ') + '）' : ''}`);

// ---------- 6. 洛谷练习入口的有效性 ----------
console.log('\n[6] 洛谷练习入口');
{
  const { luoguLinksForSyntax, luoguLinksForAlgo, luoguTrainingLinks, SYNTAX_LUOGU, ALGO_LUOGU } =
    await import(pathToFileURL(path.join(ROOT, 'src/syntax/luogu.js')).href);

  // 每个知识点都应该有搜索入口
  const noLink = SYNTAX_TOPICS.filter((t) => !SYNTAX_LUOGU[t.id] || SYNTAX_LUOGU[t.id].length === 0);
  assert(noLink.length === 0,
    noLink.length ? `这些知识点没有洛谷入口：${noLink.map((t) => t.id).join(', ')}` : `全部 ${SYNTAX_TOPICS.length} 个知识点都有洛谷搜索入口`);

  // 每个算法都应该有搜索入口
  const algoNoLink = ALGORITHM_ORDER.filter((id) => !ALGO_LUOGU[id] || ALGO_LUOGU[id].length === 0);
  assert(algoNoLink.length === 0,
    algoNoLink.length ? `这些算法没有洛谷入口：${algoNoLink.join(', ')}` : `全部 ${ALGORITHM_ORDER.length} 个算法都有洛谷搜索入口`);

  // 链接格式必须合法
  const allLinks = [
    ...SYNTAX_TOPICS.flatMap((t) => luoguLinksForSyntax(t.id)),
    ...ALGORITHM_ORDER.flatMap((id) => luoguLinksForAlgo(id)),
    ...luoguTrainingLinks(),
  ];
  const badUrl = allLinks.filter((l) => !/^https:\/\/www\.luogu\.com\.cn\//.test(l.url));
  assert(badUrl.length === 0,
    badUrl.length ? `非法链接：${badUrl.map((l) => l.url).join(', ')}` : `${allLinks.length} 个洛谷链接格式全部合法（均指向 luogu.com.cn）`);

  // 关键词必须被 URL 编码（中文关键词不编码会出问题）
  const searchLinks = allLinks.filter((l) => l.url.includes('keyword='));
  const unencoded = searchLinks.filter((l) => /keyword=[^&]*[\u4e00-\u9fa5]/.test(l.url));
  assert(unencoded.length === 0,
    unencoded.length ? `关键词未编码：${unencoded[0].url}` : `${searchLinks.length} 个搜索链接的中文关键词都已正确编码`);

  // 确认没有写死题号（因为无法联网核对）
  const hardcoded = allLinks.filter((l) => /\/problem\/P?\d+/i.test(l.url));
  assert(hardcoded.length === 0,
    hardcoded.length ? `发现写死的题号链接：${hardcoded.map((l) => l.url).join(', ')}` : '没有写死题号（避免死链，只用搜索入口）');
}

// ---------- 7. 抽查几个示例的返回值是否符合预期 ----------
console.log('\n[5] 关键示例返回值抽查');
const byId = Object.fromEntries(SYNTAX_TOPICS.map((t) => [t.id, t]));

const swapRes = runExample(byId['variable-swap'].code);
assert(swapRes.ok && JSON.stringify(swapRes.value.arrayAfterSwap) === '[3,2,1]',
  `交换示例结果正确：数组首尾已交换 → ${JSON.stringify(swapRes.value?.arrayAfterSwap)}`);

const initRes = runExample(byId['array-init'].code);
assert(initRes.ok && initRes.value.isSorted === true,
  '计数数组示例：重建后的数组确实有序');

const midRes = runExample(byId['mid-overflow'].code);
// 数组是 [1,3,5,7,9,11,13,15,17]，13 在下标 6
assert(midRes.ok && midRes.value.index === 6,
  `二分中点示例：在 9 个元素中找到目标 13，index=${midRes.value?.index}（应为 6）`);
assert(midRes.ok && midRes.value.steps <= midRes.value.worstCase,
  `二分步数不超过理论上界：${midRes.value?.steps} <= ${midRes.value?.worstCase}`);

const queueRes = runExample(byId['array-as-queue'].code);
assert(queueRes.ok &&
  JSON.stringify(queueRes.value.queueOut) === '[1,2,3]' &&
  JSON.stringify(queueRes.value.stackOut) === '[3,2,1]',
  '队列/栈示例：先进先出与后进先出结果正确');

const flagRes = runExample(byId['boolean-flag'].code);
assert(flagRes.ok && flagRes.value.nearlySorted.rounds < flagRes.value.randomish.rounds,
  `布尔标记示例：接近有序时轮数更少（${flagRes.value?.nearlySorted?.rounds} < ${flagRes.value?.randomish?.rounds}）`);

// ---------- 6. 错误处理确实生效 ----------
console.log('\n[6] 错误处理');
const errRes = runExample('return notDefinedVariable;');
assert(!errRes.ok && errRes.errorName === 'ReferenceError',
  `写错的代码被捕获而不是崩溃：${errRes.errorName}`);

const syntaxErr = runExample('return ((;');
assert(!syntaxErr.ok, '语法错误被捕获并返回错误信息');

const logRes = runExample('console.log("hello", 42); return 1;');
assert(logRes.ok && logRes.logs.length === 1 && logRes.logs[0].text.includes('hello'),
  `console.log 输出被正确捕获：${logRes.logs[0]?.text}`);

// 沙箱里拿不到 DOM
const domRes = runExample('return typeof document;');
assert(domRes.ok && domRes.value === 'undefined',
  '示例沙箱内访问不到 document（隔离生效）');

console.log('\n' + '='.repeat(56));
console.log(`知识点 ${SYNTAX_TOPICS.length} 个 · 关联 ${totalLinks} 条 · 失败 ${failures} 项`);
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log('结果：有失败项 ✗\n');
process.exit(1);
