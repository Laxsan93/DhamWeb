const CACHE_NAME = 'etf-v2.6';
const ASSETS = ['index.html', 'accueil.css', 'accueil.js', 'formulaire.html', 'formulaire.css', 'formulaire.js', 'ETFlogo.png', 'manifest.json'];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); return self.clients.claim(); });
self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });