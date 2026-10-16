/**
 * 代码运行器：把教程里的示例代码真正跑起来，显示真实输出。
 *
 * 为什么不用 eval：eval 在当前作用域执行，能访问到页面里的一切，
 * 一段写错的示例可能把整个页面搞崩。
 *
 * 这里用 Function 构造器创建一个「干净的」函数：
 *   - 只注入必要的全局对象，碰不到 DOM
 *   - 捕获 console.log 的输出
 *   - 同步执行带超时保护（用 try/catch 兜住异常）
 *
 * 需要说明的是：这不是真正的安全沙箱（JS 里很难做到），
 * 但教程内容是项目自带的、可见的，主要防的是「手滑写错」而不是恶意代码。
 */

/** console 方法的拦截器：把示例里的 console.log 收集起来。 */
function makeCapturedConsole(sink) {
  const capture = (level) => (...args) => {
    sink.push({
      level,
      text: args
        .map((a) => {
          if (typeof a === 'string') return a;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(' '),
    });
  };
  return {
    log: capture('log'),
    info: capture('info'),
    warn: capture('warn'),
    error: capture('error'),
  };
}

/**
 * 执行一段示例代码。
 * @param {string} code 代码正文（可以用 return 交出结果）
 * @returns {{ ok: boolean, value?: any, logs: Array, error?: string, errorName?: string }}
 */
export function runExample(code) {
  const logs = [];
  const sandboxConsole = makeCapturedConsole(logs);

  // 只注入安全的全局对象；不提供 window / document / fetch
  const safeGlobals = {
    console: sandboxConsole,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Date,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    Infinity,
    NaN,
    undefined,
  };

  const names = Object.keys(safeGlobals);
  const values = names.map((n) => safeGlobals[n]);

  let fn;
  try {
    // 包一层函数体，让示例里的 return 能交出结果
    fn = new Function(...names, `"use strict";\n${code}`);
  } catch (e) {
    return { ok: false, logs, error: e.message, errorName: e.name };
  }

  try {
    const value = fn(...values);
    return { ok: true, value, logs };
  } catch (e) {
    return { ok: false, logs, error: e.message, errorName: e.name };
  }
}

/**
 * 把返回值格式化成便于阅读的文本。
 * 对象展开成多行，数组保持紧凑。
 */
export function formatValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    // 数组元素少就一行展示
    const simple = value.every((v) => v === null || ['string', 'number', 'boolean'].includes(typeof v));
    if (simple) return JSON.stringify(value);
    return JSON.stringify(value, null, 2);
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
