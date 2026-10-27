// Kıble Bul — reklam kuralları ve AdMob kimlikleri (node --test kible-bul/test/*.test.mjs; tarayıcı gerekmez).
// Kurallar www/js/reklam.js'in başında yazılıdır. Sahte AdMob eklentisi window.Capacitor olarak verilir; çağrılar sırayla
// kaydedilir. (Tarayıcıda bütünleşik deneme: araclar/tarayici-dene.mjs, "uygulama kipi".)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const KB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (...p) => fs.readFileSync(path.join(KB, ...p), 'utf8');

// ---- sahte tarayıcı + AdMob (reklam.js yüklenmeden ÖNCE)
const kayit = [];
const dinleyici = {};
const depo = new Map();
const yay = (olay, v) => (dinleyici[olay] || []).forEach((f) => f(v));
let onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' };
const cagri = (ad, sonuc, sonra) => async (arg) => { kayit.push({ ad, arg }); if (sonra) sonra(arg); return typeof sonuc === 'function' ? sonuc() : sonuc; };
const AdMob = {
  requestConsentInfo: cagri('requestConsentInfo', () => onay),
  showConsentForm: cagri('showConsentForm', () => ({ ...onay, canRequestAds: true })),
  initialize: cagri('initialize'),
  addListener: async (olay, f) => { (dinleyici[olay] = dinleyici[olay] || []).push(f); return { remove: async () => {} }; },
  showBanner: cagri('showBanner', undefined, () => yay('bannerAdSizeChanged', { width: 360, height: 50 })),
  hideBanner: cagri('hideBanner', undefined, () => yay('bannerAdSizeChanged', { width: 0, height: 0 })),
  resumeBanner: cagri('resumeBanner', undefined, () => yay('bannerAdSizeChanged', { width: 360, height: 50 })),
  removeBanner: cagri('removeBanner'),
  prepareInterstitial: cagri('prepareInterstitial'),
  showInterstitial: cagri('showInterstitial'),
  showPrivacyOptionsForm: cagri('showPrivacyOptionsForm'),
};
const stil = new Map();
const siniflar = new Set();
globalThis.window = { Capacitor: { isNativePlatform: () => true, Plugins: { AdMob, KibleYerel: { bilgi: async () => ({ hataAyiklama: false }) } } } };
globalThis.localStorage = { getItem: (k) => (depo.has(k) ? depo.get(k) : null), setItem: (k, v) => depo.set(k, String(v)), removeItem: (k) => depo.delete(k) };
globalThis.document = {
  visibilityState: 'visible',
  documentElement: { style: { setProperty: (k, v) => stil.set(k, v) }, classList: { toggle: (c, on) => (on ? siniflar.add(c) : siniflar.delete(c)) } },
};

const R = await import('../www/js/reklam.js');
const { REKLAM_KIMLIK } = await import('../www/js/reklam-kimlik.js');
const kimlik = await import('../araclar/kimlik.mjs');
const adlar = () => kayit.map((c) => c.ad);
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

