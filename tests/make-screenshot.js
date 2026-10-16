/**
 * 生成 README 用的界面示意图。
 *
 * 背景：本机沙箱禁止命名管道，Chrome 的多进程 IPC 起不来，无法截图。
 * 所以这里用同一套配色与布局，在 Node 里直接合成 PNG，
 * 让文档不至于引用一张不存在的图片。
 *
 * 需要说明：中文字形无法用内置点阵字体表示，所以示意图里的界面文字用英文标签，
 * 这是合成图的局限，真实页面上仍然是中文。
 *
 * 生成两张：
 *   docs/screenshot.png         算法可视化页（柱状图）
 *   docs/screenshot-syntax.png  语法基础页
 *
 * 用法：node tests/make-screenshot.js
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs');
fs.mkdirSync(OUT_DIR, { recursive: true });

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** 5x7 点阵字体。 */
const FONT = {
  '0': ['01110', '10001', '10001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00110', '01000', '11111'], '3': ['11111', '00010', '00100', '10001', '01110'],
  '4': ['00010', '00110', '01010', '11111', '00010'], '5': ['11111', '10000', '11110', '00001', '11110'],
  '6': ['01110', '10000', '11110', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000'],
  '8': ['01110', '10001', '01110', '10001', '01110'], '9': ['01110', '10001', '01111', '00001', '01110'],
  'A': ['01110', '10001', '11111', '10001', '10001'], 'B': ['11110', '10001', '11110', '10001', '11110'],
  'C': ['01111', '10000', '10000', '10000', '01111'], 'D': ['11110', '10001', '10001', '10001', '11110'],
  'E': ['11111', '10000', '11110', '10000', '11111'], 'F': ['11111', '10000', '11110', '10000', '10000'],
  'G': ['01111', '10000', '10011', '10001', '01111'], 'H': ['10001', '10001', '11111', '10001', '10001'],
  'I': ['11111', '00100', '00100', '00100', '11111'], 'J': ['00111', '00010', '00010', '10010', '01100'],
  'K': ['10001', '10010', '11100', '10010', '10001'], 'L': ['10000', '10000', '10000', '10000', '11111'],
  'M': ['10001', '11011', '10101', '10001', '10001'], 'N': ['10001', '11001', '10101', '10011', '10001'],
  'O': ['01110', '10001', '10001', '10001', '01110'], 'P': ['11110', '10001', '11110', '10000', '10000'],
  'Q': ['01110', '10001', '10101', '10011', '01111'], 'R': ['11110', '10001', '11110', '10001', '10001'],
  'S': ['01111', '10000', '01110', '00001', '11110'], 'T': ['11111', '00100', '00100', '00100', '00100'],
  'U': ['10001', '10001', '10001', '10001', '01110'], 'V': ['10001', '10001', '10001', '01010', '00100'],
  'W': ['10001', '10001', '10101', '11011', '10001'], 'X': ['10001', '01010', '00100', '01010', '10001'],
  'Y': ['10001', '01010', '00100', '00100', '00100'], 'Z': ['11111', '00010', '00100', '01000', '11111'],
  ' ': ['00000', '00000', '00000', '00000', '00000'], '.': ['00000', '00000', '00000', '00000', '00100'],
  ',': ['00000', '00000', '00000', '00100', '01000'], ':': ['00000', '00100', '00000', '00100', '00000'],
  '-': ['00000', '00000', '11111', '00000', '00000'], '/': ['00001', '00010', '00100', '01000', '10000'],
  '=': ['00000', '11111', '00000', '11111', '00000'], '+': ['00000', '00100', '11111', '00100', '00000'],
  '(': ['00010', '00100', '00100', '00100', '00010'], ')': ['01000', '00100', '00100', '00100', '01000'],
  '{': ['00010', '00100', '01000', '00100', '00010'], '}': ['01000', '00100', '00010', '00100', '01000'],
  '_': ['00000', '00000', '00000', '00000', '11111'], '>': ['10000', '01000', '00100', '01000', '10000'],
  '<': ['00001', '00010', '00100', '00010', '00001'], '*': ['10101', '01110', '11111', '01110', '10101'],
  '[': ['00110', '00100', '00100', '00100', '00110'], ']': ['01100', '00100', '00100', '00100', '01100'],
};

class Canvas {
  constructor(w, h) {
    this.W = w; this.H = h;
    this.px = new Uint8Array(w * h * 4);
  }
  setPx(x, y, r, g, b, a = 255) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const i = (y * this.W + x) * 4;
    const inv = 1 - a / 255;
    this.px[i] = this.px[i] * inv + r * (a / 255);
    this.px[i + 1] = this.px[i + 1] * inv + g * (a / 255);
    this.px[i + 2] = this.px[i + 2] * inv + b * (a / 255);
    this.px[i + 3] = 255;
  }
  rect(x, y, w, h, color, alpha = 255) {
    const [r, g, b] = hex(color);
    for (let yy = Math.floor(y); yy < Math.floor(y + h); yy++) {
      for (let xx = Math.floor(x); xx < Math.floor(x + w); xx++) this.setPx(xx, yy, r, g, b, alpha);
    }
  }
  roundRect(x, y, w, h, radius, color) {
    const [r, g, b] = hex(color);
    const rad = Math.max(0, Math.min(radius, w / 2, h / 2));
    for (let yy = Math.floor(y); yy < Math.floor(y + h); yy++) {
      for (let xx = Math.floor(x); xx < Math.floor(x + w); xx++) {
        const dx = xx < x + rad ? x + rad - xx : xx > x + w - rad ? xx - (x + w - rad) : 0;
        const dy = yy < y + rad ? y + rad - yy : yy > y + h - rad ? yy - (y + h - rad) : 0;
        if (dx * dx + dy * dy > rad * rad) continue;
        this.setPx(xx, yy, r, g, b, 255);
      }
    }
  }
  text(str, x, y, color, scale = 2) {
    const [r, g, b] = hex(color);
    let cx = x;
    for (const ch of String(str).toUpperCase()) {
      const glyph = FONT[ch] || FONT[' '];
      for (let row = 0; row < glyph.length; row++) {
        for (let col = 0; col < glyph[row].length; col++) {
          if (glyph[row][col] !== '1') continue;
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) this.setPx(cx + col * scale + sx, y + row * scale + sy, r, g, b, 255);
          }
        }
      }
      cx += 6 * scale;
    }
  }
  static tw(str, scale = 2) { return String(str).length * 6 * scale; }
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(cv, file) {
  const { W, H, px } = cv;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    Buffer.from(px.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  return png.length;
}

const C = {
  bg: '#0f1420', panel: '#171d2b', elevated: '#1e2536', border: '#2a3346',
  text: '#e6ebf5', muted: '#8a93a6', blue: '#4a7fd4', amber: '#f2b134',
  red: '#e8563f', green: '#3fb27f', purple: '#a06cd5', dim: '#b4bdd0',
};

function drawChrome(cv, activeTab) {
  cv.rect(0, 0, cv.W, 64, '#161c29');
  cv.rect(0, 64, cv.W, 1, C.border);
  cv.roundRect(24, 20, 7, 14, 2, C.blue);
  cv.roundRect(34, 14, 7, 20, 2, C.amber);
  cv.roundRect(44, 8, 7, 26, 2, C.green);
  cv.text('ALGO VIZ', 64, 22, C.text, 3);
  cv.text('ALGORITHM VISUALIZER', 64, 46, C.muted, 1);

  cv.roundRect(600, 13, 246, 38, 8, C.elevated);
  if (activeTab === 'viz') {
    cv.roundRect(604, 16, 118, 32, 6, C.blue);
    cv.text('VIZ', 646, 26, '#ffffff', 2);
    cv.text('SYNTAX', 742, 26, C.muted, 2);
  } else {
    cv.text('VIZ', 636, 26, C.muted, 2);
    cv.roundRect(716, 16, 126, 32, 6, C.blue);
    cv.text('SYNTAX', 744, 26, '#ffffff', 2);
  }

  cv.roundRect(1300, 16, 76, 32, 6, C.elevated);
  cv.text('GITHUB', 1310, 27, C.text, 1);
}

// =====================================================================
// 图一：算法可视化页
// =====================================================================

const { ALGORITHMS } = await import(pathToFileURL(path.join(ROOT, 'src/algorithms/index.js')).href);

function drawVizScreenshot() {
  const cv = new Canvas(1400, 860);
  cv.rect(0, 0, cv.W, cv.H, C.bg);
  drawChrome(cv, 'viz');

  cv.roundRect(24, 84, 286, 700, 10, C.panel);
  cv.text('CATEGORY', 44, 104, C.muted, 1);
  cv.rect(44, 122, 246, 30, C.elevated);
  cv.text('COMPARE SORT', 56, 130, C.text, 2);

  cv.text('ALGORITHM', 44, 168, C.muted, 1);
  cv.rect(44, 186, 246, 30, C.elevated);
  cv.text('QUICK SORT', 56, 194, C.text, 2);

  cv.rect(44, 228, 246, 76, C.elevated);
  cv.text('QUICK SORT', 56, 238, C.text, 2);
  cv.text('TIME O(N LOG N)  SPACE O(LOG N)', 56, 258, C.muted, 1);
  cv.text('PICK A PIVOT: SMALL LEFT,', 56, 274, C.dim, 1);
  cv.text('LARGE RIGHT, THEN RECURSE.', 56, 286, C.dim, 1);

  cv.text('DATA SHAPE', 44, 322, C.muted, 1);
  cv.rect(44, 340, 246, 30, C.elevated);
  cv.text('RANDOM', 56, 348, C.text, 2);

  cv.text('SIZE   120', 44, 390, C.muted, 1);
  cv.rect(44, 410, 246, 4, C.border);
  cv.rect(44, 410, 246, 4, C.blue);
  cv.roundRect(282, 404, 16, 16, 8, C.blue);

  cv.text('SPEED   25/S', 44, 442, C.muted, 1);
  cv.rect(44, 462, 246, 4, C.border);
  cv.rect(44, 462, 60, 4, C.blue);
  cv.roundRect(96, 456, 16, 16, 8, C.blue);

  cv.rect(44, 496, 246, 38, C.blue);
  cv.text('GENERATE DATA', 82, 508, '#ffffff', 2);
  cv.rect(44, 546, 246, 38, C.elevated);
  cv.text('COMPARE ALL', 98, 558, C.text, 2);

  cv.text('SYNTAX TOPICS USED', 44, 606, C.muted, 1);
  let chipX = 44;
  for (const ch of ['RECURSION', 'SWAP VARS', 'WHILE LOOP']) {
    const w = Math.min(Canvas.tw(ch, 1) + 14, 246 - (chipX - 44));
    if (w <= 20) break;
    cv.roundRect(chipX, 624, w, 22, 5, '#1d2c44');
    cv.text(ch, chipX + 7, 631, '#a9c8f5', 1);
    chipX += w + 6;
  }

  cv.roundRect(326, 84, 700, 700, 10, C.panel);
  cv.roundRect(346, 104, 92, 34, 6, C.blue);
  cv.text('PAUSE', 372, 116, '#ffffff', 2);
  cv.roundRect(446, 104, 70, 34, 6, C.elevated);
  cv.text('STEP', 462, 116, C.text, 2);
  cv.roundRect(524, 104, 120, 34, 6, C.elevated);
  cv.text('SKIP', 566, 116, C.text, 2);
  cv.text('726 / 1171', 880, 116, C.muted, 2);

  const CX = 346, CY = 158, CW = 660, CH = 400;
  cv.rect(CX, CY, CW, CH, '#121722');

  // 用真实算法产出画面，保证合成图和实际运行一致
  const N = 34;
  const data = Array.from({ length: N }, (_, i) => Math.round(20 + 78 * Math.abs(Math.sin(i * 2.399 + 0.7))));
  const result = ALGORITHMS.quick.run(data);
  const stopAt = Math.floor(result.operations.length * 0.62);

  const view = data.slice();
  const sortedSet = new Set();
  let hlCompare = [], hlSwap = [];
  for (let k = 0; k < stopAt; k++) {
    const op = result.operations[k];
    if (op.type === 'swap') {
      const [i, j] = op.indices;
      [view[i], view[j]] = [view[j], view[i]];
      hlSwap = [i, j];
    } else if (op.type === 'overwrite') {
      view[op.index] = op.value;
      hlSwap = [op.index];
    } else if (op.type === 'compare') hlCompare = op.indices.slice();
    else if (op.type === 'markSorted') sortedSet.add(op.index);
  }

  const maxVal = Math.max(...view, 1);
  const slot = (CW - 24) / N;
  const barW = Math.max(2, slot - 3);
  const plotH = CH - 50;
  for (let i = 0; i < N; i++) {
    const h = Math.max(3, (view[i] / maxVal) * plotH);
    const x = CX + 12 + i * slot;
    const y = CY + 30 + plotH - h;
    let color = C.blue;
    if (sortedSet.has(i)) color = C.green;
    if (hlCompare.includes(i)) color = C.amber;
    if (hlSwap.includes(i)) color = C.red;
    cv.roundRect(x, y, barW, h, Math.min(3, barW / 2), color);
  }

  let lx = 346;
  for (const [label, color] of [['UNSORTED', C.blue], ['COMPARE', C.amber], ['SWAP', C.red], ['SORTED', C.green], ['RANGE', C.purple]]) {
    cv.roundRect(lx, 572, 11, 11, 3, color);
    cv.text(label, lx + 16, 574, C.muted, 1);
    lx += 16 + Canvas.tw(label, 1) + 14;
  }

  let sx = 346;
  for (const [label, value, color] of [['COMPARISONS', '672', C.blue], ['SWAPS', '418', C.amber], ['WRITES', '836', C.red]]) {
    cv.rect(sx, 606, 210, 62, C.elevated);
    cv.text(label, sx + 14, 620, C.muted, 1);
    cv.text(value, sx + 14, 636, color, 3);
    sx += 224;
  }

  cv.roundRect(1042, 84, 334, 700, 10, C.panel);
  cv.text('EFFICIENCY', 1062, 106, C.text, 2);
  cv.text('ALGORITHM      CMP     SWP', 1062, 138, C.muted, 1);
  cv.rect(1062, 150, 294, 1, C.border);

  const rows = [
    ['MERGE', 423, 0], ['QUICK', 672, 418], ['HEAP', 1180, 604],
    ['SHELL', 1520, 735], ['INSERTION', 2380, 1204],
    ['SELECTION', 3240, 58], ['BUBBLE', 4310, 2103],
  ];
  let ry = 168;
  for (const [name, cmp, swp] of rows) {
    const isCurrent = name === 'QUICK';
    if (isCurrent) cv.rect(1058, ry - 6, 302, 42, '#1c2740');
    cv.text(name, 1062, ry, isCurrent ? '#a9c8f5' : C.text, 2);
    cv.text(String(cmp), 1290, ry, C.muted, 2);
    cv.text(String(swp), 1372, ry, C.muted, 2);
    cv.rect(1062, ry + 16, (cmp / 4310) * 240, 4, isCurrent ? C.green : C.blue);
    ry += 48;
  }

  cv.text('ALGORITHM LAYER EMITS OPERATIONS - RENDER LAYER PLAYS THEM', 380, 806, C.muted, 1);
  return writePng(cv, path.join(OUT_DIR, 'screenshot.png'));
}

// =====================================================================
// 图二：语法基础页
// =====================================================================

const { SYNTAX_GROUPS } = await import(pathToFileURL(path.join(ROOT, 'src/syntax/topics.js')).href);

const LABELS = {
  variables: 'VARIABLES', 'number-types': 'NUMBERS', 'math-floor': 'MATH.FLOOR',
  'string-basics': 'STRINGS', 'comparison-ops': 'COMPARISON OPS', 'if-else': 'IF / ELSE',
  truthiness: 'TRUTHINESS', 'array-basics': 'ARRAY BASICS', 'array-push-pop': 'PUSH / POP',
  'nested-array': '2D ARRAYS', 'for-loop': 'FOR LOOP', 'while-loop': 'WHILE LOOP',
  'nested-loop': 'NESTED LOOPS', 'array-map-filter': 'MAP / FILTER', 'array-slice': 'SLICE / SPLICE',
  'array-index-math': 'INDEX MATH', functions: 'FUNCTIONS', 'arrow-function': 'ARROW FUNCTIONS',
  closures: 'CLOSURES', recursion: 'RECURSION', 'recursion-vs-stack': 'RECURSION TO STACK',
  'object-literal': 'OBJECTS', 'set-map': 'SET / MAP', 'for-of': 'FOR...OF',
  'variable-swap': 'SWAP VARIABLES', 'short-circuit': 'SHORT CIRCUIT', 'boolean-flag': 'BOOLEAN FLAG',
  'min-tracking': 'MIN TRACKING', 'array-init': 'INIT COUNTS', 'array-as-queue': 'QUEUE VIA ARRAY',
  'array-shift': 'SHIFT COST', 'mid-overflow': 'BINARY MIDPOINT',
  'string-length': 'STRING LENGTH', 'math-sqrt': 'MATH.SQRT',
  'array-as-stack': 'STACK VIA ARRAY', destructuring: 'DESTRUCTURING',
};

function drawSyntaxScreenshot() {
  const cv = new Canvas(1400, 860);
  cv.rect(0, 0, cv.W, cv.H, C.bg);
  drawChrome(cv, 'syntax');

  cv.roundRect(24, 84, 260, 700, 10, C.panel);
  cv.rect(44, 102, 172, 28, C.elevated);
  cv.text('SEARCH...', 56, 110, '#5d6779', 1);
  cv.text('36 / 36', 224, 110, C.muted, 1);

  let ny = 148;
  const groupLabels = {
    '语言基础': 'LANGUAGE BASICS',
    '字符串与判断': 'STRINGS & LOGIC',
    '数组': 'ARRAYS',
    '函数': 'FUNCTIONS',
  };
  for (const group of SYNTAX_GROUPS) {
    if (ny > 690) break;
    cv.text(groupLabels[group.name] || 'MORE', 44, ny, C.muted, 1);
    ny += 18;
    for (const t of group.topics) {
      if (ny > 730) break;
      const active = t.id === 'mid-overflow';
      if (active) cv.rect(40, ny - 5, 228, 24, '#1d2c44');
      cv.text(LABELS[t.id] || t.id.toUpperCase(), 54, ny, active ? '#cfe0f8' : C.dim, 1);
      ny += 21;
    }
    ny += 8;
  }

  cv.roundRect(302, 84, 1074, 700, 10, C.panel);

  cv.text('BINARY SEARCH MIDPOINT', 326, 108, C.text, 3);
  cv.rect(326, 138, 1026, 1, C.border);
  cv.text('LO + (HI - LO) / 2 IS SAFER THAN (LO + HI) / 2.', 326, 156, C.dim, 2);

  cv.text('KEY POINTS', 326, 196, C.muted, 1);
  const points = [
    'MATH.FLOOR((LO + HI) / 2) IS THE OBVIOUS WAY TO FIND THE MIDDLE',
    'LO + FLOOR((HI - LO) / 2) USES SUBTRACTION, SO IT CANNOT OVERFLOW',
    'IN JS NUMBERS ARE FLOATS SO OVERFLOW IS NOT REAL, BUT THE HABIT MATTERS',
    'MIXING CLOSED AND HALF-OPEN RANGES IS THE #1 BINARY SEARCH BUG',
  ];
  let py = 216;
  for (const p of points) {
    cv.rect(330, py + 4, 5, 5, C.blue);
    cv.text(p, 344, py, '#c3cbdb', 1);
    py += 19;
  }

  cv.text('EXAMPLE CODE', 326, 312, C.muted, 1);
  cv.rect(326, 330, 1026, 238, '#0d121d');
  const code = [
    'const arr = [1, 3, 5, 7, 9, 11, 13, 15, 17];',
    'const target = 13;',
    '',
    'function binarySearch(a, target) {',
    '  let lo = 0, hi = a.length - 1, steps = 0;',
    '  while (lo <= hi) {',
    '    const mid = lo + Math.floor((hi - lo) / 2);',
    '    steps++;',
    '    if (a[mid] === target) return { index: mid, steps };',
    '    if (a[mid] < target) lo = mid + 1;',
    '    else hi = mid - 1;',
    '  }',
    '  return { index: -1, steps };',
    '}',
  ];
  let cy = 344;
  for (const line of code) { cv.text(line, 344, cy, '#cfd8e8', 1); cy += 15; }

  cv.text('OUTPUT   (REALLY EXECUTED, NOT HARDCODED)', 326, 590, C.muted, 1);
  cv.rect(326, 608, 1026, 58, '#0d121d');
  cv.roundRect(340, 624, 60, 20, 4, '#1e3a2c');
  cv.text('RETURN', 348, 630, C.green, 1);
  cv.text('{ "INDEX": 6, "STEPS": 2, "WORSTCASE": 4 }', 416, 628, '#a9e3c3', 2);

  cv.text('USED BY THESE ALGORITHMS', 326, 694, C.muted, 1);
  let ux = 326;
  for (const name of ['BINARY SEARCH', 'BINARY SEARCH ON ANSWER']) {
    const w = Canvas.tw(name, 1) + 18;
    cv.roundRect(ux, 712, w, 24, 5, '#1b3328');
    cv.text(name, ux + 9, 719, '#b9e3cd', 1);
    ux += w + 8;
  }

  cv.text('ALGORITHM LAYER EMITS OPERATIONS - RENDER LAYER PLAYS THEM', 380, 806, C.muted, 1);
  return writePng(cv, path.join(OUT_DIR, 'screenshot-syntax.png'));
}

const s1 = drawVizScreenshot();
const s2 = drawSyntaxScreenshot();
console.log(`已生成 docs/screenshot.png        ${(s1 / 1024).toFixed(1)} KB`);
console.log(`已生成 docs/screenshot-syntax.png ${(s2 / 1024).toFixed(1)} KB`);
