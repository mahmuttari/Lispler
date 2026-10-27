// Reklam kuralları (www/js/reklam.js başındaki karar) ve AdMob kimliklerinin tek kaynaktan gelmesi.
// Tarayıcı gerekmez: sahte bir AdMob eklentisi window.Capacitor.Plugins.AdMob olarak verilir, çağrılar sırasıyla kaydedilir.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const kayit = [];
let onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
const cagri = (ad, sonuc) => async (arg) => { kayit.push({ ad, arg: arg ?? null }); return typeof sonuc === 'function' ? sonuc() : sonuc; };
const AdMob = {
  requestConsentInfo: cagri('requestConsentInfo', () => onay),
  showConsentForm: cagri('showConsentForm', () => ({ ...onay, canRequestAds: true, status: 'OBTAINED' })),
  initialize: cagri('initialize'),
  showBanner: cagri('showBanner'),
  hideBanner: cagri('hideBanner'),
  resumeBanner: cagri('resumeBanner'),
  removeBanner: cagri('removeBanner'),
  prepareInterstitial: cagri('prepareInterstitial'),
  showInterstitial: cagri('showInterstitial'),
  showPrivacyOptionsForm: cagri('showPrivacyOptionsForm'),
  addListener: (olay) => { kayit.push({ ad: 'addListener', arg: olay }); return Promise.resolve({ remove: async () => {} }); },
};
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
globalThis.window = {
  innerHeight: 800,
  addEventListener() {},
  Capacitor: {
    isNativePlatform: () => true,
    Plugins: { AdMob, Olcer: { bilgi: async () => ({ debug: false, versionName: '1.0.0', versionCode: 1 }) },
      NativePurchases: { getPurchases: async () => ({ purchases: [] }) } },
  },
};
globalThis.document = { documentElement: { style: { setProperty() {} } }, dispatchEvent() {}, addEventListener() {} };

const R = await import('../www/js/reklam.js');
const { SYS } = await import('../www/js/store.js');
const { REKLAM_KIMLIK } = await import('../www/js/reklam-kimlik.js');
const kimlik = await import('../araclar/kimlik.mjs');

const T = 1.8e12;
const iyi = { reklamsiz: false, hazir: true, yuklu: true, mesgul: false, oturumBasi: T - 200e3 };
const bos = { son: [] };

test('geçiş reklamı: oturumun ilk 3 dakikasında yok', () => {
  assert.equal(R.gecisUygunMu({ ...iyi, oturumBasi: T - 179e3 }, bos, T), false);
  assert.equal(R.gecisUygunMu({ ...iyi, oturumBasi: T - 180e3 }, bos, T), true);
});

test('geçiş reklamı: iki reklam arası en az 4 dakika', () => {
  assert.equal(R.gecisUygunMu(iyi, { son: [T - 239e3] }, T), false);
  assert.equal(R.gecisUygunMu(iyi, { son: [T - 240e3] }, T), true);
});

test('geçiş reklamı: saatte en çok 6', () => {
  const alti = Array.from({ length: 6 }, (_, i) => T - (300 + i * 300) * 1e3);
  assert.equal(R.gecisUygunMu(iyi, { son: alti }, T), false);
  assert.equal(R.gecisUygunMu(iyi, { son: alti.slice(0, 5).concat(T - 3601e3) }, T), true);
  assert.equal(R.kayitTemizle({ son: [...alti, T - 4000e3, 'x', T + 5] }, T).son.length, 6);
});

test('geçiş reklamı: abone, meşgul (ölçüm, kamera, mikrofon), hazır değil ya da yüklenmemişse yok', () => {
  for (const k of ['reklamsiz', 'mesgul']) assert.equal(R.gecisUygunMu({ ...iyi, [k]: true }, bos, T), false, k);
  for (const k of ['hazir', 'yuklu']) assert.equal(R.gecisUygunMu({ ...iyi, [k]: false }, bos, T), false, k);
});

test('başlatma sırası: önce UMP onayı, sonra G dereceli initialize, banner ve geçiş reklamı yüklemesi', async () => {
  kayit.length = 0;
  await R.baslat();
  const adlar = kayit.map((c) => c.ad);
  const i = adlar.indexOf('initialize');
  assert.ok(adlar.indexOf('requestConsentInfo') >= 0 && adlar.indexOf('requestConsentInfo') < i, 'UMP initialize\'dan önce');
  assert.equal(kayit[i].arg.maxAdContentRating, 'General');
  const banner = kayit.find((c) => c.ad === 'showBanner');
  assert.ok(adlar.indexOf('showBanner') > i);
  assert.deepEqual(banner.arg, { adId: REKLAM_KIMLIK.banner, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0 });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(kayit.find((c) => c.ad === 'prepareInterstitial').arg.adId, REKLAM_KIMLIK.gecis);
  assert.ok(!adlar.includes('showInterstitial'), 'açılışta geçiş reklamı yok');
});

