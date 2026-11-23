// Hayalet Avcıları: ChatGPT görsellerini yükler ve çizer (3.18.0).
// Görseller araclar/gorsel_kes.py ile paftalardan kesilir (www/gorsel/*.webp, liste: www/gorsel/liste.js).
// Kural: her çizim işlevi önce resmi dener; resim yoksa (yüklenmedi, dosya yok, pafta gelmedi) bugünkü kod çizimi çalışır.
// Resim yalnız GÖRÜNÜŞÜ değiştirir: boyut kutuları bugünkü çizimin kapladığı alana göre seçildi, çarpışma ve kurallar aynı.
// Karakterler (K1–K6) henüz bağlı değil: paftadaki karakterler silahı elinde çizildi; oyunda silahı kod çizer (nişan,
// geri tepme, dükkân silahları). Elleri boş paftalar (KS1–KS6, gorsel/CHATGPT-ISTEMI.md) gelince bağlanacak.

const GORSEL = {};          // anahtar → yüklenmiş HTMLImageElement
const _gorselRenk = {};     // "anahtar|renk|kip" → renklendirilmiş tuval (önbellek)
let _gorselOlayZamanlayici = 0; // "gorsel-yuklendi" olayı: gecikmeli TEK zamanlayıcı (150 ms)

function gorselYukle() {
  if (typeof GORSEL_LISTESI !== "object" || !GORSEL_LISTESI) return;
  for (const k of Object.keys(GORSEL_LISTESI)) {
    if (GORSEL[k]) continue;
    const im = new Image();
    im.decoding = "async";
    im.onload = () => {
      GORSEL[k] = im;
      if (k.endsWith("-su") && typeof window.engelSuOnbellegiSil === "function") window.engelSuOnbellegiSil();
      // Görseller ardı ardına yüklenir: her yükleme sayacı yeniden kurar, 150 ms sessizlikten sonra
      // TEK "gorsel-yuklendi" olayı gelir (arayüz bekleyenleri tek başına haberdar eder).
      clearTimeout(_gorselOlayZamanlayici);
      _gorselOlayZamanlayici = setTimeout(() => {
        _gorselOlayZamanlayici = 0;
        window.dispatchEvent(new Event("gorsel-yuklendi"));
      }, 150);
    };
    im.src = `gorsel/${k}.webp`;
  }
}

function gorsel(k) {
  const im = GORSEL[k];
  return im && im.complete && im.naturalWidth > 0 ? im : null;
}

// Resmi (x, y, w, h) kutusuna oranını bozmadan sığdırır; kutunun alt-ortasına (alt) ya da ortasına hizalar
function resmiKutuyaCiz(ctx, kaynak, x, y, w, h, alt = false) {
  const kw = kaynak.naturalWidth || kaynak.width, kh = kaynak.naturalHeight || kaynak.height;
  const o = Math.min(w / kw, h / kh);
  const dw = kw * o, dh = kh * o;
  ctx.drawImage(kaynak, x + (w - dw) / 2, alt ? y + h - dh : y + (h - dh) / 2, dw, dh);
}

function gorselKutuya(ctx, k, x, y, w, h, alt = false) {
  const im = gorsel(k);
  if (!im) return false;
  resmiKutuyaCiz(ctx, im, x, y, w, h, alt);
  return true;
}

