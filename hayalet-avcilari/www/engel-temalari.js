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

  // ---------- TEMA SETLERİ (sıra LEVEL_THEMES ile aynı; eksik tema dizin 0'a düşer) ----------
  window.ENGEL_TEMALARI = [
    { ad: "Mor Şato", palet: { tas: "#6e5f91", cati: "#7c3aed", toprak: "#2f2442", cim: "#4b3b66", mezar: "#9ca3af", tarla: "#5b3a24" },
      duvar: kaleDuvari, obje1: mezarlik, obje2: balkabagiTarlasi, su: hendek },
    { ad: "Yeşil Orman", palet: { tahta: "#8b5a2b", yaprak: "#2f6b2a", cim: "#2f7a32" },
      duvar: kutukCit, obje1: urkuncAgaclar, obje2: mantarHalkasi, su: sazlikGolet },
  ];
})();
