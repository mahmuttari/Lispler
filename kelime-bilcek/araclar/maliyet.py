# Kelime Bilcek aylık maliyet modeli (USD) — DENETIM.md › 1.0.2. Çalıştırma: python3 araclar/maliyet.py
# Fiyatlar 9 Kasım 2026: Cloudflare Workers AI ve Workers (resmî sayfa), Firebase ve AdMob (Gemini, Google araması).
NEURON_USD = 0.011 / 1000
IN_N, OUT_N = 26668 / 1e6, 204805 / 1e6          # Llama 3.3 70B fp8-fast: nöron / token
FREE_N_GUN = 10_000
def denetim_noron(giris_tok, cikis_tok, cagri): return cagri * (giris_tok * IN_N + cikis_tok * OUT_N)
KAT = denetim_noron(360, 35, 2)   # kategori kelimesi: hakem + şüpheci
ZIN = denetim_noron(180, 25, 2)   # zincir kelimesi
# maç başına yapay zekâ denetimi (listede olmayan kelime) — çok oyunculu
MAC = {'hizli': 80 * KAT, 'tenis': 15 * KAT, 'zincir': 10 * ZIN}
KARISIM = {'hizli': 0.5, 'tenis': 0.3, 'zincir': 0.2}
N_MAC = sum(MAC[m] * KARISIM[m] for m in MAC)
N_BOT = sum(MAC[m] / 2 * KARISIM[m] for m in MAC)   # yapay zekâya karşı: yalnız insanın kelimeleri denetlenir
RTDB_MB_MAC, RTDB_MB_OTURUM = 0.05, 0.02             # ölçümden türetilmiş, ihtiyatlı
def ay(mac_gun, oran_bot=0.0, onbellek=0.0, tek_cagri=False, kucuk_model=False):
    n = mac_gun * ((1 - oran_bot) * N_MAC + oran_bot * N_BOT) * (1 - onbellek)
    if tek_cagri: n *= 0.5
    if kucuk_model: n *= (4119 * 360 + 34868 * 35) / (26668 * 360 + 204805 * 35)
    ai = max(0, n - FREE_N_GUN) * 30 * NEURON_USD
    plan = 5 if n > FREE_N_GUN else 0
    gb = mac_gun * 30 * ((1 - oran_bot) * RTDB_MB_MAC + RTDB_MB_OTURUM) / 1024
    rtdb = max(0, gb - 10) * 1.0
    reklam = mac_gun * 30 * (0.5 * 1.5 / 1000 + 2 * 0.2 / 1000)  # maç başına 0,5 geçiş ($1,5 eCPM) + 2 banner ($0,2)
    return dict(ai=ai + plan, rtdb=rtdb, toplam=ai + plan + rtdb, reklam=reklam, noron_gun=n, gb=gb)
print(f"nöron/kelime kategori {KAT:.1f} zincir {ZIN:.1f}; maç başına ortalama {N_MAC:.0f} nöron = ${N_MAC*NEURON_USD:.4f}; bota karşı {N_BOT:.0f} = ${N_BOT*NEURON_USD:.4f}")
print(f"ücretsiz 10.000 nöron/gün ≈ {FREE_N_GUN/N_MAC:.1f} çok oyunculu maç/gün")
print("\nmaç/gün | bugünkü düzen: AI$ + DB$ = toplam/ay | reklam geliri/ay | iyileştirilmiş (önbellek %70 + tek çağrı) | + küçük model")
for m in [100, 1000, 10000, 100000, 1000000]:
    a = ay(m); b = ay(m, onbellek=0.7, tek_cagri=True); c = ay(m, onbellek=0.7, tek_cagri=True, kucuk_model=True)
    print(f"{m:>8} | {a['ai']:>9.0f} + {a['rtdb']:>6.0f} = {a['toplam']:>9.0f} (DB {a['gb']:.0f} GB) | {a['reklam']:>8.0f} | {b['toplam']:>8.0f} | {c['toplam']:>7.0f}")
print("\nYapay zekâya karşı oyun (bot kelimeleri cihazdaki sözlükten, yalnız oyuncu kelimesi denetlenir):")
for m in [100, 1000, 10000]:
    a = ay(m, oran_bot=1.0); b = ay(m, oran_bot=1.0, onbellek=0.7, tek_cagri=True)
    print(f"{m:>8} bot maçı/gün: {a['toplam']:>7.0f} $/ay  | iyileştirilmiş {b['toplam']:>6.0f} $/ay | reklam {a['reklam']:.0f} $/ay")
print("\nKKV önbelleği %95 + tek çağrı (kategori), Zincir için cihazda büyük sözlük:")
for m in [100, 1000, 10000, 100000]:
    a = ay(m, onbellek=0.95, tek_cagri=True); kv = m * 30 * 46 * 1.0 / 1e6 * 0.5  # KV okuma: maç başına ~46 okuma, 0,5$/M (10M/ay dahil)
    print(f"{m:>8} maç/gün: {a['toplam']:>7.0f} $/ay (+ KV ≈ {max(0, kv - 5):.0f} $) | reklam {a['reklam']:.0f} $/ay")
