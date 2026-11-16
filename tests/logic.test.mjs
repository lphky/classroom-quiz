import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../js/logic.mjs';

const seq = (...v) => {
  let i = 0;
  return () => v[i++ % v.length];
};

function setup(n = 4) {
  let s = L.addClass(L.createState(), '3A', Array.from({ length: n }, (_, i) => `${i + 1} 學生${i + 1}`).join('\n'));
  const ids = L.getClass(s).students.map((x) => x.id);
  s = L.startSession(s, s.activeClassId);
  return { s, ids };
}

test('parseRoster 支援有冇座號', () => {
  assert.deepEqual(L.parseRoster('1 陳大文\n李小明\n\n12,張三'), [
    { no: '1', name: '陳大文' },
    { no: '', name: '李小明' },
    { no: '12', name: '張三' },
  ]);
});

test('抽中答錯要站立，站立者唔會再被抽', () => {
  let { s, ids } = setup(2);
  s = L.startDraw(s, seq(0));
  assert.equal(s.session.question.answererId, ids[0]);
  s = L.resolveDraw(s, false);
  assert.equal(L.studentStatus(s, ids[0]), 'standing');
  assert.equal(L.getStudent(s, ids[0]).score, 0);
  assert.deepEqual(L.drawCandidates(s).map((x) => x.id), [ids[1]]);
  s = L.startDraw(s, seq(0));
  assert.equal(s.session.question.answererId, ids[1]);
  s = L.resolveDraw(s, true);
  assert.equal(L.getStudent(s, ids[1]).score, 1);
  assert.throws(() => L.startDraw(L.resolveDraw(L.startDraw(L.setStanding(s, ids[1], true), seq(0)), false)), /冇同學可以抽/);
});

test('缺席唔會被抽', () => {
  let { s, ids } = setup(3);
  s = L.toggleAbsent(s, ids[0]);
  assert.ok(!L.drawCandidates(s).some((x) => x.id === ids[0]));
});

test('站立者舉手答對坐返低，冇道具', () => {
  let { s, ids } = setup();
  s = L.setStanding(s, ids[0], true);
  s = L.volunteer(s, ids[0], true, seq(0));
  assert.equal(L.studentStatus(s, ids[0]), 'seated');
  assert.equal(L.bagTotal(L.getStudent(s, ids[0])), 0);
  assert.equal(L.getStudent(s, ids[0]).score, s.settings.score.standing);
});

test('主動答對加分及抽道具；答錯冇懲罰', () => {
  let { s, ids } = setup();
  s = L.volunteer(s, ids[0], true, seq(0));
  const st = L.getStudent(s, ids[0]);
  assert.equal(st.score, 2);
  assert.equal(st.items.exempt, 1);
  s = L.volunteer(s, ids[1], false);
  assert.equal(L.studentStatus(s, ids[1]), 'seated');
  assert.equal(L.getStudent(s, ids[1]).score, 0);
});

test('道具機率分佈', () => {
  const odds = { exempt: 40, designate: 30, down: 15, up: 15 };
  assert.equal(L.rollItem(odds, () => 0.0), 'exempt');
  assert.equal(L.rollItem(odds, () => 0.5), 'designate');
  assert.equal(L.rollItem(odds, () => 0.75), 'down');
  assert.equal(L.rollItem(odds, () => 0.99), 'up');
});

test('背包滿咗唔再抽卡', () => {
  let { s, ids } = setup();
  s = L.adjustStudent(s, ids[0], { items: { exempt: 5 } });
  s = L.volunteer(s, ids[0], true, seq(0));
  assert.equal(L.bagTotal(L.getStudent(s, ids[0])), 5);
  assert.equal(s.logs.at(-1).bagFull, true);
});

test('免答卡：重抽另一位，排除用卡者', () => {
  let { s, ids } = setup(3);
  s = L.adjustStudent(s, ids[0], { items: { exempt: 1 } });
  s = L.startDraw(s, seq(0));
  assert.ok(L.canUseExempt(s));
  s = L.useExempt(s, seq(0));
  assert.equal(s.session.question.answererId, ids[1]);
  assert.equal(L.getStudent(s, ids[0]).items.exempt, 0);
  s = L.resolveDraw(s, false);
  assert.equal(L.studentStatus(s, ids[1]), 'standing');
  assert.equal(L.studentStatus(s, ids[0]), 'seated');
});

test('免答卡：冇其他人可以抽就唔可以用，卡保留', () => {
  let { s, ids } = setup(1);
  s = L.adjustStudent(s, ids[0], { items: { exempt: 1 } });
  s = L.startDraw(s, seq(0));
  assert.throws(() => L.useExempt(s), /冇其他同學/);
  assert.equal(L.getStudent(s, ids[0]).items.exempt, 1);
});

