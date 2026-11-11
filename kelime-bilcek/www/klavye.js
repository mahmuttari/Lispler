/* ============================================================
   KELİME BİLCEK — OYUN KLAVYESİ (1.0.5)
   Maçta telefonun klavyesi hiç açılmaz: kelime önerisi, otomatik tamamlama ve yapıştırma ile kelime bulunmasın diye
   kelime kutusu salt okunurdur (readonly + inputmode="none"), harfler bu klavyeden girilir. Web sürümünde bilgisayarın
   fiziksel klavyesi de çalışır (orada öneri çubuğu yok).
   Düzen Türkçe Q; q, w ve x Türkçe alfabede yok ve oyunun sözlüğünde hiç geçmez, bu yüzden tuşlar daha geniştir.
   Sınama: test/klavye.test.mjs (tuş mantığı), test/arayuz.test.mjs (tarayıcıda klavyeyle maç).
   ============================================================ */

const KLAVYE_SATIRLARI = ["ertyuıopğü", "asdfghjklşi", "zcvbnmöç"];
const KLAVYE_HARFLERI = new Set(KLAVYE_SATIRLARI.join(""));
const KLAVYE_DUZ = { "â": "a", "î": "i", "û": "u" };

/* Fiziksel klavyeden gelen tuş adı → oyun harfi (yoksa null). Türkçe büyük/küçük harf: I → ı, İ → i. */
function klavyeHarfi(tus) {
  const s = String(tus || "");
  if (Array.from(s).length !== 1) return null;
  const h = s.toLocaleLowerCase("tr-TR");
  const d = KLAVYE_DUZ[h] || h;
  return KLAVYE_HARFLERI.has(d) ? d : null;
}

/* Saf işlev: tuşun kelimeyi nasıl değiştirdiği. tus: harf | "sil" | "bosluk". Baştaki ve art arda boşluk yazılmaz. */
function klavyeTusu(deger, tus, enUzun = 30) {
  const d = String(deger || "");
  if (tus === "sil") return Array.from(d).slice(0, -1).join("");
  if (d.length >= enUzun) return d;
  if (tus === "bosluk") return d && !d.endsWith(" ") ? d + " " : d;
  const h = klavyeHarfi(tus);
  return h ? d + h : d;
}

/* Klavyeyi #klavye içine kurar; gonder: Gönder/Enter'da çağrılacak işlev (oyun.js › submitWord). */
function klavyeKur(gonder) {
  const girdi = document.getElementById("wordInput");
  const kutu = document.getElementById("klavye");
  const panel = document.getElementById("inputRow");
  if (!girdi || !kutu || !panel || kutu.dataset.kuruldu) return;
  kutu.dataset.kuruldu = "1";
  girdi.readOnly = true;
  girdi.setAttribute("inputmode", "none");

  const tusYap = (etiket, deger, sinif, ad) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "kb-tus" + (sinif ? " " + sinif : "");
    b.dataset.tus = deger;
    b.textContent = etiket;
    if (ad) b.setAttribute("aria-label", ad);
    return b;
  };
  KLAVYE_SATIRLARI.forEach((satir, i) => {
    const s = document.createElement("div");
    s.className = "kb-satir";
    Array.from(satir).forEach((h) => s.appendChild(tusYap(h.toLocaleUpperCase("tr-TR"), h)));
    if (i === 2) {
      s.appendChild(tusYap("␣", "bosluk", "kb-genis", "Boşluk"));
      s.appendChild(tusYap("⌫", "sil", "kb-genis kb-sil", "Sil"));
    }
    kutu.appendChild(s);
  });

  const bas = (tus) => {
    if (girdi.disabled) return;
    const yeni = klavyeTusu(girdi.value, tus, girdi.maxLength > 0 ? girdi.maxLength : 30);
    if (yeni === girdi.value) return;
    girdi.value = yeni;
    girdi.dispatchEvent(new Event("input", { bubbles: true }));
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
  };
  // Tuşa basınca odak tuşta kalmasın (bilgisayarda boşluk/Enter odaktaki harfi yeniden basmasın)
  kutu.addEventListener("mousedown", (e) => e.preventDefault());
  kutu.addEventListener("click", (e) => {
    const b = e.target.closest(".kb-tus");
    if (b && !b.disabled) bas(b.dataset.tus);
  });
  // Sil'e basılı tutunca harfler art arda silinir
  let silZaman = null;
  const silBitir = () => { clearInterval(silZaman); clearTimeout(silZaman); silZaman = null; };
  kutu.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".kb-sil")) return;
    silBitir();
    silZaman = setTimeout(() => { silZaman = setInterval(() => bas("sil"), 70); }, 450);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((o) => kutu.addEventListener(o, silBitir));

  // Fiziksel klavye (web sürümü, bağlı klavye): yalnız maç ekranında ve yazma paneli açıkken
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (panel.style.display === "none" || panel.closest(".hidden")) return;
    const hedef = e.target;
    if (hedef && hedef !== girdi && (hedef.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(hedef.tagName))) return;
    if (e.key === "Enter") {
      if (hedef && hedef.tagName === "BUTTON" && hedef !== document.getElementById("sendBtn") && !hedef.closest("#klavye")) return;
      e.preventDefault();
      if (!girdi.disabled) gonder();
      return;
    }
    if (e.key === "Backspace") { e.preventDefault(); bas("sil"); return; }
    if (e.key === " ") {
      if (hedef && (hedef.tagName === "BUTTON" || hedef.tagName === "SUMMARY")) return;
      e.preventDefault(); bas("bosluk"); return;
    }
    const h = klavyeHarfi(e.key);
    if (h) { e.preventDefault(); bas(h); }
  });

  // Kelime kutusu kapalıysa (sıra rakipte, denetim sürüyor) tuşlar da kapalı; panel açılınca sayfanın altı boşaltılır
  const yansit = () => {
    kutu.querySelectorAll(".kb-tus").forEach((b) => { b.disabled = girdi.disabled; });
    const acik = panel.style.display !== "none" && !panel.closest(".hidden");
    document.body.classList.toggle("klavye-acik", acik);
    if (acik) document.documentElement.style.setProperty("--klavye-h", panel.offsetHeight + "px");
  };
  new MutationObserver(yansit).observe(girdi, { attributes: true, attributeFilter: ["disabled"] });
  new MutationObserver(yansit).observe(panel, { attributes: true, attributeFilter: ["style"] });
  const ekran = panel.closest("section");
  if (ekran) new MutationObserver(yansit).observe(ekran, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", yansit);
  yansit();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { KLAVYE_SATIRLARI, KLAVYE_HARFLERI, klavyeHarfi, klavyeTusu, klavyeKur };
}
