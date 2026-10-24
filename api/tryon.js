// AI 換髮：把客人照片和補髮範圍交給 Gemini 生成戴上髮片後的照片。
// API key 只放在伺服器環境變數 GEMINI_API_KEY，不會出現在網頁裡。

import { allowed } from './_auth.js';

const MODELS = (process.env.GEMINI_MODEL || 'gemini-3.1-flash-image,gemini-3-pro-image,gemini-2.5-flash-image')
  .split(',').map(s => s.trim()).filter(Boolean);
const LIMIT_PER_HOUR = Number(process.env.TRYON_LIMIT_PER_HOUR || 20);
const MAX_DATA_URL = 3_000_000;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 3600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > LIMIT_PER_HOUR;
}

function splitDataUrl(s) {
  const m = typeof s === 'string' && s.length < MAX_DATA_URL && s.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  return m ? { mimeType: m[1], data: m[2] } : null;
}

const STYLES = {
  natural: '保留客人原本的髮型、長度與分線，只把稀疏、露出頭皮的地方補滿，像戴上一片高品質真人髮補髮片',
  side: '整理成俐落的男士商務側分髮型，頂部有自然蓬度，兩側修短',
  textured: '整理成自然的男士紋理碎蓋髮型，瀏海微微蓋住額頭，有層次感',
  short: '整理成清爽的男士短髮，頂部濃密有立體感，兩側與後面修短',
  bangs: '加上自然的空氣瀏海，頭頂髮量變多，整體看起來年輕柔和',
  long: '頭髮變成濃密、有光澤的及肩長髮，髮量明顯增加'
};

function buildPrompt({ angle, color, density, style, hasMask }) {
  const amount = density >= 0.8 ? '濃密' : density >= 0.5 ? '自然適中' : '略為加密';
  return [
    `這是客人「${angle}」角度的照片${hasMask ? '，第二張是遮罩：白色橢圓是要補髮的範圍' : ''}。`,
    `請編輯這張照片，讓客人看起來像戴上了高品質真人髮髮片：${STYLES[style] || STYLES.natural}。`,
    `頭髮${amount}、完全蓋住稀疏的頭皮，髮色${color ? '為' + color : '和客人原本的頭髮一致'}，髮流、光澤與光線要自然，髮際線要像真的長出來的。`,
    '嚴格保持不變：臉、五官、表情、膚色、身份、耳朵、衣服、背景、拍攝角度、構圖與畫面比例。',
    '不要加入文字、浮水印或邊框。只輸出編輯後的照片。'
  ].join('');
}

export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!allowed(req)) return res.status(403).json({ ok: false, error: 'locked' });
  if (req.method === 'GET') return res.status(200).json({ ok: true, configured: !!key });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!key) return res.status(503).json({ error: 'not_configured' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const image = splitDataUrl(body.image), mask = body.mask ? splitDataUrl(body.mask) : null;
  if (!image || (body.mask && !mask)) return res.status(400).json({ error: 'bad_image' });
  const style = Object.hasOwn(STYLES, body.style) ? body.style : 'natural';
  const angle = ['正面', '頭頂', '左側', '右側'].includes(body.angle) ? body.angle : '正面';
  const color = typeof body.color === 'string' ? body.color.slice(0, 20) : '';
  const density = Math.max(0, Math.min(1, Number(body.density) || 0.75));

  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [
      { text: buildPrompt({ angle, color, density, style, hasMask: !!mask }) },
      { inline_data: { mime_type: image.mimeType, data: image.data } },
      ...(mask ? [{ inline_data: { mime_type: mask.mimeType, data: mask.data } }] : [])
    ] }],
    generationConfig: { responseModalities: ['IMAGE'] }
  });

  let lastError = 'no_model';
  for (const model of MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: payload
    });
    if (r.status === 404) { lastError = 'model_not_found'; continue; }
    if (r.status === 429) {
      const t = await r.text();
      console.error('Gemini 429', model, t.slice(0, 500));
      lastError = /limit: 0|free_tier|billing/i.test(t) ? 'gemini_billing' : 'gemini_quota';
      continue;
    }
    if (!r.ok) {
      console.error('Gemini error', model, r.status, (await r.text()).slice(0, 500));
      return res.status(502).json({ error: r.status === 400 || r.status === 403 ? 'gemini_key_or_request' : 'gemini_error' });
    }
    const json = await r.json();
    const parts = json?.candidates?.[0]?.content?.parts || [];
    const img = parts.map(p => p.inlineData || p.inline_data).find(Boolean);
    if (!img) return res.status(502).json({ error: 'no_image' });
    return res.status(200).json({ image: `data:${img.mimeType || img.mime_type || 'image/png'};base64,${img.data}`, model });
  }
  return res.status(lastError.startsWith('gemini_') ? 429 : 502).json({ error: lastError });
}
