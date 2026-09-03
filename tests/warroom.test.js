import test from "node:test";
import assert from "node:assert/strict";
import { buildWarRoomAudit } from "../scripts/evidence-warroom-core.mjs";
import { buildEvidenceSufficiencyReport } from "../scripts/evidence-sufficiency-core.mjs";
import { buildConflictTribunalReport } from "../scripts/conflict-tribunal-core.mjs";

test("War Room audit deterministically covers every live field and claim", () => {
  const report = buildWarRoomAudit();
  assert.equal(report.fieldQueue.length, 468);
  assert.equal(report.claimQueue.length, 693);
  assert.deepEqual(report.fieldQueue.map((entry) => entry.queuePosition),
    Array.from({ length: 468 }, (_, index) => index + 1));
  assert.deepEqual(report.claimQueue.map((entry) => entry.queuePosition),
    Array.from({ length: 693 }, (_, index) => index + 1));
  assert.equal(new Set(report.fieldQueue.map((entry) => entry.queueKey)).size, 468);
  assert.equal(new Set(report.claimQueue.map((entry) => entry.claimId)).size, 693);
});

test("War Room audit never promotes unproven independence", () => {
  const report = buildWarRoomAudit();
  assert.equal(report.summary.jpIndependentTwoSourceVerified, 14);
  assert.equal(report.summary.auditedIndependentAgreement, 14);
  assert.equal(report.summary.canonicalChanges, 0);
  assert.ok(report.fieldQueue.every((entry) => entry.auditDisposition));
  assert.ok(report.claimQueue.every((entry) => entry.sourceIndependenceStatus));
});

test("Final20 queue contains only the 454 release-blocking fields in stable order", () => {
  const report = buildWarRoomAudit();
  assert.equal(report.summary.releaseBlockingFields, 454);
  assert.equal(report.releaseBlockingFieldQueue.length, 454);
  assert.deepEqual(report.releaseBlockingFieldQueue.map((entry) => entry.queuePosition),
    Array.from({ length: 454 }, (_, index) => index + 1));
  assert.ok(report.releaseBlockingFieldQueue.every((entry) =>
    entry.auditDisposition !== "JP_INDEPENDENT_MULTI_SOURCE"));
  assert.deepEqual(
    report.releaseBlockingFieldQueue.map((entry) => entry.originalQueuePosition),
    [...report.releaseBlockingFieldQueue.map((entry) => entry.originalQueuePosition)].sort((a, b) => a - b)
  );
});

test("Source Lineage audit covers every source and unordered source pair", () => {
  const report = buildWarRoomAudit();
  assert.equal(report.sourceAudits.length, 15);
  assert.equal(report.sourcePairAudits.length, 105);
  assert.equal(new Set(report.sourcePairAudits.map((entry) => entry.pairKey)).size, 105);
  assert.ok(report.sourceAudits.every((entry) => entry.lineage?.operator));
  assert.ok(report.sourceAudits.every((entry) => entry.lineage?.upstreamSource));
  assert.ok(report.sourceAudits.every((entry) => entry.lineage?.evidenceClass));
  assert.ok(report.claimQueue.every((entry) => entry.sourceLineageId === entry.sourceId));
});

test("No source pair qualifies as independent without affirmative lineage evidence", () => {
  const report = buildWarRoomAudit();
  assert.equal(report.summary.sourcePairsAudited, 105);
  assert.equal(report.summary.qualifiedIndependentSourcePairs, 1);
  const qualified = report.sourcePairAudits.filter((entry) => entry.qualifiesAsIndependentPair);
  assert.deepEqual(qualified.map((entry) => entry.pairKey), [
    "jp-firsthand-hot-cocoa::jp-firsthand-landscape"
  ]);
  assert.equal(qualified[0].relationship, "independent");
});

test("JP independent verification is limited to overlapping first-hand fish prices", () => {
  const report = buildWarRoomAudit();
  const verified = report.fieldQueue.filter((entry) => entry.auditDisposition === "JP_INDEPENDENT_MULTI_SOURCE");
  assert.equal(verified.length, 14);
  assert.ok(verified.every((entry) => entry.domain === "fish" && entry.field === "sellPrice"));
  assert.ok(verified.every((entry) => entry.sourceIds.includes("jp-firsthand-landscape")));
  assert.ok(verified.every((entry) => entry.sourceIds.includes("jp-firsthand-hot-cocoa")));
});

test("Evidence Sufficiency re-audit covers every field without weakening the release gate", () => {
  const report = buildEvidenceSufficiencyReport();
  assert.equal(report.summary.totalCriticalFields, 468);
  assert.equal(report.summary.fieldsReAudited, 468);
  assert.equal(report.summary.releaseBlockersBefore, 454);
  assert.equal(report.summary.releaseBlockersAfter, 454);
  assert.equal(report.summary.blockersRemovedWithWrittenRationale, 0);
  assert.deepEqual(report.summary.byEvidenceClass, {
    B_JP_INDEPENDENT_MULTI_SOURCE: 14,
    C_JP_SINGLE_SOURCE: 385,
    D_CONFLICT: 9,
    D_DEPENDENT_CORROBORATION_ONLY: 60
  });
  assert.equal(report.fieldDispositions.length, 468);
  assert.ok(report.fieldDispositions.every((entry) => entry.userRisk?.level));
  assert.ok(report.fieldDispositions.every((entry) =>
    entry.escalationLadder.map((level) => level.level).join(",") === "L1,L2,L3,L4,L5,L6,L7"));
  assert.ok(report.fieldDispositions.filter((entry) => entry.releaseBlockerAfter).every((entry) =>
    entry.blockerRationale && entry.nextExactAction));
});

test("Evidence Sufficiency keeps conflicts non-definitive and preserves canonical freeze", () => {
  const report = buildEvidenceSufficiencyReport();
  const conflicts = report.fieldDispositions.filter((entry) => entry.evidenceSufficiencyClass === "D_CONFLICT");
  assert.equal(conflicts.length, 9);
  assert.ok(conflicts.every((entry) => entry.releaseBlockerAfter));
  assert.ok(conflicts.every((entry) => entry.definitiveClaimAllowed === false));
  assert.equal(report.summary.canonicalChanges, 0);
  assert.equal(report.summary.dataVersionChanged, false);
});

test("Conflict tribunal retains every unresolved registry record and field", () => {
  const report = buildConflictTribunalReport();
  assert.equal(report.summary.registryBefore, 6);
  assert.equal(report.summary.registryAfter, 6);
  assert.equal(report.summary.affectedFieldsBefore, 9);
  assert.equal(report.summary.affectedFieldsAfter, 9);
  assert.equal(report.summary.resolved, 0);
  assert.equal(report.summary.canonicalChanges, 0);
  assert.equal(report.tribunals.length, 6);
  assert.ok(report.tribunals.every((entry) => entry.decision === "RETAIN_CONFLICT"));
  assert.ok(report.tribunals.every((entry) => entry.escalation.web && entry.escalation.bibliography && entry.escalation.gameData));
  assert.equal(report.tribunals.flatMap((entry) => entry.fieldDispositions).length, 9);
});
