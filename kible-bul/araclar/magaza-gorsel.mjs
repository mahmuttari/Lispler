#!/usr/bin/env node
// Kıble Bul — Google Play mağaza görselleri (Playwright + Chromium; bağımlılıksız):
//   magaza/play/simge-512.png                       uygulamanın kendi uyarlanabilir simgesi (arka plan + ön plan katmanı,
//                                                   android/app/src/main/res/mipmap-xxxhdpi), 512×512, 32 bit
//   magaza/play[/<dil>]/telefon-1…5-*.png           1080×1920: uygulamanın gerçek ekranları (www/, 360×640 × 3), dilin
//                                                   kendi şehriyle: pusula (kıbleye dönük), harita, yer arama,
//                                                   kalibrasyon, altın stil + gece modu
//   magaza/play[/<dil>]/tanitim-gorseli-1024x500.png simge, uygulamanın adı ve sloganı (dil dosyasından), uygulamanın
//                                                   pusula kadranı; cihaz görüntüsü yok, fiyat yok; Arapçada aynalı. 24 bit
//
//   node kible-bul/araclar/magaza-gorsel.mjs [play-dili…]      (ör. tr-TR ar; boşsa 11 dilin hepsi)
//
// Ekranlar tarayıcı kipindedir (reklam yok; reklamsız üyenin gördüğü ekran). Uydu karoları NASA GIBS'ten uygulamanın
// istediği adresle gelir (ortak.mjs › karoYolu; önbellek kible-bul/.karo, depoya girmez). Konum gerçek değildir:
// her dilde o dilin büyük bir şehri elle seçilmiş gibi verilir.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { KB, sunucuAc, karoYolu, playwright, CHROMIUM } from './ortak.mjs';

const MAGAZA = path.join(KB, 'magaza', 'play');
const MIPMAP = path.join(KB, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi');

// Play dili → uygulama dili, şehir (cities.txt adıyla), yer araması
export const DILLER = {
  'tr-TR': { dil: 'tr', sehir: ['Istanbul', 'TR', 41.014, 28.95], ara: 'İzm' },
  'en-US': { dil: 'en', sehir: ['New York City', 'US', 40.714, -74.006], ara: 'Birm' },
  'de-DE': { dil: 'de', sehir: ['Berlin', 'DE', 52.524, 13.411], ara: 'Mün' },
  'fr-FR': { dil: 'fr', sehir: ['Paris', 'FR', 48.853, 2.349], ara: 'Mars' },
  'es-ES': { dil: 'es', sehir: ['Madrid', 'ES', 40.416, -3.703], ara: 'Sev' },
  'it-IT': { dil: 'it', sehir: ['Rome', 'IT', 41.892, 12.511], ara: 'Nap' },
  'pt-BR': { dil: 'pt', sehir: ['São Paulo', 'BR', -23.547, -46.636], ara: 'Rio' },
  'ru-RU': { dil: 'ru', sehir: ['Kazan', 'RU', 55.789, 49.122], ara: 'Мос' },
  ar: { dil: 'ar', sehir: ['Cairo', 'EG', 30.063, 31.25], ara: 'الإسك' },
  'ja-JP': { dil: 'ja', sehir: ['Tokyo', 'JP', 35.69, 139.692], ara: '大阪' },
  'ko-KR': { dil: 'ko', sehir: ['Seoul', 'KR', 37.566, 126.978], ara: '대' },
};

const secim = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DILLER);
for (const d of secim) if (!DILLER[d]) throw new Error(`bilinmeyen dil: ${d} (${Object.keys(DILLER).join(', ')})`);

/** Playwright'ın PNG'si saydamlık kanalı taşıyabilir: Play ekran görüntüsü ve tanıtım görseli 24 bit olmalı */
function saydamsiz(f) { execFileSync('convert', [f, '-background', '#06281d', '-alpha', 'remove', '-alpha', 'off', 'PNG24:' + f]); }

// 512 simge: uyarlanabilir simgenin iki katmanı (432 px, 108 dp) üst üste; ortadaki 400 px (Play maskesi köşeleri kendisi
// yuvarlar, simgenin önemli kısmı güvenli alanda kalır) 512'ye büyütülür. 32 bit PNG (RGBA).
function simge() {
  const hedef = path.join(MAGAZA, 'simge-512.png');
  fs.mkdirSync(MAGAZA, { recursive: true });
  execFileSync('convert', [path.join(MIPMAP, 'ic_launcher_background.png'), path.join(MIPMAP, 'ic_launcher_foreground.png'), '-composite',
    '-gravity', 'center', '-crop', '400x400+0+0', '+repage', '-resize', '512x512', '-define', 'png:color-type=6', 'PNG32:' + hedef]);
  console.log('  simge-512.png');
  return hedef;
}

