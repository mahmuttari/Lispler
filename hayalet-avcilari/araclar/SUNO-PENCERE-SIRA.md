# Suno (Chrome penceresi) — ülke müzikleri iş sırası

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
3. **Exclude Styles** (Advanced Options içinde) kutusuna: `vocals, singing, choir, heavy drums, driving dance beat, EDM, trap, dubstep, rock, distorted guitar, accordion, bagpipes, shawm, drone, synth pads, orchestral strings, reverb wash, breakdown, fade-out`
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
| 1 | RU | Rusya | B Halk ezgisi: Vo pole beryoza | balalayka | bekliyor |
| 2 | PS | Filistin | B Halk ezgisi: Ya Zarif et-Tul | buzuk | bekliyor |
| 3 | UZ | Özbekistan | C Sade solo: Kaşgar rubabı | rubab (Kaşgar) | bekliyor |
| 4 | CO | Kolombiya | C Sade solo: chonta marimbası | marimba de chonta | bekliyor |
| 5 | PL | Polonya | B Halk ezgisi: Szła dzieweczka | cymbały | bekliyor |
| 6 | BR | Brezilya | C Sade solo: Brezilya gitarı | gitar (violão) | bekliyor |
| 7 | CN | Çin | C Sade solo: guzheng | guzheng | bekliyor |
| 8 | IQ | Irak | A Bağdat çalgısı: santur | santur | bekliyor |
| 9 | IT | İtalya | C Sade solo: İtalyan arpı | arp | bekliyor |
| 10 | MX | Meksika | C Sade solo: jarocho arpı | arpa jarocha | bekliyor |
| 11 | BD | Bangladeş | C Sade solo: dotara | dotara | bekliyor |
| 12 | ID | Endonezya | A Cava saray gamelanı (yumuşak) | gender | bekliyor |
| 13 | JP | Japonya | A Jiuta oda müziği: şamisen | şamisen | bekliyor |
| 14 | PH | Filipinler | C Sade solo: kulintang | kulintang | bekliyor |
| 15 | VN | Vietnam | C Sade solo: đàn t'rưng | đàn t'rưng | bekliyor |
| 16 | CA | Kanada | C Sade solo: akustik gitar | akustik gitar | bekliyor |
| 17 | EG | Mısır | C Sade solo: simsimiyye | simsimiyye | bekliyor |
| 18 | ES | İspanya | B Halk ezgisi: El Vito | bandurria | bekliyor |
| 19 | KR | Güney Kore | A Saray oda müziği: yanggeum | yanggeum | bekliyor |
| 20 | AR | Arjantin | B Halk ezgisi: Zamba de Vargas | charango | bekliyor |
| 21 | DE | Almanya | C Sade solo: zither | zither | bekliyor |
| 22 | DZ | Cezayir | B Geleneksel: Kum Tara | mandol | bekliyor |
| 23 | GB | Birleşik Krallık | C Sade solo: Kelt arpı | Kelt arpı (clàrsach) | bekliyor |
| 24 | IN | Hindistan | B Halk ezgisi: Kesariya Balam | sitar | bekliyor |
| 25 | MA | Fas | C Sade solo: Amaziğ lutarı | lutar | bekliyor |
| 26 | MM | Myanmar | A Mahagita: saung arpı | saung gauk | bekliyor |
| 27 | MY | Malezya | B Halk ezgisi: Rasa Sayang | caklempong | bekliyor |
| 28 | PK | Pakistan | B Halk ezgisi: Lathe Di Chadar | tumbi | bekliyor |
| 29 | SA | Suudi Arabistan | B Necid samri deyişi | ud | bekliyor |
| 30 | TH | Tayland | B Klasik ezgi: Lao Duang Duean | khim | bekliyor |
| 31 | UA | Ukrayna | C Sade solo bandura | bandura | bekliyor |
| 32 | US | ABD | B Eski ezgi: Simple Gifts | hammered dulcimer | bekliyor |
| 33 | IR | İran | A Mahur destgâhı: santur | santur | bekliyor |
| 34 | KE | Kenya | B Kıyı Mijikenda ezgi deyişi | marimba | bekliyor |
| 35 | MG | Madagaskar | B Geleneksel: Afindrafindrao | marovany | bekliyor |
| 36 | NG | Nijerya | C Sade solo: İgbo ubo | ubo | bekliyor |
| 37 | SD | Sudan | B Eski şarkı: Azza fi Hawak | ud | bekliyor |
| 38 | TZ | Tanzanya | C Sade solo: ilimba | ilimba | bekliyor |
| 39 | AF | Afganistan | B Halk ezgisi: Molla Muhammed Can | Herat dutarı | bekliyor |
| 40 | CI | Fildişi Sahili | C Sade solo: Senufo balafonu | Senufo balafonu (djegele) | bekliyor |
| 41 | GH | Gana | B Çocuk ezgisi: Kye Kye Kule | gyil | bekliyor |
| 42 | UG | Uganda | B Geleneksel: Ssematimba ne Kikwabanga | amadinda | bekliyor |
| 43 | YE | Yemen | A San'a şarkı sanatı: kanbus | kanbus (turbi) | bekliyor |
| 44 | ZA | Güney Afrika | B Geleneksel: Shosholoza | marimba | bekliyor |
| 45 | ET | Etiyopya | B Geleneksel: Tizita | krar | bekliyor |
| 46 | MZ | Mozambik | C Sade solo: Ndau mbirası | mbira (Ndau) | bekliyor |
| 47 | CD | Kongo DC | C Sade solo: likembe | likembe | bekliyor |
| 48 | AO | Angola | A Luanda serenadı: marimba | marimba | bekliyor |
| 49 | FR | Fransa | B Ezgi: Au clair de la lune | épinette des Vosges | bekliyor |
| 50 | PE | Peru | B Eski ezgi: El Cóndor Pasa | charango | bekliyor |

