// Hayalet Avcıları: Şampiyonlar listesi ilk 500 (3.16.1) — çevrimdışı sınama.
// Kullanıcının isteği (4 Kasım 2026): "Şampiyon listesi ilk 500 göstersin."
// Firestore runQuery sahte sunucuyla yanıtlanır: 700 farklı avcının 1400 kaydı. Liste skora göre sayfa sayfa okunur,
// her isimden en yüksek skor kalır, 500 avcıda durur; 500 satır çizilir, 10'dan sonraki oyuncuya "📍 Senin sıran" çıkar.
// Çalıştırma: node hayalet-avcilari/test/sampiyon.test.mjs   (Playwright + Chromium; ağ gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;

// 700 avcı × 2 kayıt; avcı i'nin en iyi skoru 900000 - i*100, ikinci kaydı bundan 50 düşük
const KAYIT = [];
for (let i = 0; i < 700; i++) for (const k of [0, 1]) {
  const score = 900000 - i * 100 - k * 50;
  KAYIT.push({ name: `projects/p/databases/(default)/documents/scores/d${String(i).padStart(4, '0')}${k}`, ad: `Avci${i}`, score, k });
}
const sirala = (a, b) => b.score - a.score || (a.name < b.name ? 1 : -1);
KAYIT.sort(sirala);
const sorgular = [];
function runQuery(govde) {
  const q = govde.structuredQuery;
  sorgular.push({ limit: q.limit, imlec: q.startAt ? q.startAt.values.map((v) => v.integerValue || v.referenceValue) : null, sira: q.orderBy.map((o) => `${o.field.fieldPath} ${o.direction}`) });
  let liste = KAYIT;
  if (q.startAt) {
    const [s, n] = [Number(q.startAt.values[0].integerValue), q.startAt.values[1].referenceValue];
    liste = KAYIT.filter((d) => d.score < s || (d.score === s && d.name < n));
  }
  return liste.slice(0, q.limit).map((d) => ({ document: { name: d.name, fields: {
    name: { stringValue: d.ad }, level: { integerValue: String(Math.floor(d.score / 1000)) }, ghosts: { integerValue: '0' },
    para: { integerValue: String(d.score % 1000) }, score: { integerValue: String(d.score) }, date: { integerValue: String(1790000000000 + d.k) } } } }));
}

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  // Playwright son eklenen yönlendirmeye önce bakar: Firestore sorgusu genel engelden önce yakalanır
  await p.route(/firestore\.googleapis\.com\/.*:runQuery/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(runQuery(JSON.parse(r.request().postData()))) }));
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof openLeaderboard === 'function');

  const veri = await p.evaluate(async () => {
    const l = await fetchOnlineLeaderboard(LEADERBOARD_MAX);
    return { sinir: LEADERBOARD_MAX, n: l.length, ilk: l[0], ikinci: l[1].name, son: l[l.length - 1].name, tekil: new Set(l.map((e) => e.name)).size,
      sirali: l.every((e, i) => i === 0 || l[i - 1].score >= e.score) };
  });
  sina('sınır 500; skora göre sıralı 500 farklı avcı', () => {
    assert.equal(veri.sinir, 500); assert.equal(veri.n, 500); assert.equal(veri.tekil, 500); assert.equal(veri.sirali, true);
  });
  sina('her isimden en yüksek skor kalır', () => {
    assert.equal(veri.ilk.name, 'Avci0'); assert.equal(veri.ilk.score, 900000); assert.equal(veri.ikinci, 'Avci1'); assert.equal(veri.son, 'Avci499');
  });
  sina('Firestore skora göre (eşitlikte belge adına göre) sayfa sayfa okunur, imleç bir önceki sayfanın sonu', () => {
    assert.ok(sorgular.length >= 2 && sorgular.length <= 6, String(sorgular.length));
    assert.deepEqual(sorgular[0].sira, ['score DESCENDING', '__name__ DESCENDING']);
    assert.equal(sorgular[0].imlec, null);
    const ilkSayfaSonu = KAYIT[sorgular[0].limit - 1];
    assert.deepEqual(sorgular[1].imlec, [String(ilkSayfaSonu.score), ilkSayfaSonu.name]);
  });

  sorgular.length = 0;
  const ekran = await p.evaluate(async () => {
    save.playerName = 'Avci250';
    openLeaderboard(); // varsayılan kaynak çevrimiçi
    for (let i = 0; i < 100 && document.querySelectorAll('#leaderboard-list .leaderboard-row').length < 500; i++) await new Promise((r) => setTimeout(r, 50));
    const satirlar = document.querySelectorAll('#leaderboard-list .leaderboard-row');
    const ben = document.querySelector('#leaderboard-list .lb-ben');
    const benSatir = document.querySelector('#leaderboard-list .leaderboard-row.is-me');
    ben && ben.click();
    await new Promise((r) => setTimeout(r, 800));
    const kutu = document.getElementById('leaderboard-list').getBoundingClientRect(), sr = benSatir.getBoundingClientRect();
    return { satir: satirlar.length, sonSira: satirlar[499].querySelector('.lb-rank').textContent, alt: document.querySelector('.leaderboard-sub').textContent,
      ben: ben && ben.textContent, gorunur: sr.top >= kutu.top && sr.bottom <= kutu.bottom, tasma: document.documentElement.scrollWidth - innerWidth };
  });
  sina('Şampiyonlar ekranı 500 satır çizer, son satır 500.', () => { assert.equal(ekran.satir, 500); assert.equal(ekran.sonSira, '500.'); assert.equal(ekran.tasma, 0); });
  sina('başlık altı "En iyi 500 hayalet avcısı"', () => { assert.equal(ekran.alt, 'En iyi 500 hayalet avcısı'); });
  sina('"📍 Senin sıran: 251" düğmesi kendi satırını görünür yapar', () => { assert.equal(ekran.ben, '📍 Senin sıran: 251'); assert.equal(ekran.gorunur, true); });

  const yaris = await p.evaluate(async () => {
    openLeaderboard(); setLeaderboardSource('local'); // çevrimiçi yüklenirken Bu Cihaz'a geçildi
    await new Promise((r) => setTimeout(r, 1500));
    return { sekme: leaderboardSource, satir: document.querySelectorAll('#leaderboard-list .leaderboard-row').length, yerel: loadLeaderboard().length };
  });
  sina('çevrimiçi liste yüklenirken Bu Cihaz seçilirse geç gelen çevrimiçi sonuç yazmaz', () => {
    assert.equal(yaris.sekme, 'local'); assert.equal(yaris.satir, yaris.yerel);
  });

  const yerel = await p.evaluate(() => {
    saveLeaderboard([]);
    for (let i = 0; i < 520; i++) addLeaderboardEntry({ name: `Y${i}`, level: 1 + (i % 50), ghosts: i, para: 0, date: i });
    return loadLeaderboard().length;
  });
  sina('bu cihazdaki liste de 500 kayda kadar tutulur', () => { assert.equal(yerel, 500); });
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
