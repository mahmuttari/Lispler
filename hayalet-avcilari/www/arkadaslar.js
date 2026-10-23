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
  // Aynı kimlikle kurulu dinleyiciler varsa bir şey yapılmaz; hata varsa (kurallar sonradan yayınlanmış olabilir) yeniden kurulur
  if (sosyal.uid === u.uid && !sosyal.hata && (sosyal.hazir || sosyal._dinleyiciler.length)) return;
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

// ad: ilk yüklemede beklenen dinleyici (null: beklenmez). Ad, geri çağrıdan önce yüklenenlere girer: arkadaş
// listesinin ilk anlık görüntüsünde durumumuYaz yazabilsin (sonra girince açılışta durum hiç yazılmıyor, arkadaşlar
// önceki oturumdan kalan ⚪'u görüyor ve davet edemiyordu)
function dinle(ref, ad, fn) {
  const geri = ref.on("value", (s) => {
    const ilk = !!ad && !sosyal._yuklenen.has(ad);
    if (ilk) sosyal._yuklenen.add(ad);
    try { fn(s); } catch (e) { console.error("sosyal", ad, e); }
    if (ilk && SOSYAL_ILK_YUKLEME.every((x) => sosyal._yuklenen.has(x))) {
      sosyal.hazir = true;
      if (sosyal._ilkYuklemeBitti) sosyal._ilkYuklemeBitti();
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
  davetSeridiniGuncelle(); // odam değişti: davet edildiğim odaya girdiysem şerit kalkar
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

// Uygulama arka plana geçince ⚪, öne gelince yeniden 🟢/🎮 (bağlantı kapatılmaz: oda düzeni bozulmasın)
document.addEventListener("visibilitychange", () => durumumuYaz());

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
// bulunan: kodun sahibi bulununca { uid, ad } yazılır (ekrandaki bildirimin adı)
async function kodlaArkadasEkle(girdi, bulunan = {}) {
  const kod = arkadasKodunuCoz(girdi);
  if (!kod) return "gecersiz";
  if (!adimVar()) return "adyok";
  if (!sosyal.uid || !sosyal.bagli) return "hata";
  if (kod === sosyal.kod) return "kendi";
  let kayit;
  try { kayit = await sosyalOku(`friendCodes/${kod}`); } catch (e) { return izinHatasi(e) ? "gonderilemedi" : "hata"; }
  if (!kayit || !kayit.uid) return "yok";
  bulunan.uid = kayit.uid;
  bulunan.ad = kisaAd(kayit.name);
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
  const kendi = { [`users/${me}`]: null, [`presence/${me}`]: null };
  try {
    // Başkalarındaki izler sunucudaki kayıttan: dinleyicinin yüklediği eksik olabilir (ilk yükleme gelmemiş, istekler
    // en yeni 30'la sınırlı) ve eksik kalan iz silinmiş hesabın adını başkasının düğümünde bırakır
    const benim = (await sosyalOku(`users/${me}`)) || {};
    const izler = {};
    for (const f of Object.keys(benim.friends || {})) { izler[`users/${f}/friends/${me}`] = null; izler[`users/${f}/invites/${me}`] = null; }
    for (const u of Object.keys(benim.sent || {})) izler[`users/${u}/requests/${me}`] = null;
    for (const u of Object.keys(benim.requests || {})) izler[`users/${u}/sent/${me}`] = null;
    const kod = benim.code || sosyal.kod;
    const kayit = kod ? await sosyalOku(`friendCodes/${kod}`) : null;
    if (kayit && kayit.uid === me) kendi[`friendCodes/${kod}`] = null;
    sosyalDb().ref(`presence/${me}`).onDisconnect().cancel().catch(() => {});
    if (Object.keys(izler).length) await sosyalYaz(izler);
    await sosyalYaz(kendi);
  } catch (e) { console.error("arkadaslikVerisiniSil", e); return false; }
  sosyalDurdur();
  return true;
}

// ============================================================
// ARKADAŞLAR EKRANI (screen-friends) ve menüdeki 👫 düğmesi
// Kullanıcı metni (ad) HTML'e yalnız escapeHtml ile girer; satırlar her veri değişiminde yeniden çizilir.
// ============================================================
const DURUM_SIRASI = { on: 0, room: 1, off: 2 };
const SIMGE_YOK = `<span class="arkadas-simge" aria-hidden="true">👤</span>`;
let _arkadasEkraniBagli = false;
let _acikSatir = null;       // ⋯ menüsü açık arkadaşın uid'i (yeniden çizimde açık kalır)
let _kodlaEkleniyor = false;

function openFriends() {
  showScreen("screen-friends");
  arkadasEkraniniBagla();
  const kurulum = sosyal.hazir && !sosyal.hata ? Promise.resolve() : sosyalBaslat();
  renderFriends();
  // Kod yalnız bu ekran açılınca alınır (veri en aza indirme)
  kurulum.then(() => (sosyal.uid && !sosyal.hata && !sosyal.kod ? kodumuHazirla() : null))
    .catch((e) => console.error("openFriends", e))
    .then(renderFriends);
}

// Satır düğmeleri tek dinleyicide (satırlar innerHTML ile yeniden kurulur)
function arkadasEkraniniBagla() {
  const ekran = document.getElementById("screen-friends");
  if (_arkadasEkraniBagli || !ekran) return;
  _arkadasEkraniBagli = true;
  ekran.addEventListener("click", (e) => {
    const dugme = e.target.closest("button[data-eylem]");
    const satir = dugme && dugme.closest(".arkadas-satir[data-uid]");
    if (satir) arkadasEylemi(dugme.dataset.eylem, satir.dataset.uid, dugme);
  });
  document.getElementById("arkadas-kod-girdi").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); friendsAddFromInput(); }
  });
}

