const CACHE_NAME = 'etf-v1.2'; // Changer le numéro ici force le nettoyage
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'ETFlogo.png',
  'manifest.json'
];

self.addEventListener('install', (e) => {
  // Force l'installation immédiate
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  // Supprime les anciens caches dès l'activation
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
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});