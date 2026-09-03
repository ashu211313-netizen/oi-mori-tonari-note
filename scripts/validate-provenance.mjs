import { validateProvenance } from "./provenance-core.mjs";

const report = validateProvenance();
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;