### 1. RU — Rusya (B: Halk ezgisi: Vo pole beryoza)

- Başlık: `Hayalet Avcilari - RU`
- Stil (565 karakter):

```
Balalaika leading Russian folk style, with domra and soft gusli psaltery. Balalaika in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Simple round-dance khorovod tune in natural minor within a narrow range, light and lilting, melody inspired by the traditional folk tune Vo pole beryoza stoyala. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 2. PS — Filistin (B: Halk ezgisi: Ya Zarif et-Tul)

- Başlık: `Hayalet Avcilari - PS`
- Stil (549 karakter):

```
Buzuq leading Palestinian folk style, with oud and soft darbuka. Buzuq in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Warm village wedding tune in maqam Bayati with a softened dabke lilt and short repeated phrases, melody inspired by the traditional folk tune Ya Zarif al-Tul. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 3. UZ — Özbekistan (C: Sade solo: Kaşgar rubabı)

- Başlık: `Hayalet Avcilari - UZ`
- Stil (533 karakter):

```
Solo Kashgar rubab leading Uzbek Fergana-Tashkent style music, with very soft doira frame drum. Solo Kashgar rubab in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright dance-like melody in a major-leaning mode, rapid tremolo on long notes and rhythmic strokes. 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 4. CO — Kolombiya (C: Sade solo: chonta marimbası)

- Başlık: `Hayalet Avcilari - CO`
- Stil (541 karakter):

```
Solo marimba de chonta leading Colombian Pacific coast music, with very soft guasa shaker. Solo marimba de chonta in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright bubbling interlocking patterns in a 6/8 currulao lilt kept slow and gentle, pentatonic-leaning melody. 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 5. PL — Polonya (B: Halk ezgisi: Szła dzieweczka)

- Başlık: `Hayalet Avcilari - PL`
- Stil (604 karakter):

```
Cymbaly hammered dulcimer leading a Polish village kapela, with a very soft folk fiddle, quiet clarinet and light basy plucks. Cymbaly hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Cheerful bouncing major-key tune in 2/4 with simple turns, melody inspired by the traditional folk tune Szla dzieweczka do laseczka. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 6. BR — Brezilya (C: Sade solo: Brezilya gitarı)

- Başlık: `Hayalet Avcilari - BR`
- Stil (561 karakter):

```
Solo Brazilian nylon-string guitar leading a Brazilian valsa-choro and modinha style piece, with very soft caxixi shaker. Solo Brazilian nylon-string guitar in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Singing melody over walking bass lines in a bright major key with tender minor turns. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 7. CN — Çin (C: Sade solo: guzheng)

- Başlık: `Hayalet Avcilari - CN`
- Stil (556 karakter):

```
Solo guzheng leading Chinese zither music, with no other instruments except a faint xiao flute answer. Solo guzheng in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Flowing pentatonic glissandi, bent notes and tremolo in the gong mode, a bright springtime melody with spacious phrasing. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 8. IQ — Irak (A: Bağdat çalgısı: santur)

- Başlık: `Hayalet Avcilari - IQ`
- Stil (548 karakter):

```
Santur hammered dulcimer leading Iraqi maqam art music by a chalghi baghdadi ensemble, with oud and soft riq. Santur hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Poised instrumental melody in the bright maqam Rast with delicate hammered shimmer and tremolo. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 9. IT — İtalya (C: Sade solo: İtalyan arpı)

