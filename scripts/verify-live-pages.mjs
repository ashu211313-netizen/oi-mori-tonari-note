import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices, webkit } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "artifacts", "deployment", "live-pages-verification.json");
const screenshotPath = path.join(root, "artifacts", "deployment", "live-pages-home.png");
const requestedUrl = process.env.WW_PUBLIC_URL;
if (!requestedUrl) throw new Error("WW_PUBLIC_URL is required");
const chromiumExecutable = process.env.WW_BROWSER_EXECUTABLE
  || [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  ].find((candidate) => existsSync(candidate));

const url = new URL(requestedUrl);
if (url.protocol !== "https:") throw new Error("WW_PUBLIC_URL must use HTTPS");
if (!url.pathname.endsWith("/")) url.pathname += "/";
url.hash = "";
url.search = "";

const checks = [];
async function check(id, action) {
  try {
    checks.push({ id, status: "PASS", detail: await action() });
  } catch (error) {
    checks.push({ id, status: "FAIL", detail: String(error?.message ?? error) });
  }
}

let rootResponse;
let html = "";
await check("https-root", async () => {
  rootResponse = await fetch(url, { cache: "no-store", redirect: "follow" });
  if (!rootResponse.ok) throw new Error(`HTTP ${rootResponse.status}`);
  const finalUrl = new URL(rootResponse.url);
  if (finalUrl.protocol !== "https:") throw new Error(`redirected to ${rootResponse.url}`);
  if (!finalUrl.pathname.endsWith(url.pathname)) throw new Error(`unexpected final path ${finalUrl.pathname}`);
  html = await rootResponse.text();
  if (!html.includes("おい森 となりノート")) throw new Error("app title missing from deployed HTML");
  return `${rootResponse.status} ${rootResponse.url}`;
});

await check("github-pages-transport", async () => {
  if (!rootResponse) throw new Error("root response unavailable");
  const hsts = rootResponse.headers.get("strict-transport-security") ?? "";
  if (!/max-age=/i.test(hsts)) throw new Error("HSTS header missing");
  return `HSTS ${hsts}`;
});

