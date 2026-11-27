#!/usr/bin/env python3
"""Göl resimlerinin (www/gorsel/*-gol.webp) su alanını ölçer ve www/gol-su.js'e yazar.

Her resim için: en/boy oranı (ar) ve suya oturan elips (cx, cy, rx, ry; resim boyuna göre 0-1). Su pikselleri: opak ve
mavi/turkuaz/mor baskın. Elips su maskesinin momentlerinden (ağırlık merkezi, 2×standart sapma) bulunur, %90'a küçültülür:
çarpışma kıyının içinde kalır. Oyun bu sabit tablodan kurar: resim yüklü olsun olmasın her cihazda aynı (çevrimiçi eşleşme).
Kullanım: python3 araclar/gol_su_olc.py  (göl resimleri yeniden kesilince çalıştırılır)
"""
import glob
import json
import os

import numpy as np
from PIL import Image

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GORSEL = os.path.join(KOK, 'www', 'gorsel')
CIKTI = os.path.join(KOK, 'www', 'gol-su.js')


def olc(yol):
    a = np.asarray(Image.open(yol).convert('RGBA'), dtype=np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    h, w = al.shape
    su = (al > 200) & (b > 110) & (b > r + 25) & (b > g - 40)
    if su.sum() < 0.04 * w * h:  # mavi az: opak alanın ortası (yedek)
        su = al > 200
    ys, xs = np.nonzero(su)
    cx, cy = xs.mean(), ys.mean()
    rx, ry = 2 * xs.std() * 0.9, 2 * ys.std() * 0.9
    return {'ar': round(w / h, 4), 'cx': round(cx / w, 4), 'cy': round(cy / h, 4), 'rx': round(rx / w, 4), 'ry': round(ry / h, 4)}


def main():
    tablo = {}
    for yol in sorted(glob.glob(os.path.join(GORSEL, '*-gol.webp'))):
        ad = os.path.basename(yol)[:-5]
        if not (ad.startswith('tema') or ad.startswith('aile-')):
            continue
        tablo[ad] = olc(yol)
    with open(CIKTI, 'w', encoding='utf-8') as f:
        f.write('/* Göl resimlerinin su elipsi ve en/boy oranı. araclar/gol_su_olc.py üretir; elle düzenlemeyin. */\n')
        f.write('window.GOL_SU = ' + json.dumps(tablo, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'{len(tablo)} göl resmi ölçüldü → {CIKTI}')
    for k, v in tablo.items():
        print(' ', k, v)


if __name__ == '__main__':
    main()
