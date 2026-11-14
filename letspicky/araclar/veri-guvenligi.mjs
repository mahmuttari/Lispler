#!/usr/bin/env node
// Let's Picky — Google Play Veri güvenliği formu CSV'si (bağımlılıksız, Node 22). Ölçü Kutusu'ndaki üreticinin uyarlaması.
// Satırlar Google'ın şablonundan gelir (hayalet-avcilari/magaza/veri-guvenligi.csv yalnız YAPI olarak okunur: soru ve
// yanıt kimlikleri, etiketler); "Response value" sütununun tamamı silinip aşağıdaki tabloyla yeniden doldurulur.
// Uygulamada hesap yoktur (Firebase'in görünmez anonim oturumu hesap açma değildir): hesap oluşturma sorusu "hesap
// oluşturulamaz" (PSL_ACM_NONE) diye yanıtlanır; hesap/veri silme adresi yazılmaz.
// Tablo kaynak depodaki yanıtlarla aynıdır: mahmuttari/Yonetmelik-araclari › ortakkarar/store/play-veri-guvenligi.md ve
// https://letspicky.com/gizlilik.html. Biri değişince öbürü de değişir.
//
//   node letspicky/araclar/veri-guvenligi.mjs           → letspicky/magaza/veri-guvenligi.csv
//   node letspicky/araclar/veri-guvenligi.mjs --denetle → dosya tabloyla aynı değilse çıkış 1
//
// Uygulamanın kendi verisi (Firebase, oda 24 saatte silinir): takma ad, oylar ve tepkiler, "Kendin Yaz" seçenekleri,
// anonim Firebase kimliği; plan için yazılan yer ve izin verilirse cihazın 2 ondalığa yuvarlanmış konumu (yakın mekân
// araması). Google Firebase, Open-Meteo, Overpass ve Photon hizmet sağlayıcıdır: Play'in tanımında paylaşım değildir.
// AdMob SDK'sının kendi beyanı (developers.google.com/admob/android/privacy/play-data-disclosure): IP adresi → yaklaşık
// konum, ürün etkileşimleri, teşhis bilgisi, cihaz kimlikleri; "reklam, analiz ve dolandırıcılığı önleme" için toplanır
// ve paylaşılır. Kilitlenme günlükleri kaynak depodaki yanıtlarla aynı olsun diye ayrıca beyan edilir. Fragman oynatıcısı
// (youtube-nocookie) kullanıcının dokunmasıyla açılan web içeriğidir: uygulama veri toplamaz.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { csvSatirlari, veriGuvenligiOzeti } from '../../android/play.mjs';

const KOK = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SABLON = join(KOK, 'hayalet-avcilari', 'magaza', 'veri-guvenligi.csv');
const HEDEF = join(KOK, 'letspicky', 'magaza', 'veri-guvenligi.csv');

const ADMOB = ['PSL_ADVERTISING', 'PSL_ANALYTICS', 'PSL_FRAUD_PREVENTION_SECURITY'];
const ISLEV = 'PSL_APP_FUNCTIONALITY';

/** Beyan edilen veri türleri. Hiçbiri geçici işlenmez (AdMob ve Firebase kaydı tutar). paylasim: [] → yalnız toplanır. */
export const TURLER = {
  PSL_NAME: { toplama: [ISLEV], paylasim: [], istege: false },                        // takma ad (oda)
  PSL_USER_GENERATED_CONTENT: { toplama: [ISLEV], paylasim: [], istege: true },       // "Kendin Yaz" seçenekleri
  PSL_USER_INTERACTION: { toplama: [ISLEV, ...ADMOB], paylasim: ADMOB, istege: false }, // oylar, tepkiler; AdMob etkileşimleri
  PSL_DEVICE_ID: { toplama: [ISLEV, ...ADMOB], paylasim: ADMOB, istege: false },        // anonim Firebase kimliği; reklam kimliği
  PSL_APPROX_LOCATION: { toplama: [ISLEV, ...ADMOB], paylasim: ADMOB, istege: false },  // plan yeri, yuvarlanmış konum; AdMob (IP)
  PSL_CRASH_LOGS: { toplama: ADMOB, paylasim: ADMOB, istege: false },                   // AdMob SDK'sı
  PSL_PERFORMANCE_DIAGNOSTICS: { toplama: ADMOB, paylasim: ADMOB, istege: false },      // AdMob SDK'sı
};

export const GENEL = {
  PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA: 'TRUE',
  // Firebase, AdMob ve mekân servisleri yalnız HTTPS
  PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT: 'TRUE',
  // Oda verisi 24 saat içinde kendiliğinden silinir; silme gizlilik politikasındaki e-postadan da istenebilir
  PSL_DATA_COLLECTION_USER_REQUEST_DELETE: 'TRUE',
};

// Şablonda yalnız OAuth seçeneği var; satır Play'in kendi dışa aktarımındaki "hesap yok" seçeneğiyle yazılır
const HESAP_YOK = ['PSL_SUPPORTED_ACCOUNT_CREATION_METHODS', 'PSL_ACM_NONE', 'TRUE', 'MULTIPLE_CHOICE',
  'Account creation\nMy app does not allow users to create an account'];
const SILME = /^PSL_(ACCOUNT_DELETION_URL|DATA_DELETION_URL)$/;

/** Şablon satırları + tablo → yeni satırlar (başlık dahil). */
export function uret(sablon) {
  const [baslik, ...satirlar] = csvSatirlari(sablon);
  const cikti = [baslik];
  for (const r of satirlar) {
    const [soru, yanit] = r;
    if (soru === HESAP_YOK[0]) { cikti.push(HESAP_YOK); continue; }
    if (SILME.test(soru)) continue;
    let deger = '';
    if (soru in GENEL) deger = GENEL[soru];
    else if (soru.startsWith('PSL_DATA_TYPES_')) deger = yanit in TURLER ? 'TRUE' : '';
    else {
      const p = /^PSL_DATA_USAGE_RESPONSES:([^:]+):(.+)$/.exec(soru);
      if (!p) throw new Error(`şablonda bilinmeyen soru: ${soru}`);
      const tur = TURLER[p[1]];
      if (tur) {
        if (p[2] === 'PSL_DATA_USAGE_COLLECTION_AND_SHARING') {
          deger = yanit === 'PSL_DATA_USAGE_ONLY_COLLECTED' || tur.paylasim.length > 0 ? 'TRUE' : '';
        } else if (p[2] === 'PSL_DATA_USAGE_EPHEMERAL') deger = 'FALSE';
        else if (p[2] === 'DATA_USAGE_USER_CONTROL') {
          deger = yanit === (tur.istege ? 'PSL_DATA_USAGE_USER_CONTROL_OPTIONAL' : 'PSL_DATA_USAGE_USER_CONTROL_REQUIRED') ? 'TRUE' : '';
        } else if (p[2] === 'DATA_USAGE_COLLECTION_PURPOSE') deger = tur.toplama.includes(yanit) ? 'TRUE' : '';
        else if (p[2] === 'DATA_USAGE_SHARING_PURPOSE') deger = tur.paylasim.includes(yanit) ? 'TRUE' : '';
        else throw new Error(`şablonda bilinmeyen soru: ${soru}`);
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
      console.error(`${HEDEF} tabloyla aynı değil: node letspicky/araclar/veri-guvenligi.mjs`);
      process.exit(1);
    }
    console.log(`tamam: ${o.satir} satır, ${turler.length} veri türü`);
  } else {
    writeFileSync(HEDEF, csv);
    console.log(`${HEDEF}\n${o.satir} satır · ${turler.join(', ')}`);
  }
}
