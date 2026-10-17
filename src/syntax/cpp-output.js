/**
 * 本文件由 tests/build-cpp.js 自动生成，请勿手改。
 *
 * 内容：每个 C++ 示例经 g++ 真实编译运行后的 stdout。
 * 生成方式：node tests/build-cpp.js → 编译 → node tests/build-cpp.js --collect
 * 编译器：g++ -std=c++17 -O2
 * 生成时间：2026-10-17T03:45:32.568Z
 *
 * 为什么页面不直接编译 C++：浏览器没有 C++ 编译器，
 * 且本项目部署在 GitHub Pages（纯静态、无后端），所以只能预先录制输出。
 */

export const CPP_OUTPUT = {
  "meta": {
    "generatedAt": "2026-10-17T03:45:32.568Z",
    "compiler": "g++ -std=c++17 -O2",
    "compilerVersion": "g++.exe (x86_64-posix-seh-rev1, Built by MinGW-Builds project) 16.2.0",
    "note": "本文件由构建脚本生成：每个 C++ 示例都经真实编译运行，stdout 为程序真实输出。浏览器无法编译 C++，所以页面上展示的是这份预先录制的输出，不能重新运行。",
    "total": 66,
    "passed": 66,
    "failed": 0
  },
  "results": {
    "cpp-hello": {
      "kind": "topic",
      "title": "Hello World",
      "verified": true,
      "stdout": "Hello World\n结果是 2\n第一行\n第二行"
    },
    "cpp-comments": {
      "kind": "topic",
      "title": "注释：写给人看的说明",
      "verified": true,
      "stdout": "平均分 = 90\n注释是给人看的，编译器完全忽略它们"
    },
    "cpp-variables": {
      "kind": "topic",
      "title": "变量：声明、初始化与作用域",
      "verified": true,
      "stdout": "未初始化的 garbage（垃圾值）: 0\nMAX = 100\n内层 inner = 5\n内层 value = 2（遮蔽了外层的 1）\n外层 value = 1\nglobalCount = 1"
    },
    "cpp-io": {
      "kind": "topic",
      "title": "输入与输出",
      "verified": true,
      "stdout": "3 + 7 = 10\n三个数的和: 60\n默认输出: 3.33333"
    },
    "cpp-operators": {
      "kind": "topic",
      "title": "运算符",
      "verified": true,
      "stdout": "a + b = 9\na - b = 5\na * b = 14\na / b = 3  <- 整数除法，丢掉了小数\na % b = 1  <- 取余\n7.0 / 2 = 3.5\na / (double)b = 3.5\n2e9 + 2e9 (int)      = -294967296  <- 溢出了！\n2e9 + 2e9 (long long)= 4000000000"
    },
    "cpp-branch": {
      "kind": "topic",
      "title": "条件分支",
      "verified": true,
      "stdout": "良好\nmax(3, 7) = 7\n加法"
    },
    "cpp-loops": {
      "kind": "topic",
      "title": "循环",
      "verified": true,
      "stdout": "1+2+...+10 = 55\n第一个 >100 的 2 的幂是 2^7 = 128\n1..10 中奇数和 = 25\n1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9"
    },
    "cpp-array": {
      "kind": "topic",
      "title": "数组",
      "verified": true,
      "stdout": "元素: 1 2 3 4 5 \n首个元素 a[0] = 1\n末个元素 a[4] = 5\n长度 = 5\n和 = 15, 最大 = 5\n全局数组前 3 个: 0 0 0"
    },
    "cpp-functions": {
      "kind": "topic",
      "title": "函数",
      "verified": true,
      "stdout": "add(3, 4) = 7\n引用交换后: a=2, b=1\n值传递后 x 仍是 5（没被改到）\n5! = 120"
    },
    "cpp-recursion": {
      "kind": "topic",
      "title": "递归",
      "verified": true,
      "stdout": "fib(20) 递归 = 6765\nfib(20) 递推 = 6765\nfib(50) 递推 = 12586269025（递归算这个要好几分钟）\ngcd(48, 18) = 6"
    },
    "cpp-pointer": {
      "kind": "topic",
      "title": "指针与引用",
      "verified": true,
      "stdout": "x 的值   = 42\n*p 解引用 = 42\n通过指针改成 100 后，x = 100\n通过引用改成 7 后，x = 7\nconst 引用读到 7\n空指针是否为 null: 是"
    },
    "cpp-complexity": {
      "kind": "topic",
      "title": "复杂度入门",
      "verified": true,
      "stdout": "n = 100000\nO(n)      约 100000 次\nO(n log n) 约 1700000 次\nO(n^2)    约 10000000000 次  <- 10^10，超时无疑\n\n估算参考（1 秒约 10^8 次简单运算）：\n  n=20    -> 2^n 爆搜可行\n  n=5000  -> O(n^2) 可行\n  n=1e5   -> 需要 O(n log n)"
    },
    "cpp-vector": {
      "kind": "topic",
      "title": "vector —— 动态数组",
      "verified": true,
      "stdout": "插入后: 5 4 3 2 1 \nsize = 5, empty = false\n升序后: 1 2 3 4 5 \n降序后: 5 4 3 2 1 \nv[0] = 5, v.back() = 1\npop_back 后 size = 4\n另一个 vector: 10 20 30"
    },
    "cpp-string": {
      "kind": "topic",
      "title": "string —— 字符串",
      "verified": true,
      "stdout": "拼接: Hello World\n长度: 11\n比较 a==b: false\n字典序 a<b: true\n首字符: H, 末字符: d\nsubstr(0,5): Hello\n找 World 的位置: 6\n找 XYZ: 未找到\n反转 Hello: olleH\n大写字母个数: 2"
    },
    "cpp-sort": {
      "kind": "topic",
      "title": "sort / reverse / unique",
      "verified": true,
      "stdout": "升序: 1 2 2 5 8 9 \n去重后: 1 2 5 8 9 \n按绝对值排: 1 2 -3 -7 \n反转后: -7 -3 2 1 \nlower_bound(2) 的下标: 3"
    },
    "cpp-set": {
      "kind": "topic",
      "title": "set / multiset —— 有序集合",
      "verified": true,
      "stdout": "set 大小: 4（重复的 2 和 5 被去掉了）\n遍历（自动有序）: 1 2 5 8 \n存在 8 吗: 是\n存在 9 吗: 否\n删掉 2 后: 1 5 8 \nmultiset 大小: 5, 3 出现了 3 次"
    },
    "cpp-map": {
      "kind": "topic",
      "title": "map —— 键值对",
      "verified": true,
      "stdout": "词频统计（按键自动排序）:\n  apple: 3\n  banana: 2\n  cherry: 1\n有 apple 吗: 有\n有 grape 吗: 没有\n按 id 排序输出:\n  101 -> Alice\n  102 -> Carol\n  103 -> Bob"
    },
    "cpp-stack-queue": {
      "kind": "topic",
      "title": "stack / queue —— 栈与队列",
      "verified": true,
      "stdout": "栈大小 3, 栈顶 3\n逐个弹出: 3 2 1 \n队头 1, 队尾 3\n逐个出队: 1 2 3"
    },
    "cpp-priority-queue": {
      "kind": "topic",
      "title": "priority_queue —— 优先队列（堆）",
      "verified": true,
      "stdout": "大顶堆逐个弹出（从大到小）: 9 6 5 4 3 2 1 1 \n小顶堆逐个弹出（从小到大）: 1 1 2 3 4 5 6 9 \n第 3 大的数是 10"
    },
    "cpp-pair-iterator": {
      "kind": "topic",
      "title": "pair 与迭代器",
      "verified": true,
      "stdout": "pair: 1 -> one\na(1,5) vs b(1,3): a 大\nc(2,0) vs a(1,5): c 大\npair 排序后: (1,5) (2,7) (3,2) (3,9) \nbegin 指向: 10\nit+2 指向: 30\nend - begin = 4（元素个数）\n最大值 40 在下标 3"
    },
    "cpp-binary-search": {
      "kind": "topic",
      "title": "lower_bound / upper_bound —— 二分查找",
      "verified": true,
      "stdout": "数组: 1 3 3 3 5 7 9 \nlower_bound(3) 下标 = 1\nupper_bound(3) 下标 = 4\n3 出现了 3 次\nlower_bound(4) 下标 = 4（指向第一个 >= 4 的元素，即 5）\n找 100: 没找到（返回 end）\nbinary_search(5) = 存在"
    },
    "cpp-bitset": {
      "kind": "topic",
      "title": "位运算",
      "verified": true,
      "stdout": "a = 12 = 00001100\nb = 10 = 00001010\n\na & b  = 8 = 00001000  (与)\na | b  = 14 = 00001110  (或)\na ^ b  = 6 = 00000110  (异或)\na << 1 = 24 = 00011000  (左移=乘2)\na >> 1 = 6 = 00000110  (右移=除2)\n\n判断奇偶 a&1  = 0（0 表示偶数）\n消掉最低位的1 a&(a-1) = 8 = 00001000\n取第 2 位 (a>>2)&1 = 1\n1<<3 = 8（表示第 3 位为 1）\na ^ a = 0（自己异或自己得 0）"
    },
    "cpp-struct": {
      "kind": "topic",
      "title": "struct —— 自定义类型",
      "verified": true,
      "stdout": "按分数降序（同分按名字升序）:\n  Alice : 90\n  Carol : 90\n  Bob : 85\n  Dave : 78\n改按名字升序:\n  Alice : 90\n  Bob : 85\n  Carol : 90\n  Dave : 78"
    },
    "cpp-int": {
      "kind": "topic",
      "title": "int —— 最常用的整数",
      "verified": true,
      "stdout": "int 值: 42\nint 最大值: 2147483647\nint 最小值: -2147483648\nint 占 4 字节\n\n20 亿 + 20 亿 = -294967296  <- 溢出了，变成负数\n100000 * 100000 (int) = 1410065408\n用 long long 算: 10000000000  <- 正确"
    },
    "cpp-longlong": {
      "kind": "topic",
      "title": "long long —— 竞赛必备的大整数",
      "verified": true,
      "stdout": "long long 值: 123456789012345\nlong long 最大值: 9223372036854775807\n占 8 字节\n\na * b 直接赋给 long long: 1410065408  <- 错的！\n(long long)a * b:          10000000000  <- 对的\n\n1000000 的平方: 1000000000000\n1 到 1000000 的和: 500000500000"
    },
    "cpp-float": {
      "kind": "topic",
      "title": "float —— 单精度小数",
      "verified": true,
      "stdout": "float: 3.14159\n占 4 字节\n\nfloat  存 123456789 = 123456792.00  <- 末尾失真了\ndouble 存 123456789 = 123456789.00  <- 准确\n\nfloat  有效位数约 6 位\ndouble 有效位数约 15 位\n\n0.1f + 0.2f == 0.3f ? 相等\n实际值是 0.3000000119\n正确做法: 判断差值是否小于 1e-6 -> 认为相等"
    },
    "cpp-double": {
      "kind": "topic",
      "title": "double —— 默认的小数类型",
      "verified": true,
      "stdout": "默认输出: 3.14159  (6 位有效数字)\n占 8 字节\n\n保留 2 位: 3.14\n保留 6 位: 3.141593\n保留 10 位: 3.1415926536\n\n7 / 2 (整数除法)     = 3\n7 / 2 (转 double)    = 3.5\n7.0 / 2 (字面量)     = 3.5\n\nsqrt(2)  = 1.414213562\npow(2,10)= 1024\nfloor(-3.5) = -4, ceil(-3.5) = -3"
    },
    "cpp-char-bool": {
      "kind": "topic",
      "title": "char 与 bool",
      "verified": true,
      "stdout": "char: A, 占 1 字节\n它的 ASCII 码是 65\n\n'a' + 1 = b\n'A' 到 'Z' 的编码: 65 ~ 90\n'a' 到 'z' 的编码: 97 ~ 122\n'0' 的编码: 48\n\n'7' 转成数值: 7（'7' - '0'）\n反过来，数值转字符: 7\n\n小写 g 转大写: G\n\nbool true 输出: 1, false 输出: 0\n占 1 字节\n非 0 转 bool: 1, 0 转 bool: 0"
    },
    "cpp-type-range": {
      "kind": "topic",
      "title": "怎么选类型：估算与决策",
      "verified": true,
      "stdout": "1..100000 的和 = 5000050000\nn*n 用 int:       1410065408  <- 溢出\nn*n 用 long long: 10000000000  <- 正确\n\n快速判断表：\n  结果 <= 2e9        -> int 够用\n  2e9 < 结果 <= 9e18 -> long long\n  结果是小数         -> double\n  结果位数不确定     -> 高精度（数组逐位存）\n\n记忆锚点：int 上限 21 亿；10 万的平方是 100 亿 —— 已经超了"
    },
    "cpp-overflow": {
      "kind": "topic",
      "title": "整数溢出：最隐蔽的错误",
      "verified": true,
      "stdout": "1..100000 用 int 累加:   705082704  <- 溢出成负数\n1..100000 用 long long:  5000050000  <- 正确\n\n1! = 1\n2! = 2\n3! = 6\n4! = 24\n5! = 120\n6! = 720\n7! = 5040\n8! = 40320\n9! = 362880\n10! = 3628800\n11! = 39916800\n12! = 479001600\n13! = 6227020800\n14! = 87178291200\n15! = 1307674368000\n16! = 20922789888000\n17! = 355687428096000\n18! = 6402373705728000\n19! = 121645100408832000\n20! = 2432902008176640000\n(21! 会超出 long long 范围)\n\n1e9 * 1e9 直接算: 1000000000000000000  (long long 装得下)\n对 1e9+7 取模: 49"
    },
    "cpp-arithmetic-detail": {
      "kind": "topic",
      "title": "算术运算符与整数除法",
      "verified": true,
      "stdout": "a = 7, b = 2\na + b = 9\na - b = 5\na * b = 14\na / b = 3   <- 整数除法，丢掉小数\na % b = 1   <- 余数\n\n-7 / 2  = -3   <- 向零取整，不是 -4\n-7 % 2  = -1   <- 符号跟随被除数\n7 % -2  = 1\n\n7 / 2 转 double = 3.5\n\n17 个物品装进容量 5 的盒子，需要 4 个（向上取整）\n对比普通除法: 3 个（少了，装不下）\n\n++i 后 i=1, x=1\nj++ 后 j=1, y=0"
    },
    "cpp-compare-logic": {
      "kind": "topic",
      "title": "比较与逻辑运算符",
      "verified": true,
      "stdout": "a == b : 0\na != b : 1\na >  b : 1\na <= b : 0\n\na>0 && b>0 : 1\na>10 || b>0 : 1\n!true       : 0\n\n下标 5 越界了吗？越界（已短路，没真的访问）\n\n0.1 + 0.2 == 0.3 ? 不相等！\n正确做法: fabs(x - 0.3) < 1e-9 -> 视为相等\n\n((c = 5)) 会进入分支，因为赋值表达式返回 5（非 0 为真）\n这就是为什么建议写 if (5 == c) —— 写错成 = 编译器会报错"
    },
    "cpp-operator-priority": {
      "kind": "topic",
      "title": "运算符优先级",
      "verified": true,
      "stdout": "2 + 3 * 4     = 14   (不是 20)\n(2 + 3) * 4   = 20\n\n1 < 2 && 3 < 4 = 1\n\na || b && c   = 1   (= a || (b && c))\n(a || b) && c = 0   (加了括号结果就不同)\n\nx & y == 0    = 0   <- 实际是 x & (y==0)\n(x & y) == 0  = 0   <- 这才是本意\n位运算优先级低于 ==，必须加括号\n\np = q = 99 之后: p=99, q=99\n因为赋值返回被赋的值，所以可以连锁赋值"
    },
    "cpp-cast": {
      "kind": "topic",
      "title": "类型转换",
      "verified": true,
      "stdout": "int 42 -> long long 42 -> double 42\n\nlong long 1234567890123 转成 int: 1912276171  <- 完全变了\n\n(int)3.9  = 3   <- 截断，不是 4\n(int)-3.9 = -3   <- 向零截断，不是 -4\n想四舍五入: (int)(3.9 + 0.5) = 4\n或 round(3.9) = 4\n\n(double)(a / b)  = 3   <- 先整除再转，没用\n(double)a / b    = 3.5   <- 正确\n\nstatic_cast<int>(3.14159) = 3"
    },
    "algo-bubble": {
      "kind": "algo",
      "title": "冒泡排序",
      "verified": true,
      "stdout": "0 1 2 2 4 5 8"
    },
    "algo-selection": {
      "kind": "algo",
      "title": "选择排序",
      "verified": true,
      "stdout": "0 1 2 2 4 5 8"
    },
    "algo-insertion": {
      "kind": "algo",
      "title": "插入排序",
      "verified": true,
      "stdout": "0 1 2 2 4 5 8"
    },
    "algo-shell": {
      "kind": "algo",
      "title": "希尔排序",
      "verified": true,
      "stdout": "0 1 2 2 4 5 8"
    },
    "algo-merge": {
      "kind": "algo",
      "title": "归并排序",
      "verified": true,
      "stdout": "0 1 2 2 4 5 8"
    },
    "algo-quick": {
      "kind": "algo",
      "title": "快速排序",
      "verified": true,
      "stdout": "0 1 2 2 4 5 8"
    },
    "algo-heap": {
      "kind": "algo",
      "title": "堆排序",
      "verified": true,
      "stdout": "0 1 2 2 4 5 8"
    },
    "algo-counting": {
      "kind": "algo",
      "title": "计数排序",
      "verified": true,
      "stdout": "0 1 2 2 4 5 8"
    },
    "algo-radix": {
      "kind": "algo",
      "title": "基数排序",
      "verified": true,
      "stdout": "2 24 45 66 75 90 170 802"
    },
    "algo-bucket": {
      "kind": "algo",
      "title": "桶排序",
      "verified": true,
      "stdout": "0 1 2 2 4 5 8"
    },
    "algo-binary-search": {
      "kind": "algo",
      "title": "二分查找",
      "verified": true,
      "stdout": "找 13: 下标 6, 用了 2 次比较\n找 4:  不存在, 用了 3 次比较\n数组长度 9，最多需要 4 次"
    },
    "algo-binary-answer": {
      "kind": "algo",
      "title": "二分答案",
      "verified": true,
      "stdout": "绳子: 802 743 457 539 \n切成 11 段，每段最长 = 200（二分了 9 次）"
    },
    "algo-bfs": {
      "kind": "algo",
      "title": "广度优先搜索 BFS",
      "verified": true,
      "stdout": "BFS 访问顺序: 0 1 2 3 4 5 \n0 到 0 的最短距离: 0\n0 到 1 的最短距离: 1\n0 到 2 的最短距离: 1\n0 到 3 的最短距离: 2\n0 到 4 的最短距离: 3\n0 到 5 的最短距离: 4"
    },
    "algo-dfs": {
      "kind": "algo",
      "title": "深度优先搜索 DFS",
      "verified": true,
      "stdout": "DFS 访问顺序: 0 1 3 2 4 5 \n（同一张图上 BFS 的顺序会不同 —— 这就是队列与栈的差别）"
    },
    "algo-two-pointers": {
      "kind": "algo",
      "title": "双指针 · 两数之和",
      "verified": true,
      "stdout": "数组: 2 3 6 7 11 15 \n找到 2 + 7 = 9（用了 3 步，O(n)）"
    },
    "algo-sliding-window": {
      "kind": "algo",
      "title": "滑动窗口",
      "verified": true,
      "stdout": "数组: 1 2 3 2 4 1 5 \n最长无重复区间: [2, 6]，长度 5\n区间内容: 3 2 4 1 5"
    },
    "algo-prefix-sum": {
      "kind": "algo",
      "title": "前缀和",
      "verified": true,
      "stdout": "数组: 3 1 4 1 5 9 2 6 \n前缀和: 0 3 4 8 9 14 23 25 31 \n\n[0,3] 的和 = 9（朴素做法要累加 4 次）\n[2,6] 的和 = 21（朴素做法要累加 5 次）\n[0,7] 的和 = 31（整段）\n\n预处理 O(n)，之后每次查询 O(1)"
    },
    "algo-difference-array": {
      "kind": "algo",
      "title": "差分数组",
      "verified": true,
      "stdout": "原数组: 3 1 4 1 5 9 2 6 \n给 [1,3] 每个数加 10（只改了两处）\n给 [4,6] 每个数加 -5（只改了两处）\n还原结果: 3 11 14 11 0 4 -3 6 \n朴素修改: 3 11 14 11 0 4 -3 6 \n两者一致 ✓"
    },
    "algo-bitwise": {
      "kind": "algo",
      "title": "位运算",
      "verified": true,
      "stdout": "a = 204 = 11001100\nb = 170 = 10101010\n\na & b  = 10001000 = 136\na | b  = 11101110 = 238\na ^ b  = 01100110 = 102\n~a     = 00110011\na << 1 = 10011000 = 408\na >> 1 = 01100110 = 102"
    },
    "algo-kmp": {
      "kind": "algo",
      "title": "KMP 字符串匹配",
      "verified": true,
      "stdout": "模式串: ABABC\nnext  : 0 0 1 2 0 \n主串  : ABABABCABABABCABAB\n匹配位置: 2 9"
    },
    "algo-rabin-karp": {
      "kind": "algo",
      "title": "字符串哈希",
      "verified": true,
      "stdout": "主串: ABCABCABDABC\n模式串: ABC\n模式串哈希: 17426\n\n哈希命中 3 次\n匹配位置: 0 3 9"
    },
    "algo-stack": {
      "kind": "algo",
      "title": "栈 · 括号匹配",
      "verified": true,
      "stdout": "[({[]})] -> 匹配\n[([)]] -> 不匹配\n[((()))] -> 匹配\n[(()] -> 不匹配\n[] -> 匹配"
    },
    "algo-queue": {
      "kind": "algo",
      "title": "队列 · 任务调度",
      "verified": true,
      "stdout": "初始队列大小: 2\n处理第 1 个任务: 渲染画面\n  -> 新任务入队: 播放动画\n处理第 2 个任务: 计算坐标\n  -> 新任务入队: 清理临时值\n处理第 3 个任务: 播放动画\n处理第 4 个任务: 清理临时值\n全部处理完，共 4 个任务"
    },
    "algo-bigadd": {
      "kind": "algo",
      "title": "高精度加法",
      "verified": true,
      "stdout": "98765432109876543210 + 12345678901234567890 = 111111111011111111100\n结果共 21 位"
    },
    "algo-bigsub": {
      "kind": "algo",
      "title": "高精度减法",
      "verified": true,
      "stdout": "98765432109876543210 - 12345678901234567890 = 86419753208641975320"
    },
    "algo-bigmul": {
      "kind": "algo",
      "title": "高精度乘法",
      "verified": true,
      "stdout": "98765 * 43210 = 4267635650"
    },
    "algo-bigfactorial": {
      "kind": "algo",
      "title": "高精度阶乘",
      "verified": true,
      "stdout": "计算 25!\n20! 已有 19 位\n21! 已有 20 位\n25! = 15511210043330985984000000\n共 26 位\n(long long 最多约 19 位，所以 20! 之后必须用高精度)"
    },
    "algo-graph-storage": {
      "kind": "algo",
      "title": "图的存储",
      "verified": true,
      "stdout": "邻接矩阵（0 表示不通）:\n0 4 0 2 0 0 \n4 0 5 0 3 0 \n0 5 0 0 0 6 \n2 0 0 0 1 0 \n0 3 0 1 0 7 \n0 0 6 0 7 0 \n\n邻接表:\n  0 -> 1(权4) 3(权2) \n  1 -> 0(权4) 2(权5) 4(权3) \n  2 -> 1(权5) 5(权6) \n  3 -> 0(权2) 4(权1) \n  4 -> 1(权3) 3(权1) 5(权7) \n  5 -> 2(权6) 4(权7) \n\n矩阵用 36 个格子，邻接表只用 14 条记录"
    },
    "algo-dijkstra": {
      "kind": "algo",
      "title": "Dijkstra 最短路",
      "verified": true,
      "stdout": "从点 0 出发的最短距离:\n  到点 0: 0\n  到点 1: 4\n  到点 2: 9\n  到点 3: 2\n  到点 4: 3\n  到点 5: 10"
    },
    "algo-topological-sort": {
      "kind": "algo",
      "title": "拓扑排序",
      "verified": true,
      "stdout": "拓扑序: 0 1 2 3 5 4"
    },
    "algo-kruskal": {
      "kind": "algo",
      "title": "最小生成树 Kruskal",
      "verified": true,
      "stdout": "选中的边:\n  3 - 4 (权 1)\n  0 - 3 (权 2)\n  1 - 4 (权 3)\n  1 - 2 (权 5)\n  2 - 5 (权 6)\n最小生成树总权值: 17\n边数: 5（应为 n-1 = 5）"
    },
    "algo-trie": {
      "kind": "algo",
      "title": "Trie 字典树",
      "verified": true,
      "stdout": "插入 6 个单词，共 27 个字符\nTrie 用了 17 个节点（根不算）\n共用前缀省了 10 个节点\n\n前缀 \"app\": 存在, 完整单词: 是\n前缀 \"ban\": 存在, 完整单词: 否\n前缀 \"cat\": 不存在, 完整单词: 否\n前缀 \"bat\": 存在, 完整单词: 是\n前缀 \"batc\": 存在, 完整单词: 否"
    }
  }
};
