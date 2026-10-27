// Ses ölçer hesapları (saf işlevler; node:test ile sınanır).
//
// Ölçüm telefonda yapılır (SesIsleyici.java): mikrofon örnekleri A-ağırlık süzgecinden (aşağıdaki üç ikinci dereceden
// bölüm, örnekleme hızına göre burada tasarlanır ve eklentiye verilir) geçer, "hızlı" (F, 125 ms) zaman ağırlığıyla
// karesel ortalaması alınır. Sonuç tam ölçekli sinüse göre dBFS(A)'dır. Kalibrasyonla (referans ölçer) dB(A)'ya çevrilir:
// dB = dBFS + ofset. Kalibrasyonsuz değer yalnız görelidir.
//
// Eşikler özgün uygulamadan: bantlar 40/60/80/100 dB(A), güvenlik 70/85 dB(A), NIOSH 85 dB(A)'da 8 saat ve her 3 dB'de
// yarıya iner. Kalibrasyon: referans 20…140 dB(A), ölçüm en az 5 sn, kabul edilen ofset 70…150 dB.

export const BANDS = [
  { id: 'whisper', below: 40 },
  { id: 'library', below: 60 },
  { id: 'office', below: 80 },
  { id: 'traffic', below: 100 },
  { id: 'concert', below: Infinity },
];
export const SAFE = { caution: 70, risk: 85 };
export const CALIB = { refMin: 20, refMax: 140, minSeconds: 5, offsetMin: 70, offsetMax: 150 };
export const GAUGE = { dbfsMin: -90, dbfsMax: 0, dbMin: 0, dbMax: 120 };
export const FAST_TAU = 0.125;
export const CLIP = 0.99;

export const band = (db) => BANDS.find((b) => db < b.below).id;

export function safety(db) {
  if (db < SAFE.caution) return 'safe';
  if (db < SAFE.risk) return 'caution';
  return 'risk';
}

export function status(db) {
  if (db < SAFE.caution) return 'normal';
  if (db < SAFE.risk) return 'loud';
  return 'very_loud';
}

/** NIOSH: 85 dB(A)'da 8 saat, her 3 dB artışta süre yarıya iner (saniye). */
export const nioshSeconds = (db) => 8 * 3600 / 2 ** ((db - 85) / 3);

/** Süreyi okunur birime çevirir: { unit: 'h' | 'min' | 's', value } */
export function duration(sec) {
  if (sec >= 3600) return { unit: 'h', value: Math.round(sec / 360) / 10 };
  if (sec >= 60) return { unit: 'min', value: Math.round(sec / 60) };
  return { unit: 's', value: Math.max(1, Math.round(sec)) };
}

/** Ortalama (Leq) için enerji toplayıcı: blokların dBFS(A) değeri ve süresiyle. */
export function leqStart() { return { energy: 0, seconds: 0, max: -Infinity }; }
export function leqAdd(st, blockDb, seconds, fastDb) {
  const e = st.energy + 10 ** (blockDb / 10) * seconds;
  const s = st.seconds + seconds;
  return { energy: e, seconds: s, max: Math.max(st.max, fastDb ?? blockDb) };
}
export const leqValue = (st) => (st.seconds > 0 && st.energy > 0 ? 10 * Math.log10(st.energy / st.seconds) : null);

/** Kalibrasyon: referans ölçerin dB(A) değeri ve telefonun aynı sürede okuduğu ortalama dBFS(A). */
export function calibrationOffset(refDb, phoneDbfs) {
  if (!(refDb >= CALIB.refMin && refDb <= CALIB.refMax) || !Number.isFinite(phoneDbfs)) return { ok: false };
  const offset = refDb - phoneDbfs;
  if (offset < CALIB.offsetMin || offset > CALIB.offsetMax) return { ok: false };
  return { ok: true, offset: Math.round(offset * 10) / 10 };
}

