#!/usr/bin/env python3
"""Dünya Turu ülke müziklerini ElevenLabs müzik üretimiyle yeniden üretir: ülkenin kendi kültürünün sanatsal müziği
(istemler.json, 27 Kasım). Her ülke 2 aday (100 sn) → araclar/muzik_kes.py isle. Kullanım: python3 muzik-uret.py KOD…"""
import json, os, subprocess, sys, time, urllib.request
KOK = '/home/user/Lispler/hayalet-avcilari'
CIK = os.environ.get('MUZIK_CIKTI', '/tmp/muzik-eleven')  # mp3 adayları (depoya alınmaz)
os.makedirs(CIK, exist_ok=True)
ISTEM = {x['kod']: x['prompt'] for x in json.load(open(f'{KOK}/araclar/muzik-istekleri-sanatsal.json', encoding='utf-8'))}

def uret(prompt, yol):
    govde = json.dumps({'prompt': prompt, 'music_length_ms': 100000, 'model_id': 'music_v1', 'force_instrumental': True}).encode()
    for deneme in range(4):
        try:
            r = urllib.request.Request('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', data=govde,
                                       headers={'Content-Type': 'application/json'}, method='POST')
            with urllib.request.urlopen(r, timeout=600) as y:
                open(yol, 'wb').write(y.read())
            return True
        except Exception as e:
            print('  hata', e, getattr(e, 'read', lambda: b'')()[:300], flush=True)
            time.sleep(20 * (deneme + 1))
    return False

for kod in sys.argv[1:]:
    p = ISTEM[kod]
    print(kod, '→', p[:120], flush=True)
    dosyalar = [f'{CIK}/{kod.lower()}-{i}.mp3' for i in (1, 2)]
    dosyalar = [y for y in dosyalar if os.path.exists(y) or uret(p, y)]
    if not dosyalar:
        print(kod, 'ÜRETİLEMEDİ', flush=True); continue
    s = subprocess.run(['python3', f'{KOK}/araclar/muzik_kes.py', 'isle', '--kod', kod, '--gorev', 'elevenlabs-music-2026-11-27'] + dosyalar,
                       capture_output=True, text=True)
    print(kod, 'kesim', s.returncode, (s.stdout or s.stderr).strip()[-300:], flush=True)
print('HEPSI BITTI', flush=True)
