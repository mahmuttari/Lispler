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
// 3.10.1 ve öncesi (girişsiz) ve 3.10.2'nin giriş olmayınca kullandığı yedek: getOnlineUid() "u_" + 12 base36.
// Geçiş 3.10.3'te kapandı: bu kimliklerle yazım reddedilir.
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
function yeniOda(now, host = HOST) {          // submitCreateRoom (3.12.2: varsayılan 6 kişi)
  return {
    name: "Poyraz'in Odası", hostUid: host, hostName: "Poyraz", level: 1, status: "lobby",
    maxPlayers: 6, createdAt: now, lastSeen: now, players: { [host]: oyuncuGirisi(true, now) },
  };
}
function oyuncuAni() {                        // kaydimiGonder (3.11.0 ve öncesi: mpPushImpl › me)
  return {
    name: "Poyraz", charKey: "kinkin", costumeIdx: 2, x: 512, y: 300, facing: -1.57, hp: 3, maxHp: 3,
    walk: 0.42, invuln: false, invisible: 0, dead: 0, lastSeen: Date.now(),
  };
}
function hostDurumu() {                       // 3.11.0 ve öncesinin host durumu (i = dizideki sıra, paralarda life)
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
// 3.12.0 durumuGonder: i kalıcı kimlik; patch ile yazılır, paralar (p) yalnız değişince gövdeye girer
function kimlikliDurum(paralarla) {
  const d = {
    g: [
      { i: 17, x: 100, y: 120, hp: 2, maxHp: 3, size: 40, isBoss: 0, isShooter: 0, frozen: 0 },
      { i: 42, x: 400, y: 220, hp: 37.5, maxHp: 60, size: 95, isBoss: 1, isShooter: 0, frozen: 1 },
    ],
    e: [{ i: 43, x: 300, y: 310, vx: -120, vy: 45, isBoss: 1 }],
    lvl: 3, bd: 0, bt: 12.5, lt: 0,
  };
  if (paralarla) d.p = [{ i: 44, x: 90, y: 80, kind: "para", value: 11 }, { i: 45, x: 99, y: 60, kind: "guc" }];
  return d;
}
const SUNUCU = { ".sv": "timestamp" };         // firebase.database.ServerValue.TIMESTAMP (3.12.0 sunucuZamani)
const olaylar = (by) => [                     // online.pendingEvents.push(...)
  { type: "areaDmg", x: 200, y: 210, r: 150, dmg: 10, by },
  { type: "freezeAll", duration: 5000, by },
  { type: "hit", gi: 0, dmg: 3, by },
  { type: "rocketShot", x: 220, y: 230, gi: 1, by },
  { type: "pickup", pi: 1, by },
  { type: "mermi", gi: 43, by },              // 3.12.0: istemci düşman mermisini vurdu ya da mermi ona çarptı
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
  await assertSucceeds(h.ref(`rooms/${ODA}/state`).set(null));                     // startMpGame (3.11.0: startMpGameClient)
  await assertSucceeds(h.ref(`rooms/${ODA}/events`).set(null));
  await assertSucceeds(h.ref(`rooms/${ODA}/players/${hostUid}`).update(oyuncuAni())); // mpPush › kaydimiGonder
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).update(oyuncuAni()));
  await assertSucceeds(h.ref(`rooms/${ODA}/state`).set(hostDurumu()));
  await assertSucceeds(h.ref(`rooms/${ODA}/state`).set({ g: [], p: [], e: [], lvl: 1, bd: 0, bt: 0, lt: 1 }));
  for (const ev of olaylar(konukUid)) {
    const ref = k.ref(`rooms/${ODA}/events`).push();                             // rtdb.post (client → host)
    await assertSucceeds(ref.set(ev));
    await assertSucceeds(h.ref(`rooms/${ODA}/events/${ref.key}`).remove());       // host: snap.ref.remove()
  }
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).remove());        // odadanCik (konuk)
  await assertSucceeds(h.ref(`rooms/${ODA}`).remove());                           // odadanCik (host tek başına)
  await assertSucceeds(k.ref(`rooms/${ODA}/players/${konukUid}`).remove());        // oda zaten silinmişken çıkış
}

