#!/usr/bin/env python3
"""Hayalet Avcıları: ChatGPT paftalarını keser, kırpar, küçültür ve WebP'ye çevirir (3.18.0).

Kullanım:  python3 hayalet-avcilari/araclar/gorsel_kes.py
Girdi:     hayalet-avcilari/gorsel/ham/<PAFTA>.png  (1536 × 1024, saydam, 3 sütun × 2 satır, 512 px hücre)
Çıktı:     hayalet-avcilari/www/gorsel/<anahtar>.webp ve www/gorsel/liste.js (anahtar → [genişlik, yükseklik])

Kurallar (gorsel/CHATGPT-ISTEMI.md): hücre sırası üst satır 1-2-3, alt satır 4-5-6. Alfa değeri 40'ın altındaki soluk
pikseller silinir (ChatGPT'nin köşelerde bıraktığı görünmez lekeler). Gelmeyen pafta atlanır; oyun o görselin yerine
bugünkü kod çizimini kullanır. Yalnız oyunda kullanılan hücreler yazılır (KULLANILAN).
"""
import json
import os
import sys
from collections import deque

from PIL import Image

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
HAM = os.path.join(KOK, 'gorsel', 'ham')
CIKTI = os.path.join(KOK, 'www', 'gorsel')

# Pafta → hücre anahtarları (None: kullanılmaz). Anahtar → en uzun kenar (px).
PAFTALAR = {
    'H1': ['hayalet-normal', 'hayalet-atici', 'hayalet-mini', 'hayalet-boss', 'oyuncu-ruh', None],
    'P1': ['pet-kedi', 'pet-kopek', 'pet-kus', 'timsah', 'yarasa', 'bulut'],
    'P2': ['cali', 'kopru', 'para', 'elmas', 'zumrut', 'kalp'],
    'P3': ['guc', 'silah-baloncuk', 'silah-lazer', 'silah-yesil', 'silah-pompali', 'silah-bazuka'],
    'P4': ['esya-bomba', 'esya-dondurma', 'esya-simsek', 'esya-kasirga', 'esya-ilkyrd', 'esya-roket'],
    'K6': [None, None, None, None, 'bot', 'esya-gorunmez'],
}
BOYUT = {
    'hayalet-normal': 160, 'hayalet-atici': 160, 'hayalet-mini': 160, 'hayalet-boss': 256, 'oyuncu-ruh': 160,
    'pet-kedi': 160, 'pet-kopek': 160, 'pet-kus': 128, 'yarasa': 128, 'bulut': 256,
    'cali': 192, 'para': 96, 'elmas': 96, 'zumrut': 96, 'kalp': 96, 'guc': 128,
    'silah-baloncuk': 160, 'silah-lazer': 160, 'silah-yesil': 160, 'silah-pompali': 160, 'silah-bazuka': 192,
    'esya-bomba': 128, 'esya-dondurma': 128, 'esya-simsek': 128, 'esya-kasirga': 128, 'esya-ilkyrd': 128,
    'esya-roket': 128, 'esya-gorunmez': 128, 'bot': 160,
}
# Tema paftaları (T1–T6): 1. hücre zemin, 3. hücre su dokusu. Dikişsiz hâle getirilip DOKU px'e küçültülür
# (anahtar: tema<n>-zemin, tema<n>-su). Duvar ve objeler kod çizimiyle kalır: çarpışma biçimlerine oturan, derinlikli
# ayrıntılı çizimler; düz doku onların yerini tutmaz.
TEMA_HUCRE = {'zemin': 0, 'su': 2}
DOKU = 512          # px; oyunda 256 birimlik döşeme (2× ekranda net)
DOKU_KENAR = 6      # ChatGPT'nin hücre kenarında bıraktığı ince çizgi kırpılır
DOKU_KARISIM = 0.28  # kenarın bu oranı karşı kenarla yumuşak geçişle harmanlanır
# Kullanılmayan dokular: Volkan'ın "su" hücresi lav olarak çizildi; Volkan bölümünde lav ayrı, can yakan bir tuzak.
# Su lav gibi görünürse oyuncu ikisini karıştırır: Volkan suyu kod çizimiyle (sıcak su) kalır.
DOKU_HARIC = {'tema5-su'}

