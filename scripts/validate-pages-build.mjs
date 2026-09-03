import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deployRoot = path.resolve(process.env.WW_PAGES_DIR ?? path.join(root, "dist"));
const output = path.join(root, "artifacts", "deployment", "pages-build-validation.json");
const errors = [];

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const files = walk(deployRoot);
const relativeFiles = files.map((file) => path.relative(deployRoot, file).replaceAll("\\", "/"));
const required = [
  ".nojekyll",
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "sw.js",
  "src/app.js",
  "src/styles.css",
  "src/data.js",
  "src/storage.js",
  "src/generated/expansion-records.js",
  "src/generated/image-assets.js"
];
for (const relative of required) {
  if (!relativeFiles.includes(relative)) errors.push(`missing required deploy file: ${relative}`);
}

const forbidden = relativeFiles.filter((relative) => (
  relative.startsWith("node_modules/")
  || relative.startsWith("artifacts/")
  || relative.startsWith("tests/")
  || relative.startsWith("scripts/")
  || /(^|\/)\.env(?:\.|$)/.test(relative)
  || /(^|\/)(?:.*backup.*|.*credential.*|.*secret.*|.*private.*key.*)$/i.test(relative)
));
if (forbidden.length) errors.push(`forbidden deploy files: ${forbidden.join(", ")}`);

const textFiles = files.filter((file) => /\.(?:css|html|js|json|svg|webmanifest)$/i.test(file));
const secretPatterns = [
  /ghp_[A-Za-z0-9_]+/,
  /github_pat_[A-Za-z0-9_]+/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
  /C:\\Users\\/i,
  /127\.0\.0\.1|localhost/i
];
for (const file of textFiles) {
  const body = readFileSync(file, "utf8");
  for (const pattern of secretPatterns) {
    if (pattern.test(body)) errors.push(`${path.relative(deployRoot, file)} matched ${pattern}`);
  }
}

if (existsSync(path.join(deployRoot, "index.html"))) {
  const html = readFileSync(path.join(deployRoot, "index.html"), "utf8");
  if (/(?:href|src)="\/(?!\/)/.test(html)) errors.push("index.html contains a root-absolute asset URL");
  for (const requiredMeta of [
    'name="apple-mobile-web-app-capable" content="yes"',
    'name="apple-mobile-web-app-title" content="となりノート"'
  ]) {
    if (!html.includes(requiredMeta)) errors.push(`missing iOS metadata: ${requiredMeta}`);
  }
}

if (existsSync(path.join(deployRoot, "manifest.webmanifest"))) {
  const manifest = JSON.parse(readFileSync(path.join(deployRoot, "manifest.webmanifest"), "utf8"));
  if (manifest.start_url !== "./") errors.push(`manifest start_url is ${manifest.start_url}`);
  if (manifest.scope !== "./") errors.push(`manifest scope is ${manifest.scope}`);
  if (manifest.display !== "standalone") errors.push(`manifest display is ${manifest.display}`);
  for (const icon of manifest.icons ?? []) {
    const iconPath = path.join(deployRoot, String(icon.src).replace(/^\.\//, ""));
    if (!existsSync(iconPath)) errors.push(`missing manifest icon: ${icon.src}`);
  }
}

if (existsSync(path.join(deployRoot, "sw.js"))) {
  const sw = readFileSync(path.join(deployRoot, "sw.js"), "utf8");
  if (!sw.includes('CACHE_NAME = "wild-world-companion-v14"')) errors.push("Service Worker is not v14");
  if (!sw.includes('caches.match("./index.html")')) errors.push("Service Worker has no relative navigation fallback");
  for (const [, relative] of sw.matchAll(/"\.\/(.*?)"/g)) {
    if (relative && !existsSync(path.join(deployRoot, relative))) errors.push(`missing precache asset: ${relative}`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  deployRoot,
  result: errors.length ? "FAIL" : "PASS",
  files: relativeFiles.length,
  bytes: files.reduce((total, file) => total + statSync(file).size, 0),
  forbiddenFiles: forbidden,
  errors
};
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
