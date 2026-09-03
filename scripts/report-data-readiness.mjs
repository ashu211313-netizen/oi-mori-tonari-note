import { mkdir, readFile, writeFile } from "node:fs/promises";
import { canonicalChanges, dataVersion } from "../src/data.js";
import { expansionCounts, residentUncertainties } from "../src/expansion-data.js";
import { CURRENT_SCHEMA_VERSION } from "../src/storage.js";
import { conflictReport, provenanceReport } from "./provenance-core.mjs";

const swText = await readFile(new URL("../sw.js", import.meta.url), "utf8");
const cacheName = /CACHE_NAME\s*=\s*"([^"]+)"/.exec(swText)?.[1] ?? "UNKNOWN";
const provenance = provenanceReport();
const conflicts = conflictReport();
const report = {
  generatedAt: new Date().toISOString(),
  dataVersion,
  serviceWorkerCache: cacheName,
  saveSchemaChanged: true,
  saveSchemaVersion: CURRENT_SCHEMA_VERSION,
  canonicalChanges,
  expansion: {
    counts: expansionCounts,
    residentUncertainties
  },
  provenance,
  conflicts: {
    discrepancyRecordCount: conflicts.discrepancyRecordCount,
    affectedFieldInstanceCount: conflicts.affectedFieldInstanceCount
  },
  releaseGate: {
    dataValidation: provenance.valid ? "PASS" : "FAIL",
    jpIndependentCoverage: `${provenance.coverage.withJpIndependentVerification}/${provenance.coverage.totalCriticalFieldInstances}`,
    unresolvedConflictRecords: conflicts.discrepancyRecordCount,
    classificationCeiling: conflicts.discrepancyRecordCount > 0 ? "Beta Candidate" : "requires full QA gate evaluation"
  }
};
const outputDirectory = new URL("../artifacts/data-audit/", import.meta.url);
const outputFile = new URL("data-readiness-report.json", outputDirectory);
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!provenance.valid) process.exitCode = 1;
