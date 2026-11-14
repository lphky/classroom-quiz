# 課堂抽問板 classroom-quiz

- GitHub `lphky/classroom-quiz`，main 根目錄 GitHub Pages：https://lphky.github.io/classroom-quiz/ 。用 lphky 帳戶推送（`GH_TOKEN=$(gh auth token -u lphky)`），不要切換全域 active 帳戶。
- 純前端 ES Modules；規則只改 `js/logic.mjs`（純函數、不可變 state），UI 在 `js/app.mjs`，localStorage 前綴 `classroom-quiz:`。
- 規則設計見 DESIGN.md（用戶 2026-11-14 已確認第一版做法：站立者答對不得道具、指定卡只可指定坐低者、調高卡需老師批准）。
- `?test` 開放 `window.__cq`（state、setRng）。改動後執行 `npm test`（node 單元測試 + Playwright 三種尺寸）。
- 測試伺服器用 `scripts/serve.mjs`（python http.server 在此環境會卡死）。

- 現行視覺：深墨藍／亮青檸 Classroom Playbook；700px 以下底部導航，電腦支援專注投影。css/style.css 為完整樣式；卡牌及導航 SVG 在 app.mjs。課堂搜尋／狀態篩選只改顯示，不影響抽人名單；即時數據與 COMBO 不改計分。tests/playbook.spec.js 驗證新增流程；tests/layout.spec.js 驗證三尺寸布局與截圖。test-data/demo-backup.json 為虛構測試備份。
