"""gorsel_kes.py: arayüz ve yön paftası kesicilerinin testleri (geçici klasörlerle)."""
import os
import sys

import pytest
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gorsel_kes  # noqa: E402


@pytest.fixture
def dizinler(tmp_path, monkeypatch):
    ham = tmp_path / 'ham'
    ham3d = tmp_path / 'ham3d'
    hamui = tmp_path / 'hamui'
    cikti = tmp_path / 'cikti'
    for d in (ham, ham3d, hamui, cikti):
        d.mkdir()
    monkeypatch.setattr(gorsel_kes, 'HAM', str(ham))
    monkeypatch.setattr(gorsel_kes, 'HAM3D', str(ham3d))
    monkeypatch.setattr(gorsel_kes, 'HAMUI', str(hamui))
    monkeypatch.setattr(gorsel_kes, 'CIKTI', str(cikti))
    gorsel_kes.NAMUL_UCU.clear()
    return ham, ham3d, hamui, cikti


def _u05():
    resim = Image.new('RGBA', (1536, 1024), (0, 0, 0, 0))
    ciz = ImageDraw.Draw(resim)
    for i in range(6):
        x0, y0 = (i % 3) * 512, (i // 3) * 512
        ciz.rectangle((x0 + 100, y0 + 100, x0 + 300, y0 + 300), fill=(200, 60, 60, 255))
    return resim


def _u09():
    resim = Image.new('RGBA', (1024, 1536), (0, 0, 0, 0))
    ImageDraw.Draw(resim).rectangle((100, 100, 900, 1400), fill=(40, 80, 200, 255))
    return resim


def _y01():
    resim = Image.new('RGBA', (1536, 1024), (0, 0, 0, 0))
    ciz = ImageDraw.Draw(resim)
    for r in range(3):
        y0 = r * 341
        for c in range(4):
            x0 = c * 384
            ciz.rectangle((x0 + 80, y0 + 80, x0 + 240, y0 + 260), fill=(60, 120, 200, 255))
            if r == 0:
                ciz.rectangle((x0 + 300, y0 + 130, x0 + 360, y0 + 170), fill=(255, 255, 0, 255))
    return resim


def test_arayuz_u05(dizinler):
    _, _, hamui, cikti = dizinler
    _u05().save(hamui / 'U05.png')
    liste = {}
    gorsel_kes.arayuz(liste)
    beklenen = ['gel-hiz', 'gel-hasar', 'gel-atis', 'gel-menzil', 'gel-can', 'gel-miknatis']
    assert sorted(liste) == sorted(beklenen)
    for anahtar in beklenen:
        yol = cikti / f'{anahtar}.webp'
        assert yol.exists()
        with Image.open(yol) as im:
            assert max(im.size) <= 128
            assert liste[anahtar] == [im.width, im.height]


def test_arayuz_u09(dizinler):
    _, _, hamui, cikti = dizinler
    _u09().save(hamui / 'U09.png')
    liste = {}
    gorsel_kes.arayuz(liste)
    yol = cikti / 'giris-kahraman.webp'
    assert yol.exists()
    with Image.open(yol) as im:
        assert im.width <= 768
    assert liste['giris-kahraman'][0] <= 768


def test_karakterler_yon(dizinler):
    _, ham3d, _, cikti = dizinler
    _y01().save(ham3d / 'Y01.png')
    liste = {}
    gorsel_kes.karakterler_yon(liste)
    for yon in ('yan', 'on', 'arka'):
        for n in range(1, 5):
            anahtar = f'k4-kinkin-0-{yon}-{n}'
            assert anahtar in liste
            assert (cikti / f'{anahtar}.webp').exists()
    boyutlar = set()
    for anahtar in liste:
        with Image.open(cikti / f'{anahtar}.webp') as im:
            boyutlar.add(im.size)
    assert len(boyutlar) == 1
    uc = gorsel_kes.NAMUL_UCU['k4-kinkin-0']
    assert len(uc) == 4
    for fx, fy in uc:
        assert 0.0 <= fx <= 1.0 and 0.0 <= fy <= 1.0
        assert fx > 0.8


def test_liste_js(dizinler):
    _, ham3d, hamui, cikti = dizinler
    _u05().save(hamui / 'U05.png')
    _u09().save(hamui / 'U09.png')
    _y01().save(ham3d / 'Y01.png')
    gorsel_kes.kes()
    metin = (cikti / 'liste.js').read_text(encoding='utf-8')
    assert 'const GORSEL_LISTESI' in metin
    assert 'const ANIM_GOVDE' in metin
    assert 'const NAMLU_UCU' in metin
    assert 'kart-kinkin' not in metin


def test_yanlis_boyut_cikar(dizinler):
    _, _, hamui, _ = dizinler
    Image.new('RGBA', (100, 100), (0, 0, 0, 0)).save(hamui / 'U05.png')
    with pytest.raises(SystemExit):
        gorsel_kes.arayuz({})


def test_eksik_pafta_atlanir(dizinler):
    liste = {}
    gorsel_kes.arayuz(liste)
    gorsel_kes.karakterler_yon(liste)
    assert liste == {}
