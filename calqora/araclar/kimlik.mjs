#!/usr/bin/env node
// Calqora — AdMob reklam birimi kimliklerini web tarafına yazar (bağımlılıksız, Node 22).
// Kaynaklar: android/gradle.properties (Android; ADMOB_APP_ID'yi manifeste app/build.gradle yazar) ve ios/admob.properties
// (iPhone; uygulama kimliğini Info.plist'e ios-ortak/kur.mjs yazar). Anahtarlar aynı: ADMOB_APP_ID, ADMOB_BANNER_ID,
// ADMOB_INTERSTITIAL_ID. Çıktı www/js/reklam-kimlik.js (elle düzenlenmez, depoya alınır). calqora-android.yml ve
// ios-kucuk.yml `cap sync`'ten önce çalıştırır; test/reklam.test.mjs dosyanın kaynaklarla aynı olduğunu denetler.
//
//   node calqora/araclar/kimlik.mjs            → www/js/reklam-kimlik.js
//   node calqora/araclar/kimlik.mjs --denetle  → dosya kaynaklarla aynı değilse çıkış 1
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PROPS = path.join(KOK, 'android', 'gradle.properties');
export const IOS_PROPS = path.join(KOK, 'ios', 'admob.properties');
export const HEDEF = path.join(KOK, 'www', 'js', 'reklam-kimlik.js');

// Google'ın herkese açık test kimlikleri (developers.google.com/admob/android/test-ads): hata ayıklama derlemesi bunları kullanır
export const TEST = {
  uygulama: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/9214589741',   // uyarlanabilir banner
  gecis: 'ca-app-pub-3940256099942544/1033173712',    // geçiş reklamı (interstitial)
};
// iOS test kimlikleri (developers.google.com/admob/ios/test-ads)
export const TEST_IOS = {
  uygulama: 'ca-app-pub-3940256099942544~1458002511',
  banner: 'ca-app-pub-3940256099942544/2435281174',   // uyarlanabilir banner
  gecis: 'ca-app-pub-3940256099942544/4411468910',    // geçiş reklamı (interstitial)
};

/** gradle.properties metni → { uygulama, banner, gecis }; eksik ya da biçimsiz kimlik hata verir. */
export function kimlikler(props) {
  const al = (ad) => new RegExp(`^${ad}=(.+)$`, 'm').exec(props)?.[1].trim();
  const k = { uygulama: al('ADMOB_APP_ID'), banner: al('ADMOB_BANNER_ID'), gecis: al('ADMOB_INTERSTITIAL_ID') };
  if (!/^ca-app-pub-\d+~\d+$/.test(k.uygulama || '')) throw new Error(`ADMOB_APP_ID biçimsiz: ${k.uygulama}`);
  for (const a of ['banner', 'gecis']) if (!/^ca-app-pub-\d+\/\d+$/.test(k[a] || '')) throw new Error(`reklam birimi biçimsiz: ${k[a]}`);
  return k;
}

const satir = (o) => `{ ${Object.entries(o).map(([a, d]) => `${a}: '${d}'`).join(', ')} }`;
const nesne = (o) => `{\n${Object.entries(o).map(([a, d]) => `  ${a}: ${satir(d)},`).join('\n')}\n}`;
const durum = (k, test, nerede) => (k.uygulama === test.uygulama
  ? `Şimdilik Google'ın TEST kimlikleri (gerçekleri AdMob'da oluşturulunca ${nerede}).`
  : 'Gerçek AdMob kimlikleri (yayıncı ' + /pub-(\d+)/.exec(k.uygulama)[1] + ').');

/** reklam-kimlik.js'in içeriği; props: gradle.properties, iosProps: ios/admob.properties */
export function uret(props, iosProps) {
  const a = kimlikler(props), i = kimlikler(iosProps);
  return `// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: android/gradle.properties ve ios/admob.properties → node araclar/kimlik.mjs
// Android: ${durum(a, TEST, 'magaza/PLAY-YAYIN.md adım 1')}
// iPhone: ${durum(i, TEST_IOS, 'docs/ios-yayin.md §1 adım 4')}
// Hata ayıklama derlemesi (Capacitor.DEBUG) her zaman TEST_KIMLIK'i kullanır (reklam.js).
export const REKLAM_KIMLIK = ${nesne({ android: a, ios: i })};
export const TEST_KIMLIK = ${nesne({ android: TEST, ios: TEST_IOS })};
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const metin = uret(fs.readFileSync(PROPS, 'utf8'), fs.readFileSync(IOS_PROPS, 'utf8'));
  if (process.argv.includes('--denetle')) {
    const eski = fs.existsSync(HEDEF) ? fs.readFileSync(HEDEF, 'utf8') : '';
    if (eski !== metin) { console.error(`${HEDEF} kaynaklarla aynı değil: node calqora/araclar/kimlik.mjs`); process.exit(1); }
    console.log('tamam: reklam-kimlik.js gradle.properties ve ios/admob.properties ile aynı');
  } else {
    fs.writeFileSync(HEDEF, metin);
    console.log(`${HEDEF}\n${metin.split('\n').filter((s) => s.includes('ca-app-pub')).join('\n')}`);
  }
}
