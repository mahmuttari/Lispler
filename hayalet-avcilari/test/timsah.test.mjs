// Hayalet Avcıları: sudaki timsahlar (3.15.0) — çevrimdışı sınama.
// Kullanıcının isteği: "Sulardan timsah çıksın, suyun yanında duranı bazen ısırsın." Timsah kıyıda belirir, önce uyarır
// (kabarcık ve gözler), sonra ısırır: menzildeki oyuncu 1 can kaybeder, uyarıda kaçan kurtulur. Süs gözleri zarar vermez.
// Çalıştırma: node hayalet-avcilari/test/timsah.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
const EKRAN = process.env.TIMSAH_EKRAN; // verilirse ısırık anının ekran görüntüsü bu dosyaya

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof timsahGuncelle === 'function' && typeof startGame === 'function');

  // Sayfada ortak yardımcılar: oyun duraklatılır (döngü update'i çağırmaz), timsah elle ilerletilir
  await p.evaluate(() => {
    window.__kur = () => {
      startGame(); game.paused = true; game.ghosts = []; game.spawnTimer = -1e9;
      game.player.hp = 3; game.player.invuln = 0; game.player.dead = false;
      timsahSifirla();
      return game.waters[0];
    };
    // Gölün kıyısının dışında, kenara `bosluk` px uzakta bir nokta (oyuncunun kenarına göre)
    window.__kiyi = (o, bosluk) => {
      const r = game.player.r;
      for (let yon = 0; yon < 32; yon++) {
        const a = (yon / 32) * Math.PI * 2;
        let x = o.x + o.w / 2, y = o.y + o.h / 2;
        for (let i = 0; i < 400; i++) {
          x += Math.cos(a) * 2; y += Math.sin(a) * 2;
          if (suUzakligi(o, x, y) - r >= bosluk) {
            if (!collidesWalls(x, y, r) && !collidesWaters(x, y, r)) return { x, y, a };
            break;
          }
        }
      }
      return null;
    };
    // Bütün göllerden uzak, boş bir nokta
    window.__uzak = () => {
      const r = game.player.r;
      for (let y = 100; y < game.worldH - 100; y += 40) for (let x = 100; x < game.worldW - 100; x += 40) {
        if (enYakinSu(x, y).d - r > TIMSAH.yakin + 60 && !collidesWalls(x, y, r)) return { x, y };
      }
      return null;
    };
    window.__ilerlet = (sn, adim = 0.05) => { for (let z = 0; z < sn; z += adim) timsahGuncelle(adim); };
    window.__oyuncuyaKoy = (k) => { game.player.x = k.x; game.player.y = k.y; };
  });

  const s = await p.evaluate(() => {
    const r = {};
    const o = __kur();
    const k = __kiyi(o, 20);
    r.kiyiVar = !!k && game.waters.length > 0;
    __oyuncuyaKoy(k);
    // 1) Zorla saldırı: kıyıda kalan ısırılır
    let tm = timsahSaldirt(o, k.x, k.y);
    r.sudaCikti = !!tm && suUzakligi(o, tm.x, tm.y) < -6;
    __ilerlet(TIMSAH.uyari - 0.1);
    r.uyaridaCan = game.player.hp;
    __ilerlet(TIMSAH.atilma + 0.2);
    r.isirdiCan = game.player.hp;
    r.yazi = game.particles.some((q) => q.text === '🐊 Timsah ısırdı!');
    __ilerlet(1);
    r.batti = game.timsahlar.length;
    // 2) Uyarıda kaçan kurtulur
    game.player.hp = 3; game.player.invuln = 0;
    tm = timsahSaldirt(o, k.x, k.y);
    __ilerlet(0.4);
    game.player.x = tm.x + Math.cos(k.a) * 250; game.player.y = tm.y + Math.sin(k.a) * 250;
    __ilerlet(1.5);
    r.kacanCan = game.player.hp;
    // 3) Hasar korumasında ve hayaletken ısırmaz
    __oyuncuyaKoy(k);
    game.player.invuln = 5; timsahSaldirt(o, k.x, k.y); __ilerlet(1.5);
    r.korumaCan = game.player.hp;
    game.player.invuln = 0; game.player.dead = true; timsahSaldirt(o, k.x, k.y); __ilerlet(1.5);
    r.hayaletCan = game.player.hp;
    game.player.dead = false;
    return r;
  });
  sina('haritada su ve kıyıda boş yer var', () => { assert.equal(s.kiyiVar, true); });
  sina('timsah suyun içinde, kıyıda çıkar', () => { assert.equal(s.sudaCikti, true); });
  sina('uyarı (kabarcık ve gözler) sırasında ısırmaz', () => { assert.equal(s.uyaridaCan, 3); });
  sina('uyarıdan sonra kıyıda kalan oyuncuyu ısırır: 1 can, "🐊 Timsah ısırdı!"', () => {
    assert.equal(s.isirdiCan, 2); assert.equal(s.yazi, true);
  });
  sina('ısırdıktan sonra batıp kaybolur', () => { assert.equal(s.batti, 0); });
  sina('uyarıda uzaklaşan oyuncu kurtulur', () => { assert.equal(s.kacanCan, 3); });
  sina('hasar korumasındaki ve hayalet olan oyuncuyu ısırmaz', () => { assert.equal(s.korumaCan, 3); assert.equal(s.hayaletCan, 3); });

  // Kendiliğinden saldırı: yalnız kıyıda bekleyene, bekleme ve ara süreleriyle (rastgelelik 0'a sabitlenir: hep "evet")
  const k2 = await p.evaluate(() => {
    const r = {}, gercek = Math.random;
    Math.random = () => 0;
    try {
      const o = __kur();
      const yakin = __kiyi(o, 30), uzak = __uzak();
      game._timsahSus = 1e9; // süs gözleri bu bölümde karışmasın
      __oyuncuyaKoy(uzak); __ilerlet(3);
      r.uzakta = game.timsahlar.length;
      __oyuncuyaKoy(yakin); __ilerlet(TIMSAH.bekleme - 0.15);
      r.beklemeOnce = game.timsahlar.length;
      __ilerlet(0.3);
      r.bekleyince = game.timsahlar.filter((tm) => tm.tur === 'saldiri').length;
      game.player.invuln = 1e9; // ısırık sayılmasın, yalnız sıklık ölçülsün
      __ilerlet(TIMSAH.ara - 0.5);
      r.araIcinde = game.timsahlar.filter((tm) => tm.tur === 'saldiri').length;
      __ilerlet(1); // kıyıda bekleme çoktan doldu: ara bitince hemen (ömrü TIMSAH.uyari + atilma + batis içinde sayılır)
      r.aradanSonra = game.timsahlar.filter((tm) => tm.tur === 'saldiri').length;
      // Rastgelelik "hayır" derse kıyıda beklemek yetmez ("bazen")
      Math.random = () => 0.999;
      __kur(); __oyuncuyaKoy(yakin); game._timsahSus = 1e9; __ilerlet(5);
      r.sansYok = game.timsahlar.length;
    } finally { Math.random = gercek; }
    return r;
  });
  sina('sudan uzakta duran oyuncuya timsah çıkmaz', () => { assert.equal(k2.uzakta, 0); });
  sina(`kıyıda ${'bekleme'} süresinden önce çıkmaz, sonra çıkar`, () => { assert.equal(k2.beklemeOnce, 0); assert.equal(k2.bekleyince, 1); });
  sina('iki saldırı arası en az TIMSAH.ara sn', () => { assert.equal(k2.araIcinde, 0); assert.equal(k2.aradanSonra, 1); });
  sina('olasılık tutmazsa çıkmaz ("bazen")', () => { assert.equal(k2.sansYok, 0); });

  // Süs gözleri: görünen gölde çıkar, zarar vermez, süre sonunda kaybolur; yeni bölümde timsahlar sıfırlanır
  const sus = await p.evaluate(() => {
    const r = {};
    const o = __kur();
    game.camera.x = o.x + o.w / 2 - game.W / 2; game.camera.y = o.y + o.h / 2 - game.H / 2;
    game._timsahAra = 1e9;
    const tm = timsahSusle();
    r.cikti = !!tm && (tm.tur === 'sus' || tm.tur === 'bos'); // süs ya da boşa ısırık
    __oyuncuyaKoy({ x: tm.x, y: tm.y }); // gölün içinde, gözlerin üstünde (Beri gibi)
    __ilerlet(TIMSAH.susSure / 2);
    r.ortada = game.timsahlar.length;
    __ilerlet(TIMSAH.susSure);
    r.can = game.player.hp; r.sonra = game.timsahlar.filter((x) => x.tur !== 'saldiri').length;
    timsahSaldirt(o, o.x + o.w / 2, o.y - 100);
    game.waters = game.waters.slice(); // yeni bölüm: buildWaters yeni dizi kurar
    timsahGuncelle(0.01);
    r.yeniBolum = game.timsahlar.length;
    return r;
  });
  sina('süs gözleri görünen gölde çıkar', () => { assert.equal(sus.cikti, true); assert.equal(sus.ortada, 1); });
  sina('süs gözleri ısırmaz ve süre sonunda kaybolur', () => { assert.equal(sus.can, 3); assert.equal(sus.sonra, 0); });
  sina('yeni bölümde timsahlar sıfırlanır', () => { assert.equal(sus.yeniBolum, 0); });

  // Boşa ısırık: süs timsahı kimi zaman ağzını açıp kapatır, kimseye zarar vermez; çevrimiçi biçim gidip geri gelir
  const bos = await p.evaluate(() => {
    const r = {};
    const o = __kur();
    game.camera.x = o.x + o.w / 2 - game.W / 2; game.camera.y = o.y + o.h / 2 - game.H / 2;
    // Süs timsahı %45 olasılıkla boşa ısırır: biri çıkana kadar denenir; ikisi de çıkmalı
    let tm = null; const turler = new Set();
    for (let i = 0; i < 60; i++) { game.timsahlar = []; const x = timsahSusle(); if (x) { turler.add(x.tur); if (x.tur === 'bos' && !tm) tm = x; } }
    game.timsahlar = tm ? [tm] : [];
    r.turler = [...turler].sort().join(',');
    r.tur = tm && tm.tur;
    __oyuncuyaKoy({ x: tm.x, y: tm.y });
    __ilerlet(TIMSAH.uyari + TIMSAH.atilma + 0.1);
    r.isirdi = tm.isirdi; r.can = game.player.hp;
    __ilerlet(1);
    r.kayboldu = !game.timsahlar.includes(tm);
    // Çevrimiçi biçim
    game.timsahlar = [
      { id: 1, tur: 'saldiri', x: 512.4, y: 300, a: 1.57, t: 0.35 },
      { id: 2, tur: 'bos', x: 700, y: 820, a: -2.1, t: 1.2 },
      { id: 3, tur: 'sus', x: 90, y: 40, a: 0, t: 0 },
    ];
    const d = timsahDizisi();
    r.metin = d.metin; r.imza = d.imza;
    r.geri = uzakTimsahlariAl(d.metin).map((x) => [x.tur, x.x, x.y, x.a, x.t0]);
    r.bozuk = uzakTimsahlariAl('z1,2,3,4;a1,2;abc').length;
    return r;
  });
  sina('süs timsahı kimi zaman boşa ısırık atar, kimseye zarar vermez, sonra batar', () => {
    assert.equal(bos.turler, 'bos,sus'); assert.equal(bos.tur, 'bos'); assert.equal(bos.isirdi, true); assert.equal(bos.can, 3); assert.equal(bos.kayboldu, true);
  });
  sina('çevrimiçi biçim: kısa metin, imza kimliklerden, geri okununca aynı; bozuk parça atlanır', () => {
    assert.equal(bos.metin, 'a512,300,157,350;b700,820,-210,1200;s90,40,0,0');
    assert.equal(bos.imza, '1,2,3');
    assert.deepEqual(bos.geri, [['saldiri', 512, 300, 1.57, 0.35], ['bos', 700, 820, -2.1, 1.2], ['sus', 90, 40, 0, 0]]);
    assert.equal(bos.bozuk, 0);
  });

  // Oyun döngüsüyle: duraklatınca timsah durur; her evre çizilir, sayfa hatası yok
  const dongu = await p.evaluate(async () => {
    const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
    const o = __kur();
    const k = __kiyi(o, 20);
    __oyuncuyaKoy(k); game.player.invuln = 1e9;
    game.paused = false; game.lastFrame = performance.now();
    const tm = timsahSaldirt(o, k.x, k.y);
    await bekle(300);
    const ilerledi = tm.t > 0.1;
    game.paused = true;
    const t0 = tm.t;
    await bekle(400);
    const durdu = tm.t === t0;
    let cizimHatasi = null;
    for (const z of [0.2, 0.8, 1.0, 1.2, 1.5]) {
      tm.t = z;
      try { render(); } catch (e) { cizimHatasi = e.message; }
    }
    const s = timsahSusle(); if (s) s.t = 1;
    try { render(); } catch (e) { cizimHatasi = e.message; }
    tm.t = TIMSAH.uyari + TIMSAH.atilma * 0.7; render();
    return { ilerledi, durdu, cizimHatasi };
  });
  if (EKRAN) await p.screenshot({ path: EKRAN });
  sina('timsah oyun süresiyle ilerler, duraklatınca durur', () => { assert.equal(dongu.ilerledi, true); assert.equal(dongu.durdu, true); });
  sina('bütün evreler hatasız çizilir', () => { assert.equal(dongu.cizimHatasi, null); });
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
