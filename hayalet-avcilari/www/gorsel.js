// Hayalet Avcıları: ChatGPT görsellerini yükler ve çizer (3.18.0).
// Görseller araclar/gorsel_kes.py ile paftalardan kesilir (www/gorsel/*.webp, liste: www/gorsel/liste.js).
// Kural: her çizim işlevi önce resmi dener; resim yoksa (yüklenmedi, dosya yok, pafta gelmedi) bugünkü kod çizimi çalışır.
// Resim yalnız GÖRÜNÜŞÜ değiştirir: boyut kutuları bugünkü çizimin kapladığı alana göre seçildi, çarpışma ve kurallar aynı.
// Karakterler (K1–K6) henüz bağlı değil: paftadaki karakterler silahı elinde çizildi; oyunda silahı kod çizer (nişan,
// geri tepme, dükkân silahları). Elleri boş paftalar (KS1–KS6, gorsel/CHATGPT-ISTEMI.md) gelince bağlanacak.

const GORSEL = {};          // anahtar → yüklenmiş HTMLImageElement
const _gorselRenk = {};     // "anahtar|renk|kip" → renklendirilmiş tuval (önbellek)

function gorselYukle() {
  if (typeof GORSEL_LISTESI !== "object" || !GORSEL_LISTESI) return;
  for (const k of Object.keys(GORSEL_LISTESI)) {
    if (GORSEL[k]) continue;
    const im = new Image();
    im.decoding = "async";
    im.onload = () => {
      GORSEL[k] = im;
      if (k.endsWith("-su") && typeof window.engelSuOnbellegiSil === "function") window.engelSuOnbellegiSil();
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
  let kaynak = gorsel(k);
  if (donmus) kaynak = gorselRenkli(k, "#bae6fd");
  else if (k === "hayalet-normal" && renk !== "#a78bfa") kaynak = gorselRenkli(k, renk); // can kademesi rengi kalır
  const [x, y, w, h] = HAYALET_KUTU[ulkeKod ? "ulke" : g.isBoss ? "boss" : "normal"];
  resmiKutuyaCiz(ctx, kaynak, x * s, y * s, w * s, h * s, true);
  if (an && an.beyaz > 0) {
    ctx.save();
    ctx.globalAlpha *= an.beyaz * 0.75;
    resmiKutuyaCiz(ctx, gorselRenkli(k, "#ffffff", "doldur"), x * s, y * s, w * s, h * s, true);
    ctx.restore();
  }
  if (an && typeof hayaletSarjCiz === "function") hayaletSarjCiz(ctx, s, an.sarj, g.isBoss);
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

gorselYukle();