// ---- A-ağırlık süzgeci (IEC 61672 çözümsel biçimi, çift doğrusal dönüşümle sayısal)
const F1 = 20.598997, F2 = 107.65265, F3 = 737.86223, F4 = 12194.217;

/** Çözümsel A-ağırlık (dB), karşılaştırma için. */
export function aWeightDb(f) {
  const f2 = f * f;
  const ra = (F4 ** 2 * f2 * f2) / ((f2 + F1 ** 2) * Math.sqrt((f2 + F2 ** 2) * (f2 + F3 ** 2)) * (f2 + F4 ** 2));
  return 20 * Math.log10(ra) + 2.0;
}

/** Örnekleme hızı fs için üç bölüm: [[b0, b1, b2, a1, a2], …]; 1 kHz'de kazanç 0 dB. */
export function aWeightingSos(fs) {
  const k = 2 * fs;
  const w = (f) => k * Math.tan(Math.PI * f / fs); // ön bükme: kutup frekansları sayısal tarafta yerinde kalır
  const p = (om) => (k - om) / (k + om);
  const hp2 = (om) => { // (s / (s + ω))²
    const g = (k / (k + om)) ** 2, q = p(om);
    return [g, -2 * g, g, -2 * q, q * q];
  };
  const p2 = p(w(F2)), p3 = p(w(F3));
  const g3 = 1 / ((k + w(F2)) * (k + w(F3)));
  const sos = [hp2(w(F1)), hp2(w(F4)), [g3, 2 * g3, g3, -(p2 + p3), p2 * p3]];
  const gain = 1 / magnitude(sos, 1000, fs);
  sos[0] = sos[0].map((c, i) => (i < 3 ? c * gain : c));
  return sos;
}

/** Bölümlerin f frekansındaki genliği. */
export function magnitude(sos, f, fs) {
  const om = 2 * Math.PI * f / fs;
  const zr = Math.cos(om), zi = -Math.sin(om); // z^-1
  const z2r = Math.cos(2 * om), z2i = -Math.sin(2 * om);
  let m = 1;
  for (const [b0, b1, b2, a1, a2] of sos) {
    const nr = b0 + b1 * zr + b2 * z2r, ni = b1 * zi + b2 * z2i;
    const dr = 1 + a1 * zr + a2 * z2r, di = a1 * zi + a2 * z2i;
    m *= Math.hypot(nr, ni) / Math.hypot(dr, di);
  }
  return m;
}

/** Eklentiye verilecek süzgeç takımı: yaygın örnekleme hızlarının her biri için bölümler. */
export function filterSet() {
  return Object.fromEntries([48000, 44100].map((fs) => [String(fs), aWeightingSos(fs)]));
}

/** Tarayıcı ve sınama için aynı işleme (SesIsleyici.java ile birebir): 16 bitlik örnek dizisi → blok ölçüleri. */
export function createProcessor(fs, sos) {
  const st = sos.map(() => [0, 0]);
  const alpha = 1 - Math.exp(-1 / (FAST_TAU * fs));
  let fast = 0;
  return function block(samples) {
    let sum = 0, peak = 0;
    for (let i = 0; i < samples.length; i++) {
      let x = samples[i] / 32768;
      const ax = Math.abs(x);
      if (ax > peak) peak = ax;
      for (let j = 0; j < sos.length; j++) { // doğrudan biçim II, aktarılmış
        const [b0, b1, b2, a1, a2] = sos[j], s = st[j];
        const y = b0 * x + s[0];
        s[0] = b1 * x - a1 * y + s[1];
        s[1] = b2 * x - a2 * y;
        x = y;
      }
      const sq = x * x;
      sum += sq;
      fast += (sq - fast) * alpha;
    }
    const db = (ms) => (ms > 0 ? 10 * Math.log10(2 * ms) : -120);
    return { fast: Math.max(-120, db(fast)), block: Math.max(-120, db(sum / samples.length)), peak, clipping: peak >= CLIP };
  };
}