// Renklendirilmiş kopya. kip "renk": resmin aydınlığı kalır, rengi değişir (hayaletin can kademesi, donma);
// kip "doldur": tek renkli siluet (vurulma parlaması, şimşekte bulut).
function gorselRenkli(k, renk, kip = "renk") {
  const im = gorsel(k);
  if (!im) return null;
  const anahtar = `${k}|${renk}|${kip}`;
  if (_gorselRenk[anahtar]) return _gorselRenk[anahtar];
  const c = document.createElement("canvas");
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext("2d");
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = kip === "doldur" ? "source-atop" : "color";
  x.fillStyle = renk;
  x.fillRect(0, 0, c.width, c.height);
  if (kip !== "doldur") {
    // "color" karışımı aydınlığı korur; mor gövdenin koyuluğu sarıyı ve beyazı soldurmasın diye renge doğru açılır
    x.globalCompositeOperation = "screen";
    x.globalAlpha = 0.32;
    x.fillRect(0, 0, c.width, c.height);
    x.globalAlpha = 1;
  }
  x.globalCompositeOperation = "destination-in"; // saydam yerler saydam kalsın
  x.drawImage(im, 0, 0);
  _gorselRenk[anahtar] = c;
  return c;
}

// ---- Tema dokuları (T1–T6): zemin ve su ----
// n: 1-6 (LEVEL_THEMES sırası), tur: "zemin" | "su". Döşeme oyunda TEMA_DOKU_BIRIM birim. Yoksa null (kod çizimi).
const TEMA_DOKU_BIRIM = 256;
const _temaDesen = {};
// Su: engelin önbellek tuvaline bir kez çizilir (engeller.js suTabani); desen yerel birimde, ölçeği tuval verir
function temaDeseni(n, tur) {
  const k = `tema${n}-${tur}`;
  if (_temaDesen[k]) return _temaDesen[k];
  const im = gorsel(k);
  if (!im) return null;
  const desen = document.createElement("canvas").getContext("2d").createPattern(im, "repeat");
  if (desen && desen.setTransform && typeof DOMMatrix === "function") {
    const o = TEMA_DOKU_BIRIM / im.naturalWidth;
    desen.setTransform(new DOMMatrix([o, 0, 0, o, 0, 0]));
  }
  return (_temaDesen[k] = desen);
}
window.temaDeseni = temaDeseni;

// Zemin: her karede bütün ekrana döşenir. Dünya Turu zemini gibi (dunya-turu.js turZeminCiz) desen ekranın piksel
// ölçeğinde bir kez hazırlanır ve piksele hizalı döşenir; her karede yeniden ölçekleme olmaz (kare hızı). Karartma
// (karakterler öne çıksın) dokuya gömülür. Çizdiyse true.
let _zeminDesen = null;
function temaZeminiCiz(ctx, n, x, y, w, h) {
  const im = gorsel(`tema${n}-zemin`);
  if (!im) return false;
  const donusum = typeof DOMMatrix === "function" && typeof CanvasPattern !== "undefined" && !!CanvasPattern.prototype.setTransform
    && typeof ctx.getTransform === "function";
  const m = donusum ? ctx.getTransform() : null;
  const hizali = !!m && m.b === 0 && m.c === 0 && m.a === m.d && m.a > 0;
  const s = hizali ? m.a : 1, anahtar = `${n}|${s}|${hizali}`;
  if (!_zeminDesen || _zeminDesen.anahtar !== anahtar) {
    _zeminDesen = { anahtar, desen: null, k: 1 };
    try {
      const px = Math.max(1, Math.round(TEMA_DOKU_BIRIM * s)), c = document.createElement("canvas");
      c.width = px; c.height = px;
      const cx = c.getContext("2d");
      cx.drawImage(im, 0, 0, px, px);
      cx.fillStyle = "rgba(0, 0, 0, 0.24)"; cx.fillRect(0, 0, px, px);
      _zeminDesen.k = px / TEMA_DOKU_BIRIM;
      _zeminDesen.desen = ctx.createPattern(c, "repeat");
    } catch (_) { _zeminDesen.desen = null; }
  }
  const desen = _zeminDesen.desen;
  if (!desen) return false;
  if (donusum) {
    const k = _zeminDesen.k;
    desen.setTransform(new DOMMatrix(hizali
      ? [1 / k, 0, 0, 1 / k, (Math.round(m.e) - m.e) / m.a, (Math.round(m.f) - m.f) / m.d]
      : [1 / k, 0, 0, 1 / k, 0, 0]));
  }
  ctx.fillStyle = desen;
  ctx.fillRect(x, y, w, h);
  return true;
}

