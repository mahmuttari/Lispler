// AdMob kimliklerini kaynaklarından uygulamaya yazar (Unitica'daki düzen): Android'inki android/gradle.properties,
// iPhone'unki ios/admob.properties (AdMob'da her platform ayrı uygulama ve ayrı birimdir).
// - www/reklam-kimlik.json: birim kimlikleri, platforma göre. React kodu (Yonetmelik-araclari › ortakkarar,
//   src/services/admob.ts) mağaza uygulamasında bu dosyayı okur; web sürümünde reklam katmanı hiç yüklenmez.
// - ios/App/App/Info.plist › GADApplicationIdentifier: iOS uygulama kimliği.
// letspicky-android.yml ve ios-asc.yml "cap sync"ten önce çalıştırır; www/ ortakkarar/dist'ten yeniden kopyalanınca da
// çalıştırılır. Çıktı depoya alınır; test/reklam.test.mjs kaynaklarla aynı olduğunu denetler.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const GRADLE = path.join(KOK, 'android', 'gradle.properties');
export const IOS = path.join(KOK, 'ios', 'admob.properties');
export const PLIST = path.join(KOK, 'ios', 'App', 'App', 'Info.plist');
export const CIKTI = path.join(KOK, 'www', 'reklam-kimlik.json');
export const TEST_ONEK = 'ca-app-pub-3940256099942544';

/** gradle.properties ya da admob.properties metni → { app, banner, gecis, odul } (eksikse hata) */
export function kimlikOku(metin, dosya = 'gradle.properties') {
  const al = (ad) => {
    const d = new RegExp(`^${ad}=(.+)$`, 'm').exec(metin)?.[1].trim();
    if (!d) throw new Error(`${dosya}: ${ad} yok`);
    return d;
  };
  return { app: al('ADMOB_APP_ID'), banner: al('ADMOB_BANNER_ID'), gecis: al('ADMOB_INTERSTITIAL_ID'), odul: al('ADMOB_REWARDED_ID') };
}

/** www/reklam-kimlik.json metni; a: Android, i: iPhone kimlikleri (uygulama kimliği web tarafına gitmez) */
export function kimlikDosyasi(a, i) {
  const birim = (k) => ({ banner: k.banner, gecis: k.gecis, odul: k.odul });
  return `${JSON.stringify({ android: birim(a), ios: birim(i) }, null, 2)}\n`;
}

/** Info.plist'teki GADApplicationIdentifier değerini değiştirir (anahtar yoksa hata) */
export function plistKimlik(plist, app) {
  const kalip = /(<key>GADApplicationIdentifier<\/key>\s*<string>)[^<]*(<\/string>)/;
  if (!kalip.test(plist)) throw new Error('Info.plist: GADApplicationIdentifier yok');
  return plist.replace(kalip, `$1${app}$2`);
}

export const testMi = (k) => Object.values(k).some((x) => x.startsWith(TEST_ONEK));

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const a = kimlikOku(fs.readFileSync(GRADLE, 'utf8'));
  const i = kimlikOku(fs.readFileSync(IOS, 'utf8'), 'admob.properties');
  fs.writeFileSync(CIKTI, kimlikDosyasi(a, i));
  fs.writeFileSync(PLIST, plistKimlik(fs.readFileSync(PLIST, 'utf8'), i.app));
  const not = (k) => (testMi(k) ? ' (Google TEST kimlikleri)' : '');
  console.log(`${path.relative(process.cwd(), CIKTI)} ve Info.plist yazıldı: Android${not(a)}, iPhone${not(i)}`);
}
