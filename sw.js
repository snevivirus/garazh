// Офлайн-копия игры. Сборка 26 от 08.10.2026
const CACHE = 'garazh-26-1791410102053', IMAGES = 'garazh-img';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./","index.html","core.js","tg.js","monet.js","art.js","salon.js","manifest.webmanifest","icon-192.png","assets/cars/cars.js","assets/fonts/onest-cyrillic.woff2","assets/fonts/onest-latin.woff2"]))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== IMAGES).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (/\.(webp|png)$/.test(new URL(e.request.url).pathname)) {
    e.respondWith(caches.open(IMAGES).then(c => c.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
