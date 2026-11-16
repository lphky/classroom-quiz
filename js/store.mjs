import { normalizeState } from './logic.mjs';

export const UNDO_MAX = 30;
const LEGACY_KEY = 'classroom-quiz:state';

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', accept: 'application/json', 'x-cq': '1' },
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive: method === 'PUT' && JSON.stringify(body || '').length < 60000,
    });
  } catch {
    throw new ApiError(0, '連唔到伺服器，請檢查網絡');
  }
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new ApiError(res.status === 404 ? -1 : res.status, '伺服器回應異常');
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data.error || '發生錯誤', data);
  return data;
}

export const legacyBackup = () => {
  try {
    return localStorage.getItem(LEGACY_KEY);
  } catch {
    return null;
  }
};

const undoKey = (uid) => `classroom-quiz:undo:${uid}`;
export function loadUndo(uid) {
  try {
    const u = JSON.parse(localStorage.getItem(undoKey(uid)));
    return Array.isArray(u) ? u : [];
  } catch {
    return [];
  }
}
function saveUndo(uid, undo) {
  try {
    localStorage.setItem(undoKey(uid), JSON.stringify(undo.slice(-UNDO_MAX)));
  } catch {
    try {
      localStorage.setItem(undoKey(uid), JSON.stringify(undo.slice(-5)));
    } catch {}
  }
}
export const clearUndo = (uid) => {
  try {
    localStorage.removeItem(undoKey(uid));
  } catch {}
};

export async function loadRemote() {
  const doc = await api('GET', '/api/state');
  return { version: doc.version, state: normalizeState(doc.state) };
}

// 每次改動即排程上傳；同一時間只送一個請求，送完再送最新版本。
export function createSync({ uid, version, onStatus, onConflict }) {
  let base = version;
  let pending = null;
  let inflight = false;
  let timer = null;
  let retry = 0;

  const status = (s) => onStatus?.(s);

  async function flush() {
    timer = null;
    if (inflight || !pending) return;
    const body = pending;
    pending = null;
    inflight = true;
    status('saving');
    try {
      const r = await api('PUT', '/api/state', { baseVersion: base, state: body });
      base = r.version;
      retry = 0;
      status(pending ? 'saving' : 'saved');
    } catch (e) {
      if (e.status === 409) {
        base = e.data.version;
        pending = null;
        onConflict?.(normalizeState(e.data.state), e.data.version);
        status('saved');
      } else if (e.status === 401 || e.status === 428) {
        pending = pending || body;
        status('auth');
      } else {
        pending = pending || body;
        retry = Math.min(retry + 1, 6);
        status('offline');
        timer = setTimeout(flush, 1000 * 2 ** retry);
      }
    } finally {
      inflight = false;
      if (pending && !timer) timer = setTimeout(flush, 250);
    }
  }

  return {
    save(state, undo) {
      pending = state;
      saveUndo(uid, undo);
      status('saving');
      clearTimeout(timer);
      timer = setTimeout(flush, 350);
    },
    flushNow() {
      clearTimeout(timer);
      return flush();
    },
    get base() {
      return base;
    },
    get dirty() {
      return !!pending || inflight;
    },
    setBase(v) {
      base = v;
    },
  };
}
