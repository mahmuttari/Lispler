/* ============================================================
   FIREBASE CONFIG
   ============================================================ */
/* Google Sign-In Web Client ID (Cordova plugin için runtime parametresi).
   Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration. */
window.GOOGLE_WEB_CLIENT_ID = "313302601000-7jpidappolf8uqnf9hkm0craf5sgf7aj.apps.googleusercontent.com";

/* ============================================================
   SES SİSTEMİ (Web Audio API — synthetic tonlar, dosya yok)
   ============================================================ */
let audioCtx = null;
let soundEnabled = localStorage.getItem("kb_sound") !== "0"; // default: açık

function ensureAudio(){
  if(!audioCtx){
    try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(audioCtx && audioCtx.state === "suspended"){
    try{ audioCtx.resume(); }catch(e){}
  }
  return audioCtx;
}

function playTone(freq, dur, type, vol){
  if(!soundEnabled) return;
  const ctx = ensureAudio();
  if(!ctx) return;
  dur = dur || 0.12;
  type = type || "sine";
  vol = (vol == null) ? 0.16 : vol;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function playSequence(notes){
  if(!soundEnabled) return;
  let acc = 0;
  notes.forEach(n => {
    setTimeout(() => playTone(n.f, n.d || 0.1, n.t || "sine", n.v || 0.16), acc * 1000);
    acc += (n.gap != null ? n.gap : (n.d || 0.08));
  });
}

const SFX = {
  click:      () => playTone(540, 0.04, "square", 0.07),
  toggle:     () => playSequence([{f:520,d:0.04,t:"square",v:0.08},{f:780,d:0.05,t:"square",v:0.08,gap:0.04}]),
  navigate:   () => playTone(720, 0.05, "triangle", 0.09),
  success:    () => playSequence([{f:660,d:0.08},{f:880,d:0.13,gap:0.07}]),
  error:      () => playSequence([{f:300,d:0.09,t:"square",v:0.14},{f:200,d:0.16,t:"square",v:0.14,gap:0.08}]),
  message:    () => playTone(660, 0.09, "triangle", 0.13),
  matchFound: () => playSequence([{f:523,d:0.1},{f:659,d:0.1,gap:0.08},{f:784,d:0.18,gap:0.08}]),
  gameStart:  () => playSequence([{f:440,d:0.07},{f:554,d:0.07,gap:0.06},{f:659,d:0.07,gap:0.06},{f:880,d:0.18,gap:0.06}]),
  win:        () => playSequence([{f:523,d:0.1},{f:659,d:0.1,gap:0.08},{f:784,d:0.1,gap:0.08},{f:1047,d:0.28,gap:0.08}]),
  lose:       () => playSequence([{f:440,d:0.14,t:"triangle"},{f:349,d:0.14,t:"triangle",gap:0.1},{f:261,d:0.3,t:"triangle",gap:0.1}]),
  invite:     () => playSequence([{f:880,d:0.1,t:"triangle"},{f:1175,d:0.14,t:"triangle",gap:0.08},{f:880,d:0.1,t:"triangle",gap:0.1}])
};

/* Global click → click sesi (buttons, lobby items, mode pills, cat items) */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, .lobby-btn, .mode-pill, .cat-item");
  if(t && !t.disabled){
    SFX.click();
  }
}, true);

const firebaseConfig = {
  apiKey: "AIzaSyBRl-LbFFMcWEjAd_7NCC7499kAz8rWs48",
  authDomain: "kelime-bilcek.firebaseapp.com",
  databaseURL: "https://kelime-bilcek-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kelime-bilcek",
  storageBucket: "kelime-bilcek.firebasestorage.app",
  messagingSenderId: "313302601000",
  appId: "1:313302601000:web:a06a624e82cd404b2e941d"
};
firebase.initializeApp(firebaseConfig);
reklamBaslat(); // AdMob + AB onayı (yalnız Android uygulamasında; web'de hiçbir şey yapmaz)
const db = firebase.database();
const auth = firebase.auth();
const SV = firebase.database.ServerValue;

/* ===== Sabitler ===== */
const TURN_SECONDS = 15;
const INVITE_EXPIRE_MS = 60000;
const QUEUE_STALE_MS = 60000;

/* TDK sözlük doğrulaması — kelime gerçek Türkçe mi? (timeout'lu) */
async function isValidTurkishWord(word){
  try{
    const url = "https://sozluk.gov.tr/gts?ara=" + encodeURIComponent(word.trim());
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { method: "GET", signal: ctrl.signal });
    clearTimeout(timeoutId);
    if(!res.ok) return false;
    const data = await res.json();
    if(Array.isArray(data) && data.length > 0 && data[0] && data[0].madde && !data[0].error) return true;
    return false;
  }catch(e){
    console.warn("TDK kontrol hatası:", e.message);
    return null;
  }
}

/* AI doğrulama — Cloudflare Worker (floral-wave-f116) Workers AI'daki Llama 3.3 70B modelini iki kez sorar; ikisi de
   evet derse kelime geçer (worker/worker.js). v4.11 yorumu yanlış modeli yazıyordu. Worker yalnız Firebase'e
   giriş yapmış oyuncunun kimlik jetonuyla (Authorization: Bearer) yanıt verir; kelime en çok 30, kategori en çok
   60 karakter. */
const AI_PROXY_URL = "https://floral-wave-f116.mahmuttari.workers.dev/";

async function aiValidateWord(category, word){
  if(!auth.currentUser){ return null; }
  try{
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 15000);
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + idToken
      },
      body: JSON.stringify({ kategori: category || "", kelime: word }),
      signal: ctrl.signal
    });
    clearTimeout(timeoutId);
    if(!res.ok){

      return null;
    }
    const data = await res.json();

    if(typeof data.gecerli === "boolean") return data.gecerli;
    return null;
  }catch(e){
    console.warn("AI doğrulama:", (e && e.name === "AbortError") ? "zaman aşımı" : (e && e.message));

    return null;
  }
}

/* Birleşik validator: yerel pre-check → AI → TDK fallback */
/* 1.0.2: cihaz önbelleği — bu cihazda denetlenmiş kelime yeniden sorulmaz (en çok 1500 kayıt, localStorage).
   Yalnız kesin sonuçlar yazılır (yapay zekâ evet/hayır ya da TDK evet); bağlantı hatası yazılmaz. */
const DENETIM_ONBELLEK_ANAHTARI = "kb_denetim_v1";
const DENETIM_ONBELLEK_EN_COK = 1500;
function denetimOnbellegi(){
  try{ const o = JSON.parse(localStorage.getItem(DENETIM_ONBELLEK_ANAHTARI) || "{}"); return (o && typeof o === "object") ? o : {}; }
  catch(e){ return {}; }
}
function denetimAnahtari(category, word){ return (category || "zincir") + "|" + normalizeWord(word); }
function denetimOku(category, word){
  const v = denetimOnbellegi()[denetimAnahtari(category, word)];
  return typeof v === "boolean" ? v : null;
}
function denetimYaz(category, word, sonuc){
  try{
    const o = denetimOnbellegi();
    o[denetimAnahtari(category, word)] = !!sonuc;
    const anahtarlar = Object.keys(o);
    for(let i = 0; i < anahtarlar.length - DENETIM_ONBELLEK_EN_COK; i++) delete o[anahtarlar[i]];
    localStorage.setItem(DENETIM_ONBELLEK_ANAHTARI, JSON.stringify(o));
  }catch(e){ /* depolama yoksa önbelleksiz devam */ }
}

async function validateWordSmart(category, word){
  // 1. Yerel hızlı kontrol
  const pre = localCategoryPreCheck(category, word);
  if(pre === true){ return true; }
  if(pre === false){ return false; }
  // 2. Bu cihazın önbelleği (1.0.2)
  const onceki = denetimOku(category, word);
  if(onceki !== null) return onceki;
  // 3. AI
  const ai = await aiValidateWord(category, word);
  if(ai === true){ denetimYaz(category, word, true); return true; }
  // Kategori varsa AI otoritedir (HAYIR dediyse reddet)
  // Zincir modunda (kategori yok) cömert davran: AI HAYIR dese bile TDK'ya bak
  if(category && ai === false){ denetimYaz(category, word, false); return false; }
  const tdk = await isValidTurkishWord(word);
  if(tdk === true || (tdk === false && ai === false)) denetimYaz(category, word, tdk === true);
  return tdk === true;
}

function vibrate(pattern){
  try{ navigator.vibrate && navigator.vibrate(pattern); }catch(e){}
}

/* ===== Match yardımcıları ===== */
function pickMatchCategories(mode, pool){
  if(mode === "chain") return []; // Zincir modunda kategori yok
  const list = (Array.isArray(pool) && pool.length > 0) ? pool : CATEGORIES;
  const totalR = mode === "duel" ? TOTAL_ROUNDS_DUEL : TOTAL_ROUNDS_SIM;
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  const out = shuffled.slice(0, totalR);
  while(out.length < totalR) out.push(list[Math.floor(Math.random() * list.length)]);
  return out;
}

/* Bir kullanıcının kategori tercihlerini Firebase'den oku.
   null veya boş array dönerse kullanıcı tüm kategorileri kabul ediyor say. */
async function fetchCategoryPrefs(uid){
  try{
    const snap = await db.ref(`users/${uid}/categoryPrefs`).once("value");
    const data = snap.val();
    if(!data) return null;
    if(Array.isArray(data)) return data.filter(x => typeof x === "string" && CATEGORIES.includes(x));
    if(typeof data === "object") return Object.values(data).filter(x => typeof x === "string" && CATEGORIES.includes(x));
    return null;
  }catch(e){
    console.warn("fetchCategoryPrefs:", e.message);
    return null;
  }
}

/* İki oyuncunun tercih kümelerini birleştir.
   Birinin tercihi yoksa (null) tüm kategorileri kabul ediyor sayılır → birleşim = CATEGORIES. */
async function buildMatchPool(myUidArg, otherUidArg){
  const [mine, other] = await Promise.all([
    fetchCategoryPrefs(myUidArg),
    fetchCategoryPrefs(otherUidArg)
  ]);
  if(!mine && !other) return CATEGORIES.slice();
  if(!mine) return (other && other.length > 0) ? other : CATEGORIES.slice();
  if(!other) return (mine.length > 0) ? mine : CATEGORIES.slice();
  const set = new Set([...mine, ...other]);
  const arr = [...set];
  return arr.length > 0 ? arr : CATEGORIES.slice();
}
function makeMatchInit(cats, mode){
  let totalR;
  if(mode === "chain") totalR = TOTAL_ROUNDS_CHAIN;
  else if(mode === "duel") totalR = TOTAL_ROUNDS_DUEL;
  else totalR = TOTAL_ROUNDS_SIM;
  return { mode: mode || "sim", totalRounds: totalR, p1Wins: 0, p2Wins: 0, ties: 0, completedRounds: [], categories: cats };
}
function makeRound1(cats, mode){
  const r = { number: 1, category: (mode === "chain" ? null : cats[0]), phase: "thinking", phaseStartTime: Date.now(), words: {} };
  if(mode === "duel" || mode === "chain"){
    r.turn = Math.random() < 0.5 ? "p1" : "p2";
    r.turnStart = null;
  }
  return r;
}

