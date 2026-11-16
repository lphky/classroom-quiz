import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test('登入閘、管理員新增老師、首次改密碼、資料分開', async ({ page, browser }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible();
  await expect(page.locator('.shell')).toBeHidden();
  await page.getByLabel('登入名稱').fill('nobody');
  await page.getByLabel('密碼').fill('wrong-password');
  await page.getByRole('button', { name: '登入' }).click();
  await expect(page.locator('.form-err')).toContainText('不正確');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: `test-results/${info.project.name}-login.png`, fullPage: true });

  await login(page, { admin: true });
  await page.getByRole('button', { name: '一鍵體驗 · 12 人測試班' }).click();
  await expect(page.locator('.tile')).toHaveCount(12);
  await page.getByRole('button', { name: '老師帳戶' }).click();
  await expect(page.locator('.acct-row').first()).toBeVisible();
  const username = `${info.project.name}.${Date.now().toString(36)}`;
  await page.getByLabel('顯示名稱').fill('陳老師');
  await page.getByLabel(/登入名稱/).fill(username);
  await page.getByRole('button', { name: '新增老師' }).click();
  await expect(page.getByRole('dialog')).toContainText('已新增 陳老師');
  const temp = await page.locator('.cred dd').nth(2).innerText();
  await page.screenshot({ path: `test-results/${info.project.name}-admin.png`, fullPage: true });
  await page.getByRole('button', { name: '完成' }).click();
  await expect(page.locator(`.acct-row[data-user="${username}"]`)).toContainText('待改密碼');

  const ctx = await browser.newContext({ baseURL: new URL(page.url()).origin, viewport: page.viewportSize() });
  const p2 = await ctx.newPage();
  p2.on('pageerror', (e) => errors.push(e.message));
  await p2.goto('/?test');
  await p2.getByLabel('登入名稱').fill(username.toUpperCase());
  await p2.getByLabel('密碼').fill(temp);
  await p2.getByRole('button', { name: '登入' }).click();
  await expect(p2.getByRole('heading', { name: '設定你的密碼' })).toBeVisible();
  await p2.getByLabel('臨時密碼').fill(temp);
  await p2.getByLabel(/^新密碼/).fill('my-own-secret');
  await p2.getByLabel('再輸入新密碼').fill('my-own-secret');
  await p2.getByRole('button', { name: '儲存並進入' }).click();
  await expect(p2.getByRole('button', { name: /一鍵體驗/ })).toBeVisible();
  await expect(p2.getByRole('button', { name: '老師帳戶' })).toHaveCount(0);
  await expect(p2.locator('#syncPill')).toContainText('已儲存');

  await p2.getByRole('button', { name: '我的帳戶' }).click();
  await expect(p2.getByRole('dialog')).toContainText('陳老師');
  await p2.getByRole('button', { name: '登出' }).click();
  await expect(p2.getByRole('heading', { name: '歡迎回來' })).toBeVisible();
  await ctx.close();

  await page.locator(`.acct-row[data-user="${username}"]`).getByRole('button', { name: '設為管理員' }).click();
  await expect(page.locator(`.acct-row[data-user="${username}"]`)).toContainText('管理員');
  await page.locator(`.acct-row[data-user="${username}"]`).getByRole('button', { name: '停用' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '停用' }).click();
  await expect(page.locator(`.acct-row[data-user="${username}"]`)).toContainText('已停用');
  expect(errors).toEqual([]);
});
