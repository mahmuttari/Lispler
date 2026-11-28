// ChatGPT görsel yenilemesi için referans paftaları (gorsel/CHATGPT-ISTEMI.md): oyunun kendi çizim işlevleriyle 3×2 hücreli,
// 1536×1024 paftalar. Kullanım: node hayalet-avcilari/araclar/gorsel-referans.mjs hayalet-avcilari/www hayalet-avcilari/gorsel/referans
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const WWW = process.argv[2], OUT = process.argv[3];
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
const sv = http.createServer((q, r) => { const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html'); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 800, height: 600 } });
const hatalar = []; p.on('pageerror', (e) => hatalar.push(e.message));
await p.route(/gstatic|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
await p.goto(`http://127.0.0.1:${sv.address().port}/index.html`);
await p.waitForFunction(() => typeof drawCharacter === 'function');
const paftalar = await p.evaluate(() => {
  startGame(); game.paused = true;
  const C = (k, i) => (ctx) => drawCharacter(ctx, k, i, 256, 300, 330);
  const H = (o) => (ctx) => drawGhost(ctx, Object.assign({ x: 256, y: 270, hp: 5, maxHp: 5, r: 40 }, o));
  const E = (emoji) => (ctx) => { ctx.font = '260px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, 256, 270); };
  const P = (tur) => (ctx) => { ctx.translate(256, 280); petResmi(ctx, tur, 7, { kanat: 0.05 }); };
  const G = (k) => (ctx) => { ctx.translate(190, 270); drawGunShape(ctx, k, k === 'bazuka' ? 6 : 8); };
  const K = (kind) => (ctx) => { ctx.translate(256, 256); ctx.scale(6, 6); drawPickup(ctx, { x: 0, y: 0, kind, value: 1 }); };
  const Y = () => (ctx) => { ctx.translate(-yari, 0); };
  const yaz = (s) => (ctx) => { ctx.fillStyle = '#cbd5e1'; ctx.font = '600 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(s, 256, 256); };
  const s = {
    K1: [C('kinkin', 0), C('kinkin', 1), C('kinkin', 2), C('veryi', 0), C('veryi', 1), C('veryi', 2)],
    K2: [C('kornet', 0), C('kornet', 1), C('kornet', 2), C('mark', 0), C('mark', 1), C('mark', 2)],
    K3: [C('kent', 0), C('kent', 1), C('kent', 2), C('ponko', 0), C('ponko', 1), C('ponko', 2)],
    K4: [C('gul', 0), C('gul', 1), C('gul', 2), C('rani', 0), C('rani', 1), C('rani', 2)],
    K5: [C('beti', 0), C('beti', 1), C('beti', 2), C('fanatik', 0), C('fanatik', 1), C('fanatik', 2)],
    K6: [C('silsen', 0), C('silsen', 1), C('sercin', 0), C('sercin', 1),
      (ctx) => { ctx.translate(256, 250); ctx.scale(3.4, 3.4); drawBot(ctx, { x: 0, y: 0, walkTimer: 0, facing: 0, hp: 3, maxHp: 3 }); }, E('👻')],
    H1: [H({ size: 190 }), H({ size: 190, isShooter: true }), H({ size: 120 }), H({ size: 230, isBoss: true, y: 290 }),
      (ctx) => { ctx.translate(256, 300); ctx.scale(4.2, 4.2); hayaletOyuncuCiz(ctx, 'kinkin', 0, 0, 0, 0.7); }, yaz('(boş)')],
    P1: [P('kedi'), P('kopek'), P('kus'), yaz('timsah: sudan çıkan baş'), (ctx) => { ctx.translate(256, 256); ctx.scale(10, 10); yarasaCiz(ctx, { x: 0, y: 0, yon: 1, boy: 1, kanat: 1.2 }); },
      (ctx) => { ctx.translate(256, 300); ctx.scale(2.4, 2.4); bulutCiz(ctx, { x: 0, y: 0, cakti: 0, boss: false }); }],
    P2: [(ctx) => { ctx.translate(256, 256); ctx.scale(3.5, 3.5); caliCiz(ctx, { x: 0, y: 0, tohum: 1 }, 0, 0); }, yaz('ip köprü parçası'), K('para'), K('elmas'), K('zumrut'), K('kalp')],
    P3: [K('guc'), G('baloncuk'), G('lazer'), G('yesil'), G('pompali'), G('bazuka')],
    P4: [E('💣'), E('🧊'), E('⚡'), E('🌪️'), E('🩹'), E('🚀')],
  };
  // görünmezlik iksiri K6'daki 👻 hücresi (oyunda emoji)
  const sonuc = {};
  for (const [ad, hucreler] of Object.entries(s)) {
    const cv = document.createElement('canvas'); cv.width = 1536; cv.height = 1024;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#1e1736'; ctx.fillRect(0, 0, 1536, 1024);
    hucreler.forEach((f, i) => {
      const x = (i % 3) * 512, y = Math.floor(i / 3) * 512;
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(x + 0.5, y + 0.5, 511, 511);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '600 22px sans-serif'; ctx.fillText(`${ad}-${i + 1}`, x + 12, y + 30); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, 512, 512); ctx.clip(); ctx.translate(x, y);
      try { f(ctx); } catch (e) { ctx.fillStyle = '#f87171'; ctx.fillText('hata: ' + e.message, 20, 260); }
      ctx.restore();
    });
    sonuc[ad] = cv.toDataURL('image/png');
  }
  return sonuc;
});
for (const [ad, url] of Object.entries(paftalar)) fs.writeFileSync(path.join(OUT, `${ad}-referans.png`), Buffer.from(url.split(',')[1], 'base64'));
console.log(Object.keys(paftalar).join(' '), hatalar);
await b.close(); sv.close();
