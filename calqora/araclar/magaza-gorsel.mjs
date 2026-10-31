#!/usr/bin/env node
// Calqora — Play mağaza görselleri (Playwright + Chromium; yalnız yerelde).
//   node calqora/araclar/magaza-gorsel.mjs [play-dili…]
// Çıktı: tr-TR → magaza/play/, öbür diller → magaza/play/<play-dili>/ (android/play.mjs `gorsel` bu klasörleri yükler).
// - telefon-1…6-*.png: uygulamanın gerçek ekranları (www/), uydurma veriyle; 360×640 CSS px × 3 = 1080×1920. Reklam yok
//   (tarayıcıda AdMob eklentisi yoktur), fiyat ve "Pro" yazısı yok.
// - tanitim-gorseli-1024x500.png: simge + ad + bir satır özellik; Arapçada ayna (sağdan sola).
// - simge-512.png (yalnız tr-TR klasöründe; Play öbür dillerde onu kullanır): uygulamanın kendi uyarlanabilir simgesi
//   (android/app/src/main/res/mipmap-xxxhdpi arka plan + ön plan katmanı, başlatıcının gösterdiği orta 72/108 bölge), 32 bit.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sunucuBaslat } from './sunucu.mjs';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const RES = path.join(KOK, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi');

// Play dili → uygulama dili, ondalık virgülü, tanıtım görselinin alt başlığı ve özellik satırı
const DILLER = {
  'tr-TR': { dil: 'tr', virgul: true, alt: 'Bilimsel hesap makinesi', satir: 'Grafik · Karmaşık sayılar · Matrisler · Birimler' },
  'en-US': { dil: 'en', virgul: false, alt: 'Scientific calculator', satir: 'Graphs · Complex numbers · Matrices · Units' },
  'de-DE': { dil: 'de', virgul: true, alt: 'Wissenschaftlicher Rechner', satir: 'Graphen · Komplexe Zahlen · Matrizen · Einheiten' },
  'fr-FR': { dil: 'fr', virgul: true, alt: 'Calculatrice scientifique', satir: 'Graphiques · Nombres complexes · Matrices · Unités' },
  'es-ES': { dil: 'es', virgul: true, alt: 'Calculadora científica', satir: 'Gráficas · Números complejos · Matrices · Unidades' },
  'it-IT': { dil: 'it', virgul: true, alt: 'Calcolatrice scientifica', satir: 'Grafici · Numeri complessi · Matrici · Unità' },
  'pt-BR': { dil: 'pt', virgul: true, alt: 'Calculadora científica', satir: 'Gráficos · Números complexos · Matrizes · Unidades' },
  'ru-RU': { dil: 'ru', virgul: true, alt: 'Научный калькулятор', satir: 'Графики · Комплексные числа · Матрицы · Единицы' },
  ar: { dil: 'ar', virgul: false, alt: 'آلة حاسبة علمية', satir: 'رسوم بيانية · أعداد مركبة · مصفوفات · وحدات', rtl: true },
  'ja-JP': { dil: 'ja', virgul: false, alt: '関数電卓', satir: 'グラフ · 複素数 · 行列 · 単位換算' },
  'ko-KR': { dil: 'ko', virgul: false, alt: '공학용 계산기', satir: '그래프 · 복소수 · 행렬 · 단위 변환' },
};
const secim = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DILLER);
// IOS=1: App Store (iPhone 6,9″) 1320×2868 (440×956, 3×) → magaza/app-store/<App Store dili>/iphone-*.jpg (JPEG); simge ve tanıtım görseli yok
const IOS = process.env.IOS === '1';
const AS_DIL = { 'tr-TR': 'tr', 'it-IT': 'it', 'ru-RU': 'ru', ar: 'ar-SA', 'ja-JP': 'ja', 'ko-KR': 'ko' };   // Play dili → App Store dili
for (const d of secim) if (!DILLER[d]) throw new Error(`bilinmeyen dil: ${d}`);

const sunucu = await sunucuBaslat({ '/_res/arka.png': path.join(RES, 'ic_launcher_background.png'), '/_res/on.png': path.join(RES, 'ic_launcher_foreground.png') });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });

