#!/usr/bin/env node
// Tavla — Google Play Veri güvenliği formu CSV'si (bağımlılıksız, Node 22). iz-haritasi/araclar/veri-guvenligi.mjs düzeni:
// satırlar Google'ın şablonundan gelir (hayalet-avcilari/magaza/veri-guvenligi.csv yalnız YAPI olarak okunur), "Response
// value" sütunu aşağıdaki tabloyla yeniden doldurulur. Tablo magaza/aciklamalar.md › "Veri güvenliği formu" ile aynıdır.
//
//   node tavla/araclar/veri-guvenligi.mjs           → tavla/magaza/veri-guvenligi.csv
//   node tavla/araclar/veri-guvenligi.mjs --denetle → dosya tabloyla aynı değilse çıkış 1
//
// Oyun verisi yalnız Firebase'de (Authentication + Firestore) oyunun işleyişi için tutulur ve paylaşılmaz (Google,
// Firebase'de "hizmet sağlayıcı"dır). Reklamlar Google AdMob'dur: AdMob SDK'sının kendi beyanına göre (developers.google.com/
// admob/android/privacy/play-data-disclosure) IP'den yaklaşık konum, uygulama etkileşimleri, teşhis bilgisi ve cihaz/reklam
// kimliği reklam, analiz ve dolandırıcılığı önleme için toplanır VE paylaşılır.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { csvSatirlari, veriGuvenligiOzeti } from '../../android/play.mjs';

const KOK = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SABLON = join(KOK, 'hayalet-avcilari', 'magaza', 'veri-guvenligi.csv');
const HEDEF = join(KOK, 'tavla', 'magaza', 'veri-guvenligi.csv');
export const HESAP_SILME = 'https://mahmuttari.github.io/Lispler/tavla/hesap-silme.html';

const ADMOB = ['PSL_ADVERTISING', 'PSL_ANALYTICS', 'PSL_FRAUD_PREVENTION_SECURITY'];

/** Beyan edilen türler. istege: kullanıcı vermeyebilir; gecici: kaydedilmeden işlenir; paylas: üçüncü kişiyle (AdMob)
 *  paylaşılır, paylaşım amacı toplama amacıyla aynı. */
export const TURLER = {
  // Rumuz (takma ad): yazılmazsa "Misafir"
  PSL_NAME: { amac: ['PSL_APP_FUNCTIONALITY', 'PSL_ACCOUNT_MANAGEMENT'], istege: true },
  // Yalnız hesabını e-posta ya da Google ile yedekleyen oyuncuda (Firebase Authentication)
  PSL_EMAIL: { amac: ['PSL_ACCOUNT_MANAGEMENT'], istege: true },
  // Firebase kullanıcı kimliği (anonim oturum dahil): her oyuncuda
  PSL_USER_ACCOUNT: { amac: ['PSL_APP_FUNCTIONALITY', 'PSL_ACCOUNT_MANAGEMENT'], istege: false },
  // Sohbet mesajları ve şikâyetler (şikâyete o odadaki son mesajlar eklenir)
  PSL_USER_GENERATED_CONTENT: { amac: ['PSL_APP_FUNCTIONALITY', 'PSL_FRAUD_PREVENTION_SECURITY'], istege: true },
  // Puan, galibiyet/mağlubiyet, mars sayıları, arkadaş listesi, son görülme, oyun odası durumu
  PSL_OTHER_APP_ACTIVITY: { amac: ['PSL_APP_FUNCTIONALITY'], istege: false },
  // Sesli sohbet: iki oyuncu da onaylarsa WebRTC ile doğrudan (uçtan uca şifreli) iletilir, hiçbir yerde kaydedilmez
  PSL_AUDIO: { amac: ['PSL_APP_FUNCTIONALITY'], istege: true, gecici: true },
  // AdMob: IP adresinden yaklaşık konum; uygulama açılışı, dokunma, reklam izleme; SDK başarımı; reklam kimliği
  PSL_APPROX_LOCATION: { amac: ADMOB, istege: false, paylas: true },
  PSL_USER_INTERACTION: { amac: ADMOB, istege: false, paylas: true },
  PSL_PERFORMANCE_DIAGNOSTICS: { amac: ADMOB, istege: false, paylas: true },
  PSL_DEVICE_ID: { amac: ADMOB, istege: false, paylas: true },
};

export const GENEL = {
  PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA: 'TRUE',
  PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT: 'TRUE', // Firestore/Auth HTTPS, WebRTC DTLS-SRTP
  PSL_DATA_COLLECTION_USER_REQUEST_DELETE: 'TRUE', // uygulama içinde "Hesabı sil" + web sayfası
  PSL_ACCOUNT_DELETION_URL: HESAP_SILME,
  PSL_DATA_DELETION_URL: HESAP_SILME,
};

/** Şablon satırları + tablo → yeni satırlar (başlık dahil). */
export function uret(sablon) {
  const [baslik, ...satirlar] = csvSatirlari(sablon);
  const cikti = [baslik];
  for (const r of satirlar) {
    const [soru, yanit] = r;
    let deger = '';
    if (soru in GENEL) deger = GENEL[soru];
    // Şablonda yalnız OAuth seçeneği var: Google ile giriş. E-posta + şifre Console'da elle işaretlenir (PLAY-YAYIN.md).
    else if (soru === 'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS') deger = yanit === 'PSL_ACM_OAUTH' ? 'TRUE' : '';
    else if (soru.startsWith('PSL_DATA_TYPES_')) deger = yanit in TURLER ? 'TRUE' : '';
    else {
      const p = /^PSL_DATA_USAGE_RESPONSES:([^:]+):(.+)$/.exec(soru);
      if (!p) throw new Error(`şablonda bilinmeyen soru: ${soru}`);
      const t = TURLER[p[1]];
      if (t) {
        if (p[2] === 'PSL_DATA_USAGE_COLLECTION_AND_SHARING') {
          deger = yanit === 'PSL_DATA_USAGE_ONLY_COLLECTED' || (t.paylas && yanit === 'PSL_DATA_USAGE_ONLY_SHARED') ? 'TRUE' : '';
        }
        else if (p[2] === 'PSL_DATA_USAGE_EPHEMERAL') deger = t.gecici ? 'TRUE' : 'FALSE';
        else if (p[2] === 'DATA_USAGE_USER_CONTROL') {
          deger = yanit === (t.istege ? 'PSL_DATA_USAGE_USER_CONTROL_OPTIONAL' : 'PSL_DATA_USAGE_USER_CONTROL_REQUIRED') ? 'TRUE' : '';
        } else if (p[2] === 'DATA_USAGE_COLLECTION_PURPOSE') deger = t.amac.includes(yanit) ? 'TRUE' : '';
        else if (p[2] === 'DATA_USAGE_SHARING_PURPOSE') deger = t.paylas && t.amac.includes(yanit) ? 'TRUE' : '';
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
    if (readFileSync(HEDEF, 'utf8') !== csv) {
      console.error(`${HEDEF} tabloyla aynı değil: node tavla/araclar/veri-guvenligi.mjs`);
      process.exit(1);
    }
    console.log(`tamam: ${o.satir} satır, ${turler.length} veri türü`);
  } else {
    writeFileSync(HEDEF, csv);
    console.log(`${HEDEF}\n${o.satir} satır · ${turler.join(', ')}`);
  }
}
