import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";
import { close, createStaticServer, listen } from "./static-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserName = process.env.WW_ISOLATION_BROWSER ?? "webkit";
const variant = process.env.WW_ISOLATION_VARIANT ?? "headless";
const requestedCases = (process.env.WW_ISOLATION_CASES ?? "about_blank,trivial_http,trivial_http_offline_reload,minimal_sw_online,minimal_sw_offline_reload,minimal_sw_offline_goto,app_no_sw,app_with_sw_online,app_with_sw_offline_reload").split(",");
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error(`unsupported browser: ${browserName}`);

const launchOptions = {
  headless: variant !== "headed",
  timeout: 15_000
};
if (variant === "software") {
  launchOptions.env = { ...process.env, MOZ_WEBRENDER: "0", MOZ_ACCELERATED: "0" };
  launchOptions.firefoxUserPrefs = {
    "gfx.webrender.software": true,
    "layers.acceleration.disabled": true,
    "media.hardware-video-decoding.enabled": false
  };
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  browserName,
  variant,
  launchOptions: { headless: launchOptions.headless, softwareRenderingPreferences: variant === "software" },
  executableSource: browserName === "chromium" ? process.env.WW_BROWSER_EXECUTABLE ?? "Playwright managed" : "Playwright managed",
  launchStatus: "NOT_RUN",
  browserVersion: null,
  cases: [],
  classification: "NOT_RUN"
};

let server;
let browser;
try {
  server = createStaticServer(root);
  const baseUrl = await listen(server);
  browser = await browserType.launch({
    ...launchOptions,
    ...(browserName === "chromium" && process.env.WW_BROWSER_EXECUTABLE ? { executablePath: process.env.WW_BROWSER_EXECUTABLE } : {})
  });
  report.launchStatus = "PASS";
  report.browserVersion = await browser.version();

  for (const caseName of requestedCases) {
    const result = { caseName, status: "NOT_RUN", stage: null, error: null };
    const serviceWorkers = caseName === "app_no_sw" ? "block" : "allow";
    const context = await browser.newContext({ serviceWorkers });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    try {
      if (caseName === "about_blank") {
        result.stage = "about:blank";
        await page.goto("about:blank");
        result.status = "PASS";
      } else if (caseName === "trivial_http") {
        result.stage = "plain http";
        await page.goto(`${baseUrl}tests/fixtures/minimal-pwa/plain.html`, { waitUntil: "domcontentloaded" });
        result.status = await page.getByRole("heading", { name: "Plain isolation" }).isVisible() ? "PASS" : "FAIL";
      } else if (caseName === "trivial_http_offline_reload") {
        result.stage = "plain http offline reload without SW/cache fallback";
        await page.goto(`${baseUrl}tests/fixtures/minimal-pwa/plain.html`, { waitUntil: "domcontentloaded" });
        await context.setOffline(true);
        try {
          await page.reload({ waitUntil: "domcontentloaded" });
          result.status = "FAIL";
          result.error = { name: "UnexpectedNavigation", message: "uncached plain page unexpectedly reloaded offline" };
        } catch (error) {
          result.status = /internal error/i.test(error.message) ? "FAIL_INTERNAL_ERROR" : "EXPECTED_NETWORK_FAILURE";
          result.error = { name: error.name, message: error.message, stack: error.stack };
        }
      } else if (caseName.startsWith("minimal_sw")) {
        result.stage = "minimal SW online load";
        await page.goto(`${baseUrl}tests/fixtures/minimal-pwa/index.html`, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
        if (caseName.endsWith("offline_reload")) {
          result.stage = "minimal SW offline reload";
          await context.setOffline(true);
          await page.reload({ waitUntil: "domcontentloaded" });
        } else if (caseName.endsWith("offline_goto")) {
          result.stage = "minimal SW offline new navigation";
          await context.setOffline(true);
          await page.goto(`${baseUrl}tests/fixtures/minimal-pwa/index.html?offline-navigation=1`, { waitUntil: "domcontentloaded" });
        } else if (caseName.endsWith("server_stopped_reload")) {
          result.stage = "minimal SW reload after origin server stopped";
          await close(server);
          server = undefined;
          await page.reload({ waitUntil: "domcontentloaded" });
        }
        result.status = await page.getByRole("heading", { name: "Minimal PWA isolation" }).isVisible() ? "PASS" : "FAIL";
      } else if (caseName === "app_no_sw") {
        result.stage = "app with SW blocked";
        await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
        result.status = await page.getByRole("heading", { name: "おい森 となりノート" }).isVisible() ? "PASS" : "FAIL";
      } else if (caseName.startsWith("app_with_sw")) {
        result.stage = "app SW online load";
        await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
        if (caseName.endsWith("offline_reload")) {
          result.stage = "app SW offline reload";
          await context.setOffline(true);
          await page.reload({ waitUntil: "domcontentloaded" });
        } else if (caseName.endsWith("server_stopped_reload")) {
          result.stage = "app SW reload after origin server stopped";
          await close(server);
          server = undefined;
          await page.reload({ waitUntil: "domcontentloaded" });
        }
        result.status = await page.getByRole("heading", { name: "おい森 となりノート" }).isVisible() ? "PASS" : "FAIL";
      } else {
        throw new Error(`unsupported case: ${caseName}`);
      }
    } catch (error) {
      result.status = "FAIL";
      result.error = { name: error.name, message: error.message, stack: error.stack };
    } finally {
      await context.setOffline(false).catch(() => {});
      await context.close().catch(() => {});
    }
    report.cases.push(result);
  }
  const failures = report.cases.filter((entry) => entry.status !== "PASS");
  report.classification = failures.length === 0 ? "PASS" : "PARTIAL";
} catch (error) {
  report.launchStatus = "FAIL";
  report.launchError = { name: error.name, message: error.message, stack: error.stack };
  report.classification = "BLOCKED_LAUNCH";
} finally {
  await browser?.close().catch(() => {});
  if (server) await close(server).catch(() => {});
}

const outputDirectory = new URL("../artifacts/qa/", import.meta.url);
const safeVariant = variant.replaceAll(/[^a-z0-9_-]/gi, "-");
const outputFile = new URL(`browser-isolation-${browserName}-${safeVariant}.json`, outputDirectory);
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: `artifacts/qa/browser-isolation-${browserName}-${safeVariant}.json`, ...report }, null, 2));
if (report.classification !== "PASS") process.exitCode = 1;
