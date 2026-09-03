import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const errors = [];
const requireFile = (relative) => {
  if (!existsSync(path.join(root, relative))) errors.push(`missing file: ${relative}`);
};

const html = read("index.html");
const manifest = JSON.parse(read("manifest.webmanifest"));
const serviceWorker = read("sw.js");

for (const requiredPattern of [
  /id="app"/,
  /rel="manifest"/,
  /type="module"/,
  /Content-Security-Policy/,
  /非公式/
]) {
  if (!requiredPattern.test(html)) errors.push(`index.html missing ${requiredPattern}`);
}

for (const icon of manifest.icons ?? []) {
  requireFile(icon.src.replace(/^\.\//, ""));
}

for (const match of serviceWorker.matchAll(/"\.\/(.*?)"/g)) {
  const relative = match[1];
  if (relative) requireFile(relative);
}

if (!/event\.request\.mode === "navigate"/.test(serviceWorker)) {
  errors.push("service worker lacks navigation-only HTML fallback");
}
if (!/new URL\(event\.request\.url\)\.origin !== self\.location\.origin/.test(serviceWorker)) {
  errors.push("service worker lacks same-origin guard");
}

function pngDimensions(relative) {
  const buffer = readFileSync(path.join(root, relative));
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const [relative, expected] of [["icon-192.png", 192], ["icon-512.png", 512]]) {
  const dimensions = pngDimensions(relative);
  if (dimensions.width !== expected || dimensions.height !== expected) {
    errors.push(`${relative} must be ${expected}x${expected}`);
  }
}

console.log(JSON.stringify({
  manifest: { name: manifest.name, start_url: manifest.start_url, display: manifest.display },
  serviceWorkerCache: /CACHE_NAME = "([^"]+)"/.exec(serviceWorker)?.[1] ?? null,
  errors
}, null, 2));
if (errors.length) process.exitCode = 1;