describe("rooms — girişli oda (3.10.2, anonim giriş)", () => {
  test("oda kur, listele, katıl, hazır ol, başlat, oyna, çık", async () => {
    await odaAkisi(anonim(HOST), anonim(KONUK), HOST, KONUK);
  });

  test("3.12.0: sunucu saati, liste sorgusu, kodla ara katılma, kimlikli durum, tur sonu, host devri", async () => {
    const UCUNCU = "Uc7pQ1wE4rT8yU2iO5pA3sD6fG9h";
    const h = anonim(HOST), k = anonim(KONUK), u = anonim(UCUNCU);
    const giris = (ready) => ({ ...oyuncuGirisi(ready, 0), joinedAt: SUNUCU, lastSeen: SUNUCU }); // makePlayerEntry
    await assertSucceeds(h.ref(`rooms/${ODA}`).set({                                // submitCreateRoom
      ...yeniOda(0, HOST), createdAt: SUNUCU, lastSeen: SUNUCU, players: { [HOST]: giris(true) },
    }));
    await assertSucceeds(h.ref(`rooms/${ODA}`).update({ lastSeen: SUNUCU }));       // odaNabziniBaslat (host lobide)
    const liste = await assertSucceeds(k.ref("rooms").orderByChild("lastSeen").startAt(Date.now() - 60000).limitToLast(40).get());
    if (!liste.child(ODA).exists()) throw new Error("lobideki oda liste sorgusunda yok");    // odaListesiniDinle
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).set(giris(false))); // joinRoom
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ lastSeen: SUNUCU }));
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).update({ ready: true, lastSeen: SUNUCU })); // toggleReady
    await assertSucceeds(h.ref(`rooms/${ODA}/state`).set(null));                    // startMpGame
    await assertSucceeds(h.ref(`rooms/${ODA}/events`).set(null));
    await assertSucceeds(h.ref(`rooms/${ODA}`).update({ status: "playing", lastSeen: 0 })); // oyundaki oda listeye girmez
    const oyunda = await assertSucceeds(k.ref("rooms").orderByChild("lastSeen").startAt(Date.now() - 60000).get());
    if (oyunda.child(ODA).exists()) throw new Error("oyundaki oda listede görünüyor");
    await assertSucceeds(u.ref(`rooms/${ODA}`).get());                              // kodlaKatil › joinRoom (oyun sürerken)
    await assertSucceeds(u.ref(`rooms/${ODA}/players/${UCUNCU}`).set(giris(true)));
    await assertSucceeds(h.ref(`rooms/${ODA}/state`).update(kimlikliDurum(true)));  // durumuGonder
    await assertSucceeds(h.ref(`rooms/${ODA}/state`).update(kimlikliDurum(false))); // paralar değişmedi
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).update({ x: 640, y: 388, walk: 0.3 })); // yalnız değişen alanlar
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).update({ dead: 1, hp: 0, lastSeen: SUNUCU }));
    await assertSucceeds(k.ref(`rooms/${ODA}/events`).push().set({ type: "mermi", gi: 43, by: KONUK }));
    await assertFails(k.ref(`rooms/${ODA}/state`).update(kimlikliDurum(false)));    // durumu yalnız host yazar
    await assertFails(k.ref(`rooms/${ODA}`).update({ status: "lobby", lastSeen: SUNUCU })); // turu yalnız host bitirir
    await assertFails(k.ref(`rooms/${ODA}/events`).push().set({ type: "mermi", gi: 43, by: HOST }));
    await assertFails(k.ref(`rooms/${ODA}/state/g/0`).update({ i: 17, x: 1, y: 1, kimlik: 9 }));
    await assertSucceeds(h.ref(`rooms/${ODA}`).update({ status: "lobby", lastSeen: SUNUCU })); // turuBitir
    await assertSucceeds(h.ref(`rooms/${ODA}/state`).set(null));
    await assertSucceeds(h.ref(`rooms/${ODA}/events`).set(null));
    for (const [db, uid] of [[h, HOST], [k, KONUK], [u, UCUNCU]]) {                  // turSonu
      await assertSucceeds(db.ref(`rooms/${ODA}/players/${uid}`).update({ ready: uid === HOST, dead: 0, hp: 3, maxHp: 3, lastSeen: SUNUCU }));
    }
    await assertSucceeds(h.ref(`rooms/${ODA}/players/${HOST}`).remove());           // odadanCik: başkası varken yalnız kaydı
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ hostUid: KONUK, hostName: "Ayşe" })); // maybeBecomeNewHost
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ status: "playing", lastSeen: 0 }));
    await assertSucceeds(k.ref(`rooms/${ODA}/state`).update(kimlikliDurum(true)));
    await assertFails(u.ref(`rooms/${ODA}`).update({ hostUid: UCUNCU, hostName: "Üç" })); // yeni host odada
    await assertFails(h.ref(`rooms/${ODA}/state`).update(kimlikliDurum(false)));    // eski host artık yazamaz
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

