// Hayalet Avcıları: ChatGPT görselleri (3.18.0) — çevrimdışı sınama.
// Kural: her çizim işlevi önce resmi dener; resim yoksa bugünkü kod çizimi çalışır. Görseller araclar/gorsel_kes.py ile
// gorsel/ham/ paftalarından kesilir.
// Çalıştırma: node hayalet-avcilari/test/gorsel.test.mjs   (Playwright + Chromium; ağ gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
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
// Diskteki görseller ve liste
const listeKaynak = fs.readFileSync(path.join(WWW, 'gorsel', 'liste.js'), 'utf8');
const LISTE = JSON.parse(listeKaynak.match(/= (\{.*\});/)[1]);
const dosyalar = fs.readdirSync(path.join(WWW, 'gorsel')).filter((f) => f.endsWith('.webp'));
sina('liste.js ile diskteki WebP dosyaları aynı', () => { assert.deepEqual(dosyalar.map((f) => f.slice(0, -5)).sort(), Object.keys(LISTE).sort()); });
const toplam = dosyalar.reduce((t, f) => t + fs.statSync(path.join(WWW, 'gorsel', f)).size, 0);
sina('görseller küçük: toplam 7 MB, her kenar en çok 256 px (tema dokuları 512, menü arka planı 1152, kahraman kartı 320, giriş resmi 1152)', () => {
  assert.ok(toplam < 7 * 1024 * 1024, String(toplam));
  for (const [k, [w, h]] of Object.entries(LISTE)) { const en = k.startsWith('tema') ? 512 : (k === 'menu-arka' || k === 'giris-kahraman') ? 1152 : k.startsWith('kart-') ? 320 : 256; assert.ok(w <= en && h <= en, k); }
});

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
const p = await b.newPage({ viewport: { width: 844, height: 390 } });
p.on('pageerror', (e) => hatalar.push(e.message));
await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
await p.goto(adres, { waitUntil: 'load' });
await p.waitForFunction(() => typeof hayaletResmiCiz === 'function' && typeof startGame === 'function');
await p.waitForFunction((n) => Object.keys(GORSEL).length === n, Object.keys(LISTE).length, { timeout: 10000 });
try {
  const r = await p.evaluate((liste) => {
    const o = {};
    o.boyut = Object.entries(liste).filter(([k, [w, h]]) => GORSEL[k].naturalWidth !== w || GORSEL[k].naturalHeight !== h).map(([k]) => k);
    startGame(); game.paused = true;
    // Her çizim işlevi resmi kullanıyor mu: drawImage sayılır
    const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d');
    let say = 0; const asil = x.drawImage.bind(x); x.drawImage = (...a) => { say++; return asil(...a); };
    const sinan = {
      'hayalet (normal)': () => drawGhost(x, { x: 100, y: 100, hp: 1, maxHp: 1, size: 40, __dogus: -1e9 }),
      'hayalet (atıcı)': () => drawGhost(x, { x: 100, y: 100, hp: 2, maxHp: 2, size: 40, isShooter: true, __dogus: -1e9 }),
      'hayalet (mini)': () => drawGhost(x, { x: 100, y: 100, hp: 1, maxHp: 1, size: 26, fromBoss: true, __dogus: -1e9 }),
      'hayalet (boss)': () => drawGhost(x, { x: 100, y: 100, hp: 9, maxHp: 9, size: 80, isBoss: true, __dogus: -1e9 }),
      'hayalet (donmuş)': () => drawGhost(x, { x: 100, y: 100, hp: 2, maxHp: 2, size: 40, frozenUntil: performance.now() + 1e6, __dogus: -1e9 }),
      ...Object.fromEntries(['para', 'elmas', 'zumrut', 'kalp', 'guc'].map((k) => [`toplanabilir ${k}`, () => drawPickup(x, { x: 100, y: 100, kind: k, value: 1, life: 10 })])),
      ...Object.fromEntries(['baloncuk', 'lazer', 'yesil', 'pompali', 'bazuka'].map((k) => [`silah ${k}`, () => drawGunShape(x, k, 2)])),
      ...Object.fromEntries(['kedi', 'kopek', 'kus'].map((k) => [`pet ${k}`, () => petResmi(x, k, 1, { yurume: 0.3, saldiri: 0.5 })])),
      'yarasa': () => yarasaCiz(x, { x: 100, y: 100, yon: 1, boy: 1, kanat: 1 }),
      'bulut': () => bulutCiz(x, { x: 100, y: 100, cakti: 0.1, boss: false }),
      'çalı': () => caliCiz(x, { x: 100, y: 100, tohum: 1 }, 0, 0.5),
      ...Object.fromEntries(['kinkin', 'kornet', 'kent', 'gul', 'beti', 'sercin'].map((k) => [`karakter ${k}`, () => drawCharacter(x, k, 0, 100, 110, 70)])),
      'timsah (atılış)': () => timsahCiz(x, { x: 100, y: 100, a: Math.PI, t: TIMSAH.uyari + TIMSAH.atilma * 0.5 }),
      'kasırga hortumu': () => hortumCiz(x, 100, 120, 1.2, 1, 1, false),
    };
    o.resimli = {}; o.hata = [];
    const sayimla = (ad, fn) => { say = 0; x.save(); try { fn(); } catch (e) { o.hata.push(`${ad}: ${e.message}`); } x.restore(); return say; };
    for (const [ad, fn] of Object.entries(sinan)) o.resimli[ad] = sayimla(ad, fn);
    // Resimler yokken (pafta gelmedi, dosya yüklenemedi) aynı işlevler kod çizimiyle, drawImage olmadan çalışır
    const yedek = { ...GORSEL }; for (const k of Object.keys(GORSEL)) delete GORSEL[k];
    o.kodla = {};
    for (const [ad, fn] of Object.entries(sinan)) o.kodla[ad] = sayimla(ad, fn);
    Object.assign(GORSEL, yedek);
    // Renk önbelleği ve can kademesi rengi
    const sari = gorselRenkli('hayalet-normal', '#fde68a'); o.onbellek = sari === gorselRenkli('hayalet-normal', '#fde68a');
    const ort = (cv) => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let r = 0, g = 0, bb = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; bb += d[i + 2]; n++; } return [r / n, g / n, bb / n]; };
    const [sr, sg, sb] = ort(sari); o.sariMi = sr > sb + 30 && sg > sb + 20;
    const buz = ort(gorselRenkli('hayalet-normal', '#bae6fd')); o.buzMu = buz[2] > buz[0] + 20;
    // Silah çubuğu ve dükkân simgeleri resimli
    ensureAmmoStock(game.player.charKey).kasirga = 2; game.running = true; refreshWeaponBar();
    o.cubuk = !!document.querySelector('#weapon-bar .weapon-slot img.esya-resim[src="gorsel/esya-kasirga.webp"]');
    o.cubukAlt = (document.querySelector('#weapon-bar img.esya-resim') || {}).alt || '';
    o.emojiyeDon = esyaSimgesiHTML('yokboyle', '🧪') === '🧪';
    // Kare süresi: 40 hayalet + 20 para resimle
    game.ghosts = []; game.pickups = [];
    for (let i = 0; i < 40; i++) game.ghosts.push({ x: game.player.x - 300 + (i % 12) * 50, y: game.player.y - 150 + Math.floor(i / 12) * 60, r: 22, speed: 0, hp: 1 + (i % 5), maxHp: 1 + (i % 5), size: 40, isShooter: i % 7 === 0 });
    for (let i = 0; i < 20; i++) game.pickups.push({ kind: ['para', 'elmas', 'zumrut', 'kalp'][i % 4], value: 1, x: game.player.x - 300 + i * 30, y: game.player.y + 120, life: 10 });
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    render(); const t0 = performance.now(); for (let i = 0; i < 60; i++) render(); o.kareMs = (performance.now() - t0) / 60;
    return o;
  }, LISTE);
  sina('her görsel yüklenir, boyutu listeyle aynı', () => { assert.deepEqual(r.boyut, []); });
  sina('hatasız çizim (resimli ve resimsiz)', () => { assert.deepEqual(r.hata, []); });
  for (const ad of Object.keys(r.resimli)) {
    sina(`${ad}: resim varken resimden, yokken koddan çizilir`, () => { assert.ok(r.resimli[ad] >= 1, `resimli ${r.resimli[ad]}`); assert.equal(r.kodla[ad], 0, `kodla ${r.kodla[ad]}`); });
  }
  // Animasyon kareleri ve karakterler
  const an = await p.evaluate(() => {
    const o = {};
    const BEKLENEN = { 'hayalet-suzul': 6, 'hayalet-puf': 6, 'atici-saldiri': 6, 'boss-bekle': 3, 'boss-kukre': 3, 'boss-yenilgi': 6,
      para: 6, elmas: 3, zumrut: 3, vurus: 3, patlama: 3, buz: 3, kasirga: 3, kedi: 3, kopek: 3, kus: 3, yarasa: 3, timsah: 6,
      'kalp-topla': 3, 'yildiz-topla': 3 };
    o.eksikAnim = Object.entries(BEKLENEN).filter(([ad, n]) => animHazir(ad) !== n).map(([ad, n]) => `${ad}:${animHazir(ad)}/${n}`);
    o.govde = Object.keys(BEKLENEN).filter((ad) => !(ANIM_GOVDE[ad] && ANIM_GOVDE[ad].length === 4));
    const c = document.createElement('canvas'); c.width = c.height = 240; const x = c.getContext('2d');
    let say = 0; const asil = x.drawImage.bind(x); x.drawImage = (...a) => { say++; return asil(...a); };
    // Karakter: resim kod çiziminin boyunda; yürürken bacaklar ayrı (3 parça), Kenit'te (cüppe) tek parça
    o.boy = []; o.yuruyus = {};
    for (const k of Object.keys(GORSEL_LISTESI).filter((k) => k.startsWith('kar-'))) {
      const [, ck, i] = k.split('-'); const kk = karakterKodKutusu(ck, +i);
      if (!(kk.alt > 30 && kk.alt < 60 && kk.ust < -25 && kk.ust > -90)) o.boy.push(`${k}: ${kk.ust}..${kk.alt}`);
    }
    // Gerçek 3D kareler (k3/s3) yüklenmişken kar- paftasının bacak bölünmesini sınamak için geçici kaldırılıyor
    const uclu = {}; for (const k of Object.keys(GORSEL)) if (/^(k3|s3)-/.test(k)) { uclu[k] = GORSEL[k]; delete GORSEL[k]; }
    for (const k of ['kinkin', 'kent', 'fanatik']) { say = 0; x.save(); drawCharacter(x, k, 0, 120, 140, 70, 0, 0.13); x.restore(); o.yuruyus[k] = say; }
    Object.assign(GORSEL, uclu); // geri koy
    // Ölüm kareleri: normal ve boss resimden; Dünya Turu bossu kodla
    o.puf = olumAnimCiz(x, { x: 100, y: 100, size: 40, maxHp: 1, life: 0.5, maxLife: 1 }, 0.5);
    o.bossYenilgi = olumAnimCiz(x, { x: 100, y: 100, size: 80, isBoss: true, life: 0.5, maxLife: 1 }, 0.5);
    game.dunyaTuru = true; o.turBossu = olumAnimCiz(x, { x: 100, y: 100, size: 80, isBoss: true }, 0.5); game.dunyaTuru = false;
    // Efekt kareleri: animEfektleri listesindeki "kare" efekti resimden çizilir, süresi bitince silinir
    animEfektleri.length = 0; animEfektEkle('kare', 50, 50, { ad: 'vurus', sure: 0.3, boyut: 30, now: 1000 });
    say = 0; animEfektleriCiz(x, 1100); o.kareEfekt = say; animEfektleriCiz(x, 1500); o.kareBitti = animEfektleri.length;
    // Toplama: kalp ve yıldızda kare efekti, parada halka
    toplamaEfekti({ kind: 'kalp', x: 0, y: 0 }); toplamaEfekti({ kind: 'para', x: 0, y: 0 });
    o.toplama = animEfektleri.map((e) => e.tur + (e.ad ? ':' + e.ad : '')); animEfektleri.length = 0;
    // Atıcı: şarjda küre karesi (2-5), dururken 1
    const g = { x: 0, y: 0, hp: 2, maxHp: 2, size: 40, isShooter: true, canShoot: true, fireRate: 2400, nextShot: performance.now() + 100000, __dogus: -1e9 };
    say = 0; x.save(); drawGhost(x, g); x.restore(); o.atici = say;
    return o;
  });
  sina('20 animasyonun bütün kareleri yüklü ve gövde kutuları var', () => { assert.deepEqual(an.eksikAnim, []); assert.deepEqual(an.govde, []); });
  sina('karakter resmi kod çiziminin boyunda ve ayak hizasında', () => { assert.deepEqual(an.boy, []); });
  sina('yürürken bacaklar ayrı çizilir (3 parça); Kenit\'in cüppesi tek parça', () => {
    assert.ok(an.yuruyus.kinkin >= 3, String(an.yuruyus.kinkin)); assert.ok(an.yuruyus.fanatik >= 3, String(an.yuruyus.fanatik)); assert.equal(an.yuruyus.kent, 1);
  });
  sina('ölen hayalet ve boss "puf" kareleriyle; Dünya Turu bossu kodla', () => { assert.equal(an.puf, true); assert.equal(an.bossYenilgi, true); assert.equal(an.turBossu, false); });
  sina('efekt kareleri çizilir, süresi bitince silinir; kalpte toplama karesi, parada halka', () => {
    assert.equal(an.kareEfekt, 1); assert.equal(an.kareBitti, 0); assert.deepEqual(an.toplama, ['kare:kalp-topla', 'topla']);
  });
  sina('atıcı hayalet kare kare çizilir', () => { assert.ok(an.atici >= 1, String(an.atici)); });
  sina('hayaletin can kademesi rengi ve donma rengi resimde de görünür; renkli kopya önbellekte', () => {
    assert.equal(r.onbellek, true); assert.equal(r.sariMi, true); assert.equal(r.buzMu, true);
  });
  sina('silah çubuğunda eşya resmi (ad alt metinde); resmi olmayan eşya emojiye döner', () => {
    assert.equal(r.cubuk, true); assert.ok(r.cubukAlt.length > 0); assert.equal(r.emojiyeDon, true);
  });
  sina('40 hayalet + 20 toplanabilir resimle bir kare 12 ms\'den kısa', () => { assert.ok(r.kareMs < 12, String(r.kareMs)); });

  // Tema dokuları: gelen temada zemin ve su resimle (desen), gelmeyende kod çizimi
  const tema = await p.evaluate((liste) => {
    const o = {}; const cagri = [];
    const asil = window.temaDeseni; window.temaDeseni = (n, tur) => { const d = asil(n, tur); cagri.push(`${n}-${tur}-${d ? 'var' : 'yok'}`); return d; };
    const zeminAsil = temaZeminiCiz; temaZeminiCiz = (ctx, n, ...k) => { const d = zeminAsil(ctx, n, ...k); cagri.push(`${n}-zemin-${d ? 'var' : 'yok'}`); return d; };
    const dene = (lv) => {
      startGame(); game.paused = true; while (game.level < lv) nextLevel(); game.paused = true;
      cagri.length = 0; window.engelSuOnbellegiSil(); render();
      for (const w of game.waters || []) { // oyun yalnız ekrandaki gölü boyar: kamera her gölün üstüne gider
        game.camera.x = Math.max(0, w.x + w.w / 2 - game.W / 2); game.camera.y = Math.max(0, w.y + w.h / 2 - game.H / 2);
        for (let i = 0; i < 3; i++) render();
      }
      return [...new Set(cagri)];
    };
    // render() zemin için temaZeminiCiz'i (game.js), su için window.temaDeseni'ni (engeller.js) çağırır
    for (let n = 1; n <= 6; n++) o[n] = { zemin: !!liste[`tema${n}-zemin`], su: !!liste[`tema${n}-su`], cagri: dene(n) };
    temaZeminiCiz = zeminAsil; window.temaDeseni = asil;
    o.dikis = (() => { // dikişsiz: dokunun sol ve sağ kenar sütunu birbirine yakın
      const k = Object.keys(liste).find((x) => x.startsWith('tema')); if (!k) return 0;
      const im = GORSEL[k], c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
      let fark = 0; for (let y = 0; y < c.height; y++) { const a = (y * c.width) * 4, b = (y * c.width + c.width - 1) * 4; fark += Math.abs(d[a] - d[b]) + Math.abs(d[a + 1] - d[b + 1]) + Math.abs(d[a + 2] - d[b + 2]); }
      return fark / c.height / 3;
    })();
    return o;
  }, LISTE);
  sina('gelen temalarda zemin ve su dokusu kullanılır, gelmeyenlerde kod çizimi', () => {
    let gelen = 0;
    for (let n = 1; n <= 6; n++) {
      const t = tema[n];
      if (t.zemin) { gelen++; assert.ok(t.cagri.includes(`${n}-zemin-var`), `T${n} zemin: ${t.cagri}`); }
      else assert.ok(!t.cagri.some((c) => c.startsWith(`${n}-zemin-var`)), `T${n} zemin yok ama kullanıldı`);
      if (t.su) assert.ok(t.cagri.includes(`${n}-su-var`), `T${n} su: ${t.cagri}`);
    }
    assert.ok(gelen >= 1, 'hiç tema dokusu yok');
  });
  sina('tema dokusu dikişsiz (sol ve sağ kenar sütunu ortalama 12\'den az farklı)', () => { assert.ok(tema.dikis < 12, String(tema.dikis)); });

  // Dünya Turu bossu: ülkesinin kıyafetli resmi (boss-<KOD>) varsa resimden, yoksa kıyafet kodla
  const tur = await p.evaluate((liste) => {
    const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d');
    const asil = x.drawImage.bind(x); let ad = []; x.drawImage = (im, ...a) => { ad.push(im.src || 'tuval'); return asil(im, ...a); };
    const sonuc = {};
    startGame(); game.paused = true; game.dunyaTuru = true;
    for (const u of ULKELER) {
      game.level = u.sira; ad = [];
      x.save(); drawGhost(x, { x: 100, y: 110, size: 80, hp: 9, maxHp: 9, isBoss: true, __dogus: -1e9 }); x.restore();
      sonuc[u.kod] = { resim: !!liste[`boss-${u.kod}`], cizilen: ad.some((s) => s.includes(`boss-${u.kod}.webp`)), baska: ad.filter((s) => /hayalet-boss/.test(s)).length };
    }
    game.dunyaTuru = false; game.level = 1;
    return sonuc;
  }, LISTE);
  sina('Dünya Turu bossu ülkesinin kıyafetli resmiyle; resmi olmayan ülkede kıyafet kodla (taçlı boss resmi hiç)', () => {
    const resimli = Object.entries(tur).filter(([, v]) => v.resim);
    assert.ok(resimli.length >= 1, 'hiç ülke boss resmi yok');
    for (const [kod, v] of Object.entries(tur)) {
      assert.equal(v.cizilen, v.resim, `${kod}: resim ${v.resim}, çizilen ${v.cizilen}`);
      assert.equal(v.baska, 0, `${kod}: taçlı boss resmi kullanıldı`);
    }
  });
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
