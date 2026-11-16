# 課堂抽問板 classroom-quiz

- 2026-11-16 起為老師登入版，正式網址 https://classroom-quiz-porscheyeung.zocomputer.io/ （Zo 服務 `classroom-quiz`，svc_UqMpOin3ru8，port 18794，`node server/server.mjs`）。資料在 `data/`（不入 Git，勿刪；帳戶以 scrypt 雜湊）。GitHub Pages 舊網址無伺服器，app 偵測不到 `/api` 會顯示「前往新版」及下載舊 localStorage 備份。
- 帳戶：管理員可加減老師／重設密碼／停用／設管理員，最少保留一位管理員。新增首位管理員用 `server/admin-cli.mjs`（先停服務，因伺服器把 users 存在記憶體）。`CQ_TEST=1` 才開放 `/api/test/fresh`，正式服務不可設。
- 禮物：`state.gifts`（1–4 碎片、odds 與技能卡同池、stock null=不限），學生 `frags[giftId]=[每片數量]`；碎片不佔背包；換領 `redeemGift`。
- GitHub `lphky/classroom-quiz`，main 根目錄 GitHub Pages：https://lphky.github.io/classroom-quiz/ 。用 lphky 帳戶推送（`GH_TOKEN=$(gh auth token -u lphky)`），不要切換全域 active 帳戶。
- 前端 ES Modules；規則只改 `js/logic.mjs`（純函數、不可變 state），UI 在 `js/app.mjs`，伺服器同步在 `js/store.mjs`（PUT /api/state 帶 baseVersion，409 即載入最新）。
- 規則設計見 DESIGN.md（用戶 2026-11-14 已確認第一版做法：站立者答對不得道具、指定卡只可指定坐低者、調高卡需老師批准）。
- `?test` 開放 `window.__cq`（state、synced、setRng）。改動後執行 `npm test`（node 單元測試 + Playwright 三種尺寸；Playwright 以 CQ_TEST=1 開臨時資料夾的伺服器，`tests/helpers.js` 的 `login()` 每個測試建新老師）。改完程式碼要 `update_user_service` 重啟 classroom-quiz。

- 現行視覺（2026-11-16 重做）：淺色應用程式風格，900px 以下底部導航；按鈕只用 app.mjs 內 `P` 線條 SVG 圖示，不用 emoji（tests/motion.spec.js 檢查）。道具為 `gameCard()` 遊戲卡牌，插畫 `assets/cards/*.webp`（AI 生成，540px）；動畫：`cardFx` 出卡、`.card-flip` 抽卡翻牌、`burst` 粒子、按鈕 ripple，全部受 reduceMotion／設定動畫開關控制。css/style.css 為完整樣式。課堂搜尋／篩選只改顯示；即時數據與 COMBO 不改計分。測試避免同一文字出現兩次（Playwright text= 為嚴格匹配）。test-data/demo-backup.json 為虛構測試備份。

- 老師說明書（2026-11-16）：`guide/index.html`（伺服器 `/guide/` 靜態提供，登入頁及「我的帳戶」有連結）＋ `guide/課堂冒險局-老師使用說明書.pdf`（14 頁 A4，由 index.html 列印產生再以 gs /ebook 壓縮）。截圖由 `node scripts/shoot-guide.mjs [a|b|c]` 用臨時 CQ_TEST 伺服器產生 PNG，再轉 1600px webp；介面改動後要重影及重出 PDF。說明書公開，不要寫入任何密碼。
- 測試老師帳戶（正式服務）：test.teacher、teacher.chan（陳老師）、teacher.wong（黃老師），均非管理員、不需改密碼；密碼只在對話交給用戶，不入 Git。
