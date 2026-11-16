import {test,expect} from '@playwright/test';
import { login, synced } from './helpers.js';
test('搜尋與狀態篩選、參與數據、調低卡與專注投影',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await login(page);
  await page.getByRole('button',{name:'一鍵體驗 · 12 人測試班'}).click();
  await page.getByRole('button',{name:'開始上堂'}).click();
  await page.getByLabel('搜尋學生').fill('陳星晴');
  await expect(page.locator('#liveRoster .tile:visible')).toHaveCount(1);
  await page.locator('#liveRoster .tile:visible').click();
  await page.getByRole('button',{name:'用調低卡'}).click();
  await page.getByRole('button',{name:'使用',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('抽中權重：80');
  await page.getByRole('button',{name:'設為站立'}).click();
  await page.getByRole('button',{name:'關閉',exact:true}).click();
  await page.getByLabel('搜尋學生').fill('沒有這個名字');
  await expect(page.locator('.empty-roster')).toBeVisible();
  await page.getByLabel('搜尋學生').fill('');
  await page.getByRole('button',{name:'站立優先',exact:true}).click();
  await expect(page.locator('#liveRoster .tile:visible')).toHaveCount(1);
  await page.getByRole('button',{name:'有人舉手'}).click();
  await page.locator('.modal .tile').filter({hasText:'陳星晴'}).click();
  await page.getByRole('button',{name:'答對',exact:true}).click();
  await page.getByRole('button',{name:'好',exact:true}).click();
  await expect(page.locator('.pulse strong').nth(0)).toHaveText('100%');
  await expect(page.locator('.pulse strong').nth(1)).toHaveText('1');
  await expect(page.locator('.pulse strong').nth(2)).toHaveText('1 COMBO');
  await expect(page.locator('.empty-roster')).toBeVisible();
  await page.getByRole('button',{name:'全班',exact:true}).click();
  await expect(page.locator('#liveRoster .tile:visible')).toHaveCount(12);
  if(info.project.name==='desktop'){
    await page.getByRole('button',{name:'專注投影',exact:true}).click();
    await expect(page.locator('.top')).toBeHidden();
    await page.getByRole('button',{name:'退出專注模式'}).click();
    await expect(page.locator('.top')).toBeVisible();
  }
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:`test-results/${info.project.name}-playbook.png`,fullPage:true});
});
