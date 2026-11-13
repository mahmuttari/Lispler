// Tavla — Cloud Firestore kurallarını Firebase Rules API ile okur ve yayınlar (konsoldaki "Yayınla" ile aynı iş).
// Kimlik: TOKEN (tavla-kural-yayini.yml, Workload Identity hizmet hesabı; projede roles/firebaserules.admin gerekir).
//   node kurallar.mjs durum     yayındaki kuralları depodaki firestore.rules ile karşılaştırır (yazmaz)
//   node kurallar.mjs yayinla   yeni kural kümesi oluşturur, cloud.firestore sürümünü ona çevirir, geri okuyup denetler
import { readFileSync } from 'node:fs';

export const PROJE = 'tavla-online-oyundar';
const API = process.env.RULES_API || 'https://firebaserules.googleapis.com/v1';
const SURUM = `projects/${PROJE}/releases/cloud.firestore`;
const DEPO = readFileSync(new URL('firestore.rules', import.meta.url), 'utf8');

async function istek(yol, { yontem = 'GET', govde } = {}) {
  for (let d = 1; ; d++) {
    const r = await fetch(API + yol, {
      method: yontem,
      headers: { Authorization: `Bearer ${process.env.TOKEN}`, 'content-type': 'application/json', 'x-goog-user-project': PROJE },
      body: govde ? JSON.stringify(govde) : undefined,
    });
    const metin = await r.text();
    if (r.ok) return metin ? JSON.parse(metin) : {};
    // Yeni verilen IAM rolü birkaç dakikada yayılır: 403'te 30 sn arayla 8 kez denenir
    if (r.status === 403 && d < 8) { console.log(`${yontem} ${yol} → 403 (deneme ${d}), 30 sn sonra yeniden`); await new Promise((s) => setTimeout(s, 30000)); continue; }
    throw new Error(`${yontem} ${yol} → ${r.status}: ${metin.slice(0, 600)}`);
  }
}

const normal = (s) => s.replace(/\r/g, '').trim();
async function yayindaki() {
  const surum = await istek(`/${SURUM}`).catch((e) => { if (/→ 404/.test(e.message)) return null; throw e; });
  if (!surum) return { ad: null, metin: null };
  const kume = await istek(`/${surum.rulesetName}`);
  return { ad: surum.rulesetName, metin: kume.source.files.map((f) => f.content).join('\n') };
}

async function durum() {
  const y = await yayindaki();
  if (!y.metin) { console.log('Yayında Firestore kuralı yok (proje hiç kural yayınlamamış).'); return; }
  console.log(`Yayındaki kural kümesi: ${y.ad}`);
  if (normal(y.metin) === normal(DEPO)) { console.log('AYNI: yayındaki kurallar depodaki firestore.rules ile aynı.'); return; }
  console.log('FARKLI: yayındaki kurallar ↓ (yayinla bunların yerine firestore.rules koyar)');
  console.log(y.metin.split('\n').map((s) => '  | ' + s).join('\n'));
}

async function yayinla() {
  const kume = await istek(`/projects/${PROJE}/rulesets`, { yontem: 'POST', govde: { source: { files: [{ name: 'firestore.rules', content: DEPO }] } } });
  console.log(`Kural kümesi oluşturuldu: ${kume.name}`);
  const var_ = await istek(`/${SURUM}`).then(() => true, (e) => { if (/→ 404/.test(e.message)) return false; throw e; });
  if (var_) await istek(`/${SURUM}`, { yontem: 'PATCH', govde: { release: { name: SURUM, rulesetName: kume.name } } });
  else await istek(`/projects/${PROJE}/releases`, { yontem: 'POST', govde: { name: SURUM, rulesetName: kume.name } });
  const y = await yayindaki();
  if (normal(y.metin) !== normal(DEPO)) throw new Error('geri okunan kurallar depodakiyle aynı değil');
  console.log(`YAYINLANDI: ${SURUM} → ${y.ad}; geri okunan kurallar depodakiyle AYNI.`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const k = process.argv[2];
  if (!process.env.TOKEN) { console.error('TOKEN yok: yalnız tavla-kural-yayini.yml içinde çalışır'); process.exit(2); }
  if (k === 'durum') await durum();
  else if (k === 'yayinla') await yayinla();
  else { console.error(`geçersiz komut: ${k}`); process.exit(1); }
}