// Kurallar yayınlanmamış, Firebase'e ulaşılamıyor ya da açılışta veri hiç gelmedi
function sosyalKullanilamaz() {
  return !!sosyal.hata || (!sosyal.hazir && !sosyal._baslatiliyor);
}

// { uid: { name, at } } → [{ uid, ad, at }], en yeni önce
function kayitListesi(kayitlar) {
  return Object.entries(kayitlar || {})
    .map(([uid, k]) => ({ uid, ad: kisaAd(k && k.name), at: k && typeof k.at === "number" ? k.at : 0 }))
    .sort((a, b) => b.at - a.at);
}

// Arkadaşın adı önce çevrimiçi durumundaki güncel ad, yoksa listedeki kayıt
function arkadasAdi(uid) {
  const d = sosyal.durumlar[uid], k = sosyal.arkadaslar[uid];
  return kisaAd((d && d.name) || (k && k.name));
}

// Karakter simgesi presence'ten; bilinmeyen karakter anahtarı (yeni sürüm, bozuk veri) Kinkin çizilir
function arkadasSimgesi(uid) {
  const d = sosyal.durumlar[uid];
  if (!d) return SIMGE_YOK;
  const charKey = Object.prototype.hasOwnProperty.call(CHARACTERS, d.charKey) ? d.charKey : "kinkin";
  const costumeIdx = Number.isInteger(d.costumeIdx) ? d.costumeIdx : 0;
  return `<span class="arkadas-simge" aria-hidden="true" style="background-image:url(${karakterSimgesi(charKey, costumeIdx)})"></span>`;
}

function durumMetni(durum) {
  return durum === "on" ? t("🟢 Çevrimiçi") : durum === "room" ? t("🎮 Odada") : t("⚪ Çevrimdışı");
}

function arkadasSatiri(uid, simge, ad, durum, dugmeler, sinif = "") {
  return `<div class="arkadas-satir${sinif ? " " + sinif : ""}" data-uid="${escapeHtml(uid)}">${simge}` +
    `<span class="arkadas-ad" dir="auto">${escapeHtml(ad)}</span>` +
    (durum ? `<span class="arkadas-durum">${durum}</span>` : "") + dugmeler + `</div>`;
}

