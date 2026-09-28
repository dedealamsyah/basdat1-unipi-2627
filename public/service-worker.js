/* =====================================================================
   service-worker.js · Offline Support for PWA
   Strategi: navigasi = network-first; aset statis = cache-first;
   API (/api/*) & request data = network-only (tidak pernah di-cache,
   karena berisi data sesi/nilai dan dapat tercemar oleh challenge HTML
   dari hosting).
   ===================================================================== */

// Naikkan versinya setiap kali isi `_astro/` berubah drastic, agar SW lama
// beserta cache lamanya dibuang saat aktivasi (activate).
const CACHE_NAME = "basdat-unipi-v6";
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.png",
  "./logo-unipi.png",
  "./erd-interactive.js",
  "./auth.js",
  "./mhs-ui.js",
  "./game-entitas.js",
  "./game-fd.js",
  "./game-komponen.js",
  "./sql-wasm.wasm"
];

// Halaman luring: dipakai saat jaringan gagal. Sengaja TEKS SEDERHANA
// (bukan halaman portal) supaya jelas ini pesan, bukan materi.
const LURING_HTML = [
  "<!doctype html><html lang=id><head><meta charset=utf-8>",
  "<meta name=viewport content=\"width=device-width,initial-scale=1\">",
  "<title>Luring - Portal Basis Data UNIPI</title>",
  "<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;",
  "background:#0E1418;color:#E7EDF3;display:grid;place-items:center;",
  "min-height:100vh;margin:0;padding:24px}",
  ".k{max-width:420px;text-align:center}",
  "h1{font-size:19px;margin:0 0 8px}",
  "p{font-size:14px;line-height:1.6;color:#9AA8B5;margin:0 0 18px}",
  "button{font:inherit;font-weight:600;padding:10px 20px;border-radius:9px;",
  "border:0;background:#176B4D;color:#fff;cursor:pointer}</style></head>",
  "<body><div class=k><h1>Sambungan terputus</h1>",
  "<p>Halaman ini belum tersimpan di perangkat dan server tidak dapat dihubungi. ",
  "Periksa koneksi, lalu coba lagi.</p>",
  "<button onclick=\"location.reload()\">Coba lagi</button></div></body></html>"
].join("");

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
        // Offline / hosting tidak menjawab. Tampilkan halaman yang benar-benar
        // dicache untuk URL ini, atau halaman "luring" yang jelas.
        //
        // DULUM fallback-nya caches.match("./index.html") — jadi gagal membuka
        // "/pertemuan/5/" menampilkan beranda, yang terbaca sebagai "halaman
        // yang tadi terbuka", bukan "gagal memuat".
        var cachedPage = await caches.match(event.request);
        if (cachedPage) return cachedPage;
        return new Response(LURING_HTML, {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
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