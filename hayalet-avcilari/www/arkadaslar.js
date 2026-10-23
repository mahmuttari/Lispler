/* ============================================================
   HAYALET AVCILARI — ARKADAŞLAR (3.13.0)
   Arkadaş kodu, istek + kabul, çıkar, engel, çevrimiçi durum ve davet. Veri Realtime Database'de:
   friendCodes/{KOD}, users/{uid}/(code|friends|requests|sent|invites|blocks), presence/{uid}.
   Kurallar: firebase/database.rules.json · tasarım: docs/superpowers/specs/2026-10-23-hayalet-arkadaslar-design.md
   game.js'ten önce yüklenir (playgames.js gibi): yalnız durum ve işlev tanımlar; Firebase'e game.js'in yardımcılarıyla
   (fbDb, fbKullaniciBekle, sunucuZamani, sunucuSimdi) çağrı anında erişir.
   ============================================================ */

const SOSYAL = {
  ARKADAS_EN_COK: 50,
  ISTEK_GOSTER: 30,      // gelen isteklerin en yenileri
  DAVET_GOSTER: 10,      // gelen davetlerin en yenileri
  DAVET_OMRU_MS: 300000, // davet 5 dk geçerli (sunucu saatiyle)
  DAVET_ARALIK_MS: 30000,// aynı arkadaşa en çok 30 sn'de bir davet
  KOD_DENEME: 3,         // kod çakışırsa yeni kodla deneme sayısı
  ZAMAN_ASIMI_MS: 10000, // her ağ işlemi
};
const KOD_ALFABESI = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // oda kodlarıyla aynı (I/L/O/0/1 yok)
const SOSYAL_ILK_YUKLEME = ["friends", "requests", "sent", "invites", "blocks", "code"];

// Kayıtlar { [uid]: gövde }; hata: null | "izin" (kurallar yayınlanmamış) | "baglanti"
// Kayıtları yalnız dinleyiciler yazar: RTDB kendi yazımımızı dinleyiciye hemen yansıtır; yazım sonrası elle ekleme,
// bekleme sırasında karşı taraftan gelen silmenin üstüne yazıp kaydı geri getirir.
const sosyal = {
  uid: null, kod: null,
  arkadaslar: {}, istekler: {}, gonderilen: {}, davetler: {}, engeller: {}, durumlar: {},
  hazir: false, hata: null, bagli: false,
  _dinleyiciler: [],        // { ref, geri }
  _durumDinleyicileri: {},  // arkadaş uid → { ref, geri }
  _yuklenen: new Set(),     // ilk anlık görüntüsü gelen dinleyiciler
  _ilkYuklemeBitti: null,
  _islemler: {},            // aynı işlem çift dokunuşta bir kez çalışır
  _sonDavet: {},            // arkadaş uid → performance.now()
  _ilkIstek: true,          // ilk anlık görüntüdeki istekler için bildirim yok
  _durumSilindi: false,
  _baslatiliyor: null,
};

// ---- yardımcılar ----
function arkadasKoduUret() {
  const sayilar = new Uint32Array(6);
  crypto.getRandomValues(sayilar);
  let kod = "";
  for (const n of sayilar) kod += KOD_ALFABESI[n % KOD_ALFABESI.length];
  return kod;
}

