/**
 * C++ 语法教程内容。
 *
 * 设计说明（重要）：
 *   浏览器**无法执行 C++**，所以这些示例不像原来的 JS 示例那样
 *   「在页面上点一下就真跑」。它们的输出是在**构建期**由本机 g++ 编译运行得到的，
 *   存在 src/syntax/cpp-output.json 里，页面读出来展示。
 *
 *   这样做的好处：访客看到的输出是**真实编译运行的结果**，不是手写的。
 *   代价：页面不能重新编译（界面上有明确说明）。
 *
 * 写法约定：
 *   - 每个示例都是**完整可编译**的程序（含 #include 与 main）
 *   - 用标准库，尽量贴近竞赛写法（using namespace std; 等）
 *   - 输出保持简短，便于在页面上展示
 */

export const CPP_TOPICS = [
  // ==================== 一、零基础入门 ====================
  {
    id: 'cpp-hello',
    group: '零基础入门',
    title: 'Hello World',
    summary: 'C++ 的第一行代码。cout 负责输出，endl 负责换行。',
    points: [
      '#include <iostream> 引入输入输出库，几乎所有程序都要写',
      'main 是程序入口，返回 0 表示正常结束',
      'cout << 是「把东西送到输出流」，可以连着写多个',
      'endl 表示换行并刷新缓冲区；也可以直接用 "\\n"（更快）',
      '每条语句以分号结尾 —— 这是 C++ 最常见的报错来源',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World" << endl;

    // 可以连着输出多个内容
    cout << "结果是 " << 1 + 1 << endl;

    // 用 \\n 换行更高效（竞赛里推荐）
    cout << "第一行\\n第二行\\n";

    return 0;
}`,
  },

  {
    id: 'cpp-variables',
    group: '零基础入门',
    title: '变量与基本类型',
    summary: 'int 存整数，double 存小数，char 存单个字符，bool 存真假。',
    points: [
      'int 通常 4 字节，范围约 ±21 亿；long long 约 ±9.2×10¹⁸（竞赛常用）',
      'double 是双精度小数，默认输出 6 位有效数字',
      'char 存单个字符，用单引号；字符串用双引号',
      'bool 只有 true / false，输出时显示 1 / 0',
      '变量必须先声明再使用，名字区分大小写',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    int a = 42;
    long long big = 123456789012345LL;
    double pi = 3.14159;
    char grade = 'A';
    bool flag = true;

    cout << "int: " << a << endl;
    cout << "long long: " << big << endl;
    cout << "double: " << pi << endl;
    cout << "char: " << grade << endl;
    cout << "bool: " << flag << " (false 显示为 " << false << ")" << endl;

    // sizeof 查看类型占多少字节
    cout << "sizeof(int)=" << sizeof(int)
         << " sizeof(long long)=" << sizeof(long long)
         << " sizeof(double)=" << sizeof(double) << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-io',
    group: '零基础入门',
    title: '输入与输出',
    summary: 'cin >> 读入，cout << 输出。方向就是数据流动的方向。',
    points: [
      'cin >> 会自动跳过空白（空格、换行），所以读一串数很方便',
      '连续读入可以串起来写：cin >> a >> b >> c',
      'cin / cout 比 scanf / printf 慢，竞赛里常加 ios::sync_with_stdio(false) 提速',
      '读取整行（含空格）要用 getline，注意它和 >> 混用时的残留换行问题',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    // 用固定的数据模拟输入（真实运行时来自键盘或文件）
    int a = 3, b = 7;

    int sum = a + b;
    cout << a << " + " << b << " = " << sum << endl;

    // 读入多个值的写法（这里用变量模拟）
    int x = 10, y = 20, z = 30;
    cout << "三个数的和: " << x + y + z << endl;

    // 格式化输出：控制小数位数需要 <iomanip>
    double d = 10.0 / 3.0;
    cout << "默认输出: " << d << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-operators',
    group: '零基础入门',
    title: '运算符',
    summary: '加减乘除取余，以及整数除法的陷阱。',
    points: [
      '两个整数相除是**整数除法**：7 / 2 = 3，不是 3.5',
      '想要小数结果，至少一边要是 double：7.0 / 2 = 3.5',
      '% 取余只能用于整数，常用来判断整除、奇偶',
      '++ / -- 自增自减；+= -= *= /= 是复合赋值',
      '整数溢出是静默的：超过范围会绕回负数，务必用 long long',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    int a = 7, b = 2;

    cout << "a + b = " << a + b << endl;
    cout << "a - b = " << a - b << endl;
    cout << "a * b = " << a * b << endl;
    cout << "a / b = " << a / b << "  <- 整数除法，丢掉了小数" << endl;
    cout << "a % b = " << a % b << "  <- 取余" << endl;

    // 想要小数，要转成浮点
    cout << "7.0 / 2 = " << 7.0 / 2 << endl;
    cout << "a / (double)b = " << a / (double)b << endl;

    // 整数溢出的演示（用 long long 避免）
    int big = 2000000000;
    cout << "2e9 + 2e9 (int)      = " << big + big << "  <- 溢出了！" << endl;
    long long safe = 2000000000LL;
    cout << "2e9 + 2e9 (long long)= " << safe + safe << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-branch',
    group: '零基础入门',
    title: '条件分支',
    summary: 'if / else if / else，以及三目运算符。',
    points: [
      '条件为 0 视为假，非 0 视为真（C++ 没有真正的布尔强制）',
      '比较用 ==，赋值用 =，写混了是经典 bug 且编译器可能不报错',
      '三目运算符：条件 ? 值1 : 值2',
      'switch 只能用于整数/字符，每个 case 后要 break',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    int score = 85;

    // if / else if / else
    if (score >= 90) cout << "优秀" << endl;
    else if (score >= 80) cout << "良好" << endl;
    else if (score >= 60) cout << "及格" << endl;
    else cout << "不及格" << endl;

    // 三目运算符
    int a = 3, b = 7;
    int mx = (a > b) ? a : b;
    cout << "max(" << a << ", " << b << ") = " << mx << endl;

    // switch
    char op = '+';
    switch (op) {
        case '+': cout << "加法" << endl; break;
        case '-': cout << "减法" << endl; break;
        default:  cout << "未知运算符" << endl;
    }

    return 0;
}`,
  },

  {
    id: 'cpp-loops',
    group: '零基础入门',
    title: '循环',
    summary: 'for 适合已知次数，while 适合条件驱动。',
    points: [
      'for (初始化; 条件; 步进) 是最常用的计数循环',
      'while (条件) 先判断再执行，可能一次都不执行',
      'do...while 至少执行一次',
      'break 跳出整个循环，continue 跳过本次剩余部分',
      '循环边界写错（< 写成 <=）是数组越界的头号原因',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    // for：求 1..10 的和
    int sum = 0;
    for (int i = 1; i <= 10; i++) sum += i;
    cout << "1+2+...+10 = " << sum << endl;

    // while：找第一个大于 100 的 2 的幂
    int p = 1, n = 0;
    while (p <= 100) { p *= 2; n++; }
    cout << "第一个 >100 的 2 的幂是 2^" << n << " = " << p << endl;

    // break 与 continue
    int oddSum = 0;
    for (int i = 1; i <= 10; i++) {
        if (i % 2 == 0) continue;   // 跳过偶数
        oddSum += i;
    }
    cout << "1..10 中奇数和 = " << oddSum << endl;

    // 九九乘法表（双层循环，只打印前 3 行）
    for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= i; j++) {
            cout << j << "*" << i << "=" << i * j << " ";
        }
        cout << endl;
    }

    return 0;
}`,
  },

  {
    id: 'cpp-array',
    group: '零基础入门',
    title: '数组',
    summary: '定长数组 int a[100]，下标从 0 到 n-1 开始。',
    points: [
      '定义时要给定长度，且长度必须是编译期常量（竞赛里常用足够大的常量）',
      '下标从 0 开始，有效范围是 0 ~ n-1；越界不报错，是未定义行为',
      '全局数组会自动初始化为 0，局部数组不会（这是常见陷阱）',
      '数组长度一般要开大一倍以上（多开一点更安全）',
      '求长度的 sizeof(a)/sizeof(a[0]) 只在「数组本身」上有效',
    ],
    code: `#include <iostream>
