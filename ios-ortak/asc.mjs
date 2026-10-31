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
 *   node ios-ortak/asc.mjs metin <uygulama> [uygula]     App Store metinleri (ios-ortak/app-store.mjs): ad, alt başlık,
 *                                                   gizlilik adresi, kategori, içerik hakları; sürüm (numara, telif, elle
 *                                                   yayın), açıklama, anahtar sözcükler, tanıtım metni, destek adresi
 *   node ios-ortak/asc.mjs yas <uygulama> [uygula]       yaş derecesi anketi: reklam var, öbür bütün sorular Yok / Hayır (4+)
 *   node ios-ortak/asc.mjs abonelik <uygulama> [uygula]  reklamsız abonelik: grup, aylık ve yıllık ürün, adlar, inceleme notu,
 *                                                   ülke erişimi (Çin anakarası hariç), fiyat (ABD 0,99 / 9,99 $, öbür
 *                                                   ülkeler Apple'ın eşdeğeri; var olan fiyata dokunulmaz)
 *   "uygula" yoksa metin / yas / abonelik yalnız plan yazdırır; hiçbir şey değişmez.
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
import { metinler, ayar } from './app-store.mjs';

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

// ---------------------------------------------------------------- yazan komutlar (planla ya da uygula)
const TELIF = '2026 Mahmut Tarı';   // Apple'da satıcı bireysel hesap sahibidir (NetcadDevelop'taki uygulamayla aynı)
const farkli = (mevcut, hedef) => Object.keys(hedef).filter((k) => (mevcut[k] ?? '') !== (hedef[k] ?? ''));
const DUZENLENIR = /PREPARE_FOR_SUBMISSION|DEVELOPER_REJECTED|METADATA_REJECTED|REJECTED|INVALID_BINARY/;
let plan = [];
/** "uygula" yoksa yalnız plana yazar */
async function yaz(uygula, yontem, yol, govde, aciklama) {
  plan.push(aciklama);
  if (!uygula) { console.log(`  [plan] ${aciklama}`); return null; }
  const r = await api(yontem, yol, govde);
  console.log(`  [tamam] ${aciklama}`);
  return r;
}
function bitir(uygula) {
  console.log(`\n${uygula ? 'YAZILDI' : 'PLAN'}: ${plan.length} işlem${uygula ? '' : ' (uygulamak için komutun sonuna "uygula")'}`);
  const p = plan; plan = []; return p;
}
async function kayitli(u) {
  uygulamaAdi(u);
  if (!UYGULAMALAR[u].abonelik) throw new Error(`${u}: bu komut yalnız Unitica, Calqora ve Ölçü Kutusu için (Not Defteri ayrı)`);
  const app = await uygulamaBul(u);
  if (!app) throw new Error(`${u}: App Store Connect'te uygulama kaydı yok (docs/ios-yayin.md §1 adım 3)`);
  return app;
}
async function duzenlenenBilgi(app) {
  const infos = await hepsi(`/v1/apps/${app.id}/appInfos?include=primaryCategory,secondaryCategory`);
  return infos.find((i) => !/READY_FOR_(SALE|DISTRIBUTION)/.test(i.attributes.state || i.attributes.appStoreState || '')) || infos[0];
}

/** App Store metinleri: uygulama bilgisi (dil başına), kategori, içerik hakları; sürüm ve sürüm metinleri */
export async function metin(u, uygula = false) {
  const app = await kayitli(u), M = metinler(u), A = ayar(u), s = surum(u);
  console.log(`${u}: ${Object.keys(M).length} dil, sürüm ${s} · ${uygula ? 'UYGULA' : 'PLAN'}`);
  if (app.attributes.contentRightsDeclaration !== 'DOES_NOT_USE_THIRD_PARTY_CONTENT') {
    await yaz(uygula, 'PATCH', `/v1/apps/${app.id}`, { data: { type: 'apps', id: app.id, attributes: { contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT' } } },
      'içerik hakları: üçüncü taraf içerik yok');
  }
  const info = await duzenlenenBilgi(app);
  if (!info) throw new Error('uygulama bilgisi (appInfo) yok');
  const [k1, k2] = A.kategori;
  const pc = info.relationships?.primaryCategory?.data?.id, sc = info.relationships?.secondaryCategory?.data?.id;
  if (pc !== k1 || (sc || null) !== (k2 || null)) {
    await yaz(uygula, 'PATCH', `/v1/appInfos/${info.id}`, { data: { type: 'appInfos', id: info.id, relationships: {
      primaryCategory: { data: { type: 'appCategories', id: k1 } }, secondaryCategory: { data: k2 ? { type: 'appCategories', id: k2 } : null } } } },
      `kategori: ${pc || '—'} / ${sc || '—'} → ${k1} / ${k2 || '—'}`);
  }
  const il = Object.fromEntries((await hepsi(`/v1/appInfos/${info.id}/appInfoLocalizations`)).map((x) => [x.attributes.locale, x]));
  for (const [y, m] of Object.entries(M)) {
    const hedef = { name: m.ad, subtitle: m.altBaslik, privacyPolicyUrl: m.gizlilik }, v = il[y];
    if (!v) {
      await yaz(uygula, 'POST', '/v1/appInfoLocalizations', { data: { type: 'appInfoLocalizations', attributes: { locale: y, ...hedef },
        relationships: { appInfo: { data: { type: 'appInfos', id: info.id } } } } }, `uygulama bilgisi ${y}: "${m.ad}" · "${m.altBaslik}"`);
    } else {
      const f = farkli(v.attributes, hedef);
      if (f.length) await yaz(uygula, 'PATCH', `/v1/appInfoLocalizations/${v.id}`, { data: { type: 'appInfoLocalizations', id: v.id, attributes: hedef } }, `uygulama bilgisi ${y} (${f.join(', ')})`);
    }
  }
  const surumler = await hepsi(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS`);
  let v = surumler.find((x) => DUZENLENIR.test(x.attributes.appStoreState || x.attributes.appVersionState || ''));
  if (!v) {
    if (surumler.some((x) => x.attributes.versionString === s)) throw new Error(`düzenlenebilir iOS sürümü yok (${s} incelemede ya da yayında)`);
    const r = await yaz(uygula, 'POST', '/v1/appStoreVersions', { data: { type: 'appStoreVersions', attributes: { platform: 'IOS', versionString: s, copyright: TELIF, releaseType: 'MANUAL' },
      relationships: { app: { data: { type: 'apps', id: app.id } } } } }, `yeni App Store sürümü ${s}`);
    if (!r) { for (const y of Object.keys(M)) await yaz(false, 'POST', '', null, `sürüm metni ${y}`); return bitir(uygula); }
    v = r.data;
  }
  const hedefS = { versionString: s, copyright: TELIF, releaseType: 'MANUAL' };
  const fS = farkli(v.attributes, hedefS);
  if (fS.length) await yaz(uygula, 'PATCH', `/v1/appStoreVersions/${v.id}`, { data: { type: 'appStoreVersions', id: v.id, attributes: hedefS } }, `sürüm (${fS.join(', ')})`);
  const vl = Object.fromEntries((await hepsi(`/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations`)).map((x) => [x.attributes.locale, x]));
  for (const [y, m] of Object.entries(M)) {
    const hedef = { description: m.aciklama, keywords: m.anahtar, promotionalText: m.tanitim, supportUrl: m.destek }, x = vl[y];
    if (!x) {
      await yaz(uygula, 'POST', '/v1/appStoreVersionLocalizations', { data: { type: 'appStoreVersionLocalizations', attributes: { locale: y, ...hedef },
        relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: v.id } } } } }, `sürüm metni ${y}: açıklama ${[...m.aciklama].length} karakter`);
    } else {
      const f = farkli(x.attributes, hedef);
      if (f.length) await yaz(uygula, 'PATCH', `/v1/appStoreVersionLocalizations/${x.id}`, { data: { type: 'appStoreVersionLocalizations', id: x.id, attributes: hedef } }, `sürüm metni ${y} (${f.join(', ')})`);
    }
  }
  return bitir(uygula);
}

// Yaş derecesi anketi (Apple'ın 2025 sonrası soruları). Uygulamalarda reklam var; başka hiçbir içerik yok → 4+.
export const YAS_SIKLIK = ['alcoholTobaccoOrDrugUseOrReferences', 'contests', 'gamblingSimulated', 'gunsOrOtherWeapons',
  'horrorOrFearThemes', 'matureOrSuggestiveThemes', 'medicalOrTreatmentInformation', 'profanityOrCrudeHumor',
  'sexualContentGraphicAndNudity', 'sexualContentOrNudity', 'violenceCartoonOrFantasy', 'violenceRealistic',
  'violenceRealisticProlongedGraphicOrSadistic'];
export const YAS_EVETHAYIR = { advertising: true, ageAssurance: false, gambling: false, healthOrWellnessTopics: false, lootBox: false,
  messagingAndChat: false, parentalControls: false, socialMedia: false, socialMediaAgeRestricted: false, unrestrictedWebAccess: false,
  userGeneratedContent: false };
const YAS_DOKUNMA = new Set(['kidsAgeBand', 'ageRatingOverride', 'ageRatingOverrideV2', 'koreaAgeRatingOverride', 'seventeenPlus',
  'developerAgeRatingInfoUrl', 'gracRatingClassificationNumber']);

export async function yas(u, uygula = false) {
  const app = await kayitli(u);
  const info = await duzenlenenBilgi(app);
  const d = (await get(`/v1/appInfos/${info.id}/ageRatingDeclaration`)).data;
  const a = d.attributes || {};
  const hedef = { ...Object.fromEntries(YAS_SIKLIK.map((k) => [k, 'NONE'])), ...YAS_EVETHAYIR };
  const bilinmeyen = Object.keys(a).filter((k) => !(k in hedef) && !YAS_DOKUNMA.has(k));
  if (bilinmeyen.length) console.log(`  not: listede olmayan sorular (dokunulmadı): ${bilinmeyen.join(', ')}`);
  const fark = Object.keys(hedef).filter((k) => a[k] !== hedef[k]);
  if (fark.length) {
    await yaz(uygula, 'PATCH', `/v1/ageRatingDeclarations/${d.id}`, { data: { type: 'ageRatingDeclarations', id: d.id, attributes: hedef } },
      `yaş derecesi: ${fark.length} soru (reklam: Evet; öbürleri Yok / Hayır)`);
  } else console.log('  yaş derecesi: değişiklik yok');
  return bitir(uygula);
}

/** Abonelik grubu ve ürün adları, dil başına (ad ≤30, açıklama ≤45) */
export const ABONELIK_METIN = {
  tr: ['Reklamsız', 'Reklamsız – aylık', 'Reklamsız – yıllık', 'Bütün reklamları kaldırır'],
  'en-US': ['Ad-free', 'Ad-free – monthly', 'Ad-free – yearly', 'Removes all ads'],
  'de-DE': ['Werbefrei', 'Werbefrei – monatlich', 'Werbefrei – jährlich', 'Entfernt alle Werbung'],
  'fr-FR': ['Sans publicité', 'Sans pub – mensuel', 'Sans pub – annuel', 'Supprime toutes les publicités'],
  'es-ES': ['Sin anuncios', 'Sin anuncios – mensual', 'Sin anuncios – anual', 'Quita todos los anuncios'],
  it: ['Senza pubblicità', 'Senza pubblicità – mensile', 'Senza pubblicità – annuale', 'Rimuove tutta la pubblicità'],
  'pt-BR': ['Sem anúncios', 'Sem anúncios – mensal', 'Sem anúncios – anual', 'Remove todos os anúncios'],
  ru: ['Без рекламы', 'Без рекламы – на месяц', 'Без рекламы – на год', 'Убирает всю рекламу'],
  'ar-SA': ['بلا إعلانات', 'بلا إعلانات – شهري', 'بلا إعلانات – سنوي', 'يزيل كل الإعلانات'],
  ja: ['広告なし', '広告なし（月額）', '広告なし（年額）', 'すべての広告を非表示にします'],
  ko: ['광고 없음', '광고 없음 – 월간', '광고 없음 – 연간', '모든 광고를 제거합니다'],
};
/** Fiyat: Play'deki gibi (uygulamaların magaza/fiyatlandirma.md'si); deneme yok */
export const FIYAT = { monthly: { donem: 'ONE_MONTH', usd: 0.99 }, yearly: { donem: 'ONE_YEAR', usd: 9.99 } };
const HARIC = new Set(['CHN']);

export async function abonelik(u, uygula = false) {
  const app = await kayitli(u), A = ayar(u), diller = Object.keys(metinler(u));
  console.log(`${u}: reklamsız abonelik · ${uygula ? 'UYGULA' : 'PLAN'}`);
  let [grup] = await hepsi(`/v1/apps/${app.id}/subscriptionGroups`);
  if (!grup) {
    const r = await yaz(uygula, 'POST', '/v1/subscriptionGroups', { data: { type: 'subscriptionGroups', attributes: { referenceName: 'Reklamsız' },
      relationships: { app: { data: { type: 'apps', id: app.id } } } } }, 'abonelik grubu "Reklamsız"');
    if (!r) {
      for (const p of ['monthly', 'yearly']) await yaz(false, 'POST', '', null, `abonelik ${UYGULAMALAR[u].paket}.adfree.${p} (${FIYAT[p].usd} $, adlar ${diller.length} dilde, Çin hariç bütün ülkeler)`);
      return bitir(uygula);
    }
    grup = r.data;
  }
  const gl = new Set((await hepsi(`/v1/subscriptionGroups/${grup.id}/subscriptionGroupLocalizations`)).map((x) => x.attributes.locale));
  for (const y of diller) {
    if (!gl.has(y)) await yaz(uygula, 'POST', '/v1/subscriptionGroupLocalizations', { data: { type: 'subscriptionGroupLocalizations',
      attributes: { locale: y, name: ABONELIK_METIN[y][0] }, relationships: { subscriptionGroup: { data: { type: 'subscriptionGroups', id: grup.id } } } } }, `grup adı ${y}`);
  }
  const var_ = Object.fromEntries((await hepsi(`/v1/subscriptionGroups/${grup.id}/subscriptions`)).map((x) => [x.attributes.productId, x]));
  const ulkeler = (await hepsi('/v1/territories?limit=200')).map((t) => t.id);
  for (const p of ['monthly', 'yearly']) {
    const pid = `${UYGULAMALAR[u].paket}.adfree.${p}`, F = FIYAT[p], i = p === 'monthly' ? 1 : 2;
    let s = var_[pid];
    console.log(`\n${pid}`);
    if (!s) {
      const r = await yaz(uygula, 'POST', '/v1/subscriptions', { data: { type: 'subscriptions', attributes: { name: `Ad-free ${p}`, productId: pid,
        subscriptionPeriod: F.donem, groupLevel: 1, reviewNote: A.incelemeNotu, familySharable: false },
        relationships: { group: { data: { type: 'subscriptionGroups', id: grup.id } } } } }, `abonelik ${pid} (${F.donem})`);
      if (!r) { await yaz(false, 'POST', '', null, `${pid}: adlar ${diller.length} dilde, Çin hariç ${ulkeler.length - 1} ülke, ABD ${F.usd} $ ve eşdeğerleri`); continue; }
      s = r.data;
    } else if (s.attributes.reviewNote !== A.incelemeNotu) {
      await yaz(uygula, 'PATCH', `/v1/subscriptions/${s.id}`, { data: { type: 'subscriptions', id: s.id, attributes: { reviewNote: A.incelemeNotu } } }, 'inceleme notu');
    }
    const rel = { subscription: { data: { type: 'subscriptions', id: s.id } } };
    const sl = Object.fromEntries((await hepsi(`/v1/subscriptions/${s.id}/subscriptionLocalizations`)).map((x) => [x.attributes.locale, x]));
    for (const y of diller) {
      const name = ABONELIK_METIN[y][i], description = ABONELIK_METIN[y][3], v = sl[y];
      if (!v) await yaz(uygula, 'POST', '/v1/subscriptionLocalizations', { data: { type: 'subscriptionLocalizations', attributes: { locale: y, name, description }, relationships: rel } }, `ad ${y} "${name}"`);
      else if (v.attributes.name !== name || v.attributes.description !== description) {
        await yaz(uygula, 'PATCH', `/v1/subscriptionLocalizations/${v.id}`, { data: { type: 'subscriptionLocalizations', id: v.id, attributes: { name, description } } }, `ad ${y} güncelle`);
      }
    }
    let erisim = null;
    try {
      const av = await get(`/v1/subscriptions/${s.id}/subscriptionAvailability`);
      if (av?.data) erisim = new Set((await hepsi(`/v1/subscriptionAvailabilities/${av.data.id}/availableTerritories?limit=200`)).map((t) => t.id));
    } catch { /* henüz yok */ }
    const satis = ulkeler.filter((t) => !HARIC.has(t));
    if (!erisim || !satis.every((t) => erisim.has(t)) || [...HARIC].some((t) => erisim.has(t))) {
      await yaz(uygula, 'POST', '/v1/subscriptionAvailabilities', { data: { type: 'subscriptionAvailabilities', attributes: { availableInNewTerritories: true },
        relationships: { ...rel, availableTerritories: { data: satis.map((id) => ({ type: 'territories', id })) } } } }, `ülke erişimi: ${satis.length} ülke (Çin anakarası hariç)`);
    }
    // Fiyat bütün ülkelere girilir (Apple fiyatsız ülkeyi eksik bilgi sayar); var olan fiyata dokunulmaz
    const fiyatli = new Set((await hepsi(`/v1/subscriptions/${s.id}/prices?include=territory&limit=200`)).map((f) => f.relationships?.territory?.data?.id).filter(Boolean));
    const eksik = ulkeler.filter((t) => !fiyatli.has(t));
    if (eksik.length) {
      const pp = await hepsi(`/v1/subscriptions/${s.id}/pricePoints?filter[territory]=USA&limit=200`);
      const abd = pp.find((x) => Number(x.attributes.customerPrice) === F.usd);
      if (!abd) throw new Error(`ABD için ${F.usd} $ fiyat noktası yok`);
      const nokta = { USA: abd.id };
      for (const e of await hepsi(`/v1/subscriptionPricePoints/${abd.id}/equalizations?include=territory&limit=200`)) {
        const t = e.relationships?.territory?.data?.id;
        if (t && !nokta[t]) nokta[t] = e.id;
      }
      const hedef = eksik.filter((t) => nokta[t]);
      for (const t of hedef) {
        await yaz(uygula, 'POST', '/v1/subscriptionPrices', { data: { type: 'subscriptionPrices', attributes: { preserveCurrentPrice: false },
          relationships: { ...rel, subscriptionPricePoint: { data: { type: 'subscriptionPricePoints', id: nokta[t] } }, territory: { data: { type: 'territories', id: t } } } } },
          `fiyat ${t}${t === 'USA' ? ` ${F.usd} $` : ' (ABD eşdeğeri)'}`);
      }
    } else console.log(`  fiyat: ${fiyatli.size} ülkede var`);
  }
  return bitir(uygula);
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
    metin: () => metin(arg[0], arg.includes('uygula')),
    yas: () => yas(arg[0], arg.includes('uygula')),
    abonelik: () => abonelik(arg[0], arg.includes('uygula')),
  }[komut];
  if (!is) {
    console.error('kullanım: asc.mjs durum [u…] | paket [uygula] | onkontrol <u> | hazirla <u> | bekle <u> <yapı> | metin|yas|abonelik <u> [uygula]');
    process.exit(2);
  }
  if (eksik.length) { console.error(`HATA: GitHub Secrets'ta eksik: ${eksik.join(', ')} (docs/ios-yayin.md §1 adım 1)`); process.exit(2); }
  is().catch((e) => { console.error(`HATA: ${e.message}`); process.exit(1); });
}
