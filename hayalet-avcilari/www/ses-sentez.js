/* ============================================================
   HAYALET AVCILARI — ZENGİN SENTEZ SES EFEKTLERİ (3.20.0)
   İnce bip seslerinin yerine oyun kalitesinde, sentezlenmiş efektler.
   Ses dosyası yok: her efekt bir kez OfflineAudioContext ile AudioBuffer'a
   render edilir, önbelleğe alınır ve çalınır. Kayıtlı hayalet sesleri
   (audio.smallGhost / audio.bigGhost) DEĞİŞTİRİLMEZ; onlara dokunulmaz.
   game.js'ten SONRA yüklenir; `audio` globaline yeni metotlar ekler.
   Sınama: test/ses-sentez.test.mjs.
   ============================================================ */

(function () {
  "use strict";

  const SS_SR = 44100;          // render örnekleme hızı (bellek için sabit)
  const SS_MAKS_SES = 10;       // aynı anda en çok ses
  const SS_TEPE = 0.7;          // her tamponun tepe genliği (0.3..0.9 arası)
  const SS_FADE = 0.002;        // baş/son 2 ms yumuşatma
  const ONCELIK = new Set(["win", "lose", "levelUp", "boss"]); // ses sınırını aşabilenler
  const BOSLUK = { hit: 35, kill: 60, pickup: 40 };            // efekt başına en az ara (ms)

  const SES_TARIFLERI = Object.create(null); // ad -> { sure, kategori, uret(b, sure) }
  const tamponlar = Object.create(null);      // ad -> AudioBuffer
  const sonZaman = Object.create(null);       // ad -> son çalma (performance.now)
  const ESKI = Object.create(null);           // ad -> dosya yüklenmeden önceki yöntem
  let anaZincir = null;
  let sesSayaci = 0;
  let sira = null;        // render sırası
  let siraNo = 0;
  let basladi = false;

  // ---------- çevrimdışı ses kurma yardımcıları ----------
  // Tek bir osilatör katmanı: frekans ve filtre zarfları, yumuşak atak, üstel sönüm
  function nota(b, o) {
    const t0 = o.t0 || 0, sure = o.sure;
    const osc = b.createOscillator();
    osc.type = o.tur || "sine";
    const f0 = o.f0 == null ? 440 : o.f0;
    osc.frequency.setValueAtTime(f0, t0);
    if (o.f1 != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + sure);
    if (o.detune) osc.detune.setValueAtTime(o.detune, t0);
    const g = b.createGain();
    const tepe = o.gain == null ? 0.3 : o.gain;
    const atak = Math.min(o.atak == null ? 0.005 : o.atak, sure * 0.5);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, tepe), t0 + atak);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + sure);
    let dugum = osc;
    if (o.filtre) dugum = filtre(b, dugum, o, t0, sure);
    dugum.connect(g);
    let cikis = g;
    if (o.boz) { const ws = bozDugumu(b, o.boz); g.connect(ws); cikis = ws; }
    cikis.connect(b.destination);
    osc.start(t0);
    osc.stop(t0 + sure + 0.02);
  }

  function filtre(b, kaynak, o, t0, sure) {
    const f = b.createBiquadFilter();
    f.type = o.filtre || "bandpass";
    f.frequency.setValueAtTime(Math.max(40, o.ff || 800), t0);
    if (o.ff1 != null) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.ff1), t0 + sure);
    f.Q.value = o.q == null ? 1 : o.q;
    kaynak.connect(f);
    return f;
  }

  // Filtreli gürültü katmanı; yumusak: alçak geçirenli (pürüzsüz) gürültü
  function gurultu(b, o) {
    const t0 = o.t0 || 0, sure = o.sure;
    const len = Math.max(1, Math.floor(SS_SR * sure));
    const buf = b.createBuffer(1, len, SS_SR);
    const ch = buf.getChannelData(0);
    let son = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      son = o.yumusak ? son * 0.86 + w * 0.14 : w;
      ch[i] = son;
    }
    const src = b.createBufferSource();
    src.buffer = buf;
    let dugum = src;
    dugum = filtre(b, dugum, o, t0, sure);
    const g = b.createGain();
    const tepe = o.gain == null ? 0.2 : o.gain;
    const atak = Math.min(o.atak == null ? 0.004 : o.atak, sure * 0.4);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, tepe), t0 + atak);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + sure);
    dugum.connect(g);
    let cikis = g;
    if (o.boz) { const ws = bozDugumu(b, o.boz); g.connect(ws); cikis = ws; }
    cikis.connect(b.destination);
    src.start(t0);
    src.stop(t0 + sure + 0.02);
  }

  // Yumuşak doyum (hafif bozulma) eğrisi
  function bozDugumu(b, miktar) {
    const ws = b.createWaveShaper();
    const n = 1024, egr = new Float32Array(n);
    const k = Math.max(0.1, miktar) * 50;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / (n - 1) - 1;
      egr[i] = Math.tanh(x * k) / Math.tanh(k);
    }
    ws.curve = egr;
    ws.oversample = "2x";
    return ws;
  }

  function tanim(ad, sure, kategori, uret) { SES_TARIFLERI[ad] = { sure, kategori, uret }; }

  // ---------- arayüz ve temel çatışma sesleri ----------
  tanim("click", 0.04, "sfx", (b) => {
    nota(b, { tur: "triangle", f0: 1500, f1: 900, sure: 0.04, gain: 0.25, atak: 0.002 });
    gurultu(b, { filtre: "highpass", ff: 3200, sure: 0.012, gain: 0.06 });
  });

  tanim("toast", 0.12, "sfx", (b) => {
    nota(b, { tur: "sine", f0: 880, sure: 0.12, gain: 0.22, atak: 0.004 });
    nota(b, { tur: "sine", f0: 1320, sure: 0.10, gain: 0.12, t0: 0.01, atak: 0.004 });
  });

  tanim("fire", 0.09, "fire", (b) => {
    nota(b, { tur: "triangle", f0: 900, f1: 360, sure: 0.09, gain: 0.30 });
    nota(b, { tur: "sine", f0: 600, f1: 200, sure: 0.07, gain: 0.12 });
    gurultu(b, { filtre: "bandpass", ff: 2500, ff1: 800, q: 0.8, sure: 0.035, gain: 0.08 });
  });

  tanim("fireBaloncuk", 0.10, "fire", (b) => {
    nota(b, { tur: "sine", f0: 480, f1: 920, sure: 0.09, gain: 0.30 });
    nota(b, { tur: "sine", f0: 720, f1: 1200, sure: 0.07, gain: 0.12, t0: 0.005 });
    gurultu(b, { filtre: "bandpass", ff: 1400, q: 1.2, sure: 0.02, gain: 0.05 });
  });

  tanim("fireLazer", 0.12, "fire", (b) => {
    nota(b, { tur: "sawtooth", f0: 2200, f1: 420, sure: 0.12, gain: 0.22, filtre: "highpass", ff: 700 });
    nota(b, { tur: "square", f0: 1600, f1: 260, sure: 0.12, gain: 0.11, boz: 0.25 });
    gurultu(b, { filtre: "highpass", ff: 3200, sure: 0.05, gain: 0.06 });
  });

  tanim("fireYesil", 0.14, "fire", (b) => {
    nota(b, { tur: "triangle", f0: 820, f1: 340, sure: 0.07, gain: 0.26 });
    nota(b, { tur: "triangle", f0: 820, f1: 340, sure: 0.07, gain: 0.26, t0: 0.045 });
    gurultu(b, { filtre: "bandpass", ff: 2200, ff1: 900, sure: 0.03, gain: 0.06 });
  });

  tanim("firePompali", 0.16, "fire", (b) => {
    gurultu(b, { filtre: "lowpass", ff: 1800, ff1: 200, sure: 0.14, gain: 0.30, boz: 0.2 });
    nota(b, { tur: "sine", f0: 150, f1: 45, sure: 0.16, gain: 0.35 });
    nota(b, { tur: "square", f0: 300, f1: 120, sure: 0.06, gain: 0.11 });
  });

  tanim("fireBazuka", 0.28, "fire", (b) => {
    nota(b, { tur: "sine", f0: 100, f1: 35, sure: 0.28, gain: 0.40 });
    nota(b, { tur: "triangle", f0: 160, f1: 50, sure: 0.22, gain: 0.18, filtre: "lowpass", ff: 600 });
    gurultu(b, { filtre: "lowpass", ff: 500, ff1: 60, sure: 0.24, gain: 0.24, yumusak: true, boz: 0.2 });
  });

  tanim("hit", 0.08, "sfx", (b) => {
    nota(b, { tur: "sine", f0: 190, f1: 70, sure: 0.08, gain: 0.40 });
    nota(b, { tur: "square", f0: 420, f1: 200, sure: 0.025, gain: 0.11 });
    gurultu(b, { filtre: "lowpass", ff: 1300, sure: 0.03, gain: 0.12 });
  });

  tanim("kill", 0.25, "sfx", (b) => {
    nota(b, { tur: "triangle", f0: 520, f1: 1250, sure: 0.22, gain: 0.22 });
    [0.06, 0.12, 0.18].forEach((t0, i) => {
      nota(b, { tur: "sine", f0: 1200 + i * 400, sure: 0.12, gain: 0.10, t0 });
    });
    gurultu(b, { filtre: "bandpass", ff: 2500, sure: 0.08, gain: 0.06 });
  });

  tanim("boss", 0.70, "ghost", (b) => {
    nota(b, { tur: "sawtooth", f0: 82, f1: 56, sure: 0.70, gain: 0.28, detune: -8,
      filtre: "lowpass", ff: 500, ff1: 180, q: 4 });
    nota(b, { tur: "sawtooth", f0: 86, f1: 60, sure: 0.70, gain: 0.24, detune: 8,
      filtre: "lowpass", ff: 520, ff1: 190, q: 4 });
    gurultu(b, { filtre: "lowpass", ff: 700, ff1: 120, sure: 0.70, gain: 0.14, yumusak: true, boz: 0.15 });
  });

  tanim("bossDie", 1.20, "ghost", (b) => {
    nota(b, { tur: "sawtooth", f0: 420, f1: 45, sure: 0.55, gain: 0.30,
      filtre: "lowpass", ff: 2000, ff1: 150, boz: 0.3 });
    gurultu(b, { filtre: "lowpass", ff: 1200, ff1: 80, sure: 0.50, gain: 0.24, yumusak: true });
    [523, 659, 784, 1047].forEach((f, i) => {
      nota(b, { tur: "triangle", f0: f, sure: i === 3 ? 0.25 : 0.14, gain: 0.15, t0: 0.64 + i * 0.09 });
    });
  });

  // ---------- ödül, mağaza ve kutlama sesleri ----------
  tanim("damage", 0.30, "sfx", (b) => {
    nota(b, { tur: "triangle", f0: 320, f1: 90, sure: 0.30, gain: 0.30, filtre: "lowpass", ff: 900 });
    nota(b, { tur: "sine", f0: 90, f1: 55, sure: 0.18, gain: 0.24 });
    gurultu(b, { filtre: "lowpass", ff: 700, sure: 0.08, gain: 0.10, yumusak: true });
  });

  tanim("pickup", 0.15, "sfx", (b) => {
    nota(b, { tur: "sine", f0: 1200, sure: 0.15, gain: 0.22 });
    nota(b, { tur: "sine", f0: 1800, sure: 0.12, gain: 0.12, t0: 0.005 });
    nota(b, { tur: "sine", f0: 2400, sure: 0.08, gain: 0.05, t0: 0.01 });
  });

  tanim("gem", 0.35, "sfx", (b) => {
    [1200, 1500, 1800, 2400].forEach((f, i) => {
      nota(b, { tur: "triangle", f0: f, sure: 0.20, gain: 0.11, t0: i * 0.055 });
    });
    gurultu(b, { filtre: "highpass", ff: 4000, sure: 0.12, gain: 0.04 });
  });

  tanim("emerald", 0.40, "sfx", (b) => {
    nota(b, { tur: "sine", f0: 600, f1: 2400, sure: 0.35, gain: 0.15, atak: 0.02 });
    [1600, 2000, 2600, 3200].forEach((f, i) => {
      nota(b, { tur: "sine", f0: f, sure: 0.14, gain: 0.06, t0: 0.10 + i * 0.075 });
    });
  });

  tanim("buy", 0.30, "sfx", (b) => {
    gurultu(b, { filtre: "highpass", ff: 3500, sure: 0.03, gain: 0.08 });
    nota(b, { tur: "triangle", f0: 1700, sure: 0.08, gain: 0.16 });
    nota(b, { tur: "triangle", f0: 2400, sure: 0.18, gain: 0.18, t0: 0.08 });
    nota(b, { tur: "sine", f0: 1200, sure: 0.10, gain: 0.08, t0: 0.08 });
  });

  tanim("unlock", 0.60, "sfx", (b) => {
    [660, 880, 1175, 1568].forEach((f, i) => {
      nota(b, { tur: "triangle", f0: f, sure: i === 3 ? 0.28 : 0.16, gain: 0.15, t0: i * 0.09 });
    });
  });

  tanim("heart", 0.60, "sfx", (b) => {
    [523, 659, 784, 1047].forEach((f, i) => {
      nota(b, { tur: "triangle", f0: f, sure: i === 3 ? 0.30 : 0.18, gain: 0.17, t0: i * 0.08 });
    });
  });

  tanim("levelUp", 0.90, "sfx", (b) => {
    [523, 659, 784, 1047].forEach((f, i) => {
      nota(b, { tur: "triangle", f0: f, sure: i === 3 ? 0.32 : 0.16, gain: 0.17, t0: i * 0.10 });
    });
    [1568, 2093].forEach((f, i) => {
      nota(b, { tur: "sine", f0: f, sure: 0.18, gain: 0.07, t0: 0.52 + i * 0.10 });
    });
  });

  tanim("win", 1.60, "sfx", (b) => {
    [523, 659, 784].forEach((f, i) => {
      nota(b, { tur: "triangle", f0: f, sure: 0.28, gain: 0.17, t0: i * 0.12 });
    });
    [523, 659, 784, 1047].forEach((f) => {
      nota(b, { tur: "triangle", f0: f, sure: 0.95, gain: 0.10, t0: 0.48, atak: 0.02 });
    });
    [1568, 2093].forEach((f, i) => {
      nota(b, { tur: "sine", f0: f, sure: 0.25, gain: 0.06, t0: 0.75 + i * 0.12 });
    });
  });

  tanim("lose", 1.40, "sfx", (b) => {
    nota(b, { tur: "sawtooth", f0: 440, f1: 220, sure: 0.35, gain: 0.22,
      filtre: "lowpass", ff: 1200, ff1: 300, q: 6, boz: 0.15 });
    nota(b, { tur: "sawtooth", f0: 330, f1: 110, sure: 0.90, gain: 0.22, t0: 0.30,
      filtre: "lowpass", ff: 1000, ff1: 200, q: 7, boz: 0.15 });
    nota(b, { tur: "sine", f0: 220, f1: 55, sure: 0.90, gain: 0.10, t0: 0.30 });
  });

  // ---------- güçlendirmeler, silahlar ve çevre sesleri ----------
  tanim("guc", 0.70, "sfx", (b) => {
    gurultu(b, { filtre: "bandpass", ff: 400, ff1: 2500, q: 1.4, sure: 0.65, gain: 0.18, yumusak: true });
    nota(b, { tur: "sine", f0: 300, f1: 1200, sure: 0.60, gain: 0.12, atak: 0.05 });
    [800, 1200, 1600].forEach((f, i) => {
      nota(b, { tur: "sine", f0: f, sure: 0.20, gain: 0.07, t0: 0.25 + i * 0.10 });
    });
  });

  tanim("bomba", 0.90, "sfx", (b) => {
    nota(b, { tur: "sine", f0: 70, f1: 30, sure: 0.80, gain: 0.40 });
    gurultu(b, { filtre: "lowpass", ff: 900, ff1: 80, sure: 0.80, gain: 0.30, yumusak: true, boz: 0.3 });
    gurultu(b, { filtre: "highpass", ff: 2600, sure: 0.06, gain: 0.12 });
  });

  tanim("buz", 0.70, "sfx", (b) => {
    [0, 0.06, 0.13, 0.21].forEach((t0, i) => {
      gurultu(b, { filtre: "highpass", ff: 3200 + i * 400, sure: 0.05, gain: 0.08, t0 });
    });
    nota(b, { tur: "sine", f0: 2200, f1: 3000, sure: 0.50, gain: 0.11, atak: 0.01 });
    [2600, 3200].forEach((f, i) => {
      nota(b, { tur: "triangle", f0: f, sure: 0.25, gain: 0.08, t0: 0.20 + i * 0.10 });
    });
  });

  tanim("simsek", 0.50, "sfx", (b) => {
    nota(b, { tur: "sawtooth", f0: 3500, f1: 400, sure: 0.30, gain: 0.20,
      filtre: "highpass", ff: 600, boz: 0.4 });
    gurultu(b, { filtre: "highpass", ff: 2600, sure: 0.30, gain: 0.15 });
    nota(b, { tur: "square", f0: 800, f1: 200, sure: 0.15, gain: 0.10 });
  });

  tanim("kasirga", 1.50, "sfx", (b) => {
    gurultu(b, { filtre: "bandpass", ff: 300, ff1: 900, q: 1.1, sure: 1.40, gain: 0.16, yumusak: true });
    gurultu(b, { filtre: "bandpass", ff: 1100, ff1: 320, q: 1.4, sure: 1.20, gain: 0.12, t0: 0.20, yumusak: true });
    nota(b, { tur: "sine", f0: 90, f1: 60, sure: 1.30, gain: 0.10, atak: 0.10 });
  });

  tanim("roket", 0.80, "sfx", (b) => {
    gurultu(b, { filtre: "highpass", ff: 2200, sure: 0.25, gain: 0.14 });
    gurultu(b, { filtre: "bandpass", ff: 500, ff1: 2500, q: 1.2, sure: 0.55, gain: 0.20, t0: 0.20, yumusak: true });
    nota(b, { tur: "sine", f0: 120, f1: 300, sure: 0.60, gain: 0.10, atak: 0.05 });
  });

  tanim("sifa", 0.60, "sfx", (b) => {
    [659, 784, 988, 1319].forEach((f, i) => {
      nota(b, { tur: "sine", f0: f, sure: 0.45, gain: 0.10, t0: i * 0.05, atak: 0.04 });
    });
    gurultu(b, { filtre: "highpass", ff: 4000, sure: 0.30, gain: 0.03, atak: 0.05 });
  });

  tanim("gorunmez", 0.60, "sfx", (b) => {
    nota(b, { tur: "sine", f0: 1200, f1: 2400, sure: 0.55, gain: 0.12, atak: 0.05 });
    gurultu(b, { filtre: "highpass", ff: 3000, sure: 0.50, gain: 0.05, atak: 0.08, yumusak: true });
    nota(b, { tur: "sine", f0: 1800, f1: 900, sure: 0.30, gain: 0.05, t0: 0.28 });
  });

  tanim("gok", 1.80, "sfx", (b) => {
    gurultu(b, { filtre: "lowpass", ff: 350, ff1: 60, sure: 1.70, gain: 0.30, yumusak: true, boz: 0.15 });
    gurultu(b, { filtre: "highpass", ff: 2400, sure: 0.08, gain: 0.12, t0: 0.05 });
    gurultu(b, { filtre: "highpass", ff: 2000, sure: 0.06, gain: 0.08, t0: 0.55 });
    nota(b, { tur: "sine", f0: 55, f1: 40, sure: 1.40, gain: 0.15, atak: 0.02 });
  });

  tanim("su", 0.35, "sfx", (b) => {
    gurultu(b, { filtre: "bandpass", ff: 900, ff1: 300, q: 1.1, sure: 0.30, gain: 0.18 });
    nota(b, { tur: "sine", f0: 700, f1: 250, sure: 0.20, gain: 0.10 });
  });

  tanim("kopru", 0.40, "sfx", (b) => {
    nota(b, { tur: "sawtooth", f0: 120, f1: 90, sure: 0.35, gain: 0.12,
      filtre: "lowpass", ff: 500, q: 5, boz: 0.1 });
    gurultu(b, { filtre: "lowpass", ff: 600, sure: 0.12, gain: 0.10, yumusak: true });
    nota(b, { tur: "sine", f0: 85, f1: 40, sure: 0.30, gain: 0.20 });
  });

  tanim("timsahCik", 0.40, "sfx", (b) => {
    gurultu(b, { filtre: "bandpass", ff: 400, ff1: 1400, q: 1.2, sure: 0.35, gain: 0.18 });
    nota(b, { tur: "sine", f0: 180, f1: 500, sure: 0.30, gain: 0.10 });
  });

  tanim("timsahIsir", 0.20, "sfx", (b) => {
    gurultu(b, { filtre: "bandpass", ff: 1800, q: 0.9, sure: 0.06, gain: 0.30 });
    nota(b, { tur: "square", f0: 160, f1: 70, sure: 0.12, gain: 0.22 });
    gurultu(b, { filtre: "highpass", ff: 3000, sure: 0.03, gain: 0.10 });
  });

  tanim("yildiz", 0.40, "sfx", (b) => {
    [1600, 2000, 2400, 3000].forEach((f, i) => {
      nota(b, { tur: "triangle", f0: f, sure: 0.16, gain: 0.10, t0: i * 0.05 });
    });
    gurultu(b, { filtre: "highpass", ff: 5000, sure: 0.15, gain: 0.03 });
  });

  const SES_ADLARI = Object.keys(SES_TARIFLERI);
  const SES_HACIM = {
    click: 0.50, toast: 0.50, fire: 0.45, fireBaloncuk: 0.45, fireLazer: 0.45,
    fireYesil: 0.45, firePompali: 0.50, fireBazuka: 0.55,
    hit: 0.60, kill: 0.55, boss: 0.85, bossDie: 0.80, damage: 0.60,
    pickup: 0.50, gem: 0.55, emerald: 0.55, buy: 0.55, unlock: 0.60,
    heart: 0.60, levelUp: 0.60, win: 0.70, lose: 0.65,
    guc: 0.60, bomba: 0.75, buz: 0.60, simsek: 0.65, kasirga: 0.60,
    roket: 0.65, sifa: 0.50, gorunmez: 0.50, gok: 0.80, su: 0.50,
    kopru: 0.55, timsahCik: 0.55, timsahIsir: 0.65, yildiz: 0.55,
  };

  // ---------- ortak çıkış zinciri: Gain -> limiter -> hedef ----------
  function ana() {
    if (!audio.ctx) return null;
    if (!anaZincir || anaZincir.context !== audio.ctx) {
      const g = audio.ctx.createGain();
      g.gain.value = 0.9;
      const c = audio.ctx.createDynamicsCompressor();
      c.threshold.value = -12;
      c.knee.value = 24;
      c.ratio.value = 4;
      c.attack.value = 0.003;
      c.release.value = 0.25;
      g.connect(c).connect(audio.ctx.destination);
      anaZincir = g;
    }
    return anaZincir;
  }

  // ---------- çalma: ses sınırı, efekt arası, kategori sesi ----------
  function play(ad, vol, opts) {
    if (!audio.enabled || !audio.ctx) return false;
    const tarif = SES_TARIFLERI[ad];
    if (!tarif) return false;
    const buf = tamponlar[ad];
    if (!buf) { const e = ESKI[ad]; return e ? e() : false; }
    const simdi = performance.now();
    const bosluk = ad.indexOf("fire") === 0 ? 45 : (BOSLUK[ad] || 0);
    if (bosluk && simdi - (sonZaman[ad] || -1e9) < bosluk) return false;
    if (!ONCELIK.has(ad) && sesSayaci >= SS_MAKS_SES) return false;
    const kazanc = Math.min(1, Math.max(0, (vol == null ? 0.5 : vol) * audio._v(tarif.kategori)));
    if (!(kazanc > 0)) return false;
    const kaynak = audio.ctx.createBufferSource();
    kaynak.buffer = buf;
    const g = audio.ctx.createGain();
    g.gain.value = kazanc;
    kaynak.connect(g).connect(ana());
    const det = opts && opts.detune != null ? opts.detune : 0;
    kaynak.detune.value = det + (Math.random() * 2 - 1) * 8;
    const oran = opts && opts.rate != null ? opts.rate : 1 + (Math.random() * 2 - 1) * 0.03;
    kaynak.playbackRate.value = oran;
    sonZaman[ad] = simdi;
    sesSayaci++;
    let bitti = false;
    const bitir = () => {
      if (bitti) return;
      bitti = true;
      sesSayaci = Math.max(0, sesSayaci - 1);
      try { g.disconnect(); } catch (_) {}
    };
    kaynak.onended = bitir;
    setTimeout(bitir, (buf.duration / oran) * 1000 + 120); // askıya alınan bağlamda da sayacı düşür
    try { kaynak.start(); } catch (_) { bitir(); return false; }
    return true;
  }

  // ---------- eski metotları sakla, yeni metotları bağla ----------
  const eskiInit = audio.init.bind(audio);
  const eskiFire = typeof audio.fire === "function" ? audio.fire.bind(audio) : null;
  for (const ad of SES_ADLARI) {
    const eski = typeof audio[ad] === "function" ? audio[ad].bind(audio) : null;
    if (eski) ESKI[ad] = eski;
    if (ad.indexOf("fire") === 0 && ad !== "fire" && eskiFire && !ESKI[ad]) ESKI[ad] = eskiFire;
    audio[ad] = function () { return play(ad, SES_HACIM[ad]); };
  }
  const FIRE_VARYANT = {
    baloncuk: "fireBaloncuk", lazer: "fireLazer", yesil: "fireYesil",
    pompali: "firePompali", bazuka: "fireBazuka",
  };
  audio.fire = function (gunKey) {
    const ad = (gunKey && (SES_TARIFLERI[gunKey] ? gunKey : FIRE_VARYANT[gunKey])) || "fire";
    return play(SES_TARIFLERI[ad] ? ad : "fire", SES_HACIM[ad] || SES_HACIM.fire);
  };

  // ---------- tembel render: audio.init() sonrası tek tek ----------
  async function tamponUret(ad) {
    const tarif = SES_TARIFLERI[ad];
    if (!tarif) return null;
    const uzunluk = Math.ceil(SS_SR * tarif.sure);
    let b;
    try { b = new OfflineAudioContext(1, uzunluk, SS_SR); } catch (_) { return null; }
    try { tarif.uret(b, tarif.sure); } catch (_) { return null; }
    let buf;
    try { buf = await b.startRendering(); } catch (_) { return null; }
    const ch = buf.getChannelData(0);
    const n = ch.length;
    let toplam = 0, gecerli = 0;
    for (let i = 0; i < n; i++) {
      const v = ch[i];
      if (Number.isFinite(v)) { toplam += v; gecerli++; } else ch[i] = 0;
    }
    const ortalama = gecerli ? toplam / gecerli : 0;
    let tepe = 0;
    for (let i = 0; i < n; i++) {
      ch[i] -= ortalama; // DC ofsetini kaldır
      const a = Math.abs(ch[i]);
      if (a > tepe) tepe = a;
    }
    if (!(tepe > 1e-6)) return null;
    const k = SS_TEPE / tepe;
    const fade = Math.max(1, Math.floor(SS_SR * SS_FADE));
    for (let i = 0; i < n; i++) {
      let v = ch[i] * k;
      if (i < fade) v *= i / fade;
      if (i >= n - fade) v *= (n - 1 - i) / fade;
      ch[i] = v;
    }
    tamponlar[ad] = buf;
    return buf;
  }

  function hazirligiBaslat() {
    if (basladi || !audio.ctx) return;
    basladi = true;
    const liste = SES_ADLARI.filter((ad) => !tamponlar[ad]);
    let i = 0;
    const adim = () => {
      if (i >= liste.length) return;
      const ad = liste[i++];
      tamponUret(ad).then(() => {
        if (typeof requestIdleCallback === "function") requestIdleCallback(adim, { timeout: 120 });
        else setTimeout(adim, 0);
      }, () => setTimeout(adim, 0));
    };
    setTimeout(adim, 0);
  }

  audio.init = function () {
    const r = eskiInit();
    hazirligiBaslat();
    return r;
  };
  audio.sesHazirMi = (ad) => !!tamponlar[ad];
  audio.sesHazirSayisi = () => Object.keys(tamponlar).length;
  audio.sesSure = (ad) => (tamponlar[ad] ? tamponlar[ad].duration : (SES_TARIFLERI[ad] ? SES_TARIFLERI[ad].sure : 0));
  audio.sesTampon = (ad) => tamponlar[ad] || null;
  audio.sesAdlari = SES_ADLARI.slice();
  window.SES_ADLARI = SES_ADLARI.slice();
  window.sesDene = (ad) => audio[ad] && audio[ad]();
  if (audio.ctx) hazirligiBaslat();
})();