test('AdMob kimlikleri: gradle.properties tek kaynak, reklam-kimlik.js onunla aynı, hepsi aynı yayıncıdan', () => {
  const p = oku('android', 'gradle.properties');
  const k = kimlik.kimlikleriOku(p);
  assert.equal(oku('www', 'js', 'reklam-kimlik.js'), kimlik.kimlikDosyasi(k), 'node kible-bul/araclar/kimlik.mjs çalıştırılmalı');
  assert.deepEqual(REKLAM_KIMLIK, k);
  const yayinci = new Set([k.uygulama, k.banner, k.gecis].map((x) => /^ca-app-pub-(\d+)/.exec(x)[1]));
  assert.equal(yayinci.size, 1, 'üç kimlik aynı yayıncıdan olmalı');
  assert.ok(['3940256099942544', '2417242373034448'].includes([...yayinci][0]), 'Google test yayıncısı ya da mahmuttari@gmail.com hesabı');
  // manifest'teki uygulama kimliği yer tutucudan gelir; sürüm derlemesi gradle.properties'i, hata ayıklama test kimliğini kullanır
  assert.match(oku('android', 'app', 'src', 'main', 'AndroidManifest.xml'), /com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="\$\{admobAppId\}"/);
  const g = oku('android', 'app', 'build.gradle');
  assert.match(g, /release \{[\s\S]*?manifestPlaceholders = \[admobAppId: project\.property\('ADMOB_APP_ID'\)\]/);
  assert.match(g, /debug \{[\s\S]*?manifestPlaceholders = \[admobAppId: TEST_ADMOB_APP_ID\]/);
  assert.match(g, /TEST_ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713'/);
});

test('geçiş reklamı kuralları: doğal durak, ilk 3 dk yok, en az 4 dk ara, saatte en çok 6, üyeye ve engelde yok', () => {
  const T = 1e12, B = T - 10 * 60e3;   // oturum 10 dk önce başladı
  const u = (o) => R.gecisUygunMu({ neden: 'arama', son: [], oturumBasi: B, simdi: T, ...o });
  assert.equal(u({}), true);
  assert.equal(u({ neden: 'harita' }), true);
  for (const n of ['acilis', 'pusula', 'kalibrasyon', 'yazarken', undefined]) assert.equal(u({ neden: n }), false, `neden ${n}`);
  assert.equal(u({ oturumBasi: T - 3 * 60e3 + 1 }), false, 'ilk 3 dakika');
  assert.equal(u({ oturumBasi: T - 3 * 60e3 }), true);
  assert.equal(u({ son: [T - 4 * 60e3 + 1] }), false, '4 dakika dolmadı');
  assert.equal(u({ son: [T - 4 * 60e3] }), true);
  const alti = [1, 2, 3, 4, 5, 6].map((i) => T - i * 5 * 60e3);
  assert.equal(u({ son: alti }), false, 'saatte 6');
  assert.equal(u({ son: alti.slice(1).concat(T - 3601e3) }), true, 'bir saatten eskisi sayılmaz');
  assert.equal(u({ uye: true }), false, 'reklamsız üye');
  assert.equal(u({ engel: true }), false, 'bir şey açık');
  assert.deepEqual(R.NEDENLER, ['arama', 'harita']);
  assert.deepEqual([R.KURAL.ilkMs, R.KURAL.araMs, R.KURAL.saatlikEnCok], [180e3, 240e3, 6]);
});

test('kalıcı kayıt temizlenir: bozuk, bir saatten eski ve ileri tarihli zamanlar atılır', () => {
  const T = 1e12;
  assert.deepEqual(R.kayitTemizle(null, T), { son: [] });
  assert.deepEqual(R.kayitTemizle({ son: 'x' }, T), { son: [] });
  assert.deepEqual(R.kayitTemizle({ son: [T - 10, NaN, 'a', T - 3601e3, T + 3600e3, T + 30e3] }, T), { son: [T - 10, T + 30e3] });
});

test('reklamsız üye: AdMob ve UMP hiç çağrılmaz', async () => {
  R.reklamAyarla({ uye: () => true, engelVar: () => false });
  await R.reklamBaslat();
  assert.deepEqual(adlar(), []);
  assert.equal(R.reklamHazir(), false);
  assert.equal(R.gecisFirsati('arama'), false);
});

test('önce UMP onayı, sonra G derecesiyle initialize, sonra banner ve geçiş reklamı', async () => {
  let gizlilik = 0;
  R.reklamAyarla({ uye: () => false, engelVar: () => false, gizlilikDegisti: () => gizlilik++ });
  onay = { status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' };
  await R.reklamBaslat();
  const a = adlar();
  assert.deepEqual(a.slice(0, 3), ['requestConsentInfo', 'showConsentForm', 'initialize']);
  const ilk = kayit.find((c) => c.ad === 'initialize');
  assert.equal(ilk.arg.maxAdContentRating, 'General', 'eklenti yalnız tam "General" yazımını tanır');
  assert.ok(a.indexOf('showBanner') > a.indexOf('initialize') && a.indexOf('prepareInterstitial') > a.indexOf('initialize'));
  const b = kayit.find((c) => c.ad === 'showBanner').arg;
  assert.deepEqual([b.adId, b.adSize, b.position, b.margin], [REKLAM_KIMLIK.banner, 'ADAPTIVE_BANNER', 'BOTTOM_CENTER', 0]);
  assert.equal(kayit.find((c) => c.ad === 'prepareInterstitial').arg.adId, REKLAM_KIMLIK.gecis);
  assert.ok(!a.some((x) => /AppOpen|Reward/i.test(x)), 'açılış ve ödüllü reklam yok');
  assert.equal(R.gizlilikSecenegiGerekli(), true, 'Ayarlar\'da "Reklam gizlilik seçenekleri" görünür');
  assert.ok(gizlilik > 0);
  await bekle(5);
  assert.equal(stil.get('--reklam-h'), '56px', 'banner şeridi: 50 px banner + 6 px aralık');
  assert.ok(siniflar.has('reklamli'));
});

test('banner: klavye, kalibrasyon ve karşılamada gizlenir, sonra geri gelir; şerit yüksekliği izler', async () => {
  R.reklamEngeli('klavye', true);
  await bekle(5);
  assert.equal(adlar().at(-1), 'hideBanner');
  assert.equal(stil.get('--reklam-h'), '0px');
  R.reklamEngeli('kalibrasyon', true);
  R.reklamEngeli('klavye', false);
  assert.equal(adlar().filter((x) => x === 'resumeBanner').length, 0, 'bir engel kaldıkça gizli');
  R.reklamEngeli('kalibrasyon', false);
  await bekle(5);
  assert.equal(adlar().at(-1), 'resumeBanner');
  assert.equal(stil.get('--reklam-h'), '56px');
});

test('geçiş reklamı yalnız doğal durakta, engel yokken ve sıklık uygunsa; gösterim kalıcı sayaca yazılır', async () => {
  const gosterim = () => adlar().filter((x) => x === 'showInterstitial').length;
  // oturumun ilk 3 dakikası
  assert.equal(R.gecisFirsati('arama'), false);
  R.__oturumBasi(Date.now() - 5 * 60e3);
  assert.equal(R.gecisFirsati('pusula'), false, 'doğal durak değil');
  // gösterim anında bir alt sayfa açıksa hak harcanmaz
  let acik = true;
  R.reklamAyarla({ engelVar: () => acik });
  assert.equal(R.gecisFirsati('arama'), true);
  await bekle(R.KURAL.gecikmeMs + 60);
  assert.equal(gosterim(), 0);
  acik = false;
  assert.equal(R.gecisFirsati('harita'), true);
  await bekle(R.KURAL.gecikmeMs + 60);
  assert.equal(gosterim(), 1);
  const son = JSON.parse(depo.get(R.KAYIT_ANAHTARI)).son;
  assert.equal(son.length, 1);
  // 4 dakika dolmadan ikincisi yok (reklam yeniden yüklenmiş olsa da)
  yay('interstitialAdDismissed', {});
  await bekle(5);
  assert.equal(R.gecisFirsati('arama'), false);
});

test('reklamsız üyelik başlayınca banner kalkar, geçiş reklamı istenmez', async () => {
  R.reklamDurdur();
  assert.equal(adlar().at(-1), 'removeBanner');
  assert.equal(stil.get('--reklam-h'), '0px');
  depo.delete(R.KAYIT_ANAHTARI);
  assert.equal(R.gecisFirsati('arama'), false);
});

test('üyelik biterse reklamlar yeniden başlar; dinleyiciler çoğalmaz', async () => {
  R.reklamAyarla({ uye: () => false, engelVar: () => false });
  const once = (dinleyici.interstitialAdDismissed || []).length;
  const banner = adlar().filter((x) => x === 'showBanner').length;
  await R.reklamBaslat();
  assert.equal(R.reklamHazir(), true);
  assert.equal(adlar().filter((x) => x === 'showBanner').length, banner + 1);
  assert.equal((dinleyici.interstitialAdDismissed || []).length, once);
});

test('GeoTerva tam ekran reklamı ve zamanlayıcısı kaldırıldı', () => {
  const js = fs.readdirSync(path.join(KB, 'www', 'js'));
  for (const f of ['ads.js', 'ui-ad.js']) assert.ok(!js.includes(f), f);
  assert.ok(!fs.existsSync(path.join(KB, 'www', 'img', 'ad-geoterva.jpg')));
  for (const f of js.filter((x) => x.endsWith('.js'))) {
    const s = oku('www', 'js', f);
    assert.doesNotMatch(s, /firstAfterMs|closeAfterSec|showAd\(|ad-geoterva/, f);
  }
  assert.doesNotMatch(oku('www', 'css', 'app.css'), /\.ad-close|\.ad-img/);
});
