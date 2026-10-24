// Hayalet Avcıları: Dünya Turu çizimleri (3.14.0) — boss kostüm takımı (51 ülke), bölge aileleri ve ülke objeleri.
// Kostüm: tür listeleri veriyle aynı, 51 kaydın hepsi geçerli; her boss iki ölçekte hatasız çizilir; Dünya Turu bossunda
// taç yok ve gövde kırmızı değil; normal oyunda ve bozuk kayıtta bugünkü taçlı kırmızı boss.
// Aileler ve objeler (CIZILEN_AILELER, CIZILEN_ULKELER; Görev 5 ve 7–13 doldurur): ressam var; önbellek resminde çarpışma
// alanının içi boyalı, biçimin dışı saydam (dört boyut, dört sınır yönü); iki ayrı sayfada aynı resim; canlı katmanın her
// türü ENGEL_CANLI'da; Dünya Turu'nda ailenin zemin deseni döşenir.
// Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md §5
// Çalıştırma: node hayalet-avcilari/test/ulke-cizim.test.mjs [--ekran <klasör>]   (Playwright + Chromium; ağ gerekmez)
// --ekran: 51 kostümlü boss (boss-<KOD>.png, bosslar.png); çizilen her ülkenin kataloğu (katalog-<KOD>.png) ve oyun içi
// görüntüsü (oyun-<KOD>-tr390.png, oyun-<KOD>-ar340.png) klasöre yazılır (gözle denetim).
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

// Ressamı çizilmiş aileler ve ülkeler (Görev 5: KS, DA ve TR, JP; Görev 7–13 kıta kıta ekler)
const CIZILEN_AILELER = ['KS', 'DA', 'K', 'KP', 'SH'];
const CIZILEN_ULKELER = ['TR', 'JP', 'UA', 'PL', 'DE', 'GB', 'FR', 'IT', 'ES', 'MA', 'DZ', 'CI', 'GH', 'NG', 'SD', 'EG'];

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
async function sayfaAc(dil = 'tr', secenek = {}) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...secenek });
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

// Çizilen ülkenin bölümündeki bütün engel resimlerinin özeti (Dünya Turu, çevrimiçi kurucu düzeni: her cihazda aynı harita)
const ulkeResimleri = (p, kodlar) => p.evaluate((kodlar) => {
  const ozet = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); };
  online.mode = 'host'; game.dunyaTuru = true;
  const out = [];
  for (const kod of kodlar) {
    game.level = ulkeKodla(kod).sira; buildWalls(); buildWaters(); buildHazards();
    for (const o of [game.walls, game.waters, game.spikes, game.lavas].flat()) { const R = engelResmi(o); out.push(`${kod}/${o.tur}/${o.tema}:${R ? ozet(R.c.toDataURL()) : 'yok'}`); }
  }
  online.mode = null; game.dunyaTuru = false; game.level = 1;
  return out;
}, kodlar);

