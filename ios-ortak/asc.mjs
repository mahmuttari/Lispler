#!/usr/bin/env node
/*
 * App Store Connect API: küçük uygulamaların (Unitica, Calqora, Ölçü Kutusu) ve Not Defteri'nin App Store işleri.
 * NetcadDevelop › DwgViewer/tools/asc.mjs'ten uyarlandı (JWT, hız sınırı, sayfalı liste aynı).
 *
 *   node ios-ortak/asc.mjs durum [uygulama…]        salt okunur: paket kimliği, uygulama kaydı, sürümler, yapılar, abonelikler
 *   node ios-ortak/asc.mjs paket [uygula]           eksik paket kimliklerini (bundle ID) kaydeder; "uygula" yoksa yalnız plan
 *   node ios-ortak/asc.mjs onkontrol <uygulama>     yüklemeden önce (Linux): anahtar, paket kimliği, uygulama kaydı, AdMob
 *                                                   kimlikleri gerçek mi (Google'ın test kimliğiyle App Store'a yüklenmez)
 *   node ios-ortak/asc.mjs hazirla <uygulama>       yükleme işinde (macOS): takım kimliği ve yeni yapı numarası →
 *                                                   GITHUB_OUTPUT (takim maskelenir, yapi)
 *   node ios-ortak/asc.mjs bekle <uygulama> <yapı>  yüklenen yapının Apple'da işlenmesini bekler (en çok 25 dk)
 *
 * <uygulama>: unitica | calqora | smart-measure | notdefteri. İncelemeye gönderme ve satışa açma bu betikte yoktur; ancak
 * kullanıcının açık onayıyla, ayrı komutla yapılır (docs/ios-yayin.md).
 *
 * Kimlik: ortam değişkenleri ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY (.p8 içeriği), yalnız GitHub Secrets'ta. Betik
 * hiçbirini yazdırmaz. JWT: ES256, 20 dakika (Apple sınırı), audience appstoreconnect-v1.
 * Sınama: ios-ortak/asc.test.mjs (sahte API sunucusu, ASC_API ile).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { admobOku, surumOku } from './kur.mjs';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = process.env.ASC_API || 'https://api.appstoreconnect.apple.com';
const BEKLE_MS = Number(process.env.BEKLE_MS || 60000);

/** Paket kimliği, Apple Developer'daki ad (yalnız ASCII), klasör, App Store abonelikleri */
export const UYGULAMALAR = {
  unitica: { paket: 'com.poyrazworkshop.unitica', ad: 'Unitica', klasor: 'unitica', abonelik: true },
  calqora: { paket: 'com.poyrazworkshop.calqora', ad: 'Calqora', klasor: 'calqora', abonelik: true },
  'smart-measure': { paket: 'com.poyrazworkshop.smartmeasure', ad: 'Olcu Kutusu', klasor: 'smart-measure', abonelik: true },
  notdefteri: { paket: 'com.poyrazworkshop.notdefteri', ad: 'Not Defteri', klasor: 'ios', abonelik: false },
};
/** App Store abonelik ürünleri: her dönem ayrı ürün, tek grupta (uygulamaların config / billing dosyalarıyla aynı) */
export const urunler = (u) => (UYGULAMALAR[u].abonelik ? ['monthly', 'yearly'].map((d) => `${UYGULAMALAR[u].paket}.adfree.${d}`) : []);

/** Mağaza sürümü: Capacitor uygulamalarında Android versionName, Not Defteri'nde ios/project.yml › MARKETING_VERSION */
export function surum(u) {
  if (u === 'notdefteri') {
    const s = /MARKETING_VERSION:\s*"?([\d.]+)"?/.exec(fs.readFileSync(path.join(KOK, 'ios', 'project.yml'), 'utf8'))?.[1];
    if (!s) throw new Error('ios/project.yml: MARKETING_VERSION yok');
    return s;
  }
  return surumOku(UYGULAMALAR[u].klasor);
}

