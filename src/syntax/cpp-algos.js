/**
 * 每个算法的 C++ 实现代码。
 *
 * 定位：算法可视化层必须用 JS（浏览器里跑动画不可能用 C++），
 * 所以这里给每个算法**配一份对应的 C++ 实现**，
 * 让学习者能对照「动画怎么跑」和「C++ 怎么写」。
 *
 * 这些片段都是**完整可编译**的程序（带 main 和测试数据），
 * 由 tests/build-cpp.js 在构建期真实编译运行，输出存进 cpp-output.json。
 *
 * 写法贴近竞赛风格：using namespace std、long long、快读等。
 */

export const CPP_ALGO_SNIPPETS = [
  // ---------- 排序 ----------
  {
    id: 'algo-bubble',
    title: '冒泡排序',
    code: `#include <iostream>
#include <vector>
using namespace std;

void bubbleSort(vector<int> &a) {
    int n = a.size();
    for (int end = n - 1; end > 0; end--) {
        bool swapped = false;
        for (int i = 0; i < end; i++) {
            if (a[i] > a[i + 1]) {
                swap(a[i], a[i + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;   // 本轮没交换 → 已经有序，提前结束
    }
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8, 0, 2};
    bubbleSort(a);
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  {
    id: 'algo-selection',
    title: '选择排序',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

void selectionSort(vector<int> &a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (a[j] < a[minIdx]) minIdx = j;   // 打擂台找最小
        }
        if (minIdx != i) swap(a[i], a[minIdx]);
    }
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8, 0, 2};
    selectionSort(a);
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  {
    id: 'algo-insertion',
    title: '插入排序',
    code: `#include <iostream>
#include <vector>
using namespace std;

void insertionSort(vector<int> &a) {
    int n = a.size();
    for (int i = 1; i < n; i++) {
        int cur = a[i];
        int j = i - 1;
        // 比 cur 大的都往右挪，给 cur 腾位置
        while (j >= 0 && a[j] > cur) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = cur;
    }
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8, 0, 2};
    insertionSort(a);
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  {
    id: 'algo-shell',
    title: '希尔排序',
    code: `#include <iostream>
#include <vector>
using namespace std;

void shellSort(vector<int> &a) {
    int n = a.size();
    // Knuth 增量序列：1, 4, 13, 40, ...
    int gap = 1;
    while (gap < n / 3) gap = gap * 3 + 1;

    for (; gap >= 1; gap /= 3) {
        for (int i = gap; i < n; i++) {
            int cur = a[i];
            int j = i - gap;
            while (j >= 0 && a[j] > cur) {
                a[j + gap] = a[j];
                j -= gap;
            }
            a[j + gap] = cur;
        }
    }
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8, 0, 2};
    shellSort(a);
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  {
    id: 'algo-merge',
    title: '归并排序',
    code: `#include <iostream>
#include <vector>
using namespace std;

void mergeSort(vector<int> &a, int lo, int hi, vector<int> &buf) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, lo, mid, buf);
    mergeSort(a, mid + 1, hi, buf);

    // 合并两段到缓冲区
    for (int k = lo; k <= hi; k++) buf[k] = a[k];
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid)                     a[k] = buf[j++];
        else if (j > hi)                 a[k] = buf[i++];
        else if (buf[i] <= buf[j])       a[k] = buf[i++];   // <= 保证稳定
        else                             a[k] = buf[j++];
    }
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8, 0, 2};
    vector<int> buf(a.size());
    mergeSort(a, 0, a.size() - 1, buf);
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  {
    id: 'algo-quick',
    title: '快速排序',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// Lomuto 分区
int partition(vector<int> &a, int lo, int hi) {
    int pivot = a[hi];
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {
            swap(a[i], a[j]);
            i++;
        }
    }
    swap(a[i], a[hi]);   // 基准归位
    return i;
}

