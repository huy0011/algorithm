/**
 * 一次性迁移：factory.js 各 inputKind 接入规模参数。
 * 运行一次即可删除。
 */
import fs from 'node:fs';

const f = 'src/render/factory.js';
let c = fs.readFileSync(f, 'utf8');
let done = 0;

function rep(oldStr, newStr, label) {
  if (c.includes(oldStr)) { c = c.replace(oldStr, newStr); done++; console.log('  ✓ ' + label); }
  else console.log('  ✗ 未找到: ' + label);
}

// ropes
rep(
  "    case 'ropes': {\n      const n = 4;",
  "    case 'ropes': {\n      const n = config.ropes ?? 4;",
  'ropes 数量'
);
rep(
  "      return { input: arr, options: { pieces: 5 } };",
  "      // 切的段数随绳数走：绳多段也多，保持演示有意义\n      return { input: arr, options: { pieces: Math.max(2, Math.round(n * 1.5)) } };",
  'ropes 段数'
);

// bigNumbers 位数
rep(
  "      const lenA = 18 + Math.floor(Math.random() * 4);\n      const lenB = 14 + Math.floor(Math.random() * 4);",
  "      const lenA = config.digits ?? 20;\n      const lenB = Math.max(5, Math.floor(lenA * 0.7));",
  'bigNumbers 位数'
);

// bigNumbersSmall 位数
rep(
  "      return { input: [], options: { a: randBig(5), b: randBig(5) } };",
  "      const dl = config.digits ?? 5;\n      return { input: [], options: { a: randBig(dl), b: randBig(Math.max(2, dl - 1)) } };",
  'bigNumbersSmall 位数'
);

// factorial
rep(
  "      return { input: [], options: { n: 22 + Math.floor(Math.random() * 8) } };",
  "      return { input: [], options: { n: config.size ?? 25 } };",
  'factorial n'
);

// stringPair 长度
rep(
  "      const textLen = 18 + Math.floor(Math.random() * 8);\n      const patLen = 3 + Math.floor(Math.random() * 3);",
  "      const textLen = config.size ?? 22;\n      const patLen = config.patternLen ?? 4;",
  'stringPair 长度'
);

// graph 点数：makeWeightedGraph 目前只有 2 个固定布局，
// 这里按点数截取/扩展边集（点数>6 时生成简单链+环）
rep(
  "    case 'graph': {\n      const seed = Math.floor(Math.random() * 2);\n      const graph = makeWeightedGraph(seed);\n      return { input: [], options: { graph, start: 0 } };\n    }",
  [
    "    case 'graph': {",
    '      const want = config.nodeCount ?? 6;',
    '      const graph = makeWeightedGraph(Math.floor(Math.random() * 2), want);',
    '      return { input: [], options: { graph, start: 0 } };',
    '    }',
  ].join('\n'),
  'graph 点数'
);

// dag 点数
rep(
  "    case 'dag': {\n      // 有向无环：任务依赖\n      const n = 6;\n      const edges = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [2, 5], [5, 4]];\n      return { input: [], options: { n, edges } };\n    }",
  [
    "    case 'dag': {",
    '      // 有向无环：任务依赖。点数可调，边按「层间连边」生成保证无环',
    '      const n = config.nodeCount ?? 6;',
    '      const edges = [];',
    '      for (let u = 0; u < n; u++) {',
    '        // 每个点连到后面的 1~2 个点（只向后连，天然无环）',
    '        const jumps = 1 + Math.floor(Math.random() * 2);',
    '        for (let k = 0; k < jumps; k++) {',
    '          const v = u + 1 + Math.floor(Math.random() * Math.max(1, (n - u) / 2));',
    '          if (v < n && !edges.some(([a, b]) => a === u && b === v)) edges.push([u, v]);',
    '        }',
    '      }',
    "      return { input: [], options: { n, edges } };",
    '    }',
  ].join('\n'),
  'dag 点数'
);

// words 个数
rep(
  "      const words = sets[Math.floor(Math.random() * sets.length)];\n      return { input: [], options: { words, queries: ['app', 'car', 'zzz'].filter((q) => q) } };",
  [
    '      const base = sets[Math.floor(Math.random() * sets.length)];',
    '      // 按滑块取前 wordCount 个单词',
    "      const words = base.slice(0, Math.max(1, config.wordCount ?? base.length));",
    "      const queries = ['app', 'car', 'zzz'].filter((q) => q);",
    "      return { input: [], options: { words, queries } };",
  ].join('\n'),
  'words 个数'
);

// text 长度（括号串按长度截取/扩展）
rep(
  "        return { input: [], options: { text: samples[Math.floor(Math.random() * samples.length)] } };",
  "        let text = samples[Math.floor(Math.random() * samples.length)];\n        const want = config.textLen ?? text.length;\n        while (text.length < want) text += text;   // 复制扩展到目标长度\n        text = text.slice(0, want);\n        return { input: [], options: { text } };",
  'text 长度'
);

// 队列任务数
rep(
  "        const tasks = taskSets[Math.floor(Math.random() * taskSets.length)];\n        return { input: [], options: { tasks } };",
  "        const base = taskSets[Math.floor(Math.random() * taskSets.length)];\n        const tasks = base.slice(0, Math.max(2, config.textLen ?? base.length));\n        return { input: [], options: { tasks } };",
  'queue 任务数'
);

fs.writeFileSync(f, c, 'utf8');
console.log('共完成 ' + done + ' 处');
