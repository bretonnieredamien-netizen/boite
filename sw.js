self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('boite-v1').then((cache) => cache.addAll([
      'boite-magique.html',
      'manifest.json'
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});