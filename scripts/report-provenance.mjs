import { mkdir, writeFile } from "node:fs/promises";
import { provenanceReport } from "./provenance-core.mjs";

const outputDirectory = new URL("../artifacts/data-audit/", import.meta.url);
const outputFile = new URL("provenance-report.json", outputDirectory);
await mkdir(outputDirectory, { recursive: true });
const report = provenanceReport();
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;