using namespace std;

// 全局数组会自动清零
int globalArr[10];

int main() {
    // 局部数组初始化
    int a[5] = {1, 2, 3, 4, 5};

    cout << "元素: ";
    for (int i = 0; i < 5; i++) cout << a[i] << " ";
    cout << endl;

    cout << "首个元素 a[0] = " << a[0] << endl;
    cout << "末个元素 a[4] = " << a[4] << endl;

    // 数组长度（仅在数组本身可用）
    int len = sizeof(a) / sizeof(a[0]);
    cout << "长度 = " << len << endl;

    // 求和与最大值
    int sum = 0, mx = a[0];
    for (int i = 0; i < len; i++) {
        sum += a[i];
        if (a[i] > mx) mx = a[i];
    }
    cout << "和 = " << sum << ", 最大 = " << mx << endl;

    // 全局数组确实被清零
    cout << "全局数组前 3 个: " << globalArr[0] << " " << globalArr[1] << " " << globalArr[2] << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-functions',
    group: '零基础入门',
    title: '函数',
    summary: '把一段逻辑封装起来，用参数传入、用 return 传出。',
    points: [
      '函数要先声明（或定义）再使用',
      '参数是「值传递」：函数内改的是副本，不影响调用方',
      '想修改调用方的变量，要传引用（加 &）或指针',
      'return 可以提前结束函数；返回类型 void 表示不返回值',
      '递归函数必须有终止条件，否则栈溢出',
    ],
    code: `#include <iostream>
using namespace std;

// 普通函数：值传递
int add(int a, int b) {
    return a + b;
}

// 引用传递：能修改调用方的变量
void swapByRef(int &a, int &b) {
    int t = a; a = b; b = t;
}

// 值传递：改不了外面
void tryModify(int x) {
    x = 999;   // 只改了副本
}

// 递归：求阶乘
long long factorial(int n) {
    if (n <= 1) return 1;          // 终止条件
    return n * factorial(n - 1);
}

int main() {
    cout << "add(3, 4) = " << add(3, 4) << endl;

    int a = 1, b = 2;
    swapByRef(a, b);
    cout << "引用交换后: a=" << a << ", b=" << b << endl;

    int x = 5;
    tryModify(x);
    cout << "值传递后 x 仍是 " << x << "（没被改到）" << endl;

    cout << "5! = " << factorial(5) << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-recursion',
    group: '零基础入门',
    title: '递归',
    summary: '函数调用自己。关键是找准「终止条件」和「如何缩小规模」。',
    points: [
      '递归三要素：终止条件、递归调用、缩小问题规模',
      '缺终止条件会栈溢出（Runtime Error / 段错误）',
      '朴素斐波那契递归是 O(2ⁿ)，n=40 就会很慢 —— 这是反面教材',
      'C++ 函数调用有开销，深度太大会爆栈（一般几千到几万层）',
    ],
    code: `#include <iostream>
using namespace std;

// 斐波那契：朴素递归（糟糕但直观）
long long fibSlow(int n) {
    if (n < 2) return n;
    return fibSlow(n - 1) + fibSlow(n - 2);
}

// 斐波那契：递推（O(n)，正确做法）
long long fibFast(int n) {
    if (n < 2) return n;
    long long a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        long long c = a + b;
        a = b;
        b = c;
    }
    return b;
}

