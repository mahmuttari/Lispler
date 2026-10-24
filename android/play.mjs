// Google Play Developer API işleri (Node 22, bağımlılıksız) — GENEL-KONULAR/Takasla'daki düzenin Not Defteri'ne
// uyarlaması. Komutlar android/play-istek.txt'ye yazılır, .github/workflows/play.yml çalıştırır. Kimlik anahtarsızdır:
// iş akışı Workload Identity ile hizmet hesabının kısa ömürlü belirtecini PLAY_ACCESS_TOKEN'a koyar; hesap Play Console
// → Kullanıcılar ve izinler'de uygulamaya davet edilmiş olmalı (magaza/PLAY-YAYIN.md).
//
//   node play.mjs durum                         — salt okuma: ayrıntılar, kanallar, paketler, diller, görsel sayıları
//   node play.mjs magaza [uygula]               — iletişim bilgileri + tr-TR mağaza metni (magaza/aciklamalar.md)
//                                                 + varsa magaza/diller/<dil>.md (ör. en-US.md) çevirileri
//   node play.mjs gorsel [uygula]               — simge, öne çıkan görsel, telefon ekran görüntüleri (magaza/play)
//   node play.mjs yukle [dahili] [yayinla] [uygula]
//                                               — dist/NotDefteri-play.aab'yi üretim (ya da dahili test) kanalına
//                                                 TASLAK sürüm olarak koyar; "yayinla" sürümü incelemeye/yayına gönderir
//   node play.mjs imza                          — Play uygulama imzalama anahtarının SHA-256 parmak izi
//   node play.mjs veriguvenligi [uygula]        — magaza/veri-guvenligi.csv → Veri güvenliği formunun TAMAMI bununla
//                                                 yazılır (Play eksik ya da çelişkili yanıtı reddeder, hiçbir şey yazılmaz);
//                                                 önce seçili veri türleri ve her birinin yanıtları yazdırılır
//
// PLAY_UYGULAMA ortam değişkeni hangi uygulamanın işleneceğini seçer: boş ya da "notdefteri" (varsayılan),
// "hayalet" (Hayalet Avcıları: hayalet-avcilari/ klasörü, .github/workflows/play-hayalet.yml),
// "iz" (İz Haritası: iz-haritasi/ klasörü, .github/workflows/play-iz.yml).
//
// "uygula" yoksa hiçbir şey yazılmaz: düzenleme (edit) açılır, plan yazılır, düzenleme silinir. Uygulamayı oluşturmak
// ve ilk AAB'yi yüklemek Play Console'dan elle yapılır (taslak uygulamada API paketi bulamaz); API ondan sonra çalışır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const UYGULAMALAR = {
  notdefteri: { paket: 'com.poyrazworkshop.notdefteri', magaza: 'magaza', aab: 'dist/NotDefteri-play.aab', gradle: 'android/app/build.gradle' },
  hayalet: { paket: 'com.poyrazworkshop.hayaletavcilari', magaza: 'hayalet-avcilari/magaza', aab: 'dist/HayaletAvcilari-play.aab', gradle: 'hayalet-avcilari/android/app/build.gradle' },
  iz: { paket: 'com.poyrazworkshop.izharitasi', magaza: 'iz-haritasi/magaza', aab: 'dist/IzHaritasi-play.aab', gradle: 'iz-haritasi/android/app/build.gradle' },
};
const SECIM = UYGULAMALAR[process.env.PLAY_UYGULAMA || 'notdefteri'];
if (!SECIM) throw new Error(`PLAY_UYGULAMA bilinmiyor: ${process.env.PLAY_UYGULAMA} (${Object.keys(UYGULAMALAR).join(', ')})`);
export const PAKET = SECIM.paket;
const MAGAZA = path.join(KOK, SECIM.magaza);
const AAB = path.join(KOK, SECIM.aab);
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}`;
const UPAPI = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PAKET}`;
const ARG = process.argv.slice(3);
const UYGULA = ARG.includes('uygula');