function renderFriends() {
  const ekran = document.getElementById("screen-friends");
  if (!ekran || !ekran.classList.contains("active")) return;
  const $ = (id) => document.getElementById(id);
  const kapali = sosyalKullanilamaz();
  $("arkadas-uyari").textContent = kapali ? t("⚠ Arkadaşlar şu an kullanılamıyor") : "";
  $("arkadas-uyari").style.display = kapali ? "" : "none";
  $("arkadas-kod").textContent = "#" + (sosyal.kod || "······");
  $("arkadas-kod-yenile").disabled = kapali || !sosyal.kod;
  $("arkadas-kod-girdi").disabled = kapali || !sosyal.uid;
  $("arkadas-ekle-btn").disabled = kapali || !sosyal.uid || _kodlaEkleniyor;

  // Gelen istekler (arkadaş olunmuşsa artık istek sayılmaz)
  const istekler = kayitListesi(sosyal.istekler).filter((k) => !sosyal.arkadaslar[k.uid]);
  $("arkadas-istekler-kutu").style.display = istekler.length ? "" : "none";
  $("arkadas-istekler-baslik").textContent = t("📬 İstekler ({n})", { n: istekler.length });
  $("arkadas-istekler").innerHTML = istekler.map((k) => arkadasSatiri(k.uid, SIMGE_YOK, k.ad, "",
    `<button class="arkadas-kabul" data-eylem="kabul">✓</button>` +
    `<button class="arkadas-reddet" data-eylem="reddet">✕</button>` +
    `<button class="arkadas-istek-engelle" data-eylem="engelle">🚫</button>`)).join("");

  // Arkadaşlar: 🟢, 🎮, ⚪; her grupta ada göre
  const arkadaslar = Object.keys(sosyal.arkadaslar)
    .map((uid) => ({ uid, ad: arkadasAdi(uid), durum: arkadasDurumu(uid) }))
    .sort((a, b) => DURUM_SIRASI[a.durum] - DURUM_SIRASI[b.durum] || a.ad.localeCompare(b.ad));
  $("arkadas-liste-baslik").textContent = t("👫 Arkadaşların ({n}/{max})", { n: arkadaslar.length, max: SOSYAL.ARKADAS_EN_COK });
  $("arkadas-liste").innerHTML = arkadaslar.length
    ? arkadaslar.map((a) => arkadasSatiri(a.uid, arkadasSimgesi(a.uid), a.ad, durumMetni(a.durum),
        `<button class="arkadas-menu" data-eylem="menu" aria-expanded="${a.uid === _acikSatir}">⋯</button>` +
        `<div class="arkadas-eylemler"><button class="arkadas-cikar" data-eylem="cikar">${t("Çıkar")}</button>` +
        `<button class="arkadas-engelle" data-eylem="engelle">${t("Engelle")}</button></div>`, a.uid === _acikSatir ? "acik" : "")).join("")
    : `<div class="arkadas-bos">${sosyal.hazir ? t("Henüz arkadaşın yok. Kodunu paylaş ya da odada ➕'ya dokun.") : kapali ? "" : "⏳"}</div>`;

  // Gönderilen istekler ve engellenenler (açılır kutular; boşken gizli)
  const gonderilen = kayitListesi(sosyal.gonderilen).filter((k) => !sosyal.arkadaslar[k.uid]);
  $("arkadas-gonderilen-kutu").style.display = gonderilen.length ? "" : "none";
  $("arkadas-gonderilen-baslik").textContent = t("▸ Gönderilenler ({n})", { n: gonderilen.length });
  $("arkadas-gonderilen").innerHTML = gonderilen.map((k) => arkadasSatiri(k.uid, SIMGE_YOK, k.ad, "",
    `<button class="arkadas-iptal" data-eylem="iptal">${t("✕ İptal")}</button>`)).join("");
  const engeller = kayitListesi(sosyal.engeller);
  $("arkadas-engellenen-kutu").style.display = engeller.length ? "" : "none";
  $("arkadas-engellenen-baslik").textContent = t("▸ Engellenenler ({n})", { n: engeller.length });
  $("arkadas-engellenen").innerHTML = engeller.map((k) => arkadasSatiri(k.uid, SIMGE_YOK, k.ad, "",
    `<button class="arkadas-kaldir" data-eylem="kaldir">${t("Kaldır")}</button>`)).join("");

  // Google girişi satırı yalnız anonim oyuncuya (arkadaşlar Firebase kimliğine bağlı)
  $("arkadas-google").style.display = currentFirebaseUser() ? "none" : "";
}

async function arkadasEylemi(eylem, uid, dugme) {
  const satir = dugme.closest(".arkadas-satir");
  const adEl = satir && satir.querySelector(".arkadas-ad");
  const ad = (adEl && adEl.textContent) || "?";
  if (eylem === "menu") { _acikSatir = _acikSatir === uid ? null : uid; renderFriends(); return; }
  if (eylem === "cikar" && !confirm(t("{ad} arkadaşlarından çıkarılsın mı?", { ad }))) return;
  if (eylem === "engelle" && !confirm(t("{ad} engellensin mi? İstek ve davet gönderemez.", { ad }))) return;
  dugme.disabled = true;
  let tamam = false;
  if (eylem === "kabul") {
    const r = await istegiKabulEt(uid);
    tamam = r !== "hata";
    if (r === "kabul") showToast(t("👫 Artık arkadaşsınız: {ad}", { ad }));
    else if (r === "dolu") showToast(sonucMesaji("dolu", ad));
  } else if (eylem === "engelle") {
    tamam = await engelle(uid, ad);
  } else {
    const islem = { reddet: istegiReddet, iptal: istegiIptalEt, kaldir: engeliKaldir, cikar: arkadasliktanCikar }[eylem];
    if (!islem) return;
    tamam = await islem(uid);
  }
  if (!tamam) showToast(sonucMesaji("hata", ad));
  if (eylem === "cikar" || eylem === "engelle") _acikSatir = null;
  renderFriends();
}

