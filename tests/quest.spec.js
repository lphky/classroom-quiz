import {test,expect} from '@playwright/test';
test('測試班、圖鑑、合作任務及倒數',async({page})=>{
 await page.goto('/?test');
 await page.getByRole('button',{name:'一鍵體驗 · 12 人測試班'}).click();
 await expect(page.locator('.tile')).toHaveCount(12);
 await page.getByRole('button',{name:'開始上堂'}).click();
 await expect(page.locator('progress')).toHaveAttribute('value','0');
 await page.getByRole('button',{name:'開始倒數'}).click();
 await expect(page.locator('#questClock')).not.toHaveText('30');
 await page.getByRole('button',{name:'重設 30 秒'}).click();
 await expect(page.locator('#questClock')).toHaveText('30');
 await page.getByRole('button',{name:'道具圖鑑'}).click();
 await expect(page.locator('.collectible')).toHaveCount(4);
 const data=await page.evaluate(()=>window.__cq.state);
 expect(data.classes[0].students.every(s=>Object.values(s.items).every(n=>n===1))).toBeTruthy();
 await page.reload();
 await expect(page.locator('.tile')).toHaveCount(12);
});
