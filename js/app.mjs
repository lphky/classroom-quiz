import * as L from './logic.mjs';
import { addDemo } from './demo.mjs';
import { load, loadUndo, save, UNDO_MAX } from './store.mjs';

const ITEM_KEYS = L.ITEM_KEYS;
const glyph = (paths) => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const cardArt = {
  exempt: glyph('<path d="M24 4 40 11v12c0 10-16 21-16 21S8 33 8 23V11L24 4Z"/><path d="m17 24 5 5 10-12"/>'),
  designate: glyph('<circle cx="14" cy="14" r="6"/><path d="M4 36v-5a10 10 0 0 1 20 0v5M29 14h13m-6-6 7 6-7 6M28 30h14m-7-6 7 6-7 6"/>'),
  down: glyph('<path d="M9 9h30v30H9zM24 16v17m-7-7 7 7 7-7"/>'),
  up: glyph('<circle cx="24" cy="24" r="19"/><path d="M24 34V14m-8 8 8-8 8 8"/>')
};
const navArt = {
 class:glyph('<rect x="6" y="6" width="14" height="14" rx="2"/><rect x="28" y="6" width="14" height="14" rx="2"/><rect x="6" y="28" width="14" height="14" rx="2"/><rect x="28" y="28" width="14" height="14" rx="2"/>'),
 cards:glyph('<rect x="14" y="6" width="26" height="34" rx="4"/><path d="M7 12v29a3 3 0 0 0 3 3h22M21 23h12m-6-6v12"/>'),
 students:glyph('<circle cx="18" cy="16" r="8"/><path d="M4 42v-5a14 14 0 0 1 28 0v5M33 9a8 8 0 0 1 0 15m5 6c6 2 6 6 6 12"/>'),
 report:glyph('<path d="M7 5v37h36M16 33V22m10 11V12m10 21V5"/>'),
 settings:glyph('<path d="M5 12h38M5 24h38M5 36h38"/><circle cx="16" cy="12" r="4" fill="currentColor"/><circle cx="32" cy="24" r="4" fill="currentColor"/><circle cx="20" cy="36" r="4" fill="currentColor"/>')
};
const cardIcons = {exempt:'◇',designate:'↗',down:'↓',up:'↑'};
const ITEMS = Object.fromEntries(ITEM_KEYS.map(k=>[k,{...L.ITEMS[k],icon:cardIcons[k]}]));
let state = load();
let undo = loadUndo();
const ui = { tab: 'class', modal: null, rolling: false, absentDraft: {}, filter: 'all', search: '' };
let rng = Math.random;

const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduceMotion = () => !state.settings.animation || matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function commit(next, label) {
  undo.push({ label, state });
  if (undo.length > UNDO_MAX) undo.shift();
  state = next;
  save(state, undo);
  render();
}