// 递归求最大公约数（欧几里得算法）
int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}

int main() {
    cout << "fib(20) 递归 = " << fibSlow(20) << endl;
    cout << "fib(20) 递推 = " << fibFast(20) << endl;
    cout << "fib(50) 递推 = " << fibFast(50) << "（递归算这个要好几分钟）" << endl;
    cout << "gcd(48, 18) = " << gcd(48, 18) << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-pointer',
    group: '零基础入门',
    title: '指针与引用',
    summary: '指针存地址，引用是别名。竞赛里引用用得更多。',
    points: [
      '指针用 * 声明、用 & 取地址、用 * 解引用取值',
      '引用是变量的「别名」，一旦绑定不能改绑，用起来像普通变量',
      '引用做参数可以避免拷贝大对象（性能）又能修改原值',
      '空指针用 nullptr；解引用空指针会崩溃',
      '竞赛里如果只是传参，优先用引用或 const 引用，少用裸指针',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    int x = 42;

    // 指针：存的是地址
    int *p = &x;
    cout << "x 的值   = " << x << endl;
    cout << "*p 解引用 = " << *p << endl;
    *p = 100;                      // 通过指针修改
    cout << "通过指针改成 100 后，x = " << x << endl;

    // 引用：别名
    int &r = x;
    r = 7;
    cout << "通过引用改成 7 后，x = " << x << endl;

    // const 引用：只读，避免拷贝
    const int &cr = x;
    cout << "const 引用读到 " << cr << endl;

    // nullptr 表示空指针
    int *np = nullptr;
    cout << "空指针是否为 null: " << (np == nullptr ? "是" : "否") << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-complexity',
    group: '零基础入门',
    title: '复杂度入门',
    summary: '同一件事，算法不同，快慢能差上百万倍。看数据范围就能反推该用什么算法。',
    points: [
      'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)',
      'n ≤ 20 可以考虑爆搜/状压；n ≤ 5000 可以 O(n²)；n ≤ 10⁵ 要 O(n log n) 或 O(n)',
      '1 秒大约能跑 10⁸ 次简单运算 —— 这是估算的锚点',
      '常数也很重要：同样是 O(n)，cin 比 scanf 慢好几倍',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    int n = 100000;
    long long cnt = 0;

    // O(n)：一次循环
    for (int i = 0; i < n; i++) cnt++;

    // O(n log n)：内层按倍数缩小（模拟）
    long long cnt2 = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 1; j < n; j *= 2) cnt2++;
    }

    cout << "n = " << n << endl;
    cout << "O(n)      约 " << cnt << " 次" << endl;
    cout << "O(n log n) 约 " << cnt2 << " 次" << endl;
    cout << "O(n^2)    约 " << (long long)n * n << " 次  <- 10^10，超时无疑" << endl;

    cout << "\\n估算参考（1 秒约 10^8 次简单运算）：" << endl;
    cout << "  n=20    -> 2^n 爆搜可行" << endl;
    cout << "  n=5000  -> O(n^2) 可行" << endl;
    cout << "  n=1e5   -> 需要 O(n log n)" << endl;

    return 0;
}`,
  },

  // ==================== 二、STL ====================
  {
    id: 'cpp-vector',
    group: 'STL 容器',
    title: 'vector —— 动态数组',
    summary: 'STL 里最常用的容器。能自动扩容，替代手写数组。',
    points: [
      'push_back 加到末尾，pop_back 删末尾，都是 O(1)',
      'size() 取元素个数；empty() 判断是否为空',
      '可以用 v[i] 随机访问，也可以用迭代器遍历',
      'clear() 清空但**不释放内存**，要释放用 vector<int>().swap(v)',
      '提前 reserve(n) 能避免反复扩容，提升性能',
      '排序：sort(v.begin(), v.end())',
    ],
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v;

    // 尾部插入
    for (int i = 5; i >= 1; i--) v.push_back(i);
    cout << "插入后: ";
    for (int x : v) cout << x << " ";
    cout << endl;

    cout << "size = " << v.size() << ", empty = " << (v.empty() ? "true" : "false") << endl;

    // 排序
    sort(v.begin(), v.end());
    cout << "升序后: ";
    for (int x : v) cout << x << " ";
    cout << endl;

    // 降序：加 greater<int>()
    sort(v.begin(), v.end(), greater<int>());
    cout << "降序后: ";
    for (int x : v) cout << x << " ";
    cout << endl;

    // 访问与修改
    cout << "v[0] = " << v[0] << ", v.back() = " << v.back() << endl;

    // 删除末尾
    v.pop_back();
    cout << "pop_back 后 size = " << v.size() << endl;

    // 用初始化列表一次性构造
    vector<int> w = {10, 20, 30};
    cout << "另一个 vector: ";
    for (int x : w) cout << x << " ";
    cout << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-string',
    group: 'STL 容器',
    title: 'string —— 字符串',
    summary: '比 C 风格字符数组好用得多：能拼接、能比较、能直接取长度。',
    points: [
      's.size() / s.length() 取长度，O(1)',
      '用 + 拼接，用 == 直接比较内容（char[] 不能用 == 比内容）',
      's[i] 取字符，s.substr(pos, len) 取子串',
      's.find(t) 找子串，找不到返回 string::npos',
      '读入含空格的整行用 getline(cin, s)',
    ],
    code: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    string a = "Hello";
    string b = "World";

    // 拼接与比较
    string c = a + " " + b;
    cout << "拼接: " << c << endl;
    cout << "长度: " << c.size() << endl;
    cout << "比较 a==b: " << (a == b ? "true" : "false") << endl;
    cout << "字典序 a<b: " << (a < b ? "true" : "false") << endl;

    // 取字符与子串
    cout << "首字符: " << c[0] << ", 末字符: " << c.back() << endl;
    cout << "substr(0,5): " << c.substr(0, 5) << endl;

    // 查找
    size_t pos = c.find("World");
    cout << "找 World 的位置: " << (pos == string::npos ? -1 : (int)pos) << endl;
    cout << "找 XYZ: " << (c.find("XYZ") == string::npos ? "未找到" : "找到了") << endl;

    // 反转
    string rev = a;
    reverse(rev.begin(), rev.end());
    cout << "反转 Hello: " << rev << endl;

    // 遍历字符
    int upper = 0;
    for (char ch : c) if (ch >= 'A' && ch <= 'Z') upper++;
    cout << "大写字母个数: " << upper << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-sort',
    group: 'STL 算法',
    title: 'sort / reverse / unique',
    summary: 'STL 算法用「迭代器区间」表示范围，一律是左闭右开 [begin, end)。',
    points: [
      'sort 是 O(n log n)，比自己写快排更稳更快',
      '区间一律左闭右开，所以写 v.begin(), v.end()',
      '自定义排序传比较函数：返回 true 表示 a 应排在 b 前面',
      'unique 只能去掉**相邻**重复，所以要先 sort',
      'reverse 反转区间；lower_bound / upper_bound 做二分查找',
    ],
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// 自定义排序：按绝对值从小到大
bool cmpAbs(int a, int b) {
    return abs(a) < abs(b);
}

int main() {
    vector<int> v = {5, 2, 8, 1, 9, 2};

    sort(v.begin(), v.end());
    cout << "升序: ";
    for (int x : v) cout << x << " ";
    cout << endl;

    // 去重：先排序，再 unique（unique 只去相邻重复）
    v.erase(unique(v.begin(), v.end()), v.end());
    cout << "去重后: ";
    for (int x : v) cout << x << " ";
    cout << endl;

    // 自定义排序
    vector<int> w = {-3, 1, -7, 2};
    sort(w.begin(), w.end(), cmpAbs);
    cout << "按绝对值排: ";
    for (int x : w) cout << x << " ";
    cout << endl;

    // 反转
    reverse(w.begin(), w.end());
    cout << "反转后: ";
    for (int x : w) cout << x << " ";
    cout << endl;

    // 二分查找（要求已排序）
    sort(w.begin(), w.end());
    auto it = lower_bound(w.begin(), w.end(), 2);
    cout << "lower_bound(2) 的下标: " << (it - w.begin()) << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-set',
    group: 'STL 容器',
    title: 'set / multiset —— 有序集合',
    summary: '自动去重且保持有序，插入/查找/删除都是 O(log n)。',
    points: [
      'set 自动去重，multiset 允许重复',
      '内部是平衡树，所以遍历结果**永远是有序的**',
      'insert / erase / count / find 都是 O(log n)',
      'count 返回个数（set 里只会是 0 或 1），是判断存在性的常用写法',
      '不能像 vector 那样随机访问（没有下标）',
      '需要哈希表式的 O(1) 查找用 unordered_set',
    ],
    code: `#include <iostream>
