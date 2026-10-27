// Kıble Bul — uygulamanın kendi hesapları ve yerel arayüzü (node --test kible-bul/test/*.test.mjs; tarayıcı gerekmez).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const KB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (...p) => fs.readFileSync(path.join(KB, ...p), 'utf8');
const Q = await import('../www/js/qibla.js');
const W = await import('../www/js/wmm.js');
const C = await import('../www/js/cities.js');
const Qual = await import('../www/js/quality.js');

test('kıble açısı ve uzaklık bilinen değerlerle aynı (büyük daire, coğrafi kuzeyden)', () => {
  // Yaygın yayımlanan değerler: İstanbul 151,6°, New York 58,5°, Londra 119,0°, Cakarta 295,2°
  const yakin = (a, b, tol, ad) => assert.ok(Math.abs(a - b) <= tol, `${ad}: ${a} ≠ ${b}`);
  yakin(Q.qiblaBearing(41.0082, 28.9784), 151.62, 0.05, 'İstanbul');
  yakin(Q.qiblaBearing(40.7128, -74.006), 58.48, 0.05, 'New York');
  yakin(Q.qiblaBearing(51.5074, -0.1278), 118.99, 0.05, 'Londra');
  yakin(Q.qiblaBearing(-6.2088, 106.8456), 295.15, 0.05, 'Cakarta');
  yakin(Q.kaabaDistanceKm(41.0082, 28.9784), 2405, 3, 'İstanbul km');
  assert.equal(Q.atKaaba(21.422487, 39.826206), true);
  assert.equal(Q.atKaaba(21.43, 39.83), false);
  const yol = Q.greatCircle(40.7128, -74.006, Q.KAABA.lat, Q.KAABA.lon, 32);
  assert.equal(yol.length, 33);
  for (let i = 1; i < yol.length; i++) assert.ok(Math.abs(yol[i][1] - yol[i - 1][1]) < 180, 'boylam sıçramaz');
});

test('manyetik sapma: WMM 2025, NOAA/NCEI resmî sınama değerleri (WMM2025_TEST_VALUES.txt)', () => {
  // tarih, yükseklik km, enlem, boylam, F nT, eğim °, sapma °  — https://www.ncei.noaa.gov/sites/default/files/2025-02/WMM2025_TEST_VALUES.txt
  const D = [
    [2025.0, 0, 80, 0, 55178.5, 83.21, 1.28], [2025.0, 0, 0, 120, 41064.3, -14.93, -0.16], [2025.0, 0, -80, 240, 54698.2, -72.0, 68.78],
    [2025.0, 100, 80, 0, 52964.9, 83.26, 0.85], [2025.0, 100, 0, 120, 39032.1, -15.08, -0.15], [2025.0, 100, -80, 240, 52035.0, -72.19, 68.21],
    [2027.5, 0, 80, 0, 55253.9, 83.24, 2.59], [2027.5, 0, 0, 120, 41036.9, -14.65, -0.24], [2027.5, 0, -80, 240, 54474.2, -71.92, 68.49],
    [2027.5, 100, 80, 0, 53034.3, 83.29, 2.16], [2027.5, 100, 0, 120, 39007.4, -14.81, -0.23], [2027.5, 100, -80, 240, 51825.7, -72.1, 67.93],
  ];
  for (const [yil, h, lat, lon, F, I, Dk] of D) {
    const f = W.field(lat, lon, h, yil);
    assert.ok(Math.abs(f.f - F) < 0.11, `F ${yil} ${lat},${lon}: ${f.f}`);
    assert.ok(Math.abs(f.incl - I) < 0.006, `I ${yil} ${lat},${lon}: ${f.incl}`);
    assert.ok(Math.abs(f.decl - Dk) < 0.006, `D ${yil} ${lat},${lon}: ${f.decl}`);
  }
});

test('pusula yardımcıları: açı farkı, yumuşatma, dönme matrisinden yön', () => {
  assert.equal(Q.angleDiff(350, 10), 20);
  assert.equal(Q.angleDiff(10, 350), -20);
  assert.equal(Q.smoothAngle(359, 1, 0.5), 0);
  // telefon düz, üst kenar doğuya bakıyor: cihaz y ekseni = doğu → R[1]=1 (doğu), R[4]=0 (kuzey), R[8]=1 (ekran gökyüzüne)
  assert.equal(Math.round(Q.headingFromMatrix([0, 1, 0, -1, 0, 0, 0, 0, 1])), 90);
  assert.equal(Math.round(Q.headingFromMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1])), 0);
  assert.equal(Q.fmtDeg(151.62, true), '151,6');
  assert.equal(Q.fmtKm(2405.07, '.'), '2.405');
});

