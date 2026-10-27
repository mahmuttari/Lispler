// AdMob reklam birimi kimliklerini tek kaynaktan (android/gradle.properties) web tarafına yazar: www/js/reklam-kimlik.js.
// unitica-android.yml "cap sync"ten önce çalıştırır; çıktı depoya da alınır ve test/reklam.test.mjs ikisinin aynı
// olduğunu denetler. Kimlik değişince: node unitica/araclar/kimlik.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const GRADLE = path.join(KOK, 'android', 'gradle.properties');
export const CIKTI = path.join(KOK, 'www', 'js', 'reklam-kimlik.js');

/** gradle.properties metni → { app, banner, gecis } (eksikse hata) */
export function kimlikOku(metin) {
  const al = (ad) => {
    const d = new RegExp(`^${ad}=(.+)$`, 'm').exec(metin)?.[1].trim();
    if (!d) throw new Error(`gradle.properties: ${ad} yok`);
    return d;
  };
  return { app: al('ADMOB_APP_ID'), banner: al('ADMOB_BANNER_ID'), gecis: al('ADMOB_INTERSTITIAL_ID') };
}

/** web tarafındaki dosyanın tam metni */
export function kimlikDosyasi(k) {
  return `// OTOMATİK: node araclar/kimlik.mjs yazar, kaynak android/gradle.properties (elle düzenleme).
// AdMob reklam birimi kimlikleri. Hata ayıklama derlemesinde (Capacitor.DEBUG) reklam.js bunların yerine Google'ın
// test birimlerini ister (isTesting).
export const REKLAM_KIMLIK = {
  banner: '${k.banner}',
  gecis: '${k.gecis}',
};
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const k = kimlikOku(fs.readFileSync(GRADLE, 'utf8'));
  fs.writeFileSync(CIKTI, kimlikDosyasi(k));
  const test = k.app.startsWith('ca-app-pub-3940256099942544');
  console.log(`${path.relative(process.cwd(), CIKTI)} yazıldı: banner ${k.banner}, geçiş ${k.gecis}${test ? ' (Google TEST kimlikleri)' : ''}`);
}
