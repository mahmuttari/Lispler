# Kelime Bilcek kodunu ücretsiz modellere hata taraması için gönderir (DENETIM.md › 1.0.1).
# Kullanım (bulut oturumu; anahtarları proxy ekler): python3 -I araclar/model-tarama.py nvidia|gemini a|b > sonuc.json
# a: oyun.js + kurallar, b: diğer dosyalar (proxy gövde sınırı ~140 KB). Bulgular elle doğrulanmadan düzeltilmez.
import json, sys, re, urllib.request, pathlib
K = pathlib.Path(__file__).resolve().parent.parent
GRUP = sys.argv[2]
DOSYALAR = ['www/oyun.js', 'firebase/database.rules.json'] if GRUP == 'a' else ['www/reklam.js', 'www/kelime.js', 'www/index.html',
            'firebase/database.rules.json', 'worker/worker.js', 'capacitor.config.json', 'android/app/src/main/AndroidManifest.xml']
parca = []
for d in DOSYALAR:
    metin = (K / d).read_text()
    if d == 'www/kelime.js':  # sözlük verisini kısalt (yalnız işlevler önemli)
        metin = re.sub(r'(const CATEGORY_WORDS = \{).*?(\n\};)', r'\1 /* 25 kategori × kelime listesi (kısaltıldı) */\2', metin, flags=re.S)
    satirli = '\n'.join(f'{i+1}|{s}' for i, s in enumerate(metin.split('\n')))
    parca.append(f'===== DOSYA: {d} =====\n{satirli}')
ISTEM = """Sen kıdemli bir mobil/web güvenlik ve kalite denetçisisin. Aşağıda "Kelime Bilcek" adlı çevrimiçi Türkçe kelime
düellosu oyununun kaynak kodu var: Capacitor 8 Android uygulaması (WebView), Firebase compat 10.12 (Google girişi +
Realtime Database), Firebase RTDB güvenlik kuralları, kelime doğrulayan bir Cloudflare Worker (Workers AI), AdMob reklamları
(@capacitor-community/admob). Modlar: Hızlı (10 round eşzamanlı), Tenis/duel (3 round sıralı), Zincir (son harf).

Görev: GERÇEK hataları bul: çökmeler, yanlış oyun mantığı, yarış koşulları (iki oyuncu aynı anda yazınca), istemci ile
database.rules.json arasında uyuşmazlık (kuralın reddedeceği yazımlar), güvenlik açıkları, XSS, bellek/dinleyici
sızıntıları, Android/Capacitor'a özgü sorunlar, reklam kurallarının ihlali (maç sırasında reklam olmamalı; ilk 3 maçta
geçiş reklamı yok; iki reklam arası ≥5 dk; saatte ≤4), hesap silmenin eksik bıraktığı veri. Üslup/biçim önerisi YAZMA.
Emin olmadığın şeyi yazma; her bulgu için dosya ve satır numarasını ver.

Yanıtın YALNIZ şu JSON dizisi olsun (başka metin yok):
[{"dosya": "...", "satir": 123, "onem": "kritik|yuksek|orta|dusuk", "baslik": "kısa Türkçe başlık",
  "aciklama": "neden hata, hangi durumda ortaya çıkar (Türkçe)", "oneri": "nasıl düzeltilir (Türkçe)"}]
En önemli en fazla 25 bulgu.

""" + '\n\n'.join(parca)
saglayici = sys.argv[1]
if saglayici == 'nvidia':
    url = 'https://integrate.api.nvidia.com/v1/chat/completions'
    govde = {'model': 'nvidia/nemotron-3.5-lightning-30b-a3b', 'messages': [{'role': 'system', 'content': '/no_think'}, {'role': 'user', 'content': ISTEM}], 'chat_template_kwargs': {'enable_thinking': False}, 'max_tokens': 32000, 'temperature': 0.2, 'stream': True}
    bas = {'Content-Type': 'application/json', 'Authorization': 'Bearer dummy'}
else:
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse'
    govde = {'contents': [{'parts': [{'text': ISTEM}]}], 'generationConfig': {'temperature': 0.2, 'maxOutputTokens': 32000, 'responseMimeType': 'application/json', 'thinkingConfig': {'includeThoughts': True}}}
    bas = {'Content-Type': 'application/json', 'x-goog-api-key': 'dummy'}
import os
if os.environ.get('DOKUM'): open(os.environ['DOKUM'],'wb').write(json.dumps(govde, ensure_ascii=False).encode('utf-8')); sys.exit()
if os.environ.get('BOYUT'): print(len(json.dumps(govde, ensure_ascii=False).encode('utf-8'))); sys.exit()
r = urllib.request.urlopen(urllib.request.Request(url, json.dumps(govde, ensure_ascii=False).encode('utf-8'), bas), timeout=1200)
cikti = []
for satir in r:
    satir = satir.decode().strip()
    if not satir.startswith('data:'): continue
    veri = satir[5:].strip()
    if veri == '[DONE]': break
    d = json.loads(veri)
    if saglayici == 'nvidia':
        for c in d.get('choices', []):
            de = c.get('delta') or {}
            cikti.append(de.get('content') or '')
            if de.get('reasoning_content') or de.get('reasoning'): sys.stderr.write('.')
            if c.get('finish_reason'): sys.stderr.write(f"\nfinish={c['finish_reason']}\n")
    else:
        for c in d.get('candidates', []):
            for p in (c.get('content') or {}).get('parts', []):
                if p.get('thought'): sys.stderr.write('.')
                else: cikti.append(p.get('text', ''))
print(''.join(cikti))