// "#k7mp2q", " K7MP2Q " → "K7MP2Q"; alfabe dışı harf ya da 6'dan farklı uzunluk → null
function arkadasKodunuCoz(girdi) {
  const kod = String(girdi || "").toUpperCase().replace(/[#\s]/g, "");
  return /^[A-HJKMNP-Z2-9]{6}$/.test(kod) ? kod : null;
}

// RTDB çevrimdışıyken yazımı kuyruğa alır ve söz dönmeyebilir: her işlem sınırlı beklenir
function sinirliBekle(soz, ms = SOSYAL.ZAMAN_ASIMI_MS) {
  let zaman = null;
  return Promise.race([
    Promise.resolve(soz).finally(() => clearTimeout(zaman)),
    new Promise((_, ret) => { zaman = setTimeout(() => ret(new Error("zamanasimi")), ms); }),
  ]);
}

const izinHatasi = (e) => /permission/i.test(String((e && (e.code || e.message)) || ""));
const adimVar = () => !!(save.playerName && String(save.playerName).trim());
const adim = () => String(save.playerName || t("Avcı")).slice(0, 50);
const kisaAd = (ad) => String(ad || "?").slice(0, 50) || "?";
const sosyalDb = () => (typeof fbDb === "function" ? fbDb() : null);

function sosyalYaz(yollar) {
  const db = sosyalDb();
  if (!db) return Promise.reject(new Error("firebase yok"));
  return sinirliBekle(db.ref().update(yollar));
}
async function sosyalOku(yol) {
  const db = sosyalDb();
  if (!db) throw new Error("firebase yok");
  const s = await sinirliBekle(db.ref(yol).get());
  return s.exists() ? s.val() : null;
}
// Çevrimdışıyken yazım hiç denenmez: kuyruğa giren istek bağlantı gelince "bağlanılamadı" denmişken gitmesin
async function sosyalIslem(yollar, ad) {
  if (!sosyal.uid || !sosyal.bagli) return false;
  try { await sosyalYaz(yollar); return true; } catch (e) { console.error("sosyal", ad, e); return false; }
}
// Aynı anahtarla süren işlem varsa onu döndürür (çift dokunuş tek yazım)
function tekSefer(anahtar, fn) {
  if (!sosyal._islemler[anahtar]) {
    sosyal._islemler[anahtar] = Promise.resolve().then(fn).finally(() => { delete sosyal._islemler[anahtar]; });
  }
  return sosyal._islemler[anahtar];
}

// ---- dinleyiciler ----
function sosyalBaslat() {
  if (!sosyal._baslatiliyor) sosyal._baslatiliyor = sosyalKur().finally(() => { sosyal._baslatiliyor = null; });
  return sosyal._baslatiliyor;
}

async function sosyalKur() {
  const u = typeof fbKullaniciBekle === "function" ? await fbKullaniciBekle(SOSYAL.ZAMAN_ASIMI_MS) : null;
  const db = sosyalDb();
  if (!u || !db) { sosyal.hata = "baglanti"; sosyalTazele(); return; }
  if (sosyal.uid === u.uid && (sosyal.hazir || sosyal._dinleyiciler.length)) return;
  sosyalDurdur();
  sosyal.uid = u.uid;
  sosyal.hata = null;
  sosyal._ilkIstek = true;
  sosyal._yuklenen = new Set();
  if (typeof sunucuSaatiniDinle === "function") sunucuSaatiniDinle();
  const kok = `users/${u.uid}`;
  dinle(db.ref(".info/connected"), null, (s) => {
    sosyal.bagli = s.val() === true;
    if (sosyal.bagli) durumumuYaz();
  });
  dinle(db.ref(`${kok}/friends`), "friends", (s) => {
    sosyal.arkadaslar = s.val() || {};
    durumDinleyicileriniEsitle();
    durumumuYaz();
  });
  dinle(db.ref(`${kok}/requests`).orderByChild("at").limitToLast(SOSYAL.ISTEK_GOSTER), "requests", (s) => {
    const once = sosyal.istekler;
    sosyal.istekler = s.val() || {};
    yeniIstekleriBildir(once);
  });
  dinle(db.ref(`${kok}/sent`), "sent", (s) => { sosyal.gonderilen = s.val() || {}; });
  dinle(db.ref(`${kok}/invites`).orderByChild("at").limitToLast(SOSYAL.DAVET_GOSTER), "invites", (s) => { sosyal.davetler = s.val() || {}; });
  dinle(db.ref(`${kok}/blocks`), "blocks", (s) => { sosyal.engeller = s.val() || {}; });
  dinle(db.ref(`${kok}/code`), "code", (s) => { if (s.val()) sosyal.kod = s.val(); });
  await new Promise((tamam) => {
    sosyal._ilkYuklemeBitti = tamam;
    setTimeout(tamam, SOSYAL.ZAMAN_ASIMI_MS);
  });
}

// ad: ilk yüklemede beklenen dinleyici (null: beklenmez)
function dinle(ref, ad, fn) {
  const geri = ref.on("value", (s) => {
    try { fn(s); } catch (e) { console.error("sosyal", ad, e); }
    if (ad && !sosyal._yuklenen.has(ad)) {
      sosyal._yuklenen.add(ad);
      if (SOSYAL_ILK_YUKLEME.every((x) => sosyal._yuklenen.has(x))) {
        sosyal.hazir = true;
        if (sosyal._ilkYuklemeBitti) sosyal._ilkYuklemeBitti();
      }
    }
    sosyalDuzenle();
    sosyalTazele();
  }, (e) => {
    console.error("sosyal dinleyici", ad, e);
    sosyal.hata = izinHatasi(e) ? "izin" : "baglanti";
    sosyal.hazir = false;
    if (sosyal._ilkYuklemeBitti) sosyal._ilkYuklemeBitti();
    sosyalTazele();
  });
  sosyal._dinleyiciler.push({ ref, geri });
}

function sosyalDurdur() {
  for (const d of sosyal._dinleyiciler) d.ref.off("value", d.geri);
  for (const d of Object.values(sosyal._durumDinleyicileri)) d.ref.off("value", d.geri);
  Object.assign(sosyal, {
    uid: null, kod: null, arkadaslar: {}, istekler: {}, gonderilen: {}, davetler: {}, engeller: {}, durumlar: {},
    hazir: false, hata: null, _dinleyiciler: [], _durumDinleyicileri: {}, _yuklenen: new Set(), _sonDavet: {},
    _ilkIstek: true, _durumSilindi: false,
  });
  sosyalTazele();
}

// Her arkadaşın presence kaydı dinlenir; izin hatası arkadaşlığın bittiğini gösterir
function durumDinleyicileriniEsitle() {
  const db = sosyalDb();
  if (!db) return;
  for (const f of Object.keys(sosyal._durumDinleyicileri)) {
    if (sosyal.arkadaslar[f]) continue;
    const d = sosyal._durumDinleyicileri[f];
    d.ref.off("value", d.geri);
    delete sosyal._durumDinleyicileri[f];
    delete sosyal.durumlar[f];
  }
  for (const f of Object.keys(sosyal.arkadaslar)) {
    if (sosyal._durumDinleyicileri[f]) continue;
    const ref = db.ref(`presence/${f}`);
    const geri = ref.on("value", (s) => {
      if (s.exists()) sosyal.durumlar[f] = s.val(); else delete sosyal.durumlar[f];
      sosyalTazele();
    }, () => {
      delete sosyal.durumlar[f];
      delete sosyal._durumDinleyicileri[f];
      sosyalTazele();
    });
    sosyal._durumDinleyicileri[f] = { ref, geri };
  }
}

function yeniIstekleriBildir(once) {
  if (sosyal._ilkIstek) { sosyal._ilkIstek = false; return; }
  for (const [u, r] of Object.entries(sosyal.istekler)) {
    if (once[u] || sosyal.gonderilen[u] || sosyal.arkadaslar[u]) continue;
    if (typeof showToast === "function") showToast(t("👫 {ad} arkadaşlık isteği gönderdi", { ad: kisaAd(r && r.name) }));
  }
}

// Karşılıklı ve artık kalmış istekler: arkadaştan gelen istek ve arkadaşa gitmiş istek silinir; benim de istek
// gönderdiğim birinden istek gelirse kabul edilir (aynı anda birbirini ekleyen ikisi böylece arkadaş olur)
function sosyalDuzenle() {
  const me = sosyal.uid;
  if (!me || !sosyal.hazir || !sosyal.bagli) return;
  for (const u of Object.keys(sosyal.istekler)) {
    if (sosyal.arkadaslar[u]) tekSefer("duzen-istek:" + u, () => sosyalIslem({ [`users/${me}/requests/${u}`]: null, [`users/${u}/sent/${me}`]: null }, "düzen"));
    else if (sosyal.gonderilen[u]) istegiKabulEt(u);
  }
  for (const u of Object.keys(sosyal.gonderilen)) {
    if (sosyal.arkadaslar[u]) tekSefer("duzen-sent:" + u, () => sosyalIslem({ [`users/${me}/sent/${u}`]: null, [`users/${u}/requests/${me}`]: null }, "düzen"));
  }
}

// Ekranlar tanımlıysa yeniden çizilir (Arkadaşlar ekranı, davet penceresi, davet şeridi, rozet, açıksa lobi)
function sosyalTazele() {
  for (const ad of ["renderFriends", "renderInviteModal", "davetSeridiniGuncelle", "rozetiGuncelle"]) {
    if (typeof window[ad] === "function") { try { window[ad](); } catch (e) { console.error(ad, e); } }
  }
  if (typeof lobidemi === "function" && typeof renderLobby === "function" && lobidemi()) {
    try { renderLobby(); } catch (e) { console.error("renderLobby", e); }
  }
}

// ---- çevrimiçi durum ----
// Yalnız en az bir arkadaşı olan oyuncu yazar (veri en aza indirme); son arkadaş gidince kayıt silinir
function durumumuYaz() {
  const db = sosyalDb();
  if (!db || !sosyal.uid || !sosyal.bagli || !sosyal._yuklenen.has("friends")) return;
  const ref = db.ref(`presence/${sosyal.uid}`);
  if (!Object.keys(sosyal.arkadaslar).length) {
    if (sosyal._durumSilindi) return;
    sosyal._durumSilindi = true;
    ref.onDisconnect().cancel().catch(() => {});
    ref.remove().catch(() => {});
    return;
  }
  sosyal._durumSilindi = false;
  const state = document.hidden ? "off" : (online.roomId ? "room" : "on");
  const charKey = save.selectedChar || "kinkin";
  const costumeIdx = (save.selectedCostume && save.selectedCostume[charKey]) || 0;
  ref.onDisconnect().update({ state: "off", at: sunucuZamani() }).catch(() => {});
  ref.set({ name: adim(), charKey, costumeIdx, state, at: sunucuZamani() }).catch((e) => console.error("presence", e));
}

function arkadasDurumu(uid) {
  const d = sosyal.durumlar[uid];
  return d && (d.state === "on" || d.state === "room") ? d.state : "off";
}

// ---- kod ----
async function yeniKodAl(eski) {
  const me = sosyal.uid;
  for (let i = 0; i < SOSYAL.KOD_DENEME; i++) {
    const kod = arkadasKoduUret();
    const yollar = { [`friendCodes/${kod}`]: { uid: me, name: adim() }, [`users/${me}/code`]: kod };
    if (eski && eski !== kod) yollar[`friendCodes/${eski}`] = null;
    try { await sosyalYaz(yollar); sosyal.kod = kod; return kod; }
    catch (e) { if (!izinHatasi(e)) throw e; } // kod dolu: yeni kodla dene
  }
  return null;
}

function kodumuHazirla() {
  return tekSefer("kod", async () => {
    if (!sosyal.uid) await sosyalBaslat();
    const me = sosyal.uid;
    if (!me) return null;
    try {
      const kod = await sosyalOku(`users/${me}/code`);
      if (kod) {
        const kayit = await sosyalOku(`friendCodes/${kod}`);
        if (kayit && kayit.uid === me) { sosyal.kod = kod; return kod; }
      }
      return await yeniKodAl(null); // kayıtsız ya da başkasına geçmiş kod (yedekten başka kimliğe yüklenmiş) silinmez
    } catch (e) { console.error("kodumuHazirla", e); return null; }
  });
}

function koduYenile() {
  return tekSefer("kod", async () => {
    if (!sosyal.uid || !sosyal.bagli) return null;
    try { return await yeniKodAl(sosyal.kod); } catch (e) { console.error("koduYenile", e); return null; }
  });
}

// ---- istek, kabul, ret, iptal ----
async function kodlaArkadasEkle(girdi) {
  const kod = arkadasKodunuCoz(girdi);
  if (!kod) return "gecersiz";
  if (!adimVar()) return "adyok";
  if (!sosyal.uid || !sosyal.bagli) return "hata";
  if (kod === sosyal.kod) return "kendi";
  let kayit;
  try { kayit = await sosyalOku(`friendCodes/${kod}`); } catch (e) { return izinHatasi(e) ? "gonderilemedi" : "hata"; }
  if (!kayit || !kayit.uid) return "yok";
  return arkadasIstegiGonder(kayit.uid, kayit.name);
}

function arkadasIstegiGonder(uid, ad) {
  return tekSefer("istek:" + uid, async () => {
    if (!adimVar()) return "adyok";
    const me = sosyal.uid;
    if (!me || !sosyal.bagli) return "hata";
    if (uid === me) return "kendi";
    if (sosyal.arkadaslar[uid]) return "zaten";
    if (sosyal.engeller[uid]) return "engelli";
    if (Object.keys(sosyal.arkadaslar).length >= SOSYAL.ARKADAS_EN_COK) return "dolu";
    if (sosyal.istekler[uid]) {
      const r = await istegiKabulEt(uid);
      return r === "kabul" || r === "dolu" ? r : "hata";
    }
    if (sosyal.gonderilen[uid]) return "bekliyor";
    try {
      await sosyalYaz({
        [`users/${uid}/requests/${me}`]: { name: adim(), at: sunucuZamani() },
        [`users/${me}/sent/${uid}`]: { name: kisaAd(ad), at: sunucuZamani() },
      });
      return "gonderildi";
    } catch (e) { return izinHatasi(e) ? "gonderilemedi" : "hata"; }
  });
}

function istegiKabulEt(uid) {
  return tekSefer("kabul:" + uid, async () => {
    const me = sosyal.uid;
    if (sosyal.arkadaslar[uid]) return "kabul";
    const istek = sosyal.istekler[uid];
    if (!istek) return "yok";
    if (!me || !sosyal.bagli) return "hata";
    if (Object.keys(sosyal.arkadaslar).length >= SOSYAL.ARKADAS_EN_COK) return "dolu";
    try {
      await sosyalYaz({
        [`users/${me}/friends/${uid}`]: { name: kisaAd(istek.name), at: sunucuZamani() },
        [`users/${uid}/friends/${me}`]: { name: adim(), at: sunucuZamani() },
        [`users/${me}/requests/${uid}`]: null,
        [`users/${uid}/sent/${me}`]: null,
      });
      return "kabul";
    } catch (e) {
      // Karşı taraf aynı anda benim isteğimi kabul etmiş olabilir (karşılıklı istek): arkadaşlık varsa tamam
      if (izinHatasi(e) && await sosyalOku(`users/${me}/friends/${uid}`).catch(() => null)) return "kabul";
      return "hata";
    }
  });
}

function istegiReddet(uid) {
  const me = sosyal.uid;
  return sosyalIslem({ [`users/${me}/requests/${uid}`]: null, [`users/${uid}/sent/${me}`]: null }, "ret");
}

function istegiIptalEt(uid) {
  const me = sosyal.uid;
  return sosyalIslem({ [`users/${uid}/requests/${me}`]: null, [`users/${me}/sent/${uid}`]: null }, "iptal");
}

// ---- çıkar, engel ----
function arkadasliktanCikar(uid) {
  const me = sosyal.uid;
  return sosyalIslem({
    [`users/${me}/friends/${uid}`]: null, [`users/${uid}/friends/${me}`]: null,
    [`users/${me}/invites/${uid}`]: null, [`users/${uid}/invites/${me}`]: null,
  }, "çıkar");
}

function engelle(uid, ad) {
  const me = sosyal.uid;
  return sosyalIslem({
    [`users/${me}/blocks/${uid}`]: { name: kisaAd(ad), at: sunucuZamani() },
    [`users/${me}/friends/${uid}`]: null, [`users/${uid}/friends/${me}`]: null,
    [`users/${me}/requests/${uid}`]: null, [`users/${uid}/requests/${me}`]: null,
    [`users/${me}/sent/${uid}`]: null, [`users/${uid}/sent/${me}`]: null,
    [`users/${me}/invites/${uid}`]: null, [`users/${uid}/invites/${me}`]: null,
  }, "engel");
}

function engeliKaldir(uid) {
  return sosyalIslem({ [`users/${sosyal.uid}/blocks/${uid}`]: null }, "engel kaldır");
}

// ---- davet ----
function davetGonder(uid) {
  return tekSefer("davet:" + uid, async () => {
    if (!adimVar()) return "adyok";
    if (!online.roomId) return "odayok";
    if (!sosyal.arkadaslar[uid]) return "arkadasdegil";
    const son = sosyal._sonDavet[uid];
    if (son && performance.now() - son < SOSYAL.DAVET_ARALIK_MS) return "bekle";
    if (!sosyal.uid || !sosyal.bagli) return "hata";
    const roomName = String((online.cachedRoom && online.cachedRoom.name) || "").slice(0, 60);
    try {
      await sosyalYaz({ [`users/${uid}/invites/${sosyal.uid}`]: { room: online.roomId, roomName, name: adim(), at: sunucuZamani() } });
      sosyal._sonDavet[uid] = performance.now();
      return "gonderildi";
    } catch (e) { return izinHatasi(e) ? "arkadasdegil" : "hata"; }
  });
}

function davetiSil(uid) {
  delete sosyal.davetler[uid];
  return tekSefer("davet-sil:" + uid, () => sosyalIslem({ [`users/${sosyal.uid}/invites/${uid}`]: null }, "davet sil"));
}

// En yeni geçerli davet: gönderen hâlâ arkadaş ve davet 5 dakikadan yeni; geçersizler silinir
function gecerliDavet() {
  let enYeni = null;
  for (const [uid, d] of Object.entries(sosyal.davetler)) {
    const gecerli = d && sosyal.arkadaslar[uid] && typeof d.at === "number" && sunucuSimdi() - d.at <= SOSYAL.DAVET_OMRU_MS;
    if (!gecerli) { if (sosyal.hazir) davetiSil(uid); continue; }
    if (!enYeni || d.at > enYeni.at) enYeni = { uid, ...d };
  }
  return enYeni;
}

// Menüdeki 👫 rozeti: bekleyen istekler + gösterilecek davet
function sosyalRozetSayisi() {
  const istek = Object.keys(sosyal.istekler).filter((u) => !sosyal.arkadaslar[u]).length;
  return istek + (gecerliDavet() ? 1 : 0);
}

// ---- ad değişikliği, hesap silme ----
function sosyalAdGuncelle() {
  if (!sosyal.uid || !adimVar()) return;
  if (sosyal.kod) sosyalIslem({ [`friendCodes/${sosyal.kod}/name`]: adim() }, "kod adı");
  durumumuYaz();
}

// Hesabı Sil: önce başkalarındaki izlerim, sonra kendi düğümlerim; ardından dinleyiciler kapanır
async function arkadaslikVerisiniSil() {
  if (!sosyal.uid) await sosyalBaslat();
  const me = sosyal.uid;
  if (!me || !sosyal.bagli) return false;
  const izler = {};
  for (const f of Object.keys(sosyal.arkadaslar)) { izler[`users/${f}/friends/${me}`] = null; izler[`users/${f}/invites/${me}`] = null; }
  for (const u of Object.keys(sosyal.gonderilen)) izler[`users/${u}/requests/${me}`] = null;
  for (const u of Object.keys(sosyal.istekler)) izler[`users/${u}/sent/${me}`] = null;
  const kendi = { [`users/${me}`]: null, [`presence/${me}`]: null };
  try {
    const kod = sosyal.kod || await sosyalOku(`users/${me}/code`);
    const kayit = kod ? await sosyalOku(`friendCodes/${kod}`) : null;
    if (kayit && kayit.uid === me) kendi[`friendCodes/${kod}`] = null;
    sosyalDb().ref(`presence/${me}`).onDisconnect().cancel().catch(() => {});
    if (Object.keys(izler).length) await sosyalYaz(izler);
    await sosyalYaz(kendi);
  } catch (e) { console.error("arkadaslikVerisiniSil", e); return false; }
  sosyalDurdur();
  return true;
}
