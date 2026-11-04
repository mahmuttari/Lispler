// Kelime Bilcek Realtime Database kuralları — emülatör testleri.
// Çalıştırma: kelime-bilcek/firebase içinde `npm ci && npm test` (Java 21 gerekir; CI: kelime-firebase-kurallar.yml).
// Yazılan gövdeler www/oyun.js'tekilerin aynısıdır; oyun.js'te alan değişirse burası ve kurallar birlikte değişir.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-kelime-bilcek',
    database: { rules: readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8') },
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearDatabase(); });

const ALI = 'aliUid000000000000000000001';
const AYSE = 'ayseUid00000000000000000002';
const KOTU = 'kotuUid00000000000000000003'; // saldırgan: girişli ama işin içinde olmayan oyuncu
const db = (uid) => env.authenticatedContext(uid).database();
const misafir = () => env.unauthenticatedContext().database();
const yonetici = async (fn) => env.withSecurityRulesDisabled((c) => fn(c.database()));

// Kayıtlı iki oyuncu (registerUsername sonrası hâl)
async function kayitli() {
  await yonetici(async (d) => {
    await d.ref().update({
      [`usernames/ali`]: ALI, [`users/${ALI}/name`]: 'ali', [`users/${ALI}/createdAt`]: 1,
      [`usernames/ayse`]: AYSE, [`users/${AYSE}/name`]: 'ayse', [`users/${AYSE}/createdAt`]: 1,
      [`usernames/kotu`]: KOTU, [`users/${KOTU}/name`]: 'kotu', [`users/${KOTU}/createdAt`]: 1,
    });
  });
}
const now = () => Date.now();
function oyunOdasi(p1 = ALI, p2 = AYSE, mode = 'sim') { // startQuickMatch › updates[rooms/…]
  return {
    status: 'playing', p1: { uid: p1, name: 'ali' }, p2: { uid: p2, name: 'ayse' }, mode,
    match: { mode, totalRounds: 10, p1Wins: 0, p2Wins: 0, ties: 0, categories: ['Ev ve Yaşam'] },
    round: { number: 1, category: 'Ev ve Yaşam', phase: 'thinking', phaseStartTime: now() },
    createdAt: now(),
  };
}

describe('girişsiz erişim', () => {
  test('hiçbir şey okunamaz, yazılamaz', async () => {
    await kayitli();
    await assertFails(misafir().ref('users').once('value'));
    await assertFails(misafir().ref('usernames/ali').once('value'));
    await assertFails(misafir().ref('leaderboard').once('value'));
    await assertFails(misafir().ref('rooms/abc').set({ status: 'waiting', p1: { uid: 'x', name: 'x' }, createdAt: 1 }));
  });
});

