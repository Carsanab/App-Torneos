// Cambia 'v1' por 'v2' para forzar al navegador a borrar la versión anterior
const CACHE_NAME = 'apptorneos-v2'; 
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './logo.svg',
  './manifest.json'
];

// Evento de instalación
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Forzar activación inmediata
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Evento de activación: elimina cachés antiguas automáticamente
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});