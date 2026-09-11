import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("PWA shell has app root, stylesheet, module entry and manifest", () => {
  const html = read("index.html");
  assert.match(html, /id="app"/);
  assert.match(html, /src="\.\/src\/app\.js"/);
  assert.match(html, /href="\.\/src\/styles\.css"/);
  assert.match(html, /rel="manifest"/);
});

test("security and privacy contract blocks third-party execution and telemetry APIs", () => {
  const html = read("index.html");
  const app = read("src/app.js");
  const storage = read("src/storage.js");
  const csp = /Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1] ?? "";
  for (const directive of ["default-src 'self'", "base-uri 'none'", "object-src 'none'", "frame-src 'none'", "form-action 'none'", "connect-src 'self'", "script-src 'self'"]) {
    assert.ok(csp.includes(directive), `missing CSP directive: ${directive}`);
  }
  assert.equal(/<(?:script|link)[^>]+(?:src|href)="https?:\/\//i.test(html), false);
  assert.equal(/navigator\.(?:geolocation|sendBeacon)|document\.cookie|\bfetch\s*\(/.test(app), false);
  assert.match(storage, /const KEY = "wildWorldCompanionState\.v1"/);
  assert.match(app, /保存データはこの端末のブラウザ内だけに保存され/);
  assert.match(app, /target="_blank" rel="noopener noreferrer"/);
});

test("manifest has installable identity and raster icons", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.lang, "ja");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(path.join(root, icon.src.replace(/^\.\//, ""))), `missing ${icon.src}`);
  }
});

test("service worker precache entries resolve to real files", () => {
  const sw = read("sw.js");
  const assets = [...sw.matchAll(/"\.\/(.*?)"/g)].map((match) => match[1]).filter(Boolean);
  for (const asset of assets) {
    assert.ok(fs.existsSync(path.join(root, asset)), `missing precache asset ${asset}`);
  }
  assert.match(sw, /src\/pricing\.js/);
  assert.match(sw, /event\.request\.mode === "navigate"/);
  assert.match(sw, /new URL\(event\.request\.url\)\.origin !== self\.location\.origin/);
  assert.match(sw, /src\/images\.js/);
  assert.match(sw, /src\/lifecycle\.js/);
  assert.match(sw, /src\/expansion-data\.js/);
  assert.match(sw, /src\/universal-search\.js/);
  assert.match(sw, /src\/generated\/expansion-records\.js/);
  assert.match(sw, /src\/generated\/image-assets\.js/);
  assert.match(sw, /icon-180\.png/);
  assert.match(sw, /wild-world-companion-v15/);
  assert.match(sw, /wild-world-images-v1/);
});

test("service worker precaches atomically and waits for an explicit update handoff", async () => {
  const handlers = {};
  const precached = [];
  let skipWaitingCalls = 0;
  const context = {
    URL,
    Response,
    fetch,
    self: {
      location: { origin: "https://example.test", href: "https://example.test/oi-mori-tonari-note/sw.js" },
      clients: { claim: async () => undefined },
      skipWaiting: async () => { skipWaitingCalls += 1; },
      addEventListener: (name, handler) => { handlers[name] = handler; }
    },
    caches: {
      keys: async () => [],
      delete: async () => true,
      open: async () => ({
        addAll: async (assets) => { precached.push(...assets); },
        match: async () => undefined,
        put: async () => undefined
      })
    }
  };
  vm.runInNewContext(read("sw.js"), context);

  let installation;
  handlers.install({ waitUntil: (promise) => { installation = promise; } });
  await installation;
  assert.equal(skipWaitingCalls, 0);
  assert.ok(precached.includes("./icon-180.png"));
  assert.ok(precached.includes("./src/lifecycle.js"));

  handlers.message({ data: { type: "NOT_AN_UPDATE" }, waitUntil: () => assert.fail("unexpected waitUntil") });
  assert.equal(skipWaitingCalls, 0);
  let handoff;
  handlers.message({
    data: { type: "SKIP_WAITING" },
    waitUntil: (promise) => { handoff = promise; }
  });
  await handoff;
  assert.equal(skipWaitingCalls, 1);
});

test("service worker activation removes only old app and image caches", async () => {
  const handlers = {};
  const deleted = [];
  const context = {
    URL,
    Response,
    fetch,
    self: {
      location: { origin: "https://example.test", href: "https://example.test/oi-mori-tonari-note/sw.js" },
      clients: { claim: async () => undefined },
      skipWaiting: async () => undefined,
      addEventListener: (name, handler) => { handlers[name] = handler; }
    },
    caches: {
      keys: async () => [
        "wild-world-companion-v6",
        "wild-world-companion-v7",
        "wild-world-companion-v8",
        "wild-world-companion-v9",
        "wild-world-companion-v10",
        "wild-world-companion-v12",
        "wild-world-companion-v13",
        "wild-world-companion-v14",
        "wild-world-companion-v15",
        "wild-world-images-v0",
        "wild-world-images-v1",
        "another-app-v1"
      ],
      delete: async (key) => { deleted.push(key); return true; },
      open: async () => ({ addAll: async () => undefined, put: async () => undefined }),
      match: async () => undefined
    }
  };
  vm.runInNewContext(read("sw.js"), context);
  let activation;
  handlers.activate({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, [
    "wild-world-companion-v6",
    "wild-world-companion-v7",
    "wild-world-companion-v8",
        "wild-world-companion-v9",
        "wild-world-companion-v10",
    "wild-world-companion-v12",
    "wild-world-companion-v13",
    "wild-world-companion-v14",
    "wild-world-images-v0"
  ]);
});

test("navigation always uses the canonical shell key and never caches query URLs", async () => {
  const handlers = {};
  const matched = [];
  const put = [];
  let networkCalls = 0;
  const shell = new Response("shell", { status: 200 });
  const context = {
    URL,
    Response,
    fetch: async () => { networkCalls += 1; return new Response("network"); },
    self: {
      location: { origin: "https://example.test", href: "https://example.test/oi-mori-tonari-note/sw.js" },
      clients: { claim: async () => undefined },
      skipWaiting: async () => undefined,
      addEventListener: (name, handler) => { handlers[name] = handler; }
    },
    caches: {
      keys: async () => [],
      delete: async () => true,
      open: async () => ({
        addAll: async () => undefined,
        match: async (request) => {
          matched.push(request);
          return request === "https://example.test/oi-mori-tonari-note/index.html" ? shell : undefined;
        },
        put: async (request) => { put.push(request); }
      })
    }
  };
  vm.runInNewContext(read("sw.js"), context);
  let responsePromise;
  handlers.fetch({
    request: {
      method: "GET",
      mode: "navigate",
      destination: "document",
      url: "https://example.test/oi-mori-tonari-note/?resume=3"
    },
    respondWith: (promise) => { responsePromise = promise; }
  });
  const response = await responsePromise;
  assert.equal(await response.text(), "shell");
  assert.deepEqual(matched, ["https://example.test/oi-mori-tonari-note/index.html"]);
  assert.deepEqual(put, []);
  assert.equal(networkCalls, 0);
});

test("static assets are cache-first and cache a safe network response", async () => {
  const handlers = {};
  const cachedResponse = new Response("cached");
  const put = [];
  let networkCalls = 0;
  const cache = {
    addAll: async () => undefined,
    match: async (request) => request.url.endsWith("cached.js") ? cachedResponse : undefined,
    put: async (request, response) => { put.push([request.url, response]); }
  };
  const networkResponse = {
    status: 200,
    type: "basic",
    clone: () => new Response("network-copy")
  };
  const context = {
    URL,
    Response,
    fetch: async () => { networkCalls += 1; return networkResponse; },
    self: {
      location: { origin: "https://example.test", href: "https://example.test/oi-mori-tonari-note/sw.js" },
      clients: { claim: async () => undefined },
      skipWaiting: async () => undefined,
      addEventListener: (name, handler) => { handlers[name] = handler; }
    },
    caches: {
      keys: async () => [],
      delete: async () => true,
      open: async () => cache
    }
  };
  vm.runInNewContext(read("sw.js"), context);

  const dispatch = async (url) => {
    let responsePromise;
    handlers.fetch({
      request: { method: "GET", mode: "cors", destination: "script", url },
      respondWith: (promise) => { responsePromise = promise; }
    });
    return responsePromise;
  };

  const cached = await dispatch("https://example.test/src/cached.js");
  assert.equal(await cached.text(), "cached");
  assert.equal(networkCalls, 0);

  const network = await dispatch("https://example.test/src/fresh.js");
  assert.equal(network, networkResponse);
  assert.equal(networkCalls, 1);
  assert.equal(put.length, 1);
  assert.equal(put[0][0], "https://example.test/src/fresh.js");
});

test("UI exposes evidence limits and the current data version", () => {
  const app = read("src/app.js");
  assert.match(app, /単一資料・要追加確認/);
  assert.match(app, /地域未確定資料で補強/);
  assert.match(app, /JP独立2資料検証/);
  assert.match(app, /dataVersion/);
});

test("clock control name contains its visible text and navigation contrast stays accessible", () => {
  const app = read("src/app.js");
  const css = read("src/styles.css");
  assert.match(app, /aria-label="ゲーム内時間 \$\{clockLabel\}。ゲーム内日時を変更"/);
  assert.match(css, /--muted:\s*#655d54/);
});

test("mobile interaction CSS does not override controls below 44px", () => {
  const css = read("src/styles.css");
  const pxValues = [...css.matchAll(/min-height:\s*(\d+)px/g)].map((match) => Number(match[1]));
  const controlValues = pxValues.filter((value) => value < 100);
  assert.ok(controlValues.length > 0);
  assert.equal(controlValues.some((value) => value < 44), false);
  assert.match(css, /:focus-visible/);
});

test("museum cards have a matching click handler", () => {
  const app = read("src/app.js");
  assert.match(app, /data-filter-museum=/);
  assert.match(app, /button\.dataset\.filterMuseum/);
});
