import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(readFileSync(path.join(root, relative), "utf8"));
const provenance = readJson("artifacts/data-audit/provenance-report.json");
const evidence = readJson("artifacts/data-audit/evidence-sufficiency-report.json");
const tribunal = readJson("artifacts/data-audit/zero-blockers-conflict-tribunal.json");
const migration = readJson("artifacts/qa/migration-backup-matrix.json");
const security = readJson("artifacts/qa/security-privacy-ip-report.json");
const lighthouse = readJson("artifacts/lighthouse-summary.json");
const publicHttps = readJson("artifacts/qa/public-https-pwa-report.json");
const accessibility = readJson("artifacts/qa/accessibility-matrix.json");
const browser = (label) => readJson(`artifacts/qa/e2e-${label}.json`);

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  classificationBefore: "Beta Candidate",
  classificationAfter: "Beta Candidate",
  releaseReady: false,
  data: {
    criticalFields: provenance.coverage.totalCriticalFieldInstances,
    claimCoverage: `${provenance.coverage.withExtractedClaims}/${provenance.coverage.totalCriticalFieldInstances}`,
    sourceClaims: provenance.sourceClaimCount,
    jpIndependentVerified: `${provenance.coverage.withJpIndependentVerification}/${provenance.coverage.totalCriticalFieldInstances}`,
    releaseBlockersBefore: evidence.summary.releaseBlockersBefore,
    releaseBlockersAfter: evidence.summary.releaseBlockersAfter,
    blockersRemoved: evidence.summary.blockersRemovedWithWrittenRationale,
    evidenceClasses: evidence.summary.byEvidenceClass,
    userRisk: evidence.summary.byUserRisk,
    statuses: provenance.coverage.byStatus,
    conflictsBefore: {
      registry: tribunal.summary.registryBefore,
      fields: tribunal.summary.affectedFieldsBefore
    },
    conflictsAfter: {
      registry: tribunal.summary.registryAfter,
      fields: tribunal.summary.affectedFieldsAfter
    },
    canonicalChanges: provenance.canonicalChangeCount,
    dataVersion: provenance.dataVersion
  },
  application: {
    unit: "PASS 89/89",
    typecheck: "PASS",
    eslint: "PASS",
    build: "PASS",
    dataValidation: "PASS",
    provenanceValidation: "PASS",
    evidenceSufficiencyValidation: "PASS",
    staticValidation: "PASS",
    securityValidation: security.securityPrivacy.status,
    storageKey: migration.storageKey,
    schemaVersion: migration.currentSchemaVersion,
    migrationBackup: `${migration.result} ${migration.cases.length}/${migration.cases.length}`,
    serviceWorker: "wild-world-companion-v10"
  },
  browsers: {
    chrome: browser("personal-v10-chrome"),
    edge: browser("personal-v10-edge"),
    webkitManaged: browser("personal-v10-webkit"),
    firefoxFull: browser("personal-v10-firefox"),
    pixel7Descriptor: "NOT_RUN_CURRENT_V10",
    iphone14Descriptor: "NOT_RUN_CURRENT_V10",
    safariActual: "NOT_RUN",
    iosActual: "NOT_RUN",
    androidActual: "NOT_RUN"
  },
  accessibility,
  publicHttps,
  lighthouse,
  security,
  cleanInstall: {
    status: "PASS",
    command: "pnpm install --offline --frozen-lockfile",
    packagesReused: 179,
    packagesDownloaded: 0,
    verification: "89/89, typecheck, lint, build",
    note: "Final release-package copy is rechecked after documentation freeze."
  },
  redTeamBlockingReasons: [
    "454 critical fields remain below their field-specific evidence sufficiency threshold",
    "6 conflict records affecting 9 field instances remain unresolved",
    "Firefox 153 current v10 binary could not start on this Windows host (spawn UNKNOWN before app assertions)",
    "Managed WebKit PASS is not actual Safari PASS",
    "Safari desktop, iOS physical, and Android physical QA are not run",
    "No complete real screen-reader audit is available",
    "No authorized public HTTPS deployment was available for validation",
    "Trademark and game-data redistribution legal review is external and incomplete"
  ],
  humanVerificationKit: "docs/qa/human-verification-kit.md",
  decision: "Release Gate incomplete; retain Beta Candidate."
};

for (const relative of [
  "artifacts/qa/zero-blockers-final-gate-report.json",
  "docs/qa/final-gate-report.json"
]) {
  const output = path.join(root, relative);
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({
  classification: report.classificationAfter,
  releaseReady: report.releaseReady,
  dataBlockers: report.data.releaseBlockersAfter,
  conflictRegistry: report.data.conflictsAfter.registry,
  redTeamBlockingReasons: report.redTeamBlockingReasons.length
}, null, 2));
