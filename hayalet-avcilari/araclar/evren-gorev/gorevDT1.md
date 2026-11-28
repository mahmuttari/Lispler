You are working in /home/user/Lispler/hayalet-avcilari (HTML5 canvas mobile game "Hayalet Avcıları", plain browser JS, no build step,
no dependencies). Code comments in Turkish. DO NOT run any git command. NEVER read or write outside /home/user/Lispler/hayalet-avcilari:
no backups, no temp files in /tmp (that permission is always rejected and stops you). If a tool call is rejected, continue with the task.
Do not touch www/uc-avci.js, www/i18n/, www/karakter-detay.js, reklam/ (the playable ad folder).
TIME RULE: you have limited time. Use grep to find line numbers and read ~80-line windows only. Start editing within 10 minutes.
Small targeted edits only (never more than ~150 lines per edit, never rewrite a whole file).
Each item below is a bug found in a code review (line numbers are approximate). FIRST check it in the code; if the code already behaves
correctly, skip it and say so in the summary. Keep every fix minimal; do not change anything else (no refactors, no renames, no
network field changes unless the item says so). Every fix gets a check in the new test file. Gameplay numbers stay as they are unless
the item says otherwise. New user-visible texts: avoid them; if unavoidable use t("…") with short Turkish text.
Test harness: copy the setup of test/animasyon-ek.test.mjs (local http server on www/, Playwright Chromium at /opt/pw-browsers/chromium,
route-abort firebase/ads hosts, collect page errors). Online behaviour that needs Firebase: test the functions directly in one page by
setting online.mode = "host"/"client" and calling the functions with fake data, as the existing tests do (see test/cevrimici-ek.test.mjs).
The Firebase emulator runs on its default ports; online tests are run with NO_PROXY='*'.


TASK DT1: wire the newly cut journey ("yolculuk") images into the game. Keys exist in www/gorsel/liste.js, files www/gorsel/<key>.webp.
Project rule: code/emoji drawing stays ONLY as the fallback when the image is not loaded. Helpers (www/gorsel.js): gorsel(k) → loaded
image or null; gorselKutuya(ctx, k, x, y, w, h, alt) → contain-fit (alt=true: bottom aligned). Never stretch, never rotate. No gameplay,
collision or network change, no Math.random. ANOTHER TASK IS EDITING www/yolculuk.js (yolculukHaritaKur, yolculukYasakKutu,
yolculukDonatilariKur), www/zemin-katmani.js, www/engeller.js, www/index.html RIGHT NOW: do NOT edit index.html, zemin-katmani.js,
engeller.js at all; in yolculuk.js touch ONLY the functions named below, re-read the file right before each edit (line numbers move) and
use small exact-string edits. Do not use any symbol from www/yerlesim-sablonlari.js.
1. Theme parts for World Tour (www/yolculuk.js yolculukTemaParca ~228). Today: returns null when game.dunyaTuru, else `yol<n>-<parca>`
   with n from LEVEL_THEMES.indexOf(getTheme()) + 1 (already generic for n = 1..6: yol4..yol6 need NO code, only the test). New
   World Tour branch (before the theme code, no getTheme() call there): u = turUlkesi() (www/dunya-turu.js ~73; u.aile is one of
   K, KS, KP, SH, SV, GA, GDA, DA, KA, LA); if parca is "kopru-acik", "kopru-kapali" or "arena" → k = `yolA-${u.aile}-${parca}`,
   return k when gorsel(k) else null. For "tabela", "bayrak", "nehir" (and anything else) World Tour returns null: no family images
   exist, and a normal theme's sign/flag would clash with the country art, so World Tour keeps today's behaviour (no sign, no flag).
   try/catch → null as today. Callers need no change: yolculukCiz (~1304; closed bridge + opening frames via temaKapali/temaAcik ~1338)
   and yolculukTemaParcalariCiz (~915; arena gate, box 220×220) already draw whatever key the function returns.
2. Open bridge steady state (www/kopru.js koprulerCiz, the `k.su && k.su.gecit && gorsel("kopru-acik")` branch ~164). Today an open
   journey bridge is always drawn with the generic "kopru-acik", so the theme picture only flashes during the 0.6 s opening. New:
   const tk = typeof yolculukTemaParca === "function" ? yolculukTemaParca("kopru-acik") : null; key = tk || "kopru-acik"; enter the
   branch when gorsel(key); draw gorselKutuya(ctx, key, …same box as today…) (centred, alt=false: the deck sits on the walk strip).
   In yolculukCiz's theme opening branch (`acik && anim > 0 && temaKapali && temaAcik`) draw the temaAcik frame with alt=false too
   (the temaKapali frame stays alt=true) so the picture does not jump when koprulerCiz takes over. Collision boxes unchanged.
