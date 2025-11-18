const CACHE_NAME = 'timecard-pro-v2';
const API_CACHE_NAME = 'timecard-api-cache-v1';
const STATIC_CACHE_NAME = 'timecard-static-v2';

// Essential static assets
const staticAssets = [
  '/',
  '/index.html',
  '/manifest.json'
];

// API endpoints to cache with strategies
const apiCacheConfig = {
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxEntries: 50
};

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(cache => {
        return cache.addAll(staticAssets).catch(err => {
          console.warn('Cache.addAll failed:', err);
        });
      }),
      caches.open(API_CACHE_NAME)
    ]).then(() => self.skipWaiting())
  );
});

// Advanced fetch with caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for Supabase API calls (with offline fallback)
  if (url.origin.includes('supabase')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Cache-first for static assets
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Network-first for HTML pages
  event.respondWith(networkFirstStrategy(request));
});

// Network-first strategy: try network, fall back to cache
async function networkFirstStrategy(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request.clone());
    
    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Serving from cache (offline):', request.url);
      return cachedResponse;
    }
    
    // No cache available, return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Richiesta salvata, verrà sincronizzata quando tornerai online' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy: try cache, fall back to network
async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Update service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME];
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      cleanupOldCacheEntries()
    ]).then(() => self.clients.claim())
  );
});

// Clean up old cache entries based on maxAge
async function cleanupOldCacheEntries() {
  const cache = await caches.open(API_CACHE_NAME);
  const requests = await cache.keys();
  const now = Date.now();
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const cachedTime = response.headers.get('sw-cache-time');
      if (cachedTime && (now - parseInt(cachedTime)) > apiCacheConfig.maxAge) {
        await cache.delete(request);
      }
    }
  }
}

// Message handler for manual cache clearing
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});