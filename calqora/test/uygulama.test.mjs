// Calqora uygulamasının tutarlılığı (node --test calqora/test/*.test.mjs; tarayıcı ve Android SDK gerekmez):
// sürüm ve paket adı her yerde aynı, eski kimlikler (com.geoterva, bilimsel-hesap, GeoTerva ev reklamı) kalmadı, abonelik
// kimlikleri, 11 dilin anahtar ve yer tutucu uyumu, hesap motorunun temel sonuçları.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (...p) => fs.readFileSync(path.join(KOK, ...p), 'utf8');
const PAKET = 'com.poyrazworkshop.calqora';
const { APP, SUBSCRIPTION } = await import('../www/js/config.js');
const DILLER = ['tr', 'en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'ar'];

/** dizindeki dosyalar (özyinelemeli), yalnız depoya giren kaynaklar */
function dosyalar(dizin, suz = () => true) {
  const out = [];
  for (const e of fs.readdirSync(dizin, { withFileTypes: true })) {
    const f = path.join(dizin, e.name);
    if (e.isDirectory()) { if (!['node_modules', 'build', '.gradle', 'public', 'capacitor-cordova-android-plugins'].includes(e.name)) out.push(...dosyalar(f, suz)); }
    else if (suz(f)) out.push(f);
  }
  return out;
}

test('sürüm 1.1.0 (versionCode 1) ve paket adı her yerde aynı', () => {
  const g = oku('android', 'app', 'build.gradle');
  assert.match(g, new RegExp(`applicationId "${PAKET.replace(/\./g, '\\.')}"`));
  assert.match(g, new RegExp(`namespace = "${PAKET.replace(/\./g, '\\.')}"`));
  assert.match(g, /versionCode 1\n/);
  assert.match(g, /versionName '1\.1\.0'/);   // tek tırnak: android/play.mjs › surumBilgisi ve calqora-android.yml bu biçimi okur
  assert.equal(JSON.parse(oku('package.json')).version, '1.1.0');
  assert.equal(APP.version, '1.1.0');
  assert.equal(APP.id, PAKET);
  assert.equal(JSON.parse(oku('capacitor.config.json')).appId, PAKET);
  assert.ok(fs.existsSync(path.join(KOK, 'android', 'app', 'src', 'main', 'java', ...PAKET.split('.'), 'MainActivity.java')));
  const v = oku('android', 'variables.gradle');
  assert.match(v, /minSdkVersion = 24/);
  assert.match(v, /compileSdkVersion = 36/);
  assert.match(v, /targetSdkVersion = 36/);
});

test('eklentiler: özgündekiler + AdMob + iOS, sürümler sabit', () => {
  const p = JSON.parse(oku('package.json'));
  assert.deepEqual(Object.keys(p.dependencies).sort(), ['@capacitor-community/admob', '@capacitor/android', '@capacitor/app', '@capacitor/browser', '@capacitor/core', '@capacitor/ios', '@capgo/native-purchases']);
  assert.equal(p.dependencies['@capacitor/ios'], p.dependencies['@capacitor/core'], 'Capacitor çekirdeği ve iOS aynı sürüm');
  for (const [ad, s] of Object.entries({ ...p.dependencies, ...p.devDependencies })) assert.match(s, /^\d+\.\d+\.\d+$/, `${ad} sürümü sabit değil: ${s}`);
  assert.equal(p.dependencies['@capacitor-community/admob'].split('.')[0], '8', 'Hayalet Avcıları ile aynı ana sürüm');
  const kilit = JSON.parse(oku('package-lock.json'));
  assert.equal(kilit.packages['node_modules/@capgo/native-purchases'].version, p.dependencies['@capgo/native-purchases']);
});

test('eski kimlikler kalmadı: com.geoterva, bilimsel-hesap, GeoTerva ev reklamı ve zamanlayıcısı', () => {
  const kaynak = [...dosyalar(path.join(KOK, 'www')), ...dosyalar(path.join(KOK, 'android'), (f) => /\.(java|xml|gradle|properties|json)$/.test(f)), path.join(KOK, 'capacitor.config.json')];
  for (const f of kaynak) {
    const m = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(m, /com\.geoterva|bilimsel-hesap|BENIOKU|ad-geoterva|com\.unitica/i, path.relative(KOK, f));
  }
  for (const f of ['www/js/ads.js', 'www/js/ui-ad.js', 'www/img/ad-geoterva.jpg', 'www/cordova.js', 'www/cordova_plugins.js']) assert.ok(!fs.existsSync(path.join(KOK, f)), `${f} kalmamalı`);
  const css = oku('www', 'css', 'app.css');
  assert.doesNotMatch(css, /\.ad-close|\.ad-img|adring/);
  // GeoTerva yalnız Hakkında'daki düz bir satır
  assert.equal(APP.geoterva.url, 'https://geoterva.com');
  const geo = kaynak.filter((f) => /geoterva\.com/i.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(KOK, f));
  assert.deepEqual(geo, ['www/js/config.js']);
  // localStorage anahtarları yeni adla
  assert.match(oku('www', 'js', 'state.js'), /const KEY = 'calqora\.v1'/);
  assert.match(oku('www', 'js', 'billing.js'), /'calqora\.mock-subscription'/);
});

test('Hakkında: geliştirici, e-posta, gizlilik politikası adresi', () => {
  assert.equal(APP.developer, 'Poyraz Workshop');
  assert.equal(APP.email, 'mahmuttari@gmail.com');
  assert.equal(APP.privacyUrl, 'https://mahmuttari.github.io/Lispler/calqora/gizlilik.html');
  const s = oku('www', 'js', 'ui-settings.js');
  for (const k of ['APP.developer', 'APP.email', 'APP.privacyUrl', 'APP.geoterva', 'APP.version', 'gizlilikGerekli()']) assert.ok(s.includes(k), k);
});

test('abonelik: adfree / monthly + yearly, fiyat yalnız mağazadan, yönet adresi sku ve paketle', async () => {
  assert.equal(SUBSCRIPTION.productId, 'adfree');
  assert.deepEqual(SUBSCRIPTION.plans, ['monthly', 'yearly']);
  assert.equal(SUBSCRIPTION.manageUrl, `https://play.google.com/store/account/subscriptions?sku=adfree&package=${PAKET}`);
  assert.deepEqual(SUBSCRIPTION.fallbackPrice, { monthly: '$0.99', yearly: '$9.99' });
  const b = oku('www', 'js', 'billing.js');
  assert.match(b, /productType: SUBS/);
  assert.match(b, /const SUBS = 'subs'/);
  assert.match(b, /openExternal\(SUBSCRIPTION\.manageUrl\)/);
  assert.match(b, /restorePurchases/);
  const u = oku('www', 'js', 'ui-premium.js');
  assert.match(u, /isNative \? '' : SUBSCRIPTION\.fallbackPrice/, 'uygulamada yedek fiyat gösterilmemeli');
  const { entitled, savePercent } = await import('../www/js/premium.js');
  assert.equal(entitled([{ productIdentifier: 'adfree', purchaseState: '1' }]), true);
  assert.equal(entitled([{ productIdentifier: 'adfree', purchaseState: '0' }]), false, 'bekleyen ödeme üyelik değil');
  assert.equal(entitled([{ productIdentifier: 'baska', purchaseState: '1' }]), false);
  assert.equal(savePercent(0.99, 9.99), 16);
});

test('11 dil: aynı arayüz anahtarları, aynı yer tutucular; birim/sabit adları eksiksiz; Arapça sağdan sola', async () => {
  const en = (await import('../www/js/lang/en.js')).default;
  const { LANGS } = await import('../www/js/i18n.js');
  assert.deepEqual(LANGS.map((l) => l.code).sort(), [...DILLER].sort());
  const yer = (s) => (s.match(/\{\d\}/g) || []).sort().join('');
  for (const d of DILLER) {
    const L = (await import(pathToFileURL(path.join(KOK, 'www', 'js', 'lang', d + '.js')).href)).default;
    assert.deepEqual(Object.keys(L.ui).sort(), Object.keys(en.ui).sort(), `${d}: arayüz anahtarları`);
    for (const k of Object.keys(en.ui)) assert.equal(yer(L.ui[k]), yer(en.ui[k]), `${d} ${k}: yer tutucu`);
    for (const bol of ['cats', 'groups']) assert.deepEqual(Object.keys(L[bol]).sort(), Object.keys(en[bol]).sort(), `${d}: ${bol}`);
    for (const bol of ['units', 'consts']) for (const k of Object.keys(en[bol])) assert.equal(L[bol][k].length, en[bol][k].length, `${d}: ${bol}.${k}`);
    assert.equal(L.dir, d === 'ar' ? 'rtl' : 'ltr');
    assert.ok(!Object.keys(L.ui).some((k) => k.startsWith('ad.')), `${d}: ev reklamı anahtarları kalmamalı`);
    assert.match(L.ui['s.aboutText'], /AdMob/, `${d}: Hakkında metni reklamları doğru anlatmalı`);
    assert.doesNotMatch(L.ui['s.aboutText'], /\b3\b/, `${d}: eski "3 dakikada bir" iddiası`);
    assert.doesNotMatch(fs.readFileSync(path.join(KOK, 'www', 'js', 'lang', d + '.js'), 'utf8'), /\\u0[0-9a-f]{3}/i, `${d}: \\u kaçışına dönmüş karakter`);
    // iPhone karşılıkları (t() iPhone'da ".ios" ikizini seçer): App Store, Google Play değil (App Review 2.3.10)
    for (const k of Object.keys(L.ui).filter((x) => x.endsWith('.ios'))) {
      assert.ok(k.slice(0, -4) in L.ui, `${d} ${k}: ikizi yok`);
      assert.doesNotMatch(L.ui[k], /Google[ -]?Play|Android/, `${d} ${k}`);
      assert.match(L.ui[k], /App[ -]Store|Apple/, `${d} ${k}`);
    }
    assert.match(L.ui['p.terms.ios'], /24/, `${d}: Apple, yenilemeden en az 24 saat önce iptal koşulunu ister (3.1.2)`);
  }
  assert.deepEqual(Object.keys(en.ui).filter((x) => x.endsWith('.ios')).sort(), ['p.b3.ios', 'p.noPrices.ios', 'p.terms.ios', 'p.unavailable.ios']);
  for (const [k, v] of Object.entries(en.ui)) if (/Google[ -]?Play/.test(v)) assert.ok(`${k}.ios` in en.ui, `${k}: iPhone karşılığı yok`);
});

test('hesap motoru: temel sonuçlar (özgün davranış korunuyor)', async () => {
  const { evaluate, makeCtx } = await import('../www/js/engine.js');
  const { fmtValue } = await import('../www/js/format.js');
  const ctx = (o = {}) => makeCtx({ angle: 'deg', complex: false, comma: false, ans: 0, vars: { a: 0, b: 0, c: 0, d: 0, x: 0, y: 0, m: 0 }, ...o });
  const f = (e, o) => fmtValue(evaluate(e, ctx(o)), { mode: 'norm', digits: 4, comma: !!(o && o.comma), pretty: false });
  assert.equal(f('2+3×4'), '14');
  assert.equal(f('sin(30)'), '0.5');
  assert.equal(f('√(16)+∛(27)'), '7');
  assert.equal(f('5!'), '120');
  assert.equal(f('nCr(5,2)'), '10');
  assert.equal(f('int(x^2,0,3)'), '9');
  assert.equal(f('sum(k,k,1,100)'), '5050');
  assert.equal(f('root(5,32)'), '2');
  assert.equal(f('1,5+1,5', { comma: true }), '3');
  assert.equal(f('√(-4)', { complex: true }), '2i');
  assert.throws(() => evaluate('1÷0', ctx()));
  const { CATEGORIES, convert } = await import('../www/js/units.js');
  const uz = CATEGORIES.find((c) => c.id === 'length');
  const m = uz.units.find((u) => u.s === 'm'), inc = uz.units.find((u) => u.s === 'in');
  assert.ok(Math.abs(convert(1, inc, m) - 0.0254) < 1e-12);
});
