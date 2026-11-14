const CACHE = "ortakkarar-df8f4c95b286";
const FILES = ["art/custom.webp","art/food.webp","art/gourmet.webp","art/kids.webp","art/lucky.webp","art/movie.webp","art/student.webp","art/weekend.webp","assets/ArenaScreen-CgPLKjta.js","assets/CardView-CXqyYgyW.js","assets/LobbyScreen-JeoqSsm6.js","assets/ResultScreen-BbYWlXLJ.js","assets/SoloScreen-B8GFXnFK.js","assets/animate-D6uN4-HT.js","assets/confetti-C2soUniL.js","assets/esm-CXktti7X.js","assets/firebaseBackend-Dp3NAzDe.js","assets/index-Co5oJ1Pe.js","assets/index-ppd_74XP.css","assets/nunito-latin-ext-wght-normal-CXYtwYOx.woff2","assets/nunito-latin-wght-normal-BzFMHfZw.woff2","assets/parse-CltcjkUJ.js","assets/share-DNfiozj3.js","assets/sound-Dc643StP.js","assets/ui-yAZBJiex.js","assets/web-B0tnaKyh.js","favicon.svg","gizlilik.html","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","index.html","manifest.webmanifest","og-image.jpg","sfx/go.mp3","sfx/join.mp3","sfx/like.mp3","sfx/match.mp3","sfx/no-match.mp3","sfx/nope.mp3","sfx/pop.mp3","sfx/super.mp3"];

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
