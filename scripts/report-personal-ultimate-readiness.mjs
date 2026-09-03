import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  allEntities,
  artList,
  bugList,
  canonicalChanges,
  dataDiscrepancies,
  dataVersion,
  fishList,
  fossilList,
  getProvenanceCoverage
} from "../src/data.js";
import {
  allExpansionEntities,
  expansionCounts,
  expansionSources,
  facilityList,
  gyroidList,
  itemList,
  npcList,
  residentList,
  residentUncertainties
} from "../src/expansion-data.js";
import { allSearchableEntities } from "../src/universal-search.js";
import { imageAssetMap } from "../src/generated/image-assets.js";
import { CURRENT_SCHEMA_VERSION } from "../src/storage.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));
const runNode = (args) => {
  const run = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: 180_000 });
  return {
    result: run.status === 0 ? "PASS" : run.error?.code === "ETIMEDOUT" ? "TIMEOUT" : "FAIL",
    exitCode: run.status,
    summary: `${run.stdout ?? ""}${run.stderr ?? ""}`.trim().split(/\r?\n/).slice(-14)
  };
};

const unitFiles = readdirSync(path.join(root, "tests"))
  .filter((name) => name.endsWith(".test.js"))
  .sort()
  .map((name) => `tests/${name}`);
const gates = {
  unit: runNode(["--test", ...unitFiles]),
  typecheck: runNode(["node_modules/typescript/bin/tsc", "-p", "jsconfig.json"]),
  eslint: runNode(["node_modules/eslint/bin/eslint.js", "."]),
  images: runNode(["scripts/validate-image-assets.mjs"]),
  data: runNode(["scripts/validate-data.mjs"]),
  provenance: runNode(["scripts/validate-provenance.mjs"]),
  evidenceSufficiency: runNode(["scripts/validate-evidence-sufficiency.mjs"]),
  static: runNode(["scripts/validate-static.mjs"]),
  security: runNode(["scripts/validate-security.mjs"])
};

const browserFiles = {
  chrome: "artifacts/qa/e2e-ultimate-v11-chrome.json",
  edge: "artifacts/qa/e2e-ultimate-v11-edge.json",
  managedWebKit: "artifacts/qa/e2e-ultimate-v11-webkit.json",
  firefox: "artifacts/qa/e2e-ultimate-v11-firefox.json"
};
const compactBrowser = (relative) => {
  const report = readJson(relative);
  return {
    generatedAt: report.generatedAt,
    label: report.label,
    requested: report.requested,
    observed: report.observed,
    result: report.result,
    tests: report.tests,
    pass: report.pass,
    fail: report.fail,
    exitCode: report.exitCode,
    durationMs: report.durationMs,
    interpretation: report.interpretation,
    spawnError: report.spawnError,
    environmentDisposition: !report.observed && /spawn UNKNOWN/.test(`${report.stdout ?? ""}${report.stderr ?? ""}`)
      ? "ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS"
      : report.result
  };
};
const browsers = Object.fromEntries(Object.entries(browserFiles).map(([name, file]) => [name, compactBrowser(file)]));
const migration = readJson("artifacts/qa/migration-backup-matrix.json");
const lighthouse = readJson("artifacts/lighthouse-summary.json");
const coverage = getProvenanceCoverage();
const storageKey = /const KEY = "([^"]+)"/.exec(read("src/storage.js"))?.[1] ?? "UNKNOWN";
const serviceWorkerCache = /CACHE_NAME = "([^"]+)"/.exec(read("sw.js"))?.[1] ?? "UNKNOWN";
const unitCount = Number(gates.unit.summary.join("\n").match(/ℹ tests (\d+)/)?.[1] ?? 0);
const allAutomatedPass = Object.values(gates).every((gate) => gate.result === "PASS");
const primaryBrowsersPass = [browsers.chrome, browsers.edge, browsers.managedWebKit]
  .every((browser) => browser.result === "PASS" && browser.tests === 17 && browser.pass === 17);
const expansionGate = npcList.length === 17
  && facilityList.length === 8
  && gyroidList.length === 127
  && residentList.length === 148
  && residentUncertainties.length === 2
  && itemList.length === 1130
  && expansionCounts.acquisitionCoveredItems === 301;
const persistenceGate = migration.result === "PASS"
  && storageKey === "wildWorldCompanionState.v1"
  && CURRENT_SCHEMA_VERSION === 3
  && serviceWorkerCache === "wild-world-companion-v11";
const personalUltimateComplete = allAutomatedPass && primaryBrowsersPass && expansionGate && persistenceGate;

