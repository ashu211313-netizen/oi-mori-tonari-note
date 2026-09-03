import { mkdir, writeFile } from "node:fs/promises";
import { conflictReport } from "./provenance-core.mjs";

const outputDirectory = new URL("../artifacts/data-audit/", import.meta.url);
const outputFile = new URL("conflict-report.json", outputDirectory);
await mkdir(outputDirectory, { recursive: true });
const report = conflictReport();
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
