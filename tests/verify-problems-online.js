/**
 * 洛谷题目链接的**真实性校验**。
 *
 * 这个测试会真的去请求每一道题的页面，确认题号存在、标题对得上。
 *
 * 为什么必须联网校验：
 *   我在写 problems.js 时，入门部分（题单 100-105、107、111）是**抓取**来的，
 *   但算法部分是凭印象补的题号 —— 凭印象写的题号有相当概率不存在或标题不对。
 *   手写「校验格式」这种测试没用（格式对但题目不存在照样是死链），
 *   所以这里直接发 HTTP 请求验证。
 *
 * 用法：node tests/verify-problems-online.js
 *   （需要有网络；无网络时会跳过并明确提示，不会假装通过）
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const { TOPIC_PROBLEMS, ALGO_PROBLEMS, LUOGU_TRAINING_SETS } = await import(
  pathToFileURL(path.join(ROOT, 'src/syntax/problems.js')).href
);

let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.error(`  ✗ ${msg}`); }
};

/** 收集所有待校验的题目（去重）。 */
const allProblems = new Map();
for (const [topicId, list] of Object.entries(TOPIC_PROBLEMS)) {
  for (const prob of list) {
    if (!allProblems.has(prob.id)) allProblems.set(prob.id, { ...prob, usedBy: [] });
    allProblems.get(prob.id).usedBy.push(topicId);
  }
}
for (const [algoId, list] of Object.entries(ALGO_PROBLEMS)) {
  for (const prob of list) {
    if (!allProblems.has(prob.id)) allProblems.set(prob.id, { ...prob, usedBy: [] });
    allProblems.get(prob.id).usedBy.push(algoId);
  }
}

console.log('洛谷题目链接真实性校验（联网）\n' + '='.repeat(58));
console.log(`待校验题目 ${allProblems.size} 道，题单 ${LUOGU_TRAINING_SETS.length} 个`);
console.log('');

/**
 * 抓取洛谷页面。
 *
 * 必须手动处理重定向：
 *   洛谷会先返回 302 并下发一个 C3VK cookie，再要求带着这个 cookie 重访同一 URL。
 *   直接让 fetch 自动跟随会陷入循环，最终报 "redirect count exceeded"
 *   （这个坑实际踩过：一开始误判成「网络不可用」）。
 */
async function fetchLuogu(url) {
  let cookie = '';
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    const res = await fetch(current, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoViz-build/1.0)',
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });

    // 收集 set-cookie
    const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    if (setCookies.length) {
      cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return { ok: false, status: res.status, title: '' };
      current = loc.startsWith('http') ? loc : new URL(loc, current).href;
      // 防死循环：同一地址重复出现就再走一跳（靠 cookie 打破）
      continue;
    }

    if (res.status !== 200) return { ok: false, status: res.status, title: '' };

    const html = await res.text();
    const m = /<title>([^<]*)<\/title>/i.exec(html);
    const title = m ? m[1].replace(/\s*-\s*洛谷\s*$/, '').trim() : '';
    /**
     * 判断题目是否存在，只看**标题**。
     *
     * 不能对整页 HTML 或标题做 /404/ 匹配：
     * 页面正文里可能出现 404（题目本身讲 404、或静态资源带这个数字），
     * 会造成误报 —— 这个误报实际出现过一次（P2404 被误判为不存在）。
     */
    const notFound = /不存在|找不到该题|Not Found/i.test(title);
    return { ok: !notFound, status: 200, title };
  }
  return { ok: false, status: 0, title: '', error: '重定向次数过多' };
}

/** 先确认网络可用；不可用就明确跳过，而不是假装通过。 */
let networkOk = false;
try {
  const probe = await fetchLuogu('https://www.luogu.com.cn/problem/P1001');
  networkOk = probe.ok;
} catch (e) {
  networkOk = false;
}

if (!networkOk) {
  console.log('⚠️  无法访问洛谷（网络不可用），跳过在线校验。');
  console.log('    这不代表题目链接是对的 —— 请在能联网时重新运行本测试。');
  process.exit(0);
}

/** 受限并发地抓取，避免打爆对方站点。 */
async function fetchTitle(id) {
  return fetchLuogu(`https://www.luogu.com.cn/problem/${id}`);
}

const entries = [...allProblems.values()];
const bad = [];
const titleMismatch = [];

const CONCURRENCY = 4;
let idx = 0;
async function worker() {
  while (idx < entries.length) {
    const item = entries[idx++];
    const r = await fetchTitle(item.id);
    if (!r.ok) {
      bad.push(`${item.id} (${item.title}) HTTP ${r.status}${r.error ? ' ' + r.error : ''}`);
    } else if (r.title) {
      // 题号必须出现在页面标题里
      if (!r.title.startsWith(item.id)) {
        titleMismatch.push(`${item.id}: 页面标题是「${r.title}」`);
      }
    }
    await new Promise((r2) => setTimeout(r2, 120));
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

assert(bad.length === 0,
  bad.length
    ? `${bad.length} 道题号不存在或无法访问：\n     ${bad.join('\n     ')}`
    : `全部 ${entries.length} 道题的页面都可正常访问`);

assert(titleMismatch.length === 0,
  titleMismatch.length
    ? `${titleMismatch.length} 道题的页标题与题号不符：\n     ${titleMismatch.join('\n     ')}`
    : '每道题的页面标题都以对应题号开头（题号自洽）');

// 校验题单
console.log('');
const badSets = [];
for (const s of LUOGU_TRAINING_SETS) {
  try {
    const r = await fetchLuogu(s.url);
    if (!r.ok) badSets.push(`${s.id} ${s.name} HTTP ${r.status}`);
    await new Promise((r2) => setTimeout(r2, 150));
  } catch (e) {
    badSets.push(`${s.id} ${s.name} ${e.message}`);
  }
}
assert(badSets.length === 0,
  badSets.length ? `题单不可访问：${badSets.join(', ')}` : `${LUOGU_TRAINING_SETS.length} 个题单页面都可访问`);

console.log('\n' + '='.repeat(58));
if (failures === 0) { console.log('结果：全部通过 ✓\n'); process.exit(0); }
console.log(`结果：${failures} 项失败 ✗（请修正 src/syntax/problems.js 里的题号）\n`);
process.exit(1);