async function friendsAddFromInput() {
  const girdi = document.getElementById("arkadas-kod-girdi");
  if (_kodlaEkleniyor || !girdi || girdi.disabled) return;
  _kodlaEkleniyor = true;
  renderFriends();
  try {
    const bulunan = {};
    const r = await kodlaArkadasEkle(girdi.value, bulunan);
    showToast(sonucMesaji(r, bulunan.ad));
    if (r === "gonderildi" || r === "kabul") girdi.value = "";
  } finally {
    _kodlaEkleniyor = false;
    renderFriends();
  }
}

// Türkçede "de/da" bağlacı adın son ünlüsüne uyar (Ayşe de, Bora da); ünlüsü olmayan adda "de"
function kalinUnluyleBiter(ad) {
  const unluler = String(ad).match(/[aeıioöuüAEIİOÖUÜ]/g);
  return !!unluler && "aıouAIOU".includes(unluler[unluler.length - 1]);
}

// kodlaArkadasEkle / arkadasIstegiGonder sonucunun bildirimi
function sonucMesaji(sonuc, ad) {
  const d = { ad: kisaAd(ad), n: SOSYAL.ARKADAS_EN_COK };
  switch (sonuc) {
    case "gonderildi": return t("📨 İstek gönderildi: {ad}", d);
    case "kabul": return kalinUnluyleBiter(d.ad) ? t("{ad} da seni eklemiş, artık arkadaşsınız!", d) : t("{ad} de seni eklemiş, artık arkadaşsınız!", d);
    case "kendi": return t("Bu senin kodun");
    case "yok": return t("Kod bulunamadı");
    case "gecersiz": return t("Arkadaş kodu 6 karakter olmalı");
    case "zaten": return t("Zaten arkadaşsınız");
    case "bekliyor": return t("İstek zaten gönderildi");
    case "dolu": return t("Arkadaş listen dolu ({n})", d);
    case "engelli": return t("Önce engeli kaldır");
    case "adyok": return t("Önce avcı adını ayarla");
    case "gonderilemedi": return t("İstek gönderilemedi");
    default: return t("⚠ Bağlanılamadı, yeniden dene");
  }
}

// Menüdeki 👫 rozeti: bekleyen istek + gösterilecek davet; sıfırsa gizli
function rozetiGuncelle() {
  const rozet = document.getElementById("menu-arkadas-rozet");
  if (!rozet) return;
  const n = sosyalRozetSayisi();
  rozet.textContent = n ? String(n) : "";
  rozet.style.display = n ? "" : "none";
  const dugme = document.getElementById("menu-arkadas");
  if (dugme) dugme.setAttribute("aria-label", n ? `${t("Arkadaşlar")} (${n})` : t("Arkadaşlar"));
}

function arkadasKodunuKopyala() {
  if (!sosyal.kod) return;
  const kod = "#" + sosyal.kod;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(kod).then(() => showToast(t("📋 Kopyalandı: {kod}", { kod })), () => fallbackCopy(kod));
  } else {
    fallbackCopy(kod);
  }
}

async function koduYenileOnayla() {
  if (!sosyal.kod || !confirm(t("Yeni kod alınsın mı? Eski kod artık çalışmaz."))) return;
  if (!(await koduYenile())) showToast(sonucMesaji("hata"));
  renderFriends();
}

// ============================================================
// LOBİ (➕ / ⏳ / 👫) VE DAVET PENCERESİ (screen-davet)
// Pencere classList ile açılır (duraklat ekranı gibi): altındaki lobi ya da ⏸ Menü açık kalır.
// ============================================================
const _lobiEkleniyor = new Set(); // ➕ çalışırken düğme pasif, ikinci dokunuş sessiz
let _davetPenceresiBagli = false;

