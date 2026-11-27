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
HAMUI = os.path.join(KOK, 'gorsel', 'hamui')
HAMEK = os.path.join(KOK, 'gorsel', 'hamek')
HAMYENI = os.path.join(KOK, 'gorsel', 'hamyeni')  # yenileme paftaları R01–R49  # ek paftalar (CHATGPT-ISTEMI-EK.md, K01–K04)
HAMYOL = os.path.join(KOK, 'gorsel', 'hamyol')  # yolculuk paftaları J01–J12 (CHATGPT-ISTEMI-YOLCULUK.md)
HAMZEMIN = os.path.join(KOK, 'gorsel', 'hamzemin')  # zemin süsleri ve yollar Z01–Z04 (CHATGPT-ISTEMI-ZEMIN.md)
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


# Elleri boş karakter paftaları (KS1–KS6): karakter <anahtar>-<kostüm sırası>. Oyunda kod çiziminin boyuna ve ayak
# hizasına ölçeklenir (gorsel.js karakterResmiCiz); silahı kod çizer. Bot (KS6 5. hücre) kod çiziminde kalır.
KARAKTER = {
    'KS1': [('kinkin', 0), ('kinkin', 1), ('kinkin', 2), ('veryi', 0), ('veryi', 1), ('veryi', 2)],
    'KS2': [('kornet', 0), ('kornet', 1), ('kornet', 2), ('mark', 0), ('mark', 1), ('mark', 2)],
    'KS3': [('kent', 0), ('kent', 1), ('kent', 2), ('ponko', 0), ('ponko', 1), ('ponko', 2)],
    'KS4': [('gul', 0), ('gul', 1), ('gul', 2), ('rani', 0), ('rani', 1), ('rani', 2)],
    'KS5': [('beti', 0), ('beti', 1), ('beti', 2), ('fanatik', 0), ('fanatik', 1), ('fanatik', 2)],
    'KS6': [('silsen', 0), ('silsen', 1), ('sercin', 0), ('sercin', 1), None, None],
}
KARAKTER_BOYUT = 256

# Animasyon paftaları (N01–N13): her animasyonun kareleri an-<ad>-<n>.webp. Bir animasyonun bütün kareleri aynı
# kutudan kesilir (karelerin birleşik dolu alanı): ChatGPT'nin çizdiği hareket (atılma, uzama) korunur, kare boyu aynı
# kalır. hucreler: 1-6 sırası; boyut: en uzun kenar (px).
ANIMASYON = {
    'N01': [('hayalet-suzul', [1, 2, 3, 4, 5, 6], 160)],
    'N02': [('hayalet-puf', [1, 2, 3, 4, 5, 6], 192)],
    'N03': [('atici-saldiri', [1, 2, 3, 4, 5, 6], 192)],
    'N04': [('boss-bekle', [1, 2, 3], 256), ('boss-kukre', [4, 5, 6], 256)],
    'N05': [('boss-yenilgi', [1, 2, 3, 4, 5, 6], 256)],
    'N06': [('para', [1, 2, 3, 4, 5, 6], 96)],
    'N07': [('elmas', [1, 2, 3], 96), ('zumrut', [4, 5, 6], 96)],
    'N08': [('vurus', [1, 2, 3], 128), ('patlama', [4, 5, 6], 256)],
    'N09': [('buz', [1, 2, 3], 256), ('kasirga', [4, 5, 6], 192)],
    'N10': [('kedi', [1, 2, 3], 160), ('kopek', [4, 5, 6], 160)],
    'N11': [('kus', [1, 2, 3], 128), ('yarasa', [4, 5, 6], 128)],
    'N12': [('timsah', [1, 2, 3, 4, 5, 6], 192)],
    'N13': [('kalp-topla', [1, 2, 3], 160), ('yildiz-topla', [4, 5, 6], 160)],
    # 3.20.0 ek animasyonlar (CHATGPT-ISTEMI-ARAYUZ.md › N14–N20): ek cephane, güç, mermi, olaylar
    'N14': [('simsek', [1, 2, 3, 4, 5, 6], 256)],
    'N15': [('roket', [1, 2, 3], 128), ('duman', [4, 5, 6], 128)],
    'N16': [('sifa', [1, 2, 3], 192), ('gorunmez', [4, 5, 6], 192)],
    'N17': [('guc-patlama', [1, 2, 3], 256), ('guc-aura', [4, 5, 6], 192)],
    'N18': [('mermi-enerji', [1, 2, 3], 64), ('mermi-baloncuk', [4, 5, 6], 64)],
    'N19': [('seviye', [1, 2, 3], 256), ('hasar', [4, 5, 6], 160)],
    'N20': [('donma', [1, 2, 3], 160), ('cozulme', [4, 5, 6], 160)],
    # Ek paftalar (gorsel/hamek, CHATGPT-ISTEMI-EK.md): yıldırım çarpma efekti (hava.js)
    'K01': [('carpilma', [1, 2, 3, 4, 5, 6], 192)],
    'K05': [('kopru-in', [2, 3], 256)],
    'K10': [('mermi-yildiz', [4, 5, 6], 64)],
    'K11': [('efsane-aura', [1, 2, 3], 256)],
    'K12': [('yuva-sis', [1, 2, 3], 256), ('yuva-duman', [4, 5, 6], 256)],  # yuvaların hareketli sisi (yolculuk.js)
    'K13': [('kopru-in', [2, 3], 256)],
    'K14': [('fare-kos', [1, 2, 3], 128), ('fare-bekle', [4, 5, 6], 128)],  # yuvanın kaçışan fareleri (yuva-canlilar.js)  # dik duran kilitli köprü, kapı açılışı (K05'in yerine geçer)
    # K17: karaya çıkan timsah (tam beden; TMS1 'timsah-yuru' kullanır)
    'K17': [('timsah-yuru', [1, 2, 3, 4], 256), ('timsah-cik', [5], 256), ('timsah-dur', [6], 256)],
    'R48': [('menu-hayalet', [1, 2, 3], 160)],
    'R04': [('hayalet-dogus', [1, 2, 3], 192), ('hayalet-sarj', [4, 5, 6], 128)],  # yuvadan doğuş girdabı, atıcının şarjı
    'R05': [('toplama-halka', [1, 2, 3], 192), ('mucevher-parilti', [4, 5, 6], 128)],  # toplama halkası, mücevher pırıltısı
    'R06': [('boss-inis', [1, 2, 3], 256), ('seviye-atla', [4, 5, 6], 256)],  # boss iniş şok halkası, seviye atlama patlaması
    'R07': [('hasar-patlama', [1, 2, 3], 192), ('gorunmez-parilti', [4, 5, 6], 192)],  # oyuncu hasar alınca, görünmezlik
    'R10': [('lav', [2, 3, 4], 256)],  # kayalık kıyılı lav gölü, kabarcık ve alev
    'R42': [('selale', [1, 2, 3], 256)],  # dere üstündeki küçük şelale basamağı (köpük bandı)
    # R51–R59: ülke objelerindeki canlıların küçük döngüleri (üst satır 1. obje, alt satır 2. obje; 1. kare durağan objenin aynısı).
    # Anahtar an-<obje>-1..3: kod durağan <obje> yerine arada (4-8 sn'de bir) 1-2-3-2-1 oynatır.
    'R51': [('ulke-CN-1', [1, 2, 3], 256), ('ulke-ID-1', [4, 5, 6], 256)],
    'R52': [('ulke-PL-1', [1, 2, 3], 256), ('ulke-PL-2', [4, 5, 6], 256)],
    'R53': [('ulke-CI-2', [1, 2, 3], 256), ('ulke-ZA-2', [4, 5, 6], 256)],
    'R54': [('ulke-MG-2', [1, 2, 3], 256), ('ulke-KE-1', [4, 5, 6], 256)],
    'R55': [('ulke-KE-2', [1, 2, 3], 256), ('ulke-ET-2', [4, 5, 6], 256)],
    'R56': [('ulke-SD-2', [1, 2, 3], 256), ('ulke-IN-2', [4, 5, 6], 256)],
    'R57': [('ulke-BD-2', [1, 2, 3], 256), ('ulke-CA-2', [4, 5, 6], 256)],
    'R58': [('ulke-MX-2', [1, 2, 3], 256), ('ulke-PE-2', [4, 5, 6], 256)],
    'R59': [('ulke-BR-1', [1, 2, 3], 256), ('tema5-obje1', [4, 5, 6], 256)],
    'R50': [('havai-fisek', [2, 3, 4], 256)],  # kilitli köprünün inişi (1. kare K05 hücre 1: kopru-kapali)
}


def ham_yolu(pafta):
    """Paftanın ham PNG yolu: gorsel/ham, yoksa gorsel/hamek (K paftaları)."""
    yol = os.path.join(HAM, f'{pafta}.png')
    return yol if os.path.exists(yol) else os.path.join(HAMEK, f'{pafta}.png')


