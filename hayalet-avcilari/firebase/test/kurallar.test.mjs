// Hayalet Avcıları Firebase kuralları — emülatör testleri.
// Çalıştırma: hayalet-avcilari/firebase içinde `npm ci && npm test` (Java 21 gerekir).
// Yazılan veriler www/game.js'teki gövdelerin aynısıdır; game.js'te alan değişirse burası ve kurallar birlikte değişir.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

const KOK = new URL("../", import.meta.url);
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-hayalet-avcilari",
    database: { rules: readFileSync(new URL("database.rules.json", KOK), "utf8") },
    firestore: { rules: readFileSync(new URL("firestore.rules", KOK), "utf8") },
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearDatabase();
  await env.clearFirestore();
});

// ---- game.js ile aynı biçimler ----
// 3.10.2+: oyuncu kimliği anonim girişin auth.uid'idir (Firebase: 28 karakter, harf ve rakam)
const HOST = "Hq3ZpL8vT2nW5xY7aB9cD1eF4gH6";
const KONUK = "Kz8mN3bV6cX1zL4kJ7hG2fD5sA9q";
const YABANCI = "Yb5tR2eW8qA1sD4fG7hJ0kL3zX6c";  // odada olmayan girişli kullanıcı
// 3.10.1 ve öncesi (girişsiz): getOnlineUid() "u_" + 8 base36 + 4 base36 — geçiş döneminde kabul edilir
const ESKI_HOST = "u_k3j9x0abm1z9";
const ESKI_KONUK = "u_7hq2c9wwm1za";
const ODA = "K7PQ2X";               // makeRoomId(): ABCDEFGHJKMNPQRSTUVWXYZ23456789 alfabesinden 6 harf
const KOD = "ABC_D23";              // genAccountCode() "ABC-D23" → anahtar "ABC_D23"

const misafir = () => env.unauthenticatedContext().database();
const anonim = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).database();
const google = (uid) => env.authenticatedContext(uid).database();

function oyuncuGirisi(ready, now) {           // makePlayerEntry
  return { name: "Poyraz", charKey: "kinkin", costumeIdx: 0, ready: !!ready, joinedAt: now, lastSeen: now };
}
function yeniOda(now, host = HOST) {          // submitCreateRoom
  return {
    name: "Poyraz'in Odası", hostUid: host, hostName: "Poyraz", level: 1, status: "lobby",
    maxPlayers: 5, createdAt: now, lastSeen: now, players: { [host]: oyuncuGirisi(true, now) },
  };
}
function oyuncuAni() {                        // mpPushImpl › me
  return {
    name: "Poyraz", charKey: "kinkin", costumeIdx: 2, x: 512, y: 300, facing: -1.57, hp: 3, maxHp: 3,
    walk: 0.42, invuln: false, invisible: 0, dead: 0, lastSeen: Date.now(),
  };
}
function hostDurumu() {                       // mpPushImpl › state
  return {
    g: [
      { i: 0, x: 100, y: 120, hp: 2, maxHp: 3, size: 40, isBoss: 0, isShooter: 0, frozen: 0 },
      { i: 1, x: 400, y: 220, hp: 37.5, maxHp: 60, size: 120, isBoss: 1, isShooter: 0, frozen: 1 },
    ],
    p: [
      { i: 0, x: 90, y: 80, kind: "para", value: 11 },
      { i: 1, x: 95, y: 70, kind: "kalp", life: 3.25 },
      { i: 2, x: 99, y: 60, kind: "guc" },
    ],
    e: [{ i: 0, x: 300, y: 310, vx: -120, vy: 45, isBoss: 1 }],
    lvl: 3, bd: 0, bt: 12.5, lt: 0,
  };
}
const olaylar = (by) => [                     // online.pendingEvents.push(...)
  { type: "areaDmg", x: 200, y: 210, r: 150, dmg: 10, by },
  { type: "freezeAll", duration: 5000, by },
  { type: "hit", gi: 0, dmg: 3, by },
  { type: "rocketShot", x: 220, y: 230, gi: 1, by },
  { type: "pickup", pi: 1, by },
];

