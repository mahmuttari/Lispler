/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: ÜLKE OBJELERİ (Asya, 3.14.0)
   Ressam imzası engel-temalari.js ile aynı: (ctx, w, h, r, p, B) -> canli[]. B "yama" ya da "kaya" biçimi; süsler
   biçimin içinde kalır, sabit çizim dikdörtgenin üst kenarından taşmaz; uzun yapılar maket boyunda (spec §5.3).
   Canlı süsler ENGEL_CANLI'ya eklenir (her karede çizilir). Math.random yok; insan, bayrak, dinî öğe, silah yok.
   Japonya (Görev 5): kiraz ağaçları ve düşen yapraklar, Fuji Dağı maketi. Arabistan, Filistin, İran ve Orta Asya
   (Görev 10): Yemen, Suudi Arabistan, Filistin, Irak, İran, Özbekistan, Afganistan. Güney ve Güneydoğu Asya (Görev 11):
   Pakistan, Hindistan, Bangladeş, Myanmar, Tayland, Malezya, Endonezya, Filipinler, Vietnam; insan yerine sevimli
   hayaletler (sevimliHayalet). Doğu Asya ve Rusya (Görev 12): Çin, Güney Kore, Rusya (Rusya K ailesindedir, objeleri
   burada).
   Yerleşim yardımcıları avrupa ve afrika dosyalarından (ULKE_OBJE_YARDIMCI; o dosyalar önce yüklenir).
   ============================================================ */
