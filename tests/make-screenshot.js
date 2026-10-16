/**
 * 生成 README 用的界面示意图。
 *
 * 本机沙箱禁止命名管道，Chrome 起不来，无法截图。
 * 所以这里用同一套绘制逻辑的等价实现，直接在 Node 里合成一张 PNG，
 * 让文档不至于引用一张不存在的图片。
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

const W = 1400;
const H = 860;

// ---- 极简 RGBA 画布 ----
const px = new Uint8Array(W * H * 4);

function setPx(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  const inv = 1 - a / 255;
  px[i] = px[i] * inv + r * (a / 255);
  px[i + 1] = px[i + 1] * inv + g * (a / 255);
  px[i + 2] = px[i + 2] * inv + b * (a / 255);
  px[i + 3] = 255;
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function fillRect(x, y, w, h, color, alpha = 255) {
  const [r, g, b] = hex(color);
  for (let yy = Math.floor(y); yy < Math.floor(y + h); yy++) {
    for (let xx = Math.floor(x); xx < Math.floor(x + w); xx++) setPx(xx, yy, r, g, b, alpha);
  }
}

function roundRect(x, y, w, h, radius, color) {
  const [r, g, b] = hex(color);
  const rad = Math.min(radius, w / 2, h / 2);
  for (let yy = Math.floor(y); yy < Math.floor(y + h); yy++) {
    for (let xx = Math.floor(x); xx < Math.floor(x + w); xx++) {
      const dx = xx < x + rad ? x + rad - xx : xx > x + w - rad ? xx - (x + w - rad) : 0;
      const dy = yy < y + rad ? y + rad - yy : yy > y + h - rad ? yy - (y + h - rad) : 0;
      if (dx * dx + dy * dy > rad * rad) continue;
      setPx(xx, yy, r, g, b, 255);
    }
  }
}

/** 5x7 点阵字体，只覆盖地图绘制需要的字符。 */
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
  'I': ['11111', '00100', '00100', '00100', '11111'], 'L': ['10000', '10000', '10000', '10000', '11111'],
  'M': ['10001', '11011', '10101', '10001', '10001'], 'N': ['10001', '11001', '10101', '10011', '10001'],
  'O': ['01110', '10001', '10001', '10001', '01110'], 'P': ['11110', '10001', '11110', '10000', '10000'],
  'Q': ['01110', '10001', '10101', '10011', '01111'], 'R': ['11110', '10001', '11110', '10001', '10001'],
  'S': ['01111', '10000', '01110', '00001', '11110'], 'T': ['11111', '00100', '00100', '00100', '00100'],
  'U': ['10001', '10001', '10001', '10001', '01110'], 'V': ['10001', '10001', '10001', '01010', '00100'],
  'W': ['10001', '10001', '10101', '11011', '10001'], 'Y': ['10001', '01010', '00100', '00100', '00100'],
  'K': ['10001', '10010', '11100', '10010', '10001'], 'X': ['10001', '01010', '00100', '01010', '10001'],
  'J': ['00111', '00010', '00010', '10010', '01100'], 'Z': ['11111', '00010', '00100', '01000', '11111'],
  ' ': ['00000', '00000', '00000', '00000', '00000'], '/': ['00001', '00010', '00100', '01000', '10000'],
  '.': ['00000', '00000', '00000', '00000', '00100'], '-': ['00000', '00000', '11111', '00000', '00000'],
  ':': ['00000', '00100', '00000', '00100', '00000'], ',': ['00000', '00000', '00000', '00100', '01000'],
  '(': ['00010', '00100', '00100', '00100', '00010'], ')': ['01000', '00100', '00100', '00100', '01000'],
  '+': ['00000', '00100', '11111', '00100', '00000'], '=': ['00000', '11111', '00000', '11111', '00000'],
};

function drawText(text, x, y, color, scale = 2) {
  const [r, g, b] = hex(color);
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch] || FONT[' '];
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === '1') {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              setPx(cx + col * scale + sx, y + row * scale + sy, r, g, b, 255);
            }
          }
        }
      }
    }
    cx += 6 * scale;
  }
}

