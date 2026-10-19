// Dil sözlüklerini yazar ve denetler. Anahtar listesi araclar/anahtarlar.mjs'ten gelir.
//   node hayalet-avcilari/araclar/sozluk.mjs yaz <dil> <ceviri.json>   → www/i18n/<dil>.js (anahtar sırasıyla)
//   node hayalet-avcilari/araclar/sozluk.mjs denetle [dil…]             → eksik/fazla anahtar, yer tutucu, HTML etiketi
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DILLER = { en: 'English', es: 'Español', zh: '简体中文', hi: 'हिन्दी', ar: 'العربية' };
const anahtarlar = () => JSON.parse(execFileSync(process.execPath, [path.join(KOK, 'araclar', 'anahtarlar.mjs')], { encoding: 'utf8' }));
const dosya = (dil) => path.join(KOK, 'www', 'i18n', `${dil}.js`);

export function sozlukOku(dil) {
  const ctx = { I18N: {} };
  vm.runInNewContext(fs.readFileSync(dosya(dil), 'utf8'), ctx);
  return ctx.I18N[dil] || {};
}

const yerTutucular = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const etiketler = (s) => [...s.matchAll(/<\/?[a-z][^>]*>/gi)].map((m) => m[0]).sort().join('');

export function denetle(dil, sozluk, liste) {
  const hatalar = [];
  for (const k of liste) {
    const v = sozluk[k];
    if (typeof v !== 'string' || !v.trim()) { hatalar.push(`eksik: ${JSON.stringify(k)}`); continue; }
    if (yerTutucular(k) !== yerTutucular(v)) hatalar.push(`yer tutucu farklı: ${JSON.stringify(k)} → ${JSON.stringify(v)}`);
    if (etiketler(k) !== etiketler(v)) hatalar.push(`HTML etiketi farklı: ${JSON.stringify(k)} → ${JSON.stringify(v)}`);
    if (/[ğışĞİŞ]/.test(v) && dil !== 'tr') hatalar.push(`Türkçe harf kalmış: ${JSON.stringify(v)}`);
  }
  for (const k of Object.keys(sozluk)) if (!liste.includes(k)) hatalar.push(`fazla anahtar: ${JSON.stringify(k)}`);
  return hatalar;
}

const [komut, ...arg] = process.argv.slice(2);
if (komut === 'yaz') {
  const [dil, json] = arg;
  if (!DILLER[dil]) throw new Error(`dil: ${Object.keys(DILLER).join(', ')}`);
  const ceviri = JSON.parse(fs.readFileSync(json, 'utf8'));
  const liste = anahtarlar();
  const satirlar = liste.filter((k) => k in ceviri).map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(ceviri[k])},`);
  fs.mkdirSync(path.dirname(dosya(dil)), { recursive: true });
  fs.writeFileSync(dosya(dil), `/* Hayalet Avcıları — ${DILLER[dil]} (${dil}). Anahtar: Türkçe kaynak metin (www/i18n.js). */\nI18N.${dil} = {\n${satirlar.join('\n')}\n};\n`);
  const h = denetle(dil, sozlukOku(dil), liste);
  console.log(`${dil}: ${satirlar.length}/${liste.length} yazıldı, ${h.length} sorun`); h.forEach((x) => console.log('  ' + x));
  process.exit(h.length ? 1 : 0);
} else if (komut === 'denetle') {
  const liste = anahtarlar();
  let toplam = 0;
  for (const dil of arg.length ? arg : Object.keys(DILLER)) {
    const h = fs.existsSync(dosya(dil)) ? denetle(dil, sozlukOku(dil), liste) : [`${dosya(dil)} yok`];
    toplam += h.length;
    console.log(`${dil}: ${h.length ? h.length + ' sorun' : 'tamam'} (${liste.length} anahtar)`); h.slice(0, 40).forEach((x) => console.log('  ' + x));
  }
  process.exit(toplam ? 1 : 0);
} else {
  console.log('kullanım: sozluk.mjs yaz <dil> <ceviri.json> | denetle [dil…]');
}
