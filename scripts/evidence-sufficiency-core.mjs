import { canonicalChanges, dataVersion } from "../src/data.js";
import { buildWarRoomAudit } from "./evidence-warroom-core.mjs";

const AUDITED_AT = "2026-09-02";

const researchEscalation = [
  {
    id: "nintendo-jp-admj-manual",
    level: "L2_OFFICIAL_JP_PRIMARY",
    url: "https://m1.nintendo.net/docvc/NTR/JPN/ADMJ/ADMJ_J.pdf",
    scope: "日本版ADMJ公式取扱説明書（29 pages）",
    result: "OFFICIAL_SCOPE_ONLY",
    disposition: "作品・基本操作の一次資料だが、critical fieldの価格・月日・時間・場所・真贋表を確認できず、field evidenceへ昇格しない"
  },
  {
    id: "kadokawa-complete-guide-bibliography",
    level: "L4_BIBLIOGRAPHY",
    url: "https://www.kadokawa.co.jp/product/200512000177/",
    scope: "ザ・コンプリートガイド、2005-12-28、240 pages、ISBN 9784840233170",
    result: "GUIDEBOOK_IDENTIFIED_CONTENT_UNAVAILABLE",
    disposition: "書誌は一次publisher pageで確認したが本文未確認。GUIDEBOOK_DERIVED_UNCONFIRMED"
  },
  {
    id: "jp-guidebook-universe",
    level: "L4_BIBLIOGRAPHY",
    scope: "Nintendo DREAM 9784839919788、Famitsu 9784757726123、Dengeki 9784840233170、Shogakukan 9784091062796",
    result: "FOUR_GUIDEBOOKS_IDENTIFIED_NOT_INSPECTED",
    disposition: "複数web表の共通上流候補。現物本文・版・訂正履歴を確認できないため独立性を肯定しない"
  },
  {
    id: "universal-team-acww-research",
    level: "L5_GAME_DATA",
    url: "https://wiki.universal-team.net/acww-research/index.html",
    scope: "公開save structure research",
    result: "NO_CRITICAL_FIELD_TABLE",
    disposition: "player/villager/save offsets中心で、JP価格・spawn・art fieldを再現できる資料ではない"
  },
  {
    id: "thegag96-acww-hax",
    level: "L5_GAME_DATA",
    url: "https://github.com/TheGag96/acww-hax",
    scope: "公開Wild World modding/code-injection repository",
    result: "NO_CRITICAL_FIELD_TABLE",
    disposition: "ADME/ADMP patch・overlay資料であり、ADMJ critical fieldの由来と再現手順を提供しない"
  },
  {
    id: "archive-cdx-attempt",
    level: "L3_ARCHIVE",
    scope: "Super-Famicom JP tables and atwiki conflict pages",
    result: "ENDPOINT_SSL_UNAVAILABLE_AND_SEARCH_UNINDEXED",
    disposition: "archive取得失敗を証拠取得成功に数えず、現行bodyの独立性を昇格しない"
  }
];

function evidenceClass(entry) {
  if (entry.auditDisposition === "JP_INDEPENDENT_MULTI_SOURCE") return "B_JP_INDEPENDENT_MULTI_SOURCE";
  if (entry.auditDisposition === "CONFLICT") return "D_CONFLICT";
  if (entry.auditDisposition === "JP_SINGLE_SOURCE") return "C_JP_SINGLE_SOURCE";
  if (entry.auditDisposition === "DEPENDENT_CORROBORATION_ONLY") return "D_DEPENDENT_CORROBORATION_ONLY";
  return "D_UNKNOWN";
}

function riskProfile(entry) {
  const scores = {
    availabilityImpact: 0,
    sellDecisionImpact: 0,
    museumImpact: 0,
    recommendationImpact: 0,
    calendarImpact: 0,
    reversibility: 0,
    errorSeverity: 0
  };
  if (entry.field === "availability") Object.assign(scores, {
    availabilityImpact: 3, recommendationImpact: 3, calendarImpact: 3, reversibility: 1, errorSeverity: 3
  });
  if (entry.field === "location") Object.assign(scores, {
    availabilityImpact: 3, recommendationImpact: 2, calendarImpact: 1, reversibility: 1, errorSeverity: 3
  });
  if (entry.field === "sellPrice") Object.assign(scores, {
    sellDecisionImpact: 3, recommendationImpact: 2, reversibility: 2, errorSeverity: 3
  });
  if (entry.field === "forgedSellPrice") Object.assign(scores, {
    sellDecisionImpact: 3, museumImpact: 2, reversibility: 2, errorSeverity: 3
  });
  if (entry.field === "authenticity") Object.assign(scores, {
    sellDecisionImpact: 2, museumImpact: 3, reversibility: 2, errorSeverity: 3
  });
  if (entry.field === "acquisition") Object.assign(scores, {
    museumImpact: 3, recommendationImpact: 1, reversibility: 1, errorSeverity: 2
  });
  const score = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const level = entry.auditDisposition === "CONFLICT" || score >= 10 ? "Critical" : score >= 7 ? "High" : score >= 4 ? "Medium" : "Low";
  return { ...scores, score, level };
}

