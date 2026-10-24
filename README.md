# 十八睞讓你美 網站（私人）

- `tools/site.html`：網站本體（商品、髮色、尺寸、訂購流程、AI 換髮試戴）。修改後執行 `node tools/build.mjs` 產生 `api/_site.js`。
- `api/page.js`：送出網頁，檢查存取碼
- `api/tryon.js`：AI 換髮後端，呼叫 Google Gemini 生圖

## 上線（Vercel）

1. 到 https://vercel.com 用 GitHub 帳號登入，按「Add New → Project」，選這個 repo。
2. 在「Environment Variables」新增：
   - `GEMINI_API_KEY` = 你的 Gemini API key（在 https://aistudio.google.com/apikey 取得）
   - `ACCESS_CODE` = 自訂一組存取碼，例如 `mei2026xyz`（不要太短）
3. 按「Deploy」。

## 分享連結

把 `https://你的網址/?k=存取碼` 傳給客人。打開過一次會記住 30 天。
沒有存取碼的人只會看到「這是私人網站」。網站也設定了不讓搜尋引擎收錄。
想讓舊連結失效，就到 Vercel 改 `ACCESS_CODE` 再重新部署。

## 其他設定

- `GEMINI_MODEL`：指定模型，預設依序嘗試 `gemini-3.1-flash-image`、`gemini-3-pro-image`、`gemini-2.5-flash-image`
- `TRYON_LIMIT_PER_HOUR`：每個 IP 每小時可生成次數，預設 20

API key 只放在 Vercel 設定裡，不要寫進程式碼或貼到聊天。建議在 Google Cloud 帳單設定預算提醒。
