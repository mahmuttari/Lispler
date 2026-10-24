/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: ÜLKE OBJELERİ (Avrupa, 3.14.0)
   Ressam imzası engel-temalari.js ile aynı: (ctx, w, h, r, p, B) -> canli[]. B "yama" ya da "kaya" biçimi; süsler
   biçimin içinde kalır, sabit çizim dikdörtgenin üst kenarından taşmaz; uzun yapılar maket boyunda (spec §5.3).
   Canlı süsler ENGEL_CANLI'ya eklenir (her karede çizilir). Math.random yok; insan, bayrak, dinî öğe, silah yok.
   Türkiye (Görev 5): peri bacaları ve balonlar, lale bahçesi. Öteki Avrupa ülkeleri Görev 7'de.
   ============================================================ */
window.ULKE_OBJELERI = window.ULKE_OBJELERI || {};
(function () {
  const { doldur, kirp, kenarNoktalari, icNoktalar, karistir, acik, koyu, elips, gozler, cimTutami, kayalikKenar } = window.ENGEL;
  // (x, y)'den yukarı biçimin içinde kalan boşluk
  const ustBosluk = (B, x, y, en = 140) => { let k = 0; while (k < en && window.engelUzaklik(B, x, y - k - 2) < -2) k += 2; return k; };

  // ---------- canlı: Kapadokya balonu yavaşça süzülür ----------
  Object.assign(window.ENGEL_CANLI, {
    balon(ctx, x, y, zaman, n, k) {
      const bx = x + Math.sin(zaman * 0.35 + n * 6.3) * 3, by = y - 3 - (Math.sin(zaman * 0.6 + n * 9) + 1) * 2.5;
      const s = (k && k.s) || 7, renk = (k && k.renk) || "#e8553d", renk2 = (k && k.renk2) || "#f2c94c";
      elips(ctx, bx + 1.5, by + s * 2.4, s * 0.6, 1.4, "rgba(0,0,0,0.18)");
      ctx.strokeStyle = "#5a3a24"; ctx.lineWidth = 0.6; ctx.beginPath();
      ctx.moveTo(bx - s * 0.55, by + s * 0.7); ctx.lineTo(bx - s * 0.25, by + s * 1.45); ctx.moveTo(bx + s * 0.55, by + s * 0.7); ctx.lineTo(bx + s * 0.25, by + s * 1.45); ctx.stroke();
      ctx.fillStyle = "#8a5a32"; ctx.fillRect(bx - s * 0.28, by + s * 1.4, s * 0.56, s * 0.42);
      elips(ctx, bx, by, s, s * 1.08, renk);
      ctx.save(); ctx.beginPath(); ctx.ellipse(bx, by, s, s * 1.08, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = renk2; for (const dx of [-0.5, 0.5]) ctx.fillRect(bx + dx * s - s * 0.16, by - s * 1.2, s * 0.32, s * 2.4);
      ctx.restore();
      elips(ctx, bx - s * 0.35, by - s * 0.45, s * 0.22, s * 0.32, "rgba(255,255,255,0.45)");
    },
  });

  // ---------- TR: peri bacaları ----------
  // Açık tüf toprağı, kayalık kenar; 3–4 şapkalı konik kaya (uykulu sevimli yüzler); üstlerinde canlı balonlar
  function periBacalari(ctx, w, h, r, p, B) {
    const tuf = "#dcbd93", canli = [];
    doldur(ctx, B, koyu(tuf, 0.45), 0, 0, 3);
    kayalikKenar(ctx, B, koyu(tuf, 0.15), r, 9, 1, 6);
    doldur(ctx, B, tuf);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(tuf, 0.12); ctx.lineWidth = 2;
      for (let y = 8; y < h; y += 12) { ctx.beginPath(); for (let x = 0; x <= w; x += 9) ctx.lineTo(x, y + Math.sin(x / 15 + y) * 1.8); ctx.stroke(); }
      for (let i = 0; i < w * h / 600; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 2, karistir("#7d8f4e", "#000000", r() * 0.3));
    });
    const n = Math.max(2, Math.min(4, Math.round(w * h / 3600)));
    const yerler = icNoktalar(B, w, h, n, 13, 24, r).map((k) => ({ ...k, bos: ustBosluk(B, k.x, k.y) }));
    for (const k of yerler) {
      const boy = Math.max(16, Math.min(48, k.bos + 6)), gen = Math.min(18, boy * 0.42 + 4);
      const x = k.x, taban = k.y + 4, tepe = taban - boy;
      elips(ctx, x + 2, taban, gen * 0.85, gen * 0.28, "rgba(0,0,0,0.28)");
      const g = ctx.createLinearGradient(x - gen / 2, 0, x + gen / 2, 0);
      g.addColorStop(0, acik(tuf, 0.25)); g.addColorStop(0.55, tuf); g.addColorStop(1, koyu(tuf, 0.25));
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(x - gen / 2, taban); ctx.quadraticCurveTo(x - gen * 0.32, tepe + boy * 0.35, x - gen * 0.18, tepe + 3);
      ctx.lineTo(x + gen * 0.18, tepe + 3); ctx.quadraticCurveTo(x + gen * 0.32, tepe + boy * 0.35, x + gen / 2, taban); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = koyu(tuf, 0.18); ctx.lineWidth = 0.8;
      for (const t of [0.45, 0.7]) { ctx.beginPath(); ctx.moveTo(x - gen * (0.5 - t * 0.3), tepe + boy * t); ctx.lineTo(x + gen * (0.5 - t * 0.3), tepe + boy * t); ctx.stroke(); }
      elips(ctx, x, tepe + 2.5, gen * 0.4, 3.6, "#6b4a32");                     // şapka kaya
      elips(ctx, x - gen * 0.1, tepe + 1.6, gen * 0.22, 1.4, acik("#6b4a32", 0.3));
      const yy = tepe + boy * 0.55;                                              // uykulu yüz
      ctx.strokeStyle = "#5a3a24"; ctx.lineWidth = 1; ctx.lineCap = "round";
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * gen * 0.16, yy, 1.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
      elips(ctx, x, yy + 3.2, 1.2, 0.9, "#c0705a");
    }
    if (yerler.length && w * h > 6000) {                                         // balonlar (canlı): tepeye yakın boşlukta
      const ust = icNoktalar(B, w, h, 2, 12, 30, r).filter((k) => k.y < h * 0.45).slice(0, 2);
      const renkler = [["#e8553d", "#f2c94c"], ["#2a7fbf", "#f4f1ea"]];
      ust.forEach((k, i) => canli.push({ tur: "balon", x: k.x, y: k.y + 2, n: r(), s: 6 + r() * 2, renk: renkler[i][0], renk2: renkler[i][1] }));
    }
    return canli;
  }

  // ---------- TR: lale bahçesi ----------
  // Hattı izleyen mavi-beyaz çini bordür, koyu toprak tarh, sıra sıra kırmızı ve sarı laleler
  function laleBahcesi(ctx, w, h, r, p, B) {
    const cini = p.vurgu1 || "#2a7fbf";
    doldur(ctx, B, koyu(cini, 0.45), 0, 0, 3);
    doldur(ctx, B, "#f4f1ea", 0, 0, 1.5);
    kenarNoktalari(B, 5, 0).forEach((k, i) => {
      ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(Math.atan2(k.ny, k.nx));
      ctx.fillStyle = i % 2 ? "#f4f1ea" : cini; ctx.fillRect(-1.6, -2, 3.2, 4);
      ctx.restore();
    });
    doldur(ctx, B, "#5a3a24", 0, 0, -2);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu("#5a3a24", 0.25); ctx.lineWidth = 1.6;
      for (let y = 6; y < h; y += 9) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 1.5); ctx.stroke(); }
    }, 0, 0, -2);
    const kirmizi = p.vurgu2 || "#d6453d", sari = "#f2c94c";
    for (let y = 14, j = 0; y < h - 4; y += 13, j++) {
      for (let x = 7 + (j % 2) * 5.5; x < w - 4; x += 11) {
        if (window.engelUzaklik(B, x, y) > -6 || window.engelUzaklik(B, x, y - 11) > -3) continue;
        const renk = (j + Math.floor(x / 11)) % 3 === 0 ? sari : kirmizi;
        ctx.strokeStyle = "#3f8f3a"; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 7); ctx.stroke();
        elips(ctx, x - 2.4, y - 2.5, 1.4, 3.6, "#4d9a2a"); elips(ctx, x + 2.4, y - 2, 1.3, 3.2, "#4d9a2a");
        ctx.fillStyle = renk; ctx.beginPath();
        ctx.moveTo(x - 3, y - 7.5); ctx.quadraticCurveTo(x - 3.4, y - 11.5, x - 1.6, y - 12); ctx.lineTo(x, y - 10);
        ctx.lineTo(x + 1.6, y - 12); ctx.quadraticCurveTo(x + 3.4, y - 11.5, x + 3, y - 7.5); ctx.quadraticCurveTo(x, y - 6, x - 3, y - 7.5); ctx.fill();
        elips(ctx, x - 1, y - 9.5, 0.7, 1.4, acik(renk, 0.4));
      }
    }
    return [];
  }

  Object.assign(window.ULKE_OBJELERI, { periBacalari, laleBahcesi });
  window.ULKE_OBJE_YARDIMCI = Object.assign(window.ULKE_OBJE_YARDIMCI || {}, { ustBosluk, gozler });
})();
