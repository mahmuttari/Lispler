/* Hayalet Avcıları — Service Worker
   Capacitor APK içinde SW'ye gerek yok; eski cache'leri temizleyip kendini kaldırır. */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Tüm eski cache'leri sil
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    // Kendini iptal et
    await self.registration.unregister();
    // Açık olan sekmeleri yenile ki yeni varlıklar yüklensin
    const clientsList = await self.clients.matchAll({ type: "window" });
    for (const c of clientsList) {
      try { c.navigate(c.url); } catch (e) { /* ignore */ }
    }
  })());
});

self.addEventListener("fetch", () => { /* doğrudan ağa/dosya sistemine bırak */ });
