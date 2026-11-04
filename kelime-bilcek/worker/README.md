# Kelime Bilcek — Cloudflare Worker (`floral-wave-f116`)

`https://floral-wave-f116.mahmuttari.workers.dev/` oyunun yapay zekâ kelime hakemidir. `worker.js` v3:
Firebase kimlik jetonu zorunlu, girdi sınırı, hız sınırı, CORS izin listesi (ayrıntı: dosyanın başı ve
[`../DENETIM.md`](../DENETIM.md) › K-03, K-07). Bağlama: Workers AI, değişken adı **AI** (Worker'da zaten tanımlı).

Sınama: `node --test kelime-bilcek/worker/worker.test.mjs` (kimlik, girdi, CORS, hız sınırı, karar; 8 test).

## Yayın (Cloudflare panosu)

Bu depodan Cloudflare'e otomatik yayın yok (API anahtarı gerektirir; bulut oturumunun Cloudflare bağlantısı yalnız
okur). Pano ile:

1. https://dash.cloudflare.com → **Workers & Pages** → `floral-wave-f116` → **Edit code**.
2. Editördeki her şeyi silip `kelime-bilcek/worker/worker.js`'in **tamamını** yapıştırın → **Deploy**.
3. Denetim: tarayıcıda `https://floral-wave-f116.mahmuttari.workers.dev/` açılınca
   `{"gecerli":false,"sebep":"Yalnız POST"}` görünmeli; jetonsuz POST `401 Giriş gerekli` döner.

Sıra önemli değil: 1.0.0 uygulaması jetonu her istekte gönderir; v4.11 hiç yayınlanmadığı için eski istemci yok.

İsteğe bağlı otomatik yayın: Cloudflare'de yalnız "Workers Scripts: Edit" izinli bir API jetonu oluşturup GitHub'a
`CLOUDFLARE_API_TOKEN` ve `CLOUDFLARE_ACCOUNT_ID` secret'ı olarak eklenirse `npx wrangler deploy` ile bir iş akışı
kurulabilir (`wrangler.toml` hazır). Jetonu kullanıcı oluşturur ve girer.
