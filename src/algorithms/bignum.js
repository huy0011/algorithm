/**
 * 高精度运算（大整数加减乘）。
 *
 * 为什么需要它：C++ 里最大的整数类型是 unsigned long long（约 1.8×10¹⁹），
 * 而竞赛题经常要求算 100 位、1000 位的数（阶乘、2 的幂、大数相乘）。
 * 解决办法就是「用数组存每一位，手工模拟竖式」——这就是高精度。
 *
 * 可视化上它非常适合用 span 渲染器：
 *   数组格子 = 每一位数字
 *   命名指针 = 当前处理到哪一位
 *   累加值   = 进位 / 借位
 * 所以这里复用 span 渲染器，不需要新渲染器。
 *
 * 存法约定：**低位在前**（个位存在下标 0）。
 * 这样进位方向与数组下标增长方向一致，写起来最自然。
 */

import { SpanTracer } from './tracer.js';

/** 把数字字符串转成「低位在前」的数组。 */
function toDigits(s) {
  const clean = String(s).replace(/\D/g, '') || '0';
  const digits = [...clean].map((ch) => ch.charCodeAt(0) - 48);
  digits.reverse();          // 低位在前
  // 去掉高位多余的 0（但至少留一位）
  while (digits.length > 1 && digits[digits.length - 1] === 0) digits.pop();
  return digits;
}

/** 把「低位在前」的数组转回字符串。 */
function fromDigits(digits) {
  const s = digits.slice().reverse().join('');
  return s.replace(/^0+(?=\d)/, '');
}

/** 取两个数里较长的长度。 */
const maxLen = (a, b) => Math.max(a.length, b.length);

/**
 * 高精度加法：逐位相加，逢十进一。
 */
function bigAdd(input, options = {}) {
  const A = options.a ?? '98765432109876543210';
  const B = options.b ?? '12345678901234567890';

  const a = toDigits(A);
  const b = toDigits(B);
  const n = maxLen(a, b);

  const t = new SpanTracer([], {
    title: '高精度加法',
    explain: '从个位开始逐位相加，满 10 就向高位进 1。用数组存每一位，所以位数不受整数类型限制。',
    pointers: [
      { name: 'i', color: '#f2b134', label: '当前位' },
    ],
  });

  // 用 A 的各位作为展示数组（不足的位补 0）
  const digits = [];
  for (let i = 0; i < n; i++) digits.push(a[i] ?? 0);
  t.array = digits.slice();

  t.note(`计算 ${fromDigits(a)} + ${fromDigits(b)}（共 ${n} 位，低位在前存储）`);

  const result = [];
  let carry = 0;
  t.accumulate('进位', 0, '初始进位为 0');

  for (let i = 0; i < n; i++) {
    const da = a[i] ?? 0;
    const db = b[i] ?? 0;
    const sum = da + db + carry;

    t.pointer('i', Math.min(i, t.array.length - 1), `第 ${i} 位：${da} + ${db} + 进位${carry} = ${sum}`);

    const digit = sum % 10;
    carry = Math.floor(sum / 10);
    result.push(digit);

    t.accumulate('进位', carry, carry > 0 ? `满 10，向高位进 ${carry}` : '没有进位');
    t.accumulate('本位结果', digit);
  }

  // 处理最后的进位
  if (carry > 0) {
    result.push(carry);
    t.accumulate('最高位进位', carry, `最高位还有进位 ${carry}，结果多一位`);
  }

  // 标注结果
  for (let i = 0; i < result.length && i < t.array.length; i++) t.resolve(i, `结果第 ${i} 位 = ${result[i]}`);

  const answer = fromDigits(result);
  t.note(`结果：${fromDigits(a)} + ${fromDigits(b)} = ${answer}`);

  // 用原生 BigInt 对拍，确认动画展示的确实是对的
  const check = (BigInt(fromDigits(a)) + BigInt(fromDigits(b))).toString();
  t.note(check === answer ? '✓ 与 BigInt 精确计算结果一致' : `✗ 与 BigInt 不一致（BigInt 得 ${check}）`);

  return { tracer: t, result, answer, correct: check === answer };
}

/**
 * 高精度减法：逐位相减，不够减就向前借位。要求 A ≥ B。
 */
