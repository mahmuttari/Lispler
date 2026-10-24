/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: ÜLKE OBJELERİ (Asya, 3.14.0)
   Ressam imzası engel-temalari.js ile aynı: (ctx, w, h, r, p, B) -> canli[]. B "yama" ya da "kaya" biçimi; süsler
   biçimin içinde kalır, sabit çizim dikdörtgenin üst kenarından taşmaz; uzun yapılar maket boyunda (spec §5.3).
   Canlı süsler ENGEL_CANLI'ya eklenir (her karede çizilir). Math.random yok; insan, bayrak, dinî öğe, silah yok.
   Japonya (Görev 5): kiraz ağaçları ve düşen yapraklar, Fuji Dağı maketi. Öteki Asya ülkeleri Görev 10–12'de.
   ============================================================ */
window.ULKE_OBJELERI = window.ULKE_OBJELERI || {};
(function () {
  const { doldur, cizgi, kirp, icNoktalar, karistir, acik, koyu, elips, cimTutami } = window.ENGEL;
  const ustBosluk = (B, x, y, en = 140) => { let k = 0; while (k < en && window.engelUzaklik(B, x, y - k - 2) < -2) k += 2; return k; };

  // ---------- canlı: yaprak düşer ve sallanır (renk k.renk; varsayılan kiraz pembesi) ----------
  Object.assign(window.ENGEL_CANLI, {
    yaprak(ctx, x, y, zaman, n, k) {
      const renk = (k && k.renk) || "#f9c0d4", eski = ctx.globalAlpha;
      for (const ek of [0, 0.5]) {
        const t = (zaman * 0.32 + n + ek) % 1;
        const px = x + Math.sin(zaman * 1.9 + n * 7 + ek * 5) * 3.5, py = y + t * 16;
        ctx.globalAlpha = eski * Math.min(1, (1 - t) * 2.2);
        ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(zaman * 2.4 + n * 3 + ek) * 0.9);
        ctx.fillStyle = renk; ctx.beginPath(); ctx.ellipse(0, 0, 2.2, 1.3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = eski;
    },
  });

  // ---------- JP: kiraz ağaçları ----------
  // Yosun yeşili zemin, dökülmüş yapraklar; kıvrık gövdeli 2–4 ağaç, pembe çiçek bulutları; taçların altında canlı yaprak
  function kirazAgaclari(ctx, w, h, r, p, B) {
    const pembe = p.vurgu1 || "#f4a6c0", cim = "#3f5a3a", canli = [];
    doldur(ctx, B, koyu(cim, 0.45), 0, 0, 3);
    doldur(ctx, B, cim);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 380; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 2, karistir("#5f8a4a", "#000000", r() * 0.3));
      for (let i = 0; i < w * h / 160; i++) elips(ctx, r() * w, r() * h, 1.3, 0.8, karistir(pembe, "#ffffff", r() * 0.4));
    });
    const n = Math.max(1, Math.min(4, Math.round(w * h / 4200)));
    const yerler = icNoktalar(B, w, h, n, 16, 30, r).map((k) => ({ ...k, bos: ustBosluk(B, k.x, k.y) }));
    for (const k of yerler) {
      const boy = Math.max(18, Math.min(46, k.bos + 4)), x = k.x, taban = k.y + 6;
      const taç = Math.min(15, boy * 0.42 + 3), ty = taban - boy + taç * 0.9;
      elips(ctx, x + 2, taban, taç * 0.9, taç * 0.3, "rgba(0,0,0,0.28)");
      ctx.strokeStyle = "#5a3a2a"; ctx.lineCap = "round";                          // gövde ve dallar
      ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x, taban); ctx.quadraticCurveTo(x - 3, (taban + ty) / 2, x + 1, ty + 2); ctx.stroke();
      ctx.lineWidth = 1.8;
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, (taban + ty) / 2 + 2); ctx.quadraticCurveTo(x + sx * 5, ty + 6, x + sx * taç * 0.7, ty + 1); ctx.stroke(); }
      for (let i = 0; i < 7; i++) {                                                // çiçek bulutları
        const a = (i / 7) * Math.PI * 2 + r() * 0.5, R = taç * (0.42 + r() * 0.2);
        const bx = x + Math.cos(a) * taç * 0.55, by = ty + Math.sin(a) * taç * 0.4;
        elips(ctx, bx + 1, by + 1.5, R, R * 0.85, koyu(pembe, 0.2));
        elips(ctx, bx, by, R, R * 0.85, karistir(pembe, "#ffffff", r() * 0.25));
      }
      elips(ctx, x - taç * 0.25, ty - taç * 0.3, taç * 0.35, taç * 0.22, acik(pembe, 0.45));
      for (let i = 0; i < 6; i++) elips(ctx, x + (r() - 0.5) * taç * 1.4, ty + (r() - 0.5) * taç * 0.8, 1, 1, "#fff1f5");
      canli.push({ tur: "yaprak", x: x + (r() - 0.5) * taç, y: ty + taç * 0.5, n: r(), renk: acik(pembe, 0.25) });
    }
    return canli;
  }

  // ---------- JP: Fuji Dağı (kaya biçimi) ----------
  // Ön yüz koyu kaya; üstte mavi-mor yamaçlar, gövde elipsinin tepesinde tırtıklı kar örtüsü, yamaçlarda bulut şeridi
  function fujiDagi(ctx, w, h, r, p, B) {
    const d = B.derinlik || 0, yamac = "#5d6f93", govde = B[0];
    doldur(ctx, B, "rgba(0,0,0,0.38)", 2, d + 1);
    cizgi(ctx, B, koyu(yamac, 0.5), 3, 0, d);
    doldur(ctx, B, koyu(yamac, 0.35), 0, d);
    cizgi(ctx, B, koyu(yamac, 0.5), 3);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, acik(yamac, 0.25)); g.addColorStop(1, koyu(yamac, 0.15));
    doldur(ctx, B, g);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(yamac, 0.18); ctx.lineWidth = 1.2;                  // yamaç çizgileri
      for (let i = 0; i < w / 9; i++) { const x = r() * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (x < w / 2 ? -1 : 1) * h * 0.25, h); ctx.stroke(); }
      const tepeler = B.filter((q) => q.t !== "k").sort((a, b) => (a.y - (a.ry || a.r)) - (b.y - (b.ry || b.r))).slice(0, 2);
      for (const q of [govde, ...tepeler]) {                                     // kar örtüleri
        const cx = q.x, ry = q.ry || q.r, rx = q.rx || q.r, ust = q.y - ry, kar = ry * 0.85;
        ctx.fillStyle = "#f4f7fb"; ctx.beginPath(); ctx.moveTo(cx - rx * 1.2, ust - 2);
        ctx.lineTo(cx + rx * 1.2, ust - 2); ctx.lineTo(cx + rx * 1.2, ust + kar * 0.7);
        for (let i = 6; i >= 0; i--) ctx.lineTo(cx - rx * 1.2 + (i / 6) * rx * 2.4, ust + kar * (i % 2 ? 0.95 : 0.6));
        ctx.closePath(); ctx.fill();
      }
      for (let i = 0; i < 3; i++) elips(ctx, w * (0.2 + r() * 0.6), h * (0.55 + r() * 0.2), 10 + r() * 8, 3 + r() * 1.5, "rgba(255,255,255,0.35)");   // bulut şeridi
    });
    return [];
  }

  Object.assign(window.ULKE_OBJELERI, { kirazAgaclari, fujiDagi });
})();
