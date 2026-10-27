// Unitica reklam kuralları ve AdMob kimlikleri (node --test unitica/test/*.test.mjs; tarayıcı gerekmez).
// Kurallar www/js/reklam-kural.js'in başında yazılıdır; burada sözleşmenin alt sınırları ve uygulamanın kendi, daha sıkı
// sınırları sınanır. Eklentiyle çağrı sırası (UMP → initialize → banner) araclar/tarayici-dene.mjs'te sahte eklentiyle sınanır.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { KURAL, DOGAL_DURAK, gecisUygunMu, gosterildi, kayitTemizle, yeniOturumMu } from '../www/js/reklam-kural.js';
import { REKLAM_KIMLIK } from '../www/js/reklam-kimlik.js';
import { kimlikOku, kimlikDosyasi, GRADLE, CIKTI } from '../araclar/kimlik.mjs';

const UN = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dk = 60e3;
const T0 = Date.UTC(2026, 9, 27, 10, 0, 0);

/** oturumun 20. dakikasında, Geçmiş'te 1 dk kalınıp sekme çubuğuyla Ana sayfaya dönülüyor: her şey uygun */
const durum = (ek = {}) => ({ simdi: T0 + 20 * dk, oturumBasi: T0, eski: 'history', yeni: 'home', ekranaGiris: T0 + 19 * dk,
  yol: 'tab', klavye: false, altSayfa: false, uyelikGoruldu: 0, ...ek });
const bos = kayitTemizle(null);

