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
3. **Exclude Styles** (Advanced Options içinde) kutusuna: `vocals, singing, choir, heavy drums, driving dance beat, EDM, trap, dubstep, rock, distorted guitar, breakdown, fade-out`
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

| # | Kod | Ülke | Şu anki tempo | Durum |
|---|---|---|---|---|
| 1 | RU | Rusya | 137 BPM | bekliyor |
| 2 | PS | Filistin | 136 BPM | bekliyor |
| 3 | UZ | Özbekistan | 135 BPM | bekliyor |
| 4 | CO | Kolombiya | 134 BPM | bekliyor |
| 5 | PL | Polonya | 134 BPM | bekliyor |
| 6 | BR | Brezilya | 133 BPM | bekliyor |
| 7 | CN | Çin | 133 BPM | bekliyor |
| 8 | IQ | Irak | 133 BPM | bekliyor |
| 9 | IT | İtalya | 133 BPM | bekliyor |
| 10 | MX | Meksika | 133 BPM | bekliyor |
| 11 | BD | Bangladeş | 132 BPM | bekliyor |
| 12 | ID | Endonezya | 132 BPM | bekliyor |
| 13 | JP | Japonya | 132 BPM | bekliyor |
| 14 | PH | Filipinler | 132 BPM | bekliyor |
| 15 | VN | Vietnam | 132 BPM | bekliyor |
| 16 | CA | Kanada | 131 BPM | bekliyor |
| 17 | EG | Mısır | 131 BPM | bekliyor |
| 18 | ES | İspanya | 131 BPM | bekliyor |
| 19 | KR | Güney Kore | 131 BPM | bekliyor |
| 20 | AR | Arjantin | 130 BPM | bekliyor |
| 21 | DE | Almanya | 130 BPM | bekliyor |
| 22 | DZ | Cezayir | 130 BPM | bekliyor |
| 23 | GB | Birleşik Krallık | 130 BPM | bekliyor |
| 24 | IN | Hindistan | 130 BPM | bekliyor |
| 25 | MA | Fas | 130 BPM | bekliyor |
| 26 | MM | Myanmar | 130 BPM | bekliyor |
| 27 | MY | Malezya | 130 BPM | bekliyor |
| 28 | PK | Pakistan | 130 BPM | bekliyor |
| 29 | SA | Suudi Arabistan | 130 BPM | bekliyor |
| 30 | TH | Tayland | 130 BPM | bekliyor |
| 31 | UA | Ukrayna | 130 BPM | bekliyor |
| 32 | US | ABD | 130 BPM | bekliyor |
| 33 | IR | İran | 129 BPM | bekliyor |
| 34 | KE | Kenya | 129 BPM | bekliyor |
| 35 | MG | Madagaskar | 129 BPM | bekliyor |
| 36 | NG | Nijerya | 129 BPM | bekliyor |
| 37 | SD | Sudan | 129 BPM | bekliyor |
| 38 | TZ | Tanzanya | 129 BPM | bekliyor |
| 39 | AF | Afganistan | 128 BPM | bekliyor |
| 40 | CI | Fildişi Sahili | 128 BPM | bekliyor |
| 41 | GH | Gana | 128 BPM | bekliyor |
| 42 | UG | Uganda | 128 BPM | bekliyor |
| 43 | YE | Yemen | 128 BPM | bekliyor |
| 44 | ZA | Güney Afrika | 128 BPM | bekliyor |
| 45 | ET | Etiyopya | 127 BPM | bekliyor |
| 46 | MZ | Mozambik | 127 BPM | bekliyor |
| 47 | CD | Kongo DC | 126 BPM | bekliyor |
| 48 | AO | Angola | 99 BPM | isteğe bağlı (şu anki zaten sakin) |
| 49 | FR | Fransa | 98 BPM | isteğe bağlı (şu anki zaten sakin) |
| 50 | PE | Peru | 95 BPM | isteğe bağlı (şu anki zaten sakin) |

### 1. RU — Rusya

- Başlık: `Hayalet Avcilari - RU`
- Stil (387 karakter):

