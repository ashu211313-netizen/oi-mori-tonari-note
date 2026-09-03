import {
  allEntities,
  canonicalChanges,
  dataDiscrepancies,
  dataVersion,
  getProvenanceCoverage,
  sourceClaims,
  sources
} from "../src/data.js";

const criticalFields = {
  fish: ["sellPrice", "availability", "location"],
  bug: ["sellPrice", "availability", "location"],
  fossil: ["sellPrice"],
  art: ["sellPrice", "forgedSellPrice", "authenticity", "acquisition"]
};

const batchPriority = new Map([
  ["fish/sellPrice", 1], ["fish/availability", 2], ["fish/location", 3],
  ["bug/sellPrice", 4], ["bug/availability", 5], ["bug/location", 6],
  ["fossil/sellPrice", 7], ["art/sellPrice", 8], ["art/forgedSellPrice", 9],
  ["art/authenticity", 10], ["art/acquisition", 11]
]);

function stableCompare(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function hasAuditedIndependentPair(claims, requireJp = false) {
  const eligible = claims.filter((claim) => claim.independenceStatus === "independent" && (
    !requireJp || claim.region === "JP" || claim.region === "multi_region_verified"
  ));
  for (let leftIndex = 0; leftIndex < eligible.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < eligible.length; rightIndex += 1) {
      const left = eligible[leftIndex];
      const right = eligible[rightIndex];
      if (left.independenceGroup === right.independenceGroup) continue;
      if (JSON.stringify(left.normalizedValue) !== JSON.stringify(right.normalizedValue)) continue;
      return true;
    }
  }
  return false;
}

function disposition(record, claims) {
  if (record.status === "CONFLICT") return "CONFLICT";
  const hasJp = claims.some((claim) => claim.region === "JP" || claim.region === "multi_region_verified");
  if (hasAuditedIndependentPair(claims, true)) return "JP_INDEPENDENT_MULTI_SOURCE";
  if (hasJp) return "JP_SINGLE_SOURCE";
  if (claims.length > 0) return "DEPENDENT_CORROBORATION_ONLY";
  return "UNKNOWN";
}

