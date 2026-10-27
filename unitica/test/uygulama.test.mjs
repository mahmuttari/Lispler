// Unitica uygulama denetimleri (node --test unitica/test/*.test.mjs; tarayıcı gerekmez): abonelik kimlikleri ve satın alma
// sonuçları, 11 dilin anahtar ve yer tutucu uyumu, sürüm, eski kimliklerin temizliği, eklenti sürümleri, birim katsayıları.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SUBSCRIPTION, MANAGE_URL, PACKAGE, PRIVACY_URL, GEOTERVA_URL, EMAIL } from '../www/js/config.js';
import { purchaseError } from '../www/js/billing.js';
import { entitled, yearlySaving } from '../www/js/plans.js';
import { _packs } from '../www/js/i18n.js';
import { CATEGORIES, category, unitOf, convert } from '../www/js/units.js';

const UN = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(UN, 'www');
const oku = (...p) => fs.readFileSync(path.join(UN, ...p), 'utf8');
const jsDosyalari = () => fs.readdirSync(path.join(WWW, 'js'), { recursive: true }).filter((f) => f.endsWith('.js'));

test('abonelik: ürün adfree, temel planlar monthly ve yearly; Yönet bağlantısı bu ürüne ve pakete gider', () => {
  assert.equal(SUBSCRIPTION.productId, 'adfree');
  assert.deepEqual([...SUBSCRIPTION.plans].sort(), ['monthly', 'yearly']);
  assert.equal(MANAGE_URL, 'https://play.google.com/store/account/subscriptions?sku=adfree&package=com.poyrazworkshop.unitica');
  assert.equal(PACKAGE, 'com.poyrazworkshop.unitica');
  assert.equal(PRIVACY_URL, 'https://mahmuttari.github.io/Lispler/unitica/gizlilik.html');
  assert.equal(GEOTERVA_URL, 'https://geoterva.com');
  assert.equal(EMAIL, 'mahmuttari@gmail.com');
  // yedek fiyatlar yalnız tarayıcı taklidinde; uygulamanın başka hiçbir yerinde fiyat yazılı değil
  assert.deepEqual(SUBSCRIPTION.fallbackPrice, { monthly: '$0.99', yearly: '$9.99' });
  for (const f of jsDosyalari()) {
    if (f === 'config.js') continue;
    assert.doesNotMatch(fs.readFileSync(path.join(WWW, 'js', f), 'utf8'), /0\.99|9\.99|usd:/, `${f}: elle yazılmış fiyat`);
  }
  const b = fs.readFileSync(path.join(WWW, 'js', 'billing.js'), 'utf8');
  assert.match(b, /productType: SUBS/);
  assert.match(b, /planIdentifier: plan/);
  assert.match(b, /priceString/);
});

test('satın alma sonuçları: iptal, zaten sahip, bekleyen ödeme, hata (eklentinin ret kodları)', () => {
  assert.equal(purchaseError({ code: 'USER_CANCELED', message: 'Purchase is not purchased' }), 'cancelled');
  assert.equal(purchaseError({ code: 'ITEM_ALREADY_OWNED', message: 'Purchase is not purchased' }), 'owned');
  assert.equal(purchaseError({ message: 'Purchase is pending' }), 'pending');
  assert.equal(purchaseError({ code: 'BILLING_UNAVAILABLE', message: 'Purchase is not purchased' }), 'failed');
  assert.equal(purchaseError(new Error('Product not found')), 'failed');
  assert.equal(purchaseError(undefined), 'failed');
});

