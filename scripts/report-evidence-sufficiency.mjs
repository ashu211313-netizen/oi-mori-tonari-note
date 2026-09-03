import { mkdir, writeFile } from "node:fs/promises";
import { buildEvidenceSufficiencyReport } from "./evidence-sufficiency-core.mjs";

const report = buildEvidenceSufficiencyReport();
const outputDirectory = new URL("../artifacts/data-audit/", import.meta.url);
const outputFile = new URL("evidence-sufficiency-report.json", outputDirectory);
const dispositionFile = new URL("zero-blockers-454-field-disposition.json", outputDirectory);
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(dispositionFile, `${JSON.stringify({
  schemaVersion: report.schemaVersion,
  generatedAt: report.generatedAt,
  dataVersion: report.dataVersion,
  policy: report.policy,
  summary: report.summary,
  fieldDispositions: report.fieldDispositions.filter((entry) => entry.releaseBlockerBefore)
}, null, 2)}\n`);
console.log(JSON.stringify({
  output: "artifacts/data-audit/evidence-sufficiency-report.json",
  dispositionOutput: "artifacts/data-audit/zero-blockers-454-field-disposition.json",
  ...report.summary
}, null, 2));

if (report.summary.fieldsReAudited !== report.summary.totalCriticalFields ||
    report.fieldDispositions.some((entry) => !entry.evidenceSufficiencyClass || !entry.userRisk?.level || entry.escalationLadder.length !== 7)) {
  process.exitCode = 1;
}
