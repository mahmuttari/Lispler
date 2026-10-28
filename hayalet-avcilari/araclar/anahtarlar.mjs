// Çevrilecek Türkçe metinlerin listesi: game.js, i18n.js, reklam.js, playgames.js, arkadaslar.js, ulkeler.js, dunya-turu.js, timsah.js, kopru.js, cali.js, pet.js, kostumler.js ve muzik.js'teki t("…") çağrıları + index.html'deki sabit metinler.
// Kullanım: node hayalet-avcilari/araclar/anahtarlar.mjs  → JSON dizisi (stdout)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const anahtarlar = new Set();
for (const f of ['game.js', 'i18n.js', 'reklam.js', 'playgames.js', 'arkadaslar.js', 'ulkeler.js', 'dunya-turu.js', 'timsah.js', 'kopru.js', 'cali.js', 'pet.js', 'kostumler.js', 'muzik.js']) {
  const s = fs.readFileSync(path.join(WWW, f), 'utf8');
  for (const m of s.matchAll(/\bt\(\s*("(?:[^"\\\n]|\\.)*")/g)) anahtarlar.add(JSON.parse(m[1].replace(/\\'/g, "'")));
}
// index.html: yazı düğümleri, data-i18n-html öğelerinin iç HTML'i, placeholder'lar (i18n.js dilUygula ile aynı kural)
let html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
html = html.slice(html.indexOf('<body'));
const ic = [];
html = html.replace(/<(\w+)([^>]*\sdata-i18n-html[^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attr, icerik) => { ic.push(icerik.trim()); return ''; });
ic.forEach((k) => anahtarlar.add(k));
for (const m of html.matchAll(/placeholder="([^"]*)"/g)) if (/\p{L}{2}/u.test(m[1]) && !/^[A-Z]{3}-/.test(m[1])) anahtarlar.add(m[1]);
for (const m of html.matchAll(/>([^<>]+)</g)) {
  const metin = m[1].replace(/&nbsp;/g, ' ').trim();
  if (metin && /\p{L}/u.test(metin) && !/^\d+%?$/.test(metin)) anahtarlar.add(metin);
}
anahtarlar.add('Hayalet Avcıları');
console.log(JSON.stringify([...anahtarlar].sort((a, b) => a.localeCompare(b, 'tr')), null, 1));
