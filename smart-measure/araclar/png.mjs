// Küçük PNG yardımcısı (bağımlılıksız): 8 bit RGB ya da RGBA, taramasız PNG'yi 32 bit RGBA olarak yeniden yazar.
// Play simgesi 32 bit PNG ister; tamamen opak bir ekran görüntüsünü Chromium 24 bit (RGB) kaydeder.
import zlib from 'node:zlib';

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (b) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function parca(tur, veri) {
  const b = Buffer.alloc(12 + veri.length);
  b.writeUInt32BE(veri.length, 0); b.write(tur, 4, 'ascii'); veri.copy(b, 8);
  b.writeUInt32BE(crc32(b.subarray(4, 8 + veri.length)), 8 + veri.length);
  return b;
}

export function rgbaYap(png) {
  let o = 8, w, h, bit, tur, gecme;
  const idat = [];
  while (o < png.length) {
    const n = png.readUInt32BE(o), t = png.toString('ascii', o + 4, o + 8), v = png.subarray(o + 8, o + 8 + n);
    if (t === 'IHDR') { w = v.readUInt32BE(0); h = v.readUInt32BE(4); bit = v[8]; tur = v[9]; gecme = v[12]; }
    else if (t === 'IDAT') idat.push(v);
    o += 12 + n;
  }
  if (bit !== 8 || ![2, 6].includes(tur) || gecme !== 0) throw new Error(`desteklenmeyen PNG: bit ${bit}, tür ${tur}, tarama ${gecme}`);
  const k = tur === 6 ? 4 : 3, satir = w * k;
  const ham = zlib.inflateSync(Buffer.concat(idat));
  const piks = Buffer.alloc(h * satir);
  for (let y = 0; y < h; y++) {
    const f = ham[y * (satir + 1)], kay = ham.subarray(y * (satir + 1) + 1, (y + 1) * (satir + 1));
    for (let x = 0; x < satir; x++) {
      const a = x >= k ? piks[y * satir + x - k] : 0, b = y ? piks[(y - 1) * satir + x] : 0, c = x >= k && y ? piks[(y - 1) * satir + x - k] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const tahmin = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
      piks[y * satir + x] = (kay[x] + tahmin) & 0xff;
    }
  }
  const cikis = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    cikis[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const s = y * satir + x * k, d = y * (w * 4 + 1) + 1 + x * 4;
      cikis[d] = piks[s]; cikis[d + 1] = piks[s + 1]; cikis[d + 2] = piks[s + 2]; cikis[d + 3] = k === 4 ? piks[s + 3] : 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([png.subarray(0, 8), parca('IHDR', ihdr), parca('IDAT', zlib.deflateSync(cikis, { level: 9 })), parca('IEND', Buffer.alloc(0))]);
}
