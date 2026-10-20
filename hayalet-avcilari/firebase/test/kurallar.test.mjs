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
const HOST = "u_k3j9x0abm1z9";      // getOnlineUid(): "u_" + 8 base36 + 4 base36
const KONUK = "u_7hq2c9wwm1za";
const ODA = "K7PQ2X";               // makeRoomId(): ABCDEFGHJKMNPQRSTUVWXYZ23456789 alfabesinden 6 harf
const KOD = "ABC_D23";              // genAccountCode() "ABC-D23" → anahtar "ABC_D23"

const misafir = () => env.unauthenticatedContext().database();
const google = (uid) => env.authenticatedContext(uid).database();

function oyuncuGirisi(ready, now) {           // makePlayerEntry
  return { name: "Poyraz", charKey: "kinkin", costumeIdx: 0, ready: !!ready, joinedAt: now, lastSeen: now };
}
function yeniOda(now) {                       // submitCreateRoom
  return {
    name: "Poyraz'in Odası", hostUid: HOST, hostName: "Poyraz", level: 1, status: "lobby",
    maxPlayers: 5, createdAt: now, lastSeen: now, players: { [HOST]: oyuncuGirisi(true, now) },
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
const OLAYLAR = [                             // online.pendingEvents.push(...)
  { type: "areaDmg", x: 200, y: 210, r: 150, dmg: 10, by: KONUK },
  { type: "freezeAll", duration: 5000, by: KONUK },
  { type: "hit", gi: 0, dmg: 3, by: KONUK },
  { type: "rocketShot", x: 220, y: 230, gi: 1, by: KONUK },
  { type: "pickup", pi: 1, by: KONUK },
];

async function odaKur() {
  await env.withSecurityRulesDisabled(async (c) => {
    await c.database().ref(`rooms/${ODA}`).set(yeniOda(Date.now()));
  });
}

describe("rooms — çevrimiçi oda akışı (girişsiz)", () => {
  test("oda kur, listele, katıl, hazır ol, başlat, oyna, çık", async () => {
    const h = misafir();
    const k = misafir();
    const now = Date.now();
    await assertSucceeds(h.ref(`rooms/${ODA}`).set(yeniOda(now)));                  // submitCreateRoom
    await assertSucceeds(k.ref("rooms").get());                                      // openRoomList
    await assertSucceeds(k.ref(`rooms/${ODA}`).get());                               // joinRoom
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).set(oyuncuGirisi(false, now)));
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ lastSeen: now }));
    await assertSucceeds(k.ref(`rooms/${ODA}`).onDisconnect().cancel());             // setupOnDisconnect
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).onDisconnect().cancel());
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).onDisconnect().remove());
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).update({ ready: true, lastSeen: now })); // toggleReady
    await assertSucceeds(h.ref(`rooms/${ODA}`).update({ status: "playing", lastSeen: now }));          // startMpGame
    await assertSucceeds(h.ref(`rooms/${ODA}/state`).set(null));                     // startMpGameClient (host)
    await assertSucceeds(h.ref(`rooms/${ODA}/events`).set(null));
    await assertSucceeds(h.ref(`rooms/${ODA}/players/${HOST}`).update(oyuncuAni())); // mpPush
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).update(oyuncuAni()));
    await assertSucceeds(h.ref(`rooms/${ODA}/state`).set(hostDurumu()));
    await assertSucceeds(h.ref(`rooms/${ODA}/state`).set({ g: [], p: [], e: [], lvl: 1, bd: 0, bt: 0, lt: 1 }));
    for (const ev of OLAYLAR) {
      const ref = k.ref(`rooms/${ODA}/events`).push();                             // rtdb.post (client → host)
      await assertSucceeds(ref.set(ev));
      await assertSucceeds(h.ref(`rooms/${ODA}/events/${ref.key}`).remove());       // host: snap.ref.remove()
    }
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).remove());          // leaveRoom (konuk)
    await assertSucceeds(h.ref(`rooms/${ODA}`).remove());                           // leaveRoom (host)
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).remove());          // oda zaten silinmişken çıkış
  });

  test("host ayrılınca yeni host kendini atar", async () => {
    await odaKur();
    const k = misafir();
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).set(oyuncuGirisi(true, Date.now())));
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${HOST}`).remove());           // onDisconnect().remove()
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ hostUid: KONUK, hostName: "Ayşe", lastSeen: Date.now() }));
  });

  test("izinsiz ya da bozuk yazımlar reddedilir", async () => {
    await odaKur();
    const m = misafir();
    const oda = (p) => m.ref(`rooms/${ODA}/${p}`);
    await assertFails(m.ref("/").get());
    await assertFails(m.ref("/").set({ hepsi: "gitti" }));
    await assertFails(m.ref("rooms").remove());
    await assertFails(m.ref("rooms").set({}));
    await assertFails(m.ref("baska/yol").set(1));
    await assertFails(m.ref("rooms/abcdef").set(yeniOda(Date.now())));            // küçük harf
    await assertFails(m.ref("rooms/K7PQ21").set(yeniOda(Date.now())));            // 1 alfabede yok
    await assertFails(m.ref("rooms/K7PQ2XY").set(yeniOda(Date.now())));           // 7 harf
    await assertFails(m.ref("rooms/ZZZZZZ/players/" + KONUK).update(oyuncuAni())); // silinmiş odaya yazım (zombi oda)
    await assertFails(m.ref("rooms/ZZZZZZ").update({ lastSeen: Date.now() }));
    await assertFails(oda("status").set("hacked"));
    await assertFails(oda("maxPlayers").set(50));
    await assertFails(oda("name").set("x".repeat(61)));
    await assertFails(oda("name").set(""));
    await assertFails(oda("hostUid").set("../../accounts"));
    await assertFails(oda("cop").set("ıvır zıvır"));
    await assertFails(oda(`players/${KONUK}`).update({ ...oyuncuAni(), coins: 999 }));
    await assertFails(oda(`players/${KONUK}`).update({ ready: "evet" }));
    await assertFails(oda(`players/${KONUK}`).update({ name: "x".repeat(51) }));
    await assertFails(oda("players/kötü-uid!").set(oyuncuGirisi(false, Date.now())));
    await assertFails(oda("state").set({ ...hostDurumu(), hile: 1 }));
    await assertFails(oda("state/g/0").set({ i: 0, x: "yüz", y: 1 }));
    await assertFails(oda("events").push().set({ type: "hit", gi: 0, dmg: 3, by: KONUK, payload: "x" }));
    await assertFails(oda("events").push().set({ gi: 0, dmg: 3, by: KONUK }));
  });
});

describe("accounts — kodlu yedek (girişsiz)", () => {
  const yedek = () => ({ name: "Poyraz", save: JSON.stringify({ para: 120, elmas: 3 }), updatedAt: Date.now() });

  test("yedekle, yeniden yedekle, geri yükle, sil", async () => {
    const m = misafir();
    await assertSucceeds(m.ref(`accounts/${KOD}`).set(yedek()));                   // backupAccount
    await assertSucceeds(m.ref(`accounts/${KOD}`).set(yedek()));                   // aynı kodla güncelleme
    await assertSucceeds(misafir().ref(`accounts/${KOD}`).get());                  // restoreAccount (başka cihaz)
    await assertSucceeds(google("g-uid-1").ref(`accounts/${KOD}`).remove());       // deleteAccountGoogle
  });

  test("liste, bozuk kod ve bozuk gövde reddedilir", async () => {
    const m = misafir();
    await assertFails(m.ref("accounts").get());
    await assertFails(m.ref("accounts").remove());
    await assertFails(m.ref("accounts/abc_d23").get());
    await assertFails(m.ref("accounts/ABCD23").set(yedek()));
    await assertFails(m.ref(`accounts/${KOD}`).set({ ...yedek(), admin: true }));
    await assertFails(m.ref(`accounts/${KOD}`).set({ name: "Poyraz", save: { para: 1 }, updatedAt: 1 }));
    await assertFails(m.ref(`accounts/${KOD}`).set({ name: "Poyraz", save: "{}" }));
    await assertFails(m.ref(`accounts/${KOD}`).set({ ...yedek(), save: "x".repeat(200001) }));
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

  test("başkası ve girişsiz kullanıcı erişemez", async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      await c.database().ref(`accounts_google/${UID}`).set(bulut());
    });
    await assertFails(misafir().ref(`accounts_google/${UID}`).get());
    await assertFails(misafir().ref(`accounts_google/${UID}`).set(bulut()));
    await assertFails(misafir().ref(`accounts_google/${UID}`).remove());
    await assertFails(google("baska-uid").ref(`accounts_google/${UID}`).get());
    await assertFails(google("baska-uid").ref(`accounts_google/${UID}`).set(bulut()));
    await assertFails(google("baska-uid").ref(`accounts_google/${UID}`).remove());
    await assertFails(google(UID).ref("accounts_google").get());
    await assertFails(google(UID).ref(`accounts_google/${UID}`).set({ ...bulut(), rol: "admin" }));
  });
});

describe("Firestore scores — şampiyonlar listesi", () => {
  const fs = () => env.unauthenticatedContext().firestore();
  function skor(over = {}) {                  // submitOnlineScore + scoreFor
    const e = { name: "Poyraz", level: 7, ghosts: 143, para: 2380, date: Date.now(), ...over };
    return { score: e.level * 1000 + e.ghosts * 10 + e.para, ...e };
  }

  test("ekle, listele, isimle ara, ismi değiştir", async () => {
    const db = fs();
    const ref = await assertSucceeds(db.collection("scores").add(skor()));
    await assertSucceeds(db.collection("scores").orderBy("date", "desc").limit(200).get());
    await assertSucceeds(db.collection("scores").where("name", "==", "Poyraz").limit(200).get());
    await assertSucceeds(db.doc(`scores/${ref.id}`).update({ name: "Kinkin" }));
  });

  test("bozuk skorlar ve diğer işlemler reddedilir", async () => {
    const db = fs();
    let id;
    await env.withSecurityRulesDisabled(async (c) => {
      id = (await c.firestore().collection("scores").add(skor())).id;
    });
    await assertFails(db.collection("scores").add({ ...skor(), score: 99999999 }));
    await assertFails(db.collection("scores").add({ ...skor(), hile: true }));
    const { date, ...tarihsiz } = skor();
    await assertFails(db.collection("scores").add(tarihsiz));
    await assertFails(db.collection("scores").add(skor({ name: "" })));
    await assertFails(db.collection("scores").add(skor({ level: 5000 })));
    await assertFails(db.collection("scores").add(skor({ para: -5 })));
    await assertFails(db.collection("scores").add(skor({ date: Date.now() + 3 * 86400000 })));
    await assertFails(db.doc(`scores/${id}`).update({ score: 1 }));
    await assertFails(db.doc(`scores/${id}`).update({ name: "Kinkin", level: 99 }));
    await assertFails(db.doc(`scores/${id}`).delete());
    await assertFails(db.collection("baska").add({ a: 1 }));
    await assertFails(db.collection("baska").get());
  });
});
