// 修改 tools/site.template.html 後執行：node tools/build.mjs
import fs from 'fs';
const rd = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
const html = rd('./site.template.html').replace('/*SAMPLE*/', 'const SAMPLE = ' + JSON.stringify(rd('./sample-front.txt').trim()) + ';');
fs.writeFileSync(new URL('./site.html', import.meta.url), html);
fs.writeFileSync(new URL('../api/_site.js', import.meta.url), '// 由 tools/site.template.html 產生：node tools/build.mjs\nexport default ' + JSON.stringify(html) + ';\n');
