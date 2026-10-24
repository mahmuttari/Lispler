/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: ÜLKE OBJELERİ (Avrupa, 3.14.0)
   Ressam imzası engel-temalari.js ile aynı: (ctx, w, h, r, p, B) -> canli[]. B "yama" ya da "kaya" biçimi; süsler
   biçimin içinde kalır, sabit çizim dikdörtgenin üst kenarından taşmaz; uzun yapılar maket boyunda (spec §5.3).
   Canlı süsler ENGEL_CANLI'ya eklenir (her karede çizilir). Math.random yok; insan, bayrak, dinî öğe, silah yok.
   Türkiye (Görev 5): peri bacaları ve balonlar, lale bahçesi. Avrupa (Görev 7): Ukrayna, Polonya, Almanya, Birleşik
   Krallık, Fransa, İtalya, İspanya. Rusya Görev 12'de (asya dosyası değil, burada).
   ============================================================ */
window.ULKE_OBJELERI = window.ULKE_OBJELERI || {};
(function () {
  const { doldur, kirp, kenarNoktalari, icNoktalar, karistir, acik, koyu, elips, gozler, cimTutami, kayalikKenar, yuvarlak, hatCiz } = window.ENGEL;
  const uz = (B, x, y) => window.engelUzaklik(B, x, y);
  // (x, y)'den yukarı biçimin içinde kalan boşluk
  const ustBosluk = (B, x, y, en = 140) => { let k = 0; while (k < en && uz(B, x, y - k - 2) < -2) k += 2; return k; };
  // Koyu kenar, dolgu ve ot tutamları (objelerin zemini)
  function yamaZemin(ctx, B, w, h, r, renk, tutam, yogun = 600) {
    doldur(ctx, B, koyu(renk, 0.45), 0, 0, 3);
    doldur(ctx, B, renk);
    if (tutam) kirp(ctx, B, () => { for (let i = 0; i < w * h / yogun; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 2, karistir(tutam, "#000000", r() * 0.3)); });
  }
  // (x, taban)'da gen × boy kutusu biçimin içinde kalana kadar küçültülür (en az %45); sığmazsa null
  function yapiSigdir(B, x, taban, gen, boy, pay = 2.5) {
    for (let k = 1; k >= 0.45; k -= 0.05) {
      const g = gen * k, b = boy * k;
      const noktalar = [[x - g / 2, taban], [x + g / 2, taban], [x - g / 2, taban - b], [x + g / 2, taban - b], [x, taban - b], [x - g / 2, taban - b / 2], [x + g / 2, taban - b / 2]];
      if (noktalar.every(([px, py]) => uz(B, px, py) < -pay)) return { g, b };
    }
    return null;
  }
  // (x, taban)'a oturan g × b kutusunun kenarındaki 14 nokta biçimin içinde mi
  function kutuIcinde(B, x, taban, g, b, pay) {
    for (let i = 0; i <= 4; i++) {
      const fx = x - g / 2 + (g * i) / 4;
      if (uz(B, fx, taban) > -pay || uz(B, fx, taban - b) > -pay) return false;
    }
    for (const f of [0.25, 0.5, 0.75]) if (uz(B, x - g / 2, taban - b * f) > -pay || uz(B, x + g / 2, taban - b * f) > -pay) return false;
    return true;
  }
  // Tek büyük yapı için yer: gen × boy kutusunun sığdığı en büyük ölçek (1 → 0,4); x ortadan yanlara, taban alttan
  // yukarı taranır. { x, taban, g, b } ya da sığmazsa null
  function enIyiYer(B, w, h, gen, boy, pay = 3) {
    for (let k = 1; k >= 0.4; k -= 0.05) {
      const g = gen * k, b = boy * k;
      for (const fx of [0.5, 0.44, 0.56, 0.38, 0.62, 0.32, 0.68]) {
        const x = w * fx;
        for (let taban = h - pay; taban - b > pay; taban -= 3) if (kutuIcinde(B, x, taban, g, b, pay)) return { x, taban, g, b };
      }
    }
    return null;
  }
  // Yapının çevresine süs koyarken kutuyla çakışmayan iç noktalar
  const disinda = (yer, pay = 4) => (k) => !yer || k.x < yer.x - yer.g / 2 - pay || k.x > yer.x + yer.g / 2 + pay || k.y < yer.taban - yer.b - pay || k.y > yer.taban + pay + 8;
  // Sevimli yüz: iki göz ve gülümseme (uykulu: kapalı göz yayları)
  function yuz(ctx, x, y, s, uykulu, renk = "#2a1a10") {
    ctx.strokeStyle = renk; ctx.fillStyle = renk; ctx.lineCap = "round"; ctx.lineWidth = Math.max(0.7, s * 0.12);
    if (uykulu) for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * s * 0.35, y, s * 0.17, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    else {
      gozler(ctx, x, y, s * 0.35, s * 0.13, renk);
      elips(ctx, x - s * 0.31, y - s * 0.06, s * 0.05, s * 0.05, "#ffffff"); elips(ctx, x + s * 0.39, y - s * 0.06, s * 0.05, s * 0.05, "#ffffff");
    }
    ctx.lineWidth = Math.max(0.7, s * 0.1); ctx.beginPath(); ctx.arc(x, y + s * 0.2, s * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }

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
    // Wawel ejderinin ağzından küçük alev pufları (k.yon: 1 sağa, −1 sola)
    ejderAlevi(ctx, x, y, zaman, n, k) {
      const yon = (k && k.yon) || 1, eski = ctx.globalAlpha;
      for (const ek of [0, 0.34, 0.67]) {
        const t = (zaman * 1.3 + n + ek) % 1, s = 1.4 + t * 3;
        ctx.globalAlpha = eski * (1 - t) * 0.95;
        elips(ctx, x + yon * t * 11, y - t * 4 + Math.sin(zaman * 9 + ek * 7) * 0.7, s, s * 0.8, t < 0.35 ? "#fde047" : t < 0.7 ? "#fb923c" : "#f87171");
      }
      ctx.globalAlpha = eski;
    },
    // Guguk kuşu: 4 sn'de bir kapağı açıp çıkar, biraz durur, saklanır (x, y kapağın ortası)
    guguk(ctx, x, y, zaman, n) {
      const t = (zaman * 0.25 + n) % 1;
      const c = t < 0.05 ? t / 0.05 : t < 0.2 ? 1 : t < 0.25 ? 1 - (t - 0.2) / 0.05 : 0;
      if (c <= 0) return;
      ctx.fillStyle = "#1c120a"; ctx.fillRect(x - 2.4, y - 2.4, 4.8, 4.8);
      const by = y + c * 2.2, s = 2.6 * (0.6 + 0.4 * c);
      elips(ctx, x, by + s * 0.3, s, s * 0.75, "#8a5a2b");
      elips(ctx, x, by - s * 0.45, s * 0.62, s * 0.58, "#a46a33");
      ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.moveTo(x - 0.9, by - s * 0.2); ctx.lineTo(x + 0.9, by - s * 0.2); ctx.lineTo(x, by + s * 0.5); ctx.closePath(); ctx.fill();
      elips(ctx, x - s * 0.25, by - s * 0.55, 0.45, 0.45, "#1c120a"); elips(ctx, x + s * 0.25, by - s * 0.55, 0.45, 0.45, "#1c120a");
    },
    // Yel değirmeni pervanesi: dört kafesli kanat yavaşça döner (x, y göbek; k.s kanat boyu)
    pervane(ctx, x, y, zaman, n, k) {
      const s = (k && k.s) || 10, a0 = zaman * 1.5 + n * 6.283;
      ctx.save(); ctx.translate(x, y);
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(a0 + (i * Math.PI) / 2);
        ctx.strokeStyle = "#4a3426"; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s); ctx.stroke();
        ctx.fillStyle = "rgba(246, 240, 226, 0.92)"; ctx.fillRect(0.5, -s, s * 0.3, s * 0.78);
        ctx.strokeStyle = "#6e5038"; ctx.lineWidth = 0.5; ctx.strokeRect(0.5, -s, s * 0.3, s * 0.78);
        for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(0.5, -s + j * s * 0.195); ctx.lineTo(0.5 + s * 0.3, -s + j * s * 0.195); ctx.stroke(); }
        ctx.restore();
      }
      elips(ctx, 0, 0, 1.7, 1.7, "#3a2a1e");
      ctx.restore();
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

  // ---------- UA: ayçiçeği tarlası ----------
  // Sıra sıra ayçiçekleri (sapı, yaprakları, sarı taç ve kahverengi göbek); bazılarında sevimli yüz
  function aycicegi(ctx, x, y, s, yuzlu, renk) {
    const ty = y - s * 1.45;
    ctx.strokeStyle = "#3f7a2a"; ctx.lineWidth = 1.4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ty); ctx.stroke();
    elips(ctx, x - 2.4, y - s * 0.55, 2.3, 1.1, "#4d8f2f"); elips(ctx, x + 2.4, y - s * 0.85, 2.3, 1.1, "#4d8f2f");
    elips(ctx, x + 1, ty + 1.5, s, s * 0.9, "rgba(0,0,0,0.2)");
    ctx.fillStyle = renk;
    for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * s * 0.62, ty + Math.sin(a) * s * 0.6, s * 0.4, s * 0.19, a, 0, Math.PI * 2); ctx.fill(); }
    elips(ctx, x, ty, s * 0.46, s * 0.46, "#6b3f1d");
    elips(ctx, x - s * 0.12, ty - s * 0.12, s * 0.18, s * 0.16, "#8a5a2b");
    if (yuzlu) yuz(ctx, x, ty - s * 0.05, s * 0.5, false, "#2a1608");
  }
  function aycicegiTarlasi(ctx, w, h, r, p, B) {
    const sari = p.vurgu1 || "#f5c518";
    yamaZemin(ctx, B, w, h, r, "#4f6b2a", "#7fa04a", 900);
    kirp(ctx, B, () => { ctx.strokeStyle = "rgba(60, 40, 20, 0.35)"; ctx.lineWidth = 3; for (let y = 10; y < h; y += 13) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } });
    for (let y = 13, j = 0; y < h - 2; y += 13, j++) for (let x = 7 + (j % 2) * 6.5; x < w - 3; x += 13) {
      if (uz(B, x, y) > -6 || uz(B, x, y - 12) > -6) continue;
      aycicegi(ctx, x, y, 4.6 + r() * 1.2, r() < 0.15, sari);
    }
    return [];
  }

  // ---------- UA: saman çatılı beyaz ev ve hasır çit ----------
  function samanCatiliEv(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#5a7431", "#8aa852", 650);
    ctx.save(); ctx.setLineDash([2.5, 1.6]);                                                             // hasır çit: hat boyunca içeride örgü
    hatCiz(ctx, B, "#8a6238", 3.2, 0, 0, -5); hatCiz(ctx, B, "#b98a52", 1.2, 0, 0, -5.6);
    ctx.restore();
    for (const k of kenarNoktalari(B, 10, -5)) { elips(ctx, k.x, k.y, 1.6, 1.6, "#5a3e22"); elips(ctx, k.x - 0.4, k.y - 0.5, 0.6, 0.6, "#a07a50"); }
    const evG = Math.min(84, w * 0.72), yer = enIyiYer(B, w, h, evG, evG * 0.72, 10);
    for (const k of icNoktalar(B, w, h, 8, 11, 16, r).filter(disinda(yer))) aycicegi(ctx, k.x, k.y + 3, 3.8, r() < 0.25, p.vurgu1 || "#f5c518");
    {
      if (yer) {
        const { g, b, x, taban } = yer, duvarB = b * 0.45, cy = taban - duvarB;
        elips(ctx, x + 2, taban + 1, g * 0.55, 3.5, "rgba(0,0,0,0.25)");
        ctx.fillStyle = "#f4f1ea"; yuvarlak(ctx, x - g * 0.42, cy, g * 0.84, duvarB, 3); ctx.fill();       // badanalı duvar
        ctx.fillStyle = "#c9b48a"; ctx.fillRect(x - g * 0.42, taban - 2.5, g * 0.84, 2.5);                   // toprak etek
        ctx.strokeStyle = "#2f6fa8"; ctx.lineWidth = 1.2; ctx.strokeRect(x - g * 0.42 + 1, cy + 1, g * 0.84 - 2, duvarB - 3);
        for (const dx of [-0.24, 0.24]) {                                                                   // mavi kepenkli pencereler
          const px = x + dx * g, pw = g * 0.12, ph = duvarB * 0.42, py = cy + duvarB * 0.22;
          ctx.fillStyle = "#cfe3f2"; ctx.fillRect(px - pw / 2, py, pw, ph);
          ctx.fillStyle = "#2f6fa8"; ctx.fillRect(px - pw / 2 - 2.2, py, 2, ph); ctx.fillRect(px + pw / 2 + 0.2, py, 2, ph);
          ctx.strokeStyle = "#7a5a3a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + ph); ctx.moveTo(px - pw / 2, py + ph / 2); ctx.lineTo(px + pw / 2, py + ph / 2); ctx.stroke();
          ctx.fillStyle = "#c8302a"; for (let i = 0; i < 3; i++) elips(ctx, px - pw / 2 + (i + 0.5) * pw / 3, py + ph + 1, 1, 1, "#c8302a");
        }
        ctx.fillStyle = "#6b4a2a"; yuvarlak(ctx, x - g * 0.06, cy + duvarB * 0.3, g * 0.12, duvarB * 0.7 - 2.5, 2); ctx.fill();   // kapı
        const ust = taban - b, catiG = g * 0.5;                                                             // kalın, yuvarlak saman çatı
        ctx.fillStyle = "#a07a3a"; ctx.beginPath(); ctx.moveTo(x - catiG - 3, cy + 2);
        ctx.quadraticCurveTo(x - catiG * 0.9, ust, x, ust); ctx.quadraticCurveTo(x + catiG * 0.9, ust, x + catiG + 3, cy + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#d4a957"; ctx.beginPath(); ctx.moveTo(x - catiG - 1, cy);
        ctx.quadraticCurveTo(x - catiG * 0.85, ust + 1.5, x, ust + 1.5); ctx.quadraticCurveTo(x + catiG * 0.85, ust + 1.5, x + catiG + 1, cy); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#9b7638"; ctx.lineWidth = 0.7;
        for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * catiG / 6.5, cy - 0.5); ctx.quadraticCurveTo(x + i * catiG / 9, ust + (cy - ust) * 0.35, x + i * catiG / 14, ust + 3); ctx.stroke(); }
        ctx.strokeStyle = "#7d5a28"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - catiG - 1, cy + 0.5); ctx.lineTo(x + catiG + 1, cy + 0.5); ctx.stroke();
      }
    }
    return [];
  }

  // ---------- PL: Wawel ejderi ----------
  // Kireçtaşı tepe, sevimli yeşil ejder; ağzından canlı alev pufları
  function wawelEjderi(ctx, w, h, r, p, B) {
    const tas = "#b9b29e", canli = [];
    doldur(ctx, B, koyu(tas, 0.45), 0, 0, 3);
    kayalikKenar(ctx, B, koyu(tas, 0.1), r, 9, 1, 6);
    doldur(ctx, B, tas);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 500; i++) elips(ctx, r() * w, r() * h, 2 + r() * 4, 1.4 + r() * 2.4, r() < 0.5 ? acik(tas, 0.15) : koyu(tas, 0.12));
      for (let i = 0; i < w * h / 900; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 2, "#6f8f3a");
    });
    // ejder kutusu: kuyruktan burna ~3,4 s, kanat ucundan ayağa ~2,6 s; s en çok 26
    const S = Math.min(26, Math.min(w, h) * 0.24), yer = enIyiYer(B, w, h, S * 3.6, S * 2.7, 5);
    if (!yer) return canli;
    const s = (yer.g / 3.6), x = yer.x - s * 0.15, y = yer.taban - s * 0.95;
    const yesil = "#4fa84a", koyuY = "#2f7a33";
    if (yer.b > 40) {                                                                              // arkada ejder mağarası (Smok jamesi)
      const mx = x - s * 0.2, my = yer.taban - yer.b + s * 0.95;
      elips(ctx, mx, my + 2, s * 1.05, s * 0.75, koyu(tas, 0.35));
      ctx.fillStyle = "#2a2622"; ctx.beginPath(); ctx.moveTo(mx - s * 0.7, my + s * 0.55); ctx.quadraticCurveTo(mx - s * 0.7, my - s * 0.55, mx, my - s * 0.6);
      ctx.quadraticCurveTo(mx + s * 0.7, my - s * 0.55, mx + s * 0.7, my + s * 0.55); ctx.closePath(); ctx.fill();
    }
    elips(ctx, x + s * 0.2, y + s * 0.85, s * 1.35, s * 0.35, "rgba(0,0,0,0.25)");
    ctx.strokeStyle = koyuY; ctx.lineWidth = s * 0.32; ctx.lineCap = "round";                     // kuyruk
    ctx.beginPath(); ctx.moveTo(x - s * 0.7, y + s * 0.4); ctx.quadraticCurveTo(x - s * 1.5, y + s * 0.6, x - s * 1.3, y - s * 0.1); ctx.stroke();
    ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.moveTo(x - s * 1.3, y - s * 0.55); ctx.lineTo(x - s * 1.05, y - s * 0.05); ctx.lineTo(x - s * 1.55, y - s * 0.05); ctx.closePath(); ctx.fill();
    ctx.fillStyle = koyuY;                                                                         // kanatlar
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * s * 0.1, y - s * 0.5); ctx.quadraticCurveTo(x + sx * s * 0.9, y - s * 1.5, x + sx * s * 1.05, y - s * 0.6); ctx.quadraticCurveTo(x + sx * s * 0.6, y - s * 0.75, x + sx * s * 0.3, y - s * 0.2); ctx.closePath(); ctx.fill(); }
    elips(ctx, x, y, s * 0.95, s * 0.78, yesil);                                                   // gövde
    elips(ctx, x + s * 0.1, y + s * 0.18, s * 0.55, s * 0.5, "#c9e7a5");
    ctx.fillStyle = "#f59e0b";                                                                     // sırt dikenleri
    for (let i = 0; i < 4; i++) { const a = Math.PI * (1.15 + i * 0.17), px = x + Math.cos(a) * s * 0.9, py = y + Math.sin(a) * s * 0.74; ctx.beginPath(); ctx.moveTo(px - 1.5, py + 1); ctx.lineTo(px + Math.cos(a) * 3, py + Math.sin(a) * 3); ctx.lineTo(px + 1.5, py + 1); ctx.closePath(); ctx.fill(); }
    for (const sx of [-0.45, 0.45]) elips(ctx, x + sx * s, y + s * 0.68, s * 0.24, s * 0.16, koyuY);   // ayaklar
    const hx = x + s * 0.75, hy = y - s * 0.62;                                                     // baş ve burun
    elips(ctx, hx, hy, s * 0.55, s * 0.5, yesil);
    elips(ctx, hx + s * 0.45, hy + s * 0.1, s * 0.38, s * 0.28, yesil);
    elips(ctx, hx + s * 0.72, hy + s * 0.02, s * 0.05, s * 0.05, koyuY);
    ctx.fillStyle = "#f4e3b0";                                                                     // boynuzlar
    for (const sx of [-0.22, 0.12]) { ctx.beginPath(); ctx.moveTo(hx + sx * s - 1.4, hy - s * 0.38); ctx.lineTo(hx + sx * s - 0.5, hy - s * 0.78); ctx.lineTo(hx + sx * s + 1.4, hy - s * 0.38); ctx.closePath(); ctx.fill(); }
    gozler(ctx, hx - s * 0.05, hy - s * 0.1, s * 0.17, s * 0.12, "#ffffff", "#1f2937");
    ctx.strokeStyle = "#1f3a1f"; ctx.lineWidth = Math.max(0.7, s * 0.07); ctx.beginPath(); ctx.arc(hx + s * 0.38, hy + s * 0.12, s * 0.2, 0.1 * Math.PI, 0.7 * Math.PI); ctx.stroke();
    canli.push({ tur: "ejderAlevi", x: hx + s * 0.85, y: hy + s * 0.12, n: r(), yon: 1 });
    return canli;
  }

  // ---------- PL: direk üstünde leylek yuvaları ----------
  function leylekYuvalari(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#5d7a35", "#8bab55", 600);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 450; i++) elips(ctx, r() * w, r() * h, 0.9, 0.9, r() < 0.5 ? "#f4f1ea" : "#f2c94c"); });
    // ilk yuva en uzun dikey boşlukta (küçük yamada da büyük görünsün), ötekiler serpiştirilir
    const ana = enIyiYer(B, w, h, 22, Math.min(62, h * 0.85), 4);
    const serpili = icNoktalar(B, w, h, Math.max(0, Math.min(3, Math.round(w * h / 3800) - 1)), 14, 30, r);
    const yerler = ana ? [{ x: ana.x, y: ana.taban - 8 }, ...serpili.filter(disinda(ana, 8))] : serpili;
    for (const k of yerler) {
      // ölçek boşluğa göre (en çok 1,35): leylek yuvanın ~12 birim üstüne çıkar, üst kenardan taşmaz
      const taban = k.y + 8, bos = ustBosluk(B, k.x, taban), olc = Math.min(1.35, (bos - 4) / 40);
      if (olc < 0.55) continue;
      const boy = Math.min(46, bos - 4 - 12 * olc), x = k.x, ust = taban - boy;
      ctx.save(); ctx.translate(x, ust); ctx.scale(olc, olc); ctx.translate(-x, -ust);
      elips(ctx, x + 3, ust + boy / olc, 5, 1.8, "rgba(0,0,0,0.25)");
      ctx.strokeStyle = "#6b4a2a"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x, ust + boy / olc); ctx.lineTo(x, ust + 2); ctx.stroke();
      ctx.strokeStyle = "#8a6238"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 0.6, ust + boy / olc); ctx.lineTo(x - 0.6, ust + 2); ctx.stroke();
      elips(ctx, x, ust + 2.5, 8, 3.4, "#6b4a2a");                                                   // yuva
      ctx.strokeStyle = "#a07a46"; ctx.lineWidth = 0.7;
      for (let i = 0; i < 9; i++) { const a = r() * Math.PI; ctx.beginPath(); ctx.moveTo(x - 8 + i * 2, ust + 2 + Math.sin(a)); ctx.lineTo(x - 6 + i * 2 + r() * 2, ust + 4 - r() * 2); ctx.stroke(); }
      const yon = r() < 0.5 ? -1 : 1, by = ust - 1.5;                                                // leylek
      elips(ctx, x, by, 4.4, 2.8, "#f8fafc");
      elips(ctx, x - yon * 2.2, by + 0.6, 2.6, 1.6, "#1f2937");
      ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + yon * 2.5, by - 1); ctx.quadraticCurveTo(x + yon * 3.5, by - 4, x + yon * 2.8, by - 6.5); ctx.stroke();
      elips(ctx, x + yon * 2.8, by - 7.2, 1.7, 1.5, "#f8fafc");
      ctx.fillStyle = "#e4572e"; ctx.beginPath(); ctx.moveTo(x + yon * 4.2, by - 7.6); ctx.lineTo(x + yon * 8, by - 6.4); ctx.lineTo(x + yon * 4.2, by - 6.6); ctx.closePath(); ctx.fill();
      elips(ctx, x + yon * 3.1, by - 7.5, 0.45, 0.45, "#1f2937");
      ctx.restore();
    }
    return [];
  }

  // ---------- DE: guguklu saat evi ----------
  // Kara Orman: köknar ağaçları; ön cephesinde dev saat, çatı üçgeninde guguk kapağı (canlı), zincirli kozalak ağırlıklar
  function kokar(ctx, x, y, s) {
    elips(ctx, x + 1, y + 0.5, s * 0.7, s * 0.22, "rgba(0,0,0,0.25)");
    for (const [k, renk] of [[1, "#1f4d2c"], [0.7, "#2a6438"], [0.42, "#357a44"]]) {
      ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x - s * 0.55 * k, y - s * (1 - k) * 1.1); ctx.lineTo(x, y - s * (1 - k) * 1.1 - s * 0.9 * k); ctx.lineTo(x + s * 0.55 * k, y - s * (1 - k) * 1.1); ctx.closePath(); ctx.fill();
    }
  }
  function gugukluSaatEvi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#2f4d26", "#4f7a3a", 700);
    const canli = [], evG = Math.min(68, w * 0.62), ev = enIyiYer(B, w, h, evG, evG * 1.12, 5);
    for (const k of icNoktalar(B, w, h, 8, 7, 14, r).filter(disinda(ev, 2))) { const s = Math.min(14, ustBosluk(B, k.x, k.y) - 2); if (s > 6) kokar(ctx, k.x, k.y, s); }
    {
      if (ev) {
        const { g, b, x, taban } = ev, ahsap = "#7a4a22", oyma = "#f1e3c4";
        const cepheB = b * 0.62, cy = taban - cepheB, ust = taban - b;
        elips(ctx, x + 2, taban + 1, g * 0.55, 3.5, "rgba(0,0,0,0.3)");
        ctx.fillStyle = ahsap; ctx.fillRect(x - g * 0.4, cy, g * 0.8, cepheB);                           // ahşap cephe
        ctx.strokeStyle = koyu(ahsap, 0.25); ctx.lineWidth = 0.8;
        for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - g * 0.4 + (i * g * 0.8) / 6, cy); ctx.lineTo(x - g * 0.4 + (i * g * 0.8) / 6, taban); ctx.stroke(); }
        ctx.fillStyle = "#5a3418"; ctx.beginPath(); ctx.moveTo(x - g * 0.52, cy + 1.5); ctx.lineTo(x, ust); ctx.lineTo(x + g * 0.52, cy + 1.5); ctx.closePath(); ctx.fill();   // çatı
        ctx.fillStyle = ahsap; ctx.beginPath(); ctx.moveTo(x - g * 0.4, cy + 0.5); ctx.lineTo(x, ust + 4); ctx.lineTo(x + g * 0.4, cy + 0.5); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = oyma; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - g * 0.52, cy + 1.5); ctx.lineTo(x, ust); ctx.lineTo(x + g * 0.52, cy + 1.5); ctx.stroke();
        for (let i = 1; i < 6; i++) { const tx = x - g * 0.52 + (i * g * 0.52) / 6, ty = cy + 1.5 - ((cy + 1.5 - ust) * i) / 6; elips(ctx, tx, ty + 1.6, 1.1, 1.4, oyma); elips(ctx, 2 * x - tx, ty + 1.6, 1.1, 1.4, oyma); }
        const kr = Math.min(g * 0.24, cepheB * 0.3), kx = x, ky = cy + kr + 3;                    // saat
        elips(ctx, kx, ky, kr + 2, kr + 2, oyma); elips(ctx, kx, ky, kr, kr, "#fffaf0");
        ctx.strokeStyle = "#2a1a10"; ctx.lineWidth = 0.8;
        for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(kx + Math.cos(a) * kr * 0.78, ky + Math.sin(a) * kr * 0.78); ctx.lineTo(kx + Math.cos(a) * kr * 0.92, ky + Math.sin(a) * kr * 0.92); ctx.stroke(); }
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx, ky - kr * 0.65); ctx.moveTo(kx, ky); ctx.lineTo(kx + kr * 0.45, ky + kr * 0.15); ctx.stroke();
        const dy = (ust + 4 + cy) / 2 + 1;                                                         // guguk kapağı
        ctx.fillStyle = koyu(ahsap, 0.3); ctx.fillRect(kx - 2.8, dy - 2.8, 5.6, 5.6);
        ctx.fillStyle = acik(ahsap, 0.15); ctx.fillRect(kx - 2.2, dy - 2.2, 4.4, 4.4);
        canli.push({ tur: "guguk", x: kx, y: dy, n: r() });
        ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 0.7;                                           // zincirler ve kozalaklar
        for (const sx of [-0.22, 0.22]) {
          const zx = kx + sx * g, zy = ky + kr + 2;
          ctx.beginPath(); ctx.moveTo(zx, zy); ctx.lineTo(zx, taban - 6); ctx.stroke();
          elips(ctx, zx, taban - 4, 1.8, 3, "#5a3418"); ctx.strokeStyle = "#3a2210"; ctx.lineWidth = 0.5;
          for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(zx - 1.6, taban - 6 + j * 1.6); ctx.lineTo(zx + 1.6, taban - 5 + j * 1.6); ctx.stroke(); }
          ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 0.7;
        }
        ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(kx, ky + kr + 2); ctx.lineTo(kx, taban - 7); ctx.stroke();   // sarkaç
        elips(ctx, kx, taban - 6, 2.4, 2.4, "#d4a73a");
        for (const sx of [-0.33, 0.33]) for (let i = 0; i < 3; i++) elips(ctx, x + sx * g + (i - 1) * 2, cy + 2.5, 1.1, 1.1, "#c8302a");   // sardunyalar
      }
    }
    return canli;
  }

  // ---------- DE: yarım ahşap evler ----------
  // Beyaz sıva, koyu ahşap iskelet (çapraz dikmeler), dik kırmızı çatı, çiçekli pencereler
  function yarimAhsapEv(ctx, x, taban, g, b, catiRenk) {
    const cepheB = b * 0.6, cy = taban - cepheB, ust = taban - b, kiris = "#4a2c18";
    elips(ctx, x + 2, taban + 0.5, g * 0.55, 2.5, "rgba(0,0,0,0.25)");
    ctx.fillStyle = "#f3ead8"; ctx.fillRect(x - g / 2, cy, g, cepheB);
    ctx.strokeStyle = kiris; ctx.lineWidth = 1.5; ctx.strokeRect(x - g / 2, cy, g, cepheB);
    const kat = cy + cepheB * 0.5;
    ctx.beginPath(); ctx.moveTo(x - g / 2, kat); ctx.lineTo(x + g / 2, kat); ctx.stroke();
    ctx.lineWidth = 1.1;
    for (const f of [-0.5, -0.17, 0.17, 0.5]) { ctx.beginPath(); ctx.moveTo(x + f * g, cy); ctx.lineTo(x + f * g, taban); ctx.stroke(); }
    for (const [a, c] of [[-0.5, -0.17], [0.17, 0.5]]) { ctx.beginPath(); ctx.moveTo(x + a * g, kat); ctx.lineTo(x + c * g, cy); ctx.moveTo(x + c * g, kat); ctx.lineTo(x + a * g, cy); ctx.stroke(); }
    for (const f of [-0.33, 0.33]) {                                                                // alt kat pencereleri ve çiçekler
      const px = x + f * g, pw = g * 0.13, ph = cepheB * 0.24, py = kat + cepheB * 0.1;
      ctx.fillStyle = "#9cc3e6"; ctx.fillRect(px - pw / 2, py, pw, ph);
      ctx.strokeStyle = kiris; ctx.lineWidth = 0.6; ctx.strokeRect(px - pw / 2, py, pw, ph);
      ctx.fillStyle = "#3f7a2a"; ctx.fillRect(px - pw / 2 - 0.5, py + ph, pw + 1, 1.4);
      for (let i = 0; i < 3; i++) elips(ctx, px - pw / 2 + (i + 0.5) * pw / 3, py + ph, 0.9, 0.9, "#e0452e");
    }
    ctx.fillStyle = kiris; ctx.fillRect(x - g * 0.06, taban - cepheB * 0.32, g * 0.12, cepheB * 0.32);
    ctx.fillStyle = koyu(catiRenk, 0.25); ctx.beginPath(); ctx.moveTo(x - g / 2 - 2, cy + 1); ctx.lineTo(x, ust); ctx.lineTo(x + g / 2 + 2, cy + 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = catiRenk; ctx.beginPath(); ctx.moveTo(x - g / 2 - 0.5, cy); ctx.lineTo(x, ust + 2); ctx.lineTo(x + g / 2 + 0.5, cy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = koyu(catiRenk, 0.3); ctx.lineWidth = 0.5;
    for (let i = 1; i < 5; i++) { const yy = cy - ((cy - ust - 2) * i) / 5, yar = ((g / 2) * (5 - i)) / 5; ctx.beginPath(); ctx.moveTo(x - yar, yy); ctx.lineTo(x + yar, yy); ctx.stroke(); }
    ctx.fillStyle = "#f3ead8"; ctx.fillRect(x - 1.6, (ust + cy) / 2 + 1, 3.2, 3.2);
  }
  function yarimAhsapEvler(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#55693a", "#7f9a52", 800);
    // 1–3 evlik sıra: sıranın kutusu yamaya sığan en büyük ölçekte; evler yan yana, ortadaki biraz uzun
    const n = Math.max(1, Math.min(3, Math.floor(w / 40))), sira = enIyiYer(B, w, h, Math.min(w * 0.86, n * 36), 50, 5);
    if (!sira) return [];
    const g = sira.g / n, catilar = ["#b5432a", "#9c3a26", "#c25a33"];
    for (let i = 0; i < n; i++) {
      const x = sira.x - sira.g / 2 + g * (i + 0.5), uzun = n === 3 && i === 1 ? 1 : 0.88;
      yarimAhsapEv(ctx, x, sira.taban, g * 0.94, sira.b * uzun, catilar[i % 3]);
    }
    return [];
  }

  // ---------- GB: kırmızı telefon kulübeleri ----------
  // Kaldırım taşları; kubbeli kırmızı kulübeler: önde camlı kapı ızgarası, yanda gölgeli yan yüz; yazı ve arma yok
  function telefonKulubesi(ctx, x, taban, g, b, renk) {
    const yan = g * 0.28, ust = taban - b;
    elips(ctx, x + g * 0.35, taban + 0.5, g * 0.75, 2.4, "rgba(0,0,0,0.3)");
    ctx.fillStyle = koyu(renk, 0.3); ctx.beginPath(); ctx.moveTo(x + g / 2, taban); ctx.lineTo(x + g / 2 + yan, taban - yan * 0.6);
    ctx.lineTo(x + g / 2 + yan, ust + 2 - yan * 0.6); ctx.lineTo(x + g / 2, ust + 2); ctx.closePath(); ctx.fill();      // yan yüz
    ctx.fillStyle = renk; yuvarlak(ctx, x - g / 2, ust + 2, g, b - 2, 1.5); ctx.fill();                                  // ön yüz
    ctx.fillStyle = acik(renk, 0.1); ctx.beginPath(); ctx.moveTo(x - g / 2 - 0.8, ust + 3); ctx.quadraticCurveTo(x, ust - 2.5, x + g / 2 + 0.8, ust + 3); ctx.closePath(); ctx.fill();   // kubbe
    ctx.fillStyle = "#1f2328"; ctx.fillRect(x - g * 0.38, ust + 3.6, g * 0.76, b * 0.07);                                // boş tabela şeridi
    ctx.fillStyle = "#f4f1ea"; ctx.fillRect(x - g * 0.3, ust + 3.6 + b * 0.015, g * 0.6, b * 0.04);
    const cx0 = x - g * 0.34, cy0 = ust + 4 + b * 0.1, cw = g * 0.68, ch = b * 0.55;                                    // cam ızgarası
    ctx.fillStyle = "#cfe4f2"; ctx.fillRect(cx0, cy0, cw, ch);
    ctx.strokeStyle = renk; ctx.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx0 + (i * cw) / 3, cy0); ctx.lineTo(cx0 + (i * cw) / 3, cy0 + ch); ctx.stroke(); }
    for (let j = 1; j < 6; j++) { ctx.beginPath(); ctx.moveTo(cx0, cy0 + (j * ch) / 6); ctx.lineTo(cx0 + cw, cy0 + (j * ch) / 6); ctx.stroke(); }
    ctx.strokeStyle = koyu(renk, 0.35); ctx.lineWidth = 0.7; ctx.strokeRect(x - g / 2 + 0.5, ust + 2.5, g - 1, b - 3);
    elips(ctx, x + g * 0.28, cy0 + ch * 0.6, 0.7, 1.2, "#d4a73a");
  }
  function telefonKulubeleri(ctx, w, h, r, p, B) {
    const tas = "#8f8f88";
    doldur(ctx, B, koyu(tas, 0.45), 0, 0, 3);
    doldur(ctx, B, tas);
    kirp(ctx, B, () => {                                                                             // kaldırım taşları
      ctx.strokeStyle = koyu(tas, 0.2); ctx.lineWidth = 1;
      for (let y = 9; y < h; y += 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let y = 0, j = 0; y < h; y += 10, j++) for (let x = (j % 2) * 7; x < w; x += 14) { ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x, y + 9); ctx.stroke(); }
      for (let i = 0; i < w * h / 700; i++) elips(ctx, r() * w, r() * h, 1.5 + r() * 2, 1 + r(), "rgba(255,255,255,0.08)");
    });
    // kulübeler yan yana bir sıra (2–3) ya da tek; sıra kutusu yamaya sığan en büyük ölçekte
    const kirmizi = p.vurgu1 || "#c8102e", n = Math.max(1, Math.min(3, Math.floor(w / 32)));
    const sira = enIyiYer(B, w, h, Math.min(w * 0.8, n * 26), 46, 4);
    if (!sira) return [];
    const g = sira.g / n;
    for (let i = 0; i < n; i++) telefonKulubesi(ctx, sira.x - sira.g / 2 + g * (i + 0.42), sira.taban - (i % 2) * 2, g * 0.62, sira.b - (i % 2) * 2, kirmizi);
    return [];
  }

  // ---------- GB: saat kulesi maketi ----------
  // Çim ve yol; kumtaşı gövde, dikey nervürler, dört yüzlü saat, sivri arduvaz külah ve köşe külahçıklar
  function saatKulesi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#4f7a36", "#79a552", 700);
    const kb = Math.min(110, h * 0.9), yer = enIyiYer(B, w, h, kb * 0.25, kb, 4);
    if (!yer) return [];
    kirp(ctx, B, () => { ctx.fillStyle = "#cdbf9c"; ctx.fillRect(yer.x - 6, yer.taban - 2, 12, h); });     // yol
    const { g, b, x, taban } = yer, tas = p.vurgu2 || "#d9c27a", ust = taban - b;
    const gov = g * 0.62, saatY = ust + b * 0.36, saatR = gov * 0.36;
    elips(ctx, x + 3, taban + 1, g * 0.6, 2.8, "rgba(0,0,0,0.3)");
    ctx.fillStyle = koyu(tas, 0.15); ctx.fillRect(x - g / 2, taban - b * 0.12, g, b * 0.12);              // taban
    ctx.fillStyle = tas; ctx.fillRect(x - gov / 2, ust + b * 0.18, gov, b * 0.72);                          // gövde
    ctx.fillStyle = koyu(tas, 0.18); ctx.fillRect(x + gov * 0.18, ust + b * 0.18, gov * 0.32, b * 0.72);    // gölgeli yan
    ctx.strokeStyle = koyu(tas, 0.35); ctx.lineWidth = 0.7;
    for (const f of [-0.3, -0.1, 0.1, 0.3]) { ctx.beginPath(); ctx.moveTo(x + f * gov, saatY + saatR + 3); ctx.lineTo(x + f * gov, taban - b * 0.12); ctx.stroke(); }
    for (let y = saatY + saatR + 8; y < taban - b * 0.12; y += 7) { ctx.beginPath(); ctx.moveTo(x - gov / 2, y); ctx.lineTo(x + gov / 2, y); ctx.stroke(); }
    ctx.fillStyle = koyu(tas, 0.1); ctx.fillRect(x - gov / 2 - 1.5, saatY - saatR - 2.5, gov + 3, saatR * 2 + 5);   // saat odası
    elips(ctx, x, saatY, saatR + 1, saatR + 1, "#d4a73a"); elips(ctx, x, saatY, saatR, saatR, "#fbf7ea");
    ctx.strokeStyle = "#1f2328"; ctx.lineWidth = 0.6;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * saatR * 0.75, saatY + Math.sin(a) * saatR * 0.75); ctx.lineTo(x + Math.cos(a) * saatR * 0.92, saatY + Math.sin(a) * saatR * 0.92); ctx.stroke(); }
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, saatY); ctx.lineTo(x - saatR * 0.1, saatY - saatR * 0.65); ctx.moveTo(x, saatY); ctx.lineTo(x + saatR * 0.5, saatY + saatR * 0.1); ctx.stroke();
    const kemerY = ust + b * 0.18;                                                                       // çan katı kemerleri
    ctx.fillStyle = koyu(tas, 0.45);
    for (const f of [-0.25, 0, 0.25]) { yuvarlak(ctx, x + f * gov - 1.3, kemerY + 1.5, 2.6, saatY - saatR - kemerY - 4.5, 1.3); ctx.fill(); }
    const kulah = "#46515c";                                                                             // sivri külah ve köşe külahçıkları
    ctx.fillStyle = kulah; ctx.beginPath(); ctx.moveTo(x - gov / 2 - 1, kemerY + 0.5); ctx.lineTo(x, ust); ctx.lineTo(x + gov / 2 + 1, kemerY + 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = acik(kulah, 0.2); ctx.beginPath(); ctx.moveTo(x - gov / 2 - 1, kemerY + 0.5); ctx.lineTo(x, ust); ctx.lineTo(x - gov * 0.1, kemerY + 0.5); ctx.closePath(); ctx.fill();
    for (const sx of [-1, 1]) { ctx.fillStyle = kulah; ctx.beginPath(); ctx.moveTo(x + sx * gov / 2 - 1.6, kemerY + 1); ctx.lineTo(x + sx * gov / 2, kemerY - 5); ctx.lineTo(x + sx * gov / 2 + 1.6, kemerY + 1); ctx.closePath(); ctx.fill(); }
    elips(ctx, x, ust + 1, 0.9, 0.9, "#d4a73a");
    return [];
  }

  // ---------- FR: Eyfel Kulesi maketi ----------
  // Kafes gövde: tabanda kemerli dört ayak, iki seyir katı, incelen kule ve anten; çevrede çakıl ve çim
  function eyfelKulesi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#cdbb94", null);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 160; i++) elips(ctx, r() * w, r() * h, 0.8, 0.7, r() < 0.5 ? "#b8a57c" : "#e0d2ad");
      ctx.fillStyle = "#5d8a3a"; for (const f of [0.18, 0.82]) { ctx.beginPath(); ctx.ellipse(w * f, h * 0.62, w * 0.16, h * 0.22, 0, 0, Math.PI * 2); ctx.fill(); }
    });
    const kb = Math.min(118, h * 0.92), yer = enIyiYer(B, w, h, kb * 0.5, kb, 4);
    if (!yer) return [];
    const { g, b, x, taban } = yer, ust = taban - b, demir = "#6e5a46";
    const kat1 = taban - b * 0.24, kat2 = taban - b * 0.5, kat3 = taban - b * 0.86;
    const gen = (y) => (g / 2) * Math.pow((y - ust) / b, 1.6);                                            // yükseklikte yarı genişlik
    elips(ctx, x + 3, taban + 1, g * 0.6, 2.8, "rgba(0,0,0,0.3)");
    ctx.lineCap = "round"; ctx.strokeStyle = demir;                                                       // kafes çaprazları (önce, ince)
    ctx.lineWidth = 0.6;
    for (let y = kat3 + 2; y < taban - 1; y += 4) {
      const a = gen(y), c = gen(Math.min(taban, y + 4));
      if (y > kat1) { ctx.beginPath(); ctx.moveTo(x - a, y); ctx.lineTo(x - c * 0.55, y + 4); ctx.moveTo(x + a, y); ctx.lineTo(x + c * 0.55, y + 4); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(x - a, y); ctx.lineTo(x + c, y + 4); ctx.moveTo(x + a, y); ctx.lineTo(x - c, y + 4); ctx.stroke(); }
    }
    for (const [y0, y1, k] of [[taban, kat1, 2.6], [kat1, kat2, 2], [kat2, kat3, 1.5], [kat3, ust + 2, 1.1]]) {   // ayaklar: yukarı inceliyor
      ctx.lineWidth = k;
      for (const sx of [-1, 1]) { ctx.beginPath(); for (let y = y0; y >= y1; y -= 2) ctx.lineTo(x + sx * gen(y), y); ctx.lineTo(x + sx * gen(y1), y1); ctx.stroke(); }
    }
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - gen(taban) * 0.82, taban); ctx.quadraticCurveTo(x, kat1 - b * 0.06, x + gen(taban) * 0.82, taban); ctx.stroke();   // taban kemeri
    for (const [yy, ek] of [[kat1, 3], [kat2, 2], [kat3, 1.2]]) {                                          // seyir katları
      ctx.fillStyle = koyu(demir, 0.25); ctx.fillRect(x - gen(yy) - ek, yy - 1.6, (gen(yy) + ek) * 2, 3);
      for (let i = -2; i <= 2; i++) elips(ctx, x + (i * (gen(yy) + ek)) / 2.5, yy - 0.2, 0.5, 0.5, "#e8c35a");
    }
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, ust + 3); ctx.lineTo(x, ust); ctx.stroke();       // anten
    return [];
  }

  // ---------- FR: lavanta tarlası ----------
  // Hafif kavisli mor sıralar, aralarında toprak yolları
  function lavantaTarlasi(ctx, w, h, r, p, B) {
    const mor = p.vurgu1 || "#8e6cc2";
    yamaZemin(ctx, B, w, h, r, "#7a5a3a", null);
    kirp(ctx, B, () => {
      for (let y = 8, j = 0; y < h + 8; y += 11, j++) {
        const kavis = (x) => y + Math.sin((x / w) * Math.PI) * 3;
        ctx.strokeStyle = "#3f6a2c"; ctx.lineWidth = 7; ctx.lineCap = "round";
        ctx.beginPath(); for (let x = -4; x <= w + 4; x += 6) ctx.lineTo(x, kavis(x) + 1.5); ctx.stroke();
        for (let x = (j % 2) * 3; x < w + 4; x += 4.2) {
          const yy = kavis(x);
          elips(ctx, x, yy, 2.6 + r() * 0.6, 2.2, karistir(mor, "#3b2a5c", 0.25 + r() * 0.15));
          elips(ctx, x - 0.6, yy - 0.8, 1.5, 1.2, karistir(mor, "#ffffff", 0.2 + r() * 0.2));
        }
      }
    }, 0, 0, -1.5);
    return [];
  }

  // ---------- IT: Kolezyum ----------
  // Oval amfitiyatro: önde üç kat kemerli traverten cephe, içte basamaklı tribünler ve kum arena; bir yanı yıkık
  function kolezyum(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#9c8a5c", "#b5a46a", 900);
    const kg = Math.min(130, w * 0.9), yer = enIyiYer(B, w, h, kg, kg * 0.66, 4);
    if (!yer) return [];
    const { g, b } = yer, cx = yer.x, rx = g / 2, ry = b * 0.38, yuk = b * 0.3, cy = yer.taban - ry;
    const tas = "#d9c49a", ic = "#bfa77a";
    elips(ctx, cx + 3, cy + ry + 1, rx, ry * 0.5, "rgba(0,0,0,0.25)");
    ctx.fillStyle = koyu(tas, 0.12);                                                                   // ön cephe şeridi
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); ctx.lineTo(cx - rx, cy - yuk); ctx.ellipse(cx, cy - yuk, rx, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); ctx.lineTo(cx - rx, cy - yuk); ctx.ellipse(cx, cy - yuk, rx, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.clip();
    for (let kat = 0; kat < 3; kat++) {                                                                   // üç kat kemer
      const k0 = (kat / 3) * yuk, kh = yuk / 3;
      for (let i = 1; i < 16; i++) {
        const a = (i / 16) * Math.PI, ax = cx + Math.cos(a) * rx, ay = cy + Math.sin(a) * ry - k0, en = Math.max(1.2, Math.sin(a) * rx * 0.12);
        ctx.fillStyle = "#5a4630"; yuvarlak(ctx, ax - en / 2, ay - kh + 1.2, en, kh - 1.8, en / 2); ctx.fill();
      }
      ctx.strokeStyle = koyu(tas, 0.3); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(cx, cy - k0, rx, ry, 0, 0, Math.PI); ctx.stroke();
    }
    ctx.restore();
    elips(ctx, cx, cy - yuk, rx, ry, tas);                                                                // üst kenar ve tribünler
    for (let i = 1; i <= 4; i++) elips(ctx, cx, cy - yuk + i * 0.6, rx * (1 - i * 0.1), ry * (1 - i * 0.1), i % 2 ? ic : koyu(ic, 0.08));
    elips(ctx, cx, cy - yuk + 3, rx * 0.5, ry * 0.5, "#e6cf98");                                          // arena
    ctx.strokeStyle = koyu("#e6cf98", 0.2); ctx.lineWidth = 0.6;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * rx * 0.15, cy - yuk + 3 - ry * 0.4); ctx.lineTo(cx + i * rx * 0.15, cy - yuk + 3 + ry * 0.4); ctx.stroke(); }
    ctx.fillStyle = "#9c8a5c";                                                                            // yıkık sağ üst kenar
    ctx.beginPath(); ctx.moveTo(cx + rx * 0.55, cy - yuk - ry * 0.83);
    for (let i = 0; i <= 6; i++) { const a = -Math.PI * 0.32 + (i / 6) * Math.PI * 0.32; ctx.lineTo(cx + Math.cos(a) * (rx + 1), cy - yuk + Math.sin(a) * (ry + 1) + (i % 2 ? 2.5 : 0)); }
    ctx.lineTo(cx + rx * 0.82, cy - yuk - ry * 0.3); ctx.closePath(); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
    return [];
  }

  // ---------- IT: gondollu kanal iskelesi ----------
  // Ahşap iskele; yamanın içinde taş kenarlı kanal şeridi, şeritte siyah gondol, çizgili bağlama direkleri
  function gondolIskelesi(ctx, w, h, r, p, B) {
    const ahsap = "#9a6a3a";
    doldur(ctx, B, koyu(ahsap, 0.45), 0, 0, 3);
    doldur(ctx, B, ahsap);
    const ky = h * 0.55, kh = Math.max(12, Math.min(22, h * 0.3));
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(ahsap, 0.3); ctx.lineWidth = 1;                                              // tahtalar
      for (let x = 0; x < w; x += 7) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let i = 0; i < w * h / 300; i++) { const x = Math.floor(r() * w / 7) * 7 + 3.5, y = r() * h; elips(ctx, x, y, 0.6, 0.6, koyu(ahsap, 0.4)); }
      ctx.fillStyle = "#8f8a80"; ctx.fillRect(0, ky - kh / 2 - 3, w, kh + 6);                             // taş kenarlar
      ctx.fillStyle = "#1e7fd6"; ctx.fillRect(0, ky - kh / 2, w, kh);                                      // kanal (her yerde aynı mavi)
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 0.8;
      for (let y = ky - kh / 2 + 3; y < ky + kh / 2; y += 4) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 7 + y) * 0.8); ctx.stroke(); }
      const gx = w / 2, gl = Math.min(w * 0.38, 46), gy = ky;                                             // gondol
      elips(ctx, gx + 1, gy + 2, gl, kh * 0.22, "rgba(0,0,0,0.25)");
      ctx.fillStyle = "#16161d"; ctx.beginPath(); ctx.moveTo(gx - gl, gy - 2.5); ctx.quadraticCurveTo(gx, gy + kh * 0.32, gx + gl, gy - 3.5);
      ctx.quadraticCurveTo(gx, gy + kh * 0.05, gx - gl, gy - 2.5); ctx.fill();
      ctx.fillStyle = "#c8a24a"; ctx.fillRect(gx - 4, gy - 1.4, 8, 2.6);                                  // oturak
      ctx.strokeStyle = "#d9dde2"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(gx + gl - 1.5, gy - 3.3); ctx.lineTo(gx + gl + 0.5, gy - 6.5); ctx.stroke();   // demir pruva süsü
    }, 0, 0, -1);
    for (const f of [0.18, 0.36, 0.64, 0.82]) {                                                          // çizgili bağlama direkleri
      const x = w * f, y = ky - kh / 2 - 1;
      if (uz(B, x, y) > -3 || uz(B, x, y - 13) > -3) continue;
      ctx.fillStyle = "#f4f1ea"; ctx.fillRect(x - 1.6, y - 12, 3.2, 12);
      ctx.fillStyle = r() < 0.5 ? "#2f5fa8" : "#c8302a"; for (let i = 0; i < 3; i++) ctx.fillRect(x - 1.6, y - 11 + i * 4, 3.2, 1.8);
      elips(ctx, x, y - 12, 1.6, 0.9, "#c8a24a");
    }
    return [];
  }

  // ---------- ES: La Mancha yel değirmenleri ----------
  // Kuru toprak, çalılar; badanalı silindir gövdeler, koyu konik başlık; kanatlar canlı (pervane)
  function yelDegirmenleri(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#b8975a", "#8a8a4a", 1000);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 600; i++) elips(ctx, r() * w, r() * h, 2 + r() * 2, 1.2 + r(), "#7a7a3e"); });
    const canli = [], yerler = icNoktalar(B, w, h, Math.max(1, Math.min(3, Math.round(w * h / 5000))), 16, 36, r);
    for (const k of yerler) {
      const taban = k.y + 10, yer = yapiSigdir(B, k.x, taban, 19, Math.min(46, ustBosluk(B, k.x, taban) - 4));
      if (!yer) continue;
      const { g, b } = yer, x = k.x, ust = taban - b, govB = b * 0.72, gy = taban - govB;
      elips(ctx, x + 2.5, taban + 0.5, g * 0.7, 2.2, "rgba(0,0,0,0.28)");
      ctx.fillStyle = "#f6f2ea"; ctx.beginPath(); ctx.moveTo(x - g / 2, taban); ctx.lineTo(x - g * 0.42, gy); ctx.lineTo(x + g * 0.42, gy); ctx.lineTo(x + g / 2, taban); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#dcd5c6"; ctx.beginPath(); ctx.moveTo(x + g * 0.12, taban); ctx.lineTo(x + g * 0.14, gy); ctx.lineTo(x + g * 0.42, gy); ctx.lineTo(x + g / 2, taban); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#3a3f4a"; ctx.beginPath(); ctx.moveTo(x - g * 0.5, gy + 1); ctx.quadraticCurveTo(x, ust - 1, x + g * 0.5, gy + 1); ctx.closePath(); ctx.fill();   // konik başlık
      ctx.fillStyle = "#2f5fa8"; yuvarlak(ctx, x - g * 0.12, taban - govB * 0.34, g * 0.24, govB * 0.34, 2); ctx.fill();   // kapı ve pencere
      ctx.fillStyle = "#3a3f4a"; ctx.fillRect(x - 1.2, gy + govB * 0.22, 2.4, 2.6);
      canli.push({ tur: "pervane", x, y: gy + 1, n: r(), s: Math.min(15, b * 0.48) });
    }
    return canli;
  }

  // ---------- ES: Elhamra'nın Aslanlı Çeşmesi ----------
  // Mermer avlu ve geometrik kuşak; on iki sevimli aslanın taşıdığı on iki köşeli havuz, ağızlardan su
  function aslan(ctx, x, y, s, yon) {
    elips(ctx, x + 0.6, y + s * 0.55, s * 0.7, s * 0.22, "rgba(0,0,0,0.2)");
    elips(ctx, x, y + s * 0.15, s * 0.55, s * 0.45, "#e9e1cf");
    elips(ctx, x + yon * s * 0.05, y - s * 0.3, s * 0.48, s * 0.44, "#d8c9a6");                           // yele
    elips(ctx, x + yon * s * 0.1, y - s * 0.28, s * 0.3, s * 0.28, "#f1ead9");
    gozler(ctx, x + yon * s * 0.1, y - s * 0.33, s * 0.11, s * 0.05, "#4a3a2a");
    elips(ctx, x + yon * s * 0.1, y - s * 0.17, s * 0.08, s * 0.05, "#7a5a3a");
  }
  function aslanliCesme(ctx, w, h, r, p, B) {
    const mermer = "#e8e1d2";
    doldur(ctx, B, koyu(mermer, 0.4), 0, 0, 3);
    doldur(ctx, B, mermer);
    kirp(ctx, B, () => {                                                                                 // döşeme ve kuşak
      ctx.strokeStyle = koyu(mermer, 0.1); ctx.lineWidth = 0.8;
      for (let x = 0; x < w; x += 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    });
    hatCiz(ctx, B, p.vurgu2 || "#3a6ea5", 2.4, 0, 0, -4);
    kenarNoktalari(B, 7, -4).forEach((k, i) => { if (i % 2) window.ULKE_AILE_YARDIMCI.baklava(ctx, k.x, k.y, 1.6, "#c8a24a"); });
    const kg = Math.min(110, w * 0.8), yer = enIyiYer(B, w, h, kg, kg * 0.72, 8);
    if (!yer) return [];
    const { g, b } = yer, cx = yer.x, rx = g / 2 - 4, ry = b * 0.3, cy = yer.taban - b * 0.42;
    const aslanlar = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + Math.PI / 12; return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry + b * 0.12, yon: Math.cos(a) >= 0 ? 1 : -1 }; });
    const s = Math.max(4, Math.min(10, rx * 0.22));
    for (const a of aslanlar.filter((q) => q.y < cy + b * 0.12)) aslan(ctx, a.x, a.y, s, a.yon);
    const havuzY = cy - b * 0.02, hrx = rx * 0.62, hry = ry * 0.62;                                       // on iki köşeli havuz ve ayak
    ctx.fillStyle = "#d6ccb6"; ctx.fillRect(cx - hrx * 0.25, havuzY, hrx * 0.5, b * 0.16);
    const kose = (k, yy) => { ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.lineTo(cx + Math.cos(a) * hrx * k, yy + Math.sin(a) * hry * k); } ctx.closePath(); };
    kose(1.06, havuzY + 2); ctx.fillStyle = koyu(mermer, 0.25); ctx.fill();
    kose(1, havuzY); ctx.fillStyle = "#efe9dc"; ctx.fill();
    kose(0.78, havuzY); ctx.fillStyle = "#1e7fd6"; ctx.fill();
    elips(ctx, cx - hrx * 0.2, havuzY - hry * 0.2, hrx * 0.25, hry * 0.18, "rgba(255,255,255,0.35)");
    elips(ctx, cx, havuzY - 1.5, 1.8, 3.5, "rgba(220, 240, 255, 0.85)");                                   // fıskiye
    for (const a of aslanlar.filter((q) => q.y >= cy + b * 0.12)) {
      aslan(ctx, a.x, a.y, s, a.yon);
      ctx.strokeStyle = "rgba(160, 210, 250, 0.9)"; ctx.lineWidth = 1; ctx.beginPath();                   // ağızdan su
      ctx.moveTo(a.x + a.yon * s * 0.15, a.y - s * 0.12); ctx.quadraticCurveTo(a.x + a.yon * s * 0.6, a.y - s * 0.3, a.x + a.yon * s * 0.85, a.y + s * 0.35); ctx.stroke();
    }
    return [];
  }

  Object.assign(window.ULKE_OBJELERI, {
    periBacalari, laleBahcesi, aycicegiTarlasi, samanCatiliEv, wawelEjderi, leylekYuvalari, gugukluSaatEvi, yarimAhsapEvler,
    telefonKulubeleri, saatKulesi, eyfelKulesi, lavantaTarlasi, kolezyum, gondolIskelesi, yelDegirmenleri, aslanliCesme,
  });
  // Yerleşim yardımcıları öteki kıta dosyalarına (bu dosya onlardan önce yüklenir: index.html)
  window.ULKE_OBJE_YARDIMCI = Object.assign(window.ULKE_OBJE_YARDIMCI || {}, { ustBosluk, gozler, yamaZemin, yapiSigdir, kutuIcinde, enIyiYer, disinda, yuz });
})();
