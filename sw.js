// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Service Worker Offline-First
//  Prompt 3 : Offline First — fonctionne en zone rurale africaine
//  Stratégie : Cache-first pour assets, Network-first pour API
// ════════════════════════════════════════════════════════════════

var CACHE_NAME = 'immogest-v2-cache-v22';
var SYNC_TAG   = 'immogest-sync';

var ASSETS_CACHE = [
  '/',
  '/index.html',
  '/app.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/docx.bundle.js',
  '/js/config.js',
  '/js/i18n.js',
  '/js/utils.js',
  '/js/supabase.js',
  '/js/auth.js',
  '/js/immeubles.js',
  '/js/locataires.js',
  '/js/paiements.js',
  '/js/rapports.js',
  '/js/relances.js',
  '/js/dashboard.js',
  '/js/legal.js',
  '/js/juridique.js',
  '/js/marketplace.js',
  '/js/portail.js',
  '/js/plans.js',
  '/js/ads.js',
  '/js/owner.js',
  '/js/signature.js',
  '/js/onesignal.js',
  '/js/app.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_CACHE.map(function(url) {
        return new Request(url, { cache: 'reload' });
      })).catch(function(e) {
        console.warn('SW: certains assets non cachés', e.message);
      });
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Toujours réseau pour APIs externes
  if (url.hostname.includes('workers.dev') ||
      url.hostname.includes('supabase.co') ||
      url.hostname.includes('notchpay.co') ||
      url.hostname.includes('anthropic.com') ||
      url.hostname.includes('onesignal.com')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(JSON.stringify({ error: 'Hors ligne', offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Cache-first pour assets statiques
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) {
          // Rafraîchir en arrière-plan
          fetch(event.request).then(function(res) {
            if (res && res.status === 200) {
              caches.open(CACHE_NAME).then(function(c) { c.put(event.request, res); });
            }
          }).catch(function() {});
          return cached;
        }
        return fetch(event.request).then(function(res) {
          if (res && res.status === 200 && event.request.url.startsWith(self.location.origin)) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function(c) { c.put(event.request, clone); });
          }
          return res;
        }).catch(function() {
          if (event.request.headers.get('accept') &&
              event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
    );
  }
});

// Background sync — réseau revenu
self.addEventListener('sync', function(event) {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(
      self.clients.matchAll().then(function(clients) {
        clients.forEach(function(c) { c.postMessage({ type: 'SYNC_REQUESTED' }); });
      })
    );
  }
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
