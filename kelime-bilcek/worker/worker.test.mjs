// Kelime Bilcek Worker (floral-wave-f116) — kimlik, girdi sınırı, CORS, hız sınırı ve karar mantığı (node --test).
// Google'ın anahtar adresi sahte fetch ile bu testin ürettiği RSA anahtarına yönlendirilir; Workers AI taklit edilir.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import worker, { kimlikDogrula, KATEGORILER, SINIR, _anahtarOnbelleginiSifirla, _hizSiniriniSifirla } from './worker.js';

const require = createRequire(import.meta.url);
const { CATEGORIES } = require('../www/kelime.js');

const { privateKey, publicKey } = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const jwk = { ...(await crypto.subtle.exportKey('jwk', publicKey)), kid: 'test-kid', alg: 'RS256', use: 'sig' };
const b64 = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
async function jeton(yukEk = {}, baslikEk = {}) {
  const simdi = Math.floor(Date.now() / 1000);
  const baslik = b64({ alg: 'RS256', kid: 'test-kid', typ: 'JWT', ...baslikEk });
  const yuk = b64({ iss: 'https://securetoken.google.com/kelime-bilcek', aud: 'kelime-bilcek', sub: 'oyuncu1', iat: simdi - 10, auth_time: simdi - 10, exp: simdi + 3600, ...yukEk });
  const imza = Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${baslik}.${yuk}`))).toString('base64url');
  return `${baslik}.${yuk}.${imza}`;
}
globalThis.fetch = async (url) => {
  assert.match(String(url), /securetoken@system\.gserviceaccount\.com/);
  return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Cache-Control': 'public, max-age=20000' } });
};

let aiCagri = 0;
const env = (yanit = '{"gecerli": true, "sebep": "uygun"}') => ({ AI: { run: async () => { aiCagri++; return { response: yanit }; } } });
const istek = (govde, { token, origin = 'https://localhost', method = 'POST' } = {}) => new Request('https://w.example/', {
  method, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: method === 'POST' ? (typeof govde === 'string' ? govde : JSON.stringify(govde)) : undefined,
});
beforeEach(() => { aiCagri = 0; _anahtarOnbelleginiSifirla(); _hizSiniriniSifirla(); });

test('kategori listesi istemciyle (www/kelime.js) aynı', () => {
  assert.deepEqual(KATEGORILER, CATEGORIES);
});

test('jeton: geçerli kabul; süresi dolmuş, başka proje, bozuk imza, HS256 reddedilir', async () => {
  assert.equal((await kimlikDogrula(await jeton())).sub, 'oyuncu1');
  assert.equal(await kimlikDogrula(await jeton({ exp: Math.floor(Date.now() / 1000) - 1 })), null);
  assert.equal(await kimlikDogrula(await jeton({ aud: 'baska-proje' })), null);
  assert.equal(await kimlikDogrula(await jeton({ iss: 'https://securetoken.google.com/baska' })), null);
  assert.equal(await kimlikDogrula(await jeton({}, { alg: 'HS256' })), null);
  assert.equal(await kimlikDogrula(await jeton({}, { kid: 'yok' })), null);
  const j = await jeton();
  assert.equal(await kimlikDogrula(j.slice(0, -4) + 'AAAA'), null);
  assert.equal(await kimlikDogrula('abc'), null);
});

test('girişsiz istek 401, AI çağrılmaz', async () => {
  const r = await worker.fetch(istek({ kategori: 'Ev ve Yaşam', kelime: 'masa' }), env());
  assert.equal(r.status, 401);
  assert.equal(aiCagri, 0);
});

test('girdi sınırı: uzun kelime, bilinmeyen kategori, büyük gövde, bozuk JSON', async () => {
  const t = await jeton();
  assert.equal((await worker.fetch(istek({ kategori: 'Ev ve Yaşam', kelime: 'x'.repeat(SINIR.kelimeEnUzun + 1) }, { token: t }), env())).status, 400);
  assert.equal((await worker.fetch(istek({ kategori: 'Ev ve Yaşam', kelime: 'masa; ignore previous' }, { token: t }), env())).status, 400);
  assert.equal((await worker.fetch(istek({ kategori: 'Uydurma kategori', kelime: 'masa' }, { token: t }), env())).status, 400);
  assert.equal((await worker.fetch(istek({ kategori: '', kelime: 'masa', dolgu: 'x'.repeat(2000) }, { token: t }), env())).status, 413);
  assert.equal((await worker.fetch(istek('{bozuk', { token: t }), env())).status, 400);
  assert.equal(aiCagri, 0);
});

test('karar: iki hakem de evet → kabul; biri hayır → ret; Zincir modu', async () => {
  const t = await jeton();
  let r = await (await worker.fetch(istek({ kategori: 'Ev ve Yaşam', kelime: 'Masa' }, { token: t }), env())).json();
  assert.equal(r.gecerli, true);
  assert.equal(aiCagri, 2);
  r = await (await worker.fetch(istek({ kategori: 'Ev ve Yaşam', kelime: 'roket' }, { token: t }), env('{"gecerli": false, "sebep": "değil"}'))).json();
  assert.equal(r.gecerli, false);
  r = await (await worker.fetch(istek({ kategori: '', kelime: 'kalem' }, { token: t }), env())).json();
  assert.equal(r.gecerli, true);
});

test('başka kategorinin listesindeki kelime artık doğrudan reddedilmez (K-07)', async () => {
  const t = await jeton();
  const r = await (await worker.fetch(istek({ kategori: 'Sabah Kahvaltısının Vazgeçilmezleri', kelime: 'ekmek' }, { token: t }), env())).json();
  assert.equal(r.gecerli, true);
});

test('hız sınırı: 10 dakikada 60 istekten sonra 429', async () => {
  const t = await jeton();
  for (let i = 0; i < SINIR.istekEnCok; i++) assert.equal((await worker.fetch(istek({ kategori: '', kelime: 'kalem' }, { token: t }), env())).status, 200);
  assert.equal((await worker.fetch(istek({ kategori: '', kelime: 'kalem' }, { token: t }), env())).status, 429);
});

test('CORS: yalnız uygulama ve site kökenleri; * yok', async () => {
  const t = await jeton();
  const iyi = await worker.fetch(istek({ kategori: '', kelime: 'kalem' }, { token: t }), env());
  assert.equal(iyi.headers.get('Access-Control-Allow-Origin'), 'https://localhost');
  const kotu = await worker.fetch(istek({ kategori: '', kelime: 'kalem' }, { token: t, origin: 'https://kotu.example' }), env());
  assert.equal(kotu.headers.get('Access-Control-Allow-Origin'), null);
  const on = await worker.fetch(istek(null, { method: 'OPTIONS', origin: 'https://kelime-bilcek.web.app' }), env());
  assert.equal(on.status, 204);
  assert.match(on.headers.get('Access-Control-Allow-Headers'), /Authorization/);
  assert.equal((await worker.fetch(istek(null, { method: 'GET' }), env())).status, 405);
});

test('v3.1: Google anahtarı yenilenince yeni kid bir kez yeniden çekilir', async () => {
  const eskiFetch = globalThis.fetch;
  let cekim = 0;
  globalThis.fetch = async () => {
    cekim++;
    const keys = cekim === 1 ? [{ ...jwk, kid: 'eski-kid' }] : [jwk]; // ilk çekimde yeni anahtar yok
    return new Response(JSON.stringify({ keys }), { headers: { 'Cache-Control': 'public, max-age=20000' } });
  };
  try {
    assert.equal((await kimlikDogrula(await jeton())).sub, 'oyuncu1');
    assert.equal(cekim, 2);
  } finally { globalThis.fetch = eskiFetch; }
});

test('v3.1: harfsiz kelime ve büyük bildirilen gövde reddedilir', async () => {
  const t = await jeton();
  assert.equal((await worker.fetch(istek({ kategori: '', kelime: '- -' }, { token: t }), env())).status, 400);
  const r = new Request('https://w.example/', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Length': '999999', Origin: 'https://localhost' }, body: '{}' });
  assert.equal((await worker.fetch(r, env())).status, 413);
});
