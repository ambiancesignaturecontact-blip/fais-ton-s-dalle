// Service Worker — FAIS TON S'DALLE v5.0
// Toujours servir la derniere version, jamais de cache stale
// Gère les notifications push pour le suivi de commande temps réel

const CACHE = 'ftsd-next-v5';
const PRECACHE_URLS = [
  '/images/logo.jpg',
  '/images/favicon.jpg',
  '/images/apple-icon.jpg',
  '/images/logo-192.png',
  '/images/logo-512.png',
  '/manifest.json',
];

// Installation : pre-cache les assets statiques (images, pas le HTML)
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// Activation : prendre le controle immediatement + nettoyer anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    clients.claim().then(() =>
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
    )
  );
});

// Interception : toujours network-first, jamais de cache stale
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Ignorer les appels API et les ressources hors domaine
  if (!url.origin.startsWith(self.location.origin)) return;
  if (url.pathname.startsWith('/api/')) return;

  // Network-First : toujours la version fraiche
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Mettre a jour le cache avec la reponse fraiche (sauf HTML qui change souvent)
        if (!url.pathname.endsWith('.html') && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Fallback cache si hors-ligne
        return caches.match(e.request).then((r) => {
          if (r) return r;
          // Fallback 404 si page pas en cache
          if (e.request.mode === 'navigate') {
            return caches.match('/404.html');
          }
          return new Response('', { status: 404 });
        });
      })
  );
});

// ─── Push notifications ──────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = { title: 'FAIS TON S\'DALLE', body: 'Mise à jour de ta commande !', orderId: null };

  try {
    if (e.data) {
      const parsed = e.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    // Si le texte n'est pas du JSON, l'utiliser comme body
    if (e.data) {
      data.body = e.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/images/logo-192.png',
    badge: '/images/favicon.jpg',
    tag: data.orderId ? `order-${data.orderId}` : 'ftsd-notification',
    vibrate: [200, 100, 200],
    data: {
      orderId: data.orderId,
      url: data.orderId ? `/suivi?id=${data.orderId}` : '/suivi',
    },
    actions: [
      {
        action: 'view-order',
        title: 'Voir le suivi',
      },
      {
        action: 'close',
        title: 'Fermer',
      },
    ],
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (e) => {
  const notification = e.notification;
  notification.close();

  const action = e.action;
  const url = notification.data?.url || '/suivi';

  if (action === 'close') return;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focuser et naviguer
      for (const client of clientList) {
        if (client.url.includes(url) || client.url.includes(window.location.origin)) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url });
          return;
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
