import * as L from './logic.mjs';
import { addDemo } from './demo.mjs';
import { api, ApiError, loadRemote, loadUndo, clearUndo, createSync, legacyBackup, UNDO_MAX } from './store.mjs';

const NEW_HOME = 'https://classroom-quiz-porscheyeung.zocomputer.io/';

const ITEM_KEYS = L.ITEM_KEYS;

const P = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21v-1a6 6 0 0 0-4-5.6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17v-5"/><path d="M13 17V8"/><path d="M18 17v-9"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  play: '<path d="m7 4 13 8-13 8V4Z"/>',
  pause: '<path d="M8 4v16M16 4v16"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3Z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  play2: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
  trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/>',
  flame: '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-1 3-3 4-4 4 0-3-1-5-2-6-1 4-4 6-4 11a7 7 0 0 0 7 7Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  shield: '<path d="M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/>',
  send: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  down: '<path d="M12 4v16M6 14l6 6 6-6"/>',
  up: '<path d="M12 20V4M6 10l6-6 6 6"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/>',
  crown: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7Z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.3 12 3.5 3.5 0 0 0 6 19h11.5Z"/>',
  cloudOff: '<path d="m3 3 18 18"/><path d="M8.5 8.6A6 6 0 0 0 4.3 12 3.5 3.5 0 0 0 6 19h11"/><path d="M20.7 16.6A4.5 4.5 0 0 0 16.1 10.2a6 6 0 0 0-4.6-4.1"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  minus: '<path d="M5 12h14"/>',
  puzzle: '<path d="M10 3h4v2a2 2 0 1 0 4 0V3h3v7h-2a2 2 0 1 0 0 4h2v7h-7v-2a2 2 0 1 0-4 0v2H3v-7h2a2 2 0 1 0 0-4H3V3h7Z"/>',
};
const ic = (k, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;

const CARD = {
  exempt: { rarity: '稀有', tier: 'rare', type: '防禦', when: '被抽中時使用', glyph: 'shield', no: '01' },
  designate: { rarity: '史詩', tier: 'epic', type: '轉移', when: '被抽中時使用', glyph: 'send', no: '02' },
  down: { rarity: '精良', tier: 'fine', type: '隱匿', when: '隨時使用 · 永久', glyph: 'down', no: '03' },
  up: { rarity: '傳說', tier: 'legend', type: '聚焦', when: '隨時使用 · 需老師批准', glyph: 'up', no: '04' },
};
const ITEMS = Object.fromEntries(ITEM_KEYS.map((k) => [k, { ...L.ITEMS[k], ...CARD[k] }]));

function gameCard(k, { cls = '', count = null, tilt = true } = {}) {
  const it = ITEMS[k];
  return `<article class="gcard tier-${it.tier} ${cls}" data-k="${k}"${tilt ? ' data-tilt' : ''}>
    <div class="gc-frame">
      <header class="gc-head"><span class="gc-gem">${ic(it.glyph)}</span><h3 class="gc-name">${esc(it.name)}</h3></header>
      <div class="gc-art"><img src="assets/cards/${k}.webp" alt="" loading="lazy" draggable="false"><span class="gc-rarity">${it.rarity}</span></div>
      <div class="gc-type"><span>${it.type}</span><span>${it.when}</span></div>
      <p class="gc-text">${esc(it.desc)}</p>
      <footer class="gc-foot"><span>CLASSROOM QUEST</span><span>No.${it.no}</span></footer>
    </div>
    <span class="gc-shine"></span>${count ? `<span class="gc-count">×${count}</span>` : ''}
  </article>`;
}

function giftArt(g, lit) {
  const cols = Array.from({ length: g.pieces }, (_, i) => `<i class="${lit(i) ? 'on' : 'off'}"></i>`).join('');
  return `<div class="gc-art gift-art" style="--gh:${hue(g.name) % 80 - 40}deg"><img src="assets/cards/gift.webp" alt="" loading="lazy" draggable="false"><span class="gc-slices" style="--n:${g.pieces}">${cols}</span>`;
}

function giftCard(g, { piece = null, owned = null, cls = '', count = null, tilt = true } = {}) {
  const n = g.pieces;
  const lit = piece != null ? (i) => i === piece : owned ? (i) => owned[i] > 0 : () => true;
  const tag = n === 1 ? '完整禮物' : piece != null ? `碎片 ${piece + 1}/${n}` : `${n} 片合成`;
  return `<article class="gcard tier-gift ${cls}" data-gift="${g.id}"${tilt ? ' data-tilt' : ''}>
    <div class="gc-frame">
      <header class="gc-head"><span class="gc-gem">${ic('gift')}</span><h3 class="gc-name">${esc(L.giftLabel(g, piece))}</h3></header>
      ${giftArt(g, lit)}<span class="gc-rarity">${tag}</span></div>
      <div class="gc-type"><span>老師禮物</span><span>${n === 1 ? '抽中即可換領' : `集齊 ${n} 片換領`}</span></div>
      <p class="gc-text">${esc(g.note || (n === 1 ? `向老師換領「${g.name}」。` : `集齊 ${n} 張碎片，向老師換領「${g.name}」。`))}</p>
      <footer class="gc-foot"><span>TEACHER GIFT</span><span>${piece != null && n > 1 ? `${piece + 1} / ${n}` : `× ${n}`}</span></footer>
    </div>
    <span class="gc-shine"></span>${piece != null && n > 1 ? `<span class="gc-piece">${piece + 1}/${n}</span>` : ''}${count ? `<span class="gc-count">×${count}</span>` : ''}
  </article>`;
}

let state = L.createState();
let undo = [];
let me = null;
let sync = null;
let syncStatus = 'saved';
const ui = { tab: 'class', modal: null, rolling: false, absentDraft: {}, filter: 'all', search: '', admin: null, giftEdit: null, pieces: 2 };
let rng = Math.random;

const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduceMotion = () => !state.settings.animation || matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hue = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const persist = () => sync?.save(state, undo);
const avatar = (s, size = '') => `<span class="avatar ${size}" style="--h:${hue(s.name)}">${esc([...s.name].slice(-2).join(''))}</span>`;

function commit(next, label) {
  undo.push({ label, state });
  if (undo.length > UNDO_MAX) undo.shift();
  state = next;
  persist();
  render();
}

function attempt(fn, label) {
  try {
    commit(fn(state), label);
    return true;
  } catch (e) {
    toast(e.message, true);
    return false;
  }
}

function doUndo() {
  const last = undo.pop();
  if (!last) return toast('冇嘢可以復原');
  state = last.state;
  ui.modal = null;
  persist();
  render();
  toast(`已復原：${last.label}`);
}

let toastTimer;
function toast(msg, bad = false) {
  const t = $('#toast');
  t.innerHTML = `${ic(bad ? 'x' : 'check')}<span>${esc(msg)}</span>`;
  t.className = `toast${bad ? ' bad' : ''}`;
  t.hidden = false;
  t.style.animation = 'none';
  void t.offsetWidth;
  t.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

const cls = () => L.getClass(state);
const stu = (id) => L.getStudent(state, id);
const fragTotal = (st) => Object.values(st.frags || {}).reduce((n, a) => n + a.reduce((x, y) => x + y, 0), 0);
const readyGifts = (st) => state.gifts.filter((g) => L.canRedeem(st, g));
const itemDots = (st) => {
  const f = fragTotal(st);
  const ready = readyGifts(st).length;
  return ITEM_KEYS.filter((k) => st.items[k] > 0)
    .map((k) => `<span class="dot tier-${ITEMS[k].tier}" title="${esc(ITEMS[k].name)} × ${st.items[k]}">${ic(ITEMS[k].glyph)}${st.items[k] > 1 ? `<b>${st.items[k]}</b>` : ''}</span>`)
    .join('') + (f ? `<span class="dot tier-gift${ready ? ' ready' : ''}" title="禮物碎片 ${f} 張${ready ? `，可換 ${ready} 份` : ''}">${ic('gift')}${f > 1 ? `<b>${f}</b>` : ''}</span>` : '');
};
const pct = (x) => `${(x * 100).toFixed(1)}%`;

const TABS = [
  ['class', '課堂', 'grid'],
  ['cards', '道具圖鑑', 'layers'],
  ['gifts', '禮物', 'gift'],
  ['students', '學生', 'users'],
  ['report', '報表', 'chart'],
  ['settings', '設定', 'sliders'],
  ['admin', '老師帳戶', 'key', true],
];
const TITLES = { class: ['課堂', '抽問、作答及道具'], cards: ['道具圖鑑', '四款技能卡'], gifts: ['禮物', '自訂獎賞及碎片收集'], students: ['學生', '名單、分數及背包'], report: ['報表', '成績與紀錄'], settings: ['設定', '規則、備份及測試資料'], admin: ['老師帳戶', '新增、停用及管理員權限'] };
const SYNC_TEXT = { saved: ['cloud', '已儲存'], saving: ['cloud', '儲存中'], offline: ['cloudOff', '離線，稍後重試'], auth: ['lock', '請重新登入'] };

function renderHeader() {
  $('#tabs').innerHTML = TABS.filter((t) => !t[3] || me?.isAdmin).map(([k, n, i]) => `<button class="tab${ui.tab === k ? ' on' : ''}" data-act="tab" data-v="${k}"${ui.tab === k ? ' aria-current="page"' : ''}>${ic(i)}<span>${n}</span></button>`).join('');
  const c = cls();
  $('#sideFoot').innerHTML = c ? `<div class="side-class">${ic('users')}<div><b>${esc(c.name)}</b><small>${c.students.length} 位學生 · ${state.session ? '<i class="live-dot"></i>上課中' : '未上堂'}</small></div></div>` : '';
  const [t, sub] = TITLES[ui.tab];
  $('#topTitle').innerHTML = `<h1>${t}</h1><p>${sub}</p>`;
  const sel = $('#classSelect');
  sel.innerHTML = state.classes.length
    ? state.classes.map((k) => `<option value="${k.id}"${k.id === state.activeClassId ? ' selected' : ''}>${esc(k.name)}</option>`).join('')
    : '<option>未有班別</option>';
  sel.disabled = !state.classes.length || !!state.session;
  sel.title = state.session ? '上緊堂，落堂先可以轉班' : '';
  const btn = $('#undoBtn');
  btn.innerHTML = `${ic('undo')}<span>復原</span>`;
  btn.disabled = !undo.length;
  btn.title = undo.length ? `復原：${undo[undo.length - 1].label}` : '冇嘢可以復原';
  $('#fsBtn').innerHTML = ic('maximize');
  renderSync();
  const a = $('#acctBtn');
  a.innerHTML = `<span class="avatar sm" style="--h:${hue(me?.name || '')}">${esc([...(me?.name || '?')].slice(-2).join(''))}</span><span class="acct-name">${esc(me?.name || '')}</span>`;
  a.title = `${me?.name || ''}（${me?.username || ''}）`;
}

function renderSync() {
  const el = $('#syncPill');
  if (!el) return;
  const [i, t] = SYNC_TEXT[syncStatus] || SYNC_TEXT.saved;
  el.className = `sync-pill ${syncStatus}`;
  el.innerHTML = `${ic(i)}<span>${t}</span>`;
  el.title = syncStatus === 'saved' ? '資料已安全儲存在伺服器' : t;
}

function render() {
  renderHeader();
  const app = $('#app');
  if (ui.tab === 'admin' && !me?.isAdmin) ui.tab = 'class';
  const views = { class: viewClass, cards: viewCards, gifts: viewGifts, students: viewStudents, report: viewReport, settings: viewSettings, admin: viewAdmin };
  app.innerHTML = `<div class="view view-${ui.tab}">${views[ui.tab]()}</div>`;
  renderModal();
  filterRoster();
  updateClock();
}

function viewCards() {
  return `<section class="cards-hero">
      <div><span class="kicker">${ic('sparkle')}技能卡收藏</span><h2 class="display">主動舉手答對，<br>即可抽一張技能卡。</h2>
      <p class="muted">站立同學答對可以坐低，但不抽卡。每人背包上限 ${state.settings.bagCap} 張，道具跨堂保留。</p></div>
      <div class="odds">${ITEM_KEYS.map((k) => { const t = L.giftOddsTotal(state) || 1; const v = Math.round(state.settings.itemOdds[k] / t * 100); return `<div class="odd tier-${ITEMS[k].tier}"><span>${esc(ITEMS[k].name)}</span><i style="--v:${v}%"></i><b>${v}%</b></div>`; }).join('')}${giftShare() ? `<div class="odd tier-gift"><span>老師禮物</span><i style="--v:${giftShare()}%"></i><b>${giftShare()}%</b></div>` : ''}</div>
    </section>
    <div class="deck">${ITEM_KEYS.map((k, i) => `<div class="deck-slot" style="--i:${i}">${gameCard(k, { cls: 'collectible' })}</div>`).join('')}</div>
    <section class="panel rules"><h3>公平遊戲約定</h3><ul>
      <li>${ic('check')}被指定的同學不能再用指定卡轉嫁。</li>
      <li>${ic('check')}抽中權重有上下限（${state.settings.minWeight}–${state.settings.maxWeight}），不會有人永遠被抽或永遠抽不中。</li>
      <li>${ic('check')}調高別人機率需要老師批准，可以否決。</li></ul></section>`;
}

function viewNewClass(intro = true) {
  const form = `<form data-form="newClass" class="stack">
      <label class="field"><span>班名</span><input name="name" required placeholder="例如：3A 中文"></label>
      <label class="field"><span>學生名單（每行一位，可寫「座號 姓名」）</span><textarea name="roster" rows="7" placeholder="1 陳大文&#10;2 李小明&#10;3 張美玲"></textarea></label>
      <button class="btn primary">${ic('plus')}建立班別</button>
    </form>`;
  if (!intro) return `<section class="panel"><h3>新增班別</h3>${form}</section>`;
  return `<section class="welcome">
      <div class="welcome-copy"><span class="kicker">${ic('sparkle')}課堂答問管理</span>
        <h2 class="display">讓每一次舉手，<br>都變成一場冒險。</h2>
        <p class="muted">抽人作答、站立挑戰、收集技能卡及老師禮物。資料安全儲存在你的老師帳戶。</p>
        <button class="btn primary xl" data-act="demo">${ic('play2')}一鍵體驗 · 12 人測試班</button>
        <div class="welcome-fan">${ITEM_KEYS.map((k, i) => `<div class="fan" style="--i:${i}">${gameCard(k, { tilt: false })}</div>`).join('')}</div>
      </div>
      <div class="panel welcome-form"><h3>或者，建立你的班別</h3>${form}</div>
    </section>`;
}

function viewClass() {
  const c = cls();
  if (!c) return viewNewClass();
  if (!state.session) return viewAttendance(c);
  return viewLive(c);
}

function viewAttendance(c) {
  if (!c.students.length) return `<section class="panel empty"><h2>${esc(c.name)}</h2><p class="muted">這班未有學生，請到「學生」加入名單。</p><button class="btn primary" data-act="tab" data-v="students">${ic('plus')}加入學生</button></section>`;
  const absentCount = c.students.filter((s) => ui.absentDraft[s.id]).length;
  return `<section class="panel">
    <div class="panel-head"><div><h2>${esc(c.name)} · 點名</h2><p class="muted">點選名字標示缺席，缺席同學不會被抽中。</p></div>
      <div class="att-count"><span><b>${c.students.length - absentCount}</b>出席</span><span><b>${absentCount}</b>缺席</span></div></div>
    <div class="grid">
      ${c.students.map((s) => `<button class="tile ${ui.absentDraft[s.id] ? 'absent' : 'seated'}" data-act="draftAbsent" data-id="${s.id}">
        ${avatar(s)}<span class="tile-body"><span class="nm">${esc(s.name)}</span><span class="no">#${esc(s.no)}</span></span><span class="badge">${ui.absentDraft[s.id] ? '缺席' : '出席'}</span></button>`).join('')}
    </div>
    <div class="panel-foot"><button class="btn primary xl" data-act="startSession">${ic('play')}開始上堂</button></div>
  </section>`;
}

const RING = 2 * Math.PI * 44;
function viewLive(c) {
  const ses = state.session;
  const cands = L.drawCandidates(state);
  const chance = Object.fromEntries(cands.map((x) => [x.id, x.chance]));
  const standingCount = c.students.filter((s) => ses.standing[s.id]).length;
  const recentLogs = state.logs.filter((e) => e.sessionId === ses.id && !['start', 'adjust'].includes(e.type)).slice(-10).reverse();
  const answers = state.logs.filter((e) => e.sessionId === ses.id && e.type === 'answer');
  const wins = answers.filter((e) => e.correct).length;
  const participants = new Set(answers.map((e) => e.studentId)).size;
  const streak = answers.slice().reverse().findIndex((e) => !e.correct);
  const combo = streak < 0 ? answers.length : streak;
  const done = wins >= 10;
  return `<div class="live">
    <div class="live-main">
      <section class="actions">
        <button class="action hand" data-act="volunteer"><span class="action-ic">${ic('hand')}</span><span class="action-copy"><strong>有人舉手</strong><small>主動答對 +${state.settings.score.volunteer} 分及抽卡</small></span>${ic('chevron', 'action-go')}</button>
        <button class="action draw" data-act="draw"><span class="action-ic">${ic('dice')}</span><span class="action-copy"><strong>冇人舉手，抽人</strong><small>隨機邀請 · 讓每位都有機會</small></span>${ic('chevron', 'action-go')}</button>
      </section>
      <section class="pulse-grid" aria-label="課堂即時數據">
        <div class="pulse"><span class="pulse-ic">${ic('target')}</span><strong>${answers.length ? Math.round((wins / answers.length) * 100) : 0}%</strong><span>今堂答對率</span></div>
        <div class="pulse"><span class="pulse-ic">${ic('users')}</span><strong>${participants}</strong><span>已參與同學</span></div>
        <div class="pulse"><span class="pulse-ic">${ic('flame')}</span><strong>${combo}<small> COMBO</small></strong><span>連續答對</span></div>
      </section>
      <section class="panel roster">
        <div class="panel-head">
          <div class="stats"><h2>${esc(c.name)}</h2><span class="chip">已問 <b>${ses.qCount}</b> 題</span><span class="chip warn">站立 ${standingCount} 人</span><span class="chip">可抽 ${cands.length} 人</span></div>
          <button class="btn secondary" data-act="endSession">${ic('logout')}落堂</button>
        </div>
        <div class="roster-tools"><label class="search">${ic('search')}<input id="rosterSearch" type="search" placeholder="搜尋姓名或座號" aria-label="搜尋學生" value="${esc(ui.search)}"></label>
          <div class="seg" aria-label="學生狀態篩選">${[['all', '全班'], ['standing', '站立優先'], ['seated', '坐低'], ['absent', '缺席']].map(([v, n]) => `<button data-act="filterRoster" data-v="${v}" class="${ui.filter === v ? 'on' : ''}" aria-pressed="${ui.filter === v}">${n}</button>`).join('')}</div></div>
        <div class="grid" id="liveRoster">
          ${c.students.map((s) => {
            const st = L.studentStatus(state, s.id);
            const label = { seated: '坐低', standing: '站立', absent: '缺席' }[st];
            return `<button class="tile ${st}" data-status="${st}" data-search="${esc(s.no + ' ' + s.name)}" data-act="studentSheet" data-id="${s.id}">
              ${avatar(s)}<span class="tile-body"><span class="nm">${esc(s.name)}</span><span class="no">#${esc(s.no)}${state.settings.showOdds && chance[s.id] != null ? ` · ${pct(chance[s.id])}` : ''}</span></span>
              <span class="score">${s.score}分</span><span class="tile-meta"><span class="badge st">${label}</span><span class="chips">${itemDots(s)}</span></span></button>`;
          }).join('')}
        </div>
      </section>
    </div>
    <aside class="live-side">
      <section class="panel mission${done ? ' done' : ''}"><div class="mission-head">${ic('trophy')}<div><h3>${done ? '任務達成' : '全班合作任務'}</h3><p class="muted">全班累積答對 10 題</p></div><b>${wins} / 10</b></div><progress max="10" value="${Math.min(10, wins)}"></progress></section>
      <section class="panel timer"><div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="ring-bg"/><circle cx="50" cy="50" r="44" class="ring-fg" id="clockRing" stroke-dasharray="${RING}" stroke-dashoffset="0"/></svg><div class="ring-txt"><strong id="questClock">${clockLeft || '時間到'}</strong><small>思考倒數</small></div></div>
        <div class="row"><button class="btn primary" data-act="timer">${ic(clockRunning ? 'pause' : 'play')}${clockRunning ? '暫停' : '開始'}倒數</button><button class="btn secondary" data-act="resetTimer">${ic('refresh')}重設 30 秒</button></div></section>
      <section class="panel"><h3>今堂紀錄</h3>${recentLogs.length ? `<ol class="log">${recentLogs.map((e) => `<li class="${e.type === 'answer' ? (e.correct ? 'ok' : 'no') : 'item'}"><time>${new Date(e.at).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}</time><span>${esc(L.describeLog(e))}</span></li>`).join('')}</ol>` : '<p class="muted small">未有紀錄，開始第一條問題吧。</p>'}</section>
    </aside>
  </div>`;
}

function viewStudents() {
  const c = cls();
  const classList = state.classes
    .map((k) => `<li><span class="cl-name">${esc(k.name)}<small>${k.students.length} 人</small></span><span class="row">
      <button class="btn sm ${k.id === state.activeClassId ? 'primary' : 'secondary'}" data-act="pickClass" data-id="${k.id}">${k.id === state.activeClassId ? '目前' : '選擇'}</button>
      <button class="btn sm ghost" data-act="renameClass" data-id="${k.id}">${ic('edit')}改名</button>
      <button class="btn sm danger-ghost" data-act="deleteClass" data-id="${k.id}">${ic('trash')}刪除</button></span></li>`)
    .join('');
  const table = c
    ? `<section class="panel"><div class="panel-head"><div><h2>${esc(c.name)} 學生</h2><p class="muted">直接修改格子即會儲存。權重 ${state.settings.baseWeight} 為正常，範圍 ${state.settings.minWeight}–${state.settings.maxWeight}。</p></div></div>
    <div class="table-wrap"><table class="edit"><thead><tr><th>座號</th><th>姓名</th><th>分數</th><th>抽中權重</th>${ITEM_KEYS.map((k) => `<th title="${esc(ITEMS[k].name)}"><span class="dot tier-${ITEMS[k].tier}">${ic(ITEMS[k].glyph)}</span>${esc(ITEMS[k].name.replace('機率卡', ''))}</th>`).join('')}<th></th></tr></thead><tbody>
    ${c.students.map((s) => `<tr data-id="${s.id}">
        <td><input data-field="no" value="${esc(s.no)}" size="3"></td>
        <td><input data-field="name" value="${esc(s.name)}"></td>
        <td><input data-field="score" type="number" value="${s.score}"></td>
        <td><input data-field="weight" type="number" step="${state.settings.weightStep || 1}" min="${state.settings.minWeight}" max="${state.settings.maxWeight}" value="${s.weight}"></td>
        ${ITEM_KEYS.map((k) => `<td><input data-field="item:${k}" type="number" min="0" value="${s.items[k]}"></td>`).join('')}
        <td><button class="btn sm danger-ghost" data-act="removeStudent" data-id="${s.id}" aria-label="刪除 ${esc(s.name)}">${ic('trash')}</button></td></tr>`).join('')}
    </tbody></table></div>
    <form data-form="addStudents" class="inline-form"><label class="field"><span>加入學生（每行一位）</span><textarea name="roster" rows="2" placeholder="31 黃志強"></textarea></label><button class="btn secondary">${ic('plus')}加入</button></form></section>`
    : '';
  return `${table}<div class="two-col"><section class="panel"><h3>班別</h3><ul class="class-list">${classList || '<li class="muted">未有班別</li>'}</ul></section>${viewNewClass(false)}</div>`;
}

function viewReport() {
  const c = cls();
  if (!c) return '<section class="panel empty"><p class="muted">未有班別。</p></section>';
  const rows = L.classStats(state, c.id).sort((a, b) => b.score - a.score || a.no.localeCompare(b.no, 'en', { numeric: true }));
  const logs = state.logs.filter((e) => e.classId === c.id && e.type !== 'start').slice(-150).reverse();
  const sessions = state.sessions.filter((s) => s.classId === c.id);
  const podium = rows.slice(0, 3);
  return `<section class="panel"><div class="panel-head"><div><h2>${esc(c.name)} 成績</h2><p class="muted">共上了 ${sessions.length} 堂${state.session?.classId === c.id ? '（另有一堂進行中）' : ''}</p></div>
    <span class="row"><button class="btn primary" data-act="exportStats">${ic('download')}下載成績 (CSV)</button><button class="btn secondary" data-act="exportLogs">${ic('download')}下載紀錄 (CSV)</button></span></div>
    ${podium.length ? `<div class="podium">${podium.map((r, i) => `<div class="pod p${i + 1}">${avatar(r, 'lg')}<b>${esc(r.name)}</b><span>${r.score} 分</span><i>${i + 1}</i></div>`).join('')}</div>` : ''}
    <div class="table-wrap"><table><thead><tr><th>#</th><th>座號</th><th>姓名</th><th>總分</th><th>答問</th><th>答對率</th><th>主動</th><th>被抽</th><th>罰站</th><th>道具 得/用</th><th>碎片 得/換禮</th><th>權重</th><th>背包</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.no)}</td><td>${esc(r.name)}</td><td><b>${r.score}</b></td><td>${r.answered}</td><td>${r.answered ? Math.round((r.correct / r.answered) * 100) + '%' : '—'}</td>
      <td>${r.volunteerCorrect}/${r.volunteer}</td><td>${r.drawnCorrect}/${r.drawn}</td><td>${r.stood}</td><td>${r.itemsGot}/${r.itemsUsed}</td><td>${r.giftsGot}/${r.redeemed}</td><td>${r.weight}</td><td><span class="chips">${itemDots(r) || '—'}</span></td></tr>`).join('')}
    </tbody></table></div><p class="muted small">「主動」「被抽」顯示 答對/次數。</p></section>
    <section class="panel"><h3>最近紀錄</h3>${logs.length ? `<ol class="log">${logs.map((e) => `<li class="${e.type === 'answer' ? (e.correct ? 'ok' : 'no') : 'item'}"><time>${new Date(e.at).toLocaleString('zh-HK', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><span>${esc(L.describeLog(e))}</span></li>`).join('')}</ol>` : '<p class="muted">未有紀錄</p>'}</section>`;
}

function giftShare() {
  const t = L.giftOddsTotal(state);
  if (!t) return 0;
  return Math.round((state.gifts.filter((g) => g.stock !== 0).reduce((n, g) => n + g.odds, 0) / t) * 100);
}

function pieceStrip(g, lit = () => true) {
  return `<span class="piece-strip" style="--n:${g.pieces};--gh:${hue(g.name) % 80 - 40}deg">${Array.from({ length: g.pieces }, (_, i) => `<span class="${lit(i) ? 'on' : 'off'}" style="--px:${g.pieces > 1 ? (i / (g.pieces - 1)) * 100 : 50}%"><b>${g.pieces > 1 ? `${i + 1}/${g.pieces}` : '完整'}</b></span>`).join('')}</span>`;
}

function fragTrack(g, counts) {
  const have = counts.filter(Boolean).length;
  return `<div class="frag-track"><div class="frag-head"><span>${ic('puzzle')}${esc(g.name)}</span><b>${have} / ${g.pieces} 片</b></div>${pieceStrip(g, (i) => counts[i] > 0)}${counts.some((n) => n > 1) ? `<p class="muted small">重複：${counts.map((n, i) => (n > 1 ? `${i + 1}/${g.pieces} ×${n}` : '')).filter(Boolean).join('、')}</p>` : ''}</div>`;
}

function giftPreview(g) {
  return `${giftCard(g, { tilt: false })}${g.pieces > 1 ? `<p class="muted small center">同學會抽到：${Array.from({ length: g.pieces }, (_, i) => `「${esc(g.name)} ${i + 1}/${g.pieces}」`).join('、')}</p>` : ''}`;
}

function sheetGifts(s) {
  if (!state.gifts.length) return '';
  const rows = state.gifts
    .map((g) => {
      const c = L.fragCounts(s, g);
      if (!ui.fragEdit && !c.some(Boolean)) return '';
      const ready = L.canRedeem(s, g);
      return `<div class="gift-row${ready ? ' ready' : ''}">
        <div class="gift-row-main"><b>${esc(g.name)}</b>${pieceStrip(g, (i) => c[i] > 0)}</div>
        ${ui.fragEdit ? `<div class="frag-edit">${c.map((n, i) => `<span><button type="button" class="btn icon-btn sm" data-act="fragAdj" data-gift="${g.id}" data-piece="${i}" data-d="-1" aria-label="減少 ${esc(L.giftLabel(g, i))}" ${n ? '' : 'disabled'}>${ic('minus')}</button><i>${g.pieces > 1 ? `${i + 1}/${g.pieces}` : '完整'} ×${n}</i><button type="button" class="btn icon-btn sm" data-act="fragAdj" data-gift="${g.id}" data-piece="${i}" data-d="1" aria-label="增加 ${esc(L.giftLabel(g, i))}">${ic('plus')}</button></span>`).join('')}</div>`
        : ready ? `<button class="btn gold sm" data-act="redeem" data-id="${s.id}" data-gift="${g.id}">${ic('gift')}換領</button>` : `<span class="muted small">${c.filter(Boolean).length}/${g.pieces}</span>`}
      </div>`;
    })
    .join('');
  return `<div class="sub-row"><h3 class="sub">禮物碎片</h3><button type="button" class="btn ghost sm" data-act="toggleFragEdit">${ic('edit')}${ui.fragEdit ? '完成調整' : '老師調整'}</button></div>
    <div class="gift-rows">${rows || '<p class="muted small">未有禮物碎片。主動舉手答對就有機會抽到。</p>'}</div>`;
}

function giftCounts(g) {
  let given = 0;
  let redeemed = 0;
  for (const e of state.logs) {
    if (e.giftId !== g.id) continue;
    if (e.type === 'answer') given++;
    else if (e.type === 'redeem') redeemed++;
  }
  return { given, redeemed };
}

const SAMPLE_GIFT = { id: 'sample', name: '珍珠奶茶', pieces: 2, note: '' };

function viewGifts() {
  const c = cls();
  const total = L.giftOddsTotal(state) || 1;
  const ready = c ? c.students.flatMap((st) => readyGifts(st).map((g) => ({ st, g }))) : [];
  const collecting = c ? c.students.filter((st) => fragTotal(st) > 0) : [];
  const shelf = state.gifts
    .map((g, i) => {
      const { given, redeemed } = giftCounts(g);
      const chance = g.stock === 0 ? 0 : (g.odds / total) * 100;
      return `<article class="gift-item" style="--i:${i}"><div class="gift-item-card">${giftCard(g)}</div>
        <div class="gift-item-body"><div><h3>${esc(g.name)}</h3><p class="muted small">${g.pieces === 1 ? '抽中即可換領' : `分成 ${g.pieces} 張碎片，集齊先可以換`}</p></div>
          ${pieceStrip(g)}
          <dl class="gift-stats"><div><dt>抽中機會</dt><dd>${chance ? `${chance < 1 ? chance.toFixed(1) : Math.round(chance)}%` : '暫停'}</dd></div><div><dt>尚餘</dt><dd>${g.stock == null ? '不限' : `${g.stock} 份`}</dd></div><div><dt>已派出</dt><dd>${given}</dd></div><div><dt>已換領</dt><dd>${redeemed}</dd></div></dl>
          <div class="row"><button class="btn secondary sm" data-act="editGift" data-gift="${g.id}">${ic('edit')}編輯</button><button class="btn danger-ghost sm" data-act="deleteGift" data-gift="${g.id}">${ic('trash')}刪除</button></div>
        </div></article>`;
    })
    .join('');
  return `<section class="gifts-hero">
      <div class="gifts-hero-copy"><span class="kicker">${ic('gift')}老師禮物</span><h2 class="display">把真實獎賞，<br>變成要收集的卡。</h2>
        <p class="muted">主動舉手答對時，除咗技能卡，亦有機會抽中你設定的禮物。每份禮物可以拆成 1 至 4 張碎片，例如「珍珠奶茶」分 2 張，同學要集齊「1/2」同「2/2」先可以換。碎片唔佔背包位置。</p>
        <div class="row wrap"><button class="btn primary" data-act="newGift">${ic('plus')}新增禮物</button><span class="chip">每次答對抽中禮物：<b>${giftShare()}%</b></span></div></div>
      <div class="gifts-hero-art">${state.gifts.length > 1 ? `<div class="fan" style="--i:0">${giftCard(state.gifts[1], { tilt: false, piece: state.gifts[1].pieces > 1 ? 1 : null })}</div>` : ''}<div class="fan" style="--i:1">${giftCard(state.gifts[0] || SAMPLE_GIFT, { tilt: false, piece: (state.gifts[0] || SAMPLE_GIFT).pieces > 1 ? 0 : null })}</div></div>
    </section>
    ${ready.length ? `<section class="panel ready-panel"><div class="panel-head"><div><h3>${ic('sparkle')}${esc(c.name)} · 可以換領</h3><p class="muted">以下同學已集齊碎片，換領後記得實際交禮物。</p></div></div>
      <div class="ready-list">${ready.map(({ st, g }) => `<div class="ready-row">${avatar(st)}<span class="nm">${esc(st.name)}</span><span class="ready-gift">${ic('gift')}${esc(g.name)}</span><button class="btn gold sm" data-act="redeem" data-id="${st.id}" data-gift="${g.id}">換領</button></div>`).join('')}</div></section>` : ''}
    ${state.gifts.length ? `<section class="gift-shelf">${shelf}</section>` : `<section class="panel empty"><h3>未有禮物</h3><p class="muted">按「新增禮物」加入第一份獎賞，例如珍珠奶茶、免一次功課、當一日小老師。</p></section>`}
    ${c && collecting.length && state.gifts.length ? `<section class="panel"><h3>${esc(c.name)} 收集進度</h3><div class="collect-list">${collecting.map((st) => `<div class="collect-row">${avatar(st)}<span class="nm">${esc(st.name)}</span><span class="collect-gifts">${state.gifts.filter((g) => L.fragCounts(st, g).some(Boolean)).map((g) => `<span class="collect-gift"><small>${esc(g.name)}</small>${pieceStrip(g, (i) => L.fragCounts(st, g)[i] > 0)}</span>`).join('')}</span></div>`).join('')}</div></section>` : ''}`;
}

const genPassword = () => {
  const a = 'abcdefghjkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(10));
  return [...r].map((x) => a[x % a.length]).join('');
};

let adminLoading = false;
async function loadAdmin() {
  if (adminLoading) return;
  adminLoading = true;
  try {
    ui.admin = (await api('GET', '/api/admin/users')).users;
    if (ui.tab === 'admin') render();
  } catch (e) {
    toast(e.message, true);
  } finally {
    adminLoading = false;
  }
}

async function adminCall(method, id, body, okMsg) {
  try {
    const r = await api(method, `/api/admin/users/${id}`, body);
    if (okMsg) toast(okMsg);
    await loadAdmin();
    return r;
  } catch (e) {
    toast(e.message, true);
    return null;
  }
}

function viewAdmin() {
  if (!ui.admin) {
    loadAdmin();
    return `<section class="panel"><p class="muted">載入老師帳戶…</p></section>`;
  }
  const list = ui.admin;
  const fmt = (t) => new Date(t).toLocaleString('zh-HK', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `<div class="admin-grid">
    <section class="panel"><div class="panel-head"><div><h2>老師帳戶</h2><p class="muted">共 ${list.length} 個帳戶 · 管理員 ${list.filter((u) => u.isAdmin && !u.disabled).length} 位。每位老師的班別、學生及禮物各自獨立。</p></div></div>
      <div class="acct-list">${list.map((u) => `<div class="acct-row${u.disabled ? ' off' : ''}" data-user="${esc(u.username)}">${avatar(u)}
        <div class="acct-info"><b>${esc(u.name)}${u.isAdmin ? `<span class="role admin">${ic('crown')}管理員</span>` : '<span class="role">老師</span>'}${u.disabled ? '<span class="role off">已停用</span>' : ''}${u.mustChange ? '<span class="role warn">待改密碼</span>' : ''}</b>
          <small>${esc(u.username)} · ${u.classes} 班 · ${u.students} 位學生 · ${u.lastLogin ? `上次登入 ${fmt(u.lastLogin)}` : '未登入過'}</small></div>
        <div class="row wrap acct-actions">
          ${u.id !== me.id ? `<button class="btn sm secondary" data-act="adminToggleAdmin" data-id="${u.id}">${u.isAdmin ? '取消管理員' : '設為管理員'}</button>` : '<span class="chip">你自己</span>'}
          <button class="btn sm secondary" data-act="adminReset" data-id="${u.id}">${ic('key')}重設密碼</button>
          ${u.id !== me.id ? `<button class="btn sm secondary" data-act="adminToggleDisabled" data-id="${u.id}">${u.disabled ? '重新啟用' : '停用'}</button><button class="btn sm danger-ghost" data-act="adminDelete" data-id="${u.id}" aria-label="刪除 ${esc(u.name)}">${ic('trash')}刪除</button>` : ''}
        </div></div>`).join('')}</div></section>
    <section class="panel"><h3>新增老師</h3><form data-form="addTeacher" class="stack" autocomplete="off">
      <label class="field"><span>顯示名稱</span><input name="name" required maxlength="30" placeholder="例如：陳老師"></label>
      <label class="field"><span>登入名稱（英文小寫、數字、點）</span><input name="username" required pattern="[a-z0-9][a-z0-9._\-]{1,31}" placeholder="例如：miss.chan" autocapitalize="off" spellcheck="false"></label>
      <label class="field"><span>臨時密碼（最少 8 字）</span><span class="input-row"><input name="password" required minlength="8" value="${genPassword()}" spellcheck="false"><button type="button" class="btn secondary icon-btn" data-act="regenPw" aria-label="重新產生密碼" title="重新產生">${ic('refresh')}</button></span></label>
      <label class="switch"><input type="checkbox" name="isAdmin"><i></i><span>同時是管理員（可以加減老師）</span></label>
      <p class="muted small">新老師第一次登入時要自行改密碼。</p>
      <button class="btn primary">${ic('plus')}新增老師</button></form></section>
  </div>`;
}

function viewSettings() {
  const s = state.settings;
  const num = (name, val, label, extra = '') => `<label class="field"><span>${label}</span><input type="number" name="${name}" value="${val}" ${extra}></label>`;
  const sw = (name, on, label) => `<label class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i><span>${label}</span></label>`;
  const oddsTotal = L.giftOddsTotal(state) || 1;
  return `<form data-form="settings" class="settings">
    <section class="panel"><h3>計分</h3><div class="form-grid">
      ${num('score.volunteer', s.score.volunteer, '主動舉手答對')}${num('score.drawn', s.score.drawn, '被抽中答對')}
      ${num('score.designated', s.score.designated, '被指定代答答對')}${num('score.standing', s.score.standing, '站立者舉手答對')}</div></section>
    <section class="panel"><h3>道具機率（主動答對時抽）</h3><div class="form-grid">
      ${ITEM_KEYS.map((k) => num(`itemOdds.${k}`, s.itemOdds[k], `${ITEMS[k].name}（目前 ${Math.round((s.itemOdds[k] / oddsTotal) * 100)}%）`, 'min="0"')).join('')}</div>
      <p class="muted small">數字係相對比重，會同「禮物」頁每份禮物的比重一齊計。</p></section>
    <section class="panel"><h3>抽中權重</h3><div class="form-grid">
      ${num('baseWeight', s.baseWeight, '新學生預設權重', 'min="1"')}${num('weightStep', s.weightStep, '每張機率卡加/減', 'min="0"')}
      ${num('minWeight', s.minWeight, '最低權重', 'min="1"')}${num('maxWeight', s.maxWeight, '最高權重', 'min="1"')}</div></section>
    <section class="panel"><h3>其他</h3><div class="form-grid">
      ${num('bagCap', s.bagCap, '背包上限（張）', 'min="0"')}${num('antiRepeatCount', s.antiRepeatCount, '防連抽：答完後幾多題內機率減半', 'min="1"')}</div>
      <div class="switches">${sw('antiRepeat', s.antiRepeat, '開啟防連抽')}${sw('showOdds', s.showOdds, '課堂畫面顯示抽中機率')}${sw('animation', s.animation, '抽人及卡牌動畫')}</div></section>
    <div class="sticky-save"><button class="btn primary">${ic('check')}儲存設定</button></div></form>
    <section class="panel"><h3>資料備份與試玩</h3><p class="muted">資料儲存在你的老師帳戶，任何電腦登入都會見到；每位老師的資料互不相通。舊版（只存在瀏覽器）的備份可以用「還原備份」匯入。</p>
      <div class="row wrap"><button type="button" class="btn secondary" data-act="demo">${ic('plus')}新增 12 人測試班（保留現有班別）</button>
      <button class="btn secondary" data-act="backup">${ic('download')}下載備份</button>
      <label class="btn secondary file">${ic('upload')}還原備份<input type="file" accept="application/json,.json" data-act="restore" hidden></label>
      <button class="btn danger" data-act="wipe">${ic('trash')}清除全部資料</button></div></section>`;
}

function renderModal() {
  const wrap = $('#modal');
  const m = ui.modal;
  if (!m) {
    wrap.hidden = true;
    wrap.innerHTML = '';
    return;
  }
  wrap.hidden = false;
  wrap.innerHTML = `<div class="modal modal-${m.type}" role="dialog" aria-modal="true" tabindex="-1">${modalBody(m)}</div>`;
  const heading = wrap.querySelector('h2');
  if (heading) {
    heading.id = 'dialogTitle';
    wrap.firstElementChild.setAttribute('aria-labelledby', 'dialogTitle');
  }
}

function studentPicker(list, act, extra = () => '') {
  return `<div class="pick">${list.map((s) => `<button class="tile ${L.studentStatus(state, s.id)}" data-act="${act}" data-id="${s.id}">${avatar(s)}<span class="tile-body"><span class="nm">${esc(s.name)}</span><span class="no">#${esc(s.no)}</span></span>${extra(s)}</button>`).join('')}</div>`;
}

const answerBtns = (act, wrongLabel) => `<div class="answer"><button class="btn ok xl" data-act="${act}" data-v="1">${ic('check')}答對</button><button class="btn no xl" data-act="${act}" data-v="0">${ic('x')}${wrongLabel}</button></div>`;

function modalBody(m) {
  const close = '<button class="btn secondary" data-act="closeModal">關閉</button>';
  if (m.type === 'volunteer') {
    const c = cls();
    const present = c.students.filter((s) => !state.session.absent[s.id]);
    const standing = present.filter((s) => state.session.standing[s.id]);
    const seated = present.filter((s) => !state.session.standing[s.id]);
    return `<div class="m-head"><span class="m-ic hand">${ic('hand')}</span><div><h2>選擇舉手的同學</h2><p class="muted">主動答對可抽技能卡，答錯沒有懲罰。</p></div></div>
      ${standing.length ? `<h3 class="prio">站立同學優先</h3>${studentPicker(standing, 'pickVolunteer', () => '<span class="badge warn">優先</span>')}` : ''}
      <h3 class="sub">坐低的同學</h3>${studentPicker(seated, 'pickVolunteer', (s) => `<span class="chips">${itemDots(s)}</span>`)}
      <div class="m-foot">${close}</div>`;
  }
  if (m.type === 'volunteerAnswer') {
    const s = stu(m.id);
    const standing = state.session.standing[s.id];
    return `<div class="spot">${avatar(s, 'xl')}<h2>${esc(s.name)} 答得啱唔啱？</h2>
      <p class="muted">${standing ? '佢而家站緊：答對就可以坐返低。' : `答對 +${state.settings.score.volunteer} 分，再抽一張技能卡。答錯冇任何懲罰。`}</p></div>
      ${answerBtns('volunteerResult', '答錯')}
      <div class="m-foot"><button class="btn ghost" data-act="volunteer">${ic('arrowLeft')}返回</button></div>`;
  }
  if (m.type === 'reward') {
    const s = stu(m.id);
    const g = m.gift && L.getGift(state, m.gift.giftId);
    if (g) {
      const ready = L.canRedeem(s, g);
      return `<div class="reward"><h2>${esc(s.name)} 答對！+${m.points} 分</h2><p class="muted">${g.pieces > 1 ? '抽中老師禮物碎片' : '抽中老師禮物'}</p>
        <div class="card-flip gift-flip${reduceMotion() ? ' instant' : ''}"><div class="flip-inner"><div class="face back"><span class="back-logo"></span></div><div class="face front">${giftCard(g, { piece: g.pieces > 1 ? m.gift.piece : null, tilt: false })}</div></div><span class="burst"></span></div>
        ${g.pieces > 1 ? fragTrack(g, L.fragCounts(s, g)) : ''}
        <div class="m-foot center">${ready ? `<button class="btn gold xl" data-act="redeem" data-id="${s.id}" data-gift="${g.id}">${ic('gift')}${g.pieces > 1 ? '集齊！' : ''}即刻換領</button>` : ''}<button class="btn primary xl" data-act="closeModal">好</button></div></div>`;
    }
    if (m.item) {
      return `<div class="reward"><h2>${esc(s.name)} 答對！+${m.points} 分</h2><p class="muted">獲得一張技能卡</p>
        <div class="card-flip${reduceMotion() ? ' instant' : ''}"><div class="flip-inner"><div class="face back"><span class="back-logo"></span></div><div class="face front">${gameCard(m.item, { tilt: false })}</div></div><span class="burst"></span></div>
        <div class="m-foot center"><button class="btn primary xl" data-act="closeModal">好</button></div></div>`;
    }
    return `<div class="spot result ${m.correct ? 'ok' : 'no'}"><span class="result-ic">${ic(m.correct ? 'check' : 'x')}</span><h2>${esc(s.name)} ${m.correct ? `答對！+${m.points} 分` : '答錯'}</h2><p class="big-msg">${m.msg}</p></div><div class="m-foot center"><button class="btn primary xl" data-act="closeModal">好</button></div>`;
  }
  if (m.type === 'draw') {
    const q = state.session.question;
    if (ui.rolling || !q) return `<div class="spot"><p class="kicker center">正在邀請一位同學</p><div class="roll rolling" id="roll">${esc(m.rollText || '')}</div></div>`;
    const s = stu(q.answererId);
    const by = q.designatedBy ? stu(q.designatedBy) : null;
    const canEx = L.canUseExempt(state);
    const canDe = L.canUseDesignate(state);
    return `<div class="spot drawn">${avatar(s, 'xl')}<h2>${by ? `${esc(by.name)} 指定` : '這一題，交給你'}</h2><div class="roll done">${esc(s.name)}</div>
      ${by ? '<p class="muted center">被指定的同學答錯要站立，亦不可以再用指定卡。</p>' : ''}</div>
      ${answerBtns('drawResult', '答錯（罰站）')}
      ${canEx || canDe ? `<div class="use-cards"><p class="kicker center">${esc(s.name)} 可以出卡</p><div class="row center wrap">${canEx ? `<button class="btn card-btn tier-rare" data-act="useExempt">${ic('shield')}用免答卡<small>剩 ${s.items.exempt}</small></button>` : ''}${canDe ? `<button class="btn card-btn tier-epic" data-act="chooseDesignate">${ic('send')}用指定同學卡<small>剩 ${s.items.designate}</small></button>` : ''}</div></div>` : ''}
      <div class="m-foot"><button class="btn ghost" data-act="cancelQuestion">取消這條問題</button></div>`;
  }
  if (m.type === 'designate') {
    const s = stu(state.session.question.answererId);
    const list = L.designateTargets(state).map((x) => stu(x.id));
    return `<div class="m-head"><span class="m-ic epic">${ic('send')}</span><div><h2>${esc(s.name)} 想指定邊位同學代答？</h2><p class="muted">只可以揀出席、坐低而且今條問題未輪過的同學。</p></div></div>${studentPicker(list, 'pickDesignate')}<div class="m-foot"><button class="btn ghost" data-act="backToDraw">${ic('arrowLeft')}返回</button></div>`;
  }
  if (m.type === 'sheet') {
    const s = stu(m.id);
    const status = L.studentStatus(state, s.id);
    const busy = !!state.session?.question;
    return `<div class="sheet-head">${avatar(s, 'lg')}<div><h2>${esc(s.no)} ${esc(s.name)}</h2>
      <p class="sheet-stats"><span>狀態：<b>${{ seated: '坐低', standing: '站立', absent: '缺席' }[status]}</b></span><span>分數：<b>${s.score}</b></span><span>抽中權重：<b>${s.weight}</b></span></p></div></div>
      <h3 class="sub">背包（${L.bagTotal(s)}/${state.settings.bagCap}）</h3>
      <div class="bag">${ITEM_KEYS.map((k) => `<div class="bag-slot${s.items[k] ? '' : ' empty'}">${gameCard(k, { cls: 'mini', count: s.items[k], tilt: false })}<span class="bag-cap">${esc(ITEMS[k].name)} × ${s.items[k]}</span></div>`).join('')}</div>
      <div class="row wrap">
        <button class="btn card-btn tier-fine" data-act="useDown" ${s.items.down > 0 && !busy ? '' : 'disabled'}>${ic('down')}用調低卡</button>
        <button class="btn card-btn tier-legend" data-act="chooseUp" ${s.items.up > 0 && !busy ? '' : 'disabled'}>${ic('up')}用調高卡</button>
      </div>
      <p class="muted small">免答卡及指定同學卡會在被抽中時出現。</p>
      ${sheetGifts(s)}
      <h3 class="sub">老師操作</h3><div class="row wrap">
        ${status !== 'absent' ? `<button class="btn secondary" data-act="toggleStand">${status === 'standing' ? '設為坐低' : '設為站立'}</button>` : ''}
        <button class="btn secondary" data-act="toggleAbsent">${status === 'absent' ? '標示出席' : '標示缺席'}</button></div>
      <div class="m-foot">${close}</div>`;
  }
  if (m.type === 'chooseUp') {
    const s = stu(m.id);
    const list = cls().students.filter((x) => x.id !== s.id);
    return `<div class="m-head"><span class="m-ic legend">${ic('up')}</span><div><h2>${esc(s.name)} 想調高邊位同學被抽中的機率？</h2></div></div>${studentPicker(list, 'pickUp', (x) => `<span class="badge">權重 ${x.weight}</span>`)}<div class="m-foot"><button class="btn ghost" data-act="studentSheet" data-id="${s.id}">${ic('arrowLeft')}返回</button></div>`;
  }
  if (m.type === 'confirmUp') {
    const s = stu(m.id);
    const t = stu(m.target);
    const after = Math.min(state.settings.maxWeight, t.weight + state.settings.weightStep);
    return `<div class="confirm-up">${gameCard('up', { cls: 'mini', tilt: false })}<div><h2>老師確認</h2><p class="big-msg">${esc(s.name)} 想用調高卡，將 <b>${esc(t.name)}</b> 的抽中權重由 ${t.weight} 調高到 ${after}。</p>
      <p class="muted">如果覺得係針對同學，可以否決（卡會保留）。</p></div></div>
      <div class="answer"><button class="btn ok xl" data-act="confirmUp">${ic('check')}批准</button><button class="btn no xl" data-act="vetoUp">${ic('x')}否決</button></div>`;
  }
  if (m.type === 'giftEdit') {
    const g = m.id ? L.getGift(state, m.id) : { name: '', pieces: 2, odds: 10, stock: null, note: '' };
    const pieces = m.pieces ?? g.pieces;
    return `<form data-form="giftForm" class="stack"><div class="m-head"><span class="m-ic gift">${ic('gift')}</span><div><h2>${m.id ? '編輯禮物' : '新增禮物'}</h2><p class="muted">同學主動舉手答對時有機會抽中。</p></div></div>
      <div class="gift-form">
        <div class="stack">
          <label class="field"><span>禮物名稱</span><input name="name" required maxlength="24" value="${esc(g.name)}" placeholder="例如：珍珠奶茶"></label>
          <fieldset class="field"><legend>分成幾張碎片</legend><div class="seg pieces-seg">${[1, 2, 3, 4].map((n) => `<label><input type="radio" name="pieces" value="${n}" ${n === pieces ? 'checked' : ''}><span>${n === 1 ? '1 張（完整）' : `${n} 張`}</span></label>`).join('')}</div></fieldset>
          <div class="form-grid"><label class="field"><span>抽中比重</span><input type="number" name="odds" min="0" value="${g.odds}"></label>
          <label class="field"><span>可換份數（留空＝不限）</span><input type="number" name="stock" min="0" value="${g.stock ?? ''}" placeholder="不限"></label></div>
          <label class="field"><span>卡面說明（可選）</span><input name="note" maxlength="60" value="${esc(g.note || '')}" placeholder="例如：小息到教員室找陳老師換領"></label>
          <p class="muted small">比重會同四款技能卡一齊計：技能卡現時合共 ${ITEM_KEYS.reduce((n, k) => n + state.settings.itemOdds[k], 0)}。碎片隨機派發，唔佔背包位置。</p>
        </div>
        <div class="gift-preview" id="giftPreview">${giftPreview({ ...g, id: 'preview', name: g.name || '禮物名稱', pieces })}</div>
      </div>
      <div class="m-foot"><button type="button" class="btn secondary" data-act="closeModal">取消</button><button class="btn primary">${ic('check')}${m.id ? '儲存' : '新增禮物'}</button></div></form>`;
  }
  if (m.type === 'account') {
    return `<div class="sheet-head">${avatar(me, 'lg')}<div><h2>${esc(me.name)}</h2><p class="sheet-stats"><span>登入名稱：<b>${esc(me.username)}</b></span><span>身份：<b>${me.isAdmin ? '老師 · 管理員' : '老師'}</b></span></p></div></div>
      <form data-form="accountName" class="inline-form"><label class="field"><span>顯示名稱</span><input name="name" required maxlength="30" value="${esc(me.name)}"></label><button class="btn secondary">${ic('check')}儲存</button></form>
      <form data-form="accountPassword" class="stack"><h3 class="sub">更改密碼</h3>
        <div class="form-grid three"><label class="field"><span>現有密碼</span><input name="current" type="password" required autocomplete="current-password"></label>
        <label class="field"><span>新密碼（最少 8 字）</span><input name="next" type="password" required minlength="8" autocomplete="new-password"></label>
        <label class="field"><span>再輸入新密碼</span><input name="confirm" type="password" required minlength="8" autocomplete="new-password"></label></div>
        <div><button class="btn secondary">${ic('key')}更改密碼</button></div></form>
      <div class="m-foot"><a class="btn ghost" href="/guide/" target="_blank" rel="noopener" style="text-decoration:none">使用說明書</a>${me.isAdmin ? `<button class="btn ghost" data-act="tab" data-v="admin">${ic('key')}管理老師帳戶</button>` : ''}<button class="btn danger-ghost" data-act="logout">${ic('logout')}登出</button><button class="btn secondary" data-act="closeModal">關閉</button></div>`;
  }
  if (m.type === 'cred') {
    return `<div class="m-head"><span class="m-ic ok">${ic('check')}</span><div><h2>${esc(m.title)}</h2><p class="muted">請將以下資料交給${esc(m.name)}。第一次登入時要自行更改密碼。</p></div></div>
      <dl class="cred"><div><dt>網址</dt><dd>${esc(location.origin)}/</dd></div><div><dt>登入名稱</dt><dd>${esc(m.username)}</dd></div><div><dt>臨時密碼</dt><dd>${esc(m.password)}</dd></div></dl>
      <div class="m-foot"><button class="btn secondary" data-act="copyCred">${ic('copy')}複製</button><button class="btn primary" data-act="closeModal">完成</button></div>`;
  }
  if (m.type === 'confirm') {
    return `<h2>${esc(m.title)}</h2><p class="confirm-body">${m.html}</p><div class="m-foot">${m.single ? '' : '<button class="btn secondary" data-act="closeModal">取消</button>'}<button class="btn ${m.danger ? 'danger' : 'primary'}" data-act="confirmYes">${esc(m.yes || '確定')}</button></div>`;
  }
  if (m.type === 'prompt') {
    return `<form data-form="prompt" class="stack"><h2>${esc(m.title)}</h2><input name="v" value="${esc(m.value)}" required autofocus><div class="m-foot"><button type="button" class="btn secondary" data-act="closeModal">取消</button><button class="btn primary">確定</button></div></form>`;
  }
  return close;
}

function openModal(m) {
  ui.modal = m;
  renderModal();
  if (m) $('.modal').focus({ preventScroll: true });
}

function confirmBox(title, html, onYes, opts = {}) {
  openModal({ type: 'confirm', title, html, onYes, ...opts });
}

async function rollAnimation(finalId, pool) {
  ui.rolling = true;
  openModal({ type: 'draw', rollText: '' });
  const names = pool.length ? pool.map((x) => x.name) : [stu(finalId).name];
  if (!reduceMotion()) {
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const el = $('#roll');
      if (el) {
        el.textContent = names[Math.floor(Math.random() * names.length)];
        el.classList.remove('tick');
        void el.offsetWidth;
        el.classList.add('tick');
      }
      await sleep(36 + i * i * 1.05);
    }
  }
  ui.rolling = false;
  openModal({ type: 'draw' });
  if (!reduceMotion()) burst($('.modal .avatar'), 18);
}

function cardFx(k, caption) {
  if (reduceMotion()) return;
  const fx = $('#fx');
  const node = document.createElement('div');
  node.className = 'fx-stage';
  node.innerHTML = `<div class="fx-ring tier-${ITEMS[k].tier}"></div><div class="fx-card">${gameCard(k, { tilt: false })}</div><div class="fx-caption">${esc(caption)}</div>`;
  fx.appendChild(node);
  setTimeout(() => burst(node.querySelector('.fx-card'), 28, ITEMS[k].tier), 520);
  setTimeout(() => node.remove(), 2100);
}

const TIER_COLORS = { gift: ['#fde68a', '#f59e0b', '#2dd4bf'], rare: ['#22d3ee', '#a5f3fc'], epic: ['#f59e0b', '#fde68a'], fine: ['#10b981', '#a7f3d0'], legend: ['#ec4899', '#f0abfc'], base: ['#6366f1', '#f59e0b', '#10b981', '#ec4899'] };
function burst(el, n = 20, tier = 'base') {
  if (!el || reduceMotion()) return;
  const r = el.getBoundingClientRect();
  const fx = $('#fx');
  const colors = TIER_COLORS[tier] || TIER_COLORS.base;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'spark';
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const d = 80 + Math.random() * 120;
    p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;background:${colors[i % colors.length]};--s:${0.6 + Math.random()}`;
    fx.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

async function startDraw() {
  if (state.session.question) return openModal({ type: 'draw' });
  const pool = L.drawCandidates(state);
  if (!attempt((s) => L.startDraw(s, rng), '抽人')) return;
  await rollAnimation(state.session.question.answererId, pool);
}

async function useExempt() {
  const q = state.session.question;
  const pool = L.drawCandidates(state, q.excluded);
  const name = stu(q.answererId).name;
  if (!attempt((s) => L.useExempt(s, rng), `${name} 用免答卡`)) return;
  toast(`${name} 用咗免答卡，重抽！`);
  cardFx('exempt', `${name} 發動免答卡`);
  if (!reduceMotion()) await sleep(900);
  await rollAnimation(state.session.question.answererId, pool);
}

function downloadFile(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

const today = () => new Date().toLocaleDateString('sv-SE');

let clockLeft = 30;
let clockRunning = false;
function updateClock() {
  const el = $('#questClock');
  if (el) el.textContent = clockLeft || '時間到';
  const ring = $('#clockRing');
  if (ring) {
    ring.style.strokeDashoffset = String(RING * (1 - clockLeft / 30));
    ring.closest('.timer').classList.toggle('urgent', clockLeft <= 5);
  }
}
setInterval(() => {
  if (!clockRunning) return;
  clockLeft = Math.max(0, clockLeft - 1);
  updateClock();
  if (!clockLeft) {
    clockRunning = false;
    const btn = $('[data-act=timer]');
    if (btn) btn.innerHTML = `${ic('play')}開始倒數`;
    toast('思考時間到，老師可以邀請同學作答');
  }
}, 1000);

function filterRoster() {
  const grid = $('#liveRoster');
  if (!grid) return;
  let visible = 0;
  grid.querySelectorAll('.tile').forEach((tile) => {
    const show = (ui.filter === 'all' || tile.dataset.status === ui.filter) && tile.dataset.search.toLowerCase().includes(ui.search.trim().toLowerCase());
    tile.hidden = !show;
    if (show) visible++;
  });
  grid.querySelector('.empty-roster')?.remove();
  if (!visible) grid.insertAdjacentHTML('beforeend', '<p class="empty-roster">沒有符合的同學。試試其他姓名或狀態。</p>');
}

function updateGiftPreview(f) {
  const pieces = +(f.querySelector('input[name=pieces]:checked')?.value || 1);
  $('#giftPreview').innerHTML = giftPreview({ id: 'preview', name: f.elements.name.value.trim() || '禮物名稱', pieces, note: f.elements.note.value.trim() });
}

document.addEventListener('input', (ev) => {
  if (ev.target.closest?.('form[data-form=giftForm]') && ev.target.type !== 'radio') return updateGiftPreview(ev.target.closest('form'));
  if (ev.target.id === 'rosterSearch') {
    ui.search = ev.target.value;
    filterRoster();
  }
});

const actions = {
  filterRoster: (el) => { ui.filter = el.dataset.v; render(); },
  focusMode: () => document.body.classList.toggle('focus-mode'),
  timer: () => { if (!clockLeft) clockLeft = 30; clockRunning = !clockRunning; render(); },
  resetTimer: () => { clockLeft = 30; clockRunning = false; render(); },
  demo: () => {
    if (attempt(addDemo, '建立測試班')) {
      ui.tab = 'class';
      render();
      toast('已加入 12 位虛構學生（每人四種道具）及 3 份測試禮物');
    }
  },
  fullscreen: async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast('此瀏覽器未能開啟全螢幕');
    }
  },
  tab: (el) => { ui.tab = el.dataset.v; ui.modal = null; render(); window.scrollTo({ top: 0 }); },
  closeModal: () => openModal(null),
  draftAbsent: (el) => { const id = el.dataset.id; ui.absentDraft[id] = !ui.absentDraft[id]; render(); },
  startSession: () => {
    const c = cls();
    const absent = c.students.filter((s) => ui.absentDraft[s.id]).map((s) => s.id);
    if (attempt((s) => L.startSession(s, c.id, absent), '開始上堂')) { ui.absentDraft = {}; ui.filter = 'all'; ui.search = ''; }
  },
  endSession: () => {
    clockRunning = false;
    const n = Object.keys(state.session.standing).length;
    confirmBox('落堂？', `${n ? `站緊的 ${n} 位同學會自動坐返低。` : ''}今堂共問咗 ${state.session.qCount} 題。`, () => {
      const ses = state.session;
      if (attempt(L.endSession, '落堂')) showSummary(ses);
    }, { yes: '落堂' });
  },
  volunteer: () => openModal({ type: 'volunteer' }),
  pickVolunteer: (el) => openModal({ type: 'volunteerAnswer', id: el.dataset.id }),
  volunteerResult: (el) => {
    const id = ui.modal.id;
    const correct = el.dataset.v === '1';
    const wasStanding = !!state.session.standing[id];
    const name = stu(id).name;
    if (!attempt((s) => L.volunteer(s, id, correct, rng), `${name} 舉手${correct ? '答對' : '答錯'}`)) return;
    const e = state.logs[state.logs.length - 1];
    let msg = '';
    if (!correct) msg = wasStanding ? '繼續站住，下次再試！' : '冇關係，主動舉手答錯冇懲罰。';
    else if (wasStanding) msg = '可以坐返低。';
    else if (e.bagFull) msg = `背包已滿（${state.settings.bagCap} 張），今次冇抽卡。`;
    const gift = e.giftId ? { giftId: e.giftId, piece: e.piece, pieces: e.pieces } : null;
    openModal({ type: 'reward', id, item: e.item, gift, points: e.points, correct, msg });
    const card = e.item || gift;
    if (correct && !reduceMotion()) setTimeout(() => burst($(card ? '.modal .card-flip' : '.modal .result-ic'), card ? 34 : 18, e.item ? ITEMS[e.item].tier : gift ? 'gift' : 'base'), card ? 650 : 120);
  },
  draw: () => startDraw(),
  drawResult: (el) => {
    const correct = el.dataset.v === '1';
    const s = stu(state.session.question.answererId);
    if (!attempt((st) => L.resolveDraw(st, correct), `${s.name} ${correct ? '答對' : '答錯'}`)) return;
    const e = state.logs[state.logs.length - 1];
    openModal({ type: 'reward', id: s.id, correct, points: e.points, msg: correct ? '做得好，繼續坐低。' : '請到課室後面站立，舉手答對就可以坐返低。' });
    if (correct) burst($('.modal .result-ic'), 18);
  },
  useExempt: () => useExempt(),
  chooseDesignate: () => openModal({ type: 'designate' }),
  backToDraw: () => openModal({ type: 'draw' }),
  pickDesignate: (el) => {
    const by = stu(state.session.question.answererId).name;
    const t = stu(el.dataset.id).name;
    if (attempt((s) => L.useDesignate(s, el.dataset.id), `${by} 指定 ${t}`)) {
      openModal({ type: 'draw' });
      cardFx('designate', `${by} 指定 ${t} 代答`);
    }
  },
  cancelQuestion: () => { if (attempt(L.cancelQuestion, '取消問題')) openModal(null); },
  studentSheet: (el) => {
    if (state.session?.question) return openModal({ type: 'draw' });
    openModal({ type: 'sheet', id: el.dataset.id });
  },
  toggleStand: () => {
    const id = ui.modal.id;
    const standing = !state.session.standing[id];
    attempt((s) => L.setStanding(s, id, standing), `${stu(id).name} 設為${standing ? '站立' : '坐低'}`);
  },
  toggleAbsent: () => {
    const id = ui.modal.id;
    attempt((s) => L.toggleAbsent(s, id), `${stu(id).name} 出席狀態`);
  },
  useDown: () => {
    const id = ui.modal.id;
    const s = stu(id);
    const after = Math.max(state.settings.minWeight, s.weight - state.settings.weightStep);
    confirmBox('用調低卡？', `${esc(s.name)} 的抽中權重會由 ${s.weight} 永久降到 ${after}。`, () => {
      const ok = attempt((st) => L.useWeightCard(st, id, 'down'), `${s.name} 用調低卡`);
      openModal({ type: 'sheet', id });
      if (ok) cardFx('down', `${s.name} 隱入月影`);
    }, { yes: '使用' });
  },
  chooseUp: () => openModal({ type: 'chooseUp', id: ui.modal.id }),
  pickUp: (el) => {
    const t = stu(el.dataset.id);
    if (t.weight >= state.settings.maxWeight) return toast(`${t.name} 已經係最高權重`, true);
    openModal({ type: 'confirmUp', id: ui.modal.id, target: t.id });
  },
  confirmUp: () => {
    const { id, target } = ui.modal;
    if (attempt((s) => L.useWeightCard(s, id, 'up', target), `${stu(id).name} 對 ${stu(target).name} 用調高卡`)) {
      toast('已調高');
      openModal({ type: 'sheet', id });
      cardFx('up', `聚光落在 ${stu(target).name} 身上`);
    }
  },
  vetoUp: () => { toast('老師否決咗，卡保留'); openModal({ type: 'sheet', id: ui.modal.id }); },
  confirmYes: () => { const fn = ui.modal.onYes; ui.modal = null; fn(); renderModal(); },
  pickClass: (el) => {
    if (state.session) return toast('上緊堂，落堂先可以轉班', true);
    state.activeClassId = el.dataset.id;
    persist();
    render();
  },
  renameClass: (el) => {
    const c = L.getClass(state, el.dataset.id);
    openModal({ type: 'prompt', title: '班別改名', value: c.name, onSubmit: (v) => attempt((s) => L.renameClass(s, c.id, v), '班別改名') && openModal(null) });
  },
  deleteClass: (el) => {
    const c = L.getClass(state, el.dataset.id);
    confirmBox(`刪除 ${c.name}？`, `會刪除這班 ${c.students.length} 位學生及分數（紀錄保留）。可以按「復原」救返。`, () => attempt((s) => L.deleteClass(s, c.id), `刪除班別 ${c.name}`), { yes: '刪除', danger: true });
  },
  removeStudent: (el) => {
    const s = stu(el.dataset.id);
    confirmBox(`刪除 ${s.name}？`, '分數、權重同道具會一併刪除。可以按「復原」救返。', () => attempt((st) => L.removeStudent(st, s.id), `刪除 ${s.name}`), { yes: '刪除', danger: true });
  },
  exportStats: () => { const c = cls(); downloadFile(`${c.name}-成績-${today()}.csv`, L.statsCSV(state, c.id), 'text/csv;charset=utf-8'); },
  exportLogs: () => {
    const c = cls();
    const rows = [['時間', '類型', '學生', '內容']];
    for (const e of state.logs.filter((x) => x.classId === c.id)) rows.push([new Date(e.at).toLocaleString('zh-HK'), e.type, e.name || '', L.describeLog(e)]);
    downloadFile(`${c.name}-紀錄-${today()}.csv`, L.toCSV(rows), 'text/csv;charset=utf-8');
  },
  backup: () => downloadFile(`課堂冒險局-備份-${today()}.json`, JSON.stringify(state, null, 1), 'application/json'),
  account: () => openModal({ type: 'account' }),
  logout: async () => {
    if (sync?.dirty) await sync.flushNow();
    try {
      await api('POST', '/api/logout');
    } catch {}
    location.reload();
  },
  retryBoot: () => boot(),
  gateLogout: async () => {
    try {
      await api('POST', '/api/logout');
    } catch {}
    location.reload();
  },
  legacyDownload: () => downloadFile(`課堂冒險局-舊版資料-${today()}.json`, legacyBackup() || '{}', 'application/json'),
  newGift: () => openModal({ type: 'giftEdit', id: null }),
  editGift: (el) => openModal({ type: 'giftEdit', id: el.dataset.gift }),
  deleteGift: (el) => {
    const g = L.getGift(state, el.dataset.gift);
    confirmBox(`刪除「${g.name}」？`, '所有同學手上這份禮物的碎片都會一併刪除。可以按「復原」救返。', () => attempt((s) => L.removeGift(s, g.id), `刪除禮物 ${g.name}`), { yes: '刪除', danger: true });
  },
  redeem: (el) => {
    const st = stu(el.dataset.id);
    const g = L.getGift(state, el.dataset.gift);
    const back = ui.modal?.type === 'sheet' ? ui.modal.id : null;
    confirmBox(`換領「${g.name}」？`, `${esc(st.name)} 已${g.pieces > 1 ? `集齊 ${g.pieces} 張碎片` : '抽中這份禮物'}。換領後會扣除${g.pieces > 1 ? '一套碎片' : '這張卡'}${g.stock != null ? `，禮物尚餘 ${g.stock - 1} 份` : ''}。記得實際交禮物給同學。`, () => {
      if (attempt((s) => L.redeemGift(s, st.id, g.id), `${st.name} 換領 ${g.name}`)) {
        if (back) openModal({ type: 'sheet', id: back });
        redeemFx(L.getGift(state, g.id) || g, `${st.name} 換領「${g.name}」`);
        toast(`${st.name} 換領咗「${g.name}」`);
      }
    }, { yes: '換領' });
  },
  toggleFragEdit: () => { ui.fragEdit = !ui.fragEdit; renderModal(); },
  fragAdj: (el) => {
    const id = ui.modal.id;
    const g = L.getGift(state, el.dataset.gift);
    const d = +el.dataset.d;
    attempt((s) => L.adjustFrag(s, id, g.id, +el.dataset.piece, d), `${d > 0 ? '加' : '減'} ${stu(id).name} 的禮物碎片`);
  },
  regenPw: (el) => { el.closest('form').password.value = genPassword(); },
  adminToggleAdmin: (el) => {
    const u = ui.admin.find((x) => x.id === el.dataset.id);
    adminCall('PATCH', u.id, { isAdmin: !u.isAdmin }, u.isAdmin ? `${u.name} 已取消管理員` : `${u.name} 已設為管理員`);
  },
  adminToggleDisabled: (el) => {
    const u = ui.admin.find((x) => x.id === el.dataset.id);
    if (u.disabled) return adminCall('PATCH', u.id, { disabled: false }, `${u.name} 已重新啟用`);
    confirmBox(`停用 ${u.name}？`, '停用後佢會即時被登出，不能再登入；資料會保留，可以隨時重新啟用。', () => adminCall('PATCH', u.id, { disabled: true }, `${u.name} 已停用`), { yes: '停用', danger: true });
  },
  adminReset: (el) => {
    const u = ui.admin.find((x) => x.id === el.dataset.id);
    const pw = genPassword();
    confirmBox(`重設 ${u.name} 的密碼？`, '會產生一個新的臨時密碼，佢現有的登入會失效，下次登入要再改密碼。', async () => {
      if (await adminCall('PATCH', u.id, { password: pw }, '已重設密碼')) openModal({ type: 'cred', title: '已重設密碼', name: u.name, username: u.username, password: pw });
    }, { yes: '重設' });
  },
  adminDelete: (el) => {
    const u = ui.admin.find((x) => x.id === el.dataset.id);
    confirmBox(`刪除 ${u.name}？`, `帳戶會被刪除，佢的 ${u.classes} 班資料會移到伺服器封存（不會即時永久刪除）。如果只是暫時唔用，建議改用「停用」。`, () => adminCall('DELETE', u.id, undefined, `已刪除 ${u.name}`), { yes: '刪除帳戶', danger: true });
  },
  copyCred: async () => {
    const m = ui.modal;
    const text = `課堂冒險局\n網址：${location.origin}/\n登入名稱：${m.username}\n臨時密碼：${m.password}`;
    try {
      await navigator.clipboard.writeText(text);
      toast('已複製');
    } catch {
      toast('未能自動複製，請手動抄低', true);
    }
  },
  wipe: () => confirmBox('清除全部資料？', '所有班別、學生、分數同紀錄都會刪除。建議先下載備份。（仍可以按「復原」一次救返）', () => commit(L.createState(), '清除全部資料'), { yes: '全部清除', danger: true }),
};

function showSummary(ses) {
  const logs = state.logs.filter((e) => e.sessionId === ses.id);
  const answers = logs.filter((e) => e.type === 'answer');
  const correct = answers.filter((e) => e.correct).length;
  const got = answers.filter((e) => e.item).length;
  const used = logs.filter((e) => e.type === 'use-item').length;
  const vol = answers.filter((e) => e.mode === 'volunteer' || e.mode === 'standing').length;
  const rate = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  confirmBox('今堂小結', `<span class="summary"><span><b>${answers.length}</b>答問</span><span><b>${rate}%</b>答對率</span><span><b>${vol}</b>主動舉手</span><span><b>${got}/${used}</b>道具 得/用</span></span>`, () => {}, { yes: '好', single: true });
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled || el.tagName === 'INPUT') return;
  if (el.closest('#modal') && ui.rolling) return;
  const fn = actions[el.dataset.act];
  if (fn) {
    ev.preventDefault();
    fn(el);
  }
});

document.addEventListener('pointerdown', (ev) => {
  const el = ev.target.closest('.btn,.tile,.tab,.action,.seg button');
  if (!el || el.disabled || reduceMotion()) return;
  const r = el.getBoundingClientRect();
  const d = Math.max(r.width, r.height) * 2;
  const rip = document.createElement('span');
  rip.className = 'ripple';
  rip.style.cssText = `width:${d}px;height:${d}px;left:${ev.clientX - r.left - d / 2}px;top:${ev.clientY - r.top - d / 2}px`;
  el.appendChild(rip);
  setTimeout(() => rip.remove(), 650);
});

document.addEventListener('pointermove', (ev) => {
  const card = ev.target.closest?.('.gcard[data-tilt]');
  document.querySelectorAll('.gcard.tilting').forEach((c) => { if (c !== card) { c.classList.remove('tilting'); c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); } });
  if (!card || ev.pointerType !== 'mouse' || reduceMotion()) return;
  const r = card.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width;
  const y = (ev.clientY - r.top) / r.height;
  card.classList.add('tilting');
  card.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
  card.style.setProperty('--ry', `${(x - 0.5) * 18}deg`);
  card.style.setProperty('--mx', `${x * 100}%`);
  card.style.setProperty('--my', `${y * 100}%`);
});

$('#modal').addEventListener('click', (ev) => {
  if (ev.target.id === 'modal' && !ui.rolling && !state.session?.question && !['confirmUp', 'reward'].includes(ui.modal?.type)) openModal(null);
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Tab' && ui.modal) {
    const nodes = [...$('#modal').querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]')];
    const first = nodes[0], last = nodes.at(-1);
    if (!first) { ev.preventDefault(); return; }
    if (ev.shiftKey && (document.activeElement === first || document.activeElement.classList.contains('modal'))) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && (document.activeElement === last || document.activeElement.classList.contains('modal'))) { ev.preventDefault(); first.focus(); }
  }
  if (ev.key === 'Escape' && ui.modal && !ui.rolling && !state.session?.question) openModal(null);
});

document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('form[data-form]');
  if (!form) return;
  ev.preventDefault();
  const fd = new FormData(form);
  const kind = form.dataset.form;
  if (kind === 'newClass') {
    if (attempt((s) => L.addClass(s, fd.get('name'), fd.get('roster')), `建立班別 ${fd.get('name')}`)) {
      ui.tab = 'class';
      render();
      toast('已建立班別');
    }
  } else if (kind === 'addStudents') {
    const n = L.parseRoster(fd.get('roster')).length;
    if (!n) return toast('請輸入學生名', true);
    if (attempt((s) => L.addStudents(s, state.activeClassId, fd.get('roster')), `加入 ${n} 位學生`)) toast(`已加入 ${n} 位學生`);
  } else if (kind === 'settings') {
    const patch = { score: {}, itemOdds: {} };
    for (const [k, v] of fd.entries()) {
      if (k.includes('.')) {
        const [a, b] = k.split('.');
        patch[a][b] = +v;
      } else if (!['antiRepeat', 'showOdds', 'animation'].includes(k)) patch[k] = +v;
    }
    for (const k of ['antiRepeat', 'showOdds', 'animation']) patch[k] = fd.has(k);
    if (attempt((s) => L.updateSettings(s, patch), '更改設定')) toast('設定已儲存');
  } else if (kind === 'login') {
    doLogin(form, fd);
  } else if (kind === 'firstPassword') {
    doFirstPassword(form, fd);
  } else if (kind === 'giftForm') {
    const input = { name: fd.get('name'), pieces: +fd.get('pieces'), odds: fd.get('odds'), stock: fd.get('stock'), note: fd.get('note') };
    const id = ui.modal.id;
    if (attempt((s) => (id ? L.updateGift(s, id, input) : L.addGift(s, input)), `${id ? '編輯' : '新增'}禮物 ${input.name}`)) {
      openModal(null);
      toast(id ? '禮物已更新' : `已新增「${String(input.name).trim()}」`);
    }
  } else if (kind === 'accountName') {
    api('POST', '/api/profile', { name: fd.get('name') })
      .then((r) => { me = r.user; ui.admin = null; render(); toast('顯示名稱已更新'); })
      .catch((e) => toast(e.message, true));
  } else if (kind === 'accountPassword') {
    if (fd.get('next') !== fd.get('confirm')) return toast('兩次輸入的新密碼不一樣', true);
    api('POST', '/api/password', { current: fd.get('current'), next: fd.get('next') })
      .then(() => { form.reset(); toast('密碼已更改，其他裝置會被登出'); })
      .catch((e) => toast(e.message, true));
  } else if (kind === 'addTeacher') {
    const body = { name: fd.get('name'), username: String(fd.get('username')).trim().toLowerCase(), password: fd.get('password'), isAdmin: fd.has('isAdmin') };
    api('POST', '/api/admin/users', body)
      .then(async (r) => {
        await loadAdmin();
        openModal({ type: 'cred', title: `已新增 ${r.user.name}`, name: r.user.name, username: r.user.username, password: body.password });
      })
      .catch((e) => toast(e.message, true));
  } else if (kind === 'prompt') {
    ui.modal.onSubmit(fd.get('v'));
  }
});

document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.closest?.('form[data-form=giftForm]')) return updateGiftPreview(t.closest('form'));
  if (t.id === 'classSelect') {
    state.activeClassId = t.value;
    persist();
    return render();
  }
  if (t.dataset.act === 'restore') {
    const file = t.files[0];
    if (!file) return;
    file.text().then((txt) => {
      try {
        const data = JSON.parse(txt);
        if (!Array.isArray(data.classes)) throw new Error();
        const next = L.normalizeState(data);
        confirmBox('還原備份？', `備份有 ${next.classes.length} 班。目前資料會被取代（可以按「復原」救返）。`, () => commit(next, '還原備份'), { yes: '還原' });
      } catch {
        toast('這個不是有效的備份檔', true);
      }
    });
    return;
  }
  const field = t.dataset.field;
  if (!field) return;
  const id = t.closest('tr').dataset.id;
  const patch = field.startsWith('item:') ? { items: { [field.slice(5)]: t.value } } : { [field]: t.value };
  attempt((s) => L.adjustStudent(s, id, patch), `修改 ${stu(id).name}`);
});

$('#undoBtn').addEventListener('click', () => {
  if (ui.rolling) return;
  doUndo();
});

function redeemFx(g, caption) {
  if (reduceMotion()) return;
  const node = document.createElement('div');
  node.className = 'fx-stage redeem';
  const n = Math.max(2, g.pieces);
  node.innerHTML = `<div class="fx-ring tier-gift"></div><div class="fx-card assemble" style="--n:${n}">${Array.from({ length: n }, (_, i) => `<div class="fx-slice" style="--i:${i}">${giftCard(g, { tilt: false })}</div>`).join('')}</div><div class="fx-caption">${esc(caption)}</div>`;
  $('#fx').appendChild(node);
  setTimeout(() => burst(node.querySelector('.fx-card'), 40, 'gift'), 760);
  setTimeout(() => node.remove(), 2500);
}

// ---------- 登入及啟動 ----------
function showGate(inner) {
  document.body.classList.add('gated');
  const g = $('#gate');
  g.hidden = false;
  g.innerHTML = `<div class="gate-wrap">
    <section class="gate-art" aria-hidden="true">
      <div class="brand light"><span class="logo"></span><span class="brand-name">課堂冒險局<small>Classroom Quest</small></span></div>
      <div class="gate-fan">${['exempt', 'designate', 'up'].map((k, i) => `<div class="fan" style="--i:${i}">${gameCard(k, { tilt: false })}</div>`).join('')}<div class="fan" style="--i:3">${giftCard(SAMPLE_GIFT, { piece: 0, tilt: false })}</div></div>
      <p class="gate-tag">抽人作答、站立挑戰、<br>收集技能卡及老師禮物。</p>
    </section>
    <section class="gate-form">${inner}</section></div>`;
  g.querySelector('[autofocus]')?.focus();
}
function hideGate() {
  document.body.classList.remove('gated');
  const g = $('#gate');
  g.hidden = true;
  g.innerHTML = '';
}

function gateLogin(msg = '') {
  showGate(`<form data-form="login" class="gate-card stack" novalidate>
    <span class="kicker">${ic('lock')}老師登入</span><h1>歡迎回來</h1><p class="muted">用管理員發給你的帳戶登入。每位老師的班別及禮物各自獨立。</p>
    <label class="field"><span>登入名稱</span><input name="username" autocomplete="username" autocapitalize="off" spellcheck="false" required autofocus></label>
    <label class="field"><span>密碼</span><input name="password" type="password" autocomplete="current-password" required></label>
    <p class="form-err" role="alert"${msg ? '' : ' hidden'}>${esc(msg)}</p>
    <button class="btn primary xl">${ic('send')}登入</button>
    <p class="muted small">忘記密碼？請學校的管理員幫你重設。<a href="/guide/" target="_blank" rel="noopener">使用說明書</a></p></form>`);
}

function gateFirstPassword(msg = '') {
  showGate(`<form data-form="firstPassword" class="gate-card stack">
    <span class="kicker">${ic('key')}第一次登入</span><h1>設定你的密碼</h1><p class="muted">你好，${esc(me.name)}。為咗安全，請先將臨時密碼改成只有你知道的密碼。</p>
    <label class="field"><span>臨時密碼</span><input name="current" type="password" autocomplete="current-password" required autofocus></label>
    <label class="field"><span>新密碼（最少 8 字）</span><input name="next" type="password" autocomplete="new-password" minlength="8" required></label>
    <label class="field"><span>再輸入新密碼</span><input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label>
    <p class="form-err" role="alert"${msg ? '' : ' hidden'}>${esc(msg)}</p>
    <button class="btn primary xl">${ic('check')}儲存並進入</button>
    <button type="button" class="btn ghost" data-act="gateLogout">${ic('logout')}用其他帳戶登入</button></form>`);
}

function gateMoved() {
  const legacy = legacyBackup();
  let n = 0;
  try {
    n = JSON.parse(legacy)?.classes?.length || 0;
  } catch {}
  showGate(`<div class="gate-card stack">
    <span class="kicker">${ic('sparkle')}新版已推出</span><h1>課堂冒險局<br>已升級為老師登入版</h1>
    <p class="muted">新版每位老師有自己的帳戶，資料儲存在伺服器，用任何電腦登入都見到；亦新增老師自訂禮物及碎片收集。</p>
    <a class="btn primary xl" href="${NEW_HOME}">${ic('send')}前往新版</a>
    ${n ? `<div class="legacy"><p><b>這部電腦有舊版資料（${n} 班）。</b>先下載備份，登入新版後到「設定 → 還原備份」匯入。</p><button class="btn secondary" data-act="legacyDownload">${ic('download')}下載舊資料備份</button></div>` : ''}</div>`);
}

function gateError(msg) {
  showGate(`<div class="gate-card stack"><span class="kicker">${ic('cloudOff')}未能連線</span><h1>暫時連唔到伺服器</h1><p class="muted">${esc(msg)}</p><button class="btn primary xl" data-act="retryBoot">${ic('refresh')}再試一次</button></div>`);
}

function formError(form, msg) {
  const el = form.querySelector('.form-err');
  el.textContent = msg;
  el.hidden = !msg;
  form.classList.remove('shake');
  void form.offsetWidth;
  if (msg) form.classList.add('shake');
}

async function doLogin(form, fd) {
  const username = String(fd.get('username') || '').trim();
  const password = String(fd.get('password') || '');
  if (!username || !password) return formError(form, '請輸入登入名稱及密碼');
  const btn = form.querySelector('button.primary');
  btn.disabled = true;
  try {
    const r = await api('POST', '/api/login', { username, password });
    await enter(r.user);
  } catch (e) {
    formError(form, e.message);
    btn.disabled = false;
  }
}

async function doFirstPassword(form, fd) {
  if (fd.get('next') !== fd.get('confirm')) return formError(form, '兩次輸入的新密碼不一樣');
  try {
    const r = await api('POST', '/api/password', { current: fd.get('current'), next: fd.get('next') });
    await enter(r.user);
    toast('密碼已設定，歡迎使用');
  } catch (e) {
    formError(form, e.message);
  }
}

function onConflict(next, version) {
  state = next;
  undo = [];
  clearUndo(me.id);
  ui.modal = null;
  render();
  toast('另一部裝置更新咗資料，已載入最新版本', true);
}

async function enter(user) {
  if (me && me.id !== user.id) return location.reload();
  me = user;
  if (me.mustChange) return gateFirstPassword();
  if (!sync) {
    let r;
    try {
      r = await loadRemote();
    } catch (e) {
      return gateError(e.message);
    }
    state = r.state;
    undo = loadUndo(me.id);
    sync = createSync({ uid: me.id, version: r.version, onConflict, onStatus: (st) => {
      syncStatus = st;
      renderSync();
      if (st === 'auth') gateLogin('登入已過期，請重新登入。未儲存的改動會在登入後自動上載。');
    } });
  } else sync.flushNow();
  hideGate();
  render();
}

async function boot() {
  try {
    const r = await api('GET', '/api/me');
    await enter(r.user);
  } catch (e) {
    if (e.status === 401) return gateLogin();
    if (e.status === -1 || e.status === 405 || e.status === 404) return gateMoved();
    gateError(e.message);
  }
}

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || !sync || sync.dirty || ui.modal || ui.rolling || document.body.classList.contains('gated')) return;
  try {
    const r = await loadRemote();
    if (r.version !== sync.base && !sync.dirty) {
      state = r.state;
      sync.setBase(r.version);
      undo = [];
      render();
      toast('已載入另一部裝置的最新資料');
    }
  } catch {}
});

window.addEventListener('beforeunload', (ev) => {
  if (sync?.dirty) {
    sync.flushNow();
    ev.preventDefault();
    ev.returnValue = '';
  }
});

const params = new URLSearchParams(location.search);
if (params.has('test')) {
  window.__cq = {
    get state() { return state; },
    get synced() { return !sync?.dirty; },
    setRng(values) { let i = 0; rng = () => values[i++ % values.length]; },
  };
}

boot();
