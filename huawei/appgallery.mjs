// Huawei AppGallery Connect Publishing API v2 işleri (Node 22, bağımlılıksız). İş akışı: .github/workflows/huawei.yml,
// komutlar huawei/istek.txt'ye yazılır ("<uygulama> <komut> [uygula]", ör. "kiblebul yukle uygula").
// Kimlik yalnız GitHub Secrets'ta: HUAWEI_CONNECT_CLIENT_ID / HUAWEI_CONNECT_CLIENT_SECRET
//   (AppGallery Connect › Users and permissions › API key › Connect API › Create; proje N/A, rol App administrator).
// Anahtar ve erişim belirteci günlüğe yazılmaz. Uygulamalar huawei/uygulamalar.json'da (appId AGC'deki App ID).
// DWG OfficeZip deposundaki DwgViewer/tools/appgallery.mjs ile aynı uç noktalar; yükleme önce OBS yöntemiyle
// (upload-url/for-obs), Huawei o yöntemi reddederse eski yöntemle (upload-url + authCode) denenir.
//
//   node huawei/appgallery.mjs <uygulama> durum            salt okuma: yayın durumu, diller, gizlilik adresi
//   node huawei/appgallery.mjs <uygulama> yukle [uygula]   $RUNNER_TEMP/apk/<uygulama>.apk'yı yükler, sürüme bağlar
//   node huawei/appgallery.mjs <uygulama> gonder [uygula]  incelemeye gönderir (tam yayın). Sahibin onayıyla yazılır.
// "uygula" yoksa hiçbir şey yazılmaz, yalnız plan yazılır.
// SINIR: API yeni uygulama oluşturamaz; uygulama, yaş derecelendirmesi ve gizlilik etiketleri AGC'de elle girilir.
import fs from 'node:fs';
import path from 'node:path';

const KOK = process.env.HUAWEI_API_KOK || 'https://connect-api.cloud.huawei.com/api';
const API = `${KOK}/publish/v2`;
const [U, KOMUT, ...ek] = process.argv.slice(2);
const UYGULA = ek.includes('uygula');
const LISTE = JSON.parse(fs.readFileSync(new URL('./uygulamalar.json', import.meta.url), 'utf8'));
const X = LISTE[U];
const bekle = ms => new Promise(r => setTimeout(r, ms));

if (!X || !['durum', 'yukle', 'gonder'].includes(KOMUT)) {
  console.error(`kullanım: <${Object.keys(LISTE).join('|')}> <durum|yukle|gonder> [uygula]`);
  process.exit(2);
}

