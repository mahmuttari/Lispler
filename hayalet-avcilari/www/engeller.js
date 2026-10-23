/* ============================================================
   HAYALET AVCILARI — ENGELLER (3.13.0)
   Su, duvar, obje, diken ve lavın BİÇİMİ: engelin dikdörtgeninin içinde kalan daire (d), elips (e) ve yuvarlak köşeli
   kutu (k) parçalarının birleşimi. Çarpışma biçimi izler (collidesWalls/Waters/Spikes/Lavas → engelCarpisir).
   Harita üretimi (buildWalls/buildWaters/buildHazards: yer, boyut, çakışma) değişmez; biçim her build işlevinin
   sonunda engelBicimleriniKur() ile eklenir. Bütün süs ve biçimler tohumlu rastgele: her cihazda aynı.
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
  // işaretli uzaklık (içeride eksi); elips yaklaşık
  function parcaUzaklik(q, x, y) {
    if (q.t === "d") return Math.hypot(x - q.x, y - q.y) - q.r;
    if (q.t === "e") return (Math.hypot((x - q.x) / q.rx, (y - q.y) / q.ry) - 1) * Math.min(q.rx, q.ry);
    const cx = q.x + q.w / 2, cy = q.y + q.h / 2, qx = Math.abs(x - cx) - (q.w / 2 - q.rr), qy = Math.abs(y - cy) - (q.h / 2 - q.rr);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - q.rr;
  }
  function engelUzaklik(P, x, y) { let m = Infinity; for (const q of P) m = Math.min(m, parcaUzaklik(q, x, y)); return m; }
  // Birleşimin dış hattı boyunca noktalar (her parçanın çevresinden, başka parçanın içinde kalmayanlar); y'ye göre sıralı
  function kenarNoktalari(P, aralik, b = 0) {
    const out = [];
    for (const q of P) {
      const ekle = (x, y, nx, ny) => { if (engelUzaklik(P, x - nx * b * 0.5, y - ny * b * 0.5) > b - 0.8) out.push({ x, y, nx, ny }); };
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
    return P;
  }
  const AILELER = { kale: bicimKale, harabe: bicimHarabe, kutuk: bicimKutuk, kaya: bicimKaya, istasyon: bicimIstasyon, yama: (w, h, r) => bicimYama(w, h, r) };
  // Görselin biçim dışına taşma payı (kıyı, kenar süsü, gölge)
  const PAY = { kale: 4, harabe: 4, kutuk: 4, kaya: 4, istasyon: 4, yama: 3, plaka: 2.5, sinir: 0 };
  // Tema başına duvar ve obje aileleri (spec §4); belirtilmeyen obje "yama"
  const ENGEL_AILELERI = [{ duvar: "kale" }, { duvar: "kutuk" }, { duvar: "harabe" }, { duvar: "kale" }, { duvar: "kaya" }, { duvar: "istasyon", obje1: "kaya" }];

  function buyut(q, b) {
    if (q.t === "d") return { ...q, r: q.r + b };
    if (q.t === "e") return { ...q, rx: q.rx + b, ry: q.ry + b };
    return { ...q, x: q.x - b, y: q.y - b, w: q.w + 2 * b, h: q.h + 2 * b, rr: q.rr + b };
  }

  // Kutuya biçim, çarpışma ve süs bilgisi ekler (yerinde) ve kutuyu döndürür
  function engelOlustur(o, tur, tema, tohum, yon) {
    const r = engelRastgele(tohum), set = ENGEL_AILELERI[tema] || ENGEL_AILELERI[0];
    let aile, P, pay;
    if (tur === "sinir") { aile = "sinir"; P = bicimSinir(o.w, o.h, yon); }
    else if (tur === "su" || tur === "lav") { aile = "gol"; pay = tur === "su" ? 9 : 7; P = bicimGol(o.w, o.h, r, pay); }
    else if (tur === "diken") { aile = "plaka"; P = bicimPlaka(o.w, o.h, r); }
    else { aile = set[tur] || (tur === "duvar" ? "kale" : "yama"); P = AILELER[aile](o.w, o.h, r); }
    if (pay === undefined) pay = PAY[aile];
    const derinlik = P.derinlik || 0;
    // Çarpışma: duvar ailesinde ön yüz dahil (biçim + derinlik kadar aşağı kaydırılmış kopyası); objede kenar süsü (+3);
    // dikende kırmızı kenar (+2,5); su, lav ve sınırda biçimin kendisi (kıyı yürünür)
    const carpisma = derinlik ? P.concat(P.map((q) => ({ ...q, y: q.y + derinlik })))
      : aile === "yama" ? P.map((q) => buyut(q, 3)) : aile === "plaka" ? P.map((q) => buyut(q, 2.5)) : P.slice();
    return Object.assign(o, { tur, tema, tohum, yon: yon || null, aile, bicim: P, derinlik, carpisma, pay });
  }

  // build işlevlerinin sonunda: biçimi olmayan her engeli tamamlar (kılık: kesişen iç blok duvar, değilse (i + bölüm) % 3)
  function engelBicimleriniKur() {
    if (typeof game === "undefined" || !game.walls) return;
    const L = game.level, tema = (L - 1) % 6, ic = game.walls.slice(4);
    const kesisir = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    game.walls.forEach((o, i) => {
      if (o.bicim) return;
      if (i < 4) { engelOlustur(o, "sinir", tema, engelTohumu(L, "sinir", i, o), ["ust", "alt", "sol", "sag"][i]); return; }
      const k = i - 4;
      const tur = ic.some((b) => b !== o && kesisir(o, b)) ? "duvar" : ["duvar", "obje1", "obje2"][(k + L) % 3];
      engelOlustur(o, tur, tema, engelTohumu(L, tur, k, o));
    });
    for (const [liste, tur] of [[game.waters, "su"], [game.spikes, "diken"], [game.lavas, "lav"]]) {
      (liste || []).forEach((o, i) => { if (!o.bicim) engelOlustur(o, tur, tema, engelTohumu(L, tur, i, o)); });
    }
  }

  // Dikdörtgenle ön eleme, sonra biçimin işaretli uzaklığı; biçimi kurulmamış engelde dikdörtgen
  function engelCarpisir(liste, x, y, r) {
    if (!liste) return false;
    for (const o of liste) {
      if (x + r <= o.x || x - r >= o.x + o.w || y + r <= o.y || y - r >= o.y + o.h) continue;
      if (!o.carpisma) {
        const cx = Math.max(o.x, Math.min(x, o.x + o.w)), cy = Math.max(o.y, Math.min(y, o.y + o.h));
        if (Math.hypot(x - cx, y - cy) < r) return true;
        continue;
      }
      if (engelUzaklik(o.carpisma, x - o.x, y - o.y) < r) return true;
    }
    return false;
  }

  Object.assign(window, { engelRastgele, engelTohumu, engelUzaklik, engelOlustur, engelBicimleriniKur, engelCarpisir, ENGEL_AILELERI });
  window.ENGEL = { yol, doldur, cizgi, kirp, hatCiz, kenarNoktalari, icNoktalar, karistir, acik, koyu, elips, yuvarlak, kutuYolu, tasOrgu, gozler, cimTutami, sinirla, parcaUzaklik };
})();
