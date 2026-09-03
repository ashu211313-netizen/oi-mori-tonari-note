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
  assert.match(sw, /src\/expansion-data\.js/);
  assert.match(sw, /src\/universal-search\.js/);
  assert.match(sw, /src\/generated\/expansion-records\.js/);
  assert.match(sw, /src\/generated\/image-assets\.js/);
  assert.match(sw, /wild-world-companion-v13/);
  assert.match(sw, /wild-world-images-v1/);
});

test("service worker activation removes only old app and image caches", async () => {
  const handlers = {};
  const deleted = [];
  const context = {
    URL,
    Response,
    fetch,
    self: {
      location: { origin: "https://example.test" },
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
    "wild-world-images-v0"
  ]);
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
