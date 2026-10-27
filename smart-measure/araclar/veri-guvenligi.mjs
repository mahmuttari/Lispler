#!/usr/bin/env node
// Smart Measure — Google Play Veri güvenliği formu CSV'si (bağımlılıksız, Node 22). İz Haritası'ndaki üreticinin uyarlaması.
// Satırlar Google'ın şablonundan gelir (hayalet-avcilari/magaza/veri-guvenligi.csv yalnız YAPI olarak okunur: soru ve
// yanıt kimlikleri, etiketler); "Response value" sütununun tamamı silinip aşağıdaki tabloyla yeniden doldurulur.
// Hesap bölümü (hesap oluşturma yolu, hesap/veri silme adresi) yazılmaz: uygulamada hesap yoktur.
// Tablo magaza/aciklamalar.md › "Veri güvenliği formu" ile aynıdır; biri değişince öbürü de değişir.
//
//   node smart-measure/araclar/veri-guvenligi.mjs           → smart-measure/magaza/veri-guvenligi.csv
//   node smart-measure/araclar/veri-guvenligi.mjs --denetle → dosya tabloyla aynı değilse çıkış 1
//
// Kaynak: AdMob SDK'sının kendi beyanı (developers.google.com/admob/android/privacy/play-data-disclosure: IP adresi →
// yaklaşık konum, ürün etkileşimleri, teşhis bilgisi, cihaz kimlikleri; "reklam, analiz ve dolandırıcılığı önleme" için
// otomatik toplanır ve paylaşılır, aktarımda TLS). Uygulamanın kendi verisi cihazdan çıkmaz: kamera görüntüsü ve mikrofon
// sesi yalnız bellekte işlenir (kaydedilmez, saklanmaz, gönderilmez); geçmiş, favoriler, kalibrasyonlar ve ayarlar telefonun
// deposundadır. Sensör değerleri (eğim, ışık) cihazda kalır. Google Play abonelik bilgisi cihazda Play'den okunur, yalnız
// orada "abone mi?" diye işlenir ve uygulamadan dışarı gönderilmez: Play'in tanımında "toplama" değildir
// (Play Console Yardım 10787469). Cihazda kalıp hiçbir yere gitmeyen veri beyan edilmez.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { csvSatirlari, veriGuvenligiOzeti } from '../../android/play.mjs';

const KOK = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SABLON = join(KOK, 'hayalet-avcilari', 'magaza', 'veri-guvenligi.csv');
const HEDEF = join(KOK, 'smart-measure', 'magaza', 'veri-guvenligi.csv');

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
  // Reklam ve Play istekleri yalnız HTTPS (usesCleartextTraffic=false; sayfa uygulamanın içinden sunulur)
  PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT: 'TRUE',
  // Toplanan veri (AdMob) geliştiricide değildir; cihazdaki kayıtlar "toplanmış" sayılmaz ve Ayarlar › Tüm verileri sil
  // ile silinir. Silme isteği yolu sunulmaz, beyan buna göre.
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
      console.error(`${HEDEF} tabloyla aynı değil: node smart-measure/araclar/veri-guvenligi.mjs`);
      process.exit(1);
    }
    console.log(`tamam: ${o.satir} satır, ${turler.length} veri türü`);
  } else {
    writeFileSync(HEDEF, csv);
    console.log(`${HEDEF}\n${o.satir} satır · ${turler.join(', ')}`);
  }
}