function bigSub(input, options = {}) {
  const A = options.a ?? '98765432109876543210';
  const B = options.b ?? '12345678901234567890';

  const a = toDigits(A);
  const b = toDigits(B);
  const n = maxLen(a, b);

  const t = new SpanTracer([], {
    title: '高精度减法',
    explain: '从个位开始逐位相减，不够减就向前一位借 1（借来的 1 当 10 用）。',
    pointers: [{ name: 'i', color: '#f2b134', label: '当前位' }],
  });

  const digits = [];
  for (let i = 0; i < n; i++) digits.push(a[i] ?? 0);
  t.array = digits.slice();

  t.note(`计算 ${fromDigits(a)} − ${fromDigits(b)}`);

  const result = [];
  let borrow = 0;
  t.accumulate('借位', 0, '初始没有借位');

  for (let i = 0; i < n; i++) {
    const da = (a[i] ?? 0) - borrow;
    const db = b[i] ?? 0;
    let diff = da - db;
    let newBorrow = 0;

    if (diff < 0) {
      diff += 10;
      newBorrow = 1;
      t.pointer('i', i, `第 ${i} 位：${da} − ${db} 不够减，向前借 1 → ${da + 10} − ${db} = ${diff}`);
    } else {
      t.pointer('i', i, `第 ${i} 位：${da} − ${db} = ${diff}`);
    }

    borrow = newBorrow;
    result.push(diff);
    t.accumulate('借位', borrow, borrow ? '向高位借了 1' : '没借位');
  }

  // 去掉高位的 0
  while (result.length > 1 && result[result.length - 1] === 0) result.pop();

  for (let i = 0; i < result.length && i < t.array.length; i++) t.resolve(i, `结果第 ${i} 位 = ${result[i]}`);

  const answer = fromDigits(result);
  t.note(`结果：${answer}`);

  const check = (BigInt(fromDigits(a)) - BigInt(fromDigits(b))).toString();
  t.note(check === answer ? '✓ 与 BigInt 精确计算结果一致' : `✗ 与 BigInt 不一致（BigInt 得 ${check}）`);

  return { tracer: t, result, answer, correct: check === answer };
}

/**
 * 高精度乘法：用一个数的每一位去乘另一个数的每一位，
 * 结果累加到对应位置（i+j），最后统一处理进位。
 */
function bigMul(input, options = {}) {
  const A = options.a ?? '98765';
  const B = options.b ?? '43210';

  const a = toDigits(A);
  const b = toDigits(B);

  const t = new SpanTracer([], {
    title: '高精度乘法',
    explain: 'a 的第 i 位乘 b 的第 j 位，结果累加到第 i+j 位上；最后从低位到高位统一处理进位。',
    pointers: [{ name: 'i', color: '#f2b134', label: 'a 的第 i 位' }],
  });

  const digits = [];
  for (let i = 0; i < a.length; i++) digits.push(a[i]);
  t.array = digits.slice();

  t.note(`计算 ${fromDigits(a)} × ${fromDigits(b)}（a 有 ${a.length} 位，b 有 ${b.length} 位）`);

  // 结果最多 a.length + b.length 位
  const tmp = new Array(a.length + b.length).fill(0);

  for (let i = 0; i < a.length; i++) {
    t.pointer('i', i, `用 a 的第 ${i} 位（${a[i]}）去乘 b 的每一位`);
    for (let j = 0; j < b.length; j++) {
      tmp[i + j] += a[i] * b[j];
      t.accumulate(`tmp[${i + j}]`, tmp[i + j], `${a[i]} × ${b[j]} = ${a[i] * b[j]} 累加到第 ${i + j} 位`);
    }
  }

  t.note('各位乘积已累加完，现在从低位到高位统一处理进位');

  // 统一进位
  let carry = 0;
  const result = [];
  for (let i = 0; i < tmp.length; i++) {
    const sum = tmp[i] + carry;
    result.push(sum % 10);
    carry = Math.floor(sum / 10);
    t.accumulate('进位', carry, `第 ${i} 位：${tmp[i]} + 进位 = ${sum}，保留 ${sum % 10}，进位 ${carry}`);
  }

  while (result.length > 1 && result[result.length - 1] === 0) result.pop();
  for (let i = 0; i < result.length && i < t.array.length; i++) t.resolve(i, `结果第 ${i} 位 = ${result[i]}`);

  const answer = fromDigits(result);
  t.note(`结果：${answer}`);

  const check = (BigInt(fromDigits(a)) * BigInt(fromDigits(b))).toString();
  t.note(check === answer ? '✓ 与 BigInt 精确计算结果一致' : `✗ 与 BigInt 不一致（BigInt 得 ${check}）`);

  return { tracer: t, result, answer, correct: check === answer };
}