async function istek(yontem, url, { basliklar = {}, json, govde } = {}) {
  const r = await fetch(url, {
    method: yontem,
    headers: { ...basliklar, ...(json !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: json !== undefined ? JSON.stringify(json) : govde,
  });
  const t = await r.text();
  let j; try { j = t ? JSON.parse(t) : {}; } catch { j = { ham: t.slice(0, 300) }; }
  if (!r.ok && !(j && j.ret)) throw new Error(`${yontem} ${url.split('?')[0]} → HTTP ${r.status} ${t.slice(0, 300)}`);
  return j;
}

let BASLIK = {};
async function giris() {
  const id = process.env.HUAWEI_CONNECT_CLIENT_ID, sir = process.env.HUAWEI_CONNECT_CLIENT_SECRET;
  if (!id || !sir) throw new Error('HUAWEI_CONNECT_CLIENT_ID / HUAWEI_CONNECT_CLIENT_SECRET boş: GitHub › Settings › Secrets › Actions');
  const j = await istek('POST', `${KOK}/oauth2/v1/token`, { json: { grant_type: 'client_credentials', client_id: id, client_secret: sir } });
  if (!j || !j.access_token) throw new Error(`erişim belirteci alınamadı: ${JSON.stringify(j && j.ret || j).slice(0, 300)}`);
  BASLIK = { authorization: `Bearer ${j.access_token}`, client_id: id };
}

const kod = j => (j && j.ret ? j.ret.code : 0);
function tamam(j, ne) {
  if (kod(j) !== 0) throw new Error(`${ne}: ${j.ret.code} ${j.ret.msg}`);
  return j;
}
const al = async (yol, ne) => tamam(await istek('GET', `${API}${yol}`, { basliklar: BASLIK }), ne);

async function appId() {
  if (X.appId) return X.appId;
  const j = await al(`/appid-list?packageName=${X.paket}`, 'appid-list');
  const id = j.appids && j.appids[0] && j.appids[0].value;
  if (!id) throw new Error(`${X.paket} için App ID yok: uygulamalar.json'a AGC'deki App ID yazılmalı`);
  return id;
}

async function durum() {
  const id = await appId();
  const j = await al(`/app-info?appId=${id}&lang=tr-TR`, 'app-info');
  const a = j.appInfo || {};
  console.log(`${X.ad} · appId ${id} · paket ${a.packageName || X.paket} · yayın durumu ${a.releaseState ?? '?'} · varsayılan dil ${a.defaultLang ?? '?'}`);
  console.log(`  gizlilik ${a.privacyPolicy || '—'} · ücret ${a.isFree === 0 ? 'ücretli' : 'ücretsiz'} · sürüm ${a.versionNumber || '—'}`);
  console.log(`  diller: ${(j.languages || []).map(l => `${l.lang} "${l.appName || ''}"`).join(' · ') || '—'}`);
  if (j.auditInfo) console.log(`  inceleme: ${JSON.stringify(j.auditInfo).slice(0, 500)}`);
}

async function yukle() {
  const id = await appId();
  const yol = path.join(process.env.RUNNER_TEMP || '.', 'apk', `${U}.apk`);
  if (!fs.existsSync(yol)) throw new Error(`APK yok: ${yol} (iş akışı önce huawei/apk-al.sh çalıştırır)`);
  const veri = fs.readFileSync(yol), ad = X.dosya;
  console.log(`APK ${ad} · ${(veri.length / 1048576).toFixed(1)} MB · appId ${id}`);
  console.log('PLAN: APK Huawei dosya sunucusuna yüklenir ve taslak sürüme bağlanır (app-file-info, fileType 5)');
  if (!UYGULA) return;

  let hedef;
  const obs = await istek('GET', `${API}/upload-url/for-obs?appId=${id}&fileName=${encodeURIComponent(ad)}&contentLength=${veri.length}`, { basliklar: BASLIK });
  if (kod(obs) === 0 && obs.urlInfo && obs.urlInfo.url) {
    const u = obs.urlInfo;
    const r = await fetch(u.url, { method: u.method || 'PUT', headers: u.headers || {}, body: veri });
    if (!r.ok) throw new Error(`OBS yüklemesi: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
    hedef = { fileName: ad, fileDestUrl: u.objectId };
    console.log('[tamam] dosya yüklendi (OBS)');
  } else {
    console.log(`OBS yöntemi kullanılamadı (${kod(obs)} ${obs.ret && obs.ret.msg}); eski yöntem deneniyor`);
    const u = await al(`/upload-url?appId=${id}&suffix=apk`, 'upload-url');
    const form = new FormData();
    form.append('file', new Blob([veri], { type: 'application/vnd.android.package-archive' }), ad);
    form.append('authCode', u.authCode);
    form.append('fileCount', '1');
    form.append('parseType', '1');
    const r = await istek('POST', u.uploadUrl, { basliklar: { accept: 'application/json' }, govde: form });
    const s = r && r.result, d = s && s.UploadFileRsp && s.UploadFileRsp.fileInfoList && s.UploadFileRsp.fileInfoList[0];
    if (!s || s.resultCode !== 0 || !d) throw new Error(`dosya yüklenemedi: ${JSON.stringify(r).slice(0, 300)}`);
    hedef = { fileName: ad, fileDestUrl: d.fileDestUlr, size: d.size };
    console.log(`[tamam] dosya yüklendi: ${d.size} bayt`);
  }
  tamam(await istek('PUT', `${API}/app-file-info?appId=${id}&releaseType=1`,
    { basliklar: BASLIK, json: { fileType: 5, files: [hedef] } }), 'app-file-info');
  console.log('[tamam] APK sürüme bağlandı. Huawei paketi birkaç dakika işler; "gonder" ondan sonra.');
}

async function gonder() {
  const id = await appId();
  console.log(`PLAN: ${X.ad} (appId ${id}) incelemeye gönderilir (app-submit, releaseType 1 = tam yayın)`);
  if (!UYGULA) return;
  for (let i = 1; i <= 12; i++) {
    const j = await istek('POST', `${API}/app-submit?appId=${id}&releaseType=1`, { basliklar: BASLIK, json: {} });
    if (kod(j) === 0) { console.log('[tamam] incelemeye gönderildi'); return; }
    if (kod(j) === 204144660 && i < 12) { console.log(`paket hâlâ işleniyor, 30 sn sonra yeniden (${i}/12)`); await bekle(30000); continue; }
    tamam(j, 'app-submit');
  }
}

await giris();
await ({ durum, yukle, gonder })[KOMUT]();
