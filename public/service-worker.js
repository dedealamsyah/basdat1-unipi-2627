/* =====================================================================
   service-worker.js · Offline Support for PWA
   Strategi cache-first dengan runtime cache untuk navigasi & aset.
===================================================================== */

const CACHE_NAME = "basdat-unipi-v2";
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.png",
  "./logo-unipi.png",
  "./erd-interactive.js",
  "./auth.js",
  "./game-entitas.js",
  "./game-fd.js",
  "./game-komponen.js",
  "./sql-wasm.wasm"
];

// Install: Precache HTML shell & aset statis
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        PRECACHE_ASSETS.map(function(url) {
          return cache.add(url);
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Navigasi = network-first (konten selalu segar),
//        aset statis = cache-first (dinamai dengan hash versi di _astro/)
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;

  // Bypass service worker untuk permintaan lintas-asal (font, dsb)
  if (event.request.url.startsWith(self.location.origin) === false) {
    return;
  }

  // Mode navigasi (halaman): selalu coba jaringan dulu
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function() {
        return caches.match(event.request).then(function(cachedPage) {
          return cachedPage || caches.match("./index.html");
        });
      })
    );
    return;
  }

  // Aset statis: cache-first, perbarui di latar belakang
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        event.waitUntil(
          fetch(event.request).then(function(networkResponse) {
            if (networkResponse && networkResponse.status === 200) {
              var responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            }
          }).catch(function() {})
        );
        return cachedResponse;
      }

      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function() {
        return new Response("", { status: 503, statusText: "Service Unavailable" });
      });
    })
  );
});
