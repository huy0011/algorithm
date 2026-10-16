/**
 * 本文件由 tests/build-cpp.js 自动生成，请勿手改。
 *
 * 内容：每个 C++ 示例经 g++ 真实编译运行后的 stdout。
 * 生成方式：node tests/build-cpp.js → 编译 → node tests/build-cpp.js --collect
 * 编译器：g++ -std=c++17 -O2
 * 生成时间：2026-10-16T15:21:48.252Z
 *
 * 为什么页面不直接编译 C++：浏览器没有 C++ 编译器，
 * 且本项目部署在 GitHub Pages（纯静态、无后端），所以只能预先录制输出。
 */

export const CPP_OUTPUT = {
  "meta": {
    "generatedAt": "2026-10-16T15:21:48.252Z",
    "compiler": "g++ -std=c++17 -O2",
    "compilerVersion": "g++.exe (x86_64-posix-seh-rev1, Built by MinGW-Builds project) 16.2.0",
    "note": "本文件由构建脚本生成：每个 C++ 示例都经真实编译运行，stdout 为程序真实输出。浏览器无法编译 C++，所以页面上展示的是这份预先录制的输出，不能重新运行。",
    "total": 46,
    "passed": 46,
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
      "title": "变量与基本类型",
      "verified": true,
      "stdout": "int: 42\nlong long: 123456789012345\ndouble: 3.14159\nchar: A\nbool: 1 (false 显示为 0)\nsizeof(int)=4 sizeof(long long)=8 sizeof(double)=8"
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
    }
  }
};