3. World Tour river (www/yolculuk.js yolculukNehirSuyu ~1144, yolculukNehirDesen ~1158). FACT: yol-nehir-ortak.webp (256×256,
   vertically seamless) has grass banks painted on both sides, like yol<n>-nehir, so it must NOT be tiled whole into the wavy
   channel (the code draws its own banks and clips; rule of test/tem2.test.mjs and test/gor1c.test.mjs stays: yol<n>-nehir and
   nehir-doku are never the river pattern; those tests are not changed for the river). Use only its bank-free middle column:
   new helper yolculukOrtakNehirKaro() next to yolculukNehirSuyu: im = gorsel("yol-nehir-ortak"); null if not loaded; else build
   ONCE (module variable keyed by im) a canvas 160×256: drawImage(im, 88, 0, 80, 256, 0, 0, 80, 256) and the same strip mirrored
   horizontally into x 80..160 (ctx.translate(160, 0); ctx.scale(-1, 1); same drawImage; reset) → seamless in both directions;
   set canvas._karo = 160; return the canvas. yolculukNehirSuyu: when game.dunyaTuru, return yolculukOrtakNehirKaro() ||
   today's result (dere-su → tema4-su). Normal themes unchanged (tema<n>-su / doku-kaplica). yolculukNehirDesen: scale
   o = (im._karo || NEHIR_SU_KARO) / (im.naturalWidth || im.width || 1) (canvas → 1, images as today); its one-entry cache
   (_gecitNehirDesen keyed by im) stays, so no createPattern/canvas work per frame. After a screenshot check that no green/brown
   bank pixel shows in the channel; if it does, narrow the strip (e.g. sx 96, sw 64, canvas 128, _karo 128) and say so.
4. Journey progress bar (DOM, not canvas): markup #yolculuk-hud in index.html ~168 (.yc-cubuk > .yc-ray, #yc-bolge, six i.yc-kapi,
   .yc-tac "👑", #yc-nokta; then #yc-kalan "👻 N"), CSS www/style.css ~757-827, filled by updateHUD in www/game.js (comment
   "Yolculuk çubuğu" ~9154). Do it in game.js + style.css only (elements that are missing are created once by JS). updateHUD runs
   every frame: write to the DOM only when the wanted value differs from el.dataset.k / the last number. New small helper in
   game.js: ycSimge(el, key) → if gorsel(key): when el.dataset.k !== key set el.style.backgroundImage = `url("${gorsel(key).src}")`,
   el.classList.add("yc-resim"), el.dataset.k = key; else when el.dataset.k: remove class, backgroundImage = "", delete dataset.k.
   - gates, i.yc-kapi number i: ycSimge(el, game.kopruAcik && game.kopruAcik[i] ? "yol-cubuk-kopru" : "yol-cubuk-kilit");
     fallback today's 2×10 px tick. Boss: ycSimge(.yc-tac, "yol-cubuk-boss"); fallback the 👑 text (keep the text node).
   - start: create once `<i class="yc-bas">` in #yc-cubuk (before #yc-nokta); ycSimge(el, "yol-cubuk-baslangic"); no image → no size.
   - ghost counter: build once inside #yc-kalan `<i class="yc-hayalet">👻</i>` + " " + `<span id="yc-kalan-sayi">`; update only the
     span when the number changes; ycSimge(.yc-hayalet, "yol-cubuk-hayalet"). #yc-kalan.textContent must still read "👻 N"
     (test/yolculuk.test.mjs checks /👻 \d+/ and that the counter is visible).
   CSS (after .yc-kalan): `.yc-resim { background: center / contain no-repeat; background-color: transparent; border-radius: 0;
   font-size: 0; }`; .yc-kapi.yc-resim 14×12 px; .yc-tac.yc-resim 16×14 px; .yc-bas { position: absolute; left: 0; top: 50%;
   transform: translate(-35%, -50%); } .yc-bas.yc-resim 14×13 px; .yc-hayalet { font-style: normal; } .yc-hayalet.yc-resim
   { display: inline-block; width: 14px; height: 13px; vertical-align: -2px; }. contain = never stretched; no rotate. No icon taller
   than 16 px; the #yolculuk-hud box must not change (the "bar does not overlap .pause-btn in three sizes" check must keep passing).
