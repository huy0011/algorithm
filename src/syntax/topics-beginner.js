/**
 * 入门层语法知识点：从「什么是程序」开始。
 *
 * 这一层的定位和 topics.js 里的内容不同：
 *   topics.js     —— 会写一点代码之后，为「看懂算法」补的语言细节
 *   本文件         —— 完全零基础，从第一行代码开始
 *
 * 每个知识点的示例都遵守同样的约定：
 *   - 用 return 交出结果（页面会打印出来）
 *   - 也可以用 console.log
 *   - 沙箱里没有 DOM / 网络
 */

export const BEGINNER_TOPICS = [
  {
    id: 'what-is-program',
    group: '零基础入门',
    title: '程序是什么',
    summary: '程序就是一串「按顺序执行的指令」。计算机只会老老实实一条条做，不会猜你的意思。',
    points: [
      '程序 = 数据 + 指令。数据是要处理的东西，指令是怎么处理',
      '代码从上往下、一行一行执行（有分支和循环时才会跳）',
      '计算机很快但很笨：你少写一个步骤，它就真的不做',
      '写程序的核心工作是「把人的想法拆成一条条计算机能执行的步骤」',
    ],
    code: `// 最简单的程序：三条指令，按顺序执行
const 第一步 = '把水烧开';
const 第二步 = '放入茶叶';
const 第三步 = '倒进杯子';

// 用一个数组把指令串起来，就能看到「顺序」这件事
const 泡茶步骤 = [第一步, 第二步, 第三步];

// 程序执行的顺序就是从第一个到最后一个
const 执行记录 = [];
for (const 步骤 of 泡茶步骤) {
  执行记录.push('执行：' + 步骤);
}

return {
  程序做了什么: 执行记录,
  说明: '程序就是把事情拆成一步一步，再让计算机照做',
};`,
  },

  {
    id: 'hello-world',
    group: '零基础入门',
    title: 'Hello World',
    summary: '每个程序员的第一行代码：让电脑说一句话。「能让它输出」是验证环境正常的最快方式。',
    points: [
      'console.log(...) 是 JavaScript 里最基础的「输出」方式',
      '字符串要用引号包起来：单引号、双引号、反引号都行',
      '分号表示一句结束，JS 里可以省略，但建议写上更清楚',
      '「能在屏幕上看到结果」是编程最有价值的第一步反馈',
    ],
    code: `// 最基本的输出
console.log('Hello World');

// 三种引号写法都合法
console.log("双引号也可以");
console.log(\`反引号也叫模板字符串\`);

// 可以一次输出多个值，用逗号隔开
console.log('结果是', 1 + 1);

// 反引号里可以嵌入变量（最常用）
const 名字 = 'AlgoViz';
console.log(\`你好，\${名字}！\`);

// return 是把结果交给页面显示（这才是这个教程里最常用的方式）
return {
  第一句话: 'Hello World',
  问候: \`你好，\${名字}！\`,
  说明: 'console.log 是打印到控制台，return 是把值交出去',
};`,
  },

  {
    id: 'comments',
    group: '零基础入门',
    title: '注释：写给人看的说明',
    summary: '注释不会被执行。它的作用是解释「为什么这么写」，而不是「这行在做什么」。',
    points: [
      '// 单行注释，/* ... */ 多行注释',
      '好的注释解释「为什么」，坏的注释重复「是什么」',
      '调试时可以用注释临时屏蔽一行代码',
      '过期的注释比没有注释更危险，改代码时要一起改',
    ],
    code: `// 这是单行注释：解释下面这行在做什么

/**
 * 这是多行注释（JSDoc 风格）
 * 常用于给函数写说明：参数是什么、返回什么
 */
function 计算平均分(总分, 人数) {
  // 防止除以 0 导致 Infinity（这是一个「为什么」型注释）
  if (人数 === 0) return 0;
  return 总分 / 人数;
}

/* 也可以用注释临时屏蔽代码来调试
console.log('这行不会执行');
*/

const 结果 = 计算平均分(270, 3);

return {
  平均分: 结果,
  说明: '注释是给人看的，计算机会完全忽略它们',
  // 下面这行虽然写着 999，但它只是字符串里的内容，不影响计算
  提醒: '别把重要的逻辑写在注释里',
};`,
  },

  {
    id: 'input-output',
    group: '零基础入门',
    title: '输入与输出',
    summary: '程序 = 输入 → 处理 → 输出。没有输入的程序每次跑结果都一样。',
    points: [
      '输出用 console.log 或 return（本教程用 return 显示结果）',
      '输入在这个沙箱里用「函数参数」模拟：外部把数据传进来',
      '真实的程序输入来自键盘、文件、网络请求',
      '先想清楚「输入是什么、输出要什么」，再动手写，能省很多返工',
    ],
    code: `// 输入 → 处理 → 输出 的最小例子
// 这里的 input 就是「输入」（真实场景可能来自键盘或文件）
function 求最大值(input) {
  if (input.length === 0) return null;   // 处理边界情况

  let 最大 = input[0];                    // 处理：打擂台找最大
  for (let i = 1; i < input.length; i++) {
    if (input[i] > 最大) 最大 = input[i];
  }
  return 最大;                            // 输出
}

// 模拟三次不同的输入，得到三个不同的输出
const 测试数据 = [[3, 1, 4, 1, 5], [9, 2, 6], [-5, -1, -9]];

return {
  输出: 测试数据.map((数据) => ({
    输入: 数据,
    输出: 求最大值(数据),
  })),
  要点: '同一段处理逻辑，输入不同，输出就不同',
};`,
  },

  {
    id: 'data-types',
    group: '零基础入门',
    title: '数据类型',
    summary: 'JS 有 7 种基本类型，入门阶段先掌握 5 种：数字、字符串、布尔、null、undefined。',
    points: [
      'typeof 可以查看一个值的类型',
      '数字和字符串是两回事：1 和 "1" 不同，1 + 1 = 2 但 "1" + 1 = "11"',
      '布尔只有 true / false，用来做判断',
      'null 表示「故意留空」，undefined 表示「压根没赋值」',
      'typeof null 返回 "object" 是 JS 的历史遗留 bug，记住就好',
    ],
    code: `const 各种值 = {
  数字: 42,
  小数: 3.14,
  字符串: '你好',
  布尔真: true,
  布尔假: false,
  空值: null,
  未定义: undefined,
};

// 查看每个值的类型
const 类型表 = {};
for (const [键, 值] of Object.entries(各种值)) {
  类型表[键] = typeof 值;
}

// 最容易踩的坑：数字 + 字符串
const 陷阱 = {
  '1 + 1': 1 + 1,           // 2 —— 都是数字，做加法
  '"1" + 1': '1' + 1,       // "11" —— 有一边是字符串，做拼接
  '"2" * "3"': '2' * '3',   // 6 —— 乘法没法拼接，就把字符串转成数字
  'typeof null': typeof null, // "object" —— 历史遗留问题
};

return { 类型表, 陷阱 };`,
  },

  {
    id: 'type-conversion',
    group: '零基础入门',
    title: '类型转换',
    summary: '不同类型之间要转换才能正确运算。显式转换比依赖自动转换安全得多。',
    points: [
      'Number("123") 把字符串转成数字；遇到不能转的会得到 NaN',
      'String(123) 把数字转成字符串',
      'Boolean(x) 转成真假值：0、""、null、undefined、NaN 会变成 false',
      'parseInt / parseFloat 能「从字符串开头解析出数字」，允许后面有杂字符',
      'NaN 表示「不是一个数字」，它和任何值都不相等，包括自己',
    ],
    code: `// 显式转换（推荐）
const 转数字 = Number('123');        // 123
const 转字符串 = String(456);        // "456"
const 转布尔 = Boolean(0);           // false

// 转换失败会得到 NaN
const 失败 = Number('abc');          // NaN

// parseInt 会「尽量解析」开头能认的部分
const 解析1 = parseInt('123abc');    // 123
const 解析2 = parseInt('abc123');    // NaN（开头就不认识）

// 小数
const 解析3 = parseFloat('3.14xyz'); // 3.14

// NaN 的特性：它不等于自己
const 判断NaN = Number.isNaN(失败);  // true —— 用这个方法判断才对
const 错误写法 = 失败 === NaN;       // false —— 永远不相等！

return {
  转数字, 转字符串, 转布尔,
  失败: String(失败),
  parseInt解析: [解析1, 解析2],
  parseFloat解析: 解析3,
  正确判断NaN: 判断NaN,
  错误判断NaN: 错误写法,
};`,
  },

  {
    id: 'arithmetic-ops',
    group: '零基础入门',
    title: '算术运算符',
    summary: '加减乘除取余，以及自增自减的简写。',
    points: [
      '+ - * / 是四则运算，% 是取余数',
      '除法永远得到小数：7 / 2 = 3.5，要整数得用 Math.floor',
      '% 取余常用来判断整除、奇偶、循环取模',
      '+= -= *= /= 是复合赋值简写：x += 1 等价于 x = x + 1',
      '++ 和 -- 是加一减一的简写',
    ],
    code: `const a = 7;
const b = 2;

const 四则 = {
  加: a + b,
  减: a - b,
  乘: a * b,
  除: a / b,          // 3.5 —— JS 的除法会得到小数
  取余: a % b,        // 1
  取整除法: Math.floor(a / b),  // 3
};

// 取余的常见用途
const 用途 = {
  判断偶数: 8 % 2 === 0,
  判断奇数: 7 % 2 === 1,
  循环取模: [0, 1, 2, 3, 4, 5].map((i) => i % 3),  // 0,1,2,0,1,2
  取末位数字: 1234 % 10,                            // 4
};

// 复合赋值
let x = 10;
x += 5;    // 15
x -= 3;    // 12
x *= 2;    // 24
x /= 4;    // 6
x++;       // 7
x--;       // 6

return {
  四则,
  用途,
  复合赋值演示: { 最终x: x, 说明: 'x += 5 就是 x = x + 5 的简写' },
};`,
  },

  {
    id: 'operator-precedence',
    group: '零基础入门',
    title: '运算符优先级',
    summary: '先乘除后加减，有括号先算括号。搞不清就加括号 —— 括号不要钱。',
    points: [
      '优先级：括号 > 一元(! ++ --) > 乘除取余 > 加减 > 比较 > 相等 > 逻辑与 > 逻辑或',
      '赋值 = 的优先级最低，所以最后才发生',
      '拿不准就加括号，可读性远比「省两个字符」重要',
      '短路求值让 && 和 || 的行为有微妙差别，配合括号更清晰',
    ],
    code: `// 先乘除后加减
const 例1 = 2 + 3 * 4;        // 14，不是 20
const 例2 = (2 + 3) * 4;      // 20

// 比较运算在逻辑运算之前
const 例3 = 1 + 1 === 2;      // true：先算 1+1，再比较
const 例4 = 1 + (1 === 2);    // 1：先比较得 false，1 + false = 1

// 逻辑运算符优先级低于比较
const 例5 = 1 < 2 && 3 < 4;   // true：两边都是 true

// && 比 || 优先级高
const 例6 = true || false && false;   // true（先算 &&）
const 例7 = (true || false) && false; // false

// 赋值优先级最低
let x = 1;
const 例8 = x = 5;            // 先算 x = 5，再把结果给 例8

return {
  '2 + 3 * 4': 例1,
  '(2 + 3) * 4': 例2,
  '1 + 1 === 2': 例3,
  '1 + (1 === 2)': 例4,
  '1 < 2 && 3 < 4': 例5,
  'true || false && false': 例6,
  '(true || false) && false': 例7,
  '赋值表达式返回赋的值': 例8,
  建议: '拿不准就加括号，别赌自己的记忆',
};`,
  },

  {
    id: 'switch-case',
    group: '零基础入门',
    title: 'switch 多分支',
    summary: '同一个值要跟多种情况比较时，switch 比一长串 if-else 更整齐。',
    points: [
      'switch 用 === 比较（严格相等），所以类型必须一致',
      '每个 case 后面记得写 break，否则会「穿透」到下一个 case',
      '有时故意不写 break 来实现「多个值走同一段逻辑」',
      'default 是可选的，相当于最后的 else',
    ],
    code: `function 判断等级(分数) {
  const 档位 = Math.floor(分数 / 10);
  let 结果;
  switch (档位) {
    case 10:
    case 9:            // 故意不写 break：10 和 9 走同一段逻辑
      结果 = '优秀';
      break;
    case 8:
      结果 = '良好';
      break;
    case 7:
      结果 = '中等';
      break;
    case 6:
      结果 = '及格';
      break;
    default:
      结果 = '不及格';
  }
  return 结果;
}

// 演示「忘记 break」的后果（穿透）
function 忘记break(值) {
  const 记录 = [];
  switch (值) {
    case 1: 记录.push('走了 case 1');
    case 2: 记录.push('走了 case 2');
    case 3: 记录.push('走了 case 3'); break;
    default: 记录.push('走了 default');
  }
  return 记录;
}

return {
  等级: [95, 85, 75, 65, 55].map((s) => s + '分 → ' + 判断等级(s)),
  穿透演示: {
    值为1: 忘记break(1),   // 会连续走 1、2、3
    值为2: 忘记break(2),   // 会走 2、3
    说明: '忘了 break 就会继续往下执行，这叫「穿透」',
  },
};`,
  },

  {
    id: 'do-while',
    group: '零基础入门',
    title: 'do...while 循环',
    summary: '先执行一次，再判断条件 —— 保证循环体至少跑一遍。',
    points: [
      'while 先判断再执行，可能一次都不跑',
      'do...while 先执行再判断，至少跑一次',
      '适合「必须先做一次才知道要不要继续」的场景',
      '别忘了改变条件变量，否则会死循环',
    ],
    code: `// while：条件一开始就是假，一次都不执行
let i = 10;
let while次数 = 0;
while (i < 5) {
  while次数++;
  i++;
}

// do...while：即使条件一开始是假，也至少执行一次
let j = 10;
let doWhile次数 = 0;
do {
  doWhile次数++;
  j++;
} while (j < 5);

// 适用场景：至少要做一次的操作（比如先读一次数据再看要不要继续读）
function 模拟读数(数据) {
  const 读到 = [];
  let 下标 = 0;
  do {
    读到.push(数据[下标]);
    下标++;
  } while (下标 < 数据.length && 读到.length < 3);
  return 读到;
}

return {
  while执行次数: while次数,        // 0
  doWhile执行次数: doWhile次数,    // 1
  说明: '这就是两者的唯一区别：do...while 保证至少跑一次',
  模拟读数: 模拟读数([5, 6, 7, 8, 9]),
};`,
  },

  {
    id: 'break-continue',
    group: '零基础入门',
    title: 'break 与 continue',
    summary: 'break 是整个循环不干了，continue 是这一次跳过、下一次继续。',
    points: [
      'break：立刻跳出整个循环，后面的元素不再看',
      'continue：跳过本次剩下的语句，直接进入下一次',
      '在循环里找到答案后用 break，能省掉大量无意义的计算',
      '嵌套循环里 break 只跳出最内层，要跳出多层得用标记或函数返回',
    ],
    code: `const 数据 = [3, 8, 12, 5, 20, 7, 15];

// break：找到第一个大于 10 的就停下
const 找到就停 = [];
for (const n of 数据) {
  if (n > 10) {
    找到就停.push('找到 ' + n + '，停止');
    break;
  }
  找到就停.push('看 ' + n + '，不够大');
}

// continue：只处理偶数
const 只看偶数 = [];
for (const n of 数据) {
  if (n % 2 !== 0) continue;   // 奇数跳过
  只看偶数.push(n);
}

// 对比：不用 break 会白白扫完整个数组
let 全部扫描次数 = 0;
for (const n of 数据) { 全部扫描次数++; void n; }

let 提前退出扫描次数 = 0;
for (const n of 数据) {
  提前退出扫描次数++;
  if (n > 10) break;
}

// 嵌套循环里 break 只跳出最内层
const 嵌套结果 = [];
for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (j === 1) break;          // 只跳出内层
    嵌套结果.push(i + '-' + j);
  }
}

return {
  找到就停,
  只看偶数,
  扫描次数对比: { 不提前退出: 全部扫描次数, 提前退出: 提前退出扫描次数 },
  嵌套break结果: 嵌套结果,
};`,
  },

  {
    id: 'basic-debugging',
    group: '零基础入门',
    title: '最简单的调试方法',
    summary: '程序不对时，把中间值打出来看 —— 这比盯着代码猜有效得多。',
    points: [
      '在怀疑的地方 console.log 出中间变量的值',
      '二分法定位：先确认前半段对不对，再缩小到出错的那一步',
      '常见错误：下标越界（undefined）、类型不对（字符串当数字用）、条件写反',
      '写完先拿「最小、最特殊」的输入试一遍（空数组、1 个元素、全是重复值）',
    ],
    code: `// 一个有 bug 的函数：想求数组里所有偶数的和
function 求偶数和_有bug(数据) {
  let 和 = 0;
  for (let i = 0; i <= 数据.length; i++) {   // bug：应该是 i < length
    if (数据[i] % 2 === 0) 和 += 数据[i];
  }
  return 和;
}

// 修复版
function 求偶数和_正确(数据) {
  let 和 = 0;
  for (let i = 0; i < 数据.length; i++) {
    if (数据[i] % 2 === 0) 和 += 数据[i];
  }
  return 和;
}

// 用「打印中间值」的方式找问题
const 数据 = [2, 4, 5, 6];
const 调试记录 = [];
for (let i = 0; i <= 数据.length; i++) {
  调试记录.push(\`i=\${i}, 数据[i]=\${数据[i]}, 类型=\${typeof 数据[i]}\`);
}

// 为什么 [2,4,5,6] 看不出问题？因为最后一项 6 是偶数，
// undefined % 2 得到 NaN，NaN 加到和上会污染结果 —— 但当最后一项是偶数时…
// 不对，NaN 一旦加入，和会永久变成 NaN。这里实际发生的是：
// 越界读到 undefined，undefined % 2 === 0 是 false（NaN !== 0），所以没加进去，
// 结果「碰巧」是对的 —— 这正是最危险的 bug：它在某些输入下不报错。
//
// 换一组「最后一个元素是奇数」的数据，让 NaN 真正参与运算？也不会。
// 真正会暴露问题的是「依赖数组长度的判断」，所以这里用一个必然暴露的版本：
function 求偶数和_真会错(数据) {
  let 计数 = 0;
  for (let i = 0; i <= 数据.length; i++) {
    // 这里统计「访问了几次」，越界那次也会被算进去
    计数++;
  }
  return 计数;
}

const 数据长度 = 4;

// 用边界数据测试
const 边界测试 = {
  空数组: 求偶数和_正确([]),
  单元素: 求偶数和_正确([4]),
  全奇数: 求偶数和_正确([1, 3, 5]),
  含undefined: String(求偶数和_正确([2, undefined, 4])),
};

return {
  正常数据: {
    有bug版: 求偶数和_有bug(数据),
    修复版: 求偶数和_正确(数据),
    结论: '这组数据下两者结果相同！因为越界读到 undefined，undefined % 2 是 NaN，NaN === 0 为 false 所以没加进去 —— 这是个「碰巧没出错」的 bug，最危险',
  },
  循环次数对比: {
    正确写法_i小于length: 数据长度,
    错误写法_i小于等于length: 求偶数和_真会错(数据),
    说明: '多跑的那一次就是在访问越界位置',
  },
  调试记录: 调试记录.slice(-2),
  边界测试,
  要点: '越界不一定马上报错，可能只是悄悄读到 undefined —— 所以要用边界数据测',
};`,
  },
];

/** 这些知识点在界面上的分组名。 */
export const BEGINNER_GROUP_NAME = '零基础入门';
