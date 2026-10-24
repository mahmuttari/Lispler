/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: BÖLGE AİLELERİ (3.14.0)
   10 aile (spec §5.2): K Avrupa taş/tuğla kale, KS kervansaray, KP kerpiç kasaba, SH Sahel, SV savan, GA Güney Asya,
   GDA Güneydoğu Asya, DA Doğu Asya, KA Kuzey Amerika, LA Latin Amerika. Her aile:
   - bicim.duvar: iç duvar bloklarının 3.13.0 biçim ailesi ("kale" ya da "kutuk"; engeller.js engelOlustur)
   - palet: ülke paletinin altına birleşen aile renkleri (ülke üstün gelir; ulkeler.js ulkeEngelSeti)
   - duvar (iç duvar ve harita sınırı; sınırda B.yon), su (göl kıyısı; su her ülkede aynı mavi) ressamları:
     (ctx, w, h, r, p, B) -> canli[] (engel-temalari.js düzeni; p ülkenin paleti: zemin, desen, duvar, duvarKoyu,
     vurgu1, vurgu2)
   - zemin(ctx, boyut, palet): Dünya Turu'nda ızgaranın yerine döşenen soluk desen; tuval önceden zemin rengiyle dolu,
     desen kenarlarda kesintisiz (dunya-turu.js turZeminCiz)
   Eksik ressam yedek ressama, eksik zemin bugünkü ızgaraya düşer. Ressamlar Görev 5 ve 7–13'te eklenir (Görev 8: KP, SH; Görev 9: SV; Görev 11: GA, GDA;
   Görev 13: KA, LA — LA'da palet.tas "inka" Peru'nun çokgen taş örgüsünü seçer).
   Math.random yok: rastgelelik ressama verilen tohumlu r()'den. Dinî simge, yazı ve bayrak yok.
   engel-temalari.js'ten sonra, ulkeler.js'ten önce yüklenir.
   ============================================================ */