/** Uyarlanabilir simgenin başlatıcıda görünen hâli (108 dp katmanın ortadaki 72 dp'si), istenen boyda, PNG verisi */
async function simge(boy) {
  const p = await b.newPage();
  await p.goto(sunucu.adres + 'index.html');
  const url = await p.evaluate(async (boy) => {
    const yukle = (u) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = u; });
    const [arka, on] = await Promise.all([yukle('/_res/arka.png'), yukle('/_res/on.png')]);
    const c = document.createElement('canvas'); c.width = c.height = boy;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    const k = arka.width, kes = k * 72 / 108, bas = (k - kes) / 2;
    x.drawImage(arka, bas, bas, kes, kes, 0, 0, boy, boy);
    x.drawImage(on, bas, bas, kes, kes, 0, 0, boy, boy);
    return c.toDataURL('image/png');
  }, boy);
  await p.close();
  return Buffer.from(url.split(',')[1], 'base64');
}

const ayarlar = (d, tema, ek = {}) => ({ lang: d.dil, theme: tema, angle: 'deg', complex: false, fmt: 'norm', digits: 4, comma: d.virgul, polar: false, gAngle: 'rad', ...ek });
const ondalik = (d, s) => (d.virgul ? s.replace(/,/g, ';').replace(/\./g, ',') : s);

/** Bir sahne: localStorage durumu yazılır, sayfa açılır, `hazirla` sayfada çalışır, ekran görüntüsü alınır */
async function sahne(d, cikis, ad, durum, hazirla) {
  const p = await b.newPage({ viewport: IOS ? { width: 440, height: 956 } : { width: 360, height: 640 }, deviceScaleFactor: 3, colorScheme: durum.settings.theme });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript((durum) => { localStorage.setItem('calqora.v1', JSON.stringify(durum)); }, durum);
  await p.goto(sunucu.adres + 'index.html');
  await p.waitForSelector('#tabbar button');
  await p.waitForTimeout(300);
  if (hazirla) await hazirla(p);
  await p.waitForTimeout(450);
  await p.screenshot(IOS ? { path: path.join(cikis, ad.replace('telefon-', 'iphone-').replace(/\.png$/, '.jpg')), type: 'jpeg', quality: 82 }
    : { path: path.join(cikis, ad) });
  await p.close();
  if (hatalar.length) throw new Error(`${ad}: ${hatalar.join(' | ')}`);
}

