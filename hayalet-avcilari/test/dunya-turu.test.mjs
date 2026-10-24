// Hayalet Avcıları: Dünya Turu (3.14.0) — kayıt, kip kancaları, akış ve istemci damgası (çevrimdışı).
// Kayıt: save.dunyaTuru {acik, damgalar, bitti}; eski ya da yeni sürümün yedeği temizlenerek açılır (bilinmeyen kod
// atılır, acik 1–51); damgaBas ilk damgada +3 💎 verir ve acik = max(acik, sıra + 1).
// Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md §3, §6, §9.
// Çalıştırma: node hayalet-avcilari/test/dunya-turu.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

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
const kopya = (p, fn, arg) => p.evaluate(fn, arg);

try {
  const p = await sayfaAc();

  // --- 1) Kayıt ---
  const taze = await kopya(p, () => JSON.parse(JSON.stringify(save.dunyaTuru)));
  sina('taze kayıtta varsayılan Dünya Turu kaydı', () => { assert.deepEqual(taze, { acik: 1, damgalar: {}, bitti: 0 }); });
  const temiz = await kopya(p, () => [turKaydiniTemizle({ acik: 99, damgalar: { FR: 5, XX: 5, DE: 'x' }, bitti: 'a' }), turKaydiniTemizle(undefined)]);
  sina('kayıt temizleme: acik 1–51, bilinmeyen kod ve bozuk damga atılır', () => {
    assert.deepEqual(temiz[0], { acik: 51, damgalar: { FR: 5 }, bitti: 0 });
    assert.deepEqual(temiz[1], { acik: 1, damgalar: {}, bitti: 0 });
  });
  // Eski sürümün yedeği (dunyaTuru yok) ve yeni sürümün yedeği (bilinmeyen ülke kodu) sayfa yeniden yüklenince
  const eski = await (async () => {
    await p.evaluate(() => localStorage.setItem(SAVE_KEY, JSON.stringify({ playerName: 'Eski', para: 5 })));
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);
    return kopya(p, () => ({ tur: save.dunyaTuru, para: save.para }));
  })();
  const yeni = await (async () => {
    await p.evaluate(() => localStorage.setItem(SAVE_KEY, JSON.stringify({ playerName: 'Yeni', dunyaTuru: { acik: 3, damgalar: { TR: 1, ZZ: 2 }, bitti: 0 } })));
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);
    return kopya(p, () => save.dunyaTuru);
  })();
  sina('eski yedek: Dünya Turu varsayılanı, öteki alanlar korunur', () => { assert.deepEqual(eski.tur, { acik: 1, damgalar: {}, bitti: 0 }); assert.equal(eski.para, 5); });
  sina('yeni sürümün yedeği: bilinmeyen kod atılır', () => { assert.deepEqual(yeni, { acik: 3, damgalar: { TR: 1 }, bitti: 0 }); });

  const d = await kopya(p, () => {
    save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0 }; save.elmas = 10;
    const a = damgaBas('FR'); const e1 = save.elmas; const k1 = JSON.parse(JSON.stringify(save.dunyaTuru));
    const ikinci = damgaBas('FR'); const e2 = save.elmas;
    const ar = damgaBas('AR'); const acik = save.dunyaTuru.acik;
    const once = JSON.stringify(save.dunyaTuru);
    const xx = damgaBas('XX');
    const kayitli = JSON.parse(localStorage.getItem(SAVE_KEY)).dunyaTuru;
    return { a, e1, k1, ikinci, e2, ar, acik, xx, ayni: once === JSON.stringify(save.dunyaTuru), kayitli };
  });
  sina('ilk damga +3 💎, acik = sıra + 1', () => {
    assert.deepEqual(d.a, { yeni: true }); assert.equal(d.e1, 13);
    assert.equal(typeof d.k1.damgalar.FR, 'number'); assert.equal(d.k1.acik, 7);
  });
  sina('aynı ülkenin ikinci damgası ödül vermez', () => { assert.deepEqual(d.ikinci, { yeni: false }); assert.equal(d.e2, 13); });
  sina('51. ülkede acik 51\'de kalır', () => { assert.deepEqual(d.ar, { yeni: true }); assert.equal(d.acik, 51); });
  sina('bilinmeyen kod kaydı değiştirmez', () => { assert.deepEqual(d.xx, { yeni: false }); assert.ok(d.ayni); });
  sina('damga kalıcı (localStorage)', () => { assert.ok(d.kayitli && d.kayitli.damgalar.FR && d.kayitli.damgalar.AR); });

  // --- 2) Kip kancaları: tema ülkeden, harita normal oyunun aynı bölümüyle aynı, engellerde ülke kodu ---
  const k = await kopya(p, () => {
    save.playerName = 'Defne'; persistSave();
    startGame({ tur: true, ulke: 6 }); game.player.invuln = 1e9;
    const bas = { tur: game.dunyaTuru, level: game.level, tema: getTheme().name };
    const kutular = () => [game.walls, game.waters, game.spikes, game.lavas].flat().map((o) => [o.x, o.y, o.w, o.h, o.tur]);
    online.mode = 'host';
    game.dunyaTuru = true; game.level = 6; buildWalls(); buildWaters(); buildHazards();
    const turKutular = kutular();
    const temalar = [...new Set([game.walls, game.waters, game.spikes, game.lavas].flat().map((o) => o.tema))];
    // Yedek ressam ve ızgara: Fransa'nın (K ailesi) ressamları ve zemini geçici olarak kaldırılır
    const K = ULKE_AILELERI.K, asil = { duvar: K.duvar, su: K.su, zemin: K.zemin, o1: ULKE_OBJELERI.eyfelKulesi, o2: ULKE_OBJELERI.lavantaTarlasi };
    delete K.duvar; delete K.su; delete K.zemin; delete ULKE_OBJELERI.eyfelKulesi; delete ULKE_OBJELERI.lavantaTarlasi;
    let resimHatasi = null;
    try { for (const o of [game.walls, game.waters, game.spikes, game.lavas].flat()) engelResmi(o); } catch (e) { resimHatasi = e.message; }
    game.dunyaTuru = false; buildWalls(); buildWaters(); buildHazards();
    const normalKutular = kutular();
    online.mode = null;
    game.dunyaTuru = true; game.level = 6;
    const zemin = turZeminCiz(game.ctx);
    Object.assign(K, { duvar: asil.duvar, su: asil.su, zemin: asil.zemin });
    Object.assign(ULKE_OBJELERI, { eyfelKulesi: asil.o1, lavantaTarlasi: asil.o2 });
    for (const a of ['duvar', 'su', 'zemin']) if (!K[a]) delete K[a];
    for (const o of ['eyfelKulesi', 'lavantaTarlasi']) if (!ULKE_OBJELERI[o]) delete ULKE_OBJELERI[o];
    endGame(false);
    startGame();
    const normal = { tur: game.dunyaTuru, level: game.level, tema: getTheme().name, ulke: turUlkesi() };
    endGame(false);
    return { bas, turKutular, normalKutular, temalar, resimHatasi, zemin, normal };
  });
  sina('startGame({tur, ulke}): Dünya Turu, bölüm = ülke sırası, tema ülkeden', () => {
    assert.deepEqual(k.bas, { tur: true, level: 6, tema: 'Fransa' });
  });
  sina('engellerde ülke kodu; harita normal oyunun aynı bölümüyle aynı', () => {
    assert.deepEqual(k.temalar, ['FR']);
    assert.ok(k.turKutular.length > 10);
    assert.deepEqual(k.turKutular, k.normalKutular);
  });
  sina('ressamı eksik ülkede engel resmi hata vermez (yedek ressam)', () => { assert.equal(k.resimHatasi, null); });
  sina('zemin ressamı yokken turZeminCiz false (ızgara çizilir)', () => { assert.equal(k.zemin, false); });
  sina('startGame(): normal oyun, bölüm 1, Mor Şato', () => { assert.deepEqual(k.normal, { tur: false, level: 1, tema: 'Mor Şato', ulke: null }); });

  // --- 3) Ekran: ana menü düğmesi, rota kartları, seçim, pasaport ---
  const e = await kopya(p, () => {
    goToMenu();
    const menu = [...document.querySelectorAll('#screen-menu button')];
    const turDugme = menu.findIndex((b) => b.textContent.trim() === '🌍 Dünya Turu'), online = menu.findIndex((b) => b.textContent.includes('🌐 Online Oyna'));
    save.dunyaTuru = { acik: 7, damgalar: { TR: 1, UA: 1 }, bitti: 0 }; persistSave();
    openDunyaTuru();
    const kart = (n) => document.querySelector(`#tur-liste .tur-kart[data-sira="${n}"]`);
    const kartlar = [...document.querySelectorAll('#tur-liste .tur-kart')];
    const say = (s) => kartlar.filter((k) => k.classList.contains(s)).length;
    const secili = () => [...document.querySelectorAll('#tur-liste .tur-kart.secili')].map((k) => +k.dataset.sira);
    const r = {
      turDugme, online, aktif: document.getElementById('screen-dunya-turu').classList.contains('active'),
      sayi: kartlar.length, damgali: say('damgali'), acik: say('acik'), kilitli: say('kilitli'),
      sayac: document.getElementById('tur-sayac').textContent.trim(), kitalar: document.querySelectorAll('#tur-liste .tur-kita').length,
      ilkSecili: secili(), enKisa: Math.min(...kartlar.map((k) => k.getBoundingClientRect().height)),
      trResim: (kart(1).querySelector('img') || {}).src || '', ad: (kart(6).querySelector('bdi') || {}).textContent,
      durum: [kart(1), kart(3), kart(20)].map((k) => k.querySelector('.tur-durum').textContent),
    };
    kart(20).click(); r.kilitliSonra = secili();
    kart(3).click(); r.acikSonra = secili();
    turSekmesi('pasaport');
    const gorunur = (id) => getComputedStyle(document.getElementById(id)).display !== 'none';
    r.pasaport = { gorunur: gorunur('tur-pasaport'), liste: gorunur('tur-liste'), damga: document.querySelectorAll('#tur-pasaport .damga:not(.bos)').length,
      bos: document.querySelectorAll('#tur-pasaport .damga.bos').length };
    turSekmesi('rota');
    r.rotaGeri = gorunur('tur-liste') && !gorunur('tur-pasaport');
    return r;
  });
  sina('ana menüde 🌍 Dünya Turu düğmesi Online Oyna\'nın üstünde', () => { assert.ok(e.turDugme >= 0 && e.turDugme < e.online, `${e.turDugme} / ${e.online}`); });
  sina('Dünya Turu ekranı: 51 kart (2 damgalı, 5 açık, 44 kilitli), 4 kıta, sayaç 🛂 2/51', () => {
    assert.ok(e.aktif);
    assert.deepEqual([e.sayi, e.damgali, e.acik, e.kilitli, e.kitalar], [51, 2, 5, 44, 4]);
    assert.equal(e.sayac, '🛂 2/51');
    assert.deepEqual(e.durum, ['🛂', '✈️', '🔒']);
  });
  sina('kartlarda ad <bdi> içinde, ressamı olan ülkede küçük resim, dokunma hedefi ≥ 44 px', () => {
    assert.equal(e.ad, 'Fransa'); assert.match(e.trResim, /^data:image\/png/); assert.ok(e.enKisa >= 44, String(e.enKisa));
  });
  sina('varsayılan seçili kart en ileri açık ülke (7); kilitli kart seçilmez, açık kart seçilir', () => {
    assert.deepEqual(e.ilkSecili, [7]); assert.deepEqual(e.kilitliSonra, [7]); assert.deepEqual(e.acikSonra, [3]);
  });
  sina('pasaport: 51 yuva (2 damga, 49 soluk boş çerçeve); sekmeler arası geçiş', () => {
    assert.deepEqual(e.pasaport, { gorunur: true, liste: false, damga: 2, bos: 49 }); assert.ok(e.rotaGeri);
  });

  // --- 4) Ülke bitince: damga, uçak geçişi, sıradaki ülke ---
  const g1 = await kopya(p, () => {
    window._asil = { pgsBolum, submitOnlineScore, pgsOyunBitti, reklamOyunBitti, damgaBas, nextLevel };
    window._sahte = { pgsBolum: 0, submit: 0, pgsBitti: 0, reklam: [] };
    window.pgsBolum = () => { _sahte.pgsBolum++; };
    window.submitOnlineScore = () => { _sahte.submit++; };
    window.pgsOyunBitti = () => { _sahte.pgsBitti++; };
    window.reklamOyunBitti = (b) => { _sahte.reklam.push(b); };
    save.dunyaTuru = { acik: 7, damgalar: { TR: 1, UA: 1 }, bitti: 0 }; save.elmas = 10; persistSave();
    turUlkeSec(6); dunyaTuruBaslat(); game.player.invuln = 1e9;
    const r = { tur: game.dunyaTuru, level: game.level, tanitim: document.getElementById('toast').textContent };
    game.bossDefeated = true; game.ghosts = [];
    return r;
  });
  const perdeler = () => kopya(p, () => ({ damga: document.getElementById('tur-damga').classList.contains('active'), gecis: document.getElementById('tur-gecis').classList.contains('active') }));
  // Ülke bittiği ilk karede damga basılır (ilk kare yüklü makinede geç gelebilir: sabit süre değil, damga beklenir)
  await p.waitForFunction(() => typeof save.dunyaTuru.damgalar.FR === 'number', null, { timeout: 5000, polling: 20 });
  const g2 = await kopya(p, () => ({ fr: typeof save.dunyaTuru.damgalar.FR === 'number', elmas: save.elmas, level: game.level, toast: document.getElementById('toast').textContent }));
  const g2p = await perdeler();
  await p.waitForTimeout(2000);
  const g3p = await perdeler();
  await p.waitForTimeout(1600);
  const g4 = await kopya(p, () => ({ level: game.level, tema: getTheme().name, toast: document.getElementById('toast').textContent, pgsBolum: _sahte.pgsBolum, acik: save.dunyaTuru.acik }));
  const g4p = await perdeler();
  sina('▶ Başla seçili ülkeden Dünya Turu açar; girişte tanıtım satırı', () => {
    assert.deepEqual(g1, { tur: true, level: 6, tanitim: '✈️ 6. Fransa — Eyfel Kulesi ve lavanta tarlası' });
  });
  sina('ülke bitince damga: FR damgası, +3 💎, bildirim, damga perdesi', () => {
    assert.ok(g2.fr); assert.equal(g2.elmas, 13); assert.equal(g2.level, 6);
    assert.equal(g2.toast, '🛂 Fransa damgası! +3 💎'); assert.deepEqual(g2p, { damga: true, gecis: false });
  });
  sina('1,8 sn sonra uçak geçişi perdesi', () => { assert.deepEqual(g3p, { damga: false, gecis: true }); });
  sina('~3,3 sn sonra sıradaki ülke: bölüm 7 İtalya, tanıtım bildirimi, perdeler gizli, pgsBolum yok', () => {
    assert.deepEqual(g4, { level: 7, tema: 'İtalya', toast: '✈️ 7. İtalya — Kolezyum ve gondollu kanal iskelesi', pgsBolum: 0, acik: 7 });
    assert.deepEqual(g4p, { damga: false, gecis: false });
  });

  // --- 5) Yenilgi: skor listelerine ve rekora yazılmaz; tamamlanma ödülü bu oyunda geçilen ülke başına 50; Tekrar Oyna ---
  const y = await kopya(p, () => {
    const lb = JSON.stringify(loadLeaderboard()), hl = save.highestLevel;
    game.runPara = 0; game.runElmas = 0; game.runZumrut = 0;
    endGame(false);
    const r = { lb: lb === JSON.stringify(loadLeaderboard()), hlOnce: hl, hlSonra: save.highestLevel, submit: _sahte.submit, pgsBitti: _sahte.pgsBitti,
      acik: save.dunyaTuru.acik, sira: document.getElementById('gameover-rank').textContent, para: document.getElementById('final-para').textContent,
      reklam: _sahte.reklam.slice(-1)[0] };
    tekrarOyna();
    r.tekrar = { level: game.level, tur: game.dunyaTuru, running: game.running };
    return r;
  });
  sina('yenilgi: Şampiyonlar, buluta skor ve Play Games yok; highestLevel aynı; sıra satırı boş', () => {
    assert.ok(y.lb); assert.equal(y.hlSonra, y.hlOnce); assert.ok(y.hlOnce < 7, `highestLevel ${y.hlOnce}`);
    assert.equal(y.submit, 0); assert.equal(y.pgsBitti, 0); assert.equal(y.sira, '');
  });
  sina('yenilgi: ulaşılan ülke açık kalır; tamamlanma ödülü geçilen 1 ülke × 50; reklam kutlamasız', () => {
    assert.ok(y.acik >= 7); assert.equal(y.para, '50'); assert.equal(y.reklam && y.reklam.kutlama, false);
  });
  sina('🔁 Tekrar Oyna Dünya Turu\'nu kalınan ülkeden açar', () => { assert.deepEqual(y.tekrar, { level: 7, tur: true, running: true }); });

  // --- 6) 51. ülke: dünya turu tamamlandı ---
  await kopya(p, () => {
    endGame(false);
    save.dunyaTuru = { acik: 51, damgalar: {}, bitti: 0 }; _sahte.reklam = [];
    startGame({ tur: true, ulke: 51 }); game.player.invuln = 1e9; game.bossDefeated = true; game.ghosts = [];
  });
  await p.waitForFunction(() => typeof save.dunyaTuru.damgalar.AR === 'number', null, { timeout: 5000, polling: 20 });
  await p.waitForTimeout(2200);
  const s = await kopya(p, () => {
    const r = { ar: typeof save.dunyaTuru.damgalar.AR === 'number', bitti: save.dunyaTuru.bitti, baslik: document.getElementById('gameover-title').textContent,
      reklam: _sahte.reklam.map((b) => b.kutlama), turBitti: game.turBitti, running: game.running,
      perde: [...document.querySelectorAll('.tur-perde')].some((x) => x.classList.contains('active')) };
    tekrarOyna();
    r.tekrarEkran = document.getElementById('screen-dunya-turu').classList.contains('active');
    return r;
  });
  sina('51. ülke bitince: AR damgası, bitti zamanı, "🌍 Dünya turu tamamlandı!", reklam kutlamalı', () => {
    assert.ok(s.ar); assert.ok(s.bitti > 0); assert.equal(s.baslik, '🌍 Dünya turu tamamlandı!');
    assert.deepEqual(s.reklam, [true]); assert.equal(s.turBitti, true); assert.equal(s.running, false); assert.equal(s.perde, false);
  });
  sina('tur bittikten sonra 🔁 Tekrar Oyna Dünya Turu ekranını açar', () => { assert.ok(s.tekrarEkran); });

  // --- 7) Review Focus 4: geçiş sırasında yenilgi ve hızlı yeniden başlatma; çift tetikleme ---
  await kopya(p, () => {
    save.dunyaTuru = { acik: 7, damgalar: {}, bitti: 0 }; save.elmas = 10;
    startGame({ tur: true, ulke: 6 }); game.player.invuln = 1e9; game.bossDefeated = true; game.ghosts = [];
  });
  await p.waitForFunction(() => typeof save.dunyaTuru.damgalar.FR === 'number', null, { timeout: 5000, polling: 20 });
  await p.waitForTimeout(500);
  await kopya(p, () => { game.runElmas = 0; endGame(false); tekrarOyna(); game.player.invuln = 1e9; });
  await p.waitForTimeout(1800);
  const rf1 = await perdeler();
  await p.waitForTimeout(2200);
  const rf2 = await kopya(p, () => ({ level: game.level, running: game.running, elmas: save.elmas, fr: typeof save.dunyaTuru.damgalar.FR === 'number' }));
  const rf2p = await perdeler();
  sina('geçiş sırasında yenilgi + Tekrar Oyna: eski geçiş iptal, yeni oyun 6\'da kalır, perde yok, tek damga', () => {
    assert.deepEqual(rf1, { damga: false, gecis: false }); assert.deepEqual(rf2p, { damga: false, gecis: false });
    assert.deepEqual(rf2, { level: 6, running: true, elmas: 13, fr: true });
  });
  await kopya(p, () => {
    endGame(false);
    save.dunyaTuru = { acik: 7, damgalar: {}, bitti: 0 };
    startGame({ tur: true, ulke: 6 }); game.player.invuln = 1e9;
    window._sayac = { damga: 0, sonraki: 0 };
    window.damgaBas = (kod) => { _sayac.damga++; return _asil.damgaBas(kod); };
    window.nextLevel = () => { _sayac.sonraki++; return _asil.nextLevel(); };
    turUlkesiBitti(); turUlkesiBitti();
  });
  await p.waitForTimeout(3700);
  const ik = await kopya(p, () => {
    const r = { ..._sayac, level: game.level };
    window.damgaBas = _asil.damgaBas; window.nextLevel = _asil.nextLevel;
    return r;
  });
  sina('turUlkesiBitti iki kez: tek damga, tek nextLevel', () => { assert.deepEqual(ik, { damga: 1, sonraki: 1, level: 7 }); });

  // --- 8) Boss duyurusu ve istemcinin bölüm bildirimi ---
  const bo = await kopya(p, () => {
    endGame(false);
    startGame({ tur: true, ulke: 6 }); game.player.invuln = 1e9;
    spawnBoss();
    const tur = document.getElementById('toast').textContent;
    clientApplyLevel(7);
    const istemci = document.getElementById('toast').textContent;
    endGame(false);
    startGame(); game.player.invuln = 1e9; spawnBoss();
    const normal = document.getElementById('toast').textContent;
    endGame(false);
    return { tur, istemci, normal };
  });
  sina('Dünya Turu bossu: "👻 Bereli hayalet geldi!"; normal oyunda bugünkü duyuru', () => {
    assert.equal(bo.tur, '👻 Bereli hayalet geldi!'); assert.equal(bo.normal, '👑 BÖLÜM 1 BOSS!');
  });
  sina('istemcinin bölüm bildirimi Dünya Turu\'nda tanıtım satırı', () => { assert.equal(bo.istemci, '✈️ 7. İtalya — Kolezyum ve gondollu kanal iskelesi'); });
  await kopya(p, () => Object.assign(window, _asil));

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
