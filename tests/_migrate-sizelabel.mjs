/**
 * 一次性迁移：app.js 改用 sizeLabel 元素。
 * 运行一次即可删除。
 */
import fs from 'node:fs';

const f = 'src/app.js';
let c = fs.readFileSync(f, 'utf8');

// 1) dom 引用加 sizeLabel
const dAnchor = "  sizeValue: $('size-value'),";
if (!c.includes(dAnchor)) { console.log('dom 锚点未找到'); process.exit(1); }
if (!c.includes("sizeLabel:")) {
  c = c.replace(dAnchor, dAnchor + "\n  sizeLabel: $('size-label'),");
}

// 2) 换掉 querySelector 方案
const oldLbl = [
  '    // 标签文字也随类型变（「元素个数」「数字位数」「节点个数」…）',
  "    const labelEl = dom.sizeGroup.querySelector('.label');",
  '    if (labelEl) {',
  '      // 保留 output（数值显示），只改前面的文字',
  "      labelEl.childNodes[0].textContent = sizeCfg.label + ' ';",
  '    }',
].join('\n');
const newLbl = [
  '    // 标签文字也随类型变（「元素个数」「数字位数」「节点个数」…）',
  '    if (dom.sizeLabel) dom.sizeLabel.textContent = sizeCfg.label;',
].join('\n');
if (!c.includes(oldLbl)) { console.log('标签锚点未找到'); process.exit(1); }
c = c.replace(oldLbl, newLbl);

fs.writeFileSync(f, c, 'utf8');
console.log('sizeLabel 已接入');
