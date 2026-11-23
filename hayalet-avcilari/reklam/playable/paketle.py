#!/usr/bin/env python3
# Hayalet Avcıları oynanabilir reklam paketleyici.
# www/gorsel içindeki WebP görselleri ve uygulama simgesini dist/playable altına kopyalar,
# kökünde index.html bulunan dist/HayaletAvcilari-playable.zip dosyasını üretir.
import shutil
import sys
import zipfile
from pathlib import Path

from PIL import Image

# hayalet-avcilari kökü: bu betiğin iki üst klasörü.
KOK = Path(__file__).resolve().parents[2]
KAYNAK = KOK / "www" / "gorsel"
SIMGE_KAYNAK = KOK / "www" / "icon-512.png"
BETIK_KLASORU = Path(__file__).resolve().parent
DIST = KOK / "dist" / "playable"
ZIP_YOLU = KOK / "dist" / "HayaletAvcilari-playable.zip"

# Kinkin'in silahıyla birlikte hazır ChatGPT görselleri: kaynak yol, çıktı anahtarı.
KINKIN_GORSEL = [
    ("ham3d/D01.png", "kinkin-dur"),
    ("hamui/U01.png", "kinkin-kos"),
]

# Oyunda kullanılan dosya anahtarları.
ANAHTARLAR = ["kinkin-dur", "kinkin-kos", "tema2-zemin"]
ANAHTARLAR += ["an-hayalet-suzul-%d" % i for i in range(1, 7)]
ANAHTARLAR += ["an-hayalet-puf-%d" % i for i in range(1, 7)]
ANAHTARLAR += ["an-atici-saldiri-%d" % i for i in range(1, 7)]
ANAHTARLAR += ["an-boss-bekle-%d" % i for i in range(1, 4)]
ANAHTARLAR += ["an-para-%d" % i for i in range(1, 7)]
ANAHTARLAR += ["an-vurus-%d" % i for i in range(1, 4)]
ANAHTARLAR += ["an-kasirga-%d" % i for i in range(1, 4)]


def temizle_ve_hazirla():
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "gorsel").mkdir(parents=True)
    ZIP_YOLU.parent.mkdir(parents=True, exist_ok=True)


def kinkin_gorselleri_uret():
    for kaynak_yol, anahtar in KINKIN_GORSEL:
        kaynak = KOK / "gorsel" / kaynak_yol
        if not kaynak.exists():
            print("HATA: eksik görsel dosyası: " + str(kaynak))
            sys.exit(1)
        with Image.open(kaynak) as ham:
            hucre = ham.convert("RGBA").crop((0, 0, 512, 512))
            alfa = hucre.getchannel("A").point(lambda a: 0 if a < 40 else a)
            hucre.putalpha(alfa)
            kirpik = hucre.getbbox()
            if kirpik:
                hucre = hucre.crop(kirpik)
            yeni_en = max(1, round(hucre.width * 256.0 / hucre.height))
            hucre = hucre.resize((yeni_en, 256), Image.LANCZOS)
            hucre.save(DIST / "gorsel" / (anahtar + ".webp"), quality=88)


def gorselleri_kopyala():
    eksik = []
    for anahtar in ANAHTARLAR:
        kaynak = KAYNAK / (anahtar + ".webp")
        if not kaynak.exists():
            eksik.append(str(kaynak))
            continue
        shutil.copy2(kaynak, DIST / "gorsel" / (anahtar + ".webp"))
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
    if boyut >= 1024 * 1024:
        print("HATA: ZIP 1 MB sınırını aşıyor.")
        hata = True
    if adet >= 512:
        print("HATA: ZIP dosya sayısı 512 sınırına ulaştı.")
        hata = True
    if hata:
        sys.exit(1)
    print("Paket hazır.")


if __name__ == "__main__":
    main()
