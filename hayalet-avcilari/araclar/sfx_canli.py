#!/usr/bin/env python3
# Canlı ülke objeleri, yuva fareleri/yarasaları ve çevre (şelale, lav) ses efektleri: ElevenLabs ses üretimi
# (sound-generation), 27 Kasım 2026. Kullanıcı: "hayvanlara, nesnelere ekleyebileceğin her şeye ses efekti ekle".
# Anahtar dosyada yok: bulut ortamında vekil ekler; başka yerde ELEVENLABS_API_KEY ortam değişkeni xi-api-key başlığına konur.
#   python3 araclar/sfx_canli.py [ad ...]   → www/sfx/canli/<ad>.m4a (yüksekliği eşitlenmiş, sonu yumuşak, mono AAC 96k)
# ElevenLabs Creator aboneliğinde üretilen sesler ticari kullanıma açıktır. Her üretim kredi harcar.
import json, os, subprocess, sys, tempfile, urllib.request
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI = os.path.join(KOK, 'www', 'sfx', 'canli')
ORTAK = ', short clean sound effect for a cute cozy cartoon game, soft and friendly, not scary, no music'
S = {
 # canlı ülke objeleri (anahtar → oyundaki obje): sesi animasyon oynarken çalar
 'panda':       (1.6, 'cute panda munching and crunching a bamboo stalk'),
 'komodo':      (1.2, 'small lizard soft hiss with a quick tongue flick'),
 'ejder-alev':  (1.5, 'small dragon statue breathing a short puff of fire, warm whoosh'),
 'leylek':      (1.6, 'stork flapping its wings a few times and clattering its beak'),
 'fil':         (2.0, 'baby elephant happy trumpet followed by a little water spray splash'),
 'penguen':     (1.2, 'cute penguin squawk and flipper flapping'),
 'lemur':       (1.3, 'playful lemurs chirping and chittering'),
 'zurafa':      (1.6, 'giraffe munching acacia leaves, soft leaf rustle and chewing'),
 'flamingo':    (1.5, 'flamingos dipping heads into shallow water, soft splash and a gentle honk'),
 'gelada':      (1.4, 'monkey soft grunts and chatter while chewing grass'),
 'deve':        (1.6, 'camel low grumble and slow chewing'),
 'tavus':       (1.6, 'peacock tail feathers fanning open with a soft rustle and one short call'),
 'kaplan':      (1.4, 'tiger cub soft playful purr growl'),
 'kunduz':      (1.2, 'beaver slapping its tail on water, splash'),
 'aksolotl':    (1.2, 'tiny bubbles popping underwater, bloop bloop'),
 'lama':        (1.3, 'llama soft hum and a little snort'),
 'papagan':     (1.4, 'macaw parrot squawk and quick wing flutter, tropical'),
 'yavru-ejder': (1.3, 'baby dragon tiny sneeze with a puff of smoke'),
 # yuva canlıları
 'fare-kac':    (1.2, 'several tiny mice squeaking and scurrying away quickly'),
 'yarasa-kac':  (1.5, 'small bats fluttering their wings and flying away with tiny squeaks'),
 'fare-cik':    (0.8, 'one tiny mouse squeak'),
 # çevre (yakındayken alçak sesle döngü)
 'selale':      (4.0, 'small waterfall gentle rushing water, seamless loop'),
 'lav':         (3.0, 'lava bubbling softly, thick blub blub pops, seamless loop'),
}
os.makedirs(CIKTI, exist_ok=True)
sec = sys.argv[1:] or list(S)
for k in sec:
    d, t = S[k]
    r = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',
        data=json.dumps({'text': t + ORTAK, 'duration_seconds': d, 'prompt_influence': 0.55}).encode(),
        headers={'Content-Type': 'application/json', **({'xi-api-key': os.environ['ELEVENLABS_API_KEY']} if os.environ.get('ELEVENLABS_API_KEY') else {})}, method='POST')
    try:
        b = urllib.request.urlopen(r, timeout=120).read()
    except Exception as e:
        print(k, 'HATA', e, getattr(e, 'read', lambda: b'')()[:300]); continue
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as f:
        f.write(b); gecici = f.name
    dongu = k in ('selale', 'lav')
    sonu = '' if dongu else f',afade=t=out:st={max(0.05, d - 0.25)}:d=0.25'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', gecici, '-af', f'loudnorm=I=-18:TP=-1.5:LRA=11{sonu}',
                    '-ac', '1', '-ar', '48000', '-c:a', 'aac', '-b:a', '96k', os.path.join(CIKTI, k + '.m4a')], check=True)
    os.unlink(gecici)
    print(k, len(b), 'bayt mp3 →', k + '.m4a')