const mdAlan = (md, ad) => new RegExp(`^- \\*\\*${ad}:\\*\\* (.+)$`, 'm').exec(md)?.[1].trim();
const mdBolum = (md, baslik) => (md.split(/^## /m).find((b) => b.startsWith(baslik)) || '').split('\n').slice(1).join('\n').trim();

/** Bir dilin mağaza metni: "Uygulama adı" satırı, "Kısa açıklama" ve "Uzun açıklama" bölümleri; sınırlar aşılırsa hata. */
function listingOku(md, dil) {
  const listing = {
    title: mdAlan(md, 'Uygulama adı'),
    shortDescription: mdBolum(md, 'Kısa açıklama'),
    fullDescription: mdBolum(md, 'Uzun açıklama'),
  };
  for (const [k, max] of [['title', 30], ['shortDescription', 80], ['fullDescription', 4000]]) {
    if (!listing[k] || listing[k].length > max) throw new Error(`${dil} ${k}: ${listing[k]?.length ?? 'yok'}/${max}`);
  }
  return listing;
}

/** magaza/diller/<dil>.md → { dil: md } (yoksa boş) */
export function dilDosyalari(magazaDizini = MAGAZA) {
  const d = path.join(magazaDizini, 'diller');
  if (!fs.existsSync(d)) return {};
  return Object.fromEntries(fs.readdirSync(d).filter((f) => /^[a-z]{2,3}(-[A-Za-z0-9]+)?\.md$/.test(f)).sort()
    .map((f) => [f.slice(0, -3), fs.readFileSync(path.join(d, f), 'utf8')]));
}

/** aciklamalar.md (+ çeviriler) → Play'e yazılacak ayrıntılar ve mağaza metinleri; sınırlar aşılırsa hata. */
export function magazaMetinleri(md, ceviriler = {}) {
  const listing = listingOku(md, 'tr-TR');
  const alan = (ad) => mdAlan(md, ad);
  const email = alan('Destek e-postası');
  if (!/^[^@\s]+@[^@\s]+$/.test(email || '')) throw new Error('aciklamalar.md: "Destek e-postası" satırı yok');
  const site = /^- \*\*Gizlilik politikası:\*\* (https:\/\/\S+?)gizlilik\.html$/m.exec(md)?.[1];
  return {
    details: { defaultLanguage: 'tr-TR', contactEmail: email, ...(site ? { contactWebsite: site } : {}) },
    listings: { 'tr-TR': listing, ...Object.fromEntries(Object.entries(ceviriler).map(([dil, cmd]) => [dil, listingOku(cmd, dil)])) },
  };
}

/** Sürüm notları: tr-TR surum-notu.txt, çeviriler diller/<dil>.md "Sürüm notu" bölümü (Play sınırı 500 karakter). */
export function surumNotlari(trNot, ceviriler = {}) {
  const notlar = [{ language: 'tr-TR', text: trNot.trim() }];
  for (const [dil, cmd] of Object.entries(ceviriler)) {
    const n = mdBolum(cmd, 'Sürüm notu');
    if (n) notlar.push({ language: dil, text: n });
  }
  for (const n of notlar) if (n.text.length > 500) throw new Error(`${n.language} sürüm notu ${n.text.length}/500`);
  return notlar;
}

/** Play'in verdiği sertifika özeti (onaltılık ya da base64) → "AB:CD:…". */
export function parmakIzi(ozet) {
  const duz = /^([0-9a-f]{2}:){31}[0-9a-f]{2}$/i.test(ozet) ? ozet.replace(/:/g, '') : ozet;
  const hex = /^[0-9a-f]{64}$/i.test(duz) ? duz : Buffer.from(duz, 'base64').toString('hex');
  if (hex.length !== 64) throw new Error(`beklenmeyen sertifika özeti: ${ozet}`);
  return hex.toUpperCase().match(/../g).join(':');
}

/** Görseller: Play türü → dosyalar (sıralı). tr-TR magaza/play/, diğer diller magaza/play/<dil>/ (yoksa null:
 *  Play o dilde varsayılan dilin görsellerini gösterir). Dil klasöründe simge yoksa tr-TR simgesi kullanılır. */
export function gorseller(dil = 'tr-TR') {
  const kok = path.join(MAGAZA, 'play');
  const d = dil === 'tr-TR' ? kok : path.join(kok, dil);
  if (!fs.existsSync(d)) return null;
  const tel = fs.readdirSync(d).filter((f) => /^telefon-.*\.png$/.test(f)).sort();
  const yol = (f) => (fs.existsSync(path.join(d, f)) ? path.join(d, f) : path.join(kok, f));
  const g = { icon: ['simge-512.png'], featureGraphic: ['tanitim-gorseli-1024x500.png'], phoneScreenshots: tel };
  return Object.fromEntries(Object.entries(g).map(([tur, dosyalar]) => [tur, dosyalar.map(yol)]));
}

/** RFC 4180 CSV (tırnak içinde virgül, "" ve satır sonu olabilir) → satır dizileri */
export function csvSatirlari(metin) {
  const satirlar = [];
  let satir = [], alan = '', tirnak = false;
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    if (tirnak) {
      if (c === '"' && metin[i + 1] === '"') { alan += '"'; i++; }
      else if (c === '"') tirnak = false;
      else alan += c;
    } else if (c === '"') tirnak = true;
    else if (c === ',') { satir.push(alan); alan = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && metin[i + 1] === '\n') i++;
      satir.push(alan); satirlar.push(satir); satir = []; alan = '';
    } else alan += c;
  }
  if (alan !== '' || satir.length) { satir.push(alan); satirlar.push(satir); }
  return satirlar;
}

