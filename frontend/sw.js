// Service Worker for Sahayak AI PWA caching and offline readiness
const CACHE_NAME = "sahayak-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/dashboard.html",
  "/emergency.html",
  "/contacts.html",
  "/history.html",
  "/login.html",
  "/register.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/static/css/style.css",
  "/static/js/api.js",
  "/static/js/auth.js",
  "/static/js/location.js",
  "/static/js/voice.js",
  "/static/js/dashboard.js",
  "/static/js/emergency.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log("Cache pre-fill skipped:", err));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return; // Dynamic API calls are handled with local fallback in api.js
  }

  // Cache first, falling back to network
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get("accept") && event.request.headers.get("accept").includes("text/html")) {
          return caches.match("/dashboard.html");
        }
      });
    })
  );
});