function updateRulesForMode(mode){
  const card = $("rulesCard");
  if(!card) return;
  const ul = card.querySelector("ul");
  if(!ul) return;
  if(card.dataset.mode === mode) return;
  card.dataset.mode = mode;
  if(mode === "chain"){
    ul.innerHTML = '<li>🔗 <b>Kelime Zinciri</b> — kategori yok, son harf kuralı</li>'
      + '<li>10 sn düşünme süresi</li>'
      + '<li>Sırayla kelime yaz, her sıra <b>15 sn</b></li>'
      + '<li>Yazdığın kelime, rakibinin yazdığı kelimenin <b>son harfi</b> ile başlamalı</li>'
      + '<li>Aynı kelime tekrar kullanılamaz</li>'
      + '<li>TDK\'da olmayan kelime reddedilir</li>'
      + '<li><b>15 sn\'de yazamayan kaybeder</b></li>';
  } else if(mode === "duel"){
    ul.innerHTML = '<li>10 sn düşünme süresi (giriş kapalı)</li>'
      + '<li><b>Sıralı tenis</b>: 30 sn\'de sırayla yazın</li>'
      + '<li>Yanlış/tekrar yazarsan sıra geçmez, süre işler</li>'
      + '<li>30 sn\'de yazamayan o roundu kaybeder</li>'
      + '<li><b>2 round alan maçı kazanır</b> (best of 3)</li>';
  } else {
    ul.innerHTML = '<li>Önce <b>10 sn düşünme</b> süresi (giriş kapalı)</li>'
      + '<li>Sonra <b>30 sn</b> boyunca iki taraf da kelime yazar</li>'
      + '<li>Doğru → 🟢 yeşil, hatalı → 🔴 kırmızı çizgili</li>'
      + '<li>Aynı kelimeyi rakipten önce yazana puan, geç kalan ⚪ gri</li>'
      + '<li>Round sonunda çok bilen kazanır</li>'
      + '<li><b>10 round</b> sonunda en çok round bilen kazanır</li>';
  }
}

/* ===== Stats / Leaderboard =====
   Şampiyonlar listesi herkese açık leaderboard/{uid} kaydından okunur (ad + sayaçlar). v4.11 listeyi kurmak için
   bütün users ağacını indiriyordu: herkesin Google e-postası, arkadaş listesi ve davetleri dahil (DENETIM.md › K-02).
   Sayaçlar ServerValue.increment ile birer artar; kural da her yazımda en çok 1 artışa izin verir. */
const MODLAR = ["sim", "duel", "chain"];
async function recordMatchResult(winner, mode){
  if(!myUid || !myName) return;
  if(!MODLAR.includes(mode)) mode = "sim";
  const isWin = winner === mySlot;
  const isTie = winner === "tie" || !winner;
  const inc = firebase.database.ServerValue.increment;
  const updates = {};
  const say = (alan) => {
    updates[`users/${myUid}/stats/${alan}`] = inc(1);
    updates[`leaderboard/${myUid}/${alan}`] = inc(1);
  };
  updates[`leaderboard/${myUid}/name`] = myName;
  say("totalGames");
  say(`${mode}Games`);
  if(isWin){ say("wins"); say(`${mode}Wins`); }
  else if(isTie){ say("ties"); }
  else { say("losses"); }
  try{ await db.ref().update(updates); }catch(e){ console.warn("stats:", e.message); }
}

async function loadLeaderboard(){
  const list = $("leaderboardList");
  list.innerHTML = '<div class="empty">Yükleniyor...</div>';
  try{
    const snap = await db.ref("leaderboard").orderByChild("wins").limitToLast(25).once("value");
    const users = snap.val() || {};
    const arr = Object.entries(users)
      .filter(([uid, u]) => u && u.name && (u.wins || 0) > 0)
      .map(([uid, u]) => ({
        uid, name: u.name,
        wins: u.wins || 0,
        losses: u.losses || 0,
        total: u.totalGames || 0
      }))
      .sort((a, b) => b.wins - a.wins);
    renderLeaderboard(arr);
  }catch(e){
    console.error(e);
    list.innerHTML = '<div class="empty">Liste yüklenemedi. İnternet bağlantını denetleyip yeniden dene.</div>';
  }
}

function renderLeaderboard(arr){
  const list = $("leaderboardList");
  if(!arr.length){
    list.innerHTML = '<div class="empty">Henüz kazanan yok.<br>İlk şampiyon sen ol!</div>';
    return;
  }
  list.innerHTML = "";
  arr.forEach((u, i) => {
    const rank = i + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
    const isMe = u.uid === myUid;
    const winRate = u.total ? Math.round((u.wins / u.total) * 100) : 0;
    const row = document.createElement("div");
    row.className = "lb-row" + (isMe ? " me" : "");
    row.innerHTML = `
      <span class="lb-rank">${medal}</span>
      <span class="lb-name">${escapeHtml(u.name)}${isMe ? " <small>(sen)</small>" : ""}</span>
      <span class="lb-stats">
        <b>${u.wins}</b><small>G</small>
        <span class="lb-rate">%${winRate}</span>
      </span>`;
    list.appendChild(row);
  });
}


/* ===== Durum ===== */
let myUid = null;
let myName = null;
let roomId = null;
let mySlot = null;
let roomRef = null;
let roomListener = null;
let gameEnded = false;
let inviteListener = null;
let joinRoomListener = null;
let friendsListener = null;
let friendsData = {};
let friendsOnlineListeners = {};
let pendingInviteRoomId = null;
let pendingInviteToUid = null;
let inviteExpireTimer = null;
let queueListener = null;
let inMatchmaking = false;
let currentCategory = null;
/* Round-based state */
let currentRoundData = null;
let currentMatchData = null;
let phaseTickInterval = null;
let pendingPhaseAdvance = false;
let selectedMode = "sim"; // "sim" veya "duel"
let serverTimeOffset = 0;  // Firebase server clock - client clock farkı (ms)
function nowServer(){ return Date.now() + serverTimeOffset; }
const TOTAL_ROUNDS_SIM = 10;
const TOTAL_ROUNDS_DUEL = 3;
const TOTAL_ROUNDS_CHAIN = 1;
const THINKING_MS = 10000;
const ACTIVE_MS = 30000;
const DUEL_TURN_MS = 30000;
const CHAIN_TURN_MS = 15000;
const ENDED_MS = 5000;

/* ===== DOM kısayolları ===== */
const $ = id => document.getElementById(id);
const SCREENS = ["loadingScreen","authScreen","usernameScreen","lobbyScreen","roomCodeScreen","friendsScreen","addFriendScreen","searchingScreen","inviteSentScreen","waitingScreen","gameScreen","endScreen","leaderboardScreen","categoriesScreen","botScreen"];

function show(id){
  SCREENS.forEach(s => { const el=$(s); if(el) el.classList.add("hidden"); });
  const target = $(id); if(target) target.classList.remove("hidden");
  reklamEkranDegisti(id); // banner yalnız lobi ve Şampiyonlar'da (reklam.js)
}
function showToast(msg, ok){
  const t=$("toast");
  t.textContent = msg;
  t.classList.toggle("ok", !!ok);
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.classList.remove("show"), 2400);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}


/* ============================================================
   AUTH + KULLANICI ADI
   ============================================================ */

/* Server zaman offset'i sürekli takip et (clock skew için) */
db.ref(".info/serverTimeOffset").on("value", snap => {
  serverTimeOffset = snap.val() || 0;
});

/* Platform tespiti — Capacitor (Android uygulaması) mı, tarayıcı mı? */
function isNative(){
  return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
}
function googleAuthPlugin(){
  return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) || null;
}
let _googleAuthInited = false;
async function initGoogleAuth(){
  if(_googleAuthInited) return true;
  const ga = googleAuthPlugin();
  if(!ga) return false;
  await ga.initialize({ clientId: window.GOOGLE_WEB_CLIENT_ID, scopes: ["profile", "email"], grantOfflineAccess: false });
  _googleAuthInited = true;
  return true;
}

/* Android'de Google kimlik jetonunu Capacitor eklentisinden alır (@codetrix-studio/capacitor-google-auth;
   serverClientId capacitor.config.json'da). Tarayıcıda Firebase'in açılır penceresi kullanılır. */
async function googleCredential(){
  if(isNative()){
    if(!(await initGoogleAuth())) throw new Error("Google ile giriş eklentisi yok");
    const guser = await googleAuthPlugin().signIn();
    const idToken = guser && guser.authentication && guser.authentication.idToken;
    if(!idToken) throw Object.assign(new Error("cancel"), { code: "cancel" });
    return firebase.auth.GoogleAuthProvider.credential(idToken);
  }
  return null;
}

function girisIptalMi(e){
  const code = String((e && (e.code || e.message)) || e || "");
  return /12501|cancel|popup-closed|user-cancelled/i.test(code);
}

async function signInWithGoogle(){
  const btn = $("googleSignInBtn");
  const errEl = $("authError");
  errEl.textContent = "";
  btn.disabled = true;
  try{
    const credential = await googleCredential();
    if(credential){
      await auth.signInWithCredential(credential);
    } else {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithPopup(provider);
    }
    // onAuthStateChanged devamı halleder
  }catch(e){
    console.error("Google sign-in:", e);
    errEl.textContent = girisIptalMi(e) ? "" : "Giriş başarısız: " + ((e && (e.code || e.message)) || "bilinmeyen hata");
    btn.disabled = false;
  }
}

auth.onAuthStateChanged(async user => {
  if(!user){
    // Çıkış yapıldı veya hiç giriş yapılmadı
    myUid = null; myName = null;
    detachAllListeners();
    $("meBar").classList.add("hidden");
    show("authScreen");
    const btn = $("googleSignInBtn");
    if(btn) btn.disabled = false;
    return;
  }
  myUid = user.uid;
  // v4.11 her girişte Google e-postasını, adını ve fotoğraf adresini users/{uid}/google'a yazıyordu; oyun bunları
  // kullanmıyordu ve herkes okuyabiliyordu (DENETIM.md › K-02). Artık yazılmaz; eski kayıt varsa silinir.
  db.ref(`users/${myUid}/google`).remove().catch(()=>{});

  // Kullanıcı adı var mı?
  const snap = await db.ref(`users/${myUid}`).once("value");
  const data = snap.val();
  if(data && data.name){
    myName = data.name;
    onLoggedIn();
  } else {
    show("usernameScreen");
  }
});

