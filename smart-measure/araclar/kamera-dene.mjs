#!/usr/bin/env node
// Ölçü Kutusu — kamerayla ölçümün akış sınaması (yerel; Playwright + Chromium, araclar/sahte-cihaz.mjs). Sahte telefonun
// bakışı (pitch, bearing) değiştirilir, düğmelere basılır, ekrandaki sonuç trigonometriyle beklenen değerle karşılaştırılır.
// Sınananlar: canlı etiket ve önizleme, üç kip, bitmiş ölçümde ikinci noktayı yeniden seçme, dokunma sarsıntısının sonuca
// girmemesi, gezdirirken basmanın reddi, tam ekran düğmesinin her seferinde çalışması, pause'suz resume'da dinleyicinin
// çoğalmaması, akış kesilince bayat bakışla ölçmeme ve yeniden başlatma, dönme sensörü susarsa yerçekimine düşme.
//
//   node smart-measure/araclar/kamera-dene.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sahteCihaz, ornekDepo } from './sahte-cihaz.mjs';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(0);
const ADRES = `http://127.0.0.1:${sunucu.address().port}/index.html`;

const H = 1.42, DEG = Math.PI / 180;
const r = (p) => H / Math.tan(p * DEG);
const tr = (m) => (m < 1 ? `${Math.round(m * 100)} cm` : `${m.toFixed(2).replace('.', ',')} m`);
const sorunlar = [];
let adim = 0;
const bekle = (ad, gercek, beklenen) => { adim++; if (gercek !== beklenen) sorunlar.push(`${ad}: "${gercek}" ≠ "${beklenen}"`); };
const dogru = (ad, kosul, ek = '') => { adim++; if (!kosul) sorunlar.push(`${ad}${ek ? `: ${ek}` : ''}`); };

const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
async function ac(ayar, rota) {
  const b = await tarayici.newContext({ viewport: { width: 390, height: 760 }, colorScheme: 'light', locale: 'tr-TR', hasTouch: true });
  await b.addInitScript(sahteCihaz, ayar);
  await b.addInitScript((d) => { if (!sessionStorage.getItem('kuruldu')) { localStorage.setItem('smartmeasure.v1', d); sessionStorage.setItem('kuruldu', '1'); } }, JSON.stringify(ornekDepo('tr', 'light')));
  const p = await b.newPage();
  p.on('pageerror', (e) => sorunlar.push(`sayfa hatası ${e.message}`));
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) sorunlar.push(`konsol ${m.type()} ${m.text()}`); });
  await p.goto(`${ADRES}#/${rota}`);
  const s = {
    p, kapat: () => b.close(),
    bak: async (pitch, bearing = 0, ms = 750) => { await p.evaluate(([a, c]) => { window.__sahte.pitch = a; window.__sahte.bearing = c; }, [pitch, bearing]); await p.waitForTimeout(ms); },
    dugme: (ad) => p.locator('.screen > .actions .act', { hasText: ad }),
    bas: async (ad) => { await s.dugme(ad).click(); await p.waitForTimeout(120); },
    sekme: async (ad) => { await p.locator('.seg-btn', { hasText: ad }).click(); await p.waitForTimeout(150); },
    etiket: () => p.evaluate(() => { const e = document.querySelector('.cam-pill'); return e.classList.contains('hidden') ? '' : e.textContent; }),
    sonuc: () => p.evaluate(() => { const k = document.querySelector('.card.result'); return k.classList.contains('hidden') ? null : { ana: k.querySelector('.big')?.textContent || '', siz: k.querySelector('.value')?.textContent || '' }; }),
    bildirim: () => p.evaluate(() => document.getElementById('toast').textContent),
    uyari: () => p.evaluate(() => { const e = document.querySelector('.cam-problem'); return e.classList.contains('hidden') ? '' : e.textContent; }),
    tamEkran: () => p.evaluate(() => document.body.classList.contains('fullscreen')),
  };
  await p.waitForFunction(() => { const e = document.querySelector('.cam-pill'); return e && !e.classList.contains('hidden'); }, null, { timeout: 8000 }).catch(() => {});
  return s;
}

