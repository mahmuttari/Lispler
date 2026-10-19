/* ============================================================
   HAYALET AVCILARI — DİL DESTEĞİ
   Kaynak dil Türkçedir: metinler kodda Türkçe yazılır ve t() ile çevrilir.
   Sözlükler i18n/<dil>.js dosyalarındadır: anahtar Türkçe metnin kendisi, değer çevirisi.
   {ad} biçimindeki yer tutucular t(metin, { ad: … }) ile doldurulur.
   Dil değişince sayfa yeniden yüklenir; veri tabloları (karakter, silah, tema adları)
   yükleme sırasında bir kez çevrilir.
   ============================================================ */

const DILLER = {
  tr: { ad: "Türkçe", yon: "ltr" },
  en: { ad: "English", yon: "ltr" },
  es: { ad: "Español", yon: "ltr" },
  zh: { ad: "简体中文", yon: "ltr" },
  hi: { ad: "हिन्दी", yon: "ltr" },
  ar: { ad: "العربية", yon: "rtl" },
};
const DIL_KEY = "hayaletAvcilariDil";
const I18N = {}; // i18n/<dil>.js dosyaları doldurur

// Kayıtlı seçim → cihaz dili → İngilizce (desteklenmeyen dillerde)
function dilBul() {
  try {
    const kayitli = localStorage.getItem(DIL_KEY);
    if (kayitli && DILLER[kayitli]) return kayitli;
  } catch (e) {}
  const liste = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
  for (const l of liste) {
    const kod = String(l || "").toLowerCase().split(/[-_]/)[0];
    if (DILLER[kod]) return kod;
  }
  return "en";
}
let DIL = dilBul();

function t(metin, degerler) {
  const sozluk = I18N[DIL];
  let s = (DIL !== "tr" && sozluk && sozluk[metin]) || metin;
  if (degerler) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in degerler ? String(degerler[k]) : m));
  return s;
}

// index.html'deki sabit metinler: yazı düğümleri, placeholder ve data-i18n-html (iç biçimli metin)
function dilUygula(kok) {
  kok = kok || document.body;
  const html = document.documentElement;
  html.lang = DIL;
  html.dir = DILLER[DIL].yon;
  document.title = t("Hayalet Avcıları");
  if (DIL === "tr") return;
  kok.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const anahtar = el.getAttribute("data-i18n-html") || el.innerHTML.trim();
    el.setAttribute("data-i18n-html", anahtar);
    el.innerHTML = t(anahtar);
  });
  const gezgin = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && n.parentElement.closest("script,style,[data-i18n-html]"))
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const dugumler = [];
  while (gezgin.nextNode()) dugumler.push(gezgin.currentNode);
  for (const d of dugumler) {
    const ham = d.nodeValue, metin = ham.trim();
    if (!metin) continue;
    const ceviri = t(metin);
    if (ceviri !== metin) d.nodeValue = ham.replace(metin, ceviri);
  }
  kok.querySelectorAll("[placeholder]").forEach((el) => {
    el.placeholder = t(el.placeholder);
  });
}

function dilDegistir(kod) {
  if (!DILLER[kod]) return;
  try { localStorage.setItem(DIL_KEY, kod); } catch (e) {}
  location.reload();
}

function openLanguage() {
  let modal = document.getElementById("screen-language");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "screen-language";
    modal.className = "screen modal";
    document.body.appendChild(modal);
  }
  const dugmeler = Object.keys(DILLER).map((kod) =>
    `<button class="btn${kod === DIL ? " btn-play" : ""}" dir="${DILLER[kod].yon}" lang="${kod}" onclick="dilDegistir('${kod}')">${kod === DIL ? "✓ " : ""}${DILLER[kod].ad}</button>`
  ).join("");
  modal.innerHTML = `
    <div class="modal-content">
      <h2>🌐 ${t("Dil")}</h2>
      ${dugmeler}
      <button class="btn btn-small" onclick="closeLanguage()">${DILLER[DIL].yon === "rtl" ? "➡" : "⬅"} ${t("Geri")}</button>
    </div>
  `;
  modal.classList.add("active");
}

function closeLanguage() {
  const modal = document.getElementById("screen-language");
  if (modal) modal.classList.remove("active");
}