/* Tüm aktif Firebase listener'larını ve presence'i temizler — logout için */
function detachAllListeners(){
  try{
    if(myUid){
      if(inviteListener) db.ref(`users/${myUid}/invite`).off("value", inviteListener);
      if(joinRoomListener) db.ref(`users/${myUid}/joinRoom`).off("value", joinRoomListener);
      if(friendsListener) db.ref(`users/${myUid}/friends`).off("value", friendsListener);
      // v4.11 dinleyiciyi kapatmak yerine çağırıyordu; arkadaşların çevrimiçi dinleyicileri açık kalıyordu (K-09)
      Object.entries(friendsOnlineListeners || {}).forEach(([uid, fn]) => { try{ db.ref(`users/${uid}/online`).off("value", fn); }catch(e){} });
      // 1.0.1: eşleşme ararken çıkış yapılınca kuyruk dinleyicisi açık kalıyordu (K-22)
      if(inMatchmaking) db.ref(`matchmaking/queue/${myUid}`).remove().catch(()=>{});
      inMatchmaking = false;
      detachQueue();
      db.ref(`users/${myUid}/online`).set(false).catch(()=>{});
    }
  }catch(e){ console.warn("detachAllListeners:", e.message); }
  inviteListener = null; joinRoomListener = null; friendsListener = null;
  friendsOnlineListeners = {}; friendsData = {};
}

/* Biten maçın odası silinir (v4.11'de odalar veritabanında sonsuza kadar kalıyordu: kullanıcı adları ve yazılan
   kelimeler dahil; DENETIM.md › K-10). İki oyuncudan önce dönen siler; öteki için silme zararsızdır. */
function odayiTemizle(ref){
  if(!ref || !myUid || ref instanceof YerelOda) return; // bot odası bellekte: silinecek kayıt yok
  const rid = ref.key;
  ref.once("value").then(s => {
    const c = s.val();
    if(c && c.status === "finished") return ref.remove();
    return null;
  }).catch(()=>{}).then(() => db.ref(`users/${myUid}/odalar/${rid}`).remove()).catch(()=>{});
}

/* Hesap silme (Google Play kuralı; web yolu: https://kelime-bilcek.web.app/hesap-silme.html).
   Silinenler: users/{uid} (ad, istatistik, arkadaş listesi, davet, kategori tercihleri, çevrimiçi durumu),
   usernames/{ad}, leaderboard/{uid}, eşleşme kuyruğu kaydı, arkadaşların listesindeki kaydım, katıldığım odalar ve
   Firebase Authentication hesabı. Firebase hesabı silmek için yakın zamanda giriş ister: önce Google ile yeniden
   doğrulanır, veri ancak ondan sonra silinir (doğrulama iptal edilirse hiçbir şey silinmez). */
async function hesabiSil(){
  const user = auth.currentUser;
  if(!user || !myUid) return;
  if(!confirm("Hesabın kalıcı olarak silinecek: kullanıcı adın, istatistiklerin, arkadaş listen ve Şampiyonlar kaydın.\nBu işlem geri alınamaz. Devam edilsin mi?")) return;
  showToast("Google ile yeniden doğrulanıyor…", true);
  try{
    const credential = await googleCredential();
    if(credential) await user.reauthenticateWithCredential(credential);
    else{
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await user.reauthenticateWithPopup(provider);
    }
  }catch(e){
    console.error("reauth:", e);
    showToast(girisIptalMi(e) ? "Silme iptal edildi" : "Doğrulanamadı, hesap silinmedi");
    return;
  }
  const uid = myUid, ad = myName;
  try{
    const kayit = (await db.ref(`users/${uid}`).once("value")).val() || {};
    // Katıldığım odalar (üye olduğum için silebilirim; başkası yeniden kurduysa kural reddeder, geçilir)
    for(const rid of Object.keys(kayit.odalar || {})){
      try{ await db.ref(`rooms/${rid}`).remove(); }catch(e){}
    }
    const updates = {};
    Object.keys(kayit.friends || {}).forEach(f => { updates[`users/${f}/friends/${uid}`] = null; });
    updates[`matchmaking/queue/${uid}`] = null;
    updates[`leaderboard/${uid}`] = null;
    if(ad) updates[`usernames/${ad}`] = null;
    updates[`users/${uid}`] = null;
    // Bağlantı kopunca "online=false" yazacak kayıt iptal edilmezse silinen düğümü yeniden oluşturur
    await db.ref(`users/${uid}/online`).onDisconnect().cancel();
    detachAllListeners();
    await db.ref().update(updates);
  }catch(e){
    console.error("hesap verisi silinemedi:", e);
    showToast("Bağlantı hatası: hesap silinmedi, yeniden dene");
    return;
  }
  try{
    await user.delete();
  }catch(e){
    console.error("auth delete:", e);
    showToast("Veriler silindi; giriş hesabı silinemedi. Yeniden giriş yapıp tekrar dene");
    try{ await auth.signOut(); }catch(_){}
    return;
  }
  const ga = googleAuthPlugin();
  if(ga && _googleAuthInited){ try{ await ga.signOut(); }catch(_){} }
  showToast("Hesabın silindi", true);
}

async function logout(){
  try{ detachAllListeners(); }catch(e){}
  const ga = googleAuthPlugin();
  if(ga && _googleAuthInited){ try{ await ga.signOut(); }catch(e){ console.warn("GoogleAuth signOut:", e); } }
  try{ await auth.signOut(); }catch(e){ console.warn("signOut:", e); }
  // onAuthStateChanged devamı authScreen'e döndürür
}

$("googleSignInBtn").addEventListener("click", signInWithGoogle);
$("meBar").addEventListener("click", openProfileMenu);
$("closeProfileBtn").addEventListener("click", closeProfileMenu);
$("deleteAccountBtn").addEventListener("click", async () => {
  closeProfileMenu();
  await hesabiSil();
});
$("adPrivacyBtn").addEventListener("click", () => { closeProfileMenu(); reklamGizlilikSecenekleri(); });
$("logoutBtn").addEventListener("click", async () => {
  if(!confirm("Çıkış yapmak istediğine emin misin?")) return;
  closeProfileMenu();
  await logout();
});
$("changeNameBtn").addEventListener("click", () => {
  closeProfileMenu();
  openUsernameEditor();
});
$("soundToggleBtn").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("kb_sound", soundEnabled ? "1" : "0");
  updateSoundToggleBtn();
  if(soundEnabled) SFX.toggle();
});
$("usernameBack").addEventListener("click", resetUsernameScreen);

function updateSoundToggleBtn(){
  const btn = $("soundToggleBtn");
  if(btn) btn.textContent = soundEnabled ? "🔊 Sesler: Açık" : "🔇 Sesler: Kapalı";
}
updateSoundToggleBtn();
// Overlay arkaplanına tıklayınca kapansın
$("profileMenu").addEventListener("click", e => {
  if(e.target.id === "profileMenu") closeProfileMenu();
});

function openProfileMenu(){
  $("pmName").textContent = myName || "—";
  // Google email'i RTDB'ye yazılmıştı; o anki currentUser'dan da alabiliriz
  const email = (auth.currentUser && auth.currentUser.email) || "";
  $("pmEmail").textContent = email || "";
  $("profileMenu").classList.remove("hidden");
}
function closeProfileMenu(){
  $("profileMenu").classList.add("hidden");
}

function openUsernameEditor(){
  $("usernameTitle").textContent = "Kullanıcı adını değiştir";
  $("usernameBack").classList.remove("hidden");
  $("usernameInput").value = myName || "";
  $("usernameBtn").disabled = false;
  $("usernameBtn").textContent = "Güncelle";
  show("usernameScreen");
  setTimeout(() => { try{ $("usernameInput").focus(); $("usernameInput").select(); }catch(e){} }, 50);
}

$("usernameBtn").addEventListener("click", registerUsername);
$("usernameInput").addEventListener("keydown", e => { if(e.key==="Enter") registerUsername(); });

async function registerUsername(){
  const raw = $("usernameInput").value.trim().toLowerCase();
  if(!/^[a-z0-9]{3,14}$/.test(raw)){
    showToast("3-14 karakter, sadece harf/rakam");
    return;
  }
  const prev = myName || null;
  if(prev && raw === prev){
    // Değişiklik yok — direkt lobby'e dön
    resetUsernameScreen();
    show("lobbyScreen");
    return;
  }
  $("usernameBtn").disabled = true;
  try{
    // Yeni adı transaction ile rezerve et
    const result = await db.ref(`usernames/${raw}`).transaction(current => {
      if(current === null || current === myUid) return myUid;
      return; // dolu
    });
    if(!result.committed){
      showToast("Bu kullanıcı adı dolu");
      $("usernameBtn").disabled = false;
      return;
    }
    // İlk kayıt mı, değişiklik mi?
    const updates = { name: raw };
    if(!prev) updates.createdAt = SV.TIMESTAMP;
    else updates.renamedAt = SV.TIMESTAMP;
    await db.ref(`users/${myUid}`).update(updates);
    // Eski adı index'ten temizle
    if(prev && prev !== raw){
      try{ await db.ref(`usernames/${prev}`).remove(); }catch(e){ console.warn("old username cleanup:", e.message); }
    }
    myName = raw;
    // Şampiyonlar listesinde kaydım varsa adı da güncellenir
    try{
      const lb = await db.ref(`leaderboard/${myUid}/name`).once("value");
      if(lb.exists()) await db.ref(`leaderboard/${myUid}/name`).set(raw);
    }catch(e){ console.warn("leaderboard name:", e.message); }
    resetUsernameScreen();
    if(prev) showToast("Kullanıcı adı güncellendi", true);
    onLoggedIn();
  }catch(e){
    console.error(e);
    showToast("Kayıt hatası");
    $("usernameBtn").disabled = false;
  }
}

function resetUsernameScreen(){
  $("usernameTitle").textContent = "Kullanıcı adı seç";
  $("usernameBack").classList.add("hidden");
  $("usernameInput").value = "";
  $("usernameBtn").disabled = false;
  $("usernameBtn").textContent = "Kaydet ve Devam Et";
}

function onLoggedIn(){
  $("meBar").classList.remove("hidden");
  $("meBarName").textContent = myName;

  // Online presence
  const onlineRef = db.ref(`users/${myUid}/online`);
  onlineRef.set(true);
  onlineRef.onDisconnect().set(false);

  // Davet dinle
  if(inviteListener) db.ref(`users/${myUid}/invite`).off("value", inviteListener);
  inviteListener = db.ref(`users/${myUid}/invite`).on("value", snap => {
    const inv = snap.val();
    if(!inv) { hideInvitePopup(); return; }
    if(Date.now() - inv.ts > INVITE_EXPIRE_MS){
      // Süresi geçmiş, sil
      db.ref(`users/${myUid}/invite`).remove();
      return;
    }
    showInvitePopup(inv);
  });

  // Matchmaker tarafından oda atanırsa
  if(joinRoomListener) db.ref(`users/${myUid}/joinRoom`).off("value", joinRoomListener);
  joinRoomListener = db.ref(`users/${myUid}/joinRoom`).on("value", snap => {
    const rid = snap.val();
    if(!rid) return;
    db.ref(`users/${myUid}/joinRoom`).remove();
    inMatchmaking = false;
    detachQueue();
    joinRoomById(rid);
  });

  // Arkadaş listesi
  attachFriends();

  // Kategori badge'ı senkronize et
  refreshCatBadge().catch(()=>{});

  show("lobbyScreen");
}

