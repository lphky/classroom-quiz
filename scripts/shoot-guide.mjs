// 產生說明書截圖：node scripts/shoot-guide.mjs；之後轉 webp（會自行開測試伺服器，不影響正式資料）
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = fileURLToPath(new URL('../guide/img/', import.meta.url));
const PORT = 4195, BASE = `http://127.0.0.1:${PORT}`;
rmSync('/tmp/cq-manual', { recursive: true, force: true });
const srv = spawn('node', ['server/server.mjs'], { cwd: ROOT, env: { ...process.env, CQ_TEST: '1', CQ_DATA_DIR: '/tmp/cq-manual', PORT: String(PORT), CQ_HOST: '127.0.0.1' }, stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`${BASE}/api/health`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }

const browser = await chromium.launch();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function newPage(viewport, admin = true) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, baseURL: BASE });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  return page;
}
async function fresh(page, admin = true) {
  const r = await page.request.post('/api/test/fresh', { headers: { 'x-cq': '1', 'content-type': 'application/json' }, data: { admin } });
  await page.goto('/?test');
  await page.waitForFunction(() => window.__cq && !document.body.classList.contains('gated'));
}
const shot = (page, name, opts = {}) => page.screenshot({ path: `${OUT}${name}.png`, ...opts });
async function badges(page, list) {
  await page.evaluate((list) => {
    list.forEach(([sel, n]) => {
      const el = typeof sel === 'string' ? document.querySelector(sel) : null;
      const r = el.getBoundingClientRect();
      const b = document.createElement('div'); b.className = 'guide-badge';
      b.textContent = n;
      b.style.cssText = `position:fixed;z-index:99999;left:${r.left - 12}px;top:${r.top - 12}px;width:30px;height:30px;border-radius:50%;background:#e11d48;color:#fff;font:800 16px/30px system-ui;text-align:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)`;
      document.body.appendChild(b);
    });
  }, list);
}
const step = process.argv[2] || 'all';
const D = { width: 1280, height: 800 };

try {
  if (step === 'all' || step === 'a') {
    const p = await newPage(D);
    await p.goto('/'); await wait(1200); await shot(p, '01-login');
    await fresh(p);
    await wait(600); await shot(p, '02-new-class');
    await p.fill('input[name=name]', '3A 中文');
    await p.fill('textarea[name=roster]', '1 陳大文\n2 李小明\n3 張美玲\n4 黃志強\n5 林嘉欣\n6 何家俊');
    await p.click('text=建立班別'); await wait(500);
    await p.click('.tile:has-text("黃志強")'); await wait(400);
    await shot(p, '03-rollcall');
    await p.close();
  }
  if (step === 'all' || step === 'b') {
    const p = await newPage(D);
    await fresh(p);
    await p.getByRole('button', { name: '一鍵體驗 · 12 人測試班' }).click(); await wait(500);
    await p.getByRole('button', { name: '開始上堂' }).click().catch(() => {}); await wait(4500);
    await badges(p, [['.action.hand', 1], ['.action.draw', 2], ['#liveRoster .tile', 3], ['.seg', 4], ['.panel.timer', 5], ['#focusBtn', 6], ['#undoBtn', 7], ['[data-act=endSession]', 8]]);
    await shot(p, '04-classroom');
    await p.evaluate(() => document.querySelectorAll('.guide-badge').forEach((x) => x.remove()));
    await p.evaluate(() => window.__cq.setRng([0.05, 0.05]));
    await p.getByRole('button', { name: /有人舉手/ }).click(); await wait(700);
    await shot(p, '05-handup-pick');
    await p.locator('.modal .tile').filter({ hasText: '林曉嵐' }).click(); await wait(600);
    await shot(p, '06-answer');
    await p.getByRole('button', { name: '答對', exact: true }).click(); await wait(2200);
    await shot(p, '07-reward');
    await p.getByRole('button', { name: '好', exact: true }).click(); await wait(500);
    await p.evaluate(() => window.__cq.setRng([0.5, 0.5, 0.5]));
    await p.getByRole('button', { name: /冇人舉手/ }).click(); await wait(3500);
    await shot(p, '08-draw');
    await p.getByRole('button', { name: /答錯/ }).click(); await wait(900);
    await p.getByRole('button', { name: '好', exact: true }).click().catch(() => {}); await wait(900);
    await p.locator('#liveRoster .tile.standing').first().scrollIntoViewIfNeeded(); await wait(300);
    await shot(p, '09-standing');
    await p.locator('#liveRoster .tile').filter({ hasText: '陳星晴' }).click(); await wait(700);
    await shot(p, '10-backpack');
    await p.keyboard.press('Escape'); await wait(400);
    await p.getByRole('button', { name: '道具圖鑑' }).first().click(); await wait(900);
    await shot(p, '11-cards');
    await p.getByRole('button', { name: '禮物', exact: true }).first().click(); await wait(800);
    await shot(p, '12-gifts');
    await p.getByRole('button', { name: '新增禮物' }).first().click(); await wait(500);
    await p.getByLabel('禮物名稱').fill('珍珠奶茶');
    await p.locator('.pieces-seg label').nth(1).click(); await wait(500);
    await shot(p, '13-gift-form');
    await p.keyboard.press('Escape'); await wait(400);
    await p.getByRole('button', { name: '老師帳戶' }).first().click(); await wait(800);
    for (const [n, u] of [['陳老師', 'teacher.chan'], ['黃老師', 'teacher.wong']]) {
      await p.getByLabel('顯示名稱').fill(n); await p.getByLabel(/登入名稱/).fill(u);
      await p.getByRole('button', { name: '新增老師' }).last().click(); await wait(800);
      await p.keyboard.press('Escape'); await wait(400);
    }
    await shot(p, '14-admin');
    await p.getByRole('button', { name: '課堂', exact: true }).first().click(); await wait(500);
    await p.click('text=落堂'); await wait(400);
    await p.click('.modal >> button:has-text("落堂")'); await wait(1800);
    await shot(p, '15-summary');
    await p.getByRole('button', { name: '好', exact: true }).click().catch(() => {}); await wait(400);
    await p.getByRole('button', { name: '報表' }).first().click(); await wait(800);
    await shot(p, '16-report');
    await p.getByRole('button', { name: '設定' }).first().click(); await wait(800);
    await shot(p, '17-settings');
    await p.close();
  }
  if (step === 'all' || step === 'c') {
    const p = await newPage({ width: 390, height: 844 });
    await fresh(p);
    await p.getByRole('button', { name: '一鍵體驗 · 12 人測試班' }).click(); await wait(500);
    await p.getByRole('button', { name: '開始上堂' }).click().catch(() => {}); await wait(800);
    await p.evaluate(() => window.scrollTo(0, 0)); await wait(500);
    await shot(p, '18-phone');
    await p.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
