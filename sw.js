/* Bingo Caller service worker — makes the console fully offline after the first load.
   - install:  precache every asset index.html loads (list generated into js/config/precache.js)
   - activate: drop caches from older versions
   - fetch:    navigations -> cached index.html (works offline at any URL under scope)
               same-origin assets -> cache-first, refreshed in the background (stale-while-revalidate)
               anything cross-origin is passed straight through (the app makes none)
   The cache name comes from js/config/version.js, so bumping the version is all it takes to roll a
   new cache. Both imported files are byte-checked by the browser, so changes to them update this worker. */
importScripts('js/config/version.js', 'js/config/precache.js');

const CACHE_NAME = 'bingo-caller-v' + self.APP_VERSION;
const PRECACHE = self.PRECACHE_URLS;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' bypasses the HTTP cache so a new version never precaches stale files
      .then(cache => cache.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n.startsWith('bingo-caller-') && n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Page loads: serve the cached shell instantly, ignoring query strings / start_url variants.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html', { cacheName: CACHE_NAME })
        .then(cached => cached || fetch(req))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(req).then(cached => {
        const refresh = fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        if (cached) { event.waitUntil(refresh); return cached; }
        return refresh;
      })
    )
  );
});