test('AdMob kimlikleri: tek kaynak gradle.properties; reklam-kimlik.js onun üretimi; manifest yer tutucudan', () => {
  const g = fs.readFileSync(GRADLE, 'utf8');
  const k = kimlikOku(g);
  assert.equal(fs.readFileSync(CIKTI, 'utf8'), kimlikDosyasi(k), 'reklam-kimlik.js eski: node unitica/araclar/kimlik.mjs');
  assert.deepEqual(REKLAM_KIMLIK, { banner: k.banner, gecis: k.gecis });
  const yayinci = /^ca-app-pub-(\d+)[~/]\d+$/;
  for (const x of [k.app, k.banner, k.gecis]) assert.match(x, yayinci);
  const no = new Set([k.app, k.banner, k.gecis].map((x) => yayinci.exec(x)[1]));
  assert.equal(no.size, 1, 'üç kimlik aynı yayıncıdan olmalı');
  assert.ok(['3940256099942544', '2417242373034448'].includes([...no][0]), `beklenmeyen yayıncı ${[...no][0]}`);
  assert.match(k.app, /~/);
  assert.match(k.banner, /\//);
  assert.match(k.gecis, /\//);
  if ([...no][0] === '3940256099942544') {
    // Google'ın test birimleri: uyarlanabilir banner ve geçiş reklamı
    assert.equal(k.banner, 'ca-app-pub-3940256099942544/9214589741');
    assert.equal(k.gecis, 'ca-app-pub-3940256099942544/1033173712');
  }
  const man = fs.readFileSync(path.join(UN, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  assert.match(man, /com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="\$\{admobAppId\}"/);
  const bg = fs.readFileSync(path.join(UN, 'android', 'app', 'build.gradle'), 'utf8');
  assert.match(bg, /manifestPlaceholders = \[admobAppId: project\.property\('ADMOB_APP_ID'\)\]/);
  assert.match(bg, /TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713'/);
});

test('kurallar sözleşmenin sınırlarından gevşek değil: ilk ≥3 dk yok, ≥4 dk ara, saatte ≤6', () => {
  assert.ok(KURAL.ilkSn >= 180);
  assert.ok(KURAL.araSn >= 240);
  assert.ok(KURAL.saatlikEnCok <= 6 && KURAL.saatlikEnCok >= 1);
  assert.deepEqual(DOGAL_DURAK.sort(), ['favorites', 'history', 'more']);
});

test('doğal durak: Geçmiş / Favoriler / Diğer\'den sekme çubuğu ya da geri tuşuyla ayrılmak', () => {
  assert.deepEqual(gecisUygunMu(durum(), bos), { uygun: true });
  assert.ok(gecisUygunMu(durum({ yol: 'back' }), bos).uygun);
  for (const eski of ['history', 'favorites', 'more']) assert.ok(gecisUygunMu(durum({ eski }), bos).uygun, eski);
  assert.equal(gecisUygunMu(durum({ eski: 'more', yeni: 'history' }), bos).uygun, true, 'Diğer → Geçmiş de bir ayrılıştır');
});

test('asla: ana ekrandan çıkarken, kayıt açarken, dişliyle ayarlara giderken, klavye ya da alt sayfa açıkken', () => {
  assert.equal(gecisUygunMu(durum({ eski: 'home', yeni: 'history' }), bos).neden, 'dogal-durak-degil');
  assert.equal(gecisUygunMu(durum({ eski: 'history', yeni: 'history' }), bos).neden, 'dogal-durak-degil');
  assert.equal(gecisUygunMu(durum({ yol: 'entry' }), bos).neden, 'kullanici-isi');
  assert.equal(gecisUygunMu(durum({ yol: 'settings' }), bos).neden, 'kullanici-isi');
  assert.equal(gecisUygunMu(durum({ klavye: true }), bos).neden, 'mesgul');
  assert.equal(gecisUygunMu(durum({ altSayfa: true }), bos).neden, 'mesgul');
});

test('açılıştan sonraki ilk 5 dakika yok; terk edilen ekranda 5 sn kalınmadıysa yok', () => {
  assert.equal(gecisUygunMu(durum({ simdi: T0 + 4.9 * dk, ekranaGiris: T0 + 3 * dk }), bos).neden, 'oturum-basi');
  assert.ok(gecisUygunMu(durum({ simdi: T0 + 5 * dk, ekranaGiris: T0 + 3 * dk }), bos).uygun);
  assert.equal(gecisUygunMu(durum({ ekranaGiris: T0 + 20 * dk - 4000 }), bos).neden, 'kisa-ziyaret');
});

test('reklamsız üyelik sayfasına bakan 10 dakika boyunca geçiş reklamı görmez', () => {
  assert.equal(gecisUygunMu(durum({ uyelikGoruldu: T0 + 12 * dk }), bos).neden, 'uyelik-sayfasi');
  assert.ok(gecisUygunMu(durum({ uyelikGoruldu: T0 + 9 * dk }), bos).uygun);
});

test('iki reklam arası en az 8 dk, son 60 dakikada en çok 3; sayaç kalıcı kayda yazılır', () => {
  let k = gosterildi(bos, T0 + 10 * dk);
  assert.equal(gecisUygunMu(durum({ simdi: T0 + 17 * dk, ekranaGiris: T0 + 16 * dk }), k).neden, 'ara');
  assert.ok(gecisUygunMu(durum({ simdi: T0 + 18 * dk, ekranaGiris: T0 + 17 * dk }), k).uygun);
  k = gosterildi(gosterildi(k, T0 + 20 * dk), T0 + 30 * dk);
  assert.equal(gecisUygunMu(durum({ simdi: T0 + 50 * dk, ekranaGiris: T0 + 49 * dk }), k).neden, 'saatlik');
  assert.ok(gecisUygunMu(durum({ simdi: T0 + 71 * dk, ekranaGiris: T0 + 70 * dk }), k).uygun, 'ilk gösterim bir saati doldurdu');
  // localStorage'dan dönen bozuk / eski kayıt
  assert.deepEqual(kayitTemizle({ son: [3, 'x', null, 1, 2, 5, 4] }), { son: [3, 4, 5] });
  assert.deepEqual(kayitTemizle('bozuk'), { son: [] });
  assert.deepEqual(JSON.parse(JSON.stringify(gosterildi(bos, T0))), { son: [T0] });
});

test('kural, bir saatte gösterilebilecek reklamı en çok 3\'te tutar (dakika dakika benzetim)', () => {
  let k = bos, say = 0, ekran = 'home', giris = T0;
  for (let t = T0; t < T0 + 3 * 3600e3; t += 30e3) {
    // kullanıcı her 30 sn'de bir sekme değiştiriyor: Geçmiş ↔ Ana
    const yeni = ekran === 'home' ? 'history' : 'home';
    const d = { simdi: t, oturumBasi: T0, eski: ekran, yeni, ekranaGiris: giris, yol: 'tab', klavye: false, altSayfa: false, uyelikGoruldu: 0 };
    if (gecisUygunMu(d, k).uygun) { k = gosterildi(k, t); say++; }
    ekran = yeni; giris = t;
  }
  assert.ok(say <= 9, `3 saatte ${say} geçiş reklamı`);
  assert.ok(say >= 1);
});

test('30 dakikadan uzun arka plandan dönmek yeni oturumdur (yine ilk 5 dk reklamsız)', () => {
  assert.equal(yeniOturumMu(0, T0), false);
  assert.equal(yeniOturumMu(T0, T0 + 29 * dk), false);
  assert.equal(yeniOturumMu(T0, T0 + 30 * dk), true);
});

test('GeoTerva ev reklamı ve zamanlayıcısı kaldırıldı; açılış ve ödüllü reklam yok; içerik derecesi G', () => {
  const www = path.join(UN, 'www');
  assert.ok(!fs.existsSync(path.join(www, 'ads')), 'www/ads klasörü');
  assert.ok(!fs.existsSync(path.join(www, 'js', 'ads.js')) && !fs.existsSync(path.join(www, 'js', 'ads_core.js')));
  const js = fs.readdirSync(path.join(www, 'js'), { recursive: true }).filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(www, 'js', f), 'utf8')).join('\n');
  assert.doesNotMatch(js, /geoterva\.webp|ads\/ads\.json|startAds|adClock/);
  assert.doesNotMatch(js, /loadAppOpen|showAppOpen|prepareRewardVideoAd|showRewardVideoAd/, 'açılış / ödüllü reklam');
  const r = fs.readFileSync(path.join(www, 'js', 'reklam.js'), 'utf8');
  assert.match(r, /maxAdContentRating: 'General'/);
  assert.match(r, /adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER'/);
  // UMP initialize'dan önce
  const govde = r.slice(r.indexOf('export function reklamBaslat'));
  assert.ok(govde.indexOf('requestConsentInfo') < govde.indexOf('ad.initialize('), 'UMP önce');
  assert.ok(govde.indexOf('canRequestAds') < govde.indexOf('ad.initialize('), 'reklam istenemiyorsa başlatma yok');
  assert.match(govde, /isAdFree\(\)/, 'üyede başlatma yok');
});
