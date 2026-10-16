/**
 * C++ 教程内容的注入验证。
 *
 * 这个脚本不做完整 UI 测试（那是 ui-integration.js 的职责），
 * 专门验证「C++ 内容是否正确接进了页面」：
 *   - content.js 装配层的数据是否完整
 *   - 每个知识点都有代码、有真实输出、有练习链接
 *   - 每个算法都能找到对应的 C++ 实现
 *   - 算法 ↔ C++ 知识点的双向关联是否都有效
 *   - 页面上展示的输出是否确实来自构建期编译（而不是空占位）
 *
 * 用法：node tests/verify-cpp-content.js
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

const {
  CPP_TOPIC_LIST,
  CPP_GROUPS,
  CPP_TOPIC_BY_ID,
  CPP_ALGO_LIST,
  CPP_ALGO_BY_ALGO_ID,
  CPP_BUILD_META,
} = await import(pathToFileURL(path.join(ROOT, 'src/syntax/content.js')).href);
const { ALGORITHMS, ALGORITHM_ORDER } = await import(
  pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href
);
const { CPP_TOPICS: BASE } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/cpp-topics.js')).href);
const { CPP_DETAIL_TOPICS } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/cpp-detail-topics.js')).href);
// 源知识点的总数 = 基础层 + 细化层
const CPP_TOPICS = [...BASE, ...CPP_DETAIL_TOPICS];
const { CPP_ALGO_SNIPPETS } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/cpp-algos.js')).href);

console.log('C++ 教程内容验证\n' + '='.repeat(58));

// ---------- 1. 知识点完整性 ----------
console.log('\n[1] C++ 知识点');
assert(CPP_TOPIC_LIST.length === CPP_TOPICS.length,
  `知识点数量一致：装配层 ${CPP_TOPIC_LIST.length} 个，源 ${CPP_TOPICS.length} 个`);
assert(CPP_GROUPS.length >= 3, `分组数量：${CPP_GROUPS.map((g) => g.name + '(' + g.topics.length + ')').join('、')}`);

const badTopics = [];
for (const t of CPP_TOPIC_LIST) {
  if (!t.code || t.code.length < 40) badTopics.push(`${t.id}(代码过短)`);
  if (!t.code.includes('#include')) badTopics.push(`${t.id}(缺 #include)`);
  if (!t.code.includes('int main')) badTopics.push(`${t.id}(缺 main)`);
  if (!t.summary) badTopics.push(`${t.id}(缺简介)`);
  if (!Array.isArray(t.points) || t.points.length === 0) badTopics.push(`${t.id}(缺要点)`);
  if (t.luogu.length === 0) badTopics.push(`${t.id}(缺练习链接)`);
}
assert(badTopics.length === 0,
  badTopics.length ? `问题：${badTopics.join(', ')}` : `${CPP_TOPIC_LIST.length} 个知识点都有完整代码、简介、要点和练习链接`);

// ---------- 2. 真实输出 ----------
console.log('\n[2] 示例输出（必须来自构建期真实编译）');
const noOutput = CPP_TOPIC_LIST.filter((t) => !t.outputOk);
assert(noOutput.length === 0,
  noOutput.length ? `这些知识点没有编译成功的输出：${noOutput.map((t) => t.id).join(', ')}` : '全部知识点都有编译成功的输出');

const emptyOutput = CPP_TOPIC_LIST.filter((t) => t.outputOk && !t.output.trim());
assert(emptyOutput.length === 0,
  emptyOutput.length ? `这些知识点有输出但内容为空：${emptyOutput.map((t) => t.id).join(', ')}` : '没有「标记成功但输出为空」的情况');

assert(CPP_BUILD_META.total > 0 && CPP_BUILD_META.passed === CPP_BUILD_META.failed + CPP_BUILD_META.passed,
  `构建元信息：共 ${CPP_BUILD_META.total} 个，通过 ${CPP_BUILD_META.passed}，失败 ${CPP_BUILD_META.failed}`);
assert(Boolean(CPP_BUILD_META.compilerVersion) && CPP_BUILD_META.compilerVersion !== 'unknown',
  `编译器版本已记录：${CPP_BUILD_META.compilerVersion}`);

// ---------- 3. 算法的 C++ 实现 ----------
console.log('\n[3] 算法的 C++ 实现');
assert(CPP_ALGO_LIST.length === CPP_ALGO_SNIPPETS.length,
  `算法实现数量一致：${CPP_ALGO_LIST.length} 个`);

const missingImpl = ALGORITHM_ORDER.filter((id) => !CPP_ALGO_BY_ALGO_ID[id]);
assert(missingImpl.length === 0,
  missingImpl.length
    ? `这些算法没有 C++ 实现：${missingImpl.map((id) => ALGORITHMS[id].name).join(', ')}`
    : `${ALGORITHM_ORDER.length} 个算法全部有对应的 C++ 实现`);

const badAlgos = [];
for (const a of CPP_ALGO_LIST) {
  if (!a.code.includes('#include')) badAlgos.push(`${a.id}(缺 #include)`);
  if (!a.code.includes('int main')) badAlgos.push(`${a.id}(缺 main)`);
  if (!a.outputOk) badAlgos.push(`${a.id}(未编译成功)`);
  if (a.luogu.length === 0) badAlgos.push(`${a.id}(缺练习链接)`);
}
assert(badAlgos.length === 0,
  badAlgos.length ? `问题：${badAlgos.join(', ')}` : `${CPP_ALGO_LIST.length} 个算法实现都完整、编译通过、有练习链接`);

// ---------- 4. 双向关联有效性 ----------
console.log('\n[4] 算法 ↔ C++ 知识点 关联');
const validTopicIds = new Set(CPP_TOPIC_LIST.map((t) => t.id));
const brokenLinks = [];
let totalLinks = 0;
let linkedAlgos = 0;

for (const algoId of ALGORITHM_ORDER) {
  const topics = ALGORITHMS[algoId].cppTopics || [];
  if (topics.length === 0) { brokenLinks.push(`${ALGORITHMS[algoId].name} 没有关联知识点`); continue; }
  linkedAlgos++;
  for (const t of topics) {
    totalLinks++;
    if (!validTopicIds.has(t)) brokenLinks.push(`${ALGORITHMS[algoId].name} 引用了不存在的知识点 "${t}"`);
  }
}
assert(brokenLinks.length === 0,
  brokenLinks.length ? brokenLinks.join('\n     ') : `全部 ${linkedAlgos} 个算法都关联了有效知识点（共 ${totalLinks} 条关联）`);

// 反向：每个知识点是否至少被一个算法引用（不是错误，但要知道）
const referenced = new Set();
for (const algoId of ALGORITHM_ORDER) {
  for (const t of ALGORITHMS[algoId].cppTopics || []) referenced.add(t);
}
const orphan = CPP_TOPIC_LIST.filter((t) => !referenced.has(t.id));
console.log(`  · 未被任何算法引用的知识点：${orphan.length} 个${orphan.length ? `（${orphan.map((t) => t.title).join('、')}）` : ''}`);

// ---------- 5. 内容确实是 C++（不是残留的 JS） ----------
console.log('\n[5] 确认内容已从 JS 换成 C++');
const jsMarkers = [/console\.log\(/, /=>\s*\{/, /\bconst\s+\w+\s*=\s*\[/, /function\s+\w+\s*\(/];
const stillJs = [];
for (const t of CPP_TOPIC_LIST) {
  // C++ 里允许出现 const，但不应出现 JS 特征
  if (/console\.log\(/.test(t.code)) stillJs.push(`${t.id}(含 console.log)`);
  else if (/=>/.test(t.code)) stillJs.push(`${t.id}(含箭头函数)`);
}
assert(stillJs.length === 0,
  stillJs.length ? `这些内容还残留 JS 写法：${stillJs.join(', ')}` : `全部 ${CPP_TOPIC_LIST.length} 个示例都是 C++ 写法（无 console.log / 箭头函数）`);
void jsMarkers;

// ---------- 6. 洛谷练习链接的规则 ----------
console.log('\n[6] 洛谷练习链接');
{
  const { luoguTrainingLinks, SYNTAX_LUOGU, ALGO_LUOGU } = await import(
    pathToFileURL(path.join(ROOT, 'src/syntax/luogu.js')).href
  );

  const allLinks = [
    ...CPP_TOPIC_LIST.flatMap((t) => t.luogu),
    ...CPP_ALGO_LIST.flatMap((a) => a.luogu),
    ...luoguTrainingLinks(),
  ];

  const badUrl = allLinks.filter((l) => !/^https:\/\/www\.luogu\.com\.cn\//.test(l.url));
  assert(badUrl.length === 0,
    badUrl.length ? `非法链接：${badUrl.map((l) => l.url).join(', ')}` : `${allLinks.length} 个链接格式全部合法（均指向 luogu.com.cn）`);

  // 中文关键词必须被 URL 编码
  const searchLinks = allLinks.filter((l) => l.url.includes('keyword='));
  const unencoded = searchLinks.filter((l) => /keyword=[^&]*[\u4e00-\u9fa5]/.test(l.url));
  assert(unencoded.length === 0,
    unencoded.length ? `关键词未编码：${unencoded[0].url}` : `${searchLinks.length} 个链接的中文关键词都已正确编码`);

  // 不写死题号（无网络无法核对，写死风险是死链）
  const hardcoded = allLinks.filter((l) => /\/problem\/P?\d+/i.test(l.url));
  assert(hardcoded.length === 0,
    hardcoded.length ? `发现写死的题号：${hardcoded.map((l) => l.url).join(', ')}` : '没有写死题号（避免死链）');

  // 题单入口应该面向「深入浅出」这类入门题单
  const training = luoguTrainingLinks();
  const hasIntro = training.some((l) => l.label.includes('深入浅出'));
  assert(hasIntro, `题单入口包含「深入浅出」导向：${training.map((l) => l.label).join(' / ')}`);

  // 关键词表不应残留旧 JS 知识点 id
  const staleKeys = Object.keys(SYNTAX_LUOGU).filter((k) => !k.startsWith('cpp-'));
  assert(staleKeys.length === 0,
    staleKeys.length
      ? `关键词表里残留 ${staleKeys.length} 个旧 JS 知识点 id：${staleKeys.slice(0, 5).join(', ')}...`
      : `关键词表的 ${Object.keys(SYNTAX_LUOGU).length} 个键全部是 C++ 知识点 id`);

  assert(Object.keys(ALGO_LUOGU).length >= ALGORITHM_ORDER.length,
    `算法关键词表覆盖 ${Object.keys(ALGO_LUOGU).length} 个算法`);
}

// ---------- 7. 输出与实际程序行为一致（抽查） ----------
console.log('\n[7] 抽查输出内容是否合理');
const hello = CPP_TOPIC_BY_ID['cpp-hello'];
assert(hello && hello.output.includes('Hello World'),
  `Hello World 的输出里确实有 "Hello World"：${JSON.stringify((hello.output || '').split('\n')[0])}`);

const kmp = CPP_ALGO_BY_ALGO_ID['kmp'];
assert(kmp && kmp.output.includes('0 0 1 2 0'),
  `KMP 的 next 数组输出正确：${(kmp.output || '').split('\n')[1] || ''}`);

const sortAlgos = ['bubble', 'selection', 'insertion', 'shell', 'merge', 'quick', 'heap', 'counting', 'bucket'];
const sortOk = sortAlgos.every((id) => {
  const a = CPP_ALGO_BY_ALGO_ID[id];
  return a && a.output.trim().startsWith('0 1 2 2 4 5 8');
});
assert(sortOk, `${sortAlgos.length} 个排序算法的 C++ 输出都是正确的有序结果`);

console.log('\n' + '='.repeat(58));
console.log(`知识点 ${CPP_TOPIC_LIST.length} 个 · 算法实现 ${CPP_ALGO_LIST.length} 个 · 关联 ${totalLinks} 条`);
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗\n`);
process.exit(1);
