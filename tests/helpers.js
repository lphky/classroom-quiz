export async function login(page, { admin = false, path = '/?test' } = {}) {
  const r = await page.request.post('/api/test/fresh', { headers: { 'x-cq': '1', 'content-type': 'application/json' }, data: { admin } });
  if (!r.ok()) throw new Error(`fresh login failed ${r.status()}`);
  await page.goto(path);
  await page.waitForFunction(() => window.__cq && !document.body.classList.contains('gated'));
  return (await r.json()).user;
}
export const synced = (page) => page.waitForFunction(() => window.__cq?.synced);
