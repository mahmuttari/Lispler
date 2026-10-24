#!/usr/bin/env node
// İz Haritası — Google Play mağaza görselleri (Playwright + Chromium; bağımlılıksız):
//   magaza/play/simge-512.png                 GENEL-KONULAR'daki tam kare (maskelenebilir) simge; 32 bit PNG
//   magaza/play/telefon-1…6-*.png             1080×1920: Play sürümünün kendi sayfası (assets/www/index.html),
//                                            yerel köprü taklidiyle (uygulamadaki görünüm) ve 🧪 Benzetim verisiyle
//   magaza/play/tanitim-gorseli-1024x500.png  ad, bir cümle ve 1. ekran görüntüsünden kart ile harita kesiti (Play'in
//                                            önerisi: cihaz görüntüsü kullanılmaz); 24 bit PNG
//
//   node iz-haritasi/araclar/magaza-gorsel.mjs [GENEL-KONULAR/airtag-harita yolu]
//
// Sayfa, uygulamadaki gibi https://appassets.androidplatform.net/ adresinden sunulur ve kullanıcı aracısına uygulamanın
// eki ("IzHaritasi/<sürüm> (+adres)") konur: harita karoları OpenStreetMap'ten uygulamanın göndereceği Referer ve
// kullanıcı aracısıyla istenir. OSM, tarayıcı kimliğiyle gelip Referer taşımayan isteği engeller ("x-blocked: No referer
// sent"); file:// ile açılan sayfa bu yüzden kullanılmaz. Bu ekranlar telefondaki karo isteğinin kabul edildiğini de
// gösterir. Benzetim İzmit'te sanal bir yürüyüştür; ekranlardaki cihazlar ve konumlar gerçek değildir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const IZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK = path.resolve(process.argv[2] || path.join(IZ, '..', '..', 'GENEL-KONULAR', 'airtag-harita'));
const SAYFA = path.join(IZ, 'android', 'app', 'src', 'main', 'assets', 'www', 'index.html');
const CIKIS = path.join(IZ, 'magaza', 'play');
const SIMGE = path.join(KAYNAK, 'simgeler', 'simge-maskeli-512.png');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);

for (const f of [SAYFA, SIMGE]) if (!fs.existsSync(f)) throw new Error(`yok: ${f}`);
fs.mkdirSync(CIKIS, { recursive: true });
const KOK = 'https://appassets.androidplatform.net/';
const adres = `${KOK}index.html?benzetim=1`;
const SURUM = /versionName\s+'([^']+)'/.exec(fs.readFileSync(path.join(IZ, 'android', 'app', 'build.gradle'), 'utf8'))[1];
const veri = (f, tur) => `data:${tur};base64,${fs.readFileSync(f).toString('base64')}`;

/** Android uygulamasındaki AirTagYerel köprüsünün taklidi: sayfa "yerel kip"te açılır (Cihaz seç düğmesi yok,
 *  tarama bayraksız), reklam kancaları var. Benzetim köprüyü kullanmaz. */
function yerelKopru() {
  const yanit = (no, deger) => setTimeout(() => window.__airtagYerel('sonuc', { no, tamam: true, ...(deger ? { deger } : {}) }), 20);
  window.AirTagYerel = {
    surum: () => '1',
    bluetoothDurumu: () => 'acik',
    yaziOlcegi: () => 1,
    taramaBaslat: (no) => yanit(no),
    taramaDurdur: () => {},
    sesCal: (no) => yanit(no, 'airtag'),
    adOku: (no) => yanit(no, 'AirTag'),
    dosyaKaydet: (no, ad) => yanit(no, ad),
    ekranAcik: () => {},
    titret: () => {},
    reklamGoster: () => {},
    gizlilikSecenekleriGerekli: () => false,
    gizlilikSecenekleriAc: () => {},
  };
}

