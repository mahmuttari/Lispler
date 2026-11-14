const CACHE = "ortakkarar-a3984a004bde";
const FILES = ["app-ads.txt","art/custom.webp","art/food.webp","art/gourmet.webp","art/kids.webp","art/lucky.webp","art/movie.webp","art/student.webp","art/weekend.webp","assets/ArenaScreen-CZrIKDCD.js","assets/CardView-BKfmtxDy.js","assets/LobbyScreen-CJx-Wj3V.js","assets/ResultScreen-BAAyYZeV.js","assets/SoloScreen-_ihoJG65.js","assets/admob-ULr3aoyy.js","assets/animate-DhEjXOCu.js","assets/confetti-CE2BnPHp.js","assets/dist-B-Lo1tqG.js","assets/esm-o2VNt6GK.js","assets/firebaseBackend-7rn-ffzW.js","assets/index-CKG142r5.js","assets/index-CZjJjJ4i.css","assets/nunito-latin-ext-wght-normal-CXYtwYOx.woff2","assets/nunito-latin-wght-normal-BzFMHfZw.woff2","assets/parse-DmW1yA9w.js","assets/preload-helper-DclECHGd.js","assets/share-HBf5sBal.js","assets/sound-DCeV90Zf.js","assets/storage-Cg6PuAzd.js","assets/ui-z-kbMKxy.js","assets/web-CJiv0TG-.js","favicon.svg","gizlilik.html","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","index.html","manifest.webmanifest","og-image.jpg","sfx/go.mp3","sfx/join.mp3","sfx/like.mp3","sfx/match.mp3","sfx/no-match.mp3","sfx/nope.mp3","sfx/pop.mp3","sfx/super.mp3"];

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