// Kuralsız kurulum: host'un odası, istenirse ek oyuncular ve bir bekleyen olay
async function odaKur(host = HOST, digerleri = [], olay = null) {
  const now = Date.now();
  const oda = yeniOda(now, host);
  for (const uid of digerleri) oda.players[uid] = oyuncuGirisi(true, now);
  if (olay) oda.events = { olay1: olay };
  await env.withSecurityRulesDisabled(async (c) => { await c.database().ref(`rooms/${ODA}`).set(oda); });
}

// Oyunun tam çevrimiçi akışı: oda kur → listele → katıl → hazır ol → başlat → senkron → olaylar → çık
async function odaAkisi(h, k, hostUid, konukUid) {
  const now = Date.now();
  await assertSucceeds(h.ref(`rooms/${ODA}`).set(yeniOda(now, hostUid)));         // submitCreateRoom
  await assertSucceeds(k.ref("rooms").get());                                      // openRoomList
  await assertSucceeds(k.ref(`rooms/${ODA}`).get());                               // joinRoom
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).set(oyuncuGirisi(false, now)));
  await assertSucceeds(k.ref(`rooms/${ODA}`).update({ lastSeen: now }));
  await k.ref(`rooms/${ODA}`).onDisconnect().cancel().catch(() => {});            // konukta reddedilebilir; oyun yutar
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).onDisconnect().cancel());  // setupOnDisconnect
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).onDisconnect().remove());
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).update({ ready: true, lastSeen: now })); // toggleReady
  await assertSucceeds(h.ref(`rooms/${ODA}`).update({ status: "playing", lastSeen: now }));          // startMpGame
  await assertSucceeds(h.ref(`rooms/${ODA}/state`).set(null));                     // startMpGameClient (host)
  await assertSucceeds(h.ref(`rooms/${ODA}/events`).set(null));
  await assertSucceeds(h.ref(`rooms/${ODA}/players/${hostUid}`).update(oyuncuAni())); // mpPush
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).update(oyuncuAni()));
  await assertSucceeds(h.ref(`rooms/${ODA}/state`).set(hostDurumu()));
  await assertSucceeds(h.ref(`rooms/${ODA}/state`).set({ g: [], p: [], e: [], lvl: 1, bd: 0, bt: 0, lt: 1 }));
  for (const ev of olaylar(konukUid)) {
    const ref = k.ref(`rooms/${ODA}/events`).push();                             // rtdb.post (client → host)
    await assertSucceeds(ref.set(ev));
    await assertSucceeds(h.ref(`rooms/${ODA}/events/${ref.key}`).remove());       // host: snap.ref.remove()
  }
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).remove());        // leaveRoom (konuk)
  await assertSucceeds(h.ref(`rooms/${ODA}`).remove());                           // leaveRoom (host)
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).remove());        // oda zaten silinmişken çıkış
}