// ---- Hayaletler ----
// Kutu (s birimi; x, y, w, h): bugünkü kod çiziminin kapladığı alan. Boss kutusu tacı ve haleyi de içerir.
const HAYALET_KUTU = { normal: [-20, -25, 40, 49], boss: [-23, -41, 46, 64], ulke: [-31, -45, 62, 70] }; // ulke: kıyafetli boss geniş

function hayaletResmiAnahtari(g) {
  if (g.isBoss) return "hayalet-boss";
  if (g.isShooter) return "hayalet-atici";
  if (g.fromBoss || (g.size || 40) < 30) return "hayalet-mini";
  return "hayalet-normal";
}

// drawGhost çağırır (gövde, yüz ve atış parıltısı yerine). Çizdiyse true. ulkeKod: Dünya Turu bossu (ülke kıyafetli);
// o ülkenin boss resmi (U paftaları, boss-<KOD>) yoksa false döner ve kıyafet kodla çizilir.
function hayaletResmiCiz(ctx, g, s, renk, donmus, an, ulkeKod = null) {
  const k = ulkeKod ? `boss-${ulkeKod}` : hayaletResmiAnahtari(g);
  if (!gorsel(k)) return false;
  const [x, y, w, h] = HAYALET_KUTU[ulkeKod ? "ulke" : g.isBoss ? "boss" : "normal"];
  const now = performance.now();
  // Kare kare animasyon (N01, N03, N04): hazırsa durağan resmin yerine; anahtar ve kare
  let ad = null, kare = 0;
  if (!ulkeKod) {
    if (k === "hayalet-normal") { ad = "hayalet-suzul"; kare = animDongu(ad, now / 1000 + (g.__faz || 0), 7); }
    else if (k === "hayalet-atici") {
      ad = "atici-saldiri";
      const sarj = (an && an.sarj) || 0;
      const atisSonrasi = g.fireRate && typeof g.nextShot === "number" ? now - (g.nextShot - g.fireRate) : 1e9;
      const n = animHazir(ad);
      kare = !n ? 0 : sarj > 0 ? 2 + Math.min(3, Math.floor(sarj * 4)) : atisSonrasi >= 0 && atisSonrasi < 320 ? 6 : 1;
    } else if (k === "hayalet-boss") {
      const sarj = (an && an.sarj) || 0;
      if (sarj > 0 && animHazir("boss-kukre")) { ad = "boss-kukre"; kare = animBirKez(ad, sarj); }
      else { ad = "boss-bekle"; kare = animDongu(ad, now / 1000, 4); }
    }
  }
  const renkli = (anahtar) => donmus ? gorselRenkli(anahtar, "#bae6fd")
    : (k === "hayalet-normal" && renk !== "#a78bfa") ? gorselRenkli(anahtar, renk) : gorsel(anahtar); // can kademesi rengi
  if (kare) {
    const ka = `an-${ad}-${kare}`;
    animGovdeCiz(ctx, ad, kare, x * s, y * s, w * s, h * s, true, renkli(ka));
    if (an && an.beyaz > 0) {
      ctx.save();
      ctx.globalAlpha *= an.beyaz * 0.75;
      animGovdeCiz(ctx, ad, kare, x * s, y * s, w * s, h * s, true, gorselRenkli(ka, "#ffffff", "doldur"));
      ctx.restore();
    }
    // Atıcı ve boss karelerinde küre ve kükreme var: kodun atış parıltısı çizilmez
    if (an && ad === "hayalet-suzul" && typeof hayaletSarjCiz === "function") hayaletSarjCiz(ctx, s, an.sarj, g.isBoss);
    return true;
  }
  resmiKutuyaCiz(ctx, renkli(k), x * s, y * s, w * s, h * s, true);
  if (an && an.beyaz > 0) {
    ctx.save();
    ctx.globalAlpha *= an.beyaz * 0.75;
    resmiKutuyaCiz(ctx, gorselRenkli(k, "#ffffff", "doldur"), x * s, y * s, w * s, h * s, true);
    ctx.restore();
  }
  if (an && typeof hayaletSarjCiz === "function") hayaletSarjCiz(ctx, s, an.sarj, g.isBoss);
  return true;
}

