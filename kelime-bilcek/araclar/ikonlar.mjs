// Kelime Bilcek — Lucide simgelerini (ISC, lucide-static) www/index.html içine gömülü SVG kümesi olarak yazar.
// Sayfada kullanım: <svg class="ikon" aria-hidden="true"><use href="#i-zap"/></svg>. Simge eklemek için listeye ad ekleyip
// çalıştırın: node kelime-bilcek/araclar/ikonlar.mjs  (index.html'deki <!-- ikonlar:başla --> … <!-- ikonlar:son --> arası yenilenir)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const IKONLAR = ['zap', 'bot', 'users', 'key-round', 'layout-grid', 'trophy', 'hourglass', 'link', 'chevron-right',
  'arrow-left', 'send', 'user', 'log-out', 'trash-2', 'pencil', 'volume-2', 'volume-x', 'shield-check', 'search', 'x', 'check',
  'user-plus', 'door-open', 'swords', 'crown', 'gamepad-2', 'flag', 'house', 'sparkles', 'smile', 'meh', 'skull', 'timer', 'share-2'];

const semboller = IKONLAR.map((ad) => {
  const svg = fs.readFileSync(path.join(KOK, 'node_modules', 'lucide-static', 'icons', `${ad}.svg`), 'utf8');
  const ic = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>')).replace(/\s*\n\s*/g, '').replace(/\s*\/>/g, '/>');
  return `<symbol id="i-${ad}" viewBox="0 0 24 24">${ic}</symbol>`;
}).join('');
const blok = `<!-- ikonlar:başla — Lucide (ISC), araclar/ikonlar.mjs üretir -->\n<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true"><defs>${semboller}</defs></svg>\n<!-- ikonlar:son -->`;
const p = path.join(KOK, 'www', 'index.html');
let html = fs.readFileSync(p, 'utf8');
if (/<!-- ikonlar:başla[\s\S]*?<!-- ikonlar:son -->/.test(html)) html = html.replace(/<!-- ikonlar:başla[\s\S]*?<!-- ikonlar:son -->/, blok);
else html = html.replace('<body>\n', `<body>\n${blok}\n`);
fs.writeFileSync(p, html);
console.log(`${IKONLAR.length} simge → www/index.html (${blok.length} bayt)`);
