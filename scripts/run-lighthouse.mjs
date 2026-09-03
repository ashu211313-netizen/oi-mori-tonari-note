import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { close, createStaticServer, listen } from "./static-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = path.join(root, "artifacts");
const fallbackChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromePath = process.env.WW_BROWSER_EXECUTABLE
  || (existsSync(fallbackChrome) ? fallbackChrome : undefined);
const requestedPublicUrl = process.env.WW_PUBLIC_URL?.trim();
const publicUrl = requestedPublicUrl ? new URL(requestedPublicUrl) : null;
if (publicUrl && publicUrl.protocol !== "https:") {
  throw new Error("WW_PUBLIC_URL must use HTTPS");
}
const server = publicUrl ? null : createStaticServer(root);
const userDataDir = mkdtempSync(path.join(tmpdir(), "ww-lighthouse-"));
let chrome;
let cleanupError;

try {
  const url = publicUrl?.href ?? await listen(server);
  chrome = await chromeLauncher.launch({
    chromePath,
    userDataDir,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"]
  });
  const result = await lighthouse(url, {
    port: chrome.port,
    logLevel: "error",
    output: "json",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"]
  });
  if (!result) throw new Error("Lighthouse returned no result");
  mkdirSync(artifacts, { recursive: true });
  const reportPrefix = publicUrl ? "lighthouse-live" : "lighthouse";
  writeFileSync(path.join(artifacts, `${reportPrefix}.json`), result.report);
  const scores = Object.fromEntries(
    Object.entries(result.lhr.categories).map(([id, category]) => [id, Math.round((category.score ?? 0) * 100)])
  );
  writeFileSync(path.join(artifacts, `${reportPrefix}-summary.json`), `${JSON.stringify({
    lighthouseVersion: result.lhr.lighthouseVersion,
    userAgent: result.lhr.userAgent,
    target: result.lhr.finalDisplayedUrl,
    scores,
    pwaCategory: "not available in Lighthouse 13; install/offline behavior is covered by static and E2E checks"
  }, null, 2)}\n`);
  console.log(JSON.stringify(scores, null, 2));
} finally {
  await chrome?.kill();
  if (server) await close(server);
  try {
    rmSync(userDataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch (error) {
    // Chrome is already terminated. A transient Windows profile lock does not
    // invalidate the completed audit, but the leftover path remains visible.
    if (error?.code === "EPERM") {
      console.warn(`Lighthouse temporary profile cleanup deferred: ${error.path}`);
    } else {
      cleanupError = error;
    }
  }
}

if (cleanupError) throw cleanupError;

// chrome-launcher can retain a closed child-process handle on Windows. All
// report writes and cleanup attempts are complete at this point, so terminate
// the one-shot audit runner deterministically.
process.exit(0);
