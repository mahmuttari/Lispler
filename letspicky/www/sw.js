const CACHE = "ortakkarar-db4c938f689b";
const FILES = ["app-ads.txt","art/custom.webp","art/food.webp","art/gourmet.webp","art/kids.webp","art/lucky.webp","art/movie.webp","art/student.webp","art/weekend.webp","assets/ArenaScreen-6xj62Xt_.js","assets/CardView-UQMICKQ2.js","assets/LobbyScreen-DVdaL5it.js","assets/ResultScreen-MoRD0tvg.js","assets/SoloScreen-BQeuF_n8.js","assets/admob-ULr3aoyy.js","assets/animate-BTHsJwkt.js","assets/confetti-JCEsQ42q.js","assets/dist-B-Lo1tqG.js","assets/esm-o2VNt6GK.js","assets/firebaseBackend-7rn-ffzW.js","assets/index-BAT1n4A4.js","assets/index-CcXAtgzl.css","assets/nunito-latin-ext-wght-normal-CXYtwYOx.woff2","assets/nunito-latin-wght-normal-BzFMHfZw.woff2","assets/parse-DmW1yA9w.js","assets/preload-helper-DclECHGd.js","assets/share-D-wPU4w9.js","assets/sound-CJpooSNp.js","assets/storage-Cg6PuAzd.js","assets/ui-LVvSIopt.js","assets/web-CJiv0TG-.js","favicon.svg","fragman.html","gizlilik.html","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","index.html","manifest.webmanifest","og-image.jpg","sfx/go.mp3","sfx/join.mp3","sfx/like.mp3","sfx/match.mp3","sfx/no-match.mp3","sfx/nope.mp3","sfx/pop.mp3","sfx/super.mp3"];

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