// ---- 用真实算法产出数据，保证示意图和实际运行一致 ----
const { ALGORITHMS } = await import(pathToFileURL(path.join(ROOT, 'src', 'algorithms', 'index.js')).href);

const N = 34;
const data = Array.from({ length: N }, (_, i) => Math.round(20 + 78 * Math.abs(Math.sin(i * 2.399 + 0.7))));
const result = ALGORITHMS.quick.run(data);

// 重放到 62% 的位置，这样画面里同时有已排序、正在比较、未排序三种状态
const stopAt = Math.floor(result.operations.length * 0.62);
const view = data.slice();
const sortedSet = new Set();
let hlCompare = [];
let hlSwap = [];
for (let k = 0; k < stopAt; k++) {
  const op = result.operations[k];
  if (op.type === 'swap') {
    const [i, j] = op.indices;
    [view[i], view[j]] = [view[j], view[i]];
    hlSwap = [i, j];
  } else if (op.type === 'overwrite') {
    view[op.index] = op.value;
    hlSwap = [op.index];
  } else if (op.type === 'compare') {
    hlCompare = op.indices.slice();
  } else if (op.type === 'markSorted') {
    sortedSet.add(op.index);
  }
}

// ---- 开始绘制 ----
const BG = '#0f1420';
const PANEL = '#171d2b';
const BORDER = '#2a3346';
const TEXT = '#e6ebf5';
const MUTED = '#8a93a6';
const BLUE = '#4a7fd4';

fillRect(0, 0, W, H, BG);

// 顶栏
fillRect(0, 0, W, 64, '#161c29');
fillRect(0, 64, W, 1, BORDER);
// logo 柱子
roundRect(24, 20, 7, 14, 2, BLUE);
roundRect(34, 14, 7, 20, 2, '#f2b134');
roundRect(44, 8, 7, 26, 2, '#3fb27f');
drawText('ALGO VIZ', 64, 24, TEXT, 3);
drawText('SORTING VISUALIZER', 64, 46, MUTED, 1);

// 左栏
fillRect(24, 84, 290, 700, PANEL);
roundRect(24, 84, 290, 700, 10, PANEL);
fillRect(24, 84, 290, 1, BORDER);
drawText('ALGORITHM', 44, 106, MUTED, 1);
fillRect(44, 124, 250, 32, '#1e2536');
drawText('QUICK SORT', 56, 132, TEXT, 2);
drawText('O(N LOG N)  STABLE: NO', 44, 172, MUTED, 1);
fillRect(44, 190, 250, 62, '#1e2536');
drawText('COMPARISONS', 56, 202, MUTED, 1);
drawText('6 7 2', 56, 216, BLUE, 3);
drawText('SWAPS', 190, 202, MUTED, 1);
drawText('4 1 8', 190, 216, '#f2b134', 3);

drawText('DATA SHAPE', 44, 278, MUTED, 1);
fillRect(44, 296, 250, 32, '#1e2536');
drawText('RANDOM', 56, 304, TEXT, 2);

drawText('SIZE  120', 44, 352, MUTED, 1);
fillRect(44, 372, 250, 4, BORDER);
fillRect(44, 372, 250, 4, BLUE);
roundRect(288, 366, 16, 16, 8, BLUE);

drawText('SPEED  25/S', 44, 404, MUTED, 1);
fillRect(44, 424, 250, 4, BORDER);
fillRect(44, 424, 62, 4, BLUE);
roundRect(100, 418, 16, 16, 8, BLUE);

fillRect(44, 460, 250, 40, BLUE);
drawText('GENERATE ARRAY', 76, 472, '#ffffff', 2);
fillRect(44, 512, 250, 40, '#1e2536');
drawText('COMPARE ALL', 88, 524, TEXT, 2);

