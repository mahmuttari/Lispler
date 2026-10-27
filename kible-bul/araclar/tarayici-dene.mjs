#!/usr/bin/env node
// Kıble Bul — tarayıcıda duman sınaması (yalnız yerelde; Playwright + Chromium). CI çalıştırmaz.
//
//   node kible-bul/araclar/tarayici-dene.mjs [--ekran] [--uygulama]
//     --ekran: her durumun ekran görüntüsü kible-bul/.dene/ (depoya girmez)   --uygulama: yalnız uygulama kipi (reklam)
//
// Her dilde (11) bütün ekranlar ve sayfalar dolaşılır: karşılama (4 kart), pusula, harita, yer arama ve koordinat,
// ayarlar, Hakkında, pusula bilgisi, kalibrasyon, reklamsız üyelik. Her durumda şunlar aranır:
//   - konsol hatası ya da yakalanmamış hata,
//   - yatay taşma (sayfa ya da görünür bir öğe ekranın dışına çıkıyor),
//   - çevrilmemiş anahtar (ekranda "compass.tip" gibi bir sözlük anahtarı görünüyor).
// Görünümler: her dil 360 px açık; ayrıca TR açık 390 px ve AR koyu (gece modu) 340 px. TR 390 ve AR 340 bir de
// "uygulama kipinde" (Capacitor taklidi, ortak.mjs › yerelTaklit) denenir: AdMob banner şeridi sekme çubuğunun ve alt
// sayfanın üstüne binmemeli, klavye açıkken ve kalibrasyonda gizlenmeli, geçiş reklamı yalnız kurallara uygun anda gelmeli.
import fs from 'node:fs';
import path from 'node:path';
import { KB, sunucuAc, karoYolu, yerelTaklit, playwright, CHROMIUM } from './ortak.mjs';

const EKRAN = process.argv.includes('--ekran');
const CIKIS = path.join(KB, '.dene');
if (EKRAN) fs.mkdirSync(CIKIS, { recursive: true });
const { chromium } = await playwright();
const en = (await import('../www/js/lang/en.js')).default.ui;
const ANAHTARLAR = Object.keys(en);
const DILLER = ['tr', 'en', 'de', 'fr', 'es', 'pt', 'it', 'ru', 'ja', 'ko', 'ar'];
const ARAMA = { tr: 'mek', en: 'mec', de: 'mek', fr: 'la mec', es: 'la mec', pt: 'mec', it: 'la mec', ru: 'мекк', ja: 'メッカ', ko: '메카', ar: 'مكة' };

const { adres, kapat } = await sunucuAc();
const tarayici = await chromium.launch({ executablePath: CHROMIUM });
const sorunlar = [];
let durumSayisi = 0;

async function denetle(p, ad, hatalar) {
  durumSayisi++;
  const r = await p.evaluate((anahtarlar) => {
    const W = document.documentElement.clientWidth;
    const tasma = [];
    if (document.documentElement.scrollWidth > W + 1) tasma.push('sayfa ' + document.documentElement.scrollWidth + '>' + W);
    for (const el of document.querySelectorAll('#app *, #layer *, #onboard *, .calib, .calib *')) {
      if (el.closest('.leaflet-container') || el.closest('svg')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      if (b.right > W + 1.5 || b.left < -1.5) {
        // yatay kaydırılan kutunun içindekiler sayılmaz; ekran dışına itilmiş kapalı alt sayfa da
        let k = el.parentElement, kayan = false;
        while (k) { const s = getComputedStyle(k); if (/(auto|scroll|hidden)/.test(s.overflowX) && k.getBoundingClientRect().right <= W + 1.5) { kayan = true; break; } k = k.parentElement; }
        if (!kayan) tasma.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + [...el.classList].join('.')) + ` [${Math.round(b.left)},${Math.round(b.right)}]`);
      }
    }
    const ac = new Set(anahtarlar);
    const cevrilmemis = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const s = w.currentNode.textContent.trim();
      if (s && ac.has(s) && w.currentNode.parentElement && w.currentNode.parentElement.getClientRects().length) cevrilmemis.push(s);
    }
    for (const el of document.querySelectorAll('[placeholder],[aria-label]')) {
      for (const a of ['placeholder', 'aria-label']) { const v = el.getAttribute(a); if (v && ac.has(v)) cevrilmemis.push(a + ':' + v); }
    }
    return { tasma: tasma.slice(0, 6), cevrilmemis };
  }, ANAHTARLAR);
  for (const x of r.tasma) sorunlar.push(`${ad}: taşma ${x}`);
  for (const x of r.cevrilmemis) sorunlar.push(`${ad}: çevrilmemiş ${x}`);
  for (const x of hatalar.splice(0)) sorunlar.push(`${ad}: hata ${x}`);
  if (EKRAN) await p.screenshot({ path: path.join(CIKIS, ad.replace(/[^A-Za-z0-9-]+/g, '_') + '.png') });
}