- Başlık: `Hayalet Avcilari - IT`
- Stil (574 karakter):

```
Solo Italian folk harp leading an Italian serenade in the Viggiano street-harp tradition, with soft classical guitar. Solo Italian folk harp in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Tender melody in a sunny major key with a gentle tarantella-like 6/8 lilt kept slow and light, rippling arpeggios. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 10. MX — Meksika (C: Sade solo: jarocho arpı)

- Başlık: `Hayalet Avcilari - MX`
- Stil (544 karakter):

```
Solo arpa jarocha harp leading Mexican son jarocho from Veracruz, with softly strummed jarana. Solo arpa jarocha harp in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Sparkling arpeggios and a bright major-key melody over the sesquialtera 6/8 against 3/4 lilt, kept gentle. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 11. BD — Bangladeş (C: Sade solo: dotara)

- Başlık: `Hayalet Avcilari - BD`
- Stil (506 karakter):

```
Solo dotara leading Bangladeshi bhawaiya folk music, with very soft khol drum. Solo dotara in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Lilting melody in a pentatonic-leaning folk mode with quick hammer-ons and repeated-note rhythm. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 12. ID — Endonezya (A: Cava saray gamelanı (yumuşak))

- Başlık: `Hayalet Avcilari - ID`
- Stil (615 karakter):

```
Gender and saron bronze metallophones leading Javanese court gamelan in the soft style of the Yogyakarta and Surakarta palaces, with gambang wooden xylophone, quiet kendhang and one soft gong. Gender and saron bronze metallophones in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Serene bright melody in slendro tuning with interlocking patterns. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 13. JP — Japonya (A: Jiuta oda müziği: şamisen)

- Başlık: `Hayalet Avcilari - JP`
- Stil (539 karakter):

