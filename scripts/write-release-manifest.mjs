import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dataVersion } from "../src/data.js";
import { CURRENT_SCHEMA_VERSION } from "../src/storage.js";

const packageRoot = process.env.WW_PACKAGE_ROOT;
if (!packageRoot) throw new Error("WW_PACKAGE_ROOT is required");
const packageZip = process.env.WW_PACKAGE_ZIP;
const releaseClassification = process.env.WW_RELEASE_CLASSIFICATION ?? "PERSONAL_ULTIMATE_COMPLETE";
const serviceWorker = /CACHE_NAME = "([^"]+)"/.exec(readFileSync(path.join(packageRoot, "sw.js"), "utf8"))?.[1] ?? "UNKNOWN";

const sha256 = (absolute) => createHash("sha256").update(readFileSync(absolute)).digest("hex");

if (packageZip) {
  if (!existsSync(packageZip)) throw new Error(`package zip not found: ${packageZip}`);
  const internalManifest = path.join(packageRoot, "MANIFEST.json");
  if (!existsSync(internalManifest)) throw new Error("internal MANIFEST.json not found");
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    releaseClassification,
    zip: {
      fileName: path.basename(packageZip),
      bytes: statSync(packageZip).size,
      sha256: sha256(packageZip)
    },
    internalManifest: {
      fileName: "MANIFEST.json",
      sha256: sha256(internalManifest)
    }
  };
  const output = `${packageZip}.manifest.json`;
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output, ...report }, null, 2));
} else {
  const entries = [];
  for (const entry of readdirSync(packageRoot, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || entry.name === "MANIFEST.json") continue;
    const absolute = path.join(entry.parentPath, entry.name);
    const relative = path.relative(packageRoot, absolute).replaceAll("\\", "/");
    entries.push({ path: relative, bytes: statSync(absolute).size, sha256: sha256(absolute) });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path, "en"));
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    releaseClassification,
    dataVersion,
    serviceWorker,
    localStorageKey: "wildWorldCompanionState.v1",
    storageSchemaVersion: CURRENT_SCHEMA_VERSION,
    fileCountExcludingManifest: entries.length,
    files: entries
  };
  const output = path.join(packageRoot, "MANIFEST.json");
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output, fileCount: entries.length }, null, 2));
}
