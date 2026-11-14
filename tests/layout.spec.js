import {test,expect} from '@playwright/test';
test('主要畫面無水平溢出，導航與作答視窗可操作',async({page},info)=>{
 await page.goto('/?test');
 await page.getByRole('button',{name:'一鍵體驗 · 12 人測試班'}).click();
 await page.getByRole('button',{name:'開始上堂'}).click();
 await page.waitForTimeout(2800);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/${info.project.name}-class.png`,fullPage:true});
 await page.getByRole('button',{name:/有人舉手/}).first().click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/${info.project.name}-dialog.png`,fullPage:true});
 await page.getByRole('button',{name:'關閉',exact:true}).click();
 await page.getByRole('button',{name:'道具圖鑑'}).click();
 await expect(page.locator('.collectible')).toHaveCount(4);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/${info.project.name}-cards.png`,fullPage:true});
});