window.ULKE_OBJELERI = window.ULKE_OBJELERI || {};
(function () {
  const { doldur, cizgi, kirp, kenarNoktalari, icNoktalar, karistir, acik, koyu, elips, cimTutami, yuvarlak, gozler } = window.ENGEL;
  const ustBosluk = (B, x, y, en = 140) => { let k = 0; while (k < en && window.engelUzaklik(B, x, y - k - 2) < -2) k += 2; return k; };
  const { yamaZemin, yapiSigdir, kutuIcinde, enIyiYer, disinda, yuz, yaprakKubbe, icAralik, kumZemin, yanHurma, egrelti } = window.ULKE_OBJE_YARDIMCI;
  const { lotus, kiremitler, bambu } = window.ULKE_AILE_YARDIMCI;
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

  // =================== GÜNEY VE GÜNEYDOĞU ASYA (Görev 11) ===================
  // ---------- canlı: uyarı ışığı (kule tepesinde yanıp söner; k.renk) ----------
  Object.assign(window.ENGEL_CANLI, {
    isik(ctx, x, y, zaman, n, k) {
      const renk = (k && k.renk) || "#ff5a4a", a = 0.5 + 0.5 * Math.sin(zaman * 3.2 + n * 8), eski = ctx.globalAlpha;
      ctx.globalAlpha = eski * 0.35 * a; elips(ctx, x, y, 3.4, 3.4, renk);
      ctx.globalAlpha = eski * (0.4 + 0.6 * a); elips(ctx, x, y, 1.1, 1.1, renk);
      ctx.globalAlpha = eski;
    },
  });

  // Sevimli hayalet (insan yerine): yuvarlak baş, dalgalı etek, pembe yanaklar; şapka "konik" (hasır) ya da yok.
  // (x, taban) eteğin ucu, s boy (konik şapka 0,18 s daha yükselir); yon bakış yönü
  function sevimliHayalet(ctx, x, taban, s, { renk = "#f4f7fb", sapka = null, yon = 1, kollar = true } = {}) {
    const R = s * 0.36, ust = taban - s, alt = taban - s * 0.1, d = (2 * R) / 3;
    ctx.beginPath(); ctx.moveTo(x - R, ust + R); ctx.arc(x, ust + R, R, Math.PI, 0); ctx.lineTo(x + R, alt);
    for (let i = 0; i < 3; i++) { const xa = x + R - i * d; ctx.quadraticCurveTo(xa - d / 2, taban + s * 0.06, xa - d, alt); }
    ctx.closePath(); ctx.fillStyle = renk; ctx.fill();
    ctx.strokeStyle = "rgba(80, 100, 130, 0.5)"; ctx.lineWidth = Math.max(0.6, s * 0.03); ctx.stroke();
    elips(ctx, x - R * 0.38, ust + R * 0.5, R * 0.28, R * 0.18, "rgba(255,255,255,0.7)");                          // parıltı
    if (kollar) for (const sx of [-1, 1]) elips(ctx, x + sx * R * 0.98, ust + R * 1.55, R * 0.26, R * 0.17, renk);
    const fx = x + yon * R * 0.12, fy = ust + R * 1.02;
    for (const sx of [-1, 1]) elips(ctx, fx + sx * R * 0.5, fy + R * 0.22, R * 0.14, R * 0.09, "rgba(240, 120, 150, 0.55)");
    yuz(ctx, fx, fy, R * 0.72, false, "#2a2a3a");
    if (sapka === "konik") {
      const sy = ust + R * 0.5, sg = R * 1.45, ay = ust - R * 0.5;
      ctx.fillStyle = "#d9b86a"; ctx.beginPath(); ctx.moveTo(x - sg, sy); ctx.lineTo(x, ay); ctx.lineTo(x + sg, sy); ctx.quadraticCurveTo(x, sy + R * 0.18, x - sg, sy); ctx.fill();
      ctx.strokeStyle = "#a8873f"; ctx.lineWidth = 0.5; ctx.beginPath();
      for (const f of [0.4, 0.7]) { const yy = ay + (sy - ay) * f; ctx.moveTo(x - sg * f, yy); ctx.lineTo(x + sg * f, yy); }
      ctx.stroke();
    }
  }
  // enIyiYer gibi, ama taban en çok tabanEnCok (bir şeridin üstünde yer arar); fxler taranan yatay oranlar
  function ustteYer(B, w, h, gen, boy, tabanEnCok, pay = 3, fxler = [0.5, 0.38, 0.62, 0.3, 0.7, 0.22, 0.78]) {
    for (let k = 1; k >= 0.4; k -= 0.05) {
      const g = gen * k, b = boy * k;
      for (const fx of fxler) {
        const x = w * fx;
        for (let taban = Math.min(h - pay, tabanEnCok); taban - b > pay; taban -= 3) if (kutuIcinde(B, x, taban, g, b, pay)) return { x, taban, g, b };
      }
    }
    return null;
  }
  // Dar, uzun ahşap kayık (yandan): (x, y) küpeşte ortası, g boy
  function kayik(ctx, x, y, g, renk = "#3a2618") {
    const k = Math.max(3, g * 0.07);
    elips(ctx, x, y + k * 1.1, g * 0.5, k * 0.5, "rgba(255,255,255,0.22)");                                         // su izi
    ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x - g / 2, y - k * 0.5); ctx.quadraticCurveTo(x, y + k * 0.25, x + g / 2, y - k * 0.6);
    ctx.quadraticCurveTo(x + g * 0.3, y + k * 1.1, x, y + k * 1.15); ctx.quadraticCurveTo(x - g * 0.3, y + k * 1.1, x - g / 2, y - k * 0.5); ctx.fill();
    ctx.strokeStyle = acik(renk, 0.35); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - g * 0.46, y - k * 0.3); ctx.quadraticCurveTo(x, y + k * 0.35, x + g * 0.46, y - k * 0.38); ctx.stroke();
  }
  // Araç objelerinin yerleşimi: alt şeritte en büyük araç (oran = boy / en); üstünde yer kalırsa karşı yönde ikinci
  // araç. Uzaktaki (üstteki) önce gelir
  function aracYerleri(B, w, h, oran, tavan) {
    const gen = Math.min(w * 0.92, tavan, (h * 0.84) / oran), A = enIyiYer(B, w, h, gen, gen * oran, 5);
    if (!A) return [];
    const U = ustteYer(B, w, h, A.g * 0.86, A.b * 0.86, A.taban - A.b - 6, 5, [0.5, 0.42, 0.58, 0.34, 0.66]);
    return U && U.g > A.g * 0.55 ? [U, A] : [A];
  }
  // Araçların altında asfalt (üst aracın biraz üstünden başlar) ve şerit çizgisi; asfaltın üst kenarını döndürür
  function yolCiz(ctx, B, w, h, r, yerler, asfalt, cizgiRenk) {
    const U = yerler[0], A = yerler[yerler.length - 1], yolUst = U ? U.taban - U.b * 0.3 : h * 0.5;
    kirp(ctx, B, () => {
      ctx.fillStyle = asfalt; ctx.fillRect(0, yolUst, w, h - yolUst + 2);
      ctx.fillStyle = koyu(asfalt, 0.25); ctx.fillRect(0, yolUst, w, 1.5);
      for (let i = 0; i < w * (h - yolUst) / 300; i++) elips(ctx, r() * w, yolUst + r() * (h - yolUst), 1, 0.6, "rgba(0,0,0,0.15)");
      const cy = yerler.length > 1 ? U.taban + 4 : A ? A.taban + 5 : h * 0.75;
      ctx.fillStyle = cizgiRenk; for (let x = 4; x < w; x += 16) ctx.fillRect(x, cy - 0.8, 8, 1.6);
    });
    return yolUst;
  }

  // ---------- PK: süslü kamyonlar ----------
  // Tozlu yol; boyalı panoları, kabinin üstünde aynalı ve püsküllü taç (taj), kasanın altında çanlı zincirleri olan
  // kamyonlar (Pakistan kamyon sanatı)
  function kamyon(ctx, x, taban, g, b, renk, yon) {
    const [c0, c1, c2, c3] = renk, wr = Math.max(3, b * 0.13), L = -g / 2;
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, 0, 0.5, g * 0.52, 2.6, "rgba(0,0,0,0.3)");
    ctx.fillStyle = "#2a2a2e"; ctx.fillRect(L + g * 0.04, -wr * 1.9, g * 0.92, wr * 0.7);                           // şasi
    const kx0 = L + g * 0.02, kx1 = L + g * 0.64, ky0 = -b * 0.74, ky1 = -wr * 1.8, kw = kx1 - kx0, kh = ky1 - ky0;
    ctx.fillStyle = c0; ctx.fillRect(kx0, ky0, kw, kh);                                                               // kasa
    ctx.fillStyle = c1; ctx.fillRect(kx0, ky0, kw, kh * 0.17);
    ctx.fillStyle = c2; ctx.fillRect(kx0, ky1 - kh * 0.2, kw, kh * 0.2);
    ctx.fillStyle = c3;
    for (let xx = kx0 + 3; xx < kx1 - 2; xx += 5) { const yy = ky0 + kh * 0.085, e = kh * 0.06; ctx.beginPath(); ctx.moveTo(xx, yy - e); ctx.lineTo(xx + e, yy); ctx.lineTo(xx, yy + e); ctx.lineTo(xx - e, yy); ctx.closePath(); ctx.fill(); }   // baklavalar
    const np = Math.max(2, Math.round(kw / 16)), pw = kw / np;
    for (let i = 0; i < np; i++) {                                                                                     // boyalı panolar
      const px = kx0 + i * pw, py = ky0 + kh * 0.23, ph = kh * 0.5;
      ctx.fillStyle = "#f4f1ea"; ctx.fillRect(px + 1.2, py, pw - 2.4, ph);
      ctx.fillStyle = [c3, c1, c2][i % 3]; ctx.fillRect(px + 2, py + 0.8, pw - 4, ph - 1.6);
      const fx = px + pw / 2, fy = py + ph / 2, fr = Math.min(pw, ph) * 0.15;
      for (let a = 0; a < 5; a++) elips(ctx, fx + Math.cos(a * 1.2566) * fr, fy + Math.sin(a * 1.2566) * fr, fr * 0.72, fr * 0.72, "#f4f1ea");
      elips(ctx, fx, fy, fr * 0.6, fr * 0.6, i % 3 === 1 ? c2 : c1);
    }
    for (let xx = kx0 + 2; xx < kx1 - 1; xx += 3.2) elips(ctx, xx, ky1 - kh * 0.1, 0.75, 0.75, "#ffffff");              // ayna pulları
    const cx0 = L + g * 0.66, cx1 = L + g * 0.98, cy0 = -b * 0.64, cy1 = -wr * 1.6, ch = cy1 - cy0;
    ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(cx0, cy1); ctx.lineTo(cx0, cy0); ctx.lineTo(cx1 - g * 0.07, cy0); ctx.lineTo(cx1, cy0 + ch * 0.5); ctx.lineTo(cx1, cy1); ctx.closePath(); ctx.fill();   // kabin
    ctx.fillStyle = "#9fd0e8"; ctx.beginPath(); ctx.moveTo(cx0 + g * 0.035, cy0 + 2.5); ctx.lineTo(cx1 - g * 0.08, cy0 + 2.5); ctx.lineTo(cx1 - g * 0.025, cy0 + ch * 0.45); ctx.lineTo(cx0 + g * 0.035, cy0 + ch * 0.45); ctx.closePath(); ctx.fill();   // cam
    ctx.fillStyle = c3; ctx.fillRect(cx0 + g * 0.035, cy0 + ch * 0.55, (cx1 - cx0) * 0.5, ch * 0.32);                    // kapı panosu
    for (let i = 0; i < 3; i++) elips(ctx, cx0 + g * 0.06 + i * (cx1 - cx0) * 0.16, cy0 + ch * 0.71, 0.9, 0.9, "#f4f1ea");
    ctx.fillStyle = "#c9ccd2"; ctx.fillRect(cx1 - g * 0.04, cy1 - 1.5, g * 0.05, 3);                                      // tampon
    elips(ctx, cx1 - 0.8, cy0 + ch * 0.68, 1.4, 1.4, "#fff3b0");                                                          // far
    const tx0 = cx0 - g * 0.04, tx1 = cx1 - g * 0.035, ty = -b, th = cy0 + b, adim = (tx1 - tx0) / 5;                     // taç
    ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(tx0, cy0); ctx.lineTo(tx0, ty + th * 0.4);
    for (let i = 0; i < 5; i++) { ctx.lineTo(tx0 + (i + 0.5) * adim, ty + (i === 2 ? 0 : th * 0.16)); ctx.lineTo(tx0 + (i + 1) * adim, ty + th * 0.4); }
    ctx.lineTo(tx1, cy0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c3; ctx.fillRect(tx0 + 1.5, ty + th * 0.48, tx1 - tx0 - 3, th * 0.38);
    for (let i = 0; i < 5; i++) elips(ctx, tx0 + (i + 0.5) * adim, ty + th * 0.67, 0.9, 0.9, "#ffffff");
    for (let i = 0; i < 5; i++) elips(ctx, tx0 + (i + 0.5) * adim, ty + (i === 2 ? 1 : th * 0.16 + 1), 1, 1, c1);      // püsküller
    ctx.strokeStyle = c0; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(tx0, cy0); ctx.lineTo(tx0 - 0.5, cy0 + 4); ctx.moveTo(tx1, cy0); ctx.lineTo(tx1 + 0.5, cy0 + 4); ctx.stroke();
    ctx.strokeStyle = "#c9ccd2"; ctx.lineWidth = 0.6; ctx.beginPath();                                                     // çanlı zincir
    for (let xx = kx0 + 1; xx < cx1 - 4; xx += 6) { ctx.moveTo(xx, ky1 + 0.5); ctx.quadraticCurveTo(xx + 3, ky1 + 4, xx + 6, ky1 + 0.5); }
    ctx.stroke();
    for (let xx = kx0 + 4; xx < cx1 - 4; xx += 6) elips(ctx, xx, ky1 + 3.2, 0.9, 1.1, "#e8c35a");
    for (const wx of [L + g * 0.16, L + g * 0.4, L + g * 0.84]) { elips(ctx, wx, -wr, wr, wr, "#1f1f22"); elips(ctx, wx, -wr, wr * 0.5, wr * 0.5, "#c9ccd2"); elips(ctx, wx, -wr, wr * 0.22, wr * 0.22, c1); }   // tekerler
    ctx.restore();
  }
  function susluKamyonlar(ctx, w, h, r, p, B) {
    const yerler = aracYerleri(B, w, h, 0.68, 140), renkler = [["#e04a8a", "#2f6fb0", "#f4b400", "#3aa05a"], ["#f4b400", "#c8302a", "#2f8f5a", "#2f6fb0"]];
    yamaZemin(ctx, B, w, h, r, "#a8916c", null);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 260; i++) elips(ctx, r() * w, r() * h, 1 + r() * 2, 0.7, "rgba(90, 70, 40, 0.18)"); });
    const yolUst = yolCiz(ctx, B, w, h, r, yerler, "#6f6a64", "#e8e2c8");
    for (let x = 10 + r() * 6; x < w - 6; x += 18 + r() * 8) {                                                               // yol kenarı kavakları
      const boy = Math.min(42, ustBosluk(B, x, yolUst - 1) - 2);
      if (boy > 14 && uz(B, x, yolUst - 1) < -4) kavak(ctx, x, yolUst - 1, boy);
    }
    yerler.forEach((Y, i) => kamyon(ctx, Y.x, Y.taban, Y.g, Y.b, renkler[(i + 2 - yerler.length) % 2], yerler.length > 1 && i === 0 ? -1 : 1));
    return [];
  }

  // ---------- PK: Hunza kayısı bahçesi ----------
  // Arkada karlı sıradağlar; kuru taş setli yeşil taraçalar, ince uzun kavaklar ve beyaz-pembe çiçek açmış kayısı
  // ağaçları; taçlardan beyaz yapraklar dökülür (canlı)
  function kavak(ctx, x, taban, boy) {
    const cw = Math.max(3, boy * 0.12);
    elips(ctx, x + 1.5, taban, cw * 1.2, 1.6, "rgba(0,0,0,0.25)");
    ctx.fillStyle = "#6b5a44"; ctx.fillRect(x - 0.8, taban - boy * 0.25, 1.6, boy * 0.25);
    const tac = (dx, k, renk) => { ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x + dx, taban - boy); ctx.quadraticCurveTo(x + dx + cw * 1.5 * k, taban - boy * 0.45, x + dx, taban - boy * 0.14); ctx.quadraticCurveTo(x + dx - cw * 1.5 * k, taban - boy * 0.45, x + dx, taban - boy); ctx.fill(); };
    tac(0.8, 1, "#3f6a34"); tac(-0.4, 0.7, "#5f8f44");
    ctx.strokeStyle = "#86b058"; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let y = taban - boy * 0.9; y < taban - boy * 0.22; y += 3) { ctx.moveTo(x - cw * 0.4, y); ctx.lineTo(x - cw * 0.1, y - 1.5); }
    ctx.stroke();
  }
  function kayisiAgaci(ctx, x, taban, boy, r) {
    const tac = Math.min(16, boy * 0.42 + 3), ty = taban - boy + tac * 0.9;
    elips(ctx, x + 2, taban, tac * 0.9, tac * 0.3, "rgba(0,0,0,0.26)");
    ctx.strokeStyle = "#5a3e2c"; ctx.lineCap = "round"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, taban); ctx.quadraticCurveTo(x + 2, (taban + ty) / 2, x - 1, ty + 3); ctx.stroke();
    ctx.lineWidth = 1.5;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, (taban + ty) / 2); ctx.quadraticCurveTo(x + sx * 4, ty + 5, x + sx * tac * 0.75, ty); ctx.stroke(); }
    for (let i = 0; i < 8; i++) {                                                                                           // çiçek bulutları
      const a = (i / 8) * Math.PI * 2 + r() * 0.4, R = tac * (0.38 + r() * 0.18), bx = x + Math.cos(a) * tac * 0.56, by = ty + Math.sin(a) * tac * 0.38;
      elips(ctx, bx + 1, by + 1.4, R, R * 0.82, "#e5b9c4");
      elips(ctx, bx, by, R, R * 0.82, karistir("#fbe6ec", "#ffffff", r() * 0.6));
    }
    for (let i = 0; i < 14; i++) elips(ctx, x + (r() - 0.5) * tac * 1.6, ty + (r() - 0.5) * tac * 0.9, 0.7, 0.7, r() < 0.5 ? "#e07b9a" : "#7a4a3a");
    return ty;
  }
  function kayisiBahcesi(ctx, w, h, r, p, B) {
    const canli = [], dag = h * 0.34;
    yamaZemin(ctx, B, w, h, r, "#6a8a4a", "#86a85a", 700);
    kirp(ctx, B, () => {
      const tepeler = [];
      for (let x = -6; x < w + 16; x += 14 + r() * 12) tepeler.push([x, dag * (0.08 + r() * 0.42)]);
      const sira = () => {
        ctx.beginPath(); ctx.moveTo(-6, dag + 4);
        tepeler.forEach(([x, y], i) => { ctx.lineTo(x, y); if (tepeler[i + 1]) ctx.lineTo((x + tepeler[i + 1][0]) / 2, dag * 0.62); });
        ctx.lineTo(w + 16, dag + 4); ctx.closePath();
      };
      sira(); ctx.fillStyle = "#8391a8"; ctx.fill();                                                                           // sıradağ
      ctx.save(); sira(); ctx.clip(); ctx.fillStyle = "#f4f7fb";                                                               // karlı doruklar
      tepeler.forEach(([x, y], i) => {
        const xl = i ? (tepeler[i - 1][0] + x) / 2 : x - 12, xr = tepeler[i + 1] ? (x + tepeler[i + 1][0]) / 2 : x + 12, k = (dag * 0.62 - y) * 0.45;
        ctx.beginPath(); ctx.moveTo(xl, y - 2); ctx.lineTo(xr, y - 2); ctx.lineTo(xr, y + k * 0.8);
        for (let j = 1; j <= 4; j++) ctx.lineTo(xr - ((xr - xl) * j) / 4, y + k * (j % 2 ? 1.05 : 0.7));
        ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = "rgba(60, 70, 100, 0.25)"; for (const [x, y] of tepeler) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, dag * 0.62); ctx.lineTo(x + 2, dag * 0.62); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = "#5f7a52"; ctx.beginPath(); ctx.moveTo(-2, dag + 6);                                                       // ön tepe
      for (let x = -2; x <= w + 2; x += 8) ctx.lineTo(x, dag - 2 + Math.sin(x / 19) * 3);
      ctx.lineTo(w + 2, dag + 8); ctx.closePath(); ctx.fill();
      for (let y = dag + 16; y < h; y += 18) for (let x = -3; x < w + 3; x += 5) {                                            // kuru taş setler
        const yy = y + Math.sin(x / 24 + y) * 2.5, s = 2 + (Math.abs(Math.round(x * 7 + y)) % 4) * 0.3;
        elips(ctx, x + 0.5, yy + 0.7, s, s * 0.65, "rgba(0,0,0,0.22)"); elips(ctx, x, yy, s, s * 0.65, ["#a8a090", "#8f877a", "#bdb4a0"][Math.abs(Math.round(x + y)) % 3]);
      }
    });
    const yerler = [];
    for (const k of icNoktalar(B, w, h, Math.max(1, Math.min(4, Math.round(w * h / 4200))), 16, 30, r)) if (k.y > dag) yerler.push({ ...k, kavak: false });
    for (const k of icNoktalar(B, w, h, 3, 10, 18, r)) if (k.y > dag + 6 && yerler.every((t) => Math.hypot(t.x - k.x, t.y - k.y) > 16)) yerler.push({ ...k, kavak: true });
    yerler.sort((a, b) => a.y - b.y);
    for (const k of yerler) {
      const taban = k.y + 6, bos = ustBosluk(B, k.x, taban);
      if (k.kavak) { const boy = Math.min(44, bos - 2); if (boy > 14) kavak(ctx, k.x, taban, boy); continue; }
      const ty = kayisiAgaci(ctx, k.x, taban, Math.max(18, Math.min(44, bos + 4)), r);
      canli.push({ tur: "yaprak", x: k.x + (r() - 0.5) * 10, y: ty + 5, n: r(), renk: "#fdf0f3" });
    }
    return canli;
  }

  // ---------- IN: Hawa Mahal ----------
  // Pembe kumtaşı, beş katlı, piramit gibi daralan cephe: her katta küçük kubbe çatılı, kafes (jali) pencereli çıkmalar,
  // kat omuzlarında ve tepede küçük köşkler, zeminde kemerli kapı; önde taş döşeli meydan
  function kosekcik(ctx, cx, y, R, renk, beyaz) {
    ctx.fillStyle = renk; ctx.fillRect(cx - R, y - R * 0.9, R * 0.3, R * 0.9); ctx.fillRect(cx + R * 0.7, y - R * 0.9, R * 0.3, R * 0.9);
    ctx.fillStyle = beyaz; ctx.fillRect(cx - R * 1.15, y - R * 1.08, R * 2.3, R * 0.2);
    ctx.fillStyle = renk; ctx.beginPath(); ctx.ellipse(cx, y - R * 1.08, R, R * 0.78, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = koyu(renk, 0.15); ctx.beginPath(); ctx.ellipse(cx + R * 0.35, y - R * 1.08, R * 0.6, R * 0.7, 0, Math.PI * 1.5, 0); ctx.lineTo(cx + R * 0.35, y - R * 1.08); ctx.fill();
    ctx.fillStyle = beyaz; ctx.fillRect(cx - 0.4, y - R * 1.86 - 1, 0.8, 1.6);
  }
  function hawaMahal(ctx, w, h, r, p, B) {
    const pembe = "#e0907e", beyaz = "#f6ece0";
    yamaZemin(ctx, B, w, h, r, "#c9a27a", null);
    kirp(ctx, B, () => { ctx.strokeStyle = "rgba(110, 70, 40, 0.25)"; ctx.lineWidth = 0.8; for (let y = 5, j = 0; y < h; y += 7, j++) for (let x = (j % 2) * 6; x < w; x += 12) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + 1, y + 1, 10, 5, 2); ctx.stroke(); } });
    const gen = Math.min(w * 0.92, 170, (h * 0.9) / 0.8), yer = enIyiYer(B, w, h, gen, gen * 0.8, 5);
    if (!yer) return [];
    const { g, b, x, taban } = yer, kh = b / 5.9, oran = [1, 0.94, 0.8, 0.6, 0.36];
    elips(ctx, x + 2, taban + 1, g * 0.55, 3, "rgba(0,0,0,0.3)");
    for (let k = 0; k < 5; k++) {
      const gw = g * oran[k], y1 = taban - k * kh, y0 = y1 - kh, nb = Math.max(1, Math.round(gw / 9)), bw = gw / nb;
      if (k > 0) { const omuz = (g * oran[k - 1] - gw) / 2; if (omuz > 5) for (const sx of [-1, 1]) kosekcik(ctx, x + sx * (gw / 2 + omuz / 2), y1, Math.min(omuz * 0.4, kh * 0.45), pembe, beyaz); }
      ctx.fillStyle = koyu(pembe, 0.06); ctx.fillRect(x - gw / 2, y0, gw, kh);
      for (let i = 0; i < nb; i++) {
        const bx = x - gw / 2 + bw * (i + 0.5), ow = bw * 0.8, oy = y0 + kh * 0.3, oh = kh * 0.62;
        if (k === 0 && nb >= 3 && i === Math.floor(nb / 2)) {                                                                  // kemerli kapı
          ctx.fillStyle = beyaz; ctx.beginPath(); ctx.moveTo(bx - ow * 0.45, y1); ctx.lineTo(bx - ow * 0.45, y0 + kh * 0.45); ctx.arc(bx, y0 + kh * 0.45, ow * 0.45, Math.PI, 0); ctx.lineTo(bx + ow * 0.45, y1); ctx.fill();
          ctx.fillStyle = "#5a2a2a"; ctx.beginPath(); ctx.moveTo(bx - ow * 0.34, y1); ctx.lineTo(bx - ow * 0.34, y0 + kh * 0.5); ctx.arc(bx, y0 + kh * 0.5, ow * 0.34, Math.PI, 0); ctx.lineTo(bx + ow * 0.34, y1); ctx.fill();
          continue;
        }
        ctx.fillStyle = pembe; ctx.fillRect(bx - ow / 2, oy, ow, oh);                                                         // çıkma
        ctx.fillStyle = acik(pembe, 0.18); ctx.fillRect(bx - ow / 2, oy, ow * 0.22, oh);
        ctx.fillStyle = koyu(pembe, 0.12); ctx.beginPath(); ctx.ellipse(bx, oy, ow / 2 + 0.6, kh * 0.2, 0, Math.PI, 0); ctx.fill();   // kubbe çatı
        elips(ctx, bx, oy - kh * 0.22, 0.6, 0.9, beyaz);
        const jw = ow * 0.3, jy = oy + oh * 0.3;                                                                              // jali pencere
        ctx.fillStyle = "#7a3a34"; ctx.beginPath(); ctx.moveTo(bx - jw, oy + oh * 0.88); ctx.lineTo(bx - jw, jy + jw); ctx.arc(bx, jy + jw, jw, Math.PI, 0); ctx.lineTo(bx + jw, oy + oh * 0.88); ctx.fill();
        ctx.strokeStyle = "rgba(242, 192, 160, 0.55)"; ctx.lineWidth = 0.35; ctx.beginPath();                               // kafes
        ctx.moveTo(bx, jy); ctx.lineTo(bx, oy + oh * 0.88); for (let yy = jy + jw * 0.8; yy < oy + oh * 0.88; yy += 1.4) { ctx.moveTo(bx - jw, yy); ctx.lineTo(bx + jw, yy); }
        ctx.stroke();
        ctx.strokeStyle = beyaz; ctx.lineWidth = 0.45; ctx.strokeRect(bx - ow / 2, oy, ow, oh);
      }
      ctx.fillStyle = beyaz; ctx.fillRect(x - gw / 2, y0, gw, 1); ctx.fillRect(x - gw / 2, y1 - 0.8, gw, 0.8);
    }
    const gt = g * oran[4], yt = taban - 5 * kh;                                                                               // tepe köşkleri
    for (let i = 0; i < 3; i++) kosekcik(ctx, x - gt / 2 + (gt * (i + 0.5)) / 3, yt, gt / 7, pembe, beyaz);
    return [];
  }

  // ---------- IN: lotus göleti ve tavus kuşları ----------
  // Çimenli bahçede taş kenarlı gölet (her yerde aynı mavi): lotus yaprakları ve pembe çiçekler; kıyıda kuyruğunu
  // yelpaze gibi açmış bir tavus kuşu ve kuyruğu yerde sürünen ikincisi
  function tavusKusu(ctx, x, taban, s, yon, acikKuyruk) {
    const mavi = "#1f5fb0";
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, 0, 0.5, s * 0.5, s * 0.08, "rgba(0,0,0,0.25)");
    const goz = (gx, gy, k) => { elips(ctx, gx, gy, k, k * 1.2, "#d4b44a"); elips(ctx, gx, gy, k * 0.62, k * 0.75, "#1f4fa0"); elips(ctx, gx, gy + k * 0.1, k * 0.28, k * 0.32, "#14243a"); };
    if (acikKuyruk) {
      const fx = -s * 0.12, fy = -s * 0.5, R = s * 1.05;
      ctx.fillStyle = "#24704a"; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.arc(fx, fy, R, Math.PI * 0.98, Math.PI * 2.02); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#3fa060"; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let a = Math.PI * 1.02; a < Math.PI * 2; a += 0.12) { ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(a) * R, fy + Math.sin(a) * R); }
      ctx.stroke();
      for (const [f, k] of [[0.88, s * 0.085], [0.64, s * 0.07], [0.4, s * 0.055]]) for (let a = Math.PI * 1.06; a < Math.PI * 1.96; a += 0.17 / f) goz(fx + Math.cos(a) * R * f, fy + Math.sin(a) * R * f, k);
    } else {
      ctx.fillStyle = "#2f8f5a"; ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.5); ctx.quadraticCurveTo(-s * 0.9, -s * 0.35, -s * 1.35, -s * 0.06);
      ctx.lineTo(-s * 1.3, 0); ctx.quadraticCurveTo(-s * 0.7, -s * 0.12, -s * 0.05, -s * 0.32); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 4; i++) goz(-s * (0.45 + i * 0.24), -s * (0.3 - i * 0.065), s * 0.05);
    }
    ctx.strokeStyle = "#9a8a6a"; ctx.lineWidth = Math.max(0.7, s * 0.04); ctx.lineCap = "round"; ctx.beginPath();          // bacaklar
    for (const bx of [-0.05, 0.08]) { ctx.moveTo(bx * s, -s * 0.32); ctx.lineTo(bx * s + s * 0.02, 0); }
    ctx.stroke();
    elips(ctx, 0, -s * 0.45, s * 0.28, s * 0.2, mavi);                                                                        // gövde
    elips(ctx, -s * 0.08, -s * 0.44, s * 0.18, s * 0.12, "#8a7a5a");                                                         // kanat
    ctx.strokeStyle = mavi; ctx.lineWidth = s * 0.13; ctx.beginPath(); ctx.moveTo(s * 0.15, -s * 0.52); ctx.quadraticCurveTo(s * 0.26, -s * 0.72, s * 0.22, -s * 0.92); ctx.stroke();   // boyun
    elips(ctx, s * 0.24, -s * 0.97, s * 0.1, s * 0.09, mavi);
    elips(ctx, s * 0.27, -s * 0.99, s * 0.045, s * 0.03, "#ffffff"); elips(ctx, s * 0.275, -s * 0.99, s * 0.02, s * 0.02, "#14243a");
    ctx.fillStyle = "#c9b48a"; ctx.beginPath(); ctx.moveTo(s * 0.32, -s * 0.995); ctx.lineTo(s * 0.4, -s * 0.96); ctx.lineTo(s * 0.32, -s * 0.94); ctx.fill();   // gaga
    ctx.strokeStyle = mavi; ctx.lineWidth = Math.max(0.4, s * 0.02); ctx.beginPath();                                         // tepelik
    for (const a of [-0.5, -0.2, 0.1]) { ctx.moveTo(s * 0.22, -s * 1.04); ctx.lineTo(s * (0.22 + a * 0.12), -s * 1.2); }
    ctx.stroke();
    for (const a of [-0.5, -0.2, 0.1]) elips(ctx, s * (0.22 + a * 0.12), -s * 1.21, s * 0.025, s * 0.025, "#2f8fd0");
    ctx.restore();
  }
  function lotusGoleti(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#4f7a3a", "#6f9a4a", 600);
    const gx = w / 2, gy = h * 0.68, grx = w * 0.42, gry = h * 0.22;
    kirp(ctx, B, () => {
      elips(ctx, gx, gy, grx + 3.5, gry + 3.5, "#cdb88a");                                                                     // taş kenar
      for (let a = 0; a < Math.PI * 2; a += 0.22) elips(ctx, gx + Math.cos(a) * (grx + 1.8), gy + Math.sin(a) * (gry + 1.8), 2, 1.4, "#b5a074");
      elips(ctx, gx, gy, grx, gry, "#1e7fd6");
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 0.8;
      for (let y = gy - gry + 4; y < gy + gry; y += 5) {
        const yy = (y - gy) / gry, yar = grx * Math.sqrt(Math.max(0, 1 - yy * yy)) - 4;
        if (yar > 4) { ctx.beginPath(); for (let x = gx - yar; x <= gx + yar; x += 5) ctx.lineTo(x, y + Math.sin(x / 7 + y) * 0.8); ctx.stroke(); }
      }
    });
    const n = Math.max(2, Math.round((grx * gry) / 160));
    for (let d = 0, kondu = 0; d < n * 12 && kondu < n; d++) {                                                                // lotuslar
      const a = r() * Math.PI * 2, f = Math.sqrt(r()) * 0.78, px = gx + Math.cos(a) * grx * f, py = gy + Math.sin(a) * gry * f, s = 4 + r() * 2.5, cicekli = r() < 0.55;
      if (uz(B, px, py) < -s - 2) { lotus(ctx, px, py, s, cicekli); kondu++; }
    }
    const genA = Math.min(w * 0.6, 78), A = ustteYer(B, w, h, genA, genA * 0.68, gy - gry - 2, 4) || ustteYer(B, w, h, genA, genA * 0.68, gy - gry * 0.2, 4);
    if (A) {
      const s = A.g / 2.4;
      tavusKusu(ctx, A.x + s * 0.12, A.taban, s, 1, true);
      const genB = Math.min(w * 0.34, 52), sag = A.x <= w / 2;
      const Bk = w > 110 && ustteYer(B, w, h, genB, genB * 0.7, gy - gry * 0.4, 4, sag ? [0.8, 0.74, 0.86] : [0.2, 0.26, 0.14]);
      if (Bk && Math.abs(Bk.x - A.x) > (A.g + Bk.g) * 0.45) { const s2 = Bk.g / 1.8; tavusKusu(ctx, Bk.x + (sag ? -1 : 1) * s2 * 0.475, Bk.taban, s2, sag ? -1 : 1, false); }
    }
    return [];
  }

  // ---------- BD: süslü rikşalar ----------
  // Balıksırtı tuğla döşeli sokak; renkli şeritli körüklü tenteleri, püsküllü gidonları ve arkasında boyalı teneke panosu
  // olan bisiklet rikşaları (Bangladeş rikşa sanatı)
  function riksa(ctx, x, taban, g, b, renk, yon) {
    const [c0, c1, c2] = renk, R = b * 0.22, L = -g / 2, ax = L + g * 0.27, fx = L + g * 0.86;
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, 0, 0.5, g * 0.5, 2.4, "rgba(0,0,0,0.28)");
    const sx0 = L + g * 0.06, sx1 = L + g * 0.5, sy = -b * 0.48;
    ctx.fillStyle = "#f4f1ea"; ctx.fillRect(L + g * 0.01, sy + b * 0.14, g * 0.17, b * 0.2);                              // arka pano
    ctx.fillStyle = c1; ctx.fillRect(L + g * 0.02, sy + b * 0.15, g * 0.15, b * 0.18);
    elips(ctx, L + g * 0.095, sy + b * 0.24, g * 0.035, b * 0.05, "#f4f1ea"); elips(ctx, L + g * 0.095, sy + b * 0.24, g * 0.015, b * 0.02, c0);
    for (const dx of [-0.045, 0.045]) elips(ctx, L + g * (0.095 + dx), sy + b * 0.28, g * 0.02, b * 0.03, "#3aa05a");
    const teker = (cx, rr) => {
      ctx.strokeStyle = "#1f1f22"; ctx.lineWidth = Math.max(1.2, rr * 0.16); ctx.beginPath(); ctx.arc(cx, -rr, rr * 0.92, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "#b9bcc4"; ctx.lineWidth = 0.4; ctx.beginPath();
      for (let a = 0; a < Math.PI; a += Math.PI / 6) { ctx.moveTo(cx + Math.cos(a) * rr * 0.85, -rr + Math.sin(a) * rr * 0.85); ctx.lineTo(cx - Math.cos(a) * rr * 0.85, -rr - Math.sin(a) * rr * 0.85); }
      ctx.stroke(); elips(ctx, cx, -rr, rr * 0.16, rr * 0.16, c1);
    };
    teker(ax, R);
    ctx.strokeStyle = "#3a3a40"; ctx.lineWidth = Math.max(1, b * 0.03); ctx.lineCap = "round"; ctx.beginPath();             // kadro
    ctx.moveTo(ax, -R); ctx.lineTo(fx - g * 0.2, -b * 0.4); ctx.lineTo(fx - g * 0.04, -b * 0.6); ctx.lineTo(fx, -R * 0.75);
    ctx.moveTo(fx - g * 0.2, -b * 0.4); ctx.lineTo(fx - g * 0.3, -b * 0.5); ctx.moveTo(fx - g * 0.09, -b * 0.63); ctx.lineTo(fx + g * 0.02, -b * 0.61);
    ctx.stroke();
    elips(ctx, fx - g * 0.3, -b * 0.51, g * 0.045, b * 0.025, "#2a1a10");                                                     // sele
    for (const [dx, rr] of [[-0.09, c0], [0.02, c2]]) { ctx.strokeStyle = rr; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(fx + g * dx, -b * 0.62); ctx.lineTo(fx + g * dx, -b * 0.53); ctx.stroke(); elips(ctx, fx + g * dx, -b * 0.52, 1, 1.2, rr); }   // püsküller
    teker(fx, R * 0.8);
    ctx.fillStyle = c0; ctx.fillRect(sx0, sy, sx1 - sx0, b * 0.14);                                                           // oturak
    ctx.fillStyle = c2; for (let xx = sx0 + 2; xx < sx1 - 1; xx += 4) ctx.fillRect(xx, sy + b * 0.05, 2, b * 0.04);
    ctx.fillStyle = "#c8302a"; yuvarlak(ctx, sx0 + g * 0.06, sy - b * 0.07, sx1 - sx0 - g * 0.06, b * 0.08, 2); ctx.fill();   // minder
    ctx.fillStyle = "#6b4426"; ctx.fillRect(sx1 - g * 0.02, sy + b * 0.14, g * 0.1, b * 0.03);                                  // ayaklık
    const Rh = b * 0.52, tx = sx0 + Rh * 0.9;                                                                                  // körüklü tente: oturağın
    const tente = () => { ctx.beginPath(); ctx.moveTo(tx, sy); ctx.arc(tx, sy, Rh, Math.PI, Math.PI * 1.62); ctx.closePath(); };   // arkasından öne kıvrılır
    tente(); ctx.fillStyle = c2; ctx.fill();
    for (let i = 0; i < 8; i++) {                                                                                               // renkli dilimler
      const a0 = Math.PI + (i * Math.PI * 0.62) / 8;
      ctx.fillStyle = [c0, c1, "#f4f1ea", c2][i % 4]; ctx.beginPath(); ctx.moveTo(tx, sy); ctx.arc(tx, sy, Rh, a0, a0 + (Math.PI * 0.62) / 8); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = koyu(c2, 0.35); ctx.lineWidth = 0.6; ctx.beginPath();                                                    // kaburgalar
    for (let i = 1; i < 8; i++) { const a = Math.PI + (i * Math.PI * 0.62) / 8; ctx.moveTo(tx, sy); ctx.lineTo(tx + Math.cos(a) * Rh, sy + Math.sin(a) * Rh); }
    ctx.stroke();
    ctx.strokeStyle = c0; ctx.lineWidth = Math.max(1.2, b * 0.035); ctx.beginPath(); ctx.arc(tx, sy, Rh - 0.6, Math.PI, Math.PI * 1.62); ctx.stroke();
    const ux = Math.cos(Math.PI * 1.62), uy = Math.sin(Math.PI * 1.62);
    for (let t = 0.3; t <= 1.001; t += 0.14) elips(ctx, tx + ux * Rh * t, sy + uy * Rh * t + 1.2, 1, 1.3, "#f2c94c");          // saçak püskülleri
    ctx.restore();
  }
  function susluRiksalar(ctx, w, h, r, p, B) {
    const tugla = p.duvar || "#a65a3e", yerler = aracYerleri(B, w, h, 0.66, 130);
    yamaZemin(ctx, B, w, h, r, tugla, null);
    kirp(ctx, B, () => {                                                                                                         // balıksırtı tuğla
      ctx.strokeStyle = koyu(tugla, 0.3); ctx.lineWidth = 0.7; ctx.beginPath();
      for (let y = -8; y < h + 8; y += 6) for (let x = -8, j = 0; x < w + 8; x += 6, j++) { if (j % 2) { ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 6); } else { ctx.moveTo(x + 6, y); ctx.lineTo(x, y + 6); } }
      ctx.stroke();
      for (let i = 0; i < w * h / 300; i++) { const x = r() * w, y = r() * h; ctx.fillStyle = "rgba(255, 220, 190, 0.12)"; ctx.fillRect(x, y, 3, 1.5); }
    });
    const renkler = [["#2f8f5a", "#e8402a", "#7a3fa0"], ["#2f6fb0", "#f4b400", "#e04a8a"]];
    yerler.forEach((Y, i) => riksa(ctx, Y.x, Y.taban, Y.g, Y.b, renkler[(i + 2 - yerler.length) % 2], yerler.length > 1 && i === 0 ? -1 : 1));
    return [];
  }

  // ---------- BD: Sundarbans ve Bengal kaplanı ----------
  // Arkada mangrov ormanı (kazık kökler suya iner), ortada kanal (her yerde aynı mavi), önde nefes kökleri çıkan çamurlu
  // kıyı ve kıyıda oturan sevimli bir Bengal kaplanı
  function mangrov(ctx, x, taban, boy, r) {
    const kok = taban - boy * 0.28, tac = Math.min(18, boy * 0.45 + 2), ty = taban - boy + tac * 0.8;
    ctx.strokeStyle = "#5a4a3a"; ctx.lineCap = "round"; ctx.lineWidth = 1.3; ctx.beginPath();
    for (const i of [-3, -2, -1, 1, 2, 3]) { ctx.moveTo(x + i * 0.6, kok); ctx.quadraticCurveTo(x + i * boy * 0.06, kok - 2, x + i * boy * 0.07, taban); }
    ctx.stroke();
    ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x, kok); ctx.lineTo(x + 1, ty + 3); ctx.stroke();
    yaprakKubbe(ctx, x, ty, tac, r, ["#2f5a2a", "#3f6a30", "#2a5026"], "#1a3a1a");
  }
  function kaplan(ctx, x, taban, s, yon) {
    const tur = "#e8862a", kara = "#2a1a10", beyaz = "#f8efe0";
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, 0, 0.5, s * 0.55, s * 0.08, "rgba(0,0,0,0.28)");
    ctx.strokeStyle = tur; ctx.lineWidth = s * 0.08; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.1); ctx.quadraticCurveTo(-s * 0.68, -s * 0.05, -s * 0.6, -s * 0.38); ctx.stroke();   // kuyruk
    ctx.strokeStyle = kara; ctx.lineWidth = s * 0.03; ctx.beginPath(); for (const t of [0.45, 0.58]) { ctx.moveTo(-s * t, -s * 0.13); ctx.lineTo(-s * t - s * 0.03, -s * 0.04); } ctx.stroke();
    elips(ctx, -s * 0.08, -s * 0.32, s * 0.38, s * 0.3, tur);                                                                   // gövde
    elips(ctx, s * 0.08, -s * 0.26, s * 0.17, s * 0.2, beyaz);
    ctx.strokeStyle = kara; ctx.lineWidth = s * 0.035; ctx.beginPath();                                                       // çizgiler
    for (const t of [-0.36, -0.22, -0.08]) { ctx.moveTo(s * t, -s * 0.6); ctx.quadraticCurveTo(s * (t + 0.05), -s * 0.45, s * (t - 0.01), -s * 0.32); }
    ctx.stroke();
    for (const bx of [0.1, 0.25]) { ctx.fillStyle = tur; yuvarlak(ctx, s * bx - s * 0.06, -s * 0.36, s * 0.12, s * 0.36, s * 0.05); ctx.fill(); elips(ctx, s * bx, -s * 0.02, s * 0.075, s * 0.045, beyaz); }   // ön bacaklar
    const hx = s * 0.2, hy = -s * 0.72, R = s * 0.27;
    for (const sx of [-1, 1]) { elips(ctx, hx + sx * R * 0.72, hy - R * 0.78, R * 0.28, R * 0.28, tur); elips(ctx, hx + sx * R * 0.72, hy - R * 0.76, R * 0.15, R * 0.15, kara); }   // kulaklar
    elips(ctx, hx, hy, R, R * 0.92, tur);
    for (const sx of [-1, 1]) elips(ctx, hx + sx * R * 0.48, hy + R * 0.38, R * 0.42, R * 0.32, beyaz);                       // yanaklar
    ctx.strokeStyle = kara; ctx.lineWidth = s * 0.03; ctx.beginPath();
    for (const dx of [-0.25, 0, 0.25]) { ctx.moveTo(hx + dx * R, hy - R * 0.85); ctx.lineTo(hx + dx * R * 0.8, hy - R * 0.5); }
    for (const sx of [-1, 1]) { ctx.moveTo(hx + sx * R * 0.98, hy - R * 0.1); ctx.lineTo(hx + sx * R * 0.7, hy); }
    ctx.stroke();
    gozler(ctx, hx, hy - R * 0.05, R * 0.36, R * 0.13, kara);
    elips(ctx, hx - R * 0.32, hy - R * 0.11, R * 0.05, R * 0.05, "#ffffff"); elips(ctx, hx + R * 0.4, hy - R * 0.11, R * 0.05, R * 0.05, "#ffffff");
    ctx.fillStyle = "#d46a7a"; ctx.beginPath(); ctx.moveTo(hx - R * 0.12, hy + R * 0.22); ctx.lineTo(hx + R * 0.12, hy + R * 0.22); ctx.lineTo(hx, hy + R * 0.34); ctx.closePath(); ctx.fill();   // burun
    ctx.strokeStyle = kara; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.arc(hx - R * 0.1, hy + R * 0.38, R * 0.1, 0.1 * Math.PI, 0.9 * Math.PI); ctx.arc(hx + R * 0.1, hy + R * 0.38, R * 0.1, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.restore();
  }
  function sundarbans(ctx, w, h, r, p, B) {
    const camur = "#6f5f4a", s1 = h * 0.36, s2 = h * 0.58;
    yamaZemin(ctx, B, w, h, r, camur, null);
    kirp(ctx, B, () => {
      ctx.fillStyle = "#4f5a3a"; ctx.fillRect(0, 0, w, s1 + 2);                                                                 // karşı kıyı
      ctx.fillStyle = "#1e7fd6"; ctx.beginPath(); ctx.moveTo(-2, s1);                                                            // kanal
      for (let x = -2; x <= w + 2; x += 6) ctx.lineTo(x, s1 + Math.sin(x / 17) * 2);
      for (let x = w + 2; x >= -2; x -= 6) ctx.lineTo(x, s2 + Math.sin(x / 13 + 2) * 2.5);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 0.8;
      for (let y = s1 + 5; y < s2 - 3; y += 5) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 8 + y) * 0.8); ctx.stroke(); }
      for (let i = 0; i < w * h / 220; i++) { const x = r() * w, y = s2 + 3 + r() * (h - s2); elips(ctx, x, y, 1.5 + r() * 2, 0.8, "rgba(40, 30, 20, 0.25)"); }
      ctx.strokeStyle = "#5a4a38"; ctx.lineWidth = 1; ctx.beginPath();                                                           // nefes kökleri
      for (let i = 0; i < w * (h - s2) / 70; i++) { const x = r() * w, y = s2 + 6 + r() * (h - s2); ctx.moveTo(x, y); ctx.lineTo(x + 0.3, y - 2 - r() * 2.5); }
      ctx.stroke();
    });
    for (let x = 12 + r() * 6; x < w - 8; x += 22 + r() * 8) {                                                                  // mangrovlar
      const taban = s1 + 5, boy = Math.min(46, ustBosluk(B, x, taban) - 2);
      if (boy > 16 && uz(B, x, taban) < -5) mangrov(ctx, x, taban, boy, r);
    }
    const gen = Math.min(w * 0.6, 62), yer = enIyiYer(B, w, h, gen, gen * 0.92, 5);
    if (yer) { const s = yer.g / 1.2, yon = yer.x < w / 2 ? 1 : -1; kaplan(ctx, yer.x + yon * s * 0.06, yer.taban, s, yon); }
    return [];
  }

  // ---------- MM: Inle Gölü balıkçıları ----------
  // Arkada yumuşak tepeler, gölde yüzen bahçe şeritleri; dar kayığın kıçında tek "bacağı" (eteği) küreğe dolanmış,
  // konik şapkalı sevimli hayalet balıkçı ve önünde bambu çerçeveli konik ağ
  function inleSahnesi(ctx, x, taban, g, b) {
    const by = taban - b * 0.1, s = b * 0.66, hx = x - g * 0.3, R = s * 0.36;
    kayik(ctx, x, by, g);
    sevimliHayalet(ctx, hx, by - b * 0.02, s, { sapka: "konik", yon: 1 });
    const ux = hx + R * 0.98, uy = by - s * 0.45, kx = hx - g * 0.17, ky = taban - b * 0.03;                                 // kürek: elde tutulur,
    ctx.strokeStyle = "#8a6238"; ctx.lineWidth = Math.max(1.2, g * 0.013); ctx.lineCap = "round";                           // eteğin yanından suya iner
    ctx.beginPath(); ctx.moveTo(ux + 2, uy - 4); ctx.lineTo(kx, ky); ctx.stroke();
    ctx.fillStyle = "#6b4426"; ctx.beginPath(); ctx.ellipse(kx + 1, ky - b * 0.04, g * 0.018, b * 0.07, 0.6, 0, Math.PI * 2); ctx.fill();
    elips(ctx, ux, uy, R * 0.28, R * 0.2, "#f4f7fb");
    const t = 0.62, cx = ux + 2 + (kx - ux - 2) * t, cy = uy - 4 + (ky - uy + 4) * t;                                         // etek küreğe dolanır
    ctx.strokeStyle = "#f4f7fb"; ctx.lineWidth = Math.max(1.6, s * 0.1); ctx.beginPath(); ctx.moveTo(hx - R * 0.4, by - s * 0.12);
    ctx.quadraticCurveTo(cx - R * 0.5, cy + R * 0.5, cx - 1, cy + 1); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.07, s * 0.1, 0.6, -0.5 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    const nx = x + g * 0.08, nb = by - b * 0.02, ag = taban - b + 2, ng = g * 0.15;                                            // konik ağ
    ctx.fillStyle = "rgba(240, 235, 220, 0.18)"; ctx.beginPath(); ctx.moveTo(nx - ng, nb); ctx.lineTo(nx, ag); ctx.lineTo(nx + ng, nb); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.moveTo(nx - ng, nb); ctx.lineTo(nx, ag); ctx.lineTo(nx + ng, nb); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = "rgba(240, 235, 220, 0.6)"; ctx.lineWidth = 0.4; ctx.beginPath();
    for (let k = -b; k < b; k += 2.6) { ctx.moveTo(nx - ng + k, nb); ctx.lineTo(nx - ng + k + b * 0.6, ag); ctx.moveTo(nx + ng - k, nb); ctx.lineTo(nx + ng - k - b * 0.6, ag); }
    ctx.stroke(); ctx.restore();
    ctx.strokeStyle = "#c9a35a"; ctx.lineWidth = Math.max(0.8, g * 0.008); ctx.beginPath();                                   // bambu çerçeve
    ctx.moveTo(nx - ng, nb); ctx.lineTo(nx, ag); ctx.lineTo(nx + ng, nb); ctx.moveTo(nx, ag); ctx.lineTo(nx, nb);
    for (const f of [0.35, 0.7]) { const yy = ag + (nb - ag) * f; ctx.moveTo(nx - ng * f, yy); ctx.lineTo(nx + ng * f, yy); }
    ctx.stroke();
    ctx.strokeStyle = "#b08a4a"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(nx, nb, ng, ng * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
    elips(ctx, hx + s * 0.38, by - s * 0.48, s * 0.1, s * 0.07, "#f4f7fb");                                                  // ağı tutan el
  }
  function inleBalikcilari(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#1e7fd6", null);
    kirp(ctx, B, () => {
      ctx.fillStyle = "#7d93a8"; ctx.beginPath(); ctx.moveTo(-2, h * 0.3);                                                     // tepeler
      for (let x = -2; x <= w + 2; x += 6) ctx.lineTo(x, h * 0.16 + Math.sin(x / 23) * h * 0.05 + Math.sin(x / 9) * 1.5);
      ctx.lineTo(w + 2, h * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#5f7a52"; ctx.fillRect(0, h * 0.26, w, h * 0.05);
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 0.8;
      for (let y = h * 0.35; y < h; y += 6) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 8 + y) * 0.8); ctx.stroke(); }
      for (let y = h * 0.4; y < h * 0.95; y += h * 0.27) {                                                                      // yüzen bahçeler
        const x0 = r() * w * 0.4, x1 = x0 + w * (0.3 + r() * 0.3);
        ctx.fillStyle = "#4f7a3a"; ctx.fillRect(x0, y, x1 - x0, 3.5);
        for (let x = x0 + 2; x < x1 - 1; x += 3.5) elips(ctx, x, y + 0.5, 1.3, 1.3, (Math.round(x) % 7) < 2 ? "#d6453d" : "#6f9a4a");
        ctx.strokeStyle = "#a08a5a"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let x = x0 + 4; x < x1; x += 9) { ctx.moveTo(x, y + 4); ctx.lineTo(x, y - 4); } ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
      }
    });
    const gen = Math.min(w * 0.92, 150, (h * 0.84) / 0.64), yer = enIyiYer(B, w, h, gen, gen * 0.64, 6);
    if (yer) inleSahnesi(ctx, yer.x, yer.taban, yer.g, yer.b);
    return [];
  }

  // ---------- MM: Pathein şemsiyeleri ----------
  // Hasır serili avlu; kurumaya bırakılmış, kaburgaları görünen, el boyaması desenli rengârenk açık şemsiyeler
  function semsiye(ctx, x, y, R, renk, desen, egim) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(egim);
    elips(ctx, 1.5, R * 0.5, R * 0.9, R * 0.3, "rgba(0,0,0,0.22)");
    ctx.strokeStyle = "#6b4426"; ctx.lineWidth = 1.1; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, R * 0.95); ctx.stroke();   // sap
    elips(ctx, 0, R * 0.95, 1.1, 1.4, "#3a2a1a");
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; elips(ctx, Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.56, R * 0.2, R * 0.13, koyu(renk, 0.08)); }   // dalgalı kenar
    elips(ctx, 0, 0, R * 0.92, R * 0.58, renk);
    ctx.strokeStyle = koyu(renk, 0.25); ctx.lineWidth = 0.5; ctx.beginPath();                                                   // kaburgalar
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.moveTo(0, -R * 0.08); ctx.lineTo(Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.58); }
    ctx.stroke();
    if (desen === 0) for (let i = 0; i < 12; i++) { const a = (i / 12 + 1 / 24) * Math.PI * 2; elips(ctx, Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.42, R * 0.07, R * 0.05, "#f4f1ea"); }
    else if (desen === 1) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; elips(ctx, Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.19, R * 0.14, R * 0.09, i % 2 ? "#f2c94c" : "#f4f1ea"); }
    else { ctx.strokeStyle = acik(renk, 0.5); ctx.lineWidth = R * 0.1; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.7, R * 0.44, 0, 0, Math.PI * 2); ctx.stroke(); }
    elips(ctx, -R * 0.35, -R * 0.2, R * 0.28, R * 0.12, "rgba(255,255,255,0.25)");
    elips(ctx, 0, -R * 0.08, R * 0.1, R * 0.07, "#e8c35a");
    ctx.restore();
  }
  function patheinSemsiyeleri(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#c9ae7a", null);
    kirp(ctx, B, () => {                                                                                                         // hasır
      ctx.strokeStyle = "rgba(120, 90, 50, 0.28)"; ctx.lineWidth = 0.8; ctx.beginPath();
      for (let k = -h; k < w + h; k += 5) { ctx.moveTo(k, 0); ctx.lineTo(k + h, h); ctx.moveTo(k + h, 0); ctx.lineTo(k, h); }
      ctx.stroke();
    });
    const R = Math.max(9, Math.min(15, Math.min(w, h) / 6)), renkler = ["#d94f3a", "#f2a23a", "#e8c84a", "#3f8fa8", "#2f8f5a", "#c2508a", "#7a4aa0"];
    let i = 0;
    for (let y = R + 4, j = 0; y < h - R * 0.4; y += R * 1.25, j++) for (let x = R + 2 + (j % 2) * R; x < w - R; x += R * 2.1) {
      const RR = R * (0.85 + r() * 0.3), egim = (r() - 0.5) * 0.5;
      if (uz(B, x, y) > -(RR + 3) || uz(B, x, y + RR) > -3) continue;
      semsiye(ctx, x, y, RR, renkler[i % 7], i % 3, egim); i++;
    }
    if (!i) { const k = icNoktalar(B, w, h, 1, 9, 0, r)[0]; if (k) semsiye(ctx, k.x, k.y - 2, 6, renkler[0], 0, 0); }
    return [];
  }

  // ---------- TH: yüzen pazar ----------
  // Kanal kıyısında kazıklı ahşap evler; suda (her yerde aynı mavi) meyve yüklü dar kayıklar ve konik hasır şapkalı
  // sevimli hayalet satıcılar (mango, ejder meyvesi, hindistancevizi, muz)
  function meyveYigini(ctx, x, y, s, tur) {
    const yerler = [[-1.4, 0], [0, 0], [1.4, 0], [-0.7, -1], [0.7, -1], [0, -1.9]];
    for (const [dx, dy] of yerler) {
      const px = x + dx * s, py = y + dy * s;
      if (tur === 0) { elips(ctx, px, py, s * 0.75, s * 0.55, "#f2b43a"); elips(ctx, px - s * 0.2, py - s * 0.15, s * 0.25, s * 0.15, "#ffe08a"); }
      else if (tur === 1) { elips(ctx, px, py, s * 0.7, s * 0.6, "#e0457a"); ctx.fillStyle = "#6fae3a"; ctx.beginPath(); ctx.moveTo(px - s * 0.5, py - s * 0.2); ctx.lineTo(px - s * 0.9, py - s * 0.5); ctx.lineTo(px - s * 0.3, py - s * 0.45); ctx.fill(); }
      else if (tur === 2) { elips(ctx, px, py, s * 0.72, s * 0.68, "#5f9a3a"); elips(ctx, px - s * 0.2, py - s * 0.2, s * 0.2, s * 0.18, "#8fc05a"); }
      else { ctx.strokeStyle = "#f2d23a"; ctx.lineWidth = s * 0.45; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(px, py - s * 0.8, s * 0.8, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke(); }
    }
  }
  function kazikliEv(ctx, x, taban, g, b) {
    const ahsap = "#8a5a32", cati = "#a83a2a", gb = b * 0.55;
    ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 1.2; ctx.beginPath(); for (const f of [-0.4, -0.1, 0.2, 0.42]) { ctx.moveTo(x + f * g, taban - b * 0.3); ctx.lineTo(x + f * g, taban); } ctx.stroke();   // kazıklar
    ctx.fillStyle = ahsap; ctx.fillRect(x - g / 2, taban - b * 0.3 - gb, g, gb);
    ctx.strokeStyle = koyu(ahsap, 0.25); ctx.lineWidth = 0.5; ctx.beginPath(); for (let xx = x - g / 2 + 2.5; xx < x + g / 2; xx += 2.5) { ctx.moveTo(xx, taban - b * 0.3 - gb); ctx.lineTo(xx, taban - b * 0.3); } ctx.stroke();
    ctx.fillStyle = "#2a1a10"; ctx.fillRect(x - g * 0.3, taban - b * 0.3 - gb * 0.72, g * 0.22, gb * 0.4); ctx.fillRect(x + g * 0.08, taban - b * 0.3 - gb * 0.72, g * 0.22, gb * 0.4);
    ctx.fillStyle = "#6b4426"; ctx.fillRect(x - g / 2 - 1, taban - b * 0.32, g + 2, 1.8);                                      // iskele
    ctx.fillStyle = cati; ctx.beginPath(); ctx.moveTo(x - g / 2 - 2.5, taban - b * 0.3 - gb); ctx.lineTo(x, taban - b); ctx.lineTo(x + g / 2 + 2.5, taban - b * 0.3 - gb); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = koyu(cati, 0.25); ctx.lineWidth = 0.5; ctx.beginPath(); for (const f of [0.35, 0.7]) { const yy = taban - b + (b * 0.7 - gb) * f; ctx.moveTo(x - (g / 2 + 2.5) * f, yy); ctx.lineTo(x + (g / 2 + 2.5) * f, yy); } ctx.stroke();
  }
  function yuzenPazar(ctx, w, h, r, p, B) {
    const kiyi = h * 0.36;
    yamaZemin(ctx, B, w, h, r, "#1e7fd6", null);
    kirp(ctx, B, () => {
      ctx.fillStyle = "#4f6a3a"; ctx.fillRect(0, 0, w, kiyi * 0.5);
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 0.8;
      for (let y = kiyi + 4; y < h; y += 6) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 8 + y) * 0.8); ctx.stroke(); }
    });
    for (let x = 16; x < w - 10; x += 30) { const yer = yapiSigdir(B, x, kiyi, 26, kiyi * 0.9); if (yer && yer.b > 14) kazikliEv(ctx, x, kiyi, yer.g, yer.b); }
    const ara = Math.max(26, h * 0.26), satirlar = []; for (let y = kiyi + Math.max(20, h * 0.18); y < h - 6; y += ara) satirlar.push(y);
    satirlar.forEach((y, j) => {
      const [x0, x1] = icAralik(B, w, y + 2, w / 2, 4), g = Math.min(x1 - x0 - 4, 110);
      if (g < 30) return;
      const cx = (x0 + x1) / 2 + (j % 2 ? 1 : -1) * Math.max(0, (x1 - x0 - g) / 2 - 2) * 0.6, sol = j % 2 === 0;
      const hx = cx + (sol ? -1 : 1) * g * 0.3, s = Math.max(10, Math.min(26, g * 0.3, ara * 0.9, (ustBosluk(B, hx, y + 3) - 2) / 0.9));
      sevimliHayalet(ctx, hx, y + s * 0.3, s, { sapka: "konik", yon: sol ? 1 : -1 });
      kayik(ctx, cx, y, g, "#5a3418");
      const ms = Math.max(2.2, g * 0.036);
      for (let k = 0; k < 3; k++) { const mx = cx + (sol ? 1 : -1) * (g * (0.04 + k * 0.16) - g * 0.06); meyveYigini(ctx, mx, y - ms * 0.5, ms, (k + j) % 4); }
    });
    return [];
  }

  // ---------- TH: tuk-tuk ----------
  // Dükkân tenteli kaldırım ve şeritli sokak; arkası yuvarlak kabarık çatılı, saçaklı, kromlu üç tekerlekli tuk-tuklar;
  // önde dar motosiklet burnu ve direksiyonda sevimli hayalet sürücü
  function tukTukCiz(ctx, x, taban, g, b, renk, yon) {
    const [c0, c1] = renk, R = b * 0.14, L = -g / 2, krom = "#c9ccd2";
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, 0, 0.5, g * 0.5, 2.4, "rgba(0,0,0,0.3)");
    ctx.fillStyle = krom; for (const px of [0.5, 0.77]) ctx.fillRect(L + g * px - 0.8, -b * 0.9, 1.6, b * 0.42);               // çatı direkleri
    ctx.fillStyle = "#2a2a2e"; ctx.fillRect(L + g * 0.5, -R * 1.5, g * 0.38, R * 0.5);                                          // şasi
    sevimliHayalet(ctx, L + g * 0.64, -b * 0.46, b * 0.36, { yon: 1 });                                                         // sürücü
    ctx.fillStyle = c0; ctx.beginPath();                                                                                         // motosiklet burnu
    ctx.moveTo(L + g * 0.7, -R * 1.2); ctx.lineTo(L + g * 0.73, -b * 0.5); ctx.quadraticCurveTo(L + g * 0.79, -b * 0.6, L + g * 0.86, -b * 0.5);
    ctx.lineTo(L + g * 0.92, -R * 2.3); ctx.quadraticCurveTo(L + g * 0.97, -R * 2.2, L + g * 0.97, -R * 1.4); ctx.lineTo(L + g * 0.78, -R * 1.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(L + g * 0.74, -b * 0.48, g * 0.03, b * 0.2);
    elips(ctx, L + g * 0.915, -b * 0.4, g * 0.025, b * 0.04, "#fff3b0");                                                         // far
    ctx.fillStyle = c0; yuvarlak(ctx, L + g * 0.01, -b * 0.52, g * 0.56, b * 0.52 - R * 1.1, g * 0.08); ctx.fill();           // yolcu gövdesi
    ctx.fillStyle = koyu(c0, 0.18); ctx.fillRect(L + g * 0.4, -b * 0.5, g * 0.15, b * 0.5 - R * 1.3);
    ctx.fillStyle = krom; ctx.fillRect(L + g * 0.01, -b * 0.34, g * 0.56, b * 0.035);                                         // krom şerit
    for (let i = 0; i < 3; i++) elips(ctx, L + g * (0.1 + i * 0.1), -b * 0.24, g * 0.03, b * 0.035, acik(c0, 0.3));
    ctx.fillStyle = "#e8402a"; yuvarlak(ctx, L + g * 0.06, -b * 0.58, g * 0.44, b * 0.07, 2); ctx.fill();                     // minder ve sırtlık
    yuvarlak(ctx, L + g * 0.04, -b * 0.8, g * 0.05, b * 0.26, 2); ctx.fill();
    ctx.fillStyle = "rgba(170, 220, 240, 0.55)"; ctx.beginPath(); ctx.moveTo(L + g * 0.775, -b * 0.88); ctx.lineTo(L + g * 0.8, -b * 0.88); ctx.lineTo(L + g * 0.84, -b * 0.55); ctx.lineTo(L + g * 0.81, -b * 0.55); ctx.closePath(); ctx.fill();   // ön cam
    ctx.strokeStyle = "#3a3a40"; ctx.lineWidth = 1; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(L + g * 0.71, -b * 0.6); ctx.lineTo(L + g * 0.79, -b * 0.57); ctx.stroke();   // gidon
    ctx.fillStyle = c1; ctx.beginPath();                                                                                         // kabarık çatı, arkası yuvarlak
    ctx.moveTo(L + g * 0.015, -b * 0.6); ctx.quadraticCurveTo(L - g * 0.005, -b * 0.98, L + g * 0.13, -b);
    ctx.lineTo(L + g * 0.8, -b * 0.96); ctx.lineTo(L + g * 0.82, -b * 0.88); ctx.lineTo(L + g * 0.1, -b * 0.87); ctx.quadraticCurveTo(L + g * 0.05, -b * 0.84, L + g * 0.06, -b * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = koyu(c1, 0.2); ctx.fillRect(L + g * 0.12, -b * 0.95, g * 0.68, b * 0.02);
    for (let xx = L + g * 0.1; xx < L + g * 0.8; xx += 4) elips(ctx, xx + 2, -b * 0.865, 2, 1.4, "#f4f1ea");                    // saçak
    for (let xx = L + g * 0.16; xx < L + g * 0.78; xx += 6) elips(ctx, xx, -b * 0.975, 0.8, 0.8, "#e8402a");                    // süs ışıkları
    for (const [wx, rr] of [[L + g * 0.24, R], [L + g * 0.86, R * 0.9]]) { elips(ctx, wx, -rr, rr, rr, "#1f1f22"); elips(ctx, wx, -rr, rr * 0.5, rr * 0.5, krom); }
    ctx.fillStyle = c0; ctx.beginPath(); ctx.arc(L + g * 0.86, -R * 0.9, R * 1.15, Math.PI * 1.1, Math.PI * 1.9); ctx.lineTo(L + g * 0.86, -R * 0.9); ctx.closePath(); ctx.fill();   // ön çamurluk
    ctx.restore();
  }
  function tukTuk(ctx, w, h, r, p, B) {
    const yerler = aracYerleri(B, w, h, 0.7, 130);
    yamaZemin(ctx, B, w, h, r, "#b8b0a0", null);
    const yolUst = yolCiz(ctx, B, w, h, r, yerler, "#6f6a64", "#f2c94c");
    kirp(ctx, B, () => {                                                                                                         // kaldırımda dükkânlar
      const ky = yolUst - 3, dy = Math.min(ky - 2, 30);
      if (dy < 10) return;
      ctx.fillStyle = "#8f877a"; ctx.fillRect(0, ky, w, 3);
      for (let x = 0, i = 0; x < w; x += 30, i++) {
        ctx.fillStyle = ["#e8d8b8", "#d8c8e0", "#c8e0d0"][i % 3]; ctx.fillRect(x, ky - dy, 30, dy);
        ctx.fillStyle = "#3a2a20"; ctx.fillRect(x + 4, ky - dy * 0.55, 22, dy * 0.55);
        for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? "#f4f1ea" : ["#e8402a", "#2a6fd0", "#2aa36a"][i % 3]; ctx.fillRect(x + 2 + k * 4.3, ky - dy * 0.7, 4.3, dy * 0.16); }
        for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? "#f4f1ea" : ["#e8402a", "#2a6fd0", "#2aa36a"][i % 3]; ctx.beginPath(); ctx.arc(x + 4.15 + k * 4.3, ky - dy * 0.54, 2.15, 0, Math.PI); ctx.fill(); }
      }
    });
    const renkler = [["#2aa36a", "#e8402a"], ["#2a6fd0", "#f2c94c"]];
    yerler.forEach((Y, i) => tukTukCiz(ctx, Y.x, Y.taban, Y.g, Y.b, renkler[(i + 2 - yerler.length) % 2], yerler.length > 1 && i === 0 ? -1 : 1));
    return [];
  }

  // ---------- MY: Petronas İkiz Kuleleri ----------
  // Park ve meydan; basamaklı daralan, sekiz köşe yıldız planlı (dilimli parlaklık) çelik ikiz kuleler, aralarında
  // V ayaklı gökyüzü köprüsü, tepede halkalı tepelik ve sivri uç; uçlarda uyarı ışıkları yanıp söner (canlı)
  function petronasKule(ctx, x, taban, g, b) {
    const celik = "#b9c2cc", dilim = [acik(celik, 0.3), acik(celik, 0.1), celik, koyu(celik, 0.12), koyu(celik, 0.25), koyu(celik, 0.38)];
    for (const [a, z, f] of [[0, 0.62, 1], [0.62, 0.71, 0.88], [0.71, 0.78, 0.74], [0.78, 0.84, 0.6], [0.84, 0.885, 0.46]]) {
      const gw = g * f, y0 = taban - b * z, y1 = taban - b * a;
      for (let i = 0; i < 6; i++) { ctx.fillStyle = dilim[i]; ctx.fillRect(x - gw / 2 + (i * gw) / 6, y0, gw / 6 + 0.3, y1 - y0); }
      ctx.strokeStyle = "rgba(40, 60, 90, 0.3)"; ctx.lineWidth = 0.5; ctx.beginPath(); for (let y = y0 + 1.5; y < y1; y += 2.2) { ctx.moveTo(x - gw / 2, y); ctx.lineTo(x + gw / 2, y); } ctx.stroke();
      ctx.fillStyle = "#eef2f6"; ctx.fillRect(x - gw / 2 - 0.5, y0, gw + 1, 1);
    }
    const py = taban - b * 0.885;
    ctx.fillStyle = "#cfd6de"; for (let i = 0; i < 3; i++) { const rw = g * (0.32 - i * 0.07); ctx.fillRect(x - rw / 2, py - (i + 1) * b * 0.014, rw, b * 0.011); }
    elips(ctx, x, py - b * 0.05, g * 0.07, g * 0.07, "#eef2f6");
    ctx.strokeStyle = "#dde3ea"; ctx.lineWidth = Math.max(0.8, g * 0.035); ctx.beginPath(); ctx.moveTo(x, py - b * 0.05); ctx.lineTo(x, taban - b + 1); ctx.stroke();
    return { x, y: taban - b + 1.5 };
  }
  function petronasKuleleri(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#5f8a4a", "#7aa85a", 700);
    const yer = enIyiYer(B, w, h, Math.min(w * 0.7, 80), Math.min(h * 0.94, 150), 5);
    if (!yer) return [];
    const { g, b, x, taban } = yer, kg = g * 0.3, x1 = x - g * 0.33, x2 = x + g * 0.33;
    kirp(ctx, B, () => { ctx.fillStyle = "#cfc6b4"; ctx.fillRect(x - g * 0.6, taban - b * 0.05, g * 1.2, b * 0.08); ctx.fillStyle = "#1e7fd6"; ctx.fillRect(x - g * 0.45, taban + 2, g * 0.9, 3); });   // meydan, havuz
    elips(ctx, x + 3, taban, g * 0.55, 3, "rgba(0,0,0,0.3)");
    const u1 = petronasKule(ctx, x1, taban, kg, b), u2 = petronasKule(ctx, x2, taban, kg, b);
    const ky = taban - b * 0.38;                                                                                                 // gökyüzü köprüsü
    ctx.strokeStyle = "#8a96a4"; ctx.lineWidth = Math.max(0.8, g * 0.015); ctx.beginPath(); ctx.moveTo(x1 + kg * 0.4, taban - b * 0.28); ctx.lineTo(x, ky + b * 0.02); ctx.lineTo(x2 - kg * 0.4, taban - b * 0.28); ctx.stroke();
    ctx.fillStyle = "#9aa6b4"; ctx.fillRect(x1 + kg / 2, ky - b * 0.012, x2 - x1 - kg, b * 0.03);
    ctx.fillStyle = "#5a6a80"; ctx.fillRect(x1 + kg / 2, ky, x2 - x1 - kg, b * 0.008);
    ctx.fillStyle = "#e3ddd0"; ctx.fillRect(x - g * 0.5, taban - b * 0.05, g, b * 0.05);                                       // kaide
    for (const sx of [-1, 1]) { const tx = x + sx * g * 0.5; if (uz(B, tx, taban - 2) < -6) yaprakKubbe(ctx, tx, taban - 6, 6, r, ["#2f6a2a", "#3f8034", "#357a30"], "#1f4a20"); }
    for (const k of icNoktalar(B, w, h, Math.max(2, Math.min(7, Math.round(w * h / 2400))), 10, 16, r).filter(disinda(yer, 8))) {   // KLCC parkı
      elips(ctx, k.x + 1.5, k.y + 1, 5.5, 1.8, "rgba(0,0,0,0.25)"); ctx.fillStyle = "#5a4030"; ctx.fillRect(k.x - 0.7, k.y - 4, 1.4, 4);
      yaprakKubbe(ctx, k.x, k.y - 4, 5.5, r, ["#2f6a2a", "#3f8034", "#357a30"], "#1f4a20");
    }
    return [{ tur: "isik", x: u1.x, y: u1.y, n: 0.1 }, { tur: "isik", x: u2.x, y: u2.y, n: 0.6 }];
  }

  // ---------- MY: Rafflesia çiçeği ----------
  // Yağmur ormanı tabanı: yaprak döküntüsü, eğrelti otları ve sarmaşıklar; ortada beneklerle kaplı beş kızıl taç yapraklı
  // dev Rafflesia, ortasında halkalı ağız ve dikenli disk; yanında koyu tomurcuklar
  function rafflesiaCicegi(ctx, x, y, R) {
    const kizil = "#b8402e";
    elips(ctx, x + 2, y + R * 0.2, R * 1.05, R * 0.55, "rgba(0,0,0,0.3)");
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5 + 0.31;
      ctx.save(); ctx.translate(x + Math.cos(a) * R * 0.52, y + Math.sin(a) * R * 0.52 * 0.62); ctx.scale(1, 0.62); ctx.rotate(a);
      elips(ctx, 0, 0, R * 0.5, R * 0.43, koyu(kizil, 0.25));
      elips(ctx, -R * 0.03, 0, R * 0.46, R * 0.39, kizil);
      for (let j = 0; j < 9; j++) elips(ctx, -R * 0.25 + (j % 3) * R * 0.2 + ((j / 3) | 0) * R * 0.05, -R * 0.22 + ((j / 3) | 0) * R * 0.21, R * 0.055, R * 0.05, "#f1d6c0");   // benekler
      ctx.restore();
    }
    elips(ctx, x, y - R * 0.08, R * 0.44, R * 0.34, koyu(kizil, 0.2));                                                           // diyafram
    elips(ctx, x, y - R * 0.12, R * 0.4, R * 0.28, kizil);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; elips(ctx, x + Math.cos(a) * R * 0.33, y - R * 0.12 + Math.sin(a) * R * 0.22, R * 0.03, R * 0.03, "#f1d6c0"); }
    elips(ctx, x, y - R * 0.12, R * 0.25, R * 0.15, "#4a1a14");                                                                   // açıklık
    elips(ctx, x, y - R * 0.11, R * 0.21, R * 0.12, "#9a4a32");                                                                   // dikenli disk
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; elips(ctx, x + Math.cos(a) * R * 0.12, y - R * 0.11 + Math.sin(a) * R * 0.065, R * 0.02, R * 0.02, "#c98a6a"); }
    elips(ctx, x, y - R * 0.11, R * 0.03, R * 0.02, "#c98a6a");
  }
  function rafflesia(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#4a3a2a", null);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 90; i++) { const x = r() * w, y = r() * h; ctx.save(); ctx.translate(x, y); ctx.rotate(r() * Math.PI); elips(ctx, 0, 0, 2.6, 1.2, ["#6a4a2a", "#8a6a3a", "#5a4a2a", "#9a7a3a"][i % 4]); ctx.restore(); }
      ctx.strokeStyle = "#3f5a2a"; ctx.lineWidth = 1.2; ctx.beginPath();                                                        // sarmaşık
      for (let y = h * 0.15; y < h; y += h * 0.45) { ctx.moveTo(-2, y); for (let x = 0; x <= w + 2; x += 8) ctx.lineTo(x, y + Math.sin(x / 11 + y) * 4); }
      ctx.stroke();
    });
    const yer = enIyiYer(B, w, h, Math.min(w * 0.8, 100), Math.min(h * 0.72, 62), 6);
    for (const k of icNoktalar(B, w, h, Math.max(2, Math.min(6, Math.round(w * h / 2500))), 10, 18, r).filter(disinda(yer, 2))) egrelti(ctx, k.x, k.y, 8 + r() * 4);
    if (yer) {
      const R = yer.g / 2.1, cy = yer.taban - yer.b * 0.5;
      rafflesiaCicegi(ctx, yer.x, cy, R);
      for (const sx of [-1, 1]) {                                                                                               // tomurcuklar
        const tx = yer.x + sx * R * 1.25, ty = yer.taban - 3;
        if (uz(B, tx, ty) < -6) { elips(ctx, tx + 1, ty + 1, 4.5, 2, "rgba(0,0,0,0.3)"); elips(ctx, tx, ty - 3, 4, 3.6, "#5a2a1e"); elips(ctx, tx - 1, ty - 4.5, 2.4, 1.6, "#7a3a28"); }
      }
    }
    return [];
  }

  // ---------- ID: Komodo ejderleri ----------
  // Kuru, altın sarısı otlu yamaç, kayalar ve yelpaze yapraklı lontar palmiyesi; yürüyen, çatallı sarı dilini çıkaran
  // sevimli iri gözlü Komodo ejderleri
  function komodo(ctx, x, taban, s, yon) {
    const deri = "#7a7058", koyuD = "#5a5040", acikD = "#9a9070";
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, -s * 0.1, 0.5, s * 1.2, s * 0.1, "rgba(0,0,0,0.25)");
    const bacak = (bx, renk, ileri) => {
      ctx.strokeStyle = renk; ctx.lineWidth = s * 0.13; ctx.lineCap = "round"; ctx.beginPath();
      ctx.moveTo(bx, -s * 0.3); ctx.lineTo(bx + s * (ileri ? 0.14 : -0.04), -s * 0.12); ctx.lineTo(bx + s * (ileri ? 0.2 : 0.04), -s * 0.02); ctx.stroke();
      ctx.strokeStyle = "#3a3428"; ctx.lineWidth = s * 0.025; ctx.beginPath(); for (const d of [-0.04, 0, 0.04]) { ctx.moveTo(bx + s * ((ileri ? 0.2 : 0.04) + 0.04), -s * 0.01 + d * s); ctx.lineTo(bx + s * ((ileri ? 0.2 : 0.04) + 0.09), d * s * 0.5); } ctx.stroke();
    };
    bacak(-s * 0.32, koyuD, false); bacak(s * 0.3, koyuD, true);
    ctx.fillStyle = deri; ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.46); ctx.quadraticCurveTo(-s * 1.0, -s * 0.36, -s * 1.4, -s * 0.04); ctx.quadraticCurveTo(-s * 0.95, -s * 0.12, -s * 0.4, -s * 0.16); ctx.closePath(); ctx.fill();   // kuyruk
    elips(ctx, 0, -s * 0.32, s * 0.55, s * 0.2, deri);                                                                         // gövde
    elips(ctx, 0, -s * 0.2, s * 0.45, s * 0.07, acikD);
    ctx.strokeStyle = deri; ctx.lineWidth = s * 0.22; ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.36); ctx.quadraticCurveTo(s * 0.55, -s * 0.42, s * 0.68, -s * 0.42); ctx.stroke();   // boyun
    ctx.fillStyle = deri; ctx.beginPath(); ctx.ellipse(s * 0.82, -s * 0.42, s * 0.24, s * 0.12, 0.08, 0, Math.PI * 2); ctx.fill();   // baş
    elips(ctx, s * 0.84, -s * 0.36, s * 0.18, s * 0.05, acikD);
    for (let i = 0; i < 14; i++) elips(ctx, -s * 0.9 + i * s * 0.12, -s * (0.36 - Math.abs(i - 7) * 0.012) + (i % 2) * s * 0.05 - (i < 5 ? (5 - i) * s * -0.05 : 0), s * 0.03, s * 0.025, koyuD);   // pullar
    bacak(-s * 0.22, deri, false); bacak(s * 0.4, deri, true);
    elips(ctx, s * 0.78, -s * 0.48, s * 0.065, s * 0.07, "#1f1a14"); elips(ctx, s * 0.765, -s * 0.5, s * 0.022, s * 0.022, "#ffffff");   // göz
    ctx.strokeStyle = "#3a3428"; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.arc(s * 0.92, -s * 0.4, s * 0.07, 0.15 * Math.PI, 0.8 * Math.PI); ctx.stroke();   // gülümseme
    ctx.strokeStyle = "#f2c94c"; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(s * 1.05, -s * 0.4); ctx.lineTo(s * 1.15, -s * 0.39); ctx.lineTo(s * 1.2, -s * 0.42); ctx.moveTo(s * 1.15, -s * 0.39); ctx.lineTo(s * 1.2, -s * 0.36); ctx.stroke();   // dil
    ctx.restore();
  }
  function lontar(ctx, x, taban, boy) {
    elips(ctx, x + 2, taban, boy * 0.2, boy * 0.05, "rgba(0,0,0,0.25)");
    ctx.strokeStyle = "#6b5a44"; ctx.lineWidth = Math.max(1.6, boy * 0.07); ctx.beginPath(); ctx.moveTo(x, taban); ctx.lineTo(x + 1, taban - boy * 0.78); ctx.stroke();
    const tx = x + 1, ty = taban - boy * 0.8, R = boy * 0.24;
    for (let i = 0; i < 6; i++) {                                                                                               // yelpaze yapraklar
      const a = -Math.PI + (i / 5) * Math.PI, fx = tx + Math.cos(a) * R * 0.5, fy = ty + Math.sin(a) * R * 0.5 * 0.8;
      ctx.fillStyle = i % 2 ? "#5f8a3a" : "#4f7a32"; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.arc(fx, fy, R * 0.6, a - 0.7, a + 0.7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#86a85a"; ctx.lineWidth = 0.4; ctx.beginPath(); for (let k = -0.6; k <= 0.6; k += 0.2) { ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(a + k) * R * 0.6, fy + Math.sin(a + k) * R * 0.6); } ctx.stroke();
    }
  }
  function komodoEjderleri(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#b8a060", "#8a7a3a", 500);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 900; i++) { const x = r() * w, y = r() * h, s = 3 + r() * 4; elips(ctx, x + 1, y + 1, s, s * 0.6, "rgba(0,0,0,0.22)"); elips(ctx, x, y, s, s * 0.6, karistir("#9a8a72", "#c8b89a", r())); } });
    const gen = Math.min(w * 0.92, 130, (h * 0.8) / 0.25), A = enIyiYer(B, w, h, gen, gen * 0.25, 5);
    const lp = icNoktalar(B, w, h, 2, 14, 30, r).filter(disinda(A, 6)).filter((k) => !A || k.y < A.taban - A.b - 4);
    for (const k of lp) { const boy = Math.min(46, ustBosluk(B, k.x, k.y + 4) - 2); if (boy > 18) lontar(ctx, k.x, k.y + 4, boy); }
    if (!A) return [];
    const ust = h > 110 && ustteYer(B, w, h, gen * 0.8, gen * 0.2, A.taban - A.b - 6, 5, [0.4, 0.6, 0.3, 0.7]);
    if (ust) { const s2 = ust.g / 2.7; komodo(ctx, ust.x + s2 * 0.09, ust.taban, s2, -1); }
    const s = A.g / 2.7; komodo(ctx, A.x - s * 0.09, A.taban, s, 1);
    return [];
  }

  // ---------- ID: pirinç terasları ----------
  // Yamaca kıvrılarak inen basamaklı yeşil teraslar (sedde parıltısı, set gölgesi, fide sıraları), arada gökyüzünü
  // yansıtan su dolu teraslar, sırtta hindistancevizi palmiyeleri ve bir terasta sıra hâlinde yürüyen beyaz ördekler
  function pirincTeraslari(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#5f9a3a", null);
    const n = Math.max(4, Math.round(h / 15)), kx = w * (0.4 + r() * 0.2);
    const egri = (i, x) => { const u = (x - kx) / (w * 0.62); return (i * h) / n + h * 0.1 * u * u * (1.2 - i / (n * 2)) + Math.sin(x / (w * 0.3) + i * 0.9) * h * 0.02 + Math.sin(x / 13 + i) * 1.2; };
    kirp(ctx, B, () => {
      for (let i = -1; i < n + 1; i++) {
        const sulu = (i + 3) % 3 === 1, yol = (fn) => { ctx.beginPath(); for (let x = -2; x <= w + 2; x += 4) ctx.lineTo(x, fn(x)); };
        ctx.beginPath(); ctx.moveTo(-2, egri(i, -2)); for (let x = -2; x <= w + 2; x += 4) ctx.lineTo(x, egri(i, x)); for (let x = w + 2; x >= -2; x -= 4) ctx.lineTo(x, egri(i + 1, x)); ctx.closePath();
        ctx.fillStyle = sulu ? "#86b8d0" : ["#6fae3a", "#86c048", "#5f9a32"][(i + 3) % 3]; ctx.fill();
        ctx.strokeStyle = sulu ? "rgba(255,255,255,0.45)" : "#4f8a2a"; ctx.lineWidth = 0.7;
        for (let x = 3 + (i % 2) * 2; x < w; x += 4) { const y0 = egri(i, x) + 3, y1 = egri(i + 1, x) - 3; for (let y = y0; y < y1; y += 3.5) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (sulu ? 2 : 0.6), y - (sulu ? 0 : 1.6)); ctx.stroke(); } }
        ctx.strokeStyle = "#3f6a2a"; ctx.lineWidth = 2; yol((x) => egri(i + 1, x) - 1); ctx.stroke();                         // set gölgesi
        ctx.strokeStyle = "#b8d880"; ctx.lineWidth = 0.8; yol((x) => egri(i, x) + 0.8); ctx.stroke();                            // sedde
      }
    });
    for (const k of icNoktalar(B, w, h, Math.max(1, Math.min(3, Math.round(w * h / 6000))), 14, 34, r)) {
      const boy = Math.min(40, ustBosluk(B, k.x, k.y + 4) - 2), yer = boy > 18 && yapiSigdir(B, k.x + boy * 0.1, k.y + 4, boy * 0.85, boy);
      if (yer && yer.b > 18) yanHurma(ctx, k.x, k.y + 4, yer.b, ["#6a8a3a", "#4a6a2a"]);
    }
    const i0 = Math.max(1, Math.floor(n * 0.7)), x0 = w * 0.25;                                                                   // ördekler
    for (let d = 0; d < 6; d++) {
      const x = x0 + d * 6, y = (egri(i0, x) + egri(i0 + 1, x)) / 2 + 1;
      if (uz(B, x, y) > -5) continue;
      elips(ctx, x + 0.6, y + 1.2, 2.4, 0.8, "rgba(0,0,0,0.25)"); elips(ctx, x, y, 2.4, 1.5, "#f4f1ea"); elips(ctx, x + 1.8, y - 1.6, 1.1, 1.1, "#f4f1ea");
      ctx.fillStyle = "#e8902a"; ctx.beginPath(); ctx.moveTo(x + 2.7, y - 1.8); ctx.lineTo(x + 3.9, y - 1.4); ctx.lineTo(x + 2.7, y - 1.1); ctx.fill();
      elips(ctx, x + 2, y - 1.9, 0.3, 0.3, "#1f1a14");
    }
    return [];
  }

  // ---------- PH: Çikolata Tepeleri (kaya biçimi) ----------
  // Toprak ön yüz; üstte yeşil ova ve ovada sıra sıra, birbirine benzeyen kahverengi kubbe tepeler (ışıklı sol yamaç,
  // otlu doku), aralarında küçük ağaç öbekleri
  function cikolataTepeleri(ctx, w, h, r, p, B) {
    const d = B.derinlik || 0, cim = "#6a9a3f", toprak = "#6a4a2a";
    doldur(ctx, B, "rgba(0,0,0,0.38)", 2, d + 1);
    cizgi(ctx, B, koyu(toprak, 0.5), 3, 0, d);
    doldur(ctx, B, koyu(toprak, 0.1), 0, d);
    kirp(ctx, B, () => { ctx.strokeStyle = koyu(toprak, 0.35); ctx.lineWidth = 1; for (let y = 3; y < h + d; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 1); ctx.stroke(); } }, 0, d);
    cizgi(ctx, B, koyu(cim, 0.5), 3);
    doldur(ctx, B, cim);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 300; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 1.5, karistir("#8aba5a", "#000000", r() * 0.3)); });
    const R = Math.max(7, Math.min(14, Math.min(w, h) / 6.5)), H = R * 1.1, tepeler = [];
    for (let y = R * 1.3, j = 0; y < h; y += R * 1.05, j++) for (let x = R + (j % 2) * R * 0.95; x < w; x += R * 1.9) {
      const cx = x + (r() - 0.5) * R * 0.5, taban = y + (r() - 0.5) * R * 0.3, k = 0.85 + r() * 0.3;
      if ([[cx - R * k, taban], [cx + R * k, taban], [cx, taban - H * k], [cx - R * k * 0.6, taban - H * k * 0.8], [cx + R * k * 0.6, taban - H * k * 0.8]].every(([px, py]) => uz(B, px, py) < -2)) tepeler.push({ cx, taban, R: R * k, H: H * k });
      else if (uz(B, cx, taban - 2) < -4) { yaprakKubbe(ctx, cx, taban - 3, 3.2, r, ["#2f6a2a", "#3f8034", "#357a30"], "#1f4a20"); }
    }
    for (const t of tepeler) {
      const { cx, taban, R: rr, H: hh } = t, ust = taban - hh;
      elips(ctx, cx + rr * 0.2, taban, rr * 1.0, rr * 0.18, "rgba(0,0,0,0.28)");
      const yol = () => { ctx.beginPath(); ctx.moveTo(cx - rr, taban); ctx.bezierCurveTo(cx - rr, taban - hh * 0.75, cx - rr * 0.55, ust, cx, ust); ctx.bezierCurveTo(cx + rr * 0.55, ust, cx + rr, taban - hh * 0.75, cx + rr, taban); ctx.closePath(); };
      const g = ctx.createLinearGradient(cx - rr, ust, cx + rr, taban); g.addColorStop(0, "#b07a48"); g.addColorStop(0.55, "#8a5a32"); g.addColorStop(1, "#5e3c20");
      yol(); ctx.fillStyle = g; ctx.fill();
      ctx.save(); yol(); ctx.clip();
      ctx.strokeStyle = "rgba(60, 35, 15, 0.35)"; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let i = 0; i < 14; i++) { const px = cx - rr + ((i * 7) % 14 / 14) * rr * 2, py = ust + ((i * 5) % 9 / 9) * hh; ctx.moveTo(px, py); ctx.lineTo(px + 0.6, py - 1.6); }
      ctx.stroke();
      ctx.fillStyle = "rgba(110, 140, 60, 0.6)"; ctx.fillRect(cx - rr, taban - hh * 0.12, rr * 2, hh * 0.12);
      ctx.restore();
      elips(ctx, cx - rr * 0.35, ust + hh * 0.3, rr * 0.25, hh * 0.15, "rgba(255, 230, 190, 0.22)");
    }
    return [];
  }

  // ---------- PH: jeepney ----------
  // Asfalt yol; uzun gövdeli, krom süslü, yanları rengârenk boyalı, açık pencereli jeepney'ler; pencerelerden sevimli
  // hayalet yolcular bakar
  function jeepneyCiz(ctx, x, taban, g, b, renk, yon) {
    const [c0, c1, c2] = renk, R = b * 0.15, L = -g / 2, krom = "#d8dce2";
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, 0, 0.5, g * 0.52, 2.6, "rgba(0,0,0,0.3)");
    ctx.fillStyle = krom; ctx.beginPath(); ctx.moveTo(L + g * 0.02, -R * 1.2); ctx.lineTo(L + g * 0.02, -b * 0.84); ctx.lineTo(L + g * 0.72, -b * 0.84);   // gövde
    ctx.lineTo(L + g * 0.77, -b * 0.52); ctx.quadraticCurveTo(L + g * 0.88, -b * 0.5, L + g * 0.96, -b * 0.46); ctx.lineTo(L + g * 0.97, -R * 1.2); ctx.closePath(); ctx.fill();   // alçak jip kaputu
    ctx.fillStyle = "#3a3a40"; ctx.fillRect(L, -b * 0.9, g * 0.8, b * 0.06);                                                  // dam ve siperlik
    ctx.fillStyle = c1; ctx.fillRect(L + g * 0.64, -b * 0.97, g * 0.15, b * 0.08);                                             // ön tabela
    ctx.strokeStyle = "#8a8e96"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(L + g * 0.04, -b * 0.96); ctx.lineTo(L + g * 0.58, -b * 0.96); for (let xx = L + g * 0.06; xx < L + g * 0.58; xx += g * 0.1) { ctx.moveTo(xx, -b * 0.96); ctx.lineTo(xx, -b * 0.9); } ctx.stroke();   // dam korkuluğu
    const pen = [], pw = g * 0.088;
    for (let i = 0; i < 6; i++) pen.push([L + g * 0.08 + i * (pw + g * 0.012), -b * 0.79, pw, b * 0.2]);
    pen.forEach(([px, py, w2, h2], i) => {
      ctx.fillStyle = "#2a2a30"; ctx.fillRect(px, py, w2, h2);
      if (i % 2 === 1) { ctx.save(); ctx.beginPath(); ctx.rect(px, py, w2, h2); ctx.clip(); sevimliHayalet(ctx, px + w2 / 2, py + h2 * 1.5, h2 * 1.3, { kollar: false, yon: -1 }); ctx.restore(); }
    });
    ctx.fillStyle = "rgba(170, 220, 240, 0.6)"; ctx.beginPath(); ctx.moveTo(L + g * 0.71, -b * 0.82); ctx.lineTo(L + g * 0.765, -b * 0.6); ctx.lineTo(L + g * 0.72, -b * 0.6); ctx.lineTo(L + g * 0.68, -b * 0.82); ctx.closePath(); ctx.fill();   // ön cam
    ctx.fillStyle = c0; ctx.fillRect(L + g * 0.02, -b * 0.56, g * 0.76, b * 0.12);                                             // boyalı şerit
    ctx.strokeStyle = c1; ctx.lineWidth = 1; ctx.beginPath(); for (let xx = L + g * 0.03; xx < L + g * 0.77; xx += 5) { ctx.moveTo(xx, -b * 0.47); ctx.quadraticCurveTo(xx + 2.5, -b * 0.55, xx + 5, -b * 0.47); } ctx.stroke();
    ctx.fillStyle = c2; ctx.fillRect(L + g * 0.02, -b * 0.4, g * 0.96, b * 0.08);
    for (let i = 0; i < 4; i++) { const sx = L + g * (0.12 + i * 0.2), sy = -b * 0.25; ctx.fillStyle = [c1, c0, "#f4f1ea", c1][i]; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, rr = k % 2 ? b * 0.03 : b * 0.07; ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }   // yıldızlar
    ctx.fillStyle = "#eef0f4"; ctx.fillRect(L + g * 0.955, -b * 0.45, g * 0.035, b * 0.45 - R * 1.3);                          // krom ızgara
    ctx.strokeStyle = "#8a9098"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let xx = L + g * 0.96; xx < L + g * 0.99; xx += 1.6) { ctx.moveTo(xx, -b * 0.44); ctx.lineTo(xx, -R * 1.4); } ctx.stroke();
    ctx.fillStyle = krom; ctx.fillRect(L + g * 0.93, -R * 1.45, g * 0.065, R * 0.4);                                           // tampon
    elips(ctx, L + g * 0.94, -b * 0.38, g * 0.02, b * 0.045, "#fff3b0");                                                         // far
    ctx.strokeStyle = krom; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L + g * 0.88, -b * 0.49); ctx.lineTo(L + g * 0.88, -b * 0.6); ctx.moveTo(L + g * 0.84, -b * 0.56); ctx.lineTo(L + g * 0.92, -b * 0.56); ctx.stroke();   // kaput süsü
    for (const sx of [-1, 1]) elips(ctx, L + g * 0.88 + sx * g * 0.04, -b * 0.56, 1, 1, c1);
    elips(ctx, L + g * 0.79, -b * 0.62, g * 0.012, b * 0.03, "#3a3a40");                                                        // ayna
    ctx.fillStyle = "#6a6e76"; ctx.fillRect(L - g * 0.005, -R * 1.5, g * 0.06, R * 0.5);                                         // arka basamak
    for (const wx of [L + g * 0.2, L + g * 0.8]) { ctx.fillStyle = krom; ctx.beginPath(); ctx.arc(wx, -R, R * 1.25, Math.PI, 0); ctx.fill(); elips(ctx, wx, -R, R, R, "#1f1f22"); elips(ctx, wx, -R, R * 0.55, R * 0.55, krom); elips(ctx, wx, -R, R * 0.2, R * 0.2, c0); }
    ctx.restore();
  }
  function jeepney(ctx, w, h, r, p, B) {
    const yerler = aracYerleri(B, w, h, 0.46, 160);
    yamaZemin(ctx, B, w, h, r, "#b8b0a0", null);
    const yolUst = yolCiz(ctx, B, w, h, r, yerler, "#6a6660", "#f4f1ea");
    kirp(ctx, B, () => {                                                                                                         // kaldırım ve palmiye gölgeleri
      ctx.fillStyle = "#8f877a"; ctx.fillRect(0, yolUst - 3, w, 3);
      ctx.strokeStyle = "rgba(120, 110, 90, 0.35)"; ctx.lineWidth = 0.7; ctx.beginPath(); for (let x = 0; x < w; x += 10) { ctx.moveTo(x, 0); ctx.lineTo(x, yolUst - 3); } ctx.stroke();
    });
    for (let x = 14 + r() * 8; x < w - 8; x += 34 + r() * 10) {                                                            // palmiyeler: taç genişliği de sığmalı
      const boy = Math.min(40, ustBosluk(B, x, yolUst - 4) - 2), yer = boy > 16 && yapiSigdir(B, x + boy * 0.1, yolUst - 4, boy * 0.85, boy);
      if (yer && yer.b > 16) yanHurma(ctx, x, yolUst - 4, yer.b, ["#6a8a3a", "#4a6a2a"]);
    }
    const renkler = [["#2f8f5a", "#f2a23a", "#7a3fa0"], ["#c8302a", "#f2c94c", "#2f6fb0"]];
    yerler.forEach((Y, i) => jeepneyCiz(ctx, Y.x, Y.taban, Y.g, Y.b, renkler[(i + 2 - yerler.length) % 2], yerler.length > 1 && i === 0 ? -1 : 1));
    return [];
  }

  // ---------- VN: Ha Long Körfezi ----------
  // Zümrüt körfez (her yerde aynı mavi); sisli arka sıra ve yeşil tepeli, dik kireçtaşı ada kuleleri (dalga oyuğu,
  // yansıma); önde yelkenleri kaburgalı turuncu ahşap junk teknesi
  function karstKule(ctx, x, taban, g, b, renk) {
    const yol = () => {
      ctx.beginPath(); ctx.moveTo(x - g / 2, taban);
      ctx.bezierCurveTo(x - g * 0.48, taban - b * 0.62, x - g * 0.5, taban - b, x - g * 0.08, taban - b);
      ctx.bezierCurveTo(x + g * 0.3, taban - b, x + g * 0.5, taban - b * 0.8, x + g * 0.46, taban - b * 0.4);
      ctx.lineTo(x + g / 2, taban); ctx.closePath();
    };
    elips(ctx, x, taban + 1.5, g * 0.45, 1.6, "rgba(255,255,255,0.18)");                                                       // yansıma
    const gr = ctx.createLinearGradient(x - g / 2, 0, x + g / 2, 0); gr.addColorStop(0, acik(renk, 0.15)); gr.addColorStop(1, koyu(renk, 0.3));
    yol(); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); yol(); ctx.clip();
    ctx.strokeStyle = koyu(renk, 0.3); ctx.lineWidth = 0.7; ctx.beginPath(); for (const f of [-0.25, 0, 0.2, 0.35]) { ctx.moveTo(x + f * g, taban - b); ctx.lineTo(x + f * g + 1, taban); } ctx.stroke();
    const yesil = karistir("#3f7a3a", renk, 0.25);
    for (const [fx, fy, s, k] of [[-0.12, 0.98, 0.42, 0.16], [0.18, 0.92, 0.34, 0.14], [-0.34, 0.68, 0.16, 0.08], [0.36, 0.56, 0.14, 0.07], [0.05, 0.75, 0.2, 0.08]]) { elips(ctx, x + fx * g, taban - b * fy, g * s, b * k, yesil); elips(ctx, x + fx * g - g * s * 0.3, taban - b * fy - b * k * 0.3, g * s * 0.4, b * k * 0.4, acik(yesil, 0.2)); }   // bitki örtüsü
    ctx.fillStyle = "rgba(20, 30, 30, 0.45)"; ctx.fillRect(x - g / 2, taban - 2.2, g, 2.2);                                     // dalga oyuğu
    ctx.restore();
  }
  function junk(ctx, x, taban, g, b) {
    const by = taban - b * 0.12;
    kayik(ctx, x, by, g, "#6b3a1e");
    ctx.fillStyle = "#6b3a1e"; ctx.beginPath(); ctx.moveTo(x - g * 0.5, by - g * 0.035); ctx.lineTo(x - g * 0.52, by - b * 0.2); ctx.lineTo(x - g * 0.3, by - b * 0.16); ctx.lineTo(x - g * 0.3, by); ctx.closePath(); ctx.fill();   // kıç köşkü
    ctx.fillStyle = "#4a2a14"; ctx.fillRect(x - g * 0.2, by - b * 0.12, g * 0.32, b * 0.1);                                       // kamara
    ctx.fillStyle = "#f2c94c"; for (let i = 0; i < 4; i++) ctx.fillRect(x - g * 0.17 + i * g * 0.075, by - b * 0.1, g * 0.035, b * 0.05);
    for (const [mx, mh, sg] of [[-0.18, 0.86, 0.26], [0.08, 0.94, 0.3], [0.32, 0.7, 0.2]]) {                                     // direkler ve yelkenler
      const dx = x + mx * g, ust = taban - b * mh + 1, alt = by - b * 0.14;
      ctx.strokeStyle = "#3a2210"; ctx.lineWidth = Math.max(0.8, g * 0.012); ctx.beginPath(); ctx.moveTo(dx, by); ctx.lineTo(dx, ust); ctx.stroke();
      const yol = () => { ctx.beginPath(); ctx.moveTo(dx, ust + 1); ctx.quadraticCurveTo(dx + g * sg * 0.7, ust - 1, dx + g * sg, ust + (alt - ust) * 0.15); ctx.lineTo(dx + g * sg * 0.92, alt); ctx.lineTo(dx, alt); ctx.closePath(); };
      yol(); ctx.fillStyle = "#c8642e"; ctx.fill();
      ctx.save(); yol(); ctx.clip(); ctx.strokeStyle = "#7a3a18"; ctx.lineWidth = 0.7; ctx.beginPath();
      for (let y = ust + 3; y < alt; y += (alt - ust) / 6) { ctx.moveTo(dx, y); ctx.lineTo(dx + g * sg, y - 1.5); }
      ctx.stroke(); ctx.restore();
    }
  }
  function haLongKorfezi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#1e7fd6", null);
    kirp(ctx, B, () => {
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 0.8;
      for (let y = 6; y < h; y += 6) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 8 + y) * 0.8); ctx.stroke(); }
    });
    const A = enIyiYer(B, w, h, Math.min(w * 0.55, 60), Math.min(h * 0.6, 48), 5), kuleler = [];
    for (const k of icNoktalar(B, w, h, Math.max(2, Math.min(6, Math.round(w * h / 2600))), 8, 22, r)) {
      const gg = 18 + r() * 18, yer = yapiSigdir(B, k.x, k.y + 6, gg, gg * (1.05 + r() * 0.55));
      if (yer && yer.b > 14) kuleler.push({ x: k.x, taban: k.y + 6, ...yer });
    }
    kuleler.sort((a, b) => a.taban - b.taban);
    for (const k of kuleler) { const uzak = 1 - k.taban / h; karstKule(ctx, k.x, k.taban, k.g, k.b, karistir("#6f7a6a", "#a8b8c0", Math.max(0, uzak) * 0.7)); }
    for (let i = 0; i < 2; i++) elips(ctx, w * (0.3 + i * 0.4), h * (0.35 + i * 0.1), w * 0.18, 2.5, "rgba(240, 245, 250, 0.3)");   // sis
    if (A) junk(ctx, A.x, A.taban, A.g, A.b);
    return [];
  }

  // ---------- VN: Hoi An fenerleri ----------
  // Okra sarısı duvarlı, koyu ahşap kepenkli, kiremit saçaklı eski çarşı evleri; sokağın üstünde gerili iplerde sallanan,
  // ışığı titreyen rengârenk yuvarlak ipek fenerler (canlı)
  function hoiAnEvi(ctx, x, taban, g, b, renk) {
    const ust = taban - b, catiY = ust + b * 0.22;
    elips(ctx, x + 2, taban + 0.5, g * 0.55, 2, "rgba(0,0,0,0.28)");
    ctx.fillStyle = renk; ctx.fillRect(x - g / 2, catiY, g, taban - catiY);
    ctx.fillStyle = koyu(renk, 0.12); ctx.fillRect(x + g * 0.32, catiY, g * 0.18, taban - catiY);
    ctx.save(); ctx.beginPath(); ctx.rect(x - g / 2 - 2, ust, g + 4, catiY + 2 - ust); ctx.clip();                          // kiremit saçak
    kiremitler(ctx, x - g / 2 - 2, ust, x + g / 2 + 2, catiY + 2, "#8a3a2a", 3);
    ctx.restore();
    ctx.fillStyle = "#4a2a14";                                                                                                 // kepenkler ve kapı
    for (const f of [-0.28, 0.28]) ctx.fillRect(x + f * g - g * 0.1, catiY + (taban - catiY) * 0.14, g * 0.2, (taban - catiY) * 0.28);
    ctx.fillRect(x - g * 0.14, taban - (taban - catiY) * 0.42, g * 0.28, (taban - catiY) * 0.42);
    ctx.strokeStyle = "#6b4426"; ctx.lineWidth = 0.5; ctx.beginPath(); for (const f of [-0.28, 0.28]) for (let k = 1; k < 4; k++) { const yy = catiY + (taban - catiY) * (0.14 + k * 0.07); ctx.moveTo(x + f * g - g * 0.1, yy); ctx.lineTo(x + f * g + g * 0.1, yy); } ctx.stroke();
  }
  function hoiAnFenerleri(ctx, w, h, r, p, B) {
    const canli = [], sari = p.vurgu1 || "#e8b23a", renkler = ["#d6453d", "#f2c94c", "#f28c28", "#e0457a", "#8a4ab0", "#3aa05a", "#2f8fd0"];
    yamaZemin(ctx, B, w, h, r, "#a89a80", null);
    kirp(ctx, B, () => { ctx.strokeStyle = "rgba(80, 60, 40, 0.25)"; ctx.lineWidth = 0.8; for (let y = 5, j = 0; y < h; y += 7, j++) for (let x = (j % 2) * 6; x < w; x += 12) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + 1, y + 1, 10, 5, 2); ctx.stroke(); } });
    const evTaban = h * 0.46;
    for (let x = 18, i = 0; x < w - 10; x += 34, i++) { const yer = yapiSigdir(B, x, evTaban, 30, Math.min(48, evTaban * 0.9)); if (yer && yer.b > 16) hoiAnEvi(ctx, x, evTaban, yer.g, yer.b, i % 2 ? karistir(sari, "#f0d080", 0.3) : sari); }
    let sira = 0;
    for (const y of [h * 0.3, h * 0.62]) {                                                                                       // fener ipleri
      const [x0, x1] = icAralik(B, w, y, w / 2, 6);
      if (x1 - x0 < 30) continue;
      const sarkma = Math.min(8, (x1 - x0) * 0.06), ipY = (x) => y + sarkma * (1 - Math.pow((2 * (x - x0)) / (x1 - x0) - 1, 2));
      ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let x = x0; x <= x1; x += 3) ctx.lineTo(x, ipY(x)); ctx.stroke();
      for (let x = x0 + 8; x < x1 - 6; x += 13) {
        const fy = ipY(x), s = 3.2 + r() * 1;
        if (uz(B, x, fy) < -4 && uz(B, x, fy + s * 4.3) < -2) canli.push({ tur: "fener", x, y: fy, n: r(), s, renk: renkler[sira++ % renkler.length], yuvarlak: true });
      }
    }
    return canli;
  }

  // =================== DOĞU ASYA VE RUSYA (Görev 12) ===================
  // ---------- canlı: ejder dansı (sopalara takılı kumaş ejder dalgalanır; sopaları sevimli hayaletler taşır). Çapa sol alt
  // köşe (yer çizgisi); k.g boy, k.b yükseklik; hepsi çapaya göre (canliCiz yalnız x, y'yi taşır) ----------
  // ---------- canlı: duman (bacadan yükselip sönen üç bulutçuk) ----------
  Object.assign(window.ENGEL_CANLI, {
    ejderDans(ctx, x, y, zaman, n, k) {
      const g = k.g, b = k.b, s = b * 0.34, N = 10, kirmizi = "#d6302a", altin = "#f2c94c", pts = [];
      for (let i = 0; i <= N; i++) { const t = i / N; pts.push({ x: x + g * 0.08 + t * g * 0.74, y: y - b * 0.58 + Math.sin(zaman * 3 + t * 5.5 + n * 6) * b * 0.14 }); }
      for (const j of [2, 5, 8]) {                                                                                             // sopalar ve hayaletler
        const gx = pts[j].x, gy = y - Math.abs(Math.sin(zaman * 3 + j)) * 1.5;
        ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = Math.max(1, b * 0.025); ctx.beginPath(); ctx.moveTo(gx + s * 0.3, gy - s * 0.42); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        sevimliHayalet(ctx, gx, gy, s, { yon: 1 });
      }
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const yol = () => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i <= N; i++) ctx.lineTo(pts[i].x, pts[i].y); };
      ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = b * 0.28; ctx.save(); ctx.translate(0, 2); yol(); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = kirmizi; ctx.lineWidth = b * 0.26; yol(); ctx.stroke();                                                 // gövde
      ctx.strokeStyle = altin; ctx.lineWidth = b * 0.08; ctx.save(); ctx.translate(0, b * 0.07); yol(); ctx.stroke(); ctx.restore();   // altın karın
      for (let i = 0; i < N; i++) {                                                                                            // pullar ve saçak
        const px = (pts[i].x + pts[i + 1].x) / 2, py = (pts[i].y + pts[i + 1].y) / 2;
        ctx.strokeStyle = "#f8e08a"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(px, py - b * 0.04, b * 0.045, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ctx.fillStyle = "#3aa05a"; ctx.beginPath(); ctx.moveTo(px - b * 0.04, py - b * 0.12); ctx.lineTo(px, py - b * 0.2); ctx.lineTo(px + b * 0.04, py - b * 0.12); ctx.fill();   // sırt yeleleri
      }
      const t0 = pts[0]; ctx.fillStyle = altin; ctx.beginPath(); ctx.moveTo(t0.x, t0.y - b * 0.08); ctx.lineTo(t0.x - b * 0.12, t0.y - b * 0.14); ctx.lineTo(t0.x - b * 0.08, t0.y); ctx.lineTo(t0.x - b * 0.12, t0.y + b * 0.12); ctx.closePath(); ctx.fill();   // kuyruk
      const h0 = pts[N], R = b * 0.19;                                                                                         // baş
      ctx.strokeStyle = altin; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(h0.x + R * 0.9, h0.y + R * 0.2); ctx.quadraticCurveTo(h0.x + R * 1.5, h0.y + R * 0.1, h0.x + R * 1.4, h0.y - R * 0.6);   // bıyıklar
      ctx.moveTo(h0.x + R * 0.9, h0.y + R * 0.35); ctx.quadraticCurveTo(h0.x + R * 1.4, h0.y + R * 0.8, h0.x + R * 1.1, h0.y + R * 1.1); ctx.stroke();
      for (const sx of [-0.35, 0.15]) { ctx.fillStyle = "#f8e08a"; ctx.beginPath(); ctx.moveTo(h0.x + sx * R, h0.y - R * 0.8); ctx.lineTo(h0.x + sx * R - R * 0.3, h0.y - R * 1.6); ctx.lineTo(h0.x + sx * R + R * 0.2, h0.y - R * 0.9); ctx.fill(); }   // boynuzlar
      elips(ctx, h0.x, h0.y, R * 1.05, R * 0.9, kirmizi);
      elips(ctx, h0.x + R * 0.55, h0.y + R * 0.25, R * 0.55, R * 0.42, altin);                                                 // burun
      elips(ctx, h0.x + R * 0.8, h0.y + R * 0.15, R * 0.08, R * 0.06, "#8a1a14");
      elips(ctx, h0.x - R * 0.05, h0.y - R * 0.3, R * 0.3, R * 0.3, "#ffffff"); elips(ctx, h0.x + R * 0.02, h0.y - R * 0.28, R * 0.15, R * 0.17, "#1f1a14");   // göz
      elips(ctx, h0.x + R * 0.06, h0.y - R * 0.34, R * 0.05, R * 0.05, "#ffffff");
      ctx.strokeStyle = "#8a1a14"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(h0.x + R * 0.45, h0.y + R * 0.45, R * 0.3, 0.1 * Math.PI, 0.8 * Math.PI); ctx.stroke();   // gülümseme
      for (let i = 0; i < 4; i++) elips(ctx, h0.x - R * 0.7 + i * R * 0.12, h0.y + R * 0.75, R * 0.07, R * 0.14, altin);          // sakal
    },
    duman(ctx, x, y, zaman, n) {
      const eski = ctx.globalAlpha;
      for (let i = 0; i < 3; i++) {
        const t = (zaman * 0.35 + n + i / 3) % 1;
        ctx.globalAlpha = eski * 0.55 * (1 - t);
        elips(ctx, x + Math.sin(zaman + i * 2) * 2 + t * 5, y - t * 16, 2 + t * 3.5, 1.6 + t * 2.6, "#e8ecf0");
      }
      ctx.globalAlpha = eski;
    },
  });

  // ---------- CN: pandalar ve bambu ----------
  // Bambu ormanı: arkada sık bambu sapları, yerde dökülmüş yapraklar; bambu kemiren oturan bir dev panda ve yanında
  // yavrusu (siyah kulak, göz lekeleri, kol ve bacaklar)
  function panda(ctx, x, taban, s, yon, bambuluMu) {
    const kara = "#2a2a2e", beyaz = "#f6f4ee";
    ctx.save(); ctx.translate(x, taban); ctx.scale(yon, 1);
    elips(ctx, 0, 0.5, s * 0.5, s * 0.08, "rgba(0,0,0,0.25)");
    elips(ctx, 0, -s * 0.38, s * 0.38, s * 0.36, beyaz);                                                                      // gövde
    ctx.fillStyle = kara; ctx.beginPath(); ctx.ellipse(0, -s * 0.6, s * 0.36, s * 0.13, 0, Math.PI, 0); ctx.lineTo(s * 0.36, -s * 0.52); ctx.ellipse(0, -s * 0.52, s * 0.36, s * 0.08, 0, 0, Math.PI); ctx.fill();   // omuz kuşağı
    for (const sx of [-1, 1]) { elips(ctx, sx * s * 0.2, -s * 0.07, s * 0.15, s * 0.11, kara); elips(ctx, sx * s * 0.2, -s * 0.06, s * 0.07, s * 0.05, "#5a5a60"); }   // ayaklar
    if (bambuluMu) {                                                                                                          // kemirilen bambu
      ctx.strokeStyle = "#7fae4a"; ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.moveTo(s * 0.22, -s * 0.12); ctx.lineTo(s * 0.34, -s * 1.02); ctx.stroke();
      ctx.strokeStyle = "#4f7a2e"; ctx.lineWidth = 0.6; ctx.beginPath(); for (const t of [0.35, 0.6, 0.85]) { ctx.moveTo(s * (0.22 + 0.12 * t) - s * 0.03, -s * (0.12 + 0.9 * t)); ctx.lineTo(s * (0.22 + 0.12 * t) + s * 0.03, -s * (0.12 + 0.9 * t)); } ctx.stroke();
      for (const [a, l] of [[-0.6, 0.22], [0.5, 0.2], [-1.2, 0.18]]) { ctx.save(); ctx.translate(s * 0.34, -s * 1.02); ctx.rotate(a); elips(ctx, 0, -s * l * 0.5, s * 0.05, s * l * 0.5, "#5f9a3a"); ctx.restore(); }
    }
    for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * s * 0.2, -s * 0.48); ctx.rotate(sx * -0.5); elips(ctx, 0, s * 0.1, s * 0.09, s * 0.17, kara); ctx.restore(); }   // kollar
    const hy = -s * 0.86, R = s * 0.27;
    for (const sx of [-1, 1]) elips(ctx, sx * R * 0.78, hy - R * 0.78, R * 0.32, R * 0.3, kara);                              // kulaklar
    elips(ctx, 0, hy, R, R * 0.9, beyaz);
    for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * R * 0.38, hy - R * 0.02); ctx.rotate(sx * 0.5); elips(ctx, 0, 0, R * 0.2, R * 0.28, kara); ctx.restore(); elips(ctx, sx * R * 0.36, hy - R * 0.08, R * 0.08, R * 0.08, "#ffffff"); }   // göz lekeleri
    elips(ctx, 0, hy + R * 0.3, R * 0.12, R * 0.08, kara);                                                                    // burun
    ctx.strokeStyle = kara; ctx.lineWidth = Math.max(0.6, s * 0.02); ctx.beginPath(); ctx.arc(-R * 0.08, hy + R * 0.42, R * 0.08, 0.1 * Math.PI, 0.9 * Math.PI); ctx.arc(R * 0.08, hy + R * 0.42, R * 0.08, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    for (const sx of [-1, 1]) elips(ctx, sx * R * 0.6, hy + R * 0.32, R * 0.12, R * 0.07, "rgba(240, 140, 150, 0.45)");
    ctx.restore();
  }
  function pandalar(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#4f7a34", "#6f9a44", 600);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 160; i++) { const x = r() * w, y = r() * h; ctx.save(); ctx.translate(x, y); ctx.rotate(r() * Math.PI); elips(ctx, 0, 0, 2.4, 0.8, ["#a8b860", "#8aa04a", "#c8c070"][i % 3]); ctx.restore(); } });
    const gen = Math.min(w * 0.42, 66, (h * 0.8) / 1.25), A = enIyiYer(B, w, h, gen * 1.7, gen * 1.25, 6);
    for (let x = 6 + r() * 6; x < w - 4; x += 9 + r() * 7) {                                                                 // bambu sapları (arkada)
      const taban = Math.min(h - 6, A ? A.taban - A.b * 0.45 : h * 0.55) - r() * 6, boy = Math.min(80, ustBosluk(B, x, taban) - 2);
      if (boy < 16 || uz(B, x, taban) > -3) continue;
      const egim = (r() - 0.5) * 4, en = 2.4 + r() * 1.4;
      ctx.save(); ctx.translate(1.5, 1); bambu(ctx, x, taban, x + egim, taban - boy, en, "rgba(0,0,0,0.25)"); ctx.restore();
      bambu(ctx, x, taban, x + egim, taban - boy, en, ["#7fae4a", "#8fbe5a", "#6f9e3a"][Math.floor(r() * 3)]);
      for (let t = 0.25; t < 1; t += 0.22 + r() * 0.1) { const px = x + egim * t, py = taban - boy * t, sx = r() < 0.5 ? -1 : 1; ctx.save(); ctx.translate(px, py); ctx.rotate(sx * (0.9 + r() * 0.4)); elips(ctx, 0, -3.5, 1.2, 3.8, "#4f8a2e"); ctx.restore(); }
    }
    if (!A) return [];
    const s = A.b / 1.25;
    panda(ctx, A.x - A.g * 0.18, A.taban, s, 1, true);
    if (yapiSigdir(B, A.x + A.g * 0.3, A.taban - 1, s * 0.6, s * 0.75)) panda(ctx, A.x + A.g * 0.3, A.taban - 1, s * 0.55, -1, false);   // yavru
    return [];
  }

  // ---------- CN: ejder dansı ----------
  // Kırmızı döşeli bayram meydanı, altın konfeti ve kırmızı fenerli ip; sopalar üstünde dalgalanan uzun, sevimli kumaş
  // ejder ve sopaları taşıyan hayaletler (canlı)
  function ejderDansi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#b8463a", null);
    kirp(ctx, B, () => {
      ctx.strokeStyle = "rgba(90, 20, 15, 0.3)"; ctx.lineWidth = 0.8; ctx.beginPath();
      for (let y = 6; y < h; y += 9) { ctx.moveTo(0, y); ctx.lineTo(w, y); } for (let y = 6, j = 0; y < h; y += 9, j++) for (let x = (j % 2) * 9; x < w; x += 18) { ctx.moveTo(x, y); ctx.lineTo(x, y + 9); }
      ctx.stroke();
      for (let i = 0; i < w * h / 120; i++) elips(ctx, r() * w, r() * h, 0.9, 0.6, ["#f2c94c", "#f8e08a", "#e8402a"][i % 3]);   // konfeti
    });
    const gen = Math.min(w * 0.92, 160, (h * 0.8) / 0.6), A = enIyiYer(B, w, h, gen, gen * 0.6, 6), canli = [];
    const ipY = A ? A.taban - A.b - 4 : h * 0.2, [x0, x1] = icAralik(B, w, ipY, w / 2, 6);
    if (A && ipY > 10 && x1 - x0 > 30) {                                                                                     // fenerli ip
      ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x0, ipY); ctx.quadraticCurveTo((x0 + x1) / 2, ipY + 6, x1, ipY); ctx.stroke();
      for (let x = x0 + 10; x < x1 - 8; x += 16) {
        const t = (x - x0) / (x1 - x0), fy = ipY + 12 * t * (1 - t);
        if (uz(B, x, fy - 3) > -4) continue;
        ctx.fillStyle = "#c8302a"; elips(ctx, x, fy + 3.2, 3.6, 3, "#d6302a"); ctx.fillStyle = "#f2c94c"; ctx.fillRect(x - 1.8, fy, 3.6, 1); ctx.fillRect(x - 1.5, fy + 5.8, 3, 1);
        ctx.strokeStyle = "#f2c94c"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, fy + 6.8); ctx.lineTo(x, fy + 9); ctx.stroke();
      }
    }
    if (A) {
      elips(ctx, A.x, A.taban - 1, A.g * 0.45, 3, "rgba(0,0,0,0.22)");
      canli.push({ tur: "ejderDans", x: A.x - A.g / 2, y: A.taban, n: r(), g: A.g, b: A.b });
    }
    return canli;
  }

  // ---------- KR: hanok evleri ----------
  // Sıkıştırılmış toprak avlu ve kiremit başlıklı alçak taş duvar; taş kaide üstünde koyu ahşap çatkılı, beyaz duvarlı,
  // kafes kâğıt kapılı evler; uçları kalkık kavisli gri kiremit çatılar; avluda turuncu meyveli hurma (kaki) ağacı
  function hanok(ctx, x, taban, g, b) {
    const duvarG = g * 0.78, ahsap = "#5a3a22", kagit = "#f4ead0", cati = "#4a4e56";
    elips(ctx, x + 2, taban + 0.5, g * 0.5, 2.4, "rgba(0,0,0,0.28)");
    ctx.fillStyle = "#9a958a"; ctx.fillRect(x - duvarG / 2 - 2, taban - b * 0.12, duvarG + 4, b * 0.12);                     // taş kaide
    ctx.strokeStyle = "#7a756a"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let xx = x - duvarG / 2; xx < x + duvarG / 2; xx += 6) { ctx.moveTo(xx, taban - b * 0.12); ctx.lineTo(xx + 1, taban); } ctx.stroke();
    const dy0 = taban - b * 0.56, dy1 = taban - b * 0.12;
    ctx.fillStyle = "#f1ece0"; ctx.fillRect(x - duvarG / 2, dy0, duvarG, dy1 - dy0);                                       // duvar
    const n = 4, pw = duvarG / n;
    for (let i = 0; i < n; i++) {
      const px = x - duvarG / 2 + i * pw;
      if (i === 1 || i === 2) {                                                                                                // kafes kâğıt kapılar
        ctx.fillStyle = kagit; ctx.fillRect(px + 1.5, dy0 + 2, pw - 3, dy1 - dy0 - 2);
        ctx.strokeStyle = "#8a6a4a"; ctx.lineWidth = 0.4; ctx.beginPath();
        for (let xx = px + 1.5 + (pw - 3) / 4; xx < px + pw - 1.5; xx += (pw - 3) / 4) { ctx.moveTo(xx, dy0 + 2); ctx.lineTo(xx, dy1); }
        for (let yy = dy0 + 5; yy < dy1; yy += 3.5) { ctx.moveTo(px + 1.5, yy); ctx.lineTo(px + pw - 1.5, yy); }
        ctx.stroke();
      } else { ctx.fillStyle = kagit; ctx.fillRect(px + pw * 0.25, dy0 + (dy1 - dy0) * 0.25, pw * 0.5, (dy1 - dy0) * 0.35); ctx.strokeStyle = "#8a6a4a"; ctx.lineWidth = 0.4; ctx.strokeRect(px + pw * 0.25, dy0 + (dy1 - dy0) * 0.25, pw * 0.5, (dy1 - dy0) * 0.35); }
      ctx.fillStyle = ahsap; ctx.fillRect(px - 0.9, dy0, 1.8, dy1 - dy0);                                                       // direkler
    }
    ctx.fillStyle = ahsap; ctx.fillRect(x + duvarG / 2 - 0.9, dy0, 1.8, dy1 - dy0); ctx.fillRect(x - duvarG / 2, dy0, duvarG, 2);
    ctx.fillStyle = "#3a6a5a"; ctx.fillRect(x - duvarG / 2, dy0 - 2.5, duvarG, 2.5);                                         // boyalı kiriş (dancheong)
    ctx.fillStyle = "#c8402a"; for (let xx = x - duvarG / 2 + 2; xx < x + duvarG / 2 - 1; xx += 5) ctx.fillRect(xx, dy0 - 2, 2, 1.2);
    const ey = taban - b * 0.6, uc = taban - b * 0.7, sirt = taban - b * 0.92;                                                 // kavisli kiremit çatı
    const cati_ = () => {
      ctx.beginPath(); ctx.moveTo(x - g / 2, uc); ctx.quadraticCurveTo(x, ey + b * 0.06, x + g / 2, uc);
      ctx.quadraticCurveTo(x + g * 0.4, sirt + b * 0.08, x + g * 0.36, sirt); ctx.lineTo(x - g * 0.36, sirt); ctx.quadraticCurveTo(x - g * 0.4, sirt + b * 0.08, x - g / 2, uc); ctx.closePath();
    };
    ctx.save(); ctx.translate(1.5, 2); cati_(); ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fill(); ctx.restore();
    cati_(); ctx.fillStyle = cati; ctx.fill();
    ctx.save(); cati_(); ctx.clip(); ctx.strokeStyle = acik(cati, 0.18); ctx.lineWidth = 0.7; ctx.beginPath();
    for (let xx = x - g / 2; xx < x + g / 2; xx += 3) { ctx.moveTo(xx, sirt); ctx.lineTo(xx + (xx - x) * 0.1, ey + b * 0.06); } ctx.stroke(); ctx.restore();
    ctx.strokeStyle = "#2a2e36"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - g / 2, uc); ctx.quadraticCurveTo(x, ey + b * 0.06, x + g / 2, uc); ctx.stroke();
    ctx.fillStyle = "#2f333a"; ctx.beginPath(); ctx.moveTo(x - g * 0.4, taban - b + 1); ctx.quadraticCurveTo(x - g * 0.34, sirt + 1, x - g * 0.28, sirt); ctx.lineTo(x + g * 0.28, sirt); ctx.quadraticCurveTo(x + g * 0.34, sirt + 1, x + g * 0.4, taban - b + 1); ctx.lineTo(x + g * 0.36, sirt + b * 0.05); ctx.lineTo(x - g * 0.36, sirt + b * 0.05); ctx.closePath(); ctx.fill();   // kalkık uçlu mahya
  }
  function kakiAgaci(ctx, x, taban, boy, r) {
    const tac = Math.min(14, boy * 0.4 + 3), ty = taban - boy + tac * 0.85;
    elips(ctx, x + 2, taban, tac * 0.9, tac * 0.28, "rgba(0,0,0,0.26)");
    ctx.strokeStyle = "#4a3426"; ctx.lineCap = "round"; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x, taban); ctx.quadraticCurveTo(x - 2, (taban + ty) / 2, x + 1, ty + 3); ctx.stroke();
    yaprakKubbe(ctx, x, ty, tac, r, ["#5a7a2e", "#6a8a34", "#4f6a28"], "#3a4a1a");
    for (let i = 0; i < 9; i++) { const ox = x + (r() - 0.5) * tac * 1.5, oy = ty + (r() - 0.5) * tac * 0.8; elips(ctx, ox, oy, 1.7, 1.5, "#f28c28"); elips(ctx, ox, oy - 1.4, 0.8, 0.4, "#3a5a1e"); }
  }
  function hanokEvleri(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#b8a07a", null);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 200; i++) elips(ctx, r() * w, r() * h, 1 + r() * 1.5, 0.7, "rgba(90, 70, 40, 0.18)"); });
    const n = w > 150 ? 2 : 1, gen = Math.min(w * 0.92, n * 96, ((h * 0.84) / 0.8) * n), sira = enIyiYer(B, w, h, gen, (gen / n) * 0.8, 5);
    if (!sira) return [];
    const duvarY = sira.taban - sira.b * 0.5;                                                                                 // arkada kiremit başlıklı taş duvar
    kirp(ctx, B, () => {
      ctx.fillStyle = "#a8a296"; ctx.fillRect(0, duvarY - 12, w, 12); ctx.fillStyle = "#4a4e56"; ctx.fillRect(0, duvarY - 15, w, 3.5);
      ctx.strokeStyle = "#7a756a"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let x = 0, j = 0; x < w; x += 7, j++) { ctx.moveTo(x, duvarY - 12); ctx.lineTo(x + 1, duvarY); } ctx.moveTo(0, duvarY - 6); ctx.lineTo(w, duvarY - 6); ctx.stroke();
    });
    for (const fx of [-0.42, 0.05, 0.4]) {                                                                                    // çatıların arkasından taşan kaki ağaçları
      const x = sira.x + fx * sira.g, taban = duvarY - 2, boy = Math.min(sira.b * 0.9, ustBosluk(B, x, taban) - 2);
      if (boy > 16 && uz(B, x, taban) < -4) kakiAgaci(ctx, x, taban, boy, r);
    }
    const g = sira.g / n;
    for (let i = 0; i < n; i++) hanok(ctx, sira.x - sira.g / 2 + g * (i + 0.5), sira.taban - i * 2, g * 0.96, sira.b - i * 2);
    return [];
  }

  // ---------- KR: kimçi küpleri (onggi) ----------
  // Taş döşeli küp sekisi: sıra sıra, arkadan öne büyüyen, kapaklı, sırlı kahverengi toprak küpler (parmak izi dalgaları,
  // parıltı); yanda hasır üstünde kurutulan kırmızı biberler
  function onggi(ctx, x, taban, s) {
    const sir = "#5a3420";
    elips(ctx, x + 1, taban + 0.5, s * 0.42, s * 0.1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = sir; ctx.beginPath(); ctx.moveTo(x - s * 0.22, taban);
    ctx.bezierCurveTo(x - s * 0.5, taban - s * 0.35, x - s * 0.48, taban - s * 0.8, x - s * 0.2, taban - s * 0.86); ctx.lineTo(x + s * 0.2, taban - s * 0.86);
    ctx.bezierCurveTo(x + s * 0.48, taban - s * 0.8, x + s * 0.5, taban - s * 0.35, x + s * 0.22, taban); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#7a4a2e"; ctx.lineWidth = Math.max(0.5, s * 0.03); ctx.beginPath();                                    // parmak izi dalgası
    for (let xx = -0.36; xx <= 0.36; xx += 0.06) ctx.lineTo(x + xx * s, taban - s * (0.58 + Math.sin(xx * 40) * 0.025)); ctx.stroke();
    elips(ctx, x - s * 0.22, taban - s * 0.55, s * 0.06, s * 0.2, "rgba(255, 230, 200, 0.35)");                              // parıltı
    elips(ctx, x, taban - s * 0.87, s * 0.24, s * 0.06, "#3a2214");                                                          // ağız
    ctx.fillStyle = "#4a2a18"; ctx.beginPath(); ctx.ellipse(x, taban - s * 0.88, s * 0.27, s * 0.12, 0, Math.PI, 0); ctx.fill();   // kapak
    elips(ctx, x, taban - s * 0.99, s * 0.06, s * 0.035, "#6a3a22");
    elips(ctx, x - s * 0.1, taban - s * 0.93, s * 0.08, s * 0.025, "rgba(255, 230, 200, 0.3)");
  }
  function onggiKupleri(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#9a958a", null);
    kirp(ctx, B, () => {                                                                                                         // taş seki
      ctx.strokeStyle = "rgba(60, 55, 50, 0.35)"; ctx.lineWidth = 0.8;
      for (let y = 4, j = 0; y < h; y += 8, j++) for (let x = (j % 2) * 7 - 7; x < w; x += 14) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + 1, y + 1, 12.5, 6.5, 2); ctx.stroke(); }
    });
    const hasir = w > 120 ? enIyiYer(B, w, h, Math.min(w * 0.3, 46), Math.min(h * 0.3, 30), 5) : null;                       // biber hasırı
    if (hasir) {
      const { x, taban, g, b } = hasir;
      ctx.fillStyle = "#c9a86a"; ctx.fillRect(x - g / 2, taban - b, g, b); ctx.strokeStyle = "#a8884a"; ctx.lineWidth = 0.5; ctx.beginPath(); for (let xx = x - g / 2 + 2; xx < x + g / 2; xx += 3) { ctx.moveTo(xx, taban - b); ctx.lineTo(xx, taban); } ctx.stroke();
      for (let i = 0; i < g * b / 14; i++) { const px = x - g / 2 + 3 + r() * (g - 6), py = taban - b + 2.5 + r() * (b - 5); ctx.save(); ctx.translate(px, py); ctx.rotate(r() * Math.PI); elips(ctx, 0, 0, 2.6, 0.9, r() < 0.85 ? "#d6302a" : "#a8201a"); ctx.restore(); }
    }
    const S = Math.max(10, Math.min(20, Math.min(w, h) / 5)), kupler = [];
    for (let y = S * 1.1, j = 0; y < h - 2; y += S * 0.62, j++) for (let x = S * 0.5 + (j % 2) * S * 0.42; x < w; x += S * 0.86) {
      const s = S * (0.72 + (y / h) * 0.4) * (0.9 + r() * 0.2);
      if (hasir && x > hasir.x - hasir.g / 2 - s * 0.5 && x < hasir.x + hasir.g / 2 + s * 0.5 && y > hasir.taban - hasir.b - 2 && y - s < hasir.taban) continue;
      if ([[x - s * 0.45, y - s * 0.4], [x + s * 0.45, y - s * 0.4], [x, y - s], [x, y]].every(([px, py]) => uz(B, px, py) < -2)) kupler.push({ x, y, s });
    }
    kupler.sort((a, b) => a.y - b.y).forEach((k) => onggi(ctx, k.x, k.y, k.s));
    return [];
  }

  // ---------- RU: matruşka bebekleri ----------
  // Karlı huş ormanı (beyaz gövdeli, siyah benekli huşlar, mavi kar gölgeleri); önde büyükten küçüğe dizili, çiçekli
  // önlüklü, başörtülü rengârenk matruşkalar
  function matruska(ctx, x, taban, s, renk) {
    const yol = () => {
      ctx.beginPath(); ctx.moveTo(x - s * 0.26, taban);
      ctx.bezierCurveTo(x - s * 0.36, taban - s * 0.2, x - s * 0.34, taban - s * 0.48, x - s * 0.21, taban - s * 0.62);
      ctx.bezierCurveTo(x - s * 0.3, taban - s * 0.78, x - s * 0.22, taban - s, x, taban - s);
      ctx.bezierCurveTo(x + s * 0.22, taban - s, x + s * 0.3, taban - s * 0.78, x + s * 0.21, taban - s * 0.62);
      ctx.bezierCurveTo(x + s * 0.34, taban - s * 0.48, x + s * 0.36, taban - s * 0.2, x + s * 0.26, taban); ctx.closePath();
    };
    elips(ctx, x + 1.5, taban + 0.5, s * 0.32, s * 0.06, "rgba(0,0,0,0.25)");
    yol(); ctx.fillStyle = renk; ctx.fill();
    ctx.save(); yol(); ctx.clip();
    elips(ctx, x + s * 0.2, taban - s * 0.4, s * 0.12, s * 0.5, "rgba(0,0,0,0.12)");
    elips(ctx, x, taban - s * 0.28, s * 0.22, s * 0.3, "#f6e8c8");                                                           // önlük
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; elips(ctx, x + Math.cos(a) * s * 0.06, taban - s * 0.3 + Math.sin(a) * s * 0.06, s * 0.05, s * 0.05, renk); }
    elips(ctx, x, taban - s * 0.3, s * 0.04, s * 0.04, "#f2c94c");
    for (const sx of [-1, 1]) elips(ctx, x + sx * s * 0.1, taban - s * 0.2, s * 0.06, s * 0.03, "#3a8a3a");
    ctx.restore();
    ctx.strokeStyle = "#f2c94c"; ctx.lineWidth = Math.max(0.6, s * 0.025); ctx.beginPath(); ctx.ellipse(x, taban - s * 0.74, s * 0.18, s * 0.17, 0, 0, Math.PI * 2); ctx.stroke();   // başörtü kenarı
    elips(ctx, x, taban - s * 0.74, s * 0.16, s * 0.15, "#f8e2cc");                                                           // yüz
    ctx.fillStyle = "#6a3a1a"; ctx.beginPath(); ctx.ellipse(x, taban - s * 0.82, s * 0.15, s * 0.07, 0, Math.PI, 0); ctx.fill();   // saç
    yuz(ctx, x, taban - s * 0.75, s * 0.15, false, "#2a1a10");
    for (const sx of [-1, 1]) elips(ctx, x + sx * s * 0.09, taban - s * 0.71, s * 0.03, s * 0.025, "#e8606a");
    elips(ctx, x - s * 0.1, taban - s * 0.92, s * 0.05, s * 0.025, "rgba(255,255,255,0.4)");
  }
  function hus(ctx, x, taban, boy) {
    elips(ctx, x + 2, taban, 4, 1.4, "rgba(60, 80, 120, 0.25)");
    ctx.fillStyle = "#f4f4ee"; ctx.fillRect(x - 1.6, taban - boy, 3.2, boy);
    ctx.fillStyle = "#2a2a2a"; for (let y = taban - boy + 3; y < taban - 2; y += 4 + ((y * 7) % 3)) ctx.fillRect(x - 1.6 + ((y * 3) % 2), y, 1.8, 0.9);
    ctx.strokeStyle = "#6a5a4a"; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let t = 0.12; t < 0.6; t += 0.12) { const yy = taban - boy + boy * t, sx = t * 10 % 2 < 1 ? -1 : 1; ctx.moveTo(x, yy); ctx.lineTo(x + sx * 6, yy - 4); }
    ctx.stroke();
    for (let t = 0.12; t < 0.6; t += 0.12) { const yy = taban - boy + boy * t, sx = t * 10 % 2 < 1 ? -1 : 1; elips(ctx, x + sx * 4, yy - 3.2, 2.4, 0.9, "#ffffff"); }   // dallarda kar
  }
  function matruskalar(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#e8eef4", null);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 500; i++) elips(ctx, r() * w, r() * h, 4 + r() * 6, 1.2 + r(), "rgba(150, 175, 210, 0.3)"); });
    const gen = Math.min(w * 0.92, 150, (h * 0.8) * 2.5), A = enIyiYer(B, w, h, gen, gen / 2.5, 5);
    for (let x = 8 + r() * 6; x < w - 4; x += 14 + r() * 10) {                                                               // huşlar (arkada)
      const taban = (A ? A.taban - A.b * 0.7 : h * 0.6) - r() * 8, boy = Math.min(70, ustBosluk(B, x, taban) - 2);
      if (boy > 16 && uz(B, x, taban) < -4 && uz(B, x - 7, taban - boy * 0.5) < -2 && uz(B, x + 7, taban - boy * 0.5) < -2) hus(ctx, x, taban, boy);
    }
    if (!A) return [];
    const oran = [1, 0.82, 0.66, 0.52, 0.4], top = oran.reduce((a, o) => a + o * 0.68, 0), s = A.g / top, renkler = ["#c8302a", "#2f5fa0", "#e8a23a", "#3a8a4a", "#b8306a"];
    let x = A.x - A.g / 2;
    oran.forEach((o, i) => { const ss = s * o; x += ss * 0.34; matruska(ctx, x, A.taban, Math.min(ss, A.b), renkler[i]); x += ss * 0.34; });
    return [];
  }

  // ---------- RU: oymalı ahşap izba ----------
  // Karlı bahçe ve çit; yuvarlak uçlu kütüklerden ev, beyaz oymalı pencere pervazları (nalicnik) ve mavi kepenkler,
  // dantel gibi oymalı alın tahtaları, karlı dik çatı, alınlıkta yuvarlak pencere; bacadan duman tüter (canlı)
  function izba(ctx, x, taban, g, b) {
    const kutuk = "#8a5a32", beyaz = "#f4f4ee", gw = g * 0.8, dy = taban - b * 0.55, canli = [];
    elips(ctx, x + 2, taban + 0.5, g * 0.5, 2.4, "rgba(60, 80, 120, 0.3)");
    const kh = Math.max(2.6, (taban - dy) / 9);
    for (let y = dy, i = 0; y < taban - 0.5; y += kh, i++) {                                                                // kütükler
      ctx.fillStyle = i % 2 ? kutuk : koyu(kutuk, 0.08); yuvarlak(ctx, x - gw / 2, y, gw, kh, kh / 2); ctx.fill();
      ctx.fillStyle = "rgba(255, 220, 170, 0.25)"; ctx.fillRect(x - gw / 2 + kh / 2, y + 0.4, gw - kh, kh * 0.25);
      for (const sx of [-1, 1]) { elips(ctx, x + sx * (gw / 2 + 0.5), y + kh / 2, kh * 0.55, kh * 0.5, "#c89a62"); elips(ctx, x + sx * (gw / 2 + 0.5), y + kh / 2, kh * 0.22, kh * 0.2, "#8a6a42"); }
    }
    for (const sx of [-1, 1]) {                                                                                             // pencereler
      const px = x + sx * gw * 0.24, pw = gw * 0.2, ph = (taban - dy) * 0.42, py = dy + (taban - dy) * 0.25;
      for (const kx of [-1, 1]) { ctx.fillStyle = "#2f5fa0"; ctx.fillRect(px + kx * (pw / 2 + pw * 0.22) - pw * 0.22, py, pw * 0.44, ph); ctx.fillStyle = "#f2c94c"; ctx.fillRect(px + kx * (pw / 2 + pw * 0.22) - pw * 0.08, py + ph * 0.4, pw * 0.16, ph * 0.2); }   // kepenkler
      ctx.fillStyle = beyaz; ctx.fillRect(px - pw / 2 - 1.2, py - 1.2, pw + 2.4, ph + 2.4);
      ctx.fillStyle = "#8ac0e0"; ctx.fillRect(px - pw / 2, py, pw, ph); ctx.fillStyle = beyaz; ctx.fillRect(px - 0.4, py, 0.8, ph); ctx.fillRect(px - pw / 2, py + ph * 0.4, pw, 0.8);
      ctx.beginPath(); ctx.moveTo(px - pw / 2 - 2, py - 1.2); ctx.quadraticCurveTo(px, py - ph * 0.55, px + pw / 2 + 2, py - 1.2); ctx.fill();   // oymalı alınlık
      for (let k = 0; k < 4; k++) elips(ctx, px - pw / 2 + (k + 0.5) * (pw / 4), py + ph + 2.2, pw / 9, 1.2, beyaz);       // alt saçak
    }
    const cy = taban - b, kenar = (sx) => [x + sx * (g / 2), dy + 1];                                                         // çatı
    ctx.fillStyle = "#6a4426"; ctx.beginPath(); ctx.moveTo(...kenar(-1)); ctx.lineTo(x, cy + 3); ctx.lineTo(...kenar(1)); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.moveTo(...kenar(-1)); ctx.lineTo(x, cy + 3); ctx.lineTo(...kenar(1)); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let xx = x - g / 2; xx < x + g / 2; xx += 3) { ctx.moveTo(xx, cy); ctx.lineTo(xx, dy + 1); } ctx.stroke();
    ctx.restore();
    elips(ctx, x, cy + (dy - cy) * 0.6, g * 0.07, g * 0.07, beyaz); elips(ctx, x, cy + (dy - cy) * 0.6, g * 0.05, g * 0.05, "#8ac0e0");   // yuvarlak pencere
    ctx.strokeStyle = beyaz; ctx.lineWidth = Math.max(1.6, g * 0.03); ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(...kenar(-1)); ctx.lineTo(x, cy + 3); ctx.lineTo(...kenar(1)); ctx.stroke();   // alın tahtası
    for (const sx of [-1, 1]) for (let t = 0.12; t < 0.95; t += 0.1) elips(ctx, x + sx * (g / 2) * t, cy + 3 + (dy + 1 - cy - 3) * t + 2, 1.1, 1.3, beyaz);   // dantel oyma
    ctx.fillStyle = "#f8fbff"; ctx.beginPath(); ctx.moveTo(x - g / 2 - 1, dy); ctx.lineTo(x, cy); ctx.lineTo(x + g / 2 + 1, dy); ctx.lineTo(x + g / 2 - 2, dy + 2); ctx.lineTo(x, cy + 4); ctx.lineTo(x - g / 2 + 2, dy + 2); ctx.closePath(); ctx.fill();   // kar
    const bx = x + g * 0.22, by = cy + (dy - cy) * 0.44;                                                                      // baca
    ctx.fillStyle = "#8a4a3a"; ctx.fillRect(bx - 2.5, by - 8, 5, 8); ctx.fillStyle = "#f8fbff"; ctx.fillRect(bx - 3, by - 9, 6, 1.6);
    canli.push({ tur: "duman", x: bx, y: by - 10 });
    return canli;
  }
  function izbaEvi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#e8eef4", null);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 500; i++) elips(ctx, r() * w, r() * h, 4 + r() * 6, 1.2 + r(), "rgba(150, 175, 210, 0.3)"); });
    const gen = Math.min(w * 0.72, 124, (h * 0.86) / 1.05), A = enIyiYer(B, w, h, gen, gen * 1.05, 6);
    if (!A) return [];
    const canli = izba(ctx, A.x, A.taban, A.g, A.b).map((c) => ({ ...c, n: r() }));
    const cy = A.taban - 2;                                                                                                   // çit
    for (const sx of [-1, 1]) {
      const direkler = [];
      for (let x = A.x + sx * (A.g / 2 + 4); sx < 0 ? x > 4 : x < w - 4; x += sx * 5) { if (uz(B, x, cy) > -3 || uz(B, x, cy - 12) > -2) break; direkler.push(x); }
      if (direkler.length > 1) { ctx.fillStyle = "#6a4a2a"; ctx.fillRect(Math.min(...direkler), cy - 8, Math.abs(direkler[direkler.length - 1] - direkler[0]), 1.2); }   // kuşak
      for (const x of direkler) {
        ctx.fillStyle = "#8a6a42"; ctx.fillRect(x - 1.2, cy - 11, 2.4, 11); ctx.beginPath(); ctx.moveTo(x - 1.2, cy - 11); ctx.lineTo(x, cy - 13); ctx.lineTo(x + 1.2, cy - 11); ctx.fill();
        ctx.fillStyle = "#f8fbff"; ctx.fillRect(x - 1.4, cy - 12.5, 2.8, 1.2);
      }
    }
    return canli;
  }

  Object.assign(window.ULKE_OBJELERI, {
    kirazAgaclari, fujiDagi, ejderKaniAgaclari, kuleEvler, hurmaBahcesi, filKayasi, zeytinBahcesi, hayatAgaciMozaigi,
    mudhifEvleri, senasilBalkonlar, sioseKopru, ruzgarKuleleri, ipekYoluKervani, kavunPazari, ucurtmaTepesi, narBahcesi,
    susluKamyonlar, kayisiBahcesi, hawaMahal, lotusGoleti, susluRiksalar, sundarbans, inleBalikcilari, patheinSemsiyeleri,
    yuzenPazar, tukTuk, petronasKuleleri, rafflesia, komodoEjderleri, pirincTeraslari, cikolataTepeleri, jeepney,
    haLongKorfezi, hoiAnFenerleri, pandalar, ejderDansi, hanokEvleri, onggiKupleri, matruskalar, izbaEvi,
  });
  window.ULKE_OBJE_YARDIMCI = Object.assign(window.ULKE_OBJE_YARDIMCI || {}, { sevimliHayalet, ustteYer, kayik });
})();
