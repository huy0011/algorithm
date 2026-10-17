/**
 * C++ 语法教程「细化层」。
 *
 * 为什么要有这个文件：
 * 原来的知识点粒度太粗 —— 比如「变量与基本类型」一个知识点塞了 int / long long /
 * double / char / bool 五种类型，float 甚至完全没提。
 * 对初学者来说，这些类型各有各的坑（范围、精度、溢出），必须分开讲。
 *
 * 所以这里把粗粒度知识点拆成细粒度的，每个都有独立可编译示例。
 * 文件里的示例同样由 tests/build-cpp.js 编译验证，输出是真实运行结果。
 */

export const CPP_DETAIL_TOPICS = [
  // ==================== 整数类型 ====================
  {
    id: 'cpp-int',
    group: 'C++ 基础入门',
    title: 'int —— 最常用的整数',
    summary: 'int 占 4 字节，范围约 ±21 亿。超出这个范围会溢出，而且不会报错。',
    points: [
      'int 占 4 字节（32 位），范围 −2147483648 ~ 2147483647',
      '约 21 亿这个上限要记牢：两个 10 万的数相乘就已经超了',
      '溢出是**静默**的：结果会绕回来变成负数，不报错、不崩溃，最难查',
      '不确定范围够不够时，直接用 long long 更安全',
      'sizeof(int) 可以查看当前平台下占多少字节',
    ],
    code: `#include <iostream>
#include <climits>
using namespace std;

int main() {
    int a = 42;
    cout << "int 值: " << a << endl;

    // int 的精确范围（来自 <climits>）
    cout << "int 最大值: " << INT_MAX << endl;
    cout << "int 最小值: " << INT_MIN << endl;
    cout << "int 占 " << sizeof(int) << " 字节" << endl;
    cout << endl;

    // 溢出的演示（重点！）
    int big = 2000000000;      // 20 亿，接近上限
    cout << "20 亿 + 20 亿 = " << big + big << "  <- 溢出了，变成负数" << endl;

    // 两个 10 万相乘，看起来不大，其实已经超了
    int x = 100000, y = 100000;
    cout << "100000 * 100000 (int) = " << x * y << endl;
    cout << "用 long long 算: " << (long long)x * y << "  <- 正确" << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-longlong',
    group: 'C++ 基础入门',
    title: 'long long —— 竞赛必备的大整数',
    summary: '占 8 字节，范围约 ±9.2×10¹⁸。竞赛里「拿不准就用它」。',
    points: [
      'long long 占 8 字节（64 位），范围约 ±9.2 × 10¹⁸',
      '字面量后缀 LL 表示这是 long long：123456789012345LL',
      '**关键陷阱**：两个 int 相乘，即使结果赋给 long long 也会先溢出',
      '正确写法是先转类型：(long long)a * b',
      '输出用 cout 直接输出即可，不需要 %lld（那是 C 的 printf 才要的）',
    ],
    code: `#include <iostream>
#include <climits>
using namespace std;

int main() {
    long long big = 123456789012345LL;
    cout << "long long 值: " << big << endl;
    cout << "long long 最大值: " << LLONG_MAX << endl;
    cout << "占 " << sizeof(long long) << " 字节" << endl;
    cout << endl;

    // 陷阱：两个 int 相乘
    int a = 100000, b = 100000;
    long long wrong = a * b;                  // 先按 int 算，已经溢出
    long long right = (long long)a * b;       // 先转成 long long 再乘
    cout << "a * b 直接赋给 long long: " << wrong << "  <- 错的！" << endl;
    cout << "(long long)a * b:          " << right << "  <- 对的" << endl;
    cout << endl;

    // 大数运算没问题
    long long n = 1000000;
    cout << "1000000 的平方: " << n * n << endl;
    cout << "1 到 1000000 的和: " << n * (n + 1) / 2 << endl;

    return 0;
}`,
  },

  // ==================== 浮点类型 ====================
  {
    id: 'cpp-float',
    group: 'C++ 基础入门',
    title: 'float —— 单精度小数',
    summary: '占 4 字节，只有约 7 位有效数字。竞赛里一般用 double，很少用 float。',
    points: [
      'float 占 4 字节（32 位），约 7 位有效数字',
      '字面量后缀 f 表示 float：3.14f（不加 f 默认是 double）',
      '精度有限：float 存不下 123456789 这样的九位数，末尾会失真',
      '算法竞赛里**基本都用 double**，因为 float 精度不够容易 WA',
      'float 的意义：省内存（大量数据时）和某些图形计算',
      '比较浮点数不要用 ==，要用「差值小于一个很小的数」',
    ],
    code: `#include <iostream>
#include <iomanip>
#include <cfloat>
using namespace std;

int main() {
    float f = 3.14159f;              // 加 f 后缀
    float noSuffix = 3.14159;        // 不加 f 会先按 double 存再转 float
    cout << "float: " << f << endl;
    cout << "占 " << sizeof(float) << " 字节" << endl;
    cout << endl;

    // 精度对比：float vs double
    float  fv = 123456789.0f;
    double dv = 123456789.0;
    cout << fixed << setprecision(2);
    cout << "float  存 123456789 = " << fv << "  <- 末尾失真了" << endl;
    cout << "double 存 123456789 = " << dv << "  <- 准确" << endl;
    cout << endl;

    // 有效数字位数
    cout << "float  有效位数约 " << FLT_DIG << " 位" << endl;
    cout << "double 有效位数约 " << DBL_DIG << " 位" << endl;
    cout << endl;

    // 浮点数不能直接用 == 比较
    float sum = 0.1f + 0.2f;
    cout << defaultfloat;
    cout << "0.1f + 0.2f == 0.3f ? " << (sum == 0.3f ? "相等" : "不相等！") << endl;
    cout << "实际值是 " << setprecision(10) << sum << endl;
    cout << "正确做法: 判断差值是否小于 1e-6 -> "
         << (abs(sum - 0.3f) < 1e-6f ? "认为相等" : "不相等") << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-double',
    group: 'C++ 基础入门',
    title: 'double —— 默认的小数类型',
    summary: '占 8 字节，约 15-16 位有效数字。竞赛里说到「小数」基本就是它。',
    points: [
      'double 占 8 字节（64 位），约 15~16 位有效数字',
      '不加后缀的小数字面量默认就是 double：3.14',
      '整数除法想得到小数，至少一边要转成 double：(double)a / b',
      '输出格式用 <iomanip> 控制：fixed + setprecision(n)',
      '**科学计数法陷阱**：1e9 是 double，1e18 已经超出精确表示范围',
      '精度损失累积：大量浮点累加会有误差，必要时代数化简避免',
    ],
    code: `#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;

int main() {
    double pi = 3.14159265358979;
    cout << "默认输出: " << pi << "  (6 位有效数字)" << endl;
    cout << "占 " << sizeof(double) << " 字节" << endl;
    cout << endl;

    // 控制输出格式
    cout << fixed << setprecision(2) << "保留 2 位: " << pi << endl;
    cout << fixed << setprecision(6) << "保留 6 位: " << pi << endl;
    cout << fixed << setprecision(10) << "保留 10 位: " << pi << endl;
    cout << defaultfloat;
    cout << endl;

    // 整数除法 vs 浮点除法
    int a = 7, b = 2;
    cout << "7 / 2 (整数除法)     = " << a / b << endl;
    cout << "7 / 2 (转 double)    = " << (double)a / b << endl;
    cout << "7.0 / 2 (字面量)     = " << 7.0 / 2 << endl;
    cout << endl;

    // 常用数学函数
    cout << "sqrt(2)  = " << sqrt(2.0) << endl;
    cout << "pow(2,10)= " << pow(2.0, 10) << endl;
    cout << "floor(-3.5) = " << floor(-3.5) << ", ceil(-3.5) = " << ceil(-3.5) << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-char-bool',
    group: 'C++ 基础入门',
    title: 'char 与 bool',
    summary: 'char 存单个字符（本质是 1 字节整数），bool 存真假（本质是 0/1）。',
    points: [
      'char 占 1 字节，用**单引号**：\'A\'（双引号是字符串，类型不同）',
      'char 本质是小整数，可以参与运算：\'a\' + 1 得到 \'b\'',
      'ASCII 要记住三个锚点：\'0\'=48、\'A\'=65、\'a\'=97',
      '把数字字符转成数值：ch - \'0\'（这是个极常用的技巧）',
      'bool 占 1 字节，true 输出为 1，false 输出为 0',
      '任何非 0 值转 bool 都是 true，0 是 false',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    // char：单引号
    char grade = 'A';
    cout << "char: " << grade << ", 占 " << sizeof(char) << " 字节" << endl;
    cout << "它的 ASCII 码是 " << (int)grade << endl;
    cout << endl;

    // char 参与运算
    char c = 'a';
    cout << "'a' + 1 = " << (char)(c + 1) << endl;
    cout << "'A' 到 'Z' 的编码: " << (int)'A' << " ~ " << (int)'Z' << endl;
    cout << "'a' 到 'z' 的编码: " << (int)'a' << " ~ " << (int)'z' << endl;
    cout << "'0' 的编码: " << (int)'0' << endl;
    cout << endl;

    // 极常用技巧：字符数字转数值
    char digit = '7';
    int value = digit - '0';
    cout << "'7' 转成数值: " << value << "（'7' - '0'）" << endl;
    cout << "反过来，数值转字符: " << (char)(7 + '0') << endl;
    cout << endl;

    // 大小写转换（手写，不用库函数）
    char lower = 'g';
    char upper = lower - 'a' + 'A';
    cout << "小写 " << lower << " 转大写: " << upper << endl;
    cout << endl;

    // bool
    bool yes = true, no = false;
    cout << "bool true 输出: " << yes << ", false 输出: " << no << endl;
    cout << "占 " << sizeof(bool) << " 字节" << endl;
    cout << "非 0 转 bool: " << (bool)42 << ", 0 转 bool: " << (bool)0 << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-type-range',
    group: 'C++ 基础入门',
    title: '各类型的范围与选择',
    summary: '一张表记住什么时候用哪个类型。选错 = 静默溢出 = 最难查的 bug。',
    points: [
      'char 1 字节、int 4 字节、long long 8 字节、float 4 字节、double 8 字节',
      'int 上限约 2.1×10⁹（21 亿）；long long 上限约 9.2×10¹⁸',
      '**估算准则**：先估最大可能值，再选类型，别等 WA 了才改',
      '题目里 n ≤ 10⁵ 时，n² = 10¹⁰ 已经超 int，必须 long long',
      '无符号 unsigned 能多一倍正数范围，但减法下溢更危险，竞赛里尽量不用',
      '用 <climits> / <cfloat> 里的常量查看精确边界',
    ],
    code: `#include <iostream>
#include <climits>
#include <cfloat>
using namespace std;

int main() {
    cout << "类型          字节    近似范围" << endl;
    cout << "-----------------------------------------" << endl;
    cout << "char          " << sizeof(char) << "       " << CHAR_MIN << " ~ " << CHAR_MAX << endl;
    cout << "short         " << sizeof(short) << "       " << SHRT_MIN << " ~ " << SHRT_MAX << endl;
    cout << "int           " << sizeof(int) << "       " << INT_MIN << " ~ " << INT_MAX << endl;
    cout << "unsigned int  " << sizeof(unsigned int) << "       0 ~ " << UINT_MAX << endl;
    cout << "long long     " << sizeof(long long) << "       " << LLONG_MIN << " ~ " << LLONG_MAX << endl;
    cout << endl;

    cout << "浮点类型有效位数: float " << FLT_DIG << " 位, double " << DBL_DIG << " 位" << endl;
    cout << endl;

    // 选型演示
    int n = 100000;                      // n <= 1e5 是常见约束
    int wrong = n * n;                   // 1e10，超 int 了
    long long right = (long long)n * n;
    cout << "n = " << n << endl;
    cout << "n * n 用 int 算:       " << wrong << "  <- 溢出" << endl;
    cout << "n * n 用 long long 算: " << right << "  <- 正确" << endl;
    cout << "这就是为什么看到 n<=1e5 就要想到 long long" << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-overflow',
    group: 'C++ 基础入门',
    title: '整数溢出：最隐蔽的错误',
    summary: '溢出不会报错，只会给你一个错误的数字。这是竞赛里最常见的 WA 原因之一。',
    points: [
      '溢出是**未定义行为**：可能变负数、可能变随机值，但绝不会报错',
      '典型场景：累加、乘法、阶乘、斐波那契（增长极快）',
      '20 的阶乘已经超出 long long（2432902008176640000 是 20! 附近）',
      '**排查方法**：把可疑变量临时改成 long long 试试，如果对了就是溢出',
      '预防胜于治疗：算之前先转类型，(long long)a * b',
      '题目要求「对 1e9+7 取模」时，中间结果也要用 long long 存',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    // 1) 累加溢出
    int sum = 0;
    for (int i = 1; i <= 100000; i++) sum += i;
    cout << "1..100000 用 int 累加:   " << sum << "  <- 溢出成负数" << endl;

    long long sumLL = 0;
    for (int i = 1; i <= 100000; i++) sumLL += i;
    cout << "1..100000 用 long long:  " << sumLL << "  <- 正确" << endl;
    cout << endl;

    // 2) 阶乘增长极快
    long long fact = 1;
    for (int i = 1; i <= 20; i++) {
        fact *= i;
        cout << i << "! = " << fact << endl;
    }
    cout << "(21! 会超出 long long 范围)" << endl;
    cout << endl;

    // 3) 取模运算的正确姿势
    const long long MOD = 1000000007LL;
    long long a = 1000000000LL, b = 1000000000LL;
    long long wrongMod = a * b % MOD;              // 1e18 还在范围内，侥幸对
    cout << "1e9 * 1e9 直接算: " << a * b << "  (long long 装得下)" << endl;
    cout << "对 1e9+7 取模: " << wrongMod << endl;

    return 0;
}`,
  },

  // ==================== 运算符细化 ====================
  {
    id: 'cpp-arithmetic-detail',
    group: 'C++ 基础入门',
    title: '算术运算符与整数除法',
    summary: '+ - * / % 五个运算符，其中整除和取余最容易出错。',
    points: [
      '两个整数相除是**整数除法**，直接丢掉小数：7/2 = 3（不是四舍五入）',
      '负数整除是**向零取整**：-7/2 = -3（不是 -4）',
      '取余 % 的符号跟随被除数：-7 % 2 = -1',
      '想得到小数结果，至少一边转 double：(double)a / b',
      '「向上取整的除法」(a+b-1)/b 是个常用技巧',
      '自增 ++i 比 i++ 略快（前缀不需要返回旧值），竞赛里习惯写 ++i',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    int a = 7, b = 2;
    cout << "a = " << a << ", b = " << b << endl;
    cout << "a + b = " << a + b << endl;
    cout << "a - b = " << a - b << endl;
    cout << "a * b = " << a * b << endl;
    cout << "a / b = " << a / b << "   <- 整数除法，丢掉小数" << endl;
    cout << "a % b = " << a % b << "   <- 余数" << endl;
    cout << endl;

    // 负数的情况（容易搞错）
    cout << "-7 / 2  = " << -7 / 2 << "   <- 向零取整，不是 -4" << endl;
    cout << "-7 % 2  = " << -7 % 2 << "   <- 符号跟随被除数" << endl;
    cout << "7 % -2  = " << 7 % -2 << endl;
    cout << endl;

    // 想要小数
    cout << "7 / 2 转 double = " << (double)a / b << endl;
    cout << endl;

    // 向上取整的除法技巧：至少需要多少个「容量为 b 的盒子」
    int total = 17, cap = 5;
    cout << total << " 个物品装进容量 " << cap << " 的盒子，需要 ";
    cout << (total + cap - 1) / cap << " 个（向上取整）" << endl;
    cout << "对比普通除法: " << total / cap << " 个（少了，装不下）" << endl;
    cout << endl;

    // 自增的两种写法
    int i = 0;
    int x = ++i;   // 先加，再赋值
    int j = 0;
    int y = j++;   // 先赋值，再加
    cout << "++i 后 i=" << i << ", x=" << x << endl;
    cout << "j++ 后 j=" << j << ", y=" << y << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-compare-logic',
    group: 'C++ 基础入门',
    title: '比较与逻辑运算符',
    summary: '== != < > <= >= 和 && || !，注意 = 和 == 写混是经典错误。',
    points: [
      '比较运算符返回 bool；C++ 里 true 就是 1，false 就是 0',
      '**= 是赋值，== 是判断相等** —— 写混了编译器通常不报错（这是最经典的坑）',
      '&& 与、|| 或、! 非；&& 优先级高于 ||',
      '**短路求值**：a && b 中若 a 为假，b 根本不会算',
      '短路很有用：i < n && a[i] > 0 可以防越界',
      '比较浮点数不要用 ==（精度问题），要用差值判断',
    ],
    code: `#include <iostream>
#include <cmath>
using namespace std;

int main() {
    int a = 5, b = 3;

    cout << "a == b : " << (a == b) << endl;
    cout << "a != b : " << (a != b) << endl;
    cout << "a >  b : " << (a > b) << endl;
    cout << "a <= b : " << (a <= b) << endl;
    cout << endl;

    // 逻辑运算符
    cout << "a>0 && b>0 : " << (a > 0 && b > 0) << endl;
    cout << "a>10 || b>0 : " << (a > 10 || b > 0) << endl;
    cout << "!true       : " << (!true) << endl;
    cout << endl;

    // 短路求值的实用场景：防止数组越界
    int arr[3] = {10, 20, 30};
    int idx = 5;
    // 先判断下标合法，再访问 —— 顺序不能反
    bool safe = (idx < 3) && (arr[idx] > 0);
    cout << "下标 " << idx << " 越界了吗？" << (safe ? "没越界" : "越界（已短路，没真的访问）") << endl;
    cout << endl;

    // 浮点数比较
    double x = 0.1 + 0.2;
    cout << "0.1 + 0.2 == 0.3 ? " << (x == 0.3 ? "相等" : "不相等！") << endl;
    cout << "正确做法: fabs(x - 0.3) < 1e-9 -> "
         << (fabs(x - 0.3) < 1e-9 ? "视为相等" : "不相等") << endl;
    cout << endl;

    // 赋值 vs 判断（演示，不要真这么写）
    int c = 0;
    if ((c = 5)) {          // 这里是把 5 赋给 c，然后判断 5 非零为真
        cout << "((c = 5)) 会进入分支，因为赋值表达式返回 5（非 0 为真）" << endl;
    }
    cout << "这就是为什么建议写 if (5 == c) —— 写错成 = 编译器会报错" << endl;

    return 0;
}`,
  },

  {
    id: 'cpp-operator-priority',
    group: 'C++ 基础入门',
    title: '运算符优先级',
    summary: '先乘除后加减，逻辑运算优先级低于比较。搞不清就加括号。',
    points: [
      '从高到低：括号 > 单目(! ++ --) > 乘除取余 > 加减 > 比较 > 相等 > && > || > 赋值',
      '**&& 优先级高于 ||**，所以 a || b && c 是 a || (b && c)',
      '赋值优先级最低，所以 x = y = 0 从右往左执行',
      '位运算优先级**很奇怪**，几乎总需要加括号：a & b == c 其实是 a & (b == c)',
      '记不住就加括号 —— 括号不要钱，读错代码要命',
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "2 + 3 * 4     = " << 2 + 3 * 4 << "   (不是 20)" << endl;
    cout << "(2 + 3) * 4   = " << (2 + 3) * 4 << endl;
    cout << endl;

    // 比较优先于逻辑
    cout << "1 < 2 && 3 < 4 = " << (1 < 2 && 3 < 4) << endl;
    cout << endl;

    // && 优先于 ||
    bool a = true, b = false, c = false;
    cout << "a || b && c   = " << (a || b && c) << "   (= a || (b && c))" << endl;
    cout << "(a || b) && c = " << ((a || b) && c) << "   (加了括号结果就不同)" << endl;
    cout << endl;

    // 位运算的坑
    int x = 1, y = 1;
    cout << "x & y == 0    = " << (x & y == 0) << "   <- 实际是 x & (y==0)" << endl;
    cout << "(x & y) == 0  = " << ((x & y) == 0) << "   <- 这才是本意" << endl;
    cout << "位运算优先级低于 ==，必须加括号" << endl;
    cout << endl;

    // 赋值从右往左
    int p, q;
    p = q = 99;
    cout << "p = q = 99 之后: p=" << p << ", q=" << q << endl;
    cout << "因为赋值返回被赋的值，所以可以连锁赋值" << endl;

    return 0;
}`,
  },

  // ==================== 类型转换细化 ====================
  {
    id: 'cpp-cast',
    group: 'C++ 基础入门',
    title: '类型转换',
    summary: '隐式转换悄悄发生，显式转换（强制类型转换）才是可控的。',
    points: [
      '隐式转换：小范围 → 大范围是安全的（int → long long）',
      '大范围 → 小范围会**截断**，值可能完全变样（long long → int）',
      '浮点转整数是**截断而非四舍五入**：(int)3.9 得到 3，(int)-3.9 得到 -3',
      '想四舍五入要加 0.5 或用 round()：(int)(x + 0.5)',
      'C 风格转换 (int)x 和 C++ 风格 static_cast<int>(x) 都可用',
      '整数除法要转小数，写 (double)a / b 而不是 (double)(a / b) —— 后者已经先整除了',
    ],
    code: `#include <iostream>
#include <cmath>
using namespace std;

int main() {
    // 隐式转换：安全的
    int i = 42;
    long long ll = i;              // int -> long long，安全
    double d = i;                  // int -> double，安全
    cout << "int " << i << " -> long long " << ll << " -> double " << d << endl;
    cout << endl;

    // 隐式转换：危险的（截断）
    long long big = 1234567890123LL;
    int truncated = big;           // 截断！值会变
    cout << "long long " << big << " 转成 int: " << truncated << "  <- 完全变了" << endl;
    cout << endl;

    // 浮点转整数：截断而非四舍五入
    double v1 = 3.9, v2 = -3.9;
    cout << "(int)3.9  = " << (int)v1 << "   <- 截断，不是 4" << endl;
    cout << "(int)-3.9 = " << (int)v2 << "   <- 向零截断，不是 -4" << endl;
    cout << "想四舍五入: (int)(3.9 + 0.5) = " << (int)(v1 + 0.5) << endl;
    cout << "或 round(3.9) = " << (int)round(v1) << endl;
    cout << endl;

    // 最经典的错误：除法转小数
    int a = 7, b = 2;
    cout << "(double)(a / b)  = " << (double)(a / b) << "   <- 先整除再转，没用" << endl;
    cout << "(double)a / b    = " << (double)a / b << "   <- 正确" << endl;
    cout << endl;

    // C++ 风格转换
    double pi = 3.14159;
    int ipi = static_cast<int>(pi);
    cout << "static_cast<int>(3.14159) = " << ipi << endl;

    return 0;
}`,
  },
];
