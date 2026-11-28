# Deneme yayını için www kopyası: kodla yüklenen görseller tek pakete, Firebase betikleri çıkarılır (yalnız kopya).
import os, re, shutil, base64, json, sys
KAYNAK = sys.argv[2] if len(sys.argv) > 2 else '/home/user/Lispler/hayalet-avcilari/www'
HEDEF = sys.argv[1]
shutil.rmtree(HEDEF, ignore_errors=True)
shutil.copytree(KAYNAK, HEDEF)
gd = os.path.join(HEDEF, 'gorsel')
GERCEK = ('esya-', 'ui-', 'kart-', 'guc-', 'gel-')
paket = {}
for f in sorted(os.listdir(gd)):
    if not f.endswith('.webp'): continue
    k = f[:-5]
    if k.startswith(GERCEK) or k in ('menu-arka', 'giris-kahraman'): continue
    with open(os.path.join(gd, f), 'rb') as h:
        paket[k] = 'data:image/webp;base64,' + base64.b64encode(h.read()).decode()
    os.remove(os.path.join(gd, f))
# Artifact tek dosya sınırı 16 MB: paket en çok ~7 MB'lık parçalara bölünür (gorsel-paket.js, gorsel-paket-2.js …)
parcalar, simdiki, boy = [], {}, 0
for k, v in paket.items():
    if boy + len(v) > 7_000_000 and simdiki:
        parcalar.append(simdiki); simdiki, boy = {}, 0
    simdiki[k] = v; boy += len(v) + len(k) + 6
if simdiki: parcalar.append(simdiki)
PAKET_ADLARI = []
for i, parca in enumerate(parcalar):
    ad = 'gorsel-paket.js' if i == 0 else f'gorsel-paket-{i + 1}.js'
    PAKET_ADLARI.append(ad)
    with open(os.path.join(HEDEF, ad), 'w') as h:
        h.write('window.GORSEL_PAKET=Object.assign(window.GORSEL_PAKET||{},' + json.dumps(parca, separators=(',', ':')) + ');\n')
g = open(os.path.join(HEDEF, 'gorsel.js')).read()
eski = 'im.src = `gorsel/${k}.webp`;'
assert eski in g
g = g.replace(eski, 'im.src = (window.GORSEL_PAKET && window.GORSEL_PAKET[k]) || `gorsel/${k}.webp`;')
open(os.path.join(HEDEF, 'gorsel.js'), 'w').write(g)
html = open(os.path.join(HEDEF, 'index.html')).read()
html = re.sub(r'<script src="https://www\.gstatic\.com/[^"]+"></script>\n?', '', html)
assert '<script src="gorsel/liste.js"></script>' in html
html = html.replace('<script src="gorsel/liste.js"></script>', ''.join(f'<script src="{ad}"></script>\n' for ad in PAKET_ADLARI) + '<script src="gorsel/liste.js"></script>')
open(os.path.join(HEDEF, 'index.html'), 'w').write(html)
for gereksiz in ('service-worker.js',):
    pass
dosyalar = [os.path.relpath(os.path.join(r, f), HEDEF) for r, _, fs in os.walk(HEDEF) for f in fs]
dosyalar = [d for d in dosyalar if d != 'index.html']
json.dump({d: d for d in sorted(dosyalar)}, open(os.path.join(os.path.dirname(HEDEF), 'deneme-files.json'), 'w'))
print(len(paket), 'görsel pakette;', len(dosyalar), 'ek dosya; paket parçaları:', ', '.join(f'{ad} {os.path.getsize(os.path.join(HEDEF, ad)) / 1e6:.1f} MB' for ad in PAKET_ADLARI))
# Artifact m4a sunmaz: sesler mp3'e çevrilir, kodda uzantı değiştirilir (yalnız kopya)
import subprocess
for r, _, fs in os.walk(os.path.join(HEDEF, 'sfx')):
    for f in fs:
        if f.endswith('.m4a'):
            a = os.path.join(r, f); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a, '-c:a', 'libmp3lame', '-b:a', '96k', a[:-4] + '.mp3'], check=True); os.remove(a)
for js in os.listdir(HEDEF):
    if js.endswith('.js'):
        p = os.path.join(HEDEF, js); t = open(p).read()
        if '.m4a' in t: open(p, 'w').write(t.replace('.m4a"', '.mp3"')); print('m4a→mp3:', js)
dosyalar = [os.path.relpath(os.path.join(r, f), HEDEF) for r, _, fs in os.walk(HEDEF) for f in fs if f != 'index.html' or r != HEDEF]
json.dump({d: d for d in sorted(dosyalar)}, open(os.path.join(os.path.dirname(HEDEF), 'deneme-files.json'), 'w'))