function physicalPlan(entry) {
  const conditions = entry.field === "availability" || entry.field === "location"
    ? "対象月日・時刻・天候・場所を固定し、境界前後を含む"
    : entry.field === "authenticity" || entry.field === "acquisition"
      ? "購入店・商品枠・鑑定/寄贈結果・catalog状態を記録"
      : "対象itemを取得し、たぬきち売却画面の提示値を記録";
  return {
    planId: `JP-HW-${entry.queueKey.replaceAll("/", "-")}`,
    cartridge: "Nintendo DS 日本版 ADMJ genuine cartridge; revision/game codeを撮影",
    clock: "DS本体日時とgame内日時を同一frameで記録",
    conditions,
    sampleSize: entry.field === "availability" || entry.field === "location" ? "境界ごとに最低30 spawn opportunities" : "独立saveまたは別cartridgeを含む最低2 observations",
    rng: "seed操作を証拠にせず、試行回数・失敗・reset有無を全記録",
    falsification: `canonical ${JSON.stringify(entry.currentValue)} と異なる観測が1件でも再現したらFAIL/CONFLICT`,
    evidence: "連続video、DS/soft identifiers、timestamped log、untrimmed screenshots、observer署名",
    status: "NOT_RUN"
  };
}

function nextAction(entry) {
  if (entry.auditDisposition === "CONFLICT") {
    return `${entry.discrepancyIds.join(",")}を直接判別する日本版攻略本該当ページ、合法なADMJ game-data再現、または${physicalPlan(entry).planId}を実行`;
  }
  if (entry.field === "availability" || entry.field === "location") {
    return `${physicalPlan(entry).planId}で月日・時刻・場所の境界を日本版実機再現し、raw logをclaimへ追加`;
  }
  if (entry.domain === "art") {
    return `${physicalPlan(entry).planId}で購入元・真贋・寄贈・売値を日本版実機記録し、作品単位で検証`;
  }
  return `対象fieldを掲載する4攻略本の該当ページを版・ISBN付きで比較し、独立JP観測または${physicalPlan(entry).planId}で補強`;
}

function escalationLadder(entry, qualified) {
  return [
    { level: "L1", status: "COMPLETE", result: `${entry.sourceClaimIds.length} current claims re-audited; status=${entry.statusAfter}` },
    { level: "L2", status: qualified ? "SATISFIED" : "COMPLETE_NO_PROMOTION", result: qualified ? "audited independent JP pair exists" : "new JP web/official scope research produced no new field-level A/B evidence" },
    { level: "L3", status: qualified ? "NOT_REQUIRED" : "ATTEMPTED_BLOCKED", result: qualified ? "strong route already satisfied" : "archive CDX unavailable and indexed archive search empty; no archive evidence claimed" },
    { level: "L4", status: qualified ? "NOT_REQUIRED" : "GUIDEBOOK_DERIVED_UNCONFIRMED", result: "four JP guidebooks identified; content/page lineage not inspected" },
    { level: "L5", status: qualified ? "NOT_REQUIRED" : "NO_REPRODUCIBLE_JP_FIELD_DATA", result: "public save/modding research does not expose this critical field with ADMJ provenance" },
    { level: "L6", status: qualified ? "NOT_REQUIRED" : "PLAN_GENERATED_NOT_RUN", result: physicalPlan(entry).planId },
    { level: "L7", status: qualified ? "RESOLVED_STRONG_EVIDENCE" : "UNRESOLVED_EXPLICIT", result: qualified ? "B evidence retained" : nextAction(entry) }
  ];
}

