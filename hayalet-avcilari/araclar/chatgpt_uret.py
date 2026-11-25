#!/usr/bin/env python3
"""ChatGPT görsel modeliyle (OpenAI Images API) pafta üretir: istem dosyalarındaki ANA İSTEM + paftanın kendi istemi,
üslup referansı olarak onaylı paftalar (hamui/U06.png, ham3d/D01.png). Yerel Claude'un ChatGPT'de elle yaptığı işin aynısı.

Kullanım (hayalet-avcilari klasöründen):
  python3 araclar/chatgpt_uret.py H01 R47 K12        # paftaları üretir, gorsel/ham*/<KOD>.png olarak kaydeder
  python3 araclar/chatgpt_uret.py --istem K12         # yalnız gönderilecek istemi yazar (istek atılmaz)
Anahtar: ortamın vekili ekler (bulut oturumu) ya da OPENAI_API_KEY. Anahtar hiçbir dosyaya yazılmaz.
"""
import base64
import io
import json
import os
import re
import sys
import time
import urllib.request
import uuid

from PIL import Image

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
GORSEL = os.path.join(KOK, 'gorsel')
MODEL = os.environ.get('GORSEL_MODEL', 'chatgpt-image-latest')
REFERANS = ['hamui/U06.png', 'ham3d/D01.png']

# Kod öneki → (istem dosyası, ana istem dosyası ve başlığı, çıkış klasörü)
PAKET = {
    'H': ('CHATGPT-ISTEMI-HIKAYE.md', ('CHATGPT-ISTEMI-HIKAYE.md', 'HİKÂYE ANA İSTEMİ'), 'hamhikaye'),
    'B': ('CHATGPT-ISTEMI-HIKAYE.md', ('CHATGPT-ISTEMI-HIKAYE.md', 'HİKÂYE ANA İSTEMİ'), 'hamhikaye'),
    'HA': ('CHATGPT-ISTEMI-HIKAYE.md', ('CHATGPT-ISTEMI-HIKAYE.md', 'HİKÂYE ANA İSTEMİ'), 'hamhikaye'),
    'K': ('CHATGPT-ISTEMI-EK.md', ('CHATGPT-ISTEMI-YOLCULUK.md', 'ANA İSTEM'), 'hamek'),
    'R': ('CHATGPT-ISTEMI-YENILEME.md', ('CHATGPT-ISTEMI-YOLCULUK.md', 'ANA İSTEM'), 'hamyeni'),
    'J': ('CHATGPT-ISTEMI-YOLCULUK.md', ('CHATGPT-ISTEMI-YOLCULUK.md', 'ANA İSTEM'), 'hamyol'),
}


def oku(ad):
    with open(os.path.join(GORSEL, ad), encoding='utf-8') as f:
        return f.read()


def kod_bloklari(metin):
    return re.findall(r'```\n(.*?)```', metin, re.S)


def ana_istem(dosya, baslik):
    metin = oku(dosya)
    i = metin.index('## ' + baslik)
    blok = kod_bloklari(metin[i:])[0]
    # ChatGPT sohbetine özgü son satır API'de anlamsız
    return re.sub(r'\n?Reply only with the image\..*$', '', blok.strip(), flags=re.S).strip()


def pafta_istemi(dosya, kod):
    # Hikâyenin animasyon paftaları dosyada A01-A03 adıyla durur (3D A paftalarıyla karışmasın diye burada HA01)
    ad = kod[1:] if kod.startswith('HA') else kod
    for blok in kod_bloklari(oku(dosya)):
        if re.match(r'\s*(Sheet|Illustration|Icon sheet|Animation sheet)\s+' + re.escape(ad) + r'\b', blok):
            return blok.strip()
    raise SystemExit(f'{kod}: {dosya} içinde istem bulunamadı')


def paket(kod):
    on = 'HA' if kod.startswith('HA') else kod[0]
    if on not in PAKET:
        raise SystemExit(f'{kod}: bilinmeyen önek')
    return PAKET[on]


