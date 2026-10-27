// Ölçüm hesapları: su terazisi, kamerayla ölçüm, ses (A-ağırlık, NIOSH, kalibrasyon), ışık, cetvel, birimler.
// node --test smart-measure/test/*.test.mjs (tarayıcı gerekmez)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as L from '../www/js/olcum/level.js';
import * as A from '../www/js/olcum/ar.js';
import * as S from '../www/js/olcum/ses.js';
import * as I from '../www/js/olcum/isik.js';
import * as C from '../www/js/olcum/cetvel.js';
import * as B from '../www/js/olcum/birim.js';

const G = L.G, DEG = Math.PI / 180;
const yakin = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} ≠ ${b} (±${tol})`);
/** Yatay yüzeyde sağ taraf a° aşağıda, üst taraf b° aşağıda duran telefonun okuması */
const egik = (a, b) => ({ x: -G * Math.sin(a * DEG), y: -G * Math.sin(b * DEG), z: G * Math.cos(a * DEG) * Math.cos(b * DEG) });

test('su terazisi: yüzey kipi işaretleri ve durumlar', () => {
  const r = L.reading('surface', egik(2, 0));
  yakin(r.x, 2, 0.01); yakin(r.y, 0, 0.01);
  assert.equal(L.stateKey(r, 0.5), 'lv_state_right_low');
  assert.equal(L.stateKey(L.reading('surface', egik(-2, 0)), 0.5), 'lv_state_left_low');
  assert.equal(L.stateKey(L.reading('surface', egik(0, 3)), 0.5), 'lv_state_top_low');
  assert.equal(L.stateKey(L.reading('surface', egik(0, -3)), 0.5), 'lv_state_bottom_low');
  assert.equal(L.stateKey(L.reading('surface', egik(0.3, -0.2)), 0.5), 'lv_state_level');
  assert.equal(L.stateKey(L.reading('surface', { x: 0, y: G, z: 0 }), 0.5), 'lv_state_hold_flat');
  assert.equal(L.stateKey(L.reading('surface', { x: 0, y: 0, z: 0 }), 0.5), 'lv_state_no_data');
  // kabarcık yüksek tarafa kayar: sağ alçakta sola
  assert.ok(L.bubble(L.reading('surface', egik(2, 0))).x < 0);
});

test('su terazisi: çizgi kipinde 0° ve 90° hedef, yükselen / alçalan', () => {
  const yatay = L.reading('line', { x: G, y: 0, z: 0 });
  yakin(yatay.primary, 0, 1e-9);
  assert.equal(L.stateKey(yatay, 0.5), 'lv_state_on_target');
  const dik = L.reading('line', { x: 0.05, y: G, z: 0 });
  assert.equal(L.stateKey(dik, 0.5), 'lv_state_on_target');
  const yukari = L.reading('line', { x: G * Math.cos(10 * DEG), y: G * Math.sin(10 * DEG), z: 0 });
  yakin(yukari.angle, 10, 1e-9);
  assert.equal(L.stateKey(yukari, 0.5), 'lv_state_rising');
  assert.equal(L.stateKey(L.reading('line', { x: G * Math.cos(10 * DEG), y: -G * Math.sin(10 * DEG), z: 0 }), 0.5), 'lv_state_falling');
  assert.equal(L.stateKey(L.reading('line', { x: 0, y: 0, z: G }), 0.5), 'lv_state_hold_upright');
  yakin(L.grade(45), 100, 1e-9);
  assert.equal(L.grade(90), null);
});

test('su terazisi: dikey kipte yan eğim ve ileri/geri', () => {
  const t = 1.5 * DEG;
  const sag = L.reading('vertical', { x: -G * Math.sin(t), y: G * Math.cos(t), z: 0 });
  yakin(sag.side, 1.5, 1e-9);
  assert.equal(L.stateKey(sag, 0.5), 'lv_state_leans_right');
  const arka = L.reading('vertical', { x: 0, y: G * Math.cos(t), z: G * Math.sin(t) });
  assert.equal(L.stateKey(arka, 0.5), 'lv_state_leans_back');
  assert.equal(L.stateKey(L.reading('vertical', { x: 0, y: G * Math.cos(t), z: -G * Math.sin(t) }), 0.5), 'lv_state_leans_forward');
  assert.equal(L.stateKey(L.reading('vertical', { x: 0, y: G, z: 0 }), 0.5), 'lv_state_on_target');
});

test('su terazisi: ters çevirme kalibrasyonu kaymayı ve yüzey eğimini ayırır', () => {
  const kayma = { x: 0.12, y: -0.05 };
  const yuzey = egik(0.8, -0.3);
  // 180° döndürülünce gerçek eğim x ve y'de işaret değiştirir, kayma değişmez
  const m1 = { x: yuzey.x + kayma.x, y: yuzey.y + kayma.y, z: yuzey.z };
  const m2 = { x: -yuzey.x + kayma.x, y: -yuzey.y + kayma.y, z: yuzey.z };
  const c = L.calibrate(m1, m2);
  assert.ok(c.ok);
  yakin(c.cal.bx, kayma.x, 1e-12); yakin(c.cal.by, kayma.y, 1e-12);
  yakin(c.surfaceTiltDeg, Math.hypot(0.8, 0.3), 0.01);
  // düzeltilmiş okuma gerçek eğimi verir
  const r = L.reading('surface', L.corrected(m1, c.cal));
  yakin(r.x, 0.8, 0.01); yakin(r.y, -0.3, 0.01);
  // tek adım: yüzey düz sayılır
  const tek = L.calibrate({ x: 0.1, y: 0.1, z: G });
  assert.deepEqual(tek.cal, { bx: 0.1, by: 0.1 });
  assert.equal(tek.surfaceTiltDeg, 0);
  // 3°'den büyük kayma reddedilir
  assert.deepEqual(L.calibrate({ x: G * Math.sin(4 * DEG), y: 0, z: G }), { ok: false, reason: 'bias' });
});

test('su terazisi: kalibrasyon adımı veri azlığını, hareketi ve eğik duruşu yakalar', () => {
  const sabit = Array.from({ length: 40 }, () => ({ x: 0.01, y: -0.02, z: G }));
  assert.equal(L.calibrationStep(sabit).ok, true);
  assert.equal(L.calibrationStep(sabit.slice(0, 5)).reason, 'no_data');
  assert.equal(L.calibrationStep(sabit.map((s, i) => ({ ...s, x: i % 2 ? 0.4 : -0.4 }))).reason, 'moving');
  assert.equal(L.calibrationStep(sabit.map(() => egik(7, 0))).reason, 'not_flat');
});

test('su terazisi: referans ve hedef histerezisi', () => {
  const r = L.reading('surface', egik(1.2, 0.4));
  const ref = L.referenceFrom(r);
  const z = L.applyReference(r, ref);
  yakin(z.primary, 0, 1e-9);
  assert.equal(L.targetLatch(false, 0.4, 0.5), true);
  assert.equal(L.targetLatch(true, 0.7, 0.5), true);   // tam sınırda titremesin
  assert.equal(L.targetLatch(true, 0.9, 0.5), false);
});

test('kamera: bakış açısından zemin uzaklığı, iki nokta, yükseklik', () => {
  const h = 1.5;
  yakin(A.floorRange(h, 45), 1.5, 1e-12);
  yakin(A.floorRange(h, 30), 1.5 * Math.sqrt(3), 1e-12);
  // aynı uzaklıkta, 90° ayrık iki nokta: d = r·√2
  const r = A.floorRange(h, 30);
  yakin(A.distanceBetween(h, { pitch: 30, bearing: 0 }, { pitch: 30, bearing: 90 }).value, r * Math.SQRT2, 1e-9);
  // 2 m'lik kapı: taban 30° aşağıda, tepe ufkun üstünde
  const tepe = -Math.atan((2 - h) / r) / DEG;
  yakin(A.heightOf(h, { pitch: 30 }, { pitch: tepe }).value, 2, 1e-9);
  // yön bilinmiyorsa noktalar bakış doğrultusunda
  yakin(A.distanceBetween(h, { pitch: 45, bearing: null }, { pitch: 30, bearing: null }).value, r - 1.5, 1e-9);
});

test('kamera: belirsizlik pozitif ve ufka yaklaştıkça büyür', () => {
  const yakindan = A.rangeOf(1.5, { pitch: 40 }), uzaktan = A.rangeOf(1.5, { pitch: 10 });
  assert.ok(yakindan.sigma > 0 && uzaktan.sigma > yakindan.sigma);
  assert.ok(uzaktan.sigma / uzaktan.value > yakindan.sigma / yakindan.value);
});

test('kamera: 8° ve 85° sınırları, yükseklik gerekli', () => {
  assert.equal(A.aimProblem(1.4, { pitch: 7.9 }), 'AimLower');
  assert.equal(A.aimProblem(1.4, { pitch: 8 }), null);
  assert.equal(A.aimProblem(1.4, { pitch: 85.1 }), 'AimHigher');
  assert.equal(A.aimProblem(null, { pitch: 30 }), 'NeedHeight');
  // yükseklik kipinin tepe adımı ufkun üstüne bakabilir
  assert.equal(A.stepProblem('height', 1, 1.4, { pitch: -20 }), null);
  assert.equal(A.stepProblem('distance', 1, 1.4, { pitch: -20 }), 'AimLower');
});

test('kamera: döndürme matrisi ve Euler açılarından bakış', () => {
  // Telefon dik (beta 90): kamera ufka bakar; yatay (beta 0): dümdüz aşağı
  yakin(A.aimFromRotation(A.rotationFromEuler(0, 90, 0)).pitch, 0, 1e-9);
  yakin(A.aimFromRotation(A.rotationFromEuler(0, 0, 0)).pitch, 90, 1e-9);
  yakin(A.aimFromRotation(A.rotationFromEuler(0, 60, 0)).pitch, 30, 1e-9);
  yakin(A.aimFromGravity({ x: 0, y: G * Math.cos(30 * DEG), z: G * Math.sin(30 * DEG) }).pitch, 30, 1e-9);
  // dönme yönü değişince yön açısı değişir, eğim değişmez
  const a = A.aimFromRotation(A.rotationFromEuler(0, 60, 0)), b = A.aimFromRotation(A.rotationFromEuler(40, 60, 0));
  yakin(Math.abs(((a.bearing - b.bearing + 540) % 360) - 180), 40, 1e-6);
  yakin(b.pitch, 30, 1e-9);
});

test('ses: A-ağırlık süzgeci 48 ve 44,1 kHz\'de çözümsel eğriye ±1 dB yakın (20 Hz – 10 kHz)', () => {
  for (const fs of [48000, 44100]) {
    const sos = S.aWeightingSos(fs);
    for (const f of [20, 31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 10000]) {
      yakin(20 * Math.log10(S.magnitude(sos, f, fs)), S.aWeightDb(f), 1, `${fs} Hz, ${f} Hz`);
    }
    yakin(20 * Math.log10(S.magnitude(sos, 1000, fs)), 0, 1e-9);
  }
  yakin(S.aWeightDb(1000), 0, 0.01);
  yakin(S.aWeightDb(100), -19.1, 0.1);
});

test('ses: 1 kHz −20 dBFS sinüs −20 dBFS(A) okunur; kırpma algılanır', () => {
  const fs = 48000, p = S.createProcessor(fs, S.aWeightingSos(fs));
  let r;
  for (let k = 0; k < 20; k++) {
    const b = new Int16Array(4800);
    for (let i = 0; i < b.length; i++) b[i] = Math.round(3276.7 * Math.sin(2 * Math.PI * 1000 * (k * 4800 + i) / fs));
    r = p(b);
  }
  yakin(r.fast, -20, 0.05); yakin(r.block, -20, 0.05);
  assert.equal(r.clipping, false);
  const tam = new Int16Array(4800).map((_, i) => (i % 2 ? 32767 : -32768));
  assert.equal(p(tam).clipping, true);
});

test('ses: bantlar, güvenlik, NIOSH, Leq, kalibrasyon', () => {
  assert.deepEqual([35, 45, 65, 85, 105].map(S.band), ['whisper', 'library', 'office', 'traffic', 'concert']);
  assert.deepEqual([69.9, 70, 84.9, 85].map(S.safety), ['safe', 'caution', 'caution', 'risk']);
  assert.equal(S.nioshSeconds(85), 8 * 3600);
  assert.equal(S.nioshSeconds(88), 4 * 3600);
  assert.equal(S.nioshSeconds(100), 15 * 60);
  assert.deepEqual(S.duration(15 * 60), { unit: 'min', value: 15 });
  let st = S.leqStart();
  st = S.leqAdd(st, -40, 1); st = S.leqAdd(st, -40, 1);
  yakin(S.leqValue(st), -40, 1e-9);
  st = S.leqAdd(S.leqStart(), -30, 1); st = S.leqAdd(st, -50, 1);
  yakin(S.leqValue(st), 10 * Math.log10((1e-3 + 1e-5) / 2), 1e-9);
  assert.deepEqual(S.calibrationOffset(94, -30), { ok: true, offset: 124 });
  assert.equal(S.calibrationOffset(94, 40).ok, false);    // ofset 54: telefon mikrofonu için olası değil
  assert.equal(S.calibrationOffset(150, -30).ok, false);  // referans 20…140 dışında
});

test('ışık: özgün eşikler ve gösterge', () => {
  assert.deepEqual([10, 50, 200, 500, 900].map(I.level), ['very_dark', 'dim', 'normal', 'bright', 'very_bright']);
  assert.deepEqual([50, 150, 400, 2000].map(I.advice), ['too_dim', 'dim', 'suitable', 'too_bright']);
  assert.deepEqual([100, 500, 1500].map(I.office), ['dim', 'ok', 'bright']);
  assert.deepEqual([20, 100, 500, 5000].map(I.plants), ['dark', 'low', 'medium', 'bright']);
  yakin(I.gauge(50), 0.23, 1e-12); yakin(I.gauge(1000), 1, 1e-12); assert.equal(I.gauge(5000), 1); assert.equal(I.gauge(0), 0);
});

test('cetvel: ölçek, kart kalibrasyonu, çizgiler, açılar', () => {
  const rep = C.reportedMmPerPx({ xdpi: 420, ydpi: 420 }, 2.625);
  yakin(rep.x, 25.4 * 2.625 / 420, 1e-12);
  // gerçek yoğunluk %2 fazla: kart çerçevesi 54 mm'yi bildirilen ölçekte %2 daha az pikselde kaplar
  const gercek = rep.x / 1.02;
  const c = C.calibrationFromFrame(rep, C.CARD.widthMm / gercek, C.CARD.heightMm / gercek);
  assert.ok(c.ok); yakin(c.scaleX, 1 / 1.02, 1e-9);
  assert.equal(C.calibrationFromFrame(rep, 100, 100).ok, false);
  const t = C.ticks(20, 'mm');
  assert.equal(t.length, 21);
  assert.deepEqual(t.filter((x) => x.level === 'major').map((x) => x.label), ['0', '10', '20']);
  assert.deepEqual(C.ticks(20, 'cm').filter((x) => x.label).map((x) => x.label), ['0', '1', '2']);
  assert.equal(C.ticks(25.4, 'in').length, 17);
  assert.deepEqual(C.angles(26, 154), { inner: 128, outer: 232 });
  assert.equal(C.snapAngle(33.26), 33.5);
  assert.equal(C.lengthIn(25.4, 'in').value, 1);
});

test('birimler: dile göre ondalık ayırıcı, metrik ve İngiliz', () => {
  assert.equal(B.length(1.234, 'metric', 'tr'), '1,23 m');
  assert.equal(B.length(1.234, 'metric', 'en'), '1.23 m');
  assert.equal(B.length(0.87, 'metric', 'en'), '87 cm');
  assert.equal(B.length(1.6, 'imperial', 'en'), '5 ft 3 in');
  assert.equal(B.length(0.2, 'imperial', 'en'), '7.9 in');
  assert.equal(B.sigma(0.004, 'metric', 'en'), '1 cm');
  assert.equal(B.num(-0.00001, 1, 'tr'), '0,0');
  assert.equal(B.num(-2.5, 1, 'en'), '−2.5');
});
