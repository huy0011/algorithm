/**
 * 语法基础教程内容。
 *
 * 设计原则：每个知识点都必须配**可以真跑**的代码示例，而不是只贴一段文字。
 * 页面会把 code 放进沙箱里执行，把真实输出显示出来 ——
 * 这样「看讲解」和「看到结果」是同一件事，比读死例子有效得多。
 *
 * 每个知识点还有一个 id，算法注册表里的 syntaxTopics 会引用这些 id，
 * 从而把「算法」和「它用到的语法」双向连起来。
 *
 * 示例代码的约定：
 *   - 用 return 交出结果，页面会把它打印出来
 *   - 也可以用 console.log，页面会一并收集
 *   - 不允许访问 DOM / 网络（沙箱里只会暴露必要的全局对象）
 */

export const SYNTAX_TOPICS = [
  // ==================== 第一部分：语言基础 ====================
  {
    id: 'variables',
    group: '语言基础',
    title: '变量与常量',
    summary: 'let 可重新赋值，const 不能。优先用 const，需要变才用 let。',
    points: [
      'const 声明的绑定不能再指向别的值，但对象内部仍可修改',
      'var 是旧写法，有变量提升和作用域问题，新代码不该再用',
      '命名用「小驼峰」：第一个词小写，后面每个词首字母大写',
    ],
    code: `const name = 'AlgoViz';
let count = 0;

count = count + 1;      // let 可以改
// name = 'x';          // 取消注释会报错：Assignment to constant variable

// const 的对象内部属性可以改
const config = { size: 10 };
config.size = 20;       // 合法

return { name, count, configSize: config.size };`,
  },

  {
    id: 'number-types',
    group: '语言基础',
    title: '数字与整数运算',
    summary: 'JS 只有一种数字类型（双精度浮点），整数运算是「假装」的。',
    points: [
      '除法永远得到小数，想要整数要用 Math.floor 向下取整',
      '求余用 %，判断奇偶、取某一位数字都靠它',
      '别用 == 比较数字，用 ===；NaN 和任何值都不相等，包括自己',
    ],
    code: `const a = 7, b = 2;

const division = a / b;              // 3.5，不是整数
const intDiv = Math.floor(a / b);    // 3
const remainder = a % b;             // 1

// 取一个数的某一位（基数排序就靠它）
const num = 4728;
const onesDigit = Math.floor(num / 1) % 10;    // 8
const tensDigit = Math.floor(num / 10) % 10;   // 2
const hundreds  = Math.floor(num / 100) % 10;  // 7

return { division, intDiv, remainder, onesDigit, tensDigit, hundreds };`,
  },

  {
    id: 'math-floor',
    group: '语言基础',
    title: 'Math.floor / ceil / round / abs',
    summary: '取整三兄弟，写算法时最常用的是 floor。',
    points: [
      'Math.floor(x) 向下取整：3.9 → 3，-3.1 → -4',
      'Math.ceil(x) 向上取整：3.1 → 4',
      'Math.round(x) 四舍五入；Math.abs(x) 取绝对值',
      '二分查找求中点时用 Math.floor((lo+hi)/2)',
    ],
    code: `const x = 3.7;

const results = {
  floor: Math.floor(x),
  ceil: Math.ceil(x),
  round: Math.round(x),
  abs: Math.abs(-5),
  sqrt: Math.sqrt(16),
  pow: Math.pow(2, 10),
};

// 二分查找里的中点计算
const lo = 0, hi = 7;
const mid = Math.floor((lo + hi) / 2);   // 3

return { ...results, mid };`,
  },

  // ==================== 第二部分：字符串与判断 ====================
  {
    id: 'string-basics',
    group: '字符串与判断',
    title: '字符串基础',
    summary: '模板字符串拼串，length 取长度，下标取字符。',
    points: [
      '模板字符串用反引号，${} 里可以放任意表达式',
      '字符串下标从 0 开始，str[0] 是第一个字符',
      'for...of 遍历字符串会按「字符」拆，比下标更安全',
      '字符串是不可变的：所有「修改」方法都返回新字符串',
    ],
    code: `const s = 'algo';
const n = 42;

const template = \`\${s} 有 \${s.length} 个字符，答案是 \${n}\`;

// 遍历字符
const chars = [];
for (const ch of s) chars.push(ch.toUpperCase());

// 常用方法
const upper = s.toUpperCase();
const sliced = 'visualization'.slice(0, 6);

return { template, chars, upper, sliced, first: s[0] };`,
  },

  {
    id: 'comparison-ops',
    group: '字符串与判断',
    title: '比较运算符',
    summary: '始终用 === 和 !==，不要用 == 和 !=。',
    points: [
      '== 会做隐式类型转换："1" == 1 是 true，这几乎总是 bug',
      '=== 严格比较，类型不同直接 false',
      '< > <= >= 比较大小，比较字符串是按字典序',
      '比较结果永远是布尔值 true / false',
    ],
    code: `const list = [1, '1', 2];

const results = {
  looseEqual: 1 == '1',        // true —— 危险
  strictEqual: 1 === '1',      // false —— 正确
  numberLt: 1 < 2,             // true
  stringCompare: 'apple' < 'banana',  // 按字典序
  mixedCompare: 10 < '9',      // 字符串被转成数字，false
};

return results;`,
  },

  {
    id: 'if-else',
    group: '字符串与判断',
    title: '条件分支',
    summary: 'if / else if / else，以及三元运算符。',
    points: [
      'if 后面的表达式会被转成布尔值判断（真值/假值）',
      '假值有 6 个：false, 0, "", null, undefined, NaN，其余都是真值',
      '三元运算符 a ? b : c 适合简单的二选一',
      '分支多了用 switch 或查表对象更清晰',
    ],
    code: `function describe(n) {
  if (n > 0) return '正数';
  else if (n < 0) return '负数';
  else return '零';
}

const falsy = [false, 0, '', null, undefined, NaN];
const truthyCheck = falsy.map((v) => Boolean(v));  // 全是 false

// 三元
const label = 5 > 3 ? '大' : '小';

return { describe: [describe(3), describe(-1), describe(0)], truthyCheck, label };`,
  },

  {
    id: 'truthiness',
    group: '字符串与判断',
    title: '真值与假值',
    summary: '判断「有没有值」时，要分清 0 和空字符串的陷阱。',
    points: [
      '假值只有 6 个：false、0、""、null、undefined、NaN',
      '[] 和 {} 都是真值！空数组也是真值，这点最容易踩坑',
      '判断数组是否为空要用 arr.length === 0',
      '?? 只判断 null/undefined，|| 会把 0 和 "" 也当成空',
    ],
    code: `const emptyArray = [];
const results = {
  emptyArrayIsTruthy: Boolean(emptyArray),      // true！坑
  emptyArrayLength: emptyArray.length === 0,    // 正确判断方式

  // || 的陷阱：0 是假值，会被替换掉
  withOr: 0 || 'default',    // 'default' —— 可能不是你想要的
  // ?? 只在 null/undefined 时替换
  withNullish: 0 ?? 'default',  // 0 —— 保留

  nullFallback: null ?? 'fallback',
};

return results;`,
  },

  // ==================== 第三部分：数组 ====================
  {
    id: 'array-basics',
    group: '数组',
    title: '数组基础',
    summary: '创建、读取、修改，以及长度。',
    points: [
      '下标从 0 开始，arr[arr.length - 1] 是最后一个',
      '越界读取返回 undefined，不会报错 —— 这是很多 bug 的来源',
      'arr.length 可以赋值，用来截断数组',
      '用 Array.from({length: n}) 或 new Array(n).fill(v) 创建定长数组',
    ],
    code: `const arr = [10, 20, 30];

const info = {
  first: arr[0],
  last: arr[arr.length - 1],
  outOfBounds: arr[99],          // undefined，不报错
  length: arr.length,
};

// 创建定长数组的两种方式
const zeros = new Array(3).fill(0);        // [0, 0, 0]
const seq = Array.from({ length: 3 }, (_, i) => i * 2);  // [0, 2, 4]

// 截断
const copy = [1, 2, 3, 4, 5];
copy.length = 3;               // [1, 2, 3]

return { ...info, zeros, seq, truncated: copy };`,
  },

  {
    id: 'array-push-pop',
    group: '数组',
    title: 'push / pop / shift / unshift',
    summary: '在数组两端增删元素，栈和队列就靠这四个方法。',
    points: [
      'push 加到末尾，pop 从末尾取 —— 组合起来就是「栈」（后进先出）',
      'push + shift 组合起来就是「队列」（先进先出）',
      'shift/unshift 要移动整个数组，比 push/pop 慢（O(n) vs O(1)）',
      '这四个方法都会**修改原数组**',
    ],
    code: `// 当栈用：后进先出 LIFO
const stack = [];
stack.push('a');
stack.push('b');
const popped = stack.pop();     // 'b' —— 最后进的先出
const stackLeft = [...stack];   // ['a']

// 当队列用：先进先出 FIFO
const queue = [];
queue.push('a');
queue.push('b');
const shifted = queue.shift();  // 'a' —— 最先进的先出
const queueLeft = [...queue];   // ['b']

return { popped, stackLeft, shifted, queueLeft };`,
  },

  {
    id: 'nested-array',
    group: '数组',
    title: '二维数组',
    summary: '数组的数组。网格、矩阵、桶都用它表示。',
    points: [
      'grid[r][c] 先取行再取列，顺序别搞反',
      '创建二维数组必须逐行创建，不能 new Array(r).fill([]) —— 那样每行是同一个引用',
      '遍历用嵌套循环，外层行、内层列',
      '行数和列数：grid.length 与 grid[0].length',
    ],
    code: `const rows = 3, cols = 4;
const grid = [];
for (let r = 0; r < rows; r++) {
  const row = [];
  for (let c = 0; c < cols; c++) row.push(r * cols + c);
  grid.push(row);
}

// 陷阱示范：这样写每行都是同一个数组
const bad = new Array(2).fill([]);
bad[0].push('x');
const badIsShared = bad[1].length === 1;   // true —— 出问题了

return { grid, gridAt1_2: grid[1][2], badIsShared };`,
  },

  {
    id: 'for-loop',
    group: '数组',
    title: 'for 循环',
    summary: '经典三段式 for，以及 for...of。',
    points: [
      'for (初始化; 条件; 步进) 三段都可省略，但两个分号不能省',
      '循环变量用 let 声明，用 var 会有闭包陷阱',
      'for...of 遍历「值」，for...in 遍历「键」（数组别用 for...in）',
      '倒着遍历：for (let i = n - 1; i >= 0; i--)',
    ],
    code: `const arr = [10, 20, 30];

// 经典 for：能拿到下标
const withIndex = [];
for (let i = 0; i < arr.length; i++) {
  withIndex.push(i + ':' + arr[i]);
}

// for...of：只关心值，更简洁
let sum = 0;
for (const v of arr) sum += v;

// 倒序遍历
const reversed = [];
for (let i = arr.length - 1; i >= 0; i--) reversed.push(arr[i]);

return { withIndex, sum, reversed };`,
  },

  {
    id: 'while-loop',
    group: '数组',
    title: 'while 循环与循环控制',
    summary: '条件为真就一直转。用 break 提前退出，continue 跳过本次。',
    points: [
      'while 适合「不知道要转几次」的场景，比如二分查找的区间收窄',
      'break 立刻跳出整个循环，continue 只跳过本次剩下的部分',
      '忘记改变条件变量会导致死循环 —— 这是最常见的 while 事故',
      'do...while 至少执行一次，适合「先做再看条件」的场景',
    ],
    code: `// while：条件不满足就停，适合次数不确定的场景
function findFirstNegative(arr) {
  let i = 0;
  let steps = 0;
  while (i < arr.length) {
    steps++;
    if (arr[i] < 0) return { index: i, value: arr[i], steps };
    i++;
  }
  return { index: -1, steps };
}

// break：找到了就跳出
const nums = [3, 7, 12, 5, 20];
let firstBig = null;
for (const n of nums) {
  if (n > 10) { firstBig = n; break; }
}

// continue：跳过偶数，只累加奇数
let oddSum = 0;
for (const n of nums) {
  if (n % 2 === 0) continue;
  oddSum += n;
}

// 二分查找就是典型的 while 循环
const sorted = [1, 3, 5, 7, 9, 11];
let lo = 0, hi = sorted.length - 1, target = 7, found = -1, rounds = 0;
while (lo <= hi) {                    // 条件是「区间还没空」
  rounds++;
  const mid = lo + Math.floor((hi - lo) / 2);
  if (sorted[mid] === target) { found = mid; break; }
  if (sorted[mid] < target) lo = mid + 1;   // 必须改变边界，否则死循环
  else hi = mid - 1;
}

return {
  negative: findFirstNegative([4, 8, -2, 9]),
  firstBig,
  oddSum,
  binaryFound: { index: found, rounds },
};`,
  },

  {
    id: 'string-length',
    group: '字符串与判断',
    title: '字符串长度与数字转字符串',
    summary: 'String(n) 或 n.toString() 把数字变字符串，length 取长度。',
    points: [
      'String(123).length 是 3 —— 用来数一个数有几位',
      '数字没有 .length 属性，undefined 会让循环条件失效',
      '注意中文字符的 length 也是按 UTF-16 单元算的',
    ],
    code: `const n = 4728;

const asString = String(n);
const digitCount = asString.length;      // 4

// 基数排序靠这个决定要处理几轮
const maxInArray = Math.max(99, 5, 1234);
const roundsNeeded = String(maxInArray).length;   // 4

// 逐个字符取出来
const digits = [];
for (const ch of asString) digits.push(Number(ch));

return { asString, digitCount, roundsNeeded, digits, note: '数字要先转成字符串才能数位数' };`,
  },

  {
    id: 'math-sqrt',
    group: '语言基础',
    title: 'Math.sqrt 与开方',
    summary: '开平方。桶排序用它决定桶的数量，素数判断用它缩小试除范围。',
    points: [
      'Math.sqrt(16) 是 4；结果是浮点数，常配 Math.floor 用',
      '桶排序里桶的数量常取 sqrt(n)，这是经验值',
      '判断素数只需试除到 sqrt(n)，因为因子成对出现',
      'Math.hypot(a, b) 可以直接算欧几里得距离',
    ],
    code: `const n = 49;

const root = Math.sqrt(n);
const floorRoot = Math.floor(root);

// 桶排序里决定桶数量
const dataSize = 100;
const bucketCount = Math.max(1, Math.floor(Math.sqrt(dataSize)));

// 素数判断：只需试除到 sqrt(n)
function isPrime(x) {
  if (x < 2) return false;
  for (let i = 2; i <= Math.floor(Math.sqrt(x)); i++) {
    if (x % i === 0) return false;
  }
  return true;
}

return {
  root,
  floorRoot,
  bucketCount,
  primesUnder30: [2, 3, 4, 5, 16, 17, 29, 30].filter(isPrime),
};`,
  },

  {
    id: 'array-as-stack',
    group: '实用技巧',
    title: '用数组实现栈（后进先出）',
    summary: 'push 进、pop 出。DFS 靠它实现「一路走到底」。',
    points: [
      '栈只在「顶部」进出，最后放进去的最先取出',
      'arr.push(x) 入栈，arr.pop() 出栈，都是 O(1)',
      'DFS 用栈：把邻居压进去，下次取出的就是最后压入的那个',
      '用 shift 或 pop 取出，会让搜索顺序完全不同（BFS vs DFS）',
    ],
    code: `// 手动用一遍栈
const stack = [];
stack.push('第一层');
stack.push('第二层');
stack.push('第三层');

const popped = [];
while (stack.length > 0) popped.push(stack.pop());

// 模拟 DFS 的取点顺序：最后压入的最先被取出
const neighbors = ['上', '右', '下', '左'];
const visitOrder = [];
for (const n of neighbors) stack.push(n);     // 依次压入
while (stack.length > 0) visitOrder.push(stack.pop());

return {
  popped,                      // ['第三层','第二层','第一层']
  visitOrder,                  // ['左','下','右','上'] —— 反过来了
  note: '这正是 DFS「一条道走到黑」的原因',
};`,
  },

  {
    id: 'destructuring',
    group: '对象与集合',
    title: '解构赋值',
    summary: '从数组或对象里「拆」出值，赋值给变量。',
    points: [
      '数组按位置解构：const [a, b] = [1, 2]',
      '对象按键名解构：const { x, y } = point',
      '可以重命名和设默认值：const { x: px = 0 } = point',
      '循环里解构坐标：for (const [r, c] of cells) —— BFS 里到处都是',
      '交换变量、函数返回多值都靠它',
    ],
    code: `// 数组按位置
const [first, second, ...rest] = [1, 2, 3, 4, 5];

// 对象按键名
const point = { x: 3, y: 7 };
const { x, y } = point;

// 重命名 + 默认值
const { x: px, z = 0 } = point;

// 循环里解构（BFS 遍历坐标的写法）
const cells = [[0, 0], [1, 2], [3, 4]];
const labels = [];
for (const [r, c] of cells) labels.push(\`(\${r},\${c})\`);

// 函数返回多值
function minMax(arr) {
  return [Math.min(...arr), Math.max(...arr)];
}
const [lo, hi] = minMax([5, 2, 9, 1]);

return { first, second, rest, x, y, px, z, labels, lo, hi };`,
  },

  {
    id: 'nested-loop',
    group: '数组',
    title: '嵌套循环与复杂度',
    summary: '两层循环通常是 O(n²) —— 冒泡、选择排序就是这种形状。',
    points: [
      '外层跑 n 次、内层也跑 n 次，总共约 n² 次操作',
      '内层从 i+1 开始（而不是 0）能省掉一半，但还是 O(n²)',
      '看到双层循环就要警觉：数据量一大就会明显变慢',
      '很多双层循环可以用「哈希表」优化成单层，这是常见套路',
    ],
    code: `// 数一数双层循环到底跑了多少次
function countPairs(n, optimized) {
  let count = 0;
  for (let i = 0; i < n; i++) {
    const start = optimized ? i + 1 : 0;
    for (let j = start; j < n; j++) count++;
  }
  return count;
}

const n = 8;
return {
  n,
  fullNested: countPairs(n, false),    // n² = 64
  halfNested: countPairs(n, true),     // n(n-1)/2 = 28
  note: '两者都是 O(n²)，但常数差一倍',
};`,
  },

  {
    id: 'array-map-filter',
    group: '数组',
    title: 'map / filter / reduce',
    summary: '函数式三件套，让数据处理不用写循环。',
    points: [
      'map：一对一转换，长度不变',
      'filter：筛选，长度可能变短',
      'reduce：把数组「折叠」成一个值（求和、求最值等）',
      '它们都返回新数组，不修改原数组',
    ],
    code: `const nums = [1, 2, 3, 4, 5, 6];

const doubled = nums.map((x) => x * 2);
const evens = nums.filter((x) => x % 2 === 0);
const sum = nums.reduce((acc, x) => acc + x, 0);
const max = nums.reduce((acc, x) => (x > acc ? x : acc), -Infinity);

// 可以串联
const sumOfDoubledEvens = nums
  .filter((x) => x % 2 === 0)
  .map((x) => x * 2)
  .reduce((a, b) => a + b, 0);

return { doubled, evens, sum, max, sumOfDoubledEvens };`,
  },

  {
    id: 'array-slice',
    group: '数组',
    title: 'slice / splice / 展开运算符',
    summary: 'slice 不改原数组，splice 会改。这是最常混淆的一对。',
    points: [
      'arr.slice(start, end) 返回新数组，end 不含 —— 不改原数组',
      'arr.splice(start, count) 会删除并返回被删元素 —— 修改原数组',
      '[...arr] 是最常用的浅拷贝写法',
      '拷贝后修改副本是不会影响原数组的',
    ],
    code: `const arr = [1, 2, 3, 4, 5];

const sliced = arr.slice(1, 3);      // [2, 3]，原数组不变
const arrAfterSlice = [...arr];

const spliced = [...arr];
const removed = spliced.splice(1, 2); // 从下标 1 删 2 个

// 展开运算符拷贝
const shallowCopy = [...arr];
shallowCopy[0] = 999;                 // 不影响 arr

return {
  sliced,
  arrAfterSlice,
  removed,
  afterSplice: spliced,
  originalFirst: arr[0],
  copyFirst: shallowCopy[0],
};`,
  },

  {
    id: 'array-index-math',
    group: '数组',
    title: '下标与索引运算',
    summary: '堆排序全靠 2i+1 / 2i+2 找子节点，这是下标运算的经典用例。',
    points: [
      '用数组表示完全二叉树：下标 i 的左孩子是 2i+1，右孩子是 2i+2',
      '父节点是 Math.floor((i-1)/2)',
      '下标运算一定要检查边界，否则会读到 undefined',
      '把下标关系写成函数，比到处散落算式更不容易错',
    ],
    code: `const heap = [50, 30, 40, 10, 20, 35];

const leftChild = (i) => 2 * i + 1;
const rightChild = (i) => 2 * i + 2;
const parent = (i) => Math.floor((i - 1) / 2);

const i = 1;   // 值为 30 的节点
return {
  heap,
  node: heap[i],
  leftChildIndex: leftChild(i),
  leftChildValue: heap[leftChild(i)],
  rightChildIndex: rightChild(i),
  rightChildValue: heap[rightChild(i)],
  parentValue: heap[parent(i)],
};`,
  },

  // ==================== 第四部分：函数 ====================
  {
    id: 'functions',
    group: '函数',
    title: '函数声明与默认参数',
    summary: 'function 声明会被提升，箭头函数不会。',
    points: [
      '函数声明可以写在调用之后（提升）',
      '默认参数只在传入 undefined 时生效，传 null 不会触发',
      '返回值不写就是 undefined',
      '函数内用 return 提前退出，比层层嵌套 if 清晰',
    ],
    code: `// 声明可以写在调用之后（提升）
const early = add(1, 2);

function add(a, b = 10) {
  return a + b;
}

const withDefault = add(5);        // 15
const withNull = add(5, null);     // 5 + null = 5（null 不是 undefined，不触发默认值）

// 提前 return，减少嵌套
function grade(score) {
  if (score < 0) return '非法';
  if (score < 60) return '不及格';
  if (score < 80) return '及格';
  return '优秀';
}

return { early, withDefault, withNull, grades: [grade(59), grade(75), grade(95)] };`,
  },

  {
    id: 'arrow-function',
    group: '函数',
    title: '箭头函数',
    summary: '更短的函数写法，且不绑定自己的 this。',
    points: [
      '单表达式可以省略 return 和花括号：(x) => x * 2',
      '返回对象字面量要加括号：(x) => ({ v: x })，否则 {} 被当成函数体',
      '只有一个参数时括号可以省略：x => x * 2',
      '箭头函数没有自己的 this / arguments，所以适合做回调',
    ],
    code: `const double = (x) => x * 2;
const square = (x) => x * x;
const noArgs = () => 'hi';

// 返回对象必须加括号，否则被解析成函数体
const makeObject = (x) => ({ value: x, doubled: x * 2 });

// 多行要显式 return
const describe = (x) => {
  const d = x * 2;
  return x + ' 的两倍是 ' + d;
};

return {
  double: double(5),
  square: square(5),
  noArgs: noArgs(),
  object: makeObject(7),
  describe: describe(3),
};`,
  },

  {
    id: 'closures',
    group: '函数',
    title: '闭包',
    summary: '函数记住了它定义时所在的环境。计数器、缓存都靠它。',
    points: [
      '内层函数可以访问外层函数的变量，即使外层已经执行完毕',
      '每次调用外层函数，都会产生一份独立的环境',
      '闭包常用来「保存状态」，比如计数器、记忆化缓存',
      '循环里用 var 创建的闭包会共享变量（经典陷阱），用 let 就没问题',
    ],
    code: `// 计数器：每次调用都记住上次的值
function makeCounter() {
  let count = 0;            // 被闭包「记住」了
  return () => ++count;
}

const counterA = makeCounter();
const counterB = makeCounter();   // 独立的一份状态
counterA(); counterA();

// 记忆化：缓存已经算过的结果
function makeMemo() {
  const cache = {};
  return (n) => {
    if (cache[n] !== undefined) return 'cached:' + cache[n];
    const value = n * n;
    cache[n] = value;
    return 'computed:' + value;
  };
}
const memo = makeMemo();

return {
  counterA: counterA(),        // 3
  counterB: counterB(),        // 1（独立）
  first: memo(4),              // computed
  second: memo(4),             // cached
};`,
  },

  {
    id: 'recursion',
    group: '函数',
    title: '递归',
    summary: '函数调用自己。关键是：必须有终止条件，且每次逼近它。',
    points: [
      '递归 = 基本情况（终止）+ 递归情况（缩小问题）',
      '忘记写终止条件会栈溢出（RangeError: Maximum call stack size exceeded）',
      'JS 没有尾调用优化，递归太深会真的爆栈',
      '归并排序、快速排序都用递归实现',
    ],
    code: `function factorial(n) {
  if (n <= 1) return 1;        // 基本情况：终止
  return n * factorial(n - 1); // 递归情况：缩小规模
}

// 斐波那契：对比朴素的递归写法
function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}

// 递归深度演示：n 太大会爆栈，所以这里用小值
function depth(n) {
  if (n === 0) return 0;
  return 1 + depth(n - 1);
}

return {
  factorial5: factorial(5),
  fib10: fib(10),
  depth100: depth(100),
  warning: '把 depth 的参数改成 100000 会抛 RangeError（栈溢出）',
};`,
  },

  {
    id: 'recursion-vs-stack',
    group: '函数',
    title: '递归改写成栈',
    summary: '任何递归都能用「显式栈 + 循环」重写，避免爆栈。',
    points: [
      '递归靠「调用栈」，爆栈是因为栈太深',
      '用数组自己模拟一个栈，就能把递归变成循环',
      '快速排序常用这种改写，避免大数组时爆栈',
      '改写后代码稍长，但内存可控、不会崩',
    ],
    code: `// 递归版：深度大了会爆栈
function sumRecursive(n) {
  if (n === 0) return 0;
  return n + sumRecursive(n - 1);
}

// 栈版：自己维护待处理的任务，不会爆栈
function sumWithStack(n) {
  const stack = [n];
  let total = 0;
  while (stack.length > 0) {
    const cur = stack.pop();
    if (cur === 0) continue;
    total += cur;
    stack.push(cur - 1);
  }
  return total;
}

return {
  recursive: sumRecursive(10),
  withStack: sumWithStack(10),
  sameResult: sumRecursive(10) === sumWithStack(10),
  note: '栈版可以把 n 调到几十万而不崩',
};`,
  },

  // ==================== 第五部分：对象与集合 ====================
  {
    id: 'object-literal',
    group: '对象与集合',
    title: '对象与解构',
    summary: '键值对存储，解构可以优雅地取出需要的字段。',
    points: [
      'obj.key 和 obj["key"] 等价，后者适合动态键名',
      '解构：const { a, b } = obj，可以用 : 重命名',
      '解构可以给默认值：const { x = 1 } = obj',
      '展开运算符 {...obj} 做浅拷贝，后面的字段会覆盖前面的',
    ],
    code: `const user = { name: 'Algo', age: 3, lang: 'JS' };

// 解构 + 重命名 + 默认值
const { name, age: years, missing = 'default' } = user;

// 展开做浅拷贝并覆盖
const updated = { ...user, age: 4, extra: true };

// 动态键名
const key = 'lang';
const dynamic = user[key];

return { name, years, missing, updated, dynamic };`,
  },

  {
    id: 'set-map',
    group: '对象与集合',
    title: 'Set 与 Map',
    summary: 'Set 去重 + O(1) 查找，Map 是键可以是任意类型的字典。',
    points: [
      'new Set(arr) 一步去重；set.has(x) 判断存在，比数组 includes 快',
      'set.add / delete / size，注意不是 push / length',
      'Map 的键可以是任意类型（对象、数组都行），普通对象的键只能是字符串',
      'BFS 用 Set 记录「已访问」、用 Map 记录「从哪来」，正是这两个结构',
    ],
    code: `// Set：去重与快速查找
const withDup = [1, 2, 2, 3, 3, 3];
const unique = [...new Set(withDup)];
const set = new Set(withDup);

// Map：记录「键 → 值」的映射
const cameFrom = new Map();
cameFrom.set('1,1', [0, 0]);
cameFrom.set('1,2', [1, 1]);

return {
  unique,
  setSize: set.size,
  hasTwo: set.has(2),
  hasNine: set.has(9),
  cameFromSize: cameFrom.size,
  cameFromGet: cameFrom.get('1,2'),
};`,
  },

  {
    id: 'for-of',
    group: '对象与集合',
    title: 'for...of 与可迭代对象',
    summary: '遍历数组、字符串、Set、Map 的统一写法。',
    points: [
      'for...of 遍历「值」，for...in 遍历「键」（数组用 for...of）',
      '数组解构可以在循环里用：for (const [r, c] of cells)',
      'Map 的 entries() 返回 [键, 值] 对，配合解构很方便',
      '想要中断循环就用 for...of + break，别用 forEach（它不能 break）',
    ],
    code: `const arr = ['a', 'b', 'c'];

// 遍历值
const values = [];
for (const v of arr) values.push(v);

// 循环里解构（BFS 遍历坐标就长这样）
const cells = [[0, 0], [0, 1], [1, 0]];
const coords = [];
for (const [r, c] of cells) coords.push(r + '-' + c);

// 遍历 Map
const map = new Map([['x', 1], ['y', 2]]);
const entries = [];
for (const [k, v] of map.entries()) entries.push(k + '=' + v);

// 可以 break
const untilB = [];
for (const v of arr) {
  if (v === 'b') break;
  untilB.push(v);
}

return { values, coords, entries, untilB };`,
  },

  // ==================== 第六部分：实用技巧 ====================
  {
    id: 'variable-swap',
    group: '实用技巧',
    title: '交换两个变量',
    summary: '传统写法需要临时变量，解构写法一行搞定。',
    points: [
      '交换必须借助临时变量，否则会互相覆盖',
      '解构写法 [a, b] = [b, a] 更简洁，且不需要临时变量',
      '排序算法里交换是最频繁的操作，写错就会丢数据',
      '注意：数组里交换用下标 [arr[i], arr[j]] = [arr[j], arr[i]]',
    ],
    code: `// 传统写法：需要临时变量
let a = 1, b = 2;
const temp = a;
a = b;
b = temp;

// 解构写法：一行完成
let x = 10, y = 20;
[x, y] = [y, x];

// 数组里交换两个位置（排序算法的核心操作）
const arr = [1, 2, 3];
let i = 0, j = 2;
[arr[i], arr[j]] = [arr[j], arr[i]];   // 交换首尾

return { traditional: [a, b], destructured: [x, y], arrayAfterSwap: arr };`,
  },

  {
    id: 'short-circuit',
    group: '实用技巧',
    title: '短路求值与空值合并',
    summary: '&& 和 || 会「短路」，?? 只处理 null/undefined。',
    points: [
      'a && b：a 为假就返回 a，否则返回 b —— 可用来做「有才执行」',
      'a || b：a 为真就返回 a，否则返回 b —— 会给 0 和 "" 兜底（陷阱）',
      'a ?? b：只当 a 是 null/undefined 才用 b —— 更精确',
      'arr[i] !== undefined && arr[i] > 5 这类写法可以避免越界报错',
    ],
    code: `const zero = 0;

const results = {
  // || 会把 0 当成空，可能不是你想要的
  orWithZero: zero || 'default',       // 'default'
  // ?? 只在 null/undefined 时兜底
  nullishWithZero: zero ?? 'default',  // 0

  // && 短路的实用场景：先判断存在再取属性
  safeAccess: null && null.value,      // null，不会报错

  // 边界检查的常见写法
  inRange: (arr, i) => i >= 0 && i < arr.length,
};

const arr = [1, 2, 3];
const idx = 10;
// 不对的写法：arr[10] 是 undefined，undefined > 5 是 false，侥幸不报错
// 但如果是 undefined.someProp 就会崩
const guarded = idx < arr.length && arr[idx] > 5;

return { ...results, guarded, note: '短路让代码更安全，但要小心 || 对 0 的处理' };`,
  },

  {
    id: 'boolean-flag',
    group: '实用技巧',
    title: '布尔标记',
    summary: '用一个开关变量记录「这一轮有没有发生变化」，用于提前结束。',
    points: [
      '初始化 flag = false，发生某事时置为 true',
      '循环结束后检查 flag，决定是否提前退出',
      '冒泡排序就靠它实现「一轮没交换说明已经有序」的优化',
      '命名要能读出含义：swapped 比 flag1 好得多',
    ],
    code: `// 冒泡排序的提前退出优化
function bubbleWithFlag(arr) {
  const a = [...arr];
  let rounds = 0;
  for (let end = a.length - 1; end > 0; end--) {
    let swapped = false;              // 每轮重置
    for (let i = 0; i < end; i++) {
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swapped = true;
      }
    }
    rounds++;
    if (!swapped) break;              // 没交换 → 已经有序，提前收工
  }
  return { sorted: a, rounds };
}

const nearlySorted = bubbleWithFlag([1, 2, 3, 5, 4]);

// 对比：完全随机的数据不会有提前退出
const randomish = bubbleWithFlag([5, 1, 4, 2, 3]);

return {
  nearlySorted,
  randomish,
  note: '接近有序时 rounds 明显更少',
};`,
  },

  {
    id: 'min-tracking',
    group: '实用技巧',
    title: '打擂台求最值',
    summary: '先拿第一个当擂主，后面谁更强就换谁。',
    points: [
      '初始值用第一个元素，而不是 Infinity 或 0 —— 更通用',
      '记录最小值时，如果还要知道位置，就同时记下标',
      '选择排序就是「打擂台找最小」的反复应用',
      '别写成 Math.min(...arr)，超长数组会爆栈（参数数量限制）',
    ],
    code: `const data = [7, 2, 9, 4, 1, 8];

// 同时记录最小值和它的下标
let minValue = data[0];
let minIndex = 0;
for (let i = 1; i < data.length; i++) {
  if (data[i] < minValue) {     // 打擂台
    minValue = data[i];
    minIndex = i;
  }
}

// 对比：展开运算符在超长数组上会崩
const safeWay = data.reduce((acc, x) => (x < acc ? x : acc), data[0]);

return { minValue, minIndex, safeWay, maxValue: Math.max(...data) };`,
  },

  {
    id: 'array-init',
    group: '实用技巧',
    title: '初始化计数数组',
    summary: '计数排序需要「值 → 出现次数」的表格，初始化方式要选对。',
    points: [
      'new Array(n).fill(0) 一步得到全 0 数组',
      'new Array(n) 里全是空位，直接 map 会跳过，要用 Array.from',
      '下标做映射时要处理偏移：value - min 才能映射到 0 开始的下标',
      '值域太大时不适合计数排序，空间会爆炸',
    ],
    code: `const data = [3, 1, 3, 2, 1, 3];

// 计数排序的核心：统计每个值出现几次
const min = Math.min(...data);
const max = Math.max(...data);
const range = max - min + 1;

const counts = new Array(range).fill(0);
for (const v of data) {
  counts[v - min]++;      // 偏移，让下标从 0 开始
}

// 再按顺序读回来就是有序的
const rebuilt = [];
for (let i = 0; i < range; i++) {
  for (let k = 0; k < counts[i]; k++) rebuilt.push(i + min);
}

return { data, min, max, range, counts, rebuilt, isSorted: JSON.stringify(rebuilt) === JSON.stringify([...data].sort((a, b) => a - b)) };`,
  },

  {
    id: 'array-as-queue',
    group: '实用技巧',
    title: '用数组实现队列与栈',
    summary: 'BFS 用队列、DFS 用栈，都只是数组的不同用法。',
    points: [
      '队列：push 进、shift 出 → 先进先出（BFS 用）',
      '栈：push 进、pop 出 → 后进先出（DFS 用）',
      'shift() 是 O(n)，数据量大时可以用「头指针」优化',
      '同一个数组，换一个取出方式，搜索顺序就完全不同',
    ],
    code: `// 队列（BFS 的形状）：先进先出
const queue = [1, 2, 3];
const queueOut = [];
while (queue.length > 0) queueOut.push(queue.shift());

// 栈（DFS 的形状）：后进先出
const stack = [1, 2, 3];
const stackOut = [];
while (stack.length > 0) stackOut.push(stack.pop());

// 优化：用头指针代替 shift
const arr = [1, 2, 3];
let head = 0;
const optimized = [];
while (head < arr.length) optimized.push(arr[head++]);

return {
  queueOut,    // [1, 2, 3] 先进先出
  stackOut,    // [3, 2, 1] 后进先出
  optimized,
  note: '这就是 BFS 与 DFS 唯一的差别',
};`,
  },

  {
    id: 'array-shift',
    group: '实用技巧',
    title: 'shift 的代价与头指针优化',
    summary: 'shift 每次都要移动整个数组，是 O(n)。',
    points: [
      'push/pop 操作末尾，O(1)；shift/unshift 操作开头，O(n)',
      '循环里反复 shift，整体会退化成 O(n²)',
      '用「头指针 head」代替 shift：head++ 是 O(1)',
      'BFS 在大网格上必须用头指针，否则会明显变慢',
    ],
    code: `const n = 2000;

// 方式一：反复 shift（每次都搬移数组）
function withShift(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  const out = [];
  while (arr.length > 0) out.push(arr.shift());
  return out.length;
}

// 方式二：头指针（只移动一个整数）
function withHead(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  let head = 0;
  const out = [];
  while (head < arr.length) out.push(arr[head++]);
  return out.length;
}

const t1 = Date.now();
withShift(n);
const shiftMs = Date.now() - t1;

const t2 = Date.now();
withHead(n);
const headMs = Date.now() - t2;

return { n, shiftMs, headMs, note: '两者结果相同，但耗时差距随 n 增大而放大' };`,
  },

  {
    id: 'mid-overflow',
    group: '实用技巧',
    title: '二分中点怎么写',
    summary: 'lo + (hi-lo)/2 比 (lo+hi)/2 更安全，也更值得养成习惯。',
    points: [
      'Math.floor((lo + hi) / 2) 是最直观的写法',
      'lo + Math.floor((hi - lo) / 2) 在做减法，不会整数溢出',
      'JS 的 Number 是浮点，实际上不会溢出，但这个习惯在别的语言里是必需的',
      '区间用「闭区间」还是「左闭右开」必须全程一致，混用是二分最常见的 bug',
    ],
    code: `const arr = [1, 3, 5, 7, 9, 11, 13, 15, 17];
const target = 13;

// 闭区间写法：[lo, hi]
function binarySearch(a, target) {
  let lo = 0, hi = a.length - 1, steps = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    steps++;
    if (a[mid] === target) return { index: mid, steps };
    if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { index: -1, steps };
}

const result = binarySearch(arr, target);
// 9 个元素，最多 4 次就能确定
const worstCase = Math.ceil(Math.log2(arr.length + 1));

return { ...result, worstCase, note: '这就是 O(log n)：数据翻倍，步数只加 1' };`,
  },
];

/** 按 id 快速取知识点。 */
export const SYNTAX_BY_ID = Object.fromEntries(SYNTAX_TOPICS.map((t) => [t.id, t]));

/** 按分组归类，界面左侧列表用。 */
export const SYNTAX_GROUPS = (() => {
  const groups = [];
  for (const topic of SYNTAX_TOPICS) {
    let g = groups.find((x) => x.name === topic.group);
    if (!g) {
      g = { name: topic.group, topics: [] };
      groups.push(g);
    }
    g.topics.push(topic);
  }
  return groups;
})();
