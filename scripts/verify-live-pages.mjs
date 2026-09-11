import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices, webkit } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "artifacts", "deployment", "live-pages-verification.json");
const screenshotPath = path.join(root, "artifacts", "deployment", "live-pages-home.png");
const STORAGE_KEY = "wildWorldCompanionState.v1";
const PRIMARY_ITEM_ID = "item-kagu01-001";
const PRIMARY_ITEM_NAME = "アジアなベッド";
const PHONE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 430, height: 932 }
];
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
  for (const requiredSize of ["180x180", "192x192", "512x512"]) {
    if (!(manifest.icons ?? []).some((icon) => icon.sizes === requiredSize && icon.type === "image/png")) {
      throw new Error(`required PNG icon ${requiredSize} missing`);
    }
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
await check("service-worker-v15", async () => {
  const swUrl = new URL("./sw.js", url);
  const response = await fetch(swUrl, { cache: "no-store" });
  const body = await response.text();
  if (!response.ok) throw new Error(`Service Worker HTTP ${response.status}`);
  if (!body.includes('CACHE_NAME = "wild-world-companion-v15"')) throw new Error("v15 cache marker missing");
  if (!/const NAVIGATION_SHELL\s*=\s*new URL\("\.\/index\.html",\s*self\.location\.href\)\.href/.test(body)) {
    throw new Error("scope-relative canonical navigation shell missing");
  }
  if (!/const CORE_ASSETS\s*=\s*\[[\s\S]*?\bNAVIGATION_SHELL\b/.test(body)) {
    throw new Error("canonical navigation shell is not precached");
  }
  if (!/event\.request\.mode === "navigate"[\s\S]*?caches\.open\(CACHE_NAME\)[\s\S]*?cache\.match\(NAVIGATION_SHELL\)/.test(body)) {
    throw new Error("navigation does not read the canonical shell from the current app cache");
  }
  if (/caches\.match\(\s*["']\.\/index\.html["']\s*\)/.test(body)) {
    throw new Error("legacy relative global-cache navigation lookup is still present");
  }
  const relativeAssets = [...body.matchAll(/"\.\/(.*?)"/g)].map((match) => match[1]).filter(Boolean);
  const requiredAssets = ["index.html", "manifest.webmanifest", "icon-180.png", "src/styles.css", "src/app.js", "src/lifecycle.js"];
  coreAssetUrls = [...new Set([...relativeAssets, ...requiredAssets])].map((relative) => new URL(relative, url));
  if (coreAssetUrls.some((asset) => !asset.pathname.startsWith(url.pathname))) throw new Error("precache asset escaped repository path");
  return `v15 canonical navigation shell; cache-control ${response.headers.get("cache-control") ?? "not supplied"}`;
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

function monitorPage(page) {
  const consoleErrors = [];
  const httpFailures = [];
  const requestFailures = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) httpFailures.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    requestFailures.push({
      errorText: request.failure()?.errorText ?? "request failed",
      url: request.url()
    });
  });
  return { consoleErrors, httpFailures, requestFailures };
}

async function settleLayout(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function inspectPhoneLayout(page, label) {
  await settleLayout(page);
  const originalScrollY = await page.evaluate(() => scrollY);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => {
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    return Math.abs(scrollY - maximum) <= 2;
  });
  await settleLayout(page);
  const result = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const describe = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        element: element.tagName.toLowerCase(),
        label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 80) || element.getAttribute("placeholder") || "",
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2))
      };
    };
    const controls = [...document.querySelectorAll('button, summary, .file-button, input:not([type="file"]), select, textarea')]
      .filter(visible);
    const undersizedControls = controls
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      })
      .map(describe);
    const undersizedInputFonts = [...document.querySelectorAll('input:not([type="file"]), select, textarea')]
      .filter(visible)
      .map((element) => ({ ...describe(element), fontSize: Number.parseFloat(getComputedStyle(element).fontSize) }))
      .filter((entry) => entry.fontSize < 16);
    const nav = document.querySelector(".bottom-nav");
    const navRect = nav?.getBoundingClientRect();
    const main = document.querySelector("main");
    const lastMainChild = main ? [...main.children].filter(visible).at(-1) : null;
    const lastRect = lastMainChild?.getBoundingClientRect();
    return {
      route: document.querySelector("#app")?.getAttribute("data-route") ?? null,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      inputFontMinimum: Math.min(...[...document.querySelectorAll('input:not([type="file"]), select, textarea')]
        .filter(visible)
        .map((element) => Number.parseFloat(getComputedStyle(element).fontSize)), 16),
      controlCount: controls.length,
      undersizedControls,
      undersizedInputFonts,
      nav: navRect ? {
        top: Number(navRect.top.toFixed(2)),
        right: Number(navRect.right.toFixed(2)),
        bottom: Number(navRect.bottom.toFixed(2)),
        left: Number(navRect.left.toFixed(2)),
        width: Number(navRect.width.toFixed(2)),
        height: Number(navRect.height.toFixed(2)),
        display: getComputedStyle(nav).display,
        visibility: getComputedStyle(nav).visibility
      } : null,
      lastMainChildBottom: lastRect ? Number(lastRect.bottom.toFixed(2)) : null,
      innerHeight,
      innerWidth
    };
  });
  await page.evaluate((top) => scrollTo(0, top), originalScrollY);
  await settleLayout(page);
  if (result.scrollWidth - result.clientWidth > 1) throw new Error(`${label}: horizontal overflow ${JSON.stringify(result)}`);
  if (result.undersizedInputFonts.length) throw new Error(`${label}: input zoom risk ${JSON.stringify(result.undersizedInputFonts)}`);
  if (result.undersizedControls.length) throw new Error(`${label}: touch targets below 44 CSS px ${JSON.stringify(result.undersizedControls)}`);
  if (!result.nav) throw new Error(`${label}: bottom navigation missing`);
  if (result.nav.display === "none" || result.nav.visibility === "hidden") throw new Error(`${label}: bottom navigation unexpectedly hidden`);
  if (result.nav.left < -1 || result.nav.right > result.innerWidth + 1) throw new Error(`${label}: bottom navigation escapes viewport ${JSON.stringify(result.nav)}`);
  if (result.nav.bottom > result.innerHeight + 1) throw new Error(`${label}: bottom navigation extends below viewport ${JSON.stringify(result.nav)}`);
  if (result.lastMainChildBottom !== null && result.lastMainChildBottom > result.nav.top + 1) {
    throw new Error(`${label}: final content is covered by bottom navigation ${JSON.stringify(result)}`);
  }
  return result;
}

