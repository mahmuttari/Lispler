// Capacitor iOS kabuğunu ("npx cap add ios" çıktısı) App Store'a hazır hâle getirir. Bir kez çalışır, çıktısı depoya
// alınır; "cap sync ios" bu dosyalara dokunmaz (yalnız web dosyalarını ve Package.swift'i yeniler).
// Kullanım: node ios-ortak/kur.mjs <klasör>   (ör. unitica; Playwright + Chromium gerekir: simge ve açılış görseli)
// Yaptıkları (ayrıntı ve gerekçe: ios-ortak/README.md):
//   Info.plist: AdMob uygulama kimliği (<klasör>/ios/admob.properties), SKAdNetwork, izleme izni metni (ATT),
//               şifreleme beyanı (ITSAppUsesNonExemptEncryption = false), arm64, yalnız dikey ekran
//   proje:      yalnız iPhone (TARGETED_DEVICE_FAMILY = 1), sürüm Android versionName'den
//   görseller:  1024 px simge (saydamlıksız; Android uyarlanabilir simgesinden ya da <klasör>/www/img/icon.svg),
//               açılış ekranı: uygulamanın zemin rengi (Capacitor'ın beyaz açılışı yerine)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Google'ın SKAdNetwork kimliği (AdMob, iOS 14+ yükleme ölçümü). Google'ın önerdiği ortak ağ listesi uzundur; yalnız
// Google'ın kendisi yeterlidir, öteki ağlar AdMob aracılığı (mediation) kullanılırsa eklenir.
export const SKAD = ['cstr6suwn9.skadnetwork'];
export const ATT_METNI = 'Your data will be used to show you more relevant ads. You can change this at any time in Settings.';

/** admob.properties metni → { app, banner, gecis } (gradle.properties ile aynı anahtarlar) */
export function admobOku(metin) {
  const al = (ad) => {
    const d = new RegExp(`^${ad}=(.+)$`, 'm').exec(metin)?.[1].trim();
    if (!d) throw new Error(`admob.properties: ${ad} yok`);
    return d;
  };
  return { app: al('ADMOB_APP_ID'), banner: al('ADMOB_BANNER_ID'), gecis: al('ADMOB_INTERSTITIAL_ID') };
}

const kacis = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Info.plist'ten bir anahtarı değeriyle birlikte siler (değer: string, true/false, ya da iç içe olmayan array). */
export function plistSil(plist, anahtar) {
  const k = anahtar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return plist.replace(new RegExp(`\\s*<key>${k}</key>\\s*(<string>[^<]*</string>|<true/>|<false/>|<array>[\\s\\S]*?</array>)`), '');
}

/** Capacitor'ın Info.plist şablonuna App Store ayarlarını yazar; tekrar çalıştırılınca aynı sonucu verir. */
export function plistAyarla(plist, { admobApp, ad }) {
  for (const a of ['GADApplicationIdentifier', 'SKAdNetworkItems', 'NSUserTrackingUsageDescription', 'ITSAppUsesNonExemptEncryption',
    'UIRequiredDeviceCapabilities', 'UISupportedInterfaceOrientations', 'UISupportedInterfaceOrientations~ipad', 'CFBundleDisplayName']) {
    plist = plistSil(plist, a);
  }
  const ek = [
    `\t<key>CFBundleDisplayName</key>\n\t<string>${kacis(ad)}</string>`,
    `\t<key>GADApplicationIdentifier</key>\n\t<string>${kacis(admobApp)}</string>`,
    `\t<key>SKAdNetworkItems</key>\n\t<array>\n${SKAD.map((s) => `\t\t<dict>\n\t\t\t<key>SKAdNetworkIdentifier</key>\n\t\t\t<string>${s}</string>\n\t\t</dict>`).join('\n')}\n\t</array>`,
    `\t<key>NSUserTrackingUsageDescription</key>\n\t<string>${ATT_METNI}</string>`,
    `\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>`,
    `\t<key>UIRequiredDeviceCapabilities</key>\n\t<array>\n\t\t<string>arm64</string>\n\t</array>`,
    `\t<key>UISupportedInterfaceOrientations</key>\n\t<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t</array>`,
  ].join('\n');
  const son = plist.lastIndexOf('</dict>');
  return plist.slice(0, son).replace(/\s*$/, '\n') + ek + '\n' + plist.slice(son);
}