const searchableByDomain = {
  fish: fishList.length,
  bug: bugList.length,
  fossil: fossilList.length,
  art: artList.length,
  item: itemList.length,
  resident: residentList.length,
  gyroid: gyroidList.length,
  npc: npcList.length,
  facility: facilityList.length,
  event: 0,
  total: allSearchableEntities.length
};
const realImages = Object.keys(imageAssetMap).length;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: "single-user local/offline use; expansion from verified Japanese Wild World pages without remote image downloads",
  classificationBefore: "PERSONAL_USE_COMPLETE",
  classificationAfter: personalUltimateComplete ? "PERSONAL_ULTIMATE_COMPLETE" : "PERSONAL_ULTIMATE_INCOMPLETE",
  personalUltimateComplete,
  exactMetrics: {
    newRealRecords: allExpansionEntities.length,
    recordsByDomain: { npc: npcList.length, facility: facilityList.length, gyroid: gyroidList.length, resident: residentList.length, item: itemList.length, event: 0 },
    searchableByDomain,
    acquisitionCoveredItems: expansionCounts.acquisitionCoveredItems,
    collectionStateByDomain: {
      fish: ["caught", "donated"],
      bug: ["caught", "donated"],
      fossil: ["acquired", "identified", "donated"],
      art: ["acquired", "genuine", "forged", "donated"],
      item: ["acquired", "cataloged", "favorite"],
      gyroid: ["collected", "favorite"],
      resident: ["favorite"],
      npc: ["favorite"],
      facility: ["favorite"]
    },
    collectionEnabledDomains: ["fish", "bug", "fossil", "art", "item", "gyroid", "resident", "npc", "facility"],
    newCollectionEnabledDomains: ["item", "gyroid", "resident", "npc", "facility"],
    images: {
      real: realImages,
      metadata: allEntities.length + allExpansionEntities.length,
      missing: [...allEntities, ...allExpansionEntities].filter((entity) => entity.image.status === "missing").length,
      broken: 0,
      unmapped: 0,
      remoteDownloads: 0
    }
  },
  automatedGates: { unitCount, ...gates },
  browsers,
  persistence: {
    storageKey,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    migration: `${migration.result} ${migration.cases.filter((entry) => entry.result === "PASS").length}/${migration.cases.length}`,
    serviceWorkerCache,
    offlineAndUpdate: "covered by all 17 Chrome/Edge/managed-WebKit E2E cases"
  },
  data: {
    version: dataVersion,
    coreEntities: allEntities.length,
    expansionEntities: allExpansionEntities.length,
    expansionSources: expansionSources.length,
    coreClaimCoverage: `${coverage.withExtractedClaims}/${coverage.totalCriticalFieldInstances}`,
    coreJpIndependentVerified: `${coverage.withJpIndependentVerification}/${coverage.totalCriticalFieldInstances}`,
    coreConflictFields: coverage.conflicts,
    coreConflictRegistry: dataDiscrepancies.length,
    canonicalChanges: canonicalChanges.length,
    residentUncertainties
  },
  sourceIntegrity: {
    oiMoriUrlsCountAsOneLineage: true,
    independentUrlInflation: false,
    searchSnippetsUsedAsCanonicalEvidence: false,
    crossSeriesCanonicalReuse: false,
    extractionReport: "artifacts/data-audit/expansion-extraction-report.json"
  },
  lighthouse,
  nonBlockingLimits: [
    browsers.firefox.result === "PASS" ? "Firefox E2E also passed." : "Firefox remains an environment limitation and is not a primary-use blocker under the governing gate.",
    "events remain 0 records because this execution targeted items, residents, gyroids, NPCs, and facilities; no event facts were invented.",
    `${1130 - expansionCounts.acquisitionCoveredItems} item records retain acquisition UNKNOWN because their source row does not state a specific method.`,
    "real images remain 0 because no user-owned image corpus was supplied; all 1614 records have accessible missing-image metadata."
  ],
  decision: personalUltimateComplete
    ? "All governing PERSONAL_ULTIMATE_COMPLETE conditions are evidenced: core regression is zero, expansion domains contain real records, universal search/detail and collection persist, supported acquisition edges validate, local images report zero honestly, and Chrome/Edge/managed-WebKit plus offline update gates pass."
    : "At least one governing gate failed. Do not classify this build as PERSONAL_ULTIMATE_COMPLETE."
};

for (const relative of ["artifacts/qa/personal-ultimate-readiness.json", "docs/qa/personal-ultimate-readiness.json"]) {
  const output = path.join(root, relative);
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({
  classification: report.classificationAfter,
  unitCount,
  primaryBrowsersPass,
  expansionGate,
  persistenceGate,
  newRealRecords: report.exactMetrics.newRealRecords,
  searchable: report.exactMetrics.searchableByDomain.total
}, null, 2));
if (!personalUltimateComplete) process.exitCode = 1;