/* ============================================================
   LOBBY NAVIGATION
   ============================================================ */
$("quickMatchBtn").addEventListener("click", startQuickMatch);
$("botBtn").addEventListener("click", () => {
  $("botModAdi").textContent = { sim: "Hızlı", duel: "Sıra Beklicek", chain: "Zincir" }[selectedMode] || "Hızlı";
  show("botScreen");
});
document.querySelectorAll(".bot-zorluk").forEach(b => b.addEventListener("click", () => startBotMatch(b.dataset.zorluk)));
$("friendsBtn").addEventListener("click", () => show("friendsScreen"));
$("roomCodeBtn").addEventListener("click", () => show("roomCodeScreen"));
$("categoriesBtn").addEventListener("click", openCategoriesScreen);
$("leaderboardBtn").addEventListener("click", () => { show("leaderboardScreen"); loadLeaderboard(); });

/* ============================================================
   KATEGORİ SEÇİMİ
   ============================================================ */

let categoriesSelected = new Set();

async function openCategoriesScreen(){
  const prefs = await fetchCategoryPrefs(myUid);
  if(prefs === null){
    categoriesSelected = new Set(CATEGORIES);
  } else {
    categoriesSelected = new Set(prefs);
  }
  renderCategoriesList();
  show("categoriesScreen");
}

function renderCategoriesList(){
  const list = $("categoriesList");
  list.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const emoji = CATEGORY_EMOJI[cat] || "🎯";
    const selected = categoriesSelected.has(cat);
    const item = document.createElement("div");
    item.className = "cat-item" + (selected ? " selected" : "");
    item.innerHTML = `
      <div class="cat-check">✓</div>
      <div class="cat-emoji">${emoji}</div>
      <div class="cat-name">${escapeHtml(cat)}</div>
    `;
    item.addEventListener("click", () => {
      if(categoriesSelected.has(cat)){
        categoriesSelected.delete(cat);
        item.classList.remove("selected");
      } else {
        categoriesSelected.add(cat);
        item.classList.add("selected");
      }
      updateCatCountBadge();
    });
    list.appendChild(item);
  });
  updateCatCountBadge();
}

function updateCatCountBadge(){
  const badge = $("catCountBadge");
  if(badge) badge.textContent = `${categoriesSelected.size}/${CATEGORIES.length}`;
}

$("catSelectAllBtn").addEventListener("click", () => {
  categoriesSelected = new Set(CATEGORIES);
  renderCategoriesList();
});
$("catClearAllBtn").addEventListener("click", () => {
  categoriesSelected = new Set();
  renderCategoriesList();
});
$("catSaveBtn").addEventListener("click", async () => {
  $("catSaveBtn").disabled = true;
  try{
    const arr = [...categoriesSelected];
    if(arr.length === 0){
      await db.ref(`users/${myUid}/categoryPrefs`).remove();
    } else {
      await db.ref(`users/${myUid}/categoryPrefs`).set(arr);
    }
    showToast("Kategoriler kaydedildi", true);
    show("lobbyScreen");
  }catch(e){
    console.error(e); showToast("Kaydedilemedi");
  }finally{
    $("catSaveBtn").disabled = false;
  }
});

async function refreshCatBadge(){
  const prefs = await fetchCategoryPrefs(myUid);
  const count = (prefs === null) ? CATEGORIES.length : prefs.length;
  const badge = $("catCountBadge");
  if(badge) badge.textContent = `${count}/${CATEGORIES.length}`;
}
$("addFriendOpenBtn").addEventListener("click", () => { $("addFriendInput").value=""; show("addFriendScreen"); });
$("joinRoomBtn").addEventListener("click", joinRoomByCode);
$("roomInput").addEventListener("keydown", e => { if(e.key==="Enter") joinRoomByCode(); });
$("addFriendBtn").addEventListener("click", addFriend);
$("addFriendInput").addEventListener("keydown", e => { if(e.key==="Enter") addFriend(); });
$("cancelSearchBtn").addEventListener("click", cancelQuickMatch);
$("cancelInviteBtn").addEventListener("click", cancelInvite);
$("leaveWaitBtn").addEventListener("click", leaveAndReset);
$("leaveBtn").addEventListener("click", forfeitGame);
$("againBtn").addEventListener("click", async () => {
  const bitenOda = roomRef;
  resetGameState();
  show("lobbyScreen");
  odayiTemizle(bitenOda);
  await reklamLobiyeDonus(); // maç bitti: kurallar uygunsa geçiş reklamı (reklam.js)
});
$("sendBtn").addEventListener("click", submitWord);
$("wordInput").addEventListener("keydown", e => { if(e.key==="Enter") submitWord(); });
$("acceptInviteBtn").addEventListener("click", acceptInvite);
$("declineInviteBtn").addEventListener("click", declineInvite);

// Chat'e tıklayınca input'a focus (klavyeyi yeniden açar — bu user gesture içinde olduğu için Android'de çalışır)
$("wordsChat").addEventListener("click", () => {
  if(!currentRoundData || currentRoundData.phase !== "active") return;
  const w = $("wordInput");
  if(w && !w.disabled){
    try{ w.focus(); }catch(e){}
  }
});

document.querySelectorAll("[data-back]").forEach(btn => {
  btn.addEventListener("click", () => {
    const t = btn.getAttribute("data-back");
    show(t === "lobby" ? "lobbyScreen" : t + "Screen");
  });
});

document.querySelectorAll(".mode-pill").forEach(b => {
  b.addEventListener("click", () => {
    selectedMode = b.dataset.mode;
    document.querySelectorAll(".mode-pill").forEach(x => x.classList.toggle("active", x.dataset.mode === selectedMode));
  });
});

/* ============================================================
   ARKADAŞ LİSTESİ
   ============================================================ */
function attachFriends(){
  if(friendsListener) db.ref(`users/${myUid}/friends`).off("value", friendsListener);
  friendsListener = db.ref(`users/${myUid}/friends`).on("value", snap => {
    friendsData = snap.val() || {};
    renderFriends();
  });
}

function renderFriends(){
  const list = $("friendsList");
  const uids = Object.keys(friendsData);
  // 1.0.1: listeden çıkan arkadaşın çevrimiçi dinleyicisi kapatılır (önceden açık kalıyordu; K-22)
  Object.keys(friendsOnlineListeners).forEach(uid => {
    if(friendsData[uid]) return;
    try{ db.ref(`users/${uid}/online`).off("value", friendsOnlineListeners[uid]); }catch(e){}
    delete friendsOnlineListeners[uid];
  });
  $("friendsCount").textContent = uids.length;
  $("friendsCount").classList.toggle("hidden", uids.length === 0);
  if(uids.length === 0){
    list.innerHTML = '<div class="empty">Henüz arkadaşın yok.<br>"+ Arkadaş Ekle" ile başla.</div>';
    return;
  }
  list.innerHTML = "";
  uids.forEach(uid => {
    const name = friendsData[uid] || "?";
    const row = document.createElement("div");
    row.className = "friend-row";
    row.id = "fr_" + uid;
    row.innerHTML = `
      <span class="dot"></span>
      <span class="nm">${escapeHtml(name)}</span>
      <span class="actions">
        <button class="btn small success" data-act="invite" data-uid="${uid}" data-name="${escapeHtml(name)}">Davet</button>
        <button class="btn small danger" data-act="remove" data-uid="${uid}" data-name="${escapeHtml(name)}">✕</button>
      </span>`;
    list.appendChild(row);
    // Online status dinle
    if(friendsOnlineListeners[uid]) db.ref(`users/${uid}/online`).off("value", friendsOnlineListeners[uid]);
    friendsOnlineListeners[uid] = db.ref(`users/${uid}/online`).on("value", s => {
      const r = $("fr_" + uid);
      if(r) r.classList.toggle("online", !!s.val());
    });
  });
  list.querySelectorAll("button[data-act]").forEach(b => {
    b.addEventListener("click", () => {
      const act = b.getAttribute("data-act");
      const uid = b.getAttribute("data-uid");
      const name = b.getAttribute("data-name");
      if(act === "invite") inviteFriend(uid, name);
      else if(act === "remove") removeFriend(uid, name);
    });
  });
}

async function addFriend(){
  const name = $("addFriendInput").value.trim().toLowerCase();
  if(!/^[a-z0-9]{3,14}$/.test(name)){
    showToast("Geçersiz kullanıcı adı");
    return;
  }
  if(name === myName){
    showToast("Kendini ekleyemezsin");
    return;
  }
  $("addFriendBtn").disabled = true;
  try{
    const snap = await db.ref(`usernames/${name}`).once("value");
    const friendUid = snap.val();
    if(!friendUid){
      showToast("Bu kullanıcı bulunamadı");
      return;
    }
    if(friendsData[friendUid]){
      showToast("Zaten arkadaşın");
      return;
    }
    // Karşılıklı ekle
    const updates = {};
    updates[`users/${myUid}/friends/${friendUid}`] = name;
    updates[`users/${friendUid}/friends/${myUid}`] = myName;
    await db.ref().update(updates);
    showToast(name + " eklendi", true);
    show("friendsScreen");
  }catch(e){
    console.error(e);
    showToast("Hata: " + e.message);
  }finally{
    $("addFriendBtn").disabled = false;
  }
}

async function removeFriend(uid, name){
  if(!confirm(name + " arkadaşlıktan çıkarılsın mı?")) return;
  const updates = {};
  updates[`users/${myUid}/friends/${uid}`] = null;
  updates[`users/${uid}/friends/${myUid}`] = null;
  try{
    await db.ref().update(updates);
    showToast("Çıkarıldı");
  }catch(e){ showToast("Hata"); }
}

/* ============================================================
   DAVET (arkadaşa)
   ============================================================ */
