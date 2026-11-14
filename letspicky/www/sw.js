const CACHE = "ortakkarar-ccc83e754772";
const FILES = ["app-ads.txt","art/custom.webp","art/food.webp","art/gourmet.webp","art/kids.webp","art/lucky.webp","art/movie.webp","art/student.webp","art/weekend.webp","assets/ArenaScreen-YcY0cN1g.js","assets/CardView-Dqcu8ubO.js","assets/LobbyScreen-CrwsYEWB.js","assets/ResultScreen-DE6s1p-H.js","assets/SoloScreen-Dl_IPPUD.js","assets/admob-ULr3aoyy.js","assets/animate-DhbgYU8h.js","assets/confetti-tGeH93fs.js","assets/dist-B-Lo1tqG.js","assets/esm-o2VNt6GK.js","assets/firebaseBackend-CWCHcNjL.js","assets/index-DXk5Z917.css","assets/index-TPTW2Chh.js","assets/nunito-latin-ext-wght-normal-CXYtwYOx.woff2","assets/nunito-latin-wght-normal-BzFMHfZw.woff2","assets/parse-CmbVbq8b.js","assets/preload-helper-DclECHGd.js","assets/share-DDHqf63M.js","assets/sound-ChiBnrLq.js","assets/storage-Cg6PuAzd.js","assets/ui-CjNxHZdg.js","assets/web-CJiv0TG-.js","favicon.svg","fragman.html","gizlilik.html","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","index.html","manifest.webmanifest","og-image.jpg","sfx/go.mp3","sfx/join.mp3","sfx/like.mp3","sfx/match.mp3","sfx/no-match.mp3","sfx/nope.mp3","sfx/pop.mp3","sfx/super.mp3"];

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