/** project.pbxproj: yalnız iPhone ve Android'deki sürüm */
export function projeAyarla(pbx, surum) {
  return pbx.replace(/TARGETED_DEVICE_FAMILY = "?[0-9,]+"?;/g, 'TARGETED_DEVICE_FAMILY = 1;')
    .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${surum};`);
}

/** <klasör>/android/app/build.gradle → versionName */
export function surumOku(klasor) {
  const g = fs.readFileSync(path.join(KOK, klasor, 'android', 'app', 'build.gradle'), 'utf8');
  const s = /versionName\s+['"]([^'"]+)['"]/.exec(g)?.[1];
  if (!s) throw new Error(`${klasor}: versionName yok`);
  return s;
}

// App Store simgesi saydamlık KANALI taşıyamaz (tamamen opak RGBA da reddedilir: ITMS-90717); tuval her zaman RGBA
// verdiği için simge 24 bit RGB PNG olarak burada kodlanır.
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (b) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function parca(tur, veri) {
  const b = Buffer.alloc(12 + veri.length);
  b.writeUInt32BE(veri.length, 0); b.write(tur, 4, 'ascii'); veri.copy(b, 8);
  b.writeUInt32BE(crc32(b.subarray(4, 8 + veri.length)), 8 + veri.length);
  return b;
}
/** RGBA piksel dizisi → saydamlıksız (renk türü 2) PNG */
export function rgbPng(w, h, rgba) {
  const ham = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    ham[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, j = y * (w * 3 + 1) + 1 + x * 3;
      ham[j] = rgba[i]; ham[j + 1] = rgba[i + 1]; ham[j + 2] = rgba[i + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), parca('IHDR', ihdr),
    parca('IDAT', zlib.deflateSync(ham, { level: 9 })), parca('IEND', Buffer.alloc(0))]);
}

/** Simge (1024, saydamlıksız) ve açılış görseli (2732, zemin rengi) — Playwright tuvaliyle */
async function gorseller(klasor, zemin) {
  const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
  const { chromium } = await import(pathToFileURL(PW).href);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const veri = (f) => `data:${f.endsWith('.svg') ? 'image/svg+xml' : 'image/png'};base64,` + fs.readFileSync(f).toString('base64');
  const svg = path.join(KOK, klasor, 'www', 'img', 'icon.svg');
  const res = path.join(KOK, klasor, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi');
  const katman = fs.existsSync(svg) ? [veri(svg)]
    : [veri(path.join(res, 'ic_launcher_background.png')), veri(path.join(res, 'ic_launcher_foreground.png'))];
  try {
    const p = await b.newPage();
    const [simge, acilis] = await p.evaluate(async ([katman, zemin, svgVar]) => {
      const yukle = async (src) => { const i = new Image(); i.src = src; await i.decode(); return i; };
      const resimler = await Promise.all(katman.map(yukle));
      const c = Object.assign(document.createElement('canvas'), { width: 1024, height: 1024 });
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.fillStyle = zemin; g.fillRect(0, 0, 1024, 1024);   // App Store simgesi saydamlık taşımaz
      for (const r of resimler) {
        if (svgVar) g.drawImage(r, 0, 0, 1024, 1024);
        else {
          // Android uyarlanabilir simgesi: 108 dp tuvalin başlatıcıda görünen ortadaki 90 dp'si (Play simgesiyle aynı kırpım)
          const k = r.width * 90 / 108, x = (r.width - k) / 2;
          g.drawImage(r, x, x, k, k, 0, 0, 1024, 1024);
        }
      }
      const d = Object.assign(document.createElement('canvas'), { width: 2732, height: 2732 });
      const h = d.getContext('2d');
      h.fillStyle = zemin; h.fillRect(0, 0, 2732, 2732);
      const piks = g.getImageData(0, 0, 1024, 1024).data;
      let ikili = '';
      for (let i = 0; i < piks.length; i += 0x8000) ikili += String.fromCharCode(...piks.subarray(i, i + 0x8000));
      return [btoa(ikili), d.toDataURL('image/png').split(',')[1]];
    }, [katman, zemin, fs.existsSync(svg)]);
    const xc = path.join(KOK, klasor, 'ios', 'App', 'App', 'Assets.xcassets');
    fs.writeFileSync(path.join(xc, 'AppIcon.appiconset', 'AppIcon-512@2x.png'), rgbPng(1024, 1024, Buffer.from(simge, 'base64')));
    for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
      fs.writeFileSync(path.join(xc, 'Splash.imageset', f), Buffer.from(acilis, 'base64'));
    }
  } finally {
    await b.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const klasor = process.argv[2];
  if (!klasor || !fs.existsSync(path.join(KOK, klasor, 'ios', 'App'))) {
    console.error('kullanım: node ios-ortak/kur.mjs <klasör>   (önce: cd <klasör> && npx cap add ios)'); process.exit(1);
  }
  const cap = JSON.parse(fs.readFileSync(path.join(KOK, klasor, 'capacitor.config.json'), 'utf8'));
  const admob = admobOku(fs.readFileSync(path.join(KOK, klasor, 'ios', 'admob.properties'), 'utf8'));
  const surum = surumOku(klasor);
  const pl = path.join(KOK, klasor, 'ios', 'App', 'App', 'Info.plist');
  fs.writeFileSync(pl, plistAyarla(fs.readFileSync(pl, 'utf8'), { admobApp: admob.app, ad: cap.appName }));
  const pb = path.join(KOK, klasor, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
  fs.writeFileSync(pb, projeAyarla(fs.readFileSync(pb, 'utf8'), surum));
  await gorseller(klasor, cap.backgroundColor || '#000000');
  console.log(`${klasor}: Info.plist, proje (sürüm ${surum}, yalnız iPhone), simge ve açılış görseli yazıldı`);
}
