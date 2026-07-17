// Service Worker — FAIS TON S'DALLE
const CACHE = 'ftd-v1';
const URLS = ['/', '/index.html', '/manifest.json', '/404.html',
  '/images/logo.jpg', '/images/favicon.jpg', '/images/apple-icon.jpg',
  '/images/menu-leger.jpg', '/images/menu-classique.jpg', '/images/menu-gourmand.jpg',
  '/images/tiramisu.jpg', '/images/milkshake.png',
  '/images/coca.jpg', '/images/zero.jpg', '/images/pepsi.jpg',
  '/images/oasis.jpg', '/images/icetea.jpg', '/images/orangina.jpg',
  '/images/cristaline.jpg', '/images/sanpellegrino.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/404.html')))
  );
});
