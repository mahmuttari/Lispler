#!/usr/bin/env node
// Unitica — Google Play mağaza görselleri (Playwright + Chromium; bağımlılıksız). Hepsi uygulamanın kendi sayfasından
// (www/, yerel sunucu) yapay kullanıcı verisiyle (araclar/sunucu.mjs › ornekDurum: geçmiş ve favoriler) çekilir:
//   magaza/play/simge-512.png                 uygulama simgesinin katmanları (Android uyarlanabilir simge: lacivert zemin +
//                                            mavi baret) tam kare, 32 bit PNG; Play köşeleri kendisi yuvarlar
//   magaza/play[/<dil>]/telefon-1…6-*.png     1080×1920 (360×640, 3×): ana ekran, dönüşüm kartı + tüm birimler, 26 kategori,
//                                            geçmiş, favoriler, koyu temada birim seçici. Her mağaza dilinde, o dilin
//                                            arayüzüyle; Arapça sağdan sola. Fiyat yok, reklam yok (tarayıcıda reklam yoktur,
//                                            ?billing=off ile fiyat satırı da gelmez), ekranın üstüne yazı yok.
//   magaza/play[/<dil>]/tanitim-gorseli-1024x500.png  ad, o dildeki bir satır ve 2. ekrandan bir kesit; 24 bit PNG
//
//   node unitica/araclar/magaza-gorsel.mjs [dil …]     (dil verilmezse hepsi; ör. "tr-TR ar")
import fs from 'node:fs';
import path from 'node:path';
import { KOK, WWW, sunucuAc, tarayici, ornekDurum } from './sunucu.mjs';

/** Play mağaza dili → uygulama dili */
export const DILLER = { 'tr-TR': 'tr', 'en-US': 'en', 'de-DE': 'de', 'fr-FR': 'fr', 'es-ES': 'es', 'it-IT': 'it', 'pt-BR': 'pt', 'ru-RU': 'ru', ar: 'ar', 'ja-JP': 'ja', 'ko-KR': 'ko' };
export const EKRANLAR = ['telefon-1-ana.png', 'telefon-2-donusum.png', 'telefon-3-kategoriler.png', 'telefon-4-gecmis.png', 'telefon-5-favoriler.png', 'telefon-6-koyu-tema.png'];
const PLAY = path.join(KOK, 'magaza', 'play');
const RES = path.join(KOK, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi');
const veri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;

const istenen = process.argv.slice(2);
const secim = Object.keys(DILLER).filter((d) => !istenen.length || istenen.includes(d));
const { adres, kapat } = await sunucuAc();
const b = await tarayici();

async function sayfa(dil, tema) {
  const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, colorScheme: tema, locale: dil, timezoneId: 'Europe/Istanbul' });
  // ekrandaki saat ve "x dk önce" yazıları her seferinde aynı çıksın
  const simdi = new Date('2026-10-27T14:30:00+03:00').getTime();
  const p = await ctx.newPage();
  await p.clock.install({ time: simdi });
  await p.clock.pauseAt(simdi);
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
  await p.addInitScript((d) => localStorage.setItem('unitica.v1', JSON.stringify(d)), ornekDurum(dil, tema, simdi));
  await p.goto(`${adres}index.html?billing=off`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.clock.runFor(500);
  return { ctx, p, hatalar };
}

const bekle = async (p, ms = 450) => { await p.clock.runFor(ms); await p.waitForTimeout(80); };
const kaydir = (p, secici, ust = 8) => p.evaluate(([s, u]) => {
  const ekran = document.querySelector('.screen:not([hidden])');
  const el = document.querySelector(s);
  ekran.scrollTop += el.getBoundingClientRect().top - u;
}, [secici, ust]);

async function ekranlar(oyun, dil) {
  const hedef = oyun === 'tr-TR' ? PLAY : path.join(PLAY, oyun);
  fs.mkdirSync(hedef, { recursive: true });
  const cek = async (p, ad) => { await p.screenshot({ path: path.join(hedef, ad) }); };
  {
    const { ctx, p, hatalar } = await sayfa(dil, 'light');
    await cek(p, EKRANLAR[0]);
    await p.click('[data-act="allToggle"]'); await bekle(p);
    await kaydir(p, '#card'); await bekle(p);
    await cek(p, EKRANLAR[1]);
    await p.evaluate(() => { document.querySelector('.screen:not([hidden])').scrollTop = 0; });
    await p.click('.cats-toggle'); await bekle(p);
    await kaydir(p, '#browse', 4); await bekle(p);
    await cek(p, EKRANLAR[2]);
    await p.click('.tab[data-tab="history"]'); await bekle(p);
    await cek(p, EKRANLAR[3]);
    await p.click('.tab[data-tab="favorites"]'); await bekle(p);
    await cek(p, EKRANLAR[4]);
    if (hatalar.length) throw new Error(`${oyun}: ${hatalar.join(' | ')}`);
    await ctx.close();
  }
  {
    const { ctx, p, hatalar } = await sayfa(dil, 'dark');
    await p.click('.tile[data-arg="flow"]'); await bekle(p);
    await p.click('.unit-btn[data-arg="t"]'); await bekle(p, 600);
    await p.evaluate(() => { document.querySelector('.screen:not([hidden])').scrollTop = 0; }); await bekle(p, 200);
    await cek(p, EKRANLAR[5]);
    if (hatalar.length) throw new Error(`${oyun}: ${hatalar.join(' | ')}`);
    await ctx.close();
  }
  return hedef;
}

