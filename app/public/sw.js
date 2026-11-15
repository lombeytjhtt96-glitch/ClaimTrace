const CACHE_NAME = 'claimtrace-v1.3.0';
const STATIC_ASSETS = [
  '/manifest.json',
  '/assets/images/bpjs_icon.png'
];

const IS_LOCAL_HOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '[::1]';

// Install: Avoid caching local HTML shells so rebuilds/dev reloads never serve stale chunk hashes
self.addEventListener('install', (event) => {
  if (IS_LOCAL_HOST) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches; on localhost unregister stale SW and reload open tabs cleanly
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => IS_LOCAL_HOST || key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
      if (IS_LOCAL_HOST) {
        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        await self.registration.unregister().catch(() => false);
        await Promise.all(
          windowClients.map((client) => client.navigate(client.url).catch(() => null))
        );
      }
    })()
  );
});

// Fetch: Bypass SW on localhost; in production use Network-First for HTML navigations & APIs
self.addEventListener('fetch', (event) => {
  if (IS_LOCAL_HOST) {
    return;
  }

  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET, cross-origin, or WebSocket requests
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.protocol.startsWith('ws')) {
    return;
  }

  // HTML navigations: ALWAYS Network-First so asset chunk hashes remain in sync
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.ok) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return response;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // API requests: Network-first with cache fallback for offline field audits
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Static assets: Cache-first, fall back to network
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkResponse;
      });
    })
  );
});
