/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: ÜLKE OBJELERİ (Afrika, 3.14.0)
   Ressam imzası engel-temalari.js ile aynı: (ctx, w, h, r, p, B) -> canli[]. B "yama" ya da "kaya" biçimi; süsler
   biçimin içinde kalır, sabit çizim dikdörtgenin üst kenarından taşmaz; uzun yapılar maket boyunda (spec §5.3).
   Canlı süsler ENGEL_CANLI'ya eklenir (her karede çizilir). Math.random yok; insan, bayrak, dinî öğe, silah yok.
   Kuzey Afrika ve Sahel (Görev 8): Fas, Cezayir, Fildişi Sahili, Gana, Nijerya, Sudan, Mısır. Savan Görev 9'da.
   Yerleşim yardımcıları (enIyiYer, yamaZemin…) ulke-objeleri-avrupa.js'ten (ULKE_OBJE_YARDIMCI; o dosya önce yüklenir).
   ============================================================ */
window.ULKE_OBJELERI = window.ULKE_OBJELERI || {};
(function () {
  const { doldur, cizgi, kirp, kenarNoktalari, icNoktalar, karistir, acik, koyu, elips, cimTutami, yuvarlak } = window.ENGEL;
  const { ustBosluk, yamaZemin, yapiSigdir, enIyiYer, disinda, yuz } = window.ULKE_OBJE_YARDIMCI;
  const uz = (B, x, y) => window.engelUzaklik(B, x, y);

  // Kum zemin: yama dolgusu, ince kum dalgaları ve kum taneleri
  function kumZemin(ctx, B, w, h, r, renk) {
    yamaZemin(ctx, B, w, h, r, renk, null);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(renk, 0.1); ctx.lineWidth = 1; ctx.beginPath();
      for (let y = 6; y < h; y += 7) for (let x = 0; x <= w; x += 6) { const yy = y + Math.sin(x / 11 + y * 0.7) * 1.6; if (x) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); }
      ctx.stroke();
      for (let i = 0; i < w * h / 220; i++) elips(ctx, r() * w, r() * h, 0.8, 0.6, r() < 0.5 ? koyu(renk, 0.2) : acik(renk, 0.25));
    });
  }
  // Yandan hurma ağacı: kavisli halkalı gövde, sarkan yapraklar, turuncu salkım
  function yanHurma(ctx, x, taban, boy) {
    const egik = boy * 0.12, tx = x + egik, ty = taban - boy;
    elips(ctx, x + 2, taban, boy * 0.22, boy * 0.06, "rgba(0,0,0,0.25)");
    ctx.strokeStyle = "#7c5a2e"; ctx.lineWidth = Math.max(1.6, boy * 0.08); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, taban); ctx.quadraticCurveTo(x - egik * 0.3, taban - boy * 0.5, tx, ty); ctx.stroke();
    ctx.strokeStyle = "#5a4020"; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let t = 0.15; t < 0.95; t += 0.12) { const yy = taban - boy * t, xx = x + egik * t * t; ctx.moveTo(xx - 1.2, yy); ctx.lineTo(xx + 1.2, yy - 0.5); }
    ctx.stroke();
    const s = boy * 0.42;
    for (const [a, renk] of [[-2.7, "#3d7a2e"], [-2.2, "#56a03c"], [-1.6, "#4a8f34"], [-1.0, "#56a03c"], [-0.45, "#3d7a2e"]]) {
      const ux = Math.cos(a), uy = Math.sin(a), ux2 = Math.cos(a + (a < -1.57 ? -0.9 : 0.9)), uy2 = Math.sin(a + (a < -1.57 ? -0.9 : 0.9));
      ctx.strokeStyle = renk; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + ux * s * 0.7, ty + uy * s * 0.7, tx + (ux * 0.6 + ux2 * 0.5) * s, ty + (uy * 0.6 + uy2 * 0.5) * s + s * 0.25); ctx.stroke();
    }
    for (let j = 0; j < 4; j++) elips(ctx, tx - 1 + (j % 2) * 2, ty + 1.5 + Math.floor(j / 2) * 1.5, 1, 1.1, j % 2 ? "#d0702a" : "#9a4a1a");
  }

  // ---------- canlı: çarşı feneri (askıda hafifçe sallanır, ışığı titrer; k.renk cam rengi, k.s boy) ----------
  Object.assign(window.ENGEL_CANLI, {
    fener(ctx, x, y, zaman, n, k) {
      const renk = (k && k.renk) || "#e0a83a", s = (k && k.s) || 4, eski = ctx.globalAlpha;
      const isik = 0.75 + Math.sin(zaman * 5 + n * 11) * 0.15 + Math.sin(zaman * 13 + n * 3) * 0.08;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(zaman * 1.6 + n * 6.3) * 0.12);
      ctx.globalAlpha = eski * 0.3 * isik; elips(ctx, 0, s * 2.1, s * 2.2, s * 2.2, renk); ctx.globalAlpha = eski;   // hale
      ctx.strokeStyle = "#5a4a32"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, s * 0.7); ctx.stroke();
      ctx.fillStyle = "#8a6a2a"; ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 1.25); ctx.lineTo(0, s * 0.6); ctx.lineTo(s * 0.5, s * 1.25); ctx.closePath(); ctx.fill();
      ctx.fillStyle = karistir(renk, "#fff6d0", Math.min(1, isik * 0.55)); ctx.beginPath();                          // altıgen cam
      ctx.moveTo(-s * 0.5, s * 1.25); ctx.lineTo(-s * 0.7, s * 2.1); ctx.lineTo(-s * 0.45, s * 3); ctx.lineTo(s * 0.45, s * 3); ctx.lineTo(s * 0.7, s * 2.1); ctx.lineTo(s * 0.5, s * 1.25); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#6a4a22"; ctx.lineWidth = 0.6; ctx.beginPath();
      ctx.moveTo(0, s * 1.25); ctx.lineTo(0, s * 3); ctx.moveTo(-s * 0.7, s * 2.1); ctx.lineTo(s * 0.7, s * 2.1); ctx.stroke();
      ctx.fillStyle = "#8a6a2a"; ctx.beginPath(); ctx.moveTo(-s * 0.45, s * 3); ctx.lineTo(0, s * 3.6); ctx.lineTo(s * 0.45, s * 3); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  });

  // ---------- MA: Şefşavan'ın mavi sokakları ----------
  // Mavi badanalı döşeme; yan yana mavi evler (badanalı korkuluk, kemerli kapı ve basamak, parmaklıklı pencere, duvar
  // saksıları); çevrede renkli saksılar ve kıvrılıp uyuyan bir kedi
  const MAVILER = ["#3d7fc4", "#5b9bd5", "#2f6fb0"];
  function kemerYolu(ctx, x, alt, g, b) { const ust = alt - b + g / 2; ctx.beginPath(); ctx.moveTo(x, alt); ctx.lineTo(x, ust); ctx.arc(x + g / 2, ust, g / 2, Math.PI, 0); ctx.lineTo(x + g, alt); ctx.closePath(); }
  function saksi(ctx, x, y, s, renk, cicek) {
    elips(ctx, x + 0.8, y + 0.6, s * 0.75, s * 0.25, "rgba(0,0,0,0.25)");
    ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x - s * 0.6, y - s); ctx.lineTo(x + s * 0.6, y - s); ctx.lineTo(x + s * 0.42, y); ctx.lineTo(x - s * 0.42, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = koyu(renk, 0.25); ctx.fillRect(x - s * 0.66, y - s * 1.12, s * 1.32, s * 0.24);
    elips(ctx, x - s * 0.45, y - s * 1.45, s * 0.42, s * 0.24, "#3f7a2a"); elips(ctx, x + s * 0.45, y - s * 1.4, s * 0.42, s * 0.24, "#4d8f2f");
    for (let i = 0; i < 3; i++) elips(ctx, x + (i - 1) * s * 0.4, y - s * (1.55 + (i % 2) * 0.32), s * 0.25, s * 0.25, cicek);
  }
  function maviEv(ctx, x, taban, g, b, renk, cicek) {
    const ust = taban - b, beyaz = "#f4f7fb";
    elips(ctx, x + 2, taban + 0.5, g * 0.55, 2.4, "rgba(0,0,0,0.25)");
    ctx.fillStyle = renk; ctx.fillRect(x - g / 2, ust + 2, g, b - 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(x - g / 2, ust + 2, g * 0.16, b - 2);
    ctx.fillStyle = beyaz; ctx.fillRect(x - g / 2 - 1, ust, g + 2, 2.6);                                   // badanalı korkuluk
    ctx.fillStyle = acik(renk, 0.45); ctx.fillRect(x - g / 2, taban - 2.5, g, 2.5);
    const kw = Math.max(5, g * 0.34), kh = b * 0.55, kx = x - kw / 2 - g * 0.12;                            // kemerli kapı
    ctx.fillStyle = beyaz; kemerYolu(ctx, kx - 1.2, taban, kw + 2.4, kh + 1.2); ctx.fill();
    ctx.fillStyle = koyu(renk, 0.5); kemerYolu(ctx, kx, taban, kw, kh); ctx.fill();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) elips(ctx, kx + kw * (0.3 + j * 0.4), taban - kh * (0.25 + i * 0.22), 0.5, 0.5, "#d4a73a");
    ctx.fillStyle = acik(renk, 0.3); ctx.fillRect(kx - 2.5, taban - 1.5, kw + 5, 1.5); ctx.fillRect(kx - 1.2, taban - 3, kw + 2.4, 1.5);   // basamaklar
    const pw = g * 0.2, ph = b * 0.2, px = x + g * 0.27, py = ust + b * 0.3;                                // parmaklıklı pencere
    ctx.fillStyle = beyaz; ctx.fillRect(px - pw / 2 - 1, py - 1, pw + 2, ph + 2);
    ctx.fillStyle = "#1f3a5a"; ctx.fillRect(px - pw / 2, py, pw, ph);
    ctx.strokeStyle = "#0f1f30"; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let i = 1; i < 3; i++) { ctx.moveTo(px - pw / 2 + (i * pw) / 3, py); ctx.lineTo(px - pw / 2 + (i * pw) / 3, py + ph); }
    ctx.moveTo(px - pw / 2, py + ph / 2); ctx.lineTo(px + pw / 2, py + ph / 2); ctx.stroke();
    saksi(ctx, px, py + ph + 4.5, 2.6, "#c0643a", cicek);                                                    // pencere altı saksı
    saksi(ctx, x - g * 0.38, ust + b * 0.22, 2.2, "#e0a83a", "#e0452e");                                     // duvar saksısı
  }
  function kedi(ctx, x, y, s) {
    elips(ctx, x + 1, y + s * 0.35, s * 0.9, s * 0.2, "rgba(0,0,0,0.25)");
    ctx.strokeStyle = "#7a7f87"; ctx.lineWidth = s * 0.22; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(x, y, s * 0.72, 0.1 * Math.PI, 0.95 * Math.PI); ctx.stroke();                  // kuyruk
    elips(ctx, x, y - s * 0.05, s * 0.7, s * 0.42, "#9aa0a8");
    const hx = x + s * 0.5, hy = y - s * 0.25;
    ctx.fillStyle = "#9aa0a8"; for (const dx of [-0.25, 0.22]) { ctx.beginPath(); ctx.moveTo(hx + dx * s - s * 0.14, hy - s * 0.2); ctx.lineTo(hx + dx * s, hy - s * 0.5); ctx.lineTo(hx + dx * s + s * 0.14, hy - s * 0.2); ctx.closePath(); ctx.fill(); }
    elips(ctx, hx, hy, s * 0.34, s * 0.3, "#a6acb4");
    yuz(ctx, hx, hy - s * 0.02, s * 0.36, true, "#3a3f46");
  }
  function maviSokaklar(ctx, w, h, r, p, B) {
    const zemin = "#b9cfe3";
    yamaZemin(ctx, B, w, h, r, zemin, null);
    kirp(ctx, B, () => {                                                                                    // taş döşeme
      ctx.strokeStyle = koyu(zemin, 0.14); ctx.lineWidth = 1;
      for (let y = 4, j = 0; y < h; y += 8, j++) for (let x = (j % 2) * 5 - 5; x < w; x += 9 + r() * 4) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + 1, y + 1, 8, 6, 2.5); ctx.stroke(); }
    });
    const n = Math.max(1, Math.min(3, Math.floor(w / 38))), sira = enIyiYer(B, w, h, Math.min(w * 0.88, n * 38), Math.min(64, h * 0.7), 6);
    const cicekler = ["#e0452e", "#f28cab", "#f2c94c", "#c8302a"], saksilar = ["#c0643a", p.vurgu1 || "#3d7fc4", "#e0a83a", "#f4f1ea"];
    const bos = icNoktalar(B, w, h, 9, 9, 13, r).filter(disinda(sira, 4));
    bos.forEach((k, i) => { if (i === 0 && w * h > 9000) kedi(ctx, k.x, k.y, 7); else saksi(ctx, k.x, k.y + 3, 3.8 + r(), saksilar[i % 4], cicekler[(i + 1) % 4]); });
    if (sira) {
      const g = sira.g / n;
      for (let i = 0; i < n; i++) maviEv(ctx, sira.x - sira.g / 2 + g * (i + 0.5), sira.taban, g * 0.96, sira.b * (i % 2 ? 0.88 : 1), MAVILER[i % 3], cicekler[i % 4]);
    }
    return [];
  }

  // ---------- MA: fenerli çarşı tezgâhı ----------
  // Çini döşeme; çizgili tente, ahşap direkler, arkada asılı geometrik halı, tezgâhta kaselerde baharat külahları;
  // tentenin ağzında canlı fenerler
  function fenerliCarsi(ctx, w, h, r, p, B) {
    const zemin = "#8a6a4c";
    yamaZemin(ctx, B, w, h, r, zemin, null);
    kirp(ctx, B, () => {                                                                                    // çini karolar
      for (let y = 0, j = 0; y < h; y += 10, j++) for (let x = 0, i = 0; x < w; x += 10, i++) {
        ctx.fillStyle = (i + j) % 2 ? koyu(zemin, 0.08) : acik(zemin, 0.06); ctx.fillRect(x, y, 10, 10);
        if ((i + j) % 2 === 0) window.ULKE_AILE_YARDIMCI.baklava(ctx, x + 5, y + 5, 1.6, (i + j) % 4 ? "#3d7fc4" : "#e0a83a");
      }
    });
    const canli = [], yer = enIyiYer(B, w, h, Math.min(w * 0.86, 96), Math.min(h * 0.78, 64), 5);
    if (!yer) return canli;
    const { g, b, x, taban } = yer, ust = taban - b, ahsap = "#6b4426", tenteAlt = ust + b * 0.3, tezgahUst = taban - b * 0.32;
    elips(ctx, x + 2, taban + 1, g * 0.55, 3, "rgba(0,0,0,0.3)");
    ctx.fillStyle = koyu(ahsap, 0.2); ctx.fillRect(x - g * 0.42, tenteAlt - 2, g * 0.84, tezgahUst - tenteAlt + 2);   // arka pano
    const hx = x - g * 0.42 + 3, hw = g * 0.3, hy = tenteAlt + 2, hh = tezgahUst - tenteAlt - 3;           // asılı halı
    if (hh > 6) {
      ctx.fillStyle = "#a8322a"; ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeStyle = "#e8c35a"; ctx.lineWidth = 1; ctx.strokeRect(hx + 1.5, hy + 1.5, hw - 3, hh - 3);
      for (let i = 0; i < 3; i++) window.ULKE_AILE_YARDIMCI.baklava(ctx, hx + hw / 2, hy + hh * (i + 0.5) / 3, Math.min(hw, hh / 3) * 0.3, i % 2 ? "#2f4f8a" : "#f1e3c4");
    }
    for (let i = 0; i < 5; i++) {                                                                           // arka raflarda testiler
      const tx = x + g * (0.02 + i * 0.08), ty = tezgahUst - 2;
      if (hh <= 6) break;
      elips(ctx, tx, ty - 2.5, 2.2, 2.6, i % 2 ? "#c0643a" : "#3d7fc4"); ctx.fillStyle = i % 2 ? "#c0643a" : "#3d7fc4"; ctx.fillRect(tx - 0.8, ty - 6.2, 1.6, 1.6);
    }
    ctx.fillStyle = ahsap;                                                                                  // direkler
    for (const f of [-0.44, 0.44]) ctx.fillRect(x + f * g - 1.5, ust + 4, 3, taban - ust - 4);
    ctx.fillStyle = ahsap; ctx.fillRect(x - g * 0.47, tezgahUst, g * 0.94, taban - tezgahUst);                 // tezgâh
    ctx.strokeStyle = koyu(ahsap, 0.3); ctx.lineWidth = 0.8;
    for (let yy = tezgahUst + 4; yy < taban; yy += 4) { ctx.beginPath(); ctx.moveTo(x - g * 0.47, yy); ctx.lineTo(x + g * 0.47, yy); ctx.stroke(); }
    ctx.fillStyle = acik(ahsap, 0.25); ctx.fillRect(x - g * 0.48, tezgahUst - 1.5, g * 0.96, 2.2);
    const baharat = ["#c8302a", "#e8b52a", "#d97a2a", "#6b8f3a", "#8a4a2a", "#e0452e"], kn = Math.max(3, Math.min(6, Math.floor(g / 15)));
    for (let i = 0; i < kn; i++) {                                                                          // baharat külahları
      const bx = x - g * 0.4 + (g * 0.8 * (i + 0.5)) / kn, by = tezgahUst - 0.5, bs = Math.min(7, g / kn * 0.42), renk = baharat[i % baharat.length];
      ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(bx - bs, by - 1.5); ctx.quadraticCurveTo(bx, by - bs * 2.2, bx + bs, by - 1.5); ctx.closePath(); ctx.fill();
      elips(ctx, bx - bs * 0.3, by - bs * 0.9, bs * 0.25, bs * 0.4, "rgba(255,255,255,0.2)");
      ctx.fillStyle = "#f1e3c4"; ctx.beginPath(); ctx.moveTo(bx - bs - 1, by - 2); ctx.lineTo(bx + bs + 1, by - 2); ctx.lineTo(bx + bs * 0.7, by + 0.8); ctx.lineTo(bx - bs * 0.7, by + 0.8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#3d7fc4"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(bx - bs * 0.9, by - 0.8); ctx.lineTo(bx + bs * 0.9, by - 0.8); ctx.stroke();
    }
    const serit = [p.vurgu1 || "#3d7fc4", "#f1e3c4"], sn = Math.max(4, Math.round(g / 10));                 // çizgili tente
    for (let i = 0; i < sn; i++) {
      const x0 = x - g / 2 + (g * i) / sn, x1 = x - g / 2 + (g * (i + 1)) / sn;
      ctx.fillStyle = serit[i % 2]; ctx.beginPath(); ctx.moveTo(x0 + g * 0.06 * (1 - (2 * i) / sn), ust); ctx.lineTo(x1 + g * 0.06 * (1 - (2 * (i + 1)) / sn), ust);
      ctx.lineTo(x1, tenteAlt - 2); ctx.arc((x0 + x1) / 2, tenteAlt - 2, (x1 - x0) / 2, 0, Math.PI); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fillRect(x - g / 2, tenteAlt - 4, g, 2);
    const fs = Math.max(2.4, Math.min(4, (tezgahUst - tenteAlt) / 7)), renkler = ["#e0a83a", "#d6453d", "#3dbf8f", "#e0a83a"];
    const fn = Math.max(2, Math.min(4, Math.floor(g / 26)));
    for (let i = 0; i < fn; i++) {                                                                          // fenerler (canlı)
      const fx = x - g * 0.32 + (g * 0.64 * i) / Math.max(1, fn - 1);
      ctx.fillStyle = "#4a3a2a"; ctx.fillRect(fx - 0.6, tenteAlt - 1, 1.2, 1.6);
      canli.push({ tur: "fener", x: fx, y: tenteAlt + 0.5, n: r(), s: fs, renk: renkler[i % 4] });
    }
    return canli;
  }

  // ---------- DZ: Sahra kumulları ----------
  // Altın sarısı kum; sırtları ışıklı, eteği gölgeli dalgalı kumullar ve rüzgâr çizgileri; kuru çalı, iz bırakan sevimli
  // bir çöl tilkisi (büyük kulaklı)
  function fennek(ctx, x, taban, s) {
    elips(ctx, x + 1, taban, s * 0.9, s * 0.22, "rgba(0,0,0,0.25)");
    ctx.strokeStyle = "#e3bd82"; ctx.lineWidth = s * 0.34; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x + s * 0.4, taban - s * 0.3); ctx.quadraticCurveTo(x + s * 1.05, taban - s * 0.25, x + s * 0.95, taban - s * 0.75); ctx.stroke();
    elips(ctx, x + s * 0.95, taban - s * 0.82, s * 0.16, s * 0.18, "#5a3a24");                              // kuyruk ucu
    elips(ctx, x, taban - s * 0.45, s * 0.55, s * 0.48, "#efd09a");
    elips(ctx, x - s * 0.05, taban - s * 0.35, s * 0.3, s * 0.3, "#fbefd8");
    const hx = x - s * 0.12, hy = taban - s * 1.02;
    for (const sx of [-1, 1]) {                                                                             // kocaman kulaklar
      ctx.fillStyle = "#efd09a"; ctx.beginPath(); ctx.moveTo(hx + sx * s * 0.12, hy - s * 0.15); ctx.lineTo(hx + sx * s * 0.62, hy - s * 0.95); ctx.lineTo(hx + sx * s * 0.42, hy + s * 0.05); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#f5b8a0"; ctx.beginPath(); ctx.moveTo(hx + sx * s * 0.2, hy - s * 0.15); ctx.lineTo(hx + sx * s * 0.55, hy - s * 0.75); ctx.lineTo(hx + sx * s * 0.38, hy - s * 0.02); ctx.closePath(); ctx.fill();
    }
    elips(ctx, hx, hy, s * 0.4, s * 0.34, "#efd09a");
    elips(ctx, hx, hy + s * 0.12, s * 0.22, s * 0.16, "#fbefd8");
    elips(ctx, hx, hy + s * 0.04, s * 0.06, s * 0.05, "#2a1a10");
    yuz(ctx, hx, hy - s * 0.04, s * 0.42, false, "#2a1a10");
  }
  function sahraKumullari(ctx, w, h, r, p, B) {
    const kum = "#d9a35a";
    yamaZemin(ctx, B, w, h, r, kum, null);
    kirp(ctx, B, () => {
      const n = Math.max(2, Math.min(4, Math.round(h / 34)));
      for (let j = 0; j < n; j++) {
        const y0 = (h * (j + 0.75)) / (n + 0.25), A = 3 + r() * 4, faz = r() * 6, dalga = 0.03 + r() * 0.02;
        const sirt = (x) => y0 + Math.sin(x * dalga + faz) * A - Math.cos(x * dalga * 0.5 + faz) * A * 0.6;
        const bant = (ust, alt, renk) => { ctx.fillStyle = renk; ctx.beginPath(); for (let x = -2; x <= w + 2; x += 4) ctx.lineTo(x, sirt(x) + ust); for (let x = w + 2; x >= -2; x -= 4) ctx.lineTo(x, sirt(x) + alt); ctx.closePath(); ctx.fill(); };
        bant(-16, 0, acik(kum, 0.14)); bant(0, 9, koyu(kum, 0.2)); bant(9, 14, koyu(kum, 0.08));
        ctx.strokeStyle = acik(kum, 0.45); ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = -2; x <= w + 2; x += 4) ctx.lineTo(x, sirt(x)); ctx.stroke();
        ctx.strokeStyle = koyu(kum, 0.1); ctx.lineWidth = 0.7;                                                  // rüzgâr çizgileri
        for (const dy of [-5, -10]) { ctx.beginPath(); for (let x = 4; x <= w - 4; x += 4) ctx.lineTo(x, sirt(x) + dy + Math.sin(x / 5) * 0.6); ctx.stroke(); }
      }
    });
    const yer = enIyiYer(B, w, h, 24, 24, 6);
    for (const k of icNoktalar(B, w, h, 3, 8, 20, r).filter(disinda(yer, 6))) {                             // kuru çalı
      ctx.strokeStyle = "#7a5a32"; ctx.lineWidth = 1; ctx.beginPath();
      for (let a = -2.6; a <= -0.5; a += 0.42) { ctx.moveTo(k.x, k.y); ctx.lineTo(k.x + Math.cos(a) * 4.5, k.y + Math.sin(a) * 4.5); }
      ctx.stroke(); elips(ctx, k.x + 1, k.y + 0.6, 3, 0.9, "rgba(0,0,0,0.2)");
    }
    if (yer) {
      for (let i = 1; i <= 5; i++) { const ix = yer.x - yer.g * 0.6 - i * 4.5, iy = yer.taban - 1 + Math.sin(i) * 1.5; if (uz(B, ix, iy) < -4) { elips(ctx, ix, iy, 0.9, 0.7, koyu(kum, 0.3)); elips(ctx, ix + 1.5, iy - 1.2, 0.8, 0.6, koyu(kum, 0.3)); } }
      fennek(ctx, yer.x - yer.g * 0.08, yer.taban, yer.g * 0.5);
    }
    return [];
  }

  // ---------- DZ: Tassili n'Ajjer kaya kemerleri (kaya biçimi) ----------
  // Kızıl kumtaşı: tabakalı ön yüz ve üst yüz, çöl cilası izleri, eteklerde kum; üstünde doğal kaya kemeri maketi
  function kayaKemeri(ctx, x, taban, g, b, renk) {
    const ic = g / 2 - g * 0.24;
    elips(ctx, x + 2, taban + 1, g * 0.55, 2.6, "rgba(0,0,0,0.3)");
    elips(ctx, x + 1, taban - 1.5, ic * 0.95, 2.6, "rgba(40, 18, 8, 0.35)");                                 // kemer altı gölge
    const yolu = () => {
      ctx.beginPath(); ctx.moveTo(x - g / 2, taban);
      ctx.bezierCurveTo(x - g / 2 - 2, taban - b * 0.6, x - g * 0.35, taban - b, x, taban - b);
      ctx.bezierCurveTo(x + g * 0.35, taban - b, x + g / 2 + 2, taban - b * 0.6, x + g / 2, taban);
      ctx.lineTo(x + ic, taban); ctx.bezierCurveTo(x + ic, taban - b * 0.5, x + ic * 0.6, taban - b * 0.7, x, taban - b * 0.7);
      ctx.bezierCurveTo(x - ic * 0.6, taban - b * 0.7, x - ic, taban - b * 0.5, x - ic, taban); ctx.closePath();
    };
    const gr = ctx.createLinearGradient(x - g / 2, 0, x + g / 2, 0);
    gr.addColorStop(0, acik(renk, 0.2)); gr.addColorStop(0.55, renk); gr.addColorStop(1, koyu(renk, 0.3));
    yolu(); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); yolu(); ctx.clip();
    ctx.strokeStyle = koyu(renk, 0.22); ctx.lineWidth = 0.9;                                                 // tabakalar
    for (let y = taban - b + 4; y < taban; y += 4.5) { ctx.beginPath(); for (let xx = x - g / 2 - 2; xx <= x + g / 2 + 2; xx += 4) ctx.lineTo(xx, y + Math.sin(xx / 6 + y) * 0.8); ctx.stroke(); }
    ctx.fillStyle = "rgba(40, 18, 8, 0.18)"; for (const f of [-0.42, 0.3, 0.4]) ctx.fillRect(x + f * g, taban - b, 1.6, b);   // çöl cilası
    ctx.restore();
    ctx.strokeStyle = koyu(renk, 0.45); ctx.lineWidth = 1.2; yolu(); ctx.stroke();
  }
  function kayaKemerleri(ctx, w, h, r, p, B) {
    const d = B.derinlik || 0, kaya = "#b8653a";
    doldur(ctx, B, "rgba(0,0,0,0.38)", 2, d + 1);
    cizgi(ctx, B, koyu(kaya, 0.5), 3, 0, d);
    doldur(ctx, B, koyu(kaya, 0.32), 0, d);
    kirp(ctx, B, () => { ctx.strokeStyle = koyu(kaya, 0.45); ctx.lineWidth = 1; for (let y = 3; y < h + d; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 1); ctx.stroke(); } }, 0, d);
    cizgi(ctx, B, koyu(kaya, 0.5), 3);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, acik(kaya, 0.18)); g.addColorStop(1, koyu(kaya, 0.12));
    doldur(ctx, B, g);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(kaya, 0.16); ctx.lineWidth = 1.1;                                               // tabakalar
      for (let y = 5; y < h; y += 7) { ctx.beginPath(); for (let x = 0; x <= w; x += 5) ctx.lineTo(x, y + Math.sin(x / 13 + y) * 1.5); ctx.stroke(); }
      ctx.fillStyle = "rgba(40, 18, 8, 0.14)"; for (let i = 0; i < w / 12; i++) ctx.fillRect(r() * w, 0, 1.2 + r() * 1.5, h);
      for (let i = 0; i < w / 14; i++) elips(ctx, r() * w, h * (0.7 + r() * 0.3), 6 + r() * 6, 2.5 + r() * 2, "#d9a35a");   // kum birikintisi
    });
    const yer = enIyiYer(B, w, h, Math.min(w * 0.62, 84), Math.min(h * 0.62, 60), 5);
    if (yer) {
      kayaKemeri(ctx, yer.x, yer.taban, yer.g, yer.b, karistir(kaya, "#c97b4a", 0.4));
      const kx = yer.x + yer.g * 0.62, kule = yapiSigdir(B, kx, yer.taban, yer.g * 0.16, yer.b * 0.7);    // yanında kaya sütunu
      if (kule) {
        const { g: kg, b: kb } = kule;
        elips(ctx, kx + 1.5, yer.taban + 0.5, kg * 0.7, 1.8, "rgba(0,0,0,0.3)");
        ctx.fillStyle = kaya; ctx.beginPath(); ctx.moveTo(kx - kg / 2, yer.taban); ctx.lineTo(kx - kg * 0.4, yer.taban - kb * 0.8); ctx.lineTo(kx - kg * 0.62, yer.taban - kb);
        ctx.lineTo(kx + kg * 0.62, yer.taban - kb); ctx.lineTo(kx + kg * 0.4, yer.taban - kb * 0.8); ctx.lineTo(kx + kg / 2, yer.taban); ctx.closePath(); ctx.fill();
        ctx.fillStyle = koyu(kaya, 0.25); ctx.fillRect(kx + kg * 0.1, yer.taban - kb * 0.8, kg * 0.32, kb * 0.8);
        ctx.fillStyle = acik(kaya, 0.2); ctx.fillRect(kx - kg * 0.62, yer.taban - kb, kg * 1.24, 1.6);
      }
    }
    return [];
  }

  // ---------- CI: kakao bahçesi ----------
  // Yaprak döküntülü gölgeli toprak; kakao ağaçları: iri yaprak taçları, gövde ve dallarda sarı, turuncu, kırmızı ve
  // yeşil kakao meyveleri (biri gülümser); yerde açılmış bir meyve ve çekirdekleri
  function kakaoMeyvesi(ctx, x, y, s, renk, a, yuzlu) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    elips(ctx, 0.8, 0.8, s * 0.45, s, "rgba(0,0,0,0.25)");
    elips(ctx, 0, 0, s * 0.45, s, renk);
    ctx.strokeStyle = koyu(renk, 0.25); ctx.lineWidth = 0.5; ctx.beginPath();
    for (const f of [-0.25, 0.25]) { ctx.moveTo(f * s * 0.6, -s * 0.9); ctx.quadraticCurveTo(f * s * 1.25, 0, f * s * 0.6, s * 0.9); }
    ctx.moveTo(0, -s * 0.95); ctx.lineTo(0, s * 0.95); ctx.stroke();
    elips(ctx, -s * 0.16, -s * 0.38, s * 0.12, s * 0.3, "rgba(255,255,255,0.3)");
    ctx.fillStyle = "#5a3a1e"; ctx.fillRect(-0.5, -s - 1.5, 1, 1.8);
    if (yuzlu) yuz(ctx, 0, s * 0.05, s * 0.55, false, "#3a2010");
    ctx.restore();
  }
  function kakaoBahcesi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#2f4a22", "#4f7a3a", 800);
    kirp(ctx, B, () => {                                                                                    // yaprak döküntüsü
      for (let i = 0; i < w * h / 160; i++) {
        ctx.save(); ctx.translate(r() * w, r() * h); ctx.rotate(r() * Math.PI);
        ctx.fillStyle = ["#6b5a2a", "#8a6a2a", "#4f6a2a", "#7a4a22"][Math.floor(r() * 4)]; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    });
    const renkler = ["#e8a33d", "#d0602a", "#b8452a", "#8fae3a"];
    const n = Math.max(1, Math.min(3, Math.round(w * h / 5200)));
    const yerler = icNoktalar(B, w, h, n, 15, 34, r).map((k) => ({ ...k, bos: ustBosluk(B, k.x, k.y) }));
    let gulen = false;
    for (const k of yerler) {
      const boy = Math.max(18, Math.min(50, k.bos + 4)), x = k.x, taban = k.y + 6;
      const tac = Math.min(16, boy * 0.4 + 3), ty = taban - boy + tac * 0.9;
      elips(ctx, x + 2, taban, tac * 0.9, tac * 0.3, "rgba(0,0,0,0.28)");
      ctx.strokeStyle = "#5a3a22"; ctx.lineCap = "round";
      ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(x, taban); ctx.quadraticCurveTo(x + 2.5, (taban + ty) / 2, x, ty + 3); ctx.stroke();
      ctx.lineWidth = 1.8;
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, ty + tac * 0.5); ctx.quadraticCurveTo(x + sx * 4, ty + 3, x + sx * tac * 0.75, ty); ctx.stroke(); }
      for (const sx of [-1, 1]) {                                                                           // tacın altından sarkan iri yapraklar
        for (const k of [0.45, 0.85]) {
          ctx.save(); ctx.translate(x + sx * tac * k, ty + tac * 0.42); ctx.rotate(sx * (0.5 + k * 0.6));
          ctx.fillStyle = k > 0.6 ? "#2f6a2a" : "#3a7a30"; ctx.beginPath(); ctx.ellipse(0, tac * 0.22, tac * 0.13, tac * 0.3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(200, 230, 150, 0.35)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, tac * 0.48); ctx.stroke();
          ctx.restore();
        }
      }
      for (let i = 0; i < 11; i++) {                                                                        // yoğun kubbe taç: yaprak öbekleri
        const a = Math.PI + (i / 10) * Math.PI, R = tac * (0.36 + r() * 0.1), ic = i === 10;
        const bx = ic ? x : x + Math.cos(a) * tac * 0.62, by = ic ? ty - tac * 0.05 : ty + 2 + Math.sin(a) * tac * 0.52;
        elips(ctx, bx + 0.8, by + 1.4, R, R * 0.85, "#1f4a20");
        elips(ctx, bx, by, R, R * 0.85, ["#2f6a2a", "#3f8034", "#357a30"][i % 3]);
        elips(ctx, bx - R * 0.3, by - R * 0.3, R * 0.35, R * 0.25, "rgba(190, 230, 140, 0.18)");
      }
      ctx.strokeStyle = "rgba(15, 40, 15, 0.45)"; ctx.lineWidth = 0.6; ctx.beginPath();                          // yaprak damarları
      for (let i = 0; i < 6; i++) { const lx = x + (r() - 0.5) * tac * 1.2, ly = ty + (r() - 0.6) * tac * 0.6; ctx.moveTo(lx - 2, ly + 1); ctx.lineTo(lx + 2, ly - 1); }
      ctx.stroke();
      const mn = Math.max(1, Math.min(4, Math.floor((taban - ty - tac * 0.6) / 7)));                       // gövdedeki meyveler
      for (let i = 0; i < mn; i++) {
        const my = ty + tac * 0.62 + 4 + i * 7, sx = i % 2 ? 1 : -1;
        if (my > taban - 4) break;
        kakaoMeyvesi(ctx, x + sx * 3.4, my, 3.8, renkler[(i + Math.floor(x)) % 4], sx * 0.35, !gulen && i === 0 && boy > 28);
        if (i === 0 && boy > 28) gulen = true;
      }
    }
    const ac = icNoktalar(B, w, h, 1, 10, 10, r).filter((k) => yerler.every((t) => Math.hypot(t.x - k.x, t.y + 3 - k.y) > 12))[0];
    if (ac && w * h > 7000) {                                                                               // açılmış meyve
      elips(ctx, ac.x + 1, ac.y + 1.2, 5.5, 2, "rgba(0,0,0,0.25)");
      elips(ctx, ac.x, ac.y, 5, 2.6, "#d0602a"); elips(ctx, ac.x, ac.y - 0.3, 4, 1.8, "#f4ecd8");
      for (let i = 0; i < 5; i++) elips(ctx, ac.x - 3 + i * 1.5, ac.y - 0.3 + (i % 2) * 0.6, 0.8, 0.6, "#8a5a3a");
    }
    return [];
  }

  // ---------- CI: fil ailesi ----------
  // Çimenli orman kıyısı ve çalılar; yandan sevimli Afrika filleri: büyük kulaklar, kıvrık hortum, gülümseyen gözler;
  // anne, baba ve yavru (dar yamada anne ile yavru)
  function fil(ctx, x, taban, s, yavru) {
    const gri = yavru ? "#a3a8ae" : "#8b9097", koyuG = koyu(gri, 0.22), ac = acik(gri, 0.18);
    ctx.save(); ctx.translate(x, taban);
    elips(ctx, 0, 0.5, s * 1.05, s * 0.16, "rgba(0,0,0,0.25)");
    ctx.fillStyle = koyuG; for (const bx of [-0.62, 0.22]) { yuvarlak(ctx, bx * s, -s * 0.62, s * 0.26, s * 0.62, s * 0.1); ctx.fill(); }   // arka bacaklar
    ctx.strokeStyle = koyuG; ctx.lineWidth = Math.max(0.8, s * 0.06); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-s * 0.86, -s * 0.95); ctx.quadraticCurveTo(-s * 1.05, -s * 0.72, -s * 0.98, -s * 0.5); ctx.stroke();
    elips(ctx, -s * 0.1, -s * 0.95, s * 0.8, s * 0.52, gri);                                                 // gövde
    elips(ctx, -s * 0.28, -s * 1.22, s * 0.48, s * 0.17, ac);
    ctx.fillStyle = gri; for (const bx of [-0.46, 0.38]) { yuvarlak(ctx, bx * s, -s * 0.62, s * 0.26, s * 0.62, s * 0.1); ctx.fill(); }   // ön bacaklar
    for (const bx of [-0.46, 0.38]) for (let i = 0; i < 3; i++) elips(ctx, (bx + 0.05 + i * 0.08) * s, -s * 0.04, s * 0.032, s * 0.026, "#ece7dc");
    const hx = s * 0.6, hy = -s * 1.12;
    elips(ctx, hx - s * 0.2, hy + s * 0.04, s * 0.36, s * 0.46, koyuG);                                      // kulak
    elips(ctx, hx - s * 0.2, hy + s * 0.06, s * 0.25, s * 0.35, "#c9a7a3");
    elips(ctx, hx, hy, s * 0.4, s * 0.38, gri);                                                              // baş
    ctx.strokeStyle = gri; ctx.lineWidth = s * 0.2;                                                          // hortum
    ctx.beginPath(); ctx.moveTo(hx + s * 0.26, hy + s * 0.08); ctx.quadraticCurveTo(hx + s * 0.52, hy + s * 0.5, hx + s * 0.42, hy + s * 0.76);
    ctx.quadraticCurveTo(hx + s * 0.38, hy + s * 0.9, hx + s * 0.52, hy + s * 0.9); ctx.stroke();
    ctx.strokeStyle = koyuG; ctx.lineWidth = 0.6; ctx.beginPath();
    for (const t of [0.3, 0.45, 0.6]) { const yy = hy + s * t * 1.1; ctx.moveTo(hx + s * 0.36, yy); ctx.lineTo(hx + s * 0.5, yy + s * 0.02); }
    ctx.stroke();
    if (!yavru) { ctx.strokeStyle = "#f4efe2"; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(hx + s * 0.2, hy + s * 0.28); ctx.quadraticCurveTo(hx + s * 0.34, hy + s * 0.48, hx + s * 0.48, hy + s * 0.42); ctx.stroke(); }
    elips(ctx, hx + s * 0.1, hy - s * 0.08, s * 0.065, s * 0.075, "#1f2328"); elips(ctx, hx + s * 0.12, hy - s * 0.11, s * 0.022, s * 0.022, "#ffffff");
    ctx.strokeStyle = "#3a3f46"; ctx.lineWidth = Math.max(0.6, s * 0.035); ctx.beginPath(); ctx.arc(hx + s * 0.16, hy + s * 0.12, s * 0.08, 0.1 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    elips(ctx, hx - s * 0.04, hy + s * 0.08, s * 0.07, s * 0.045, "rgba(240, 150, 150, 0.45)");
    ctx.restore();
  }
  function filAilesi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#4f6b2a", "#7fa04a", 600);
    // önce baba, anne, yavru (genişlik 4,35 s, yükseklik 1,85 s); sığmazsa anne ve yavru (3,3 s × 1,7 s)
    let yer = enIyiYer(B, w, h, Math.min(w * 0.9, 31 * 4.35), Math.min(h * 0.82, 31 * 1.85), 5), uclu = !!yer && yer.g / 4.35 >= 10;
    if (!uclu) yer = enIyiYer(B, w, h, Math.min(w * 0.9, 31 * 3.3), Math.min(h * 0.82, 31 * 1.7), 5);
    for (const k of icNoktalar(B, w, h, 6, 9, 16, r).filter(disinda(yer, 2))) {                             // çalılar
      for (const [dx, dy, rr] of [[-2.5, 0, 3.4], [2.5, 0.3, 3.2], [0, -2, 3.6]]) elips(ctx, k.x + dx, k.y + dy, rr, rr * 0.8, karistir("#3f7a2a", "#000000", r() * 0.25));
      elips(ctx, k.x - 1, k.y - 3, 1.6, 1.1, "rgba(255,255,255,0.15)");
    }
    if (!yer) return [];
    const s = yer.g / (uclu ? 4.35 : 3.3), sol = yer.x - yer.g / 2;
    if (uclu) fil(ctx, sol + s * 2.27 - s * 1.3, yer.taban - s * 0.2, s * 0.92, false);
    const ax = uclu ? sol + s * 2.27 : sol + s * 1.05;
    fil(ctx, ax, yer.taban, s, false);
    fil(ctx, ax + s * 1.45, yer.taban + 0.5, s * 0.56, true);
    return [];
  }

  // ---------- GH: kente dokuma tezgâhı ----------
  // Sıkıştırılmış toprak; ahşap dar şerit tezgâhı (direkler, makara, gücü çerçevesi, çözgü ipleri, göğüs kirişi), tezgâhtan
  // yere uzanan altın-yeşil-kırmızı-siyah geometrik kente şeridi; yanda katlı kente yığını ve iplik makaraları
  const KENTE = ["#e3b021", "#2f7a3b", "#c8302a", "#1f1a14"];
  function kenteSeridi(ctx, x0, y0, en, boy) {
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, en, boy); ctx.clip();
    for (let y = y0, i = 0; y < y0 + boy; y += en * 1.3, i++) {
      const L = en * 1.3, tur = i % 3;
      ctx.fillStyle = [KENTE[0], KENTE[3], KENTE[1]][tur]; ctx.fillRect(x0, y, en, L);
      if (tur === 0) { ctx.fillStyle = KENTE[1]; ctx.fillRect(x0, y + L * 0.2, en, L * 0.12); ctx.fillStyle = KENTE[2]; ctx.fillRect(x0, y + L * 0.45, en, L * 0.12); ctx.fillStyle = KENTE[1]; ctx.fillRect(x0, y + L * 0.7, en, L * 0.12); }
      else if (tur === 1) { ctx.fillStyle = KENTE[0]; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if ((a + b) % 2 === 0) ctx.fillRect(x0 + (a * en) / 2, y + (b * L) / 2, en / 2, L / 2); }
      else { ctx.strokeStyle = KENTE[0]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y + L * 0.5); for (let k = 1; k <= 4; k++) ctx.lineTo(x0 + (k * en) / 4, y + L * (k % 2 ? 0.25 : 0.5)); ctx.stroke(); ctx.fillStyle = KENTE[2]; ctx.fillRect(x0, y + L * 0.78, en, L * 0.1); }
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 0.6; ctx.strokeRect(x0, y0, en, boy);
  }
  function kenteTezgahi(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#7a5232", "#8a7a3a", 900);
    const yer = enIyiYer(B, w, h, Math.min(w * 0.82, 92), Math.min(h * 0.82, 84), 5);
    if (!yer) return [];
    const { g, b, x, taban } = yer, ust = taban - b, ahsap = "#7a5230";
    const lx = x - g * 0.17, lw = g * 0.46, alt = ust + b * 0.5, sw = lw * 0.48;
    elips(ctx, lx + 2, alt + 1, lw * 0.6, 3, "rgba(0,0,0,0.3)");
    kenteSeridi(ctx, lx - sw / 2, alt - 1, sw, taban - alt - 1);                                               // yere uzanan şerit
    ctx.strokeStyle = koyu(ahsap, 0.2); ctx.lineWidth = 2; ctx.lineCap = "round";                            // arka direkler
    for (const sx of [-0.38, 0.38]) { ctx.beginPath(); ctx.moveTo(lx + sx * lw, ust + 3); ctx.lineTo(lx + sx * lw, alt - b * 0.1); ctx.stroke(); }
    ctx.strokeStyle = "#efe2c4"; ctx.lineWidth = 0.45; ctx.beginPath();                                       // çözgü ipleri
    for (let i = 0; i <= 8; i++) { ctx.moveTo(lx - lw * 0.32 + (i * lw * 0.64) / 8, ust + 6); ctx.lineTo(lx - sw / 2 + (i * sw) / 8, alt - 1); }
    ctx.stroke();
    ctx.strokeStyle = ahsap; ctx.lineWidth = 2.4;                                                            // ön direkler ve üst kiriş
    for (const sx of [-0.5, 0.5]) { ctx.beginPath(); ctx.moveTo(lx + sx * lw, ust + 5); ctx.lineTo(lx + sx * lw, alt + 1); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(lx - lw * 0.52, ust + 5); ctx.lineTo(lx + lw * 0.52, ust + 5); ctx.stroke();
    elips(ctx, lx, ust + 3.2, 2.4, 2.4, "#8a6238"); elips(ctx, lx, ust + 3.2, 0.9, 0.9, ahsap);                   // makara
    for (const t of [0.42, 0.52]) {                                                                          // gücü çerçeveleri
      const yy = ust + (alt - ust) * t;
      ctx.strokeStyle = "#8a6238"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(lx - lw * 0.34, yy); ctx.lineTo(lx + lw * 0.34, yy); ctx.stroke();
    }
    ctx.strokeStyle = ahsap; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx - lw * 0.5, alt); ctx.lineTo(lx + lw * 0.5, alt); ctx.stroke();   // göğüs kirişi
    for (const sx of [-0.18, 0.18]) { ctx.fillStyle = "#8a6238"; ctx.fillRect(lx + sx * lw - 2, alt + 2.5, 4, 2); }                            // ayaklıklar
    const yx = x + g * 0.26, yw = g * 0.36;                                                                  // katlı kente yığını
    for (let i = 0; i < 3; i++) {
      const yy = taban - 6 - i * 5.5;
      elips(ctx, yx + 1.5, yy + 5.5, yw * 0.55, 1.6, "rgba(0,0,0,0.2)");
      ctx.fillStyle = KENTE[(i * 2) % 4]; ctx.fillRect(yx - yw / 2, yy, yw, 5);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = KENTE[(i + k + 1) % 4]; ctx.fillRect(yx - yw / 2 + (k + 0.3) * (yw / 4), yy, yw / 10, 5); }
      ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 0.5; ctx.strokeRect(yx - yw / 2, yy, yw, 5);
    }
    for (let i = 0; i < 3; i++) {                                                                            // iplik makaraları
      const mx = yx - yw * 0.3 + i * yw * 0.3, my = ust + b * 0.3;
      ctx.fillStyle = "#c9a46a"; ctx.fillRect(mx - 2.6, my - 5, 5.2, 1.2); ctx.fillRect(mx - 2.6, my, 5.2, 1.2);
      ctx.fillStyle = KENTE[i]; ctx.fillRect(mx - 2, my - 3.8, 4, 3.8);
    }
    return [];
  }

  // ---------- GH: Kakum kanopi köprüsü ----------
  // Yukarıdan yağmur ormanı tepesi: yaprak dokusu, ağaç taçları; taçlardaki yuvarlak ahşap platformları birbirine bağlayan
  // halat korkuluklu asma köprüler; bir taçta boynuzgaga kuşu
  function asmaKopru(ctx, a, c) {
    const dx = c.x - a.x, dy = c.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux, en = 2.8;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = en * 2 + 2; ctx.beginPath(); ctx.moveTo(a.x + 2, a.y + 2.5); ctx.lineTo(c.x + 2, c.y + 2.5); ctx.stroke();
    ctx.strokeStyle = "#a07a46"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let t = 6; t < L - 6; t += 2.6) { const X = a.x + ux * t, Y = a.y + uy * t; ctx.moveTo(X - px * en, Y - py * en); ctx.lineTo(X + px * en, Y + py * en); }
    ctx.stroke();
    ctx.strokeStyle = "#e3d2a2"; ctx.lineWidth = 0.6; ctx.beginPath();                                       // ağ
    for (let t = 6, k = 0; t < L - 8; t += 4, k++) for (const sx of [-1, 1]) { const X = a.x + ux * t, Y = a.y + uy * t; ctx.moveTo(X + px * en * sx, Y + py * en * sx); ctx.lineTo(X + ux * 4 + px * en * sx * 1.25, Y + uy * 4 + py * en * sx * 1.25); }
    ctx.stroke();
    ctx.strokeStyle = "#efe2c4"; ctx.lineWidth = 0.9; ctx.beginPath();                                        // halat korkuluklar
    for (const sx of [-1.25, 1.25]) { ctx.moveTo(a.x + px * en * sx, a.y + py * en * sx); ctx.lineTo(c.x + px * en * sx, c.y + py * en * sx); }
    ctx.stroke();
  }
  function kanopiKoprusu(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#1f4a26", null);
    kirp(ctx, B, () => { for (let i = 0; i < w * h / 50; i++) elips(ctx, r() * w, r() * h, 2 + r() * 2.5, 1.6 + r() * 1.8, ["#2a6a30", "#3f8a3a", "#1f5428", "#4f9a3f"][Math.floor(r() * 4)]); });
    let agac = icNoktalar(B, w, h, Math.max(2, Math.min(4, Math.round(w * h / 4200))), 14, Math.min(w, h) * 0.36, r);
    if (agac.length < 2) agac = icNoktalar(B, w, h, 2, 12, 18, r);
    agac.sort((a, c) => a.x - c.x);
    for (let i = 0; i + 1 < agac.length; i++) {
      const a = agac[i], c = agac[i + 1], L = Math.hypot(c.x - a.x, c.y - a.y);
      let ic = true; for (let t = 0; t <= 1; t += 0.1) if (uz(B, a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t) > -5) ic = false;
      if (ic && L > 16) asmaKopru(ctx, a, c);
    }
    for (const k of agac) {                                                                                  // taçlar ve platformlar
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, R = 3.6 + r() * 1.4; elips(ctx, k.x + Math.cos(a) * 8, k.y + Math.sin(a) * 7 + 1, R, R * 0.85, ["#3f8a3a", "#4f9a3f", "#2f7a34"][i % 3]); }
      elips(ctx, k.x + 1, k.y + 1.5, 6, 5.2, "rgba(0,0,0,0.3)");
      elips(ctx, k.x, k.y, 6, 5.2, "#8a6238");
      ctx.strokeStyle = "#5a3a1e"; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) { ctx.moveTo(k.x + Math.cos(a) * 2.2, k.y + Math.sin(a) * 1.9); ctx.lineTo(k.x + Math.cos(a) * 6, k.y + Math.sin(a) * 5.2); }
      ctx.stroke();
      ctx.strokeStyle = "#efe2c4"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(k.x, k.y, 6.2, 5.4, 0, 0, Math.PI * 2); ctx.stroke();
      elips(ctx, k.x, k.y, 2.2, 1.9, "#4a2e16");
    }
    const kus = agac[agac.length - 1];                                                                       // boynuzgaga
    if (kus && w * h > 7000) {
      const bx = kus.x + 8, by = kus.y - 6;
      if (uz(B, bx + 5, by - 3) < -3) {
        elips(ctx, bx, by, 3.2, 2.2, "#1f2328"); elips(ctx, bx - 2.5, by + 0.5, 2.2, 1, "#f4f1ea");
        elips(ctx, bx + 2.6, by - 1.6, 1.6, 1.5, "#1f2328");
        ctx.fillStyle = "#e3b021"; ctx.beginPath(); ctx.moveTo(bx + 3.6, by - 2.4); ctx.quadraticCurveTo(bx + 7.5, by - 2.2, bx + 7.2, by - 0.6); ctx.lineTo(bx + 3.8, by - 1); ctx.closePath(); ctx.fill();
        elips(ctx, bx + 2.8, by - 1.9, 0.4, 0.4, "#ffffff");
      }
    }
    return [];
  }

  // ---------- NG: Zuma Kayası (kaya biçimi) ----------
  // Gri granit tek kaya: dikey yağmur izleri, açık liken lekeleri, eteğinde yeşil çalılar; gövdesinde ünlü "yüz" — burada
  // sevimli, gülümseyen bir yüz
  function zumaKayasi(ctx, w, h, r, p, B) {
    const d = B.derinlik || 0, tas = p.vurgu1 || "#7a7f87", govde = B[0];
    doldur(ctx, B, "rgba(0,0,0,0.38)", 2, d + 1);
    cizgi(ctx, B, koyu(tas, 0.5), 3, 0, d);
    doldur(ctx, B, koyu(tas, 0.3), 0, d);
    kirp(ctx, B, () => { ctx.strokeStyle = "rgba(20, 20, 25, 0.25)"; ctx.lineWidth = 1.3; ctx.beginPath(); for (let i = 0; i < w / 5; i++) { const x = r() * w; ctx.moveTo(x, 0); ctx.lineTo(x + 0.5, h + d); } ctx.stroke(); }, 0, d);
    cizgi(ctx, B, koyu(tas, 0.5), 3);
    const g = ctx.createLinearGradient(0, 0, w * 0.6, h); g.addColorStop(0, acik(tas, 0.25)); g.addColorStop(1, koyu(tas, 0.1));
    doldur(ctx, B, g);
    kirp(ctx, B, () => {
      ctx.strokeStyle = "rgba(25, 25, 30, 0.2)"; ctx.lineWidth = 1.5;                                          // yağmur izleri
      for (let i = 0; i < w / 6; i++) { const x = r() * w, y0 = r() * h * 0.4; ctx.beginPath(); for (let y = y0; y < h; y += 4) ctx.lineTo(x + Math.sin(y / 9 + x) * 1.2, y); ctx.stroke(); }
      for (let i = 0; i < w * h / 500; i++) elips(ctx, r() * w, r() * h, 1.5 + r() * 2.5, 1 + r() * 1.5, "rgba(220, 225, 200, 0.18)");   // liken
      for (let i = 0; i < w / 10; i++) elips(ctx, r() * w, r() * h * 0.3, 2.5 + r() * 2, 1.6 + r(), "rgba(90, 140, 70, 0.55)");          // tepede yeşillik
    });
    for (const k of kenarNoktalari(B, 7, -1)) if (k.ny > 0.55) {                                             // etekte çalılar
      for (const [dx, rr] of [[-1.8, 2.6], [1.8, 2.4], [0, 3]]) elips(ctx, k.x + dx, k.y + d - 1, rr, rr * 0.8, karistir("#3f7a2a", "#000000", r() * 0.3));
    }
    const fs = Math.min(govde.rx, govde.ry) * 0.85, fx = govde.x, fy = govde.y;                              // sevimli yüz
    for (const sx of [-1, 1]) {
      elips(ctx, fx + sx * fs * 0.36, fy - fs * 0.12, fs * 0.13, fs * 0.17, koyu(tas, 0.55));
      elips(ctx, fx + sx * fs * 0.36 - fs * 0.04, fy - fs * 0.18, fs * 0.04, fs * 0.05, "rgba(255,255,255,0.7)");
      ctx.strokeStyle = koyu(tas, 0.45); ctx.lineWidth = Math.max(0.8, fs * 0.05); ctx.beginPath(); ctx.arc(fx + sx * fs * 0.36, fy - fs * 0.34, fs * 0.14, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();   // kaşlar
    }
    ctx.strokeStyle = koyu(tas, 0.35); ctx.lineWidth = Math.max(0.8, fs * 0.06); ctx.beginPath(); ctx.moveTo(fx, fy - fs * 0.05); ctx.lineTo(fx - fs * 0.05, fy + fs * 0.18); ctx.lineTo(fx + fs * 0.04, fy + fs * 0.2); ctx.stroke();   // burun
    ctx.strokeStyle = koyu(tas, 0.55); ctx.lineWidth = Math.max(1, fs * 0.07); ctx.beginPath(); ctx.arc(fx, fy + fs * 0.2, fs * 0.28, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();   // gülümseme
    for (const sx of [-1, 1]) elips(ctx, fx + sx * fs * 0.55, fy + fs * 0.2, fs * 0.12, fs * 0.07, "rgba(230, 150, 140, 0.35)");
    return [];
  }

  // ---------- NG: konuşan davullar ----------
  // Toprak avlu, renkli kenarlı hasır; kum saati biçimli dundun davulları (deri kafalar, germe ipleri, renkli bel bandı;
  // biri gülümser), yanlarında kıvrık tokmaklar
  function konusanDavul(ctx, x, taban, s, bant, yuzlu) {
    const rx = s * 0.33, bel = s * 0.15, ust = taban - s, ky = rx * 0.3;
    elips(ctx, x + 1.5, taban + 0.5, rx * 1.15, rx * 0.35, "rgba(0,0,0,0.28)");
    ctx.fillStyle = "#8a5a2b"; ctx.beginPath(); ctx.moveTo(x - rx, ust + ky); ctx.quadraticCurveTo(x - bel, taban - s / 2, x - rx, taban - ky);
    ctx.lineTo(x + rx, taban - ky); ctx.quadraticCurveTo(x + bel, taban - s / 2, x + rx, ust + ky); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.moveTo(x + rx * 0.3, ust + ky); ctx.quadraticCurveTo(x + bel * 0.4, taban - s / 2, x + rx * 0.3, taban - ky);
    ctx.lineTo(x + rx, taban - ky); ctx.quadraticCurveTo(x + bel, taban - s / 2, x + rx, ust + ky); ctx.closePath(); ctx.fill();
    elips(ctx, x, taban - ky, rx, ky, "#c9a46a");
    ctx.strokeStyle = "#e9dcc0"; ctx.lineWidth = 0.55; ctx.beginPath();                                      // germe ipleri
    for (let i = -5; i <= 5; i++) { const f = i / 5; ctx.moveTo(x + f * rx * 0.95, ust + ky); ctx.quadraticCurveTo(x + f * bel, taban - s / 2, x + f * rx * 0.95, taban - ky); }
    ctx.stroke();
    ctx.fillStyle = bant; ctx.fillRect(x - bel - 1.6, taban - s / 2 - s * 0.06, (bel + 1.6) * 2, s * 0.12);
    ctx.fillStyle = "#f4f1ea"; for (let i = 0; i < 3; i++) ctx.fillRect(x - bel - 1 + i * (bel + 0.6), taban - s / 2 - s * 0.015, 1.2, s * 0.03);
    elips(ctx, x, ust + ky, rx, ky, "#5a3a1e"); elips(ctx, x, ust + ky, rx * 0.88, ky * 0.82, "#e8d2a0");          // üst kafa
    elips(ctx, x - rx * 0.25, ust + ky - ky * 0.2, rx * 0.3, ky * 0.3, "rgba(255,255,255,0.3)");
    if (yuzlu) yuz(ctx, x, ust + s * 0.3, s * 0.2, false, "#2a1a10");
  }
  function tokmak(ctx, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0.8, 1); ctx.lineTo(s + 0.8, 1); ctx.quadraticCurveTo(s * 1.25 + 0.8, 1, s * 1.25 + 0.8, -s * 0.25 + 1); ctx.stroke();
    ctx.strokeStyle = "#6b4226"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s, 0); ctx.quadraticCurveTo(s * 1.25, 0, s * 1.25, -s * 0.25); ctx.stroke();
    ctx.restore();
  }
  function konusanDavullar(ctx, w, h, r, p, B) {
    yamaZemin(ctx, B, w, h, r, "#7a4a2c", "#8a7a3a", 900);
    const yer = enIyiYer(B, w, h, Math.min(w * 0.85, 96), Math.min(h * 0.7, 54), 5);
    if (!yer) return [];
    const { g, b, x, taban } = yer, hy = taban - b * 0.36, hasir = "#cfa862";
    ctx.fillStyle = "rgba(0,0,0,0.25)"; yuvarlak(ctx, x - g / 2 + 2, hy + 2, g, taban - hy, 4); ctx.fill();          // hasır
    ctx.fillStyle = p.vurgu2 || "#c9a15b"; yuvarlak(ctx, x - g / 2, hy, g, taban - hy, 4); ctx.fill();
    ctx.fillStyle = hasir; ctx.fillRect(x - g / 2 + 2.5, hy + 2.5, g - 5, taban - hy - 5);
    ctx.strokeStyle = koyu(hasir, 0.2); ctx.lineWidth = 0.6; ctx.beginPath();
    for (let xx = x - g / 2 + 4; xx < x + g / 2 - 3; xx += 3) { ctx.moveTo(xx, hy + 2.5); ctx.lineTo(xx, taban - 2.5); }
    for (let yy = hy + 4, k = 0; yy < taban - 3; yy += 3, k++) for (let xx = x - g / 2 + 4 + (k % 2) * 3; xx < x + g / 2 - 4; xx += 6) { ctx.moveTo(xx, yy); ctx.lineTo(xx + 3, yy); }
    ctx.stroke();
    ctx.fillStyle = "#2f6f9f"; for (let xx = x - g / 2 + 4; xx < x + g / 2 - 4; xx += 8) { ctx.fillRect(xx, hy + 0.6, 4, 1.4); ctx.fillRect(xx + 4, taban - 2, 4, 1.4); }
    const n = g > 60 ? 3 : 2, bantlar = ["#c8302a", "#2f6f9f", "#e3b021"], boylar = [0.95, 0.74, 0.62];
    for (let i = 0; i < n; i++) {
      const dx = x - g * 0.3 + (g * 0.6 * i) / Math.max(1, n - 1), s = b * boylar[i] - 2, tb = taban - 3 - (i % 2) * 2;
      konusanDavul(ctx, dx, tb, s, bantlar[i], i === 1 || n === 2 && i === 0);
    }
    tokmak(ctx, x - g * 0.18, taban - 4, Math.min(10, g * 0.12), -0.15);
    tokmak(ctx, x + g * 0.1, taban - 5, Math.min(10, g * 0.12), 0.2);
    return [];
  }

  // ---------- SD: Meroe piramitleri ----------
  // Kum ve kumul çizgileri; dik yamaçlı, küçük kumtaşı piramitler sıra sıra (bazılarının tepesi kırık), aydınlık ve gölgeli
  // yüzler, basamak sıraları; çevrede akasya çalıları
  function piramit(ctx, x, taban, g, b, renk, kesik, basamak = true) {
    const ust = taban - b, tepe = kesik ? g * 0.09 : 0, ayrim = x + g * 0.16;
    ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.moveTo(ayrim, taban); ctx.lineTo(x + g / 2 + b * 0.32, taban + 1); ctx.lineTo(x + g * 0.05 + tepe, ust); ctx.closePath(); ctx.fill();
    const yuzey = (px0, py, pts, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(px0, py); for (const [a, bb] of pts) ctx.lineTo(a, bb); ctx.closePath(); ctx.fill(); };
    yuzey(x - g / 2, taban, [[x + g * 0.05 - tepe, ust], [x + g * 0.05 + tepe, ust], [ayrim, taban]], acik(renk, 0.12));
    yuzey(ayrim, taban, [[x + g * 0.05 + tepe, ust], [x + g / 2, taban]], koyu(renk, 0.25));
    if (basamak) {
      ctx.save(); ctx.beginPath(); ctx.moveTo(x - g / 2, taban); ctx.lineTo(x + g * 0.05 - tepe, ust); ctx.lineTo(x + g * 0.05 + tepe, ust); ctx.lineTo(x + g / 2, taban); ctx.closePath(); ctx.clip();
      ctx.strokeStyle = "rgba(60, 35, 15, 0.3)"; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let y = taban - 3; y > ust; y -= 3) { ctx.moveTo(x - g / 2, y); ctx.lineTo(x + g / 2, y); }
      ctx.stroke(); ctx.restore();
    }
    if (kesik) { ctx.fillStyle = acik(renk, 0.3); ctx.fillRect(x + g * 0.05 - tepe, ust - 0.6, tepe * 2, 1.4); }
  }
  function akasya(ctx, x, y, s) {
    ctx.strokeStyle = "#5a3a22"; ctx.lineWidth = 1.2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s * 0.6); ctx.moveTo(x, y - s * 0.4); ctx.lineTo(x - s * 0.4, y - s * 0.75); ctx.moveTo(x, y - s * 0.45); ctx.lineTo(x + s * 0.4, y - s * 0.78); ctx.stroke();
    elips(ctx, x, y - s * 0.85, s * 0.75, s * 0.2, "#5f7a2a"); elips(ctx, x - s * 0.2, y - s * 0.92, s * 0.4, s * 0.1, "#7a9a3a");
  }
  function meroePiramitleri(ctx, w, h, r, p, B) {
    const kum = "#c99a5a";
    kumZemin(ctx, B, w, h, r, kum);
    const yer = enIyiYer(B, w, h, Math.min(w * 0.9, 7 * 18), Math.min(h * 0.72, 50), 5);
    for (const k of icNoktalar(B, w, h, 3, 10, 22, r).filter(disinda(yer, 4))) { const s = Math.min(12, ustBosluk(B, k.x, k.y) - 2); if (s > 6) akasya(ctx, k.x, k.y, s); }
    if (!yer) return [];
    const n = Math.max(2, Math.min(7, Math.round(yer.g / 17))), aralik = yer.g / n, tas = karistir(p.duvar || "#c08d55", "#8a5a3a", 0.35);
    if (yer.b > 34) for (let i = 0; i < n - 1; i++) {                                                         // arka sıra
      const pg = aralik * 0.78, pb = Math.min(yer.b * 0.55, pg * 1.6);
      piramit(ctx, yer.x - yer.g / 2 + aralik * (i + 1), yer.taban - yer.b * 0.4, pg, pb, koyu(tas, 0.06), i % 3 === 1, false);
    }
    for (let i = 0; i < n; i++) {                                                                            // ön sıra
      const pg = aralik * 0.92, pb = Math.min(yer.b * (0.82 + ((i * 37) % 10) / 55), pg * 1.7);
      piramit(ctx, yer.x - yer.g / 2 + aralik * (i + 0.5), yer.taban, pg, pb, tas, i % 3 === 2);
    }
    return [];
  }

  // ---------- SD: deve pazarı ----------
  // Kum meydan; bağlama direkleri arasında gerili ip, ipe bağlı sevimli tek hörgüçlü develer (renkli eyer örtüleri),
  // önlerinde saman yemi yığını, yem çuvalı ve su yalağı
  function deve(ctx, x, taban, s, renk, ortu) {
    const koyuD = koyu(renk, 0.22);
    ctx.save(); ctx.translate(x, taban);
    elips(ctx, 0, 0.5, s * 0.9, s * 0.14, "rgba(0,0,0,0.25)");
    ctx.lineCap = "round"; ctx.lineWidth = s * 0.1;
    ctx.strokeStyle = koyuD; ctx.beginPath(); for (const bx of [-0.48, 0.32]) { ctx.moveTo(bx * s, -s * 1.1); ctx.lineTo(bx * s + s * 0.04, -s * 0.55); ctx.lineTo(bx * s, 0); } ctx.stroke();
    ctx.strokeStyle = renk; ctx.beginPath(); for (const bx of [-0.34, 0.46]) { ctx.moveTo(bx * s, -s * 1.1); ctx.lineTo(bx * s + s * 0.04, -s * 0.55); ctx.lineTo(bx * s, 0); } ctx.stroke();
    for (const bx of [-0.34, 0.46]) elips(ctx, bx * s + s * 0.04, -s * 0.55, s * 0.065, s * 0.06, koyuD);
    ctx.strokeStyle = koyuD; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 1.3); ctx.quadraticCurveTo(-s * 0.78, -s * 1.05, -s * 0.72, -s * 0.85); ctx.stroke();
    elips(ctx, 0, -s * 1.25, s * 0.62, s * 0.3, renk);                                                        // gövde ve hörgüç
    elips(ctx, -s * 0.06, -s * 1.5, s * 0.32, s * 0.27, renk);
    elips(ctx, -s * 0.14, -s * 1.62, s * 0.16, s * 0.08, acik(renk, 0.25));
    if (ortu) {                                                                                               // eyer örtüsü
      ctx.fillStyle = ortu; ctx.beginPath(); ctx.moveTo(-s * 0.36, -s * 1.42); ctx.quadraticCurveTo(-s * 0.06, -s * 1.85, s * 0.26, -s * 1.42); ctx.lineTo(s * 0.2, -s * 1.12); ctx.lineTo(-s * 0.3, -s * 1.12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#f4f1ea"; ctx.fillRect(-s * 0.3, -s * 1.2, s * 0.5, s * 0.05);
      for (let i = 0; i < 4; i++) elips(ctx, -s * 0.26 + i * s * 0.15, -s * 1.08, s * 0.035, s * 0.06, "#e3b021");
    }
    ctx.strokeStyle = renk; ctx.lineWidth = s * 0.18;                                                         // boyun
    ctx.beginPath(); ctx.moveTo(s * 0.45, -s * 1.3); ctx.quadraticCurveTo(s * 0.62, -s * 1.38, s * 0.68, -s * 1.85); ctx.stroke();
    const hx = s * 0.8, hy = -s * 1.9;
    elips(ctx, hx, hy, s * 0.22, s * 0.13, renk); elips(ctx, hx + s * 0.18, hy + s * 0.03, s * 0.1, s * 0.08, acik(renk, 0.1));
    elips(ctx, hx - s * 0.12, hy - s * 0.12, s * 0.05, s * 0.07, koyuD);                                      // kulak
    elips(ctx, hx + s * 0.02, hy - s * 0.03, s * 0.045, s * 0.04, "#1f2328");
    ctx.strokeStyle = "#1f2328"; ctx.lineWidth = Math.max(0.5, s * 0.02); ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(hx + s * 0.02 + i * s * 0.025, hy - s * 0.06); ctx.lineTo(hx + s * 0.02 + i * s * 0.04, hy - s * 0.1); } ctx.stroke();   // kirpikler
    ctx.lineWidth = Math.max(0.6, s * 0.03); ctx.beginPath(); ctx.arc(hx + s * 0.18, hy + s * 0.04, s * 0.06, 0.1 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ctx.restore();
    return { x: x + hx, y: taban + hy + s * 0.05 };
  }
  function devePazari(ctx, w, h, r, p, B) {
    const kum = "#d2a868";
    kumZemin(ctx, B, w, h, r, kum);
    const n = w > 120 ? 3 : 2, yer = enIyiYer(B, w, h, Math.min(w * 0.92, 25 * (n * 1.55 + 1.3)), Math.min(h * 0.85, 25 * 2.15), 5);
    if (!yer) return [];
    const s = yer.g / (n * 1.55 + 1.3), sol = yer.x - yer.g / 2, ipY = yer.taban - s * 2.0, renkler = ["#c99a5a", "#b5874f", "#d8b07a"], ortular = ["#c8302a", "#2f6f9f", "#e3b021"];
    ctx.strokeStyle = "#5a3a22"; ctx.lineWidth = 2; ctx.lineCap = "round";                                  // bağlama direkleri ve ip
    for (const px of [sol + s * 0.3, yer.x + yer.g / 2 - s * 0.3]) { ctx.beginPath(); ctx.moveTo(px, yer.taban - s * 0.9); ctx.lineTo(px, ipY - 1.5); ctx.stroke(); }
    ctx.strokeStyle = "#d9c9a2"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(sol + s * 0.3, ipY); ctx.quadraticCurveTo(yer.x, ipY + s * 0.15, yer.x + yer.g / 2 - s * 0.3, ipY); ctx.stroke();
    const yemX = yer.x + yer.g / 2 - s * 0.7, yemY = yer.taban - 1;                                           // saman yemi ve yalak
    elips(ctx, yemX + 1, yemY + 0.5, s * 0.55, s * 0.12, "rgba(0,0,0,0.25)");
    ctx.fillStyle = "#e0c060"; ctx.beginPath(); ctx.moveTo(yemX - s * 0.55, yemY); ctx.quadraticCurveTo(yemX, yemY - s * 0.75, yemX + s * 0.55, yemY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#b5932f"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let i = -3; i <= 3; i++) { ctx.moveTo(yemX + i * s * 0.12, yemY - 1); ctx.lineTo(yemX + i * s * 0.08 + s * 0.05, yemY - s * 0.5 * (1 - Math.abs(i) / 4)); } ctx.stroke();
    ctx.fillStyle = "#a07a4a"; yuvarlak(ctx, yemX - s * 1.15, yemY - s * 0.45, s * 0.36, s * 0.45, s * 0.12); ctx.fill();   // yem çuvalı
    ctx.strokeStyle = "#6b4a2a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(yemX - s * 1.12, yemY - s * 0.36); ctx.lineTo(yemX - s * 0.82, yemY - s * 0.36); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const dx = sol + s * (0.95 + i * 1.55), bas = deve(ctx, dx, yer.taban - (i % 2) * 1.5, s, renkler[i % 3], ortular[i % 3]);
      ctx.strokeStyle = "#d9c9a2"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(bas.x, bas.y); ctx.quadraticCurveTo(bas.x + s * 0.2, (bas.y + ipY) / 2 + s * 0.2, bas.x + s * 0.35, ipY + s * 0.08); ctx.stroke();
    }
    ctx.fillStyle = "#6b7a85"; yuvarlak(ctx, sol + s * 0.05, yer.taban - s * 0.3, s * 0.7, s * 0.28, 2); ctx.fill();   // su yalağı
    ctx.fillStyle = "#1e7fd6"; ctx.fillRect(sol + s * 0.1, yer.taban - s * 0.26, s * 0.6, s * 0.08);
    return [];
  }

  // ---------- EG: Gize piramitleri ve Sfenks ----------
  // Kum; üç piramit (büyüğü arkada, ortancanın tepesinde kaplama taşı), önde mavi-altın çizgili başlıklı sevimli Sfenks
  function sfenks(ctx, x, taban, s, mavi, altin) {
    const tas = "#d9b277", koyuT = koyu(tas, 0.2);
    elips(ctx, x + s * 0.1, taban + 0.5, s * 1.3, s * 0.16, "rgba(0,0,0,0.28)");
    ctx.strokeStyle = koyuT; ctx.lineWidth = s * 0.12; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - s * 1.1, taban - s * 0.2); ctx.quadraticCurveTo(x - s * 1.4, taban - s * 0.1, x - s * 1.25, taban - s * 0.5); ctx.stroke();   // kuyruk
    ctx.fillStyle = tas; yuvarlak(ctx, x - s * 1.15, taban - s * 0.58, s * 1.4, s * 0.58, s * 0.26); ctx.fill();          // gövde
    ctx.fillStyle = koyuT; yuvarlak(ctx, x - s * 1.15, taban - s * 0.18, s * 1.4, s * 0.18, s * 0.08); ctx.fill();
    elips(ctx, x - s * 0.55, taban - s * 0.5, s * 0.45, s * 0.08, acik(tas, 0.25));
    ctx.fillStyle = tas; for (const dy of [0, 0.02]) { yuvarlak(ctx, x + s * 0.05, taban - s * (0.24 - dy), s * 0.95, s * 0.2, s * 0.1); ctx.fill(); }   // ön patiler
    ctx.strokeStyle = koyuT; ctx.lineWidth = 0.6; ctx.beginPath(); for (let i = 1; i < 3; i++) { ctx.moveTo(x + s * (0.95 + i * 0.015), taban - s * 0.24); ctx.lineTo(x + s * (0.95 + i * 0.015), taban - s * 0.06); } ctx.stroke();
    const hx = x + s * 0.28, hy = taban - s * 0.95;
    ctx.fillStyle = mavi; ctx.beginPath(); ctx.moveTo(hx - s * 0.32, hy - s * 0.18); ctx.quadraticCurveTo(hx, hy - s * 0.52, hx + s * 0.32, hy - s * 0.18);   // nemes başlık
    ctx.lineTo(hx + s * 0.42, hy + s * 0.5); ctx.lineTo(hx - s * 0.42, hy + s * 0.5); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = altin; for (let y = hy - s * 0.4; y < hy + s * 0.5; y += s * 0.14) ctx.fillRect(hx - s * 0.5, y, s, s * 0.06); ctx.restore();
    ctx.fillStyle = "#e2bf86"; yuvarlak(ctx, hx - s * 0.22, hy - s * 0.2, s * 0.44, s * 0.5, s * 0.16); ctx.fill();         // yüz
    elips(ctx, hx - s * 0.09, hy - s * 0.02, s * 0.04, s * 0.05, "#2a1a10"); elips(ctx, hx + s * 0.09, hy - s * 0.02, s * 0.04, s * 0.05, "#2a1a10");
    ctx.strokeStyle = "#2a1a10"; ctx.lineWidth = Math.max(0.6, s * 0.03); ctx.beginPath(); ctx.moveTo(hx - s * 0.16, hy - s * 0.02); ctx.lineTo(hx - s * 0.2, hy - s * 0.03); ctx.moveTo(hx + s * 0.16, hy - s * 0.02); ctx.lineTo(hx + s * 0.2, hy - s * 0.03); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, hy + s * 0.12, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    elips(ctx, hx - s * 0.14, hy + s * 0.1, s * 0.04, s * 0.025, "rgba(230, 140, 120, 0.5)"); elips(ctx, hx + s * 0.14, hy + s * 0.1, s * 0.04, s * 0.025, "rgba(230, 140, 120, 0.5)");
    ctx.fillStyle = altin; ctx.fillRect(hx - s * 0.32, hy - s * 0.2, s * 0.64, s * 0.05);
  }
  function gizePiramitleri(ctx, w, h, r, p, B) {
    kumZemin(ctx, B, w, h, r, "#d6ae6a");
    const yer = enIyiYer(B, w, h, Math.min(w * 0.94, 170), Math.min(h * 0.85, 104), 5);
    if (!yer) return [];
    const { g, b, x, taban } = yer, x0 = x - g / 2, tas = "#d9b277";
    const buyuk = Math.min(g * 0.56, b * 0.86 / 0.64), orta = buyuk * 0.88, kucuk = buyuk * 0.46;
    piramit(ctx, x0 + g - buyuk / 2 - 1, taban - b * 0.2, buyuk, buyuk * 0.64, tas, false, false);
    piramit(ctx, x0 + g * 0.42, taban - b * 0.14, orta, orta * 0.64, koyu(tas, 0.03), false, false);
    const ot = taban - b * 0.14 - orta * 0.64, ox = x0 + g * 0.42 + orta * 0.05;                             // kaplama taşı
    ctx.fillStyle = acik(tas, 0.35); ctx.beginPath(); ctx.moveTo(ox, ot); ctx.lineTo(ox - orta * 0.12, ot + orta * 0.12); ctx.lineTo(ox + orta * 0.07, ot + orta * 0.12); ctx.closePath(); ctx.fill();
    piramit(ctx, x0 + kucuk / 2 + 1, taban - b * 0.08, kucuk, kucuk * 0.64, acik(tas, 0.04), false, false);
    sfenks(ctx, x0 + g * 0.3, taban - 1, Math.min(g * 0.2, b * 0.44), p.vurgu1 || "#2f8fb3", p.vurgu2 || "#e8c35a");
    return [];
  }

  // ---------- EG: Nil'de feluka yelkenlileri ----------
  // Yeşil tarlalı kıyılar, kum şeritli Nil (her yerde aynı mavi); üst kıyıda hurmalar; nehirde büyük üçgen yelkenli
  // ahşap felukalar ve sudaki yansımaları
  function feluka(ctx, x, y, s) {
    elips(ctx, x + 1, y + s * 0.12, s * 0.7, s * 0.1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.moveTo(x - s * 0.2, y + s * 0.08); ctx.lineTo(x + s * 0.4, y + s * 0.08); ctx.lineTo(x + s * 0.1, y + s * 0.5); ctx.closePath(); ctx.fill();   // yansıma
    ctx.fillStyle = "#f4f1ea"; ctx.beginPath(); ctx.moveTo(x - s * 0.62, y - s * 0.14); ctx.quadraticCurveTo(x, y + s * 0.16, x + s * 0.68, y - s * 0.2);   // gövde
    ctx.lineTo(x + s * 0.55, y - s * 0.02); ctx.quadraticCurveTo(x, y + s * 0.1, x - s * 0.5, y + 0.01); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#2f8fb3"; ctx.lineWidth = Math.max(0.8, s * 0.05); ctx.beginPath(); ctx.moveTo(x - s * 0.58, y - s * 0.08); ctx.quadraticCurveTo(x, y + s * 0.13, x + s * 0.63, y - s * 0.13); ctx.stroke();
    ctx.strokeStyle = "#5a3a22"; ctx.lineWidth = Math.max(0.8, s * 0.045); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - s * 0.02, y - s * 0.04); ctx.lineTo(x + s * 0.04, y - s * 1.05); ctx.stroke();                                          // direk
    ctx.beginPath(); ctx.moveTo(x - s * 0.55, y - s * 0.32); ctx.lineTo(x + s * 0.42, y - s * 1.65); ctx.stroke();                                         // seren
    ctx.fillStyle = "#fbf7ee"; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s * 0.35); ctx.lineTo(x + s * 0.4, y - s * 1.6);                                // yelken
    ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.8, x + s * 0.32, y - s * 0.24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.beginPath(); ctx.moveTo(x - s * 0.05, y - s * 0.9); ctx.lineTo(x + s * 0.4, y - s * 1.6); ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.8, x + s * 0.32, y - s * 0.24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(120, 100, 70, 0.4)"; ctx.lineWidth = 0.5; ctx.beginPath();
    for (const t of [0.3, 0.55, 0.8]) { ctx.moveTo(x - s * 0.5 + (s * 0.9) * t, y - s * 0.35 - s * 1.25 * t); ctx.lineTo(x + s * 0.32 + s * 0.05 * t, y - s * 0.24 - s * 0.2 * t); }
    ctx.stroke();
  }
  function felukalar(ctx, w, h, r, p, B) {
    const ky = h * 0.6, kh = Math.max(12, Math.min(26, h * 0.3));
    yamaZemin(ctx, B, w, h, r, "#5f8a3a", "#7fa04a", 900);
    kirp(ctx, B, () => {
      ctx.strokeStyle = "rgba(40, 70, 20, 0.35)"; ctx.lineWidth = 1;                                            // tarla çizgileri
      for (let y = 6; y < ky - kh / 2 - 6; y += 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 2); ctx.stroke(); }
      ctx.fillStyle = "#cfae74"; ctx.fillRect(0, ky - kh / 2 - 4, w, kh + 8);                                   // kum kıyılar
      ctx.fillStyle = "#1e7fd6"; ctx.fillRect(0, ky - kh / 2, w, kh);                                           // Nil (her yerde aynı mavi)
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 0.8;
      for (let y = ky - kh / 2 + 3; y < ky + kh / 2; y += 4) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x / 7 + y) * 0.8); ctx.stroke(); }
    }, 0, 0, -1);
    for (const f of [0.12, 0.3, 0.72, 0.9]) {                                                                  // üst kıyıda hurmalar
      const x = w * f, taban = ky - kh / 2 - 4, boy = Math.min(18, ustBosluk(B, x, taban) - 3);
      if (boy > 8) yanHurma(ctx, x, taban, boy);
    }
    const n = Math.max(1, Math.min(3, Math.round(w / 70)));
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? w * 0.5 : w * (0.19 + (0.62 * i) / (n - 1)), y = ky + kh * 0.12;
      const s = Math.min(kh * 1.1, 20, (Math.min(ustBosluk(B, x, y), ustBosluk(B, x + 6, y)) - 4) / 1.7);
      if (s >= 6 && uz(B, x - s * 0.7, y) < -2 && uz(B, x + s * 0.7, y) < -2) feluka(ctx, x, y, s);
    }
    return [];
  }

  Object.assign(window.ULKE_OBJELERI, {
    maviSokaklar, fenerliCarsi, sahraKumullari, kayaKemerleri, kakaoBahcesi, filAilesi, kenteTezgahi, kanopiKoprusu,
    zumaKayasi, konusanDavullar, meroePiramitleri, devePazari, gizePiramitleri, felukalar,
  });
})();
