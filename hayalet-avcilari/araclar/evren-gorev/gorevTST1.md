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


TASK TST1: make failing/flaky tests green WITHOUT weakening what they guard. Diagnosis is already done (below): follow it, do
not re-investigate from scratch. Only item 1d and item 2 change game code; everything else changes test files only. Never raise
a threshold or delete a check unless the item says so. Tests are slow: run each file once after its fix, not in loops.
1. test/engel-bicim.test.mjs (6 failing checks; ~5 min per run). Cause of 5 of them: startGame() now builds the journey map,
   whose lists contain two kinds of entries that engeller.js deliberately does not paint through the engelResmi cache:
   props (o.donati === true, in game.walls, tur undefined, tema undefined; painted by yolculukDonatilariCiz) and river crossings
   (o.gecit truthy, in game.waters; painted by yolculukGecitCiz; onbellegiIsit skips `o.gecit`, duvarSirasi filters `o.donati`).
   The expectations are outdated; update them like this (add one helper `const onbellekli = (o) => !o.donati && !o.gecit;` at
   the top of the page-side code that needs it, with a Turkish comment explaining why):
   a. olcekDenetimi (~69): filter `gor` with !o.donati && !o.gecit. Fixes "ekran dönünce ve tablet boyunda önbellek yeni
      ölçekte", "tablette önbellek ölçeği 2" and the gecisResim part of "bölüm geçişinde yeni engeller". Keep `n > 0` asserts.
   b. "bölüm geçişinde yeni engeller" (~302): compute bicimsiz/temaDisi/eski over `yeni.filter((o) => !o.donati && !o.gecit)`
      (measured: the only offenders are 19 props with tema undefined). Add a new assertion that every prop still has a bicim.
   c. "önbellek bölüm başında ısınır" (~455) and "ölçek değişince yeniden ısınır" (~487): count hazir/toplam only over
      entries that are not donati/gecit (measured: 71/97 → the 26 missing are 20 props + 6 crossings). The "0 yeni tuval" part
      counted every document.createElement('canvas'); measured 154 canvases while walking the map and NONE from engeller.js
      (76 uc-avci.js modelPise, 78 zemin-katmani.js parcaKur/yolKatmani/lekeTuvali: floor chunks are built lazily by design).
      Count only canvases created from engeller.js: in the wrapper use `new Error().stack` and count when the stack contains
      "engeller.js". Keep `assert.equal(isinma.tuval, 0)`; additionally report the total in the check title.
   d. "kayarak yürüme … bot" (~383-401) is a REAL bug (it fails the same way on the commits before FIXG1): with a vertical
      rope bridge over the test lake the bot walks to the near bridge end, switches to the far end while still 26 px beside the
      bridge centre line (the free strip is KOPRU.serbest = 18 px), enters the water beside the bridge and stays stuck forever
      (while a bridge target exists updateBot resets ilerlemeSure, so the 2.5 s teleport never fires). Fix in www/game.js
      botKopruNoktasi (~8660-8687), two conditions only:
      - stage 0 → 1: `Math.hypot(b.x - kendi.x, b.y - kendi.y) < 24` gets an extra condition: the bot is on the strip,
        `Math.abs(b.kopru.yatay ? b.y - b.kopru.c : b.x - b.kopru.c) <= KOPRU.serbest - 6`;
      - bridge finished: distance to `karsi` `< 24` becomes `< 10` (the far end is 30 px on land; leaving the strip earlier put
        the r = 18 bot inside the lake's collision and it could not move).
      Verified by patching the page: the test scenario then ends 77 px from the player, largest step 3 px, no teleport. Do not
      change the test's bot expectation (≤ 100 px, takilma < 0.5, adim < 10). Also run test/kopru.test.mjs and test/pet.test.mjs.
   The other checks of this file already pass; do not touch them. Expected result: 0 failing.
2. test/yolculuk-perf.test.mjs "uzun haritada çizim kare süresi eski haritanın 1,3 katını geçmez" (measured 1.35x on an idle
   machine, 1.5-2x when loaded; threshold stays 1.3). Facts measured: the check times 120 un-flushed render() calls (≈0.09 ms
   per frame classic vs ≈0.12 ms journey), so it measures per-frame JavaScript and the NUMBER of canvas calls, not raster cost.
   One journey frame issues 35 drawImage (classic: 5). The light ring (zemin-katmani.js isikHalkasiCiz ~1066) is already a cached
   canvas and is not drawn while paused: do not touch it. Remove per-frame JS work that grows with the journey map instead:
   a. www/zemin-katmani.js zeminKatmaniCiz (~975): every frame it builds a string key `cx|cy|s` and does a Map lookup per
      visible chunk, then scans the (cols+2)×(rows+2) ring with more string keys for the "pre-build one chunk" step, and toggles
      ctx.imageSmoothingEnabled. Cache the view: keep module variables for the last (x0, y0, x1, y1, s, onbellek identity) and
      an array of {canvas, x, y} for the visible chunks plus a flag "ring complete"; when the view cell range is unchanged and
      all visible chunks were ready, just loop over the array with drawImage and skip the ring scan when the flag is set.
      Invalidate when the Map is replaced/cleared (zeminKatmaniSil, zeminKatmaniKur, scale change) — compare the Map object
      and its size. Behaviour (which chunk is built in which frame) must stay identical.
   b. www/engeller.js engelleriCiz (~1084) runs twice per frame ("arka", "on") and each time does
      `listeler().some((l) => l.some((o) => !o.bicim))` over every obstacle (~100 on a journey map, ~25 classic) and
      `(game.waters || []).filter(...)` + `.map`. Cache the "all have bicim" answer keyed by the four list identities and
      lengths (recompute when any changes, like duvarSirasi does with _sira), and skip the water block allocations when no
      water is in view (plain for loop). No drawing change.
   c. Then measure with the profile method of test/perf1.test.mjs (~89-108: stub one draw function at a time, `tam - olcF`) but
      WITHOUT the getImageData flush, to see what else differs between the two maps; fix only clear per-frame waste (repeated
      array building, string keys, sort, closures per object). Do not remove or simplify anything visible.
   If after a-c the ratio is still above 1.3 on an idle machine, stop and report the per-function table; do not change the test.
   Run test/perf1.test.mjs, test/zem1a1.test.mjs, test/zem3b.test.mjs, test/zempar.test.mjs, test/fixg2.test.mjs afterwards.
3. test/cizim.test.mjs (~139-149): absolute `fps >= 30 && p95 <= 100` checks (botParliyor, canli, hayalet, Dünya Turu FR/KE/JP)
   fail on a loaded machine although nothing is slow. Keep the same strictness on a healthy machine and scale it down only by
   what the machine can do: add `tabanOlc(ms)` = the same rAF sampler as `olc` (~37) but run while the game is paused
   (game.paused = true before, restore after; if a paused game still renders, use a second blank page of the same browser
   instead) and measure it for 1000 ms IMMEDIATELY BEFORE each of the measured scenes, in the same page (interleaved: taban,
   scene, taban, scene …). Thresholds per scene: fps >= Math.min(30, 0.6 * taban.fps) and p95 <= Math.max(100, 2.5 * taban.p95).
   Additionally keep the relative guards: botParliyor.fps >= 0.8 * botNormal.fps and hayalet.fps >= 0.8 * canli.fps (these are
   the regressions the test was written for: hit-flash filter and ghost-player drawing). Print taban values in the messages.
   The tablet zeminli/zeminsiz ratio check (~153) is already relative: leave it.
4. Test outputs must never land in a git-tracked file: test/uc-avci.test.mjs (~656) writes test/ciktilar/uc-avcilar.png and
   test/yd1.test.mjs (~326) writes test/ciktilar/yd2.png. Redirect both to test/ekran/ (ignored by .gitignore; mkdirSync
   recursive), update the check title/comment that names the path, and grep test/ for any other writeFileSync/screenshot
   path that is not under test/ekran/, a --ekran argument or an EKRAN variable; redirect those too. Do not delete any file.
Test: no new test file; the proof is the fixed files themselves plus one new check for 1d in test/kopru.test.mjs:
(a) bot + vertical bridge: build the scene of engel-bicim (`game.level = 6; game.walls = []; game.waters =
[engelOlustur({ x: 600, y: 500, w: 220, h: 150 }, 'su', 0, 1234)]`, player at 920,650, bot at 560,470, 240 frames of update at
1/60) → bot within 100 px of the player, largest step < 10 px, and it was on the bridge strip while over water;
(b) the same for game.level = 1 (horizontal bridge) still passes; (c) node test/engel-bicim.test.mjs → 0 failing;
(d) node test/yolculuk-perf.test.mjs passes twice in a row; (e) node test/cizim.test.mjs passes and prints taban values;
(f) node test/uc-avci.test.mjs passes and writes only under test/ekran/; (g) no page errors in any of them.
Summary at the end: what you changed (file + function), test results (before/after numbers for item 2), anything skipped and why.

EXTRA ITEM 5 (added later): test/dunya-turu.test.mjs fails 2 checks on the current code (before any change):
"zemin ressamı yokken turZeminCiz false (ızgara çizilir)" and "Dünya Turu ekranı: 51 ülke + 1 Yakında kartı (2 damgalı, 5 açık,
44 kilitli), 4 kıta, sayaç 🛂 2/51". Run it, print the actual vs expected values, decide per check whether the expectation is
outdated (e.g. every family now has a ChatGPT ground texture aile-<X>-zemin, so a "no ground painter" country may no longer exist;
card counts changed by later content) → update the test to the intended behaviour with a comment, or a real bug → minimal fix.
Do this item LAST and only if time remains.

EXTRA ITEM 6 (added later, do after item 5 if time remains): test/anim.test.mjs fails "toplanınca renkli halka açılır ve süresi
bitince silinir; liste taşmaz" on the current code: when an-elmas frames are loaded, toplamaEfekti adds a frame effect without the
"renk" field the test expects. The ChatGPT frame path is intended; update the check so it accepts the frame effect (the effect
exists, ends after its duration, the list stays bounded) instead of requiring a colour ring.