async function openLiveApp(page, label) {
  page.setDefaultTimeout(20_000);
  try {
    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 30_000 });
  } catch (error) {
    if (!/WebKit encountered an internal error/.test(String(error))) throw error;
    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 30_000 });
  }
  await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
  await page.locator('#app[data-expansion-ready="true"]').waitFor();
  const install = await page.evaluate(async () => {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Service Worker readiness timeout")), 20_000))
    ]);
    const manifestUrl = document.querySelector('link[rel="manifest"]')?.href;
    if (!manifestUrl) throw new Error("manifest link missing");
    const manifestResponse = await fetch(manifestUrl, { cache: "no-store" });
    return {
      secure: window.isSecureContext,
      scope: registration.scope,
      caches: await window.caches.keys(),
      manifestStatus: manifestResponse.status,
      manifestPath: new URL(manifestUrl).pathname
    };
  });
  if (!install.secure) throw new Error(`${label}: not a secure context`);
  if (!new URL(install.scope).pathname.endsWith(url.pathname)) throw new Error(`${label}: scope ${install.scope}`);
  if (!install.caches.includes("wild-world-companion-v15")) throw new Error(`${label}: v15 cache missing`);
  if (install.manifestStatus !== 200 || !install.manifestPath.startsWith(url.pathname)) {
    throw new Error(`${label}: manifest escaped repository path or returned ${install.manifestStatus}`);
  }
  return install;
}

