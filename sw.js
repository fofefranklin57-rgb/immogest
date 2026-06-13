// ImmoGest Service Worker — DEPLOY26
const CACHE_NAME = 'immogest-v26';
const ASSETS = [
  '/',
  '/index.html',
  '/app.css',
  '/docx.bundle.js',
  '/js/app.js',
  '/js/supabase.js',
  '/js/i18n.js',
  '/js/pay-config.js',
  '/js/signature.js',
  '/js/marketplace.js',
  '/js/monetisation.js',
  '/js/onesignal.js',
  '/js/portail-locataire.js',
  '/js/push-module.js',
  '/js/ads.js',
  '/js/ai-service.js',
  '/icon-192.png',
  '/icon-512.png'
];

// ── Installation — mise en cache des assets ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activation — nettoyage anciens caches ────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch — Network first, cache fallback (Offline Support) ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Ne pas intercepter les API externes
  const url = event.request.url;
  if (url.includes('api.anthropic.com')) return;
  if (url.includes('unsplash.com')) return;
  if (url.includes('supabase.co')) return;
  if (url.includes('workers.dev')) return;
  if (url.includes('onesignal.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre en cache la réponse fraîche pour usage hors ligne
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Hors ligne : servir depuis le cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback vers index.html pour les navigations
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Hors ligne', { status: 503 });
        });
      })
  );
});

// ── Push Notifications ───────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(e) { data = { title: 'ImmoGest', body: event.data.text() }; }

  const title   = data.title   || 'ImmoGest';
  const options = {
    body:    data.body    || data.message || '',
    icon:    data.icon    || '/icon-192.png',
    badge:   '/icon-192.png',
    data:    data.url ? { url: data.url } : {},
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Background Sync ──────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'immogest-sync') {
    event.waitUntil(
      // Tenter de synchroniser les données en attente
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_READY' }));
      })
    );
  }
});

// ── Periodic Sync ────────────────────────────────────────────
self.addEventListener('periodicsync', event => {
  if (event.tag === 'immogest-daily') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'PERIODIC_SYNC' }));
      })
    );
  }
});
