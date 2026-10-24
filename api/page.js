import html from './_site.js';
import { allowed } from './_auth.js';

const LOCKED = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>十八睞讓你美</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f2f3;color:#271c22;font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;text-align:center;padding:24px}h1{font-family:"Noto Serif TC",serif;color:#8a2e4a}</style></head><body><div><h1>十八睞讓你美</h1><p>這是私人網站，請使用店家提供的連結開啟。</p></div></body></html>`;

export default function handler(req, res) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const code = process.env.ACCESS_CODE;
  const k = new URL(req.url, 'http://localhost').searchParams.get('k');
  if (code && k === code) {
    res.setHeader('Set-Cookie', `k=${encodeURIComponent(code)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);
    return res.status(200).end(html);
  }
  if (!allowed(req)) return res.status(403).end(LOCKED);
  return res.status(200).end(html);
}
