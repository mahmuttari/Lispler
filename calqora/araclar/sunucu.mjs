// www/ klasörünü yerelde sunan küçük HTTP sunucusu (bağımlılıksız): tarayici-dene.mjs ve magaza-gorsel.mjs kullanır.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };

/** → { adres, kapat() }; ek: { '/yol': dosyaYolu } www dışındaki dosyaları da sunar (ör. android/res'teki simge katmanları) */
export function sunucuBaslat(ek = {}) {
  const s = http.createServer((q, r) => {
    const yol = decodeURIComponent(new URL(q.url, 'http://x').pathname);
    const f = ek[yol] || path.join(WWW, yol.replace(/^\/+/, '') || 'index.html');
    if (!ek[yol] && !f.startsWith(WWW)) { r.writeHead(403); return r.end(); }
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(r);
  }).listen(0, '127.0.0.1');
  return new Promise((ok) => s.on('listening', () => ok({ adres: `http://127.0.0.1:${s.address().port}/`, kapat: () => s.close() })));
}
