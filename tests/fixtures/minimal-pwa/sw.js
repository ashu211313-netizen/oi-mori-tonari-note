/* global self, caches */
const CACHE = "ww-minimal-isolation-v1";
self.addEventListener("install", (event) => event.waitUntil(
  caches.open(CACHE).then((cache) => cache.add("./index.html")).then(() => self.skipWaiting())
));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("./index.html")));
  }
});
