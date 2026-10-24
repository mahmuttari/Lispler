/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: KİP, KAYIT VE EKRANLAR (3.14.0)
   Kayıt save.dunyaTuru = { acik, damgalar, bitti }:
   - acik: en ileri açık ülkenin rota sırası (1–51); bu sıraya kadar her ülke açıktır
   - damgalar: { "FR": <ilk damganın zamanı ms>, … } ISO koduyla (rota değişse de kaybolmaz)
   - bitti: dünya turunun ilk tamamlandığı zaman (ms); 0 = tamamlanmadı
   Yeni damga +3 💎 verir. Eski sürümün yedeğinde alan yoksa ya da yeni sürümün yedeğinde bilinmeyen kod varsa kayıt
   temizlenerek açılır. Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md §3
   ulkeler.js'ten sonra, game.js'ten önce yüklenir (loadSave turKaydiniTemizle'yi çağırır).
   ============================================================ */

const TUR_DAMGA_ELMAS = 3;

function turKaydiniTemizle(v) {
  const k = v && typeof v === "object" ? v : {};
  const acik = Math.max(1, Math.min(ULKE_SAYISI, Math.floor(Number(k.acik)) || 1));
  const damgalar = {};
  if (k.damgalar && typeof k.damgalar === "object") {
    for (const [kod, zaman] of Object.entries(k.damgalar)) if (ulkeKodla(kod) && Number.isFinite(zaman)) damgalar[kod] = zaman;
  }
  const bitti = Number.isFinite(k.bitti) && k.bitti > 0 ? k.bitti : 0;
  return { acik, damgalar, bitti };
}

function turKaydi() {
  save.dunyaTuru = turKaydiniTemizle(save.dunyaTuru);
  return save.dunyaTuru;
}

// Ülkenin damgasını basar; ilk damgada +3 💎. Sıradaki ülke açılır (acik = max(acik, sıra + 1), en çok 51).
function damgaBas(kod) {
  const u = ulkeKodla(kod);
  if (!u) return { yeni: false };
  const k = turKaydi();
  const yeni = !k.damgalar[kod];
  if (yeni) {
    k.damgalar[kod] = Date.now();
    save.elmas = (save.elmas || 0) + TUR_DAMGA_ELMAS;
  }
  k.acik = Math.max(k.acik, Math.min(ULKE_SAYISI, u.sira + 1));
  persistSave();
  return { yeni };
}

// ---------- Kip ----------
// Dünya Turu'nda oynanan ülke (bölüm numarası = rota sırası); normal oyunda null
function turUlkesi() {
  return typeof game !== "undefined" && game.dunyaTuru ? ulkeSirada(game.level) : null;
}

// Dünya Turu zemini: ailenin zemin(ctx, boyut, palet) ressamı 96 px'lik desen tuvaline bir kez çizer (önbellek ülke kodu
// ve ölçekle). Tuval önce ülkenin zemin rengiyle dolar, ressam yalnız soluk deseni çizer. Desen dünya alanına tek dolguyla
// döşenir ve true döner. Ressam yoksa (ya da tuval kurulamazsa) false: render bugünkü zemini ve ızgarayı çizer.
const TUR_ZEMIN_BOYUT = 96;
let _turZemini = null; // { anahtar, desen }
function turZeminCiz(ctx) {
  const u = turUlkesi(), a = u && window.ULKE_AILELERI[u.aile];
  if (!a || typeof a.zemin !== "function") return false;
  // Desen dönüşümü olmayan tarayıcıda tuval ölçeksiz çizilir (döşeme 96 birimde kalsın)
  const donusum = typeof DOMMatrix === "function" && typeof CanvasPattern !== "undefined" && !!CanvasPattern.prototype.setTransform;
  const s = donusum ? engelOlcegi() : 1, anahtar = u.kod + "|" + s;
  if (!_turZemini || _turZemini.anahtar !== anahtar) {
    _turZemini = { anahtar, desen: null };
    try {
      const n = Math.ceil(TUR_ZEMIN_BOYUT * s), c = document.createElement("canvas");
      c.width = n; c.height = n;
      const cx = c.getContext("2d"), palet = ulkeEngelSeti(u.kod).palet;
      cx.scale(n / TUR_ZEMIN_BOYUT, n / TUR_ZEMIN_BOYUT);
      cx.fillStyle = palet.zemin; cx.fillRect(0, 0, TUR_ZEMIN_BOYUT, TUR_ZEMIN_BOYUT);
      a.zemin(cx, TUR_ZEMIN_BOYUT, palet);
      const desen = ctx.createPattern(c, "repeat");
      if (desen && n !== TUR_ZEMIN_BOYUT) desen.setTransform(new DOMMatrix().scale(TUR_ZEMIN_BOYUT / n));
      _turZemini.desen = desen;
    } catch (_) { _turZemini.desen = null; }
  }
  if (!_turZemini.desen) return false;
  ctx.fillStyle = _turZemini.desen;
  ctx.fillRect(0, 0, game.worldW, game.worldH);
  return true;
}