/** Veri güvenliği CSV'si → { satir, genel: {soru[/yanıt]: değer}, turler: {tür: {toplanan, paylasilan, gecici, istege,
 *  amac, paylasimAmaci}} }; başlık Play'in CSV biçimi değilse hata. */
export function veriGuvenligiOzeti(csv) {
  const [baslik, ...satirlar] = csvSatirlari(csv).filter((r) => r.some((h) => h !== ''));
  if (!/^Question ID/.test(baslik?.[0] || '') || !/^Response ID/.test(baslik?.[1] || '') || !/^Response value/.test(baslik?.[2] || '')) {
    throw new Error('veri-guvenligi.csv: Play Console CSV başlığı değil');
  }
  const genel = {}, turler = {};
  for (const [soru, yanit, deger] of satirlar) {
    if (!deger) continue;
    if (soru.startsWith('PSL_DATA_TYPES_')) { if (deger === 'TRUE') turler[yanit] ??= {}; continue; }
    const p = /^PSL_DATA_USAGE_RESPONSES:([^:]+):(.+)$/.exec(soru);
    if (!p) { genel[yanit ? `${soru}/${yanit}` : soru] = deger; continue; }
    const t = (turler[p[1]] ??= {});
    if (p[2] === 'PSL_DATA_USAGE_EPHEMERAL') t.gecici = deger === 'TRUE';
    else if (deger !== 'TRUE') continue;
    else if (yanit === 'PSL_DATA_USAGE_ONLY_COLLECTED') t.toplanan = true;
    else if (yanit === 'PSL_DATA_USAGE_ONLY_SHARED') t.paylasilan = true;
    else if (p[2] === 'DATA_USAGE_USER_CONTROL') t.istege = yanit === 'PSL_DATA_USAGE_USER_CONTROL_OPTIONAL';
    else if (p[2] === 'DATA_USAGE_COLLECTION_PURPOSE') (t.amac ??= []).push(yanit.replace(/^PSL_/, ''));
    else if (p[2] === 'DATA_USAGE_SHARING_PURPOSE') (t.paylasimAmaci ??= []).push(yanit.replace(/^PSL_/, ''));
  }
  return { satir: satirlar.length, genel, turler };
}

/** android/app/build.gradle → { versionCode, versionName } */
export function surumBilgisi(gradle) {
  const versionCode = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1]);
  const versionName = /versionName\s+'([^']+)'/.exec(gradle)?.[1];
  if (!versionCode || !versionName) throw new Error('build.gradle: versionCode / versionName okunamadı');
  return { versionCode, versionName };
}

let BELIRTEC = '';
async function api(yontem, url, govde, tur) {
  for (let deneme = 0; ; deneme++) {
    const r = await fetch(url, {
      method: yontem,
      headers: { authorization: `Bearer ${BELIRTEC}`, ...(govde !== undefined ? { 'content-type': tur || 'application/json' } : {}) },
      body: govde === undefined ? undefined : tur ? govde : JSON.stringify(govde),
    });
    if ((r.status === 429 || r.status >= 500) && deneme < 4) { await new Promise((s) => setTimeout(s, 5000 * (deneme + 1))); continue; }
    const metin = await r.text();
    if (!r.ok) {
      const ipucu = r.status === 404 ? " — uygulama Play Console'da yok ya da ilk AAB henüz elle yüklenmedi"
        : r.status === 403 ? ' — hizmet hesabı uygulamaya davet edilmemiş, izni eksik ya da Google Play Android Developer API kapalı' : '';
      throw new Error(`${yontem} ${url.replace(/^https:\/\/[^/]+/, '')} → ${r.status} ${metin.replace(/\s+/g, ' ').slice(0, 2000)}${ipucu}`);
    }
    return metin ? JSON.parse(metin) : null;
  }
}

