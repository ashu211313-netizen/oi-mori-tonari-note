import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sources } from "../src/data.js";
import { expansionSources } from "../src/expansion-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const errors = [];
const html = read("index.html");
const app = read("src/app.js");
const storage = read("src/storage.js");
const serviceWorker = read("sw.js");
const csp = /Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1] ?? "";

for (const directive of [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "form-action 'none'",
  "connect-src 'self'",
  "script-src 'self'"
]) {
  if (!csp.includes(directive)) errors.push(`missing CSP directive: ${directive}`);
}

if (/<(?:script|link)[^>]+(?:src|href)="https?:\/\//i.test(html)) {
  errors.push("index.html executes a third-party script or stylesheet");
}
if (/navigator\.(?:geolocation|sendBeacon)|document\.cookie|\bfetch\s*\(/.test(app)) {
  errors.push("app runtime contains an unexpected network, telemetry, location, or cookie API");
}
if (!/const KEY = "wildWorldCompanionState\.v1"/.test(storage)) {
  errors.push("localStorage key changed");
}
if (!/new URL\(event\.request\.url\)\.origin !== self\.location\.origin/.test(serviceWorker)) {
  errors.push("service worker same-origin boundary missing");
}
if (!/<meta name="referrer" content="no-referrer"/.test(html)) {
  errors.push("no-referrer policy missing");
}
if (!/非公式/.test(html)) errors.push("unofficial product status is not disclosed");
if (!/保存データはこの端末のブラウザ内だけに保存され/.test(app)) {
  errors.push("local-only privacy disclosure is missing");
}
if (!/target="_blank" rel="noopener noreferrer"/.test(app)) {
  errors.push("external source links lack opener isolation");
}
const everySource = [...sources, ...expansionSources];
for (const source of everySource) {
  try {
    if (new URL(source.url).protocol !== "https:") errors.push(`source URL is not HTTPS: ${source.id}`);
  } catch {
    errors.push(`source URL is invalid: ${source.id}`);
  }
}

console.log(JSON.stringify({
  csp: csp || null,
  thirdPartyExecutableAssets: 0,
  telemetryOrLocationApis: 0,
  localStorageKey: /const KEY = "([^"]+)"/.exec(storage)?.[1] ?? null,
  externalSourceLinks: everySource.length,
  errors
}, null, 2));
if (errors.length) process.exitCode = 1;
