/* =====================================================================
   service-worker.js — Offline Support for PWA
   Caches essential assets for offline access
===================================================================== */

const CACHE_NAME = "basdat-unipi-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./content.js",
  "./app.js",
  "./manifest.json"
];

// Install: Cache essential assets
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
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

// Fetch: Serve from cache, fallback to network
self.addEventListener("fetch", function(event) {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin requests (fonts, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response("", { status: 408, statusText: "Request Timeout" });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Return cached version and update cache in background
        event.waitUntil(
          fetch(event.request).then(function(networkResponse) {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(function() {})
        );
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function() {
        // Offline and not cached
        return new Response(
          "<html><body style='font-family:system-ui;text-align:center;padding:50px;'>" +
          "<h2>Offline</h2>" +
          "<p>Anda sedang offline. Silakan periksa koneksi internet Anda.</p>" +
          "</body></html>",
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      });
    })
  );
});
