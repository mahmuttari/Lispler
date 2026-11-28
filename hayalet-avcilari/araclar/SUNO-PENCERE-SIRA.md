# Suno (Chrome penceresi) — ülke müzikleri iş sırası

> **GERÇEKÇİ KİP (28 Kasım 2026):** Kullanıcı "polifonik değil gerçekçi yapalım" dedi. Aşağıdaki tarifler gerçek halk
> müzisyeninin canlı icrası, geleneksel tek sesli/heterofonik doku, eklenmiş armoni yok biçiminde yenilendi. 27 Kasım'daki 50
> şarkı eski tariflerle yapıldı. **Bu ay yalnız 10 indirme hakkı kaldı:** kullanıcı onay vermeden toplu üretim yapma; önce
> kullanıcının seçtiği deneme ülkeleri (Library'de dinletip onaylanan tek sürüm indirilir), kalanı indirme hakkı yenilenince.

Üreten: `araclar/suno_pencere_sira.py` (elle düzenleme; istem değişirse betiği yeniden çalıştır).

Kullanıcı 27 Kasım 2026: *"Suno aylık aboneliği aldım ama onu Chrome'da pencereden kullanacağız. Şarkıları peş peşe ekleyip
hazırlat, tek seferde indirebilirsin. O sanatsal güzel müzikleri hazırla."* Amaç: Dünya Turu ülke müziklerini her ülkenin kendi
**sanatsal** müzik geleneğiyle, sakin ve melodik yeniden üretmek. **Türkiye olduğu gibi kalır** (listede yok).

## İndirme sınırı (önemli)

Suno 3 Eylül 2026'dan beri aylık **indirme** sınırı uyguluyor: Pro 20, Premier 60 indirme/ay (üretim kredisi ayrı;
help.suno.com/en/articles/13876865, suno.com/blog/suno-updates-tos). Bu yüzden:

- Her ülke için Suno iki sürüm üretir; **yalnız birini** indir (iki sürüm = iki indirme). Seçim: süresi 1:30'dan uzun,
  girişi ve sonu dışında düzenli akan; ikisi de uygunsa **1. sürüm**.
- Hesap Pro ise (20/ay) yalnız ilk 20 satırı yap, kalanı gelecek aya kalır; Premier ise (60/ay) hepsi sığar.
  Hesabın planını suno.com/account sayfasından gör, DURUM satırına yaz.
- Önce **1 numarayı** üret, indir, aşağıdaki işleme adımını çalıştır; sorun yoksa kalanı peş peşe sıraya koy.

## Suno'da her satır için

1. suno.com/create → **Custom** (Özel) mod. **Instrumental** açık. Model: en yeni sürüm (v5 ya da üstü).
2. **Style of Music** kutusuna satırdaki *Stil* metnini olduğu gibi yapıştır.
3. **Exclude Styles** (Advanced Options içinde) kutusuna: `vocals, singing, choir, heavy drums, driving dance beat, EDM, trap, dubstep, rock, distorted guitar, accordion, bagpipes, shawm, drone, synth pads, orchestral strings, reverb wash, breakdown, fade-out, polyphonic arrangement, chord progression, counter-melody, piano chords, string section, pop production, drum machine`
4. **Title**: satırdaki başlık (`Hayalet Avcilari - KOD`). Lyrics boş kalır.
5. Create. Sonraki satıra geç (Suno istekleri sıraya alır; bitmesini beklemek gerekmez).
6. Hepsi bitince Library'den her ülkenin seçilen sürümünü **MP3** olarak indir, adını `KOD.mp3` yap.

## İndirdikten sonra

Mac'te numpy ve ffmpeg varsa her dosya için (depo kökünden):

```
python3 hayalet-avcilari/araclar/muzik_kes.py isle --kod KOD --gorev suno-pencere-2026-11 ~/Downloads/KOD.mp3
```