function attempt(fn, label) {
  try {
    const next = fn(state);
    commit(next, label);
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
  t.textContent = msg;
  t.className = `toast${bad ? ' bad' : ''}`;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

const cls = () => L.getClass(state);
const stu = (id) => L.getStudent(state, id);
const itemChips = (st, small = false) =>
  ITEM_KEYS.filter((k) => st.items[k] > 0)
    .map((k) => `<span class="chip${small ? ' sm' : ''}" title="${esc(ITEMS[k].name)}">${ITEMS[k].icon}${st.items[k] > 1 ? `×${st.items[k]}` : ''}</span>`)
    .join('');
const pct = (x) => `${(x * 100).toFixed(1)}%`;

const TABS = [
  ['class', '課堂'],
  ['cards', '道具圖鑑'],
  ['students', '學生'],
  ['report', '報表'],
  ['settings', '設定'],
];

function renderHeader() {
  $('#tabs').innerHTML = TABS.map(([k, n]) => `<button class="tab${ui.tab === k ? ' on' : ''}" data-act="tab" data-v="${k}"><span class="nav-icon" aria-hidden="true">${navArt[k]}</span><span>${n}</span></button>`).join('');
  const sel = $('#classSelect');
  sel.innerHTML = state.classes.length
    ? state.classes.map((c) => `<option value="${c.id}"${c.id === state.activeClassId ? ' selected' : ''}>${esc(c.name)}</option>`).join('')
    : '<option>未有班別</option>';
  sel.disabled = !state.classes.length || !!state.session;
  sel.title = state.session ? '上緊堂，落堂先可以轉班' : '';
  const btn = $('#undoBtn');
  btn.disabled = !undo.length;
  btn.title = undo.length ? `復原：${undo[undo.length - 1].label}` : '冇嘢可以復原';
}

function render() {
  renderHeader();
  const app = $('#app');
  if (ui.tab === 'class') app.innerHTML = viewClass();
  else if (ui.tab === 'cards') app.innerHTML = viewCards();
  else if (ui.tab === 'students') app.innerHTML = viewStudents();
  else if (ui.tab === 'report') app.innerHTML = viewReport();
  else app.innerHTML = viewSettings();
  app.insertAdjacentHTML('afterbegin', `<div class="page-heading"><div><span class="eyebrow">CLASSROOM / ${ui.tab.toUpperCase()}</span><h1>${({class:'課堂控制室',cards:'道具收藏室',students:'你的班級，井然有序。',report:'讓進步留下紀錄。',settings:'打造你的課堂節奏。'})[ui.tab]}</h1><p>CLASSROOM PLAYBOOK · 每一次參與，都算數。</p></div><span class="live-badge">${state.session?'課堂進行中':'準備就緒'}</span></div>`);
  renderModal();
  filterRoster();
}

function viewCards() {
  return `<section class="hero"><span class="eyebrow">THE INVENTORY</span><h1>小小一張卡，換個新玩法。</h1><p>主動舉手答對即可抽卡。站立同學答對可坐低，不抽卡。</p></section><div class="inventory">${ITEM_KEYS.map((k,i)=>`<article class="collectible tone-${i}"><span class="eyebrow">NO. 0${i+1} / SKILL CARD</span><div class="card-symbol">${cardArt[k]}</div><h2>${esc(ITEMS[k].name)}</h2><p>${esc(ITEMS[k].desc)}</p><footer>${i<2?'被抽中時使用':'點學生 → 背包使用'}${k==='up'?' · 老師批准':''}</footer></article>`).join('')}</div><section class="card"><h3>公平遊戲約定</h3><p>指定不能連鎖轉嫁；權重有上下限；老師可以否決調高卡。背包容量及抽卡比例可在設定調整。</p></section>`;
}
function viewNewClass(intro = true) {
  return `${intro ? '<section class="hero"><span class="eyebrow">CLASSROOM QUEST / 教師控制台</span><h1>今天的精彩，<br>由一個舉手開始。</h1><p>抽問、收集道具、一起達成全班挑戰。</p><button class="btn primary big" data-act="demo">一鍵體驗 · 12 人測試班</button></section>' : ''}<section class="card narrow">
    ${intro ? '<h2>開始：建立第一班</h2><p class="muted">貼上學生名單，每行一位。可以寫「座號 姓名」，例如「1 陳大文」。</p>' : '<h2>新增班別</h2>'}
    <form data-form="newClass" class="stack">
      <label>班名<input name="name" required placeholder="例如：3A 中文"></label>
      <label>學生名單<textarea name="roster" rows="8" placeholder="1 陳大文&#10;2 李小明&#10;3 張美玲"></textarea></label>
      <button class="btn primary">建立班別</button>
    </form>
  </section>`;
}

function viewClass() {
  const c = cls();
  if (!c) return viewNewClass();
  if (!state.session) return viewAttendance(c);
  return viewLive(c);
}

function viewAttendance(c) {
  if (!c.students.length) return `<section class="card narrow"><h2>${esc(c.name)}</h2><p>呢班未有學生，請到「學生」加入名單。</p><button class="btn primary" data-act="tab" data-v="students">去加學生</button></section>`;
  const absentCount = c.students.filter((s) => ui.absentDraft[s.id]).length;
  return `<section class="card">
    <div class="row between"><h2>${esc(c.name)}：點名</h2><span class="muted">撳名字標示缺席（缺席唔會被抽）</span></div>
    <div class="grid">
      ${c.students.map((s) => `<button class="tile ${ui.absentDraft[s.id] ? 'absent' : 'seated'}" data-act="draftAbsent" data-id="${s.id}">
        <span class="no">${esc(s.no)}</span><span class="nm">${esc(s.name)}</span><span class="st">${ui.absentDraft[s.id] ? '缺席' : '出席'}</span></button>`).join('')}
    </div>
    <div class="row end gap"><span class="muted">出席 ${c.students.length - absentCount} 人，缺席 ${absentCount} 人</span><button class="btn primary big" data-act="startSession">開始上堂</button></div>
  </section>`;
}

function viewLive(c) {
  const ses = state.session;
  const cands = L.drawCandidates(state);
  const chance = Object.fromEntries(cands.map((x) => [x.id, x.chance]));
  const standingCount = c.students.filter((s) => ses.standing[s.id]).length;
  const recentLogs = state.logs.filter((e) => e.sessionId === ses.id && !['start', 'adjust'].includes(e.type)).slice(-8).reverse();
  const answers = state.logs.filter(e=>e.sessionId===ses.id && e.type==='answer');
  const wins = answers.filter(e=>e.correct).length;
  const goal = 10;
  const participants = new Set(answers.map(e=>e.studentId)).size;
  const streak = answers.slice().reverse().findIndex(e=>!e.correct);
  const combo = streak < 0 ? answers.length : streak;
  return `<section class="hero live-hero"><div><span class="eyebrow">LIVE CLASSROOM / ${esc(c.name)}</span><h1>${wins>=goal?'任務達成，漂亮！':'把課堂，變成主場。'}</h1><p>合作任務：全班累積答對 10 題，不額外改動個人成績。</p><div class="mission"><progress max="10" value="${Math.min(10,wins)}"></progress><b>${wins} / 10</b></div></div><div class="clock-panel"><span class="eyebrow">思考倒數</span><strong id="questClock">${clockLeft}</strong><div class="row"><button class="btn ghost" data-act="timer">${clockRunning?'暫停':'開始'}倒數</button><button class="btn ghost" data-act="resetTimer">重設 30 秒</button></div></div></section><section class="pulse-grid" aria-label="課堂即時數據"><div class="pulse"><strong>${answers.length ? Math.round(wins/answers.length*100) : 0}%</strong><span>今堂答對率<small>每次嘗試，都有進步</small></span></div><div class="pulse"><strong>${participants}</strong><span>已參與同學<small>讓更多聲音被聽見</small></span></div><div class="pulse"><strong>${combo}<small> COMBO</small></strong><span>連續答對<small>全班合作，一起突破</small></span></div></section><section class="actions">
      <button class="btn hand big" data-act="volunteer"><span class="action-icon" aria-hidden="true">✦</span><span class="action-copy"><strong>有人舉手</strong><small>鼓勵主動參與 · 答對抽卡</small></span><span class="action-arrow">↗</span></button>
      <button class="btn draw big" data-act="draw"><span class="action-icon" aria-hidden="true">⌘</span><span class="action-copy"><strong>冇人舉手，抽人</strong><small>隨機邀請 · 讓每位都有機會</small></span><span class="action-arrow">↗</span></button>
    </section>
    <section class="card">
      <div class="row between wrap">
        <div class="stats"><span>已問 <b>${ses.qCount}</b> 題</span><span class="pill standing">站立 ${standingCount} 人</span><span class="muted">可抽 ${cands.length} 人</span></div>
        <button class="btn ghost" data-act="endSession">落堂</button>
      </div>
      <div class="roster-tools"><input id="rosterSearch" type="search" placeholder="搜尋姓名或座號…" aria-label="搜尋學生" value="${esc(ui.search)}"><div class="filters" aria-label="學生狀態篩選">${[['all','全班'],['standing','站立優先'],['seated','坐低'],['absent','缺席']].map(([v,n])=>`<button data-act="filterRoster" data-v="${v}" class="${ui.filter===v?'on':''}" aria-pressed="${ui.filter===v}">${n}</button>`).join('')}</div></div>
      <div class="grid" id="liveRoster">
        ${c.students
          .map((s) => {
            const st = L.studentStatus(state, s.id);
            const label = { seated: '坐低', standing: '站立', absent: '缺席' }[st];
            return `<button class="tile ${st}" data-status="${st}" data-search="${esc(s.no+' '+s.name)}" data-act="studentSheet" data-id="${s.id}">
              <span class="no">${esc(s.no)}</span><span class="nm">${esc(s.name)}</span>
              <span class="st">${label}${state.settings.showOdds && chance[s.id] != null ? ` · ${pct(chance[s.id])}` : ''}</span>
              <span class="chips">${itemChips(s, true)}</span><span class="score">${s.score}分</span></button>`;
          })
          .join('')}
      </div>
    </section>
    <section class="card"><h3>今堂紀錄</h3>${recentLogs.length ? `<ul class="log">${recentLogs.map((e) => `<li><time>${new Date(e.at).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}</time>${esc(L.describeLog(e))}</li>`).join('')}</ul>` : '<p class="muted">未有紀錄</p>'}</section>`;
}

function viewStudents() {
  const c = cls();
  const classList = state.classes
    .map((k) => `<li class="row between"><span>${esc(k.name)}（${k.students.length} 人）</span><span class="gap row">
      <button class="btn sm ghost" data-act="pickClass" data-id="${k.id}">${k.id === state.activeClassId ? '目前' : '揀'}</button>
      <button class="btn sm ghost" data-act="renameClass" data-id="${k.id}">改名</button>
      <button class="btn sm danger" data-act="deleteClass" data-id="${k.id}">刪除</button></span></li>`)
    .join('');
  const table = c
    ? `<section class="card"><div class="row between wrap"><h2>${esc(c.name)} 學生</h2><span class="muted">直接改格仔就會儲存</span></div>
    <div class="table-wrap"><table class="edit"><thead><tr><th>座號</th><th>姓名</th><th>分數</th><th>抽中權重</th>${ITEM_KEYS.map((k) => `<th title="${esc(ITEMS[k].name)}">${ITEMS[k].icon}</th>`).join('')}<th></th></tr></thead><tbody>
    ${c.students
      .map((s) => `<tr data-id="${s.id}">
        <td><input data-field="no" value="${esc(s.no)}" size="3"></td>
        <td><input data-field="name" value="${esc(s.name)}"></td>
        <td><input data-field="score" type="number" value="${s.score}"></td>
        <td><input data-field="weight" type="number" step="${state.settings.weightStep || 1}" min="${state.settings.minWeight}" max="${state.settings.maxWeight}" value="${s.weight}"></td>
        ${ITEM_KEYS.map((k) => `<td><input data-field="item:${k}" type="number" min="0" value="${s.items[k]}"></td>`).join('')}
        <td><button class="btn sm danger" data-act="removeStudent" data-id="${s.id}">刪</button></td></tr>`)
      .join('')}
    </tbody></table></div>
    <form data-form="addStudents" class="stack"><label>加入學生（每行一位）<textarea name="roster" rows="3" placeholder="31 黃志強"></textarea></label><button class="btn">加入</button></form>
    <p class="muted small">權重 ${state.settings.baseWeight} 係正常；範圍 ${state.settings.minWeight}–${state.settings.maxWeight}。道具圖示：${ITEM_KEYS.map((k) => `${ITEMS[k].icon} ${esc(ITEMS[k].name)}`).join('、')}</p></section>`
    : '';
  return `${table}<section class="card"><h2>班別</h2><ul class="plain">${classList || '<li class="muted">未有班別</li>'}</ul></section>${viewNewClass(false)}`;
}

function viewReport() {
  const c = cls();
  if (!c) return '<section class="card"><p>未有班別。</p></section>';
  const rows = L.classStats(state, c.id).sort((a, b) => b.score - a.score || a.no.localeCompare(b.no, 'en', { numeric: true }));
  const logs = state.logs.filter((e) => e.classId === c.id && e.type !== 'start').slice(-150).reverse();
  const sessions = state.sessions.filter((s) => s.classId === c.id);
  return `<section class="card"><div class="row between wrap"><h2>${esc(c.name)} 成績</h2>
    <span class="row gap"><button class="btn" data-act="exportStats">下載成績 (CSV)</button><button class="btn ghost" data-act="exportLogs">下載紀錄 (CSV)</button></span></div>
    <p class="muted">共上咗 ${sessions.length} 堂${state.session?.classId === c.id ? '（另有一堂進行中）' : ''}。</p>
    <div class="table-wrap"><table><thead><tr><th>#</th><th>座號</th><th>姓名</th><th>總分</th><th>答問</th><th>答對率</th><th>主動</th><th>被抽</th><th>罰站</th><th>道具 得/用</th><th>權重</th><th>背包</th></tr></thead><tbody>
    ${rows
      .map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.no)}</td><td>${esc(r.name)}</td><td><b>${r.score}</b></td><td>${r.answered}</td><td>${r.answered ? Math.round((r.correct / r.answered) * 100) + '%' : '—'}</td>
      <td>${r.volunteerCorrect}/${r.volunteer}</td><td>${r.drawnCorrect}/${r.drawn}</td><td>${r.stood}</td><td>${r.itemsGot}/${r.itemsUsed}</td><td>${r.weight}</td><td>${itemChips(r) || '—'}</td></tr>`)
      .join('')}
    </tbody></table></div><p class="muted small">「主動」「被抽」顯示 答對/次數。</p></section>
    <section class="card"><h3>最近紀錄</h3>${logs.length ? `<ul class="log">${logs.map((e) => `<li><time>${new Date(e.at).toLocaleString('zh-HK', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>${esc(L.describeLog(e))}</li>`).join('')}</ul>` : '<p class="muted">未有紀錄</p>'}</section>`;
}

function viewSettings() {
  const s = state.settings;
  const num = (name, val, label, extra = '') => `<label>${label}<input type="number" name="${name}" value="${val}" ${extra}></label>`;
  const oddsTotal = ITEM_KEYS.reduce((n, k) => n + s.itemOdds[k], 0) || 1;
  return `<form data-form="settings" class="card stack">
    <h2>計分</h2><div class="form-grid">
      ${num('score.volunteer', s.score.volunteer, '主動舉手答對')}${num('score.drawn', s.score.drawn, '被抽中答對')}
      ${num('score.designated', s.score.designated, '被指定代答答對')}${num('score.standing', s.score.standing, '站立者舉手答對')}</div>
    <h2>道具機率（主動答對時抽）</h2><div class="form-grid">
      ${ITEM_KEYS.map((k) => num(`itemOdds.${k}`, s.itemOdds[k], `${ITEMS[k].icon} ${ITEMS[k].name}（目前 ${Math.round((s.itemOdds[k] / oddsTotal) * 100)}%）`, 'min="0"')).join('')}</div>
    <h2>抽中權重</h2><div class="form-grid">
      ${num('baseWeight', s.baseWeight, '新學生預設權重', 'min="1"')}${num('weightStep', s.weightStep, '每張機率卡加/減', 'min="0"')}
      ${num('minWeight', s.minWeight, '最低權重', 'min="1"')}${num('maxWeight', s.maxWeight, '最高權重', 'min="1"')}</div>
    <h2>其他</h2><div class="form-grid">
      ${num('bagCap', s.bagCap, '背包上限（張）', 'min="0"')}${num('antiRepeatCount', s.antiRepeatCount, '防連抽：答完後幾多題內機率減半', 'min="1"')}
      <label class="check"><input type="checkbox" name="antiRepeat" ${s.antiRepeat ? 'checked' : ''}> 開啟防連抽</label>
      <label class="check"><input type="checkbox" name="showOdds" ${s.showOdds ? 'checked' : ''}> 課堂畫面顯示抽中機率</label>
      <label class="check"><input type="checkbox" name="animation" ${s.animation ? 'checked' : ''}> 抽人及抽卡動畫</label></div>
    <div class="row end"><button class="btn primary">儲存設定</button></div></form>
    <section class="card stack"><h2>資料備份與試玩</h2><button type="button" class="btn" data-act="demo">新增 12 人測試班（保留現有班別）</button>
      <p class="muted">資料只儲存喺呢部機嘅瀏覽器。換機或清瀏覽器資料前，請先下載備份。</p>
      <div class="row gap wrap"><button class="btn" data-act="backup">下載備份</button>
      <label class="btn ghost file">還原備份<input type="file" accept="application/json,.json" data-act="restore" hidden></label>
      <button class="btn danger" data-act="wipe">清除全部資料</button></div></section>`;
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
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" tabindex="-1">${modalBody(m)}</div>`;
  const heading = wrap.querySelector("h2");
  if (heading) { heading.id="dialogTitle"; wrap.firstElementChild.setAttribute("aria-labelledby", "dialogTitle"); }
}

function studentPicker(list, act, extra = () => '') {
  return `<div class="pick">${list.map((s) => `<button class="tile ${L.studentStatus(state, s.id)}" data-act="${act}" data-id="${s.id}"><span class="no">${esc(s.no)}</span><span class="nm">${esc(s.name)}</span>${extra(s)}</button>`).join('')}</div>`;
}

function modalBody(m) {
  const close = '<button class="btn ghost" data-act="closeModal">關閉</button>';
  if (m.type === 'volunteer') {
    const c = cls();
    const present = c.students.filter((s) => !state.session.absent[s.id]);
    const standing = present.filter((s) => state.session.standing[s.id]);
    const seated = present.filter((s) => !state.session.standing[s.id]);
    return `<h2>選擇舉手的同學</h2>
      ${standing.length ? `<h3 class="prio">站立同學優先</h3>${studentPicker(standing, 'pickVolunteer', () => '<span class="st">優先</span>')}` : ''}
      <h3>坐低的同學</h3>${studentPicker(seated, 'pickVolunteer', (s) => `<span class="chips">${itemChips(s, true)}</span>`)}
      <div class="row end">${close}</div>`;
  }
  if (m.type === 'volunteerAnswer') {
    const s = stu(m.id);
    const standing = state.session.standing[s.id];
    return `<h2>${esc(s.name)} 答得啱唔啱？</h2>
      <p class="muted">${standing ? '佢而家站緊：答對就可以坐返低。' : `答對 +${state.settings.score.volunteer} 分，仲可以抽一張道具。答錯冇任何懲罰。`}</p>
      <div class="answer"><button class="btn ok big" data-act="volunteerResult" data-v="1">✔ 答對</button><button class="btn no big" data-act="volunteerResult" data-v="0">✘ 答錯</button></div>
      <div class="row end"><button class="btn ghost" data-act="volunteer">返回</button></div>`;
  }
  if (m.type === 'reward') {
    const s = stu(m.id);
    if (m.item) {
      const it = ITEMS[m.item];
      return `<h2>${esc(s.name)} 答對！+${m.points} 分</h2><div class="card-flip${reduceMotion() ? ' instant' : ''}"><div class="face back">？</div><div class="face front"><div class="icon">${it.icon}</div><div class="nm">${esc(it.name)}</div><div class="small">${esc(it.desc)}</div></div></div><div class="row end"><button class="btn primary" data-act="closeModal">好</button></div>`;
    }
    return `<h2>${esc(s.name)} ${m.correct ? `答對！+${m.points} 分` : '答錯'}</h2><p class="big-msg">${m.msg}</p><div class="row end"><button class="btn primary" data-act="closeModal">好</button></div>`;
  }
  if (m.type === 'draw') {
    const q = state.session.question;
    if (ui.rolling || !q) return `<h2>正在邀請一位同學…</h2><div class="roll" id="roll">${esc(m.rollText || '')}</div>`;
    const s = stu(q.answererId);
    const by = q.designatedBy ? stu(q.designatedBy) : null;
    const canEx = L.canUseExempt(state);
    const canDe = L.canUseDesignate(state);
    return `<h2>${by ? `👉 ${esc(by.name)} 指定` : '這一題，交給你'}</h2><div class="roll done">${esc(s.name)}</div>
      ${by ? '<p class="muted center">被指定的同學答錯要站立，亦唔可以再用指定卡。</p>' : ''}
      <div class="answer"><button class="btn ok big" data-act="drawResult" data-v="1">✔ 答對</button><button class="btn no big" data-act="drawResult" data-v="0">✘ 答錯（罰站）</button></div>
      ${canEx || canDe ? `<div class="row center gap wrap">${canEx ? `<button class="btn item" data-act="useExempt">${ITEMS.exempt.icon} 用免答卡（剩 ${s.items.exempt}）</button>` : ''}${canDe ? `<button class="btn item" data-act="chooseDesignate">${ITEMS.designate.icon} 用指定同學卡（剩 ${s.items.designate}）</button>` : ''}</div>` : ''}
      <div class="row end"><button class="btn ghost" data-act="cancelQuestion">取消呢條問題</button></div>`;
  }
  if (m.type === 'designate') {
    const s = stu(state.session.question.answererId);
    const list = L.designateTargets(state).map((x) => stu(x.id));
    return `<h2>${esc(s.name)} 想指定邊位同學代答？</h2><p class="muted">只可以揀出席、坐低而且今條問題未輪過的同學。</p>${studentPicker(list, 'pickDesignate')}<div class="row end"><button class="btn ghost" data-act="backToDraw">返回</button></div>`;
  }
  if (m.type === 'sheet') {
    const s = stu(m.id);
    const status = L.studentStatus(state, s.id);
    const busy = !!state.session?.question;
    return `<h2>${esc(s.no)} ${esc(s.name)}</h2>
      <p>狀態：<b>${{ seated: '坐低', standing: '站立', absent: '缺席' }[status]}</b>　分數：<b>${s.score}</b>　抽中權重：<b>${s.weight}</b></p>
      <h3>背包（${L.bagTotal(s)}/${state.settings.bagCap}）</h3>
      <ul class="plain">${ITEM_KEYS.map((k) => `<li>${ITEMS[k].icon} ${esc(ITEMS[k].name)} × ${s.items[k]}<span class="muted small">　${esc(ITEMS[k].desc)}</span></li>`).join('')}</ul>
      <div class="row gap wrap">
        <button class="btn item" data-act="useDown" ${s.items.down > 0 && !busy ? '' : 'disabled'}>${ITEMS.down.icon} 用調低卡</button>
        <button class="btn item" data-act="chooseUp" ${s.items.up > 0 && !busy ? '' : 'disabled'}>${ITEMS.up.icon} 用調高卡</button>
      </div>
      <p class="muted small">免答卡及指定同學卡會喺被抽中時自動出現。</p>
      <h3>老師操作</h3><div class="row gap wrap">
        ${status !== 'absent' ? `<button class="btn ghost" data-act="toggleStand">${status === 'standing' ? '設為坐低' : '設為站立'}</button>` : ''}
        <button class="btn ghost" data-act="toggleAbsent">${status === 'absent' ? '標示出席' : '標示缺席'}</button></div>
      <div class="row end">${close}</div>`;
  }
  if (m.type === 'chooseUp') {
    const s = stu(m.id);
    const list = cls().students.filter((x) => x.id !== s.id);
    return `<h2>${esc(s.name)} 想調高邊位同學被抽中的機率？</h2>${studentPicker(list, 'pickUp', (x) => `<span class="st">權重 ${x.weight}</span>`)}<div class="row end"><button class="btn ghost" data-act="studentSheet" data-id="${s.id}">返回</button></div>`;
  }
  if (m.type === 'confirmUp') {
    const s = stu(m.id);
    const t = stu(m.target);
    const after = Math.min(state.settings.maxWeight, t.weight + state.settings.weightStep);
    return `<h2>老師確認</h2><p class="big-msg">${esc(s.name)} 想用 ${ITEMS.up.icon} 調高卡，<br>將 <b>${esc(t.name)}</b> 的抽中權重由 ${t.weight} 調高到 ${after}。</p>
      <p class="muted">如果覺得係針對同學，可以否決（卡會保留）。</p>
      <div class="answer"><button class="btn ok big" data-act="confirmUp">批准</button><button class="btn no big" data-act="vetoUp">否決</button></div>`;
  }
  if (m.type === 'confirm') {
    return `<h2>${esc(m.title)}</h2><p>${m.html}</p><div class="row end gap"><button class="btn ghost" data-act="closeModal">取消</button><button class="btn ${m.danger ? 'danger' : 'primary'}" data-act="confirmYes">${esc(m.yes || '確定')}</button></div>`;
  }
  if (m.type === 'prompt') {
    return `<form data-form="prompt" class="stack"><h2>${esc(m.title)}</h2><input name="v" value="${esc(m.value)}" required autofocus><div class="row end gap"><button type="button" class="btn ghost" data-act="closeModal">取消</button><button class="btn primary">確定</button></div></form>`;
  }
  return close;
}

function openModal(m) {
  ui.modal = m;
  renderModal();
  if (m) $(".modal").focus({preventScroll:true});
}

function confirmBox(title, html, onYes, opts = {}) {
  openModal({ type: 'confirm', title, html, onYes, ...opts });
}

async function rollAnimation(finalId, pool) {
  ui.rolling = true;
  openModal({ type: 'draw', rollText: '' });
  const names = pool.length ? pool.map((x) => x.name) : [stu(finalId).name];
  if (!reduceMotion()) {
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const el = $('#roll');
      if (el) el.textContent = names[Math.floor(Math.random() * names.length)];
      await sleep(40 + i * i * 1.6);
    }
  }
  ui.rolling = false;
  openModal({ type: 'draw' });
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
setInterval(() => {
  if (!clockRunning) return;
  clockLeft = Math.max(0, clockLeft-1);
  const el = $('#questClock');
  if (el) el.textContent = clockLeft || '時間到';
  if (!clockLeft) { clockRunning=false; const btn = $('[data-act=timer]'); if(btn) btn.textContent='開始倒數'; toast('思考時間到，老師可以邀請同學作答'); }
}, 1000);
function filterRoster() {
  const grid = $('#liveRoster');
  if (!grid) return;
  let visible = 0;
  grid.querySelectorAll('.tile').forEach(tile => {
    const show = (ui.filter === 'all' || tile.dataset.status === ui.filter) && tile.dataset.search.toLowerCase().includes(ui.search.trim().toLowerCase());
    tile.hidden = !show;
    if (show) visible++;
  });
  grid.querySelector('.empty-roster')?.remove();
  if (!visible) grid.insertAdjacentHTML('beforeend','<p class="empty-roster">沒有符合的同學。試試其他姓名或狀態。</p>');
}

document.addEventListener('input', ev => {
  if (ev.target.id === 'rosterSearch') { ui.search = ev.target.value; filterRoster(); }
});

const actions = {
  filterRoster: el => { ui.filter = el.dataset.v; render(); },
  focusMode: () => { document.body.classList.toggle('focus-mode'); },
  timer: () => { if (!clockLeft) clockLeft=30; clockRunning=!clockRunning; render(); },
  resetTimer: () => { clockLeft=30; clockRunning=false; render(); },
  demo: () => { if (attempt(addDemo, '建立測試班')) { ui.tab='class'; render(); toast('12 位虛構學生已加入，每人有四種道具各一張'); } },
  fullscreen: async () => { try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { toast('此瀏覽器未能開啟全螢幕'); } },
  tab: (el) => {
    ui.tab = el.dataset.v;
    ui.modal = null;
    render();
  },
  closeModal: () => openModal(null),
  draftAbsent: (el) => {
    const id = el.dataset.id;
    ui.absentDraft[id] = !ui.absentDraft[id];
    render();
  },
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
    else if (wasStanding) msg = '可以坐返低 🙂';
    else if (e.bagFull) msg = `背包已滿（${state.settings.bagCap} 張），今次冇抽卡。`;
    openModal({ type: 'reward', id, item: e.item, points: e.points, correct, msg });
  },
  draw: () => startDraw(),
  drawResult: (el) => {
    const correct = el.dataset.v === '1';
    const q = state.session.question;
    const s = stu(q.answererId);
    if (!attempt((st) => L.resolveDraw(st, correct), `${s.name} ${correct ? '答對' : '答錯'}`)) return;
    const e = state.logs[state.logs.length - 1];
    openModal({ type: 'reward', id: s.id, correct, points: e.points, msg: correct ? '做得好，繼續坐低。' : '請到課室後面站立，舉手答對就可以坐返低。' });
  },
  useExempt: () => useExempt(),
  chooseDesignate: () => openModal({ type: 'designate' }),
  backToDraw: () => openModal({ type: 'draw' }),
  pickDesignate: (el) => {
    const by = stu(state.session.question.answererId).name;
    const t = stu(el.dataset.id).name;
    if (attempt((s) => L.useDesignate(s, el.dataset.id), `${by} 指定 ${t}`)) openModal({ type: 'draw' });
  },
  cancelQuestion: () => {
    if (attempt(L.cancelQuestion, '取消問題')) openModal(null);
  },
  studentSheet: (el) => {
    const id = el.dataset.id;
    if (state.session?.question) return openModal({ type: 'draw' });
    openModal({ type: 'sheet', id });
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
      if (attempt((st) => L.useWeightCard(st, id, 'down'), `${s.name} 用調低卡`)) openModal({ type: 'sheet', id });
      else openModal({ type: 'sheet', id });
    }, { yes: '使用', back: { type: 'sheet', id } });
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
    }
  },
  vetoUp: () => {
    toast('老師否決咗，卡保留');
    openModal({ type: 'sheet', id: ui.modal.id });
  },
  confirmYes: () => {
    const fn = ui.modal.onYes;
    ui.modal = null;
    fn();
    renderModal();
  },
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
    confirmBox(`刪除 ${c.name}？`, `會刪除呢班 ${c.students.length} 位學生及分數（紀錄保留）。可以撳「復原」救返。`, () => attempt((s) => L.deleteClass(s, c.id), `刪除班別 ${c.name}`), { yes: '刪除', danger: true });
  },
  removeStudent: (el) => {
    const s = stu(el.dataset.id);
    confirmBox(`刪除 ${s.name}？`, '分數、權重同道具會一併刪除。可以撳「復原」救返。', () => attempt((st) => L.removeStudent(st, s.id), `刪除 ${s.name}`), { yes: '刪除', danger: true });
  },
  exportStats: () => {
    const c = cls();
    downloadFile(`${c.name}-成績-${today()}.csv`, L.statsCSV(state, c.id), 'text/csv;charset=utf-8');
  },
  exportLogs: () => {
    const c = cls();
    const rows = [['時間', '類型', '學生', '內容']];
    for (const e of state.logs.filter((x) => x.classId === c.id)) rows.push([new Date(e.at).toLocaleString('zh-HK'), e.type, e.name || '', L.describeLog(e)]);
    downloadFile(`${c.name}-紀錄-${today()}.csv`, L.toCSV(rows), 'text/csv;charset=utf-8');
  },
  backup: () => downloadFile(`課堂抽問板-備份-${today()}.json`, JSON.stringify(state, null, 1), 'application/json'),
  wipe: () =>
    confirmBox('清除全部資料？', '所有班別、學生、分數同紀錄都會刪除。建議先下載備份。（仍可以撳「復原」一次救返）', () => commit(L.createState(), '清除全部資料'), { yes: '全部清除', danger: true }),
};