// Lobideki diğer oyuncunun satır sonu: arkadaşsa 👫, isteğim gitmişse ⏳, engellediysem boş, değilse ➕
// (uid onclick metnine yazılmaz: data-uid'den okunur)
function lobiArkadasDugmesi(uid, ad) {
  if (!sosyal.uid || !sosyal.hazir || sosyal.hata || uid === sosyal.uid) return "";
  if (sosyal.arkadaslar[uid]) return `<span class="lp-arkadas">👫</span>`;
  if (sosyal.engeller[uid]) return "";
  if (sosyal.gonderilen[uid]) return `<span class="lp-arkadas">⏳</span>`;
  return `<button class="lp-ekle" data-uid="${escapeHtml(uid)}" aria-label="${escapeHtml(t("➕ Ekle") + ": " + kisaAd(ad))}"` +
    `${_lobiEkleniyor.has(uid) ? " disabled" : ""} onclick="lobidenEkle(this.dataset.uid)">➕</button>`;
}

async function lobidenEkle(uid) {
  if (_lobiEkleniyor.has(uid)) return;
  const p = online.cachedRoom && online.cachedRoom.players && online.cachedRoom.players[uid];
  const ad = kisaAd(p && p.name);
  _lobiEkleniyor.add(uid);
  if (lobidemi()) renderLobby();
  try {
    showToast(sonucMesaji(await arkadasIstegiGonder(uid, ad), ad));
  } finally {
    _lobiEkleniyor.delete(uid);
    if (lobidemi()) renderLobby();
  }
}

function davetSonucMesaji(sonuc, ad) {
  switch (sonuc) {
    case "gonderildi": return t("📨 Davet gönderildi: {ad}", { ad: kisaAd(ad) });
    case "bekle": return t("Biraz bekle, az önce çağırdın.");
    case "adyok": return t("Önce avcı adını ayarla");
    case "hata": return t("⚠ Bağlanılamadı, yeniden dene");
    default: return t("Davet gönderilemedi"); // arkadasdegil, odayok
  }
}

function odaDolu() {
  const r = online.cachedRoom;
  return !!r && Object.keys(r.players || {}).length >= (r.maxPlayers || 5);
}

function openInviteModal() {
  davetPenceresiniBagla();
  document.getElementById("screen-davet").classList.add("active");
  renderInviteModal();
  if (!sosyal.hazir || sosyal.hata) sosyalBaslat().then(renderInviteModal, renderInviteModal);
}

function closeInviteModal() {
  const pencere = document.getElementById("screen-davet");
  if (pencere) pencere.classList.remove("active");
}

function davetPenceresiniBagla() {
  const pencere = document.getElementById("screen-davet");
  if (_davetPenceresiBagli || !pencere) return;
  _davetPenceresiBagli = true;
  pencere.addEventListener("click", (e) => {
    const dugme = e.target.closest("button.davet-gonder");
    const satir = dugme && dugme.closest(".arkadas-satir[data-uid]");
    if (satir) davetEt(satir.dataset.uid, dugme);
  });
}

// Davet edilebilen: 🟢 çevrimiçi ya da 🎮 başka odada; ⚪ çevrimdışı ve bu odadakiler soluk, oda doluyken hiçbiri
function renderInviteModal() {
  const pencere = document.getElementById("screen-davet");
  if (!pencere || !pencere.classList.contains("active")) return;
  const kapali = sosyalKullanilamaz(), dolu = odaDolu();
  const oyuncular = (online.cachedRoom && online.cachedRoom.players) || {};
  document.getElementById("davet-not").textContent = kapali ? t("⚠ Arkadaşlar şu an kullanılamıyor")
    : dolu ? t("Oda dolu") : t("Davet için arkadaşın çevrimiçi olmalı.");
  const simdi = performance.now();
  const satirlar = Object.keys(sosyal.arkadaslar).map((uid) => {
    const durum = arkadasDurumu(uid), odada = !!oyuncular[uid];
    return { uid, ad: arkadasAdi(uid), durum, odada, secilir: !odada && durum !== "off" };
  }).sort((a, b) => (b.secilir - a.secilir) || DURUM_SIRASI[a.durum] - DURUM_SIRASI[b.durum] || a.ad.localeCompare(b.ad));
  document.getElementById("davet-liste").innerHTML = satirlar.length ? satirlar.map((s) => {
    const son = sosyal._sonDavet[s.uid];
    const gitti = !s.odada && son && simdi - son < SOSYAL.DAVET_ARALIK_MS; // aynı arkadaşa 30 sn'de bir
    const sag = gitti ? `<span class="davet-tamam">${t("✓ Gönderildi")}</span>`
      : `<button class="davet-gonder"${s.secilir && !dolu && !kapali ? "" : " disabled"}>📨</button>`;
    return arkadasSatiri(s.uid, arkadasSimgesi(s.uid), s.ad, s.odada ? t("Bu odada") : durumMetni(s.durum), sag, s.secilir ? "" : "soluk");
  }).join("") : `<div class="arkadas-bos">${t("Henüz arkadaşın yok. Kodunu paylaş ya da odada ➕'ya dokun.")}</div>`;
}

