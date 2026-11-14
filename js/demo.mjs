import * as L from './logic.mjs';
export function addDemo(state) {
  if (state.session) throw new Error('請先落堂，再建立測試班');
  let s = L.addClass(state, '星際探索班 · 測試', ['陳星晴','李浩然','張樂彤','黃子軒','林曉嵐','何宇澄','周芷晴','吳朗希','梁悅心','鄭天佑','謝嘉怡','許柏謙'].map((n,i)=>`${i+1} ${n}`).join('\n'));
  for (const [i, st] of L.getClass(s).students.entries()) s = L.adjustStudent(s, st.id, {score:i%4, items:{exempt:1,designate:1,down:1,up:1}});
  return s;
}
