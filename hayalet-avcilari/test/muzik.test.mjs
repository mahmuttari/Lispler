// Hayalet Avcıları: Dünya Turu müzikleri (3.14.0) — Suno istek metinleri, müzik varlıkları ve çalar.
// İstekler: 51 kayıt rota sırasıyla; ortak kalıp ve ortak olumsuz aynen; türün ölçüsü yazılı; yasak sözcük yok.
// Varlıklar (MUZIKLI_ULKELER; Görev 5 ve 7–13 doldurur): kayıt ve iki dosya var, Chromium'da çözülür; döngü 27–34 sn,
// teaser 3–8 sn; ek yerinde örnek sıçraması döngü içinin 99. yüzdeliğini, spektral akı 99. yüzdeliği ya da aynı noktanın
// kesintisiz akısının 1,15 katını aşmaz (ek yeri vuruş atağına yakındır); döngülerin ses düzeyi ortancadan ±2 dB;
// www/muzik toplamı ≤ 14 MB.
// Çalar (muzik.js): teaser sonra döngü, söndürme, Müzik kaydırıcısı, ses kapalı/açık, normal oyunda sessizlik,
// duraklatma, arka plan, hızlı yeniden başlatma (tek kaynak), uçak geçişinde sıradaki ülkenin teaser'ı, dosya hatası.
// Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulke-muzikleri-design.md §3, §4, §6, §8, §12
// Çalıştırma: node hayalet-avcilari/test/muzik.test.mjs   (Playwright + Chromium + ffmpeg; ağ gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

// Ek tasarım §4 (aynen) ve §6 (4/4 olmayan ölçüler)
const ORTAK_KALIP = 'cheerful adventure video game background music, rich polyphonic ensemble with a lead melody, a counter-melody and a rhythm section, steady danceable groove at around 128 BPM, constant energy with no breakdown and no fade-out, loop-friendly, bright warm acoustic mix, instrumental, no vocals';
const ORTAK_OLUMSUZ = 'vocals, singing, choir, lyrics, spoken word, religious, hymn, chant, devotional, anthem, military march, EDM, trap, dubstep, rap, autotune, distorted guitar, heavy metal, slow ballad, ambient drone, fade out';
// 2. sürüm (24 Ekim 2026, kullanıcı: "müzikler maceracı, hareketli olmalı"): henüz üretilmemiş ülkeler bununla istenir;
// üretilmiş ülkelerin kaydı gönderildiği gibi kalır (toplu gözden geçirmede yenilenir)
const ORTAK_KALIP_2 = 'upbeat energetic adventure video game background music, playful and heroic, driving rhythm, rich polyphonic ensemble with a lead melody, a counter-melody and a rhythm section, steady danceable groove at around 128 BPM, constant energy with no breakdown and no fade-out, loop-friendly, bright warm acoustic mix, instrumental, no vocals';
const ORTAK_OLUMSUZ_2 = `${ORTAK_OLUMSUZ}, sad, melancholic, sentimental, emotional, lament, nostalgic, romantic`;
const OLCU = { TR: '2/4', UA: '2/4', PL: '2/4', DE: '2/4', FR: '3/4', IT: '6/8', AO: '2/4', MG: '6/8', ET: '6/8', IR: '6/8', AF: '6/8',
  PH: '3/4', KR: '12/8', RU: '2/4', MX: '6/8', PE: '2/4', BR: '2/4', AR: '2/4' };
const YASAK = /relig|hymn|chant|devot|pray|church|temple|mosque|shrine|anthem|march|militar|sword|dagger|\bwar\b/i;
// Müziği üretilmiş ülkeler (Görev 5: TR, JP; Görev 7–13 kıta kıta ekler)
const MUZIKLI_ULKELER = ['TR', 'JP', 'UA', 'PL', 'DE', 'GB', 'FR', 'IT', 'ES', 'MA', 'DZ', 'CI', 'GH', 'NG', 'SD', 'EG', 'CD', 'AO', 'ZA', 'MZ', 'MG', 'TZ', 'UG', 'KE', 'ET', 'YE', 'SA', 'PS', 'IQ', 'IR', 'UZ', 'AF',
  'PK', 'IN', 'BD', 'MM', 'TH', 'MY', 'ID', 'PH', 'VN', 'CN', 'KR', 'RU', 'CA', 'US', 'MX', 'CO', 'PE', 'BR', 'AR'];