const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
try {
  const ua = (await tarayici.newPage().then((p) => p.evaluate(() => navigator.userAgent))).replace('HeadlessChrome', 'Chrome');
  const baglam = (tema) => tarayici.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    colorScheme: tema,
    locale: 'tr-TR',
    // AnaEtkinlik.java ile aynı ek
    userAgent: `${ua} IzHaritasi/${SURUM} (+https://mahmuttari.github.io/Lispler/iz-haritasi/)`,
  });
  const hazirla = async (tema) => {
    const b = await baglam(tema);
    // AnaEtkinlik.shouldInterceptRequest'in yaptığı: sayfa uygulamanın içinden sunulur
    await b.route(`${KOK}**`, (r) => (new URL(r.request().url()).pathname === '/index.html'
      ? r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(SAYFA) })
      : r.fulfill({ status: 404 })));
    let engel = 0;
    b.on('response', (y) => { if (y.headers()['x-blocked']) engel += 1; });
    await b.addInitScript(yerelKopru);
    const p = await b.newPage();
    const hatalar = [];
    p.on('pageerror', (h) => hatalar.push(String(h)));
    p.on('console', (m) => m.type() === 'error' && !/tile\.openstreetmap/.test(m.text()) && hatalar.push(m.text()));
    await p.goto(adres);
    await p.waitForFunction(() => document.querySelectorAll('#liste > li').length >= 4, null, { timeout: 20000 });
    return { b, p, hatalar, engel: () => engel };
  };
  // Karolar yüklensin, geçişler bitsin
  const otur = async (p, ms = 900) => {
    await p.waitForFunction(() => [...document.querySelectorAll('img.leaflet-tile')].every((t) => t.complete), null, { timeout: 20000 })
      .catch(() => console.log('  (karoların bir kısmı gecikti)'));
    await p.waitForTimeout(ms);
  };
  const cek = async (p, ad) => {
    await p.screenshot({ path: path.join(CIKIS, ad) });
    console.log(`  ${ad}`);
  };
  const uyariBekle = (p) => p.waitForFunction(
    () => document.querySelector('#bildirim')?.textContent.includes('farklı yerde seninleydi'), null, { timeout: 30000 });
  // Benzetimde telefon yürüdükçe kestirim daralır (yaklaşık 30 sn); uygulamanın kendi "odaklan" eşiği ±25 m beklenir
  const kestirimBekle = (p) => p.waitForFunction(() => {
    const t = window.airtagHarita?.uyg?.tahmin;
    return t?.kip === 'nokta' && t.yaricap95 < 25;
  }, null, { timeout: 120000 });
  const uyariKapat = async (p) => {
    await p.click('#bildirim button[aria-label="Kapat"]');
    await p.waitForTimeout(300);
  };
  const kart = (p, ad) => p.locator('#liste > li', { hasText: ad });
  // "📍 Harita" haritayı ölçümlere, kestirime VE telefonun bütün izine sığdırır; benzetimin bir saatlik geçmişiyle bu
  // kilometrelerce bir alandır. Mağaza karesi için kestirime yaklaşılır: harita, kestirim işareti ortaya gelecek kadar
  // sürüklenir, sonra yakınlaştırma düğmesiyle (merkez yerinde kalır) %95 elipsi seçilecek kadar büyütülür.
  const kestirimeYaklas = async (p) => {
    const orta = async () => {
      const m = await p.locator('#harita').boundingBox();
      const k = await p.locator('.hk-tahmin').first().boundingBox();
      const [mx, my] = [k.x + k.width / 2, k.y + k.height / 2];
      const [vx, vy] = [m.x + m.width / 2 - mx, m.y + m.height * 0.45 - my];
      await p.mouse.move(mx + 30, my + 30);
      await p.mouse.down();
      await p.mouse.move(mx + 30 + vx, my + 30 + vy, { steps: 12 });
      await p.mouse.up();
      await p.waitForTimeout(400);
    };
    await orta();
    for (let i = 0; i < 9; i++) {
      const e = await p.locator('.hk-elips').first().boundingBox();
      if (e && e.width >= 70) break;
      await p.click('.leaflet-control-zoom-in');
      await p.waitForTimeout(450);
    }
    await orta();
  };
  const seciliBasta = (p) => p.evaluate(() => document.querySelector('#liste > li.secili')?.scrollIntoView({ block: 'start' }));

  // Açık tema: beş ekran
  {
    const { b, p, hatalar, engel } = await hazirla('light');
    await uyariBekle(p);
    await kart(p, 'Çantadaki yabancı').scrollIntoViewIfNeeded();
    await otur(p);
    await cek(p, 'telefon-2-takip-uyarisi.png');

    await kestirimBekle(p);
    await uyariKapat(p);
    await kart(p, 'Kayıp anahtarlık').getByRole('button', { name: '📍 Harita' }).click();
    await p.waitForTimeout(600);
    await kestirimeYaklas(p);
    await seciliBasta(p);
    await otur(p, 1500);
    await cek(p, 'telefon-1-harita.png');

    await kart(p, 'Kayıp anahtarlık').getByRole('button', { name: '🎯 Bul' }).click();
    await p.waitForTimeout(2500);
    await cek(p, 'telefon-3-bul.png');
    await p.click('#bul button[value="kapat"]');

    await kart(p, 'Çantadaki yabancı').getByRole('button', { name: 'Ayrıntılar' }).click();
    await p.waitForFunction(() => document.querySelectorAll('#cp-gecmis li').length >= 3);
    await p.evaluate(() => document.querySelector('#cp-gecmis')?.scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(400);
    await cek(p, 'telefon-4-konum-gecmisi.png');
    await p.click('#cp-gecmis-harita');
    await p.waitForFunction(() => document.querySelectorAll('.hk-gecmis').length >= 3);
    await otur(p, 1500);
    await cek(p, 'telefon-5-gecmis-haritada.png');

    if (hatalar.length) throw new Error(`sayfa hatası: ${hatalar.join(' | ')}`);
    if (engel()) throw new Error(`OpenStreetMap ${engel()} karoyu engelledi (x-blocked)`);
    await b.close();
  }

  // Koyu tema: ana ekran
  {
    const { b, p, hatalar, engel } = await hazirla('dark');
    await uyariBekle(p);
    await kestirimBekle(p);
    await uyariKapat(p);
    await kart(p, 'Kayıp anahtarlık').getByRole('button', { name: '📍 Harita' }).click();
    await p.waitForTimeout(600);
    await kestirimeYaklas(p);
    await seciliBasta(p);
    await otur(p, 1500);
    await cek(p, 'telefon-6-koyu-tema.png');
    if (hatalar.length) throw new Error(`sayfa hatası: ${hatalar.join(' | ')}`);
    if (engel()) throw new Error(`OpenStreetMap ${engel()} karoyu engelledi (x-blocked)`);
    await b.close();
  }

  // Simge: tam kare (Play köşeleri kendisi yuvarlar). Play "32 bit PNG (alfa kanallı)" ister; ekran görüntüsü opak
  // görüntüyü 24 bit yazdığı için simge tuvalden (canvas) alınır: tuvalin PNG'si her zaman RGBA'dır.
  {
    const p = await tarayici.newPage({ viewport: { width: 512, height: 512 } });
    const b64 = await p.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = Object.assign(document.createElement('canvas'), { width: 512, height: 512 });
      c.getContext('2d').drawImage(img, 0, 0, 512, 512);
      return c.toDataURL('image/png').split(',')[1];
    }, veri(SIMGE, 'image/png'));
    fs.writeFileSync(path.join(CIKIS, 'simge-512.png'), Buffer.from(b64, 'base64'));
    console.log('  simge-512.png');
    await p.close();
  }

  // Tanıtım görseli: 1024×500, saydamlık yok
  {
    const p = await tarayici.newPage({ viewport: { width: 1024, height: 500 } });
    await p.setContent(`<!doctype html><meta charset="utf-8"><style>
      html,body{margin:0;width:1024px;height:500px;overflow:hidden}
      body{background:linear-gradient(135deg,#1c5cab 0%,#143f78 100%);font-family:"Liberation Sans","DejaVu Sans",sans-serif;color:#fff;position:relative}
      .yazi{position:absolute;left:64px;top:84px;width:560px}
      .simge{width:104px;height:104px;border-radius:24px;display:block;box-shadow:0 6px 18px rgba(0,0,0,.25)}
      h1{margin:28px 0 12px;font-size:68px;line-height:1;letter-spacing:-1px}
      p{margin:0;font-size:29px;line-height:1.3;color:#dceafc}
      .cipler{margin-top:26px;display:flex;gap:10px;flex-wrap:wrap}
      .cip{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:7px 15px;font-size:21px}
      .ekran{position:absolute;right:84px;top:62px;width:288px;height:376px;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 14px 36px rgba(0,0,0,.35)}
      .ekran img{position:absolute;left:0;top:-136px;width:288px;display:block}
    </style>
    <div class="yazi">
      <img class="simge" src="${veri(SIMGE, 'image/png')}" alt="">
      <h1>İz Haritası</h1>
      <p>Yakındaki izleyicileri bul,<br>yerini haritada gör.</p>
      <div class="cipler"><span class="cip">📡 Tara</span><span class="cip">🎯 Bul</span><span class="cip">🕘 Geçmiş</span><span class="cip">⚠️ Takip uyarısı</span></div>
    </div>
    <div class="ekran"><img src="${veri(path.join(CIKIS, 'telefon-1-harita.png'), 'image/png')}" alt=""></div>`);
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(CIKIS, 'tanitim-gorseli-1024x500.png') });
    console.log('  tanitim-gorseli-1024x500.png');
    await p.close();
  }
} finally {
  await tarayici.close();
}
console.log(CIKIS);