describe("rooms — girişli oda (3.10.2, anonim giriş)", () => {
  test("oda kur, listele, katıl, hazır ol, başlat, oyna, çık", async () => {
    await odaAkisi(anonim(HOST), anonim(KONUK), HOST, KONUK);
  });

  test("host ayrılınca en eski oyuncu host olur ve odayı yönetir", async () => {
    await odaKur(HOST, [KONUK], { type: "hit", gi: 0, dmg: 3, by: KONUK });
    const k = anonim(KONUK);
    await assertSucceeds(anonim(HOST).ref(`rooms/${ODA}/players/${HOST}`).remove());   // onDisconnect().remove()
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ hostUid: KONUK, hostName: "Ayşe", lastSeen: Date.now() }));
    await assertSucceeds(k.ref(`rooms/${ODA}/events/olay1`).remove());               // startEventsListener
    await assertSucceeds(k.ref(`rooms/${ODA}/state`).set(hostDurumu()));
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ status: "playing", lastSeen: Date.now() }));
    await assertSucceeds(k.ref(`rooms/${ODA}`).remove());
  });

  test("host odadayken ya da başkası adına host devri reddedilir", async () => {
    const UCUNCU = "Uc7pQ1wE4rT8yU2iO5pA3sD6fG9h";
    await odaKur(HOST, [KONUK, UCUNCU]);
    const k = anonim(KONUK);
    await assertFails(k.ref(`rooms/${ODA}`).update({ hostUid: KONUK, hostName: "Ayşe", lastSeen: Date.now() }));
    await assertSucceeds(anonim(HOST).ref(`rooms/${ODA}/players/${HOST}`).remove());
    await assertFails(anonim(YABANCI).ref(`rooms/${ODA}`).update({ hostUid: YABANCI, lastSeen: Date.now() })); // odada değil
    await assertFails(k.ref(`rooms/${ODA}`).update({ hostUid: UCUNCU }));            // başkası adına
    await assertFails(k.ref(`rooms/${ODA}`).update({ hostUid: YABANCI }));
    await assertFails(misafir().ref(`rooms/${ODA}`).update({ hostUid: "u_sahte0001" })); // odada olmayan eski kimlik
    await assertFails(k.ref(`rooms/${ODA}/hostName`).set("Ayşe"));                  // host değilken ad
    await assertSucceeds(k.ref(`rooms/${ODA}/hostUid`).set(KONUK));
  });

  test("odada olmayan, girişsiz ya da konuk biri host işlerine karışamaz", async () => {
    await odaKur(HOST, [KONUK], { type: "hit", gi: 0, dmg: 3, by: KONUK });
    for (const [kim, db] of [["yabancı", anonim(YABANCI)], ["girişsiz", misafir()], ["konuk", anonim(KONUK)]]) {
      const oda = (p) => db.ref(`rooms/${ODA}${p ? "/" + p : ""}`);
      const ret = async (islem) => assertFails(islem).catch((e) => { throw new Error(`${kim}: ${e.message}`); });
      await ret(oda().remove());                                                     // odayı silme yalnız host
      await ret(oda().set(yeniOda(Date.now(), kim === "konuk" ? KONUK : YABANCI)));  // üzerine oda kurma
      await ret(oda(`players/${HOST}`).update(oyuncuAni()));                         // host'un kaydı
      await ret(oda(`players/${HOST}`).remove());
      await ret(oda("players").remove());
      await ret(oda("state").set(hostDurumu()));
      await ret(oda("state").remove());
      await ret(oda("status").set("playing"));
      await ret(oda("events/olay1").remove());                                       // olayları yalnız host tüketir
      await ret(oda("events").remove());
      await ret(oda("events").push().set({ type: "hit", gi: 0, dmg: 3, by: HOST }));   // başkası adına olay
      await ret(oda("name").set("Ele geçirildi"));
      await ret(oda("maxPlayers").set(2));
      await ret(oda("hostName").set("Sahte"));
      await ret(oda("hostUid").set(kim === "konuk" ? KONUK : YABANCI));               // host odadayken
    }
    await assertFails(anonim(YABANCI).ref(`rooms/${ODA}/players/${KONUK}`).remove()); // başkasının kaydı
    await assertFails(anonim(YABANCI).ref(`rooms/${ODA}/events`).push().set({ type: "pickup", pi: 1, by: YABANCI })); // odada değil
    await assertFails(anonim(YABANCI).ref(`rooms/${ODA}`).update({ lastSeen: Date.now() }));             // odada değil
    await assertFails(anonim(KONUK).ref(`rooms/${ODA}`).set(yeniOda(Date.now(), HOST)));                 // başkası adına oda
    await assertFails(anonim(HOST).ref(`rooms/${ODA}`).set(yeniOda(Date.now(), HOST)));                  // var olan odanın üzerine
  });
});

