import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "artifacts", "qa", "public-https-pwa-report.json");
const requestedUrl = process.env.WW_PUBLIC_URL;

function save(report) {
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

if (!requestedUrl) {
  save({
    generatedAt: new Date().toISOString(),
    publicHttps: {
      status: "NOT_RUN",
      reason: "WW_PUBLIC_URL was not supplied; localhost and unapproved tunnels are not public HTTPS evidence."
    }
  });
  process.exit(2);
}

const url = new URL(requestedUrl);
if (url.protocol !== "https:") throw new Error("WW_PUBLIC_URL must use https:");
url.hash = "";
const isGitHubPages = url.hostname.endsWith(".github.io");

const checks = [];
async function check(id, action) {
  try {
    checks.push({ id, status: "PASS", detail: await action() });
  } catch (error) {
    checks.push({ id, status: "FAIL", detail: String(error?.message ?? error) });
  }
}

let rootResponse;
await check("root-https-200", async () => {
  rootResponse = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!rootResponse.ok) throw new Error(`HTTP ${rootResponse.status}`);
  if (new URL(rootResponse.url).protocol !== "https:") throw new Error(`redirected to ${rootResponse.url}`);
  return `${rootResponse.status} ${rootResponse.url}`;
});

await check("production-security-headers", async () => {
  if (!rootResponse) throw new Error("root request did not complete");
  if (isGitHubPages) {
    const hsts = rootResponse.headers.get("strict-transport-security") ?? "";
    if (!/max-age=/i.test(hsts)) throw new Error(`strict-transport-security: ${hsts || "missing"}`);
    const html = await rootResponse.clone().text();
    const cspTag = /<meta\b[^>]*\bhttp-equiv=["']Content-Security-Policy["'][^>]*>/i.exec(html)?.[0] ?? "";
    const referrerTag = /<meta\b[^>]*\bname=["']referrer["'][^>]*>/i.exec(html)?.[0] ?? "";
    const csp = /\bcontent="([^"]+)"/i.exec(cspTag)?.[1] ?? "";
    const referrer = /\bcontent="([^"]+)"/i.exec(referrerTag)?.[1] ?? "";
    for (const fragment of ["default-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
      if (!csp.toLowerCase().includes(fragment.toLowerCase())) throw new Error(`document CSP missing ${fragment}`);
    }
    if (referrer.toLowerCase() !== "no-referrer") throw new Error(`document referrer policy: ${referrer || "missing"}`);
    return "GitHub Pages HSTS plus repository-controlled self-only document CSP/no-referrer policy present";
  }
  const required = {
    "content-security-policy": ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'"],
    "strict-transport-security": ["max-age="],
    "x-content-type-options": ["nosniff"],
    "referrer-policy": ["no-referrer"],
    "permissions-policy": ["geolocation=()"]
  };
  const missing = [];
  for (const [name, fragments] of Object.entries(required)) {
    const value = rootResponse.headers.get(name) ?? "";
    if (!fragments.every((fragment) => value.toLowerCase().includes(fragment.toLowerCase()))) {
      missing.push(`${name}: ${value || "missing"}`);
    }
  }
  if (missing.length) throw new Error(missing.join("; "));
  return "CSP/HSTS/nosniff/referrer/permissions present";
});

await check("manifest", async () => {
  const manifestUrl = new URL("./manifest.webmanifest", rootResponse?.url ?? url);
  const response = await fetch(manifestUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const manifest = await response.json();
  if (manifest.display !== "standalone" || manifest.start_url !== "./") throw new Error("installable identity mismatch");
  return `${manifest.name}; ${response.headers.get("content-type") ?? "no content-type"}`;
});

await check("service-worker-v15", async () => {
  const swUrl = new URL("./sw.js", rootResponse?.url ?? url);
  const response = await fetch(swUrl, { cache: "no-store" });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!body.includes('CACHE_NAME = "wild-world-companion-v15"')) throw new Error("v15 cache marker not found");
  if (!/const NAVIGATION_SHELL\s*=\s*new URL\("\.\/index\.html",\s*self\.location\.href\)\.href/.test(body)) {
    throw new Error("scope-relative canonical navigation shell not found");
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
  const cacheControl = response.headers.get("cache-control") ?? "";
  let cacheDetail = cacheControl;
  if (!/(no-cache|no-store|max-age=0)/i.test(cacheControl)) {
    const maxAge = Number(/max-age=(\d+)/i.exec(cacheControl)?.[1] ?? Number.NaN);
    const appResponse = await fetch(new URL("./src/app.js", rootResponse?.url ?? url), { cache: "no-store" });
    const appBody = await appResponse.text();
    const bypassesWorkerScriptCache = appResponse.ok
      && /register\("\.\/sw\.js",\s*\{\s*updateViaCache:\s*"none"\s*\}\)/.test(appBody)
      && /registration\.update\(\)/.test(appBody);
    if (!isGitHubPages || !Number.isFinite(maxAge) || maxAge > 600 || !bypassesWorkerScriptCache) {
      throw new Error(`unsafe sw cache-control: ${cacheControl || "missing"}`);
    }
    cacheDetail = `${cacheControl}; updateViaCache=none and explicit update() bypass the managed 600s cache`;
  }
  return `v15 canonical navigation shell; cache-control ${cacheDetail}`;
});

await check("icons", async () => {
  const statuses = [];
  for (const relative of ["./icon-192.png", "./icon-512.png"]) {
    const response = await fetch(new URL(relative, rootResponse?.url ?? url), { cache: "no-store" });
    statuses.push(`${relative}:${response.status}`);
    if (!response.ok) throw new Error(statuses.join(", "));
  }
  return statuses.join(", ");
});

const report = {
  generatedAt: new Date().toISOString(),
  target: requestedUrl,
  publicHttps: {
    status: checks.every((entry) => entry.status === "PASS") ? "PASS_HTTP_CONTRACT" : "FAIL",
    checks,
    limits: [
      "HTTP contract PASS does not prove install, offline, update, or physical-device behavior.",
      "On GitHub Pages, response headers are host-managed; the repository-controlled CSP and referrer policy are document meta policies and cannot provide frame-ancestors, X-Content-Type-Options, or Permissions-Policy response headers.",
      "Run the Human Verification Kit on the authorized endpoint before changing the release gate."
    ]
  }
};
save(report);
if (report.publicHttps.status !== "PASS_HTTP_CONTRACT") process.exitCode = 1;
