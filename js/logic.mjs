export const ITEMS = {
  exempt: { name: '免答卡', icon: '🛡️', desc: '被抽中時用，今次免答，系統重抽另一位' },
  designate: { name: '指定同學卡', icon: '👉', desc: '被抽中時用，指定一位坐低的同學代答' },
  down: { name: '機率卡（調低）', icon: '⬇️', desc: '永久調低自己被抽中的機率' },
  up: { name: '機率卡（調高）', icon: '⬆️', desc: '永久調高另一位同學被抽中的機率' },
};
export const ITEM_KEYS = Object.keys(ITEMS);

export const DEFAULT_SETTINGS = {
  score: { volunteer: 2, drawn: 1, designated: 1, standing: 1 },
  itemOdds: { exempt: 40, designate: 30, down: 15, up: 15 },
  baseWeight: 100,
  weightStep: 20,
  minWeight: 40,
  maxWeight: 200,
  bagCap: 5,
  antiRepeat: true,
  antiRepeatCount: 3,
  showOdds: true,
  animation: true,
};

const clone = (x) => structuredClone(x);
const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);
const now = () => new Date().toISOString();
const emptyItems = () => Object.fromEntries(ITEM_KEYS.map((k) => [k, 0]));

export function createState() {
  return { version: 2, settings: clone(DEFAULT_SETTINGS), classes: [], gifts: [], activeClassId: null, session: null, sessions: [], logs: [] };
}

export const MAX_PIECES = 4;

export function normalizeState(raw) {
  const base = createState();
  if (!raw || typeof raw !== 'object') return base;
  const s = { ...base, ...raw };
  s.settings = { ...clone(DEFAULT_SETTINGS), ...(raw.settings || {}) };
  s.settings.score = { ...DEFAULT_SETTINGS.score, ...(raw.settings?.score || {}) };
  s.settings.itemOdds = { ...DEFAULT_SETTINGS.itemOdds, ...(raw.settings?.itemOdds || {}) };
  s.gifts = Array.isArray(raw.gifts) ? raw.gifts.filter((g) => g && g.id && g.name).map((g) => ({ odds: 10, stock: null, ...g, pieces: clampPieces(g.pieces) })) : [];
  for (const c of s.classes)
    for (const st of c.students) {
      st.items = { ...emptyItems(), ...(st.items || {}) };
      st.frags = st.frags && typeof st.frags === 'object' ? st.frags : {};
    }
  return s;
}

export function parseRoster(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d+)[\s,，.、\t]+(.+)$/);
      return m ? { no: m[1], name: m[2].trim() } : { no: '', name: line };
    })
    .filter((r) => r.name);
}

function fail(msg) {
  throw new Error(msg);
}

export function getClass(state, classId = state.activeClassId) {
  return state.classes.find((c) => c.id === classId) || null;
}

export function getStudent(state, id) {
  for (const c of state.classes) {
    const s = c.students.find((x) => x.id === id);
    if (s) return s;
  }
  return null;
}

function log(state, entry) {
  const st = entry.studentId ? getStudent(state, entry.studentId) : null;
  state.logs.push({
    id: uid(),
    at: now(),
    classId: state.session?.classId ?? state.activeClassId,
    sessionId: state.session?.id ?? null,
    name: st?.name,
    ...entry,
  });
}

export function addClass(state, name, rosterText = '') {
  const s = clone(state);
  const trimmed = String(name || '').trim();
  if (!trimmed) fail('請輸入班名');
  const c = { id: uid(), name: trimmed, students: [] };
  s.classes.push(c);
  s.activeClassId = c.id;
  return addStudents(s, c.id, rosterText);
}

export function renameClass(state, classId, name) {
  const s = clone(state);
  const c = getClass(s, classId) || fail('找不到班別');
  c.name = String(name || '').trim() || c.name;
  return s;
}

export function deleteClass(state, classId) {
  const s = clone(state);
  if (s.session?.classId === classId) fail('請先落堂，再刪除班別');
  s.classes = s.classes.filter((c) => c.id !== classId);
  if (s.activeClassId === classId) s.activeClassId = s.classes[0]?.id ?? null;
  return s;
}

