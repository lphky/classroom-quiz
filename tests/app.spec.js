import { test, expect } from '@playwright/test';
import { login, synced } from './helpers.js';

test('完整一堂：點名、舉手抽卡、抽人、免答卡、罰站、復原、落堂、報表', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page);

  await page.fill('input[name=name]', '3A 中文');
  await page.fill('textarea[name=roster]', '1 陳大文\n2 李小明\n3 張美玲\n4 黃志強');
  await page.click('text=建立班別');
  await expect(page.locator('h2')).toContainText('點名');

  await page.click('.tile:has-text("黃志強")');
  await expect(page.locator('.tile:has-text("黃志強")')).toContainText('缺席');
  await page.click('text=開始上堂');
  await expect(page.locator('text=可抽 3 人')).toBeVisible();

  await page.evaluate(() => window.__cq.setRng([0]));
  await page.click('text=有人舉手');
  await page.click('.modal .tile:has-text("陳大文")');
  await page.getByRole('button',{name:'答對',exact:true}).click();
  await expect(page.locator('.card-flip')).toContainText('免答卡');
  await page.click('.modal >> text=好');
  await expect(page.locator('.tile:has-text("陳大文")')).toContainText('2分');

  await page.click('text=冇人舉手，抽人');
  await expect(page.locator('.roll.done')).toHaveText('陳大文');
  await page.click('text=用免答卡');
  await expect(page.locator('.roll.done')).toHaveText('李小明');
  await page.click('text=答錯（罰站）');
  await page.click('.modal >> text=好');
  await expect(page.locator('.tile:has-text("李小明")')).toHaveClass(/standing/);

  await page.click('text=有人舉手');
  await expect(page.locator('.modal .prio')).toBeVisible();
  await page.click('.modal .tile:has-text("李小明")');
  await page.getByRole('button',{name:'答對',exact:true}).click();
  await expect(page.locator('.modal')).toContainText('坐返低');
  await page.click('.modal >> text=好');
  await expect(page.locator('.tile:has-text("李小明")')).toHaveClass(/seated/);

  await page.click('#undoBtn');
  await expect(page.locator('.tile:has-text("李小明")')).toHaveClass(/standing/);

  await page.click('text=落堂');
  await page.click('.modal >> button:has-text("落堂")');
  await expect(page.locator('.modal')).toContainText('今堂小結');
  await page.click('.modal >> text=好');

  await page.click('.tab:has-text("報表")');
  await expect(page.locator('table')).toContainText('陳大文');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=下載成績 (CSV)')]);
  expect(dl.suggestedFilename()).toContain('成績');

  await synced(page);
  await page.reload();
  await page.click('.tab:has-text("報表")');
  await expect(page.locator('table tbody tr').first()).toContainText('陳大文');
  expect(errors).toEqual([]);
});

test('指定同學卡及調高卡（老師否決/批准）', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page);
  await page.fill('input[name=name]', '4B');
  await page.fill('textarea[name=roster]', '甲\n乙\n丙');
  await page.click('text=建立班別');
  await page.click('.tab:has-text("學生")');
  const row = page.locator('tr:has(input[value="甲"])');
  await row.locator('input[data-field="item:designate"]').fill('1');
  await row.locator('input[data-field="item:designate"]').blur();
  await row.locator('input[data-field="item:up"]').fill('1');
  await row.locator('input[data-field="item:up"]').blur();
  await page.click('.tab:has-text("課堂")');
  await page.click('text=開始上堂');

  await page.click('.tile:has-text("甲")');
  await page.click('text=用調高卡');
  await page.click('.modal .tile:has-text("丙")');
  await page.click('.modal button:has-text("否決")');
  await expect(page.locator('.modal')).toContainText('機率卡（調高） × 1');
  await page.click('text=用調高卡');
  await page.click('.modal .tile:has-text("丙")');
  await page.click('.modal button:has-text("批准")');
  await page.click('.modal >> text=關閉');

  await page.evaluate(() => window.__cq.setRng([0]));
  await page.click('text=冇人舉手，抽人');
  await expect(page.locator('.roll.done')).toHaveText('甲');
  await page.click('text=用指定同學卡');
  await page.click('.modal .tile:has-text("乙")');
  await expect(page.locator('.modal h2')).toContainText('甲 指定');
  await expect(page.locator('.modal button:has-text("用指定同學卡")')).toHaveCount(0);
  await page.click('text=答錯（罰站）');
  await page.click('.modal >> text=好');
  await expect(page.locator('.tile:has-text("乙")')).toHaveClass(/standing/);
  const w = await page.evaluate(() => window.__cq.state.classes[0].students.find((s) => s.name === '丙').weight);
  expect(w).toBe(120);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});