try {
  const simge512 = await simge(512);
  const simge300 = 'data:image/png;base64,' + (await simge(600)).toString('base64');
  for (const playDili of secim) {
    const d = DILLER[playDili];
    const cikis = IOS ? path.join(KOK, 'magaza', 'app-store', AS_DIL[playDili] || playDili)
      : playDili === 'tr-TR' ? path.join(KOK, 'magaza', 'play') : path.join(KOK, 'magaza', 'play', playDili);
    fs.mkdirSync(cikis, { recursive: true });
    for (const f of fs.readdirSync(cikis)) if (/^(telefon|iphone)-.*\.(png|jpg)$/.test(f)) fs.rmSync(path.join(cikis, f));
    if (playDili === 'tr-TR' && !IOS) fs.writeFileSync(path.join(cikis, 'simge-512.png'), simge512);
    const gecmis = [
      { e: '2^10', t: '1024', p: '1024' },
      { e: ondalik(d, 'nCr(10,3)'), t: '120', p: '120' },
      { e: 'sin(30)+cos(60)', t: '1', p: '1' },
    ];

    // 1. Hesap: kök çizgileri, sonuç ve kesir gösterimi
    await sahne(d, cikis, 'telefon-1-hesap.png', { settings: ayarlar(d, 'light'), expr: '√(3²+4²)÷3+∛(27)', history: gecmis }, async (p) => {
      await p.click('.key[data-k="eq"]');
      await p.waitForTimeout(150);
      await p.click('.acts .chip.btn');   // a/b: 14/3
    });
    // 2. Grafik: üç fonksiyon, iki eğrinin kesişimi işaretli (koyu tema)
    await sahne(d, cikis, 'telefon-2-grafik.png', {
      settings: ayarlar(d, 'dark'),
      graph: { fns: [{ s: 'sin(x)', on: true }, { s: 'x^2/10', on: true }, { s: '2cos(x/2)-1', on: true }], cx: 3.4, cy: 0.5, sx: 30, sy: 30 },
    }, async (p) => {
      await p.click('#tabbar button[data-tab="graph"]');
      await p.waitForTimeout(300);
      await p.click('#tab-graph .gact:last-child .pill:nth-child(3)');   // kesişim
    });
    // 3. Matris: 3×3 matrisin tersi
    await sahne(d, cikis, 'telefon-3-matris.png', {
      settings: ayarlar(d, 'light'),
      matrices: { sel: 'A', x: 'A', y: 'B', k: '2', n: '2', A: { r: 3, c: 3, v: [['2', '1', '1'], ['1', '3', '2'], ['1', '0', '0']] }, B: { r: 3, c: 1, v: [['4'], ['5'], ['6']] }, C: { r: 2, c: 2, v: [['1', '0'], ['0', '1']] } },
    }, async (p) => {
      await p.click('#tabbar button[data-tab="matrix"]');
      await p.waitForTimeout(200);
      await p.click('#tab-matrix .pill.mono:nth-child(8)');   // X⁻¹
      await p.waitForTimeout(600);
      await p.evaluate(() => { const s = document.querySelector('#tab-matrix .scroll'); s.scrollTop = s.scrollHeight; });
    });
    // 4. Birimler: basınç, 2,5 bar bütün birimlerde
    await sahne(d, cikis, 'telefon-4-birimler.png', { settings: ayarlar(d, 'light'), units: { page: 'units', cat: 'pressure', from: 4, value: d.virgul ? '2,5' : '2.5' } }, async (p) => {
      await p.click('#tabbar button[data-tab="units"]');
    });
    // 5. Sabitler (koyu tema), bir sabit açık
    await sahne(d, cikis, 'telefon-5-sabitler.png', { settings: ayarlar(d, 'dark'), units: { page: 'consts', cat: 'length', from: 0, value: '1' } }, async (p) => {
      await p.click('#tabbar button[data-tab="units"]');
      await p.waitForTimeout(200);
      await p.click('#tab-units .urow:nth-of-type(3)');
    });
    // 6. Karmaşık sayılar: karmaşık kip açık, a+bi sonucu
    await sahne(d, cikis, 'telefon-6-karmasik.png', { settings: ayarlar(d, 'light', { complex: true, angle: 'deg' }), expr: '(1+2i)×(3−i)+√(−4)', history: gecmis }, async (p) => {
      await p.click('.key[data-k="eq"]');
    });

    // Tanıtım görseli
    if (IOS) { console.log(`${playDili}: ${cikis}`); continue; }
    const t = await b.newPage({ viewport: { width: 1024, height: 500 } });
    await t.setContent(`<!doctype html><html dir="${d.rtl ? 'rtl' : 'ltr'}" lang="${d.dil}"><head><meta charset="utf-8"><style>
      html,body{margin:0;width:1024px;height:500px;overflow:hidden;font-family:system-ui,"Segoe UI",Roboto,sans-serif;color:#fff}
      body{background:linear-gradient(135deg,#3b82f6 0%,#2563eb 45%,#1e3a8a 100%);display:flex;align-items:center;gap:52px;padding:0 72px;box-sizing:border-box;position:relative}
      body::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);background-size:40px 40px}
      img{width:280px;height:280px;border-radius:64px;box-shadow:0 22px 60px rgba(8,20,60,.55);flex:none;position:relative}
      .m{position:relative;min-width:0}
      h1{margin:0 0 6px;font-size:96px;line-height:1;font-weight:800;letter-spacing:-1px;direction:ltr;text-align:${d.rtl ? 'right' : 'left'}}
      h2{margin:0 0 26px;font-size:40px;line-height:1.2;font-weight:600;color:#dbe6ff}
      p{margin:0;font-size:27px;line-height:1.35;font-weight:600;color:#fdba74}
      .s{position:absolute;font:600 64px ui-monospace,monospace;color:rgba(255,255,255,.13);direction:ltr}</style></head><body>
      <img src="${simge300}"><div class="m"><h1>Calqora</h1><h2>${d.alt}</h2><p>${d.satir}</p></div>
      <div class="s" style="${d.rtl ? 'left' : 'right'}:48px;top:30px">∫</div><div class="s" style="${d.rtl ? 'left' : 'right'}:120px;bottom:28px;font-size:52px">Σ</div>
      </body></html>`);
    await t.waitForTimeout(300);
    await t.screenshot({ path: path.join(cikis, 'tanitim-gorseli-1024x500.png') });
    await t.close();
    console.log(`${playDili}: ${cikis}`);
  }
} finally {
  await b.close();
  sunucu.kapat();
}
