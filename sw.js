/**
 * Shonar Ponjika — Service Worker
 */

importScripts('./version.js');

const CACHE_NAME = `bangla-calendar-v${VERSION_CONFIG.full}`;
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './calendar-logic.js',
    './events.js',
    './app.js',
    './manifest.json',
    './icon.png',
    'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
    'https://unpkg.com/lucide@latest'
];

// Install Event — Caching static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event — Cleaning up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('[SW] Removing old cache:', name);
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event — Offline-first strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return from cache if found, else fetch from network
            return response || fetch(event.request).then((fetchRes) => {
                // Optionally cache new resources here
                return fetchRes;
            });
        }).catch(() => {
            // Optional: return a fallback offline page
        })
    );
});