// Ölen hayaletin "puf" animasyonu (N02; boss için N05). drawGhostFades çağırır; çizdiyse true (kod puf'u çizilmez).
// Dünya Turu bossu (kıyafetli) kod animasyonuyla.
function olumAnimCiz(ctx, e, k) {
  const boss = !!e.isBoss;
  if (boss && typeof game !== "undefined" && game.dunyaTuru) return false;
  const ad = boss ? "boss-yenilgi" : "hayalet-puf";
  const kare = animBirKez(ad, k);
  if (!kare) return false;
  const s = (e.size || 40) / 40;
  const [x, y, w, h] = HAYALET_KUTU[boss ? "boss" : "normal"];
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.don) ctx.rotate(e.don);
  if (k > 0.8) ctx.globalAlpha *= (1 - k) / 0.2;
  animGovdeCiz(ctx, ad, kare, x * s, y * s, w * s, h * s, true);
  ctx.restore();
  return true;
}

// ---- Eşya simgeleri (silah çubuğu, dükkân) ----
// Resim listede varsa <img>, yoksa emoji. HTML olarak döner (alt metin: eşyanın adı).
function esyaSimgesiHTML(key, emoji, ad = "") {
  const k = `esya-${key}`;
  if (typeof GORSEL_LISTESI === "object" && GORSEL_LISTESI && GORSEL_LISTESI[k]) {
    const guvenliAd = String(ad).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    return `<img class="esya-resim" src="gorsel/${k}.webp" alt="${guvenliAd}" draggable="false">`;
  }
  return emoji;
}

// Eşya simgesinin genel hâli (3.20.0): "esya-" öneki olmadan her anahtar için. GORSEL_LISTESI[key] varsa
// <img class="ui-simge">, yoksa emoji (alt metin: ad, esyaSimgesiHTML gibi kaçışlı).
function uiSimgeHTML(key, emoji, ad = "") {
  if (typeof GORSEL_LISTESI === "object" && GORSEL_LISTESI && GORSEL_LISTESI[key]) {
    const guvenliAd = String(ad).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    return `<img class="ui-simge" src="gorsel/${key}.webp" alt="${guvenliAd}" draggable="false">`;
  }
  return emoji;
}

// ---- Canlı karakter önizlemesi (3.20.0) ----
// Bütün önizlemeler (açılış karşılıyıcısı, menü kareti...) TEK paylaşımlı requestAnimationFrame döngüsünde
// çizilir (~30 kare/sn üst sınır). Karakter drawCharacter ile çizilir (game.js'de; yalnız çizim anında çağrılır,
// yüklenirken asla). Dururken nefes kareleri oynar (walkPhase 0); opts.atis !== false ise her 2.6 sn'de bir kısa
// atış: geri tepme 1'den başlayıp 0.35 sn'de doğrusal sıfıra iner (3D atış kareleri 7-8 görünür).
// Gizli kap çizilmez (el.offsetParent null; ekran kapalı), DOM'dan çıkarılan önizlemenin kaydı silinir. Kayıt
// kalmayınca döngü durur, sonraki kayıtta yeniden başlar. Az hareket tercihi (prefers-reduced-motion) varsa döngü
// kurulmaz: önizleme bir kez atışsız çizilir ve yalnız "gorsel-yuklendi" olayında yeniden çizilir.
const _onizlemeler = [];
let _onizlemeRaf = 0;
let _onizlemeSonKare = 0;
const _onizlemeAzHareket = typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function canliOnizleme(el, charKey, costumeIdx, opts = {}) {
  if (!el) return null;
  let o = _onizlemeler.find((k) => k.el === el);
  let cv = el.querySelector("canvas.canli-onizleme");
  if (!cv) { // menü her açılışta yenilenir: aynı kaptaki tuvali yeniden kullan
    cv = document.createElement("canvas");
    cv.className = "canli-onizleme";
    el.appendChild(cv);
  }
  if (!o) {
    o = { el, cv, ctx: cv.getContext("2d") };
    _onizlemeler.push(o);
  }
  o.charKey = charKey;
  o.costumeIdx = costumeIdx;
  o.atis = opts.atis !== false;
  o.sonAtis = performance.now(); // ilk atış kayıttan 2.6 sn sonra
  if (_onizlemeAzHareket) canliOnizlemeCiz(o, o.sonAtis, true);
  else if (!_onizlemeRaf) _onizlemeRaf = requestAnimationFrame(canliOnizlemeDongu);
  return cv;
}

