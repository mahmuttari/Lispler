#!/usr/bin/env node
// Ölçü Kutusu (Measure Box) — AdMob reklam birimi kimliklerini kaynaklarından sayfaya yazar:
//   android/gradle.properties (Android) ve ios/admob.properties (iPhone): ADMOB_BANNER_ID, ADMOB_INTERSTITIAL_ID
//   → www/js/reklam-kimlik.js
// Uygulama kimliği (ADMOB_APP_ID) sayfaya gitmez: Android'de Gradle manifeste, iPhone'da ios-ortak/kur.mjs Info.plist'e
// yazar. CI (smartmeasure-android.yml, ios-kucuk.yml) "cap sync"ten önce çalıştırır; çıktı depoya da alınır,
// test/reklam.test.mjs eşleştiğini denetler.
//
//   node smart-measure/araclar/kimlik.mjs            → yazar
//   node smart-measure/araclar/kimlik.mjs --denetle  → dosya güncel değilse çıkış 1
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROPS = path.join(KOK, 'android', 'gradle.properties');
const IOS_PROPS = path.join(KOK, 'ios', 'admob.properties');
const HEDEF = path.join(KOK, 'www', 'js', 'reklam-kimlik.js');
export const TEST = {
  app: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/9214589741',
  gecis: 'ca-app-pub-3940256099942544/1033173712',
};
// iOS test kimlikleri (developers.google.com/admob/ios/test-ads)
export const TEST_IOS = {
  app: 'ca-app-pub-3940256099942544~1458002511',
  banner: 'ca-app-pub-3940256099942544/2435281174',
  gecis: 'ca-app-pub-3940256099942544/4411468910',
};

/** gradle.properties ya da admob.properties metni → { app, banner, gecis } */
export function oku(metin) {
  const al = (ad) => new RegExp(`^${ad}=(.+)$`, 'm').exec(metin)?.[1].trim();
  const k = { app: al('ADMOB_APP_ID'), banner: al('ADMOB_BANNER_ID'), gecis: al('ADMOB_INTERSTITIAL_ID') };
  for (const [ad, v] of Object.entries(k)) {
    if (!/^ca-app-pub-\d+[~/]\d+$/.test(v || '')) throw new Error(`gradle.properties: ${ad} geçersiz: ${v}`);
  }
  return k;
}

/** a: Android, i: iPhone kimlikleri */
export function uret(a, i) {
  return `// araclar/kimlik.mjs yazar (android/gradle.properties ve ios/admob.properties → ADMOB_BANNER_ID, ADMOB_INTERSTITIAL_ID);
// elle düzenlenmez. Platforma göre: android / ios.
export const REKLAM_KIMLIK = {
  android: { banner: '${a.banner}', gecis: '${a.gecis}' },
  ios: { banner: '${i.banner}', gecis: '${i.gecis}' },
};
// Google'ın test kimlikleri: hata ayıklama derlemesi her zaman bunları kullanır.
export const TEST_KIMLIK = {
  android: { banner: '${TEST.banner}', gecis: '${TEST.gecis}' },
  ios: { banner: '${TEST_IOS.banner}', gecis: '${TEST_IOS.gecis}' },
};
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const metin = uret(oku(fs.readFileSync(PROPS, 'utf8')), oku(fs.readFileSync(IOS_PROPS, 'utf8')));
  if (process.argv.includes('--denetle')) {
    if (fs.readFileSync(HEDEF, 'utf8') !== metin) { console.error(`${HEDEF} güncel değil: node smart-measure/araclar/kimlik.mjs`); process.exit(1); }
    console.log('tamam: reklam-kimlik.js gradle.properties ve ios/admob.properties ile aynı');
  } else {
    fs.writeFileSync(HEDEF, metin);
    console.log(`yazıldı: ${path.relative(process.cwd(), HEDEF)}`);
  }
}