async function runPrimaryFlow(page, label) {
  const layouts = [];
  layouts.push(await inspectPhoneLayout(page, `${label} home`));
  await page.locator('.bottom-nav button[data-route="search"]').click();
  await page.locator('#app[data-route="search"]').waitFor();
  const search = page.getByLabel("すべてのデータを検索");
  await search.fill(PRIMARY_ITEM_NAME);
  const card = page.locator(`article[data-id="${PRIMARY_ITEM_ID}"]`);
  await card.waitFor();
  layouts.push(await inspectPhoneLayout(page, `${label} search`));
  await card.getByRole("button", { name: "詳細" }).click();
  await page.locator(`#app[data-route="detail"] article[data-id="${PRIMARY_ITEM_ID}"]`).waitFor();
  await page.getByRole("heading", { name: PRIMARY_ITEM_NAME }).waitFor();
  layouts.push(await inspectPhoneLayout(page, `${label} detail`));
  await page.getByRole("button", { name: /検索結果.*戻る/ }).click();
  await page.locator('#app[data-route="search"]').waitFor();
  if (await search.inputValue() !== PRIMARY_ITEM_NAME) throw new Error(`${label}: search query was not restored after detail`);
  await card.waitFor();
  if (await page.locator('.bottom-nav button[data-route="search"]').getAttribute("aria-current") !== "page") {
    throw new Error(`${label}: search navigation state was not restored after detail`);
  }
  layouts.push(await inspectPhoneLayout(page, `${label} search restored`));
  await page.locator('.bottom-nav button[data-route="home"]').click();
  await page.locator('#app[data-route="home"]').waitFor();
  return layouts;
}

async function runExistingFeatureFlow(page, label) {
  await page.locator('.quick-grid button[data-route="collection"]').click();
  await page.getByRole("heading", { name: "集めたものを、ひとつのノートに。" }).waitFor();
  await page.locator('.bottom-nav button[data-route="calendar"]').click();
  await page.getByRole("heading", { name: "村のこよみ" }).waitFor();
  await page.locator('.bottom-nav button[data-route="home"]').click();
  await page.locator('.quick-grid button[data-route="more"]').click();
  await page.getByRole("button", { name: /バックアップを書き出す/ }).waitFor();
  await page.evaluate((storageKey) => {
    localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: 3, favorites: { "fish-shark": true } }));
  }, STORAGE_KEY);
  return `${label}: collection/calendar/backup UI and storage seed PASS`;
}

function formatRequestFailure(entry) {
  return `${entry.errorText} ${entry.url}`;
}

function isExpectedOfflineConsoleError(entry) {
  if (entry.startsWith("pageerror:")) return false;
  return /Failed to load resource|net::ERR_|NS_ERROR_|NSURLError|Internet connection|NetworkError|Load failed|offline/i.test(entry);
}

function isExpectedOfflineRequestFailure(entry) {
  try {
    if (new URL(entry.url).origin !== url.origin) return false;
  } catch {
    return false;
  }
  return /net::ERR_|NS_ERROR_|NSURLError|Internet connection|NetworkError|Load failed|cancelled|canceled|offline/i.test(entry.errorText);
}

