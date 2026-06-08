const CACHE = 'kairotic-v2';

const PRECACHE = [
  './',
  'index.html',
  'css/style.css',
  'js/db.js',
  'js/engine.js',
  'js/export.js',
  'js/i18n.js',
  'js/app.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
