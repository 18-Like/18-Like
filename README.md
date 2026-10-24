# 十八睞讓你美 網站

- `index.html`：網站本體（商品、髮色、尺寸、訂購流程、AI 換髮試戴）
- `api/tryon.js`：AI 換髮後端，呼叫 Google Gemini 生圖

## 上線（Vercel）

1. 到 https://vercel.com 用 GitHub 帳號登入，按「Add New → Project」，選這個 repo。
2. 在「Environment Variables」新增：
   - `GEMINI_API_KEY` = 你的 Gemini API key（在 https://aistudio.google.com/apikey 取得）
3. 按「Deploy」。完成後 Vercel 會給你網址，任何人打開都能用 AI 換髮。

可選設定：
- `GEMINI_MODEL`：指定模型，預設依序嘗試 `gemini-3.1-flash-image`、`gemini-3-pro-image`、`gemini-2.5-flash-image`
- `TRYON_LIMIT_PER_HOUR`：每個 IP 每小時可生成次數，預設 20

API key 只放在 Vercel 設定裡，不要寫進程式碼或貼到聊天。建議在 Google Cloud 帳單設定預算提醒。