test('hak: yalnız adfree ürünü ve satın alınmış durumda ("1"); yıllık indirim mağaza tutarlarından', () => {
  assert.equal(entitled([{ productIdentifier: 'adfree', purchaseState: '1' }]), true);
  assert.equal(entitled([{ productIdentifier: 'adfree', purchaseState: '2' }]), false, 'bekleyen ödeme hak vermez');
  assert.equal(entitled([{ productIdentifier: 'baska', purchaseState: '1' }]), false);
  assert.equal(entitled([]), false);
  assert.equal(entitled(null), false);
  assert.ok(Math.abs(yearlySaving(0.99, 9.99) - (1 - 9.99 / 11.88)) < 1e-12);
  assert.equal(yearlySaving(0, 9.99), 0);
  assert.equal(yearlySaving(1, 13), 0, 'yıllık pahalıysa indirim yazılmaz');
});

test('11 dil: her dilde İngilizcedeki bütün anahtarlar, aynı yer tutucular; kodda kullanılan her anahtar var', () => {
  const en = _packs.en.text;
  assert.deepEqual(Object.keys(_packs).sort(), ['ar', 'de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'tr']);
  const yer = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const [dil, p] of Object.entries(_packs)) {
    assert.deepEqual(Object.keys(p.text).sort(), Object.keys(en).sort(), `${dil}: anahtarlar`);
    for (const [k, v] of Object.entries(p.text)) {
      assert.equal(typeof v, 'string');
      assert.ok(v.trim(), `${dil} ${k} boş`);
      assert.equal(yer(v), yer(en[k]), `${dil} ${k}: yer tutucu`);
    }
    assert.ok(['ltr', 'rtl'].includes(p.dir));
  }
  assert.equal(_packs.ar.dir, 'rtl');
  const kod = jsDosyalari().filter((f) => !f.startsWith('lang')).map((f) => fs.readFileSync(path.join(WWW, 'js', f), 'utf8')).join('\n');
  const kullanilan = new Set([...kod.matchAll(/\bt\('([a-z][\w.]*)'\s*[,)]/g)].map((m) => m[1]));
  for (const k of kullanilan) assert.ok(k in en, `kodda kullanılan anahtar yok: ${k}`);
  for (const k of ['member.manage', 'member.terms', 'set.adPrivacy', 'about.developer', 'about.privacy', 'more.member.hint']) assert.ok(kullanilan.has(k), k);
  for (const k of Object.keys(en)) assert.doesNotMatch(k, /^ad\.|member\.(soon|note)$/, `kaldırılan anahtar kaldı: ${k}`);
  // "internet izni istemez / reklam yok" gibi artık yanlış olan cümle hiçbir dilde kalmadı
  for (const [dil, p] of Object.entries(_packs)) {
    assert.match(p.text['about.offline'], /AdMob/, `${dil}: about.offline reklamı anmalı`);
    assert.match(p.text['about.offline'], /Google[ -]Play/, `${dil}: about.offline aboneliği anmalı`);
  }
  // Türkçe ve Arapça karakterler \uXXXX kaçışına dönmemiş olmalı
  for (const f of fs.readdirSync(path.join(WWW, 'js', 'lang'))) assert.doesNotMatch(fs.readFileSync(path.join(WWW, 'js', 'lang', f), 'utf8'), /\\u0[0-9a-f]{3}/i, f);
});

test('sürüm her yerde 1.4.0: build.gradle, package.json, version.json (Hakkında ekranı bunu okur)', () => {
  assert.match(oku('android', 'app', 'build.gradle'), /versionName '1\.4\.0'/);
  assert.equal(JSON.parse(oku('package.json')).version, '1.4.0');
  assert.equal(JSON.parse(oku('www', 'version.json')).version, '1.4.0');
  assert.match(oku('www', 'js', 'more.js'), /fetch\('version\.json'\)/);
});

test('eski kimlikler temiz: com.unitica.app, com.geoterva, bilimsel-hesap yok; cordova dosyaları www/de değil', () => {
  const dosyalar = [
    ...jsDosyalari().map((f) => path.join('www', 'js', f)),
    'www/index.html', 'www/css/app.css', 'capacitor.config.json', 'android/app/build.gradle',
    'android/app/src/main/AndroidManifest.xml', 'android/app/src/main/res/values/strings.xml',
  ];
  for (const f of dosyalar) assert.doesNotMatch(oku(f), /com\.unitica\.app|com\.geoterva|bilimsel-hesap/, f);
  for (const f of ['cordova.js', 'cordova_plugins.js', 'native-bridge.js']) assert.ok(!fs.existsSync(path.join(WWW, f)), f);
  const ma = oku('android', 'app', 'src', 'main', 'java', 'com', 'poyrazworkshop', 'unitica', 'MainActivity.java');
  assert.match(ma, /^package com\.poyrazworkshop\.unitica;/);
});

test('CSP özgün kadar sıkı: ağ yalnız kendi kökü (AdMob ve Play yerli kodda çalışır, WebView ağına çıkmaz)', () => {
  const html = oku('www', 'index.html');
  const csp = /Content-Security-Policy" content="([^"]+)"/.exec(html)[1];
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self';/);
  assert.match(csp, /connect-src 'self';/);
  assert.match(csp, /frame-src 'none'/);
  assert.doesNotMatch(csp, /https?:/, 'CSP dışarıya açılmamalı');
});

test('eklentiler sabit sürümlü: özgünün @capacitor/app\'i + AdMob 8.x + native-purchases', () => {
  const p = JSON.parse(oku('package.json'));
  assert.deepEqual(Object.keys(p.dependencies).sort(),
    ['@capacitor-community/admob', '@capacitor/android', '@capacitor/app', '@capacitor/core', '@capgo/native-purchases']);
  for (const [ad, s] of Object.entries({ ...p.dependencies, ...p.devDependencies })) assert.match(s, /^\d+\.\d+\.\d+$/, `${ad} sürümü sabit değil: ${s}`);
  assert.match(p.dependencies['@capacitor-community/admob'], /^8\./);
  const kilit = JSON.parse(oku('package-lock.json'));
  assert.equal(kilit.packages['node_modules/@capgo/native-purchases'].version, p.dependencies['@capgo/native-purchases']);
  assert.match(oku('android', 'variables.gradle'), /playServicesAdsVersion = '25\.4\.0'/);
  const cfg = JSON.parse(oku('capacitor.config.json'));
  assert.equal(cfg.plugins.SystemBars.insetsHandling, 'css');
});

test('birimler: 26 kategori, 251 birim; bilinen katsayılar ve gidiş-dönüş', () => {
  assert.equal(CATEGORIES.length, 26);
  assert.equal(CATEGORIES.reduce((n, c) => n + c.units.length, 0), 251);
  const c = (kat, f, t, v) => { const k = category(kat); return convert(unitOf(k, f), unitOf(k, t), v); };
  const yakin = (a, b, bag = 1e-9) => assert.ok(Math.abs(a - b) <= bag * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
  yakin(c('pressure', 'kgf_cm2', 'kPa', 1), 98.0665);
  yakin(c('pressure', 'psi', 'kPa', 1), 6.894757293168361);
  yakin(c('pressure', 'mH2O', 'kPa', 10), 98.0665);
  yakin(c('unitWeight', 'tf_m3', 'kN_m3', 1), 9.80665);
  yakin(c('flow', 'm3_h', 'L_s', 360), 100);
  yakin(c('permeability', 'cm_s', 'm_day', 1e-4), 0.0864);
  yakin(c('temperature', 'C', 'F', 100), 212);
  yakin(c('temperature', 'F', 'K', 32), 273.15);
  yakin(c('energy', 'kWh', 'kcal', 1), 859.8452278589854);
  yakin(c('power', 'hp', 'W', 1), 745.6998715822702);
  yakin(c('angle', 'pct', 'deg', 100), 45);
  yakin(c('area', 'donum', 'm2', 1), 1000);
  for (const k of CATEGORIES) {
    for (const u of k.units) {
      const geri = convert(u, k.units[0], convert(k.units[0], u, 3.7));
      if (Number.isFinite(geri)) yakin(geri, 3.7, 1e-9);
    }
  }
});
