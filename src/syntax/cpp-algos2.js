/**
 * 新增算法（高精度 / 图论 / Trie）的 C++ 实现。
 *
 * 和之前一样：这些片段都是**完整可编译**的程序，
 * 由 tests/build-cpp.js 在构建期真实编译运行，输出存进 cpp-output。
 *
 * 写法贴近竞赛：数组开在全局（自动清零）、用 scanf/cin 快读、
 * 高精度用「低位在前」的数组。
 */

export const CPP_ALGO_SNIPPETS_2 = [
  // ==================== 高精度 ====================
  {
    id: 'algo-bigadd',
    title: '高精度加法',
    code: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

// 低位在前：个位存 a[0]，这样进位方向和下标一致
int main() {
    string sa = "98765432109876543210";
    string sb = "12345678901234567890";

    // 转成数字数组，低位在前
    int a[200] = {0}, b[200] = {0};
    int la = sa.size(), lb = sb.size();
    for (int i = 0; i < la; i++) a[i] = sa[la - 1 - i] - '0';
    for (int i = 0; i < lb; i++) b[i] = sb[lb - 1 - i] - '0';

    // 逐位相加
    int c[201] = {0};
    int len = max(la, lb);
    for (int i = 0; i < len; i++) {
        c[i] += a[i] + b[i];
        c[i + 1] += c[i] / 10;   // 进位
        c[i] %= 10;
    }
    if (c[len] > 0) len++;       // 最高位还有进位

    cout << sa << " + " << sb << " = ";
    for (int i = len - 1; i >= 0; i--) cout << c[i];
    cout << endl;
    cout << "结果共 " << len << " 位" << endl;

    return 0;
}`,
  },

  {
    id: 'algo-bigsub',
    title: '高精度减法',
    code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string sa = "98765432109876543210";
    string sb = "12345678901234567890";

    int a[200] = {0}, b[200] = {0};
    int la = sa.size(), lb = sb.size();
    for (int i = 0; i < la; i++) a[i] = sa[la - 1 - i] - '0';
    for (int i = 0; i < lb; i++) b[i] = sb[lb - 1 - i] - '0';

    int c[200] = {0};
    int len = max(la, lb);
    for (int i = 0; i < len; i++) {
        if (a[i] < b[i]) {        // 不够减，向前借 1
            a[i] += 10;
            a[i + 1]--;
        }
        c[i] = a[i] - b[i];
    }
    // 去掉高位的 0
    while (len > 1 && c[len - 1] == 0) len--;

    cout << sa << " - " << sb << " = ";
    for (int i = len - 1; i >= 0; i--) cout << c[i];
    cout << endl;

    return 0;
}`,
  },

  {
    id: 'algo-bigmul',
    title: '高精度乘法',
    code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string sa = "98765", sb = "43210";

    int a[100] = {0}, b[100] = {0};
    int la = sa.size(), lb = sb.size();
    for (int i = 0; i < la; i++) a[i] = sa[la - 1 - i] - '0';
    for (int i = 0; i < lb; i++) b[i] = sb[lb - 1 - i] - '0';

    // 第 i 位乘第 j 位，结果累加到第 i+j 位
    int c[200] = {0};
    for (int i = 0; i < la; i++) {
        for (int j = 0; j < lb; j++) {
            c[i + j] += a[i] * b[j];
        }
    }
    // 统一处理进位
    for (int i = 0; i < la + lb; i++) {
        c[i + 1] += c[i] / 10;
        c[i] %= 10;
    }

    int len = la + lb;
    while (len > 1 && c[len - 1] == 0) len--;

    cout << sa << " * " << sb << " = ";
    for (int i = len - 1; i >= 0; i--) cout << c[i];
    cout << endl;

    return 0;
}`,
  },

  {
    id: 'algo-bigfactorial',
    title: '高精度阶乘',
    code: `#include <iostream>
using namespace std;

// 阶乘增长极快：20! 就逼近 long long 上限，21! 必定溢出
int main() {
    int n = 25;
    int a[1000] = {0};
    a[0] = 1;
    int len = 1;                  // 当前位数

    cout << "计算 " << n << "!" << endl;
    for (int k = 2; k <= n; k++) {
        int carry = 0;
        for (int i = 0; i < len; i++) {
            int prod = a[i] * k + carry;
            a[i] = prod % 10;
            carry = prod / 10;
        }
        while (carry > 0) {       // 处理剩余进位
            a[len++] = carry % 10;
            carry /= 10;
        }
        if (k == 20 || k == 21) {
            cout << k << "! 已有 " << len << " 位" << endl;
        }
    }

    cout << n << "! = ";
    for (int i = len - 1; i >= 0; i--) cout << a[i];
    cout << endl;
    cout << "共 " << len << " 位" << endl;
    cout << "(long long 最多约 19 位，所以 20! 之后必须用高精度)" << endl;

    return 0;
}`,
  },

  // ==================== 图论 ====================
  {
    id: 'algo-graph-storage',
    title: '图的存储',
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n = 6;
    // 边：(u, v, w)
    int edges[7][3] = {
        {0, 1, 4}, {0, 3, 2}, {1, 2, 5}, {1, 4, 3},
        {2, 5, 6}, {3, 4, 1}, {4, 5, 7}
    };

    // 方式一：邻接矩阵
    int mat[6][6] = {0};
    for (auto &e : edges) {
        mat[e[0]][e[1]] = e[2];
        mat[e[1]][e[0]] = e[2];   // 无向图两个方向都写
    }
    cout << "邻接矩阵（0 表示不通）:" << endl;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) cout << mat[i][j] << " ";
        cout << endl;
    }

    // 方式二：邻接表
    vector<vector<pair<int, int>>> adj(n);
    for (auto &e : edges) {
        adj[e[0]].push_back({e[1], e[2]});
        adj[e[1]].push_back({e[0], e[2]});
    }
    cout << endl << "邻接表:" << endl;
    for (int i = 0; i < n; i++) {
        cout << "  " << i << " -> ";
        for (auto &p : adj[i]) cout << p.first << "(权" << p.second << ") ";
        cout << endl;
    }

    cout << endl << "矩阵用 " << n * n << " 个格子，邻接表只用 " << edges[0][0] * 0 + 7 * 2 << " 条记录" << endl;

    return 0;
}`,
  },

  {
    id: 'algo-dijkstra',
    title: 'Dijkstra 最短路',
    code: `#include <iostream>
#include <vector>
#include <queue>
#include <climits>
using namespace std;

const int INF = INT_MAX;

int main() {
    int n = 6;
    // 边：(u, v, w)
    int edges[7][3] = {
        {0, 1, 4}, {0, 3, 2}, {1, 2, 5}, {1, 4, 3},
        {2, 5, 6}, {3, 4, 1}, {4, 5, 7}
    };

    vector<vector<pair<int, int>>> adj(n);
    for (auto &e : edges) {
        adj[e[0]].push_back({e[1], e[2]});
        adj[e[1]].push_back({e[0], e[2]});
    }

    int start = 0;
    vector<int> dist(n, INF);
    // 小顶堆：pair 默认按 first 比，所以存 {距离, 点}
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;        // 过期条目，跳过

        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {  // 松弛
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }

    cout << "从点 " << start << " 出发的最短距离:" << endl;
    for (int i = 0; i < n; i++) {
        cout << "  到点 " << i << ": ";
        if (dist[i] == INF) cout << "不可达";
        else cout << dist[i];
        cout << endl;
    }

    return 0;
}`,
  },

  {
    id: 'algo-topological-sort',
    title: '拓扑排序',
    code: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int main() {
    int n = 6;
    // 有向边：u -> v 表示 u 必须在 v 之前
    int edges[7][2] = {
        {0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {2, 5}, {5, 4}
    };

    vector<vector<int>> adj(n);
    vector<int> indeg(n, 0);
    for (auto &e : edges) {
        adj[e[0]].push_back(e[1]);
        indeg[e[1]]++;
    }

    // 入度为 0 的先入队
    queue<int> q;
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);

    vector<int> order;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            if (--indeg[v] == 0) q.push(v);   // 入度减到 0 就可以排了
        }
    }

    if ((int)order.size() == n) {
        cout << "拓扑序: ";
        for (int x : order) cout << x << " ";
        cout << endl;
    } else {
        cout << "只排出 " << order.size() << "/" << n
             << " 个点，说明图中有环" << endl;
    }

    return 0;
}`,
  },

  {
    id: 'algo-kruskal',
    title: '最小生成树 Kruskal',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// 并查集
int parent[100];
int find(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];   // 路径压缩
        x = parent[x];
    }
    return x;
}

struct Edge {
    int u, v, w;
    bool operator<(const Edge &o) const { return w < o.w; }
};

int main() {
    int n = 6;
    vector<Edge> edges = {
        {0, 1, 4}, {0, 3, 2}, {1, 2, 5}, {1, 4, 3},
        {2, 5, 6}, {3, 4, 1}, {4, 5, 7}
    };

    // 按权值从小到大排序
    sort(edges.begin(), edges.end());

    for (int i = 0; i < n; i++) parent[i] = i;

    int total = 0, picked = 0;
    vector<Edge> chosen;

    for (auto &e : edges) {
        int ru = find(e.u), rv = find(e.v);
        if (ru == rv) continue;      // 已连通，加了会成环
        parent[ru] = rv;
        total += e.w;
        picked++;
        chosen.push_back(e);
        if (picked == n - 1) break;  // n-1 条边就够了
    }

    cout << "选中的边:" << endl;
    for (auto &e : chosen) {
        cout << "  " << e.u << " - " << e.v << " (权 " << e.w << ")" << endl;
    }
    cout << "最小生成树总权值: " << total << endl;
    cout << "边数: " << picked << "（应为 n-1 = " << n - 1 << "）" << endl;

    return 0;
}`,
  },

  // ==================== Trie ====================
  {
    id: 'algo-trie',
    title: 'Trie 字典树',
    code: `#include <iostream>
#include <string>
using namespace std;

// Trie 节点：每个节点有 26 个儿子的下标，0 表示没有
int trie[1000][26];
bool isWord[1000];
int nodeCount = 1;          // 0 号是根，从 1 开始分配

void insert(const string &s) {
    int cur = 0;
    for (char ch : s) {
        int c = ch - 'a';
        if (trie[cur][c] == 0) {
            trie[cur][c] = nodeCount++;   // 没有这条边就新建节点
        }
        cur = trie[cur][c];
    }
    isWord[cur] = true;                   // 标记单词结尾
}

// 查询前缀是否存在
bool hasPrefix(const string &s) {
    int cur = 0;
    for (char ch : s) {
        int c = ch - 'a';
        if (trie[cur][c] == 0) return false;
        cur = trie[cur][c];
    }
    return true;
}

// 查询是否是完整单词
bool hasWord(const string &s) {
    int cur = 0;
    for (char ch : s) {
        int c = ch - 'a';
        if (trie[cur][c] == 0) return false;
        cur = trie[cur][c];
    }
    return isWord[cur];
}

int main() {
    string words[] = {"apple", "app", "april", "banana", "bat", "batch"};
    int n = 6;

    for (int i = 0; i < n; i++) insert(words[i]);

    int totalChars = 0;
    for (int i = 0; i < n; i++) totalChars += words[i].size();

    cout << "插入 " << n << " 个单词，共 " << totalChars << " 个字符" << endl;
    cout << "Trie 用了 " << nodeCount - 1 << " 个节点（根不算）" << endl;
    cout << "共用前缀省了 " << totalChars - (nodeCount - 1) << " 个节点" << endl;
    cout << endl;

    string queries[] = {"app", "ban", "cat", "bat", "batc"};
    for (auto &q : queries) {
        cout << "前缀 \\"" << q << "\\": ";
        cout << (hasPrefix(q) ? "存在" : "不存在");
        cout << ", 完整单词: " << (hasWord(q) ? "是" : "否") << endl;
    }

    return 0;
}`,
  },
];
