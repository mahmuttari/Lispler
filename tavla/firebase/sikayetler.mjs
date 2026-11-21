// Tavla şikâyet özeti — Firestore `reports` koleksiyonunu SALT OKUMA ile sayar (tavla-sikayet-ozeti.yml, haftalık).
// Yalnız `status`, `reason` ve `createdAt` alanları istenir (projeksiyon): mesajlar, not, rumuz ve kullanıcı kimlikleri
// hiç okunmaz. Depo herkese açık olduğu için özet yalnız sayı içerir; ayrıntı Firebase konsolunda (README › Moderasyon).
// Hiçbir şey yazmaz: karar (uyarı, sohbet yasağı, devre dışı bırakma) insanındır.
// Kimlik: TOKEN (Workload Identity hizmet hesabı; projede roles/firebase.admin, README › Kurulum).
//   node sikayetler.mjs                özeti Markdown olarak yazar (OZET_DOSYASI varsa oraya, yoksa standart çıktıya)
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const PROJE = 'tavla-online-oyundar';
const API = process.env.FIRESTORE_API || 'https://firestore.googleapis.com/v1';
export const NEDENLER = { kufur: 'Küfür', taciz: 'Taciz', rumuz: 'Uygunsuz rumuz', hile: 'Hile', spam: 'Spam', diger: 'Diğer' };
const KONSOL = `https://console.firebase.google.com/project/${PROJE}/firestore/databases/-default-/data/~2Freports`;
const GUN = 24 * 60 * 60 * 1000;

// runQuery yanıtındaki belgeleri { status, reason, createdAt(ms) } biçimine çevirir; başka alan taşımaz.
export function belgeleriCoz(yanit) {
  const sonuc = [];
  for (const satir of yanit || []) {
    const f = satir?.document?.fields;
    if (!f) continue;
    const zaman = f.createdAt?.timestampValue ? Date.parse(f.createdAt.timestampValue) : NaN;
    sonuc.push({ status: f.status?.stringValue || '', reason: f.reason?.stringValue || '', createdAt: zaman });
  }
  return sonuc;
}

export function ozetle(kayitlar, simdi = Date.now()) {
  const yeni = kayitlar.filter((k) => k.status === 'yeni');
  const nedenler = {};
  for (const k of yeni) {
    const anahtar = k.reason in NEDENLER ? k.reason : 'diger';
    nedenler[anahtar] = (nedenler[anahtar] || 0) + 1;
  }
  const zamanlar = yeni.map((k) => k.createdAt).filter((z) => Number.isFinite(z));
  return {
    bekleyen: yeni.length,
    sonYediGun: kayitlar.filter((k) => Number.isFinite(k.createdAt) && simdi - k.createdAt <= 7 * GUN).length,
    toplam: kayitlar.length,
    enEskiGun: zamanlar.length ? Math.floor((simdi - Math.min(...zamanlar)) / GUN) : null,
    nedenler,
  };
}

export function govdeYaz(ozet, { tarih = new Date(), anilan = '' } = {}) {
  const gun = tarih.toISOString().slice(0, 10);
  const satirlar = [`### ${gun} · Tavla şikâyet özeti`, ''];
  if (anilan) satirlar.push(`@${anilan}`, '');
  if (!ozet.bekleyen) {
    satirlar.push('**İncelenmeyi bekleyen şikâyet yok.**');
  } else {
    satirlar.push(`**İncelenmeyi bekleyen: ${ozet.bekleyen}** (en eskisi ${ozet.enEskiGun ?? '?'} gün önce)`, '');
    satirlar.push('| Neden | Sayı |', '|---|---|');
    for (const [k, ad] of Object.entries(NEDENLER)) if (ozet.nedenler[k]) satirlar.push(`| ${ad} | ${ozet.nedenler[k]} |`);
  }
  satirlar.push('', `Son 7 günde gelen: ${ozet.sonYediGun} · Toplam kayıt: ${ozet.toplam}`, '');
  if (ozet.bekleyen) satirlar.push(`İncele: [Firebase konsolu › reports](${KONSOL}) — \`status == yeni\`; adımlar \`tavla/firebase/README.md\` › Moderasyon.`, '');
  satirlar.push('_Otomatik, salt okuma özeti (tavla-sikayet-ozeti.yml). Ayrıntı (rumuz, mesajlar) bilerek buraya yazılmaz._');
  return satirlar.join('\n');
}

export async function kayitlariOku({ token = process.env.TOKEN, getir = fetch } = {}) {
  const r = await getir(`${API}/projects/${PROJE}/databases/(default)/documents:runQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-goog-user-project': PROJE },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'reports' }],
        select: { fields: [{ fieldPath: 'status' }, { fieldPath: 'reason' }, { fieldPath: 'createdAt' }] },
      },
    }),
  });
  const metin = await r.text();
  if (!r.ok) throw new Error(`Firestore runQuery → ${r.status}: ${metin.slice(0, 400)}`);
  return belgeleriCoz(metin ? JSON.parse(metin) : []);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const ozet = ozetle(await kayitlariOku());
  const govde = govdeYaz(ozet, { anilan: process.env.ANILAN || '' });
  if (process.env.OZET_DOSYASI) writeFileSync(process.env.OZET_DOSYASI, govde);
  else console.log(govde);
  console.log(`bekleyen=${ozet.bekleyen} sonYediGun=${ozet.sonYediGun} toplam=${ozet.toplam}`);
}