Bu, `www/muzik/KOD-dongu.ogg`, `KOD-giris.ogg`, `araclar/muzik-kayit.json` ve `www/ulke-muzikleri.js`'i yazar; bunları
commit et (`git pull --no-rebase` sonra push). numpy/ffmpeg yoksa ya da araç hata verirse MP3'leri **ayrı bir dala**
(`suno-ham`, yalnız `muzik-ham/KOD.mp3`) push et; bulut oturumu işler ve o dalı siler. MP3'ler asıl dala konmaz (boyut).
Şarkı sözü, sanatçı adı ya da başka bir eserin adı istemlere eklenmez.

## Sıra

| # | Kod | Ülke | Seçim | Ana çalgı | Durum |
|---|---|---|---|---|---|
| 1 | KR | Güney Kore | A Saray oda müziği: yanggeum | yanggeum | bekliyor |
| 2 | MX | Meksika | C Sade solo: jarocho arpı | arpa jarocha | bekliyor |
| 3 | UZ | Özbekistan | C Sade solo: Kaşgar rubabı | rubab (Kaşgar) | bekliyor |
| 4 | AO | Angola | A Luanda serenadı: marimba | marimba | bekliyor |
| 5 | MA | Fas | C Sade solo: Amaziğ lutarı | lutar | bekliyor |
| 6 | MZ | Mozambik | C Sade solo: Ndau mbirası | mbira (Ndau) | bekliyor |
| 7 | KE | Kenya | B Kıyı Mijikenda ezgi deyişi | marimba | bekliyor |
| 8 | PL | Polonya | B Halk ezgisi: Szła dzieweczka | cymbały | bekliyor |
| 9 | ES | İspanya | B Halk ezgisi: El Vito | bandurria | bekliyor |
| 10 | GH | Gana | B Çocuk ezgisi: Kye Kye Kule | gyil | bekliyor |
| 11 | PS | Filistin | B Halk ezgisi: Ya Zarif et-Tul | buzuk | bekliyor |
| 12 | ZA | Güney Afrika | B Geleneksel: Shosholoza | marimba | bekliyor |
| 13 | AF | Afganistan | B Halk ezgisi: Molla Muhammed Can | Herat dutarı | bekliyor |
| 14 | MY | Malezya | B Halk ezgisi: Rasa Sayang | caklempong | bekliyor |
| 15 | PK | Pakistan | B Halk ezgisi: Lathe Di Chadar | tumbi | bekliyor |
| 16 | UG | Uganda | B Geleneksel: Ssematimba ne Kikwabanga | amadinda | bekliyor |
| 17 | VN | Vietnam | C Sade solo: đàn t'rưng | đàn t'rưng | bekliyor |
| 18 | YE | Yemen | A San'a şarkı sanatı: kanbus | kanbus (turbi) | bekliyor |
| 19 | CI | Fildişi Sahili | C Sade solo: Senufo balafonu | Senufo balafonu (djegele) | bekliyor |
| 20 | AR | Arjantin | B Halk ezgisi: Zamba de Vargas | charango | bekliyor |
| 21 | EG | Mısır | C Sade solo: simsimiyye | simsimiyye | bekliyor |
| 22 | FR | Fransa | B Ezgi: Au clair de la lune | épinette des Vosges | bekliyor |
| 23 | IN | Hindistan | B Halk ezgisi: Kesariya Balam | sitar | bekliyor |
| 24 | MG | Madagaskar | B Geleneksel: Afindrafindrao | marovany | bekliyor |
| 25 | PE | Peru | B Eski ezgi: El Cóndor Pasa | charango | bekliyor |
| 26 | RU | Rusya | B Halk ezgisi: Vo pole beryoza | balalayka | bekliyor |
| 27 | SA | Suudi Arabistan | B Necid samri deyişi | ud | bekliyor |
| 28 | US | ABD | B Eski ezgi: Simple Gifts | hammered dulcimer | bekliyor |
| 29 | MM | Myanmar | A Mahagita: saung arpı | saung gauk | bekliyor |
| 30 | CA | Kanada | C Sade solo: akustik gitar | akustik gitar | bekliyor |
| 31 | IR | İran | A Mahur destgâhı: santur | santur | bekliyor |
| 32 | JP | Japonya | A Jiuta oda müziği: şamisen | şamisen | bekliyor |
| 33 | NG | Nijerya | C Sade solo: İgbo ubo | ubo | bekliyor |
| 34 | CO | Kolombiya | C Sade solo: chonta marimbası | marimba de chonta | bekliyor |
| 35 | DE | Almanya | C Sade solo: zither | zither | bekliyor |
| 36 | DZ | Cezayir | B Geleneksel: Kum Tara | mandol | bekliyor |
| 37 | IQ | Irak | A Bağdat çalgısı: santur | santur | bekliyor |
| 38 | UA | Ukrayna | C Sade solo bandura | bandura | bekliyor |
| 39 | GB | Birleşik Krallık | C Sade solo: Kelt arpı | Kelt arpı (clàrsach) | bekliyor |
| 40 | SD | Sudan | B Eski şarkı: Azza fi Hawak | ud | bekliyor |
| 41 | TH | Tayland | B Klasik ezgi: Lao Duang Duean | khim | bekliyor |
| 42 | BD | Bangladeş | C Sade solo: dotara | dotara | bekliyor |
| 43 | CD | Kongo DC | C Sade solo: likembe | likembe | bekliyor |
| 44 | IT | İtalya | C Sade solo: İtalyan arpı | arp | bekliyor |
| 45 | PH | Filipinler | C Sade solo: kulintang | kulintang | bekliyor |
| 46 | BR | Brezilya | C Sade solo: Brezilya gitarı | gitar (violão) | bekliyor |
| 47 | ID | Endonezya | A Cava saray gamelanı (yumuşak) | gender | bekliyor |
| 48 | TZ | Tanzanya | C Sade solo: ilimba | ilimba | bekliyor |
| 49 | CN | Çin | C Sade solo: guzheng | guzheng | bekliyor |
| 50 | ET | Etiyopya | B Geleneksel: Tizita | krar | bekliyor |

