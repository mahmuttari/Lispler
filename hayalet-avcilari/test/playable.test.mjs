// Hayalet Avcıları oynanabilir reklam sınaması (Playwright + Chromium).
// Çalıştırma: node test/playable.test.mjs
// Önce reklam/playable/paketle.py çalışır, sunucu kökü dist/playable olur.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAYABLE = path.join(KOK, 'reklam', 'playable');
const DIST = path.join(KOK, 'dist', 'playable');
const ZIP = path.join(KOK, 'dist', 'HayaletAvcilari-playable.zip');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);

// 1) Paketleme
execFileSync('python3', [path.join(PLAYABLE, 'paketle.py')], { cwd: KOK, stdio: 'inherit' });

const sonuclar = [];
let basarisiz = false;
async function sina(ad, fn) {
  try {
    await fn();
    sonuclar.push('✓ ' + ad);
  } catch (e) {
    basarisiz = true;
    sonuclar.push('✗ ' + ad + ': ' + String(e.message || e).split('\n')[0]);
  }
}

function zipDosyalari(dosya) {
  const b = fs.readFileSync(dosya);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (b.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  assert.ok(eocd >= 0, 'ZIP merkez dizini bulunamadı');
  const adet = b.readUInt16LE(eocd + 10);
  let konum = b.readUInt32LE(eocd + 16);
  const adlar = [];
  for (let i = 0; i < adet; i++) {
    assert.equal(b.readUInt32LE(konum), 0x02014b50, 'ZIP kaydı bozuk');
    const adUzun = b.readUInt16LE(konum + 28);
    const ekUzun = b.readUInt16LE(konum + 30);
    const yorumUzun = b.readUInt16LE(konum + 32);
    adlar.push(b.toString('utf8', konum + 46, konum + 46 + adUzun));
    konum += 46 + adUzun + ekUzun + yorumUzun;
  }
  return adlar;
}

// 2) ZIP ve HTML metin sınamaları
await sina('ZIP ≤ 1,5 MB, dosya sayısı ≤ 60, kökte index.html', () => {
  const boyut = fs.statSync(ZIP).size;
  assert.ok(boyut <= 1.5 * 1024 * 1024, 'ZIP boyutu: ' + boyut);
  const adlar = zipDosyalari(ZIP);
  assert.ok(adlar.length <= 60, 'Dosya sayısı: ' + adlar.length);
  assert.ok(adlar.includes('index.html'), 'index.html kökte yok');
  for (const ad of adlar) {
    assert.ok(!ad.startsWith('/') && !ad.includes('..'), 'Göreli olmayan yol: ' + ad);
  }
});

await sina('yeni yolculuk görselleri pakette, eski tek ekran görselleri yok', () => {
  const adlar = zipDosyalari(ZIP);
  const gerekli = [
    'gorsel/tema2-zemin.webp', 'gorsel/tema2-su.webp',
    'gorsel/yuva-mezarlik.webp', 'gorsel/yuva-magara.webp', 'gorsel/yuva-izbe.webp',
    'gorsel/an-timsah-1.webp', 'gorsel/hayalet-atici.webp',
    'gorsel/boss-TR.webp', 'gorsel/hayalet-boss.webp',
    'gorsel/k3-kinkin-0-1.webp', 'gorsel/k3-kinkin-0-8.webp', 'gorsel/kart-kinkin.webp',
    'gorsel/menu-amblem.webp', 'gorsel/menu-dugme-yesil.webp', 'gorsel/menu-konfeti.webp',
    'gorsel/an-para-1.webp', 'gorsel/an-elmas-1.webp', 'gorsel/an-hayalet-puf-1.webp'
  ];
  for (const ad of gerekli) assert.ok(adlar.includes(ad), ad + ' yok');
  for (const ad of adlar) {
    assert.ok(!/s3-kinkin|kinkin-dur|kinkin-kos|kasirga/.test(ad), 'Eski görsel pakette: ' + ad);
  }
});

const indexHtml = fs.readFileSync(path.join(PLAYABLE, 'index.html'), 'utf8');
const oyunJs = fs.readFileSync(path.join(PLAYABLE, 'oyun.js'), 'utf8');

await sina('sahibin adı reklam metinlerinde yok', () => {
  assert.doesNotMatch(indexHtml + '\n' + oyunJs, /mahmut|marfen|mafren/i);
});

await sina('index.html gerekli meta ve exitapi etiketlerini taşıyor', () => {
  assert.ok(indexHtml.includes('<meta charset="utf-8">'), 'charset eksik');
  assert.ok(indexHtml.includes('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">'), 'viewport eksik');
  assert.ok(indexHtml.includes('<meta name="ad.orientation" content="portrait">'), 'portrait eksik');
  assert.ok(indexHtml.includes('<script type="text/javascript" src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"></script>'), 'exitapi eksik');
  const sira = ['<!DOCTYPE html>', '<html', '<head>', '<body>'];
  let son = -1;
  for (const parca of sira) {
    const k = indexHtml.indexOf(parca);
    assert.ok(k > son, 'Etiket sırası hatalı: ' + parca);
    son = k;
  }
  assert.ok(!/<svg/i.test(indexHtml + oyunJs), 'Satır içi SVG var');
  assert.ok(indexHtml.includes('gorsel/menu-dugme-yesil.webp'), 'CTA yeşil düğme görseli kullanılmıyor');
  assert.ok(indexHtml.includes('gorsel/menu-amblem.webp'), 'Bitiş kartında amblem yok');
});

await sina('exitapi dışında dış adres yok', () => {
  const metin = indexHtml + '\n' + oyunJs;
  const adresler = metin.match(/https?:\/\/[^\s"'`<>)]+/g) || [];
  const izinli = [
    'https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js',
    'https://play.google.com/store/apps/details?id=com.poyrazworkshop.hayaletavcilari'
  ];
  for (const adres of adresler) {
    assert.ok(izinli.some((i) => adres.startsWith(i)), 'İzinsiz adres: ' + adres);
  }
});

// 3) Sunucu (kök: dist/playable)
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const sunucu = http.createServer((q, r) => {
  const istenen = decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const f = path.join(DIST, istenen);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    r.writeHead(404);
    return r.end();
  }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;

const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const sayfa = await tarayici.newPage({ viewport: { width: 360, height: 640 } });
const sayfaHatalari = [];
sayfa.on('pageerror', (e) => sayfaHatalari.push(e.message));
await sayfa.addInitScript(() => {
  window.ExitApi = {
    exit: function () { window.__cikis = (window.__cikis || 0) + 1; }
  };
  const asilRaf = window.requestAnimationFrame.bind(window);
  window.__rafSayaci = 0;
  window.requestAnimationFrame = function (cb) {
    window.__rafSayaci += 1;
    return asilRaf(cb);
  };
});
await sayfa.route(/tpc\.googlesyndication\.com/, (r) => r.abort());
await sayfa.goto(adres, { waitUntil: 'load' });
await sayfa.waitForFunction(() => window.__playable && window.__gorseller && Object.keys(window.__gorseller).length > 50, null, { timeout: 15000 });

await sina('sayfa hatasız açılıyor, bütün görseller yüklendi', async () => {
  await sayfa.waitForFunction(() => {
    const g = window.__gorseller;
    return Object.keys(g).every((k) => g[k].complete && g[k].naturalWidth > 0);
  }, null, { timeout: 15000 });
  const domGorseller = await sayfa.evaluate(() => Array.from(document.images).map((im) => im.naturalWidth));
  assert.ok(domGorseller.every((w) => w > 0), 'DOM görselleri yüklenmedi');
  assert.equal(sayfaHatalari.length, 0, sayfaHatalari.join(' | '));
});

// 4) Kendiliğinden çıkış yok
await sina('dokunma yokken 3 sn sonra bile çıkış yok', async () => {
  await sayfa.waitForTimeout(3000);
  const cikis = await sayfa.evaluate(() => typeof window.__cikis);
  assert.equal(cikis, 'undefined');
});

let hareketFarki = 0;
await sina('fare ile sürükleme karakteri hareket ettirir, evre oyun olur', async () => {
  const once = await sayfa.evaluate(() => window.__playable.konum());
  await sayfa.mouse.move(180, 400);
  await sayfa.mouse.down();
  await sayfa.mouse.move(250, 420, { steps: 8 });
  await sayfa.waitForTimeout(400);
  await sayfa.mouse.up();
  const sonra = await sayfa.evaluate(() => window.__playable.konum());
  hareketFarki = Math.hypot(sonra.x - once.x, sonra.y - once.y);
  assert.ok(hareketFarki > 8, 'Hareket: ' + hareketFarki.toFixed(1));
  const evre = await sayfa.evaluate(() => window.__playable.durum().evre);
  assert.equal(evre, 'oyun');
});

await sina('bölge 1 temizlenmeden köprü kapalı', async () => {
  const d = await sayfa.evaluate(() => window.__playable.durum());
  assert.equal(d.kopru, 'kapali', JSON.stringify(d));
  assert.equal(d.bolge, 1);
  assert.equal(d.faz, 'bolge1');
});

await sina('en üste sürükleyince oyuncu HUD altında tam görünür', async () => {
  await sayfa.mouse.move(180, 400);
  await sayfa.mouse.down();
  await sayfa.mouse.move(180, 340, { steps: 6 });
  await sayfa.waitForTimeout(600);
  await sayfa.mouse.up();
  const m = await sayfa.evaluate(() => ({
    y: window.__playable.konum().y,
    boy: window.__playable.oyuncuBoy(),
    hud: window.__playable.hudAlt()
  }));
  assert.ok(m.y - m.boy >= m.hud - 0.5, `y-boy ${m.y - m.boy} < hud ${m.hud}`);
});

await sina('hayaletler yuvaların yanında doğuyor', async () => {
  await sayfa.waitForFunction(() => window.__playable.durum().sonDogumUzaklik >= 0, null, { timeout: 8000 });
  const d = await sayfa.evaluate(() => window.__playable.durum());
  assert.ok(d.sonDogumUzaklik >= 0 && d.sonDogumUzaklik <= 90, 'Yuva uzaklığı: ' + d.sonDogumUzaklik);
  const yuvalar = await sayfa.evaluate(() => window.__playable.yuvalar());
  assert.ok(yuvalar.length >= 3, 'Yuvalar eksik');
});

let baslangicKamera = 0;
await sina('bölge 1 temizlenince köprü iner, kamera yukarı ilerler', async () => {
  baslangicKamera = await sayfa.evaluate(() => window.__playable.durum().kameraY);
  await sayfa.evaluate(() => window.__playable.hizlandir(8));
  await sayfa.waitForFunction(() => {
    const d = window.__playable.durum();
    return d.kopru === 'acik' && d.kameraY <= -100;
  }, null, { timeout: 30000 });
  const d = await sayfa.evaluate(() => window.__playable.durum());
  assert.equal(d.kopru, 'acik');
  assert.ok(d.kameraY < baslangicKamera, `kamera ${baslangicKamera} -> ${d.kameraY}`);
  assert.ok(d.kopruInme > 0, 'Köprü animasyonu başlamadı');
  await sayfa.waitForFunction(() => window.__playable.durum().kopruInme >= 1, null, { timeout: 15000 });
});

await sina('boss gelir, yenilir ve bölüm kutlanır', async () => {
  await sayfa.waitForFunction(() => window.__playable.durum().boss === true, null, { timeout: 30000 });
  const d = await sayfa.evaluate(() => window.__playable.durum());
  assert.ok(d.bossCan > 0, 'Boss canı yok');
  await sayfa.waitForFunction(() => window.__playable.durum().evre === 'bitis', null, { timeout: 30000 });
  const son = await sayfa.evaluate(() => window.__playable.durum());
  assert.equal(son.bitis, 'kazan', JSON.stringify(son));
  assert.equal(sayfaHatalari.length, 0, sayfaHatalari.join(' | '));
});

let bitisSayfaRaf = 0;
await sina('bitiş kartı amblem, para ve CTA gösterir; CTA çıkışı artırır', async () => {
  await sayfa.waitForSelector('#bitis', { state: 'visible' });
  await sayfa.waitForSelector('#cta', { state: 'visible' });
  const kart = await sayfa.evaluate(() => ({
    amblem: document.getElementById('bitis-amblem').naturalWidth > 0,
    simge: document.getElementById('bitis-simge').naturalWidth > 0,
    para: document.getElementById('bitis-para').textContent,
    tekrarGizli: document.getElementById('tekrar').hidden
  }));
  assert.ok(kart.amblem && kart.simge, 'Bitiş kartı görselleri eksik');
  assert.match(kart.para, /💰\s*\d+/, 'Para yazısı yok');
  assert.ok(kart.tekrarGizli, 'Kazanınca Tekrar görünmemeli');
  await sayfa.click('#cta');
  const cikis = await sayfa.evaluate(() => window.__cikis);
  assert.equal(cikis, 1);
  await sayfa.evaluate(() => document.getElementById('indir').click());
  const cikis2 = await sayfa.evaluate(() => window.__cikis);
  assert.equal(cikis2, 2, 'İNDİR düğmesi de çıkış çağırmalı');
  bitisSayfaRaf = await sayfa.evaluate(() => window.__rafSayaci);
});

await sina('bitiş kartından 4 sn sonra requestAnimationFrame durur', async () => {
  await sayfa.waitForTimeout(4000);
  const ilk = await sayfa.evaluate(() => window.__rafSayaci);
  await sayfa.waitForTimeout(600);
  const ikinci = await sayfa.evaluate(() => window.__rafSayaci);
  assert.equal(ikinci, ilk, `rAF sayacı ${ilk} -> ${ikinci}`);
  assert.ok(ilk >= bitisSayfaRaf, 'sayaç geriledi');
});

// 7) Duyarlı görünümler
await sina('360×640 ve 412×915 görünümlerde yatay taşma yok, canvas ekranı kaplar', async () => {
  const boyutlar = [[360, 640], [412, 915]];
  for (const [w, h] of boyutlar) {
    const s = await tarayici.newPage({ viewport: { width: w, height: h } });
    await s.addInitScript(() => {
      window.ExitApi = { exit: function () { window.__cikis = (window.__cikis || 0) + 1; } };
    });
    await s.route(/tpc\.googlesyndication\.com/, (r) => r.abort());
    await s.goto(adres, { waitUntil: 'load' });
    await s.waitForFunction(() => !!window.__playable, null, { timeout: 10000 });
    await s.waitForTimeout(300);
    const olcum = await s.evaluate(() => {
      const c = document.getElementById('oyun-tuvali').getBoundingClientRect();
      return {
        genislik: window.innerWidth,
        kaydirma: document.documentElement.scrollWidth,
        govdeKaydirma: document.body.scrollWidth,
        tuvalW: c.width,
        tuvalH: c.height,
        tuvalX: c.x,
        tuvalY: c.y
      };
    });
    assert.ok(olcum.kaydirma <= olcum.genislik, `${w}x${h} scrollWidth ${olcum.kaydirma} > ${olcum.genislik}`);
    assert.ok(olcum.govdeKaydirma <= olcum.genislik, `${w}x${h} body scrollWidth taşıyor`);
    assert.ok(Math.abs(olcum.tuvalW - w) <= 1, `${w}x${h} tuval genişliği ${olcum.tuvalW}`);
    assert.ok(Math.abs(olcum.tuvalH - h) <= 1, `${w}x${h} tuval yüksekliği ${olcum.tuvalH}`);
    assert.ok(olcum.tuvalX <= 1 && olcum.tuvalY <= 1, `${w}x${h} tuval konumu ${olcum.tuvalX},${olcum.tuvalY}`);
    await s.close();
  }
});

await tarayici.close();
await new Promise((coz) => sunucu.close(coz));

for (const s of sonuclar) console.log(s);
if (basarisiz) {
  console.error('\nBAZI SINAMALAR BAŞARISIZ');
  process.exitCode = 1;
} else {
  console.log('\nTÜM SINAMALAR GEÇTİ');
}
