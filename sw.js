const CACHE_PREFIX = "wild-world-companion-";
const IMAGE_CACHE_PREFIX = "wild-world-images-";
const CACHE_NAME = "wild-world-companion-v15";
const IMAGE_CACHE_NAME = "wild-world-images-v1";
const NAVIGATION_SHELL = new URL("./index.html", self.location.href).href;
const STATIC_ASSET_PATH = /\.(?:avif|css|gif|html|jpe?g|js|json|mjs|png|svg|webmanifest|webp)$/i;
const CORE_ASSETS = [
  "./",
  NAVIGATION_SHELL,
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./src/styles.css",
  "./src/app.js",
  "./src/lifecycle.js",
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
  // Keep the current client on one coherent asset generation. The new worker
  // advances after every old client closes, or after a compatible current
  // client explicitly sends SKIP_WAITING.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SKIP_WAITING") return;
  event.waitUntil(self.skipWaiting());
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

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const shell = await cache.match(NAVIGATION_SHELL);
        if (shell) return shell;
      } catch {
        // If Cache Storage is unavailable, the live navigation can still work.
      }
      try {
        return await fetch(event.request);
      } catch {
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })());
    return;
  }

  if (!STATIC_ASSET_PATH.test(url.pathname)) return;
  const isLocalImage = event.request.destination === "image" && url.pathname.includes("/assets/");
  const targetCache = isLocalImage ? IMAGE_CACHE_NAME : CACHE_NAME;
  event.respondWith((async () => {
    let cache = null;
    try {
      cache = await caches.open(targetCache);
      const cached = await cache.match(event.request);
      if (cached) return cached;
    } catch {
      // A Cache Storage failure must not prevent a successful network fetch.
    }
    try {
      const response = await fetch(event.request);
      if (cache && response.status === 200 && response.type === "basic") {
        try {
          await cache.put(event.request, response.clone());
        } catch {
          // Quota pressure may prevent runtime caching; still return the asset.
        }
      }
      return response;
    } catch {
      return new Response("Offline", { status: 503, statusText: "Offline" });
    }
  })());
});
