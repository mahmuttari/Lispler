#!/usr/bin/env python3
"""Hayalet Avcıları — Suno web arayüzü (Chrome penceresi) için ülke müzikleri iş sırası üretir.

Kullanıcı 27 Kasım 2026'da Suno aboneliği aldı; şarkılar Mac'teki Claude tarafından Chrome'da suno.com/create sayfasında
üretilecek. Bu betik araclar/muzik-istekleri-sanatsal.json'daki sanatsal istemleri Suno'nun alanlarına böler
(Style of Music / Exclude Styles / Title, Instrumental açık) ve araclar/SUNO-PENCERE-SIRA.md dosyasını yazar.

Sıra: şu anki parçası en hareketli (temposu en yüksek) olan ülke önce. Temposu 105 BPM altındaki parçalar (şu an zaten sakin
olanlar) en sonda ve isteğe bağlı. Türkiye listede yok (kullanıcı: "Türkiye olduğu gibi kalsın").

  python3 hayalet-avcilari/araclar/suno_pencere_sira.py
"""
import json
import os
import re

KOK = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
ARAC = os.path.join(KOK, 'araclar')
SAKIN_SINIR = 105  # BPM: bunun altındaki mevcut parçalar zaten sakin, isteğe bağlı

ORTAK = re.compile(r'\s*Gentle, artistic.*$', re.S)
TEMPO = re.compile(r'(\d+) BPM')
EXCLUDE = 'vocals, singing, choir, heavy drums, driving dance beat, EDM, trap, dubstep, rock, distorted guitar, breakdown, fade-out'


def ulke_adlari():
    adlar = {}
    with open(os.path.join(KOK, 'www', 'ulkeler.js'), encoding='utf-8') as f:
        for kod, ad in re.findall(r'U\("([A-Z]{2})",\s*"[^"]*",\s*t\("([^"]+)"\)', f.read()):
            adlar[kod] = ad
    return adlar