### 1. KR — Güney Kore (A: Saray oda müziği: yanggeum)

- Başlık: `Hayalet Avcilari - KR`
- Stil (889 karakter):

```
Yanggeum hammered dulcimer leading Korean jeongak court chamber music in a brighter pungnyu style, with gayageum, soft janggu and a very quiet danso flute. Yanggeum hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Graceful melody in the pyeongjo pentatonic mode, poised and unhurried. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 90 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 2. MX — Meksika (C: Sade solo: jarocho arpı)

- Başlık: `Hayalet Avcilari - MX`
- Stil (862 karakter):

```
Solo arpa jarocha harp leading Mexican son jarocho from Veracruz, with softly strummed jarana. Solo arpa jarocha harp in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Sparkling arpeggios and a bright major-key melody over the sesquialtera 6/8 against 3/4 lilt, kept gentle. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 3. UZ — Özbekistan (C: Sade solo: Kaşgar rubabı)

- Başlık: `Hayalet Avcilari - UZ`
- Stil (851 karakter):

```
Solo Kashgar rubab leading Uzbek Fergana-Tashkent style music, with very soft doira frame drum. Solo Kashgar rubab in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright dance-like melody in a major-leaning mode, rapid tremolo on long notes and rhythmic strokes. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 4. AO — Angola (A: Luanda serenadı: marimba)

- Başlık: `Hayalet Avcilari - AO`
- Stil (864 karakter):

```
Marimba xylophone leading Angolan traditional art music in a tender Luanda serenade style, with kissange thumb piano and soft acoustic guitar. Marimba xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright pentatonic and major-key phrases, very soft dikanza scraper. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 5. MA — Fas (C: Sade solo: Amaziğ lutarı)