describe('kullanıcılar ve kullanıcı adları', () => {
  test('ad alma: önce usernames transaction, sonra users/{uid}/name (registerUsername)', async () => {
    const d = db(ALI);
    const r = await d.ref('usernames/ali').transaction((c) => (c === null || c === ALI ? ALI : undefined));
    if (!r.committed) throw new Error('transaction olmadı');
    await assertSucceeds(d.ref(`users/${ALI}`).update({ name: 'ali', createdAt: { '.sv': 'timestamp' } }));
  });
  test('başkasının adı alınamaz, ad usernames kaydı olmadan yazılamaz', async () => {
    await kayitli();
    await assertFails(db(KOTU).ref('usernames/ali').set(KOTU));
    await assertFails(db(KOTU).ref('usernames/ali').remove());
    await assertFails(db(KOTU).ref(`users/${KOTU}/name`).set('ayse'));
    await assertFails(db(ALI).ref('usernames/Büyük').set(ALI));
  });
  test('başkasının kaydı yazılamaz (v4.11: her girişli kullanıcı herkesinkini yazabiliyordu)', async () => {
    await kayitli();
    const k = db(KOTU);
    await assertFails(k.ref(`users/${ALI}/name`).set('kotu'));
    await assertFails(k.ref(`users/${ALI}/stats/wins`).set(999));
    await assertFails(k.ref(`users/${ALI}/categoryPrefs`).set(['x']));
    await assertFails(k.ref(`users/${ALI}/online`).set(false));
    await assertFails(k.ref(`users/${ALI}`).remove());
  });
  test('herkesin bütün kaydı okunamaz; ad, çevrimiçi ve kategori tercihi okunur', async () => {
    await kayitli();
    const k = db(KOTU);
    await assertFails(k.ref('users').once('value'));
    await assertFails(k.ref(`users/${ALI}`).once('value'));
    await assertFails(k.ref(`users/${ALI}/friends`).once('value'));
    await assertFails(k.ref(`users/${ALI}/invite`).once('value'));
    await assertSucceeds(k.ref(`users/${ALI}/name`).once('value'));
    await assertSucceeds(k.ref(`users/${ALI}/online`).once('value'));
    await assertSucceeds(k.ref(`users/${ALI}/categoryPrefs`).once('value'));
    await assertSucceeds(db(ALI).ref(`users/${ALI}`).once('value'));
  });
  test('Google e-postası artık yazılamaz; eski kayıt sahibince silinir', async () => {
    await kayitli();
    await assertFails(db(ALI).ref(`users/${ALI}/google`).update({ email: 'a@b.c' }));
    await assertSucceeds(db(ALI).ref(`users/${ALI}/google`).remove());
  });
  test('sahibi: çevrimiçi, kategori, ad değişimi, odalar listesi', async () => {
    await kayitli();
    const d = db(ALI);
    await assertSucceeds(d.ref(`users/${ALI}/online`).set(true));
    await assertSucceeds(d.ref(`users/${ALI}/categoryPrefs`).set(['Ev ve Yaşam', 'Hobi ve Eğlence']));
    await assertSucceeds(d.ref(`users/${ALI}/odalar/qm_ab12cd34`).set(true));
    await assertSucceeds(d.ref('usernames/ali2').transaction(() => ALI));
    await assertSucceeds(d.ref(`users/${ALI}`).update({ name: 'ali2', renamedAt: { '.sv': 'timestamp' } }));
    await assertSucceeds(d.ref('usernames/ali').remove());
    await assertFails(d.ref(`users/${ALI}/rastgele`).set('x'));
  });
  test('istatistik: her yazımda en çok 1 artar (recordMatchResult)', async () => {
    await kayitli();
    const d = db(ALI);
    const inc = { '.sv': { increment: 1 } };
    await assertSucceeds(d.ref().update({ [`users/${ALI}/stats/totalGames`]: inc, [`users/${ALI}/stats/simGames`]: inc, [`users/${ALI}/stats/wins`]: inc, [`users/${ALI}/stats/simWins`]: inc }));
    await assertSucceeds(d.ref().update({ [`users/${ALI}/stats/wins`]: inc }));
    await assertFails(d.ref(`users/${ALI}/stats/wins`).set(50));
    await assertFails(d.ref(`users/${ALI}/stats/hile`).set(1));
  });
});

describe('Şampiyonlar (leaderboard)', () => {
  test('maç sonucu: ad + sayaçlar birer artar; herkes okur, en çok kazananlar sorgusu çalışır', async () => {
    await kayitli();
    const inc = { '.sv': { increment: 1 } };
    await assertSucceeds(db(ALI).ref().update({
      [`leaderboard/${ALI}/name`]: 'ali', [`leaderboard/${ALI}/totalGames`]: inc, [`leaderboard/${ALI}/duelGames`]: inc,
      [`leaderboard/${ALI}/wins`]: inc, [`leaderboard/${ALI}/duelWins`]: inc,
      [`users/${ALI}/stats/totalGames`]: inc, [`users/${ALI}/stats/wins`]: inc,
    }));
    await assertSucceeds(db(KOTU).ref('leaderboard').orderByChild('wins').limitToLast(25).once('value'));
  });
  test('başkası adına ya da sahte adla yazılamaz; sayaç zıplatılamaz', async () => {
    await kayitli();
    await assertFails(db(KOTU).ref(`leaderboard/${ALI}/wins`).set(1));
    await assertFails(db(ALI).ref(`leaderboard/${ALI}/name`).set('ayse'));
    await assertFails(db(ALI).ref(`leaderboard/${ALI}/wins`).set(1000));
    await assertSucceeds(db(ALI).ref(`leaderboard/${ALI}`).remove());
  });
});