# Dünya Turu paftaları (U01–U26): her paftada iki ülke, 3. ve 6. hücre ülkenin bossu (kıyafetli hayalet). Hangi
# hücrenin hangi ülke olduğu istem dosyasından okunur ("Cell 3: Türkiye (TR) BOSS: …"). Anahtar: boss-<KOD>.
# Ülke objeleri (1, 2, 4, 5) bağlanmaz: engel olarak çarpışma biçimleri kod çizimine göre; resim o biçime oturmaz.
ISTEM = os.path.join(KOK, 'gorsel', 'CHATGPT-ISTEMI.md')
BOSS_BOYUT = 256


def ulke_bosslari():
    """İstem dosyasından {pafta: {hücre_no: ülke_kodu}} (yalnız BOSS hücreleri)."""
    import re
    metin = open(ISTEM, encoding='utf-8').read()
    sonuc = {}
    for m in re.finditer(r'^### (U\d\d) .*?(?=^### |\Z)', metin, re.S | re.M):
        for h in re.finditer(r'^Cell (\d): [^\n(]*\(([A-Z]{2})\) BOSS', m.group(0), re.M):
            sonuc.setdefault(m.group(1), {})[int(h.group(1))] = h.group(2)
    return sonuc


# Oyunda bağlı olanlar (timsah, köprü ve oyuncu ruhu kendi animasyonlarını kodla çizer; kare kare paftaları gelince)
KULLANILAN = set(BOYUT) - {'oyuncu-ruh', 'bot'}
# Atıcı hayaletin yanındaki mor küre silinir (oyun mermiyi ve atış öncesi parıltıyı kendisi çizer): sol yarı aynalanır.
SAG_KES = {'hayalet-atici'}
ALFA_ESIK = 40


def soluklari_sil(hucre):
    a = hucre.getchannel('A').point(lambda v: 0 if v < ALFA_ESIK else v)
    hucre.putalpha(a)
    return hucre


def boyundan_kes(hucre):
    """Gövdenin sağındaki küreyi siler. Küre gövdenin sağ kenarına bindiği için altındaki gövde resimde yok; hayalet
    simetrik olduğundan sol yarı sağa aynalanır. Gövdenin eni normal hayaletle aynı oranda (en/boy ≈ 0,80): orta çizgi
    soldan boyun 0,40'ı kadar içeride."""
    kutu = hucre.getbbox()
    if not kutu:
        return hucre
    x0, y0, x1, y1 = kutu
    orta = x0 + round((y1 - y0) * 0.40)
    sol = hucre.crop((x0, 0, orta, hucre.height))
    yeni = Image.new('RGBA', hucre.size, (0, 0, 0, 0))
    yeni.paste(sol, (x0, 0))
    yeni.paste(sol.transpose(Image.FLIP_LEFT_RIGHT), (orta, 0))
    return yeni