async function sayfa({ dil, gen, gece, yerel = false, ob = false, uye = false, ek = '' }) {
  const b = await tarayici.newContext({ viewport: { width: gen, height: Math.round(gen * 2.05) }, deviceScaleFactor: 2, locale: dil, hasTouch: false });
  await karoYolu(b, path.join(KB, '.karo'));
  await b.route(/^https?:\/\/(?!127\.0\.0\.1|gibs\.earthdata)/, (r) => r.abort());
  if (yerel) await b.addInitScript(yerelTaklit, { uye });
  await b.addInitScript(([onb]) => {
    try {
      if (!localStorage.getItem('kible-bul.v1')) {
        localStorage.setItem('kible-bul.v1', JSON.stringify({ onboarded: onb, place: null, recents: [], settings: {} }));
      }
    } catch (e) { /* yok */ }
  }, [!ob]);
  const p = await b.newPage();
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(String(e.message || e)));
  p.on('console', (m) => { if (m.type() === 'error' && !/gibs\.earthdata|net::ERR_FAILED|ERR_BLOCKED/.test(m.text() + JSON.stringify(m.location()))) hatalar.push(m.text()); });
  const q = `?lang=${dil}&night=${gece ? 1 : 0}${ob ? '&ob=1' : ''}&place=21.4858,39.1925,Jeddah,SA&heading=95${ek}`;
  await p.goto(adres + q);
  await p.waitForFunction(() => document.querySelector('#tabbar button'), null, { timeout: 10000 });
  await p.waitForTimeout(400);
  return { b, p, hatalar };
}

const tikla = async (p, sec) => { await p.locator(sec).first().click(); await p.waitForTimeout(350); };
const sekme = (p, ad) => tikla(p, `#tabbar button[data-tab="${ad}"]`);

async function dolas(dil, gen, gece) {
  const ad = `${dil}-${gen}-${gece ? 'koyu' : 'acik'}`;
  // karşılama
  {
    const { b, p, hatalar } = await sayfa({ dil, gen, gece, ob: true });
    for (let i = 1; i <= 4; i++) {
      await p.waitForTimeout(300);
      await denetle(p, `${ad}-karsilama-${i}`, hatalar);
      await tikla(p, '#onboard .cta');
    }
    await b.close();
  }
  const { b, p, hatalar } = await sayfa({ dil, gen, gece });
  await denetle(p, `${ad}-pusula`, hatalar);
  await sekme(p, 'map');
  await p.waitForTimeout(1200);
  await denetle(p, `${ad}-harita`, hatalar);
  await tikla(p, '.mapwrap .sq:not(.recenter)');
  await denetle(p, `${ad}-harita-katman`, hatalar);
  await sekme(p, 'place');
  await p.fill('input.search', ARAMA[dil]);
  await p.waitForFunction(() => document.querySelectorAll('.list .item').length > 0, null, { timeout: 10000 });
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  await denetle(p, `${ad}-yer-arama`, hatalar);
  await tikla(p, '.rowbtn');
  await p.fill('.coordbox input >> nth=0', '91');
  await p.fill('.coordbox input >> nth=1', '29');
  await tikla(p, '.coordbox .pill');
  await denetle(p, `${ad}-yer-koordinat-hata`, hatalar);
  await p.fill('.coordbox input >> nth=0', '40.7654');
  await p.fill('.coordbox input >> nth=1', '29.9408');
  await tikla(p, '.coordbox .pill');
  await denetle(p, `${ad}-pusula-koordinat`, hatalar);
  await sekme(p, 'settings');
  await denetle(p, `${ad}-ayarlar`, hatalar);
  await p.locator('#scr-settings .srow').last().click(); await p.waitForTimeout(400);
  await denetle(p, `${ad}-hakkinda`, hatalar);
  await tikla(p, '.sheet .about .wrap .pill >> nth=0');
  await denetle(p, `${ad}-pusula-bilgisi`, hatalar);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.locator('#scr-settings section.group').nth(2).locator('.srow').click(); await p.waitForTimeout(700);
  await denetle(p, `${ad}-uyelik`, hatalar);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await tikla(p, '.calcard .bigbtn');
  await denetle(p, `${ad}-kalibrasyon`, hatalar);
  await tikla(p, '.calib .bigbtn');
  await b.close();
}

