// Firebase compat SDK'sını CDN yerine paketten alır: node_modules/firebase/*-compat.js → www/vendor/.
// Sürüm package.json'da sabit (10.12.0, v4.11'in CDN'den yüklediği sürüm). www/vendor/ depoya alınmaz;
// derleme (kelime-android.yml) ve denetim (kelime-denetim.yml) önce bunu çalıştırır.
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