// ---------- ses çözümlemesi (ffmpeg ile, tek kanal 48 kHz) ----------
function coz(dosya) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', dosya, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 29 });
  if (r.status !== 0) throw new Error(`ffmpeg çözemedi: ${dosya}`);
  const b = Buffer.from(r.stdout);
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
}
const yuzdelik = (dizi, p) => { const a = Float64Array.from(dizi).sort(); return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))]; };
function fft(re, im) { // yerinde, uzunluk 2'nin kuvveti
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}
// Kare başına log-büyüklük spektrumundan pozitif akı (1024 örnek, 512 adım, Hann)
function akilar(x) {
  const N = 1024, H = 512, hann = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  let onceki = null; const out = [];
  for (let a = 0; a + N <= x.length; a += H) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = x[a + i] * hann[i];
    fft(re, im);
    const mag = new Float64Array(N / 2);
    for (let i = 0; i < N / 2; i++) mag[i] = Math.log1p(20 * Math.hypot(re[i], im[i]));
    if (onceki) { let f = 0; for (let i = 0; i < N / 2; i++) f += Math.max(0, mag[i] - onceki[i]); out.push(f); }
    onceki = mag;
  }
  return out;
}
function ekYeri(x, bas, son) {
  const fark = new Float64Array(son - 1 - bas);
  for (let i = bas; i < son - 1; i++) fark[i - bas] = Math.abs(x[i + 1] - x[i]);
  const p99 = yuzdelik(fark, 99);
  const sicrama = Math.abs(x[son - 1] - x[bas]);
  const ic = akilar(x.subarray(bas, son));
  const sarili = new Float32Array(8192);
  sarili.set(x.subarray(son - 4096, son), 0); sarili.set(x.subarray(bas, bas + 4096), 4096);
  const ek = akilar(sarili).slice(5, 9); // ek yerini (4096. örnek) kesen kareler
  // Aynı noktanın kesintisiz akısı: ön pay döngü başlangıcının öncesindeki özgün sestir (ek yeri vuruş atağına yakındır)
  const dogal = akilar(x.slice(bas - 4096, bas + 4096)).slice(5, 9);
  return { sicrama, p99, akiEk: Math.max(...ek), akiP99: yuzdelik(ic, 99), akiDogal: Math.max(...dogal) };
}
const rmsDb = (x) => { let s = 0; for (const v of x) s += v * v; return 10 * Math.log10(s / x.length + 1e-20); };

