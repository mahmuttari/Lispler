#!/usr/bin/env node
// Kıble Bul — AdMob reklam birimi kimliklerini sayfaya taşır (bağımlılıksız, Node 22).
// Tek kaynak android/gradle.properties: ADMOB_APP_ID manifest'e gider (build.gradle › manifestPlaceholders), banner ve
// geçiş birimi kimlikleri sayfaya: www/js/reklam-kimlik.js. CI bunu "cap sync"ten önce çalıştırır; çıktı depoda da
// durur ve test/reklam.test.mjs ikisinin aynı olduğunu denetler.
//
//   node kible-bul/araclar/kimlik.mjs            → www/js/reklam-kimlik.js yazılır
//   node kible-bul/araclar/kimlik.mjs --denetle  → dosya gradle.properties ile aynı değilse çıkış 1
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KB = fileURLToPath(new URL('..', import.meta.url));
export const OZELLIKLER = join(KB, 'android', 'gradle.properties');
export const HEDEF = join(KB, 'www', 'js', 'reklam-kimlik.js');

/** gradle.properties metni → { uygulama, banner, gecis }; eksik ya da biçimsiz kimlikte hata */
export function kimlikleriOku(metin) {
  const al = (ad) => new RegExp(`^${ad}=(.*)$`, 'm').exec(metin)?.[1].trim();
  const k = { uygulama: al('ADMOB_APP_ID'), banner: al('ADMOB_BANNER_ID'), gecis: al('ADMOB_INTERSTITIAL_ID') };
  if (!/^ca-app-pub-\d{16}~\d{10}$/.test(k.uygulama || '')) throw new Error(`ADMOB_APP_ID biçimsiz: ${k.uygulama}`);
  for (const ad of ['banner', 'gecis']) {
    if (!/^ca-app-pub-\d{16}\/\d{10}$/.test(k[ad] || '')) throw new Error(`${ad} birimi biçimsiz: ${k[ad]}`);
  }
  return k;
}

/** www/js/reklam-kimlik.js'in içeriği */
export function kimlikDosyasi(k) {
  return `// OTOMATİK: node kible-bul/araclar/kimlik.mjs yazar; kaynak android/gradle.properties. Elle düzenleme.
// Google'ın test yayıncısı (ca-app-pub-3940256099942544) para kazandırmaz; gerçek kimlikler magaza/PLAY-YAYIN.md adım 1.
export const REKLAM_KIMLIK = {
  uygulama: '${k.uygulama}',
  banner: '${k.banner}',
  gecis: '${k.gecis}',
};
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const metin = kimlikDosyasi(kimlikleriOku(readFileSync(OZELLIKLER, 'utf8')));
  if (process.argv.includes('--denetle')) {
    if (readFileSync(HEDEF, 'utf8') !== metin) {
      console.error(`${HEDEF} gradle.properties ile aynı değil: node kible-bul/araclar/kimlik.mjs`);
      process.exit(1);
    }
    console.log('tamam: reklam-kimlik.js gradle.properties ile aynı');
  } else {
    writeFileSync(HEDEF, metin);
    console.log(HEDEF);
    if (metin.includes('3940256099942544')) console.log('UYARI: Google TEST kimlikleri (para kazandırmaz)');
  }
}