describe('arkadaşlar', () => {
  test('karşılıklı ekleme ve çıkarma (addFriend / removeFriend)', async () => {
    await kayitli();
    const d = db(ALI);
    await assertSucceeds(d.ref().update({ [`users/${ALI}/friends/${AYSE}`]: 'ayse', [`users/${AYSE}/friends/${ALI}`]: 'ali' }));
    await assertSucceeds(d.ref().update({ [`users/${ALI}/friends/${AYSE}`]: null, [`users/${AYSE}/friends/${ALI}`]: null }));
  });
  test('başkasının listesine üçüncü kişi yazılamaz; ad sahte olamaz', async () => {
    await kayitli();
    await assertFails(db(KOTU).ref(`users/${ALI}/friends/${AYSE}`).set('ayse'));
    await assertFails(db(KOTU).ref(`users/${ALI}/friends/${KOTU}`).set('ayse'));
    await assertFails(db(ALI).ref(`users/${ALI}/friends/${ALI}`).set('ali'));
  });
});

describe('davet', () => {
  test('davet: oda kur, daveti yaz, kabul et, sil (inviteFriend / acceptInvite)', async () => {
    await kayitli();
    const ali = db(ALI), ayse = db(AYSE);
    const oda = { status: 'waiting', p1: { uid: ALI, name: 'ali' }, mode: 'duel', createdAt: { '.sv': 'timestamp' }, invitedUid: AYSE };
    await assertSucceeds(ali.ref('rooms/inv_k3j9x0ab').set(oda));
    await assertSucceeds(ali.ref(`users/${AYSE}/invite`).set({ from: ALI, fromName: 'ali', roomId: 'inv_k3j9x0ab', ts: now() }));
    await assertFails(db(KOTU).ref('rooms/inv_k3j9x0ab').transaction((c) => (c ? { ...c, p2: { uid: KOTU, name: 'kotu' }, status: 'playing' } : c)));
    const r = await ayse.ref('rooms/inv_k3j9x0ab').transaction((c) => {
      if (!c) return c;
      return { ...c, p2: { uid: AYSE, name: 'ayse' }, status: 'playing', match: { mode: 'duel', totalRounds: 3, p1Wins: 0, p2Wins: 0, ties: 0 }, round: { number: 1, phase: 'thinking', phaseStartTime: now(), turn: 'p1' } };
    });
    if (!r.committed) throw new Error('kabul edilemedi');
    await assertSucceeds(ayse.ref('rooms/inv_k3j9x0ab/round/phaseStartTime').set({ '.sv': 'timestamp' }));
    await assertSucceeds(ayse.ref(`users/${AYSE}/invite`).remove());
  });
  test('sahte davet: başkasının odasıyla ya da başkası adına davet yazılamaz', async () => {
    await kayitli();
    await yonetici((d) => d.ref('rooms/inv_aaaa1111').set({ status: 'waiting', p1: { uid: ALI, name: 'ali' }, createdAt: 1, invitedUid: AYSE }));
    await assertFails(db(KOTU).ref(`users/${AYSE}/invite`).set({ from: KOTU, fromName: 'kotu', roomId: 'inv_aaaa1111', ts: now() }));
    await assertFails(db(KOTU).ref(`users/${AYSE}/invite`).set({ from: ALI, fromName: 'ali', roomId: 'inv_aaaa1111', ts: now() }));
    await assertFails(db(ALI).ref(`users/${KOTU}/invite`).set({ from: ALI, fromName: 'ali', roomId: 'inv_aaaa1111', ts: now() }));
  });
  test('reddetme: davet edilen odayı ve daveti siler; gönderen daveti geri alır', async () => {
    await kayitli();
    await yonetici((d) => d.ref().update({
      'rooms/inv_bbbb2222': { status: 'waiting', p1: { uid: ALI, name: 'ali' }, createdAt: 1, invitedUid: AYSE },
      [`users/${AYSE}/invite`]: { from: ALI, fromName: 'ali', roomId: 'inv_bbbb2222', ts: 1 },
    }));
    await assertFails(db(KOTU).ref(`users/${AYSE}/invite`).remove());
    await assertSucceeds(db(ALI).ref(`users/${AYSE}/invite`).remove());
    await assertSucceeds(db(AYSE).ref('rooms/inv_bbbb2222').remove());
  });
});

