/* ============================================================
   HAYALET AVCILARI — ENGELLER (3.13.0)
   Su, duvar, obje, diken ve lavın BİÇİMİ: engelin dikdörtgeninin içinde kalan daire (d), elips (e) ve yuvarlak köşeli
   kutu (k) parçalarının birleşimi. Çarpışma biçimi izler (collidesWalls/Waters/Spikes/Lavas → engelCarpisir).
   Harita üretimi (buildWalls/buildWaters/buildHazards: yer, boyut, çakışma) değişmez; biçim her build işlevinin
   sonunda engelBicimleriniKur() ile eklenir. Bütün süs ve biçimler tohumlu rastgele: her cihazda aynı.
   Çizim: her engel kendi tuvaline bir kez çizilir (engelResmi, ölçek engelOlcegi), render her karede engelleriCiz ile
   önbelleği basar ve üstüne canlı katmanı (dalga, lav, alev, ENGEL_CANLI) çizer. Tema ressamları engel-temalari.js'te.
   Tasarım: docs/superpowers/specs/2026-10-23-hayalet-engeller-design.md
   game.js'ten önce yüklenir; game.js'in değişkenlerine (game) yalnız çağrı anında erişir.
   ============================================================ */
(function () {
  // ---------- rastgele, tohum, renk ----------
  function engelRastgele(tohum) {
    let s = (tohum >>> 0) || 0x9e3779b9;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  // FNV-1a (32 bit): bölüm, tür, sıra ve dikdörtgenden
  function engelTohumu(level, tur, sira, kutu) {
    const s = `${level}:${tur}:${sira}:${Math.round(kutu.x)}:${Math.round(kutu.y)}:${Math.round(kutu.w)}:${Math.round(kutu.h)}`;
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function karistir(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = (sh) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
    return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
  }
  const acik = (c, k) => karistir(c, "#ffffff", k);
  const koyu = (c, k) => karistir(c, "#000000", k);
  const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- şekil yolları ----------
  function elips(ctx, x, y, rx, ry, renk) { ctx.fillStyle = renk; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); ctx.fill(); }
  // yuvarlak köşeli kutu alt yolu (beginPath yok: birleşim yoluna eklenir; saat yönünde → nonzero ile birleşim)
  function kutuYolu(ctx, x, y, w, h, rr) {
    rr = Math.max(0, Math.min(rr, w / 2, h / 2));
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
  }
  function yuvarlak(ctx, x, y, w, h, rr) { ctx.beginPath(); kutuYolu(ctx, x, y, w, h, rr); }
  function parcaYolu(ctx, q, ox, oy, b) {
    if (q.t === "d") { ctx.moveTo(ox + q.x + q.r + b, oy + q.y); ctx.arc(ox + q.x, oy + q.y, Math.max(0.1, q.r + b), 0, Math.PI * 2); }
    else if (q.t === "e") { ctx.moveTo(ox + q.x + q.rx + b, oy + q.y); ctx.ellipse(ox + q.x, oy + q.y, Math.max(0.1, q.rx + b), Math.max(0.1, q.ry + b), 0, 0, Math.PI * 2); }
    else kutuYolu(ctx, ox + q.x - b, oy + q.y - b, q.w + 2 * b, q.h + 2 * b, q.rr + b);
  }
  function yol(ctx, P, ox = 0, oy = 0, b = 0) { ctx.beginPath(); for (const q of P) parcaYolu(ctx, q, ox, oy, b); }
  function doldur(ctx, P, renk, ox = 0, oy = 0, b = 0) { yol(ctx, P, ox, oy, b); ctx.fillStyle = renk; ctx.fill(); }
  function cizgi(ctx, P, renk, kal, ox = 0, oy = 0) { yol(ctx, P, ox, oy, 0); ctx.strokeStyle = renk; ctx.lineWidth = kal; ctx.lineJoin = "round"; ctx.stroke(); }
  function kirp(ctx, P, fn, ox = 0, oy = 0, b = 0) { ctx.save(); yol(ctx, P, ox, oy, b); ctx.clip(); fn(); ctx.restore(); }

  // ---------- uzaklık, hat, iç noktalar ----------
  // işaretli uzaklık (içeride eksi). Elips yaklaşık: (k − 1) / |∇k| (eksenlerde tam, dışarıda birkaç px içinde);
  // eski (k − 1) × min(rx, ry) uzun eksende uzaklığı yarıya indirip ~21 px görünmez duvar yapıyordu
  function parcaUzaklik(q, x, y) {
    if (q.t === "d") return Math.hypot(x - q.x, y - q.y) - q.r;
    if (q.t === "e") {
      const px = (x - q.x) / q.rx, py = (y - q.y) / q.ry, k0 = Math.hypot(px, py), k1 = Math.hypot(px / q.rx, py / q.ry);
      return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(q.rx, q.ry);
    }
    const cx = q.x + q.w / 2, cy = q.y + q.h / 2, qx = Math.abs(x - cx) - (q.w / 2 - q.rr), qy = Math.abs(y - cy) - (q.h / 2 - q.rr);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - q.rr;
  }
  function engelUzaklik(P, x, y) { let m = Infinity; for (const q of P) m = Math.min(m, parcaUzaklik(q, x, y)); return m; }
  // Birleşimin dış hattı boyunca noktalar (her parçanın b kadar büyütülmüş çevresinden, başka parçanın içinde
  // kalmayanlar); y'ye göre sıralı. (Taslaktaki denetim noktayı yarı yola çekip b ile karşılaştırdığı için b ≥ 2'de hiç
  // nokta dönmüyordu: kamış, lav kıyısı taşları ve palmiye çizilmiyordu.)
  function kenarNoktalari(P, aralik, b = 0) {
    const out = [];
    for (const q of P) {
      const ekle = (x, y, nx, ny) => { if (engelUzaklik(P, x, y) > b - 0.8) out.push({ x, y, nx, ny }); };
      if (q.t === "d" || q.t === "e") {
        const rx = (q.t === "d" ? q.r : q.rx) + b, ry = (q.t === "d" ? q.r : q.ry) + b;
        const n = Math.max(6, Math.round((2 * Math.PI * (rx + ry) / 2) / aralik));
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const nx = Math.cos(a), ny = Math.sin(a); ekle(q.x + nx * rx, q.y + ny * ry, nx, ny); }
      } else {
        const x0 = q.x - b, y0 = q.y - b, w = q.w + 2 * b, h = q.h + 2 * b;
        for (let x = x0 + q.rr; x <= x0 + w - q.rr; x += aralik) { ekle(x, y0, 0, -1); ekle(x, y0 + h, 0, 1); }
        for (let y = y0 + q.rr; y <= y0 + h - q.rr; y += aralik) { ekle(x0, y, -1, 0); ekle(x0 + w, y, 1, 0); }
      }
    }
    return out.sort((a, c) => a.y - c.y);
  }
  // Yalnız birleşimin DIŞ hattını çizer (parçaların iç çemberleri görünmez)
  function parcaCevresi(q, b, adim) {
    const out = [];
    if (q.t === "d" || q.t === "e") {
      const rx = (q.t === "d" ? q.r : q.rx) + b, ry = (q.t === "d" ? q.r : q.ry) + b;
      const n = Math.max(12, Math.round(Math.PI * (rx + ry) / adim));
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push({ x: q.x + Math.cos(a) * rx, y: q.y + Math.sin(a) * ry }); }
    } else {
      const x0 = q.x - b, y0 = q.y - b, w = q.w + 2 * b, h = q.h + 2 * b, rr = q.rr + b;
      const kose = (cx, cy, a0) => { for (let i = 0; i < 6; i++) { const a = a0 + (i / 6) * Math.PI / 2; out.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr }); } };
      for (let x = x0 + rr; x < x0 + w - rr; x += adim) out.push({ x, y: y0 }); kose(x0 + w - rr, y0 + rr, -Math.PI / 2);
      for (let y = y0 + rr; y < y0 + h - rr; y += adim) out.push({ x: x0 + w, y }); kose(x0 + w - rr, y0 + h - rr, 0);
      for (let x = x0 + w - rr; x > x0 + rr; x -= adim) out.push({ x, y: y0 + h }); kose(x0 + rr, y0 + h - rr, Math.PI / 2);
      for (let y = y0 + h - rr; y > y0 + rr; y -= adim) out.push({ x: x0, y }); kose(x0 + rr, y0 + rr, Math.PI);
    }
    return out;
  }
  function hatCiz(ctx, P, renk, kal, ox = 0, oy = 0, b = 0) {
    ctx.strokeStyle = renk; ctx.lineWidth = kal; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const q of P) {
      const nok = parcaCevresi(q, b, 3);
      ctx.beginPath(); let acikYol = false;
      for (let i = 0; i <= nok.length; i++) {
        const n = nok[i % nok.length];
        const dis = P.every((o) => o === q || parcaUzaklik(o, n.x, n.y) - b > -0.4);
        if (dis) { if (acikYol) ctx.lineTo(ox + n.x, oy + n.y); else { ctx.moveTo(ox + n.x, oy + n.y); acikYol = true; } } else acikYol = false;
      }
      ctx.stroke();
    }
  }
  // Biçimin içinde, kenardan en az "pay" uzak, birbirine en az "ara" uzak noktalar (süs yerleşimi); y'ye göre sıralı
  function icNoktalar(P, w, h, n, pay, ara, r) {
    const out = [];
    for (let deneme = 0; deneme < n * 40 && out.length < n; deneme++) {
      const x = r() * w, y = r() * h;
      if (engelUzaklik(P, x, y) > -pay) continue;
      if (out.some((o) => Math.hypot(o.x - x, o.y - y) < ara)) continue;
      out.push({ x, y });
    }
    return out.sort((a, c) => a.y - c.y);
  }

  // ---------- ortak süs parçaları ----------
  function cimTutami(ctx, x, y, s, renk) {
    ctx.strokeStyle = renk; ctx.lineWidth = 1.4; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - s * 0.6, y); ctx.lineTo(x - s * 0.9, y - s);
    ctx.moveTo(x, y); ctx.lineTo(x, y - s * 1.2);
    ctx.moveTo(x + s * 0.6, y); ctx.lineTo(x + s * 0.9, y - s);
    ctx.stroke();
  }
  function gozler(ctx, x, y, ara, rr, renk, bebek) {
    elips(ctx, x - ara, y, rr, rr * 1.15, renk); elips(ctx, x + ara, y, rr, rr * 1.15, renk);
    if (bebek) { elips(ctx, x - ara + rr * 0.25, y + rr * 0.2, rr * 0.45, rr * 0.5, bebek); elips(ctx, x + ara + rr * 0.25, y + rr * 0.2, rr * 0.45, rr * 0.5, bebek); }
  }
  function tasOrgu(ctx, x0, y0, w, h, satir, renk, r) {
    for (let y = y0; y < y0 + h; y += satir) {
      let x = x0 - r() * satir * 1.4;
      while (x < x0 + w) {
        const bw = satir * (1.3 + r() * 1.1);
        ctx.fillStyle = karistir(renk, r() < 0.5 ? "#ffffff" : "#000000", r() * 0.14);
        yuvarlak(ctx, x + 1, y + 1, bw - 2, satir - 2, 2.5); ctx.fill();
        x += bw;
      }
    }
  }

  // ---------- biçim aileleri (yerel koordinat, dikdörtgenin içinde) ----------
  // Göl (su, lav): ortada elips + kenarlara yaslanan farklı boylarda daireler; pay: kıyı payı
  function bicimGol(w, h, r, pay) {
    const cx = w / 2 + (r() - 0.5) * w * 0.08, cy = h / 2 + (r() - 0.5) * h * 0.08;
    const P = [{ t: "e", x: cx, y: cy, rx: Math.min(w * 0.36, cx - pay, w - cx - pay), ry: Math.min(h * 0.32, cy - pay, h - cy - pay) }];
    const n = 3 + Math.floor(r() * 3), a0 = r() * Math.PI * 2, enCok = (Math.min(w, h) - 2 * pay) / 2;
    for (let i = 0; i < n; i++) {
      const R = Math.min(Math.min(w, h) * (0.17 + r() * 0.15), enCok), a = a0 + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.7;
      P.push({ t: "d", r: R,
        x: sinirla(w / 2 + Math.cos(a) * w * 0.32, R + pay, w - R - pay),
        y: sinirla(h / 2 + Math.sin(a) * h * 0.3, R + pay, h - R - pay) });
    }
    return P;
  }
  // Yama (objeler): dikdörtgeni büyük ölçüde dolduran yuvarlak çekirdek ve kenarda taşan daireler
  function bicimYama(w, h, r, pay = 7) {
    const P = [{ t: "k", x: pay + w * 0.1, y: pay + h * 0.1, w: w - 2 * pay - w * 0.2, h: h - 2 * pay - h * 0.2, rr: Math.min(w, h) * 0.22 }];
    const n = 5 + Math.floor(r() * 3), a0 = r() * Math.PI * 2, enCok = (Math.min(w, h) - 2 * pay) / 2;
    for (let i = 0; i < n; i++) {
      const R = Math.min(Math.min(w, h) * (0.2 + r() * 0.12), enCok), a = a0 + (i / n) * Math.PI * 2;
      P.push({ t: "d", r: R,
        x: sinirla(w / 2 + Math.cos(a) * w * 0.4, R + pay, w - R - pay),
        y: sinirla(h / 2 + Math.sin(a) * h * 0.4, R + pay, h - R - pay) });
    }
    return P;
  }
  // Kale: yuvarlak köşeli gövde, üstten taşan yuvarlak kuleler ve mazgallar; ön yüz gövdenin altında (derinlik)
  function bicimKale(w, h, r) {
    const d = Math.round(sinirla(h * 0.2, 12, 24)), ust = 13;
    const P = [{ t: "k", x: 5, y: ust, w: w - 10, h: h - d - ust - 2, rr: Math.min(16, (h - d - ust) * 0.35) }];
    const R = Math.min(19, w * 0.16, (h - d) * 0.3);
    P.push({ t: "d", x: R + 4, y: R + 4, r: R }, { t: "d", x: w - R - 4, y: R + 4, r: R });
    const orta = w > 150;
    if (orta) P.push({ t: "d", x: w / 2, y: R * 0.85 + 4, r: R * 0.85 });
    for (let x = R * 2 + 6; x + 9 <= w - R * 2 - 6; x += 15) {
      if (orta && Math.abs(x + 4.5 - w / 2) < R * 1.2) continue;
      P.push({ t: "k", x, y: ust - 7 + (r() < 0.3 ? 2 : 0), w: 9, h: 12, rr: 4.5 });
    }
    P.derinlik = d; P.kuleler = P.filter((q) => q.t === "d");
    return P;
  }
  // Harabe: kale gövdesi; kuleler yerine farklı boylarda 3–5 kırık sütun başı
  function bicimHarabe(w, h, r) {
    const d = Math.round(sinirla(h * 0.2, 12, 22)), ust = 14;
    const P = [{ t: "k", x: 5, y: ust, w: w - 10, h: h - d - ust - 2, rr: 10 }];
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const R = Math.min(7 + r() * 5, (w - 10) / (2 * n));
      const x = sinirla(5 + (w - 10) * (i + 0.5) / n + (r() - 0.5) * 6, R + 4, w - R - 4);
      P.push({ t: "d", x, y: R + 4 + r() * 5, r: R });
    }
    P.derinlik = d; P.kuleler = P.filter((q) => q.t === "d");
    return P;
  }
  // Kütük çit: gövde + üst kenarda boyları değişen yuvarlak kütük başları
  function bicimKutuk(w, h, r) {
    const d = Math.round(sinirla(h * 0.24, 14, 28));
    const P = [{ t: "k", x: 4, y: 13, w: w - 8, h: h - d - 15, rr: 12 }];
    for (let x = 11; x <= w - 11; x += 12) P.push({ t: "d", x, y: 11 + r() * 5, r: 6.5 });
    P.derinlik = d;
    return P;
  }
  // Kaya: ortada gövde elipsi ve üst üste binen yumrular (daire/elips)
  function bicimKaya(w, h, r) {
    const d = Math.round(sinirla(h * 0.12, 8, 14)), pay = 4, alt = h - d - 2;
    const P = [{ t: "e", x: w / 2, y: (pay + alt) / 2, rx: (w - 2 * pay) * 0.36, ry: (alt - pay) * 0.34 }];
    const n = 3 + Math.floor(r() * 4), enCok = Math.min(w - 2 * pay, alt - pay) / 2;
    for (let i = 0; i < n; i++) {
      const R = Math.min(Math.min(w, h) * (0.22 + r() * 0.16), enCok), a = r() * Math.PI * 2;
      const x = sinirla(w / 2 + Math.cos(a) * w * 0.3, R + pay, w - R - pay), y = sinirla((pay + alt) / 2 + Math.sin(a) * (alt - pay) * 0.3, R + pay, alt - R);
      P.push(r() < 0.5 ? { t: "d", x, y, r: R } : { t: "e", x, y, rx: R, ry: R * (0.75 + r() * 0.2) });
    }
    P.derinlik = d;
    return P;
  }
  // Uzay istasyonu: yuvarlak köşeli gövde ve dört köşede yuvarlak modüller
  function bicimIstasyon(w, h, r) {
    const d = Math.round(sinirla(h * 0.16, 12, 20)), pay = 4, R = Math.min(w, h) * 0.16, alt = h - d - 2;
    const P = [{ t: "k", x: 8, y: 10, w: w - 16, h: alt - 10, rr: 14 },
      { t: "d", x: R + pay, y: R + pay, r: R }, { t: "d", x: w - R - pay, y: R + pay, r: R },
      { t: "d", x: R + pay, y: alt - R, r: R }, { t: "d", x: w - R - pay, y: alt - R, r: R }];
    P.derinlik = d;
    return P;
  }
  // Diken plakası: elips ve iki yanında taşan daireler
  function bicimPlaka(w, h, r) {
    const P = [{ t: "e", x: w / 2, y: h / 2, rx: w / 2 - 6, ry: h / 2 - 8 }];
    for (let i = 0; i < 3; i++) {
      const R = Math.min(w, h) * (0.2 + r() * 0.08), a = r() * Math.PI * 2;
      P.push({ t: "d", r: R, x: sinirla(w / 2 + Math.cos(a) * w * 0.3, R + 3, w - R - 3), y: sinirla(h / 2 + Math.sin(a) * h * 0.3, R + 3, h - R - 3) });
    }
    return P;
  }
  // Harita sınırı: ince şerit; haritaya bakan kenarda yuvarlak mazgal başları (dünya dışına bakan kenar taşabilir)
  function bicimSinir(w, h, yon) {
    const P = [];
    if (yon === "ust" || yon === "alt") {
      P.push({ t: "k", x: -8, y: yon === "ust" ? -8 : 7, w: w + 16, h: h - 7 + 8, rr: 6 });
      for (let x = 10; x < w - 6; x += 20) P.push({ t: "d", x, y: yon === "ust" ? h - 7 : 7, r: 6.5 });
    } else {
      P.push({ t: "k", x: yon === "sol" ? -8 : 7, y: -8, w: w - 7 + 8, h: h + 16, rr: 6 });
      for (let y = 10; y < h - 6; y += 20) P.push({ t: "d", x: yon === "sol" ? w - 7 : 7, y, r: 6.5 });
    }
    P.yon = yon;
    return P;
  }
  const AILELER = { kale: bicimKale, harabe: bicimHarabe, kutuk: bicimKutuk, kaya: bicimKaya, istasyon: bicimIstasyon, yama: (w, h, r) => bicimYama(w, h, r) };
  // Görselin biçim dışına taşma payı (kıyı, kenar süsü, gölge)
  const PAY = { kale: 4, harabe: 4, kutuk: 4, kaya: 4, istasyon: 4, yama: 7, plaka: 2.5, sinir: 0 };
  // Tema başına duvar ve obje aileleri (spec §4); belirtilmeyen obje "yama"
  const ENGEL_AILELERI = [{ duvar: "kale" }, { duvar: "kutuk" }, { duvar: "harabe" }, { duvar: "kale" }, { duvar: "kaya" }, { duvar: "istasyon", obje1: "kaya" }];

  function buyut(q, b) {
    if (q.t === "d") return { ...q, r: q.r + b };
    if (q.t === "e") return { ...q, rx: q.rx + b, ry: q.ry + b };
    return { ...q, x: q.x - b, y: q.y - b, w: q.w + 2 * b, h: q.h + 2 * b, rr: q.rr + b };
  }

  // Kutuya biçim, çarpışma ve süs bilgisi ekler (yerinde) ve kutuyu döndürür
  function engelOlustur(o, tur, tema, tohum, yon) {
    // Dünya Turu'nda tema ülke kodudur (ulkeler.js ulkeBicimSeti); normal oyunda tema dizini
    const r = engelRastgele(tohum), set = typeof tema === "string" ? window.ulkeBicimSeti(tema) : (ENGEL_AILELERI[tema] || ENGEL_AILELERI[0]);
    let aile, P, pay;
    if (tur === "sinir") { aile = "sinir"; P = bicimSinir(o.w, o.h, yon); }
    else if (tur === "su" || tur === "lav") { aile = "gol"; pay = tur === "su" ? 9 : 7; P = bicimGol(o.w, o.h, r, pay); }
    else if (tur === "diken") { aile = "plaka"; P = bicimPlaka(o.w, o.h, r); }
    else { aile = set[tur] || (tur === "duvar" ? "kale" : "yama"); P = AILELER[aile](o.w, o.h, r); }
    if (pay === undefined) pay = PAY[aile];
    P.ox = o.x; P.oy = o.y; // ressamlar için dünya konumu (suyun renk geçişi dünya y'sinde)
    const derinlik = P.derinlik || 0;
    // Çarpışma: duvar ailesinde ön yüz dahil (biçim + derinlik kadar aşağı kaydırılmış kopyası); objede kenar süsü (+3);
    // dikende kırmızı kenar (+2,5); su, lav ve sınırda biçimin kendisi (kıyı yürünür)
    const carpisma = derinlik ? P.concat(P.map((q) => ({ ...q, y: q.y + derinlik })))
      : aile === "yama" ? P.map((q) => buyut(q, 3)) : aile === "plaka" ? P.map((q) => buyut(q, 2.5)) : P.slice();
    return Object.assign(o, { tur, tema, tohum, yon: yon || null, aile, bicim: P, derinlik, carpisma, pay });
  }

  // Obje (obje1/obje2) kutusunu resmin doğal en-boyuna uydurur (OBJ1): uzun/geniş kutuda resim küçük kalıyor, bütün kutunun
  // gölgesi koyu sütun/şerit olarak görünüyor ve görünmez duvar oluyordu. Kutunun merkezi ve alanı (yaklaşık) korunur;
  // yalnız KÜÇÜLÜR (kutu yerleştirildiği boşluktan çıkmaz, komşuya girmez). Sabit tablo: GORSEL_LISTESI statik betiktir
  // (gorsel/liste.js), her cihazda aynı; kutu yalnız girdisinden (w, h, resim oranı) hesaplanır, tohum/yüklenme gerekmez.
  // Zaten oranına yakın kutu değişmez (idempotent: çevrimiçi istemcide tekrar çalışsa aynı sonuç).
  function objeKutusuUydur(o, tur, tema) {
    if (tur !== "obje1" && tur !== "obje2") return o;
    if (typeof GORSEL_LISTESI !== "object" || !GORSEL_LISTESI) return o;
    const k = typeof tema === "string" ? `ulke-${tema}-${tur === "obje1" ? 1 : 2}` : `tema${tema + 1}-${tur}`;
    const d = GORSEL_LISTESI[k];
    if (!d || !(d[0] > 0 && d[1] > 0) || !(o.w > 0 && o.h > 0)) return o;
    const ar = d[0] / d[1];
    if (Math.abs(o.w / o.h - ar) / ar < 0.04) return o;
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2, A = o.w * o.h;
    let nw = Math.sqrt(A * ar), nh = nw / ar;
    const f = Math.min(1, o.w / nw, o.h / nh); // yalnız küçül
    nw = Math.max(8, Math.floor(nw * f)); nh = Math.max(8, Math.floor(nw / ar));
    if (nh > o.h) { nh = Math.floor(o.h); nw = Math.max(8, Math.floor(nh * ar)); }
    if (nw > o.w) nw = Math.floor(o.w);
    // Yuvarlama eski kutunun dışına çıkarmasın (köprü ağzı bandı gibi sınırlar tam kenarda): kutu içinde sıkıştırılır
    const x1 = o.x + o.w, y1 = o.y + o.h;
    o.x = Math.min(x1 - nw, Math.max(o.x, Math.round(cx - nw / 2))); o.y = Math.min(y1 - nh, Math.max(o.y, Math.round(cy - nh / 2)));
    o.w = nw; o.h = nh;
    return o;
  }

  // build işlevlerinin sonunda: biçimi olmayan her engeli tamamlar (kılık: kesişen iç blok duvar, değilse (i + bölüm) % 3)
  function engelBicimleriniKur() {
    if (typeof game === "undefined" || !game.walls) return;
    _engelSurum++;
    const L = game.level, ic = game.walls.slice(4);
    const u = window.turUlkesi && window.turUlkesi();
    const tema = u ? u.kod : (L - 1) % 6; // Dünya Turu'nda ülke kodu
    const kesisir = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    game.walls.forEach((o, i) => {
      if (o.bicim) return;
      if (i < 4) { engelOlustur(o, "sinir", tema, engelTohumu(L, "sinir", i, o), ["ust", "alt", "sol", "sag"][i]); return; }
      const k = i - 4;
      const tur = o.tur || (ic.some((b) => b !== o && kesisir(o, b)) ? "duvar" : ["duvar", "obje1", "obje2"][(k + L) % 3]);
      objeKutusuUydur(o, tur, tema);
      engelOlustur(o, tur, tema, engelTohumu(L, tur, k, o));
    });
    for (const [liste, tur] of [[game.waters, "su"], [game.spikes, "diken"], [game.lavas, "lav"]]) {
      (liste || []).forEach((o, i) => { if (!o.bicim) engelOlustur(o, tur, tema, engelTohumu(L, tur, i, o)); });
    }
  }

  // Uzamsal kova: 400 px'lik sütunlara göre engel listesi (engelBicimleriniKur listeyi değiştirince yenilenir).
  // Çarpışma/uzaklık yalnız sorgu dikdörtgeninin değdiği sütunlardaki engelleri gezer; sonuç aynı kalır.
  const KOLON_GENISLIGI = 400;
  let _engelSurum = 0;
  const _kolonOnbellek = new WeakMap();
  function kolonlarAl(liste) {
    const k = _kolonOnbellek.get(liste);
    if (k && k.surum === _engelSurum && k.n === liste.length) return k.kolonlar;
    const kolonlar = new Map();
    for (const o of liste) {
      const i0 = Math.floor(o.x / KOLON_GENISLIGI), i1 = Math.floor((o.x + o.w) / KOLON_GENISLIGI);
      for (let i = i0; i <= i1; i++) {
        let a = kolonlar.get(i);
        if (!a) kolonlar.set(i, a = []);
        a.push(o);
      }
    }
    _kolonOnbellek.set(liste, { surum: _engelSurum, n: liste.length, kolonlar });
    return kolonlar;
  }

  // Listedeki engellerin (x, y)'deki en küçük işaretli uzaklığı; yalnız dikdörtgeni r kadar yakın olanlar (uzaktakiler
  // Infinity). Biçimi kurulmamış engelde dikdörtgenin uzaklığı. Kayarak yürümede yüzey normali bunun eğiminden bulunur.
  function engelMesafesi(liste, x, y, r) {
    let m = Infinity;
    if (!liste || !liste.length) return m;
    const kolonlar = kolonlarAl(liste);
    const i0 = Math.floor((x - r) / KOLON_GENISLIGI), i1 = Math.floor((x + r) / KOLON_GENISLIGI);
    for (let i = i0; i <= i1; i++) {
      const adaylar = kolonlar.get(i);
      if (!adaylar) continue;
      for (const o of adaylar) {
        if (x + r <= o.x || x - r >= o.x + o.w || y + r <= o.y || y - r >= o.y + o.h) continue;
        const d = o.carpisma ? engelUzaklik(o.carpisma, x - o.x, y - o.y) : parcaUzaklik({ t: "k", x: o.x, y: o.y, w: o.w, h: o.h, rr: 0 }, x, y);
        if (d < m) m = d;
      }
    }
    return m;
  }
  // Dikdörtgenle ön eleme, sonra biçimin işaretli uzaklığı; biçimi kurulmamış engelde dikdörtgen
  function engelCarpisir(liste, x, y, r) {
    if (!liste || !liste.length) return false;
    const kolonlar = kolonlarAl(liste);
    const i0 = Math.floor((x - r) / KOLON_GENISLIGI), i1 = Math.floor((x + r) / KOLON_GENISLIGI);
    for (let i = i0; i <= i1; i++) {
      const adaylar = kolonlar.get(i);
      if (!adaylar) continue;
      for (const o of adaylar) {
        if (x + r <= o.x || x - r >= o.x + o.w || y + r <= o.y || y - r >= o.y + o.h) continue;
        if (!o.carpisma) {
          const cx = Math.max(o.x, Math.min(x, o.x + o.w)), cy = Math.max(o.y, Math.min(y, o.y + o.h));
          if (Math.hypot(x - cx, y - cy) < r) return true;
          continue;
        }
        if (engelUzaklik(o.carpisma, x - o.x, y - o.y) < r) return true;
      }
    }
    return false;
  }

  // ---------- ortak ressamlar: kıyı taşları, su tabanı, diken, lav ----------
  // Biçimin hattına dizili yuvarlak taşlar (b: hattan dışarı kayma, en: en büyük taş)
  function kayalikKenar(ctx, P, renk, r, aralik = 9, b = 3, en = 7) {
    for (const k of kenarNoktalari(P, aralik, b)) {
      const s = 4 + r() * (en - 4);
      elips(ctx, k.x + 1, k.y + 1.5, s, s * 0.8, "rgba(0,0,0,0.35)");
      elips(ctx, k.x, k.y, s, s * 0.8, karistir(renk, "#000000", r() * 0.25));
      elips(ctx, k.x - s * 0.3, k.y - s * 0.3, s * 0.4, s * 0.3, acik(renk, 0.25));
    }
  }
  // Su: tema kıyısı (kiyiCiz), koyu kenar, mavi; renk geçişi dünya y'sinde (0 → SU_BOY) olduğu için kesişen göller
  // tek göl gibi birleşir
  const SU_BOY = 1200;
  // Su boyanırken engelin teması (engelBoya verir): ChatGPT su dokusu (gorsel.js temaDeseni) varsa o kullanılır
  let _boyaTema = null;
  function suTabani(ctx, w, h, r, B, kiyiCiz, kenarRengi = "#0b2a55") {
    if (kiyiCiz) kiyiCiz();
    doldur(ctx, B, kenarRengi, 0, 0, 2);
    const desen = typeof _boyaTema === "number" && typeof window.temaDeseni === "function" ? window.temaDeseni(_boyaTema + 1, "su") : null;
    const oy = B.oy || 0, g = ctx.createLinearGradient(0, -oy, 0, SU_BOY - oy);
    g.addColorStop(0, "#2b8fe6"); g.addColorStop(1, "#0f4fae");
    doldur(ctx, B, desen || g);
    kirp(ctx, B, () => { for (const q of B) if (q.t !== "k") elips(ctx, q.x - (q.r || q.rx) * 0.3, q.y - (q.r || q.ry) * 0.45, (q.r || q.rx) * 0.45, 3, "rgba(255,255,255,0.12)"); });
  }
  // Diken plakası (bütün temalarda): kırmızı kenar, taş zemin, metal sivri uçlar
  function dikenCiz(ctx, w, h, r, p, B) {
    // Diken plakası: leke biçimi kırmızı kenarla çevrilir (sınırlardaki yöntem); içi ChatGPT'nin dikişsiz çatlak taş dokusu
    // (yoksa kod taş örgüsü), üstte metal sivri uçlar. Biçim kenarı çerçeveyle örtülür: kesik görünmez.
    const doku = typeof gorsel === "function" ? (gorsel("zemin-catlak-tas") || gorsel("zemin-yol-tas")) : null;
    if (doku) {
      doldur(ctx, B, "#7f1d1d", 0, 0, 2.5);
      doldur(ctx, B, "#2a2430");
      kirp(ctx, B, () => {
        const desen = ctx.createPattern(doku, "repeat");
        if (desen) {
          if (desen.setTransform && typeof DOMMatrix === "function") desen.setTransform(new DOMMatrix().scaleSelf(0.25, 0.25));
          ctx.fillStyle = desen; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = "rgba(40,24,40,0.35)"; ctx.fillRect(0, 0, w, h); // tuzak koyu dursun
        }
        dikenUclari(ctx, w, h, B);
      });
      return [];
    }
    doldur(ctx, B, "#7f1d1d", 0, 0, 2.5);
    doldur(ctx, B, "#2a2430");
    kirp(ctx, B, () => {
      tasOrgu(ctx, 0, 0, w, h, 11, "#3a3442", r);
      dikenUclari(ctx, w, h, B);
    });
    return [];
  }
  function dikenUclari(ctx, w, h, B) {
    const s = 12;
    for (let y = 6, k = 0; y < h + 6; y += s, k++) for (let x = 4 + (k % 2) * (s / 2); x < w; x += s) {
      if (engelUzaklik(B, x, y) > -5) continue;
      elips(ctx, x, y + 3, 4, 1.6, "rgba(0,0,0,0.5)");
      const g = ctx.createLinearGradient(x - 4, 0, x + 4, 0); g.addColorStop(0, "#f1f5f9"); g.addColorStop(1, "#64748b");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 4, y + 3); ctx.lineTo(x, y - 7); ctx.lineTo(x + 4, y + 3); ctx.closePath(); ctx.fill();
    }
  }
  // Lav tabanı (önbellek): kayalık kıyı ve eski drawLava'nın durağan kızgın renk geçişi; çatlak, kabarcık, 🔥 ve alevler
  // her karede üstüne çizilir
  function lavCiz(ctx, w, h, r, p, B) {
    // ChatGPT lav kareleri hazırsa (lavCanli her karede çizer) eski kod zemini çizilmez: kayalık kenarı resmin altından taşıyordu
    if (typeof animHazir === "function" && animHazir("lav") >= 3) return [];
    doldur(ctx, B, "#1a0b0b", 0, 0, 6);
    kayalikKenar(ctx, B, "#3f3f46", r, 8, 2, 6.5);
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, "#fef3c7"); g.addColorStop(0.25, "#facc15"); g.addColorStop(0.55, "#f97316");
    g.addColorStop(0.85, "#dc2626"); g.addColorStop(1, "#450a0a");
    doldur(ctx, B, g);
    return [];
  }
  // Biçimin y satırındaki iç aralıkları (kenardan "ic" px içeride; yalnız daire ve elips parçaları): kırpmadan çizmek için.
  // Satırdan ±(ic − 1,5) px sapan çizgi de biçimin içinde kalır.
  function satirAraliklari(P, y, ic) {
    const ara = [];
    for (const q of P) {
      if (q.t === "k") continue;
      const rx = (q.t === "d" ? q.r : q.rx) - ic, ry = (q.t === "d" ? q.r : q.ry) - ic, dy = y - q.y;
      if (rx <= 0 || ry <= 0 || Math.abs(dy) >= ry) continue;
      const yari = rx * Math.sqrt(1 - (dy / ry) * (dy / ry));
      ara.push([q.x - yari, q.x + yari]);
    }
    ara.sort((a, c) => a[0] - c[0]);
    const out = [];
    for (const a of ara) { const son = out[out.length - 1]; if (son && a[0] <= son[1]) son[1] = Math.max(son[1], a[1]); else out.push(a.slice()); }
    return out;
  }
  // Aralıklar boyunca kayan sinüs çizgisi (yol; çağıran stroke eder)
  function sinusYolu(ctx, ox, oy, araliklar, adim, egri) {
    for (const [x0, x1] of araliklar) {
      for (let x = x0, ilk = true; ; x = Math.min(x + adim, x1)) {
        if (ilk) { ctx.moveTo(ox + x, oy + egri(x)); ilk = false; } else ctx.lineTo(ox + x, oy + egri(x));
        if (x >= x1) break;
      }
    }
  }
  // Canlı lav: eski drawLava'nın hareketli kısmı (magma çatlakları, patlayan kabarcıklar, titreyen 🔥). B verilirse yalnız
  // biçimin içine çizilir (kırpma yolu her karede pahalı: çatlaklar satır aralıklarına, kabarcıklar içerideyse);
  // durağan renk geçişi önbellekte (lavCiz). Eski dikdörtgen kenar çizgileri biçimin dışında kaldığı, saydam dolgunun
  // gölgesi de hiç görünmediği için taşınmadı; parlama engelleriCiz'de hazır resimle.
  function lavCanli(ctx, x, y, w, h, B) {
    // ChatGPT lav kareleri hazırsa lavın dikdörtgenine sığdırılır (4 kare/sn, lav başına faz); yoksa kod lavı
    const n = typeof animHazir === "function" ? animHazir("lav") : 0;
    if (n >= 3) {
      if (B && B.__lavFaz === undefined) B.__lavFaz = x * 0.013 + y * 0.017;
      const az = typeof animAzHareket === "function" && animAzHareket();
      const kare = typeof animDongu === "function" ? animDongu("lav", (B ? B.__lavFaz : 0) + performance.now() / 1000, 4) : 0;
      if (kare) { animCiz(ctx, "lav", az ? 1 : kare, x, y, w, h); return; }
    }
    const simdi = performance.now(), t = simdi / 300;
    const satirlar = (B && B._catlaklar) || [0, 1, 2, 3].map((k) => {
      const yy = 12 + k * (h - 24) / 4;
      return [k, yy, B ? satirAraliklari(B, yy, 6) : [[4, w - 4]]];
    });
    if (B) B._catlaklar = satirlar;
    ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (const [k, yy, araliklar] of satirlar) sinusYolu(ctx, x, y + yy, araliklar, 6, (col) => Math.sin((col + t * 60 + k * 30) / 14) * 4);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 250, 200, 0.95)";
    ctx.strokeStyle = "rgba(254, 215, 170, 0.7)"; ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const bx = 6 + ((i * 47 + t * 22) % (w - 12));
      const by = h - 10 - ((i * 31 + t * 18) % (h - 18));
      const br = 2.2 + ((i + Math.floor(t)) % 4) * 0.7;
      if (B && engelUzaklik(B, bx, by) > -(br + 3)) continue;
      ctx.beginPath(); ctx.arc(x + bx, y + by, br, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + bx, y + by, br + 2, 0, Math.PI * 2); ctx.stroke();
    }
    const boy = Math.min(20, Math.min(w, h) / 4), titre = 1 + Math.sin(simdi / 120) * 0.08;
    ctx.save(); ctx.font = `${boy}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; // yazı ayarı sızmasın
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(titre, titre); ctx.fillText("🔥", 0, 0); ctx.restore();
  }
  // Lavın üst hattından yükselen alev dilleri (her karede; uçlar engelde saklı, salınım tohumlu)
  const ALEV_RENKLERI = [["rgba(249,115,22,0.75)", 1], ["rgba(250,204,21,0.8)", 0.6]];
  function alevler(ctx, o, zaman) {
    const uclar = o._alevUclari || (o._alevUclari = kenarNoktalari(o.bicim, 11, 0).filter((k) => k.ny < -0.35));
    // Alev başına tohumlu (faz, boy, genişlik) bir kez hesaplanır; her karede rastgele üretici kurulmaz
    let par = o._alevPar;
    if (!par || par.length !== uclar.length * 3) {
      const r = engelRastgele(o.tohum);
      par = o._alevPar = [];
      for (let i = 0; i < uclar.length; i++) par.push(r() * 6.28, 12 + r() * 12, 5 + r() * 3);
    }
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let ai = 0; ai < uclar.length; ai++) {
      const k = uclar[ai];
      const faz = par[ai * 3], boy = par[ai * 3 + 1], gen = par[ai * 3 + 2];
      const t = Math.sin(zaman * 4 + faz) * 0.5 + 0.5, b = boy * (0.7 + t * 0.5), sal = Math.sin(zaman * 3 + faz) * 3;
      for (const [renk, oran] of ALEV_RENKLERI) {
        const x = o.x + k.x, y = o.y + k.y + 3, g2 = gen * oran, b2 = b * oran;
        ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x - g2, y);
        ctx.quadraticCurveTo(x - g2 * 0.9, y - b2 * 0.55, x + sal * oran, y - b2);
        ctx.quadraticCurveTo(x + g2 * 0.9, y - b2 * 0.55, x + g2, y);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }
  // Suyun içinde kayan dalgalar (eski drawWater'ın dalgaları): her satırda biçimin 4 px içindeki aralıklara, kırpmasız.
  // Satırlar ve evre dünya koordinatında: kesişen göllerin dalgaları birbirinin devamıdır.
  function dalgalar(ctx, o, zaman) {
    const t = zaman * 2.5; // performance.now() / 400
    if (!o._dalgalar) {
      o._dalgalar = [];
      for (let y = Math.ceil((o.y + 10) / 14) * 14; y < o.y + o.h - 4; y += 14) o._dalgalar.push([y - o.y, satirAraliklari(o.bicim, y - o.y, 4)]);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5;
    for (const [satir, araliklar] of o._dalgalar) { // satır satır: ince yolların taranması tek büyük yoldan ucuz
      ctx.beginPath(); sinusYolu(ctx, o.x, o.y + satir, araliklar, 8, (x) => Math.sin((o.x + x + t * 30) / 22) * 2.5); ctx.stroke();
    }
  }

  // ---------- canlı katman: ressamların bıraktığı noktalara her karede küçük şekiller ----------
  // (ctx, x, y, zaman, n, k): x, y dünya koordinatı; zaman saniye; n [0,1) noktanın evresi; k noktanın kaydı
  // Canlı süsün ChatGPT resmi varsa, bugünkü titreme/süzülme dönüşüm olarak uygulanıp çizilir
  function canliResim(ctx, ad, x, y, boy, sc = 1, dx = 0, dy = 0) {
    const im = typeof gorsel === "function" ? gorsel("canli-" + ad) : null;
    if (!im) return false;
    ctx.save();
    ctx.translate(x + dx, y + dy);
    ctx.scale(sc, sc);
    resmiKutuyaCiz(ctx, im, -boy / 2, -boy / 2, boy, boy);
    ctx.restore();
    return true;
  }

  const ENGEL_CANLI = {
    // mum alevi titrer (x, y mumun üstü)
    mum(ctx, x, y, zaman, n) {
      const t = 1 + Math.sin(zaman * 13 + n * 40) * 0.12 + Math.sin(zaman * 7.3 + n * 9) * 0.08;
      if (canliResim(ctx, "mum", x, y - 11, 13, t, 0, -(t - 1) * 4)) return;
      elips(ctx, x, y - 11, 5.5 * t, 6.5 * t, "rgba(251, 191, 36, 0.22)");
      elips(ctx, x, y - 11 - (t - 1) * 4, 2 * t, 3.5 * t, "#fde047");
      elips(ctx, x, y - 10, 0.9, 1.4, "#fffbeb");
    },
    // kovukta parlayan gözler: 3 sn'de bir 150 ms kırpar
    goz(ctx, x, y, zaman, n, k) {
      const ara = (k && k.ara) || 2.2, rr = (k && k.rr) || 1.5;
      if (canliResim(ctx, "goz", x, y, 10 + rr * 2)) return;
      if ((zaman + n * 3) % 3 < 0.15) {
        ctx.strokeStyle = "#fde047"; ctx.lineWidth = 1; ctx.lineCap = "round"; ctx.beginPath();
        ctx.moveTo(x - ara - rr, y); ctx.lineTo(x - ara + rr, y); ctx.moveTo(x + ara - rr, y); ctx.lineTo(x + ara + rr, y); ctx.stroke();
        return;
      }
      elips(ctx, x - ara, y, rr * 2.3, rr * 2.3, "rgba(253, 224, 71, 0.2)"); elips(ctx, x + ara, y, rr * 2.3, rr * 2.3, "rgba(253, 224, 71, 0.2)");
      gozler(ctx, x, y, ara, rr, "#fde047");
    },
    // kristal ve buz parıltısı: dört kollu yıldız belirip kaybolur
    parilti(ctx, x, y, zaman, n) {
      const a = Math.sin(zaman * 2.2 + n * 6.283);
      if (canliResim(ctx, "parilti", x, y, 10, 0.6 + Math.max(0, a) * 0.8)) return;
      if (a < 0.08) return;
      const s = 2 + a * 3.5, eski = ctx.globalAlpha;
      ctx.globalAlpha = eski * a;
      elips(ctx, x, y, s, s, "rgba(165, 243, 252, 0.3)");
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(x, y - s * 1.4);
      ctx.quadraticCurveTo(x, y, x + s * 1.4, y); ctx.quadraticCurveTo(x, y, x, y + s * 1.4);
      ctx.quadraticCurveTo(x, y, x - s * 1.4, y); ctx.quadraticCurveTo(x, y, x, y - s * 1.4); ctx.fill();
      ctx.globalAlpha = eski;
    },
    // sıcak su buharı: kabarcıklar yükselip söner
    buhar(ctx, x, y, zaman, n) {
      if (canliResim(ctx, "buhar", x, y - 8, 12, 1, Math.sin(zaman * 3 + n * 9) * 2)) return;
      const eski = ctx.globalAlpha;
      for (const k of [0, 0.5]) {
        const t = (zaman * 0.55 + n + k) % 1;
        ctx.globalAlpha = eski * (1 - t) * 0.7;
        elips(ctx, x + Math.sin(t * 6 + n * 9) * 2, y - t * 16, 2 + t * 3, 2 + t * 3, "rgba(255, 255, 255, 0.85)");
      }
      ctx.globalAlpha = eski;
    },
    // gülen alev ruhu: titreyen alev, iki göz ve gülümseme
    alevruhu(ctx, x, y, zaman, n) {
      const t = 1 + Math.sin(zaman * 9 + n * 30) * 0.08, sal = Math.sin(zaman * 5 + n * 12) * 1.5, h = 15 * t, g = 6.5;
      if (canliResim(ctx, "alevruhu", x, y - h * 0.4, 16, t, sal)) return;
      elips(ctx, x, y - h * 0.4, g * 1.8, h * 0.75, "rgba(249, 115, 22, 0.2)");
      for (const [renk, o] of [["#f97316", 1], ["#facc15", 0.62]]) {
        ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x - g * o, y);
        ctx.quadraticCurveTo(x - g * o * 1.1, y - h * o * 0.55, x + sal * o, y - h * o);
        ctx.quadraticCurveTo(x + g * o * 1.1, y - h * o * 0.55, x + g * o, y);
        ctx.quadraticCurveTo(x, y + g * 0.45 * o, x - g * o, y); ctx.fill();
      }
      elips(ctx, x - 2, y - h * 0.32, 0.9, 1.2, "#7c2d12"); elips(ctx, x + 2, y - h * 0.32, 0.9, 1.2, "#7c2d12");
      ctx.strokeStyle = "#7c2d12"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(x, y - h * 0.24, 2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    },
    // istasyon ve UFO ışıkları: yanıp söner (k.renk)
    isik(ctx, x, y, zaman, n, k) {
      const renk = (k && k.renk) || "#22d3ee";
      if ((zaman * 0.8 + n) % 1 < 0.45) { elips(ctx, x, y, 2, 2, "rgba(255,255,255,0.25)"); return; }
      elips(ctx, x, y, 5.5, 5.5, renk + "40");
      elips(ctx, x, y, 2.4, 2.4, renk);
      elips(ctx, x - 0.7, y - 0.7, 0.9, 0.9, "#ffffff");
    },
    // havuzda yıldız yansıması: küçük beş kollu yıldız göz kırpar
    yildiz(ctx, x, y, zaman, n) {
      const a = 0.5 + 0.5 * Math.sin(zaman * 2.8 + n * 6.283);
      const s = 1.6 + a * 2, eski = ctx.globalAlpha;
      ctx.globalAlpha = eski * (0.3 + a * 0.7);
      ctx.fillStyle = "#fef9c3"; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const b = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * 0.42 : s; ctx.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); }
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = eski;
    },
    // ateş böceği: sinüsle parlar, hafifçe süzülür
    atesbocegi(ctx, x, y, zaman, n) {
      const a = 0.5 + 0.5 * Math.sin(zaman * 2.6 + n * 6.283), dx = Math.sin(zaman * 0.9 + n * 11) * 2.5, dy = Math.cos(zaman * 1.1 + n * 7) * 2;
      if (canliResim(ctx, "atesbocegi", x, y, 9, 0.7 + a * 0.5, dx, dy)) return;
      const eski = ctx.globalAlpha;
      ctx.globalAlpha = eski * (0.25 + a * 0.75);
      elips(ctx, x + dx, y + dy, 5, 5, "rgba(190, 242, 100, 0.3)");
      elips(ctx, x + dx, y + dy, 1.7, 1.7, "#ecfccb");
      ctx.globalAlpha = eski;
    },
  };

  // ---------- önbellek ----------
  // Önbellek ölçeği: ekran çözünürlüğü × tablet yakınlaştırması, en çok 2 (bellek)
  function engelOlcegi() {
    const vs = (typeof game !== "undefined" && game.viewScale) || 1;
    return Math.min(Math.min(window.devicePixelRatio || 1, 2) * vs, 2);
  }
  function yedekRessam(ctx, w, h, r, p, B) { doldur(ctx, B, "#475569"); return []; }
  // ---------- ChatGPT engel resimleri (TEM1) ----------
  // Biçim ve çarpışma değişmez: önce çarpışma biçimi koyu palet rengiyle doldurulur (hiçbir çarpışma pikseli boş kalmaz),
  // sonra resim yalnız biçimin içine kırpılarak çizilir. Resim yoksa bugünkü kod ressamı çalışır.
  const engelGorsel = (k) => (typeof gorsel === "function" ? gorsel(k) : null);
  function engelKoyuRenk(p) {
    p = p || {};
    return p.duvarKoyu || p.koyu || p.bazalt || p.tas || p.tahta || p.toprak || p.cim || p.metal || "#334155";
  }
  // Resmi kutuya "cover" sığdırır (oran korunur, kutu taşarsa kırpma zaten biçimdir)
  function resimKapak(ctx, im, x, y, w, h) {
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    if (!(iw > 0 && ih > 0)) return;
    const o = Math.max(w / iw, h / ih), dw = iw * o, dh = ih * o;
    ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  // Duvar: resim dönmez, kırpılmaz; tamamı görünür, en-boy oranı korunur, taban yerde.
  // Yatayda parçalar yan yana (en çok ±%15 esnetme), dikeyde yukarıdan aşağı ~%30 örtüşerek yığılır.
  function duvarResmi(ctx, w, h, p, B, duvarK, kuleK, dikeyK) {
    // Çarpışma alanı (ön yüz derinliği dahil) yumuşak gölgeyle boyanır: görünmez duvara çarpılmasın
    const d = B.derinlik || 0;
    doldur(ctx, B, "rgba(0,0,0,0.25)");
    if (d) doldur(ctx, B, "rgba(0,0,0,0.25)", 0, d);
    // K18: dikey duvarın kendi resmi varsa yatay resim yığılmaz (kullanıcı: "üst üste binmiş gibi görünüyor")
    if (h >= 1.3 * w && dikeyK && dikeyDuvarResmi(ctx, w, h, engelGorsel(dikeyK))) return [];
    const im = engelGorsel(duvarK);
    if (!im) return [];
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    if (!(iw > 0 && ih > 0)) return [];
    const ar = iw / ih, dikey = h >= 1.3 * w, yatay = w >= 1.3 * h;
    if (yatay) {
      const kh = Math.max(4, h), temel = Math.max(4, kh * ar);
      const lor = Math.ceil(w / temel / 1.15 - 1e-9), hir = Math.floor(w / temel / 0.85 + 1e-9);
      let n = Math.max(1, Math.round(w / temel));
      if (hir >= Math.max(1, lor)) n = Math.min(Math.max(n, Math.max(1, lor)), hir);
      const pw = w / n;
      for (let i = 0; i < n; i++) ctx.drawImage(im, i * pw, 0, pw, kh);
    } else {
      // Dikey ve kareye yakın duvar: resim dik, genişliğe ölçekli; yukarıdan aşağı ~%30 örtüşerek yığılır, kutunun
      // tamamını kaplar (kareye yakın duvarda tek "contain" parça üstü boş bırakıyordu: görünmeyen duvara çarpılıyordu).
      // Resim kutudan uzunsa tek parça, tabanı kutunun tabanında.
      const pw = Math.max(4, w), ph = Math.max(4, pw * ih / iw), adim = ph * 0.7;
      if (ph >= h) ctx.drawImage(im, 0, h - ph, pw, ph);
      else {
        let y = 0;
        ctx.drawImage(im, 0, y, pw, ph);
        while (y + ph < h - 0.5) { y = Math.min(y + adim, h - ph); ctx.drawImage(im, 0, y, pw, ph); if (y >= h - ph - 1e-6) break; }
      }
    }
    const kim = engelGorsel(kuleK);
    if (kim) {
      const ki = kim.naturalWidth || kim.width, kj = kim.naturalHeight || kim.height;
      if (ki > 0 && kj > 0) {
        const kalin = dikey ? w : h, kh = Math.max(8, kalin * 1.6), kw = kh * ki / kj;
        const uclar = dikey ? [[w / 2, 0], [w / 2, h]] : [[0, h], [w, h]];
        for (const [x, y] of uclar) ctx.drawImage(kim, x - kw / 2, y - kh, kw, kh);
      }
    }
    return [];
  }
  // K18 dikey duvar: resim genişliğe ölçeklenir, tek parça çizilir; kutu resimden uzunsa üç dilim (üst başlık, ortadaki
  // taş/kütük bandı yinelenir, alt taban). Dilimler kaynak dikdörtgeniyle çizilir (ek yeri çizgisi olmaz), taban yerde.
  const DIKEY_UST = 0.28, DIKEY_ALT = 0.22;
  function dikeyDuvarResmi(ctx, w, h, im) {
    if (!im) return false;
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    if (!(iw > 0 && ih > 0)) return false;
    const o = w / iw, tam = ih * o;
    if (h <= tam * 1.2) { ctx.drawImage(im, 0, 0, iw, ih, 0, 0, w, h); return true; } // en çok %20 esnetme
    const ustK = ih * DIKEY_UST, altK = ih * DIKEY_ALT, ortK = ih - ustK - altK;
    const ustH = ustK * o, altH = altK * o, ortH = ortK * o, araH = h - ustH - altH;
    const n = Math.max(1, Math.round(araH / ortH)), parca = araH / n; // bant en çok ~%30 esner, yarım bant kalmaz
    for (let i = 0; i < n; i++) ctx.drawImage(im, 0, ustK, iw, ortK, 0, ustH + i * parca - 0.5, w, parca + 1);
    ctx.drawImage(im, 0, ih - altK, iw, altK, 0, h - altH, w, altH);
    ctx.drawImage(im, 0, 0, iw, ustK, 0, 0, w, ustH);
    return true;
  }
  // Harita sınırı: yatayda kusursuz şerit; dikey sınırda 90° döndür
  function sinirResmi(ctx, w, h, p, B, k) {
    doldur(ctx, B, engelKoyuRenk(p));
    const im = engelGorsel(k);
    if (!im) return [];
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    if (!(iw > 0 && ih > 0)) return [];
    const ar = iw / ih, dikey = B.yon === "sol" || B.yon === "sag";
    kirp(ctx, B, () => {
      if (!dikey) {
        const kh = h, kw = Math.max(4, kh * ar);
        for (let x = -kw; x < w + kw; x += kw) ctx.drawImage(im, x, 0, kw, kh);
      } else {
        ctx.save(); ctx.translate(w, 0); ctx.rotate(Math.PI / 2);
        const ph = w, pw = Math.max(4, ph * ar);
        for (let y = -pw; y < h + pw; y += pw) ctx.drawImage(im, y, 0, pw, ph);
        ctx.restore();
      }
    });
    return [];
  }
  // Obje resminin doğal en büyük kenarı (dünya px). Engel kutusu bundan büyükse resim doğal boyunda çizilir;
  // küçük şeyler (çiçek, fener, kulübe, araç) 90-110, büyük anıtlar 200-260. 200 ve üstü anıtlar asla tekrarlanmaz.
  const OBJE_DOGAL_BOY = {
    "ulke-TR-1": 200, "ulke-TR-2": 100, "ulke-UA-1": 110, "ulke-UA-2": 160,
    "ulke-PL-1": 190, "ulke-PL-2": 105, "ulke-DE-1": 150, "ulke-DE-2": 170,
    "ulke-GB-1": 100, "ulke-GB-2": 210, "ulke-FR-1": 250, "ulke-FR-2": 100,
    "ulke-IT-1": 240, "ulke-IT-2": 160, "ulke-ES-1": 200, "ulke-ES-2": 160,
    "ulke-MA-1": 170, "ulke-MA-2": 105, "ulke-DZ-1": 230, "ulke-DZ-2": 210,
    "ulke-CI-1": 130, "ulke-CI-2": 180, "ulke-GH-1": 110, "ulke-GH-2": 190,
    "ulke-NG-1": 220, "ulke-NG-2": 105, "ulke-CD-1": 170, "ulke-CD-2": 160,
    "ulke-AO-1": 230, "ulke-AO-2": 105, "ulke-ZA-1": 250, "ulke-ZA-2": 110,
    "ulke-MZ-1": 170, "ulke-MZ-2": 180, "ulke-MG-1": 230, "ulke-MG-2": 120,
    "ulke-TZ-1": 260, "ulke-TZ-2": 140, "ulke-UG-1": 150, "ulke-UG-2": 230,
    "ulke-KE-1": 190, "ulke-KE-2": 180, "ulke-ET-1": 210, "ulke-ET-2": 105,
    "ulke-SD-1": 220, "ulke-SD-2": 140, "ulke-EG-1": 250, "ulke-EG-2": 160,
    "ulke-YE-1": 180, "ulke-YE-2": 200, "ulke-SA-1": 160, "ulke-SA-2": 210,
    "ulke-PS-1": 150, "ulke-PS-2": 110, "ulke-IQ-1": 150, "ulke-IQ-2": 160,
    "ulke-IR-1": 210, "ulke-IR-2": 160, "ulke-UZ-1": 170, "ulke-UZ-2": 100,
    "ulke-AF-1": 100, "ulke-AF-2": 140, "ulke-PK-1": 170, "ulke-PK-2": 140,
    "ulke-IN-1": 230, "ulke-IN-2": 110, "ulke-BD-1": 100, "ulke-BD-2": 200,
    "ulke-MM-1": 150, "ulke-MM-2": 100, "ulke-TH-1": 105, "ulke-TH-2": 100,
    "ulke-MY-1": 250, "ulke-MY-2": 100, "ulke-ID-1": 160, "ulke-ID-2": 200,
    "ulke-PH-1": 230, "ulke-PH-2": 100, "ulke-VN-1": 230, "ulke-VN-2": 95,
    "ulke-CN-1": 160, "ulke-CN-2": 160, "ulke-KR-1": 170, "ulke-KR-2": 100,
    "ulke-JP-1": 190, "ulke-JP-2": 260, "ulke-RU-1": 95, "ulke-RU-2": 170,
    "ulke-CA-1": 180, "ulke-CA-2": 150, "ulke-US-1": 230, "ulke-US-2": 250,
    "ulke-MX-1": 140, "ulke-MX-2": 100, "ulke-CO-1": 200, "ulke-CO-2": 170,
    "ulke-PE-1": 230, "ulke-PE-2": 150, "ulke-BR-1": 150, "ulke-BR-2": 240,
    "ulke-AR-1": 240, "ulke-AR-2": 170,
    "tema1-obje1": 170, "tema1-obje2": 100, "tema2-obje1": 190, "tema2-obje2": 100,
    "tema3-obje1": 110, "tema3-obje2": 150, "tema4-obje1": 110, "tema4-obje2": 120,
    "tema5-obje1": 170, "tema5-obje2": 190, "tema6-obje1": 160, "tema6-obje2": 170,
  };
  // Obje resmi: dönmez, kırpılmaz; tek resim en-boy oranı korunarak kutuya (×1.15, alt-orta hizalı) sığdırılır.
  // Çarpışma alanı koyu renkle doldurulmaz; yerde yumuşak bir gölge elipsi kalır. Resim kutunun üstünden/yanından taşabilir.
  function objeResmi(ctx, w, h, p, B, k) {
    // Yumuşak zemin gölgesi: yalnız çarpışma kutusunun İÇİNDE (elips dolgusu kutu dikdörtgeniyle sınırlı, kenara doğru söner); kutu resmin
    // en-boyuna uydurulduğundan (objeKutusuUydur) gölge resmin ayak izinden dışarı taşmaz (OBJ1).
    if (w > 0 && h > 0) {
      ctx.save();
      ctx.translate(w / 2, h / 2); ctx.scale(1, h / w);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.78);
      gr.addColorStop(0, "rgba(0,0,0,0.22)");
      gr.addColorStop(0.55, "rgba(0,0,0,0.2)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gr; ctx.fillRect(-w / 2, -w / 2, w, w); // ölçekli uzayda kutunun kendisi: gölge kutudan taşmaz
      ctx.restore();
    }
    const im = engelGorsel(k);
    if (!im) return [];
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    if (!(iw > 0 && ih > 0)) return [];
    // Hedef kutu: nesne kutusunun ×1.15'i, alt-orta hizalı; resim altı kutunun 4 px altında
    const tw = w * 1.15, th = h * 1.15, alt = h + 4;
    const olcek = Math.min(tw / iw, th / ih), dw = iw * olcek, dh = ih * olcek;
    const rect = [w / 2 - dw / 2, alt - dh, dw, dh];
    if (B) B._objeYerlesim = { kapak: false, kayit: [rect] };
    ctx.drawImage(im, rect[0], rect[1], rect[2], rect[3]);
    return [];
  }
  function golResmi(ctx, w, h, p, B, k) {
    doldur(ctx, B, engelKoyuRenk(p));
    const im = engelGorsel(k);
    if (im) kirp(ctx, B, () => resimKapak(ctx, im, 0, 0, w, h));
    return [];
  }
  // Bu engel için resim ressamı varsa döndürür (yoksa null: bugünkü kod ressamı çizsin)
  function engelResimRessami(o) {
    const dt = typeof o.tema === "string";
    if (o.tur === "sinir") {
      if (dt) return null; // Dünya Turu'nda sınır şeridi resmi yok
      const k = `tema${o.tema + 1}-sinir`;
      return engelGorsel(k) ? (ctx, w, h, r, p, B) => sinirResmi(ctx, w, h, p, B, k) : null;
    }
    if (o.tur === "duvar") {
      if (dt) {
        const u = window.ulkeKodla && window.ulkeKodla(o.tema), A = u && u.aile;
        if (!A) return null;
        const k = `aile-${A}-duvar`;
        return engelGorsel(k) ? (ctx, w, h, r, p, B) => duvarResmi(ctx, w, h, p, B, k, `aile-${A}-kule`) : null;
      }
      const k = `tema${o.tema + 1}-duvar`;
      return engelGorsel(k) ? (ctx, w, h, r, p, B) => duvarResmi(ctx, w, h, p, B, k, `tema${o.tema + 1}-buyuk`, `tema${o.tema + 1}-duvar-dikey`) : null;
    }
    if (o.tur === "obje1" || o.tur === "obje2") {
      const k = dt ? `ulke-${o.tema}-${o.tur === "obje1" ? 1 : 2}` : `tema${o.tema + 1}-${o.tur}`;
      return engelGorsel(k) ? (ctx, w, h, r, p, B) => objeResmi(ctx, w, h, p, B, k, r) : null;
    }
    // Gölet: temanın göl ressamı (leke biçimi + taş/kum/buz kıyı, içi ChatGPT su dokusu). Kıyılı göl resmi kullanılmaz:
    // leke biçimine sığmayan resim kırpılınca kıyıları kesik görünüyordu (kullanıcı: "aynı sınır yöntemleriyle", 27 Kasım).
    return null;
  }
  function ressam(o) {
    if (o.tur === "diken") return [dikenCiz, {}];
    if (o.tur === "lav") return [lavCiz, {}];
    // Dünya Turu'nda tema ülke kodudur: aile duvarı ve suyu, ülkenin objeleri, birleşik palet (ulkeler.js ulkeEngelSeti)
    const T = window.ENGEL_TEMALARI || [];
    const set = typeof o.tema === "string" ? (window.ulkeEngelSeti(o.tema) || {}) : (T[o.tema] || T[0] || {});
    const resim = engelResimRessami(o);
    return [resim || set[o.tur === "sinir" ? "duvar" : o.tur] || yedekRessam, set.palet || {}];
  }
  // Engeli ctx'e yerel koordinatta çizer; canlı katman noktalarını döndürür. Rastgele dizi biçiminkinden ayrı tohumdan.
  function engelBoya(ctx, o) {
    const [ciz, palet] = ressam(o);
    _boyaTema = o.tema;
    try { return ciz(ctx, o.w, o.h, engelRastgele((o.tohum ^ 0x5bd1e995) >>> 0), palet, o.bicim) || []; }
    finally { _boyaTema = null; }
  }
  // Tema dokusu sonradan yüklenince (gorsel.js) suların önbellek resmi yeniden çizilsin
  window.engelSuOnbellegiSil = () => { for (const o of ((typeof game !== "undefined" && game.waters) || [])) o._resim = null; };
  // Engellerin resmi görseller yüklenmeden çizildiyse "gorsel-yuklendi" olayında önbellek boşaltılır (TEM1)
  window.engelOnbellegiSil = () => {
    if (typeof game === "undefined" || !game) return;
    for (const l of [game.walls || [], game.waters || [], game.spikes || [], game.lavas || []]) for (const o of l) { o._resim = null; o._olcek = 0; o._isinma = 0; }
    _isinmaTamam = 0;
  };
  window.addEventListener("gorsel-yuklendi", () => window.engelOnbellegiSil());
  // Engelin önbellek resmi { c: tuval, canli: noktalar }; ölçek değişmişse yeniden çizilir. Tuval oluşturulamazsa null
  // (çağıran o karede doğrudan çizer).
  let _boyanan = 0; // bu karede çizilen resim (engelleriCiz sıfırlar; ısınma bütçesi için)
  let _isinmaTamam = 0, _isinmaN = -1, _isinmaW = null; // bütün engeller bu ölçekte ısındı: kare başına tarama yapılmaz (PERF1)
  // Obje resmi varsa anahtarı (objeResmi resim çizer); yoksa null. Önbellek payı buna göre büyütülür.
  function objeResimAnahtar(o) {
    if (o.tur !== "obje1" && o.tur !== "obje2") return null;
    const dt = typeof o.tema === "string";
    const k = dt ? `ulke-${o.tema}-${o.tur === "obje1" ? 1 : 2}` : `tema${o.tema + 1}-${o.tur}`;
    return engelGorsel(k) ? k : null;
  }
  // Obje önbelleğinin tuval payı: resim ve gölge kutunun dışına taşabilsin (sağ/sol %30, üst %40, alt %30)
  function objePayi(o) { return { x: Math.ceil(o.w * 0.3), y: Math.ceil(o.h * 0.4), alt: Math.ceil(o.h * 0.3) }; }
  // Duvar önbelleğinin tuval payı: uç kuleleri kutunun üstünden/yanından taşabilsin (FIXG2)
  function duvarPayi(o) {
    const w = o.w, h = o.h, alt = Math.ceil(h * 0.3);
    if (h >= 1.3 * w) return { x: Math.ceil(w * 2), y: Math.ceil(w * 1.7), alt };
    if (w >= 1.3 * h) return { x: Math.ceil(h * 2), y: Math.ceil(h * 0.7), alt };
    const b = Math.ceil(Math.max(w, h) * 0.5);
    return { x: b, y: b, alt };
  }
  function engelResmi(o) {
    const s = engelOlcegi();
    if (o._resim && o._olcek === s) return o._resim;
    o._resim = null; o._olcek = s;
    // Obje payı resim henüz yüklenmemişken de verilir: gölge önbellek kenarında kesilmesin.
    const pay = (o.tur === "obje1" || o.tur === "obje2") ? objePayi(o) : o.tur === "duvar" ? duvarPayi(o) : null;
    const px = pay ? pay.x : 0, py = pay ? pay.y : 0, palt = pay ? pay.alt : 0;
    const gw = Math.ceil((o.w + 2 * px) * s), gh = Math.ceil((o.h + py + palt) * s);
    if (!(gw > 0 && gh > 0)) return null;
    let c = null, cx = null;
    try { c = document.createElement("canvas"); c.width = gw; c.height = gh; cx = c.getContext("2d"); } catch (_) { cx = null; }
    if (!cx || c.width !== gw || c.height !== gh) return null;
    cx.scale(s, s); cx.translate(px, py);
    _boyanan++;
    const canli = engelBoya(cx, o);
    return (o._resim = { c, canli, pay });
  }
  // Su başka bir gölle kesişiyor mu (kesişen göller ikinci geçişte maskeli iç resimle birleşir)
  function komsuMu(o) {
    if (o._komsu === undefined) o._komsu = (game.waters || []).some((b) => b !== o && b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
    return o._komsu;
  }
  // Kesişen göllerin ikinci geçişi için suyun yalnız biçim içi (kırpma yolu yerine bir kez maskelenmiş resim)
  function icResmi(o) {
    const R = engelResmi(o);
    if (!R) return null;
    if (R.ic !== undefined) return R.ic;
    R.ic = null;
    const c = document.createElement("canvas"); c.width = R.c.width; c.height = R.c.height;
    const cx = c.getContext("2d");
    if (!cx) return null;
    cx.drawImage(R.c, 0, 0);
    cx.globalCompositeOperation = "destination-in"; cx.scale(o._olcek, o._olcek); doldur(cx, o.bicim, "#000", 0, 0, -1.5); // kenar pikseli koyu kıyıyı taşımasın
    return (R.ic = c);
  }
  // Lavın turuncu parlaması: biçimin gölgesi bir kez çizilir, her karede saydamlığı nabız gibi değişir
  const PARLAMA = 26;
  function parlamaResmi(o) {
    const s = engelOlcegi();
    if (o._parlamaOlcek === s) return o._parlama;
    o._parlama = null; o._parlamaOlcek = s;
    let c = null, cx = null;
    try { c = document.createElement("canvas"); c.width = Math.ceil((o.w + 2 * PARLAMA) * s); c.height = Math.ceil((o.h + 2 * PARLAMA) * s); cx = c.getContext("2d"); } catch (_) { cx = null; }
    if (!cx) return null;
    cx.scale(s, s); cx.shadowColor = "#fb923c"; cx.shadowBlur = 20 * s;
    doldur(cx, o.bicim, "#fb923c", PARLAMA, PARLAMA, 6);
    return (o._parlama = c);
  }
  // Önbellek resmini basar. Önbellek ölçeği tuvalin cihaz ölçeğiyle aynıysa (telefonlar) piksele hizalı 1:1: süzgeç
  // gerekmez, yazılımsal taramada ~10 kat hızlı ve bulanıklık yok (konum en çok yarım cihaz pikseli kayar). Değilse
  // (tablette ölçek 2'de sınırlı) dikdörtgene ölçeklenir. _matris her karede engelleriCiz'in başında okunur.
  let _matris = null;
  function bas(ctx, c, x, y, w, h) {
    const m = _matris;
    if (m && m.bir) ctx.drawImage(c, (Math.round(m.a * x + m.e) - m.e) / m.a, (Math.round(m.a * y + m.f) - m.f) / m.a, c.width / m.a, c.height / m.a);
    else ctx.drawImage(c, x, y, w, h);
  }
  function resimCiz(ctx, o) {
    const R = engelResmi(o);
    if (R) {
      const p = R.pay;
      if (p) bas(ctx, R.c, o.x - p.x, o.y - p.y, o.w + 2 * p.x, o.h + p.y + p.alt);
      else bas(ctx, R.c, o.x, o.y, o.w, o.h);
      return R.canli;
    }
    ctx.save(); ctx.translate(o.x, o.y);
    const canli = engelBoya(ctx, o);
    ctx.restore();
    return canli;
  }
  function canliCiz(ctx, o, canli, zaman) {
    if (!canli || !canli.length) return;
    for (const k of canli) { const f = ENGEL_CANLI[k.tur]; if (f) f(ctx, o.x + k.x, o.y + k.y, zaman, k.n || 0, k); }
  }

  // ---------- ZEM3A: derinlik sırası ve örtme solması (yalnız görsel) ----------
  // Referans çizgisi oyuncunun ayakları. Ölü/oyuncu yoksa +Infinity: her şey "arka" (bugünkü davranış).
  function zem3aRefY() {
    if (typeof game === "undefined" || !game || !game.player || game.player.dead) return Infinity;
    const p = game.player;
    if (!Number.isFinite(p.y)) return Infinity;
    return p.y + (Number.isFinite(p.r) ? p.r : 22);
  }
  // Yakındaki (yatayda oyuncudan en çok 160 px) ve tabanı referansın önünde olan nesne "ön"dür.
  function zem3aOnKutu(x, y, w, h, alt) {
    const r = zem3aRefY();
    if (!Number.isFinite(r)) return false;
    const taban = alt == null ? y + h : alt;
    if (!(taban > r)) return false;
    if (typeof game === "undefined" || !game || !game.player) return false;
    const px = game.player.x;
    return x < px + 160 && x + w > px - 160;
  }
  // Ön nesne oyuncunun 30×60 gövde kutusunu örtüyorsa 0.5 saydamlığa, örtmüyorsa 1'e yumuşak geçiş.
  function zem3aAlfa(o, x, y, w, h) {
    const p = (typeof game !== "undefined" && game && game.player) || null;
    let hedef = 1;
    if (p && !p.dead) {
      const px = p.x, py = p.y;
      if (x < px + 15 && x + w > px - 15 && y < py && y + h > py - 60) hedef = 0.5;
    }
    const simdi = performance.now();
    const dt = o._solmaSon ? Math.max(0, Math.min(100, simdi - o._solmaSon)) : 16;
    o._solmaSon = simdi;
    let s = typeof o._solma === "number" ? o._solma : 1;
    const adim = (dt / 150) * 0.5;
    s += Math.max(-adim, Math.min(adim, hedef - s));
    if (Math.abs(hedef - s) <= 0.05) s = hedef;
    o._solma = s;
    return s;
  }
  window.ZEM3A = { refY: zem3aRefY, onKutu: zem3aOnKutu, alfa: zem3aAlfa };

  // ---------- çizim hattı (render her karede çağırır; ctx dünya koordinatında) ----------
  let _sonOlcek = 0, _sira = null;
  // Donatılar yolculuk.js'te çizilir; süzülmüş duvar listesi her karede yeniden kurulmaz (duvar dizisi ya da boyu değişince)
  let _cizDuvar = { kaynak: null, n: -1, liste: [] };
  const cizimDuvarlari = () => {
    const W = game.walls || [];
    if (_cizDuvar.kaynak !== W || _cizDuvar.n !== W.length) _cizDuvar = { kaynak: W, n: W.length, liste: W.some((o) => o.donati) ? W.filter((o) => !o.donati) : W };
    return _cizDuvar.liste;
  };
  const listeler = () => [cizimDuvarlari(), game.waters || [], game.spikes || [], game.lavas || []];
  // "Hepsinin biçimi var mı" yanıtı dört listenin kimliği ve boyu değişmedikçe yeniden hesaplanmaz
  // (duvarSirasi'nın _sira'sı gibi); engelBicimleriniKur sonrası bir kez tazelenir.
  let _bicimTam = { kaynak: null, n: null, tam: true };
  function bicimlerTamMi(ls) {
    const n = [ls[0].length, ls[1].length, ls[2].length, ls[3].length];
    if (!_bicimTam.kaynak || _bicimTam.kaynak[0] !== ls[0] || _bicimTam.kaynak[1] !== ls[1] ||
      _bicimTam.kaynak[2] !== ls[2] || _bicimTam.kaynak[3] !== ls[3] ||
      _bicimTam.n[0] !== n[0] || _bicimTam.n[1] !== n[1] || _bicimTam.n[2] !== n[2] || _bicimTam.n[3] !== n[3]) {
      _bicimTam = { kaynak: ls.slice(), n, tam: !ls.some((l) => l.some((o) => !o.bicim)) };
    }
    return _bicimTam.tam;
  }
  // duvar ve objeler alt kenarlarına göre (önde duran sonra çizilir); liste her bölümde yenidir
  function duvarSirasi() {
    const W = game.walls || [];
    if (!_sira || _sira.kaynak !== W || _sira.n !== W.length) _sira = { kaynak: W, n: W.length, liste: W.filter((o) => !o.donati).sort((a, b) => (a.y + a.h) - (b.y + b.h)) };
    return _sira.liste;
  }
  // Önbellek ısınması: bölüm başında (ve ölçek değişince) bütün engellerin resmi, her karede çizimden sonra, kameraya en
  // yakından başlayarak hazırlanır (lavda parlama, kesişen gölde maskeli iç resim de). O karede hiç resim çizilmediyse
  // en az bir engel, sonra karenin engel işi ISINMA_MS'yi bulana kadar. Engel görüş alanına girdiğinde resmi hazırdır:
  // oyun ortasında ilk çizim sıçraması olmaz. Her engel ölçek başına bir kez denenir (tuval oluşturulamazsa döngü yok).
  const ISINMA_MS = 6;
  function onbellegiIsit(t0, s) {
    const n = (game.walls || []).length + (game.waters || []).length + (game.spikes || []).length + (game.lavas || []).length;
    if (_isinmaTamam === s && _isinmaN === n && _isinmaW === game.walls) return; // yeni bölümde dizi değişir: yeniden ısınır
    _isinmaTamam = 0;
    const cam = game.camera || { x: 0, y: 0 }, mx = cam.x + (game.W || 0) / 2, my = cam.y + (game.H || 0) / 2;
    for (let ilk = _boyanan === 0; ilk || performance.now() - t0 < ISINMA_MS; ilk = false) {
      let en = null, enD = Infinity;
      for (const l of listeler()) for (const o of l) {
        if (!o.bicim || o._isinma === s || o.gecit) continue;
        const d = Math.hypot(o.x + o.w / 2 - mx, o.y + o.h / 2 - my);
        if (d < enD) { enD = d; en = o; }
      }
      if (!en) { _isinmaTamam = s; _isinmaN = n; _isinmaW = game.walls; return; }
      en._isinma = s;
      engelResmi(en);
      if (en.tur === "lav") parlamaResmi(en);
      else if (en.tur === "su" && komsuMu(en)) icResmi(en);
    }
  }
  // ---- Canlı ülke objeleri (GOR2): an-<obje anahtarı>-1..3 kareleri ----
  // Her obje tohumundan 4–8 sn'lik dönem; dönemin ilk 5/8 sn'si 1-2-3-2-1 (8 kare/sn). Kare 1 durağan resimle
  // aynıdır. Yalnız görüşteki, kareleri hazır objelerde; kare başına en çok birkaç obje (çağıran sayaç verir).
  const OBJE_ANIM_SIRA = [1, 2, 3, 2, 1];
  // SES1: canlı obje resim anahtarı → ses adı
  const CANLI_SES = {
    "ulke-CN-1": "panda", "ulke-ID-1": "komodo", "ulke-PL-1": "ejder-alev", "ulke-PL-2": "leylek",
    "ulke-CI-2": "fil", "ulke-ZA-2": "penguen", "ulke-MG-2": "lemur", "ulke-KE-1": "zurafa",
    "ulke-KE-2": "flamingo", "ulke-ET-2": "gelada", "ulke-SD-2": "deve", "ulke-IN-2": "tavus",
    "ulke-BD-2": "kaplan", "ulke-CA-2": "kunduz", "ulke-MX-2": "aksolotl", "ulke-PE-2": "lama",
    "ulke-BR-1": "papagan", "tema5-obje1": "yavru-ejder",
  };
  let _azSesSon = -1e9;
  function objeAnimAnahtar(o) {
    const dt = typeof o.tema === "string";
    return dt ? `ulke-${o.tema}-${o.tur === "obje1" ? 1 : 2}` : `tema${o.tema + 1}-${o.tur}`;
  }
  // Animasyon penceresi başlarken (k null → kare) bir kez ses çal; pencere bitince (k null) bayrağı sıfırla.
  // Hareketi azaltmada pencere hiç açılmaz: görünen obje başına tohumlu 6-10 sn, aynı anda en çok bir obje.
  function canliObjeSesi(o, k, gorunur, zaman) {
    if (!gorunur) return;
    const az = typeof aeAzHareket === "function" && aeAzHareket();
    if (az) {
      if (!k) o._sesVerildi = false;
      const ad = CANLI_SES[k || objeAnimAnahtar(o)];
      if (!ad) return;
      const h = (o.tohum >>> 0) || 0x9e3779b9;
      const periyot = 6 + ((h % 997) / 997) * 4;
      if (o._azSesSonra == null) o._azSesSonra = zaman + periyot * (((h >>> 7) % 1000) / 1000);
      if (zaman < o._azSesSonra || zaman - _azSesSon < 2) return;
      o._azSesSonra = zaman + periyot;
      _azSesSon = zaman;
      if (typeof audio !== "undefined" && audio.canliSes) audio.canliSes(ad, o.x + o.w / 2, o.y + o.h / 2);
      return;
    }
    if (!k) { o._sesVerildi = false; return; }
    if (o._sesVerildi) return;
    o._sesVerildi = true;
    const ad = CANLI_SES[k];
    if (ad && typeof audio !== "undefined" && audio.canliSes) audio.canliSes(ad, o.x + o.w / 2, o.y + o.h / 2);
  }
  function objeAnimKare(o, zaman) {
    if (o.tur !== "obje1" && o.tur !== "obje2") return null;
    if (typeof animHazir !== "function" || typeof animCiz !== "function") return null;
    if (typeof aeAzHareket === "function" && aeAzHareket()) return null;
    let k = o._animAd;
    if (k === undefined || o._animTema !== o.tema) { // anahtar dizgisi engel başına bir kez (her karede kurulmaz)
      const dt = typeof o.tema === "string";
      k = o._animAd = dt ? `ulke-${o.tema}-${o.tur === "obje1" ? 1 : 2}` : `tema${o.tema + 1}-${o.tur}`;
      o._animTema = o.tema;
    }
    if (animHazir(k) < 3) return null;
    const h = (o.tohum >>> 0) || 0x9e3779b9;
    const periyot = 4 + ((h % 997) / 997) * 4;          // 4–8 sn
    const faz = (((h >>> 10) % 997) / 997) * periyot;
    const t = (zaman + faz) % periyot, sure = OBJE_ANIM_SIRA.length / 8;
    if (t >= sure) return null;
    return [k, OBJE_ANIM_SIRA[Math.min(OBJE_ANIM_SIRA.length - 1, Math.floor(t * 8))]];
  }
  // Durağan resmin (objeResmi) kaydettiği TEK hedef dikdörtgenine, kırpmadan çizer: resim kutuya "contain" sığar,
  // alt-orta hizalıdır. Durağan resim henüz çizilmediyse (kayıt yok) canlı kare de çizilmez.
  function objeAnimCiz(ctx, o, k, kare) {
    const im = typeof gorsel === "function" ? gorsel(typeof animAnahtarlari === "function" ? animAnahtarlari(k)[kare - 1] : `an-${k}-${kare}`) : null;
    const B = o.bicim, Y = B && B._objeYerlesim, q = Y && Y.kayit && Y.kayit[0];
    if (!im || !q) return false;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.drawImage(im, q[0], q[1], q[2], q[3]);
    ctx.restore();
    return true;
  }
  function engelleriCiz(ctx, kip) {
    if (typeof game === "undefined") return;
    const t0 = performance.now();
    _boyanan = 0;
    const s = engelOlcegi();
    const ls = listeler();
    if (s !== _sonOlcek) { for (const l of ls) for (const o of l) { o._resim = null; o._olcek = 0; o._isinma = 0; } _sonOlcek = s; _isinmaTamam = 0; } // ekran döndü: hepsi yeniden
    if (!bicimlerTamMi(ls)) { engelBicimleriniKur(); _bicimTam.tam = !ls.some((l) => l.some((o) => !o.bicim)); }
    const m = ctx.getTransform ? ctx.getTransform() : null;
    _matris = m && { a: m.a, e: m.e, f: m.f, bir: m.b === 0 && m.c === 0 && m.a === m.d && Math.abs(m.a - s) < 1e-9 };
    const cam = game.camera || { x: 0, y: 0 }, W = game.W || 0, H = game.H || 0;
    const gor = (o, b) => o.x - b < cam.x + W && o.x + o.w + b > cam.x && o.y - b < cam.y + H && o.y + o.h + b > cam.y;
    const zaman = performance.now() / 1000;
    // "on" geçişi yalnız öndeki duvar/objeleri çizer; düz katmanlar (su, diken, lav) her zaman "arka"da kalır.
    if (kip !== "on") {
      // Sular iki geçişte: önce hepsi kıyısıyla, sonra başka gölle kesişenlerin yalnız suyu yeniden (kesişen göller tek göl
      // gibi birleşir); dalgalar ve canlı süsler en üstte
      // Görüşte su yoksa filtre/map dizileri hiç kurulmaz (yolculuk haritasında çoğu karede su görünmez)
      let sular = null;
      if (game.waters) for (const o of game.waters) if (!o.gecit && gor(o, 12)) (sular || (sular = [])).push(o);
      if (sular) {
        const canlilar = sular.map((o) => resimCiz(ctx, o));
        sular.forEach((o, i) => {
          const ic = komsuMu(o) ? icResmi(o) : null;
          if (ic) bas(ctx, ic, o.x, o.y, o.w, o.h);
          dalgalar(ctx, o, zaman);
          canliCiz(ctx, o, canlilar[i], zaman);
        });
      }
      for (const o of game.spikes || []) if (gor(o, 6)) resimCiz(ctx, o);
      for (const o of game.lavas || []) {
        if (!gor(o, 40)) continue;
        const parlama = parlamaResmi(o);
        if (parlama) {
          const eski = ctx.globalAlpha;
          ctx.globalAlpha = eski * (0.6 + Math.sin(zaman * 1000 / 220) * 0.25);
          bas(ctx, parlama, o.x - PARLAMA, o.y - PARLAMA, o.w + 2 * PARLAMA, o.h + 2 * PARLAMA);
          ctx.globalAlpha = eski;
        }
        resimCiz(ctx, o);
        lavCanli(ctx, o.x, o.y, o.w, o.h, o.bicim);
        alevler(ctx, o, zaman);
      }
    }
    let animSayaci = 0;
    for (const o of duvarSirasi()) {
      if (!gor(o, 8)) continue;
      // Objede görsel kutu = çizilen resmin hedef dikdörtgeni (dünya koordinatı); taban çizgisi çarpışma kutusunun altı
      const q = o.bicim && o.bicim._objeYerlesim && o.bicim._objeYerlesim.kayit && o.bicim._objeYerlesim.kayit[0];
      const kx = q ? o.x + q[0] : o.x, ky = q ? o.y + q[1] : o.y, kw = q ? q[2] : o.w, kh = q ? q[3] : o.h;
      const on = zem3aOnKutu(kx, ky, kw, kh, o.y + o.h);
      if (kip === "arka" && on) continue; // ön sırada çizilecek
      if (kip === "on" && !on) continue;
      if (!on) o._solma = 1; // arka nesne hiç solmaz
      const eskiAlfa = ctx.globalAlpha;
      if (on) { const a = zem3aAlfa(o, kx, ky, kw, kh); if (a !== 1) ctx.globalAlpha = eskiAlfa * a; }
      canliCiz(ctx, o, resimCiz(ctx, o), zaman);
      const a = objeAnimKare(o, zaman);
      if (a && animSayaci < 3 && objeAnimCiz(ctx, o, a[0], a[1])) animSayaci++;
      canliObjeSesi(o, a ? a[0] : null, true, zaman); // SES1: canlı obje sesi (görüşteki obje)
      ctx.globalAlpha = eskiAlfa;
    }
    if (kip !== "on") onbellegiIsit(t0, s);
  }

  Object.assign(window, { engelRastgele, engelTohumu, engelUzaklik, engelOlustur, objeKutusuUydur, engelBicimleriniKur, engelCarpisir, engelMesafesi, ENGEL_AILELERI,
    engelOlcegi, engelResmi, engelBoya, engelleriCiz, lavCanli, ENGEL_CANLI, objeAnimKare, objeAnimCiz,
    CANLI_SES, canliObjeSesi });
  window.ENGEL = { yol, doldur, cizgi, kirp, hatCiz, kenarNoktalari, icNoktalar, karistir, acik, koyu, elips, yuvarlak, kutuYolu, tasOrgu, gozler, cimTutami, sinirla, parcaUzaklik,
    kayalikKenar, suTabani, dikenCiz, lavCiz };
})();
