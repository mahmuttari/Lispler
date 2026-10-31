#!/usr/bin/env node
// Ölçü Kutusu (Measure Box) — Google Play görselleri ve simgeler (Playwright + Chromium; bağımlılıksız):
//   magaza/play/simge-512.png                     özgün simge (küp, #04070C zemin), tam kare, 32 bit RGBA
//   app/smart-measure/icon-192.png                tanıtım sayfası simgesi
//   magaza/play/telefon-1…6-*.png                 tr-TR, 1080×1920: uygulamanın kendi ekranları (www/), sahte telefonla
//   magaza/play/en-US/telefon-1…6-*.png           en-US, aynı ekranlar İngilizce
//   magaza/play[/en-US]/tanitim-gorseli-1024x500.png  ad, bir cümle ve araç simgeleri (cihaz görüntüsü yok), 24 bit
//   --android  android/app/src/main/res/mipmap-*/ic_launcher.png ve ic_launcher_round.png (Android 7–7.1 için;
//              8.0+ uyarlanabilir simgeyi kullanır)
//
//   node smart-measure/araclar/magaza-gorsel.mjs [--android]
//
// Ekranlardaki değerler sentetiktir (araclar/sahte-cihaz.mjs): kamera görüntüsü çizilmiş bir odadır, sensör değerleri
// ve geçmiş örnektir. Görsellerde reklam, fiyat ve "Pro" yazısı yoktur.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sahteCihaz, ornekDepo } from './sahte-cihaz.mjs';
import { rgbaYap } from './png.mjs';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const PLAY = path.join(KOK, 'magaza', 'play');
// IOS=1: App Store (iPhone 6,9″) 1320×2868 (440×956, 3×) → magaza/app-store/{tr,en-US}/iphone-*.jpg (JPEG); sahte cihaz iPhone kipinde
// (ışık ölçer yok, onun ekranı çekilmez); simge ve tanıtım görseli üretilmez
const IOS = process.env.IOS === '1';
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);

const KUP = '<path d="M54,28 L76.5,41 L76.5,67 L54,80 L31.5,67 L31.5,41 Z M31.5,41 L54,54 L76.5,41 M54,54 L54,80" fill="none" stroke="#2E9BFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>';
const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png' };

const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(0);
const ADRES = `http://127.0.0.1:${sunucu.address().port}/index.html`;

const METIN = {
  tr: { ad: 'Ölçü Kutusu', slogan: 'Telefonunla ölç: mesafe, eğim, uzunluk, açı, ses ve ışık.' },
  en: { ad: 'Measure Box', slogan: 'Measure with your phone: distance, level, length, angle, sound and light.' },
};