await check("document-security-policy", async () => {
  const csp = /Content-Security-Policy" content="([^"]+)"/i.exec(html)?.[1] ?? "";
  for (const directive of ["default-src 'self'", "object-src 'none'", "frame-src 'none'", "script-src 'self'", "connect-src 'self'"]) {
    if (!csp.includes(directive)) throw new Error(`missing meta CSP directive: ${directive}`);
  }
  if (!/<meta name="referrer" content="no-referrer"/i.test(html)) throw new Error("no-referrer meta missing");
  return "self-only executable CSP and no-referrer meta present";
});

let manifest;
await check("manifest-and-icons", async () => {
  const manifestUrl = new URL("./manifest.webmanifest", url);
  const response = await fetch(manifestUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
  manifest = await response.json();
  if (manifest.name !== "おい森 となりノート") throw new Error(`unexpected app name ${manifest.name}`);
  if (manifest.start_url !== "./" || manifest.scope !== "./" || manifest.display !== "standalone") {
    throw new Error("manifest repository-path portability mismatch");
  }
  const iconResults = [];
  for (const icon of manifest.icons ?? []) {
    const iconUrl = new URL(icon.src, manifestUrl);
    const iconResponse = await fetch(iconUrl, { cache: "no-store" });
    iconResults.push(`${icon.src}:${iconResponse.status}`);
    if (!iconResponse.ok || !iconUrl.pathname.startsWith(url.pathname)) throw new Error(iconResults.join(", "));
  }
  return `${response.headers.get("content-type") ?? "unknown type"}; ${iconResults.join(", ")}`;
});

let coreAssetUrls = [];
await check("service-worker-v14", async () => {
  const swUrl = new URL("./sw.js", url);
  const response = await fetch(swUrl, { cache: "no-store" });
  const body = await response.text();
  if (!response.ok) throw new Error(`Service Worker HTTP ${response.status}`);
  if (!body.includes('CACHE_NAME = "wild-world-companion-v14"')) throw new Error("v14 cache marker missing");
  const relativeAssets = [...body.matchAll(/"\.\/(.*?)"/g)].map((match) => match[1]).filter(Boolean);
  coreAssetUrls = relativeAssets.map((relative) => new URL(relative, url));
  if (coreAssetUrls.some((asset) => !asset.pathname.startsWith(url.pathname))) throw new Error("precache asset escaped repository path");
  return `v14; cache-control ${response.headers.get("cache-control") ?? "not supplied"}`;
});

await check("critical-assets-zero-404", async () => {
  const results = await Promise.all(coreAssetUrls.map(async (asset) => {
    const response = await fetch(asset, { cache: "no-store" });
    return { url: asset.href, status: response.status, body: await response.text() };
  }));
  const failed = results.filter((entry) => entry.status !== 200);
  if (failed.length) throw new Error(failed.map((entry) => `${entry.status} ${entry.url}`).join(", "));
  const unsafe = results.filter((entry) => /C:\\Users\\|ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i.test(entry.body));
  if (unsafe.length) throw new Error(`unsafe public content: ${unsafe.map((entry) => entry.url).join(", ")}`);
  return `${results.length} precache assets returned 200 under ${url.pathname}`;
});

for (const relative of [".env", "node_modules/", "artifacts/", "tests/", "scripts/"]) {
  await check(`not-published-${relative.replace(/\W+/g, "-")}`, async () => {
    const response = await fetch(new URL(relative, url), { cache: "no-store", redirect: "manual" });
    if (response.status !== 404) throw new Error(`${relative} returned HTTP ${response.status}`);
    return "HTTP 404";
  });
}

async function browserPass(label, browserType, contextOptions = {}) {
  const browser = await browserType.launch({
    headless: true,
    ...(browserType === chromium && chromiumExecutable ? { executablePath: chromiumExecutable } : {})
  });
  try {
    const context = await browser.newContext({ serviceWorkers: "allow", viewport: { width: 390, height: 844 }, ...contextOptions });
    const page = await context.newPage();
    const browserErrors = [];
    const criticalFailures = [];
    page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("response", (response) => { if (response.status() >= 400) criticalFailures.push(`${response.status()} ${response.url()}`); });
    await page.goto(url.href, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
    const install = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      const manifestUrl = document.querySelector('link[rel="manifest"]')?.href;
      const manifestResponse = await fetch(manifestUrl);
      return {
        secure: window.isSecureContext,
        scope: registration.scope,
        caches: await window.caches.keys(),
        manifestStatus: manifestResponse.status,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      };
    });
    if (!install.secure) throw new Error(`${label}: not a secure context`);
    if (!new URL(install.scope).pathname.endsWith(url.pathname)) throw new Error(`${label}: scope ${install.scope}`);
    if (!install.caches.includes("wild-world-companion-v14")) throw new Error(`${label}: v14 cache missing`);
    if (install.manifestStatus !== 200) throw new Error(`${label}: manifest ${install.manifestStatus}`);
    if (install.clientWidth !== install.scrollWidth) throw new Error(`${label}: horizontal overflow`);

    await page.getByRole("button", { name: "検索", exact: true }).click();
    await page.getByLabel("すべてのデータを検索").fill("アジアなベッド");
    if (!await page.locator('article[data-id="item-kagu01-001"]').isVisible()) throw new Error(`${label}: item search failed`);
    await page.getByRole("button", { name: "ホーム", exact: true }).click();
    await page.getByRole("button", { name: "コレクション", exact: true }).click();
    if (!await page.getByRole("heading", { name: "集めたものを、ひとつのノートに。" }).isVisible()) throw new Error(`${label}: collection failed`);
    await page.getByRole("button", { name: "月", exact: true }).click();
    if (!await page.getByRole("heading", { name: /月のカレンダー/ }).isVisible()) throw new Error(`${label}: calendar failed`);
    await page.getByRole("button", { name: "ホーム", exact: true }).click();
    await page.getByRole("button", { name: "時計・バックアップ", exact: true }).click();
    if (!await page.getByRole("button", { name: /バックアップを書き出す/ }).isVisible()) throw new Error(`${label}: backup UI failed`);

    await page.evaluate(() => localStorage.setItem("wildWorldCompanionState.v1", JSON.stringify({ schemaVersion: 3, favorites: { "fish-shark": true } })));
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("wildWorldCompanionState.v1")));
    if (saved?.schemaVersion !== 3 || !saved?.favorites?.["fish-shark"]) throw new Error(`${label}: saved state lost`);
    await context.setOffline(false);
    if (browserErrors.length) throw new Error(`${label}: ${browserErrors.join("; ")}`);
    if (criticalFailures.length) throw new Error(`${label}: ${criticalFailures.join("; ")}`);
    if (label === "chromium") {
      await page.getByRole("button", { name: "ホーム", exact: true }).click();
      mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: false });
    }
    await context.close();
    return `${label} ${await browser.version()}; HTTPS/SW/offline/search/collection/calendar/backup/storage PASS`;
  } finally {
    await browser.close();
  }
}

await check("browser-chromium", () => browserPass("chromium", chromium));
await check("browser-webkit-iphone-descriptor", () => browserPass("managed WebKit + iPhone descriptor", webkit, devices["iPhone 14"]));

const report = {
  generatedAt: new Date().toISOString(),
  target: url.href,
  result: checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL",
  checks,
  pwa: {
    serviceWorker: "wild-world-companion-v14",
    manifest: manifest?.name ?? null,
    repositoryPath: url.pathname,
    offlineBrowserValidated: checks.find((entry) => entry.id === "browser-chromium")?.status === "PASS"
  },
  limits: [
    "Managed WebKit with an iPhone descriptor is not a physical iPhone/Safari PASS.",
    "GitHub Pages does not provide repository-controlled custom response headers; executable restrictions are enforced by the document CSP meta tag.",
    "PC and iPhone browser-local state are separate; use the existing export/import flow to transfer progress."
  ]
};
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.result !== "PASS") process.exitCode = 1;
