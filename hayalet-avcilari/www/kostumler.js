/* ============================================================
   HAYALET AVCILARI — BOSS KOSTÜM TAKIMI (3.14.0)
   Dünya Turu bossu ülkenin geleneksel kıyafetini giyer (spec §5.5). Kayıt ulkeler.js'te:
   { baslik, giysi, desen, renk: [ana, ikinci, süs], aksesuar: [...], ayakkabi? }
   bossKostumuCiz(ctx, s, kayit, zaman, katman) drawGhost'un translate'inden sonra hayaletin yerel koordinatında çizer
   (s = size / 40; gövde başı (0, −5) merkezli 18 yarıçaplı yarım daire, eteği y 14–22 arası dalgalı):
   - "govde": giysi gövdeye kırpılarak (desen giysinin içinde), ayakkabılar eteğin altında
   - "bas": başlık ve aksesuarlar (yüz, gözler ve ağız açıkta kalır; başlık −15'in üstünde, can çubuğu −39'un altında)
   Dinî giysi ve simge, silah, bayrak yok. Math.random yok.
   Hız (spec §8): kostümün durağan kısmı ölçek başına bir kez ayrı tuvale çizilir, her karede tek drawImage ile basılır;
   yalnız canlı süsler (yelpaze, fener, kurdeleler) her karede zaman'la çizilir.
   engeller.js'ten (window.ENGEL renk yardımcıları) sonra, game.js'ten önce yüklenir.
   ============================================================ */