/** Google'ın test yayıncısı mı (ca-app-pub-3940256099942544)? Test kimliğiyle derlenen paket App Store'a yüklenmez. */
export function admobTestMi(u) {
  if (u === 'notdefteri') {
    const yml = fs.readFileSync(path.join(KOK, 'ios', 'project.yml'), 'utf8');
    const rel = yml.slice(yml.indexOf('Release:'));
    return /ADMOB_APP_ID:\s*"?ca-app-pub-3940256099942544/.test(rel) || !/ADMOB_APP_ID/.test(rel);
  }
  const k = admobOku(fs.readFileSync(path.join(KOK, UYGULAMALAR[u].klasor, 'ios', 'admob.properties'), 'utf8'));
  return [k.app, k.banner, k.gecis].some((x) => x.startsWith('ca-app-pub-3940256099942544'));
}

// ---------------------------------------------------------------- JWT ve istek
const b64u = (b) => Buffer.from(b).toString('base64url');
let jwt = '', jwtSon = 0;
/** ES256 imzalı kısa ömürlü anahtar (P1363 imza biçimi: JWT'nin istediği r‖s) */
export function anahtar(simdi = Math.floor(Date.now() / 1000)) {
  if (jwt && simdi < jwtSon - 60) return jwt;
  const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY } = process.env;
  const bas = b64u(JSON.stringify({ alg: 'ES256', kid: ASC_KEY_ID.trim(), typ: 'JWT' }));
  const yuk = b64u(JSON.stringify({ iss: ASC_ISSUER_ID.trim(), iat: simdi, exp: simdi + 1200, aud: 'appstoreconnect-v1' }));
  const ham = ASC_PRIVATE_KEY.replace(/\\n/g, '\n');
  const pem = ham.includes('BEGIN') ? ham : `-----BEGIN PRIVATE KEY-----\n${ham.trim()}\n-----END PRIVATE KEY-----`;
  const imza = crypto.sign('sha256', Buffer.from(`${bas}.${yuk}`), { key: pem, dsaEncoding: 'ieee-p1363' });
  jwt = `${bas}.${yuk}.${b64u(imza)}`; jwtSon = simdi + 1200;
  return jwt;
}

// Apple kısa süreli patlamayı da 429 ile keser: istekler ortak sıradan 350 ms arayla çıkar; 429'da Retry-After beklenip aynı
// istek yinelenir. 5xx yalnız GET'te yinelenir (yazma sunucuda işlenmiş olabilir).
const ARALIK = Number(process.env.ASC_ARALIK_MS ?? 350);
let sonrakiSira = 0;
const uyu = (ms) => new Promise((r) => setTimeout(r, ms));
async function siraBekle() {
  const simdi = Date.now(), t = Math.max(simdi, sonrakiSira);
  sonrakiSira = t + ARALIK;
  if (t > simdi) await uyu(t - simdi);
}

/** Hata iletisinde yalnız durum kodu ve Apple'ın hata metni yazılır (başlıklar ve anahtar yazılmaz). */
export async function api(yontem, yol, govde, deneme = 0) {
  await siraBekle();
  const r = await fetch(yol.startsWith('http') ? yol : API + yol, {
    method: yontem,
    headers: { Authorization: `Bearer ${anahtar()}`, ...(govde ? { 'Content-Type': 'application/json' } : {}) },
    body: govde ? JSON.stringify(govde) : undefined,
  });
  if ((r.status === 429 || (r.status >= 500 && yontem === 'GET')) && deneme < 6) {
    const ra = Number(r.headers.get('retry-after'));
    const bekle = ra > 0 ? ra * 1000 : Math.min(120000, 20000 * (deneme + 1)) * (BEKLE_MS / 60000);
    console.log(`  (${r.status}: ${Math.round(bekle / 1000)} sn bekleniyor, deneme ${deneme + 1})`);
    await uyu(bekle);
    return api(yontem, yol, govde, deneme + 1);
  }
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = (j.errors || []).map((x) => `${x.code || ''} ${x.title || ''}: ${x.detail || ''}`).join(' | ');
    const hata = new Error(`${yontem} ${yol.replace(API, '')} → ${r.status} ${e}`);
    hata.durum = r.status;
    throw hata;
  }
  return j;
}
const get = (yol) => api('GET', yol);
async function hepsi(yol) {
  const out = []; let url = yol;
  while (url) { const j = await get(url); out.push(...(j.data || [])); url = j.links?.next || null; }
  return out;
}
const kodla = encodeURIComponent;