const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
try {
  // ---- simgeler
  const simge = async (dosya, px, bicim) => {
    const p = await tarayici.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
    const kirp = bicim === 'yuvarlak' ? `<clipPath id="k"><circle cx="54" cy="54" r="36"/></clipPath>`
      : bicim === 'kose' ? `<clipPath id="k"><rect x="19" y="19" width="70" height="70" rx="13"/></clipPath>` : '';
    await p.setContent(`<html><body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" viewBox="18 18 72 72" width="${px}" height="${px}">
      <defs>${kirp}</defs><g ${kirp ? 'clip-path="url(#k)"' : ''}><rect x="0" y="0" width="108" height="108" fill="#04070C"/>${KUP}</g></svg></body></html>`);
    fs.mkdirSync(path.dirname(dosya), { recursive: true });
    // Simgeler her zaman 32 bit RGBA (Play simgesi böyle ister; opak görüntüyü Chromium 24 bit kaydeder)
    fs.writeFileSync(dosya, rgbaYap(await p.screenshot({ omitBackground: true })));
    await p.close();
    console.log(`  ${path.relative(KOK, dosya)}`);
  };
  fs.mkdirSync(PLAY, { recursive: true });
  if (!IOS) await simge(path.join(PLAY, 'simge-512.png'), 512, 'kare');
  if (!IOS) await simge(path.join(KOK, '..', 'app', 'smart-measure', 'icon-192.png'), 192, 'kose');
  if (process.argv.includes('--android')) {
    for (const [d, px] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
      const res = path.join(KOK, 'android', 'app', 'src', 'main', 'res', `mipmap-${d}`);
      await simge(path.join(res, 'ic_launcher.png'), px, 'kose');
      await simge(path.join(res, 'ic_launcher_round.png'), px, 'yuvarlak');
    }
  }

  // ---- ekran görüntüleri
  const ekran = async (dil, tema, ad, rota, hazirla, ayar = {}) => {
    const b = await tarayici.newContext({ viewport: IOS ? { width: 440, height: 956 } : { width: 360, height: 640 }, deviceScaleFactor: 3, colorScheme: tema, locale: dil === 'tr' ? 'tr-TR' : 'en-US' });
    await b.addInitScript(sahteCihaz, IOS ? { ...ayar, platform: 'ios' } : ayar);
    const depo = ornekDepo(dil, tema);
    await b.addInitScript((d) => { localStorage.setItem('smartmeasure.v1', d); }, JSON.stringify(depo));
    const p = await b.newPage();
    const hatalar = [];
    p.on('pageerror', (e) => hatalar.push(String(e)));
    p.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
    await p.goto(`${ADRES}#/${rota}`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(700);
    if (hazirla) await hazirla(p);
    const klasor = IOS ? path.join(KOK, 'magaza', 'app-store', dil === 'tr' ? 'tr' : 'en-US') : dil === 'tr' ? PLAY : path.join(PLAY, 'en-US');
    fs.mkdirSync(klasor, { recursive: true });
    if (IOS) ad = ad.replace('telefon-', 'iphone-').replace(/\.png$/, '.jpg');
    await p.screenshot({ path: path.join(klasor, ad), ...(IOS ? { type: 'jpeg', quality: 82 } : {}) });
    if (hatalar.length) throw new Error(`${dil} ${ad}: ${hatalar.join(' | ')}`);
    console.log(`  ${path.relative(KOK, path.join(klasor, ad))}`);
    await b.close();
  };

  for (const dil of ['tr', 'en']) {
    await ekran(dil, 'dark', 'telefon-1-ana-sayfa.png', 'home', async (p) => { await p.waitForTimeout(900); });
    await ekran(dil, 'dark', 'telefon-2-kamerayla-olcum.png', 'ar?mode=distance', async (p) => {
      await p.waitForSelector('.cam-overlay.hidden', { state: 'attached', timeout: 8000 });
      await p.evaluate(() => { window.__sahte.pitch = 27; window.__sahte.bearing = -12; });
      await p.waitForTimeout(700);
      await p.locator('.actions').first().locator('button').nth(0).click();
      await p.evaluate(() => { window.__sahte.pitch = 15.5; window.__sahte.bearing = 21; });
      await p.waitForTimeout(800);
      await p.locator('.actions').first().locator('button').nth(1).click();
      await p.evaluate(() => { window.__sahte.pitch = 19; window.__sahte.bearing = 4; });
      await p.waitForTimeout(2600); // bildirim kaybolsun
      await p.evaluate(() => window.scrollTo(0, 0)); // tıklama düğmeyi görünür yapmak için sayfayı kaydırmıştı
      await p.waitForTimeout(200);
    });
    await ekran(dil, 'light', 'telefon-3-su-terazisi.png', 'level', async (p) => { await p.waitForTimeout(1500); }, { gravity: { x: -0.05, y: 0.032, z: 9.806 } });
    await ekran(dil, 'dark', 'telefon-4-cetvel-aciolcer.png', 'ruler?tab=protractor', async (p) => { await p.waitForTimeout(600); });
    await ekran(dil, 'dark', 'telefon-5-ses-olcer.png', 'sensors?tab=sound', async (p) => {
      await p.getByRole('button', { name: dil === 'tr' ? 'Mikrofonu aç' : 'Turn on the microphone' }).click();
      await p.waitForTimeout(6500);
    });
    if (!IOS) await ekran(dil, 'light', 'telefon-6-isik-olcer.png', 'sensors?tab=light', async (p) => { await p.waitForTimeout(2500); });
  }

  // ---- tanıtım görseli 1024×500 (24 bit, saydamlık yok); App Store'da yok
  for (const dil of IOS ? [] : ['tr', 'en']) {
    const p = await tarayici.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
    const font = (w) => `url(data:font/ttf;base64,${fs.readFileSync(path.join(WWW, 'fonts', `manrope-${w}.ttf`)).toString('base64')})`;
    const ic = await import(pathToFileURL(path.join(WWW, 'js', 'icons.js')).href).catch(() => null);
    const P = ic ? ic.PATHS : {};
    const kutu = (ad, renk) => `<div class="t" style="--c:${renk}"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="${renk}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${(P[ad] || []).map((d) => `<path d="${d}"/>`).join('')}</svg></div>`;
    await p.setContent(`<html><head><style>
      @font-face{font-family:M;src:${font(800)};font-weight:800} @font-face{font-family:M;src:${font(600)};font-weight:600}
      body{margin:0;width:1024px;height:500px;overflow:hidden;background:radial-gradient(circle at 18% 30%,#0b2a4a 0,#000 55%),#000;font-family:M;color:#F5F7FA;display:flex;align-items:center}
      .sol{flex:1;padding:0 0 0 72px;display:flex;flex-direction:column;gap:22px}
      .logo{width:120px;height:120px;border-radius:30px;background:#04070C;box-shadow:0 0 0 2px rgba(46,155,255,.45),0 0 60px rgba(46,155,255,.45);display:grid;place-items:center}
      h1{margin:0;font-size:64px;font-weight:800;letter-spacing:-1.5px} p{margin:0;font-size:25px;font-weight:600;color:#8E97A6;max-width:520px;line-height:1.35}
      .sag{display:grid;grid-template-columns:repeat(2,96px);gap:22px;padding-right:86px}
      .t{width:96px;height:96px;border-radius:26px;display:grid;place-items:center;background:#090C10;border:2px solid var(--c);box-shadow:0 0 28px color-mix(in srgb,var(--c) 45%,transparent)}
    </style></head><body><div class="sol"><div class="logo"><svg viewBox="28 26 52 56" width="78" height="78">${KUP}</svg></div><h1>${METIN[dil].ad}</h1><p>${METIN[dil].slogan}</p></div>
    <div class="sag">${kutu('Box', '#0A95FF')}${kutu('Level', '#34F353')}${kutu('Ruler', '#FF9500')}${kutu('Protractor', '#FF9500')}${kutu('Activity', '#FFD60A')}${kutu('Sun', '#FFD60A')}</div></body></html>`);
    await p.evaluate(() => document.fonts.ready);
    const klasor = dil === 'tr' ? PLAY : path.join(PLAY, 'en-US');
    await p.screenshot({ path: path.join(klasor, 'tanitim-gorseli-1024x500.png') });
    console.log(`  ${path.relative(KOK, path.join(klasor, 'tanitim-gorseli-1024x500.png'))}`);
    await p.close();
  }
} finally {
  await tarayici.close();
  sunucu.close();
}
