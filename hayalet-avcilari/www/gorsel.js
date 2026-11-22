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
    im.onload = () => { GORSEL[k] = im; };
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

// ---- Hayaletler ----
// Kutu (s birimi; x, y, w, h): bugünkü kod çiziminin kapladığı alan. Boss kutusu tacı ve haleyi de içerir.
const HAYALET_KUTU = { normal: [-20, -25, 40, 49], boss: [-23, -41, 46, 64] };

function hayaletResmiAnahtari(g) {
  if (g.isBoss) return "hayalet-boss";
  if (g.isShooter) return "hayalet-atici";
  if (g.fromBoss || (g.size || 40) < 30) return "hayalet-mini";
  return "hayalet-normal";
}

// drawGhost çağırır (gövde, yüz ve atış parıltısı yerine). Çizdiyse true; Dünya Turu bossu (kostümlü) kod çizimiyle.
function hayaletResmiCiz(ctx, g, s, renk, donmus, an) {
  const k = hayaletResmiAnahtari(g);
  if (!gorsel(k)) return false;
  let kaynak = gorsel(k);
  if (donmus) kaynak = gorselRenkli(k, "#bae6fd");
  else if (k === "hayalet-normal" && renk !== "#a78bfa") kaynak = gorselRenkli(k, renk); // can kademesi rengi kalır
  const [x, y, w, h] = HAYALET_KUTU[g.isBoss ? "boss" : "normal"];
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