export function addStudents(state, classId, rosterText) {
  const s = clone(state);
  const c = getClass(s, classId) || fail('找不到班別');
  for (const r of parseRoster(rosterText)) {
    c.students.push({
      id: uid(),
      no: r.no || String(c.students.length + 1),
      name: r.name,
      weight: s.settings.baseWeight,
      items: emptyItems(),
      frags: {},
      score: 0,
    });
  }
  return s;
}

export function removeStudent(state, studentId) {
  const s = clone(state);
  if (s.session?.question) fail('問題進行中，請先完成');
  for (const c of s.classes) c.students = c.students.filter((x) => x.id !== studentId);
  if (s.session) {
    delete s.session.absent[studentId];
    delete s.session.standing[studentId];
  }
  return s;
}

export function adjustStudent(state, studentId, patch) {
  const s = clone(state);
  const st = getStudent(s, studentId) || fail('找不到學生');
  const { minWeight, maxWeight, bagCap } = s.settings;
  const changes = {};
  if (patch.name != null && String(patch.name).trim()) st.name = changes.name = String(patch.name).trim();
  if (patch.no != null) st.no = changes.no = String(patch.no).trim();
  if (patch.score != null && Number.isFinite(+patch.score)) st.score = changes.score = Math.round(+patch.score);
  if (patch.weight != null && Number.isFinite(+patch.weight))
    st.weight = changes.weight = Math.min(maxWeight, Math.max(minWeight, Math.round(+patch.weight)));
  if (patch.items) {
    for (const k of ITEM_KEYS) {
      if (patch.items[k] != null && Number.isFinite(+patch.items[k])) st.items[k] = Math.max(0, Math.round(+patch.items[k]));
    }
    let total = bagTotal(st);
    for (const k of [...ITEM_KEYS].reverse()) {
      while (total > bagCap && st.items[k] > 0) {
        st.items[k]--;
        total--;
      }
    }
    changes.items = { ...st.items };
  }
  log(s, { type: 'adjust', studentId, changes });
  return s;
}

export function updateSettings(state, patch) {
  const s = clone(state);
  const next = { ...s.settings, ...patch };
  next.score = { ...s.settings.score, ...(patch.score || {}) };
  next.itemOdds = { ...s.settings.itemOdds, ...(patch.itemOdds || {}) };
  for (const k of ['baseWeight', 'weightStep', 'minWeight', 'maxWeight', 'bagCap', 'antiRepeatCount']) {
    next[k] = Math.max(k === 'weightStep' || k === 'bagCap' ? 0 : 1, Math.round(+next[k] || 0));
  }
  if (next.minWeight > next.maxWeight) fail('最低權重不可以大過最高權重');
  for (const k of ITEM_KEYS) next.itemOdds[k] = Math.max(0, +next.itemOdds[k] || 0);
  if (ITEM_KEYS.every((k) => next.itemOdds[k] === 0)) fail('道具機率不可以全部係 0');
  for (const k of Object.keys(next.score)) next.score[k] = Math.round(+next.score[k] || 0);
  s.settings = next;
  for (const c of s.classes) for (const st of c.students) st.weight = Math.min(next.maxWeight, Math.max(next.minWeight, st.weight));
  return s;
}

export const bagTotal = (st) => ITEM_KEYS.reduce((n, k) => n + (st.items[k] || 0), 0);

export function startSession(state, classId, absentIds = []) {
  const s = clone(state);
  if (s.session) fail('已經有一堂進行中');
  const c = getClass(s, classId) || fail('找不到班別');
  if (!c.students.length) fail('呢班未有學生');
  s.activeClassId = c.id;
  s.session = {
    id: uid(),
    classId: c.id,
    startedAt: now(),
    absent: Object.fromEntries(absentIds.map((id) => [id, true])),
    standing: {},
    recent: [],
    question: null,
    qCount: 0,
  };
  log(s, { type: 'start' });
  return s;
}

export function endSession(state) {
  const s = clone(state);
  const ses = s.session || fail('未上堂');
  log(s, { type: 'end', standingCleared: Object.keys(ses.standing) });
  s.sessions.push({ id: ses.id, classId: ses.classId, startedAt: ses.startedAt, endedAt: now(), qCount: ses.qCount });
  s.session = null;
  return s;
}

export function toggleAbsent(state, studentId) {
  const s = clone(state);
  const ses = s.session || fail('未上堂');
  const q = ses.question;
  if (q && (q.answererId === studentId)) fail('佢而家要答緊問題');
  if (ses.absent[studentId]) delete ses.absent[studentId];
  else {
    ses.absent[studentId] = true;
    delete ses.standing[studentId];
  }
  return s;
}

