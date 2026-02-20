const CACHE_NAME = 'namegen-cache-v1';
const ASSETS_TO_CACHE_IMMEDIATELY = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png',
    '/icon-192.png',
    '/icon-512.png',
    '/assets/images/favicon.png'
];

// Install Event - Open cache and add assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE_IMMEDIATELY);
        })
    );
    self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Stale While Revalidate
self.addEventListener('fetch', (event) => {
    // Navigation requests: Network first, fall back to cached index.html
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/index.html');
            })
        );
        return;
    }

    // Static assets: Cache First, fall back to Network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // Cache new successful requests
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                    return fetchResponse;
                }

                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return fetchResponse;
            });
        })
    );
});