// Bir önizlemeyi çizer: tuval kabın CSS kutusu × devicePixelRatio (üst sınır 2; kutu gizliyken 0 olur, çizilmez).
// Karakter kutun ortasında, ayakları h*0.62 hizasında; boy min(w, h/1.15)*0.9 (şapka ve ayaklar sığar).
function canliOnizlemeCiz(o, an, hareketsiz = false) {
  if (!o.el.isConnected || !o.cv.isConnected || o.el.offsetParent === null) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(o.el.clientWidth * dpr));
  const h = Math.max(1, Math.round(o.el.clientHeight * dpr));
  if (o.cv.width !== w || o.cv.height !== h) { o.cv.width = w; o.cv.height = h; }
  if (typeof drawCharacter !== "function") return; // game.js henüz yüklenmedi
  let geriTepme = 0;
  if (o.atis && !hareketsiz) {
    if (an - o.sonAtis >= 2600) o.sonAtis = an; // yeni atış
    const gecen = an - o.sonAtis;
    if (gecen < 350) geriTepme = 1 - gecen / 350; // 1 → 0 doğrusal
  }
  o.ctx.clearRect(0, 0, w, h);
  drawCharacter(o.ctx, o.charKey, o.costumeIdx, w / 2, h * 0.62, Math.min(w, h / 1.15) * 0.9, 0, 0, 0, geriTepme);
}

function canliOnizlemeDongu(an) {
  _onizlemeRaf = 0;
  if (an - _onizlemeSonKare >= 1000 / 30 - 1) { // ~30 kare/sn üst sınır
    _onizlemeSonKare = an;
    for (let i = _onizlemeler.length - 1; i >= 0; i--) {
      const o = _onizlemeler[i];
      if (!o.el.isConnected || !o.cv.isConnected) { _onizlemeler.splice(i, 1); continue; } // DOM'dan çıktı
      canliOnizlemeCiz(o, an);
    }
  }
  if (_onizlemeler.length) _onizlemeRaf = requestAnimationFrame(canliOnizlemeDongu); // kayıt kalmadıysa döngü durur
}

// Kayıtlı önizleme sayısı (sınama için); çağrılınca DOM'dan çıkmış kayıtlar da silinir
function canliOnizlemeSayisi() {
  for (let i = _onizlemeler.length - 1; i >= 0; i--) {
    const o = _onizlemeler[i];
    if (!o.el.isConnected || !o.cv.isConnected) _onizlemeler.splice(i, 1);
  }
  return _onizlemeler.length;
}

// el'in altındaki (kendisi dahil) önizlemelerin kaydını ve tuvalini kaldırır
function canliOnizlemeTemizle(el) {
  for (let i = _onizlemeler.length - 1; i >= 0; i--) {
    const o = _onizlemeler[i];
    if (!el || o.el === el || el.contains(o.el)) {
      o.cv.remove();
      _onizlemeler.splice(i, 1);
    }
  }
}

