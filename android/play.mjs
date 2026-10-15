// Google Play Developer API işleri (Node 22, bağımlılıksız) — GENEL-KONULAR/Takasla'daki düzenin Not Defteri'ne
// uyarlaması. Komutlar android/play-istek.txt'ye yazılır, .github/workflows/play.yml çalıştırır. Kimlik anahtarsızdır:
// iş akışı Workload Identity ile hizmet hesabının kısa ömürlü belirtecini PLAY_ACCESS_TOKEN'a koyar; hesap Play Console
// → Kullanıcılar ve izinler'de uygulamaya davet edilmiş olmalı (magaza/PLAY-YAYIN.md).
//
//   node play.mjs durum                         — salt okuma: ayrıntılar, kanallar, paketler, diller, görsel sayıları
//   node play.mjs magaza [uygula]               — iletişim bilgileri + tr-TR mağaza metni (magaza/aciklamalar.md)
//   node play.mjs gorsel [uygula]               — simge, öne çıkan görsel, telefon ekran görüntüleri (magaza/play)
//   node play.mjs yukle [dahili] [yayinla] [uygula]
//                                               — dist/NotDefteri-play.aab'yi üretim (ya da dahili test) kanalına
//                                                 TASLAK sürüm olarak koyar; "yayinla" sürümü incelemeye/yayına gönderir
//   node play.mjs imza                          — Play uygulama imzalama anahtarının SHA-256 parmak izi
//
// "uygula" yoksa hiçbir şey yazılmaz: düzenleme (edit) açılır, plan yazılır, düzenleme silinir. Uygulamayı oluşturmak
// ve ilk AAB'yi yüklemek Play Console'dan elle yapılır (taslak uygulamada API paketi bulamaz); API ondan sonra çalışır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PAKET = 'com.poyrazworkshop.notdefteri';
const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAGAZA = path.join(KOK, 'magaza');
const AAB = path.join(KOK, 'dist', 'NotDefteri-play.aab');
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}`;
const UPAPI = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PAKET}`;
const ARG = process.argv.slice(3);
const UYGULA = ARG.includes('uygula');

/** aciklamalar.md → Play'e yazılacak ayrıntılar ve tr-TR mağaza metni; sınırlar aşılırsa hata. */
export function magazaMetinleri(md) {
  const alan = (ad) => new RegExp(`^- \\*\\*${ad}:\\*\\* (.+)$`, 'm').exec(md)?.[1].trim();
  const bolum = (baslik) => (md.split(/^## /m).find((b) => b.startsWith(baslik)) || '').split('\n').slice(1).join('\n').trim();
  const listing = {
    title: alan('Uygulama adı'),
    shortDescription: bolum('Kısa açıklama'),
    fullDescription: bolum('Uzun açıklama'),
  };
  for (const [k, max] of [['title', 30], ['shortDescription', 80], ['fullDescription', 4000]]) {
    if (!listing[k] || listing[k].length > max) throw new Error(`tr-TR ${k}: ${listing[k]?.length ?? 'yok'}/${max}`);
  }
  const email = alan('Destek e-postası');
  if (!/^[^@\s]+@[^@\s]+$/.test(email || '')) throw new Error('aciklamalar.md: "Destek e-postası" satırı yok');
  const site = /^- \*\*Gizlilik politikası:\*\* (https:\/\/\S+?)gizlilik\.html$/m.exec(md)?.[1];
  return {
    details: { defaultLanguage: 'tr-TR', contactEmail: email, ...(site ? { contactWebsite: site } : {}) },
    listings: { 'tr-TR': listing },
  };
}

/** Play'in verdiği sertifika özeti (onaltılık ya da base64) → "AB:CD:…". */
export function parmakIzi(ozet) {
  const duz = /^([0-9a-f]{2}:){31}[0-9a-f]{2}$/i.test(ozet) ? ozet.replace(/:/g, '') : ozet;
  const hex = /^[0-9a-f]{64}$/i.test(duz) ? duz : Buffer.from(duz, 'base64').toString('hex');
  if (hex.length !== 64) throw new Error(`beklenmeyen sertifika özeti: ${ozet}`);
  return hex.toUpperCase().match(/../g).join(':');
}

/** Görseller: Play türü → dosyalar (sıralı). */
export function gorseller() {
  const d = path.join(MAGAZA, 'play');
  const tel = fs.readdirSync(d).filter((f) => /^telefon-.*\.png$/.test(f)).sort();
  const g = { icon: ['simge-512.png'], featureGraphic: ['tanitim-gorseli-1024x500.png'], phoneScreenshots: tel };
  return Object.fromEntries(Object.entries(g).map(([tur, dosyalar]) => [tur, dosyalar.map((f) => path.join(d, f))]));
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
      throw new Error(`${yontem} ${url.replace(/^https:\/\/[^/]+/, '')} → ${r.status} ${metin.replace(/\s+/g, ' ').slice(0, 500)}${ipucu}`);
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
  const m = magazaMetinleri(fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8'));
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
  const g = gorseller();
  await duzenle(async (id) => {
    for (const [tur, dosyalar] of Object.entries(g)) {
      if (UYGULA) {
        await api('DELETE', `${API}/edits/${id}/listings/tr-TR/${tur}`);
        for (const f of dosyalar) await api('POST', `${UPAPI}/edits/${id}/listings/tr-TR/${tur}?uploadType=media`, fs.readFileSync(f), 'image/png');
      }
    }
    console.log(`  ${UYGULA ? '[tamam]' : '[plan]'} tr-TR: ${Object.entries(g).map(([t, f]) => `${t}=${f.length}`).join(' ')}`);
  });
}

async function yukle() {
  if (!fs.existsSync(AAB)) throw new Error(`${AAB} yok`);
  const { versionCode: vc, versionName } = surumBilgisi(fs.readFileSync(path.join(KOK, 'android', 'app', 'build.gradle'), 'utf8'));
  const kanal = ARG.includes('dahili') ? 'internal' : 'production';
  const status = ARG.includes('yayinla') ? 'completed' : 'draft';
  const notlar = fs.readFileSync(path.join(MAGAZA, 'surum-notu.txt'), 'utf8').trim();
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
      releaseNotes: [{ language: 'tr-TR', text: notlar }] }] };
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

const KOMUTLAR = { durum, magaza, gorsel, yukle, imza };

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const komut = process.argv[2] || 'durum';
  if (!KOMUTLAR[komut]) { console.error(`bilinmeyen komut: ${komut} (${Object.keys(KOMUTLAR).join(', ')})`); process.exit(2); }
  BELIRTEC = process.env.PLAY_ACCESS_TOKEN || '';
  if (!BELIRTEC) { console.error('PLAY_ACCESS_TOKEN boş (iş akışı Google kimliğiyle üretir)'); process.exit(2); }
  console.log(UYGULA ? "KİP: UYGULA (Play'e yazılır)" : 'KİP: PLAN (hiçbir şey yazılmaz)');
  KOMUTLAR[komut]().catch((e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