/** Uygulama kipi: banner şeridi ve reklam kuralları (AdMob taklidi) */
async function uygulamaKipi(dil, gen, gece) {
  const ad = `${dil}-${gen}-${gece ? 'koyu' : 'acik'}-uygulama`;
  const { b, p, hatalar } = await sayfa({ dil, gen, gece, yerel: true });
  await p.waitForFunction(() => (window.__admob || []).some((c) => c.ad === 'showBanner'), null, { timeout: 8000 });
  await p.waitForTimeout(300);
  const olc = () => p.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: b.height }; };
    return { serit: r('#reklam-serit'), sekme: r('#tabbar'), vh: innerHeight, sinif: document.documentElement.classList.contains('reklamli'),
      cagri: window.__admob.map((c) => c.ad) };
  });
  let o = await olc();
  const bekle = (kosul, mesaj) => { if (!kosul) sorunlar.push(`${ad}: ${mesaj}`); };
  bekle(o.sinif && Math.round(o.serit.h) === 56, `banner şeridi 56 px olmalı (${o.serit && o.serit.h})`);
  bekle(o.sekme.bottom <= o.serit.top + 0.5, 'sekme çubuğu banner şeridinin üstünde bitmeli');
  bekle(Math.round(o.serit.bottom) === o.vh, 'şerit ekranın en altında olmalı');
  const ilk = o.cagri;
  bekle(ilk.indexOf('requestConsentInfo') < ilk.indexOf('initialize') && ilk.indexOf('initialize') < ilk.indexOf('showBanner'), `çağrı sırası: ${ilk.join(',')}`);
  await denetle(p, `${ad}-pusula-banner`, hatalar);
  // alt sayfa banner'ın üstünde açılır
  await sekme(p, 'settings');
  await p.locator('#scr-settings .srow').last().click(); await p.waitForTimeout(400);
  const sayfaAlt = await p.evaluate(() => document.querySelector('.sheet').getBoundingClientRect().bottom);
  o = await olc();
  bekle(sayfaAlt <= o.serit.top + 0.5, `alt sayfa banner'ın üstünde bitmeli (${sayfaAlt} > ${o.serit.top})`);
  await denetle(p, `${ad}-hakkinda-banner`, hatalar);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // kalibrasyonda banner gizli
  await tikla(p, '.calcard .bigbtn');
  o = await olc();
  bekle(!o.sinif && o.cagri.includes('hideBanner'), 'kalibrasyonda banner gizlenmeli');
  await tikla(p, '.calib .bigbtn');
  await p.waitForTimeout(200);
  o = await olc();
  bekle(o.sinif && o.cagri.includes('resumeBanner'), 'kalibrasyondan sonra banner geri gelmeli');
  // klavye açıkken banner gizli; arama tamamlanınca (ilk 3 dakika dolmadan) geçiş reklamı YOK
  await tikla(p, '#scr-settings header .ibtn');
  await sekme(p, 'place');
  await p.focus('input.search');
  await p.fill('input.search', ARAMA[dil]);
  await p.waitForTimeout(400);
  o = await olc();
  bekle(!o.sinif, 'klavye açıkken banner gizlenmeli');
  await p.waitForFunction(() => document.querySelectorAll('.list .item').length > 0, null, { timeout: 10000 });
  await p.locator('.list .item').first().click();
  await p.waitForTimeout(900);
  o = await olc();
  bekle(o.sinif, 'arama bitince banner geri gelmeli');
  bekle(!o.cagri.includes('showInterstitial'), 'oturumun ilk 3 dakikasında geçiş reklamı olmamalı');
  // oturum 4 dakika önce başlamış gibi: aynı doğal durakta bir geçiş reklamı gelir, hemen ikincisi gelmez
  await p.evaluate(async () => { const m = await import('./js/reklam.js'); m.__oturumBasi(Date.now() - 4 * 60e3); });
  await sekme(p, 'place');
  await p.fill('input.search', ARAMA[dil]);
  await p.waitForFunction(() => document.querySelectorAll('.list .item').length > 0, null, { timeout: 10000 });
  await p.locator('.list .item').first().click();
  await p.waitForTimeout(1200);
  o = await olc();
  bekle(o.cagri.filter((c) => c === 'showInterstitial').length === 1, 'tamamlanan aramadan sonra bir geçiş reklamı');
  await sekme(p, 'place');
  await p.fill('input.search', ARAMA[dil]);
  await p.waitForFunction(() => document.querySelectorAll('.list .item').length > 0, null, { timeout: 10000 });
  await p.locator('.list .item').first().click();
  await p.waitForTimeout(1200);
  o = await olc();
  bekle(o.cagri.filter((c) => c === 'showInterstitial').length === 1, '4 dakika dolmadan ikinci geçiş reklamı olmamalı');
  await denetle(p, `${ad}-son`, hatalar);
  await b.close();
  // reklamsız üye: AdMob'a hiç dokunulmaz
  const u = await sayfa({ dil, gen, gece, yerel: true, uye: true });
  await u.p.waitForTimeout(1200);
  const uc = await u.p.evaluate(() => window.__admob.map((c) => c.ad));
  bekle(uc.length === 0, `reklamsız üyede AdMob çağrısı olmamalı (${uc.join(',')})`);
  await denetle(u.p, `${ad}-uye`, u.hatalar);
  await u.b.close();
}

try {
  if (!process.argv.includes('--uygulama')) {
    for (const dil of DILLER) { await dolas(dil, 360, false); process.stdout.write(`${dil} `); }
    await dolas('tr', 390, false);
    await dolas('ar', 340, true);
  }
  await uygulamaKipi('tr', 390, false);
  await uygulamaKipi('ar', 340, true);
  console.log(`\n${durumSayisi} durum denetlendi`);
} finally {
  await tarayici.close();
  kapat();
}
if (sorunlar.length) {
  console.log(`SORUN (${sorunlar.length}):\n  ` + [...new Set(sorunlar)].join('\n  '));
  process.exit(1);
}
console.log('tamam: konsol hatası, yatay taşma ve çevrilmemiş anahtar yok; banner şeridi ve reklam kuralları doğru');
