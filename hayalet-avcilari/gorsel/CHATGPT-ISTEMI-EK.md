# Hayalet Avcıları: yeni efektler ve dere süsleri için ChatGPT istem paketi (K01–K03)

Hazırlandı: 25 Kasım 2026. Kullanıcının isteği: *"Görseller için ChatGPT kullan"*. Bu paket, son eklenen özelliklerin görsellerini
ürettirir:
- yıldırım çarpma efekti (avcıya yıldırım düşünce);
- kıvrımlı derelerin kıyı süsleri;
- fırtına bulutu çeşitleri ve yıldırım çizgileri.

Kodu Evren yazar. Resim gelmezse oyun bugünkü kod çizimiyle çalışır: efekt `animHazir("carpilma")` ile denetlenir, resim yoksa
kod çizimine düşer.

## Yerel Claude için iş sırası

1. ChatGPT'de **yeni bir sohbet** aç ve `CHATGPT-ISTEMI-YOLCULUK.md`'deki **ANA İSTEM**'i bir kez gönder (aynı üslup).
2. Her paftaya üslup referansı olarak `hamui/U06.png` ve `ham3d/D01.png` ekle.
3. Her resmi `gorsel/hamek/<KOD>.png` olarak kaydet (K01 … K03). Her paftadan sonra commit ve push yap, ilerlemeyi
   `gorsel/hamek/DURUM.md`'ye yaz.
4. Üç paftayı birlikte kullanıcıya göster.
5. Giriş, şifre, ödeme ve ChatGPT'nin görsel sınırı kullanıcıya bırakılır. Oyun koduna dokunma.

Kesim: `araclar/gorsel_kes.py`. Adlar:
- K01 → `an-carpilma-1` … `an-carpilma-6`;
- K02 → `dere-sus-1` … `dere-sus-6`;
- K03 → `bulut-2`, `bulut-3`, `bulut-4`, `simsek-1`, `simsek-2`, `simsek-3`.

## K01: yıldırım çarpma (6 kare, döngü)

```
Animation sheet K01 (6 frames, grid 3 x 2, TRANSPARENT background): a cute cartoon "electrocuted" effect that is drawn ON TOP of a
small character (the character itself is NOT drawn; leave the middle of each cell empty, about 40% of the cell). Around the empty
middle: a bright cyan-white electric glow ring and 4-6 small jagged lightning sparks that crackle outward. Frame 1: thin ring, few
sparks. Frames 2-4: the ring pulses bigger and brighter, sparks jump to different positions in every frame. Frames 5-6: ring fades,
2-3 tiny sparks and small grey smoke puffs drift up. Same size and centre in every cell. Funny, not scary; no skeleton.
```

## K02: dere kıyısı süsleri (6 parça)

```
Sheet K02: small decorations placed along the banks of a winding stream, seen from DIRECTLY ABOVE, TRANSPARENT background, grid 3 x 2,
each about 120-180 px wide inside its cell:
1. a clump of green reeds/cattails
2. three floating lily pads, one with a small pink flower
3. a cluster of smooth round pebbles (grey and sand colours)
4. a mossy rock with a tiny splash ring of water at its base
5. a short piece of driftwood with a little mushroom
6. a small patch of wildflowers (yellow and white) with grass
```

## K03: fırtına bulutu çeşitleri ve yıldırım çizgileri

```
Sheet K03: storm pieces for the sky layer, TRANSPARENT background, grid 3 x 2.
Cells 1-3: three different cute dark-lilac storm clouds seen slightly from below (puffy, rounded, a soft face is NOT needed),
  1: wide and flat, 2: round and tall, 3: small and stretched with a few rain streaks under it. Same style as a premium casual game.
Cells 4-6: three vertical cartoon lightning bolts (bright yellow-white core, soft cyan glow), each a different zig-zag shape, top
  thicker than the bottom, filling the cell height. No background, no ground.
```
