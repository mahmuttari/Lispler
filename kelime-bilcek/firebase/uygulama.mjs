// Firebase projesine (kelime-bilcek) Android uygulamasını ve imza parmak izlerini ekler — Firebase Management API v1beta1.
// Firebase konsolundaki "Uygulama ekle › Android" ve "SHA sertifika parmak izi ekle" ile aynı iş. Kimlik: TOKEN
// (kelime-firebase-uygulama.yml, Workload Identity hizmet hesabı; projede roles/firebase.admin gerekir, README › Kurulum).
//   node uygulama.mjs durum                 Android uygulamaları ve parmak izleri (salt okuma)
//   node uygulama.mjs android ekle          com.poyrazworkshop.kelimebilcek yoksa oluşturur
//   node uygulama.mjs sha ekle <parmakizi>  SHA-1 (40 hex) ya da SHA-256 (64 hex), ":" ile ya da ayrı; zaten varsa geçer
// SHA-1 eklenince Google, Google ile Giriş için Android OAuth istemcisini aynı projede oluşturur.
const PROJE = 'kelime-bilcek';
export const PAKET = 'com.poyrazworkshop.kelimebilcek';
const API = process.env.FIREBASE_API || 'https://firebase.googleapis.com/v1beta1';

export function shaCoz(girdi) {
  const hex = String(girdi || '').replace(/[:\s]/g, '').toLowerCase();
  if (/^[0-9a-f]{40}$/.test(hex)) return { shaHash: hex, certType: 'SHA_1' };
  if (/^[0-9a-f]{64}$/.test(hex)) return { shaHash: hex, certType: 'SHA_256' };
  throw new Error(`parmak izi SHA-1 (40) ya da SHA-256 (64) onaltılık olmalı: ${girdi}`);
}

async function istek(yol, { yontem = 'GET', govde } = {}) {
  const r = await fetch(yol.startsWith('http') ? yol : API + yol, {
    method: yontem,
    headers: { Authorization: `Bearer ${process.env.TOKEN}`, 'content-type': 'application/json', 'x-goog-user-project': PROJE },
    body: govde ? JSON.stringify(govde) : undefined,
  });
  const metin = await r.text();
  if (!r.ok) throw new Error(`${yontem} ${yol} → ${r.status}: ${metin.slice(0, 600)}`);
  return metin ? JSON.parse(metin) : {};
}

async function uygulamalar() {
  const { apps = [] } = await istek(`/projects/${PROJE}/androidApps?pageSize=100`);
  return apps;
}
async function bizimki() { return (await uygulamalar()).find((a) => a.packageName === PAKET); }

async function durum() {
  for (const a of await uygulamalar()) {
    const { certificates = [] } = await istek(`/${a.name}/sha`);
    console.log(`${a.packageName} · ${a.displayName || '—'} · ${a.appId} · ${a.state || ''}`);
    for (const c of certificates) console.log(`   ${c.certType} ${c.shaHash.match(/../g).join(':').toUpperCase()}`);
    if (!certificates.length) console.log('   (parmak izi yok)');
  }
}

async function androidEkle() {
  const var_ = await bizimki();
  if (var_) { console.log(`Zaten var: ${var_.appId}`); return; }
  let op = await istek(`/projects/${PROJE}/androidApps`, { yontem: 'POST', govde: { packageName: PAKET, displayName: 'Kelime Bilcek' } });
  for (let i = 0; !op.done && i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    op = await istek(`/${op.name}`);
  }
  if (op.error) throw new Error(JSON.stringify(op.error));
  console.log(`Oluşturuldu: ${op.response?.appId || '(işlem sürüyor)'}`);
}

async function shaEkle(girdi) {
  const sha = shaCoz(girdi);
  const a = await bizimki();
  if (!a) throw new Error(`${PAKET} Firebase'de yok: önce "android ekle"`);
  const { certificates = [] } = await istek(`/${a.name}/sha`);
  if (certificates.some((c) => c.shaHash.toLowerCase() === sha.shaHash)) { console.log(`Zaten var: ${sha.certType}`); return; }
  await istek(`/${a.name}/sha`, { yontem: 'POST', govde: sha });
  console.log(`Eklendi: ${sha.certType} ${sha.shaHash.match(/../g).join(':').toUpperCase()}`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [k1, k2, k3] = process.argv.slice(2);
  if (!process.env.TOKEN) { console.error('TOKEN yok: yalnız kelime-firebase-uygulama.yml içinde çalışır'); process.exit(2); }
  if (k1 === 'durum') {
    // Rol yoksa durum hata vermez, bunu söyler (yoklama): iş akışı yeşil kalır
    try { await durum(); } catch (e) {
      if (!/→ (401|403):/.test(e.message)) throw e;
      console.log(`::notice::YETKİ YOK: hizmet hesabının ${PROJE} projesinde roles/firebase.admin rolü yok (firebase/README.md › Kurulum)`);
      console.log(e.message.slice(0, 400));
    }
  }
  else if (k1 === 'android' && k2 === 'ekle') await androidEkle();
  else if (k1 === 'sha' && k2 === 'ekle') await shaEkle(k3);
  else { console.error(`geçersiz komut: ${process.argv.slice(2).join(' ')}`); process.exit(1); }
}
