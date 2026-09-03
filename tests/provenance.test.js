import test from "node:test";
import assert from "node:assert/strict";
import {
  allEntities,
  dataDiscrepancies,
  getProvenanceCoverage,
  sourceClaims,
  sources
} from "../src/data.js";
import { validateProvenance } from "../scripts/provenance-core.mjs";

const criticalFields = {
  fish: ["sellPrice", "availability", "location"],
  bug: ["sellPrice", "availability", "location"],
  fossil: ["sellPrice"],
  art: ["sellPrice", "forgedSellPrice", "authenticity", "acquisition"]
};

test("source registry records provenance independence and region", () => {
  for (const source of sources) {
    assert.ok(source.url.startsWith("https://"), `non-HTTPS source URL: ${source.id}`);
    assert.ok(source.sourceType, `missing sourceType: ${source.id}`);
    assert.ok(source.independenceGroup, `missing independenceGroup: ${source.id}`);
    assert.ok(source.region, `missing region: ${source.id}`);
    assert.equal(source.gameScope, "Animal Crossing: Wild World", `wrong game scope: ${source.id}`);
    assert.ok(source.checkedAt, `missing checkedAt: ${source.id}`);
    assert.ok(["independent", "possibly_dependent", "dependent"].includes(source.independenceStatus),
      `invalid independenceStatus: ${source.id}`);
    assert.ok(source.independenceBasis, `missing independenceBasis: ${source.id}`);
    assert.equal(source.bodyAuditStatus, "READ", `source body was not audited: ${source.id}`);
  }
});

test("every critical field has machine-readable field-level provenance", () => {
  for (const entity of allEntities) {
    for (const field of criticalFields[entity.type] ?? []) {
      const record = entity.fieldProvenance?.[field];
      assert.ok(record, `missing ${field} provenance: ${entity.id}`);
      assert.equal(record.entityId, entity.id, `wrong entityId: ${entity.id}/${field}`);
      assert.equal(record.field, field, `wrong field: ${entity.id}/${field}`);
      assert.equal(record.verificationStatus, record.status, `status alias drift: ${entity.id}/${field}`);
      assert.ok(record.region, `missing region: ${entity.id}/${field}`);
      assert.ok(Array.isArray(record.claims) && record.claims.length > 0, `missing claims: ${entity.id}/${field}`);
      assert.deepEqual(record.claims, record.sourceClaimIds, `claim aliases drift: ${entity.id}/${field}`);
      assert.equal(typeof record.needsManualVerification, "boolean", `missing manual flag: ${entity.id}/${field}`);
      assert.ok(record.userFacingBehavior, `missing UI behavior: ${entity.id}/${field}`);
      assert.ok(record.releaseImpact, `missing release impact: ${entity.id}/${field}`);
      assert.ok(record.adoptionReason, `missing adoption reason: ${entity.id}/${field}`);
      assert.ok(record.checkedAt, `missing checkedAt: ${entity.id}/${field}`);
    }
  }
});

test("source claims preserve raw, normalized, region, and source independence", () => {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const ids = new Set();
  const fingerprints = new Set();
  for (const claim of sourceClaims) {
    assert.ok(!ids.has(claim.id), `duplicate claim id: ${claim.id}`);
    ids.add(claim.id);
    const source = sourceById.get(claim.sourceId);
    assert.ok(source, `unknown source: ${claim.id}/${claim.sourceId}`);
    assert.equal(claim.sourceUrl, source.url, `source URL drift: ${claim.id}`);
    assert.equal(claim.sourceType, source.sourceType, `source type drift: ${claim.id}`);
    assert.equal(claim.independenceGroup, source.independenceGroup, `independence drift: ${claim.id}`);
    assert.equal(claim.independenceStatus, source.independenceStatus,
      `independence audit status drift: ${claim.id}`);
    assert.ok(claim.entityId, `missing entityId: ${claim.id}`);
    assert.ok(claim.field, `missing field: ${claim.id}`);
    assert.notEqual(claim.rawValue, undefined, `missing raw value: ${claim.id}`);
    assert.notEqual(claim.normalizedValue, undefined, `missing normalized value: ${claim.id}`);
    assert.ok(claim.region, `missing region: ${claim.id}`);
    assert.ok(claim.checkedAt, `missing checkedAt: ${claim.id}`);
    assert.ok(claim.notes, `missing notes: ${claim.id}`);
    const fingerprint = JSON.stringify([
      claim.entityId,
      claim.field,
      claim.sourceId,
      claim.rawValue,
      claim.normalizedValue
    ]);
    assert.ok(!fingerprints.has(fingerprint), `duplicate claim: ${claim.id}`);
    fingerprints.add(fingerprint);
  }
});

test("conflicts retain at least two distinct normalized claims", () => {
  const claimById = new Map(sourceClaims.map((claim) => [claim.id, claim]));
  for (const discrepancy of dataDiscrepancies) {
    const claims = discrepancy.sourceClaimIds.map((id) => claimById.get(id));
    assert.ok(claims.every(Boolean), `unresolved conflict claim: ${discrepancy.id}`);
    assert.ok(claims.length >= 2, `too few conflict claims: ${discrepancy.id}`);
    assert.ok(new Set(claims.map((claim) => JSON.stringify(claim.normalizedValue))).size >= 2,
      `conflict lacks distinct normalized values: ${discrepancy.id}`);
    assert.ok(discrepancy.history?.length, `missing conflict history: ${discrepancy.id}`);
  }
});

test("multi-source statuses require an agreeing JP audited-independent pair", () => {
  const claimById = new Map(sourceClaims.map((claim) => [claim.id, claim]));
  for (const entity of allEntities) {
    for (const [field, record] of Object.entries(entity.fieldProvenance ?? {})) {
      if (!['MULTI_SOURCE_VERIFIED', 'OFFICIAL_VERIFIED'].includes(record.status)) continue;
      const claims = record.sourceClaimIds.map((id) => claimById.get(id));
      const eligible = claims.filter((claim) =>
        claim?.independenceStatus === "independent" &&
        (claim.region === "JP" || claim.region === "multi_region_verified")
      );
      const hasPair = eligible.some((left, leftIndex) => eligible.slice(leftIndex + 1).some((right) =>
        left.independenceGroup !== right.independenceGroup &&
        JSON.stringify(left.normalizedValue) === JSON.stringify(right.normalizedValue)
      ));
      assert.ok(hasPair, `missing agreeing JP independent pair: ${entity.id}/${field}`);
    }
  }
});

test("coverage distinguishes extraction from independent verification", () => {
  const coverage = getProvenanceCoverage();
  assert.equal(coverage.totalCriticalFieldInstances, 468);
  assert.equal(coverage.withExtractedClaims, 468);
  assert.equal(coverage.conflicts, 9);
  assert.ok(coverage.withIndependentAgreeingClaims > 0);
  assert.equal(coverage.withDistinctGroupAgreement, coverage.withIndependentAgreeingClaims);
  assert.equal(coverage.withAuditedIndependentAgreement, 14);
  assert.equal(coverage.withJpIndependentVerification, 14);
  assert.ok(coverage.notIndependentlyVerified > 0);
  assert.equal(Object.values(coverage.byStatus).reduce((sum, count) => sum + count, 0), 468);
});

test("provenance validator accepts verified pairs alongside non-qualifying supporting claims", () => {
  const result = validateProvenance();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(result.errors, []);
});
