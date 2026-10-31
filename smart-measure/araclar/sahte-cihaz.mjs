// Mağaza görselleri ve tarayıcı denemesi için sahte telefon: window.Capacitor (isNativePlatform true) ile Olcer, App,
// Haptics ve NativePurchases eklentilerinin taklidi. Değerler sentetiktir; kamera görüntüsü çizilmiş bir sahnedir
// (gerçek kamera yok). AdMob taklidi yoktur: görsellerde reklam olmaz. Sayfaya addInitScript ile verilir:
//   await baglam.addInitScript(sahteCihaz, { lux: 420, ... })
// window.__sahte üzerinden canlı değiştirilir (ör. kameranın bakış açısı). { platform: 'ios' }: iPhone (App Store ürünleri,
// getPlatform 'ios'); Olcer'in iPhone karşılığı Swift eklentisidir, burada aynı taklit kullanılır.

/** Tarayıcıda çalışır (dışarıdan değişken almaz; ayarlar tek argüman). */
export function sahteCihaz(ayar = {}) {
  const A = Object.assign({
    gravity: { x: -0.035, y: 0.025, z: 9.806 }, lux: 420, sesDbfs: -52, kalibre: true, kamera: true,
    pitch: 32, bearing: 10, gurultu: 0.004, display: { widthPx: 1080, heightPx: 2340, xdpi: 480, ydpi: 480, densityDpi: 480, density: 3 },
  }, ayar);
  const S = window.__sahte = { ...A };
  const dinleyici = {};
  const yay = (ad, veri) => (dinleyici[ad] || []).forEach((f) => f(veri));
  const zam = { };
  const basla = (ad, ms, uret) => { clearInterval(zam[ad]); zam[ad] = setInterval(() => yay(ad, uret()), ms); };
  const dur = (ad) => { clearInterval(zam[ad]); delete zam[ad]; };
  let tohum = 7;
  const rnd = () => { tohum = (tohum * 16807) % 2147483647; return tohum / 2147483647 - 0.5; };
  const DEG = Math.PI / 180;
  // pitch (ufkun altı) ve bearing'den döndürme matrisi: kameranın yönü d = −(R2, R5, R8)
  const matris = () => {
    const p = S.pitch * DEG, b = S.bearing * DEG;
    const d = [Math.cos(p) * Math.sin(b), Math.cos(p) * Math.cos(b), -Math.sin(p)];
    const ust = [0, 0, 1];
    // cihaz z = −d; cihaz y = dünya yukarısının d'ye dik bileşeni; cihaz x = y × z
    const z = d.map((v) => -v);
    const dot = ust[0] * z[0] + ust[1] * z[1] + ust[2] * z[2];
    let y = ust.map((v, i) => v - dot * z[i]);
    const n = Math.hypot(...y); y = y.map((v) => v / n);
    const x = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
    return [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
  };
  const eklenti = (yontemler) => new Proxy(yontemler, {
    get(h, ad) {
      if (ad === 'addListener') return (olay, f) => { (dinleyici[olay] = dinleyici[olay] || []).push(f); return Promise.resolve({ remove: async () => { dinleyici[olay] = (dinleyici[olay] || []).filter((x) => x !== f); } }); };
      if (ad in h) return h[ad];
      return async () => ({});
    },
  });
  const Olcer = eklenti({
    bilgi: async () => ({ debug: false, versionName: '1.0.0', versionCode: 1 }),
    yetenekler: async () => ({
      sensors: { accelerometer: true, gravity: true, gyroscope: true, rotationVector: true, gameRotationVector: true, light: true },
      microphone: true, rearCamera: true, flash: true, arcore: false, display: S.display,
    }),
    checkPermissions: async () => ({ camera: 'granted', microphone: 'granted' }),
    requestPermissions: async () => ({ camera: 'granted', microphone: 'granted' }),
    yercekimiBaslat: async () => { basla('yercekimi', 33, () => ({ x: S.gravity.x + rnd() * S.gurultu, y: S.gravity.y + rnd() * S.gurultu, z: S.gravity.z, t: performance.now(), kaynak: 'gravity' })); return { var: true, kaynak: 'gravity' }; },
    yercekimiDurdur: async () => dur('yercekimi'),
    yonelimBaslat: async () => { basla('yonelim', 33, () => ({ m: matris(), t: performance.now(), kaynak: 'game' })); return { var: true, kaynak: 'game' }; },
    yonelimDurdur: async () => dur('yonelim'),
    isikBaslat: async () => { basla('isik', 120, () => ({ lux: Math.max(0, S.lux * (1 + rnd() * 0.04)), t: performance.now() })); return { var: true }; },
    isikDurdur: async () => dur('isik'),
    sesBaslat: async () => {
      let i = 0;
      basla('ses', 100, () => { i++; const v = S.sesDbfs + 3.2 * Math.sin(i / 7) + 2.5 * rnd() + (i % 37 === 0 ? 9 : 0); return { hizli: v, blok: v - 0.4, tepe: 0.05, kirpma: false, sure: 0.1, kaynak: 'unprocessed' }; });
      return { var: true, kaynak: 'unprocessed' };
    },
    sesDurdur: async () => dur('ses'),
    kopyala: async () => ({}), paylas: async () => ({}), cubuklar: async () => ({}), ekranAcik: async () => ({}), ayarlariAc: async () => ({}), baglantiAc: async () => ({}),
  });
  const App = eklenti({ exitApp: async () => ({}) });
  const Haptics = eklenti({});
  const ios = A.platform === 'ios';
  const IOS = 'com.poyrazworkshop.smartmeasure.adfree.';
  const NativePurchases = eklenti({
    getPurchases: async () => ({ purchases: [] }),
    getProducts: async () => ({ products: ios
      ? [{ identifier: IOS + 'monthly', priceString: '₺24,99', price: 24.99 }, { identifier: IOS + 'yearly', priceString: '₺249,99', price: 249.99 }]
      : [] }),
  });
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => (ios ? 'ios' : 'android'), Plugins: { Olcer, App, Haptics, NativePurchases } };

  // Kamera: çizilmiş sahne (zemin, duvar, kapı ve bir dolap) — gerçek kamera görüntüsü değildir
  if (A.kamera) {
    const md = navigator.mediaDevices || (navigator.mediaDevices = {});
    md.getUserMedia = async () => {
      const c = document.createElement('canvas');
      c.width = 960; c.height = 1280;
      const g = c.getContext('2d');
      const ciz = () => {
        const W = c.width, H = c.height, ufuk = H * 0.36;
        let gr = g.createLinearGradient(0, 0, 0, ufuk);
        gr.addColorStop(0, '#d9d4cb'); gr.addColorStop(1, '#c7c0b4');
        g.fillStyle = gr; g.fillRect(0, 0, W, ufuk);
        gr = g.createLinearGradient(0, ufuk, 0, H);
        gr.addColorStop(0, '#8a6a4a'); gr.addColorStop(1, '#5e4127');
        g.fillStyle = gr; g.fillRect(0, ufuk, W, H - ufuk);
        g.strokeStyle = 'rgba(40,25,10,.35)'; g.lineWidth = 3;
        for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(W / 2 + i * 26, ufuk); g.lineTo(W / 2 + i * 210, H); g.stroke(); }
        for (let k = 1; k < 9; k++) { const y = ufuk + (H - ufuk) * (k * k) / 81; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        g.fillStyle = '#efe9df'; g.fillRect(W * 0.58, ufuk - 380, 190, 380);                 // kapı
        g.strokeStyle = '#a99f90'; g.lineWidth = 8; g.strokeRect(W * 0.58, ufuk - 380, 190, 380);
        g.fillStyle = '#b08a52'; g.beginPath(); g.arc(W * 0.58 + 165, ufuk - 180, 9, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#3d5a73'; g.fillRect(W * 0.12, ufuk - 150, 260, 230);                   // dolap
        g.fillStyle = '#2f4659'; g.fillRect(W * 0.12, ufuk + 60, 260, 20);
        g.strokeStyle = '#26394a'; g.lineWidth = 4; g.strokeRect(W * 0.12 + 10, ufuk - 140, 115, 190); g.strokeRect(W * 0.12 + 135, ufuk - 140, 115, 190);
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(W * 0.12 + 130, ufuk + 92, 160, 18, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#6f8f5a'; g.beginPath(); g.ellipse(W * 0.2, ufuk + 330, 70, 70, 0, 0, Math.PI * 2); g.fill();  // halı deseni
        g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, 0, W, H);
      };
      ciz();
      const s = c.captureStream(15);
      setInterval(ciz, 200);
      const t = s.getVideoTracks()[0];
      t.getCapabilities = () => ({ torch: true });
      t.applyConstraints = async () => {};
      return s;
    };
  }
}

/** Ölçüm verisiyle dolu bir depo (geçmiş, kalibrasyonlar, telefon yüksekliği). */
export function ornekDepo(dil, tema, simdi = Date.now()) {
  const tr = dil === 'tr';
  const g = (dk) => simdi - dk * 60e3;
  return {
    settings: { theme: tema, language: dil, units: 'metric', cameraHeight: 1.42 },
    level: { mode: 'surface', unit: 'deg', tolerance: 0.5, vibrate: true, sound: false, cal: { bx: 0.02, by: -0.01, at: g(3000) }, ref: {} },
    ruler: { unit: 'mm', scaleX: 1, scaleY: 1, calibrated: true, tab: 'ruler', guides: { a: 10, b: 52.5 }, vguides: { a: 20, b: 60 }, arms: { a: 32, b: 118.5 }, view: 'inner' },
    sensors: { tab: 'sound', mode: 'live', offsetDb: 110, lastSoundDb: 57.8, lastSoundUnit: 'dB', lastSoundAt: g(14), lastLux: 420, lastLuxAt: g(14) },
    ar: { mode: 'distance' },
    favorites: ['level', 'ar', 'sound'],
    history: [
      { id: 'a1', time: g(6), tool: 'ar', label: tr ? 'AR mesafe' : 'AR distance', value: tr ? '3,48 m ± 9 cm' : '3.48 m ± 9 cm', note: tr ? 'Telefon yüksekliği: 1,42 m' : 'Phone height: 1.42 m' },
      { id: 'a2', time: g(21), tool: 'ruler', label: tr ? 'Ekran cetveli' : 'Screen ruler', value: tr ? '42,5 mm' : '42.5 mm', note: tr ? 'Kartla kalibre edildi' : 'Calibrated with a card' },
      { id: 'a3', time: g(48), tool: 'protractor', label: tr ? 'İç açı' : 'Inner angle', value: tr ? '86,5°' : '86.5°', note: '' },
      { id: 'a4', time: g(60 * 26), tool: 'ar', label: tr ? 'AR yükseklik' : 'AR height', value: tr ? '2,05 m ± 6 cm' : '2.05 m ± 6 cm', note: tr ? 'Telefon yüksekliği: 1,42 m' : 'Phone height: 1.42 m' },
      { id: 'a5', time: g(60 * 27), tool: 'ar', label: tr ? 'AR genişlik' : 'AR width', value: tr ? '91 cm ± 4 cm' : '91 cm ± 4 cm', note: tr ? 'Telefon yüksekliği: 1,42 m' : 'Phone height: 1.42 m' },
    ],
  };
}
