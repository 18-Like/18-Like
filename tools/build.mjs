// 修改 tools/site.html 後執行：node tools/build.mjs
import fs from 'fs';
const html = fs.readFileSync(new URL('./site.html', import.meta.url), 'utf8');
fs.writeFileSync(new URL('../api/_site.js', import.meta.url), '// 由 tools/site.html 產生：node tools/build.mjs\nexport default ' + JSON.stringify(html) + ';\n');
