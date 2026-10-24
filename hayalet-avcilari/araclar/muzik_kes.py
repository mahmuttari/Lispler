#!/usr/bin/env python3
"""Hayalet Avcıları — Dünya Turu müzik kesim hattı (3.14.0)

Suno'nun (sunoapi.org) bir istekte verdiği iki parçayı ölçer, birini seçer ve oyunun iki dosyasını üretir:
  www/muzik/<KOD>-dongu.ogg  27–34 sn'lik, ek yeri duyulmayan döngü (dosyanın başında ve sonunda 0,1 sn pay)
  www/muzik/<KOD>-giris.ogg  ~5 sn'lik teaser: parçanın en canlı ~4 sn'si ve 1,2 sn sönüş
Ölçümler araclar/muzik-kayit.json'a, oyunun okuduğu kesim değerleri www/ulke-muzikleri.js'e yazılır.
Yöntem: docs/superpowers/specs/2026-10-24-hayalet-ulke-muzikleri-design.md §5. Yalnız numpy + ffmpeg.

  python3 hayalet-avcilari/araclar/muzik_kes.py --sina
  python3 hayalet-avcilari/araclar/muzik_kes.py olc <mp3>…
  python3 hayalet-avcilari/araclar/muzik_kes.py isle --kod KOD --gorev GÖREV [--kredi KALAN] [--sec 1|2]
        [--dinleme KLASÖR] [--kok KÖK] <parça-1.mp3> [<parça-2.mp3>]
  python3 hayalet-avcilari/araclar/muzik_kes.py yaz [--kok KÖK]
"""
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile

import numpy as np

KOK = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))  # hayalet-avcilari/
SR_COZ, SR = 22050, 48000           # çözümleme ve çıktı örnekleme hızı
HOP, PENCERE = 512, 2048            # çözümleme karesi
ON_PAY = SON_PAY = 0.1              # sn: çözücünün eklediği ya da kırptığı örneklere karşı pay (ek spec §5.7)
GECIS, KORUMA = 0.25, 0.06          # sn: ek yerindeki çapraz geçiş ve koruma
DONGU_EN_AZ, DONGU_EN_COK = 27.0, 34.0
GIRIS_DISI, SON_DISI = 10.0, 15.0   # parçanın girişi ve bitişi döngüye ve teaser'a girmez
TEASER_HEDEF, TEASER_SONUS, TEASER_ACILIS = 4.0, 1.2, 0.02
LUFS_HEDEF = -18.0
TEPE_SINIR = -2.0                   # dBTP; spec −1,5'i aşmamayı ister, Opus'un taşmasına 0,5 dB pay
OPUS_KBPS = 48                      # kısıtlı değişken bit hızı: 51 ülke ≈ 11 MB (bütçe 14 MB)
HEDEF_TEMPO = 128.0


# ---------------------------------------------------------------- ses okuma ve yazma
def coz(dosya, sr=SR, kanal=2):
    ham = subprocess.run(['ffmpeg', '-v', 'error', '-i', dosya, '-ac', str(kanal), '-ar', str(sr), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(ham, np.float32).copy()
    return x.reshape(-1, kanal) if kanal > 1 else x


def kodla(x, yol, kbps=OPUS_KBPS):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'libopus', '-b:a', f'{kbps}k', '-vbr', 'constrained', '-application', 'audio', yol],
                   input=np.ascontiguousarray(x, np.float32).tobytes(), check=True)


def mp3_yaz(x, yol):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', '192k', yol], input=np.ascontiguousarray(x, np.float32).tobytes(), check=True)


