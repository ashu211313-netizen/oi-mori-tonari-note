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

await check("service-worker-v14", async () => {
  const swUrl = new URL("./sw.js", rootResponse?.url ?? url);
  const response = await fetch(swUrl, { cache: "no-store" });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!body.includes('CACHE_NAME = "wild-world-companion-v14"')) throw new Error("v14 cache marker not found");
  const cacheControl = response.headers.get("cache-control") ?? "";
  if (!/(no-cache|no-store|max-age=0)/i.test(cacheControl)) throw new Error(`unsafe sw cache-control: ${cacheControl || "missing"}`);
  return `v14; cache-control ${cacheControl}`;
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
      "Run the Human Verification Kit on the authorized endpoint before changing the release gate."
    ]
  }
};
save(report);
if (report.publicHttps.status !== "PASS_HTTP_CONTRACT") process.exitCode = 1;
