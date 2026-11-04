#!/usr/bin/env python3
# APK'dan gelen simge ve açılış görsellerinin sağ alt köşesindeki görsel üretici filigranını (✦) siler.
# Köşedeki (%13) zeminden belirgin parlak pikseller, aynı satırda soldaki zemin pikseliyle değiştirilir.
# Bir kez çalıştırıldı (1.0.0); yeniden çalıştırmak zararsızdır (temiz görselde değişen piksel olmaz).
import sys
from PIL import Image

def parlaklik(p): return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]

def temizle(yol):
    im = Image.open(yol).convert('RGBA'); w, h = im.size; px = im.load()
    b = max(6, int(min(w, h) * 0.13)); x0, y0 = w - b, h - b
    zemin = sorted(parlaklik(px[x, y]) for x in range(x0, w) for y in range(y0, h) if px[x, y][3] > 200)
    if not zemin: return 0
    orta = zemin[len(zemin) // 2]; n = 0
    for y in range(y0, h):
        for x in range(x0, w):
            p = px[x, y]
            if p[3] > 200 and parlaklik(p) > orta + 5:
                k = x - b
                while k > 0 and parlaklik(px[k, y]) > orta + 5: k -= 1
                px[x, y] = px[k, y]; n += 1
    if n: im.save(yol)
    return n

for yol in sys.argv[1:]:
    print(yol, temizle(yol))