def ses_duzeyi(x):
    """EBU R128 tümleşik ses düzeyi (LUFS) ve gerçek tepe (dBTP)."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                        '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       input=np.ascontiguousarray(x, np.float32).tobytes(), capture_output=True, check=True)
    metin = r.stderr.decode('utf-8', 'replace')
    ozet = metin[metin.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+|-inf) LUFS', ozet)
    p = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', ozet)
    sayi = lambda m: -120.0 if (m is None or 'inf' in m.group(1)) else float(m.group(1))
    return sayi(i), sayi(p)


def sinirla(x, tavan_db):
    """Yumuşak sınırlayıcı (ffmpeg alimiter; kendiliğinden düzey kapalı, gecikme dengeli: örnekler kaymaz)."""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                        '-af', f'alimiter=limit={10 ** (tavan_db / 20):.5f}:attack=5:release=60:level=false:latency=true',
                        '-f', 'f32le', '-'], input=np.ascontiguousarray(x, np.float32).tobytes(), capture_output=True, check=True)
    y = np.frombuffer(r.stdout, np.float32).copy().reshape(-1, 2)
    if len(y) < len(x):
        y = np.concatenate([y, np.zeros((len(x) - len(y), 2), np.float32)])
    return y[:len(x)]


# ---------------------------------------------------------------- çözümleme
def spektrum(x):
    pencere = np.hanning(PENCERE).astype(np.float32)
    if len(x) < PENCERE * 4:
        raise ValueError('parça çok kısa')
    kare = np.lib.stride_tricks.sliding_window_view(x, PENCERE)[::HOP] * pencere
    return np.abs(np.fft.rfft(kare, axis=1)).astype(np.float32)


def kare_zamani(i):
    return (i * HOP + PENCERE / 2) / SR_COZ


def aki(S):
    """Spektral akı (başlangıç gücü), ortalaması çıkarılmış."""
    L = np.log1p(S * 20.0)
    d = np.maximum(np.diff(L, axis=0), 0).sum(1)
    d = np.concatenate([[0.0], d])
    yerel = np.convolve(d, np.ones(16) / 16, 'same')
    return np.maximum(d - yerel, 0)


def tempo_bul(env, fps):
    """Öz ilintiden 70–180 vuruş/dk; oktav hatasına karşı 128 çevresinde log-normal ağırlık."""
    e = env - env.mean()
    n = len(e)
    f = np.fft.rfft(e, 2 * n)
    ac = np.fft.irfft(f * np.conj(f))[:n]
    lag = np.arange(n, dtype=float)
    bpm = 60.0 * fps / np.maximum(lag, 1)
    m = (bpm >= 70) & (bpm <= 180)
    agirlik = np.exp(-0.5 * (np.log2(bpm[m] / HEDEF_TEMPO) / 0.9) ** 2)
    j = int(np.argmax(ac[m] * agirlik))
    L = lag[m][j]
    i = int(L)
    if 1 <= i < n - 1:
        y0, y1, y2 = ac[i - 1], ac[i], ac[i + 1]
        bol = y0 - 2 * y1 + y2
        if bol != 0:
            L = i + 0.5 * (y0 - y2) / bol
    return 60.0 * fps / L


def vurus_izle(env, fps, bpm, siki=100.0):
    """Dinamik programlamayla vuruş kareleri (Ellis 2007)."""
    p = 60.0 * fps / bpm
    n = len(env)
    o = env / (env.std() + 1e-9)
    C = o.astype(float).copy()
    geri = -np.ones(n, int)
    lo, hi = max(1, int(round(p / 2))), int(round(2 * p))
    taus = np.arange(lo, hi + 1)
    ceza = -siki * np.log(taus / p) ** 2
    for t in range(hi, n):
        onceki = C[t - taus] + ceza
        j = int(np.argmax(onceki))
        C[t] += onceki[j]
        geri[t] = t - taus[j]
    son = max(1, int(round(p)))
    t = int(np.argmax(C[n - son:]) + n - son)
    b = []
    while t >= 0:
        b.append(t)
        t = geri[t]
    return np.array(b[::-1], int)


def ince_vurus(xm, sr, t, ara=0.035):
    """Vuruş zamanını örnek düzeyinde atağın başına çeker (±ara sn içinde 2 ms'lik zarfın en hızlı yükselişi)."""
    a = max(0, int((t - ara) * sr))
    b = min(len(xm), int((t + ara) * sr))
    if b - a < 16:
        return t
    h = max(1, int(0.002 * sr))
    zarf = np.convolve(np.abs(xm[a:b]), np.ones(h) / h, 'same')
    return (a + int(np.argmax(np.diff(zarf)))) / sr


def ozellikler(S):
    """Kare başına 12 perde sınıfı ve 24 bantlı log enerji (ek yeri benzerliği için)."""
    f = np.fft.rfftfreq(PENCERE, 1 / SR_COZ)
    g = (f >= 100) & (f <= 4000)
    sinif = (np.round(12 * np.log2(f[g] / 440.0)) % 12).astype(int)
    Sg = S[:, g]
    C = np.stack([Sg[:, sinif == k].sum(1) for k in range(12)], 1)
    C = C / (np.linalg.norm(C, axis=1, keepdims=True) + 1e-9)
    sinirlar = np.geomspace(60, 10000, 25)
    B = np.stack([S[:, (f >= a) & (f < b)].sum(1) for a, b in zip(sinirlar[:-1], sinirlar[1:])], 1)
    B = np.log1p(B)
    B = B / (B.max() + 1e-9)
    return np.concatenate([C, B], 1)


def benzerlik(F, ia, ib, w):
    A, B = F[ia - w:ia + w], F[ib - w:ib + w]
    if len(A) != len(B) or len(A) == 0:
        return 0.0
    pay = (A * B).sum(1)
    payda = np.linalg.norm(A, axis=1) * np.linalg.norm(B, axis=1) + 1e-9
    return float((pay / payda).mean())


def parca_olc(dosya):
    """Bir parçanın tempo, vuruş, döngü ve teaser ölçümü."""
    xs = coz(dosya, SR, 2)
    xm48 = xs.mean(1)
    xa = coz(dosya, SR_COZ, 1)
    sure = len(xs) / SR
    S = spektrum(xa)
    env = aki(S)
    fps = SR_COZ / HOP
    bpm0 = tempo_bul(env, fps)
    kareler = vurus_izle(env, fps, bpm0)
    zaman = np.array([kare_zamani(i) for i in kareler])
    zaman = zaman[(zaman > 1.0) & (zaman < sure - 1.0)]
    F = ozellikler(S)
    rms = np.sqrt(np.convolve(xa ** 2, np.ones(PENCERE) / PENCERE, 'same')[::HOP][:len(F)] + 1e-12)
    govde = zaman[(zaman >= GIRIS_DISI) & (zaman <= sure - SON_DISI)]
    if len(govde) > 8:
        egim = np.polyfit(np.arange(len(govde)), govde, 1)[0]
        tempo = 60.0 / egim
    else:
        tempo = bpm0
    vurus = 60.0 / tempo
    w = max(2, int(round(vurus * fps)))
    kare_no = lambda t: int(round((t * SR_COZ - PENCERE / 2) / HOP))

    # döngü adayları: vuruştan başlayan, 27–34 sn'lik, k vuruşluk aralıklar
    en_iyi = None
    for i in range(len(zaman)):
        s = zaman[i]
        if s < GIRIS_DISI:
            continue
        for j in range(i + 1, len(zaman)):
            L = zaman[j] - s
            if L < DONGU_EN_AZ:
                continue
            if L > DONGU_EN_COK or s + L > sure - SON_DISI:
                break
            ia, ib = kare_no(s), kare_no(zaman[j])
            if ia - w < 0 or ib + w > len(F):
                continue
            ra, rb = rms[ia - w:ia + w].mean(), rms[ib - w:ib + w].mean()
            ek = 0.8 * benzerlik(F, ia, ib, w) + 0.2 * (min(ra, rb) / (max(ra, rb) + 1e-12))
            vr = np.array([rms[kare_no(zaman[q]):max(kare_no(zaman[q]) + 1, kare_no(zaman[q + 1]))].mean() for q in range(i, j)])
            cv = float(vr.std() / (vr.mean() + 1e-12))
            sabit = max(0.0, 1.0 - cv / 0.5)
            k = j - i
            skor = 0.7 * ek + 0.3 * sabit + (0.03 if k % 4 == 0 else 0.0)
            if en_iyi is None or skor > en_iyi['skor']:
                en_iyi = {'skor': skor, 's': float(s), 'L': float(L), 'k': int(k), 'ekYeri': ek, 'sabitlik': sabit}
    if en_iyi is None:
        raise ValueError(f'{os.path.basename(dosya)}: 27–34 sn\'lik döngü bulunamadı (süre {sure:.1f} sn)')

    # başlangıcı atağın 5 ms öncesine çek, uzunluğu çapraz ilintiyle örnek düzeyinde incelt (±20 ms)
    s = ince_vurus(xm48, SR, en_iyi['s']) - 0.005
    a0 = int(round(s * SR))
    n = int(round(en_iyi['L'] * SR))
    d = int(round(0.02 * SR))
    once, sonra = int(0.05 * SR), int(0.15 * SR)
    ref = xm48[a0 - once:a0 + sonra]
    seg = xm48[a0 + n - d - once:a0 + n + d + sonra]
    if len(ref) == once + sonra and len(seg) == 2 * d + once + sonra:
        kor = np.correlate(seg, ref, 'valid')
        enerji = np.sqrt(np.convolve(seg ** 2, np.ones(len(ref)), 'valid') * (ref ** 2).sum() + 1e-12)
        n += int(np.argmax(kor / enerji)) - d

    # teaser: süresi 4 sn'ye en yakın tam vuruşlu pencere, akı ve ses düzeyi en yüksek
    kt = max(2, int(round(TEASER_HEDEF / vurus)))
    teaser = None
    env_ort, rms_ort = env.mean() + 1e-12, rms.mean() + 1e-12
    for i in range(len(zaman) - kt):
        t0, t1 = zaman[i], zaman[i + kt]
        if t0 < GIRIS_DISI or t1 > sure - SON_DISI:
            continue
        a, b = kare_no(t0), kare_no(t1)
        sk = env[a:b].mean() / env_ort + rms[a:b].mean() / rms_ort
        if teaser is None or sk > teaser['skor']:
            teaser = {'skor': float(sk), 'bas': float(t0), 'son': float(t1)}
    if teaser is None:
        raise ValueError(f'{os.path.basename(dosya)}: teaser penceresi bulunamadı')
    tb = ince_vurus(xm48, SR, teaser['bas']) - 0.005
    teaser = {'bas': round(tb, 4), 'son': round(tb + (teaser['son'] - teaser['bas']), 4)}

    yakinlik = max(0.0, 1.0 - abs(tempo - HEDEF_TEMPO) / 40.0)
    puan = 0.5 * en_iyi['ekYeri'] + 0.3 * en_iyi['sabitlik'] + 0.2 * yakinlik
    return {
        'dosya': os.path.basename(dosya), 'sure': round(sure, 3), 'tempo': round(float(tempo), 2),
        'dongu': {'bas': round(s, 4), 'uzunluk': round(n / SR, 5), 'vurus': en_iyi['k'], 'basOrnek': a0, 'ornek': n},
        'ekYeri': round(en_iyi['ekYeri'], 4), 'sabitlik': round(en_iyi['sabitlik'], 4), 'puan': round(puan, 4),
        'teaser': teaser,
    }, xs


# ---------------------------------------------------------------- döngü ve teaser kurma
def dongu_kur(A, a0, n):
    """Ön pay + döngü (sonu çapraz geçiş ve korumayla başlangıcın öncesine bağlanır) + son pay (ek spec §5.7)."""
    P, Q = int(round(ON_PAY * SR)), int(round(SON_PAY * SR))
    X, G = int(round(GECIS * SR)), int(round(KORUMA * SR))
    if a0 - P - X - G < 0 or a0 + n + Q > len(A):
        raise ValueError('döngü parçanın sınırına çok yakın')
    B = A[a0:a0 + n].copy()
    t = np.arange(n - X - G, n - G)
    phi = (np.pi / 2) * (t - (n - X - G)) / X
    B[n - X - G:n - G] = A[a0 + t] * np.cos(phi)[:, None] + A[a0 - (n - t)] * np.sin(phi)[:, None]
    t = np.arange(n - G, n)
    B[n - G:n] = A[a0 - (n - t)]
    return np.concatenate([A[a0 - P:a0], B, A[a0:a0 + Q]]), P


def teaser_kur(A, bas, son):
    a, b = int(round(bas * SR)), int(round((son + TEASER_SONUS) * SR))
    y = A[a:min(b, len(A))].copy()
    acilis = int(round(TEASER_ACILIS * SR))
    y[:acilis] *= np.linspace(0, 1, acilis)[:, None]
    sonus = int(round(TEASER_SONUS * SR))
    u = np.linspace(0, 1, sonus)
    y[-sonus:] *= (np.cos(np.pi / 2 * u) ** 2)[:, None]
    return y


# ---------------------------------------------------------------- kayıt ve oyun verisi
def kayit_oku(kok):
    yol = os.path.join(kok, 'araclar', 'muzik-kayit.json')
    if not os.path.exists(yol):
        return {}
    with open(yol, encoding='utf-8') as f:
        return json.load(f)


def kayit_yaz(kok, kayit):
    yol = os.path.join(kok, 'araclar', 'muzik-kayit.json')
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    with open(yol, 'w', encoding='utf-8') as f:
        json.dump(kayit, f, ensure_ascii=False, indent=2)
        f.write('\n')


def oyun_verisi_yaz(kok, kayit):
    """www/ulke-muzikleri.js: oyunun okuduğu kesim değerleri (elle düzenlenmez)."""
    satirlar = []
    for kod in sorted(kayit):
        k = kayit[kod]
        satirlar.append(f'  {kod}: {{ dongu: "{k["dosyalar"]["dongu"]}", bas: {k["bas"]}, son: {k["son"]}, '
                        f'giris: "{k["dosyalar"]["giris"]}", girisSure: {k["girisSure"]}, tempo: {k["tempo"]} }},')
    metin = ('/* HAYALET AVCILARI — DÜNYA TURU MÜZİKLERİ (3.14.0). araclar/muzik_kes.py üretir; elle düzenlenmez.\n'
             '   bas/son: döngünün loopStart/loopEnd değeri (sn); girisSure: teaser süresi. Ek tasarım §7. */\n'
             'window.ULKE_MUZIKLERI = {\n' + '\n'.join(satirlar) + ('\n' if satirlar else '') + '};\n')
    yol = os.path.join(kok, 'www', 'ulke-muzikleri.js')
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    with open(yol, 'w', encoding='utf-8') as f:
        f.write(metin)


def suno_kaydi(dosya):
    """Parçanın klasöründeki suno.mjs kaydından parça kimliği ve etiketleri (varsa)."""
    yol = os.path.join(os.path.dirname(os.path.abspath(dosya)), 'kayit.json')
    try:
        with open(yol, encoding='utf-8') as f:
            k = json.load(f)
        for p in k.get('parcalar', []):
            if p.get('dosya') == os.path.basename(dosya):
                return {'id': p.get('id'), 'etiketler': p.get('etiketler')}
    except (OSError, ValueError):
        pass
    return {}


def duzey_ayarla(dongu, P, n, giris):
    """Döngüyü −18 LUFS'ye getirir, gerçek tepeyi −1,5 dBTP'nin altında tutar. Ölçüm Opus'a kodlanıp çözülmüş döngüde
    yapılır (sınırlayıcı örnek tepesine bakar, kodlayıcı taşabilir): tepe aşarsa tavan iner, düzey saparsa kazanç
    düzelir; en çok 6 deneme. Teaser aynı kazancı ve tavanı alır."""
    lufs0, _ = ses_duzeyi(dongu[P:P + n])
    kazanc, tavan = 10 ** ((LUFS_HEDEF - lufs0) / 20), TEPE_SINIR
    gecici = tempfile.mkdtemp(prefix='muzik-duzey-')
    try:
        for deneme in range(1, 7):
            x = dongu * kazanc
            sinirli = ses_duzeyi(x)[1] > tavan
            if sinirli:
                x = sinirla(x, tavan)
            yol = os.path.join(gecici, 'd.ogg')
            kodla(x, yol)
            y = coz(yol, SR, 2)
            lufs, tepe = ses_duzeyi(y[P:P + n])
            if tepe > -1.5:
                tavan -= (tepe + 1.5) + 0.2
            elif abs(lufs - LUFS_HEDEF) > 0.3:
                kazanc *= 10 ** ((LUFS_HEDEF - lufs) / 20)
            else:
                break
    finally:
        shutil.rmtree(gecici, ignore_errors=True)
    g = giris * kazanc
    if ses_duzeyi(g)[1] > tavan:
        g = sinirla(g, tavan)
    tuttu = tepe <= -1.5 and abs(lufs - LUFS_HEDEF) <= 0.5
    if not tuttu:
        print(f'uyarı: ses düzeyi 6 denemede tutmadı ({lufs:.2f} LUFS, {tepe:.2f} dBTP)', file=sys.stderr)
    return x, g, {'lufs': round(lufs, 2), 'tepe': round(tepe, 2), 'sinirlayici': bool(sinirli), 'deneme': deneme, 'tuttu': tuttu}


def islenmis_yaz(A, olcum, hedef_dongu, hedef_giris):
    """Seçilen ölçümden döngü ve teaser dosyalarını yazar; ses düzeyi ve tepe bilgisini döndürür."""
    n = olcum['dongu']['ornek']
    dongu, P = dongu_kur(A, olcum['dongu']['basOrnek'], n)
    giris = teaser_kur(A, olcum['teaser']['bas'], olcum['teaser']['son'])
    dongu, giris, bilgi = duzey_ayarla(dongu, P, n, giris)
    kodla(dongu, hedef_dongu)
    kodla(giris, hedef_giris)
    return {**bilgi, 'girisSure': round(len(giris) / SR, 4), 'P': P}


def isle(kod, gorev, parcalar, kok=KOK, kredi=None, sec=None, dinleme=None):
    if not re.fullmatch(r'[A-Z]{2}', kod or ''):
        raise ValueError('kod iki büyük harf olmalı (ISO 3166-1)')
    olcumler, sesler = [], []
    for p in parcalar:
        o, A = parca_olc(p)
        o.update(suno_kaydi(p))
        olcumler.append(o)
        sesler.append(A)
    secilen = sec if sec else 1 + int(np.argmax([o['puan'] for o in olcumler]))
    if not 1 <= secilen <= len(olcumler):
        raise ValueError(f'--sec 1..{len(olcumler)} olmalı')
    muzik = os.path.join(kok, 'www', 'muzik')
    os.makedirs(muzik, exist_ok=True)
    if dinleme:
        os.makedirs(dinleme, exist_ok=True)
        for i, (o, A) in enumerate(zip(olcumler, sesler), 1):
            islenmis_yaz(A, o, os.path.join(dinleme, f'{kod}-{i}-dongu.ogg'), os.path.join(dinleme, f'{kod}-{i}-giris.ogg'))
    o = olcumler[secilen - 1]
    bilgi = islenmis_yaz(sesler[secilen - 1], o, os.path.join(muzik, f'{kod}-dongu.ogg'), os.path.join(muzik, f'{kod}-giris.ogg'))
    P = bilgi.pop('P')
    for x in olcumler:
        x['dongu'] = {k: v for k, v in x['dongu'].items() if k not in ('basOrnek', 'ornek')}
    kayit = kayit_oku(kok)
    kayit[kod] = {
        'gorev': gorev, 'secilen': secilen, 'parcalar': olcumler, **bilgi,
        'dosyalar': {'dongu': f'muzik/{kod}-dongu.ogg', 'giris': f'muzik/{kod}-giris.ogg'},
        'bas': round(P / SR, 4), 'son': round((P + int(round(o['dongu']['uzunluk'] * SR))) / SR, 5),
        'tempo': o['tempo'], 'kredi': {'kalan': kredi} if kredi is not None else {},
    }
    kayit_yaz(kok, kayit)
    oyun_verisi_yaz(kok, kayit)
    return kayit[kod]


# ---------------------------------------------------------------- öz sınama
def yapay_parca(bpm, sure=140.0, govde_vurus=26, govde_son=120.0):
    """Girişi (yalnız ped) ve bitişi (sönen ped) farklı, gövdesi 8 ölçülük döngülü yapay parça; vuruş zamanlarıyla."""
    n = int(sure * SR)
    x = np.zeros((n, 2), np.float32)
    t = np.arange(n) / SR
    vurus = 60.0 / bpm
    bas = govde_vurus * vurus
    giris = t < bas
    ped = sum(np.sin(2 * np.pi * f * t[giris]) for f in (233.08, 293.66, 349.23)) * 0.07
    x[giris] += ped[:, None]
    akorlar = [(261.63, 329.63, 392.0), (220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 246.94, 293.66),
               (261.63, 329.63, 392.0), (164.81, 196.0, 246.94), (174.61, 220.0, 261.63), (196.0, 246.94, 293.66)]
    uzun = int(round(vurus * SR))
    tt = np.arange(uzun) / SR
    zarf = np.exp(-tt * 5.0)
    rng = np.random.default_rng(7)
    alkis = (rng.standard_normal(int(0.06 * SR)) * np.exp(-np.arange(int(0.06 * SR)) / SR * 60)).astype(np.float32) * 0.22
    davul = (np.sin(2 * np.pi * (50 * tt + 400 * (1 - np.exp(-tt * 30)) / 30)) * np.exp(-tt * 18)).astype(np.float32) * 0.5
    sesler = [sum(np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(4 * np.pi * f * tt) for f in a) * zarf * 0.06 for a in akorlar]
    zamanlar = []
    i = 0
    while True:
        a = int(round((bas + i * vurus) * SR))
        if a + uzun > govde_son * SR:
            break
        zamanlar.append(a / SR)
        olcu = (i // 4) % 8
        x[a:a + uzun] += sesler[olcu].astype(np.float32)[:, None]
        if i % 4 == 0:
            x[a:a + uzun, 0] += davul
            x[a:a + uzun, 1] += davul
        if i % 2 == 1:
            x[a:a + len(alkis), 0] += alkis * 0.8
            x[a:a + len(alkis), 1] += alkis
        i += 1
    son = t >= govde_son
    sonus = sum(np.sin(2 * np.pi * f * t[son]) for f in (146.83, 174.61, 220.0)) * 0.07 * (1 - (t[son] - govde_son) / (sure - govde_son))
    x[son] += sonus[:, None]
    return x, np.array(zamanlar)


def sina():
    sonuclar = []

    def s_(ad, kosul, ayrinti=''):
        sonuclar.append(('✓ ' if kosul else '✗ ') + ad + ('' if kosul else f': {ayrinti}'))

    gecici = tempfile.mkdtemp(prefix='muzik-sina-')
    try:
        x1, vur1 = yapay_parca(128.0)
        x2, _ = yapay_parca(112.0)
        p1, p2 = os.path.join(gecici, 'parca-1.mp3'), os.path.join(gecici, 'parca-2.mp3')
        mp3_yaz(x1, p1)
        mp3_yaz(x2, p2)
        kok = os.path.join(gecici, 'kok')
        k = isle('XX', 'sina-gorevi', [p1, p2], kok=kok, kredi=100.0)
        o1, o2 = k['parcalar']
        s_('1. parçanın temposu 128 ± 1', abs(o1['tempo'] - 128) <= 1, o1['tempo'])
        s_('2. parçanın temposu 112 ± 1', abs(o2['tempo'] - 112) <= 1, o2['tempo'])
        s_('puanı yüksek 1. parça seçilir', k['secilen'] == 1, k['secilen'])
        d = o1['dongu']
        s_('döngü 64 vuruş', d['vurus'] == 64, d['vurus'])
        s_('döngü uzunluğu 30,0 sn (en çok vuruşun %1\'i fark)', abs(d['uzunluk'] - 30.0) <= 0.01 * 60 / 128, d['uzunluk'])
        s_('döngü girişin ve bitişin dışında (s ≥ 10, s + L ≤ 125)', d['bas'] >= 10 and d['bas'] + d['uzunluk'] <= 125, d)
        s_('döngü bir vuruşta başlar (±10 ms)', np.min(np.abs(vur1 - d['bas'])) <= 0.010, np.min(np.abs(vur1 - d['bas'])))

        dongu = coz(os.path.join(kok, 'www', 'muzik', 'XX-dongu.ogg'), SR, 2).mean(1)
        bas, son = int(round(k['bas'] * SR)), int(round(k['son'] * SR))
        p99 = float(np.percentile(np.abs(np.diff(dongu[bas:son])), 99))
        for kayma in (0, -1024, 1024, 2112):
            sicrama = abs(float(dongu[son - 1 - kayma] - dongu[bas - kayma]))
            s_(f'ek yeri kesintisiz (kayma {kayma:+d} örnek)', sicrama <= p99, f'{sicrama:.4f} > {p99:.4f}')

        giris = coz(os.path.join(kok, 'www', 'muzik', 'XX-giris.ogg'), SR, 2).mean(1)
        gs = len(giris) / SR
        s_('teaser 3–8 sn', 3 <= gs <= 8, gs)
        s_('teaser bir vuruşta başlar (±10 ms)', np.min(np.abs(vur1 - o1['teaser']['bas'])) <= 0.010, o1['teaser'])
        kuyruk = giris[-int(0.1 * SR):]
        db = 20 * np.log10(np.sqrt((kuyruk ** 2).mean()) + 1e-12)
        s_('teaser sönerek biter (son 0,1 sn < −40 dBFS)', db < -40, f'{db:.1f} dBFS')

        dongu2 = coz(os.path.join(kok, 'www', 'muzik', 'XX-dongu.ogg'), SR, 2)
        lufs, tepe = ses_duzeyi(dongu2[bas:son])
        s_('döngü −18 ± 0,5 LUFS', abs(lufs + 18) <= 0.5, lufs)
        s_('gerçek tepe ≤ −1,3 dBTP', tepe <= -1.3, tepe)

        js = os.path.join(kok, 'www', 'ulke-muzikleri.js')
        r = subprocess.run(['node', '-e', 'global.window={};require(process.argv[1]);console.log(JSON.stringify(window.ULKE_MUZIKLERI))', js],
                           capture_output=True, text=True)
        veri = json.loads(r.stdout or '{}').get('XX', {})
        turler = all(isinstance(veri.get(a), str) for a in ('dongu', 'giris')) and all(isinstance(veri.get(a), (int, float)) for a in ('bas', 'son', 'girisSure', 'tempo'))
        s_('ulke-muzikleri.js alanları doğru türde', turler, veri)
        s_('bas = 0,1 ve son − bas = L', veri.get('bas') == 0.1 and abs(veri.get('son', 0) - veri.get('bas', 0) - d['uzunluk']) <= 0.0001, veri)
        s_('kayıt kredi ve görevi tutar', k.get('kredi', {}).get('kalan') == 100.0 and k.get('gorev') == 'sina-gorevi', k.get('kredi'))
    except Exception as e:  # noqa: BLE001 — sınama akışı yarıda kalırsa raporla
        sonuclar.append(f'✗ akış yarıda kaldı: {type(e).__name__}: {e}')
    finally:
        shutil.rmtree(gecici, ignore_errors=True)
    for s in sonuclar:
        print(s)
    kalan = [s for s in sonuclar if s.startswith('✗')]
    if kalan:
        print(f'{len(kalan)} sınama başarısız')
        return 1
    print(f'TAMAM: {len(sonuclar)} sınama')
    return 0


# ---------------------------------------------------------------- komut satırı
def main(argv):
    if not argv or argv[0] in ('-h', '--help'):
        print(__doc__)
        return 0
    if argv[0] == '--sina':
        return sina()
    komut, args = argv[0], argv[1:]
    secenek, dosyalar = {}, []
    i = 0
    while i < len(args):
        if args[i].startswith('--'):
            if i + 1 >= len(args):
                raise SystemExit(f'{args[i]} için değer yok')
            secenek[args[i][2:]] = args[i + 1]
            i += 2
        else:
            dosyalar.append(args[i])
            i += 1
    kok = secenek.get('kok', KOK)
    if komut == 'olc':
        for d in dosyalar:
            o, _ = parca_olc(d)
            print(json.dumps(o, ensure_ascii=False))
        return 0
    if komut == 'yaz':
        oyun_verisi_yaz(kok, kayit_oku(kok))
        print(os.path.join(kok, 'www', 'ulke-muzikleri.js'))
        return 0
    if komut == 'isle':
        if 'kod' not in secenek or 'gorev' not in secenek or not dosyalar:
            raise SystemExit('isle: --kod, --gorev ve en az bir parça gerekir')
        k = isle(secenek['kod'], secenek['gorev'], dosyalar, kok=kok,
                 kredi=float(secenek['kredi']) if 'kredi' in secenek else None,
                 sec=int(secenek['sec']) if 'sec' in secenek else None, dinleme=secenek.get('dinleme'))
        print(json.dumps({x: k[x] for x in ('secilen', 'tempo', 'bas', 'son', 'girisSure', 'lufs', 'tepe', 'sinirlayici')}, ensure_ascii=False))
        return 0
    raise SystemExit(f'bilinmeyen komut: {komut}')


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
