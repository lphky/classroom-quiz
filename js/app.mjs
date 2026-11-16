import * as L from './logic.mjs';
import { addDemo } from './demo.mjs';
import { load, loadUndo, save, UNDO_MAX } from './store.mjs';

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

let state = load();
let undo = loadUndo();
const ui = { tab: 'class', modal: null, rolling: false, absentDraft: {}, filter: 'all', search: '' };
let rng = Math.random;

const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduceMotion = () => !state.settings.animation || matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hue = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const avatar = (s, size = '') => `<span class="avatar ${size}" style="--h:${hue(s.name)}">${esc([...s.name].slice(-2).join(''))}</span>`;

function commit(next, label) {
  undo.push({ label, state });
  if (undo.length > UNDO_MAX) undo.shift();
  state = next;
  save(state, undo);
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
  save(state, undo);
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
const itemDots = (st) =>
  ITEM_KEYS.filter((k) => st.items[k] > 0)
    .map((k) => `<span class="dot tier-${ITEMS[k].tier}" title="${esc(ITEMS[k].name)} × ${st.items[k]}">${ic(ITEMS[k].glyph)}${st.items[k] > 1 ? `<b>${st.items[k]}</b>` : ''}</span>`)
    .join('');
const pct = (x) => `${(x * 100).toFixed(1)}%`;

const TABS = [
  ['class', '課堂', 'grid'],
  ['cards', '道具圖鑑', 'layers'],
  ['students', '學生', 'users'],
  ['report', '報表', 'chart'],
  ['settings', '設定', 'sliders'],
];
const TITLES = { class: ['課堂', '抽問、作答及道具'], cards: ['道具圖鑑', '四款技能卡'], students: ['學生', '名單、分數及背包'], report: ['報表', '成績與紀錄'], settings: ['設定', '規則、備份及測試資料'] };

function renderHeader() {
  $('#tabs').innerHTML = TABS.map(([k, n, i]) => `<button class="tab${ui.tab === k ? ' on' : ''}" data-act="tab" data-v="${k}"${ui.tab === k ? ' aria-current="page"' : ''}>${ic(i)}<span>${n}</span></button>`).join('');
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
}

function render() {
  renderHeader();
  const app = $('#app');
  const views = { class: viewClass, cards: viewCards, students: viewStudents, report: viewReport, settings: viewSettings };
  app.innerHTML = `<div class="view view-${ui.tab}">${views[ui.tab]()}</div>`;
  renderModal();
  filterRoster();
  updateClock();
}

function viewCards() {
  return `<section class="cards-hero">
      <div><span class="kicker">${ic('sparkle')}技能卡收藏</span><h2 class="display">主動舉手答對，<br>即可抽一張技能卡。</h2>
      <p class="muted">站立同學答對可以坐低，但不抽卡。每人背包上限 ${state.settings.bagCap} 張，道具跨堂保留。</p></div>
      <div class="odds">${ITEM_KEYS.map((k) => { const t = ITEM_KEYS.reduce((n, x) => n + state.settings.itemOdds[x], 0) || 1; const v = Math.round(state.settings.itemOdds[k] / t * 100); return `<div class="odd tier-${ITEMS[k].tier}"><span>${esc(ITEMS[k].name)}</span><i style="--v:${v}%"></i><b>${v}%</b></div>`; }).join('')}</div>
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
        <p class="muted">抽人作答、站立挑戰、收集技能卡。所有資料只儲存在這部電腦。</p>
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
    <div class="table-wrap"><table><thead><tr><th>#</th><th>座號</th><th>姓名</th><th>總分</th><th>答問</th><th>答對率</th><th>主動</th><th>被抽</th><th>罰站</th><th>道具 得/用</th><th>權重</th><th>背包</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.no)}</td><td>${esc(r.name)}</td><td><b>${r.score}</b></td><td>${r.answered}</td><td>${r.answered ? Math.round((r.correct / r.answered) * 100) + '%' : '—'}</td>
      <td>${r.volunteerCorrect}/${r.volunteer}</td><td>${r.drawnCorrect}/${r.drawn}</td><td>${r.stood}</td><td>${r.itemsGot}/${r.itemsUsed}</td><td>${r.weight}</td><td><span class="chips">${itemDots(r) || '—'}</span></td></tr>`).join('')}
    </tbody></table></div><p class="muted small">「主動」「被抽」顯示 答對/次數。</p></section>
    <section class="panel"><h3>最近紀錄</h3>${logs.length ? `<ol class="log">${logs.map((e) => `<li class="${e.type === 'answer' ? (e.correct ? 'ok' : 'no') : 'item'}"><time>${new Date(e.at).toLocaleString('zh-HK', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><span>${esc(L.describeLog(e))}</span></li>`).join('')}</ol>` : '<p class="muted">未有紀錄</p>'}</section>`;
}

function viewSettings() {
  const s = state.settings;
  const num = (name, val, label, extra = '') => `<label class="field"><span>${label}</span><input type="number" name="${name}" value="${val}" ${extra}></label>`;
  const sw = (name, on, label) => `<label class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i><span>${label}</span></label>`;
  const oddsTotal = ITEM_KEYS.reduce((n, k) => n + s.itemOdds[k], 0) || 1;
  return `<form data-form="settings" class="settings">
    <section class="panel"><h3>計分</h3><div class="form-grid">
      ${num('score.volunteer', s.score.volunteer, '主動舉手答對')}${num('score.drawn', s.score.drawn, '被抽中答對')}
      ${num('score.designated', s.score.designated, '被指定代答答對')}${num('score.standing', s.score.standing, '站立者舉手答對')}</div></section>
    <section class="panel"><h3>道具機率（主動答對時抽）</h3><div class="form-grid">
      ${ITEM_KEYS.map((k) => num(`itemOdds.${k}`, s.itemOdds[k], `${ITEMS[k].name}（目前 ${Math.round((s.itemOdds[k] / oddsTotal) * 100)}%）`, 'min="0"')).join('')}</div></section>
    <section class="panel"><h3>抽中權重</h3><div class="form-grid">
      ${num('baseWeight', s.baseWeight, '新學生預設權重', 'min="1"')}${num('weightStep', s.weightStep, '每張機率卡加/減', 'min="0"')}
      ${num('minWeight', s.minWeight, '最低權重', 'min="1"')}${num('maxWeight', s.maxWeight, '最高權重', 'min="1"')}</div></section>
    <section class="panel"><h3>其他</h3><div class="form-grid">
      ${num('bagCap', s.bagCap, '背包上限（張）', 'min="0"')}${num('antiRepeatCount', s.antiRepeatCount, '防連抽：答完後幾多題內機率減半', 'min="1"')}</div>
      <div class="switches">${sw('antiRepeat', s.antiRepeat, '開啟防連抽')}${sw('showOdds', s.showOdds, '課堂畫面顯示抽中機率')}${sw('animation', s.animation, '抽人及卡牌動畫')}</div></section>
    <div class="sticky-save"><button class="btn primary">${ic('check')}儲存設定</button></div></form>
    <section class="panel"><h3>資料備份與試玩</h3><p class="muted">資料只儲存在這部電腦的瀏覽器。換機或清除瀏覽器資料前，請先下載備份。</p>
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

const TIER_COLORS = { rare: ['#22d3ee', '#a5f3fc'], epic: ['#f59e0b', '#fde68a'], fine: ['#10b981', '#a7f3d0'], legend: ['#ec4899', '#f0abfc'], base: ['#6366f1', '#f59e0b', '#10b981', '#ec4899'] };
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

document.addEventListener('input', (ev) => {
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
      toast('12 位虛構學生已加入，每人有四種道具各一張');
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
    openModal({ type: 'reward', id, item: e.item, points: e.points, correct, msg });
    if (correct && !reduceMotion()) setTimeout(() => burst($(e.item ? '.modal .card-flip' : '.modal .result-ic'), e.item ? 34 : 18, e.item ? ITEMS[e.item].tier : 'base'), e.item ? 650 : 120);
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
    save(state, undo);
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
  } else if (kind === 'prompt') {
    ui.modal.onSubmit(fd.get('v'));
  }
});

document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.id === 'classSelect') {
    state.activeClassId = t.value;
    save(state, undo);
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

const params = new URLSearchParams(location.search);
if (params.has('test')) {
  window.__cq = {
    get state() { return state; },
    setRng(values) { let i = 0; rng = () => values[i++ % values.length]; },
  };
}

render();