// Az hareket tercihi: döngü yok; görseller gelince (tek olay) kayıtlı önizlemeler bir kez yeniden çizilir
window.addEventListener("gorsel-yuklendi", () => {
  if (!_onizlemeAzHareket) return;
  const an = performance.now();
  for (const o of _onizlemeler) canliOnizlemeCiz(o, an, true);
});

gorselYukle();

// ---- Kare kare animasyonlar (N01–N13; an-<ad>-<n>.webp) ----
// Bir animasyon ancak bütün kareleri yüklenince kullanılır; değilse çağıran kod animasyonuna (anim.js) düşer.
const _animSayi = {};
function animSayisi(ad) {
  if (_animSayi[ad] !== undefined) return _animSayi[ad];
  let n = 0;
  while (typeof GORSEL_LISTESI === "object" && GORSEL_LISTESI && GORSEL_LISTESI[`an-${ad}-${n + 1}`]) n++;
  return (_animSayi[ad] = n);
}
function animHazir(ad) {
  const n = animSayisi(ad);
  for (let i = 1; i <= n; i++) if (!gorsel(`an-${ad}-${i}`)) return 0;
  return n;
}
// Döngü: sn saniyede fps hızında 1..n; bir kez: k (0-1) ilerlemesine göre 1..n. Hazır değilse 0.
function animDongu(ad, sn, fps) { const n = animHazir(ad); return n ? 1 + (Math.floor(sn * fps) % n + n) % n : 0; }
function animBirKez(ad, k) { const n = animHazir(ad); return n ? 1 + Math.max(0, Math.min(n - 1, Math.floor(k * n))) : 0; }
function animCiz(ctx, ad, i, x, y, w, h, alt = false) {
  const im = i ? gorsel(`an-${ad}-${i}`) : null;
  if (!im) return false;
  resmiKutuyaCiz(ctx, im, x, y, w, h, alt);
  return true;
}

