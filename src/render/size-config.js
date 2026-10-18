/**
 * 数据规模的通用配置。
 *
 * 之前的规模滑块只对 4 种数组类 inputKind 显示，图/树/高精度/字符串
 * 的演示数据完全固定 —— 用户想看更大/更小的场景没有办法。
 *
 * 现在每种 inputKind 都有一份配置：
 *   label   滑块的中文含义（「元素个数」「网格宽」「数字位数」…）
 *   min/max/step/default  滑块范围
 *   apply(config, size)   把滑块值写进 buildInput 的 config
 *
 * app.js 读这份表来决定滑块是否显示、显示什么标签、范围多大；
 * factory.buildInput 读 config 生成对应规模的数据。
 */

export const SIZE_CONFIGS = {
  // ---------- 数组类：规模 = 元素个数 ----------
  array:        { label: '元素个数',   min: 8,   max: 120, step: 2,  def: 40 },
  boundedArray: { label: '元素个数',   min: 8,   max: 120, step: 2,  def: 40 },
  positArray:   { label: '元素个数',   min: 8,   max: 120, step: 2,  def: 40 },
  smallRangeArray: { label: '元素个数', min: 8,  max: 60,  step: 2,  def: 24 },
  sortedArray:  { label: '元素个数',   min: 7,   max: 63,  step: 2,  def: 31 },

  // ---------- 网格类：规模 = 网格宽（行数固定为宽的一半多） ----------
  grid:         { label: '网格宽',     min: 8,   max: 40,  step: 2,  def: 18 },

  // ---------- 查找类：目标由数据生成，规模 = 元素个数 ----------
  ropes:        { label: '绳子根数',   min: 2,   max: 12,  step: 1,  def: 4 },

  // ---------- 字符串类：规模 = 主串长度 ----------
  stringPair:   { label: '主串长度',   min: 12,  max: 40,  step: 2,  def: 22 },
  words:        { label: '单词个数',   min: 3,   max: 12,  step: 1,  def: 6 },

  // ---------- 高精度：规模 = 位数 ----------
  bigNumbers:        { label: '数字位数', min: 10, max: 60, step: 2, def: 20 },
  bigNumbersSmall:   { label: '数字位数', min: 2,  max: 8,  step: 1,  def: 5 },
  factorial:         { label: 'n 的值',   min: 5,  max: 60, step: 1,  def: 25 },

  // ---------- 图类：规模 = 点数 ----------
  graph:        { label: '节点个数',   min: 4,   max: 10,  step: 1,  def: 6 },
  dag:          { label: '节点个数',   min: 3,   max: 10,  step: 1,  def: 6 },

  // ---------- 数据结构：规模 = 文本长度 / 任务数 ----------
  text:         { label: '输入长度',   min: 4,   max: 24,  step: 1,  def: 8 },

  // ---------- 位运算：固定 8 位演示，但保留条目让滑块隐藏时语义明确 ----------
  bits:         null,
};

/** 判断某种 inputKind 是否显示规模滑块。 */
export function hasSize(kind) {
  return Boolean(SIZE_CONFIGS[kind]);
}

/** 取某种 inputKind 的滑块配置。 */
export function getSizeConfig(kind) {
  return SIZE_CONFIGS[kind] || null;
}

/**
 * 把滑块值应用到 config 上。
 *
 * 各 inputKind 用 config 的字段名不同（size / rows / cols / 文本长度…），
 * 在这里统一映射，factory.buildInput 不需要改。
 */
export function applySize(config, kind, size) {
  switch (kind) {
    case 'grid':
      /*
       * 行数取列数的 0.85，让网格接近正方形。
       * 原来用 0.6（12 行 × 20 列，宽高比 1.67），
       * 而画布基本是正方形，导致网格上下各空一大块；
       * 0.85 能让网格几乎填满画布（16×18 时纵向只余 10 多像素）。
       */
      config.rows = Math.max(6, Math.round(size * 0.85));
      config.cols = size;
      break;
    case 'stringPair':
      config.size = size;
      // 模式串长度约为主串的 1/4，至少 2
      config.patternLen = Math.max(2, Math.round(size / 4));
      break;
    case 'bigNumbers':
      config.digits = size;
      break;
    case 'words':
      config.wordCount = size;
      break;
    case 'graph':
      config.nodeCount = size;
      break;
    case 'dag':
      config.nodeCount = size;
      break;
    case 'text':
      config.textLen = size;
      break;
    case 'ropes':
      config.ropes = size;
      break;
    default:
      // 数组类统一用 size
      config.size = size;
  }
  return config;
}
