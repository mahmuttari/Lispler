const CACHE = "ortakkarar-23bff5b05438";
const FILES = ["art/custom.webp","art/food.webp","art/gourmet.webp","art/kids.webp","art/lucky.webp","art/movie.webp","art/student.webp","art/weekend.webp","assets/ArenaScreen-CfD2QL6H.js","assets/CardView-BvdiNJz8.js","assets/LobbyScreen-CBnGkLJa.js","assets/ResultScreen-u23UDOtJ.js","assets/SoloScreen-C6RBl6fO.js","assets/animate-CQuEjEtE.js","assets/confetti-X3M9dR3O.js","assets/esm-D2QaDWXC.js","assets/firebaseBackend-B0buZ4rU.js","assets/index-BFJQG4h4.css","assets/index-C0ZmTOAo.js","assets/nunito-latin-ext-wght-normal-CXYtwYOx.woff2","assets/nunito-latin-wght-normal-BzFMHfZw.woff2","assets/parse-CltcjkUJ.js","assets/share-CFyY6G5f.js","assets/sound-DL2UUGHp.js","assets/ui-B1CdXLJd.js","assets/web-DYFMOYq7.js","favicon.svg","gizlilik.html","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","index.html","manifest.webmanifest","og-image.jpg","sfx/go.mp3","sfx/join.mp3","sfx/like.mp3","sfx/match.mp3","sfx/no-match.mp3","sfx/nope.mp3","sfx/pop.mp3","sfx/super.mp3"];

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
