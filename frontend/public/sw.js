const CACHE_NAME = 'sevacare-offline-v3';
const DYNAMIC_CACHE = 'sevacare-dynamic-v3';

// Full list of application routes to pre-cache for 95%+ offline capability
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/dashboard/residents',
  '/dashboard/voice-assistant',
  '/dashboard/telemedicine',
  '/dashboard/batch-log',
  '/dashboard/emergency',
  '/dashboard/privacy',
  '/offline',
  '/manifest.json',
  '/icon.svg',
  '/icon-light-32x32.png',
  '/icon-dark-32x32.png',
  '/apple-icon.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.log('[SW] Pre-cache skip for', url, err.message))
        )
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
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        }).catch(() => {
           return new Response('Offline asset', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
    return;
  }

  // 2. Navigation Requests (HTML pages) - Cache First with Network Revalidate (Stale-While-Revalidate)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed: return cached page or fallback to /offline
            return caches.match('/offline').then(offlineRes => {
              return offlineRes || caches.match('/');
            });
          });

        // Serve cached version immediately if available for 0ms load time!
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. API endpoints (Handled by IndexedDB offline-db.ts smartFetch)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    return;
  }

  // 4. Default Strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => {
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate('/dashboard/emergency');
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/dashboard/emergency');
      }
    })
  );
});