async function browserPass(label, browserType, { contextOptions = {}, verifyOffline = false, fullExistingFlow = false } = {}) {
  const browser = await browserType.launch({
    headless: true,
    ...(browserType === chromium && chromiumExecutable ? { executablePath: chromiumExecutable } : {})
  });
  try {
    const viewportEvidence = [];
    for (const viewport of PHONE_VIEWPORTS) {
      const context = await browser.newContext({
        serviceWorkers: "allow",
        locale: "ja-JP",
        timezoneId: "Asia/Tokyo",
        colorScheme: "light",
        reducedMotion: "reduce",
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 3,
        ...contextOptions,
        viewport,
        screen: viewport
      });
      try {
        const page = await context.newPage();
        const runtime = monitorPage(page);
        const viewportLabel = `${label} ${viewport.width}x${viewport.height}`;
        const install = await openLiveApp(page, viewportLabel);
        const layouts = await runPrimaryFlow(page, viewportLabel);
        if (fullExistingFlow && viewport.width === 390) await runExistingFeatureFlow(page, viewportLabel);
        if (runtime.consoleErrors.length) throw new Error(`${viewportLabel}: console errors: ${runtime.consoleErrors.join("; ")}`);
        if (runtime.httpFailures.length) throw new Error(`${viewportLabel}: HTTP failures: ${runtime.httpFailures.join("; ")}`);
        if (runtime.requestFailures.length) throw new Error(`${viewportLabel}: request failures: ${runtime.requestFailures.map(formatRequestFailure).join("; ")}`);
        let expectedOfflineFailures = null;
        let offlineEvidence = null;
        if (verifyOffline && viewport.width === 390) {
          const offlineStart = {
            console: runtime.consoleErrors.length,
            http: runtime.httpFailures.length,
            request: runtime.requestFailures.length
          };
          await context.setOffline(true);
          // Playwright's installed-Chrome transport reports navigator.onLine=false
          // to the current document, but a Service-Worker-served reload can start
          // the replacement document with navigator.onLine=true even while all
          // network access is still blocked. Assert the live offline event/UI before
          // reload, and prove the transport boundary with an uncached non-static URL.
          await page.locator('#app[data-online="false"]').waitFor();
          const networkProbe = await page.evaluate(async (probeUrl) => {
            try {
              const response = await fetch(probeUrl, { cache: "no-store" });
              return { blocked: false, status: response.status, error: null };
            } catch (error) {
              return { blocked: true, status: null, error: String(error?.message ?? error) };
            }
          }, new URL(`__offline-network-probe-${Date.now()}`, url).href);
          if (!networkProbe.blocked) throw new Error(`${viewportLabel}: offline network probe returned HTTP ${networkProbe.status}`);
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
          const saved = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)), STORAGE_KEY);
          if (saved?.schemaVersion !== 3 || !saved?.favorites?.["fish-shark"]) throw new Error(`${viewportLabel}: saved state lost`);
          const reloadConnectivity = await page.evaluate(() => ({
            navigatorOnline: navigator.onLine,
            appOnline: document.querySelector("#app")?.getAttribute("data-online") ?? null,
            controlled: Boolean(navigator.serviceWorker.controller)
          }));
          if (!reloadConnectivity.controlled) throw new Error(`${viewportLabel}: offline reload lost Service Worker control`);
          const offlineEnd = {
            console: runtime.consoleErrors.length,
            http: runtime.httpFailures.length,
            request: runtime.requestFailures.length
          };
          const offlineConsoleErrors = runtime.consoleErrors.slice(offlineStart.console, offlineEnd.console);
          const offlineHttpFailures = runtime.httpFailures.slice(offlineStart.http, offlineEnd.http);
          const offlineRequestFailures = runtime.requestFailures.slice(offlineStart.request, offlineEnd.request);
          const unexpectedOfflineConsoleErrors = offlineConsoleErrors.filter((entry) => !isExpectedOfflineConsoleError(entry));
          const unexpectedOfflineRequestFailures = offlineRequestFailures.filter((entry) => !isExpectedOfflineRequestFailure(entry));
          if (offlineHttpFailures.length || unexpectedOfflineConsoleErrors.length || unexpectedOfflineRequestFailures.length) {
            throw new Error(`${viewportLabel}: unexpected offline failures ${JSON.stringify({
              http: offlineHttpFailures,
              console: unexpectedOfflineConsoleErrors,
              requests: unexpectedOfflineRequestFailures.map(formatRequestFailure)
            })}`);
          }
          expectedOfflineFailures = {
            consoleErrors: offlineConsoleErrors,
            requestFailures: offlineRequestFailures.map(formatRequestFailure)
          };
          offlineEvidence = {
            currentDocumentOfflineUi: true,
            uncachedNetworkProbeBlocked: networkProbe.blocked,
            networkProbeError: networkProbe.error,
            serviceWorkerReloadRendered: true,
            savedStatePreserved: true,
            reloadConnectivity
          };
          await context.setOffline(false);
          await page.locator('#app[data-online="true"]').waitFor();
          await settleLayout(page);
          const recoveryFailures = {
            console: runtime.consoleErrors.slice(offlineEnd.console),
            http: runtime.httpFailures.slice(offlineEnd.http),
            requests: runtime.requestFailures.slice(offlineEnd.request)
          };
          if (recoveryFailures.console.length || recoveryFailures.http.length || recoveryFailures.requests.length) {
            throw new Error(`${viewportLabel}: online recovery failures ${JSON.stringify({
              console: recoveryFailures.console,
              http: recoveryFailures.http,
              requests: recoveryFailures.requests.map(formatRequestFailure)
            })}`);
          }
        } else if (fullExistingFlow && viewport.width === 390) {
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.getByRole("heading", { name: "おい森 となりノート" }).waitFor();
        }
        if (!(verifyOffline && viewport.width === 390) && runtime.consoleErrors.length) {
          throw new Error(`${viewportLabel}: console errors: ${runtime.consoleErrors.join("; ")}`);
        }
        if (runtime.httpFailures.length) throw new Error(`${viewportLabel}: HTTP failures: ${runtime.httpFailures.join("; ")}`);
        if (!(verifyOffline && viewport.width === 390) && runtime.requestFailures.length) {
          throw new Error(`${viewportLabel}: request failures: ${runtime.requestFailures.map(formatRequestFailure).join("; ")}`);
        }
        if (label === "chromium" && viewport.width === 390) {
          await page.locator('.bottom-nav button[data-route="home"]').click();
          mkdirSync(path.dirname(screenshotPath), { recursive: true });
          await page.screenshot({ path: screenshotPath, fullPage: false });
        }
        viewportEvidence.push({
          viewport,
          install,
          layouts,
          offlineReload: verifyOffline && viewport.width === 390,
          expectedOfflineFailures,
          offlineEvidence
        });
      } finally {
        await context.close();
      }
    }
    return {
      browser: label,
      version: await browser.version(),
      classification: "AUTOMATED_MOBILE_BROWSER_EMULATION",
      viewports: viewportEvidence,
      primaryFlow: "Home -> Search -> item detail -> back with restored query/navigation",
      existingFeatures: fullExistingFlow ? "collection/calendar/backup/storage PASS" : "not repeated in this browser",
      offlineReload: verifyOffline ? "390px PASS" : "NOT_RUN in this browser"
    };
  } finally {
    await browser.close();
  }
}

