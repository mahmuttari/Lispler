// iOS kabuklarının App Store ayarları (ios-ortak/kur.mjs çıktısı). Çevrimdışı; Xcode gerekmez.
// Çalıştırma: node --test ios-ortak/ios.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { admobOku, plistAyarla, projeAyarla, surumOku, kaynakEkle, storyboardAyarla, ATT_METNI } from './kur.mjs';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const UYGULAMALAR = ['unitica', 'calqora', 'smart-measure'];
const oku = (...p) => fs.readFileSync(path.join(KOK, ...p), 'utf8');

for (const u of UYGULAMALAR) {
  test(`${u}: Info.plist App Store ayarları`, () => {
    const pl = oku(u, 'ios', 'App', 'App', 'Info.plist');
    const admob = admobOku(oku(u, 'ios', 'admob.properties'));
    assert.match(pl, new RegExp(`<key>GADApplicationIdentifier</key>\\s*<string>${admob.app.replace(/[~]/g, '\\$&')}</string>`));
    assert.match(pl, /<key>SKAdNetworkIdentifier<\/key>\s*<string>cstr6suwn9\.skadnetwork<\/string>/);
    assert.ok(pl.includes(`<key>NSUserTrackingUsageDescription</key>\n\t<string>${ATT_METNI}</string>`));
    assert.match(pl, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
    assert.match(pl, /<key>UIRequiredDeviceCapabilities<\/key>\s*<array>\s*<string>arm64<\/string>\s*<\/array>/);
    assert.match(pl, /<key>UISupportedInterfaceOrientations<\/key>\s*<array>\s*<string>UIInterfaceOrientationPortrait<\/string>\s*<\/array>/);
    const ad = JSON.parse(oku(u, 'capacitor.config.json')).appName;
    assert.match(pl, new RegExp(`<key>CFBundleDisplayName</key>\\s*<string>${ad}</string>`));
    // her anahtar bir kez
    for (const k of ['GADApplicationIdentifier', 'CFBundleDisplayName', 'UISupportedInterfaceOrientations']) {
      assert.equal(pl.split(`<key>${k}</key>`).length - 1, 1, k);
    }
  });

  test(`${u}: proje yalnız iPhone, sürüm Android'le aynı, paket kimliği Play'dekiyle aynı`, () => {
    const pb = oku(u, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
    assert.doesNotMatch(pb, /TARGETED_DEVICE_FAMILY = "?1,2"?;/);
    assert.match(pb, /TARGETED_DEVICE_FAMILY = 1;/);
    const surum = surumOku(u);
    for (const [, s] of pb.matchAll(/MARKETING_VERSION = ([^;]+);/g)) assert.equal(s, surum);
    const appId = JSON.parse(oku(u, 'capacitor.config.json')).appId;
    for (const [, b] of pb.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)) assert.equal(b, appId);
  });

  test(`${u}: ios/App/App'teki her Swift dosyası App hedefinde; ViewController varsa storyboard onu kullanır; ek plist metinleri`, () => {
    const app = path.join(KOK, u, 'ios', 'App', 'App');
    const pb = oku(u, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
    const swift = fs.readdirSync(app).filter((f) => f.endsWith('.swift'));
    for (const f of swift) {
      assert.ok(pb.includes(`path = ${f}; sourceTree = "<group>"; };`), `${f}: dosya başvurusu yok (node ios-ortak/kur.mjs ${u} --yalniz-proje)`);
      assert.ok(pb.includes(`/* ${f} in Sources */,`), `${f}: Sources evresinde değil`);
    }
    const sb = oku(u, 'ios', 'App', 'App', 'Base.lproj', 'Main.storyboard');
    if (swift.includes('ViewController.swift')) assert.match(sb, /customClass="ViewController" customModule="App" customModuleProvider="target"/);
    else assert.match(sb, /customClass="CAPBridgeViewController" customModule="Capacitor"/);
    const ekDosya = path.join(KOK, u, 'ios', 'plist-ek.json');
    const pl = oku(u, 'ios', 'App', 'App', 'Info.plist');
    if (fs.existsSync(ekDosya)) {
      for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(ekDosya, 'utf8')))) {
        assert.ok(pl.includes(`<key>${k}</key>\n\t<string>${v}</string>`), `${k} Info.plist'te yok`);
      }
    }
    assert.equal(kaynakEkle(pb, swift), pb, 'kaynakEkle tekrar çalışınca değiştirmemeli');
    assert.equal(storyboardAyarla(storyboardAyarla(sb)), storyboardAyarla(sb));
  });

  test(`${u}: App Store simgesi 1024 px, saydamlık kanalı yok`, () => {
    const b = fs.readFileSync(path.join(KOK, u, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'));
    assert.equal(b.toString('latin1', 1, 4), 'PNG');
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [1024, 1024]);
    assert.equal(b[25], 2, 'renk türü 2 (RGB) olmalı; 6 (RGBA) App Store yüklemesinde reddedilir');
  });
}

test('Ölçü Kutusu: Swift eklentisi (Olcer) sayfanın ve Android eklentisinin bütün yöntemlerini verir; izin metinleri', () => {
  const sw = oku('smart-measure', 'ios', 'App', 'App', 'OlcerPlugin.swift');
  assert.match(sw, /public let jsName = "Olcer"/);
  assert.match(oku('smart-measure', 'ios', 'App', 'App', 'ViewController.swift'), /registerPluginInstance\(OlcerPlugin\(\)\)/);
  const liste = /pluginMethods: \[CAPPluginMethod\] = \[([\s\S]*?)\]\.map/.exec(sw)[1];
  const swift = new Set([...liste.matchAll(/"(\w+)"/g)].map((m) => m[1]));
  for (const y of swift) assert.match(sw, new RegExp(`func ${y}\\(_ call: CAPPluginCall\\)`), `${y}: Swift yöntemi yok`);
  const java = oku('smart-measure', 'android', 'app', 'src', 'main', 'java', 'com', 'poyrazworkshop', 'smartmeasure', 'OlcerPlugin.java');
  const javaY = new Set([...java.matchAll(/@PluginMethod\s+public void (\w+)\(/g)].map((m) => m[1]));
  for (const y of javaY) assert.ok(swift.has(y), `${y}: Android'de var, iPhone'da yok`);
  const js = oku('smart-measure', 'www', 'js', 'native.js');
  const cagrilan = new Set([...js.matchAll(/\b(?:O\(\)|o)\.(\w+)\(/g)].map((m) => m[1]).filter((y) => y !== 'addListener'));
  for (const y of cagrilan) assert.ok(swift.has(y), `${y}: native.js çağırıyor, Swift eklentisinde yok`);
  for (const olay of ['yercekimi', 'yonelim', 'ses', 'sesHata']) assert.ok(sw.includes(`olay("${olay}"`), `${olay} olayı`);
  const ek = JSON.parse(oku('smart-measure', 'ios', 'plist-ek.json'));
  assert.deepEqual(Object.keys(ek).sort(), ['NSCameraUsageDescription', 'NSMicrophoneUsageDescription']);
  for (const v of Object.values(ek)) assert.match(v, /never recorded/);
});

test('kur.mjs tekrar çalıştırılınca aynı sonucu verir', () => {
  const pl = oku('unitica', 'ios', 'App', 'App', 'Info.plist');
  assert.equal(plistAyarla(pl, { admobApp: admobOku(oku('unitica', 'ios', 'admob.properties')).app, ad: 'Unitica' }), pl);
  const pb = oku('unitica', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
  assert.equal(projeAyarla(pb, surumOku('unitica')), pb);
});
