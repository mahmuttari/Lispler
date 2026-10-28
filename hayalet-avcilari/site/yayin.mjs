// Hayalet Avcıları tanıtım, gizlilik ve hesap silme sayfalarını Firebase Hosting'e (hayalet-avcilari.web.app) yayınlar.
// Firebase CLI kullanılmaz; Hosting REST API (v1beta1): sürüm aç → dosya özetleri → eksikleri yükle → kapat → yayınla.
// Kullanım:
//   node hayalet-avcilari/site/yayin.mjs plan      dosyaları ve özetlerini yazar (kimlik gerekmez)
//   node hayalet-avcilari/site/yayin.mjs durum     yayındaki siteyi depodakiyle karşılaştırır; hiçbir şey yazmaz
//   node hayalet-avcilari/site/yayin.mjs yayinla   yayınlar, sonra sayfaları geri okuyup denetler
// durum ve yayinla için TOKEN ortam değişkeninde OAuth erişim belirteci olmalı (hayalet-site-yayini.yml verir).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PROJE = 'hayalet-avcilari';
export const SITE = 'hayalet-avcilari';
// HOSTING_API, SITE_ADRES ve BEKLE_MS yalnız test içindir (site.test.mjs sahte sunucuya yönlendirir)
export const ADRES = process.env.SITE_ADRES || `https://${SITE}.web.app`;
const API = process.env.HOSTING_API || 'https://firebasehosting.googleapis.com/v1beta1';
const BEKLE = Number(process.env.BEKLE_MS ?? 10000);

