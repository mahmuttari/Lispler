// AdMob reklam birimi kimliklerini kaynaklarından web tarafına yazar: www/js/reklam-kimlik.js. Android'inki
// android/gradle.properties, iPhone'unki ios/admob.properties (AdMob'da her platform ayrı uygulama ve ayrı birimdir).
// unitica-android.yml ve ios-kucuk.yml "cap sync"ten önce çalıştırır; çıktı depoya da alınır ve test/reklam.test.mjs
// hepsinin aynı olduğunu denetler. Kimlik değişince: node unitica/araclar/kimlik.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const GRADLE = path.join(KOK, 'android', 'gradle.properties');
export const IOS = path.join(KOK, 'ios', 'admob.properties');
export const CIKTI = path.join(KOK, 'www', 'js', 'reklam-kimlik.js');

/** gradle.properties ya da admob.properties metni → { app, banner, gecis } (eksikse hata) */
export function kimlikOku(metin, dosya = 'gradle.properties') {
  const al = (ad) => {
    const d = new RegExp(`^${ad}=(.+)$`, 'm').exec(metin)?.[1].trim();
    if (!d) throw new Error(`${dosya}: ${ad} yok`);
    return d;
  };
  return { app: al('ADMOB_APP_ID'), banner: al('ADMOB_BANNER_ID'), gecis: al('ADMOB_INTERSTITIAL_ID') };
}

/** web tarafındaki dosyanın tam metni; a: Android, i: iPhone kimlikleri */
export function kimlikDosyasi(a, i) {
  return `// OTOMATİK: node araclar/kimlik.mjs yazar, kaynak android/gradle.properties ve ios/admob.properties (elle düzenleme).
// AdMob reklam birimi kimlikleri, platforma göre. Hata ayıklama derlemesinde (Capacitor.DEBUG) reklam.js bunların yerine
// Google'ın test birimlerini ister (isTesting).
export const REKLAM_KIMLIK = {
  android: { banner: '${a.banner}', gecis: '${a.gecis}' },
  ios: { banner: '${i.banner}', gecis: '${i.gecis}' },
};
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const a = kimlikOku(fs.readFileSync(GRADLE, 'utf8'));
  const i = kimlikOku(fs.readFileSync(IOS, 'utf8'), 'admob.properties');
  fs.writeFileSync(CIKTI, kimlikDosyasi(a, i));
  const test = (k) => (k.app.startsWith('ca-app-pub-3940256099942544') ? ' (Google TEST kimlikleri)' : '');
  console.log(`${path.relative(process.cwd(), CIKTI)} yazıldı: Android banner ${a.banner}, geçiş ${a.gecis}${test(a)}; `
    + `iPhone banner ${i.banner}, geçiş ${i.gecis}${test(i)}`);
}