await check("browser-chromium", () => browserPass("chromium", chromium, { verifyOffline: true, fullExistingFlow: true }));
await check("browser-webkit-iphone-descriptor", () => browserPass(
  "managed WebKit + iPhone descriptor",
  webkit,
  { contextOptions: { ...devices["iPhone 14"], ignoreHTTPSErrors: true } }
));

const report = {
  generatedAt: new Date().toISOString(),
  target: url.href,
  result: checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL",
  checks,
  pwa: {
    serviceWorker: "wild-world-companion-v15",
    manifest: manifest?.name ?? null,
    repositoryPath: url.pathname,
    offlineBrowserValidated: checks.find((entry) => entry.id === "browser-chromium")?.status === "PASS",
    automatedPhoneViewports: PHONE_VIEWPORTS.map(({ width, height }) => `${width}x${height}`),
    automatedPrimaryFlow: "Home -> Search -> item detail -> back"
  },
  limits: [
    "390px/430px runs are automated CSS-viewport and touch emulation; they are not physical iPhone, iOS Safari, or Home Screen PWA PASS.",
    "Managed WebKit with an iPhone descriptor is browser-engine evidence only and is not a physical iPhone/Safari PASS.",
    "Managed WebKit used its toolchain TLS-trust bypass because this Windows WebKit bundle cannot read the host trust store; Node and installed Chrome validated the real HTTPS certificate without bypass.",
    "Live offline reload was validated in installed Chrome with an uncached network-failure probe, Service Worker shell rendering, and schema-3 state retention. Playwright may initialize navigator.onLine=true in the replacement Service-Worker-served document, so the offline UI indicator is asserted before reload instead of misreporting that harness value as physical-device evidence.",
    "Managed WebKit validated the live online reload and its separate local repository-path suite validated offline behavior; live WebKit offline reload hit a tool-internal error and is not claimed as a live WebKit offline PASS.",
    "GitHub Pages does not provide repository-controlled custom response headers; executable restrictions are enforced by the document CSP meta tag.",
    "PC and iPhone browser-local state are separate; use the existing export/import flow to transfer progress."
  ]
};
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.result !== "PASS") process.exitCode = 1;
