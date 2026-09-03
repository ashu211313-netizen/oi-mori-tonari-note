import {
  allEntities,
  canonicalChanges,
  dataDiscrepancies,
  dataVersion,
  getProvenanceCoverage,
  sourceClaims,
  sources
} from "../src/data.js";

export const criticalFields = {
  fish: ["sellPrice", "availability", "location"],
  bug: ["sellPrice", "availability", "location"],
  fossil: ["sellPrice"],
  art: ["sellPrice", "forgedSellPrice", "authenticity", "acquisition"]
};

const statuses = new Set([
  "OFFICIAL_VERIFIED", "MULTI_SOURCE_VERIFIED", "CORROBORATED", "SINGLE_SOURCE",
  "REGION_SPECIFIC", "CONFLICT", "UNKNOWN", "FALSE", "BLOCKER"
]);
const confidences = new Set(["A", "B", "C", "D", "BLOCKER"]);
const regions = new Set(["JP", "US", "EU", "multi_region_verified", "region_unknown"]);
const independenceStatuses = new Set(["independent", "possibly_dependent", "dependent"]);

function stableValue(value) {
  return JSON.stringify(value);
}

function hasQualifyingJpIndependentPair(claims) {
  const eligible = claims.filter((claim) =>
    claim?.independenceStatus === "independent" &&
    ["JP", "multi_region_verified"].includes(claim.region)
  );
  return eligible.some((left, leftIndex) => eligible.slice(leftIndex + 1).some((right) =>
    left.independenceGroup !== right.independenceGroup &&
    stableValue(left.normalizedValue) === stableValue(right.normalizedValue)
  ));
}