async function inviteFriend(friendUid, friendName){
  // Önce online mı kontrol
  const onlineSnap = await db.ref(`users/${friendUid}/online`).once("value");
  if(!onlineSnap.val()){
    if(!confirm(friendName + " şu an çevrimdışı. Yine de davet et?")) return;
  }
  // Oda oluştur — match ve round, davet kabul edildiğinde init edilir
  const newRoomId = "inv_" + Math.random().toString(36).slice(2, 10);
  const roomData = {
    status: "waiting",
    p1: { uid: myUid, name: myName },
    p2: null,
    mode: selectedMode,
    match: null,
    round: null,
    createdAt: SV.TIMESTAMP,
    winner: null,
    reason: null,
    invitedUid: friendUid
  };
  try{
    await db.ref(`rooms/${newRoomId}`).set(roomData);
    // Davet yaz
    await db.ref(`users/${friendUid}/invite`).set({
      from: myUid,
      fromName: myName,
      roomId: newRoomId,
      ts: Date.now()
    });
    pendingInviteRoomId = newRoomId;
    pendingInviteToUid = friendUid;
    $("invitedName").textContent = friendName;
    show("inviteSentScreen");

    // 60 sn sonra otomatik iptal
    if(inviteExpireTimer) clearTimeout(inviteExpireTimer);
    inviteExpireTimer = setTimeout(() => {
      if(pendingInviteRoomId === newRoomId){
        cancelInvite();
        showToast(friendName + " yanıt vermedi");
      }
    }, INVITE_EXPIRE_MS);

    // Davet kabul edilirse oda 'playing' olur, biz de oraya geçeriz
    const watchRef = db.ref(`rooms/${newRoomId}/status`);
    const watchListener = watchRef.on("value", s => {
      if(s.val() === "playing" && pendingInviteRoomId === newRoomId){
        watchRef.off("value", watchListener);
        if(inviteExpireTimer){ clearTimeout(inviteExpireTimer); inviteExpireTimer = null; }
        pendingInviteRoomId = null; pendingInviteToUid = null;
        joinRoomById(newRoomId);
      }
    });
  }catch(e){
    console.error(e);
    showToast("Davet gönderilemedi");
    // Temizle
    db.ref(`rooms/${newRoomId}`).remove().catch(()=>{});
  }
}

async function cancelInvite(){
  if(inviteExpireTimer){ clearTimeout(inviteExpireTimer); inviteExpireTimer = null; }
  if(pendingInviteRoomId){
    try{ await db.ref(`rooms/${pendingInviteRoomId}`).remove(); }catch(e){}
  }
  if(pendingInviteToUid){
    try{ await db.ref(`users/${pendingInviteToUid}/invite`).remove(); }catch(e){}
  }
  pendingInviteRoomId = null;
  pendingInviteToUid = null;
  show("lobbyScreen");
}

/* ============================================================
   GELEN DAVET POPUP
   ============================================================ */
let currentInvite = null;
function showInvitePopup(inv){
  if(roomRef) return; // oyun içindeyse yoksay
  currentInvite = inv;
  $("inviteFromName").textContent = inv.fromName || "Birisi";
  $("invitePopup").classList.remove("hidden");
  SFX.invite();
}
function hideInvitePopup(){
  currentInvite = null;
  $("invitePopup").classList.add("hidden");
}

async function acceptInvite(){
  if(!currentInvite) return;
  const inv = currentInvite;
  $("acceptInviteBtn").disabled = true;
  try{
    // Odaya p2 olarak gir + oyunu başlat
    const ref = db.ref(`rooms/${inv.roomId}`);
    const fromUid = inv.fromUid || (await ref.child("p1/uid").once("value")).val();
    const pool = fromUid ? await buildMatchPool(myUid, fromUid) : null;
    const result = await ref.transaction(c => {
      if(!c) return;
      if(c.status !== "waiting") return;
      if(c.invitedUid && c.invitedUid !== myUid) return;
      c.p2 = { uid: myUid, name: myName };
      const useMode = c.mode || "sim";
      const cats = pickMatchCategories(useMode, pool);
      c.match = makeMatchInit(cats, useMode);
      c.round = makeRound1(cats, useMode);
      c.status = "playing";
      return c;
    });
    if(!result.committed){
      showToast("Davet geçersiz veya iptal edildi");
      await db.ref(`users/${myUid}/invite`).remove();
      hideInvitePopup();
      $("acceptInviteBtn").disabled = false;
      return;
    }
    try{ await ref.child("round/phaseStartTime").set(SV.TIMESTAMP); }catch(e){}
    // Daveti sil
    await db.ref(`users/${myUid}/invite`).remove();
    hideInvitePopup();
    joinRoomById(inv.roomId);
  }catch(e){
    console.error(e);
    showToast("Hata: " + e.message);
  }finally{
    $("acceptInviteBtn").disabled = false;
  }
}

async function declineInvite(){
  if(!currentInvite) return;
  try{
    await db.ref(`users/${myUid}/invite`).remove();
    // Odayı sil (gönderen tarafı bilgilendirmek için)
    await db.ref(`rooms/${currentInvite.roomId}`).remove();
  }catch(e){}
  hideInvitePopup();
}

/* ============================================================
   HIZLI EŞLEŞME
   ============================================================ */
async function startQuickMatch(){
  if(!myUid) return;
  inMatchmaking = true;
  show("searchingScreen");

  // Kuyruğa gir (mod bilgisi de eklenir — sadece aynı modda olanlar eşleşir)
  const myEntry = db.ref(`matchmaking/queue/${myUid}`);
  try{
    await myEntry.set({ name: myName, ts: Date.now(), mode: selectedMode });
    myEntry.onDisconnect().remove();
  }catch(e){
    console.error(e); showToast("Sıraya girilemedi"); show("lobbyScreen");
    inMatchmaking = false;
    return;
  }

  // Birini bul ve odamı oluştur, diğerini joinRoom ile çağır.
  // 1.0.1: aynı anda tek deneme. Kuyruktaki her değişiklik tryMatch'i yeniden başlatıyordu; önceki deneme bitmeden
  // ikincisi başka bir rakibi daha alıp ikinci bir oda kurabiliyordu (DENETIM.md › K-20).
  let eslesiyor = false;
  const tryMatch = async () => {
    if(!inMatchmaking || eslesiyor) return;
    eslesiyor = true;
    try{
      const snap = await db.ref("matchmaking/queue").once("value");
      const queue = snap.val() || {};
      const candidates = Object.entries(queue)
        .filter(([uid, d]) => uid !== myUid && d && d.mode === selectedMode && (Date.now() - d.ts < QUEUE_STALE_MS))
        .sort((a,b) => a[1].ts - b[1].ts);
      if(candidates.length === 0){ return; } // aynı modda kimse yok
      const [otherUid, otherData] = candidates[0];

      // DETERMİNİSTİK MATCHER: yarış önleyici — sadece uid'i küçük olan oda kurar
      // Büyük olan, joinRoom sinyali ile odaya çekilir
      if(myUid >= otherUid) return;

      // Onun kuyruğunu transaction ile alma denemesi
      const claim = await db.ref(`matchmaking/queue/${otherUid}`).transaction(c => {
        if(!c) return; // başkası aldı
        return null; // sil = al
      });
      if(!claim.committed) return;
      // Oda oluştur (match + round başlat)
      // Eşleşme: rakibin kuyruktayken seçtiği mode'u dikkate alabiliriz; basit tutmak için
      // benim seçimim baz alınır
      const useMode = selectedMode;
      const newRoomId = "qm_" + Math.random().toString(36).slice(2, 10);
      const pool = await buildMatchPool(myUid, otherUid);
      const cats = pickMatchCategories(useMode, pool);
      const updates = {};
      updates[`rooms/${newRoomId}`] = {
        status: "playing",
        p1: { uid: myUid, name: myName },
        p2: { uid: otherUid, name: otherData.name },
        mode: useMode,
        match: makeMatchInit(cats, useMode),
        round: makeRound1(cats, useMode),
        createdAt: Date.now(),
        winner: null, reason: null
      };
      updates[`matchmaking/queue/${myUid}`] = null;
      updates[`users/${otherUid}/joinRoom`] = newRoomId;
      await db.ref().update(updates);
      try{ await db.ref(`rooms/${newRoomId}/round/phaseStartTime`).set(SV.TIMESTAMP); }catch(e){}
      inMatchmaking = false;
      detachQueue();
      joinRoomById(newRoomId);
    }catch(e){
      console.error("match err", e);
    }finally{
      eslesiyor = false;
    }
  };

  // 1.0.1: rakibim kuyruk kaydımı aldı ama oda kuramadıysa (ağ hatası) arama ekranında sonsuza kadar kalıyordum.
  // Kaydım 8 sn kuyrukta yoksa ve odaya çağrılmadıysam yeniden sıraya girerim (K-21).
  let kayipZamanlayici = null;
  const kaydimiDenetle = (queue) => {
    if(!inMatchmaking){ clearTimeout(kayipZamanlayici); kayipZamanlayici = null; return; }
    if(queue && queue[myUid]){ clearTimeout(kayipZamanlayici); kayipZamanlayici = null; return; }
    if(kayipZamanlayici) return;
    kayipZamanlayici = setTimeout(() => {
      kayipZamanlayici = null;
      if(!inMatchmaking) return;
      myEntry.set({ name: myName, ts: Date.now(), mode: selectedMode }).catch(()=>{});
    }, 8000);
  };

  // Hemen bir dene + her kuyruk değişiminde tekrar dene
  setTimeout(tryMatch, 600);
  if(queueListener) db.ref("matchmaking/queue").off("value", queueListener);
  queueListener = db.ref("matchmaking/queue").on("value", snap => {
    if(!inMatchmaking) return;
    kaydimiDenetle(snap.val());
    tryMatch();
  });
}

function detachQueue(){
  if(queueListener){ db.ref("matchmaking/queue").off("value", queueListener); queueListener = null; }
}

async function cancelQuickMatch(){
  inMatchmaking = false;
  detachQueue();
  try{ await db.ref(`matchmaking/queue/${myUid}`).remove(); }catch(e){}
  show("lobbyScreen");
}

/* ============================================================
   YAPAY ZEKÂYA KARŞI (1.0.2): oda bellekte (YerelOda), rakip bot.js
   ============================================================ */
function botOdasiMi(){ return !!(roomRef && typeof YerelOda !== "undefined" && roomRef instanceof YerelOda); }

async function startBotMatch(zorluk){
  if(!myUid || roomRef) return;
  const mode = selectedMode;
  // Kategori tercihleri Firebase'den; bağlantı yoksa okuma hiç bitmeyebilir: 2 sn sonra bütün kategorilerle başlanır
  const prefs = mode === "chain" ? null
    : await Promise.race([fetchCategoryPrefs(myUid), new Promise(r => setTimeout(() => r(null), 2000))]);
  const pool = (prefs && prefs.length) ? prefs : CATEGORIES.slice();
  const cats = pickMatchCategories(mode, pool);
  const rid = "bot_" + Math.random().toString(36).slice(2, 10);
  const veri = {
    status: "playing",
    p1: { uid: myUid, name: myName },
    p2: { uid: "bilcek", name: BOT.ad[zorluk] || BOT.ad.orta },
    mode, match: makeMatchInit(cats, mode), round: makeRound1(cats, mode),
    createdAt: Date.now(), winner: null, reason: null
  };
  roomId = rid;
  roomRef = new YerelOda(rid, veri);
  mySlot = "p1";
  await roomRef.child("round/phaseStartTime").set(SV.TIMESTAMP);
  botBaslat(roomRef, zorluk);
  subscribeRoom(); // önce abone ol: ilk çizimde rakip adı hazır olsun (renderRoom ekranı kendisi açar)
  SFX.matchFound();
}

