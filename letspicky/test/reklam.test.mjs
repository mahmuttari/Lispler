// AdMob yapılandırması: kimlik dosyalarının birbirini tutması, Android manifesti ve iOS Info.plist (Unitica düzeni).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { CIKTI, GRADLE, IOS, PLIST, kimlikDosyasi, kimlikOku, plistKimlik, testMi } from '../araclar/kimlik.mjs';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (...p) => fs.readFileSync(path.join(KOK, ...p), 'utf8');
const android = kimlikOku(fs.readFileSync(GRADLE, 'utf8'));
const ios = kimlikOku(fs.readFileSync(IOS, 'utf8'), 'admob.properties');

test('www/reklam-kimlik.json ve Info.plist kimlik kaynaklarıyla aynı (node araclar/kimlik.mjs)', () => {
  assert.equal(fs.readFileSync(CIKTI, 'utf8'), kimlikDosyasi(android, ios));
  const plist = fs.readFileSync(PLIST, 'utf8');
  assert.equal(plistKimlik(plist, ios.app), plist, 'GADApplicationIdentifier ios/admob.properties ile aynı olmalı');
});

test('her platformda uygulama, banner, geçiş ve ödüllü birim kimliği var; biçimleri doğru', () => {
  for (const k of [android, ios]) {
    assert.match(k.app, /^ca-app-pub-\d{16}~\d{10}$/);
    for (const birim of [k.banner, k.gecis, k.odul]) assert.match(birim, /^ca-app-pub-\d{16}\/\d{10}$/);
  }
  // Gerçek kimlikler AdMob'da açılınca bu satır false olur ve App Store önkontrolü geçer.
  assert.equal(typeof testMi(android), 'boolean');
});

test('Android: yayın derlemesi gradle.properties kimliğini, hata ayıklama test kimliğini kullanır; manifestte AdMob kimliği', () => {
  const gradle = oku('android', 'app', 'build.gradle');
  assert.match(gradle, /release \{[\s\S]*manifestPlaceholders = \[admobAppId: project\.property\('ADMOB_APP_ID'\)\]/);
  assert.match(gradle, /debug \{\s*manifestPlaceholders = \[admobAppId: TEST_APP_ID\]/);
  const manifest = oku('android', 'app', 'src', 'main', 'AndroidManifest.xml');
  assert.match(manifest, /android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"\s*android:value="\$\{admobAppId\}"/);
});

test('iOS: SKAdNetwork, izleme izni metni ve gizlilik bildiriminde reklam kimliği', () => {
  const plist = fs.readFileSync(PLIST, 'utf8');
  assert.match(plist, /<key>SKAdNetworkIdentifier<\/key>\s*<string>cstr6suwn9\.skadnetwork<\/string>/);
  assert.match(plist, /<key>NSUserTrackingUsageDescription<\/key>\s*<string>[^<]{20,}<\/string>/);
  const gizlilik = oku('ios', 'App', 'App', 'PrivacyInfo.xcprivacy');
  // İzleme veri türü düzeyinde beyan edilir: reklam kimliği (Device ID) üçüncü taraf reklam için, izleme amaçlı.
  const cihaz = /NSPrivacyCollectedDataTypeDeviceID<\/string>((?:(?!<\/dict>)[\s\S])*)<\/dict>/.exec(gizlilik)?.[1] ?? '';
  assert.match(cihaz, /<key>NSPrivacyCollectedDataTypeTracking<\/key>\s*<true\/>/);
  assert.match(cihaz, /NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising/);
});

test('iOS gizlilik bildirimi: NSPrivacyTracking ile NSPrivacyTrackingDomains Apple kuralına uyar (ITMS-91064)', () => {
  // 14 Kasım 2026: App Store 1.0.0 (2) ve (3)'ü "Invalid Binary" yaptı: ITMS-91064 Invalid tracking information. Apple
  // kuralı iki yönlü: izleme true ise en az bir izleme alan adı listelenir; alan adı listelenirse izleme true olur.
  // Google Mobile Ads SDK 13.11.0'ın kendi bildirimi gibi: NSPrivacyTracking false, alan adı yok, izleme yalnız veri türü
  // düzeyinde (Device ID). Reklam alan adlarını listelemek, izin vermeyen kullanıcıda iOS'un reklam isteklerini
  // engellemesine yol açar. Kullanıcı izni (ATT) Info.plist'teki NSUserTrackingUsageDescription ile istenmeye devam eder.
  for (const dosya of [['ios', 'App', 'App', 'PrivacyInfo.xcprivacy']]) {
    const gizlilik = oku(...dosya);
    const izleme = /<key>NSPrivacyTracking<\/key>\s*<(true|false)\/>/.exec(gizlilik)?.[1];
    const alanlar = /<key>NSPrivacyTrackingDomains<\/key>\s*(<array\/>|<array>([\s\S]*?)<\/array>)/.exec(gizlilik);
    assert.ok(izleme, 'NSPrivacyTracking açıkça yazılı olmalı');
    assert.ok(alanlar, 'NSPrivacyTrackingDomains yazılı olmalı');
    const alanSayisi = ((alanlar[2] ?? '').match(/<string>[^<]+<\/string>/g) ?? []).length;
    assert.equal(izleme === 'true', alanSayisi > 0, `NSPrivacyTracking=${izleme} iken ${alanSayisi} izleme alan adı: ITMS-91064`);
    assert.equal(izleme, 'false');
    assert.equal(alanSayisi, 0);
  }
});

test('eklenti package.json ve kilit dosyasında; mağaza metinleri artık "reklam yok" demiyor', () => {
  const paket = JSON.parse(oku('package.json'));
  assert.equal(paket.dependencies['@capacitor-community/admob'], '8.2.1');
  assert.ok(oku('package-lock.json').includes('"node_modules/@capacitor-community/admob"'));
  for (const dosya of [['magaza', 'aciklamalar.md'], ['magaza', 'diller', 'en-US.md'], ['magaza', 'app-store.json']]) {
    assert.doesNotMatch(oku(...dosya), /Reklam yok|reklam yok|No ads|no ads/, dosya.join('/'));
  }
});