export function setStanding(state, studentId, standing) {
  const s = clone(state);
  const ses = s.session || fail('未上堂');
  if (standing) ses.standing[studentId] = true;
  else delete ses.standing[studentId];
  log(s, { type: 'manual-stand', studentId, standing: !!standing });
  return s;
}

export function studentStatus(state, studentId) {
  const ses = state.session;
  if (!ses) return 'seated';
  if (ses.absent[studentId]) return 'absent';
  if (ses.standing[studentId]) return 'standing';
  return 'seated';
}

export function drawCandidates(state, exclude = []) {
  const ses = state.session;
  if (!ses) return [];
  const c = getClass(state, ses.classId);
  const { antiRepeat, antiRepeatCount } = state.settings;
  const recent = antiRepeat ? ses.recent.slice(-antiRepeatCount) : [];
  const list = c.students
    .filter((st) => !ses.absent[st.id] && !ses.standing[st.id] && !exclude.includes(st.id))
    .map((st) => ({ id: st.id, name: st.name, weight: st.weight, effective: st.weight * (recent.includes(st.id) ? 0.5 : 1) }));
  const total = list.reduce((n, x) => n + x.effective, 0);
  for (const x of list) x.chance = total ? x.effective / total : 0;
  return list;
}

export function pickWeighted(list, rng = Math.random, key = 'effective') {
  const total = list.reduce((n, x) => n + x[key], 0);
  if (!list.length || total <= 0) return null;
  let r = rng() * total;
  for (const x of list) {
    r -= x[key];
    if (r < 0) return x;
  }
  return list[list.length - 1];
}

export function startDraw(state, rng = Math.random) {
  const s = clone(state);
  const ses = s.session || fail('未上堂');
  if (ses.question) fail('上一條問題未完成');
  const pick = pickWeighted(drawCandidates(s), rng) || fail('冇同學可以抽（全部站立或缺席）');
  ses.question = { kind: 'draw', firstId: pick.id, answererId: pick.id, excluded: [pick.id], designatedBy: null };
  log(s, { type: 'draw', studentId: pick.id });
  return s;
}

export function canUseExempt(state) {
  const q = state.session?.question;
  if (!q) return false;
  const st = getStudent(state, q.answererId);
  return st.items.exempt > 0;
}

export function canUseDesignate(state) {
  const q = state.session?.question;
  if (!q || q.designatedBy) return false;
  const st = getStudent(state, q.answererId);
  return st.items.designate > 0 && designateTargets(state).length > 0;
}

export function designateTargets(state) {
  const q = state.session?.question;
  if (!q) return [];
  return drawCandidates(state, q.excluded);
}

export function useExempt(state, rng = Math.random) {
  const s = clone(state);
  const q = s.session?.question || fail('冇進行中的抽問');
  const st = getStudent(s, q.answererId);
  if (!(st.items.exempt > 0)) fail('冇免答卡');
  const pick = pickWeighted(drawCandidates(s, q.excluded), rng) || fail('冇其他同學可以抽，唔可以用免答卡');
  st.items.exempt--;
  log(s, { type: 'use-item', item: 'exempt', studentId: st.id });
  if (q.designatedBy) q.excluded.push(q.designatedBy);
  q.answererId = pick.id;
  q.excluded.push(pick.id);
  q.designatedBy = null;
  log(s, { type: 'draw', studentId: pick.id, redraw: true });
  return s;
}

export function useDesignate(state, targetId) {
  const s = clone(state);
  const q = s.session?.question || fail('冇進行中的抽問');
  if (q.designatedBy) fail('被指定的同學唔可以再用指定卡');
  const st = getStudent(s, q.answererId);
  if (!(st.items.designate > 0)) fail('冇指定同學卡');
  if (!designateTargets(s).some((x) => x.id === targetId)) fail('只可以指定出席、坐低而且未輪過的同學');
  st.items.designate--;
  log(s, { type: 'use-item', item: 'designate', studentId: st.id, targetId, targetName: getStudent(s, targetId).name });
  q.designatedBy = st.id;
  q.answererId = targetId;
  q.excluded.push(targetId);
  return s;
}

