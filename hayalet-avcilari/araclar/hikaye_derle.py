#!/usr/bin/env python3
# Dünya Turu hikâyesi: bir taslak klasöründen (hikaye-taslaklari/<yazar>/) okunur metin ve oyun verisi üretir.
#   python3 araclar/hikaye_derle.py <yazar>            → hikaye-taslaklari/<yazar>/HIKAYE-METIN.md
#   python3 araclar/hikaye_derle.py <yazar> --oyuna    → ayrıca www/hikaye-veri.js (oyundaki metin bu sürüm olur)
# Taslak biçimi: katilis.json {avci: [{k,m}]}, ulke.json (ya da ulke1–3.json) {KOD: {hatira: {ad, simge, not}, sahne: [{k,m}]}},
# bilmece.json {bilmeceler: [{soru, secenek[3], dogru, bolum[]}], final: [{k,m}]}. Şartname: HIKAYE.md.
import json, os, sys

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TAS = os.path.join(KOK, 'hikaye-taslaklari')
ADLAR = {'kinkin': 'Kinkin', 'veryi': 'Veryi', 'kornet': 'Kornet', 'mark': 'Marli', 'kent': 'Kenit', 'ponko': 'Ponko', 'gul': 'Güllu',
         'rani': 'Rani', 'beti': 'Beri', 'fanatik': 'Fanatik', 'silsen': 'Silsen', 'sercin': 'Serçin'}
SIRA = list(ADLAR)
KATILIS_ULKE = [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43]
ETIKET = {'anlatici': '📜 Anlatıcı', 'gezgin': '🧭 Gezgin', 'arkadas': '🤝 Arkadaş'}
YAZAR = {'evren': 'Evren (deepseek/glm), bulut Claude düzeltti', 'claude': 'Claude (bulut oturum)', 'chatgpt': 'ChatGPT'}


def oku(yazar):
    d = os.path.join(TAS, yazar)
    kat = json.load(open(os.path.join(d, 'katilis.json')))
    ulke = {}
    if os.path.exists(os.path.join(d, 'ulke.json')):
        ulke = json.load(open(os.path.join(d, 'ulke.json')))
    else:
        for p in (1, 2, 3):
            ulke.update(json.load(open(os.path.join(d, f'ulke{p}.json'))))
    bil = json.load(open(os.path.join(d, 'bilmece.json')))
    return d, kat, ulke, bil


def denetle(U, kat, ulke, bil):
    hata = []
    for a in SIRA:
        if not kat.get(a): hata.append(f'katılış eksik: {a}')
    for u in U:
        x = ulke.get(u['kod'])
        if not x or not x.get('hatira') or not x.get('sahne'): hata.append(f'ülke eksik: {u["kod"]}'); continue
        if u['sira'] <= 2 and any(s['k'] == 'arkadas' for s in x['sahne']): hata.append(f'{u["kod"]}: ilk iki ülkede arkadaş olmaz')
    if len(bil.get('bilmeceler', [])) != 10: hata.append('bilmece sayısı 10 değil')
    for i, b in enumerate(bil.get('bilmeceler', []), 1):
        if len(b.get('secenek', [])) != 3 or b.get('dogru') not in (0, 1, 2): hata.append(f'bilmece {i}: seçenek/doğru')
    if not bil.get('final'): hata.append('final eksik')
    return hata


def metin(yazar, U, kat, ulke, bil):
    o = [f'# Hayalet Avcıları — Dünya Turu hikâyesi ({YAZAR.get(yazar, yazar)})', '',
         'Gezgin, turu başlatan oyuncunun seçili avcısıdır. Öbür 11 avcı sırayla şu ülkelerde katılır (gezgin listeden çıkarılır): '
         + ', '.join(f"{U[s - 1]['ad']} ({s})" for s in KATILIS_ULKE) + '. "Arkadaş", en son katılan avcıdır.',
         'Satırlarda konuşanın adı etiket olarak görünür; cümlelerin içinde ad geçmez.', '',
         '## Açılış', '', "İstanbul'da eski bir sandıkta silik bir **Dostluk Haritası** bulunur. Yolculuk Türkiye'de başlar.", '',
         '## Avcıların katılış sahneleri', '']
    for a in SIRA:
        o.append(f'### {ADLAR[a]}')
        o += [f"- **{ADLAR[a] if s['k'] == 'katilan' else 'Gezgin'}:** {s['m']}" for s in kat[a]]
        o.append('')
    o += ['## Ülkeler, hatıralar ve varış sahneleri', '']
    for u in U:
        x = ulke[u['kod']]; h = x['hatira']
        o += [f"### {u['sira']}. {u['ad']} — {h['simge']} {h['ad']}", f"*{h['not']}*", '']
        o += [f"- **{ETIKET.get(s['k'], s['k'])}:** {s['m']}" for s in x['sahne']]
        if u['sira'] % 5 == 0 and u['sira'] <= 50:
            n = u['sira'] // 5; b = bil['bilmeceler'][n - 1]
            o += ['', f'> **🔎 Bilmece {n}** (ülke {5 * n - 4}–{5 * n} hatıraları)  '] + [f'> {l}  ' for l in b['soru'].split('\n')]
            o += ['> Seçenekler: ' + ' · '.join((f'**{s} ✅**' if j == b['dogru'] else s) for j, s in enumerate(b['secenek'])), '>',
                  f"> **📖 Bölüm {n}:** " + ' '.join(b['bolum'])]
        o.append('')
    o += ['## Final: Dünyanın ucundaki fener', ''] + [f"- **{ETIKET.get(s['k'], s['k'])}:** {s['m']}" for s in bil['final']]
    o += ['', 'Ödül: her bilmece 100 💰 + 2 💎; on bilmece çözülünce 🧭 Gezgin rozeti.']
    return '\n'.join(o) + '\n'