test('指定卡：被指定者代答並承擔結果，唔可以再轉指定', () => {
  let { s, ids } = setup(3);
  s = L.adjustStudent(s, ids[0], { items: { designate: 1 } });
  s = L.adjustStudent(s, ids[1], { items: { designate: 1, exempt: 1 } });
  s = L.setStanding(s, ids[2], true);
  s = L.startDraw(s, seq(0));
  assert.deepEqual(L.designateTargets(s).map((x) => x.id), [ids[1]]);
  assert.throws(() => L.useDesignate(s, ids[2]), /只可以指定/);
  s = L.useDesignate(s, ids[1]);
  assert.equal(s.session.question.answererId, ids[1]);
  assert.equal(L.canUseDesignate(s), false);
  assert.throws(() => L.useDesignate(s, ids[0]), /唔可以再用指定卡/);
  const done = L.resolveDraw(s, false);
  assert.equal(L.studentStatus(done, ids[1]), 'standing');
  assert.equal(L.studentStatus(done, ids[0]), 'seated');
  const ok = L.resolveDraw(s, true);
  assert.equal(L.getStudent(ok, ids[1]).score, ok.settings.score.designated);
});

test('被指定者用免答卡：重抽並排除指定者及被指定者', () => {
  let { s, ids } = setup(3);
  s = L.adjustStudent(s, ids[0], { items: { designate: 1 } });
  s = L.adjustStudent(s, ids[1], { items: { exempt: 1 } });
  s = L.startDraw(s, seq(0));
  s = L.useDesignate(s, ids[1]);
  s = L.useExempt(s, seq(0.99));
  assert.equal(s.session.question.answererId, ids[2]);
  assert.equal(s.session.question.designatedBy, null);
});

test('機率卡：上下限、唔可以對自己用調高', () => {
  let { s, ids } = setup(2);
  s = L.adjustStudent(s, ids[0], { items: { down: 4, up: 1 } });
  for (let i = 0; i < 3; i++) s = L.useWeightCard(s, ids[0], 'down');
  assert.equal(L.getStudent(s, ids[0]).weight, 40);
  assert.throws(() => L.useWeightCard(s, ids[0], 'down'), /最低/);
  assert.equal(L.getStudent(s, ids[0]).items.down, 1);
  s = L.adjustStudent(s, ids[0], { items: { down: 0, up: 5 } });
  assert.throws(() => L.useWeightCard(s, ids[0], 'up', ids[0]), /自己/);
  for (let i = 0; i < 5; i++) s = L.useWeightCard(s, ids[0], 'up', ids[1]);
  assert.equal(L.getStudent(s, ids[1]).weight, 200);
});

test('權重影響機率，防連抽減半', () => {
  let { s, ids } = setup(2);
  s = L.adjustStudent(s, ids[0], { weight: 200 });
  let c = L.drawCandidates(s);
  assert.ok(Math.abs(c.find((x) => x.id === ids[0]).chance - 2 / 3) < 1e-9);
  s = L.volunteer(s, ids[0], false);
  c = L.drawCandidates(s);
  assert.ok(Math.abs(c.find((x) => x.id === ids[0]).chance - 0.5) < 1e-9);
  s = L.updateSettings(s, { antiRepeat: false });
  c = L.drawCandidates(s);
  assert.ok(Math.abs(c.find((x) => x.id === ids[0]).chance - 2 / 3) < 1e-9);
});

test('落堂：站立清除，統計正確', () => {
  let { s, ids } = setup(2);
  s = L.startDraw(s, seq(0));
  s = L.resolveDraw(s, false);
  s = L.volunteer(s, ids[0], true);
  s = L.volunteer(s, ids[1], true, seq(0));
  s = L.endSession(s);
  assert.equal(s.session, null);
  assert.equal(L.studentStatus(s, ids[0]), 'seated');
  const rows = L.classStats(s, s.activeClassId);
  const a = rows.find((r) => r.id === ids[0]);
  assert.equal(a.answered, 2);
  assert.equal(a.stood, 1);
  assert.equal(a.volunteerCorrect, 1);
  assert.match(L.statsCSV(s, s.activeClassId), /總分/);
});

test('設定驗證', () => {
  const s = L.createState();
  assert.throws(() => L.updateSettings(s, { minWeight: 300, maxWeight: 100 }), /最低/);
  assert.throws(() => L.updateSettings(s, { itemOdds: { exempt: 0, designate: 0, down: 0, up: 0 } }), /全部/);
});