```
Shamisen leading Japanese Edo-period jiuta sankyoku chamber music, with koto and a very quiet shakuhachi. Shamisen in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Gentle elegant melody blending the in and yo pentatonic scales with a bright spring mood, lightly played. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 14. PH — Filipinler (C: Sade solo: kulintang)

- Başlık: `Hayalet Avcilari - PH`
- Stil (565 karakter):

```
Kulintang bronze gong-chime leading southern Philippine Maguindanao music from Mindanao, with kudyapi boat lute and a very soft dabakan drum. Kulintang bronze gong-chime in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright pentatonic melody with gentle repeating rhythmic cells, played softly. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 15. VN — Vietnam (C: Sade solo: đàn t'rưng)

- Başlık: `Hayalet Avcilari - VN`
- Stil (545 karakter):

```
Solo dan t'rung bamboo xylophone leading Vietnamese Central Highlands music, with soft dan tranh zither. Solo dan t'rung bamboo xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright bubbling pentatonic melody with quick rolls and echo phrases, like running water. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 16. CA — Kanada (C: Sade solo: akustik gitar)

- Başlık: `Hayalet Avcilari - CA`
- Stil (537 karakter):

```
Solo fingerstyle acoustic guitar leading a Quebecois reel played gently, with soft foot-tapping only. Solo fingerstyle acoustic guitar in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Gentle slow reel in a major key with Mixolydian touches, hammer-ons and pull-offs. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 17. EG — Mısır (C: Sade solo: simsimiyye)

- Başlık: `Hayalet Avcilari - EG`
- Stil (533 karakter):

```
Solo simsimiyya lyre leading Egyptian Suez Canal coastal music, with very soft riq. Solo simsimiyya lyre in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright strummed-and-plucked melody in a narrow range in maqam Rast and Ajam colour, short repeating phrases. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 18. ES — İspanya (B: Halk ezgisi: El Vito)

- Başlık: `Hayalet Avcilari - ES`
- Stil (584 karakter):

```
Bandurria leading Spanish Andalusian folk style, with classical guitar, laud and very soft castanets. Bandurria in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Playful dance tune in 3/8 on the Andalusian cadence in the Phrygian mode kept light and unhurried, melody inspired by the traditional folk tune El Vito. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 19. KR — Güney Kore (A: Saray oda müziği: yanggeum)

- Başlık: `Hayalet Avcilari - KR`
- Stil (571 karakter):

```
Yanggeum hammered dulcimer leading Korean jeongak court chamber music in a brighter pungnyu style, with gayageum, soft janggu and a very quiet danso flute. Yanggeum hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Graceful melody in the pyeongjo pentatonic mode, poised and unhurried. 90 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 20. AR — Arjantin (B: Halk ezgisi: Zamba de Vargas)

- Başlık: `Hayalet Avcilari - AR`
- Stil (574 karakter):

```
Charango leading Argentine northwestern folk style, with criollo guitar and very quiet bombo leguero. Charango in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Graceful zamba in the 6/8 against 3/4 lilt in a minor key with bright major turns, melody inspired by the traditional folk tune Zamba de Vargas. 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 21. DE — Almanya (C: Sade solo: zither)

- Başlık: `Hayalet Avcilari - DE`
- Stil (552 karakter):

```
Solo Alpine concert zither leading Bavarian Alpine folk music, with soft guitar accompaniment. Solo Alpine concert zither in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Gentle Laendler in 3/4 in a bright major key, yodel-like broken-chord leaps, sweet tremolo and parallel thirds. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 22. DZ — Cezayir (B: Geleneksel: Kum Tara)

- Başlık: `Hayalet Avcilari - DZ`
- Stil (563 karakter):

```
Algerian mandole leading an Algerian Andalusi and hawzi ensemble, with qanun and soft derbouka. Algerian mandole in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright springtime tune with a lilting 6/8 insiraf rhythm and graceful ornaments, melody inspired by the traditional tune Qum Tara. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 23. GB — Birleşik Krallık (C: Sade solo: Kelt arpı)

- Başlık: `Hayalet Avcilari - GB`
- Stil (598 karakter):

```
Solo Celtic harp leading British pastoral harp music in the Welsh and Scottish tradition, with no other instruments except a faint fiddle answer. Solo Celtic harp in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Pastoral air in the Mixolydian mode and major pentatonic, Scotch-snap rhythms, gentle grace notes and rolled chords. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 24. IN — Hindistan (B: Halk ezgisi: Kesariya Balam)

- Başlık: `Hayalet Avcilari - IN`
- Stil (587 karakter):

```
Sitar leading Indian Rajasthani Maand style, with swarmandal sweeps, soft dholak and quiet khartal. Sitar in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Warm welcoming desert tune in the Maand mode with flowing murki ornaments and long graceful phrases, melody inspired by the traditional folk tune Kesariya Balam. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 25. MA — Fas (C: Sade solo: Amaziğ lutarı)

- Başlık: `Hayalet Avcilari - MA`
- Stil (519 karakter):

```
Solo loutar lute leading Moroccan Amazigh music of the Atlas and Souss, with very soft bendir. Solo loutar lute in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Anhemitonic pentatonic Amazigh melody with repeated short phrases and quick grace notes. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 26. MM — Myanmar (A: Mahagita: saung arpı)

- Başlık: `Hayalet Avcilari - MM`
- Stil (589 karakter):

```
Saung gauk arched harp leading Burmese classical chamber music of the Mahagita tradition, with pattala bamboo xylophone and soft si and wa bell-and-clapper timekeeping. Saung gauk arched harp in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Graceful melody in the than yoe heptatonic tuning with octave-leaping figures. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 27. MY — Malezya (B: Halk ezgisi: Rasa Sayang)

- Başlık: `Hayalet Avcilari - MY`
- Stil (562 karakter):

```
Caklempong bronze gong-chime leading Malay folk style, with gambus lute and soft rebana. Caklempong bronze gong-chime in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Cheerful singalong major-key tune with a light skipping joget lilt, melody inspired by the traditional folk tune Rasa Sayang. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 28. PK — Pakistan (B: Halk ezgisi: Lathe Di Chadar)

- Başlık: `Hayalet Avcilari - PK`
- Stil (578 karakter):

```
Tumbi one-string lute leading Pakistani Punjabi folk style, with soft dholak and quiet chimta. Tumbi one-string lute in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Teasing cheerful tune in a bright Bilawal-like scale with a light kaharwa lilt, melody inspired by the traditional folk tune Lathe Di Chadar. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 29. SA — Suudi Arabistan (B: Necid samri deyişi)

- Başlık: `Hayalet Avcilari - SA`
- Stil (523 karakter):

```
Oud leading the Saudi Najdi traditional idiom, with very soft tar frame drums in a swaying samri rhythm. Oud in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Original narrow-range melody in maqam Bayati with gentle turns and repeated answering phrases. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 30. TH — Tayland (B: Klasik ezgi: Lao Duang Duean)

- Başlık: `Hayalet Avcilari - TH`
- Stil (641 karakter):

```
Khim hammered dulcimer leading a Thai classical khrueang sai string ensemble, with chakhe floor zither, soft ching cymbals and a very quiet khlui flute. Khim hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Tender moonlit tune in a Lao-accent pentatonic style with gentle tremolo and long phrases, melody inspired by the traditional tune Lao Duang Duean. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 31. UA — Ukrayna (C: Sade solo bandura)

- Başlık: `Hayalet Avcilari - UA`
- Stil (562 karakter):

```
Solo bandura leading an intimate Ukrainian solo piece, with no other instruments except a faint tsymbaly echo. Solo bandura in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Tender melody in natural minor with Dorian raised-fourth colour over light arpeggios, gentle tremolo and rolled chords. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 32. US — ABD (B: Eski ezgi: Simple Gifts)

- Başlık: `Hayalet Avcilari - US`
- Stil (581 karakter):

```
Hammered dulcimer leading American Appalachian folk style, with acoustic guitar, mandolin and a very quiet fiddle. Hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Plain joyful major-key dance tune with open fifths and stepwise turns, melody inspired by the traditional folk tune Simple Gifts. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 33. IR — İran (A: Mahur destgâhı: santur)

- Başlık: `Hayalet Avcilari - IR`
- Stil (551 karakter):

```
Santur hammered dulcimer leading Persian classical music in the bright dastgah Mahur, with tar and soft tombak. Santur hammered dulcimer in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Graceful pishdaramad and reng style melody with delicate tahrir-like ornaments and riz tremolo. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 34. KE — Kenya (B: Kıyı Mijikenda ezgi deyişi)

- Başlık: `Hayalet Avcilari - KE`
- Stil (546 karakter):

```
Marimba xylophone leading the Kenyan coastal Mijikenda traditional idiom, with soft kayamba raft rattle and a very quiet chivoti flute. Marimba xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Original lilting 6/8 melody on a hexatonic scale, gentle call-and-answer. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 35. MG — Madagaskar (B: Geleneksel: Afindrafindrao)

- Başlık: `Hayalet Avcilari - MG`
- Stil (558 karakter):

```
Marovany box zither leading a Malagasy court dance, with soft kabosy lute and kaiamba shaker. Marovany box zither in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Stately yet cheerful major-key quadrille tune with bright arpeggios, melody inspired by the traditional tune Afindrafindrao. 102 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 36. NG — Nijerya (C: Sade solo: İgbo ubo)

- Başlık: `Hayalet Avcilari - NG`
- Stil (495 karakter):

```
Solo ubo thumb piano leading Nigerian Igbo music, with soft udu clay pot drum. Solo ubo thumb piano in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright short pentatonic and hexatonic ostinato phrases, gentle and bubbling. 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 37. SD — Sudan (B: Eski şarkı: Azza fi Hawak)

- Başlık: `Hayalet Avcilari - SD`
- Stil (554 karakter):

```
Oud leading the Sudanese early urban song style, with soft riq and a very quiet violin answer. Oud in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Proud warm pentatonic tune with a gentle marching sway and long singing phrases, melody inspired by the traditional tune Azza fi Hawak. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 38. TZ — Tanzanya (C: Sade solo: ilimba)

- Başlık: `Hayalet Avcilari - TZ`
- Stil (512 karakter):

```
Solo ilimba thumb piano leading Tanzanian Gogo music, with very soft kayamba shaker. Solo ilimba thumb piano in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright upper notes on the Gogo pentatonic scale, cyclic interlocking thumb patterns. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 39. AF — Afganistan (B: Halk ezgisi: Molla Muhammed Can)

- Başlık: `Hayalet Avcilari - AF`
- Stil (574 karakter):

```
Herati dutar leading Afghan Herati folk style, with soft rubab and quiet zerbaghali goblet drum. Herati dutar in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Cheerful springtime outing tune in a bright mode with short repeating phrases, melody inspired by the traditional folk tune Mullah Mohammad Jan. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 40. CI — Fildişi Sahili (C: Sade solo: Senufo balafonu)

- Başlık: `Hayalet Avcilari - CI`
- Stil (521 karakter):

```
Solo Senufo balafon leading traditional music of northern Ivory Coast, with light bolon bass harp plucks. Solo Senufo balafon in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Pentatonic rippling patterns, gentle interlocking left and right hand lines. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 41. GH — Gana (B: Çocuk ezgisi: Kye Kye Kule)

- Başlık: `Hayalet Avcilari - GH`
- Stil (557 karakter):

```
Gyil xylophone leading a Ghanaian children's game-song, with soft axatse shaker and quiet gankogui bell. Gyil xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Playful call-and-response tune in short pentatonic phrases, melody inspired by the traditional folk tune Kye Kye Kule. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 42. UG — Uganda (B: Geleneksel: Ssematimba ne Kikwabanga)

- Başlık: `Hayalet Avcilari - UG`
- Stil (595 karakter):

```
Amadinda xylophone leading Ugandan Kiganda court repertoire, with soft ennanga harp and quiet ensaasi shakers. Amadinda xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Two interlocking parts in equal pentatonic tuning forming a hidden third melody, melody inspired by the traditional tune Ssematimba ne Kikwabanga. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 43. YE — Yemen (A: San'a şarkı sanatı: kanbus)

- Başlık: `Hayalet Avcilari - YE`
- Stil (559 karakter):

```
Qanbus lute leading the Yemeni Sana'ani art-song tradition played instrumentally, with soft oud and light sahn nuhasi copper tray taps. Qanbus lute in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Intimate ornamented melody in a bright Yemeni maqam close to Rast, delicate plucked figures. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 44. ZA — Güney Afrika (B: Geleneksel: Shosholoza)

- Başlık: `Hayalet Avcilari - ZA`
- Stil (565 karakter):

```
Marimba leading South African township folk style, with acoustic guitar and a very quiet pennywhistle. Marimba in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Warm call-and-response major-key tune with a gentle train-like chugging pulse, melody inspired by the traditional folk tune Shosholoza. 104 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 45. ET — Etiyopya (B: Geleneksel: Tizita)

- Başlık: `Hayalet Avcilari - ET`
- Stil (575 karakter):

```
Krar lyre leading the Ethiopian traditional song style, with a quiet washint flute answer and soft kebero. Krar lyre in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Nostalgic yet warm melody in the tizita major qenet pentatonic scale with quick turns, melody inspired by the traditional folk tune Tizita. 92 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 46. MZ — Mozambik (C: Sade solo: Ndau mbirası)

- Başlık: `Hayalet Avcilari - MZ`
- Stil (490 karakter):

```
Solo mbira thumb piano leading central Mozambican Ndau music, with very soft gourd shaker. Solo mbira thumb piano in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright hexatonic cyclic patterns, a small singing melody. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 47. CD — Kongo DC (C: Sade solo: likembe)

- Başlık: `Hayalet Avcilari - CD`
- Stil (532 karakter):

```
Solo likembe thumb piano leading Congolese traditional music, with a very soft seed-pod shaker. Solo likembe thumb piano in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright hexatonic interlocking thumb patterns, a small singing melody over a cyclic ostinato. 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 48. AO — Angola (A: Luanda serenadı: marimba)

- Başlık: `Hayalet Avcilari - AO`
- Stil (546 karakter):

```
Marimba xylophone leading Angolan traditional art music in a tender Luanda serenade style, with kissange thumb piano and soft acoustic guitar. Marimba xylophone in the foreground, bright clear articulate tone, crisp struck attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Bright pentatonic and major-key phrases, very soft dikanza scraper. 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 49. FR — Fransa (B: Ezgi: Au clair de la lune)

- Başlık: `Hayalet Avcilari - FR`
- Stil (607 karakter):

```
Epinette des Vosges plucked zither leading a French folk ensemble, with soft guitar and a quiet wooden flute. Epinette des Vosges plucked zither in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Simple tender major-key tune in stepwise motion with a light bouncing pulse, melody inspired by the traditional folk tune Au clair de la lune. 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```

### 50. PE — Peru (B: Eski ezgi: El Cóndor Pasa)

- Kullanıcının notu: Ritim 95 altına düşmesin seçtiğim
- Başlık: `Hayalet Avcilari - PE`
- Stil (603 karakter):

```
Charango leading Peruvian Andean style, with guitar, very soft bombo and a very quiet quena. Charango in the foreground, bright clear articulate tone, crisp plucked attack, dry clean transparent mix, sparse arrangement, gentle soft accompaniment, no drone, no reverb wash, no orchestral wash, no synth pads. Soaring calm melody on the Andean minor pentatonic scale that brightens into a light huayno, melody inspired by the traditional tune El Condor Pasa. 100 BPM, steady tempo never below 95 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental, no vocals.
```