// ---- Karakterler (KS1–KS6; kar-<anahtar>-<kostüm>.webp) ----
// Resim, aynı karakterin kod çiziminin boyunda ve ayak hizasında çizilir (oranlar oyunla aynı kalır). Yürürken resmin
// bacak bölümü ikiye ayrılıp sırayla kaldırılır (kod yürüyüşünün aynısı); silahı drawCharacter kodla çizer.
const _karKutu = {};
const _karBacak = {};
let _karKodla = false;
// Kod çiziminin dikey kapsamı (s = 1 biriminde): { ust, alt }. Gölge ve yarı saydam hale sayılmaz.
function karakterKodKutusu(charKey, idx) {
  const k = `${charKey}|${idx}`;
  if (_karKutu[k]) return _karKutu[k];
  const W = 200, H = 240, OY = 130;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  _karKodla = true;
  try { drawCharacter(x, charKey, idx, W / 2, OY, 100); } finally { _karKodla = false; }
  const d = x.getImageData(0, 0, W, H).data;
  let ust = H, alt = 0;
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4 + 3] > 120) { if (yy < ust) ust = yy; if (yy > alt) alt = yy; }
  if (alt <= ust) { ust = OY - 40; alt = OY + 42; }
  return (_karKutu[k] = { ust: ust - OY, alt: alt + 1 - OY });
}
// Resimde bacakların yeri: { oran: bacakların başladığı yükseklik (0-1), ayir: iki bacağı ayıran sütun (0-1) }.
// Bacakların arasında saydam boşluk yok (koyu kontur çizgisi ayırır): eksen en alttaki dolu bölgenin ortası; bacakların
// tepesi, alttan yukarı çıkarken dolu genişliğin %30'dan fazla arttığı satır (gövdenin başladığı yer). Bulunamazsa null.
function karakterBacaklari(anahtar, im) {
  if (_karBacak[anahtar] !== undefined) return _karBacak[anahtar];
  let sonuc = null;
  try {
    const W = im.naturalWidth, H = im.naturalHeight;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, W, H).data;
    const aralik = (yy) => {
      let sol = -1, sag = -1;
      for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4 + 3] >= 128) { if (sol < 0) sol = xx; sag = xx; }
      return sol < 0 ? null : [sol, sag];
    };
    const alt = aralik(Math.floor(H * 0.96));
    if (alt) {
      const bacakGen = alt[1] - alt[0] + 1, eksen = (alt[0] + alt[1]) / 2;
      for (let yy = Math.floor(H * 0.96); yy > H * 0.5; yy--) {
        const a = aralik(yy);
        if (a && a[1] - a[0] + 1 > bacakGen * 1.3) {
          const oran = (yy + 1) / H;
          if (oran > 0.55 && oran < 0.95) sonuc = { oran, ayir: eksen / W };
          break;
        }
      }
    }
  } catch (_) { sonuc = null; }
  return (_karBacak[anahtar] = sonuc);
}
// drawCharacter çağırır (gölgeden sonra, gövde yerine). Çizdiyse true.
function karakterResmiCiz(ctx, charKey, idx, s, swing) {
  if (_karKodla) return false;
  const anahtar = `kar-${charKey}-${idx}`;
  const im = gorsel(anahtar);
  if (!im) return false;
  const kk = karakterKodKutusu(charKey, idx);
  const h = (kk.alt - kk.ust) * s, w = h * im.naturalWidth / im.naturalHeight;
  const x0 = -w / 2, y0 = kk.alt * s - h;
  const bacak = swing && charKey !== "kent" ? karakterBacaklari(anahtar, im) : null; // Kenit: cüppe, bacak yok
  if (!bacak) { ctx.drawImage(im, x0, y0, w, h); return true; }
  const iw = im.naturalWidth, ih = im.naturalHeight, kes = bacak.oran, ky = ih * kes, ax = iw * bacak.ayir, wx = w * bacak.ayir;
  const kalkSol = Math.max(0, swing) * 4 * s, kalkSag = Math.max(0, -swing) * 4 * s;
  ctx.drawImage(im, 0, ky, ax, ih - ky, x0, y0 + h * kes - kalkSol, wx, h * (1 - kes) - kalkSol * 0.6);
  ctx.drawImage(im, ax, ky, iw - ax, ih - ky, x0 + wx, y0 + h * kes - kalkSag, w - wx, h * (1 - kes) - kalkSag * 0.6);
  ctx.drawImage(im, 0, 0, iw, ky, x0, y0, w, h * kes);
  return true;
}

// Animasyon karesini gövdesi (ilk karenin dolu alanı, ANIM_GOVDE) (x, y, w, h) kutusuna oturacak biçimde çizer; karenin
// gövde dışındaki efektleri (küre, ses halkası, duman) kutunun dışına taşabilir. kaynak: renkli kopya için (isteğe bağlı).
function animGovdeCiz(ctx, ad, i, x, y, w, h, alt = true, kaynak = null) {
  const im = kaynak || (i ? gorsel(`an-${ad}-${i}`) : null);
  if (!im) return false;
  const W = im.naturalWidth || im.width, H = im.naturalHeight || im.height;
  const g = (typeof ANIM_GOVDE === "object" && ANIM_GOVDE && ANIM_GOVDE[ad]) || [0, 0, 1, 1];
  const bw = g[2] * W, bh = g[3] * H;
  const o = Math.min(w / bw, h / bh);
  const bx = x + (w - bw * o) / 2, by = alt ? y + h - bh * o : y + (h - bh * o) / 2;
  ctx.drawImage(im, bx - g[0] * W * o, by - g[1] * H * o, W * o, H * o);
  return true;
}

