# Hayalet Avcıları: Dünya Turu hikâyesi görselleri için ChatGPT istem paketi

Hazırlandı: 24 Kasım 2026 (oyun 3.21.0, hikâye şartnamesi `../HIKAYE.md`). Kullanıcının isteği: *"hikâye metni gelince
bana göster, görselleri ChatGPT yaptır"*. Bu paket Dünya Turu hikâyesinin görsellerini ürettirir:
- Dostluk Haritası,
- açılış ve final resimleri,
- 51 ülkenin hatıra simgeleri.

Üslup, onaylı karakter paftalarıyla (`ham3d/D01–D06`) ve arayüz paftalarıyla (`hamui/U01–U10`) aynıdır. Kodu Evren
yazar. Resim gelmezse oyun emoji ve kod çizimiyle çalışır.

## Yerel Claude için iş sırası

1. ChatGPT'de **yeni bir sohbet** aç ve aşağıdaki **HİKÂYE ANA İSTEMİ**'ni bir kez gönder.
2. Üslup referansı ekle:
   - H12 için `ham3d/D01.png` … `D06.png`;
   - kalan paftalar için `hamui/U06.png` ve `ham3d/D01.png`.
3. Her resmi `gorsel/hamhikaye/<KOD>.png` olarak kaydet. Her paftadan sonra commit ve push yap, ilerlemeyi
   `gorsel/hamhikaye/DURUM.md`'ye yaz.
4. **Sıra:** H10, H11, H12, sonra H01–H09.
5. **Kullanıcı onayı:** H10, H11 ve H12'yi kullanıcıya tek tek göster; onay gelmeden sonrakine geçme. Hatıra paftalarını
   (H01–H09) toplu göstermek yeterli.
6. **Karakter kuralları** (`ham3d/DURUM.md`):
   - Kinkin, Veryi, Kornet, Kenit, Ponko ve Fanatik erkek; Marli, Güllu, Rani, Beri, Silsen ve Serçin kız.
   - Açık kostüm yok, makyaj yok.
7. **İçerik kuralı:** din, siyaset, bayrak, harita üzerinde sınır çizgisi ve yazı yok.
8. Giriş, şifre, ödeme ve ChatGPT'nin görsel sınırı kullanıcıya bırakılır. Oyun koduna dokunma.

Toplam **12 pafta**: 3 resim (H10–H12) ve 9 hatıra paftası (H01–H09).

---

## HİKÂYE ANA İSTEMİ (yeni sohbette bir kez)

```
You are the lead artist for the World Tour STORY of "Ghost Hunters" (Hayalet Avcıları), a cheerful top-down mobile game
for ages 13+. I will attach approved character and UI sheets as style reference.

STORY: a traveling hunter finds an old "Friendship Map" in Istanbul whose pieces have faded. Ghosts in this game are not
evil: they are lonely spirits who lost their way home. The hunters befriend each other on a journey through 51
countries; at the end, at the lighthouse at the end of the world (southern tip of South America), the friends light
the "Friendship Beacon" together and its light guides the ghosts home. Theme: friendship, warmth, wonder.

STYLE (identical on every sheet)
- Stylized 3D render like a premium casual mobile game: smooth vinyl-toy / soft clay materials, soft studio lighting
  from the top-left, gentle rim light, subtle ambient occlusion, rounded forms, saturated harmonious colors.
- Characters keep EXACTLY the approved designs. Boys stay boys and girls stay girls; no revealing clothes, no make-up,
  confident friendly faces.
- Ghosts are cute: white or pale-lilac sheet ghosts with big dark eyes and soft smiles, never scary or gory.
- No text, letters, numbers, logos, flags, borders between countries, religious symbols or watermarks anywhere.
  Do not copy any existing game, film or brand.

FORMAT
- Icon sheets: one PNG, exactly 1536 x 1024 px, TRANSPARENT background, grid 3 x 2 (512 px cells), every object fully
  inside its cell with at least 24 px margin, centered, one bold object per cell, slight 3/4 view, readable at 48 px.
- Illustrations: one PNG, exactly 1536 x 1024 px, full scene, opaque background.

Reply only with the image. Confirm you understood by saying "ready".
```

## Resimler

### H10: Dostluk Haritası (defter ve bilmece ekranı)

Kod bu resmi 10 parçaya bölüp parçaları bilmece çözüldükçe açar; resmin kendisinde parça çizgisi olmasın.

```
Illustration H10: the "Friendship Map", a whole stylized world map drawn on an old warm parchment, seen from straight
above, filling the whole 1536 x 1024 image (no table, no hands). Soft painted continents in gentle greens and sand
colors, light-blue oceans with tiny painted waves, a few cute ghost doodles and small compass-rose ornament in a corner.
A dotted golden travel route starts in Turkey, goes through Europe, down around Africa, across the Middle East and
Asia, over the Pacific to North America and down to the southern tip of South America, where a tiny glowing lighthouse
stands. No text, no labels, no country borders, no flags.
```

### H11: Açılış (hikâyenin ilk sahnesi)

Gezgin her avcı olabildiği için resimde avcı yoktur.

```
Illustration H11: a cozy old attic in Istanbul at golden sunset. An opened wooden travel chest in the center; inside,
a rolled old parchment map is glowing softly with golden light and tiny sparkles. Through a round window: the
Bosphorus with ferries and seagulls and the silhouette of the Galata Tower. A small friendly ghost peeks curiously
from behind the chest. Warm, magical, inviting mood. No people, no text.
```

### H12: Final (dünyanın ucundaki fener)

```
Illustration H12: all twelve hunters of the attached approved sheets standing together on rocky ground in front of a
red-and-white striped lighthouse at the southern tip of South America at dusk, cheering and holding hands, some
waving. The lighthouse lamp shines a big warm golden beam across a calm sea; dozens of happy little ghosts float along
the beam toward the horizon, waving goodbye. Sky in soft purple, pink and orange; first stars appearing. Keep every
hunter EXACTLY as in the approved sheets (faces, hair, outfits, colors, signature weapons). No text.
```

## Hatıra paftaları (H01–H09)

Hücre sırası, rota sırasıdır (ülke 1 = H01 hücre 1, ülke 7 = H02 hücre 1, …; H09'da yalnız 3 hücre dolu).

*Hücre listesi hikâye metni onaylanınca eklenecek.*