export function buildWarRoomAudit() {
  const claimById = new Map(sourceClaims.map((claim) => [claim.id, claim]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const fieldQueue = allEntities.flatMap((entity) =>
    (criticalFields[entity.type] ?? []).map((field) => {
      const record = entity.fieldProvenance[field];
      const claims = record.sourceClaimIds.map((id) => claimById.get(id)).filter(Boolean);
      return {
        queueKey: `${entity.type}/${entity.id}/${field}`,
        batchPriority: batchPriority.get(`${entity.type}/${field}`),
        entityId: entity.id,
        japaneseName: entity.japaneseName,
        englishName: entity.englishName,
        domain: entity.type,
        field,
        currentValue: record.canonicalValue,
        statusBefore: record.status,
        statusAfter: record.status,
        confidence: record.confidence,
        region: record.region,
        sourceClaimIds: record.sourceClaimIds,
        sourceIds: record.sourceIds,
        discrepancyIds: record.discrepancyIds,
        sourceIndependenceStatuses: [...new Set(claims.map((claim) => claim.independenceStatus))].sort(),
        auditDisposition: disposition(record, claims),
        canonicalChanged: false,
        userFacingBehavior: record.userFacingBehavior,
        releaseImpact: record.releaseImpact,
        unresolvedQuestion: record.needsManualVerification ? "JP独立2資料または公式根拠が未確立" : null,
        nextAction: record.status === "CONFLICT"
          ? "競合を保持し、JP一次資料または独立2資料を探索"
          : "独立性が証明されたJP追加資料を探索",
        auditedAt: "2026-09-01"
      };
    })
  ).sort((left, right) =>
    left.batchPriority - right.batchPriority || stableCompare(left.entityId, right.entityId) || stableCompare(left.field, right.field)
  ).map((entry, index) => ({ queuePosition: index + 1, ...entry }));

  const releaseBlockingFieldQueue = fieldQueue
    .filter((entry) => entry.auditDisposition !== "JP_INDEPENDENT_MULTI_SOURCE")
    .map((entry, index) => ({
      ...entry,
      originalQueuePosition: entry.queuePosition,
      queuePosition: index + 1
    }));

  const claimQueue = [...sourceClaims]
    .sort((left, right) => stableCompare(left.id, right.id))
    .map((claim, index) => {
      const source = sourceById.get(claim.sourceId);
      return {
        queuePosition: index + 1,
        claimId: claim.id,
        entityId: claim.entityId,
        appliesToEntityIds: claim.appliesToEntityIds,
        field: claim.field,
        sourceId: claim.sourceId,
        sourceUrl: claim.sourceUrl,
        rawValue: claim.rawValue,
        normalizedValue: claim.normalizedValue,
        region: claim.region,
        checkedAt: claim.checkedAt,
        independenceGroup: claim.independenceGroup,
        sourceIndependenceStatus: claim.independenceStatus,
        sourceLineageId: claim.sourceLineageId,
        sourceBodyAuditStatus: source.bodyAuditStatus,
        independenceBasis: source.independenceBasis,
        auditOutcome: claim.independenceStatus === "independent" ? "independent" : claim.independenceStatus,
        canonicalPromotionEligible: claim.independenceStatus === "independent" &&
          (claim.region === "JP" || claim.region === "multi_region_verified"),
        notes: claim.notes,
        auditedAt: "2026-09-01"
      };
    });

  const coverage = getProvenanceCoverage();
  const sourceAudits = sources.map((source) => ({
    sourceId: source.id,
    url: source.url,
    region: source.region,
    independenceGroup: source.independenceGroup,
    independenceStatus: source.independenceStatus,
    independenceBasis: source.independenceBasis,
    bodyAuditStatus: source.bodyAuditStatus,
    checkedAt: source.independenceCheckedAt,
    lineage: source.lineage
  }));
  const sourcePairAudits = [];
  for (let leftIndex = 0; leftIndex < sourceAudits.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sourceAudits.length; rightIndex += 1) {
      const left = sourceAudits[leftIndex];
      const right = sourceAudits[rightIndex];
      const sameGroup = left.independenceGroup === right.independenceGroup;
      const citationLink = left.lineage.citedSourceIds.includes(right.sourceId) ||
        right.lineage.citedSourceIds.includes(left.sourceId);
      const affirmativeIndependence = left.independenceStatus === "independent" &&
        right.independenceStatus === "independent" && !sameGroup && !citationLink;
      sourcePairAudits.push({
        pairKey: [left.sourceId, right.sourceId].sort().join("::"),
        leftSourceId: left.sourceId,
        rightSourceId: right.sourceId,
        sameIndependenceGroup: sameGroup,
        explicitCitationLink: citationLink,
        relationship: sameGroup || citationLink ? "dependent" : affirmativeIndependence ? "independent" : "possibly_dependent",
        qualifiesAsIndependentPair: affirmativeIndependence,
        decisionReason: sameGroup
          ? "同一independenceGroupのため独立票にしない"
          : citationLink
            ? "引用関係があるため独立票にしない"
            : affirmativeIndependence
              ? "両資料が本人の部分的プレイ観測による作成過程を本文で明示し、運営者・掲載基盤が別で相互引用もない"
              : "別groupでも共通攻略本・転載・上流データの不存在を肯定証明できない",
        auditedAt: "2026-09-01"
      });
    }
  }
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    dataVersion,
    queueDefinition: {
      fields: "batch priority, then entityId, then field (stable)",
      claims: "claimId ascending (stable)"
    },
    summary: {
      totalCriticalFields: fieldQueue.length,
      totalSourceClaims: claimQueue.length,
      fieldClaimCoverage: `${coverage.withExtractedClaims}/${coverage.totalCriticalFieldInstances}`,
      jpIndependentTwoSourceVerified: coverage.withJpIndependentVerification,
      distinctGroupAgreement: coverage.withDistinctGroupAgreement,
      auditedIndependentAgreement: coverage.withAuditedIndependentAgreement,
      singleSource: coverage.byStatus.SINGLE_SOURCE ?? 0,
      corroborated: coverage.byStatus.CORROBORATED ?? 0,
      conflictFields: coverage.conflicts,
      conflictRegistry: dataDiscrepancies.length,
      canonicalChanges: canonicalChanges.length,
      allFieldSlotsAudited: fieldQueue.length === coverage.totalCriticalFieldInstances,
      allClaimSlotsAudited: claimQueue.length === sourceClaims.length,
      sourceBodiesRead: sources.filter((source) => source.bodyAuditStatus === "READ").length,
      sourcesAudited: sources.length,
      sourcePairsAudited: sourcePairAudits.length,
      qualifiedIndependentSourcePairs: sourcePairAudits.filter((entry) => entry.qualifiesAsIndependentPair).length,
      releaseBlockingFields: releaseBlockingFieldQueue.length
    },
    sourceAudits,
    sourcePairAudits,
    fieldQueue,
    releaseBlockingFieldQueue,
    claimQueue
  };
}
