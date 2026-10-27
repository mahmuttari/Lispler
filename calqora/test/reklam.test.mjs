// Calqora reklam kuralları ve kimlikleri (node --test calqora/test/*.test.mjs; tarayıcı gerekmez).
// - AdMob kimlikleri tek kaynaktan: android/gradle.properties → araclar/kimlik.mjs → www/js/reklam-kimlik.js.
// - Geçiş reklamı sıklığı (www/js/reklam.js › gecisUygunMu): ilk 3 dk yok, iki reklam arası en az 4 dk, saatte en çok 6,
//   yazarken / sayfa açıkken / arka planda yok.
// - Akış (sahte AdMob ve NativePurchases eklentisiyle, gerçek premium.js + reklam.js): önce mağaza, sonra UMP, sonra
//   initialize (G derecesi); banner + geçiş reklamı; doğal durak; üye olunca banner kalkar ve bir daha geçiş yok.
//   Üye için SDK'nın hiç başlatılmaması ayrı süreçte: test/uye.test.mjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { sahteOrtam } from './yardimci.mjs';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (...p) => fs.readFileSync(path.join(KOK, ...p), 'utf8');
const ortam = sahteOrtam({ uye: false });
const kimlikAraci = await import('../araclar/kimlik.mjs');
const reklam = await import('../www/js/reklam.js');
const { REKLAM_KIMLIK, TEST_KIMLIK } = await import('../www/js/reklam-kimlik.js');
const { KURAL, gecisUygunMu, kayitTemizle } = reklam;

test('reklam-kimlik.js gradle.properties ile aynı (node araclar/kimlik.mjs)', () => {
  const props = oku('android', 'gradle.properties');
  assert.equal(oku('www', 'js', 'reklam-kimlik.js'), kimlikAraci.uret(props), 'reklam-kimlik.js eski: node calqora/araclar/kimlik.mjs');
  const k = kimlikAraci.kimlikler(props);
  assert.deepEqual(REKLAM_KIMLIK, k);
  assert.deepEqual(TEST_KIMLIK, kimlikAraci.TEST);
});

