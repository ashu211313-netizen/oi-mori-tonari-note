import { buildEvidenceSufficiencyReport } from "./evidence-sufficiency-core.mjs";

const report = buildEvidenceSufficiencyReport();
const errors = [];
if (report.summary.totalCriticalFields !== 468) errors.push("critical field count drifted");
if (report.summary.fieldsReAudited !== report.summary.totalCriticalFields) errors.push("not every field was re-audited");
if (report.fieldDispositions.some((entry) => !entry.evidenceSufficiencyClass || !entry.userRisk?.level)) errors.push("missing evidence class or user risk");
if (report.fieldDispositions.some((entry) => entry.escalationLadder.length !== 7)) errors.push("incomplete escalation ladder");
if (report.fieldDispositions.some((entry) => entry.releaseBlockerAfter && (!entry.blockerRationale || !entry.nextExactAction))) errors.push("release blocker lacks rationale/next action");
if (report.fieldDispositions.some((entry) => entry.evidenceSufficiencyClass.startsWith("D_") && entry.definitiveClaimAllowed)) errors.push("D evidence permits definitive claim");
console.log(JSON.stringify({
  valid: errors.length === 0,
  totalCriticalFields: report.summary.totalCriticalFields,
  releaseBlockersAfter: report.summary.releaseBlockersAfter,
  byEvidenceClass: report.summary.byEvidenceClass,
  errors
}, null, 2));
if (errors.length) process.exitCode = 1;
