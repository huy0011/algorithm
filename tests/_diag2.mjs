/**
 * 诊断 v2：高精度 + KMP（span 渲染器）+ 栈/队列（structure 渲染器）。
 * 检查渲染器内部状态，定位显示问题。
 * 临时脚本，用完删除。
 */
import { ALGORITHMS } from '../src/algorithms/index.js';
import { buildInput, createVisualizer } from '../src/render/factory.js';

const ctx = new Proxy({}, {
  get(t, k) { if (k === 'measureText') return () => ({ width: 20 }); return () => {}; },
  set() { return true; },
});
const canvas = { width: 0, height: 0, getContext: () => ctx, getBoundingClientRect: () => ({ width: 900, height: 560 }) };
globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
globalThis.requestAnimationFrame = (f) => { setTimeout(() => f(0), 0); return 0; };

console.log('===== 高精度加法（span） =====');
{
  const ba = ALGORITHMS.bigAdd;
  const bin = buildInput(ba, apply({ digits: 10 }));
  function apply(c) { return c; }
  const br = ba.run(bin.input, bin.options);
  const bv = createVisualizer('span', canvas);
  bv.load(br.tracer.result());
  console.log('meta:', JSON.stringify(bv.meta).slice(0, 140));
  console.log('view 长度:', bv.view ? bv.view.length : '无', ' 内容:', bv.view ? bv.view.join(',') : '');
  bv.finish();
  console.log('指针:', JSON.stringify(bv.pointers || {}));
  const accs = Object.fromEntries(Object.entries(bv.accumulates || {}).map(([k, v]) => [k, v.value]));
  console.log('结束后累加:', JSON.stringify(accs));
  console.log('resolved 数:', bv.resolved ? bv.resolved.size : 0);
}

console.log('');
console.log('===== KMP（span） =====');
{
  const kmp = ALGORITHMS.kmp;
  const kin = buildInput(kmp, { size: 22 });
  const kr = kmp.run(kin.input, kin.options);
  const kv = createVisualizer('span', canvas);
  kv.load(kr.tracer.result());
  console.log('meta.text:', kv.meta.text, ' pattern:', kv.meta.pattern);
  console.log('view 长度:', kv.view ? kv.view.length : '无');
  console.log('view 内容:', kv.view ? kv.view.join(',') : '');
  console.log('charOffset:', kv.meta.charOffset);
  // 检查 _displayText 会显示什么
  if (kv.view && kv.view.length) {
    console.log('显示文本(前6位):', kv.view.slice(0, 6).map((_, i) => kv._displayText(i)).join(' '));
  }
  kv.finish();
  console.log('指针:', JSON.stringify(kv.pointers || {}));
  console.log('resolved:', kv.resolved ? kv.resolved.size : 0);
  const accs = Object.keys(kv.accumulates || {});
  console.log('累加项名:', accs.slice(0, 8).join(', '), accs.length > 8 ? '...' : '');
}

console.log('');
console.log('===== 栈（structure） =====');
{
  const st = ALGORITHMS.stackDemo;
  const stin = buildInput(st, { size: 12 });
  const sv = createVisualizer('structure', canvas);
  sv.load(st.run(stin.input, stin.options));
  console.log('meta.text:', sv.meta.text, ' 结构类型:', sv.structureType);
  for (const frac of [0.3, 0.6]) {
    sv.seekToStep(Math.floor(sv.total * frac));
    console.log('  ' + Math.round(frac * 100) + '%: items=' + sv.items.length + ' ' + JSON.stringify(sv.items));
  }
  sv.finish();
  console.log('  结束 items:', sv.items.length, ' resultOk:', sv.resultOk);
}

console.log('');
console.log('===== 队列（structure） =====');
{
  const qd = ALGORITHMS.queueDemo;
  const qin = buildInput(qd, { size: 12 });
  const qv = createVisualizer('structure', canvas);
  qv.load(qd.run(qin.input, qin.options));
  console.log('meta.tasks?', JSON.stringify(qv.meta.tasks || '(无)'));
  for (const frac of [0.3, 0.6]) {
    qv.seekToStep(Math.floor(qv.total * frac));
    console.log('  ' + Math.round(frac * 100) + '%: items=' + qv.items.length + ' ' + JSON.stringify(qv.items));
  }
  qv.finish();
  console.log('  结束 items:', qv.items.length);
}