def istem_kur(kod):
    dosya, (ana_dosya, baslik), cikis = paket(kod)
    p = pafta_istemi(dosya, kod)
    ana = ana_istem(ana_dosya, baslik)
    opak = bool(re.search(r'\bOPAQUE\b|\bopaque\b', p.split('\n')[0])) or p.lstrip().startswith('Illustration')
    dikey = '1024 x 1536' in p
    boyut = '1024x1536' if dikey else '1536x1024'
    tam = (ana + '\n\nThe attached images are approved sheets: use them ONLY as style reference (materials, lighting, '
           'colours); do not copy their content.\n\n' + p)
    return tam, opak, boyut, cikis


def cok_parcali(alanlar, dosyalar):
    sinir = uuid.uuid4().hex
    govde = io.BytesIO()
    for ad, deger in alanlar:
        govde.write(f'--{sinir}\r\nContent-Disposition: form-data; name="{ad}"\r\n\r\n{deger}\r\n'.encode())
    for ad, yol in dosyalar:
        with open(yol, 'rb') as f:
            veri = f.read()
        govde.write(f'--{sinir}\r\nContent-Disposition: form-data; name="{ad}"; filename="{os.path.basename(yol)}"\r\n'
                    f'Content-Type: image/png\r\n\r\n'.encode())
        govde.write(veri)
        govde.write(b'\r\n')
    govde.write(f'--{sinir}--\r\n'.encode())
    return govde.getvalue(), f'multipart/form-data; boundary={sinir}'


def uret(kod, deneme=3):
    istem, opak, boyut, cikis = istem_kur(kod)
    alanlar = [('model', MODEL), ('prompt', istem), ('size', boyut), ('quality', 'high'), ('n', '1'),
               ('background', 'opaque' if opak else 'transparent'), ('output_format', 'png')]
    dosyalar = [('image[]', os.path.join(GORSEL, r)) for r in REFERANS]
    govde, tur = cok_parcali(alanlar, dosyalar)
    basliklar = {'Content-Type': tur}
    anahtar = os.environ.get('OPENAI_API_KEY')
    if anahtar:
        basliklar['Authorization'] = 'Bearer ' + anahtar
    son_hata = None
    for i in range(deneme):
        try:
            istek = urllib.request.Request('https://api.openai.com/v1/images/edits', data=govde, headers=basliklar)
            with urllib.request.urlopen(istek, timeout=600) as y:
                yanit = json.load(y)
            b64 = yanit['data'][0]['b64_json']
            break
        except urllib.error.HTTPError as e:
            son_hata = f'HTTP {e.code}: {e.read().decode(errors="replace")[:400]}'
        except Exception as e:  # ağ kesintisi, zaman aşımı
            son_hata = repr(e)
        print(f'  {kod}: deneme {i + 1} olmadı ({son_hata}); yeniden', flush=True)
        time.sleep(10 * (i + 1))
    else:
        raise RuntimeError(f'{kod}: üretilemedi: {son_hata}')
    im = Image.open(io.BytesIO(base64.b64decode(b64)))
    w, h = (int(x) for x in boyut.split('x'))
    if im.size != (w, h):
        im = im.resize((w, h), Image.LANCZOS)
    if opak:
        im = im.convert('RGB')
    os.makedirs(os.path.join(GORSEL, cikis), exist_ok=True)
    yol = os.path.join(GORSEL, cikis, kod[1:] + '.png' if kod.startswith('HA') else kod + '.png')
    im.save(yol)
    print(f'✓ {kod} → gorsel/{cikis}/{os.path.basename(yol)} ({im.size[0]}x{im.size[1]}, {"opak" if opak else "saydam"})',
          flush=True)
    return yol


if __name__ == '__main__':
    argv = sys.argv[1:]
    if argv and argv[0] == '--istem':
        for k in argv[1:]:
            istem, opak, boyut, cikis = istem_kur(k)
            print(f'=== {k} ({boyut}, {"opak" if opak else "saydam"}, gorsel/{cikis}) ===\n{istem}\n')
        sys.exit(0)
    hata = 0
    for k in argv:
        try:
            uret(k)
        except Exception as e:
            hata += 1
            print(f'✗ {e}', flush=True)
    sys.exit(1 if hata else 0)
