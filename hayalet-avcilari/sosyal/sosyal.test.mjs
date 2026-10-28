// Ücretsiz kanal içerikleri (SOSYAL-PLAN.md): metinler, videolar ve profil görselleri. Çevrimdışı; ffmpeg ve Playwright
// gerekmez (MP4 ve PNG başlıkları elle okunur).
// Çalıştırma: node --test hayalet-avcilari/sosyal/sosyal.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { KURGU } from './video.mjs';

const KLASOR = path.dirname(fileURLToPath(import.meta.url));
const METIN = JSON.parse(fs.readFileSync(path.join(KLASOR, 'metinler.json'), 'utf8'));
const SAHIP = /mahmut|marfen|mafren|tar[ıi]\s*m[üu]hendis/i;

test('metinler: altı dilde video kartı; tr ve en profil ve paylaşımları platform sınırlarında', () => {
  for (const dil of ['tr', 'en', 'es', 'ar', 'hi', 'zh']) {
    assert.ok(METIN[dil]?.video?.son && METIN[dil].video.ara, dil);
  }
  for (const dil of ['tr', 'en']) {
    const m = METIN[dil];
    assert.equal(m.profil.ad, 'Poyraz Workshop');
    assert.ok([...m.profil.yazi].length <= 80, `${dil}: profil yazısı TikTok'un 80 karakter sınırını aşıyor`);
    assert.ok(m.paylasimlar.length >= 4, dil);
    for (const s of m.paylasimlar) {
      assert.ok([...s].length <= 2200, `${dil}: paylaşım 2200 karakteri aşıyor`);
      const etiket = s.match(/#[\p{L}\p{N}_]+/gu) || [];
      assert.ok(etiket.length >= 1 && etiket.length <= 5, `${dil}: 1-5 etiket olmalı (${etiket.length}): ${s}`);
      assert.doesNotMatch(s, /reklamsız|ad-free|garanti|guarantee|en iyi|best game|#1/i, `${dil}: iddia ${s}`);
    }
  }
});

test('sahibin adı sosyal içeriklerin hiçbirinde yok', () => {
  for (const ad of ['metinler.json', 'video.mjs', 'profil.mjs']) {
    assert.doesNotMatch(fs.readFileSync(path.join(KLASOR, ad), 'utf8'), SAHIP, ad);
  }
});

// MP4 kutularını gezer: mvhd'den süre, görüntü izinin tkhd'sinden genişlik ve yükseklik
function mp4(dosya) {
  const b = fs.readFileSync(dosya);
  const o = { sure: null, w: 0, h: 0 };
  const gez = (bas, son) => {
    for (let i = bas; i + 8 <= son;) {
      let boy = b.readUInt32BE(i), ic = i + 8;
      const tur = b.toString('latin1', i + 4, i + 8);
      if (boy === 1) { boy = Number(b.readBigUInt64BE(i + 8)); ic = i + 16; } else if (boy === 0) boy = son - i;
      if (tur === 'mvhd') {
        const v1 = b[ic] === 1;
        const olcek = b.readUInt32BE(ic + (v1 ? 20 : 12));
        const sure = v1 ? Number(b.readBigUInt64BE(ic + 24)) : b.readUInt32BE(ic + 16);
        o.sure = sure / olcek;
      } else if (tur === 'tkhd') {
        const k = ic + (b[ic] === 1 ? 88 : 76);
        const w = b.readUInt32BE(k) / 65536, h = b.readUInt32BE(k + 4) / 65536;
        if (w && h) { o.w = w; o.h = h; }
      } else if (['moov', 'trak'].includes(tur)) gez(ic, i + boy);
      i += boy;
    }
  };
  assert.equal(b.toString('latin1', 4, 8), 'ftyp', `${dosya}: MP4 değil`);
  gez(0, b.length);
  return { ...o, boyut: b.length };
}

test('videolar: tr ve en, dikey 1080×1920, kurgunun süresi, 50 MB altı', () => {
  const sure = KURGU.reduce((t, k) => t + k.sure, 0);
  for (const dil of ['tr', 'en']) {
    const f = path.join(KLASOR, 'videolar', `hayalet-avcilari-${dil}.mp4`);
    assert.ok(fs.existsSync(f), `${f} yok: node hayalet-avcilari/sosyal/video.mjs ${dil}`);
    const v = mp4(f);
    assert.equal(v.w, 1080, dil); assert.equal(v.h, 1920, dil);
    assert.ok(Math.abs(v.sure - sure) < 0.5, `${dil}: süre ${v.sure} (beklenen ${sure})`);
    assert.ok(v.boyut < 50 * 1048576, dil);
  }
});

test('profil görselleri: 800×800 ve YouTube kapağı 2560×1440, 6 MB altı', () => {
  const png = (ad) => {
    const b = fs.readFileSync(path.join(KLASOR, 'profil', ad));
    assert.equal(b.toString('latin1', 1, 4), 'PNG', ad);
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), boyut: b.length };
  };
  const p = png('profil-800.png'), k = png('youtube-kapak-2560x1440.png');
  assert.deepEqual([p.w, p.h], [800, 800]);
  assert.deepEqual([k.w, k.h], [2560, 1440]);
  assert.ok(k.boyut < 6 * 1048576 && p.boyut < 6 * 1048576);
});
