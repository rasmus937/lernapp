const CACHE_NAME = 'lernapp-v28';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './sm2.js',
  './learn.js',
  './gamification.js',
  './scanner.js',
  './ollama.js',
  './import-export.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Skip non-GET and cross-origin requests
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  // Network-first: try network, fall back to cache (ensures updates arrive immediately)
  e.respondWith(
    fetch(e.request).then(response => {
      if (response.ok && response.url.startsWith(self.location.origin)) {
        const ct = response.headers.get('content-type') || '';
        const safe = ['text/html', 'text/css', 'application/javascript', 'text/javascript',
                      'image/svg+xml', 'image/png', 'application/json', 'application/manifest+json'];
        if (safe.some(t => ct.includes(t))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
      }
      return response;
    }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});