export function cancelQuestion(state) {
  const s = clone(state);
  if (!s.session?.question) return s;
  log(s, { type: 'cancel', studentId: s.session.question.answererId });
  s.session.question = null;
  return s;
}

function rememberAnswer(ses, id) {
  ses.recent.push(id);
  if (ses.recent.length > 50) ses.recent.splice(0, ses.recent.length - 50);
  ses.qCount++;
}

export function resolveDraw(state, correct) {
  const s = clone(state);
  const ses = s.session;
  const q = ses?.question || fail('冇進行中的抽問');
  const st = getStudent(s, q.answererId);
  const mode = q.designatedBy ? 'designated' : 'drawn';
  const points = correct ? s.settings.score[mode] : 0;
  st.score += points;
  if (!correct) ses.standing[st.id] = true;
  log(s, { type: 'answer', mode, studentId: st.id, correct: !!correct, points, designatedBy: q.designatedBy });
  rememberAnswer(ses, st.id);
  ses.question = null;
  return s;
}

const clampPieces = (n) => Math.min(MAX_PIECES, Math.max(1, Math.round(+n) || 1));

export function getGift(state, id) {
  return state.gifts.find((g) => g.id === id) || null;
}

export const giftLabel = (g, piece) => (g.pieces > 1 && piece != null ? `${g.name} ${piece + 1}/${g.pieces}` : g.name);

function cleanGift(input) {
  const name = String(input.name ?? '').trim().slice(0, 24);
  if (!name) fail('請輸入禮物名稱');
  const odds = Math.max(0, +input.odds || 0);
  const stockRaw = input.stock;
  const stock = stockRaw === '' || stockRaw == null ? null : Math.max(0, Math.round(+stockRaw) || 0);
  return { name, pieces: clampPieces(input.pieces), odds, stock, note: String(input.note ?? '').trim().slice(0, 60) };
}

export function addGift(state, input) {
  const s = clone(state);
  const g = cleanGift(input);
  if (s.gifts.some((x) => x.name === g.name)) fail('已經有同名禮物');
  s.gifts.push({ id: uid(), ...g, createdAt: now() });
  return s;
}

export function updateGift(state, id, input) {
  const s = clone(state);
  const g = getGift(s, id) || fail('找不到禮物');
  const next = cleanGift({ ...g, ...input });
  if (s.gifts.some((x) => x.id !== id && x.name === next.name)) fail('已經有同名禮物');
  if (next.pieces !== g.pieces && s.classes.some((c) => c.students.some((st) => (st.frags[id] || []).some((n) => n > 0))))
    fail('已經有同學收集緊呢份禮物，唔可以改碎片數目');
  Object.assign(g, next);
  return s;
}

export function removeGift(state, id) {
  const s = clone(state);
  getGift(s, id) || fail('找不到禮物');
  s.gifts = s.gifts.filter((g) => g.id !== id);
  for (const c of s.classes) for (const st of c.students) delete st.frags[id];
  return s;
}

export function fragCounts(st, g) {
  const arr = st.frags?.[g.id] || [];
  return Array.from({ length: g.pieces }, (_, i) => arr[i] || 0);
}

export const canRedeem = (st, g) => fragCounts(st, g).every((n) => n > 0) && g.stock !== 0;

export function giftOddsTotal(state) {
  return ITEM_KEYS.reduce((n, k) => n + Math.max(0, +state.settings.itemOdds[k] || 0), 0) + state.gifts.filter((g) => g.stock !== 0).reduce((n, g) => n + g.odds, 0);
}

export function rewardPool(state) {
  return [
    ...ITEM_KEYS.map((k) => ({ kind: 'item', k, w: Math.max(0, +state.settings.itemOdds[k] || 0) })),
    ...state.gifts.filter((g) => g.stock !== 0 && g.odds > 0).map((g) => ({ kind: 'gift', id: g.id, w: g.odds })),
  ];
}

export function rollReward(state, rng = Math.random) {
  const pick = pickWeighted(rewardPool(state), rng, 'w');
  if (!pick) return null;
  if (pick.kind === 'item') return { kind: 'item', k: pick.k };
  const g = getGift(state, pick.id);
  return { kind: 'gift', id: g.id, piece: Math.min(g.pieces - 1, Math.floor(rng() * g.pieces)) };
}