test('老師自訂禮物：碎片數 1 至 4、驗證及同名', () => {
  let s = L.addGift(L.createState(), { name: '珍珠奶茶', pieces: 2, odds: 10 });
  assert.equal(s.gifts[0].pieces, 2);
  assert.equal(s.gifts[0].stock, null);
  assert.equal(L.addGift(s, { name: '大獎', pieces: 9 }).gifts[1].pieces, 4);
  assert.equal(L.addGift(s, { name: '小獎', pieces: 0 }).gifts[1].pieces, 1);
  assert.throws(() => L.addGift(s, { name: '珍珠奶茶', pieces: 1 }), /同名/);
  assert.throws(() => L.addGift(s, { name: '  ' }), /名稱/);
});

test('主動答對可抽到禮物碎片，集齊先可以換，換完扣存量', () => {
  let { s, ids } = setup(2);
  s = L.addGift(s, { name: '珍珠奶茶', pieces: 2, odds: 100, stock: 1 });
  s = L.updateSettings(s, { itemOdds: { exempt: 0, designate: 0, down: 0, up: 1 } });
  const g = s.gifts[0];
  // 總權重 101：rng 0.5 → 禮物；第二次 rng 0 → 第 1 片
  s = L.volunteer(s, ids[0], true, seq(0.5, 0));
  let e = s.logs.at(-1);
  assert.equal(e.giftId, g.id);
  assert.equal(e.piece, 0);
  assert.match(L.describeLog(e), /珍珠奶茶 1\/2/);
  assert.equal(L.canRedeem(L.getStudent(s, ids[0]), g), false);
  assert.throws(() => L.redeemGift(s, ids[0], g.id), /未集齊/);
  s = L.volunteer(s, ids[0], true, seq(0.5, 0));
  assert.deepEqual(L.fragCounts(L.getStudent(s, ids[0]), g), [2, 0]);
  s = L.volunteer(s, ids[0], true, seq(0.5, 0.99));
  assert.deepEqual(L.fragCounts(L.getStudent(s, ids[0]), g), [2, 1]);
  assert.equal(L.canRedeem(L.getStudent(s, ids[0]), L.getGift(s, g.id)), true);
  s = L.redeemGift(s, ids[0], g.id);
  assert.deepEqual(L.fragCounts(L.getStudent(s, ids[0]), g), [1, 0]);
  assert.equal(L.getGift(s, g.id).stock, 0);
  assert.equal(s.logs.at(-1).type, 'redeem');
  // 存量 0：唔會再抽到
  s = L.volunteer(s, ids[1], true, seq(0.5, 0));
  assert.equal(s.logs.at(-1).giftId, undefined);
  assert.equal(s.logs.at(-1).item, 'up');
  const row = L.classStats(s, s.activeClassId).find((r) => r.id === ids[0]);
  assert.equal(row.giftsGot, 3);
  assert.equal(row.redeemed, 1);
  assert.match(L.statsCSV(s, s.activeClassId), /已換禮物/);
});

test('禮物碎片唔佔背包；背包滿抽中道具卡就冇卡', () => {
  let { s, ids } = setup(1);
  s = L.addGift(s, { name: '貼紙', pieces: 1, odds: 100 });
  s = L.updateSettings(s, { bagCap: 0, itemOdds: { exempt: 100, designate: 0, down: 0, up: 0 } });
  s = L.volunteer(s, ids[0], true, seq(0.75, 0));
  assert.deepEqual(L.fragCounts(L.getStudent(s, ids[0]), s.gifts[0]), [1]);
  s = L.volunteer(s, ids[0], true, seq(0.1));
  assert.equal(s.logs.at(-1).bagFull, true);
});

test('改碎片數目、刪除禮物、老師手動加減碎片', () => {
  let { s, ids } = setup(1);
  s = L.addGift(s, { name: '優先揀位', pieces: 4, odds: 5 });
  const id = s.gifts[0].id;
  s = L.updateGift(s, id, { pieces: 3 });
  assert.equal(L.getGift(s, id).pieces, 3);
  s = L.adjustFrag(s, ids[0], id, 2, 1);
  assert.deepEqual(L.fragCounts(L.getStudent(s, ids[0]), L.getGift(s, id)), [0, 0, 1]);
  assert.throws(() => L.updateGift(s, id, { pieces: 2 }), /唔可以改碎片數目/);
  s = L.updateGift(s, id, { name: '優先揀座位', odds: 8 });
  assert.equal(L.getGift(s, id).name, '優先揀座位');
  s = L.removeGift(s, id);
  assert.equal(s.gifts.length, 0);
  assert.deepEqual(L.getStudent(s, ids[0]).frags, {});
});

test('舊資料（無禮物欄位）可以正常載入', () => {
  const old = { version: 1, classes: [{ id: 'c', name: 'A', students: [{ id: 'x', no: '1', name: '甲', weight: 100, items: { exempt: 1 }, score: 0 }] }] };
  const s = L.normalizeState(old);
  assert.deepEqual(s.gifts, []);
  assert.deepEqual(s.classes[0].students[0].frags, {});
});
