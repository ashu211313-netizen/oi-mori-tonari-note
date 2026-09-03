import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { close, createStaticServer, listen } from "../scripts/static-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const basePath = "/oi-mori-tonari-note/";
const chromiumExecutable = process.env.WW_BROWSER_EXECUTABLE
  || [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  ].find((candidate) => existsSync(candidate));
let server;
let origin;
let baseUrl;
let browser;

before(async () => {
  server = createStaticServer(path.join(root, "dist"), { basePath });
  origin = await listen(server);
  baseUrl = new URL(basePath.slice(1), origin).href;
  browser = await chromium.launch({ headless: true, ...(chromiumExecutable ? { executablePath: chromiumExecutable } : {}) });
});

after(async () => {
  await browser?.close();
  if (server) await close(server);
});

async function openApp(t) {
  const context = await browser.newContext({ serviceWorkers: "allow", viewport: { width: 390, height: 844 } });
  t.after(() => context.close());
  const page = await context.newPage();
  const failedResponses = [];
  const errors = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
  return { context, page, failedResponses, errors };
}

test("Pages subpath boots with zero critical asset failures", async (t) => {
  const { page, failedResponses, errors } = await openApp(t);
  assert.equal(await page.getByRole("navigation", { name: "主要メニュー" }).isVisible(), true);
  const result = await page.evaluate(() => ({
    baseURI: document.baseURI,
    manifest: document.querySelector('link[rel="manifest"]')?.href,
    stylesheet: document.querySelector('link[rel="stylesheet"]')?.href,
    module: document.querySelector('script[type="module"]')?.src,
    width: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  assert.match(result.baseURI, /\/oi-mori-tonari-note\/$/);
  assert.match(result.manifest, /\/oi-mori-tonari-note\/manifest\.webmanifest$/);
  assert.match(result.stylesheet, /\/oi-mori-tonari-note\/src\/styles\.css$/);
  assert.match(result.module, /\/oi-mori-tonari-note\/src\/app\.js$/);
  assert.equal(result.width, result.clientWidth);
  assert.deepEqual(failedResponses, []);
  assert.deepEqual(errors, []);
});

test("Pages manifest and icons resolve inside the repository path", async (t) => {
  const { page, failedResponses, errors } = await openApp(t);
  const result = await page.evaluate(async () => {
    const manifestUrl = document.querySelector('link[rel="manifest"]')?.href;
    const response = await fetch(manifestUrl);
    const manifest = await response.json();
    const iconStatuses = await Promise.all(manifest.icons.map(async (icon) => {
      const iconResponse = await fetch(new URL(icon.src, manifestUrl));
      return { url: new URL(icon.src, manifestUrl).href, status: iconResponse.status };
    }));
    return { manifestUrl, status: response.status, manifest, iconStatuses };
  });
  assert.equal(result.status, 200);
  assert.equal(result.manifest.start_url, "./");
  assert.equal(result.manifest.scope, "./");
  assert.equal(result.manifest.display, "standalone");
  assert.ok(result.iconStatuses.every((icon) => icon.status === 200), JSON.stringify(result.iconStatuses));
  assert.ok(result.iconStatuses.every((icon) => icon.url.includes(basePath)), JSON.stringify(result.iconStatuses));
  assert.deepEqual(failedResponses, []);
  assert.deepEqual(errors, []);
});

test("Service Worker scope, cache, offline reload, and saved state survive on Pages subpath", async (t) => {
  const { context, page, failedResponses, errors } = await openApp(t);
  const online = await page.evaluate(async () => {
    localStorage.setItem("wildWorldCompanionState.v1", JSON.stringify({ schemaVersion: 3, favorites: { "fish-shark": true } }));
    const registration = await navigator.serviceWorker.ready;
    return { scope: registration.scope, caches: await window.caches.keys() };
  });
  assert.match(online.scope, /\/oi-mori-tonari-note\/$/);
  assert.ok(online.caches.includes("wild-world-companion-v14"), JSON.stringify(online.caches));
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await page.getByRole("heading", { name: "おい森 となりノート" }).isVisible(), true);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("wildWorldCompanionState.v1")));
  assert.equal(saved.schemaVersion, 3);
  assert.equal(saved.favorites["fish-shark"], true);
  await context.setOffline(false);
  assert.deepEqual(failedResponses, []);
  assert.deepEqual(errors, []);
});

test("Search, collection, and backup UI remain usable from Pages subpath", async (t) => {
  const { page, failedResponses, errors } = await openApp(t);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.getByLabel("すべてのデータを検索").fill("アジアなベッド");
  assert.equal(await page.locator('article[data-id="item-kagu01-001"]').isVisible(), true);
  await page.getByRole("button", { name: "ホーム", exact: true }).click();
  await page.getByRole("button", { name: "コレクション", exact: true }).click();
  assert.equal(await page.getByRole("heading", { name: "集めたものを、ひとつのノートに。" }).isVisible(), true);
  await page.getByRole("button", { name: "ホーム", exact: true }).click();
  await page.getByRole("button", { name: "時計・バックアップ", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: /バックアップを書き出す/ }).isVisible(), true);
  assert.deepEqual(failedResponses, []);
  assert.deepEqual(errors, []);
});

test("Pages mount does not rely on the host root", async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 404);
  const appResponse = await fetch(baseUrl);
  assert.equal(appResponse.status, 200);
});
