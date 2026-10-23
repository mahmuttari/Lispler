/* Engel görselleri — TASLAK 2 (yalnız tasarım için; ürün kodu değildir)
   Her engelin BİÇİMİ, dikdörtgeninin içinde kalan parçaların birleşimidir: daire (d), elips (e), yuvarlak kutu (k).
   Çizim de çarpışma da bu biçimi izler: hat dikdörtgen değil, değişken yay ve dairelerden oluşur.
   Ressam (ctx, w, h, r, p, P): yerel koordinatta (0,0)-(w,h) çizer; r tohumlu rastgele, p tema paleti, P biçim. */
(function () {
  // ---------- yardımcılar ----------
  function rastgele(tohum) {
    let s = (tohum >>> 0) || 0x9e3779b9;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function karistir(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = (sh) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
    return "#" + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
  }
  const acik = (c, k) => karistir(c, "#ffffff", k);
  const koyu = (c, k) => karistir(c, "#000000", k);
  const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));
  function elips(ctx, x, y, rx, ry, renk) { ctx.fillStyle = renk; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); ctx.fill(); }
  // yuvarlak köşeli kutu alt yolu (beginPath yok: birleşim yoluna eklenir; saat yönünde)
  function kutuYolu(ctx, x, y, w, h, rr) {
    rr = Math.max(0, Math.min(rr, w / 2, h / 2));
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
  }
  function yuvarlak(ctx, x, y, w, h, rr) { ctx.beginPath(); kutuYolu(ctx, x, y, w, h, rr); }

  // ---------- biçim (parça birleşimi) ----------
  function parcaYolu(ctx, q, ox, oy, b) {
    if (q.t === "d") { ctx.moveTo(ox + q.x + q.r + b, oy + q.y); ctx.arc(ox + q.x, oy + q.y, Math.max(0.1, q.r + b), 0, Math.PI * 2); }
    else if (q.t === "e") { ctx.moveTo(ox + q.x + q.rx + b, oy + q.y); ctx.ellipse(ox + q.x, oy + q.y, Math.max(0.1, q.rx + b), Math.max(0.1, q.ry + b), 0, 0, Math.PI * 2); }
    else kutuYolu(ctx, ox + q.x - b, oy + q.y - b, q.w + 2 * b, q.h + 2 * b, q.rr + b);
  }
  function yol(ctx, P, ox = 0, oy = 0, b = 0) { ctx.beginPath(); for (const q of P) parcaYolu(ctx, q, ox, oy, b); }
  function doldur(ctx, P, renk, ox = 0, oy = 0, b = 0) { yol(ctx, P, ox, oy, b); ctx.fillStyle = renk; ctx.fill(); }
  function cizgi(ctx, P, renk, kal, ox = 0, oy = 0) { yol(ctx, P, ox, oy, 0); ctx.strokeStyle = renk; ctx.lineWidth = kal; ctx.lineJoin = "round"; ctx.stroke(); }
  function kirp(ctx, P, fn, ox = 0, oy = 0, b = 0) { ctx.save(); yol(ctx, P, ox, oy, b); ctx.clip(); fn(); ctx.restore(); }
  // işaretli uzaklık (içeride eksi); elips yaklaşık
  function parcaUzaklik(q, x, y) {
    if (q.t === "d") return Math.hypot(x - q.x, y - q.y) - q.r;
    if (q.t === "e") return (Math.hypot((x - q.x) / q.rx, (y - q.y) / q.ry) - 1) * Math.min(q.rx, q.ry);
    const cx = q.x + q.w / 2, cy = q.y + q.h / 2, qx = Math.abs(x - cx) - (q.w / 2 - q.rr), qy = Math.abs(y - cy) - (q.h / 2 - q.rr);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - q.rr;
  }
  function uzaklik(P, x, y) { let m = Infinity; for (const q of P) m = Math.min(m, parcaUzaklik(q, x, y)); return m; }
  // Birleşimin dış hattı boyunca noktalar (her parçanın çevresinden, başka parçanın içinde kalmayanlar); 3/4 için y'ye göre
  function kenarNoktalari(P, aralik, b = 0) {
    const out = [];
    for (const q of P) {
      const ekle = (x, y, nx, ny) => { if (uzaklik(P, x - nx * b * 0.5, y - ny * b * 0.5) > b - 0.8) out.push({ x, y, nx, ny }); };
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
    return out.sort((a, b2) => a.y - b2.y);
  }
  // Yalnız birleşimin DIŞ hattını çizer (parçaların iç çemberleri görünmez): her parçanın çevresi küçük adımlarla
  // gezilir, başka bir parçanın (b kadar büyütülmüş) içinde kalan bölümler atlanır
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
      ctx.beginPath(); let acik = false;
      for (let i = 0; i <= nok.length; i++) {
        const n = nok[i % nok.length];
        const dis = P.every((o) => o === q || parcaUzaklik(o, n.x, n.y) - b > -0.4);
        if (dis) { if (acik) ctx.lineTo(ox + n.x, oy + n.y); else { ctx.moveTo(ox + n.x, oy + n.y); acik = true; } } else acik = false;
      }
      ctx.stroke();
    }
  }
  // Biçimin içinde, kenardan en az "pay" uzak serbest noktalar (süs yerleşimi): birbirine en az "ara" uzak
  function icNoktalar(P, w, h, n, pay, ara, r) {
    const out = [];
    for (let deneme = 0; deneme < n * 40 && out.length < n; deneme++) {
      const x = r() * w, y = r() * h;
      if (uzaklik(P, x, y) > -pay) continue;
      if (out.some((o) => Math.hypot(o.x - x, o.y - y) < ara)) continue;
      out.push({ x, y });
    }
    return out.sort((a, b) => a.y - b.y);
  }

  // Göl/lav: ortada elips + kenarlara yaslanan farklı boylarda daireler (girinti ve çıkıntı)
  function bicimGol(w, h, r, pay = 9) {
    const P = [{ t: "e", x: w / 2 + (r() - 0.5) * w * 0.08, y: h / 2 + (r() - 0.5) * h * 0.08, rx: w * 0.36, ry: h * 0.32 }];
    const n = 3 + Math.floor(r() * 3), a0 = r() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const R = Math.min(w, h) * (0.17 + r() * 0.15), a = a0 + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.7;
      P.push({ t: "d", r: R,
        x: sinirla(w / 2 + Math.cos(a) * w * 0.32, R + pay, w - R - pay),
        y: sinirla(h / 2 + Math.sin(a) * h * 0.3, R + pay, h - R - pay) });
    }
    return P;
  }
  // Obje parseli: dikdörtgeni büyük ölçüde dolduran, kenarı dalgalı (dairelerle taşan) yama
  function bicimYama(w, h, r, pay = 7) {
    const P = [{ t: "k", x: pay + w * 0.1, y: pay + h * 0.1, w: w - 2 * pay - w * 0.2, h: h - 2 * pay - h * 0.2, rr: Math.min(w, h) * 0.22 }];
    const n = 5 + Math.floor(r() * 3), a0 = r() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const R = Math.min(w, h) * (0.2 + r() * 0.12), a = a0 + (i / n) * Math.PI * 2;
      P.push({ t: "d", r: R,
        x: sinirla(w / 2 + Math.cos(a) * w * 0.4, R + pay, w - R - pay),
        y: sinirla(h / 2 + Math.sin(a) * h * 0.4, R + pay, h - R - pay) });
    }
    return P;
  }
  // Kale: yuvarlak köşeli gövde, üstünden taşan yuvarlak kuleler ve mazgallar; ön yüz biçimin altında (derinlik)
  function bicimKale(w, h, r) {
    const d = Math.round(sinirla(h * 0.2, 12, 24)), ust = 13;
    const P = [{ t: "k", x: 5, y: ust, w: w - 10, h: h - d - ust - 2, rr: Math.min(16, (h - d - ust) * 0.35) }];
    const R = Math.min(19, w * 0.16, (h - d) * 0.3);
    P.push({ t: "d", x: R + 2, y: R + 2, r: R }, { t: "d", x: w - R - 2, y: R + 2, r: R });
    const orta = w > 150;
    if (orta) P.push({ t: "d", x: w / 2, y: R * 0.85 + 4, r: R * 0.85 });
    for (let x = R * 2 + 5; x + 9 <= w - R * 2 - 5; x += 15) {
      if (orta && Math.abs(x + 4.5 - w / 2) < R * 1.2) continue;
      P.push({ t: "k", x, y: ust - 7 + (r() < 0.3 ? 2 : 0), w: 9, h: 12, rr: 4.5 });
    }
    P.derinlik = d; P.kuleler = P.filter((q) => q.t === "d");
    return P;
  }
  // Kütük çit: gövde + üst kenarda boyları değişen yuvarlak kütük uçları
  function bicimKutuk(w, h, r) {
    const d = Math.round(sinirla(h * 0.24, 14, 28));
    const P = [{ t: "k", x: 4, y: 13, w: w - 8, h: h - d - 15, rr: 12 }];
    for (let x = 10; x <= w - 10; x += 12) P.push({ t: "d", x, y: 9 + r() * 6, r: 6.5 });
    P.derinlik = d;
    return P;
  }
  // Diken plakası: yuvarlak hatlı, iki yanında taşan daireler
  function bicimPlaka(w, h, r) {
    const P = [{ t: "e", x: w / 2, y: h / 2, rx: w / 2 - 6, ry: h / 2 - 8 }];
    for (let i = 0; i < 3; i++) { const R = Math.min(w, h) * (0.2 + r() * 0.08), a = r() * Math.PI * 2; P.push({ t: "d", r: R, x: sinirla(w / 2 + Math.cos(a) * w * 0.3, R + 3, w - R - 3), y: sinirla(h / 2 + Math.sin(a) * h * 0.3, R + 3, h - R - 3) }); }
    return P;
  }
  // Harita sınırı: ince şerit; haritaya bakan kenarda yuvarlak mazgal başları
  function bicimSinir(w, h, yon) {
    const yatay = yon === "ust" || yon === "alt", P = [];
    if (yatay) {
      const govdeY = yon === "ust" ? 0 : 7;
      P.push({ t: "k", x: -8, y: govdeY - 8, w: w + 16, h: h - 7 + 8, rr: 6 });
      for (let x = 10; x < w - 6; x += 20) P.push({ t: "d", x, y: yon === "ust" ? h - 7 : 7, r: 6.5 });
    } else {
      const govdeX = yon === "sol" ? 0 : 7;
      P.push({ t: "k", x: govdeX - 8, y: -8, w: w - 7 + 8, h: h + 16, rr: 6 });
      for (let y = 10; y < h - 6; y += 20) P.push({ t: "d", x: yon === "sol" ? w - 7 : 7, y, r: 6.5 });
    }
    return P;
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
  function kayalikKenar(ctx, P, renk, r, aralik = 9, b = 3) { // biçimin hattına dizili yuvarlak taşlar
    for (const k of kenarNoktalari(P, aralik, b)) {
      const s = 4 + r() * 3;
      elips(ctx, k.x + 1, k.y + 1.5, s, s * 0.8, "rgba(0,0,0,0.35)");
      elips(ctx, k.x, k.y, s, s * 0.8, karistir(renk, "#000000", r() * 0.25));
      elips(ctx, k.x - s * 0.3, k.y - s * 0.3, s * 0.4, s * 0.3, acik(renk, 0.25));
    }
  }

  // ---------- MOR ŞATO ----------
  function kaleDuvari(ctx, w, h, r, p, P, yon) {
    if (yon) return kaleSuru(ctx, w, h, r, p, P, yon);
    const d = P.derinlik;
    doldur(ctx, P, "rgba(0,0,0,0.3)", 2, d + 1);                       // gölge
    cizgi(ctx, P, koyu(p.tas, 0.72), 3, 0, d);                          // ön yüz
    doldur(ctx, P, koyu(p.tas, 0.38), 0, d);
    kirp(ctx, P, () => {
      ctx.strokeStyle = koyu(p.tas, 0.58); ctx.lineWidth = 1;
      for (let y = 6, k = 0; y < h + d; y += 7, k++) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        for (let x = (k % 2) * 8; x < w; x += 16) { ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x, y); ctx.stroke(); }
      }
    }, 0, d);
    const govde = P[0], altY = govde.y + govde.h;                       // ön yüzde ışıklı kemerli pencereler
    const n = Math.max(1, Math.floor(govde.w / 60));
    for (let i = 0; i < n; i++) {
      const cx = govde.x + govde.w * (i + 0.5) / n, pw = 9, ph = d - 6, py = altY + 2;
      ctx.fillStyle = koyu(p.tas, 0.75); yuvarlak(ctx, cx - pw / 2 - 2, py - 1, pw + 4, ph + 2, 6); ctx.fill();
      const g = ctx.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, "#fff7ae"); g.addColorStop(1, "#f59e0b");
      ctx.fillStyle = g; yuvarlak(ctx, cx - pw / 2, py + 1, pw, ph - 2, 4.5); ctx.fill();
    }
    cizgi(ctx, P, koyu(p.tas, 0.7), 3);                                 // üst yüz
    doldur(ctx, P, p.tas);
    kirp(ctx, P, () => {
      tasOrgu(ctx, 0, 0, w, h, 12, koyu(p.tas, 0.06), r);
      ctx.fillStyle = "rgba(0,0,0,0.16)"; yuvarlak(ctx, govde.x + 8, govde.y + 6, govde.w - 16, govde.h - 12, govde.rr * 0.6); ctx.fill();
    });
    for (const q of P) if (q.t === "k" && q !== govde) {               // mazgal başları: açık ve parlak
      ctx.fillStyle = acik(p.tas, 0.3); yuvarlak(ctx, q.x, q.y, q.w, q.h - 3, q.rr); ctx.fill();
      ctx.fillStyle = acik(p.tas, 0.55); yuvarlak(ctx, q.x + 1.5, q.y + 1, q.w - 3, 2.5, 1.2); ctx.fill();
    }
    for (const t of P.kuleler) {                                        // kule: taş halka + külah + bayrak
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
  }
  function kaleSuru(ctx, w, h, r, p, P) {
    cizgi(ctx, P, koyu(p.tas, 0.7), 3);
    doldur(ctx, P, p.tas);
    kirp(ctx, P, () => tasOrgu(ctx, 0, 0, w, h, 10, p.tas, r));
    for (const q of P) if (q.t === "d") { elips(ctx, q.x, q.y, q.r - 1.5, q.r - 1.5, acik(p.tas, 0.28)); elips(ctx, q.x - 1.5, q.y - 1.5, q.r * 0.4, q.r * 0.3, acik(p.tas, 0.5)); }
  }

  // Mezarlık: hattı izleyen alçak taş duvar ve demir çit, mor toprak, sevimli mezar taşları, bakan hayalet, mum
  function mezarlik(ctx, w, h, r, p, P) {
    doldur(ctx, P, koyu(p.toprak, 0.35), 0, 0, 3);
    kayalikKenar(ctx, P, koyu(p.mezar, 0.25), r, 8, 1);
    doldur(ctx, P, p.toprak);
    kirp(ctx, P, () => {
      for (let i = 0; i < w * h / 260; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 2.5, karistir(p.cim, "#000000", r() * 0.3));
      for (let i = 0; i < 3; i++) elips(ctx, w * (0.2 + r() * 0.6), h * (0.3 + r() * 0.5), 18 + r() * 14, 6 + r() * 3, "rgba(226, 232, 240, 0.08)");
    });
    const n = Math.max(2, Math.min(6, Math.round(w * h / 4300)));
    const yerler = icNoktalar(P, w, h, n, 15, 26, r), hayaletli = Math.floor(r() * yerler.length);
    yerler.forEach((y0, i) => {
      const tw = 15 + r() * 9, th = tw * 1.25, x = y0.x - tw / 2, y = y0.y - th * 0.6;
      if (i === hayaletli) {
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
    const mum = icNoktalar(P, w, h, 1, 10, 0, r)[0];
    if (mum) { ctx.fillStyle = "#fef3c7"; ctx.fillRect(mum.x - 2, mum.y - 8, 4, 8); ctx.save(); ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 8; elips(ctx, mum.x, mum.y - 11, 2, 3.5, "#fde047"); ctx.restore(); }
    ctx.fillStyle = "#111827";                                           // demir çit: hattın önündeki (alt) kısmında
    for (const k of kenarNoktalari(P, 7, 0)) if (k.ny > 0.25) {
      ctx.fillRect(k.x - 0.8, k.y - 11, 1.6, 11);
      ctx.beginPath(); ctx.moveTo(k.x - 2, k.y - 11); ctx.lineTo(k.x, k.y - 15); ctx.lineTo(k.x + 2, k.y - 11); ctx.fill();
    }
  }

  // Balkabağı tarlası: hattı izleyen tahta çit, sürülmüş toprak, sarmaşık, gülen fener balkabakları
  function balkabagiTarlasi(ctx, w, h, r, p, P) {
    doldur(ctx, P, koyu(p.tarla, 0.45), 0, 0, 3);
    doldur(ctx, P, p.tarla);
    kirp(ctx, P, () => {
      ctx.strokeStyle = koyu(p.tarla, 0.3); ctx.lineWidth = 2;
      for (let y = 6; y < h; y += 11) { ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x / 13 + y) * 1.4); ctx.stroke(); }
    });
    const n = Math.max(2, Math.min(7, Math.round(w * h / 3100)));
    const yerler = icNoktalar(P, w, h, n, 14, 26, r);
    ctx.strokeStyle = "#3f7d20"; ctx.lineWidth = 2;
    ctx.beginPath(); yerler.forEach((k, i) => (i ? ctx.quadraticCurveTo((yerler[i - 1].x + k.x) / 2, k.y - 14, k.x, k.y) : ctx.moveTo(k.x, k.y))); ctx.stroke();
    yerler.forEach((k) => {
      const s = 10 + r() * 4;
      for (let i = 0; i < 3; i++) { const a = r() * Math.PI * 2; elips(ctx, k.x + Math.cos(a) * s * 1.1, k.y + Math.sin(a) * s * 0.7 + 2, s * 0.45, s * 0.28, "#4d9a2a"); }
      balkabagi(ctx, k.x, k.y, s, r() < 0.75);
    });
    const kenar = kenarNoktalari(P, 13, 0);                              // tahta çit kazıkları
    for (const k of kenar) {
      ctx.fillStyle = koyu("#9a6b3f", 0.3); ctx.fillRect(k.x - 2, k.y - 9, 4, 10);
      ctx.fillStyle = acik("#9a6b3f", 0.2); ctx.beginPath(); ctx.arc(k.x, k.y - 9, 2, Math.PI, 0); ctx.fill();
    }
    hatCiz(ctx, P, "#9a6b3f", 2, 0, -4);
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

  // Kale hendeği: hattı izleyen taş kıyı, mavi su (dalgalar her karede)
  function hendek(ctx, w, h, r, p, P) {
    doldur(ctx, P, koyu(p.tas, 0.5), 0, 0, 8);
    kirp(ctx, P, () => tasOrgu(ctx, 0, 0, w, h, 8, p.tas, r), 0, 0, 7);
    suDoldur(ctx, P, koyu(p.tas, 0.55));
  }
  function suDoldur(ctx, P, kenarRengi) {
    doldur(ctx, P, kenarRengi, 0, 0, 2);
    let minY = Infinity, maxY = -Infinity; for (const q of P) { const ry = q.t === "d" ? q.r : q.t === "e" ? q.ry : q.h / 2; const cy = q.t === "k" ? q.y + q.h / 2 : q.y; minY = Math.min(minY, cy - ry); maxY = Math.max(maxY, cy + ry); }
    const g = ctxGrad(ctx, minY, maxY); yol(ctx, P); ctx.fillStyle = g; ctx.fill();
    kirp(ctx, P, () => { for (const q of P) if (q.t !== "k") elips(ctx, q.x - (q.r || q.rx) * 0.3, q.y - (q.r || q.ry) * 0.45, (q.r || q.rx) * 0.45, 3, "rgba(255,255,255,0.12)"); });
  }
  function ctxGrad(ctx, y0, y1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, "#38a5f5"); g.addColorStop(1, "#0a3a8a"); return g; }
  // her karede: suyun içinde hareketli dalgalar (dünya koordinatı)
  function dalgalar(ctx, ox, oy, P, w, h, zaman) {
    ctx.save(); yol(ctx, P, ox, oy); ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5;
    for (let row = 10; row < h - 4; row += 14) {
      ctx.beginPath();
      for (let col = 0; col <= w; col += 8) {
        const wy = oy + row + Math.sin((col + zaman * 30) / 22) * 2.5;
        if (col === 0) ctx.moveTo(ox + col, wy); else ctx.lineTo(ox + col, wy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- YEŞİL ORMAN ----------
  function kutukCit(ctx, w, h, r, p, P, yon) {
    if (yon) return kutukSuru(ctx, w, h, r, p, P);
    const d = P.derinlik;
    doldur(ctx, P, "rgba(0,0,0,0.3)", 2, d + 1);
    cizgi(ctx, P, koyu(p.tahta, 0.75), 3, 0, d);                        // ön yüz: dikey kütükler
    doldur(ctx, P, koyu(p.tahta, 0.3), 0, d);
    kirp(ctx, P, () => {
      for (let x = 0; x < w; x += 12) {
        const g = ctx.createLinearGradient(x, 0, x + 12, 0); g.addColorStop(0, koyu(p.tahta, 0.45)); g.addColorStop(0.5, acik(p.tahta, 0.1)); g.addColorStop(1, koyu(p.tahta, 0.5));
        ctx.fillStyle = g; ctx.fillRect(x, 0, 12, h + d);
      }
      ctx.strokeStyle = "#d6b98c"; ctx.lineWidth = 2;
      const alt = P[0].y + P[0].h; ctx.beginPath(); ctx.moveTo(0, alt + d * 0.55); ctx.lineTo(w, alt + d * 0.55); ctx.stroke();
    }, 0, d);
    cizgi(ctx, P, koyu(p.tahta, 0.75), 3);                              // üst yüz: kütük uçları
    doldur(ctx, P, koyu(p.tahta, 0.55));
    kirp(ctx, P, () => {
      const rr = 6.2, ax = rr * 2, ay = rr * 1.75;
      for (let j = 0, y = 2; y < h + rr; y += ay, j++) for (let x = (j % 2) * rr; x < w + rr; x += ax) {
        const s = rr * (0.9 + r() * 0.15);
        elips(ctx, x + 0.8, y + 1.2, s, s, "rgba(0,0,0,0.35)"); elips(ctx, x, y, s, s, koyu(p.tahta, 0.12)); elips(ctx, x, y, s * 0.78, s * 0.78, acik(p.tahta, 0.28));
        ctx.strokeStyle = koyu(p.tahta, 0.2); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, s * 0.5, 0, Math.PI * 2); ctx.stroke();
      }
    });
    for (let i = 0; i < w / 16; i++) elips(ctx, 8 + r() * (w - 16), h - 3 - r() * 4, 3 + r() * 4, 2, "rgba(74, 222, 128, 0.4)");
  }
  function kutukSuru(ctx, w, h, r, p, P) {
    cizgi(ctx, P, koyu(p.tahta, 0.75), 3);
    doldur(ctx, P, koyu(p.tahta, 0.45));
    kirp(ctx, P, () => {
      const yatay = w > h, adim = 11;
      for (let a = 0; a < (yatay ? w : h) + adim; a += adim) for (let b = adim / 2; b < (yatay ? h : w) + adim; b += adim) {
        const x = yatay ? a : b, y = yatay ? b : a;
        elips(ctx, x, y, adim * 0.55, adim * 0.55, koyu(p.tahta, 0.15)); elips(ctx, x, y, adim * 0.4, adim * 0.4, acik(p.tahta, 0.22));
      }
    });
  }
  function urkuncAgaclar(ctx, w, h, r, p, P) {
    doldur(ctx, P, koyu(p.yaprak, 0.55), 0, 0, 3);
    doldur(ctx, P, koyu(p.yaprak, 0.45));
    kirp(ctx, P, () => { for (let i = 0; i < w * h / 500; i++) elips(ctx, r() * w, r() * h, 4 + r() * 6, 3 + r() * 4, karistir(p.yaprak, "#000000", 0.2 + r() * 0.35)); });
    for (const k of kenarNoktalari(P, 8, 0)) {                           // hattı izleyen çalılar
      const s = 5 + r() * 4;
      elips(ctx, k.x, k.y, s, s * 0.85, karistir(p.yaprak, "#000000", r() * 0.25));
      elips(ctx, k.x - s * 0.3, k.y - s * 0.3, s * 0.45, s * 0.35, acik(p.yaprak, 0.18));
    }
    const n = w > 170 ? 3 : w > 115 ? 2 : 1;
    const yerler = icNoktalar(P, w, h, n, 16, w / (n + 1), r);
    for (const y0 of yerler.length ? yerler : [{ x: w / 2, y: h * 0.7 }]) agac(ctx, y0.x, Math.min(h - 12, y0.y + h * 0.25), Math.min(h - 22, 105), Math.min(w / n, 90), r, p);
    const yer = icNoktalar(P, w, h, 1, 14, 0, r)[0];                    // yarasa
    if (yer) {
      const bx = yer.x, by = Math.max(14, yer.y - h * 0.3);
      ctx.fillStyle = "#1e1b2e";
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx - 6, by - 6, bx - 12, by - 1); ctx.quadraticCurveTo(bx - 8, by, bx - 6, by + 3);
      ctx.quadraticCurveTo(bx - 3, by + 1, bx, by + 4); ctx.quadraticCurveTo(bx + 3, by + 1, bx + 6, by + 3);
      ctx.quadraticCurveTo(bx + 8, by, bx + 12, by - 1); ctx.quadraticCurveTo(bx + 6, by - 6, bx, by); ctx.fill();
      elips(ctx, bx - 1.6, by + 0.5, 0.9, 0.9, "#fde047"); elips(ctx, bx + 1.6, by + 0.5, 0.9, 0.9, "#fde047");
    }
  }
  function agac(ctx, x, taban, boy, gen, r) {
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
    elips(ctx, x, ky, 5.5, 7.5, "#0b0612");
    ctx.save(); ctx.shadowColor = "#fde047"; ctx.shadowBlur = 5; gozler(ctx, x, ky - 1, 2.2, 1.5, "#fde047"); ctx.restore();
  }
  function mantarHalkasi(ctx, w, h, r, p, P) {
    doldur(ctx, P, koyu(p.cim, 0.3), 0, 0, 3);
    doldur(ctx, P, p.cim);
    kirp(ctx, P, () => { for (let i = 0; i < w * h / 300; i++) cimTutami(ctx, r() * w, 6 + r() * h, 2 + r() * 2, karistir(p.cim, r() < 0.5 ? "#ffffff" : "#000000", 0.15 + r() * 0.15)); });
    for (const k of kenarNoktalari(P, 9, 0)) elips(ctx, k.x, k.y, 4.5, 3.2, koyu(p.cim, 0.25)); // yosunlu kenar
    const yerler = icNoktalar(P, w, h, Math.max(5, Math.min(10, Math.round(w * h / 2000))), 10, 18, r);
    let orta = null, en = Infinity; for (const y0 of yerler) { const dd = Math.hypot(y0.x - w / 2, y0.y - h / 2); if (dd < en) { en = dd; orta = y0; } }
    yerler.forEach((m) => mantar(ctx, m.x, m.y, m === orta ? Math.min(17, Math.min(w, h) * 0.18) : 6 + r() * 4, m === orta));
    ctx.save(); ctx.shadowColor = "#bef264"; ctx.shadowBlur = 6;
    for (const f of icNoktalar(P, w, h, 5, 6, 10, r)) elips(ctx, f.x, f.y - 6, 1.6, 1.6, "#ecfccb");
    ctx.restore();
  }
  function mantar(ctx, x, y, s, yuz) {
    elips(ctx, x + 1, y + s * 0.25, s * 0.8, s * 0.22, "rgba(0,0,0,0.3)");
    ctx.fillStyle = "#fef3c7"; yuvarlak(ctx, x - s * 0.32, y - s * 0.7, s * 0.64, s * 0.9, s * 0.25); ctx.fill();
    const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.95, 1, x, y - s * 0.7, s * 1.1);
    g.addColorStop(0, "#fca5a5"); g.addColorStop(0.55, "#ef4444"); g.addColorStop(1, "#991b1b");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - s * 0.62, s, s * 0.7, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    for (const [dx, dy, rr] of [[-0.45, -0.85, 0.16], [0.15, -1.05, 0.13], [0.5, -0.78, 0.14], [-0.1, -0.75, 0.1]]) elips(ctx, x + dx * s, y + dy * s, rr * s, rr * s * 0.85, "#fff7ed");
    if (yuz) { gozler(ctx, x, y - s * 0.3, s * 0.13, s * 0.07, "#1f2937"); ctx.strokeStyle = "#1f2937"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y - s * 0.22, s * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); elips(ctx, x - s * 0.24, y - s * 0.2, s * 0.06, s * 0.04, "#fda4af"); elips(ctx, x + s * 0.24, y - s * 0.2, s * 0.06, s * 0.04, "#fda4af"); }
  }
  function sazlikGolet(ctx, w, h, r, p, P) {
    doldur(ctx, P, koyu(p.cim, 0.15), 0, 0, 8);
    kirp(ctx, P, () => { for (let i = 0; i < (w + h) / 2; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 2, koyu(p.cim, 0.25 + r() * 0.2)); }, 0, 0, 8);
    suDoldur(ctx, P, koyu(p.cim, 0.5));
    for (const l of icNoktalar(P, w, h, Math.max(1, Math.round(w * h / 4500)), 10, 16, r)) {
      const s = 6 + r() * 3;
      ctx.fillStyle = "#3f9b3a"; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.arc(l.x, l.y, s, 0.3, Math.PI * 2 - 0.1); ctx.closePath(); ctx.fill();
      if (r() < 0.5) { elips(ctx, l.x + 1, l.y - 1, 2.6, 2.2, "#f9a8d4"); elips(ctx, l.x + 1, l.y - 1, 1.1, 1, "#fde047"); }
    }
    for (const k of kenarNoktalari(P, 10, 6)) if (r() < 0.35) {         // kıyıda kamışlar
      ctx.strokeStyle = "#4d7c0f"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(k.x + 1, k.y - 12); ctx.stroke();
      ctx.fillStyle = "#7c4a1e"; yuvarlak(ctx, k.x - 0.6, k.y - 12, 3.2, 7, 1.6); ctx.fill();
    }
  }

  // ---------- ORTAK: DİKEN, LAV ----------
  function dikenKapani(ctx, w, h, r, p, P) {
    doldur(ctx, P, "#7f1d1d", 0, 0, 2.5);
    doldur(ctx, P, "#2a2430");
    kirp(ctx, P, () => {
      tasOrgu(ctx, 0, 0, w, h, 11, "#3a3442", r);
      const s = 12;
      for (let y = 6, k = 0; y < h + 6; y += s, k++) for (let x = 4 + (k % 2) * (s / 2); x < w; x += s) {
        if (uzaklik(P, x, y) > -5) continue;
        elips(ctx, x, y + 3, 4, 1.6, "rgba(0,0,0,0.5)");
        const g = ctx.createLinearGradient(x - 4, 0, x + 4, 0); g.addColorStop(0, "#f1f5f9"); g.addColorStop(1, "#64748b");
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 4, y + 3); ctx.lineTo(x, y - 7); ctx.lineTo(x + 4, y + 3); ctx.closePath(); ctx.fill();
      }
    });
  }
  function lavTabani(ctx, w, h, r, p, P) {
    doldur(ctx, P, "#1a0b0b", 0, 0, 6);
    kayalikKenar(ctx, P, "#3f3f46", r, 8, 3);
    doldur(ctx, P, "#450a0a");
  }
  // her karede: biçimin üst hattından yükselen alev dilleri (dünya koordinatı)
  function alevler(ctx, ox, oy, P, zaman, tohum) {
    const r = rastgele(tohum);
    const uclar = kenarNoktalari(P, 11, 0).filter((k) => k.ny < -0.35);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const k of uclar) {
      const faz = r() * 6.28, boy = 12 + r() * 12, gen = 5 + r() * 3;
      const t = Math.sin(zaman * 4 + faz) * 0.5 + 0.5, b = boy * (0.7 + t * 0.5), sal = Math.sin(zaman * 3 + faz) * 3;
      for (const [renk, oran] of [["rgba(249,115,22,0.75)", 1], ["rgba(250,204,21,0.8)", 0.6]]) {
        const x = ox + k.x, y = oy + k.y + 3, g2 = gen * oran, b2 = b * oran;
        ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x - g2, y);
        ctx.quadraticCurveTo(x - g2 * 0.9, y - b2 * 0.55, x + sal * oran, y - b2);
        ctx.quadraticCurveTo(x + g2 * 0.9, y - b2 * 0.55, x + g2, y);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- TEMA SETLERİ (taslak: 0 Mor Şato, 1 Yeşil Orman) ----------
  const SETLER = [
    { palet: { tas: "#6e5f91", cati: "#7c3aed", toprak: "#2f2442", cim: "#4b3b66", mezar: "#9ca3af", tarla: "#5b3a24" },
      duvar: { bicim: bicimKale, ciz: kaleDuvari }, objeler: [{ bicim: bicimYama, ciz: mezarlik }, { bicim: bicimYama, ciz: balkabagiTarlasi }], su: { bicim: bicimGol, ciz: hendek } },
    { palet: { tahta: "#8b5a2b", yaprak: "#2f6b2a", cim: "#2f7a32" },
      duvar: { bicim: bicimKutuk, ciz: kutukCit }, objeler: [{ bicim: bicimYama, ciz: urkuncAgaclar }, { bicim: bicimYama, ciz: mantarHalkasi }], su: { bicim: bicimGol, ciz: sazlikGolet } },
  ];
  const DIKEN = { bicim: bicimPlaka, ciz: dikenKapani }, LAV = { bicim: (w, h, r) => bicimGol(w, h, r, 7), ciz: lavTabani };

  window.ENGEL_TASLAK = { SETLER, DIKEN, LAV, bicimSinir, dalgalar, alevler, rastgele, yol, uzaklik };
})();
