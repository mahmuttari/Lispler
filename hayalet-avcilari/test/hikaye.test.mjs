// Hayalet Avcıları 3.21.0: Dünya Turu hikâyesi (hikaye.js) — çevrimdışı sınama.
// Kayıt alanları, gezgin/katılış, haritadaki hatıra, sahne, bilmece, defter ve çevrimiçi istemci.
// Çalıştırma: node test/hikaye.test.mjs
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
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
const hatalar = [];
async function sayfaAc(genislik = 390, dil = 'tr', yukseklik = 844) {
  const p = await b.newPage({ viewport: { width: genislik, height: yukseklik }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript((d) => { localStorage.setItem('hayaletAvcilariDil', d); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof hikayeBolumBasladi === 'function');
  return p;
}
const kopya = (p, fn, arg) => p.evaluate(fn, arg);

try {
  const p = await sayfaAc();

  // --- 1) Kayıt alanları korunur, bozuklar atılır ---
  const kayit = await kopya(p, () => {
    const iyi = turKaydiniTemizle({
      acik: 5, damgalar: { TR: 1 }, bitti: 0,
      hatiralar: { TR: 11, XX: 5, UA: 'x' }, bilmeceler: { 1: 10, 11: 5, x: 1 },
      sahneler: { TR: 1, XX: 1 }, katilanlar: { veryi: 3, yok: 4 }, gezgin: 'kinkin', rozet: 7,
    });
    const bozuk = turKaydiniTemizle({ acik: 1, gezgin: 'yok', hatiralar: { TR: -5 }, bilmeceler: { 1: 0 }, rozet: -1 });
    const eski = turKaydiniTemizle({ acik: 2, damgalar: { TR: 2 }, bitti: 0 });
    return { iyi, bozuk, eski };
  });
  sina('hikâye alanları turKaydiniTemizle\'den sağ çıkar, bilinmeyen/bozuk değerler atılır', () => {
    assert.deepEqual(kayit.iyi, {
      acik: 5, damgalar: { TR: 1 }, bitti: 0,
      hatiralar: { TR: 11 }, bilmeceler: { 1: 10 }, sahneler: { TR: 1 }, katilanlar: { veryi: 3 }, gezgin: 'kinkin', rozet: 7,
    });
    assert.equal(kayit.bozuk.gezgin, ''); assert.deepEqual(kayit.bozuk.hatiralar, {}); assert.deepEqual(kayit.bozuk.bilmeceler, {}); assert.equal(kayit.bozuk.rozet, 0);
    assert.deepEqual(kayit.eski, { acik: 2, damgalar: { TR: 2 }, bitti: 0 });
  });

  // --- 2) Tur başlayınca gezgin; katılış ülkesinde sıradaki arkadaş (gezgin hariç) ---
  const gezgin = await kopya(p, () => {
    save.dunyaTuru = { acik: 3, damgalar: {}, bitti: 0 };
    save.selectedChar = 'kinkin';
    startGame({ tur: true, ulke: HIKAYE_KATILIS_ULKE[0] });
    const k = turKaydi();
    const r = { gezgin: k.gezgin, katilanlar: { ...k.katilanlar }, sahne: document.getElementById('hikaye-sahne').classList.contains('active') };
    endGame(false);
    r.kapandi = !document.getElementById('hikaye-sahne').classList.contains('active');
    return r;
  });
  sina('tur gezgini seçili avcı; katılış ülkesinde listedeki ilk arkadaş katılır (gezgin atlanır)', () => {
    assert.equal(gezgin.gezgin, 'kinkin');
    assert.equal(typeof gezgin.katilanlar.veryi, 'number');
    assert.equal(gezgin.katilanlar.kinkin, undefined);
    assert.equal(gezgin.sahne, true); // katılan arkadaşın sahnesi açılır
    assert.equal(gezgin.kapandi, true); // oyun bitince sahne ekranda kalmaz
  });

  // --- 3) Hatıra: boş ve uzak nokta, iki koşuda aynı; dokunma kaydeder; mıknatıs çekmez ---
  const hatira = await kopya(p, () => {
    const kur = () => {
      save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0 };
      startGame({ tur: true, ulke: 1 });
      const h = game.hatira;
      return { h, px: game.player.x, py: game.player.y };
    };
    const a = kur();
    const uzak = a.h ? Math.hypot(a.h.x - a.px, a.h.y - a.py) : 0;
    const bosta = a.h ? (!collidesWalls(a.h.x, a.h.y, 18) && !collidesWaters(a.h.x, a.h.y, 18) && !collidesSpikes(a.h.x, a.h.y, 18) && !collidesLavas(a.h.x, a.h.y, 18)) : false;
    // sahneyi kapat (TR varış sahnesi açılır)
    let guvenlik = 0;
    while (document.getElementById('hikaye-sahne').classList.contains('active') && guvenlik++ < 20) hikayeSahneIleri();
    endGame(false);
    const b = kur();
    const ayni = a.h && b.h && a.h.x === b.h.x && a.h.y === b.h.y;
    // mıknatıs: 60 px uzakta dur, oyun güncellemesi hatırayı oynatmamalı
    let guvenlik2 = 0;
    while (document.getElementById('hikaye-sahne').classList.contains('active') && guvenlik2++ < 20) hikayeSahneIleri();
    const x0 = game.hatira.x, y0 = game.hatira.y;
    game.player.x = x0 + 60; game.player.y = y0;
    hikayeGuncelle();
    const magnet = { x: game.hatira && game.hatira.x, y: game.hatira && game.hatira.y, x0, y0, cekti: (game.pickups || []).some((q) => q === game.hatira) };
    // dokunma
    game.player.x = x0; game.player.y = y0;
    hikayeGuncelle();
    const k = turKaydi();
    const son = { kayit: typeof k.hatiralar.TR, hatira: game.hatira, toast: document.getElementById('toast').textContent };
    endGame(false);
    return { varMi: !!a.h, uzak, bosta, ayni, magnet, son };
  });
  sina('hatıra boş ve ulaşılabilir noktada, oyuncudan ≥ 300 px uzakta; iki koşuda aynı yer', () => {
    assert.ok(hatira.varMi); assert.ok(hatira.uzak >= 300, String(hatira.uzak)); assert.ok(hatira.bosta); assert.ok(hatira.ayni);
  });
  sina('mıknatıs hatırayı çekmez (toplanabilirler arasında değil)', () => {
    assert.equal(hatira.magnet.x, hatira.magnet.x0); assert.equal(hatira.magnet.y, hatira.magnet.y0); assert.equal(hatira.magnet.cekti, false);
  });
  sina('değince hatıra kaydedilir, haritadan kalkar ve bildirim çıkar', () => {
    assert.equal(hatira.son.kayit, 'number'); assert.equal(hatira.son.hatira, null);
    assert.match(hatira.son.toast, /Hatıra:/);
  });

  // --- 4) Sahne oyunu duraklatır; sayaçlar kaydırılır; son satır oyunu sürdürür ---
  const sahne = await kopya(p, () => {
    save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0 };
    startGame({ tur: true, ulke: 1 });
    const acik = document.getElementById('hikaye-sahne').classList.contains('active');
    const durakladi = game.paused;
    const bas = performance.now() - 2000;
    game._duraklamaBas = bas;
    game.player.power = { expires: bas + 4000 };
    let n = 0;
    while (document.getElementById('hikaye-sahne').classList.contains('active') && n++ < 20) hikayeSahneIleri();
    const kalan = game.player.power.expires - performance.now();
    const r = { acik, durakladi, devam: !game.paused, kalan, satir: n };
    endGame(false);
    return r;
  });
  sina('varış sahnesi oyunu duraklatır (duraklatma ekranı yok), son satırda oyun sürer', () => {
    assert.equal(sahne.acik, true); assert.equal(sahne.durakladi, true); assert.equal(sahne.devam, true); assert.ok(sahne.satir >= 1);
  });
  sina('sahne boyunca güç sayacı kaydırılır (kalan süre korunur)', () => { assert.ok(Math.abs(sahne.kalan - 4000) < 120, String(sahne.kalan)); });

  // --- 5) Bilmece: kilit/açık kuralı, yanlış ceza yok, doğru +100 💰 +2 💎 ve bölüm, hepsi -> rozet ---
  const bilmece = await kopya(p, () => {
    const kodlar = ULKELER.slice(0, 10).map((u) => u.kod);
    const ulke = {};
    for (const kod of kodlar) ulke[kod] = { hatira: { ad: 'H ' + kod, simge: '🎁', not: 'not ' + kod }, sahne: [{ k: 'anlatici', m: 'sahne ' + kod }] };
    window.HIKAYE_TEST = {
      avciSirasi: HIKAYE_AVCI_SIRASI, katilisUlke: [3, 7], katilis: {},
      ulke,
      bilmece: [
        { soru: 'Soru 1', secenek: ['A', 'B', 'C'], dogru: 0, bolum: ['Bölüm 1'] },
        { soru: 'Soru 2', secenek: ['A', 'B', 'C'], dogru: 1, bolum: ['Bölüm 2'] },
      ],
      final: [{ k: 'anlatici', m: 'Final' }],
    };
    save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0 };
    const k = hikayeKayit();
    k.bilmeceler = {}; k.rozet = 0; k.hatiralar = {}; k.sahneler = {};
    for (let i = 1; i <= 5; i++) k.hatiralar[ULKELER[i - 1].kod] = Date.now();
    persistSave();
    const d1 = hikayeBilmeceDurumu(1), d2 = hikayeBilmeceDurumu(2);
    const para0 = save.para, elmas0 = save.elmas;
    hikayeBilmeceAc(1);
    const yanlis = hikayeBilmeceSec(1, document.querySelector('#hikaye-bilmece .hikaye-secenek[data-i="1"]'));
    const sonra = {
      cozuldu: !!turKaydi().bilmeceler['1'], para: save.para, elmas: save.elmas,
      acik: document.getElementById('hikaye-bilmece').classList.contains('active'),
    };
    const dogru = hikayeBilmeceSec(0);
    const sonra2 = {
      cozuldu: !!turKaydi().bilmeceler['1'], para: save.para, elmas: save.elmas,
      bolum: document.getElementById('hikaye-sahne').classList.contains('active'),
    };
    let n = 0; while (document.getElementById('hikaye-sahne').classList.contains('active') && n++ < 20) hikayeSahneIleri();
    // ikinci bilmece: kalan beş hatıra
    const k2 = hikayeKayit();
    for (let i = 6; i <= 10; i++) k2.hatiralar[ULKELER[i - 1].kod] = Date.now();
    k2.hatiralar.AR = Date.now();
    persistSave();
    const d2b = hikayeBilmeceDurumu(2);
    hikayeBilmeceAc(2);
    const dogru2 = hikayeBilmeceSec(1);
    n = 0; while (document.getElementById('hikaye-sahne').classList.contains('active') && n++ < 20) hikayeSahneIleri();
    const k3 = turKaydi();
    return { d1, d2, yanlis, sonra, dogru, sonra2, d2b, dogru2, para0, elmas0, rozet: k3.rozet, hepsi: !!k3.bilmeceler['1'] && !!k3.bilmeceler['2'], finalHazir: hikayeFinalHazir() };
  });
  sina('bilmece 1 beş hatırayla açılır, bilmece 2 kilitli kalır', () => { assert.equal(bilmece.d1, 'solvable'); assert.equal(bilmece.d2, 'locked'); assert.equal(bilmece.d2b, 'solvable'); });
  sina('yanlış cevap ceza vermez, bilmece açık kalır', () => {
    assert.equal(bilmece.yanlis, false); assert.equal(bilmece.sonra.cozuldu, false);
    assert.equal(bilmece.sonra.para, bilmece.para0); assert.equal(bilmece.sonra.elmas, bilmece.elmas0); assert.equal(bilmece.sonra.acik, true);
  });
  sina('doğru cevap tam +100 💰 +2 💎 verir, bölümü gösterir', () => {
    assert.equal(bilmece.dogru, true); assert.equal(bilmece.sonra2.cozuldu, true);
    assert.equal(bilmece.sonra2.para, bilmece.para0 + 100); assert.equal(bilmece.sonra2.elmas, bilmece.elmas0 + 2); assert.equal(bilmece.sonra2.bolum, true);
  });
  sina('bütün bilmeceler çözülünce 🧭 rozet ve final açılır', () => {
    assert.equal(bilmece.dogru2, true); assert.equal(bilmece.hepsi, true); assert.equal(typeof bilmece.rozet, 'number'); assert.equal(bilmece.finalHazir, true);
  });

  // --- 6) Defter: 51 yuva, sekme geçişi ---
  const defter = await kopya(p, () => {
    save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0 };
    save.selectedChar = 'kinkin';
    openDunyaTuru();
    turSekmesi('defter');
    const el = document.getElementById('tur-defter');
    const r = {
      gorunur: getComputedStyle(el).display !== 'none',
      liste: getComputedStyle(document.getElementById('tur-liste')).display,
      yuva: el.querySelectorAll('.defter-yuva').length,
      aktif: document.querySelector('#screen-dunya-turu .lb-tab.active').dataset.sekme,
      hedef: Math.min(...[...el.querySelectorAll('.defter-yuva')].map((b) => b.getBoundingClientRect().height)),
    };
    turSekmesi('rota');
    return r;
  });
  sina('defter sekmesi 51 hatıra yuvası çizer, dokunma hedefi ≥ 44 px', () => {
    assert.equal(defter.gorunur, true); assert.equal(defter.liste, 'none'); assert.equal(defter.yuva, 51); assert.equal(defter.aktif, 'defter'); assert.ok(defter.hedef >= 44, String(defter.hedef));
  });

  // --- 7) Arapça RTL, 340 px: yatay taşma yok ---
  const rtl = await sayfaAc(340);
  const tasma = await kopya(rtl, () => {
    document.documentElement.setAttribute('dir', 'rtl');
    save.dunyaTuru = { acik: 3, damgalar: { TR: 1 }, bitti: 0 };
    openDunyaTuru(); turSekmesi('defter');
    const el = document.getElementById('tur-defter');
    return { ic: el.scrollWidth, dis: el.clientWidth, sayfa: document.documentElement.scrollWidth, genislik: window.innerWidth };
  });
  sina('Arapça 340 px defterde yatay taşma yok', () => {
    assert.ok(tasma.ic <= tasma.dis + 1, `${tasma.ic}/${tasma.dis}`); assert.ok(tasma.sayfa <= tasma.genislik + 1, `${tasma.sayfa}/${tasma.genislik}`);
  });
  await rtl.close();

  // --- 7b) Bilmece sorusu satır satır gösterilir (gerçek veri) ---
  const ps = await sayfaAc();
  const metin = await kopya(ps, () => {
    save.dunyaTuru = { acik: 3, damgalar: {}, bitti: 0 };
    hikayeBilmeceAc(1);
    const soru = document.querySelector('#hikaye-bilmece .hikaye-bilmece-soru');
    const stil = getComputedStyle(soru);
    return {
      beyaz: stil.whiteSpace,
      yukseklik: soru.getBoundingClientRect().height,
      satir: parseFloat(stil.lineHeight),
      metin: soru.innerText,
    };
  });
  sina('bilmece sorusu satır satır gösterilir (pre-line, en az 3 satır)', () => {
    assert.equal(metin.beyaz, 'pre-line');
    assert.ok(metin.yukseklik >= metin.satir * 3 - 1, `${metin.yukseklik}/${metin.satir}`);
    assert.ok(metin.metin.includes('\n'));
  });
  await ps.close();

  const ar = await sayfaAc(340, 'ar', 640);
  const arTasma = await kopya(ar, () => {
    document.documentElement.setAttribute('dir', 'rtl');
    save.dunyaTuru = { acik: 3, damgalar: {}, bitti: 0 };
    hikayeBilmeceAc(1);
    const kutu = document.querySelector('#hikaye-bilmece .hikaye-kutu');
    const secenekler = document.querySelectorAll('#hikaye-bilmece .hikaye-secenek');
    const son = secenekler[secenekler.length - 1];
    const sr = son ? son.getBoundingClientRect() : null;
    return {
      ic: kutu.scrollWidth, dis: kutu.clientWidth,
      sayfa: document.documentElement.scrollWidth, genislik: window.innerWidth,
      sonAlt: sr ? sr.bottom : -1, yuk: window.innerHeight,
      kaydirilabilir: kutu.scrollHeight > kutu.clientHeight + 1 && getComputedStyle(kutu).overflowY === 'auto',
    };
  });
  sina('Arapça 340 px bilmecede yatay taşma yok, son seçenek sığar', () => {
    assert.ok(arTasma.ic <= arTasma.dis + 1, `${arTasma.ic}/${arTasma.dis}`);
    assert.ok(arTasma.sayfa <= arTasma.genislik + 1, `${arTasma.sayfa}/${arTasma.genislik}`);
    assert.ok(arTasma.sonAlt > 0 && (arTasma.sonAlt <= arTasma.yuk + 1 || arTasma.kaydirilabilir), `${arTasma.sonAlt}/${arTasma.yuk}`);
  });
  await ar.close();

  // --- 8) Çevrimiçi istemci: hatıra konur ama sahne penceresi açılmaz ---
  const istemci = await kopya(p, () => {
    save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0 };
    online.mode = 'client';
    startGame({ tur: true, ulke: 1 });
    const r = { hatira: !!game.hatira, sahne: document.getElementById('hikaye-sahne').classList.contains('active') };
    online.mode = null;
    endGame(false);
    return r;
  });
  sina('çevrimiçi istemcide hatıra konur, sahne penceresi açılmaz', () => { assert.equal(istemci.hatira, true); assert.equal(istemci.sahne, false); });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close();
  sunucu.close();
}
for (const s of sonuclar) console.log(s);
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
console.log(kotu.length ? `BAŞARISIZ: ${kotu.length}/${sonuclar.length}` : `TAMAM: ${sonuclar.length} sınama`);
process.exit(kotu.length ? 1 : 0);
