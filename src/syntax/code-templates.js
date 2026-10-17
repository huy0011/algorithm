
/**
 * 竞赛代码模板（精选自《算法基础课模板大全》115 页）。
 *
 * 这些模板以「语法知识点」的形式并入教程，分组名以「竞赛代码模板 ·」开头，
 * 因此会自然出现在语法页的左侧导航里，复用同一套渲染与搜索逻辑。
 *
 * 精选原则：保留竞赛高频、能独立看懂的模板；
 * 跳过偏难内容（高斯消元、扩展中国剩余定理、状态压缩 DP、
 * 树状数组、线段树、LCA、AC 自动机、博弈论等）。
 */

export const CODE_TEMPLATE_TOPICS = [
  {
    id: 'tpl-base-1',
    group: "竞赛代码模板 · 基础算法",
    title: "快速排序",
    summary: "把数组按基准分成两半递归排，平均 O(n log n)，常数小",
    points: [
      "把数组按基准分成两半递归排，平均 O(n log n)，常数小",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `void quick_sort(int q[], int l, int r)
{
    //递归的终止情况
    if (l >= r) return;
    //选取分界线。 这里选数组中间那个数
    int i = l - 1, j = r + 1, x = q[l + r >> 1];
    //划分成左右两个部分
    while (i < j)
    {
        do i ++ ; while (q[i] < x);
        do j -- ; while (q[j] > x);
        if (i < j) swap(q[i], q[j]);
    }
    //对左右部分排序
    quick_sort(q, l, j), quick_sort(q, j + 1, r);
}`,
    problems: [
      { pid: 'P1177', title: "【模板】排序" },
      { pid: 'P1923', title: "【深基9.例4】求第 k 小的数" },
      { pid: 'P1093', title: "[NOIP 2007 普及组] 奖学金" },
    ],
    trainingSets: [107],
  },
  {
    id: 'tpl-base-2',
    group: "竞赛代码模板 · 基础算法",
    title: "归并排序",
    summary: "分治排序，稳定；顺带能统计逆序对",
    points: [
      "分治排序，稳定；顺带能统计逆序对",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `void merge_sort(int q[], int l, int r)
{
    //递归的终止情况
    if (l >= r) return;
    //第一步： 分成子问题
    int mid = l + r >> 1;
    //第二步： 递归处理子问题
    merge_sort(q, l, mid);
    merge_sort(q, mid + 1, r);
    //第三步： 合并子问题
    int k = 0, i = l, j = mid + 1;
    while (i <= mid && j <= r)
    if (q[i] <= q[j]) tmp[k ++ ] = q[i ++ ];
    else tmp[k ++ ] = q[j ++ ];
    while (i <= mid) tmp[k ++ ] = q[i ++ ];
    while (j <= r) tmp[k ++ ] = q[j ++ ];
    //第四步： 复制回原数组
    for (i = l, j = 0; i <= r; i ++, j ++ ) q[i] = tmp[j];
}
// 逆序对数量
// 在数组中的两个数字,如果前面一个数字大于后面的数字,则这两个数字组成一个逆序对。输入一
// 个数组     ,求出这个数组中的逆序对的总数            P。
// 思路:归并排序
// 举个例子:
在合并      {4 ,5} {1 , 2}           的时候,首先我们判断             1 < 4,我们即可统计出逆序对为            2,为什么呢?这利用
了数组的部分有序性.因为我们知道             {4 ,5}     这个数组必然是有序的,因为是合并上来的.此时当             1
比 4小的时候,证明            4以后的数也都比            1大,此时就构成了从            4开始到      {4,5}   这个数组结束,这么多个
逆序对(2个),此时利用一个临时数组,将            1存放起来,接着比较            2和 4的大小,同样可以得到有            2
// 个逆序对,于是将            2也放进临时数组中,此时右边数组已经完全没有元素了,则将左边剩余的元素
// 全部放进临时元素中,最后将临时数组中的元素放进原数组对应的位置。
最后接着向上合并            ~
using namespace std;
typedef long long  LL;
const int N = 100010;
int n;
int q[N], tmp[N];
LL merge_sort(int l, int r) {
    if (l >= r)return 0;
    int mid = (l + r) >> 1;
    LL res = merge_sort(l, mid) + merge_sort(mid + 1, r);
    // 归并的过程
    int k = 0, i = l, j = mid + 1;
    while (i <= mid && j <= r)
    if (q[i] <= q[j])tmp[k++] = q[i++];
    else {
        tmp[k++] = q[j++];
        res += mid - i + 1;
    }
    //扫尾
    while (i <= mid)tmp[k++] = q[i++];
    while (j <= r)tmp[k++] = q[j++];
    //物归原主
    for (i = l, j = 0; i <= r; j++, i++)q[i] = tmp[j];
    return res;
}
int main() {
    cin >> n;
    for (int i = 0; i < n; i++)cin >> q[i];
    cout << merge_sort(0, n - 1) << endl;
    return 0;
}`,
    problems: [
      { pid: 'P1177', title: "【模板】排序" },
      { pid: 'P1908', title: "逆序对" },
      { pid: 'P1116', title: "车厢重组" },
    ],
    trainingSets: [107, 202],
  },
  {
    id: 'tpl-base-3',
    group: "竞赛代码模板 · 基础算法",
    title: "整数二分",
    summary: "在有序区间里找边界，注意 mid 取整方向避免死循环",
    points: [
      "在有序区间里找边界，注意 mid 取整方向避免死循环",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `bool check(int x) {/* ... */} // 检查 x是否满足某种性质
// 区间 [l, r]被划分成 [l, mid]和 [mid + 1, r]时使用：
int bsearch_1(int l, int r)
{
    while (l < r)
    {
        int mid = l + r >> 1;
        if (check(mid)) r = mid;    // check()判断 mid是否满足性质
        else l = mid + 1;//左加右减
    }
    return l;
}
// 区间 [l, r]被划分成 [l, mid - 1]和 [mid, r]时使用：
int bsearch_2(int l, int r)
{
    while (l < r)
    {
        int mid = l + r + 1 >> 1;//如果下方 else后面是 r则这里加 1
        if (check(mid)) l = mid;
        else r = mid - 1;//左加右减
    }
    return l;
}`,
    problems: [
      { pid: 'P2249', title: "【深基13.例1】查找" },
      { pid: 'P1102', title: "A-B 数对" },
      { pid: 'P1678', title: "烦恼的高考志愿" },
    ],
    trainingSets: [111],
  },
  {
    id: 'tpl-base-4',
    group: "竞赛代码模板 · 基础算法",
    title: "浮点数二分",
    summary: "二分实数答案，迭代固定次数代替判等",
    points: [
      "二分实数答案，迭代固定次数代替判等",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `bool check(double x) {/* ... */} // 检查 x是否满足某种性质
double bsearch_3(double l, double r)
{
    const double eps = 1e-6;   // eps 表示精度， 取决于题目对精度的要求
    while (r - l > eps)
    {
        double mid = (l + r) / 2;
        if (check(mid)) r = mid;
        else l = mid;
    }
    return l;
}`,
    problems: [
      { pid: 'P1024', title: "[NOIP 2001 提高组] 一元三次方程求解" },
      { pid: 'P2440', title: "木材加工" },
      { pid: 'P1873', title: "[COCI 2011/2012 #5] EKO / 砍树" },
    ],
    trainingSets: [111],
  },
  {
    id: 'tpl-base-5',
    group: "竞赛代码模板 · 基础算法",
    title: "高精度加法",
    summary: "两个大整数相加，位数超出 long long 时用",
    points: [
      "两个大整数相加，位数超出 long long 时用",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `// C = A + B, A >= 0, B >= 0
vector<int> add(vector<int> &a,vector<int> &b){
    //c为答案
    vector<int> c;
    //t为进位
    int t=0;
    for(int i=0;i<a.size()||i<b.size();i++){
        //不超过 a的范围添加 a[i]
        if(i<a.size())t+=a[i];
        //不超过 b的范围添加 b[i]
        if(i<b.size())t+=b[i];
        //取当前位的答案
        c.push_back(t%10);
        //是否进位
        t/=10;
    }
    //如果 t!=0的话向后添加 1
    if(t)c.push_back(1);
    return c;
}`,
    problems: [
      { pid: 'P1601', title: "高精度加法" },
      { pid: 'P1255', title: "数楼梯" },
      { pid: 'P1009', title: "[NOIP 1998 普及组] 阶乘之和" },
    ],
    trainingSets: [106],
  },
  {
    id: 'tpl-base-6',
    group: "竞赛代码模板 · 基础算法",
    title: "高精度减法",
    summary: "大整数相减，注意结果为 0 和前导零",
    points: [
      "大整数相减，注意结果为 0 和前导零",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `// C = A - B, 满足 A >= B, A >= 0, B >= 0
vector<int> sub(vector<int> &A, vector<int> &B)
{
    //答案
    vector<int> C;
    //遍历最大的数
    for (int i = 0, t = 0; i < A.size(); i ++ )
    {
        //t为进位
        t = A[i] - t;
        //不超过 B的范围 t=A[i]-B[i]-t;
        if (i < B.size()) t -= B[i];
        //合二为一， 取当前位的答案
        C.push_back((t + 10) % 10);
        //借位操作
        if (t < 0) t = 1;
        else t = 0;
    }
    //去除前导零
    while (C.size() > 1 && C.back() == 0) C.pop_back();
    return C;
}
高精度比大小(cmp      函数)
//高精度比大小
bool cmp(vector<int> &A, vector<int> &B) {
    if (A.size() != B.size())
    return A.size() > B.size();
    for (int i = A.size() - 1; i >= 0; i -- )
    if (A[i] != B[i])
    return A[i] > B[i];
    return true;
}`,
    problems: [
      { pid: 'P2142', title: "高精度减法" },
      { pid: 'P1601', title: "高精度加法" },
    ],
    trainingSets: [106],
  },
  {
    id: 'tpl-base-7',
    group: "竞赛代码模板 · 基础算法",
    title: "高精度乘法",
    summary: "两个大整数相乘，O(n²)",
    points: [
      "两个大整数相乘，O(n²)",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `vector<int> mul(vector<int> &A, vector<int> &B) {
    vector<int> C(A.size() + B.size() + 10); // 初始化为  0， C的 size可以大一点
    for (int i = 0; i < A.size(); i++)
    for (int j = 0; j < B.size(); j++)
    C[i + j] += A[i] * B[j];
    for (int i = 0, t = 0; i < C.size(); i++) { // i = C.size() - 1时  t 一定小
        于  10
        t += C[i];
        C[i] = t % 10;
        t /= 10;
    }
    while (C.size() > 1 && C.back() == 0) C.pop_back(); // 必须要去前导  0， 因为
// 最高位很可能是  0
    return C;
}`,
    problems: [
      { pid: 'P1303', title: "A*B Problem" },
      { pid: 'P1009', title: "[NOIP 1998 普及组] 阶乘之和" },
    ],
    trainingSets: [106],
  },
  {
    id: 'tpl-base-8',
    group: "竞赛代码模板 · 基础算法",
    title: "一维前缀和",
    summary: "多次查询区间和，预处理 O(n) 后每次 O(1)",
    points: [
      "多次查询区间和，预处理 O(n) 后每次 O(1)",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `const int N=100010;
int a[N];
int main(){
    int n,m;
    scanf("%d",&n);
    for(int i=1;i<=n;i++)scanf("%d",&a[i]);
    for(int i=1;i<=n;i++)a[i]=a[i-1]+a[i];
    scanf("%d",&m);
    while(m--){
        int l,r;
        scanf("%d%d",&l,&r);
        printf("%d\\n",a[r]-a[l-1]);
    }
    return 0;
}`,
    problems: [
      { pid: 'P8218', title: "【深进1.例1】求区间和" },
      { pid: 'P5638', title: "【CSGRound2】光骓者的荣耀" },
      { pid: 'P3131', title: "[USACO16JAN] Subsequences Summing to Sevens S" },
    ],
    trainingSets: [200],
  },
  {
    id: 'tpl-base-9',
    group: "竞赛代码模板 · 基础算法",
    title: "二维前缀和",
    summary: "二维矩阵的任意子矩形求和",
    points: [
      "二维矩阵的任意子矩形求和",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int s[1010][1010];
int n,m,q;
int main(){
    scanf("%d%d%d",&n,&m,&q);
    for(int i=1;i<=n;i++)
    for(int j=1;j<=m;j++)
    scanf("%d",&s[i][j]);
    for(int i=1;i<=n;i++)
    for(int j=1;j<=m;j++)
    s[i][j]+=s[i-1][j]+s[i][j-1]-s[i-1][j-1];
    while(q--){
        int x1,y1,x2,y2;
        scanf("%d%d%d%d",&x1,&y1,&x2,&y2);
        printf("%d\\n",s[x2][y2]-s[x2][y1-1]-s[x1-1][y2]+s[x1-1][y1-1]);
    }
    return 0;
}`,
    problems: [
      { pid: 'P2004', title: "领地选择" },
      { pid: 'P2280', title: "[HNOI2003] 激光炸弹" },
      { pid: 'P1387', title: "最大正方形" },
    ],
    trainingSets: [200],
  },
  {
    id: 'tpl-base-10',
    group: "竞赛代码模板 · 基础算法",
    title: "一维差分",
    summary: "区间批量加同一个值，最后前缀和还原",
    points: [
      "区间批量加同一个值，最后前缀和还原",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `using namespace std;
int a[100010],s[100010];
int main(){
    int n,m;
    cin>>n>>m;
    for(int i=1;i<=n;i++)cin>>a[i];
    for(int i=1;i<=n;i++)s[i]=a[i]-a[i-1];// 读入并计算差分数组
    while(m--){
        int l,r,c;
        cin>>l>>r>>c;
        s[l]+=c;
        s[r+1]-=c;// 在原数组中将区间 [l, r]加上 c
    }
    for(int i=1;i<=n;i++){
        s[i]+=s[i-1];
        cout<<s[i]<<' ';
    }// 给差分数组计算前缀和， 就求出了原数组
    return 0;
}`,
    problems: [
      { pid: 'P2367', title: "语文成绩" },
      { pid: 'P4552', title: "[Poetize6] IncDec Sequence" },
      { pid: 'P1083', title: "[NOIP 2012 提高组] 借教室" },
    ],
    trainingSets: [200],
  },
  {
    id: 'tpl-base-11',
    group: "竞赛代码模板 · 基础算法",
    title: "双指针",
    summary: "i、j 单调移动不回头，把 O(n²) 降到 O(n)",
    points: [
      "i、j 单调移动不回头，把 O(n²) 降到 O(n)",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `for (int i = 0, j = 0; i < n; i ++ )
{
    while (j < i && check(i, j)) j ++ ;
    // 具体问题的逻辑
}
// 常见问题分类:
(1) 对于一个序列, 用两个指针维护一段区间
(2) 对于两个序列, 维护某种次序, 比如归并排序中合并两个有序序列的操作`,
    problems: [
      { pid: 'P1102', title: "A-B 数对" },
      { pid: 'P3143', title: "[USACO16OPEN] Diamond Collector S" },
      { pid: 'P1638', title: "逛画展" },
    ],
    trainingSets: [201],
  },
  {
    id: 'tpl-base-12',
    group: "竞赛代码模板 · 基础算法",
    title: "离散化",
    summary: "值域很大但实际用到的很少，映射成小下标",
    points: [
      "值域很大但实际用到的很少，映射成小下标",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `// 2.  去重:     alls.earse(unique(alls.begin(),alls.end()),alls.end());
vector<int> alls; // 存储所有待离散化的值
sort(alls.begin(), alls.end()); // 将所有值排序
alls.erase(unique(alls.begin(), alls.end()), alls.end());   // 去掉重复元素
// 二分求出 x对应的离散化的值
int find(int x) // 找到第一个大于等于 x的位置
{
    int l = 0, r = alls.size() - 1;
    while (l < r)
    {
        int mid = l + r >> 1;
        if (alls[mid] >= x) r = mid;
        else l = mid + 1;
    }
    return r + 1; // 映射到 1, 2, ...n
}
// 应用
typedef pair<int, int> PII;
const int N = 300010;
int n, m;
int a[N], s[N];
vector<int> alls;//存入下标容器
vector<PII> add, query;//add增加容器， 存入对应下标和增加的值的大小
//query存入需要计算下标区间和的容器
int find(int x)
{
    int l = 0, r = alls.size() - 1;
    while (l < r)//查找大于等于 x的最小的值的下标
    {
        int mid = l + r >> 1;
        if (alls[mid] >= x) r = mid;
        else l = mid + 1;
    }
    return r + 1;//因为使用前缀和， 其下标要 +1可以不考虑边界问题
}
int main()
{
    cin >> n >> m;
    for (int i = 0; i < n; i ++ )
    {
        int x, c;
        cin >> x >> c;
        add.push_back({x, c});//存入下标即对应的数值 c
        alls.push_back(x);//存入数组下标 x=add.first
    }
    for (int i = 0; i < m; i ++ )
    {
        int l, r;
        cin >> l >> r;
        query.push_back({l, r});//存入要求的区间
        alls.push_back(l);//存入区间左右下标
        alls.push_back(r);
    }
    // 区间去重
    sort(alls.begin(), alls.end());
    alls.erase(unique(alls.begin(), alls.end()), alls.end());
    // 处理插入
    for (auto item : add)
    {
        int x = find(item.first);//将 add容器的 add.secend值存入数组 a[]当中，
        a[x] += item.second;//在去重之后的下标集合 alls内寻找对应的下标并添加数值`,
    problems: [
      { pid: 'P1955', title: "[NOI2015] 程序自动分析" },
      { pid: 'P1884', title: "[USACO12FEB] Overplanting S" },
      { pid: 'P1908', title: "逆序对" },
    ],
    trainingSets: [200],
  },
  {
    id: 'tpl-ds-1',
    group: "竞赛代码模板 · 数据结构",
    title: "区间合并",
    summary: "把有交集的区间合并成一个大区间",
    points: [
      "把有交集的区间合并成一个大区间",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `// 将所有存在交集的区间合并
void merge(vector<PII> &segs)
{
    vector<PII> res;
    sort(segs.begin(), segs.end());
    int st = -2e9, ed = -2e9;
    for (auto seg : segs)
    if (ed < seg.first)
    {
        if (st != -2e9) res.push_back({st, ed});
        st = seg.first, ed = seg.second;
    }
    else ed = max(ed, seg.second);
    if (st != -2e9) res.push_back({st, ed});
    segs = res;
}`,
        problems: [
      { pid: 'P1204', title: "[USACO1.2] 挤牛奶 Milking Cows" },
      { pid: 'P2082', title: "区间覆盖（加强版）" },
      { pid: 'P5019', title: "[NOIP 2018 提高组] 铺设道路" },
    ],
    trainingSets: [201],
  },
  {
    id: 'tpl-ds-2',
    group: "竞赛代码模板 · 数据结构",
    title: "单链表（数组模拟）",
    summary: "用数组 + 下标模拟链表，避免指针和动态分配",
    points: [
      "用数组 + 下标模拟链表，避免指针和动态分配",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `const int N=100010;
int head,e[N],ne[N],idx;
//初始化
void init(){
    head=-1;
    idx=0;
}
//在链表头部添加节点
void add_to_head(int x){
    e[idx]=x,ne[idx]=head,head=idx++;
}
//在位置 k添加节点 x
void add(int k,int x){
    e[idx]=x,ne[idx]=ne[k],ne[k]=idx++;
}
//删除位置 k的节点
void remove(int k){
    ne[k]=ne[ne[k]];
}
// 应用
int main(){
    int m;
    init();
    cin>>m;
    while(m--){
        int k,x;
        char op;
        cin>>op;
        if(op=='H'){
            cin>>x;
            add_to_head(x);
        }else if(op=='D'){
        cin>>k;
        if(!k)head=ne[head];
        remove(k-1);
    }else {
    cin>>k>>x;
    add(k-1,x);
}
}
for(int i=head;i!=-1;i=ne[i])cout<<e[i]<<' ';
cout<<endl;
return 0;
}`,
    problems: [
      { pid: 'P1160', title: "队列安排" },
      { pid: 'P1996', title: "约瑟夫问题" },
    ],
    trainingSets: [113],
  },
  {
    id: 'tpl-ds-3',
    group: "竞赛代码模板 · 数据结构",
    title: "栈（数组模拟）",
    summary: "后进先出，push / pop / top",
    points: [
      "后进先出，push / pop / top",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `// tt表示栈顶
int stk[N], tt = 0;
// 向栈顶插入一个数
stk[ ++ tt] = x;
// 从栈顶弹出一个数
tt -- ;
// 栈顶的值
stk[tt];
// 判断栈是否为空， 如果  tt > 0， 则表示不为空
if (tt > 0)
{
}
// 应用
const int N=100010;
int stk[N],tt;
int main(){
    int m;
    cin>>m;
    while(m--){
        string op;
        int x;
        cin>>op;
        if(op=="push"){
            cin>>x;
            stk[tt++]=x;
        }else if(op=="pop"){
        tt--;
    }else if(op=="query"){
    cout<<stk[tt-1]<<endl;
}else{
if(!tt)cout<<"YES"<<endl;
else cout<<"NO"<<endl;
}
}
return 0;
}`,
    problems: [
      { pid: 'P1739', title: "表达式括号匹配" },
      { pid: 'P1449', title: "后缀表达式" },
      { pid: 'B3614', title: "【模板】栈" },
    ],
    trainingSets: [113],
  },
  {
    id: 'tpl-ds-4',
    group: "竞赛代码模板 · 数据结构",
    title: "队列（数组模拟）",
    summary: "先进先出，注意用 head/tail 指针而非真的移位",
    points: [
      "先进先出，注意用 head/tail 指针而非真的移位",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `// hh 表示队头， tt表示队尾
int q[N], hh = 0, tt = -1;
// 向队尾插入一个数
q[ ++ tt] = x;
// 从队头弹出一个数
hh ++ ;
// 队头的值
q[hh];
// 判断队列是否为空， 如果  hh <= tt， 则表示不为空
if (hh <= tt)
{
}
// 应用
int const N=100010;
int que[N],hh,tt=-1;
int main(){
    int m;
    cin>>m;
    while(m--){
        string op;
        int x;
        cin>>op;
        if(op=="push"){
            cin>>x;
            que[++tt]=x;
        }else if(op=="query"){
        cout<<que[hh]<<endl;
    }else if(op=="pop"){
    hh++;
}else{
if(hh>tt)cout<<"YES"<<endl;
else cout<<"NO"<<endl;
}
}
return 0;
}`,
    problems: [
      { pid: 'P1996', title: "约瑟夫问题" },
      { pid: 'P1540', title: "[NOIP 2010 提高组] 机器翻译" },
      { pid: 'B3616', title: "【模板】队列" },
    ],
    trainingSets: [113],
  },
  {
    id: 'tpl-ds-5',
    group: "竞赛代码模板 · 数据结构",
    title: "单调栈",
    summary: "找每个数左边/右边第一个比它小的数，O(n)",
    points: [
      "找每个数左边/右边第一个比它小的数，O(n)",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int tt = 0;
for (int i = 1; i <= n; i ++ )
{
    while (tt && check(stk[tt], i)) tt -- ;
    stk[ ++ tt] = i;
}
// 应用
找出每个数左边离它最近的比它大 /小的数
stack<int> stk;
int main(){
    int n;
    cin >> n;
    stk.push(-1);
    for (int i = 0; i < n; i ++){
        int x;
        cin >> x;
        while (stk.size() && stk.top() >= x) stk.pop();
        cout << stk.top() << " ";
        stk.push(x);
    }
    return 0;
}`,
    problems: [
      { pid: 'P5788', title: "【模板】单调栈" },
      { pid: 'P2866', title: "[USACO06NOV] Bad Hair Day S" },
      { pid: 'P1901', title: "发射站" },
    ],
    trainingSets: [113],
  },
  {
    id: 'tpl-ds-6',
    group: "竞赛代码模板 · 数据结构",
    title: "单调队列",
    summary: "滑动窗口最值，O(n)",
    points: [
      "滑动窗口最值，O(n)",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int hh = 0, tt = -1;
for (int i = 0; i < n; i ++ )
{
    while (hh <= tt && check_out(q[hh])) hh ++ ;  // 判断队头是否滑出窗口
    while (hh <= tt && check(q[tt], i)) tt -- ;
    q[ ++ tt] = i;
}
const int N = 1000010;
int a[N];
int main()
{
    int n, k;
    cin >> n >> k;
    for (int i = 1; i <= n; i ++ ) cin >> a[i];//读入数据
    deque<int> q;
    for(int i = 1; i <= n; i++)
    {
        while(q.size() && q.back() > a[i]) //新进入窗口的值小于队尾元素， 则队尾出队
        列
        q.pop_back();
        q.push_back(a[i]);//将新进入的元素入队
        if(i - k >= 1 && q.front() == a[i - k])//若队头是否滑出了窗口， 队头出队
        q.pop_front();
        if(i >= k)//当窗口形成， 输出队头对应的值
        cout << q.front() <<" ";
    }
    q.clear();
    cout << endl;
    //最大值亦然
    for(int i = 1; i <= n; i++)
    {
        while(q.size() && q.back() < a[i]) q.pop_back();
        q.push_back(a[i]);
        if(i - k >= 1 && a[i - k] == q.front()) q.pop_front();
        if(i >= k) cout << q.front() << " ";
    }
}`,
    problems: [
      { pid: 'P1886', title: "【模板】单调队列 / 滑动窗口" },
      { pid: 'P1440', title: "求m区间内的最小值" },
      { pid: 'P2032', title: "扫描" },
    ],
    trainingSets: [113],
  },
  {
    id: 'tpl-ds-7',
    group: "竞赛代码模板 · 数据结构",
    title: "KMP 字符串匹配",
    summary: "求模式串在主串中所有出现位置，O(n+m)",
    points: [
      "求模式串在主串中所有出现位置，O(n+m)",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `const int N = 100010, M = 1000010;
int n, m;
int ne[N];
char s[M], p[N];
int main()
{
    cin >> n >> p + 1 >> m >> s + 1;
    for (int i = 2, j = 0; i <= n; i ++ )
    {
        while (j && p[i] != p[j + 1]) j = ne[j];
        if (p[i] == p[j + 1]) j ++ ;
        ne[i] = j;
    }//处理 ne数组
    for (int i = 1, j = 0; i <= m; i ++ )
    {
        while (j && s[i] != p[j + 1]) j = ne[j];
        if (s[i] == p[j + 1]) j ++ ;
        if (j == n)
        {
            printf("%d ", i - n);
            j = ne[j];
        }
    }//匹配算法
    return 0;
}
// s[]是长文本， p[]是模式串， n是 s的长度， m是 p的长度
// 求模式串的 Next数组：
for (int i = 2, j = 0; i <= m; i ++ )
{
    while (j && p[i] != p[j + 1]) j = ne[j];
    if (p[i] == p[j + 1]) j ++ ;
    ne[i] = j;
}
// 匹配
for (int i = 1, j = 0; i <= n; i ++ )
{
    while (j && s[i] != p[j + 1]) j = ne[j];
    if (s[i] == p[j + 1]) j ++ ;
    if (j == m)
    {
        j = ne[j];
        // 匹配成功后的逻辑
    }
}
// 下标从     0开始的     kmp   算法
const int N = 1000010;
int n, m;
char s[N], p[N];
int ne[N];
int main()
{
    cin >> m >> p >> n >> s;
    ne[0] = -1;
    for (int i = 1, j = -1; i < m; i ++ )
    {
        while (j >= 0 && p[j + 1] != p[i]) j = ne[j];
        if (p[j + 1] == p[i]) j ++ ;
        ne[i] = j;
    }
    for (int i = 0, j = -1; i < n; i ++ )
    {
        while (j != -1 && s[i] != p[j + 1]) j = ne[j];
        if (s[i] == p[j + 1]) j ++ ;
        if (j == m - 1)
        {
            cout << i - j << ' ';
            j = ne[j];
        }
    }
    return 0;
}
// string    版的   kmp
using namespace std;
int main()
{
    int n, m;
    string s, p;
    cin >> n >> p >> m >> s;
    vector<int> nxt(n); // nxt[j]表示 p[0:j]的最长前后匹配缀的长度
    for(int i = 1; i < n; ++i)
    {
        // j可以初始化为 nxt[i-1]的值， 由于 nxt[i-1]是长度且 j的坐标从 0开始，
        // 所以 j直接指向 p中 i-1的最长前缀后一位 , 可以直接用来和 p[i]尝试匹配
        int j = nxt[i-1];
        // p[i]和 p[j]不匹配的话， j指向 nxt[j-1]， 同理， 也可以用来和 p[i]进行尝试匹配
        while(j && p[i] != p[j]) j = nxt[j-1];
        if(p[i] == p[j]) j++;
        nxt[i] = j;
    }
    for(int i = 0, j = 0; i < m; ++i)
    {
        while(j && s[i] != p[j]) j = nxt[j-1];
        if(s[i] == p[j]) j++;
        if(j == n)
        {
            cout << i-n+1 << ' ';
            j = nxt[j-1];
        }
    }
    return 0;
}`,
    problems: [
      { pid: 'P3375', title: "【模板】KMP" },
      { pid: 'P4824', title: "[USACO15FEB] Censoring S" },
      { pid: 'P2375', title: "[NOI2014] 动物园" },
    ],
    trainingSets: [203],
  },
  {
    id: 'tpl-ds-8',
    group: "竞赛代码模板 · 数据结构",
    title: "二叉树的存储与遍历",
    summary: "用数组存左右儿子，前/中/后序与层序遍历",
    points: [
      "用数组存左右儿子，前/中/后序与层序遍历",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `const int N = 1e6 + 10;
// 二叉树的存储 ,l数组为左节点 ,r数组为右结点
// l[i] 存储的下标为 i节点的左节点下标，  r[i] 存储的下标为 i节点的右节点下标
int l[N], r[N];
// 存储节点的数据
char w[N];
// 节点的下标指针
int idx = 0;
// 先序创建
int pre_create(int n) {
    cin >> w[n];
    if (w[n] == '#') return -1;
    l[n] = pre_create(++idx);
    r[n] = pre_create(++idx);
    return n;
}
// 中序创建
int in_create(int n) {
    if (w[n] == '#') return -1;
    l[n] = in_create(++idx);
    cin >> w[n];
    r[n] = in_create(++idx);
    return n;
}
// 后序创建
int back_create(int n) {
    if (w[n] == '#') return -1;
    l[n] = back_create(++idx);
    r[n] = back_create(++idx);
    cin >> w[n];
    return n;
}
// 先序遍历
void pre_print(int n){
    if (w[n] != '#') cout << w[n] << ' ';
    if (l[n] > 0) pre_print(l[n]);
    if (r[n] > 0) pre_print(r[n]);
}
// 中序遍历
void in_print(int n){
    if (l[n] > 0) in_print(l[n]);
    if (w[n] != '#') cout << w[n] << ' ';
    if (r[n] > 0) in_print(r[n]);
}
// 后序遍历
void back_print(int n){
    if (l[n] > 0) back_print(l[n]);
    if (r[n] > 0) back_print(r[n]);
    if (w[n] != '#') cout << w[n] << ' ';
}
// 层序遍历
void bfs(int root){
    queue<int> que;
    que.push(root);
    while (!que.empty()) {
        int t = que.front();
        cout << w[t] << ' ';
        que.pop();
        if (l[t] > 0 && w[l[t]] != '#')
        que.push(l[t]);
        if (r[t] > 0 && w[r[t]] != '#')
        que.push(r[t]);
    }
}
// 应用
int main(){
    // 先序创建
    pre_create(++idx);
    // 中序创建
    // in_create(++idx);
    // 后序创建
    // back_create(++idx);
    // 先序遍历
    pre_print(1);
    // 中序遍历
    in_print(1);
    // 后序遍历
    back_print(1);
    // 层序遍历
    bfs(1);
    // 测试数据 abc##de#g##f###
    // 输出如下：
    // a b c d e g f
    // c b e g d f a
    // c g e f d b a
    // a b c d e f g
    return 0;
}`,
    problems: [
      { pid: 'P1305', title: "新二叉树" },
      { pid: 'P1030', title: "[NOIP 2001 普及组] 求先序排列" },
      { pid: 'P1087', title: "[NOIP 2004 普及组] FBI 树" },
    ],
    trainingSets: [114],
  },
  {
    id: 'tpl-ds-9',
    group: "竞赛代码模板 · 数据结构",
    title: "Trie 字典树",
    summary: "高效查前缀，每个节点对应一个字符",
    points: [
      "高效查前缀，每个节点对应一个字符",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int son[N][26], cnt[N], idx;
// 0号点既是根节点， 又是空节点
// son[][]存储树中每个节点的子节点
// cnt[]存储以每个节点结尾的单词数量
// 插入一个字符串
void insert(char *str)
{
    int p = 0;
    for (int i = 0; str[i]; i ++ )
    {
        int u = str[i] - 'a';
        if (!son[p][u]) son[p][u] = ++ idx;
        p = son[p][u];
    }
    cnt[p] ++ ;
}
// 查询字符串出现的次数
int query(char *str)
{
    int p = 0;
    for (int i = 0; str[i]; i ++ )
    {
        int u = str[i] - 'a';
        if (!son[p][u]) return 0;
        p = son[p][u];
    }
    return cnt[p];
}
const int N = 100010;
int son[N][26], cnt[N], idx;
char str[N];
void insert(char *str)
{
    int p = 0;
    for (int i = 0; str[i]; i ++ )
    {
        int u = str[i] - 'a';
        if (!son[p][u]) son[p][u] = ++ idx;
        p = son[p][u];
    }
    cnt[p] ++ ;
}//插入
int query(char *str)
{
    int p = 0;
    for (int i = 0; str[i]; i ++ )
    {
        int u = str[i] - 'a';
        if (!son[p][u]) return 0;
        p = son[p][u];
    }
    return cnt[p];
}//查询
int main()
{
    int n;
    scanf("%d", &n);
    while (n -- )
    {
        char op[2];
        scanf("%s%s", op, str);
        if (*op == 'I') insert(str);
        else printf("%d\\n", query(str));
    }
    return 0;
}`,
    problems: [
      { pid: 'P8306', title: "【模板】字典树 / Trie" },
      { pid: 'P2580', title: "于是他错误的点名开始了" },
      { pid: 'P3879', title: "[TJOI2010] 阅读理解" },
    ],
    trainingSets: [203],
  },
  {
    id: 'tpl-ds-10',
    group: "竞赛代码模板 · 数据结构",
    title: "并查集",
    summary: "路径压缩 + 按秩合并，近似 O(1) 判断连通性",
    points: [
      "路径压缩 + 按秩合并，近似 O(1) 判断连通性",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int p[N]; //存储每个点的祖宗节点
// 返回 x的祖宗节点
int find(int x)
{
    if (p[x] != x) p[x] = find(p[x]);
    return p[x];
}
// 初始化， 假定节点编号是 1~n
for (int i = 1; i <= n; i ++ ) p[i] = i;
// 合并 a和 b所在的两个集合：
p[find(a)] = find(b);
(2)维护 size的并查集:
int p[N], size[N];
//p[]存储每个点的祖宗节点 , size[]只有祖宗节点的有意义， 表示祖宗节点所在集合中的点的数
量
// 返回 x的祖宗节点
int find(int x)
{
    if (p[x] != x) p[x] = find(p[x]);
    return p[x];
}
// 初始化， 假定节点编号是 1~n
for (int i = 1; i <= n; i ++ )
{
    p[i] = i;
    size[i] = 1;
}
// 合并 a和 b所在的两个集合：
size[find(b)] += size[find(a)];
p[find(a)] = find(b);
(3)维护到祖宗节点距离的并查集:
int p[N], d[N];
//p[]存储每个点的祖宗节点 , d[x]存储 x到 p[x]的距离
// 返回 x的祖宗节点
int find(int x)
{
    if (p[x] != x)
    {
        int u = find(p[x]);
        d[x] += d[p[x]];
        p[x] = u;
    }
    return p[x];
}
// 初始化， 假定节点编号是 1~n
for (int i = 1; i <= n; i ++ )
{
    p[i] = i;
    d[i] = 0;
}
// 合并 a和 b所在的两个集合：
p[find(a)] = find(b);
d[find(a)] = distance; // 根据具体问题， 初始化 find(a)的偏移量
// 应用
const int N=100010;
int p[N],n,m;
int find(int x){//找到祖宗节点 +路径压缩
    if(p[x]!=x)p[x]=find(p[x]);
    return p[x];
}
int main(){
    scanf("%d%d",&n,&m);
    for(int i=1;i<=n;i++)p[i]=i;
    while(m--){
        char op[2];
        int a,b;
        scanf("%s%d%d",op,&a,&b);
        if(op[0]=='M')p[find(a)]=find(b);
        else {
            if(find(a)==find(b))puts("Yes");
            else puts("No");
        }
    }
    return 0;
}`,
    problems: [
      { pid: 'P3367', title: "【模板】并查集" },
      { pid: 'P1551', title: "亲戚" },
      { pid: 'P2024', title: "[NOI2001] 食物链" },
    ],
    trainingSets: [115],
  },
  {
    id: 'tpl-graph-1',
    group: "竞赛代码模板 · 搜索与图论",
    title: "图的存储",
    summary: "邻接矩阵适合稠密图，邻接表适合稀疏图",
    points: [
      "邻接矩阵适合稠密图，邻接表适合稀疏图",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `// 对于每个点 k， 开一个单链表， 存储 k所有可以走到的点。 h[k]存储这个单链表的头结点
int h[N], e[N], ne[N], idx;
// 添加一条边 a->b
void add(int a, int b)
{
    // 存下 b的值， b下一个指向 a的下一个节点， a的下一个节点指向 b
    e[idx] = b, ne[idx] = h[a], h[a] = idx ++ ;
}
// 初始化
idx = 0;
memset(h, -1, sizeof h);`,
    problems: [
      { pid: 'P5318', title: "【深基18.例3】查找文献" },
      { pid: 'P3916', title: "图的遍历" },
    ],
    trainingSets: [116],
  },
  {
    id: 'tpl-graph-2',
    group: "竞赛代码模板 · 搜索与图论",
    title: "深度优先遍历 DFS",
    summary: "一条道走到底，适合求连通块、方案数",
    points: [
      "一条道走到底，适合求连通块、方案数",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int dfs(int u)
{
    st[u] = true; // st[u] 表示点 u已经被遍历过
    for (int i = h[u]; i != -1; i = ne[i])
    {
        int j = e[i];
        if (!st[j]) dfs(j);
    }
}
// DFS   代码框架
ans;            // 答案， 用全局变量表示
void dfs(层数 , 其它参数 ){
    if(出局判断 ){            // 到达最底层， 或者满足条件退出
        更新答案 ;            // 答案一般用全局变量表示
        return;            // 返回到上一层
    }
    (剪枝 )            // 在进一步 DFS之前剪枝
    for (枚举下一层可能的情况 )  // 对每个情况继续 DFS
    if (used[i] == 0){  // 如果状态 i没有用过， 就可以进入下一层
        used[i] = 1;    // 标记状态 i,表示已经用过， 在更底层不能再使用
        dfs(层数  + 1, 其它参数 );// 下一层
        used[i] = 0;         // 恢复状态， 回溯时不影响上一层对这个状态的使用
    }
    return;            // 返回到上一层
}
// 应用:数字全排列
#include <iostream>
using namespace std;
int res[10],b[10],n;
void dfs(int k){
    if(k==n){//k==n则输出 n个数字
        for(int i=0;i<n;i++)printf("%d ",res[i]);
        cout<<endl;
    }
    for(int i=1;i<=n;i++){
        if(!b[i]){//判断是否被用过
            res[k]=i;//当前 k位存入位置
            b[i]=1;//表示被占用
            dfs(k+1);
            b[i]=0;//恢复现场
        }
    }
}
int main(){
    cin>>n;
    dfs(0);//从 0开始枚举
    return 0;
}
// 应用:树的重心
给定一颗树,树中包含个结点(编号)和条无向边.
// 请你找到树的重心,并输出将重心删除后,剩余各个连通块中点数的最大值。
// 重心定义:重心是指树中的一个结点,如果将这个点删除后,剩余各个连通块中节点个数的最大值
// 最小,那么这个节点被称为树的重心。
using namespace std;
const int N = 100010, M = N * 2;//无向图 n条边时， 最多 2n个 idx， 因为每条边在邻接表中会
// 出现两次
int n;//n个结点 ,n-1条边
int h[N], e[M], ne[M], idx;//n个链表头， e每一个结点的值， ne每一个结点的 next指针
int ans = N;//最小的最大值
bool st[N];//状态数组， 防止子节点搜索父节点
void add(int a, int b)//a->b
{//e记录当前点的值 (地址 ->值 ),ne下一点的地址 (地址 ->地址 )， h记录指向的第一个点的地址 (值 ->
    地址 )
    e[idx] = b, ne[idx] = h[a], h[a] = idx ++ ;
}//头插法
int dfs(int u)//通过 h数组找到子结点的向
{
    st[u] = true;//st标记当前点被搜过
    int size = 0, sum = 0;
    //size删掉元素后各个子连通块的最大值
    //sum当前子树大小， 遍历叶节点时， 返回 1
    for (int i = h[u]; i != -1; i = ne[i])//遍历单链表， 链表末端初始化为 -1
    {
        int j=e[i];
        if(st[j])continue;//此处防逆向 dfs
        int s = dfs(j);//s各个子连通块的个数
        size = max(size, s);//size删掉元素后各个连通块的最大值
        sum += s;//各个子连通块个数之和
    }
    size = max(size, n - sum - 1);//取最大子连通块与父连通块的最大值
    ans = min(ans, size);//全局变量 ans存最小的最大值
    //注意： 本题若求最大的最大值， 则只需去除任意叶节点即可， 即 n-1
    return sum + 1;//各个子连通块， 当前节点之和
}
int main()
{
    scanf("%d", &n);
    memset(h, -1, sizeof h);//n个头节点全部指向 -1
    for (int i = 0; i < n - 1; i ++ )//n个结点， n-1条边
    {
        int a, b;
        scanf("%d%d", &a, &b);
        add(a, b), add(b, a);//不知道子节点还是父节点， 所以需要建两条边可以双向查找
    }
    dfs(1);//结点编号为 1~n且可能只有一个结点， 则参数只能为 1
    printf("%d\\n", ans);
    return 0;
}
应用:      n- 皇后问题
using namespace std;
const int N = 11;
char q[N][N];//存储棋盘
bool dg[N * 2], udg[N * 2], cor[N];//点对应的两个斜线以及列上是否有皇后
int n;
void dfs(int r)
{
    if(r == n)//放满了棋盘， 输出棋盘
    {
        for(int i = 0; i < n; i++)
        {
            for(int j = 0; j < n; j++)
            cout << q[i][j];
            cout << endl;
        }
        cout << endl;
        return;
    }
    for(int i = 0; i < n; i++)//第  r 行， 第  i 列是否放皇后
    {
        if(!cor[i] && !dg[i + r] && !udg[n - i + r])//不冲突， 放皇后
        {
            q[r][i] = 'Q';
            cor[i] = dg[i + r] = udg[n - i + r] = 1;//对应的列，  斜线状态改变
            dfs(r + 1);//处理下一行
            cor[i] = dg[i + r] = udg[n - i + r] = 0;//恢复现场
            q[r][i] = '.';
        }
    }
}
int main()
{
    cin >> n;
    for (int i = 0; i < n; i ++ )
    for (int j = 0; j < n; j ++ )
    q[i][j] = '.';
    dfs(0);
    return 0;
}`,
    problems: [
      { pid: 'P5318', title: "【深基18.例3】查找文献" },
      { pid: 'P1706', title: "全排列问题" },
      { pid: 'P1605', title: "迷宫" },
    ],
    trainingSets: [112],
  },
  {
    id: 'tpl-graph-3',
    group: "竞赛代码模板 · 搜索与图论",
    title: "宽度优先遍历 BFS",
    summary: "用队列一层层扩散，首次到达即最短路",
    points: [
      "用队列一层层扩散，首次到达即最短路",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `queue<int> q;
st[1] = true; // 表示 1号点已经被遍历过
q.push(1); // 1号点入队
while (q.size())
{
    // 移出节点
    int t = q.front();
    q.pop();
    // 获取被移出的节点的下一层所有节点
    for (int i = h[t]; i != -1; i = ne[i])
    {
        // 获取节点值
        int j = e[i];
        // 将下一层所有未遍历过的节点入队列
        if (!st[j])
        {
            st[j] = true; // 表示点 j已经被遍历过
            q.push(j);
        }
    }
}
// 应用:走迷宫
typedef pair<int,int> PII;// 声明 pair时候必须要在代码前面写上 using namespace std;
const int N=110;
int g[N][N],f[N][N],n,m;
int bfs(int x,int y){
    queue<PII> que;
    que.push({x,y});
    int dx[4]={0,1,0,-1},dy[4]={1,0,-1,0};
    while(!que.empty()){
        PII t=que.front();
        que.pop();
        g[t.first][t.second]=1;
        for(int i=0;i<4;i++){
            int a=t.first+dx[i],b=t.second+dy[i];
            if(a>=0&&b>=0&&a<n&&b<m&&!g[a][b]){
                g[a][b]=1;
                f[a][b]=f[t.first][t.second]+1;
                que.push({a,b});
            }
        }
    }
    return f[n-1][m-1];
}
int main(){
    scanf("%d%d",&n,&m);
    for(int i=0;i<n;i++)
    for(int j=0;j<m;j++)
    scanf("%d",&g[i][j]);
    cout<<bfs(0,0)<<endl;
    return 0;
}
// 应用:八数码
using namespace std;
int bfs(string state) {
    queue<string> q;
    unordered_map<string, int> d;
    int dx[4] = {-1, 0, 1, 0}, dy[4] = {0, 1, 0, -1};
    string ed = "12345678x";
    q.push(state);
    d[state] = 0;
    while (q.size()) {
        auto t = q.front();
        q.pop();
        if (t == ed)//等于结果就输出步数
        return d[t];
        int distance = d[t];
        int k = t.find('x');//寻找 x
        int x = k / 3, y = k % 3;//计算下标
        for (int i = 0; i < 4; i ++ ) {
            int a = x + dx[i], b = y + dy[i];
            if (a >= 0 && a < 3 && b >= 0 && b < 3) {
                swap(t[a * 3 + b], t[k]);//交换
                if (!d.count(t)) {//不存在就入队
                    d[t] = distance + 1;
                    q.push(t);
                }
                swap(t[a * 3 + b], t[k]);//还原
            }
        }
    }
    return -1;
}
int main() {
    char s[2];
    string state;
    for (int i = 0; i < 9; i ++ ) {
        cin >> s;
        state += *s;
    }
    cout<<bfs(state)<<endl;
    return 0;
}`,
    problems: [
      { pid: 'P1443', title: "马的遍历" },
      { pid: 'P1135', title: "奇怪的电梯" },
      { pid: 'P1746', title: "离开中山路" },
    ],
    trainingSets: [112],
  },
  {
    id: 'tpl-graph-4',
    group: "竞赛代码模板 · 搜索与图论",
    title: "拓扑排序",
    summary: "有向无环图求合法顺序，能判环",
    points: [
      "有向无环图求合法顺序，能判环",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `bool topsort()
{
    int hh = 0, tt = -1;
    // d[i] 存储点 i的入度
    for (int i = 1; i <= n; i ++ )
    if (!d[i])
    q[ ++ tt] = i;
    while (hh <= tt)
    {
        int t = q[hh ++ ];
        for (int i = h[t]; i != -1; i = ne[i])
        {
            int j = e[i];
            if (-- d[j] == 0)
            q[ ++ tt] = j;
        }
    }
    // 如果所有点都入队了， 说明存在拓扑序列； 否则不存在拓扑序列。
    return tt == n - 1;
}
// 解说版
using namespace std;
const int N = 100010;
int e[N], ne[N], idx; //邻接表存储图
int h[N];//邻接表的每个头链表
int q[N], hh = 0, tt = -1; //队列保存入度为 0的点， 也就是能够输出的点
int n, m; //保存图的点数和边数
int d[N];//保存各个点的入度
void add(int a, int b) {
    e[idx] = b, ne[idx] = h[a], h[a] = idx++;
}
void topsort() {
    for (int i = 1; i <= n; i++) {//遍历一遍顶点的入度。
        if (!d[i])//如果入度为 0， 则可以入队列
        q[++tt] = i;
    }
    while (tt >= hh) { //循环处理队列中点的
        int a = q[hh++];
        for (int i = h[a]; i != -1; i = ne[i]) {
            int b = e[i]; //a 有一条边指向 b
            d[b]--;//删除边后， b的入度减 1
            if (!d[b])//如果 b的入度减为  0,则  b 可以输出， 入队列
            q[++tt] = b;
        }
    }
    if (tt == n - 1) {//如果队列中的点的个数与图中点的个数相同， 则可以进行拓扑排序
        for (int i = 0; i < n; i++)//队列中保存了所有入度为 0的点， 依次输出
        printf("%d ", q[i]);
    } else//如果队列中的点的个数与图中点的个数不相同， 则可以进行拓扑排序
    cout << -1;
}
int main() {
    cin >> n >> m; //保存点的个数和边的个数
    memset(h, -1, sizeof h); //初始化领接矩阵
    while (m--) { //依次读入边
        int a, b;
        cin >> a >> b;
        d[b]++;//顶点 b的入度 +1
        add(a, b); //添加到邻接矩阵
    }
    topsort();//进行拓扑排序
    return 0;
}`,
    problems: [
      { pid: 'P1113', title: "[USACO02FEB] 杂务" },
      { pid: 'P1347', title: "[ECNA 2001] 排序" },
      { pid: 'P1038', title: "[NOIP 2003 提高组] 神经网络" },
    ],
    trainingSets: [116],
  },
  {
    id: 'tpl-graph-5',
    group: "竞赛代码模板 · 搜索与图论",
    title: "Dijkstra 最短路",
    summary: "边权非负的单源最短路，堆优化 O(m log n)",
    points: [
      "边权非负的单源最短路，堆优化 O(m log n)",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int g[N][N];  // 存储每条边
int dist[N];  // 存储 1号点到每个点的最短距离
bool st[N];   // 存储每个点的最短路是否已经确定
// 求 1号点到 n号点的最短路， 如果不存在则返回 -1
int dijkstra()
{
    memset(dist, 0x3f, sizeof dist);
    dist[1] = 0;
    for (int i = 0; i < n - 1; i ++ )
    {
        int t = -1;     // 每次在还未确定最短路的点中， 寻找距离最小的点
        for (int j = 1; j <= n; j ++ )
        if (!st[j] && (t == -1 || dist[t] > dist[j]))
        t = j;
        // 用 t更新其他点的距离
        for (int j = 1; j <= n; j ++ )
        dist[j] = min(dist[j], dist[t] + g[t][j]);
        st[t] = true;
    }
    if (dist[n] == 0x3f3f3f3f) return -1;
    return dist[n];
}
// 应用
const int N = 510, M = 100010;
int h[N], e[M], ne[M], w[M], idx;//邻接表存储图
int state[N];//state 记录是否找到了源点到该节点的最短距离
int dist[N];//dist 数组保存源点到其余各个节点的距离
int n, m;//图的节点个数和边数
void add(int a, int b, int c)//插入边
{
    e[idx] = b, w[idx] = c, ne[idx] = h[a], h[a] = idx++;
}
void Dijkstra()
{
    memset(dist, 0x3f, sizeof(dist));//dist 数组的各个元素为无穷大
    dist[1] = 0;//源点到源点的距离为置为  0
    for (int i = 0; i < n; i++)
    {
        int t = -1;
        for (int j = 1; j <= n; j++)//遍历  dist 数组， 找到没有确定最短路径的节点中
// 距离源点最近的点 t
        {
            if (!state[j] && (t == -1 || dist[j] < dist[t]))
            t = j;
        }
        state[t] = 1;//state[i] 置为  1。
        for (int j = h[t]; j != -1; j = ne[j])//遍历  t 所有可以到达的节点  i
        {
            int i = e[j];
            dist[i] = min(dist[i], dist[t] + w[j]);//更新  dist[j]
        }
    }
}
int main()
{
    memset(h, -1, sizeof(h));//邻接表初始化
    cin >> n >> m;
    while (m--)//读入  m 条边
    {
        int a, b, w;
        cin >> a >> b >> w;
        add(a, b, w);
    }
    Dijkstra();
    if (dist[n] != 0x3f3f3f3f)//如果 dist[n]被更新了， 则存在路径
    cout << dist[n];
    else
    cout << "-1";
}
// 堆优化版
// 时间复杂度, n表示点数,        m 表示边数
typedef pair<int, int> PII;
int n;      // 点的数量
int h[N], w[N], e[N], ne[N], idx;       // 邻接表存储所有边
int dist[N];        // 存储所有点到 1号点的距离
bool st[N];     // 存储每个点的最短距离是否已确定
// 求 1号点到 n号点的最短距离， 如果不存在， 则返回 -1
int dijkstra(){
    memset(dist,0x3f,sizeof dist);//距离初始化为无穷大
    dist[1]=0;//1->1的节点距离为 0
    priority_queue<PII,vector<PII>,greater<PII>> heap;//小根堆
    heap.push({0,1});//插入距离和节点编号
    while(heap.size()){
        auto t=heap.top();//取距离源点最近的点
        heap.pop();
        int ver=t.second,distance=t.first;//ver： 节点编号， distance源点距离 ver
        if(st[ver])continue;//如果距离已经确定， 则跳过该点
        st[ver]=true;
        for(int i=h[ver];i!=-1;i=ne[i])//更新 ver所指向的节点距离
        {
            int j=e[i];
            if(dist[j]>dist[ver]+w[i]){
                dist[j]=dist[ver]+w[i];
                heap.push({dist[j],j});//距离变小， 则入堆
            }
        }
    }
    if(dist[n]==0x3f3f3f3f)return -1;
    return dist[n];
}
// 关于   Dijkstra      的相关博客链接:
[AcWing 849. Dijkstra            求最短路       I:图解详细代码(图解)             - AcWing: https://www.acwing.com/s
olution/content/38318/
[AcWing 850. Dijkstra            求最短路       II:详解     +代码注释       - AcWing]: https://www.acwing.com/solutio
n/content/38323/`,
    problems: [
      { pid: 'P4779', title: "【模板】单源最短路径（标准版）" },
      { pid: 'P3371', title: "【模板】单源最短路径（弱化版）" },
      { pid: 'P1629', title: "邮递员送信" },
    ],
    trainingSets: [208],
  },
  {
    id: 'tpl-graph-6',
    group: "竞赛代码模板 · 搜索与图论",
    title: "Bellman-Ford",
    summary: "能处理负权边，可判负环，O(nm)",
    points: [
      "能处理负权边，可判负环，O(nm)",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int n, m;       // n表示点数， m表示边数
int dist[N],backup[N];        // dist[x]存储 1到 x的最短路距离
struct Edge     // 边， a表示出点， b表示入点， w表示边的权重
{
    int a, b, w;
}edges[M];
// 求 1到 n的最短路距离， 如果无法从 1走到 n， 则返回 -1。
int bellman_ford()
{
    memset(dist, 0x3f, sizeof dist);
    dist[1] = 0;
    // 如果第 n次迭代仍然会松弛三角不等式， 就说明存在一条长度是 n+1的最短路径， 由抽屉原理，
// 路径中至少存在两个相同的点, 说明图中存在负权回路。
    for (int i = 0; i < n; i ++ )
    {
        memcpy(backup,dist,sizeof dist);
        for (int j = 0; j < m; j ++ )
        {
            int a = edges[j].a, b = edges[j].b, w = edges[j].w;
            if (dist[b] > backup[a] + w)
            dist[b] = backup[a] + w;
        }
    }
    if (dist[n] > 0x3f3f3f3f / 2) return -1;
    return dist[n];
}
// 应用
int n,m,k;
const int N=512,M=10012;
struct Edge{
    int a,b,w;
}e[M];
int dist[N];
int backup[N];
void bellman_ford(){
    memset(dist,0x3f,sizeof dist);
    dist[1]=0;
    for(int i=0;i<k;i++){
        memcpy(backup,dist,sizeof dist);
        for(int j=0;j<m;j++){
            int a=e[j].a,b=e[j].b,c=e[j].w;
            dist[b]=min(dist[b],backup[a]+c);
        }
    }
}
int main(){
    scanf("%d%d%d",&n,&m,&k);
    for(int i=0;i<m;i++){
        int a,b,w;
        scanf("%d%d%d",&a,&b,&w);
        e[i]={a,b,w};
    }
    bellman_ford();
    if(dist[n]>0x3f3f3f3f/2)cout<<"impossible"<<endl;
    else cout<<dist[n]<<endl;
    return 0;
}
// 问题:为什么把每一条边用不等式刷            k次就是     k条件下的值？
你可以想象这个图是            1->2->3->4....->n            这样一条直线.比如说第一次迭代,为什么只有与原点相连
的点才能被更新            dist  呢?因为原点的            dist  是 0,其他点的        dist  是 +∞,满足     dist[2] > dist[1]+c,而   +∞并
不 >+ ∞+c,所以第一次迭代结束就是不超过一条边走到            i节点最短路的距离,依次类推,第二次迭
代,只有      3会被更新,因为只有            1, 2的 dist  不是   +∞,第二次迭代就是不超过            2条边走到      i节点的最短
距离.这就是为什么            k次迭代最多是走了            k条边,同时也是为什么一共只用迭代            n-1  次,因为      n个点的
有向图,如果能走到,原点到            n号点的最短距离最多是            n-1  次,也就是        1->2->…->n         直线这种.`,
    problems: [
      { pid: 'P3385', title: "【模板】负环" },
      { pid: 'P3371', title: "【模板】单源最短路径（弱化版）" },
      { pid: 'P3905', title: "道路重建" },
    ],
    trainingSets: [208],
  },
  {
    id: 'tpl-graph-7',
    group: "竞赛代码模板 · 搜索与图论",
    title: "SPFA",
    summary: "队列优化的 Bellman-Ford，平均很快但最坏 O(nm)",
    points: [
      "队列优化的 Bellman-Ford，平均很快但最坏 O(nm)",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int n;      // 总点数
int h[N], w[N], e[N], ne[N], idx;       // 邻接表存储所有边
int dist[N];        // 存储每个点到 1号点的最短距离
bool st[N];     // 存储每个点是否在队列中
// 求 1号点到 n号点的最短路距离， 如果从 1号点无法走到 n号点则返回 -1
int spfa()
{
    memset(dist, 0x3f, sizeof dist);
    dist[1] = 0;
    queue<int> q;
    q.push(1);
    st[1] = true;
    while (q.size())
    {
        auto t = q.front();
        q.pop();
        st[t] = false;
        for (int i = h[t]; i != -1; i = ne[i])
        {
            int j = e[i];
            if (dist[j] > dist[t] + w[i])
            {
                dist[j] = dist[t] + w[i];
                if (!st[j])     // 如果队列中已存在 j， 则不需要将 j重复插入
                {
                    q.push(j);
                    st[j] = true;
                }
            }
        }
    }
    if (dist[n] == 0x3f3f3f3f) return -1;
    return dist[n];
}
// 应用
const int N = 1e6 + 10;
int n, m;//节点数量和边数
int h[N], w[N], e[N], ne[N], idx;//邻接矩阵存储图
int dist[N];//存储距离
bool st[N];//存储状态
void add(int a, int b, int c)
{
    e[idx] = b, w[idx] = c, ne[idx] = h[a], h[a] = idx ++ ;
}
int spfa()
{
    memset(dist, 0x3f, sizeof dist);//距离初始化为无穷大
    dist[1] = 0;//初始化 1到 1的距离为 0
    queue<int> que;//队列
    que.push(1);//1入队
    while (que.size())//判断是否存在
    {
        int t=que.front();
        que.pop();//获取第一个并出队
        st[t]=false;//第一个取消占用
        for(int i=h[t];i!=-1;i=ne[i]){//遍历第一个可以到达的结点
            int j=e[i];
            if(dist[j]>dist[t]+w[i]){//1号点可到达的节点距离是否大于上次的距离距离加
// 上当前的距离
                dist[j]=dist[t]+w[i];//赋值给可到达的节点
                if(!st[j]){//如果可到达的节点未被占用
                    que.push(j);//则入队
                    st[j]=true;//占用
                }
            }
        }
    }
    return dist[n];
}
int main()
{
    scanf("%d%d", &n, &m);
    memset(h, -1, sizeof h);
    while (m -- )
    {
        int a, b, c;
        scanf("%d%d%d", &a, &b, &c);
        add(a, b, c);
    }
    int t=spfa();
    if(t==0x3f3f3f3f)cout<<"impossible"<<endl;
    else printf("%d\\n",t);
    return 0;
}
// 应用:       spfa     判断图中是否存在负权
int n;      // 总点数
int h[N], w[N], e[N], ne[N], idx;       // 邻接表存储所有边
int dist[N], cnt[N];        // dist[x]存储 1号点到 x的最短距离， cnt[x]存储 1到 x的最短
// 路中经过的点数
bool st[N];     // 存储每个点是否在队列中
// 如果存在负环， 则返回 true， 否则返回 false。
bool spfa()
{
    // 不需要初始化 dist数组
    // 原理： 如果某条最短路径上有 n个点 （除了自己）， 那么加上自己之后一共有 n+1个点， 由抽屉
// 原理一定有两个点相同, 所以存在环。
    queue<int> q;
    for (int i = 1; i <= n; i ++ )
    {
        q.push(i);
        st[i] = true;
    }
    while (q.size())
    {
        auto t = q.front();
        q.pop();
        st[t] = false;
        for (int i = h[t]; i != -1; i = ne[i])
        {
            int j = e[i];
            if (dist[j] > dist[t] + w[i])
            {
                dist[j] = dist[t] + w[i];
                cnt[j] = cnt[t] + 1;
                if (cnt[j] >= n) return true;       // 如果从 1号点到 x的最短路中包
                含至少 n个点 (不包括自己), 则说明存在环
                if (!st[j])
                {
                    q.push(j);
                    st[j] = true;
                }
            }
        }
    }
    return false;
}`,
    problems: [
      { pid: 'P3371', title: "【模板】单源最短路径（弱化版）" },
      { pid: 'P3385', title: "【模板】负环" },
      { pid: 'P1144', title: "最短路计数" },
    ],
    trainingSets: [208],
  },
  {
    id: 'tpl-graph-8',
    group: "竞赛代码模板 · 搜索与图论",
    title: "Floyd 多源最短路",
    summary: "三重循环 O(n³)，能求任意两点最短路",
    points: [
      "三重循环 O(n³)，能求任意两点最短路",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `for (int i = 1; i <= n; i ++ )
for (int j = 1; j <= n; j ++ )
if (i == j) d[i][j] = 0;
else d[i][j] = INF;
// 算法结束后， d[a][b]表示 a到 b的最短距离
void floyd()
{
    for (int k = 1; k <= n; k ++ )//k为中转节点
    for (int i = 1; i <= n; i ++ )
    for (int j = 1; j <= n; j ++ )
    d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
}
// 应用
using namespace std;
const int N = 210, INF = 1e9;
int n, m, Q;
int d[N][N];
void floyd()
{
    for (int k = 1; k <= n; k ++ )//k为中转节点
    for (int i = 1; i <= n; i ++ )
    for (int j = 1; j <= n; j ++ )
    d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
}
int main()
{
    scanf("%d%d%d", &n, &m, &Q);
    for (int i = 1; i <= n; i ++ )
    for (int j = 1; j <= n; j ++ )
    if (i == j) d[i][j] = 0;
    else d[i][j] = INF;
    while (m -- )
    {
        int a, b, c;
        scanf("%d%d%d", &a, &b, &c);
        d[a][b] = min(d[a][b], c);
    }
    floyd();
    while (Q -- )
    {
        int a, b;
        scanf("%d%d", &a, &b);
        int t = d[a][b];
        if (t > INF / 2) puts("impossible");
        else printf("%d\\n", t);
    }
    return 0;
}`,
    problems: [
      { pid: 'P2419', title: "[USACO08JAN] Cow Contest S" },
      { pid: 'P1522', title: "[USACO2.4] 牛的旅行 Cow Tours" },
      { pid: 'P1119', title: "灾后重建" },
    ],
    trainingSets: [208],
  },
  {
    id: 'tpl-graph-9',
    group: "竞赛代码模板 · 搜索与图论",
    title: "Prim 最小生成树",
    summary: "从点出发扩展，稠密图 O(n²) 更优",
    points: [
      "从点出发扩展，稠密图 O(n²) 更优",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int n;      // n表示点数
int g[N][N];        // 邻接矩阵， 存储所有边
int dist[N];        // 存储其他点到当前最小生成树的距离
bool st[N];     // 存储每个点是否已经在生成树中
// 如果图不连通， 则返回 INF(值是 0x3f3f3f3f), 否则返回最小生成树的树边权重之和
int prim()
{
    memset(dist, 0x3f, sizeof dist);
    int res = 0;
    for (int i = 0; i < n; i ++ )
    {
        int t = -1;
        for (int j = 1; j <= n; j ++ )
        if (!st[j] && (t == -1 || dist[t] > dist[j]))
        t = j;
        if (i && dist[t] == INF) return INF;
        if (i) res += dist[t];
        st[t] = true;
        for (int j = 1; j <= n; j ++ ) dist[j] = min(dist[j], g[t][j]);
    }
    return res;
}
// 应用
const int N = 510, INF = 0x3f3f3f3f;
int n, m;
int g[N][N];
int dist[N];
bool st[N];
int prim()
{
    memset(dist, 0x3f, sizeof dist);
    int res = 0;
    for (int i = 0; i < n; i ++ )
    {
        int t = -1;
        for (int j = 1; j <= n; j ++ )
        if (!st[j] && (t == -1 || dist[t] > dist[j]))
        t = j;
        if (i && dist[t] == INF) return INF;
        if (i) res += dist[t];
        st[t] = true;
        for (int j = 1; j <= n; j ++ ) dist[j] = min(dist[j], g[t][j]);
    }
    return res;
}
int main()
{
    scanf("%d%d", &n, &m);
    memset(g, 0x3f, sizeof g);
    while (m -- )
    {
        int a, b, c;
        scanf("%d%d%d", &a, &b, &c);
        g[a][b] = g[b][a] = min(g[a][b], c);
    }
    int t = prim();
    if (t == INF) puts("impossible");
    else printf("%d\\n", t);
    return 0;
}`,
    problems: [
      { pid: 'P1265', title: "公路修建" },
      { pid: 'P1547', title: "[USACO05MAR] Out of Hay S" },
      { pid: 'P2121', title: "拆地毯" },
    ],
    trainingSets: [209],
  },
  {
    id: 'tpl-graph-10',
    group: "竞赛代码模板 · 搜索与图论",
    title: "Kruskal 最小生成树",
    summary: "边排序 + 并查集判环，稀疏图 O(m log m)",
    points: [
      "边排序 + 并查集判环，稀疏图 O(m log m)",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `int n, m;       // n是点数， m是边数
int p[N];       // 并查集的父节点数组
struct Edge     // 存储边
{
    int a, b, w;
    bool operator< (const Edge &W)const
    {
        return w < W.w;
    }
}edges[M];
int find(int x)     // 并查集核心操作
{
    if (p[x] != x) p[x] = find(p[x]);
    return p[x];
}
int kruskal()
{
    sort(edges, edges + m);
    for (int i = 1; i <= n; i ++ ) p[i] = i;    // 初始化并查集
    int res = 0, cnt = 0;
    for (int i = 0; i < m; i ++ )
    {
        int a = edges[i].a, b = edges[i].b, w = edges[i].w;
        a = find(a), b = find(b);
        if (a != b)     // 如果两个连通块不连通， 则将这两个连通块合并
        {
            p[a] = b;
            res += w;
            cnt ++ ;
        }
    }
    if (cnt < n - 1) return INF;
    return res;
}
// 应用
#include <cstring>
#include <iostream>
#include <algorithm>
using namespace std;
const int N = 100010, M = 200010, INF = 0x3f3f3f3f;
int n, m;
int p[N];
struct Edge
{
    int a, b, w;
    bool operator< (const Edge &W)const
    {
        return w < W.w;
    }
}edges[M];
int find(int x)
{
    if (p[x] != x) p[x] = find(p[x]);
    return p[x];
}
int kruskal()
{
    sort(edges, edges + m);
    for (int i = 1; i <= n; i ++ ) p[i] = i;    // 初始化并查集
    int res = 0, cnt = 0;
    for (int i = 0; i < m; i ++ )
    {
        int a = edges[i].a, b = edges[i].b, w = edges[i].w;
        a = find(a), b = find(b);
        if (a != b)
        {
            p[a] = b;
            res += w;
            cnt ++ ;
        }
    }
    if (cnt < n - 1) return INF;
    return res;
}
int main()
{
    scanf("%d%d", &n, &m);
    for (int i = 0; i < m; i ++ )
    {
        int a, b, w;
        scanf("%d%d%d", &a, &b, &w);
        edges[i] = {a, b, w};
    }
    int t = kruskal();
    if (t == INF) puts("impossible");
    else printf("%d\\n", t);
    return 0;
}`,
    problems: [
      { pid: 'P3366', title: "【模板】最小生成树" },
      { pid: 'P1546', title: "[USACO3.1] 最短网络 Agri-Net" },
      { pid: 'P1195', title: "口袋的天空" },
    ],
    trainingSets: [209],
  },
  {
    id: 'tpl-math-1',
    group: "竞赛代码模板 · 数学知识",
    title: "试除法判定质数",
    summary: "O(√n) 判断单个数是不是质数",
    points: [
      "O(√n) 判断单个数是不是质数",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `bool is_prime(int x)
{
    if (x < 2) return false;
    for (int i = 2; i <= x / i; i ++ )
    if (x % i == 0)
    return false;
    return true;
}`,
    problems: [
      { pid: 'P5736', title: "【深基7.例2】质数筛" },
      { pid: 'P3383', title: "【模板】线性筛素数" },
      { pid: 'B2136', title: "素数回文数的个数" },
    ],
    trainingSets: [117],
  },
  {
    id: 'tpl-math-2',
    group: "竞赛代码模板 · 数学知识",
    title: "分解质因数",
    summary: "把 n 拆成质因子乘积，顺带求因子个数与和",
    points: [
      "把 n 拆成质因子乘积，顺带求因子个数与和",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `void divide(int x)
{
    for (int i = 2; i <= x / i; i ++ )
    if (x % i == 0)//i 一定是质数
    {
        int s = 0;
        while (x % i == 0) x /= i, s ++ ;
        cout << i << ' ' << s << endl;
    }
    if (x > 1) cout << x << ' ' << 1 << endl;
    cout << endl;
}`,
    problems: [
      { pid: 'P1075', title: "[NOIP 2012 普及组] 质因数分解" },
      { pid: 'P2563', title: "[AHOI2001] 质数和分解" },
      { pid: 'P2043', title: "质因子分解" },
    ],
    trainingSets: [117],
  },
  {
    id: 'tpl-math-3',
    group: "竞赛代码模板 · 数学知识",
    title: "埃氏筛",
    summary: "筛出 1~n 所有质数，O(n log log n)",
    points: [
      "筛出 1~n 所有质数，O(n log log n)",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `int primes[N], cnt;     // primes[]存储所有素数
bool st[N];         // st[x]存储 x是否被筛掉
void get_primes(int n)
{
    for (int i = 2; i <= n; i ++ )
    {
        if (st[i]) continue;
        primes[cnt ++ ] = i;
        for (int j = i + i; j <= n; j += i)
        st[j] = true;
    }
}`,
    problems: [
      { pid: 'P5736', title: "【深基7.例2】质数筛" },
      { pid: 'P1835', title: "素数密度" },
      { pid: 'P3383', title: "【模板】线性筛素数" },
    ],
    trainingSets: [117],
  },
  {
    id: 'tpl-math-4',
    group: "竞赛代码模板 · 数学知识",
    title: "线性筛",
    summary: "每个合数只被最小质因子筛一次，O(n)",
    points: [
      "每个合数只被最小质因子筛一次，O(n)",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `int primes[N], cnt;     // primes[]存储所有素数
bool st[N];         // st[x]存储 x是否被筛掉
void get_primes(int n)
{
    for (int i = 2; i <= n; i ++ )
    {
        if (!st[i]) primes[cnt ++ ] = i;
        for (int j = 0; primes[j] <= n / i; j ++ )
        {
            st[primes[j] * i] = true;
            if (i % primes[j] == 0) break;
        }
    }
}`,
    problems: [
      { pid: 'P3383', title: "【模板】线性筛素数" },
      { pid: 'P1835', title: "素数密度" },
      { pid: 'P3912', title: "素数个数" },
    ],
    trainingSets: [117],
  },
  {
    id: 'tpl-math-5',
    group: "竞赛代码模板 · 数学知识",
    title: "求所有约数",
    summary: "成对枚举到 √n",
    points: [
      "成对枚举到 √n",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `{
    vector<int> res;
    for (int i = 1; i <= x / i; i ++ )
    if (x % i == 0)
    {
        res.push_back(i);
        if (i != x / i) res.push_back(x / i);
    }
    sort(res.begin(), res.end());
    return res;
}`,
        problems: [
      { pid: 'P1403', title: "[AHOI2005] 约数研究" },
      { pid: 'P1463', title: "[POI 2001 R1 / ZJOI2006 / HAOI2007] 反素数" },
      { pid: 'P2424', title: "约数和" },
    ],
    trainingSets: [117],
  },
  {
    id: 'tpl-math-6',
    group: "竞赛代码模板 · 数学知识",
    title: "欧几里得算法",
    summary: "辗转相除求 gcd，O(log n)",
    points: [
      "辗转相除求 gcd，O(log n)",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `int gcd(int a, int b)
{
    return b ? gcd(b, a % b) : a;
}`,
        problems: [
      { pid: 'P1029', title: "[NOIP 2001 普及组] 最大公约数和最小公倍数问题" },
      { pid: 'P4549', title: "【模板】裴蜀定理" },
      { pid: 'P4057', title: "[Code+#1] 晨跑" },
    ],
    trainingSets: [117],
  },
  {
    id: 'tpl-math-7',
    group: "竞赛代码模板 · 数学知识",
    title: "最小公倍数",
    summary: "lcm = a / gcd(a,b) * b，先除后乘防溢出",
    points: [
      "lcm = a / gcd(a,b) * b，先除后乘防溢出",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `int lcm(int a, int b)
{
    return abs(a * b) / gcd(a, b);
}`,
    problems: [
      { pid: 'P1029', title: "[NOIP 2001 普及组] 最大公约数和最小公倍数问题" },
      { pid: 'P4057', title: "[Code+#1] 晨跑" },
      { pid: 'P4626', title: "一道水题 II" },
    ],
    trainingSets: [117],
  },
  {
    id: 'tpl-math-8',
    group: "竞赛代码模板 · 数学知识",
    title: "快速幂",
    summary: "O(log b) 求 a^b mod p",
    points: [
      "O(log b) 求 a^b mod p",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `// 求  m^k mod p， 时间复杂度  O(logk)。
// m为底数， k为幂
int qmi(int m, int k, int p)
{
    int res = 1 % p, t = m;
    while (k)
    {
        if (k&1) res = res * t % p;
        t = t * t % p;
        k >>= 1;
    }
    return res;
}`,
    problems: [
      { pid: 'P1226', title: "【模板】快速幂" },
      { pid: 'P1045', title: "[NOIP 2003 普及组] 麦森数" },
      { pid: 'P1965', title: "[NOIP 2013 提高组] 转圈游戏" },
    ],
    trainingSets: [216],
  },
  {
    id: 'tpl-math-9',
    group: "竞赛代码模板 · 数学知识",
    title: "扩展欧几里得",
    summary: "求 ax + by = gcd(a,b) 的一组解，用于求逆元",
    points: [
      "求 ax + by = gcd(a,b) 的一组解，用于求逆元",
      "形态：代码片段（片段需要自备数组与常量声明）",
      "使用前把需要的全局数组（如 N、M）和头文件补上",
    ],
    code: `// 求 x, y， 使得 ax + by = gcd(a, b)
int exgcd(int a, int b, int &x, int &y)
{
    if (!b)
    {
        x = 1, y = 0;
        return a;
    }
    int d = exgcd(b, a % b, y, x);
    y -= (a/b) * x;
    return d;
}`,
    problems: [
      { pid: 'P1082', title: "[NOIP 2012 提高组] 同余方程" },
      { pid: 'P5656', title: "【模板】二元一次不定方程 (exgcd)" },
      { pid: 'P1516', title: "[ZJOI2002] 青蛙的约会" },
    ],
    trainingSets: [216],
  },
  {
    id: 'tpl-dp-1',
    group: "竞赛代码模板 · 动态规划",
    title: "01 背包",
    summary: "每件物品只能选一次，倒序遍历容量防止重复取",
    points: [
      "每件物品只能选一次，倒序遍历容量防止重复取",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `using namespace std;
const int N=1010;
int n,m;
int v[N],w[N];//v代表体积， w代表价值
int f[N][N];
int main(){
    cin>>n>>m;
    for(int i=1;i<=n;i++)cin>>v[i]>>w[i];
    for(int i=1;i<=n;i++)//i代表这 n件物品
    {
        for(int j=1;j<=m;j++){//j代表背包容量
            if(v[i]>j)//如果 v[i]的容量大于当前的背包容量则不装进行下一个
            f[i][j]=f[i-1][j];
            else f[i][j]=max(f[i-1][j],f[i-1][j-v[i]]+w[i]);//如果 v[i]的容量小
// 于当前背包容量则可以选择装与不装得到最大值
        }
    }
    cout<<f[n][m]<<endl;//输出最后的一个一定是最大的
    return 0;
}
// 01 背包,使用滚动数组,倒序遍历
using namespace std;
const int N=1010;
int n,m;
int v[N],w[N];//v代表体积， w代表价值
int dp[N];
int main(){
    cin>>n>>m;
    for(int i=1;i<=n;i++)//
// i代表这 n件物品
    {
        cin>>v[i]>>w[i];//在线算法
        for(int j=m;j>=v[i];j--){//j代表背包容量， 滚动数组必须倒序遍历
            dp[j]=max(dp[j],dp[j-v[i]]+w[i]);//滚动数组
        }
    }
    cout<<dp[m]<<endl;//输出最后的一个一定是最大的
    return 0;
}
状态转移方程: dp[j]=max(dp[j],dp[j-v[i]]+w[i]);`,
    problems: [
      { pid: 'P1048', title: "[NOIP 2005 普及组] 采药" },
      { pid: 'P1060', title: "[NOIP 2006 普及组] 开心的金明" },
      { pid: 'P2871', title: "[USACO07DEC] Charm Bracelet S" },
    ],
    trainingSets: [211],
  },
  {
    id: 'tpl-dp-2',
    group: "竞赛代码模板 · 动态规划",
    title: "完全背包",
    summary: "每件物品可以无限取，正序遍历容量",
    points: [
      "每件物品可以无限取，正序遍历容量",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `using namespace std;
int v[N],w[N];
int dp[N];
int main(){
    int n,m;
    cin>>n>>m;
    for(int i=1;i<=n;i++){//遍历物品
        cin>>v[i]>>w[i];//在线算法
        for(int j=v[i];j<=m;j++){//正序遍历背包容量
            dp[j]=max(dp[j],dp[j-v[i]]+w[i]);//滚动数组
        }
    }
    cout<<dp[m]<<endl;//输出答案
    return 0;
}
完全背包问题和            01 背包优化版的区别在于第二重循环的            v[i]  和 m 做交换
状态转移方程: dp[j]=max(dp[j],dp[j-v[i]]+w[i]);`,
    problems: [
      { pid: 'P1616', title: "疯狂的采药" },
      { pid: 'P2722', title: "[USACO3.1] 总分 Score Inflation" },
      { pid: 'P1853', title: "[NWERC 2004] 投资的最大效益" },
    ],
    trainingSets: [211],
  },
  {
    id: 'tpl-dp-3',
    group: "竞赛代码模板 · 动态规划",
    title: "多重背包（二进制优化）",
    summary: "每件有数量上限，打包成 1,2,4,8… 转成 01 背包",
    points: [
      "每件有数量上限，打包成 1,2,4,8… 转成 01 背包",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `using namespace std;
int n,m;
int v[N],w[N],s[N];
int dp[N][N];
int main(){
    cin>>n>>m;
    for(int i=1;i<=n;i++)cin>>v[i]>>w[i]>>s[i];
    for(int i=1;i<=n;i++)//物品
    for(int j=0;j<=m;j++)//背包容量
    for(int k=0;k<=s[i]&&k*v[i]<=j;k++)
    dp[i][j]=max(dp[i][j],dp[i-1][j-v[i]*k]+w[i]*k);
    cout<<dp[n][m]<<endl;
    return 0;
}
状态转移方程:            dp[i][j]=max(dp[i][j],dp[i-1][j-v[i]*k]+w[i]*k); k为第   i个物品的个数
多重背包问题            2(  二进制优化            )
// 思路:     转换成     2进制,再用        01 背包求解
视频讲解:        [410    背包   DP   多重背包二进制优化[动态规划]            哔哩哔哩      bilibili]: https://www.bilibili.
com/video/BV1MA41177cg/
using namespace std;
const int N = 12010, M = 2010;
int n, m;
int v[N], w[N];
int f[M];
int main()
{
    cin >> n >> m;
    int cnt = 0;
    for (int i = 1; i <= n; i ++ )
    {
        int a, b, s;
        cin >> a >> b >> s;
        int k = 1;
        while (k <= s)
        {
            cnt ++ ;
            v[cnt] = a * k;
            w[cnt] = b * k;
            s -= k;
            k *= 2;
        }
        if (s > 0)
        {
            cnt ++ ;
            v[cnt] = a * s;
            w[cnt] = b * s;
        }
    }//二进制优化操作
    n = cnt;
    for (int i = 1; i <= n; i ++ )
    for (int j = m; j >= v[i]; j -- )
    f[j] = max(f[j], f[j - v[i]] + w[i]);
    cout << f[m] << endl;
    return 0;
}`,
    problems: [
      { pid: 'P1776', title: "宝物筛选" },
      { pid: 'P2340', title: "[USACO03FALL] Cow Exhibition G" },
      { pid: 'P1833', title: "樱花" },
    ],
    trainingSets: [211],
  },
  {
    id: 'tpl-dp-4',
    group: "竞赛代码模板 · 动态规划",
    title: "分组背包",
    summary: "每组只能选一件，三层循环顺序不能乱",
    points: [
      "每组只能选一件，三层循环顺序不能乱",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `using namespace std;
const int N=110;
int f[N];
int v[N][N],w[N][N],s[N];
int n,m,k;
int main(){
    cin>>n>>m;
    for(int i=0;i<n;i++){
        cin>>s[i];
        for(int j=0;j<s[i];j++){
            cin>>v[i][j]>>w[i][j];
        }
    }
    for(int i=0;i<n;i++){
        for(int j=m;j>=0;j--){
            for(int k=0;k<s[i];k++){    //for(int k=s[i];k>=1;k--)也可以
                if(j>=v[i][k])
                f[j]=max(f[j],f[j-v[i][k]]+w[i][k]);
            }
        }
    }
    cout<<f[m]<<endl;
}
状态转移方程: f[j]=max(f[j],f[j-v[i][k]]+w[i][k]);`,
    problems: [
      { pid: 'P1757', title: "通天之分组背包" },
      { pid: 'P1064', title: "[NOIP 2006 提高组] 金明的预算方案" },
      { pid: 'P1988', title: "火炬" },
    ],
    trainingSets: [211],
  },
  {
    id: 'tpl-dp-5',
    group: "竞赛代码模板 · 动态规划",
    title: "数字三角形",
    summary: "从顶到底最大路径和，自底向上递推更简单",
    points: [
      "从顶到底最大路径和，自底向上递推更简单",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `using namespace std;
const int N=510,INF=1e9;
int n;
int a[N][N];
int f[N][N];
int main(){
    scanf("%d",&n);
    for(int i=1;i<=n;i++){
        for(int j=1;j<=i;j++){
            scanf("%d",&a[i][j]);
        }
    }
    for(int i=0;i<=n;i++){
        for(int j=0;j<=i+1;j++){
            f[i][j]=-INF;
        }
    }
    f[1][1]=a[1][1];
    for(int i=2;i<=n;i++)
    for(int j=1;j<=i;j++)
    f[i][j]=max(f[i-1][j-1]+a[i][j],f[i-1][j]+a[i][j]);//状态转移方程
    int res=-INF;
    for(int i=1;i<=n;i++)res=max(res,f[n][i]);
    printf("%d",res);
    return 0;
}
状态转移方程: f[i][j]=max(f[i-1][j-1]+a[i][j],f[i-1][j]+a[i][j]);`,
    problems: [
      { pid: 'P1216', title: "[IOI 1994 / USACO1.5] 数字三角形 Number Triangles" },
      { pid: 'P1004', title: "[NOIP 2000 提高组] 方格取数" },
      { pid: 'P1006', title: "[NOIP 2008 提高组] 传纸条" },
    ],
    trainingSets: [212],
  },
  {
    id: 'tpl-greedy-1',
    group: "竞赛代码模板 · 贪心",
    title: "区间选点",
    summary: "按右端点排序，能选就选",
    points: [
      "按右端点排序，能选就选",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `using namespace std;
const int N = 100010;
int n;
struct Range{
    int l,r;
    bool operator <(const Range& W)const{
        return r<W.r;
    }//重载小于号
}range[N];
int main()
{
    scanf("%d", &n);
    for (int i = 0; i < n; i ++ ){
        int l,r;
        scanf("%d%d", &l, &r);
        range[i]={l,r};//读入 l,r
    }
    sort(range,range+n);//按右端点进行排序
    int res=0,ed=-2e9;//ed代表上一个点的右端点
    for (int i = 0; i < n; i ++ ){
        if(range[i].l>ed){
            res++;//点的数量加一
            ed=range[i].r;
        }
    }
    printf("%d\\n",res);
    return 0;
}`,
        problems: [
      { pid: 'P2082', title: "区间覆盖（加强版）" },
      { pid: 'P1803', title: "凌乱的yyy / 线段覆盖" },
      { pid: 'P1094', title: "[NOIP 2007 普及组] 纪念品分组" },
    ],
    trainingSets: [110],
  },
  {
    id: 'tpl-greedy-2',
    group: "竞赛代码模板 · 贪心",
    title: "最大不相交区间",
    summary: "按右端点排序贪心，选出的就是最大数量",
    points: [
      "按右端点排序贪心，选出的就是最大数量",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `using namespace std;
const int N = 100010;
int n;
struct Range{
    int l,r;
    bool operator <(const Range& W)const{
        return r<W.r;
    }
}range[N];
int main()
{
    scanf("%d", &n);
    for (int i = 0; i < n; i ++ ){
        int l,r;
        scanf("%d%d", &l, &r);
        range[i]={l,r};
    }
    sort(range,range+n);
    int res=0,ed=-2e9;
    for (int i = 0; i < n; i ++ ){
        if(range[i].l>ed){
            res++;
            ed=range[i].r;
        }
    }
    printf("%d\\n",res);
    return 0;
}`,
    problems: [
      { pid: 'P1803', title: "凌乱的yyy / 线段覆盖" },
      { pid: 'P1094', title: "[NOIP 2007 普及组] 纪念品分组" },
      { pid: 'P2645', title: "斯诺克" },
    ],
    trainingSets: [110],
  },
  {
    id: 'tpl-greedy-3',
    group: "竞赛代码模板 · 贪心",
    title: "区间分组",
    summary: "用小根堆维护每组最右端点，能放就放",
    points: [
      "用小根堆维护每组最右端点，能放就放",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `using namespace std;
const int N = 1e5+10;
int n;
struct Range{
    int l,r;
    bool operator<(const Range &W)const{
        return l<W.l;
    }//按左端点排序
}range[N];
int main()
{
    scanf("%d", &n);
    for (int i = 0; i < n; i ++ ){
        int l,r;
        scanf("%d%d", &l, &r);
        range[i]={l,r};
    }
    sort(range,range+n);//sort排序
    priority_queue<int,vector<int>,greater<int>> heap;//小根堆维护所有组的右端点
// 最小值
    for (int i = 0; i < n; i ++ ){//从左往右枚举
        auto r=range[i];//选择当前区间
        if(heap.empty()||heap.top()>=r.l)heap.push(r.r);
        else{
            heap.pop();
            heap.push(r.r);
        }
    }
    printf("%d\\n",heap.size());
    return 0;
}`,
        problems: [
      { pid: 'P1094', title: "[NOIP 2007 普及组] 纪念品分组" },
      { pid: 'P2672', title: "[NOIP 2015 普及组] 推销员" },
      { pid: 'P4995', title: "跳跳！" },
    ],
    trainingSets: [110],
  },
  {
    id: 'tpl-greedy-4',
    group: "竞赛代码模板 · 贪心",
    title: "Huffman / 合并果子",
    summary: "每次合并最小的两个，用小根堆",
    points: [
      "每次合并最小的两个，用小根堆",
      "形态：完整程序（片段需要自备数组与常量声明）",
    ],
    code: `#include <iostream>
#include <queue>
#include <functional> // for greater<int>
using namespace std;
int main() {
    // 读取果子的种类数
    int n;
    cin >> n;
    // 使用小顶堆存储每种果子的数量， 使用 greater<int>确保堆顶元素最小
    priority_queue<int, vector<int>, greater<int>> pq;
    // 读取每种果子的数量， 并将其加入小顶堆
    for (int i = 0; i < n; ++i) {
        int ai;
        cin >> ai;
        pq.push(ai);
    }
    // 用于存储总体的体力消耗
    long long total_cost = 0;
    // 当堆中的果子数量大于 1时， 继续合并
    while (pq.size() > 1) {
        // 取出堆顶的两个最小元素
        int first = pq.top();
        pq.pop();
        int second = pq.top();
        pq.pop();
        // 合并两个最小堆， 计算体力消耗
        int merged = first + second;
        total_cost += merged;
        // 将合并后的结果放回堆中
        pq.push(merged);
    }
    // 输出最终的体力消耗值
    cout << total_cost << endl;
    return 0;`,
    problems: [
      { pid: 'P1090', title: "[NOIP 2004 提高组] 合并果子" },
      { pid: 'P6033', title: "[NOIP 2004 提高组] 合并果子 加强版" },
      { pid: 'P1334', title: "瑞瑞的木板" },
    ],
    trainingSets: [110],
  },
];