test('doğal durak: ilk 3 dakikada reklam yok; sonra bir kez, hemen ardından yine yok; meşgulken yok', async () => {
  kayit.length = 0;
  assert.equal(R.firsat('arac-cikisi'), false);
  R._durum.oturumBasi = Date.now() - 200e3;
  R.mesgul('kamera', true);
  assert.equal(R.firsat('arac-cikisi'), false);
  R.mesgul('kamera', false);
  assert.equal(R.firsat('arac-cikisi'), 'arac-cikisi');
  assert.equal(kayit.filter((c) => c.ad === 'showInterstitial').length, 1);
  assert.equal(SYS.reklam.son.length, 1, 'sayaç kalıcı kayda yazıldı');
  R._durum.yuklu = true;
  assert.equal(R.firsat('arac-cikisi'), false, '4 dakika dolmadan ikincisi yok');
});

test('banner klavye ve tam ekranda gizlenir, sonra geri gelir', () => {
  kayit.length = 0;
  R.bannerGizle('tamekran', true);
  R.bannerGizle('klavye', true);
  R.bannerGizle('tamekran', false);
  assert.deepEqual(kayit.map((c) => c.ad), ['hideBanner']);
  R.bannerGizle('klavye', false);
  assert.deepEqual(kayit.map((c) => c.ad), ['hideBanner', 'resumeBanner']);
});

test('reklamsız abone: SDK hiç başlatılmaz', async () => {
  kayit.length = 0;
  SYS.premium = { active: true, plan: 'yearly' };
  const R2 = await import('../www/js/reklam.js?abone');
  await R2.baslat();
  assert.deepEqual(kayit, []);
  SYS.premium = null;
});

test('UMP onay formu gerekiyorsa gösterilir; izin yoksa initialize çağrılmaz', async () => {
  kayit.length = 0;
  onay = { status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' };
  const R3 = await import('../www/js/reklam.js?ab');
  await R3.baslat();
  assert.deepEqual(kayit.slice(0, 3).map((c) => c.ad), ['requestConsentInfo', 'showConsentForm', 'initialize']);
  assert.equal(R3.gizlilikGerekli(), true, 'Ayarlar\'da gizlilik seçenekleri görünür');
  kayit.length = 0;
  AdMob.showConsentForm = cagri('showConsentForm', () => ({ ...onay, canRequestAds: false }));
  const R4 = await import('../www/js/reklam.js?ret');
  await R4.baslat();
  assert.ok(!kayit.some((c) => c.ad === 'initialize'));
});

test('AdMob kimlikleri: gradle.properties tek kaynak, reklam-kimlik.js onunla aynı', () => {
  const props = fs.readFileSync(path.join(KOK, 'android', 'gradle.properties'), 'utf8');
  const k = kimlik.oku(props);
  assert.equal(fs.readFileSync(path.join(KOK, 'www', 'js', 'reklam-kimlik.js'), 'utf8'), kimlik.uret(k), 'node smart-measure/araclar/kimlik.mjs');
  const yayinci = /^ca-app-pub-(\d+)[~/]\d+$/;
  const no = new Set(Object.values(k).map((v) => yayinci.exec(v)[1]));
  assert.equal(no.size, 1, 'üç kimlik aynı yayıncıdan');
  assert.ok(['3940256099942544', '2417242373034448'].includes([...no][0]));
  assert.match(k.app, /~/); assert.match(k.banner, /\//); assert.match(k.gecis, /\//);
  const gradle = fs.readFileSync(path.join(KOK, 'android', 'app', 'build.gradle'), 'utf8');
  assert.match(gradle, /manifestPlaceholders = \[admobAppId: project\.property\('ADMOB_APP_ID'\)\]/);
  assert.match(gradle, /def TEST_ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713'/);
  const manifest = fs.readFileSync(path.join(KOK, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  assert.match(manifest, /com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="\$\{admobAppId\}"/);
});

test('reklam modülü: açılış ve ödüllü reklam yok', () => {
  const kod = fs.readFileSync(path.join(KOK, 'www', 'js', 'reklam.js'), 'utf8');
  assert.ok(!/AppOpen|RewardVideo|RewardInterstitial/.test(kod.replace(/\/\*[\s\S]*?\*\//, '')));
});
