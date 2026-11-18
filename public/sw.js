// Polaris Service Worker - Offline Streetwork Engine
const CACHE_NAME = 'polaris-cache-v5';
const DATA_CACHE_NAME = 'polaris-facilities-v5';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Stale-While-Revalidate for facilities database:
  // Delivers instant cached response for streetworkers, revalidates in background.
  if (url.pathname.includes('/api/facilities')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);

        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({ facilities: [], source: 'offline_fallback', error: 'Offline - Keine zwischengespeicherten Daten' }),
              { headers: { 'Content-Type': 'application/json' }, status: 200 }
            );
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Network-First with Cache Fallback for navigation & static assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for same-origin static assets
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.origin === self.location.origin &&
          (url.pathname.startsWith('/_next/static') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.png'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const matched = await caches.match(event.request);
        if (matched) return matched;

        // Fallback for SPA page navigation
        if (event.request.mode === 'navigate') {
          const rootMatch = await caches.match('/');
          if (rootMatch) return rootMatch;
        }

        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