async function davetEt(uid, dugme) {
  dugme.disabled = true;
  const ad = arkadasAdi(uid);
  showToast(davetSonucMesaji(await davetGonder(uid), ad));
  renderInviteModal();
}

// ============================================================
// DAVET ŞERİDİ (#davet-seridi) VE KATIL
// ============================================================
let _seritHtml = null;
let _seritZamani = null;
let _davetKatiliyor = false;

// En yeni geçerli davet üstte ince şeritte; davet edildiğim odadaysam gösterilmez ve silinir.
// Aynı içerik yeniden yazılmaz (dokunuş sırasında düğme değişmesin); süresi dolunca kendiliğinden kalkar.
function davetSeridiniGuncelle() {
  const serit = document.getElementById("davet-seridi");
  if (!serit) return;
  clearTimeout(_seritZamani);
  let d = gecerliDavet();
  while (d && online.roomId && d.room === online.roomId) { davetiSil(d.uid); d = gecerliDavet(); }
  const html = !d ? "" :
    `<span class="davet-metin">${t("📨 {ad} seni çağırıyor", { ad: `<bdi>${escapeHtml(kisaAd(d.name))}</bdi>` })}` +
    (d.roomName ? ` · <bdi>${escapeHtml(String(d.roomName).slice(0, 60))}</bdi>` : "") + `</span>` +
    `<button class="davet-katil" onclick="davetiKabulEt()">${t("Katıl")}</button>` +
    `<button class="davet-kapat" onclick="davetiReddet()">✕</button>`;
  if (html !== _seritHtml) { serit.innerHTML = html; _seritHtml = html; }
  serit.style.display = d ? "" : "none";
  if (d) _seritZamani = setTimeout(davetSeridiniGuncelle, Math.max(1000, SOSYAL.DAVET_OMRU_MS - (sunucuSimdi() - d.at) + 500));
}

// Davetle odaya geçerken açık oyunu kapatır (quitToMenu'nün ekran kısmı)
function oyunEkraniniKapat() {
  game.running = false;
  game.menude = false;
  game.paused = false;
  for (const id of ["screen-pause", "screen-gameover", "screen-davet"]) {
    const e = document.getElementById(id);
    if (e) e.classList.remove("active");
  }
  const wb = document.getElementById("weapon-bar");
  if (wb) wb.innerHTML = "";
  if (typeof hostBeklemeGostergesi === "function") hostBeklemeGostergesi(0);
}

// Katıl: davet silinir; tek kişilik oyun sürüyorsa onayla biter (kazançlar kasaya, reklam yok); başka odadaysa
// onayla çıkılır; sonra joinRoom (oyun sürüyorsa hemen katılır; "Oda dolu" / "Oda bulunamadı" joinRoom'dan)
async function davetiKabulEt() {
  const d = gecerliDavet();
  if (!d || _davetKatiliyor) return;
  _davetKatiliyor = true;
  try {
    davetiSil(d.uid);
    davetSeridiniGuncelle();
    let kapandi = false;
    if (game.running && !online.mode) {
      if (!confirm(t("Oyunun biter, kazandıkların kasana eklenir. Arkadaşının odasına geçilsin mi?"))) return;
      oyunSonu(false, false, true);
      oyunEkraniniKapat();
      kapandi = true;
    } else if (online.roomId) {
      if (!confirm(t("Bu odadan ayrılıp arkadaşının odasına geçilsin mi?"))) return;
      await odadanCik();
      oyunEkraniniKapat();
      kapandi = true;
    }
    await joinRoom(d.room);
    if (kapandi && online.roomId !== d.room) goToMenu(); // girilemediyse durmuş oyun ekranında kalınmasın
  } finally {
    _davetKatiliyor = false;
  }
}

// ✕: davet sessizce silinir
async function davetiReddet() {
  const d = gecerliDavet();
  const silme = d ? davetiSil(d.uid) : null;
  davetSeridiniGuncelle();
  await silme;
}
