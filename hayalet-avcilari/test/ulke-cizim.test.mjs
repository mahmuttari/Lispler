// Hayalet Avcıları: Dünya Turu çizimleri (3.14.0) — boss kostüm takımı (51 ülke); aile ve ülke objesi sınamaları
// Görev 5 ve 7–13'te bu dosyaya eklenir.
// Kostüm: tür listeleri veriyle aynı, 51 kaydın hepsi geçerli; her boss iki ölçekte hatasız çizilir; Dünya Turu bossunda
// taç yok ve gövde kırmızı değil; normal oyunda ve bozuk kayıtta bugünkü taçlı kırmızı boss.
// Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md §5.5
// Çalıştırma: node hayalet-avcilari/test/ulke-cizim.test.mjs [--ekran <klasör>]   (Playwright + Chromium; ağ gerekmez)
// --ekran: 51 kostümlü boss (boss-<KOD>.png) ve hepsinin tek sayfası (bosslar.png) klasöre yazılır (gözle denetim).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
const ekranKlasoru = process.argv.includes('--ekran') ? process.argv[process.argv.indexOf('--ekran') + 1] : null;

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

// Görev 2'nin kostüm tür listeleri (veri yalnız bunları kullanır)
const KOSTUM_TURLERI = {
  baslik: ['efe', 'cicekTaci', 'krakuska', 'tirol', 'tam', 'bere', 'ucKose', 'cicekToka', 'kapuson', 'basBagi', 'fila',
    'kubaBaslik', 'isicholo', 'satroka', 'boncukBant', 'imma', 'nemes', 'mesedde', 'simag', 'kece', 'doppi', 'sindhi',
    'gaungBaung', 'tanjak', 'blangkon', 'salakot', 'nonLa', 'gat', 'kokosnik', 'kurk', 'kovboy', 'sombrero', 'vueltiao',
    'chullo', 'boina', 'yok'],
  giysi: ['entari', 'ceket', 'sarili', 'panco', 'kimono', 'elbise', 'askili'],
  desen: ['duz', 'cizgili', 'ekose', 'puantiye', 'geometrik', 'nakis', 'batik', 'boncuk'],
  aksesuar: ['yelpaze', 'fener', 'semsiye', 'mate', 'maske', 'boncukluYaka', 'kusak', 'sal', 'pelerin', 'fular', 'bandana'],
  ayakkabi: ['babus', 'geta', 'markub', 'cizme'],
};

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
async function sayfaAc(dil = 'tr') {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript((dil) => { localStorage.setItem('hayaletAvcilariDil', dil); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  return p;
}

// Sayfada bossu 200×200 tuvale (merkez 100, 110) çizer ve taç bölgesini, alnı ölçer. Taç bölgesi drawGhost'taki taçtır:
// x ±20s, y −34s..−22s; taç rengi #ffd166. Alın (0, −11s) başlığın ve gözlerin dışında kalan gövde noktasıdır.
function bossOlc(secenek) {
  const c = document.createElement('canvas'); c.width = 200; c.height = 200;
  const ctx = c.getContext('2d');
  const yakin = (d, i, r, g, b, tol) => Math.abs(d[i] - r) <= tol && Math.abs(d[i + 1] - g) <= tol && Math.abs(d[i + 2] - b) <= tol && d[i + 3] > 200;
  function ciz(s) {
    ctx.clearRect(0, 0, 200, 200);
    drawGhost(ctx, { x: 100, y: 110, size: 40 * s, hp: 10, maxHp: 10, isBoss: true });
    const d = ctx.getImageData(0, 0, 200, 200).data;
    let tac = 0;
    for (let y = Math.floor(110 - 34 * s); y <= Math.ceil(110 - 22 * s); y++) {
      for (let x = Math.floor(100 - 20 * s); x <= Math.ceil(100 + 20 * s); x++) if (yakin(d, (y * 200 + x) * 4, 255, 209, 102, 6)) tac++;
    }
    const ai = (Math.round(110 - 11 * s) * 200 + 100) * 4;
    return { tac, kirmizi: yakin(d, ai, 220, 38, 38, 12) };
  }
  const sonuc = { hatali: [], tacli: [], kirmizi: [] };
  game.dunyaTuru = true;
  for (const u of ULKELER) {
    game.level = u.sira;
    for (const s of [1, 2.4]) {
      let o;
      try { o = ciz(s); } catch (e) { sonuc.hatali.push(`${u.kod}@${s}: ${e.message}`); continue; }
      if (o.tac > 0) sonuc.tacli.push(`${u.kod}@${s}`);
      if (o.kirmizi) sonuc.kirmizi.push(`${u.kod}@${s}`);
    }
  }
  game.dunyaTuru = false; game.level = 1;
  sonuc.normal = [ciz(1), ciz(2.4)];
  game.dunyaTuru = true; game.level = 6;
  const eski = ULKELER[5].kostum;
  ULKELER[5].kostum = { baslik: 'yokboyle' };
  try { sonuc.bozuk = ciz(2.4); } finally { ULKELER[5].kostum = eski; }
  game.dunyaTuru = false; game.level = 1;
  return sonuc;
}

// 51 bossun görüntüleri: her biri ülkenin zemin renginde 200×200 (s = 2,4) ve hepsi bir sayfada (9 sütun)
async function ekranlar(p, klasor) {
  fs.mkdirSync(klasor, { recursive: true });
  const resimler = await p.evaluate(() => {
    const out = [];
    const sayfa = document.createElement('canvas'); sayfa.width = 9 * 200; sayfa.height = 6 * 220;
    const sx = sayfa.getContext('2d');
    sx.fillStyle = '#111'; sx.fillRect(0, 0, sayfa.width, sayfa.height);
    game.dunyaTuru = true;
    ULKELER.forEach((u, i) => {
      game.level = u.sira;
      const c = document.createElement('canvas'); c.width = 200; c.height = 200;
      const ctx = c.getContext('2d');
      ctx.fillStyle = u.palet.zemin; ctx.fillRect(0, 0, 200, 200);
      drawGhost(ctx, { x: 100, y: 112, size: 96, hp: 7, maxHp: 10, isBoss: true });
      out.push({ kod: u.kod, url: c.toDataURL('image/png') });
      const x = (i % 9) * 200, y = Math.floor(i / 9) * 220;
      sx.drawImage(c, x, y);
      sx.fillStyle = '#fff'; sx.font = 'bold 14px sans-serif'; sx.textAlign = 'center';
      sx.fillText(`${u.sira}. ${u.kod} · ${u.kostum.baslik}/${u.kostum.giysi}/${u.kostum.desen}`, x + 100, y + 214);
    });
    game.dunyaTuru = false; game.level = 1;
    out.push({ kod: 'bosslar', url: sayfa.toDataURL('image/png') });
    return out;
  });
  for (const r of resimler) {
    const ad = r.kod === 'bosslar' ? 'bosslar.png' : `boss-${r.kod}.png`;
    fs.writeFileSync(path.join(klasor, ad), Buffer.from(r.url.split(',')[1], 'base64'));
  }
  sonuclar.push(`✓ ekran görüntüleri: ${klasor} (${resimler.length - 1} boss + bosslar.png)`);
}

try {
  const p = await sayfaAc();

  // --- 1) Kostüm takımı ---
  const turler = await p.evaluate(() => (window.KOSTUM_TURLERI ? JSON.parse(JSON.stringify(window.KOSTUM_TURLERI)) : null));
  sina('KOSTUM_TURLERI Görev 2 listelerine eşit', () => { assert.deepEqual(turler, KOSTUM_TURLERI); });
  const gecersiz = await p.evaluate(() => ULKELER.filter((u) => !kostumGecerliMi(u.kostum)).map((u) => u.kod));
  sina('51 ülkenin kostüm kaydı geçerli', () => { assert.deepEqual(gecersiz, []); });
  const bozuklar = await p.evaluate(() => [
    kostumGecerliMi(null), kostumGecerliMi({ baslik: 'yokboyle' }),
    kostumGecerliMi({ baslik: 'efe', giysi: 'ceket', desen: 'nakis', renk: ['#000000', '#ffffff'], aksesuar: [] }),
    kostumGecerliMi({ baslik: 'efe', giysi: 'ceket', desen: 'nakis', renk: ['#000000', '#ffffff', 'kirmizi'], aksesuar: [] }),
    kostumGecerliMi({ baslik: 'efe', giysi: 'ceket', desen: 'nakis', renk: ['#000000', '#ffffff', '#ff0000'], aksesuar: ['kilic'] }),
    kostumGecerliMi({ baslik: 'efe', giysi: 'ceket', desen: 'nakis', renk: ['#000000', '#ffffff', '#ff0000'], aksesuar: [], ayakkabi: 'terlik' }),
  ]);
  sina('bozuk kostüm kaydı geçersiz (tür, 3 renk, aksesuar, ayakkabı)', () => { assert.deepEqual(bozuklar, [false, false, false, false, false, false]); });

  const o = await p.evaluate(bossOlc);
  sina('51 boss iki ölçekte (s = 1 ve 2,4) hatasız çizilir', () => { assert.deepEqual(o.hatali, []); });
  sina('Dünya Turu bossunda taç yok', () => { assert.deepEqual(o.tacli, []); });
  sina('Dünya Turu bossunun gövdesi kırmızı değil', () => { assert.deepEqual(o.kirmizi, []); });
  sina('normal oyunda boss taçlı ve kırmızı', () => {
    for (const n of o.normal) { assert.ok(n.tac > 0, 'taç yok'); assert.ok(n.kirmizi, 'gövde kırmızı değil'); }
  });
  sina('bozuk kostüm kaydında taç ve kırmızı gövde geri gelir', () => { assert.ok(o.bozuk.tac > 0); assert.ok(o.bozuk.kirmizi); });

  if (ekranKlasoru) await ekranlar(p, ekranKlasoru);
  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
