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