// Ses çalan sınamalar kullanıcı dokunuşu olmadan AudioContext açar
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);

  // --- 1) İstek metinleri ---
  const kodlar = await p.evaluate(() => ULKELER.map((u) => u.kod));
  const istekler = JSON.parse(fs.readFileSync(path.join(KOK, 'araclar', 'muzik-istekleri.json'), 'utf8'));
  sina('51 istek, rota sırasıyla', () => { assert.deepEqual(istekler.map((x) => x.kod), kodlar); });
  const uretilmis = Object.keys(JSON.parse(fs.readFileSync(path.join(KOK, 'araclar', 'muzik-kayit.json'), 'utf8')));
  const surum2 = (x) => x.stil.endsWith(`, ${ORTAK_KALIP_2}`);
  sina('her stil ≤ 1000 harf ve ortak kalıbı (1. ya da 2. sürüm) aynen içerir; üretilmemiş ülkeler 2. sürümde', () => {
    for (const x of istekler) {
      assert.ok(typeof x.stil === 'string' && x.stil.length <= 1000, `${x.kod}: ${x.stil?.length}`);
      assert.ok(x.stil.endsWith(`, ${ORTAK_KALIP}`) || surum2(x), `${x.kod}: ortak kalıp yok`);
      assert.ok(x.stil.length > ORTAK_KALIP_2.length + 40 || (!surum2(x) && x.stil.length > ORTAK_KALIP.length + 40), `${x.kod}: ülke betimlemesi kısa`);
      if (!uretilmis.includes(x.kod)) assert.ok(surum2(x), `${x.kod}: üretilmemiş ama 1. sürüm kalıp`);
    }
  });
  sina('4/4 olmayan türde ölçü yazılı', () => { for (const [kod, o] of Object.entries(OLCU)) assert.ok(istekler.find((x) => x.kod === kod).stil.includes(`in ${o}`), kod); });
  sina('olumsuz etiketler kalıbın sürümündeki ortak listenin aynısı', () => { for (const x of istekler) assert.equal(x.olumsuz, surum2(x) ? ORTAK_OLUMSUZ_2 : ORTAK_OLUMSUZ, x.kod); });
  sina('stilde dinî, askerî ya da silah sözcüğü yok', () => { for (const x of istekler) assert.ok(!YASAK.test(x.stil), `${x.kod}: ${x.stil.match(YASAK)}`); });

  // --- 2) Oyun verisi ---
  const veri = await p.evaluate(() => (window.ULKE_MUZIKLERI && typeof window.ULKE_MUZIKLERI === 'object' ? JSON.parse(JSON.stringify(window.ULKE_MUZIKLERI)) : null));
  sina('ULKE_MUZIKLERI yüklü; anahtarlar ülke kodu', () => { assert.ok(veri); for (const k of Object.keys(veri)) assert.ok(kodlar.includes(k), k); });
  sina('51 ülkenin hepsinin müziği var', () => { assert.equal(MUZIKLI_ULKELER.length, 51); assert.equal(Object.keys(veri || {}).length, 51); });

  // --- 3) Varlıklar ---
  if (MUZIKLI_ULKELER.length) {
    const tarayici = await p.evaluate(async (liste) => {
      const out = {};
      for (const kod of liste) {
        const e = window.ULKE_MUZIKLERI[kod];
        if (!e) { out[kod] = { hata: 'kayıt yok' }; continue; }
        try {
          const ctx = new OfflineAudioContext(2, 1, 48000);
          const getir = async (y) => { const r = await fetch(y); if (!r.ok) throw new Error(`${y}: HTTP ${r.status}`); return ctx.decodeAudioData(await r.arrayBuffer()); };
          const [d, g] = [await getir(e.dongu), await getir(e.giris)];
          out[kod] = { dongu: d.duration, giris: g.duration };
        } catch (err) { out[kod] = { hata: String(err.message || err) }; }
      }
      return out;
    }, MUZIKLI_ULKELER);
    sina('müzik kaydı ve iki dosya var, Chromium çözer', () => {
      for (const kod of MUZIKLI_ULKELER) assert.ok(!tarayici[kod].hata, `müzik kaydı yok ya da çözülmedi: ${kod} (${tarayici[kod].hata})`);
    });
    sina('döngü 27–34 sn, teaser 3–8 sn ve kayıtla aynı', () => {
      for (const kod of MUZIKLI_ULKELER) {
        const e = veri[kod], t = tarayici[kod];
        assert.ok(e.son - e.bas >= 27 && e.son - e.bas <= 34, `${kod}: döngü ${e.son - e.bas}`);
        assert.ok(t.dongu >= e.son, `${kod}: dosya döngüden kısa (${t.dongu} < ${e.son})`);
        assert.ok(e.girisSure >= 3 && e.girisSure <= 8 && Math.abs(t.giris - e.girisSure) <= 0.1, `${kod}: teaser ${t.giris} / ${e.girisSure}`);
      }
    });
    const duzeyler = {};
    sina('ek yeri kesintisiz: örnek sıçraması döngü içinin 99. yüzdeliğinde; akı 99. yüzdelikte ya da aynı noktanın kesintisiz akısının en çok 1,15 katı', () => {
      for (const kod of MUZIKLI_ULKELER) {
        const e = veri[kod], x = coz(path.join(WWW, e.dongu));
        const bas = Math.round(e.bas * 48000), son = Math.round(e.son * 48000);
        const o = ekYeri(x, bas, son);
        assert.ok(o.sicrama <= o.p99, `${kod}: sıçrama ${o.sicrama.toFixed(4)} > ${o.p99.toFixed(4)}`);
        assert.ok(o.akiEk <= Math.max(o.akiP99, 1.15 * o.akiDogal), `${kod}: akı ${o.akiEk.toFixed(1)} > ${o.akiP99.toFixed(1)} ve doğal ${o.akiDogal.toFixed(1)} × 1,15`);
        duzeyler[kod] = rmsDb(x.subarray(bas, son));
      }
    });
    sina('döngülerin ses düzeyi ortancadan en çok ±2 dB', () => {
      const d = Object.values(duzeyler).sort((a, b2) => a - b2), orta = d[Math.floor(d.length / 2)];
      for (const [kod, v] of Object.entries(duzeyler)) assert.ok(Math.abs(v - orta) <= 2, `${kod}: ${(v - orta).toFixed(2)} dB`);
    });
  }
  sina('www/muzik toplamı ≤ 14 MB', () => {
    const k = path.join(WWW, 'muzik');
    const toplam = fs.existsSync(k) ? fs.readdirSync(k).reduce((t, f) => t + fs.statSync(path.join(k, f)).size, 0) : 0;
    assert.ok(toplam <= 14 * 1024 * 1024, `${(toplam / 1048576).toFixed(2)} MB`);
  });

  // --- 4) Çalar (ek spec §3, §8) ---
  const TR = veri.TR;
  const durum = () => p.evaluate(() => muzikDurumu());
  const yakin = (a, b2, pay = 0.02) => typeof a === 'number' && Math.abs(a - b2) <= pay;
  const bekleDongu = (kod) => p.waitForFunction((k) => { const d = muzikDurumu(); return d.calan === 'dongu' && d.kod === k; }, kod, { timeout: 15000, polling: 50 });
  await p.evaluate(() => { save.playerName = 'Kiki'; persistSave(); audio.init(); });
  await p.evaluate(() => { startGame({ tur: true, ulke: 1 }); game.player.invuln = 1e9; });
  await p.waitForTimeout(500);
  const c1 = await durum();
  await p.waitForTimeout((TR.girisSure + 0.6) * 1000 - 500);
  const c2 = await durum();
  sina('Dünya Turu başında teaser çalar (0,5 sn içinde)', () => { assert.equal(c1.calan, 'giris'); assert.equal(c1.kod, 'TR'); });
  sina('teaser bitince döngü: loopStart/loopEnd kayıttan, tek kaynak, ana kazanç 0,6', () => {
    const ne = JSON.stringify(c2);
    assert.equal(c2.calan, 'dongu', ne); assert.equal(c2.kod, 'TR', ne);
    assert.equal(c2.loopStart, TR.bas, ne); assert.equal(c2.loopEnd, TR.son, ne); assert.equal(c2.kaynak, 1, ne);
    assert.ok(yakin(c2.kazanc, 0.6), String(c2.kazanc));
  });
  const kay = await p.evaluate(async () => {
    const s = document.getElementById('vol-slider-muzik');
    s.value = 30; s.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 150));
    const r = { kazanc: muzikDurumu().kazanc, kayit: save.volumes.muzik, etiket: document.getElementById('vol-label-muzik').textContent };
    s.value = 60; s.dispatchEvent(new Event('input'));
    return r;
  });
  sina('Müzik kaydırıcısı %30: 0,15 sn içinde kazanç 0,3, kayıtta 0,3', () => {
    assert.ok(yakin(kay.kazanc, 0.3), String(kay.kazanc)); assert.equal(kay.kayit, 0.3); assert.equal(kay.etiket, '30%');
  });
  await p.evaluate(() => endGame(false));
  await p.waitForTimeout(1200);
  const c3 = await durum();
  sina('oyun bitince müzik söner (1,2 sn sonra kaynak yok)', () => { assert.equal(c3.calan, null); assert.equal(c3.kaynak, 0); });

  await p.evaluate(() => { audio.enabled = false; startGame({ tur: true, ulke: 1 }); game.player.invuln = 1e9; });
  await p.waitForTimeout(1000);
  const c4 = await durum();
  await p.evaluate(() => toggleSound());
  await p.waitForTimeout(1500);
  const c5 = await durum();
  sina('ses kapalıyken müzik çalmaz; açılınca teaser\'sız döngü (1,5 sn içinde)', () => {
    assert.equal(c4.kaynak, 0); assert.equal(c5.calan, 'dongu'); assert.equal(c5.kaynak, 1);
  });
  await p.evaluate(() => { endGame(false); startGame(); game.player.invuln = 1e9; });
  await p.waitForTimeout(1000);
  const c6 = await durum();
  sina('normal oyunda müzik yok', () => { assert.equal(c6.kaynak, 0); assert.equal(c6.calan, null); });

  await p.evaluate(() => { endGame(false); startGame({ tur: true, ulke: 1 }); game.player.invuln = 1e9; });
  await bekleDongu('TR');
  await p.evaluate(() => pauseGame());
  await p.waitForTimeout(300);
  const c7 = await durum();
  await p.evaluate(() => resumeGame());
  await p.waitForTimeout(400);
  const c8 = await durum();
  sina('duraklatmada müzik kısılır, döngü sürer; devamda geri gelir', () => {
    assert.equal(c7.kazanc, 0); assert.equal(c7.kaynak, 1); assert.equal(c7.calan, 'dongu');
    assert.ok(yakin(c8.kazanc, 0.6), String(c8.kazanc));
  });
  const arka = await p.evaluate(async () => {
    const goster = async (gizli) => {
      Object.defineProperty(document, 'hidden', { value: gizli, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      await new Promise((r) => setTimeout(r, 300));
      return audio.ctx.state;
    };
    const r = [await goster(true), await goster(false)];
    delete document.hidden;
    return r;
  });
  sina('arka planda ses bağlamı askıya alınır, dönünce sürer', () => { assert.deepEqual(arka, ['suspended', 'running']); });

  // Duraklat → 🏠 Menüye Dön → yeni Dünya Turu: duraklatma bir sonraki oyuna taşınmaz (son inceleme bulgusu)
  await p.evaluate(() => { pauseGame(); quitToMenu(); startGame({ tur: true, ulke: 1 }); game.player.invuln = 1e9; });
  await bekleDongu('TR');
  await p.waitForTimeout(1200);
  const cMenu = await durum();
  sina('duraklatıp menüye dönünce sonraki Dünya Turu\'nda müzik 0,6 kazançla çalar', () => {
    assert.equal(cMenu.calan, 'dongu'); assert.ok(yakin(cMenu.kazanc, 0.6), JSON.stringify(cMenu));
  });

  // Review Focus 6: teaser çözülürken oyun biter ve başka ülke başlar → tek kaynak, yeni ülkenin döngüsü
  await p.evaluate(() => { endGame(false); startGame({ tur: true, ulke: 1 }); game.player.invuln = 1e9; });
  await p.waitForTimeout(200);
  await p.evaluate(() => { endGame(false); startGame({ tur: true, ulke: 43 }); game.player.invuln = 1e9; });
  await p.waitForTimeout(7000);
  const c9 = await durum();
  sina('hızlı yeniden başlatma: 7 sn sonra yalnız JP döngüsü (tek kaynak)', () => { assert.deepEqual([c9.calan, c9.kod, c9.kaynak], ['dongu', 'JP', 1]); });

  // Uçak geçişi: 42. ülke bitince uçakla birlikte 43. ülkenin (JP) teaser'ı başlar
  await p.evaluate(() => { endGame(false); startGame({ tur: true, ulke: 42 }); game.player.invuln = 1e9; game.bossDefeated = true; game.ghosts = []; });
  const ucak = await p.waitForFunction(() => document.getElementById('tur-gecis').classList.contains('active') && muzikDurumu().calan === 'giris', null, { timeout: 6000, polling: 50 })
    .then(() => durum(), () => durum());
  sina('uçak perdesi görünürken sıradaki ülkenin (JP) teaser\'ı çalar', () => { assert.equal(ucak.calan, 'giris'); assert.equal(ucak.kod, 'JP'); });

  // Dosya bulunamazsa müzik çalmaz, oyun sürer, sayfa hatası olmaz
  const hata = await p.evaluate(async () => {
    endGame(false);
    const e = ULKE_MUZIKLERI.TR, asil = { ...e };
    e.dongu = 'muzik/yok-dongu.ogg'; e.giris = 'muzik/yok-giris.ogg';
    let atti = null;
    try { turMuzigiBaslat('TR'); } catch (err) { atti = String(err); }
    await new Promise((r) => setTimeout(r, 1000));
    const r = { atti, kaynak: muzikDurumu().kaynak };
    Object.assign(e, asil);
    return r;
  });
  sina('dosya hatası: turMuzigiBaslat hata atmaz, 1 sn sonra kaynak yok', () => { assert.deepEqual(hata, { atti: null, kaynak: 0 }); });

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
