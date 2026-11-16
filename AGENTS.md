# 課堂抽問板 classroom-quiz

- GitHub `lphky/classroom-quiz`，main 根目錄 GitHub Pages：https://lphky.github.io/classroom-quiz/ 。用 lphky 帳戶推送（`GH_TOKEN=$(gh auth token -u lphky)`），不要切換全域 active 帳戶。
- 純前端 ES Modules；規則只改 `js/logic.mjs`（純函數、不可變 state），UI 在 `js/app.mjs`，localStorage 前綴 `classroom-quiz:`。
- 規則設計見 DESIGN.md（用戶 2026-11-14 已確認第一版做法：站立者答對不得道具、指定卡只可指定坐低者、調高卡需老師批准）。
- `?test` 開放 `window.__cq`（state、setRng）。改動後執行 `npm test`（node 單元測試 + Playwright 三種尺寸）。
- 測試伺服器用 `scripts/serve.mjs`（python http.server 在此環境會卡死）。

- 現行視覺（2026-11-16 重做）：淺色應用程式風格，900px 以下底部導航；按鈕只用 app.mjs 內 `P` 線條 SVG 圖示，不用 emoji（tests/motion.spec.js 檢查）。道具為 `gameCard()` 遊戲卡牌，插畫 `assets/cards/*.webp`（AI 生成，540px）；動畫：`cardFx` 出卡、`.card-flip` 抽卡翻牌、`burst` 粒子、按鈕 ripple，全部受 reduceMotion／設定動畫開關控制。css/style.css 為完整樣式。課堂搜尋／篩選只改顯示；即時數據與 COMBO 不改計分。測試避免同一文字出現兩次（Playwright text= 為嚴格匹配）。test-data/demo-backup.json 為虛構測試備份。
