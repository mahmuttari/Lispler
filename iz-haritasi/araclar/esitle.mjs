#!/usr/bin/env node
// İz Haritası'nın web arayüzünü GENEL-KONULAR deposundaki AirTag Harita'dan alır (bağımlılıksız, Node 22):
//   1. GENEL-KONULAR/airtag-harita/scripts/tek-dosya.mjs --ad "İz Haritası" → tek dosyalık sayfa
//   2. android/app/src/main/assets/www/index.html'e yazılır
//   3. kaynak commit iz-haritasi/KAYNAK.txt'ye işlenir
//   4. ortak Java dosyalarında (AnaEtkinlik, YerelKopru, GattIsi) son eşitlemeden beri değişiklik varsa listelenir:
//      onlar elle taşınır, çünkü Play sürümünde reklam farkı vardır (Reklam.java ve küçük kancalar)
//
//   node iz-haritasi/araclar/esitle.mjs [GENEL-KONULAR/airtag-harita yolu]
//   (varsayılan: bu deponun yanındaki ../GENEL-KONULAR/airtag-harita; bulut oturumunda iki depo yan yanadır)

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const IZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const KAYNAK = resolve(process.argv[2] || join(IZ, '..', '..', 'GENEL-KONULAR', 'airtag-harita'));
const AD = 'İz Haritası';
const HEDEF = join(IZ, 'android', 'app', 'src', 'main', 'assets', 'www', 'index.html');
const KAYIT = join(IZ, 'KAYNAK.txt');
const ORTAK_JAVA = 'android/src';

if (!existsSync(join(KAYNAK, 'scripts', 'tek-dosya.mjs'))) {
  console.error(`Bulunamadı: ${KAYNAK}/scripts/tek-dosya.mjs (GENEL-KONULAR deposunu bu deponun yanına al ya da yolu ver)`);
  process.exit(1);
}

const git = (...arg) => execFileSync('git', ['-C', KAYNAK, ...arg], { encoding: 'utf8' }).trim();
const commit = git('rev-parse', 'HEAD');
const kirli = git('status', '--porcelain', '--', '.');

const gecici = mkdtempSync(join(tmpdir(), 'iz-esitle-'));
try {
  execFileSync(process.execPath, [join(KAYNAK, 'scripts', 'tek-dosya.mjs'), gecici, '--ad', AD], { stdio: 'inherit' });
  copyFileSync(join(gecici, 'airtag-harita.html'), HEDEF);
} finally {
  rmSync(gecici, { recursive: true, force: true });
}

const onceki = existsSync(KAYIT) ? /^commit: (\w+)/m.exec(readFileSync(KAYIT, 'utf8'))?.[1] : null;
writeFileSync(
  KAYIT,
  [
    `# Web arayüzünün kaynağı (araclar/esitle.mjs yazar; elle düzenlenmez)`,
    `depo: mahmuttari/GENEL-KONULAR`,
    `klasor: airtag-harita`,
    `commit: ${commit}`,
    `tarih: ${git('log', '-1', '--format=%cI')}`,
    `ad: ${AD}`,
    kirli ? 'uyari: kaynakta commit edilmemiş değişiklik vardı' : null,
    '',
  ]
    .filter((s) => s !== null)
    .join('\n'),
);
console.log(`\n${HEDEF}\nkaynak commit ${commit.slice(0, 7)}${kirli ? ' (commit edilmemiş değişiklik var!)' : ''}`);

if (onceki && onceki !== commit) {
  const java = git('log', '--oneline', `${onceki}..${commit}`, '--', ORTAK_JAVA);
  if (java) {
    console.log(`\nORTAK JAVA DEĞİŞTİ (${ORTAK_JAVA}); iz-haritasi/android/app/src/main/java/… dosyalarına elle taşı:\n${java}`);
  }
}
