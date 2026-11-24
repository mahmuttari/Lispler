/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU HİKÂYESİ: METİNLER (3.21.0)
   Şartname: HIKAYE.md. Bu dosya yalnız veri içerir; kurallar ve arayüz hikaye.js'te.
   GEÇİCİ İSKELET: tam metinler araclar ile üretilip bu dosyanın yerine yazılır (biçim aynı kalır).
   Satır: { k: "anlatici" | "gezgin" | "arkadas" | "katilan", m: metin }. Cümle içinde avcı adı geçmez; konuşanın adı etiket.
   ============================================================ */
// Katılış sırası (gezgin listeden çıkarılır) ve katılış ülkelerinin rota sırası
const HIKAYE_AVCI_SIRASI = ["kinkin", "veryi", "kornet", "mark", "kent", "ponko", "gul", "rani", "beti", "fanatik", "silsen", "sercin"];
const HIKAYE_KATILIS_ULKE = [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43];
// Ödül
const HIKAYE_BILMECE_PARA = 100, HIKAYE_BILMECE_ELMAS = 2;

const HIKAYE_KATILIS = {
  kinkin: [
    { k: "katilan", m: t("Selam! Bu sokaklarda benden hızlı koşan yoktur.") },
    { k: "gezgin", m: t("Elimde silik bir harita var; birlikte tamamlayalım mı?") },
    { k: "katilan", m: t("Yolculuk mu? Ben hazırım, hadi koşalım!") },
  ],
};

const HIKAYE_ULKE = {
  TR: {
    hatira: { ad: t("Ebru kâğıdı"), simge: "🎨", not: t("Suyun üstünde boyalarla çizilen desen kâğıda aktarılır.") },
    sahne: [
      { k: "anlatici", m: t("Yolculuk peri bacalarının arasında başlıyor.") },
      { k: "gezgin", m: t("Haritanın ilk parçası buralarda bir yerde olmalı!") },
    ],
  },
  UA: {
    hatira: { ad: t("Pısanka yumurtası"), simge: "🥚", not: t("Mumla desen çizilip boyanan süslü bir yumurta.") },
    sahne: [
      { k: "anlatici", m: t("Ayçiçeği tarlaları göz alabildiğine uzanıyor.") },
      { k: "gezgin", m: t("Bu sarı denizde küçük bir hatıra arıyorum.") },
    ],
  },
};

const HIKAYE_BILMECE = [
  {
    soru: t("Suyun üstünde doğan desen hangisi?"),
    secenek: [t("Ebru kâğıdı"), t("Pısanka"), t("Leylek tüyü")],
    dogru: 0,
    bolum: [t("Haritanın ilk parçası parlıyor."), t("Üstünde küçük bir fener çizimi beliriyor.")],
  },
];

const HIKAYE_FINAL = [
  { k: "anlatici", m: t("Dünyanın ucundaki fener, dostların ışığıyla yanıyor.") },
];