async function duzenle(is) {
  const e = await api('POST', `${API}/edits`, {});
  try {
    await is(e.id);
    if (UYGULA) { await api('POST', `${API}/edits/${e.id}:commit`); console.log('\nKAYDEDİLDİ (düzenleme onaylandı)'); }
    else { await api('DELETE', `${API}/edits/${e.id}`); console.log('\nPLAN: hiçbir şey yazılmadı (yazmak için "uygula")'); }
  } catch (h) {
    await api('DELETE', `${API}/edits/${e.id}`).catch(() => {});
    throw h;
  }
}

const surumler = (k) => (k.releases || []).map((r) => `${r.name || ''} [${(r.versionCodes || []).join(',')}] ${r.status}`).join(' · ') || '—';

async function durum() {
  await duzenle(async (id) => {
    const d = await api('GET', `${API}/edits/${id}/details`);
    console.log(`AYRINTILAR: varsayılan dil ${d.defaultLanguage} · e-posta ${d.contactEmail || '—'} · site ${d.contactWebsite || '—'}`);
    for (const k of (await api('GET', `${API}/edits/${id}/tracks`)).tracks || []) console.log(`KANAL ${k.track}: ${surumler(k)}`);
    const b = ((await api('GET', `${API}/edits/${id}/bundles`)).bundles || []).map((x) => x.versionCode);
    console.log(`PAKETLER (versionCode): ${b.join(', ') || '—'}`);
    for (const l of (await api('GET', `${API}/edits/${id}/listings`)).listings || []) {
      const say = [];
      for (const t of ['icon', 'featureGraphic', 'phoneScreenshots']) say.push(`${t}=${((await api('GET', `${API}/edits/${id}/listings/${l.language}/${t}`)).images || []).length}`);
      console.log(`DİL ${l.language}: "${l.title}" · ${say.join(' ')}`);
    }
  });
}