describe("rooms — geçiş dönemi (3.10.1 ve öncesi girişsiz)", () => {
  test("eski sürümler arasında oda akışı eskisi gibi", async () => {
    await odaAkisi(misafir(), misafir(), ESKI_HOST, ESKI_KONUK);
  });

  test("eski sürümde host ayrılınca yeni host kendini atar", async () => {
    await odaKur(ESKI_HOST);
    const k = misafir();
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).set(oyuncuGirisi(true, Date.now())));
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${ESKI_HOST}`).remove());       // onDisconnect().remove()
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ hostUid: ESKI_KONUK, hostName: "Ayşe", lastSeen: Date.now() }));
  });

  test("eski sürüm girişli odaya konuk olarak katılır, host işlerine karışamaz", async () => {
    await odaKur(HOST);
    const m = misafir();
    const now = Date.now();
    await assertSucceeds(m.ref(`rooms/${ODA}`).get());
    await assertSucceeds(m.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).set(oyuncuGirisi(false, now)));
    await assertSucceeds(m.ref(`rooms/${ODA}`).update({ lastSeen: now }));
    await assertSucceeds(m.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).update({ ready: true, lastSeen: now }));
    await assertSucceeds(m.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).update(oyuncuAni()));
    const ref = m.ref(`rooms/${ODA}/events`).push();
    await assertSucceeds(ref.set({ type: "pickup", pi: 1, by: ESKI_KONUK }));
    await assertSucceeds(anonim(HOST).ref(`rooms/${ODA}/events/${ref.key}`).remove());
    await assertFails(m.ref(`rooms/${ODA}`).remove());
    await assertFails(m.ref(`rooms/${ODA}/state`).set(hostDurumu()));
    await assertFails(m.ref(`rooms/${ODA}/status`).set("playing"));
    await assertFails(m.ref(`rooms/${ODA}/players/${HOST}`).remove());
    await assertFails(m.ref(`rooms/${ODA}/events`).push().set({ type: "pickup", pi: 1, by: "u_odadadegil1" }));
    await assertSucceeds(m.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).remove());      // leaveRoom
  });

  test("girişli host ayrılınca eski sürüm konuk host olur (oda eski biçime döner)", async () => {
    await odaKur(HOST, [ESKI_KONUK]);
    await assertSucceeds(anonim(HOST).ref(`rooms/${ODA}/players/${HOST}`).remove());
    const m = misafir();
    await assertSucceeds(m.ref(`rooms/${ODA}`).update({ hostUid: ESKI_KONUK, hostName: "Ayşe", lastSeen: Date.now() }));
    await assertSucceeds(m.ref(`rooms/${ODA}/state`).set(hostDurumu()));
    await assertSucceeds(m.ref(`rooms/${ODA}`).remove());
  });

  test("yeni sürüm eski sürümün odasına katılır", async () => {
    await odaKur(ESKI_HOST);
    const k = anonim(KONUK);
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).set(oyuncuGirisi(false, Date.now())));
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ lastSeen: Date.now() }));
    const ref = k.ref(`rooms/${ODA}/events`).push();
    await assertSucceeds(ref.set({ type: "hit", gi: 0, dmg: 3, by: KONUK }));
    await assertSucceeds(misafir().ref(`rooms/${ODA}/events/${ref.key}`).remove());
  });

  test("anonim giriş geç tamamlanırsa oyun u_ kimliğiyle sürer", async () => {
    // onlineKimlik() 10 sn'de girişi alamazsa getOnlineUid() kullanır; giriş sonra tamamlanınca bağlantı girişli olur
    const g = anonim(KONUK);
    await assertSucceeds(g.ref(`rooms/${ODA}`).set(yeniOda(Date.now(), ESKI_HOST)));
    await assertSucceeds(g.ref(`rooms/${ODA}/players/${ESKI_HOST}`).update(oyuncuAni()));
    await assertSucceeds(g.ref(`rooms/${ODA}/state`).set(hostDurumu()));
    await assertSucceeds(g.ref(`rooms/${ODA}`).remove());
  });

  test("izinsiz ya da bozuk yazımlar reddedilir", async () => {
    await odaKur(ESKI_HOST);
    const m = misafir();
    const oda = (p) => m.ref(`rooms/${ODA}/${p}`);
    await assertFails(m.ref("/").get());
    await assertFails(m.ref("/").set({ hepsi: "gitti" }));
    await assertFails(m.ref("rooms").remove());
    await assertFails(m.ref("rooms").set({}));
    await assertFails(m.ref("baska/yol").set(1));
    await assertFails(m.ref("rooms/abcdef").set(yeniOda(Date.now(), ESKI_HOST)));   // küçük harf
    await assertFails(m.ref("rooms/K7PQ21").set(yeniOda(Date.now(), ESKI_HOST)));   // 1 alfabede yok
    await assertFails(m.ref("rooms/K7PQ2XY").set(yeniOda(Date.now(), ESKI_HOST)));  // 7 harf
    await assertFails(m.ref("rooms/ZZZZZZ").set(yeniOda(Date.now(), HOST)));        // girişsiz, girişli host adına
    await assertFails(m.ref("rooms/ZZZZZZ/players/" + ESKI_KONUK).update(oyuncuAni())); // silinmiş odaya yazım (zombi oda)
    await assertFails(anonim(KONUK).ref("rooms/ZZZZZZ/players/" + KONUK).update(oyuncuAni()));
    await assertFails(m.ref("rooms/ZZZZZZ").update({ lastSeen: Date.now() }));
    await assertFails(oda("status").set("hacked"));
    await assertFails(oda("maxPlayers").set(50));
    await assertFails(oda("name").set("x".repeat(61)));
    await assertFails(oda("name").set(""));
    await assertFails(oda("hostUid").set("../../accounts"));
    await assertFails(oda("cop").set("ıvır zıvır"));
    await assertFails(oda(`players/${ESKI_KONUK}`).update({ ...oyuncuAni(), coins: 999 }));
    await assertFails(oda(`players/${ESKI_KONUK}`).update({ ready: "evet" }));
    await assertFails(oda(`players/${ESKI_KONUK}`).update({ name: "x".repeat(51) }));
    await assertFails(oda("players/kötü-uid!").set(oyuncuGirisi(false, Date.now())));
    await assertFails(oda("state").set({ ...hostDurumu(), hile: 1 }));
    await assertFails(oda("state/g/0").set({ i: 0, x: "yüz", y: 1 }));
    await assertFails(oda("events").push().set({ type: "hit", gi: 0, dmg: 3, by: ESKI_HOST, payload: "x" }));
    await assertFails(oda("events").push().set({ gi: 0, dmg: 3, by: ESKI_HOST }));
    await assertFails(oda("events").push().set({ type: "hit", gi: 0, dmg: 3 }));     // by zorunlu
  });

  test("girişli odada da şema denetlenir", async () => {
    await odaKur(HOST);
    const h = anonim(HOST);
    const oda = (p) => h.ref(`rooms/${ODA}/${p}`);
    await assertFails(oda("status").set("hacked"));
    await assertFails(oda("cop").set(1));
    await assertFails(oda(`players/${HOST}`).update({ ...oyuncuAni(), coins: 999 }));
    await assertFails(oda("state").set({ ...hostDurumu(), hile: 1 }));
    await assertFails(oda("events").push().set({ type: "hit", gi: 0, dmg: 3, by: HOST, payload: "x" }));
  });
});

describe("accounts — kodlu yedek", () => {
  const yedek = (ownerUid) => ({
    name: "Poyraz", save: JSON.stringify({ para: 120, elmas: 3 }), updatedAt: Date.now(),
    ...(ownerUid ? { ownerUid } : {}),
  });

  test("3.10.2: yalnız sahibi yazar ve siler, kodu bilen başka cihaz okur", async () => {
    const a = anonim(HOST);
    await assertSucceeds(a.ref(`accounts/${KOD}`).set(yedek(HOST)));               // backupAccount
    await assertSucceeds(a.ref(`accounts/${KOD}`).set(yedek(HOST)));               // aynı kodla güncelleme
    await assertSucceeds(anonim(KONUK).ref(`accounts/${KOD}`).get());              // restoreAccount (başka cihaz)
    await assertSucceeds(misafir().ref(`accounts/${KOD}`).get());                  // eski sürüm geri yükler
    await assertFails(anonim(KONUK).ref(`accounts/${KOD}`).set(yedek(KONUK)));     // başkası üzerine yazamaz
    await assertFails(anonim(KONUK).ref(`accounts/${KOD}`).set(yedek(HOST)));      // sahip taklidi
    await assertFails(anonim(KONUK).ref(`accounts/${KOD}`).set(yedek()));          // sahipsize çevirme
    await assertFails(misafir().ref(`accounts/${KOD}`).set(yedek()));
    await assertFails(anonim(KONUK).ref(`accounts/${KOD}`).remove());
    await assertFails(misafir().ref(`accounts/${KOD}`).remove());
    await assertFails(anonim(KONUK).ref(`accounts/${KOD}/save`).set("{}"));
    await assertSucceeds(anonim(KONUK).ref("accounts/XYZ_789").set(yedek(KONUK))); // başka cihaz yeni kod alır
    await assertSucceeds(google(HOST).ref(`accounts/${KOD}`).remove());           // deleteAccountGoogle (anonimden yükseltilmiş, aynı uid)
  });

  test("geçiş: eski sürümün sahipsiz yedeği eskisi gibi; girişli kullanıcı sahiplenir", async () => {
    const m = misafir();
    await assertSucceeds(m.ref(`accounts/${KOD}`).set(yedek()));                   // 3.10.1 backupAccount
    await assertSucceeds(m.ref(`accounts/${KOD}`).set(yedek()));
    await assertSucceeds(misafir().ref(`accounts/${KOD}`).get());
    await assertSucceeds(anonim(HOST).ref(`accounts/${KOD}`).set(yedek(HOST)));    // 3.10.2 yedekleyince sahiplenir
    await assertFails(m.ref(`accounts/${KOD}`).set(yedek()));                      // artık eski sürüm yazamaz
    await assertSucceeds(anonim(HOST).ref(`accounts/${KOD}`).set(yedek()));        // giriş zaman aşımı: sahibi sahipsiz yazar
    await assertSucceeds(google("g-uid-1").ref(`accounts/${KOD}`).remove());       // sahipsiz kaydı kodu bilen siler (eskisi gibi)
  });

  test("liste, bozuk kod ve bozuk gövde reddedilir", async () => {
    const m = misafir();
    await assertFails(m.ref("accounts").get());
    await assertFails(anonim(HOST).ref("accounts").get());
    await assertFails(m.ref("accounts").remove());
    await assertFails(m.ref("accounts/abc_d23").get());
    await assertFails(m.ref("accounts/ABCD23").set(yedek()));
    await assertFails(m.ref(`accounts/${KOD}`).set({ ...yedek(), admin: true }));
    await assertFails(m.ref(`accounts/${KOD}`).set({ name: "Poyraz", save: { para: 1 }, updatedAt: 1 }));
    await assertFails(m.ref(`accounts/${KOD}`).set({ name: "Poyraz", save: "{}" }));
    await assertFails(m.ref(`accounts/${KOD}`).set({ ...yedek(), save: "x".repeat(200001) }));
    await assertFails(m.ref(`accounts/${KOD}`).set(yedek(HOST)));                  // girişsiz sahip yazamaz
    await assertFails(anonim(HOST).ref(`accounts/${KOD}`).set(yedek(KONUK)));      // başkasını sahip yapamaz
    await assertFails(anonim("ab").ref(`accounts/${KOD}`).set(yedek("ab")));       // bozuk sahip kimliği (< 3)
  });
});

describe("accounts_google — Google bulut yedeği", () => {
  const UID = "Gx7aQ2mT9pL0bN3cR5sV8wY1zK4";
  const bulut = () => ({
    name: "Poyraz", googleName: "Poyraz Workshop", googleEmail: "poyraz@example.com",
    save: JSON.stringify({ para: 120 }), updatedAt: Date.now(),
  });

  test("sahibi yedekler, geri yükler, siler", async () => {
    const db = google(UID);
    await assertSucceeds(db.ref(`accounts_google/${UID}`).set(bulut()));          // backupAccountGoogle
    await assertSucceeds(db.ref(`accounts_google/${UID}`).set({ ...bulut(), googleName: "", googleEmail: "" }));
    await assertSucceeds(db.ref(`accounts_google/${UID}`).get());                 // restoreAccountGoogle
    await assertSucceeds(db.ref(`accounts_google/${UID}`).remove());              // deleteAccountGoogle
  });

  test("başkası, anonim ve girişsiz kullanıcı erişemez", async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      await c.database().ref(`accounts_google/${UID}`).set(bulut());
    });
    await assertFails(misafir().ref(`accounts_google/${UID}`).get());
    await assertFails(misafir().ref(`accounts_google/${UID}`).set(bulut()));
    await assertFails(misafir().ref(`accounts_google/${UID}`).remove());
    await assertFails(google("baska-uid").ref(`accounts_google/${UID}`).get());
    await assertFails(google("baska-uid").ref(`accounts_google/${UID}`).set(bulut()));
    await assertFails(google("baska-uid").ref(`accounts_google/${UID}`).remove());
    await assertFails(anonim(HOST).ref(`accounts_google/${UID}`).get());
    await assertFails(anonim(HOST).ref(`accounts_google/${UID}`).remove());
    await assertFails(google(UID).ref("accounts_google").get());
    await assertFails(google(UID).ref(`accounts_google/${UID}`).set({ ...bulut(), rol: "admin" }));
  });
});

describe("Firestore scores — şampiyonlar listesi", () => {
  const fs = () => env.unauthenticatedContext().firestore();
  const fsAnonim = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).firestore();
  function skor(over = {}) {                  // submitOnlineScore + scoreFor
    const e = { name: "Poyraz", level: 7, ghosts: 143, para: 2380, date: Date.now(), ...over };
    return { score: e.level * 1000 + e.ghosts * 10 + e.para, ...e };
  }
  async function kuralsizEkle(veri) {
    let id;
    await env.withSecurityRulesDisabled(async (c) => { id = (await c.firestore().collection("scores").add(veri)).id; });
    return id;
  }

  test("eski sürüm: girişsiz ekle, listele, isimle ara", async () => {
    const db = fs();
    await assertSucceeds(db.collection("scores").add(skor()));
    await assertSucceeds(db.collection("scores").add(skor({ name: "x".repeat(19), level: 1, ghosts: 0, para: 0 })));
    await assertSucceeds(db.collection("scores").orderBy("date", "desc").limit(200).get());
    await assertSucceeds(db.collection("scores").where("name", "==", "Poyraz").limit(200).get());
  });

  test("3.10.2: kendi uid'iyle ekler, yalnız kendi skorunun yalnız adını değiştirir", async () => {
    const db = fsAnonim(HOST);
    await assertSucceeds(db.collection("scores").add(skor({ uid: HOST })));                       // submitOnlineScore
    await assertFails(db.collection("scores").add(skor({ uid: KONUK })));                         // başkası adına
    await assertFails(db.collection("scores").add(skor()));                                       // girişliyken uid zorunlu
    await assertFails(db.collection("scores").add(skor({ uid: 42 })));
    await assertSucceeds(db.collection("scores").orderBy("date", "desc").limit(200).get());       // fetchOnlineLeaderboard
    await assertSucceeds(db.collection("scores").where("uid", "==", HOST).limit(200).get());      // renameInLeaderboard
    const benim = await kuralsizEkle(skor({ uid: HOST }));
    const baskasi = await kuralsizEkle(skor({ uid: KONUK }));
    const eski = await kuralsizEkle(skor());
    await assertSucceeds(db.doc(`scores/${benim}`).update({ name: "Kinkin" }));                   // PATCH updateMask=name
    await assertFails(db.doc(`scores/${benim}`).update({ name: "Kinkin", score: 1 }));
    await assertFails(db.doc(`scores/${benim}`).update({ uid: KONUK }));
    await assertFails(db.doc(`scores/${benim}`).update({ level: 999 }));
    await assertFails(db.doc(`scores/${benim}`).update({ name: "" }));
    await assertFails(db.doc(`scores/${benim}`).update({ name: "x".repeat(20) }));
    await assertFails(db.doc(`scores/${benim}`).delete());
    await assertFails(db.doc(`scores/${baskasi}`).update({ name: "Kinkin" }));                    // başkasının skoru
    await assertFails(db.doc(`scores/${eski}`).update({ name: "Kinkin" }));                       // uid'siz (eski) skor
    await assertFails(fs().doc(`scores/${benim}`).update({ name: "Kinkin" }));                    // girişsiz
  });

  test("bozuk skorlar ve diğer işlemler reddedilir", async () => {
    const db = fs();
    const id = await kuralsizEkle(skor());
    await assertFails(db.collection("scores").add({ ...skor(), score: 99999999 }));
    await assertFails(db.collection("scores").add({ ...skor(), hile: true }));
    const { date, ...tarihsiz } = skor();
    await assertFails(db.collection("scores").add(tarihsiz));
    await assertFails(db.collection("scores").add(skor({ name: "" })));
    await assertFails(db.collection("scores").add(skor({ level: 5000 })));
    await assertFails(db.collection("scores").add(skor({ para: -5 })));
    await assertFails(db.collection("scores").add(skor({ date: Date.now() + 3 * 86400000 })));
    await assertFails(db.collection("scores").add(skor({ name: "x".repeat(20) })));
    await assertFails(db.collection("scores").add(skor({ level: 999, ghosts: 999999, para: 0 })));  // score ≥ 10 milyon
    await assertFails(db.collection("scores").add(skor({ uid: HOST })));                            // girişsiz uid yazamaz
    await assertFails(db.doc(`scores/${id}`).update({ name: "Kinkin" }));                           // girişsiz isim değiştiremez
    await assertFails(db.doc(`scores/${id}`).update({ score: 1 }));
    await assertFails(db.doc(`scores/${id}`).update({ name: "Kinkin", level: 99 }));
    await assertFails(db.doc(`scores/${id}`).delete());
    await assertFails(db.collection("baska").add({ a: 1 }));
    await assertFails(db.collection("baska").get());
  });
});