def veri(yazar, U, kat, ulke, bil):
    js = lambda s: json.dumps(s, ensure_ascii=False)
    sat = lambda L, g: '[\n' + ''.join(f"{g}  {{ k: {js(s['k'])}, m: t({js(s['m'])}) }},\n" for s in L) + g + ']'
    j = ['/* ============================================================',
         '   HAYALET AVCILARI — DÜNYA TURU HİKÂYESİ: METİNLER (3.21.0)',
         f'   Yazar: {YAZAR.get(yazar, yazar)}. Kaynak: hikaye-taslaklari/{yazar}/ (araclar/hikaye_derle.py üretir; elle düzenleme).',
         '   Şartname: HIKAYE.md. Bu dosya yalnız veri içerir; kurallar ve arayüz hikaye.js\'te.',
         '   Satır: { k: "anlatici" | "gezgin" | "arkadas" | "katilan", m: metin }. Cümle içinde avcı adı geçmez.',
         '   ============================================================ */',
         '// Katılış sırası (gezgin listeden çıkarılır) ve katılış ülkelerinin rota sırası',
         'const HIKAYE_AVCI_SIRASI = ' + js(SIRA).replace('","', '", "') + ';',
         'const HIKAYE_KATILIS_ULKE = ' + js(KATILIS_ULKE).replace(',', ', ') + ';',
         '// Ödül', 'const HIKAYE_BILMECE_PARA = 100, HIKAYE_BILMECE_ELMAS = 2;', '', 'const HIKAYE_KATILIS = {']
    j += [f'  {a}: {sat(kat[a], "  ")},' for a in SIRA]
    j += ['};', '', 'const HIKAYE_ULKE = {']
    for u in U:
        x = ulke[u['kod']]; h = x['hatira']
        j += [f"  {u['kod']}: {{ // {u['sira']}. {u['ad']}",
              f"    hatira: {{ ad: t({js(h['ad'])}), simge: {js(h['simge'])}, not: t({js(h['not'])}) }},",
              f"    sahne: {sat(x['sahne'], '    ')},", '  },']
    j += ['};', '', 'const HIKAYE_BILMECE = [']
    for b in bil['bilmeceler']:
        j += ['  {', f"    soru: t({js(b['soru'])}),", '    secenek: [' + ', '.join(f't({js(s)})' for s in b['secenek']) + '],',
              f"    dogru: {int(b['dogru'])},", '    bolum: [' + ', '.join(f't({js(s)})' for s in b['bolum']) + '],', '  },']
    j += ['];', '', f"const HIKAYE_FINAL = {sat(bil['final'], '')};", '']
    return '\n'.join(j)


if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__ or 'kullanım: hikaye_derle.py <yazar> [--oyuna]')
    yazar = sys.argv[1]
    U = json.load(open(os.path.join(TAS, 'ulkeler.json')))
    d, kat, ulke, bil = oku(yazar)
    h = denetle(U, kat, ulke, bil)
    if h: print('\n'.join(h)); sys.exit(1)
    open(os.path.join(d, 'HIKAYE-METIN.md'), 'w').write(metin(yazar, U, kat, ulke, bil))
    print(f'{yazar}: HIKAYE-METIN.md yazıldı')
    if '--oyuna' in sys.argv:
        open(os.path.join(KOK, 'www', 'hikaye-veri.js'), 'w').write(veri(yazar, U, kat, ulke, bil))
        print('www/hikaye-veri.js bu sürümle yazıldı')