void quickSort(vector<int> &a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partition(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8, 0, 2};
    quickSort(a, 0, a.size() - 1);
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  {
    id: 'algo-heap',
    title: '堆排序',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// 大顶堆下沉
void siftDown(vector<int> &a, int root, int end) {
    while (true) {
        int left = 2 * root + 1;
        if (left > end) break;
        int larger = left;
        int right = left + 1;
        if (right <= end && a[right] > a[left]) larger = right;
        if (a[root] >= a[larger]) break;   // 已满足堆序
        swap(a[root], a[larger]);
        root = larger;
    }
}

void heapSort(vector<int> &a) {
    int n = a.size();
    // 建堆：从最后一个非叶子节点开始
    for (int i = n / 2 - 1; i >= 0; i--) siftDown(a, i, n - 1);
    // 依次把堆顶换到末尾
    for (int end = n - 1; end > 0; end--) {
        swap(a[0], a[end]);
        siftDown(a, 0, end - 1);
    }
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8, 0, 2};
    heapSort(a);
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  // ---------- 非比较排序 ----------
  {
    id: 'algo-counting',
    title: '计数排序',
    code: `#include <iostream>
#include <vector>
using namespace std;

// 值域不能太大，否则计数数组会爆内存
vector<int> countingSort(const vector<int> &a) {
    if (a.empty()) return {};
    int mn = a[0], mx = a[0];
    for (int x : a) { mn = min(mn, x); mx = max(mx, x); }

    int range = mx - mn + 1;
    vector<int> cnt(range, 0);
    for (int x : a) cnt[x - mn]++;      // 偏移到 0 开始

    vector<int> res;
    res.reserve(a.size());
    for (int v = 0; v < range; v++) {
        for (int k = 0; k < cnt[v]; k++) res.push_back(v + mn);
    }
    return res;
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8, 0, 2};
    vector<int> r = countingSort(a);
    for (int x : r) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  {
    id: 'algo-radix',
    title: '基数排序',
    code: `#include <iostream>
#include <vector>
using namespace std;

void radixSort(vector<int> &a) {
    if (a.empty()) return;
    int mx = a[0];
    for (int x : a) mx = max(mx, x);

    // 从低位到高位，每一位做一次稳定的桶分配
    for (int place = 1; mx / place > 0; place *= 10) {
        vector<vector<int>> buckets(10);
        for (int x : a) buckets[(x / place) % 10].push_back(x);

        int idx = 0;
        for (int d = 0; d < 10; d++) {
            for (int x : buckets[d]) a[idx++] = x;
        }
    }
}

int main() {
    vector<int> a = {170, 45, 75, 90, 802, 24, 2, 66};
    radixSort(a);
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  {
    id: 'algo-bucket',
    title: '桶排序',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
using namespace std;

void bucketSort(vector<int> &a) {
    if (a.empty()) return;
    int mn = a[0], mx = a[0];
    for (int x : a) { mn = min(mn, x); mx = max(mx, x); }
    if (mn == mx) return;

    int n = a.size();
    int bucketCount = max(1, (int)sqrt((double)n));
    double span = (double)(mx - mn + 1) / bucketCount;

    vector<vector<int>> buckets(bucketCount);
    for (int x : a) {
        int bi = (int)((x - mn) / span);
        if (bi >= bucketCount) bi = bucketCount - 1;   // 边界值归入最后一桶
        buckets[bi].push_back(x);
    }

    int idx = 0;
    for (auto &b : buckets) {
        sort(b.begin(), b.end());        // 桶内各自排序
        for (int x : b) a[idx++] = x;
    }
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8, 0, 2};
    bucketSort(a);
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  // ---------- 查找 ----------
  {
    id: 'algo-binary-search',
    title: '二分查找',
    code: `#include <iostream>
#include <vector>
#include <cmath>
using namespace std;

// 有序数组中查找 target，返回下标，找不到返回 -1
int binarySearch(const vector<int> &a, int target, int &steps) {
    int lo = 0, hi = (int)a.size() - 1;
    steps = 0;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;   // 这么写不会溢出
        steps++;
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> a = {1, 3, 5, 7, 9, 11, 13, 15, 17};
    int steps;

    int idx = binarySearch(a, 13, steps);
    cout << "找 13: 下标 " << idx << ", 用了 " << steps << " 次比较" << endl;

    idx = binarySearch(a, 4, steps);
    cout << "找 4:  " << (idx == -1 ? "不存在" : "找到了") << ", 用了 " << steps << " 次比较" << endl;

    cout << "数组长度 " << a.size() << "，最多需要 " << (int)ceil(log2((double)a.size() + 1)) << " 次" << endl;

    return 0;
}`,
  },

  {
    id: 'algo-binary-answer',
    title: '二分答案',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// 把 n 根绳子切成等长的 k 段，求每段最大长度
bool feasible(const vector<int> &ropes, int len, int k) {
    if (len <= 0) return false;
    int cnt = 0;
    for (int r : ropes) cnt += r / len;
    return cnt >= k;
}

int main() {
    vector<int> ropes = {802, 743, 457, 539};
    int k = 11;

    int lo = 1, hi = *max_element(ropes.begin(), ropes.end());
    int best = 0;
    int steps = 0;

    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        steps++;
        if (feasible(ropes, mid, k)) {
            best = mid;        // 可行，记录并尝试更长
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    cout << "绳子: ";
    for (int r : ropes) cout << r << " ";
    cout << endl;
    cout << "切成 " << k << " 段，每段最长 = " << best << "（二分了 " << steps << " 次）" << endl;

    return 0;
}`,
  },

  // ---------- 路径查找 ----------
  {
    id: 'algo-bfs',
    title: '广度优先搜索 BFS',
    code: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int main() {
    // 6 个点的无权图（邻接表）
    int n = 6;
    vector<vector<int>> g(n);
    auto addEdge = [&](int u, int v) { g[u].push_back(v); g[v].push_back(u); };

    addEdge(0, 1); addEdge(0, 2);
    addEdge(1, 3); addEdge(2, 3);
    addEdge(3, 4); addEdge(4, 5);

    // BFS：从 0 出发求到各点的最短距离
    vector<int> dist(n, -1);
    queue<int> q;

    dist[0] = 0;
    q.push(0);

    cout << "BFS 访问顺序: ";
    while (!q.empty()) {
        int u = q.front(); q.pop();
        cout << u << " ";
        for (int v : g[u]) {
            if (dist[v] == -1) {          // 没访问过
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    cout << endl;

    for (int i = 0; i < n; i++) {
        cout << "0 到 " << i << " 的最短距离: " << dist[i] << endl;
    }

    return 0;
}`,
  },

  {
    id: 'algo-dfs',
    title: '深度优先搜索 DFS',
    code: `#include <iostream>
#include <vector>
using namespace std;

vector<vector<int>> g;
vector<bool> visited;
vector<int> order;

void dfs(int u) {
    visited[u] = true;
    order.push_back(u);
    for (int v : g[u]) {
        if (!visited[v]) dfs(v);      // 一路走到底
    }
}

int main() {
    int n = 6;
    g.assign(n, {});
    auto addEdge = [&](int u, int v) { g[u].push_back(v); g[v].push_back(u); };

    addEdge(0, 1); addEdge(0, 2);
    addEdge(1, 3); addEdge(2, 3);
    addEdge(3, 4); addEdge(4, 5);

    visited.assign(n, false);
    dfs(0);

    cout << "DFS 访问顺序: ";
    for (int u : order) cout << u << " ";
    cout << endl;

    // 对比：同一张图，BFS 会一层层扩散，DFS 会一条路走到底
    cout << "（同一张图上 BFS 的顺序会不同 —— 这就是队列与栈的差别）" << endl;

    return 0;
}`,
  },

  // ---------- 基础技巧 ----------
  {
    id: 'algo-two-pointers',
    title: '双指针 · 两数之和',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> a = {2, 7, 11, 15, 3, 6};
    sort(a.begin(), a.end());
    int target = 9;

    int l = 0, r = (int)a.size() - 1;
    int steps = 0;
    bool found = false;

    while (l < r) {
        steps++;
        int sum = a[l] + a[r];
        if (sum == target) { found = true; break; }
        if (sum < target) l++;      // 和太小 → 左指针右移
        else r--;                   // 和太大 → 右指针左移
    }

    cout << "数组: ";
    for (int x : a) cout << x << " ";
    cout << endl;

    if (found) cout << "找到 " << a[l] << " + " << a[r] << " = " << target;
    else cout << "没有两数之和等于 " << target;
    cout << "（用了 " << steps << " 步，O(n)）" << endl;

    return 0;
}`,
  },

  {
    id: 'algo-sliding-window',
    title: '滑动窗口',
    code: `#include <iostream>
#include <vector>
#include <map>
#include <algorithm>
using namespace std;

int main() {
    vector<int> a = {1, 2, 3, 2, 4, 1, 5};

    // 最长无重复元素的连续区间
    map<int, int> lastSeen;   // 值 -> 最后出现的下标
    int left = 0, best = 0, bestL = 0, bestR = 0;

    for (int right = 0; right < (int)a.size(); right++) {
        int v = a[right];
        if (lastSeen.count(v) && lastSeen[v] >= left) {
            left = lastSeen[v] + 1;    // 收缩左边界，跳过重复
        }
        lastSeen[v] = right;

        int len = right - left + 1;
        if (len > best) {
            best = len;
            bestL = left;
            bestR = right;
        }
    }

    cout << "数组: ";
    for (int x : a) cout << x << " ";
    cout << endl;
    cout << "最长无重复区间: [" << bestL << ", " << bestR << "]，长度 " << best << endl;
    cout << "区间内容: ";
    for (int i = bestL; i <= bestR; i++) cout << a[i] << " ";
    cout << endl;

    return 0;
}`,
  },

  {
    id: 'algo-prefix-sum',
    title: '前缀和',
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> a = {3, 1, 4, 1, 5, 9, 2, 6};
    int n = a.size();

    // 构建前缀和：pre[i] = 前 i 个元素之和
    vector<long long> pre(n + 1, 0);
    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];

    cout << "数组: ";
    for (int x : a) cout << x << " ";
    cout << endl;
    cout << "前缀和: ";
    for (int i = 0; i <= n; i++) cout << pre[i] << " ";
    cout << endl;
    cout << endl;

    // 区间查询：O(1)
    auto rangeSum = [&](int l, int r) { return pre[r + 1] - pre[l]; };

    cout << "[0,3] 的和 = " << rangeSum(0, 3) << "（朴素做法要累加 4 次）" << endl;
    cout << "[2,6] 的和 = " << rangeSum(2, 6) << "（朴素做法要累加 5 次）" << endl;
    cout << "[0,7] 的和 = " << rangeSum(0, 7) << "（整段）" << endl;

    cout << endl << "预处理 O(n)，之后每次查询 O(1)" << endl;

    return 0;
}`,
  },

  {
    id: 'algo-difference-array',
    title: '差分数组',
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> a = {3, 1, 4, 1, 5, 9, 2, 6};
    int n = a.size();

    // 构建差分数组
    vector<int> diff(n + 1, 0);
    diff[0] = a[0];
    for (int i = 1; i < n; i++) diff[i] = a[i] - a[i - 1];

    cout << "原数组: ";
    for (int x : a) cout << x << " ";
    cout << endl;

    // 区间修改：给 [l, r] 每个数加 v，只需两处标记
    auto rangeAdd = [&](int l, int r, int v) {
        diff[l] += v;
        if (r + 1 <= n) diff[r + 1] -= v;
    };

    rangeAdd(1, 3, 10);
    cout << "给 [1,3] 每个数加 10（只改了两处）" << endl;

    rangeAdd(4, 6, -5);
    cout << "给 [4,6] 每个数加 -5（只改了两处）" << endl;

    // 一次前缀和还原
    vector<int> res(n);
    int running = 0;
    for (int i = 0; i < n; i++) {
        running += diff[i];
        res[i] = running;
    }

    cout << "还原结果: ";
    for (int x : res) cout << x << " ";
    cout << endl;

    // 用朴素做法验证
    vector<int> naive = a;
    for (int i = 1; i <= 3; i++) naive[i] += 10;
    for (int i = 4; i <= 6; i++) naive[i] += -5;

    cout << "朴素修改: ";
    for (int x : naive) cout << x << " ";
    cout << endl;

    cout << (naive == res ? "两者一致 ✓" : "出现偏差 ✗") << endl;

    return 0;
}`,
  },

  {
    id: 'algo-bitwise',
    title: '位运算',
    code: `#include <iostream>
#include <bitset>
using namespace std;

int main() {
    int a = 0b11001100;   // 204
    int b = 0b10101010;   // 170

    cout << "a = " << a << " = " << bitset<8>(a) << endl;
    cout << "b = " << b << " = " << bitset<8>(b) << endl;
    cout << endl;

    cout << "a & b  = " << bitset<8>(a & b) << " = " << (a & b) << endl;
    cout << "a | b  = " << bitset<8>(a | b) << " = " << (a | b) << endl;
    cout << "a ^ b  = " << bitset<8>(a ^ b) << " = " << (a ^ b) << endl;
    cout << "~a     = " << bitset<8>(~a) << endl;
    cout << "a << 1 = " << bitset<8>(a << 1) << " = " << (a << 1) << endl;
    cout << "a >> 1 = " << bitset<8>(a >> 1) << " = " << (a >> 1) << endl;

    return 0;
}`,
  },

  // ---------- 字符串 ----------
  {
    id: 'algo-kmp',
    title: 'KMP 字符串匹配',
    code: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

// next[i] = s[0..i] 中最长相等真前后缀的长度
vector<int> buildNext(const string &p) {
    int m = p.size();
    vector<int> nxt(m, 0);
    int k = 0;
    for (int i = 1; i < m; i++) {
        while (k > 0 && p[i] != p[k]) k = nxt[k - 1];   // 回退
        if (p[i] == p[k]) k++;
        nxt[i] = k;
    }
    return nxt;
}

int main() {
    string text = "ABABABCABABABCABAB";
    string pat = "ABABC";

    vector<int> nxt = buildNext(pat);

    cout << "模式串: " << pat << endl;
    cout << "next  : ";
    for (int x : nxt) cout << x << " ";
    cout << endl;

    // 匹配：注意 i 只前进，从不回退
    vector<int> matches;
    int j = 0;
    for (int i = 0; i < (int)text.size(); i++) {
        while (j > 0 && text[i] != pat[j]) j = nxt[j - 1];   // 失配时只退 j
        if (text[i] == pat[j]) j++;
        if (j == (int)pat.size()) {
            matches.push_back(i - pat.size() + 1);
            j = nxt[j - 1];       // 继续找下一个
        }
    }

    cout << "主串  : " << text << endl;
    cout << "匹配位置: ";
    if (matches.empty()) cout << "无";
    for (int pos : matches) cout << pos << " ";
    cout << endl;

    return 0;
}`,
  },

  {
    id: 'algo-rabin-karp',
    title: '字符串哈希',
    code: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

typedef long long ll;
const ll BASE = 131;
const ll MOD = 1000000007;

int main() {
    string text = "ABCABCABDABC";
    string pat = "ABC";
    int n = text.size(), m = pat.size();

    // 预处理幂
    vector<ll> pw(n + 1, 1);
    for (int i = 1; i <= n; i++) pw[i] = pw[i - 1] * BASE % MOD;

    // 前缀哈希
    vector<ll> h(n + 1, 0);
    for (int i = 0; i < n; i++) {
        h[i + 1] = (h[i] * BASE + (text[i] - 'A' + 1)) % MOD;
    }

    // 模式串哈希
    ll patHash = 0;
    for (char c : pat) patHash = (patHash * BASE + (c - 'A' + 1)) % MOD;

    cout << "主串: " << text << endl;
    cout << "模式串: " << pat << endl;
    cout << "模式串哈希: " << patHash << endl;
    cout << endl;

    // 滑动窗口：O(1) 算出每个窗口的哈希
    vector<int> matches;
    int hashHits = 0;
    for (int l = 0; l + m <= n; l++) {
        ll windowHash = ((h[l + m] - h[l] * pw[m]) % MOD + MOD) % MOD;
        if (windowHash == patHash) {
            hashHits++;
            if (text.substr(l, m) == pat) matches.push_back(l);   // 防碰撞：逐字符确认
        }
    }

    cout << "哈希命中 " << hashHits << " 次" << endl;
    cout << "匹配位置: ";
    for (int p : matches) cout << p << " ";
    cout << endl;

    return 0;
}`,
  },

  // ---------- 数据结构 ----------
  {
    id: 'algo-stack',
    title: '栈 · 括号匹配',
    code: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isBalanced(const string &s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            if ((c == ')' && top != '(') ||
                (c == ']' && top != '[') ||
                (c == '}' && top != '{')) return false;
            st.pop();
        }
    }
    return st.empty();   // 全部匹配完，栈应该为空
}

int main() {
    string tests[] = {"({[]})", "([)]", "((()))", "(()", ""};

    for (const string &s : tests) {
        // 用单引号字符避免在模板字符串里转义双引号（踩过这个坑：
        // 写成 \\" 时，生成出来的 .cpp 会变成裸引号，编译虽过但输出错）
        cout << '[' << s << "] -> " << (isBalanced(s) ? "匹配" : "不匹配") << endl;
    }

    return 0;
}`,
  },

  {
    id: 'algo-queue',
    title: '队列 · 任务调度',
    code: `#include <iostream>
#include <queue>
#include <string>
using namespace std;

int main() {
    queue<string> q;

    // 先来几个任务
    q.push("渲染画面");
    q.push("计算坐标");

    int done = 0;
    string newTasks[] = {"播放动画", "清理临时值"};

    cout << "初始队列大小: " << q.size() << endl;

    while (!q.empty()) {
        string task = q.front();
        q.pop();
        done++;
        cout << "处理第 " << done << " 个任务: " << task << endl;

        // 处理过程中可能来新任务（从队尾进）
        if (done <= 2) {
            q.push(newTasks[done - 1]);
            cout << "  -> 新任务入队: " << newTasks[done - 1] << endl;
        }
    }

    cout << "全部处理完，共 " << done << " 个任务" << endl;

    return 0;
}`,
  },
];
