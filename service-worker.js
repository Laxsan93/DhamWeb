
const CACHE_NAME = 'etf-v4.2'; 
const ASSETS = [
  'index.html',
  'accueil.css',
  'accueil.js',
  'formulaire.html',
  'formulaire.css',
  'formulaire.js',
  'ETFlogo.png',
  'manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Stratégie : Réseau d'abord, sinon Cache (pour garantir la fraîcheur)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});