describe("rooms — eski kimlik (u_) ve girişsiz yazım reddedilir (geçiş kapandı)", () => {
  test("eski sürümler arasında oda kurulamaz, eski odaya yazılamaz", async () => {
    const m = misafir();
    await assertSucceeds(m.ref("rooms").get());                                     // oda listesi herkese açık
    await assertFails(m.ref(`rooms/${ODA}`).set(yeniOda(Date.now(), ESKI_HOST)));   // submitCreateRoom (3.10.1)
    await odaKur(ESKI_HOST);                                                        // geçiş döneminden kalan oda
    await assertSucceeds(m.ref(`rooms/${ODA}`).get());
    await assertFails(m.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).set(oyuncuGirisi(false, Date.now())));
    await assertFails(m.ref(`rooms/${ODA}`).update({ lastSeen: Date.now() }));
    await assertFails(m.ref(`rooms/${ODA}/players/${ESKI_HOST}`).update(oyuncuAni()));
    await assertFails(m.ref(`rooms/${ODA}/state`).set(hostDurumu()));
    await assertFails(m.ref(`rooms/${ODA}`).update({ status: "playing", lastSeen: Date.now() }));
    await assertFails(m.ref(`rooms/${ODA}/events`).push().set({ type: "pickup", pi: 1, by: ESKI_HOST }));
    await assertFails(m.ref(`rooms/${ODA}/players/${ESKI_HOST}`).remove());
    await assertFails(m.ref(`rooms/${ODA}`).remove());
  });

  test("eski sürüm girişli odaya katılamaz, odadaki eski konuk host olamaz", async () => {
    await odaKur(HOST);
    const m = misafir();
    await assertFails(m.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).set(oyuncuGirisi(false, Date.now())));
    await assertFails(m.ref(`rooms/${ODA}`).update({ lastSeen: Date.now() }));
    await odaKur(HOST, [ESKI_KONUK]);                                               // geçiş döneminde katılmış
    await assertFails(m.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).update({ ready: true, lastSeen: Date.now() }));
    await assertFails(m.ref(`rooms/${ODA}/events`).push().set({ type: "pickup", pi: 1, by: ESKI_KONUK }));
    await assertSucceeds(anonim(HOST).ref(`rooms/${ODA}/players/${HOST}`).remove());
    await assertFails(m.ref(`rooms/${ODA}`).update({ hostUid: ESKI_KONUK, hostName: "Ayşe", lastSeen: Date.now() }));
    await assertFails(m.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).remove());
  });

  test("girişli bağlantı da u_ kimliğiyle yazamaz (getOnlineUid yedeği kalktı)", async () => {
    const g = anonim(KONUK);
    await assertFails(g.ref(`rooms/${ODA}`).set(yeniOda(Date.now(), ESKI_HOST)));
    await odaKur(ESKI_HOST);
    await assertFails(g.ref(`rooms/${ODA}/players/${ESKI_HOST}`).update(oyuncuAni()));
    await assertFails(g.ref(`rooms/${ODA}/players/${ESKI_KONUK}`).set(oyuncuGirisi(false, Date.now())));
    await assertFails(g.ref(`rooms/${ODA}/state`).set(hostDurumu()));
    await assertFails(g.ref(`rooms/${ODA}/events`).push().set({ type: "hit", gi: 0, dmg: 3, by: ESKI_HOST }));
    await assertFails(g.ref(`rooms/${ODA}`).remove());
  });

  test("girişli oyuncu eski odada yalnız kendi kaydını yazar; host yokken odayı devralır", async () => {
    await odaKur(ESKI_HOST);
    const k = anonim(KONUK);
    await assertSucceeds(k.ref(`rooms/${ODA}/players/${KONUK}`).set(oyuncuGirisi(false, Date.now())));
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ lastSeen: Date.now() }));
    await assertSucceeds(k.ref(`rooms/${ODA}/events`).push().set({ type: "hit", gi: 0, dmg: 3, by: KONUK }));
    await assertFails(k.ref(`rooms/${ODA}`).update({ hostUid: KONUK, lastSeen: Date.now() }));  // eski host odada
    await assertFails(k.ref(`rooms/${ODA}/state`).set(hostDurumu()));
    await assertFails(k.ref(`rooms/${ODA}/players/${ESKI_HOST}`).remove());
    await assertFails(k.ref(`rooms/${ODA}`).remove());
    await env.withSecurityRulesDisabled(async (c) => { await c.database().ref(`rooms/${ODA}/players/${ESKI_HOST}`).remove(); });
    await assertSucceeds(k.ref(`rooms/${ODA}`).update({ hostUid: KONUK, hostName: "Ayşe", lastSeen: Date.now() }));
    await assertSucceeds(k.ref(`rooms/${ODA}`).remove());
  });
});

