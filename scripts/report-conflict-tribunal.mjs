import { mkdir, writeFile } from "node:fs/promises";
import { buildConflictTribunalReport } from "./conflict-tribunal-core.mjs";

const report = buildConflictTribunalReport();
const outputDirectory = new URL("../artifacts/data-audit/", import.meta.url);
const outputFile = new URL("zero-blockers-conflict-tribunal.json", outputDirectory);
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: "artifacts/data-audit/zero-blockers-conflict-tribunal.json", ...report.summary }, null, 2));
if (report.tribunals.length !== report.summary.registryAfter ||
    report.tribunals.some((entry) => entry.fieldDispositions.length === 0 || !entry.decisionReason)) process.exitCode = 1;
