import { mkdir, writeFile } from "node:fs/promises";
import { buildWarRoomAudit } from "./evidence-warroom-core.mjs";

const outputDirectory = new URL("../artifacts/data-audit/", import.meta.url);
const outputFile = new URL("evidence-warroom-ledger.json", outputDirectory);
const sourceOutputFile = new URL("source-independence-report.json", outputDirectory);
const jpOutputFile = new URL("jp-verification-report.json", outputDirectory);
const final20QueueOutputFile = new URL("final20-field-queue.json", outputDirectory);
await mkdir(outputDirectory, { recursive: true });
const report = buildWarRoomAudit();
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(sourceOutputFile, `${JSON.stringify({
  schemaVersion: report.schemaVersion,
  generatedAt: report.generatedAt,
  dataVersion: report.dataVersion,
  summary: {
    sourcesAudited: report.summary.sourcesAudited,
    sourceBodiesRead: report.summary.sourceBodiesRead,
    claimsAudited: report.summary.totalSourceClaims,
    auditedIndependentAgreement: report.summary.auditedIndependentAgreement
  },
  sourceAudits: report.sourceAudits,
  sourcePairAudits: report.sourcePairAudits,
  claimQueue: report.claimQueue
}, null, 2)}\n`);
await writeFile(jpOutputFile, `${JSON.stringify({
  schemaVersion: report.schemaVersion,
  generatedAt: report.generatedAt,
  dataVersion: report.dataVersion,
  summary: report.summary,
  fieldQueue: report.fieldQueue
}, null, 2)}\n`);
await writeFile(final20QueueOutputFile, `${JSON.stringify({
  schemaVersion: report.schemaVersion,
  generatedAt: report.generatedAt,
  dataVersion: report.dataVersion,
  queueDefinition: "release-blocking fields only; original deterministic order preserved",
  before: {
    totalCriticalFields: report.summary.totalCriticalFields,
    jpIndependentTwoSourceVerified: report.summary.jpIndependentTwoSourceVerified,
    releaseBlockingFields: report.summary.releaseBlockingFields
  },
  fieldQueue: report.releaseBlockingFieldQueue
}, null, 2)}\n`);
console.log(JSON.stringify({ output: "artifacts/data-audit/evidence-warroom-ledger.json", ...report.summary }, null, 2));

if (!report.summary.allFieldSlotsAudited || !report.summary.allClaimSlotsAudited) process.exitCode = 1;