test('kalite kararı: Android doğruluğu ve alan şiddeti (parazit)', () => {
  assert.equal(Qual.assess({ acc: 3, field: 46 }, 46).bad, false);
  assert.equal(Qual.assess({ acc: 1, field: 46 }, 46).reason, 'calibrate');
  assert.equal(Qual.assess({ acc: 3, field: 80 }, 46).reason, 'interference');
  const d = new Qual.Dwell(2000);
  assert.equal(d.update(true, 0), false);
  assert.equal(d.update(true, 2000), true);
});

test('yer arama: katlama ("İzmir" = "izmir" = "ızmir"), satır ayrıştırma, koordinat girişi', async () => {
  assert.equal(C.fold('İzmir'), C.fold('ızmir'));
  assert.equal(C.fold('Straße'), 'strasse');
  const satir = C.parseCities('Mecca|SA|21.42664|39.82563|1323\n');
  assert.deepEqual(satir[0].cc, 'SA');
  assert.equal(satir[0].pop, 1323000);
  const veri = oku('www', 'data', 'cities.txt').split('\n').filter(Boolean);
  assert.ok(veri.length > 30000 && veri.length < 40000, `${veri.length} yer`);
  for (const l of ['ar', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'tr']) assert.ok(fs.existsSync(path.join(KB, 'www', 'data', `cities.${l}.txt`)), l);
});

test('dil dosyaları: 11 dilin hepsinde İngilizcedeki bütün anahtarlar, aynı yer tutucular, \\u kaçışı yok', async () => {
  const en = (await import('../www/js/lang/en.js')).default.ui;
  const diller = ['tr', 'de', 'fr', 'es', 'pt', 'it', 'ru', 'ja', 'ko', 'ar'];
  const yt = (s) => (s.match(/\{\d+\}/g) || []).sort().join();
  for (const l of diller) {
    const d = (await import(`../www/js/lang/${l}.js`)).default;
    assert.deepEqual(Object.keys(d.ui).sort(), Object.keys(en).sort(), `${l}: anahtarlar`);
    for (const k of Object.keys(en)) assert.equal(yt(d.ui[k]), yt(en[k]), `${l}: ${k} yer tutucu`);
    assert.doesNotMatch(oku('www', 'js', 'lang', `${l}.js`), /\\u0[0-9a-f]{3}/i, `${l}: \\u kaçışı`);
  }
  assert.equal((await import('../www/js/lang/ar.js')).default.dir, 'rtl');
});

test('uygulama içi gizlilik metni AdMob ve NASA karolarıyla doğru (11 dil); "tek ağ kullanımı harita" iddiası yok', async () => {
  for (const l of ['en', 'tr', 'de', 'fr', 'es', 'pt', 'it', 'ru', 'ja', 'ko', 'ar']) {
    const ui = (await import(`../www/js/lang/${l}.js`)).default.ui;
    assert.match(ui['about.privacyText'], /AdMob/, `${l}: AdMob`);
    assert.match(ui['about.privacyText'], /NASA/, `${l}: NASA`);
    assert.match(ui['about.privacyText'], /Google Play/, `${l}: Google Play`);
    assert.ok(ui['about.privacyText'].includes(ui['settings.adPrivacy']), `${l}: metin ayar satırının adını anar`);
    for (const k of ['ad.label', 'ad.closeIn', 'ad.close', 'p.removeAds']) assert.ok(!(k in ui), `${l}: ${k} (GeoTerva reklamı) silinmeli`);
  }
  const en = (await import('../www/js/lang/en.js')).default.ui;
  assert.doesNotMatch(en['about.privacyText'], /only network use/);
});

