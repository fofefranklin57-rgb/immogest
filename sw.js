// ImmoGest Service Worker — DEPLOY22
const CACHE_NAME = 'immogest-v22';
const ASSETS = [
  '/',
  '/index.html',
  '/app.css',
  '/js/app.js',
  '/js/supabase.js',
  '/js/i18n.js',
  '/js/monetisation.js',
  '/js/onesignal.js',
  '/js/portail-locataire.js',
  '/js/push-module.js',
  '/js/ads.js',
  '/js/ai-service.js',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation — mise en cache des assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activation — nettoyage anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network first, cache fallback
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non GET et les API externes
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('api.anthropic.com')) return;
  if (event.request.url.includes('unsplash.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre en cache la réponse fraîche
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