def en_buyuk_parca(hucre):
    """Saydam olmayan piksellerin 4-komşulu en büyük bileşenini bırakır (küçük ölçekte bulup büyütür)."""
    k = 4
    w, h = hucre.size
    kucuk = hucre.getchannel('A').resize((w // k, h // k), Image.NEAREST)
    kw, kh = kucuk.size
    px = kucuk.load()
    etiket = [[0] * kw for _ in range(kh)]
    boyut = {}
    n = 0
    for y in range(kh):
        for x in range(kw):
            if px[x, y] > 0 and not etiket[y][x]:
                n += 1
                q = deque([(x, y)]); etiket[y][x] = n; say = 0
                while q:
                    cx, cy = q.popleft(); say += 1
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < kw and 0 <= ny < kh and px[nx, ny] > 0 and not etiket[ny][nx]:
                            etiket[ny][nx] = n; q.append((nx, ny))
                boyut[n] = say
    if not boyut:
        return hucre
    en = max(boyut, key=boyut.get)
    maske = Image.new('L', (kw, kh), 0)
    mp = maske.load()
    for y in range(kh):
        for x in range(kw):
            if etiket[y][x] == en:
                mp[x, y] = 255
    maske = maske.resize((w, h), Image.NEAREST)
    a = Image.composite(hucre.getchannel('A'), Image.new('L', (w, h), 0), maske)
    hucre.putalpha(a)
    return hucre


def dikissiz(doku):
    """Kenarları karşı kenarla birleşen doku: yarım kaydırılmış kopya (kenarları süreklidir) kenarlarda, asıl resim
    ortada; aradaki bant yumuşak geçişle harmanlanır."""
    import numpy as np
    a = np.asarray(doku.convert('RGB'), dtype=np.float32)
    h, w, _ = a.shape
    b = np.roll(np.roll(a, h // 2, axis=0), w // 2, axis=1)
    def egri(n):
        x = np.arange(n, dtype=np.float32)
        d = np.minimum(x, n - 1 - x) / (n * DOKU_KARISIM)
        d = np.clip(d, 0, 1)
        return d * d * (3 - 2 * d)  # smoothstep: kenarda 0, içeride 1
    m = np.minimum.outer(egri(h), egri(w))[:, :, None]
    c = a * m + b * (1 - m)
    return Image.fromarray(np.clip(c + 0.5, 0, 255).astype(np.uint8), 'RGB')


def tema_dokulari(liste):
    for n in range(1, 7):
        yol = os.path.join(HAM, f'T{n}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'T{n}: boyut {resim.size}, 1536 × 1024 olmalı')
        for tur, i in TEMA_HUCRE.items():
            x0 = i * 512
            if f'tema{n}-{tur}' in DOKU_HARIC:
                continue
            hucre = resim.crop((x0 + DOKU_KENAR, DOKU_KENAR, x0 + 512 - DOKU_KENAR, 512 - DOKU_KENAR))
            doku = dikissiz(hucre).resize((DOKU, DOKU), Image.LANCZOS)
            anahtar = f'tema{n}-{tur}'
            doku.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=84, method=6)
            liste[anahtar] = [DOKU, DOKU]
        print(f'✓ T{n} (zemin, su)')


def kes():
    os.makedirs(CIKTI, exist_ok=True)
    liste = {}
    for pafta, anahtarlar in PAFTALAR.items():
        yol = os.path.join(HAM, f'{pafta}.png')
        if not os.path.exists(yol):
            print(f'- {pafta}: yok, atlandı')
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'{pafta}: boyut {resim.size}, 1536 × 1024 olmalı')
        for i, anahtar in enumerate(anahtarlar):
            if not anahtar or anahtar not in KULLANILAN:
                continue
            x0, y0 = (i % 3) * 512, (i // 3) * 512
            hucre = soluklari_sil(resim.crop((x0, y0, x0 + 512, y0 + 512)))
            if anahtar in SAG_KES:
                hucre = boyundan_kes(hucre)
            kutu = hucre.getbbox()
            if not kutu:
                sys.exit(f'{pafta} hücre {i + 1} ({anahtar}) boş')
            hucre = hucre.crop(kutu)
            en = BOYUT[anahtar]
            oran = en / max(hucre.size)
            if oran < 1:
                hucre = hucre.resize((max(1, round(hucre.width * oran)), max(1, round(hucre.height * oran))), Image.LANCZOS)
            hucre.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
            liste[anahtar] = [hucre.width, hucre.height]
        print(f'✓ {pafta}')
    tema_dokulari(liste)
    for pafta, hucreler in ulke_bosslari().items():
        yol = os.path.join(HAM, f'{pafta}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'{pafta}: boyut {resim.size}, 1536 × 1024 olmalı')
        for no, kod in hucreler.items():
            i = no - 1
            x0, y0 = (i % 3) * 512, (i // 3) * 512
            hucre = soluklari_sil(resim.crop((x0, y0, x0 + 512, y0 + 512)))
            kutu = hucre.getbbox()
            if not kutu:
                sys.exit(f'{pafta} hücre {no} (boss {kod}) boş')
            hucre = hucre.crop(kutu)
            oran = BOSS_BOYUT / max(hucre.size)
            if oran < 1:
                hucre = hucre.resize((max(1, round(hucre.width * oran)), max(1, round(hucre.height * oran))), Image.LANCZOS)
            anahtar = f'boss-{kod}'
            hucre.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
            liste[anahtar] = [hucre.width, hucre.height]
        print(f'✓ {pafta} (boss: {", ".join(hucreler.values())})')
    with open(os.path.join(CIKTI, 'liste.js'), 'w', encoding='utf-8') as f:
        f.write('// Üretilen dosya: araclar/gorsel_kes.py. Elle düzenleme.\n')
        f.write('// ChatGPT paftalarından kesilen görseller: anahtar → [genişlik, yükseklik] (px)\n')
        f.write('const GORSEL_LISTESI = ' + json.dumps(liste, ensure_ascii=False, indent=0, sort_keys=True).replace('\n', ' ') + ';\n')
    toplam = sum(os.path.getsize(os.path.join(CIKTI, f'{k}.webp')) for k in liste)
    print(f'{len(liste)} görsel, {toplam / 1024:.0f} KB')


if __name__ == '__main__':
    kes()