/** simge katmanlarından tam kare: uyarlanabilir simgenin 108 dp tuvalinin ortadaki 90 dp'si (başlatıcıdaki görünüme yakın) */
async function simge() {
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  const b64 = await p.evaluate(async ([zemin, on]) => {
    const yukle = async (src) => { const i = new Image(); i.src = src; await i.decode(); return i; };
    const [z, o] = [await yukle(zemin), await yukle(on)];
    const c = Object.assign(document.createElement('canvas'), { width: 512, height: 512 });
    const g = c.getContext('2d');
    const kirp = 432 * 90 / 108, x = (432 - kirp) / 2;
    g.drawImage(z, x, x, kirp, kirp, 0, 0, 512, 512);
    g.drawImage(o, x, x, kirp, kirp, 0, 0, 512, 512);
    return c.toDataURL('image/png').split(',')[1];   // tuvalin PNG'si her zaman RGBA (32 bit)
  }, [veri(path.join(RES, 'ic_launcher_background.png')), veri(path.join(RES, 'ic_launcher_foreground.png'))]);
  fs.writeFileSync(path.join(PLAY, 'simge-512.png'), Buffer.from(b64, 'base64'));
  await p.close();
}

async function tanitim(oyun, dil, hedef) {
  const paket = (await import(path.join(WWW, 'js', 'lang', `${dil}.js`))).default;
  const t = (k) => paket.text[k];
  const { CATEGORIES } = await import(path.join(WWW, 'js', 'units.js'));
  const birim = CATEGORIES.reduce((n, c) => n + c.units.length, 0);
  const alt = t('about.categories').replace('{n}', CATEGORIES.length).replace('{u}', birim);
  const sag = paket.dir === 'rtl';
  const p = await b.newPage({ viewport: { width: 1024, height: 500 } });
  await p.goto(`${adres}index.html?billing=off`);   // aynı kökten: Inter yazı tipi www/fonts'tan gelir
  await p.setContent(`<!doctype html><html lang="${dil}" dir="${paket.dir}"><meta charset="utf-8"><link rel="stylesheet" href="${adres}css/fonts.css"><style>
    html,body{margin:0;width:1024px;height:500px;overflow:hidden}
    body{background:linear-gradient(160deg,#08183A 0%,#0F2D63 100%);font-family:"Inter Variable",system-ui,sans-serif;color:#fff;position:relative}
    .yazi{position:absolute;${sag ? 'right' : 'left'}:64px;top:88px;width:520px}
    .simge{width:104px;height:104px;border-radius:24px;display:block;box-shadow:0 6px 18px rgba(0,0,0,.3)}
    h1{margin:26px 0 10px;font-size:66px;line-height:1;font-weight:800;letter-spacing:-1px}
    h2{margin:0;font-size:32px;line-height:1.2;font-weight:600;color:#3DA0FF}
    p{margin:14px 0 0;font-size:24px;line-height:1.35;color:rgba(255,255,255,.82)}
    .ekran{position:absolute;${sag ? 'left' : 'right'}:76px;top:56px;width:300px;height:388px;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 14px 40px rgba(0,0,0,.45)}
    .ekran img{position:absolute;left:0;top:0;width:300px;display:block}
  </style>
  <div class="yazi">
    <img class="simge" src="${veri(path.join(PLAY, 'simge-512.png'))}" alt="">
    <h1>Unitica</h1>
    <h2>${t('hero.1')} ${t('hero.2')}</h2>
    <p>${alt}</p>
  </div>
  <div class="ekran"><img src="${veri(path.join(hedef, EKRANLAR[1]))}" alt=""></div></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(hedef, 'tanitim-gorseli-1024x500.png') });
  await p.close();
}

try {
  fs.mkdirSync(PLAY, { recursive: true });
  await simge();
  console.log('  simge-512.png');
  for (const oyun of secim) {
    const dil = DILLER[oyun];
    const hedef = await ekranlar(oyun, dil);
    await tanitim(oyun, dil, hedef);
    console.log(`  ${oyun}: ${EKRANLAR.length} ekran + tanıtım görseli`);
  }
} finally {
  await b.close();
  kapat();
}