```
Russian Romantic chamber and fairytale ballet style: gusli psaltery, domra, balalaika, flute, celesta and soft strings, a lyrical melody in natural minor turning to bright major, graceful and storybook-like, light pizzicato. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 2. PS — Filistin

- Başlık: `Hayalet Avcilari - PS`
- Stil (371 karakter):

```
Palestinian and Levantine classical takht music: oud, qanun, nay, buzuq and soft riq with daf, a lyrical instrumental muwashshah-style melody in maqam Bayati turning to bright maqam Ajam, graceful ornaments. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 3. UZ — Özbekistan

- Başlık: `Hayalet Avcilari - UZ`
- Stil (353 karakter):

```
Uzbek Shashmaqam classical music of Bukhara and Samarkand: tanbur, dutar, ghijak spike fiddle, nay flute, chang dulcimer and soft doira frame drum, a stately but bright melody in maqam Rast. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 4. CO — Kolombiya

- Başlık: `Hayalet Avcilari - CO`
- Stil (384 karakter):

```
Colombian Andean chamber music by a trio andino: bandola, tiple, guitar and wooden flute, a refined pasillo and bambuco style melody with delicate tremolo in a bright major key with tender minor shades, very soft shaker. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 5. PL — Polonya

- Başlık: `Hayalet Avcilari - PL`
- Stil (376 karakter):

```
Polish Romantic salon music: an elegant lyrical mazurka in 3/4 for piano, string quartet, clarinet and flute, Lydian raised-fourth colour and graceful rubato-free phrasing, light pizzicato cello keeping the pulse. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 6. BR — Brezilya

- Başlık: `Hayalet Avcilari - BR`
- Stil (364 karakter):

```
Brazilian choro chamber music in a calm lyrical style: flute, bandolim, cavaquinho, seven-string guitar and very soft pandeiro, elegant chromatic melody in a bright major key with playful modulations. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 7. CN — Çin

- Başlık: `Hayalet Avcilari - CN`
- Stil (369 karakter):

```
Chinese Jiangnan sizhu silk-and-bamboo chamber music: guzheng, erhu, dizi, pipa and yangqin, a flowing elegant melody in the pentatonic gong mode with delicate ornaments, soft wooden clapper and small bell. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 8. IQ — Irak

- Başlık: `Hayalet Avcilari - IQ`
- Stil (375 karakter):

```
Iraqi maqam art music by a chalghi baghdadi ensemble: santur, joza spike fiddle, oud, qanun and soft riq with dumbak, a poised instrumental melody in the bright maqam Rast with delicate hammered-dulcimer shimmer. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 9. IT — İtalya

- Başlık: `Hayalet Avcilari - IT`
- Stil (371 karakter):

```
Italian Baroque chamber concerto in the Venetian and Neapolitan style: mandolin, harpsichord, two violins, cello and theorbo, sunny major-key sequences, singing bel canto style melody, light pizzicato pulse. Gentle, artistic, mellow and melodic, soft light percussion, 102 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 10. MX — Meksika

- Başlık: `Hayalet Avcilari - MX`
- Stil (369 karakter):

```
Mexican salon and Veracruz harp art music: arpa jarocha, Chiapas marimba, requinto jarocho, violin and soft guitarron, an elegant vals mexicano style melody in a sunny major key with sweet parallel thirds. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 11. BD — Bangladeş

- Başlık: `Hayalet Avcilari - BD`
- Stil (367 karakter):

```
Bengali classical art music: esraj bowed lute, sarod, bansuri flute, dotara, tanpura and soft tabla, a lyrical melody in raga Khamaj inspired by the refined Bengali art-song tradition, flowing and tender. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 12. ID — Endonezya

- Başlık: `Hayalet Avcilari - ID`
- Stil (398 karakter):

```
Javanese court gamelan in the soft-style (gamelan gadhon) of the Yogyakarta and Surakarta palaces: gender, gambang xylophone, siter zither, suling bamboo flute and rebab, quiet kendhang and gong, serene bright melody in slendro tuning. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 13. JP — Japonya

- Başlık: `Hayalet Avcilari - JP`
- Stil (366 karakter):

```
Japanese Edo-period sankyoku chamber music: koto, shakuhachi, shamisen and kokyu, a gentle elegant melody blending the in and yo pentatonic scales with a bright spring mood, very soft small tsuzumi taps. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 14. PH — Filipinler

- Başlık: `Hayalet Avcilari - PH`
- Stil (374 karakter):

```
Filipino rondalla art music in the kundiman and danza serenade tradition: bandurria, laud, octavina, guitar and bajo de unas bass, tender tremolo melody moving from minor to bright major, graceful habanera lilt. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 15. VN — Vietnam

