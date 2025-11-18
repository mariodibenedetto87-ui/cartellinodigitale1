const CACHE_NAME = 'timecard-pro-v1';
// Minimal assets to cache - only what's essential
const urlsToCache = [
  '/'
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        // Only add essential assets that we know exist
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('Cache.addAll failed, continuing anyway:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Skip caching for API requests
  if (event.request.url.includes('supabase') || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).catch(err => {
          console.warn('Fetch failed for:', event.request.url, err);
          // Return a basic offline response or empty response
          return new Response('Offline - unable to fetch resource', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
      .catch(err => {
        console.error('Cache.match failed:', err);
        return fetch(event.request).catch(() => {
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});