(function () {
  const { koyu, acik } = window.ENGEL;

  const KOSTUM_TURLERI = {
    baslik: ["efe", "cicekTaci", "krakuska", "tirol", "tam", "bere", "ucKose", "cicekToka", "kapuson", "basBagi", "fila",
      "kubaBaslik", "isicholo", "satroka", "boncukBant", "imma", "nemes", "mesedde", "simag", "kece", "doppi", "sindhi",
      "gaungBaung", "tanjak", "blangkon", "salakot", "nonLa", "gat", "kokosnik", "kurk", "kovboy", "sombrero", "vueltiao",
      "chullo", "boina", "yok"],
    giysi: ["entari", "ceket", "sarili", "panco", "kimono", "elbise", "askili"],
    desen: ["duz", "cizgili", "ekose", "puantiye", "geometrik", "nakis", "batik", "boncuk"],
    aksesuar: ["yelpaze", "fener", "semsiye", "mate", "maske", "boncukluYaka", "kusak", "sal", "pelerin", "fular", "bandana"],
    ayakkabi: ["babus", "geta", "markub", "cizme"],
  };
  const RENK = /^#[0-9a-fA-F]{6}$/;

  function kostumGecerliMi(k) {
    if (!k || typeof k !== "object") return false;
    const T = KOSTUM_TURLERI;
    if (!T.baslik.includes(k.baslik) || !T.giysi.includes(k.giysi) || !T.desen.includes(k.desen)) return false;
    if (!Array.isArray(k.renk) || k.renk.length !== 3 || !k.renk.every((c) => typeof c === "string" && RENK.test(c))) return false;
    if (!Array.isArray(k.aksesuar) || !k.aksesuar.every((a) => T.aksesuar.includes(a))) return false;
    if (k.ayakkabi !== undefined && !T.ayakkabi.includes(k.ayakkabi)) return false;
    return true;
  }

  // ---------- yardımcılar (birim: hayaletin s'siz koordinatı; bossKostumuCiz ölçeği bir kez uygular) ----------
  const ACIK_KUMAS = "#f4f1ea", HASIR = "#dcc58a", KECE_SIYAH = "#1d1d26", KURK = "#8a6a4a";
  function boya(ctx, renk, kal = 1.1) {
    ctx.fillStyle = renk; ctx.fill();
    ctx.strokeStyle = koyu(renk, 0.45); ctx.lineWidth = kal; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();
  }
  function cizgi(ctx, renk, kal) { ctx.strokeStyle = renk; ctx.lineWidth = kal; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); }
  function cokgen(ctx, noktalar) {
    ctx.beginPath(); ctx.moveTo(noktalar[0][0], noktalar[0][1]);
    for (let i = 1; i < noktalar.length; i++) ctx.lineTo(noktalar[i][0], noktalar[i][1]);
    ctx.closePath();
  }
  function daire(ctx, x, y, r, renk) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = renk; ctx.fill(); }
  function oval(ctx, x, y, rx, ry, a = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); }
  function kirpili(ctx, yolFn, fn, kural) { ctx.save(); yolFn(); if (kural) ctx.clip(kural); else ctx.clip(); fn(); ctx.restore(); }
  // Kübik Bezier eğrisi üstünde t'deki nokta
  function bezierNokta(p0, p1, p2, p3, t) {
    const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  }
  // Hayaletin gövdesi (drawGhost ile aynı yol)
  function govdeYolu(ctx) {
    ctx.beginPath();
    ctx.arc(0, -5, 18, Math.PI, 0);
    ctx.lineTo(18, 18);
    for (let i = 4; i >= 0; i--) ctx.lineTo(-18 + (i / 4) * 36, i % 2 === 0 ? 14 : 22);
    ctx.lineTo(-18, 18);
    ctx.closePath();
  }
  // Yakadan aşağısı: omuzda yanY, ortada ortaY'den geçen yaka çizgisi
  function altBolge(ctx, yanY = 2, ortaY = 9.5) {
    ctx.beginPath(); ctx.moveTo(-23, yanY); ctx.quadraticCurveTo(0, 2 * ortaY - yanY, 23, yanY);
    ctx.lineTo(23, 30); ctx.lineTo(-23, 30); ctx.closePath();
  }
  function yakaCizgisi(ctx, renk, kal, yanY = 2, ortaY = 9.5) {
    ctx.beginPath(); ctx.moveTo(-23, yanY); ctx.quadraticCurveTo(0, 2 * ortaY - yanY, 23, yanY); cizgi(ctx, renk, kal);
  }

  // ---------- desenler (geçerli kırpma alanının içini doldurur; zemin ana renkle boyalı) ----------
  function cicek(ctx, x, y, r, renk, orta) {
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; daire(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, renk); }
    daire(ctx, x, y, r * 0.55, orta);
  }
  function desenCiz(ctx, k, x0 = -24, y0 = -40, x1 = 24, y1 = 30) {
    const [ana, iki, sus] = k.renk;
    const w = x1 - x0, h = y1 - y0;
    switch (k.desen) {
      case "cizgili":
        ctx.fillStyle = iki;
        for (let y = y0 + 1.5; y < y1; y += 4) ctx.fillRect(x0, y, w, 1.5);
        break;
      case "ekose":
        ctx.globalAlpha = 0.5; ctx.fillStyle = iki;
        for (let x = x0 + 2; x < x1; x += 7) ctx.fillRect(x, y0, 3, h);
        for (let y = y0 + 2; y < y1; y += 7) ctx.fillRect(x0, y, w, 3);
        ctx.globalAlpha = 0.85; ctx.fillStyle = sus;
        for (let x = x0 + 3.2; x < x1; x += 7) ctx.fillRect(x, y0, 0.6, h);
        for (let y = y0 + 3.2; y < y1; y += 7) ctx.fillRect(x0, y, w, 0.6);
        ctx.globalAlpha = 1;
        break;
      case "puantiye":
        for (let y = y0 + 2, r = 0; y < y1; y += 4.5, r++) {
          for (let x = x0 + (r % 2 ? 4.5 : 2.2); x < x1; x += 4.6) daire(ctx, x, y, 1.15, iki);
        }
        break;
      case "geometrik":
        for (let y = y0 + 2, r = 0; y < y1; y += 6, r++) {
          ctx.beginPath();
          for (let x = x0, i = 0; x <= x1 + 3; x += 3, i++) ctx.lineTo(x, y + (i % 2 ? 2.4 : 0));
          cizgi(ctx, r % 2 ? sus : iki, 1.1);
          ctx.fillStyle = r % 2 ? iki : sus;
          for (let x = x0 + 1.5 + (r % 2) * 3; x < x1; x += 6) { cokgen(ctx, [[x, y + 3.4], [x + 1.4, y + 4.6], [x, y + 5.8], [x - 1.4, y + 4.6]]); ctx.fill(); }
        }
        break;
      case "nakis":
        for (let y = y0 + 4, r = 0; y < y1; y += 6.5, r++) {
          for (let x = x0 + (r % 2 ? 5 : 1.8); x < x1; x += 6.4) cicek(ctx, x, y, 0.95, r % 2 ? iki : sus, r % 2 ? sus : iki);
        }
        break;
      case "batik":
        for (let y = y0 + 3, r = 0; y < y1; y += 7, r++) {
          for (let x = x0 + (r % 2 ? 5.5 : 2); x < x1; x += 7.5) {
            oval(ctx, x, y, 2.6, 2, 0.5); ctx.strokeStyle = iki; ctx.lineWidth = 1.1; ctx.stroke();
            daire(ctx, x, y, 0.8, sus);
            daire(ctx, x + 3.6, y + 3.2, 0.6, iki);
          }
        }
        break;
      case "boncuk":
        for (let y = y0 + 2.5, r = 0; y < y1; y += 4, r++) {
          for (let x = x0 + (r % 2 ? 1.2 : 0); x < x1; x += 2.4) daire(ctx, x, y, 0.9, (Math.round((x - x0) / 2.4) + r) % 3 === 0 ? sus : iki);
        }
        break;
      default: break; // duz
    }
  }

  // ---------- giysiler (gövdeye kırpılır) ----------
  function giysiCiz(ctx, k) {
    const [ana, iki, sus] = k.renk;
    ctx.save();
    govdeYolu(ctx); ctx.clip();
    const desenli = (yolFn, x0, y0, x1, y1) => kirpili(ctx, yolFn, () => desenCiz(ctx, k, x0, y0, x1, y1));
    switch (k.giysi) {
      case "entari": {
        altBolge(ctx); ctx.fillStyle = ana; ctx.fill();
        desenli(() => altBolge(ctx), -24, 0, 24, 30);
        ctx.fillStyle = sus; ctx.fillRect(-1.6, 8.5, 3.2, 20);                 // ön pervaz
        ctx.fillStyle = koyu(sus, 0.25); for (let y = 11; y < 22; y += 3.2) daire(ctx, 0, y, 0.7, koyu(sus, 0.35));
        yakaCizgisi(ctx, sus, 1.8);
        break;
      }
      case "ceket": {
        altBolge(ctx); ctx.fillStyle = iki; ctx.fill();                          // gömlek
        const sol = () => { ctx.beginPath(); ctx.moveTo(-23, 1); ctx.quadraticCurveTo(-11, 3.5, -4.5, 10); ctx.lineTo(-3.4, 30); ctx.lineTo(-23, 30); ctx.closePath(); };
        const sag = () => { ctx.beginPath(); ctx.moveTo(23, 1); ctx.quadraticCurveTo(11, 3.5, 4.5, 10); ctx.lineTo(3.4, 30); ctx.lineTo(23, 30); ctx.closePath(); };
        for (const p of [sol, sag]) {
          p(); ctx.fillStyle = ana; ctx.fill();
          desenli(p, -24, 0, 24, 30);
          p(); ctx.strokeStyle = koyu(ana, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
        }
        for (const y of [13, 17.5]) { daire(ctx, -5.2, y, 1.1, sus); daire(ctx, 5.2, y, 1.1, sus); }
        ctx.beginPath(); ctx.moveTo(-4.5, 10); ctx.quadraticCurveTo(-11, 3.5, -23, 1); cizgi(ctx, sus, 1.3);   // yaka şeridi
        ctx.beginPath(); ctx.moveTo(4.5, 10); ctx.quadraticCurveTo(11, 3.5, 23, 1); cizgi(ctx, sus, 1.3);
        break;
      }
      case "sarili": {
        altBolge(ctx); ctx.fillStyle = iki; ctx.fill();                          // üst
        const etek = () => { ctx.beginPath(); ctx.rect(-23, 10.5, 46, 20); };
        etek(); ctx.fillStyle = ana; ctx.fill();
        desenli(etek, -24, 10, 24, 30);
        ctx.beginPath(); ctx.moveTo(7, 10.5); ctx.lineTo(3, 30); cizgi(ctx, koyu(ana, 0.35), 1.2);   // sarma kenarı
        ctx.beginPath(); ctx.moveTo(8.4, 10.5); ctx.lineTo(4.4, 30); cizgi(ctx, sus, 1);
        // omuzdan bele çapraz örtü (kente, sari, ekose örtü)
        const orta = () => { cokgen(ctx, [[-23, 5], [-16, 3], [16, 15.5], [9, 17.5]]); };
        orta(); ctx.fillStyle = ana; ctx.fill();
        desenli(orta, -24, -4, 24, 16);
        orta(); ctx.strokeStyle = sus; ctx.lineWidth = 1.2; ctx.stroke();
        break;
      }
      case "panco": {
        altBolge(ctx); ctx.fillStyle = iki; ctx.fill();                          // altta pantolon ya da etek
        const panco = () => {
          ctx.beginPath(); ctx.moveTo(-23, 1.5); ctx.quadraticCurveTo(0, 17.5, 23, 1.5);
          ctx.lineTo(23, 15); ctx.lineTo(0, 19.5); ctx.lineTo(-23, 15); ctx.closePath();
        };
        panco(); ctx.fillStyle = ana; ctx.fill();
        desenli(panco, -24, 0, 24, 20);
        panco(); ctx.strokeStyle = koyu(ana, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
        ctx.beginPath();                                                           // saçak
        for (let x = -18; x <= 18; x += 2) { const y = 15 + (4.5 * (18 - Math.abs(x))) / 18; ctx.moveTo(x, y); ctx.lineTo(x, y + 2.4); }
        cizgi(ctx, sus, 0.9);
        break;
      }
      case "kimono": {
        altBolge(ctx, 1, 6); ctx.fillStyle = ana; ctx.fill();
        desenli(() => altBolge(ctx, 1, 6), -24, 0, 24, 30);
        for (const sx of [1, -1]) {                                                 // V yaka: ağzın iki yanından obiye; sol yaka üstte
          ctx.beginPath(); ctx.moveTo(sx * 8.5, 2.6); ctx.lineTo(0, 12.4); cizgi(ctx, koyu(iki, 0.3), 3.4);
          ctx.beginPath(); ctx.moveTo(sx * 8.5, 2.6); ctx.lineTo(0, 12.4); cizgi(ctx, iki, 2.2);
        }
        ctx.beginPath(); ctx.rect(-23, 12.2, 46, 4.2); boya(ctx, iki, 0.9);        // obi kuşağı
        ctx.beginPath(); ctx.moveTo(-23, 14.3); ctx.lineTo(23, 14.3); cizgi(ctx, sus, 0.9);
        break;
      }
      case "elbise": {
        altBolge(ctx, 1.5, 8.5); ctx.fillStyle = ana; ctx.fill();
        desenli(() => altBolge(ctx, 1.5, 8.5), -24, 0, 24, 30);
        ctx.beginPath(); ctx.moveTo(-23, 11); ctx.quadraticCurveTo(0, 13, 23, 11); cizgi(ctx, sus, 1.4);  // bel
        for (const y0 of [16.5, 20]) {                                              // fırfır
          ctx.beginPath();
          for (let x = -20; x < 20; x += 4) { ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + 2, y0 + 2.6, x + 4, y0); }
          cizgi(ctx, sus, 1);
        }
        yakaCizgisi(ctx, sus, 1.3, 1.5, 8.5);
        break;
      }
      case "askili": {
        altBolge(ctx); ctx.fillStyle = sus; ctx.fill();                          // gömlek
        const alt = () => { ctx.beginPath(); ctx.rect(-23, 12, 46, 18); };
        alt(); ctx.fillStyle = ana; ctx.fill();
        desenli(alt, -24, 12, 24, 30);
        ctx.beginPath(); ctx.moveTo(-23, 12); ctx.lineTo(23, 12); cizgi(ctx, koyu(ana, 0.4), 1.1);
        for (const x of [-8.5, 8.5]) {                                              // askılar
          ctx.beginPath(); ctx.moveTo(x * 1.25, 0.5); ctx.lineTo(x * 0.75, 12.5); cizgi(ctx, koyu(ana, 0.4), 3.4);
          ctx.beginPath(); ctx.moveTo(x * 1.25, 0.5); ctx.lineTo(x * 0.75, 12.5); cizgi(ctx, ana, 2.4);
        }
        ctx.beginPath(); ctx.rect(-6.8, 9.2, 13.6, 2.4); boya(ctx, ana, 0.8);       // göğüs köprüsü
        for (const x of [-4, 0, 4]) daire(ctx, x, 10.4, 0.7, iki);                 // işleme
        for (const x of [-6, 6]) daire(ctx, x, 14, 0.9, acik(ana, 0.6));          // düğme
        break;
      }
    }
    ctx.restore();
  }

  // ---------- ayakkabılar (eteğin altından görünür) ----------
  function ayakkabiCiz(ctx, k) {
    const tur = k.ayakkabi;
    if (!tur) return;
    for (const x of [-8.5, 8.5]) {
      switch (tur) {
        case "babus":
          ctx.beginPath(); ctx.moveTo(x - 4, 23.8); ctx.quadraticCurveTo(x - 3.5, 20.6, x, 20.8); ctx.quadraticCurveTo(x + 4.6, 21.2, x + 5.4, 23.8 - 1.4);
          ctx.quadraticCurveTo(x + 2, 24.6, x - 4, 23.8); ctx.closePath(); boya(ctx, k.renk[2], 0.9);
          break;
        case "geta":
          ctx.beginPath(); ctx.rect(x - 4, 21.5, 8, 1.8); boya(ctx, "#c08a52", 0.8);
          ctx.fillStyle = "#7a5230"; ctx.fillRect(x - 3, 23.3, 1.4, 1.6); ctx.fillRect(x + 1.6, 23.3, 1.4, 1.6);
          ctx.beginPath(); ctx.moveTo(x - 2.6, 21.5); ctx.lineTo(x, 19.6); ctx.lineTo(x + 2.6, 21.5); cizgi(ctx, "#c8302a", 0.9);
          break;
        case "markub":
          ctx.beginPath(); ctx.moveTo(x - 3.8, 24); ctx.quadraticCurveTo(x - 3.6, 20.4, x + 0.5, 20.6); ctx.quadraticCurveTo(x + 4.2, 21, x + 4.6, 23.4);
          ctx.closePath(); boya(ctx, k.renk[2], 0.9);
          break;
        case "cizme":
          ctx.beginPath(); ctx.moveTo(x - 2.6, 18.5); ctx.lineTo(x + 2.2, 18.5); ctx.lineTo(x + 2.4, 22.4); ctx.quadraticCurveTo(x + 5.6, 22.6, x + 5.6, 24.6);
          ctx.lineTo(x - 3, 24.6); ctx.closePath(); boya(ctx, "#7a4a2a", 0.9);
          ctx.fillStyle = "#4a2a14"; ctx.fillRect(x - 3, 24.2, 2.6, 1.2);
          break;
      }
    }
  }

  // ---------- başlıklar ----------
  // Kenar: geniş kenarlı şapkanın kenarı (y'de, yarı genişlik g, kalınlık d, kıvrım: + yukarı kıvrık uçlar)
  function sapkaKenari(ctx, y, g, d, kivrim, renk) {
    ctx.beginPath();
    ctx.moveTo(-g, y - kivrim); ctx.quadraticCurveTo(0, y + d * 2.2, g, y - kivrim);
    ctx.quadraticCurveTo(0, y + d * 0.2 - kivrim * 0.6, -g, y - kivrim); ctx.closePath();
    boya(ctx, renk, 1);
  }
  // Kubbe: alt kenarı y'de, yarı genişlik g, yükseklik h
  function kubbe(ctx, y, g, h, renk, kal = 1.1) {
    ctx.beginPath(); ctx.moveTo(-g, y); ctx.bezierCurveTo(-g * 1.05, y - h * 1.25, g * 1.05, y - h * 1.25, g, y); ctx.closePath();
    boya(ctx, renk, kal);
  }
  function kurdeleler(ctx, x, y, renkler, uzun, zaman, yon = 1) {
    renkler.forEach((r, i) => {
      const sal = Math.sin(zaman * 2.4 + i * 0.9) * 1.6;
      ctx.beginPath(); ctx.moveTo(x + i * yon * 1.2, y);
      ctx.bezierCurveTo(x + yon * (3 + i), y + uzun * 0.35, x + yon * (1 + i) + sal, y + uzun * 0.7, x + yon * (2.5 + i * 1.3) + sal, y + uzun);
      cizgi(ctx, koyu(r, 0.3), 1.9); ctx.stroke();
      cizgi(ctx, r, 1.2);
    });
  }

  function baslikCiz(ctx, k, zaman) {
    const [ana, iki, sus] = k.renk;
    switch (k.baslik) {
      case "efe": {                                                               // kabalak üstüne sarılı yemeni, püsküller
        kubbe(ctx, -15.5, 12.5, 13, ana);
        const sarik = () => { ctx.beginPath(); ctx.moveTo(-14.5, -15.5); ctx.bezierCurveTo(-15, -25, 15, -25, 14.5, -15.5); ctx.quadraticCurveTo(0, -12.5, -14.5, -15.5); ctx.closePath(); };
        sarik(); boya(ctx, iki, 1.1);
        kirpili(ctx, sarik, () => {
          ctx.strokeStyle = sus; ctx.lineWidth = 1.1;
          for (let x = -20; x < 20; x += 4) { ctx.beginPath(); ctx.moveTo(x, -13); ctx.lineTo(x + 6, -25); ctx.stroke(); }
        });
        ctx.beginPath();
        for (let x = -12; x <= 12; x += 2) { const y = -14.6 + (x * x) / 160; ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(zaman * 3 + x) * 0.3, y + 2.6); }
        cizgi(ctx, sus, 0.9);
        ctx.beginPath(); ctx.moveTo(13, -18); ctx.quadraticCurveTo(18 + Math.sin(zaman * 2) * 0.8, -10, 16.5, -2); cizgi(ctx, koyu(iki, 0.3), 3.2);
        ctx.beginPath(); ctx.moveTo(13, -18); ctx.quadraticCurveTo(18 + Math.sin(zaman * 2) * 0.8, -10, 16.5, -2); cizgi(ctx, iki, 2.2);
        break;
      }
      case "cicekTaci": {                                                         // vinok: çiçek çelengi (kurdeleler canlı katmanda)
        const renkler = [iki, "#f2c94c", "#3a6ad0", iki, "#f2c94c", "#3a6ad0", iki];
        for (let i = 0; i < 7; i++) {
          const x = -15 + i * 5, y = -19.5 - Math.sqrt(Math.max(0, 1 - (x / 17) ** 2)) * 4.5;
          oval(ctx, x - 2.4, y + 1.2, 1.8, 1, -0.5); ctx.fillStyle = "#3f8f3a"; ctx.fill();
          cicek(ctx, x, y, 1.6, renkler[i], "#f9e07a");
        }
        break;
      }
      case "krakuska": {                                                          // Krakow şapkası: tavuskuşu tüyü (kurdeleler canlı katmanda)
        cokgen(ctx, [[-12.5, -16], [-14.5, -30], [-5, -32.5], [5, -32.5], [14.5, -30], [12.5, -16]]); boya(ctx, iki, 1.1);
        ctx.beginPath(); ctx.rect(-13, -20.5, 26, 4.5); boya(ctx, koyu(ana, 0.35), 1);
        for (let x = -10; x <= 10; x += 4) daire(ctx, x, -18.2, 0.8, sus);
        for (let i = 0; i < 3; i++) {                                              // tavuskuşu tüyleri
          const x0 = 6 + i * 1.4, a = -0.25 + i * 0.22 + Math.sin(zaman * 1.6 + i) * 0.03;
          const x1 = x0 + Math.sin(a) * 15, y1 = -24 - Math.cos(a) * 13;
          ctx.beginPath(); ctx.moveTo(x0, -24); ctx.lineTo(x1, y1); cizgi(ctx, "#2f6a3a", 1);
          oval(ctx, x1, y1, 2.2, 1.6, a); ctx.fillStyle = "#2f8f5a"; ctx.fill();
          daire(ctx, x1, y1, 1, "#1f4fb0"); daire(ctx, x1, y1, 0.45, "#e8c35a");
        }
        break;
      }
      case "tirol": {                                                             // keçe şapka, kordon, tüy
        oval(ctx, 0, -17.2, 19, 3.4); boya(ctx, iki, 1);
        ctx.beginPath(); ctx.moveTo(-11, -18); ctx.lineTo(-10, -29); ctx.quadraticCurveTo(-5, -31.5, 0, -28.5); ctx.quadraticCurveTo(5, -31.5, 10, -29); ctx.lineTo(11, -18); ctx.closePath();
        boya(ctx, iki, 1.1);
        ctx.beginPath(); ctx.moveTo(-11, -20.5); ctx.lineTo(11, -20.5); cizgi(ctx, sus, 1.6);
        ctx.beginPath(); ctx.moveTo(9, -21); ctx.quadraticCurveTo(13 + Math.sin(zaman * 2) * 0.5, -28, 15.5, -35); cizgi(ctx, "#5a5a5a", 1.4);
        oval(ctx, 13.5, -30, 2.2, 5.5, 0.35); ctx.fillStyle = "#e9e3d4"; ctx.fill(); ctx.strokeStyle = "#8a8578"; ctx.lineWidth = 0.6; ctx.stroke();
        break;
      }
      case "tam": {                                                               // tam o'shanter: geniş bere, damalı bant, ponpon
        oval(ctx, -2, -23, 21, 7, -0.08); boya(ctx, ana, 1.1);
        for (let i = 0; i < 9; i++) {
          ctx.fillStyle = i % 2 ? ACIK_KUMAS : sus;
          ctx.fillRect(-13.5 + i * 3, -19.2, 3, 2.6);
        }
        ctx.beginPath(); ctx.rect(-13.5, -19.2, 27, 2.6); ctx.strokeStyle = koyu(ana, 0.4); ctx.lineWidth = 0.8; ctx.stroke();
        daire(ctx, -2.5, -30, 3, sus); daire(ctx, -3.4, -30.8, 1, acik(sus, 0.4));
        break;
      }
      case "bere":
      case "boina": {                                                             // bere (FR), boina (AR)
        const renk = k.baslik === "bere" ? "#22222e" : "#262626";
        oval(ctx, -2.5, -21.5, k.baslik === "bere" ? 19 : 18.5, 6, -0.12); boya(ctx, renk, 1.1);
        ctx.beginPath(); ctx.moveTo(-14.5, -17.6); ctx.quadraticCurveTo(0, -15.6, 14.5, -17.6); cizgi(ctx, "#111", 1.6);
        ctx.beginPath(); ctx.moveTo(-3, -27.2); ctx.lineTo(-2.6, -30.4); cizgi(ctx, renk, 1.3);
        break;
      }
      case "ucKose": {                                                            // üç köşeli karnaval şapkası
        oval(ctx, 0, -25, 11, 7.5); boya(ctx, ana, 1);
        ctx.beginPath(); ctx.moveTo(-22, -29); ctx.quadraticCurveTo(-12, -17, 0, -15); ctx.quadraticCurveTo(12, -17, 22, -29);
        ctx.quadraticCurveTo(12, -22, 0, -21.5); ctx.quadraticCurveTo(-12, -22, -22, -29); ctx.closePath();
        boya(ctx, ana, 1.1);
        ctx.beginPath(); ctx.moveTo(-22, -29); ctx.quadraticCurveTo(-12, -17, 0, -15); ctx.quadraticCurveTo(12, -17, 22, -29); cizgi(ctx, iki, 1.2);
        break;
      }
      case "cicekToka": {                                                         // flamenko: yan çiçek ve tarak
        ctx.beginPath(); ctx.moveTo(2, -21); ctx.quadraticCurveTo(8, -33, 15, -28); ctx.lineTo(13, -20); ctx.closePath(); boya(ctx, sus, 0.9);
        ctx.strokeStyle = koyu(sus, 0.35); ctx.lineWidth = 0.6;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(8.5, -24, 2 + i * 1.6, -2.4, -0.6); ctx.stroke(); }
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; daire(ctx, -11 + Math.cos(a) * 3, -21.5 + Math.sin(a) * 3, 2.6, i % 2 ? ana : koyu(ana, 0.12)); }
        daire(ctx, -11, -21.5, 2.2, koyu(ana, 0.3));
        oval(ctx, -6.5, -18.5, 2.6, 1.2, 0.4); ctx.fillStyle = "#3f8f3a"; ctx.fill();
        break;
      }
      case "kapuson": {                                                           // cellabe başlığı (sivri)
        const yol = () => {
          ctx.beginPath(); ctx.moveTo(-20.5, 12); ctx.bezierCurveTo(-23, -20, -11, -32, 5, -37);
          ctx.bezierCurveTo(9, -30, 22, -22, 20.5, 12); ctx.quadraticCurveTo(0, 15, -20.5, 12); ctx.closePath();
          ctx.moveTo(13, -4); ctx.ellipse(0, -4, 13, 14.5, 0, 0, Math.PI * 2);
        };
        yol(); ctx.fillStyle = ana; ctx.fill("evenodd");
        kirpili(ctx, yol, () => { ctx.fillStyle = iki; for (let x = -22; x < 22; x += 4) ctx.fillRect(x, -40, 1.2, 44); }, "evenodd");
        yol(); ctx.strokeStyle = koyu(ana, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
        oval(ctx, 0, -4, 13, 14.5); cizgi(ctx, sus, 1.4);
        break;
      }
      case "basBagi": {                                                           // Afrika baş bağı (sarılı, desenli)
        const yol = () => {
          ctx.beginPath(); ctx.moveTo(-14.5, -15); ctx.bezierCurveTo(-21, -27, -11, -36, -3, -33);
          ctx.bezierCurveTo(-1, -40, 9, -40, 9, -33); ctx.bezierCurveTo(19, -33, 20, -22, 14.5, -15);
          ctx.quadraticCurveTo(0, -12.8, -14.5, -15); ctx.closePath();
        };
        yol(); ctx.fillStyle = iki; ctx.fill();
        kirpili(ctx, yol, () => desenCiz(ctx, { renk: [iki, sus, ana], desen: k.desen === "duz" ? "batik" : k.desen }, -22, -42, 22, -12));
        yol(); ctx.strokeStyle = koyu(iki, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
        ctx.strokeStyle = koyu(iki, 0.35); ctx.lineWidth = 0.9;                    // kıvrımlar
        ctx.beginPath(); ctx.moveTo(-13, -19); ctx.quadraticCurveTo(0, -27, 14, -20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-10, -27); ctx.quadraticCurveTo(2, -31, 9, -33); ctx.stroke();
        break;
      }
      case "fila": {                                                              // Yoruba fila: yana yatan yumuşak başlık
        ctx.beginPath(); ctx.moveTo(-12.5, -15.5); ctx.lineTo(-13.2, -27); ctx.quadraticCurveTo(-3, -34, 16, -27.5);
        ctx.quadraticCurveTo(13, -21, 12.5, -15.5); ctx.quadraticCurveTo(0, -13, -12.5, -15.5); ctx.closePath();
        boya(ctx, ana, 1.1);
        ctx.beginPath(); ctx.moveTo(-13, -26.5); ctx.quadraticCurveTo(1, -24, 15.5, -27.5); cizgi(ctx, koyu(ana, 0.35), 0.9);
        ctx.beginPath(); ctx.moveTo(-12.6, -17.8); ctx.quadraticCurveTo(0, -15.3, 12.6, -17.8); cizgi(ctx, sus, 1.6);
        for (let x = -9; x <= 9; x += 4.5) cicek(ctx, x, -21.5, 0.8, sus, iki);
        break;
      }
      case "kubaBaslik": {                                                        // Kuba: rafya başlık, deniz kabukları
        kubbe(ctx, -15.5, 12, 11.5, "#c8a46a");
        kirpili(ctx, () => { ctx.beginPath(); ctx.moveTo(-12, -15.5); ctx.bezierCurveTo(-12.6, -30, 12.6, -30, 12, -15.5); ctx.closePath(); }, () => {
          ctx.strokeStyle = iki; ctx.lineWidth = 1;
          for (let y = -27; y < -16; y += 3.4) { ctx.beginPath(); for (let x = -14, i = 0; x <= 14; x += 2.5, i++) ctx.lineTo(x, y + (i % 2 ? 1.6 : 0)); ctx.stroke(); }
        });
        for (let x = -9; x <= 9; x += 3) { oval(ctx, x, -17.2, 1.1, 1.5); boya(ctx, sus, 0.5); ctx.beginPath(); ctx.moveTo(x, -18.2); ctx.lineTo(x, -16.2); cizgi(ctx, koyu(sus, 0.5), 0.4); }
        daire(ctx, 0, -29.6, 1.8, iki);
        break;
      }
      case "isicholo": {                                                          // Zulu: geniş tepeli kırmızı şapka, boncuk şeritleri
        ctx.beginPath(); ctx.moveTo(-11.5, -16.5); ctx.lineTo(-24, -30); ctx.quadraticCurveTo(0, -35.5, 24, -30); ctx.lineTo(11.5, -16.5);
        ctx.quadraticCurveTo(0, -14.5, -11.5, -16.5); ctx.closePath(); boya(ctx, ana, 1.1);
        for (const [y, g] of [[-20, 14.6], [-25, 19.2]]) {
          for (let x = -g + 1; x < g; x += 2.2) daire(ctx, x, y, 0.85, Math.round(x / 2.2) % 2 ? sus : iki);
        }
        oval(ctx, 0, -30.3, 23.5, 2.6); boya(ctx, koyu(ana, 0.15), 0.8);
        break;
      }
      case "satroka": {                                                           // Malgaş hasır şapka
        oval(ctx, 0, -17, 21, 4); boya(ctx, iki, 1);
        kubbe(ctx, -17.5, 11, 9, iki);
        ctx.beginPath(); ctx.moveTo(-11, -19.8); ctx.quadraticCurveTo(0, -18, 11, -19.8); cizgi(ctx, sus, 2);
        ctx.strokeStyle = koyu(iki, 0.2); ctx.lineWidth = 0.5;
        for (let r = 6; r < 21; r += 3.5) { oval(ctx, 0, -17, r, r * 0.19); ctx.stroke(); }
        break;
      }
      case "boncukBant": {                                                        // Maasai boncuk bandı ve yan sarkıtlar
        const renkler = [ana, iki, sus, ACIK_KUMAS];
        ctx.beginPath(); ctx.moveTo(-16.5, -14.5); ctx.quadraticCurveTo(0, -21.5, 16.5, -14.5); cizgi(ctx, koyu(ana, 0.4), 4.4);
        for (let i = 0; i <= 16; i++) {
          const t = i / 16, x = -16.5 + 33 * t, y = (1 - t) * (1 - t) * -14.5 + 2 * (1 - t) * t * -21.5 + t * t * -14.5;
          daire(ctx, x, y, 1.15, renkler[i % 4]);
        }
        for (const x of [-15, 15]) {
          for (let j = 0; j < 4; j++) daire(ctx, x + Math.sin(zaman * 2 + j) * 0.2, -12 + j * 2.1, 0.9, renkler[(j + 1) % 4]);
          daire(ctx, x, -3.2, 1.8, "#cfd6dc"); daire(ctx, x - 0.5, -3.7, 0.6, "#ffffff");
        }
        break;
      }
      case "imma": {                                                              // Sudan sarığı (beyaz, katlı)
        oval(ctx, 0, -24, 17, 9.5); boya(ctx, ana, 1.1);
        ctx.strokeStyle = koyu(ana, 0.18); ctx.lineWidth = 0.9;
        for (const [a, b] of [[-16, -21], [-14, -26], [-10, -30.5]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo(0, b - 5, -a, b + 1.5); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-15.5, -17.5); ctx.quadraticCurveTo(0, -13.6, 15.5, -17.5); cizgi(ctx, koyu(ana, 0.25), 1.2);
        break;
      }
      case "nemes": {                                                             // nemes başörtüsü: çizgili, yan kanatlı (yılan simgesi yok)
        const yol = () => {
          ctx.beginPath(); ctx.moveTo(-16.5, -14.5); ctx.bezierCurveTo(-18, -32, 18, -32, 16.5, -14.5);
          ctx.lineTo(21.5, -5); ctx.lineTo(19.5, 10); ctx.lineTo(13.2, 10); ctx.lineTo(12.8, -11.5);
          ctx.lineTo(-12.8, -11.5); ctx.lineTo(-13.2, 10); ctx.lineTo(-19.5, 10); ctx.lineTo(-21.5, -5); ctx.closePath();
        };
        yol(); ctx.fillStyle = sus; ctx.fill();
        kirpili(ctx, yol, () => { ctx.fillStyle = iki; for (let y = -32; y < 12; y += 3.2) ctx.fillRect(-24, y, 48, 1.5); });
        yol(); ctx.strokeStyle = koyu(sus, 0.5); ctx.lineWidth = 1.1; ctx.stroke();
        ctx.beginPath(); ctx.rect(-13.6, -16.2, 27.2, 3.2); boya(ctx, sus, 0.8);
        break;
      }
      case "mesedde": {                                                           // Yemen meşeddesi: sarılı çizgili örtü, yan uç
        kubbe(ctx, -16, 13.5, 12, ana);
        const bant = () => { ctx.beginPath(); ctx.moveTo(-15, -15); ctx.quadraticCurveTo(0, -27, 15, -15); ctx.quadraticCurveTo(0, -12, -15, -15); ctx.closePath(); };
        bant(); ctx.fillStyle = iki; ctx.fill();
        kirpili(ctx, bant, () => desenCiz(ctx, { renk: [iki, ana, sus], desen: "cizgili" }, -18, -28, 18, -10));
        bant(); ctx.strokeStyle = koyu(iki, 0.45); ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-14, -17); ctx.quadraticCurveTo(-21 + Math.sin(zaman * 2) * 0.6, -8, -18.5, 3); cizgi(ctx, koyu(iki, 0.35), 3.6);
        ctx.beginPath(); ctx.moveTo(-14, -17); ctx.quadraticCurveTo(-21 + Math.sin(zaman * 2) * 0.6, -8, -18.5, 3); cizgi(ctx, iki, 2.6);
        break;
      }
      case "simag": {                                                             // şimag ve agal (yüz açık)
        const yol = () => {
          ctx.beginPath(); ctx.moveTo(-21.5, 12.5); ctx.bezierCurveTo(-24, -24, -12, -30, 0, -30.5);
          ctx.bezierCurveTo(12, -30, 24, -24, 21.5, 12.5); ctx.quadraticCurveTo(0, 15.5, -21.5, 12.5); ctx.closePath();
          ctx.moveTo(12.5, -3); ctx.ellipse(0, -3, 12.5, 13.5, 0, 0, Math.PI * 2);
        };
        yol(); ctx.fillStyle = ACIK_KUMAS; ctx.fill("evenodd");
        kirpili(ctx, yol, () => {
          ctx.fillStyle = iki;
          for (let i = 0; i < 14; i++) for (let j = 0; j < 12; j++) if ((i + j) % 2 === 0) ctx.fillRect(-24 + i * 3.6, -32 + j * 3.6, 1.8, 1.8);
        }, "evenodd");
        yol(); ctx.strokeStyle = "#9a958a"; ctx.lineWidth = 1; ctx.stroke();
        for (const dy of [0, 2.4]) {                                                // agal: başa oturan çift kordon (önden görünen yay)
          ctx.beginPath(); ctx.moveTo(-15.5, -15.5 - dy * 0.4); ctx.quadraticCurveTo(0, -27.5 + dy, 15.5, -15.5 - dy * 0.4); cizgi(ctx, "#18181c", 1.9);
        }
        break;
      }
      case "kece": {                                                              // Kaşkay keçe şapkası (yalnız keçe kubbe; spec §4.3)
        const renk = acik(ana, 0.35);
        kubbe(ctx, -15.5, 12, 14, renk);
        kirpili(ctx, () => { ctx.beginPath(); ctx.moveTo(-12, -15.5); ctx.bezierCurveTo(-12.6, -33, 12.6, -33, 12, -15.5); ctx.closePath(); }, () => {
          ctx.strokeStyle = koyu(renk, 0.12); ctx.lineWidth = 0.7;                  // keçe dokusu (kubbenin içinde)
          for (const x of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(x * 1.2, -16.5); ctx.quadraticCurveTo(x * 0.9, -24, x * 0.4, -31); ctx.stroke(); }
        });
        ctx.beginPath(); ctx.moveTo(-12, -16.6); ctx.quadraticCurveTo(0, -14.8, 12, -16.6); cizgi(ctx, koyu(renk, 0.3), 1);
        break;
      }
      case "doppi": {                                                             // Özbek dört köşe takke
        cokgen(ctx, [[-13, -16], [-10.5, -26.5], [10.5, -26.5], [13, -16]]); boya(ctx, KECE_SIYAH, 1);
        ctx.beginPath(); ctx.moveTo(0, -26.5); ctx.lineTo(0, -16); cizgi(ctx, "#3a3a46", 0.7);
        for (const x of [-6, 6]) {                                                  // biber motifleri
          ctx.beginPath(); ctx.moveTo(x, -24.5); ctx.bezierCurveTo(x + 3.2, -22, x + 1.6, -18.6, x - 0.6, -18.2); ctx.bezierCurveTo(x + 0.6, -20, x - 1.4, -22.5, x, -24.5); ctx.closePath();
          ctx.fillStyle = "#f4f1ea"; ctx.fill();
        }
        ctx.beginPath(); for (let x = -13, i = 0; x <= 13; x += 1.6, i++) ctx.lineTo(x, -16.8 - (i % 2 ? 1.2 : 0)); cizgi(ctx, "#f4f1ea", 0.6);
        break;
      }
      case "sindhi": {                                                            // Sindhi takkesi: önü kemerli, aynalı işleme
        const yol = () => {
          ctx.beginPath(); ctx.moveTo(-12.5, -15.5); ctx.lineTo(-12.5, -27); ctx.quadraticCurveTo(0, -29.5, 12.5, -27); ctx.lineTo(12.5, -15.5);
          ctx.lineTo(4.5, -15.5); ctx.quadraticCurveTo(0, -22, -4.5, -15.5); ctx.closePath();
        };
        yol(); ctx.fillStyle = iki; ctx.fill();
        kirpili(ctx, yol, () => desenCiz(ctx, { renk: [iki, "#e8c35a", sus], desen: "geometrik" }, -14, -30, 14, -14));
        yol(); ctx.strokeStyle = koyu(iki, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
        for (const [x, y] of [[-8.5, -21], [8.5, -21], [-4, -25.5], [4, -25.5]]) { daire(ctx, x, y, 1.3, "#cfd6dc"); daire(ctx, x - 0.4, y - 0.4, 0.45, "#fff"); }
        break;
      }
      case "gaungBaung": {                                                        // Myanmar: sarılı ipek, yan düğüm
        const renk = "#f6dccb";
        oval(ctx, 0, -20.5, 15.5, 6.5); boya(ctx, renk, 1.1);
        ctx.strokeStyle = koyu(renk, 0.2); ctx.lineWidth = 0.8;
        for (const y of [-23, -20, -17.4]) { ctx.beginPath(); ctx.moveTo(-14, y + 1); ctx.quadraticCurveTo(0, y - 2.5, 14, y + 1); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-13, -22); ctx.quadraticCurveTo(-19, -28, -22.5, -33); ctx.quadraticCurveTo(-17, -32, -15, -29.5); ctx.quadraticCurveTo(-12.5, -30, -10.5, -25); ctx.closePath();
        boya(ctx, renk, 1);
        ctx.beginPath(); ctx.moveTo(-22.5, -33); ctx.quadraticCurveTo(-17, -32, -15, -29.5); cizgi(ctx, sus, 0.9);
        break;
      }
      case "tanjak": {                                                            // Malay tanjak: katlı songket, sivri tepe
        const yol = () => {
          ctx.beginPath(); ctx.moveTo(-14.5, -15); ctx.lineTo(-14, -22.5); ctx.lineTo(-7, -36); ctx.lineTo(2, -25.5);
          ctx.lineTo(14, -23); ctx.lineTo(14.5, -15); ctx.quadraticCurveTo(0, -12.6, -14.5, -15); ctx.closePath();
        };
        yol(); ctx.fillStyle = iki; ctx.fill();
        kirpili(ctx, yol, () => desenCiz(ctx, { renk: [iki, ana, koyu(iki, 0.3)], desen: "geometrik" }, -16, -38, 16, -12));
        yol(); ctx.strokeStyle = koyu(iki, 0.5); ctx.lineWidth = 1.1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-7, -36); ctx.lineTo(-5, -22); cizgi(ctx, koyu(iki, 0.4), 0.8);
        break;
      }
      case "blangkon": {                                                          // Cava blangkonu: batik başlık, arka düğüm
        oval(ctx, -12.5, -17.5, 4.5, 3.4); boya(ctx, ana, 1);
        const yol = () => { ctx.beginPath(); ctx.moveTo(-13.5, -15); ctx.bezierCurveTo(-14.5, -30, 14.5, -30, 13.5, -15); ctx.quadraticCurveTo(0, -13, -13.5, -15); ctx.closePath(); };
        yol(); ctx.fillStyle = ana; ctx.fill();
        kirpili(ctx, yol, () => desenCiz(ctx, { renk: [ana, iki, sus], desen: "batik" }, -15, -30, 15, -12));
        yol(); ctx.strokeStyle = koyu(ana, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-13.4, -17.5); ctx.quadraticCurveTo(0, -15.2, 13.4, -17.5); cizgi(ctx, koyu(ana, 0.4), 1.6);
        break;
      }
      case "salakot": {                                                           // Filipin salakotu: basık kubbe, tepe süsü
        ctx.beginPath(); ctx.moveTo(0, -31.5); ctx.lineTo(0, -35.5); cizgi(ctx, koyu(sus, 0.35), 1.4);
        daire(ctx, 0, -35.8, 1.3, koyu(sus, 0.2));
        ctx.beginPath(); ctx.moveTo(-23, -16); ctx.quadraticCurveTo(-12, -30, 0, -31.5); ctx.quadraticCurveTo(12, -30, 23, -16);
        ctx.quadraticCurveTo(0, -13.5, -23, -16); ctx.closePath(); boya(ctx, sus, 1.1);
        ctx.strokeStyle = koyu(sus, 0.25); ctx.lineWidth = 0.6;
        for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, -31); ctx.lineTo(i * 5.2, -14.6 - (Math.abs(i) > 3 ? 1 : 0)); ctx.stroke(); }
        break;
      }
      case "nonLa": {                                                             // Vietnam konik şapkası
        const renk = "#ead9a6";
        ctx.beginPath(); ctx.moveTo(-25, -16); ctx.lineTo(0, -37); ctx.lineTo(25, -16); ctx.quadraticCurveTo(0, -12.5, -25, -16); ctx.closePath();
        boya(ctx, renk, 1.1);
        ctx.strokeStyle = koyu(renk, 0.22); ctx.lineWidth = 0.6;
        for (const t of [0.3, 0.52, 0.74]) { ctx.beginPath(); ctx.moveTo(-25 * t, -37 + 21 * t); ctx.quadraticCurveTo(0, -37 + 23.5 * t, 25 * t, -37 + 21 * t); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-17.5, -14.5); ctx.lineTo(-17, -7); cizgi(ctx, iki, 1.1);
        ctx.beginPath(); ctx.moveTo(17.5, -14.5); ctx.lineTo(17, -7); cizgi(ctx, iki, 1.1);
        break;
      }
      case "gat": {                                                               // Kore gat: geniş saydam kenar, uzun tepe
        ctx.save(); ctx.globalAlpha = 0.8;
        oval(ctx, 0, -19, 25, 3.2); boya(ctx, "#16161c", 0.8);
        ctx.globalAlpha = 0.9;
        cokgen(ctx, [[-8, -19], [-7, -33.5], [7, -33.5], [8, -19]]); boya(ctx, "#16161c", 0.8);
        ctx.restore();
        ctx.beginPath(); ctx.moveTo(-8, -21); ctx.lineTo(8, -21); cizgi(ctx, "#3a3a44", 1.2);
        break;
      }
      case "kokosnik": {                                                          // Rus kokoşniği: hale biçimli, inci kenarlı
        const yol = () => { ctx.beginPath(); ctx.moveTo(-15.5, -15.5); ctx.bezierCurveTo(-18, -32, -8, -38.5, 0, -38.5); ctx.bezierCurveTo(8, -38.5, 18, -32, 15.5, -15.5); ctx.quadraticCurveTo(0, -13, -15.5, -15.5); ctx.closePath(); };
        yol(); ctx.fillStyle = ana; ctx.fill();
        kirpili(ctx, yol, () => desenCiz(ctx, { renk: [ana, iki, sus], desen: "nakis" }, -17, -40, 17, -13));
        yol(); ctx.strokeStyle = koyu(ana, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
        for (let i = 0; i <= 14; i++) {                                             // dış kenarın biraz içinde inciler
          const t = i / 14;
          const [x, y] = t < 0.5
            ? bezierNokta([-15.5, -15.5], [-18, -32], [-8, -38.5], [0, -38.5], t * 2)
            : bezierNokta([0, -38.5], [8, -38.5], [18, -32], [15.5, -15.5], t * 2 - 1);
          daire(ctx, x * 0.92, y * 0.95 - 0.8, 0.95, "#fbf6ec");
        }
        oval(ctx, 0, -27, 2.4, 3); boya(ctx, sus, 0.7);
        break;
      }
      case "kurk": {                                                              // oduncu kürk şapkası: kareli tepe, kürk kulaklık
        for (const sx of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(sx * 12, -19); ctx.lineTo(sx * 19, -18); ctx.quadraticCurveTo(sx * 20, -6, sx * 15.5, -4); ctx.quadraticCurveTo(sx * 13, -10, sx * 12.5, -16); ctx.closePath();
          boya(ctx, KURK, 1);
        }
        const yol = () => { ctx.beginPath(); ctx.moveTo(-13, -17); ctx.bezierCurveTo(-14, -31, 14, -31, 13, -17); ctx.closePath(); };
        yol(); ctx.fillStyle = ana; ctx.fill();
        kirpili(ctx, yol, () => desenCiz(ctx, { renk: [ana, iki, sus], desen: "ekose" }, -15, -32, 15, -15));
        yol(); ctx.strokeStyle = koyu(ana, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-14.5, -15.5);
        for (let x = -14.5; x <= 14.5; x += 2.9) ctx.quadraticCurveTo(x + 1.45, -23, x + 2.9, -20.5 + (x > 13 ? 5 : 0));
        ctx.lineTo(14.5, -15.5); ctx.quadraticCurveTo(0, -13, -14.5, -15.5); ctx.closePath(); boya(ctx, KURK, 1);
        break;
      }
      case "kovboy": {                                                            // kovboy şapkası
        ctx.beginPath(); ctx.moveTo(-11, -18); ctx.lineTo(-11.5, -28.5); ctx.quadraticCurveTo(-6, -32.5, -3.5, -30); ctx.quadraticCurveTo(0, -28, 3.5, -30);
        ctx.quadraticCurveTo(6, -32.5, 11.5, -28.5); ctx.lineTo(11, -18); ctx.closePath(); boya(ctx, ana, 1.1);
        ctx.beginPath(); ctx.rect(-11.2, -21, 22.4, 2.6); boya(ctx, "#3a2414", 0.8);
        ctx.beginPath(); ctx.moveTo(-27, -24); ctx.quadraticCurveTo(-20, -15.5, 0, -15.5); ctx.quadraticCurveTo(20, -15.5, 27, -24);
        ctx.quadraticCurveTo(20, -18, 0, -19); ctx.quadraticCurveTo(-20, -18, -27, -24); ctx.closePath(); boya(ctx, ana, 1.1);
        break;
      }
      case "sombrero": {                                                          // charro sombrerosu: geniş kenar, sırma işleme
        oval(ctx, 0, -17, 33, 5); boya(ctx, ana, 1.1);
        oval(ctx, 0, -17, 30.5, 3.6); cizgi(ctx, iki, 1.1);
        ctx.beginPath(); ctx.moveTo(-10, -18); ctx.bezierCurveTo(-10.5, -33, -6, -37.5, 0, -37.5); ctx.bezierCurveTo(6, -37.5, 10.5, -33, 10, -18); ctx.closePath();
        boya(ctx, ana, 1.1);
        ctx.beginPath(); ctx.rect(-10.2, -22, 20.4, 2.4); boya(ctx, iki, 0.7);
        for (let x = -24; x <= 24; x += 6) if (Math.abs(x) > 11) cicek(ctx, x, -17.2, 0.75, iki, sus);
        cicek(ctx, 0, -30, 1, iki, sus);
        break;
      }
      case "vueltiao": {                                                          // sombrero vueltiao: krem, siyah halkalar
        oval(ctx, 0, -17, 24, 4.5); boya(ctx, iki, 1.1);
        for (const r of [21, 17.5]) { oval(ctx, 0, -17, r, r * 0.17); cizgi(ctx, sus, 1.3); }
        kubbe(ctx, -17.5, 10, 10, iki);
        kirpili(ctx, () => { ctx.beginPath(); ctx.moveTo(-10, -17.5); ctx.bezierCurveTo(-10.5, -30, 10.5, -30, 10, -17.5); ctx.closePath(); }, () => {
          for (const y of [-20.5, -24.5]) { ctx.beginPath(); for (let x = -11, i = 0; x <= 11; x += 2, i++) ctx.lineTo(x, y - (i % 2 ? 1.2 : 0)); cizgi(ctx, sus, 1); }
        });
        break;
      }
      case "chullo": {                                                            // And chullosu: kulaklıklar, püsküller
        for (const sx of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(sx * 10.5, -17); ctx.lineTo(sx * 17.5, -16.5); ctx.quadraticCurveTo(sx * 18, -6, sx * 14.5, -4.5); ctx.quadraticCurveTo(sx * 12, -9, sx * 11.5, -14); ctx.closePath();
          boya(ctx, ana, 1);
          const x = sx * 14.8 + Math.sin(zaman * 2 + sx) * 0.4;
          ctx.beginPath(); ctx.moveTo(sx * 14.8, -4.5); ctx.lineTo(x, 2.5); cizgi(ctx, sus, 0.9);
          daire(ctx, x, 3.4, 1.6, iki);
        }
        const yol = () => { ctx.beginPath(); ctx.moveTo(-14, -15); ctx.bezierCurveTo(-15, -33.5, 15, -33.5, 14, -15); ctx.quadraticCurveTo(0, -12.6, -14, -15); ctx.closePath(); };
        yol(); ctx.fillStyle = ana; ctx.fill();
        kirpili(ctx, yol, () => {
          ctx.fillStyle = iki; ctx.fillRect(-16, -22.8, 32, 3.2); ctx.fillStyle = sus; ctx.fillRect(-16, -27.6, 32, 2.4);
          ctx.beginPath(); for (let x = -16, i = 0; x <= 16; x += 2.2, i++) ctx.lineTo(x, -21.2 - (i % 2 ? 1.6 : 0)); cizgi(ctx, ana, 0.8);
        });
        yol(); ctx.strokeStyle = koyu(ana, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
        daire(ctx, 0, -31.8, 2.6, iki); daire(ctx, -0.8, -32.6, 0.8, acik(iki, 0.4));
        break;
      }
      default: break; // yok
    }
  }

  // ---------- aksesuarlar ----------
  function aksesuarCiz(ctx, k, a, zaman) {
    const [ana, iki, sus] = k.renk;
    switch (a) {
      case "kusak": {                                                             // bel kuşağı, düğüm ve uçlar
        kirpili(ctx, () => govdeYolu(ctx), () => { ctx.beginPath(); ctx.rect(-23, 9.8, 46, 3.4); boya(ctx, sus, 0.8); });
        daire(ctx, 9, 11.5, 1.8, koyu(sus, 0.1));
        for (const d of [0, 2]) { ctx.beginPath(); ctx.moveTo(9 + d * 0.5, 12.5); ctx.quadraticCurveTo(11 + d + Math.sin(zaman * 2 + d) * 0.5, 16, 10 + d, 19.5); cizgi(ctx, sus, 1.6); }
        break;
      }
      case "fular": {                                                             // boyun fuları
        ctx.beginPath(); ctx.moveTo(-6, 8.5); ctx.quadraticCurveTo(0, 11.5, 6, 8.5); cizgi(ctx, koyu(sus, 0.3), 3.2);
        ctx.beginPath(); ctx.moveTo(-6, 8.5); ctx.quadraticCurveTo(0, 11.5, 6, 8.5); cizgi(ctx, sus, 2.2);
        ctx.beginPath(); ctx.moveTo(3, 10.5); ctx.lineTo(7 + Math.sin(zaman * 2) * 0.4, 17); ctx.lineTo(4, 16.5); ctx.closePath(); boya(ctx, sus, 0.8);
        daire(ctx, 3, 10.4, 1.5, koyu(sus, 0.1));
        break;
      }
      case "bandana": {                                                           // kovboy boyun mendili
        ctx.beginPath(); ctx.moveTo(-9.5, 8.2); ctx.quadraticCurveTo(0, 10.8, 9.5, 8.2); ctx.lineTo(0, 16.5); ctx.closePath(); boya(ctx, sus, 0.9);
        for (const [x, y] of [[-4, 10.5], [3.5, 10.8], [0, 13.4], [-1.6, 11.6]]) daire(ctx, x, y, 0.6, "#f4f1ea");
        break;
      }
      case "maske": {                                                             // Venedik maskesi (göz delikli)
        ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(-13, -11, -6, -10); ctx.quadraticCurveTo(0, -8.4, 6, -10); ctx.quadraticCurveTo(13, -11, 14, -6);
        ctx.quadraticCurveTo(12, 0.5, 6, -0.5); ctx.quadraticCurveTo(0, -2.6, -6, -0.5); ctx.quadraticCurveTo(-12, 0.5, -14, -6); ctx.closePath();
        ctx.moveTo(-2.3, -5); ctx.ellipse(-6, -5, 3.7, 3.5, 0, 0, Math.PI * 2);
        ctx.moveTo(9.7, -5); ctx.ellipse(6, -5, 3.7, 3.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = sus; ctx.fill("evenodd");
        ctx.strokeStyle = iki; ctx.lineWidth = 1; ctx.stroke();
        for (const x of [-11, 11]) daire(ctx, x, -8, 0.8, iki);
        break;
      }
      case "yelpaze": {                                                           // kimonoda uchiwa (yuvarlak), ötekilerde katlanır yelpaze
        if (k.giysi === "kimono") {
          ctx.save(); ctx.translate(19, 13); ctx.rotate(0.35 + Math.sin(zaman * 2.2) * 0.12);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 5.5); cizgi(ctx, "#8a5a2a", 1.5);
          oval(ctx, 0, -5.5, 6.2, 6); boya(ctx, iki, 1);
          ctx.strokeStyle = koyu(iki, 0.25); ctx.lineWidth = 0.5;
          for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(i * 2.6, -10.5); ctx.stroke(); }
          cicek(ctx, 1.8, -6.5, 1.1, ana, sus);
          ctx.restore();
          break;
        }
        ctx.save(); ctx.translate(18, 10); ctx.rotate(-0.5 + Math.sin(zaman * 2.2) * 0.12);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 11, -Math.PI * 0.85, -Math.PI * 0.15); ctx.closePath(); boya(ctx, iki, 1);
        ctx.strokeStyle = koyu(iki, 0.35); ctx.lineWidth = 0.6;
        for (let i = 1; i < 7; i++) { const a = -Math.PI * 0.85 + (i / 7) * Math.PI * 0.7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, 11, -Math.PI * 0.85, -Math.PI * 0.15); cizgi(ctx, ana, 1.4);
        daire(ctx, 0, 0, 1.2, koyu(ana, 0.2));
        ctx.restore();
        break;
      }
      case "fener": {                                                             // kırmızı kâğıt fener (çubukta, ışıl ışıl)
        ctx.beginPath(); ctx.moveTo(16, 6); ctx.quadraticCurveTo(22, -6, 26, -8); cizgi(ctx, "#6a4a2a", 1.1);
        ctx.beginPath(); ctx.moveTo(26, -8); ctx.lineTo(26, -4.5); cizgi(ctx, "#6a4a2a", 0.6);
        const parla = 0.35 + 0.15 * Math.sin(zaman * 5);
        const g = ctx.createRadialGradient(26, 1, 0, 26, 1, 11); g.addColorStop(0, `rgba(255,190,90,${parla})`); g.addColorStop(1, "rgba(255,190,90,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(26, 1, 11, 0, Math.PI * 2); ctx.fill();
        oval(ctx, 26, 1, 5.6, 5.8); boya(ctx, ana, 1);
        ctx.strokeStyle = koyu(ana, 0.25); ctx.lineWidth = 0.6;
        for (const dx of [-2.6, 0, 2.6]) { ctx.beginPath(); ctx.ellipse(26, 1, Math.abs(dx) + 0.4, 5.8, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.beginPath(); ctx.rect(23.6, -5.6, 4.8, 1.6); boya(ctx, iki, 0.6);
        ctx.beginPath(); ctx.rect(23.6, 6, 4.8, 1.6); boya(ctx, iki, 0.6);
        ctx.beginPath(); ctx.moveTo(26, 7.6); ctx.lineTo(26 + Math.sin(zaman * 3) * 0.4, 11.5); cizgi(ctx, iki, 1);
        break;
      }
      case "semsiye": {                                                           // frevo şemsiyesi (renkli dilimler)
        ctx.beginPath(); ctx.moveTo(21, -4); ctx.lineTo(21.5, -24); cizgi(ctx, "#5a5a5a", 0.9);
        const renkler = ["#f2c94c", "#2f8f5a", "#c8302a", "#2f5fa0"];
        for (let i = 0; i < 4; i++) {
          const a0 = Math.PI + (i / 4) * Math.PI, a1 = Math.PI + ((i + 1) / 4) * Math.PI;
          ctx.beginPath(); ctx.moveTo(21.5, -24); ctx.ellipse(21.5, -24, 9.5, 6.5, 0, a0, a1); ctx.closePath();
          ctx.fillStyle = renkler[i]; ctx.fill();
        }
        ctx.beginPath(); ctx.ellipse(21.5, -24, 9.5, 6.5, 0, Math.PI, Math.PI * 2); ctx.closePath(); cizgi(ctx, "#3a3a3a", 0.8);
        break;
      }
      case "mate": {                                                              // mate kabağı ve bombilla
        ctx.beginPath(); ctx.moveTo(24, 6); ctx.lineTo(27.5, -3.5); cizgi(ctx, "#c9ced4", 1.1);
        oval(ctx, 23, 10, 5, 5.6); boya(ctx, "#8a5a2a", 1);
        oval(ctx, 23, 5.6, 3.4, 1.2); boya(ctx, "#5a7a2a", 0.6);
        ctx.beginPath(); ctx.moveTo(18.4, 9); ctx.quadraticCurveTo(23, 11.4, 27.6, 9); cizgi(ctx, "#c9ced4", 0.8);
        break;
      }
      case "boncukluYaka": {                                                      // boncuklu yaka (iç içe halkalar)
        for (let r = 0; r < 3; r++) {
          const y = 8.2 + r * 2.1, g = 11 + r * 1.6;
          for (let i = 0; i <= 12; i++) {
            const t = i / 12, x = -g + 2 * g * t, yy = y + Math.sin(t * Math.PI) * 2.6;
            daire(ctx, x, yy, 1, [ana, iki, sus][(i + r) % 3]);
          }
        }
        break;
      }
      case "sal": {                                                               // omuzdan çapraz şal (saçaklı)
        const yol = () => { cokgen(ctx, [[-19, 5.5], [-13, 4], [15, 16.5], [10, 19.5]]); };   // ağzın altından geçer
        kirpili(ctx, () => govdeYolu(ctx), () => {
          yol(); ctx.fillStyle = iki; ctx.fill();
          ctx.beginPath(); ctx.moveTo(-17.6, 6.2); ctx.lineTo(11.2, 18.4); cizgi(ctx, sus, 1);         // kenar şeritleri
          ctx.beginPath(); ctx.moveTo(-13.4, 5.2); ctx.lineTo(14, 15.6); cizgi(ctx, sus, 1);
          yol(); ctx.strokeStyle = koyu(iki, 0.4); ctx.lineWidth = 0.9; ctx.stroke();
        });
        ctx.beginPath(); for (let i = 0; i <= 5; i++) { const x = 10 + i * 1, y = 19.5 - i * 0.6; ctx.moveTo(x, y); ctx.lineTo(x - 0.4, y + 2.4); } cizgi(ctx, sus, 0.8);
        break;
      }
      case "pelerin": {                                                           // bişt: omuzlardan inen pelerin, sırma kenar
        const renk = koyu(sus, 0.25);
        for (const sx of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(sx * 10, -1); ctx.quadraticCurveTo(sx * 22, 0, sx * 22.5, 20); ctx.lineTo(sx * 15, 21.5); ctx.quadraticCurveTo(sx * 15.5, 8, sx * 10, -1); ctx.closePath();
          boya(ctx, renk, 1);
          ctx.beginPath(); ctx.moveTo(sx * 10, -1); ctx.quadraticCurveTo(sx * 15.5, 8, sx * 15, 21.5); cizgi(ctx, "#c8a24a", 1.4);
        }
        break;
      }
    }
  }

  // ---------- canlı katman (her karede): kurdeleler başlığın arkasında, yelpaze ve fener önde ----------
  const CANLI_AKSESUAR = new Set(["yelpaze", "fener"]);
  function canliKurdeleler(ctx, k, zaman) {
    const iki = k.renk[1];
    if (k.baslik === "cicekTaci") {
      kurdeleler(ctx, -13, -17, [iki, "#f2c94c", "#3a6ad0", "#3f8f3a"], 22, zaman, -1);
      kurdeleler(ctx, 13, -17, ["#3f8f3a", "#3a6ad0", "#f2c94c", iki], 22, zaman, 1);
    } else if (k.baslik === "krakuska") {
      kurdeleler(ctx, -11, -18, [iki, "#f2c94c", "#3a6ad0", "#3f8f3a"], 20, zaman, -1);
    }
  }

  // ---------- durağan katman: ölçek başına bir kez çizilip önbellekten basılır (spec §8) ----------
  // Sınır kutusu (birim): en geniş başlık sombrero (±34), en yüksek baş bağı (−40), en alçak ayakkabı (26)
  const KUTU = { x: -35, y: -42, w: 70, h: 69 };
  const onbellek = new WeakMap(); // kayıt → Map(katman|ölçek → tuval ya da null)
  function durganCiz(ctx, k, katman) {
    if (katman === "govde") { giysiCiz(ctx, k); ayakkabiCiz(ctx, k); return; }
    if (k.aksesuar.includes("pelerin")) aksesuarCiz(ctx, k, "pelerin", 0); // pelerin başlığın altında
    baslikCiz(ctx, k, 0);
    for (const a of k.aksesuar) if (a !== "pelerin" && !CANLI_AKSESUAR.has(a)) aksesuarCiz(ctx, k, a, 0);
  }
  // ctx'in o anki dönüşümünün ölçeği (cihaz pikseli / birim), çeyreklere yuvarlanır; tuval kurulamazsa null
  function durganResim(ctx, k, katman) {
    let ps = 1;
    try { const m = ctx.getTransform(); ps = Math.hypot(m.a, m.b); } catch (_) { ps = 1; }
    ps = Math.min(8, Math.max(0.5, Math.ceil(ps * 4) / 4));
    let harita = onbellek.get(k);
    if (!harita) { harita = new Map(); onbellek.set(k, harita); }
    const anahtar = katman + "|" + ps;
    if (!harita.has(anahtar)) {
      let c = null;
      try {
        const t = document.createElement("canvas");
        t.width = Math.ceil(KUTU.w * ps); t.height = Math.ceil(KUTU.h * ps);
        const cx = t.getContext("2d");
        if (cx && t.width === Math.ceil(KUTU.w * ps)) { cx.scale(ps, ps); cx.translate(-KUTU.x, -KUTU.y); durganCiz(cx, k, katman); c = t; }
      } catch (_) { c = null; }
      if (harita.size >= 6) harita.delete(harita.keys().next().value);
      harita.set(anahtar, c);
    }
    return harita.get(anahtar);
  }

  // Bossun kostümü: katman "govde" (giysi, ayakkabı) ya da "bas" (başlık, aksesuarlar)
  function bossKostumuCiz(ctx, s, kayit, zaman, katman) {
    if (!kostumGecerliMi(kayit)) return;
    ctx.save();
    ctx.scale(s, s);
    if (katman !== "govde") canliKurdeleler(ctx, kayit, zaman);
    const c = durganResim(ctx, kayit, katman);
    if (c) ctx.drawImage(c, KUTU.x, KUTU.y, KUTU.w, KUTU.h);
    else durganCiz(ctx, kayit, katman);
    if (katman !== "govde") for (const a of kayit.aksesuar) if (CANLI_AKSESUAR.has(a)) aksesuarCiz(ctx, kayit, a, zaman);
    ctx.restore();
  }

  Object.assign(window, { KOSTUM_TURLERI, kostumGecerliMi, bossKostumuCiz });
})();
