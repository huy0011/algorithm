/**
 * 一次性迁移（续）：bigSub / bigMul / KMP 接入 extraRow 可视化。
 * 运行一次即可删除。
 */
import fs from 'node:fs';

// ============ bignum.js: bigSub ============
{
  const f = 'src/algorithms/bignum.js';
  let c = fs.readFileSync(f, 'utf8');
  let ok = 0;

  rep(
    "  const t = new SpanTracer([], {\n    title: '高精度减法',\n    explain: '从个位开始逐位相减，不够减就向前一位借 1（借来的 1 当 10 用）。',",
    "  const digits0 = [];\n  for (let i = 0; i < n; i++) digits0.push(a[i] ?? 0);\n  const t = new SpanTracer(digits0, {\n    title: '高精度减法',\n    explain: '上排是 A，第二排是 B，逐位相减、不够就向前借 1。最下面的绿色行是算出的结果。',",
    'bigSub: tracer 构造'
  );
  rep(
    "  const digits = [];\n  for (let i = 0; i < n; i++) digits.push(a[i] ?? 0);\n  t.array = digits.slice();\n\n  t.note(`计算 ${fromDigits(a)} − ${fromDigits(b)}`);",
    "  const bRow = [];\n  for (let i = 0; i < n; i++) bRow.push(b[i] ?? 0);\n  t.extraRow(0, 'B', bRow);\n\n  t.note(`计算 ${fromDigits(a)} − ${fromDigits(b)}`);",
    'bigSub: B 行'
  );
  rep(
    "    borrow = newBorrow;\n    result.push(diff);\n    t.accumulate('借位', borrow, borrow ? '向高位借了 1' : '没借位');\n  }",
    "    borrow = newBorrow;\n    result.push(diff);\n    resultRow[i] = diff;\n    t.extraRow(1, '结果', resultRow);\n    t.accumulate('借位', borrow, borrow ? '向高位借了 1' : '没借位');\n  }",
    'bigSub: 结果行更新'
  );
  rep(
    "  const result = [];\n  let borrow = 0;\n  t.accumulate('借位', 0, '初始没有借位');",
    "  const result = [];\n  const resultRow = new Array(n).fill(null);\n  t.extraRow(1, '结果', resultRow);\n  let borrow = 0;\n  t.accumulate('借位', 0, '初始没有借位');",
    'bigSub: 结果行初始化'
  );

  function rep(o, n, label) {
    if (c.includes(o)) { c = c.replace(o, n); ok++; console.log('  ✓ ' + label); }
    else { ok = -1000; console.log('  ✗ 未找到: ' + label); }
  }

  fs.writeFileSync(f, c, 'utf8');
  console.log('bigSub 完成 ' + ok + ' 处');
}

// ============ bignum.js: bigMul ============
{
  const f = 'src/algorithms/bignum.js';
  let c = fs.readFileSync(f, 'utf8');
  let ok = 0;
  function rep(o, n, label) {
    if (c.includes(o)) { c = c.replace(o, n); ok++; console.log('  ✓ ' + label); }
    else { ok = -1000; console.log('  ✗ 未找到: ' + label); }
  }

  rep(
    "  const t = new SpanTracer([], {\n    title: '高精度乘法',\n    explain: 'a 的第 i 位乘 b 的第 j 位，结果累加到第 i+j 位上；最后从低位到高位统一处理进位。',",
    "  const digits0 = a.slice();\n  const t = new SpanTracer(digits0, {\n    title: '高精度乘法',\n    explain: '上排是 a。a 的第 i 位乘 b 的第 j 位，结果累加到第 i+j 位；最后统一进位。绿色行是最终结果。',",
    'bigMul: tracer 构造'
  );
  rep(
    "  const digits = [];\n  for (let i = 0; i < a.length; i++) digits.push(a[i]);\n  t.array = digits.slice();\n\n",
    "  // b 与结果作为辅助行\n  t.extraRow(0, 'B', b.slice());\n  const resultRowFull = new Array(a.length + b.length).fill(null);\n  t.extraRow(1, '结果', resultRowFull.slice(0, a.length));\n\n",
    'bigMul: 辅助行'
  );

  fs.writeFileSync(f, c, 'utf8');
  console.log('bigMul 完成 ' + ok + ' 处');
}

// ============ string.js: KMP ============
{
  const f = 'src/algorithms/string.js';
  let c = fs.readFileSync(f, 'utf8');
  let ok = 0;
  function rep(o, n, label) {
    if (c.includes(o)) { c = c.replace(o, n); ok++; console.log('  ✓ ' + label); }
    else { ok = -1000; console.log('  ✗ 未找到: ' + label); }
  }

  // 主数组改为传入主串字符（原来传 []，画面空白）
  rep(
    "  const textArr = encode(text);\n\n  const t = new SpanTracer(textArr, {\n    title: 'KMP 字符串匹配',",
    "  const textArr = encode(text);\n\n  const t = new SpanTracer(textArr, {\n    title: 'KMP 字符串匹配',"
  );
  // 上面这条是幂等占位；关键改动是把 next 数组也作为辅助行显示
  rep(
    "  const next = buildNext(pattern);\n  t.note(`第一步：计算模式串「${pattern}」的 next 数组 = [${next.join(', ')}]`);\n  for (let i = 0; i < pattern.length; i++) {\n    t.accumulate(`next[${i}]`, next[i], `next[${i}] = ${next[i]}（前缀「${pattern.slice(0, next[i])}」= 后缀）`);\n  }",
    "  const next = buildNext(pattern);\n  t.note(`第一步：计算模式串「${pattern}」的 next 数组 = [${next.join(', ')}]`);\n  // next 数组作为辅助行按位显示（对齐模式串位置）\n  const nextRow = pattern.split('').map(() => null);\n  t.extraRow(0, 'next', nextRow);\n  for (let i = 0; i < pattern.length; i++) {\n    nextRow[i] = next[i];\n    t.extraRow(0, 'next', nextRow);\n    t.accumulate(`next[${i}]`, next[i], `next[${i}] = ${next[i]}（前缀「${pattern.slice(0, next[i])}」= 后缀）`);\n  }",
    'KMP: next 行'
  );

  fs.writeFileSync(f, c, 'utf8');
  console.log('KMP 完成 ' + ok + ' 处');
}