- Başlık: `Hayalet Avcilari - MA`
- Stil (837 karakter):

```
Solo loutar lute leading Moroccan Amazigh music of the Atlas and Souss, with very soft bendir. Solo loutar lute in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Anhemitonic pentatonic Amazigh melody with repeated short phrases and quick grace notes. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 6. MZ — Mozambik (C: Sade solo: Ndau mbirası)

- Başlık: `Hayalet Avcilari - MZ`
- Stil (808 karakter):

```
Solo mbira thumb piano leading central Mozambican Ndau music, with very soft gourd shaker. Solo mbira thumb piano in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright hexatonic cyclic patterns, a small singing melody. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 7. KE — Kenya (B: Kıyı Mijikenda ezgi deyişi)

- Başlık: `Hayalet Avcilari - KE`
- Stil (864 karakter):

```
Marimba xylophone leading the Kenyan coastal Mijikenda traditional idiom, with soft kayamba raft rattle and a very quiet chivoti flute. Marimba xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Original lilting 6/8 melody on a hexatonic scale, gentle call-and-answer. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 8. PL — Polonya (B: Halk ezgisi: Szła dzieweczka)

- Başlık: `Hayalet Avcilari - PL`
- Stil (922 karakter):

```
Cymbaly hammered dulcimer leading a Polish village kapela, with a very soft folk fiddle, quiet clarinet and light basy plucks. Cymbaly hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Cheerful bouncing major-key tune in 2/4 with simple turns, melody inspired by the traditional folk tune Szla dzieweczka do laseczka. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 9. ES — İspanya (B: Halk ezgisi: El Vito)

- Başlık: `Hayalet Avcilari - ES`
- Stil (902 karakter):

```
Bandurria leading Spanish Andalusian folk style, with classical guitar, laud and very soft castanets. Bandurria in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Playful dance tune in 3/8 on the Andalusian cadence in the Phrygian mode kept light and unhurried, melody inspired by the traditional folk tune El Vito. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 10. GH — Gana (B: Çocuk ezgisi: Kye Kye Kule)

- Başlık: `Hayalet Avcilari - GH`
- Stil (875 karakter):

```
Gyil xylophone leading a Ghanaian children's game-song, with soft axatse shaker and quiet gankogui bell. Gyil xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Playful call-and-response tune in short pentatonic phrases, melody inspired by the traditional folk tune Kye Kye Kule. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 11. PS — Filistin (B: Halk ezgisi: Ya Zarif et-Tul)

- Başlık: `Hayalet Avcilari - PS`
- Stil (867 karakter):

```
Buzuq leading Palestinian folk style, with oud and soft darbuka. Buzuq in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Warm village wedding tune in maqam Bayati with a softened dabke lilt and short repeated phrases, melody inspired by the traditional folk tune Ya Zarif al-Tul. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 12. ZA — Güney Afrika (B: Geleneksel: Shosholoza)

- Başlık: `Hayalet Avcilari - ZA`
- Stil (883 karakter):

```
Marimba leading South African township folk style, with acoustic guitar and a very quiet pennywhistle. Marimba in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Warm call-and-response major-key tune with a gentle train-like chugging pulse, melody inspired by the traditional folk tune Shosholoza. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 13. AF — Afganistan (B: Halk ezgisi: Molla Muhammed Can)

- Başlık: `Hayalet Avcilari - AF`
- Stil (892 karakter):

```
Herati dutar leading Afghan Herati folk style, with soft rubab and quiet zerbaghali goblet drum. Herati dutar in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Cheerful springtime outing tune in a bright mode with short repeating phrases, melody inspired by the traditional folk tune Mullah Mohammad Jan. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 14. MY — Malezya (B: Halk ezgisi: Rasa Sayang)

- Başlık: `Hayalet Avcilari - MY`
- Stil (880 karakter):

```
Caklempong bronze gong-chime leading Malay folk style, with gambus lute and soft rebana. Caklempong bronze gong-chime in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Cheerful singalong major-key tune with a light skipping joget lilt, melody inspired by the traditional folk tune Rasa Sayang. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 15. PK — Pakistan (B: Halk ezgisi: Lathe Di Chadar)

