/**
 * 一次性迁移：加大栈/队列的演示数据量。
 * 原来：栈 6 字符括号串（10 步）、队列 4-5 个任务 —— 几步播完，视觉上像没动画。
 * 运行一次即可删除。
 */
import fs from 'node:fs';

const f = 'src/render/factory.js';
let c = fs.readFileSync(f, 'utf8');

// ---- 栈样本：更长、含嵌套/错误样本 ----
const stackStart = c.indexOf("const samples = [");
const stackEnd = c.indexOf('];', stackStart);
if (stackStart < 0 || stackEnd < 0) { console.log('栈锚点未找到'); process.exit(1); }

const newStack = [
  "        const samples = [",
  "          '({[]})',              // 嵌套匹配",
  "          '([)]',                // 交叉不匹配",
  "          '((()))()[]{}',         // 连续多组",
  "          '{[()()]}{[()()]}',     // 两段嵌套",
  "          '((((()))))',           // 深嵌套",
  "          '(()',                  // 少右括号",
  "          '())(',                 // 顺序错乱",
  "        ];",
].join('\n');

c = c.slice(0, stackStart) + newStack + c.slice(stackEnd + 2);

// ---- 队列任务：加到 8 个 ----
const qStart = c.indexOf('const taskSets = [');
const qEnd = c.indexOf('];', qStart);
if (qStart < 0 || qEnd < 0) { console.log('队列锚点未找到'); process.exit(1); }

const newQueue = [
  "        const taskSets = [",
  "          ['渲染画面', '计算坐标', '播放动画', '清理临时值', '更新状态', '加载资源', '保存进度', '发送通知'],",
  "          ['读取数据', '解析格式', '校验字段', '写入缓存', '通知界面', '记录日志', '压缩备份', '释放内存'],",
  "          ['接收请求', '验证参数', '查询数据库', '组装结果', '渲染模板', '设置响应头', '发送响应', '统计耗时'],",
  "        ];",
].join('\n');

c = c.slice(0, qStart) + newQueue + c.slice(qEnd + 2);

fs.writeFileSync(f, c, 'utf8');
console.log('栈/队列演示数据已加大');