test('AdMob kimlikleri ya Google test kimliği ya da mahmuttari@gmail.com hesabının (pub-2417242373034448)', () => {
  const k = kimlikAraci.kimlikler(oku('android', 'gradle.properties'));
  const yayinci = new Set(Object.values(k).map((x) => /^ca-app-pub-(\d+)[~/]\d+$/.exec(x)[1]));
  assert.equal(yayinci.size, 1, 'üç kimlik aynı yayıncıdan olmalı');
  assert.ok(['3940256099942544', '2417242373034448'].includes([...yayinci][0]), `beklenmeyen yayıncı ${[...yayinci]}`);
  assert.match(k.uygulama, /~/);
  assert.match(k.banner, /\//);
  assert.match(k.gecis, /\//);
  if ([...yayinci][0] === '3940256099942544') assert.deepEqual(k, kimlikAraci.TEST, 'test kimlikleri karışık olmamalı');
});

test('manifestteki AdMob uygulama kimliği build.gradle yer tutucusundan; hata ayıklama derlemesi test kimliği', () => {
  const man = oku('android', 'app', 'src', 'main', 'AndroidManifest.xml');
  assert.match(man, /android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="\$\{admobAppId\}"/);
  const g = oku('android', 'app', 'build.gradle');
  assert.match(g, /manifestPlaceholders = \[admobAppId: project\.property\('ADMOB_APP_ID'\)\]/);
  assert.ok(g.includes(`TEST_APP_ID = '${kimlikAraci.TEST.uygulama}'`));
  assert.match(g, /debug \{\s+manifestPlaceholders = \[admobAppId: TEST_APP_ID\]/);
});

test('reklam.js: test kimliği yalnız hata ayıklamada, G derecesi, açılış/ödüllü reklam yok, kurallar belgelenmiş', () => {
  const js = oku('www', 'js', 'reklam.js');
  assert.match(js, /Capacitor\.DEBUG \? TEST_KIMLIK : REKLAM_KIMLIK/);
  assert.match(js, /maxAdContentRating: 'General'/);
  assert.doesNotMatch(js, /AppOpen|RewardVideo|RewardInterstitial|showReward|loadAppOpen/);
  for (const s of ['ilk 3 dakika', 'en az 4 dakika', 'saatte en çok 6', 'HİÇ başlatılmaz', 'Önce UMP', 'klavyesi']) assert.ok(js.includes(s), `başlık açıklamasında "${s}" yok`);
  assert.equal(KURAL.ilkSureMs, 180000);
  assert.equal(KURAL.araMs, 240000);
  assert.equal(KURAL.saatlikEnCok, 6);
});

test('geçiş reklamı sıklığı: oturumun ilk 3 dakikası, 4 dakika ara, saatte 6', () => {
  const T = Date.UTC(2026, 9, 27, 12);
  const iyi = { gorunur: true, yaziliyor: false, sayfaAcik: false };
  const k = (...dk) => ({ gosterimler: dk.map((d) => T - d * 60e3) });
  assert.equal(gecisUygunMu(k(), T, T - 179e3, iyi), false, '2 dk 59 sn');
  assert.equal(gecisUygunMu(k(), T, T - 180e3, iyi), true, '3 dk');
  assert.equal(gecisUygunMu(k(3.99), T, T - 3600e3, iyi), false, 'son reklamdan 3 dk 59 sn');
  assert.equal(gecisUygunMu(k(4), T, T - 3600e3, iyi), true, 'son reklamdan 4 dk');
  assert.equal(gecisUygunMu(k(5, 15, 25, 35, 45, 55), T, T - 7200e3, iyi), false, 'son saatte 6');
  assert.equal(gecisUygunMu(k(5, 15, 25, 35, 45, 60), T, T - 7200e3, iyi), true, 'altıncısı tam 60 dk önce: saat dışı');
  assert.equal(gecisUygunMu(k(5, 15, 25, 35, 45), T, T - 7200e3, iyi), true, 'son saatte 5');
});

test('geçiş reklamı yalnız doğal durakta: yazarken, sayfa açıkken, arka planda yok', () => {
  const T = Date.UTC(2026, 9, 27, 12), bas = T - 3600e3, bos = { gosterimler: [] };
  assert.equal(gecisUygunMu(bos, T, bas, { gorunur: true, yaziliyor: true, sayfaAcik: false }), false);
  assert.equal(gecisUygunMu(bos, T, bas, { gorunur: true, yaziliyor: false, sayfaAcik: true }), false);
  assert.equal(gecisUygunMu(bos, T, bas, { gorunur: false, yaziliyor: false, sayfaAcik: false }), false);
  assert.equal(gecisUygunMu(bos, T, bas, undefined), false);
  assert.equal(gecisUygunMu(bos, T, bas, { gorunur: true, yaziliyor: false, sayfaAcik: false }), true);
});

test('kalıcı sayaç: bozuk kayıt, gelecekteki zaman (saat geri alındı) ve bir saatten eski zamanlar atılır', () => {
  const T = 1_800_000_000_000;
  assert.deepEqual(kayitTemizle(null, T), { gosterimler: [] });
  assert.deepEqual(kayitTemizle({ gosterimler: 'x' }, T), { gosterimler: [] });
  assert.deepEqual(kayitTemizle({ gosterimler: [T + 1000, 'a', NaN, T - 3600e3, T - 60e3, T - 120e3] }, T), { gosterimler: [T - 120e3, T - 60e3] });
  // saat ileri alınıp geri getirildiyse gelecekteki kayıt reklamı sonsuza dek kilitlemez
  assert.equal(gecisUygunMu({ gosterimler: [T + 86400e3] }, T, T - 3600e3, { gorunur: true }), true);
});

test('akış: mağaza → UMP → initialize (G) → banner + geçiş; doğal durak kurallara uyar; üye olunca reklam biter', async (t) => {
  const premium = await import('../www/js/premium.js');
  // sahte saat gerçek saatten başlar: oturum başı (reklam.js yüklenirken alınan Date.now()) ondan önce kalır
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() + 1000 });
  await premium.refresh();
  await ortam.bekle();
  const adlar = () => ortam.cagri.filter((c) => c.ek === 'AdMob').map((c) => c.ad);
  const sira = ortam.cagri.map((c) => c.ad);
  assert.ok(sira.indexOf('getPurchases') < sira.indexOf('requestConsentInfo'), 'önce mağaza sorulmalı');
  assert.ok(sira.indexOf('requestConsentInfo') < sira.indexOf('initialize'), 'önce UMP');
  assert.equal(ortam.cagri.find((c) => c.ad === 'initialize').arg.maxAdContentRating, 'General');
  const banner = ortam.cagri.find((c) => c.ad === 'showBanner').arg;
  assert.deepEqual([banner.adSize, banner.position, banner.adId], ['ADAPTIVE_BANNER', 'BOTTOM_CENTER', REKLAM_KIMLIK.banner]);
  assert.equal(ortam.cagri.find((c) => c.ad === 'prepareInterstitial').arg.adId, REKLAM_KIMLIK.gecis);
  assert.ok(reklam.reklamHazir());

  ortam.durum = { gorunur: true, yaziliyor: false, sayfaAcik: false };
  reklam.reklamAyarla({ durum: () => ortam.durum });
  const gecis = () => adlar().filter((a) => a === 'showInterstitial').length;
  assert.equal(reklam.dogalDurak('sekme'), false, 'oturumun ilk 3 dakikası');
  t.mock.timers.tick(KURAL.ilkSureMs);
  ortam.durum = { gorunur: true, yaziliyor: true, sayfaAcik: false };
  assert.equal(reklam.dogalDurak('sekme'), false, 'yazarken yok');
  ortam.durum = { gorunur: true, yaziliyor: false, sayfaAcik: true };
  assert.equal(reklam.dogalDurak('sekme'), false, 'sayfa açıkken yok');
  ortam.durum = { gorunur: true, yaziliyor: false, sayfaAcik: false };
  assert.equal(reklam.dogalDurak('sekme'), true);
  t.mock.timers.tick(KURAL.gecikmeMs + 10);
  await ortam.bekle();
  assert.equal(gecis(), 1, 'doğal durakta bir geçiş reklamı');
  assert.equal(JSON.parse(ortam.depo.get('calqora.reklam.v1')).gosterimler.length, 1, 'sayaç kalıcı');
  // kapanınca yenisi hazırlanır; 4 dk dolmadan yok
  ortam.yay('interstitialAdDismissed');
  await ortam.bekle();
  assert.equal(adlar().filter((a) => a === 'prepareInterstitial').length, 2);
  t.mock.timers.tick(239e3);
  assert.equal(reklam.dogalDurak('ayarlar'), false, '3 dk 59 sn');
  t.mock.timers.tick(1e3);
  assert.equal(reklam.dogalDurak('ayarlar'), true, '4 dk');
  ortam.durum = { gorunur: true, yaziliyor: true, sayfaAcik: false };   // bekleme sırasında yazmaya başladı
  t.mock.timers.tick(KURAL.gecikmeMs + 10);
  await ortam.bekle();
  assert.equal(gecis(), 1, 'beklemede yazmaya başlayınca vazgeçilir');

  // Üye oldu: banner kalkar, doğal durak artık hiçbir şey yapmaz
  ortam.uye = true;
  assert.equal(await premium.subscribe('monthly', 'ay'), 'ok');
  const satin = ortam.cagri.find((c) => c.ad === 'purchaseProduct').arg;
  assert.deepEqual([satin.productIdentifier, satin.planIdentifier, satin.productType], ['adfree', 'monthly', 'subs']);
  assert.ok(adlar().includes('removeBanner'));
  ortam.durum = { gorunur: true, yaziliyor: false, sayfaAcik: false };
  t.mock.timers.tick(3600e3);
  assert.equal(reklam.dogalDurak('sekme'), false);
  assert.equal(reklam.reklamHazir(), false);
});
