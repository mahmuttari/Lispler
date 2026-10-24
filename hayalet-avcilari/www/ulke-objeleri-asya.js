/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: ÜLKE OBJELERİ (Asya, 3.14.0)
   Ressam imzası engel-temalari.js ile aynı: (ctx, w, h, r, p, B) -> canli[]. B "yama" ya da "kaya" biçimi; süsler
   biçimin içinde kalır, sabit çizim dikdörtgenin üst kenarından taşmaz; uzun yapılar maket boyunda (spec §5.3).
   Canlı süsler ENGEL_CANLI'ya eklenir (her karede çizilir). Math.random yok; insan, bayrak, dinî öğe, silah yok.
   Japonya (Görev 5): kiraz ağaçları ve düşen yapraklar, Fuji Dağı maketi. Arabistan, Filistin, İran ve Orta Asya
   (Görev 10): Yemen, Suudi Arabistan, Filistin, Irak, İran, Özbekistan, Afganistan. Öteki Asya ülkeleri Görev 11–12'de.
   Yerleşim yardımcıları avrupa ve afrika dosyalarından (ULKE_OBJE_YARDIMCI; o dosyalar önce yüklenir).
   ============================================================ */
window.ULKE_OBJELERI = window.ULKE_OBJELERI || {};
(function () {
  const { doldur, cizgi, kirp, kenarNoktalari, icNoktalar, karistir, acik, koyu, elips, cimTutami, yuvarlak } = window.ENGEL;
  const ustBosluk = (B, x, y, en = 140) => { let k = 0; while (k < en && window.engelUzaklik(B, x, y - k - 2) < -2) k += 2; return k; };
  const { yamaZemin, yapiSigdir, enIyiYer, disinda, yuz, yaprakKubbe, icAralik, kumZemin, yanHurma } = window.ULKE_OBJE_YARDIMCI;
  const uz = (B, x, y) => window.engelUzaklik(B, x, y);

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

  // =================== ARABİSTAN, FİLİSTİN, İRAN, ORTA ASYA (Görev 10) ===================
  // ---------- canlı: uçurtma (rüzgârda süzülür; ip k.ax, k.ay'daki makaraya iner; kuyrukta fiyonklar) ----------
  Object.assign(window.ENGEL_CANLI, {
    ucurtma(ctx, x, y, zaman, n, k) {
      const s = (k && k.s) || 6, kx = x + Math.sin(zaman * 1.1 + n * 6.3) * 3, ky = y + Math.cos(zaman * 1.4 + n * 4.1) * 2, a = Math.sin(zaman * 1.7 + n * 9) * 0.25;
      // makara yerel koordinatta saklıdır; canliCiz yalnız x, y'yi dünyaya taşır, makara da aynı farkla taşınır
      const ax = k && k.ax != null ? x + k.ax - k.x : x, ay = k && k.ay != null ? y + k.ay - k.y : y + 30;
      ctx.strokeStyle = "rgba(240, 235, 220, 0.8)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(ax, ay);   // ip
      ctx.quadraticCurveTo((ax + kx) / 2 + 4, (ay + ky) / 2 + 6, kx, ky + s); ctx.stroke();
      ctx.save(); ctx.translate(kx, ky); ctx.rotate(a);
      ctx.strokeStyle = (k && k.renk2) || "#f2c94c"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, s);        // kuyruk
      for (let i = 1; i <= 6; i++) ctx.lineTo(Math.sin(zaman * 4 + i + n * 5) * 2, s + i * 2.6);
      ctx.stroke();
      for (const i of [2, 4, 6]) { const tx = Math.sin(zaman * 4 + i + n * 5) * 2, ty = s + i * 2.6; elips(ctx, tx - 1.2, ty, 1.1, 0.7, (k && k.renk1) || "#c2264b"); elips(ctx, tx + 1.2, ty, 1.1, 0.7, (k && k.renk1) || "#c2264b"); }
      ctx.fillStyle = (k && k.renk1) || "#c2264b"; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.75, 0); ctx.lineTo(0, s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = (k && k.renk2) || "#f2c94c"; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(-s * 0.75, 0); ctx.lineTo(0, s); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(60, 40, 20, 0.7)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.moveTo(-s * 0.75, 0); ctx.lineTo(s * 0.75, 0); ctx.stroke();
      ctx.restore();
    },
  });

  // ---------- YE: Sokotra ejder kanı ağaçları ----------
  // Kireçtaşı yayla ve kayalar; kalın gövdeden çatallanarak yükselen dallar ve üstte yoğun, şemsiye biçimli taç
  function ejderKaniAgaci(ctx, x, taban, boy) {
    const tac = boy * 0.62, ty = taban - boy * 0.74;
    elips(ctx, x + 3, taban, tac * 0.8, tac * 0.16, "rgba(0,0,0,0.28)");
    ctx.strokeStyle = "#8a7a6a"; ctx.lineCap = "round"; ctx.lineWidth = Math.max(2.5, boy * 0.1);
    ctx.beginPath(); ctx.moveTo(x, taban); ctx.lineTo(x, taban - boy * 0.38); ctx.stroke();
    ctx.lineWidth = Math.max(1.2, boy * 0.045); ctx.beginPath();                                                 // çatallanan dallar
    for (let i = -3; i <= 3; i++) {
      const ax = x + i * tac * 0.12, bx = x + i * tac * 0.28, by = ty + tac * 0.12;
      ctx.moveTo(x, taban - boy * 0.36); ctx.quadraticCurveTo(ax, taban - boy * 0.5, bx, by);
    }
    ctx.stroke();
    elips(ctx, x, ty + tac * 0.1, tac, tac * 0.2, "#2f4a24");                                                       // taç altı
    ctx.fillStyle = "#3f6a2e"; ctx.beginPath(); ctx.moveTo(x - tac, ty + tac * 0.1);
    ctx.quadraticCurveTo(x - tac * 0.92, ty - tac * 0.42, x, ty - tac * 0.45); ctx.quadraticCurveTo(x + tac * 0.92, ty - tac * 0.42, x + tac, ty + tac * 0.1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#5a8a3a"; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let i = 0; i < 18; i++) { const px = x - tac * 0.85 + (i / 17) * tac * 1.7, py = ty - tac * 0.1 - Math.sin((i / 17) * Math.PI) * tac * 0.25; ctx.moveTo(px, py); ctx.lineTo(px + 1.5, py - 2.5); }
    ctx.stroke();
    elips(ctx, x - tac * 0.3, ty - tac * 0.28, tac * 0.35, tac * 0.08, "rgba(255,255,255,0.12)");
  }
  function ejderKaniAgaclari(ctx, w, h, r, p, B) {
    const kirec = "#b5a98f";
    yamaZemin(ctx, B, w, h, r, kirec, "#8a8a5a", 900);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 400; i++) { const x = r() * w, y = r() * h, s = 2 + r() * 4; elips(ctx, x + 0.8, y + 1, s, s * 0.7, "rgba(0,0,0,0.2)"); elips(ctx, x, y, s, s * 0.7, karistir(kirec, "#ffffff", r() * 0.3)); } });
    const ana = enIyiYer(B, w, h, Math.min(w * 0.8, 84), Math.min(h * 0.8, 66), 5);
    if (ana) ejderKaniAgaci(ctx, ana.x, ana.taban, ana.b);
    for (const k of icNoktalar(B, w, h, 3, 14, 26, r).filter(disinda(ana, 6))) {
      const yer = yapiSigdir(B, k.x, k.y + 6, 30, Math.min(26, ustBosluk(B, k.x, k.y + 6) - 2));
      if (yer && yer.b > 12) ejderKaniAgaci(ctx, k.x, k.y + 6, yer.b);
    }
    return [];
  }

  // ---------- YE: Sana'a kule evleri ----------
  // Taş zemin katlı, kerpiç üst katlı çok katlı kuleler; katlar arasında ve pencere çevresinde beyaz alçı süsleri,
  // pencerelerin üstünde renkli camlı yarım daire (kamariye), tepede beyaz basamaklı korkuluk
  function kuleEv(ctx, x, taban, g, b, renk) {
    const ust = taban - b, beyaz = "#f4f1ea", kat = Math.max(4, Math.round(b / 14)), kb = (b - 4) / kat;
    elips(ctx, x + 2, taban + 0.5, g * 0.6, 2.4, "rgba(0,0,0,0.28)");
    ctx.fillStyle = renk; ctx.fillRect(x - g / 2, ust + 4, g, b - 4);
    ctx.fillStyle = koyu(renk, 0.2); ctx.fillRect(x + g * 0.3, ust + 4, g * 0.2, b - 4);
    ctx.fillStyle = "#6f665a"; ctx.fillRect(x - g / 2, taban - kb * 1.3, g, kb * 1.3);                              // taş zemin kat
    ctx.strokeStyle = "#5a524a"; ctx.lineWidth = 0.5; for (let y = taban - kb * 1.3 + 3; y < taban; y += 3) { ctx.beginPath(); ctx.moveTo(x - g / 2, y); ctx.lineTo(x + g / 2, y); ctx.stroke(); }
    const camlar = ["#d6453d", "#2f6fb0", "#f2c94c", "#3f8f5a"];
    for (let i = 1; i < kat; i++) {
      const ky = taban - kb * 1.3 - (i - 1) * kb;
      ctx.fillStyle = beyaz; ctx.fillRect(x - g / 2, ky - 1, g, 1.4);                                                // alçı kuşak
      for (let k2 = 0; k2 < 3; k2++) { ctx.beginPath(); ctx.moveTo(x - g / 2 + k2 * g / 3, ky - 1); ctx.lineTo(x - g / 2 + (k2 + 0.5) * g / 3, ky - 3); ctx.lineTo(x - g / 2 + (k2 + 1) * g / 3, ky - 1); ctx.fill(); }
      for (const f of [-0.22, 0.22]) {                                                                                // pencereler
        const px = x + f * g, pw = g * 0.18, ph = kb * 0.38, py = ky - kb * 0.62;
        ctx.fillStyle = beyaz; ctx.fillRect(px - pw / 2 - 1, py - pw / 2 - 1, pw + 2, ph + pw / 2 + 2);
        ctx.fillStyle = "#3a2a20"; ctx.fillRect(px - pw / 2, py, pw, ph);
        for (let c = 0; c < 3; c++) { ctx.fillStyle = camlar[(c + i) % 4]; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, pw / 2, Math.PI + (c * Math.PI) / 3, Math.PI + ((c + 1) * Math.PI) / 3); ctx.closePath(); ctx.fill(); }
      }
    }
    ctx.fillStyle = beyaz; ctx.fillRect(x - g / 2 - 0.5, ust + 3, g + 1, 1.8);                                        // basamaklı korkuluk
    for (let k2 = 0; k2 < 4; k2++) { const bx = x - g / 2 + (k2 + 0.5) * g / 4; ctx.fillRect(bx - 1.5, ust + 1, 3, 2.5); ctx.fillRect(bx - 0.6, ust, 1.2, 1.2); }
    ctx.fillStyle = "#4a3324"; ctx.fillRect(x - g * 0.1, taban - kb * 0.9, g * 0.2, kb * 0.9);                          // kapı
  }
  function kuleEvler(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#9a7a5a", "#8a8a4a", 1000);
    const n = Math.max(1, Math.min(3, Math.floor(w / 36))), sira = enIyiYer(B, w, h, Math.min(w * 0.86, n * 30), Math.min(h * 0.86, 92), 5);
    if (!sira) return [];
    const g = sira.g / n, renkler = [p.duvar || "#9a5a3c", "#a8683f", "#8a4f33"];
    for (let i = 0; i < n; i++) kuleEv(ctx, sira.x - sira.g / 2 + g * (i + 0.5), sira.taban - (i % 2) * 2, g * 0.88, sira.b * (i % 2 ? 0.82 : 1) - (i % 2) * 2, renkler[i % 3]);
    return [];
  }

  // ---------- SA: hurma bahçesi ----------
  // Sulama arklı kumlu toprak; sıra sıra hurma ağaçları (halkalı gövde, sarkan yapraklar, turuncu salkımlar)
  function hurmaBahcesi(ctx, w, h, r, p, B) {
    const toprak = "#b58a5a";
    yamaZemin(ctx, B, w, h, r, toprak, null);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(toprak, 0.12); ctx.lineWidth = 1; for (let y = 8; y < h; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 1); ctx.stroke(); }
      for (let y = 20; y < h; y += 34) { ctx.fillStyle = "#6b4a2a"; ctx.fillRect(0, y - 2.5, w, 5); ctx.fillStyle = "#1e7fd6"; ctx.fillRect(0, y - 1.3, w, 2.6); }   // ark (aynı mavi)
    });
    for (let y = 26, j = 0; y < h + 4; y += 24, j++) for (let x = 14 + (j % 2) * 14; x < w - 6; x += 28) {
      const taban = Math.min(y, h - 6), boy = Math.min(30, ustBosluk(B, x, taban) - 3);
      if (boy > 12 && uz(B, x, taban) < -5) yanHurma(ctx, x, taban, boy);
    }
    return [];
  }

  // ---------- SA: AlUla Fil Kayası (kaya biçimi) ----------
  // Kızıl kumtaşı: tabakalı ön yüz ve üst yüz, çöl cilası; üstte hortumu yere değen, altında kemer açıklığı olan fil
  // biçimli kaya maketi (küçük bir göz)
  function filKayasiSekli(ctx, x, taban, g, b, renk) {
    const kemer = (ctx2) => {                                                                                         // hortum ile ön bacak arası açıklık
      ctx2.bezierCurveTo(x + g * 0.39, taban - b * 0.15, x + g * 0.36, taban - b * 0.32, x + g * 0.32, taban - b * 0.45);
      ctx2.bezierCurveTo(x + g * 0.25, taban - b * 0.57, x + g * 0.08, taban - b * 0.57, x + g * 0.02, taban - b * 0.4);
      ctx2.bezierCurveTo(x - g * 0.01, taban - b * 0.25, x, taban - b * 0.1, x - g * 0.01, taban);
    };
    const yol = () => {
      ctx.beginPath(); ctx.moveTo(x - g / 2, taban);
      ctx.bezierCurveTo(x - g * 0.58, taban - b * 0.75, x - g * 0.25, taban - b * 1.0, x + g * 0.05, taban - b * 0.98);      // sırt
      ctx.bezierCurveTo(x + g * 0.3, taban - b * 0.97, x + g * 0.48, taban - b * 0.85, x + g * 0.46, taban - b * 0.6);       // alın
      ctx.bezierCurveTo(x + g * 0.45, taban - b * 0.35, x + g * 0.5, taban - b * 0.15, x + g * 0.48, taban);                 // hortumun dış kenarı
      ctx.lineTo(x + g * 0.38, taban); kemer(ctx); ctx.closePath();
    };
    elips(ctx, x + 3, taban + 1, g * 0.55, 2.6, "rgba(0,0,0,0.3)");
    ctx.fillStyle = "rgba(40, 18, 8, 0.45)"; ctx.beginPath(); ctx.moveTo(x + g * 0.38, taban); kemer(ctx); ctx.closePath(); ctx.fill();   // açıklığın gölgesi
    const gr = ctx.createLinearGradient(x - g / 2, 0, x + g / 2, 0); gr.addColorStop(0, acik(renk, 0.2)); gr.addColorStop(0.6, renk); gr.addColorStop(1, koyu(renk, 0.3));
    yol(); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); yol(); ctx.clip();
    ctx.strokeStyle = koyu(renk, 0.22); ctx.lineWidth = 0.9;
    for (let y = taban - b + 4; y < taban; y += 4.5) { ctx.beginPath(); for (let xx = x - g / 2 - 2; xx <= x + g / 2 + 2; xx += 4) ctx.lineTo(xx, y + Math.sin(xx / 6 + y) * 0.8); ctx.stroke(); }
    ctx.fillStyle = "rgba(40, 18, 8, 0.16)"; for (const f of [-0.3, -0.05, 0.42]) ctx.fillRect(x + f * g, taban - b, 1.6, b);
    ctx.restore();
    ctx.strokeStyle = koyu(renk, 0.45); ctx.lineWidth = 1.2; yol(); ctx.stroke();
    ctx.strokeStyle = koyu(renk, 0.35); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + g * 0.12, taban - b * 0.72, b * 0.2, -0.45 * Math.PI, 0.45 * Math.PI); ctx.stroke();   // kulak kıvrımı
    ctx.beginPath(); for (let t = 0.15; t < 0.5; t += 0.08) { ctx.moveTo(x + g * 0.4, taban - b * t); ctx.lineTo(x + g * 0.47, taban - b * t - 1); } ctx.stroke();   // hortum kırışıkları
    elips(ctx, x + g * 0.34, taban - b * 0.76, g * 0.022, g * 0.026, koyu(renk, 0.6));
  }
  function filKayasi(ctx, w, h, r, p, B) {
    const d = B.derinlik || 0, kaya = "#b5683a";
    doldur(ctx, B, "rgba(0,0,0,0.38)", 2, d + 1);
    cizgi(ctx, B, koyu(kaya, 0.5), 3, 0, d);
    doldur(ctx, B, koyu(kaya, 0.32), 0, d);
    kirp(ctx, B, () => { ctx.strokeStyle = koyu(kaya, 0.45); ctx.lineWidth = 1; for (let y = 3; y < h + d; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 1); ctx.stroke(); } }, 0, d);
    cizgi(ctx, B, koyu(kaya, 0.5), 3);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, acik(kaya, 0.15)); g.addColorStop(1, koyu(kaya, 0.12));
    doldur(ctx, B, g);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(kaya, 0.14); ctx.lineWidth = 1;
      for (let y = 6; y < h; y += 8) { ctx.beginPath(); for (let x = 0; x <= w; x += 5) ctx.lineTo(x, y + Math.sin(x / 13 + y) * 1.4); ctx.stroke(); }
      for (let i = 0; i < w / 12; i++) elips(ctx, r() * w, h * (0.72 + r() * 0.3), 6 + r() * 6, 2.5 + r() * 2, "#d9a35a");
    });
    const yer = enIyiYer(B, w, h, Math.min(w * 0.66, 92), Math.min(h * 0.62, 62), 5);
    if (yer) filKayasiSekli(ctx, yer.x, yer.taban, yer.g, yer.b, karistir(kaya, "#d08050", 0.35));
    return [];
  }

  // ---------- PS: zeytin bahçesi ----------
  // Kuru taş setli kızıl toprak; boğumlu, yarılmış gövdeli yaşlı zeytin ağaçları, gümüş yeşili taçlar ve zeytinler; yerde
  // dolu bir sepet
  function zeytinBahcesi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#8a5a3a", "#8a8a4a", 900);
    kirp(ctx, B, () => {                                                                                               // kuru taş setler
      for (let y = 22; y < h; y += 30) for (let x = -4; x < w + 4; x += 6) {
        const yy = y + Math.sin(x / 22 + y) * 3, s = 2.6 + ((x * 7 + y) % 5) * 0.3;
        elips(ctx, x + 0.6, yy + 0.8, s, s * 0.7, "rgba(0,0,0,0.25)"); elips(ctx, x, yy, s, s * 0.7, ["#a8a08a", "#8f877a", "#b8b09a"][(x + y) % 3 < 0 ? 0 : (x + y) % 3]);
      }
    });
    const n = Math.max(1, Math.min(3, Math.round(w * h / 5500)));
    for (const k of icNoktalar(B, w, h, n, 18, 40, r)) {
      const boy = Math.max(18, Math.min(40, ustBosluk(B, k.x, k.y) + 4)), x = k.x, taban = k.y + 6, tac = Math.min(16, boy * 0.42 + 3), ty = taban - boy + tac * 0.85;
      elips(ctx, x + 2, taban, tac * 1.05, tac * 0.3, "rgba(0,0,0,0.28)");
      ctx.strokeStyle = "#6f665a"; ctx.lineCap = "round"; ctx.lineWidth = 4;                                         // boğumlu, çatallı gövde
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * 1.5, taban); ctx.bezierCurveTo(x + sx * 5, taban - (taban - ty) * 0.3, x - sx * 3, taban - (taban - ty) * 0.6, x + sx * tac * 0.3, ty + 3); ctx.stroke(); }
      ctx.strokeStyle = "#8f877a"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 1, taban - 2); ctx.lineTo(x + 1, taban - (taban - ty) * 0.4); ctx.stroke();
      yaprakKubbe(ctx, x, ty, tac, r, ["#8a9a6a", "#a3b083", "#7a8a5a"], "#5a6a4a", 1.2);
      for (let i = 0; i < 9; i++) elips(ctx, x + (r() - 0.5) * tac * 2, ty + (r() - 0.6) * tac * 0.7, 1, 1.25, r() < 0.5 ? "#3a2a3a" : "#6a7a3a");   // zeytinler
    }
    const sp = icNoktalar(B, w, h, 1, 10, 10, r)[0];
    if (sp && w * h > 9000) {
      elips(ctx, sp.x + 1, sp.y + 2, 7, 2, "rgba(0,0,0,0.25)");
      for (let i = 0; i < 6; i++) elips(ctx, sp.x - 4 + i * 1.6, sp.y - 2.4 - (i % 2), 1.1, 1.3, i % 2 ? "#3a2a3a" : "#6a7a3a");
      ctx.fillStyle = "#b5874f"; ctx.beginPath(); ctx.moveTo(sp.x - 6, sp.y - 2); ctx.lineTo(sp.x + 6, sp.y - 2); ctx.lineTo(sp.x + 4.5, sp.y + 2); ctx.lineTo(sp.x - 4.5, sp.y + 2); ctx.closePath(); ctx.fill();
    }
    return [];
  }

  // ---------- PS: Hayat Ağacı mozaiği ----------
  // Taş mozaik zemin ve kırmızı-siyah örgülü bordür; yarım daire tepeli pano: ortada meyveli hayat ağacı, iki yanında
  // otlayan iki ceylan (aslan ve av sahnesi yok); her şey küçük taş parçalarıyla (mozaik ızgarası)
  function ceylan(ctx, x, taban, s, yon, otluyor) {
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    const ten = "#c8904a", koyuT = "#8a5a2a";
    ctx.strokeStyle = koyuT; ctx.lineWidth = s * 0.08; ctx.lineCap = "round"; ctx.beginPath();
    for (const bx of [-0.42, -0.3, 0.3, 0.42]) { ctx.moveTo(bx * s, -s * 0.55); ctx.lineTo(bx * s + s * 0.02, 0); }
    ctx.stroke();
    elips(ctx, 0, -s * 0.68, s * 0.55, s * 0.22, ten); elips(ctx, 0, -s * 0.58, s * 0.4, s * 0.1, "#f1e3c4");
    ctx.strokeStyle = ten; ctx.lineWidth = s * 0.12; ctx.beginPath();
    if (otluyor) { ctx.moveTo(s * 0.45, -s * 0.72); ctx.lineTo(s * 0.72, -s * 0.2); } else { ctx.moveTo(s * 0.45, -s * 0.75); ctx.lineTo(s * 0.62, -s * 1.1); }
    ctx.stroke();
    const hx = otluyor ? s * 0.78 : s * 0.7, hy = otluyor ? -s * 0.12 : -s * 1.15;
    elips(ctx, hx, hy, s * 0.14, s * 0.09, ten); elips(ctx, hx - s * 0.02, hy - s * 0.02, s * 0.03, s * 0.03, "#1f1410");
    ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.moveTo(hx - s * 0.06, hy - s * 0.06); ctx.quadraticCurveTo(hx - s * 0.2, hy - s * 0.3, hx - s * 0.05, hy - s * 0.38); ctx.stroke();   // boynuz
    ctx.restore();
  }
  function hayatAgaciMozaigi(ctx, w, h, r, p, B) {
    const tas = "#e3d3b0", kirmizi = p.vurgu2 || "#b22c2c";
    yamaZemin(ctx, B, w, h, r, tas, null);
    const yer = enIyiYer(B, w, h, Math.min(w * 0.86, 120), Math.min(h * 0.86, 96), 6);
    if (yer) {
      const { g, b, x, taban } = yer, ust = taban - b, R = g / 2;
      const pano = () => { ctx.beginPath(); ctx.moveTo(x - R, taban); ctx.lineTo(x - R, ust + R); ctx.arc(x, ust + R, R, Math.PI, 0); ctx.lineTo(x + R, taban); ctx.closePath(); };
      pano(); ctx.fillStyle = kirmizi; ctx.fill();                                                                     // bordür
      ctx.save(); pano(); ctx.clip();
      ctx.strokeStyle = "#1f1a14"; ctx.lineWidth = 1.2; ctx.beginPath();                                               // örgü
      for (let a = 0; a < Math.PI * 2; a += 0.2) { const px = x + Math.cos(a) * (R - 2.5), py = ust + R + Math.sin(a) * (R - 2.5); ctx.moveTo(px - 1.2, py); ctx.lineTo(px + 1.2, py); }
      ctx.stroke();
      ctx.restore();
      const ic = { x, ust: ust + 5, R: R - 5, taban: taban - 5 };
      ctx.save(); ctx.beginPath(); ctx.moveTo(ic.x - ic.R, ic.taban); ctx.lineTo(ic.x - ic.R, ic.ust + ic.R); ctx.arc(ic.x, ic.ust + ic.R, ic.R, Math.PI, 0); ctx.lineTo(ic.x + ic.R, ic.taban); ctx.closePath(); ctx.clip();
      ctx.fillStyle = "#efe2c4"; ctx.fillRect(x - R, ust, g, b);
      ctx.fillStyle = "#c9b27a"; ctx.fillRect(x - R, taban - b * 0.16, g, b * 0.16);                                       // toprak
      const tb = taban - b * 0.12, ag = Math.min(R * 0.9, b * 0.5);                                                      // ağaç
      ctx.fillStyle = "#6b4a2a"; ctx.fillRect(x - ag * 0.08, tb - ag * 0.9, ag * 0.16, ag * 0.9);
      elips(ctx, x, tb - ag * 1.25, ag * 0.75, ag * 0.6, "#3f7a3a");
      elips(ctx, x - ag * 0.25, tb - ag * 1.4, ag * 0.35, ag * 0.25, "#5f9a4a");
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; elips(ctx, x + Math.cos(a) * ag * 0.5, tb - ag * 1.25 + Math.sin(a) * ag * 0.38, ag * 0.07, ag * 0.07, i % 2 ? "#e07b2a" : "#d6453d"); }
      ceylan(ctx, x - ag * 0.95, tb, ag * 0.55, 1, true);
      ceylan(ctx, x + ag * 0.95, tb, ag * 0.55, -1, false);
      ctx.strokeStyle = "rgba(240, 230, 210, 0.55)"; ctx.lineWidth = 0.5; ctx.beginPath();                              // mozaik ızgarası
      for (let xx = x - R; xx < x + R; xx += 2.6) { ctx.moveTo(xx, ust); ctx.lineTo(xx, taban); }
      for (let yy = ust; yy < taban; yy += 2.6) { ctx.moveTo(x - R, yy); ctx.lineTo(x + R, yy); }
      ctx.stroke();
      ctx.restore();
    }
    kirp(ctx, B, () => {                                                                                                // dış zemin taşları
      ctx.strokeStyle = "rgba(150, 120, 80, 0.35)"; ctx.lineWidth = 0.5; ctx.beginPath();
      for (let xx = 0; xx < w; xx += 4) { ctx.moveTo(xx, 0); ctx.lineTo(xx, h); }
      for (let yy = 0; yy < h; yy += 4) { ctx.moveTo(0, yy); ctx.lineTo(w, yy); }
      if (yer) { ctx.stroke(); ctx.beginPath(); }
      ctx.stroke();
    }, 0, 0, 0);
    if (yer) {                                                                                                          // panoyu ızgaranın üstüne yeniden kenarla
      const { g, b, x, taban } = yer, R = g / 2, ust = taban - b;
      ctx.strokeStyle = "#1f1a14"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - R, taban); ctx.lineTo(x - R, ust + R); ctx.arc(x, ust + R, R, Math.PI, 0); ctx.lineTo(x + R, taban); ctx.stroke();
    }
    return [];
  }

  // ---------- IQ: kamış mudhif evleri ----------
  // Bataklık: altta su (her yerde aynı mavi) ve sazlar, üstte kamış adacığı; demet sütunlu, kafes örgülü kemerli kamış
  // evler; suda dar bir kamış kayık
  function mudhif(ctx, x, taban, g, b) {
    const kamis = "#d9b45a", koyuK = "#a07a3a";
    elips(ctx, x + 2, taban + 0.5, g * 0.6, 2.4, "rgba(0,0,0,0.28)");
    const kemer = () => { ctx.beginPath(); ctx.moveTo(x - g / 2, taban); ctx.bezierCurveTo(x - g / 2, taban - b * 0.9, x - g * 0.2, taban - b, x, taban - b); ctx.bezierCurveTo(x + g * 0.2, taban - b, x + g / 2, taban - b * 0.9, x + g / 2, taban); ctx.closePath(); };
    kemer(); ctx.fillStyle = kamis; ctx.fill();
    ctx.save(); kemer(); ctx.clip();
    ctx.strokeStyle = koyuK; ctx.lineWidth = 0.6; ctx.beginPath();                                                   // kafes örgü
    for (let k = -b; k < g + b; k += 4) { ctx.moveTo(x - g / 2 + k, taban); ctx.lineTo(x - g / 2 + k + b, taban - b); ctx.moveTo(x + g / 2 - k, taban); ctx.lineTo(x + g / 2 - k - b, taban - b); }
    ctx.stroke();
    ctx.strokeStyle = "#8a6230"; ctx.lineWidth = Math.max(1.5, g * 0.06);                                          // demet sütunlar
    for (const f of [-0.36, -0.18, 0, 0.18, 0.36]) { ctx.beginPath(); ctx.moveTo(x + f * g, taban); ctx.lineTo(x + f * g, taban - b * (1 - Math.abs(f) * 1.1)); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = koyuK; ctx.lineWidth = 1.2; kemer(); ctx.stroke();
    for (const sx of [-1, 1]) { ctx.fillStyle = "#8a6230"; ctx.beginPath(); ctx.moveTo(x + sx * g / 2 - 2, taban); ctx.lineTo(x + sx * g / 2 - 2, taban - b * 0.55); ctx.lineTo(x + sx * g / 2, taban - b * 0.68); ctx.lineTo(x + sx * g / 2 + 2, taban - b * 0.55); ctx.lineTo(x + sx * g / 2 + 2, taban); ctx.closePath(); ctx.fill(); }   // köşe demetleri
    ctx.fillStyle = "#3a2a14"; ctx.beginPath(); ctx.moveTo(x - g * 0.12, taban); ctx.lineTo(x - g * 0.12, taban - b * 0.3); ctx.quadraticCurveTo(x, taban - b * 0.45, x + g * 0.12, taban - b * 0.3); ctx.lineTo(x + g * 0.12, taban); ctx.closePath(); ctx.fill();   // kapı
  }
  function mudhifEvleri(ctx, w, h, r, p, B) {
    const kiyi = h * 0.66;
    yamaZemin(ctx, B, w, h, r, "#c9a85a", "#9a8a3a", 700);
    kirp(ctx, B, () => {
      ctx.fillStyle = "#1e7fd6"; ctx.fillRect(0, kiyi, w, h - kiyi);                                                   // bataklık suyu
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 0.8; for (let y = kiyi + 5; y < h; y += 5) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 8 + y) * 0.8); ctx.stroke(); }
      ctx.fillStyle = "#a08a3a"; for (let x = 0; x < w; x += 3) ctx.fillRect(x, kiyi - 1.5 + ((x * 7) % 3), 1.2, 3);
    });
    const n = w > 120 ? 2 : 1, sira = enIyiYer(B, w, h, Math.min(w * 0.86, n * 50), Math.min(kiyi - 6, 48), 5);
    if (sira) { const g = sira.g / n; for (let i = 0; i < n; i++) mudhif(ctx, sira.x - sira.g / 2 + g * (i + 0.5), Math.min(sira.taban, kiyi), g * 0.86, sira.b * (i % 2 ? 0.85 : 1)); }
    for (const k of kenarNoktalari(B, 7, -4)) if (k.y > kiyi + 2 && k.ny > 0.2 && r() < 0.6) {                          // sazlar
      ctx.strokeStyle = "#7a8a2a"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(k.x - 1, k.y - 8); ctx.moveTo(k.x + 1.5, k.y); ctx.lineTo(k.x + 2.5, k.y - 7); ctx.stroke();
    }
    const kx = w * 0.5, ky = kiyi + (h - kiyi) * 0.45;                                                                    // kamış kayık
    if (uz(B, kx - 18, ky) < -3 && uz(B, kx + 18, ky) < -3) {
      ctx.fillStyle = "#3a2a1a"; ctx.beginPath(); ctx.moveTo(kx - 18, ky - 2); ctx.quadraticCurveTo(kx, ky + 4, kx + 18, ky - 3); ctx.quadraticCurveTo(kx, ky + 1, kx - 18, ky - 2); ctx.fill();
      ctx.strokeStyle = "#8a6238"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(kx + 4, ky); ctx.lineTo(kx + 12, ky - 12); ctx.stroke();
    }
    return [];
  }

  // ---------- IQ: şenaşil ahşap balkonlar ----------
  // Sarı tuğla eski ev cephesi; üst katta çıkma yapan, ince kafesli ve renkli camlı koyu ahşap balkonlar (şenaşil),
  // altlarında oymalı ahşap dayanaklar; zemin katta ahşap kapı ve küçük pencereler
  function senasil(ctx, x, y, g, b) {
    const ahsap = "#5a3418";
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(x - g / 2 + 2, y + 2, g, b);
    ctx.fillStyle = ahsap; ctx.fillRect(x - g / 2, y, g, b);
    ctx.fillStyle = "#3a2210"; ctx.fillRect(x - g / 2, y, g, 2.2); ctx.fillRect(x - g / 2, y + b - 2.2, g, 2.2);
    const n = Math.max(2, Math.round(g / 9));
    for (let i = 0; i < n; i++) {
      const px = x - g / 2 + 2 + (i * (g - 4)) / n, pw = (g - 4) / n - 1.5, py = y + 3.5, ph = b - 7;
      ctx.fillStyle = "#8a5a2b"; ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = "#3a2210"; ctx.lineWidth = 0.5; ctx.beginPath();                                              // kafes
      for (let k = 1.5; k < pw + ph; k += 2) { ctx.moveTo(px + Math.min(k, pw), py + Math.max(0, k - pw)); ctx.lineTo(px + Math.max(0, k - ph), py + Math.min(k, ph)); }
      ctx.stroke();
      ctx.fillStyle = ["#d6453d", "#2f6fb0", "#f2c94c"][i % 3]; ctx.fillRect(px + 0.5, py + 0.5, pw - 1, 2);           // renkli cam
    }
    for (const f of [-0.35, 0, 0.35]) { ctx.fillStyle = ahsap; ctx.beginPath(); ctx.moveTo(x + f * g - 2, y + b); ctx.lineTo(x + f * g + 2, y + b); ctx.lineTo(x + f * g, y + b + 5); ctx.closePath(); ctx.fill(); }   // dayanaklar
  }
  function senasilBalkonlar(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#b8a07a", null);
    kirp(ctx, B, () => { ctx.strokeStyle = "rgba(120, 90, 50, 0.3)"; ctx.lineWidth = 0.8; for (let y = 5, j = 0; y < h; y += 7, j++) for (let x = (j % 2) * 6; x < w; x += 12) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + 1, y + 1, 10, 5, 2); ctx.stroke(); } });
    const n = w > 120 ? 2 : 1, yer = enIyiYer(B, w, h, Math.min(w * 0.88, n * 44 + 6), Math.min(h * 0.84, 72), 6);
    if (!yer) return [];
    const { g, b, x, taban } = yer, ust = taban - b, tugla = "#c9a36a";
    elips(ctx, x + 2, taban + 1, g * 0.55, 3, "rgba(0,0,0,0.3)");
    ctx.fillStyle = tugla; ctx.fillRect(x - g / 2, ust, g, b);
    ctx.strokeStyle = koyu(tugla, 0.15); ctx.lineWidth = 0.5;
    for (let y = ust + 3, k = 0; y < taban; y += 3, k++) { ctx.beginPath(); ctx.moveTo(x - g / 2, y); ctx.lineTo(x + g / 2, y); ctx.stroke(); for (let xx = x - g / 2 + (k % 2) * 3; xx < x + g / 2; xx += 6) { ctx.beginPath(); ctx.moveTo(xx, y - 3); ctx.lineTo(xx, y); ctx.stroke(); } }
    ctx.fillStyle = koyu(tugla, 0.25); ctx.fillRect(x - g / 2, ust, g, 2.5);
    const kat = ust + b * 0.5;
    for (let i = 0; i < n; i++) senasil(ctx, x - g / 2 + (g * (i + 0.5)) / n, ust + b * 0.12, g / n * 0.78, b * 0.36);
    for (let i = 0; i < n; i++) {                                                                                       // zemin kat
      const cx = x - g / 2 + (g * (i + 0.5)) / n;
      ctx.fillStyle = "#5a3418"; yuvarlak(ctx, cx - g / n * 0.12, taban - b * 0.32, g / n * 0.24, b * 0.32, 2); ctx.fill();
      for (let j = 0; j < 6; j++) elips(ctx, cx - g / n * 0.06 + (j % 2) * g / n * 0.12, taban - b * 0.27 + Math.floor(j / 2) * b * 0.08, 0.6, 0.6, "#d4a73a");
      for (const sx of [-1, 1]) { ctx.fillStyle = "#3a2a20"; ctx.fillRect(cx + sx * g / n * 0.3 - 2.5, kat + b * 0.08, 5, b * 0.12); ctx.fillStyle = "#f1e3c4"; ctx.fillRect(cx + sx * g / n * 0.3 - 3, kat + b * 0.08 - 1, 6, 1); }
    }
    return [];
  }

  // ---------- IR: Siose Pol köprüsü ----------
  // Yeşil kıyılar arasında nehir şeridi (her yerde aynı mavi); şeridi boydan boya geçen iki katlı kemerli tuğla köprü:
  // altta suya basan büyük kemerler ve yansımaları, üstte küçük kemerli gezinti galerisi
  function sioseKopru(ctx, w, h, r, p, B) {
    const ky = h * 0.55, kh = Math.max(16, Math.min(34, h * 0.36)), tugla = p.duvar || "#c8a27a";
    yamaZemin(ctx, B, w, h, r, "#5f8a3a", "#7fa04a", 800);
    kirp(ctx, B, () => {
      ctx.fillStyle = "#cdbb94"; ctx.fillRect(0, ky - kh / 2 - 3, w, kh + 6);
      ctx.fillStyle = "#1e7fd6"; ctx.fillRect(0, ky - kh / 2, w, kh);                                                    // nehir
      const kb = Math.max(14, kh * 0.95), alt = ky + kh * 0.15, ust = alt - kb, adim = Math.max(9, kb * 0.62);
      ctx.fillStyle = "rgba(200, 162, 122, 0.35)"; ctx.fillRect(0, alt, w, kb * 0.45);                                  // yansıma
      ctx.fillStyle = tugla; ctx.fillRect(0, ust, w, kb);                                                               // köprü gövdesi
      ctx.fillStyle = koyu(tugla, 0.2); ctx.fillRect(0, ust, w, 2); ctx.fillRect(0, ust + kb * 0.42, w, 1.4);
      for (let x = adim / 2; x < w + adim; x += adim) {
        ctx.fillStyle = "#3a2a20"; ctx.beginPath(); ctx.moveTo(x - adim * 0.32, alt); ctx.lineTo(x - adim * 0.32, alt - kb * 0.3); ctx.arc(x, alt - kb * 0.3, adim * 0.32, Math.PI, 0); ctx.lineTo(x + adim * 0.32, alt); ctx.closePath(); ctx.fill();   // alt kemer
        ctx.fillStyle = "#1e7fd6"; ctx.fillRect(x - adim * 0.32, alt - kb * 0.12, adim * 0.64, kb * 0.12);
        for (const dx of [-0.25, 0.25]) { ctx.fillStyle = "#4a3428"; ctx.beginPath(); const gx = x + dx * adim, gw = adim * 0.14; ctx.moveTo(gx - gw, ust + kb * 0.4); ctx.lineTo(gx - gw, ust + kb * 0.2); ctx.arc(gx, ust + kb * 0.2, gw, Math.PI, 0); ctx.lineTo(gx + gw, ust + kb * 0.4); ctx.closePath(); ctx.fill(); }   // galeri
      }
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 0.8; for (let y = alt + 3; y < ky + kh / 2; y += 4) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 7 + y) * 0.8); ctx.stroke(); }
    }, 0, 0, -1);
    return [];
  }

  // ---------- IR: Yezd rüzgâr kuleleri ----------
  // Kerpiç avlu; düz damlı kerpiç evler ve üstlerinde dikey yarıklı, farklı boylarda rüzgâr kuleleri (badgir)
  function badgirliEv(ctx, x, taban, g, b, kule, renk) {
    const evB = b * 0.42, ust = taban - b, kg = g * 0.42;
    elips(ctx, x + 2, taban + 0.5, g * 0.6, 2.4, "rgba(0,0,0,0.28)");
    ctx.fillStyle = renk; ctx.fillRect(x - g / 2, taban - evB, g, evB);                                               // ev
    ctx.fillStyle = koyu(renk, 0.18); ctx.fillRect(x + g * 0.3, taban - evB, g * 0.2, evB);
    ctx.fillStyle = acik(renk, 0.15); ctx.fillRect(x - g / 2 - 1, taban - evB - 1.5, g + 2, 2);
    ctx.fillStyle = "#5a3a22"; yuvarlak(ctx, x - g * 0.12, taban - evB * 0.6, g * 0.18, evB * 0.6, 2); ctx.fill();
    const kx = x + kule * g * 0.18;                                                                                     // rüzgâr kulesi
    ctx.fillStyle = renk; ctx.fillRect(kx - kg / 2, ust, kg, b - evB);
    ctx.fillStyle = koyu(renk, 0.18); ctx.fillRect(kx + kg * 0.25, ust, kg * 0.25, b - evB);
    ctx.fillStyle = "#2a1e16"; const n = Math.max(2, Math.round(kg / 4.5));
    for (let i = 0; i < n; i++) ctx.fillRect(kx - kg / 2 + 1.5 + (i * (kg - 3)) / n, ust + 3, (kg - 3) / n - 1.4, (b - evB) * 0.32);
    ctx.fillStyle = acik(renk, 0.2); ctx.fillRect(kx - kg / 2 - 1, ust, kg + 2, 2);
  }
  function ruzgarKuleleri(ctx, w, h, r, p, B) {
    const kerpic = p.duvar || "#c8a27a";
    yamaZemin(ctx, B, w, h, r, karistir(kerpic, "#8a6a4a", 0.4), null);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 200; i++) elips(ctx, r() * w, r() * h, 1.5 + r() * 2, 1, "rgba(0,0,0,0.08)"); });
    const n = Math.max(1, Math.min(3, Math.floor(w / 40))), sira = enIyiYer(B, w, h, Math.min(w * 0.88, n * 36), Math.min(h * 0.86, 84), 5);
    if (!sira) return [];
    const g = sira.g / n;
    for (let i = 0; i < n; i++) badgirliEv(ctx, sira.x - sira.g / 2 + g * (i + 0.5), sira.taban - (i % 2) * 2, g * 0.9, sira.b * [1, 0.78, 0.9][i % 3], i % 2 ? -1 : 1, i % 2 ? koyu(kerpic, 0.06) : kerpic);
    return [];
  }

  // ---------- UZ: İpek Yolu kervanı ----------
  // Bozkır yolu; iple birbirine bağlı, renkli yükler (denkler, halılar) taşıyan sevimli iki hörgüçlü develer
  function baktriya(ctx, x, taban, s, renk, yuk) {
    const koyuD = koyu(renk, 0.25);
    elips(ctx, x, taban + 0.5, s * 0.9, s * 0.14, "rgba(0,0,0,0.25)");
    ctx.lineCap = "round"; ctx.lineWidth = s * 0.12;
    ctx.strokeStyle = koyuD; ctx.beginPath(); for (const bx of [-0.46, 0.3]) { ctx.moveTo(x + bx * s, taban - s * 0.9); ctx.lineTo(x + bx * s, taban); } ctx.stroke();
    ctx.strokeStyle = renk; ctx.beginPath(); for (const bx of [-0.32, 0.44]) { ctx.moveTo(x + bx * s, taban - s * 0.9); ctx.lineTo(x + bx * s, taban); } ctx.stroke();
    elips(ctx, x, taban - s * 1.05, s * 0.65, s * 0.32, renk);                                                         // gövde
    for (const dx of [-0.28, 0.2]) { elips(ctx, x + dx * s, taban - s * 1.38, s * 0.2, s * 0.22, renk); elips(ctx, x + dx * s, taban - s * 1.5, s * 0.12, s * 0.08, koyuD); }   // iki hörgüç, tüylü uç
    ctx.fillStyle = yuk[0]; yuvarlak(ctx, x - s * 0.18, taban - s * 1.48, s * 0.3, s * 0.42, s * 0.06); ctx.fill();   // denk
    ctx.fillStyle = yuk[1]; ctx.fillRect(x - s * 0.18, taban - s * 1.3, s * 0.3, s * 0.08);
    ctx.fillStyle = yuk[2]; yuvarlak(ctx, x - s * 0.55, taban - s * 1.2, s * 0.25, s * 0.3, s * 0.05); ctx.fill();
    ctx.strokeStyle = "#f1e3c4"; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(x - s * 0.55, taban - s * 1.05); ctx.lineTo(x - s * 0.3, taban - s * 1.05); ctx.stroke();
    ctx.strokeStyle = renk; ctx.lineWidth = s * 0.18; ctx.beginPath(); ctx.moveTo(x + s * 0.5, taban - s * 1.1); ctx.quadraticCurveTo(x + s * 0.72, taban - s * 1.15, x + s * 0.74, taban - s * 1.55); ctx.stroke();   // boyun
    ctx.strokeStyle = koyuD; ctx.lineWidth = s * 0.08; ctx.beginPath(); ctx.moveTo(x + s * 0.6, taban - s * 1.12); ctx.lineTo(x + s * 0.66, taban - s * 1.35); ctx.stroke();   // boyun yelesi
    const hx = x + s * 0.84, hy = taban - s * 1.6;
    elips(ctx, hx, hy, s * 0.2, s * 0.12, renk); elips(ctx, hx + s * 0.16, hy + s * 0.03, s * 0.09, s * 0.07, acik(renk, 0.1));
    elips(ctx, hx - s * 0.1, hy - s * 0.12, s * 0.05, s * 0.06, koyuD);
    elips(ctx, hx + s * 0.02, hy - s * 0.03, s * 0.04, s * 0.04, "#1f2328");
    ctx.strokeStyle = "#1f2328"; ctx.lineWidth = Math.max(0.5, s * 0.025); ctx.beginPath(); ctx.arc(hx + s * 0.16, hy + s * 0.04, s * 0.05, 0.1 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    return { x: hx + s * 0.1, y: hy + s * 0.06 };
  }
  function ipekYoluKervani(ctx, w, h, r, p, B) {
    const bozkir = "#b8a070";
    yamaZemin(ctx, B, w, h, r, bozkir, "#8a8a4a", 800);
    kirp(ctx, B, () => { ctx.fillStyle = "#cdb88a"; ctx.beginPath(); ctx.moveTo(0, h * 0.62); ctx.quadraticCurveTo(w / 2, h * 0.5, w, h * 0.66); ctx.lineTo(w, h * 0.86); ctx.quadraticCurveTo(w / 2, h * 0.72, 0, h * 0.84); ctx.closePath(); ctx.fill(); });   // yol
    const n = w > 120 ? 3 : 2, S = 20, yer = enIyiYer(B, w, h, Math.min(w * 0.92, S * (n * 1.55 + 0.4)), Math.min(h * 0.85, S * 1.75), 5);
    if (!yer) return [];
    const s = yer.g / (n * 1.55 + 0.4), renkler = ["#a8845a", "#94744e", "#b8946a"], yukler = [["#c8302a", "#e8c35a", "#2f6fb0"], ["#2f8f5a", "#f4f1ea", "#c8302a"], ["#7a3fa0", "#e8c35a", "#e07b2a"]];
    let onceki = null;
    for (let i = 0; i < n; i++) {
      const x = yer.x - yer.g / 2 + s * (0.85 + i * 1.55), bas = baktriya(ctx, x, yer.taban - (i % 2) * 1.5, s, renkler[i % 3], yukler[i % 3]);
      if (onceki) { ctx.strokeStyle = "#e3d2a2"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(onceki.x, onceki.y); ctx.quadraticCurveTo((onceki.x + x - s * 0.6) / 2, yer.taban - s * 0.9, x - s * 0.6, yer.taban - s * 1.1); ctx.stroke(); }
      onceki = bas;
    }
    return [];
  }

  // ---------- UZ: kavun pazarı ----------
  // Pazar yeri; çizgili tente direkleri, renkli işlemeli örtüler üstünde sarı, yeşil çizgili ve turuncu kavun yığınları,
  // kavun dolu tahta el arabası
  function kavun(ctx, x, y, s, tur) {
    const renk = ["#e8c84a", "#7fae4a", "#e8a23a"][tur];
    elips(ctx, x + 0.6, y + 0.8, s, s * 0.72, "rgba(0,0,0,0.25)");
    elips(ctx, x, y, s, s * 0.72, renk);
    ctx.strokeStyle = tur === 1 ? "#3f6a2a" : koyu(renk, 0.2); ctx.lineWidth = tur === 1 ? 1 : 0.4; ctx.beginPath();
    if (tur === 1) for (const f of [-0.5, 0, 0.5]) { ctx.moveTo(x + f * s, y - s * 0.65); ctx.quadraticCurveTo(x + f * s * 1.3, y, x + f * s, y + s * 0.65); }
    else for (let i = -2; i <= 2; i++) { ctx.moveTo(x + i * s * 0.35, y - s * 0.6); ctx.lineTo(x + i * s * 0.35 + s * 0.2, y + s * 0.6); ctx.moveTo(x + i * s * 0.35 + s * 0.2, y - s * 0.6); ctx.lineTo(x + i * s * 0.35, y + s * 0.6); }
    ctx.stroke();
    elips(ctx, x - s * 0.35, y - s * 0.3, s * 0.3, s * 0.15, "rgba(255,255,255,0.3)");
  }
  function kavunYigini(ctx, x, y, s, tur) {
    for (const [dx, dy] of [[-1.6, 0], [0, 0.1], [1.6, 0], [-0.8, -0.9], [0.8, -0.9], [0, -1.7]]) kavun(ctx, x + dx * s, y + dy * s, s, tur);
  }
  function kavunPazari(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#a88a62", null);
    kirp(ctx, B, () => { ctx.strokeStyle = "rgba(90, 60, 30, 0.2)"; ctx.lineWidth = 0.8; for (let y = 5, j = 0; y < h; y += 7, j++) for (let x = (j % 2) * 6; x < w; x += 12) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + 1, y + 1, 10, 5, 2); ctx.stroke(); } });
    const yer = enIyiYer(B, w, h, Math.min(w * 0.9, 120), Math.min(h * 0.82, 74), 5);
    if (!yer) return [];
    const { g, b, x, taban } = yer, ust = taban - b, s = Math.min(5.5, g / 22);
    for (const f of [-0.46, 0.46]) { ctx.fillStyle = "#6b4426"; ctx.fillRect(x + f * g - 1.2, ust + 4, 2.4, b * 0.7); }   // tente direkleri
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#f4f1ea" : p.vurgu1 || "#1f7fb0"; ctx.fillRect(x - g / 2 + (g * i) / 8, ust, g / 8 + 0.5, b * 0.14); }   // tente
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#f4f1ea" : p.vurgu1 || "#1f7fb0"; ctx.beginPath(); ctx.arc(x - g / 2 + (g * (i + 0.5)) / 8, ust + b * 0.14, g / 16, 0, Math.PI); ctx.fill(); }
    const ortuler = ["#c8302a", "#2f4fa0", "#e07b2a"];
    for (let i = 0; i < 3; i++) {                                                                                         // örtüler ve yığınlar
      const ox = x - g * 0.3 + i * g * 0.3, oy = taban - b * 0.22;
      ctx.fillStyle = ortuler[i]; ctx.fillRect(ox - g * 0.13, oy - 2, g * 0.26, b * 0.2);
      for (let k = 0; k < 3; k++) elips(ctx, ox - g * 0.08 + k * g * 0.08, oy + b * 0.08, 2, 2, "#e8c35a");
      kavunYigini(ctx, ox, oy, s, i);
    }
    const ax = x + g * 0.38, ay = taban - b * 0.6;                                                                        // el arabası
    if (b > 40) {
      ctx.fillStyle = "#8a5a2b"; ctx.fillRect(ax - g * 0.1, ay, g * 0.2, b * 0.12);
      elips(ctx, ax - g * 0.06, ay + b * 0.14, 3, 3, "#3a2a1a"); elips(ctx, ax + g * 0.06, ay + b * 0.14, 3, 3, "#3a2a1a");
      for (const [dx, t] of [[-0.06, 0], [0, 1], [0.06, 2], [-0.03, 2], [0.03, 0]]) kavun(ctx, ax + dx * g, ay - (t === 2 && dx < 0 ? 4 : 1), s * 0.8, t);
    }
    return [];
  }

  // ---------- AF: uçurtmalı tepe ----------
  // Yeşil tepe ve açık doruk; yerde ip makaraları; gökte renkli, kuyruklu uçurtmalar süzülür (canlı)
  function ucurtmaTepesi(ctx, w, h, r, p, B) {
    const canli = [];
    yamaZemin(ctx, B, w, h, r, "#5f8a3a", "#7fa04a", 600);
    kirp(ctx, B, () => {
      ctx.fillStyle = "#7fa850"; ctx.beginPath(); ctx.moveTo(-2, h * 0.7); ctx.quadraticCurveTo(w * 0.5, h * 0.36, w + 2, h * 0.72); ctx.lineTo(w + 2, h + 2); ctx.lineTo(-2, h + 2); ctx.closePath(); ctx.fill();   // tepe
      ctx.fillStyle = "#93b862"; ctx.beginPath(); ctx.moveTo(w * 0.25, h * 0.58); ctx.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.75, h * 0.58); ctx.quadraticCurveTo(w * 0.5, h * 0.54, w * 0.25, h * 0.58); ctx.fill();
      for (let i = 0; i < w * h / 500; i++) elips(ctx, r() * w, h * 0.55 + r() * h * 0.45, 0.9, 0.9, r() < 0.5 ? "#f4f1ea" : "#f2c94c");   // çiçekler
    });
    const renkler = [["#c2264b", "#f2c94c"], ["#3aa0d8", "#f4f1ea"], ["#2f8f5a", "#e07b2a"], ["#7a3fa0", "#f2c94c"]];
    const ucurtmalar = icNoktalar(B, w, h, Math.max(1, Math.min(4, Math.round(w * h / 4000))), 14, 26, r).filter((k) => k.y < h * 0.5);
    const makaralar = icNoktalar(B, w, h, ucurtmalar.length, 10, 14, r).filter((k) => k.y > h * 0.62);
    ucurtmalar.forEach((k, i) => {
      const m = makaralar[i] || { x: k.x + 10, y: Math.min(h - 10, k.y + 40) };
      ctx.fillStyle = "#8a6238"; ctx.fillRect(m.x - 2.5, m.y - 1.5, 5, 3); elips(ctx, m.x, m.y, 1.2, 2.2, "#e3d2a2");   // ip makarası
      canli.push({ tur: "ucurtma", x: k.x, y: k.y, n: r(), s: 5 + r() * 2, ax: m.x, ay: m.y, renk1: renkler[i % 4][0], renk2: renkler[i % 4][1] });
    });
    return canli;
  }

  // ---------- AF: nar bahçesi ----------
  // Sulama arklı toprak; yoğun koyu yeşil taçlı nar ağaçları ve taçlarda taçlı kırmızı narlar; yerde biri açılmış,
  // tanelerini gösteren narlar
  function nar(ctx, x, y, s, acikMi) {
    elips(ctx, x + 0.6, y + 0.8, s, s * 0.95, "rgba(0,0,0,0.25)");
    elips(ctx, x, y, s, s * 0.95, "#c2264b");
    ctx.fillStyle = "#8a1a34"; ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.85); ctx.lineTo(x - s * 0.15, y - s * 1.25); ctx.lineTo(x, y - s * 0.95); ctx.lineTo(x + s * 0.15, y - s * 1.25); ctx.lineTo(x + s * 0.3, y - s * 0.85); ctx.closePath(); ctx.fill();   // taç
    elips(ctx, x - s * 0.35, y - s * 0.3, s * 0.25, s * 0.18, "rgba(255,255,255,0.35)");
    if (acikMi) { elips(ctx, x + s * 0.15, y + s * 0.1, s * 0.6, s * 0.55, "#f4e3d0"); for (let i = 0; i < 7; i++) elips(ctx, x + s * 0.15 + Math.cos(i) * s * 0.35, y + s * 0.1 + Math.sin(i * 1.7) * s * 0.3, s * 0.12, s * 0.12, "#e0304f"); }
  }
  function narBahcesi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#7a5a3a", "#8a8a4a", 800);
    kirp(ctx, B, () => { for (let y = h * 0.5; y < h; y += 40) { ctx.fillStyle = "#5a3a22"; ctx.fillRect(0, y - 2.5, w, 5); ctx.fillStyle = "#1e7fd6"; ctx.fillRect(0, y - 1.3, w, 2.6); } });
    const n = Math.max(1, Math.min(3, Math.round(w * h / 5500)));
    const yerler = icNoktalar(B, w, h, n, 18, 40, r);
    for (const k of yerler) {
      const boy = Math.max(18, Math.min(40, ustBosluk(B, k.x, k.y) + 4)), x = k.x, taban = k.y + 6, tac = Math.min(15, boy * 0.42 + 3), ty = taban - boy + tac * 0.85;
      elips(ctx, x + 2, taban, tac * 0.95, tac * 0.3, "rgba(0,0,0,0.28)");
      ctx.strokeStyle = "#5a3a22"; ctx.lineCap = "round"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, taban); ctx.quadraticCurveTo(x + 2, (taban + ty) / 2, x, ty + 3); ctx.stroke();
      yaprakKubbe(ctx, x, ty, tac, r, ["#2f5a2a", "#3a6a2e", "#27502a"], "#1a3a1a");
      for (let i = 0; i < 6; i++) nar(ctx, x + (r() - 0.5) * tac * 1.4, ty + (r() - 0.55) * tac * 0.7, 2.2, false);
    }
    const yer = icNoktalar(B, w, h, 3, 10, 10, r).filter((k) => yerler.every((t) => Math.hypot(t.x - k.x, t.y + 3 - k.y) > 14));
    yer.forEach((k, i) => nar(ctx, k.x, k.y, 3.2, i === 0));
    return [];
  }

  Object.assign(window.ULKE_OBJELERI, {
    kirazAgaclari, fujiDagi, ejderKaniAgaclari, kuleEvler, hurmaBahcesi, filKayasi, zeytinBahcesi, hayatAgaciMozaigi,
    mudhifEvleri, senasilBalkonlar, sioseKopru, ruzgarKuleleri, ipekYoluKervani, kavunPazari, ucurtmaTepesi, narBahcesi,
  });
})();