def karakterler(liste):
    for pafta, hucreler in KARAKTER.items():
        yol = os.path.join(HAM, f'{pafta}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'{pafta}: boyut {resim.size}, 1536 × 1024 olmalı')
        for i, h in enumerate(hucreler):
            if not h:
                continue
            x0, y0 = (i % 3) * 512, (i // 3) * 512
            hucre = soluklari_sil(resim.crop((x0, y0, x0 + 512, y0 + 512)))
            kutu = hucre.getbbox()
            if not kutu:
                sys.exit(f'{pafta} hücre {i + 1} boş')
            hucre = hucre.crop(kutu)
            oran = KARAKTER_BOYUT / max(hucre.size)
            if oran < 1:
                hucre = hucre.resize((max(1, round(hucre.width * oran)), max(1, round(hucre.height * oran))), Image.LANCZOS)
            anahtar = f'kar-{h[0]}-{h[1]}'
            hucre.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
            liste[anahtar] = [hucre.width, hucre.height]
        print(f'✓ {pafta} (karakter)')


ANIM_GOVDE = {}  # ad → ilk karenin dolu alanı, birleşik kutuya oranla [x, y, w, h]: oyun gövdeyi bu kutuya oturtur


# --ek ardından pafta kodları verilirse (ör. --ek R47 J02) yalnız onlar kesilir; verilmezse bütün ek paftalar
SECILI = set()


def secili_mi(kod):
    return not SECILI or kod in SECILI


def animasyonlar(liste):
    for pafta, animler in ANIMASYON.items():
        if not secili_mi(pafta):
            continue
        yol = ham_yolu(pafta)
        if not os.path.exists(yol):
            yol = os.path.join(HAMYENI, f'{pafta}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'{pafta}: boyut {resim.size}, 1536 × 1024 olmalı')
        for ad, hucreler, en in animler:
            if yerine_gecildi(ad, pafta):
                continue
            kareler = []
            for no in hucreler:
                i = no - 1
                x0, y0 = (i % 3) * 512, (i // 3) * 512
                kareler.append(soluklari_sil(resim.crop((x0, y0, x0 + 512, y0 + 512))))
            kutular = [k.getbbox() for k in kareler if k.getbbox()]
            if not kutular:
                sys.exit(f'{pafta} {ad}: kareler boş')
            birlesik = (min(b[0] for b in kutular), min(b[1] for b in kutular), max(b[2] for b in kutular), max(b[3] for b in kutular))
            w, h = birlesik[2] - birlesik[0], birlesik[3] - birlesik[1]
            ilk = kareler[0].getbbox() or birlesik
            ANIM_GOVDE[ad] = [round((ilk[0] - birlesik[0]) / w, 4), round((ilk[1] - birlesik[1]) / h, 4),
                              round((ilk[2] - ilk[0]) / w, 4), round((ilk[3] - ilk[1]) / h, 4)]
            oran = min(1, en / max(w, h))
            for n, k in enumerate(kareler, 1):
                kare = k.crop(birlesik)
                if oran < 1:
                    kare = kare.resize((max(1, round(w * oran)), max(1, round(h * oran))), Image.LANCZOS)
                anahtar = f'an-{ad}-{n}'
                kare.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=86, method=6)
                liste[anahtar] = [kare.width, kare.height]
        print(f'✓ {pafta} (animasyon: {", ".join(a[0] for a in animler)})')


# 3D görünümlü karakterler (CHATGPT-ISTEMI-3D.md): animasyon paftaları A01–A34 (gorsel/ham3d), her kostüm için bir
# pafta. Izgara 4 sütun × 2 satır, hücre 384 × 512; kare 1-4 yürüyüş, 5-6 nefes, 7-8 atış. Karelerin hepsi 8 karenin
# dolu alanlarının BİRLEŞİMİNDEN kesilir: ayak hizası ve karakterin yeri kareden kareye korunur, boyu değişmez (oyunda
# karakter kareden kareye zıplamaz). Pafta tablosundaki adlar oyundaki anahtarlardır (Marli → mark, Kenit → kent,
# Güllu → gul, Beri → beti).
HAM3D = os.path.join(KOK, 'gorsel', 'ham3d')
KARAKTER3D = {
    'A01': ('kinkin', 0), 'A02': ('kinkin', 1), 'A03': ('kinkin', 2),
    'A04': ('veryi', 0), 'A05': ('veryi', 1), 'A06': ('veryi', 2),
    'A07': ('kornet', 0), 'A08': ('kornet', 1), 'A09': ('kornet', 2),
    'A10': ('mark', 0), 'A11': ('mark', 1), 'A12': ('mark', 2),
    'A13': ('kent', 0), 'A14': ('kent', 1), 'A15': ('kent', 2),
    'A16': ('ponko', 0), 'A17': ('ponko', 1), 'A18': ('ponko', 2),
    'A19': ('gul', 0), 'A20': ('gul', 1), 'A21': ('gul', 2),
    'A22': ('rani', 0), 'A23': ('rani', 1), 'A24': ('rani', 2),
    'A25': ('beti', 0), 'A26': ('beti', 1), 'A27': ('beti', 2),
    'A28': ('fanatik', 0), 'A29': ('fanatik', 1), 'A30': ('fanatik', 2),
    'A31': ('silsen', 0), 'A32': ('silsen', 1),
    'A33': ('sercin', 0), 'A34': ('sercin', 1),
}
KARAKTER3D_YUKSEKLIK = 256  # px; kare yüksekliği bu değeri geçmeyecek (hepsi aynı oranla küçültülür)


def karakterler3d(liste):
    """A paftalarını (gorsel/ham3d) keser: k3-<karakter>-<kostüm>-<n>.webp (n: 1-8). Pafta gelmemişse sessizce atlanır."""
    for pafta, (karakter, kostum) in KARAKTER3D.items():
        yol = os.path.join(HAM3D, f'{pafta}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'{pafta}: boyut {resim.size}, 1536 × 1024 olmalı')
        kareler = []
        for n in range(1, 9):
            x0, y0 = ((n - 1) % 4) * 384, ((n - 1) // 4) * 512
            kare = soluklari_sil(resim.crop((x0, y0, x0 + 384, y0 + 512)))
            if not kare.getbbox():
                sys.exit(f'{pafta} kare {n} boş')
            kareler.append(kare)
        kutular = [k.getbbox() for k in kareler]
        birlesik = (min(b[0] for b in kutular), min(b[1] for b in kutular),
                    max(b[2] for b in kutular), max(b[3] for b in kutular))
        w, h = birlesik[2] - birlesik[0], birlesik[3] - birlesik[1]
        oran = min(1, KARAKTER3D_YUKSEKLIK / h)
        for n, kare in enumerate(kareler, 1):
            k = kare.crop(birlesik)
            if oran < 1:
                k = k.resize((max(1, round(w * oran)), max(1, round(h * oran))), Image.LANCZOS)
            anahtar = f'k3-{karakter}-{kostum}-{n}'
            k.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
            liste[anahtar] = [k.width, k.height]
        print(f'✓ {pafta} (3D karakter)')


# 3D silah paftaları (W1–W3): ızgara 3 sütun × 2 satır, 512 px hücre; namlu sağa, tutma yeri solda. Karakter silahları
# s3-<karakter>, dükkân silahları s3-<silah> anahtarıyla kaydedilir (None: hücre boş).
SILAH3D = {
    'W1': ['kinkin', 'veryi', 'mark', 'ponko', 'gul', 'rani'],
    'W2': ['fanatik', 'kornet', 'kent', 'silsen', 'sercin', None],
    'W3': ['baloncuk', 'lazer', 'yesil', 'pompali', 'bazuka', None],
}
SILAH3D_KENAR = 192  # px; en uzun kenar bu değeri geçmeyecek


def silahlar3d(liste):
    """W paftalarını (gorsel/ham3d) keser: s3-<anahtar>.webp. Pafta gelmemişse sessizce atlanır."""
    for pafta, anahtarlar in SILAH3D.items():
        yol = os.path.join(HAM3D, f'{pafta}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'{pafta}: boyut {resim.size}, 1536 × 1024 olmalı')
        for i, ad in enumerate(anahtarlar):
            if not ad:
                continue
            x0, y0 = (i % 3) * 512, (i // 3) * 512
            hucre = soluklari_sil(resim.crop((x0, y0, x0 + 512, y0 + 512)))
            kutu = hucre.getbbox()
            if not kutu:
                sys.exit(f'{pafta} hücre {i + 1} boş')
            hucre = hucre.crop(kutu)
            oran = min(1, SILAH3D_KENAR / max(hucre.size))
            if oran < 1:
                hucre = hucre.resize((max(1, round(hucre.width * oran)), max(1, round(hucre.height * oran))), Image.LANCZOS)
            hucre.save(os.path.join(CIKTI, f's3-{ad}.webp'), 'WEBP', quality=88, method=6)
            liste[f's3-{ad}'] = [hucre.width, hucre.height]
        print(f'✓ {pafta} (3D silah)')


# Arayüz paftaları (gorsel/hamui, CHATGPT-ISTEMI-ARAYUZ.md): ızgara 3 sütun × 2 satır, 512 px hücre. Değer: (en uzun
# kenar, hücre anahtarları 1-6). U09 ayrı: tek dikey resim (1024 × 1536) ayrı tabloda.
ARAYUZ = {
    'U01': (320, ['kart-kinkin', 'kart-veryi', 'kart-kornet', 'kart-mark', 'kart-kent', 'kart-ponko']),
    'U02': (320, ['kart-gul', 'kart-rani', 'kart-beti', 'kart-fanatik', 'kart-silsen', 'kart-sercin']),
    'U03': (160, ['guc-kinkin', 'guc-veryi', 'guc-kornet', 'guc-mark', 'guc-kent', 'guc-ponko']),
    'U04': (160, ['guc-gul', 'guc-rani', 'guc-beti', 'guc-fanatik', 'guc-silsen', 'guc-sercin']),
    'U05': (128, ['gel-hiz', 'gel-hasar', 'gel-atis', 'gel-menzil', 'gel-can', 'gel-miknatis']),
    'U06': (128, ['ui-para', 'ui-elmas', 'ui-zumrut', 'ui-kupa', 'ui-madalya', 'ui-sandik']),
    'U07': (128, ['ui-oyna', 'ui-karakterler', 'ui-magaza', 'ui-sampiyon', 'ui-dunya', 'ui-online']),
    'U08': (128, ['ui-arkadas', 'ui-hesap', 'ui-ses', 'ui-dil', 'ui-basarim', 'ui-ayar']),
    'U10': (256, ['ui-zafer', 'ui-yenilgi', 'ui-rekor', 'ui-boss', 'ui-seviye', 'ui-hediye']),
}
ARAYUZ_TEK = {'U09': ('giris-kahraman', 768)}  # anahtar, en çok genişlik (px)


def arayuz(liste):
    """U paftalarını (gorsel/hamui) keser: kart-*, guc-*, gel-*, ui-* ve giriş kahramanı. Pafta yoksa sessizce atlanır."""
    for pafta, (en, anahtarlar) in ARAYUZ.items():
        yol = os.path.join(HAMUI, f'{pafta}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'{pafta}: boyut {resim.size}, 1536 × 1024 olmalı')
        for i, anahtar in enumerate(anahtarlar):
            x0, y0 = (i % 3) * 512, (i // 3) * 512
            hucre = soluklari_sil(resim.crop((x0, y0, x0 + 512, y0 + 512)))
            kutu = hucre.getbbox()
            if not kutu:
                sys.exit(f'{pafta} hücre {i + 1} ({anahtar}) boş')
            hucre = hucre.crop(kutu)
            oran = min(1, en / max(hucre.size))
            if oran < 1:
                hucre = hucre.resize((max(1, round(hucre.width * oran)), max(1, round(hucre.height * oran))), Image.LANCZOS)
            hucre.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
            liste[anahtar] = [hucre.width, hucre.height]
        print(f'✓ {pafta} (arayüz)')
    for pafta, (anahtar, en) in ARAYUZ_TEK.items():
        yol = os.path.join(HAMUI, f'{pafta}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1024, 1536):
            sys.exit(f'{pafta}: boyut {resim.size}, 1024 × 1536 olmalı')
        kutu = soluklari_sil(resim).getbbox()
        if not kutu:
            sys.exit(f'{pafta} boş')
        resim = resim.crop(kutu)
        oran = min(1, en / resim.width)
        if oran < 1:
            resim = resim.resize((max(1, round(resim.width * oran)), max(1, round(resim.height * oran))), Image.LANCZOS)
        resim.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
        liste[anahtar] = [resim.width, resim.height]
        print(f'✓ {pafta} (giriş kahramanı)')


NAMUL_UCU = {}  # k4-<karakter>-<kostüm> → yan karelerin namlu ucu, dört kare [fx, fy] (kırpılmış kareye oranla)
YONLER = ('yan', 'on', 'arka')


def _namlu_ucu(kare):
    """20%–60% yükseklik bandındaki en sağdaki alfa > 200 pikselin oranı; yoksa None."""
    px = kare.getchannel('A').load()
    w, h = kare.size
    y0, y1 = max(0, round(h * 0.2)), min(h, round(h * 0.6))
    for x in range(w - 1, -1, -1):
        uygun = [y for y in range(y0, y1) if px[x, y] > 200]
        if uygun:
            y = max(uygun, key=lambda yy: px[x, yy])
            return [round(x / w, 4), round(y / h, 4)]
    return None


def karakterler_yon(liste):
    """Y paftalarını (gorsel/ham3d) keser: k4-<karakter>-<kostüm>-<yon>-<n>.webp. Izgara 4 sütun × 3 satır (384 × 341,
    son satır 342 px); satırlar yan/on/arka, dört yürüyüş karesi. On iki kare birleşik kutudan kesilir."""
    for pafta, (karakter, kostum) in KARAKTER3D.items():
        ad = f'Y{pafta[1:]}'
        yol = os.path.join(HAM3D, f'{ad}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'{ad}: boyut {resim.size}, 1536 × 1024 olmalı')
        kareler = []
        for r in range(3):
            y0 = r * 341
            for c in range(4):
                kare = soluklari_sil(resim.crop((c * 384, y0, c * 384 + 384, min(y0 + 341, 1024))))
                if not kare.getbbox():
                    sys.exit(f'{ad} {YONLER[r]} kare {c + 1} boş')
                kareler.append(kare)
        kutular = [k.getbbox() for k in kareler]
        birlesik = (min(b[0] for b in kutular), min(b[1] for b in kutular),
                    max(b[2] for b in kutular), max(b[3] for b in kutular))
        w, h = birlesik[2] - birlesik[0], birlesik[3] - birlesik[1]
        oran = min(1, KARAKTER3D_YUKSEKLIK / h)
        uc = []
        for i, kare in enumerate(kareler):
            k = kare.crop(birlesik)
            if i < 4:
                uc.append(_namlu_ucu(k) or [0.0, 0.0])
            if oran < 1:
                k = k.resize((max(1, round(w * oran)), max(1, round(h * oran))), Image.LANCZOS)
            anahtar = f'k4-{karakter}-{kostum}-{YONLER[i // 4]}-{i % 4 + 1}'
            k.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
            liste[anahtar] = [k.width, k.height]
        NAMUL_UCU[f'k4-{karakter}-{kostum}'] = uc
        print(f'✓ {ad} (yön karakter)')


# Oyunda bağlı olanlar (timsah, köprü ve oyuncu ruhu kendi animasyonlarını kodla çizer; kare kare paftaları gelince)
KULLANILAN = set(BOYUT) - {'oyuncu-ruh'}  # bot: yardımcı botun resmi (27 Kasım 2026, kalan kod çizimleri)
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
            if f'tema{n}-{tur}' in DOKU_HARIC or yeni_zemin_var(f'tema{n}-{tur}'):
                continue
            hucre = resim.crop((x0 + DOKU_KENAR, DOKU_KENAR, x0 + 512 - DOKU_KENAR, 512 - DOKU_KENAR))
            doku = dikissiz(hucre).resize((DOKU, DOKU), Image.LANCZOS)
            anahtar = f'tema{n}-{tur}'
            doku.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=84, method=6)
            liste[anahtar] = [DOKU, DOKU]
        print(f'✓ T{n} (zemin, su)')



# Hikâye hatıra paftaları (gorsel/hamhikaye/H01–H09, CHATGPT-ISTEMI-HIKAYE.md): hücreler rota sırasıyla ülke 1–51
# (H01 ülke 1–6 … H09 ülke 49–51). Anahtar: hatira-<KOD> (hikaye.js resim varsa emoji yerine bunu gösterir).
HAMHIKAYE = os.path.join(KOK, 'gorsel', 'hamhikaye')
HATIRA_BOYUT = 128


def hatiralar(liste):
    ulkeler = json.load(open(os.path.join(KOK, 'hikaye-taslaklari', 'ulkeler.json')))
    kodlar = [u['kod'] for u in sorted(ulkeler, key=lambda u: u['sira'])]
    for p in range(9):
        if not secili_mi(f'H{p + 1:02d}'):
            continue
        yol = os.path.join(HAMHIKAYE, f'H{p + 1:02d}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'H{p + 1:02d}: boyut {resim.size}, 1536 × 1024 olmalı')
        for i in range(6):
            n = p * 6 + i
            if n >= len(kodlar):
                break
            x0, y0 = (i % 3) * 512, (i // 3) * 512
            hucre = soluklari_sil(resim.crop((x0, y0, x0 + 512, y0 + 512)))
            kutu = hucre.getbbox()
            if not kutu:
                sys.exit(f'H{p + 1:02d} hücre {i + 1} boş')
            hucre = hucre.crop(kutu)
            oran = HATIRA_BOYUT / max(hucre.size)
            if oran < 1:
                hucre = hucre.resize((max(1, round(hucre.width * oran)), max(1, round(hucre.height * oran))), Image.LANCZOS)
            anahtar = f'hatira-{kodlar[n]}'
            hucre.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
            liste[anahtar] = list(hucre.size)

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
    karakterler3d(liste)
    silahlar3d(liste)
    arayuz(liste)
    karakterler_yon(liste)
    karakterler(liste)
    animasyonlar(liste)
    hatiralar(liste)
    # Menü arka planı (A1, 1024 × 1536 dikey, opak): ana menü ve açılış ekranında (style.css), 768 px genişlikte
    yol = os.path.join(HAM, 'A1.png')
    if os.path.exists(yol):
        arka = Image.open(yol).convert('RGB')
        arka = arka.resize((768, round(arka.height * 768 / arka.width)), Image.LANCZOS)
        arka.save(os.path.join(CIKTI, 'menu-arka.webp'), 'WEBP', quality=80, method=6)
        liste['menu-arka'] = [arka.width, arka.height]
        print('✓ A1 (menü arka planı)')
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
        f.write('// Animasyonların gövde kutusu (ilk kare, birleşik kare kutusuna oranla [x, y, w, h])\n')
        f.write('const ANIM_GOVDE = ' + json.dumps(ANIM_GOVDE, ensure_ascii=False, sort_keys=True) + ';\n')
        f.write('// Yön paftalarında yan karelerin namlu ucu (kırpılmış kareye oranla [fx, fy], dört kare)\n')
        f.write('const NAMLU_UCU = ' + json.dumps(NAMUL_UCU, ensure_ascii=False, sort_keys=True) + ';\n')
    toplam = sum(os.path.getsize(os.path.join(CIKTI, f'{k}.webp')) for k in liste)
    print(f'{len(liste)} görsel, {toplam / 1024:.0f} KB')


# Ek paftaların tek hücreleri (gorsel/hamek): anahtar → en uzun kenar (px). K01 animasyondur (ANIMASYON).
EK_PAFTALAR = {
    'K02': [('dere-sus-1', 160), ('dere-sus-2', 160), ('dere-sus-3', 160), ('dere-sus-4', 160), ('dere-sus-5', 160), ('dere-sus-6', 160)],
    'K03': [('bulut-2', 256), ('bulut-3', 256), ('bulut-4', 256), ('simsek-1', 256), ('simsek-2', 256), ('simsek-3', 256)],
    'K05': [('kopru-kapali', 256), None, None, ('kopru-acik', 256), ('kilit', 128), ('kilit-acik', 128)],
    # J07-J11: Dünya Turu aile yolculuk parçaları (CHATGPT-ISTEMI-YOLCULUK.md): yolA-<aile>-kopru-acik / -kopru-kapali / -arena
    'J07': [('yolA-K-kopru-acik', 256), ('yolA-K-kopru-kapali', 256), ('yolA-K-arena', 256), ('yolA-KS-kopru-acik', 256), ('yolA-KS-kopru-kapali', 256), ('yolA-KS-arena', 256)],
    'J08': [('yolA-KP-kopru-acik', 256), ('yolA-KP-kopru-kapali', 256), ('yolA-KP-arena', 256), ('yolA-SH-kopru-acik', 256), ('yolA-SH-kopru-kapali', 256), ('yolA-SH-arena', 256)],
    'J09': [('yolA-SV-kopru-acik', 256), ('yolA-SV-kopru-kapali', 256), ('yolA-SV-arena', 256), ('yolA-GA-kopru-acik', 256), ('yolA-GA-kopru-kapali', 256), ('yolA-GA-arena', 256)],
    'J10': [('yolA-GDA-kopru-acik', 256), ('yolA-GDA-kopru-kapali', 256), ('yolA-GDA-arena', 256), ('yolA-DA-kopru-acik', 256), ('yolA-DA-kopru-kapali', 256), ('yolA-DA-arena', 256)],
    'J11': [('yolA-KA-kopru-acik', 256), ('yolA-KA-kopru-kapali', 256), ('yolA-KA-arena', 256), ('yolA-LA-kopru-acik', 256), ('yolA-LA-kopru-kapali', 256), ('yolA-LA-arena', 256)],
    # J12: ortak parçalar; 1. hücre nehir karosu DOKU_PAFTALARI'nda, 2-6 yolculuk çubuğu simgeleri
    'J12': [None, ('yol-cubuk-baslangic', 128), ('yol-cubuk-kopru', 128), ('yol-cubuk-kilit', 128), ('yol-cubuk-boss', 128), ('yol-cubuk-hayalet', 128)],
    # K13: kilitli köprü yeniden (kullanıcı: görseller yatık duruyor): dik, düz köprü + kilitli kapı; K05 ve J01 3. hücrenin yerine geçer
    # K6 (ham/ klasöründeki eski pafta): yalnız yardımcı bot hücresi --ek ile de kesilebilsin
    'K6': [None, None, None, None, ('bot', 160), None],
    # K15-K16: hâlâ kodla çizilen küçük efektler ve parçalar (CHATGPT-ISTEMI-EK.md; kullanıcı: kalan iş olmasın)
    'K15': [('efekt-gokkusagi', 256), ('efekt-ejder-alev', 256), ('efekt-bot-isin', 256), ('efekt-kasirga', 256), ('efekt-cali-goz', 128), ('timsah-bakis', 192)],
    'K16': [('efekt-pence', 160), ('efekt-toz', 128), ('efekt-olum-pop', 160), ('gol-kopru-tahta', 256), ('efekt-parilti-kucuk', 64), ('ui-can-cubugu', 256)],
    # 5. hücre (yol1-kopru-kapali) artık J01'in yenilenen 3. hücresinden (açık köprüyle aynı çerçeve; 27 Kasım 2026)
    'K13': [('kopru-kapali', 256), None, None, ('kopru-acik', 256), None, None],
    # R01–R02: karakter mermileri (anahtar CHARACTERS: mermi-<karakter>; yön sağa)
    'R01': [('mermi-kinkin', 128), ('mermi-veryi', 128), ('mermi-kornet', 128), ('mermi-mark', 128), ('mermi-kent', 128), ('mermi-ponko', 128)],
    'R02': [('mermi-gul', 128), ('mermi-rani', 128), ('mermi-beti', 128), ('mermi-fanatik', 128), ('mermi-silsen', 128), ('mermi-sercin', 128)],
    # R03: silah mermileri (mermi-<silah>; yesil ve pompali hücrelerinde birden çok saçma var, HUCRE_KIRP / TEK_PARCA ile yalnız biri alınır)
    # ve düşman atışları
    'R03': [('mermi-lazer', 128), ('mermi-yesil', 64), ('mermi-pompali', 64), ('atis-hayalet', 96), ('atis-boss', 128), ('tehlike-halka', 192)],
    # R08–R09: güç aurası (avcının etrafında, ortası boş): guc-imza-<karakter>
    'R08': [('guc-imza-kinkin', 192), ('guc-imza-veryi', 192), ('guc-imza-kornet', 192), ('guc-imza-mark', 192), ('guc-imza-kent', 192), ('guc-imza-ponko', 192)],
    # R09 istemi: 4 çiçek yaprağı (silsen), 5 tüy (sercin), 6 genel mermi izi parıltısı; Fanatik'in (Tornado Tekme) aurası yok
    'R09': [('guc-imza-gul', 192), ('guc-imza-rani', 192), ('guc-imza-beti', 192), ('guc-imza-silsen', 192), ('guc-imza-sercin', 192), ('mermi-iz-parilti', 128)],
    # R10: diken plakası, kalp toplama aurası, yerdeki hatıranın parıltısı (2-4. hücreler lav animasyonu: ANIMASYON)
    'R10': [('diken-plaka', 192), None, None, None, ('kalp-aura', 128), ('hatira-parilti', 160)],
    # R11: engel üstü küçük canlılar (engeller.js ENGEL_CANLI anahtarları; 6-15 px çizilir)
    'R11': [('canli-mum', 64), ('canli-goz', 64), ('canli-parilti', 64), ('canli-buhar', 64), ('canli-alevruhu', 64), ('canli-atesbocegi', 64)],
    # R12–R17: klasik temaların engel parçaları (tema<n>: game.js THEMES sırası). Adlar temadan bağımsız: duvar (duvar parçası),
    # buyuk (büyük obje: kule, ağaç…), obje1, obje2 (iki obje), gol (göl kıyısı), sinir (yatayda dikişsiz sınır şeridi, YATAY_DIKISSIZ)
    'R12': [('tema1-duvar', 256), ('tema1-buyuk', 256), ('tema1-obje1', 256), ('tema1-obje2', 256), ('tema1-gol', 256), ('tema1-sinir', 512)],
    'R13': [('tema2-duvar', 256), ('tema2-buyuk', 256), ('tema2-obje1', 256), ('tema2-obje2', 256), ('tema2-gol', 256), ('tema2-sinir', 512)],
    'R14': [('tema3-duvar', 256), ('tema3-buyuk', 256), ('tema3-obje1', 256), ('tema3-obje2', 256), ('tema3-gol', 256), ('tema3-sinir', 512)],
    'R15': [('tema4-duvar', 256), ('tema4-buyuk', 256), ('tema4-obje1', 256), ('tema4-obje2', 256), ('tema4-gol', 256), ('tema4-sinir', 512)],
    'R16': [('tema5-duvar', 256), ('tema5-buyuk', 256), ('tema5-obje1', 256), ('tema5-obje2', 256), ('tema5-gol', 256), ('tema5-sinir', 512)],
    'R17': [('tema6-duvar', 256), ('tema6-buyuk', 256), ('tema6-obje1', 256), ('tema6-obje2', 256), ('tema6-gol', 256), ('tema6-sinir', 512)],
    # R18–R22: Dünya Turu bölge aileleri (ulkeler.js aile kodu): aile-<KOD>-duvar, -kule, -gol; üst satır 1. aile, alt satır 2. aile
    'R18': [('aile-K-duvar', 256), ('aile-K-kule', 256), ('aile-K-gol', 256), ('aile-KS-duvar', 256), ('aile-KS-kule', 256), ('aile-KS-gol', 256)],
    'R19': [('aile-KP-duvar', 256), ('aile-KP-kule', 256), ('aile-KP-gol', 256), ('aile-SH-duvar', 256), ('aile-SH-kule', 256), ('aile-SH-gol', 256)],
    'R20': [('aile-SV-duvar', 256), ('aile-SV-kule', 256), ('aile-SV-gol', 256), ('aile-GA-duvar', 256), ('aile-GA-kule', 256), ('aile-GA-gol', 256)],
    'R21': [('aile-GDA-duvar', 256), ('aile-GDA-kule', 256), ('aile-GDA-gol', 256), ('aile-DA-duvar', 256), ('aile-DA-kule', 256), ('aile-DA-gol', 256)],
    'R22': [('aile-KA-duvar', 256), ('aile-KA-kule', 256), ('aile-KA-gol', 256), ('aile-LA-duvar', 256), ('aile-LA-kule', 256), ('aile-LA-gol', 256)],
    # R25–R41: ülke objeleri (her ülkeye iki ikonik obje: ulke-<KOD>-1, -2; sıra ve kod CHATGPT-ISTEMI-YENILEME.md'den)
    'R25': [('ulke-TR-1', 256), ('ulke-TR-2', 256), ('ulke-UA-1', 256), ('ulke-UA-2', 256), ('ulke-PL-1', 256), ('ulke-PL-2', 256)],  # peri bacaları; lale bahçesi; ayçiçeği tarlası; saman çatılı beyaz ev; Wawel ejderi; leylek yuvaları
    'R26': [('ulke-DE-1', 256), ('ulke-DE-2', 256), ('ulke-GB-1', 256), ('ulke-GB-2', 256), ('ulke-FR-1', 256), ('ulke-FR-2', 256)],  # guguklu saat evi; yarım ahşap evler; kırmızı telefon kulübeleri; saat kulesi; Eyfel Kulesi; lavanta tarlası
    'R27': [('ulke-IT-1', 256), ('ulke-IT-2', 256), ('ulke-ES-1', 256), ('ulke-ES-2', 256), ('ulke-MA-1', 256), ('ulke-MA-2', 256)],  # Kolezyum; gondollu kanal iskelesi; La Mancha yel değirmenleri; Elhamra'nın Aslanlı Çeşmesi; Şefşavan'ın mavi sokakları; fenerli çarşı tezgâhı
    'R28': [('ulke-DZ-1', 256), ('ulke-DZ-2', 256), ('ulke-CI-1', 256), ('ulke-CI-2', 256), ('ulke-GH-1', 256), ('ulke-GH-2', 256)],  # Sahra kumulları; Tassili n'Ajjer kaya kemerleri; kakao bahçesi; fil ailesi; kente dokuma tezgâhı; Kakum kanopi köprüsü
    'R29': [('ulke-NG-1', 256), ('ulke-NG-2', 256), ('ulke-CD-1', 256), ('ulke-CD-2', 256), ('ulke-AO-1', 256), ('ulke-AO-2', 256)],  # Zuma Kayası; konuşan davullar; okapi ormanı; Kongo Nehri pirogları; Kalandula Şelalesi; welwitschia bitkisi
    'R30': [('ulke-ZA-1', 256), ('ulke-ZA-2', 256), ('ulke-MZ-1', 256), ('ulke-MZ-2', 256), ('ulke-MG-1', 256), ('ulke-MG-2', 256)],  # Masa Dağı; Afrika penguenleri; dau yelkenlileri; kaju ağaçları; Baobab Caddesi; lemurlar
    'R31': [('ulke-TZ-1', 256), ('ulke-TZ-2', 256), ('ulke-UG-1', 256), ('ulke-UG-2', 256), ('ulke-KE-1', 256), ('ulke-KE-2', 256)],  # Kilimanjaro; Zanzibar oyma kapıları; dağ gorilleri; Murchison Şelalesi; zürafalar ve akasya; flamingolu göl
    'R32': [('ulke-ET-1', 256), ('ulke-ET-2', 256), ('ulke-SD-1', 256), ('ulke-SD-2', 256), ('ulke-EG-1', 256), ('ulke-EG-2', 256)],  # Aksum dikili taşları; gelada maymunları; Meroe piramitleri; deve pazarı; Gize piramitleri ve Sfenks; Nil'de feluka yelkenlileri
    'R33': [('ulke-YE-1', 256), ('ulke-YE-2', 256), ('ulke-SA-1', 256), ('ulke-SA-2', 256), ('ulke-PS-1', 256), ('ulke-PS-2', 256)],  # Sokotra ejder kanı ağaçları; Sana'a kule evleri; hurma bahçesi; AlUla Fil Kayası; zeytin bahçesi; Hayat Ağacı mozaiği
    'R34': [('ulke-IQ-1', 256), ('ulke-IQ-2', 256), ('ulke-IR-1', 256), ('ulke-IR-2', 256), ('ulke-UZ-1', 256), ('ulke-UZ-2', 256)],  # kamış mudhif evleri; şenaşil ahşap balkonlar; Siose Pol köprüsü; Yezd rüzgâr kuleleri; İpek Yolu kervanı; kavun pazarı
    'R35': [('ulke-AF-1', 256), ('ulke-AF-2', 256), ('ulke-PK-1', 256), ('ulke-PK-2', 256), ('ulke-IN-1', 256), ('ulke-IN-2', 256)],  # uçurtmalı tepe; nar bahçesi; süslü kamyonlar; Hunza kayısı bahçesi; Hawa Mahal; lotus göleti ve tavus kuşları
    'R36': [('ulke-BD-1', 256), ('ulke-BD-2', 256), ('ulke-MM-1', 256), ('ulke-MM-2', 256), ('ulke-TH-1', 256), ('ulke-TH-2', 256)],  # süslü rikşalar; Sundarbans ve Bengal kaplanı; Inle Gölü balıkçıları; Pathein şemsiyeleri; yüzen pazar; tuk-tuk
    'R37': [('ulke-MY-1', 256), ('ulke-MY-2', 256), ('ulke-ID-1', 256), ('ulke-ID-2', 256), ('ulke-PH-1', 256), ('ulke-PH-2', 256)],  # Petronas İkiz Kuleleri; Rafflesia çiçeği; Komodo ejderleri; pirinç terasları; Çikolata Tepeleri; jeepney
    'R38': [('ulke-VN-1', 256), ('ulke-VN-2', 256), ('ulke-CN-1', 256), ('ulke-CN-2', 256), ('ulke-KR-1', 256), ('ulke-KR-2', 256)],  # Ha Long Körfezi; Hoi An fenerleri; pandalar ve bambu; ejder dansı; hanok evleri; kimçi küpleri
    'R39': [('ulke-JP-1', 256), ('ulke-JP-2', 256), ('ulke-RU-1', 256), ('ulke-RU-2', 256), ('ulke-CA-1', 256), ('ulke-CA-2', 256)],  # kiraz ağaçları; Fuji Dağı; matruşka bebekleri; oymalı ahşap izba; akçaağaç ormanı ve şurup; kunduz barajı
    'R40': [('ulke-US-1', 256), ('ulke-US-2', 256), ('ulke-MX-1', 256), ('ulke-MX-2', 256), ('ulke-CO-1', 256), ('ulke-CO-2', 256)],  # Özgürlük Heykeli; Büyük Kanyon; papel picado süslü pazar; ajolote göleti; Kokora mum palmiyeleri; Cartagena'nın balkonlu evleri
    'R41': [('ulke-PE-1', 256), ('ulke-PE-2', 256), ('ulke-BR-1', 256), ('ulke-BR-2', 256), ('ulke-AR-1', 256), ('ulke-AR-2', 256)],  # Machu Picchu terasları; lamalar; Amazon tukanları ve araları; Şeker Somunu Dağı; Perito Moreno Buzulu; Caminito'nun renkli evleri
    # R42: yağmur çizgisi + sıçrama, suya düşme halkaları (1-3 şelale animasyonu, 6 opak dere suyu dokusu: DOKU_PAFTALARI)
    'R42': [None, None, None, ('yagmur-damla', 128), ('su-halka', 160), None],
    # R43: Dünya Turu pasaport damgası, uçak (yandan / üstten) ve harita simgeleri (kilitli, şimdiki, gezilmiş)
    'R43': [('tur-damga', 192), ('tur-ucak-yan', 192), ('tur-ucak-ust', 192), ('tur-kilit', 96), ('tur-ucak-simge', 96), ('tur-pasaport', 96)],
    # R44: oyun arayüzü: joystick tabanı ve topuzu, fenerli hayalet amblemi, anlatıcı parşömeni, boş defter yuvası, güç yıldızı
    'R44': [('joystick-taban', 192), ('joystick-topuz', 128), ('amblem-hayalet', 192), ('ikon-parsomen', 96), ('ikon-defter-bos', 128), ('ikon-guc-yildiz', 96)],
    # Z02–Z03: engel ve donatı diplerine, yol kenarlarına zemin süsleri (CHATGPT-ISTEMI-ZEMIN.md)
    'Z02': [('sus-cimen', 192), ('sus-kaya', 192), ('sus-cicek', 160), ('sus-cimen-serit', 256), ('sus-cakil', 160), ('sus-yaprak', 192)],
    'Z03': [('sus-basamak', 192), ('sus-tahta-yol', 192), ('sus-su-birikintisi', 192), ('sus-yosun', 192), ('sus-cali', 160), ('sus-mantar', 128)],
    # Z04: patika ayrımlarında tabelalar ve yol kenarı süsleri (CHATGPT-ISTEMI-ZEMIN.md; tabelada yazı yok)
    'Z04': [('tabela-1', 192), ('tabela-2', 192), ('tabela-tas', 160), ('sus-yol-taslari', 256), ('sus-toprak-leke', 192), ('sus-uzun-cimen', 192)],
    'K06': [('donati-fici', 160), ('donati-sandik', 160), ('donati-fener', 192), ('donati-bank', 160), ('donati-tabela', 160), ('donati-saman', 192)],
    'K07': [('donati-cali', 160), ('donati-ciceklik', 160), ('donati-mantar', 128), ('donati-kutuk', 160), ('donati-tas', 160), ('donati-yaprak', 160)],
    'K08': [('donati-balkabagi', 128), ('donati-araba', 192), ('donati-cit', 160), ('donati-korkuluk', 192), ('donati-mum', 128), ('donati-orumcek', 160)],
    'K10': [('silah-yildiz', 192), ('silah-ejder', 192), ('silah-gokkusagi', 192), None, None, None],
    'K11': [None, None, None, ('efsane-rozet', 128), ('efsane-sandik', 192), ('efsane-parilti', 192)],
    'R47': [('menu-amblem', 256), ('menu-kaide', 256), ('menu-spot', 256), ('menu-dugme-yesil', 256), ('menu-dugme-mor', 256), ('menu-dugme-turuncu', 256)],
    'R49': [('menu-dugme-camgobegi', 256), ('menu-dugme-cam', 192), ('menu-sayac', 192), ('menu-konfeti', 192), ('menu-parilti', 128), ('menu-bakan', 192)],
    'R50': [('kutlama-serit', 256), None, None, None, ('gecit-kapali', 256), ('gecit-acik', 256)],
    'R48': [None, None, None, ('menu-kayan', 192), ('menu-yarasa', 128), ('menu-fener', 128)],
    'K04': [('yuva-mezarlik', 256), ('yuva-magara', 256), ('yuva-izbe', 256), ('yuva-kovuk', 256), ('yuva-kuyu', 256), ('yuva-kripta', 256)],
}



# Fırtına bulutları gri-kara olmalı (kullanıcı: "önceki gibi gri kara renkli olsun, böyle çok renkli değil"): K03'ün mor bulutları
# parlaklığına göre arduvaz griye boyanır; bulut-4'ün çizili damlaları silinir (yağmur kodla, canlı çizilir).
GRI_BULUT = {'bulut-2', 'bulut-3', 'bulut-4'}


def bulutu_grile(hucre, damla_sil):
    px = hucre.load()
    w, h = hucre.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not a:
                continue
            if damla_sil and g > r + 60 and b > r + 80:  # mavi-camgöbeği damla (mor bulutta g < r)
                px[x, y] = (0, 0, 0, 0)
                continue
            l = (0.3 * r + 0.59 * g + 0.11 * b) / 255
            # kara arduvaz (#2c313d) → orta gri (#868c9a), hafif mavi ton
            px[x, y] = (round(44 + l * 90), round(49 + l * 90), round(61 + l * 90), a)
    if damla_sil:
        hucre = en_buyuk_parca(hucre)  # damla kalıntıları (kenar pikselleri) gövdeden ayrık: yalnız bulut kalır
    kutu = hucre.getbbox()
    return hucre.crop(kutu) if kutu else hucre

# Arka planı saydam yerine hafif gri pusla gelen paftalar: belirgin nesneden (alfa ≥ 150) ~7 px'ten uzak pus silinir
PUS_PAFTALAR = {'R49', 'K07', 'R28'}
# Hücrede aynı nesneden birkaç tane var, oyun her birini ayrı çizer: yalnız en büyük parça kesilir
# Yeniden üretilen paftalar: diskte varsa aynı adlı resimleri ve animasyonları eski paftalar yazmaz
YERINE_GECEN = {'K13': {'kopru-kapali', 'kopru-acik', 'kopru-in'}}


def yerine_gecildi(anahtar, pafta):
    """Anahtar (resim ya da animasyon adı), diskte bulunan daha yeni bir paftada üretiliyorsa True (pafta o pafta değilse)."""
    for yeni, adlar in YERINE_GECEN.items():
        if yeni != pafta and anahtar in adlar and os.path.exists(os.path.join(HAMEK, f'{yeni}.png')):
            return True
    return False


TEK_PARCA = {'mermi-pompali', 'mermi-yesil', 'tema6-gol', 'tema1-gol'}
# Parıltısı komşusuna değen nesneler: hücre içinde elle kırpılır (x0, y0, x1, y1; sütun yoğunluğunun en düşük yerinden)
YATAY_DIKISSIZ = {f'tema{n}-sinir' for n in range(1, 7)}  # yan yana döşenen sınır şeritleri
HUCRE_KIRP = {'mermi-yesil': (0, 0, 297, 512)}


# Pusu koyu ve nesneye yapışık gelen paftalar: dar kenar payı (≈2 px) ve yüksek eşik (alfa < 90 silinir), hale kalmasın
PUS_GUCLU = {'R28'}


def pusu_sil(hucre, guclu=False):
    from PIL import ImageChops, ImageFilter
    a = hucre.getchannel('A')
    esik, pay, alt = (200, 5, 90) if guclu else (150, 15, 30)
    yakin = a.point(lambda v: 255 if v >= esik else 0).filter(ImageFilter.MaxFilter(pay))
    hucre = hucre.copy()
    hucre.putalpha(ImageChops.multiply(a, yakin).point(lambda v: 0 if v < alt else v))
    return hucre


def kenar_temizle(hucre, pay=6):
    """Yolculuk paftalarında hücre sınırında ChatGPT'nin bıraktığı 1-2 px ızgara çizgisi: hücrenin dış pay'ı saydam yapılır
    (parçaların payı istemde ≥ 27 px, nesneye dokunmaz)."""
    hucre = hucre.copy()
    w, h = hucre.size
    bos = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    maske = Image.new('L', (w, h), 255)
    maske.paste(0, (pay, pay, w - pay, h - pay))
    hucre.paste(bos, (0, 0), maske)
    return hucre


def kirinti_sil(hucre, oran=0.003):
    """Yolculuk hücrelerinde komşu hücreden taşan küçük kopuk parçalar (birkaç düzine piksel) silinir: 8-komşulu bileşenlerden
    alanı toplam opak alanın oran'ından küçük olanlar saydam yapılır (kristal, çiçek gibi gerçek süsler bundan büyüktür)."""
    import numpy as np
    from scipy import ndimage
    a = np.asarray(hucre.getchannel('A'))
    etiket, n = ndimage.label(a > 40, structure=np.ones((3, 3)))
    if n < 2:
        return hucre
    alan = ndimage.sum(np.ones_like(a), etiket, range(1, n + 1))
    kucuk = [i + 1 for i, v in enumerate(alan) if v < alan.sum() * oran]
    if not kucuk:
        return hucre
    sil = ndimage.binary_dilation(np.isin(etiket, kucuk), iterations=2)
    yeni = a.copy(); yeni[sil] = 0
    hucre = hucre.copy(); hucre.putalpha(Image.fromarray(yeni))
    return hucre


def ek_hucreler(liste):
    for pafta, hucreler in EK_PAFTALAR.items():
        if not secili_mi(pafta):
            continue
        yol = os.path.join(HAMEK, f'{pafta}.png')
        if not os.path.exists(yol):
            yol = os.path.join(HAMYENI, f'{pafta}.png')  # R paftaları (CHATGPT-ISTEMI-YENILEME.md)
        if not os.path.exists(yol):
            yol = os.path.join(HAMZEMIN, f'{pafta}.png')  # Z paftaları (CHATGPT-ISTEMI-ZEMIN.md)
        if not os.path.exists(yol):
            yol = os.path.join(HAMYOL, f'{pafta}.png')  # J07-J12 (CHATGPT-ISTEMI-YOLCULUK.md)
        if not os.path.exists(yol):
            yol = os.path.join(HAM, f'{pafta}.png')  # eski ana paftalar (K6 bot)
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'{pafta}: boyut {resim.size}, 1536 × 1024 olmalı')
        for i, hc in enumerate(hucreler):
            if not hc:
                continue
            anahtar, en = hc
            if yerine_gecildi(anahtar, pafta):
                continue
            x0, y0 = (i % 3) * 512, (i // 3) * 512
            hucre = soluklari_sil(resim.crop((x0, y0, x0 + 512, y0 + 512)))
            if yol.startswith(HAMYOL):
                hucre = kirinti_sil(pusu_sil(kenar_temizle(hucre), True))  # J07-J11: kulelerin üstünde soluk hale kalıyordu (alfa ~50)
            if anahtar in HUCRE_KIRP:
                hucre = hucre.crop(HUCRE_KIRP[anahtar])
            if anahtar in TEK_PARCA:
                hucre = en_buyuk_parca(hucre)
            if pafta in PUS_PAFTALAR:
                hucre = pusu_sil(hucre, pafta in PUS_GUCLU)
            kutu = hucre.getbbox()
            if not kutu:
                sys.exit(f'{pafta} hücre {i + 1} ({anahtar}) boş')
            hucre = hucre.crop(kutu)
            if anahtar in YATAY_DIKISSIZ:
                hucre = donem_kirp(hucre)
            if anahtar in GRI_BULUT:
                hucre = bulutu_grile(hucre, anahtar == 'bulut-4')
            oran = en / max(hucre.size)
            if oran < 1:
                hucre = hucre.resize((max(1, round(hucre.width * oran)), max(1, round(hucre.height * oran))), Image.LANCZOS)
            hucre.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
            liste[anahtar] = [hucre.width, hucre.height]
        print(f'✓ {pafta}')


# Yolculuk paftaları (gorsel/hamyol, CHATGPT-ISTEMI-YOLCULUK.md): J01–J06 normal oyunun 6 teması (tema sırası game.js THEMES).
# Hücre 1 opak, dikeyde dikişsiz nehir dokusu; öbürleri saydam (pusla gelir, pusu_sil). Anahtar: yol<tema>-<parça>.
YOL_HUCRELER = [('nehir', 256), ('kopru-acik', 256), ('kopru-kapali', 256), ('arena', 256), ('tabela', 160), ('bayrak', 128)]


def dikissiz_dikey(im, k=48):
    """ChatGPT'nin "dikişsiz" dokusu tam dikişsiz gelmez: alt k satır üst k satırla yumuşak geçişle karıştırılıp kesilir
    (çıktının son satırı ilk satırına komşu olur, dikeyde döşenince dikiş görünmez)."""
    w, h = im.size
    out = im.crop((0, 0, w, h - k))
    for y in range(k):
        t = (y + 0.5) / k
        satir = Image.blend(im.crop((0, h - k + y, w, h - k + y + 1)), im.crop((0, y, w, y + 1)), t)
        out.paste(satir, (0, y))
    return out


def donem_kirp(im):
    """Yan yana döşenecek şerit: desenin tekrar aralığı (sütun benzerliğiyle) bulunur, şerit tam sayıda aralıktan kesilir;
    sağ uç sol uca kendiliğinden oturur (geçişli karıştırma kemer gibi belirgin desende hayalet çift görüntü bırakıyor)."""
    import numpy as np
    a = np.asarray(im.convert('RGBA'), dtype=np.float32)
    w = a.shape[1]
    pay = max(4, w // 20)
    en_iyi = None
    for p in range(max(16, w // 10), w // 2):
        fark = np.abs(a[:, pay:w - pay - p] - a[:, pay + p:w - pay]).mean()
        if en_iyi is None or fark < en_iyi[0] - 1e-6:
            en_iyi = (fark, p)
    p = en_iyi[1]
    n = max(1, (w - 2 * pay) // p)
    serit = im.crop((pay, 0, pay + n * p + 6, im.height))
    # ek yerindeki küçük renk sıçraması için 6 px geçiş (dönem kesiminden sonra çift görüntü bırakmaz)
    return dikissiz_dikey(serit.transpose(Image.ROTATE_90), 6).transpose(Image.ROTATE_270)


# Opak döşeme dokuları (gorsel/hamyeni): anahtar → (yön); 'iki' her yönde, 'dikey' yalnız alt-üst dikişsiz. Tam hücre alınır,
# dikissiz_dikey ile önce dikey, sonra (90° çevrilerek) yatay ek yeri giderilir, 256 px kareye indirilir.
DOKU_PAFTALARI = {
    'R23': [('aile-K-zemin', 'iki'), ('aile-KS-zemin', 'iki'), ('aile-KP-zemin', 'iki'), ('aile-SH-zemin', 'iki'),
            ('aile-SV-zemin', 'iki'), ('doku-kaplica', 'iki')],
    'R24': [('aile-GA-zemin', 'iki'), ('aile-GDA-zemin', 'iki'), ('aile-DA-zemin', 'iki'), ('aile-KA-zemin', 'iki'),
            ('aile-LA-zemin', 'iki'), ('nehir-doku', 'dikey')],
    'R42': [None, None, None, None, None, ('dere-su', 'iki')],
    'J12': [('yol-nehir-ortak', 'dikey'), None, None, None, None, None],
    # Z01: zemin katmanı dokuları (yollar ve alan lekeleri; CHATGPT-ISTEMI-ZEMIN.md)
    'Z01': [('zemin-yol-toprak', 'iki'), ('zemin-yol-tas', 'iki'), ('zemin-cimen', 'iki'), ('zemin-kuru', 'iki'),
            ('zemin-kum', 'iki'), ('zemin-yosunlu-tas', 'iki')],
    # Z05–Z07: üç çeyrek açılı, ışığı işlenmiş el boyaması zeminler (kullanıcı, 26 Kasım 2026). Diskte varsa eski kaynakların
    # (tema paftaları, R23/R24) aynı adlı zeminlerinin yerine geçer: bkz. yeni_zemin_var.
    'Z05': [(f'tema{n}-zemin', 'iki') for n in range(1, 7)],
    # Hücre → aile, ailenin karakterine göre (ulke-aileleri.js ULKE_AILELERI): K Avrupa çayır, KS Anadolu/Ortadoğu taşlı yamaç,
    # SV savan kuru bozkır, KP Kuzey Afrika çölü, SH Sahel kızıl toprak, GA Güney Asya tropik toprak; LA Latin Amerika nemli
    # yeşil, DA Doğu Asya dağ kayası, GDA Güneydoğu Asya teras yeşili, KA Kuzey Amerika orman tabanı (iğne yaprak)
    'Z06': [('aile-K-zemin', 'iki'), ('aile-KS-zemin', 'iki'), ('aile-SV-zemin', 'iki'), ('aile-KP-zemin', 'iki'),
            ('aile-SH-zemin', 'iki'), ('aile-GA-zemin', 'iki')],
    'Z07': [('aile-LA-zemin', 'iki'), ('aile-DA-zemin', 'iki'), ('zemin-kiragi', 'iki'), ('aile-GDA-zemin', 'iki'),
            ('aile-KA-zemin', 'iki'), ('zemin-catlak-tas', 'iki')],
}
YENI_ZEMIN_PAFTALARI = ('Z05', 'Z06', 'Z07')
# Z08-Z23: TEK PARÇA kaotik zemin dokuları (kullanıcı: "zemin görselleri çok fazla kendini tekrar ediyor, daha kaotik
# olmalı"; hamzemin/DURUM.md). Bütün resim alınır, iki yönde dikişsiz yapılır, 768 px'e indirilir; oyunda 768 birimde
# döşenir (gorsel.js zeminBirimi). Diskte varsa Z05-Z07 ve eski kaynakların aynı adlı zeminlerinin yerine geçer.
TEK_DOKU = {f'Z{8 + i:02d}': f'tema{i + 1}-zemin' for i in range(6)}
TEK_DOKU.update({f'Z{14 + i:02d}': f'aile-{a}-zemin' for i, a in enumerate(['K', 'KS', 'KP', 'SH', 'SV', 'GA', 'GDA', 'DA', 'KA', 'LA'])})
TEK_DOKU_BOY = 768
TEMA_ZEMIN_HEDEF = (68, 18)  # Z05 tema zeminleri: koyu denge ama boyamanın ayrıntısı korunur (sapma 10'da desen düzleşiyordu)
KATMAN_HEDEF = (80, 16)  # Z01 yol ve leke dokuları: koyu tema zemininde (35) seçilir ama göz almaz; ayrıntı korunur


def tek_doku_var(anahtar):
    """Anahtar, diskte bulunan tek parça bir Z08–Z23 dokusunda kesiliyorsa True."""
    return any(k == anahtar and os.path.exists(os.path.join(HAMZEMIN, f'{p}.png')) for p, k in TEK_DOKU.items())


def yeni_zemin_var(anahtar):
    """Anahtar, diskte bulunan bir Z05–Z07 paftasında ya da tek parça Z08–Z23 dokusunda kesiliyorsa True: eski kaynak bu
    zemini yazmaz."""
    if tek_doku_var(anahtar):
        return True
    for pafta in YENI_ZEMIN_PAFTALARI:
        if any(hc and hc[0] == anahtar for hc in DOKU_PAFTALARI[pafta]) and \
                os.path.exists(os.path.join(HAMZEMIN, f'{pafta}.png')):
            return True
    return False
# Dünya Turu zeminleri ChatGPT'den parlak (120-180) ve çok desenli (sapma 12-29) geliyor; oyunun renk dengesi koyu zemine
# kurulu (klasik temalar 35 / 5-10). Her aile zemini rengini koruyarak bu parlaklığa ve en çok bu desen sapmasına çekilir.
ZEMIN_HEDEF = (95, 9)  # (ortalama parlaklık, en büyük parlaklık sapması), 0-255


def zemin_sakinlestir(im, hedef=None):
    """Zemin dokusunu ZEMIN_HEDEF'e çeker: desen sapması (parlaklık) en çok hedef kadar, ortalama parlaklık hedefte; renk tonu korunur."""
    import numpy as np
    a = np.asarray(im.convert('RGB'), dtype=np.float32)
    lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    m, sd = float(lum.mean()), float(lum.std()) or 1.0
    hedef_m, hedef_sd = hedef or ZEMIN_HEDEF
    k = min(1.0, hedef_sd / sd)
    ort = a.reshape(-1, 3).mean(axis=0)
    a = ort + (a - ort) * k            # deseni sakinleştir (ortalama renge yaklaştır)
    a = a * (hedef_m / max(1.0, m))    # parlaklığı hedefe çek (ton ve doygunluk oranı korunur)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def doku_hucreleri(liste):
    for pafta, hucreler in DOKU_PAFTALARI.items():
        if not secili_mi(pafta):
            continue
        yol = os.path.join(HAMYENI, f'{pafta}.png')
        if not os.path.exists(yol):
            yol = os.path.join(HAMZEMIN, f'{pafta}.png')
        if not os.path.exists(yol):
            yol = os.path.join(HAMYOL, f'{pafta}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGB')
        if resim.size != (1536, 1024):
            sys.exit(f'{pafta}: boyut {resim.size}, 1536 × 1024 olmalı')
        for i, hc in enumerate(hucreler):
            if not hc:
                continue
            anahtar, yon = hc
            if (pafta not in YENI_ZEMIN_PAFTALARI and yeni_zemin_var(anahtar)) or tek_doku_var(anahtar):
                continue
            x0, y0 = (i % 3) * 512, (i // 3) * 512
            hucre = dikissiz_dikey(resim.crop((x0, y0, x0 + 512, y0 + 512)))
            if yon == 'iki':
                hucre = dikissiz_dikey(hucre.transpose(Image.ROTATE_90)).transpose(Image.ROTATE_270)
            boy = DOKU if anahtar.startswith('tema') else 256  # tema zeminleri eskisi gibi 512 px (oyunda 256 birim)
            hucre = hucre.resize((boy, boy), Image.LANCZOS)
            if anahtar.startswith('aile-') and anahtar.endswith('-zemin'):
                hucre = zemin_sakinlestir(hucre)
            elif anahtar.startswith('tema') and anahtar.endswith('-zemin'):
                hucre = zemin_sakinlestir(hucre, TEMA_ZEMIN_HEDEF)
            elif anahtar.startswith('zemin-'):
                hucre = zemin_sakinlestir(hucre, KATMAN_HEDEF)
            hucre.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=86, method=6)
            liste[anahtar] = [boy, boy]
        print(f'✓ {pafta} (doku)')


def tek_dokular(liste):
    for pafta, anahtar in TEK_DOKU.items():
        if not secili_mi(pafta):
            continue
        yol = os.path.join(HAMZEMIN, f'{pafta}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGB')
        k = min(resim.size)
        resim = resim.crop(((resim.width - k) // 2, (resim.height - k) // 2, (resim.width - k) // 2 + k, (resim.height - k) // 2 + k))
        doku = dikissiz_dikey(resim, 64)
        doku = dikissiz_dikey(doku.transpose(Image.ROTATE_90), 64).transpose(Image.ROTATE_270)
        doku = doku.resize((TEK_DOKU_BOY, TEK_DOKU_BOY), Image.LANCZOS)
        doku = zemin_sakinlestir(doku, TEMA_ZEMIN_HEDEF if anahtar.startswith('tema') else ZEMIN_HEDEF)
        doku.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=84, method=6)
        liste[anahtar] = [TEK_DOKU_BOY, TEK_DOKU_BOY]
        print(f'✓ {pafta} (tek doku: {anahtar})')


def yol_hucreleri(liste):
    for n in range(1, 7):
        if not secili_mi(f'J{n:02d}'):
            continue
        yol = os.path.join(HAMYOL, f'J{n:02d}.png')
        if not os.path.exists(yol):
            continue
        resim = Image.open(yol).convert('RGBA')
        if resim.size != (1536, 1024):
            sys.exit(f'J{n:02d}: boyut {resim.size}, 1536 × 1024 olmalı')
        for i, (parca, en) in enumerate(YOL_HUCRELER):
            x0, y0 = (i % 3) * 512, (i // 3) * 512
            hucre = resim.crop((x0, y0, x0 + 512, y0 + 512))
            if parca == 'nehir':
                hucre = dikissiz_dikey(hucre.convert('RGB')).resize((en, en), Image.LANCZOS)
            else:
                hucre = kirinti_sil(pusu_sil(soluklari_sil(kenar_temizle(hucre))))
                kutu = hucre.getbbox()
                if not kutu:
                    sys.exit(f'J{n:02d} hücre {i + 1} ({parca}) boş')
                hucre = hucre.crop(kutu)
                oran = en / max(hucre.size)
                if oran < 1:
                    hucre = hucre.resize((max(1, round(hucre.width * oran)), max(1, round(hucre.height * oran))), Image.LANCZOS)
            anahtar = f'yol{n}-{parca}'
            if yerine_gecildi(anahtar, f'J{n:02d}'):
                continue
            hucre.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=88, method=6)
            liste[anahtar] = [hucre.width, hucre.height]
        print(f'✓ J{n:02d} (yol{n})')


def ek_kes():
    """Yalnız ek paftaları (K01–K04) ve hatıraları (H01–H09) keser; öbür görsellere dokunmaz, liste.js'e ekler.
    Kullanım: python3 hayalet-avcilari/araclar/gorsel_kes.py --ek [PAFTA …]  (pafta verilirse yalnız onlar kesilir)"""
    import re
    metin = open(os.path.join(CIKTI, 'liste.js'), encoding='utf-8').read()
    al = lambda ad: json.loads(re.search(r'const ' + ad + r' = (\{.*?\});', metin, re.S).group(1))
    liste, govde, namlu = al('GORSEL_LISTESI'), al('ANIM_GOVDE'), al('NAMLU_UCU')
    eski_anim = dict(ANIMASYON)
    # K/R animasyonları her zaman; öbürleri (N…) yalnız adıyla seçilince (--ek N14): bütün N kesimi uzun sürer
    ANIMASYON.clear(); ANIMASYON.update({k: v for k, v in eski_anim.items() if k[0] in 'KR' or (SECILI and k in SECILI)})
    animasyonlar(liste)
    ANIMASYON.clear(); ANIMASYON.update(eski_anim)
    ek_hucreler(liste)
    yol_hucreleri(liste)
    doku_hucreleri(liste)
    tek_dokular(liste)
    hatiralar(liste)
    # K09: opak tek resim (Yakında önizlemesi), 768 px genişlik
    yol = os.path.join(HAMEK, 'K09.png')
    if secili_mi('K09') and os.path.exists(yol):
        r9 = Image.open(yol).convert('RGB')
        r9 = r9.resize((768, round(r9.height * 768 / r9.width)), Image.LANCZOS)
        r9.save(os.path.join(CIKTI, 'yakinda-pamukkale.webp'), 'WEBP', quality=82, method=6)
        liste['yakinda-pamukkale'] = [r9.width, r9.height]
        print('✓ K09 (yakında: Pamukkale)')
    # R45-R46: opak dikey ekran arka planları (menü ekranları; çevrimiçi/arkadaş ekranları), 768 × 1152
    for pafta, anahtar in (('R45', 'arka-gece'), ('R46', 'arka-kasaba')):
        yol = os.path.join(HAMYENI, f'{pafta}.png')
        if secili_mi(pafta) and os.path.exists(yol):
            ra = Image.open(yol).convert('RGB').resize((768, 1152), Image.LANCZOS)
            ra.save(os.path.join(CIKTI, f'{anahtar}.webp'), 'WEBP', quality=80, method=6)
            liste[anahtar] = [768, 1152]
            print(f'✓ {pafta} (arka plan: {anahtar})')
    govde.update(ANIM_GOVDE)
    with open(os.path.join(CIKTI, 'liste.js'), 'w', encoding='utf-8') as f:
        f.write('// Üretilen dosya: araclar/gorsel_kes.py. Elle düzenleme.\n')
        f.write('// ChatGPT paftalarından kesilen görseller: anahtar → [genişlik, yükseklik] (px)\n')
        f.write('const GORSEL_LISTESI = ' + json.dumps(liste, ensure_ascii=False, indent=0, sort_keys=True).replace('\n', ' ') + ';\n')
        f.write('// Animasyonların gövde kutusu (ilk kare, birleşik kare kutusuna oranla [x, y, w, h])\n')
        f.write('const ANIM_GOVDE = ' + json.dumps(govde, ensure_ascii=False, sort_keys=True) + ';\n')
        f.write('// Yön paftalarında yan karelerin namlu ucu (kırpılmış kareye oranla [fx, fy], dört kare)\n')
        f.write('const NAMLU_UCU = ' + json.dumps(namlu, ensure_ascii=False, sort_keys=True) + ';\n')
    print(f'{len(liste)} görsel (ek kesim)')


if __name__ == '__main__':
    if '--ek' in sys.argv:
        SECILI.update(a for a in sys.argv[sys.argv.index('--ek') + 1:] if not a.startswith('-'))
        ek_kes()
    else:
        kes()