- Başlık: `Hayalet Avcilari - PK`
- Stil (896 karakter):

```
Tumbi one-string lute leading Pakistani Punjabi folk style, with soft dholak and quiet chimta. Tumbi one-string lute in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Teasing cheerful tune in a bright Bilawal-like scale with a light kaharwa lilt, melody inspired by the traditional folk tune Lathe Di Chadar. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 16. UG — Uganda (B: Geleneksel: Ssematimba ne Kikwabanga)

- Başlık: `Hayalet Avcilari - UG`
- Stil (913 karakter):

```
Amadinda xylophone leading Ugandan Kiganda court repertoire, with soft ennanga harp and quiet ensaasi shakers. Amadinda xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Two interlocking parts in equal pentatonic tuning forming a hidden third melody, melody inspired by the traditional tune Ssematimba ne Kikwabanga. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 17. VN — Vietnam (C: Sade solo: đàn t'rưng)

- Başlık: `Hayalet Avcilari - VN`
- Stil (863 karakter):

```
Solo dan t'rung bamboo xylophone leading Vietnamese Central Highlands music, with soft dan tranh zither. Solo dan t'rung bamboo xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright bubbling pentatonic melody with quick rolls and echo phrases, like running water. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 18. YE — Yemen (A: San'a şarkı sanatı: kanbus)

- Başlık: `Hayalet Avcilari - YE`
- Stil (877 karakter):

```
Qanbus lute leading the Yemeni Sana'ani art-song tradition played instrumentally, with soft oud and light sahn nuhasi copper tray taps. Qanbus lute in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Intimate ornamented melody in a bright Yemeni maqam close to Rast, delicate plucked figures. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 19. CI — Fildişi Sahili (C: Sade solo: Senufo balafonu)

- Başlık: `Hayalet Avcilari - CI`
- Stil (839 karakter):

```
Solo Senufo balafon leading traditional music of northern Ivory Coast, with light bolon bass harp plucks. Solo Senufo balafon in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Pentatonic rippling patterns, gentle interlocking left and right hand lines. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 20. AR — Arjantin (B: Halk ezgisi: Zamba de Vargas)

- Başlık: `Hayalet Avcilari - AR`
- Stil (892 karakter):

```
Charango leading Argentine northwestern folk style, with criollo guitar and very quiet bombo leguero. Charango in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Graceful zamba in the 6/8 against 3/4 lilt in a minor key with bright major turns, melody inspired by the traditional folk tune Zamba de Vargas. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 21. EG — Mısır (C: Sade solo: simsimiyye)

- Başlık: `Hayalet Avcilari - EG`
- Stil (851 karakter):

```
Solo simsimiyya lyre leading Egyptian Suez Canal coastal music, with very soft riq. Solo simsimiyya lyre in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright strummed-and-plucked melody in a narrow range in maqam Rast and Ajam colour, short repeating phrases. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 22. FR — Fransa (B: Ezgi: Au clair de la lune)

- Başlık: `Hayalet Avcilari - FR`
- Stil (925 karakter):

```
Epinette des Vosges plucked zither leading a French folk ensemble, with soft guitar and a quiet wooden flute. Epinette des Vosges plucked zither in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Simple tender major-key tune in stepwise motion with a light bouncing pulse, melody inspired by the traditional folk tune Au clair de la lune. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 23. IN — Hindistan (B: Halk ezgisi: Kesariya Balam)

- Başlık: `Hayalet Avcilari - IN`
- Stil (905 karakter):

```
Sitar leading Indian Rajasthani Maand style, with swarmandal sweeps, soft dholak and quiet khartal. Sitar in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Warm welcoming desert tune in the Maand mode with flowing murki ornaments and long graceful phrases, melody inspired by the traditional folk tune Kesariya Balam. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 24. MG — Madagaskar (B: Geleneksel: Afindrafindrao)

- Başlık: `Hayalet Avcilari - MG`
- Stil (876 karakter):

```
Marovany box zither leading a Malagasy court dance, with soft kabosy lute and kaiamba shaker. Marovany box zither in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Stately yet cheerful major-key quadrille tune with bright arpeggios, melody inspired by the traditional tune Afindrafindrao. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 102 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 25. PE — Peru (B: Eski ezgi: El Cóndor Pasa)

- Kullanıcının notu: Ritim 95 altına düşmesin seçtiğim
- Başlık: `Hayalet Avcilari - PE`
- Stil (921 karakter):

```
Charango leading Peruvian Andean style, with guitar, very soft bombo and a very quiet quena. Charango in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Soaring calm melody on the Andean minor pentatonic scale that brightens into a light huayno, melody inspired by the traditional tune El Condor Pasa. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, steady tempo never below 95 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 26. RU — Rusya (B: Halk ezgisi: Vo pole beryoza)

- Başlık: `Hayalet Avcilari - RU`
- Stil (883 karakter):

```
Balalaika leading Russian folk style, with domra and soft gusli psaltery. Balalaika in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Simple round-dance khorovod tune in natural minor within a narrow range, light and lilting, melody inspired by the traditional folk tune Vo pole beryoza stoyala. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 27. SA — Suudi Arabistan (B: Necid samri deyişi)

- Başlık: `Hayalet Avcilari - SA`
- Stil (841 karakter):

```
Oud leading the Saudi Najdi traditional idiom, with very soft tar frame drums in a swaying samri rhythm. Oud in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Original narrow-range melody in maqam Bayati with gentle turns and repeated answering phrases. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 28. US — ABD (B: Eski ezgi: Simple Gifts)

- Başlık: `Hayalet Avcilari - US`
- Stil (899 karakter):

```
Hammered dulcimer leading American Appalachian folk style, with acoustic guitar, mandolin and a very quiet fiddle. Hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Plain joyful major-key dance tune with open fifths and stepwise turns, melody inspired by the traditional folk tune Simple Gifts. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 29. MM — Myanmar (A: Mahagita: saung arpı)

- Başlık: `Hayalet Avcilari - MM`
- Stil (907 karakter):

```
Saung gauk arched harp leading Burmese classical chamber music of the Mahagita tradition, with pattala bamboo xylophone and soft si and wa bell-and-clapper timekeeping. Saung gauk arched harp in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Graceful melody in the than yoe heptatonic tuning with octave-leaping figures. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 30. CA — Kanada (C: Sade solo: akustik gitar)

- Başlık: `Hayalet Avcilari - CA`
- Stil (855 karakter):

```
Solo fingerstyle acoustic guitar leading a Quebecois reel played gently, with soft foot-tapping only. Solo fingerstyle acoustic guitar in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Gentle slow reel in a major key with Mixolydian touches, hammer-ons and pull-offs. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 31. IR — İran (A: Mahur destgâhı: santur)

- Başlık: `Hayalet Avcilari - IR`
- Stil (869 karakter):

```
Santur hammered dulcimer leading Persian classical music in the bright dastgah Mahur, with tar and soft tombak. Santur hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Graceful pishdaramad and reng style melody with delicate tahrir-like ornaments and riz tremolo. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 32. JP — Japonya (A: Jiuta oda müziği: şamisen)

- Başlık: `Hayalet Avcilari - JP`
- Stil (857 karakter):

```
Shamisen leading Japanese Edo-period jiuta sankyoku chamber music, with koto and a very quiet shakuhachi. Shamisen in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Gentle elegant melody blending the in and yo pentatonic scales with a bright spring mood, lightly played. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 33. NG — Nijerya (C: Sade solo: İgbo ubo)

- Başlık: `Hayalet Avcilari - NG`
- Stil (813 karakter):

```
Solo ubo thumb piano leading Nigerian Igbo music, with soft udu clay pot drum. Solo ubo thumb piano in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright short pentatonic and hexatonic ostinato phrases, gentle and bubbling. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 34. CO — Kolombiya (C: Sade solo: chonta marimbası)

- Başlık: `Hayalet Avcilari - CO`
- Stil (859 karakter):

```
Solo marimba de chonta leading Colombian Pacific coast music, with very soft guasa shaker. Solo marimba de chonta in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright bubbling interlocking patterns in a 6/8 currulao lilt kept slow and gentle, pentatonic-leaning melody. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 35. DE — Almanya (C: Sade solo: zither)

- Başlık: `Hayalet Avcilari - DE`
- Stil (870 karakter):

```
Solo Alpine concert zither leading Bavarian Alpine folk music, with soft guitar accompaniment. Solo Alpine concert zither in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Gentle Laendler in 3/4 in a bright major key, yodel-like broken-chord leaps, sweet tremolo and parallel thirds. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 36. DZ — Cezayir (B: Geleneksel: Kum Tara)

- Başlık: `Hayalet Avcilari - DZ`
- Stil (881 karakter):

```
Algerian mandole leading an Algerian Andalusi and hawzi ensemble, with qanun and soft derbouka. Algerian mandole in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright springtime tune with a lilting 6/8 insiraf rhythm and graceful ornaments, melody inspired by the traditional tune Qum Tara. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 37. IQ — Irak (A: Bağdat çalgısı: santur)

- Başlık: `Hayalet Avcilari - IQ`
- Stil (866 karakter):

```
Santur hammered dulcimer leading Iraqi maqam art music by a chalghi baghdadi ensemble, with oud and soft riq. Santur hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Poised instrumental melody in the bright maqam Rast with delicate hammered shimmer and tremolo. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 38. UA — Ukrayna (C: Sade solo bandura)

- Başlık: `Hayalet Avcilari - UA`
- Stil (880 karakter):

```
Solo bandura leading an intimate Ukrainian solo piece, with no other instruments except a faint tsymbaly echo. Solo bandura in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Tender melody in natural minor with Dorian raised-fourth colour over light arpeggios, gentle tremolo and rolled chords. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 39. GB — Birleşik Krallık (C: Sade solo: Kelt arpı)

- Başlık: `Hayalet Avcilari - GB`
- Stil (916 karakter):

```
Solo Celtic harp leading British pastoral harp music in the Welsh and Scottish tradition, with no other instruments except a faint fiddle answer. Solo Celtic harp in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Pastoral air in the Mixolydian mode and major pentatonic, Scotch-snap rhythms, gentle grace notes and rolled chords. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 40. SD — Sudan (B: Eski şarkı: Azza fi Hawak)

- Başlık: `Hayalet Avcilari - SD`
- Stil (872 karakter):

```
Oud leading the Sudanese early urban song style, with soft riq and a very quiet violin answer. Oud in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Proud warm pentatonic tune with a gentle marching sway and long singing phrases, melody inspired by the traditional tune Azza fi Hawak. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 41. TH — Tayland (B: Klasik ezgi: Lao Duang Duean)

- Başlık: `Hayalet Avcilari - TH`
- Stil (959 karakter):

```
Khim hammered dulcimer leading a Thai classical khrueang sai string ensemble, with chakhe floor zither, soft ching cymbals and a very quiet khlui flute. Khim hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Tender moonlit tune in a Lao-accent pentatonic style with gentle tremolo and long phrases, melody inspired by the traditional tune Lao Duang Duean. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 42. BD — Bangladeş (C: Sade solo: dotara)

- Başlık: `Hayalet Avcilari - BD`
- Stil (824 karakter):

```
Solo dotara leading Bangladeshi bhawaiya folk music, with very soft khol drum. Solo dotara in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Lilting melody in a pentatonic-leaning folk mode with quick hammer-ons and repeated-note rhythm. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 43. CD — Kongo DC (C: Sade solo: likembe)

- Başlık: `Hayalet Avcilari - CD`
- Stil (850 karakter):

```
Solo likembe thumb piano leading Congolese traditional music, with a very soft seed-pod shaker. Solo likembe thumb piano in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright hexatonic interlocking thumb patterns, a small singing melody over a cyclic ostinato. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 44. IT — İtalya (C: Sade solo: İtalyan arpı)

- Başlık: `Hayalet Avcilari - IT`
- Stil (892 karakter):

```
Solo Italian folk harp leading an Italian serenade in the Viggiano street-harp tradition, with soft classical guitar. Solo Italian folk harp in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Tender melody in a sunny major key with a gentle tarantella-like 6/8 lilt kept slow and light, rippling arpeggios. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 45. PH — Filipinler (C: Sade solo: kulintang)

- Başlık: `Hayalet Avcilari - PH`
- Stil (883 karakter):

```
Kulintang bronze gong-chime leading southern Philippine Maguindanao music from Mindanao, with kudyapi boat lute and a very soft dabakan drum. Kulintang bronze gong-chime in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright pentatonic melody with gentle repeating rhythmic cells, played softly. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 46. BR — Brezilya (C: Sade solo: Brezilya gitarı)

- Başlık: `Hayalet Avcilari - BR`
- Stil (879 karakter):

```
Solo Brazilian nylon-string guitar leading a Brazilian valsa-choro and modinha style piece, with very soft caxixi shaker. Solo Brazilian nylon-string guitar in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Singing melody over walking bass lines in a bright major key with tender minor turns. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 47. ID — Endonezya (A: Cava saray gamelanı (yumuşak))

- Başlık: `Hayalet Avcilari - ID`
- Stil (933 karakter):

```
Gender and saron bronze metallophones leading Javanese court gamelan in the soft style of the Yogyakarta and Surakarta palaces, with gambang wooden xylophone, quiet kendhang and one soft gong. Gender and saron bronze metallophones in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Serene bright melody in slendro tuning with interlocking patterns. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 48. TZ — Tanzanya (C: Sade solo: ilimba)

- Başlık: `Hayalet Avcilari - TZ`
- Stil (830 karakter):

```
Solo ilimba thumb piano leading Tanzanian Gogo music, with very soft kayamba shaker. Solo ilimba thumb piano in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Bright upper notes on the Gogo pentatonic scale, cyclic interlocking thumb patterns. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 49. CN — Çin (C: Sade solo: guzheng)

- Başlık: `Hayalet Avcilari - CN`
- Stil (874 karakter):

```
Solo guzheng leading Chinese zither music, with no other instruments except a faint xiao flute answer. Solo guzheng in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Flowing pentatonic glissandi, bent notes and tremolo in the gong mode, a bright springtime melody with spacious phrasing. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 50. ET — Etiyopya (B: Geleneksel: Tizita)

- Başlık: `Hayalet Avcilari - ET`
- Stil (893 karakter):

```
Krar lyre leading the Ethiopian traditional song style, with a quiet washint flute answer and soft kebero. Krar lyre in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, authentic traditional performance by real folk musicians: the lead plays the melody, any companion instrument only doubles the same melody in unison or heterophony or keeps a simple traditional rhythm. Nostalgic yet warm melody in the tizita major qenet pentatonic scale with quick turns, melody inspired by the traditional folk tune Tizita. Realistic acoustic recording, natural room sound, human timing and expressive ornaments, traditional monophonic heterophonic texture, no Western chord progressions, no added harmony, no counter-melodies. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```