// Katalog (aile duvarı, sınır, su, iki obje, zemin deseni) ve oyun içi görüntüler (TR 390 px, AR 340 px)
async function ulkeEkranlari(klasor) {
  fs.mkdirSync(klasor, { recursive: true });
  const k = await sayfaAc('tr', { viewport: { width: 980, height: 900 }, deviceScaleFactor: 1.5 });
  for (const kod of CIZILEN_ULKELER) {
    await k.evaluate((kod) => {
      game.running = false;
      const u = ulkeKodla(kod), W = 980, H = 900;
      document.body.innerHTML = ''; document.body.style.margin = '0';
      const c = document.createElement('canvas'); c.width = W * 1.5; c.height = H * 1.5; c.style.width = W + 'px'; c.style.height = H + 'px';
      document.body.appendChild(c);
      const ctx = c.getContext('2d'); ctx.scale(1.5, 1.5);
      game.dunyaTuru = true; game.level = u.sira; game.worldW = W; game.worldH = H;
      if (!turZeminCiz(ctx)) { ctx.fillStyle = u.palet.zemin; ctx.fillRect(0, 0, W, H); }
      const etiketler = [];
      const ekle = (tur, x, y, w, h, etiket, yon) => { etiketler.push([etiket, x, y + h + 16]); return engelOlustur({ x, y, w, h }, tur, kod, 7 + x * 13 + y * 7 + w, yon); };
      game.walls = [ekle('duvar', 20, 20, 180, 170, 'Duvar 180×170'), ekle('duvar', 230, 20, 110, 90, 'Duvar 110×90'), ekle('duvar', 370, 20, 90, 160, 'Duvar 90×160'),
        ekle('sinir', 490, 20, 470, 30, 'Sınır (üst)', 'ust'), ekle('sinir', 490, 90, 30, 150, 'Sınır (sol)', 'sol'), ekle('duvar', 560, 90, 160, 110, 'Duvar 160×110'),
        ekle('obje1', 20, 240, 180, 150, '1. obje 180×150'), ekle('obje1', 230, 240, 100, 90, '1. obje 100×90'), ekle('obje2', 370, 240, 170, 130, '2. obje 170×130'),
        ekle('obje2', 570, 240, 90, 90, '2. obje 90×90'), ekle('obje1', 20, 640, 150, 180, '1. obje 150×180'), ekle('obje2', 200, 640, 140, 180, '2. obje 140×180'),
        ekle('duvar', 370, 640, 80, 80, 'Duvar 80×80'), ekle('obje1', 480, 640, 80, 80, '1. obje 80×80'), ekle('obje2', 590, 640, 80, 80, '2. obje 80×80')];
      game.waters = [ekle('su', 20, 440, 200, 150, 'Su 200×150'), ekle('su', 250, 440, 120, 90, 'Su 120×90'), ekle('su', 700, 640, 170, 120, 'Su (kesişen)'), ekle('su', 780, 700, 150, 110, '')];
      game.spikes = [ekle('diken', 410, 440, 90, 90, 'Diken (ortak)')];
      game.lavas = [ekle('lav', 530, 470, 110, 90, 'Lav (ortak)')];
      game.camera = { x: 0, y: 0 }; game.W = W; game.H = H;
      engelleriCiz(ctx);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
      for (const [e, x, y] of etiketler) ctx.fillText(e, x, y);
      ctx.font = 'bold 18px sans-serif'; ctx.fillText(`${u.sira}. ${u.ad} (${u.aile})`, 700, 880);
      game.dunyaTuru = false;
    }, kod);
    await k.waitForTimeout(100);
    await k.screenshot({ path: path.join(klasor, `katalog-${kod}.png`) });
  }
  await k.close();
  for (const [dil, gen, boy] of [['tr', 390, 844], ['ar', 340, 740]]) {
    const p = await sayfaAc(dil, { viewport: { width: gen, height: boy }, deviceScaleFactor: 2 });
    for (const kod of CIZILEN_ULKELER) {
      await p.evaluate((kod) => {
        save.playerName = 'Kiki'; persistSave();
        startGame({ tur: true, ulke: ulkeKodla(kod).sira }); game.player.invuln = 1e9;
        const W = game.W, H = game.H; let en = null;
        for (let x = 200; x < game.worldW - 200; x += 40) for (let y = 260; y < game.worldH - 260; y += 40) {
          if (collidesWalls(x, y, 26) || collidesWaters(x, y, 26) || collidesSpikes(x, y, 26) || collidesLavas(x, y, 26)) continue;
          const tam = (o) => o.x > x - W / 2 && o.x + o.w < x + W / 2 && o.y > y - H / 2 && o.y + o.h < y + H / 2;
          const puan = game.walls.slice(4).filter(tam).length * 3 + game.waters.filter(tam).length * 2 + game.spikes.concat(game.lavas).filter(tam).length * 2;
          if (!en || puan > en.puan) en = { x, y, puan };
        }
        game.player.x = en.x; game.player.y = en.y;
        game.ghosts = [];
      }, kod);
      await p.waitForTimeout(900);
      await p.evaluate(() => { game.ghosts = []; document.querySelectorAll('.toast, #toast').forEach((e) => e.classList.remove('show')); });
      await p.waitForTimeout(350);
      await p.screenshot({ path: path.join(klasor, `oyun-${kod}-${dil}${gen}.png`) });
    }
    await p.evaluate(() => { game.running = false; });
    await p.close();
  }
  sonuclar.push(`✓ ülke görüntüleri: ${klasor} (${CIZILEN_ULKELER.length} katalog, ${CIZILEN_ULKELER.length * 2} oyun içi)`);
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

  // --- 2) Aileler ve ülke objeleri ---
  const ressamlar = await p.evaluate(([aileler, ulkeler]) => {
    const eksik = [];
    for (const a of aileler) for (const r of ['duvar', 'su', 'zemin']) if (typeof (ULKE_AILELERI[a] || {})[r] !== 'function') eksik.push(`ressam yok: ${a}.${r}`);
    for (const kod of ulkeler) { const u = ulkeKodla(kod); for (const o of [u.obje1, u.obje2]) if (typeof ULKE_OBJELERI[o.ressam] !== 'function') eksik.push(`ressam yok: ${kod}/${o.ressam}`); }
    for (const kod of ulkeler) if (!aileler.includes(ulkeKodla(kod).aile)) eksik.push(`ailesi çizilmemiş: ${kod}`);
    return eksik;
  }, [CIZILEN_AILELER, CIZILEN_ULKELER]);
  sina(`ressamlar tanımlı (${CIZILEN_AILELER.length} aile, ${CIZILEN_ULKELER.length} ülke)`, () => { assert.deepEqual(ressamlar, []); });

  const kapsama = await p.evaluate(([aileler, ulkeler]) => {
    const BOYUTLAR = [[80, 80], [180, 90], [90, 180], [180, 180]];
    const sorun = [], canliTurler = new Set();
    const denetle = (o, ad) => {
      const R = engelResmi(o);
      if (!R || !R.c) { sorun.push(`${ad} resim yok`); return; }
      for (const n of R.canli || []) canliTurler.add(n.tur);
      const c = R.c, s = c.width / o.w, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const alfa = (x, y) => d[(Math.min(c.height - 1, Math.floor(y * s)) * c.width + Math.min(c.width - 1, Math.floor(x * s))) * 4 + 3];
      let bos = null, tasan = null;
      for (let y = 1; y < o.h; y += 2) for (let x = 1; x < o.w; x += 2) {
        if (!bos && engelUzaklik(o.carpisma, x, y) < -2 && alfa(x, y) === 0) bos = `${x},${y}`;
        const dis = o.derinlik ? engelUzaklik(o.carpisma, x, y) : engelUzaklik(o.bicim, x, y);
        if (!tasan && dis > o.pay + 3 && alfa(x, y) > 0) tasan = `${x},${y} (${dis.toFixed(1)} px)`;
      }
      if (bos) sorun.push(`${ad} çarpışma içi boş: ${bos}`);
      if (tasan) sorun.push(`${ad} biçim dışı boyalı: ${tasan}`);
    };
    for (const a of aileler) {
      const kod = ulkeler.find((k) => ulkeKodla(k).aile === a) || ULKELER.find((u) => u.aile === a).kod; // ailenin çizilmiş bir ülkesi
      for (const tur of ['duvar', 'su']) for (const [w, h] of BOYUTLAR) denetle(engelOlustur({ x: 300, y: 200, w, h }, tur, kod, 4000 + w * 3 + h), `${a}/${tur}/${w}x${h}`);
      for (const [yon, w, h] of [['ust', 1600, 30], ['alt', 1600, 30], ['sol', 30, 1200], ['sag', 30, 1200]]) {
        denetle(engelOlustur({ x: 0, y: 0, w, h }, 'sinir', kod, 17, yon), `${a}/sinir-${yon}`);
      }
    }
    for (const kod of ulkeler) for (const tur of ['obje1', 'obje2']) for (const [w, h] of BOYUTLAR) {
      denetle(engelOlustur({ x: 300, y: 200, w, h }, tur, kod, 5000 + w * 7 + h), `${kod}/${tur}/${w}x${h}`);
    }
    return { sorun, canliTurler: [...canliTurler] };
  }, [CIZILEN_AILELER, CIZILEN_ULKELER]);
  sina(`kapsama: çarpışma içi boyalı, biçim dışı saydam (${kapsama.sorun.length} sorun)`, () => {
    assert.deepEqual(kapsama.sorun.slice(0, 6), [], kapsama.sorun.slice(0, 8).join(' | '));
  });
  const canliTanimli = await p.evaluate((turler) => turler.filter((t) => typeof (window.ENGEL_CANLI || {})[t] !== 'function'), kapsama.canliTurler);
  sina(`canlı katmanın türleri ENGEL_CANLI'da (${kapsama.canliTurler.join(', ') || 'yok'})`, () => { assert.deepEqual(canliTanimli, []); });

  const p2 = await sayfaAc();
  const [u1, u2] = await Promise.all([ulkeResimleri(p, CIZILEN_ULKELER), ulkeResimleri(p2, CIZILEN_ULKELER)]);
  await p2.close();
  sina(`iki sayfada ülke resimleri aynı (${u1.length} resim)`, () => {
    assert.ok(u1.length > 20 && !u1.some((x) => x.endsWith(':yok')));
    assert.ok(u1.every((x) => { const [kod, , tema] = x.split(/[/:]/); return tema === kod || ['diken', 'lav'].includes(x.split('/')[1]); }), 'tema ülke kodu değil');
    assert.deepEqual(u1, u2);
  });
  const zemin = await p.evaluate((ulkeler) => ulkeler.map((kod) => {
    game.dunyaTuru = true; game.level = ulkeKodla(kod).sira;
    const c = document.createElement('canvas'); c.width = 300; c.height = 300;
    const ctx = c.getContext('2d'); const W = game.worldW, H = game.worldH; game.worldW = 300; game.worldH = 300;
    const sonuc = turZeminCiz(ctx);
    const d = ctx.getImageData(0, 0, 300, 300).data;
    let farkli = 0; for (let i = 4; i < d.length; i += 4 * 97) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) farkli++;
    game.worldW = W; game.worldH = H; game.dunyaTuru = false; game.level = 1;
    return { kod, sonuc, desenli: farkli > 20 };
  }), CIZILEN_ULKELER);
  sina('Dünya Turu zemini ailenin deseniyle döşenir', () => { for (const z of zemin) { assert.ok(z.sonuc, `${z.kod}: turZeminCiz false`); assert.ok(z.desenli, `${z.kod}: düz renk`); } });

  if (ekranKlasoru) { await ekranlar(p, ekranKlasoru); await ulkeEkranlari(ekranKlasoru); }
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
