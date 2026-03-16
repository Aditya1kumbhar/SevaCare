const CACHE_NAME = 'sevacare-offline-v2';
const DYNAMIC_CACHE = 'sevacare-dynamic-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon.svg',
  '/icon-light-32x32.png',
  '/icon-dark-32x32.png',
  '/apple-icon.png',
  '/offline',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch here so that if one fails, it doesn't break the whole install
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => console.error('Failed to cache', url, err)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== DYNAMIC_CACHE) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Next.js Static Assets & Image optimization - Cache First, Network Fallback
  // These chunks never change their content without changing their filename hash.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        }).catch(() => {
           // Do nothing if asset fails to load offline
        });
      })
    );
    return;
  }

  // 2. Navigation Requests (HTML pages) - Stale While Revalidate / Network First with Offline Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // It's a successful HTML load, update the dynamic cache
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => {
          // If network fails (offline), try cache.
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If page is not in cache, fallback to the generic offline page or root
            return caches.match('/offline').then(offlineRes => {
                if(offlineRes) return offlineRes;
                return caches.match('/'); // Last resort
            });
          });
        })
    );
    return;
  }

  // 3. API or generic fetch (e.g. Supabase POSTs) - Network Only (Handled by offline-db.ts queue)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
      // Let standard fetch handle it, offline queue will catch failures later in the UI
      return;
  }

  // 4. Default Strategy for everything else: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch((err) => {
          console.error("Fetch failed for", event.request.url, err);
      });

      return cachedResponse || fetchPromise;
    })
  );
});