describe("rooms — şema", () => {
  test("izinsiz ya da bozuk yazımlar reddedilir", async () => {
    await odaKur(HOST, [KONUK]);
    const h = anonim(HOST);
    const k = anonim(KONUK);
    const oda = (db, p) => db.ref(`rooms/${ODA}/${p}`);
    const now = Date.now();
    for (const db of [misafir(), h]) {
      await assertFails(db.ref("/").get());
      await assertFails(db.ref("/").set({ hepsi: "gitti" }));
      await assertFails(db.ref("rooms").remove());
      await assertFails(db.ref("rooms").set({}));
      await assertFails(db.ref("baska/yol").set(1));
    }
    await assertSucceeds(h.ref("rooms/ZZZZZZ").set(yeniOda(now, HOST)));            // geçerli oda kurulur
    await assertSucceeds(h.ref("rooms/ZZZZZZ").remove());
    await assertFails(h.ref("rooms/abcdef").set(yeniOda(now, HOST)));               // küçük harf
    await assertFails(h.ref("rooms/K7PQ21").set(yeniOda(now, HOST)));               // 1 alfabede yok
    await assertFails(h.ref("rooms/K7PQ2XY").set(yeniOda(now, HOST)));              // 7 harf
    await assertFails(h.ref("rooms/ZZZZZZ").set({ ...yeniOda(now, HOST), maxPlayers: 50 }));
    await assertFails(h.ref("rooms/ZZZZZZ").set({ ...yeniOda(now, HOST), name: "x".repeat(61) }));
    await assertFails(h.ref("rooms/ZZZZZZ").set({ ...yeniOda(now, HOST), name: "" }));
    await assertFails(h.ref("rooms/ZZZZZZ").set({ ...yeniOda(now, HOST), status: "hacked" }));
    await assertFails(h.ref("rooms/ZZZZZZ").set({ ...yeniOda(now, HOST), cop: "ıvır zıvır" }));
    const { createdAt, ...eksik } = yeniOda(now, HOST);
    await assertFails(h.ref("rooms/ZZZZZZ").set(eksik));
    await assertFails(h.ref("rooms/ZZZZZZ/players/" + HOST).update(oyuncuAni()));  // silinmiş odaya yazım (zombi oda)
    await assertFails(k.ref("rooms/ZZZZZZ/players/" + KONUK).update(oyuncuAni()));
    await assertFails(h.ref("rooms/ZZZZZZ").update({ lastSeen: now }));
    await assertFails(oda(h, "status").set("hacked"));
    await assertFails(oda(h, "maxPlayers").set(2));                                 // kurulduktan sonra değişmez
    await assertFails(oda(h, "name").set("Yeni ad"));
    await assertFails(oda(h, "hostUid").set("../../accounts"));
    await assertFails(oda(h, "cop").set(1));
    await assertFails(oda(k, `players/${KONUK}`).update({ ...oyuncuAni(), coins: 999 }));
    await assertFails(oda(k, `players/${KONUK}`).update({ ready: "evet" }));
    await assertFails(oda(k, `players/${KONUK}`).update({ name: "x".repeat(51) }));
    await assertFails(oda(h, "players/kötü-uid!").set(oyuncuGirisi(false, now)));
    await assertFails(oda(h, "state").set({ ...hostDurumu(), hile: 1 }));
    await assertFails(oda(h, "state/g/0").set({ i: 0, x: "yüz", y: 1 }));
    await assertFails(oda(k, "events").push().set({ type: "hit", gi: 0, dmg: 3, by: KONUK, payload: "x" }));
    await assertFails(oda(k, "events").push().set({ gi: 0, dmg: 3, by: KONUK }));   // type zorunlu
    await assertFails(oda(k, "events").push().set({ type: "hit", gi: 0, dmg: 3 }));  // by zorunlu
    await assertSucceeds(oda(k, "events").push().set({ type: "hit", gi: 0, dmg: 3, by: KONUK }));
  });

  test("3.12.2: oda 2–6 kişilik kurulur; 1, 7 ve sayı olmayan sınır reddedilir", async () => {
    const h = anonim(HOST);
    const now = Date.now();
    for (const n of [2, 5, 6]) {                                                    // selectMaxPlayers; 3.12.1 ve öncesi en çok 5
      await assertSucceeds(h.ref("rooms/ZZZZZZ").set({ ...yeniOda(now, HOST), maxPlayers: n }));
      await assertSucceeds(h.ref("rooms/ZZZZZZ").remove());
    }
    for (const n of [1, 7, "6"]) {
      await assertFails(h.ref("rooms/ZZZZZZ").set({ ...yeniOda(now, HOST), maxPlayers: n }));
    }
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
    await assertSucceeds(misafir().ref(`accounts/${KOD}`).get());                  // giriş tamamlanmadan geri yükleme
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

  test("sahipsiz yazım reddedilir; geçiş döneminden kalan sahipsiz yedeği girişli kullanıcı sahiplenir", async () => {
    await assertFails(misafir().ref(`accounts/${KOD}`).set(yedek()));              // 3.10.1 backupAccount
    await assertFails(anonim(HOST).ref(`accounts/${KOD}`).set(yedek()));           // giriş varken de sahipsiz yazılamaz
    await env.withSecurityRulesDisabled(async (c) => { await c.database().ref(`accounts/${KOD}`).set(yedek()); });
    await assertSucceeds(misafir().ref(`accounts/${KOD}`).get());                  // kodu bilen okur
    await assertFails(misafir().ref(`accounts/${KOD}`).set(yedek()));
    await assertFails(misafir().ref(`accounts/${KOD}`).remove());
    await assertSucceeds(anonim(HOST).ref(`accounts/${KOD}`).set(yedek(HOST)));    // ilk yedeklemede sahiplenir
    await assertFails(anonim(HOST).ref(`accounts/${KOD}`).set(yedek()));           // artık sahipsize çevrilemez
    await assertFails(anonim(KONUK).ref(`accounts/${KOD}`).set(yedek(KONUK)));
    await env.withSecurityRulesDisabled(async (c) => { await c.database().ref("accounts/XYZ_789").set(yedek()); });
    await assertSucceeds(google("g-uid-1").ref("accounts/XYZ_789").remove());     // sahipsiz kaydı girişli kodu bilen siler (hesap silme)
  });

  test("liste, bozuk kod ve bozuk gövde reddedilir", async () => {
    const m = misafir();
    const a = anonim(HOST);
    await assertFails(m.ref("accounts").get());
    await assertFails(a.ref("accounts").get());
    await assertFails(m.ref("accounts").remove());
    await assertFails(a.ref("accounts").remove());
    await assertFails(m.ref("accounts/abc_d23").get());
    await assertFails(a.ref("accounts/ABCD23").set(yedek(HOST)));
    await assertFails(a.ref("accounts/abc_d23").set(yedek(HOST)));
    await assertFails(a.ref(`accounts/${KOD}`).set({ ...yedek(HOST), admin: true }));
    await assertFails(a.ref(`accounts/${KOD}`).set({ name: "Poyraz", save: { para: 1 }, updatedAt: 1, ownerUid: HOST }));
    await assertFails(a.ref(`accounts/${KOD}`).set({ name: "Poyraz", save: "{}", ownerUid: HOST }));
    await assertFails(a.ref(`accounts/${KOD}`).set({ ...yedek(HOST), save: "x".repeat(200001) }));
    await assertFails(a.ref(`accounts/${KOD}`).set({ ...yedek(HOST), name: "x".repeat(51) }));
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

describe("arkadaşlar — kod, istek, kabul, engel, davet, çevrimiçi durum", () => {
  // www/arkadaslar.js (3.13.0) ile aynı yollar ve gövdeler; yollar ve izinler spec §4.2–4.3
  const A = HOST, B = KONUK, C = YABANCI;
  const KODA = "K7MP2Q";                       // arkadasKoduUret(): oda kodu alfabesinden 6 harf
  const kayit = (name) => ({ name, at: SUNUCU }); // istek, sent, arkadaş ve engel gövdesi
  const davet = (name = "Ayşe") => ({ room: ODA, roomName: "Poyraz'in Odası", name, at: SUNUCU });
  const durum = (state) => ({ name: "Ayşe", charKey: "kinkin", costumeIdx: 0, state, at: SUNUCU });
  const kuralsiz = (yollar) => env.withSecurityRulesDisabled(async (c) => { await c.database().ref().update(yollar); });
  const arkadasYap = (a, b) => kuralsiz({
    [`users/${a}/friends/${b}`]: { name: "B", at: 1 }, [`users/${b}/friends/${a}`]: { name: "A", at: 1 },
  });
  const istekYaz = (db) => db.ref().update({                // arkadasIstegiGonder: A'dan B'ye
    [`users/${B}/requests/${A}`]: kayit("Ayşe"), [`users/${A}/sent/${B}`]: kayit("Bora"),
  });

  test("kod: boştaki kod alınır, tek kod okunur, liste okunamaz; dolu kodun üstüne ve başkası adına yazılamaz", async () => {
    const a = anonim(A), b = anonim(B);
    await assertSucceeds(a.ref().update({ [`friendCodes/${KODA}`]: { uid: A, name: "Ayşe" }, [`users/${A}/code`]: KODA })); // kodumuHazirla
    await assertSucceeds(b.ref(`friendCodes/${KODA}`).get());                                     // kodlaArkadasEkle
    await assertFails(b.ref("friendCodes").get());
    await assertFails(misafir().ref(`friendCodes/${KODA}`).get());
    await assertFails(b.ref(`friendCodes/${KODA}`).set({ uid: B, name: "Bora" }));                // dolu kodun üstüne
    await assertFails(b.ref("friendCodes/QQQQQQ").set({ uid: A, name: "Ayşe" }));                 // başkası adına
    await assertFails(b.ref(`users/${A}/code`).set("QQQQQQ"));
    await assertSucceeds(a.ref(`friendCodes/${KODA}/name`).set("Ayşe2"));                         // sosyalAdGuncelle
    await assertSucceeds(a.ref().update({                                                         // koduYenile
      [`friendCodes/${KODA}`]: null, "friendCodes/QQQQQQ": { uid: A, name: "Ayşe2" }, [`users/${A}/code`]: "QQQQQQ",
    }));
    await assertFails(b.ref("friendCodes/QQQQQQ").remove());
    await assertSucceeds(a.ref("friendCodes/QQQQQQ").remove());
  });

  test("istek: A'dan B'ye istek ve sent; kendine, başkası adına, arkadaşa ve engelleyene istek reddedilir; B'nin isteklerini A okuyamaz", async () => {
    const a = anonim(A), b = anonim(B);
    await assertSucceeds(istekYaz(a));
    await assertFails(a.ref(`users/${B}/requests/${A}`).set(kayit("Ayşe")));                      // aynı istek ikinci kez
    await assertFails(a.ref(`users/${B}/requests`).get());                                         // başkasının istekleri
    await assertSucceeds(b.ref(`users/${B}/requests`).orderByChild("at").limitToLast(30).get());   // sahibi dinler
    await assertSucceeds(a.ref().update({ [`users/${B}/requests/${A}`]: null, [`users/${A}/sent/${B}`]: null })); // istegiIptalEt
    await assertFails(a.ref(`users/${A}/requests/${A}`).set(kayit("Ayşe")));                      // kendine
    await assertFails(anonim(C).ref(`users/${B}/requests/${A}`).set(kayit("Ayşe")));              // başkası adına
    await arkadasYap(A, B);
    await assertFails(a.ref(`users/${B}/requests/${A}`).set(kayit("Ayşe")));                      // zaten arkadaş
    await kuralsiz({ [`users/${A}/friends/${B}`]: null, [`users/${B}/friends/${A}`]: null, [`users/${B}/blocks/${A}`]: { name: "Ayşe", at: 1 } });
    await assertFails(a.ref(`users/${B}/requests/${A}`).set(kayit("Ayşe")));                      // B, A'yı engellemiş
  });

  test("kabul: tek yazımda iki taraf; istek yokken, yabancının ve var olan kaydın üzerine yazım reddedilir", async () => {
    const b = anonim(B), c = anonim(C);
    const kabul = () => b.ref().update({                                                          // istegiKabulEt
      [`users/${B}/friends/${A}`]: kayit("Ayşe"), [`users/${A}/friends/${B}`]: kayit("Bora"),
      [`users/${B}/requests/${A}`]: null, [`users/${A}/sent/${B}`]: null,
    });
    await assertFails(kabul());                                                                    // istek yok
    await assertFails(b.ref(`users/${A}/friends/${B}`).set(kayit("Bora")));
    await kuralsiz({ [`users/${B}/requests/${A}`]: { name: "Ayşe", at: 1 }, [`users/${A}/sent/${B}`]: { name: "Bora", at: 1 } });
    await assertFails(c.ref(`users/${A}/friends/${B}`).set(kayit("Bora")));                       // yabancı
    await assertFails(c.ref(`users/${B}/friends/${A}`).set(kayit("Ayşe")));
    await assertSucceeds(kabul());
    await kuralsiz({ [`users/${B}/requests/${A}`]: { name: "Ayşe", at: 1 } });
    await assertFails(b.ref(`users/${A}/friends/${B}`).set(kayit("Sahte")));                      // var olan kaydın üzerine
    await assertFails(b.ref(`users/${B}/friends/${A}`).set(kayit("Sahte")));
  });

  test("çıkar: iki taraf birlikte; kişi kendini karşı listeden siler; yabancı silemez", async () => {
    await arkadasYap(A, B);
    await assertFails(anonim(C).ref(`users/${A}/friends/${B}`).remove());
    await assertFails(anonim(C).ref(`users/${B}/friends/${A}`).remove());
    await assertSucceeds(anonim(A).ref().update({                                                 // arkadasliktanCikar
      [`users/${A}/friends/${B}`]: null, [`users/${B}/friends/${A}`]: null,
      [`users/${A}/invites/${B}`]: null, [`users/${B}/invites/${A}`]: null,
    }));
    await arkadasYap(A, B);
    await assertSucceeds(anonim(B).ref(`users/${A}/friends/${B}`).remove());
  });

  test("engel: tek yazımda engel ve temizlik; sonra istek ve davet reddedilir; engel kalkınca istek gider; engel listesi gizli", async () => {
    await arkadasYap(A, B);
    await odaKur(A);
    await kuralsiz({ [`users/${B}/invites/${A}`]: { room: ODA, roomName: "Oda", name: "Ayşe", at: 1 } });
    const a = anonim(A), b = anonim(B);
    await assertSucceeds(b.ref().update({                                                          // engelle
      [`users/${B}/blocks/${A}`]: kayit("Ayşe"),
      [`users/${B}/friends/${A}`]: null, [`users/${A}/friends/${B}`]: null,
      [`users/${B}/requests/${A}`]: null, [`users/${A}/requests/${B}`]: null,
      [`users/${B}/sent/${A}`]: null, [`users/${A}/sent/${B}`]: null,
      [`users/${B}/invites/${A}`]: null, [`users/${A}/invites/${B}`]: null,
    }));
    await assertFails(istekYaz(a));
    await assertFails(a.ref(`users/${B}/invites/${A}`).set(davet()));
    await assertFails(a.ref(`users/${B}/blocks`).get());
    await assertSucceeds(b.ref(`users/${B}/blocks`).get());
    await assertSucceeds(b.ref(`users/${B}/blocks/${A}`).remove());                               // engeliKaldir
    await assertSucceeds(istekYaz(a));
  });

  test("davet: arkadaş ve odadaysa yazılır ve üzerine yazılır; arkadaş değilken, engelliyken, odada değilken, bozuk oda kodunda reddedilir", async () => {
    await odaKur(A);
    const a = anonim(A);
    await assertFails(a.ref(`users/${B}/invites/${A}`).set(davet()));                             // arkadaş değil
    await arkadasYap(A, B);
    await assertSucceeds(a.ref(`users/${B}/invites/${A}`).set(davet()));                          // davetGonder
    await assertSucceeds(a.ref(`users/${B}/invites/${A}`).set(davet("Ayşe2")));                   // yeni davet eskisinin üzerine
    await assertFails(a.ref(`users/${B}/invites/${A}`).set({ ...davet(), room: "../x" }));
    await assertFails(a.ref(`users/${B}/invites/${A}`).set({ ...davet(), room: "ZZZZZZ" }));      // A o odada değil
    await assertFails(anonim(C).ref(`users/${B}/invites/${A}`).set(davet()));                     // başkası adına
    await assertSucceeds(anonim(B).ref(`users/${B}/invites`).orderByChild("at").limitToLast(10).get());
    await assertSucceeds(anonim(B).ref(`users/${B}/invites/${A}`).remove());                      // davetiSil
    await kuralsiz({ [`users/${B}/blocks/${A}`]: { name: "Ayşe", at: 1 } });
    await assertFails(a.ref(`users/${B}/invites/${A}`).set(davet()));                             // engelli
  });

  test("çevrimiçi durum: sahibi yazar, arkadaş okur; yabancı ve eski arkadaş okuyamaz; başkası adına yazılamaz", async () => {
    const a = anonim(A);
    await assertSucceeds(a.ref(`presence/${A}`).set(durum("on")));                                // durumumuYaz
    await assertSucceeds(a.ref(`presence/${A}`).onDisconnect().update({ state: "off", at: SUNUCU }));
    await assertFails(anonim(B).ref(`presence/${A}`).get());                                       // henüz arkadaş değil
    await arkadasYap(A, B);
    await assertSucceeds(anonim(B).ref(`presence/${A}`).get());
    await assertFails(anonim(C).ref(`presence/${A}`).get());
    await assertFails(anonim(B).ref(`presence/${A}`).set(durum("on")));
    await assertFails(a.ref(`presence/${A}`).set(durum("uzak")));
    await assertSucceeds(a.ref(`presence/${A}`).update({ state: "room", at: SUNUCU }));
    await kuralsiz({ [`users/${A}/friends/${B}`]: null, [`users/${B}/friends/${A}`]: null });
    await assertFails(anonim(B).ref(`presence/${A}`).get());                                       // arkadaşlık bitti
    await assertSucceeds(a.ref(`presence/${A}`).remove());                                        // son arkadaş gidince
  });

  test("hesap silme: önce başkalarındaki izler, sonra kendi düğümleri; başkasının düğümü silinemez", async () => {
    await arkadasYap(A, B);
    await odaKur(A);
    await kuralsiz({
      [`users/${B}/invites/${A}`]: { room: ODA, roomName: "Oda", name: "Ayşe", at: 1 },
      [`users/${C}/requests/${A}`]: { name: "Ayşe", at: 1 }, [`users/${A}/sent/${C}`]: { name: "Cem", at: 1 },
      [`users/${A}/code`]: KODA, [`friendCodes/${KODA}`]: { uid: A, name: "Ayşe" },
      [`presence/${A}`]: { name: "Ayşe", state: "on", at: 1 }, [`presence/${B}`]: { name: "Bora", state: "on", at: 1 },
    });
    const a = anonim(A);
    await assertFails(a.ref(`users/${B}`).remove());
    await assertFails(a.ref(`presence/${B}`).remove());
    await assertSucceeds(a.ref().update({                                                          // arkadaslikVerisiniSil (1)
      [`users/${B}/friends/${A}`]: null, [`users/${B}/invites/${A}`]: null, [`users/${C}/requests/${A}`]: null,
    }));
    await assertSucceeds(a.ref().update({                                                          // arkadaslikVerisiniSil (2)
      [`users/${A}`]: null, [`presence/${A}`]: null, [`friendCodes/${KODA}`]: null,
    }));
  });

  test("şema: bilinmeyen alan, uzun ad, ileri tarih, bozuk uid ve bozuk kod reddedilir", async () => {
    await kuralsiz({ [`users/${B}/requests/${A}`]: { name: "Ayşe", at: 1 } });
    const b = anonim(B);
    const yaz = (govde) => b.ref(`users/${B}/friends/${A}`).set(govde);
    await assertFails(yaz({ ...kayit("Ayşe"), hile: 1 }));
    await assertFails(yaz(kayit("x".repeat(51))));
    await assertFails(yaz(kayit("")));
    await assertFails(yaz({ name: "Ayşe", at: Date.now() + 86400000 }));
    await assertFails(yaz({ name: "Ayşe" }));
    await assertSucceeds(yaz(kayit("Ayşe")));
    await assertFails(anonim("k!").ref("users/k!/code").set(KODA));                                // bozuk uid
    await assertFails(anonim(A).ref(`users/${A}/code`).set("abc123"));
    await assertFails(anonim(A).ref("friendCodes/K7MP21").set({ uid: A, name: "Ayşe" }));         // 1 alfabede yok
    await assertFails(anonim(A).ref("friendCodes/K7MP2QX").set({ uid: A, name: "Ayşe" }));        // 7 harf
    await assertFails(anonim(A).ref(`users/${A}/blocks/${A}`).set(kayit("Ayşe")));                // kendini engelleme
    await assertFails(anonim(A).ref(`users/${A}/baska`).set(1));
    await assertFails(anonim(A).ref(`presence/${A}`).set({ ...durum("on"), konum: "x" }));
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

  test("girişsiz: listeler ama skor ekleyemez (geçiş kapandı)", async () => {
    const db = fs();
    await assertSucceeds(db.collection("scores").orderBy("date", "desc").limit(200).get());
    await assertSucceeds(db.collection("scores").where("name", "==", "Poyraz").limit(200).get());
    await assertFails(db.collection("scores").add(skor()));                                        // 3.10.1 submitOnlineScore
    await assertFails(db.collection("scores").add(skor({ uid: HOST })));
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
    const db = fsAnonim(HOST);
    const benim = (over = {}) => skor({ uid: HOST, ...over });
    const id = await kuralsizEkle(skor());
    await assertSucceeds(db.collection("scores").add(benim()));
    await assertFails(db.collection("scores").add({ ...benim(), score: 99999999 }));
    await assertFails(db.collection("scores").add({ ...benim(), hile: true }));
    const { date, ...tarihsiz } = benim();
    await assertFails(db.collection("scores").add(tarihsiz));
    await assertFails(db.collection("scores").add(benim({ name: "" })));
    await assertFails(db.collection("scores").add(benim({ level: 5000 })));
    await assertFails(db.collection("scores").add(benim({ para: -5 })));
    await assertFails(db.collection("scores").add(benim({ date: Date.now() + 3 * 86400000 })));
    await assertFails(db.collection("scores").add(benim({ name: "x".repeat(20) })));
    await assertFails(db.collection("scores").add(benim({ level: 999, ghosts: 999999, para: 0 })));  // score ≥ 10 milyon
    await assertFails(fs().doc(`scores/${id}`).update({ name: "Kinkin" }));                         // girişsiz isim değiştiremez
    await assertFails(db.doc(`scores/${id}`).update({ score: 1 }));
    await assertFails(db.doc(`scores/${id}`).update({ name: "Kinkin", level: 99 }));
    await assertFails(db.doc(`scores/${id}`).delete());
    await assertFails(fs().doc(`scores/${id}`).delete());
    await assertFails(db.collection("baska").add({ a: 1 }));
    await assertFails(fs().collection("baska").get());
  });
});