test('yerel pusula eklentisi: sayfanın kullandığı arayüzle aynı (Compass.start/stop, "reading" { r, acc, field })', () => {
  const java = oku('android', 'app', 'src', 'main', 'java', 'com', 'poyrazworkshop', 'kiblebul', 'CompassPlugin.java');
  const js = oku('www', 'js', 'compass.js');
  assert.match(java, /@CapacitorPlugin\(name = "Compass"\)/);
  assert.match(js, /plugin\('Compass'\)/);
  for (const m of ['start', 'stop']) {
    assert.match(java, new RegExp(`@PluginMethod\\s+public void ${m}\\(PluginCall call\\)`));
    assert.match(js, new RegExp(`nat\\.${m}\\(\\)`));
  }
  assert.match(js, /addListener\('reading'/);
  assert.match(java, /notifyListeners\("reading", ret\)/);
  for (const k of ['"r"', '"acc"', '"rotAcc"', '"field"', '"available"', '"rotationVector"', '"magnetometer"']) assert.ok(java.includes(`ret.put(${k}`), k);
  for (const k of ['ev.r', 'ev.acc', 'ev.field', 'r.available']) assert.ok(js.includes(k), k);
  // özgündeki algılayıcı mantığı: dönme vektörü, yoksa ivmeölçer + manyetometre; SENSOR_DELAY_GAME; 33 ms
  for (const s of ['TYPE_ROTATION_VECTOR', 'TYPE_MAGNETIC_FIELD', 'TYPE_ACCELEROMETER', 'getRotationMatrixFromVector', 'getRotationMatrix(matrix, null, gravity, geomagnetic)', 'SENSOR_DELAY_GAME', 'MIN_INTERVAL_MS = 33', 'handleOnPause', 'handleOnResume']) {
    assert.ok(java.includes(s), s);
  }
  const ana = oku('android', 'app', 'src', 'main', 'java', 'com', 'poyrazworkshop', 'kiblebul', 'MainActivity.java');
  assert.match(ana, /registerPlugin\(CompassPlugin\.class\)/);
  assert.match(ana, /registerPlugin\(KibleYerelPlugin\.class\)/);
  assert.ok(ana.indexOf('registerPlugin(CompassPlugin.class)') < ana.indexOf('super.onCreate'), 'eklenti super.onCreate\'ten önce');
});

test('yeni kimlik: com.geoterva yok; izinler özgündeki gibi (yalnız yaklaşık konum)', () => {
  const ara = (dizin) => fs.readdirSync(dizin, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dizin, e.name);
    if (e.isDirectory()) return /node_modules|build|\.gradle|\.dene|\.karo|assets$/.test(e.name) ? [] : ara(p);
    return /\.(js|java|xml|json|gradle|properties|html|css)$/.test(e.name) ? [p] : [];
  });
  for (const f of [...ara(path.join(KB, 'www')), ...ara(path.join(KB, 'android')), path.join(KB, 'capacitor.config.json')]) {
    assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /com\.geoterva|geoterva\.kiblebul/, f);
  }
  assert.equal(JSON.parse(oku('capacitor.config.json')).appId, 'com.poyrazworkshop.kiblebul');
  const m = oku('android', 'app', 'src', 'main', 'AndroidManifest.xml');
  const izinler = [...m.matchAll(/<uses-permission android:name="([^"]+)"/g)].map((x) => x[1]).sort();
  assert.deepEqual(izinler, ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.INTERNET']);
  // VIBRATE (Haptics), BILLING (Play Billing), AD_ID ve ACCESS_NETWORK_STATE (AdMob) eklentilerin kendi manifest'lerinden gelir
  assert.match(m, /android\.hardware\.sensor\.compass" android:required="false"/);
  assert.match(m, /android:allowBackup="false"/);
  assert.match(m, /android:usesCleartextTraffic="false"/);
});

test('Hakkında: Poyraz Workshop, e-posta, gizlilik politikası adresi, GeoTerva yalnız düz bir satır; sürüm build.gradle ile aynı', async () => {
  const cfg = oku('www', 'js', 'config.js');
  assert.match(cfg, /developer: 'Poyraz Workshop'/);
  assert.match(cfg, /email: 'mahmuttari@gmail\.com'/);
  assert.match(cfg, /privacyUrl: 'https:\/\/mahmuttari\.github\.io\/Lispler\/kible-bul\/gizlilik\.html'/);
  const ay = oku('www', 'js', 'ui-settings.js');
  const surum = /export const VERSION = '([^']+)'/.exec(ay)[1];
  assert.equal(surum, /versionName\s+'([^']+)'/.exec(oku('android', 'app', 'build.gradle'))[1]);
  assert.match(ay, /'geoterva\.com'/);
  assert.doesNotMatch(ay, /class: 'pill', text: 'geoterva\.com'/, 'GeoTerva düğme/reklam değil, düz satır');
});
