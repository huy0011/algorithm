/**
 * C++ 示例的编译验证管道。
 *
 * ============================ 背景与取舍 ============================
 *
 * 本项目部署到 GitHub Pages（纯静态托管，没有后端），而**浏览器无法执行 C++**。
 * 所以 C++ 示例不可能像原来的 JS 示例那样「在页面上点一下就真跑」。
 *
 * 折中方案（也是目前最诚实的做法）：
 *   在**构建期**用本机 g++ 把每个示例编译并运行，
 *   把真实 stdout 录进 src/syntax/cpp-output.json，页面读取展示。
 *
 * 这样访客看到的输出**是真实编译运行的结果**，不是手写的；
 * 代价是页面本身不能重新编译（这一点在界面上有明确说明）。
 *
 * ============================ 为什么分两步 ============================
 *
 * 本机沙箱禁止 Node 的 child_process 以 piped stdio 方式启动子进程
 * （会得到 `spawnSync g++ EPERM`，这是受管环境写明的边界）。
 * 所以不能像常规项目那样在 Node 里直接 execFileSync('g++', ...)。
 *
 * 于是拆成两个阶段：
 *   node tests/build-cpp.js            —— 阶段一：写出 .cpp 文件 + 清单
 *   pwsh tests/build-cpp.ps1           —— 阶段二：编译运行，产出 results.json
 *   node tests/build-cpp.js --collect  —— 阶段三：把 results.json 收成 cpp-output.json
 *
 * 这样既能拿到真实编译输出，又不触碰沙箱边界。
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, '.cpp-build');
const OUT_FILE = path.join(ROOT, 'src/syntax/cpp-output.json');
const RESULTS_FILE = path.join(BUILD_DIR, 'results.json');
const MANIFEST_FILE = path.join(BUILD_DIR, 'manifest.json');

const { CPP_TOPICS: CPP_TOPICS_BASE } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/cpp-topics.js')).href);
const { CPP_DETAIL_TOPICS } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/cpp-detail-topics.js')).href);
const CPP_TOPICS = [...CPP_TOPICS_BASE, ...CPP_DETAIL_TOPICS];
const { CPP_ALGO_SNIPPETS } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/cpp-algos.js')).href);

const mode = process.argv.includes('--collect') ? 'collect' : 'write';

// =====================================================================
// 阶段一：写出 .cpp 文件
// =====================================================================
if (mode === 'write') {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  const all = [
    ...CPP_TOPICS.map((t) => ({ ...t, kind: 'topic' })),
    ...CPP_ALGO_SNIPPETS.map((a) => ({ ...a, kind: 'algo' })),
  ];

  const manifest = [];
  for (const item of all) {
    const file = `${item.id}.cpp`;
    fs.writeFileSync(path.join(BUILD_DIR, file), item.code, 'utf8');
    manifest.push({ id: item.id, title: item.title, group: item.group || '算法 C++ 实现', kind: item.kind, file });
  }
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('C++ 示例编译验证（阶段一：写出源文件）\n' + '='.repeat(58));
  console.log(`  已写出 ${manifest.length} 个 .cpp 文件到 .cpp-build/`);
  console.log(`  其中知识点 ${CPP_TOPICS.length} 个，算法实现 ${CPP_ALGO_SNIPPETS.length} 个`);
  console.log('');
  console.log('  下一步请运行：pwsh tests/build-cpp.ps1');
  console.log('  然后运行：    node tests/build-cpp.js --collect');
  process.exit(0);
}

// =====================================================================
// 阶段三：收集编译结果
// =====================================================================
if (!fs.existsSync(RESULTS_FILE)) {
  console.error('找不到 .cpp-build/results.json');
  console.error('请先运行 pwsh tests/build-cpp.ps1');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
const raw = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

/** PowerShell 的 ConvertTo-Json 在只有一个条目时会退化成对象，这里统一成数组。 */
const arr = Array.isArray(raw) ? raw : Object.entries(raw).map(([id, v]) => ({ id, ...v }));
const byId = new Map();
for (const item of arr) {
  if (item.id) { byId.set(item.id, item); continue; }
  // 老格式：以 id 为键的对象
  for (const [id, v] of Object.entries(item)) {
    if (v && typeof v === 'object') byId.set(id, { id, ...v });
  }
}

console.log('C++ 示例编译验证（阶段三：收集结果）\n' + '='.repeat(58));

const results = {};
let passed = 0, failed = 0;
const failures = [];

