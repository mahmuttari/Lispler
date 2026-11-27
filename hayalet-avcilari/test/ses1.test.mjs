// Hayalet Avcıları SES1: canlı obje / yuva canlısı / ortam sesleri — çevrimdışı sınama.
// Çalıştırma: node test/ses1.test.mjs
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
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
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
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof canliObjeSesi === 'function' && typeof yuvaCanlilariUrkut === 'function');

  // (a) bütün canlı ses dosyaları var mı (node tarafı)
  const CANLI = ['panda', 'komodo', 'ejder-alev', 'leylek', 'fil', 'penguen', 'lemur', 'zurafa', 'flamingo', 'gelada', 'deve', 'tavus', 'kaplan', 'kunduz', 'aksolotl', 'lama', 'papagan', 'yavru-ejder', 'fare-kac', 'yarasa-kac', 'fare-cik', 'selale', 'lav'];
  sina('canlı ses dosyalarının hepsi www/sfx/canli altında', () => {
    for (const ad of CANLI) assert.ok(fs.existsSync(path.join(WWW, 'sfx', 'canli', ad + '.m4a')), ad);
  });

  await p.evaluate(() => {
    // Sahte AudioContext: düğümleri ve kazanç/pan değerlerini kaydeder
    window.__sesKur = () => {
      const kayit = { kaynaklar: [], gainler: [], panlar: [], durdurulan: 0 };
      const ctx = {
        currentTime: 0,
        sampleRate: 44100,
        destination: {},
        createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; },
        createOscillator() {
          return {
            type: 'sine',
            frequency: { value: 0, setValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; } },
            connect(n) { this.hedef = n; return n; },
            start() {}, stop() {},
          };
        },
        createBufferSource() {
          return {
            buffer: null, loop: false, onended: null, durduruldu: false,
            connect(n) { this.hedef = n; return n; },
            start() { kayit.kaynaklar.push(this); },
            stop() { this.durduruldu = true; kayit.durdurulan++; },
            disconnect() {},
            bitir() { if (this.onended) this.onended(); },
          };
        },
        createGain() {
          const g = {
            gain: { value: 1, setValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; } },
            connect(n) { this.hedef = n; return n; },
          };
          kayit.gainler.push(g); return g;
        },
        createStereoPanner() {
          const pn = { pan: { value: 0, setValueAtTime(v) { this.value = v; } }, connect(n) { this.hedef = n; return n; } };
          kayit.panlar.push(pn); return pn;
        },
      };
      audio.ctx = ctx;
      audio._preloaded = true;
      audio.enabled = true;
      audio.volumes.sfx = 1;
      audio.samples = {};
      for (const ad of CANLI_SESLERI) audio.samples['c:' + ad] = { fake: ad };
      audio._canliAktif = 0;
      audio._canliSon = {};
      audio._ortam = { selale: null, lav: null };
      audio._ortamBolum = 0;
      window.__sesKayit = kayit;
      // Çağrı kaydı (gerçek canliSes'e de gider)
      window.__cagri = [];
      if (!window.__asilCanli) window.__asilCanli = audio.canliSes.bind(audio);
      audio.canliSes = (ad, x, y, t) => { window.__cagri.push({ ad, x, y, t }); return window.__asilCanli(ad, x, y, t); };
      return kayit;
    };
    window.__hazir = () => {
      if (!game.running) startGame();
      game.running = true; game.paused = false; game.menude = false;
      game.player.dead = false; game.player.x = 1000; game.player.y = 1000;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      game.lavas = []; game.walls = []; game.waters = []; game.spikes = []; game.yuvalar = [];
      game._yolculukDuzen = null;
      if (window.__sesKayit) { window.__sesKayit.kaynaklar.length = 0; window.__sesKayit.gainler.length = 0; window.__sesKayit.panlar.length = 0; }
      audio._canliAktif = 0; audio._canliSon = {}; audio._ortam = { selale: null, lav: null }; audio._ortamBolum = game.level;
      window.__cagri.length = 0;
      return game;
    };
    window.__sonGain = () => window.__sesKayit.gainler[window.__sesKayit.gainler.length - 1].gain.value;
    window.__sonPan = () => window.__sesKayit.panlar[window.__sesKayit.panlar.length - 1].pan.value;
  });

  const sahte = await p.evaluate(() => { __sesKur(); __hazir(); return { W: game.W, sfx: audio.volumes.sfx }; });
  sina('sahte AudioContext ve oyun hazır', () => { assert.ok(sahte.W > 0); assert.equal(sahte.sfx, 1); });

  // (g) duraklatılmış / çalışmayan / ses kapalı → ses yok
  const kapali = await p.evaluate(() => {
    __hazir();
    const r = {};
    game.paused = true; r.paused = audio.canliSes('panda', game.player.x, game.player.y);
    game.paused = false; game.running = false; r.durdu = audio.canliSes('panda', game.player.x, game.player.y);
    game.running = true; audio.enabled = false; r.kapali = audio.canliSes('panda', game.player.x, game.player.y);
    audio.enabled = true;
    r.acik = audio.canliSes('panda', game.player.x, game.player.y);
    return r;
  });
  sina('duraklatma / oyun çalışmıyor / ses kapalı → canlı ses çalınmaz', () => {
    assert.equal(kapali.paused, false); assert.equal(kapali.durdu, false); assert.equal(kapali.kapali, false); assert.equal(kapali.acik, true);
  });

  // (c) uzaklık sesi ve stereo pan
  const uzak = await p.evaluate(() => {
    __hazir();
    const px = game.player.x, py = game.player.y;
    audio._canliSon = {}; audio._canliAktif = 0;
    const sifir = audio.canliSes('panda', px, py);
    const gSifir = __sonGain();
    audio._canliSon = {}; audio._canliAktif = 0;
    const sol = audio.canliSes('komodo', px - 200, py);
    const gSol = __sonGain(), panSol = __sonPan();
    audio._canliSon = {}; audio._canliAktif = 0;
    const sag = audio.canliSes('fil', px + 200, py);
    const panSag = __sonPan();
    audio._canliSon = {}; audio._canliAktif = 0;
    const uzak800 = audio.canliSes('penguen', px + 800, py);
    return { sifir, gSifir, sol, gSol, panSol, sag, panSag, uzak800 };
  });
  sina('uzaklık: 0 px ≈ temel*sfx, 800 px ses yok; pan sol negatif / sağ pozitif', () => {
    assert.equal(uzak.sifir, true); assert.ok(Math.abs(uzak.gSifir - 0.55) < 1e-6, String(uzak.gSifir));
    assert.equal(uzak.sol, true); assert.ok(Math.abs(uzak.gSol - 0.55 * (1 - 200 / 700)) < 1e-6, String(uzak.gSol));
    assert.ok(uzak.panSol < 0, String(uzak.panSol)); assert.ok(uzak.panSag > 0, String(uzak.panSag));
    assert.equal(uzak.uzak800, false);
  });

  // (d) 450 ms kısma ve en çok 3 eşzamanlı kaynak
  await p.evaluate(() => { __hazir(); });
  const kisma1 = await p.evaluate(() => {
    audio._canliSon = {}; audio._canliAktif = 0;
    const a = audio.canliSes('panda', game.player.x, game.player.y);
    const b = audio.canliSes('panda', game.player.x, game.player.y);
    return { a, b };
  });
  sina('aynı ses 450 ms içinde ikinci kez çalınmaz', () => { assert.equal(kisma1.a, true); assert.equal(kisma1.b, false); });
  await bekle(470);
  const kisma2 = await p.evaluate(() => { audio._canliAktif = 0; audio._canliSon = {}; return audio.canliSes('panda', game.player.x, game.player.y); });
  sina('450 ms sonra aynı ses yeniden çalınır', () => { assert.equal(kisma2, true); });
  const esZaman = await p.evaluate(() => {
    __hazir();
    audio._canliSon = {}; audio._canliAktif = 0;
    const r = ['komodo', 'fil', 'penguen', 'lemur'].map((ad) => audio.canliSes(ad, game.player.x, game.player.y));
    const ilk = window.__sesKayit.kaynaklar[0];
    ilk.bitir();
    const sonra = audio.canliSes('lemur', game.player.x, game.player.y);
    return { r, sonra, aktif: audio._canliAktif };
  });
  sina('aynı anda en çok 3 canlı ses; biri bitince yenisi çalar', () => {
    assert.deepEqual(esZaman.r, [true, true, true, false]); assert.equal(esZaman.sonra, true);
  });

  // (b) canlı obje animasyon penceresi başında ses bir kez; ekran dışında yok
  const obje = await p.evaluate(() => {
    __hazir();
    const cagri = [];
    const o = { x: game.player.x, y: game.player.y, w: 40, h: 40, tema: 'CN', tur: 'obje1', tohum: 12345 };
    const off = { x: game.camera.x - 500, y: game.player.y, w: 40, h: 40, tema: 'CN', tur: 'obje1', tohum: 999 };
    window.__cagri.length = 0;
    audio._canliSon = {}; audio._canliAktif = 0;
    canliObjeSesi(o, 'ulke-CN-1', true, 100);
    canliObjeSesi(o, 'ulke-CN-1', true, 100.1);
    const ilkPencere = window.__cagri.filter((c) => c.ad === 'panda').length;
    canliObjeSesi(o, null, true, 100.2); // pencere bitti
    window.__cagri.length = 0;
    canliObjeSesi(off, 'ulke-CN-1', false, 110);
    const ekranDisi = window.__cagri.filter((c) => c.ad === 'panda').length;
    return { ilkPencere, ekranDisi, esleme: window.CANLI_SES['ulke-CN-1'], esleme2: window.CANLI_SES['tema5-obje1'] };
  });
  sina('CN panda penceresi başında bir kez ses; ekran dışı obje ses çıkarmaz', () => {
    assert.equal(obje.ilkPencere, 1);
    assert.equal(obje.ekranDisi, 0);
    assert.equal(obje.esleme, 'panda'); assert.equal(obje.esleme2, 'yavru-ejder');
  });
  await bekle(470);
  const obje2 = await p.evaluate(() => {
    const o = { x: game.player.x, y: game.player.y, w: 40, h: 40, tema: 'CN', tur: 'obje1', tohum: 12345, _sesVerildi: false };
    audio._canliSon = {}; audio._canliAktif = 0;
    window.__cagri.length = 0;
    canliObjeSesi(o, 'ulke-CN-1', true, 200);
    return window.__cagri.filter((c) => c.ad === 'panda').length;
  });
  sina('yeni animasyon penceresi yeniden bir ses çalar', () => { assert.equal(obje2, 1); });

  // (e) yuva canlıları: kaçışta fare/yarasa sesi, oturan farelerde fare-cik
  const yuva = await p.evaluate(() => {
    __hazir();
    const yv = { x: game.player.x + 300, y: game.player.y, r: 32 };
    game.yuvalar = [yv];
    audio._canliSon = {}; audio._canliAktif = 0;
    window.__cagri.length = 0;
    yuvaCanlilariUrkut(yv);
    const ilk = window.__cagri.filter((c) => c.ad === 'fare-kac').length;
    const yarasa = window.__cagri.filter((c) => c.ad === 'yarasa-kac').length;
    yuvaCanlilariUrkut(yv);
    const ikinci = window.__cagri.filter((c) => c.ad === 'fare-kac').length;
    return { ilk, yarasa, ikinci };
  });
  sina('kaçışta fare-kac ve yarasa-kac birer kez', () => {
    assert.equal(yuva.ilk, 1); assert.equal(yuva.yarasa, 1); assert.equal(yuva.ikinci, 1);
  });
  const cik = await p.evaluate(() => {
    __hazir();
    const yv = { x: game.player.x + 300, y: game.player.y, r: 32 };
    game.yuvalar = [yv];
    yuvaCanlilariGuncelle(0.016);
    const st = yuvaCanliDurum(yv, 0);
    audio._canliSon = {}; audio._canliAktif = 0;
    window.__cagri.length = 0;
    st.fareCikSonra = 0;
    yuvaCanlilariGuncelle(0.016);
    const yakin = window.__cagri.filter((c) => c.ad === 'fare-cik').length;
    game.player.x = yv.x + 500; // 400 px dışına çık
    st.fareCikSonra = 0;
    yuvaCanlilariGuncelle(0.016);
    const uzak = window.__cagri.filter((c) => c.ad === 'fare-cik').length;
    return { yakin, uzak };
  });
  sina('fare-cik yalnız 400 px içindeki yuvada çalar', () => { assert.equal(cik.yakin, 1); assert.equal(cik.uzak, 1); });

  // (f) ortam döngüleri: şelale ve lav
  const selale = await p.evaluate(() => {
    __hazir();
    window.yolculukAcik = () => true;
    const d = { x: game.player.x + 100, y: game.player.y };
    game._yolculukDuzen = { zones: [{ _gecitDusmeler: [d] }] };
    game.lavas = [];
    audio._ortam = { selale: null, lav: null };
    audio.ortamGuncelle();
    const varMi = !!audio._ortam.selale;
    const g1 = varMi ? audio._ortam.selale.gain.gain.value : -1;
    d.x = game.player.x + 600;
    audio.ortamGuncelle();
    const uzakBitti = !audio._ortam.selale;
    d.x = game.player.x + 100;
    audio.ortamGuncelle();
    const yeniden = !!audio._ortam.selale;
    game.paused = true;
    audio.ortamGuncelle();
    const durakladi = !audio._ortam.selale;
    game.paused = false;
    audio.ortamGuncelle();
    return { varMi, g1, uzakBitti, yeniden, durakladi };
  });
  sina('şelale döngüsü 500 px içinde başlar, 560 px dışında ve duraklatınca durur', () => {
    assert.equal(selale.varMi, true);
    assert.ok(Math.abs(selale.g1 - 0.35 * (1 - 100 / 500)) < 1e-6, String(selale.g1));
    assert.equal(selale.uzakBitti, true); assert.equal(selale.yeniden, true); assert.equal(selale.durakladi, true);
  });
  const bitis = await p.evaluate(() => {
    window.yolculukAcik = () => true;
    const bitti = !audio._ortam.selale && !audio._ortam.lav;
    endGame(false);
    return { bitti, sonraSelale: !audio._ortam.selale, sonraLav: !audio._ortam.lav };
  });
  sina('oyun bitince (endGame) ortam döngüleri durur', () => { assert.equal(bitis.sonraSelale, true); assert.equal(bitis.sonraLav, true); });
  const lav = await p.evaluate(() => {
    __hazir();
    window.yolculukAcik = () => false;
    game._yolculukDuzen = null;
    game.lavas = [{ x: game.player.x + 50, y: game.player.y - 20, w: 100, h: 40 }];
    audio._ortam = { selale: null, lav: null };
    audio.ortamGuncelle();
    const varMi = !!audio._ortam.lav;
    const g1 = varMi ? audio._ortam.lav.gain.gain.value : -1;
    game.lavas[0].x = game.player.x + 600;
    audio.ortamGuncelle();
    return { varMi, g1, bitti: !audio._ortam.lav };
  });
  sina('lav döngüsü yakında başlar, uzaklaşınca durur', () => {
    assert.equal(lav.varMi, true); assert.ok(Math.abs(lav.g1 - 0.35 * (1 - 100 / 500)) < 1e-6, String(lav.g1)); assert.equal(lav.bitti, true);
  });

  // (h) bu güncellemelerde Math.random yok
  const rastgele = await p.evaluate(() => {
    __hazir();
    window.yolculukAcik = () => true;
    const d = { x: game.player.x + 100, y: game.player.y };
    game._yolculukDuzen = { zones: [{ _gecitDusmeler: [d] }] };
    const yv = { x: game.player.x + 300, y: game.player.y, r: 32 };
    game.yuvalar = [yv];
    const o = { x: game.player.x, y: game.player.y, w: 40, h: 40, tema: 'CN', tur: 'obje1', tohum: 5 };
    const asil = Math.random;
    let hat = null;
    Math.random = () => { hat = new Error('Math.random'); throw hat; };
    try {
      audio.canliSes('panda', game.player.x, game.player.y);
      canliObjeSesi(o, 'ulke-CN-1', true, 300);
      yuvaCanlilariUrkut(yv);
      yuvaCanlilariGuncelle(0.016);
      audio.ortamGuncelle();
    } catch (e) { hat = e; }
    Math.random = asil;
    return { hat: hat ? hat.message : null };
  });
  sina('canlı ses güncellemeleri Math.random kullanmaz', () => { assert.equal(rastgele.hat, null); });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}

// (j) çizim başarımı: perf1 mantığı (oran ≤ 1,3)
sina('perf1: uzun haritada çizim oranı ≤ 1,3 (test/perf1.test.mjs)', () => {
  const r = spawnSync(process.execPath, [path.join(KOK, 'test', 'perf1.test.mjs')], { encoding: 'utf8', timeout: 180000, env: process.env });
  assert.equal(r.status, 0, (r.stdout || '') + (r.stderr || ''));
});

sonuclar.forEach((s) => console.log(s));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
