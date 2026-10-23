/* ============================================================
   HAYALET AVCILARI — ENGEL TEMALARI (3.13.0)
   Her temanın duvar (ve harita sınırı), iki obje ve su ressamı. Ressam (ctx, w, h, r, p, B) engelin önbellek tuvaline
   yerel koordinatta (0,0)–(w,h) çizer: r tohumlu rastgele, p tema paleti, B biçim (engeller.js engelOlustur; duvar
   ailesinde B.derinlik, sınırda B.yon). Döndürdüğü [{tur, x, y, n}] noktalarına canlı katman (ENGEL_CANLI) her karede
   çizer (mum alevi, kovuk gözü, ateş böceği…). Math.random yok: her cihazda aynı resim.
   Onaylı taslak: docs/superpowers/specs/2026-10-23-hayalet-engeller/taslak.js (Mor Şato, Yeşil Orman)
   engeller.js'ten sonra, game.js'ten önce yüklenir.
   ============================================================ */
(function () {
  const { doldur, cizgi, kirp, hatCiz, kenarNoktalari, icNoktalar, karistir, acik, koyu, elips, yuvarlak, tasOrgu, gozler, cimTutami, kayalikKenar, suTabani } = window.ENGEL;

  // ---------- MOR ŞATO ----------
  // Kale duvarı: gölge, tuğla örgülü ön yüz ve ışıklı kemerli pencereler, taş örgülü üst yüz, mazgallar, külahlı kuleler
  function kaleDuvari(ctx, w, h, r, p, B) {
    if (B.yon) return kaleSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0];
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                       // gölge
    cizgi(ctx, B, koyu(p.tas, 0.72), 3, 0, d);                          // ön yüz
    doldur(ctx, B, koyu(p.tas, 0.38), 0, d);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(p.tas, 0.58); ctx.lineWidth = 1;
      for (let y = 6, k = 0; y < h + d; y += 7, k++) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        for (let x = (k % 2) * 8; x < w; x += 16) { ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x, y); ctx.stroke(); }
      }
    }, 0, d);
    if (govde.t === "k") {                                              // ön yüzde ışıklı kemerli pencereler
      const altY = govde.y + govde.h, n = Math.max(1, Math.floor(govde.w / 60));
      for (let i = 0; i < n; i++) {
        const cx = govde.x + govde.w * (i + 0.5) / n, pw = 9, ph = d - 6, py = altY + 2;
        ctx.fillStyle = koyu(p.tas, 0.75); yuvarlak(ctx, cx - pw / 2 - 2, py - 1, pw + 4, ph + 2, 6); ctx.fill();
        const g = ctx.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, "#fff7ae"); g.addColorStop(1, "#f59e0b");
        ctx.fillStyle = g; yuvarlak(ctx, cx - pw / 2, py + 1, pw, ph - 2, 4.5); ctx.fill();
      }
    }
    cizgi(ctx, B, koyu(p.tas, 0.7), 3);                                 // üst yüz
    doldur(ctx, B, p.tas);
    kirp(ctx, B, () => {
      tasOrgu(ctx, 0, 0, w, h, 12, koyu(p.tas, 0.06), r);
      if (govde.t === "k") { ctx.fillStyle = "rgba(0,0,0,0.16)"; yuvarlak(ctx, govde.x + 8, govde.y + 6, govde.w - 16, govde.h - 12, govde.rr * 0.6); ctx.fill(); }
    });
    for (const q of B) if (q.t === "k" && q !== govde) {               // mazgal başları: açık ve parlak
      ctx.fillStyle = acik(p.tas, 0.3); yuvarlak(ctx, q.x, q.y, q.w, q.h - 3, q.rr); ctx.fill();
      ctx.fillStyle = acik(p.tas, 0.55); yuvarlak(ctx, q.x + 1.5, q.y + 1, q.w - 3, 2.5, 1.2); ctx.fill();
    }
    for (const t of B.kuleler || []) {                                  // kule: taş halka + külah + bayrak
      const cx = t.x, cy = t.y, tr = t.r;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) elips(ctx, cx + Math.cos(a) * (tr - 2.5), cy + Math.sin(a) * (tr - 2.5), 3.3, 3.3, acik(p.tas, 0.32));
      const g = ctx.createRadialGradient(cx - tr * 0.3, cy - tr * 0.3, 1, cx, cy, tr * 0.8);
      g.addColorStop(0, acik(p.cati, 0.45)); g.addColorStop(1, koyu(p.cati, 0.25));
      elips(ctx, cx, cy, tr * 0.7, tr * 0.7, g);
      ctx.strokeStyle = koyu(p.cati, 0.45); ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * tr * 0.7, cy + Math.sin(a) * tr * 0.7); ctx.stroke(); }
      ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - tr * 0.85); ctx.stroke();
      ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.moveTo(cx, cy - tr * 0.85); ctx.lineTo(cx + 8, cy - tr * 0.7); ctx.lineTo(cx, cy - tr * 0.55); ctx.closePath(); ctx.fill();
    }
    return [];
  }
  // Harita sınırı: taş sur ve yuvarlak mazgal başları
  function kaleSuru(ctx, w, h, r, p, B) {
    cizgi(ctx, B, koyu(p.tas, 0.7), 3);
    doldur(ctx, B, p.tas);
    kirp(ctx, B, () => tasOrgu(ctx, 0, 0, w, h, 10, p.tas, r));
    for (const q of B) if (q.t === "d") { elips(ctx, q.x, q.y, q.r - 1.5, q.r - 1.5, acik(p.tas, 0.28)); elips(ctx, q.x - 1.5, q.y - 1.5, q.r * 0.4, q.r * 0.3, acik(p.tas, 0.5)); }
    return [];
  }

  // Mezarlık: hattı izleyen alçak taş duvar ve demir çit, mor toprak, sevimli mezar taşları, bakan hayalet, mum
  function mezarlik(ctx, w, h, r, p, B) {
    doldur(ctx, B, koyu(p.toprak, 0.35), 0, 0, 3);
    kayalikKenar(ctx, B, koyu(p.mezar, 0.25), r, 8, 1);
    doldur(ctx, B, p.toprak);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 260; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 2.5, karistir(p.cim, "#000000", r() * 0.3));
      for (let i = 0; i < 3; i++) elips(ctx, w * (0.2 + r() * 0.6), h * (0.3 + r() * 0.5), 18 + r() * 14, 6 + r() * 3, "rgba(226, 232, 240, 0.08)");
    });
    const n = Math.max(2, Math.min(6, Math.round(w * h / 4300)));
    const yerler = icNoktalar(B, w, h, n, 15, 26, r), hayaletli = Math.floor(r() * yerler.length);
    yerler.forEach((y0, i) => {
      const tw = 15 + r() * 9, th = tw * 1.25, x = y0.x - tw / 2, y = y0.y - th * 0.6;
      if (i === hayaletli) {                                            // taşın arkasından bakan sevimli hayalet
        elips(ctx, x + tw * 0.85, y + th * 0.2, tw * 0.42, tw * 0.5, "#f8fafc");
        gozler(ctx, x + tw * 0.95, y + th * 0.12, 3.2, 2.1, "#1e1b4b");
        elips(ctx, x + tw * 0.95, y + th * 0.3, 2, 1.4, "#fda4af");
      }
      elips(ctx, x + tw / 2, y + th, tw * 0.7, 4, koyu(p.toprak, 0.4));
      ctx.fillStyle = koyu(p.mezar, 0.35); yuvarlak(ctx, x + 2, y + 1, tw, th, tw * 0.48); ctx.fill();
      const g = ctx.createLinearGradient(x, 0, x + tw, 0); g.addColorStop(0, acik(p.mezar, 0.25)); g.addColorStop(1, p.mezar);
      ctx.fillStyle = g; yuvarlak(ctx, x, y, tw, th, tw * 0.48); ctx.fill();
      ctx.fillStyle = koyu(p.mezar, 0.4); ctx.beginPath(); ctx.arc(x + tw / 2, y + th * 0.38, tw * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + tw / 2 + tw * 0.08, y + th * 0.34, tw * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = koyu(p.mezar, 0.35); ctx.lineWidth = 1;
      for (const k of [0.68, 0.8]) { ctx.beginPath(); ctx.moveTo(x + tw * 0.27, y + th * k); ctx.lineTo(x + tw * 0.73, y + th * k); ctx.stroke(); }
    });
    const canli = [];
    const mum = icNoktalar(B, w, h, 1, 10, 0, r)[0];                    // mum: gövdesi burada, alevi canlı katmanda
    if (mum) { ctx.fillStyle = "#fef3c7"; ctx.fillRect(mum.x - 2, mum.y - 8, 4, 8); canli.push({ tur: "mum", x: mum.x, y: mum.y, n: r() }); }
    ctx.fillStyle = "#111827";                                           // demir çit: hattın önündeki (alt) kısmında
    for (const k of kenarNoktalari(B, 7, 0)) if (k.ny > 0.25) {
      ctx.fillRect(k.x - 0.8, k.y - 11, 1.6, 11);
      ctx.beginPath(); ctx.moveTo(k.x - 2, k.y - 11); ctx.lineTo(k.x, k.y - 15); ctx.lineTo(k.x + 2, k.y - 11); ctx.fill();
    }
    return canli;
  }

  // Balkabağı tarlası: hattı izleyen tahta çit, sürülmüş toprak, sarmaşık, gülen fener balkabakları
  function balkabagiTarlasi(ctx, w, h, r, p, B) {
    doldur(ctx, B, koyu(p.tarla, 0.45), 0, 0, 3);
    doldur(ctx, B, p.tarla);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(p.tarla, 0.3); ctx.lineWidth = 2;
      for (let y = 6; y < h; y += 11) { ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x / 13 + y) * 1.4); ctx.stroke(); }
    });
    const n = Math.max(2, Math.min(7, Math.round(w * h / 3100)));
    const yerler = icNoktalar(B, w, h, n, 14, 26, r);
    ctx.strokeStyle = "#3f7d20"; ctx.lineWidth = 2;
    ctx.beginPath(); yerler.forEach((k, i) => (i ? ctx.quadraticCurveTo((yerler[i - 1].x + k.x) / 2, k.y - 14, k.x, k.y) : ctx.moveTo(k.x, k.y))); ctx.stroke();
    yerler.forEach((k) => {
      const s = 10 + r() * 4;
      for (let i = 0; i < 3; i++) { const a = r() * Math.PI * 2; elips(ctx, k.x + Math.cos(a) * s * 1.1, k.y + Math.sin(a) * s * 0.7 + 2, s * 0.45, s * 0.28, "#4d9a2a"); }
      balkabagi(ctx, k.x, k.y, s, r() < 0.75);
    });
    for (const k of kenarNoktalari(B, 13, -2)) {                         // tahta çit: hattın 2 px içinde, kazıklar
      ctx.fillStyle = koyu("#9a6b3f", 0.3); ctx.fillRect(k.x - 2, k.y - 9, 4, 10);
      ctx.fillStyle = acik("#9a6b3f", 0.2); ctx.beginPath(); ctx.arc(k.x, k.y - 9, 2, Math.PI, 0); ctx.fill();
    }
    hatCiz(ctx, B, "#9a6b3f", 2, 0, -4, -2);
    return [];
  }
  function balkabagi(ctx, x, y, s, yuzlu) {
    elips(ctx, x + 2, y + s * 0.7, s * 1.05, s * 0.35, "rgba(0,0,0,0.3)");
    const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.35, 1, x, y, s * 1.2);
    g.addColorStop(0, "#fdba74"); g.addColorStop(0.6, "#f97316"); g.addColorStop(1, "#c2410c");
    for (const dx of [-0.45, 0.45, 0]) elips(ctx, x + dx * s, y, s * (dx ? 0.62 : 0.7), s * 0.78, g);
    ctx.strokeStyle = "rgba(124, 45, 18, 0.55)"; ctx.lineWidth = 1;
    for (const dx of [-0.25, 0.25]) { ctx.beginPath(); ctx.ellipse(x + dx * s, y, s * 0.25, s * 0.74, 0, -Math.PI / 2, Math.PI / 2, dx < 0); ctx.stroke(); }
    ctx.fillStyle = "#4d7c0f"; ctx.fillRect(x - 1.5, y - s * 0.95, 3, s * 0.3);
    if (!yuzlu) return;
    ctx.save(); ctx.shadowColor = "#fde047"; ctx.shadowBlur = 6; ctx.fillStyle = "#fde047";
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * s * 0.42, y - s * 0.05); ctx.lineTo(x + sx * s * 0.18, y - s * 0.05); ctx.lineTo(x + sx * s * 0.3, y - s * 0.3); ctx.closePath(); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(x - s * 0.42, y + s * 0.15);
    ctx.quadraticCurveTo(x, y + s * 0.62, x + s * 0.42, y + s * 0.15);
    ctx.quadraticCurveTo(x, y + s * 0.32, x - s * 0.42, y + s * 0.15); ctx.fill();
    ctx.restore();
  }

  // Kale hendeği: hattı izleyen taş kıyı, mavi su (dalgalar canlı katmanda)
  function hendek(ctx, w, h, r, p, B) {
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(p.tas, 0.5), 0, 0, 8);
      kirp(ctx, B, () => tasOrgu(ctx, 0, 0, w, h, 8, p.tas, r), 0, 0, 7);
    }, koyu(p.tas, 0.55));
    return [];
  }

  // ---------- YEŞİL ORMAN ----------
  // Kütük çit: gölge, dikey kütüklü ön yüz ve ip, kütük uçlarından üst yüz, dipte yosun
  function kutukCit(ctx, w, h, r, p, B) {
    if (B.yon) return kutukSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0;
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);
    cizgi(ctx, B, koyu(p.tahta, 0.75), 3, 0, d);                        // ön yüz: dikey kütükler
    doldur(ctx, B, koyu(p.tahta, 0.3), 0, d);
    kirp(ctx, B, () => {
      for (let x = 0; x < w; x += 12) {
        const g = ctx.createLinearGradient(x, 0, x + 12, 0); g.addColorStop(0, koyu(p.tahta, 0.45)); g.addColorStop(0.5, acik(p.tahta, 0.1)); g.addColorStop(1, koyu(p.tahta, 0.5));
        ctx.fillStyle = g; ctx.fillRect(x, 0, 12, h + d);
      }
      ctx.strokeStyle = "#d6b98c"; ctx.lineWidth = 2;
      const alt = B[0].y + B[0].h; ctx.beginPath(); ctx.moveTo(0, alt + d * 0.55); ctx.lineTo(w, alt + d * 0.55); ctx.stroke();
    }, 0, d);
    cizgi(ctx, B, koyu(p.tahta, 0.75), 3);                              // üst yüz: kütük uçları
    doldur(ctx, B, koyu(p.tahta, 0.55));
    kirp(ctx, B, () => {
      const rr = 6.2, ax = rr * 2, ay = rr * 1.75;
      for (let j = 0, y = 2; y < h + rr; y += ay, j++) for (let x = (j % 2) * rr; x < w + rr; x += ax) {
        const s = rr * (0.9 + r() * 0.15);
        elips(ctx, x + 0.8, y + 1.2, s, s, "rgba(0,0,0,0.35)"); elips(ctx, x, y, s, s, koyu(p.tahta, 0.12)); elips(ctx, x, y, s * 0.78, s * 0.78, acik(p.tahta, 0.28));
        ctx.strokeStyle = koyu(p.tahta, 0.2); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, s * 0.5, 0, Math.PI * 2); ctx.stroke();
      }
    });
    for (let i = 0; i < w / 16; i++) elips(ctx, 8 + r() * (w - 16), h - 3 - r() * 4, 3 + r() * 4, 2, "rgba(74, 222, 128, 0.4)");
    return [];
  }
  // Harita sınırı: kütük uçlarından sur
  function kutukSuru(ctx, w, h, r, p, B) {
    cizgi(ctx, B, koyu(p.tahta, 0.75), 3);
    doldur(ctx, B, koyu(p.tahta, 0.45));
    kirp(ctx, B, () => {
      const yatay = w > h, adim = 11;
      for (let a = 0; a < (yatay ? w : h) + adim; a += adim) for (let b = adim / 2; b < (yatay ? h : w) + adim; b += adim) {
        const x = yatay ? a : b, y = yatay ? b : a;
        elips(ctx, x, y, adim * 0.55, adim * 0.55, koyu(p.tahta, 0.15)); elips(ctx, x, y, adim * 0.4, adim * 0.4, acik(p.tahta, 0.22));
      }
    });
    return [];
  }
  // Ürkünç ağaçlar: çalı kenar, kıvrık dallı ağaçlar, kovukta parlayan sevimli gözler (canlı), yarasa
  function urkuncAgaclar(ctx, w, h, r, p, B) {
    doldur(ctx, B, koyu(p.yaprak, 0.55), 0, 0, 3);
    doldur(ctx, B, koyu(p.yaprak, 0.45));
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 500; i++) elips(ctx, r() * w, r() * h, 4 + r() * 6, 3 + r() * 4, karistir(p.yaprak, "#000000", 0.2 + r() * 0.35)); });
    for (const k of kenarNoktalari(B, 8, 0)) {                           // hattı izleyen çalılar
      const s = 5 + r() * 4;
      elips(ctx, k.x, k.y, s, s * 0.85, karistir(p.yaprak, "#000000", r() * 0.25));
      elips(ctx, k.x - s * 0.3, k.y - s * 0.3, s * 0.45, s * 0.35, acik(p.yaprak, 0.18));
    }
    const n = w > 170 ? 3 : w > 115 ? 2 : 1, canli = [];
    const yerler = icNoktalar(B, w, h, n, 16, w / (n + 1), r);
    for (const y0 of yerler.length ? yerler : [{ x: w / 2, y: h * 0.7 }]) {
      const x = y0.x;
      let taban = Math.min(h - 12, y0.y + h * 0.25), boy = Math.min(h - 22, 105), gen = Math.min(w / n, 90);
      while (taban > y0.y && engelUzaklik(B, x, taban + 6) > 0) taban -= 2;     // gövde dibi yamanın üstünde
      for (let k = 0; k < 10 && !agacSigar(B, x, taban, boy, gen); k++) { boy *= 0.88; gen *= 0.88; }
      let goz = null;
      kirp(ctx, B, () => { goz = agac(ctx, x, taban, boy, gen); }, 0, 0, 8);  // dal ucu kenar payını aşmasın
      canli.push({ tur: "goz", x: goz.x, y: goz.y, n: r(), ara: 2.2, rr: 1.5 });
    }
    const yer = icNoktalar(B, w, h, 1, 14, 0, r)[0];                    // yarasa: kanat uçları biçimin üstünde
    if (yer) {
      const bx = yer.x; let by = yer.y;
      for (let k = 0; k <= 6; k++) {
        const y = Math.max(14, yer.y - h * 0.3 * (1 - k / 6));
        if ([[bx - 13, y], [bx + 13, y], [bx, y - 6], [bx, y + 5]].every(([px, py]) => engelUzaklik(B, px, py) < 4)) { by = y; break; }
      }
      ctx.fillStyle = "#1e1b2e";
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx - 6, by - 6, bx - 12, by - 1); ctx.quadraticCurveTo(bx - 8, by, bx - 6, by + 3);
      ctx.quadraticCurveTo(bx - 3, by + 1, bx, by + 4); ctx.quadraticCurveTo(bx + 3, by + 1, bx + 6, by + 3);
      ctx.quadraticCurveTo(bx + 8, by, bx + 12, by - 1); ctx.quadraticCurveTo(bx + 6, by - 6, bx, by); ctx.fill();
      elips(ctx, bx - 1.6, by + 0.5, 0.9, 0.9, "#fde047"); elips(ctx, bx + 1.6, by + 0.5, 0.9, 0.9, "#fde047");
    }
    return canli;
  }
  // Ağaç yamaya sığıyor mu: gövde tepesi yamada, gölgesi yamanın kenarında; dal uçları yamadan en çok ~14 px dışarıda
  // (ağaç yamanın 8 px ötesinde kırpıldığı için uçtan en çok birkaç piksel gider). Sığmayan ağaç küçülür.
  function agacSigar(B, x, taban, boy, gen) {
    const tepe = taban - boy * 0.72, yari = Math.min(gen * 0.45, 40), d = (px, py) => engelUzaklik(B, px, py);
    if (d(x, tepe - 2) > 0) return false;
    for (let a = 0; a < 8; a++) if (d(x + Math.cos(a * Math.PI / 4) * gen * 0.32, taban + 2 + Math.sin(a * Math.PI / 4) * 5) > 6) return false; // gölge
    return [[x - yari - 6.5, tepe + 2 - boy * 0.18], [x + yari + 6.5, tepe + 2 - boy * 0.2], [x - yari * 0.8 - 6.5, tepe + 2 + boy * 0.12],
      [x + yari * 0.75 + 6.5, tepe + 2 + boy * 0.18]].every(([px, py]) => d(px, py) < 14);
  }
  // Kıvrık dallı ağaç; kovuğun gözleri canlı katmanda: göz noktasını döndürür
  function agac(ctx, x, taban, boy, gen) {
    elips(ctx, x, taban + 2, gen * 0.32, 5, "rgba(0,0,0,0.35)");
    const govde = "#5b4166";
    ctx.fillStyle = govde;
    ctx.beginPath();
    ctx.moveTo(x - 9, taban); ctx.quadraticCurveTo(x - 4, taban - boy * 0.4, x - 3, taban - boy * 0.72);
    ctx.lineTo(x + 3, taban - boy * 0.72); ctx.quadraticCurveTo(x + 5, taban - boy * 0.4, x + 10, taban); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = govde; ctx.lineCap = "round";
    const dal = (sx, sy, dx, dy, kal) => {
      ctx.lineWidth = kal; ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + dx * 0.5, sy + dy * 0.2, sx + dx, sy + dy); ctx.stroke();
      ctx.lineWidth = Math.max(1, kal * 0.5); ctx.beginPath(); ctx.arc(sx + dx + Math.sign(dx) * 2.5, sy + dy + 2.5, 3, Math.PI, Math.PI * 2.4); ctx.stroke();
    };
    const tepe = taban - boy * 0.72, yari = Math.min(gen * 0.45, 40);
    dal(x, tepe + 4, -yari, -boy * 0.18, 5); dal(x, tepe + 4, yari, -boy * 0.2, 5);
    dal(x - 2, tepe + boy * 0.18, -yari * 0.8, -boy * 0.06, 4); dal(x + 2, tepe + boy * 0.22, yari * 0.75, -boy * 0.04, 4);
    const ky = taban - boy * 0.36;
    elips(ctx, x, ky, 5.5, 7.5, "#0b0612");                            // kovuk
    return { x, y: ky - 1 };
  }
  // Dev mantar halkası: yosun kenar, benekli mantarlar, ortada yüzlü dev mantar, ateş böcekleri (canlı)
  function mantarHalkasi(ctx, w, h, r, p, B) {
    doldur(ctx, B, koyu(p.cim, 0.3), 0, 0, 3);
    doldur(ctx, B, p.cim);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 300; i++) cimTutami(ctx, r() * w, 6 + r() * h, 2 + r() * 2, karistir(p.cim, r() < 0.5 ? "#ffffff" : "#000000", 0.15 + r() * 0.15)); });
    for (const k of kenarNoktalari(B, 9, 0)) elips(ctx, k.x, k.y, 4.5, 3.2, koyu(p.cim, 0.25)); // yosunlu kenar
    const yerler = icNoktalar(B, w, h, Math.max(5, Math.min(10, Math.round(w * h / 2000))), 10, 18, r);
    let orta = null, en = Infinity; for (const y0 of yerler) { const dd = Math.hypot(y0.x - w / 2, y0.y - h / 2); if (dd < en) { en = dd; orta = y0; } }
    yerler.forEach((m) => mantar(ctx, m.x, m.y, m === orta ? Math.min(17, Math.min(w, h) * 0.18) : 6 + r() * 4, m === orta));
    return icNoktalar(B, w, h, 5, 6, 10, r).map((f) => ({ tur: "atesbocegi", x: f.x, y: f.y - 6, n: r() }));
  }
  function mantar(ctx, x, y, s, yuz) {
    elips(ctx, x + 1, y + s * 0.25, s * 0.8, s * 0.22, "rgba(0,0,0,0.3)");
    ctx.fillStyle = "#fef3c7"; yuvarlak(ctx, x - s * 0.32, y - s * 0.7, s * 0.64, s * 0.9, s * 0.25); ctx.fill();
    const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.95, 1, x, y - s * 0.7, s * 1.1);
    g.addColorStop(0, "#fca5a5"); g.addColorStop(0.55, "#ef4444"); g.addColorStop(1, "#991b1b");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - s * 0.62, s, s * 0.7, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    for (const [dx, dy, rr] of [[-0.45, -0.85, 0.16], [0.15, -1.05, 0.13], [0.5, -0.78, 0.14], [-0.1, -0.75, 0.1]]) elips(ctx, x + dx * s, y + dy * s, rr * s, rr * s * 0.85, "#fff7ed");
    if (yuz) {
      gozler(ctx, x, y - s * 0.3, s * 0.13, s * 0.07, "#1f2937");
      ctx.strokeStyle = "#1f2937"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y - s * 0.22, s * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      elips(ctx, x - s * 0.24, y - s * 0.2, s * 0.06, s * 0.04, "#fda4af"); elips(ctx, x + s * 0.24, y - s * 0.2, s * 0.06, s * 0.04, "#fda4af");
    }
  }
  // Sazlıklı gölet: çimen kıyı, nilüferler, kıyıda kamışlar
  function sazlikGolet(ctx, w, h, r, p, B) {
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(p.cim, 0.15), 0, 0, 8);
      kirp(ctx, B, () => { for (let i = 0; i < (w + h) / 2; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 2, koyu(p.cim, 0.25 + r() * 0.2)); }, 0, 0, 8);
    }, koyu(p.cim, 0.5));
    for (const l of icNoktalar(B, w, h, Math.max(1, Math.round(w * h / 4500)), 10, 16, r)) {
      const s = 6 + r() * 3;
      ctx.fillStyle = "#3f9b3a"; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.arc(l.x, l.y, s, 0.3, Math.PI * 2 - 0.1); ctx.closePath(); ctx.fill();
      if (r() < 0.5) { elips(ctx, l.x + 1, l.y - 1, 2.6, 2.2, "#f9a8d4"); elips(ctx, l.x + 1, l.y - 1, 1.1, 1, "#fde047"); }
    }
    for (const k of kenarNoktalari(B, 10, 6)) if (r() < 0.35 && k.ny > -0.15) { // yan ve alt kıyıda kamışlar
      ctx.strokeStyle = "#4d7c0f"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(k.x + 1, k.y - 12); ctx.stroke();
      ctx.fillStyle = "#7c4a1e"; yuvarlak(ctx, k.x - 0.6, k.y - 12, 3.2, 7, 1.6); ctx.fill();
    }
    return [];
  }

  // ---------- ortak: süsü yamaya sığdırma ----------
  // (x, y)'den yukarı doğru biçimin içinde kalan yükseklik: uzun süslerin boyu buna göre seçilir (yamadan taşmasın)
  function ustBosluk(B, x, y, en = 140) { let k = 0; while (k < en && engelUzaklik(B, x, y - k - 2) < -2) k += 2; return k; }
  function altBosluk(B, x, y, en = 140) { let k = 0; while (k < en && engelUzaklik(B, x, y + k + 2) < -2) k += 2; return k; }
  // (x, y)'den aşağı doğru biçimin içinde kalarak inilebilecek en alt nokta (süsün dibi yamanın altına yaklaşsın)
  function altaIn(B, x, y, h, pay = 6) { while (y + 2 < h && engelUzaklik(B, x, y + pay + 2) < -2) y += 2; return y; }

  // ---------- ÇÖL ----------
  // Kum taşı harabe: gölge, sıralı ve çatlaklı ön yüz, taş örgülü üst yüz, kum birikintisi, yivli kırık sütun başları
  function harabeDuvari(ctx, w, h, r, p, B) {
    if (B.yon) return kaleSuru(ctx, w, h, r, { tas: p.tas }, B);
    const d = B.derinlik || 0, govde = B[0];
    doldur(ctx, B, "rgba(0,0,0,0.25)", 2, d + 1);                       // gölge
    cizgi(ctx, B, koyu(p.koyu, 0.35), 3, 0, d);                          // ön yüz
    doldur(ctx, B, koyu(p.tas, 0.28), 0, d);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(p.tas, 0.45); ctx.lineWidth = 1;
      for (let y = 6, k = 0; y < h + d; y += 8, k++) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        for (let x = (k % 2) * 11 + r() * 4; x < w; x += 22) { ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y); ctx.stroke(); }
      }
      ctx.strokeStyle = koyu(p.tas, 0.62); ctx.lineWidth = 1.3;             // çatlaklar
      for (let i = 0; i < Math.max(1, Math.round(w / 55)); i++) {
        let x = 12 + r() * (w - 24), y = govde.y + govde.h + 1;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let j = 0; j < 4; j++) { x += (r() - 0.5) * 9; y += d / 4; ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }, 0, d);
    cizgi(ctx, B, koyu(p.koyu, 0.2), 3);                                 // üst yüz
    doldur(ctx, B, p.tas);
    kirp(ctx, B, () => {
      tasOrgu(ctx, 0, 0, w, h, 12, koyu(p.tas, 0.04), r);
      for (let i = 0; i < w * h / 900; i++) elips(ctx, r() * w, r() * h, 6 + r() * 10, 2 + r() * 2, "rgba(217, 178, 107, 0.45)"); // kum
    });
    for (const t of B.kuleler || []) {                                    // kırık sütun başları: yivli halkalar, kırık çentik
      elips(ctx, t.x + 1, t.y + 2, t.r, t.r, "rgba(0,0,0,0.22)");
      elips(ctx, t.x, t.y, t.r, t.r, acik(p.tas, 0.14));
      ctx.strokeStyle = koyu(p.tas, 0.25); ctx.lineWidth = 1;
      for (const k of [0.74, 0.46]) { ctx.beginPath(); ctx.arc(t.x, t.y, t.r * k, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = koyu(p.tas, 0.32); ctx.beginPath(); ctx.moveTo(t.x - t.r * 0.62, t.y - t.r * 0.45); ctx.lineTo(t.x - t.r * 0.1, t.y - t.r * 0.08);
      ctx.lineTo(t.x + t.r * 0.32, t.y - t.r * 0.58); ctx.lineTo(t.x + t.r * 0.08, t.y - t.r * 0.92); ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < w / 30; i++) elips(ctx, 14 + r() * (w - 28), h - 3 - r() * 3, 6 + r() * 5, 2.5, "rgba(217, 178, 107, 0.6)"); // önde kum
    return [];
  }
  // Kaktüs bahçesi: çakıl kenar, dalgalı kum, kollu ve çiçekli kaktüsler, birinde uykulu yüz, yuvarlak fıçı kaktüsler
  function kaktusBahcesi(ctx, w, h, r, p, B) {
    doldur(ctx, B, koyu(p.kum, 0.3), 0, 0, 3);
    kayalikKenar(ctx, B, p.cakil, r, 7, 1, 5.5);
    doldur(ctx, B, p.kum);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(p.kum, 0.12); ctx.lineWidth = 1.5;
      for (let y = 8; y < h; y += 10) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 9 + y * 0.7) * 2); ctx.stroke(); }
      for (let i = 0; i < w * h / 700; i++) elips(ctx, r() * w, r() * h, 1.3, 1, koyu(p.kum, 0.28));
    });
    const n = Math.max(2, Math.min(6, Math.round(w * h / 3000)));
    const yerler = icNoktalar(B, w, h, n, 14, 24, r), yuzlu = Math.floor(r() * yerler.length);
    kirp(ctx, B, () => yerler.forEach((k, i) => {
      const y = Math.min(altaIn(B, k.x, k.y, h, 5), k.y + h * 0.22); // biraz aşağı: boy payı, ama hepsi dibe yığılmasın
      if (i !== yuzlu && r() < 0.35) return ficiKaktus(ctx, k.x, y, 7 + r() * 3, p, r);
      kolluKaktus(ctx, k.x, y, Math.min(24 + r() * 16, ustBosluk(B, k.x, y) + 6), p, r, i === yuzlu);
    }), 0, 0, 8);
    return [];
  }
  function kaktusParca(ctx, x, y, gw, gh, p) {
    ctx.fillStyle = p.kaktus; yuvarlak(ctx, x, y, gw, gh, gw / 2); ctx.fill();
    ctx.fillStyle = acik(p.kaktus, 0.22); yuvarlak(ctx, x + gw * 0.2, y + 2, gw * 0.22, Math.max(1, gh - 4), gw * 0.11); ctx.fill();
  }
  function kolluKaktus(ctx, x, y, boy, p, r, yuzlu) {
    boy = Math.max(12, boy);
    const g = boy * 0.32;
    elips(ctx, x + 2, y + 1, boy * 0.38, 3.5, "rgba(0,0,0,0.25)");
    if (r() < 0.8) { kaktusParca(ctx, x - g * 1.55, y - boy * 0.68, g * 0.78, boy * 0.36, p); kaktusParca(ctx, x - g * 1.55, y - boy * 0.42, g * 1.4, g * 0.7, p); }
    if (r() < 0.8) { kaktusParca(ctx, x + g * 0.78, y - boy * 0.86, g * 0.78, boy * 0.38, p); kaktusParca(ctx, x + g * 0.15, y - boy * 0.58, g * 1.4, g * 0.7, p); }
    kaktusParca(ctx, x - g / 2, y - boy, g, boy, p);
    ctx.fillStyle = acik(p.kaktus, 0.55);                                 // diken noktaları
    for (let i = 0; i < boy / 5; i++) elips(ctx, x - g * 0.3 + r() * g * 0.6, y - boy + 3 + r() * (boy - 6), 0.7, 0.7, acik(p.kaktus, 0.6));
    if (r() < 0.6) { for (const a of [0, 1.26, 2.51, 3.77, 5.03]) elips(ctx, x + Math.cos(a) * 2.6, y - boy + 1 + Math.sin(a) * 2.6, 2.2, 2.2, "#f9a8d4"); elips(ctx, x, y - boy + 1, 1.5, 1.5, "#fde047"); }
    if (yuzlu) {                                                          // uykulu yüz: kapalı gözler, küçük ağız
      const fy = y - boy * 0.55;
      ctx.strokeStyle = "#1f3b1f"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * g * 0.2, fy, g * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
      elips(ctx, x, fy + g * 0.3, g * 0.08, g * 0.06, "#1f3b1f");
      elips(ctx, x - g * 0.32, fy + g * 0.16, g * 0.08, g * 0.05, "#fda4af"); elips(ctx, x + g * 0.32, fy + g * 0.16, g * 0.08, g * 0.05, "#fda4af");
    }
  }
  function ficiKaktus(ctx, x, y, s, p) {
    elips(ctx, x + 1.5, y + 1, s * 1.05, 2.8, "rgba(0,0,0,0.25)");
    elips(ctx, x, y - s * 0.8, s, s * 0.9, p.kaktus);
    ctx.strokeStyle = koyu(p.kaktus, 0.25); ctx.lineWidth = 1;
    for (const k of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(x + k * s, y - s * 0.8, s * 0.18, s * 0.86, 0, 0, Math.PI * 2); ctx.stroke(); }
    elips(ctx, x, y - s * 1.65, 2, 1.6, "#fbbf24");
  }
  // Mumya lahdi: kumlu taş zemin, kenar taşları, aralık kapaklı lahit ve içinden bakan sevimli mumya, testiler
  function mumyaLahdi(ctx, w, h, r, p, B) {
    doldur(ctx, B, koyu(p.tas, 0.35), 0, 0, 3);
    doldur(ctx, B, acik(p.tas, 0.06));
    kirp(ctx, B, () => {
      tasOrgu(ctx, 0, 0, w, h, 13, acik(p.tas, 0.04), r);
      for (let i = 0; i < w * h / 500; i++) elips(ctx, r() * w, r() * h, 3 + r() * 8, 1.5 + r() * 2, "rgba(217, 178, 107, 0.5)");
    });
    kayalikKenar(ctx, B, koyu(p.tas, 0.08), r, 9, 1, 6);
    const s = Math.min(w, h), m = icNoktalar(B, w, h, 1, s * 0.3, 0, r)[0] || { x: w / 2, y: h / 2 };
    const lw = s * 0.34, lh = Math.min(s * 0.74, 2 * Math.min(ustBosluk(B, m.x, m.y), altBosluk(B, m.x, m.y)) + 8);
    kirp(ctx, B, () => {
      lahit(ctx, m.x, m.y, lw, lh, p);
      for (const k of icNoktalar(B, w, h, Math.max(1, Math.round(w * h / 6000)), 10, 20, r)) if (Math.abs(k.x - m.x) > lw) testi(ctx, k.x, k.y, 5 + r() * 2, p);
    }, 0, 0, 8);
    return [];
  }
  function lahit(ctx, x, y, lw, lh, p) {
    const ust = y - lh / 2, rr = lw * 0.45;
    elips(ctx, x + 3, y + lh * 0.46, lw * 0.62, 4.5, "rgba(0,0,0,0.3)");
    ctx.fillStyle = koyu(p.altin, 0.4); yuvarlak(ctx, x - lw / 2, ust, lw, lh, rr); ctx.fill();          // kasa
    ctx.fillStyle = "#1c1206"; yuvarlak(ctx, x - lw / 2 + 3, ust + 3, lw - 6, lh - 6, rr * 0.85); ctx.fill(); // karanlık iç
    const mx = x - lw * 0.18, my = ust + lh * 0.3;                         // içinden bakan mumya
    elips(ctx, mx, my, lw * 0.26, lw * 0.3, p.sargi);
    ctx.strokeStyle = koyu(p.sargi, 0.22); ctx.lineWidth = 1;
    for (const k of [-0.15, 0.12, 0.38]) { ctx.beginPath(); ctx.moveTo(mx - lw * 0.24, my + k * lw * 0.5 - 2); ctx.lineTo(mx + lw * 0.24, my + k * lw * 0.5 + 1); ctx.stroke(); }
    gozler(ctx, mx, my - lw * 0.04, lw * 0.09, lw * 0.055, "#1f2937", "#ffffff");
    elips(ctx, mx, my + lw * 0.12, lw * 0.05, lw * 0.03, "#7c2d12");
    ctx.save(); ctx.translate(x + lw * 0.3, y + 2); ctx.rotate(0.12);       // sağa kaymış aralık kapak
    const g = ctx.createLinearGradient(-lw / 2, 0, lw / 2, 0); g.addColorStop(0, acik(p.altin, 0.3)); g.addColorStop(1, koyu(p.altin, 0.15));
    ctx.fillStyle = "rgba(0,0,0,0.3)"; yuvarlak(ctx, -lw / 2 + 2, -lh / 2 + 2, lw, lh, rr); ctx.fill();
    ctx.fillStyle = g; yuvarlak(ctx, -lw / 2, -lh / 2, lw, lh, rr); ctx.fill();
    ctx.fillStyle = p.mavi;                                                // mavi şeritler
    for (let k = -lh * 0.12; k < lh * 0.44; k += lh * 0.14) ctx.fillRect(-lw / 2 + 3, k, lw - 6, lh * 0.045);
    elips(ctx, 0, -lh * 0.3, lw * 0.3, lw * 0.34, acik(p.altin, 0.15));    // kapaktaki altın yüz
    ctx.fillStyle = p.mavi; ctx.fillRect(-lw * 0.36, -lh * 0.42, lw * 0.72, lh * 0.05);
    gozler(ctx, 0, -lh * 0.31, lw * 0.1, lw * 0.045, "#1e3a8a");
    ctx.restore();
  }
  function testi(ctx, x, y, s, p) {
    elips(ctx, x + 1, y + 1, s * 0.9, 2.2, "rgba(0,0,0,0.25)");
    elips(ctx, x, y - s * 0.8, s * 0.8, s, koyu(p.altin, 0.25));
    ctx.fillStyle = koyu(p.altin, 0.35); ctx.fillRect(x - s * 0.35, y - s * 2, s * 0.7, s * 0.5);
    ctx.fillStyle = p.mavi; ctx.fillRect(x - s * 0.8, y - s * 0.95, s * 1.6, s * 0.22);
  }
  // Vaha: kum kıyı, kıyıdan suya eğilen palmiye yaprakları
  function vaha(ctx, w, h, r, p, B) {
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(p.kum, 0.08), 0, 0, 8);
      kirp(ctx, B, () => { for (let i = 0; i < w + h; i++) elips(ctx, r() * w, r() * h, 1.2, 1, koyu(p.kum, 0.3)); }, 0, 0, 8);
    }, koyu(p.kum, 0.45));
    for (const k of kenarNoktalari(B, 24, 5)) if (r() < 0.45) palmiye(ctx, k.x, k.y, k.nx, k.ny, 9 + r() * 4);
    return [];
  }
  function palmiye(ctx, x, y, nx, ny, s) {
    const a0 = Math.atan2(-ny, -nx);                                      // yapraklar kıyıdan suya ve yanlara
    for (let i = -2; i <= 2; i++) {
      const a = a0 + i * 0.42, uz = s * (1 - Math.abs(i) * 0.12), ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, gen = s * 0.26;
      ctx.fillStyle = i % 2 ? "#3f8f3a" : "#4fa646";
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + ux * uz * 0.5 + px * gen, y + uy * uz * 0.5 + py * gen, x + ux * uz, y + uy * uz);
      ctx.quadraticCurveTo(x + ux * uz * 0.5 - px * gen, y + uy * uz * 0.5 - py * gen, x, y); ctx.fill();
      ctx.strokeStyle = "#2d6a29"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ux * uz * 0.9, y + uy * uz * 0.9); ctx.stroke();
    }
    elips(ctx, x, y, 2.6, 2.6, "#7c5a2e");
  }

  // ---------- BUZ MAĞARASI ----------
  // Buz kalesi: buz tuğla ön yüz ve sarkıtlar, buz örgülü üst yüz, karlı mazgallar, kar kubbeli yuvarlak buz kuleleri
  function buzKalesi(ctx, w, h, r, p, B) {
    if (B.yon) return buzSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0];
    doldur(ctx, B, "rgba(0, 20, 50, 0.3)", 2, d + 1);
    cizgi(ctx, B, p.koyu, 3, 0, d);                                       // ön yüz: buz tuğla
    doldur(ctx, B, p.buz2, 0, d);
    kirp(ctx, B, () => {
      ctx.strokeStyle = acik(p.buz2, 0.45); ctx.lineWidth = 1;
      for (let y = 6, k = 0; y < h + d; y += 7, k++) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        for (let x = (k % 2) * 9; x < w; x += 18) { ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x, y); ctx.stroke(); }
      }
    }, 0, d);
    if (govde.t === "k") {                                                // sarkıtlar: üst yüzün alt kenarından ön yüze
      const alt = govde.y + govde.h;
      for (let x = govde.x + 6; x < govde.x + govde.w - 6; x += 7 + r() * 5) {
        const uz = Math.min(d - 3, 5 + r() * (d - 6));
        ctx.fillStyle = acik(p.buz, 0.35); ctx.beginPath(); ctx.moveTo(x - 2.6, alt); ctx.lineTo(x + 2.6, alt); ctx.lineTo(x, alt + uz); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(x - 0.9, alt + 1, 1, uz * 0.5);
      }
    }
    cizgi(ctx, B, p.koyu, 3);                                             // üst yüz: buz örgü ve parlama
    doldur(ctx, B, p.buz);
    kirp(ctx, B, () => {
      tasOrgu(ctx, 0, 0, w, h, 12, p.buz, r);
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 2;
      for (let i = 0; i < w / 40; i++) { const x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y - 8); ctx.stroke(); }
    });
    for (const q of B) if (q.t === "k" && q !== govde) {                 // karlı mazgallar
      ctx.fillStyle = acik(p.buz, 0.25); yuvarlak(ctx, q.x, q.y, q.w, q.h - 3, q.rr); ctx.fill();
      elips(ctx, q.x + q.w / 2, q.y + 1.5, q.w * 0.55, 2.6, p.kar);
    }
    for (const t of B.kuleler || []) {                                   // kule: buz halka + kar kubbe + mavi flama
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) elips(ctx, t.x + Math.cos(a) * (t.r - 2.5), t.y + Math.sin(a) * (t.r - 2.5), 3.3, 3.3, acik(p.buz2, 0.3));
      const g = ctx.createRadialGradient(t.x - t.r * 0.3, t.y - t.r * 0.3, 1, t.x, t.y, t.r * 0.8);
      g.addColorStop(0, "#ffffff"); g.addColorStop(1, acik(p.buz2, 0.25));
      elips(ctx, t.x, t.y, t.r * 0.7, t.r * 0.7, g);
      ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x, t.y - t.r * 0.85); ctx.stroke();
      ctx.fillStyle = "#3b82f6"; ctx.beginPath(); ctx.moveTo(t.x, t.y - t.r * 0.85); ctx.lineTo(t.x + 8, t.y - t.r * 0.7); ctx.lineTo(t.x, t.y - t.r * 0.55); ctx.closePath(); ctx.fill();
    }
    return [];
  }
  // Harita sınırı: buz sur, mazgal başlarında kar
  function buzSuru(ctx, w, h, r, p, B) {
    kaleSuru(ctx, w, h, r, { tas: p.buz2 }, B);
    for (const q of B) if (q.t === "d") elips(ctx, q.x, q.y - q.r * 0.3, q.r * 0.78, q.r * 0.42, p.kar);
    return [];
  }
  // Kardan adam: kar yığını kenar, karlı zemin, atkılı havuç burunlu gülümseyen kardan adam(lar)
  function kardanAdam(ctx, w, h, r, p, B) {
    doldur(ctx, B, acik(p.buz2, 0.35), 0, 0, 3);
    for (const k of kenarNoktalari(B, 8, 0)) {                            // kar yığını kenar
      const s = 5 + r() * 3.5;
      elips(ctx, k.x, k.y, s, s * 0.82, acik(p.buz2, 0.55 + r() * 0.2));
      elips(ctx, k.x - s * 0.3, k.y - s * 0.3, s * 0.5, s * 0.36, "#ffffff");
    }
    doldur(ctx, B, "#e8f6ff");
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 600; i++) elips(ctx, r() * w, r() * h, 6 + r() * 10, 2 + r() * 2, "rgba(124, 196, 238, 0.18)");
      for (let i = 0; i < w * h / 400; i++) elips(ctx, r() * w, r() * h, 0.8, 0.8, "#ffffff");
    });
    const n = w * h > 16000 ? 2 : 1, yerler = icNoktalar(B, w, h, n, 18, w * 0.4, r);
    kirp(ctx, B, () => (yerler.length ? yerler : [{ x: w / 2, y: h / 2 }]).forEach((k) => {
      const y = altaIn(B, k.x, k.y, h, 6), r1 = Math.max(6, Math.min(Math.min(w, h) * 0.17, 14, (ustBosluk(B, k.x, y) + 6) / 3.8));
      kardanAdamCiz(ctx, k.x, y, r1, p, r);
    }), 0, 0, 8);
    return [];
  }
  function kardanAdamCiz(ctx, x, y, r1, p, r) {
    const r2 = r1 * 0.72, r3 = r1 * 0.52, y1 = y - r1, y2 = y1 - r1 * 0.85 - r2 * 0.55, y3 = y2 - r2 * 0.85 - r3 * 0.5;
    elips(ctx, x + 2, y, r1 * 1.1, r1 * 0.32, "rgba(30, 64, 110, 0.25)");
    ctx.strokeStyle = "#7c4a1e"; ctx.lineWidth = 1.6; ctx.lineCap = "round";            // dal kollar
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * r2 * 0.8, y2); ctx.lineTo(x + sx * (r2 + 8), y2 - 6); ctx.lineTo(x + sx * (r2 + 10), y2 - 9); ctx.stroke(); }
    for (const [cy, rr] of [[y1, r1], [y2, r2], [y3, r3]]) {
      const g = ctx.createRadialGradient(x - rr * 0.35, cy - rr * 0.35, 1, x, cy, rr);
      g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#cfe8f8");
      elips(ctx, x, cy, rr, rr, g);
    }
    for (const k of [0.1, 0.45]) elips(ctx, x, y1 - r1 * k, 1.4, 1.4, "#1f2937");     // düğmeler
    ctx.fillStyle = p.atki; yuvarlak(ctx, x - r3 * 1.05, y3 + r3 * 0.6, r3 * 2.1, r3 * 0.42, r3 * 0.2); ctx.fill(); // atkı
    yuvarlak(ctx, x + r3 * 0.3, y3 + r3 * 0.8, r3 * 0.42, r3 * 1.1, r3 * 0.2); ctx.fill();
    gozler(ctx, x, y3 - r3 * 0.2, r3 * 0.32, r3 * 0.12, "#1f2937");                   // göz, burun, gülümseme
    ctx.fillStyle = p.havuc; ctx.beginPath(); ctx.moveTo(x, y3 - r3 * 0.02); ctx.lineTo(x + r3 * 0.85, y3 + r3 * 0.12); ctx.lineTo(x, y3 + r3 * 0.22); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.2 + i * 0.15); elips(ctx, x + Math.cos(a) * r3 * 0.5, y3 + r3 * 0.18 + Math.sin(a) * r3 * 0.4, 0.9, 0.9, "#1f2937"); }
    if (r() < 0.5) { ctx.fillStyle = "#1f2937"; yuvarlak(ctx, x - r3 * 0.7, y3 - r3 * 1.15, r3 * 1.4, r3 * 0.32, 1); ctx.fill(); yuvarlak(ctx, x - r3 * 0.45, y3 - r3 * 1.85, r3 * 0.9, r3 * 0.75, 2); ctx.fill(); } // şapka
  }
  // Buz kristali kümesi: buzlu zemin ve çatlaklar, parlayan kristaller; uçlarında parıltı (canlı)
  function kristalKumesi(ctx, w, h, r, p, B) {
    doldur(ctx, B, acik(p.buz2, 0.2), 0, 0, 3);
    for (const k of kenarNoktalari(B, 9, 0)) elips(ctx, k.x, k.y, 4.5, 3.4, acik(p.buz2, 0.5 + r() * 0.3));
    doldur(ctx, B, "#cdeffd");
    kirp(ctx, B, () => {
      ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 1;
      for (let i = 0; i < w * h / 1500; i++) {
        let x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y);
        for (let j = 0; j < 3; j++) { x += (r() - 0.5) * 18; y += (r() - 0.5) * 18; ctx.lineTo(x, y); }
        ctx.stroke();
      }
    });
    const canli = [], kumeler = icNoktalar(B, w, h, Math.max(2, Math.min(5, Math.round(w * h / 3500))), 14, 26, r);
    kirp(ctx, B, () => kumeler.forEach((k) => {
      const y = Math.min(altaIn(B, k.x, k.y, h, 4), k.y + h * 0.22), boy = Math.min(16 + r() * 16, ustBosluk(B, k.x, y) + 6);
      for (const u of kristalKume(ctx, k.x, y, Math.max(10, boy), p, r)) canli.push({ tur: "parilti", x: u.x, y: u.y, n: r() });
    }), 0, 0, 8);
    return canli;
  }
  function kristalKume(ctx, x, y, boy, p, r) {
    elips(ctx, x + 1, y + 1, boy * 0.45, 3, "rgba(30, 64, 110, 0.25)");
    const uclar = [], n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.38 + (r() - 0.5) * 0.2, uz = boy * (i === Math.floor(n / 2) ? 1 : 0.55 + r() * 0.35), g = uz * 0.2;
      const ux = Math.cos(a), uy = Math.sin(a), px = -uy * g, py = ux * g, bx = x + (i - (n - 1) / 2) * 3, by = y;
      const tx = bx + ux * uz, ty = by + uy * uz;
      const grad = ctx.createLinearGradient(bx - px, by - py, bx + px, by + py);
      grad.addColorStop(0, p.kristal2); grad.addColorStop(0.5, "#ecfeff"); grad.addColorStop(1, p.kristal);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(bx - px, by - py); ctx.lineTo(bx + ux * uz * 0.78 - px, by + uy * uz * 0.78 - py);
      ctx.lineTo(tx, ty); ctx.lineTo(bx + ux * uz * 0.78 + px, by + uy * uz * 0.78 + py); ctx.lineTo(bx + px, by + py); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(14, 116, 144, 0.55)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx - ux * 2, ty - uy * 2); ctx.stroke();
      if (i % 2 === 0) uclar.push({ x: tx, y: ty });
    }
    return uclar;
  }
  // Buz kenarlı göl: buz kıyı, yüzen buz parçaları
  function buzGolu(ctx, w, h, r, p, B) {
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, acik(p.buz2, 0.3), 0, 0, 8);
      kirp(ctx, B, () => tasOrgu(ctx, 0, 0, w, h, 9, acik(p.buz, 0.2), r), 0, 0, 7);
    }, p.koyu);
    for (const k of icNoktalar(B, w, h, Math.max(1, Math.round(w * h / 4000)), 10, 18, r)) {
      const s = 5 + r() * 4, a = r() * Math.PI;
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath();
      for (let i = 0; i < 5; i++) { const b = a + i * 1.26, rr = s * (0.7 + r() * 0.3); ctx.lineTo(k.x + Math.cos(b) * rr, k.y + Math.sin(b) * rr * 0.7); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(124, 196, 238, 0.9)"; ctx.lineWidth = 1; ctx.stroke();
    }
    return [];
  }

  // ---------- VOLKAN ----------
  // Kızıl çatlak (önbellekte, parlamalı): zikzak çizgi
  function kizilCatlak(ctx, x, y, adim, n, r, renk, kal = 1.6) {
    ctx.save(); ctx.shadowColor = renk; ctx.shadowBlur = 5; ctx.strokeStyle = renk; ctx.lineWidth = kal; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let j = 0; j < n; j++) { x += (r() - 0.5) * adim * 1.4; y += adim * (0.6 + r() * 0.5); ctx.lineTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  // Bazalt kaya: yuvarlak yumrulardan kaya kütlesi, kızıl çatlaklı ön yüz, gözenekli üst yüz
  function bazaltKaya(ctx, w, h, r, p, B) {
    if (B.yon) return kaleSuru(ctx, w, h, r, { tas: p.bazalt }, B);
    const d = B.derinlik || 0;
    doldur(ctx, B, "rgba(0,0,0,0.35)", 2, d + 1);
    cizgi(ctx, B, p.koyu, 3, 0, d);                                       // ön yüz: koyu bazalt, kızıl çatlaklar
    doldur(ctx, B, koyu(p.bazalt, 0.35), 0, d);
    kirp(ctx, B, () => { for (let i = 0; i < Math.max(2, Math.round(w / 30)); i++) kizilCatlak(ctx, 8 + r() * (w - 16), h - d - 6 - r() * 10, 3, 4, r, p.kizil, 1.4); }, 0, d);
    cizgi(ctx, B, p.koyu, 3);                                             // üst yüz: yumrular
    doldur(ctx, B, p.bazalt);
    kirp(ctx, B, () => {
      for (const q of B) {                                                // yumruların ışığı ve gölgesi
        const rx = q.t === "d" ? q.r : q.rx || q.w / 2, ry = q.t === "d" ? q.r : q.ry || q.h / 2, cx = q.t === "k" ? q.x + q.w / 2 : q.x, cy = q.t === "k" ? q.y + q.h / 2 : q.y;
        elips(ctx, cx + rx * 0.15, cy + ry * 0.2, rx * 0.95, ry * 0.9, koyu(p.bazalt, 0.18));
        elips(ctx, cx - rx * 0.2, cy - ry * 0.25, rx * 0.6, ry * 0.5, acik(p.bazalt, 0.12));
      }
      for (let i = 0; i < w * h / 160; i++) elips(ctx, r() * w, r() * h, 0.9 + r() * 1.2, 0.8 + r(), koyu(p.bazalt, 0.35)); // gözenekler
      for (let i = 0; i < Math.max(1, Math.round(w * h / 9000)); i++) kizilCatlak(ctx, 10 + r() * (w - 20), 6 + r() * (h - d - 20), 4, 3, r, p.kizil, 1.1);
    });
    return [];
  }
  // Ejderha yuvası: dal ve çalıdan yuva kenarı, saman, benekli yumurtalar, birinden bakan yavru
  function ejderhaYuvasi(ctx, w, h, r, p, B) {
    doldur(ctx, B, koyu(p.dal, 0.45), 0, 0, 3);
    doldur(ctx, B, "#4a2f1b");
    kirp(ctx, B, () => {                                                  // saman
      ctx.lineCap = "round";
      for (let i = 0; i < w * h / 70; i++) {
        const x = r() * w, y = r() * h, a = r() * Math.PI, uz = 4 + r() * 6;
        ctx.strokeStyle = karistir("#c8a165", "#000000", r() * 0.35); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * uz, y + Math.sin(a) * uz); ctx.stroke();
      }
    });
    for (const k of kenarNoktalari(B, 5, 0)) {                            // dal-çalı kenar
      const a = Math.atan2(k.ny, k.nx) + (r() - 0.5) * 2.2, uz = 4 + r() * 4;
      ctx.strokeStyle = karistir(p.dal, "#000000", r() * 0.3); ctx.lineWidth = 2 + r() * 1.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(k.x - Math.cos(a) * uz, k.y - Math.sin(a) * uz); ctx.lineTo(k.x + Math.cos(a) * uz * 0.6, k.y + Math.sin(a) * uz * 0.6); ctx.stroke();
      if (r() < 0.25) elips(ctx, k.x, k.y, 4, 3.2, karistir("#3f6212", "#000000", r() * 0.3));
    }
    const n = Math.max(2, Math.min(5, Math.round(w * h / 2600)));
    const yerler = icNoktalar(B, w, h, n, 15, 20, r), yavrulu = Math.floor(r() * yerler.length);
    kirp(ctx, B, () => yerler.forEach((k, i) => ejderhaYumurtasi(ctx, k.x, k.y, 7 + r() * 3, r() < 0.5 ? p.yumurta1 : p.yumurta2, r() < 0.5 ? p.yumurta2 : p.yumurta1, r, i === yavrulu)), 0, 0, 8);
    return [];
  }
  function ejderhaYumurtasi(ctx, x, y, s, renk, benek, r, yavru) {
    elips(ctx, x + 2, y + s * 1.05, s * 0.95, s * 0.3, "rgba(0,0,0,0.35)");
    const g = ctx.createRadialGradient(x - s * 0.35, y - s * 0.5, 1, x, y, s * 1.4);
    g.addColorStop(0, acik(renk, 0.45)); g.addColorStop(1, koyu(renk, 0.25));
    elips(ctx, x, y, s * 0.82, s * 1.12, g);
    for (let i = 0; i < 5; i++) elips(ctx, x + (r() - 0.5) * s * 1.1, y + (r() - 0.5) * s * 1.5, 1.4 + r() * 1.6, 1.2 + r() * 1.2, benek);
    if (!yavru) return;                                                    // çatlak kabuk ve bakan sevimli yavru
    ctx.fillStyle = "#1a0f08"; ctx.beginPath(); ctx.moveTo(x - s * 0.7, y - s * 0.35);
    for (let i = 1; i <= 6; i++) ctx.lineTo(x - s * 0.7 + i * s * 0.233, y - s * 0.35 + (i % 2 ? -s * 0.22 : 0));
    ctx.lineTo(x + s * 0.55, y - s * 0.95); ctx.quadraticCurveTo(x, y - s * 1.35, x - s * 0.55, y - s * 0.95); ctx.closePath(); ctx.fill();
    elips(ctx, x, y - s * 0.6, s * 0.48, s * 0.36, "#65a30d");
    gozler(ctx, x, y - s * 0.66, s * 0.2, s * 0.11, "#fef9c3", "#1f2937");
  }
  // Alev ruhlu kayalar: küllü zemin ve közler, kaya kümesi; kayaların üstünde gülen alev ruhları (canlı)
  function alevRuhluKayalar(ctx, w, h, r, p, B) {
    doldur(ctx, B, koyu(p.bazalt, 0.4), 0, 0, 3);
    kayalikKenar(ctx, B, p.bazalt, r, 8, 1, 6);
    doldur(ctx, B, "#2b2226");
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 260; i++) elips(ctx, r() * w, r() * h, 2 + r() * 5, 1 + r() * 2, "rgba(120, 110, 115, 0.25)");
      ctx.save(); ctx.shadowColor = p.kizil; ctx.shadowBlur = 4;
      for (let i = 0; i < w * h / 700; i++) elips(ctx, r() * w, r() * h, 1 + r() * 0.8, 1 + r() * 0.8, r() < 0.5 ? p.kizil : "#fbbf24");
      ctx.restore();
    });
    const canli = [], kayalar = icNoktalar(B, w, h, Math.max(2, Math.min(4, Math.round(w * h / 3200))), 16, 26, r);
    kirp(ctx, B, () => kayalar.forEach((k) => {
      const s = 9 + r() * 4;
      elips(ctx, k.x + 2, k.y + s * 0.65, s * 1.1, s * 0.32, "rgba(0,0,0,0.4)");
      elips(ctx, k.x, k.y, s * 1.05, s * 0.78, p.bazalt);
      elips(ctx, k.x - s * 0.3, k.y - s * 0.25, s * 0.5, s * 0.3, acik(p.bazalt, 0.15));
      kizilCatlak(ctx, k.x - s * 0.4, k.y - s * 0.2, 2.5, 3, r, p.kizil, 1);
      canli.push({ tur: "alevruhu", x: k.x, y: k.y - s * 0.6, n: r() });
    }), 0, 0, 8);
    return canli;
  }
  // Sıcak su: bazalt kıyı, buhar kabarcıkları (canlı)
  function sicakSu(ctx, w, h, r, p, B) {
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, p.koyu, 0, 0, 8);
      kayalikKenar(ctx, B, p.bazalt, r, 8, 2, 6.5);
    }, koyu(p.bazalt, 0.4));
    return icNoktalar(B, w, h, Math.max(2, Math.round(w * h / 2500)), 10, 16, r).map((k) => ({ tur: "buhar", x: k.x, y: k.y, n: r() }));
  }

  // ---------- UZAY ----------
  // Uzay istasyonu: panelli metal gövde, perçinler, ışıklı pencereli ön yüz, köşe modülleri ve yanıp sönen ışıklar
  function uzayIstasyonu(ctx, w, h, r, p, B) {
    if (B.yon) return metalSur(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0], canli = [];
    doldur(ctx, B, "rgba(0,0,0,0.4)", 2, d + 1);
    cizgi(ctx, B, koyu(p.koyu, 0.4), 3, 0, d);                            // ön yüz: dikey paneller, ışıklı pencereler
    doldur(ctx, B, p.koyu, 0, d);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(p.koyu, 0.3); ctx.lineWidth = 1;
      for (let x = 6; x < w; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h + d); ctx.stroke(); }
    }, 0, d);
    if (govde.t === "k") {
      const alt = govde.y + govde.h, n = Math.max(1, Math.floor(govde.w / 34));
      for (let i = 0; i < n; i++) {
        const cx = govde.x + govde.w * (i + 0.5) / n;
        ctx.fillStyle = "#0b1220"; yuvarlak(ctx, cx - 6, alt + 2, 12, d - 6, 4); ctx.fill();
        ctx.fillStyle = i % 2 ? "rgba(34, 211, 238, 0.75)" : "rgba(244, 114, 182, 0.7)"; yuvarlak(ctx, cx - 4.5, alt + 3.5, 9, d - 9, 3); ctx.fill();
      }
    }
    cizgi(ctx, B, koyu(p.koyu, 0.4), 3);                                   // üst yüz: metal paneller
    doldur(ctx, B, p.metal);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(p.metal, 0.2); ctx.lineWidth = 1;
      for (let y = 12; y < h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let y = 12, k = 0; y < h; y += 16, k++) for (let x = (k % 2) * 12; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke(); }
      ctx.fillStyle = "rgba(250, 204, 21, 0.85)";                         // sarı-siyah uyarı şeridi
      if (govde.t === "k") for (let x = govde.x + 4; x < govde.x + govde.w - 8; x += 12) { ctx.beginPath(); ctx.moveTo(x, govde.y + govde.h - 6); ctx.lineTo(x + 6, govde.y + govde.h - 6); ctx.lineTo(x + 3, govde.y + govde.h); ctx.lineTo(x - 3, govde.y + govde.h); ctx.closePath(); ctx.fill(); }
    });
    if (govde.t === "k") for (let x = govde.x + 6; x < govde.x + govde.w - 4; x += 10) { elips(ctx, x, govde.y + 4, 1.2, 1.2, koyu(p.metal, 0.35)); } // perçinler
    B.forEach((q, i) => {                                                  // köşe modülleri: kubbe, halka, ışık
      if (q.t !== "d") return;
      const g = ctx.createRadialGradient(q.x - q.r * 0.35, q.y - q.r * 0.35, 1, q.x, q.y, q.r);
      g.addColorStop(0, acik(p.metal, 0.5)); g.addColorStop(1, koyu(p.metal, 0.25));
      elips(ctx, q.x, q.y, q.r - 1, q.r - 1, g);
      ctx.strokeStyle = koyu(p.koyu, 0.2); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 0.62, 0, Math.PI * 2); ctx.stroke();
      canli.push({ tur: "isik", x: q.x, y: q.y, n: r(), renk: i % 2 ? p.isik2 : p.isik1 });
    });
    return canli;
  }
  // Harita sınırı: perçinli metal şerit
  function metalSur(ctx, w, h, r, p, B) {
    kaleSuru(ctx, w, h, r, { tas: p.metal }, B);
    for (const q of B) if (q.t === "d") elips(ctx, q.x, q.y, 1.6, 1.6, koyu(p.koyu, 0.2));
    return [];
  }
  // Göktaşı: mor kaya kütlesi, kraterler, parlak kristaller (uçlarında parıltı)
  function goktasi(ctx, w, h, r, p, B) {
    const d = B.derinlik || 0, canli = [];
    doldur(ctx, B, "rgba(0,0,0,0.4)", 2, d + 1);
    cizgi(ctx, B, koyu(p.goktasi, 0.5), 3, 0, d);
    doldur(ctx, B, koyu(p.goktasi, 0.35), 0, d);
    cizgi(ctx, B, koyu(p.goktasi, 0.5), 3);
    doldur(ctx, B, p.goktasi);
    kirp(ctx, B, () => {
      for (const q of B) {
        const rx = q.t === "d" ? q.r : q.rx || q.w / 2, ry = q.t === "d" ? q.r : q.ry || q.h / 2, cx = q.t === "k" ? q.x + q.w / 2 : q.x, cy = q.t === "k" ? q.y + q.h / 2 : q.y;
        elips(ctx, cx - rx * 0.2, cy - ry * 0.25, rx * 0.6, ry * 0.5, acik(p.goktasi, 0.12));
      }
      for (const k of icNoktalar(B, w, h, Math.max(2, Math.round(w * h / 1800)), 6, 14, r)) {   // kraterler
        const s = 3 + r() * 5;
        elips(ctx, k.x, k.y, s, s * 0.7, koyu(p.goktasi, 0.3)); elips(ctx, k.x + s * 0.2, k.y + s * 0.15, s * 0.7, s * 0.45, koyu(p.goktasi, 0.45));
        ctx.strokeStyle = acik(p.goktasi, 0.25); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(k.x, k.y, s, s * 0.7, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      }
    });
    const kp = { kristal: p.kristal, kristal2: koyu(p.kristal, 0.25) };
    kirp(ctx, B, () => {
      for (const k of icNoktalar(B, w, h, Math.max(1, Math.min(3, Math.round(w * h / 4500))), 12, 24, r)) {
        for (const u of kristalKume(ctx, k.x, k.y, Math.min(14 + r() * 8, ustBosluk(B, k.x, k.y) + 4), kp, r)) canli.push({ tur: "parilti", x: u.x, y: u.y, n: r() });
      }
    }, 0, 0, 4);
    return canli;
  }
  // Düşmüş UFO: yanık iniş izi, eğik metal gövde, cam kubbede el sallayan uzaylı hayalet, kenar ışıkları (canlı)
  function dusmusUfo(ctx, w, h, r, p, B) {
    doldur(ctx, B, "#2a2438", 0, 0, 3);
    kayalikKenar(ctx, B, "#5b5470", r, 8, 1, 5.5);
    doldur(ctx, B, "#1e1b2e");
    const m = icNoktalar(B, w, h, 1, Math.min(w, h) * 0.3, 0, r)[0] || { x: w / 2, y: h / 2 };
    kirp(ctx, B, () => {
      ctx.strokeStyle = "rgba(167, 139, 250, 0.25)"; ctx.lineWidth = 2;   // yanık halkalar
      for (const k of [1, 1.6, 2.3]) { ctx.beginPath(); ctx.ellipse(m.x, m.y + 4, Math.min(w, h) * 0.18 * k, Math.min(w, h) * 0.1 * k, 0, 0, Math.PI * 2); ctx.stroke(); }
      for (let i = 0; i < w * h / 500; i++) elips(ctx, r() * w, r() * h, 0.8, 0.8, "rgba(255,255,255,0.35)");
    });
    const s = Math.min(Math.min(w, h) * 0.3, 2 * Math.min(ustBosluk(B, m.x, m.y), altBosluk(B, m.x, m.y)) / 1.3, 34), canli = [];
    kirp(ctx, B, () => {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(-0.18);
      elips(ctx, 3, s * 0.42, s * 1.15, s * 0.22, "rgba(0,0,0,0.45)");
      const kub = ctx.createLinearGradient(0, -s, 0, 0); kub.addColorStop(0, "rgba(207, 250, 254, 0.9)"); kub.addColorStop(1, "rgba(103, 232, 249, 0.55)");
      ctx.fillStyle = kub; ctx.beginPath(); ctx.ellipse(0, -s * 0.12, s * 0.5, s * 0.55, 0, Math.PI, 0); ctx.fill();
      elips(ctx, 0, -s * 0.28, s * 0.24, s * 0.26, p.uzayli);             // uzaylı hayalet: kafa, gözler, sallanan el
      gozler(ctx, 0, -s * 0.32, s * 0.09, s * 0.06, "#1f2937", "#ffffff");
      ctx.strokeStyle = p.uzayli; ctx.lineWidth = Math.max(2, s * 0.08); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(s * 0.18, -s * 0.2); ctx.lineTo(s * 0.34, -s * 0.46); ctx.stroke();
      elips(ctx, s * 0.36, -s * 0.5, s * 0.06, s * 0.06, p.uzayli);
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, -s * 0.12, s * 0.42, s * 0.47, 0, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
      const gov = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.25); gov.addColorStop(0, acik(p.ufo, 0.35)); gov.addColorStop(1, koyu(p.ufo, 0.35));
      elips(ctx, 0, 0, s, s * 0.3, gov);
      elips(ctx, 0, s * 0.08, s * 0.55, s * 0.12, koyu(p.ufo, 0.4));
      ctx.restore();
      const yer = (a) => { const cx = Math.cos(a) * s * 0.78, cy = Math.sin(a) * s * 0.18; return { x: m.x + cx * Math.cos(-0.18) - cy * Math.sin(-0.18), y: m.y + cx * Math.sin(-0.18) + cy * Math.cos(-0.18) }; };
      [0.35, 1.2, 1.95, 2.8].forEach((a, i) => { const k = yer(a); canli.push({ tur: "isik", x: k.x, y: k.y, n: r(), renk: i % 2 ? "#f472b6" : "#22d3ee" }); });
    }, 0, 0, 8);
    return canli;
  }
  // Metal kenarlı havuz: perçinli metal kıyı, suda yıldız yansımaları (canlı)
  function metalHavuz(ctx, w, h, r, p, B) {
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, p.koyu, 0, 0, 8);
      kirp(ctx, B, () => tasOrgu(ctx, 0, 0, w, h, 7, p.metal, r), 0, 0, 7);
      for (const k of kenarNoktalari(B, 12, 5)) elips(ctx, k.x, k.y, 1.2, 1.2, koyu(p.koyu, 0.3));
    }, koyu(p.koyu, 0.35));
    return icNoktalar(B, w, h, Math.max(2, Math.round(w * h / 4000)), 8, 18, r).map((k) => ({ tur: "yildiz", x: k.x, y: k.y, n: r() }));
  }

  // ---------- TEMA SETLERİ (sıra LEVEL_THEMES ile aynı; eksik tema dizin 0'a düşer) ----------
  window.ENGEL_TEMALARI = [
    { ad: "Mor Şato", palet: { tas: "#6e5f91", cati: "#7c3aed", toprak: "#2f2442", cim: "#4b3b66", mezar: "#9ca3af", tarla: "#5b3a24" },
      duvar: kaleDuvari, obje1: mezarlik, obje2: balkabagiTarlasi, su: hendek },
    { ad: "Yeşil Orman", palet: { tahta: "#8b5a2b", yaprak: "#2f6b2a", cim: "#2f7a32" },
      duvar: kutukCit, obje1: urkuncAgaclar, obje2: mantarHalkasi, su: sazlikGolet },
    { ad: "Çöl", palet: { tas: "#c8a165", koyu: "#8a6a3a", kum: "#d9b26b", cakil: "#b08850", kaktus: "#4d9a52", altin: "#e0b84f", mavi: "#2563eb", sargi: "#f1e7cf" },
      duvar: harabeDuvari, obje1: kaktusBahcesi, obje2: mumyaLahdi, su: vaha },
    { ad: "Buz Mağarası", palet: { buz: "#bfe8ff", buz2: "#7cc4ee", koyu: "#2b6c9a", kar: "#f4fbff", atki: "#ef4444", havuc: "#f97316", kristal: "#a5f3fc", kristal2: "#67e8f9" },
      duvar: buzKalesi, obje1: kardanAdam, obje2: kristalKumesi, su: buzGolu },
    { ad: "Volkan", palet: { bazalt: "#3b3138", koyu: "#231c22", kizil: "#f97316", dal: "#7c4a1e", yumurta1: "#a3e635", yumurta2: "#fbbf24" },
      duvar: bazaltKaya, obje1: ejderhaYuvasi, obje2: alevRuhluKayalar, su: sicakSu },
    { ad: "Uzay", palet: { metal: "#9ca3af", koyu: "#4b5563", isik1: "#22d3ee", isik2: "#f472b6", goktasi: "#6b5b7b", kristal: "#c084fc", ufo: "#94a3b8", uzayli: "#86efac" },
      duvar: uzayIstasyonu, obje1: goktasi, obje2: dusmusUfo, su: metalHavuz },
  ];
})();
