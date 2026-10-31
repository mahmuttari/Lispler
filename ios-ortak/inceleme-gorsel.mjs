#!/usr/bin/env node
/*
 * Abonelik inceleme ekran görüntüsü: App Review her abonelik ürünü için satın alma ekranının bir görüntüsünü ister. Her
 * uygulamanın üyelik sayfası, iPhone kipindeki sahte bir Capacitor köprüsüyle (App Store ürünleri, ABD fiyatları) açılıp
 * 1320×2868 JPEG olarak çekilir: <klasör>/magaza/app-store/inceleme-abonelik.jpg. Dil İngilizce (inceleme ekibi için).
 *
 *   node ios-ortak/inceleme-gorsel.mjs [uygulama …]     (verilmezse üçü; Playwright + Chromium gerekir)
 *
 * asc.mjs abonelik … uygula bu görseli her iki ürüne inceleme görseli olarak yükler.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.webp': 'image/webp' };

/** Uygulama → paket, yerel depo anahtarı ve dili İngilizce yapan durum, üyelik sayfasını açan adım */
export const UYGULAMA = {
  unitica: { paket: 'com.poyrazworkshop.unitica', depo: ['unitica.v1', { lang: 'en', theme: 'light' }],
    ac: async (p) => { await p.click('.tab[data-tab="more"]'); await p.click('[data-act="member"]'); } },
  calqora: { paket: 'com.poyrazworkshop.calqora', depo: ['calqora.v1', { settings: { lang: 'en', theme: 'light' } }],
    ac: async (p) => { await p.click('#btn-noads'); } },
  'smart-measure': { paket: 'com.poyrazworkshop.smartmeasure', depo: ['smartmeasure.v1', { settings: { theme: 'light', language: 'en', units: 'metric', cameraHeight: null } }],
    ac: async (p) => { await p.evaluate(() => { location.hash = '#/premium'; }); } },
};
export const CIKTI = (u) => path.join(KOK, u, 'magaza', 'app-store', 'inceleme-abonelik.jpg');

/** Tarayıcıda çalışır: iPhone kipinde en az köprü. Tanınmayan eklenti çağrıları boş yanıt döner. */
function sahteIphone(paket) {
  const bos = () => new Proxy({}, { get: (_, ad) => (ad === 'addListener' ? () => Promise.resolve({ remove: async () => {} }) : async () => ({})) });
  const urun = (d, fiyat, tutar) => ({ identifier: `${paket}.adfree.${d}`, priceString: fiyat, price: tutar, currencyCode: 'USD' });
  const NativePurchases = Object.assign(bos(), {});
  const np = {
    isBillingSupported: async () => ({ isBillingSupported: true }),
    getProducts: async () => ({ products: [urun('monthly', '$0.99', 0.99), urun('yearly', '$9.99', 9.99)] }),
    getPurchases: async () => ({ purchases: [] }),
    addListener: () => Promise.resolve({ remove: async () => {} }),
  };
  const eklenti = { NativePurchases: new Proxy(np, { get: (h, ad) => (ad in h ? h[ad] : async () => ({})) }) };
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', DEBUG: false,
    Plugins: new Proxy(eklenti, { get: (h, ad) => h[ad] || (h[ad] = bos()) }), registerPlugin: (ad) => window.Capacitor.Plugins[ad] };
  void NativePurchases;
}

function sunucu(kok) {
  const s = http.createServer((q, r) => {
    const f = path.join(kok, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(kok) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  }).listen(0, '127.0.0.1');
  return new Promise((ok) => s.on('listening', () => ok({ adres: `http://127.0.0.1:${s.address().port}/`, kapat: () => s.close() })));
}

export async function cek(liste = Object.keys(UYGULAMA)) {
  const { chromium } = await import(pathToFileURL(PW).href);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  try {
    for (const u of liste) {
      const a = UYGULAMA[u];
      if (!a) throw new Error(`bilinmeyen uygulama "${u}"`);
      const { adres, kapat } = await sunucu(path.join(KOK, u, 'www'));
      try {
        const ctx = await b.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, colorScheme: 'light', locale: 'en-US' });
        await ctx.addInitScript(sahteIphone, a.paket);
        await ctx.addInitScript(([k, d]) => { if (!sessionStorage.getItem('kuruldu')) { localStorage.setItem(k, JSON.stringify(d)); sessionStorage.setItem('kuruldu', '1'); } }, a.depo);
        const p = await ctx.newPage();
        const hatalar = [];
        p.on('pageerror', (e) => hatalar.push(e.message));
        await p.goto(`${adres}index.html`, { waitUntil: 'load' });
        await p.evaluate(() => document.fonts.ready);
        await p.waitForTimeout(800);
        await a.ac(p);
        await p.waitForFunction(() => /\$9\.99/.test(document.body.innerText), null, { timeout: 8000 });
        await p.waitForTimeout(600);
        const metin = await p.evaluate(() => document.body.innerText);
        if (/Google[ -]?Play/.test(metin)) throw new Error(`${u}: üyelik sayfasında "Google Play" geçiyor`);
        fs.mkdirSync(path.dirname(CIKTI(u)), { recursive: true });
        await p.screenshot({ path: CIKTI(u), type: 'jpeg', quality: 82 });
        if (hatalar.length) throw new Error(`${u}: ${hatalar.join(' | ')}`);
        console.log(`${path.relative(KOK, CIKTI(u))}`);
        await ctx.close();
      } finally { kapat(); }
    }
  } finally { await b.close(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await cek(process.argv.slice(2).length ? process.argv.slice(2) : undefined);
