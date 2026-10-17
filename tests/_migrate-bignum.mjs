/**
 * 一次性迁移：bignum.js 高精度四算法接入 extraRow 可视化。
 * 主数组 = A 的各位，B 与结果用辅助行按位对齐显示。
 * 运行一次即可删除。
 */
import fs from 'node:fs';

const f = 'src/algorithms/bignum.js';
let c = fs.readFileSync(f, 'utf8');
let done = 0;

function rep(oldStr, newStr, label) {
  if (c.includes(oldStr)) { c = c.replace(oldStr, newStr); done++; console.log('  ✓ ' + label); }
  else { done = -1000; console.log('  ✗ 未找到: ' + label); }
}

// ============ bigAdd ============
rep(
  "  const t = new SpanTracer([], {\n    title: '高精度加法',\n    explain: '从个位开始逐位相加，满 10 就向高位进 1。用数组存每一位，所以位数不受整数类型限制。',",
  "  const digits0 = [];\n  for (let i = 0; i < n; i++) digits0.push(a[i] ?? 0);\n  const t = new SpanTracer(digits0, {\n    title: '高精度加法',\n    explain: '上排是 A，第二排是 B，逐位相加、满 10 进 1。最下面的绿色行是算出的结果（逐位出现）。',",
  'bigAdd: tracer 构造（传入 A 的各位）'
);

rep(
  "  // 用 A 的各位作为展示数组（不足的位补 0）\n  const digits = [];\n  for (let i = 0; i < n; i++) digits.push(a[i] ?? 0);\n  t.array = digits.slice();\n\n  t.note(`计算 ${fromDigits(a)} + ${fromDigits(b)}（共 ${n} 位，低位在前存储）`);",
  "  // B 的各位作为辅助行 0，按位对齐\n  const bRow = [];\n  for (let i = 0; i < n; i++) bRow.push(b[i] ?? 0);\n  t.extraRow(0, 'B', bRow);\n\n  t.note(`计算 ${fromDigits(a)} + ${fromDigits(b)}（共 ${n} 位，低位在前存储）`);",
  'bigAdd: B 行'
);

rep(
  "  const result = [];\n  let carry = 0;\n  t.accumulate('进位', 0, '初始进位为 0');\n\n  for (let i = 0; i < n; i++) {\n    const da = a[i] ?? 0;\n    const db = b[i] ?? 0;\n    const sum = da + db + carry;\n\n    t.pointer('i', Math.min(i, t.array.length - 1), `第 ${i} 位：${da} + ${db} + 进位${carry} = ${sum}`);\n\n    const digit = sum % 10;\n    carry = Math.floor(sum / 10);\n    result.push(digit);\n\n    t.accumulate('进位', carry, carry > 0 ? `满 10，向高位进 ${carry}` : '没有进位');\n    t.accumulate('本位结果', digit);\n  }",
  "  const result = [];\n  let carry = 0;\n  t.accumulate('进位', 0, '初始进位为 0');\n\n  // 结果行（slot 1）：随计算逐位出现\n  const resultRow = new Array(n).fill(null);\n  t.extraRow(1, '结果', resultRow);\n\n  for (let i = 0; i < n; i++) {\n    const da = a[i] ?? 0;\n    const db = b[i] ?? 0;\n    const sum = da + db + carry;\n\n    t.pointer('i', i, `第 ${i} 位：${da} + ${db} + 进位${carry} = ${sum}`);\n\n    const digit = sum % 10;\n    carry = Math.floor(sum / 10);\n    result.push(digit);\n    resultRow[i] = digit;\n    t.extraRow(1, '结果', resultRow);   // 结果逐位出现\n\n    t.accumulate('进位', carry, carry > 0 ? `满 10，向高位进 ${carry}` : '没有进位');\n  }",
  'bigAdd: 结果行'
);

fs.writeFileSync(f, c, 'utf8');
console.log('bigAdd 完成 ' + done + ' 处（负数表示失败）');
