/* Bingo Caller service worker — app-shell cache so the console keeps working
   with no signal/wifi once it's been opened (or installed) at least once.
   Bump CACHE_NAME whenever index.html changes so clients pick up the update
   instead of being stuck on a stale cached copy. */
const CACHE_NAME = 'bingo-caller-v2.24';
const APP_SHELL = ['./', './index.html', './styles.css', './app.js', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for the app shell (instant offline load), falling back to the
// network for anything else and opportunistically caching same-origin GETs.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