/* ============================================================
   ODA KODU İLE EŞLEŞME (mevcut)
   ============================================================ */
async function joinRoomByCode(){
  const room = $("roomInput").value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,"");
  if(!room){ showToast("Oda kodu gir"); return; }
  $("joinRoomBtn").disabled = true;
  try{
    const ref = db.ref("rooms/"+room);
    const myMode = selectedMode;
    let pool = null;
    try{
      const peek = await ref.once("value");
      const existing = peek.val();
      if(existing && existing.status === "waiting" && existing.p1 && existing.p1.uid && existing.p1.uid !== myUid){
        pool = await buildMatchPool(myUid, existing.p1.uid);
      }
    }catch(e){ console.warn("peek pool:", e.message); }
    const result = await ref.transaction(c => {
      // Yeni oda VEYA bitmiş eski oda → temiz oda kur
      if(c === null || c.status === "finished"){
        return {
          status:"waiting", p1:{uid:myUid,name:myName}, p2:null,
          mode: myMode,
          match: null, round: null,
          createdAt: Date.now(), winner:null, reason:null
        };
      }
      if(c.p1 && c.p1.uid === myUid) return c;
      if(c.p2 && c.p2.uid === myUid) return c;
      if(c.status === "waiting" && (!c.p2 || !c.p2.uid)){
        c.p2 = { uid: myUid, name: myName };
        const useMode = c.mode || myMode;
        const cats = pickMatchCategories(useMode, pool);
        c.match = makeMatchInit(cats, useMode);
        c.round = makeRound1(cats, useMode);
        c.status = "playing";
        return c;
      }
      return; // dolu
    });
    if(!result.committed){
      showToast("Oda dolu");
      $("joinRoomBtn").disabled = false;
      return;
    }
    const data = result.snapshot.val();
    if(data.p1 && data.p1.uid === myUid) mySlot = "p1";
    else if(data.p2 && data.p2.uid === myUid) mySlot = "p2";
    if(mySlot === "p2" && data.status === "playing"){
      try{ await ref.child("round/phaseStartTime").set(SV.TIMESTAMP); }catch(e){}
    }
    roomId = room;
    roomRef = ref;
    $("waitRoom").textContent = roomId;
    if(data.status === "waiting") show("waitingScreen"); else show("gameScreen");
    subscribeRoom();
  }catch(err){
    console.error(err);
    showToast("Bağlantı hatası");
  }finally{
    $("joinRoomBtn").disabled = false;
  }
}

/* ============================================================
   ODAYA OTURMUŞ OYUNCU OLARAK GİR (matchmaker / davet)
   ============================================================ */
async function joinRoomById(rid){
  roomId = rid;
  roomRef = db.ref(`rooms/${rid}`);
  const snap = await roomRef.once("value");
  const d = snap.val();
  if(!d){ showToast("Oda bulunamadı"); show("lobbyScreen"); return; }
  if(d.p1 && d.p1.uid === myUid) mySlot = "p1";
  else if(d.p2 && d.p2.uid === myUid) mySlot = "p2";
  else { showToast("Bu oda sana ait değil"); show("lobbyScreen"); return; }
  show("gameScreen");
  SFX.matchFound();
  subscribeRoom();
}

/* ============================================================
   OYUN AKIŞI (ortak)
   ============================================================ */
function subscribeRoom(){
  // Katıldığım odaların listesi: hesap silinince bu odalar da silinir (hesabiSil)
  if(myUid && roomId && !botOdasiMi()) db.ref(`users/${myUid}/odalar/${roomId}`).set(true).catch(()=>{});
  if(roomListener) roomRef.off("value", roomListener);
  roomListener = roomRef.on("value", snap => {
    const d = snap.val();
    if(!d){
      if(!gameEnded){ showToast("Oda kapatıldı"); leaveAndReset(); }
      return;
    }
    renderRoom(d);
  });
}

function renderRoom(d){
  if(!d) return;
  if(d.status === "waiting"){ show("waitingScreen"); return; }

  if(d.status === "playing"){
    show("gameScreen");
    const me = mySlot === "p1" ? d.p1 : d.p2;
    const opp = mySlot === "p1" ? d.p2 : d.p1;
    const m = d.match || {};
    const mode = m.mode || "sim";
    const meWins = mySlot === "p1" ? (m.p1Wins || 0) : (m.p2Wins || 0);
    const oppWins = mySlot === "p1" ? (m.p2Wins || 0) : (m.p1Wins || 0);

    $("msMeChip").innerHTML = `${escapeHtml(me?.name || "Sen")}: <b>${meWins}</b>`;
    $("msOppChip").innerHTML = `${escapeHtml(opp?.name || "?")}: <b>${oppWins}</b>`;

    const round = d.round || {};
    $("roundNum").textContent = round.number || 1;
    let totalR = m.totalRounds;
    if(!totalR){
      if(mode === "chain") totalR = TOTAL_ROUNDS_CHAIN;
      else if(mode === "duel") totalR = TOTAL_ROUNDS_DUEL;
      else totalR = TOTAL_ROUNDS_SIM;
    }
    $("roundTotal").textContent = totalR;
    $("catLabel").textContent = mode === "chain" ? "🔗 Kelime Zinciri" : (round.category || "—");

    currentRoundData = round;
    currentMatchData = m;
    currentCategory = round.category || null;

    // Kural kartını moda göre güncelle (sadece bir kez per render gerek yok ama OK)
    updateRulesForMode(mode);

    const banner = $("phaseBanner");
    const text = $("phaseText");
    const inputRow = $("inputRow");
    // Aktif fazda rules card kapansın (chat alanı için yer)
    const rcEl = $("rulesCard");
    if(rcEl){
      if(round.phase === "thinking"){
        // Yeni round başında bir kez aç
        if(!rcEl.dataset.thinkingOpened){ rcEl.open = true; rcEl.dataset.thinkingOpened = "1"; }
        rcEl.dataset.activeClosed = "";
      } else if(round.phase === "active"){
        if(!rcEl.dataset.activeClosed){ rcEl.open = false; rcEl.dataset.activeClosed = "1"; }
        rcEl.dataset.thinkingOpened = "";
      }
    }
    if(round.phase === "thinking"){
      banner.className = "phase-banner thinking";
      text.textContent = "⏰ Hazırlan, kelime düşün";
      inputRow.style.display = "none";
      $("liveScores").classList.add("hidden");
    } else if(round.phase === "active"){
      banner.className = "phase-banner active";
      // Input row aktif fazda HER ZAMAN görünür; sıra değilse disabled
      inputRow.style.display = "flex";
      const wIn = $("wordInput");
      const sBtn = $("sendBtn");
      if(mode === "duel" || mode === "chain"){
        const nextL = mode === "chain" ? getChainNextLetter(round.words || {}) : null;
        const letterHint = nextL ? " (" + nextL.toLocaleUpperCase("tr-TR") + " ile başla)" : "";
        const myTurn = (round.turn === mySlot);
        if(myTurn){
          text.textContent = "🎤 SIRA SENDE — Yaz!" + (mode === "chain" ? letterHint : "");
          wIn.disabled = false;
          sBtn.disabled = false;
          wIn.placeholder = mode === "chain" && nextL
            ? "'" + nextL.toLocaleUpperCase("tr-TR") + "' ile başlayan kelime yaz..."
            : "Kelimeyi yaz, Enter ile gönder...";
        } else {
          const oppName = opp?.name || "rakip";
          text.textContent = "⏳ " + oppName + " yazıyor..." + (mode === "chain" ? letterHint : "");
          wIn.disabled = true;
          sBtn.disabled = true;
          wIn.placeholder = oppName + " yazıyor, sıranı bekle...";
          wIn.value = "";
        }
        // Chain modunda kelime sayısı göster (kim kaç kelime yazdı)
        if(mode === "chain"){
          const validWords = Object.values(round.words || {}).filter(w => w.valid === true);
          const meCount = validWords.filter(w => w.by === mySlot).length;
          const oppCount = validWords.filter(w => w.by !== mySlot).length;
          $("lsMeCount").textContent = meCount;
          $("lsOppCount").textContent = oppCount;
          $("liveScores").classList.remove("hidden");
        } else {
          $("liveScores").classList.add("hidden");
        }
      } else {
        text.textContent = "✍️ YAZ! YAZ! YAZ!";
        wIn.disabled = false;
        sBtn.disabled = false;
        wIn.placeholder = "Kelimeyi yaz, Enter ile gönder...";
        $("liveScores").classList.remove("hidden");
      }
    } else if(round.phase === "ended"){
      banner.className = "phase-banner ended";
      const w = round.roundWinner;
      let msg;
      if(mode === "duel" || mode === "chain"){
        const meScore = mySlot === "p1" ? (round.p1Score || 0) : (round.p2Score || 0);
        const oppScore = mySlot === "p1" ? (round.p2Score || 0) : (round.p1Score || 0);
        const scoreText = mode === "chain" ? ` (${meScore} - ${oppScore} kelime)` : "";
        if(w === mySlot) msg = (mode === "chain" ? "🏆 Maçı kazandın!" : "🎉 Roundu kazandın!") + scoreText;
        else if(w === "tie") msg = "🤝 Berabere" + scoreText;
        else msg = "😢 Süre doldu — kaybettin" + scoreText;
      } else {
        const meScore = mySlot === "p1" ? (round.p1Score || 0) : (round.p2Score || 0);
        const oppScore = mySlot === "p1" ? (round.p2Score || 0) : (round.p1Score || 0);
        if(w === mySlot) msg = `🎉 Roundu kazandın (${meScore}-${oppScore})`;
        else if(w === "tie") msg = `🤝 Berabere (${meScore}-${oppScore})`;
        else msg = `😢 Rakip kazandı (${meScore}-${oppScore})`;
      }
      text.textContent = msg;
      inputRow.style.display = "none";
      $("liveScores").classList.add("hidden");
    }

    // Words (chat)
    const wordsObj = round.words || {};
    const words = Object.entries(wordsObj).map(([id, w]) => ({...w, id}))
      .sort((a, b) => (a.ts || 0) - (b.ts || 0));

    const chat = $("wordsChat");
    const oldCount = chat.childElementCount;
    chat.innerHTML = "";
    const mySet = new Set(), oppSet = new Set();
    const claimedBy = {};
    const useClaim = (mode === "sim");
    words.forEach(w => {
      const div = document.createElement("div");
      const sideCls = (w.by === mySlot) ? "me" : "opp";
      let stateCls;
      let claimsThis = false;
      if(w.dup) stateCls = "invalid";
      else if(w.valid === true){
        if(useClaim){
          const k = normalizeWord(w.text);
          if(claimedBy[k] && claimedBy[k] !== w.by){
            stateCls = "stolen";
          } else {
            stateCls = "valid";
            claimedBy[k] = w.by;
            claimsThis = true;
          }
        } else {
          stateCls = "valid";
          claimsThis = true;
        }
      } else if(w.valid === false){
        stateCls = "invalid";
      } else {
        stateCls = "validating";
      }
      div.className = `chat-msg ${sideCls} ${stateCls}`;
      const whoName = (w.by === mySlot) ? "Sen" : (opp?.name || "?");
      div.innerHTML = `<span class="who">${escapeHtml(whoName)}:</span> <span>${escapeHtml(w.text)}</span>`;
      chat.appendChild(div);

      if(claimsThis){
        const k = normalizeWord(w.text);
        if(w.by === mySlot) mySet.add(k);
        else oppSet.add(k);
      }
    });
    if(words.length > oldCount){ chat.scrollTop = chat.scrollHeight; }
    $("lsMeCount").textContent = mySet.size;
    $("lsOppCount").textContent = oppSet.size;

    startPhaseTicker();
  }

  if(d.status === "finished"){
    stopPhaseTicker();
    if(gameEnded) return;
    gameEnded = true;

    // Sonuç sesi
    if(d.winner === mySlot) SFX.win();
    else if(d.winner === "tie") SFX.message();
    else SFX.lose();
    // Stats kaydet (her oyuncu kendi sonucunu yazar)
    if(!botOdasiMi()) recordMatchResult(d.winner, (d.match && d.match.mode) || "sim").catch(()=>{}); // bot maçı sayılmaz
    reklamMacBitti();
    show("endScreen");
    const me = mySlot === "p1" ? d.p1 : d.p2;
    const opp = mySlot === "p1" ? d.p2 : d.p1;
    const m = d.match || {};
    const meWins = mySlot === "p1" ? (m.p1Wins || 0) : (m.p2Wins || 0);
    const oppWins = mySlot === "p1" ? (m.p2Wins || 0) : (m.p1Wins || 0);

    const won = d.winner === mySlot;
    const tied = d.winner === "tie";
    $("endIcon").textContent = won ? "🏆" : (tied ? "🤝" : "😢");
    $("endTitle").textContent = won ? "Maçı Kazandın!" : (tied ? "Berabere!" : "Maçı Kaybettin");
    $("endTitle").className = won ? "win" : (tied ? "" : "lose");
    if(d.reason === "forfeit"){
      $("endSubtitle").textContent = "Rakip terk etti";
    } else if((m.mode || "sim") === "chain"){
      // Chain: tek round, kelime sayısı göster
      const round = d.round || {};
      const meWordScore = mySlot === "p1" ? (round.p1Score || 0) : (round.p2Score || 0);
      const oppWordScore = mySlot === "p1" ? (round.p2Score || 0) : (round.p1Score || 0);
      $("endSubtitle").textContent = `Sen ${meWordScore} kelime, rakip ${oppWordScore} kelime`;
    } else {
      $("endSubtitle").textContent = `Sonuç: ${meWins} - ${oppWins}`;
    }

    $("endMeName").textContent = me?.name || "Sen";
    $("endOppName").textContent = opp?.name || "?";
    $("endMeWins").textContent = meWins;
    $("endOppWins").textContent = oppWins;

    const summary = $("roundSummary");
    summary.innerHTML = "";
    const rounds = m.completedRounds || [];
    if(rounds.length === 0){
      summary.innerHTML = '<div style="padding:14px;text-align:center;color:var(--muted);font-size:13px">Henüz round tamamlanmadı</div>';
    } else {
      rounds.forEach(r => {
        const myScore = mySlot === "p1" ? r.p1Score : r.p2Score;
        const oppScore = mySlot === "p1" ? r.p2Score : r.p1Score;
        const wcls = r.winner === mySlot ? "me" : (r.winner === "tie" ? "tie" : "opp");
        const wsym = r.winner === mySlot ? "✓" : (r.winner === "tie" ? "=" : "✗");
        const row = document.createElement("div");
        row.className = "round-row";
        row.innerHTML = `<span class="rcat">R${r.number}: ${escapeHtml(r.category)}</span><span class="rwin ${wcls}">${myScore}-${oppScore} ${wsym}</span>`;
        summary.appendChild(row);
      });
    }
  }
}

