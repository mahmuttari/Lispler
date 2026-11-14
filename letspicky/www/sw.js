const CACHE = "ortakkarar-8d827dad5fa4";
const FILES = ["art/custom.webp","art/food.webp","art/gourmet.webp","art/kids.webp","art/lucky.webp","art/movie.webp","art/student.webp","art/weekend.webp","assets/ArenaScreen-C2OFpLfq.js","assets/CardView-C_EIyZUU.js","assets/LobbyScreen-DQgloaJQ.js","assets/ResultScreen-DFHqO2Mk.js","assets/SoloScreen-BCXvY7oG.js","assets/animate-DIUfp6D1.js","assets/confetti-CoqpNWzQ.js","assets/esm-YQR6Yb2r.js","assets/firebaseBackend-CmY8-Wfb.js","assets/index-Ys4-1m3p.js","assets/index-njuDPx9n.css","assets/nunito-latin-ext-wght-normal-CXYtwYOx.woff2","assets/nunito-latin-wght-normal-BzFMHfZw.woff2","assets/parse-CltcjkUJ.js","assets/share-BFlG0VyN.js","assets/sound-DnyN8kDf.js","assets/ui-B63yFRw9.js","assets/web-D0E8gCVL.js","favicon.svg","gizlilik.html","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","index.html","manifest.webmanifest","og-image.jpg","sfx/go.mp3","sfx/join.mp3","sfx/like.mp3","sfx/match.mp3","sfx/no-match.mp3","sfx/nope.mp3","sfx/pop.mp3","sfx/super.mp3"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('ortakkarar-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('index.html', { ignoreSearch: true })));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