5. Test updates (only these): test/gor1c.test.mjs check 1 (~81-88) sets game.dunyaTuru = true on a normal game and expects
   yolculukTemaParca('arena') === null; World Tour now has family art, so the expectation becomes
   `yolA-${turUlkesi().aile}-arena` (computed in the page while dunyaTuru is true) and yolculukTemaParca('tabela') === null there;
   rename the check text. test/yd1.test.mjs (already red on 2 bridge checks since theme bridges exist): in its bridge block
   (~272, after __kur(1)) delete every GORSEL key starting with "yol" before drawing, so it tests the generic bridge again; if a
   check is still red for another reason leave it and report.
Test: test/dt1.test.mjs (harness of test/gor1c.test.mjs incl. its drawImage/createPattern recorder; World Tour start as in
test/yolculuk-perf.test.mjs: startGame({ tur: true, ulke: ulkeKodla("TR").sira }); wait until the needed gorsel(k) are loaded).
(a) fs + GORSEL_LISTESI: yol<n>-{nehir,kopru-acik,kopru-kapali,arena,tabela,bayrak} n = 1..6, yolA-<aile>-{kopru-acik,kopru-kapali,
arena} for the 10 families, yol-nehir-ortak, yol-cubuk-{baslangic,kopru,kilit,boss,hayalet}: key and file exist; (b) normal game,
level n = 1..6: yolculukTemaParca returns `yol<n>-<parca>` for the five drawn parts; for n = 4, 5, 6 closed bridge (yolculukCiz),
open bridge (koprulerCiz, kopruAcik all true, _kopruAnim empty), arena, tabela, bayrak draw the yol<n>-* image and the generic
kopru-acik/kopru-kapali is NOT drawn; (c) World Tour, first country of each of the 10 families: yolculukTemaParca gives
yolA-<aile>-kopru-acik/-kopru-kapali/-arena and null for tabela, bayrak, nehir; closed bridge, open bridge and arena draw those
sources and no yol<n>-* source; (d) World Tour river: yolculukGecitCiz calls createPattern with a 160×256 canvas (not an <img>) at
most once over 30 draws, no pattern source matches /yol\d-nehir|nehir-doku|yol-nehir-ortak/, a pixel on a gate centre line is
blue-dominant; a normal theme-2 game still patterns "tema2-su"; (e) every drawImage of a yol*/yolA* key keeps the image aspect
(±2 %) with getTransform() b === 0 and c === 0; (f) bar after updateHUD(): six .yc-kapi have yc-resim + background-image with
"yol-cubuk-kilit"; after game.kopruAcik[0] = true the first has "yol-cubuk-kopru"; .yc-tac → boss, .yc-bas → baslangic,
.yc-hayalet → hayalet; #yc-kalan.textContent matches /👻 \d+/; every icon rect ≤ 16 px high; 50 more updateHUD() calls cause 0
mutations (MutationObserver on #yolculuk-hud: attributes, childList, characterData, subtree); (g) with GORSEL["yol-cubuk-*"]
deleted updateHUD() removes yc-resim everywhere (tick / 👑 / 👻 back); (h) bar vs .pause-btn: no intersection at 844×390, 390×844,
340×700, and the #yolculuk-hud rect is the same (±0.5 px) with and without the images; (i) with GORSEL keys "yolA-*" and
"yol-nehir-ortak" deleted a World Tour journey draws bridges/arena/river as before DT1; (j) no Math.random during these draws;
(k) no page errors; (l) perf: measuring part of test/yolculuk-perf.test.mjs on a World Tour journey stays within its limit.
Also run and report: test/yolculuk.test.mjs, test/tem2.test.mjs, test/gor1c.test.mjs, test/fixg2.test.mjs, test/yd1.test.mjs,
test/kopru.test.mjs, test/dunya-turu.test.mjs, test/yolculuk-perf.test.mjs (known to be at its limit: run it 3 times and report
all three; DT1 adds no per-frame allocation, createPattern, getTheme or DOM write).
Summary at the end: what you changed (file + function), test results, anything skipped and why.
