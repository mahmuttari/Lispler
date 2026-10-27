#!/usr/bin/env node
// Smart Measure — tarayıcıda deneme (yerel; Playwright + Chromium). Her dil (tr, en) iki görünümde: TR açık tema 390 px
// ve EN koyu tema 340 px; ayrıca tersleri. Her ekran iki ortamda açılır:
//   yalın   eklentisiz masaüstü tarayıcı: sensör, kamera, mikrofon yok → "sensör yok / izin" durumları
//   sahte   araclar/sahte-cihaz.mjs: sensörler, sahte kamera, mikrofon düzeyi
// Her ekranda alt sayfalar ve menüler de açılır. Aranan: sayfa hatası, konsol hatası/uyarısı, yatay taşma, ekranda
// çevrilmemiş anahtar (ör. "lv_state_level"), "undefined" / "null" / "NaN" metni.
//
//   node smart-measure/araclar/tarayici-dene.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sahteCihaz, ornekDepo } from './sahte-cihaz.mjs';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(0);
const ADRES = `http://127.0.0.1:${sunucu.address().port}/index.html`;

// rota → o ekranda açılacak katmanlar (erişilebilir adlarla, dile göre)
const ROTALAR = [
  ['home', [['button', { tr: 'Diğer seçenekler', en: 'More options' }]]],
  ['tools', []], ['favorites', []], ['history', []],
  ['ar?mode=distance', [['button', { tr: 'Nasıl çalışır', en: 'How it works' }], ['button', { tr: 'Diğer seçenekler', en: 'More options' }]]],
  ['ar?mode=height', []], ['ar?mode=width', []],
  ['level', [['button', { tr: 'Nasıl kullanılır', en: 'How to use' }], ['button', { tr: 'Su terazisi ayarları', en: 'Level settings' }], ['button', { tr: 'Diğer seçenekler', en: 'More options' }]]],
  ['ruler?tab=ruler', [['button', { tr: 'Bu araç hakkında', en: 'About this tool' }], ['button', { tr: 'Kalibre et', en: 'Calibrate' }]]],
  ['ruler?tab=protractor', []],
  ['sensors?tab=sound', [['button', { tr: 'Bu ölçerler hakkında', en: 'About these meters' }], ['button', { tr: 'Diğer seçenekler', en: 'More options' }]]],
  ['sensors?tab=light', []],
  ['settings', [['button', { tr: 'Açık kaynak lisansları', en: 'Open-source licences' }]]],
  ['premium', []], ['accuracy', []],
];
const GORUNUMLER = [
  { dil: 'tr', tema: 'light', w: 390 }, { dil: 'en', tema: 'dark', w: 340 },
  { dil: 'tr', tema: 'dark', w: 340 }, { dil: 'en', tema: 'light', w: 390 },
];

const sorunlar = [];
let ekranSayisi = 0;
const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
try {
  for (const g of GORUNUMLER) {
    for (const ortam of ['yalin', 'sahte']) {
      const b = await tarayici.newContext({ viewport: { width: g.w, height: 760 }, colorScheme: g.tema, locale: g.dil === 'tr' ? 'tr-TR' : 'en-US' });
      if (ortam === 'sahte') await b.addInitScript(sahteCihaz, {});
      const depo = ortam === 'sahte' ? ornekDepo(g.dil, g.tema) : { settings: { theme: g.tema, language: g.dil, units: 'metric', cameraHeight: null } };
      await b.addInitScript((d) => { if (!sessionStorage.getItem('kuruldu')) { localStorage.setItem('smartmeasure.v1', d); sessionStorage.setItem('kuruldu', '1'); } }, JSON.stringify(depo));
      const p = await b.newPage();
      let yer = '';
      p.on('pageerror', (e) => sorunlar.push(`${yer}: sayfa hatası ${e.message}`));
      p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) sorunlar.push(`${yer}: konsol ${m.type()} ${m.text()}`); });
      const denetle = async (ad) => {
        const r = await p.evaluate(() => {
          const tasma = document.documentElement.scrollWidth - window.innerWidth;
          const metin = document.body.innerText;
          const anahtar = metin.match(/\b(?:cm|hm|lb|lv|rl|sn|st|nav|pr|common)_[a-z0-9_]+\b/g) || [];
          const bos = metin.match(/\b(?:undefined|null|NaN)\b/g) || [];
          const genis = [...document.querySelectorAll('body *')].filter((e) => {
            const k = e.getBoundingClientRect();
            return k.width > 0 && (k.right > window.innerWidth + 1 || k.left < -1) && !e.closest('.ruler-wrap, .protractor, .frame-wrap, .vruler, .seg, svg');
          }).slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${e.className}`);
          return { tasma, anahtar, bos, genis };
        });
        ekranSayisi++;
        if (r.tasma > 0) sorunlar.push(`${ad}: yatay taşma ${r.tasma}px`);
        if (r.genis.length) sorunlar.push(`${ad}: ekrandan taşan öğe ${r.genis.join(', ')}`);
        if (r.anahtar.length) sorunlar.push(`${ad}: çevrilmemiş anahtar ${[...new Set(r.anahtar)].join(', ')}`);
        if (r.bos.length) sorunlar.push(`${ad}: ${[...new Set(r.bos)].join(', ')} metni`);
      };
      for (const [rota, katmanlar] of ROTALAR) {
        yer = `${g.dil}/${g.tema}/${g.w}/${ortam}/${rota}`;
        await p.goto(`${ADRES}#/${rota}`);
        await p.waitForTimeout(rota.startsWith('home') || rota.startsWith('level') || rota.startsWith('ar') || rota.startsWith('sensors') ? 2900 : 500);
        await denetle(yer);
        for (const [rol, ad] of katmanlar) {
          const dugme = p.getByRole(rol, { name: ad[g.dil], exact: true }).first();
          if (!(await dugme.count())) { sorunlar.push(`${yer}: düğme yok "${ad[g.dil]}"`); continue; }
          await dugme.click();
          await p.waitForTimeout(350);
          await denetle(`${yer} › ${ad[g.dil]}`);
          await p.keyboard.press('Escape');
          await p.evaluate(() => { document.querySelectorAll('.scrim').forEach((s) => s.click()); });
          await p.waitForTimeout(250);
        }
      }
      await b.close();
    }
  }
} finally {
  await tarayici.close();
  sunucu.close();
}
if (sorunlar.length) {
  console.log([...new Set(sorunlar)].join('\n'));
  console.log(`\n${sorunlar.length} sorun (${ekranSayisi} görünüm)`);
  process.exit(1);
}
console.log(`TAMAM: ${ekranSayisi} görünüm (2 dil × 4 görünüm × 2 ortam), hata yok, taşma yok, çevrilmemiş anahtar yok`);