- Başlık: `Hayalet Avcilari - VN`
- Stil (378 karakter):

```
Vietnamese chamber art music of the Hue court and ca Hue tradition: dan tranh zither, dan nguyet moon lute, dan nhi fiddle, dan bau monochord and sao bamboo flute, soft song lang clapper, bright pentatonic Bac mode. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 16. CA — Kanada

- Başlık: `Hayalet Avcilari - CA`
- Stil (375 karakter):

```
Canadian Quebecois and Acadian parlour chamber music: fiddle played as a slow lyrical air, wooden flute, piano, Celtic harp and acoustic guitar, a sweet melody in Dorian and major modes, very soft foot-tap pulse. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 17. EG — Mısır

- Başlık: `Hayalet Avcilari - EG`
- Stil (366 karakter):

```
Egyptian classical Arabic takht ensemble: oud, qanun, nay, violin and soft riq, an elegant instrumental sama'i and tahmila style piece in the bright maqam Rast, refined ornaments and short solo answers. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 18. ES — İspanya

- Başlık: `Hayalet Avcilari - ES`
- Stil (400 karakter):

```
Spanish classical guitar art music in the romantic nationalist style: classical guitar, bandurria, laud, cello and very soft castanets, Andalusian cadence in the Phrygian mode with bright major turns, elegant rasgueado-free fingerstyle. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 19. KR — Güney Kore

- Başlık: `Hayalet Avcilari - KR`
- Stil (362 karakter):

```
Korean jeongak court chamber music in a brighter pungnyu style: gayageum, geomungo, daegeum bamboo flute, haegeum and soft janggu, graceful melody in the pyeongjo pentatonic mode with gentle vibrato. Gentle, artistic, mellow and melodic, soft light percussion, 94 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 20. AR — Arjantin

- Başlık: `Hayalet Avcilari - AR`
- Stil (369 karakter):

```
Argentine chamber tango and milonga campera in a tender salon style: bandoneon, violin, piano, guitar and double bass, lyrical melody in a minor key brightening to major, soft habanera pulse, no percussion. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 21. DE — Almanya

- Başlık: `Hayalet Avcilari - DE`
- Stil (415 karakter):

```
German Baroque chamber music: harpsichord, baroque violin, traverso flute, oboe and cello continuo in a bright major-key dance-suite style (gavotte and bourree character), clear counterpoint and graceful ornaments, no percussion beyond soft pizzicato. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 22. DZ — Cezayir

- Başlık: `Hayalet Avcilari - DZ`
- Stil (385 karakter):

```
Algerian Andalusi classical music of the Algiers san'a and Tlemcen gharnati schools: kwitra lute, mandole, qanun, rebab, ney flute, soft tar and derbouka, elegant nuba-style melody in a bright Andalusi mode (tab' Mezmoum). Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 23. GB — Birleşik Krallık

- Başlık: `Hayalet Avcilari - GB`
- Stil (377 karakter):

```
English Renaissance consort music blended with a pastoral air: lute, viola da gamba, recorder, virginal and Celtic harp, a sweet melody in Dorian and Mixolydian modes with a courtly galliard lilt, faint tabor taps. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 24. IN — Hindistan

- Başlık: `Hayalet Avcilari - IN`
- Stil (356 karakter):

```
Indian Hindustani classical music: sitar, bansuri flute, santoor, tanpura drone and soft tabla, a tender gat in raga Bhupali (major pentatonic) in a light medium teental, graceful meend slides. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 25. MA — Fas

- Başlık: `Hayalet Avcilari - MA`
- Stil (397 karakter):

```
Moroccan Andalusi art music (al-Ala nuba tradition): oud, rabab, kamanja violin held upright, qanun, soft tar tambourine and darbuka, a graceful melody in the bright tab' of the Andalusi modal system, flowing ornamented unison lines. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 26. MM — Myanmar

- Başlık: `Hayalet Avcilari - MM`
- Stil (391 karakter):

```
Burmese classical chamber music of the Mahagita tradition: saung gauk arched harp, pattala bamboo xylophone, palwei bamboo flute and soft si and wa bell-and-clapper timekeeping, graceful melody in the than yoe heptatonic tuning. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 27. MY — Malezya

