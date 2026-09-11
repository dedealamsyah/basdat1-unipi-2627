/* =====================================================================
   service-worker.js · Offline Support for PWA
   Strategi: navigasi = network-first; aset statis = cache-first;
   API (/api/*) & request data = network-only (tidak pernah di-cache,
   karena berisi data sesi/nilai dan dapat tercemar oleh challenge HTML
   dari hosting).
   ===================================================================== */

const CACHE_NAME = "basdat-unipi-v3";
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

// Jangan simpan respons yang berpotensi HTML challenge anti-bot dari hosting.
// Cache hanya respons aset yang benar-benar berguna.
function cacheable(response) {
  if (!response || response.status !== 200 || !response.ok) return false;
  var ct = response.headers.get("Content-Type") || "";
  return ct !== "" && ct.indexOf("text/html") === -1;
}

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

// Fetch
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;

  // Lewati permintaan lintas-asal (font, dsb)
  if (event.request.url.startsWith(self.location.origin) === false) {
    return;
  }

  // API & permintaan data: SELALU ke jaringan, jangan pernah di-cache
  // (berisi data sesi/nilai & dapat terpengaruh challenge hosting).
  if (/\/api\//.test(event.request.url)) return;
  if (event.request.destination === "") return; // fetch()/XHR umum

  // Mode navigasi (halaman): selalu coba jaringan dulu
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).then(function(networkResponse) {
        if (cacheable(networkResponse)) {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(async function() {
        var cachedPage = await caches.match(event.request);
        return cachedPage || caches.match("./index.html");
      })
    );
    return;
  }

  // Aset statis (script/style/font/gambar): cache-first, perbarui di latar
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        event.waitUntil(
          fetch(event.request).then(function(networkResponse) {
            if (cacheable(networkResponse)) {
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
        if (cacheable(networkResponse)) {
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