/* ===== Faz Yönetimi ===== */
function startPhaseTicker(){
  if(phaseTickInterval) return;
  phaseTickInterval = setInterval(tickPhase, 200);
  tickPhase();
}
function stopPhaseTicker(){
  if(phaseTickInterval){ clearInterval(phaseTickInterval); phaseTickInterval = null; }
  $("phaseBanner").classList.remove("warn");
}
function tickPhase(){
  if(!currentRoundData) return;
  const phase = currentRoundData.phase;
  const mode = currentMatchData?.mode || "sim";
  const banner = $("phaseBanner");
  const now = nowServer();
  let left = 0;

  if(phase === "thinking"){
    const startTime = currentRoundData.phaseStartTime || now;
    left = Math.max(0, THINKING_MS - (now - startTime));
    banner.classList.remove("warn");
  } else if(phase === "active"){
    if(mode === "duel" || mode === "chain"){
      const turnMs = mode === "chain" ? CHAIN_TURN_MS : DUEL_TURN_MS;
      const tStart = (typeof currentRoundData.turnStart === "number" ? currentRoundData.turnStart : (currentRoundData.phaseStartTime || now));
      left = Math.max(0, turnMs - (now - tStart));
    } else {
      const startTime = currentRoundData.phaseStartTime || now;
      left = Math.max(0, ACTIVE_MS - (now - startTime));
    }
    const sec = Math.ceil(left / 1000);
    if(sec <= 5 && sec > 0) banner.classList.add("warn"); else banner.classList.remove("warn");
  } else if(phase === "ended"){
    const startTime = currentRoundData.phaseStartTime || now;
    left = Math.max(0, ENDED_MS - (now - startTime));
    banner.classList.remove("warn");
  } else { return; }

  $("phaseTimer").textContent = Math.ceil(left / 1000);

  if(left <= 0 && !pendingPhaseAdvance){
    pendingPhaseAdvance = true;
    if(phase === "thinking") advanceToActive();
    else if(phase === "active"){
      if(mode === "duel" || mode === "chain") endRoundTurnTimeout();
      else endActiveRound();
    }
    else if(phase === "ended") startNextRound();
  }
}

async function advanceToActive(){
  if(!roomRef){ pendingPhaseAdvance = false; return; }
  try{
    let needsTurnStart = false;
    await roomRef.transaction(c => {
      if(!c || !c.round || c.round.phase !== "thinking") return c;
      c.round.phase = "active";
      c.round.phaseStartTime = Date.now();
      const m = c.match && c.match.mode;
      if(m === "duel" || m === "chain"){
        c.round.turnStart = Date.now();
        needsTurnStart = true;
      }
      return c;
    });
    try{ await roomRef.child("round/phaseStartTime").set(SV.TIMESTAMP); }catch(e){}
    if(needsTurnStart){ try{ await roomRef.child("round/turnStart").set(SV.TIMESTAMP); }catch(e){} }
    vibrate(80);
  }catch(e){ console.error(e); }
  pendingPhaseAdvance = false;
}

async function endRoundTurnTimeout(){

  if(!roomRef){ pendingPhaseAdvance = false; return; }
  try{
    await roomRef.transaction(c => {
      try{
        if(!c || !c.round || c.round.phase !== "active"){ return c; }
        const m = c.match && c.match.mode;
        if(m !== "duel" && m !== "chain"){ return c; }
        const turnMs = m === "chain" ? CHAIN_TURN_MS : DUEL_TURN_MS;
        const tStart = (typeof c.round.turnStart === "number" ? c.round.turnStart : (c.round.phaseStartTime || 0));
        const elapsed = nowServer() - tStart;

        if(elapsed < turnMs - 1500){ return c; }
        const loser = c.round.turn;
        const winner = loser === "p1" ? "p2" : "p1";
        // Firebase array'leri bazen obje olarak döndürür → güvenli array dönüşümü
        const wordsRaw = c.round.words || {};
        const wordsArr = Array.isArray(wordsRaw) ? wordsRaw : Object.values(wordsRaw);
        const validWords = wordsArr.filter(w => w && w.valid === true && !w.dup && !w.stolen);
        const p1Score = validWords.filter(w => w.by === "p1").length;
        const p2Score = validWords.filter(w => w.by === "p2").length;
        const crRaw = c.match.completedRounds || [];
        const completedRounds = Array.isArray(crRaw) ? crRaw.slice() : Object.values(crRaw);
        completedRounds.push({
          number: c.round.number || 1,
          category: c.round.category || null,
          winner: winner,
          loser: loser,
          reason: "timeout",
          p1Score: p1Score,
          p2Score: p2Score
        });
        c.match.completedRounds = completedRounds;
        if(winner === "p1") c.match.p1Wins = (c.match.p1Wins || 0) + 1;
        else if(winner === "p2") c.match.p2Wins = (c.match.p2Wins || 0) + 1;
        c.round.phase = "ended";
        c.round.phaseStartTime = Date.now();
        c.round.roundWinner = winner;
        c.round.reason = "timeout";
        c.round.p1Score = p1Score;
        c.round.p2Score = p2Score;

        return c;
      }catch(innerErr){

        return; // abort transaction (don't commit corrupt data)
      }
    });

    try{ await roomRef.child("round/phaseStartTime").set(SV.TIMESTAMP); }catch(e){}
  }catch(e){ console.error(e); }
  pendingPhaseAdvance = false;
}

async function switchTurn(){
  if(!roomRef) return;
  try{
    await roomRef.transaction(c => {
      if(!c || !c.round || c.round.phase !== "active") return c;
      const m = c.match && c.match.mode;
      if(m !== "duel" && m !== "chain") return c;
      if(c.round.turn !== mySlot) return c;
      c.round.turn = mySlot === "p1" ? "p2" : "p1";
      c.round.turnStart = Date.now();
      return c;
    });
    try{ await roomRef.child("round/turnStart").set(SV.TIMESTAMP); }catch(e){}
  }catch(e){ console.error(e); }
}