try {
  // ---------------------------------------------------------------- 1. mesafe, canlı etiket, yeniden seçme
  let s = await ac({}, 'ar?mode=distance');
  await s.bak(32, 10);
  bekle('canlı etiket', await s.etiket(), `Sizden ${tr(r(32))}`);
  await s.bak(30, 0); await s.bas('Başlangıç Seç');
  bekle('ilk noktadan sonra', JSON.stringify(await s.sonuc()), JSON.stringify({ ana: '', siz: `${tr(r(30))} ± 5 cm` }));
  await s.bak(30, 90, 1400);      // etiket süzgeçli bakışı gösterir: 90°'lik sıçramanın oturması beklenir
  bekle('canlı önizleme (mesafe)', await s.etiket(), `Mesafe: ${tr(r(30) * Math.SQRT2)}`);
  await s.bas('Bitiş Seç');
  bekle('mesafe', (await s.sonuc()).ana, tr(r(30) * Math.SQRT2));
  bekle('geçmişe kayıt', await s.bildirim(), 'Geçmişe kaydedildi');
  // bitmiş ölçümde "Bitiş Seç": başlangıç kalır, bitiş yeniden seçilir (eskiden noktalar silinip ekran eski sonuçla kalıyordu)
  await s.bak(30, 60); await s.bas('Bitiş Seç');
  bekle('bitişi yeniden seçme', (await s.sonuc()).ana, tr(r(30)));
  // bitmiş ölçümde ufka bakıp "Bitiş Seç": reddedilir, eski sonuç durur
  await s.bak(3, 60); await s.bas('Bitiş Seç');
  bekle('reddedilen bitiş eski sonucu bozmaz', (await s.sonuc()).ana, tr(r(30)));
  dogru('ufka bakınca uyarı', /Daha aşağı bakın/.test(await s.bildirim()), await s.bildirim());
  bekle('bitmiş ölçümde canlı uyarı yok', await s.uyari(), '');
  // "Başlangıç Seç": yeni ölçüm
  await s.bak(45, 0); await s.bas('Başlangıç Seç');
  bekle('yeni ölçüm', JSON.stringify(await s.sonuc()), JSON.stringify({ ana: '', siz: `${tr(r(45))} ± 3 cm` }));

  // ---------------------------------------------------------------- 2. dokunma sarsıntısı sonuca girmez
  await s.bas('Sıfırla');
  await s.bak(12, 0, 900);
  const kutu = await s.dugme('Başlangıç Seç').boundingBox();
  await s.p.mouse.move(kutu.x + kutu.width / 2, kutu.y + kutu.height / 2);
  await s.p.mouse.down();
  await s.p.evaluate(() => { window.__sahte.pitch = 10.5; });      // parmak değince telefon 1,5° yukarı kalkıyor
  await s.p.waitForTimeout(160);
  await s.p.mouse.up();
  await s.p.waitForTimeout(150);
  dogru('dokunma sarsıntısı', ((await s.sonuc()) || {}).siz?.startsWith(tr(r(12))), `${JSON.stringify(await s.sonuc())}, beklenen ${tr(r(12))} (sarsıntıyla ${tr(r(10.5))})`);
  // gezdirirken basılırsa reddedilir
  await s.bas('Sıfırla');
  await s.p.evaluate(() => { let v = 20; window.__gez = setInterval(() => { v += 0.6; window.__sahte.pitch = v; }, 30); });
  await s.p.waitForTimeout(600);
  await s.bas('Başlangıç Seç');
  await s.p.evaluate(() => clearInterval(window.__gez));
  dogru('gezdirirken basma reddedilir', /oynuyordu/.test(await s.bildirim()) && (await s.sonuc()) === null, `${await s.bildirim()} ${JSON.stringify(await s.sonuc())}`);

  // ---------------------------------------------------------------- 3. tam ekran düğmesi her seferinde çalışır
  const tam = s.p.locator('.cam-tools .icon-btn').last();
  for (const [n, beklenen] of [[1, true], [2, false], [3, true], [4, false], [5, true]]) { await tam.click(); bekle(`tam ekran ${n}. basış`, await s.tamEkran(), beklenen); }
  await s.p.locator('.fs-bar .act', { hasText: 'Tam ekrandan çık' }).click();
  bekle('alt çubuktan çıkış', await s.tamEkran(), false);
  await tam.click(); bekle('çıkıştan sonra yeniden giriş', await s.tamEkran(), true);
  await tam.click();

  // ---------------------------------------------------------------- 4. pause'suz resume: dinleyici çoğalmaz
  for (let i = 0; i < 3; i++) await s.p.evaluate(() => window.__sahte.yay('appStateChange', { isActive: true }));
  await s.bak(20, 0);
  bekle('yönelim dinleyicisi', await s.p.evaluate(() => window.__sahte.dinleyiciSayisi('yonelim')), 1);
  bekle('resume sonrası canlı etiket', await s.etiket(), `Sizden ${tr(r(20))}`);

  // arka plana gidince kamera ve sensör kapanır, geri gelince açılır
  const kamera = () => s.p.evaluate(() => !!document.querySelector('.cam video').srcObject);
  await s.p.evaluate(() => window.__sahte.yay('appStateChange', { isActive: false }));
  await s.p.waitForTimeout(200);
  bekle('arka planda kamera kapalı', JSON.stringify([await kamera(), await s.p.evaluate(() => window.__sahte.dinleyiciSayisi('yonelim'))]), '[false,0]');
  await s.p.evaluate(() => window.__sahte.yay('appStateChange', { isActive: true }));
  await s.p.waitForTimeout(900);
  bekle('geri gelince kamera ve etiket', JSON.stringify([await kamera(), await s.etiket()]), JSON.stringify([true, `Sizden ${tr(r(20))}`]));
  // kamera açılırken arka plana gidilirse açık kalmaz; geri gelince açılır
  await s.p.evaluate(() => { const md = navigator.mediaDevices, asil = md.getUserMedia.bind(md); window.__acilan = 0; md.getUserMedia = async (k) => { await new Promise((ok) => setTimeout(ok, 400)); window.__acilan++; return asil(k); }; });
  await s.p.evaluate(() => { window.__sahte.yay('appStateChange', { isActive: false }); window.__sahte.yay('appStateChange', { isActive: true }); });
  await s.p.waitForTimeout(100);
  await s.p.evaluate(() => window.__sahte.yay('appStateChange', { isActive: false }));    // getUserMedia sürerken
  await s.p.waitForTimeout(700);
  bekle('açılırken arka plana gidince kamera kapalı', await kamera(), false);
  await s.p.evaluate(() => { window.__sahte.yay('appStateChange', { isActive: true }); window.__sahte.yay('appStateChange', { isActive: true }); });
  await s.p.waitForTimeout(1100);
  bekle('geri gelince tek kamera', JSON.stringify([await kamera(), await s.p.evaluate(() => window.__acilan)]), '[true,2]');

  // ---------------------------------------------------------------- 5. akış sessizce kesilirse: bayat bakışla ölçülmez, yeniden başlar
  const once = await s.p.evaluate(() => window.__sahte.cagri.yonelimBaslat);
  await s.p.evaluate(() => window.__sahte.kes('yonelim'));
  await s.p.waitForTimeout(2300);
  bekle('bayat bakışta etiket yok', await s.etiket(), '');
  await s.bas('Başlangıç Seç');
  bekle('bayat bakışla ölçülmez', JSON.stringify([await s.bildirim(), await s.sonuc()]), JSON.stringify(['Veri bekleniyor', null]));
  await s.p.waitForTimeout(2600);
  dogru('akış yeniden başlatıldı', (await s.p.evaluate(() => window.__sahte.cagri.yonelimBaslat)) > once);
  bekle('yeniden başlayınca canlı etiket', await s.etiket(), `Sizden ${tr(r(20))}`);

  // ---------------------------------------------------------------- 6. yükseklik
  await s.sekme('Yükseklik');
  dogru('taban ipucu', /zemine değdiği yere/.test(await s.p.locator('.hint-line').textContent()));
  await s.bak(30, 0); await s.bas('Taban Seç');
  await s.bak(-12.4, 0);
  const yuk = H + r(30) * Math.tan(12.4 * DEG);
  bekle('canlı önizleme (yükseklik, ufkun üstü)', await s.etiket(), `Yükseklik: ${tr(yuk)}`);
  await s.bas('Tepe Seç');
  bekle('yükseklik', (await s.sonuc()).ana, tr(yuk));
  await s.bak(40, 0); await s.bas('Tepe Seç');
  dogru('tepe tabanın altında', /Tepe, tabandan yukarıda/.test(await s.bildirim()), await s.bildirim());
  bekle('reddedilen tepe eski sonucu bozmaz', (await s.sonuc()).ana, tr(yuk));
  await s.bas('Sıfırla'); await s.bak(30, 0); await s.bas('Taban Seç');
  await s.bak(-80, 0);
  dogru('çok dik yukarı: canlı uyarı', /Çok dik yukarı/.test(await s.uyari()), await s.uyari());
  await s.bas('Tepe Seç');
  bekle('çok dik yukarı reddedilir', (await s.sonuc()).ana, '');

  // ---------------------------------------------------------------- 7. genişlik
  await s.sekme('Genişlik');
  dogru('kenar ipucu', /SOL kenarın zemine değdiği/.test(await s.p.locator('.hint-line').textContent()));
  await s.bak(30, 350); await s.bas('Kenar Seç');
  await s.bak(30, 10);
  bekle('canlı önizleme (genişlik)', await s.etiket(), `Genişlik: ${tr(2 * r(30) * Math.sin(10 * DEG))}`);
  await s.bas('Kenar Seç');
  bekle('genişlik (0° / 360° sınırının iki yanı)', (await s.sonuc()).ana, tr(2 * r(30) * Math.sin(10 * DEG)));
  await s.kapat();

  // ---------------------------------------------------------------- 8. dönme sensörü var görünüp okuma vermiyor: yerçekimine düşer
  s = await ac({ yonelimSessiz: true, gravity: { x: 0, y: 9.80665 * Math.cos(30 * DEG), z: 9.80665 * Math.sin(30 * DEG) }, gurultu: 0 }, 'ar?mode=distance');
  await s.p.waitForTimeout(600);
  bekle('yerçekimi yedeği: canlı etiket', await s.etiket(), `Sizden ${tr(r(30))}`);
  dogru('yerçekimi yedeği: yön uyarısı', /aynı doğrultudaki iki nokta/.test(await s.p.locator('.notice.warn').first().textContent()));
  await s.sekme('Genişlik');
  dogru('yön yokken genişlik düğmesi kapalı', await s.dugme('Kenar Seç').isDisabled());
  await s.kapat();
} finally {
  await tarayici.close();
  sunucu.close();
}
if (sorunlar.length) { console.log([...new Set(sorunlar)].join('\n')); console.log(`\n${sorunlar.length} sorun (${adim} denetim)`); process.exit(1); }
console.log(`TAMAM: kamerayla ölçüm, ${adim} denetim`);
