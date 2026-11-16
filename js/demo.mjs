import * as L from './logic.mjs';

const DEMO_GIFTS = [
  { name: '珍珠奶茶', pieces: 2, odds: 12, stock: 5, note: '集齊兩半，放學前向老師換領一杯。' },
  { name: '免一次功課', pieces: 1, odds: 6, stock: null, note: '指定一份功課可以唔做。' },
  { name: '當一日小老師', pieces: 4, odds: 8, stock: 2, note: '集齊四片，下堂由你帶讀。' },
];

export function addDemo(state) {
  if (state.session) throw new Error('請先落堂，再建立測試班');
  let s = L.addClass(state, '星際探索班 · 測試', ['陳星晴','李浩然','張樂彤','黃子軒','林曉嵐','何宇澄','周芷晴','吳朗希','梁悅心','鄭天佑','謝嘉怡','許柏謙'].map((n,i)=>`${i+1} ${n}`).join('\n'));
  for (const g of DEMO_GIFTS) if (!s.gifts.some((x) => x.name === g.name)) s = L.addGift(s, g);
  const gift = (name) => s.gifts.find((g) => g.name === name);
  const studs = L.getClass(s).students;
  for (const [i, st] of studs.entries()) s = L.adjustStudent(s, st.id, { score: i % 4, items: { exempt: 1, designate: 1, down: 1, up: 1 } });
  const give = (idx, name, pieces) => { for (const p of pieces) s = L.adjustFrag(s, studs[idx].id, gift(name).id, p, 1); };
  give(0, '珍珠奶茶', [0, 1]);
  give(1, '珍珠奶茶', [0]);
  give(2, '當一日小老師', [0, 1, 2]);
  give(3, '免一次功課', [0]);
  return s;
}
