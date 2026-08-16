// Football Academy Platform — Service Worker v1.0
// Cache-first strategy for static assets, network-first for API calls

const CACHE_NAME = 'footy-academy-v1';
const STATIC_CACHE = 'footy-static-v1';
const API_CACHE = 'footy-api-v1';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
];

// Install: pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Silently fail if some assets are unavailable
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Network-first for API calls (tRPC, auth, Stripe)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET API responses briefly
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, clone);
              // Auto-expire API cache entries after 5 minutes
              setTimeout(() => cache.delete(request), 5 * 60 * 1000);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: return cached API response if available
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ error: 'You are offline. Please check your connection.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|webp)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Return a placeholder for images when offline
          if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#1a1a2e"/><text x="100" y="110" text-anchor="middle" fill="#666" font-size="14">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
    );
    return;
  }

  // Network-first for HTML pages (SPA navigation)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cached) => cached || caches.match('/offline.html'))
          .then((fallback) => fallback || new Response('Offline', { status: 503 }));
      })
  );
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Placeholder for future offline attendance sync
  console.log('[SW] Background sync triggered');
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Football Academy', {
      body: data.message || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'academy-notification',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
