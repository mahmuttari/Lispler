/* ============================================================
   HAYALET AVCILARI — ZEMİN KATMANI (ZEM1A1)
   Harita zeminine yol/patika çizer. Yalnız görseldir: çarpışma,
   oyun akışı ve ağ davranışı değişmez. Yollar 512x512 dünya
   parçalarında önbelleklenir; her karede en çok bir eksik parça
   kurulur, böylece yol ilk karede topluca çizilip sıçrama yapmaz.
   ============================================================ */
(function () {
  "use strict";
  const PARCA = 512;
  let ISIK_HALKASI = true; // ZEM3B: oyuncu çevresi ışık halkası (kapatmak için false)

  // Bir noktanın (px,py) AB doğru parçasına uzaklığı (dünya px)
  function noktaCizgiUzaklik(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, uz = dx * dx + dy * dy;
    let t = uz ? ((px - ax) * dx + (py - ay) * dy) / uz : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  // Parçanın görünür kutusunu yol genişliği kadar büyütüp kesişim sınar
  function yolParcaKesiyor(yol, ox, oy, boy) {
    const p = (Array.isArray(yol.ornekler) && yol.ornekler.length) ? yol.ornekler : yol.noktalar;
    const yari = (yol.gen || 64) / 2 + 28;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const q of p) {
      if (q.x < minX) minX = q.x; if (q.x > maxX) maxX = q.x;
      if (q.y < minY) minY = q.y; if (q.y > maxY) maxY = q.y;
    }
    return !(maxX + yari < ox || minX - yari > ox + boy || maxY + yari < oy || minY - yari > oy + boy);
  }

  // Noktalardan yumuşak eğri (orta noktalardan geçen ikinci derece eğriler)
  function yolEgri(c, pts) {
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) { c.lineTo(pts[1].x, pts[1].y); return; }
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      c.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    const son = pts[pts.length - 1], onceki = pts[pts.length - 2];
    c.quadraticCurveTo(onceki.x, onceki.y, son.x, son.y);
  }

  // Taş yol mu: tema 1, 4, 6 ve Dünya Turu'nda K / KS / DA aileleri
  function tasYolMu() {
    try {
      if (typeof game !== "undefined" && game && game.dunyaTuru) {
        const u = typeof turUlkesi === "function" ? turUlkesi() : null;
        return !!u && (u.aile === "K" || u.aile === "KS" || u.aile === "DA");
      }
      const th = typeof getTheme === "function" ? getTheme() : null;
      if (!th || typeof LEVEL_THEMES === "undefined") return false;
      const i = LEVEL_THEMES.indexOf(th) + 1;
      return i === 1 || i === 4 || i === 6;
    } catch (e) { return false; }
  }

  // Yol dolgusu: zemin-yol-* resmi varsa 256 dünya px döşeme deseni; yoksa düz toprak/taş rengi
  function yolDeseni(c, tas) {
    let im = null;
    try { im = typeof gorsel === "function" ? gorsel(tas ? "zemin-yol-tas" : "zemin-yol-toprak") : null; } catch (e) { im = null; }
    if (!im || !im.width) return null;
    try {
      const desen = c.createPattern(im, "repeat");
      if (desen && desen.setTransform && typeof DOMMatrix === "function") {
        const k = 256 / im.width;
        desen.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0]));
      }
      return desen;
    } catch (e) { return null; }
  }

  // Leke dokusu: aile/temaya göre ikinci zemin resmi (yoksa null → düz açık renk)
  function lekeDokusu(indeks) {
    try {
      if (typeof game !== "undefined" && game && game.dunyaTuru) {
        const u = typeof turUlkesi === "function" ? turUlkesi() : null;
        const a = u && u.aile;
        if (a === "K" || a === "KS" || a === "DA") return typeof indeks === "number" ? (indeks % 2 ? "zemin-catlak-tas" : "zemin-yol-tas") : "zemin-yol-tas";
        if (a === "KP" || a === "SH" || a === "SV" || a === "GA") return "zemin-kuru";
        if (a === "GDA" || a === "KA" || a === "LA") return "zemin-cimen";
        return null;
      }
      const th = typeof getTheme === "function" ? getTheme() : null;
      if (!th || typeof LEVEL_THEMES === "undefined") return null;
      const i = LEVEL_THEMES.indexOf(th) + 1;
      if (i === 4) return "zemin-kiragi"; // Buz Mağarası
      if (i === 1 && typeof indeks === "number") return indeks % 2 ? "zemin-catlak-tas" : "zemin-yosunlu-tas";
      return i === 1 ? "zemin-yosunlu-tas" : i === 2 ? "zemin-cimen" : i === 3 ? "zemin-kum" : i === 5 ? "zemin-kuru" : null;
    } catch (e) { return null; }
  }

  function acikRenk(hex, oran) {
    let h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6) return "rgb(90,86,80)";
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const f = (v) => Math.round(v + (255 - v) * oran);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  // Küçük leke tuvası: doku (varsa) ya da düz renk, yumuşak radyal alfa maskesiyle çarpılır
  function lekeTuvali(im, renk) {
    try {
      const B = 96, tv = document.createElement("canvas");
      tv.width = B; tv.height = B;
      const c = tv.getContext("2d");
      if (!c) return null;
      if (im && im.width && im.height) {
        const o = Math.max(B / im.width, B / im.height);
        const dw = im.width * o, dh = im.height * o;
        c.drawImage(im, (B - dw) / 2, (B - dh) / 2, dw, dh);
      } else {
        c.fillStyle = renk || "rgb(90,86,80)";
        c.fillRect(0, 0, B, B);
      }
      c.globalCompositeOperation = "destination-in";
      const g = c.createRadialGradient(B / 2, B / 2, B * 0.12, B / 2, B / 2, B * 0.5);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.62, "rgba(0,0,0,0.72)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, B, B);
      c.globalCompositeOperation = "source-over";
      return tv;
    } catch (e) { return null; }
  }

  // ---------- ZEM1B: taban süsleri ve temas gölgeleri ----------
  // Çevreye göre süs ailesi (Z02/Z03 resimleri; yoksa dere-sus-* yedeği)
  function susAilesi() {
    try {
      if (typeof game !== "undefined" && game && game.dunyaTuru) {
        const u = typeof turUlkesi === "function" ? turUlkesi() : null;
        const a = u && u.aile;
        if (a === "GDA" || a === "KA" || a === "LA" || a === "K") return ["sus-cimen", "sus-cicek", "sus-cali", "sus-yaprak"];
        if (a === "KP" || a === "SH" || a === "SV" || a === "GA") return ["sus-cakil", "sus-kaya", "sus-cimen-kuru", "sus-toprak-leke"];
        if (a === "KS" || a === "DA") return ["sus-kaya", "sus-yosun", "sus-cicek", "sus-su-birikintisi"];
      }
      const th = typeof getTheme === "function" ? getTheme() : null;
      if (!th || typeof LEVEL_THEMES === "undefined") return ["sus-cimen", "sus-kaya"];
      const i = LEVEL_THEMES.indexOf(th);
      if (i === 0) return ["sus-kaya", "sus-yosun", "sus-mantar", "sus-su-birikintisi"];
      if (i === 1) return ["sus-cimen", "sus-cicek", "sus-mantar", "sus-cali", "sus-yaprak"];
      if (i === 2) return ["sus-cakil", "sus-kaya", "sus-toprak-leke"];
      if (i === 3) return ["sus-kaya-buz"];
      if (i === 4) return ["sus-kaya", "sus-cakil", "sus-toprak-leke"];
      if (i === 5) return ["sus-cakil"];
    } catch (e) { /* varsayılan */ }
    return ["sus-cimen", "sus-kaya"];
  }

  const SUS_YEDEK = ["dere-sus-1", "dere-sus-2", "dere-sus-3", "dere-sus-4", "dere-sus-5", "dere-sus-6"];

  // Süs resmi: önce Z02/Z03 anahtarı, yoksa dere-sus-* yedeği. Kuru çimen renklendirilmiş kopya.
  function susResmi(ad, sira) {
    try {
      if (ad === "sus-cimen-kuru") {
        const k = (typeof gorsel === "function" && gorsel("sus-cimen")) ? "sus-cimen" : SUS_YEDEK[sira % SUS_YEDEK.length];
        return (typeof gorselRenkli === "function" ? gorselRenkli(k, "#b28a2a") : null) || (typeof gorsel === "function" ? gorsel(k) : null);
      }
      if (ad === "sus-kaya-buz") { // Buz teması: kayalar açık maviye boyanır
        const k = (typeof gorsel === "function" && gorsel("sus-kaya")) ? "sus-kaya" : SUS_YEDEK[sira % SUS_YEDEK.length];
        return (typeof gorselRenkli === "function" ? gorselRenkli(k, "#bae6fd") : null) || (typeof gorsel === "function" ? gorsel(k) : null);
      }
      const im = typeof gorsel === "function" ? gorsel(ad) : null;
      if (im) return im;
      return typeof gorsel === "function" ? gorsel(SUS_YEDEK[sira % SUS_YEDEK.length]) : null;
    } catch (e) { return null; }
  }

  // Yumuşak temas gölgesi: taban elipsi + sol üst ışığa göre sağ alta uzayan yönlü gölge
  function golgeCiz(c, x, y, rx, ry, h) {
    if (!(rx > 0 && ry > 0)) return;
    c.save();
    c.translate(x, y); c.scale(rx, ry);
    let g = null;
    try {
      g = c.createRadialGradient(0, 0, 0.15, 0, 0, 1);
      g.addColorStop(0, "rgba(0,0,0,0.22)");
      g.addColorStop(0.65, "rgba(0,0,0,0.12)");
      g.addColorStop(1, "rgba(0,0,0,0)");
    } catch (e) { g = null; }
    c.fillStyle = g || "rgba(0,0,0,0.22)";
    c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill();
    c.restore();
    // ZEM3B: yönlü gölge — nesne yüksekliğinin %35'i kadar sağ alta sünmüş yumuşak biçim
    const L = Math.max(0, (h || 0) * 0.35);
    if (L > 1) {
      c.save();
      c.translate(x + L * 0.34, y + L * 0.27);
      c.rotate(0.62);
      c.scale(L * 0.62 + rx * 0.18, Math.max(2, ry * 0.62));
      let g2 = null;
      try {
        g2 = c.createRadialGradient(0, 0, 0.1, 0, 0, 1);
        g2.addColorStop(0, "rgba(0,0,0,0.20)");
        g2.addColorStop(0.55, "rgba(0,0,0,0.11)");
        g2.addColorStop(1, "rgba(0,0,0,0)");
      } catch (e) { g2 = null; }
      c.fillStyle = g2 || "rgba(0,0,0,0.20)";
      c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }

  // Resim yoksa kısa çimen tutamı (paletin çim rengi)
  function tutamCiz(c, x, y, boy, renk) {
    c.save();
    c.strokeStyle = renk || "#3f7d3f";
    c.lineWidth = Math.max(1, boy * 0.09);
    c.lineCap = "round";
    const n = 3 + Math.floor((boy * 7) % 3);
    for (let i = 0; i < n; i++) {
      const sap = ((i / Math.max(1, n - 1)) - 0.5) * boy * 0.55;
      c.beginPath(); c.moveTo(x + sap * 0.25, y);
      c.quadraticCurveTo(x + sap * 0.7, y - boy * 0.55, x + sap, y - boy);
      c.stroke();
    }
    c.restore();
  }

  function susCiz(c, s) {
    // ZEM2B: yol kenarı süslerinde tür belliyse resim/yedek seçimi türe göre yapılır
    if (s && (s.tur === "cimen" || s.tur === "cicek" || s.tur === "tas")) {
      let im = null;
      try {
        if (typeof gorsel === "function") {
          // Z02-Z04 resimleri yokken mevcut ChatGPT resimleri kullanılır (döndürme yok)
          if (s.tur === "cimen") im = (s.ad && gorsel(s.ad)) || gorsel("dere-sus-1");
          else if (s.tur === "cicek") im = gorsel("dere-sus-6");
          else im = gorsel("dere-sus-3");
        }
      } catch (e) { im = null; }
      if (im && im.width) {
        const b = s.boy;
        try { typeof resmiKutuyaCiz === "function" ? resmiKutuyaCiz(c, im, s.x - b / 2, s.y - b, b, b, true) : c.drawImage(im, s.x - b / 2, s.y - b, b, b); }
        catch (e) { /* çizim hatası oyunu durdurmasın */ }
        return;
      }
      if (s.tur === "tas") { // dere-sus-3 de yoksa sade çakıl tutamı
        tutamCiz(c, s.x, s.y, s.boy, "#8a8a86");
        return;
      }
      tutamCiz(c, s.x, s.y, s.boy, s.tur === "cicek" ? "#c95a8a" : (s.ad === "sus-uzun-cimen" ? "#4a8a3a" : "#3f7d3f"));
      return;
    }
    const im = susResmi(s.ad, s.idx);
    if (im && im.width) {
      const b = s.boy;
      try { typeof resmiKutuyaCiz === "function" ? resmiKutuyaCiz(c, im, s.x - b / 2, s.y - b, b, b, true) : c.drawImage(im, s.x - b / 2, s.y - b, b, b); }
      catch (e) { /* çizim hatası oyunu durdurmasın */ }
      return;
    }
    let renk = "#3f7d3f";
    try { const th = typeof getTheme === "function" ? getTheme() : null; if (th && th.floor) renk = "#3f7d3f"; } catch (e) { /* varsayılan */ }
    if (s.ad === "sus-cimen-kuru") renk = "#9a7b32";
    tutamCiz(c, s.x, s.y, s.boy, renk);
  }

  // Kısa patikada dokulu yol yerine sus-basamak taşları (yalnız resim varsa)
  function basamakCiz(c, yol) {
    const im = typeof gorsel === "function" ? gorsel("sus-basamak") : null;
    if (!im) return false;
    const q = yol.noktalar;
    let birikim = 0, hedef = 22;
    for (let i = 0; i < q.length - 1; i++) {
      const L = Math.hypot(q[i + 1].x - q[i].x, q[i + 1].y - q[i].y);
      let d = hedef - birikim;
      while (d <= L) {
        const t = d / L, x = q[i].x + (q[i + 1].x - q[i].x) * t, y = q[i].y + (q[i + 1].y - q[i].y) * t;
        try { typeof resmiKutuyaCiz === "function" ? resmiKutuyaCiz(c, im, x - 13, y - 13, 26, 26, true) : c.drawImage(im, x - 13, y - 13, 26, 26); }
        catch (e) { return true; }
        d += hedef;
      }
      birikim += L;
    }
    return true;
  }

  // Köprü ağzına 60 px'den yakın süs konmaz
  function kopruYakin(x, y) {
    if (typeof game === "undefined" || !game || !Array.isArray(game.kopruler)) return false;
    for (const k of game.kopruler) {
      if (!k) continue;
      const cx = (k.a + k.b) / 2, hw = Math.abs(k.b - k.a) / 2;
      if (Math.abs(x - cx) < hw + 60 && Math.abs(y - k.c) < 60) return true;
    }
    return false;
  }

  // Süs noktası uygun mu: suda, yolda, duvarda ya da dünya dışında olmasın
  function susUygun(x, y) {
    const W = (typeof game !== "undefined" && game && game.worldW) || 0;
    const H = (typeof game !== "undefined" && game && game.worldH) || 0;
    if (W && (x < 8 || x > W - 8 || y < 8 || y > H - 8)) return false;
    try { if (typeof collidesWaters === "function" && collidesWaters(x, y, 0)) return false; } catch (e) { /* yok */ }
    try { if (typeof collidesWalls === "function" && collidesWalls(x, y, 0)) return false; } catch (e) { /* yok */ }
    try { if (zeminKatmaniYolMu(x, y)) return false; } catch (e) { /* yok */ }
    if (kopruYakin(x, y)) return false;
    return true;
  }

  function susTohum(bolum, ulke, sira, n) {
    return typeof yolculukRastgele === "function" ? yolculukRastgele(bolum, ulke, sira, n) : 0.5;
  }

  // Bir engel/prop çevresine 2-10 süs: çevre uzunluğuna göre, çarpışma kenarının 0-14 px dışına
  function cevreSusEkle(zemin, bolum, ulke, x0, y0, w, h, aile, sira0) {
    const perim = 2 * (w + h);
    const n = Math.max(2, Math.min(10, Math.round(perim / 80)));
    let eklenen = 0;
    for (let i = 0; i < n; i++) {
      let tamam = false;
      for (let t = 0; t < 12 && !tamam; t++) {
        const seed = sira0 + i * 13 + t;
        const kenar = Math.floor(susTohum(bolum, ulke, seed, 1) * 4);
        const u = susTohum(bolum, ulke, seed, 2);
        const dis = susTohum(bolum, ulke, seed, 3) * 14;
        let x, y;
        if (kenar === 0) { x = x0 + u * w; y = y0 - dis; }
        else if (kenar === 1) { x = x0 + w + dis; y = y0 + u * h; }
        else if (kenar === 2) { x = x0 + u * w; y = y0 + h + dis; }
        else { x = x0 - dis; y = y0 + u * h; }
        if (!susUygun(x, y)) continue;
        const ad = aile[Math.floor(susTohum(bolum, ulke, seed, 4) * aile.length) % aile.length];
        const boy = 18 + susTohum(bolum, ulke, seed, 5) * 28;
        zemin.suslar.push({ x, y, boy, ad, idx: Math.floor(susTohum(bolum, ulke, seed, 6) * 6) });
        eklenen++; tamam = true;
      }
    }
    return eklenen;
  }

  // Haritadaki bütün taban süslerini ve gölgeleri tohumlu kur (parça önbelleğinde çizilir)
  function suslariKur(zemin, bolum, ulke) {
    if (!zemin || typeof game === "undefined" || !game) return;
    zemin.suslar = zemin.suslar || [];
    zemin.golgeler = zemin.golgeler || [];
    const aile = susAilesi();
    let sira = 0;
    const W = game.worldW || 0, H = game.worldH || 0;
    // 1) Engeller: duvar, obje1, obje2 (sınır ve yuva duvarları hariç)
    for (const o of (game.walls || [])) {
      if (!o || o.yuva) continue;
      if (o.tur !== "duvar" && o.tur !== "obje1" && o.tur !== "obje2") continue;
      zemin.golgeler.push({ x: o.x + o.w / 2, y: o.y + o.h / 2 + 4, rx: o.w * 0.525, ry: Math.max(6, o.h * 0.22), h: o.h });
      cevreSusEkle(zemin, bolum, ulke, o.x, o.y, o.w, o.h, aile, 10000 + (sira += 37));
    }
    // 2) Yolculuk donatıları (x,y merkez)
    for (const p of (game._yolculukDonatilar || [])) {
      if (!p || !(p.w > 0) || !(p.h > 0)) continue;
      const px = p.x - p.w / 2, py = p.y - p.h / 2;
      zemin.golgeler.push({ x: p.x, y: p.y + 4, rx: p.w * 0.525, ry: Math.max(6, p.h * 0.22), h: p.h });
      cevreSusEkle(zemin, bolum, ulke, px, py, p.w, p.h, aile, 20000 + (sira += 37));
    }
    // 3) Hayalet yuvaları: yalnız temas gölgesi
    for (const yv of (game.yuvalar || [])) {
      if (!yv) continue;
      const r = yv.r || 30;
      zemin.golgeler.push({ x: yv.x, y: yv.y + 4, rx: r * 1.05, ry: Math.max(6, r * 0.5), h: r * 2 });
    }
    // 4) Göl ve nehir kıyıları: her 50-70 px'de kaya/çimen (köprü ağzı ve su içi hariç)
    const kiysiAile = ["sus-kaya", "sus-cimen"];
    let ky = 0;
    for (const o of (game.waters || [])) {
      if (!o || !(o.w > 0) || !(o.h > 0)) continue;
      const adim = 50 + susTohum(bolum, ulke, 30000 + ky, 1) * 20;
      ky += 11;
      const koy = (x, y) => {
        if (!susUygun(x, y)) return;
        const ad = kiysiAile[Math.floor(susTohum(bolum, ulke, 31000 + ky, x + y) * 2) % 2];
        const boy = 18 + susTohum(bolum, ulke, 32000 + ky, x - y) * 16;
        zemin.suslar.push({ x, y, boy, ad, idx: Math.floor(susTohum(bolum, ulke, 33000 + ky, x * 0.5 + y) * 6) });
      };
      for (let x = o.x + 12; x <= o.x + o.w - 12; x += adim) { koy(x, o.y - 6); koy(x, o.y + o.h + 6); }
      for (let y = o.y + 12; y <= o.y + o.h - 12; y += adim) { koy(o.x - 6, y); koy(o.x + o.w + 6, y); }
    }
    // 5) Yol kenarları: her 70-110 px'de çimen tutamı/çakıl (iki yan)
    const kenarAile = aile.indexOf("sus-cakil") >= 0 ? ["sus-cakil", "sus-cimen"] : ["sus-cimen", "sus-cakil"];
    let py2 = 0;
    for (const yol of (zemin.yollar || []).concat(zemin.patikalar || [])) {
      const q = yol && yol.noktalar;
      if (!Array.isArray(q) || q.length < 2) continue;
      let birikim = 0, hedef = 70 + susTohum(bolum, ulke, 40000 + py2, 1) * 40;
      py2 += 7;
      for (let i = 0; i < q.length - 1; i++) {
        const ax = q[i].x, ay = q[i].y, bx = q[i + 1].x, by = q[i + 1].y;
        const L = Math.hypot(bx - ax, by - ay);
        if (L < 1) continue;
        const nx = -(by - ay) / L, ny = (bx - ax) / L, yari = (yol.gen || 64) / 2;
        let d = hedef - birikim;
        while (d <= L) {
          const t = d / L, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
          for (const yon of [-1, 1]) {
            const dis = yari + 6 + susTohum(bolum, ulke, 41000 + py2, Math.round(d) + (yon > 0 ? 1 : 2)) * 10;
            const sx = x + nx * dis * yon, sy = y + ny * dis * yon;
            if (!susUygun(sx, sy)) continue;
            const ad = kenarAile[Math.floor(susTohum(bolum, ulke, 42000 + py2, Math.round(d) + yon) * 2) % 2];
            const boy = 18 + susTohum(bolum, ulke, 43000 + py2, Math.round(d) - yon) * 12;
            zemin.suslar.push({ x: sx, y: sy, boy, ad, idx: Math.floor(susTohum(bolum, ulke, 44000 + py2, Math.round(d)) * 6) });
          }
          d += hedef;
          hedef = 70 + susTohum(bolum, ulke, 45000 + py2 + Math.round(d), 1) * 40;
        }
        birikim += L;
      }
    }
  }

  // ---------- ZEM2B: yol kenarı kaosu (taş, çimen, çiçek) ve çatal tabelaları ----------
  function arenaIcinde(x, y) {
    try {
      if (typeof game === "undefined" || !game) return false;
      const d = game._yolculukDuzen;
      return !!(d && d.arena && x >= d.arena.x0);
    } catch (e) { return false; }
  }

  // Yolun düzensiz kenarının 2-14 px dışına, her 35-70 px'de iki yana bir süs koyar.
  // Yalnız görsel; su, duvar, başka yol, köprü ağzı ve arena dışlanır.
  function kenarSuslariKur(zemin, bolum, ulke) {
    if (!zemin) return;
    zemin.suslar = zemin.suslar || [];
    let py = 0;
    for (const yol of (zemin.yollar || []).concat(zemin.patikalar || [])) {
      const S = Array.isArray(yol.ornekler) && yol.ornekler.length > 1 ? yol.ornekler : (yol && yol.noktalar);
      if (!Array.isArray(S) || S.length < 2) continue;
      const yari = (yol.gen || 64) / 2;
      py += 17;
      // kalan: bu parçanın başından bir sonraki süse olan yol boyu (parçadan parçaya taşınır; her 35-70 px'de bir süs)
      let kalan = 35 + susTohum(bolum, ulke, 80000 + py, 0) * 35, sira = 0;
      for (let i = 0; i < S.length - 1; i++) {
        const a = S[i], b = S[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
        if (L < 0.01) continue;
        const nx = -dy / L, ny = dx / L;
        const wa = a.w || 1, wb = b.w || 1;
        let d = kalan;
        while (d <= L) {
          sira++;
          const t = d / L, w = wa + (wb - wa) * t, r = yari * w;
          const x = a.x + dx * t, y = a.y + dy * t;
          for (const yon of [-1, 1]) {
            const sd = 80000 + py * 13 + sira * 2 + (yon > 0 ? 1 : 0);
            const dis = r + 2 + susTohum(bolum, ulke, sd, 1) * 12;
            const sx = x + nx * dis * yon, sy = y + ny * dis * yon;
            if (!susUygun(sx, sy) || arenaIcinde(sx, sy)) continue;
            const turR = susTohum(bolum, ulke, sd, 2);
            const boyR = susTohum(bolum, ulke, sd, 3);
            const adR = susTohum(bolum, ulke, sd, 4);
            let tur, ad, boy;
            if (turR < 0.10) { tur = "cicek"; ad = "sus-cicek"; boy = 16 + boyR * 10; }
            else if (turR < 0.55) { tur = "tas"; ad = adR < 0.5 ? "sus-yol-taslari" : "sus-cakil"; boy = 14 + boyR * 12; }
            else { tur = "cimen"; ad = adR < 0.34 ? "sus-cimen-serit" : adR < 0.67 ? "sus-cimen" : "sus-uzun-cimen"; boy = 16 + boyR * 16; }
            zemin.suslar.push({ x: sx, y: sy, boy, ad, idx: Math.floor(susTohum(bolum, ulke, sd, 5) * 6), tur, kenar: true });
          }
          d += 35 + susTohum(bolum, ulke, 80000 + py * 13 + sira * 2, 6) * 35;
        }
        kalan = d - L;
      }
    }
  }

  // SUS1: üst üste binen taban süslerini ayıkla (görünür iç kutu = boyun %70'i).
  // Sıra önceliktir: önce gelen süs kalır, çakışan sonraki 6 tohumlu adaya kaydırılır.
  function susAyikla(zemin, bolum, ulke) {
    if (window.__susAyiklaKapali) return;
    if (!zemin || !Array.isArray(zemin.suslar)) return;
    const yarim = (boy) => Math.max(0, boy * 0.35);
    const sabit = [];
    let yolculuk = false;
    try { yolculuk = typeof yolculukAcik === "function" && yolculukAcik(); } catch (e) { yolculuk = false; }
    if (yolculuk && typeof game !== "undefined" && game) {
      if (Array.isArray(game._yolculukDonatilar)) {
        for (const p of game._yolculukDonatilar) {
          if (!p || !(p.w > 0) || !(p.h > 0)) continue;
          sabit.push({ x: p.x, y: p.y, hx: p.w * 0.4, hy: p.h * 0.4 });
        }
      }
      const d = game._yolculukDuzen;
      if (d && Array.isArray(d.zones)) {
        for (const z of d.zones) {
          if (!z || !Array.isArray(z._gecitSus)) continue;
          for (const g of z._gecitSus) {
            if (!g) continue;
            const h = Math.max(0, (g.size || 0) * 0.35);
            sabit.push({ x: g.x, y: g.y, hx: h, hy: h });
          }
        }
      }
      if (Array.isArray(game.yuvalar)) {
        for (const yv of game.yuvalar) {
          if (!yv) continue;
          const h = yv.r || 32;
          sabit.push({ x: yv.x, y: yv.y, hx: h, hy: h });
        }
      }
    }
    if (Array.isArray(zemin.tabelalar)) {
      for (const tb of zemin.tabelalar) {
        if (!tb) continue;
        sabit.push({ x: tb.x, y: tb.y, hx: 24, hy: 24 });
      }
    }
    const cakisan = (x, y, h, liste) => {
      for (let j = 0; j < liste.length; j++) {
        const o = liste[j];
        if (Math.abs(x - o.x) < h + o.hx && Math.abs(y - o.y) < h + o.hy) return true;
      }
      return false;
    };
    const eski = zemin.suslar;
    const yeni = [];
    const icler = [];
    for (let i = 0; i < eski.length; i++) {
      const s = eski[i];
      if (!s || !(s.boy > 0)) continue;
      let x = s.x, y = s.y;
      let h = yarim(s.boy);
      let cx = x, cy = y - s.boy / 2;
      if (!cakisan(cx, cy, h, sabit) && !cakisan(cx, cy, h, icler)) {
        yeni.push(s); icler.push({ x: cx, y: cy, hx: h, hy: h }); continue;
      }
      let kondu = false;
      for (let t = 0; t < 6; t++) {
        const aci = susTohum(bolum, ulke, 90000 + i, t) * Math.PI * 2;
        const dis = 12 + 6 * t;
        const nx = s.x + Math.cos(aci) * dis, ny = s.y + Math.sin(aci) * dis;
        if (!susUygun(nx, ny)) continue;
        if (s.kenar === true && arenaIcinde(nx, ny)) continue;
        const ncx = nx, ncy = ny - s.boy / 2;
        if (cakisan(ncx, ncy, h, sabit) || cakisan(ncx, ncy, h, icler)) continue;
        x = nx; y = ny; cx = ncx; cy = ncy; kondu = true; break;
      }
      if (!kondu) continue;
      s.x = x; s.y = y;
      yeni.push(s); icler.push({ x: cx, y: cy, hx: h, hy: h });
    }
    zemin.suslar = yeni;
  }

  // Çatal noktaları: patikaların ana yola değdiği başlangıç ve yolculuk yolunun başı.
  // En çok 4 tabela, aralarında en az 500 px; yol/su/duvar üstüne konmaz.
  function tabelalariKur(zemin, bolum, ulke) {
    if (!zemin) return;
    zemin.tabelalar = [];
    const adaylar = [];
    const ilk = zemin.yollar && zemin.yollar[0];
    if (ilk && Array.isArray(ilk.noktalar) && ilk.noktalar.length >= 2) {
      const q = ilk.noktalar;
      adaylar.push({ x: q[0].x, y: q[0].y, dx: q[1].x - q[0].x, dy: q[1].y - q[0].y });
    }
    for (const p of (zemin.patikalar || [])) {
      const q = p && p.noktalar;
      if (!Array.isArray(q) || q.length < 2) continue;
      adaylar.push({ x: q[0].x, y: q[0].y, dx: q[1].x - q[0].x, dy: q[1].y - q[0].y });
    }
    let i = 0;
    for (const a of adaylar) {
      if (zemin.tabelalar.length >= 4) break;
      const L = Math.hypot(a.dx, a.dy);
      if (L < 1) { i++; continue; }
      let yer = null;
      for (let ek = 0; ek < 3 && !yer; ek++) {
        for (let t = 0; t < 16 && !yer; t++) {
          const ac = (t / 16) * Math.PI * 2 + susTohum(bolum, ulke, 90000 + i * 17, 1) * 0.5;
          const dis = 22 + susTohum(bolum, ulke, 90000 + i * 17, t + 2) * 8 + ek * 22;
          const x = a.x + Math.cos(ac) * dis, y = a.y + Math.sin(ac) * dis;
          if (!susUygun(x, y)) continue;
          if (zemin.tabelalar.some((tb) => Math.hypot(tb.x - x, tb.y - y) < 500)) continue;
          yer = { x, y };
        }
      }
      if (yer) {
        zemin.tabelalar.push({ x: yer.x, y: yer.y, k: i % 2 === 0 ? "tabela-1" : "tabela-2", aci: Math.atan2(a.dy, a.dx) });
      }
      i++;
    }
  }

  // Tabelayı zemine düz (üstten) çiz: resim varsa 56 px boyunda, yoksa kod yedeği
  function tabelaCiz(c, tb) {
    let im = null;
    try { im = typeof gorsel === "function" ? (gorsel(tb.k) || gorsel("tabela-tas")) : null; } catch (e) { im = null; }
    if (im && im.width) {
      try { typeof resmiKutuyaCiz === "function" ? resmiKutuyaCiz(c, im, tb.x - 28, tb.y - 56, 56, 56, true) : c.drawImage(im, tb.x - 28, tb.y - 56, 56, 56); }
      catch (e) { /* çizim hatası oyunu durdurmasın */ }
      return;
    }
    // Tabela asla döndürülmez: direk dikey, tahta yatay; ok ucu yöne göre sola/sağa bakar
    const yon = Math.cos(tb.aci || 0) < 0 ? -1 : 1;
    c.save();
    c.fillStyle = "rgba(40,28,16,0.9)";
    c.fillRect(tb.x - 4, tb.y - 40, 8, 40);
    c.fillStyle = "#6b4a2b";
    c.fillRect(tb.x - 3, tb.y - 40, 6, 40);
    const cx = tb.x, cy = tb.y - 48;
    const plank = (yar, kal, renk, kay) => {
      c.beginPath();
      c.moveTo(cx - yar + kay, cy - kal);
      c.lineTo(cx + yar + kay, cy - kal);
      c.lineTo(cx + yar + kay, cy + kal);
      c.lineTo(cx - yar + kay, cy + kal);
      c.closePath();
      c.fillStyle = renk; c.fill();
    };
    const okUcu = (kal, renk, kay) => {
      const bx = cx + kay + yon * 15;
      c.beginPath();
      c.moveTo(bx, cy - kal);
      c.lineTo(bx + yon * 8, cy);
      c.lineTo(bx, cy + kal);
      c.closePath();
      c.fillStyle = renk; c.fill();
    };
    plank(14, 6.5, "rgba(40,28,16,0.9)", 0);
    plank(12.5, 5, "#9a6b3a", 0);
    okUcu(6.5, "rgba(40,28,16,0.9)", 0);
    okUcu(5, "#9a6b3a", 0);
    c.restore();
  }

  // Harita genişliğine göre 6-12 yumuşak leke / 2000 px; su üstüne konmaz
  function lekeleriKur(bolum, ulke) {
    const W = (typeof game !== "undefined" && game && game.worldW) || 0;
    const H = (typeof game !== "undefined" && game && game.worldH) || 0;
    if (!W || !H) return [];
    const n = Math.round((W / 2000) * (6 + yolculukRastgele(bolum, ulke, 7000, 0) * 6));
    const adet = Math.max(1, n);
    let renk = "rgb(90,86,80)";
    try {
      const th = typeof getTheme === "function" ? getTheme() : null;
      if (th && th.floor) renk = acikRenk(th.floor, 0.1);
    } catch (e) { /* varsayılan renk */ }
    const out = [];
    for (let i = 0; i < adet; i++) {
      const doku = lekeDokusu(i);
      let x = 0, y = 0, r = 0, oldu = false;
      for (let t = 0; t < 24; t++) {
        r = 140 + yolculukRastgele(bolum, ulke, 7100 + i * 5, t * 3 + 1) * 240;
        const rx = Math.min(r, (W - 120) / 2), ry = Math.min(r, (H - 120) / 2);
        if (rx < 40 || ry < 40) continue;
        x = 60 + rx + yolculukRastgele(bolum, ulke, 7200 + i * 11, t * 3 + 2) * Math.max(0, W - 120 - 2 * rx);
        y = 60 + ry + yolculukRastgele(bolum, ulke, 7300 + i * 17, t * 3 + 3) * Math.max(0, H - 120 - 2 * ry);
        r = Math.min(r, rx, ry);
        if (typeof collidesWaters === "function" && collidesWaters(x, y, 0)) continue;
        oldu = true;
        break;
      }
      if (oldu) out.push({ x, y, r, doku, renk });
    }
    return out;
  }

  // Ana yoldan engelin dikdörtgen kenarına 38 px'lik patika (suya girmeyen, en çok 10)
  function enYakinCizgiNoktasi(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, uz = dx * dx + dy * dy;
    let t = uz ? ((px - ax) * dx + (py - ay) * dy) / uz : 0;
    t = Math.max(0, Math.min(1, t));
    return { x: ax + dx * t, y: ay + dy * t };
  }

  function cizgiSuda(a, b) {
    if (typeof collidesWaters !== "function") return false;
    const L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(2, Math.ceil(L / 16));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (collidesWaters(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0)) return true;
    }
    return false;
  }

  function patikalarEkle(yollar, patikalar) {
    if (typeof game === "undefined" || !game || !Array.isArray(game.walls)) return;
    if (!Array.isArray(patikalar)) return;
    let eklenen = 0;
    for (const o of game.walls) {
      if (eklenen >= 10) break;
      if (!o || (o.tur !== "obje1" && o.tur !== "obje2")) continue;
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
      let en = Infinity, pm = null;
      for (const yol of yollar) {
        const p = yol && yol.noktalar;
        if (!Array.isArray(p) || p.length < 2) continue;
        for (let i = 0; i < p.length - 1; i++) {
          const q = enYakinCizgiNoktasi(cx, cy, p[i].x, p[i].y, p[i + 1].x, p[i + 1].y);
          const d = Math.hypot(q.x - cx, q.y - cy);
          if (d < en) { en = d; pm = q; }
        }
      }
      if (!pm || en > 420) continue;
      const ex = Math.max(o.x, Math.min(o.x + o.w, pm.x));
      const ey = Math.max(o.y, Math.min(o.y + o.h, pm.y));
      const dx = ex - pm.x, dy = ey - pm.y, uz = Math.hypot(dx, dy);
      if (uz < 1) continue; // yol engelin içinden geçiyor: patika kurulamaz
      const son = { x: ex - (dx / uz) * 6, y: ey - (dy / uz) * 6 };
      if (Math.hypot(son.x - pm.x, son.y - pm.y) < 12) continue;
      if (cizgiSuda(pm, son)) continue;
      patikalar.push({ noktalar: [{ x: pm.x, y: pm.y }, son], gen: 38, patika: true });
      eklenen++;
    }
  }

  // Klasik harita: merkez çevresinde 6-8 tohumlu noktadan kapalı döngü yolu
  function klasikDonguKur(yollar, bolum, ulke) {
    const W = game.worldW, H = game.worldH;
    if (!W || !H) return;
    const n = 6 + Math.floor(yolculukRastgele(bolum, ulke, 6000, 0) * 3);
    const cx = W / 2, cy = H / 2, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (yolculukRastgele(bolum, ulke, 6100 + i, 1) - 0.5) * 0.35;
      const rx = W * (0.35 + yolculukRastgele(bolum, ulke, 6200 + i, 2) * 0.1);
      const ry = H * (0.35 + yolculukRastgele(bolum, ulke, 6300 + i, 3) * 0.1);
      const x = Math.max(60, Math.min(W - 60, cx + Math.cos(a) * rx));
      const y = Math.max(60, Math.min(H - 60, cy + Math.sin(a) * ry));
      pts.push({ x, y });
    }
    pts.push({ x: pts[0].x, y: pts[0].y });
    yollar.push({ noktalar: pts, gen: 64, dongu: true });
  }

  // ---------- ZEM2A: organik yol geometrisi ve düzensiz dolgu ----------
  // Tohumlu karma (Math.random yok): aynı girdi her zaman aynı 0..1 değerini verir
  function tohumHash(a, b, c) {
    let h = (a | 0) * 374761393 + (b | 0) * 668265263 + (c | 0) * 1442695040;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  }

  // Yol polyline'ını ~20 px'de bir yeniden örnekler; orta çizgi yumuşak gürültüyle
  // yana kayar, her örnekte 0.7..1.3 arası bir genişlik katsayısı (w) tutulur.
  // İlk/son nokta sabit kalır (köprü ağzı, arena girişi).
  function yolOrnekle(yol, bolum, ulke, sira) {
    const q = yol && yol.noktalar;
    if (!Array.isArray(q) || q.length < 2) { if (yol) yol.ornekler = null; return; }
    const patika = !!yol.patika;
    const amp = patika ? 8 : 16;
    const parcaL = []; let L = 0;
    for (let i = 0; i < q.length - 1; i++) { const d = Math.hypot(q[i + 1].x - q[i].x, q[i + 1].y - q[i].y); parcaL.push(d); L += d; }
    if (L < 4) { yol.ornekler = q.map((p) => ({ x: p.x, y: p.y, w: 1 })); return; }
    const rnd = (k) => typeof yolculukRastgele === "function" ? yolculukRastgele(bolum, ulke, 50000 + sira * 131 + k, 7) : 0.5;
    const l1 = 120 + rnd(1) * 280, l2 = 120 + rnd(2) * 280, l3 = 120 + rnd(3) * 280;
    const f1 = rnd(4) * Math.PI * 2, f2 = rnd(5) * Math.PI * 2, f3 = rnd(6) * Math.PI * 2;
    const gl1 = 160 + rnd(7) * 240, gl2 = 160 + rnd(8) * 240, gl3 = 160 + rnd(9) * 240;
    const g1 = rnd(10) * Math.PI * 2, g2 = rnd(11) * Math.PI * 2, g3 = rnd(12) * Math.PI * 2;
    const n = Math.max(2, Math.round(L / 20));
    const ornekler = [];
    let seg = 0, segBas = 0;
    for (let k = 0; k <= n; k++) {
      const d = L * k / n;
      while (seg < parcaL.length - 1 && segBas + parcaL[seg] < d) { segBas += parcaL[seg]; seg++; }
      const sl = parcaL[seg] || 1, t = Math.max(0, Math.min(1, (d - segBas) / sl));
      const a = q[seg], b = q[seg + 1] || a;
      const dx = b.x - a.x, dy = b.y - a.y, uz = Math.hypot(dx, dy) || 1;
      const nx = -dy / uz, ny = dx / uz;
      const kenar = Math.min(1, d / 45, (L - d) / 45); // uçlarda kayma sıfıra iner
      const gur = 0.6 * Math.sin((d / l1) * Math.PI * 2 + f1) + 0.3 * Math.sin((d / l2) * Math.PI * 2 + f2) + 0.1 * Math.sin((d / l3) * Math.PI * 2 + f3);
      const wn = 0.5 + 0.5 * (0.7 * Math.sin((d / gl1) * Math.PI * 2 + g1) + 0.2 * Math.sin((d / gl2) * Math.PI * 2 + g2) + 0.1 * Math.sin((d / gl3) * Math.PI * 2 + g3));
      ornekler.push({
        x: a.x + dx * t + nx * amp * kenar * gur,
        y: a.y + dy * t + ny * amp * kenar * gur,
        w: 1 + (wn - 0.5) * 0.6 * kenar,
      });
    }
    ornekler[0] = { x: q[0].x, y: q[0].y, w: 1 };
    ornekler[n] = { x: q[q.length - 1].x, y: q[q.length - 1].y, w: 1 };
    yol.ornekler = ornekler;
  }

  // Düzensiz çokgen benek (6-9 köşe, köşe yarıçapı ±25 % tohumlu)
  function benekCiz(c, x, y, r, tohum) {
    if (!(r > 0.3)) return;
    const n = 6 + Math.floor(tohumHash(tohum, 0, 1) * 4);
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.75 + tohumHash(tohum, i + 1, 2) * 0.5);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.fill();
  }

  // Yolu stroke yerine üst üste binen beneklerle döşer: orta gövde, taşan kenar
  // parçaları, ortada soluk aşınma şeridi ve kenarı kemiren destination-out ısırıkları
  function yolBenekleriCiz(kc, yol, sira, ox, oy, tas) {
    const S = Array.isArray(yol.ornekler) && yol.ornekler.length > 1 ? yol.ornekler : yol.noktalar;
    if (!Array.isArray(S) || S.length < 2) return;
    const yari = (yol.gen || 64) / 2;
    const desen = yolDeseni(kc, tas);
    const tohumTemel = 60000 + sira * 1000;
    let tohum = 0;
    const kutu = { x0: ox - 28, y0: oy - 28, x1: ox + PARCA + 28, y1: oy + PARCA + 28 };
    const cizBenek = (x, y, r) => {
      if (x + r < kutu.x0 || x - r > kutu.x1 || y + r < kutu.y0 || y - r > kutu.y1) return;
      benekCiz(kc, x, y, r, tohumTemel + (tohum++));
    };
    kc.fillStyle = desen || (tas ? "rgba(91,88,102,0.9)" : "rgba(107,90,67,0.9)");
    // a) Gövde: örnekler arası ~0.30 r adımla, r = gen*w/2
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], b = S[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
      if (L < 0.01) continue;
      const wa = a.w || 1, wb = b.w || 1;
      let d = 0;
      while (d <= L) {
        const t = d / L, w = wa + (wb - wa) * t, r = yari * w;
        cizBenek(a.x + dx * t, a.y + dy * t, r);
        d += Math.max(4, r * 0.30);
      }
    }
    // b) Kenarlardan taşan küçük toprak parçaları (her ~30 px'de yan başına 1-3)
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], b = S[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
      if (L < 0.01) continue;
      const nx = -dy / L, ny = dx / L;
      const wa = a.w || 1, wb = b.w || 1;
      let d = 0;
      while (d <= L) {
        const t = d / L, w = wa + (wb - wa) * t, r = yari * w;
        const x = a.x + dx * t, y = a.y + dy * t;
        for (const yon of [-1, 1]) {
          const adet = 1 + Math.floor(tohumHash(tohumTemel + i, Math.round(d), yon > 0 ? 1 : 2) * 3);
          for (let j = 0; j < adet; j++) {
            const h = tohumHash(tohumTemel + i * 7 + j, Math.round(d), yon > 0 ? 3 : 4);
            const br = 3 + h * 4;
            const dis = r - br * 0.4 + tohumHash(tohumTemel + i * 7 + j, Math.round(d), yon > 0 ? 5 : 6) * 6;
            cizBenek(x + nx * dis * yon, y + ny * dis * yon, br);
          }
        }
        d += 30;
      }
    }
    // c) Ortada soluk aşınma şeridi (yol genişliğinin %35'i, benek tabanlı)
    kc.fillStyle = "rgba(0,0,0,0.08)";
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], b = S[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
      if (L < 0.01) continue;
      const wa = a.w || 1, wb = b.w || 1;
      let d = 0;
      while (d <= L) {
        const t = d / L, w = wa + (wb - wa) * t, r = yari * w * 0.175;
        cizBenek(a.x + dx * t, a.y + dy * t, r);
        d += Math.max(4, r * 0.6);
      }
    }
    // b) Kenara giren ısırıklar: çimen alttan görünür
    kc.globalCompositeOperation = "destination-out";
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], b = S[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
      if (L < 0.01) continue;
      const nx = -dy / L, ny = dx / L;
      const wa = a.w || 1, wb = b.w || 1;
      let d = 15;
      while (d <= L) {
        const t = d / L, w = wa + (wb - wa) * t, r = yari * w;
        const x = a.x + dx * t, y = a.y + dy * t;
        for (const yon of [-1, 1]) {
          const h = tohumHash(tohumTemel + i * 11, Math.round(d), yon > 0 ? 7 : 8);
          if (h > 0.55) continue;
          const br = 3 + tohumHash(tohumTemel + i * 13, Math.round(d), yon > 0 ? 9 : 10) * 6;
          const dis = r * 0.95 - h * 3;
          cizBenek(x + nx * dis * yon, y + ny * dis * yon, br);
        }
        d += 30;
      }
    }
    kc.globalCompositeOperation = "source-over";
    // ZEM3B: çukur yolun iç pervazı — sol üst kenar koyu (gölgede), sağ alt kenar açık (ışık alır)
    const pervazlar = [
      { koyu: true, kal: 3, renk: "rgba(0,0,0,0.18)" },
      { koyu: false, kal: 2, renk: "rgba(255,240,210,0.12)" },
    ];
    for (const pv of pervazlar) {
      kc.fillStyle = pv.renk;
      for (let i = 0; i < S.length - 1; i++) {
        const a = S[i], b = S[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
        if (L < 0.01) continue;
        const nx = -dy / L, ny = dx / L;
        const yon = pv.koyu ? ((nx + ny) <= 0 ? 1 : -1) : ((nx + ny) <= 0 ? -1 : 1);
        const wa = a.w || 1, wb = b.w || 1;
        let d = 0;
        while (d <= L) {
          const t = d / L, w = wa + (wb - wa) * t, r = yari * w;
          const h = tohumHash(tohumTemel + i * 17, Math.round(d), pv.koyu ? 11 : 12);
          const br = pv.kal * (0.7 + h * 0.6);
          const dis = r - br * 0.55 - h * 1.2;
          if (dis > 0) cizBenek(a.x + dx * t + nx * dis * yon, a.y + dy * t + ny * dis * yon, br);
          d += Math.max(4, br * 1.5);
        }
      }
    }
  }

  // Tek bir 512x512 dünya parçasını (ölçekli tuval) yol çizgileriyle boyar
  function parcaKur(zemin, cx, cy, s) {
    let tuval;
    try {
      tuval = document.createElement("canvas");
      tuval.width = Math.max(1, Math.ceil(PARCA * s));
      tuval.height = Math.max(1, Math.ceil(PARCA * s));
    } catch (e) { return null; }
    const c = tuval.getContext("2d");
    if (!c) return null;
    const ox = cx * PARCA, oy = cy * PARCA;
    c.setTransform(s, 0, 0, s, -ox * s, -oy * s);
    c.lineCap = "round";
    c.lineJoin = "round";
    // Alan çeşitliliği: yumuşak zemin lekeleri yolların altına boyanır
    for (const leke of (zemin.lekeler || [])) {
      if (!leke) continue;
      if (leke.x + leke.r < ox || leke.x - leke.r > ox + PARCA || leke.y + leke.r < oy || leke.y - leke.r > oy + PARCA) continue;
      let im = null;
      try { im = leke.doku && typeof gorsel === "function" ? gorsel(leke.doku) : null; } catch (e) { im = null; }
      if (!leke._tv || leke._tvIm !== im) { leke._tv = lekeTuvali(im, leke.renk); leke._tvIm = im; }
      if (!leke._tv) continue;
      c.globalAlpha = 0.4;
      c.drawImage(leke._tv, leke.x - leke.r, leke.y - leke.r, leke.r * 2, leke.r * 2);
      c.globalAlpha = 1;
    }
    const tas = tasYolMu();
    // ZEM2A: yollar doğrudan tuvale değil, aynı dönüşümlü küçük bir yol katmanına çizilir
    let katman = null, kc = null;
    function yolKatmani() {
      if (kc) return kc;
      try {
        katman = document.createElement("canvas");
        katman.width = tuval.width; katman.height = tuval.height;
        kc = katman.getContext("2d");
        if (!kc) { katman = null; return null; }
        kc.setTransform(s, 0, 0, s, -ox * s, -oy * s);
        kc.lineCap = "round"; kc.lineJoin = "round";
      } catch (e) { kc = null; katman = null; return null; }
      return kc;
    }
    let patikaSira = 0, yolSira = 0;
    for (const yol of zemin.yollar.concat(zemin.patikalar || [])) {
      if (!yol || !Array.isArray(yol.noktalar) || yol.noktalar.length < 2) continue;
      if (!yolParcaKesiyor(yol, ox, oy, PARCA)) continue;
      const sira = yolSira++;
      if (yol.patika && patikaSira < 3) {
        patikaSira++;
        if (basamakCiz(c, yol)) continue; // sus-basamak varsa patika taşlarla döşenir
      } else if (yol.patika) patikaSira++;
      const kctx = yolKatmani();
      if (!kctx) continue;
      yolBenekleriCiz(kctx, yol, sira, ox, oy, tas);
    }
    // Düzensiz yol katmanını parçaya bindir (hafif dış gölge + kendisi)
    if (kc && katman) {
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 0.12;
      c.drawImage(katman, 0, Math.round(2 * s));
      c.globalAlpha = 1;
      c.drawImage(katman, 0, 0);
      c.restore();
    }
    // ZEM1B: temas gölgeleri ve taban süsleri (yolların üstüne; parça başına bir kez)
    for (const g of (zemin.golgeler || [])) {
      if (!g) continue;
      const r = Math.max(g.rx, g.ry);
      if (g.x + r < ox || g.x - r > ox + PARCA || g.y + r < oy || g.y - r > oy + PARCA) continue;
      golgeCiz(c, g.x, g.y, g.rx, g.ry, g.h);
    }
    for (const s of (zemin.suslar || [])) {
      if (!s) continue;
      const b = s.boy;
      if (s.x + b < ox || s.x - b > ox + PARCA || s.y + b < oy || s.y - b > oy + PARCA) continue;
      susCiz(c, s);
    }
    // ZEM2B: çatal tabelaları süslerin üstünde, taban noktasına oturur
    for (const tb of (zemin.tabelalar || [])) {
      if (!tb) continue;
      if (tb.x + 40 < ox || tb.x - 40 > ox + PARCA || tb.y + 12 < oy || tb.y - 60 > oy + PARCA) continue;
      tabelaCiz(c, tb);
    }
    return tuval;
  }

  // İki uç arasına 1-2 tohumlu ara nokta (dikey ±60 px) ekler
  function araliNoktalar(a, b, bolum, ulke, sira) {
    const A = typeof YOLCULUK_AYAR !== "undefined" ? YOLCULUK_AYAR : null;
    const yukari = A && A.worldH ? A.worldH : (typeof game !== "undefined" && game.worldH) || 1000;
    const n = 1 + Math.floor(yolculukRastgele(bolum, ulke, sira, 1) * 2);
    const pts = [{ x: a.x, y: a.y }];
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const sap = (yolculukRastgele(bolum, ulke, sira, k + 1) * 2 - 1) * 60;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t + sap;
      pts.push({ x, y: Math.max(60, Math.min(yukari - 60, y)) });
    }
    pts.push({ x: b.x, y: b.y });
    return pts;
  }

  // Bölümün zemin betimini kur: yol polyline'ları (nehir şeritleri ayrı parçalara bölünür)
  function zeminKatmaniKur() {
    if (typeof game === "undefined" || !game) return;
    const yollar = [], lekeler = [], patikalar = [];
    game._zeminKatmani = { yollar, lekeler, patikalar };
    zeminKatmaniSil();
    const bolum = game.level || 1;
    const ulke = typeof yolculukUlkeKodu === "function" ? yolculukUlkeKodu() : "-";
    if (typeof yolculukRastgele === "function") {
      for (const leke of lekeleriKur(bolum, ulke)) lekeler.push(leke);
    }
    let acik = false;
    try { acik = typeof yolculukAcik === "function" && yolculukAcik(); } catch (e) { acik = false; }
    if (acik && typeof yolculukBaslangic === "function") {
      const d = game._yolculukDuzen;
      if (d && Array.isArray(d.zones) && d.arena) {
        const A = typeof YOLCULUK_AYAR !== "undefined" ? YOLCULUK_AYAR : { worldH: game.worldH || 1000 };
        let onceki = yolculukBaslangic();
        for (let i = 0; i < d.zones.length; i++) {
          const z = d.zones[i];
          const g = z.gate;
          let noktalar;
          if (Array.isArray(z._sablonYol) && z._sablonYol.length) {
            // YER1: şablonun "yol" noktaları ana patikaya yön verir
            noktalar = [onceki];
            for (const p of z._sablonYol) noktalar.push({ x: p.x, y: p.y });
            noktalar.push({ x: g.x0 - 40, y: g.cy });
          } else {
            noktalar = araliNoktalar(onceki, { x: g.x0 - 40, y: g.cy }, bolum, ulke, i * 2 + 1);
          }
          yollar.push({ noktalar, gen: 64 });
          // Nehir şeridi atlanır; sonraki parça sağ kıyıdan başlar
          onceki = { x: g.x1 + 40, y: g.cy };
        }
        yollar.push({ noktalar: araliNoktalar(onceki, { x: d.arena.x0 - 20, y: A.worldH / 2 }, bolum, ulke, 999), gen: 64 });
      }
    } else if (typeof yolculukRastgele === "function") {
      klasikDonguKur(yollar, bolum, ulke);
    }
    patikalarEkle(yollar, patikalar);
    // ZEM2A: her yol/patika için organik orta çizgi ve genişlik örnekleri (tohumlu)
    let osira = 0;
    for (const yol of yollar) yolOrnekle(yol, bolum, ulke, osira++);
    for (const yol of patikalar) yolOrnekle(yol, bolum, ulke, osira++);
    // ZEM1B: taban süsleri/gölgeler yollar kurulduktan sonra tohumlanır (yol kontrolü hazır)
    suslariKur(game._zeminKatmani, bolum, ulke);
    // ZEM2B: yoğun yol kenarı kaosu ve çatal tabelaları
    kenarSuslariKur(game._zeminKatmani, bolum, ulke);
    tabelalariKur(game._zeminKatmani, bolum, ulke);
    // SUS1: üst üste binen süsleri ayıkla
    susAyikla(game._zeminKatmani, bolum, ulke);
  }

  function zeminKatmaniSil() {
    if (typeof game !== "undefined" && game) {
      if (game._zeminParcalari && typeof game._zeminParcalari.clear === "function") game._zeminParcalari.clear();
      else game._zeminParcalari = new Map();
    }
    _zeminGorunum.liste = null; _zeminGorunum.halkaTam = false;
  }

  // Son çizilen görünümün hazır parçaları: görünüm hücreleri ve önbellek değişmedikçe her karede
  // anahtar kurmak/aramak ve çevre halkasını taramak yerine liste doğrudan çizilir (davranış aynı).
  const _zeminGorunum = { onbellek: null, boyut: -1, x0: NaN, y0: NaN, x1: NaN, y1: NaN, s: 0, liste: null, halkaTam: false };

  // Görünür parçaları önbellekten çiz; eksikse bu çağrıda en çok birini kur
  function zeminKatmaniCiz(ctx) {
    if (typeof game === "undefined" || !game || !ctx) return;
    const zemin = game._zeminKatmani;
    if (!zemin || !Array.isArray(zemin.yollar) || !zemin.yollar.length) return;
    if (typeof engelOlcegi !== "function") return;
    const s = engelOlcegi() || 1;
    if (!game._zeminParcalari || typeof game._zeminParcalari.get !== "function") game._zeminParcalari = new Map();
    const onbellek = game._zeminParcalari;
    const cam = game.camera || { x: 0, y: 0 };
    const W = game.W || 0, H = game.H || 0;
    const x0 = Math.floor(cam.x / PARCA), x1 = Math.floor((cam.x + W) / PARCA);
    const y0 = Math.floor(cam.y / PARCA), y1 = Math.floor((cam.y + H) / PARCA);
    let kurulan = false;
    const eskiDuz = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false; // parçalar dünya ölçeğinde 1:1; yumuşatma taraması pahalı
    const G = _zeminGorunum;
    const ayni = G.onbellek === onbellek && G.boyut === onbellek.size && G.s === s &&
      G.x0 === x0 && G.y0 === y0 && G.x1 === x1 && G.y1 === y1 && G.liste;
    if (ayni) {
      // Görünüm değişmedi: hazır listedeki parçaları doğrudan çiz
      for (const q of G.liste) ctx.drawImage(q.canvas, q.x, q.y, PARCA, PARCA);
      if (G.halkaTam) { ctx.imageSmoothingEnabled = eskiDuz; return; }
    } else {
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const anahtar = cx + "|" + cy + "|" + s;
          const varOlan = onbellek.get(anahtar);
          if (varOlan !== undefined) {
            if (varOlan) ctx.drawImage(varOlan, cx * PARCA, cy * PARCA, PARCA, PARCA);
            continue;
          }
          if (!kurulan) {
            // Kurulan parça aynı karede çizilir (eskiden bir sonraki kareye kalıyordu: kamera kayınca dikdörtgen boşluk)
            const yeni = parcaKur(zemin, cx, cy, s) || 0;
            onbellek.set(anahtar, yeni);
            if (yeni) ctx.drawImage(yeni, cx * PARCA, cy * PARCA, PARCA, PARCA);
            kurulan = true;
          }
        }
      }
    }
    // Ekrandaki parçaların hepsi hazırsa bu karede görünüm çevresinden (bir parça pay) bir parça önceden kurulur:
    // kamera kayarken yeni açılan bölge hazır olur, parçalar gecikmeli belirmez
    let halkaKurdu = false;
    if (!kurulan) {
      dis: for (let cy = y0 - 1; cy <= y1 + 1; cy++) {
        for (let cx = x0 - 1; cx <= x1 + 1; cx++) {
          if (cx < 0 || cy < 0 || cx * PARCA > (game.worldW || 0) || cy * PARCA > (game.worldH || 0)) continue;
          const anahtar = cx + "|" + cy + "|" + s;
          if (onbellek.get(anahtar) !== undefined) continue;
          onbellek.set(anahtar, parcaKur(zemin, cx, cy, s) || 0);
          halkaKurdu = true;
          break dis;
        }
      }
    }
    // Görünüm listesini tazele (tüm görünür parçalar hazırsa) ve halka tamam bayrağını güncelle
    if (!kurulan) {
      const liste = [];
      let eksik = false;
      for (let cy = y0; cy <= y1 && !eksik; cy++) for (let cx = x0; cx <= x1; cx++) {
        const cv = onbellek.get(cx + "|" + cy + "|" + s);
        if (cv === undefined) { eksik = true; break; }
        if (cv) liste.push({ canvas: cv, x: cx * PARCA, y: cy * PARCA });
      }
      G.liste = eksik ? null : liste;
      G.halkaTam = !halkaKurdu;
    } else {
      G.liste = null; G.halkaTam = false;
    }
    G.onbellek = onbellek; G.boyut = onbellek.size; G.s = s;
    G.x0 = x0; G.y0 = y0; G.x1 = x1; G.y1 = y1;
    ctx.imageSmoothingEnabled = eskiDuz;
  }

  function zeminKatmaniYolMu(x, y) {
    if (typeof game === "undefined" || !game || !game._zeminKatmani) return false;
    const z = game._zeminKatmani;
    const yollar = (z.yollar || []).concat(z.patikalar || []);
    if (!Array.isArray(yollar)) return false;
    for (const yol of yollar) {
      const p = (Array.isArray(yol.ornekler) && yol.ornekler.length > 1) ? yol.ornekler : (yol && yol.noktalar);
      if (!Array.isArray(p) || p.length < 2) continue;
      const yari = (yol.gen || 64) / 2;
      for (let i = 0; i < p.length - 1; i++) {
        const w = ((p[i].w || 1) + (p[i + 1].w || 1)) / 2;
        if (noktaCizgiUzaklik(x, y, p[i].x, p[i].y, p[i + 1].x, p[i + 1].y) <= yari * w) return true;
      }
    }
    return false;
  }

  // ---------- ZEM3B: oyuncu çevresi ışık halkası (ekran uzayı, önceden bir kez çizilir) ----------
  let _isikTuv = null, _isikBoyut = "", _isikAlfa = 0, _isikSon = 0;

  // Ekran boyutu için iki katı büyüklükte halka tuvali (boyut değişince yeniden kurulur)
  function isikHalkasiTuvall(W, H) {
    const anahtar = W + "x" + H;
    if (_isikTuv && _isikBoyut === anahtar) return _isikTuv;
    try {
      const tv = document.createElement("canvas");
      tv.width = Math.max(2, W * 2); tv.height = Math.max(2, H * 2);
      const c = tv.getContext("2d");
      if (!c) return null;
      const r0 = 0.42 * Math.min(W, H);
      const r1 = Math.hypot(W, H) / 2;
      const g = c.createRadialGradient(W, H, r0, W, H, Math.max(r0 + 1, r1));
      g.addColorStop(0, "rgba(255,200,120,0.04)"); // içte çok hafif sıcak ton
      g.addColorStop(0.45, "rgba(10,8,20,0.12)");
      g.addColorStop(1, "rgba(10,8,20,0.34)"); // ekran köşelerinde koyulaşır
      c.fillStyle = g;
      c.fillRect(0, 0, tv.width, tv.height);
      _isikTuv = tv; _isikBoyut = anahtar;
      return tv;
    } catch (e) { return null; }
  }

  // Işık halkasını oyuncunun ekran konumuna çiz; menüde/ölüyken/uçuşta 300 ms'de söner
  function isikHalkasiCiz(ctx, ekranX, ekranY) {
    if (!ctx || typeof game === "undefined" || !game) return false;
    const g = game;
    const aktif = !!(ISIK_HALKASI && g.running && !g.paused && !g.menude && !g._turGeciste && g.player && !g.player.dead);
    const simdi = performance.now();
    const dt = _isikSon ? Math.min(120, Math.max(0, simdi - _isikSon)) : 16;
    _isikSon = simdi;
    const hedef = aktif ? 1 : 0;
    if (_isikAlfa < hedef) _isikAlfa = Math.min(hedef, _isikAlfa + dt / 300);
    else if (_isikAlfa > hedef) _isikAlfa = Math.max(hedef, _isikAlfa - dt / 300);
    if (_isikAlfa <= 0.002) return false;
    const W = g.W || (ctx.canvas && ctx.canvas.width) || 0;
    const H = g.H || (ctx.canvas && ctx.canvas.height) || 0;
    if (!(W > 0 && H > 0) || !g.player) return false;
    const tv = isikHalkasiTuvall(W, H);
    if (!tv) return false;
    const px = Number.isFinite(ekranX) ? ekranX : (g.player.x - ((g.camera && g.camera.x) || 0));
    const py = Number.isFinite(ekranY) ? ekranY : (g.player.y - ((g.camera && g.camera.y) || 0));
    ctx.save();
    ctx.globalAlpha = _isikAlfa;
    ctx.drawImage(tv, px - W, py - H);
    ctx.restore();
    return true;
  }

  try {
    Object.defineProperty(window, "ISIK_HALKASI", {
      configurable: true,
      get() { return ISIK_HALKASI; },
      set(v) { ISIK_HALKASI = !!v; },
    });
  } catch (e) { /* tarayıcı yok */ }

  window.addEventListener("gorsel-yuklendi", () => zeminKatmaniSil());

  Object.assign(window, {
    zeminKatmaniKur, zeminKatmaniCiz, zeminKatmaniSil, zeminKatmaniYolMu,
    isikHalkasiCiz, zeminGolgeCiz: golgeCiz,
    isikHalkasiDurum: () => ({ alfa: _isikAlfa, acik: ISIK_HALKASI }),
  });
})();
