// 私人網站：設定 ACCESS_CODE 後，只有用含 ?k=存取碼 的連結打開過的人才能使用。
export function cookieCode(req) {
  const m = String(req.headers.cookie || '').match(/(?:^|;\s*)k=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

export function allowed(req) {
  const code = process.env.ACCESS_CODE;
  return !code || cookieCode(req) === code;
}