export function redeemGift(state, studentId, giftId) {
  const s = clone(state);
  const st = getStudent(s, studentId) || fail('找不到學生');
  const g = getGift(s, giftId) || fail('找不到禮物');
  if (g.stock === 0) fail(`${g.name} 已經換晒`);
  const counts = fragCounts(st, g);
  if (!counts.every((n) => n > 0)) fail(`${st.name} 未集齊 ${g.name}`);
  st.frags[g.id] = counts.map((n) => n - 1);
  if (st.frags[g.id].every((n) => n === 0)) delete st.frags[g.id];
  if (g.stock != null) g.stock--;
  log(s, { type: 'redeem', studentId, giftId: g.id, giftName: g.name });
  return s;
}

export function adjustFrag(state, studentId, giftId, piece, delta) {
  const s = clone(state);
  const st = getStudent(s, studentId) || fail('找不到學生');
  const g = getGift(s, giftId) || fail('找不到禮物');
  const counts = fragCounts(st, g);
  counts[piece] = Math.max(0, (counts[piece] || 0) + delta);
  st.frags[g.id] = counts;
  if (counts.every((n) => n === 0)) delete st.frags[g.id];
  log(s, { type: 'adjust-frag', studentId, giftId, giftName: g.name, piece, pieces: g.pieces, delta });
  return s;
}

export function rollItem(odds, rng = Math.random) {
  const list = ITEM_KEYS.map((k) => ({ k, w: Math.max(0, +odds[k] || 0) }));
  return pickWeighted(list, rng, 'w')?.k ?? null;
}

export function volunteer(state, studentId, correct, rng = Math.random) {
  const s = clone(state);
  const ses = s.session || fail('未上堂');
  if (ses.question) fail('抽問進行中，請先完成');
  if (ses.absent[studentId]) fail('呢位同學標咗缺席');
  const st = getStudent(s, studentId) || fail('找不到學生');
  const wasStanding = !!ses.standing[studentId];
  let points = 0;
  let item = null;
  let bagFull = false;
  let gift = null;
  if (correct) {
    if (wasStanding) {
      points = s.settings.score.standing;
      delete ses.standing[studentId];
    } else {
      points = s.settings.score.volunteer;
      const reward = rollReward(s, rng);
      if (reward?.kind === 'item') {
        if (bagTotal(st) < s.settings.bagCap) {
          item = reward.k;
          st.items[item]++;
        } else bagFull = true;
      } else if (reward?.kind === 'gift') {
        const g = getGift(s, reward.id);
        const counts = fragCounts(st, g);
        counts[reward.piece]++;
        st.frags[g.id] = counts;
        gift = { giftId: g.id, giftName: g.name, piece: reward.piece, pieces: g.pieces };
      }
    }
  }
  st.score += points;
  log(s, { type: 'answer', mode: wasStanding ? 'standing' : 'volunteer', studentId, correct: !!correct, points, item, bagFull, ...(gift || {}), satDown: wasStanding && !!correct });
  rememberAnswer(ses, studentId);
  return s;
}

export function useWeightCard(state, userId, kind, targetId = userId) {
  const s = clone(state);
  if (s.session?.question) fail('抽問進行中，答完先用');
  const user = getStudent(s, userId) || fail('找不到學生');
  const { weightStep, minWeight, maxWeight } = s.settings;
  if (kind === 'down') {
    if (!(user.items.down > 0)) fail('冇調低卡');
    if (user.weight <= minWeight) fail(`權重已經係最低（${minWeight}）`);
    user.items.down--;
    const before = user.weight;
    user.weight = Math.max(minWeight, user.weight - weightStep);
    log(s, { type: 'use-item', item: 'down', studentId: userId, before, after: user.weight });
  } else if (kind === 'up') {
    if (!(user.items.up > 0)) fail('冇調高卡');
    if (targetId === userId) fail('調高卡唔可以對自己用');
    const cls = s.classes.find((c) => c.students.some((x) => x.id === userId));
    const target = cls.students.find((x) => x.id === targetId) || fail('只可以揀同班同學');
    if (target.weight >= maxWeight) fail(`${target.name} 的權重已經係最高（${maxWeight}）`);
    user.items.up--;
    const before = target.weight;
    target.weight = Math.min(maxWeight, target.weight + weightStep);
    log(s, { type: 'use-item', item: 'up', studentId: userId, targetId, targetName: target.name, before, after: target.weight });
  } else fail('未知道具');
  return s;
}

