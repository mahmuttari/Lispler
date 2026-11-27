#!/usr/bin/env python3
"""Hayalet Avcıları — Suno web arayüzü (Chrome penceresi) için ülke müzikleri iş sırası üretir.

Kullanıcı 27 Kasım 2026'da Suno aboneliği aldı; şarkılar Mac'teki Claude tarafından Chrome'da suno.com/create sayfasında
üretilecek. Kullanıcı her ülke için seçim sayfasında (araclar/muzik-secimleri.json, kaynak: claude.ai seçim sayfası) üç
seçenekten birini seçti; seçeneklerin tarifleri araclar/muzik-secenekleri.json'dadır (yöresel, kanun gibi net tınılı çalgı
önde; kullanıcı: "boğucu olmayan, daha net tınılı çalgı"). Bu betik seçilen tarifi Suno'nun alanlarına koyar
(Style of Music / Exclude Styles / Title, Instrumental açık) ve araclar/SUNO-PENCERE-SIRA.md dosyasını yazar.

Sıra: şu anki parçası en hareketli (temposu en yüksek) olan ülke önce; kullanıcının "kalsın"/"atla" dedikleri üretilmez. Türkiye listede yok (kullanıcı: "Türkiye olduğu gibi kalsın").

  python3 hayalet-avcilari/araclar/suno_pencere_sira.py
"""
import json
import os
import re

KOK = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
ARAC = os.path.join(KOK, 'araclar')

EXCLUDE = ('vocals, singing, choir, heavy drums, driving dance beat, EDM, trap, dubstep, rock, distorted guitar, accordion, '
           'bagpipes, shawm, drone, synth pads, orchestral strings, reverb wash, breakdown, fade-out')


def main():
    with open(os.path.join(ARAC, 'muzik-secenekleri.json'), encoding='utf-8') as f:
        secenekler = {u['kod']: u for u in json.load(f)['ulkeler']}
    with open(os.path.join(ARAC, 'muzik-secimleri.json'), encoding='utf-8') as f:
        secimler = json.load(f)['secimler']
    with open(os.path.join(ARAC, 'muzik-kayit.json'), encoding='utf-8') as f:
        kayit = json.load(f)
    satirlar = []
    for kod, u in secenekler.items():
        sec = secimler.get(kod, {})
        harf = sec.get('secim', '')
        s = next((x for x in u['secenekler'] if x['id'] == harf), None)
        simdiki = round((kayit.get(kod) or {}).get('tempo') or 0)
        if s is None:  # "kalsın" / "atla" / seçilmemiş: üretilmez
            satirlar.append({'kod': kod, 'ad': u['ad'], 'stil': '', 'simdiki': simdiki, 'sakin': True, 'secim': harf or '-',
                             'baslik': '', 'not': sec.get('not', ''), 'calgilar': []})
            continue
        assert len(s['stil']) <= 1000, (kod, len(s['stil']))
        satirlar.append({'kod': kod, 'ad': u['ad'], 'stil': s['stil'], 'simdiki': simdiki, 'sakin': False, 'secim': harf,
                         'baslik': s['baslik'], 'not': sec.get('not', ''), 'calgilar': s.get('calgilar', []),
                         'bpm': s.get('bpm')})
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
    w('| # | Kod | Ülke | Seçim | Ana çalgı | Durum |')
    w('|---|---|---|---|---|---|')
    for i, s in enumerate(satirlar, 1):
        not_ = 'üretilmez (kalsın/atla)' if s['sakin'] else 'bekliyor'
        cal = s['calgilar'][0] if s['calgilar'] else '-'
        w(f"| {i} | {s['kod']} | {s['ad']} | {s['secim']} {s['baslik']} | {cal} | {not_} |")
    w('')
    for i, s in enumerate(satirlar, 1):
        if s['sakin']:
            continue
        w(f"### {i}. {s['kod']} — {s['ad']} ({s['secim']}: {s['baslik']})")
        w('')
        if s['not']:
            w(f"- Kullanıcının notu: {s['not']}")
        w(f"- Başlık: `Hayalet Avcilari - {s['kod']}`")
        w(f"- Stil ({len(s['stil'])} karakter):")
        w('')
        w('```')
        w(s['stil'])
        w('```')
        w('')
    with open(os.path.join(ARAC, 'SUNO-PENCERE-SIRA.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print(f"{sum(not s['sakin'] for s in satirlar)} üretilecek; üretilmeyen: {[s['kod'] for s in satirlar if s['sakin']]}")


if __name__ == '__main__':
    main()