describe('hızlı eşleşme', () => {
  test('kuyruk, rakibi alma, oda + joinRoom çoklu yazım (startQuickMatch)', async () => {
    await kayitli();
    const ali = db(ALI), ayse = db(AYSE);
    await assertSucceeds(ayse.ref(`matchmaking/queue/${AYSE}`).set({ name: 'ayse', ts: now(), mode: 'sim' }));
    await assertSucceeds(ali.ref(`matchmaking/queue/${ALI}`).set({ name: 'ali', ts: now(), mode: 'sim' }));
    // Oyunda kuyruk dinleyicisi açıktır (queueListener): transaction ilk çağrıda rakibin kaydını önbellekte görür
    const dinle = () => {};
    ali.ref('matchmaking/queue').on('value', dinle);
    await ali.ref('matchmaking/queue').once('value');
    const claim = await ali.ref(`matchmaking/queue/${AYSE}`).transaction((c) => (c ? null : undefined));
    ali.ref('matchmaking/queue').off('value', dinle);
    if (!claim.committed) throw new Error('alınamadı');
    await assertSucceeds(ali.ref().update({
      'rooms/qm_x1y2z3w4': oyunOdasi(),
      [`matchmaking/queue/${ALI}`]: null,
      [`users/${AYSE}/joinRoom`]: 'qm_x1y2z3w4',
    }));
    await assertSucceeds(ayse.ref(`users/${AYSE}/joinRoom`).remove());
  });
  test('kuyruğa başkası adına girilemez; joinRoom ile yabancı odaya çekilemez', async () => {
    await kayitli();
    await assertFails(db(KOTU).ref(`matchmaking/queue/${ALI}`).set({ name: 'ali', ts: now(), mode: 'sim' }));
    await assertFails(db(KOTU).ref(`matchmaking/queue/${KOTU}`).set({ name: 'ali', ts: now(), mode: 'sim' }));
    await assertFails(db(KOTU).ref(`matchmaking/queue/${KOTU}`).set({ name: 'kotu', ts: now(), mode: 'gizli' }));
    await yonetici((d) => d.ref('rooms/qm_baska111').set(oyunOdasi(ALI, AYSE)));
    await assertFails(db(KOTU).ref(`users/${AYSE}/joinRoom`).set('qm_baska111'));
  });
});