def main():
    with open(os.path.join(ARAC, 'muzik-istekleri-sanatsal.json'), encoding='utf-8') as f:
        istekler = json.load(f)
    with open(os.path.join(ARAC, 'muzik-kayit.json'), encoding='utf-8') as f:
        kayit = json.load(f)
    adlar = ulke_adlari()
    satirlar = []
    for x in istekler:
        kod, istem = x['kod'], x['prompt']
        bpm = int(TEMPO.search(istem).group(1))
        kultur = ORTAK.sub('', istem).strip()
        stil = (f'{kultur} Gentle, artistic, mellow and melodic, soft light percussion, {bpm} BPM, '
                'calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.')
        assert len(stil) <= 1000, (kod, len(stil))
        simdiki = round((kayit.get(kod) or {}).get('tempo') or 0)
        satirlar.append({'kod': kod, 'ad': adlar.get(kod, kod), 'stil': stil, 'simdiki': simdiki,
                         'sakin': 0 < simdiki < SAKIN_SINIR})
    satirlar.sort(key=lambda s: (s['sakin'], -s['simdiki'], s['kod']))

    out = []
    w = out.append
    w('# Suno (Chrome penceresi) — ülke müzikleri iş sırası')
    w('')
    w('Üreten: `araclar/suno_pencere_sira.py` (elle düzenleme; istem değişirse betiği yeniden çalıştır).')
    w('')
    w('Kullanıcı 27 Kasım 2026: *"Suno aylık aboneliği aldım ama onu Chrome\'da pencereden kullanacağız. Şarkıları peş peşe ekleyip')
    w('hazırlat, tek seferde indirebilirsin. O sanatsal güzel müzikleri hazırla."* Amaç: Dünya Turu ülke müziklerini her ülkenin kendi')
    w('**sanatsal** müzik geleneğiyle, sakin ve melodik yeniden üretmek. **Türkiye olduğu gibi kalır** (listede yok).')
    w('')
    w('## İndirme sınırı (önemli)')
    w('')
    w('Suno 3 Eylül 2026\'dan beri aylık **indirme** sınırı uyguluyor: Pro 20, Premier 60 indirme/ay (üretim kredisi ayrı;')
    w('help.suno.com/en/articles/13876865, suno.com/blog/suno-updates-tos). Bu yüzden:')
    w('')
    w('- Her ülke için Suno iki sürüm üretir; **yalnız birini** indir (iki sürüm = iki indirme). Seçim: süresi 1:30\'dan uzun,')
    w('  girişi ve sonu dışında düzenli akan; ikisi de uygunsa **1. sürüm**.')
    w('- Hesap Pro ise (20/ay) yalnız ilk 20 satırı yap, kalanı gelecek aya kalır; Premier ise (60/ay) hepsi sığar.')
    w('  Hesabın planını suno.com/account sayfasından gör, DURUM satırına yaz.')
    w('- Önce **1 numarayı** üret, indir, aşağıdaki işleme adımını çalıştır; sorun yoksa kalanı peş peşe sıraya koy.')
    w('')
    w('## Suno\'da her satır için')
    w('')
    w('1. suno.com/create → **Custom** (Özel) mod. **Instrumental** açık. Model: en yeni sürüm (v5 ya da üstü).')
    w('2. **Style of Music** kutusuna satırdaki *Stil* metnini olduğu gibi yapıştır.')
    w('3. **Exclude Styles** (Advanced Options içinde) kutusuna: `' + EXCLUDE + '`')
    w('4. **Title**: satırdaki başlık (`Hayalet Avcilari - KOD`). Lyrics boş kalır.')
    w('5. Create. Sonraki satıra geç (Suno istekleri sıraya alır; bitmesini beklemek gerekmez).')
    w('6. Hepsi bitince Library\'den her ülkenin seçilen sürümünü **MP3** olarak indir, adını `KOD.mp3` yap.')
    w('')
    w('## İndirdikten sonra')
    w('')
    w('Mac\'te numpy ve ffmpeg varsa her dosya için (depo kökünden):')
    w('')
    w('```')
    w('python3 hayalet-avcilari/araclar/muzik_kes.py isle --kod KOD --gorev suno-pencere-2026-11 ~/Downloads/KOD.mp3')
    w('```')
    w('')
    w('Bu, `www/muzik/KOD-dongu.ogg`, `KOD-giris.ogg`, `araclar/muzik-kayit.json` ve `www/ulke-muzikleri.js`\'i yazar; bunları')
    w('commit et (`git pull --no-rebase` sonra push). numpy/ffmpeg yoksa ya da araç hata verirse MP3\'leri **ayrı bir dala**')
    w('(`suno-ham`, yalnız `muzik-ham/KOD.mp3`) push et; bulut oturumu işler ve o dalı siler. MP3\'ler asıl dala konmaz (boyut).')
    w('Şarkı sözü, sanatçı adı ya da başka bir eserin adı istemlere eklenmez.')
    w('')
    w('## Sıra')
    w('')
    w('| # | Kod | Ülke | Şu anki tempo | Durum |')
    w('|---|---|---|---|---|')
    for i, s in enumerate(satirlar, 1):
        not_ = 'isteğe bağlı (şu anki zaten sakin)' if s['sakin'] else 'bekliyor'
        w(f"| {i} | {s['kod']} | {s['ad']} | {s['simdiki']} BPM | {not_} |")
    w('')
    for i, s in enumerate(satirlar, 1):
        w(f"### {i}. {s['kod']} — {s['ad']}" + (' (isteğe bağlı)' if s['sakin'] else ''))
        w('')
        w(f"- Başlık: `Hayalet Avcilari - {s['kod']}`")
        w(f"- Stil ({len(s['stil'])} karakter):")
        w('')
        w('```')
        w(s['stil'])
        w('```')
        w('')
    with open(os.path.join(ARAC, 'SUNO-PENCERE-SIRA.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print(f"{len(satirlar)} ülke; isteğe bağlı: {[s['kod'] for s in satirlar if s['sakin']]}")


if __name__ == '__main__':
    main()