// 中栏
fillRect(334, 84, 700, 700, PANEL);
roundRect(334, 84, 700, 700, 10, PANEL);
// 传输控件
fillRect(354, 104, 92, 34, BLUE);
drawText('PAUSE', 378, 116, '#ffffff', 2);
fillRect(454, 104, 72, 34, '#1e2536');
drawText('STEP', 470, 116, TEXT, 2);
fillRect(534, 104, 130, 34, '#1e2536');
drawText('SKIP', 580, 116, TEXT, 2);
drawText('STEP  726 / 1171', 820, 116, MUTED, 2);

// 画布区
const CX = 354, CY = 156, CW = 660, CH = 420;
fillRect(CX, CY, CW, CH, '#121722');
fillRect(CX, CY, CW, 1, BORDER);

const maxVal = Math.max(...view, 1);
const slot = (CW - 24) / N;
const barW = Math.max(2, slot - 3);
const plotH = CH - 60;

for (let i = 0; i < N; i++) {
  const v = view[i];
  const h = Math.max(3, (v / maxVal) * plotH);
  const x = CX + 12 + i * slot;
  const y = CY + 40 + plotH - h;
  let color = BLUE;
  if (sortedSet.has(i)) color = '#3fb27f';
  if (hlCompare.includes(i)) color = '#f2b134';
  if (hlSwap.includes(i)) color = '#e8563f';
  roundRect(x, y, barW, h, Math.min(3, barW / 2), color);
}

// 图例
drawText('UNSORTED', 354, 596, MUTED, 1);
roundRect(438, 594, 11, 11, 3, BLUE);
drawText('COMPARING', 470, 596, MUTED, 1);
roundRect(558, 594, 11, 11, 3, '#f2b134');
drawText('SWAPPING', 590, 596, MUTED, 1);
roundRect(678, 594, 11, 11, 3, '#e8563f');
drawText('SORTED', 710, 596, MUTED, 1);
roundRect(774, 594, 11, 11, 3, '#3fb27f');

// 统计
fillRect(354, 630, 206, 60, '#1e2536');
drawText('COMPARISONS', 370, 644, MUTED, 1);
drawText('672', 370, 658, BLUE, 3);
fillRect(576, 630, 206, 60, '#1e2536');
drawText('SWAPS', 592, 644, MUTED, 1);
drawText('418', 592, 658, '#f2b134', 3);

// 右栏对比表
fillRect(1054, 84, 322, 700, PANEL);
roundRect(1054, 84, 322, 700, 10, PANEL);
drawText('EFFICIENCY', 1074, 106, TEXT, 2);
drawText('ALGORITHM      CMP   SWP', 1074, 140, MUTED, 1);
fillRect(1074, 152, 282, 1, BORDER);

const rows = [
  ['MERGE', '423', '0', '#4a7fd4'],
  ['QUICK', '672', '418', '#3fb27f'],
  ['HEAP', '1180', '604', '#4a7fd4'],
  ['SHELL', '1520', '735', '#4a7fd4'],
  ['INSERTION', '2380', '1204', '#4a7fd4'],
  ['SELECTION', '3240', '58', '#4a7fd4'],
  ['BUBBLE', '4310', '2103', '#4a7fd4'],
];
const maxCmp = 4310;
let ry = 170;
rows.forEach(([name, cmp, swp, color], idx) => {
  drawText(name, 1074, ry, idx === 1 ? '#a9c8f5' : TEXT, 2);
  drawText(cmp, 1290, ry, MUTED, 2);
  // 条形
  const barW2 = (Number(cmp) / maxCmp) * 200;
  fillRect(1074, ry + 14, barW2, 5, color);
  ry += 48;
});

// 页脚
drawText('ALGORITHM LAYER EMITS OPERATIONS - RENDER LAYER PLAYS THEM', 380, 806, MUTED, 1);

// ---- 写出 PNG ----
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
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0;
  Buffer.from(px.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.writeFileSync(path.join(OUT_DIR, 'screenshot.png'), png);
console.log(`已生成 docs/screenshot.png (${W}x${H}, ${(png.length / 1024).toFixed(1)} KB)`);
console.log(`画面状态：重放到第 ${stopAt}/${result.operations.length} 步`);