describe('odalar', () => {
  test('oda kodu: kur, ikinci oyuncu katılır, maç oynanır (joinRoomByCode / submitWord)', async () => {
    await kayitli();
    const ali = db(ALI), ayse = db(AYSE);
    await assertSucceeds(ali.ref('rooms/kanka').transaction((c) => (c === null ? { status: 'waiting', p1: { uid: ALI, name: 'ali' }, mode: 'chain', createdAt: now() } : c)));
    await assertSucceeds(ayse.ref('rooms/kanka').once('value'));
    const r = await ayse.ref('rooms/kanka').transaction((c) => (c && c.status === 'waiting' ? { ...c, p2: { uid: AYSE, name: 'ayse' }, status: 'playing', match: { mode: 'chain', totalRounds: 1 }, round: { number: 1, category: null, phase: 'active', phaseStartTime: now(), turn: 'p2' } } : c));
    if (!r.committed) throw new Error('katılamadı');
    await assertSucceeds(ayse.ref('rooms/kanka/round/words').push().set({ text: 'elma', by: 'p2', valid: true, ts: now() }));
    await assertSucceeds(ali.ref('rooms/kanka/round/words').push().set({ text: 'armut', by: 'p1', valid: false, ts: now(), dup: true }));
    await assertSucceeds(ali.ref('rooms/kanka').transaction((c) => (c ? { ...c, status: 'finished', winner: 'p1', reason: 'timeout' } : c)));
  });
  test('maç sürerken yabancı okuyamaz, yazamaz, odaya giremez, silemez', async () => {
    await kayitli();
    await yonetici((d) => d.ref('rooms/qm_mac00001').set(oyunOdasi()));
    const k = db(KOTU);
    await assertFails(k.ref('rooms/qm_mac00001').once('value'));
    await assertFails(k.ref('rooms/qm_mac00001/status').set('finished'));
    await assertFails(k.ref('rooms/qm_mac00001/round/words/x').set({ text: 'hile', by: 'p1', valid: true, ts: 1 }));
    await assertFails(k.ref('rooms/qm_mac00001').remove());
  });
  test('kelime: en çok 30 karakter, bilinmeyen alan yok', async () => {
    await kayitli();
    await yonetici((d) => d.ref('rooms/qm_mac00002').set(oyunOdasi()));
    const a = db(ALI);
    await assertFails(a.ref('rooms/qm_mac00002/round/words/x').set({ text: 'x'.repeat(31), by: 'p1', valid: true, ts: 1 }));
    await assertFails(a.ref('rooms/qm_mac00002/round/words/y').set({ text: 'elma', by: 'p1', valid: true, ts: 1, html: '<b>' }));
    await assertFails(a.ref('rooms/qm_mac00002/sahte').set(1));
  });
  test('biten oda: üye siler (odayiTemizle), kod yeniden kullanılır', async () => {
    await kayitli();
    await yonetici((d) => d.ref().update({ 'rooms/kod1': { ...oyunOdasi(), status: 'finished', winner: 'p2' }, 'rooms/kod2': { ...oyunOdasi(), status: 'finished', winner: 'tie' } }));
    await assertSucceeds(db(ALI).ref('rooms/kod1').remove());
    await assertSucceeds(db(KOTU).ref('rooms/kod2').transaction((c) => (c === null || c.status === 'finished' ? { status: 'waiting', p1: { uid: KOTU, name: 'kotu' }, mode: 'sim', createdAt: now() } : c)));
  });
  test('bekleyen odada başkasının yerine p1 olunamaz', async () => {
    await kayitli();
    await yonetici((d) => d.ref('rooms/bekle').set({ status: 'waiting', p1: { uid: ALI, name: 'ali' }, mode: 'sim', createdAt: 1 }));
    await assertFails(db(KOTU).ref('rooms/bekle').set({ status: 'playing', p1: { uid: KOTU, name: 'kotu' }, p2: { uid: KOTU, name: 'kotu' }, createdAt: 1 }));
  });
});

describe('hesap silme (hesabiSil)', () => {
  test('kendi verisi, kullanıcı adı, Şampiyonlar kaydı, kuyruk ve arkadaşların listesindeki kaydı tek yazımda silinir', async () => {
    await kayitli();
    await yonetici((d) => d.ref().update({
      [`users/${ALI}/friends/${AYSE}`]: 'ayse', [`users/${AYSE}/friends/${ALI}`]: 'ali',
      [`users/${ALI}/stats/wins`]: 3, [`leaderboard/${ALI}`]: { name: 'ali', wins: 3 },
      [`matchmaking/queue/${ALI}`]: { name: 'ali', ts: 1, mode: 'sim' },
      [`users/${ALI}/odalar/qm_eski0001`]: true, 'rooms/qm_eski0001': oyunOdasi(),
    }));
    const d = db(ALI);
    await assertSucceeds(d.ref('rooms/qm_eski0001').remove());
    await assertSucceeds(d.ref().update({
      [`users/${AYSE}/friends/${ALI}`]: null,
      [`matchmaking/queue/${ALI}`]: null,
      [`leaderboard/${ALI}`]: null,
      'usernames/ali': null,
      [`users/${ALI}`]: null,
    }));
    await yonetici(async (y) => {
      const kalan = (await y.ref().once('value')).val();
      if (kalan.users[ALI] || kalan.usernames.ali || (kalan.leaderboard && kalan.leaderboard[ALI]) || kalan.users[AYSE].friends) {
        throw new Error('silinmeyen veri kaldı: ' + JSON.stringify(kalan));
      }
    });
  });
  test('başkasının hesabı silinemez', async () => {
    await kayitli();
    await assertFails(db(KOTU).ref().update({ [`users/${ALI}`]: null, 'usernames/ali': null }));
  });
});