#include <set>
using namespace std;

int main() {
    set<int> s;

    // 乱序插入
    for (int x : {5, 2, 8, 2, 1, 5}) s.insert(x);

    cout << "set 大小: " << s.size() << "（重复的 2 和 5 被去掉了）" << endl;
    cout << "遍历（自动有序）: ";
    for (int x : s) cout << x << " ";
    cout << endl;

    // 查找
    cout << "存在 8 吗: " << (s.count(8) ? "是" : "否") << endl;
    cout << "存在 9 吗: " << (s.count(9) ? "是" : "否") << endl;

    // 删除
    s.erase(2);
    cout << "删掉 2 后: ";
    for (int x : s) cout << x << " ";
    cout << endl;

    // multiset 允许重复
    multiset<int> ms;
    for (int x : {3, 1, 3, 3, 2}) ms.insert(x);
    cout << "multiset 大小: " << ms.size() << ", 3 出现了 " << ms.count(3) << " 次" << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-map',
    group: 'STL 容器',
    title: 'map —— 键值对',
    summary: '按键自动排序的字典。适合「统计出现次数」「建立映射」。',
    points: [
      'm[key] 访问；若键不存在会自动创建并置零（这很方便，但也可能悄悄塞入无用键）',
      'm.count(key) 判断是否存在，不会创建新键',
      '遍历时元素是 pair<const K, V>，用 it->first / it->second 访问',
      '按键有序遍历，所以可以直接输出「按字母序统计」',
      '只关心 O(1) 查找不关心顺序时用 unordered_map',
    ],
    code: `#include <iostream>
#include <map>
#include <string>
using namespace std;

int main() {
    // 统计每个单词出现的次数
    string words[] = {"apple", "banana", "apple", "cherry", "banana", "apple"};

    map<string, int> cnt;
    for (const string &w : words) cnt[w]++;

    cout << "词频统计（按键自动排序）:" << endl;
    for (auto &kv : cnt) {
        cout << "  " << kv.first << ": " << kv.second << endl;
    }

    // 用 count 判断存在性（不会创建新键）
    cout << "有 apple 吗: " << (cnt.count("apple") ? "有" : "没有") << endl;
    cout << "有 grape 吗: " << (cnt.count("grape") ? "有" : "没有") << endl;

    // 数值键的映射
    map<int, string> id2name;
    id2name[101] = "Alice";
    id2name[103] = "Bob";
    id2name[102] = "Carol";

    cout << "按 id 排序输出:" << endl;
    for (auto &kv : id2name) cout << "  " << kv.first << " -> " << kv.second << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-stack-queue',
    group: 'STL 容器',
    title: 'stack / queue —— 栈与队列',
    summary: '栈后进先出，队列先进先出。BFS/DFS 的基本工具。',
    points: [
      'stack：push 入栈、pop 出栈、top 看栈顶',
      'queue：push 入队、pop 出队、front 看队头、back 看队尾',
      'pop() **不返回**被删的元素，要先 top()/front() 取值再 pop()',
      '两者都没有迭代器，不能遍历（只能逐个弹出）',
      'BFS 用 queue，DFS 用 stack（或递归）',
    ],
    code: `#include <iostream>
#include <stack>
#include <queue>
using namespace std;

int main() {
    // 栈：后进先出
    stack<int> st;
    for (int i = 1; i <= 3; i++) st.push(i);

    cout << "栈大小 " << st.size() << ", 栈顶 " << st.top() << endl;
    cout << "逐个弹出: ";
    while (!st.empty()) {
        cout << st.top() << " ";   // 先取
        st.pop();                  // 再弹
    }
    cout << endl;

    // 队列：先进先出
    queue<int> q;
    for (int i = 1; i <= 3; i++) q.push(i);

    cout << "队头 " << q.front() << ", 队尾 " << q.back() << endl;
    cout << "逐个出队: ";
    while (!q.empty()) {
        cout << q.front() << " ";
        q.pop();
    }
    cout << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-priority-queue',
    group: 'STL 容器',
    title: 'priority_queue —— 优先队列（堆）',
    summary: '默认是大顶堆，每次取出的都是最大值。',
    points: [
      '默认 priority_queue<int> 是**大顶堆**，top() 是最大值',
      '要小顶堆写 priority_queue<int, vector<int>, greater<int>>',
      'push / pop 都是 O(log n)，top 是 O(1)',
      '本质是二叉堆 —— 这正是「堆排序」用的结构',
      'Dijkstra 最短路、合并有序表、求第 k 大等问题都靠它',
    ],
    code: `#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    // 大顶堆（默认）
    priority_queue<int> maxHeap;
    for (int x : {3, 1, 4, 1, 5, 9, 2, 6}) maxHeap.push(x);

    cout << "大顶堆逐个弹出（从大到小）: ";
    while (!maxHeap.empty()) {
        cout << maxHeap.top() << " ";
        maxHeap.pop();
    }
    cout << endl;

    // 小顶堆
    priority_queue<int, vector<int>, greater<int>> minHeap;
    for (int x : {3, 1, 4, 1, 5, 9, 2, 6}) minHeap.push(x);

    cout << "小顶堆逐个弹出（从小到大）: ";
    while (!minHeap.empty()) {
        cout << minHeap.top() << " ";
        minHeap.pop();
    }
    cout << endl;

    // 找第 3 大的数：用小顶堆维护前 k 大
    vector<int> nums = {7, 10, 4, 3, 20, 15};
    int k = 3;
    priority_queue<int, vector<int>, greater<int>> topk;
    for (int x : nums) {
        topk.push(x);
        if ((int)topk.size() > k) topk.pop();   // 只留最大的 k 个
    }
    cout << "第 " << k << " 大的数是 " << topk.top() << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-pair-iterator',
    group: 'STL 容器',
    title: 'pair 与迭代器',
    summary: 'pair 把两个值捆一起，迭代器是「指向容器元素的东西」。',
    points: [
      'pair<A,B> 用 .first / .second 访问，比较时先比 first 再比 second',
      'make_pair(a, b) 或 {a, b} 快速构造',
      '迭代器像指针：*it 取值，it++ 后移',
      'begin() 指向首元素，end() 指向**末尾之后**（所以区间是左闭右开）',
      'auto 能省掉冗长的类型名，配合迭代器很好用',
    ],
    code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <utility>
using namespace std;

int main() {
    // pair 基本用法
    pair<int, string> p = {1, "one"};
    cout << "pair: " << p.first << " -> " << p.second << endl;

    // pair 比较：先比 first，再比 second
    pair<int, int> a = {1, 5}, b = {1, 3}, c = {2, 0};
    cout << "a(1,5) vs b(1,3): " << (a > b ? "a 大" : "b 大") << endl;
    cout << "c(2,0) vs a(1,5): " << (c > a ? "c 大" : "a 大") << endl;

    // pair 数组排序（默认按 first 再按 second）
    vector<pair<int, int>> v = {{3, 9}, {1, 5}, {3, 2}, {2, 7}};
    sort(v.begin(), v.end());
    cout << "pair 排序后: ";
    for (auto &pr : v) cout << "(" << pr.first << "," << pr.second << ") ";
    cout << endl;

    // 迭代器
    vector<int> nums = {10, 20, 30, 40};
    auto it = nums.begin();
    cout << "begin 指向: " << *it << endl;
    it += 2;
    cout << "it+2 指向: " << *it << endl;
    cout << "end - begin = " << (nums.end() - nums.begin()) << "（元素个数）" << endl;

    // 用迭代器找最大值的位置
    auto mxIt = max_element(nums.begin(), nums.end());
    cout << "最大值 " << *mxIt << " 在下标 " << (mxIt - nums.begin()) << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-binary-search',
    group: 'STL 算法',
    title: 'lower_bound / upper_bound —— 二分查找',
    summary: '在有序区间里二分。这两个函数帮你省掉手写二分的边界陷阱。',
    points: [
      'lower_bound：第一个 **>= x** 的位置',
      'upper_bound：第一个 **> x** 的位置',
      '两者相减 = x 出现的次数（在有序数组中）',
      '前提：区间必须已经有序，否则结果无意义',
      '找不到时返回 end()，用 it != v.end() 或 it - v.begin() == n 判断',
      '复杂度 O(log n)',
    ],
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {1, 3, 3, 3, 5, 7, 9};

    cout << "数组: ";
    for (int x : v) cout << x << " ";
    cout << endl;

    // 找 3
    auto lo = lower_bound(v.begin(), v.end(), 3);   // 第一个 >= 3
    auto hi = upper_bound(v.begin(), v.end(), 3);   // 第一个 > 3
    cout << "lower_bound(3) 下标 = " << (lo - v.begin()) << endl;
    cout << "upper_bound(3) 下标 = " << (hi - v.begin()) << endl;
    cout << "3 出现了 " << (hi - lo) << " 次" << endl;

    // 找一个不存在的值
    auto it = lower_bound(v.begin(), v.end(), 4);
    cout << "lower_bound(4) 下标 = " << (it - v.begin())
         << "（指向第一个 >= 4 的元素，即 " << *it << "）" << endl;

    // 超出最大值
    auto none = lower_bound(v.begin(), v.end(), 100);
    cout << "找 100: " << (none == v.end() ? "没找到（返回 end）" : "找到了") << endl;

    // 典型应用：判断存在性
    int q = 5;
    bool exists = binary_search(v.begin(), v.end(), q);
    cout << "binary_search(5) = " << (exists ? "存在" : "不存在") << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-bitset',
    group: 'STL 算法',
    title: '位运算',
    summary: '把整数当二进制位操作。状态压缩、快速乘除、位掩码的基础。',
    points: [
      '& 与：两位都是 1 才得 1（取某些位）',
      '| 或：有一位是 1 就得 1（置某些位为 1）',
      '^ 异或：两位不同才得 1（翻转某些位）。同一个数异或两次会还原',
      '~ 取反；<< 左移（乘 2）；>> 右移（除 2，向下取整）',
      '常用技巧：x & 1 判奇偶；x & (x-1) 消掉最低位的 1；1 << k 表示第 k 位',
      '注意：int 只有 32 位，左移太多会溢出，必要时用 1LL << k',
    ],
    code: `#include <iostream>
#include <bitset>
using namespace std;

int main() {
    int a = 12;   // 二进制 1100
    int b = 10;   // 二进制 1010

    cout << "a = " << a << " = " << bitset<8>(a) << endl;
    cout << "b = " << b << " = " << bitset<8>(b) << endl;
    cout << endl;

    cout << "a & b  = " << (a & b) << " = " << bitset<8>(a & b) << "  (与)" << endl;
    cout << "a | b  = " << (a | b) << " = " << bitset<8>(a | b) << "  (或)" << endl;
    cout << "a ^ b  = " << (a ^ b) << " = " << bitset<8>(a ^ b) << "  (异或)" << endl;
    cout << "a << 1 = " << (a << 1) << " = " << bitset<8>(a << 1) << "  (左移=乘2)" << endl;
    cout << "a >> 1 = " << (a >> 1) << " = " << bitset<8>(a >> 1) << "  (右移=除2)" << endl;
    cout << endl;

    // 常用技巧
    cout << "判断奇偶 a&1  = " << (a & 1) << "（0 表示偶数）" << endl;
    cout << "消掉最低位的1 a&(a-1) = " << (a & (a - 1)) << " = " << bitset<8>(a & (a - 1)) << endl;
    cout << "取第 2 位 (a>>2)&1 = " << ((a >> 2) & 1) << endl;
    cout << "1<<3 = " << (1 << 3) << "（表示第 3 位为 1）" << endl;

    // 异或的性质：一个数异或自己得 0
    cout << "a ^ a = " << (a ^ a) << "（自己异或自己得 0）" << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-struct',
    group: 'STL 容器',
    title: 'struct —— 自定义类型',
    summary: '把相关的数据打包成一个类型，并给它定义比较规则。',
    points: [
      'struct 里可以放多种类型的数据（成员变量）',
      '重载 < 运算符后，就能直接用 sort 排序',
      '也可以用自定义比较函数，不改结构体本身',
      '构造函数可以简化初始化',
      '竞赛里常用 struct 表示点、边、区间等',
    ],
    code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;

struct Student {
    string name;
    int score;

    // 重载 < ：按分数降序，分数相同按名字升序
    bool operator<(const Student &o) const {
        if (score != o.score) return score > o.score;
        return name < o.name;
    }
};

int main() {
    vector<Student> v = {
        {"Alice", 90},
        {"Bob", 85},
        {"Carol", 90},
        {"Dave", 78},
    };

    sort(v.begin(), v.end());

    cout << "按分数降序（同分按名字升序）:" << endl;
    for (const auto &s : v) {
        cout << "  " << s.name << " : " << s.score << endl;
    }

    // 用自定义比较函数（不改结构体）
    sort(v.begin(), v.end(), [](const Student &a, const Student &b) {
        return a.name < b.name;
    });

    cout << "改按名字升序:" << endl;
    for (const auto &s : v) {
        cout << "  " << s.name << " : " << s.score << endl;
    }

    return 0;
}`,
  },
];
