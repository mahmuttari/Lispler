#!/usr/bin/env node
// Unitica — Google Play Veri güvenliği formu CSV'si (bağımlılıksız, Node 22). İz Haritası'ndaki üreticinin aynısı.
// Satırlar Google'ın şablonundan gelir (hayalet-avcilari/magaza/veri-guvenligi.csv yalnız YAPI olarak okunur: soru ve
// yanıt kimlikleri, etiketler); "Response value" sütununun tamamı silinip aşağıdaki tabloyla yeniden doldurulur.
// Hesap bölümü (hesap oluşturma yolu, hesap/veri silme adresi) yazılmaz: uygulamada hesap yoktur.
// Tablo magaza/aciklamalar.md › "Veri güvenliği formu" ile aynıdır; biri değişince öbürü de değişir.
//
//   node unitica/araclar/veri-guvenligi.mjs           → unitica/magaza/veri-guvenligi.csv
//   node unitica/araclar/veri-guvenligi.mjs --denetle → dosya tabloyla aynı değilse çıkış 1
//
// Kaynak: AdMob SDK'sının kendi beyanı (developers.google.com/admob/android/privacy/play-data-disclosure: IP adresi,
// ürün etkileşimleri, teşhis bilgisi, cihaz kimlikleri; "reklam, analiz ve dolandırıcılığı önleme" için toplanır ve
// paylaşılır). Uygulamanın kendi verisi (değerler, geçmiş, favoriler, ayarlar) cihazdan çıkmaz; ödemeyi Google Play alır.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { csvSatirlari, veriGuvenligiOzeti } from '../../android/play.mjs';

const KOK = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const SABLON = join(KOK, 'hayalet-avcilari', 'magaza', 'veri-guvenligi.csv');
export const HEDEF = join(KOK, 'unitica', 'magaza', 'veri-guvenligi.csv');

const ADMOB = ['PSL_ADVERTISING', 'PSL_ANALYTICS', 'PSL_FRAUD_PREVENTION_SECURITY'];

/** Beyan edilen veri türleri. Hepsi toplanır VE paylaşılır, zorunludur, geçici işlenmez; paylaşım amacı toplama amacıyla aynı. */
export const TURLER = {
  PSL_APPROX_LOCATION: ADMOB,          // AdMob: IP adresinden yaklaşık konum
  PSL_USER_INTERACTION: ADMOB,         // AdMob: uygulama açılışı, dokunma, reklam izleme
  PSL_PERFORMANCE_DIAGNOSTICS: ADMOB,  // AdMob: uygulamanın ve SDK'nın başarımı
  PSL_DEVICE_ID: ADMOB,                // AdMob: reklam kimliği, uygulama grubu kimliği
};

export const GENEL = {
  PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA: 'TRUE',
  // Reklam ve Google Play istekleri yalnız HTTPS (usesCleartextTraffic=false)
  PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT: 'TRUE',
  // AdMob verisi geliştiricide değildir; cihazdaki kayıtlar "toplanmış" sayılmaz ve uygulama içinden silinir
  PSL_DATA_COLLECTION_USER_REQUEST_DELETE: 'FALSE',
};

const HESAP = /^PSL_(SUPPORTED_ACCOUNT_CREATION_METHODS|ACCOUNT_DELETION_URL|DATA_DELETION_URL)$/;

/** Şablon satırları + tablo → yeni satırlar (başlık dahil). */
export function uret(sablon) {
  const [baslik, ...satirlar] = csvSatirlari(sablon);
  const cikti = [baslik];
  for (const r of satirlar) {
    const [soru, yanit] = r;
    if (HESAP.test(soru)) continue;
    let deger = '';
    if (soru in GENEL) deger = GENEL[soru];
    else if (soru.startsWith('PSL_DATA_TYPES_')) deger = yanit in TURLER ? 'TRUE' : '';
    else {
      const p = /^PSL_DATA_USAGE_RESPONSES:([^:]+):(.+)$/.exec(soru);
      if (!p) throw new Error(`şablonda bilinmeyen soru: ${soru}`);
      const amac = TURLER[p[1]];
      if (amac) {
        if (p[2] === 'PSL_DATA_USAGE_COLLECTION_AND_SHARING') deger = 'TRUE';
        else if (p[2] === 'PSL_DATA_USAGE_EPHEMERAL') deger = 'FALSE';
        else if (p[2] === 'DATA_USAGE_USER_CONTROL') deger = yanit === 'PSL_DATA_USAGE_USER_CONTROL_REQUIRED' ? 'TRUE' : '';
        else if (p[2] === 'DATA_USAGE_COLLECTION_PURPOSE' || p[2] === 'DATA_USAGE_SHARING_PURPOSE') {
          deger = amac.includes(yanit) ? 'TRUE' : '';
        } else throw new Error(`şablonda bilinmeyen soru: ${soru}`);
      }
    }
    cikti.push([r[0], r[1], deger, ...r.slice(3)]);
  }
  return cikti;
}

/** RFC 4180: virgül, tırnak ya da satır sonu içeren alan tırnağa alınır (Play'in kendi dışa aktarımıyla aynı). */
export function csvYaz(satirlar) {
  const alan = (s) => (/[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s);
  return satirlar.map((r) => r.map(alan).join(',')).join('\n') + '\n';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const csv = csvYaz(uret(readFileSync(SABLON, 'utf8')));
  const o = veriGuvenligiOzeti(csv);
  const turler = Object.keys(o.turler);
  for (const t of Object.keys(TURLER)) if (!turler.includes(t)) throw new Error(`şablonda tür yok: ${t}`);
  if (process.argv.includes('--denetle')) {
    const eski = readFileSync(HEDEF, 'utf8');
    if (eski !== csv) {
      console.error(`${HEDEF} tabloyla aynı değil: node unitica/araclar/veri-guvenligi.mjs`);
      process.exit(1);
    }
    console.log(`tamam: ${o.satir} satır, ${turler.length} veri türü`);
  } else {
    writeFileSync(HEDEF, csv);
    console.log(`${HEDEF}\n${o.satir} satır · ${turler.join(', ')}`);
  }
}
