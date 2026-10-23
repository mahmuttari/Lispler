// Hayalet Avcıları: arkadaş ekleme ve oyuna davet (3.13.0) — uçtan uca sınama.
// Firebase emülatöründe (RTDB 9000 + Auth 9099) tarayıcı bağlamları: Ayşe, Bora, Cem (+ adsız oyuncu, kuralsız oyuncu).
// Veri katmanı (www/arkadaslar.js): kod, kod çakışması, istek, kabul, karşılıklı istek, çıkar, engel, davet, adsız
// oyuncu, çevrimdışı, hesap verisinin silinmesi, kurallar yüklenmemişken.
// Arkadaşlar ekranı: menüdeki 👫 rozeti, kod kartı, Google satırı, kutudan ekleme, ekrandan kabul, adında HTML ya da
// bilinmeyen karakter anahtarı olan arkadaş, kurallar yokken uyarı.
// Lobi: ➕ / ⏳ / 👫, hızlı çift dokunuş, odadaki durum (room / on), davet penceresi (soluk satırlar, ✓ Gönderildi),
// ⏸ Menü'de 📨 yalnız çevrimiçi oyunda, dolu odada pasif 📨 Davet et.
// Davet şeridi: menüde ve tek kişilik oyunda görünür, Katıl (oyun biter, kazanç kasaya, reklam yok), ✕, aynı oda,
// dolu oda, süresi geçmiş davet, adında HTML olan gönderen, arkadaşlık bitince kalkar.
// Yaşam döngüsü: arka planda ⚪, öne gelince 🟢; ad değişince arkadaşta ve kodda yeni ad; Google hesabı silinince
// arkadaşlık verisi de silinir, yeni anonim kimlik.
// Çalıştırma (Java 21, Playwright + Chromium gerekir):
//   cd hayalet-avcilari/firebase && npm ci && npm run test:arkadas
// Emülatör zaten açıksa: node hayalet-avcilari/test/arkadas.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const SDK = process.env.FIREBASE_SDK || path.join(KOK, 'firebase', 'node_modules', 'firebase');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const DB = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000';
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const NS = 'hayalet-avcilari-default-rtdb'; // game.js › RTDB_URL'nin alt alan adı
const { chromium } = await import(pathToFileURL(PW).href);