async function endActiveRound(){
  if(!roomRef){ pendingPhaseAdvance = false; return; }
  try{
    await roomRef.transaction(c => {
      if(!c || !c.round || c.round.phase !== "active") return c;
      // (sim mode için skor hesaplaması)
      const wordsObj = c.round.words || {};
      // Zaman sırasına göre işle, ilk yazan claim eder
      const sortedKeys = Object.keys(wordsObj).sort((a, b) => (wordsObj[a].ts || 0) - (wordsObj[b].ts || 0));
      const claimedBy = {};
      const p1Set = new Set(), p2Set = new Set();
      sortedKeys.forEach(key => {
        const w = wordsObj[key];
        if(w.dup || w.valid !== true){ delete w.stolen; return; }
        const k = String(w.text).trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
        if(claimedBy[k] && claimedBy[k] !== w.by){
          w.stolen = true; // rakip önce yazmış
        } else {
          claimedBy[k] = w.by;
          delete w.stolen;
          if(w.by === "p1") p1Set.add(k);
          else if(w.by === "p2") p2Set.add(k);
        }
      });
      const p1Score = p1Set.size, p2Score = p2Set.size;
      let winner = "tie";
      if(p1Score > p2Score) winner = "p1";
      else if(p2Score > p1Score) winner = "p2";

      c.match = c.match || { totalRounds: 10, p1Wins: 0, p2Wins: 0, ties: 0, completedRounds: [], categories: [] };
      c.match.completedRounds = c.match.completedRounds || [];
      c.match.completedRounds.push({
        number: c.round.number, category: c.round.category,
        p1Score, p2Score, winner
      });
      if(winner === "p1") c.match.p1Wins = (c.match.p1Wins || 0) + 1;
      else if(winner === "p2") c.match.p2Wins = (c.match.p2Wins || 0) + 1;
      else c.match.ties = (c.match.ties || 0) + 1;

      c.round.phase = "ended";
      c.round.phaseStartTime = Date.now();
      c.round.roundWinner = winner;
      c.round.p1Score = p1Score;
      c.round.p2Score = p2Score;

      return c;
    });
    // v4.11'de burada tanımsız "txCommitted = result.committed" vardı: ReferenceError yakalanıyor, alttaki sunucu
    // zaman damgası hiç yazılmıyordu (DENETIM.md › K-08)
    try{ await roomRef.child("round/phaseStartTime").set(SV.TIMESTAMP); }catch(e){}
  }catch(e){ console.error(e); }
  pendingPhaseAdvance = false;
}

async function startNextRound(){

  if(!roomRef){ pendingPhaseAdvance = false; return; }
  try{
    await roomRef.transaction(c => {
      if(!c || !c.round || c.round.phase !== "ended"){ return c; }
      const matchOver = isMatchOver(c.match);

      if(matchOver){
        c.status = "finished";
        const p1 = c.match.p1Wins || 0, p2 = c.match.p2Wins || 0;
        if(p1 > p2) c.winner = "p1";
        else if(p2 > p1) c.winner = "p2";
        else c.winner = "tie";

        return c;
      }
      const next = (c.round.number || 0) + 1;
      const cats = (c.match && c.match.categories) || [];
      const cat = cats[next - 1] || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const newRound = { number: next, category: cat, phase: "thinking", phaseStartTime: Date.now(), words: {} };
      if(c.match && c.match.mode === "duel"){
        // Sırayı değiştir
        newRound.turn = (c.round.turn === "p1" ? "p2" : "p1");
        newRound.turnStart = null;
      }
      c.round = newRound;
      return c;
    });
    try{ await roomRef.child("round/phaseStartTime").set(SV.TIMESTAMP); }catch(e){}
  }catch(e){ console.error(e); }
  pendingPhaseAdvance = false;
}

// 1.0.1: Tenis ve Zincir'de kelime denetlenirken "Gönder" kapanıyordu ama Enter açıktı; aynı sırada ikinci bir kelime
// gönderilebiliyordu (sıra geçtikten sonra yazılan kelime). Denetim sürerken yeni gönderim yok sayılır (K-23).
let kelimeDenetleniyor = false;
async function submitWord(){
  if(!roomRef || gameEnded || kelimeDenetleniyor) return;
  if(!currentRoundData || currentRoundData.phase !== "active") return;
  const mode = currentMatchData?.mode || "sim";

  // Sıralı modlarda sıra kontrolü
  if((mode === "duel" || mode === "chain") && currentRoundData.turn !== mySlot){
    vibrate(80);
    return;
  }

  const raw = $("wordInput").value.trim();
  if(!raw) return;
  if(!kelimeBicimiGecerli(raw)){
    vibrate(80);
    return;
  }

  // === ZİNCİR MODU: özel akış (sync TDK, son harf kuralı) ===
  if(mode === "chain"){
    if(/[\s-]/.test(raw)){ showToast("Tek kelime yaz"); vibrate(80); return; }
    const norm = normalizeWord(raw);
    const wordsObj = currentRoundData.words || {};
    // Tekrar kontrolü (round içindeki tüm geçerli kelimeler)
    const isDup = Object.values(wordsObj).some(w => w.valid === true && normalizeWord(w.text) === norm);
    if(isDup){ showToast("'" + raw + "' zaten kullanıldı"); vibrate([90,50,90]); return; }
    // Son harf zinciri kontrolü
    const expected = getChainNextLetter(wordsObj);
    if(expected){
      const actual = turkishFirstLetter(raw);
      if(actual !== expected){
        showToast("'" + expected.toLocaleUpperCase("tr-TR") + "' harfiyle başlamalı");
        vibrate([90,50,90]);
        return;
      }
    }
    // Kelime geçerliliği: önce yerel sözlük, sonra AI (Cloudflare Worker → Workers AI), TDK yedek
    let valid = isWordInLocalDict(raw);
    if(!valid){
      $("sendBtn").disabled = true;
      kelimeDenetleniyor = true;
      // wordInput KASTEN disable EDİLMİYOR — klavye kapanmasın
      showToast("Kontrol ediliyor...");
      let aiResult;
      try{
        aiResult = await validateWordSmart(null, raw); // Zincir modunda kategori yok, sadece "Türkçe mi?"
      } finally {
        $("sendBtn").disabled = false;
        kelimeDenetleniyor = false;
      }
      if(aiResult !== true){
        showToast("'" + raw + "' geçerli bir kelime değil");
        vibrate([90,50,90]);
        SFX.error();
        try{ $("wordInput").focus(); }catch(e){}
        return;
      }
      valid = true;
    }
    // Push + sıra geçişi
    $("wordInput").value = "";
    try{
      const wordRef = roomRef.child("round/words").push();
      await wordRef.set({ text: raw, by: mySlot, valid: true, ts: Date.now() });
    }catch(e){ console.error(e); showToast("Yazma hatası"); return; }
    vibrate(30);
    SFX.success();
    await switchTurn();
    return;
  }

  // === HIZLI / TENİS ===
  $("wordInput").value = "";
  const submissionTs = Date.now();
  const norm = normalizeWord(raw);
  const wordsObj = currentRoundData.words || {};
  let isDup;
  if(mode === "duel"){
    isDup = Object.values(wordsObj).some(w => w.valid !== false && normalizeWord(w.text) === norm);
  } else {
    const myWordsList = Object.values(wordsObj).filter(w => w.by === mySlot);
    isDup = myWordsList.some(w => normalizeWord(w.text) === norm);
  }

  const inLocal = !isDup && currentCategory && isInCategory(currentCategory, raw);

  // Final state ile push — flash YOK
  const pushFinal = async (validResult, usedTdk) => {
    try{
      const wRef = roomRef.child("round/words").push();
      const entry = { text: raw, by: mySlot, valid: validResult, ts: submissionTs };
      if(isDup) entry.dup = true;
      if(usedTdk) entry.tdk = true;
      await wRef.set(entry);
      if(validResult){
        vibrate(30);
        SFX.success();
        if(mode === "duel") await switchTurn();
      } else {
        vibrate([90, 50, 90]);
        SFX.error();
      }
    }catch(e){ console.error(e); }
  };

  if(isDup){
    await pushFinal(false, false);
    if(mode === "duel") showToast("'" + raw + "' zaten yazılmış");
  } else if(inLocal){
    await pushFinal(true, false);
  } else {
    // Listede yok → AI'ya kategori-uygunluk sor (TDK fallback dahil)
    if(mode === "duel"){
      $("sendBtn").disabled = true;
      kelimeDenetleniyor = true;
      // wordInput KASTEN disable EDİLMİYOR — klavye kapanmasın
      showToast("Kontrol ediliyor...");
      let aiResult;
      try{
        aiResult = await validateWordSmart(currentCategory, raw);
      } finally {
        $("sendBtn").disabled = false;
        kelimeDenetleniyor = false;
      }
      await pushFinal(aiResult === true, aiResult === true);
    } else {
      // Hızlı: input açık kalsın (başka kelime yazabilsin), AI arka planda
      showToast("Kontrol ediliyor...");
      validateWordSmart(currentCategory, raw)
        .then(aiResult => pushFinal(aiResult === true, aiResult === true))
        .catch(() => pushFinal(false, false));
    }
  }
  setTimeout(() => { try{ $("wordInput").focus(); }catch(e){} }, 30);
}

async function endGame(winnerSlot, reason){
  if(!roomRef || gameEnded) return;

  try{
    await roomRef.transaction(c => {
      if(!c || c.status === "finished") return c;
      c.status = "finished"; c.winner = winnerSlot; c.reason = reason;
      return c;
    });
  }catch(e){ console.error(e); }
}

async function forfeitGame(){
  if(!roomRef || gameEnded) return;
  if(!confirm("Maçı terk etmek istediğine emin misin?")) return;

  await endGame(mySlot === "p1" ? "p2" : "p1", "forfeit");
}

function leaveAndReset(){
  if(roomRef){
    if(roomListener) roomRef.off("value", roomListener);
    // Bekleme odasında tek başınaysam odayı sil
    roomRef.transaction(c => {
      if(!c) return;
      if(c.status === "waiting" && c.p1 && c.p1.uid === myUid) return null;
      return c;
    }).catch(()=>{});
  }
  resetGameState();
  show("lobbyScreen");
}

function resetGameState(){
  stopPhaseTicker();
  botDurdur();
  if(roomRef && roomListener) roomRef.off("value", roomListener);
  roomRef = null; roomListener = null; mySlot = null; roomId = null;
  gameEnded = false;
  currentCategory = null;
  currentRoundData = null;
  currentMatchData = null;
  pendingPhaseAdvance = false;
  kelimeDenetleniyor = false;
  $("wordInput").value = "";
  $("roomInput").value = "";
  $("wordsChat").innerHTML = "";
  const rc = $("rulesCard"); if(rc){ rc.open = true; delete rc.dataset.mode; delete rc.dataset.activeClosed; delete rc.dataset.thinkingOpened; }
}

/* beforeunload OTOMATİK FORFEIT KALDIRILDI:
   Cordova WebView'da bu olay telefonun ekranı kilitlenince, başka uygulamaya geçince
   veya bildirim açılınca da fırlıyor → yanlış kayıp/forfeit. Sadece "Maçı Terk Et"
   butonu ile bilinçli ayrılış kabul edilir. */
window.addEventListener("beforeunload", () => {

});
