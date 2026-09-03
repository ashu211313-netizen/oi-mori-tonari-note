import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { close, createStaticServer, listen } from "../scripts/static-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(root, relative), "utf8");

test("PWA shell remains portable under a GitHub Pages repository path", () => {
  const html = read("index.html");
  const manifest = JSON.parse(read("manifest.webmanifest"));
  const sw = read("sw.js");
  assert.equal(/(?:href|src)="\/(?!\/)/.test(html), false);
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.match(sw, /caches\.match\("\.\/index\.html"\)/);
  assert.match(sw, /wild-world-companion-v14/);
});

test("iPhone home-screen metadata and local icons are present", () => {
  const html = read("index.html");
  assert.match(html, /apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /apple-mobile-web-app-title" content="となりノート"/);
  assert.match(html, /apple-touch-icon" href="\.\/icon-192\.png"/);
});

test("static server can model a repository-path mount without host-root fallback", async () => {
  const server = createStaticServer(root, { basePath: "/oi-mori-tonari-note/" });
  const origin = await listen(server);
  try {
    assert.equal((await fetch(origin)).status, 404);
    assert.equal((await fetch(new URL("oi-mori-tonari-note/", origin))).status, 200);
    assert.equal((await fetch(new URL("oi-mori-tonari-note/src/app.js", origin))).status, 200);
  } finally {
    await close(server);
  }
});

test("CI and Pages workflows use least privilege and official Pages actions", () => {
  const ci = read(".github/workflows/ci.yml");
  const pages = read(".github/workflows/pages.yml");
  assert.match(ci, /pnpm install --frozen-lockfile/);
  assert.match(ci, /pnpm run test:pages/);
  assert.match(pages, /contents: read/);
  assert.match(pages, /pages: write/);
  assert.match(pages, /id-token: write/);
  assert.match(pages, /actions\/configure-pages@v5/);
  assert.match(pages, /actions\/upload-pages-artifact@v4/);
  assert.match(pages, /actions\/deploy-pages@v4/);
  assert.match(pages, /path: dist/);
});

test("public repository and artifact exclusions cover secrets and local outputs", () => {
  const ignore = read(".gitignore");
  const builder = read("scripts/build-pages.mjs");
  const validator = read("scripts/validate-pages-build.mjs");
  for (const entry of ["node_modules/", "artifacts/", "dist/", ".env", "*.backup.json", "*.pem", "*.key"]) {
    assert.ok(ignore.includes(entry), `missing ignore rule ${entry}`);
  }
  assert.match(builder, /rootFiles/);
  assert.match(validator, /forbidden deploy files/);
  assert.match(validator, /github_pat_/);
});