export function buildEvidenceSufficiencyReport() {
  const warRoom = buildWarRoomAudit();
  const fieldDispositions = warRoom.fieldQueue.map((entry) => {
    const evidenceSufficiencyClass = evidenceClass(entry);
    const definitiveClaimAllowed = evidenceSufficiencyClass.startsWith("A_") || evidenceSufficiencyClass.startsWith("B_");
    const releaseBlockerBefore = entry.auditDisposition !== "JP_INDEPENDENT_MULTI_SOURCE";
    const releaseBlockerAfter = !definitiveClaimAllowed;
    const userRisk = riskProfile(entry);
    return {
      queuePosition: entry.queuePosition,
      queueKey: entry.queueKey,
      entityId: entry.entityId,
      japaneseName: entry.japaneseName,
      domain: entry.domain,
      field: entry.field,
      currentCanonicalValue: entry.currentValue,
      currentStatus: entry.statusAfter,
      confidence: entry.confidence,
      region: entry.region,
      sourceClaimIds: entry.sourceClaimIds,
      sourceIds: entry.sourceIds,
      discrepancyIds: entry.discrepancyIds,
      evidenceSufficiencyClass,
      evidenceRoutesQualified: evidenceSufficiencyClass === "B_JP_INDEPENDENT_MULTI_SOURCE" ? ["C_TWO_INDEPENDENT_JP_SOURCES"] : [],
      evidenceRationale: definitiveClaimAllowed
        ? "同値を支持するJP適用可能な監査済み独立資料2件をfield単位で確認済み"
        : evidenceSufficiencyClass === "D_CONFLICT"
          ? "正規化後もsource claimsが不一致。公式/game-data/hardwareによる裁定なし"
          : evidenceSufficiencyClass === "C_JP_SINGLE_SOURCE"
            ? "JP claimは存在するが、独立性を証明した補強、公式field表、再現可能game-data/hardwareがない"
            : "cross-region/dependent sourceのみで、JP同値と上流独立性が未証明",
      definitiveClaimAllowed,
      uiSafetyDisposition: definitiveClaimAllowed ? "DEFINITIVE_ALLOWED" : evidenceSufficiencyClass === "D_CONFLICT" ? "CONFLICT_REQUIRED" : "CONDITIONAL_OR_SOURCE_LIMIT_REQUIRED",
      userRisk,
      releaseBlockerBefore,
      releaseBlockerAfter,
      blockerRationale: releaseBlockerAfter
        ? `${evidenceSufficiencyClass} / User Risk ${userRisk.level}; current exact canonical assertion lacks an A/B evidence route`
        : null,
      blockerRemovalRationale: releaseBlockerBefore && !releaseBlockerAfter ? "STRONG_EVIDENCE_ROUTE_DOCUMENTED" : null,
      escalationLadder: escalationLadder(entry, definitiveClaimAllowed),
      physicalHardwarePlan: definitiveClaimAllowed ? null : physicalPlan(entry),
      nextExactAction: definitiveClaimAllowed ? "No blocker action; retain claim lineage and regression coverage" : nextAction(entry),
      canonicalChanged: false,
      auditedAt: AUDITED_AT
    };
  });
  const byEvidenceClass = Object.fromEntries([...new Set(fieldDispositions.map((entry) => entry.evidenceSufficiencyClass))]
    .sort().map((value) => [value, fieldDispositions.filter((entry) => entry.evidenceSufficiencyClass === value).length]));
  const releaseBlockersAfter = fieldDispositions.filter((entry) => entry.releaseBlockerAfter).length;
  const blockersRemoved = fieldDispositions.filter((entry) => entry.releaseBlockerBefore && !entry.releaseBlockerAfter);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    dataVersion,
    policy: {
      strongClasses: ["A_OFFICIAL_JP_PRIMARY", "A_GAME_DATA_JP_VERIFIED", "A_HARDWARE_JP_REPRODUCED", "B_JP_INDEPENDENT_MULTI_SOURCE", "B_JP_PLUS_GAME_DATA", "B_JP_PLUS_HARDWARE", "B_CROSS_REGION_PLUS_JP_CONFIRMATION"],
      rule: "Blocker removal requires field-level written evidence rationale; reclassification cannot substitute for evidence.",
      jpIndependentTwoSourceIsOnlyRoute: false,
      standardsWeakened: false
    },
    researchEscalation,
    summary: {
      totalCriticalFields: fieldDispositions.length,
      fieldsReAudited: fieldDispositions.length,
      releaseBlockersBefore: warRoom.releaseBlockingFieldQueue.length,
      releaseBlockersAfter,
      blockersRemovedWithWrittenRationale: blockersRemoved.length,
      byEvidenceClass,
      byUserRisk: Object.fromEntries(["Critical", "High", "Medium", "Low"].map((level) => [level, fieldDispositions.filter((entry) => entry.userRisk.level === level).length])),
      canonicalChanges: canonicalChanges.length,
      dataVersionChanged: false,
      releaseInterpretation: releaseBlockersAfter === 0 ? "DATA_EVIDENCE_GATE_CANDIDATE" : "DATA_EVIDENCE_INCOMPLETE"
    },
    fieldDispositions
  };
}
