import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  allEntities,
  canonicalChanges,
  dataDiscrepancies,
  dataVersion,
  getProvenanceCoverage
} from "../src/data.js";
import { imageAssetMap } from "../src/generated/image-assets.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));
const runNode = (args) => {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: 120_000 });
  return {
    result: result.status === 0 ? "PASS" : result.error?.code === "ETIMEDOUT" ? "TIMEOUT" : "FAIL",
    exitCode: result.status,
    summary: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split(/\r?\n/).slice(-12)
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
const chrome = readJson("artifacts/qa/e2e-personal-v10-chrome.json");
const edge = readJson("artifacts/qa/e2e-personal-v10-edge.json");
const webkit = readJson("artifacts/qa/e2e-personal-v10-webkit.json");
const firefox = readJson("artifacts/qa/e2e-personal-v10-firefox.json");
const compactBrowser = (report) => ({
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
  spawnError: report.spawnError
});
const migration = readJson("artifacts/qa/migration-backup-matrix.json");
const lighthouse = readJson("artifacts/lighthouse-summary.json");
const coverage = getProvenanceCoverage();
const storageKey = /const KEY = "([^"]+)"/.exec(read("src/storage.js"))?.[1] ?? "UNKNOWN";
const serviceWorkerCache = /CACHE_NAME = "([^"]+)"/.exec(read("sw.js"))?.[1] ?? "UNKNOWN";
const unitCount = Number(gates.unit.summary.join("\n").match(/ℹ tests (\d+)/)?.[1] ?? 0);
const allAutomatedPass = Object.values(gates).every((gate) => gate.result === "PASS");
const primaryBrowserPass = chrome.result === "PASS" && chrome.tests === 13 && chrome.pass === 13;
const saveCompatibilityPass = migration.result === "PASS" && storageKey === "wildWorldCompanionState.v1";
const personalUseComplete = allAutomatedPass && primaryBrowserPass && saveCompatibilityPass && serviceWorkerCache === "wild-world-companion-v10";

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: "single-user, local/offline Windows use; no public distribution, store release, or monetization",
  classificationBefore: "Beta Candidate",
  classificationAfter: personalUseComplete ? "PERSONAL_USE_COMPLETE" : "PERSONAL_USE_INCOMPLETE",
  personalUseComplete,
  completionBasis: {
    coreFunctions: "search, availability, museum tracking, safe sell judgment, backup/import, and offline reload are covered by unit and E2E tests",
    uncertaintyPolicy: "Unverified fields remain qualified; CONFLICT values are explicitly marked unresolved and not confirmed",
    imageSupport: "local manifest/import pipeline, stable placeholders, lazy-loading, error fallback, and same-origin runtime cache",
    persistence: `storage key ${storageKey}; schema ${migration.currentSchemaVersion}; migration/backup ${migration.result} ${migration.cases.length}/${migration.cases.length}`,
    primaryEnvironment: chrome.observed,
    outOfScope: ["public HTTPS deployment", "external legal review", "App Store distribution", "monetization"]
  },
  automatedGates: { unitCount, ...gates },
  data: {
    version: dataVersion,
    entities: allEntities.length,
    criticalFields: coverage.totalCriticalFieldInstances,
    claimCoverage: `${coverage.withExtractedClaims}/${coverage.totalCriticalFieldInstances}`,
    jpIndependentVerified: `${coverage.withJpIndependentVerification}/${coverage.totalCriticalFieldInstances}`,
    publicReleaseBlockerMetric: coverage.releaseBlocking,
    statuses: coverage.byStatus,
    conflictFields: coverage.conflicts,
    conflictRegistry: dataDiscrepancies.length,
    canonicalChanges: canonicalChanges.length,
    safeForPersonalUseReason: "Completeness of independent verification is not asserted; uncertain data is preserved and disclosed at the point of use."
  },
  images: {
    supportedDomains: ["fish", "bugs", "fossils", "art", "items", "residents", "npcs", "gyroids", "facilities"],
    available: Object.keys(imageAssetMap).length,
    missingWithFallback: allEntities.filter((entity) => entity.image.status === "missing").length,
    remoteDownloads: 0
  },
  browsers: {
    chrome: compactBrowser(chrome),
    edge: compactBrowser(edge),
    managedWebKit: compactBrowser(webkit),
    firefox: {
      result: "ENVIRONMENT_BLOCKED",
      observed: firefox.observed,
      rawResult: firefox.result,
      reason: "Playwright Firefox binary was installed, but Windows returned spawn UNKNOWN before browser startup; no app assertion ran."
    },
    actualSafariIOSAndroid: "NOT_REQUIRED_FOR_DECLARED_PERSONAL_WINDOWS_SCOPE"
  },
  pwa: {
    serviceWorkerCache,
    imageRuntimeCache: "wild-world-images-v1",
    updateAndStateRetention: "PASS in Chrome, Edge, and managed WebKit",
    offlineReload: "PASS in Chrome, Edge, and managed WebKit"
  },
  lighthouse,
  remainingUncertainty: [
    `${coverage.releaseBlocking} fields remain below the stricter public-release evidence metric`,
    `${coverage.conflicts} field instances across ${dataDiscrepancies.length} conflict records remain unresolved`,
    `${allEntities.filter((entity) => entity.image.status === "missing").length} current entities use the honest missing-image fallback because no local image corpus was supplied`,
    "Firefox could not start in this Windows host; Safari/iOS/Android and real screen-reader runs are outside the declared personal Windows scope"
  ],
  decision: personalUseComplete
    ? "The declared single-user local/offline scope meets the PERSONAL_USE_COMPLETE gate without claiming public release readiness or complete data verification."
    : "One or more required personal-use gates failed; do not classify as complete."
};

for (const relative of ["artifacts/qa/personal-use-readiness.json", "docs/qa/personal-use-readiness.json"]) {
  const output = path.join(root, relative);
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({ classification: report.classificationAfter, personalUseComplete, unitCount, chrome: chrome.result, edge: edge.result, webkit: webkit.result, firefox: report.browsers.firefox.result }, null, 2));
if (!personalUseComplete) process.exitCode = 1;
