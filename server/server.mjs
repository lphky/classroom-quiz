import { createServer } from 'node:http';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, randomBytes, timingSafeEqual, createHash, randomUUID } from 'node:crypto';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA = resolve(process.env.CQ_DATA_DIR || join(ROOT, 'data'));
const PORT = Number(process.env.PORT || 4192);
const HOST = process.env.CQ_HOST || '0.0.0.0';
const TEST = process.env.CQ_TEST === '1';
const SESSION_DAYS = 30;
const MAX_BODY = 8 * 1024 * 1024;
const COOKIE = 'cq_session';
const STATIC_DIRS = ['css', 'js', 'assets', 'test-data', 'guide'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.pdf': 'application/pdf' };

mkdirSync(join(DATA, 'states'), { recursive: true });
mkdirSync(join(DATA, 'archive'), { recursive: true });

function atomicWriteSync(file, data) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}
async function atomicWrite(file, data) {
  const tmp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, file);
}
const readJSON = (file, fallback) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};

const USERS_FILE = join(DATA, 'users.json');
const SESS_FILE = join(DATA, 'sessions.json');
let users = readJSON(USERS_FILE, []);
let sessions = readJSON(SESS_FILE, {});
const saveUsers = () => atomicWriteSync(USERS_FILE, JSON.stringify(users, null, 1));
let sessTimer;
const saveSessions = (now = false) => {
  clearTimeout(sessTimer);
  if (now) return atomicWriteSync(SESS_FILE, JSON.stringify(sessions));
  sessTimer = setTimeout(() => atomicWriteSync(SESS_FILE, JSON.stringify(sessions)), 1500);
};

export function hashPassword(pw, salt = randomBytes(16).toString('hex')) {
  return { salt, hash: scryptSync(String(pw), salt, 64).toString('hex') };
}
function checkPassword(u, pw) {
  const a = Buffer.from(scryptSync(String(pw), u.salt, 64).toString('hex'));
  const b = Buffer.from(u.hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
const sha = (t) => createHash('sha256').update(t).digest('hex');
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,31}$/;

export function validatePassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return '密碼最少 8 個字元';
  if (pw.length > 128) return '密碼太長';
  return null;
}

export function createUser({ username, name, password, isAdmin = false, mustChange = false }) {
  username = String(username || '').trim().toLowerCase();
  if (!USERNAME_RE.test(username)) throw new Error('登入名稱只可用 2–32 個英文小寫、數字、點、底線或減號');
  if (users.some((u) => u.username === username)) throw new Error('登入名稱已經有人用');
  const bad = validatePassword(password);
  if (bad) throw new Error(bad);
  const u = { id: randomUUID(), username, name: String(name || username).trim().slice(0, 30) || username, ...hashPassword(password), isAdmin: !!isAdmin, disabled: false, mustChange: !!mustChange, createdAt: new Date().toISOString(), lastLogin: null };
  users.push(u);
  saveUsers();
  return u;
}

const publicUser = (u) => ({ id: u.id, username: u.username, name: u.name, isAdmin: u.isAdmin, disabled: u.disabled, mustChange: u.mustChange, createdAt: u.createdAt, lastLogin: u.lastLogin });
const activeAdmins = () => users.filter((u) => u.isAdmin && !u.disabled);

function bootstrap() {
  if (users.length) return;
  const user = process.env.CQ_ADMIN_USER;
  const pass = process.env.CQ_ADMIN_PASSWORD;
  if (user && pass) {
    createUser({ username: user, name: process.env.CQ_ADMIN_NAME || '管理員', password: pass, isAdmin: true, mustChange: !TEST });
    console.log(`created first admin: ${user}`);
  } else console.warn('No users yet. Run: node server/admin-cli.mjs create <username> <password> --admin');
}
bootstrap();

const failures = new Map();
function rateLimited(key) {
  const f = failures.get(key);
  if (!f) return false;
  if (Date.now() - f.first > 15 * 60e3) {
    failures.delete(key);
    return false;
  }
  return f.count >= 8;
}
function noteFailure(key) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > 15 * 60e3) failures.set(key, { first: Date.now(), count: 1 });
  else f.count++;
}

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
const isHttps = (req) => String(req.headers['x-forwarded-proto'] || '').includes('https');
function sessionCookie(req, token, maxAge) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;
}

function currentUser(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const key = sha(token);
  const s = sessions[key];
  if (!s || s.exp < Date.now()) {
    if (s) {
      delete sessions[key];
      saveSessions();
    }
    return null;
  }
  const u = users.find((x) => x.id === s.userId);
  if (!u || u.disabled) return null;
  if (s.exp - Date.now() < (SESSION_DAYS - 1) * 864e5) {
    s.exp = Date.now() + SESSION_DAYS * 864e5;
    saveSessions();
  }
  return { user: u, key };
}

