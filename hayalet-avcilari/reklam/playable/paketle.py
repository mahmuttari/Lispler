#!/usr/bin/env python3
# Hayalet Avcıları oynanabilir reklam paketleyici.
# Yalnız oynanabilir mini oyunun kullandığı görselleri www/gorsel'den kopyalar,
# en uzun kenarı 512 piksele indirip WebP (kalite 80) olarak dist/playable altına yazar.
# Kökünde index.html bulunan dist/HayaletAvcilari-playable.zip dosyasını üretir.
import shutil
import sys
import zipfile
from pathlib import Path

from PIL import Image

KOK = Path(__file__).resolve().parents[2]
KAYNAK = KOK / "www" / "gorsel"
SIMGE_KAYNAK = KOK / "www" / "icon-512.png"
BETIK_KLASORU = Path(__file__).resolve().parent
DIST = KOK / "dist" / "playable"
ZIP_YOLU = KOK / "dist" / "HayaletAvcilari-playable.zip"

# Oyunun kullandığı dosya anahtarları (oyun.js ile aynı liste).
WEBP_ANAHTARLAR = [
    "tema2-zemin",
    "tema2-su",
    "yuva-mezarlik",
    "yuva-magara",
    "yuva-izbe",
]
WEBP_ANAHTARLAR += ["an-yuva-sis-%d" % i for i in range(1, 4)]
WEBP_ANAHTARLAR += ["an-yuva-duman-%d" % i for i in range(1, 3)]
WEBP_ANAHTARLAR += ["dere-sus-%d" % i for i in range(1, 3)]
WEBP_ANAHTARLAR += ["an-timsah-%d" % i for i in range(1, 7)]
WEBP_ANAHTARLAR += ["an-hayalet-suzul-%d" % i for i in range(1, 7)]
WEBP_ANAHTARLAR += ["an-hayalet-puf-%d" % i for i in range(1, 7)]
WEBP_ANAHTARLAR += ["hayalet-atici", "boss-TR", "hayalet-boss"]
WEBP_ANAHTARLAR += ["k3-kinkin-0-%d" % i for i in range(1, 9)]
WEBP_ANAHTARLAR += ["kart-kinkin"]
WEBP_ANAHTARLAR += ["an-para-%d" % i for i in range(1, 7)]
WEBP_ANAHTARLAR += ["an-elmas-%d" % i for i in range(1, 4)]
WEBP_ANAHTARLAR += ["an-vurus-%d" % i for i in range(1, 4)]
WEBP_ANAHTARLAR += ["menu-amblem", "menu-dugme-yesil", "menu-konfeti"]

EN_BUYUK_KENAR = 512
KALITE = 80


def temizle_ve_hazirla():
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "gorsel").mkdir(parents=True)
    ZIP_YOLU.parent.mkdir(parents=True, exist_ok=True)


def kucult_ve_kaydet(kaynak, hedef, en_buyuk_kenar=EN_BUYUK_KENAR):
    with Image.open(kaynak) as ham:
        im = ham.convert("RGBA")
        en, boy = im.size
        olcek = min(1.0, float(en_buyuk_kenar) / float(max(en, boy)))
        if olcek < 1.0:
            im = im.resize((max(1, round(en * olcek)), max(1, round(boy * olcek))), Image.LANCZOS)
        im.save(hedef, "WEBP", quality=KALITE, method=6)
        return im.size


def gorselleri_kopyala():
    eksik = []
    for anahtar in WEBP_ANAHTARLAR:
        kaynak = KAYNAK / (anahtar + ".webp")
        if not kaynak.exists():
            eksik.append(str(kaynak))
            continue
        kucult_ve_kaydet(kaynak, DIST / "gorsel" / (anahtar + ".webp"))
    if eksik:
        print("HATA: eksik görsel dosyaları:")
        for yol in eksik:
            print("  " + yol)
        sys.exit(1)

    if not SIMGE_KAYNAK.exists():
        print("HATA: simge bulunamadı: " + str(SIMGE_KAYNAK))
        sys.exit(1)
    with Image.open(SIMGE_KAYNAK) as simge:
        kucuk = simge.convert("RGBA").resize((192, 192), Image.LANCZOS)
        kucuk.save(DIST / "gorsel" / "simge.png", optimize=True)


def html_ve_js_kopyala():
    for ad in ("index.html", "oyun.js"):
        kaynak = BETIK_KLASORU / ad
        if not kaynak.exists():
            print("HATA: dosya bulunamadı: " + str(kaynak))
            sys.exit(1)
        shutil.copy2(kaynak, DIST / ad)


def zip_uret():
    if ZIP_YOLU.exists():
        ZIP_YOLU.unlink()
    with zipfile.ZipFile(ZIP_YOLU, "w", zipfile.ZIP_DEFLATED) as zf:
        for dosya in sorted(DIST.rglob("*")):
            if dosya.is_file():
                zf.write(dosya, dosya.relative_to(DIST).as_posix())
    return zipfile.ZipFile(ZIP_YOLU, "r").namelist()


def main():
    temizle_ve_hazirla()
    gorselleri_kopyala()
    html_ve_js_kopyala()
    adlar = zip_uret()

    boyut = ZIP_YOLU.stat().st_size
    adet = len(adlar)
    print("ZIP: " + str(ZIP_YOLU))
    print("Boyut: %d bayt (%.1f KB)" % (boyut, boyut / 1024.0))
    print("Dosya sayısı: %d" % adet)

    hata = False
    if "index.html" not in adlar:
        print("HATA: ZIP kökünde index.html yok.")
        hata = True
    if boyut > int(1.5 * 1024 * 1024):
        print("HATA: ZIP 1.5 MB sınırını aşıyor.")
        hata = True
    if adet > 60:
        print("HATA: ZIP dosya sayısı 60 sınırını aşıyor.")
        hata = True
    if hata:
        sys.exit(1)
    print("Paket hazır.")


if __name__ == "__main__":
    main()