const { adres, kapat } = await sunucuAc();
const { chromium } = await playwright();
const tarayici = await chromium.launch({ executablePath: CHROMIUM });
const simgeYolu = simge();
const simgeVeri = 'data:image/png;base64,' + fs.readFileSync(simgeYolu).toString('base64');

try {
  for (const playDili of secim) {
    const D = DILLER[playDili];
    const cikis = playDili === 'tr-TR' ? MAGAZA : path.join(MAGAZA, playDili);
    fs.mkdirSync(cikis, { recursive: true });
    for (const f of fs.readdirSync(cikis)) if (/^telefon-.*\.png$/.test(f)) fs.rmSync(path.join(cikis, f));
    const b = await tarayici.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, locale: D.dil });
    await karoYolu(b, path.join(KB, '.karo'));
    await b.route(/^https?:\/\/(?!127\.0\.0\.1|gibs\.earthdata)/, (r) => r.abort());
    const [ad, cc, lat, lon] = D.sehir;
    await b.addInitScript(([ad, cc, lat, lon]) => {
      if (localStorage.getItem('kible-bul.v1')) return;   // her açılışta değil: 5. ekran ayarları değiştirir
      localStorage.setItem('kible-bul.v1', JSON.stringify({ onboarded: true, recents: [], settings: {},
        place: { mode: 'manual', lat, lon, name: ad, cc, at: Date.now() } }));
    }, [ad, cc, lat, lon]);
    const p = await b.newPage();
    const hatalar = [];
    p.on('pageerror', (e) => hatalar.push(String(e)));
    const ac = async (sorgu = '') => {
      await p.goto(adres + `?lang=${D.dil}&heading=0${sorgu}`);
      await p.waitForFunction(() => document.querySelector('#tabbar button'), null, { timeout: 10000 });
      // şehir adları dilin dosyasından gelsin
      await p.waitForFunction(() => !/,\s*$/.test(document.querySelector('.card.loc .nm')?.textContent || ''), null, { timeout: 10000 });
      await p.waitForTimeout(700);
    };
    const cek = async (dosya) => { const f = path.join(cikis, dosya); await p.screenshot({ path: f }); saydamsiz(f); console.log(`  ${playDili}/${dosya}`); };
    // telefon kıbleye dönük: manyetik yön = kıble açısı − sapma (uygulama gerçek kuzeye çevirir); algılayıcı "yüksek doğruluk"
    const kibleyeDon = () => p.evaluate(async () => {
      const m = await import('./js/place.js');
      const i = m.info();
      window.__kibleHeading(i.bearing - i.decl + 0.8);
      window.__kibleStatus(3, i.fieldUt);
    });

    // 1. pusula
    await ac();
    await kibleyeDon();
    await p.waitForTimeout(1300);
    await cek('telefon-1-pusula.png');
    // tanıtım görseli için kadranın kendisi, saydam zeminde (doğruluk çipi olmadan)
    const gizle = '#scr-compass > :not(.dial-wrap), #tabbar, .qchip, #reklam-serit';
    await p.evaluate((g) => { document.body.style.background = 'transparent'; document.querySelectorAll(g).forEach((e) => { e.style.visibility = 'hidden'; }); }, gizle);
    const kk = await p.locator('.dial').boundingBox();
    const pay = 18;   // gölge, ışıltı halkası ve üstteki işaret kadranın kutusundan taşar
    const kadran = await p.screenshot({ omitBackground: true, clip: { x: kk.x - pay, y: kk.y - pay, width: kk.width + 2 * pay, height: kk.height + 2 * pay } });
    await p.evaluate((g) => { document.body.style.background = ''; document.querySelectorAll(g).forEach((e) => { e.style.visibility = ''; }); }, gizle);

    // 2. harita
    await p.locator('#tabbar button[data-tab="map"]').click();
    await p.waitForTimeout(800);
    await p.waitForFunction(() => [...document.querySelectorAll('img.leaflet-tile')].every((t) => t.complete), null, { timeout: 30000 })
      .catch(() => console.log('  (karoların bir kısmı gecikti)'));
    await p.waitForTimeout(900);
    await cek('telefon-2-harita.png');

    // 3. yer arama
    await p.locator('#tabbar button[data-tab="place"]').click();
    await p.fill('input.search', D.ara);
    await p.waitForFunction(() => document.querySelectorAll('.list .item').length >= 3, null, { timeout: 10000 });
    await p.evaluate(() => document.activeElement.blur());
    await p.waitForTimeout(400);
    await cek('telefon-3-yer-arama.png');

    // 4. kalibrasyon: telefonu sekiz çizer gibi döndürüp eğmek (tarayıcının yön olaylarıyla), çubuk yolun bir kısmına gelir
    await p.locator('#tabbar button[data-tab="compass"]').click();
    await p.locator('.ibtn.gear').click();
    await p.locator('.calcard .bigbtn').click();
    await p.evaluate(async () => {
      window.__kibleStatus(null);   // tarayıcının yön olayları sayılsın (yerel algılayıcı yok)
      for (let k = 0; k <= 24; k++) {
        const a = (k * 9) % 360, be = 40 * Math.sin(k / 6), ga = 35 * Math.cos(k / 5);
        window.dispatchEvent(new DeviceOrientationEvent('deviceorientationabsolute', { alpha: a, beta: be, gamma: ga, absolute: true }));
        await new Promise((r) => setTimeout(r, 5));
      }
      const m = await import('./js/place.js');
      window.__kibleStatus(2, m.info().fieldUt);   // kalibrasyon sürerken Android'in değerlendirmesi: orta
    });
    await p.waitForTimeout(300);
    await cek('telefon-4-kalibrasyon.png');

    // 5. altın stil + gece modu, 2B Kâbe
    // uygulamanın kendi durumu üzerinden (sayfa kapanırken durumu yeniden yazar)
    await p.evaluate(async () => {
      const m = await import('./js/state.js');
      Object.assign(m.S.settings, { style: 'gold', night: true, kaaba: '2d' });
      m.save(true);
    });
    await ac();
    await kibleyeDon();
    await p.waitForTimeout(1300);
    await cek('telefon-5-gece-altin.png');
    await b.close();
    if (hatalar.length) throw new Error(`${playDili}: ${hatalar.join(' | ')}`);

    // tanıtım görseli
    const ui = (await import(`../www/js/lang/${D.dil}.js`)).default.ui;
    const rtl = D.dil === 'ar';
    const t = await tarayici.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
    await t.setContent(`<!doctype html><html dir="${rtl ? 'rtl' : 'ltr'}" lang="${D.dil}"><meta charset="utf-8"><style>
      html,body{margin:0;width:1024px;height:500px;overflow:hidden}
      body{background:radial-gradient(circle at ${rtl ? '78%' : '22%'} 40%, #17694c 0%, #0b3d2c 45%, #04201a 100%);font-family:system-ui,"Noto Sans","Noto Sans Arabic","Noto Sans CJK JP",sans-serif;color:#f6efd8;display:flex;align-items:center}
      .yazi{flex:1;min-width:0;padding:0 40px;display:flex;flex-direction:column;gap:18px}
      .simge{width:132px;height:132px;border-radius:30px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
      h1{margin:0;font:700 62px/1.1 "Noto Serif",Georgia,serif;color:#f6e2a2;white-space:nowrap;overflow:hidden}
      p{margin:0;font-size:30px;opacity:.92}
      .kadran{width:460px;height:460px;margin:0 22px;display:grid;place-items:center}
      .kadran img{width:460px;height:460px}
    </style><body><div class="yazi"><img class="simge" src="${simgeVeri}"><h1>${ui['app.name']}</h1><p>${ui['app.tagline']}</p></div>
    <div class="kadran"><img src="data:image/png;base64,${kadran.toString('base64')}"></div></body></html>`);
    // ad tek satıra sığsın: sığmazsa yazı küçülür
    await t.evaluate(() => { const h = document.querySelector('h1'); let f = 62; while (h.scrollWidth > h.clientWidth && f > 30) h.style.fontSize = (f -= 2) + 'px'; });
    await t.waitForTimeout(300);
    const tf = path.join(cikis, 'tanitim-gorseli-1024x500.png');
    await t.screenshot({ path: tf });
    saydamsiz(tf);
    await t.close();
    console.log(`  ${playDili}/tanitim-gorseli-1024x500.png`);
  }
} finally {
  await tarayici.close();
  kapat();
}
