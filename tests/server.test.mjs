import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'cq-'));
process.env.CQ_DATA_DIR = dir;
process.env.CQ_ADMIN_USER = 'boss';
process.env.CQ_ADMIN_PASSWORD = 'boss-password';
const { server } = await import('../server/server.mjs');
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', 'x-cq': '1', cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return { status: res.status, data: await res.json().catch(() => null) };
  };
}

test('未登入唔可以讀資料；錯密碼被拒；首位管理員要先改密碼', async () => {
  const c = client();
  assert.equal((await c('GET', '/api/state')).status, 401);
  assert.equal((await c('POST', '/api/login', { username: 'boss', password: 'nope' })).status, 401);
  const r = await c('POST', '/api/login', { username: 'BOSS', password: 'boss-password' });
  assert.equal(r.status, 200);
  assert.equal(r.data.user.isAdmin, true);
  assert.equal(r.data.user.mustChange, true);
  assert.equal((await c('GET', '/api/state')).status, 428);
  assert.equal((await c('POST', '/api/password', { current: 'boss-password', next: 'short' })).status, 400);
  assert.equal((await c('POST', '/api/password', { current: 'boss-password', next: 'boss-new-pass' })).status, 200);
  assert.equal((await c('GET', '/api/state')).data.version, 0);
});

test('冇 x-cq 標頭的寫入請求被拒（防跨站）', async () => {
  const res = await fetch(base + '/api/login', { method: 'POST', body: '{}' });
  assert.equal(res.status, 403);
});

test('管理員加老師；老師之間資料分開；版本衝突回 409', async () => {
  const admin = client();
  await admin('POST', '/api/login', { username: 'boss', password: 'boss-new-pass' });
  const add = await admin('POST', '/api/admin/users', { username: 'miss.chan', name: '陳老師', password: 'chan-password', mustChange: false });
  assert.equal(add.status, 200);
  assert.equal((await admin('POST', '/api/admin/users', { username: 'miss.chan', password: 'xxxxxxxx' })).status, 400);
  assert.equal((await admin('POST', '/api/admin/users', { username: 'Bad Name!', password: 'xxxxxxxx' })).status, 400);

  const chan = client();
  assert.equal((await chan('POST', '/api/login', { username: 'miss.chan', password: 'chan-password' })).status, 200);
  assert.equal((await chan('GET', '/api/admin/users')).status, 403);
  const put = await chan('PUT', '/api/state', { baseVersion: 0, state: { classes: [{ id: 'a', name: '陳老師班', students: [] }] } });
  assert.equal(put.data.version, 1);
  const stale = await chan('PUT', '/api/state', { baseVersion: 0, state: { classes: [] } });
  assert.equal(stale.status, 409);
  assert.equal(stale.data.state.classes[0].name, '陳老師班');
  assert.equal((await admin('GET', '/api/state')).data.state, null);

  const list = await admin('GET', '/api/admin/users');
  assert.equal(list.data.users.find((u) => u.username === 'miss.chan').classes, 1);

  // 升做管理員、停用即時登出、刪除
  const id = add.data.user.id;
  assert.equal((await admin('PATCH', `/api/admin/users/${id}`, { isAdmin: true })).data.user.isAdmin, true);
  assert.equal((await chan('GET', '/api/admin/users')).status, 200);
  assert.equal((await admin('PATCH', `/api/admin/users/${id}`, { disabled: true })).status, 200);
  assert.equal((await chan('GET', '/api/me')).status, 401);
  assert.equal((await client()('POST', '/api/login', { username: 'miss.chan', password: 'chan-password' })).status, 403);
  assert.equal((await admin('DELETE', `/api/admin/users/${id}`)).status, 200);
  assert.equal((await client()('POST', '/api/login', { username: 'miss.chan', password: 'chan-password' })).status, 401);
});

test('最少保留一位管理員；不可以停用或刪除自己；重設密碼要對方再改', async () => {
  const admin = client();
  const me = (await admin('POST', '/api/login', { username: 'boss', password: 'boss-new-pass' })).data.user;
  assert.equal((await admin('PATCH', `/api/admin/users/${me.id}`, { isAdmin: false })).status, 400);
  assert.equal((await admin('PATCH', `/api/admin/users/${me.id}`, { disabled: true })).status, 400);
  assert.equal((await admin('DELETE', `/api/admin/users/${me.id}`)).status, 400);
  const t = (await admin('POST', '/api/admin/users', { username: 'mr.lee', password: 'lee-password', mustChange: false })).data.user;
  assert.equal((await admin('PATCH', `/api/admin/users/${t.id}`, { password: 'reset-pass-1' })).data.user.mustChange, true);
  const lee = client();
  assert.equal((await lee('POST', '/api/login', { username: 'mr.lee', password: 'reset-pass-1' })).data.user.mustChange, true);
});

test('連續錯密碼會暫時鎖定', async () => {
  const c = client();
  for (let i = 0; i < 8; i++) await c('POST', '/api/login', { username: 'boss', password: 'wrong' });
  assert.equal((await c('POST', '/api/login', { username: 'boss', password: 'boss-new-pass' })).status, 429);
});

test('只提供網站檔案，不會外露資料夾', async () => {
  assert.equal((await fetch(base + '/')).status, 200);
  assert.equal((await fetch(base + '/js/logic.mjs')).status, 200);
  assert.equal((await fetch(base + '/data/users.json')).status, 404);
  assert.equal((await fetch(base + '/server/server.mjs')).status, 404);
  assert.equal((await fetch(base + '/package.json')).status, 404);
  assert.equal((await fetch(base + '/js/../server/server.mjs')).status, 404);
});