async function magaza() {
  const m = magazaMetinleri(fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8'), dilDosyalari());
  await duzenle(async (id) => {
    if (UYGULA) await api('PUT', `${API}/edits/${id}/details`, m.details);
    console.log(`  ${UYGULA ? '[tamam]' : '[plan]'} ayrıntılar: ${m.details.defaultLanguage} · ${m.details.contactEmail} · ${m.details.contactWebsite || '—'}`);
    for (const [dil, l] of Object.entries(m.listings)) {
      if (UYGULA) await api('PUT', `${API}/edits/${id}/listings/${dil}`, { language: dil, ...l });
      console.log(`  ${UYGULA ? '[tamam]' : '[plan]'} ${dil}: "${l.title}" · kısa ${l.shortDescription.length} · tam ${l.fullDescription.length} karakter`);
    }
  });
}

async function gorsel() {
  const diller = ['tr-TR', ...Object.keys(dilDosyalari())];
  await duzenle(async (id) => {
    for (const dil of diller) {
      const g = gorseller(dil);
      if (!g) { console.log(`  ${dil}: görsel klasörü yok, Play varsayılan dilinkileri gösterir`); continue; }
      for (const [tur, dosyalar] of Object.entries(g)) {
        if (UYGULA) {
          await api('DELETE', `${API}/edits/${id}/listings/${dil}/${tur}`);
          for (const f of dosyalar) await api('POST', `${UPAPI}/edits/${id}/listings/${dil}/${tur}?uploadType=media`, fs.readFileSync(f), 'image/png');
        }
      }
      console.log(`  ${UYGULA ? '[tamam]' : '[plan]'} ${dil}: ${Object.entries(g).map(([t, f]) => `${t}=${f.length}`).join(' ')}`);
    }
  });
}

async function yukle() {
  if (!fs.existsSync(AAB)) throw new Error(`${AAB} yok`);
  const { versionCode: vc, versionName } = surumBilgisi(fs.readFileSync(path.join(KOK, SECIM.gradle), 'utf8'));
  const kanal = ARG.includes('dahili') ? 'internal' : 'production';
  const status = ARG.includes('yayinla') ? 'completed' : 'draft';
  const notlar = surumNotlari(fs.readFileSync(path.join(MAGAZA, 'surum-notu.txt'), 'utf8'), dilDosyalari());
  console.log(`paket ${PAKET} · versionCode ${vc} · ${(fs.statSync(AAB).size / 1048576).toFixed(1)} MB · kanal ${kanal} · durum ${status}`);
  await duzenle(async (id) => {
    const varolan = ((await api('GET', `${API}/edits/${id}/bundles`)).bundles || []).map((b) => b.versionCode);
    if (varolan.includes(vc)) console.log(`  versionCode ${vc} Play'de zaten var: paket yeniden yüklenmez`);
    else if (UYGULA) {
      const y = await api('POST', `${UPAPI}/edits/${id}/bundles?uploadType=media`, fs.readFileSync(AAB), 'application/octet-stream');
      if (y.versionCode !== vc) throw new Error(`yüklenen AAB versionCode ${y.versionCode}, build.gradle ${vc}: önce AAB'yi yeniden derleyin`);
      console.log(`  [tamam] AAB yüklendi: versionCode ${y.versionCode}`);
    } else console.log('  [plan] AAB yüklenecek');
    console.log(`  kanal ${kanal} şimdi: ${surumler(await api('GET', `${API}/edits/${id}/tracks/${kanal}`))}`);
    const govde = { track: kanal, releases: [{ name: `${versionName} (${vc})`, versionCodes: [String(vc)], status,
      releaseNotes: notlar }] };
    if (UYGULA) await api('PUT', `${API}/edits/${id}/tracks/${kanal}`, govde);
    console.log(`  ${UYGULA ? '[tamam]' : '[plan]'} kanal ${kanal} → ${versionName} (${vc}) ${status}`);
  });
}

async function imza() {
  const e = await api('POST', `${API}/edits`, {});
  const b = ((await api('GET', `${API}/edits/${e.id}/bundles`)).bundles || []).map((x) => x.versionCode);
  await api('DELETE', `${API}/edits/${e.id}`);
  if (!b.length) throw new Error("Play'de paket yok");
  const vc = Math.max(...b);
  for (const k of (await api('GET', `${API}/generatedApks/${vc}`)).generatedApks || []) {
    console.log(`::notice::Play uygulama imzalama anahtarı SHA-256 (versionCode ${vc}): ${parmakIzi(k.certificateSha256Hash)}`);
  }
}

/** Veri güvenliği formu: Play API'sinin okuma ucu yoktur ve yazım formun tamamını değiştirir; Play eksik ya da çelişkili
 *  yanıtı reddeder (hiçbir şey yazılmaz). Yanıtlar magaza/aciklamalar.md › Veri güvenliği formu ile aynı olmalıdır. */
async function veriguvenligi() {
  const dosya = path.join(MAGAZA, 'veri-guvenligi.csv');
  if (!fs.existsSync(dosya)) throw new Error(`${path.relative(KOK, dosya)} yok`);
  const csv = fs.readFileSync(dosya, 'utf8');
  const o = veriGuvenligiOzeti(csv);
  console.log(`  ${o.satir} satır`);
  for (const [soru, deger] of Object.entries(o.genel)) console.log(`  ${soru} = ${deger}`);
  for (const [tur, t] of Object.entries(o.turler)) {
    console.log(`  ${tur}: ${[t.toplanan && 'toplanıyor', t.paylasilan && 'paylaşılıyor'].filter(Boolean).join(' + ') || '?'}`
      + ` · geçici ${t.gecici ? 'evet' : 'hayır'} · ${t.istege ? 'isteğe bağlı' : 'zorunlu'}`
      + ` · amaç ${(t.amac || []).join(', ') || '—'}${t.paylasimAmaci ? ` · paylaşım amacı ${t.paylasimAmaci.join(', ')}` : ''}`);
  }
  if (UYGULA) { await api('POST', `${API}/dataSafety`, { safetyLabels: csv }); console.log('\n  [tamam] veri güvenliği formu yazıldı'); }
  else console.log('\nPLAN: hiçbir şey yazılmadı (yazmak için "uygula")');
}

const KOMUTLAR = { durum, magaza, gorsel, yukle, imza, veriguvenligi };

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const komut = process.argv[2] || 'durum';
  if (!KOMUTLAR[komut]) { console.error(`bilinmeyen komut: ${komut} (${Object.keys(KOMUTLAR).join(', ')})`); process.exit(2); }
  BELIRTEC = process.env.PLAY_ACCESS_TOKEN || '';
  if (!BELIRTEC) { console.error('PLAY_ACCESS_TOKEN boş (iş akışı Google kimliğiyle üretir)'); process.exit(2); }
  console.log(UYGULA ? "KİP: UYGULA (Play'e yazılır)" : 'KİP: PLAN (hiçbir şey yazılmaz)');
  KOMUTLAR[komut]().catch((e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