/**
 * 高精度阶乘：演示「多少次运算之后普通整数就装不下了」。
 * 20! 就已经接近 long long 的上限。
 */
function bigFactorial(input, options = {}) {
  const n = options.n ?? 25;

  const t = new SpanTracer([], {
    title: '高精度阶乘 · n!',
    explain: '阶乘增长极快：20! 就接近 long long 上限，再大就必须用高精度。这里用数组逐位乘。',
    pointers: [{ name: 'i', color: '#f2b134', label: '当前乘到几' }],
  });

  let digits = [1];   // 低位在前，从 1 开始
  t.array = digits.slice();
  t.note(`计算 ${n}!（从 1 开始逐位乘上去）`);

  const milestones = [];
  for (let k = 2; k <= n; k++) {
    // 每一位乘 k，再统一进位
    let carry = 0;
    for (let i = 0; i < digits.length; i++) {
      const prod = digits[i] * k + carry;
      digits[i] = prod % 10;
      carry = Math.floor(prod / 10);
    }
    while (carry > 0) {
      digits.push(carry % 10);
      carry = Math.floor(carry / 10);
    }
    t.pointer('i', Math.min(k - 2, Math.max(0, digits.length - 1)), `乘到 ${k}，结果已有 ${digits.length} 位`);
    t.accumulate('当前 i', k, `${k}! 的位数：${digits.length}`);

    // 记录几个关键点，说明为什么需要高精度
    if (k === 20 || k === 21 || k === n) {
      milestones.push({ k, digits: digits.length, value: fromDigits(digits) });
    }
  }

  for (let i = 0; i < digits.length; i++) t.resolve(i, `第 ${i} 位`);

  const answer = fromDigits(digits);
  t.note(`${n}! = ${answer.length} 位数`);
  t.note('对比：long long 最多表示约 19 位数，20! 就已经逼近上限，21! 必定溢出。');

  // BigInt 对拍
  let expect = 1n;
  for (let k = 2; k <= n; k++) expect *= BigInt(k);
  const check = expect.toString();
  t.note(check === answer ? '✓ 与 BigInt 精确计算结果一致' : '✗ 与 BigInt 不一致');

  return { tracer: t, answer, digits: digits.length, milestones, correct: check === answer };
}

export const BIGNUM_ALGORITHMS = {
  bigAdd: {
    id: 'bigAdd',
    name: '高精度加法',
    en: 'Big Integer Addition',
    category: 'bignum',
    complexity: { time: 'O(n)', space: 'O(n)' },
    blurb: '逐位相加、逢十进一。用数组存每一位，位数不受整数类型限制。',
    inputKind: 'bigNumbers',
    run: bigAdd,
    cppTopics: ['cpp-array', 'cpp-loops', 'cpp-char-bool'],
  },
  bigSub: {
    id: 'bigSub',
    name: '高精度减法',
    en: 'Big Integer Subtraction',
    category: 'bignum',
    complexity: { time: 'O(n)', space: 'O(n)' },
    blurb: '逐位相减，不够减就向前借 1（借来的 1 当 10 用）。',
    inputKind: 'bigNumbers',
    run: bigSub,
    cppTopics: ['cpp-array', 'cpp-loops', 'cpp-branch'],
  },
  bigMul: {
    id: 'bigMul',
    name: '高精度乘法',
    en: 'Big Integer Multiplication',
    category: 'bignum',
    complexity: { time: 'O(n²)', space: 'O(n)' },
    blurb: '第 i 位乘第 j 位的结果累加到第 i+j 位，最后统一处理进位。',
    inputKind: 'bigNumbersSmall',
    run: bigMul,
    cppTopics: ['cpp-array', 'cpp-nested-loop', 'cpp-loops'],
  },
  bigFactorial: {
    id: 'bigFactorial',
    name: '高精度阶乘',
    en: 'Big Factorial',
    category: 'bignum',
    complexity: { time: 'O(n²)', space: 'O(n)' },
    blurb: '阶乘增长极快，20! 就逼近 long long 上限。用数组逐位乘，位数再多也不怕。',
    inputKind: 'factorial',
    run: bigFactorial,
    cppTopics: ['cpp-array', 'cpp-loops', 'cpp-overflow'],
  },
};