- Başlık: `Hayalet Avcilari - MY`
- Stil (372 karakter):

```
Malay court and asli art music: gambus lute, rebab, violin, serunai played softly, soft rebana frame drum and small gong, a flowing ornamented asli melody with graceful patah lagu turns in a bright Malay mode. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 28. PK — Pakistan

- Başlık: `Hayalet Avcilari - PK`
- Stil (367 karakter):

```
Pakistani Hindustani classical chamber music of the Lahore tradition: sarangi, sitar, bansuri flute, tanpura drone and soft tabla, a gentle gat in raga Pahadi in a light medium tempo, lyrical and smiling. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 29. SA — Suudi Arabistan

- Başlık: `Hayalet Avcilari - SA`
- Stil (344 karakter):

```
Hejazi urban art music of the Jeddah salons: oud, qanun, nay, violin and soft mirwas with riq, a refined instrumental danah-style melody in maqam Hijaz moving to bright maqam Ajam. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 30. TH — Tayland

- Başlık: `Hayalet Avcilari - TH`
- Stil (415 karakter):

```
Thai classical court music by a mahori and khrueang sai ensemble: ranat ek xylophone with soft mallets, khim dulcimer, saw duang fiddle, khlui flute and soft ching cymbals, graceful melody in the seven-tone equidistant Thai tuning with pentatonic core. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 31. UA — Ukrayna

- Başlık: `Hayalet Avcilari - UA`
- Stil (423 karakter):

```
Ukrainian bandura art music in the kobzar tradition: bandura, tsymbaly hammered dulcimer, sopilka wooden flute and soft violin, a lyrical dumka-style melody in the Ukrainian Dorian mode with raised fourth, delicate plucked arpeggios, faint tambourine touches. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 32. US — ABD

- Başlık: `Hayalet Avcilari - US`
- Stil (374 karakter):

```
American pastoral chamber Americana with a light ragtime touch: fiddle, acoustic guitar, piano, clarinet and upright bass, open fifths and major pentatonic melody evoking wide prairies, soft brushed snare only. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 33. IR — İran

- Başlık: `Hayalet Avcilari - IR`
- Stil (364 karakter):

```
Persian classical music in the bright dastgah Mahur: santur, tar, ney, kamancheh and soft tombak, a graceful pishdaramad and reng style melody with delicate tahrir-like ornaments played instrumentally. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 34. KE — Kenya

- Başlık: `Hayalet Avcilari - KE`
- Stil (375 karakter):

```
Kenyan lyre and string art tradition: Luo nyatiti lyre, orutu one-string fiddle, Luhya litungu lyre, chivoti bamboo flute and soft kayamba shaker, flowing storyteller-style pentatonic melody with gentle ostinato. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 35. MG — Madagaskar

- Başlık: `Hayalet Avcilari - MG`
- Stil (365 karakter):

```
Malagasy highland Merina court art music: valiha tube zither, marovany box zither, sodina flute, kabosy lute and soft kaiamba shaker, sparkling arpeggios in a bright major mode with a lilting 6/8 sway. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 36. NG — Nijerya

- Başlık: `Hayalet Avcilari - NG`
- Stil (360 karakter):

```
Nigerian Hausa emirate court chamber music: molo lute, goje one-string fiddle, kukuma fiddle, sarewa flute and soft calabash percussion, graceful courtly pentatonic melody, ornamented and flowing. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 37. SD — Sudan

- Başlık: `Hayalet Avcilari - SD`
- Stil (374 karakter):

```
Sudanese haqiba-style urban art music: oud, violin, tambour lyre, accordion and soft bongos with riq, graceful swaying melody on the Sudanese anhemitonic pentatonic scale, call-and-answer between oud and violin. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 38. TZ — Tanzanya

- Başlık: `Hayalet Avcilari - TZ`
- Stil (377 karakter):

```
Zanzibar taarab art music of the Swahili coast: qanun, oud, violin, nai flute and accordion, soft dumbak and rika tambourine, an elegant instrumental bashraf-style melody in the bright maqam Rast with Swahili lilt. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 39. AF — Afganistan

- Başlık: `Hayalet Avcilari - AF`
- Stil (367 karakter):