(function () {
  const { doldur, cizgi, kirp, kenarNoktalari, icNoktalar, karistir, acik, koyu, elips, yuvarlak, tasOrgu, suTabani, kayalikKenar, cimTutami } = window.ENGEL;

  // ---------- ortak ----------
  // Sivri kemer (kervansaray nişi): taban (cx, alt), genişlik g, tepe y'si ust
  function sivriKemer(ctx, cx, ust, alt, g) {
    const yan = ust + g * 0.75;
    ctx.beginPath(); ctx.moveTo(cx - g / 2, alt); ctx.lineTo(cx - g / 2, yan);
    ctx.quadraticCurveTo(cx - g / 2, ust + g * 0.15, cx, ust);
    ctx.quadraticCurveTo(cx + g / 2, ust + g * 0.15, cx + g / 2, yan);
    ctx.lineTo(cx + g / 2, alt); ctx.closePath();
  }
  // Küçük eşkenar dörtgen (çini süsü)
  function baklava(ctx, x, y, s, renk) {
    ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill();
  }
  // Çarpı işleme ilmeği (kuşaktaki el işi süsü)
  function capraz(ctx, x, y, s, renk) {
    ctx.strokeStyle = renk; ctx.lineWidth = 0.8; ctx.lineCap = "round"; ctx.beginPath();
    ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
  }

  // ================= K — AVRUPA KALESİ =================
  // Taş mı tuğla mı: palet.malzeme yoksa duvar renginden (kırmızımsı → tuğla: PL, IT, ES). Mazgal palet.mazgal:
  // "kare" (varsayılan) ya da "kirlangic" (kırlangıç kuyruğu: IT, RU). Kule külahı palet.cati (yoksa tuğlada kiremit,
  // taşta arduvaz rengi); bayrak yok, külahın tepesinde yalnız topuz.
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const tuglaMi = (p) => (p.malzeme ? p.malzeme === "tugla" : (([kr, ye]) => kr > ye * 1.25)(rgb(p.duvar)));
  // Örgü çizgileri: tuğlada sık ve düzenli, taşta iri ve kaymalı bloklar
  function orguCiz(ctx, x0, y0, w, h, renk, tugla, r) {
    ctx.strokeStyle = renk; ctx.lineWidth = tugla ? 0.8 : 1;
    const sira = tugla ? 4.5 : 7, en = tugla ? 9 : 15;
    for (let y = y0 + sira, k = 0; y < y0 + h + sira; y += sira, k++) {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
      const kay = tugla ? (k % 2) * en / 2 : r() * en;
      for (let x = x0 + kay; x < x0 + w; x += tugla ? en : en * (0.7 + r() * 0.6)) { ctx.beginPath(); ctx.moveTo(x, y - sira); ctx.lineTo(x, y); ctx.stroke(); }
    }
  }
  // Kırlangıç kuyruğu mazgal: üst kenarı V oyuklu dikdörtgen
  function kirlangicMazgal(ctx, x, y, w, h, renk) {
    ctx.fillStyle = renk; ctx.beginPath();
    ctx.moveTo(x, y + h); ctx.lineTo(x, y); ctx.lineTo(x + w * 0.38, y); ctx.lineTo(x + w / 2, y + h * 0.45);
    ctx.lineTo(x + w * 0.62, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
  }
  // Duvar: örgülü ön yüz ve kemerli pencereler; örgülü üst yüz, nöbet yolu gölgesi, mazgallar; külahlı kuleler
  function avrupaKalesi(ctx, w, h, r, p, B) {
    if (B.yon) return avrupaSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0], tugla = tuglaMi(p), kirlangic = p.mazgal === "kirlangic";
    const cati = p.cati || (tugla ? "#9c3f26" : "#4f5a68");
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(p.duvarKoyu, 0.45), 3, 0, d);                     // ön yüz
    doldur(ctx, B, p.duvarKoyu, 0, d);
    kirp(ctx, B, () => orguCiz(ctx, 0, 0, w, h + d, koyu(p.duvarKoyu, 0.3), tugla, r), 0, d);
    if (govde.t === "k") {                                                // kemerli pencereler: koyu cam, açık taş çerçeve
      const altY = govde.y + govde.h, n = Math.max(1, Math.floor(govde.w / 42));
      kirp(ctx, B, () => {
        for (let i = 0; i < n; i++) {
          const cx = govde.x + govde.w * (i + 0.5) / n, pw = 8, ph = Math.max(5, d - 7), py = altY + 3;
          ctx.fillStyle = acik(p.duvarKoyu, 0.35); yuvarlak(ctx, cx - pw / 2 - 1.5, py - 1, pw + 3, ph + 2, 5); ctx.fill();
          ctx.fillStyle = "#26324a"; yuvarlak(ctx, cx - pw / 2, py, pw, ph, 4); ctx.fill();
          ctx.fillStyle = "rgba(190, 215, 255, 0.35)"; ctx.fillRect(cx - pw / 2 + 1.5, py + 2.5, 1.6, ph - 4);
        }
      }, 0, d);
    }
    cizgi(ctx, B, koyu(p.duvar, 0.5), 3);                                 // üst yüz
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      orguCiz(ctx, 0, 0, w, h, koyu(p.duvar, 0.12), tugla, r);
      if (govde.t === "k") { ctx.fillStyle = "rgba(0,0,0,0.13)"; yuvarlak(ctx, govde.x + 8, govde.y + 6, govde.w - 16, govde.h - 12, govde.rr * 0.6); ctx.fill(); }
    });
    for (const q of B) if (q.t === "k" && q !== govde) {                  // mazgallar
      if (kirlangic) {
        kirlangicMazgal(ctx, q.x, q.y, q.w, q.h - 3, acik(p.duvar, 0.28));
        kirlangicMazgal(ctx, q.x + 1.5, q.y + 1, q.w - 3, 2.2, acik(p.duvar, 0.5));
      } else {
        ctx.fillStyle = acik(p.duvar, 0.28); yuvarlak(ctx, q.x, q.y, q.w, q.h - 3, q.rr); ctx.fill();
        ctx.fillStyle = acik(p.duvar, 0.5); yuvarlak(ctx, q.x + 1.5, q.y + 1, q.w - 3, 2.5, 1.2); ctx.fill();
      }
    }
    for (const t of B.kuleler || []) {                                    // kule: taş halka, konik külah, topuz
      const cx = t.x, cy = t.y, tr = t.r;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) elips(ctx, cx + Math.cos(a) * (tr - 2.5), cy + Math.sin(a) * (tr - 2.5), 3.2, 3.2, acik(p.duvar, 0.3));
      const g = ctx.createRadialGradient(cx - tr * 0.3, cy - tr * 0.3, 1, cx, cy, tr * 0.78);
      g.addColorStop(0, acik(cati, 0.4)); g.addColorStop(1, koyu(cati, 0.25));
      elips(ctx, cx, cy, tr * 0.72, tr * 0.72, g);
      ctx.strokeStyle = koyu(cati, 0.4); ctx.lineWidth = 0.9;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 2, cy + Math.sin(a) * 2); ctx.lineTo(cx + Math.cos(a) * tr * 0.72, cy + Math.sin(a) * tr * 0.72); ctx.stroke(); }
      elips(ctx, cx, cy, 2.4, 2.4, "#d4a73a"); elips(ctx, cx - 0.7, cy - 0.7, 0.9, 0.9, "#fff2b3");
    }
    return [];
  }
  // Harita sınırı: örgülü sur; mazgal başları yuvarlak (kırlangıçta V oyuklu)
  function avrupaSuru(ctx, w, h, r, p, B) {
    const tugla = tuglaMi(p);
    cizgi(ctx, B, koyu(p.duvar, 0.6), 3);
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => orguCiz(ctx, 0, 0, w, h, koyu(p.duvar, 0.12), tugla, r));
    for (const q of B) if (q.t === "d") {
      elips(ctx, q.x, q.y, q.r - 1.5, q.r - 1.5, acik(p.duvar, 0.28));
      if (p.mazgal === "kirlangic") { ctx.fillStyle = koyu(p.duvar, 0.2); ctx.beginPath(); ctx.moveTo(q.x - q.r * 0.35, q.y - q.r + 1.5); ctx.lineTo(q.x, q.y); ctx.lineTo(q.x + q.r * 0.35, q.y - q.r + 1.5); ctx.closePath(); ctx.fill(); }
      else elips(ctx, q.x - 1.5, q.y - 1.5, q.r * 0.4, q.r * 0.3, acik(p.duvar, 0.5));
    }
    return [];
  }
  // Su: kesme taş rıhtım (derzli taş şerit) ve demir bağlama babaları
  function tasRihtim(ctx, w, h, r, p, B) {
    const tas = karistir(p.duvar, "#9aa0a6", 0.45);
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(tas, 0.45), 0, 0, 9);
      doldur(ctx, B, tas, 0, 0, 7.5);
      kenarNoktalari(B, 8, 4).forEach((k, i) => {                        // derzler ve taş tonları
        ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(Math.atan2(k.ny, k.nx));
        ctx.fillStyle = i % 3 ? acik(tas, 0.08) : koyu(tas, 0.06); ctx.fillRect(-3.4, -3.6, 6.8, 7.2);
        ctx.fillStyle = koyu(tas, 0.35); ctx.fillRect(-3.8, -3.6, 0.8, 7.2);
        ctx.restore();
      });
      kenarNoktalari(B, 46, 6).forEach((k) => {                          // bağlama babaları
        elips(ctx, k.x + 0.8, k.y + 1.2, 2.6, 2.2, "rgba(0,0,0,0.35)");
        elips(ctx, k.x, k.y, 2.4, 2.4, "#2f3438"); elips(ctx, k.x - 0.6, k.y - 0.7, 0.9, 0.9, "#8a9399");
      });
    }, koyu(tas, 0.6));
    return [];
  }
  // Zemin: Arnavut kaldırımı — 8 sıra yuvarlak taş, sıralar kaydırmalı; genişlikler her sırada 96'yı tam böler
  function arnavutKaldirimi(ctx, n, p) {
    const sira = n / 8, enler = [[12, 14, 10, 13, 11, 12, 14, 10], [11, 13, 12, 10, 14, 12, 11, 13], [14, 10, 12, 12, 13, 11, 10, 14],
      [10, 12, 14, 11, 12, 13, 12, 12]];
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1.3;
    for (let j = 0; j < 8; j++) {
      let x = (j * 7) % n;
      for (const en of enler[j % 4]) {
        for (const dx of [-n, 0]) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + dx + 1, j * sira + 1, en - 2, sira - 2, 4); ctx.stroke(); }
        x += en;
      }
    }
  }

  // ================= KS — KERVANSARAY =================
  // Duvar: kesme taş ön yüz, mavi çini kuşak, sivri kemerli nişler; üst yüz düzgün taş, mazgallar, çini halkalı kuleler
  function kervansarayDuvari(ctx, w, h, r, p, B) {
    if (B.yon) return kervansaraySuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0];
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(p.duvarKoyu, 0.45), 3, 0, d);                     // ön yüz
    doldur(ctx, B, p.duvarKoyu, 0, d);
    kirp(ctx, B, () => {
      ctx.strokeStyle = koyu(p.duvarKoyu, 0.32); ctx.lineWidth = 1;     // kesme taş sıraları
      for (let y = 5, k = 0; y < h + d; y += 6, k++) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        for (let x = (k % 2) * 7; x < w; x += 14) { ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y); ctx.stroke(); }
      }
    }, 0, d);
    if (govde.t === "k") {
      const altY = govde.y + govde.h;                                     // üst yüzün alt kenarı: ön yüz buradan d iner
      kirp(ctx, B, () => {
        ctx.fillStyle = p.kusak || p.vurgu1; ctx.fillRect(0, altY + 1, w, 4);   // çini kuşak; palet.kusak varsa işleme kuşağı
        if (p.kusak) for (let x = 3, i = 0; x < w; x += 4.5, i++) capraz(ctx, x, altY + 3, 1.2, i % 2 ? "#1f1a14" : "#f4ecd8");
        else for (let x = 3.5, i = 0; x < w; x += 7, i++) baklava(ctx, x, altY + 3, 1.5, i % 2 ? "#f4f1ea" : p.vurgu2);
        const n = Math.max(1, Math.floor(govde.w / 30));                   // sivri kemerli nişler
        for (let i = 0; i < n; i++) {
          const cx = govde.x + govde.w * (i + 0.5) / n, g = 8;
          sivriKemer(ctx, cx, altY + 7, altY + d - 1, g); ctx.fillStyle = koyu(p.duvarKoyu, 0.5); ctx.fill();
          sivriKemer(ctx, cx, altY + 8.5, altY + d - 1, g - 3); ctx.fillStyle = koyu(p.vurgu1, 0.35); ctx.fill();
        }
      }, 0, d);
    }
    cizgi(ctx, B, koyu(p.duvar, 0.5), 3);                                 // üst yüz
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      tasOrgu(ctx, 0, 0, w, h, 11, koyu(p.duvar, 0.04), r);
      if (govde.t === "k") { ctx.fillStyle = "rgba(0,0,0,0.12)"; yuvarlak(ctx, govde.x + 8, govde.y + 6, govde.w - 16, govde.h - 12, govde.rr * 0.6); ctx.fill(); }
    });
    for (const q of B) if (q.t === "k" && q !== govde) {                  // mazgallar: açık taş, çini uç
      ctx.fillStyle = acik(p.duvar, 0.3); yuvarlak(ctx, q.x, q.y, q.w, q.h - 3, q.rr); ctx.fill();
      ctx.fillStyle = p.vurgu1; yuvarlak(ctx, q.x + 1.5, q.y + 1, q.w - 3, 2.5, 1.2); ctx.fill();
    }
    for (const t of B.kuleler || []) {                                    // kule: taş halka, çini halka, sekizgen tepe
      const cx = t.x, cy = t.y, tr = t.r;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) elips(ctx, cx + Math.cos(a) * (tr - 2.5), cy + Math.sin(a) * (tr - 2.5), 3.2, 3.2, acik(p.duvar, 0.3));
      elips(ctx, cx, cy, tr * 0.72, tr * 0.72, p.vurgu1);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4; ctx.lineTo(cx + Math.cos(a) * tr * 0.55, cy + Math.sin(a) * tr * 0.55); }
      ctx.closePath(); ctx.fillStyle = koyu(p.duvar, 0.15); ctx.fill();
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; baklava(ctx, cx + Math.cos(a) * tr * 0.63, cy + Math.sin(a) * tr * 0.63, 1.2, "#f4f1ea"); }
      elips(ctx, cx - tr * 0.15, cy - tr * 0.15, tr * 0.18, tr * 0.14, acik(p.duvar, 0.35));
    }
    return [];
  }
  // Harita sınırı: kesme taş sur, haritaya bakan kenarda çini şerit ve yuvarlak mazgal başları
  function kervansaraySuru(ctx, w, h, r, p, B) {
    cizgi(ctx, B, koyu(p.duvar, 0.6), 3);
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      tasOrgu(ctx, 0, 0, w, h, 10, p.duvar, r);
      ctx.fillStyle = p.kusak || p.vurgu1;
      if (B.yon === "ust") ctx.fillRect(0, h - 13, w, 3); else if (B.yon === "alt") ctx.fillRect(0, 10, w, 3);
      else if (B.yon === "sol") ctx.fillRect(w - 13, 0, 3, h); else ctx.fillRect(10, 0, 3, h);
    });
    for (const q of B) if (q.t === "d") { elips(ctx, q.x, q.y, q.r - 1.5, q.r - 1.5, acik(p.duvar, 0.28)); elips(ctx, q.x, q.y, q.r * 0.45, q.r * 0.45, p.vurgu1); }
    return [];
  }
  // Su: mermer kenarlı, mavi-beyaz çini bordürlü havuz
  function ciniliHavuz(ctx, w, h, r, p, B) {
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(p.duvar, 0.35), 0, 0, 9);
      doldur(ctx, B, acik(p.duvar, 0.35), 0, 0, 7.5);
      kenarNoktalari(B, 5, 4).forEach((k, i) => {
        ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(Math.atan2(k.ny, k.nx));
        ctx.fillStyle = i % 2 ? "#f4f1ea" : p.vurgu1; ctx.fillRect(-2, -2.2, 4, 4.4);
        ctx.restore();
      });
    }, koyu(p.vurgu1, 0.55));
    return [];
  }
  // Zemin: lale çinisi; baklava ızgarası, her baklavada üç dilimli üslup lale (sap ve iki yaprak), ızgara düğümlerinde
  // nokta. Köşelerdeki laleler döşemenin kenarından taşar, komşu karoda tamamlanır: döşeme kesintisiz. (Önceki sekiz
  // köşeli yıldız, iki kare ve halka, dinî bir işarete (Rub el-Hizb) benzediği için kaldırıldı; spec §4.6.)
  function geometrikCini(ctx, n, p) {
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
    const lale = (cx, cy, s) => {
      const y = cy - s * 0.22;
      ctx.beginPath();                                                                                    // çanak
      ctx.moveTo(cx - s * 0.42, y - s * 0.2);
      ctx.quadraticCurveTo(cx - s * 0.46, y + s * 0.26, cx, y + s * 0.28);
      ctx.quadraticCurveTo(cx + s * 0.46, y + s * 0.26, cx + s * 0.42, y - s * 0.2);
      ctx.lineTo(cx + s * 0.2, y - s * 0.02); ctx.lineTo(cx, y - s * 0.32); ctx.lineTo(cx - s * 0.2, y - s * 0.02);
      ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, y + s * 0.28); ctx.lineTo(cx, y + s * 0.8); ctx.stroke();              // sap
      for (const k of [-1, 1]) {                                                                          // yapraklar
        ctx.beginPath(); ctx.moveTo(cx, y + s * 0.74); ctx.quadraticCurveTo(cx + k * s * 0.38, y + s * 0.62, cx + k * s * 0.42, y + s * 0.34); ctx.stroke();
      }
    };
    for (const [x, y] of [[n / 2, n / 2], [0, 0], [n, 0], [0, n], [n, n]]) lale(x, y, n * 0.27);
    ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
    for (const [a, b] of [[[0, n / 2], [n / 2, 0]], [[n / 2, 0], [n, n / 2]], [[n, n / 2], [n / 2, n]], [[n / 2, n], [0, n / 2]]]) {
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = p.desen;
    for (const [x, y] of [[n / 2, 0], [n / 2, n], [0, n / 2], [n, n / 2]]) { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill(); }
  }

  // ================= DA — DOĞU ASYA =================
  // Kiremit sıraları: (x0, y0)–(x1, y1) dikdörtgenini yarım daire uçlu kiremitlerle kaplar
  function kiremitler(ctx, x0, y0, x1, y1, renk, sira = 5) {
    for (let y = y0, k = 0; y < y1 + sira; y += sira, k++) {
      for (let x = x0 - (k % 2) * 3; x < x1 + 6; x += 6) {
        ctx.fillStyle = k % 2 ? renk : koyu(renk, 0.08);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + sira * 0.6); ctx.arc(x + 3, y + sira * 0.6, 3, Math.PI, 0, true); ctx.lineTo(x + 6, y); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = koyu(renk, 0.35); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    }
  }
  // Duvar: taş temel üstünde sıvalı ön yüz ve kafesli küçük pencereler; üst yüz kiremit çatı, sırt, açık saçak;
  // köşelerde kıvrık uçlu yuvarlak kule çatıları
  function catiliDuvar(ctx, w, h, r, p, B) {
    if (B.yon) return catiliSur(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0], cati = p.vurgu2;
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(p.duvarKoyu, 0.4), 3, 0, d);                      // ön yüz: sıva ve taş temel
    doldur(ctx, B, p.duvar, 0, d);
    if (govde.t === "k") {
      const altY = govde.y + govde.h;
      kirp(ctx, B, () => {
        ctx.fillStyle = p.duvarKoyu; ctx.fillRect(0, altY + d * 0.55, w, d);
        tasOrgu(ctx, 0, altY + d * 0.55, w, d, 5, p.duvarKoyu, r);
        ctx.fillStyle = koyu(cati, 0.2); ctx.fillRect(0, altY, w, 2.2);          // saçağın gölgesi
        const n = Math.max(1, Math.floor(govde.w / 26));
        for (let i = 0; i < n; i++) {
          const cx = govde.x + govde.w * (i + 0.5) / n, py = altY + 3.5, pw = 7, ph = Math.max(3, d * 0.55 - 5);
          ctx.fillStyle = koyu(p.duvarKoyu, 0.35); ctx.fillRect(cx - pw / 2, py, pw, ph);
          ctx.strokeStyle = acik(p.duvar, 0.2); ctx.lineWidth = 0.7;
          for (const dx of [-1.2, 1.2]) { ctx.beginPath(); ctx.moveTo(cx + dx, py); ctx.lineTo(cx + dx, py + ph); ctx.stroke(); }
          ctx.beginPath(); ctx.moveTo(cx - pw / 2, py + ph / 2); ctx.lineTo(cx + pw / 2, py + ph / 2); ctx.stroke();
        }
      }, 0, d);
    }
    cizgi(ctx, B, koyu(cati, 0.5), 3);                                    // üst yüz: kiremit çatı
    doldur(ctx, B, cati);
    kirp(ctx, B, () => {
      kiremitler(ctx, 0, 0, w, h, acik(cati, 0.08));
      if (govde.t === "k") {                                               // kırma çatı: dört yüz, mahyalar ve sırt
        const { x, y, w: gw, h: gh } = govde, ic = Math.min(gw, gh) / 2, yatay = gw >= gh;
        const k0 = [x, y], k1 = [x + gw, y], k2 = [x + gw, y + gh], k3 = [x, y + gh];
        const s1 = yatay ? [x + ic, y + gh / 2] : [x + gw / 2, y + ic], s2 = yatay ? [x + gw - ic, y + gh / 2] : [x + gw / 2, y + gh - ic];
        const yuzler = yatay
          ? [[[k0, k1, s2, s1], "rgba(0,0,0,0.2)"], [[k3, k0, s1], "rgba(0,0,0,0.1)"], [[k1, k2, s2], "rgba(255,255,255,0.06)"]]
          : [[[k0, k1, s1], "rgba(0,0,0,0.2)"], [[k3, k0, s1, s2], "rgba(0,0,0,0.1)"], [[k1, k2, s2, s1], "rgba(255,255,255,0.06)"]];
        for (const [kose, renk] of yuzler) {
          ctx.fillStyle = renk; ctx.beginPath(); kose.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.fill();
        }
        const mahyalar = yatay ? [[k0, s1], [k3, s1], [k1, s2], [k2, s2], [s1, s2]] : [[k0, s1], [k1, s1], [k2, s2], [k3, s2], [s1, s2]];
        for (const [kal, ren] of [[3.4, koyu(cati, 0.32)], [1.1, acik(cati, 0.3)]]) {
          ctx.strokeStyle = ren; ctx.lineWidth = kal; ctx.lineCap = "round";
          for (const [a, b] of mahyalar) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
        }
        for (const [px, py] of [s1, s2]) { elips(ctx, px, py, 2.6, 2.6, koyu(cati, 0.4)); elips(ctx, px - 0.6, py - 0.6, 1.1, 1.1, acik(cati, 0.35)); }   // sırt uçları
        ctx.fillStyle = acik(cati, 0.35); ctx.fillRect(0, y + gh - 2.5, w, 2.5);   // saçak ağzı
      }
    });
    for (const q of B) if (q.t === "k" && q !== govde) {                  // mazgallar: kiremit başlıklı sırt taşları
      ctx.fillStyle = koyu(cati, 0.2); yuvarlak(ctx, q.x, q.y, q.w, q.h - 3, q.rr); ctx.fill();
      ctx.fillStyle = acik(cati, 0.3); yuvarlak(ctx, q.x + 1.5, q.y + 1, q.w - 3, 2.5, 1.2); ctx.fill();
    }
    for (const t of B.kuleler || []) {                                    // kule çatısı: ışınsal kiremit, kıvrık uçlar
      const cx = t.x, cy = t.y, tr = t.r;
      elips(ctx, cx, cy, tr, tr, koyu(cati, 0.25));
      elips(ctx, cx, cy, tr - 1.5, tr - 1.5, acik(cati, 0.05));
      ctx.strokeStyle = koyu(cati, 0.35); ctx.lineWidth = 0.9;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * tr * 0.25, cy + Math.sin(a) * tr * 0.25); ctx.lineTo(cx + Math.cos(a) * (tr - 1.5), cy + Math.sin(a) * (tr - 1.5)); ctx.stroke(); }
      for (const a of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) {
        const x = cx + Math.cos(a) * tr, y = cy + Math.sin(a) * tr;
        ctx.strokeStyle = acik(cati, 0.35); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x - Math.cos(a) * 1.5, y - Math.sin(a) * 1.5, 1.6, a - 1.6, a + 1.2); ctx.stroke();
      }
      elips(ctx, cx, cy, tr * 0.22, tr * 0.22, p.vurgu1);
      elips(ctx, cx - tr * 0.06, cy - tr * 0.06, tr * 0.08, tr * 0.08, acik(p.vurgu1, 0.5));
    }
    return [];
  }
  // Harita sınırı: kiremit başlıklı taş sur; mazgal başları yuvarlak kiremit uçları
  function catiliSur(ctx, w, h, r, p, B) {
    const cati = p.vurgu2;
    cizgi(ctx, B, koyu(cati, 0.55), 3);
    doldur(ctx, B, cati);
    kirp(ctx, B, () => {
      if (w > h) kiremitler(ctx, 0, -8, w, h + 8, acik(cati, 0.08));
      else { ctx.save(); ctx.translate(w, 0); ctx.rotate(Math.PI / 2); kiremitler(ctx, -8, 0, h + 8, w, acik(cati, 0.08)); ctx.restore(); }
    });
    for (const q of B) if (q.t === "d") { elips(ctx, q.x, q.y, q.r - 1.5, q.r - 1.5, acik(cati, 0.2)); elips(ctx, q.x, q.y, q.r * 0.4, q.r * 0.4, p.vurgu1); }
    return [];
  }
  // Su: taş kenarlı koi göleti; nilüfer yaprakları ve turuncu-beyaz koi balıkları
  function koiGoleti(ctx, w, h, r, p, B) {
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(p.duvarKoyu, 0.4), 0, 0, 8);
      kayalikKenar(ctx, B, acik(p.duvarKoyu, 0.25), r, 8, 4, 6.5);
      for (const k of kenarNoktalari(B, 17, 5)) elips(ctx, k.x, k.y - 2, 2.6, 1.6, "rgba(110, 160, 80, 0.75)");   // yosun
    }, koyu(p.duvarKoyu, 0.5));
    kirp(ctx, B, () => {
      for (const k of icNoktalar(B, w, h, Math.max(1, Math.round(w * h / 3800)), 8, 18, r)) {   // nilüfer yaprakları
        const s = 5 + r() * 3;
        ctx.fillStyle = "#3f7f3a"; ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.arc(k.x, k.y, s, 0.35, Math.PI * 2 - 0.05); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#5fa04f"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(k.x, k.y, s * 0.6, 0.5, Math.PI * 1.9); ctx.stroke();
      }
      for (const k of icNoktalar(B, w, h, Math.max(1, Math.min(4, Math.round(w * h / 3000))), 10, 16, r)) {   // koi
        const a = r() * Math.PI * 2, s = 5 + r() * 2;
        ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(a);
        ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(1.2, 1.6, s, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s - 3.5, -2.4); ctx.lineTo(-s - 3.5, 2.4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fff7ed"; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.ellipse(-s * 0.15, -s * 0.05, s * 0.45, s * 0.3, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(s * 0.55, 0, s * 0.28, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1f2937"; ctx.beginPath(); ctx.arc(s * 0.72, -s * 0.12, 0.6, 0, Math.PI * 2); ctx.arc(s * 0.72, s * 0.12, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    });
    return [];
  }
  // Zemin: taş döşeme (kaydırmalı sıralarda yuvarlak köşeli taşlar) ve yosun noktaları; sıralar 96'yı tam böler
  function tasDoseme(ctx, n, p) {
    const sira = n / 4, enler = [[30, 34, 32], [26, 38, 32], [34, 28, 34], [32, 30, 34]];
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1.4;
    enler.forEach((satir, j) => {
      let x = (j * 13) % n;
      for (const en of satir) {
        for (const dx of [-n, 0]) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + dx + 1.5, j * sira + 1.5, en - 3, sira - 3, 5); ctx.stroke(); }
        x += en;
      }
    });
    ctx.fillStyle = karistir(p.desen, "#4f7a3a", 0.55);
    for (const [x, y] of [[8, 23], [46, 47], [71, 22], [20, 72], [88, 70], [59, 95.5], [33, 0.5]]) {
      for (const [ox, oy] of [[0, 0], [2.2, 0.8], [-1.6, 1.4]]) { ctx.beginPath(); ctx.arc(x + ox, y + oy, 1.2, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  // ================= KP — KERPİÇ KASABA =================
  const BADANA = "#f4efe4", KIRIS = "#5a3a22";
  // Kerpiç dokusu: yumuşak sıva lekeleri ve saman kırıntıları (tek yolda)
  function kerpicDoku(ctx, w, h, renk, r) {
    for (let i = 0; i < w * h / 240; i++) elips(ctx, r() * w, r() * h, 2 + r() * 5, 1.2 + r() * 2.5, r() < 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)");
    ctx.strokeStyle = acik(renk, 0.28); ctx.lineWidth = 0.6; ctx.beginPath();
    for (let i = 0; i < w * h / 170; i++) { const x = r() * w, y = r() * h, a = r() * Math.PI; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2); }
    ctx.stroke();
  }
  // Basamaklı mazgal: koyu taban kutusu üstünde açık iki basamak, tepesi badanalı
  function basamakliMazgal(ctx, q, renk) {
    const { x, y, w } = q, h = q.h - 3;
    ctx.fillStyle = koyu(renk, 0.16); yuvarlak(ctx, x, y, w, h, 2); ctx.fill();
    ctx.fillStyle = acik(renk, 0.22); ctx.beginPath();
    ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.5); ctx.lineTo(x + w * 0.24, y + h * 0.5); ctx.lineTo(x + w * 0.24, y);
    ctx.lineTo(x + w * 0.76, y); ctx.lineTo(x + w * 0.76, y + h * 0.5); ctx.lineTo(x + w, y + h * 0.5); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = BADANA; ctx.fillRect(x + w * 0.24 + 0.4, y + 0.4, w * 0.52 - 0.8, 1.8); ctx.fillRect(x + 0.4, y + h * 0.5 + 0.3, w * 0.24, 1.2); ctx.fillRect(x + w * 0.76, y + h * 0.5 + 0.3, w * 0.24 - 0.4, 1.2);
  }
  // Çıkıntılı ahşap kiriş ucu (toron): koyu ahşap, açık üst, altında gölge
  function kirisUcu(ctx, x, y) {
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(x - 1.3, y + 2.2, 3, 1.6);
    ctx.fillStyle = KIRIS; ctx.fillRect(x - 1.5, y, 3, 2.6);
    ctx.fillStyle = "#8a6238"; ctx.fillRect(x - 1.5, y, 3, 0.9);
  }
  // Duvar: kerpiç ön yüz, üst kenarda badanalı basamak kuşağı, kiriş uçları sırası, badana çerçeveli kemerli
  // pencereler; üst yüz kerpiç dam, basamaklı mazgallar; kuleler kerpiç burç (badana halka, basamak dişleri, kiriş uçları)
  function kerpicDuvari(ctx, w, h, r, p, B) {
    if (B.yon) return kerpicSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0];
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(p.duvarKoyu, 0.45), 3, 0, d);                     // ön yüz
    doldur(ctx, B, p.duvarKoyu, 0, d);
    kirp(ctx, B, () => kerpicDoku(ctx, w, h + d, p.duvarKoyu, r), 0, d);
    if (govde.t === "k") {
      const altY = govde.y + govde.h;
      kirp(ctx, B, () => {
        ctx.fillStyle = BADANA;                                            // badanalı basamak kuşağı
        ctx.fillRect(0, altY, w, 1.6);
        for (let x = 1; x < w; x += 8) { ctx.fillRect(x, altY + 1.6, 6, 1.4); ctx.fillRect(x + 1.5, altY + 3, 3, 1.3); }
        for (let x = govde.x + 7; x < govde.x + govde.w - 4; x += 12) kirisUcu(ctx, x, altY + d * 0.42);   // kiriş uçları
        const n = Math.max(1, Math.floor(govde.w / 38));                   // kemerli pencereler
        for (let i = 0; i < n; i++) {
          const cx = govde.x + govde.w * (i + 0.5) / n, pw = 6, ph = Math.max(4, d * 0.4), py = altY + d * 0.42 + 4.5;
          if (py + ph > altY + d - 1) continue;
          ctx.fillStyle = BADANA; yuvarlak(ctx, cx - pw / 2 - 1.3, py - 1.3, pw + 2.6, ph + 2.3, 3.5); ctx.fill();
          ctx.fillStyle = "#2a1a10"; yuvarlak(ctx, cx - pw / 2, py, pw, ph, 3); ctx.fill();
          ctx.strokeStyle = "#6b4a2a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(cx, py + 1); ctx.lineTo(cx, py + ph); ctx.stroke();
        }
      }, 0, d);
    }
    cizgi(ctx, B, koyu(p.duvar, 0.5), 3);                                 // üst yüz: kerpiç dam
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      kerpicDoku(ctx, w, h, p.duvar, r);
      if (govde.t === "k") {
        ctx.fillStyle = "rgba(0,0,0,0.12)"; yuvarlak(ctx, govde.x + 7, govde.y + 6, govde.w - 14, govde.h - 12, govde.rr * 0.6); ctx.fill();
        ctx.strokeStyle = "rgba(244, 239, 228, 0.55)"; ctx.lineWidth = 1.2; yuvarlak(ctx, govde.x + 4.5, govde.y + 3.5, govde.w - 9, govde.h - 7, govde.rr * 0.7); ctx.stroke();
      }
    });
    for (const q of B) if (q.t === "k" && q !== govde) basamakliMazgal(ctx, q, p.duvar);
    for (const t of B.kuleler || []) {                                    // kerpiç burç
      const cx = t.x, cy = t.y, tr = t.r;
      for (let a = Math.PI / 4; a < Math.PI * 2; a += Math.PI / 2) {          // dışa taşan kiriş uçları
        ctx.save(); ctx.translate(cx + Math.cos(a) * tr * 0.92, cy + Math.sin(a) * tr * 0.92); ctx.rotate(a);
        ctx.fillStyle = KIRIS; ctx.fillRect(-1, -1.4, 3.6, 2.8); ctx.fillStyle = "#8a6238"; ctx.fillRect(2, -1.4, 0.8, 2.8);
        ctx.restore();
      }
      elips(ctx, cx, cy, tr * 0.8, tr * 0.8, BADANA);
      elips(ctx, cx, cy, tr * 0.68, tr * 0.68, koyu(p.duvar, 0.2));
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {                     // basamak dişleri
        ctx.save(); ctx.translate(cx + Math.cos(a) * tr * 0.84, cy + Math.sin(a) * tr * 0.84); ctx.rotate(a);
        ctx.fillStyle = acik(p.duvar, 0.22); ctx.fillRect(-1.6, -2.4, 3.2, 4.8); ctx.fillStyle = BADANA; ctx.fillRect(-0.4, -1.4, 1.4, 2.8);
        ctx.restore();
      }
      elips(ctx, cx - tr * 0.18, cy - tr * 0.18, tr * 0.22, tr * 0.16, "rgba(255,255,255,0.12)");
    }
    return [];
  }
  // Harita sınırı: kerpiç sur; haritaya bakan kenarda badana şeridi ve kiriş uçları, mazgal başları basamaklı
  function kerpicSuru(ctx, w, h, r, p, B) {
    cizgi(ctx, B, koyu(p.duvar, 0.6), 3);
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      kerpicDoku(ctx, w, h, p.duvar, r);
      ctx.fillStyle = BADANA;
      if (B.yon === "ust") ctx.fillRect(0, h - 13, w, 2.2); else if (B.yon === "alt") ctx.fillRect(0, 10.8, w, 2.2);
      else if (B.yon === "sol") ctx.fillRect(w - 13, 0, 2.2, h); else ctx.fillRect(10.8, 0, 2.2, h);
      if (B.yon === "ust" || B.yon === "alt") for (let x = 20; x < w; x += 20) kirisUcu(ctx, x, B.yon === "ust" ? h - 18 : 14);
      else for (let y = 20; y < h; y += 20) kirisUcu(ctx, B.yon === "sol" ? w - 17 : 16, y);
    });
    for (const q of B) if (q.t === "d") {
      const s = q.r - 1.5;
      ctx.fillStyle = koyu(p.duvar, 0.16); yuvarlak(ctx, q.x - s, q.y - s, s * 2, s * 2, 2); ctx.fill();
      ctx.fillStyle = acik(p.duvar, 0.22); yuvarlak(ctx, q.x - s * 0.62, q.y - s * 0.62, s * 1.24, s * 1.24, 1.5); ctx.fill();
      ctx.fillStyle = BADANA; ctx.fillRect(q.x - s * 0.3, q.y - s * 0.3, s * 0.6, s * 0.6);
    }
    return [];
  }
  // Hurma ağacı (yukarıdan): kıyıdan suya eğilen tüylü yapraklar, gövde başında turuncu hurma salkımları
  function hurma(ctx, x, y, nx, ny, s) {
    const a0 = Math.atan2(-ny, -nx);
    elips(ctx, x + 1.5, y + 1.5, s * 0.45, s * 0.32, "rgba(0,0,0,0.22)");
    ctx.lineCap = "round";
    for (let i = -3; i <= 3; i++) {
      const a = a0 + i * 0.34, boy = s * (1 - Math.abs(i) * 0.09), ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
      ctx.strokeStyle = i % 2 ? "#3d7a2e" : "#56a03c"; ctx.lineWidth = 1.1; ctx.beginPath();
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + ux * boy * 0.55 + px * 1.2, y + uy * boy * 0.55 + py * 1.2, x + ux * boy, y + uy * boy);
      for (let t = 0.25; t < 0.95; t += 0.14) {
        const bx = x + ux * boy * t, by = y + uy * boy * t, l = s * 0.26 * (1 - t * 0.55);
        ctx.moveTo(bx, by); ctx.lineTo(bx + (px + ux * 0.7) * l, by + (py + uy * 0.7) * l);
        ctx.moveTo(bx, by); ctx.lineTo(bx + (ux * 0.7 - px) * l, by + (uy * 0.7 - py) * l);
      }
      ctx.stroke();
    }
    for (const sx of [-1, 1]) {
      const a = a0 + sx * 0.6, cx = x + Math.cos(a) * s * 0.26, cy = y + Math.sin(a) * s * 0.26;
      for (let j = 0; j < 4; j++) elips(ctx, cx + (j % 2) * 1.4 - 0.7, cy + Math.floor(j / 2) * 1.3 - 0.6, 0.9, 1.1, j % 2 ? "#d0702a" : "#9a4a1a");
    }
    elips(ctx, x, y, 2.4, 2.4, "#7c5a2e"); elips(ctx, x - 0.6, y - 0.6, 1, 1, "#a07a4a");
  }
  // Su: kum kıyılı vaha; kıyıda ot tutamları, suya eğilen hurma ağaçları
  function hurmaliVaha(ctx, w, h, r, p, B) {
    const kum = karistir(p.duvar, "#ecd9a8", 0.55);
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(kum, 0.35), 0, 0, 9.5);
      doldur(ctx, B, kum, 0, 0, 8);
      kirp(ctx, B, () => { for (let i = 0; i < (w + h) * 0.8; i++) elips(ctx, r() * w, r() * h, 1.1, 0.8, r() < 0.5 ? koyu(kum, 0.25) : acik(kum, 0.3)); }, 0, 0, 8);
      for (const k of kenarNoktalari(B, 11, 6)) if (r() < 0.4) cimTutami(ctx, k.x, k.y + 1, 2.2, "#6f8f3a");
    }, koyu(kum, 0.55));
    for (const k of kenarNoktalari(B, 26, 5)) if (r() < 0.55) hurma(ctx, k.x, k.y, k.nx, k.ny, 9.5 + r() * 2.5);
    return [];
  }
  // Zemin: kum dalgası — sekiz dalgalı sırt çizgisi (yatayda 96'yı tam bölen dönemler) ve kum taneleri
  function kumDalgasi(ctx, n, p) {
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1.5; ctx.lineCap = "round";
    for (let j = 0; j < 8; j++) {
      const y0 = j * 12 + 5, faz = j * 1.7;
      ctx.beginPath();
      for (let x = 0; x <= n; x += 3) ctx.lineTo(x, y0 + Math.sin((x / n) * Math.PI * 4 + faz) * 2.4 + Math.sin((x / n) * Math.PI * 2 + faz * 2) * 1.3);
      ctx.stroke();
    }
    ctx.fillStyle = p.desen;
    for (const [x, y] of [[14, 11], [52, 22], [80, 34], [30, 46], [66, 59], [8, 70], [44, 83], [88, 90]]) { ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.arc(x + 3, y + 1.5, 0.8, 0, Math.PI * 2); ctx.fill(); }
  }

  // ================= SH — SAHEL =================
  const SAMAN = "#d9b45a";
  // Saman çatı (yukarıdan): iç içe saman halkaları, ışınsal saman çizgileri, tırtıklı saçak, tepede düğüm
  function samanCati(ctx, cx, cy, R, renk = SAMAN) {
    elips(ctx, cx + 1.4, cy + 1.8, R, R * 0.92, "rgba(0,0,0,0.25)");
    ctx.fillStyle = koyu(renk, 0.22); ctx.beginPath();
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, rr = i % 2 ? R : R + 1.4; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 3; i++) elips(ctx, cx, cy, R * (0.9 - i * 0.24), R * (0.9 - i * 0.24), i % 2 ? koyu(renk, 0.07) : renk);
    ctx.strokeStyle = koyu(renk, 0.3); ctx.lineWidth = 0.6; ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) { ctx.moveTo(cx + Math.cos(a) * R * 0.22, cy + Math.sin(a) * R * 0.22); ctx.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); }
    ctx.stroke();
    elips(ctx, cx - R * 0.25, cy - R * 0.28, R * 0.3, R * 0.2, "rgba(255,255,255,0.18)");
    elips(ctx, cx, cy, R * 0.16, R * 0.16, koyu(renk, 0.45)); elips(ctx, cx - R * 0.05, cy - R * 0.05, R * 0.06, R * 0.06, acik(renk, 0.35));
  }
  // Boyalı zikzak kuşak (açık ve koyu üçgenler)
  function zikzak(ctx, x0, y, w, yuk) {
    ctx.fillStyle = "#2a1a10"; ctx.fillRect(x0, y, w, yuk);
    ctx.fillStyle = "#efe2c4"; ctx.beginPath();
    for (let x = x0; x < x0 + w; x += yuk * 1.6) { ctx.moveTo(x, y + yuk); ctx.lineTo(x + yuk * 0.8, y); ctx.lineTo(x + yuk * 1.6, y + yuk); ctx.closePath(); }
    ctx.fill();
  }
  // Duvar: sıvalı kerpiç ön yüz, boyalı zikzak kuşak, yuvarlak delik pencereler, nem izi; üst yüz yumuşak kerpiç,
  // yuvarlak başlı mazgallar; köşelerde saman çatılı yuvarlak ambar kuleleri
  function sahelDuvari(ctx, w, h, r, p, B) {
    if (B.yon) return sahelSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0];
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(p.duvarKoyu, 0.45), 3, 0, d);                     // ön yüz
    doldur(ctx, B, p.duvarKoyu, 0, d);
    kirp(ctx, B, () => {
      kerpicDoku(ctx, w, h + d, p.duvarKoyu, r);
      ctx.strokeStyle = "rgba(0,0,0,0.09)"; ctx.lineWidth = 2; ctx.beginPath();          // yağmur izleri
      for (let x = 4 + r() * 6; x < w; x += 9 + r() * 8) { ctx.moveTo(x, 0); ctx.lineTo(x + r() * 2 - 1, h + d); }
      ctx.stroke();
    }, 0, d);
    if (govde.t === "k") {
      const altY = govde.y + govde.h;
      kirp(ctx, B, () => {
        zikzak(ctx, 0, altY + 2, w, 4);
        ctx.fillStyle = "rgba(0,0,0,0.13)"; ctx.fillRect(0, altY + d * 0.72, w, d);    // nem izi
        const n = Math.max(1, Math.floor(govde.w / 30));
        for (let i = 0; i < n; i++) {
          const cx = govde.x + govde.w * (i + 0.5) / n, cy = altY + 6 + (d - 6) * 0.45;
          elips(ctx, cx, cy, 2.8, 2.8, acik(p.duvarKoyu, 0.18)); elips(ctx, cx, cy + 0.3, 1.9, 1.9, "#1f140c");
        }
      }, 0, d);
    }
    cizgi(ctx, B, koyu(p.duvar, 0.5), 3);                                 // üst yüz
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      kerpicDoku(ctx, w, h, p.duvar, r);
      if (govde.t === "k") { ctx.fillStyle = "rgba(0,0,0,0.12)"; yuvarlak(ctx, govde.x + 7, govde.y + 6, govde.w - 14, govde.h - 12, govde.rr * 0.6); ctx.fill(); }
    });
    for (const q of B) if (q.t === "k" && q !== govde) {                  // yuvarlak başlı kerpiç mazgallar
      ctx.fillStyle = acik(p.duvar, 0.16); yuvarlak(ctx, q.x, q.y, q.w, q.h - 3, q.w / 2); ctx.fill();
      elips(ctx, q.x + q.w * 0.38, q.y + 2.6, q.w * 0.22, 1.6, "rgba(255,255,255,0.22)");
    }
    for (const t of B.kuleler || []) samanCati(ctx, t.x, t.y, t.r + 0.5);
    return [];
  }
  // Harita sınırı: kerpiç sur; haritaya bakan kenarda zikzak kuşak, mazgal başlarında küçük saman çatılar
  function sahelSuru(ctx, w, h, r, p, B) {
    cizgi(ctx, B, koyu(p.duvar, 0.6), 3);
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      kerpicDoku(ctx, w, h, p.duvar, r);
      if (B.yon === "ust") zikzak(ctx, 0, h - 15, w, 3.4); else if (B.yon === "alt") zikzak(ctx, 0, 11.6, w, 3.4);
      else { ctx.save(); ctx.translate(B.yon === "sol" ? w - 15 : 11.6, 0); ctx.rotate(Math.PI / 2); zikzak(ctx, 0, -3.4, h, 3.4); ctx.restore(); }
    });
    for (const q of B) if (q.t === "d") samanCati(ctx, q.x, q.y, q.r - 1);
    return [];
  }
  // Saz öbeği: üç sap, uçlarında tüylü başlar (kıyının yan ve alt kenarında); sap, başı kıyı payını aşmayacak boyda
  function saz(ctx, x, y, r, B) {
    for (let i = 0; i < 3; i++) {
      const dx = (i - 1) * 1.8, egik = (i - 1) * 1.5;
      const tasar = (b) => [-1.2, 0, 1.2].some((a) => window.engelUzaklik(B, x + dx + egik + Math.sin(a) * 2.6, y - b - Math.cos(a) * 2.6) > 9.5);
      let boy = 7 + r() * 4;
      while (boy >= 4 && tasar(boy)) boy -= 1;
      if (boy < 4) continue;
      ctx.strokeStyle = i === 1 ? "#4d7c0f" : "#5f8f1f"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.quadraticCurveTo(x + dx, y - boy * 0.6, x + dx + egik, y - boy); ctx.stroke();
      ctx.strokeStyle = "#a3b94a"; ctx.lineWidth = 0.7; ctx.beginPath();
      for (let a = -1.2; a <= 1.2; a += 0.6) { ctx.moveTo(x + dx + egik, y - boy); ctx.lineTo(x + dx + egik + Math.sin(a) * 2.6, y - boy - Math.cos(a) * 2.6); }
      ctx.stroke();
    }
  }
  // Su: kırmızı topraklı nehir kıyısı, toprakta çakıllar; yan ve alt kıyıda sazlık
  function sazlikNehir(ctx, w, h, r, p, B) {
    const toprak = "#a2502c";
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(toprak, 0.35), 0, 0, 9.5);
      doldur(ctx, B, toprak, 0, 0, 8);
      kirp(ctx, B, () => { for (let i = 0; i < (w + h) * 0.7; i++) elips(ctx, r() * w, r() * h, 1 + r() * 1.2, 0.8 + r() * 0.6, r() < 0.5 ? koyu(toprak, 0.3) : acik(toprak, 0.2)); }, 0, 0, 8);
    }, koyu(toprak, 0.6));
    for (const k of kenarNoktalari(B, 8, 5.5)) if (k.ny > -0.15 && r() < 0.5) saz(ctx, k.x, k.y, r, B);
    return [];
  }
  // Zemin: kırmızı toprak — ot tutamları, çakıllar ve kısa çatlaklar; kenara yakın süsler karşı kenarda da çizilir
  // Döşeme kenarına yakın süsü karşı kenarlarda da çizer (n × n döşeme kesintisiz kalsın)
  const sarmal = (n) => (x, y, fn) => { for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) if (x + dx > -8 && x + dx < n + 8 && y + dy > -8 && y + dy < n + 8) fn(x + dx, y + dy); };
  function kirmiziToprak(ctx, n, p) {
    const her = sarmal(n);
    for (const [x, y] of [[12, 16], [44, 8], [76, 22], [26, 48], [60, 52], [90, 62], [8, 82], [42, 90], [72, 84]]) her(x, y, (a, b) => window.ENGEL.cimTutami(ctx, a, b, 3.6, p.desen));
    ctx.fillStyle = p.desen;
    for (const [x, y] of [[30, 26], [58, 32], [86, 42], [16, 64], [50, 72], [82, 6], [64, 94]]) her(x, y, (a, b) => { ctx.beginPath(); ctx.ellipse(a, b, 1.8, 1.2, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1; ctx.lineCap = "round";
    for (const [x, y] of [[36, 64], [70, 12], [6, 36]]) her(x, y, (a, b) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + 4, b + 2); ctx.lineTo(a + 7, b + 1); ctx.moveTo(a + 4, b + 2); ctx.lineTo(a + 5, b + 5); ctx.stroke(); });
  }

  // ================= SV — SAVAN =================
  // Kuru taş öbeği: iri ve küçük yuvarlak taşlar, gölgeli
  function tasObegi(ctx, x, y, s, r) {
    const renkler = ["#8a8378", "#a39a8a", "#6f6a62", "#9a8a72"];
    for (const [dx, dy, k] of [[-0.6, 0.2, 0.7], [0.55, 0.25, 0.65], [0, -0.1, 0.85], [-0.25, 0.55, 0.5], [0.4, 0.6, 0.45]]) {
      const rx = s * k * 0.55, ry = rx * 0.78, px = x + dx * s * 0.7, py = y + dy * s * 0.5;
      elips(ctx, px + 0.8, py + 1.2, rx, ry, "rgba(0,0,0,0.3)");
      elips(ctx, px, py, rx, ry, renkler[Math.floor(r() * 4)]);
      elips(ctx, px - rx * 0.3, py - ry * 0.35, rx * 0.4, ry * 0.3, "rgba(255,255,255,0.2)");
    }
  }
  // Kazık başı (yukarıdan): koyu halka, açık kesik yüz
  function kazikBasi(ctx, x, y, s, renk) {
    elips(ctx, x + 0.7, y + 1, s, s, "rgba(0,0,0,0.35)");
    elips(ctx, x, y, s, s, koyu(renk, 0.25)); elips(ctx, x, y, s * 0.72, s * 0.72, acik(renk, 0.22));
    elips(ctx, x - s * 0.15, y - s * 0.15, s * 0.25, s * 0.25, acik(renk, 0.4));
  }
  // Duvar: kazık çit — ön yüzde boyları değişen kazıklar ve iki sıra bağ; üst yüz sıkışmış toprak avlu, kenar boyunca
  // kazık başları, içeride kuru taş öbekleri ve kuru ot; kütük başlarında kalın kazıklar
  function kazikCit(ctx, w, h, r, p, B) {
    if (B.yon) return kazikSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, ahsap = p.duvar, toprak = karistir(p.duvar, "#a88a5c", 0.5);
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(ahsap, 0.6), 3, 0, d);                            // ön yüz: kazıklar
    doldur(ctx, B, koyu(ahsap, 0.35), 0, d);
    kirp(ctx, B, () => {
      for (let x = 0, i = 0; x < w; x += 5.5, i++) {
        ctx.fillStyle = [koyu(ahsap, 0.1), acik(ahsap, 0.08), koyu(ahsap, 0.2)][i % 3]; ctx.fillRect(x + 0.4, (i % 3) * 1.5, 4.6, h + d);
        ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(x + 3.8, (i % 3) * 1.5, 1.2, h + d);
      }
      const alt = B[0].y + B[0].h;
      ctx.strokeStyle = "#c9a86a"; ctx.lineWidth = 1.6;
      for (const f of [0.35, 0.7]) { ctx.beginPath(); for (let x = 0, i = 0; x <= w + 5.5; x += 5.5, i++) ctx.lineTo(x, alt + d * f + (i % 2) * 0.8); ctx.stroke(); }
    }, 0, d);
    cizgi(ctx, B, koyu(ahsap, 0.6), 3);                                   // üst yüz: toprak avlu
    doldur(ctx, B, toprak);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 260; i++) elips(ctx, r() * w, r() * h, 1.5 + r() * 2.5, 1 + r() * 1.5, r() < 0.5 ? koyu(toprak, 0.1) : acik(toprak, 0.08));
      for (let i = 0; i < w * h / 500; i++) cimTutami(ctx, r() * w, r() * h, 2.2 + r() * 1.5, karistir("#b5a05a", "#000000", r() * 0.25));
    });
    for (const k of icNoktalar(B, w, h, Math.max(1, Math.round(w * h / 3500)), 12, 22, r)) tasObegi(ctx, k.x, k.y, 9 + r() * 4, r);
    for (const k of kenarNoktalari(B, 6, -3)) kazikBasi(ctx, k.x, k.y, 2.4, ahsap);
    for (const q of B) if (q.t === "d") kazikBasi(ctx, q.x, q.y, q.r - 1, ahsap);
    return [];
  }
  // Harita sınırı: toprak şerit, haritaya bakan kenara paralel kazık sırası, şeritte taşlar; mazgal başlarında kalın kazık
  function kazikSuru(ctx, w, h, r, p, B) {
    const ahsap = p.duvar, toprak = karistir(p.duvar, "#a88a5c", 0.5), yatay = B.yon === "ust" || B.yon === "alt";
    cizgi(ctx, B, koyu(ahsap, 0.6), 3);
    doldur(ctx, B, toprak);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 260; i++) elips(ctx, r() * w, r() * h, 1.5 + r() * 2.5, 1 + r() * 1.5, r() < 0.5 ? koyu(toprak, 0.1) : acik(toprak, 0.08));
      for (let i = 0; i < w * h / 700; i++) { const x = r() * w, y = r() * h, s = 1.6 + r() * 1.8; elips(ctx, x + 0.6, y + 0.8, s, s * 0.8, "rgba(0,0,0,0.3)"); elips(ctx, x, y, s, s * 0.8, ["#8a8378", "#a39a8a", "#6f6a62"][Math.floor(r() * 3)]); }
    });
    const c = B.yon === "ust" ? h - 13 : B.yon === "alt" ? 13 : B.yon === "sol" ? w - 13 : 13;
    for (let a = 4; a < (yatay ? w : h); a += 5) kazikBasi(ctx, yatay ? a : c, yatay ? c : a, 2.3, ahsap);
    for (const q of B) if (q.t === "d") kazikBasi(ctx, q.x, q.y, q.r - 1, ahsap);
    return [];
  }
  // Su: sazlıklı su birikintisi — çatlak çamur kıyı, kıyıda toynak izleri, yan ve alt kıyıda sazlar
  function sazlikBirikinti(ctx, w, h, r, p, B) {
    const camur = karistir(p.duvar, "#7a5a3a", 0.5);
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(camur, 0.3), 0, 0, 9.5);
      doldur(ctx, B, camur, 0, 0, 8);
      kirp(ctx, B, () => {
        ctx.strokeStyle = koyu(camur, 0.3); ctx.lineWidth = 0.7; ctx.beginPath();
        for (let i = 0; i < (w + h) / 5; i++) { const x = r() * w, y = r() * h; ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 7, y + (r() - 0.5) * 7); ctx.lineTo(x + (r() - 0.5) * 9, y + (r() - 0.5) * 9); }
        ctx.stroke();
      }, 0, 0, 8);
      for (const k of kenarNoktalari(B, 14, 4)) if (r() < 0.5) for (const s of [-1, 1]) elips(ctx, k.x + s * 0.9, k.y, 0.8, 1.4, koyu(camur, 0.45));   // toynak izleri
    }, koyu(camur, 0.55));
    for (const k of kenarNoktalari(B, 9, 5.5)) if (k.ny > -0.15 && r() < 0.5) saz(ctx, k.x, k.y, r, B);
    return [];
  }
  // Zemin: çatlak toprak — 4 × 4 oynak ızgaranın kırık çizgili çatlak ağı (ızgara 96'da kendini tekrarlar), kuru ot
  function catlakToprak(ctx, n, p) {
    const G = 4, A = n / G, nokta = (i, j) => {
      const ii = ((i % G) + G) % G, jj = ((j % G) + G) % G;
      return [i * A + ((ii * 37 + jj * 91) % 13) - 6, j * A + ((ii * 53 + jj * 29) % 11) - 5];
    };
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1.3; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.beginPath();
    for (let i = -1; i <= G; i++) for (let j = -1; j <= G; j++) {
      const [x, y] = nokta(i, j), [x1, y1] = nokta(i + 1, j), [x2, y2] = nokta(i, j + 1);
      ctx.moveTo(x, y); ctx.lineTo((x + x1) / 2 + 1.5, (y + y1) / 2 - 1.5); ctx.lineTo(x1, y1);
      ctx.moveTo(x, y); ctx.lineTo((x + x2) / 2 - 1.5, (y + y2) / 2 + 1); ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    const her = sarmal(n);
    for (const [x, y] of [[14, 10], [50, 36], [82, 70], [30, 80], [66, 4]]) her(x, y, (a, b) => window.ENGEL.cimTutami(ctx, a, b, 3.2, p.desen));
  }

  // ================= GA — GÜNEY ASYA =================
  // Kangura mazgal: yaprak biçimli, sivri tepeli mazgal
  function kangura(ctx, x, y, w, h, renk, acikR) {
    ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.45);
    ctx.quadraticCurveTo(x, y + h * 0.1, x + w / 2, y); ctx.quadraticCurveTo(x + w, y + h * 0.1, x + w, y + h * 0.45); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = acikR; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 1.5); ctx.quadraticCurveTo(x + w * 0.22, y + h * 0.25, x + w * 0.3, y + h * 0.5);
    ctx.lineTo(x + w * 0.7, y + h * 0.5); ctx.quadraticCurveTo(x + w * 0.78, y + h * 0.25, x + w / 2, y + 1.5); ctx.fill();
  }
  // Köşk (çatri) kubbesi, yukarıdan: saçak halkası, dilimli kubbe, sütun başları, altın tepelik
  function kosk(ctx, cx, cy, R, renk) {
    elips(ctx, cx + 1.4, cy + 1.8, R, R * 0.92, "rgba(0,0,0,0.25)");
    elips(ctx, cx, cy, R, R, koyu(renk, 0.25));
    elips(ctx, cx, cy, R * 0.86, R * 0.86, acik(renk, 0.1));
    const g = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, 1, cx, cy, R * 0.7);
    g.addColorStop(0, acik(renk, 0.45)); g.addColorStop(1, koyu(renk, 0.1));
    elips(ctx, cx, cy, R * 0.68, R * 0.68, g);
    ctx.strokeStyle = koyu(renk, 0.2); ctx.lineWidth = 0.7; ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { ctx.moveTo(cx + Math.cos(a) * R * 0.15, cy + Math.sin(a) * R * 0.15); ctx.lineTo(cx + Math.cos(a) * R * 0.66, cy + Math.sin(a) * R * 0.66); }
    ctx.stroke();
    for (let a = Math.PI / 4; a < Math.PI * 2; a += Math.PI / 2) elips(ctx, cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78, R * 0.1, R * 0.1, koyu(renk, 0.35));
    elips(ctx, cx, cy, R * 0.14, R * 0.14, "#d4a73a"); elips(ctx, cx - R * 0.04, cy - R * 0.04, R * 0.05, R * 0.05, "#fff2b3");
  }
  // Duvar: kumtaşı (palet.malzeme "tugla": tuğla) ön yüz, çıkıntılı saçak ve gölgesi, kafesli kemerli pencereler; üst yüz
  // düz taş, beyaz mermer kakma kenar çizgisi, kangura mazgallar; köşelerde kubbeli köşk kuleleri
  function guneyAsyaDuvari(ctx, w, h, r, p, B) {
    if (B.yon) return guneyAsyaSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0], tugla = p.malzeme === "tugla", mermer = "#f1e6d2";
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(p.duvarKoyu, 0.45), 3, 0, d);                     // ön yüz
    doldur(ctx, B, p.duvarKoyu, 0, d);
    kirp(ctx, B, () => (tugla ? orguCiz(ctx, 0, 0, w, h + d, koyu(p.duvarKoyu, 0.3), true, r) : tasOrgu(ctx, 0, 0, w, h + d, 7, p.duvarKoyu, r)), 0, d);
    if (govde.t === "k") {
      const altY = govde.y + govde.h;
      kirp(ctx, B, () => {
        ctx.fillStyle = acik(p.duvar, 0.18); ctx.fillRect(0, altY, w, 2.6);                 // saçak (çhajja) ve gölgesi
        ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(0, altY + 2.6, w, 2);
        const n = Math.max(1, Math.floor(govde.w / 30));
        for (let i = 0; i < n; i++) {                                                       // kafesli (cali) pencereler
          const cx = govde.x + govde.w * (i + 0.5) / n, pw = 7, py = altY + 6, ph = Math.max(4, d - 9);
          if (ph < 4) continue;
          ctx.fillStyle = acik(p.duvar, 0.3); ctx.beginPath(); ctx.moveTo(cx - pw / 2 - 1.2, py + ph + 0.5); ctx.lineTo(cx - pw / 2 - 1.2, py + pw / 2); ctx.arc(cx, py + pw / 2, pw / 2 + 1.2, Math.PI, 0); ctx.lineTo(cx + pw / 2 + 1.2, py + ph + 0.5); ctx.closePath(); ctx.fill();
          ctx.save(); ctx.beginPath(); ctx.moveTo(cx - pw / 2, py + ph); ctx.lineTo(cx - pw / 2, py + pw / 2); ctx.arc(cx, py + pw / 2, pw / 2, Math.PI, 0); ctx.lineTo(cx + pw / 2, py + ph); ctx.closePath();
          ctx.fillStyle = koyu(p.duvarKoyu, 0.45); ctx.fill(); ctx.clip();
          ctx.strokeStyle = acik(p.duvar, 0.35); ctx.lineWidth = 0.5; ctx.beginPath();
          for (let k = -ph; k < pw + ph; k += 2) { ctx.moveTo(cx - pw / 2 + k, py); ctx.lineTo(cx - pw / 2 + k - ph, py + ph); ctx.moveTo(cx - pw / 2 + k - ph, py); ctx.lineTo(cx - pw / 2 + k, py + ph); }
          ctx.stroke(); ctx.restore();
        }
      }, 0, d);
    }
    cizgi(ctx, B, koyu(p.duvar, 0.5), 3);                                 // üst yüz
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      if (tugla) orguCiz(ctx, 0, 0, w, h, koyu(p.duvar, 0.12), true, r); else tasOrgu(ctx, 0, 0, w, h, 12, koyu(p.duvar, 0.04), r);
      if (govde.t === "k") {
        ctx.fillStyle = "rgba(0,0,0,0.12)"; yuvarlak(ctx, govde.x + 8, govde.y + 7, govde.w - 16, govde.h - 14, govde.rr * 0.6); ctx.fill();
        ctx.strokeStyle = mermer; ctx.globalAlpha = 0.75; ctx.lineWidth = 1.3; yuvarlak(ctx, govde.x + 4.5, govde.y + 3.5, govde.w - 9, govde.h - 7, govde.rr * 0.7); ctx.stroke(); ctx.globalAlpha = 1;
      }
    });
    for (const q of B) if (q.t === "k" && q !== govde) kangura(ctx, q.x, q.y, q.w, q.h - 3, acik(p.duvar, 0.2), acik(p.duvar, 0.45));
    for (const t of B.kuleler || []) kosk(ctx, t.x, t.y, t.r * 0.95, acik(p.duvar, 0.12));
    return [];
  }
  // Harita sınırı: kumtaşı ya da tuğla sur; haritaya bakan kenarda mermer kakma şerit, mazgal başlarında küçük köşkler
  function guneyAsyaSuru(ctx, w, h, r, p, B) {
    const tugla = p.malzeme === "tugla";
    cizgi(ctx, B, koyu(p.duvar, 0.6), 3);
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      if (tugla) orguCiz(ctx, 0, 0, w, h, koyu(p.duvar, 0.12), true, r); else tasOrgu(ctx, 0, 0, w, h, 10, p.duvar, r);
      ctx.fillStyle = "#f1e6d2";
      if (B.yon === "ust") ctx.fillRect(0, h - 13, w, 2); else if (B.yon === "alt") ctx.fillRect(0, 11, w, 2);
      else if (B.yon === "sol") ctx.fillRect(w - 13, 0, 2, h); else ctx.fillRect(11, 0, 2, h);
    });
    for (const q of B) if (q.t === "d") kosk(ctx, q.x, q.y, q.r - 1.2, acik(p.duvar, 0.12));
    return [];
  }
  // Su: basamaklı havuz (basamaklı kuyu kenarı): suya inen ışıklı basamak ve gölgeli rıht halkaları
  function basamakliHavuz(ctx, w, h, r, p, B) {
    const tas = p.malzeme === "tugla" ? p.duvar : karistir(p.duvar, "#d8b48a", 0.4);
    suTabani(ctx, w, h, r, B, () => {
      for (const [b, renk] of [[9.5, koyu(tas, 0.4)], [8.2, acik(tas, 0.12)], [6.6, koyu(tas, 0.22)], [5.3, acik(tas, 0.05)], [3.7, koyu(tas, 0.18)]]) doldur(ctx, B, renk, 0, 0, b);
      for (const k of kenarNoktalari(B, 14, 7.4)) baklava(ctx, k.x, k.y, 1.1, "#f1e6d2");
    }, koyu(tas, 0.5));
    return [];
  }
  // Zemin: kumtaşı döşeme — kaydırmalı dikdörtgen levhalar (96'yı tam bölen), kesişimlerde küçük kakma baklavalar
  function kumtasiDoseme(ctx, n, p) {
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1.2;
    for (let j = 0; j < 4; j++) for (let x = (j % 2) * 16 - 32; x < n + 32; x += 32) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, x + 1.2, j * 24 + 1.2, 29.6, 21.6, 1.5); ctx.stroke(); }
    for (let j = 0; j <= 4; j++) for (let x = (j % 2) * 16; x <= n; x += 32) baklava(ctx, x, j * 24, 2.2, p.desen);
  }

  // ================= GDA — GÜNEYDOĞU ASYA =================
  const BAMBU = "#a9a35a", SICIM = "#d9c48a";
  // Bambu sapı: gövde, ışık çizgisi ve boğum halkaları
  function bambu(ctx, x0, y0, x1, y1, en, renk = BAMBU) {
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    ctx.lineCap = "butt"; ctx.strokeStyle = renk; ctx.lineWidth = en; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = acik(renk, 0.3); ctx.lineWidth = en * 0.25; ctx.beginPath(); ctx.moveTo(x0 - uy * en * 0.22, y0 + ux * en * 0.22); ctx.lineTo(x1 - uy * en * 0.22, y1 + ux * en * 0.22); ctx.stroke();
    ctx.strokeStyle = koyu(renk, 0.35); ctx.lineWidth = 0.9; ctx.beginPath();
    for (let t = 5 + ((x0 * 3 + y0 * 7) % 4); t < L; t += 9) { const px = x0 + ux * t, py = y0 + uy * t; ctx.moveTo(px - uy * en / 2, py + ux * en / 2); ctx.lineTo(px + uy * en / 2, py - ux * en / 2); }
    ctx.stroke();
  }
  // Ahşap direk başı (yukarıdan): koyu halka, açık kesik, sicim sargısı
  function direkBasi(ctx, x, y, s, renk) {
    elips(ctx, x + 0.8, y + 1.1, s, s, "rgba(0,0,0,0.35)");
    elips(ctx, x, y, s, s, koyu(renk, 0.3)); elips(ctx, x, y, s * 0.7, s * 0.7, acik(renk, 0.15));
    ctx.strokeStyle = SICIM; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, s * 0.88, 0.2, 2.6); ctx.stroke();
  }
  // Duvar: bambu çit — ön yüzde dikey bambular ve iki sıra sicim bağ; üst yüzde yatay bambu demetleri ve çapraz bağlar;
  // kütük başlarında ahşap direkler
  function bambuCit(ctx, w, h, r, p, B) {
    if (B.yon) return bambuSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0;
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(BAMBU, 0.6), 3, 0, d);                            // ön yüz
    doldur(ctx, B, koyu(BAMBU, 0.35), 0, d);
    kirp(ctx, B, () => {
      for (let x = 2.5, i = 0; x < w + 3; x += 5, i++) bambu(ctx, x, 0, x, h + d, 4.2, i % 3 ? koyu(BAMBU, 0.08) : BAMBU);
      const alt = B[0].y + B[0].h;
      ctx.strokeStyle = SICIM; ctx.lineWidth = 1.4;
      for (const f of [0.35, 0.72]) { ctx.beginPath(); ctx.moveTo(0, alt + d * f); ctx.lineTo(w, alt + d * f); ctx.stroke(); }
    }, 0, d);
    cizgi(ctx, B, koyu(BAMBU, 0.6), 3);                                   // üst yüz: yatay bambu demetleri
    doldur(ctx, B, koyu(BAMBU, 0.25));
    kirp(ctx, B, () => {
      for (let y = 2.5, i = 0; y < h + 3; y += 5, i++) bambu(ctx, -2, y, w + 2, y, 4.2, i % 3 ? BAMBU : acik(BAMBU, 0.08));
      ctx.strokeStyle = SICIM; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 14; x < w; x += 22) for (let y = 4; y < h; y += 15) { ctx.moveTo(x - 2.5, y - 2.5); ctx.lineTo(x + 2.5, y + 2.5); ctx.moveTo(x + 2.5, y - 2.5); ctx.lineTo(x - 2.5, y + 2.5); }
      ctx.stroke();
    });
    for (const q of B) if (q.t === "d") direkBasi(ctx, q.x, q.y, q.r - 1, p.duvarKoyu);
    return [];
  }
  // Harita sınırı: şerit boyunca bambu demeti, aralarda bağlar; mazgal başlarında ahşap direkler
  function bambuSuru(ctx, w, h, r, p, B) {
    const yatay = B.yon === "ust" || B.yon === "alt";
    cizgi(ctx, B, koyu(BAMBU, 0.6), 3);
    doldur(ctx, B, koyu(BAMBU, 0.25));
    kirp(ctx, B, () => {
      if (yatay) for (let y = 2.5; y < h + 3; y += 5) bambu(ctx, -2, y, w + 2, y, 4.2);
      else for (let x = 2.5; x < w + 3; x += 5) bambu(ctx, x, -2, x, h + 2, 4.2);
      ctx.strokeStyle = SICIM; ctx.lineWidth = 1.2; ctx.beginPath();
      if (yatay) for (let x = 10; x < w; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, h); } else for (let y = 10; y < h; y += 20) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    });
    for (const q of B) if (q.t === "d") direkBasi(ctx, q.x, q.y, q.r - 1, p.duvarKoyu);
    return [];
  }
  // Lotus yaprağı ve (varsa) çiçeği
  function lotus(ctx, x, y, s, cicekli) {
    ctx.fillStyle = "#3f8a3a"; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s, 0.25, Math.PI * 2 - 0.1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#62a84f"; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let a = 0.6; a < Math.PI * 2 - 0.2; a += 0.7) { ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * s * 0.85, y + Math.sin(a) * s * 0.85); }
    ctx.stroke();
    if (cicekli) {
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.45; ctx.save(); ctx.translate(x + s * 0.2, y - s * 0.2); ctx.rotate(a); elips(ctx, 0, -s * 0.38, s * 0.16, s * 0.38, i % 2 ? "#f6a6c4" : "#f28cb4"); ctx.restore(); }
      elips(ctx, x + s * 0.2, y - s * 0.2, s * 0.16, s * 0.12, "#f2c94c");
    }
  }
  // Bambu öbeği (kıyıda): iki üç sap, boğumlar, tepede yapraklar; uçlar kıyı payını aşmaz
  function bambuObegi(ctx, x, y, r, B) {
    for (let i = 0; i < 3; i++) {
      const dx = (i - 1) * 2.6;
      let boy = 7 + r() * 3;
      while (boy >= 4 && window.engelUzaklik(B, x + dx, y - boy - 2) > 9.5) boy -= 1;
      if (boy < 4) continue;
      bambu(ctx, x + dx, y, x + dx, y - boy, 1.8, "#6f9a3a");
      ctx.fillStyle = "#4f8a2f"; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + dx + sx * 1.8, y - boy, 2.2, 0.8, sx * 0.4, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  // Su: lotuslu gölet, yeşil çamur kıyı; kıyıya yakın lotus yaprakları ve pembe çiçekler, yan ve alt kıyıda bambular
  function lotusKiyisi(ctx, w, h, r, p, B) {
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, "#3f5a2a", 0, 0, 9.5);
      doldur(ctx, B, "#5f7a3a", 0, 0, 8);
      kirp(ctx, B, () => { for (let i = 0; i < (w + h) / 2; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 1.5, karistir("#7f9a4a", "#000000", r() * 0.3)); }, 0, 0, 8);
    }, "#2f4a24");
    for (const k of icNoktalar(B, w, h, Math.max(2, Math.round(w * h / 2400)), 7, 13, r)) lotus(ctx, k.x, k.y, 4.5 + r() * 2, r() < 0.5);
    for (const k of kenarNoktalari(B, 11, 5.5)) if (k.ny > -0.15 && r() < 0.45) bambuObegi(ctx, k.x, k.y, r, B);
    return [];
  }
  // Zemin: hasır örgü — 8 × 8 hücre, komşu hücrelerde yatay ve dikey şeritler (96'da kendini tekrarlar)
  function hasirOrgu(ctx, n, p) {
    const c = n / 8;
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1.1; ctx.beginPath();
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      const x = i * c, y = j * c;
      for (let k = 1; k < 4; k++) {
        if ((i + j) % 2) { ctx.moveTo(x + 1.5, y + (k * c) / 4); ctx.lineTo(x + c - 1.5, y + (k * c) / 4); }
        else { ctx.moveTo(x + (k * c) / 4, y + 1.5); ctx.lineTo(x + (k * c) / 4, y + c - 1.5); }
      }
    }
    ctx.stroke();
  }

  // ================= KA — KUZEY AMERİKA =================
  // Sivri kütük ucu (yukarıdan): ışıklı ve gölgeli yamaçlı koni, yonga çizgileri, tepe noktası
  function sivriUc(ctx, x, y, s, renk) {
    elips(ctx, x + 0.8, y + 1.2, s, s, "rgba(0,0,0,0.35)");
    const g = ctx.createRadialGradient(x - s * 0.35, y - s * 0.35, 0.5, x, y, s);
    g.addColorStop(0, acik(renk, 0.45)); g.addColorStop(0.6, renk); g.addColorStop(1, koyu(renk, 0.35));
    elips(ctx, x, y, s, s, g);
    ctx.strokeStyle = koyu(renk, 0.3); ctx.lineWidth = 0.5; ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * s * 0.9, y + Math.sin(a) * s * 0.9); }
    ctx.stroke();
    elips(ctx, x - s * 0.1, y - s * 0.1, s * 0.16, s * 0.16, acik(renk, 0.6));
  }
  // Kesik kütük (yukarıdan): kabuk halkası, açık öz, yıllık halkalar
  function kesikKutuk(ctx, x, y, s, renk) {
    elips(ctx, x + 1, y + 1.4, s, s * 0.9, "rgba(0,0,0,0.3)");
    elips(ctx, x, y, s, s * 0.9, koyu(renk, 0.35)); elips(ctx, x, y, s * 0.8, s * 0.72, "#d9b47a");
    ctx.strokeStyle = "#a8844a"; ctx.lineWidth = 0.5; ctx.beginPath();
    for (const k of [0.25, 0.45, 0.62]) ctx.ellipse(x, y, s * 0.8 * k, s * 0.72 * k, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Duvar: sivri kütük palisat — ön yüzde kabuklu dikey kütükler ve iki sıra yatay bağ kütüğü; üst yüzde çam iğneli
  // orman tabanı ve kesik kütükler, kenar boyunca sivri kütük uçları, kütük başlarında iri uçlar
  function palisat(ctx, w, h, r, p, B) {
    if (B.yon) return palisatSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, ahsap = p.duvar, orman = "#4f6a34";
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(ahsap, 0.6), 3, 0, d);                            // ön yüz: dikey kütükler
    doldur(ctx, B, koyu(ahsap, 0.3), 0, d);
    kirp(ctx, B, () => {
      for (let x = 0, i = 0; x < w + 6; x += 6, i++) {
        const gr = ctx.createLinearGradient(x, 0, x + 6, 0); gr.addColorStop(0, acik(ahsap, 0.15)); gr.addColorStop(0.55, ahsap); gr.addColorStop(1, koyu(ahsap, 0.35));
        ctx.fillStyle = gr; ctx.fillRect(x + 0.3, 0, 5.4, h + d);
        ctx.strokeStyle = koyu(ahsap, 0.3); ctx.lineWidth = 0.5; ctx.beginPath(); for (let y = (i * 7) % 9; y < h + d; y += 9) { ctx.moveTo(x + 1.5, y); ctx.lineTo(x + 2.2, y + 4); } ctx.stroke();
      }
      const alt = B[0].y + B[0].h;
      for (const f of [0.3, 0.68]) { const y = alt + d * f; ctx.fillStyle = koyu(ahsap, 0.15); ctx.fillRect(0, y - 1.6, w, 3.2); ctx.fillStyle = acik(ahsap, 0.2); ctx.fillRect(0, y - 1.6, w, 0.9); }
    }, 0, d);
    cizgi(ctx, B, koyu(orman, 0.5), 3);                                   // üst yüz: orman tabanı
    doldur(ctx, B, orman);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 180; i++) {                                                              // çam iğneleri
        const x = r() * w, y = r() * h, a = r() * Math.PI;
        ctx.strokeStyle = r() < 0.5 ? "#8a6a3a" : "#6a8a3a"; ctx.lineWidth = 0.6; ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a + 0.5) * 3, y + Math.sin(a + 0.5) * 3); ctx.stroke();
      }
      for (let i = 0; i < w * h / 600; i++) cimTutami(ctx, r() * w, r() * h, 2.2 + r() * 1.5, karistir("#6f8a44", "#000000", r() * 0.3));
    });
    for (const k of icNoktalar(B, w, h, Math.max(1, Math.round(w * h / 4500)), 12, 26, r)) kesikKutuk(ctx, k.x, k.y, 5 + r() * 2, ahsap);
    for (const k of kenarNoktalari(B, 6, -3)) sivriUc(ctx, k.x, k.y, 2.6, ahsap);
    for (const q of B) if (q.t === "d") sivriUc(ctx, q.x, q.y, q.r - 1, ahsap);
    return [];
  }
  // Harita sınırı: çam iğneli orman şeridi, haritaya bakan kenara paralel sivri kütük sırası; mazgal başlarında iri uçlar
  function palisatSuru(ctx, w, h, r, p, B) {
    const ahsap = p.duvar, orman = "#4f6a34", yatay = B.yon === "ust" || B.yon === "alt";
    cizgi(ctx, B, koyu(orman, 0.6), 3);
    doldur(ctx, B, orman);
    kirp(ctx, B, () => {
      for (let i = 0; i < w * h / 160; i++) { const x = r() * w, y = r() * h, a = r() * Math.PI; ctx.strokeStyle = r() < 0.5 ? "#8a6a3a" : "#6a8a3a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); ctx.stroke(); }
    });
    const c = B.yon === "ust" ? h - 13 : B.yon === "alt" ? 13 : B.yon === "sol" ? w - 13 : 13;
    for (let a = 4; a < (yatay ? w : h); a += 5.5) sivriUc(ctx, yatay ? a : c, yatay ? c : a, 2.6, ahsap);
    for (const q of B) if (q.t === "d") sivriUc(ctx, q.x, q.y, q.r - 1, ahsap);
    return [];
  }
  // Su: kütük iskeleli göl kıyısı — çimenli kıyı ve çakıl şeridi; üst kıyıdan suya uzanan tahta iskeleler, yan ve alt
  // kıyıda sazlar
  function kutukIskele(ctx, w, h, r, p, B) {
    const ahsap = p.duvar;
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, "#3f5a2a", 0, 0, 9.5);
      doldur(ctx, B, "#5f7a3a", 0, 0, 8);
      kirp(ctx, B, () => { for (let i = 0; i < (w + h) / 2; i++) cimTutami(ctx, r() * w, r() * h, 2 + r() * 1.5, karistir("#7f9a4a", "#000000", r() * 0.3)); }, 0, 0, 8);
      for (const k of kenarNoktalari(B, 4, 2)) elips(ctx, k.x, k.y, 1.6 + r(), 1.2, ["#9a958a", "#7a756a", "#b5ae9e"][Math.floor(r() * 3)]);   // çakıl
    }, "#2f4a24");
    for (const k of kenarNoktalari(B, 46, 6).filter((k) => k.ny < -0.7).slice(0, 2)) {                    // iskeleler
      ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(Math.atan2(-k.ny, -k.nx) - Math.PI / 2);
      elips(ctx, 1.5, 9, 4.5, 8, "rgba(0,0,0,0.25)");
      for (let t = -2; t < 16; t += 2.4) { ctx.fillStyle = (Math.round(t) % 2) ? ahsap : acik(ahsap, 0.12); ctx.fillRect(-4, t, 8, 2); ctx.fillStyle = koyu(ahsap, 0.35); ctx.fillRect(-4, t + 2, 8, 0.4); }
      for (const [px, py] of [[-4.2, 15], [4.2, 15], [-4.2, 6], [4.2, 6]]) elips(ctx, px, py, 1.3, 1.3, koyu(ahsap, 0.4));
      ctx.restore();
    }
    for (const k of kenarNoktalari(B, 9, 5.5)) if (k.ny > -0.15 && r() < 0.5) saz(ctx, k.x, k.y, r, B);
    return [];
  }
  // Zemin: çimen ve çam iğneleri — ot tutamları, V biçimli iğne çiftleri ve küçük kozalaklar (96'da kendini tekrarlar)
  function cimVeIgne(ctx, n, p) {
    const her = sarmal(n);
    for (const [x, y] of [[10, 14], [46, 8], [80, 26], [28, 46], [64, 54], [90, 70], [12, 80], [48, 88]]) her(x, y, (a, b) => window.ENGEL.cimTutami(ctx, a, b, 3.4, p.desen));
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1; ctx.lineCap = "round";
    for (const [x, y, a] of [[30, 22, 0.3], [70, 10, 1.4], [8, 50, 2.2], [52, 34, 0.9], [84, 48, 2.8], [36, 70, 1.8], [72, 84, 0.5], [20, 94, 2.5]]) her(x, y, (u, v) => {
      ctx.beginPath(); ctx.moveTo(u, v); ctx.lineTo(u + Math.cos(a) * 5, v + Math.sin(a) * 5); ctx.moveTo(u, v); ctx.lineTo(u + Math.cos(a + 0.45) * 5, v + Math.sin(a + 0.45) * 5); ctx.stroke();
    });
    ctx.fillStyle = p.desen;
    for (const [x, y] of [[58, 72], [18, 30], [88, 92]]) her(x, y, (u, v) => { ctx.beginPath(); ctx.ellipse(u, v, 1.6, 2.6, 0.4, 0, Math.PI * 2); ctx.fill(); });
  }

  // ================= LA — LATİN AMERİKA =================
  const KIREMIT_LA = "#b8562e";
  // İnka çokgen taşı: köşeleri oynatılmış, sıraları kaydırılmış ızgaradan iri, koyu derzli bloklar
  function inkaTasi(ctx, x0, y0, w, h, renk, r, boy = 11) {
    const sut = Math.ceil(w / boy) + 2, sat = Math.ceil(h / (boy * 0.8)) + 2, N = [];
    for (let j = 0; j <= sat; j++) { N.push([]); for (let i = 0; i <= sut; i++) N[j].push([x0 + (i - 1) * boy + (r() - 0.5) * boy * 0.5 + (j % 2) * boy * 0.3, y0 + (j - 1) * boy * 0.8 + (r() - 0.5) * boy * 0.35]); }
    ctx.lineJoin = "round";
    for (let j = 0; j < sat; j++) for (let i = 0; i < sut; i++) {
      const a = N[j][i], b = N[j][i + 1], c = N[j + 1][i + 1], d = N[j + 1][i];
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
      ctx.fillStyle = karistir(renk, r() < 0.5 ? "#ffffff" : "#000000", r() * 0.12); ctx.fill();
      ctx.strokeStyle = koyu(renk, 0.45); ctx.lineWidth = 1.1; ctx.stroke();
      elips(ctx, (a[0] + b[0] + c[0] + d[0]) / 4 - 1, (a[1] + b[1] + c[1] + d[1]) / 4 - 1, boy * 0.2, boy * 0.12, "rgba(255,255,255,0.12)");
    }
  }
  // Sıva dokusu: ince benekler ve yer yer dökülmüş sıvanın altından görünen tuğla
  function sivaDoku(ctx, w, h, renk, r) {
    for (let i = 0; i < w * h / 70; i++) elips(ctx, r() * w, r() * h, 0.6 + r() * 0.8, 0.5, r() < 0.5 ? koyu(renk, 0.08) : acik(renk, 0.1));
    for (let i = 0; i < w * h / 4000; i++) {
      const x = r() * w, y = r() * h;
      ctx.fillStyle = acik(renk, 0.15); ctx.fillRect(x - 5, y - 3, 10, 6);
      ctx.strokeStyle = "#a8603a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 2.5); ctx.lineTo(x, y); ctx.moveTo(x - 2, y); ctx.lineTo(x - 2, y + 2.5); ctx.stroke();
    }
  }
  // Çini kubbe (yukarıdan, azulejo): ışıklı kubbe, dama karo dilimleri, küçük fener başı
  function ciniKubbe(ctx, cx, cy, R, renk) {
    elips(ctx, cx + 1.4, cy + 1.8, R, R * 0.92, "rgba(0,0,0,0.25)");
    elips(ctx, cx, cy, R, R, "#f1e8d6");
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? renk : "#f6efe0"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R * 0.82, (i * Math.PI) / 4, ((i + 1) * Math.PI) / 4); ctx.closePath(); ctx.fill(); }
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 1, cx, cy, R * 0.85); g.addColorStop(0, "rgba(255,255,255,0.45)"); g.addColorStop(1, "rgba(0,0,0,0.2)");
    elips(ctx, cx, cy, R * 0.82, R * 0.82, g);
    elips(ctx, cx, cy, R * 0.22, R * 0.22, "#f6efe0"); elips(ctx, cx, cy, R * 0.12, R * 0.12, "#d4a73a");
  }
  // Duvar: renkli sıvalı ön yüz, boyalı kuşak ve kepenkli kemerli pencereler (Peru'da İnka çokgen taşı ve yamuk
  // nişler); üst yüz sıvalı düz dam, kenarında kiremit, mazgallar kiremit başlıklı; kuleler çini kubbeli (Peru'da saman
  // çatılı taş kule)
  function latinDuvari(ctx, w, h, r, p, B) {
    if (B.yon) return latinSuru(ctx, w, h, r, p, B);
    const d = B.derinlik || 0, govde = B[0], inka = p.tas === "inka";
    doldur(ctx, B, "rgba(0,0,0,0.3)", 2, d + 1);                         // gölge
    cizgi(ctx, B, koyu(p.duvarKoyu, 0.45), 3, 0, d);                     // ön yüz
    doldur(ctx, B, p.duvarKoyu, 0, d);
    kirp(ctx, B, () => {
      if (inka) inkaTasi(ctx, 0, 0, w, h + d, p.duvarKoyu, r, 10);
      else sivaDoku(ctx, w, h + d, p.duvarKoyu, r);
    }, 0, d);
    if (govde.t === "k") {
      const altY = govde.y + govde.h, n = Math.max(1, Math.floor(govde.w / 34));
      kirp(ctx, B, () => {
        if (!inka) { ctx.fillStyle = p.vurgu1; ctx.fillRect(0, altY, w, 2.4); ctx.fillStyle = koyu(p.duvarKoyu, 0.25); ctx.fillRect(0, altY + d - 3.5, w, 3.5); }   // kuşak ve süpürgelik
        for (let i = 0; i < n; i++) {
          const cx = govde.x + govde.w * (i + 0.5) / n, py = altY + 4.5, ph = Math.max(5, d - 10);
          if (inka) {                                                                                       // yamuk niş
            ctx.fillStyle = koyu(p.duvarKoyu, 0.55); ctx.beginPath(); ctx.moveTo(cx - 3, py); ctx.lineTo(cx + 3, py); ctx.lineTo(cx + 4.5, py + ph); ctx.lineTo(cx - 4.5, py + ph); ctx.closePath(); ctx.fill();
          } else {                                                                                          // kepenkli kemerli pencere
            for (const sx of [-1, 1]) { ctx.fillStyle = p.vurgu2; ctx.fillRect(cx + sx * 4.5 - (sx < 0 ? 3 : 0), py, 3, ph); }
            ctx.fillStyle = "#2a2a3a"; yuvarlak(ctx, cx - 4, py, 8, ph, 3.5); ctx.fill();
            ctx.strokeStyle = "#3a3a40"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let xx = cx - 2.5; xx < cx + 4; xx += 2) { ctx.moveTo(xx, py + 2); ctx.lineTo(xx, py + ph); } ctx.stroke();
            ctx.fillStyle = "rgba(200, 225, 255, 0.3)"; ctx.fillRect(cx - 3, py + 2, 1.4, ph - 3);
          }
        }
      }, 0, d);
    }
    cizgi(ctx, B, koyu(p.duvar, 0.5), 3);                                 // üst yüz
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      if (inka) inkaTasi(ctx, 0, 0, w, h, p.duvar, r, 13);
      else {
        sivaDoku(ctx, w, h, p.duvar, r);
        if (govde.t === "k") {
          ctx.fillStyle = "rgba(0,0,0,0.12)"; yuvarlak(ctx, govde.x + 8, govde.y + 7, govde.w - 16, govde.h - 14, govde.rr * 0.6); ctx.fill();
          ctx.strokeStyle = KIREMIT_LA; ctx.lineWidth = 3; ctx.setLineDash([3, 1.2]); yuvarlak(ctx, govde.x + 3.5, govde.y + 3, govde.w - 7, govde.h - 6, govde.rr * 0.7); ctx.stroke(); ctx.setLineDash([]);   // kenar kiremidi
        }
      }
    });
    for (const q of B) if (q.t === "k" && q !== govde) {                  // mazgallar
      if (inka) { ctx.fillStyle = acik(p.duvar, 0.15); yuvarlak(ctx, q.x, q.y, q.w, q.h - 3, 2); ctx.fill(); ctx.strokeStyle = koyu(p.duvar, 0.45); ctx.lineWidth = 1; ctx.stroke(); }
      else {
        ctx.fillStyle = acik(p.duvar, 0.2); yuvarlak(ctx, q.x, q.y, q.w, q.h - 3, q.rr); ctx.fill();
        ctx.fillStyle = KIREMIT_LA; yuvarlak(ctx, q.x - 0.5, q.y, q.w + 1, 3.2, 1.5); ctx.fill();
        ctx.strokeStyle = koyu(KIREMIT_LA, 0.3); ctx.lineWidth = 0.5; ctx.beginPath(); for (let x = q.x + 2; x < q.x + q.w; x += 2.5) { ctx.moveTo(x, q.y); ctx.lineTo(x, q.y + 3.2); } ctx.stroke();
      }
    }
    for (const t of B.kuleler || []) {
      if (inka) { for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) elips(ctx, t.x + Math.cos(a) * (t.r - 2.5), t.y + Math.sin(a) * (t.r - 2.5), 3.4, 3, acik(p.duvar, 0.2)); samanCati(ctx, t.x, t.y, t.r * 0.8); }
      else ciniKubbe(ctx, t.x, t.y, t.r * 0.92, p.vurgu1);
    }
    return [];
  }
  // Harita sınırı: renkli sıvalı sur (Peru'da İnka taşı); haritaya bakan kenarda kiremit şerit, mazgal başlarında
  // kiremit kubbecikler
  function latinSuru(ctx, w, h, r, p, B) {
    const inka = p.tas === "inka";
    cizgi(ctx, B, koyu(p.duvar, 0.6), 3);
    doldur(ctx, B, p.duvar);
    kirp(ctx, B, () => {
      if (inka) inkaTasi(ctx, 0, 0, w, h, p.duvar, r, 12);
      else {
        sivaDoku(ctx, w, h, p.duvar, r);
        ctx.fillStyle = KIREMIT_LA;
        if (B.yon === "ust") ctx.fillRect(0, h - 13, w, 3); else if (B.yon === "alt") ctx.fillRect(0, 10, w, 3);
        else if (B.yon === "sol") ctx.fillRect(w - 13, 0, 3, h); else ctx.fillRect(10, 0, 3, h);
      }
    });
    for (const q of B) if (q.t === "d") {
      if (inka) { elips(ctx, q.x, q.y, q.r - 1.5, q.r - 1.5, acik(p.duvar, 0.18)); ctx.strokeStyle = koyu(p.duvar, 0.45); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r - 1.5, 0, Math.PI * 2); ctx.stroke(); }
      else { elips(ctx, q.x + 0.8, q.y + 1, q.r - 1.5, q.r - 1.5, "rgba(0,0,0,0.3)"); elips(ctx, q.x, q.y, q.r - 1.5, q.r - 1.5, KIREMIT_LA); elips(ctx, q.x - 1.2, q.y - 1.2, q.r * 0.35, q.r * 0.3, acik(KIREMIT_LA, 0.35)); }
    }
    return [];
  }
  // Su: renkli karo kenarlı kanal — krem derz şeridi üstünde sırayla üç renk karo, ortalarında küçük çiçek
  function karoKanal(ctx, w, h, r, p, B) {
    const renkler = [p.vurgu1, "#2f5fa0", p.vurgu2];
    suTabani(ctx, w, h, r, B, () => {
      doldur(ctx, B, koyu(p.duvar, 0.35), 0, 0, 9.5);
      doldur(ctx, B, "#f1e8d6", 0, 0, 8);
      kenarNoktalari(B, 6.4, 4.2).forEach((k, i) => {
        ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(Math.atan2(k.ny, k.nx));
        ctx.fillStyle = renkler[i % 3]; ctx.fillRect(-2.6, -2.6, 5.2, 5.2);
        ctx.fillStyle = "#f6efe0"; ctx.beginPath(); ctx.moveTo(0, -1.6); ctx.lineTo(1.6, 0); ctx.lineTo(0, 1.6); ctx.lineTo(-1.6, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
    }, koyu(p.duvar, 0.5));
    return [];
  }
  // Zemin: pişmiş toprak karo — 24 px kareler (96'yı tam böler), köşelerde küçük çini kakmalar
  function pismisKaro(ctx, n, p) {
    const c = n / 4;
    ctx.strokeStyle = p.desen; ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.beginPath(); window.ENGEL.kutuYolu(ctx, i * c + 1.2, j * c + 1.2, c - 2.4, c - 2.4, 2); ctx.stroke(); }
    ctx.fillStyle = p.desen;
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) { const x = i * c, y = j * c; ctx.beginPath(); ctx.moveTo(x, y - 3.4); ctx.lineTo(x + 3.4, y); ctx.lineTo(x, y + 3.4); ctx.lineTo(x - 3.4, y); ctx.closePath(); ctx.fill(); }
  }

  window.ULKE_AILELERI = {
    K: { bicim: { duvar: "kale" }, palet: { mazgal: "kare" }, duvar: avrupaKalesi, su: tasRihtim, zemin: arnavutKaldirimi },
    KS: { bicim: { duvar: "kale" }, duvar: kervansarayDuvari, su: ciniliHavuz, zemin: geometrikCini },
    KP: { bicim: { duvar: "kale" }, duvar: kerpicDuvari, su: hurmaliVaha, zemin: kumDalgasi },
    SH: { bicim: { duvar: "kale" }, duvar: sahelDuvari, su: sazlikNehir, zemin: kirmiziToprak },
    SV: { bicim: { duvar: "kutuk" }, duvar: kazikCit, su: sazlikBirikinti, zemin: catlakToprak },
    GA: { bicim: { duvar: "kale" }, duvar: guneyAsyaDuvari, su: basamakliHavuz, zemin: kumtasiDoseme },
    GDA: { bicim: { duvar: "kutuk" }, duvar: bambuCit, su: lotusKiyisi, zemin: hasirOrgu },
    DA: { bicim: { duvar: "kale" }, duvar: catiliDuvar, su: koiGoleti, zemin: tasDoseme },
    KA: { bicim: { duvar: "kutuk" }, duvar: palisat, su: kutukIskele, zemin: cimVeIgne },
    LA: { bicim: { duvar: "kale" }, duvar: latinDuvari, su: karoKanal, zemin: pismisKaro },
  };
  window.ULKE_AILE_YARDIMCI = { sivriKemer, baklava, kiremitler, orguCiz, tuglaMi, kerpicDoku, samanCati, hurma, zikzak, tasObegi, kangura, kosk, bambu, lotus };
})();
