/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: ÜLKE OBJELERİ (Amerika, 3.14.0)
   Ressam imzası engel-temalari.js ile aynı: (ctx, w, h, r, p, B) -> canli[]. B "yama" ya da "kaya" biçimi; süsler
   biçimin içinde kalır; uzun yapılar maket boyunda (spec §5.3). Canlı süsler ENGEL_CANLI'ya eklenir (her karede
   çizilir). Math.random yok; insan, bayrak, dinî öğe, silah yok (tapınak çizilmez).
   Görev 13: Kanada, ABD (KA ailesi); Meksika, Kolombiya, Peru, Brezilya, Arjantin (LA ailesi).
   Yerleşim yardımcıları avrupa, afrika ve asya dosyalarından (ULKE_OBJE_YARDIMCI; o dosyalar önce yüklenir).
   ============================================================ */
window.ULKE_OBJELERI = window.ULKE_OBJELERI || {};
(function () {
  const { doldur, cizgi, kirp, icNoktalar, karistir, acik, koyu, elips, cimTutami, yuvarlak, gozler } = window.ENGEL;
  const { yamaZemin, yapiSigdir, enIyiYer, disinda, yaprakKubbe, icAralik, egrelti, ustteYer } = window.ULKE_OBJE_YARDIMCI;
  const { kiremitler, samanCati } = window.ULKE_AILE_YARDIMCI;
  const uz = (B, x, y) => window.engelUzaklik(B, x, y);
  const ustBosluk = (B, x, y, en = 160) => { let k = 0; while (k < en && uz(B, x, y - k - 2) < -2) k += 2; return k; };
  const dalga = (ctx, w, y0, y1, ara = 6) => {                                                                                 // su çizgileri
    ctx.strokeStyle = "rgba(255,255,255,0.32)"; ctx.lineWidth = 0.8;
    for (let y = y0; y < y1; y += ara) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 8 + y) * 0.8); ctx.stroke(); }
  };

  // ---------- canlı: papel picado (ipte sallanan, oyma desenli renkli kâğıt bayrakçıklar). Çapa ipin sol ucu; k.g ip
  // boyu, k.s sarkma ----------
  // ---------- canlı: teleferik (kabin kablo boyunca gidip gelir). Çapa kablonun alt ucu; k.dx, k.dy üst uca fark,
  // k.s sarkma ----------
  const PAPEL = ["#d63a7a", "#f2a23a", "#2fa3a0", "#7a4ab0", "#3aa05a", "#e8402a"];
  Object.assign(window.ENGEL_CANLI, {
    papel(ctx, x, y, zaman, n, k) {
      const g = k.g, sark = k.s || 6, ipY = (t) => y + sark * 4 * t * (1 - t) + Math.sin(zaman * 1.5 + n * 5) * 0.8 * Math.sin(t * Math.PI);
      ctx.strokeStyle = "#f4f1ea"; ctx.lineWidth = 0.5; ctx.beginPath(); for (let t = 0; t <= 1.001; t += 0.1) ctx.lineTo(x + g * t, ipY(t)); ctx.stroke();
      const adet = Math.max(2, Math.floor(g / 9));
      for (let i = 0; i < adet; i++) {
        const t = (i + 0.5) / adet, a = Math.sin(zaman * 3 + i * 1.3 + n * 7) * 0.22;
        ctx.save(); ctx.translate(x + g * t, ipY(t)); ctx.rotate(a);
        ctx.fillStyle = PAPEL[(i + Math.floor(n * 6)) % PAPEL.length]; ctx.beginPath(); ctx.moveTo(-3.2, 0); ctx.lineTo(3.2, 0); ctx.lineTo(3.2, 6);
        for (let j = 1; j <= 4; j++) ctx.lineTo(3.2 - j * 1.6, j % 2 ? 7.2 : 6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.75)"; elips(ctx, 0, 3, 0.9, 0.9, "rgba(255,255,255,0.75)");                   // oyma desen
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 2, 1.2); ctx.lineTo(sx * 2.6, 2.4); ctx.lineTo(sx * 1.4, 2.4); ctx.closePath(); ctx.fill(); elips(ctx, sx * 1.8, 4.6, 0.5, 0.5, "rgba(255,255,255,0.75)"); }
        ctx.restore();
      }
    },
    teleferik(ctx, x, y, zaman, n, k) {
      const t = 0.5 - 0.5 * Math.cos(zaman * 0.45 + n * 6), px = x + k.dx * t, py = y + k.dy * t + (k.s || 4) * 4 * t * (1 - t);
      ctx.strokeStyle = "#3a3a40"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + 3); ctx.stroke();
      elips(ctx, px, py, 1.2, 1.2, "#3a3a40");
      ctx.fillStyle = "#3a3a40"; yuvarlak(ctx, px - 4.6, py + 2.6, 9.2, 7.2, 2.6); ctx.fill();
      ctx.fillStyle = "#cfe6f2"; yuvarlak(ctx, px - 3.8, py + 3.4, 7.6, 5.4, 2); ctx.fill();
      ctx.fillStyle = "#e8402a"; ctx.fillRect(px - 4.6, py + 7.4, 9.2, 1.6);
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillRect(px - 3, py + 3.8, 1.2, 3.6);
    },
  });

  // =================== KANADA ===================
  // ---------- CA: akçaağaç ormanı ve şurup kovaları ----------
  // Kırmızı-turuncu yaprak halısı; kızıl taçlı akçaağaçlar, gövdelerde musluklu şurup kovaları, yerde odun ve şurup
  // fıçısı; taçlardan kırmızı yapraklar düşer (canlı)
  function akcaagac(ctx, x, taban, boy, r) {
    const tac = Math.min(17, boy * 0.45 + 3), ty = taban - boy + tac * 0.85;
    elips(ctx, x + 2, taban, tac * 0.95, tac * 0.3, "rgba(0,0,0,0.28)");
    ctx.strokeStyle = "#5a4030"; ctx.lineCap = "round"; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(x, taban); ctx.quadraticCurveTo(x - 2, (taban + ty) / 2, x + 1, ty + 3); ctx.stroke();
    ctx.lineWidth = 1.5; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, (taban + ty) / 2 + 2); ctx.quadraticCurveTo(x + sx * 5, ty + 6, x + sx * tac * 0.7, ty + 2); ctx.stroke(); }
    yaprakKubbe(ctx, x, ty, tac, r, ["#c8302a", "#e0552a", "#b8281f"], "#7a1a12");
    for (let i = 0; i < 5; i++) elips(ctx, x + (r() - 0.5) * tac * 1.3, ty + (r() - 0.6) * tac * 0.6, 1.6, 1.2, "#f2a23a");
    const kx = x + 1.8, ky = taban - Math.min(boy * 0.3, 12);                                                                   // musluk ve kova
    ctx.strokeStyle = "#8a9098"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(kx - 0.5, ky - 1.5); ctx.lineTo(kx + 2.2, ky - 1); ctx.stroke();
    ctx.fillStyle = "#9aa4ae"; ctx.beginPath(); ctx.moveTo(kx, ky - 1); ctx.lineTo(kx + 5, ky - 1); ctx.lineTo(kx + 4.4, ky + 4); ctx.lineTo(kx + 0.6, ky + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#c8d0d8"; ctx.fillRect(kx - 0.4, ky - 2.2, 5.8, 1.4);
    return ty;
  }
  function akcaagacOrmani(ctx, w, h, r, p, B) {
    const canli = [];
    yamaZemin(ctx, B, w, h, r, "#8a6a3a", null);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 70; i++) { const x = r() * w, y = r() * h; ctx.save(); ctx.translate(x, y); ctx.rotate(r() * Math.PI); elips(ctx, 0, 0, 2.2, 1.3, ["#c8302a", "#e0552a", "#f2a23a", "#a8281f", "#d8b04a"][i % 5]); ctx.restore(); }
    });
    const n = Math.max(1, Math.min(5, Math.round(w * h / 3600)));
    const yerler = icNoktalar(B, w, h, n, 16, 28, r).sort((a, b) => a.y - b.y);
    for (const k of yerler) {
      const taban = k.y + 6, ty = akcaagac(ctx, k.x, taban, Math.max(18, Math.min(50, ustBosluk(B, k.x, taban) + 4)), r);
      canli.push({ tur: "yaprak", x: k.x + (r() - 0.5) * 10, y: ty + 5, n: r(), renk: "#d8402a" });
    }
    const f = icNoktalar(B, w, h, 1, 10, 0, r).filter((k) => yerler.every((t) => Math.hypot(t.x - k.x, t.y + 3 - k.y) > 16))[0];
    if (f && w * h > 9000) {                                                                                                     // şurup fıçısı
      elips(ctx, f.x + 1, f.y + 1, 6, 2, "rgba(0,0,0,0.28)");
      ctx.fillStyle = "#8a5a32"; yuvarlak(ctx, f.x - 4.5, f.y - 9, 9, 10, 2.5); ctx.fill();
      ctx.fillStyle = "#3a3a40"; ctx.fillRect(f.x - 4.6, f.y - 7, 9.2, 1); ctx.fillRect(f.x - 4.6, f.y - 2.5, 9.2, 1);
      elips(ctx, f.x, f.y - 9, 4.5, 1.6, "#b07a4a");
    }
    return canli;
  }

  // ---------- CA: kunduz barajı ----------
  // Gölet (her yerde aynı mavi) ortasından geçen dal ve çamur baraj, gölette dal yığını kunduz yuvası, barajın üstünde
  // dal taşıyan sevimli bir kunduz, gölette yüzen ikincisinin başı ve dalga izi; aşağı akışta köpüklü su
  function kunduz(ctx, x, taban, s, yon) {
    const kahve = "#8a5a32";
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, 0, 0.5, s * 0.45, s * 0.07, "rgba(0,0,0,0.25)");
    ctx.save(); ctx.translate(-s * 0.42, -s * 0.07); ctx.rotate(-0.15); elips(ctx, 0, 0, s * 0.3, s * 0.11, "#4a3a30");   // kuyruk
    ctx.strokeStyle = "#6a5a4a"; ctx.lineWidth = 0.5; ctx.beginPath(); for (let k = -0.24; k < 0.26; k += 0.08) { ctx.moveTo(k * s, -s * 0.09); ctx.lineTo(k * s, s * 0.09); } ctx.moveTo(-s * 0.28, 0); ctx.lineTo(s * 0.28, 0); ctx.stroke(); ctx.restore();
    elips(ctx, 0, -s * 0.38, s * 0.3, s * 0.36, kahve);                                                                         // gövde
    elips(ctx, s * 0.06, -s * 0.3, s * 0.17, s * 0.25, "#b07a4a");
    for (const sx of [-1, 1]) elips(ctx, sx * s * 0.13, -s * 0.03, s * 0.09, s * 0.05, "#3a2a20");
    ctx.strokeStyle = "#a8844a"; ctx.lineWidth = s * 0.05; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-s * 0.22, -s * 0.48); ctx.lineTo(s * 0.38, -s * 0.56); ctx.stroke();   // dal
    for (const [lx, ly] of [[s * 0.4, -s * 0.57], [s * 0.3, -s * 0.6]]) elips(ctx, lx, ly - s * 0.04, s * 0.05, s * 0.025, "#5f8a3a");
    for (const px of [-s * 0.08, s * 0.14]) elips(ctx, px, -s * 0.52, s * 0.07, s * 0.05, "#6a4426");                       // patiler
    const hy = -s * 0.86;
    for (const ex of [-s * 0.12, s * 0.2]) elips(ctx, ex, hy - s * 0.17, s * 0.06, s * 0.06, "#5a3a22");                       // kulaklar
    elips(ctx, s * 0.04, hy, s * 0.24, s * 0.21, kahve);
    elips(ctx, s * 0.11, hy + s * 0.08, s * 0.13, s * 0.09, "#c89a6a");
    elips(ctx, s * 0.12, hy + s * 0.03, s * 0.05, s * 0.035, "#2a1a10");
    ctx.fillStyle = "#f4e8c8"; ctx.fillRect(s * 0.075, hy + s * 0.13, s * 0.04, s * 0.07); ctx.fillRect(s * 0.12, hy + s * 0.13, s * 0.04, s * 0.07);   // dişler
    gozler(ctx, s * 0.04, hy - s * 0.05, s * 0.09, s * 0.035, "#1f1a14");
    elips(ctx, s * 0.0, hy + s * 0.07, s * 0.04, s * 0.025, "rgba(240, 130, 150, 0.5)"); elips(ctx, s * 0.21, hy + s * 0.07, s * 0.04, s * 0.025, "rgba(240, 130, 150, 0.5)");
    ctx.restore();
  }
  function kunduzBaraji(ctx, w, h, r, p, B) {
    const by = h * 0.58;
    yamaZemin(ctx, B, w, h, r, "#1e7fd6", null);
    kirp(ctx, B, () => {
      dalga(ctx, w, 6, by - 6);
      ctx.fillStyle = "#4a7fb8"; ctx.fillRect(0, by + 6, w, h - by);                                                             // aşağı akış
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1; for (let x = 4; x < w; x += 7) { ctx.beginPath(); ctx.moveTo(x, by + 7); ctx.lineTo(x + 1, by + 12 + (x % 5)); ctx.stroke(); }
      ctx.fillStyle = "#5a4030"; ctx.beginPath(); ctx.moveTo(0, by - 4); for (let x = 0; x <= w; x += 5) ctx.lineTo(x, by - 5 + Math.sin(x / 7) * 1.5); ctx.lineTo(w, by + 8); ctx.lineTo(0, by + 8); ctx.closePath(); ctx.fill();   // baraj
      for (let i = 0; i < w / 2.2; i++) {
        const x = r() * w, y = by - 4 + r() * 11, a = (r() - 0.5) * 0.9, L = 7 + r() * 9;
        ctx.strokeStyle = ["#8a6238", "#a8844a", "#6b4426", "#c8a46a"][i % 4]; ctx.lineWidth = 1.2 + r(); ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2); ctx.lineTo(x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2); ctx.stroke();
      }
      dalga(ctx, w, by + 16, h, 7);
    });
    const yx = w * 0.72, yuva = yapiSigdir(B, yx, by - 10, 34, 22);                                                             // kunduz yuvası
    if (yuva) {
      const { g, b } = yuva;
      elips(ctx, yx, by - 10, g * 0.55, b * 0.15, "rgba(0,0,0,0.25)");
      ctx.fillStyle = "#6b4a2e"; ctx.beginPath(); ctx.ellipse(yx, by - 10, g / 2, b, 0, Math.PI, 0); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(yx, by - 10, g / 2, b, 0, Math.PI, 0); ctx.clip();
      for (let i = 0; i < 26; i++) { const a = Math.PI + r() * Math.PI, rr = r(); ctx.strokeStyle = ["#8a6238", "#a8844a", "#5a3a22"][i % 3]; ctx.lineWidth = 1.2; ctx.beginPath(); const px = yx + Math.cos(a) * g / 2 * rr, py = by - 10 + Math.sin(a) * b * rr; ctx.moveTo(px - 5, py - (r() - 0.5) * 4); ctx.lineTo(px + 5, py + (r() - 0.5) * 4); ctx.stroke(); }
      ctx.restore();
    }
    const kx = w * 0.32, s = Math.min(30, Math.max(14, ustBosluk(B, kx, by + 2) * 0.8));                                         // barajdaki kunduz
    if (yapiSigdir(B, kx, by + 2, s * 0.9, s * 1.12)) kunduz(ctx, kx, by + 2, s, 1);
    const yz = icNoktalar(B, w, h, 1, 12, 0, r).filter((k) => k.y < by - 14 && Math.abs(k.x - yx) > 22 && Math.abs(k.x - kx) > 16)[0];
    if (yz) {                                                                                                                   // yüzen kunduz
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(yz.x - 3, yz.y + 1); ctx.lineTo(yz.x - 14, yz.y - 4); ctx.moveTo(yz.x - 3, yz.y + 1); ctx.lineTo(yz.x - 14, yz.y + 6); ctx.stroke();
      elips(ctx, yz.x, yz.y, 4.5, 3.5, "#8a5a32"); elips(ctx, yz.x + 3, yz.y + 0.5, 2, 1.5, "#c89a6a"); elips(ctx, yz.x + 1, yz.y - 1.2, 0.6, 0.6, "#1f1a14");
      elips(ctx, yz.x - 2, yz.y - 3, 1.1, 1.1, "#5a3a22");
    }
    return [];
  }

  // =================== ABD ===================
  // ---------- US: Özgürlük Heykeli (maket) ----------
  // Körfezde (her yerde aynı mavi) yeşil ada, yıldız biçimli taş tabya, taş kaide; bakır yeşili heykel: dökümlü giysi,
  // ışın taç, kalkık kolda altın meşale alevi, öbür kolda tablet
  function heykel(ctx, x, taban, s) {
    const bakir = "#5aa58f", koyuB = "#3f7f6a", acikB = "#86c8b0", tas = "#c8b89a";
    const ky = taban - s * 0.36;                                                                                                 // kaide
    ctx.fillStyle = tas; ctx.beginPath(); ctx.moveTo(x - s * 0.17, taban); ctx.lineTo(x - s * 0.12, ky); ctx.lineTo(x + s * 0.12, ky); ctx.lineTo(x + s * 0.17, taban); ctx.closePath(); ctx.fill();
    ctx.fillStyle = koyu(tas, 0.18); ctx.beginPath(); ctx.moveTo(x + s * 0.04, taban); ctx.lineTo(x + s * 0.04, ky); ctx.lineTo(x + s * 0.12, ky); ctx.lineTo(x + s * 0.17, taban); ctx.closePath(); ctx.fill();
    ctx.fillStyle = acik(tas, 0.15); ctx.fillRect(x - s * 0.14, ky - s * 0.02, s * 0.28, s * 0.03); ctx.fillRect(x - s * 0.15, taban - s * 0.16, s * 0.3, s * 0.025);
    ctx.fillStyle = koyu(tas, 0.35); for (const dx of [-0.07, 0, 0.07]) ctx.fillRect(x + dx * s - s * 0.012, ky + s * 0.06, s * 0.024, s * 0.06);
    const sy = taban - s * 0.76, gw = s * 0.2;                                                                                  // giysi
    ctx.fillStyle = bakir; ctx.beginPath(); ctx.moveTo(x - gw * 0.62, ky); ctx.quadraticCurveTo(x - gw * 0.6, sy + s * 0.1, x - gw * 0.42, sy); ctx.lineTo(x + gw * 0.42, sy); ctx.quadraticCurveTo(x + gw * 0.62, sy + s * 0.12, x + gw * 0.6, ky); ctx.closePath(); ctx.fill();
    ctx.fillStyle = koyuB; ctx.beginPath(); ctx.moveTo(x + gw * 0.1, sy); ctx.lineTo(x + gw * 0.42, sy); ctx.quadraticCurveTo(x + gw * 0.62, sy + s * 0.12, x + gw * 0.6, ky); ctx.lineTo(x + gw * 0.2, ky); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = koyuB; ctx.lineWidth = Math.max(0.6, s * 0.008); ctx.beginPath(); for (const dx of [-0.35, -0.12]) { ctx.moveTo(x + dx * gw, sy + s * 0.04); ctx.quadraticCurveTo(x + dx * gw - 1, (sy + ky) / 2, x + dx * gw * 1.3, ky); } ctx.stroke();
    ctx.strokeStyle = acikB; ctx.beginPath(); ctx.moveTo(x - gw * 0.42, sy + s * 0.02); ctx.lineTo(x + gw * 0.3, sy + s * 0.12); ctx.stroke();   // omuz atkısı
    ctx.save(); ctx.translate(x - gw * 0.45, sy + s * 0.1); ctx.rotate(-0.25); ctx.fillStyle = acikB; ctx.fillRect(-s * 0.035, -s * 0.06, s * 0.07, s * 0.11); ctx.restore();   // tablet
    ctx.strokeStyle = bakir; ctx.lineWidth = s * 0.05; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x + gw * 0.36, sy + s * 0.01); ctx.lineTo(x + gw * 0.55, taban - s * 0.93); ctx.stroke();   // kalkık kol
    const mx = x + gw * 0.55, my = taban - s * 0.93;                                                                              // meşale
    ctx.fillStyle = "#c8a24a"; ctx.fillRect(mx - s * 0.02, my - s * 0.03, s * 0.04, s * 0.03);
    ctx.fillStyle = "#f2c94c"; ctx.beginPath(); ctx.moveTo(mx - s * 0.03, my - s * 0.03); ctx.quadraticCurveTo(mx - s * 0.03, my - s * 0.07, mx, my - s * 0.07 - s * 0.0); ctx.quadraticCurveTo(mx + s * 0.035, my - s * 0.06, mx + s * 0.03, my - s * 0.03); ctx.closePath(); ctx.fill();
    elips(ctx, mx, my - s * 0.04, s * 0.012, s * 0.018, "#f28c28");
    elips(ctx, x, sy - s * 0.06, s * 0.055, s * 0.065, bakir); elips(ctx, x + s * 0.018, sy - s * 0.055, s * 0.025, s * 0.05, koyuB);   // baş
    ctx.strokeStyle = acikB; ctx.lineWidth = Math.max(0.6, s * 0.012); ctx.beginPath();                                       // ışın taç
    for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.92 + (i / 6) * Math.PI * 0.84; ctx.moveTo(x + Math.cos(a) * s * 0.05, sy - s * 0.09 + Math.sin(a) * s * 0.03); ctx.lineTo(x + Math.cos(a) * s * 0.1, sy - s * 0.09 + Math.sin(a) * s * 0.07); }
    ctx.stroke();
  }
  function ozgurlukHeykeli(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#1e7fd6", null);
    kirp(ctx, B, () => dalga(ctx, w, 5, h));
    const gen = Math.min(w * 0.66, 80, (h * 0.92) / 1.6), A = enIyiYer(B, w, h, gen, gen * 1.6, 5);
    if (!A) return [];
    const ay = A.taban - A.b * 0.06;
    elips(ctx, A.x, ay, A.g * 0.48, A.b * 0.075, "#5f8a3a");                                                                      // ada
    elips(ctx, A.x - A.g * 0.12, ay - A.b * 0.015, A.g * 0.22, A.b * 0.03, "#7fa850");
    ctx.fillStyle = "#b8a888"; ctx.beginPath();                                                                                   // yıldız tabya
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, R = i % 2 ? A.g * 0.2 : A.g * 0.3; ctx.lineTo(A.x + Math.cos(a) * R, ay - A.b * 0.01 + Math.sin(a) * R * 0.28); }
    ctx.closePath(); ctx.fill();
    heykel(ctx, A.x, ay - A.b * 0.01, A.b * 0.93);
    return [];
  }

  // ---------- US: Büyük Kanyon (kaya biçimi) ----------
  // Katmanlı kızıl ön yüz; üstte tabakalı yayla, ortasından kıvrılarak geçen basamaklı duvarlı derin kanyon ve dipte
  // ırmak; yaylada basamaklı kule kayalar ve çalılar
  function kuleKaya(ctx, x, taban, s) {
    elips(ctx, x + s * 0.2, taban, s * 0.6, s * 0.12, "rgba(60, 20, 10, 0.3)");
    for (const [w0, w1, y0, y1, renk] of [[0.55, 0.42, 0, 0.35, "#a8482a"], [0.36, 0.3, 0.35, 0.7, "#c8643a"], [0.24, 0.2, 0.7, 1, "#d8885a"]]) {
      ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x - s * w0, taban - s * y0); ctx.lineTo(x - s * w1, taban - s * y1); ctx.lineTo(x + s * w1, taban - s * y1); ctx.lineTo(x + s * w0, taban - s * y0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(60, 20, 10, 0.25)"; ctx.beginPath(); ctx.moveTo(x + s * w0 * 0.3, taban - s * y0); ctx.lineTo(x + s * w1 * 0.3, taban - s * y1); ctx.lineTo(x + s * w1, taban - s * y1); ctx.lineTo(x + s * w0, taban - s * y0); ctx.closePath(); ctx.fill();
    }
    elips(ctx, x, taban - s, s * 0.2, s * 0.05, "#e8a878");
  }
  function buyukKanyon(ctx, w, h, r, p, B) {
    const d = B.derinlik || 0, kaya = "#c0643a";
    doldur(ctx, B, "rgba(0,0,0,0.38)", 2, d + 1);
    cizgi(ctx, B, koyu(kaya, 0.5), 3, 0, d);
    doldur(ctx, B, koyu(kaya, 0.3), 0, d);
    kirp(ctx, B, () => { for (let y = 0, i = 0; y < h + d; y += 3, i++) { ctx.fillStyle = [koyu(kaya, 0.22), koyu(kaya, 0.38), "#9a4a2a", koyu(kaya, 0.3)][i % 4]; ctx.fillRect(0, y, w, 3); } }, 0, d);
    cizgi(ctx, B, koyu(kaya, 0.5), 3);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#d8885a"); g.addColorStop(1, "#b8603a");
    doldur(ctx, B, g);
    kirp(ctx, B, () => {
      for (let y = 3, i = 0; y < h; y += 5, i++) { ctx.strokeStyle = ["rgba(255,220,180,0.3)", "rgba(120,40,20,0.22)", "rgba(240,180,120,0.25)"][i % 3]; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 15 + i) * 1.2); ctx.stroke(); }
      const cy = (x) => h * 0.55 + Math.sin(x / (w * 0.22) + 1) * h * 0.12, gw = Math.max(14, Math.min(34, h * 0.3));   // kanyon
      const yol = () => { ctx.beginPath(); for (let x = -10; x <= w + 10; x += 4) ctx.lineTo(x, cy(x)); };
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (const [k, renk] of [[1.1, "rgba(80, 25, 10, 0.35)"], [1, "#a8482a"], [0.8, "#8a3a22"], [0.6, "#c0603a"], [0.42, "#6a2a18"], [0.26, "#4a1e12"]]) { ctx.strokeStyle = renk; ctx.lineWidth = gw * k; ctx.save(); ctx.translate(0, (1 - k) * 2); yol(); ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle = "#1e7fd6"; ctx.lineWidth = 2; ctx.save(); ctx.translate(0, 2); yol(); ctx.stroke(); ctx.restore();   // ırmak
      for (let i = 0; i < w * h / 500; i++) { const x = r() * w, y = r() * h; if (Math.abs(y - cy(x)) > gw * 0.7) elips(ctx, x, y, 1.5, 1.1, r() < 0.5 ? "#6a7a3a" : "#8a8a4a"); }   // çalılar
    });
    const cy = (x) => h * 0.55 + Math.sin(x / (w * 0.22) + 1) * h * 0.12, gw = Math.max(14, Math.min(34, h * 0.3)) / 2;
    for (const k of icNoktalar(B, w, h, Math.max(1, Math.min(4, Math.round(w * h / 4000))), 10, 26, r)) {
      const s = 13 + r() * 8;
      if (Math.abs(k.y - cy(k.x)) > gw + 4 && Math.abs(k.y - s - cy(k.x)) > gw && yapiSigdir(B, k.x, k.y, s * 1.1, s)) kuleKaya(ctx, k.x, k.y, s);
    }
    return [];
  }

  // =================== MEKSİKA ===================
  // ---------- MX: papel picado süslü pazar ----------
  // Pişmiş toprak karolu meydan; çizgili tenteli tezgâhlar (biber, avokado, mısır, misket limonu, hasır şapka); başların
  // üstünde gerili iplerde rüzgârla sallanan oyma desenli rengârenk kâğıt bayrakçıklar (canlı)
  function tezgah(ctx, x, taban, g, b, renk, mal, r) {
    elips(ctx, x + 2, taban + 0.5, g * 0.55, 2.4, "rgba(0,0,0,0.28)");
    ctx.fillStyle = "#6b4426"; for (const sx of [-1, 1]) ctx.fillRect(x + sx * (g / 2 - 1.2) - 1.2, taban - b, 2.4, b);          // direkler
    ctx.fillStyle = "#8a5a32"; ctx.fillRect(x - g / 2, taban - b * 0.36, g, b * 0.06);                                          // tezgâh
    ctx.fillStyle = renk; ctx.fillRect(x - g / 2 + 1, taban - b * 0.3, g - 2, b * 0.3);
    ctx.fillStyle = "#f4f1ea"; for (let xx = x - g / 2 + 3; xx < x + g / 2 - 2; xx += 5) ctx.fillRect(xx, taban - b * 0.2, 2.5, 1.2);
    const my = taban - b * 0.36, ms = Math.max(2, g * 0.045);                                                                   // mallar
    for (let i = 0; i < 9; i++) {
      const mx = x - g * 0.38 + (i % 5) * g * 0.19 + (i > 4 ? g * 0.09 : 0), yy = my - ms * (i > 4 ? 1.6 : 0.7);
      if (mal === 0) { ctx.save(); ctx.translate(mx, yy); ctx.rotate(0.5); elips(ctx, 0, 0, ms * 1.1, ms * 0.45, i % 3 ? "#d6302a" : "#3a8a3a"); ctx.restore(); }
      else if (mal === 1) { elips(ctx, mx, yy, ms * 0.75, ms * 0.95, "#3f5a2a"); elips(ctx, mx - ms * 0.2, yy - ms * 0.25, ms * 0.25, ms * 0.25, "#6a8a3a"); }
      else if (mal === 2) { elips(ctx, mx, yy, ms * 0.45, ms * 1.1, "#f2c94c"); elips(ctx, mx + ms * 0.4, yy + ms * 0.3, ms * 0.2, ms * 0.8, "#8aa04a"); }
      else { elips(ctx, mx, yy, ms * 0.7, ms * 0.7, i % 2 ? "#7ab83a" : "#f2a23a"); }
    }
    const ty = taban - b, th = b * 0.2;                                                                                          // çizgili tente
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#f4f1ea" : renk; ctx.fillRect(x - g / 2 - 2 + ((g + 4) * i) / 8, ty, (g + 4) / 8 + 0.4, th); }
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#f4f1ea" : renk; ctx.beginPath(); ctx.arc(x - g / 2 - 2 + ((g + 4) * (i + 0.5)) / 8, ty + th, (g + 4) / 16, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(x - g / 2, ty + th + (g + 4) / 16, g, 2.5);
  }
  function papelPicadoPazari(ctx, w, h, r, p, B) {
    const canli = [];
    yamaZemin(ctx, B, w, h, r, "#c8784a", null);
    kirp(ctx, B, () => {
      ctx.strokeStyle = "rgba(110, 50, 20, 0.35)"; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 0; x < w; x += 12) { ctx.moveTo(x, 0); ctx.lineTo(x, h); } for (let y = 0; y < h; y += 12) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    });
    const n = w > 130 ? 2 : 1, gen = Math.min(w * 0.9, n * 66, ((h * 0.7) / 0.85) * n), sira = enIyiYer(B, w, h, gen, (gen / n) * 0.85, 5);
    if (sira) {
      const g = sira.g / n, renkler = [p.vurgu1 || "#d63a7a", p.vurgu2 || "#2fa3a0"];
      for (let i = 0; i < n; i++) tezgah(ctx, sira.x - sira.g / 2 + g * (i + 0.5), sira.taban - i * 2, g * 0.9, sira.b - i * 2, renkler[i % 2], (i * 2 + (w > 150 ? 1 : 0)) % 4, r);
    }
    const ipler = sira ? [sira.taban - sira.b - 4, sira.taban - sira.b * 0.62] : [h * 0.3, h * 0.6];
    for (const y of ipler) {                                                                                                     // bayrakçık ipleri
      if (y < 6) continue;
      const [x0, x1] = icAralik(B, w, y, w / 2, 5);
      if (x1 - x0 < 30 || uz(B, (x0 + x1) / 2, y + 14) > -2) continue;
      for (const px of [x0, x1]) elips(ctx, px, y, 1.4, 1.4, "#6b4426");
      canli.push({ tur: "papel", x: x0, y, n: r(), g: x1 - x0, s: Math.min(6, (x1 - x0) * 0.06) });
    }
    return canli;
  }

  // ---------- MX: ajolote göleti (Xochimilco) ----------
  // Kanal (her yerde aynı mavi), kıyıda ince ahuejote ağaçlı chinampa bahçeleri; rengârenk kemerli, tenteli trajinera
  // kayığı; suda pembe, tüylü solungaçlı, gülümseyen sevimli ajolotlar
  function ajolote(ctx, x, y, s, yon) {
    const pembe = "#f4a6b8", koyuP = "#e07890";
    ctx.save(); ctx.translate(x, y); ctx.scale(yon, 1);
    elips(ctx, 0, s * 0.08, s * 0.55, s * 0.08, "rgba(0, 30, 80, 0.25)");
    ctx.fillStyle = acik(pembe, 0.2); ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.24); ctx.quadraticCurveTo(-s * 0.6, -s * 0.3, -s * 0.85, -s * 0.12); ctx.quadraticCurveTo(-s * 0.6, -s * 0.02, -s * 0.1, -s * 0.06); ctx.closePath(); ctx.fill();   // kuyruk yüzgeci
    for (const lx of [-s * 0.22, s * 0.16]) { ctx.strokeStyle = pembe; ctx.lineWidth = s * 0.06; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(lx, -s * 0.06); ctx.lineTo(lx - s * 0.05, s * 0.04); ctx.stroke(); }
    elips(ctx, -s * 0.05, -s * 0.15, s * 0.36, s * 0.12, pembe);                                                                // gövde
    for (const [a, renk] of [[-2.3, koyuP], [-1.85, "#ea8aa0"], [-1.4, koyuP]]) {                                                // solungaçlar
      const ux = Math.cos(a), uy = Math.sin(a), bx = s * 0.3, byy = -s * 0.28, L = s * 0.22;
      ctx.strokeStyle = renk; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.moveTo(bx, byy); ctx.lineTo(bx + ux * L, byy + uy * L); ctx.stroke();
      ctx.lineWidth = s * 0.02; ctx.beginPath(); for (let t = 0.3; t <= 1; t += 0.25) { const px = bx + ux * L * t, py = byy + uy * L * t; ctx.moveTo(px, py); ctx.lineTo(px - uy * s * 0.05, py + ux * s * 0.05); ctx.moveTo(px, py); ctx.lineTo(px + uy * s * 0.05, py - ux * s * 0.05); } ctx.stroke();
    }
    elips(ctx, s * 0.36, -s * 0.18, s * 0.18, s * 0.15, pembe);                                                                 // baş
    elips(ctx, s * 0.43, -s * 0.21, s * 0.035, s * 0.035, "#2a1a20"); elips(ctx, s * 0.435, -s * 0.22, s * 0.012, s * 0.012, "#ffffff");
    ctx.strokeStyle = "#a84a60"; ctx.lineWidth = Math.max(0.5, s * 0.025); ctx.beginPath(); ctx.arc(s * 0.43, -s * 0.15, s * 0.08, 0.15 * Math.PI, 0.75 * Math.PI); ctx.stroke();   // gülümseme
    elips(ctx, s * 0.36, -s * 0.13, s * 0.03, s * 0.02, "rgba(220, 90, 120, 0.5)");
    ctx.restore();
  }
  function trajinera(ctx, x, taban, g, b) {
    const renkler = ["#e8402a", "#f2c94c", "#2fa3a0", "#d63a7a", "#3aa05a"];
    elips(ctx, x, taban + 1, g * 0.52, 2.2, "rgba(255,255,255,0.22)");
    ctx.fillStyle = "#2f6a4a"; ctx.beginPath(); ctx.moveTo(x - g / 2, taban - b * 0.24); ctx.lineTo(x + g / 2, taban - b * 0.24); ctx.lineTo(x + g * 0.46, taban); ctx.lineTo(x - g * 0.46, taban); ctx.closePath(); ctx.fill();   // tekne
    ctx.fillStyle = "#f2c94c"; ctx.fillRect(x - g / 2, taban - b * 0.24, g, b * 0.05);
    for (let i = 0; i < 7; i++) elips(ctx, x - g * 0.4 + i * g * 0.133, taban - b * 0.12, b * 0.04, b * 0.04, renkler[i % 5]);
    ctx.fillStyle = "#8a5a32"; ctx.fillRect(x - g * 0.3, taban - b * 0.34, g * 0.6, b * 0.08);                                  // masa
    ctx.fillStyle = "#c8c0b0"; for (const f of [-0.44, -0.15, 0.15, 0.44]) ctx.fillRect(x + f * g - 0.8, taban - b * 0.8, 1.6, b * 0.56);   // direkler
    ctx.fillStyle = "#e8402a"; ctx.fillRect(x - g * 0.48, taban - b * 0.84, g * 0.96, b * 0.06);                                // çatı
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? "#f4f1ea" : "#e8402a"; ctx.beginPath(); ctx.arc(x - g * 0.48 + (g * 0.96 * (i + 0.5)) / 12, taban - b * 0.78, (g * 0.96) / 24, 0, Math.PI); ctx.fill(); }
    const ax = x - g * 0.2, ag = g * 0.4;                                                                                       // boyalı kemer (yazısız)
    ctx.fillStyle = "#f2c94c"; ctx.beginPath(); ctx.ellipse(ax + ag / 2, taban - b * 0.84, ag / 2, b * 0.16, 0, Math.PI, 0); ctx.fill();
    for (let i = 0; i < 5; i++) { const a = Math.PI + ((i + 0.5) * Math.PI) / 5; elips(ctx, ax + ag / 2 + Math.cos(a) * ag * 0.36, taban - b * 0.84 + Math.sin(a) * b * 0.1, b * 0.035, b * 0.035, renkler[i]); }
  }
  function ajoloteGoleti(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#1e7fd6", null);
    const kiyi = h * 0.2;
    kirp(ctx, B, () => {
      ctx.fillStyle = "#4f7a3a"; ctx.fillRect(0, 0, w, kiyi);                                                                   // chinampa
      for (let x = 6; x < w; x += 14) { ctx.fillStyle = ["#d63a7a", "#f2c94c", "#f28c28"][(x / 14) % 3 | 0]; for (let k = 0; k < 4; k++) elips(ctx, x + k * 2.5, kiyi * 0.7 + (k % 2), 1.2, 1.2, ctx.fillStyle); }
      ctx.fillStyle = "#3f5a2a"; ctx.fillRect(0, kiyi - 2, w, 3);
      dalga(ctx, w, kiyi + 5, h);
    });
    for (let x = 10 + r() * 6; x < w - 6; x += 20 + r() * 10) {                                                                // ahuejote ağaçları
      const taban = kiyi - 2, boy = Math.min(46, ustBosluk(B, x, taban) - 2);
      if (boy < 14 || uz(B, x, taban) > -3) continue;
      ctx.fillStyle = "#6b5a44"; ctx.fillRect(x - 0.8, taban - boy * 0.3, 1.6, boy * 0.3);
      elips(ctx, x + 0.5, taban - boy * 0.6, Math.max(2.5, boy * 0.1), boy * 0.4, "#3f6a30"); elips(ctx, x - 0.4, taban - boy * 0.62, Math.max(1.6, boy * 0.06), boy * 0.34, "#5a8a3a");
    }
    const gen = Math.min(w * 0.75, 110, ((h - kiyi) * 0.55) / 0.5), T = ustteYer(B, w, h, gen, gen * 0.5, kiyi + (h - kiyi) * 0.6, 5, [0.5, 0.42, 0.58]);
    if (T) trajinera(ctx, T.x, T.taban, T.g, T.b);
    const s = Math.max(14, Math.min(32, w * 0.2)), konan = [];
    for (let y = kiyi + s * 0.5; y < h - 4; y += s * 0.45) for (let x = s * 0.9 + (Math.round(y) % 3) * 4; x < w - s * 0.6; x += s * 0.5) {
      if (konan.length >= 3) break;
      if (T && x > T.x - T.g / 2 - s * 0.9 && x < T.x + T.g / 2 + s * 0.9 && y > T.taban - T.b - 2 && y < T.taban + s * 0.45) continue;
      if (konan.some((k) => Math.abs(k.x - x) < s * 1.6 && Math.abs(k.y - y) < s * 0.6)) continue;
      if (yapiSigdir(B, x, y + s * 0.1, s * 1.55, s * 0.62)) konan.push({ x, y });
    }
    konan.forEach((k, i) => ajolote(ctx, k.x, k.y, s * (i ? 0.85 : 1), i % 2 ? -1 : 1));
    return [];
  }

  // =================== KOLOMBİYA ===================
  // ---------- CO: Kokora mum palmiyeleri ----------
  // Sisli, yeşil yuvarlak tepeler; tepelerde çok uzun, ince, halkalı gövdeli ve küçük tepe taçlı mum palmiyeleri
  function mumPalmiyesi(ctx, x, taban, boy) {
    elips(ctx, x + 2, taban, 4, 1.4, "rgba(0,0,0,0.25)");
    ctx.strokeStyle = "#c8c4b8"; ctx.lineWidth = Math.max(1.4, boy * 0.028); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, taban); ctx.quadraticCurveTo(x + boy * 0.03, taban - boy * 0.5, x + boy * 0.01, taban - boy * 0.86); ctx.stroke();
    ctx.strokeStyle = "rgba(90, 85, 75, 0.5)"; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let t = 0.08; t < 0.84; t += 0.05) { const yy = taban - boy * t, xx = x + boy * 0.03 * Math.sin(t * Math.PI) * 0.9; ctx.moveTo(xx - 1, yy); ctx.lineTo(xx + 1, yy); }
    ctx.stroke();
    const tx = x + boy * 0.01, ty = taban - boy * 0.87, L = Math.max(7, boy * 0.13);
    elips(ctx, tx, ty + 2, 1.6, 3, "#6a8a3a");
    for (const a of [-2.8, -2.3, -1.9, -1.57, -1.2, -0.8, -0.35]) {                                                              // yapraklar
      const ux = Math.cos(a), uy = Math.sin(a);
      ctx.strokeStyle = a > -1.57 ? "#3f7a3a" : "#4f8a3f"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + ux * L * 0.7, ty + uy * L * 0.7, tx + ux * L + (ux > 0 ? 1 : -1) * 2, ty + uy * L * 0.6 + L * 0.35); ctx.stroke();
    }
  }
  function mumPalmiyeleri(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#5f9a44", null);
    kirp(ctx, B, () => {
      for (const [y0, renk, A] of [[0.22, "#8ab07a", 0.08], [0.42, "#6fa058", 0.1], [0.66, "#5a8a44", 0.08]]) {                // yuvarlak tepeler
        ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(-2, h + 2);
        for (let x = -2; x <= w + 2; x += 6) ctx.lineTo(x, h * y0 - Math.sin(x / (w * 0.3) + y0 * 9) * h * A);
        ctx.lineTo(w + 2, h + 2); ctx.closePath(); ctx.fill();
        for (let i = 0; i < 3; i++) elips(ctx, r() * w, h * y0 + 6 + r() * 4, 14 + r() * 12, 2.4, "rgba(240, 245, 250, 0.35)");   // sis
      }
      for (let i = 0; i < w * h / 500; i++) cimTutami(ctx, r() * w, h * 0.3 + r() * h * 0.7, 2.2, "#4f8a3a");
    });
    const yerler = [];
    for (let x = 8 + r() * 8; x < w - 6; x += 16 + r() * 12) yerler.push({ x, taban: h * (0.4 + r() * 0.5) });
    yerler.sort((a, b) => a.taban - b.taban);
    for (const k of yerler) {
      const boy = Math.min(120, ustBosluk(B, k.x, k.taban) - 2);
      if (boy > 30 && uz(B, k.x, k.taban) < -4 && uz(B, k.x - boy * 0.14, k.taban - boy * 0.82) < -2 && uz(B, k.x + boy * 0.14, k.taban - boy * 0.82) < -2) mumPalmiyesi(ctx, k.x, k.taban, boy);
    }
    return [];
  }

  // ---------- CO: Cartagena'nın balkonlu renkli evleri ----------
  // Arnavut kaldırımlı sokak; sarı, mavi, turuncu iki katlı sömürge evleri: kiremit saçak, kemerli ahşap kapı, parmaklıklı
  // pencere, üst katta korkuluklu ahşap balkon ve balkondan sarkan begonviller
  function cartagenaEvi(ctx, x, taban, g, b, renk, r) {
    const beyaz = "#f6efe0", ahsap = "#5a3418", ust = taban - b;
    elips(ctx, x + 2, taban + 0.5, g * 0.55, 2.4, "rgba(0,0,0,0.28)");
    ctx.fillStyle = renk; ctx.fillRect(x - g / 2, ust + b * 0.1, g, b * 0.9);
    ctx.fillStyle = koyu(renk, 0.12); ctx.fillRect(x + g * 0.32, ust + b * 0.1, g * 0.18, b * 0.9);
    ctx.fillStyle = beyaz; ctx.fillRect(x - g / 2, taban - b * 0.08, g, b * 0.08); ctx.fillRect(x - g / 2, ust + b * 0.52, g, 1.4);
    ctx.save(); ctx.beginPath(); ctx.rect(x - g / 2 - 2, ust, g + 4, b * 0.14); ctx.clip(); kiremitler(ctx, x - g / 2 - 2, ust, x + g / 2 + 2, ust + b * 0.12, "#a8482a", 3); ctx.restore();   // saçak
    ctx.fillStyle = ahsap; ctx.beginPath(); const kx = x - g * 0.22, kw = g * 0.24, kt = taban - b * 0.08;                     // kemerli kapı
    ctx.moveTo(kx - kw / 2, kt); ctx.lineTo(kx - kw / 2, kt - b * 0.24); ctx.arc(kx, kt - b * 0.24, kw / 2, Math.PI, 0); ctx.lineTo(kx + kw / 2, kt); ctx.fill();
    ctx.strokeStyle = acik(ahsap, 0.25); ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(kx, kt); ctx.lineTo(kx, kt - b * 0.3); ctx.stroke();
    ctx.fillStyle = "#2a2a30"; ctx.fillRect(x + g * 0.1, taban - b * 0.38, g * 0.24, b * 0.2);                                 // parmaklıklı pencere
    ctx.strokeStyle = "#1a1a1e"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let xx = x + g * 0.12; xx < x + g * 0.34; xx += 2) { ctx.moveTo(xx, taban - b * 0.38); ctx.lineTo(xx, taban - b * 0.18); } ctx.stroke();
    for (const f of [-0.2, 0.2]) { ctx.fillStyle = ahsap; ctx.fillRect(x + f * g - g * 0.09, ust + b * 0.18, g * 0.18, b * 0.26); ctx.fillStyle = acik(ahsap, 0.2); ctx.fillRect(x + f * g - 0.4, ust + b * 0.18, 0.8, b * 0.26); }   // üst kapılar
    const by = ust + b * 0.48;                                                                                                   // balkon
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(x - g * 0.46, by + 2.5, g * 0.92, 2.5);
    ctx.fillStyle = ahsap; ctx.fillRect(x - g * 0.47, by - b * 0.14, g * 0.94, 1.6); ctx.fillRect(x - g * 0.47, by, g * 0.94, 2.4);
    ctx.fillRect(x - g * 0.47, by - b * 0.14, 1.4, b * 0.14); ctx.fillRect(x + g * 0.47 - 1.4, by - b * 0.14, 1.4, b * 0.14);
    for (let xx = x - g * 0.44; xx < x + g * 0.45; xx += 2.4) ctx.fillRect(xx, by - b * 0.13, 0.9, b * 0.13);
    for (const f of [-0.38, 0, 0.38]) { ctx.beginPath(); ctx.moveTo(x + f * g - 1.5, by + 2.4); ctx.lineTo(x + f * g + 1.5, by + 2.4); ctx.lineTo(x + f * g, by + 6); ctx.fill(); }
    for (let i = 0; i < 16; i++) { const bx = x - g * 0.45 + r() * g * 0.9, byy = by - b * 0.1 + r() * b * 0.14; elips(ctx, bx, byy, 1.6, 1.3, ["#d63a8a", "#e8509a", "#b82a6a"][i % 3]); }   // begonviller
    for (let i = 0; i < 5; i++) elips(ctx, x - g * 0.4 + r() * g * 0.8, by + 3 + r() * b * 0.08, 1.3, 1.1, "#e8509a");
  }
  function cartagenaEvleri(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#b8a890", null);
    kirp(ctx, B, () => { ctx.strokeStyle = "rgba(90, 80, 60, 0.3)"; ctx.lineWidth = 0.8; for (let y = 4, j = 0; y < h; y += 6, j++) for (let x = (j % 2) * 4; x < w; x += 8) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + 0.5, y + 0.5, 7, 5, 2.4); ctx.stroke(); } });
    const n = Math.max(1, Math.min(3, Math.round(w / (h * 0.75)))), gen = Math.min(w * 0.94, n * 92, ((h * 0.88) / 1.15) * n), sira = enIyiYer(B, w, h, gen, (gen / n) * 1.15, 5);
    if (!sira) return [];
    const g = sira.g / n, renkler = ["#f2c94c", "#2f8fd0", "#e8703a"];
    for (let i = 0; i < n; i++) cartagenaEvi(ctx, sira.x - sira.g / 2 + g * (i + 0.5), sira.taban - (i % 2) * 2, g * 0.98, sira.b - (i % 2) * 3, renkler[i % 3], r);
    return [];
  }

  // =================== PERU ===================
  // ---------- PE: Machu Picchu terasları ----------
  // Arkada sisli, sarp, yeşil Huayna Picchu doruğu; yamaçta taş duvarlı yeşil teraslar ve teraslarda çatısız ya da saman
  // çatılı taş evler (tapınak yok)
  function tasEv(ctx, x, taban, g, b, catili) {
    const tas = "#9a958a";
    elips(ctx, x + 1.5, taban + 0.5, g * 0.55, 1.8, "rgba(0,0,0,0.28)");
    ctx.fillStyle = tas; ctx.beginPath(); ctx.moveTo(x - g / 2, taban); ctx.lineTo(x - g / 2, taban - b * 0.55); ctx.lineTo(x, taban - b * (catili ? 0.62 : 0.95)); ctx.lineTo(x + g / 2, taban - b * 0.55); ctx.lineTo(x + g / 2, taban); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = koyu(tas, 0.3); ctx.lineWidth = 0.5; ctx.beginPath();
    for (let y = taban - 3; y > taban - b * 0.55; y -= 3) { ctx.moveTo(x - g / 2, y); ctx.lineTo(x + g / 2, y); }
    ctx.stroke();
    ctx.fillStyle = "#3a3630"; ctx.beginPath(); ctx.moveTo(x - g * 0.12, taban); ctx.lineTo(x - g * 0.08, taban - b * 0.38); ctx.lineTo(x + g * 0.08, taban - b * 0.38); ctx.lineTo(x + g * 0.12, taban); ctx.closePath(); ctx.fill();   // yamuk kapı
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * g * 0.32 - g * 0.06, taban - b * 0.22); ctx.lineTo(x + sx * g * 0.32 - g * 0.045, taban - b * 0.4); ctx.lineTo(x + sx * g * 0.32 + g * 0.045, taban - b * 0.4); ctx.lineTo(x + sx * g * 0.32 + g * 0.06, taban - b * 0.22); ctx.closePath(); ctx.fill(); }
    if (catili) {
      ctx.fillStyle = "#c9a85a"; ctx.beginPath(); ctx.moveTo(x - g * 0.58, taban - b * 0.5); ctx.lineTo(x, taban - b); ctx.lineTo(x + g * 0.58, taban - b * 0.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#a8884a"; ctx.lineWidth = 0.5; ctx.beginPath(); for (let t = 0.1; t < 1; t += 0.12) { ctx.moveTo(x, taban - b); ctx.lineTo(x - g * 0.58 + t * g * 1.16, taban - b * 0.5); } ctx.stroke();
    }
  }
  function machuPicchu(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#5f8a3a", null);
    const tUst = h * 0.42;
    kirp(ctx, B, () => {
      ctx.fillStyle = "#8aa8a0"; ctx.beginPath(); ctx.moveTo(-2, tUst); ctx.quadraticCurveTo(w * 0.15, h * 0.12, w * 0.3, tUst); ctx.closePath(); ctx.fill();   // uzak dağ
      ctx.fillStyle = "#3f6a34"; ctx.beginPath(); ctx.moveTo(w * 0.32, tUst + 2); ctx.bezierCurveTo(w * 0.48, h * 0.2, w * 0.52, h * 0.02, w * 0.62, h * 0.01);   // Huayna Picchu
      ctx.bezierCurveTo(w * 0.72, h * 0.02, w * 0.78, h * 0.25, w + 2, tUst - 2); ctx.lineTo(w + 2, tUst + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#5a8a44"; ctx.beginPath(); ctx.moveTo(w * 0.36, tUst + 2); ctx.bezierCurveTo(w * 0.5, h * 0.22, w * 0.54, h * 0.05, w * 0.62, h * 0.01); ctx.bezierCurveTo(w * 0.58, h * 0.12, w * 0.56, h * 0.3, w * 0.5, tUst); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(60, 60, 50, 0.4)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (const f of [0.55, 0.62, 0.7]) { ctx.moveTo(w * f, h * 0.06); ctx.lineTo(w * (f - 0.04), tUst - 4); } ctx.stroke();
      for (let i = 0; i < 3; i++) elips(ctx, w * (0.2 + i * 0.3), tUst - h * 0.05, w * 0.16, 2.6, "rgba(240, 245, 250, 0.45)");   // sis
      for (let y = tUst, i = 0; y < h; y += 9, i++) {                                                                               // teraslar
        ctx.fillStyle = ["#7aa84a", "#86b454", "#6f9e42"][i % 3]; ctx.fillRect(0, y, w, 6);
        ctx.fillStyle = "#9a958a"; ctx.fillRect(0, y + 6, w, 3);
        ctx.strokeStyle = "#7a756a"; ctx.lineWidth = 0.5; ctx.beginPath(); for (let x = (i % 2) * 3; x < w; x += 6) { ctx.moveTo(x, y + 6); ctx.lineTo(x, y + 9); } ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(0, y, w, 1);
      }
    });
    const evler = icNoktalar(B, w, h, Math.max(3, Math.min(7, Math.round(w * h / 2000))), 8, 20, r).filter((k) => k.y > tUst + 16).sort((a, b) => a.y - b.y);
    const konan = [];
    evler.forEach((k, i) => {
      const taban = tUst + Math.ceil((k.y - tUst) / 9) * 9 - 3, yer = yapiSigdir(B, k.x, taban, 26, 24);
      if (!yer || konan.some((e) => Math.abs(e.x - k.x) < (e.g + yer.g) * 0.55 && Math.abs(e.taban - taban) < 20)) return;
      konan.push({ x: k.x, taban, g: yer.g }); tasEv(ctx, k.x, taban, yer.g, yer.b, i % 2 === 0);
    });
    return [];
  }

  // ---------- PE: lamalar ----------
  // Arkada karlı And dağları, önde puna otlağı; kulaklarında renkli püsküller, sırtında çizgili dokuma örtü olan yünlü,
  // sevimli lamalar
  function lama(ctx, x, taban, s, yon, renk, puskul) {
    const koyuR = koyu(renk, 0.25);
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, 0, 0.5, s * 0.45, s * 0.07, "rgba(0,0,0,0.25)");
    ctx.strokeStyle = koyuR; ctx.lineWidth = s * 0.07; ctx.lineCap = "round"; ctx.beginPath();
    for (const bx of [-0.3, -0.18, 0.12, 0.24]) { ctx.moveTo(bx * s, -s * 0.38); ctx.lineTo(bx * s + s * 0.01, -s * 0.01); }
    ctx.stroke();
    elips(ctx, -s * 0.05, -s * 0.48, s * 0.36, s * 0.2, renk);                                                                   // gövde
    for (let i = 0; i < 6; i++) elips(ctx, -s * 0.32 + i * s * 0.11, -s * 0.64 + (i % 2) * s * 0.02, s * 0.08, s * 0.07, acik(renk, 0.1));   // yün kabarıkları
    elips(ctx, -s * 0.42, -s * 0.56, s * 0.07, s * 0.08, acik(renk, 0.1));                                                       // kuyruk
    ctx.fillStyle = puskul[0]; ctx.fillRect(-s * 0.18, -s * 0.66, s * 0.28, s * 0.2);                                          // dokuma örtü
    for (let i = 0; i < 4; i++) { ctx.fillStyle = puskul[(i + 1) % puskul.length]; ctx.fillRect(-s * 0.18, -s * 0.66 + i * s * 0.05, s * 0.28, s * 0.022); }
    ctx.strokeStyle = renk; ctx.lineWidth = s * 0.15; ctx.beginPath(); ctx.moveTo(s * 0.22, -s * 0.55); ctx.lineTo(s * 0.3, -s * 1.0); ctx.stroke();   // boyun
    const hx = s * 0.34, hy = -s * 1.04;
    for (const [ex, a] of [[-0.04, -0.25], [0.04, 0.15]]) { ctx.save(); ctx.translate(hx + ex * s, hy - s * 0.08); ctx.rotate(a); elips(ctx, 0, -s * 0.07, s * 0.03, s * 0.08, renk); ctx.restore(); elips(ctx, hx + ex * s, hy - s * 0.06, s * 0.035, s * 0.03, puskul[ex < 0 ? 1 : 2]); }   // kulak ve püskül
    elips(ctx, hx, hy, s * 0.12, s * 0.1, renk); elips(ctx, hx + s * 0.09, hy + s * 0.03, s * 0.07, s * 0.055, acik(renk, 0.25));
    elips(ctx, hx + s * 0.02, hy - s * 0.02, s * 0.025, s * 0.03, "#1f1a14"); elips(ctx, hx + s * 0.028, hy - s * 0.03, s * 0.009, s * 0.009, "#ffffff");
    ctx.strokeStyle = "#5a3a2a"; ctx.lineWidth = Math.max(0.5, s * 0.015); ctx.beginPath(); ctx.arc(hx + s * 0.1, hy + s * 0.04, s * 0.03, 0.1 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    elips(ctx, hx + s * 0.03, hy + s * 0.04, s * 0.025, s * 0.015, "rgba(240, 130, 150, 0.5)");
    ctx.restore();
  }
  function lamalar(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#8aa05a", "#a8b870", 600);
    const dag = h * 0.3;
    kirp(ctx, B, () => {
      const tepeler = []; for (let x = -6; x < w + 16; x += 16 + r() * 14) tepeler.push([x, dag * (0.1 + r() * 0.45)]);
      const sira = () => { ctx.beginPath(); ctx.moveTo(-6, dag + 4); tepeler.forEach(([x, y], i) => { ctx.lineTo(x, y); if (tepeler[i + 1]) ctx.lineTo((x + tepeler[i + 1][0]) / 2, dag * 0.7); }); ctx.lineTo(w + 16, dag + 4); ctx.closePath(); };
      sira(); ctx.fillStyle = "#7a8aa0"; ctx.fill();
      ctx.save(); sira(); ctx.clip(); ctx.fillStyle = "#f4f7fb";
      for (const [x, y] of tepeler) { ctx.beginPath(); ctx.moveTo(x - 14, y - 2); ctx.lineTo(x + 14, y - 2); ctx.lineTo(x + 14, y + 6); ctx.lineTo(x + 5, y + 9); ctx.lineTo(x, y + 6); ctx.lineTo(x - 5, y + 9); ctx.lineTo(x - 14, y + 6); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = "#9ab06a"; ctx.fillRect(0, dag, w, 3);
    });
    const renkler = [["#f4efe4", ["#c8302a", "#f2c94c", "#2a6a8a", "#d63a7a"]], ["#8a5a32", ["#2a6a8a", "#c8302a", "#f2c94c", "#3aa05a"]], ["#e8d8b8", ["#7a3fa0", "#f2a23a", "#c8302a", "#2fa3a0"]]];
    const gen = Math.min(w * 0.5, 64, (h * 0.66) / 1.25), A = enIyiYer(B, w, h, gen, gen * 1.25, 5);
    if (!A) return [];
    const s = A.b / 1.22, digerleri = [];
    for (const [dx, dy, k] of [[-0.9, -0.22, 0.75], [0.95, -0.12, 0.85]]) { const x = A.x + dx * A.g, t = A.taban + dy * A.b, yer = yapiSigdir(B, x, t, s * k * 0.95, s * k * 1.22); if (yer && t > dag + 4) digerleri.push({ x, t, s: yer.b / 1.22 }); }
    digerleri.sort((a, b) => a.t - b.t).forEach((l, i) => lama(ctx, l.x, l.t, l.s, i ? -1 : 1, renkler[i + 1][0], renkler[i + 1][1]));
    lama(ctx, A.x - A.g * 0.05, A.taban, s, 1, renkler[0][0], renkler[0][1]);
    return [];
  }

  // =================== BREZİLYA ===================
  // ---------- BR: Amazon tukanları ve araları ----------
  // Sık yağmur ormanı yaprakları, sarmaşıklar ve heliconia çiçekleri; kalın dallarda iri turuncu gagalı tukanlar ve
  // kırmızı-sarı-mavi kanatlı ara papağanları
  function tukan(ctx, x, y, s, yon) {
    ctx.save(); ctx.translate(x, y); ctx.scale(yon, 1);
    ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.2); ctx.lineTo(-s * 0.16, s * 0.25); ctx.lineTo(s * 0.02, s * 0.25); ctx.closePath(); ctx.fill();   // kuyruk
    ctx.save(); ctx.translate(0, -s * 0.4); ctx.rotate(0.15); elips(ctx, 0, 0, s * 0.18, s * 0.3, "#1a1a1a"); ctx.restore();       // gövde
    elips(ctx, s * 0.08, -s * 0.56, s * 0.1, s * 0.11, "#f8e08a");                                                              // gerdan
    elips(ctx, s * 0.02, -s * 0.36, s * 0.05, s * 0.03, "#d6302a");
    elips(ctx, s * 0.05, -s * 0.72, s * 0.13, s * 0.12, "#1a1a1a");                                                              // baş
    elips(ctx, s * 0.08, -s * 0.74, s * 0.045, s * 0.045, "#4ab0e0"); elips(ctx, s * 0.085, -s * 0.74, s * 0.02, s * 0.02, "#0a0a0a");
    const gr = ctx.createLinearGradient(s * 0.14, 0, s * 0.62, 0); gr.addColorStop(0, "#7ab83a"); gr.addColorStop(0.3, "#f2a23a"); gr.addColorStop(0.85, "#e8602a"); gr.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(s * 0.14, -s * 0.82); ctx.quadraticCurveTo(s * 0.45, -s * 0.84, s * 0.62, -s * 0.66); ctx.quadraticCurveTo(s * 0.4, -s * 0.66, s * 0.15, -s * 0.66); ctx.closePath(); ctx.fill();   // gaga
    ctx.strokeStyle = "#c8402a"; ctx.lineWidth = Math.max(0.5, s * 0.015); ctx.beginPath(); ctx.moveTo(s * 0.16, -s * 0.81); ctx.quadraticCurveTo(s * 0.45, -s * 0.83, s * 0.6, -s * 0.67); ctx.stroke();
    ctx.strokeStyle = "#5a5a5a"; ctx.lineWidth = s * 0.03; ctx.beginPath(); for (const fx of [-0.02, 0.06]) { ctx.moveTo(fx * s, -s * 0.12); ctx.lineTo(fx * s, 0); } ctx.stroke();
    ctx.restore();
  }
  function ara(ctx, x, y, s, yon, renkler) {
    const [govde, kanat1, kanat2] = renkler;
    ctx.save(); ctx.translate(x, y); ctx.scale(yon, 1);
    ctx.fillStyle = kanat2; ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.15); ctx.lineTo(-s * 0.2, s * 0.6); ctx.lineTo(-s * 0.08, s * 0.62); ctx.lineTo(s * 0.06, -s * 0.12); ctx.closePath(); ctx.fill();   // uzun kuyruk
    ctx.fillStyle = govde; ctx.beginPath(); ctx.moveTo(-s * 0.02, -s * 0.15); ctx.lineTo(-s * 0.12, s * 0.5); ctx.lineTo(-s * 0.04, s * 0.5); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(0, -s * 0.38); ctx.rotate(0.12); elips(ctx, 0, 0, s * 0.16, s * 0.27, govde); ctx.restore();
    ctx.save(); ctx.translate(-s * 0.06, -s * 0.34); ctx.rotate(0.3);                                                          // kanat bantları
    elips(ctx, 0, 0, s * 0.12, s * 0.24, kanat1); elips(ctx, 0, s * 0.08, s * 0.1, s * 0.16, kanat2); ctx.restore();
    elips(ctx, s * 0.04, -s * 0.68, s * 0.12, s * 0.12, govde);                                                                 // baş
    elips(ctx, s * 0.09, -s * 0.7, s * 0.07, s * 0.06, "#f6f2ea"); elips(ctx, s * 0.1, -s * 0.71, s * 0.025, s * 0.025, "#1a1a1a");
    ctx.fillStyle = "#e8e2d4"; ctx.beginPath(); ctx.moveTo(s * 0.13, -s * 0.74); ctx.quadraticCurveTo(s * 0.26, -s * 0.74, s * 0.24, -s * 0.6); ctx.quadraticCurveTo(s * 0.18, -s * 0.64, s * 0.13, -s * 0.62); ctx.closePath(); ctx.fill();   // gaga
    elips(ctx, s * 0.15, -s * 0.61, s * 0.04, s * 0.025, "#2a2a2a");
    ctx.strokeStyle = "#5a5a5a"; ctx.lineWidth = s * 0.03; ctx.beginPath(); for (const fx of [-0.02, 0.06]) { ctx.moveTo(fx * s, -s * 0.12); ctx.lineTo(fx * s, 0); } ctx.stroke();
    ctx.restore();
  }
  function amazonKuslari(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#2a5a26", null);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 60; i++) {                                                                                     // yapraklar
        const x = r() * w, y = r() * h, a = r() * Math.PI * 2, L = 5 + r() * 7;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); elips(ctx, 0, 0, L, L * 0.38, ["#2f6a2a", "#3f8034", "#1f4a20", "#4a8f3a", "#357a30"][i % 5]);
        ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L, 0); ctx.stroke(); ctx.restore();
      }
      ctx.strokeStyle = "#5a7a2a"; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 10; x < w; x += 26) { ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 6, h * 0.5, x - 3, h); } ctx.stroke();   // sarmaşıklar
      for (let i = 0; i < w * h / 1800; i++) { const x = r() * w, y = r() * h; for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? "#f2c94c" : "#e8402a"; ctx.beginPath(); ctx.moveTo(x, y + k * 3); ctx.lineTo(x + 4, y + k * 3 - 1.5); ctx.lineTo(x + 1, y + k * 3 + 1.5); ctx.fill(); } }   // heliconia
    });
    const kuslar = [];
    for (let j = 0, y = h * 0.42; y < h - 8; y += Math.max(36, h * 0.42), j++) {                                                 // dallar
      const [x0, x1] = icAralik(B, w, y, w / 2, 6);
      if (x1 - x0 < 30) continue;
      ctx.strokeStyle = "#5a3a22"; ctx.lineWidth = 4.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x0, y + 3); ctx.quadraticCurveTo((x0 + x1) / 2, y - 3, x1, y + 2); ctx.stroke();
      ctx.strokeStyle = "#7a5a3a"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, y + 1.5); ctx.quadraticCurveTo((x0 + x1) / 2, y - 4.5, x1, y + 0.5); ctx.stroke();
      const s = Math.min(34, Math.max(16, (x1 - x0) * 0.28)), adet = Math.max(1, Math.min(3, Math.floor((x1 - x0) / (s * 0.9))));
      for (let i = 0; i < adet; i++) { const bx = x0 + (x1 - x0) * (i + 0.5) / adet, t = (bx - x0) / (x1 - x0), by = y + 3 * (1 - t) + 2 * t - 6 * 4 * t * (1 - t) * 0.5 - 1.5; kuslar.push({ x: bx, y: by, s, tur: (i + j) % 3 }); }
    }
    for (const k of kuslar) {
      const yer = yapiSigdir(B, k.x + k.s * 0.15, k.y, k.s * 0.8, k.s * 0.9);
      if (!yer) continue;
      const s = yer.b / 0.9;
      if (k.tur === 0) tukan(ctx, k.x, k.y, s, 1); else ara(ctx, k.x, k.y, s, k.tur === 1 ? -1 : 1, k.tur === 1 ? ["#d6302a", "#f2c94c", "#2f5fd0"] : ["#2f7fd0", "#2f6fb0", "#f2c94c"]);
    }
    return [];
  }

  // ---------- BR: Şeker Somunu Dağı ve teleferik ----------
  // Guanabara körfezi (her yerde aynı mavi) ve kumsal; sağda dik, yuvarlak granit Şeker Somunu, solda ormanlı küçük
  // tepe, aralarında kablo ve gidip gelen cam kabinli teleferik (canlı); körfezde yelkenliler
  function sekerSomunu(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#1e7fd6", null);
    kirp(ctx, B, () => { dalga(ctx, w, 5, h); ctx.fillStyle = "#e8d8a8"; ctx.beginPath(); ctx.moveTo(-2, h); ctx.quadraticCurveTo(w * 0.4, h - 12, w + 2, h - 4); ctx.lineTo(w + 2, h + 2); ctx.closePath(); ctx.fill(); });
    const gen = Math.min(w * 0.92, 150, (h * 0.82) / 0.62), A = enIyiYer(B, w, h, gen, gen * 0.62, 5);
    if (!A) return [];
    const { g, b, x, taban } = A, canli = [];
    const sx = x + g * 0.2, sg = g * 0.44;                                                                                     // Şeker Somunu
    const tepe = () => { ctx.beginPath(); ctx.moveTo(sx - sg / 2, taban); ctx.bezierCurveTo(sx - sg * 0.5, taban - b * 0.55, sx - sg * 0.38, taban - b, sx - sg * 0.02, taban - b); ctx.bezierCurveTo(sx + sg * 0.34, taban - b, sx + sg * 0.5, taban - b * 0.45, sx + sg / 2, taban); ctx.closePath(); };
    const gr = ctx.createLinearGradient(sx - sg / 2, 0, sx + sg / 2, 0); gr.addColorStop(0, "#a8a89a"); gr.addColorStop(0.55, "#8a8a7e"); gr.addColorStop(1, "#5e5e56");
    tepe(); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); tepe(); ctx.clip();
    ctx.strokeStyle = "rgba(40, 40, 36, 0.25)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (const f of [-0.2, 0.05, 0.28]) { ctx.moveTo(sx + f * sg, taban - b * 0.95); ctx.quadraticCurveTo(sx + f * sg * 1.3, taban - b * 0.5, sx + f * sg * 1.5, taban); } ctx.stroke();
    ctx.fillStyle = "#3f6a34"; ctx.beginPath(); ctx.moveTo(sx - sg / 2, taban); for (let xx = sx - sg / 2; xx <= sx + sg / 2; xx += 4) ctx.lineTo(xx, taban - b * 0.22 + Math.sin(xx / 5) * 2); ctx.lineTo(sx + sg / 2, taban); ctx.closePath(); ctx.fill();   // etekteki orman
    ctx.restore();
    const ux = x - g * 0.27, ug = g * 0.36, ub = b * 0.45;                                                                       // Urca tepesi
    ctx.fillStyle = "#4f7a3a"; ctx.beginPath(); ctx.moveTo(ux - ug / 2, taban); ctx.bezierCurveTo(ux - ug * 0.4, taban - ub, ux + ug * 0.3, taban - ub * 1.05, ux + ug / 2, taban); ctx.closePath(); ctx.fill();
    elips(ctx, ux - ug * 0.1, taban - ub * 0.7, ug * 0.18, ub * 0.12, "#6a9a4a");
    const a1 = [ux + ug * 0.02, taban - ub * 0.85], a2 = [sx - sg * 0.08, taban - b * 0.97];                                      // istasyonlar ve kablo
    for (const [px, py] of [a1, a2]) { ctx.fillStyle = "#f4f1ea"; ctx.fillRect(px - 3, py - 3, 6, 4); ctx.fillStyle = "#3a3a40"; ctx.fillRect(px - 3, py - 4, 6, 1.2); }
    ctx.strokeStyle = "#3a3a40"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(a1[0], a1[1] - 3); ctx.quadraticCurveTo((a1[0] + a2[0]) / 2, (a1[1] + a2[1]) / 2 - 3 + 8, a2[0], a2[1] - 3); ctx.stroke();
    canli.push({ tur: "teleferik", x: a1[0], y: a1[1] - 3, n: r(), dx: a2[0] - a1[0], dy: a2[1] - a1[1], s: 4 });
    for (const k of icNoktalar(B, w, h, 2, 8, 20, r).filter(disinda(A, 2))) {                                                    // yelkenliler
      ctx.fillStyle = "#f4f1ea"; ctx.beginPath(); ctx.moveTo(k.x, k.y - 7); ctx.lineTo(k.x + 4, k.y); ctx.lineTo(k.x, k.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#3a2a1a"; ctx.fillRect(k.x - 3, k.y, 7, 1.6);
    }
    return canli;
  }

  // =================== ARJANTİN ===================
  // ---------- AR: Perito Moreno Buzulu ----------
  // Arkada karlı dağlar, buzul yüzeyi ve yarıkları, göle inen sivri buz kuleli mavi-beyaz buz duvarı; gölde (her yerde
  // aynı mavi) yüzen buz kütleleri
  function peritoMoreno(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#1e7fd6", null);
    const su = h * 0.52, yuk = Math.max(10, h * 0.16);
    kirp(ctx, B, () => {
      ctx.fillStyle = "#5a6a80"; ctx.beginPath(); ctx.moveTo(-2, h * 0.22); for (let x = -2; x <= w + 2; x += 10) ctx.lineTo(x, h * (0.06 + ((x * 7) % 13) / 100)); ctx.lineTo(w + 2, h * 0.22); ctx.closePath(); ctx.fill();   // dağlar
      ctx.fillStyle = "#e8eef4"; for (let x = 0; x < w; x += 10) { ctx.beginPath(); ctx.moveTo(x, h * (0.06 + ((x * 7) % 13) / 100)); ctx.lineTo(x + 5, h * 0.12); ctx.lineTo(x - 5, h * 0.12); ctx.closePath(); ctx.fill(); }
      const gr = ctx.createLinearGradient(0, h * 0.15, 0, su - yuk); gr.addColorStop(0, "#f4f8fb"); gr.addColorStop(1, "#d4ecf6");    // buzul yüzeyi
      ctx.fillStyle = gr; ctx.fillRect(0, h * 0.15, w, su - yuk - h * 0.15 + 2);
      ctx.strokeStyle = "#8ac8e4"; ctx.lineWidth = 0.8; ctx.beginPath();
      for (let i = 0; i < w / 6; i++) { const x = r() * w, y = h * 0.17 + r() * (su - yuk - h * 0.17); ctx.moveTo(x, y); ctx.lineTo(x + (x - w / 2) * 0.04 + 1, y + 4); }
      ctx.stroke();
      const ust = (x) => su - yuk + Math.abs(Math.sin(x * 0.9) * 4) + ((x * 13) % 7) * 0.6;                                     // buz duvarı
      ctx.fillStyle = "#cfeaf6"; ctx.beginPath(); ctx.moveTo(-2, su); for (let x = -2; x <= w + 2; x += 3) ctx.lineTo(x, ust(x)); ctx.lineTo(w + 2, su); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#5ab0d8"; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 2; x < w; x += 5 + ((x * 3) % 4)) { ctx.moveTo(x, ust(x) + 2); ctx.lineTo(x + 0.5, su - 1); } ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.6)"; for (let x = 0; x < w; x += 3) ctx.fillRect(x, ust(x), 1.6, 1.4);
      ctx.fillStyle = "rgba(20, 60, 100, 0.35)"; ctx.fillRect(0, su - 1.5, w, 2.5);
      dalga(ctx, w, su + 5, h);
    });
    for (const k of icNoktalar(B, w, h, Math.max(2, Math.min(7, Math.round(w * h / 1600))), 7, 14, r).filter((k) => k.y > su + 8)) {   // yüzen buzlar
      const s = 3 + r() * 4;
      elips(ctx, k.x, k.y + s * 0.4, s * 1.3, s * 0.4, "rgba(200, 235, 250, 0.5)");
      ctx.fillStyle = "#e8f6fc"; ctx.beginPath(); ctx.moveTo(k.x - s, k.y + s * 0.3); ctx.lineTo(k.x - s * 0.6, k.y - s * 0.5); ctx.lineTo(k.x + s * 0.2, k.y - s * 0.7); ctx.lineTo(k.x + s, k.y + s * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#a8daf0"; ctx.beginPath(); ctx.moveTo(k.x + s * 0.2, k.y - s * 0.7); ctx.lineTo(k.x + s, k.y + s * 0.3); ctx.lineTo(k.x + s * 0.2, k.y + s * 0.3); ctx.closePath(); ctx.fill();
    }
    return [];
  }

  // ---------- AR: Caminito'nun renkli evleri ----------
  // Arnavut kaldırımlı sokak; oluklu saçtan, her bölümü ayrı renge boyanmış iki katlı evler: renkli pencere çerçeveleri,
  // demir korkuluklu küçük balkonlar, kapılar; sokakta tango yapan iki sevimli hayalet
  function caminitoEvi(ctx, x, taban, g, b, renkler) {
    const ust = taban - b;
    elips(ctx, x + 2, taban + 0.5, g * 0.55, 2.4, "rgba(0,0,0,0.28)");
    const bolumler = [[ust + b * 0.12, ust + b * 0.55], [ust + b * 0.55, taban]];
    bolumler.forEach(([y0, y1], i) => {
      ctx.fillStyle = renkler[i % renkler.length]; ctx.fillRect(x - g / 2, y0, g, y1 - y0);
      ctx.fillStyle = renkler[(i + 2) % renkler.length]; ctx.fillRect(x + g * 0.15, y0, g * 0.35, y1 - y0);
      ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let xx = x - g / 2 + 1.5; xx < x + g / 2; xx += 2.2) { ctx.moveTo(xx, y0); ctx.lineTo(xx, y1); } ctx.stroke();   // oluklu saç
    });
    ctx.fillStyle = "#6a6e76"; ctx.beginPath(); ctx.moveTo(x - g / 2 - 2, ust + b * 0.14); ctx.lineTo(x - g / 2 + 3, ust); ctx.lineTo(x + g / 2 - 3, ust); ctx.lineTo(x + g / 2 + 2, ust + b * 0.14); ctx.closePath(); ctx.fill();   // saç çatı
    ctx.strokeStyle = "#8a8e96"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let xx = x - g / 2; xx < x + g / 2; xx += 2.5) { ctx.moveTo(xx, ust + b * 0.14); ctx.lineTo(xx + 1, ust + 0.5); } ctx.stroke();
    for (const f of [-0.25, 0.25]) {                                                                                             // pencereler
      const px = x + f * g, py = ust + b * 0.22, pw = g * 0.18, ph = b * 0.2;
      ctx.fillStyle = renkler[(f < 0 ? 3 : 1) % renkler.length]; ctx.fillRect(px - pw / 2 - 1.2, py - 1.2, pw + 2.4, ph + 2.4);
      ctx.fillStyle = "#2a3a4a"; ctx.fillRect(px - pw / 2, py, pw, ph); ctx.fillStyle = "rgba(200, 225, 255, 0.35)"; ctx.fillRect(px - pw / 2 + 1, py + 1, 1.2, ph - 2);
    }
    const by = ust + b * 0.48;                                                                                                   // balkon
    ctx.fillStyle = "#2a2a2e"; ctx.fillRect(x - g * 0.4, by, g * 0.8, 1.6); ctx.fillRect(x - g * 0.4, by - b * 0.1, g * 0.8, 0.9);
    ctx.strokeStyle = "#2a2a2e"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let xx = x - g * 0.38; xx < x + g * 0.4; xx += 2) { ctx.moveTo(xx, by - b * 0.1); ctx.lineTo(xx, by); } ctx.stroke();
    ctx.fillStyle = "#5a3418"; ctx.fillRect(x - g * 0.12, taban - b * 0.32, g * 0.24, b * 0.32);                               // kapı
    ctx.fillStyle = renkler[2 % renkler.length]; ctx.fillRect(x - g * 0.12, taban - b * 0.34, g * 0.24, 1.6);
    for (const f of [-0.34, 0.34]) { ctx.fillStyle = "#2a3a4a"; ctx.fillRect(x + f * g - g * 0.07, taban - b * 0.3, g * 0.14, b * 0.14); }
  }
  function caminito(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#a8a090", null);
    kirp(ctx, B, () => { ctx.strokeStyle = "rgba(70, 60, 50, 0.3)"; ctx.lineWidth = 0.8; for (let y = 4, j = 0; y < h; y += 6, j++) for (let x = (j % 2) * 4; x < w; x += 8) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + 0.5, y + 0.5, 7, 5, 2.4); ctx.stroke(); } });
    const n = Math.max(1, Math.min(3, Math.round(w / (h * 0.75)))), gen = Math.min(w * 0.94, n * 88, ((h * 0.7) / 1.1) * n), sira = enIyiYer(B, w, h, gen, (gen / n) * 1.1, 5);
    const paletler = [["#e8402a", "#f2c94c", "#2f8fd0", "#3aa05a"], ["#2f8fd0", "#3aa05a", "#f2a23a", "#e8402a"], ["#f2c94c", "#7a4ab0", "#e8402a", "#2fa3a0"]];
    if (sira) { const g = sira.g / n; for (let i = 0; i < n; i++) caminitoEvi(ctx, sira.x - sira.g / 2 + g * (i + 0.5), sira.taban - (i % 2) * 2, g * 0.98, sira.b - (i % 2) * 3, paletler[i % 3]); }
    const T = sira && ustteYer(B, w, h, 32, 30, h - 3, 3, [0.5, 0.4, 0.6, 0.3, 0.7]);                                         // tango yapan hayaletler
    const tx = T ? T.x : null, tt = T ? T.taban : null;
    if (T && (!sira || tt > sira.taban + 4)) {
      const s = T.b * 0.85, { sevimliHayalet } = window.ULKE_OBJE_YARDIMCI;
      sevimliHayalet(ctx, tx - s * 0.26, tt, s, { yon: 1 });
      sevimliHayalet(ctx, tx + s * 0.26, tt - 1, s * 0.92, { yon: -1, renk: "#fde8ee" });
      elips(ctx, tx + s * 0.1, tt - s * 0.85, s * 0.06, s * 0.06, "#d6302a"); elips(ctx, tx + s * 0.1, tt - s * 0.78, s * 0.05, s * 0.025, "#3a8a3a");   // gül
    }
    return [];
  }

  Object.assign(window.ULKE_OBJELERI, {
    akcaagacOrmani, kunduzBaraji, ozgurlukHeykeli, buyukKanyon, papelPicadoPazari, ajoloteGoleti, mumPalmiyeleri, cartagenaEvleri,
    machuPicchu, lamalar, amazonKuslari, sekerSomunu, peritoMoreno, caminito,
  });
})();