async function paketBul(u) {
  const p = UYGULAMALAR[u].paket;
  return (await hepsi(`/v1/bundleIds?filter[identifier]=${kodla(p)}&limit=20`)).find((x) => x.attributes.identifier === p) || null;
}
async function uygulamaBul(u) {
  const p = UYGULAMALAR[u].paket;
  return (await hepsi(`/v1/apps?filter[bundleId]=${kodla(p)}&limit=5`)).find((x) => x.attributes.bundleId === p) || null;
}
async function yapilar(appId, s) {
  return hepsi(`/v1/builds?filter[app]=${appId}&filter[preReleaseVersion.version]=${kodla(s)}&limit=200`);
}

// ---------------------------------------------------------------- komutlar
function uygulamaAdi(u) {
  if (!UYGULAMALAR[u]) throw new Error(`bilinmeyen uygulama "${u}" (${Object.keys(UYGULAMALAR).join(' | ')})`);
  return u;
}

export async function durum(liste = Object.keys(UYGULAMALAR)) {
  const sonuc = {};
  for (const u of liste.map(uygulamaAdi)) {
    const d = { paket: UYGULAMALAR[u].paket, surum: surum(u), admobTest: admobTestMi(u) };
    d.paketKayitli = !!(await paketBul(u));
    const app = await uygulamaBul(u);
    d.uygulamaKaydi = app ? app.attributes.name : null;
    if (app) {
      const v = await hepsi(`/v1/apps/${app.id}/appStoreVersions?limit=10`);
      d.surumler = v.map((x) => `${x.attributes.versionString} ${x.attributes.appStoreState || x.attributes.appVersionState || ''}`.trim());
      const y = await yapilar(app.id, d.surum);
      d.yapilar = y.map((x) => `${x.attributes.version} ${x.attributes.processingState}`);
      if (UYGULAMALAR[u].abonelik) {
        const gruplar = await hepsi(`/v1/apps/${app.id}/subscriptionGroups?limit=10`);
        const var_ = new Set();
        for (const g of gruplar) for (const s of await hepsi(`/v1/subscriptionGroups/${g.id}/subscriptions?limit=50`)) var_.add(s.attributes.productId);
        d.abonelikler = Object.fromEntries(urunler(u).map((p) => [p, var_.has(p)]));
      }
    }
    sonuc[u] = d;
    console.log(`\n${u} (${d.paket}, sürüm ${d.surum})`);
    console.log(`  paket kimliği: ${d.paketKayitli ? 'kayıtlı' : 'YOK → node ios-ortak/asc.mjs paket uygula'}`);
    console.log(`  uygulama kaydı: ${d.uygulamaKaydi ? `"${d.uygulamaKaydi}"` : 'YOK → App Store Connect › Apps › + › New App (docs/ios-yayin.md §1 adım 3)'}`);
    console.log(`  AdMob kimlikleri: ${d.admobTest ? "Google'ın TEST kimlikleri → App Store'a yüklenmez (docs/ios-yayin.md §1 adım 4)" : 'gerçek'}`);
    if (d.surumler) console.log(`  App Store sürümleri: ${d.surumler.join(', ') || 'yok'}`);
    if (d.yapilar) console.log(`  ${d.surum} yapıları: ${d.yapilar.join(', ') || 'yok'}`);
    if (d.abonelikler) console.log(`  abonelikler: ${Object.entries(d.abonelikler).map(([p, v]) => `${p} ${v ? 'var' : 'YOK'}`).join(', ')}`);
  }
  return sonuc;
}

/** Eksik paket kimliklerini kaydeder (Apple Developer › Identifiers). Uygulama içi satın alma yeteneği iOS'ta kendiliğinden açıktır. */
export async function paket(uygula = false) {
  const yapilan = [];
  for (const u of Object.keys(UYGULAMALAR)) {
    if (await paketBul(u)) { console.log(`  ${UYGULAMALAR[u].paket}: kayıtlı`); continue; }
    const govde = { data: { type: 'bundleIds', attributes: { identifier: UYGULAMALAR[u].paket, name: UYGULAMALAR[u].ad, platform: 'IOS' } } };
    if (!uygula) { console.log(`  [plan] ${UYGULAMALAR[u].paket} ("${UYGULAMALAR[u].ad}") kaydedilecek`); yapilan.push(u); continue; }
    await api('POST', '/v1/bundleIds', govde);
    console.log(`  [tamam] ${UYGULAMALAR[u].paket} kaydedildi`);
    yapilan.push(u);
  }
  return yapilan;
}