// ---- 3D görünümlü karakterler (A paftaları; k3-<karakter>-<kostüm>-<n>.webp) ----
// Kareler: 1-4 yürüyüş döngüsü, 5-6 duruş nefesi, 7-8 atış (toparlanma, geri tepme). 8 kare aynı kutudan kesildiği
// için karakter kareden kareye zıplamaz; gövde kod çiziminin boyunda ve ayak hizasında çizilir, silahı kod çizer.
// SAF işlev (DOM yok): duruma göre kare numarası (1-8). Yürüyüş ritmi oyunun salınımıyla aynı (Math.sin(walkPhase*12)):
// walkPhase'in bir tam dönüsü (2π/12) yürüyüş döngüsünün bir turudur.
function karakter3dKare(durum) {
  if (durum.shootRecoil > 0.55) return 8;  // geri tepme
  if (durum.shootRecoil > 0.05) return 7;  // toparlanma
  if (durum.yuruyor) {
    const dongu = durum.walkPhase * 12 / (2 * Math.PI);
    return 1 + ((Math.floor(dongu * 4) % 4) + 4) % 4; // negatife karşı güvenli mod
  }
  return 5 + ((Math.floor(durum.zamanSn / 0.55) % 2) + 2) % 2; // nefes: 5 ↔ 6
}
// Karakterin 8 karesi de yüklüyse true (eksik kareyle yarı yolda kalmasın; pafta gelmediyse false)
function karakter3dHazir(charKey, idx) {
  for (let n = 1; n <= 8; n++) if (!gorsel(`k3-${charKey}-${idx}-${n}`)) return false;
  return true;
}
// drawCharacter çağırır (gölgeden sonra, gövde yerine). Kareyi karakter3dKare seçer; boy ve ayak hizası kod çiziminin
// (karakterKodKutusu): resmin alt-ortası (0, kk.alt * s) noktasına gelir. Çizdiyse true.
function karakter3dCiz(ctx, charKey, idx, s, durum) {
  if (_karKodla) return false;
  if (!karakter3dHazir(charKey, idx)) return false;
  const kare = karakter3dKare(durum);
  const im = gorsel(`k3-${charKey}-${idx}-${kare}`);
  if (!im) return false;
  const kk = karakterKodKutusu(charKey, idx);
  const h = (kk.alt - kk.ust) * s * 1.06; // 3D kareler biraz uzun: saç ve taca yer kalsın
  const w = h * im.naturalWidth / im.naturalHeight;
  ctx.drawImage(im, -w / 2, kk.alt * s - h, w, h);
  return true;
}

// ---- 3D silahlar (W paftaları; s3-<anahtar>.webp) ----
// Karakter silahları s3-<karakter>, dükkân silahları s3-<silah>. Resim yoksa null (kod çizimi çalışır).
function silah3d(key) {
  return gorsel(`s3-${key}`);
}
// Resmi tutma yeri (sol kenarın ortası) (0, 0)'a gelecek, namlu sağa bakacak biçimde çizer; genişlik uzunluk * s,
// yükseklik orantılı. Çizdiyse true.
function silah3dCiz(ctx, key, s, uzunluk) {
  const im = silah3d(key);
  if (!im) return false;
  const w = uzunluk * s, h = w * im.naturalHeight / im.naturalWidth;
  ctx.drawImage(im, 0, -h / 2, w, h);
  return true;
}
// Namlu alevi (vurus kareleri, N08): ateşin ilk anında (shootRecoil > 0.6) namlu ucunda (x), sönerken kare ilerler.
// Kare 0 ise (animasyon yüklü değil) çizilmez.
function namluAlevi(ctx, s, shootRecoil, x) {
  if (shootRecoil <= 0.6) return;
  const kare = animBirKez("vurus", 1 - shootRecoil);
  if (!kare) return;
  animCiz(ctx, "vurus", kare, x - 8 * s, -8 * s, 16 * s, 16 * s);
}
