import {
  copyFileSync,
  cpSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const rootFiles = [
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "sw.js"
];

if (path.dirname(output) !== root || path.basename(output) !== "dist") {
  throw new Error(`refusing to replace unexpected Pages output: ${output}`);
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const relative of rootFiles) {
  copyFileSync(path.join(root, relative), path.join(output, relative));
}
cpSync(path.join(root, "src"), path.join(output, "src"), { recursive: true });

const sourceAssets = path.join(root, "assets");
const outputAssets = path.join(output, "assets");
for (const entry of readdirSync(sourceAssets, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || [".gitkeep", "README.md", "image-manifest.json"].includes(entry.name)) continue;
  const source = path.join(entry.parentPath, entry.name);
  const relative = path.relative(sourceAssets, source);
  const destination = path.join(outputAssets, relative);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

writeFileSync(path.join(output, ".nojekyll"), "");

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const files = walk(output);
console.log(JSON.stringify({
  output,
  files: files.length,
  bytes: files.reduce((total, file) => total + statSync(file).size, 0),
  serviceWorker: "wild-world-companion-v14"
}, null, 2));