// Kurallar oyunun ad alanına yüklenir; "kurallar yok" sınaması arkadaş düğümleri olmayan hâlini yükler
const KURALLAR = fs.readFileSync(path.join(KOK, 'firebase', 'database.rules.json'), 'utf8');
const ARKADASSIZ = (() => { const d = JSON.parse(KURALLAR); for (const k of ['friendCodes', 'users', 'presence']) delete d.rules[k]; return JSON.stringify(d); })();
const sahip = (yol, secenek = {}) => fetch(`http://${DB}/${yol}.json?ns=${NS}`, { ...secenek, headers: { Authorization: 'Bearer owner' } });
async function kurallariYukle(metin) {
  const r = await fetch(`http://${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: metin });
  assert.equal(r.status, 200, `kurallar emülatöre yüklenemedi: ${await r.text()}`);
}
const oku = async (yol) => (await sahip(yol)).json();
await kurallariYukle(KURALLAR);
for (const kok of ['rooms', 'friendCodes', 'users', 'presence']) await sahip(kok, { method: 'DELETE' });

const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;

const [dbHost, dbPort] = DB.split(':');
const EMULATOR = `;(function(){var o=firebase.initializeApp;firebase.initializeApp=function(c,n){var a=o.call(this,c,n);
  a.database().useEmulator(${JSON.stringify(dbHost)},${Number(dbPort)});
  a.auth().useEmulator(${JSON.stringify('http://' + AUTH)},{disableWarnings:true});
  return a;};})();`;

async function sayfaAc(b, ad) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const p = await ctx.newPage();
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.route(/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+\.js)/, async (r) => {
    const dosya = r.request().url().match(/(firebase-[a-z-]+\.js)/)[1];
    let govde = fs.readFileSync(path.join(SDK, dosya), 'utf8');
    if (dosya === 'firebase-app-compat.js') govde += EMULATOR;
    await r.fulfill({ status: 200, contentType: 'text/javascript', body: govde });
  });
  await p.route(/firestore\.googleapis\.com|googlesyndication|doubleclick/, (r) => r.abort());
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  await p.evaluate((ad) => { save.playerName = ad; persistSave(); try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (_) {} }, ad);
  return { ad, ctx, p, hatalar };
}
const bekle = (s, fn, arg, ms = 15000) => s.p.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
const hazir = (s) => bekle(s, () => typeof sosyal !== 'undefined' && sosyal.hazir && !!sosyal.uid);
const uidOf = (s) => s.p.evaluate(() => sosyal.uid);

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
const hepsi = [];
try {
  const A = await sayfaAc(b, 'Ayşe');
  const B = await sayfaAc(b, 'Bora');
  const C = await sayfaAc(b, 'Cem');
  hepsi.push(A, B, C);
  const hazirlar = await Promise.all([A, B, C].map(hazir));
  assert.deepEqual(hazirlar, [true, true, true], 'arkadaş dinleyicileri kurulmadı');
  const [ayse, bora, cem] = await Promise.all([A, B, C].map(uidOf));

  // 1) Kod: alınır, ikinci çağrıda aynı kalır; giriş biçimleri
  const kodA = await A.p.evaluate(() => kodumuHazirla());
  const kodA2 = await A.p.evaluate(() => kodumuHazirla());
  const coz = await A.p.evaluate(() => [arkadasKodunuCoz(' #k7mp2q '), arkadasKodunuCoz('K7MP2O'), arkadasKodunuCoz('K7MP2')]);
  const kodKaydi = await oku(`friendCodes/${kodA}`);
  sina(`kod alınır ve aynı kalır (#${kodA}); "#", boşluk ve küçük harf kabul edilir`, () => {
    assert.match(kodA || '', /^[A-HJKMNP-Z2-9]{6}$/);
    assert.equal(kodA2, kodA);
    assert.deepEqual(coz, ['K7MP2Q', null, null]);
    assert.equal(kodKaydi && kodKaydi.uid, ayse);
  });

  // 2) Kod çakışması: ilk üretilen kod başkasınınsa yeni kod alınır, başkasının kaydı değişmez
  await sahip('friendCodes/QQQQQQ', { method: 'PUT', body: JSON.stringify({ uid: 'baskasi0001', name: 'X' }) });
  const kodC = await C.p.evaluate(() => {
    const asil = window.arkadasKoduUret; let ilk = true;
    window.arkadasKoduUret = () => { if (ilk) { ilk = false; return 'QQQQQQ'; } return asil(); };
    return kodumuHazirla();
  });
  const qq = await oku('friendCodes/QQQQQQ');
  sina(`kod çakışmasında yeni kod alınır (#${kodC})`, () => {
    assert.match(kodC || '', /^[A-HJKMNP-Z2-9]{6}$/);
    assert.notEqual(kodC, 'QQQQQQ');
    assert.equal(qq && qq.uid, 'baskasi0001');
  });

  // 3) İstek: Bora, Ayşe'nin koduyla ekler
  const kodB = await B.p.evaluate(() => kodumuHazirla());
  const istek1 = await B.p.evaluate((k) => kodlaArkadasEkle(k), '#' + kodA.toLowerCase());
  const geldi = await bekle(A, (u) => !!sosyal.istekler[u], bora, 5000);
  const gitti = await bekle(B, (u) => !!sosyal.gonderilen[u], ayse, 5000);
  const istek2 = await B.p.evaluate((k) => kodlaArkadasEkle(k), kodA);
  const kendi = await B.p.evaluate((k) => kodlaArkadasEkle(k), kodB);
  const yok = await B.p.evaluate(() => kodlaArkadasEkle('ZZZZZZ'));
  sina(`istek: gönderildi (${istek1}), Ayşe'ye geldi, tekrar "${istek2}", kendi kodu "${kendi}", olmayan kod "${yok}"`, () => {
    assert.equal(istek1, 'gonderildi');
    assert.ok(geldi && gitti, 'istek ya da gönderilen kaydı görünmedi');
    assert.equal(istek2, 'bekliyor');
    assert.equal(kendi, 'kendi');
    assert.equal(yok, 'yok');
  });

  // 4) Kabul: aynı anda iki kez (çift dokunma) → bir arkadaşlık; Bora'nın çevrimiçi durumu görünür
  const kabuller = await A.p.evaluate((u) => Promise.all([istegiKabulEt(u), istegiKabulEt(u)]), bora);
  const ikiTaraf = await bekle(A, (u) => !!sosyal.arkadaslar[u] && !sosyal.istekler[u], bora, 5000)
    && await bekle(B, (u) => !!sosyal.arkadaslar[u] && !sosyal.gonderilen[u], ayse, 5000);
  const cevrimici = await bekle(A, (u) => arkadasDurumu(u) === 'on', bora, 5000);
  sina(`kabul: çift dokunuşta tek arkadaşlık (${kabuller.join(', ')}), iki tarafta kayıt, Bora 🟢`, () => {
    assert.ok(kabuller.includes('kabul'));
    assert.ok(!kabuller.includes('hata'), 'ikinci dokunuş hata verdi');
    assert.ok(ikiTaraf, 'iki tarafta arkadaş kaydı yok ya da istek kalmış');
    assert.ok(cevrimici, 'Ayşe, Bora\'yı çevrimiçi görmüyor');
  });

  // 5) Karşılıklı istek: Ayşe ile Cem aynı anda birbirini ekler → ikisi de arkadaş, artık istek kalmaz
  const karsilikli = await Promise.all([A.p.evaluate((k) => kodlaArkadasEkle(k), kodC), C.p.evaluate((k) => kodlaArkadasEkle(k), kodA)]);
  const temiz = (u) => !!sosyal.arkadaslar[u] && !sosyal.istekler[u] && !sosyal.gonderilen[u];
  const karsiliklıTamam = await bekle(A, temiz, cem, 8000) && await bekle(C, temiz, ayse, 8000);
  sina(`karşılıklı istek arkadaşlıkla biter (${karsilikli.join(', ')})`, () => { assert.ok(karsiliklıTamam); });

  // 6) Çıkar: iki taraf birlikte; Ayşe Cem'in durumunu artık okumaz
  const cikti = await A.p.evaluate((u) => arkadasliktanCikar(u), cem);
  const cikarTamam = await bekle(A, (u) => !sosyal.arkadaslar[u] && !sosyal.durumlar[u], cem, 5000)
    && await bekle(C, (u) => !sosyal.arkadaslar[u], ayse, 5000);
  sina('arkadaşlıktan çıkar: iki listede de yok, durum okunmuyor', () => { assert.equal(cikti, true); assert.ok(cikarTamam); });

  // 7) Engel: Cem'in isteği engelle silinir; engelliyken istek gidemez; engel kalkınca gider
  const cemIstek = await C.p.evaluate((k) => kodlaArkadasEkle(k), kodA);
  await bekle(A, (u) => !!sosyal.istekler[u], cem, 5000);
  const engellendi = await A.p.evaluate((u) => engelle(u, 'Cem'), cem);
  const istekSildi = await bekle(A, (u) => !sosyal.istekler[u] && !!sosyal.engeller[u], cem, 5000) && await bekle(C, (u) => !sosyal.gonderilen[u], ayse, 5000);
  const engelliyken = await C.p.evaluate((k) => kodlaArkadasEkle(k), kodA);
  const kaldirildi = await A.p.evaluate((u) => engeliKaldir(u), cem);
  await bekle(A, (u) => !sosyal.engeller[u], cem, 5000);
  const sonra = await C.p.evaluate((k) => kodlaArkadasEkle(k), kodA);
  sina(`engel: istek silinir, engelliyken "${engelliyken}", kalkınca "${sonra}"`, () => {
    assert.equal(cemIstek, 'gonderildi');
    assert.equal(engellendi, true);
    assert.ok(istekSildi, 'engel isteği silmedi');
    assert.equal(engelliyken, 'gonderilemedi');
    assert.equal(kaldirildi, true);
    assert.equal(sonra, 'gonderildi');
  });
  await bekle(A, (u) => !!sosyal.istekler[u], cem, 5000);
  await A.p.evaluate((u) => istegiReddet(u), cem);

  // 8) Davet: Ayşe'nin odasından Bora'ya; 30 sn içinde ikinci kez beklemesi istenir; arkadaş olmayana gitmez
  await A.p.evaluate(async () => { await openOnline(); openCreateRoom(); await submitCreateRoom(); });
  const oda = await A.p.evaluate(() => online.roomId);
  const davet1 = await A.p.evaluate((u) => davetGonder(u), bora);
  const davetGeldi = await bekle(B, (o) => { const d = gecerliDavet(); return !!d && d.room === o; }, oda, 5000);
  const davet2 = await A.p.evaluate((u) => davetGonder(u), bora);
  const davetCem = await A.p.evaluate((u) => davetGonder(u), cem);
  sina(`davet: gönderildi (${davet1}), Bora'da geçerli, tekrar "${davet2}", arkadaş olmayana "${davetCem}"`, () => {
    assert.match(oda || '', /^[A-HJKMNP-Z2-9]{6}$/);
    assert.equal(davet1, 'gonderildi');
    assert.ok(davetGeldi, 'Bora\'da geçerli davet yok');
    assert.equal(davet2, 'bekle');
    assert.equal(davetCem, 'arkadasdegil');
  });

  // 9) Adsız oyuncu (yeni kurulum): istek yazılmaz
  const D = await sayfaAc(b, '');
  hepsi.push(D);
  await hazir(D);
  const adsiz = await D.p.evaluate((u) => { save.playerName = ''; return arkadasIstegiGonder(u, 'Ayşe'); }, ayse);
  const adsizUid = await uidOf(D);
  const adsizKayit = await oku(`users/${ayse}/requests/${adsizUid}`);
  sina(`adı olmayan oyuncu istek gönderemez ("${adsiz}")`, () => { assert.equal(adsiz, 'adyok'); assert.equal(adsizKayit, null); });

  // 10) Çevrimdışı: işlem hemen "hata" döner, kuyruğa yazım bırakmaz (bağlantı gelince istek gitmez)
  await B.p.evaluate(() => { fbDb().goOffline(); });
  await bekle(B, () => sosyal.bagli === false, null, 5000);
  const t0 = Date.now();
  const cevrimdisi = await B.p.evaluate((k) => kodlaArkadasEkle(k), kodC);
  const sure = Date.now() - t0;
  await B.p.evaluate(() => { fbDb().goOnline(); });
  await bekle(B, () => sosyal.bagli === true, null, 10000);
  await B.p.waitForTimeout(1500);
  const kuyruktan = await oku(`users/${cem}/requests/${bora}`);
  sina(`çevrimdışıyken "${cevrimdisi}" (${sure} ms), bağlantı gelince istek gitmedi`, () => {
    assert.equal(cevrimdisi, 'hata');
    assert.ok(sure < 11000, `${sure} ms`);
    assert.equal(kuyruktan, null);
  });

  // 10b) Arkadaşlar ekranı ve menü düğmesi: rozet, kod, Google satırı; kutudan ekleme; ekrandan kabul
  await C.p.evaluate((k) => kodlaArkadasEkle(k), kodA);                       // Cem → Ayşe: rozet için bekleyen istek
  await A.p.evaluate(() => goToMenu());
  const rozet = await bekle(A, () => document.getElementById('menu-arkadas-rozet').textContent === '1', null, 5000);
  await A.p.evaluate(() => openFriends());
  const ekranKod = await A.p.evaluate(() => document.getElementById('arkadas-kod').textContent);
  const google = await A.p.evaluate(() => { const g = document.getElementById('arkadas-google'); return !!g && g.offsetParent !== null; });
  sina(`menüde 👫 rozeti 1, Arkadaşlar ekranında kod ${ekranKod}, anonim oyuncuya Google satırı`, () => {
    assert.ok(rozet, 'rozet 1 değil');
    assert.equal(ekranKod, '#' + kodA);
    assert.ok(google, 'Google satırı görünmüyor');
  });
  await B.p.evaluate(() => openFriends());
  await B.p.evaluate((k) => { document.getElementById('arkadas-kod-girdi').value = '#' + k.toLowerCase(); return friendsAddFromInput(); }, kodC);
  const toastB = await B.p.evaluate(() => document.getElementById('toast').textContent);
  await C.p.evaluate(() => openFriends());
  const dugme = await bekle(C, (u) => !!document.querySelector(`#arkadas-istekler [data-uid="${u}"] .arkadas-kabul`), bora, 5000);
  if (dugme) await C.p.evaluate((u) => document.querySelector(`#arkadas-istekler [data-uid="${u}"] .arkadas-kabul`).click(), bora);
  const ekrandanKabul = await bekle(C, (u) => !!sosyal.arkadaslar[u], bora, 5000) && await bekle(B, (u) => !!sosyal.arkadaslar[u], cem, 5000);
  const toastC = await C.p.evaluate(() => document.getElementById('toast').textContent);
  sina(`kutudan ekleme ("${toastB}") ve ekrandan kabul ("${toastC}")`, () => {
    assert.equal(toastB, '📨 İstek gönderildi: Cem');
    assert.ok(dugme, 'Cem\'in ekranında Bora\'nın isteği yok');
    assert.ok(ekrandanKabul, 'ekrandan kabulle arkadaş olmadılar');
    assert.equal(toastC, '👫 Artık arkadaşsınız: Bora');
  });
  // Adında HTML olan arkadaş düz metin görünür (Review Focus 2)
  const KOTU = '<img src=x onerror=alert(1)>';
  let uyariCikti = false;
  C.p.on('dialog', (d) => { uyariCikti = true; d.dismiss().catch(() => {}); });
  await B.p.evaluate((ad) => { save.playerName = ad; durumumuYaz(); }, KOTU);
  const duzMetin = await bekle(C, ([u, ad]) => {
    const e = document.querySelector(`#arkadas-liste [data-uid="${u}"] .arkadas-ad`);
    return !!e && e.textContent === ad;
  }, [bora, KOTU], 5000);
  const imgYok = await C.p.evaluate(() => document.querySelectorAll('#screen-friends img').length === 0);
  await B.p.evaluate(() => { save.playerName = 'Bora'; durumumuYaz(); });
  sina('adında HTML olan arkadaş listede düz metin görünür', () => {
    assert.ok(duzMetin, 'ad düz metin olarak görünmedi');
    assert.ok(imgYok, 'img öğesi oluştu');
    assert.equal(uyariCikti, false);
  });
  // Bozuk karakter anahtarı ("constructor" CHARACTERS'ta kalıtımla bulunur, drawCharacter'ı çökertir): satır yine çizilir
  await sahip(`presence/${bora}`, { method: 'PATCH', body: JSON.stringify({ charKey: 'constructor', name: 'Bora2' }) });
  const bozukKarakter = await bekle(C, (u) => {
    const e = document.querySelector(`#arkadas-liste [data-uid="${u}"] .arkadas-ad`);
    return !!e && e.textContent === 'Bora2';
  }, bora, 5000);
  await B.p.evaluate(() => durumumuYaz());
  sina('bilinmeyen karakter anahtarlı arkadaş listede çizilir', () => { assert.ok(bozukKarakter, 'liste yeniden çizilmedi'); });
  // Kurallar yokken ya da bağlanılamazken: uyarı görünür, kod kutusu pasif
  const izinEkrani = await A.p.evaluate(() => {
    sosyal.hata = 'izin'; renderFriends();
    const u = document.getElementById('arkadas-uyari');
    const r = { gorunur: !!u && u.offsetParent !== null, metin: u && u.textContent, pasif: document.getElementById('arkadas-kod-girdi').disabled };
    sosyal.hata = null; renderFriends();
    return r;
  });
  sina('kurallar yokken ekranda uyarı, kod kutusu pasif', () => {
    assert.ok(izinEkrani.gorunur, 'uyarı görünmüyor');
    assert.equal(izinEkrani.metin, '⚠ Arkadaşlar şu an kullanılamıyor');
    assert.ok(izinEkrani.pasif, 'kod kutusu pasif değil');
  });

  // 10c) Lobi: ➕ / ⏳ / 👫, çift dokunuş, odadaki durum, davet penceresi, ⏸ Menü'de 📨, dolu odada pasif düğme
  await C.p.evaluate((u) => istegiIptalEt(u), ayse);                        // Cem'in Ayşe'ye bekleyen isteği kalksın: Cem satırı ➕
  await bekle(A, (u) => !sosyal.istekler[u], cem, 5000);
  const zeki = 'zekiCevrimdisi';                                             // durumu hiç yazılmamış (çevrimdışı) arkadaş
  await sahip('', { method: 'PATCH', body: JSON.stringify({ [`users/${ayse}/friends/${zeki}`]: { name: 'Zeki', at: 1 }, [`users/${zeki}/friends/${ayse}`]: { name: 'Ayşe', at: 1 } }) });
  await A.p.evaluate(async () => { await odadanCik(); await openOnline(); openCreateRoom(); selectMaxPlayers(3); await submitCreateRoom(); });
  const odaA = await A.p.evaluate(() => online.roomId);
  await B.p.evaluate((k) => joinRoom(k), odaA);
  await C.p.evaluate((k) => joinRoom(k), odaA);
  await bekle(A, () => online.cachedRoom && Object.keys(online.cachedRoom.players).length === 3);
  const satirSimge = (s, u) => s.p.evaluate((u) => {
    const r = document.querySelector(`#lobby-players [data-uid="${u}"]`);
    const e = r && r.querySelector('.lp-arkadas, .lp-ekle');
    return e ? e.textContent : null;
  }, u);
  const boraSatiri = await satirSimge(A, bora);
  const cemSatiri = await satirSimge(A, cem);
  const doluPasif = await A.p.evaluate(() => document.getElementById('lobby-davet-btn').disabled);
  const odada = await bekle(A, (u) => arkadasDurumu(u) === 'room', bora, 5000);
  await A.p.evaluate((u) => {
    window._toastlar = [];
    const asil = showToast;
    showToast = (m) => { window._toastlar.push(m); asil(m); };
    const d = document.querySelector(`#lobby-players [data-uid="${u}"] .lp-ekle`);
    d.click(); d.click();                                                     // hızlı çift dokunuş
  }, cem);
  const bekliyor = await bekle(A, (u) => {
    const r = document.querySelector(`#lobby-players [data-uid="${u}"] .lp-arkadas`);
    return !!r && r.textContent === '⏳';
  }, cem, 5000);
  await bekle(A, () => window._toastlar.length > 0, null, 5000);              // bildirim sunucu onayından sonra gelir
  await A.p.waitForTimeout(500);                                             // ikinci dokunuşun bildirimi olsaydı gelirdi
  const ciftToast = await A.p.evaluate(() => window._toastlar.slice());
  const cemeIstek = await oku(`users/${cem}/requests/${ayse}`);
  sina(`lobide Bora ${boraSatiri}, Cem ${cemSatiri} → ⏳; çift dokunuşta tek bildirim (${ciftToast.join(' | ')}); dolu odada 📨 pasif`, () => {
    assert.equal(boraSatiri, '👫');
    assert.equal(cemSatiri, '➕');
    assert.ok(bekliyor, 'Cem satırı ⏳ olmadı');
    assert.deepEqual(ciftToast, ['📨 İstek gönderildi: Cem']);
    assert.equal(cemeIstek && cemeIstek.name, 'Ayşe');
    assert.equal(doluPasif, true);
    assert.ok(odada, 'lobideki Bora "room" görünmüyor');
  });
  await A.p.evaluate(() => { sosyal._sonDavet = {}; openInviteModal(); }); // 8. adımdaki davetin 30 sn sınırı burayı etkilemesin
  const pencere = await bekle(A, ([b, z]) => {
    const r = (u) => document.querySelector(`#davet-liste [data-uid="${u}"]`);
    return !!r(b) && r(b).classList.contains('soluk') && !!r(z) && r(z).classList.contains('soluk');
  }, [bora, zeki], 5000);
  await B.p.evaluate(() => leaveRoom());
  const cikinca = await bekle(A, (u) => arkadasDurumu(u) === 'on', bora, 5000);
  const bosYer = await bekle(A, () => document.getElementById('lobby-davet-btn').disabled === false, null, 5000);
  const davetDugmesi = await bekle(A, (u) => { const d = document.querySelector(`#davet-liste [data-uid="${u}"] .davet-gonder`); return !!d && !d.disabled; }, bora, 5000);
  if (davetDugmesi) await A.p.evaluate((u) => document.querySelector(`#davet-liste [data-uid="${u}"] .davet-gonder`).click(), bora);
  const gonderildi = await bekle(A, (u) => {
    const r = document.querySelector(`#davet-liste [data-uid="${u}"]`);
    return !!r && r.textContent.includes('✓ Gönderildi');
  }, bora, 5000);
  const boraDavet = await bekle(B, (o) => { const d = gecerliDavet(); return !!d && d.room === o; }, odaA, 5000);
  await A.p.evaluate(() => closeInviteModal());
  sina('davet penceresi: odadaki ve çevrimdışı arkadaş soluk; odadan çıkan Bora 🟢, 📨 → ✓ Gönderildi, Bora\'da davet', () => {
    assert.ok(pencere, 'Bora (bu odada) ya da Zeki (çevrimdışı) soluk değil');
    assert.ok(cikinca, 'odadan çıkan Bora "on" olmadı');
    assert.ok(bosYer, 'yer açılınca 📨 Davet et pasif kaldı');
    assert.ok(davetDugmesi, 'Bora satırında etkin 📨 yok');
    assert.ok(gonderildi, 'satır "✓ Gönderildi" olmadı');
    assert.ok(boraDavet, 'Bora\'da geçerli davet yok');
  });
  // ⏸ Menü: 📨 yalnız çevrimiçi oyunda
  await C.p.evaluate(async () => { await toggleReady(); });
  await bekle(A, () => document.getElementById('lobby-start-btn').style.display !== 'none');
  await A.p.evaluate(async () => { await startMpGame(); });
  await bekle(A, () => game.running && online.mode === 'host');
  const cevrimiciMenu = await A.p.evaluate(() => { pauseGame(); const d = document.getElementById('pause-davet'); const r = d.offsetParent !== null; resumeGame(); return r; });
  for (const s of [A, C]) await s.p.evaluate(() => quitToMenu());
  const tekMenu = await B.p.evaluate(() => { startGame(); game.player.invuln = 1e9; pauseGame(); const r = document.getElementById('pause-davet').offsetParent !== null; quitToMenu(); return r; });
  await sahip('', { method: 'PATCH', body: JSON.stringify({ [`users/${ayse}/friends/${zeki}`]: null, [`users/${zeki}`]: null }) });
  sina(`⏸ Menü'de 📨 Davet et: çevrimiçi oyunda ${cevrimiciMenu ? 'görünür' : 'yok'}, tek kişilikte ${tekMenu ? 'görünür' : 'gizli'}`, () => {
    assert.equal(cevrimiciMenu, true);
    assert.equal(tekMenu, false);
  });

  // 10d) Davet şeridi ve Katıl: menüden, tek kişilik oyundan; ✕; aynı oda; dolu oda; süresi geçmiş; HTML ad; arkadaşlık biterse
  const serit = (s) => s.p.evaluate(() => {
    const e = document.getElementById('davet-seridi');
    const m = e && e.querySelector('.davet-metin');
    return { gorunur: !!e && e.getClientRects().length > 0, metin: e ? e.textContent : '', kalin: m ? m.querySelectorAll('b').length : -1 };
  });
  const seritGorunur = (s, ms = 5000) => bekle(s, () => { const e = document.getElementById('davet-seridi'); return !!e && e.getClientRects().length > 0; }, null, ms);
  const seritGizli = (s, ms = 5000) => bekle(s, () => { const e = document.getElementById('davet-seridi'); return !!e && e.getClientRects().length === 0; }, null, ms);
  const cagir = (s, u) => s.p.evaluate((u) => { sosyal._sonDavet = {}; return davetGonder(u); }, u); // 30 sn sınırı sınamaları bekletmesin
  const silinene = async (yol) => { for (let i = 0; i < 20; i++) { if (await oku(yol) === null) return true; await new Promise((r) => setTimeout(r, 250)); } return false; };
  await sahip('', { method: 'PATCH', body: JSON.stringify({ [`users/${bora}/invites`]: null, [`users/${cem}/invites`]: null }) });
  await C.p.evaluate((u) => istegiKabulEt(u), ayse);                        // 10c'deki ➕ isteği: Cem ile Ayşe arkadaş
  await bekle(A, (u) => !!sosyal.arkadaslar[u], cem, 5000);
  await A.p.evaluate(async () => { await openOnline(); openCreateRoom(); selectMaxPlayers(3); await submitCreateRoom(); });
  const odaD = await A.p.evaluate(() => online.roomId);
  const odaAdi = await A.p.evaluate(() => online.cachedRoom.name);
  await B.p.evaluate(() => goToMenu());
  const d1 = await cagir(A, bora);
  const menudeGorunur = await seritGorunur(B);
  const menudeSerit = await serit(B);
  await B.p.evaluate(() => document.querySelector('#davet-seridi .davet-katil').click());
  const katildi = await bekle(B, (o) => online.roomId === o && document.getElementById('screen-lobby').classList.contains('active'), odaD, 10000);
  const katilincaGizli = await seritGizli(B);
  sina(`menüde şerit (${d1}): "${menudeSerit.metin.slice(0, 60)}", Katıl → Bora Ayşe'nin odasında`, () => {
    assert.ok(menudeGorunur, 'şerit görünmedi');
    assert.ok(menudeSerit.metin.includes('📨 Ayşe seni çağırıyor'), menudeSerit.metin);
    assert.ok(menudeSerit.metin.includes(odaAdi), 'oda adı yok');
    assert.ok(katildi, 'Bora odaya geçmedi');
    assert.ok(katilincaGizli, 'katılınca şerit kalktı');
  });
  // Aynı odadayken gelen davet şerit göstermez ve silinir (Review Focus 5)
  await cagir(A, bora);
  await B.p.waitForTimeout(1500);
  const ayniOda = await serit(B);
  const ayniOdaSilindi = await silinene(`users/${bora}/invites/${ayse}`);
  // ✕: davet sessizce silinir
  await C.p.evaluate(() => goToMenu());
  await cagir(A, cem);
  const cemGorur = await seritGorunur(C);
  await C.p.evaluate(() => document.querySelector('#davet-seridi .davet-kapat').click());
  const kapatinca = await seritGizli(C);
  const kapatilanSilindi = await silinene(`users/${cem}/invites/${ayse}`);
  sina('aynı odadaki oyuncuya şerit çıkmaz; ✕ daveti siler, şerit kalkar', () => {
    assert.equal(ayniOda.gorunur, false);
    assert.ok(ayniOdaSilindi, 'aynı odaya davet silinmedi');
    assert.ok(cemGorur, 'Cem\'de şerit görünmedi');
    assert.ok(kapatinca, '✕ sonrası şerit duruyor');
    assert.ok(kapatilanSilindi, '✕ daveti silmedi');
  });
  // Tek kişilik oyundan Katıl: oyun biter, kazanç kasaya (bölüm bonusu dahil), reklam yok, Cem odada
  const paraOnce = await C.p.evaluate(() => {
    window._reklam = 0;
    const asil = reklamOyunBitti;
    reklamOyunBitti = () => { window._reklam++; asil(); };
    window.confirm = () => true;
    startGame(); game.player.invuln = 1e9; game.runPara = 120;
    return save.para;
  });
  await cagir(A, cem);
  const oyundaGorur = await seritGorunur(C);
  await C.p.evaluate(() => document.querySelector('#davet-seridi .davet-katil').click());
  const cemOdada = await bekle(C, (o) => online.roomId === o, odaD, 10000);
  const tekSonra = await C.p.evaluate(() => ({ para: save.para, calisiyor: game.running, reklam: window._reklam, sonuc: document.getElementById('screen-gameover').classList.contains('active') }));
  sina(`tek kişilik oyundan Katıl: para ${paraOnce} → ${tekSonra.para}, oyun bitti, reklam ${tekSonra.reklam}, Cem odada`, () => {
    assert.ok(oyundaGorur, 'oyunda şerit görünmedi');
    assert.ok(tekSonra.para - paraOnce >= 120, `${tekSonra.para - paraOnce}`);
    assert.equal(tekSonra.calisiyor, false);
    assert.equal(tekSonra.sonuc, false, 'sonuç ekranı açık kaldı');
    assert.equal(tekSonra.reklam, 0);
    assert.ok(cemOdada, 'Cem odaya geçmedi');
  });
  // Oda dolmuşken Katıl: "Oda dolu", davet silinmiş (Review Focus 5)
  await B.p.evaluate(() => leaveRoom());
  await bekle(A, () => Object.keys(online.cachedRoom.players).length === 2);
  await cagir(A, bora);
  await seritGorunur(B);
  await sahip(`rooms/${odaD}/players/dolduran`, { method: 'PUT', body: JSON.stringify({ name: 'Dolduran', charKey: 'kinkin', costumeIdx: 0, ready: false, joinedAt: Date.now(), lastSeen: Date.now() }) });
  await B.p.evaluate(() => document.querySelector('#davet-seridi .davet-katil').click());
  const doluToast = await bekle(B, () => document.getElementById('toast').textContent === 'Oda dolu', null, 5000);
  const doluSilindi = await silinene(`users/${bora}/invites/${ayse}`);
  const doluOda = await B.p.evaluate(() => online.roomId);
  await sahip(`rooms/${odaD}/players/dolduran`, { method: 'DELETE' });
  sina('oda doluyken Katıl: "Oda dolu", davet silindi, Bora odaya girmedi', () => {
    assert.ok(doluToast, '"Oda dolu" bildirimi yok');
    assert.ok(doluSilindi, 'davet silinmedi');
    assert.equal(doluOda, null);
  });
  // Süresi geçmiş davet (6 dk önce) gösterilmez ve silinir
  await sahip(`users/${bora}/invites/${ayse}`, { method: 'PUT', body: JSON.stringify({ room: odaD, roomName: odaAdi, name: 'Ayşe', at: Date.now() - 6 * 60 * 1000 }) });
  const eskiSilindi = await silinene(`users/${bora}/invites/${ayse}`);
  const eskiSerit = await serit(B);
  // Adında HTML olan gönderen: şeritte düz metin (Review Focus 2)
  await A.p.evaluate(() => { save.playerName = '<b>x</b>'; });
  await cagir(A, bora);
  await seritGorunur(B);
  const htmlSerit = await serit(B);
  await A.p.evaluate(() => { save.playerName = 'Ayşe'; });
  // Ayşe arkadaşlıktan çıkarınca Bora'daki şerit kaybolur
  await A.p.evaluate((u) => arkadasliktanCikar(u), bora);
  const cikincaGizli = await seritGizli(B);
  sina('süresi geçmiş davet görünmez ve silinir; HTML adlı gönderen düz metin; arkadaşlık bitince şerit kalkar', () => {
    assert.ok(eskiSilindi, 'eski davet silinmedi');
    assert.equal(eskiSerit.gorunur, false);
    assert.ok(htmlSerit.metin.includes('📨 <b>x</b> seni çağırıyor'), htmlSerit.metin);
    assert.equal(htmlSerit.kalin, 0, 'adın içinden <b> öğesi oluştu');
    assert.ok(cikincaGizli, 'arkadaşlık bitince şerit duruyor');
  });
  // 11. adım için Bora ile Ayşe yeniden arkadaş; herkes odadan çıkar
  await B.p.evaluate((k) => kodlaArkadasEkle(k), kodA);
  await bekle(A, (u) => !!sosyal.istekler[u], bora, 5000);
  await A.p.evaluate((u) => istegiKabulEt(u), bora);
  await bekle(B, (u) => !!sosyal.arkadaslar[u], ayse, 5000);
  for (const s of [A, C]) await s.p.evaluate(() => quitToMenu());

  // 10e) Yaşam döngüsü: uygulama arka plana geçince ⚪, öne gelince 🟢; ad değişince arkadaşlarda ve kodda yeni ad
  const gorunurluk = (s, gizli) => s.p.evaluate((gizli) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => gizli });
    document.dispatchEvent(new Event('visibilitychange'));
  }, gizli);
  await gorunurluk(B, true);
  const arkada = await bekle(A, (u) => arkadasDurumu(u) === 'off', bora, 5000);
  await gorunurluk(B, false);
  const onde = await bekle(A, (u) => arkadasDurumu(u) === 'on', bora, 5000);
  await B.p.evaluate(() => { save.zumrut = 100; document.getElementById('name-input').value = 'Bora2'; submitName(); });
  const yeniAd = await bekle(A, (u) => arkadasAdi(u) === 'Bora2', bora, 5000);
  let kodAdi = null;
  for (let i = 0; i < 20 && kodAdi !== 'Bora2'; i++) { kodAdi = ((await oku(`friendCodes/${kodB}`)) || {}).name; if (kodAdi !== 'Bora2') await new Promise((r) => setTimeout(r, 250)); }
  sina(`arka planda ⚪ (${arkada}), öne gelince 🟢 (${onde}); ad değişince arkadaşta ve kodda "Bora2"`, () => {
    assert.ok(arkada, 'arka plandaki Bora çevrimdışı görünmedi');
    assert.ok(onde, 'öne gelen Bora çevrimiçi görünmedi');
    assert.ok(yeniAd, 'Ayşe\'nin listesinde yeni ad yok');
    assert.equal(kodAdi, 'Bora2');
  });

  // 11) Hesabı Sil (Google): önce arkadaşlık verisi (arkadaşın listesi, kendi düğümü, kodu, durumu), sonra hesap;
  //     ardından yeni anonim kimlik
  const bagli = await B.p.evaluate(async () => {
    const kimlik = firebase.auth.GoogleAuthProvider.credential(JSON.stringify({ sub: 'g-bora', email: 'bora@example.com', email_verified: true }));
    await firebase.auth().currentUser.linkWithCredential(kimlik);
    return !!currentFirebaseUser();
  });
  await B.p.evaluate(async () => { window.confirm = () => true; await deleteAccountGoogle(); });
  const listedenCikti = await bekle(A, (u) => !sosyal.arkadaslar[u], bora, 5000);
  const yeniKimlik = await bekle(B, (u) => !!sosyal.uid && sosyal.uid !== u, bora, 15000);
  const boraDugum = await oku(`users/${bora}`);
  const boraKod = await oku(`friendCodes/${kodB}`);
  const boraDurum = await oku(`presence/${bora}`);
  sina('Hesabı Sil: arkadaşın listesinden, kendi düğümü, kodu ve durumu silinir; yeni anonim kimlik', () => {
    assert.ok(bagli, 'sahte Google kimliği bağlanamadı');
    assert.ok(listedenCikti, 'Ayşe\'nin listesinde Bora duruyor');
    assert.equal(boraDugum, null);
    assert.equal(boraKod, null);
    assert.equal(boraDurum, null);
    assert.ok(yeniKimlik, 'Bora\'da yeni anonim kimlik yok');
  });

  // 12) Kurallar yüklenmemişken: arkadaşlar "izin" hatası verir, oda kurma etkilenmez
  await kurallariYukle(ARKADASSIZ);
  const E = await sayfaAc(b, 'Ece');
  hepsi.push(E);
  const izin = await bekle(E, () => typeof sosyal !== 'undefined' && sosyal.hata === 'izin', null, 15000);
  await E.p.evaluate(async () => { await openOnline(); openCreateRoom(); await submitCreateRoom(); });
  const eOda = await E.p.evaluate(() => online.roomId);
  await kurallariYukle(KURALLAR);
  sina('kurallar yokken arkadaşlar "izin" der, oda yine kurulur', () => {
    assert.ok(izin, 'sosyal.hata "izin" olmadı');
    assert.match(eOda || '', /^[A-HJKMNP-Z2-9]{6}$/);
  });

  sina('sayfa hatası yok', () => {
    assert.deepEqual(hepsi.flatMap((s) => s.hatalar.map((x) => `${s.ad || 'adsız'}: ${x}`)), []);
  });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
console.log(basarisiz ? `\n${basarisiz} sınama başarısız` : '\narkadaşlar: hepsi geçti');
process.exit(basarisiz ? 1 : 0);
