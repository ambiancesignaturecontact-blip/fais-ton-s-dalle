// Service Worker — FAIS TON S'DALLE v2.0
const CACHE = 'ftd-v6';
const URLS = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json', '/404.html', '/favicon.ico', '/favicon.png',
  '/images/logo.jpg', '/images/favicon.jpg', '/images/apple-icon.jpg',
  '/images/logo-192.png', '/images/logo-512.png',
  '/images/menu-leger.jpg', '/images/menu-classique.jpg', '/images/menu-gourmand.jpg',
  '/images/tiramisu.jpg', '/images/milkshake.png',
  '/images/coca.jpg', '/images/zero.jpg', '/images/pepsi.jpg',
  '/images/oasis.jpg', '/images/icetea.jpg', '/images/orangina.jpg',
  '/images/cristaline.jpg', '/images/sanpellegrino.jpg',
  '/images/store-front.jpeg',
  '/images/google-photo-1.jpeg', '/images/google-photo-2.jpeg',
  '/images/google-photo-3.jpeg', '/images/google-photo-4.jpeg'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(URLS); }));
});

self.addEventListener('activate', function(e) {
  self.skipWaiting();
  e.waitUntil(clients.claim().then(function() {
    return caches.keys().then(function(ks) {
      return Promise.all(ks.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    });
  }));
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request).then(function(res) {
        return caches.open(CACHE).then(function(c) {
          if (e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)) {
            c.put(e.request, res.clone());
          }
          return res;
        });
      }).catch(function() {
        return caches.match('/404.html');
      });
    })
  );
});
