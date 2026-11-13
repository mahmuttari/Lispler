// Tavla Firestore kuralları — emülatörde (npm test). Her senaryo oyunun gerçek yazımını ya da bir saldırıyı dener.
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, serverTimestamp, increment,
} from 'firebase/firestore';

let ortam;
const A = 'ali', B = 'ayse', C = 'can';
before(async () => {
  ortam = await initializeTestEnvironment({
    projectId: 'demo-tavla',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(() => ortam?.cleanup());
beforeEach(() => ortam.clearFirestore());

const db = (uid) => ortam.authenticatedContext(uid).firestore();
const anonim = () => ortam.unauthenticatedContext().firestore();
const hazirla = (f) => ortam.withSecurityRulesDisabled((c) => f(c.firestore()));
const oda = (ek = {}) => ({ code: 'AB12', hostUid: A, hostName: 'Ali', guestUid: null, guestName: '', state: {}, version: 1,
  ts: 1, voiceConsent: { host: false, guest: false, requestedBy: null }, waiting: true, ...ek });

test('girişsiz kullanıcı hiçbir şey okuyamaz', async () => {
  await assertFails(getDoc(doc(anonim(), 'users', A)));
  await assertFails(getDocs(collection(anonim(), 'rooms')));
});

test('oyuncu kaydı: maç sonucu +1/+2 yazılır, puan şişirilemez', async () => {
  await assertSucceeds(setDoc(doc(db(A), 'users', A), { uid: A, name: 'Ali', score: 2, wins: 1, losses: 0, marsWins: 1, marsLosses: 0, updatedAt: serverTimestamp() }, { merge: true }));
  await assertSucceeds(setDoc(doc(db(A), 'users', A), { score: 3, wins: 2 }, { merge: true }));
  await assertFails(setDoc(doc(db(A), 'users', A), { score: 50 }, { merge: true }));
  await assertFails(setDoc(doc(db(A), 'users', A), { wins: 9 }, { merge: true }));
  await assertFails(setDoc(doc(db(A), 'users', A), { admin: true }, { merge: true }));
  await assertFails(setDoc(doc(db(A), 'users', A), { name: 'x'.repeat(17) }, { merge: true }));
});

test('başkasının kaydı yazılamaz ve silinemez; okunabilir (Efsaneler)', async () => {
  await hazirla((d) => setDoc(doc(d, 'users', B), { uid: B, name: 'Ayşe', score: 5 }));
  await assertSucceeds(getDoc(doc(db(A), 'users', B)));
  await assertFails(setDoc(doc(db(A), 'users', B), { score: 0 }, { merge: true }));
  await assertFails(deleteDoc(doc(db(A), 'users', B)));
});

test('sohbet yasağı: uyarı +1, yasakta sayaç sıfırlanır; süren yasak kısaltılamaz', async () => {
  const d = db(A), r = doc(d, 'users', A);
  await assertSucceeds(setDoc(r, { uid: A, chatStrikes: 1 }, { merge: true }));
  await assertSucceeds(updateDoc(r, { chatStrikes: increment(1) }));
  const sonra = Date.now() + 3 * 86400000;
  await assertSucceeds(updateDoc(r, { chatStrikes: 0, chatBanCount: 1, chatBannedUntil: sonra, lastBanAt: serverTimestamp() }));
  await assertFails(updateDoc(r, { chatBannedUntil: 0 }));
  await assertFails(updateDoc(r, { chatBanCount: 0 }));
});

test('yasaklı oyuncu sohbete yazamaz', async () => {
  await hazirla(async (d) => {
    await setDoc(doc(d, 'rooms', 'o1'), oda({ guestUid: B, waiting: false }));
    await setDoc(doc(d, 'users', A), { uid: A, chatBannedUntil: Date.now() + 86400000 });
  });
  await assertFails(addDoc(collection(db(A), 'rooms', 'o1', 'messages'), { uid: A, text: 'selam', kind: 'free', at: serverTimestamp() }));
  await assertSucceeds(addDoc(collection(db(B), 'rooms', 'o1', 'messages'), { uid: B, text: 'selam', kind: 'free', at: serverTimestamp() }));
});

test('oda: kur, katıl, oyna; üçüncü kişi yazamaz, konuk değiştirilemez', async () => {
  await assertSucceeds(setDoc(doc(db(A), 'rooms', 'o1'), { ...oda(), createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db(B), 'rooms', 'o2'), oda()));
  await assertSucceeds(getDocs(query(collection(db(B), 'rooms'), where('code', '==', 'AB12'))));
  await assertSucceeds(updateDoc(doc(db(B), 'rooms', 'o1'), { guestUid: B, guestName: 'Ayşe', waiting: false, version: 2 }));
  await assertSucceeds(updateDoc(doc(db(A), 'rooms', 'o1'), { state: { current: 'b' }, version: 3 }));
  await assertSucceeds(updateDoc(doc(db(B), 'rooms', 'o1'), { 'voiceConsent.guest': true, 'voiceConsent.requestedBy': 'guest' }));
  await assertFails(updateDoc(doc(db(C), 'rooms', 'o1'), { state: {} }));
  await assertFails(updateDoc(doc(db(C), 'rooms', 'o1'), { guestUid: C }));
  await assertFails(updateDoc(doc(db(A), 'rooms', 'o1'), { guestUid: C }));
  await assertFails(updateDoc(doc(db(B), 'rooms', 'o1'), { hostUid: B }));
  await assertFails(deleteDoc(doc(db(C), 'rooms', 'o1')));
  await assertSucceeds(deleteDoc(doc(db(B), 'rooms', 'o1')));
});

test('sohbet mesajı: yalnız oda üyesi, kendi adına, en çok 280 karakter; dışarıdan okunamaz', async () => {
  await hazirla((d) => setDoc(doc(d, 'rooms', 'o1'), oda({ guestUid: B, waiting: false })));
  const m = collection(db(A), 'rooms', 'o1', 'messages');
  await assertSucceeds(addDoc(m, { uid: A, text: 'İyi atış! 👏', kind: 'preset', at: serverTimestamp() }));
  await assertFails(addDoc(m, { uid: B, text: 'sahte', kind: 'free', at: serverTimestamp() }));
  await assertFails(addDoc(m, { uid: A, text: 'x'.repeat(281), kind: 'free', at: serverTimestamp() }));
  await assertFails(addDoc(collection(db(C), 'rooms', 'o1', 'messages'), { uid: C, text: 'hey', kind: 'free', at: serverTimestamp() }));
  await assertFails(getDocs(collection(db(C), 'rooms', 'o1', 'messages')));
  await assertSucceeds(getDocs(collection(db(B), 'rooms', 'o1', 'messages')));
});

test('engelleme: engellenen kişi davet, arkadaşlık isteği ve odaya katılma gönderemez', async () => {
  await assertSucceeds(setDoc(doc(db(A), 'users', A, 'engellenen', B), { uid: B, name: 'Ayşe', at: serverTimestamp() }));
  await assertFails(getDocs(collection(db(B), 'users', A, 'engellenen')));
  await assertFails(setDoc(doc(db(B), 'users', A, 'invites', 'd1'), { id: 'd1', fromUid: B, fromName: 'Ayşe', toUid: A, toName: 'Ali', roomCode: 'AB12', status: 'pending', createdAt: serverTimestamp(), expiresAt: 1 }));
  await assertSucceeds(setDoc(doc(db(C), 'users', A, 'invites', 'd2'), { id: 'd2', fromUid: C, fromName: 'Can', toUid: A, toName: 'Ali', roomCode: 'AB12', status: 'pending', createdAt: serverTimestamp(), expiresAt: 1 }));
  await assertFails(addDoc(collection(db(B), 'friendRequests'), { fromUid: B, fromName: 'Ayşe', toUid: A, toName: 'Ali', status: 'pending', createdAt: serverTimestamp() }));
  await hazirla((d) => setDoc(doc(d, 'rooms', 'o1'), oda()));
  await assertFails(updateDoc(doc(db(B), 'rooms', 'o1'), { guestUid: B, waiting: false }));
  await assertSucceeds(updateDoc(doc(db(C), 'rooms', 'o1'), { guestUid: C, waiting: false }));
});

test('oyun daveti: gönderen yanıtı izler ve siler, alıcı yanıtlar; başkası okuyamaz', async () => {
  const r = doc(db(B), 'users', A, 'invites', 'd1');
  await assertSucceeds(setDoc(r, { id: 'd1', fromUid: B, fromName: 'Ayşe', toUid: A, toName: 'Ali', roomCode: 'AB12', status: 'pending', createdAt: serverTimestamp(), expiresAt: 1 }));
  await assertSucceeds(getDoc(r));
  await assertFails(getDoc(doc(db(C), 'users', A, 'invites', 'd1')));
  await assertFails(updateDoc(doc(db(B), 'users', A, 'invites', 'd1'), { status: 'accepted' }));
  await assertSucceeds(updateDoc(doc(db(A), 'users', A, 'invites', 'd1'), { status: 'accepted' }));
  await assertSucceeds(deleteDoc(r));
});

test('arkadaşlık: istek, kabul; liste sahibine ait, arkadaş kendini silebilir', async () => {
  const istek = await assertSucceeds(addDoc(collection(db(A), 'friendRequests'), { fromUid: A, fromName: 'Ali', toUid: B, toName: 'Ayşe', status: 'pending', createdAt: serverTimestamp() }));
  await assertSucceeds(getDocs(query(collection(db(B), 'friendRequests'), where('toUid', '==', B))));
  await assertFails(getDocs(query(collection(db(C), 'friendRequests'), where('toUid', '==', B))));
  await assertFails(updateDoc(doc(db(A), 'friendRequests', istek.id), { status: 'accepted' }));
  await assertSucceeds(updateDoc(doc(db(B), 'friendRequests', istek.id), { status: 'accepted' }));
  await assertSucceeds(setDoc(doc(db(B), 'users', B, 'friends', A), { uid: A, name: 'Ali', addedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db(C), 'users', B, 'friends', C), { uid: C, name: 'Can', addedAt: serverTimestamp() }));
  await assertFails(getDocs(collection(db(C), 'users', B, 'friends')));
  await assertSucceeds(deleteDoc(doc(db(A), 'users', B, 'friends', A)));
});

test('rumuz: boşsa alınır, başkasınınki alınamaz ve silinemez', async () => {
  await assertSucceeds(setDoc(doc(db(A), 'names', 'pala'), { uid: A, name: 'Pala', createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db(B), 'names', 'pala'), { uid: B, name: 'Pala', createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db(B), 'names', 'ayse'), { uid: B, name: 'Başka', createdAt: serverTimestamp() }));
  await assertFails(deleteDoc(doc(db(B), 'names', 'pala')));
  await assertSucceeds(deleteDoc(doc(db(A), 'names', 'pala')));
});

test('şikâyet: yalnız oluşturulur, kimse okuyamaz', async () => {
  const s = { fromUid: A, againstUid: B, againstName: 'Ayşe', roomId: 'o1', reason: 'kufur', note: '', messages: ['...'], status: 'yeni', appVersion: '1.0.0', createdAt: serverTimestamp() };
  const r = await assertSucceeds(addDoc(collection(db(A), 'reports'), s));
  await assertFails(addDoc(collection(db(A), 'reports'), { ...s, fromUid: C }));
  await assertFails(addDoc(collection(db(A), 'reports'), { ...s, againstUid: A }));
  await assertFails(addDoc(collection(db(A), 'reports'), { ...s, reason: 'baska' }));
  await assertFails(getDoc(doc(db(A), 'reports', r.id)));
  await assertFails(getDocs(collection(db(B), 'reports')));
});

test('hesap silme: kendi verisi ve odaları silinir, başkasının verisine dokunulamaz', async () => {
  await hazirla(async (d) => {
    await setDoc(doc(d, 'users', A), { uid: A, name: 'Ali' });
    await setDoc(doc(d, 'users', A, 'friends', B), { uid: B, name: 'Ayşe' });
    await setDoc(doc(d, 'users', B, 'friends', A), { uid: A, name: 'Ali' });
    await setDoc(doc(d, 'names', 'ali'), { uid: A, name: 'Ali' });
    await setDoc(doc(d, 'rooms', 'o1'), oda({ guestUid: B }));
    await setDoc(doc(d, 'rooms', 'o1', 'messages', 'm1'), { uid: B, text: 'hey', kind: 'free' });
    await setDoc(doc(d, 'rooms', 'o1', 'signaling', 'offer'), { type: 'offer' });
  });
  const d = db(A);
  await assertSucceeds(deleteDoc(doc(d, 'users', B, 'friends', A)));
  await assertSucceeds(deleteDoc(doc(d, 'users', A, 'friends', B)));
  await assertSucceeds(getDocs(query(collection(d, 'names'), where('uid', '==', A))));
  await assertSucceeds(deleteDoc(doc(d, 'names', 'ali')));
  await assertSucceeds(getDocs(query(collection(d, 'rooms'), where('hostUid', '==', A))));
  await assertSucceeds(deleteDoc(doc(d, 'rooms', 'o1', 'messages', 'm1')));
  await assertSucceeds(deleteDoc(doc(d, 'rooms', 'o1', 'signaling', 'offer')));
  await assertSucceeds(deleteDoc(doc(d, 'rooms', 'o1')));
  await assertSucceeds(deleteDoc(doc(d, 'users', A)));
  await assertFails(deleteDoc(doc(d, 'users', B)));
});