// Sitede ne var: sayfalar app/hayalet-avcilari/'dan, ortak stil app/legal.css'ten (sayfalardaki "../legal.css" kökte
// "/legal.css"e çözülür), app-ads.txt AdMob yayıncı kimliğinden (AndroidManifest.xml tek kaynak).
export function dosyalar() {
  const d = new Map();
  const klasor = path.join(KOK, 'app', 'hayalet-avcilari');
  for (const ad of fs.readdirSync(klasor).sort()) d.set('/' + ad, fs.readFileSync(path.join(klasor, ad)));
  d.set('/legal.css', fs.readFileSync(path.join(KOK, 'app', 'legal.css')));
  const manifest = fs.readFileSync(path.join(KOK, 'hayalet-avcilari', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  const pub = /ca-app-pub-(\d{16})~\d+/.exec(manifest)?.[1];
  if (!pub) throw new Error('AndroidManifest.xml: AdMob uygulama kimliği bulunamadı');
  // AdMob'un yetkili satıcı satırı; f08c47fec0942fa0 Google'ın TAG kimliğidir (AdMob › Uygulamalar › app-ads.txt)
  d.set('/app-ads.txt', Buffer.from(`google.com, pub-${pub}, DIRECT, f08c47fec0942fa0\n`));
  return d;
}

// Hosting her dosyayı gzip'li hâlinin SHA-256 özetiyle tanır
export function ozetle(d) {
  const o = new Map();
  for (const [yol, icerik] of d) {
    const gz = zlib.gzipSync(icerik, { level: 9 });
    o.set(yol, { gz, ozet: crypto.createHash('sha256').update(gz).digest('hex') });
  }
  return o;
}

// Sürüm ayarı: HTML kısa önbellek (metin değişince hemen görünsün), diğerleri bir gün; sayfalar başka sitede çerçevelenmez
export const AYAR = {
  headers: [
    { glob: '**/*.html', headers: { 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' } },
    { glob: '**/*.@(css|png|txt)', headers: { 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } },
  ],
};

async function istek(yol, { yontem = 'GET', govde, tur = 'application/json', tam = false } = {}) {
  const basliklar = { Authorization: `Bearer ${process.env.TOKEN}`, 'content-type': tur };
  // Kota ve faturalandırma hizmet hesabının projesine değil oyunun projesine yazılsın (serviceUsageConsumer rolü ister);
  // rol yoksa başlıksız denenir (o zaman Hosting API'sinin hizmet hesabının projesinde de açık olması gerekir)
  if (istek.kotaProjesi !== false) basliklar['x-goog-user-project'] = PROJE;
  const r = await fetch(tam ? yol : API + yol, { method: yontem, headers: basliklar, body: govde });
  const metin = await r.text();
  if (r.status === 403 && istek.kotaProjesi !== false && /USER_PROJECT_DENIED|serviceusage\.services\.use/.test(metin)) {
    console.log(`  (x-goog-user-project reddedildi; başlıksız deneniyor — ${PROJE} projesinde roles/serviceusage.serviceUsageConsumer yok)`);
    istek.kotaProjesi = false;
    return istek(yol, { yontem, govde, tur, tam });
  }
  if (!r.ok) throw new Error(`${yontem} ${yol} → ${r.status}: ${metin.slice(0, 600)}`);
  return metin ? JSON.parse(metin) : {};
}

// Yeni verilen IAM rolü birkaç dakikada yayılır: 401/403'te 30 sn arayla 8 kez denenir
async function sabirla(is) {
  for (let d = 1; ; d++) {
    try { return await is(); } catch (e) {
      if (d >= 8 || !/→ (401|403):/.test(e.message)) throw e;
      console.log(`  yetki bekleniyor (deneme ${d}): ${e.message.slice(0, 200)}`);
      await new Promise((r) => setTimeout(r, BEKLE * 3));
    }
  }
}

// Yayındaki sayfalar herkese açık adresten okunur ve depodakiyle bayt bayt karşılaştırılır
export async function karsilastir(d) {
  let fark = 0;
  for (const [yol, icerik] of d) {
    const r = await fetch(ADRES + yol, { cache: 'no-store' });
    const yayinda = Buffer.from(await r.arrayBuffer());
    const ayni = r.ok && yayinda.equals(icerik);
    if (!ayni) fark++;
    console.log(`  ${ayni ? '=' : '≠'} ${yol} (${r.status}, ${yayinda.length} / ${icerik.length} bayt)`);
  }
  console.log(fark ? `FARKLI: ${fark} dosya yayındakinden farklı ya da yok` : `AYNI: ${ADRES} depodakiyle aynı`);
  return fark === 0;
}

export async function durum(d) {
  const site = await sabirla(() => istek(`/projects/${PROJE}/sites/${SITE}`));
  console.log(`Site: ${site.name} · ${site.defaultUrl || ADRES} · tür ${site.type || '—'}`);
  const { releases = [] } = await istek(`/sites/${SITE}/channels/live/releases?pageSize=1`);
  const son = releases[0];
  console.log(son ? `Son yayın: ${son.releaseTime} · ${son.version?.name} · ${son.version?.fileCount ?? '?'} dosya` : 'Son yayın: yok (site hiç yayınlanmamış)');
  return karsilastir(d);
}

export async function yayinla(d) {
  const o = ozetle(d);
  const surum = await sabirla(() => istek(`/sites/${SITE}/versions`, { yontem: 'POST', govde: JSON.stringify({ config: AYAR }) }));
  console.log(`Sürüm: ${surum.name}`);
  const dosya = Object.fromEntries([...o].map(([yol, { ozet }]) => [yol, ozet]));
  const { uploadRequiredHashes = [], uploadUrl } = await istek(`/${surum.name}:populateFiles`, { yontem: 'POST', govde: JSON.stringify({ files: dosya }) });
  for (const [yol, { gz, ozet }] of o) {
    if (!uploadRequiredHashes.includes(ozet)) { console.log(`  · ${yol} (zaten sunucuda)`); continue; }
    await istek(`${uploadUrl}/${ozet}`, { yontem: 'POST', govde: gz, tur: 'application/octet-stream', tam: true });
    console.log(`  ↑ ${yol} (${gz.length} bayt gzip)`);
  }
  await istek(`/${surum.name}?update_mask=status`, { yontem: 'PATCH', govde: JSON.stringify({ status: 'FINALIZED' }) });
  const yayin = await istek(`/sites/${SITE}/releases?versionName=${encodeURIComponent(surum.name)}`, { yontem: 'POST', govde: JSON.stringify({ message: 'GitHub: hayalet-site-yayini' }) });
  console.log(`Yayın: ${yayin.name} · ${yayin.releaseTime}`);
  // CDN önbelleği yeni sürüme birkaç saniyede geçer
  for (let d2 = 1; d2 <= 6; d2++) {
    await new Promise((r) => setTimeout(r, BEKLE));
    if (await karsilastir(d)) return true;
  }
  return false;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const komut = process.argv[2] || 'plan';
  const d = dosyalar();
  if (komut === 'plan') {
    for (const [yol, { gz, ozet }] of ozetle(d)) console.log(`${ozet.slice(0, 16)}  ${String(d.get(yol).length).padStart(6)} B  ${yol}  (${gz.length} B gzip)`);
  } else if (komut === 'durum' || komut === 'yayinla') {
    if (!process.env.TOKEN) { console.error('TOKEN yok: durum ve yayinla yalnız hayalet-site-yayini.yml içinde çalışır'); process.exit(2); }
    const tamam = komut === 'durum' ? await durum(d) : await yayinla(d);
    // durum farkı hata saymaz (yayın öncesi beklenen hâl); yayinla sonrası fark hatadır
    if (komut === 'yayinla' && !tamam) process.exit(3);
  } else {
    console.error(`geçersiz komut: ${komut} (plan | durum | yayinla)`); process.exit(1);
  }
}