for (const m of manifest) {
  const r = byId.get(m.id);
  if (!r) {
    failed++;
    failures.push({ id: m.id, title: m.title, error: '缺少编译结果' });
    results[m.id] = { kind: m.kind, verified: false, error: '缺少编译结果', stdout: '' };
    continue;
  }
  if (r.ok) {
    passed++;
    results[m.id] = {
      kind: m.kind,
      title: m.title,
      verified: true,
      stdout: String(r.stdout || '').replace(/\r\n/g, '\n'),
    };
    const first = String(r.stdout || '').trim().split('\n')[0] || '(无输出)';
    console.log(`  ✓ ${m.id.padEnd(24)} ${first.slice(0, 38)}`);
  } else {
    failed++;
    const err = String(r.error || '编译失败').slice(0, 120);
    failures.push({ id: m.id, title: m.title, error: err });
    results[m.id] = { kind: m.kind, title: m.title, verified: false, error: err, stdout: '' };
    console.log(`  ✗ ${m.id.padEnd(24)} ${err.slice(0, 50)}`);
  }
}

// 写出页面用的数据
const previous = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : {};

/**
 * 编译器版本由编译阶段（PowerShell）写进 .cpp-build/compiler.txt。
 * 如果读不到，就从旧的 cpp-output.json 里沿用，都没有则标注「未记录」——
 * 不编造版本号，因为「用了哪个编译器」这件事必须是可追溯的。
 */
let compilerVersion = previous?.meta?.compilerVersion || '';
const compilerInfoFile = path.join(BUILD_DIR, 'compiler.txt');
if (fs.existsSync(compilerInfoFile)) {
  compilerVersion = fs.readFileSync(compilerInfoFile, 'utf8').trim();
}
if (!compilerVersion || compilerVersion === 'unknown') {
  compilerVersion = compilerVersion || '未记录（请重新运行编译阶段）';
}

const meta = {
  generatedAt: new Date().toISOString(),
  compiler: 'g++ -std=c++17 -O2',
  compilerVersion,
  note: '本文件由构建脚本生成：每个 C++ 示例都经真实编译运行，stdout 为程序真实输出。'
      + '浏览器无法编译 C++，所以页面上展示的是这份预先录制的输出，不能重新运行。',
  total: manifest.length,
  passed,
  failed,
};
fs.writeFileSync(OUT_FILE, JSON.stringify({ meta, results }, null, 2), 'utf8');

/**
 * 同时产出 .js 版本。
 *
 * 为什么需要两份：
 *   - .json 便于人工查看与外部工具消费
 *   - .js  供页面 import —— 直接 import JSON 需要 import assertions，
 *           各浏览器支持度不一致，会让「打开就能用」变脆弱。
 * 页面只用 .js 这份，避免兼容性风险。
 */
const JS_FILE = path.join(ROOT, 'src/syntax/cpp-output.js');
const jsContent =
  '/**\n' +
  ' * 本文件由 tests/build-cpp.js 自动生成，请勿手改。\n' +
  ' *\n' +
  ' * 内容：每个 C++ 示例经 g++ 真实编译运行后的 stdout。\n' +
  ' * 生成方式：node tests/build-cpp.js → 编译 → node tests/build-cpp.js --collect\n' +
  ` * 编译器：${meta.compiler}\n` +
  ` * 生成时间：${meta.generatedAt}\n` +
  ' *\n' +
  ' * 为什么页面不直接编译 C++：浏览器没有 C++ 编译器，\n' +
  ' * 且本项目部署在 GitHub Pages（纯静态、无后端），所以只能预先录制输出。\n' +
  ' */\n\n' +
  'export const CPP_OUTPUT = ' + JSON.stringify({ meta, results }, null, 2) + ';\n';
fs.writeFileSync(JS_FILE, jsContent, 'utf8');

console.log('');
console.log('='.repeat(58));
console.log(`共 ${manifest.length} 个示例：通过 ${passed}，失败 ${failed}`);
console.log(`已写入 ${path.relative(ROOT, OUT_FILE)}`);
console.log(`已写入 ${path.relative(ROOT, JS_FILE)}（页面用这份）`);

if (failures.length > 0) {
  console.log('\n失败详情：');
  failures.forEach((f) => console.log(`  ✗ ${f.id} (${f.title})\n      ${f.error}`));
  process.exit(1);
}
console.log('结果：全部编译运行成功 ✓\n');
