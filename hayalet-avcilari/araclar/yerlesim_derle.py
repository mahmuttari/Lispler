#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Harita yerleşim planlarını doğrular ve oyunun okuyacağı JS dosyasına yazar.

Girdi: gorsel/hamyerlesim/Y*.json (her dosya bir yerleşim dizisi).
Çıktı: www/yerlesim-sablonlari.js  ->  window.YERLESIM_SABLONLARI = [...]
Kullanım:
  python3 araclar/yerlesim_derle.py [girdi_dizini] [cikti_dosyasi]
Bağımlılık yoktur.
"""
import glob
import json
import os
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VARSAYILAN_GIRDI = os.path.join(KOK, "gorsel", "hamyerlesim")
VARSAYILAN_CIKTI = os.path.join(KOK, "www", "yerlesim-sablonlari.js")

TURLER = {"gol", "anit", "obje", "duvar", "yuva", "donati", "meydan"}
DORTGEN = {"gol", "anit", "obje", "duvar"}
SINIR = 0.03
BOSLUK = 0.02
EPS = 0.05


def sayi(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def aralikta(v, a=0.0, b=1.0):
    return sayi(v) and a <= v <= b


def dikdortgen(o):
    u, v = o["u"], o["v"]
    w, h = o["w"], o["h"]
    return (u - w / 2.0, v - h / 2.0, u + w / 2.0, v + h / 2.0)


def kesisir(a, b, bosluk=BOSLUK):
    return a[0] < b[2] + bosluk and a[2] + bosluk > b[0] and a[1] < b[3] + bosluk and a[3] + bosluk > b[1]


def dogrula(y, sira, dosya):
    """Geçerliyse (True, None), değilse (False, "sebep") döndürür."""
    if not isinstance(y, dict):
        return False, "yerleşim nesne değil"
    if not isinstance(y.get("id"), str) or not y["id"].strip():
        return False, "id eksik"
    uygun = y.get("uygun", ["her"])
    if not isinstance(uygun, list) or not all(isinstance(t, str) for t in uygun):
        return False, "uygun dizi değil"
    ogeler = y.get("ogeler")
    if not isinstance(ogeler, list):
        return False, "ogeler dizi değil"
    arena = "arena" in uygun
    baslangic = "baslangic" in uygun

    yuva = 0
    anit = 0
    kutular = []
    for oi, o in enumerate(ogeler):
        if not isinstance(o, dict):
            return False, "%d. öğe nesne değil" % oi
        tip = o.get("tip")
        if tip not in TURLER:
            return False, "%d. öğe bilinmeyen tip: %r" % (oi, tip)
        if not aralikta(o.get("u")) or not aralikta(o.get("v")):
            return False, "%s: u/v aralık dışı" % tip
        if tip in ("yuva", "donati", "meydan") and not (SINIR <= o["u"] <= 1 - SINIR and SINIR <= o["v"] <= 1 - SINIR):
            return False, "%s: nokta 0.03..0.97 dışında" % tip
        if tip == "donati":
            if not isinstance(o.get("adet"), int) or not (2 <= o["adet"] <= 5):
                return False, "donati: adet 2-5 olmalı"
        if tip == "meydan":
            rmax = 0.24 if "arena" in uygun else 0.16  # arenada boss için geniş orta meydan
            if not aralikta(o.get("r"), 0.08, rmax):
                return False, "meydan: r 0.08-%.2f olmalı" % rmax
        if tip in DORTGEN:
            w, h = o.get("w"), o.get("h")
            if not aralikta(w) or not aralikta(h):
                return False, "%s: w/h eksik ya da aralık dışı" % tip
            x0, y0, x1, y1 = dikdortgen(o)
            if not (SINIR <= x0 and SINIR <= y0 and x1 <= 1 - SINIR and y1 <= 1 - SINIR):
                return False, "%s: dikdörtgen 0.03..0.97 dışında" % tip
            kutular.append((tip, (x0, y0, x1, y1)))
        if tip == "yuva":
            yuva += 1
        if tip == "anit":
            anit += 1

    for i in range(len(kutular)):
        for j in range(i + 1, len(kutular)):
            if kesisir(kutular[i][1], kutular[j][1]):
                return False, "%s ile %s çakışıyor (0.02 boşluk)" % (kutular[i][0], kutular[j][0])

    yol = y.get("yol")
    if not isinstance(yol, list) or not (3 <= len(yol) <= 8):
        return False, "yol 3-8 nokta olmalı"
    for p in yol:
        if not isinstance(p, list) or len(p) != 2 or not aralikta(p[0]) or not aralikta(p[1]):
            return False, "yol noktası geçersiz"
    if abs(yol[0][0]) > EPS or abs(yol[-1][0] - 1) > EPS:
        return False, "yol u≈0'dan başlayıp u≈1'de bitmeli"

    if yuva != 4:
        return False, "yuva sayısı 4 olmalı (bulunan %d)" % yuva
    if not (arena or baslangic) and anit != 1:
        return False, "anit sayısı 1 olmalı (bulunan %d)" % anit

    return True, None


def main():
    girdi = sys.argv[1] if len(sys.argv) > 1 else VARSAYILAN_GIRDI
    cikti = sys.argv[2] if len(sys.argv) > 2 else VARSAYILAN_CIKTI
    gecerliler = []
    dosyalar = sorted(glob.glob(os.path.join(girdi, "Y*.json")))
    if not dosyalar:
        print("Uyarı: %s altında Y*.json yok; boş şablon yazılır." % girdi)
    for dosya in dosyalar:
        ad = os.path.basename(dosya)
        try:
            with open(dosya, "r", encoding="utf-8") as f:
                veri = json.load(f)
        except Exception as e:  # noqa: BLE001
            print("Atlandı %s: JSON okunamadı (%s)" % (ad, e))
            continue
        if not isinstance(veri, list):
            print("Atlandı %s: kök dizi değil" % ad)
            continue
        for i, y in enumerate(veri):
            ok, sebep = dogrula(y, i, ad)
            if ok:
                gecerliler.append(y)
            else:
                print("Atlandı %s[%d]: %s" % (ad, i, sebep))
    metin = json.dumps(gecerliler, ensure_ascii=False, separators=(",", ":"))
    icerik = (
        "/* Hayalet Avcıları — ChatGPT harita yerleşim şablonları.\n"
        "   Bu dosya araclar/yerlesim_derle.py tarafından üretilir; elle düzenlemeyin.\n"
        "   Kaynak: gorsel/hamyerlesim/Y*.json */\n"
        "window.YERLESIM_SABLONLARI = %s;\n" % metin
    )
    os.makedirs(os.path.dirname(os.path.abspath(cikti)), exist_ok=True)
    with open(cikti, "w", encoding="utf-8") as f:
        f.write(icerik)
    print("Yazıldı: %s (%d geçerli yerleşim)" % (cikti, len(gecerliler)))


if __name__ == "__main__":
    main()
