#!/usr/bin/env python3
# Dünya Turu hikâyesi ve yolculuk haritası ses efektleri: ElevenLabs ses üretimi (sound-generation) ile üretildi, 25 Kasım 2026.
# Anahtar dosyada yok: bulut ortamında vekil ekler; başka yerde ELEVENLABS_API_KEY ortam değişkeni xi-api-key başlığına konur.
#   python3 araclar/sfx_hikaye.py [ad ...]   → çalışma klasörüne <ad>.mp3; sonra her biri için:
#   ffmpeg -i <ad>.mp3 -af "loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=out:st=<süre-0.25>:d=0.25" -ac 1 -ar 48000 -c:a aac -b:a 96k www/sfx/hikaye/<ad>.m4a
# ElevenLabs Creator aboneliğinde üretilen sesler ticari kullanıma açıktır. Her üretim kredi harcar.
S = {
 'hatira':      (1.5, 'cute magical sparkle chime, tiny glockenspiel twinkle rising, picking up a treasure in a cozy cartoon game, bright and soft'),
 'sahne':       (1.2, 'soft paper page turn with a gentle airy whoosh, storybook opening, cozy cartoon game'),
 'dogru':       (1.5, 'happy cheerful three note ascending xylophone chime, correct answer, cute cartoon game, soft and warm'),
 'yanlis':      (1.0, 'cute soft cartoon boing with a gentle descending two note wooden blip, wrong answer but friendly, not harsh'),
 'kopru-ac':    (2.5, 'small wooden drawbridge lowering with soft creak and chain rattle ending in a gentle magical chime, cozy cartoon game'),
 'kopru-kilit': (0.8, 'soft muffled wooden knock with a tiny low magical buzz, locked gate in a cute cartoon game'),
 'harita':      (2.0, 'warm magical shimmer swelling up, old map glowing, soft harp glissando and twinkling bells, cozy fantasy'),
 'arkadas':     (2.0, 'short cheerful cartoon fanfare with ukulele strum and happy bells, a new friend joins the team'),
 'rozet':       (1.8, 'bright little victory jingle with glockenspiel and soft sparkle, earning a badge in a cute game'),
 'fener':       (3.5, 'magical lighthouse lamp igniting with a warm whoosh of fire, rising choir-like pad and sparkling bells, wondrous and gentle'),
 'eve-donus':   (3.5, 'friendly little ghosts flying away home, airy soft whooshes, gentle wind chimes and happy cooing, sweet and calm'),
}
sec = sys.argv[1:] or list(S)
for k in sec:
    d, t = S[k]
    r = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',
        data=json.dumps({'text': t, 'duration_seconds': d, 'prompt_influence': 0.5}).encode(),
        headers={'Content-Type': 'application/json', **({'xi-api-key': os.environ['ELEVENLABS_API_KEY']} if os.environ.get('ELEVENLABS_API_KEY') else {})}, method='POST')
    try:
        b = urllib.request.urlopen(r, timeout=120).read()
        open(k + '.mp3', 'wb').write(b); print(k, len(b))
    except Exception as e:
        print(k, 'HATA', e, getattr(e, 'read', lambda: b'')()[:300])
