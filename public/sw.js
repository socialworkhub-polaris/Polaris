// Polaris Service Worker - Offline Streetwork Engine
const CACHE_NAME = 'polaris-cache-v4';
const DATA_CACHE_NAME = 'polaris-facilities-v4';

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
  const url = new URL(event.request.url);

  // Stale-While-Revalidate for facilities database:
  // Delivers instant sub-millisecond cached response for streetworkers, revalidates in background.
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
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // General Network-First with Cache Fallback for navigation & static assets
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