```
Afghan classical music of the Kabul Kharabat tradition: rubab, dilruba, tanbur, santur and soft tabla, an instrumental naghma-ye klasik in a bright raga close to Bilawal, sparkling plucked rubab patterns. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 40. CI — Fildişi Sahili

- Başlık: `Hayalet Avcilari - CI`
- Stil (399 karakter):

```
Ivorian Mande jeli art music of the northern savanna: kora harp-lute, Senufo balafon, ngoni lute and bolon bass harp, cascading heptatonic patterns in a bright tuning, intricate gentle interlocking lines, soft calabash taps and shaker. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 41. GH — Gana

- Başlık: `Hayalet Avcilari - GH`
- Stil (383 karakter):

```
Ghanaian Akan court art music: seperewa harp-lute, atenteben bamboo flute, gyil xylophone and soft palm-wine style acoustic guitar, lilting pentatonic melody over a quiet 6/8 timeline on firikyiwa finger bell and shaker. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 42. UG — Uganda

- Başlık: `Hayalet Avcilari - UG`
- Stil (408 karakter):

```
Ugandan Buganda royal court music: amadinda and akadinda xylophones, ennanga arched harp, endongo lyre, endere flute and endingidi tube fiddle, fast-shimmering yet quiet interlocking patterns in the equal pentatonic Kiganda tuning, soft shaker. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 43. YE — Yemen

- Başlık: `Hayalet Avcilari - YE`
- Stil (378 karakter):

```
Yemeni Sana'a art-song tradition played instrumentally: qanbus (turbi) lute, oud, soft sahn nuhasi copper tray and mirwas, intimate ornamented melody in a bright Yemeni maqam close to Rast, delicate plucked figures. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 44. ZA — Güney Afrika

- Başlık: `Hayalet Avcilari - ZA`
- Stil (392 karakter):

```
South African musical-bow art tradition: Xhosa uhadi bow, umrhubhe mouth bow, Zulu makhweyana bow, Venda mbila and soft marimba, shimmering overtone melodies on a hexatonic scale built from two root notes, soft leg-rattle shaker. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 45. ET — Etiyopya

- Başlık: `Hayalet Avcilari - ET`
- Stil (377 karakter):

```
Ethiopian azmari chamber art music: krar lyre, masenqo one-string fiddle, washint bamboo flute and soft kebero touches, a sweet nostalgic melody in the tizita major qenet pentatonic scale, ornamented and unhurried. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 46. MZ — Mozambik

- Başlık: `Hayalet Avcilari - MZ`
- Stil (403 karakter):

```
Mozambican Chopi timbila art music, a refined xylophone orchestra tradition: timbila xylophones of several sizes, xitende musical bow, bamboo flute and soft shakers, rippling interlocking melodies in the equal-step heptatonic Chopi tuning. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 47. CD — Kongo DC

- Başlık: `Hayalet Avcilari - CD`
- Stil (390 karakter):

```
Congolese traditional art music: likembe thumb piano, Mangbetu kundi court harp, madimba xylophone and bamboo flute, shimmering interlocking patterns in a bright hexatonic tuning, soft seed-pod shaker and quiet slit-drum taps. Gentle, artistic, mellow and melodic, soft light percussion, 100 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 48. AO — Angola (isteğe bağlı)

- Başlık: `Hayalet Avcilari - AO`
- Stil (375 karakter):

```
Angolan traditional art music: kissange thumb piano, marimba xylophone, hungu musical bow and acoustic guitar in a tender Luanda serenade style, bright pentatonic and major-key phrases, very soft dikanza scraper. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 49. FR — Fransa (isteğe bağlı)

- Başlık: `Hayalet Avcilari - FR`
- Stil (374 karakter):

```
French impressionist chamber music: harp, flute, clarinet, string quartet and celesta, shimmering whole-tone and pentatonic colours, flowing arpeggios and a light Parisian waltz elegance, soft triangle sparkles. Gentle, artistic, mellow and melodic, soft light percussion, 96 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```

### 50. PE — Peru (isteğe bağlı)

- Başlık: `Hayalet Avcilari - PE`
- Stil (381 karakter):

```
Peruvian Andean art music: Andean harp, charango, quena flute, zampona panpipes and guitar, a sweet yaravi turning to a gentle bright melody on the Andean minor pentatonic scale, soft bombo touches and chajchas shaker. Gentle, artistic, mellow and melodic, soft light percussion, 98 BPM, calm cheerful adventure video game background music, steady loop-friendly flow, instrumental.
```
