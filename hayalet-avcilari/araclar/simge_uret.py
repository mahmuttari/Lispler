#!/usr/bin/env python3
"""Hayalet Avcıları: uygulama simgesini ChatGPT simgesinden (gorsel/ham/I1.png, 1024 × 1024 opak) üretir (3.18.0).

Kullanıcı kararı (22 Kasım 2026): "geç" — yeni simgeye geçilir. Üretilenler:
- Android: mipmap-*/ic_launcher.png (yuvarlak köşeli kare), ic_launcher_round.png (daire), uyarlanabilir simge
  katmanları (ic_launcher_background.png: simgenin tamamı; ic_launcher_foreground.png: boş, saydam). XML'ler aynı kalır
  (mipmap-anydpi-v26, katmanlar %16,7 içeriden: içerik görünen 72 dp alanı doldurur).
- Açılış (splash) resimleri: beyaz zemin, ortada eski simgenin yerinde ve boyunda yeni simge.
- Web: www/icon-192/512/1024.png, www/icon-maskable-192/512.png.
- Play mağaza simgesi: magaza/play/simge-512.png (köşeleri Play yuvarlar; tam kare).
Kullanım: python3 hayalet-avcilari/araclar/simge_uret.py
"""
import os
from PIL import Image, ImageDraw

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
RES = os.path.join(KOK, 'android', 'app', 'src', 'main', 'res')
KAYNAK = Image.open(os.path.join(KOK, 'gorsel', 'ham', 'I1.png')).convert('RGBA')
YOGUNLUK = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def boyut(n):
    return KAYNAK.resize((n, n), Image.LANCZOS)


def maskeli(n, bicim):
    """Yuvarlak köşeli kare ya da daire; kenar yumuşatma için 4× çizip küçültür."""
    k = 4
    m = Image.new('L', (n * k, n * k), 0)
    d = ImageDraw.Draw(m)
    if bicim == 'daire':
        d.ellipse((0, 0, n * k - 1, n * k - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, n * k - 1, n * k - 1), radius=round(n * k * 0.22), fill=255)
    m = m.resize((n, n), Image.LANCZOS)
    r = boyut(n)
    r.putalpha(m)
    return r


def kaydet(resim, yol):
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    resim.save(yol, 'PNG', optimize=True)


for ad, k in YOGUNLUK.items():
    d = os.path.join(RES, f'mipmap-{ad}')
    kaydet(maskeli(round(48 * k), 'kare'), os.path.join(d, 'ic_launcher.png'))
    kaydet(maskeli(round(48 * k), 'daire'), os.path.join(d, 'ic_launcher_round.png'))
    kaydet(boyut(round(108 * k)), os.path.join(d, 'ic_launcher_background.png'))
    kaydet(Image.new('RGBA', (round(108 * k),) * 2, (0, 0, 0, 0)), os.path.join(d, 'ic_launcher_foreground.png'))

# Açılış resimleri: eski simgenin kutusu (beyaz olmayan alan) yerine aynı boyda yeni simge
for kok, klasorler, dosyalar in os.walk(RES):
    if 'splash.png' not in dosyalar:
        continue
    yol = os.path.join(kok, 'splash.png')
    eski = Image.open(yol).convert('RGB')
    w, h = eski.size
    n = round(min(w, h) / 3)  # eski simge de kısa kenarın 1/3'ü kadardı
    yeni = Image.new('RGB', (w, h), (255, 255, 255))
    s = maskeli(n, 'kare')
    yeni.paste(s, ((w - n) // 2, (h - n) // 2), s)
    yeni.save(yol, 'PNG', optimize=True)

WWW = os.path.join(KOK, 'www')
for n in (192, 512, 1024):
    kaydet(maskeli(n, 'kare'), os.path.join(WWW, f'icon-{n}.png'))
for n in (192, 512):
    kaydet(boyut(n).convert('RGB'), os.path.join(WWW, f'icon-maskable-{n}.png'))
kaydet(boyut(512).convert('RGB'), os.path.join(KOK, 'magaza', 'play', 'simge-512.png'))
print('simgeler üretildi')