export function validateProvenance() {
  const errors = [];
  const fail = (message) => errors.push(message);
  const entityById = new Map(allEntities.map((entity) => [entity.id, entity]));
  const sourceById = new Map();
  const claimById = new Map();
  const claimFingerprints = new Set();

  for (const source of sources) {
    if (sourceById.has(source.id)) fail(`duplicate source id: ${source.id}`);
    sourceById.set(source.id, source);
    for (const field of ["url", "sourceType", "independenceGroup", "independenceStatus", "independenceBasis", "bodyAuditStatus", "independenceCheckedAt", "region", "gameScope", "checkedAt", "sourceQualityNotes"]) {
      if (!source[field]) fail(`source ${source.id} missing ${field}`);
    }
    if (!independenceStatuses.has(source.independenceStatus)) fail(`source ${source.id} has invalid independence status`);
    if (source.bodyAuditStatus !== "READ") fail(`source ${source.id} body audit is incomplete`);
    for (const field of ["evidenceClass", "operator", "publisher", "firstPublication", "upstreamSource", "lineageSignals", "archiveStatus", "lineageConclusion"]) {
      if (!source.lineage?.[field] || (Array.isArray(source.lineage[field]) && source.lineage[field].length === 0)) {
        fail(`source ${source.id} missing lineage ${field}`);
      }
    }
    if (!regions.has(source.region)) fail(`source ${source.id} has invalid region ${source.region}`);
    if (source.gameScope !== "Animal Crossing: Wild World") fail(`source ${source.id} has wrong game scope`);
  }

  for (const claim of sourceClaims) {
    if (claimById.has(claim.id)) fail(`duplicate claim id: ${claim.id}`);
    claimById.set(claim.id, claim);
    const source = sourceById.get(claim.sourceId);
    if (!source) {
      fail(`claim ${claim.id} references missing source ${claim.sourceId}`);
      continue;
    }
    for (const field of ["sourceUrl", "sourceType", "independenceGroup", "independenceStatus", "sourceLineageId", "entityId", "field", "region", "checkedAt", "notes"]) {
      if (!claim[field]) fail(`claim ${claim.id} missing ${field}`);
    }
    if (claim.rawValue === undefined) fail(`claim ${claim.id} missing rawValue`);
    if (claim.normalizedValue === undefined) fail(`claim ${claim.id} missing normalizedValue`);
    if (!regions.has(claim.region)) fail(`claim ${claim.id} has invalid region ${claim.region}`);
    if (claim.sourceUrl !== source.url) fail(`claim ${claim.id} sourceUrl drift`);
    if (claim.sourceType !== source.sourceType) fail(`claim ${claim.id} sourceType drift`);
    if (claim.independenceGroup !== source.independenceGroup) fail(`claim ${claim.id} independenceGroup drift`);
    if (claim.independenceStatus !== source.independenceStatus) fail(`claim ${claim.id} independenceStatus drift`);
    if (claim.sourceLineageId !== source.id) fail(`claim ${claim.id} sourceLineageId drift`);
    const applies = claim.appliesToEntityIds ?? [claim.entityId];
    if (!applies.every((id) => entityById.has(id))) fail(`claim ${claim.id} applies to missing entity`);
    const fingerprint = stableValue([claim.entityId, claim.field, claim.sourceId, claim.rawValue, claim.normalizedValue]);
    if (claimFingerprints.has(fingerprint)) fail(`duplicate claim payload: ${claim.id}`);
    claimFingerprints.add(fingerprint);
  }

  for (const entity of allEntities) {
    for (const field of criticalFields[entity.type] ?? []) {
      const record = entity.fieldProvenance?.[field];
      if (!record) {
        fail(`missing provenance: ${entity.id}/${field}`);
        continue;
      }
      if (record.entityId !== entity.id || record.field !== field) fail(`provenance identity drift: ${entity.id}/${field}`);
      if (!statuses.has(record.verificationStatus) || record.status !== record.verificationStatus) {
        fail(`invalid status: ${entity.id}/${field}/${record.verificationStatus}`);
      }
      if (!confidences.has(record.confidence)) fail(`invalid confidence: ${entity.id}/${field}/${record.confidence}`);
      if (!regions.has(record.region)) fail(`invalid region: ${entity.id}/${field}/${record.region}`);
      if (!record.checkedAt || !record.adoptionReason || !record.userFacingBehavior || !record.releaseImpact) {
        fail(`incomplete provenance metadata: ${entity.id}/${field}`);
      }
      if (!Array.isArray(record.sourceClaimIds) || record.sourceClaimIds.length === 0) {
        fail(`missing provenance claims: ${entity.id}/${field}`);
        continue;
      }
      if (stableValue(record.claims) !== stableValue(record.sourceClaimIds)) fail(`claim alias drift: ${entity.id}/${field}`);
      const claims = record.sourceClaimIds.map((id) => claimById.get(id));
      if (claims.some((claim) => !claim)) fail(`unresolved provenance claim: ${entity.id}/${field}`);
      if (claims.some((claim) => !(claim.appliesToEntityIds ?? [claim.entityId]).includes(entity.id))) {
        fail(`claim entity mismatch: ${entity.id}/${field}`);
      }
      if (record.status === "MULTI_SOURCE_VERIFIED" && !hasQualifyingJpIndependentPair(claims)) {
        fail(`verified status lacks an agreeing JP audited-independent pair: ${entity.id}/${field}`);
      }
      if (record.status === "CONFLICT") {
        if (claims.length < 2 || new Set(claims.map((claim) => stableValue(claim?.normalizedValue))).size < 2) {
          fail(`CONFLICT lacks two distinct normalized claims: ${entity.id}/${field}`);
        }
      }
      if (record.status === "UNKNOWN" && ["A", "B"].includes(record.confidence)) {
        fail(`UNKNOWN has excessive confidence: ${entity.id}/${field}`);
      }
    }
  }

  for (const discrepancy of dataDiscrepancies) {
    const affected = discrepancy.affectedEntityIds ?? [discrepancy.entityId];
    if (!affected.every((id) => entityById.has(id))) fail(`conflict ${discrepancy.id} references missing entity`);
    if (!discrepancy.history?.length) fail(`conflict ${discrepancy.id} missing history`);
    const claims = discrepancy.sourceClaimIds.map((id) => claimById.get(id));
    if (claims.some((claim) => !claim)) fail(`conflict ${discrepancy.id} has missing claim`);
    if (new Set(claims.map((claim) => stableValue(claim?.normalizedValue))).size < 2) {
      fail(`conflict ${discrepancy.id} lacks differing normalized claims`);
    }
    if (discrepancy.resolutionStatus === "resolved" && !discrepancy.history.some((item) => item.status === "resolved")) {
      fail(`resolved conflict ${discrepancy.id} lacks resolution history`);
    }
  }

  for (const change of canonicalChanges) {
    for (const field of ["entityId", "field", "oldValue", "newValue", "oldStatus", "newStatus", "evidence", "adoptionReason", "affectedUi", "affectedTests", "dataVersionDecision", "serviceWorkerDecision", "releaseNote"]) {
      if (change[field] === undefined || change[field] === "") fail(`canonical change missing ${field}`);
    }
  }

  const coverage = getProvenanceCoverage();
  if (coverage.totalCriticalFieldInstances !== 468) fail(`critical field count drift: ${coverage.totalCriticalFieldInstances}`);
  if (coverage.withExtractedClaims !== 468) fail(`field claim coverage incomplete: ${coverage.withExtractedClaims}/468`);

  return {
    valid: errors.length === 0,
    dataVersion,
    checkedAt: new Date().toISOString(),
    sourceCount: sources.length,
    sourceClaimCount: sourceClaims.length,
    discrepancyRecords: dataDiscrepancies.length,
    canonicalChangeCount: canonicalChanges.length,
    coverage,
    errors
  };
}

export function provenanceReport() {
  const result = validateProvenance();
  return {
    ...result,
    statusDefinitions: {
      CORROBORATED: "異なるindependenceGroupの資料値は一致するが、依存関係の不存在またはJP地域の独立2資料検証は未証明",
      MULTI_SOURCE_VERIFIED: "同じ正規化値を支持するJP適用可能な監査済み独立資料が2件以上ある",
      SINGLE_SOURCE: "抽出済みclaimが1 source groupのみ。独立性またはJP同値は未証明",
      CONFLICT: "正規化後も資料間の値が一致しない"
    },
    releaseInterpretation: {
      jpIndependentVerificationRequired: true,
      distinctGroupAgreementIsNotVerifiedIndependence: true,
      verifiedForReleaseCount: result.coverage.withJpIndependentVerification,
      releaseBlockingFieldCount: result.coverage.releaseBlocking
    }
  };
}

export function conflictReport() {
  const claimById = new Map(sourceClaims.map((claim) => [claim.id, claim]));
  return {
    dataVersion,
    generatedAt: new Date().toISOString(),
    discrepancyRecordCount: dataDiscrepancies.length,
    affectedFieldInstanceCount: getProvenanceCoverage().conflicts,
    conflicts: dataDiscrepancies.map((item) => ({
      ...item,
      claims: item.sourceClaimIds.map((id) => claimById.get(id)),
      attemptedSources: (item.attemptedSourceIds ?? []).map((id) => sources.find((source) => source.id === id))
    }))
  };
}