function startSession(req, res, u) {
  const token = randomBytes(32).toString('base64url');
  sessions[sha(token)] = { userId: u.id, exp: Date.now() + SESSION_DAYS * 864e5, at: new Date().toISOString() };
  for (const [k, v] of Object.entries(sessions)) if (v.exp < Date.now()) delete sessions[k];
  saveSessions(true);
  res.setHeader('set-cookie', sessionCookie(req, token, SESSION_DAYS * 86400));
}
function dropSessionsOf(userId, exceptKey = null) {
  for (const [k, v] of Object.entries(sessions)) if (v.userId === userId && k !== exceptKey) delete sessions[k];
  saveSessions(true);
}

const send = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
};
const err = (res, code, msg) => send(res, code, { error: msg });

async function body(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw Object.assign(new Error('資料太大'), { code: 413 });
    chunks.push(c);
  }
  if (!size) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('格式錯誤'), { code: 400 });
  }
}

const stateFile = (userId) => join(DATA, 'states', `${userId.replace(/[^a-z0-9-]/gi, '')}.json`);
const locks = new Map();
async function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  let release;
  const next = new Promise((r) => (release = r));
  locks.set(key, prev.then(() => next));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === next) locks.delete(key);
  }
}
async function readState(userId) {
  try {
    return JSON.parse(await readFile(stateFile(userId), 'utf8'));
  } catch {
    return { version: 0, updatedAt: null, state: null };
  }
}

async function api(req, res, path) {
  const method = req.method;
  if (method !== 'GET' && method !== 'HEAD' && req.headers['x-cq'] !== '1') return err(res, 403, '請求被拒絕');
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  if (path === '/api/health') return send(res, 200, { ok: true });

  if (path === '/api/login' && method === 'POST') {
    const { username, password } = await body(req);
    const name = String(username || '').trim().toLowerCase();
    const key = `${ip}|${name}`;
    if (rateLimited(key)) return err(res, 429, '嘗試次數太多，請 15 分鐘後再試');
    const u = users.find((x) => x.username === name);
    if (!u || !checkPassword(u, password || '')) {
      noteFailure(key);
      return err(res, 401, '登入名稱或密碼不正確');
    }
    if (u.disabled) return err(res, 403, '此帳戶已停用，請聯絡管理員');
    failures.delete(key);
    u.lastLogin = new Date().toISOString();
    saveUsers();
    startSession(req, res, u);
    return send(res, 200, { user: publicUser(u) });
  }

  if (TEST && path === '/api/test/fresh' && method === 'POST') {
    const { admin } = await body(req);
    const u = createUser({ username: `t${randomBytes(5).toString('hex')}`, name: '測試老師', password: 'test-password', isAdmin: !!admin });
    startSession(req, res, u);
    return send(res, 200, { user: publicUser(u) });
  }

  const cur = currentUser(req);
  if (path === '/api/logout' && method === 'POST') {
    if (cur) {
      delete sessions[cur.key];
      saveSessions(true);
    }
    res.setHeader('set-cookie', sessionCookie(req, '', 0));
    return send(res, 200, { ok: true });
  }
  if (!cur) return err(res, 401, '請先登入');
  const me = cur.user;

  if (path === '/api/me' && method === 'GET') return send(res, 200, { user: publicUser(me) });

  if (path === '/api/password' && method === 'POST') {
    const { current, next } = await body(req);
    if (!checkPassword(me, current || '')) return err(res, 400, '現有密碼不正確');
    const bad = validatePassword(next);
    if (bad) return err(res, 400, bad);
    if (next === current) return err(res, 400, '新密碼不可以同舊密碼一樣');
    Object.assign(me, hashPassword(next), { mustChange: false });
    saveUsers();
    dropSessionsOf(me.id, cur.key);
    return send(res, 200, { user: publicUser(me) });
  }

  if (path === '/api/profile' && method === 'POST') {
    const { name } = await body(req);
    const n = String(name || '').trim().slice(0, 30);
    if (!n) return err(res, 400, '請輸入顯示名稱');
    me.name = n;
    saveUsers();
    return send(res, 200, { user: publicUser(me) });
  }

  if (path === '/api/state') {
    if (me.mustChange) return err(res, 428, '請先更改密碼');
    if (method === 'GET') return send(res, 200, await readState(me.id));
    if (method === 'PUT') {
      const { baseVersion, state } = await body(req);
      if (!state || typeof state !== 'object' || !Array.isArray(state.classes)) return err(res, 400, '資料格式不正確');
      return withLock(me.id, async () => {
        const cur = await readState(me.id);
        if (Number(baseVersion) !== cur.version) return send(res, 409, cur);
        const doc = { version: cur.version + 1, updatedAt: new Date().toISOString(), state };
        await atomicWrite(stateFile(me.id), JSON.stringify(doc));
        if (doc.version % 50 === 1) await atomicWrite(join(DATA, 'archive', `${me.id}-v${doc.version}.json`), JSON.stringify(doc)).catch(() => {});
        return send(res, 200, { version: doc.version, updatedAt: doc.updatedAt });
      });
    }
  }

  if (path.startsWith('/api/admin/')) {
    if (!me.isAdmin) return err(res, 403, '只限管理員');
    if (path === '/api/admin/users' && method === 'GET') {
      const out = [];
      for (const u of users) {
        const st = await readState(u.id);
        out.push({ ...publicUser(u), classes: st.state?.classes?.length || 0, students: (st.state?.classes || []).reduce((n, c) => n + (c.students?.length || 0), 0), updatedAt: st.updatedAt });
      }
      return send(res, 200, { users: out });
    }
    if (path === '/api/admin/users' && method === 'POST') {
      const b = await body(req);
      try {
        const u = createUser({ username: b.username, name: b.name, password: b.password, isAdmin: !!b.isAdmin, mustChange: b.mustChange !== false });
        return send(res, 200, { user: publicUser(u) });
      } catch (e) {
        return err(res, 400, e.message);
      }
    }
    const m = path.match(/^\/api\/admin\/users\/([a-f0-9-]{36})$/);
    if (m) {
      const u = users.find((x) => x.id === m[1]);
      if (!u) return err(res, 404, '找不到帳戶');
      if (method === 'PATCH') {
        const b = await body(req);
        if (b.isAdmin === false && u.isAdmin && !u.disabled && activeAdmins().length <= 1) return err(res, 400, '最少要保留一位管理員');
        if (b.disabled === true && u.id === me.id) return err(res, 400, '不可以停用自己');
        if (b.disabled === true && u.isAdmin && !u.disabled && activeAdmins().length <= 1) return err(res, 400, '最少要保留一位管理員');
        if (b.name != null) {
          const n = String(b.name).trim().slice(0, 30);
          if (!n) return err(res, 400, '請輸入顯示名稱');
          u.name = n;
        }
        if (b.isAdmin != null) u.isAdmin = !!b.isAdmin;
        if (b.disabled != null) {
          u.disabled = !!b.disabled;
          if (u.disabled) dropSessionsOf(u.id);
        }
        if (b.password != null) {
          const bad = validatePassword(b.password);
          if (bad) return err(res, 400, bad);
          Object.assign(u, hashPassword(b.password), { mustChange: true });
          dropSessionsOf(u.id, u.id === me.id ? cur.key : null);
        }
        saveUsers();
        return send(res, 200, { user: publicUser(u) });
      }
      if (method === 'DELETE') {
        if (u.id === me.id) return err(res, 400, '不可以刪除自己');
        if (u.isAdmin && !u.disabled && activeAdmins().length <= 1) return err(res, 400, '最少要保留一位管理員');
        users = users.filter((x) => x.id !== u.id);
        saveUsers();
        dropSessionsOf(u.id);
        if (existsSync(stateFile(u.id))) await rename(stateFile(u.id), join(DATA, 'archive', `deleted-${u.username}-${u.id}-${Date.now()}.json`));
        return send(res, 200, { ok: true });
      }
    }
  }
  return err(res, 404, '找不到');
}