function showSummary(ses) {
  const logs = state.logs.filter((e) => e.sessionId === ses.id);
  const answers = logs.filter((e) => e.type === 'answer');
  const correct = answers.filter((e) => e.correct).length;
  const got = answers.filter((e) => e.item).length;
  const used = logs.filter((e) => e.type === 'use-item').length;
  const vol = answers.filter((e) => e.mode === 'volunteer' || e.mode === 'standing').length;
  confirmBox('今堂小結', `答問 <b>${answers.length}</b> 次，答對 <b>${correct}</b> 次（${answers.length ? Math.round((correct / answers.length) * 100) : 0}%）<br>主動舉手 <b>${vol}</b> 次<br>得到道具 <b>${got}</b> 張，用咗 <b>${used}</b> 張`, () => {}, { yes: '好' });
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

$('#modal').addEventListener('click', (ev) => {
  if (ev.target.id === 'modal' && !ui.rolling && !state.session?.question && !['confirmUp', 'reward'].includes(ui.modal?.type)) openModal(null);
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Tab' && ui.modal) {
    const nodes = [...$('#modal').querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]')];
    const first=nodes[0], last=nodes.at(-1);
    if (!first) { ev.preventDefault(); return; }
    if (ev.shiftKey && (document.activeElement===first || document.activeElement.classList.contains('modal'))) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && (document.activeElement===last || document.activeElement.classList.contains('modal'))) { ev.preventDefault(); first.focus(); }
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
        confirmBox('還原備份？', `備份有 ${next.classes.length} 班。目前資料會被取代（可以撳「復原」救返）。`, () => commit(next, '還原備份'), { yes: '還原' });
      } catch {
        toast('呢個唔係有效的備份檔', true);
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
    get state() {
      return state;
    },
    setRng(values) {
      let i = 0;
      rng = () => values[i++ % values.length];
    },
  };
}

render();