export function classStats(state, classId) {
  const c = getClass(state, classId);
  if (!c) return [];
  const rows = new Map(
    c.students.map((st) => [
      st.id,
      { id: st.id, no: st.no, name: st.name, score: st.score, weight: st.weight, items: { ...st.items }, frags: st.frags || {}, giftsGot: 0, redeemed: 0, answered: 0, correct: 0, volunteer: 0, volunteerCorrect: 0, drawn: 0, drawnCorrect: 0, stood: 0, itemsGot: 0, itemsUsed: 0 },
    ]),
  );
  for (const e of state.logs) {
    if (e.classId !== classId) continue;
    const r = rows.get(e.studentId);
    if (!r) continue;
    if (e.type === 'answer') {
      r.answered++;
      if (e.correct) r.correct++;
      if (e.mode === 'volunteer' || e.mode === 'standing') {
        r.volunteer++;
        if (e.correct) r.volunteerCorrect++;
      } else {
        r.drawn++;
        if (e.correct) r.drawnCorrect++;
        else r.stood++;
      }
      if (e.item) r.itemsGot++;
      if (e.giftId) r.giftsGot++;
    } else if (e.type === 'use-item') r.itemsUsed++;
    else if (e.type === 'redeem') r.redeemed++;
  }
  return [...rows.values()];
}

function csvCell(v) {
  const t = v == null ? '' : String(v);
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export function toCSV(rows) {
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export function statsCSV(state, classId) {
  const head = ['座號', '姓名', '總分', '答問次數', '答對', '主動舉手', '主動答對', '被抽/被指定', '被抽答對', '罰站次數', '得到道具', '用咗道具', '抽中權重', ...ITEM_KEYS.map((k) => ITEMS[k].name), '得到禮物碎片', '已換禮物'];
  const body = classStats(state, classId).map((r) => [r.no, r.name, r.score, r.answered, r.correct, r.volunteer, r.volunteerCorrect, r.drawn, r.drawnCorrect, r.stood, r.itemsGot, r.itemsUsed, r.weight, ...ITEM_KEYS.map((k) => r.items[k]), r.giftsGot, r.redeemed]);
  return toCSV([head, ...body]);
}

export const MODE_LABEL = { volunteer: '主動舉手', standing: '站立舉手', drawn: '被抽中', designated: '被指定' };

export function describeLog(e) {
  switch (e.type) {
    case 'start': return '上堂';
    case 'end': return '落堂';
    case 'draw': return `${e.redraw ? '重抽' : '抽中'}：${e.name}`;
    case 'cancel': return `取消問題（${e.name}）`;
    case 'answer': {
      let t = `${e.name}（${MODE_LABEL[e.mode]}）${e.correct ? '答對' : '答錯'}`;
      if (e.points) t += ` +${e.points}分`;
      if (e.satDown) t += '，坐返低';
      if (!e.correct && (e.mode === 'drawn' || e.mode === 'designated')) t += '，罰站';
      if (e.item) t += `，抽到${ITEMS[e.item].name}`;
      if (e.giftId) t += `，抽到禮物「${e.pieces > 1 ? `${e.giftName} ${e.piece + 1}/${e.pieces}` : e.giftName}」`;
      if (e.bagFull) t += '（背包已滿，冇抽卡）';
      return t;
    }
    case 'use-item':
      if (e.item === 'designate') return `${e.name} 用指定同學卡，指定 ${e.targetName}`;
      if (e.item === 'exempt') return `${e.name} 用免答卡`;
      if (e.item === 'down') return `${e.name} 用調低卡（權重 ${e.before}→${e.after}）`;
      return `${e.name} 對 ${e.targetName} 用調高卡（權重 ${e.before}→${e.after}）`;
    case 'adjust': return `老師調整 ${e.name}`;
    case 'redeem': return `${e.name} 集齊並換領「${e.giftName}」`;
    case 'adjust-frag': return `老師${e.delta > 0 ? '加' : '減'} ${e.name} 的「${e.pieces > 1 ? `${e.giftName} ${e.piece + 1}/${e.pieces}` : e.giftName}」`;
    case 'manual-stand': return `老師將 ${e.name} 設為${e.standing ? '站立' : '坐低'}`;
    default: return e.type;
  }
}
