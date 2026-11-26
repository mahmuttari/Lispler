# Hayalet Avcıları — kalıcı kurallar (kullanıcının kararları)

- Yanıtlar Türkçe ve ayrıntılı.
- **Görseller:** Oyundaki bütün görseller ChatGPT'ye ürettirilir (yerel Claude, `gorsel/YEREL-CLAUDE-SIRA.md` ve `gorsel/CHATGPT-ISTEMI-*.md`).
  Kodla çizilmiş görsel kalmaz; kod çizimi yalnız resim yüklenemezse yedek olarak durur. Bunu kullanıcının her seferinde söylemesine
  gerek yoktur (25 Kasım 2026). Kesim: `python3 araclar/gorsel_kes.py --ek` (bütün ek paftalar; eski görsellere dokunmaz) ya da
  `--ek R47 J02` (yalnız verilen paftalar; saniyeler sürer, bütün ek kesim artık dakikalar sürüyor).
  Bulut oturumu da üretebilir: `python3 araclar/chatgpt_uret.py <KOD…>` (ChatGPT görsel modeli, OpenAI Images API; aynı ana istem,
  aynı üslup referansları; anahtarı ortamın vekili ekler). OpenAI hesabında kredi yoksa `credit_balance_exhausted` döner.
- **İş bölümü (kullanıcı, 26 Kasım 2026):** "Hiçbir görseli sen hazırlama, tüm görsel işini ChatGPT'ye yaptır; sen yalnız
  yönet ve kodlamayı yaptır, en verimli şekilde çalış; akıl yürütme Fable, kodlama uygun gördüğün modeller." Claude görsel
  üretmez ya da çizmez (PIL, SVG, kod çizimi dahil). Yaptığı yalnız şunlar: ChatGPT istemini yazmak, gelen paftayı kesmek
  ve oyuna bağlatmak. Akıl yürüten işler (şartname, inceleme, hata ayıklama planı) Fable modeliyle alt ajana verilir. Kod
  Evren'e (deepseek-v4.1-flash, glm-5.3) ya da NVIDIA modellerine yazdırılır.
- **Kod:** Oyun kodunu Evren yazar; Claude şartname, inceleme, sınama, commit ve belge işini yapar. Birkaç satırlık düzeltme doğrudan.
  Evren hesabı aynı anda en çok 2 istek kabul eder.
- **Yayın:** Kullanıcı açıkça **"yayınla"** demeden Play'e hiçbir şey yüklenmez, yayınlanmaz, incelemeye gönderilmez ("gönder",
  "hazırla" yayın izni değildir).
- Ses efektleri ElevenLabs ile; müzik Suno (kredi biterse ElevenLabs müzik).
- Gizli anahtarlar hiçbir dosyaya, commit'e ya da sohbete yazılmaz.
