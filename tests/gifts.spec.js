import { test, expect } from '@playwright/test';
import { login, synced } from './helpers.js';

test('老師自訂禮物：分 2 張碎片、抽中 1/2 及 2/2、集齊換領', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await login(page);
  await page.getByRole('button', { name: '一鍵體驗 · 12 人測試班' }).click();
  await page.getByRole('button', { name: '禮物', exact: true }).click();
  await expect(page.locator('.gift-item')).toHaveCount(3);
  await expect(page.locator('.ready-row')).toHaveCount(2);
  await expect(page.locator('.ready-panel')).toContainText('陳星晴');
  await page.screenshot({ path: `test-results/${info.project.name}-gifts.png`, fullPage: true });

  await page.getByRole('button', { name: '新增禮物' }).first().click();
  await page.getByLabel('禮物名稱').fill('雪糕');
  await page.locator('.pieces-seg label').nth(3).click();
  await expect(page.locator('#giftPreview')).toContainText('雪糕 4/4');
  await page.locator('.pieces-seg label').nth(1).click();
  await expect(page.locator('#giftPreview')).toContainText('雪糕 2/2');
  await page.getByLabel('抽中比重').fill('400');
  await page.getByLabel(/可換份數/).fill('1');
  await page.screenshot({ path: `test-results/${info.project.name}-gift-form.png`, fullPage: true });
  await page.getByRole('dialog').getByRole('button', { name: '新增禮物' }).click();
  await expect(page.locator('.gift-item')).toHaveCount(4);

  await page.getByRole('button', { name: '課堂', exact: true }).click();
  await page.getByRole('button', { name: '開始上堂' }).click();
  // 總比重 100 + 12 + 6 + 8 + 400 = 526；0.9 落喺雪糕
  await page.evaluate(() => window.__cq.setRng([0.9, 0]));
  await page.getByRole('button', { name: /有人舉手/ }).click();
  await page.locator('.modal .tile').filter({ hasText: '何宇澄' }).click();
  await page.getByRole('button', { name: '答對', exact: true }).click();
  await expect(page.locator('.card-flip')).toContainText('雪糕 1/2');
  await expect(page.locator('.frag-track')).toContainText('1 / 2 片');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `test-results/${info.project.name}-gift-reward.png`, fullPage: true });
  await page.getByRole('button', { name: '好', exact: true }).click();

  await page.evaluate(() => window.__cq.setRng([0.9, 0.99]));
  await page.getByRole('button', { name: /有人舉手/ }).click();
  await page.locator('.modal .tile').filter({ hasText: '何宇澄' }).click();
  await page.getByRole('button', { name: '答對', exact: true }).click();
  await expect(page.locator('.card-flip')).toContainText('雪糕 2/2');
  await page.getByRole('button', { name: /即刻換領/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '換領', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('何宇澄 換領咗「雪糕」');
  await expect(page.locator('.fx-stage.redeem')).toBeVisible();
  await expect(page.locator('.fx-stage')).toHaveCount(0, { timeout: 5000 });

  const st = await page.evaluate(() => {
    const s = window.__cq.state;
    const g = s.gifts.find((x) => x.name === '雪糕');
    return { stock: g.stock, frags: s.classes[0].students.find((x) => x.name === '何宇澄').frags[g.id] };
  });
  expect(st).toEqual({ stock: 0, frags: undefined });

  await page.locator('#liveRoster .tile').filter({ hasText: '李浩然' }).click();
  await expect(page.getByRole('dialog')).toContainText('禮物碎片');
  await page.getByRole('button', { name: '老師調整' }).click();
  await page.getByRole('button', { name: '增加 珍珠奶茶 2/2' }).click();
  await page.getByRole('button', { name: '完成調整' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '換領' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '換領', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('未有禮物碎片');
  await page.getByRole('button', { name: '關閉', exact: true }).click();

  await page.getByRole('button', { name: '報表' }).click();
  await expect(page.locator('.log')).toContainText('李浩然 集齊並換領「珍珠奶茶」');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await synced(page);
  await page.reload();
  await page.getByRole('button', { name: '禮物', exact: true }).click();
  await expect(page.locator('.gift-item').filter({ hasText: '雪糕' })).toContainText('暫停');
  expect(errors).toEqual([]);
});
