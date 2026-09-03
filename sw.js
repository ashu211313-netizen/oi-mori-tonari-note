const CACHE_PREFIX = "wild-world-companion-";
const IMAGE_CACHE_PREFIX = "wild-world-images-";
const CACHE_NAME = "wild-world-companion-v13";
const IMAGE_CACHE_NAME = "wild-world-images-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./src/styles.css",
  "./src/app.js",
  "./src/data.js",
  "./src/availability.js",
  "./src/storage.js",
  "./src/recommendations.js",
  "./src/pricing.js",
  "./src/ui-logic.js",
  "./src/images.js",
  "./src/expansion-data.js",
  "./src/universal-search.js",
  "./src/acquisition.js",
  "./src/calendar-content.js",
  "./src/generated/expansion-records.js",
  "./src/generated/image-assets.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => (
          key.startsWith(CACHE_PREFIX) || key.startsWith(IMAGE_CACHE_PREFIX)
        ) && ![CACHE_NAME, IMAGE_CACHE_NAME].includes(key))
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  const isLocalImage = event.request.destination === "image" && url.pathname.includes("/assets/");
  const targetCache = isLocalImage ? IMAGE_CACHE_NAME : CACHE_NAME;
  event.respondWith(
    caches.open(targetCache).then((cache) => cache.match(event.request).then(async (cached) => {
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          event.waitUntil(cache.put(event.request, copy));
        }
        return response;
      } catch {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    }))
  );
});