/** Yükleme öncesi: hata varsa macOS işi hiç başlamaz */
export async function onkontrol(u) {
  uygulamaAdi(u);
  const sorun = [];
  if (admobTestMi(u)) sorun.push("AdMob kimlikleri Google'ın test kimlikleri: AdMob'da iOS uygulaması ve reklam birimleri açılıp ios/admob.properties'e yazılmalı");
  if (!(await paketBul(u))) sorun.push(`paket kimliği ${UYGULAMALAR[u].paket} kayıtlı değil: node ios-ortak/asc.mjs paket uygula`);
  if (!(await uygulamaBul(u))) sorun.push(`App Store Connect'te ${UYGULAMALAR[u].paket} için uygulama kaydı yok (docs/ios-yayin.md §1 adım 3)`);
  if (sorun.length) throw new Error(`${u} yüklenemez:\n  - ${sorun.join('\n  - ')}`);
  console.log(`${u}: yüklemeye hazır (sürüm ${surum(u)})`);
}

/** GitHub Actions adım çıktısı */
function cikti(ad, deger) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${ad}=${deger}\n`);
}

/** Takım kimliği (paket kimliğinin seedId'si) ve bu sürümün yeni yapı numarası (en büyük + 1) */
export async function hazirla(u) {
  uygulamaAdi(u);
  const p = await paketBul(u);
  const app = await uygulamaBul(u);
  if (!p || !app) throw new Error(`${u}: paket kimliği ya da uygulama kaydı yok (önce onkontrol)`);
  const takim = p.attributes.seedId;
  if (process.env.GITHUB_ACTIONS) console.log(`::add-mask::${takim}`);
  const s = surum(u);
  const yapi = Math.max(0, ...(await yapilar(app.id, s)).map((x) => parseInt(x.attributes.version, 10) || 0)) + 1;
  cikti('takim', takim); cikti('yapi', yapi); cikti('surum', s);
  console.log(`${u}: sürüm ${s}, yapı ${yapi}`);
  return { takim, yapi, surum: s };
}

/** Yüklenen yapının işlenmesini bekler */
export async function bekle(u, yapi) {
  uygulamaAdi(u);
  if (!yapi) throw new Error('kullanım: asc.mjs bekle <uygulama> <yapı>');
  const app = await uygulamaBul(u), s = surum(u);
  let d = 'GÖRÜNMÜYOR';
  for (let dk = 0; dk <= 25; dk++) {
    const y = (await hepsi(`/v1/builds?filter[app]=${app.id}&filter[preReleaseVersion.version]=${kodla(s)}&filter[version]=${kodla(yapi)}&limit=5`))[0];
    d = y?.attributes?.processingState || 'GÖRÜNMÜYOR';
    if (dk % 5 === 0 || d !== 'PROCESSING') console.log(`  ${dk}. dk: ${u} ${s} (${yapi}) → ${d}`);
    if (['VALID', 'INVALID', 'FAILED'].includes(d)) break;
    if (d === 'GÖRÜNMÜYOR' && dk >= 5) throw new Error(`${u} ${s} (${yapi}) 5 dakikadır görünmüyor: yüklenmemiş ya da numara yanlış`);
    await uyu(BEKLE_MS);
  }
  if (d !== 'VALID') throw new Error(`${u} ${s} (${yapi}) hazır değil: ${d}`);
  console.log(`${u} ${s} (${yapi}) işlendi; TestFlight'ta`);
  return d;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [komut = 'durum', ...arg] = process.argv.slice(2);
  const eksik = ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_PRIVATE_KEY'].filter((v) => !process.env[v]);
  const is = {
    durum: () => durum(arg.length ? arg : undefined),
    paket: () => paket(arg.includes('uygula')),
    onkontrol: () => onkontrol(arg[0]),
    hazirla: () => hazirla(arg[0]),
    bekle: () => bekle(arg[0], arg[1]),
  }[komut];
  if (!is) { console.error('kullanım: asc.mjs durum [uygulama…] | paket [uygula] | onkontrol <u> | hazirla <u> | bekle <u> <yapı>'); process.exit(2); }
  if (eksik.length) { console.error(`HATA: GitHub Secrets'ta eksik: ${eksik.join(', ')} (docs/ios-yayin.md §1 adım 1)`); process.exit(2); }
  is().catch((e) => { console.error(`HATA: ${e.message}`); process.exit(1); });
}
