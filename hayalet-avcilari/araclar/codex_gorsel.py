#!/usr/bin/env python3
# Codex CLI'nin görsel üretme aracıyla (kullanıcının ChatGPT hesabı; OpenAI API kredisi gerekmez) gorsel/CHATGPT-ISTEMI-UYUM.md
# paftalarını üretir ve gorsel/hamzemin/<KOD>.png'ye koyar. Kullanıcı (28 Kasım 2026): "Codex ile GPT'ye doğrudan bağlan".
#   python3 hayalet-avcilari/araclar/codex_gorsel.py Z24 Z26 ...
# Çalışma klasörü: CODEX_GORSEL_KLASOR (varsayılan /tmp/codex-gorsel). Codex "tuzak" gibi sözcükleri işlevsel tasarım sanıp
# reddedebilir; istemin çocuk oyunu için 2B sprite çizimi olduğu baştaki yönergede açıkça yazılı.
import re, subprocess, sys, os, shutil
from PIL import Image
K = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))  # hayalet-avcilari/ (kapsayıcıya göre değişir)
G = f'{K}/gorsel'; W = f'{K}/www/gorsel'
D = os.environ.get('CODEX_GORSEL_KLASOR', '/tmp/codex-gorsel'); os.makedirs(D, exist_ok=True)
t = open(f'{G}/CHATGPT-ISTEMI-UYUM.md', encoding='utf-8').read()
for kod in sys.argv[1:]:
    i = t.index(f'### {kod}')
    blok = t[i:t.index('\n### ', i + 5)] if '\n### ' in t[i + 5:] else t[i:]
    ekler = re.search(r'Ekler:(.*?)\n\n', blok, re.S); refs = []
    for ad in re.findall(r'`([^`]+)`', ekler.group(1) if ekler else ''):
        if ad.endswith('U06.png'): refs.append(f'{G}/hamui/U06.png')
        elif ad.endswith('D01.png'): refs.append(f'{G}/ham3d/D01.png')
        elif ad.startswith('gorsel/ham') and os.path.exists(f'{K}/' + ad): refs.append(f'{K}/' + ad)
        elif ad.startswith('www/gorsel/') and '…' not in ad:
            src = f'{K}/{ad}'
            if os.path.exists(src):
                p = f'{D}/ref-{os.path.basename(ad)}.png'; Image.open(src).convert('RGB').resize((384, 384)).save(p); refs.append(p)
    # "tema1-zemin.webp … tema6-zemin.webp" ve "aile-X-zemin" kalıpları
    for m in re.findall(r'(tema\d-zemin|aile-[A-Z]+-zemin|tema\d-su|dere-su|doku-[a-z]+)', ekler.group(1) if ekler else ''):
        src = f'{W}/{m}.webp'
        if os.path.exists(src):
            p = f'{D}/ref-{m}.png'
            if not os.path.exists(p): Image.open(src).convert('RGB').resize((384, 384)).save(p)
            if p not in refs: refs.append(p)
    if '…' in (ekler.group(1) if ekler else '') and 'tema1-zemin' in ekler.group(1):
        for n in range(1, 7):
            p = f'{D}/tema{n}-zemin.png'
            if not os.path.exists(p): Image.open(f'{W}/tema{n}-zemin.webp').convert('RGB').resize((384, 384)).save(p)
            if p not in refs: refs.append(p)
    istem = re.search(r'```\n(.*?)\n```', blok, re.S).group(1)
    saydam = 'TRANSPARENT' in istem.upper() and 'OPAQUE' not in istem.upper()[:400]
    on = ("Use your image generation tool to create exactly ONE image from the prompt below. This is 2D illustrated sprite art for a "
          "cute children's video game. Attached images are style and ground references only (do not copy them). Output size 1536x1024 "
          f"(landscape), PNG{' with a transparent background' if saydam else ', fully opaque'}. Save the generated image file as ./{kod}.png "
          "in the current directory (copy it from wherever the tool saves it). Do not write any other files. When done, print the saved path.\n\n")
    open(f'{D}/istem-{kod}.txt', 'w').write(on + istem)
    args = ['codex', 'exec', '--skip-git-repo-check', '-s', 'workspace-write', '-C', D]
    for r in refs[:10]: args += ['--image', r]
    args.append('-')
    with open(f'{D}/istem-{kod}.txt') as fi, open(f'{D}/codex-{kod}.log', 'w') as fo:
        subprocess.run(args, stdin=fi, stdout=fo, stderr=subprocess.STDOUT, timeout=1200)
    ok = os.path.exists(f'{D}/{kod}.png')
    print(kod, 'TAMAM' if ok else 'YOK', len(refs), 'ek', 'saydam' if saydam else 'opak', flush=True)
    if ok: shutil.copy(f'{D}/{kod}.png', f'{G}/hamzemin/{kod}.png')