async function serveStatic(req, res, path) {
  if (path === '/' || path === '/index.html') path = '/index.html';
  else if (path === '/guide') return res.writeHead(301, { location: '/guide/' }).end();
  else {
    if (path.endsWith('/')) path += 'index.html';
    const top = path.split('/')[1];
    if (!STATIC_DIRS.includes(top)) return res.writeHead(404).end('not found');
  }
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    const data = await readFile(file);
    const long = path.startsWith('/assets/');
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] || 'application/octet-stream',
      'cache-control': long ? 'public, max-age=86400' : 'no-cache',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'same-origin',
      ...(path === '/index.html' ? { 'x-frame-options': 'SAMEORIGIN' } : {}),
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404).end('not found');
  }
}

export const server = createServer(async (req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return res.writeHead(400).end();
  }
  try {
    if (path.startsWith('/api/')) return await api(req, res, path);
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end();
    return await serveStatic(req, res, path);
  } catch (e) {
    if (!res.headersSent) err(res, e.code && Number.isInteger(e.code) ? e.code : 500, e.code ? e.message : '伺服器錯誤');
    if (!e.code) console.error(e);
  }
});

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => console.log(`課堂冒險局 http://${HOST}:${PORT}/ data=${DATA}`));
  const flush = () => {
    try {
      atomicWriteSync(SESS_FILE, JSON.stringify(sessions));
    } catch {}
    process.exit(0);
  };
  process.on('SIGTERM', flush);
  process.on('SIGINT', flush);
}
