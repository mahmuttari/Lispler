// Firebase compat SDK'sını CDN yerine paketten alır: node_modules/firebase/*-compat.js → www/vendor/.
// Sürüm package.json'da sabit (10.12.0, v4.11'in CDN'den yüklediği sürüm). www/vendor/ depoya alınmaz;
// derleme (kelime-android.yml) ve denetim (kelime-denetim.yml) önce bunu çalıştırır.
// 1.0.3: Fredoka ve Nunito (OFL-1.1, @fontsource-variable) da buradan www/vendor/fonts/'a alınır; yalnız latin ve
// latin-ext (Türkçe harfler) alt kümeleri, değişken ağırlık. Uygulama çevrimdışı açılsa da yazı tipi hazırdır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK = path.join(KOK, 'node_modules', 'firebase');
const HEDEF = path.join(KOK, 'www', 'vendor');
const DOSYALAR = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-database-compat.js'];

const surum = JSON.parse(fs.readFileSync(path.join(KAYNAK, 'package.json'), 'utf8')).version;
fs.mkdirSync(HEDEF, { recursive: true });
for (const f of DOSYALAR) {
  const k = path.join(KAYNAK, f);
  if (!fs.existsSync(k)) throw new Error(`firebase@${surum} içinde ${f} yok`);
  // Kaynak haritası yorumu www/vendor'da olmayan .map dosyasına gider; konsolda 404 olmasın diye atılır
  const metin = fs.readFileSync(k, 'utf8').replace(/\n\/\/# sourceMappingURL=\S+\s*$/, '\n');
  fs.writeFileSync(path.join(HEDEF, f), metin);
  console.log(`www/vendor/${f} ← firebase@${surum} (${metin.length} bayt)`);
}

// Yazı tipleri: fontsource CSS'inden yalnız latin ve latin-ext @font-face blokları ve onların woff2 dosyaları
const YAZI_TIPLERI = ['fredoka', 'nunito'];
const FONT_HEDEF = path.join(HEDEF, 'fonts');
fs.mkdirSync(FONT_HEDEF, { recursive: true });
let fontCss = '/* Fredoka ve Nunito — SIL Open Font License 1.1 (@fontsource-variable). araclar/vendor.mjs üretir. */\n';
for (const ad of YAZI_TIPLERI) {
  const paket = path.join(KOK, 'node_modules', '@fontsource-variable', ad);
  const css = fs.readFileSync(path.join(paket, 'index.css'), 'utf8');
  const bloklar = css.split(/(?=\/\* )/).filter((b) => new RegExp(`/\\* ${ad}-(latin|latin-ext)-wght-normal \\*/`).test(b));
  if (bloklar.length !== 2) throw new Error(`${ad}: latin/latin-ext blokları bulunamadı`);
  for (const b of bloklar) {
    const dosya = /url\(\.\/files\/([^)]+)\)/.exec(b)[1];
    fs.copyFileSync(path.join(paket, 'files', dosya), path.join(FONT_HEDEF, dosya));
    fontCss += b.replace('./files/', './').trim() + '\n';
    console.log(`www/vendor/fonts/${dosya}`);
  }
}
fs.writeFileSync(path.join(FONT_HEDEF, 'fonts.css'), fontCss);
console.log('www/vendor/fonts/fonts.css');
